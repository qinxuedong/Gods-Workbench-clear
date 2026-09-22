# -*- coding: utf-8 -*-
"""提示词库服务层实现（Phase 10C）。

严格遵循 docs/contracts/PROMPT-LIBRARY-INTERFACE-CATALOG.yaml（p10c-frozen-1）：

- 稳定 ID：library_id（plib_NNNN）/ category_id（pcat_NNNN），确定性且不含随机数；
- CAS：创建库校验顶层目录 version；创建分类校验父库 version；
  重命名/删除库校验目标库 version；重命名/删除分类校验目标分类 version；
- 重名（trim 后大小写不敏感）返回 409 DUPLICATE_LIBRARY_NAME / DUPLICATE_CATEGORY_NAME；
- 删除仍含分类的提示词库返回 409 LIBRARY_NOT_EMPTY，**禁止静默级联删除**；
- 空目录返回 libraries: [] 且 active_library_id: null；
- **零伪造**：本服务不产生任何提示词文本（positive/negative/scene 与条目均不存在），
  种子只注入结构（空库 / 空分类），绝不注入演示或随机内容。

证据边界：本服务为**进程内内存**存储（与 ProjectsService / AssetLibraryService 同口径）。
重启即丢失、多 worker 不共享；持久化 / 多实例一致性属部署方职责，本切片未闭环。
"""

from __future__ import annotations

import copy
from datetime import datetime, timezone
import threading
from typing import Dict, List, Optional, Tuple

from gods_workbench.core.errors import CleanroomException, VersionConflictException
from gods_workbench.prompt_library.models import (
    PromptCategoryCreateRequest,
    PromptCategoryItem,
    PromptCategoryRenameRequest,
    PromptLibraryCreateRequest,
    PromptLibraryItem,
    PromptLibraryRenameRequest,
    PromptLibrarySnapshot,
)


def _now_iso() -> str:
    """生成标准 ISO 8601 UTC 时间戳字符串。"""
    return datetime.now(timezone.utc).isoformat()


def _name_key(value: str) -> str:
    """重名比较键：trim 后大小写不敏感。"""
    return value.strip().casefold()


def _require_name(raw: str, label: str) -> str:
    """校验并规范化名称；全空白直接失败关闭，避免写入无意义结构。"""
    name = (raw or "").strip()
    if not name:
        raise CleanroomException(
            status_code=400,
            code="INVALID_REQUEST",
            message=f"{label}不能为空或全空白",
        )
    return name


def _require_positive_version(expected_version: Optional[int], label: str) -> None:
    """expected_version 若提供必须为正整数；否则 400。"""
    if expected_version is not None and (not isinstance(expected_version, int) or expected_version < 1):
        raise CleanroomException(
            status_code=400,
            code="INVALID_REQUEST",
            message=f"{label} expected_version 必须为正整数",
        )


def _assert_expected_version(expected_version: Optional[int], current_version: int, label: str) -> None:
    """CAS 校验：期望值与当前值不一致即 409，禁止静默覆盖。"""
    if expected_version is None:
        return
    if expected_version != current_version:
        raise VersionConflictException(
            expected_version=expected_version,
            current_version=current_version,
            message=f"{label}版本冲突，请重新读取后重试",
        )


class PromptLibraryService:
    """提示词库内存存储与 CAS 状态服务。"""

    def __init__(self, seed_structural_fixture: bool = False) -> None:
        self._lock = threading.Lock()
        self._directory_version = 1
        self._active_library_id: Optional[str] = None
        self._libraries: Dict[str, PromptLibraryItem] = {}
        self._library_seq = 0
        self._category_seq = 0

        if seed_structural_fixture:
            self._seed()

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------
    def get_snapshot(self) -> PromptLibrarySnapshot:
        """返回提示词库顶层目录快照（深拷贝，避免调用方改写内部状态）。"""
        with self._lock:
            return self._build_snapshot_locked()

    def _build_snapshot_locked(self) -> PromptLibrarySnapshot:
        libraries = [copy.deepcopy(self._libraries[key]) for key in sorted(self._libraries)]
        return PromptLibrarySnapshot(
            version=self._directory_version,
            active_library_id=self._active_library_id,
            libraries=libraries,
        )

    # ------------------------------------------------------------------
    # 提示词库：创建 / 重命名 / 删除
    # ------------------------------------------------------------------
    def create_library(
        self, payload: PromptLibraryCreateRequest
    ) -> Tuple[PromptLibraryItem, PromptLibrarySnapshot]:
        """创建提示词库；目录 CAS 冲突或重名失败关闭。"""
        with self._lock:
            _assert_expected_version(payload.expected_version, self._directory_version, "提示词库目录")
            name = _require_name(payload.name, "提示词库名称")
            self._assert_unique_library_name_locked(name)

            self._library_seq += 1
            library_id = f"plib_{self._library_seq:04d}"
            timestamp = _now_iso()
            item = PromptLibraryItem(
                library_id=library_id,
                name=name,
                version=1,
                created_at=timestamp,
                updated_at=timestamp,
                categories=[],
            )
            self._libraries[library_id] = item
            # 空目录创建首个库时自动激活；已有激活库时保持不变
            if self._active_library_id is None:
                self._active_library_id = library_id
            self._directory_version += 1
            return copy.deepcopy(item), self._build_snapshot_locked()

    def rename_library(
        self, library_id: str, payload: PromptLibraryRenameRequest
    ) -> Tuple[PromptLibraryItem, PromptLibrarySnapshot]:
        """重命名提示词库；目标不存在、重名或 CAS 冲突失败关闭。"""
        with self._lock:
            target = self._libraries.get(library_id)
            if target is None:
                raise self._library_not_found(library_id)
            _assert_expected_version(payload.expected_version, target.version, f"提示词库 {library_id}")

            name = _require_name(payload.name, "提示词库名称")
            self._assert_unique_library_name_locked(name, skip_library_id=library_id)

            target.name = name
            target.version += 1
            target.updated_at = _now_iso()
            self._directory_version += 1
            return copy.deepcopy(target), self._build_snapshot_locked()

    def delete_library(self, library_id: str, expected_version: Optional[int]) -> PromptLibrarySnapshot:
        """删除提示词库；非空库（仍有分类）返回 409 LIBRARY_NOT_EMPTY，禁止静默级联。"""
        with self._lock:
            _require_positive_version(expected_version, f"提示词库 {library_id}")
            target = self._libraries.get(library_id)
            if target is None:
                raise self._library_not_found(library_id)
            _assert_expected_version(expected_version, target.version, f"提示词库 {library_id}")

            if target.categories:
                raise CleanroomException(
                    status_code=409,
                    code="LIBRARY_NOT_EMPTY",
                    message=f"提示词库 {library_id} 仍包含 {len(target.categories)} 个分类，请先清空后再删除",
                )

            del self._libraries[library_id]
            self._directory_version += 1
            if self._active_library_id == library_id:
                self._active_library_id = next(iter(sorted(self._libraries)), None)
            return self._build_snapshot_locked()

    # ------------------------------------------------------------------
    # 提示词分类：创建 / 重命名 / 删除
    # ------------------------------------------------------------------
    def create_category(
        self, payload: PromptCategoryCreateRequest
    ) -> Tuple[PromptCategoryItem, PromptLibrarySnapshot]:
        """在指定提示词库下创建分类；父库不存在或父库 CAS 冲突失败关闭。"""
        with self._lock:
            parent = self._libraries.get(payload.library_id)
            if parent is None:
                raise self._library_not_found(payload.library_id)
            _assert_expected_version(payload.expected_version, parent.version, f"提示词库 {parent.library_id}")

            name = _require_name(payload.name, "分类名称")
            self._assert_unique_category_name_locked(parent, name)

            self._category_seq += 1
            category_id = f"pcat_{self._category_seq:04d}"
            timestamp = _now_iso()
            category = PromptCategoryItem(
                category_id=category_id,
                library_id=parent.library_id,
                name=name,
                version=1,
                created_at=timestamp,
                updated_at=timestamp,
            )
            parent.categories.append(category)
            parent.version += 1
            parent.updated_at = timestamp
            self._directory_version += 1
            return copy.deepcopy(category), self._build_snapshot_locked()

    def rename_category(
        self, category_id: str, payload: PromptCategoryRenameRequest
    ) -> Tuple[PromptCategoryItem, PromptLibrarySnapshot]:
        """重命名分类；目标不存在、同库重名或 CAS 冲突失败关闭。"""
        with self._lock:
            parent, target = self._locate_category_locked(category_id)
            _assert_expected_version(payload.expected_version, target.version, f"分类 {category_id}")

            name = _require_name(payload.name, "分类名称")
            self._assert_unique_category_name_locked(parent, name, skip_category_id=category_id)

            target.name = name
            target.version += 1
            target.updated_at = _now_iso()
            parent.version += 1
            parent.updated_at = target.updated_at
            self._directory_version += 1
            return copy.deepcopy(target), self._build_snapshot_locked()

    def delete_category(self, category_id: str, expected_version: Optional[int]) -> PromptLibrarySnapshot:
        """删除分类；目标分类 CAS 冲突失败关闭。"""
        with self._lock:
            _require_positive_version(expected_version, f"分类 {category_id}")
            parent, target = self._locate_category_locked(category_id)
            _assert_expected_version(expected_version, target.version, f"分类 {category_id}")

            parent.categories = [item for item in parent.categories if item.category_id != category_id]
            parent.version += 1
            parent.updated_at = _now_iso()
            self._directory_version += 1
            return self._build_snapshot_locked()

    # ------------------------------------------------------------------
    # 内部断言与定位
    # ------------------------------------------------------------------
    def _locate_category_locked(self, category_id: str) -> Tuple[PromptLibraryItem, PromptCategoryItem]:
        for library in self._libraries.values():
            for category in library.categories:
                if category.category_id == category_id:
                    return library, category
        raise CleanroomException(
            status_code=404,
            code="CATEGORY_NOT_FOUND",
            message=f"提示词分类 {category_id} 不存在",
        )

    def _library_not_found(self, library_id: str) -> CleanroomException:
        return CleanroomException(
            status_code=404,
            code="LIBRARY_NOT_FOUND",
            message=f"提示词库 {library_id} 不存在",
        )

    def _assert_unique_library_name_locked(self, name: str, skip_library_id: Optional[str] = None) -> None:
        key = _name_key(name)
        for library_id, item in self._libraries.items():
            if library_id == skip_library_id:
                continue
            if _name_key(item.name) == key:
                raise CleanroomException(
                    status_code=409,
                    code="DUPLICATE_LIBRARY_NAME",
                    message=f"提示词库名称已存在：{name}",
                )

    def _assert_unique_category_name_locked(
        self, parent: PromptLibraryItem, name: str, skip_category_id: Optional[str] = None
    ) -> None:
        key = _name_key(name)
        for item in parent.categories:
            if item.category_id == skip_category_id:
                continue
            if _name_key(item.name) == key:
                raise CleanroomException(
                    status_code=409,
                    code="DUPLICATE_CATEGORY_NAME",
                    message=f"分类名称已存在：{name}",
                )

    # ------------------------------------------------------------------
    # 黄金夹具种子（仅结构：空库 + 空分类，绝不注入提示词文本）
    # ------------------------------------------------------------------
    def _seed(self) -> None:
        """注入结构性基线（docs/fixtures/prompt-library-with-empty-category.json）。

        仅包含库与分类的**空结构**：不含 items，也不含任何 positive/negative/scene
        提示词文本；种子中的稳定 ID 为确定性常量，便于跨用例复现。
        """
        timestamp = "2026-09-22T07:00:00Z"
        category = PromptCategoryItem(
            category_id="pcat_default",
            library_id="plib_default",
            name="通用",
            version=1,
            created_at=timestamp,
            updated_at=timestamp,
        )
        library = PromptLibraryItem(
            library_id="plib_default",
            name="默认提示词库",
            version=2,
            created_at=timestamp,
            updated_at=timestamp,
            categories=[category],
        )
        self._libraries[library.library_id] = library
        self._active_library_id = library.library_id
        self._library_seq = 1
        self._category_seq = 1
        self._directory_version = 2


# 全局单例服务实例：默认空目录，绝不预置任何伪造提示词内容。
default_prompt_library_service = PromptLibraryService(seed_structural_fixture=False)
