from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_account_avatar_activates_auth_center_by_mouse_and_keyboard():
    """全局用户头像（含动态 shell）必须能打开认证中心，键盘同样可用。"""
    telemetry = (ROOT / "src/gods_workbench/static/js/hardware-telemetry.js").read_text(encoding="utf-8")
    shell = (ROOT / "src/gods_workbench/static/v2/js/v2-shell.js").read_text(encoding="utf-8")

    assert "event.target.closest('.hw-avatar-keycap, #hwTopbarAvatar')" in telemetry
    assert "this.openAccountModal()" in telemetry
    assert "event.key !== 'Enter'" in telemetry and "event.key !== ' '" in telemetry
    assert 'role="button" tabindex="0"' in shell
