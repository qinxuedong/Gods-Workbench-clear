"""可见后台入口：同步显示与保存服务输出，退出时保留窗口供用户查看。"""

from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
import runpy
import sys
import traceback

ROOT = Path(__file__).resolve().parents[1]


class ConsoleLog:
    """保留真实控制台属性，避免影响 Uvicorn 的日志格式器。"""

    def __init__(self, console, logfile):
        self.console = console
        self.logfile = logfile

    def write(self, text):
        self.logfile.write(text)
        self.logfile.flush()
        if self.console is not None:
            return self.console.write(text)
        return len(text)

    def flush(self):
        self.logfile.flush()
        if self.console is not None:
            self.console.flush()

    def isatty(self):
        return self.console is not None and self.console.isatty()

    def __getattr__(self, name):
        return getattr(self.console, name)


def run_server(log_path: Path) -> int:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    code = 0
    with log_path.open("a", encoding="utf-8") as logfile:
        with redirect_stdout(ConsoleLog(sys.stdout, logfile)), redirect_stderr(ConsoleLog(sys.stderr, logfile)):
            print("Gods-Workbench 后台服务：关闭本窗口会停止服务。", flush=True)
            print(f"日志位置：{log_path}", flush=True)
            try:
                runpy.run_path(str(ROOT / "run.py"), run_name="__main__")
            except KeyboardInterrupt:
                print("收到停止请求。")
            except SystemExit as exc:
                code = exc.code if isinstance(exc.code, int) else (1 if exc.code else 0)
                if code:
                    traceback.print_exc()
            except Exception:
                code = 1
                traceback.print_exc()
            print(f"后台服务已停止（退出码 {code}）。", flush=True)
            try:
                input("按 Enter 关闭窗口；错误详情见上方及日志文件。")
            except (EOFError, OSError, KeyboardInterrupt):
                pass
    return code


if __name__ == "__main__":
    sys.exit(run_server(Path(sys.argv[1])))
