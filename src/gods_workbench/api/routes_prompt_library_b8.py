# -*- coding: utf-8 -*-
"""Phase 11 B8 提示词条目洁净室边界。"""
from typing import Optional
from fastapi import APIRouter, Header, Request
from gods_workbench.asset_library.b4_service import unavailable
from gods_workbench.core.auth import require_edit_access
router=APIRouter(tags=["prompt-library-b8"])
def fail(e:str,a:Optional[str],role:str): require_edit_access(a,role); unavailable(e,"提示词条目能力",code="PROMPT_LIBRARY_ITEMS_NOT_INTEGRATED")
@router.post("/api/prompt-libraries/items",status_code=503)
def create_item(request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): fail("/api/prompt-libraries/items",authorization,x_user_role)
@router.patch("/api/prompt-libraries/items/{item_id}",status_code=503)
def update_item(item_id:str,request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): fail("/api/prompt-libraries/items/{p}",authorization,x_user_role)
@router.delete("/api/prompt-libraries/items/{item_id}",status_code=503)
def delete_item(item_id:str,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): fail("/api/prompt-libraries/items/{p}",authorization,x_user_role)
@router.post("/api/prompt-libraries/items/delete",status_code=503)
def delete_items(request:Request,authorization:Optional[str]=Header(None),x_user_role:str=Header("editor",alias="X-User-Role")): fail("/api/prompt-libraries/items/delete",authorization,x_user_role)
