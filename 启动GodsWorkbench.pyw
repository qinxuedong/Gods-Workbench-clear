# -*- coding: utf-8 -*-
"""Windows 双击启动入口；仅依赖已有的 Python 3.11 环境。"""

import argparse
import ctypes
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from urllib.request import urlopen
import webbrowser

ROOT = Path(__file__).resolve().parent
PORT = 2077
HOME = f"http://127.0.0.1:{PORT}/"
HEALTH = f"http://127.0.0.1:{PORT}/healthz"


def show_error(message: str) -> None:
    """无控制台的 pythonw 出错时仍向用户给出可见提示。"""
    ctypes.windll.user32.MessageBoxW(None, message, "Gods-Workbench 启动失败", 0x10)


def is_ready() -> bool:
    try:
        with urlopen(HEALTH, timeout=2) as response:
            data = json.load(response)
        return data.get("status") == "ok" and data.get("mode") == "cleanroom"
    except (OSError, ValueError, TypeError, AttributeError):
        return False


def open_home() -> None:
    if not webbrowser.open(HOME):
        raise RuntimeError(f"浏览器未能打开首页，请手动访问 {HOME}")


def start(wait_seconds: int, no_browser: bool) -> None:
    if not (ROOT / "run.py").is_file():
        raise RuntimeError("找不到 run.py，请从完整仓库目录运行启动程序。")
    if is_ready():
        if not no_browser:
            open_home()
        return

    logs = ROOT / "logs"
    logs.mkdir(exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = logs / f"gods-workbench-{stamp}.out.log"
    stderr_log = logs / f"gods-workbench-{stamp}.err.log"
    env = os.environ.copy()
    env.update(GW_HOST="127.0.0.1", GW_PORT=str(PORT), GW_RELOAD="false")

    # pythonw 无控制台；服务输出重定向到日志，避免窗口闪烁与错误不可见。
    with stdout_log.open("wb") as stdout, stderr_log.open("wb") as stderr:
        process = subprocess.Popen(
            [sys.executable, str(ROOT / "run.py")],
            cwd=ROOT,
            env=env,
            stdin=subprocess.DEVNULL,
            stdout=stdout,
            stderr=stderr,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )

    deadline = time.monotonic() + wait_seconds
    while time.monotonic() < deadline:
        if is_ready():
            if not no_browser:
                open_home()
            return
        if process.poll() is not None:
            raise RuntimeError(f"服务退出（代码 {process.returncode}）。请查看 {stderr_log}")
        time.sleep(0.5)
    raise RuntimeError(f"服务 {wait_seconds} 秒内未就绪。请查看 {stderr_log}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="启动 Gods-Workbench 并打开首页")
    parser.add_argument("--no-browser", action="store_true", help="只启动服务，不打开浏览器")
    parser.add_argument("--wait-seconds", type=int, default=30)
    args = parser.parse_args()
    try:
        start(args.wait_seconds, args.no_browser)
    except Exception as exc:
        show_error(str(exc))
        sys.exit(1)
