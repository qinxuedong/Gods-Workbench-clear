"""Gods-Workbench 洁净室服务快速启动入口。

默认端口：2077。
自动将 src 目录注入 sys.path，支持开发模式自动重载。
"""

import os
import sys
from pathlib import Path
import uvicorn

# 自动将 src 加入 Python 模块搜索路径
ROOT_DIR = Path(__file__).resolve().parent
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


def main():
    host = os.getenv("GW_HOST", "127.0.0.1")
    port = int(os.getenv("GW_PORT", "2077"))
    reload = os.getenv("GW_RELOAD", "true").lower() in ("true", "1", "yes")

    print("=" * 60)
    print("  Gods' Workbench Cleanroom (Phase 5)")
    print(f"  服务地址: http://{host}:{port}")
    print(f"  项目中心: http://{host}:{port}/static/v2/projects.html")
    print("=" * 60)

    uvicorn.run(
        "gods_workbench.api.app:app",
        host=host,
        port=port,
        reload=reload,
        app_dir=str(SRC_DIR),
    )


if __name__ == "__main__":
    main()
