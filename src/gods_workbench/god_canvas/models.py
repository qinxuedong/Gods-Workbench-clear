"""画布核心领域与契约模型。

严格对齐 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml 与 docs/fixtures 夹具规范。
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CanvasMode(str, Enum):
    """画布运行模式。"""

    CLASSIC = "classic"
    SMART = "smart"


class NodePosition(BaseModel):
    """节点在画布上的坐标位置。"""

    x: float
    y: float


class NodeReferences(BaseModel):
    """节点引用的外部实体。"""

    model_config = ConfigDict(extra="allow")

    asset_id: Optional[str] = None
    job_id: Optional[str] = None


class CanvasNode(BaseModel):
    """画布拓扑节点实体。"""

    model_config = ConfigDict(extra="allow")

    entity_id: str = Field(..., description="稳定节点标识")
    kind: str = Field(..., description="节点类型，例如 input, output, process")
    position: Optional[NodePosition] = Field(None, description="节点坐标")
    refs: Optional[NodeReferences] = Field(default_factory=NodeReferences, description="节点关联引用")


class CanvasConnection(BaseModel):
    """画布拓扑连线实体。"""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    connection_id: str = Field(..., description="稳定连线标识")
    from_node: str = Field(..., alias="from", description="源节点 entity_id")
    to_node: str = Field(..., alias="to", description="目标节点 entity_id")


class CanvasTopology(BaseModel):
    """画布完整拓扑结构（对齐 canvas-workflow-minimal.json 夹具）。"""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    canvas_id: str = Field(..., description="画布标识")
    version: int = Field(1, description="CAS 版本号")
    nodes: List[CanvasNode] = Field(default_factory=list, description="节点列表")
    connections: List[CanvasConnection] = Field(default_factory=list, description="连接列表")


class CanvasItem(BaseModel):
    """画布元信息项。"""

    model_config = ConfigDict(extra="ignore")

    canvas_id: str
    title: str
    project_id: str
    version: int
    mode: CanvasMode


class CanvasListResponse(BaseModel):
    """画布列表响应体。"""

    canvases: List[CanvasItem] = Field(default_factory=list)


class CanvasCreateRequest(BaseModel):
    """创建画布请求体。"""

    model_config = ConfigDict(extra="forbid")

    project_id: str = Field(..., description="所属项目 ID")
    title: str = Field(..., min_length=1, description="画布标题")
    mode: CanvasMode = Field(default=CanvasMode.CLASSIC, description="画布模式")
    initial_payload: Optional[Dict[str, Any]] = Field(None, description="可选初始拓扑")


class CanvasMutationResult(BaseModel):
    """画布创建/保存返回结构。"""

    canvas_id: str
    version: int


class CanvasMutationResponse(BaseModel):
    """画布变更统一外层包装。"""

    canvas: CanvasMutationResult


class CanvasTopologyUpdateRequest(BaseModel):
    """更新画布拓扑请求体（带 CAS expected_version）。"""

    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(..., description="期望 CAS 版本")
    nodes: List[CanvasNode] = Field(default_factory=list, description="最新节点集合")
    connections: List[CanvasConnection] = Field(default_factory=list, description="最新连线集合")
    references: Optional[Dict[str, Any]] = Field(None, description="画布级别全局引用")


class CanvasImportReport(BaseModel):
    """工作流导入结果报告。"""

    nodes_imported: int
    connections_imported: int
    warnings: List[str] = Field(default_factory=list)


class CanvasImportResponse(BaseModel):
    """工作流导入成功响应体。"""

    canvas: CanvasMutationResult
    import_report: CanvasImportReport


class CanvasExportRequest(BaseModel):
    """工作流导出请求。"""

    model_config = ConfigDict(extra="forbid")

    format: str = Field("json", description="导出格式：json | godmap | zip")
    include_resources: bool = Field(False, description="是否内嵌资源描述")


class CanvasExportResponse(BaseModel):
    """工作流导出成功响应。"""

    file_url: str
    content_type: str
