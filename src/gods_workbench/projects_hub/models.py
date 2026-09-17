"""项目中心契约模型。

严格对齐 docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml 及相关黄金夹具。
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProjectType(str, Enum):
    """项目类型枚举。"""

    FILM = "film"
    SERIES = "series"
    OTHER = "other"


class ProjectItem(BaseModel):
    """项目中心实体。"""

    model_config = ConfigDict(extra="ignore")

    project_id: str = Field(..., description="稳定项目标识")
    name: str = Field(..., description="项目名称")
    project_type: ProjectType = Field(..., description="项目类型")
    stage: str = Field(..., description="项目所处生产阶段")
    progress: float = Field(..., ge=0, le=100, description="生产进度 (0-100)")
    start_at: Optional[int] = Field(None, description="排期开始时间戳（毫秒）")
    due_at: Optional[int] = Field(None, description="排期截止时间戳（毫秒）")
    version: int = Field(..., description="并发控制版本号（CAS）")
    archived_at: Optional[str] = Field(None, description="归档时间戳或ISO字符串")
    deleted_at: Optional[str] = Field(None, description="逻辑删除/回收站时间戳或ISO字符串")


class ProjectListResponse(BaseModel):
    """项目列表返回结构。"""

    projects: List[ProjectItem] = Field(default_factory=list, description="项目列表")


class ProjectCreateRequest(BaseModel):
    """创建项目请求体。"""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, description="项目名称（必填）")
    project_type: ProjectType = Field(..., description="项目类型")
    description: Optional[str] = Field(None, description="项目描述")
    start_at: Optional[int] = Field(None, description="排期开始时间戳（毫秒）")
    due_at: Optional[int] = Field(None, description="排期截止时间戳（毫秒）")


class ProjectMutationResult(BaseModel):
    """项目变更返回的实体摘要。"""

    project_id: str
    version: int
    archived_at: Optional[str] = None
    deleted_at: Optional[str] = None


class ProjectMutationResponse(BaseModel):
    """项目创建/修改返回外层包装。"""

    project: ProjectMutationResult


class ProjectUpdateRequest(BaseModel):
    """编辑项目请求体（带 CAS expected_version）。"""

    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, description="项目名称")
    stage: Optional[str] = Field(None, description="生产阶段")
    scenes: Optional[int] = Field(None, ge=0, description="场次数")
    shots: Optional[int] = Field(None, ge=0, description="镜头数")
    progress: Optional[int] = Field(None, ge=0, le=100, description="生产进度百分比")
    description: Optional[str] = Field(None, description="项目描述")
    start_at: Optional[int] = Field(None, description="排期开始时间戳（毫秒）")
    due_at: Optional[int] = Field(None, description="排期截止时间戳（毫秒）")
    expected_version: int = Field(..., description="CAS 期望版本号")


class CasVersionRequest(BaseModel):
    """仅携带 expected_version 的状态流转请求体。"""

    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(..., description="CAS 期望版本号")
