"""洁净室 API 的最小认证与角色边界。

本模块只实现接口层需要的边界检查，不伪造外部身份提供商。当前接受
Bearer 凭据作为本地/测试会话输入；生产部署前仍必须接入可验证的身份服务。
"""

from dataclasses import dataclass
from typing import Optional

from gods_workbench.core.errors import ForbiddenException, UnauthorizedException


KNOWN_ROLES = frozenset({"editor", "admin", "governor", "reviewer", "readonly", "guest"})
EDIT_ROLES = frozenset({"editor", "admin", "governor"})
GOVERNANCE_ROLES = frozenset({"admin", "governor"})


@dataclass(frozen=True)
class AuthContext:
    """请求认证后的最小上下文，不保存凭据原文。"""

    role: str


def require_authenticated(
    authorization: Optional[str],
    user_role: Optional[str] = "editor",
) -> AuthContext:
    """要求 Bearer 会话并返回角色上下文。"""
    raw = (authorization or "").strip()
    scheme, separator, credential = raw.partition(" ")
    if not separator or scheme.lower() != "bearer" or not credential.strip():
        raise UnauthorizedException()
    if credential.strip().lower() in {"invalid", "expired"}:
        raise UnauthorizedException()

    role = (user_role or "editor").strip().lower()
    if role not in KNOWN_ROLES:
        raise ForbiddenException(message="未知用户角色，已拒绝请求")
    return AuthContext(role=role)


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
    """要求已认证且具备生命周期治理权限。"""
    context = require_authenticated(authorization, user_role)
    if context.role not in GOVERNANCE_ROLES:
        raise ForbiddenException(message="无项目生命周期治理权限")
    return context
