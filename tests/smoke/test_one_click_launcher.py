"""Windows 一键启动入口的无副作用回归。"""

import importlib.machinery
import importlib.util
from pathlib import Path, PureWindowsPath


LAUNCHER = Path(__file__).resolve().parents[2] / "启动GodsWorkbench.pyw"


def load_launcher():
    loader = importlib.machinery.SourceFileLoader("gods_workbench_one_click", str(LAUNCHER))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


def test_one_click_entry_uses_python_windowed_script():
    assert LAUNCHER.is_file()
    assert LAUNCHER.suffix == ".pyw"


def test_existing_service_opens_home_without_starting_duplicate(monkeypatch):
    launcher = load_launcher()
    opened = []
    monkeypatch.setattr(launcher, "is_ready", lambda: True)
    monkeypatch.setattr(launcher.webbrowser, "open", lambda url: opened.append(url) or True)
    monkeypatch.setattr(launcher.subprocess, "Popen", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("重复启动")))
    launcher.start(wait_seconds=1, no_browser=False)
    assert opened == ["http://127.0.0.1:2077/"]


def test_unhealthy_response_cannot_be_reused(monkeypatch):
    launcher = load_launcher()

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            pass

    monkeypatch.setattr(launcher, "urlopen", lambda *args, **kwargs: FakeResponse())
    monkeypatch.setattr(launcher.json, "load", lambda response: {"status": "ok", "mode": "unrelated"})
    assert launcher.is_ready() is False

def test_fresh_start_opens_visible_console_with_console_python(monkeypatch):
    launcher = load_launcher()
    readiness = iter([False, True])
    captured = {}
    monkeypatch.setattr(launcher, "is_ready", lambda: next(readiness))
    monkeypatch.setattr(launcher.sys, "executable", r"C:\Python311\pythonw.exe")
    monkeypatch.setattr(launcher.subprocess, "CREATE_NEW_CONSOLE", 16, raising=False)

    def spawn(command, **kwargs):
        captured.update(command=command, **kwargs)
        return object()

    monkeypatch.setattr(launcher.subprocess, "Popen", spawn)
    launcher.start(wait_seconds=1, no_browser=True)
    # 启动命令是 Windows 路径；Linux CI 的 Path 不会按反斜杠拆分。
    assert PureWindowsPath(captured["command"][0]).name == "python.exe"
    assert captured["creationflags"] == 16
    assert "stdout" not in captured and "stderr" not in captured
    assert "stdin" not in captured
    assert Path(captured["command"][2]).name == "run_visible_server.py"

def test_visible_server_keeps_failure_and_saves_traceback(tmp_path, monkeypatch):
    loader = importlib.machinery.SourceFileLoader("visible_server_test", str(LAUNCHER.parent / "tools" / "run_visible_server.py"))
    module = importlib.util.module_from_spec(importlib.util.spec_from_loader(loader.name, loader))
    loader.exec_module(module)
    prompts = []

    def fail(*args, **kwargs):
        raise RuntimeError("测试启动失败")

    monkeypatch.setattr(module.runpy, "run_path", fail)
    monkeypatch.setattr("builtins.input", lambda prompt: prompts.append(prompt) or "")
    logfile = tmp_path / "server.log"
    assert module.run_server(logfile) == 1
    assert "测试启动失败" in logfile.read_text(encoding="utf-8")
    assert len(prompts) == 1
