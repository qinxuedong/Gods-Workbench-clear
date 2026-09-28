"""视频任务模型定义。"""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class ProductionContext(BaseModel):
    model_config = ConfigDict(extra="forbid")
    project_id: str = Field(..., min_length=1, max_length=128)
    canvas_id: str = Field(..., min_length=1, max_length=128)
    entity_id: str = Field(..., min_length=1, max_length=128)


class VideoGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    prompt: str = Field(..., min_length=1, max_length=20_000)
    provider_id: str = Field(..., min_length=1, max_length=128)
    model: str = Field(..., min_length=1, max_length=256)
    duration: float = Field(..., gt=0, le=120)
    aspect_ratio: Literal["16:9", "9:16", "1:1"]
    production_context: ProductionContext


class VideoExportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    asset_ids: list[str] = Field(..., min_length=1, max_length=8)
    project_id: str = Field(..., min_length=1, max_length=128)
    canvas_id: str = Field(..., min_length=1, max_length=128)
    entity_id: str = Field(..., min_length=1, max_length=128)
    preset: Literal["h264_720p_30fps", "h264_1080p_30fps"] = "h264_720p_30fps"


class ProjectAssetAuthorizationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    asset_id: str = Field(..., min_length=1, max_length=128)


class VideoProjectClaimRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    project_id: str = Field(..., min_length=1, max_length=128)
