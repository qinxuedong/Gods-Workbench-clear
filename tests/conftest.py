"""Pytest 全局配置与夹具。"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# 确保 src 目录在 Python 模块解析路径中
REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_PATH = REPO_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from gods_workbench.api.app import app
from gods_workbench.projects_hub import service as projects_service_module
from gods_workbench.projects_hub.service import ProjectsService
from gods_workbench.api import routes_projects, routes_asset_registry


@pytest.fixture(autouse=True)
def isolated_data_dir(tmp_path, monkeypatch):
    """Phase 12：把落盘数据根目录隔离到每个用例的临时目录。

    生产代码自 Phase 12 起把素材库/注册表等状态落到单实例 JSON；
    若用例共用真实数据目录，用例之间会互相污染且无法重放。
    本夹具确保每个用例拥有独立数据目录，且**默认不配置**本机文件允许根目录
    （未配置即禁止本机文件访问，符合失败关闭口径）。
    """
    monkeypatch.setenv("GW_DATA_DIR", str(tmp_path / "gw-data"))
    monkeypatch.setenv("GW_VIDEO_DATA_DIR", str(tmp_path / "gw-video"))
    monkeypatch.delenv("GW_ALLOWED_ROOTS", raising=False)

    # HTTP契约用例显式注入内存黄金夹具；生产单例始终指向真实持久快照。
    memory_projects_service = ProjectsService(seed_golden_fixture=True)
    monkeypatch.setattr(projects_service_module, "default_projects_service", memory_projects_service)
    monkeypatch.setattr(routes_projects, "default_projects_service", memory_projects_service)
    monkeypatch.setattr(routes_asset_registry, "default_projects_service", memory_projects_service)
    from gods_workbench.video_tasks import service as video_service_module
    monkeypatch.setattr(video_service_module, "default_projects_service", memory_projects_service)

    # 视频任务有独立持久化根目录；用例间显式换库，不能通过改写/清空生产 ACL 来消除串扰。
    from gods_workbench.video_tasks import service as video_service_module
    previous_service = video_service_module._default_service
    video_service_module._default_service = None
    if previous_service is not None:
        previous_service.executor.shutdown(wait=False, cancel_futures=True)
    try:
        yield
    finally:
        active_service = video_service_module._default_service
        video_service_module._default_service = None
        if active_service is not None:
            active_service.executor.shutdown(wait=False, cancel_futures=True)



@pytest.fixture(scope="session")
def repo_root() -> Path:
    """返回仓库根目录路径。"""
    return REPO_ROOT


@pytest.fixture(scope="session")
def fixtures_dir(repo_root: Path) -> Path:
    """返回黄金夹具目录路径。"""
    return repo_root / "docs" / "fixtures"


@pytest.fixture(scope="session")
def client() -> TestClient:
    """返回 FastAPI 测试客户端。"""
    return TestClient(app)
