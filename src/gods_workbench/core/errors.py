"""核心错误模型与异常体系。

严格对齐 docs/contracts 及 docs/fixtures 中的 401、403、409 契约规范与黄金夹具。
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """通用错误详情载荷。"""

    code: str = Field(..., description="错误标识码")
    message: str = Field(..., description="错误可读提示")
    expected_version: Optional[int] = Field(None, description="期望的 CAS 版本")
    current_version: Optional[int] = Field(None, description="当前实际的 CAS 版本")
    canvas_id: Optional[str] = Field(None, description="冲突的画布标识")


class ErrorEnvelope(BaseModel):
    """统一外层错误包装体。"""

    detail: ErrorDetail


class CleanroomException(Exception):
    """洁净室顶层应用异常。"""

    def __init__(self, status_code: int, code: str, message: str, extra: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.extra = extra or {}

    def to_envelope(self) -> ErrorEnvelope:
        payload = {
            "code": self.code,
            "message": self.message,
            **self.extra,
        }
        return ErrorEnvelope(detail=ErrorDetail(**payload))


class UnauthorizedException(CleanroomException):
    """401 未认证异常。"""

    def __init__(self, message: str = "会话失效，请重新登录"):
        super().__init__(status_code=401, code="UNAUTHORIZED", message=message)


class ForbiddenException(CleanroomException):
    """403 权限不足异常。"""

    def __init__(self, message: str = "无当前项目写权限"):
        super().__init__(status_code=403, code="FORBIDDEN", message=message)


class VersionConflictException(CleanroomException):
    """409 项目版本冲突异常。"""

    def __init__(self, expected_version: int, current_version: int, message: str = "expected_version 与当前版本不一致"):
        super().__init__(
            status_code=409,
            code="VERSION_CONFLICT",
            message=message,
            extra={"expected_version": expected_version, "current_version": current_version},
        )


class CanvasVersionConflictException(CleanroomException):
    """409 画布版本冲突异常。"""

    def __init__(
        self,
        expected_version: int,
        current_version: int,
        canvas_id: str,
        message: str = "画布版本冲突，请刷新后重试",
    ):
        super().__init__(
            status_code=409,
            code="CANVAS_VERSION_CONFLICT",
            message=message,
            extra={
                "expected_version": expected_version,
                "current_version": current_version,
                "canvas_id": canvas_id,
            },
        )
