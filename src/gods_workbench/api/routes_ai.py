"""Phase 11 B2 平台、AI 与 CLI 路由。

路由覆盖前端冻结调用面。Phase 12 A4 起：上传真实落盘、CLI 配置门禁下真实执行、
对话在配置了真实 base_url + 凭据时向真实 Provider 发起调用；
无配置/无依赖时仍 fail-closed，绝不伪造结果。
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Header, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from gods_workbench.core import cli_runtime
from gods_workbench.core.errors import CleanroomException
from gods_workbench.core.auth import require_authenticated, require_edit_access, require_governance_access
from gods_workbench.core.platform import (
    app_info,
    cli_status,
)
from gods_workbench.settings import chat as chat_runtime

@asynccontextmanager
async def _platform_ai_lifespan(app):
    """应用关闭时回收单进程控制器明确持有的 Dreamina 子进程。"""
    try:
        yield
    finally:
        cli_runtime.login_controller.shutdown()


router = APIRouter(tags=["platform-ai"], lifespan=_platform_ai_lifespan)


class ChatRequest(BaseModel):
    """兼容工作台与剧集流水线的最小对话请求。"""

    model_config = ConfigDict(extra="allow")

    message: str = Field(..., min_length=1, max_length=200_000)
    mode: Optional[str] = Field(None, max_length=64)
    model: Optional[str] = Field(None, max_length=256)
    provider_id: Optional[str] = Field(None, max_length=128)
    provider: Optional[str] = Field(None, max_length=128)


class CliHelpRequest(BaseModel):
    """CLI 帮助请求；命令文本只接受为数据，路由绝不执行。"""

    model_config = ConfigDict(extra="ignore")

    command: str = Field("", max_length=2_000)


@router.post(
    "/api/ai/upload",
    summary="上传 AI 附件（真实落盘）",
    status_code=status.HTTP_200_OK,
)
async def upload_ai_files(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """真实接收 multipart 文件并落盘到 GW_DATA_DIR，返回真实 file_id 与下载 URL。"""
    require_edit_access(authorization, x_user_role)
    content_type = (request.headers.get("content-type") or "").lower()
    if "multipart/form-data" not in content_type:
        raise CleanroomException(400, "INVALID_REQUEST", "上传必须使用 multipart/form-data")
    form = await request.form()
    payloads: List[tuple] = []
    for key in ("files", "file"):
        for item in form.getlist(key):
            if hasattr(item, "read"):
                payloads.append((getattr(item, "filename", "") or "file", await item.read()))
        if payloads:
            break
    return cli_runtime.save_uploads(payloads)


@router.get(
    "/api/app-info",
    summary="读取洁净室应用信息",
    status_code=status.HTTP_200_OK,
)
def get_app_info(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """返回源码和运行时可证明的信息，不宣称发布授权或外部服务就绪。"""
    require_authenticated(authorization, x_user_role)
    return app_info()


@router.get(
    "/api/chat/config",
    summary="读取服务端 Chat Provider 配置状态（不触发生成）",
    status_code=status.HTTP_200_OK,
)
def chat_configuration(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """只读服务端运行配置摘要；不探测网络，不触发可能计费的模型请求。"""
    require_authenticated(authorization, x_user_role)
    return chat_runtime.public_configuration()


def _complete_chat(payload: ChatRequest, *, agent: bool):
    """把 Chat 专属的空吞吐原因放进标准 detail，不透传异常或上游 raw。"""
    try:
        return chat_runtime.complete(payload.model_dump(), agent=agent)
    except CleanroomException as exc:
        return chat_runtime.error_response(exc)


@router.post(
    "/api/chat",
    summary="对话请求（配置驱动真实调用；无配置失败关闭）",
    status_code=status.HTTP_200_OK,
)
def chat(
    payload: ChatRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """只按服务端运行配置路由；一次用户动作最多产生一次真实请求。"""
    require_edit_access(authorization, x_user_role)
    return _complete_chat(payload, agent=False)


@router.post(
    "/api/chat/agent",
    summary="智能体对话请求（配置驱动真实调用；无配置失败关闭）",
    status_code=status.HTTP_200_OK,
)
def chat_agent(
    payload: ChatRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """只按服务端运行配置路由；一次用户动作最多产生一次真实请求。"""
    require_edit_access(authorization, x_user_role)
    return _complete_chat(payload, agent=True)


@router.get(
    "/api/codex/status",
    summary="读取 GPT CLI 本机路径观察状态",
    status_code=status.HTTP_200_OK,
)
def codex_status(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """只观察 PATH，不执行 codex 命令。"""
    require_authenticated(authorization, x_user_role)
    return cli_status("codex")


@router.post(
    "/api/codex/help",
    summary="读取 GPT CLI 帮助（配置驱动真实执行）",
    status_code=status.HTTP_200_OK,
)
def codex_help(
    payload: CliHelpRequest = Body(default_factory=CliHelpRequest),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """仅当 GW_CLI_EXECUTION=1 且命令存在时执行固定 `--help`；不执行调用方命令文本。"""
    require_edit_access(authorization, x_user_role)
    return cli_runtime.cli_help("codex", "/api/codex/help")


@router.get(
    "/api/gemini-cli/status",
    summary="读取 Antigravity CLI 本机路径观察状态",
    status_code=status.HTTP_200_OK,
)
def gemini_cli_status(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """只观察 PATH，不执行 gemini/antigravity 命令。"""
    require_authenticated(authorization, x_user_role)
    return cli_status("gemini-cli")


@router.post(
    "/api/gemini-cli/help",
    summary="读取 Antigravity CLI 帮助（配置驱动真实执行）",
    status_code=status.HTTP_200_OK,
)
def gemini_cli_help(
    payload: CliHelpRequest = Body(default_factory=CliHelpRequest),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """仅当 GW_CLI_EXECUTION=1 且命令存在时执行固定 `--help`；不执行调用方命令文本。"""
    require_edit_access(authorization, x_user_role)
    return cli_runtime.cli_help("gemini-cli", "/api/gemini-cli/help")


@router.get(
    "/api/jimeng/credit",
    summary="读取 Dreamina CLI 余额（治理权限、固定 user_credit）",
    status_code=status.HTTP_200_OK,
)
def jimeng_credit(
    response: Response,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """仅治理角色可查询服务器本机共享账户；余额查询只由显式按钮触发。"""
    context = require_governance_access(authorization, x_user_role)
    _set_private_cli_headers(response)
    return cli_runtime.jimeng_credit(context)


@router.post(
    "/api/jimeng/help",
    summary="读取即梦 CLI 帮助（配置驱动真实执行）",
    status_code=status.HTTP_200_OK,
)
def jimeng_help(
    payload: CliHelpRequest = Body(default_factory=CliHelpRequest),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """仅当 GW_CLI_EXECUTION=1 且命令存在时执行固定 `--help`；不执行调用方命令文本。"""
    require_edit_access(authorization, x_user_role)
    return cli_runtime.cli_help("jimeng", "/api/jimeng/help")


@router.post(
    "/api/jimeng/login/start",
    summary="启动 Dreamina CLI Device Flow 登录（治理权限）",
    status_code=status.HTTP_200_OK,
)
def jimeng_login_start(
    response: Response,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """200仅表示接管/观察单实例登录进程，不代表账户已登录。"""
    context = require_governance_access(authorization, x_user_role)
    _set_private_cli_headers(response)
    return cli_runtime.jimeng_login_start(context)


@router.get(
    "/api/jimeng/login/status",
    summary="读取 Dreamina CLI 最近一次登录操作观察",
    status_code=status.HTTP_200_OK,
)
def jimeng_login_status(
    response: Response,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """只返回本进程最后一次操作观测；重启/失败均不伪称未登录。"""
    context = require_governance_access(authorization, x_user_role)
    _set_private_cli_headers(response)
    return cli_runtime.jimeng_login_status(context)


@router.post(
    "/api/jimeng/logout",
    summary="退出 Dreamina CLI 登录（治理权限）",
    status_code=status.HTTP_200_OK,
)
def jimeng_logout(
    response: Response,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """只运行固定 logout；若登录仍运行则409拒绝，不隐式取消。"""
    context = require_governance_access(authorization, x_user_role)
    _set_private_cli_headers(response)
    return cli_runtime.jimeng_logout(context)


@router.get(
    "/api/jimeng/status",
    summary="读取 Dreamina CLI 最近一次操作观察（兼容路径）",
    status_code=status.HTTP_200_OK,
)
def jimeng_status(
    response: Response,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """兼容状态路径与登录状态共用单一控制器与主体隔离。"""
    context = require_governance_access(authorization, x_user_role)
    _set_private_cli_headers(response)
    return cli_runtime.jimeng_login_status(context, "/api/jimeng/status")


def _set_private_cli_headers(response: Response) -> None:
    """避免浏览器、中间缓存和共享代理保存账户操作响应。"""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
