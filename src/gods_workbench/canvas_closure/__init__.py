# -*- coding: utf-8 -*-
"""画布闭环领域包（Phase 10E）。

对外只暴露最小契约面：稳定 ID 口径、CAS 乐观锁、零伪造与 fail-closed。
"""

from gods_workbench.canvas_closure.models import (  # noqa: F401
    CANVAS_ASSET_ATTACH_NOT_INTEGRATED,
    CANVAS_ASSET_DOWNLOAD_NOT_INTEGRATED,
    SHARED_FOLDER_IMPORT_NOT_INTEGRATED,
    SHARED_FOLDER_NOT_FOUND,
    VIDEO_RENDERER_NOT_INTEGRATED,
    VIDEO_TASK_NOT_FOUND,
)
from gods_workbench.canvas_closure.service import (  # noqa: F401
    CanvasClosureService,
    SharedFolderService,
    default_canvas_closure_service,
    default_shared_folder_service,
)

__all__ = [
    "CanvasClosureService",
    "SharedFolderService",
    "default_canvas_closure_service",
    "default_shared_folder_service",
]
