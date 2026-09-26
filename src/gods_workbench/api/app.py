"""FastAPI 洁净室应用工厂与核心中间件。"""

from pathlib import Path
from urllib.parse import urlencode
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from gods_workbench.api.routes_ai import router as ai_router
from gods_workbench.api.routes_asset_library import router as asset_library_router
from gods_workbench.api.routes_asset_library_b4 import router as asset_library_b4_router
from gods_workbench.api.routes_local_assets import router as local_assets_router
from gods_workbench.api.routes_media import router as media_router
from gods_workbench.api.routes_asset_review_b6 import router as asset_review_b6_router
from gods_workbench.api.routes_episode_pipeline_b7 import router as episode_pipeline_b7_router
from gods_workbench.api.routes_prompt_library_b8 import router as prompt_library_b8_router
from gods_workbench.api.routes_public_b9 import router as public_b9_router
from gods_workbench.api.routes_auth import router as auth_router
from gods_workbench.api.routes_auth_management import router as auth_management_router
from gods_workbench.api.routes_canvas_closure import router as canvas_closure_router
from gods_workbench.api.routes_god_canvas import jobs_router, router as god_canvas_router
from gods_workbench.api.routes_observability import router as observability_router
from gods_workbench.api.routes_projects import legacy_router as projects_compat_router
from gods_workbench.api.routes_projects import router as projects_router
from gods_workbench.api.routes_asset_registry import router as asset_registry_router
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
    app.include_router(ai_router)
    app.include_router(auth_management_router)
    app.include_router(projects_router)
    app.include_router(projects_compat_router)
    # 必须先于 god_canvas_router 注册：/api/canvases/trash 不能被 /{canvas_id} 抢先匹配。
    app.include_router(canvas_closure_router)
    app.include_router(god_canvas_router)
    app.include_router(asset_library_router)
    app.include_router(asset_library_b4_router)
    app.include_router(local_assets_router)
    app.include_router(media_router)
    app.include_router(asset_review_b6_router)
    app.include_router(episode_pipeline_b7_router)
    app.include_router(prompt_library_b8_router)
    app.include_router(public_b9_router)
    app.include_router(asset_registry_router)
    app.include_router(jobs_router)
    app.include_router(observability_router)
    app.include_router(prompt_library_router)
    app.include_router(settings_router)

    # 统一 V2 用户入口：根级业务页只保留给 V2 内部 iframe 使用。
    # `embedded=1` 是内部实现边界，不能重定向，否则会导致 iframe 循环。
    legacy_v2_targets = {
        "asset-manager": ("/static/v2/assets.html", ("project_id", "pipeline_id", "asset_id")),
        "api-settings": ("/static/v2/settings.html", ("section", "project_id")),
        "canvas-list": ("/static/v2/storyboard.html", ("project_id", "entity_id", "canvas_id", "view", "filter", "layout")),
        "episode-pipeline": ("/static/v2/workshop.html", ("project_id", "pipeline_id", "step", "agent")),
        "task-center": ("/static/v2/collab.html", ("view", "project_id")),
        "governance": ("/static/v2/projects.html", ("openTrash", "project_id")),
    }

    @app.get("/static/{legacy_name}.html", include_in_schema=False)
    async def legacy_page_v2_entry(request: Request, legacy_name: str):
        """把用户直接打开的根级业务页收口到 V2；内嵌切片仍由静态目录提供。"""
        source = STATIC_DIR / f"{legacy_name}.html"
        if not source.is_file() or legacy_name not in legacy_v2_targets:
            # 交给静态挂载处理未知文件和公共分享深链，避免改变其匿名访问边界。
            return FileResponse(source) if source.is_file() else JSONResponse({"detail": "Not Found"}, status_code=404)
        if request.query_params.get("embedded") == "1":
            return FileResponse(source)
        target, keys = legacy_v2_targets[legacy_name]
        params = []
        for key in keys:
            value = request.query_params.get(key)
            if value is not None and value != "":
                params.append((key, value))
        query = urlencode(params)
        return RedirectResponse(f"{target}?{query}" if query else target, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # 挂载静态文件目录
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

    return app


app = create_app()
