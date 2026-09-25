# -*- coding: utf-8 -*-
"""Phase 11 B4 素材库扩展接口。

已注册的接口先完成认证与角色边界；未有冻结数据源支撑的能力一律显式 503，
不读取任意本机路径、不产生伪造任务、不吞掉副作用。
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header, Request, status

from gods_workbench.asset_library.b4_service import unavailable
from gods_workbench.core.auth import require_authenticated, require_edit_access

router = APIRouter(tags=["asset-library-b4"])


def _read(authorization: Optional[str], x_user_role: str):
    """执行统一读取认证。"""
    return require_authenticated(authorization, x_user_role)


def _write(authorization: Optional[str], x_user_role: str):
    """执行统一写入认证。"""
    return require_edit_access(authorization, x_user_role)


def _fail_asset(endpoint: str, capability: str = "素材库扩展能力") -> None:
    unavailable(endpoint, capability, code="ASSET_LIBRARY_NOT_INTEGRATED")


def _fail_content(endpoint: str) -> None:
    unavailable(endpoint, "素材内容解析能力", code="ASSET_CONTENT_NOT_INTEGRATED")


def _fail_local(endpoint: str) -> None:
    unavailable(endpoint, "本地素材能力", code="LOCAL_ASSETS_NOT_INTEGRATED")


def _fail_storage(endpoint: str) -> None:
    unavailable(endpoint, "存储文件能力", code="STORAGE_FILES_NOT_INTEGRATED")


# ---------------------------------------------------------------------------
# 分类配置/后台任务
# ---------------------------------------------------------------------------

@router.get("/api/asset-classification-prompt", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def get_asset_classification_prompt(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_asset("/api/asset-classification-prompt", "素材分类提示词能力")


@router.patch("/api/asset-classification-prompt", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_asset_classification_prompt(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-classification-prompt", "素材分类提示词能力")


@router.post("/api/asset-classification/background", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def start_asset_classification_background(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-classification/background", "素材分类后台任务")


@router.delete("/api/asset-classification/background", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def stop_asset_classification_background(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-classification/background", "素材分类后台任务")


@router.get("/api/asset-classification/jobs/{job_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def get_asset_classification_job(
    job_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_asset("/api/asset-classification/jobs/{p}", "素材分类任务查询")


# ---------------------------------------------------------------------------
# 内容与文件边界
# ---------------------------------------------------------------------------

@router.get("/api/asset-content", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def get_asset_content(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_content("/api/asset-content")


@router.patch("/api/asset-content", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_asset_content(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_content("/api/asset-content")


@router.get("/api/asset-content/pdf", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def get_asset_content_pdf(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_content("/api/asset-content/pdf")


@router.get("/api/asset-content/versions", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def get_asset_content_versions(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_content("/api/asset-content/versions")


@router.get("/api/asset-content/versions/{version_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def get_asset_content_version(
    version_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_content("/api/asset-content/versions/{p}")


@router.patch("/api/asset-content/versions/{version_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_asset_content_version(
    version_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_content("/api/asset-content/versions/{p}")


@router.delete("/api/asset-content/versions/{version_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_asset_content_version(
    version_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_content("/api/asset-content/versions/{p}")


@router.post("/api/asset-content/versions/{version_id}/restore", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def restore_asset_content_version(
    version_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_content("/api/asset-content/versions/{p}/restore")


@router.get("/api/asset-file-info", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def get_asset_file_info(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_local("/api/asset-file-info")


@router.post("/api/asset-file-reveal", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def reveal_asset_file(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/asset-file-reveal")


# ---------------------------------------------------------------------------
# 素材库扩展写入（顺序：静态路径先于动态路径）
# ---------------------------------------------------------------------------

@router.patch("/api/asset-library/categories/{category_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def rename_asset_library_category(
    category_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/categories/{p}", "素材库分类修改")


@router.delete("/api/asset-library/categories/{category_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_asset_library_category(
    category_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/categories/{p}", "素材库分类删除")


@router.post("/api/asset-library/items/batch", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_asset_library_items_batch(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/batch", "素材批量导入")


@router.post("/api/asset-library/items/classify", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def classify_asset_library_items(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/classify", "素材分类写入")


@router.post("/api/asset-library/items/delete", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_asset_library_items(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/delete", "素材批量删除")


@router.post("/api/asset-library/items/move", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def move_asset_library_items(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/move", "素材批量移动")


@router.patch("/api/asset-library/items/{item_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_asset_library_item(
    item_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/{p}", "素材条目修改")


@router.delete("/api/asset-library/items/{item_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_asset_library_item(
    item_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/{p}", "素材条目删除")


@router.post("/api/asset-library/items/{item_id}/avatar-status", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def check_asset_avatar_status(
    item_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/{p}/avatar-status", "素材头像状态")


@router.post("/api/asset-library/items/{item_id}/register-avatar", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def register_asset_avatar(
    item_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/items/{p}/register-avatar", "素材头像注册")


@router.patch("/api/asset-library/libraries/{library_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def rename_asset_library(
    library_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/libraries/{p}", "素材库修改")


@router.delete("/api/asset-library/libraries/{library_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_asset_library(
    library_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/libraries/{p}", "素材库删除")


@router.post("/api/asset-library/workflows/upload", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def upload_asset_library_workflows(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_asset("/api/asset-library/workflows/upload", "素材工作流上传")
