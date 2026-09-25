# -*- coding: utf-8 -*-
"""Phase 11 B5 媒体与缩略图接口。"""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Header, Request, status
from gods_workbench.asset_library.b4_service import unavailable
from gods_workbench.core.auth import require_authenticated, require_edit_access
router = APIRouter(tags=["media-b5"])
def _read(a: Optional[str], r: str): return require_authenticated(a, r)
def _write(a: Optional[str], r: str): return require_edit_access(a, r)
def _fail(endpoint: str): unavailable(endpoint, "媒体与缩略图能力", code="MEDIA_NOT_INTEGRATED")

def _get(endpoint: str, authorization: Optional[str], x_user_role: str):
    _read(authorization, x_user_role); _fail(endpoint)
def _write_route(endpoint: str, authorization: Optional[str], x_user_role: str):
    _write(authorization, x_user_role); _fail(endpoint)

@router.get("/api/asset-proxy/settings", status_code=503)
def get_proxy_settings(authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _get("/api/asset-proxy/settings", authorization, x_user_role)
@router.patch("/api/asset-proxy/settings", status_code=503)
def patch_proxy_settings(request: Request, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _write_route("/api/asset-proxy/settings", authorization, x_user_role)
@router.get("/api/asset-thumbnails/settings", status_code=503)
def get_thumb_settings(authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _get("/api/asset-thumbnails/settings", authorization, x_user_role)
@router.patch("/api/asset-thumbnails/settings", status_code=503)
def patch_thumb_settings(request: Request, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _write_route("/api/asset-thumbnails/settings", authorization, x_user_role)
@router.post("/api/asset-thumbnails/delete", status_code=503)
def delete_thumbs(request: Request, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _write_route("/api/asset-thumbnails/delete", authorization, x_user_role)
@router.post("/api/asset-thumbnails/delete-storyboards", status_code=503)
def delete_storyboards(request: Request, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _write_route("/api/asset-thumbnails/delete-storyboards", authorization, x_user_role)
@router.post("/api/asset-thumbnails/generate", status_code=503)
def generate_thumbs(request: Request, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _write_route("/api/asset-thumbnails/generate", authorization, x_user_role)
@router.post("/api/asset-thumbnails/generate-background", status_code=503)
def generate_thumbs_background(request: Request, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _write_route("/api/asset-thumbnails/generate-background", authorization, x_user_role)
@router.get("/api/asset-thumbnails/jobs/{job_id}", status_code=503)
def get_thumb_job(job_id: str, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _get("/api/asset-thumbnails/jobs/{p}", authorization, x_user_role)
@router.get("/api/audio-waveform-data", status_code=503)
def waveform(authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _get("/api/audio-waveform-data", authorization, x_user_role)
@router.get("/api/download-output", status_code=503)
def download_output(authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _get("/api/download-output", authorization, x_user_role)
@router.get("/api/media-preview", status_code=503)
def media_preview(authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _get("/api/media-preview", authorization, x_user_role)
@router.get("/api/media-transcode", status_code=503)
def media_transcode(authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _get("/api/media-transcode", authorization, x_user_role)
@router.post("/api/online-image", status_code=503)
def online_image(request: Request, authorization: Optional[str]=Header(None), x_user_role: str=Header("editor", alias="X-User-Role")): _write_route("/api/online-image", authorization, x_user_role)
