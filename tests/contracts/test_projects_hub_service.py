"""项目中心服务层与端到端静态集成测试。"""

import pytest
from fastapi.testclient import TestClient

from gods_workbench.projects_hub.service import ProjectsService
from gods_workbench.projects_hub.models import ProjectCreateRequest, ProjectType, ProjectUpdateRequest
from gods_workbench.core.errors import VersionConflictException


def test_projects_service_crud_and_cas():
    """测试服务层完整生命周期与 CAS 版本控制。"""
    service = ProjectsService(seed_golden_fixture=True)

    # 1. 初始列表包含黄金夹具种子
    active = service.list_projects(archived=False)
    assert len(active) == 1
    assert active[0].project_id == "prj-0001"
    assert active[0].version == 3

    # 2. 创建新项目
    res = service.create_project(
        ProjectCreateRequest(
            name="单元测试新项目",
            project_type=ProjectType.SERIES,
            description="描述",
            start_at=1780000000000,
            due_at=1781000000000,
        )
    )
    new_pid = res.project_id
    assert res.version == 1

    # 3. 正常 CAS 编辑（版本匹配）
    update_res = service.update_project(
        new_pid,
        ProjectUpdateRequest(
            name="更新后的名称",
            expected_version=1,
            progress=50,
        ),
    )
    assert update_res.version == 2

    # 显式传入 null 可以清除排期和摘要，省略字段则保持原值
    clear_res = service.update_project(
        new_pid,
        ProjectUpdateRequest(
            description=None,
            start_at=None,
            due_at=None,
            expected_version=2,
        ),
    )
    assert clear_res.version == 3
    cleared = service.list_projects()[0]
    assert cleared.project_id == new_pid
    assert cleared.description is None
    assert cleared.start_at is None
    assert cleared.due_at is None

    # 4. 冲突 CAS 编辑（版本过期）
    with pytest.raises(VersionConflictException) as excinfo:
        service.update_project(
            new_pid,
            ProjectUpdateRequest(
                name="再更新",
                expected_version=1,  # 真实已变成 3
            ),
        )
    assert excinfo.value.status_code == 409
    assert excinfo.value.extra["expected_version"] == 1
    assert excinfo.value.extra["current_version"] == 3

    # 5. 归档与解归档
    arch_res = service.archive_project(new_pid, expected_version=3)
    assert arch_res.version == 4
    assert arch_res.archived_at is not None

    unarch_res = service.unarchive_project(new_pid, expected_version=4)
    assert unarch_res.version == 5
    assert unarch_res.archived_at is None

    # 6. 回收站流转：必须先重新归档，避免活跃项目被直接隔离
    arch_again = service.archive_project(new_pid, expected_version=5)
    assert arch_again.version == 6
    trash_res = service.move_to_trash(new_pid, expected_version=6)
    assert trash_res.version == 7
    assert trash_res.deleted_at is not None

    # 回收站筛选确认
    trash_list = service.list_projects(deleted=True)
    assert any(p.project_id == new_pid for p in trash_list)

    # 恢复
    restore_res = service.restore_from_trash(new_pid, expected_version=7)
    assert restore_res.version == 8
    assert restore_res.deleted_at is None


def test_api_static_and_projects_integration(client: TestClient):
    """测试静态文件挂载与页面重定向。"""
    # 根路径重定向
    resp_root = client.get("/", follow_redirects=False)
    assert resp_root.status_code == 307
    assert resp_root.headers["location"] == "/static/v2/projects.html"

    # 项目中心 HTML 可读取
    resp_page = client.get("/static/v2/projects.html")
    assert resp_page.status_code == 200
    assert "项目中心" in resp_page.text
    assert "hardware-design-system.css" in resp_page.text

    # V2 影视工坊工作台可读取
    resp_workshop = client.get("/static/v2/workshop.html")
    assert resp_workshop.status_code == 200
    assert "影视工坊" in resp_workshop.text

    # 真实项目列表 API 接口打通
    resp_api = client.get("/api/asset-registry/projects")
    assert resp_api.status_code == 200
    data = resp_api.json()
    assert "projects" in data
    assert len(data["projects"]) >= 1
    assert data["projects"][0]["project_id"] == "prj-0001"
