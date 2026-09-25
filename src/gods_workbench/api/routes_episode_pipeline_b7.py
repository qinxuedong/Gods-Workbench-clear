# -*- coding: utf-8 -*-
"""Phase 11 B7 剧集流水线洁净室边界。"""
from typing import Optional
from fastapi import APIRouter, Header, Request
from gods_workbench.asset_library.b4_service import unavailable
from gods_workbench.core.auth import require_authenticated, require_edit_access
router=APIRouter(tags=["episode-pipeline-b7"])
def r(a:Optional[str],role:str): require_authenticated(a,role)
def w(a:Optional[str],role:str): require_edit_access(a,role)
def fail(e:str): unavailable(e,"剧集流水线能力",code="EPISODE_PIPELINE_NOT_INTEGRATED")
@router.get("/api/episode-pipelines",status_code=503)
def list_pipelines(authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): r(authorization,x_user_role); fail("/api/episode-pipelines")
@router.post("/api/episode-pipelines",status_code=503)
def create_pipeline(request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): w(authorization,x_user_role); fail("/api/episode-pipelines")
@router.get("/api/episode-pipelines/{pipeline_id}",status_code=503)
def get_pipeline(pipeline_id:str,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): r(authorization,x_user_role); fail("/api/episode-pipelines/{p}")
@router.post("/api/episode-pipelines/{pipeline_id}/stages/{stage_id}/cancel",status_code=503)
def cancel_stage(pipeline_id:str,stage_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): w(authorization,x_user_role); fail("/api/episode-pipelines/{p}/stages/{p}/cancel")
@router.post("/api/episode-pipelines/{pipeline_id}/stages/{stage_id}/complete",status_code=503)
def complete_stage(pipeline_id:str,stage_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): w(authorization,x_user_role); fail("/api/episode-pipelines/{p}/stages/{p}/complete")
@router.post("/api/episode-pipelines/{pipeline_id}/stages/{stage_id}/start",status_code=503)
def start_stage(pipeline_id:str,stage_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): w(authorization,x_user_role); fail("/api/episode-pipelines/{p}/stages/{p}/start")
