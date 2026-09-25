# -*- coding: utf-8 -*-
"""Phase 11 B4 素材库与本地素材契约回归。"""
from __future__ import annotations

import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from gods_workbench.api.app import create_app

ROOT = Path(__file__).resolve().parents[2]
CATALOGS = (
    ROOT / "docs/contracts/ASSET-LIBRARY-B4-INTERFACE-CATALOG.yaml",
    ROOT / "docs/contracts/LOCAL-ASSET-INTERFACE-CATALOG.yaml",
)
FIXTURES = ROOT / "docs/fixtures"
AUTH = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "editor"}
READONLY = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "readonly"}


def _pairs() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for catalog in CATALOGS:
        text = catalog.read_text(encoding="utf-8-sig")
        pairs.extend(re.findall(r"\s+method: (\w+)\n\s+path: (\S+)", text))
    return pairs


def _path(path: str) -> str:
    return path.replace("{p}", "sample-id")


def _client() -> TestClient:
    return TestClient(create_app())


def _payload(method: str):
    return {} if method in {"PATCH", "POST", "DELETE"} else None


def test_b4_contract_and_fixtures_are_complete():
    fixture = json.loads((FIXTURES / "phase11-b4-route-matrix.json").read_text(encoding="utf-8"))
    assert fixture["block"] == "B4"
    assert fixture["path_count"] == 30
    assert fixture["method_path_count"] == 40
    pairs = _pairs()
    assert len(pairs) == 40
    assert len({path for _, path in pairs}) == 30
    for name in (
        "phase11-b4-route-matrix.json",
        "phase11-b4-fail-closed.json",
        "phase11-b4-cleanroom-boundary.json",
    ):
        assert (FIXTURES / name).is_file()


def test_b4_all_registered_operations_fail_closed_after_auth():
    with _client() as client:
        for method, normalized in _pairs():
            path = _path(normalized)
            payload = _payload(method)
            response = client.request(method, path, headers=AUTH, json=payload) if payload is not None else client.request(method, path, headers=AUTH)
            assert response.status_code == 503, (method, path, response.text)
            detail = response.json()["detail"]
            assert detail["unavailable"] is True
            assert detail["data_status"] == "not_integrated"
            assert detail["endpoint"] == normalized
            assert detail["code"].endswith("_NOT_INTEGRATED")


def test_b4_authentication_and_write_permission_precede_unavailable():
    with _client() as client:
        for method, normalized in _pairs():
            path = _path(normalized)
            payload = _payload(method)
            unauth = client.request(method, path, json=payload) if payload is not None else client.request(method, path)
            assert unauth.status_code == 401, (method, path, unauth.text)
            if method in {"POST", "PATCH", "DELETE"}:
                readonly = client.request(method, path, headers=READONLY, json=payload)
                assert readonly.status_code == 403, (method, path, readonly.text)


def test_b4_does_not_echo_or_execute_file_payloads():
    payload = {"path": "C:/outside/secret.txt", "file_path": "../../secret.txt", "url": "https://example.invalid/secret"}
    with _client() as client:
        response = client.post("/api/local-assets/upload", headers=AUTH, json=payload)
        assert response.status_code == 503
        detail = response.json()["detail"]
        assert "secret.txt" not in json.dumps(detail, ensure_ascii=False)
        assert detail["code"] == "LOCAL_ASSETS_NOT_INTEGRATED"
