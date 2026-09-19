"""洁净室卫生自检与防污染自动化测试。

保障仓库零旧仓实现泄漏、零未授权二进制资源、零插件协议隐式实现。
"""

from pathlib import Path
import hashlib
import re
import pytest


BANNED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico",
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ".mp3", ".wav", ".ogg", ".mp4", ".mov",
}

# 唯一二进制白名单：用户 2026-09-18 指示的 3 个开源思源黑体本地字体（本地运行期强依赖）。
# 这三条为逐条精确路径；除此之外的任何二进制资源一律视为违规。
ALLOWED_BINARY_ALLOWLIST = {
    "src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf",
    "src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf",
    "src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf",
}


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

    口径（用户 2026-09-19 裁决）：
      * 保留范围：V2 前端整体保留（static/v2/**）；画布/工具仅保留“入口首页”内容。
        因此 V2 页面互相引用的 storyboard.html / production.html / agents.html /
        collab.html / settings.html、CDN 图标库 lucide、unsplash.com 占位图源、
        window.V2Projects 命名空间，以及仍在 V2 链路内合法使用的 asset-manager.html /
        comfyui / runninghub 等业务标识，不再作为禁用标记（重定义前曾造成 130+ 处误报）。
      * 禁用范围：
        1. 已删除的 V1 经典页面入口：/static/home.html、/static/index.html、
           /static/gpt-chat.html、/static/project-board.html、/static/settings.html；
        2. 已删除的经典集成端点关键字：chrome-local。

    依据：AGENTS.md（洁净室铁律与 Lucide CDN 合规）、
    docs/migration/CLASSIC-REMOVAL-PLAN-2026-09-18.md、
    docs/governance/TASK-NOTES-2026-09-18.md 第 4 节（T13）。
    """
    static_dir = repo_root / "src" / "gods_workbench" / "static"
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
        actual[relative_path] = hashlib.sha256(path.read_bytes()).hexdigest()
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
        actual = hashlib.sha256((repo_root / relative_path).read_bytes()).hexdigest()
        assert actual == expected, f"输入哈希不匹配: {relative_path}"
