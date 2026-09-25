# -*- coding: utf-8 -*-
"""Phase 11 B3 素材注册表 API。

该模块只暴露当前洁净室可证明的注册表空态与状态读接口；文件、媒体、远程资源、
索引和治理写操作均通过统一 503 失败关闭，不伪造成功结果。
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Header, Query, Request, status

from gods_workbench.asset_registry.service import (
    DATA_STATUS_NOT_INTEGRATED,
    _not_integrated,
    default_asset_registry_service,
)
from gods_workbench.core.auth import require_authenticated, require_edit_access, require_governance_access

router = APIRouter(prefix="/api/asset-registry", tags=["asset-registry"])


def _read_auth(authorization: Optional[str], x_user_role: str):
    """统一读取权限检查。"""
    return require_authenticated(authorization, x_user_role)


def _edit_auth(authorization: Optional[str], x_user_role: str):
    """统一编辑权限检查。"""
    return require_edit_access(authorization, x_user_role)


def _governance_auth(authorization: Optional[str], x_user_role: str):
    """统一治理权限检查。"""
    return require_governance_access(authorization, x_user_role)


def _reject(endpoint: str, *, kind: str = "asset_registry") -> None:
    """显式拒绝未准入能力。"""
    gap = {
        "media": "media_storage_not_connected",
        "remote": "remote_asset_source_not_connected",
        "index": "asset_index_not_connected",
        "file": "local_file_access_not_admitted",
        "governance": "governance_store_not_connected",
    }.get(kind, "asset_registry_source_not_connected")
    _not_integrated(endpoint, gap=gap)


# ---------------------------------------------------------------------------
# 只读真值接口
# ---------------------------------------------------------------------------


@router.get("", summary="读取素材注册表总览", status_code=status.HTTP_200_OK)
def get_registry_root(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.root_snapshot()


@router.get("/status", summary="读取素材注册表状态", status_code=status.HTTP_200_OK)
def get_registry_status(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.status()


@router.get("/assets", summary="分页读取素材登记", status_code=status.HTTP_200_OK)
def list_registry_assets(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    cursor: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    view: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    archived: Optional[bool] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.list_assets(
        limit=limit, offset=offset, cursor=cursor, sort=sort, view=view, query=query,
        project_id=project_id, kind=kind, category=category, tag=tag, archived=archived,
    )


@router.get("/assets/{asset_id}", summary="读取素材登记详情", status_code=status.HTTP_200_OK)
def get_registry_asset(
    asset_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return {"asset": default_asset_registry_service.get_asset(asset_id)}


@router.get("/assets/{asset_id}/image-versions", summary="读取素材图片版本", status_code=status.HTTP_200_OK)
def list_image_versions(
    asset_id: str,
    limit: int = Query(500, ge=1, le=500),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.image_versions(asset_id, limit=limit)


@router.get("/assets/{asset_id}/image-versions/{version_id}/media", summary="读取图片版本媒体", status_code=status.HTTP_200_OK)
def get_image_version_media(
    asset_id: str,
    version_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/image-versions/{version_id}/media", kind="media")


@router.get("/assets/{asset_id}/media", summary="读取素材媒体", status_code=status.HTTP_200_OK)
def get_asset_media(
    asset_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/media", kind="media")


@router.get("/assets/{asset_id}/video/frame", summary="读取视频帧", status_code=status.HTTP_200_OK)
def get_video_frame(
    asset_id: str,
    at: Optional[float] = Query(None, ge=0),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/video/frame", kind="media")


@router.get("/assets/{asset_id}/video/storyboard", summary="读取视频分镜", status_code=status.HTTP_200_OK)
def get_video_storyboard(
    asset_id: str,
    version: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/video/storyboard", kind="media")


@router.get("/facets", summary="读取素材筛选维度", status_code=status.HTTP_200_OK)
def get_registry_facets(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.facets()


@router.get("/folders", summary="读取素材文件夹登记", status_code=status.HTTP_200_OK)
def get_registry_folders(
    root_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.folders(root_id)


@router.get("/governance/overview", summary="读取治理回收概览", status_code=status.HTTP_200_OK)
def get_governance_overview(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    return default_asset_registry_service.governance_overview()


@router.get("/governance/cascade-preview", summary="读取级联影响预览", status_code=status.HTTP_200_OK)
def get_cascade_preview(
    target_type: str = Query(..., min_length=1),
    target_id: str = Query(..., min_length=1),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    # 当前没有可证明的实体关系，空影响集是事实，不是成功执行级联操作。
    return {
        "target_type": target_type,
        "target_id": target_id,
        "impact": {"assets": [], "projects": [], "canvases": [], "total": 0},
        "data_status": DATA_STATUS_NOT_INTEGRATED,
        "data_gaps": ["governance_store_not_connected"],
    }


@router.get("/preferences/team", summary="读取团队素材偏好", status_code=status.HTTP_200_OK)
def get_team_preferences(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.preferences()


@router.get("/presets", summary="读取素材预设", status_code=status.HTTP_200_OK)
def get_registry_presets(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return {"presets": [], "revision": 1, "data_status": "ok", "data_gaps": []}


@router.get("/project-directory-templates", summary="读取项目目录模板", status_code=status.HTTP_200_OK)
def get_project_directory_templates(
    project_type: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.templates(project_type)


@router.get("/recycle-bin", summary="读取素材回收站", status_code=status.HTTP_200_OK)
def get_recycle_bin(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.recycle_bin()


@router.get("/remote-assets", summary="读取远程素材登记", status_code=status.HTTP_200_OK)
def get_remote_assets(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return {"remote_assets": [], "data_status": DATA_STATUS_NOT_INTEGRATED, "data_gaps": ["remote_asset_source_not_connected"]}


@router.get("/workspace-jobs/{job_id}", summary="读取工作区任务", status_code=status.HTTP_200_OK)
def get_workspace_job(
    job_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    return default_asset_registry_service.workspace_job(job_id)


# ---------------------------------------------------------------------------
# 需要真实资源/写入能力的端点：先过权限边界，再统一 503。
# ---------------------------------------------------------------------------


@router.post("/assets/archive", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def archive_registry_assets(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/assets/archive")


@router.post("/assets/export-pdf", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def export_registry_pdf(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    _reject("/api/asset-registry/assets/export-pdf", kind="media")


@router.post("/assets/import", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def import_registry_assets(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/assets/import", kind="file")


@router.post("/assets/relations", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_asset_relation(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/assets/relations")


@router.post("/assets/resolve-reference", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def resolve_asset_reference(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _read_auth(authorization, x_user_role)
    _reject("/api/asset-registry/assets/resolve-reference")


@router.post("/assets/tags", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def add_asset_tags(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/assets/tags")


@router.patch("/assets/{asset_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_registry_asset(
    asset_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}")


@router.delete("/assets/{asset_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_registry_asset(
    asset_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}")


@router.post("/assets/{asset_id}/image-versions", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_image_version(
    asset_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/image-versions", kind="media")


@router.patch("/assets/{asset_id}/image-versions/{version_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_image_version(
    asset_id: str,
    version_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/image-versions/{version_id}", kind="media")


@router.delete("/assets/{asset_id}/image-versions/{version_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_image_version(
    asset_id: str,
    version_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/image-versions/{version_id}", kind="media")


@router.post("/assets/{asset_id}/open-local", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def open_asset_local(
    asset_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/open-local", kind="file")


@router.delete("/assets/{asset_id}/relations/{related_asset_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_asset_relation(
    asset_id: str,
    related_asset_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/relations/{related_asset_id}")


@router.delete("/assets/{asset_id}/tags/{tag_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_asset_tag(
    asset_id: str,
    tag_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/tags/{tag_id}")


@router.post("/assets/{asset_id}/video/clip", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_video_clip(
    asset_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/assets/{asset_id}/video/clip", kind="media")


@router.post("/folders", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_registry_folder(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/folders", kind="file")


@router.post("/governance/asset-trash/{entry_id}/restore", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def restore_asset_trash(
    entry_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/governance/asset-trash/{entry_id}/restore", kind="governance")


@router.post("/governance/assets/{asset_id}/restore", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def restore_asset(
    asset_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/governance/assets/{asset_id}/restore", kind="governance")


@router.post("/governance/audit-outbox/reconcile", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def reconcile_audit_outbox(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject("/api/asset-registry/governance/audit-outbox/reconcile", kind="governance")


@router.post("/governance/canvases/purge-expired", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def purge_expired_canvases(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject("/api/asset-registry/governance/canvases/purge-expired", kind="governance")


@router.post("/governance/canvases/{canvas_id}/restore", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def restore_canvas(
    canvas_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/governance/canvases/{canvas_id}/restore", kind="governance")


@router.post("/governance/operations", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def execute_governance_operation(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject("/api/asset-registry/governance/operations", kind="governance")


@router.post("/index/sync", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def sync_asset_index(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/index/sync", kind="index")


@router.patch("/preferences/team", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_team_preferences(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/preferences/team")


@router.post("/presets", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_registry_preset(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/presets")


@router.delete("/presets/{preset_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_registry_preset(
    preset_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/presets/{preset_id}")


@router.post("/project-directory-templates", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_directory_template(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/project-directory-templates", kind="file")


@router.patch("/project-directory-templates/{template_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_directory_template(
    template_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/project-directory-templates/{template_id}", kind="file")


@router.post("/project-directory-templates/{template_id}/archive", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def archive_directory_template(
    template_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/project-directory-templates/{template_id}/archive", kind="file")


@router.post("/project-directory-templates/{template_id}/default", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def set_default_directory_template(
    template_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/project-directory-templates/{template_id}/default", kind="file")


@router.patch("/project-entities/{entity_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_project_entity(
    entity_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/project-entities/{entity_id}")


@router.patch("/project-gates/{gate_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_project_gate(
    gate_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/project-gates/{gate_id}")


@router.post("/project-recycle/{project_id}/restore", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def restore_project_recycle(
    project_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/project-recycle/{project_id}/restore", kind="governance")


@router.post("/projects/{project_id}/assets", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def link_project_assets(
    project_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/projects/{project_id}/assets")


@router.post("/projects/{project_id}/entities", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_project_entity(
    project_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/projects/{project_id}/entities")


@router.post("/recycle-bin/{entry_id}/restore", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def restore_recycle_entry(
    entry_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _governance_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/recycle-bin/{entry_id}/restore", kind="governance")


@router.post("/reindex", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def reindex_registry(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/reindex", kind="index")


@router.post("/remote-assets", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def create_remote_asset(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/remote-assets", kind="remote")


@router.delete("/remote-assets/{asset_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def delete_remote_asset(
    asset_id: str,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/remote-assets/{asset_id}", kind="remote")


@router.patch("/settings/features/{feature_id}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_registry_feature(
    feature_id: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    default_asset_registry_service.assert_feature_id(feature_id)
    _reject(f"/api/asset-registry/settings/features/{feature_id}")


@router.patch("/settings/index-automation", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def update_index_automation(
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject("/api/asset-registry/settings/index-automation", kind="index")


@router.post("/workspace-jobs/{job_id}/{action}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
def operate_workspace_job(
    job_id: str,
    action: str,
    payload: Optional[Dict[str, Any]] = Body(None),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    _edit_auth(authorization, x_user_role)
    _reject(f"/api/asset-registry/workspace-jobs/{job_id}/{action}")


__all__ = ["router"]
