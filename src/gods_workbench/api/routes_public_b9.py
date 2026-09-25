# -*- coding: utf-8 -*-
"""Phase 11 B9 分享与公开访问洁净室边界。"""
from fastapi import APIRouter, Header, Request
from typing import Optional
from gods_workbench.asset_library.b4_service import unavailable
router=APIRouter(tags=["public-share-b9"])
def fail(e:str): unavailable(e,"公开分享能力",code="PUBLIC_SHARE_NOT_INTEGRATED")
@router.get("/api/public/shares/{share_token}",status_code=503)
def get_share(share_token:str): fail("/api/public/shares/{p}")
@router.post("/api/public/shares/{share_token}/access",status_code=503)
def access_share(share_token:str,request:Request): fail("/api/public/shares/{p}/access")
@router.put("/api/public/shares/{share_token}/approvals",status_code=503)
def approve_share(share_token:str,request:Request): fail("/api/public/shares/{p}/approvals")
@router.post("/api/public/shares/{share_token}/comments",status_code=503)
def comment_share(share_token:str,request:Request): fail("/api/public/shares/{p}/comments")
