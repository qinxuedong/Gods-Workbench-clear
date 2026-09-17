"""Godmap 格式编解码与校验工具。

严格对齐 docs/fixtures/canvas-workflow-minimal.godmap 规范。
"""

import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from gods_workbench.god_canvas.models import CanvasConnection, CanvasNode, CanvasTopology


class GodmapPayload(BaseModel):
    """Godmap 内层拓扑载荷。"""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    canvas_id: str
    nodes: List[CanvasNode] = Field(default_factory=list)
    connections: List[CanvasConnection] = Field(default_factory=list)


class GodmapDocument(BaseModel):
    """Godmap 完整外层文档封装。"""

    model_config = ConfigDict(extra="forbid")

    format: str = Field("godmap", description="格式标记，固定为 godmap")
    version: str = Field("1.0", description="Godmap 协议版本")
    payload: GodmapPayload = Field(..., description="拓扑载荷")


def parse_godmap_content(content: str) -> GodmapDocument:
    """解析并校验 .godmap 字符串。

    若格式非法或缺失必要字段则抛出 ValueError。
    """
    raw = json.loads(content)
    if not isinstance(raw, dict):
        raise ValueError("Godmap 内容必须是 JSON 对象")
    if raw.get("format") != "godmap":
        raise ValueError(f"未知或非法的 Godmap 格式标识: {raw.get('format')}")
    return GodmapDocument.model_validate(raw)


def export_to_godmap(topology: CanvasTopology, version: str = "1.0") -> str:
    """将画布拓扑导出为标准 .godmap JSON 字符串。"""
    doc = GodmapDocument(
        format="godmap",
        version=version,
        payload=GodmapPayload(
            canvas_id=topology.canvas_id,
            nodes=topology.nodes,
            connections=topology.connections,
        ),
    )
    return doc.model_dump_json(by_alias=True, indent=2)
