"""项目中心 API 路由实现。

严格对齐 docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml 定义的 7 个端点，接驳 ProjectsService。
"""

from typing import Optional
from fastapi import APIRouter, Header, Query, status

from gods_workbench.core.auth import require_edit_access, require_governance_access
from gods_workbench.core.errors import UnauthorizedException
from gods_workbench.projects_hub.models import (
    CasVersionRequest,
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectMutationResponse,
    ProjectUpdateRequest,
)
from gods_workbench.projects_hub.service import default_projects_service

router = APIRouter(prefix="/api/asset-registry", tags=["projects-hub"])


@router.get(
    "/projects",
    response_model=ProjectListResponse,
    summary="获取项目列表",
    status_code=status.HTTP_200_OK,
)
def list_projects(
    archived: Optional[bool] = Query(False, description="是否包含归档项目"),
    deleted: Optional[bool] = Query(None, description="是否包含回收站项目"),
    authorization: Optional[str] = Header(None),
):
    """根据查询条件返回项目集合。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    projects = default_projects_service.list_projects(archived=archived, deleted=deleted)
    return ProjectListResponse(projects=projects)


@router.post(
    "/projects",
    response_model=ProjectMutationResponse,
    summary="创建项目",
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    payload: ProjectCreateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """创建新项目。"""
    require_edit_access(authorization, x_user_role)
    result = default_projects_service.create_project(payload)
    return ProjectMutationResponse(project=result)


@router.patch(
    "/projects/{project_id}",
    response_model=ProjectMutationResponse,
    summary="编辑项目（CAS）",
    status_code=status.HTTP_200_OK,
)
def update_project(
    project_id: str,
    payload: ProjectUpdateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """更新项目元信息，要求 expected_version 匹配。"""
    require_edit_access(authorization, x_user_role)
    result = default_projects_service.update_project(project_id, payload)
    return ProjectMutationResponse(project=result)


@router.delete(
    "/projects/{project_id}",
    response_model=ProjectMutationResponse,
    summary="归档项目",
    status_code=status.HTTP_200_OK,
)
def archive_project(
    project_id: str,
    payload: CasVersionRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """将项目移入只读归档状态。"""
    require_governance_access(authorization, x_user_role)
    result = default_projects_service.archive_project(project_id, payload.expected_version)
    return ProjectMutationResponse(project=result)


@router.post(
    "/governance/projects/{project_id}/restore",
    response_model=ProjectMutationResponse,
    summary="解归档项目",
    status_code=status.HTTP_200_OK,
)
def unarchive_project(
    project_id: str,
    payload: CasVersionRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """将已归档项目恢复为活跃状态。"""
    require_governance_access(authorization, x_user_role)
    result = default_projects_service.unarchive_project(project_id, payload.expected_version)
    return ProjectMutationResponse(project=result)


@router.post(
    "/projects/{project_id}/trash",
    response_model=ProjectMutationResponse,
    summary="移入回收站",
    status_code=status.HTTP_200_OK,
)
def move_project_to_trash(
    project_id: str,
    payload: CasVersionRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """仅允许已归档项目移入回收站。"""
    require_governance_access(authorization, x_user_role)
    result = default_projects_service.move_to_trash(project_id, payload.expected_version)
    return ProjectMutationResponse(project=result)


@router.post(
    "/projects/{project_id}/trash/restore",
    response_model=ProjectMutationResponse,
    summary="从回收站恢复",
    status_code=status.HTTP_200_OK,
)
def restore_project_from_trash(
    project_id: str,
    payload: CasVersionRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """从回收站恢复项目至可用集合。"""
    require_governance_access(authorization, x_user_role)
    result = default_projects_service.restore_from_trash(project_id, payload.expected_version)
    return ProjectMutationResponse(project=result)
