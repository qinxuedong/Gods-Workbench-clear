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
