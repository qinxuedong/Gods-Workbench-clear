# -*- coding: utf-8 -*-
"""Phase 11 B6 审查与交付洁净室边界。"""
from typing import Optional
from fastapi import APIRouter, Header, Request
from gods_workbench.asset_library.b4_service import unavailable
from gods_workbench.core.auth import require_authenticated, require_edit_access
router=APIRouter(tags=['asset-review-b6'])
def r(a:Optional[str],role:str): require_authenticated(a,role)
def w(a:Optional[str],role:str): require_edit_access(a,role)
def fail(e:str): unavailable(e,'资产审查与交付能力',code='ASSET_REVIEW_NOT_INTEGRATED')
@router.get('/api/asset-reviews/sessions',status_code=503)
def list_sessions(authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): r(authorization,x_user_role); fail('/api/asset-reviews/sessions')
@router.post('/api/asset-reviews/sessions',status_code=503)
def create_session(request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): w(authorization,x_user_role); fail('/api/asset-reviews/sessions')
@router.get('/api/asset-reviews/sessions/{session_id}',status_code=503)
def get_session(session_id:str,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): r(authorization,x_user_role); fail('/api/asset-reviews/sessions/{p}')
@router.post('/api/asset-reviews/sessions/{session_id}/delivery',status_code=503)
def delivery(session_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): w(authorization,x_user_role); fail('/api/asset-reviews/sessions/{p}/delivery')
@router.post('/api/asset-reviews/deliveries/{delivery_id}/export',status_code=503)
def export_delivery(delivery_id:str,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): w(authorization,x_user_role); fail('/api/asset-reviews/deliveries/{p}/export')
@router.post('/api/asset-reviews/sessions/{session_id}/comments',status_code=503)
def comment(session_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): w(authorization,x_user_role); fail('/api/asset-reviews/sessions/{p}/comments')
@router.put('/api/asset-reviews/sessions/{session_id}/approval',status_code=503)
def approval(session_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): w(authorization,x_user_role); fail('/api/asset-reviews/sessions/{p}/approval')
@router.post('/api/asset-reviews/shares',status_code=503)
def share(request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): w(authorization,x_user_role); fail('/api/asset-reviews/shares')
@router.patch('/api/asset-reviews/comments/{comment_id}',status_code=503)
def update_comment(comment_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header('editor',alias='X-User-Role')): w(authorization,x_user_role); fail('/api/asset-reviews/comments/{p}')
