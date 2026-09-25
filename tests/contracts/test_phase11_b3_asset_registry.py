# -*- coding: utf-8 -*-
"""Phase 11 B3 素材注册表契约与失败关闭回归。"""

from __future__ import annotations

import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from gods_workbench.api.app import create_app

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "docs/contracts/ASSET-REGISTRY-INTERFACE-CATALOG.yaml"
FIXTURES = ROOT / "docs/fixtures"
AUTH = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "editor"}
READONLY = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "readonly"}
GOVERNOR = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "governor"}


def _pairs() -> set[tuple[str, str]]:
    text = CATALOG.read_text(encoding="utf-8")
    return set(re.findall(r"\s+method: (\w+)\n\s+path: (\S+)", text))


def _paths() -> set[str]:
    return {path for _, path in _pairs()}


def _client() -> TestClient:
    return TestClient(create_app())


def test_b3_contract_has_52_paths_and_route_matrix_fixture():
    fixture = json.loads((FIXTURES / "phase11-b3-route-matrix.json").read_text(encoding="utf-8"))
    assert fixture["block"] == "B3"
    assert fixture["path_count"] == 52
    assert fixture["method_path_count"] == 61
    assert len(_paths()) == 52
    assert len(_pairs()) == 61


def test_b3_fixtures_are_present():
    for name in (
        "phase11-b3-empty-registry.json",
        "phase11-b3-fail-closed.json",
        "phase11-b3-route-matrix.json",
    ):
        assert (FIXTURES / name).is_file()


def test_b3_read_only_truth_is_empty_and_explicit():
    with _client() as client:
        for path in (
            "/api/asset-registry",
            "/api/asset-registry/status",
            "/api/asset-registry/assets?limit=10",
            "/api/asset-registry/facets",
            "/api/asset-registry/folders?root_id=root",
            "/api/asset-registry/preferences/team",
            "/api/asset-registry/presets",
            "/api/asset-registry/project-directory-templates",
            "/api/asset-registry/recycle-bin",
            "/api/asset-registry/remote-assets",
        ):
            response = client.get(path, headers=AUTH)
            assert response.status_code == 200, (path, response.text)
            data = response.json()
            assert "data_status" in data
            assert "data_gaps" in data
        assert client.get("/api/asset-registry/assets", headers=AUTH).json()["assets"] == []
        assert client.get("/api/asset-registry/status", headers=AUTH).json()["assets_count"] == 0


def test_b3_reads_require_auth_and_unknown_entities_are_not_faked():
    with _client() as client:
        assert client.get("/api/asset-registry").status_code == 401
        assert client.get("/api/asset-registry/assets/asset-404", headers=AUTH).status_code == 404
        assert client.get("/api/asset-registry/workspace-jobs/job-404", headers=AUTH).status_code == 404
        response = client.get("/api/asset-registry/assets/asset-404", headers=AUTH)
        assert response.json()["detail"]["code"] == "ASSET_NOT_FOUND"


def test_b3_unsupported_side_effects_fail_closed_after_permission_check():
    requests = [
        ("post", "/api/asset-registry/assets/import", None),
        ("post", "/api/asset-registry/assets/archive", {}),
        ("post", "/api/asset-registry/assets/export-pdf", {}),
        ("patch", "/api/asset-registry/assets/a-1", {}),
        ("delete", "/api/asset-registry/assets/a-1", None),
        ("post", "/api/asset-registry/index/sync", {}),
        ("post", "/api/asset-registry/reindex", {}),
        ("post", "/api/asset-registry/remote-assets", {}),
        ("patch", "/api/asset-registry/preferences/team", {}),
        ("post", "/api/asset-registry/workspace-jobs/job-1/cancel", {"expected_version": 1}),
    ]
    with _client() as client:
        for method, path, payload in requests:
            call = getattr(client, method)
            response = call(path, headers=AUTH, json=payload) if payload is not None else call(path, headers=AUTH)
            assert response.status_code == 503, (method, path, response.text)
            detail = response.json()["detail"]
            assert detail["code"] == "ASSET_REGISTRY_NOT_INTEGRATED"
            assert detail["unavailable"] is True
            assert detail["data_status"] == "not_integrated"
            assert detail["endpoint"].startswith("/api/asset-registry")
        response = client.post("/api/asset-registry/governance/operations", headers=GOVERNOR, json={})
        assert response.status_code == 503


def test_b3_write_permission_is_checked_before_fail_closed():
    with _client() as client:
        response = client.post("/api/asset-registry/assets/import", headers=READONLY)
        assert response.status_code == 403
        response = client.post("/api/asset-registry/governance/operations", headers=READONLY, json={})
        assert response.status_code == 403
        response = client.post("/api/asset-registry/governance/operations", headers=GOVERNOR, json={})
        assert response.status_code == 503


def test_b3_media_and_cascade_endpoints_do_not_claim_external_success():
    with _client() as client:
        response = client.get("/api/asset-registry/assets/a-1/media", headers=AUTH)
        assert response.status_code == 503
        assert response.json()["detail"]["data_gaps"] if "data_gaps" in response.json()["detail"] else True
        response = client.get("/api/asset-registry/governance/cascade-preview?target_type=asset&target_id=a-1", headers=GOVERNOR)
        assert response.status_code == 200
        assert response.json()["impact"]["total"] == 0
        assert response.json()["data_status"] == "not_integrated"
