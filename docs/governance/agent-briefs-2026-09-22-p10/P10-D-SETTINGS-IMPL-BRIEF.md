你是 Gods-Workbench-clear 仓库的实现代理（Phase 10D：设置页阶段）。仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear

先读根 AGENTS.md、docs/governance/PHASE-10A-ASSET-LIBRARY-2026-09-22.md、docs/governance/PHASE-10B-OBSERVABILITY-2026-09-22.md、docs/governance/PHASE-10C-PROMPT-LIBRARY-2026-09-22.md，对齐洁净室铁律与既有工程范式（契约冻结方式、零伪造口径、CAS、错误包、稳定 ID）。

# 背景
T26 顺序：素材库 -> 观测 -> 提示词库 -> **设置页** -> 画布闭环。前三阶段已交付并已提交。
设置页阶段范围（依 docs/governance/TASK-NOTES-2026-09-18.md 第 1424-1430 行的功能域表）：
`/api/storage-settings`、`/api/providers`、`/api/asset-registry/asset-structures*`。

# 范围（严格，共 8 条归一化路径 / 13 个方法）
- GET    /api/storage-settings
- PATCH  /api/storage-settings
- GET    /api/providers
- PUT    /api/providers
- POST   /api/providers/fetch-models
- POST   /api/providers/probe-async
- POST   /api/providers/test-connection
- GET    /api/asset-registry/asset-structures
- POST   /api/asset-registry/asset-structures
- GET    /api/asset-registry/asset-structures/{structure_id}
- PATCH  /api/asset-registry/asset-structures/{structure_id}
- DELETE /api/asset-registry/asset-structures/{structure_id}
- PATCH  /api/asset-registry/asset-structures/{structure_id}/current

**禁止**实现本清单之外的任何端点（尤其 `/api/asset-registry/assets*`、`/api/local-assets*`、`/api/storage-files*`、
`/api/asset-registry/reindex`、`/api/asset-registry/project-directory*` 等仍属未授权范围）。
未授权端点必须保持 404/405，并写反向断言守卫。

# 硬约束（违反即失败）
1. **稳定 ID**：结构体用 `structure_id`；provider 用 `provider_id`；禁止 `pid`/`cid`/`sid` 等别名。
2. **零伪造**：任何无真实数据源的内容一律返回空 + 明确的未接入/未配置标记，禁止编造演示数据、
   禁止用 random/uuid 生成业务内容，禁止写死「假成功」。
   - `GET /api/providers` 默认必须返回 `providers: []`（**不得**预置任何厂商条目）。
   - `GET /api/storage-settings` 必须如实标记「未配置」（例如 `configured: false` + `data_gaps`），
     不得返回伪造的根目录/容量/路径。
   - `POST /api/providers/{fetch-models,probe-async,test-connection}`：本阶段**无真实外网探测能力**，
     必须 fail-closed（返回明确的未接入错误包，例如 503 + `PROVIDER_PROBE_NOT_INTEGRATED`），
     **绝不允许**返回伪造的模型列表、伪造的连通性成功、伪造的延迟数字。
     若实现者认为可用依赖注入做真实出网探测，必须默认关闭并如实降级。
3. **CAS 乐观锁**：所有写操作（PATCH/PUT/DELETE）必须校验 `expected_version`，
   冲突返回 409 + `VERSION_CONFLICT`（结构体可用 `STRUCTURE_VERSION_CONFLICT`，但必须在契约中写死）。
   PUT /api/providers 与 PATCH /api/storage-settings 同样需要版本语义。
4. **认证与权限**：读端点需认证（401）；写端点需写权限（403 只读降级）。复用 core/auth.py 的
   `require_authenticated` / `require_edit_access`，**不要**自造权限体系。
5. **错误包**：外层必须是 `{"detail": {"code": ..., "message": ..., ...}}`，与 core/errors.py 一致。
   401 码沿用 core/errors.py 的既有权威值（**不要**改成别的写法）。
6. **中文**注释/文档/提交信息；LF 行尾、UTF-8 无 BOM；用 `python -P`。

# 交付物（全部必须）
1. `docs/contracts/SETTINGS-INTERFACE-CATALOG.yaml`，`version: p10d-frozen-1`，
   用 `decisions` 段逐条写死：ID 口径 / 未接入如实降级 / CAS 粒度与错误码 / 认证与权限码表 /
   providers 空列表口径 / 探测端点 fail-closed 语义 / 禁止实现的相邻端点。
   注意：契约解析器用正则 `method:\s*(\w+)\s*\n\s*path:\s*(\S+)`，
   每个端点必须写成 `- name: ...` 后紧跟 `method:` 再换行 `path:` 的形态。
2. `src/gods_workbench/settings/`（`__init__.py`、`models.py`、`service.py`）。
3. `src/gods_workbench/api/routes_settings.py`，并注册进 `src/gods_workbench/api/app.py`。
4. 黄金夹具（至少 4 件）：默认 providers 空列表、storage-settings 未配置响应、CAS 冲突 409、
   探测端点未接入错误响应。写入 `docs/fixtures/` 并登记 `GOLDEN-FIXTURE-MANIFEST.json`。
5. `tests/contracts/test_phase10d_settings.py`：覆盖各端点 200/201、401、403、404、409、
   空列表不伪造、未配置如实标记、探测端点 fail-closed、以及未授权端点仍 404/405 的反向断言。
6. 更新 `tests/contracts/test_phase8_frontend_backend_api_gap.py`：8 条归一化路径从
   `KNOWN_UNIMPLEMENTED` 迁入 `KNOWN_IMPLEMENTED`，并把新契约加入 `CONTRACTS`、同步 `KNOWN_BACKEND_PATHS`。
7. 更新 `tests/contracts/test_golden_fixtures.py` 的清单条数断言与新增夹具用例。
8. 更新 `docs/provenance/PHASE-2-INPUT-SHA256.txt`（**条目数必须仍为 16**，只更新变化的哈希）。
9. 新增 `docs/governance/PHASE-10D-SETTINGS-2026-09-22.md`，声明已完成项、门禁数字、变异结果、
   明确未实现清单与证据边界（本地 != CI != 生产验收）。

# 门禁与验证
- `python -P -m pytest -q` 全绿；`python -P -m pytest tests/hygiene -q` 全绿；tracked `node --check` 全通过。
- **变异测试**：至少 3 个变异（去 CAS / providers 预置伪造条目 / 探测端点伪造成功），
  证明守卫捕获后还原。
- 严禁 `git add -A`；**本轮禁止 commit / push**（由协调代理统一提交）。
- 完成后回报：文件清单、门禁数字、变异结果、明确未实现清单。
运行：orca orchestration send --subject "Phase10D设置页交付" --outcome succeeded --body "<回报>" --from $env:ORCA_TERMINAL_HANDLE
