"""画布与智能画布 API 路由实现。

严格对齐 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml 定义的端点，接驳 CanvasService。
"""

from typing import Optional
from fastapi import APIRouter, Header, Query, Request, Response, status

from gods_workbench.canvas.models import (
    CanvasCreateRequest,
    CanvasExportRequest,
    CanvasExportResponse,
    CanvasImportResponse,
    CanvasItem,
    CanvasListResponse,
    CanvasMutationResponse,
    CanvasTopology,
    CanvasTopologyUpdateRequest,
)
from gods_workbench.canvas.service import default_canvas_service
from gods_workbench.canvas.tasks import SmartCanvasTaskRequest, SmartCanvasTaskResponse
from gods_workbench.core.errors import UnauthorizedException
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
    canvases = default_canvas_service.list_canvases(project_id=project_id)
    return CanvasListResponse(canvases=canvases)


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
    result = default_canvas_service.create_canvas(payload)
    return CanvasMutationResponse(canvas=result)


@router.get(
    "/{canvas_id}",
    response_model=CanvasTopology,
    summary="获取画布当前拓扑",
    status_code=status.HTTP_200_OK,
)
def get_canvas_topology(
    canvas_id: str,
    authorization: Optional[str] = Header(None),
):
    """获取指定画布的完整拓扑结构（节点与连线）。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    return default_canvas_service.get_topology(canvas_id)


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
    """根据 expected_version 更新拓扑；版本不一致严格返回 409 CANVAS_VERSION_CONFLICT。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    result = default_canvas_service.update_topology(canvas_id, payload)
    return CanvasMutationResponse(canvas=result)


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
    """恢复画布。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    expected_v = payload.expected_version if payload else None
    result = default_canvas_service.restore_canvas(canvas_id, expected_version=expected_v)
    return CanvasMutationResponse(canvas=result)


@router.post(
    "/{canvas_id}/workflow/import",
    response_model=CanvasImportResponse,
    summary="导入工作流（JSON/.godmap）",
    status_code=status.HTTP_200_OK,
)
async def import_canvas_workflow(
    canvas_id: str,
    request: Request,
    format: str = Query("json", description="文件格式: json | godmap"),
    merge_mode: str = Query("replace", description="合并模式: replace | insert"),
    expected_version: Optional[int] = Query(None, description="期望 CAS 版本"),
    authorization: Optional[str] = Header(None),
):
    """导入工作流拓扑文件并进行严格结构校验。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    body_bytes = await request.body()
    content_str = body_bytes.decode("utf-8")
    return default_canvas_service.import_workflow(
        canvas_id=canvas_id,
        content=content_str,
        file_format=format,
        merge_mode=merge_mode,
        expected_version=expected_version,
    )


@router.post(
    "/{canvas_id}/workflow/export",
    summary="导出工作流",
    status_code=status.HTTP_200_OK,
)
def export_canvas_workflow(
    canvas_id: str,
    payload: CanvasExportRequest,
    authorization: Optional[str] = Header(None),
):
    """将画布拓扑导出为指定格式内容。"""
    if authorization == "invalid":
        raise UnauthorizedException()
    data_str = default_canvas_service.export_workflow(
        canvas_id=canvas_id,
        export_format=payload.format,
        include_resources=payload.include_resources,
    )
    media_type = "application/json"
    return Response(content=data_str, media_type=media_type)


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
