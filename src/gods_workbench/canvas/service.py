"""画布与智能画布服务层洁净实现。

严格依据 docs/behavior/BEHAVIOR-SPEC-CANVAS.md 与 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml 规范，
纯黑盒实现拓扑读写、CAS 乐观锁版本控制与 .godmap 编解码。
"""

import copy
import json
import threading
from typing import Any, Dict, List, Optional

from gods_workbench.canvas.godmap import export_to_godmap, parse_godmap_content
from gods_workbench.canvas.models import (
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
from gods_workbench.core.errors import CanvasVersionConflictException, CleanroomException


class CanvasService:
    """画布拓扑与生命周期内存状态服务。"""

    def __init__(self, seed_golden_fixture: bool = True):
        self._lock = threading.Lock()
        self._canvases: Dict[str, CanvasItem] = {}
        self._topologies: Dict[str, CanvasTopology] = {}
        self._seq = 1

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

            # 初始化拓扑
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

            # 更新拓扑
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

            # 解析与校验拓扑
            imported_nodes: List[CanvasNode] = []
            imported_connections: List[CanvasConnection] = []

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


# 全局单例画布服务实例
default_canvas_service = CanvasService(seed_golden_fixture=True)
