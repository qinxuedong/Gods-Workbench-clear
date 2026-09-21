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
    """
    token = _extract_bearer_token(authorization)
    runtime = load_runtime_auth_config()

    if runtime.mode == AUTH_MODE_OIDC:
        if not runtime.ready:
            # 配置缺失或非法：失败关闭，绝不回落到本地信任。
            raise UnauthorizedException(message="外部 IdP 未正确配置，已拒绝请求")
        from gods_workbench.core.oidc import verify_jwt  # 延迟导入

        try:
            identity = verify_jwt(token, runtime.oidc)
        except UnauthorizedException:
            raise
        except Exception:
            # 校验器任何非预期异常都转为 401，避免泄漏内部细节。
            raise UnauthorizedException(message="令牌校验失败，已拒绝请求")
        role = identity.role
        if role not in KNOWN_ROLES:
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
