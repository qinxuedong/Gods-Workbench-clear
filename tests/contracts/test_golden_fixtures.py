"""黄金夹具与契约模型一致性自动化测试。

读取 docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json，对全部 9 个黄金夹具执行严格的反序列化和契约断言。
"""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from gods_workbench.god_canvas.godmap import parse_godmap_content, export_to_godmap
from gods_workbench.god_canvas.models import CanvasTopology
from gods_workbench.god_canvas.tasks import SmartCanvasTaskResponse
from gods_workbench.core.errors import (
    ErrorEnvelope,
    UnauthorizedException,
    ForbiddenException,
    VersionConflictException,
    CanvasVersionConflictException,
)
from gods_workbench.projects_hub.models import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectType,
)


def test_manifest_integrity(fixtures_dir: Path):
    """验证黄金夹具清单完整性与文件存在性。"""
    manifest_path = fixtures_dir / "GOLDEN-FIXTURE-MANIFEST.json"
    assert manifest_path.exists(), "GOLDEN-FIXTURE-MANIFEST.json 必须存在"
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["meta"]["distribution"] == "NOT AUTHORIZED FOR PUBLIC DISTRIBUTION"
    assert len(data["fixtures"]) == 9
    for item in data["fixtures"]:
        file_path = fixtures_dir / item["file"]
        assert file_path.exists(), f"夹具文件不存在: {item['file']}"


def test_fixture_projects_hub_list_active(fixtures_dir: Path):
    """验证 projects-hub-list-active.json 契约匹配。"""
    file_path = fixtures_dir / "projects-hub-list-active.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    res = ProjectListResponse.model_validate(content)
    assert len(res.projects) == 1
    p = res.projects[0]
    assert p.project_id == "prj-0001"
    assert p.project_type == ProjectType.FILM
    assert p.version == 3
    assert p.progress == 68


def test_fixture_projects_hub_create_request(fixtures_dir: Path):
    """验证 projects-hub-create-request.json 契约匹配。"""
    file_path = fixtures_dir / "projects-hub-create-request.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    req = ProjectCreateRequest.model_validate(content)
    assert req.name == "示例项目 B"
    assert req.project_type == ProjectType.SERIES
    assert req.start_at == 1782000000000


def test_fixture_projects_hub_update_conflict_409(fixtures_dir: Path):
    """验证 projects-hub-update-conflict-409.json 错误语义匹配。"""
    file_path = fixtures_dir / "projects-hub-update-conflict-409.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    envelope = ErrorEnvelope.model_validate(content)
    assert envelope.detail.code == "VERSION_CONFLICT"
    assert envelope.detail.expected_version == 5
    assert envelope.detail.current_version == 6

    # 验证与自定义异常生成的一致性
    exc = VersionConflictException(expected_version=5, current_version=6)
    assert exc.to_envelope().detail.code == envelope.detail.code
    assert exc.to_envelope().detail.expected_version == envelope.detail.expected_version


def test_fixture_canvas_workflow_minimal_json(fixtures_dir: Path):
    """验证 canvas-workflow-minimal.json 契约匹配。"""
    file_path = fixtures_dir / "canvas-workflow-minimal.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    top = CanvasTopology.model_validate(content)
    assert top.canvas_id == "cv-0001"
    assert top.version == 1
    assert len(top.nodes) == 2
    assert len(top.connections) == 1
    assert top.nodes[0].entity_id == "nd-0001"
    assert top.connections[0].from_node == "nd-0001"
    assert top.connections[0].to_node == "nd-0002"


def test_fixture_canvas_workflow_minimal_godmap(fixtures_dir: Path):
    """验证 canvas-workflow-minimal.godmap 编解码契约。"""
    file_path = fixtures_dir / "canvas-workflow-minimal.godmap"
    with open(file_path, "r", encoding="utf-8") as f:
        raw_str = f.read()
    doc = parse_godmap_content(raw_str)
    assert doc.format == "godmap"
    assert doc.version == "1.0"
    assert doc.payload.canvas_id == "cv-0001"
    assert len(doc.payload.nodes) == 2
    assert len(doc.payload.connections) == 1

    # 验证拓扑可再导出
    re_exported = export_to_godmap(
        CanvasTopology(
            canvas_id=doc.payload.canvas_id,
            version=1,
            nodes=doc.payload.nodes,
            connections=doc.payload.connections,
        )
    )
    doc_re = parse_godmap_content(re_exported)
    assert doc_re.payload.canvas_id == "cv-0001"


def test_fixture_canvas_save_conflict_409(fixtures_dir: Path):
    """验证 canvas-save-conflict-409.json 错误语义匹配。"""
    file_path = fixtures_dir / "canvas-save-conflict-409.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    envelope = ErrorEnvelope.model_validate(content)
    assert envelope.detail.code == "CANVAS_VERSION_CONFLICT"
    assert envelope.detail.canvas_id == "cv-0001"
    assert envelope.detail.expected_version == 11
    assert envelope.detail.current_version == 12

    exc = CanvasVersionConflictException(expected_version=11, current_version=12, canvas_id="cv-0001")
    assert exc.to_envelope().detail.code == envelope.detail.code


def test_fixture_canvas_task_accepted_202(fixtures_dir: Path):
    """验证 canvas-task-accepted-202.json 异步契约匹配。"""
    file_path = fixtures_dir / "canvas-task-accepted-202.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    res = SmartCanvasTaskResponse.model_validate(content)
    assert res.job_id == "job-0001"
    assert res.state == "accepted"
    assert res.poll_hint == "/api/jobs/job-0001"


def test_fixture_canvas_auth_401(fixtures_dir: Path):
    """验证 canvas-auth-401.json 错误语义匹配。"""
    file_path = fixtures_dir / "canvas-auth-401.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    envelope = ErrorEnvelope.model_validate(content)
    assert envelope.detail.code == "UNAUTHORIZED"

    exc = UnauthorizedException()
    assert exc.to_envelope().detail.code == envelope.detail.code


def test_fixture_canvas_forbidden_403(fixtures_dir: Path):
    """验证 canvas-forbidden-403.json 错误语义匹配。"""
    file_path = fixtures_dir / "canvas-forbidden-403.json"
    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    envelope = ErrorEnvelope.model_validate(content)
    assert envelope.detail.code == "FORBIDDEN"

    exc = ForbiddenException()
    assert exc.to_envelope().detail.code == envelope.detail.code


def test_api_contract_routes(client: TestClient):
    """测试 API 路由的契约状态码与响应体包装。"""
    # 测试未认证 401
    resp_401 = client.get("/api/asset-registry/projects", headers={"authorization": "invalid"})
    assert resp_401.status_code == 401
    assert resp_401.json()["detail"]["code"] == "UNAUTHORIZED"

    # 测试智能画布 202
    resp_202 = client.post(
        "/api/canvases/cv-0001/tasks",
        json={"entry_nodes": ["nd-0001"], "run_mode": "single"},
    )
    assert resp_202.status_code == 202
    assert resp_202.json()["state"] == "accepted"
    assert "job_id" in resp_202.json()
