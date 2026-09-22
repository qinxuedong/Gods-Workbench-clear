# -*- coding: utf-8 -*-
"""洁净室 API 的最小认证与角色边界。

本模块只实现接口层需要的边界检查，不伪造任何外部身份提供商：

- ``local``（默认）：接受 Bearer 凭据作为本地/测试会话输入，角色由请求头
  ``X-User-Role`` 提供。该模式**不验证外部身份**，仅用于本地开发与测试，
  不得用于生产。
- ``oidc``：接入真实外部身份提供商。Bearer 令牌必须通过 ``core.oidc`` 的
  RS256 签名与 ``iss`` / ``aud`` / ``exp`` 校验，角色**只**由 IdP 组声明映射得出；
  请求头中的 ``X-User-Role`` 在该模式下被完全忽略，防止角色越权。

生产部署前必须显式设置 ``GW_AUTH_MODE=oidc`` 并提供完整 OIDC 配置；
配置缺失时一律失败关闭（拒绝请求），不静默降级为本地通行。
"""

from dataclasses import dataclass
from typing import Optional

from gods_workbench.core import audit as audit_log
from gods_workbench.core.config import AUTH_MODE_LOCAL, AUTH_MODE_OIDC, load_runtime_auth_config
from gods_workbench.core.errors import ForbiddenException, UnauthorizedException

KNOWN_ROLES = frozenset({"admin", "governor", "editor", "reviewer", "readonly"})
EDIT_ROLES = frozenset({"admin", "governor", "editor"})
GOVERNANCE_ROLES = frozenset({"admin", "governor"})


@dataclass(frozen=True)
class AuthContext:
    """请求认证后的最小上下文，不保存凭据原文。"""

    role: str
    subject: Optional[str] = None
    mode: str = AUTH_MODE_LOCAL


def _extract_bearer_token(authorization: Optional[str]) -> str:
    """从 Authorization 头提取 Bearer 令牌；缺失或格式错误一律拒绝。"""
    raw = (authorization or "").strip()
    scheme, separator, token = raw.partition(" ")
    if not separator or scheme.lower() != "bearer" or not token.strip():
        raise UnauthorizedException()
    return token.strip()


def require_authenticated(
    authorization: Optional[str],
    user_role: Optional[str] = "editor",
) -> AuthContext:
    """要求已认证会话并返回角色上下文。

    OIDC 模式下角色完全来自 IdP 声明；``user_role``（请求头）被忽略。
    本模式接受两种凭据，均**只**由服务端校验得出角色：

    1. 服务端会话：中间件已按 ``gw_session`` Cookie 解析出的会话身份
       （授权码 + PKCE 登录后的常规路径，见 ``api/routes_auth.py``）；
    2. ``Authorization: Bearer <id_token>``：便于服务间/脚本直连的令牌路径。

    两者都缺失或校验失败一律 401，绝不回落到本地信任。
    """
    runtime = load_runtime_auth_config()

    if runtime.mode == AUTH_MODE_OIDC:
        # 优先使用中间件写入的服务端会话身份（Cookie 承载不透明会话标识）。
        from gods_workbench.core import session as session_store  # 延迟导入

        principal = session_store.get_current_principal()
        if principal:
            role = str(principal.get("role") or "").strip().lower()
            if role not in KNOWN_ROLES:
                audit_log.record_auth_event(
                    audit_log.EVENT_ROLE_REJECTED,
                    outcome=audit_log.OUTCOME_DENIED,
                    reason="session_role_unknown",
                    subject=str(principal.get("username") or "") or None,
                    role=role,
                    auth_mode=AUTH_MODE_OIDC,
                )
                raise ForbiddenException(message="会话角色不合法，已拒绝请求")
            return AuthContext(
                role=role,
                subject=str(principal.get("username") or "") or None,
                mode=AUTH_MODE_OIDC,
            )

    token = _extract_bearer_token(authorization)

    if runtime.mode == AUTH_MODE_OIDC:
        if not runtime.ready:
            # 配置缺失或非法：失败关闭，绝不回落到本地信任。
            audit_log.record_auth_event(
                audit_log.EVENT_TOKEN_REJECTED,
                outcome=audit_log.OUTCOME_DENIED,
                reason="oidc_not_ready",
                auth_mode=AUTH_MODE_OIDC,
            )
            raise UnauthorizedException(message="外部 IdP 未正确配置，已拒绝请求")
        from gods_workbench.core.oidc import verify_jwt  # 延迟导入

        try:
            identity = verify_jwt(token, runtime.oidc)
        except UnauthorizedException:
            # 审计只记「拒签」这一事实，绝不记录令牌原文或 claims。
            audit_log.record_auth_event(
                audit_log.EVENT_TOKEN_REJECTED,
                outcome=audit_log.OUTCOME_REJECTED,
                reason="token_verification_failed",
                auth_mode=AUTH_MODE_OIDC,
            )
            raise
        except Exception:
            # 校验器任何非预期异常都转为 401，避免泄漏内部细节。
            audit_log.record_auth_event(
                audit_log.EVENT_TOKEN_REJECTED,
                outcome=audit_log.OUTCOME_REJECTED,
                reason="token_verification_error",
                auth_mode=AUTH_MODE_OIDC,
            )
            raise UnauthorizedException(message="令牌校验失败，已拒绝请求")
        role = identity.role
        if role not in KNOWN_ROLES:
            audit_log.record_auth_event(
                audit_log.EVENT_ROLE_REJECTED,
                outcome=audit_log.OUTCOME_DENIED,
                reason="idp_role_not_authorized",
                subject=identity.subject,
                role=role,
                auth_mode=AUTH_MODE_OIDC,
            )
            raise ForbiddenException(message="IdP 角色映射未授权，已拒绝请求")
        return AuthContext(role=role, subject=identity.subject, mode=AUTH_MODE_OIDC)

    # 本地/测试模式：仅用于开发期，凭证内容不作真实性校验。
    if token.lower() in {"invalid", "expired"}:
        raise UnauthorizedException()
    role = (user_role or "editor").strip().lower()
    if role not in KNOWN_ROLES:
        raise ForbiddenException(message="未知用户角色，已拒绝请求")
    return AuthContext(role=role, mode=AUTH_MODE_LOCAL)


def require_edit_access(authorization: Optional[str], user_role: Optional[str] = "editor") -> AuthContext:
    """要求已认证且具备项目/画布写权限。"""
    context = require_authenticated(authorization, user_role)
    if context.role not in EDIT_ROLES:
        raise ForbiddenException(message="无当前资源写权限，已降级为只读")
    return context


def require_governance_access(
    authorization: Optional[str],
    user_role: Optional[str] = "editor",
) -> AuthContext:
    """要求已认证且具备项目生命周期治理权限。"""
    context = require_authenticated(authorization, user_role)
    if context.role not in GOVERNANCE_ROLES:
        raise ForbiddenException(message="无项目生命周期治理权限")
    return context
