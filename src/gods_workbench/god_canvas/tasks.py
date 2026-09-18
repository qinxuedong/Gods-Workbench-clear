"""智能画布任务编排与状态模型。

对齐 run_smart_canvas_task 接口契约与 202 Accepted 黄金夹具。
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SmartCanvasRunMode(str, Enum):
    """智能画布任务执行模式。"""

    SINGLE = "single"
    CASCADE = "cascade"


class SmartCanvasTaskRequest(BaseModel):
    """发起智能画布任务请求体。"""

    model_config = ConfigDict(extra="forbid")

    expected_version: Optional[int] = Field(None, description="当前期望 CAS 版本")
    entry_nodes: List[str] = Field(..., min_length=1, description="入口节点 entity_id 集合")
    run_mode: SmartCanvasRunMode = Field(default=SmartCanvasRunMode.SINGLE, description="执行模式")
    inputs: Dict[str, Any] = Field(default_factory=dict, description="执行输入载荷")


class TaskStatus(str, Enum):
    """任务状态。"""

    ACCEPTED = "accepted"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SmartCanvasTaskResponse(BaseModel):
    """智能画布任务返回结构（支持 200 Completed 与 202 Accepted 契约）。"""

    model_config = ConfigDict(extra="allow")

    job_id: str = Field(..., description="异步任务稳定标识")
    state: str = Field(..., description="任务状态")
    poll_hint: Optional[str] = Field(None, description="任务轮询或状态查询路径")
    result: Optional[Dict[str, Any]] = Field(None, description="任务完成结果")
    error: Optional[str] = Field(None, description="任务失败原因")
