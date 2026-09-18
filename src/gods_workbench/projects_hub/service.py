"""项目中心服务层实现。

严格遵循契约规范与 CAS 乐观锁版本控制，维护项目生命周期状态。
"""

import copy
from datetime import datetime, timezone
import threading
from typing import Dict, List, Optional

from gods_workbench.core.errors import CleanroomException, VersionConflictException
from gods_workbench.projects_hub.models import (
    ProjectCreateRequest,
    ProjectItem,
    ProjectMutationResult,
    ProjectType,
    ProjectUpdateRequest,
)


def _now_iso() -> str:
    """生成标准 ISO 8601 UTC 时间戳字符串。"""
    return datetime.now(timezone.utc).isoformat()


class ProjectsService:
    """项目中心内存存储与状态机服务。"""

    def __init__(self, seed_golden_fixture: bool = True):
        self._lock = threading.Lock()
        self._projects: Dict[str, ProjectItem] = {}
        self._seq = 1 if seed_golden_fixture else 0

        if seed_golden_fixture:
            # 注入黄金夹具中的基准项目
            self._projects["prj-0001"] = ProjectItem(
                project_id="prj-0001",
                name="示例项目 A",
                project_type=ProjectType.FILM,
                stage="production",
                progress=68.0,
                scenes=12,
                shots=48,
                description="洁净室契约验证基准项目",
                start_at=1780000000000,
                due_at=1781200000000,
                version=3,
                archived_at=None,
                deleted_at=None,
                updated_at=_now_iso(),
            )

    def list_projects(
        self,
        archived: Optional[bool] = False,
        deleted: Optional[bool] = None,
    ) -> List[ProjectItem]:
        """根据归档与回收站过滤条件返回项目列表。"""
        with self._lock:
            results = []
            for item in self._projects.values():
                is_deleted = item.deleted_at is not None
                is_archived = item.archived_at is not None

                # 回收站过滤：若 deleted=True 则仅查回收站；若 deleted=False 或未传，默认不包含回收站
                if deleted is True:
                    if not is_deleted:
                        continue
                else:
                    if is_deleted:
                        continue

                # 回收站项目独立按 deleted 查询，不再被活跃/归档筛选误过滤。
                if deleted is not True:
                    if archived is True and not is_archived:
                        continue
                    if archived is False and is_archived:
                        continue

                results.append(copy.deepcopy(item))

            # 保持排序稳定：按创建/ID 逆序
            return sorted(results, key=lambda x: x.project_id, reverse=True)

    def create_project(self, payload: ProjectCreateRequest) -> ProjectMutationResult:
        """创建项目并分配初始稳定 ID 与版本 1。"""
        with self._lock:
            self._seq += 1
            pid = f"prj-{self._seq:04d}"
            item = ProjectItem(
                project_id=pid,
                name=payload.name,
                project_type=payload.project_type,
                stage="planning",
                progress=0.0,
                scenes=0,
                shots=0,
                description=payload.description,
                start_at=payload.start_at,
                due_at=payload.due_at,
                version=1,
                archived_at=None,
                deleted_at=None,
                updated_at=_now_iso(),
            )
            self._projects[pid] = item
            return ProjectMutationResult(project_id=pid, version=item.version)

    def update_project(self, project_id: str, payload: ProjectUpdateRequest) -> ProjectMutationResult:
        """根据 CAS 乐观锁版本更新项目。"""
        with self._lock:
            item = self._projects.get(project_id)
            if not item:
                raise CleanroomException(status_code=404, code="PROJECT_NOT_FOUND", message=f"项目 {project_id} 不存在")

            # CAS 乐观锁校验
            if item.version != payload.expected_version:
                raise VersionConflictException(
                    expected_version=payload.expected_version,
                    current_version=item.version,
                )

            if item.archived_at is not None or item.deleted_at is not None:
                raise CleanroomException(
                    status_code=403,
                    code="FORBIDDEN",
                    message="归档或回收站项目为只读状态",
                )

            fields_set = payload.model_fields_set
            next_start = payload.start_at if "start_at" in fields_set else item.start_at
            next_due = payload.due_at if "due_at" in fields_set else item.due_at
            if next_start is not None and next_due is not None and next_due < next_start:
                raise CleanroomException(status_code=400, code="INVALID_SCHEDULE", message="due_at 不能早于 start_at")

            # 更新指定字段
            if payload.name is not None:
                item.name = payload.name
            if payload.stage is not None:
                item.stage = payload.stage
            if payload.progress is not None:
                item.progress = float(payload.progress)
            if payload.scenes is not None:
                item.scenes = payload.scenes
            if payload.shots is not None:
                item.shots = payload.shots
            if "description" in fields_set:
                item.description = payload.description
            if "start_at" in fields_set:
                item.start_at = payload.start_at
            if "due_at" in fields_set:
                item.due_at = payload.due_at

            item.version += 1
            item.updated_at = _now_iso()
            return ProjectMutationResult(project_id=project_id, version=item.version)

    def archive_project(self, project_id: str, expected_version: int) -> ProjectMutationResult:
        """归档项目（CAS 校验）。"""
        with self._lock:
            item = self._projects.get(project_id)
            if not item:
                raise CleanroomException(status_code=404, code="PROJECT_NOT_FOUND", message=f"项目 {project_id} 不存在")

            if item.version != expected_version:
                raise VersionConflictException(expected_version=expected_version, current_version=item.version)

            if item.deleted_at is not None or item.archived_at is not None:
                raise CleanroomException(status_code=409, code="LIFECYCLE_CONFLICT", message="项目当前不在活跃状态")

            item.archived_at = _now_iso()
            item.version += 1
            item.updated_at = _now_iso()
            return ProjectMutationResult(project_id=project_id, version=item.version, archived_at=item.archived_at)

    def unarchive_project(self, project_id: str, expected_version: int) -> ProjectMutationResult:
        """解归档项目（CAS 校验）。"""
        with self._lock:
            item = self._projects.get(project_id)
            if not item:
                raise CleanroomException(status_code=404, code="PROJECT_NOT_FOUND", message=f"项目 {project_id} 不存在")

            if item.version != expected_version:
                raise VersionConflictException(expected_version=expected_version, current_version=item.version)

            if item.deleted_at is not None or item.archived_at is None:
                raise CleanroomException(status_code=409, code="LIFECYCLE_CONFLICT", message="项目当前不是已归档状态")

            item.archived_at = None
            item.version += 1
            item.updated_at = _now_iso()
            return ProjectMutationResult(project_id=project_id, version=item.version, archived_at=None)

    def move_to_trash(self, project_id: str, expected_version: int) -> ProjectMutationResult:
        """移入回收站（CAS 校验）。"""
        with self._lock:
            item = self._projects.get(project_id)
            if not item:
                raise CleanroomException(status_code=404, code="PROJECT_NOT_FOUND", message=f"项目 {project_id} 不存在")

            if item.version != expected_version:
                raise VersionConflictException(expected_version=expected_version, current_version=item.version)

            if item.deleted_at is not None or item.archived_at is None:
                raise CleanroomException(status_code=409, code="LIFECYCLE_CONFLICT", message="只有已归档项目可以进入回收站")

            item.deleted_at = _now_iso()
            item.version += 1
            item.updated_at = _now_iso()
            return ProjectMutationResult(project_id=project_id, version=item.version, deleted_at=item.deleted_at)

    def restore_from_trash(self, project_id: str, expected_version: int) -> ProjectMutationResult:
        """从回收站恢复（CAS 校验）。"""
        with self._lock:
            item = self._projects.get(project_id)
            if not item:
                raise CleanroomException(status_code=404, code="PROJECT_NOT_FOUND", message=f"项目 {project_id} 不存在")

            if item.version != expected_version:
                raise VersionConflictException(expected_version=expected_version, current_version=item.version)

            if item.deleted_at is None:
                raise CleanroomException(status_code=409, code="LIFECYCLE_CONFLICT", message="项目不在回收站")

            item.deleted_at = None
            item.archived_at = None
            item.version += 1
            item.updated_at = _now_iso()
            return ProjectMutationResult(project_id=project_id, version=item.version, deleted_at=None)


# 全局单例服务实例
default_projects_service = ProjectsService(seed_golden_fixture=True)
