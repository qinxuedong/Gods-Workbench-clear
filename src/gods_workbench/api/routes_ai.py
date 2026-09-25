"""Phase 11 B2 平台、AI 与 CLI 路由。

路由覆盖前端冻结调用面，但对未完成真实准入的外部能力失败关闭：
不会执行未审核命令、不会向外部 Provider 发送消息、不会伪造上传/余额/登录结果。
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Header, Request, status
from pydantic import BaseModel, ConfigDict, Field

from gods_workbench.core.auth import require_authenticated, require_edit_access
from gods_workbench.core.platform import (
    app_info,
    cli_status,
    reject_chat,
    reject_cli_help,
    reject_jimeng_credit,
    reject_jimeng_login,
    reject_upload,
)

router = APIRouter(tags=["platform-ai"])


class ChatRequest(BaseModel):
    """兼容工作台与剧集流水线的最小对话请求。"""

    model_config = ConfigDict(extra="allow")

    message: str = Field(..., min_length=1, max_length=200_000)
    mode: Optional[str] = Field(None, max_length=64)
    model: Optional[str] = Field(None, max_length=256)
    provider: Optional[str] = Field(None, max_length=128)


class CliHelpRequest(BaseModel):
    """CLI 帮助请求；命令文本只接受为数据，路由绝不执行。"""

    model_config = ConfigDict(extra="ignore")

    command: str = Field("", max_length=2_000)


@router.post(
    "/api/ai/upload",
    summary="上传 AI 附件（未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def upload_ai_files(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """认证后拒绝未准入上传；不解析 multipart，避免读取或保存用户文件。"""
    require_edit_access(authorization, x_user_role)
    reject_upload()


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


@router.post(
    "/api/chat",
    summary="对话请求（Provider 未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def chat(
    payload: ChatRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """认证并完成请求形状校验后，拒绝向未准入 Provider 发送消息。"""
    require_edit_access(authorization, x_user_role)
    reject_chat("/api/chat")


@router.post(
    "/api/chat/agent",
    summary="智能体对话请求（Provider 未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def chat_agent(
    payload: ChatRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """认证并完成请求形状校验后，拒绝未准入智能体执行。"""
    require_edit_access(authorization, x_user_role)
    reject_chat("/api/chat/agent")


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
    summary="读取 GPT CLI 帮助（未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def codex_help(
    payload: CliHelpRequest = Body(default_factory=CliHelpRequest),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """不执行客户端提交的 command 文本。"""
    require_edit_access(authorization, x_user_role)
    reject_cli_help("/api/codex/help")


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
    summary="读取 Antigravity CLI 帮助（未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def gemini_cli_help(
    payload: CliHelpRequest = Body(default_factory=CliHelpRequest),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """不执行客户端提交的 command 文本。"""
    require_edit_access(authorization, x_user_role)
    reject_cli_help("/api/gemini-cli/help")


@router.get(
    "/api/jimeng/credit",
    summary="读取即梦 CLI 余额（未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def jimeng_credit(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """不伪造余额，也不启动本机 CLI。"""
    require_authenticated(authorization, x_user_role)
    reject_jimeng_credit()


@router.post(
    "/api/jimeng/help",
    summary="读取即梦 CLI 帮助（未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def jimeng_help(
    payload: CliHelpRequest = Body(default_factory=CliHelpRequest),
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """不执行客户端提交的 command 文本。"""
    require_edit_access(authorization, x_user_role)
    reject_cli_help("/api/jimeng/help")


@router.post(
    "/api/jimeng/login/start",
    summary="启动即梦 CLI 登录（未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def jimeng_login_start(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """不创建伪造二维码或登录会话。"""
    require_edit_access(authorization, x_user_role)
    reject_jimeng_login("/api/jimeng/login/start")


@router.get(
    "/api/jimeng/login/status",
    summary="读取即梦登录状态",
    status_code=status.HTTP_200_OK,
)
def jimeng_login_status(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """返回可验证的未登录状态，不伪造运行中的扫码流程。"""
    require_authenticated(authorization, x_user_role)
    data = cli_status("jimeng")
    return {
        **data,
        "logged_in": False,
        "running": False,
        "text": "即梦 CLI 登录尚未接入，未启动扫码流程。",
        "qr_url": "",
        "raw": None,
    }


@router.post(
    "/api/jimeng/logout",
    summary="退出即梦 CLI 登录（未准入时失败关闭）",
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
)
def jimeng_logout(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
):
    """不删除或伪造任何外部 CLI 会话。"""
    require_edit_access(authorization, x_user_role)
    reject_jimeng_login("/api/jimeng/logout")


@router.get(
    "/api/jimeng/status",
    summary="读取即梦 CLI 状态",
    status_code=status.HTTP_200_OK,
)
def jimeng_status(
    authorization: Optional[str] = Header(None),
    x_user_role: str = Header("editor", alias="X-User-Role"),
) -> Dict[str, Any]:
    """只观察 PATH，登录状态始终按未接入口径返回 false。"""
    require_authenticated(authorization, x_user_role)
    data = cli_status("jimeng")
    return {**data, "logged_in": False, "raw": None}
