"""洁净室卫生自检与防污染自动化测试。

保障仓库零旧仓实现泄漏、零未授权二进制资源、零插件协议隐式实现。
"""

from pathlib import Path
import hashlib
import re
import pytest


# 禁用扩展名 / 白名单的**唯一事实来源**：`tests/hygiene/cleanroom_extensions.py`。
# 历史教训：同一份清单曾在三个位置各写一遍，并已实际漂移（39 / 39 / 27 项）。
# 因此此处**禁止再写字面量**，一律从单一来源导入；CI 侧由下述契约用例反查比对。
from cleanroom_extensions import (  # noqa: E402
    ALLOWED_BINARY_ALLOWLIST,
    BANNED_EXTENSIONS,
    REQUIRED_BANNED_EXTENSIONS,
)


def _pytest_cleanroom_allowlist_is_consistent() -> None:
    """唯一来源自检：必需集合不得超出实际清单（防止来源文件自身被削）。"""
    assert REQUIRED_BANNED_EXTENSIONS <= BANNED_EXTENSIONS
    assert len(ALLOWED_BINARY_ALLOWLIST) == 3


_pytest_cleanroom_allowlist_is_consistent()


def _canonical_sha256(path: Path) -> str:
    """按内容规范化（CRLF/CR 归一为 LF）后计算 SHA-256。

    登记表绑定的是**文件内容**，而不是某个平台的检出行尾表示；Windows 工作树
    与 Linux CI 检出必须得到同一结论，因此比较前统一归一化行尾。
    """
    raw = path.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(raw).hexdigest()


def test_no_banned_binary_assets(repo_root: Path):
    """确保仓库中绝不存在受限的图片、字体或音视频等二进制资源。

    扫描全仓（跳过 .git）；命中 BANNED_EXTENSIONS 的文件中，仅当其仓库相对路径不在 ALLOWED_BINARY_ALLOWLIST 白名单内时才计入违规。
    """
    found_banned = []
    for p in repo_root.rglob("*"):
        if ".git" in p.parts:
            continue
        if not p.is_file() or p.suffix.lower() not in BANNED_EXTENSIONS:
            continue
        relative_path = p.relative_to(repo_root).as_posix()
        if relative_path in ALLOWED_BINARY_ALLOWLIST:
            # 白名单逐条精确命中，不计入违规
            continue
        found_banned.append(relative_path)

    assert not found_banned, (
        "发现受限二进制资源进入仓库"
        f"（不在白名单内）: {found_banned}"
    )


def test_banned_extensions_cover_required_categories():
    """防止禁用扩展名清单被静默删减（回归护栏）。

    AGENTS.md 1.2 条把压缩包与可执行文件同列为禁提交项；此处用最小必需集合
    反查实际清单，任何被删掉的后缀都会立刻让门禁变红，而不是静默放行。
    """
    missing = sorted(REQUIRED_BANNED_EXTENSIONS - BANNED_EXTENSIONS)
    assert not missing, f"禁用扩展名清单缺少必需项: {missing}"


def test_ci_workflow_banned_extensions_match_single_source(repo_root: Path):
    """CI 侧清单必须与 `cleanroom_extensions` 唯一来源逐项一致。

    历史缺陷：CI heredoc 与 Python 用例各自维护一份清单，已实际漂移，
    导致「本地绿 / CI 空窗」。此用例把 CI 清单也钉在唯一来源上，
    任何一侧单独改动都会立刻变红。
    """
    workflow = (repo_root / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    block = re.search(r"banned_extensions = \{(.*?)\}", workflow, re.S)
    assert block, "CI 工作流中未找到 banned_extensions 清单"
    ci_set = set(re.findall(r'"(\.[a-z0-9]+)"', block.group(1)))
    assert ci_set == BANNED_EXTENSIONS, (
        "CI 清单与唯一来源不一致："
        f"仅 CI 有 {sorted(ci_set - BANNED_EXTENSIONS)}；"
        f"仅来源有 {sorted(BANNED_EXTENSIONS - ci_set)}"
    )


def test_phase6_deep_hygiene_uses_single_source(repo_root: Path):
    """Phase 6 深度审计套件不得再自带一份禁用扩展名清单。"""
    other = (repo_root / "tests" / "hygiene" / "test_phase6_deep_hygiene.py").read_text(
        encoding="utf-8"
    )
    assert "cleanroom_extensions" in other, "Phase 6 套件必须导入唯一来源，禁止自带字面量清单"
    literal = re.search(r"banned_extensions\s*=\s*\{", other)
    assert not literal, "Phase 6 套件仍存在自带 banned_extensions 字面量"


def test_src_has_no_legacy_code_artifacts(repo_root: Path):
    """确保 src/ 下没有引入旧仓私有实现命名或旧仓库硬编码路径。"""
    src_dir = repo_root / "src"
    assert src_dir.exists(), "src 目录必须存在"

    for py_file in src_dir.rglob("*.py"):
        text = py_file.read_text(encoding="utf-8")
        # 严禁在实现代码中硬编码旧仓路径
        assert "Gods-Workbench-release" not in text, f"{py_file.name} 中不得出现旧仓路径"
        assert "import tools.photoshop" not in text
        assert "import asset_registry.canvas_engine" not in text


def test_plugin_protocol_exclusion(repo_root: Path):
    """验证插件协议当前保持排除，未被 src 代码隐式实现。"""
    src_dir = repo_root / "src"
    for py_file in src_dir.rglob("*.py"):
        text = py_file.read_text(encoding="utf-8")
        assert "PluginProtocol" not in text, f"{py_file.name} 不得实现待审的插件协议"
        assert "plugin_connector" not in text


def test_static_layer_has_no_legacy_integration_markers(repo_root: Path):
    """确保重写的静态层没有旧路径、经典页面或不健康集成。

    口径（用户 2026-09-20 裁决）：
      * 保留范围：V2 前端整体保留（static/v2/**）；画布/工具仅保留“入口首页”内容。
        V2 页面互相引用的 storyboard.html / production.html / agents.html /
        collab.html / settings.html、CDN 图标库 lucide、unsplash.com 占位图源、
        window.V2Projects 命名空间，以及仍在 V2 链路内合法使用的 asset-manager.html
        等保留内容不作为禁用标记。
      * 禁用范围：
        1. 已删除的 V1 经典页面入口：/static/home.html、/static/index.html、
           /static/gpt-chat.html、/static/project-board.html、/static/settings.html；
        2. 已删除的经典集成端点关键字：chrome-local；
        3. 已删除的 comfyui / runninghub 文件与路径不得重现，也不得被保留页面引用。

    依据：AGENTS.md（洁净室铁律与 Lucide CDN 合规）、
    docs/migration/CLASSIC-REMOVAL-PLAN-2026-09-18.md、
    docs/governance/TASK-NOTES-2026-09-18.md 第 4 节（T13）。
    """
    static_dir = repo_root / "src" / "gods_workbench" / "static"
    deleted_paths = (
        static_dir / "comfyui-settings.html",
        static_dir / "css" / "comfyui-settings.css",
        static_dir / "js" / "comfyui-settings.js",
        static_dir / "js" / "i18n" / "comfyui-settings.js",
        static_dir / "runninghub",
    )
    reappeared = [
        path.relative_to(repo_root).as_posix()
        for path in deleted_paths
        if path.exists()
    ]
    assert not reappeared, f"已删除的 comfyui/runninghub 文件或目录重现: {reappeared}"

    forbidden_markers = (
        "/static/home.html",
        "/static/index.html",
        "/static/gpt-chat.html",
        "/static/project-board.html",
        "/static/settings.html",
        "chrome-local",
    )
    violations = []
    for path in static_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".html", ".css", ".js"}:
            content = path.read_text(encoding="utf-8").lower()
            for marker in forbidden_markers:
                if marker in content:
                    violations.append(f"{path.relative_to(repo_root)}: {marker}")
    assert not violations, f"静态层发现旧集成残留: {violations}"

    deleted_reference_markers = (
        "/static/runninghub/",
        "comfyui-settings.html",
        "comfyui-settings.js",
        "comfyui-settings.css",
    )
    reference_violations = []
    for path in static_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".html", ".css", ".js"}:
            content = path.read_text(encoding="utf-8").lower()
            for marker in deleted_reference_markers:
                if marker in content:
                    reference_violations.append(f"{path.relative_to(repo_root)}: {marker}")
    assert not reference_violations, f"保留页面引用已删除路径: {reference_violations}"

    scope_marker_violations = []
    for path in static_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".html", ".css", ".js"}:
            content = path.read_text(encoding="utf-8").lower()
            for marker in ("comfyui", "runninghub", "running-hub"):
                if marker in content:
                    scope_marker_violations.append(f"{path.relative_to(repo_root)}: {marker}")
    assert not scope_marker_violations, (
        "静态层不得保留 comfyui/runninghub 业务标识或调用: "
        f"{scope_marker_violations}"
    )


def test_accepted_non_canvas_slices_match_migration_manifest(repo_root: Path):
    """确保登记为可迁移的两个非画布切片没有被无意改写。"""
    manifest = repo_root / "docs" / "provenance" / "AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt"
    manifest_text = manifest.read_text(encoding="utf-8")
    expected = {}
    target_path = None
    for line in manifest_text.splitlines():
        target_match = re.match(r"^目标：(.+)$", line)
        hash_match = re.match(r"^目标 SHA-256：([0-9A-Fa-f]{64})$", line)
        if target_match:
            target_path = target_match.group(1).strip()
        elif hash_match and target_path:
            expected[target_path] = hash_match.group(1).lower()
            target_path = None

    assert set(expected) == {
        "src/gods_workbench/static/v2/js/project-date-range.js",
        "src/gods_workbench/static/v2/css/project-date-range.css",
    }
    actual = {}
    for relative_path in expected:
        path = repo_root / relative_path
        actual[relative_path] = _canonical_sha256(path)
    assert actual == expected, "接受迁移切片的目标哈希与来源登记不一致"


def test_phase2_input_hashes_match_current_files(repo_root: Path):
    """确保行为、契约和黄金夹具输入登记仍绑定当前文件内容。"""
    register = repo_root / "docs" / "provenance" / "PHASE-2-INPUT-SHA256.txt"
    entries = []
    for line in register.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^([0-9A-Fa-f]{64})\s+(.+)$", line)
        if match:
            entries.append((match.group(1).lower(), match.group(2).strip()))
    assert len(entries) == 16
    for expected, relative_path in entries:
        actual = _canonical_sha256(repo_root / relative_path)
        assert actual == expected, f"输入哈希不匹配: {relative_path}"


def _parse_doc_migration_entries(manifest_text: str) -> dict:
    """解析设计文档迁移登记，返回 {相对路径: 期望 SHA-256}。

    同一路径可能被多次登记（后续章节更正早期哈希）；按「最后一条为准」取用，
    与清单中「自本节起以最后一条四元组为准」的声明一致。
    """
    expected = {}
    target_path = None
    for line in manifest_text.splitlines():
        target_match = re.match(r"^目标文件：(.+)$", line)
        if target_match:
            target_path = target_match.group(1).strip()
            continue
        hash_match = re.match(r"^SHA256：([0-9A-Fa-f]{64})$", line)
        if hash_match and target_path:
            expected[target_path] = hash_match.group(1).lower()
            target_path = None
    return expected


def test_accepted_doc_slices_match_migration_manifest(repo_root: Path):
    """确保登记为 ACCEPTED_DOC_MIGRATION 的 9 份设计文档未被无意改写。

    依据：docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt
    独立复核（Phase 9B R2/D8）曾发现 docs/design/README.md 哈希漂移却无守卫；
    本用例补齐全部登记文档的内容守卫。
    """
    manifest = repo_root / "docs" / "provenance" / "AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt"
    expected = _parse_doc_migration_entries(manifest.read_text(encoding="utf-8"))
    assert len(expected) == 9, f"设计文档迁移登记条数异常: {sorted(expected)}"
    for relative_path, expected_sha in expected.items():
        actual = _canonical_sha256(repo_root / relative_path)
        assert actual == expected_sha, (
            f"设计文档迁移哈希不匹配: {relative_path}"
            f"（期望 {expected_sha.upper()}，实际 {actual.upper()}）"
        )


# ---------------------------------------------------------------------------
# 同形字（homoglyph）防污染守卫
# ---------------------------------------------------------------------------

# 可疑码点区间：西里尔（与拉丁同形）、零宽字符、双向控制/隐形字符、软连字符。
# 说明：中文全角标点（U+FF00 段）属正常书写，不在本守卫范围。
_SUSPICIOUS_RANGES = (
    (0x0400, 0x04FF),   # 西里尔字母（U+0441 / U+0435 / U+043E / U+0430 / U+0440 / U+0445 等与拉丁同形）
    (0x200B, 0x200F),   # 零宽空格/零宽连接符/双向控制
    (0x2060, 0x2064),   # 词连接符、不可见分隔符
    (0xFE00, 0xFE0F),   # 变体选择符
    (0x00AD, 0x00AD),   # 软连字符
)

# 扫描范围：仓库自有文本（代码/文档/测试/配置）。
# 排除项：
#   * src/gods_workbench/static/vendor/            —— 上游不可变制品；
#   * src/gods_workbench/static/prompt-registry/sources/ —— 第三方内容数据（含合法双向标记）。
_HOMOGLYPH_TEXT_SUFFIXES = {
    ".py", ".js", ".html", ".css", ".json",
    ".yml", ".yaml", ".md", ".txt", ".toml", ".cfg", ".ini", ".sh", ".ps1",
}
_HOMOGLYPH_EXCLUDED_PREFIXES = (
    "src/gods_workbench/static/vendor/",
    "src/gods_workbench/static/prompt-registry/sources/",
)


def _is_suspicious_codepoint(codepoint: int) -> bool:
    """判断码点是否属于同形字/隐形字符区间。"""
    return any(low <= codepoint <= high for low, high in _SUSPICIOUS_RANGES)


def _is_token_char(char: str) -> bool:
    """标识符 token 的字符：ASCII 字母数字、下划线/美元符、或可疑字符。"""
    if char in "_$":
        return True
    if char.isascii() and char.isalnum():
        return True
    return _is_suspicious_codepoint(ord(char))


def _scan_homoglyph_tokens(text: str) -> list:
    """返回文中「ASCII 标识符内混入可疑字符」的 (token, 起始偏移) 列表。

    返回偏移而非仅 token，是为了让调用方计算**该次命中自身**所在的行号，
    避免同一 token 多次出现时因 find() 取首次位置而报错行。
    """
    found = []
    index = 0
    length = len(text)
    while index < length:
        if not _is_token_char(text[index]):
            index += 1
            continue
        start = index
        end = index
        while end < length and _is_token_char(text[end]):
            end += 1
        token = text[start:end]
        if any(_is_suspicious_codepoint(ord(c)) for c in token) and any(
            c.isascii() and c.isalpha() for c in token
        ):
            found.append((token, start))
        index = end
    return found


def test_no_homoglyph_confusables(repo_root: Path):
    """确保仓库自有文本中不存在混入 ASCII 标识符的同形字/隐形字符。

    背景：多次审查发现文档或代码内出现「西里尔字母 + 零宽空格」伪装的标识符
    （如把 ``credential`` 写成形近串）。这类字符肉眼不可辨、可绕过字符串比对，
    属于典型的内容污染。本用例把它变成持续门禁，防止回归。
    """
    violations = []
    for path in repo_root.rglob("*"):
        if not path.is_file():
            continue
        if any(
            part in {
                ".git", "__pycache__", ".pytest_cache", "node_modules",
                ".venv", "venv", "env", "build", "dist", ".mypy_cache", ".ruff_cache",
            }
            for part in path.parts
        ):
            continue
        relative = path.relative_to(repo_root).as_posix()
        if relative.startswith(_HOMOGLYPH_EXCLUDED_PREFIXES):
            continue
        suffix = path.suffix.lower()
        if suffix not in _HOMOGLYPH_TEXT_SUFFIXES and path.name not in {".gitattributes", ".gitignore"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for token, offset in _scan_homoglyph_tokens(text):
            line = text.count("\n", 0, offset) + 1
            codepoints = " ".join(f"U+{ord(c):04X}" for c in token if _is_suspicious_codepoint(ord(c)))
            violations.append(f"{relative}:{line} token={token!r} 可疑码点={codepoints}")
    assert not violations, "发现同形字/隐形字符污染:\n" + "\n".join(violations)


def test_homoglyph_guard_detects_injected_pollution():
    """反向自检：证明上面的守卫不是恒真。

    用 chr() 在运行时构造一个「西里尔 U+0441 + 零宽空格 U+200B」伪装的 ``credential``，
    守卫必须命中；否则守卫失效（例如区间写错、匹配逻辑恒假）。
    """
    polluted = chr(0x0441) + "redential"          # U+0441 CYRILLIC SMALL LETTER ES
    polluted_zwsp = "cred" + chr(0x200B) + "ential"  # 零宽空格
    assert _scan_homoglyph_tokens(polluted), "守卫未能识别西里尔同形字"
    assert _scan_homoglyph_tokens(polluted_zwsp), "守卫未能识别零宽空格"
    assert all(isinstance(item, tuple) and len(item) == 2 for item in _scan_homoglyph_tokens(polluted))
    # 反向对照：纯 ASCII 与正常中文不得误报
    assert not _scan_homoglyph_tokens("credential"), "纯 ASCII 被误判"
    assert not _scan_homoglyph_tokens("会话失效，请重新登录。"), "正常中文被误判"
