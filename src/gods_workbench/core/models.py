"""核心通用数据模型与基类。"""

from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class CleanroomBaseModel(BaseModel):
    """洁净室通用模型配置。"""

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        extra="forbid",
    )


class CasVersionMixin(BaseModel):
    """CAS 乐观锁版本字段混入。"""

    expected_version: int
