"""FastAPI 洁净室应用工厂与核心中间件。"""

from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from gods_workbench.api.routes_god_canvas import jobs_router, router as god_canvas_router
from gods_workbench.api.routes_projects import router as projects_router
from gods_workbench.core.errors import CleanroomException

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def create_app() -> FastAPI:
    """构建并配置洁净应用实例。"""
    app = FastAPI(
        title="Gods-Workbench Cleanroom API",
        version="0.1.0",
        description="基于本轮修复输入与黄金夹具构建的洁净室服务骨架",
    )

    @app.exception_handler(CleanroomException)
    async def cleanroom_exception_handler(request: Request, exc: CleanroomException):
        """统一处理契约异常并返回标准错误包。"""
        envelope = exc.to_envelope()
        return JSONResponse(
            status_code=exc.status_code,
            content=envelope.model_dump(exclude_none=True),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """把 FastAPI 参数校验错误统一为契约要求的 400 错误包。"""
        return JSONResponse(
            status_code=400,
            content={
                "detail": {
                    "code": "INVALID_REQUEST",
                    "message": "请求参数不合法",
                    "errors": [
                        {
                            "loc": list(error.get("loc", ())),
                            "msg": error.get("msg", "请求参数不合法"),
                            "type": error.get("type", "invalid_request"),
                        }
                        for error in exc.errors()
                    ],
                }
            },
        )

    @app.get("/healthz", tags=["governance"])
    def health_check():
        """健康检查端点。"""
        return {
            "status": "ok",
            "mode": "cleanroom",
            "frozen_contracts": False,
            "release_authorized": False,
        }

    @app.get("/", include_in_schema=False)
    def index_redirect():
        """根路径重定向至 V2 项目中心。"""
        return RedirectResponse(url="/static/v2/projects.html", status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # 挂载 API 路由
    app.include_router(projects_router)
    app.include_router(god_canvas_router)
    app.include_router(jobs_router)

    # 挂载静态文件目录
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

    return app


app = create_app()
