"""洁净室卫生自检与防污染自动化测试。

保障仓库零旧仓实现泄漏、零未授权二进制资源、零插件协议隐式实现。
"""

from pathlib import Path
import pytest


BANNED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico",
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ".mp3", ".wav", ".ogg", ".mp4", ".mov",
}


def test_no_banned_binary_assets(repo_root: Path):
    """确保仓库中绝不存在受限的图片、字体或音视频等二进制资源。"""
    found_banned = []
    for p in repo_root.rglob("*"):
        if ".git" in p.parts:
            continue
        if p.is_file() and p.suffix.lower() in BANNED_EXTENSIONS:
            found_banned.append(str(p.relative_to(repo_root)))

    assert not found_banned, f"发现受限二进制资源进入仓库: {found_banned}"


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
