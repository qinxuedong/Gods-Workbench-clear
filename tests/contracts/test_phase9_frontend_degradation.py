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

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

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

V2_JS = REPO_ROOT / "src" / "gods_workbench" / "static" / "v2" / "js"
PRODUCTION_JS = V2_JS / "production-controller.js"
STORYBOARD_JS = V2_JS / "storyboard-controller.js"
WORKSHOP_HTML = REPO_ROOT / "src" / "gods_workbench" / "static" / "v2" / "workshop.html"


def test_production_controller_has_no_fake_ready_status():
    """制片控制器不得把未知/降级状态伪装成绿色「就绪」。"""
    js = _read(PRODUCTION_JS)
    assert "status: 'ready'" not in js, "state.shotList 不得保留伪造的 ready 状态"
    assert "sh.status = 'ready'" not in js, "取消选中不得回写伪造的 ready"
    assert "not_integrated" in js, "必须使用显式未接入状态"
    assert 'data-gw-degradation="not_integrated"' in js, "降级态必须带结构化标记"
    assert "未接入" in js, "必须向用户明说未接入"


def test_production_controller_generate_is_explicitly_not_integrated():
    """触发渲染不得静默假装完成；必须显式告知未接入。"""
    js = _read(PRODUCTION_JS)
    anchor = js.find("function triggerGenerate()")
    assert anchor != -1, "未找到 triggerGenerate()"
    region = js[anchor : anchor + 500]
    assert "未接入" in region, "triggerGenerate 必须显式提示未接入，不得伪装生成完成"


def test_production_controller_demo_catalog_is_labeled():
    """内置示例目录必须显式标注为未接入后端，且不得残留旧名。"""
    js = _read(PRODUCTION_JS)
    assert "demoProjectCatalog" in js, "内置示例目录必须改名以提示非真实数据"
    assert "projectCatalog" not in js.replace("demoProjectCatalog", ""), "不得残留内部名 projectCatalog"


def test_storyboard_controller_has_no_fake_done_status():
    """分镜控制器不得把未实现的渲染端点结果标为 done。"""
    js = _read(STORYBOARD_JS)
    assert "not_integrated" in js
    assert "未接入" in js


def test_workshop_demo_catalog_not_merged_into_projects():
    """工坊页内置示例目录不得并入真实 projects 状态。"""
    html = _read(WORKSHOP_HTML)
    assert "demoProjectCatalog" in html
    assert "projectsDegradation" in html and "episodesDegradation" in html

# ---------------------------------------------------------------------------
# Phase 9E：静态页残留「不可验证运行态断言」清零守卫（2026-09-21 追加）
# ---------------------------------------------------------------------------
V2_DIR = REPO_ROOT / "src" / "gods_workbench" / "static" / "v2"


def _is_comment_line(line: str) -> bool:
    """判断该行是否只是注释/文档串行（不参与运行时行为）。"""
    stripped = line.strip()
    if not stripped:
        return False
    return stripped.startswith(("//", "*", "/*", "<!--", "#"))


def _is_identifier_only_random(line: str) -> bool:
    """判断该行的 Math.random 是否只用于生成标识符 / nonce（非遥测读数）。"""
    if not re.search(r"(id|key|nonce|uuid|token|client_id|group|note|library|layer|aura)\s*[:=]", line, re.I):
        return False
    # 若同一行还写了百分比/负载字段，则不能按标识符豁免。
    return not re.search(r"(cpu|ram|gpu|vram|load|usage|temperat|percent|jitter)\s*[:=]", line, re.I)
V2_JS = V2_DIR / "js"
INDEX_HTML = V2_DIR / "index.html"
PROJECTS_HTML = V2_DIR / "projects.html"
PRODUCTION_HTML = V2_DIR / "production.html"
STORYBOARD_HTML = V2_DIR / "storyboard.html"
AGENTS_HTML = V2_DIR / "agents.html"
AGENTS_JS = V2_JS / "agents-controller.js"
STORYBOARD_JS = V2_JS / "storyboard-controller.js"
COLLAB_HTML = V2_DIR / "collab.html"
SETTINGS_HTML = V2_DIR / "settings.html"

#: 无后端时**不得**出现在页面上的伪造运行态断言（不可验证的数值/在线/进度/设备名）
FAKE_RUNTIME_CLAIMS = [
    "3 运行中",
    "生成中 85%",
    "采样中 64%",
    "渲染中 42%",
    "执行中 72%",
    "排队中 #01",
    "ETA 45s",
    "22.4G",
    "18.2G",
    "42.0G",
    "32.4 fps",
    "84 tokens/s",
    "4 在线",
    "5 已生成",
    "AI-FLUX MASTER ENGINE",
    "24-BUS",
]


def test_v2_static_pages_have_no_fake_runtime_claims():
    """全 v2 静态页不得残留伪造运行态断言（含任务中心/GPU/智能体/分镜）。"""
    offenders = {}
    for path in sorted(list(V2_DIR.glob("*.html")) + list(V2_JS.glob("*.js"))):
        text = path.read_text(encoding="utf-8")
        hits = [c for c in FAKE_RUNTIME_CLAIMS if c in text]
        if hits:
            offenders[path.name] = hits
    assert not offenders, f"仍有伪造运行态断言: {offenders}"


def test_agents_controller_has_no_fake_online_status():
    """智能体控制器不得把内置示例目录渲染成 online / idle。"""
    js = _read(AGENTS_JS)
    assert "status: 'online'" not in js, "不得残留伪造 online 状态"
    assert "status: 'idle'" not in js, "不得残留伪造 idle 状态"
    assert "not_integrated" in js, "必须使用显式未接入状态"


def test_agents_controller_test_prompt_not_faked_as_completed():
    """测试指令不得在 400ms 后伪造「已完成」。"""
    js = _read(AGENTS_JS)
    assert "测试指令已完成" not in js, "不得伪造测试指令已完成"
    assert "result: 'local-test'" not in js, "不得把本地桩结果标记为真实执行"
    assert "未接入" in js, "必须向用户明说未接入"


def test_storyboard_controller_has_no_fake_generating_progress():
    """分镜控制器不得伪造「渲染中 68%」这类未实现端点的进度。"""
    js = _read(STORYBOARD_JS)
    assert "渲染中 68%" not in js, "不得伪造渲染进度百分比"
    assert "status: 'generating'" not in js, "不得把未实现渲染标为 generating"
    assert "未接入" in js


def test_v2_task_center_marked_not_integrated():
    """任务中心链路整体未实现：相关页面必须明说未接入，而非显示真实队列。"""
    for path in (INDEX_HTML, PROJECTS_HTML, PRODUCTION_HTML):
        html = _read(path)
        assert "未接入" in html, f"{path.name} 必须明说未接入"
    index = _read(INDEX_HTML)
    assert 'id="activeTasksCountBadge"' in index
    assert "任务中心未接入" in index, "首页活跃任务徽标必须标注未接入"


def test_v2_gpu_telemetry_not_faked():
    """GPU 集群卡不得伪造设备型号/显存/利用率。"""
    html = _read(PROJECTS_HTML)
    assert "硬件遥测未接入" in html
    assert "22.4G" not in html and "18.2G" not in html, "不得伪造显存占用"
    assert "IDLE</span>" not in html, "不得伪造 GPU 空闲/占用状态"


def test_v2_collab_and_settings_no_fake_latency_claim():
    """协同页/设置页不得断言 0ms 本地时延。"""
    for path in (COLLAB_HTML, SETTINGS_HTML):
        html = _read(path)
        assert "0ms" not in html, f"{path.name} 不得伪造 0ms 时延断言"
    assert "未接入" in _read(COLLAB_HTML)


# ---------------------------------------------------------------------------
# Phase 9E-2 / 9E-3：随机伪造遥测、虚假在线胶囊、episode-pipeline 伪造运行态
# ---------------------------------------------------------------------------
TELEMETRY_JS = STATIC_JS / "hardware-telemetry.js"
EPISODE_JS = STATIC_JS / "episode-pipeline.js"
V2_PAGES = [
    "index.html", "projects.html", "workshop.html", "production.html",
    "storyboard.html", "agents.html", "assets.html", "collab.html", "settings.html",
]


def test_telemetry_has_no_random_fake_vu_jitter():
    """VU 表不得用 Math.random 伪造 CPU/RAM 负载；无端点时必须显式「未接入」。"""
    js = _read(TELEMETRY_JS)
    assert "Math.random" not in js, "硬件遥测模块不得用随机数伪造负载数值"
    assert "integrated" in js, "必须存在真实遥测接线开关"
    assert "data-gw-degradation" in js, "必须在读数上打显式降级标记"


def test_v2_pages_have_no_static_online_green_led():
    """9 个 v2 页顶栏不得保留静态绿色「Online」断言。"""
    offenders = []
    for name in V2_PAGES:
        text = (V2_DIR / name).read_text(encoding="utf-8")
        assert ">Online<" not in text, f"{name} 不得保留静态 Online 文案"
        assert 'bg-emerald-400 shadow-[0_0_6px_#34d399]' not in text, (
            f"{name} 不得保留静态绿色就绪灯"
        )
        assert "uv-hub-percent" in text
        offenders.append(name)
    assert len(offenders) == 9


def test_v2_pages_vu_reading_is_explicitly_not_integrated():
    """CPU/RAM 读数初值不得是具体百分比，必须写明「未接入」。"""
    import re

    pattern = re.compile(
        r'<span class="uv-hub-percent [^"]*" id="(?:cpuValText|ramValText)"[^>]*>([^<]*)</span>'
    )
    for name in V2_PAGES:
        text = (V2_DIR / name).read_text(encoding="utf-8")
        values = pattern.findall(text)
        assert len(values) == 2, f"{name} 应有 CPU/RAM 两个读数"
        for value in values:
            assert value.strip() in {"未接入", "未测量", "—"}, (
                f"{name} 读数不得为具体百分比，实际 {value!r}"
            )


def test_episode_pipeline_has_no_fake_hardware_or_model_claims():
    """剧本流水线不得伪造算力/显存/随机种子/模型就绪或默认厂商模型名。"""
    import re

    js = _read(EPISODE_JS)
    assert not re.search(r"\d+(?:\.\d+)?\s*TFLOPS", js), "不得伪造算力数值"
    assert not re.search(r"\d+(?:\.\d+)?\s*/\s*\d+\s*GB", js), "不得伪造显存占用"
    assert not re.search(r"SEED:\s*\d+", js), "不得伪造随机种子"
    assert "owai / gpt-5.6-luna" not in js, "不得回退到具体厂商/模型名"
    assert "AIZZZ-gpt-image2" not in js, "不得回退到具体图片模型名"
    assert "未配置模型" in js, "无 providers 时必须显式说明未配置模型"
    assert js.count("未接入") >= 3, "必须在硬件与模型状态上使用显式未接入"
    assert "data-gw-degradation" in js


# ---------------------------------------------------------------------------
# Phase 9F：顶栏拟物推子不得残留具体读数（裁定 3 收尾，2026-09-21 追加）
#
# 真实缺陷：7 个 v2 页 + v2-shell.js 的顶栏推子曾写死 width:78% / left:78% 与
# 「14.8G / 12.2G / 18.4G」等具体读数，渲染后被读成"真实算力/显存遥测"。
# 修复：推子一律 0%，读数改为「未接入」并带 data-gw-degradation="not_integrated"。
# 本节为静态守卫（源码层），不等于浏览器渲染 E2E。
# ---------------------------------------------------------------------------

TOP_BAR_FADER_FILES = [
    "index.html", "projects.html", "production.html", "storyboard.html",
    "agents.html", "assets.html", "collab.html",
]

#: 修复前的具体读数；这些字符串不得再出现在顶栏推子文件里。
STALE_FADER_READOUTS = ["78%", "82%", "75%", "92%", "68%", "88%", "14.8G", "18.4G", "12.2G"]


def _topbar_fader_blocks(text: str):
    """截取**顶栏**推子块：只取带 `data-gw-degradation` 读数标记的推子。

    页面里还有另一类**真实可调参数**推子（如温度 70%、CFG 65%、LoRA 权重 85%），
    它们是交互输入而非遥测断言，**必须保留**，因此不能用全页匹配把它们误判为伪造读数。
    """
    blocks = []
    for match in re.finditer(r"hw-fader-track-horizontal", text):
        block = text[max(0, match.start() - 400) : match.start() + 1200]
        if 'data-gw-degradation="not_integrated"' in block or "未接入" in block:
            blocks.append(block)
    return blocks


def test_v2_topbar_faders_have_no_stale_readouts():
    """7 个 v2 页的**顶栏推子块**不得残留具体读数（% / G）。"""
    offenders = {}
    for name in TOP_BAR_FADER_FILES:
        text = _read(V2_DIR / name)
        blocks = _topbar_fader_blocks(text)
        assert blocks, f"{name} 未找到顶栏推子块"
        for block in blocks:
            hits = [token for token in STALE_FADER_READOUTS if token in block]
            if hits:
                offenders.setdefault(name, []).append(hits)
    assert not offenders, f"顶栏推子仍残留具体读数: {offenders}"


def test_v2_shell_injected_faders_have_no_stale_readouts():
    """v2-shell.js 注入的顶栏不得残留具体读数或非零推子位移。"""
    js = _read(V2_JS / "v2-shell.js")
    for token in STALE_FADER_READOUTS:
        assert token not in js, f"v2-shell.js 不得残留具体读数 {token}"
    assert "width:78%" not in js.replace(" ", ""), "注入推子宽度必须为 0%"
    assert "未接入" in js, "注入推子读数必须明说未接入"
    assert "not_integrated" in js, "注入推子必须带结构化降级标记"


def test_v2_topbar_fader_readouts_are_marked_not_integrated():
    """推子块必须给出「未接入」文案 + 结构化降级标记，且位移一律 0% 起手。"""
    for name in TOP_BAR_FADER_FILES:
        text = _read(V2_DIR / name)
        assert "未接入" in text, f"{name} 推子读数必须明说未接入"
        assert 'data-gw-degradation="not_integrated"' in text, f"{name} 推子必须带降级标记"
        for block in _topbar_fader_blocks(text):
            for match in re.finditer(r"(?:width|left)\s*:\s*(\d+)%", block):
                assert match.group(1) == "0", (
                    f"{name} 顶栏推子必须以 0% 起手，实际 {match.group(0)}"
                )


# ---------------------------------------------------------------------------
# R6-9：asset-review 授权门禁不得 fail-open
#
# 真实缺陷：后端 /api/asset-auth/status 契约里**没有** auth_required 字段，
# 旧 can() 用 `!state.auth?.auth_required || ...` → `!undefined === true`，
# 未认证访客被判为拥有 admin/editor/reviewer 全部权限。
# 本节为静态守卫；行为级对照由 %TEMP% 独立复算脚本给出（7 组场景 0 分歧）。
# ---------------------------------------------------------------------------

ASSET_REVIEW_JS = STATIC_JS / "asset-review.js"


def test_asset_review_can_is_fail_closed():
    """can() 必须先要求已认证且有 principal，再比较角色等级。"""
    js = _read(ASSET_REVIEW_JS)
    code = "\n".join(
        line for line in js.splitlines() if not line.strip().startswith(("//", "*", "/*"))
    )
    assert "state.auth?.auth_required" not in code, "can() 不得再依赖后端不存在的 auth_required"
    anchor = code.find("const can =")
    assert anchor != -1, "未找到 can()"
    region = code[anchor : anchor + 320]
    assert "state.auth?.authenticated" in region, "can() 必须要求 authenticated"
    assert "state.auth?.principal" in region, "can() 必须要求 principal"
    assert "roleLevel" in region, "can() 必须做角色等级比较"


def test_asset_review_login_failure_is_explicitly_degraded():
    """认证服务不可达时必须显式降级，不得写入宽松默认值。"""
    js = _read(ASSET_REVIEW_JS)
    assert "degraded:true" in js.replace(" ", ""), "必须写入 degraded 标记"
    assert "认证服务未接入或不可达" in js, "必须给出中文原因文案"
    code = "\n".join(
        line for line in js.splitlines() if not line.strip().startswith(("//", "*", "/*"))
    )
    assert "needs_setup" not in code, "不得残留后端不存在的 needs_setup 字段"
    assert "bootstrap(" not in code, "不得残留旧 bootstrap 登录分支"
    assert "needsLogin" in code, "must expose needsLogin()"
# ---------------------------------------------------------------------------
# Phase 9F-2：侧栏「项目树进度」等同类假运行态读数清零（2026-09-21 追加）
#
# 与顶栏推子同源缺陷：项目树节点后挂 100% / 85% / 75% / 20% 及
# 「online」胶囊、「4节点」、「VRAM CAP 85%」等不可验证读数，渲染后被读成真实进度/容量。
# 修复：一律改为「未接入 / 未验证」+ data-gw-degradation="not_integrated"。
# 注意：production.html 的 LoRA(85%)/roughness(18%)/CFG(65%) 与温度(70%) 是真实交互输入，保留。
# ---------------------------------------------------------------------------

#: 侧栏项目树 / 场景树的伪造进度读数（形如 >NN%<）
TREE_PROGRESS_RE = re.compile(r">(?:100|85|82|78|75|68|58|92|88|64|42|72|20)%<")


def test_v2_side_tree_has_no_fake_progress_readouts():
    """侧栏项目树 / 场景树不得残留伪造进度百分比。"""
    offenders = {}
    for name in ("index.html", "projects.html", "production.html", "storyboard.html"):
        text = _read(V2_DIR / name)
        hits = [m.group(0) for m in TREE_PROGRESS_RE.finditer(text)]
        if hits:
            offenders[name] = hits
    assert not offenders, f"侧栏树仍残留伪造进度读数: {offenders}"


def test_v2_pages_have_no_fake_online_badge_or_node_count():
    """不得残留 `online` 状态胶囊 / `4节点` / `VRAM CAP NN%` 这类不可验证断言。"""
    offenders = {}
    for name in ("index.html", "projects.html", "production.html", "storyboard.html", "agents.html"):
        text = _read(V2_DIR / name)
        hits = []
        if "<span>online</span>" in text:
            hits.append("online")
        if re.search(r">\d+节点<", text):
            hits.append("节点数")
        if re.search(r"VRAM CAP \d+%", text):
            hits.append("VRAM CAP")
        if hits:
            offenders[name] = hits
    assert not offenders, f"仍残留不可验证运行态断言: {offenders}"


def test_v2_side_tree_degradation_replacements_are_marked():
    """被替换的侧栏读数必须带结构化降级标记，不得改成另一个数值。"""
    for name in ("index.html", "projects.html", "production.html"):
        text = _read(V2_DIR / name)
        assert 'data-gw-degradation="not_integrated"' in text, f"{name} 缺少降级标记"
    assert "VRAM 上限未接入" in _read(V2_DIR / "projects.html")
    assert "<span>online</span>" not in _read(V2_DIR / "index.html")
    assert "<span>未验证</span>" in _read(V2_DIR / "index.html")


# ---------------------------------------------------------------------------
# Phase 9G：`X || 默认值` 把真实 0 吞掉（静默伪造）——静态守卫
#
# 真实缺陷（独立复核方 + 主代理各自复算）：
#   `p.progress || 10` / `Number(p.progress) || 60` / `p.progress || ... : 75`
#   在 `progress === 0`（后端新建项目真实值）时返回**非 0 伪造值**，
#   即 `0 || 10 === 10`、`0 || 60 === 60`、`0 || 75 === 75`。
# 这两处控制器因此把「0% 进度」显示成 10% / 60% / 75% —— 与真实值相反。
# 正确写法：`Number.isFinite(x) ? x : null`（或 `??`），绝不用 `||`。
# ---------------------------------------------------------------------------

#: 允许出现 `|| 0`（`0 || 0 === 0`，不改变语义），其余 `|| 数字` 一律视为伪造兜底。
FALSY_FALLBACK_RE = re.compile(
    r"\b(?:progress|scenes|shots)\b[^;\n]{0,40}\|\|\s*(?!0(?:\D|$))\d+"
)
FALSY_FALLBACK_RE2 = re.compile(
    r"Number\(\s*p\.progress\s*\)\s*\|\|\s*(?!0(?:\D|$))\d+"
)
FALSY_FALLBACK_RE3 = re.compile(
    r"p\.progress\s*\|\|\s*(?:\([^)]*\)\s*:\s*)?(?<!0)\d{2}"
)

CONTROLLERS = ["home-controller.js", "projects-controller.js", "production-controller.js"]


def test_controllers_have_no_falsy_numeric_fallback():
    """控制器不得用 `X || 数字` 兜底 progress/scenes/shots（会把真实 0 改写）。"""
    offenders = {}
    for name in CONTROLLERS:
        text = _read(V2_JS / name)
        hits = []
        for regex in (FALSY_FALLBACK_RE, FALSY_FALLBACK_RE2, FALSY_FALLBACK_RE3):
            hits += [m.group(0) for m in regex.finditer(text)]
        # 去掉纯注释行（本轮修复说明中会引用旧写法）
        code = "\n".join(
            ln for ln in text.splitlines() if not ln.strip().startswith(("//", "*", "/*"))
        )
        real = []
        for hit in hits:
            if hit in code:
                real.append(hit)
        if real:
            offenders[name] = real
    assert not offenders, f"存在 `||` 数值兜底（会把真实 0 吞掉）: {offenders}"


def test_progress_helpers_preserve_zero():
    """进度解析 helper 必须用 Number.isFinite / ??，不得用 ||。"""
    home = _read(V2_JS / "home-controller.js")
    assert "function projectProgressMeta(" in home, "必须有 projectProgressMeta"
    anchor = home.find("function projectProgressMeta(")
    region = home[anchor : anchor + 700]
    assert "Number.isFinite" in region, "必须用 Number.isFinite 判定，而非真值判定"
    assert "||" not in region.replace("|| null", ""), "helper 内不得用 || 兜底"

    pc = _read(V2_JS / "projects-controller.js")
    assert "function rawNumber(" in pc, "必须有 rawNumber"
    assert "function progressMeta(" in pc, "必须有 progressMeta"


def test_no_fake_scene_shot_counts():
    """不得把缺失的 scenes/shots 伪造成 24/72。"""
    pc = _read(V2_JS / "projects-controller.js")
    code = "\n".join(
        ln for ln in pc.splitlines() if not ln.strip().startswith(("//", "*", "/*"))
    )
    assert "p.scenes || 24" not in code, "不得把缺失场次数伪造成 24"
    assert "p.shots || 72" not in code, "不得把缺失镜头数伪造成 72"


# ---------------------------------------------------------------------------
# Phase 9G-2：`progress: 0` fixture 的**行为级**守卫（Node 真实执行）
#
# 静态守卫只能证明没有 `|| 数字` 写法；本用例把两个 helper 从源文件**原样抽出**，
# 在 Node 内用 `progress: 0` 的 fixture 真实调用，断言：
#   1. 真实 0 必须原样返回 0（不得变 10 / 60 / 75）；
#   2. 缺失 / null / 空串 / 非数必须显式 degraded（不得静默给数字）。
# 证据边界：Node 行为验证 ≠ 真实浏览器 E2E。
# ---------------------------------------------------------------------------

_NODE = shutil.which("node")


def _extract_fn(source: str, name: str) -> str:
    """按花括号配平从源码中抽出完整函数定义（含 `function ` 前缀）。"""
    idx = source.find("function " + name + "(")
    assert idx != -1, f"未找到函数 {name}"
    brace = source.index("{", idx)
    depth = 0
    for pos in range(brace, len(source)):
        if source[pos] == "{":
            depth += 1
        elif source[pos] == "}":
            depth -= 1
            if depth == 0:
                return source[idx : pos + 1]
    raise AssertionError(f"函数 {name} 花括号不配平")


@pytest.mark.skipif(_NODE is None, reason="需要 Node 执行行为级断言")
def test_progress_zero_is_preserved_at_runtime(tmp_path):
    home_src = _read(V2_JS / "home-controller.js")
    pc_src = _read(V2_JS / "projects-controller.js")

    script = "\n".join(
        [
            _extract_fn(pc_src, "rawNumber"),
            _extract_fn(pc_src, "progressMeta"),
            _extract_fn(home_src, "projectProgressMeta"),
            "",
            "const fixtures = [",
            "  {name: 'zero', project: {progress: 0}},",
            "  {name: 'zeroString', project: {progress: '0'}},",
            "  {name: 'sixtyEight', project: {progress: 68}},",
            "  {name: 'missing', project: {}},",
            "  {name: 'null', project: {progress: null}},",
            "  {name: 'empty', project: {progress: ''}},",
            "  {name: 'nan', project: {progress: 'abc'}},",
            "  {name: 'entityOnly', project: {entity_count: 4, completed_entity_count: 3}},",
            "];",
            "const out = fixtures.map(f => ({",
            "  name: f.name,",
            "  home: projectProgressMeta(f.project),",
            "  pc: progressMeta(f.project),",
            "}));",
            "process.stdout.write(JSON.stringify(out));",
        ]
    )
    path = tmp_path / "probe.mjs"
    path.write_text(script, encoding="utf-8")
    result = subprocess.run(
        [_NODE, str(path)], capture_output=True, cwd=str(tmp_path), timeout=60
    )
    assert result.returncode == 0, result.stderr.decode("utf-8", "replace")[:500]
    data = {item["name"]: item for item in json.loads(result.stdout.decode("utf-8"))}

    # 1) 真实 0 必须原样保留为 0（不得变 10 / 60 / 75）
    assert data["zero"]["home"]["value"] == 0, "home: progress=0 被改写"
    assert data["zero"]["home"]["degraded"] is False
    assert data["zero"]["pc"]["value"] == 0, "projects: progress=0 被改写"
    assert data["zero"]["pc"]["degraded"] is False
    assert "0%" in data["zero"]["pc"]["html"], "projects: 渲染结果必须是 0%"
    for banned in ("10%", "60%", "75%"):
        assert banned not in data["zero"]["pc"]["html"], f"渲染结果混入伪造值 {banned}"

    # 字符串 '0' 同样必须解析为 0
    assert data["zeroString"]["home"]["value"] == 0

    # 2) 正常值原样透传
    assert data["sixtyEight"]["home"]["value"] == 68
    assert "68%" in data["sixtyEight"]["pc"]["html"]

    # 3) 缺失 / null / 空串 / 非数：必须显式 degraded，不得静默给数字
    for name in ("missing", "null", "empty", "nan"):
        assert data[name]["home"]["degraded"] is True, f"home: {name} 未显式降级"
        assert data[name]["home"]["value"] == 0, f"home: {name} 降级值应为 0"
        assert data[name]["pc"]["degraded"] is True, f"projects: {name} 未显式降级"
        assert data[name]["pc"]["value"] is None
        assert "未接入" in data[name]["pc"]["html"], f"projects: {name} 应明说未接入"

    # 4) 仅有 entity_count 时按完成比例推算，且不算降级
    assert data["entityOnly"]["home"]["value"] == 75
    assert data["entityOnly"]["home"]["degraded"] is False

# ---------------------------------------------------------------------------
# Phase 9F-3：伪硬件读数 / 随机遥测 / 在线徽标清零守卫（独立复核方第 2/3 次提醒的残留项）
# ---------------------------------------------------------------------------

#: 非 vendor 前端里不得出现的「伪硬件读数」字面量（无任何后端来源）
FAKE_HARDWARE_READOUTS = [
    "1.4TB",
    "4090×4",
    "3.84 TB",
    "/ 10 TB",
]

FRONTEND_SCAN_TARGETS = [
    (V2_DIR, "*.html"),
    (V2_DIR / "js", "*.js"),
    (STATIC_JS, "*.js"),
    (STATIC_JS / "asset-auth", "*.js"),
    (STATIC_JS / "asset-review", "*.js"),
]


def _frontend_files():
    """返回非 vendor 前端文件清单（v2 页面 + 前端脚本）。"""
    files = []
    for base, pattern in FRONTEND_SCAN_TARGETS:
        files.extend(sorted(base.glob(pattern)))
    return files


def test_frontend_has_no_fake_hardware_readouts():
    """不得残留 1.4TB / 4090x4 / 3.84 TB / 10 TB 这类无来源的伪硬件读数。

    只扫描**可执行代码行**：注释里说明「这里曾有伪读数、已移除」属正当留痕，
    不应被当成违规。
    """
    offenders = {}
    for path in _frontend_files():
        hits = []
        for line in path.read_text(encoding="utf-8").splitlines():
            if _is_comment_line(line):
                continue
            hits.extend(c for c in FAKE_HARDWARE_READOUTS if c in line)
        if hits:
            offenders[path.name] = sorted(set(hits))
    assert not offenders, f"仍有伪硬件读数: {offenders}"


#: 判定「随机数是否被当成遥测读数」的特征：赋值给百分比/指针/负载字段。
_RANDOM_TELEMETRY_PATTERNS = (
    re.compile(r"Math\.random\(\)[^;]*\*\s*\d+"),
    re.compile(r"(cpu|ram|gpu|vram|load|usage|temperat|percent|jitter|vibration)[A-Za-z_]*\s*=\s*[^;]*Math\.random\(\)", re.I),
    re.compile(r"Math\.random\(\)[^;]*setAttribute\('transform'"),
)


def test_frontend_has_no_random_driven_telemetry():
    """不得把 Math.random 当作遥测数据源。

    合法用途（随机 ID / nonce / client_id / 幂等键 / 抖动动画）不在禁用范围；
    禁止的是「随机数 → 百分比/负载/指针读数」这类伪造运行态的模式。
    """
    offenders = []
    for path in _frontend_files():
        for line in path.read_text(encoding="utf-8").splitlines():
            if _is_comment_line(line):
                continue
            if not any(pattern.search(line) for pattern in _RANDOM_TELEMETRY_PATTERNS):
                continue
            if _is_identifier_only_random(line):
                continue
            offenders.append(f"{path.name}: {line.strip()[:110]}")
    assert not offenders, f"仍存在 Math.random 驱动的伪遥测: {offenders}"


def test_static_fader_bars_are_zero_width_only():
    """静态 HTML 的 hw-fader-glow-bar 只有两种情况合法：

    - 宽度为 0%（未接入，或交由 JS 绑定真实数值）；
    - 显式标记 ``data-gw-control="user-input"``（真实用户交互参数初值，
      如 production.html 的 LoRA 权重 / Roughness / CFG，属用户输入而非遥测）。
    """
    offenders = {}
    for path in sorted(V2_DIR.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        for match in re.finditer(
            r'<div\s+class="hw-fader-glow-bar[^"]*"[^>]*?style="width:\s*([^;"]+)[^"]*"([^>]*?)>',
            text,
        ):
            value = match.group(1).strip()
            rest = match.group(2)
            if value in ("0%", "0"):
                continue
            if 'data-gw-control="user-input"' in rest:
                continue
            offenders.setdefault(path.name, []).append(value)
    assert not offenders, f"静态推子条残留非零写死宽度: {offenders}"


def test_asset_pool_size_is_marked_not_integrated():
    """资产池容量没有真实后端字段：必须显式标记未接入，不得显示编造的分母。"""
    index = _read(INDEX_HTML)
    assert 'id="statAssetPoolSize"' in index
    assert 'data-gw-degradation="not_integrated"' in index
    assert "3.84" not in index, "不得残留编造的容量读数"


def test_nodes_count_zero_is_preserved():
    """画布节点数为真实 0 时不得被 falsy 回退成 12（R6-12 同类缺陷）。"""
    js = _read(V2_JS / "projects-controller.js")
    assert "nodes_count ||" not in js, "不得用 `|| 数字` 吞掉真实 0（节点规模）"
    assert "rawNumber(c.nodes_count)" in js, "节点规模必须走 Number.isFinite 口径"


def test_telemetry_online_badges_require_real_status_fields():
    """团队/席位在线徽标必须由真实字段驱动，字段缺失时显示未接入。"""
    js = _read(TELEMETRY_JS)
    assert "statusChip" in js, "在线徽标必须走统一状态判定函数"
    assert "statusChip(team.status)" in js, "团队徽标必须读取真实 status 字段"
    assert "statusChip(u.online)" in js, "席位徽标必须读取真实 online 字段"
    assert ">ONLINE</span>" not in js, "不得无条件渲染 ONLINE"
    assert ">ACTIVE</span>" not in js, "不得无条件渲染 ACTIVE"

# ---------------------------------------------------------------------------
# legacy_page_degradation_guards: 5 个 legacy/v2 页面统一显式降级（2026-09-22 追加）
# ---------------------------------------------------------------------------
DEGRADATION_JS = STATIC_JS / "degradation.js"
API_SETTINGS_JS = STATIC_JS / "api-settings.js"
LEGACY_SETTINGS_JS = STATIC_JS / "settings.js"
GOVERNANCE_JS = STATIC_JS / "governance.js"
TASK_CENTER_JS = STATIC_JS / "task-center.js"
CANVAS_LIST_JS = STATIC_JS / "canvas-list.js"

STATIC_DIR = REPO_ROOT / "src" / "gods_workbench" / "static"
DEGRADATION_PAGE_BINDINGS = [
    (STATIC_DIR / "api-settings.html", "/static/js/api-settings.js"),
    (STATIC_DIR / "governance.html", "/static/js/governance.js"),
    (STATIC_DIR / "canvas-list.html", "/static/js/canvas-list.js"),
    (STATIC_DIR / "task-center.html", "/static/js/task-center.js"),
    (STATIC_DIR / "v2" / "settings.html", "/static/js/settings.js"),
]


def test_degradation_module_is_a_shared_single_source():
    """显式降级语义必须由单一共享模块导出。"""
    js = _read(DEGRADATION_JS)
    assert "window.GWDegradation" in js, "degradation.js 应导出 window.GWDegradation"
    for symbol in ("statusKind", "isNotIntegrated", "isServiceUnavailable", "NOT_INTEGRATED_MESSAGE"):
        assert symbol in js, "degradation.js 缺少 " + symbol
    assert "404" in js and "501" in js and "503" in js, "必须区分 404/501 与 503"


def test_api_settings_delegates_to_shared_degradation():
    """设置页必须委派共享判定，不得自建第二套语义。"""
    js = _read(API_SETTINGS_JS)
    assert "NOT_INTEGRATED_MESSAGE" in js
    assert "degradationLabel" in js, "应提供 degradationLabel 显式文案"
    assert "window.GWDegradation" in js, "应优先委派共享模块"
    assert "statusKind" in js, "状态分类必须委派 GWDegradation.statusKind"
    assert js.count("degradationLabel(") >= 5, "至少 5 处 catch 必须走显式降级文案"


def test_settings_page_has_no_silent_catch():
    """settings.js 不得静默吞掉未接入错误。"""
    js = _read(LEGACY_SETTINGS_JS)
    assert ".catch(() => {})" not in js, "不得保留静默 catch"
    assert "degradationText" in js
    assert "window.GWDegradation" in js
    assert "dataset.gwDegradation" in js, "降级必须带结构化标记"
    assert "value, error" in js, "Promise.all 必须逐项保留错误"


def test_governance_uses_explicit_degradation_message():
    """governance.js 不得把服务不可用退回泛泛失败。"""
    js = _read(GOVERNANCE_JS)
    assert "governanceDegradationMessage" in js
    assert js.count("governanceDegradationMessage(") >= 2, "定义与调用都必须存在"
    assert "NOT_INTEGRATED" in js and "SERVICE_UNAVAILABLE" in js


def test_task_center_tracks_load_error_kind():
    """task-center.js 必须标记降级类型。"""
    js = _read(TASK_CENTER_JS)
    assert "loadErrorKind" in js
    assert "taskCenterDegradationNotice" in js
    assert "data-gw-degradation" in js, "提示条必须带降级标记"


def test_canvas_list_badges_are_explicitly_degraded():
    """canvas-list.js 废弃桶/归档计数不得静默失败。"""
    js = _read(CANVAS_LIST_JS)
    assert "canvasListDegradationLabel" in js
    assert js.count("dataset.gwDegradation") >= 2, "两个徽标都必须标记"
    assert "未接入" in js, "徽标失败时应明说未接入"


def test_legacy_pages_load_degradation_before_page_scripts():
    """5 个页面必须在页面自身脚本之前引用 degradation.js。"""
    missing = []
    for html_path, page_script in DEGRADATION_PAGE_BINDINGS:
        html = _read(html_path)
        deco = html.find("/static/js/degradation.js")
        page = html.find(page_script)
        if deco == -1 or page == -1 or deco > page:
            missing.append(html_path.name + " (deco=" + str(deco) + ", page=" + str(page) + ")")
    assert not missing, "degradation.js 接线順序不正确: " + str(missing)
