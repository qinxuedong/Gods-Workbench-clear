# -*- coding: utf-8 -*-
"""Phase 9G：真实第三方 OP（panva/oidc-provider）互操作契约测试。

与 ``test_phase9d_oidc_login_flow.py`` 的区别在于 **对端不是自研测试桩**：
本用例启动 npm 生态的第三方 OpenID Provider 实现 ``oidc-provider``，
按它真实的 discovery / JWKS / 授权 / 交互 / 令牌语义完成一次授权码 + PKCE 登录，
从而验证本仓实现能对接「非本仓写的」IdP（互操作，而非自洽）。

运行前提（缺任一项即 ``skip``，不影响默认 CI）：

- 本机可执行 ``node``；
- 能解析到 ``oidc-provider`` 包。可用 ``GW_OIDC_PROVIDER_MODULE_DIR``
  指向包含 ``node_modules/oidc-provider`` 的目录，或在运行环境里直接
  ``npm install oidc-provider``。

启动方式（示例）：

    set GW_OIDC_PROVIDER_MODULE_DIR=%TEMP%\\gw-idp-node
    python -m pytest -q tests/contracts/test_phase9g_real_op_interop.py

证据边界：本用例验证**第三方 OP 软件**的互操作，不等于接入任何真实生产
IdP（无真实 client_id / 用户目录 / TLS / 撤销策略），也不构成发布授权。
"""

from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SRC_PATH = REPO_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

CLIENT_ID = "gw-interop-client"
ACCOUNT_ID = "interop-user"
GROUPS = "gw-editor"

# 文档（CLEANROOM-STATUS / TASK-NOTES / TASKS / P9-ACCEPTANCE-AUDIT）声称对端为 9.12.2。
# 必须显式断言，否则本机 `npm install oidc-provider` 解析出的版本可能静默漂移，
# 让「已验证 9.12.2」这一结论失去事实基础。
EXPECTED_OIDC_PROVIDER_VERSION = "9.12.2"
GW_OIDC_PROVIDER_VERSION_ENV = "GW_OIDC_PROVIDER_VERSION"

# 第三方 OP 桩：直接使用 oidc-provider 的真实路由与交互语义（纯 ASCII 源码）。
_OP_SOURCE = r"""
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const providerModule = require('oidc-provider');
const Provider = providerModule.default || providerModule.Provider || providerModule;

const port = Number(process.argv[2]);
const redirectUri = process.argv[3];
const clientId = process.argv[4];
const accountId = process.argv[5];
const groups = process.argv[6].split(',');
const issuer = `http://127.0.0.1:${port}`;

const provider = new Provider(issuer, {
  clients: [{
    client_id: clientId,
    redirect_uris: [redirectUri],
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    id_token_signed_response_alg: 'RS256',
  }],
  pkce: { required: () => true, methods: ['S256'] },
  features: { devInteractions: { enabled: false } },
  claims: { openid: ['sub', 'groups'] },
  scopes: ['openid', 'profile', 'email'],
  findAccount: (ctx, id) => ({
    accountId: id,
    async claims() { return { sub: id, groups }; },
  }),
  cookies: { keys: ['gw-interop-fixture-key-not-a-secret-000000'] },
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, issuer);
  if (url.pathname.startsWith('/interaction/')) {
    try {
      if (req.method === 'POST') {
        const details = await provider.interactionDetails(req, res);
        const result = { login: { accountId } };
        if (details.prompt && details.prompt.name === 'consent') {
          const grant = new provider.Grant({ accountId, clientId });
          grant.addOIDCScope(details.params.scope || 'openid');
          grant.addOIDCClaims(['sub', 'groups']);
          result.consent = { grantId: await grant.save() };
        }
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><html><body></body></html>');
      return;
    } catch (err) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('interaction error: ' + err.message);
      return;
    }
  }
  return provider.callback()(req, res);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(JSON.stringify({ ready: true, issuer }) + '\n');
});
"""


def _free_port() -> int:
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def _provider_dir() -> Path | None:
    """定位可解析 ``oidc-provider`` 的 node 模块目录。"""
    candidates = []
    configured = os.environ.get("GW_OIDC_PROVIDER_MODULE_DIR", "").strip()
    if configured:
        candidates.append(Path(configured))
    candidates.append(REPO_ROOT)
    for base in candidates:
        if (base / "node_modules" / "oidc-provider" / "package.json").is_file():
            return base
    return None


@pytest.fixture(scope="module")
def real_op():
    """启动真实第三方 OP；缺少 node 或 oidc-provider 时跳过。"""
    if shutil.which("node") is None:
        pytest.skip("未安装 node，跳过第三方 OP 互操作用例")
    base = _provider_dir()
    if base is None:
        pytest.skip("未找到 oidc-provider 包（可设置 GW_OIDC_PROVIDER_MODULE_DIR）")

    import requests  # 延迟导入：缺依赖时按 skip 处理
    import uvicorn

    workdir = Path(tempfile.mkdtemp(prefix="gw-real-op-"))
    script = workdir / "real_op.mjs"
    script.write_text(_OP_SOURCE, encoding="utf-8")

    app_port = _free_port()
    app_base = f"http://127.0.0.1:{app_port}"
    redirect_uri = app_base + "/api/asset-auth/callback"

    op_port = _free_port()
    env = dict(os.environ)
    env["NODE_PATH"] = str(base / "node_modules")
    proc = subprocess.Popen(
        ["node", str(script), str(op_port), redirect_uri, CLIENT_ID, ACCOUNT_ID, GROUPS],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
    )
    line = proc.stdout.readline() if proc.stdout else ""
    if not line.strip():
        proc.kill()
        stderr = proc.stderr.read() if proc.stderr else ""
        # 已经显式安装了第三方 OP，启动失败属真实故障，不得静默跳过。
        pytest.fail(f"第三方 OP 启动失败：{stderr[:600]}")

    # 读取第三方 OP 的真实版本，并对外声明；显式配置的版本必须与文档一致。
    provider_pkg = json.loads((base / "node_modules" / "oidc-provider" / "package.json").read_text(encoding="utf-8"))
    provider_version = str(provider_pkg.get("version") or "").strip()
    declared = os.environ.get(GW_OIDC_PROVIDER_VERSION_ENV, "").strip() or EXPECTED_OIDC_PROVIDER_VERSION
    if provider_version != declared:
        proc.kill()
        pytest.fail(
            f"第三方 OP 版本与文档声明不符：期望 {declared}，实际 {provider_version}。请安装 oidc-provider@{declared} 后再跑本用例，或修正文档声明。"
        )
    info = json.loads(line)
    issuer = info["issuer"]

    # 连接真实 OP 必须临时设置 GW_OIDC_*；同时保存原始快照，测试结束后逐字还原，
    # 否则会污染同进程内的其他用例（真实缺陷：全量运行曾因此出现 3 个失败）。
    original_env = {key: value for key, value in os.environ.items() if key.startswith("GW_")}
    for key in list(os.environ):
        if key.startswith("GW_"):
            del os.environ[key]
    os.environ.update(
        {
            "GW_AUTH_MODE": "oidc",
            "GW_OIDC_ISSUER": issuer,
            "GW_OIDC_AUDIENCE": CLIENT_ID,
            "GW_OIDC_CLIENT_ID": CLIENT_ID,
            "GW_OIDC_REDIRECT_URI": redirect_uri,
            "GW_OIDC_GROUPS_CLAIM": "groups",
        }
    )
    from gods_workbench.core import config as gw_config

    gw_config.reset_runtime_auth_config_cache()
    gw_config.reset_discovery_cache()

    from gods_workbench.api.app import create_app

    server = uvicorn.Server(uvicorn.Config(create_app(), host="127.0.0.1", port=app_port, log_level="error"))
    threading.Thread(target=server.run, daemon=True).start()
    deadline = time.time() + 20
    while time.time() < deadline:
        try:
            requests.get(app_base + "/healthz", timeout=0.5)
            break
        except Exception:
            time.sleep(0.1)
    else:
        proc.kill()
        pytest.fail("被测应用未能启动")

    try:
        yield {
            "issuer": issuer,
            "app_base": app_base,
            "redirect_uri": redirect_uri,
            "provider_version": provider_version,
            "requests": requests,
        }
    finally:
        server.should_exit = True
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        for key in list(os.environ):
            if key.startswith("GW_"):
                del os.environ[key]
        os.environ.update(original_env)
        gw_config.reset_runtime_auth_config_cache()
        gw_config.reset_discovery_cache()
        shutil.rmtree(workdir, ignore_errors=True)


def _drive_authorization(session, issuer: str, auth_url: str, redirect_uri: str) -> str:
    """按浏览器语义走完第三方 OP 的交互链，返回带 code+state 的回调 URL。"""
    response = session.get(auth_url, timeout=10, allow_redirects=False)
    assert response.status_code == 303, (response.status_code, response.text[:300])
    current = urljoin(issuer, response.headers["location"])
    method = "POST"
    for _ in range(12):
        if method == "GET":
            response = session.get(current, timeout=10, allow_redirects=False)
        else:
            response = session.post(current, timeout=10, allow_redirects=False, data={})
        assert response.status_code == 303, (response.status_code, response.text[:300])
        location = urljoin(issuer, response.headers["location"])
        if location.startswith(redirect_uri):
            return location
        current = location
        method = "POST" if "/interaction/" in urlparse(location).path else "GET"
    raise AssertionError("第三方 OP 授权流程未回到 redirect_uri")


def test_real_third_party_op_end_to_end_login(real_op):
    """真实第三方 OP：完整授权码 + PKCE 登录 → 会话 → 角色来自 IdP 组声明。"""
    requests = real_op["requests"]
    session = requests.Session()

    status_before = session.get(real_op["app_base"] + "/api/asset-auth/status", timeout=5).json()
    assert status_before["authenticated"] is False

    login = session.post(real_op["app_base"] + "/api/asset-auth/login", timeout=10)
    assert login.status_code == 200, login.text
    authorization_url = login.json()["authorization_url"]
    params = parse_qs(urlparse(authorization_url).query)
    assert params["response_type"] == ["code"]
    assert params["code_challenge_method"] == ["S256"]
    assert params["client_id"] == [CLIENT_ID]

    callback = _drive_authorization(session, real_op["issuer"], authorization_url, real_op["redirect_uri"])
    callback_query = parse_qs(urlparse(callback).query)
    assert callback_query.get("code"), callback
    assert callback_query.get("state"), callback

    finished = session.get(callback, timeout=15, allow_redirects=False)
    assert finished.status_code == 302, finished.text
    assert "auth_error" not in (finished.headers.get("location") or "")
    assert "gw_session" in session.cookies

    status_after = session.get(real_op["app_base"] + "/api/asset-auth/status", timeout=5).json()
    assert status_after["authenticated"] is True, status_after
    # 角色只能来自 IdP 的 groups 声明，不得来自任何请求头。
    assert status_after["principal"]["role"] == "editor", status_after


def test_real_third_party_op_rejects_tampered_pkce(real_op):
    """篡改 code_verifier 后，第三方 OP 必须拒绝换码，本仓必须失败关闭（不建会话）。"""
    from gods_workbench.core import session as session_store

    requests = real_op["requests"]
    session = requests.Session()
    login = session.post(real_op["app_base"] + "/api/asset-auth/login", timeout=10).json()
    callback = _drive_authorization(session, real_op["issuer"], login["authorization_url"], real_op["redirect_uri"])
    state = parse_qs(urlparse(callback).query)["state"][0]
    flow = session_store.pop_flow_state(state)
    assert flow is not None
    session_store.create_flow_state(
        state=state,
        nonce=flow.nonce,
        code_verifier="A" * 64,
        redirect_uri=flow.redirect_uri,
    )

    response = session.get(callback, timeout=15, allow_redirects=False)
    assert response.status_code == 302
    auth_error = parse_qs(urlparse(response.headers.get("location") or "").query).get("auth_error")
    assert auth_error == ["token_exchange_failed"], auth_error
    assert "gw_session" not in session.cookies


def test_real_third_party_op_rejects_wrong_nonce(real_op):
    """nonce 不符时：第三方 OP 签发的合法 id_token 也必须被本仓拒绝。"""
    from gods_workbench.core import session as session_store

    requests = real_op["requests"]
    session = requests.Session()
    login = session.post(real_op["app_base"] + "/api/asset-auth/login", timeout=10).json()
    callback = _drive_authorization(session, real_op["issuer"], login["authorization_url"], real_op["redirect_uri"])
    state = parse_qs(urlparse(callback).query)["state"][0]
    flow = session_store.pop_flow_state(state)
    assert flow is not None
    session_store.create_flow_state(
        state=state,
        nonce="not-the-issued-nonce",
        code_verifier=flow.code_verifier,
        redirect_uri=flow.redirect_uri,
    )

    response = session.get(callback, timeout=15, allow_redirects=False)
    assert response.status_code == 302
    auth_error = parse_qs(urlparse(response.headers.get("location") or "").query).get("auth_error")
    assert auth_error == ["id_token_rejected"], auth_error
    assert "gw_session" not in session.cookies