#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 12 本地账户认证浏览器门禁。"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import os
import secrets
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parents[1]
SMOKE_PATH = REPO_ROOT / "tools" / "frontend_e2e_smoke.py"
AUTH_STATUS_PATH = "/api/asset-auth/status"
HEALTH_PATH = "/api/observability/health"
BUSINESS_PATH = "/api/observability/tasks?range=all&limit=1"
SAFE_ENV_KEYS = frozenset({
    "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP",
    "LOCALAPPDATA", "APPDATA", "USERPROFILE", "HOMEDRIVE", "HOMEPATH",
    # NVIDIA NVML 在 Windows 通过系统程序目录定位驱动；保留目录不等于继承 Provider 配置。
    "PROGRAMFILES", "PROGRAMW6432",
})


def load_smoke_module():
    spec = importlib.util.spec_from_file_location("gw_phase12_smoke", SMOKE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("无法加载现有浏览器冒烟脚本")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def choose_artifacts_dir(raw: str | None) -> Path:
    if raw:
        requested = Path(raw).expanduser().resolve()
        if requested == REPO_ROOT or REPO_ROOT in requested.parents:
            raise ValueError("截图与 JSON 产物必须位于仓库之外")
        requested.mkdir(parents=True, exist_ok=True)
        if any(requested.iterdir()):
            requested = requested / ("authenticated-" + secrets.token_hex(4))
    else:
        requested = Path(tempfile.mkdtemp(prefix="gw-phase12-auth-browser-"))
    requested.mkdir(parents=True, exist_ok=True)
    resolved = requested.resolve()
    if resolved == REPO_ROOT or REPO_ROOT in resolved.parents:
        raise ValueError("截图与 JSON 产物必须位于仓库之外")
    return resolved


def isolated_server_environment(source: dict[str, str], port: int, runtime_dir: Path) -> dict[str, str]:
    """只继承启动 Python/Windows 所需环境，丢弃用户配置、凭据和所有 GW_* 覆盖。"""
    env = {key: value for key, value in source.items() if key.upper() in SAFE_ENV_KEYS}
    env.update({
        "GW_AUTH_MODE": "local_account",
        "GW_HOST": "127.0.0.1",
        "GW_PORT": str(port),
        "GW_RELOAD": "false",
        "GW_CLI_EXECUTION": "0",
        "GW_LOCAL_AUTH_DB": str((runtime_dir / "auth.sqlite3").resolve()),
        "GW_DATA_DIR": str((runtime_dir / "data").resolve()),
        "GW_ALLOWED_ROOTS": "",
        "PYTHONUTF8": "1",
    })
    return env


def choose_ephemeral_port() -> int:
    for _ in range(8):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            port = int(sock.getsockname()[1])
        if port != 2077:
            return port
    raise RuntimeError("无法选出不触碰默认 2077 的临时端口")


def summarize_gpu(payload: object) -> dict:
    if not isinstance(payload, dict):
        return {"state": "invalid", "status": "missing_payload"}
    checks = payload.get("checks")
    check = next((item for item in checks if isinstance(item, dict) and item.get("name") == "gpu_telemetry"), None) if isinstance(checks, list) else None
    if not isinstance(check, dict):
        return {"state": "invalid", "status": "missing_check"}
    status = str(check.get("status") or "unknown")
    if status == "ok":
        metrics = check.get("metrics")
        if not isinstance(metrics, dict):
            return {"state": "invalid", "status": "ok_without_metrics"}
        util = _finite_percent(metrics.get("gpu_utilization_percent"))
        memory = _finite_percent(metrics.get("gpu_memory_percent"))
        try:
            count = int(metrics.get("gpu_count"))
        except (TypeError, ValueError):
            count = 0
        if util is None or memory is None or count < 1:
            return {"state": "invalid", "status": "ok_without_real_values"}
        return {
            "state": "real",
            "status": "ok",
            "source": "nvidia-smi",
            "device_count": count,
            "gpu_utilization_percent": util,
            "gpu_memory_percent": memory,
        }
    if status in {"not_integrated", "service_unavailable"}:
        return {"state": "unavailable", "status": status}
    return {"state": "invalid", "status": status}


def _finite_percent(value: object) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) and 0 <= number <= 100 else None


def create_authenticated_context_factory(base_url: str, token: str, api_events: list[dict], phase: list[str]):
    """为每个 E2E context 注入只驻内存的 HttpOnly 会话 Cookie，并记脱敏 API 证据。"""
    origin = urlsplit(base_url)
    if not token:
        raise ValueError("缺少内存中的本地账户会话")
    seen_pages: set[int] = set()

    def observe_page(page):
        identity = id(page)
        if identity in seen_pages:
            return
        seen_pages.add(identity)

        def observe_response(response):
            parsed = urlsplit(response.url)
            if parsed.netloc != origin.netloc or not parsed.path.startswith("/api/"):
                return
            row = {
                "phase": phase[0],
                "page": Path(urlsplit(page.url).path).name or "unknown",
                "method": response.request.method,
                "path": parsed.path,
                "status": int(response.status),
            }
            if parsed.path == AUTH_STATUS_PATH and response.status == 200:
                try:
                    body = response.json()
                    row["authenticated"] = body.get("authenticated") is True
                except Exception:
                    row["authenticated"] = False
            if parsed.path == HEALTH_PATH and response.status == 200:
                try:
                    row["gpu"] = summarize_gpu(response.json())
                except Exception:
                    row["gpu"] = {"state": "invalid", "status": "unreadable_payload"}
            api_events.append(row)

        page.on("response", observe_response)

    def factory(browser, **kwargs):
        context = browser.new_context(**kwargs)
        context.add_cookies([{
            "name": "gw_session",
            "value": token,
            "url": f"{origin.scheme}://{origin.netloc}/",
            "httpOnly": True,
            "secure": origin.scheme == "https",
            "sameSite": "Strict",
        }])

        def block_external(route):
            requested = urlsplit(route.request.url)
            if requested.scheme in {"http", "https"} and requested.netloc == origin.netloc:
                route.continue_()
            else:
                route.abort()

        context.route("**/*", block_external)
        context.on("page", observe_page)
        for page in context.pages:
            observe_page(page)
        return context

    return factory


def _launch_browser(smoke, playwright):
    chrome = smoke.find_chrome()
    launch_kwargs = {"executable_path": chrome} if chrome else {}
    return playwright.chromium.launch(**launch_kwargs)


def create_local_account_and_login(base_url: str, smoke) -> tuple[str, dict]:
    """通过真实本地账户 UI 完成首设、登出与密码登录；Cookie 只返回内存。"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("缺少 Playwright，无法执行认证浏览器门禁") from exc

    password = "Pw9" + secrets.token_urlsafe(24)
    username = "phase12_" + secrets.token_hex(6)
    browser = None
    context = None
    token = ""
    completed = False
    auth = {"setup_http_status": None, "login_http_status": None, "principal_role": None,
            "cookie_http_only": False, "cookie_hidden_from_document": False,
            "browser_storage_state_written": False, "logout_http_status": None}
    with sync_playwright() as playwright:
        browser = _launch_browser(smoke, playwright)
        context = browser.new_context()
        origin = urlsplit(base_url)

        def block_external(route):
            requested = urlsplit(route.request.url)
            if requested.scheme in {"http", "https"} and requested.netloc == origin.netloc:
                route.continue_()
            else:
                route.abort()

        context.route("**/*", block_external)
        page = context.new_page()
        try:
            page.goto(base_url + "/static/v2/projects.html", wait_until="networkidle", timeout=60000)
            page.wait_for_selector("#localUsername", state="visible", timeout=20000)
            page.fill("#localUsername", username)
            page.fill("#localPassword", password)
            page.fill("#localPasswordConfirm", password)
            with page.expect_response(lambda r: urlsplit(r.url).path == "/api/asset-auth/local/setup") as setup_info:
                page.get_by_role("button", name="创建管理员并登录").click()
            auth["setup_http_status"] = int(setup_info.value.status)
            if auth["setup_http_status"] != 201:
                raise RuntimeError("本地账户首次设置未返回 201")
            page.wait_for_function("window.HardwareDeck?.authState?.loaded === true && window.HardwareDeck?.authState?.authenticated === true", timeout=20000)

            logout_status = page.evaluate("""async () => (await fetch('/api/asset-auth/logout', {
              method: 'POST', credentials: 'same-origin'
            })).status""")
            auth["logout_http_status"] = int(logout_status)
            if logout_status != 204:
                raise RuntimeError("首次设置后的真实登出未返回 204")
            page.reload(wait_until="networkidle")
            page.wait_for_function("window.HardwareDeck?.authState?.loaded === true && window.HardwareDeck?.authState?.authenticated === false", timeout=20000)
            if page.locator("#localUsername").count() == 0:
                page.locator(".hw-avatar-keycap").first.click()
            page.wait_for_selector("#localUsername", state="visible", timeout=20000)
            page.fill("#localUsername", username)
            page.fill("#localPassword", password)
            with page.expect_response(lambda r: urlsplit(r.url).path == "/api/asset-auth/local/login") as login_info:
                page.get_by_role("button", name="登录", exact=True).click()
            auth["login_http_status"] = int(login_info.value.status)
            if auth["login_http_status"] != 200:
                raise RuntimeError("本地账户密码登录未返回 200")
            page.wait_for_function("window.HardwareDeck?.authState?.loaded === true && window.HardwareDeck?.authState?.authenticated === true", timeout=20000)
            auth["principal_role"] = page.evaluate("window.HardwareDeck.authState.principal?.role || null")
            cookie = next((item for item in context.cookies(base_url) if item.get("name") == "gw_session"), None)
            if not cookie or not cookie.get("value"):
                raise RuntimeError("本地登录未建立会话 Cookie")
            token = str(cookie["value"])
            auth["cookie_http_only"] = bool(cookie.get("httpOnly"))
            auth["cookie_hidden_from_document"] = "gw_session" not in page.evaluate("document.cookie")
            if auth["principal_role"] != "admin" or not auth["cookie_http_only"] or not auth["cookie_hidden_from_document"]:
                raise RuntimeError("本地会话角色或 HttpOnly Cookie 属性不符合预期")
            completed = True
        finally:
            if not completed and page is not None:
                try:
                    page.evaluate("async () => (await fetch('/api/asset-auth/logout', {method:'POST', credentials:'same-origin'})).status")
                except Exception:
                    pass
            browser.close()
    return token, auth


def verify_authenticated_pages(base_url: str, smoke, context_factory, artifacts_dir: Path, phase: list[str]) -> list[dict]:
    """逐页验证登录状态、受保护业务 API、GPU 真值/降级及渲染期页面状态。"""
    from playwright.sync_api import sync_playwright

    results = []
    phase[0] = "authenticated_page_probe"
    with sync_playwright() as playwright:
        browser = _launch_browser(smoke, playwright)
        try:
            for page_name in smoke.PAGES:
                context = context_factory(browser, viewport={"width": 1600, "height": 1000})
                page = context.new_page()
                errors = []
                observed_gpu_checks = []

                def capture_gpu_response(response):
                    # 同一采样对应同一UI；不能拿稍后变化的GPU利用率误判此前正确读数。
                    if urlsplit(response.url).path != HEALTH_PATH or response.status != 200:
                        return
                    try:
                        checks = response.json().get("checks", [])
                        observed_gpu_checks.extend(item for item in checks if isinstance(item, dict)
                                                   and item.get("name") == "gpu_telemetry")
                    except Exception:
                        return

                page.on("response", capture_gpu_response)
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    page.goto(base_url + "/static/v2/" + page_name, wait_until="networkidle", timeout=60000)
                    page.wait_for_function("window.HardwareDeck?.authState?.loaded === true", timeout=20000)
                    page.wait_for_function("""() => {
                      const state = window.HardwareDeck?.authState;
                      const util = document.querySelector('[data-gw-gpu-util]');
                      const vram = document.querySelector('[data-gw-gpu-vram]');
                      return state?.authenticated === true && window.HardwareDeck?.lastGpuCheck
                        && util && vram && util.textContent.trim() !== '读取中…'
                        && vram.textContent.trim() !== '读取中…';
                    }""", timeout=20000)
                    data = page.evaluate("""async () => {
                      const read = async (path) => {
                        const response = await fetch(path, {credentials:'same-origin', cache:'no-store'});
                        const body = await response.json().catch(() => null);
                        return {status: response.status, body};
                      };
                      const auth = await read('/api/asset-auth/status');
                      const business = await read('/api/observability/tasks?range=all&limit=1');
                      const health = await read('/api/observability/health');
                      const ui = (selector) => {
                        const node = document.querySelector(selector);
                        return node ? {text: node.textContent.trim(), degradation: node.getAttribute('data-gw-degradation')} : null;
                      };
                      const state = window.HardwareDeck?.authState;
                      return {
                        auth: {status: auth.status, authenticated: auth.body?.authenticated === true,
                          role: state?.principal?.role || null},
                        business: {status: business.status, valid_payload: Boolean(business.body &&
                          Array.isArray(business.body.items) && typeof business.body.data_status === 'string')},
                        health: {status: health.status, gpu: health.body},
                        rendered_gpu_check: window.HardwareDeck?.lastGpuCheck || null,
                        gpu_ui: {utilization: ui('[data-gw-gpu-util]'), memory: ui('[data-gw-gpu-vram]')}
                      };
                    }""")
                    api_gpu = summarize_gpu(data.get("health", {}).get("gpu"))
                    rendered_check = data.get("rendered_gpu_check")
                    observed = rendered_check is not None and rendered_check in observed_gpu_checks
                    gpu = summarize_gpu({"checks": [rendered_check]})
                    ui = data.get("gpu_ui") or {}
                    util_ui = ui.get("utilization") or {}
                    memory_ui = ui.get("memory") or {}
                    if gpu.get("state") == "real":
                        expected_util = f"{int(math.floor(gpu['gpu_utilization_percent'] + 0.5))}%"
                        expected_memory = f"{int(math.floor(gpu['gpu_memory_percent'] + 0.5))}%"
                        ui_valid = (
                            util_ui.get("text") == expected_util
                            and memory_ui.get("text") == expected_memory
                            and not util_ui.get("degradation")
                            and not memory_ui.get("degradation")
                        )
                    elif gpu.get("state") == "unavailable":
                        expected = "暂不可用" if gpu.get("status") == "service_unavailable" else "未接入"
                        ui_valid = (
                            util_ui.get("text") == expected
                            and memory_ui.get("text") == expected
                            and util_ui.get("degradation") == gpu.get("status")
                            and memory_ui.get("degradation") == gpu.get("status")
                        )
                    else:
                        ui_valid = False
                    ui_valid = ui_valid and observed and api_gpu.get("state") != "invalid"
                    screenshot = artifacts_dir / f"authenticated-v2-{page_name.removesuffix('.html')}.png"
                    page.screenshot(path=str(screenshot), full_page=False)
                    results.append({
                        "page": page_name,
                        "auth_http_status": data.get("auth", {}).get("status"),
                        "authenticated": data.get("auth", {}).get("authenticated") is True,
                        "principal_role": data.get("auth", {}).get("role"),
                        "business_api_path": BUSINESS_PATH.split("?", 1)[0],
                        "business_api_http_status": data.get("business", {}).get("status"),
                        "business_api_payload_valid": data.get("business", {}).get("valid_payload") is True,
                        "gpu_health_http_status": data.get("health", {}).get("status"),
                        "gpu": gpu,
                        "latest_api_gpu": api_gpu,
                        "rendered_gpu_sample_observed_from_http": observed,
                        "gpu_ui": {"utilization": util_ui, "memory": memory_ui, "matches_backend": ui_valid},
                        "page_errors": errors,
                        "screenshot": screenshot.name,
                    })
                except Exception as exc:
                    results.append({"page": page_name, "gate_error_type": type(exc).__name__, "page_errors": errors})
                finally:
                    context.close()
        finally:
            browser.close()
    phase[0] = "e2e"
    return results


def team_message_workflow_verified(result):
    """完成判定必须同时具备每项运行证据，不能只信任 passed 标签。"""
    return (result.get("passed") is True and result.get("seeded_messages") == 75
            and result.get("page_errors") == []
            and all(result.get(key) is True for key in (
                "history_after_incremental_verified", "ui_send_verified",
                "reload_readback_verified", "text_only_rendering_verified")))


def verify_team_message_workflow(base_url, smoke, context_factory, artifacts_dir, phase):
    """真实登录浏览器：身份绑定、历史分页、增量、发送、刷新读回及纯文本安全。"""
    from playwright.sync_api import sync_playwright

    phase[0] = "team_message_workflow"
    result = {"passed": False, "seeded_messages": 0, "page_errors": []}
    with sync_playwright() as playwright:
        browser = _launch_browser(smoke, playwright)
        try:
            context = context_factory(browser, viewport={"width": 1600, "height": 1000})
            page = context.new_page()
            page.on("pageerror", lambda error: result["page_errors"].append(type(error).__name__))
            page.goto(base_url + "/static/v2/collab.html", wait_until="networkidle")
            page.locator("#collabIdentityBind").wait_for(state="visible")
            with page.expect_response(lambda response: response.url.endswith("/api/asset-auth/identity-binding")
                                      and response.request.method == "POST") as binding:
                page.locator("#collabIdentityBind").click()
            assert binding.value.status in {200, 201}, "身份绑定未完成"
            seeded = page.evaluate("""async () => {
              const post = async (url, payload) => {
                const response = await fetch(url, {method:'POST',credentials:'same-origin',
                  headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
                if (!response.ok) throw new Error('团队浏览器夹具请求失败');
                return await response.json();
              };
              const body = await post('/api/asset-auth/teams', {name:'浏览器验收团队'});
              const teamId = body.team.team_id;
              for (let i=1;i<=75;i++) await post(`/api/asset-auth/teams/${teamId}/messages`,
                {text:`历史消息-${i}`,client_request_id:`browser-history-${i}`});
              return {team_id:teamId,count:75};
            }""")
            result["seeded_messages"] = seeded["count"]
            page.goto(base_url + "/static/v2/collab.html?team_id=" + seeded["team_id"], wait_until="networkidle")
            page.wait_for_function("document.querySelectorAll('#collabReviewFeed article').length === 50")
            with page.expect_response(lambda response: "/messages?" in response.url and "after_sequence=" in response.url,
                                      timeout=15000):
                pass
            page.wait_for_function("document.querySelectorAll('#collabReviewFeed article').length === 75")
            assert page.locator("#collabMessageHistoryMore").is_visible(), "增量轮询错误地清空历史游标"
            page.locator("#collabMessageHistoryMore").click()
            page.locator("#collabMessageHistoryMore").wait_for(state="hidden")
            assert page.locator("#collabReviewFeed article").count() == 75, "历史和增量出现重复"
            result["history_after_incremental_verified"] = True
            text = '浏览器真实发送 <img src=x onerror="window.__team_xss=1">'
            page.locator("#collabMessageInput").fill(text)
            with page.expect_response(lambda response: response.url.endswith("/messages") and response.request.method == "POST") as sent:
                page.locator("#collabMessageSend").click()
            assert sent.value.status == 201, "浏览器消息发送失败"
            page.wait_for_function("text => document.querySelector('#collabReviewFeed').textContent.includes(text)", arg=text)
            page.reload(wait_until="networkidle")
            # 首屏只加载50条，增量会带回最后发送的第76条。
            page.wait_for_function("text => document.querySelector('#collabReviewFeed').textContent.includes(text)", arg=text, timeout=15000)
            assert page.locator("#collabReviewFeed img").count() == 0
            assert page.evaluate("window.__team_xss === undefined")
            result.update({"ui_send_verified": True, "reload_readback_verified": True,
                           "text_only_rendering_verified": True,
                           "screenshot": "team-messages-workflow.png"})
            page.screenshot(path=str(artifacts_dir / result["screenshot"]), full_page=True)
            result["passed"] = not result["page_errors"]
            context.close()
        finally:
            browser.close()
    return result


def summarize_api_events(pages: tuple[str, ...], api_events: list[dict]) -> list[dict]:
    summaries = []
    for page_name in pages:
        rows = [row for row in api_events if row.get("page") == page_name]
        summaries.append({
            "page": page_name,
            "response_count": len(rows),
            "successful_paths": sorted({row.get("path") for row in rows if 200 <= row.get("status", 0) < 400}),
            "failures": [
                {"phase": row.get("phase"), "method": row.get("method"), "path": row.get("path"), "status": row.get("status")}
                for row in rows if row.get("status", 0) >= 400
            ],
            "authenticated_status_200": any(
                row.get("path") == AUTH_STATUS_PATH and row.get("status") == 200 and row.get("authenticated") is True
                for row in rows
            ),
            "gpu_health_200": any(row.get("path") == HEALTH_PATH and row.get("status") == 200 for row in rows),
        })
    return summaries


def validate_gate(pages: tuple[str, ...], e2e_result: dict, probes: list[dict], api_events: list[dict], mutation_failures: list) -> list[str]:
    failures = []
    by_page = {row.get("page"): row for row in probes if row.get("page")}
    e2e_by_page = {row.get("page"): row for row in e2e_result.get("pages", [])}
    for page_name in pages:
        row = by_page.get(page_name)
        if not row:
            failures.append(f"{page_name}: 缺少认证页面探针结果")
            continue
        if row.get("gate_error_type"):
            failures.append(f"{page_name}: 认证页面探针异常 {row['gate_error_type']}")
        if row.get("auth_http_status") != 200 or row.get("authenticated") is not True or row.get("principal_role") != "admin":
            failures.append(f"{page_name}: /api/asset-auth/status 未证明真实管理员会话 200")
        if row.get("business_api_http_status") != 200 or row.get("business_api_payload_valid") is not True:
            failures.append(f"{page_name}: 受保护业务 API 未返回有效 200")
        if row.get("gpu_health_http_status") != 200 or row.get("gpu", {}).get("state") not in {"real", "unavailable"}:
            failures.append(f"{page_name}: GPU API 未给出真实读数或明确降级")
        if row.get("gpu_ui", {}).get("matches_backend") is not True:
            failures.append(f"{page_name}: GPU 页面读数/降级状态与真实 API 不一致")
        if row.get("page_errors"):
            failures.append(f"{page_name}: 认证页面有未捕获 JS 异常")
        e2e_page = e2e_by_page.get(page_name)
        if not e2e_page:
            failures.append(f"{page_name}: 缺少现有 E2E 加载结果")
        elif e2e_page.get("page_errors") or e2e_page.get("static_asset_errors"):
            failures.append(f"{page_name}: 现有 E2E 发现页面异常或静态资源失败")
        events = [item for item in api_events if item.get("page") == page_name]
        if any(item.get("status") == 401 for item in events):
            failures.append(f"{page_name}: 仍有 API 返回 401（不得以白名单吞没）")
        if not any(item.get("path") == AUTH_STATUS_PATH and item.get("status") == 200 and item.get("authenticated") is True for item in events):
            failures.append(f"{page_name}: 浏览器 context 未观测到已认证 status API 200")
        if not any(item.get("path") == HEALTH_PATH and item.get("status") == 200 for item in events):
            failures.append(f"{page_name}: 浏览器 context 未观测到观测 API 200")
    if not mutation_failures:
        failures.append("顶栏变异自证未报失败，判定可能恒真")
    failures.extend(e2e_result.get("failures", []))
    return failures


def _wait_server(base_url: str, process: subprocess.Popen, timeout: float = 30.0) -> None:
    deadline = time.monotonic() + timeout
    last_error = None
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError("隔离测试服务启动前退出")
        try:
            with urlopen(base_url + "/healthz", timeout=0.5) as response:
                if response.status == 200:
                    return
        except (OSError, URLError) as exc:
            last_error = exc
        time.sleep(0.1)
    raise RuntimeError("隔离测试服务未就绪" + (f"（{type(last_error).__name__}）" if last_error else ""))


def _logout_and_count_sessions(base_url: str, token: str, db_path: Path) -> tuple[int | None, int | None]:
    logout_status = None
    try:
        request = Request(base_url + "/api/asset-auth/logout", method="POST",
                          headers={"Cookie": "gw_session=" + token,
                                   "Origin": base_url,
                                   "Referer": base_url + "/static/v2/projects.html"})
        with urlopen(request, timeout=5) as response:
            logout_status = int(response.status)
    except Exception:
        return logout_status, None
    try:
        with sqlite3.connect(db_path) as connection:
            count = int(connection.execute("SELECT COUNT(*) FROM local_sessions").fetchone()[0])
        return logout_status, count
    except Exception:
        return logout_status, None


def _public_auth_summary(auth: dict, logout_status: int | None, sessions_after_logout: int | None) -> dict:
    return {
        "setup_http_status": auth.get("setup_http_status"),
        "login_http_status": auth.get("login_http_status"),
        "principal_role": auth.get("principal_role"),
        "cookie_http_only": auth.get("cookie_http_only") is True,
        "cookie_hidden_from_document": auth.get("cookie_hidden_from_document") is True,
        "browser_storage_state_written": False,
        "logout_http_status": logout_status,
        "server_session_rows_after_logout": sessions_after_logout,
    }


def create_browser_project_fixture(base_url: str, token: str) -> dict:
    """只在隔离门禁服务经合法HTTP创建项目，不要求生产注入黄金示例。"""
    headers = {"Cookie": "gw_session=" + token, "Origin": base_url,
               "Content-Type": "application/json", "Idempotency-Key": "phase12-browser-project-fixture"}
    request = Request(base_url + "/api/asset-registry/projects", method="POST", headers=headers,
                      data=json.dumps({"name": "认证浏览器门禁项目", "project_type": "film", "client_request_id": "phase12-browser-project-fixture"}).encode("utf-8"))
    with urlopen(request, timeout=10) as response:
        if response.status != 201:
            raise RuntimeError("隔离项目创建失败")
        project = json.load(response)["project"]
    project_id = project["project_id"]
    readback = Request(base_url + "/api/asset-registry/projects?archived=false", headers=headers)
    with urlopen(readback, timeout=10) as response:
        saved = next(item for item in json.load(response)["projects"] if item["project_id"] == project_id)
    if saved["project_id"] != project_id or saved["name"] != "认证浏览器门禁项目":
        raise RuntimeError("隔离项目读回不一致")
    return {"project_id": project_id, "created_via_http": True, "readback_verified": True}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Phase 12 本地账户认证浏览器验收")
    parser.add_argument("--artifacts-dir", default=None, help="截图与 JSON 输出目录，必须位于仓库外")
    args = parser.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    try:
        artifacts_dir = choose_artifacts_dir(args.artifacts_dir)
    except Exception as exc:
        print(f"[phase12-auth] 配置失败：{type(exc).__name__}", file=sys.stderr)
        return 2

    runtime_dir = artifacts_dir / "isolated-runtime"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    (runtime_dir / "data").mkdir(parents=True, exist_ok=True)
    db_path = runtime_dir / "auth.sqlite3"
    phase = ["e2e"]
    api_events: list[dict] = []
    process = None
    token = ""
    auth = {}
    probes = []
    team_messages = {"passed": False}
    project_fixture = {}
    suite = {"pages": [], "failures": ["门禁尚未执行"]}
    server_log = None
    logout_status = None
    sessions_after_logout = None
    base_url = None
    failure_type = None
    try:
        smoke = load_smoke_module()
        port = choose_ephemeral_port()
        base_url = f"http://127.0.0.1:{port}"
        env = isolated_server_environment(os.environ, port, runtime_dir)
        server_log = (artifacts_dir / "isolated-server.log").open("w", encoding="utf-8")
        process = subprocess.Popen(
            [sys.executable, str(REPO_ROOT / "run.py")],
            cwd=REPO_ROOT,
            env=env,
            stdout=server_log,
            stderr=subprocess.STDOUT,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        _wait_server(base_url, process)
        token, auth = create_local_account_and_login(base_url, smoke)
        project_fixture = create_browser_project_fixture(base_url, token)
        context_factory = create_authenticated_context_factory(base_url, token, api_events, phase)
        implemented, unimplemented = smoke._load_guard_baseline()
        checks = smoke.run_checks(base_url, artifacts_dir, implemented, unimplemented,
                                  context_factory=context_factory)
        interactions = smoke.run_interactions(base_url, implemented, unimplemented,
                                              context_factory=context_factory)
        routes = smoke.run_shell_route_consistency(base_url, context_factory=context_factory)
        repeat = smoke.run_shell_route_repeat_nav(base_url, context_factory=context_factory)
        topbar = smoke.run_topbar_accessibility(base_url, context_factory=context_factory)
        mutation = smoke.run_topbar_accessibility(
            base_url, ignore_registry=True, mutate_targets=True, context_factory=context_factory
        )
        suite = {
            "pages": checks.get("pages", []),
            "failures": (checks.get("failures", []) + interactions.get("failures", [])
                         + routes.get("failures", []) + repeat.get("failures", [])
                         + topbar.get("failures", [])),
            "interactions": interactions.get("interactions", []),
            "shell_route": routes.get("shell_route", []),
            "repeat_nav": repeat.get("repeat_nav", []),
            "topbar": topbar.get("topbar", []),
            "mutation_failure_count": len(mutation.get("failures", [])),
        }
        probes = verify_authenticated_pages(base_url, smoke, context_factory, artifacts_dir, phase)
        team_messages = verify_team_message_workflow(base_url, smoke, context_factory, artifacts_dir, phase)
    except Exception as exc:
        failure_type = type(exc).__name__
        if suite.get("failures") == ["门禁尚未执行"]:
            suite["failures"] = [f"认证浏览器门禁异常：{failure_type}"]
    finally:
        if token and base_url:
            logout_status, sessions_after_logout = _logout_and_count_sessions(base_url, token, db_path)
            token = ""
        if process is not None and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
        if server_log is not None:
            server_log.close()

    failures = validate_gate(
        tuple(getattr(locals().get("smoke", None), "PAGES", ())),
        suite,
        probes,
        api_events,
        ["observed"] if suite.get("mutation_failure_count", 0) else [],
    )
    if not team_message_workflow_verified(team_messages):
        failures.append("团队消息真实浏览器流程未通过")
    if logout_status != 204:
        failures.append("测试结束时未能确认服务端会话撤销 204")
    if sessions_after_logout != 0:
        failures.append("临时账户数据库中仍有活动会话记录")

    report = {
        "gate": "phase12_authenticated_browser",
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "status": "PASS" if not failures else "FAIL",
        "base_url": base_url,
        "server": {
            "isolated_ephemeral_port": bool(base_url and urlsplit(base_url).port not in {None, 2077}),
            "auth_mode": "local_account",
            "cli_execution_enabled": False,
            "database_isolated": True,
            "allowed_file_roots": [],
        },
        "auth": _public_auth_summary(auth, logout_status, sessions_after_logout),
        "pages": probes,
        "api_by_page": summarize_api_events(tuple(getattr(locals().get("smoke", None), "PAGES", ())), api_events),
        "e2e": {
            "page_count": len(suite.get("pages", [])),
            "interaction_count": len(suite.get("interactions", [])),
            "shell_route_count": len(suite.get("shell_route", [])),
            "repeat_nav_count": len(suite.get("repeat_nav", [])),
            "topbar_count": len(suite.get("topbar", [])),
            "mutation_failure_count": suite.get("mutation_failure_count", 0),
            "api_event_count": len(api_events),
            "page_errors": {row.get("page"): row.get("page_errors", []) for row in suite.get("pages", [])},
        },
        "team_messages": team_messages,
        "project_fixture": project_fixture,
        "failures": failures,
        "limitations": [
            "本轮仅验证本机隔离服务与本地账户，不验证真实外部 Provider/模型、OIDC 身份提供商或外部 CLI。",
            "未调用 /api/chat、/api/chat/agent；无真实外部模型响应证据。",
            "本门禁不触发视频渲染；视频能力须由独立视频流程验证，不据此门禁推断其实现状态。",
            "服务端只在独立临时目录持久化密码哈希与会话哈希；浏览器 Cookie/StorageState 未写入磁盘，结束时撤销会话并验证活动会话数为零。",
        ],
        "artifacts": {
            "directory": str(artifacts_dir),
            "report": "phase12-authenticated-browser.json",
            "screenshots": [row.get("screenshot") for row in probes if row.get("screenshot")],
            "server_log": "isolated-server.log",
        },
        "fatal_error_type": failure_type,
    }
    report_path = artifacts_dir / "phase12-authenticated-browser.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[phase12-auth] {report['status']} pages={len(probes)}/{len(getattr(locals().get('smoke', None), 'PAGES', []))} "
          f"interactions={len(suite.get('interactions', []))} report={report_path}")
    if failures:
        for failure in failures:
            print("  - " + failure)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
