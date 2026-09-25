# -*- coding: utf-8 -*-
"""Phase 11 B4 本地素材与存储文件路由。

本仓库不获得任意本机文件访问授权；所有本地文件、上传、分类、内容和存储
副作用在认证后明确返回 503，不读取请求中的路径，也不产生伪造结果。
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header, Request, status

from gods_workbench.asset_library.b4_service import unavailable
from gods_workbench.core.auth import require_authenticated, require_edit_access

router = APIRouter(tags=["local-assets-b4"])


def _read(authorization: Optional[str], x_user_role: str):
    return require_authenticated(authorization, x_user_role)


def _write(authorization: Optional[str], x_user_role: str):
    return require_edit_access(authorization, x_user_role)


def _fail_local(endpoint: str, capability: str = "本地素材能力") -> None:
    unavailable(endpoint, capability, code="LOCAL_ASSETS_NOT_INTEGRATED")


def _fail_storage(endpoint: str, capability: str = "存储文件能力") -> None:
    unavailable(endpoint, capability, code="STORAGE_FILES_NOT_INTEGRATED")


@router.get("/api/local-assets", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def list_local_assets(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_local("/api/local-assets")


@router.post("/api/local-assets/caption", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def caption_local_assets(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/caption", "本地素材描述生成")


@router.patch("/api/local-assets/caption", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def save_local_asset_caption(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/caption", "本地素材描述保存")


@router.post("/api/local-assets/classify", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def classify_local_assets(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/classify", "本地素材分类")


@router.post("/api/local-assets/delete", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_local_assets(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/delete", "本地素材删除")


@router.post("/api/local-assets/folders", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_local_asset_folder(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/folders", "本地素材目录创建")


@router.patch("/api/local-assets/folders", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_local_asset_folder(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/folders", "本地素材目录修改")


@router.patch("/api/local-assets/items", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_local_asset(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/items", "本地素材修改")


@router.post("/api/local-assets/move", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def move_local_assets(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/move", "本地素材移动")


@router.post("/api/local-assets/upload", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def upload_local_assets(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_local("/api/local-assets/upload", "本地素材上传")


@router.get("/api/storage-files", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def list_storage_files(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read(authorization, x_user_role)
    _fail_storage("/api/storage-files")


@router.post("/api/storage-files/delete", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_storage_files(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _write(authorization, x_user_role)
    _fail_storage("/api/storage-files/delete", "存储文件删除")
