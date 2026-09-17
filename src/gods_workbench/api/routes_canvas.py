"""画布与智能画布 API 路由骨架。

严格对齐 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml 定义的 7 个端点。
"""

from typing import Optional
from fastapi import APIRouter, File, Form, Header, Query, UploadFile, status

from gods_workbench.canvas.models import (
    CanvasCreateRequest,
    CanvasExportRequest,
    CanvasExportResponse,
    CanvasImportReport,
    CanvasImportResponse,
    CanvasItem,
    CanvasListResponse,
    CanvasMutationResponse,
    CanvasMutationResult,
    CanvasTopologyUpdateRequest,
)
from gods_workbench.canvas.tasks import SmartCanvasTaskRequest, SmartCanvasTaskResponse
from gods_workbench.core.errors import (
    CanvasVersionConflictException,
    ForbiddenException,
    UnauthorizedException,
)
from gods_workbench.projects_hub.models import CasVersionRequest

router = APIRouter(prefix="/api/canvases", tags=["canvas"])


@router.get(
    "",
    response_model=CanvasListResponse,
    summary="获取画布列表",
    status_code=status.HTTP_200_OK,
)
def list_canvases(
    project_id: str = Query(..., description="所属项目 ID"),
    authorization: Optional[str] = Header(None),
):
    """仅返回当前项目可见的画布集合。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    return CanvasListResponse(canvases=[])


@router.post(
    "",
    response_model=CanvasMutationResponse,
    summary="创建画布",
    status_code=status.HTTP_201_CREATED,
)
def create_canvas(
    payload: CanvasCreateRequest,
    authorization: Optional[str] = Header(None),
):
    """创建画布实体并返回稳定 canvas_id。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    return CanvasMutationResponse(
        canvas=CanvasMutationResult(canvas_id="cv-new", version=1)
    )


@router.patch(
    "/{canvas_id}",
    response_model=CanvasMutationResponse,
    summary="更新画布拓扑（CAS）",
    status_code=status.HTTP_200_OK,
)
def update_canvas_topology(
    canvas_id: str,
    payload: CanvasTopologyUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """根据 expected_version 更新拓扑；冲突返回 409。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    return CanvasMutationResponse(
        canvas=CanvasMutationResult(canvas_id=canvas_id, version=payload.expected_version + 1)
    )


@router.post(
    "/{canvas_id}/restore",
    response_model=CanvasMutationResponse,
    summary="恢复画布",
    status_code=status.HTTP_200_OK,
)
def restore_canvas(
    canvas_id: str,
    payload: Optional[CasVersionRequest] = None,
    authorization: Optional[str] = Header(None),
):
    """恢复已删除或只读的画布。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    version = (payload.expected_version + 1) if payload else 1
    return CanvasMutationResponse(
        canvas=CanvasMutationResult(canvas_id=canvas_id, version=version)
    )


@router.post(
    "/{canvas_id}/workflow/import",
    response_model=CanvasImportResponse,
    summary="导入工作流（JSON/.godmap）",
    status_code=status.HTTP_200_OK,
)
def import_canvas_workflow(
    canvas_id: str,
    merge_mode: str = Form("replace"),
    expected_version: Optional[int] = Form(None),
    authorization: Optional[str] = Header(None),
):
    """导入工作流拓扑文件并进行结构校验。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    return CanvasImportResponse(
        canvas=CanvasMutationResult(canvas_id=canvas_id, version=1),
        import_report=CanvasImportReport(nodes_imported=2, connections_imported=1, warnings=[]),
    )


@router.post(
    "/{canvas_id}/workflow/export",
    response_model=CanvasExportResponse,
    summary="导出工作流",
    status_code=status.HTTP_200_OK,
)
def export_canvas_workflow(
    canvas_id: str,
    payload: CanvasExportRequest,
    authorization: Optional[str] = Header(None),
):
    """将画布拓扑导出为指定格式。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    return CanvasExportResponse(
        file_url=f"/downloads/{canvas_id}.{payload.format}",
        content_type="application/json",
    )


@router.post(
    "/{canvas_id}/tasks",
    response_model=SmartCanvasTaskResponse,
    summary="发起智能画布任务",
    status_code=status.HTTP_202_ACCEPTED,
)
def run_smart_canvas_task(
    canvas_id: str,
    payload: SmartCanvasTaskRequest,
    authorization: Optional[str] = Header(None),
):
    """发起异步执行任务并返回 202 Accepted 及 job_id。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    return SmartCanvasTaskResponse(
        job_id="job-0001",
        state="accepted",
        poll_hint="/api/jobs/job-0001",
    )
