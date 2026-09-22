"""FastAPI 洁净室应用工厂与核心中间件。"""

from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from gods_workbench.api.routes_asset_library import router as asset_library_router
from gods_workbench.api.routes_auth import router as auth_router
from gods_workbench.api.routes_god_canvas import jobs_router, router as god_canvas_router
from gods_workbench.api.routes_observability import router as observability_router
from gods_workbench.api.routes_projects import router as projects_router
from gods_workbench.api.routes_prompt_library import router as prompt_library_router
from gods_workbench.api.routes_settings import router as settings_router
from gods_workbench.core import session as session_store
from gods_workbench.core.config import AUTH_MODE_OIDC, load_runtime_auth_config
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
        """健康检查端点；如实暴露认证模式与发布授权状态，便于部署核验。"""
        auth_runtime = load_runtime_auth_config()
        return {
            "status": "ok",
            "mode": "cleanroom",
            "auth_mode": auth_runtime.mode,
            "oidc_ready": bool(auth_runtime.ready),
            "frozen_contracts": False,
            "release_authorized": False,
        }

    @app.get("/", include_in_schema=False)
    def index_redirect():
        """根路径重定向至 V2 项目中心。"""
        return RedirectResponse(url="/static/v2/projects.html", status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    @app.middleware("http")
    async def session_principal_middleware(request: Request, call_next):
        """把 ``gw_session`` Cookie 解析出的服务端身份写入请求上下文。

        只在 OIDC 模式下解析；未知/过期会话等价于未认证（不拒绝请求本身，
        由各路由的权限检查决定 401/403）。上下文变量在响应后必须重置，
        避免跨请求泄漏。
        """
        token = None
        if request.url.path.startswith("/api/") and load_runtime_auth_config().mode == AUTH_MODE_OIDC:
            session_id = request.cookies.get(session_store.SESSION_COOKIE_NAME)
            principal = session_store.get_session(session_id)
            token = session_store.set_current_principal(principal)
        try:
            return await call_next(request)
        finally:
            if token is not None:
                session_store.reset_current_principal(token)

    # 挂载 API 路由
    app.include_router(auth_router)
    app.include_router(projects_router)
    app.include_router(god_canvas_router)
    app.include_router(asset_library_router)
    app.include_router(jobs_router)
    app.include_router(observability_router)
    app.include_router(prompt_library_router)
    app.include_router(settings_router)

    # 挂载静态文件目录
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

    return app


app = create_app()
