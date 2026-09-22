# -*- coding: utf-8 -*-
"""Phase 8 P8-A1 前后端接口缺口基线与契约一致性守卫（纯 Python）。

背景
----
Phase 7 已取证前端存在大量调用后端**未实现**端点（真实 HTTP 404）的情况。
本用例把「前端静态层声明的 /api 路径集合」与「后端已实现路由集合」的关系**冻结为显式基线**，
使任何新增或减少的缺口都会立刻让测试失败，形成**防漂移守卫**。

本用例为**纯 Python 契约测试**：不启动浏览器、不访问网络、不依赖 uvicorn 进程。

三方对账口径
------------
1. 前端：扫描 `src/gods_workbench/static/` 下全部 `.js` / `.html`（排除 `vendor/`），
   提取字符串字面量（含模板串 `${ ... }` 嵌套）中以 `/api` 开头的路径；模板占位统一折叠为 `{p}`，
   查询串剥离，尾部斜杠归一化。
2. 后端：解析 `src/gods_workbench/api/*.py` 的装饰器路由，`APIRouter(prefix=...)` 展开为完整路径。
3. 契约：解析 `docs/contracts/*.yaml` 中成对出现的 `method:` / `path:`。

修复/变更指引
-------------
- 若测试因**新增缺口**失败：确认新引用是否为笔误或新功能；确属有意为之则更新本文件的 `KNOWN_UNIMPLEMENTED`
  基线，并在 `docs/governance/agent-reports-2026-09-21/P8-A1-FRONTEND-BACKEND-API-GAP.md` 记录。
- 若测试因**缺口减少**失败（即某端点已被实现）：这是**期望的改进**，请同步更新基线并补契约声明。
- **不得**为了让测试通过而放宽断言或删除条目而不做上述记录。
"""

import os
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = REPO_ROOT / "src" / "gods_workbench" / "static"
API_DIR = REPO_ROOT / "src" / "gods_workbench" / "api"
CONTRACTS = [
    REPO_ROOT / "docs" / "contracts" / "PROJECTS-HUB-INTERFACE-CATALOG.yaml",
    REPO_ROOT / "docs" / "contracts" / "CANVAS-INTERFACE-CATALOG.yaml",
    REPO_ROOT / "docs" / "contracts" / "ASSET-LIBRARY-INTERFACE-CATALOG.yaml",
    REPO_ROOT / "docs" / "contracts" / "OBSERVABILITY-INTERFACE-CATALOG.yaml",
    REPO_ROOT / "docs" / "contracts" / "PROMPT-LIBRARY-INTERFACE-CATALOG.yaml",
]

# ---------------------------------------------------------------------------
# 冻结基线（2026-09-21，基线提交 721c00c48e7d42beda4d52e1b6c5625800546fea）
# 2026-09-21 第二轮更正：helper 拼接类调用入集后，前端引用 180 → 188，未实现 172 → 180。
# ---------------------------------------------------------------------------

#: 前端引用且后端**已实现**的端点（归一化路径）
# 2026-09-21 Phase 9D 更新：`/api/asset-auth/status`、`/api/asset-auth/login`、
# `/api/asset-auth/logout`、`/api/asset-auth/callback` 已由
# `src/gods_workbench/api/routes_auth.py` 真实实现（OIDC 授权码 + PKCE + 服务端会话），
# 故由 KNOWN_UNIMPLEMENTED 迁入本基线。
KNOWN_IMPLEMENTED = frozenset([
    '/api/asset-library',
    '/api/asset-library/categories',
    '/api/asset-library/libraries',
    '/api/asset-auth/callback',
    '/api/asset-auth/login',
    '/api/asset-auth/logout',
    '/api/asset-auth/status',
    '/api/asset-registry/governance/projects/{p}/restore',
    '/api/asset-registry/projects',
    '/api/asset-registry/projects/{p}',
    '/api/asset-registry/projects/{p}/trash',
    '/api/asset-registry/projects/{p}/trash/restore',
    '/api/canvases',
    '/api/canvases/{p}',
    '/api/canvases/{p}/restore',
    '/api/observability',
    '/api/observability/overview',
    '/api/observability/series',
    '/api/observability/events',
    '/api/observability/tasks',
    '/api/observability/health',
    '/api/observability/sources',
    '/api/observability/asset-volumes',
    # 2026-09-22 Phase 10C：提示词库阶段新增 4 条路由（集合 GET/POST 与单对象 PATCH/DELETE）。
    '/api/prompt-libraries',
    '/api/prompt-libraries/categories',
    '/api/prompt-libraries/categories/{p}',
    '/api/prompt-libraries/{p}',
])

#: 前端引用但后端**未实现**的端点（归一化路径）—— 本守卫的核心防漂移清单
KNOWN_UNIMPLEMENTED = frozenset([
    '/api/ai/upload',
    '/api/app-info',
    '/api/asset-auth/bootstrap',
    '/api/asset-auth/operation-approvals',
    '/api/asset-auth/operation-approvals/{p}',
    '/api/asset-auth/teams',
    '/api/asset-auth/teams/{p}',
    '/api/asset-auth/tokens',
    '/api/asset-auth/users',
    '/api/asset-auth/users/{p}',
    '/api/asset-classification-prompt',
    '/api/asset-classification/background',
    '/api/asset-classification/jobs/{p}',
    '/api/asset-content',
    '/api/asset-content/pdf',
    '/api/asset-content/versions',
    '/api/asset-content/versions/{p}',
    '/api/asset-content/versions/{p}/restore',
    '/api/asset-file-info',
    '/api/asset-file-reveal',
    '/api/asset-library/categories/{p}',
    '/api/asset-library/items/batch',
    '/api/asset-library/items/classify',
    '/api/asset-library/items/delete',
    '/api/asset-library/items/move',
    '/api/asset-library/items/{p}',
    '/api/asset-library/items/{p}/avatar-status',
    '/api/asset-library/items/{p}/register-avatar',
    '/api/asset-library/libraries/{p}',
    '/api/asset-library/workflows/upload',
    '/api/asset-proxy/settings',
    '/api/asset-registry',
    '/api/asset-registry/asset-structures',
    '/api/asset-registry/asset-structures/{p}',
    '/api/asset-registry/asset-structures/{p}/current',
    '/api/asset-registry/assets',
    '/api/asset-registry/assets/archive',
    '/api/asset-registry/assets/export-pdf',
    '/api/asset-registry/assets/import',
    '/api/asset-registry/assets/relations',
    '/api/asset-registry/assets/resolve-reference',
    '/api/asset-registry/assets/tags',
    '/api/asset-registry/assets/{p}',
    '/api/asset-registry/assets/{p}/image-versions',
    '/api/asset-registry/assets/{p}/image-versions/{p}',
    '/api/asset-registry/assets/{p}/image-versions/{p}/media',
    '/api/asset-registry/assets/{p}/media',
    '/api/asset-registry/assets/{p}/open-local',
    '/api/asset-registry/assets/{p}/relations/{p}',
    '/api/asset-registry/assets/{p}/tags/{p}',
    '/api/asset-registry/assets/{p}/video/clip',
    '/api/asset-registry/assets/{p}/video/frame',
    '/api/asset-registry/assets/{p}/video/storyboard',
    '/api/asset-registry/facets',
    '/api/asset-registry/folders',
    '/api/asset-registry/governance/asset-trash/{p}/restore',
    '/api/asset-registry/governance/assets/{p}/restore',
    '/api/asset-registry/governance/audit-outbox/reconcile',
    '/api/asset-registry/governance/canvases/purge-expired',
    '/api/asset-registry/governance/canvases/{p}/restore',
    '/api/asset-registry/governance/cascade-preview',
    '/api/asset-registry/governance/operations',
    '/api/asset-registry/governance/overview',
    '/api/asset-registry/index/sync',
    '/api/asset-registry/preferences/team',
    '/api/asset-registry/presets',
    '/api/asset-registry/presets/{p}',
    '/api/asset-registry/project-directory-templates',
    '/api/asset-registry/project-directory-templates/{p}',
    '/api/asset-registry/project-directory-templates/{p}/archive',
    '/api/asset-registry/project-directory-templates/{p}/default',
    '/api/asset-registry/project-entities/{p}',
    '/api/asset-registry/project-gates/{p}',
    '/api/asset-registry/project-recycle/{p}/restore',
    '/api/asset-registry/projects/{p}/assets',
    '/api/asset-registry/projects/{p}/entities',
    '/api/asset-registry/recycle-bin',
    '/api/asset-registry/recycle-bin/{p}/restore',
    '/api/asset-registry/reindex',
    '/api/asset-registry/remote-assets',
    '/api/asset-registry/remote-assets/{p}',
    '/api/asset-registry/settings/features/{p}',
    '/api/asset-registry/settings/index-automation',
    '/api/asset-registry/status',
    '/api/asset-registry/workspace-jobs/{p}',
    '/api/asset-registry/workspace-jobs/{p}/{p}',
    '/api/asset-reviews/comments/{p}',
    '/api/asset-reviews/deliveries/{p}/export',
    '/api/asset-reviews/sessions',
    '/api/asset-reviews/sessions/{p}',
    '/api/asset-reviews/sessions/{p}/approval',
    '/api/asset-reviews/sessions/{p}/comments',
    '/api/asset-reviews/sessions/{p}/delivery',
    '/api/asset-reviews/shares',
    '/api/asset-thumbnails/delete',
    '/api/asset-thumbnails/delete-storyboards',
    '/api/asset-thumbnails/generate',
    '/api/asset-thumbnails/generate-background',
    '/api/asset-thumbnails/jobs/{p}',
    '/api/asset-thumbnails/settings',
    '/api/audio-waveform-data',
    '/api/canvas-assets',
    '/api/canvas-assets/download',
    '/api/canvases/assets',
    '/api/canvases/trash',
    '/api/chat',
    '/api/chat/agent',
    '/api/codex/help',
    '/api/codex/status',
    '/api/download-output',
    '/api/episode-pipelines',
    '/api/episode-pipelines/{p}',
    '/api/episode-pipelines/{p}/stages/{p}/cancel',
    '/api/episode-pipelines/{p}/stages/{p}/complete',
    '/api/episode-pipelines/{p}/stages/{p}/start',
    '/api/gemini-cli/help',
    '/api/gemini-cli/status',
    '/api/jimeng/credit',
    '/api/jimeng/help',
    '/api/jimeng/login/start',
    '/api/jimeng/login/status',
    '/api/jimeng/logout',
    '/api/jimeng/status',
    '/api/local-assets',
    '/api/local-assets/caption',
    '/api/local-assets/classify',
    '/api/local-assets/delete',
    '/api/local-assets/folders',
    '/api/local-assets/items',
    '/api/local-assets/move',
    '/api/local-assets/upload',
    '/api/media-preview',
    '/api/media-transcode',
    '/api/online-image',
    '/api/projects',
    '/api/projects/{p}',
    '/api/prompt-libraries/items',
    '/api/prompt-libraries/items/delete',
    '/api/prompt-libraries/items/{p}',
    '/api/providers',
    '/api/providers/fetch-models',
    '/api/providers/probe-async',
    '/api/providers/test-connection',
    '/api/public/shares/{p}',
    '/api/reference-canvases',
    '/api/shared-folders',
    '/api/shared-folders/import',
    '/api/shared-folders/{p}',
    '/api/shared-folders/{p}/tree',
    '/api/storage-files',
    '/api/storage-files/delete',
    '/api/storage-settings',
    '/api/video-tasks',
    '/api/video-tasks/{p}',
    # 2026-09-21 第二轮更正：helper 拼接类调用（如 `${canvasUrl(id)}/meta`）入集。
    # 旧扫描器只认以 /api 起头的字面量，这 8 条真实可达路径被结构性漏扫。
    '/api/asset-auth/teams/{p}/members',
    '/api/asset-auth/teams/{p}/members/{p}',
    '/api/canvases/{p}/meta',
    '/api/canvases/{p}/purge',
    '/api/canvases/{p}/touch',
    '/api/public/shares/{p}/access',
    '/api/public/shares/{p}/approvals',
    '/api/public/shares/{p}/comments',
])

#: 契约声明但**前端无调用方**的端点（仅后端能力，前端尚未接入；见 P8-A1 报告 §2.2 说明）
KNOWN_CONTRACT_WITHOUT_FRONTEND_CALLER = frozenset([
    "POST /api/canvases/{p}/workflow/import",
    "POST /api/canvases/{p}/workflow/export",
    "POST /api/canvases/{p}/tasks",
])

#: 后端已实现路由的归一化路径（用于断言后端集合未被意外缩小）
KNOWN_BACKEND_PATHS = frozenset([
    '/api/asset-library',
    '/api/asset-library/categories',
    '/api/asset-library/libraries',
    '/',
    '/api/asset-auth/callback',
    '/api/asset-auth/login',
    '/api/asset-auth/logout',
    '/api/asset-auth/status',
    '/api/asset-registry/governance/projects/{p}/restore',
    '/api/asset-registry/projects',
    '/api/asset-registry/projects/{p}',
    '/api/asset-registry/projects/{p}/trash',
    '/api/asset-registry/projects/{p}/trash/restore',
    '/api/canvases',
    '/api/canvases/{p}',
    '/api/canvases/{p}/restore',
    '/api/canvases/{p}/tasks',
    '/api/canvases/{p}/workflow/export',
    '/api/canvases/{p}/workflow/import',
    '/api/jobs/{p}',
    # 2026-09-22 Phase 10B：观测阶段新增 8 个 GET 路由。
    '/api/observability',
    '/api/observability/overview',
    '/api/observability/series',
    '/api/observability/events',
    '/api/observability/tasks',
    '/api/observability/health',
    '/api/observability/sources',
    '/api/observability/asset-volumes',
    # 2026-09-22 Phase 10C：提示词库阶段新增 4 条路由（集合 GET/POST 与单对象 PATCH/DELETE）。
    '/api/prompt-libraries',
    '/api/prompt-libraries/categories',
    '/api/prompt-libraries/categories/{p}',
    '/api/prompt-libraries/{p}',
    '/healthz',
])


# ---------------------------------------------------------------------------
# 扫描实现（与 P8-A1 报告同口径）
# ---------------------------------------------------------------------------

_REGEX_PRECEDING_KEYWORDS = (
    "return", "typeof", "instanceof", "in", "of", "new", "delete", "void",
    "case", "do", "else", "yield", "await",
)


def _skip_line_comment(text: str, i: int) -> int:
    """跳过 `//` 行注释，返回注释结束后的下标。"""
    j = text.find("\n", i)
    return len(text) if j == -1 else j


def _skip_block_comment(text: str, i: int) -> int:
    """跳过 `/* */` 块注释，返回注释结束后的下标。"""
    j = text.find("*/", i + 2)
    return len(text) if j == -1 else j + 2


def _regex_can_start(text: str, i: int) -> bool:
    """判断 `i` 处的 `/` 是否可能开启正则字面量（而非除号）。

    规则：向前跳过空白，若前一个有意义字符是运算符/分隔符/开括号，
    或前面是 `return` / `typeof` 等关键字，则视为正则起始。
    """
    j = i - 1
    while j >= 0 and text[j] in " \t\r\n":
        j -= 1
    if j < 0:
        return True
    prev = text[j]
    if prev in "([{;,:=!&|?+-*%^~<>":
        return True
    if prev.isalnum() or prev in "_$":
        k = j
        while k >= 0 and (text[k].isalnum() or text[k] in "_$"):
            k -= 1
        word = text[k + 1 : j + 1]
        return word in _REGEX_PRECEDING_KEYWORDS
    return False


def _skip_regex_literal(text: str, i: int) -> int:
    """跳过 `i` 处的正则字面量（含 flags），返回结束后的下标。

    正则内部可含**未转义的引号**（如 `/[&<>"']/g`），这正是此前提取器
    把后续大段代码误吞为「字符串」的根因。
    """
    n = len(text)
    j = i + 1
    in_class = False
    while j < n:
        c = text[j]
        if c == "\\":
            j += 2
            continue
        if c == "\n":
            return i + 1  # 未闭合并换行：不是正则，退回避免吞并
        if c == "[":
            in_class = True
        elif c == "]":
            in_class = False
        elif c == "/" and not in_class:
            j += 1
            while j < n and text[j].isalpha():
                j += 1
            return j
        j += 1
    return i + 1


def _scan_plain_string(text: str, i: int):
    """从 `i` 处的单/双引号开始扫描，返回 (原始内容, 结束下标)。"""
    quote = text[i]
    n = len(text)
    j = i + 1
    buf = []
    while j < n:
        c = text[j]
        if c == "\\":
            buf.append(text[j : j + 2])
            j += 2
            continue
        if c == quote:
            break
        if c == "\n":
            break
        buf.append(c)
        j += 1
    return "".join(buf), j + 1


def _scan_template_literal(text: str, i: int):
    """从 `i` 处的反引号开始扫描模板串，返回 (原始内容, 结束下标)。

    正确处理 `${ ... }` 内部表达式中的**嵌套模板串、普通字符串、注释与正则**。
    此前把内部反引号当作新串起点，导致 `asset-manager.js:17685` 的
    `` `[data-tab="${CSS.escape(movedId)}"]` `` 把后续整段代码吞并到文件末尾。
    """
    n = len(text)
    j = i + 1
    buf = []
    while j < n:
        c = text[j]
        if c == "\\":
            buf.append(text[j : j + 2])
            j += 2
            continue
        if c == "`":
            return "".join(buf), j + 1
        if c == "$" and j + 1 < n and text[j + 1] == "{":
            buf.append("${")
            j += 2
            depth = 1
            while j < n and depth > 0:
                c2 = text[j]
                if c2 == "\\":
                    buf.append(text[j : j + 2])
                    j += 2
                    continue
                if c2 == "{":
                    depth += 1
                    buf.append(c2)
                    j += 1
                    continue
                if c2 == "}":
                    depth -= 1
                    buf.append(c2)
                    j += 1
                    continue
                if c2 in ("'", '"'):
                    s, j = _scan_plain_string(text, j)
                    buf.append(s)
                    continue
                if c2 == "`":
                    s, j = _scan_template_literal(text, j)
                    buf.append(s)
                    continue
                if c2 == "/" and j + 1 < n and text[j + 1] == "/":
                    j = _skip_line_comment(text, j)
                    continue
                if c2 == "/" and j + 1 < n and text[j + 1] == "*":
                    j = _skip_block_comment(text, j)
                    continue
                if c2 == "/" and _regex_can_start(text, j):
                    j = _skip_regex_literal(text, j)
                    continue
                buf.append(c2)
                j += 1
            continue
        buf.append(c)
        j += 1
    return "".join(buf), j


def _extract_api_literals(text: str):
    """提取源码中所有以 /api 开头的字符串字面量，返回 (偏移, 字面量) 列表。

    支持反引号模板串的 `${ ... }` 嵌套（其内部可含引号、嵌套模板串、正则与注释），
    避免把模板串截断。单/双引号串按普通字符串处理。

    同时**跳过 `//`、`/* */` 注释与正则字面量**：正则内部可含未转义引号
    （实测 `asset-manager.js` 的 `/[&<>"']/g`），若不跳过会把该引号当作字符串起始
    并把文件后续大段代码整体吞并，导致该文件后续 `/api` 引用全部漏扫。
    """
    out = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            i = _skip_line_comment(text, i)
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            i = _skip_block_comment(text, i)
            continue
        if ch == "/" and _regex_can_start(text, i):
            i = _skip_regex_literal(text, i)
            continue
        if ch == "`":
            literal, i = _scan_template_literal(text, i)
            if literal.startswith("/api"):
                out.append((i, literal))
            continue
        if ch in ("'", '"'):
            literal, i = _scan_plain_string(text, i)
            if literal.startswith("/api"):
                out.append((i, literal))
            continue
        i += 1
    return out


def _collapse_template(value: str) -> str:
    """把 `${ ... }`（允许嵌套花括号）按**位置语义**折叠，再统一所有 `{...}` 为 `{p}`。

    位置语义（修复第三个提取器缺陷）：
    - 插值**紧跟 `/` 之后** → 属路径段，折叠为 `{p}`，继续扫描（如 `/assets/${id}/media`）；
    - 插值前**已出现 `?`** → 属查询值，路径在 `?` 处截断；
    - 插值**直接粘在路径段之后**（前面既不是 `/`、也没有 `?`）→ 属**查询串拼接**，
      路径在此截断。实测形如：

          `/api/audio-waveform-data${suffix ? `?${suffix}` : ''}`
          `/api/episode-pipelines${query}`
          `/api/asset-library/categories/${id}${suffix}`

      若按旧逻辑一律折叠为 `{p}`，会产出 `/api/audio-waveform-data{p}` 这类
      **并不存在的幽灵路径**，同时把真正的 `/api/audio-waveform-data` 漏出基线
      （既虚增、又漏算）。该规则已对全部 37 处「非斜杠前缀插值」逐条核对一致。
    """
    out = []
    i, n = 0, len(value)
    while i < n:
        if value.startswith("${", i):
            depth = 0
            j = i
            while j < n:
                if value.startswith("${", j):
                    depth += 1
                    j += 2
                    continue
                if value[j] == "}":
                    depth -= 1
                    j += 1
                    if depth == 0:
                        break
                    continue
                j += 1
            prefix = "".join(out)
            if "?" in prefix:
                # 已进入查询串：插值是查询值，路径到 `?` 为止
                out = [prefix.split("?", 1)[0]]
                break
            if prefix.endswith("/"):
                out.append("{p}")
                i = j
                continue
            # 非斜杠前缀插值 = 查询串拼接，路径到此为止
            break
        out.append(value[i])
        i += 1
    return re.sub(r"\{[^}]*\}", "{p}", "".join(out))


def _normalize(path: str) -> str:
    """归一化端点：折叠模板占位、剥离查询串、去除尾部斜杠。"""
    s = _collapse_template(path).split("?")[0]
    return s.rstrip("/") or "/"


_HELPER_DEF_RE = re.compile(
    r"(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*`(/api[^`]*)`"
)
_HELPER_CALL_RE = re.compile(r"^\$\{(\w+)\s*\([^)]*\)\}")


def _frontend_files():
    """前端静态层的待扫描文件（排除 vendor，仅 .js/.html）。"""
    for path in STATIC_DIR.rglob("*"):
        if not path.is_file() or path.suffix not in (".js", ".html"):
            continue
        if "vendor" in path.parts:
            continue
        yield path


def _frontend_helper_defs() -> dict:
    """返回 {helper 名: 基础 /api 模板}，用于还原 helper 拼接类调用。

    这类 helper 形如 ``const canvasUrl = id => `/api/canvases/${...}`;``，
    真实调用再由 ``${canvasUrl(id)}/meta`` 拼出后缀。
    """
    helpers = {}
    for path in _frontend_files():
        text = path.read_text(encoding="utf-8")
        for m in _HELPER_DEF_RE.finditer(text):
            helpers.setdefault(m.group(1), m.group(2))
    return helpers


def _extract_helper_call_literals(text: str):
    """提取以 ``${helper(...)}`` 开头的模板串字面量。

    与 `_extract_api_literals` 同源扫描（同样跳过注释/正则/单双引号串），
    区别只在于关注的是**不以 `/api` 开头**、却由 helper 基础路径拼出真实
    端点的那一类字面量（如 ``${canvasUrl(id)}/meta``）。旧实现完全漏扫。
    """
    out = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            i = _skip_line_comment(text, i)
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            i = _skip_block_comment(text, i)
            continue
        if ch == "/" and _regex_can_start(text, i):
            i = _skip_regex_literal(text, i)
            continue
        if ch == "`":
            literal, i = _scan_template_literal(text, i)
            if _HELPER_CALL_RE.match(literal):
                out.append((i, literal))
            continue
        if ch in ("'", '"'):
            _, i = _scan_plain_string(text, i)
            continue
        i += 1
    return out


def _frontend_api_paths() -> set:
    """扫描前端静态层（排除 vendor），返回归一化后的 /api 路径集合。"""
    assert STATIC_DIR.is_dir(), f"缺少前端静态目录: {STATIC_DIR}"
    helpers = _frontend_helper_defs()
    found = set()
    for path in _frontend_files():
        text = path.read_text(encoding="utf-8")
        for _, literal in _extract_api_literals(text):
            normalized = _normalize(literal)
            # 折叠后仍含引号/反斜杠说明提取异常，跳过以免污染基线
            if re.search(r"[`'\"\\]", normalized):
                continue
            found.add(normalized)
        # helper 拼接类调用：基础路径取自 helper 定义，后缀取自调用点
        for _, literal in _extract_helper_call_literals(text):
            m = _HELPER_CALL_RE.match(literal)
            base = helpers.get(m.group(1))
            if not base:
                continue
            normalized = _normalize(base + literal[m.end():])
            if re.search(r"[`'\"\\]", normalized):
                continue
            found.add(normalized)
    return found


def _backend_routes() -> dict:
    """解析后端路由，返回 {归一化路径: [(METHOD, 文件名, 行号), ...]}。"""
    assert API_DIR.is_dir(), f"缺少后端 API 目录: {API_DIR}"
    routes = {}
    for path in sorted(API_DIR.glob("*.py")):
        text = path.read_text(encoding="utf-8")
        prefixes = dict(
            re.findall(r'(\w+)\s*=\s*APIRouter\(\s*\n?\s*prefix\s*=\s*"([^"]*)"', text)
        )
        for m in re.finditer(r'@(\w+)\.(get|post|patch|put|delete)\(\s*\n?\s*"([^"]*)"', text):
            var, method, sub = m.group(1), m.group(2).upper(), m.group(3)
            full = (prefixes.get(var, "") + sub) or "/"
            routes.setdefault(_normalize(full), []).append(
                (method, path.name, text[: m.start()].count("\n") + 1)
            )
        for m in re.finditer(r'@app\.(get|post|patch|put|delete)\(\s*\n?\s*"([^"]*)"', text):
            routes.setdefault(_normalize(m.group(2)), []).append(
                (m.group(1).upper(), path.name, text[: m.start()].count("\n") + 1)
            )
    return routes


def _contract_pairs():
    """解析契约文件的 (METHOD, 归一化路径, 文件) 列表。"""
    pairs = []
    for path in CONTRACTS:
        assert path.is_file(), f"缺少契约文件: {path}"
        text = path.read_text(encoding="utf-8")
        for method, route in re.findall(r'method:\s*(\w+)\s*\n\s*path:\s*(\S+)', text):
            pairs.append((method.upper(), _normalize(route), path.name))
    return pairs


# ---------------------------------------------------------------------------
# 用例
# ---------------------------------------------------------------------------

def test_frontend_referenced_api_paths_match_frozen_baseline():
    """防漂移：前端引用的 /api 路径全集必须与冻结基线一致。

    新增或删除任何前端 /api 引用都会使本用例失败，迫使显式复核。
    """
    actual = _frontend_api_paths()
    expected = set(KNOWN_IMPLEMENTED) | set(KNOWN_UNIMPLEMENTED)
    missing = sorted(expected - actual)
    added = sorted(actual - expected)
    assert not missing, (
        "前端 /api 引用**减少**了以下路径（基线中登记但当前扫描不到）：\n  " + "\n  ".join(missing) +
        "\n若确属删除/重命名，请同步更新本守卫与 P8-A1 报告。"
    )
    assert not added, (
        "前端**新增**了以下 /api 引用（未登记在基线中）：\n  " + "\n  ".join(added) +
        "\n请确认是否为笔误或新功能，并同步更新本守卫与 P8-A1 报告。"
    )


def test_unimplemented_api_paths_match_frozen_baseline():
    """核心断言：前端调用但后端未实现的端点集合必须与冻结清单一致。

    这是本批次「前后端范围差异」的**防漂移基线**：
    - 若某端点被实现（缺口减少）→ 需更新基线并补契约声明；
    - 若新增未实现引用 → 需先确认契约与实现范围。
    """
    front = _frontend_api_paths()
    back = _backend_routes()
    actual_unimplemented = {p for p in front if p not in back}
    expected = set(KNOWN_UNIMPLEMENTED)
    resolved = sorted(expected - actual_unimplemented)
    new_gaps = sorted(actual_unimplemented - expected)
    assert not new_gaps, (
        "发现**新增**的「前端调用但后端未实现」端点：\n  " + "\n  ".join(new_gaps) +
        "\n按洁净室口径，未在冻结契约内的端点不得直接实现；请先补契约或显式登记。"
    )
    assert not resolved, (
        "以下端点**已不再是缺口**（可能已被实现或前端引用已移除）：\n  " + "\n  ".join(resolved) +
        "\n这是期望的改进，请更新 KNOWN_UNIMPLEMENTED / KNOWN_IMPLEMENTED 基线并补契约。"
    )


def test_implemented_api_paths_match_frozen_baseline():
    """前端引用且后端已实现的端点集合必须与冻结基线一致。"""
    front = _frontend_api_paths()
    back = _backend_routes()
    actual = {p for p in front if p in back}
    expected = set(KNOWN_IMPLEMENTED)
    assert actual == expected, (
        "「前端引用且后端已实现」的端点集合发生漂移：\n"
        f"  基线新增: {sorted(actual - expected)}\n"
        f"  基线缺失: {sorted(expected - actual)}\n"
        "请同步更新本守卫与 P8-A1 报告。"
    )


def test_backend_route_set_not_narrowed():
    """后端已实现路由集合不得被意外缩小（防止静默删除路由）。"""
    actual = set(_backend_routes())
    expected = set(KNOWN_BACKEND_PATHS)
    removed = sorted(expected - actual)
    assert not removed, (
        "后端路由被移除或重命名：\n  " + "\n  ".join(removed) +
        "\n如属有意变更，请同步更新契约与本守卫基线。"
    )


def test_every_contract_endpoint_has_backend_implementation():
    """契约一致性：契约声明的每个 method+path 都必须有对应后端实现。"""
    routes = _backend_routes()
    pairs = _contract_pairs()
    assert pairs, "未从契约文件中解析出任何 method+path，请检查契约格式。"
    missing = []
    for method, route, source in pairs:
        if route not in routes or not any(method == m for m, _, _ in routes[route]):
            missing.append(f"{method} {route}（契约文件 {source}）")
    assert not missing, (
        "以下契约端点在后端没有实现（契约与实现不一致）：\n  " + "\n  ".join(missing)
    )


def test_contract_endpoints_without_frontend_caller_match_baseline():
    """契约端点中**没有前端调用方**的集合必须与冻结基线一致。

    本轮实测发现 3 条契约端点在 `src/gods_workbench/static/` 中**找不到任何调用方**
    （画布工作流导入/导出、智能任务受理）。这**不是缺陷**——它们是后端契约能力，
    但意味着：① 前端尚未接入这些能力；② 因此**没有前端侧的端到端覆盖**。
    冻结为基线，任何变化（新增未接入契约，或前端补上调用）都会使本用例失败，迫使显式复核。
    """
    front = _frontend_api_paths()
    actual = []
    for method, route, source in _contract_pairs():
        if route not in front:
            actual.append(f"{method} {route}")
    expected = set(KNOWN_CONTRACT_WITHOUT_FRONTEND_CALLER)
    new_dead = sorted(set(actual) - expected)
    resolved = sorted(expected - set(actual))
    assert not new_dead, (
        "以下契约端点**新出现**「无前端调用方」状态：\n  " + "\n  ".join(new_dead) +
        "\n请确认是前端接入被移除，还是契约新增了未被前端使用的端点。"
    )
    assert not resolved, (
        "以下契约端点**已被前端接入**（不再是「无调用方」）：\n  " + "\n  ".join(resolved) +
        "\n这是期望的改进，请更新 KNOWN_CONTRACT_WITHOUT_FRONTEND_CALLER 基线。"
    )
