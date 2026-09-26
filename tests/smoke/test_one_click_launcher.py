"""Windows 一键启动入口的无副作用回归。"""

import importlib.machinery
import importlib.util
from pathlib import Path


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
