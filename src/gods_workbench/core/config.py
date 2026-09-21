# -*- coding: utf-8 -*-
"""外部身份提供商（OIDC）运行期配置。

本模块只负责从环境变量读取配置并构造 ``core.oidc`` 所需的校验参数，
不保存任何密钥、令牌或凭据，也不在日志中输出敏感内容。

设计原则：
- 默认 ``GW_AUTH_MODE=local``：保持当前本地/测试会话行为，不改动既有契约；
- 仅当显式设置 ``GW_AUTH_MODE=oidc`` 时才启用真实外部 IdP 校验；
- 配置缺失一律**失败关闭**（拒绝请求），不静默降级为本地通行；
- JWKS 仅允许 HTTPS（本地回环地址例外，便于受控联调），并限制响应体积；
- 运行期配置按环境变量值缓存，使 JWKS 的 TTL 缓存**跨请求**真正生效。

环境变量：
- ``GW_AUTH_MODE``：``local``（默认）或 ``oidc``；未识别取值按 ``oidc`` 处理并失败关闭；
- ``GW_OIDC_ISSUER``：issuer 完整 URL（同时用于 iss 校验与 discovery）；
- ``GW_OIDC_AUDIENCE``：预期 audience；
- ``GW_OIDC_JWKS_URL``：可选。缺省时自动走 ``issuer + /.well-known/openid-configuration``
  的 ``jwks_uri``（真实 IdP 接线的默认路径）；
- ``GW_OIDC_GROUPS_CLAIM``：组声明名，默认 ``groups``；
- ``GW_OIDC_LEEWAY_SECONDS``：时钟容差秒数，默认 60。
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from typing import Any, Callable, Mapping, Optional, Tuple
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

AUTH_MODE_ENV = "GW_AUTH_MODE"
AUTH_MODE_LOCAL = "local"
AUTH_MODE_OIDC = "oidc"
KNOWN_AUTH_MODES = frozenset({AUTH_MODE_LOCAL, AUTH_MODE_OIDC})

JWKS_CACHE_SECONDS = 300
NEGATIVE_CACHE_SECONDS = 5
FORCE_REFRESH_MIN_SECONDS = 10
_MAX_REDIRECTS = 3
JWKS_TIMEOUT_SECONDS = 5
JWKS_MAX_BYTES = 512 * 1024
DISCOVERY_MAX_BYTES = 128 * 1024
ALLOWED_JWKS_SCHEMES = frozenset({"https"})
LOCAL_JWKS_HOSTS = frozenset({"127.0.0.1", "::1", "localhost"})
DISCOVERY_PATH = "/.well-known/openid-configuration"


class _ValidatingRedirectHandler(HTTPRedirectHandler):
    """逐跳重校验白名单的重定向处理器。

    只用单跳校验（`is_allowed_jwks_url`）就打开连接会被 302 绕过白名单：
    首跳合法、目标非法时 `urlopen` 仍会自动跟随。此处的处理器对**每一跳**的
    目标 URL 重新执行 `is_allowed_jwks_url`，非法即返回 ``None``（交由
    ``HTTPDefaultErrorHandler`` 抛 ``HTTPError``），即失败关闭。
    合法的白名单内跳转（例如同一 IdP 从 ``/jwks`` 302 到 ``/keys``）仍被允许，
    但跳数上限受 `_MAX_REDIRECTS` 约束。
    """

    max_redirections = _MAX_REDIRECTS

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D102 - 覆写基类
        if not is_allowed_jwks_url(newurl):
            # 目标不在白名单内：拒绝跟随（失败关闭，不跨跳重试）。
            return None
        return super().redirect_request(req, fp, code, msg, headers, newurl)


# 只使用本模块自建的 opener（逐跳重校验），不使用全局默认 opener。
_VALIDATING_OPENER = build_opener(_ValidatingRedirectHandler)

ISSUER_ENV = "GW_OIDC_ISSUER"
AUDIENCE_ENV = "GW_OIDC_AUDIENCE"
JWKS_URL_ENV = "GW_OIDC_JWKS_URL"
GROUPS_CLAIM_ENV = "GW_OIDC_GROUPS_CLAIM"
LEEWAY_ENV = "GW_OIDC_LEEWAY_SECONDS"
DEFAULT_GROUPS_CLAIM = "groups"
DEFAULT_LEEWAY_SECONDS = 60


def resolve_auth_mode(value: Optional[str] = None) -> str:
    """解析认证模式；未识别取值一律失败关闭，回落到 ``oidc``（拒绝而非放行）。"""
    raw = (value if value is not None else os.environ.get(AUTH_MODE_ENV, "")).strip().lower()
    if raw in KNOWN_AUTH_MODES:
        return raw
    if not raw:
        return AUTH_MODE_LOCAL
    return AUTH_MODE_OIDC


@dataclass(frozen=True)
class JwksEndpointConfig:
    """JWKS 端点配置（不含任何密钥材料）。"""

    url: str
    cache_seconds: int = JWKS_CACHE_SECONDS
    timeout_seconds: int = JWKS_TIMEOUT_SECONDS


def is_allowed_jwks_url(url: str) -> bool:
    """校验 JWKS URL：必须是 HTTPS，或指向本地回环的受控联调地址。"""
    if not isinstance(url, str) or not url.strip():
        return False
    parsed = urlparse(url.strip())
    if parsed.scheme in ALLOWED_JWKS_SCHEMES and parsed.netloc:
        return True
    if parsed.scheme == "http" and parsed.hostname in LOCAL_JWKS_HOSTS:
        return True
    return False


def _read_limited(
    request: Request,
    limit: int,
    description: str,
    timeout_seconds: int = JWKS_TIMEOUT_SECONDS,
) -> bytes:
    """发起一次 GET 并读取受限体积的响应体；非 2xx 或超限一律抛异常。"""
    with _VALIDATING_OPENER.open(request, timeout=max(1, int(timeout_seconds))) as response:  # noqa: S310 - 调用方已校验 scheme
        status_code = getattr(response, "status", 200)
        if status_code < 200 or status_code >= 300:
            raise ValueError(f"{description}返回非成功状态")
        payload = response.read(limit + 1)
    if len(payload) > limit:
        raise ValueError(f"{description}响应超过允许体积")
    return payload


def fetch_jwks(config: JwksEndpointConfig) -> Mapping[str, Any]:
    """拉取一次 JWKS 文档；非 2xx、超大响应或非 JSON 对象一律抛出异常。"""
    if not is_allowed_jwks_url(config.url):
        raise ValueError("JWKS URL 不在允许范围（仅 HTTPS 或本地回环）")
    request = Request(config.url, headers={"Accept": "application/json"}, method="GET")
    payload = _read_limited(request, JWKS_MAX_BYTES, "JWKS 端点", config.timeout_seconds)
    document = json.loads(payload.decode("utf-8"))
    if not isinstance(document, dict) or not isinstance(document.get("keys"), (list, tuple)):
        raise ValueError("JWKS 文档结构无效")
    return document


def fetch_discovery_document(issuer: str) -> Mapping[str, Any]:
    """拉取 issuer 的 OIDC discovery 文档（``/.well-known/openid-configuration``）。"""
    base = (issuer or "").strip().rstrip("/")
    discovery_url = base + DISCOVERY_PATH
    if not is_allowed_jwks_url(discovery_url):
        raise ValueError("discovery 端点不在允许范围（仅 HTTPS 或本地回环）")
    request = Request(discovery_url, headers={"Accept": "application/json"}, method="GET")
    payload = _read_limited(request, DISCOVERY_MAX_BYTES, "discovery 端点")
    document = json.loads(payload.decode("utf-8"))
    if not isinstance(document, dict):
        raise ValueError("discovery 文档结构无效")
    return document


def resolve_jwks_url(issuer: str, explicit_url: str = "") -> str:
    """确定 JWKS URL：优先显式配置，缺省时按 issuer 走 discovery 的 ``jwks_uri``。"""
    candidate = (explicit_url or "").strip()
    if not candidate:
        document = fetch_discovery_document(issuer)
        candidate = str(document.get("jwks_uri") or "").strip()
    if not is_allowed_jwks_url(candidate):
        raise ValueError("JWKS 端点配置无效（仅 HTTPS 或本地回环）")
    return candidate


def build_jwks_fetcher(config: JwksEndpointConfig) -> Callable[[], Mapping[str, Any]]:
    """构造带 TTL 缓存的 JWKS 拉取器，供 ``oidc.OidcConfig.jwks_fetcher`` 注入。

    返回值是零参可调用对象，因此与既有 ``jwks_fetcher`` 协议完全兼容；
    另外挂载 ``force_refresh()`` 属性：供校验器在 **未知 kid**（密钥轮换）时
    绕过 TTL 受控刷新一次，避免 TTL 窗口内新令牌被旧文档误拒。
    """
    cache: dict = {"at": 0.0, "document": None, "force_at": 0.0}

    def _load() -> Mapping[str, Any]:
        document = fetch_jwks(config)
        cache["document"] = document
        cache["at"] = time.time()
        return document

    def fetcher() -> Mapping[str, Any]:
        now = time.time()
        cached = cache.get("document")
        if cached is not None and now - float(cache.get("at") or 0.0) < max(0, int(config.cache_seconds)):
            return cached
        return _load()

    def force_refresh() -> Mapping[str, Any]:
        """未知 kid（密钥轮换）时的受控刷新：绕过 TTL，但有最小间隔限流。

        限流防止攻击者用随机 kid 反复触发外呼造成对 IdP 的自 DoS；限流窗口内
        返回当前缓存文档（可能命中不了新 kid，此时校验失败关闭）。
        """
        now = time.time()
        cached = cache.get("document")
        if cached is not None and now - float(cache.get("force_at") or 0.0) < FORCE_REFRESH_MIN_SECONDS:
            return cached
        document = _load()
        cache["force_at"] = now
        return document

    # 未知 kid 的受控刷新入口：显式绕过 TTL，但仍受体积/结构/白名单校验约束。
    fetcher.force_refresh = force_refresh
    return fetcher


@dataclass(frozen=True)
class RuntimeAuthConfig:
    """认证运行期配置汇总；``ready`` 为假时调用方必须失败关闭。"""

    mode: str
    ready: bool
    reason: str
    oidc: Any = None
    jwks_url: str = ""


def _environment_fingerprint() -> Tuple[str, ...]:
    """采集与认证配置相关的环境变量快照，用作运行期配置缓存键。"""
    return (
        os.environ.get(AUTH_MODE_ENV, ""),
        os.environ.get(ISSUER_ENV, ""),
        os.environ.get(AUDIENCE_ENV, ""),
        os.environ.get(JWKS_URL_ENV, ""),
        os.environ.get(GROUPS_CLAIM_ENV, ""),
        os.environ.get(LEEWAY_ENV, ""),
    )


# 运行期配置缓存：同一进程内环境变量不变时复用同一个 ``OidcConfig``，
# 使 ``build_jwks_fetcher`` 的 TTL 缓存跨请求生效（避免每请求都打 IdP）。
_RUNTIME_CACHE: dict = {}
# 失败结果短负缓存：key = 环境变量指纹，value = (记录时间, RuntimeAuthConfig)
_NEGATIVE_CACHE: dict = {}


def reset_runtime_auth_config_cache() -> None:
    """清空运行期配置缓存（供测试与热更新使用）。"""
    _RUNTIME_CACHE.clear()
    _NEGATIVE_CACHE.clear()


def load_runtime_auth_config() -> RuntimeAuthConfig:
    """从环境变量装载认证配置；任何缺失都返回不可用状态，由调用方拒绝请求。

    - 可用配置按环境变量指纹长期复用（使 JWKS TTL 缓存跨请求生效）。
    - 失败配置只缓存 ``NEGATIVE_CACHE_SECONDS`` 秒；到期自动重试，故障自愈无需重启。
    """
    fingerprint = _environment_fingerprint()
    cached = _RUNTIME_CACHE.get(fingerprint)
    if cached is not None:
        return cached
    negative = _NEGATIVE_CACHE.get(fingerprint)
    if negative is not None and time.time() - float(negative[0]) < NEGATIVE_CACHE_SECONDS:
        return negative[1]
    runtime = _build_runtime_auth_config(fingerprint)
    if runtime.ready:
        _RUNTIME_CACHE[fingerprint] = runtime
        _NEGATIVE_CACHE.pop(fingerprint, None)
        return runtime
    # 失败结果只做**短**负缓存：既避免 IdP 不可达时每请求重复外呼（自 DoS），
    # 又保证故障自愈不需要重启进程。
    _RUNTIME_CACHE.pop(fingerprint, None)
    _NEGATIVE_CACHE[fingerprint] = (time.time(), runtime)
    return runtime


def _build_runtime_auth_config(fingerprint: Tuple[str, ...]) -> RuntimeAuthConfig:
    """按环境变量快照构造运行期认证配置（失败一律 ``ready=False``）。"""
    mode = resolve_auth_mode(fingerprint[0])
    if mode != AUTH_MODE_OIDC:
        return RuntimeAuthConfig(mode=mode, ready=False, reason="未启用外部 IdP 校验")

    issuer = fingerprint[1].strip()
    audience = fingerprint[2].strip()
    groups_claim = fingerprint[4].strip() or DEFAULT_GROUPS_CLAIM
    if not issuer or not audience:
        return RuntimeAuthConfig(mode=mode, ready=False, reason="OIDC 配置缺失，已拒绝请求")

    try:
        jwks_url = resolve_jwks_url(issuer, fingerprint[3])
    except Exception:
        # discovery 失败、jwks_uri 缺失或 scheme 非法：失败关闭。
        return RuntimeAuthConfig(mode=mode, ready=False, reason="JWKS 端点配置无效，已拒绝请求")

    try:
        leeway = int(fingerprint[5])
    except ValueError:
        leeway = DEFAULT_LEEWAY_SECONDS

    from gods_workbench.core.oidc import OidcConfig  # 延迟导入，避免模块循环

    oidc_config = OidcConfig(
        issuer=issuer,
        audience=audience,
        enabled=True,
        leeway_seconds=max(0, leeway),
        groups_claim=groups_claim,
        jwks_fetcher=build_jwks_fetcher(JwksEndpointConfig(url=jwks_url)),
    )
    return RuntimeAuthConfig(
        mode=mode,
        ready=True,
        reason="已启用外部 IdP 校验",
        oidc=oidc_config,
        jwks_url=jwks_url,
    )
