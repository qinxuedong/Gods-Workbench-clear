# -*- coding: utf-8 -*-
"""Phase 11 B6 资产审查与交付的洁净室服务边界。

当前仓库没有冻结且获准接入的审查会话、评论、审批、交付导出或分享存储。
因此 B6 只暴露统一失败关闭边界：认证之后返回 503，不创建会话/评论/审批/交付/分享，
不读取本机文件、不联网、不执行外部进程，也不生成伪造的资源标识、导出 URL、任务标识或轮询提示。
"""

from __future__ import annotations

from typing import Any

from gods_workbench.core.errors import CleanroomException

DATA_STATUS_NOT_INTEGRATED = "not_integrated"
ERROR_CODE = "ASSET_REVIEW_NOT_INTEGRATED"


def unavailable(
    endpoint: str,
    capability: str = "资产审查与交付能力",
    code: str = ERROR_CODE,
) -> None:
    """以契约化 503 结束尚未接入的审查与交付能力。"""
    raise CleanroomException(
        status_code=503,
        code=code,
        message=f"{capability}尚未接入已批准的数据后端",
        extra={
            "endpoint": endpoint,
            "unavailable": True,
            "data_status": DATA_STATUS_NOT_INTEGRATED,
        },
        expose_extra_fields={"endpoint", "unavailable", "data_status"},
    )


def unavailable_detail(
    endpoint: str,
    capability: str = "资产审查与交付能力",
    code: str = ERROR_CODE,
) -> dict[str, Any]:
    """返回供非 HTTP 调用方记录的结构化不可用说明，不生成业务数据。"""
    return {
        "endpoint": endpoint,
        "capability": capability,
        "code": code,
        "unavailable": True,
        "data_status": DATA_STATUS_NOT_INTEGRATED,
        "data_gaps": ["asset_review_backend_not_connected"],
    }
