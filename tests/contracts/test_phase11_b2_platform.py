# -*- coding: utf-8 -*-
"""Phase 11 B2 平台、项目兼容路径与 AI/CLI 回归契约测试。"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from gods_workbench.api.app import create_app
from gods_workbench.core import platform as platform_service

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CATALOG = REPO_ROOT / "docs" / "contracts" / "PLATFORM-INTERFACE-CATALOG.yaml"
FIXTURES = REPO_ROOT / "docs" / "fixtures"
AUTH = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "editor"}
READONLY = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "readonly"}

EXPECTED_PAIRS = {
    ("POST", "/api/ai/upload"),
    ("GET", "/api/app-info"),
    ("POST", "/api/chat"),
    ("POST", "/api/chat/agent"),
    ("POST", "/api/codex/help"),
    ("GET", "/api/codex/status"),
    ("POST", "/api/gemini-cli/help"),
    ("GET", "/api/gemini-cli/status"),
    ("GET", "/api/jimeng/credit"),
    ("POST", "/api/jimeng/help"),
    ("POST", "/api/jimeng/login/start"),
    ("GET", "/api/jimeng/login/status"),
    ("POST", "/api/jimeng/logout"),
    ("GET", "/api/jimeng/status"),
    ("GET", "/api/projects"),
    ("GET", "/api/projects/{project_id}"),
}


@pytest.fixture()
def api_client() -> TestClient:
    with TestClient(create_app()) as client:
        yield client


def _fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_catalog_declares_exact_b2_surface():
    """契约声明恰好覆盖 B2 16 条方法+路径。"""
    pairs = set(re.findall(r"method:\s*(\w+)\s*\n\s*path:\s*(\S+)", CATALOG.read_text(encoding="utf-8")))
    assert pairs == EXPECTED_PAIRS


def test_b2_fixture_examples_are_present():
    # Phase 2 黄金夹具清单属于冻结输入，本阶段只新增独立 B2 夹具，不改写清单哈希。
    for name in (
        "phase11-b2-app-info.json",
        "phase11-b2-chat-not-integrated.json",
        "phase11-b2-cli-observation.json",
        "phase11-b2-project-compat-list.json",
    ):
        assert (FIXTURES / name).is_file()


def test_app_info_is_truthful_and_authenticated(api_client: TestClient):
    assert api_client.get("/api/app-info").status_code == 401
    response = api_client.get("/api/app-info", headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert data["runtime"] == "cleanroom"
    assert data["version"] == _fixture("phase11-b2-app-info.json")["version"]
    assert data["release_authorized"] is False
    assert data["data_status"] == "ok"


def test_cli_status_observes_path_without_execution(api_client: TestClient, monkeypatch):
    monkeypatch.setattr(platform_service, "_find_cli_path", lambda candidates: None)
    for path, protocol in (("/api/codex/status", "codex"), ("/api/gemini-cli/status", "gemini-cli"), ("/api/jimeng/status", "jimeng")):
        response = api_client.get(path, headers=AUTH)
        assert response.status_code == 200
        data = response.json()
        assert data["protocol"] == protocol
        assert data["installed"] is False
        assert data["path"] is None
        assert data["version"] is None
        assert data["execution_enabled"] is False
        assert data["data_status"] == "not_integrated"


def test_jimeng_login_status_never_fakes_qr_or_login(api_client: TestClient, monkeypatch):
    monkeypatch.setattr(platform_service, "_find_cli_path", lambda candidates: None)
    response = api_client.get("/api/jimeng/login/status", headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert data["logged_in"] is False
    assert data["running"] is False
    assert data["qr_url"] == ""
    assert data["raw"] is None


def test_external_actions_fail_closed_without_leaking_payload(api_client: TestClient):
    calls = [
        ("post", "/api/ai/upload", {}),
        ("post", "/api/chat", {"json": {"message": "绝密提示词"}}),
        ("post", "/api/chat/agent", {"json": {"message": "绝密提示词", "agent_id": "a"}}),
        ("post", "/api/codex/help", {"json": {"command": "--help"}}),
        ("post", "/api/gemini-cli/help", {"json": {"command": "--help"}}),
        ("get", "/api/jimeng/credit", {}),
        ("post", "/api/jimeng/help", {"json": {"command": "--help"}}),
        ("post", "/api/jimeng/login/start", {}),
        ("post", "/api/jimeng/logout", {}),
    ]
    expected = {
        "/api/ai/upload": "AI_UPLOAD_NOT_INTEGRATED",
        "/api/chat": "CHAT_NOT_INTEGRATED",
        "/api/chat/agent": "CHAT_NOT_INTEGRATED",
        "/api/codex/help": "CLI_HELP_NOT_INTEGRATED",
        "/api/gemini-cli/help": "CLI_HELP_NOT_INTEGRATED",
        "/api/jimeng/credit": "JIMENG_CREDIT_NOT_INTEGRATED",
        "/api/jimeng/help": "CLI_HELP_NOT_INTEGRATED",
        "/api/jimeng/login/start": "JIMENG_LOGIN_NOT_INTEGRATED",
        "/api/jimeng/logout": "JIMENG_LOGIN_NOT_INTEGRATED",
    }
    for method, path, kwargs in calls:
        response = getattr(api_client, method)(path, headers=AUTH, **kwargs)
        assert response.status_code == 503, (method, path, response.text)
        detail = response.json()["detail"]
        assert detail["code"] == expected[path]
        assert detail["endpoint"] == path
        assert detail["unavailable"] is True
        assert detail["data_status"] == "not_integrated"
        assert "绝密提示词" not in response.text


def test_external_actions_require_authentication(api_client: TestClient):
    assert api_client.post("/api/chat", json={"message": "x"}).status_code == 401
    assert api_client.get("/api/jimeng/status").status_code == 401
    assert api_client.post("/api/jimeng/login/start").status_code == 401


def test_readonly_does_not_get_external_write_execution(api_client: TestClient):
    response = api_client.post("/api/chat", json={"message": "x"}, headers=READONLY)
    assert response.status_code == 403
    response = api_client.post("/api/jimeng/login/start", headers=READONLY)
    assert response.status_code == 403


def test_compat_project_paths_share_projects_hub_truth(api_client: TestClient):
    response = api_client.get("/api/projects", headers=AUTH)
    assert response.status_code == 200
    projects = response.json()["projects"]
    fixture_projects = _fixture("phase11-b2-project-compat-list.json")["projects"]
    assert projects
    assert projects[0]["project_id"] == fixture_projects[0]["project_id"]
    assert projects[0]["version"] == fixture_projects[0]["version"]
    project_id = projects[0]["project_id"]
    detail = api_client.get(f"/api/projects/{project_id}", headers=AUTH)
    assert detail.status_code == 200
    assert detail.json()["project"]["project_id"] == project_id
    missing = api_client.get("/api/projects/does-not-exist", headers=AUTH)
    assert missing.status_code == 404
    assert missing.json()["detail"]["code"] == "PROJECT_NOT_FOUND"


def test_compat_project_paths_require_authentication(api_client: TestClient):
    assert api_client.get("/api/projects").status_code == 401
    assert api_client.get("/api/projects/prj-0001").status_code == 401
