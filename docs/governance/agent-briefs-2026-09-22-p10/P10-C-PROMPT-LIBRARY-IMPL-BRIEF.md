你是 Gods-Workbench-clear 仓库的实现代理（Phase 10C：提示词库阶段）。仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear
先读根 AGENTS.md、docs/governance/PHASE-10A-ASSET-LIBRARY-2026-09-22.md 与 docs/governance/PHASE-10B-OBSERVABILITY-2026-09-22.md 以对齐洁净室铁律与既有工程范式（尤其 10A 的契约冻结方式与 10B 的零伪造口径）。

# 背景
T26 顺序：素材库 → 观测 → **提示词库** → 设置页 → 画布闭环。前两阶段已交付。本阶段做提示词库。

# 范围（严格）
只实现以下 7 个端点：
- GET    /api/prompt-libraries                读取提示词库树
- POST   /api/prompt-libraries                创建提示词库
- PATCH  /api/prompt-libraries/{library_id}   重命名提示词库
- DELETE /api/prompt-libraries/{library_id}   删除提示词库
- POST   /api/prompt-libraries/categories     创建分类
- PATCH  /api/prompt-libraries/categories/{category_id}  重命名分类
- DELETE /api/prompt-libraries/categories/{category_id}  删除分类

**禁止**实现 `/api/prompt-libraries/items*`（本阶段不实现条目 CRUD），
也**禁止**实现任何其它未授权端点（含 asset-library 的 items/libraries 明细等）。

# 硬性约束（违反即失败）
1. **稳定 ID**：`library_id` / `category_id`；种子数据也必须是稳定 ID。
   前端兼容：`js/asset-manager.js` 以 `x.library_id || x.id` 读取，种子可为系统库，但**不得**引入 `pid`/`cid` 别名。
2. **零伪造**：空库返回 `libraries: []`，不得返回演示提示词内容；不得使用 random/uuid 生成假内容。
   种子只允许**结构**（空库/空分类），不含任何伪造提示词文本。
3. **CAS**：创建/重命名/删除均须带 `expected_version` 语义（沿用 10A：创建库校验顶层目录版本、
   分类操作校验父库版本、重命名/删除校验目标对象版本），冲突返回 409 `VERSION_CONFLICT`。
4. **错误语义**：401（未认证，纯 ASCII 小写时也须与 core/errors.py 一致）、403（只读）、404（不存在）、
   409（VERSION_CONFLICT / DUPLICATE_LIBRARY_NAME / DUPLICATE_CATEGORY_NAME / LIBRARY_NOT_EMPTY）。
   删除非空库返回 409 `LIBRARY_NOT_EMPTY`（不得静默级联删除）。
5. **认证**：读需认证，写需 `require_edit_access`。中文注释/文档/提交信息。

# 交付物（全部必须）
1. `docs/contracts/PROMPT-LIBRARY-INTERFACE-CATALOG.yaml`：冻结契约（含 decisions 段，逐条写死 ID 口径/
   删除语义/CAS 粒度/重名/空库/CAS 递增规则/错误码表），并显式写明「不得伪造提示词内容」。
2. `src/gods_workbench/prompt_library/`（`__init__.py`、`models.py`、`service.py`）。
3. `src/gods_workbench/api/routes_prompt_library.py`，并注册进 `src/gods_workbench/api/app.py`。
4. 黄金夹具（至少：空库响应、创建请求、CAS 冲突 409、非空库删除 409），写入 `docs/fixtures/` 并登记 `GOLDEN-FIXTURE-MANIFEST.json`。
5. `tests/contracts/test_phase10c_prompt_library.py`：覆盖 7 端点 200/201、401、403、404、409（含 CAS 与重名与 LIBRARY_NOT_EMPTY）、
   空库不伪造、以及「未授权的 /api/prompt-libraries/items* 仍 404」的反向断言。
6. 更新 `tests/contracts/test_phase8_frontend_backend_api_gap.py`：7 条从 `KNOWN_UNIMPLEMENTED` 迁入 `KNOWN_IMPLEMENTED`，同步 `KNOWN_BACKEND_PATHS` 与 `CONTRACTS`。
7. 更新 `tests/contracts/test_golden_fixtures.py` 的清单条数断言与新增夹具用例。
8. 更新 `docs/provenance/PHASE-2-INPUT-SHA256.txt`（条目数仍须为 16）。

# 工程细节
- LF 行尾、UTF-8 无 BOM；用 `python -P`。
- 门禁：`python -P -m pytest -q` 全绿、`python -P -m pytest tests/hygiene -q` 全绿、tracked `node --check` 全通过。
- **变异测试**：至少 3 个变异（去重名守卫 / 去 CAS / 删非空库改为静默级联），证明守卫捕获并还原。
- 严禁 `git add -A`；**本轮禁止 commit / push**（由协调代理统一提交）。
- 完成后回报：文件清单、门禁数字、变异结果、明确未实现清单。
运行：orca orchestration send --subject "Phase10C提示词库交付" --outcome succeeded --body "<回报>" --from $env:ORCA_TERMINAL_HANDLE
