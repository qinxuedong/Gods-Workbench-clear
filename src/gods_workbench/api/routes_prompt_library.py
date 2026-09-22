# -*- coding: utf-8 -*-
"""提示词库 API 路由实现（Phase 10C）。

严格对齐 docs/contracts/PROMPT-LIBRARY-INTERFACE-CATALOG.yaml（p10c-frozen-1）的 7 个端点：

- ``GET    /api/prompt-libraries``                         读取提示词库树
- ``POST   /api/prompt-libraries``                         创建提示词库
- ``PATCH  /api/prompt-libraries/{library_id}``            重命名提示词库
- ``DELETE /api/prompt-libraries/{library_id}``            删除提示词库
- ``POST   /api/prompt-libraries/categories``              创建分类
- ``PATCH  /api/prompt-libraries/categories/{category_id}`` 重命名分类
- ``DELETE /api/prompt-libraries/categories/{category_id}`` 删除分类

边界：``/api/prompt-libraries/items*`` 等条目 CRUD 仍属 KNOWN_UNIMPLEMENTED，
未获契约授权，本模块**不得**顺带实现（由契约测试反向断言其不可用）。

认证：读端点需认证；写端点需 ``require_edit_access``（只读角色 403）。
删除端点的 CAS 期望值经查询串 ``expected_version`` 传入（前端以空体 DELETE 调用）。
"""

from typing import Optional

from fastapi import APIRouter, Header, Query, status

from gods_workbench.core.auth import require_authenticated, require_edit_access
from gods_workbench.prompt_library.models import (
    PromptCategoryCreateRequest,
    PromptCategoryCreateResponse,
    PromptCategoryRenameRequest,
    PromptCategoryRenameResponse,
    PromptLibraryCreateRequest,
    PromptLibraryCreateResponse,
    PromptLibraryDeleteResponse,
    PromptLibraryRenameRequest,
    PromptLibraryRenameResponse,
    PromptLibraryResponse,
)
from gods_workbench.prompt_library.service import default_prompt_library_service

router = APIRouter(prefix="/api/prompt-libraries", tags=["prompt-library"])


@router.get(
    "",
    response_model=PromptLibraryResponse,
    summary="读取提示词库树",
    status_code=status.HTTP_200_OK,
)
def get_prompt_libraries(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """返回当前身份可见的提示词库树；空目录返回空数组，不伪造提示词内容。"""
    require_authenticated(authorization, x_user_role)
    return PromptLibraryResponse(library=default_prompt_library_service.get_snapshot())


@router.post(
    "",
    response_model=PromptLibraryCreateResponse,
    summary="创建提示词库",
    status_code=status.HTTP_201_CREATED,
)
def create_prompt_library(
    payload: PromptLibraryCreateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """创建提示词库；要求写权限，重名或目录版本冲突失败关闭。"""
    require_edit_access(authorization, x_user_role)
    library, snapshot = default_prompt_library_service.create_library(payload)
    return PromptLibraryCreateResponse(prompt_library=library, library=snapshot)


@router.patch(
    "/{library_id}",
    response_model=PromptLibraryRenameResponse,
    summary="重命名提示词库",
    status_code=status.HTTP_200_OK,
)
def rename_prompt_library(
    library_id: str,
    payload: PromptLibraryRenameRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """重命名提示词库；要求写权限，目标不存在、重名或 CAS 冲突失败关闭。"""
    require_edit_access(authorization, x_user_role)
    library, snapshot = default_prompt_library_service.rename_library(library_id, payload)
    return PromptLibraryRenameResponse(prompt_library=library, library=snapshot)


@router.delete(
    "/{library_id}",
    response_model=PromptLibraryDeleteResponse,
    summary="删除提示词库",
    status_code=status.HTTP_200_OK,
)
def delete_prompt_library(
    library_id: str,
    expected_version: Optional[int] = Query(None, ge=1, description="目标库 CAS 期望版本；缺省表示不校验"),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """删除提示词库；要求写权限，非空库返回 409 LIBRARY_NOT_EMPTY，禁止静默级联删除。"""
    require_edit_access(authorization, x_user_role)
    snapshot = default_prompt_library_service.delete_library(library_id, expected_version)
    return PromptLibraryDeleteResponse(library=snapshot)


@router.post(
    "/categories",
    response_model=PromptCategoryCreateResponse,
    summary="创建提示词分类",
    status_code=status.HTTP_201_CREATED,
)
def create_prompt_library_category(
    payload: PromptCategoryCreateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """在指定提示词库下创建分类；要求写权限，父库不存在或版本冲突失败关闭。"""
    require_edit_access(authorization, x_user_role)
    category, snapshot = default_prompt_library_service.create_category(payload)
    return PromptCategoryCreateResponse(category=category, library=snapshot)


@router.patch(
    "/categories/{category_id}",
    response_model=PromptCategoryRenameResponse,
    summary="重命名提示词分类",
    status_code=status.HTTP_200_OK,
)
def rename_prompt_library_category(
    category_id: str,
    payload: PromptCategoryRenameRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """重命名分类；要求写权限，目标不存在、同库重名或 CAS 冲突失败关闭。"""
    require_edit_access(authorization, x_user_role)
    category, snapshot = default_prompt_library_service.rename_category(category_id, payload)
    return PromptCategoryRenameResponse(category=category, library=snapshot)


@router.delete(
    "/categories/{category_id}",
    response_model=PromptLibraryDeleteResponse,
    summary="删除提示词分类",
    status_code=status.HTTP_200_OK,
)
def delete_prompt_library_category(
    category_id: str,
    expected_version: Optional[int] = Query(None, ge=1, description="目标分类 CAS 期望版本；缺省表示不校验"),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
):
    """删除分类；要求写权限，目标不存在或 CAS 冲突失败关闭。"""
    require_edit_access(authorization, x_user_role)
    snapshot = default_prompt_library_service.delete_category(category_id, expected_version)
    return PromptLibraryDeleteResponse(library=snapshot)
