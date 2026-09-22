你是 Gods-Workbench-clear 仓库的实现代理（Phase 10E：画布闭环阶段，T26 收尾阶段）。仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear

先读根 AGENTS.md 与 docs/governance/PHASE-10{A,B,C,D}-*.md，对齐洁净室铁律与既有工程范式。

# 背景
T26 顺序：素材库 -> 观测 -> 提示词库 -> 设置页 -> **画布闭环**（最后一个阶段）。
本阶段范围（依 docs/governance/TASK-NOTES-2026-09-18.md 第 1430 行的功能域表 + 前端调用面实测）：
`/api/canvas-assets`、`/api/asset-registry/canvases*`、`/api/reference-canvases`、`/api/shared-folders`、`/api/video-tasks`。

# 范围（严格，仅以下 12 条归一化路径）
- GET    /api/canvas-assets
- POST   /api/canvas-assets/download
- GET    /api/reference-canvases
- POST   /api/reference-canvases
- GET    /api/shared-folders
- POST   /api/shared-folders
- POST   /api/shared-folders/import
- DELETE /api/shared-folders/{folder_id}
- GET    /api/shared-folders/{folder_id}/tree
- GET    /api/video-tasks
- POST   /api/video-tasks
- GET    /api/video-tasks/{video_task_id}
- PATCH  /api/canvases/{canvas_id}/meta
- POST   /api/canvases/{canvas_id}/touch
- POST   /api/canvases/{canvas_id}/purge
- GET    /api/canvases/trash
- POST   /api/canvases/assets

（若某条经实测确认前端并未调用或属其它域，可提出并**先与我确认**再调整；不得擅自扩大范围。）

**禁止**实现本清单之外的任何端点（尤其 `/api/asset-registry/assets*`、`/api/local-assets*`、
`/api/storage-files*`、`/api/asset-reviews*`、`/api/asset-thumbnails*`、`/api/jimeng*`、
`/api/asset-auth/{users,teams,tokens,operation-approvals}*`、`/api/asset-content*` 等仍属未授权范围）。
未授权端点必须保持 404/405，并写反向断言守卫。

# 硬约束（违反即失败）
1. **稳定 ID**：`canvas_id` / `folder_id` / `video_task_id` / `asset_id`；严禁 `pid`/`cid`/`id` 等别名。
   `/api/canvases*` 的既有实现使用 `canvas_id`，必须保持一致，不得另起别名。
2. **零伪造**：无真实数据源一律返回空 + 明确的未接入/未知标记；
   禁止 random/uuid 生成业务内容、禁止写死假成功、禁止伪造视频任务进度或耗时数字。
   - 视频任务若本阶段无真实渲染后端，创建应 fail-closed 或明确 `not_integrated`，**不得**返回假进度。
   - 共享文件夹/引用画布无真实持久层时，返回真实的空集合与 `data_gaps`，不得塞演示条目。
3. **CAS 乐观锁**：所有写操作（POST/PATCH/DELETE）必须校验 `expected_version`，冲突返回 409
   且必须在契约中写死错误码；禁止静默覆盖。`/api/canvases/{canvas_id}/touch` 若语义为「仅刷新时间戳」
   需在契约中说明其版本递增规则，不得借 touch 绕过 CAS。
4. **认证与权限**：读端点需认证（401）；写端点需写权限（403 只读降级）。复用 core/auth.py 的
   `require_authenticated` / `require_edit_access`。
5. **错误包**：外层必须为 `{"detail": {"code": ..., "message": ..., ...}}`，与 core/errors.py 一致。
6. **中文**注释/文档/提交信息；LF 行尾、UTF-8 无 BOM；用 `python -P`。

# 交付物（全部必须）
1. `docs/contracts/CANVAS-CLOSURE-INTERFACE-CATALOG.yaml`，`version: p10e-frozen-1`，
   用 `decisions` 段逐条写死：ID 口径 / 未接入如实降级 / CAS 粒度与错误码 / 认证与权限码表 /
   视频任务未接入语义 / 禁止实现的相邻端点。
   契约解析器用正则 `method:\s*(\w+)\s*\n\s*path:\s*(\S+)`，端点必须写成
   `- name: ...` 后紧跟 `method:` 再换行 `path:`。
2. `src/gods_workbench/canvas_closure/`（`__init__.py`、`models.py`、`service.py`）。
3. `src/gods_workbench/api/routes_canvas_closure.py`，并注册进 `src/gods_workbench/api/app.py`。
4. 黄金夹具（至少 5 件）：空画布素材列表、空共享文件夹列表、CAS 冲突 409、
   视频任务未接入错误响应、空视频任务列表。写入 `docs/fixtures/` 并登记 `GOLDEN-FIXTURE-MANIFEST.json`。
5. `tests/contracts/test_phase10e_canvas_closure.py`：覆盖各端点 200/201/202、401、403、404、409、
   空集合不伪造、视频任务 fail-closed、以及未授权端点仍 404/405 的反向断言。
6. 更新 `tests/contracts/test_phase8_frontend_backend_api_gap.py`：上述路径从 `KNOWN_UNIMPLEMENTED`
   迁入 `KNOWN_IMPLEMENTED`，新契约加入 `CONTRACTS`、同步 `KNOWN_BACKEND_PATHS`。
7. 更新 `tests/contracts/test_golden_fixtures.py` 的清单条数断言与新增夹具用例。
8. 更新 `docs/provenance/PHASE-2-INPUT-SHA256.txt`（**条目数必须仍为 16**）。
9. 新增 `docs/governance/PHASE-10E-CANVAS-CLOSURE-2026-09-22.md`。

# 门禁与验证
- `python -P -m pytest -q` 全绿；`python -P -m pytest tests/hygiene -q` 全绿；tracked `node --check` 全通过。
- **变异测试**：至少 3 个变异（去 CAS / 伪造视频任务进度 / 空集合改为伪造演示条目），
  证明守卫捕获后还原。
- 严禁 `git add -A`；**本轮禁止 commit / push**（由协调代理统一提交）。
- 完成后回报：文件清单、门禁数字、变异结果、明确未实现清单。
运行：orca orchestration send --subject "Phase10E画布闭环交付" --outcome succeeded --body "<回报>" --from $env:ORCA_TERMINAL_HANDLE
