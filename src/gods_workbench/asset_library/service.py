# -*- coding: utf-8 -*-
"""素材库服务层实现（Phase 10A）。

严格遵循 docs/contracts/ASSET-LIBRARY-INTERFACE-CATALOG.yaml（p10a-frozen-1）：

- 稳定 ID：library_id / category_id / asset_id；
- 库级 CAS：创建分类校验父库 `expected_version`，创建素材库校验顶层目录版本；
- 重名（trim 后大小写不敏感）返回 409 DUPLICATE_LIBRARY_NAME / DUPLICATE_CATEGORY_NAME；
- 空库返回 libraries: [] 且 active_library_id: null，绝不返回演示或伪造素材；
- 成功后：新对象 version=1，父库 version += 1，顶层目录 version += 1。

证据边界：本服务为**进程内内存**存储（与 ProjectsService 同口径）。重启即丢失、
多 worker 不共享；持久化 / 多实例一致性属部署方职责，本切片未闭环。
"""

from __future__ import annotations

import copy
from datetime import datetime, timezone
import threading
from typing import Dict, List, Optional, Tuple

from gods_workbench.asset_library.models import (
    AssetLibraryCreateRequest,
    AssetLibrarySnapshot,
    CategoryCreateRequest,
    CategoryItem,
    LibraryItem,
)
from gods_workbench.core.errors import CleanroomException, VersionConflictException


def _now_iso() -> str:
    """生成标准 ISO 8601 UTC 时间戳字符串。"""
    return datetime.now(timezone.utc).isoformat()


def _name_key(value: str) -> str:
    """重名比较键：trim 后大小写不敏感。"""
    return value.strip().casefold()


class AssetLibraryService:
    """素材库内存存储与 CAS 状态服务。"""

    def __init__(self, seed_golden_fixture: bool = False) -> None:
        self._lock = threading.Lock()
        # 顶层目录版本与素材库集合
        self._directory_version = 1
        self._active_library_id: Optional[str] = None
        self._libraries: Dict[str, LibraryItem] = {}
        self._library_seq = 0
        self._category_seq = 0

        if seed_golden_fixture:
            self._seed()

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------
    def get_snapshot(self) -> AssetLibrarySnapshot:
        """返回素材库顶层目录快照（深拷贝，避免调用方改写内部状态）。"""
        with self._lock:
            return self._build_snapshot_locked()

    def _build_snapshot_locked(self) -> AssetLibrarySnapshot:
        libraries = [copy.deepcopy(self._libraries[key]) for key in sorted(self._libraries)]
        return AssetLibrarySnapshot(
            version=self._directory_version,
            active_library_id=self._active_library_id,
            libraries=libraries,
        )

    # ------------------------------------------------------------------
    # 变更
    # ------------------------------------------------------------------
    def create_library(self, payload: AssetLibraryCreateRequest) -> Tuple[LibraryItem, AssetLibrarySnapshot]:
        """创建素材库；重名或 CAS 冲突失败关闭。"""
        with self._lock:
            if payload.expected_version is not None and payload.expected_version != self._directory_version:
                raise VersionConflictException(
                    expected_version=payload.expected_version,
                    current_version=self._directory_version,
                    message="素材库目录版本冲突，请重新读取后重试",
                )

            name = payload.name.strip()
            if not name:
                raise CleanroomException(
                    status_code=400,
                    code="INVALID_REQUEST",
                    message="素材库名称不能为空或全空白",
                )
            self._assert_unique_library_name_locked(name)

            self._library_seq += 1
            library_id = f"library_{self._library_seq:04d}"
            timestamp = _now_iso()
            item = LibraryItem(
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

    def create_category(self, payload: CategoryCreateRequest) -> Tuple[CategoryItem, LibraryItem]:
        """在指定素材库下创建分类；父库不存在或版本冲突失败关闭。"""
        with self._lock:
            parent = self._libraries.get(payload.library_id)
            if parent is None:
                raise CleanroomException(
                    status_code=404,
                    code="LIBRARY_NOT_FOUND",
                    message=f"素材库 {payload.library_id} 不存在",
                )

            if payload.expected_version is not None and payload.expected_version != parent.version:
                raise VersionConflictException(
                    expected_version=payload.expected_version,
                    current_version=parent.version,
                    message="素材库版本冲突，请重新读取后重试",
                )

            name = payload.name.strip()
            if not name:
                raise CleanroomException(
                    status_code=400,
                    code="INVALID_REQUEST",
                    message="分类名称不能为空或全空白",
                )
            self._assert_unique_category_name_locked(parent, name)

            self._category_seq += 1
            category_id = f"category_{self._category_seq:04d}"
            timestamp = _now_iso()
            category = CategoryItem(
                category_id=category_id,
                library_id=parent.library_id,
                name=name,
                type=payload.type,
                version=1,
                created_at=timestamp,
                updated_at=timestamp,
                items=[],
            )
            parent.categories.append(category)
            parent.version += 1
            parent.updated_at = timestamp
            self._directory_version += 1
            return copy.deepcopy(category), copy.deepcopy(parent)

    # ------------------------------------------------------------------
    # 内部断言
    # ------------------------------------------------------------------
    def _assert_unique_library_name_locked(self, name: str) -> None:
        key = _name_key(name)
        for item in self._libraries.values():
            if _name_key(item.name) == key:
                raise CleanroomException(
                    status_code=409,
                    code="DUPLICATE_LIBRARY_NAME",
                    message=f"素材库名称已存在：{name}",
                )

    def _assert_unique_category_name_locked(self, parent: LibraryItem, name: str) -> None:
        key = _name_key(name)
        for item in parent.categories:
            if _name_key(item.name) == key:
                raise CleanroomException(
                    status_code=409,
                    code="DUPLICATE_CATEGORY_NAME",
                    message=f"分类名称已存在：{name}",
                )

    # ------------------------------------------------------------------
    # 黄金夹具种子
    # ------------------------------------------------------------------
    def _seed(self) -> None:
        """注入黄金夹具基准素材库（docs/fixtures/asset-library-with-library-category.json）。"""
        timestamp = "2026-09-22T06:00:00Z"
        category = CategoryItem(
            category_id="category_image",
            library_id="library_default",
            name="图片",
            type="image",
            version=1,
            created_at=timestamp,
            updated_at=timestamp,
            items=[],
        )
        library = LibraryItem(
            library_id="library_default",
            name="默认资产库",
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


# 全局单例服务实例
default_asset_library_service = AssetLibraryService(seed_golden_fixture=False)
