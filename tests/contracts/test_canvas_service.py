"""画布服务层与切片 B 契约端到端集成测试。"""

import json
import pytest
from fastapi.testclient import TestClient

from gods_workbench.canvas.godmap import parse_godmap_content
from gods_workbench.canvas.models import (
    CanvasConnection,
    CanvasCreateRequest,
    CanvasMode,
    CanvasNode,
    CanvasTopologyUpdateRequest,
    NodePosition,
)
from gods_workbench.canvas.service import CanvasService
from gods_workbench.core.errors import CanvasVersionConflictException, CleanroomException


def test_canvas_service_initial_and_crud():
    """测试基准种子与画布拓扑生命周期。"""
    service = CanvasService(seed_golden_fixture=True)

    # 1. 验证初始种子画布 cv-0001
    canvases = service.list_canvases("prj-0001")
    assert len(canvases) == 1
    assert canvases[0].canvas_id == "cv-0001"
    assert canvases[0].version == 1

    top = service.get_topology("cv-0001")
    assert len(top.nodes) == 2
    assert len(top.connections) == 1
    assert top.nodes[0].entity_id == "nd-0001"
    assert top.nodes[1].entity_id == "nd-0002"

    # 2. 创建新画布
    res = service.create_canvas(
        CanvasCreateRequest(
            project_id="prj-0001",
            title="测试画布 2",
            mode=CanvasMode.CLASSIC,
        )
    )
    new_cid = res.canvas_id
    assert res.version == 1

    # 3. 正常更新拓扑（CAS 匹配）
    update_res = service.update_topology(
        new_cid,
        CanvasTopologyUpdateRequest(
            expected_version=1,
            nodes=[
                CanvasNode(entity_id="node-x", kind="process", position=NodePosition(x=10, y=20)),
            ],
            connections=[],
        ),
    )
    assert update_res.version == 2
    new_top = service.get_topology(new_cid)
    assert len(new_top.nodes) == 1
    assert new_top.nodes[0].entity_id == "node-x"

    # 4. CAS 冲突更新（版本过期）
    with pytest.raises(CanvasVersionConflictException) as excinfo:
        service.update_topology(
            new_cid,
            CanvasTopologyUpdateRequest(
                expected_version=1,  # 真实已为 2
                nodes=[],
                connections=[],
            ),
        )
    assert excinfo.value.status_code == 409
    assert excinfo.value.code == "CANVAS_VERSION_CONFLICT"
    assert excinfo.value.extra["expected_version"] == 1
    assert excinfo.value.extra["current_version"] == 2
    assert excinfo.value.extra["canvas_id"] == new_cid


def test_canvas_godmap_and_json_import_export():
    """测试工作流导入导出与拓扑校验。"""
    service = CanvasService(seed_golden_fixture=True)

    # 导出 godmap
    godmap_str = service.export_workflow("cv-0001", export_format="godmap")
    doc = parse_godmap_content(godmap_str)
    assert doc.format == "godmap"
    assert len(doc.payload.nodes) == 2

    # 导出 json
    json_str = service.export_workflow("cv-0001", export_format="json")
    json_data = json.loads(json_str)
    assert json_data["canvas_id"] == "cv-0001"
    assert len(json_data["nodes"]) == 2

    # 导入非法数据测试
    with pytest.raises(CleanroomException) as excinfo:
        service.import_workflow("cv-0001", content="not valid json", file_format="json")
    assert excinfo.value.status_code == 400


def test_api_canvas_routes_integration(client: TestClient):
    """测试 API 层画布相关端点。"""
    # 1. 查询列表
    resp_list = client.get("/api/canvases?project_id=prj-0001")
    assert resp_list.status_code == 200
    assert len(resp_list.json()["canvases"]) >= 1

    # 2. 读取拓扑
    resp_top = client.get("/api/canvases/cv-0001")
    assert resp_top.status_code == 200
    assert resp_top.json()["canvas_id"] == "cv-0001"
    assert len(resp_top.json()["nodes"]) == 2

    # 3. 冲突更新 (409)
    resp_conflict = client.patch(
        "/api/canvases/cv-0001",
        json={
            "expected_version": 999,
            "nodes": [],
            "connections": [],
        },
    )
    assert resp_conflict.status_code == 409
    detail = resp_conflict.json()["detail"]
    assert detail["code"] == "CANVAS_VERSION_CONFLICT"
    assert detail["canvas_id"] == "cv-0001"
    assert detail["expected_version"] == 999

    # 4. 导出端点
    resp_export = client.post(
        "/api/canvases/cv-0001/workflow/export",
        json={"format": "godmap", "include_resources": False},
    )
    assert resp_export.status_code == 200
    assert "godmap" in resp_export.text
