# 文件治理报告（2026-09-18）

## 口径时点声明（重要）

> 本报告 §1 / §4 / §6 的全部计数均取自**本报告生成时点**的 `git status --porcelain -uall` 快照（当时 **213 个真实文件**）。
> 该快照之后，本批次又新增了 `BINARY-AND-NAMING-BASELINE-2026-09-18.md`、`FINAL-ACCEPTANCE-AUDIT-2026-09-18.md` 等治理记录，因此**当前实际变更文件数会大于 213**（截至最终验收审核时点实测为 214）。
> **后续任何审计一律以现场重跑 `git status --porcelain -uall` 的结果为准**；本报告数字用于证明「当时逐项判定自洽」，不代表永久常量。

---

## 修订记录（依据独立审核 2026-09-18）

本节为报告发布后依据《文件治理报告独立审核（2026-09-18）》完成的**定点修正**，未推翻审核未指出的结论。修正后 §1、§4、§6 的数字口径完全自洽，且与 `git status` 实测一致（全部数字均为本轮重新跑命令得出）。

1. **§4 第 2 组计数标签错误（P1-1）**：原写「字体名替换型差异 33 项」，但该组内实际列举清单只有 21 项。经逐文件重算，工作区中与用户源**仅差字体族**（Inter/JetBrains Mono/Outfit → Source Han Sans CN）的文件恰为 **21 项**，与列举清单一一对应。据此 §4「需裁决」由 70 项修正为 **57 项**，§1、§2.4、§6 同步重算（见第 6、7 条）。
2. **§3 第 1–6 项删除依据（P1-2）**：原以「用户当前工作区已删除该文件（源不存在）」为删除依据，不成立。已核实这 6 个文件在 `D:\Working\Code Pro\Gods-Workbench-release\static\images\` 中**仍然存在且内容一致**；用户旧仓（`D:\Working\Code Pro\Gods-Workbench`）只是**未提交的工作区删除（` D`）**。事实描述已改准确，处置建议由「清理」改为「**待用户裁决（不得作为本轮清理依据）**」。
3. **§3 关于 `volcengine-theme-*.svg` 的「逐字节一致」（P1-3）**：原表述过强。经实测，与用户旧仓 HEAD blob **并非逐字节一致**，仅在换行归一（CRLF→LF）后等价：本仓 `volcengine-theme-dark.svg` 5,085 字节（CRLF）、`volcengine-theme-light.svg` 5,088 字节（CRLF）；旧仓 HEAD blob 分别为 5,035 / 5,038 字节（LF）。已改为准确表述。
4. **§4 第 10 组结论错误（重要）**：原称「V1 删除登记的 3 条哈希在参考仓任何副本中均无匹配对象，且这 11 个路径在本仓 git 历史中从未存在」。该结论**不成立**。独立复算显示，`docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`「经典版（V1）页面删除登记」的 **11 条路径 SHA-256 全部可复现**：8 项命中 `%TEMP%\gw-classic-removal-20260918-120000\`，8 项命中 `D:\Working\Code Pro\Gods-Workbench-release`，5 项命中 `D:\Working\Code Pro\Gods-Workbench`。该项已从「需裁决」改为「**建议改进（非阻塞）**」：11 条登记哈希可复现，但登记未注明来源副本位置，建议补注以便后续审计一键复现（见 §4.1）。
5. **§4 补充段 `/api` 计数口径（P1-4、P2-3）**：已明确「203 条」的去重/归一规则，并同时给出**原始令牌去重数**与**归一后数**；文件数口径亦一并列明（见 §4 补充段）。
6. **§6 口径混算（P2-4）**：原 §6「无效更改 10 / 合计 212」把 2 条非文件条目（`.mimosa/` 目录、`tmp_dep.py`）与真实文件混算。现 §6 统一以 `git status --porcelain -uall` 的 **213 条真实文件**为口径，并在表下注明非文件形态条目共 **2 条**、不参与本节统计。
7. **重算附带发现的计数据修正**：§1 文档数由 34 改为 **37**（含本报告、独立审核报告与 `BINARY-AND-NAMING-BASELINE-2026-09-18.md` 共 3 份治理记录）、`??` 由 170 改为 **173**、合计由 212 改为 **213 个真实文件 / 38,635,809 字节**；§1 附注中 `static/vendor/` 的 3 个 `.otf` 由 25,030 KB 改为 **26,030.1 KiB**、`three-0.160.0.module.js` 由 1,215 KB 改为 **1,243.1 KiB**、`lucide.js` 由 383 KB 改为 **392.5 KiB**。

---

## 0. 报告范围与方法

- **治理对象**：`HEAD = abd0e88` 之后、本仓工作区中全部未提交变更。
- **基线**：`git rev-parse HEAD` = `abd0e8899650117738cd830d9f027d8e9b93162f`（分支 `master`）。
- **比对源（只读，未做任何修改）**：
  - `D:\Working\Code Pro\Gods-Workbench`（同一 remote，`HEAD = 2a95a2fc`，含用户自有前端与 `main.py`）
  - `D:\Working\Code Pro\Gods-Workbench-release`（同 remote、同 `HEAD = 2a95a2fc`，前序迁移登记声明的来源根）
- **手段**：`git status/diff/ls-files`、逐文件 SHA-256 与规范化换行后的逐字节比对、`difflib` 差异分类、静态引用可达性扫描、后端路由与前端 `/api` 引用交叉比对、`pytest` 实测。
- **判定口径**：
  - `准确迁移`：与用户源一致（或仅差已登记的『经典版』净化），或有明确登记依据，应予保留。
  - `合理修复`：不属于迁移，但修复了真实缺陷（400 错误包、401/403 语义、CAS/状态机、来源哈希门禁等），应予保留。
  - `无效更改`：无依据的改写、过时内容、被后续覆盖的残留，应回退或删除。
  - `需裁决`：无充分证据自行判定，需用户决定。

> **实测结果（本报告核心事实）**：HEAD 基线在临时目录解包后 `32 passed`；当前工作区 `python -m pytest -q` = **5 failed / 35 passed**。
> 失败项：`test_projects_hub_service.py::test_api_static_and_projects_integration`、`test_cleanroom_hygiene.py::test_no_banned_binary_assets`、
> `test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers`、`test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets`、
> `test_production_smoke.py::test_production_smoke_frontend_static_routing`。

---

## 1. 变更总览表

| 类别 | 文件数量 | 体积 | 已跟踪被修改（M） | 新增未跟踪（??） |
|---|---:|---:|---:|---:|
| Python 后端 | 11 | 59.1 KiB | 10 | 1 |
| 前端静态 | 158 | 37,414.4 KiB | 5 | 153 |
| 文档 | 37 | 211.8 KiB | 19 | 18 |
| 测试 | 7 | 46.0 KiB | 6 | 1 |
| **合计（仅真实文件）** | **213** | **37,731.3 KiB** | **40** | **173** |

说明：

- 合计 **213 个真实文件**，口径为 `git status --porcelain -uall`：40 条 ` M` + 173 条 `??`（含本报告、独立审核报告与本记录等治理文件自身）。
- `git status --porcelain`（默认折叠未跟踪目录）为 **143 行**：40 条 ` M` + 103 条 `??`，其中 15 条为目录条目（如 `docs/design/`、`src/gods_workbench/static/vendor/`），展开后即上表 213 个真实文件。
- 前端静态 37,414.4 KiB（约 36.5 MiB）中，**27,674.7 KiB 为 `static/vendor/`**（含 3 个本地 `.otf` 字体 26,030.1 KiB、`three-0.160.0.module.js` 1,243.1 KiB、`lucide.js` 392.5 KiB）。

---

## 2. 逐项判定表

### 2.1 Python 后端（11 项）

| 文件路径 | 变更类型 | 判定 | 依据 |
|---|---|---|---|
| `run.py` | 已跟踪修改 | **合理修复** | 启动横幅 Phase 5 → Remediation，与 CLEANROOM-STATUS.md 现状一致 |
| `src/gods_workbench/api/app.py` | 已跟踪修改 | **合理修复** | 新增 RequestValidationError → 400 INVALID_REQUEST 统一错误包；/healthz 改为 frozen_contracts=false、release_authorized=false。由 test_remediation_boundaries.py::test_invalid_topology_uses_standard_error_envelope 覆盖 |
| `src/gods_workbench/api/routes_god_canvas.py` | 已跟踪修改 | **合理修复** | 以 require_edit_access 取代 `authorization == "invalid"` 桩；由 test_remediation_boundaries.py::test_write_routes_require_session_and_role 覆盖 |
| `src/gods_workbench/api/routes_projects.py` | 已跟踪修改 | **合理修复** | 写操作接入 require_edit_access / require_governance_access；archived 默认 False；由同名测试覆盖 |
| `src/gods_workbench/god_canvas/godmap.py` | 已跟踪修改 | **合理修复** | GodmapPayload 增加 references 透传；由 test_god_canvas_service.py::test_god_canvas_godmap_and_json_import_export 覆盖 |
| `src/gods_workbench/god_canvas/models.py` | 已跟踪修改 | **合理修复** | CanvasTopology / CanvasTopologyUpdateRequest 增加 model_validator（ID 唯一、连线端点必须存在）；由 400 错误包测试覆盖 |
| `src/gods_workbench/god_canvas/service.py` | 已跟踪修改 | **合理修复** | insert 导入稳定 ID 重排、任务入口存在性、任务状态机、references 读写、ID 起始修正；由 test_remediation_boundaries.py 的四项测试覆盖 |
| `src/gods_workbench/god_canvas/tasks.py` | 已跟踪修改 | **合理修复** | 补 TaskStatus.CANCELLED 与 result/error 字段 |
| `src/gods_workbench/projects_hub/models.py` | 已跟踪修改 | **合理修复** | 补 scenes/shots/description/updated_at；排期 start_at/due_at 校验；progress 改 float |
| `src/gods_workbench/projects_hub/service.py` | 已跟踪修改 | **合理修复** | 生命周期状态机 + LIFECYCLE_CONFLICT(409) / INVALID_SCHEDULE(400)；由 test_projects_hub_service.py 覆盖 |
| `src/gods_workbench/core/auth.py` | 新增未跟踪 | **合理修复** | 新增最小认证与角色边界（require_authenticated / require_edit_access / require_governance_access），被 3 个路由与 service 层复用，由 test_remediation_boundaries.py 覆盖 |

**后端与测试覆盖度核对结论**：`tests/contracts/test_remediation_boundaries.py` 对后端改动意图的覆盖是**成立**的——

- 写操作 401/403 → `test_write_routes_require_session_and_role`（覆盖 `core/auth.py` + 两个路由文件）
- 统一 400 错误包 → `test_invalid_topology_uses_standard_error_envelope`（覆盖 `api/app.py` 的 validation handler 与 `god_canvas/models.py` 的 validator）
- 导入稳定 ID 重排 → `test_insert_import_rekeys_colliding_stable_ids`（覆盖 `god_canvas/service.py::_rekey_insert`）
- 任务入口前置与状态机 → `test_smart_task_requires_existing_entry_and_legal_transition`（覆盖 `service.py` + `tasks.py`）
- 空服务稳定 ID 起始 → `test_empty_services_allocate_first_stable_ids_from_one`（覆盖两个 service）
- 项目生命周期 → `tests/contracts/test_projects_hub_service.py` 与 `test_phase6_quality_gates.py` 同步更新断言

### 2.2 测试（7 项）

| 文件路径 | 变更类型 | 判定 | 依据 |
|---|---|---|---|
| `tests/contracts/test_remediation_boundaries.py` | 新增未跟踪 | **合理修复** | 本轮新增回归：401/403、400 错误包、导入 ID 重排、任务前置与状态机、空服务 ID 起始 |
| `tests/contracts/test_god_canvas_service.py` | 已跟踪修改 | **合理修复** | 同步 Bearer 语义、references 往返、INVALID_TOPOLOGY / UNSUPPORTED_OPTION 新语义 |
| `tests/contracts/test_golden_fixtures.py` | 已跟踪修改 | **合理修复** | 智能任务 202 调用补 Authorization 头（认证边界上线后的必要同步） |
| `tests/contracts/test_phase6_quality_gates.py` | 已跟踪修改 | **合理修复** | submit_smart_task 改传 Bearer；只读角色矩阵补 reviewer |
| `tests/contracts/test_projects_hub_service.py` | 已跟踪修改 | **合理修复** | CRUD/CAS/生命周期断言按新状态机更新（显式 null 可清除、须先归档再入回收站） |
| `tests/hygiene/test_cleanroom_hygiene.py` | 已跟踪修改 | **合理修复** | 新增迁移切片目标哈希校验与 PHASE-2 输入哈希校验（有效门禁） |
| `tests/smoke/test_production_smoke.py` | 已跟踪修改 | **合理修复** | /healthz 断言补 frozen_contracts / release_authorized；端到端链路补认证头 |

### 2.3 文档（37 项）

> 本节逐项表列出 34 项；另 3 项为本轮治理记录（`docs/governance/FILE-GOVERNANCE-2026-09-18.md`、`docs/governance/FILE-GOVERNANCE-REVIEW-2026-09-18.md`、`docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md`），不参与判定，故不在下表中逐项列出。

| 文件路径 | 变更类型 | 判定 | 依据 |
|---|---|---|---|
| `.gitignore` | 已跟踪修改 | **合理修复** | 新增 `.mimosa/` 忽略规则（中文注释），使代理工具会话状态不再污染 git status |
| `CLEANROOM-CHARTER.md` | 已跟踪修改 | **合理修复** | 统一章程与治理状态，撤销与当前事实冲突的旧授权措辞 |
| `CLEANROOM-IMPLEMENTATION-HANDOFF.md` | 已跟踪修改 | **合理修复** | 交接入口重申边界：用户授权 ≠ 架构解耦 |
| `CLEANROOM-STATUS.md` | 已跟踪修改 | **无效更改** | 文中『38 项测试全部通过』与实测不符（当前 40 项：5 失败 / 35 通过），且未记录任何失败项 |
| `README.md` | 已跟踪修改 | **合理修复** | 说明与发布状态同步（仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION） |
| `attestations/reviews/INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md` | 新增未跟踪 | **合理修复** | 独立审计记录；其事实（HEAD 基线 32 passed、16 项输入哈希成立、当时零二进制）经本轮复核成立 |
| `attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md` | 新增未跟踪 | **无效更改** | 核心断言『pytest -v 40 passed』与实测不符（5 失败 / 35 通过），亦未记录二进制违规 |
| `attestations/reviews/AUTHORIZED-CODE-MIGRATION-2026-09-17.md` | 已跟踪修改 | **合理修复** | 标注为历史材料，撤销过时授权结论 |
| `attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md` | 已跟踪修改 | **合理修复** | 标注历史材料，不再充当当前证据 |
| `attestations/reviews/PHASE-3-GATE-CHECK-2026-09-17.md` | 已跟踪修改 | **合理修复** | 同上 |
| `attestations/reviews/PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md` | 已跟踪修改 | **合理修复** | 同上，并说明 canvas/* → god_canvas/* 路径偏差 |
| `attestations/reviews/PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md` | 已跟踪修改 | **合理修复** | 同上 |
| `attestations/reviews/PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md` | 已跟踪修改 | **合理修复** | 同上，历史测试数字不再作准出证据 |
| `attestations/reviews/PHASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md` | 已跟踪修改 | **合理修复** | 撤销与当前事实冲突的正式授权结论 |
| `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml` | 已跟踪修改 | **合理修复** | review_status/version 更新为 remediation-1；导入导出契约与实现收敛（json 与 godmap，去 zip） |
| `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 已跟踪修改 | **合理修复** | review_status/version 同步为 remediation-1 |
| `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json` | 已跟踪修改 | **合理修复** | meta.version / review_status 同步为 remediation-1 |
| `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17.txt` | 已跟踪修改 | **合理修复** | 改为中文并标注『已由 v2 清单取代』 |
| `docs/provenance/PHASE-2-INPUT-REGISTER.md` | 已跟踪修改 | **合理修复** | 输入状态由『已冻结』改为『修复输入（发布审查未完成）』 |
| `docs/provenance/PHASE-2-INPUT-SHA256.txt` | 已跟踪修改 | **合理修复** | 3 个契约/夹具哈希随文本更新重算；由 test_phase2_input_hashes_match_current_files 强制校验（16 项全匹配，实测通过） |
| `docs/provenance/README.md` | 已跟踪修改 | **合理修复** | 补迁移登记与源/目标哈希要求 |
| `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` | 新增未跟踪 | **建议改进（非阻塞）** | 9 条设计文档迁移的 SHA256 全部 MATCH；『V1 删除登记』11 条路径的 SHA-256 **全部可复现**（8 项命中 `%TEMP%\gw-classic-removal-20260918-120000\`、8 项命中 `godsworkbench` release 仓、5 项命中旧仓），但登记未注明来源副本位置 → 建议补注（见 §4.1） |
| `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md` | 新增未跟踪 | **合理修复** | 逐文件分类表 + 依赖闭包结论，支撑本轮迁移边界 |
| `docs/governance/TASKS.md` | 新增未跟踪 | **合理修复** | 本轮台账，登记 T1–T6 与遗留问题（二进制红线、V2 命名基线、旧集成标记） |
| `docs/migration/CLASSIC-REMOVAL-PLAN-2026-09-18.md` | 新增未跟踪 | **合理修复** | 经典版删除方案与执行记录；其『5 failed 非本次引入』经复核部分成立 |
| `docs/design/README.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/UI-DESIGN-V2-BASELINE.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/DESIGN-SYSTEM-INDEX.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/UI-DESIGN-V2-HARDWARE-WORKBENCH.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/UI-DESIGN-V2-STITCH-TOKENS.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/UI-DESIGN-V2-0908-ASSET-INDEX.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/UI-DESIGN-V2-WALKTHROUGH.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |
| `docs/design/archive/UI-DESIGN-V2-0908-ARCHIVE.md` | 新增未跟踪 | **准确迁移** | manifest v2 逐条登记，SHA256 与字节数全部 MATCH；已确认无 Markdown 图片语法与二进制引用 |

### 2.4 前端静态（158 项）

**总体核对结果（逐文件 SHA-256 + 规范化换行比对）**：

| 与用户源关系 | 项数 | 说明 |
|---|---:|---|
| 逐字节一致 | 105 | 用户 V2 前端的准确迁移 |
| 仅差字体名替换 | 21 | Inter/JetBrains Mono/Outfit → Source Han Sans CN（清单见下） |
| 仅差『经典版』净化 | 11 | V1 已删除页面的链接/注释清理，有登记依据 |
| 字体名替换 + 其他混合差异 | 15 | 含 `vendor/css/fonts.css`、`vendor/MANIFEST.md`、`css/hardware-design-system.css` 等字体本地化配套 |
| 源文件已删除（无效残留，待裁决） | 6 | 见 §3 |
| **合计** | **158** | 105+21+11+15+6 |

为避免 158 行流水表淹没结论，以下按**判定分组**列出（组内逐项见表尾清单）：

| 判定 | 分组 | 项数 | 依据摘要 |
|---|---|---:|---|
| **准确迁移** | `与用户源一致或仅经典版净化（95）` | 95 | 逐字节一致 72 项 + 仅差『经典版』净化 11 项 + 字体名替换+其他混合 12 项 |
| **无效更改** | `源文件已删除的残留副本（6，待用户裁决）` | 6 | 与用户旧仓 HEAD blob 内容一致；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在 → 见 §3 |
| **需裁决** | `images/logo.png（1）` | 1 | 与用户源一致且被 11 个文件引用（10 个 `.html` + 1 个 `.js`）；但违反 §1.2 二进制红线 |
| **需裁决** | `js/asset-auth/**（2）` | 2 | 与用户源一致；本仓后端无任何 `/api/asset-auth/*` 路由（幻影接口），运行时必然失败 |
| **需裁决** | `js/canvas/**（19）` | 19 | 与用户源逐字节一致；但 AGENTS.md §4.2 明令禁止携带 `static/js/canvas/`（上游画布旧实现），且本仓无对应后端路由 |
| **需裁决** | `runninghub/thumbnails/*.jpg（5）` | 5 | 与用户源一致；但违反 §1.2「严禁提交图片」，且 4/5 仅被 `runninghub/api_providers.json` 引用（`workflow-2064542485938008065.jpg` 无任何文本引用） |
| **需裁决** | `system-prompts/**（1）` | 1 | 与用户源一致；属『无限画布』隔离区（分类表 DO_NOT_MIGRATE），且运行期无引用方 |
| **需裁决** | `vendor/fonts/*.otf（3）` | 3 | 与用户源一致；本地 .otf 违反 §1.2「严禁本地字体文件」，与 AGENTS.md 首选 CDN 方案冲突（见 TASKS.md §2.1） |
| **需裁决** | `vendor/js/**（2）` | 2 | 与用户源一致；§1.2 要求 Lucide/Tailwind 走 CDN，与本地 vendor 化冲突 |
| **需裁决** | `字体名替换型差异（21）` | 21 | 与用户源仅差字体族（Inter/JetBrains Mono/Outfit → Source Han Sans CN），清单与本组列举一致，需确认采用 AGENTS.md 还是用户指令 |
| **需裁决** | `字体本地化配套（3）` | 3 | 字体本地化配套改动；§1.2 红线与用户『字体全部替换为思源黑体』指令互相冲突（见 TASKS.md §2.1） |

#### 关键分组明细

**（1）与用户源逐字节一致的静态文件（105 项，判定：准确迁移）**

`api-settings.html`、`asset-manager.html`、`asset-share.html`、`canvas-list.html`、`canvas.html`、`comfyui-settings.html`、`css/asset-manager-coverflow.css`、`css/context-hotkey-feedback.css`、`css/context-tree-animations.css`、`css/directory-settings.css`、`css/episode-video-script.css`、`css/tailwind-utilities.css`、`css/theme.css`、`governance.html`、`js/api-settings.js`、`js/asset-manager/api.js`、`js/asset-manager/classification.js`、`js/asset-manager/coverflow.js`、`js/asset-manager/formatters.js`、`js/asset-manager/http.js`、`js/asset-manager/path-utils.js`、`js/asset-manager/storage.js`、`js/asset-review.js`、`js/asset-review/api.js`、`js/asset-review/http.js`、`js/asset-share.js`、`js/asset-share/api.js`、`js/asset-share/http.js`、`js/aura-trace.js`、`js/canvas-list/api.js`、`js/canvas-list/http.js`、`js/context-hotkeys.js`、`js/context-prefetch.js`、`js/directory-settings-nav.js`、`js/floating-dismissal.js`、`js/generator-touchbar-context.js`、`js/governance.js`、`js/history-bulk-manager.js`、`js/http-transport.js`、`js/i18n-core.js`、`js/i18n/api-settings.js`、`js/i18n/canvas.js`、`js/i18n/comfyui-settings.js`、`js/i18n/common.js`、`js/i18n/governance.js`、`js/i18n/smart-canvas.js`、`js/i18n/studio.js`、`js/i18n/task-center.js`、`js/image-preview.js`、`js/ltx-director-timeline.js`、`js/task-center.js`、`js/theme.js`、`js/touch-mouse.js`、`js/video.js`、`prompt-registry/NOTICE.md`、`prompt-registry/manifest.json`、`prompt-registry/sources/awesome-gpt-image.json`、`prompt-registry/sources/awesome-gpt4o-image-prompts.json`、`prompt-registry/sources/banana-prompt-quicker.json`、`prompt-registry/sources/freestylefly-gpt-image-2.json`、`prompt-registry/sources/youmind-gpt-image-2.json`、`prompt-registry/sources/youmind-nano-banana-pro.json`、`runninghub/api_providers.json`、`smart-canvas.html`、`task-center.html`、`update-notes.json`、`v2/js/agents-controller.js`、`v2/js/assets-controller.js`、`v2/js/collab-controller.js`、`v2/js/production-controller.js`、`v2/js/storyboard-controller.js`、`video.html`

**（2）仅差『经典版』净化 / 与源一致（剩余准确迁移项）**

`js/canvas-list.js`、`js/canvas.js`、`js/comfyui-settings.js`、`js/episode-pipeline.js`、`js/hardware-telemetry.js`、`js/i18n.js`、`js/settings.js`、`js/smart-canvas.js`、`v2/js/home-controller.js`、`v2/js/projects-controller.js`、`zimage.html`

**（3）字体名替换型差异（21 项，判定：需裁决）**

`angle.html`、`css/api-settings.css`、`css/asset-manager.css`、`css/asset-review.css`、`css/asset-share.css`、`css/asset-vault.css`、`css/canvas-list.css`、`css/canvas-overview.css`、`css/canvas-tools.css`、`css/canvas.css`、`css/comfyui-settings.css`、`css/episode-pipeline.css`、`css/obsidian-gold-settings.css`、`css/project-calendar-dialog.css`、`css/smart-canvas.css`、`css/workspace-pages.css`、`enhance.html`、`episode-pipeline.html`、`js/asset-manager.js`、`klein.html`、`online.html`

**（4）`js/canvas/**`（19 项，判定：需裁决）**

`js/canvas/classic-api.js`、`js/canvas/classic-generation.js`、`js/canvas/classic-image-editor.js`、`js/canvas/classic-interaction.js`、`js/canvas/classic-library-ui.js`、`js/canvas/classic-media.js`、`js/canvas/classic-output-viewer.js`、`js/canvas/classic-render.js`、`js/canvas/http.js`、`js/canvas/smart-api.js`、`js/canvas/smart-asset-library.js`、`js/canvas/smart-cascade.js`、`js/canvas/smart-interaction.js`、`js/canvas/smart-media.js`、`js/canvas/smart-prompt-templates.js`、`js/canvas/smart-render.js`、`js/canvas/smart-state.js`、`js/canvas/smart-utils.js`、`js/canvas/state.js`

**（5）`runninghub/thumbnails/*.jpg`（5 项）、`system-prompts/**`（1 项）、`images/logo.png`（1 项）、`vendor/**`（7 项）**

- `images/logo.png` — **需裁决** — 与用户源一致且被 11 个文件引用（10 个 `.html` + 1 个 `.js`）；但违反 §1.2 二进制红线
- `runninghub/thumbnails/workflow-2058541134623891458.jpg` — **需裁决** — 与用户源一致；但违反 §1.2「严禁提交图片」，且 4/5 仅被 `runninghub/api_providers.json` 引用（`workflow-2064542485938008065.jpg` 无任何文本引用）
- `runninghub/thumbnails/workflow-2058554058318897153.jpg` — **需裁决** — 与用户源一致；但违反 §1.2「严禁提交图片」，且 4/5 仅被 `runninghub/api_providers.json` 引用（`workflow-2064542485938008065.jpg` 无任何文本引用）
- `runninghub/thumbnails/workflow-2058818588181622785.jpg` — **需裁决** — 与用户源一致；但违反 §1.2「严禁提交图片」，且 4/5 仅被 `runninghub/api_providers.json` 引用（`workflow-2064542485938008065.jpg` 无任何文本引用）
- `runninghub/thumbnails/workflow-2058824859437850625.jpg` — **需裁决** — 与用户源一致；但违反 §1.2「严禁提交图片」，且 4/5 仅被 `runninghub/api_providers.json` 引用（`workflow-2064542485938008065.jpg` 无任何文本引用）
- `runninghub/thumbnails/workflow-2064542485938008065.jpg` — **需裁决** — 与用户源一致；但违反 §1.2「严禁提交图片」，且在**全工作区无任何文本引用**（`runninghub/api_providers.json` 只登记其余 4 张），属孤儿资源
- `system-prompts/infinite-canvas-prompt-templates.md` — **需裁决** — 与用户源一致；属『无限画布』隔离区（分类表 DO_NOT_MIGRATE），且运行期无引用方
- `vendor/MANIFEST.md` — **需裁决** — 字体本地化配套改动；§1.2 红线与用户『字体全部替换为思源黑体』指令互相冲突（见 TASKS.md §2.1）
- `vendor/css/fonts.css` — **需裁决** — 字体本地化配套改动；§1.2 红线与用户『字体全部替换为思源黑体』指令互相冲突（见 TASKS.md §2.1）
- `vendor/fonts/SourceHanSansCN-Bold.otf` — **需裁决** — 与用户源一致；本地 .otf 违反 §1.2「严禁本地字体文件」，与 AGENTS.md 首选 CDN 方案冲突（见 TASKS.md §2.1）
- `vendor/fonts/SourceHanSansCN-Medium.otf` — **需裁决** — 与用户源一致；本地 .otf 违反 §1.2「严禁本地字体文件」，与 AGENTS.md 首选 CDN 方案冲突（见 TASKS.md §2.1）
- `vendor/fonts/SourceHanSansCN-Normal.otf` — **需裁决** — 与用户源一致；本地 .otf 违反 §1.2「严禁本地字体文件」，与 AGENTS.md 首选 CDN 方案冲突（见 TASKS.md §2.1）
- `vendor/js/lucide.js` — **需裁决** — 与用户源一致；§1.2 要求 Lucide/Tailwind 走 CDN，与本地 vendor 化冲突
- `vendor/js/three-0.160.0.module.js` — **需裁决** — 与用户源一致；§1.2 要求 Lucide/Tailwind 走 CDN，与本地 vendor 化冲突

---

## 3. 「无效更改」清单（8 个文件 + 2 条非文件残留）

| # | 文件路径 | 变更类型 | 事实证据 | 建议动作 |
|---:|---|---|---|---|
| 1 | `src/gods_workbench/static/images/RunningHub-B.png` | 新增未跟踪 | 与用户旧仓 HEAD blob 内容一致（2,970 字节）；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在且内容一致 | **待用户裁决（不得作为本轮清理依据）** |
| 2 | `src/gods_workbench/static/images/RunningHub-W.png` | 新增未跟踪 | 与用户旧仓 HEAD blob 内容一致（1,806 字节）；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在且内容一致 | **待用户裁决（不得作为本轮清理依据）** |
| 3 | `src/gods_workbench/static/images/modelscope-1.gif` | 新增未跟踪 | 与用户旧仓 HEAD blob 内容一致（49,941 字节）；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在且内容一致 | **待用户裁决（不得作为本轮清理依据）** |
| 4 | `src/gods_workbench/static/images/modelscope.gif` | 新增未跟踪 | 与用户旧仓 HEAD blob 内容一致（35,929 字节）；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在且内容一致 | **待用户裁决（不得作为本轮清理依据）** |
| 5 | `src/gods_workbench/static/images/volcengine-theme-dark.svg` | 新增未跟踪 | 本仓 CRLF 5,085 字节；用户旧仓 HEAD blob LF 5,035 字节，**仅换行归一后等价**（非逐字节一致）；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在（5,085 字节，与本仓一致） | **待用户裁决（不得作为本轮清理依据）** |
| 6 | `src/gods_workbench/static/images/volcengine-theme-light.svg` | 新增未跟踪 | 本仓 CRLF 5,088 字节；用户旧仓 HEAD blob LF 5,038 字节，**仅换行归一后等价**（非逐字节一致）；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在（5,088 字节，与本仓一致） | **待用户裁决（不得作为本轮清理依据）** |
| 7 | `CLEANROOM-STATUS.md` | 已跟踪修改 | 文中『38 项测试全部通过』与实测不符（当前 40 项：5 失败 / 35 通过），且未记录任何失败项 | 修正测试数字为『5 failed / 35 passed』并登记失败原因 |
| 8 | `attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md` | 新增未跟踪 | 核心断言『pytest -v 40 passed』与实测不符（5 失败 / 35 通过），亦未记录二进制违规 | 按当前实测重写核验结论后再入库 |
| 9 | `.mimosa/hook-state/**（35 个文件）` | 工具会话状态（已被 .gitignore 忽略） | 代理工具会话状态与文件基线快照，非项目资产；占用 159.5KB | 清理（工具会话状态，不属项目资产） |
| 10 | `tmp_dep.py` | 临时脚本 | 前序代理人用于扫描 V2 引用可达性的临时脚本；审计开始时存在，复核时已不在磁盘 | 删除（临时脚本） |

> 说明：`.mimosa/` 与 `tmp_dep.py` 归入「垃圾」。`.mimosa/` 已被 `.gitignore` 忽略，因此不出现在 `git status` 中，但物理占用工作区 159.5 KB；`tmp_dep.py` 在本次审计开始时存在于工作区，复核时已不在磁盘，故其当前状态为「已消失」。

**结论**：应处理的无效更改变更为 **6 个源图片残留副本（待用户裁决，不得作为本轮清理依据）** + **2 份测试数字失实的文档**；另有 **2 条非文件形态残留**（`.mimosa/` 目录、`tmp_dep.py`）单列，不计入真实文件合计。

---

## 4. 「需裁决」清单（57 项）

| # | 分组 | 项数 | 争点 | 需用户决定的问题 |
|---:|---|---:|---|---|
| 1 | `js/canvas/**` | 19 | AGENTS.md §4.2 明令『严禁携带 `static/js/canvas/`（上游画布旧实现）』；但这 19 个文件与用户源逐字节一致，且用户 V2 的 `canvas.html` / `smart-canvas.html` 通过 9 处 `/static/js/canvas/*` 引用它们（属用户自有前端依赖） | 放宽 §4.2 以适配用户 V2 前端，还是删除这 19 个文件并接受画布页降级？ |
| 2 | 字体名替换型差异 | 21 | 这些文件与用户源仅差字体族（Inter/JetBrains Mono/Outfit → Source Han Sans CN）。AGENTS.md §1.2 要求『字体一律使用 Google Fonts CDN 或系统原生字体栈』，与用户『字体全部替换为思源黑体』的指令直接冲突 | 以 AGENTS.md 为准（回退字体名）还是以用户指令为准（保留替换并修订 §1.2）？ |
| 3 | 字体本地化配套 | 3 | `vendor/css/fonts.css`、`vendor/MANIFEST.md`、`css/hardware-design-system.css` 均为字体本地化配套；MANIFEST 中存在大量『本地文件已不存在，条目作废』的历史条目 | 是否保留本地字体方案？若保留，MANIFEST 的作废条目是否一并清理？ |
| 4 | `vendor/fonts/*.otf` | 3 | 思源黑体 3 个字重，25.42 MiB（26,030.1 KiB），与用户源逐字节一致；但违反 §1.2『严禁提交本地字体文件』。相关卫生用例已 FAILED | 保留本地字体并豁免红线，还是改为 CDN/系统字体栈？ |
| 5 | `vendor/js/**` | 2 | `lucide.js`、`three-0.160.0.module.js`；§1.2 要求 Lucide 走 CDN | 保留本地 vendor 化，还是改用 CDN？ |
| 6 | `runninghub/thumbnails/*.jpg` | 5 | 与用户源一致；但违反 §1.2 图片红线，且运行期仅被 `runninghub/api_providers.json` 自身引用 | 删除图片并接受缩略图缺省，还是保留并豁免红线？ |
| 7 | `images/logo.png` | 1 | 与用户源一致，被 11 个文件引用（10 个 `.html` + 1 个 `.js`）；但违反 §1.2 图片红线 | 保留（豁免）还是替换为内联 SVG/CSS？ |
| 8 | `system-prompts/infinite-canvas-prompt-templates.md` | 1 | 属『无限画布』隔离区（分类表 DO_NOT_MIGRATE），运行期无引用方 | 删除还是移出仓库？ |
| 9 | `js/asset-auth/**` | 2 | 与用户源一致；后端无任何 `/api/asset-auth/*` 路由，运行时必然 404 | 补后端路由，还是删除并清理 V2 中的幻影引用？ |
| — | **合计** | **57** | — | — |

**补充：运行时失败与前端幻影接口**——本仓后端共注册 **12 条 `/api` 路径模板**（`/api/asset-registry/*` 5 条 + `/api/canvases*` 6 条 + `/api/jobs/*` 1 条；另有非 `/api` 的 `/healthz`、`/`），而前端静态层归一后引用了 **203 条 `/api` 路径**。

- **去重/归一规则**：仅扫描 `.js` 文件；对文本中匹配 `/api/[A-Za-z0-9_\-\.\$\{\}/]*` 的令牌，先去查询串与片段锚（`?`、`#`）、再把 `${...}` 占位归一为 `*`、最后删除尾斜杠，再做集合去重。
- **原始令牌去重数**：仅 `.js` 为 **205** 条；含 `.html`、`.css` 为 **213** 条。
- **归一后数**：仅 `.js` 为 **203** 条；含 `.html`、`.css` 为 **210** 条。
- **文件数口径**：引用到本仓未实现接口的 `.js` 文件，按「缺失引用 ≥1 条」为 **29 个**，按「缺失引用 ≥2 条」为 **24 个**（原报告记 23，系更早快照，未声明阈值）。

这部分是 V2 前端整体迁移带来的**结构性缺口**，建议单独立项（见 §5）。

### 4.1 建议改进（非阻塞）

| # | 对象 | 类型 | 事实 | 建议 |
|---|---|---|---|---|
| 1 | `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 的『V1 删除登记』节 | 建议改进（非阻塞） | 11 条登记路径的 SHA-256 **全部可复现**：8 项命中 `%TEMP%\gw-classic-removal-20260918-120000\`、8 项命中 `D:\Working\Code Pro\Gods-Workbench-release`、5 项命中 `D:\Working\Code Pro\Gods-Workbench`；但登记未注明来源副本位置 | 补注每条哈希的来源副本位置，使后续审计可一键复现（**不阻塞本轮提交**） |

---

## 5. 治理建议

### 5.1 应继续留在工作区（继续保留）

1. **Python 后端 11 项**（`run.py`、`api/*`、`god_canvas/*`、`projects_hub/*`、`core/auth.py`）——全部为 `合理修复`，修复了 400 错误包、401/403 语义、CAS 生命周期、导入 ID 重排、任务状态机等真实缺陷，且有 `test_remediation_boundaries.py` 等用例覆盖。
2. **测试 7 项**——全部为 `合理修复`。
3. **文档 37 项中判定为应保留的 31 项**（`准确迁移` 9 项 + `合理修复` 22 项）——含 `docs/design/**` 9 份（SHA256 全 MATCH，判为 `准确迁移`）、`docs/provenance/PHASE-2-INPUT-SHA256.txt`（16 项哈希全匹配）、`docs/governance/TASKS.md`、`docs/migration/CLASSIC-REMOVAL-PLAN-2026-09-18.md`、`docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md` 等（均判为 `合理修复`）。文档余下：`无效更改` 2 项（见 §3）、`建议改进` 1 项（见 §4.1）、治理记录 3 项（本报告、独立审核报告、`BINARY-AND-NAMING-BASELINE-2026-09-18.md`，不参与判定）。
4. **前端静态 95 项**（`逐字节一致` 72 项 + `仅差『经典版』净化` 11 项 + `字体名替换+其他混合` 12 项）——属用户 V2 前端的准确迁移（另 57 项需裁决见 §4，6 项无效残留见 §3）。
5. **`.gitignore` 的 `.mimosa/` 忽略规则**——有效防止工具会话状态污染 `git status`，建议保留。

### 5.2 应清理（在用户确认后执行，本报告未做任何删除）

| 优先级 | 对象 | 动作 | 理由 |
|---|---|---|---|
| P0 | `images/RunningHub-B.png`、`RunningHub-W.png`、`modelscope-1.gif`、`modelscope.gif`、`volcengine-theme-dark.svg`、`volcengine-theme-light.svg` | **待用户裁决（不得作为本轮清理依据）** | 与用户旧仓 HEAD blob 内容一致（其中 2 个 SVG 仅换行归一后等价）；用户旧仓工作区显示未提交删除 ` D`；release 仓副本仍存在。未确认权威源前不得据此清理 |
| P0 | `.mimosa/`（35 个文件） | 删除目录 | 代理工具会话状态，非项目资产（`.gitignore` 规则保留） |
| P0 | `tmp_dep.py` | 删除（若再出现） | 前序代理人的临时扫描脚本 |
| P1 | `CLEANROOM-STATUS.md`、`attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md` | 修正 | 两处『测试全部通过』断言与实测（5 failed / 35 passed）不符，属失实证据 |
| P1 | `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 的『V1 删除登记』节 | 建议改进（非阻塞） | 11 条登记哈希全部可复现（`%TEMP%\gw-classic-removal-20260918-120000\` 8 项、`Gods-Workbench-release` 8 项、`Gods-Workbench` 5 项），仅未注明来源副本位置 |

### 5.3 建议尽快立项的三项遗留工作

1. **二进制红线与 AGENTS.md 的冲突必须一次性裁决**。当前 §1.2（零图片/零本地字体）与用户实际交付（思源黑体 3 个字重 25.6 MB、`logo.png`、5 张缩略图、2 个 vendor JS）直接冲突，导致 3 个卫生用例长期 FAILED。建议二选一：修订 §1.2 并给出显式白名单，或改走 CDN/系统字体栈并删除本地资源。
2. **V2 workshop 命名基线冲突**。`tests/contracts/test_projects_hub_service.py` 与 `tests/smoke/test_production_smoke.py` 断言 `v2/workshop.html` 含 `god-canvas`，但用户自有 V2 前端（以及本次迁移后的文件）均不含该字符串——含该字样的是 HEAD 中被整体替换的占位页。这 2 个用例即前述 5 项失败中的 2 项，属**迁移断言未同步**，并非迁移缺陷。需确认 workshop 的正式命名口径后同步修订断言或前端文案。
3. **前端幻影接口收敛**。前端静态层（仅 `.js`）归一后引用 **203 条 `/api` 路径**（原始令牌去重 205 条；含 `.html`/`.css` 归一后 210、原始 213），后端仅实现 **12 条 `/api` 路径模板**；按「缺失引用 ≥1 条」口径有 **29 个** `.js` 文件引用了本仓不存在的接口（≥2 条口径为 24 个）。建议按 V2 页面逐页收敛，或明确标注哪些页面在洁净仓内为『仅静态展示、不接后端』。

### 5.4 建议的收口顺序

1. 先清理 `.mimosa/`（工具会话状态）。§5.2 的 6 张残留图片须**先待用户裁决**，不得作为本轮清理依据。
2. 修正 §5.2 的 P1 两处失实记录。
3. 对 §4 的裁决项取得明确结论（§5.3 第 1、2 项），据此同步修订 AGENTS.md 与受影响用例。
4. 完成 §5.3 第 3 项前端收敛立项。
5. 全部通过后冻结工作树并交付，再由未参与实现的独立审查者复核。

---

## 6. 附：判定统计

**口径**：本节以 `git status --porcelain -uall` 的 **213 条真实文件**为统一计数单位（40 条 ` M` + 173 条 `??`），与 §1、§4 完全一致；不含非文件形态条目。

| 判定 | 项数 | 占比 |
|---|---:|---:|
| 准确迁移 | 104 | 48.8% |
| 合理修复 | 40 | 18.8% |
| 无效更改 | 8 | 3.8% |
| 需裁决 | 57 | 26.8% |
| 建议改进（非阻塞） | 1 | 0.5% |
| 治理记录（本轮新增，不参与判定） | 3 | 1.4% |
| **合计** | **213** | **100%** |

> 其中 `准确迁移` 104 项、`合理修复` 40 项，合计 **144 项（67.6%）判定为应保留**；`无效更改` 8 项、`需裁决` 57 项、`建议改进` 1 项、`治理记录` 3 项。
> **本节未混入非文件形态条目**；非文件形态条目共 **2 条**（`.mimosa/` 目录聚合条目、`tmp_dep.py`，后者已从磁盘消失），已在 §3 单列，不计入上表。
> 占比四舍五入保留一位小数，合计可能不恰为 100.0%。

**报告生成说明**：本报告依据本轮只读盘点证据生成；除本报告文件外，未新增、修改、删除、移动或回退任何仓库文件，也未执行 `git checkout/reset/restore/stash/clean/commit`。


---

## 7. 用户裁决落地（2026-09-18 追加）

本节为报告发布后的**用户裁决结果与落地记录**，仅追加，不改动上文任何判定。裁决后的最终状态以 `docs/governance/TASKS.md` 与 `docs/governance/TASK-NOTES-2026-09-18.md` 为准。

| 裁决 | 用户口径 | 落地结果 |
|---|---|---|
| §3 六张图片 / §4 二进制红线 | 「字体只能引入那 3 个思源黑体（开源的），其他图片别引入了」 | §3 中 6 张残留图片**已全部删除**（不再属「待裁决」）；**新增 6 张**（另 5 张缩略图 + 1 张无引用缩略图，共 12 个图片文件）一并清理；全仓现仅存 3 个白名单 OTF。`AGENTS.md` §1.2 已改为「唯一白名单」表述；2 个卫生用例已白名单化 |
| §5.3 第 1 项（AGENTS.md 冲突） | 「D2：改下后者文档」= 修订 `AGENTS.md` | 已完成（见上一行） |
| §5.3 第 2 项（V2 命名基线） | 「D3：改断言」 | `tests/contracts/test_projects_hub_service.py:117`、`tests/smoke/test_production_smoke.py:55` 已改为 `assert "影视工坊" in resp_workshop.text` |
| §5.2 六张残留图片 | 「D4：清理 6 张残留图片（含 `.svg`）」 | 已清理（含 2 个 SVG 与其余图片，共 12 个文件）；备份 `%TEMP%\gw-image-purge-20260918-090155\` |

**收口后测试基线**：`python -m pytest -q --no-header -p no:cacheprovider` → **1 failed / 39 passed**（唯一失败为 §5.3 第 3 项「旧集成标记基线」专项，未完成，属既有待办）。

**仍待处置（P1，破坏性操作，须用户确认）**：`docs/governance/TASKS.md` T12 —— `.git` 对象库内 16 个 `refs/copilot/checkpoints/**` 引用（含 13 个独占二进制 blob，约 25.57 MiB）。

## 后续状态更新（2026-09-20）

本节为**追加指针**，不改写上文任何一行。

- 上文「零二进制 / 不得提交字体 / 无字体资源」等表述为 **2026-09-17/18 时点快照**。当前权威口径以根 `AGENTS.md` §1.2 为准：仅 **3 个精确路径**的开源思源黑体（`SourceHanSansCN-{Bold,Medium,Normal}.otf`，OFL-1.1）列入唯一白名单，其余图片/字体/音视频等二进制一律禁止。
- **开源字体放行 ≠ 公开分发授权**：仓库发布状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- 当前重新取证见 `attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md` 与 `attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md`。
