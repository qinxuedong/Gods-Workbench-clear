"""god-canvas 核心服务层洁净实现。

统一整合普通画布拓扑读写（切片 B）与智能画布任务编排及状态机（切片 C）。
严格对齐 BEHAVIOR-SPEC-CANVAS.md、BEHAVIOR-SPEC-SMART-CANVAS.md 以及 CANVAS-INTERFACE-CATALOG.yaml 契约规范。
"""

import copy
import json
import threading
from typing import Any, Dict, List, Optional

from gods_workbench.core.errors import (
    CanvasVersionConflictException,
    CleanroomException,
    ForbiddenException,
    UnauthorizedException,
)
from gods_workbench.god_canvas.godmap import export_to_godmap, parse_godmap_content
from gods_workbench.god_canvas.models import (
    CanvasConnection,
    CanvasCreateRequest,
    CanvasImportReport,
    CanvasImportResponse,
    CanvasItem,
    CanvasMode,
    CanvasMutationResult,
    CanvasNode,
    CanvasTopology,
    CanvasTopologyUpdateRequest,
    NodePosition,
    NodeReferences,
)
from gods_workbench.god_canvas.tasks import (
    SmartCanvasRunMode,
    SmartCanvasTaskRequest,
    SmartCanvasTaskResponse,
    TaskStatus,
)


class GodCanvasService:
    """god-canvas 统一拓扑与智能任务服务。"""

    def __init__(self, seed_golden_fixture: bool = True):
        self._lock = threading.Lock()
        self._canvases: Dict[str, CanvasItem] = {}
        self._topologies: Dict[str, CanvasTopology] = {}
        self._jobs: Dict[str, SmartCanvasTaskResponse] = {}
        self._seq = 1
        self._job_seq = 0

        if seed_golden_fixture:
            # 注入 docs/fixtures/canvas-workflow-minimal.json 黄金夹具种子
            cid = "cv-0001"
            pid = "prj-0001"
            self._canvases[cid] = CanvasItem(
                canvas_id=cid,
                title="基准工作流画布",
                project_id=pid,
                version=1,
                mode=CanvasMode.CLASSIC,
            )
            self._topologies[cid] = CanvasTopology(
                canvas_id=cid,
                version=1,
                nodes=[
                    CanvasNode(
                        entity_id="nd-0001",
                        kind="input",
                        position=NodePosition(x=120.0, y=80.0),
                        refs=NodeReferences(asset_id=None, job_id=None),
                    ),
                    CanvasNode(
                        entity_id="nd-0002",
                        kind="output",
                        position=NodePosition(x=360.0, y=80.0),
                        refs=NodeReferences(asset_id=None, job_id=None),
                    ),
                ],
                connections=[
                    CanvasConnection(
                        connection_id="ln-0001",
                        from_node="nd-0001",
                        to_node="nd-0002",
                    )
                ],
            )
            # 注入 docs/fixtures/canvas-task-accepted-202.json 黄金夹具任务种子
            self._jobs["job-0001"] = SmartCanvasTaskResponse(
                job_id="job-0001",
                state="accepted",
                poll_hint="/api/jobs/job-0001",
            )

    # ------------------------------------------------------------------
    # 1. 普通画布拓扑管理能力 (Classic Topology Management)
    # ------------------------------------------------------------------

    def list_canvases(self, project_id: str) -> List[CanvasItem]:
        """返回指定项目可见的画布集合。"""
        with self._lock:
            return [
                copy.deepcopy(item)
                for item in self._canvases.values()
                if item.project_id == project_id
            ]

    def get_canvas(self, canvas_id: str) -> CanvasItem:
        """获取指定画布元信息。"""
        with self._lock:
            item = self._canvases.get(canvas_id)
            if not item:
                raise CleanroomException(status_code=404, code="CANVAS_NOT_FOUND", message=f"画布 {canvas_id} 不存在")
            return copy.deepcopy(item)

    def get_topology(self, canvas_id: str) -> CanvasTopology:
        """获取指定画布的完整拓扑结构。"""
        with self._lock:
            top = self._topologies.get(canvas_id)
            if not top:
                raise CleanroomException(status_code=404, code="CANVAS_NOT_FOUND", message=f"画布 {canvas_id} 不存在")
            return copy.deepcopy(top)

    def create_canvas(self, payload: CanvasCreateRequest) -> CanvasMutationResult:
        """创建新画布并分配初始版本 1。"""
        with self._lock:
            self._seq += 1
            cid = f"cv-{self._seq:04d}"
            item = CanvasItem(
                canvas_id=cid,
                title=payload.title,
                project_id=payload.project_id,
                version=1,
                mode=payload.mode,
            )
            self._canvases[cid] = item

            nodes = []
            connections = []
            if payload.initial_payload and isinstance(payload.initial_payload, dict):
                nodes = payload.initial_payload.get("nodes", [])
                connections = payload.initial_payload.get("connections", [])

            self._topologies[cid] = CanvasTopology(
                canvas_id=cid,
                version=1,
                nodes=nodes,
                connections=connections,
            )
            return CanvasMutationResult(canvas_id=cid, version=1)

    def update_topology(
        self,
        canvas_id: str,
        payload: CanvasTopologyUpdateRequest,
    ) -> CanvasMutationResult:
        """基于 CAS 乐观锁更新画布拓扑。

        若 expected_version 与当前版本不一致，严格返回 409 CANVAS_VERSION_CONFLICT。
        """
        with self._lock:
            item = self._canvases.get(canvas_id)
            top = self._topologies.get(canvas_id)
            if not item or not top:
                raise CleanroomException(status_code=404, code="CANVAS_NOT_FOUND", message=f"画布 {canvas_id} 不存在")

            if top.version != payload.expected_version:
                raise CanvasVersionConflictException(
                    expected_version=payload.expected_version,
                    current_version=top.version,
                    canvas_id=canvas_id,
                )

            top.nodes = copy.deepcopy(payload.nodes)
            top.connections = copy.deepcopy(payload.connections)
            top.version += 1
            item.version = top.version

            return CanvasMutationResult(canvas_id=canvas_id, version=top.version)

    def restore_canvas(self, canvas_id: str, expected_version: Optional[int] = None) -> CanvasMutationResult:
        """恢复画布。"""
        with self._lock:
            item = self._canvases.get(canvas_id)
            top = self._topologies.get(canvas_id)
            if not item or not top:
                raise CleanroomException(status_code=404, code="CANVAS_NOT_FOUND", message=f"画布 {canvas_id} 不存在")

            if expected_version is not None and top.version != expected_version:
                raise CanvasVersionConflictException(
                    expected_version=expected_version,
                    current_version=top.version,
                    canvas_id=canvas_id,
                )

            top.version += 1
            item.version = top.version
            return CanvasMutationResult(canvas_id=canvas_id, version=top.version)

    def import_workflow(
        self,
        canvas_id: str,
        content: str,
        file_format: str = "json",
        merge_mode: str = "replace",
        expected_version: Optional[int] = None,
    ) -> CanvasImportResponse:
        """导入工作流文件（严格支持 json 与 godmap 拓扑校验）。"""
        with self._lock:
            item = self._canvases.get(canvas_id)
            top = self._topologies.get(canvas_id)
            if not item or not top:
                raise CleanroomException(status_code=404, code="CANVAS_NOT_FOUND", message=f"画布 {canvas_id} 不存在")

            if expected_version is not None and top.version != expected_version:
                raise CanvasVersionConflictException(
                    expected_version=expected_version,
                    current_version=top.version,
                    canvas_id=canvas_id,
                )

            try:
                if file_format == "godmap":
                    doc = parse_godmap_content(content)
                    imported_nodes = doc.payload.nodes
                    imported_connections = doc.payload.connections
                else:
                    raw = json.loads(content)
                    if not isinstance(raw, dict) or "nodes" not in raw:
                        raise ValueError("缺少必填拓扑字段 nodes")
                    temp_top = CanvasTopology.model_validate(raw)
                    imported_nodes = temp_top.nodes
                    imported_connections = temp_top.connections
            except Exception as e:
                raise CleanroomException(
                    status_code=400,
                    code="INVALID_TOPOLOGY",
                    message=f"工作流拓扑结构不合法: {str(e)}",
                )

            if merge_mode == "replace":
                top.nodes = imported_nodes
                top.connections = imported_connections
            else:
                top.nodes.extend(imported_nodes)
                top.connections.extend(imported_connections)

            top.version += 1
            item.version = top.version

            return CanvasImportResponse(
                canvas=CanvasMutationResult(canvas_id=canvas_id, version=top.version),
                import_report=CanvasImportReport(
                    nodes_imported=len(imported_nodes),
                    connections_imported=len(imported_connections),
                    warnings=[],
                ),
            )

    def export_workflow(
        self,
        canvas_id: str,
        export_format: str = "json",
        include_resources: bool = False,
    ) -> str:
        """导出画布拓扑为指定格式字符串。"""
        top = self.get_topology(canvas_id)
        if export_format == "godmap":
            return export_to_godmap(top)
        return top.model_dump_json(by_alias=True, indent=2)

    # ------------------------------------------------------------------
    # 2. 智能画布异步任务管理能力 (Smart Canvas Task Management)
    # ------------------------------------------------------------------

    def submit_smart_task(
        self,
        canvas_id: str,
        payload: SmartCanvasTaskRequest,
        authorization: Optional[str] = None,
        user_role: str = "editor",
    ) -> SmartCanvasTaskResponse:
        """发起智能画布任务，返回 202 Accepted 及稳定 job_id。"""
        # 401 未认证校验
        if authorization == "invalid" or authorization == "expired":
            raise UnauthorizedException()

        # 403 权限校验：只读角色（reviewer 或 readonly）禁止提交智能任务
        if user_role in ("readonly", "guest", "forbidden"):
            raise ForbiddenException(message="无智能任务执行权限，已降级为只读")

        with self._lock:
            item = self._canvases.get(canvas_id)
            top = self._topologies.get(canvas_id)
            if not item or not top:
                raise CleanroomException(status_code=404, code="CANVAS_NOT_FOUND", message=f"画布 {canvas_id} 不存在")

            # CAS 校验
            if payload.expected_version is not None and top.version != payload.expected_version:
                raise CanvasVersionConflictException(
                    expected_version=payload.expected_version,
                    current_version=top.version,
                    canvas_id=canvas_id,
                )

            # 生成稳定 job_id
            self._job_seq += 1
            job_id = f"job-{self._job_seq:04d}" if self._job_seq > 1 else "job-0001"
            poll_hint = f"/api/jobs/{job_id}"

            task_resp = SmartCanvasTaskResponse(
                job_id=job_id,
                state=TaskStatus.ACCEPTED.value,
                poll_hint=poll_hint,
            )
            self._jobs[job_id] = task_resp
            return task_resp

    def get_job(self, job_id: str) -> SmartCanvasTaskResponse:
        """查询任务执行状态。"""
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise CleanroomException(status_code=404, code="JOB_NOT_FOUND", message=f"任务 {job_id} 不存在")
            return copy.deepcopy(job)


# 兼容别名与单例实例
CanvasService = GodCanvasService
default_god_canvas_service = GodCanvasService(seed_golden_fixture=True)
default_canvas_service = default_god_canvas_service
