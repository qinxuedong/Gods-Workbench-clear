# -*- coding: utf-8 -*-
"""Phase 9 前端显式降级与分享页缺参提示守卫（纯 Python，不依赖浏览器）。

覆盖用户 2026-09-21 裁决：
1. `asset-share.html` 无令牌直开时给出明确缺参提示，而不是静默 404；
2. 前端统一「无后端时显式降级」：共享 transport 与 `workspace-common.js`
   在路由不存在时抛出带 `code=NOT_INTEGRATED` 的显式错误，
   但**不得**把含标准错误包的真实业务 404（如 CANVAS_NOT_FOUND）误判为未接入。

本文件为**静态源码守卫**（接线存在性）；**运行时行为**（含 404/501/503 分支）由
`tests/contracts/test_phase9_degradation_runtime.py` 用 Node 真实执行 JS 覆盖。

证据边界：静态守卫与 Node 行为守卫都**不等于**真实浏览器 E2E，
也不代表后端已实现相应端点。
"""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
STATIC_JS = REPO_ROOT / "src" / "gods_workbench" / "static" / "js"
TRANSPORT_JS = STATIC_JS / "http-transport.js"
WORKSPACE_JS = STATIC_JS / "workspace-common.js"
SHARE_JS = STATIC_JS / "asset-share.js"
SHARE_HTML = REPO_ROOT / "src" / "gods_workbench" / "static" / "asset-share.html"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_asset_share_direct_open_shows_missing_token_hint():
    """无令牌直开必须给出明确缺参提示。"""
    js = _read(SHARE_JS)
    assert "isDirectOpen" in js, "asset-share.js 应识别无令牌直开"
    assert re.search(r"缺少分享令牌", js), "应给出中文缺参提示文案"
    anchor = js.find("async function load()")
    assert anchor != -1, "未找到 load()"
    region = js[anchor : anchor + 400]
    assert "if(!token)" in region, "load() 应在发起请求前拦截缺少 token 的情况"


def test_asset_share_html_keeps_loading_placeholder():
    """HTML 仍保留可被替换的加载占位，避免空白页。"""
    html = _read(SHARE_HTML)
    assert 'id="shareApp"' in html
    assert "aria-busy" in html


def test_shared_transport_defines_not_integrated_semantics():
    """共享 transport 必须定义未接入判定与显式错误码。"""
    js = _read(TRANSPORT_JS)
    assert "NOT_INTEGRATED_MESSAGE" in js
    assert "createNotIntegratedError" in js
    assert "isNotIntegratedResponse" in js
    assert "NOT_INTEGRATED" in js
    # 必须区分标准错误包，避免把真实业务 404 误判
    assert "typeof detail === 'object'" in js, "必须按对象 detail 判定路由存在"
    assert "not found" in js, "必须识别 FastAPI 默认 404 文案"
    # 503 属可恢复的服务不可用，必须与「未纳入当前切片」分离
    assert "NOT_INTEGRATED_STATUSES = new Set([404, 501])" in js, "503 不得列入未接入集合"
    assert "SERVICE_UNAVAILABLE" in js, "必须单独定义服务暂时不可用语义"


def test_transport_wraps_both_transport_factories():
    """普通与惰性 transport 都必须经过未接入判定。"""
    js = _read(TRANSPORT_JS)
    occurrences = js.count("await isNotIntegratedResponse(response)")
    assert occurrences >= 2, f"两个 transport 工厂都应接入判定，实际命中 {occurrences}"


def test_workspace_common_exposes_not_integrated():
    """传统脚本页面的 api() 与 window.Workspace 必须暴露未接入语义。"""
    js = _read(WORKSPACE_JS)
    assert "NOT_INTEGRATED" in js
    assert "isNotIntegrated" in js
    assert "NOT_INTEGRATED_MESSAGE" in js
    assert "reason" not in js or "getPublicShare" not in js
    workspace_export = js[js.find("window.Workspace = {") :]
    assert "NOT_INTEGRATED_MESSAGE" in workspace_export, "window.Workspace 应暴露未接入文案"


def test_no_silent_degradation_without_marker():
    """显式降级必须携带结构化标记，不允许静默吞掉未接入错误。"""
    transport = _read(TRANSPORT_JS)
    assert "unavailable = true" in transport, "错误必须带 unavailable 标记"
    workspace = _read(WORKSPACE_JS)
    assert "unavailable = true" in workspace, "workspace api() 同样必须带结构化标记"


def test_workspace_common_separates_503_from_not_integrated():
    """503 必须在 workspace-common.js 中与「未接入」分离。"""
    js = _read(WORKSPACE_JS)
    assert "[404, 501]" in js, "503 不得列入未接入集合"
    assert "SERVICE_UNAVAILABLE" in js, "必须定义服务暂时不可用语义"
    assert "serviceUnavailableError" in js


def test_workspace_common_renders_object_detail_readably():
    """对象型 detail 不得渲染成 [object Object]。"""
    js = _read(WORKSPACE_JS)
    assert "detailValue" in js and "detailValue.message" in js

