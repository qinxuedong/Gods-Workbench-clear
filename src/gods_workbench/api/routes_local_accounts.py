"""本地账户首次设置与密码登录；与 OIDC 授权码接口相互隔离。"""

from ipaddress import ip_address
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, SecretStr, Field

from gods_workbench.core import local_accounts, session
from gods_workbench.core.config import AUTH_MODE_LOCAL_ACCOUNT, load_runtime_auth_config
from gods_workbench.core.errors import CleanroomException

router = APIRouter(prefix="/api/asset-auth/local", tags=["本地账户"])


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str = Field(min_length=3, max_length=64)
    password: SecretStr


def require_local_mode():
    if load_runtime_auth_config().mode != AUTH_MODE_LOCAL_ACCOUNT:
        raise CleanroomException(403, "LOCAL_ACCOUNT_DISABLED", "当前未启用本地账户登录")


def _loopback(host: str) -> bool:
    if host == "localhost":
        return True
    try:
        return ip_address(host).is_loopback
    except ValueError:
        return False


def _session_response(request: Request, principal: dict, token: str, code: int):
    # 登录成功后撤销浏览器原会话，不能利用固定旧 Cookie 获得新身份。
    local_accounts.delete_session(request.cookies.get(session.SESSION_COOKIE_NAME))
    response = JSONResponse({"authenticated": True, "principal": principal}, status_code=code)
    response.headers["Cache-Control"] = "no-store"
    response.set_cookie(session.SESSION_COOKIE_NAME, token, max_age=local_accounts.SESSION_SECONDS,
                        httponly=True, samesite="strict", secure=request.url.scheme == "https", path="/")
    return response


@router.post("/setup", status_code=201)
def setup(payload: Credentials, request: Request):
    require_local_mode()
    # 首次管理员只能由本机设置，且拒绝 DNS 重绑定到非回环主机名。
    if not request.client or not _loopback(request.client.host) or not _loopback(request.url.hostname or ""):
        raise CleanroomException(403, "LOCAL_SETUP_ONLY", "首次管理员只能在本机 localhost 或 127.0.0.1 页面创建")
    principal, token = local_accounts.create_first_admin(payload.username, payload.password.get_secret_value())
    return _session_response(request, principal, token, 201)


@router.post("/login")
def login(payload: Credentials, request: Request):
    require_local_mode()
    principal, token = local_accounts.login(payload.username, payload.password.get_secret_value(),
                                            request.client.host if request.client else "unknown")
    return _session_response(request, principal, token, 200)
