# -*- coding: utf-8 -*-
"""B1 认证、团队与操作授权管理路由。"""
from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Header, Query, status
from pydantic import BaseModel, Field

from gods_workbench.core.auth import AuthContext, require_authenticated, require_governance_access
from gods_workbench.core.config import AUTH_MODE_OIDC, load_runtime_auth_config
from gods_workbench.core.auth_management import bootstrap_window_open, store

router = APIRouter(prefix="/api/asset-auth", tags=["asset-auth-management"])
Decision = Literal["approved", "rejected", "cancelled"]


class BootstrapPayload(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    role: str = "editor"


class UserCreatePayload(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    role: Optional[str] = None
    external_subject: Optional[str] = Field(default=None, max_length=256)


class UserUpdatePayload(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    role: Optional[str] = None
    expected_version: int


class TeamCreatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)


class TeamDeletePayload(BaseModel):
    expected_version: int


class TeamMemberPayload(BaseModel):
    user_id: str = Field(min_length=1)
    role: str = "editor"
    expected_version: int


class MemberDeletePayload(BaseModel):
    expected_version: int


class ApprovalUpdatePayload(BaseModel):
    decision: Decision
    expected_version: int
    reason: Optional[str] = Field(default=None, max_length=500)


class TokenCreatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    scopes: list[str] = Field(default_factory=list, max_length=32)
    expires_at: Optional[str] = None


def _auth(authorization: Optional[str], role: str, governance: bool = False) -> AuthContext:
    """统一认证入口；OIDC 模式可只携带服务端 ``gw_session`` Cookie。"""
    if governance:
        return require_governance_access(authorization, role)
    return require_authenticated(authorization, role)


@router.post("/bootstrap", status_code=status.HTTP_201_CREATED)
def bootstrap(
    payload: BootstrapPayload,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    # 初始化窗口必须显式开启；OIDC 模式还必须先通过既有 IdP 会话/令牌，
    # 不允许用匿名请求绕过外部身份边界。
    if not bootstrap_window_open():
        from gods_workbench.core.auth_management import AuthBootstrapUnavailable

        raise AuthBootstrapUnavailable()
    runtime = load_runtime_auth_config()
    context: AuthContext | None = None
    if runtime.mode == AUTH_MODE_OIDC:
        context = _auth(authorization, x_user_role, governance=True)
        role = context.role
        owner_subject = context.subject
    else:
        role = payload.role
        owner_subject = None
    user = store.bootstrap(payload.display_name, role, owner_subject=owner_subject)
    return {"user": user, "session": None}


@router.get("/users", status_code=status.HTTP_200_OK)
def list_users(authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role)
    return {"users": store.list_users(context.subject, context.role)}


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreatePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    oidc_mode = context.mode == AUTH_MODE_OIDC
    # OIDC 模式下请求体中的角色和 external_subject 均不可信；服务端只创建只读主体，
    # 由后续受信治理流程调整，避免管理员接口被请求体变成任意提权入口。
    user = store.create_user(
        payload.display_name,
        payload.role or "editor",
        payload.external_subject,
        actor_subject=context.subject,
        actor_role=context.role,
        auth_mode=context.mode,
        trusted_role="readonly" if oidc_mode else None,
        allow_client_identity=not oidc_mode,
    )
    return {"user": user}


@router.patch("/users/{user_id}", status_code=status.HTTP_200_OK)
def update_user(user_id: str, payload: UserUpdatePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    return {
        "user": store.update_user(
            user_id,
            payload.display_name,
            payload.role,
            payload.expected_version,
            actor_subject=context.subject,
            actor_role=context.role,
            auth_mode=context.mode,
            allow_role_update=context.mode != AUTH_MODE_OIDC,
        )
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, payload: TeamDeletePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    store.delete_user(user_id, payload.expected_version, actor_subject=context.subject, actor_role=context.role, auth_mode=context.mode)
    return None


@router.get("/teams", status_code=status.HTTP_200_OK)
def list_teams(authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role)
    return {"teams": store.list_teams(context.subject, context.role)}


@router.post("/teams", status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreatePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    return {
        "team": store.create_team(
            payload.name,
            payload.description,
            actor_subject=context.subject,
            actor_role=context.role,
            auth_mode=context.mode,
        )
    }


@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: str, payload: TeamDeletePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    store.delete_team(team_id, payload.expected_version, actor_subject=context.subject, actor_role=context.role, auth_mode=context.mode)
    return None


@router.put("/teams/{team_id}/members", status_code=status.HTTP_200_OK)
def update_team_member(team_id: str, payload: TeamMemberPayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    return {
        "membership": store.update_member(
            team_id,
            payload.user_id,
            payload.role,
            payload.expected_version,
            actor_subject=context.subject,
            actor_role=context.role,
            auth_mode=context.mode,
        )
    }


@router.delete("/teams/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_member(team_id: str, user_id: str, payload: MemberDeletePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    store.delete_member(team_id, user_id, payload.expected_version, actor_subject=context.subject, actor_role=context.role, auth_mode=context.mode)
    return None


@router.get("/operation-approvals", status_code=status.HTTP_200_OK)
def list_operation_approvals(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    context = _auth(authorization, x_user_role)
    values, next_cursor = store.list_approvals_page(
        status_filter,
        limit=limit,
        cursor=cursor,
        actor_subject=context.subject,
        actor_role=context.role,
    )
    return {"approvals": values, "next_cursor": next_cursor}


@router.put("/operation-approvals/{approval_id}", status_code=status.HTTP_200_OK)
def update_operation_approval(approval_id: str, payload: ApprovalUpdatePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    return {
        "approval": store.update_approval(
            approval_id,
            payload.decision,
            payload.expected_version,
            payload.reason,
            actor_subject=context.subject,
            actor_role=context.role,
            auth_mode=context.mode,
        )
    }


@router.post("/tokens", status_code=status.HTTP_201_CREATED)
def create_token(payload: TokenCreatePayload, authorization: Optional[str] = Header(None), x_user_role: str = Header("editor", alias="X-User-Role")):
    context = _auth(authorization, x_user_role, governance=True)
    token, _raw = store.create_token(
        payload.name,
        payload.scopes,
        payload.expires_at,
        actor_subject=context.subject,
        actor_role=context.role,
        auth_mode=context.mode,
    )
    return {"token": token}
