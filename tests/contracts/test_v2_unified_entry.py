"""V2 统一入口与根级兼容入口契约测试。"""

import re
from pathlib import Path

from fastapi.testclient import TestClient

from gods_workbench.api.app import app


ROOT = Path(__file__).resolve().parents[2]
STATIC = ROOT / "src" / "gods_workbench" / "static"


LEGACY_REDIRECTS = {
    "/static/asset-manager.html": ("/static/v2/assets.html", ("project_id", "pipeline_id", "asset_id")),
    "/static/api-settings.html": ("/static/v2/settings.html", ("section", "project_id")),
    "/static/canvas-list.html": ("/static/v2/storyboard.html", ("project_id", "entity_id", "canvas_id", "view", "filter", "layout")),
    "/static/episode-pipeline.html": ("/static/v2/workshop.html", ("project_id", "pipeline_id", "step", "agent")),
    "/static/task-center.html": ("/static/v2/collab.html", ("view", "project_id")),
    "/static/governance.html": ("/static/v2/projects.html", ("openTrash", "project_id")),
}


_CONTEXT = {
    "project_id": "prj-test",
    "pipeline_id": "ep-test",
    "asset_id": "asset-test",
    "section": "api-settings",
    "entity_id": "entity-test",
    "canvas_id": "canvas-test",
    "filter": "all",
    "layout": "overview",
    "step": "script",
    "agent": "script-03",
    "view": "tasks",
    "openTrash": "1",
}


def test_legacy_user_entries_redirect_to_v2_and_preserve_context():
    """根级业务入口必须重定向到 V2，并保留各自白名单上下文参数。"""
    with TestClient(app) as client:
        for source, (target, keys) in LEGACY_REDIRECTS.items():
            context = dict(_CONTEXT)
            if source.endswith("canvas-list.html"):
                context["view"] = "canvas"
            response = client.get(
                source + "?" + "&".join(f"{key}={value}" for key, value in context.items()),
                follow_redirects=False,
            )
            assert response.status_code == 307
            location = response.headers["location"]
            assert location == target or location.startswith(target + "?")
            for key in keys:
                assert f"{key}={context[key]}" in location, f"{source} 丢失上下文参数 {key}: {location}"


def test_embedded_legacy_slices_remain_available_to_v2():
    """V2 内部 iframe 使用 embedded=1 时必须继续拿到原始切片。"""
    with TestClient(app) as client:
        for source in LEGACY_REDIRECTS:
            response = client.get(f"{source}?embedded=1", follow_redirects=False)
            assert response.status_code == 200
            assert "<html" in response.text.lower()
            assert response.headers.get("location") is None


def test_public_asset_share_deep_link_remains_anonymous_boundary():
    """公共分享页是匿名深链例外，不得被统一入口重定向。"""
    with TestClient(app) as client:
        response = client.get("/static/asset-share.html?token=share-test", follow_redirects=False)
    assert response.status_code == 200
    assert response.headers.get("location") is None
    assert "/static/v2/" not in response.text


def test_v2_user_surface_has_no_legacy_external_open_links():
    """V2 用户界面不得再通过新窗口或普通导航打开根级业务页面。"""
    files = [
        *sorted((STATIC / "v2").glob("*.html")),
        STATIC / "v2" / "js" / "assets-controller.js",
        STATIC / "v2" / "js" / "home-controller.js",
        STATIC / "v2" / "js" / "agents-controller.js",
        STATIC / "v2" / "js" / "collab-controller.js",
        STATIC / "js" / "asset-manager.js",
        STATIC / "js" / "episode-pipeline.js",
        STATIC / "js" / "hardware-telemetry.js",
    ]
    legacy = r"/static/(?:asset-manager|api-settings|canvas-list|episode-pipeline|task-center|governance)\.html"
    opening = re.compile(r"(?:href|src|location\\.href|window\\.open|dataset\\.src|targetUrl|new URL)\s*[^\n]*" + legacy)
    for path in files:
        text = path.read_text(encoding="utf-8")
        for line in text.splitlines():
            if 'target="_blank"' in line:
                assert not re.search(legacy, line), f"仍有独立业务入口: {path}: {line}"
            if re.search(legacy, line) and opening.search(line):
                assert "embedded=1" in line or "embeddedCanvasRoute" in line, f"普通用户入口仍直达 legacy 页面: {path}: {line}"


def test_legacy_asset_manager_fallback_merges_query_parameters_safely():
    """资产管理器回退 iframe 必须保留 embedded=1，且不能拼接出双问号。"""
    text = (STATIC / "js" / "asset-manager.js").read_text(encoding="utf-8")
    assert "new URL(source, window.location.origin)" in text
    assert "targetUrl.searchParams.set('project_id'" in text
    assert "targetUrl.searchParams.set('pipeline_id'" in text
    assert "`${source}${query ? `?${query}` : ''}`" not in text


def test_v2_composite_pages_mark_internal_iframe_boundaries():
    """资产、设置、画布和工坊的根级切片只允许作为内部 iframe 使用。"""
    checks = {
        "assets.html": "asset-manager.html?embedded=1",
        "settings.html": "api-settings.html?embedded=1",
        "storyboard.html": "embeddedCanvasRoute('/static/canvas-list.html",
        "workshop.html": "episode-pipeline.html?embedded=1",
    }
    for name, marker in checks.items():
        text = (STATIC / "v2" / name).read_text(encoding="utf-8")
        assert marker in text, f"缺少 V2 内部 iframe 边界: {name}"


def test_v2_copy_uses_single_entry_language():
    """用户可见文案不得再暗示需要独立窗口或外部完整页。"""
    for name in ("index.html", "settings.html", "collab.html"):
        text = (STATIC / "v2" / name).read_text(encoding="utf-8")
        assert "独立窗口" not in text
        assert "完整视图 ↗" not in text
