"""god-canvas 核心服务层洁净实现。

统一整合普通画布拓扑读写（切片 B）与智能画布任务编排及状态机（切片 C）。
严格对齐 BEHAVIOR-SPEC-CANVAS.md、BEHAVIOR-SPEC-SMART-CANVAS.md 以及 CANVAS-INTERFACE-CATALOG.yaml 契约规范。
"""

import copy
import json
import threading
from typing import Any, Dict, List, Optional

from gods_workbench.core.auth import require_edit_access
from gods_workbench.core.errors import (
    CanvasVersionConflictException,
    CleanroomException,
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
        self._seq = 1 if seed_golden_fixture else 0
        self._job_seq = 1 if seed_golden_fixture else 0

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
            references = None
            if payload.initial_payload and isinstance(payload.initial_payload, dict):
                initial_topology = CanvasTopology(
                    canvas_id=cid,
                    version=1,
                    nodes=payload.initial_payload.get("nodes", []),
                    connections=payload.initial_payload.get("connections", []),
                    references=payload.initial_payload.get("references"),
                )
                nodes = initial_topology.nodes
                connections = initial_topology.connections
                references = initial_topology.references

            self._topologies[cid] = CanvasTopology(
                canvas_id=cid,
                version=1,
                nodes=nodes,
                connections=connections,
                references=references,
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
            top.references = copy.deepcopy(payload.references)
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
                if file_format not in {"json", "godmap"}:
                    raise ValueError("仅支持 json 或 godmap 格式")
                if merge_mode not in {"replace", "insert"}:
                    raise ValueError("仅支持 replace 或 insert 合并模式")
                if file_format == "godmap":
                    doc = parse_godmap_content(content)
                    imported_topology = CanvasTopology(
                        canvas_id=canvas_id,
                        version=top.version,
                        nodes=doc.payload.nodes,
                        connections=doc.payload.connections,
                        references=doc.payload.references,
                    )
                else:
                    raw = json.loads(content)
                    if not isinstance(raw, dict) or "nodes" not in raw:
                        raise ValueError("缺少必填拓扑字段 nodes")
                    imported_topology = CanvasTopology.model_validate(raw)
                imported_nodes = imported_topology.nodes
                imported_connections = imported_topology.connections
                imported_references = imported_topology.references
            except Exception as e:
                raise CleanroomException(
                    status_code=400,
                    code="INVALID_TOPOLOGY",
                    message=f"工作流拓扑结构不合法: {str(e)}",
                )

            if merge_mode == "replace":
                top.nodes = imported_nodes
                top.connections = imported_connections
                top.references = imported_references
            else:
                imported_nodes, imported_connections = self._rekey_insert(
                    top.nodes,
                    top.connections,
                    imported_nodes,
                    imported_connections,
                )
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
        if export_format not in {"json", "godmap"}:
            raise CleanroomException(status_code=400, code="UNSUPPORTED_FORMAT", message="仅支持 json 或 godmap 导出")
        if include_resources:
            raise CleanroomException(status_code=400, code="UNSUPPORTED_OPTION", message="当前洁净切片不内嵌外部资源")
        top = self.get_topology(canvas_id)
        if export_format == "godmap":
            return export_to_godmap(top)
        return top.model_dump_json(by_alias=True, indent=2)

    @staticmethod
    def _rekey_insert(existing_nodes, existing_connections, imported_nodes, imported_connections):
        """为 insert 导入的冲突 ID 分配稳定后缀并重写连线端点。"""
        node_ids = {node.entity_id for node in existing_nodes}
        connection_ids = {connection.connection_id for connection in existing_connections}
        node_map: Dict[str, str] = {}
        rekeyed_nodes = []
        for node in copy.deepcopy(imported_nodes):
            original_id = node.entity_id
            candidate = original_id
            suffix = 1
            while candidate in node_ids:
                candidate = f"{original_id}-import-{suffix}"
                suffix += 1
            node_ids.add(candidate)
            node_map[original_id] = candidate
            node.entity_id = candidate
            rekeyed_nodes.append(node)

        rekeyed_connections = []
        for connection in copy.deepcopy(imported_connections):
            original_id = connection.connection_id
            candidate = original_id
            suffix = 1
            while candidate in connection_ids:
                candidate = f"{original_id}-import-{suffix}"
                suffix += 1
            connection_ids.add(candidate)
            connection.connection_id = candidate
            connection.from_node = node_map.get(connection.from_node, connection.from_node)
            connection.to_node = node_map.get(connection.to_node, connection.to_node)
            rekeyed_connections.append(connection)
        return rekeyed_nodes, rekeyed_connections

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
        # 服务层也保留写权限边界，避免绕过 HTTP 路由直接提交任务。
        require_edit_access(authorization, user_role)

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

            node_ids = {node.entity_id for node in top.nodes}
            missing_entry_nodes = [node_id for node_id in payload.entry_nodes if node_id not in node_ids]
            if missing_entry_nodes:
                raise CleanroomException(
                    status_code=409,
                    code="TASK_PRECONDITION_FAILED",
                    message=f"任务入口节点不存在: {', '.join(missing_entry_nodes)}",
                )

            # 生成稳定 job_id
            self._job_seq += 1
            job_id = f"job-{self._job_seq:04d}"
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

    def update_job_state(
        self,
        job_id: str,
        state: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> SmartCanvasTaskResponse:
        """推进任务状态机状态（线程安全）。"""
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise CleanroomException(status_code=404, code="JOB_NOT_FOUND", message=f"任务 {job_id} 不存在")

            # 终端状态不可再变更
            allowed_transitions = {
                "accepted": {"running", "cancelled"},
                "running": {"completed", "failed", "cancelled"},
            }
            terminal_states = {"completed", "failed", "cancelled"}
            if job.state in terminal_states:
                raise CleanroomException(
                    status_code=400,
                    code="ILLEGAL_STATE_TRANSITION",
                    message=f"任务 {job_id} 当前已处于终端状态 {job.state}，不可流转至 {state}",
                )

            if state not in allowed_transitions.get(job.state, set()):
                raise CleanroomException(
                    status_code=400,
                    code="ILLEGAL_STATE_TRANSITION",
                    message=f"任务 {job_id} 不允许从 {job.state} 流转至 {state}",
                )

            job.state = state
            job.result = copy.deepcopy(result)
            job.error = error
            if state in terminal_states:
                job.poll_hint = None
            return copy.deepcopy(job)

    def cancel_job(self, job_id: str) -> SmartCanvasTaskResponse:
        """取消未进入终端状态的任务。"""
        return self.update_job_state(job_id, state="cancelled")


# 兼容别名与单例实例
CanvasService = GodCanvasService
default_god_canvas_service = GodCanvasService(seed_golden_fixture=True)
default_canvas_service = default_god_canvas_service
