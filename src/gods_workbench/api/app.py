"""FastAPI 洁净室应用工厂与核心中间件。"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from gods_workbench.api.routes_canvas import router as canvas_router
from gods_workbench.api.routes_projects import router as projects_router
from gods_workbench.core.errors import CleanroomException


def create_app() -> FastAPI:
    """构建并配置洁净应用实例。"""
    app = FastAPI(
        title="Gods-Workbench Cleanroom API",
        version="0.1.0",
        description="基于已冻结契约与黄金夹具构建的洁净室服务骨架",
    )

    @app.exception_handler(CleanroomException)
    async def cleanroom_exception_handler(request: Request, exc: CleanroomException):
        """统一处理契约异常并返回标准错误包。"""
        envelope = exc.to_envelope()
        return JSONResponse(
            status_code=exc.status_code,
            content=envelope.model_dump(exclude_none=True),
        )

    @app.get("/healthz", tags=["governance"])
    def health_check():
        """健康检查端点。"""
        return {"status": "ok", "mode": "cleanroom", "frozen_contracts": True}

    app.include_router(projects_router)
    app.include_router(canvas_router)

    return app


app = create_app()
