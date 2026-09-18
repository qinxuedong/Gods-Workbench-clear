# 任务说明（2026-09-18）

本文件承接 `docs/governance/TASKS.md` 中各任务的详细说明与证据。台账只保留单条任务与一句话备注，所有展开内容集中在此。全部数字为 2026-09-18 现场跑命令实测得出。

---

## 1. 受限二进制资源

### 1.1 用户裁决（2026-09-18）

只允许 3 个开源思源黑体本地字体入库，其余图片一律不入库。裁决后 `AGENTS.md` 第 1 节第 2 条已改为**唯一白名单**表述（逐条精确路径），两个卫生用例同步白名单化：

- `tests/hygiene/test_cleanroom_hygiene.py`：`ALLOWED_BINARY_ALLOWLIST`（第 21-25 行）。
- `tests/hygiene/test_phase6_deep_hygiene.py`：`allowed_binary_allowlist`（第 32-36 行）。

白名单逐条路径与实测字节数（`Get-ChildItem` / `os.path.getsize`）：

| 路径 | 字节数 |
|---|---:|
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf` | 9,036,076 |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf` | 8,812,324 |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf` | 8,806,392 |
| **合计** | **26,654,792**（25.42 MiB） |

这 3 个字体为本地运行期强依赖：`src/gods_workbench/static/vendor/css/fonts.css` 通过 3 条 `@font-face` 声明，被 `static/v2/projects.html`、`static/v2/workshop.html` 以 `<link>` 引入。

### 1.2 原 12 个图片资源已清理（用户裁决口径「6 张残留图片」，实测清单为 12 个文件：`static/images/` 7 个（含 2 个 SVG）+ `runninghub/thumbnails/` 5 个）

- 现状：`src/gods_workbench/static/images/` 与 `src/gods_workbench/static/runninghub/thumbnails/` 目录下**文件数为 0**，全库无残留引用（`git grep` 未命中）。
- 备份位置：`%TEMP%\gw-image-purge-20260918-090155\`，含 `MANIFEST.txt`；清单 12 条，逐条 SHA-256 与字节数复算 **0 处不一致**。
- 被清理清单（12 项，合计 162,614 字节 ≈ 0.16 MiB）：

| 原路径 | 字节数 |
|---|---:|
| `src/gods_workbench/static/images/logo.png` | 33,811 |
| `src/gods_workbench/static/images/modelscope.gif` | 35,929 |
| `src/gods_workbench/static/images/modelscope-1.gif` | 49,941 |
| `src/gods_workbench/static/images/RunningHub-B.png` | 2,970 |
| `src/gods_workbench/static/images/RunningHub-W.png` | 1,806 |
| `src/gods_workbench/static/images/volcengine-theme-dark.svg` | 5,085 |
| `src/gods_workbench/static/images/volcengine-theme-light.svg` | 5,088 |
| `src/gods_workbench/static/runninghub/thumbnails/workflow-2058541134623891458.jpg` | 5,143 |
| `src/gods_workbench/static/runninghub/thumbnails/workflow-2058554058318897153.jpg` | 4,546 |
| `src/gods_workbench/static/runninghub/thumbnails/workflow-2058818588181622785.jpg` | 4,976 |
| `src/gods_workbench/static/runninghub/thumbnails/workflow-2058824859437850625.jpg` | 5,074 |
| `src/gods_workbench/static/runninghub/thumbnails/workflow-2064542485938008065.jpg` | 8,245 |

> 说明：其中 2 个 `volcengine-theme-*.svg` 为 SVG 文本，按 `AGENTS.md` 定义不属受限二进制；本轮按用户「图片一律不入库」口径一并清理。

---

## 2. Git 对象库内嵌二进制（P1，待用户确认）

工作区清理后，`.git` 对象库内仍存在同一批二进制 blob（属工作区之外的第二个残留面，与 §1 互不重叠）。以下为 2026-09-18 实测：

| 项 | 实测值 | 复核命令 |
|---|---:|---|
| `refs/copilot/checkpoints/**` 引用数 | 16 | `git for-each-ref` |
| 仅由这些引用可达的对象 | 333（237 blob / 16 commit / 80 tree） | `git rev-list --objects --all --not master` + `git cat-file --batch-check` |
| 其中独占 blob 体积 | 38,578,893 字节 = 36.79 MiB | `git cat-file -s` 逐条累加 |
| 其中受限二进制 blob | 13 个（5 图片 / 5 缩略图 / 3 OTF） | 同上，按扩展名过滤 |
| 13 个二进制 blob 体积 | 26,807,233 字节 = 25.57 MiB | 同上 |
| `.git` 目录体积 | 538 loose、无 pack、24.80 MiB | `git count-objects -vH` |
| 远端 | 无（`git remote -v` 为空，未外泄） | `git remote -v` |

### 2.1 处置方案（破坏性操作）

    git bundle create <仓库外备份路径> --all   # 建议先备份
    git for-each-ref --format="%(refname)" refs/copilot/ | ForEach-Object { git update-ref -d $_ }
    git reflog expire --expire=now --all
    git gc --prune=now

- 预期效果：`git rev-list --all --not master` 归零；`git count-objects -vH` 体积显著下降；`refs/copilot/checkpoints/**` 内 13 个二进制 blob 不再可达。
- 前置：确认 Copilot checkpoint 无保留价值；如需留档，先 `git bundle create` 备份到仓库之外。
- **未获用户明确确认前不得执行。**

### 2.2 卫生用例覆盖盲区

`tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets` 的 `ignored_dirs` 显式包含 `.git`（第 38 行），因此该用例只扫工作区文件、**不覆盖 git 对象库**。建议后续为卫生套件补一条「git 对象库零独占二进制」用例。

---

## 3. V2 命名基线

- 事实：用户自有 V2 前端 `src/gods_workbench/static/v2/workshop.html` 标题为「影视工坊 · Gods' Workbench v2」，页面内不含 `god-canvas` 字符串；两个失败断言沿用占位页时代的 `god-canvas` 字符串，属迁移断言未同步。
- 原失败断言：
  - `tests/contracts/test_projects_hub_service.py:117`：`assert "god-canvas" in resp_workshop.text`
  - `tests/smoke/test_production_smoke.py:55`：`assert "god-canvas" in resp_workshop.text`
- 用户裁决：**改断言为「影视工坊」**（方案 A，仅改测试层，前端零改动）。
- 现状：已由另一位负责人落地，两处断言现均为 `assert "影视工坊" in resp_workshop.text`（行号不变：117 / 55）。

---

## 4. 旧集成标记用例（专项，未完成）

`tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers`（第 72 行起）的 `forbidden_markers` 基线需按「V2 为保留前端」重定义：

- 现基线把 `lucide`、`runninghub`、`comfyui`、`settings.html`、`asset-manager.html`、`unsplash.com`、`window.v2projects` 等一并列为禁用标记，导致静态层大量误报（实测超 100 处命中）。
- 按 V2 保留口径，`lucide`（CDN 图标）、V2 页面自有业务标识等应从禁用清单中剔除或白名单化；真正的「旧版经典集成」标记需重新界定。
- 本项为**专项任务，尚未完成**，改写基线与用例须单独提请审核。

---

## 5. 测试基线

| 项 | 值 |
|---|---|
| 命令 | `python -m pytest -q --no-header -p no:cacheprovider` |
| 实测结果 | **1 failed / 39 passed in 0.51s**（2026-09-18 现场实测） |
| 失败用例 | `tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers` |
| 历史结果 | 修复前基线为 5 failed / 35 passed（含二进制与命名断言）；二进制清理 + 白名单 + 命名断言落地后收敛为上述 1 failed |
| 归因 | 唯一失败项为 §4 的旧集成标记用例基线问题，与二进制清理、V2 命名无关 |
| 基线仓对照 | 基线 `HEAD = abd0e88` 解包后为 32 passed（前序治理记录实测） |

---

## 6. 本批次交付物清单

### 6.1 洁净仓（`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`）

| 类别 | 路径 |
|---|---|
| 任务台账（极简） | `docs/governance/TASKS.md`（本次重写） |
| 任务说明（本文件） | `docs/governance/TASK-NOTES-2026-09-18.md`（本次新建） |
| 文件治理报告 | `docs/governance/FILE-GOVERNANCE-2026-09-18.md` |
| 治理报告独立复核 | `docs/governance/FILE-GOVERNANCE-REVIEW-2026-09-18.md` |
| 二进制 + 命名基线 | `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md` |
| 最终验收审核 | `docs/governance/FINAL-ACCEPTANCE-AUDIT-2026-09-18.md` |
| 最终验收复审确认 | `docs/governance/FINAL-ACCEPTANCE-REVERIFY-2026-09-18.md` |
| 经典版移除方案 | `docs/migration/CLASSIC-REMOVAL-PLAN-2026-09-18.md` |
| 来源登记（V2 + V1 删除） | `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` |
| 状态数字更正 | `CLEANROOM-STATUS.md`（追加更正节，第 40 行起） |
| 核验记录数字更正 | `attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md`（追加更正节，第 45 行起） |

### 6.2 目标仓（`D:\Working\Code Pro\Gods-Workbench-release`）

| 类别 | 路径 |
|---|---|
| 拆分总方案 | `docs/architecture/MAIN-PY-DECOMPOSITION-PLAN.md` |
| Phase A 基线勘察 | `docs/architecture/MAIN-PY-PHASE-A-BASELINE.md` |
| Phase A 独立复核 | `docs/architecture/MAIN-PY-PHASE-A-BASELINE-REVIEW.md`（结论：可进入 Phase B，须先修正 P1 口径） |

---

## 7. 变更来源说明

- 基线提交：`abd0e88`（Phase 7 发布审计与就绪授权完成及独立终审签署），`git rev-parse HEAD` = `abd0e8899650117738cd830d9f027d8e9b93162f`，分支 `master`。
- `abd0e88` 之后**无新提交**（`git log --oneline -1` 仍为 `abd0e88`），全部改动均为工作区未提交变更。
- 变更规模（2026-09-18 实测）：
  - 已跟踪文件修改：42 个（`git diff --name-only abd0e88`）；`git diff --shortstat abd0e88` = 42 files changed, 1791 insertions(+), 401 deletions(-)。
  - 未跟踪新增文件：**164** 个；`git status --porcelain -uall` 合计 **206** 条（42 M + 164 ??）。（初稿时快照为 163 / 205，差额来自 `TASKS.md` 在本文之后落盘；现已按实测刷新。）
  - 四类判定明细见 `docs/governance/FILE-GOVERNANCE-2026-09-18.md`（准确迁移 / 合理修复 / 无效更改 / 需裁决）。
- 比对来源（只读）：`D:\Working\Code Pro\Gods-Workbench`（用户旧仓，HEAD = 2a95a2fc）与 `D:\Working\Code Pro\Gods-Workbench-release`（迁移来源根，同 HEAD）。
- 治理结论出处：文件治理判定见 `FILE-GOVERNANCE-2026-09-18.md` 与独立复核 `FILE-GOVERNANCE-REVIEW-2026-09-18.md`；二进制与命名结论见 `BINARY-AND-NAMING-BASELINE-2026-09-18.md`；验收结论见 `FINAL-ACCEPTANCE-AUDIT-2026-09-18.md` 与 `FINAL-ACCEPTANCE-REVERIFY-2026-09-18.md`。

---

## 8. 其他登记事项

- **T1** `/static/` 裸目录 404：入口 `/` 仍 307 跳转 `/static/v2/projects.html`（实测 `/static/` = 404，`/static/v2/projects.html` = 200），用户已答复「ok」，可接受。
- **T6** 最终验收审核 + 复审确认：结论见 `docs/governance/FINAL-ACCEPTANCE-AUDIT-2026-09-18.md` 与 `docs/governance/FINAL-ACCEPTANCE-REVERIFY-2026-09-18.md`。
- **T9** 命名断言改「影视工坊」：细节见 §3。
- **T12** Git 对象库内嵌二进制处置：细节见 §2。
- **T13** 旧集成标记卫生用例基线重定义：细节见 §4。
- 发布状态：仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- 唯一剩余硬前置：§2 的 `.git` 对象库内嵌二进制处置（P1，破坏性操作，须用户明确确认）。

---

## 9. T11 `main.py` 拆分（滚动更新）

目标：将 `D:\Working\Code Pro\Gods-Workbench-release` 根目录巨型 `main.py` 按
`docs/architecture/MAIN-PY-DECOMPOSITION-PLAN.md` 分阶段拆除；本表为滚动台账，细节以目标仓
`docs/architecture/MAIN-PY-PHASE-D-SEQUENCE.md` 与 `MAIN-PY-PHASE-D-D*-REVIEW.md` 为准。

> 事实来源（2026-09-19 只读）：`git log`、`git show <rev>:main.py` 逐提交 AST 比对、
> `git show <rev>:app_runtime/services/updates/*.py`。**未修改目标仓任何文件。**

### 9.1 Phase D 符号账目（60 候选）

**任务书口径（主控给定）**：已提交 55/60；批次明细 D1=9、D2=5、D3=6、D4=5、D5=6、D6-A=6、D6-B=4、D6-C=1（`check_update`）。

**本轮只读实测口径**（`git show <rev>:main.py` 逐提交 AST 顶层符号差集）：

| 批次 | 模块 | 实测迁出符号数 | 提交 |
|---|---|---:|---|
| D1 | `app_runtime/services/updates/versioning.py` | 9 | `d737f944` |
| D2 | `app_runtime/services/updates/remote.py` | 20 | `352a5f06` |
| D3 | `app_runtime/services/updates/notes.py` | 3 | `4ed27afb` |
| D4 | `app_runtime/services/updates/staging.py` | 5 | `3ea0e65d` |
| D5 | `app_runtime/services/updates/assets.py` | 6 | `6f1ff294` |
| D6-A | `app_runtime/services/updates/static_pages.py` | 6 | `25f112b3` |
| D6-B | `app_runtime/services/updates/staging.py` | 4 | `fe41d0bc` |
| D6-C | `app_runtime/services/updates/check.py` | 1 | `2d2a8a59` |

- **累计口径**：60 个候选中已迁出 **54 个**（实测时点：目标仓 `main` HEAD = `2d2a8a59`）。
- **仍保留在 `main.py` 的 6 个候选**：`safe_static_dir`、`schedule_self_restart`、
  `update_from_github`、`rollback_update`、`UPDATE_API_DEPENDENCIES`、`UPDATE_LOCK`。
- **并发提示**：本轮作业期间目标仓由另一 worker 并发推进，D6-C（`check_update`）从「工作区未提交」
  变为「已提交」；上表为**最终复核时点**值。

> **口径差异（如实登记，未自行裁定）**：任务书的批次明细逐项相加为 42，且其中 D2=5（实测 20）、
> D3=6（实测 3）两项与仓库历史不符；「55/60」亦无法由 60 候选清单复现（逐提交实测为 54/60）。
> 差异原因超出洁净仓职责，**留待主控在 Phase D 收口时裁定**；本表以逐提交 AST 实测值为准，
> 并保留任务书原始口径供复核。

### 9.2 已迁出模块清单

`app_runtime/services/updates/{versioning,remote,notes,staging,assets,static_pages,check}.py`
（7 个模块，均已随 Phase D 各批提交迁入）。

### 9.3 建议永久保留在 `main.py` 的 update 域符号

来源：`MAIN-PY-PHASE-D-D6-RECON.md` §8.4（**建议**，非已定稿结论）：

- `UPDATE_LOCK`：测试 `patch.object(main, "UPDATE_LOCK")`，且须与两个入口共享同一 Lock 实例；
- `update_from_github`、`rollback_update`：就地改写安装目录，强耦合 `BASE_DIR`/`DATA_DIR`/`STATIC_DIR`，且共享锁；
- `UPDATE_API_DEPENDENCIES`：路由装配锚点，7 个 lambda 为刻意的延迟解析（Phase E 路由抽取的接缝）；
- `app_info`：`UPDATE_API_DEPENDENCIES` 的 7 个 lambda 之一，且读多个 `GITHUB_*` 常量；
- `read_app_version`（及 `_read_legacy_bootstrap_app_version`，`main.py:358-378`）：legacy 降级重绑语义，
  `tools/check_release_metadata.py` 与 `tests/test_update_safety.py` 双重硬门禁。

### 9.4 冻结不变量（Phase D 每批必须保持不变）

| 项 | 冻结值 |
|---|---|
| OpenAPI 序列化字节数（CRLF） | 579853 B |
| OpenAPI SHA-256 | `48c4cf7d285c537e763083317d2d7a4451de928aa48076ec98fa189b94df7cac` |
| routes | 146 |
| paths | 288 |
| schemas | 181 |

以上为 `MAIN-PY-PHASE-D-SEQUENCE.md` §3 冻结值；`MAIN-PY-PHASE-D-DOCS-AUDIT.md` 已独立复核「实测一致」。

### 9.5 冻结失败集合（7 条，不得新增）

- `tests/test_episode_pipeline_frontend_contract.py`
- `tests/test_floating_window_frontend_contract.py`
- `tests/test_gw045_topbar_contract.py`（2 条）
- `tests/test_m3_asset_manager_module_contract.py`
- `tests/test_release_metadata.py`
- `tests/test_signal_flow_design_system_contract.py`

### 9.6 迁移性质：D1–D4 逐字节等价，D5 / D6 不是

- **D1 / D2 / D3 / D4**：逐符号 `ast.get_source_segment` 比对，**逐字节等价**（CRLF→LF 归一）。
  本轮只读复核：D1 9/9、D2 20/20、D3 3/3、D4 5/5 全部与原 `main.py` 源段一致。
- **D5 / D6-A / D6-B / D6-C**：属于「**改写 + provider 依赖注入**」，**不是** D1–D4 的逐字节等价迁移。
  这些模块以 `configure_dependencies(**providers)` + `_resolve_dependency(...)` 注入运行期依赖，
  调用点在每次调用时解析全局，以恢复 `patch.object(main, ...)` 的补丁面传播；因此源码段与原实现
  **不保证逐字节相同**。此差异为设计选择，不得表述为「等价迁移」。

### 9.7 未关闭事项

- D2/D4 批次提交说明曾称「补丁面保持」，实测存在 `patch.object(main, github_json/github_get/
  require_update_root_files)` 漂移；已用 `tests/test_phase_d_patch_surface_regression.py` 显式守护。
- D5 遗留 R1（P2，非阻塞）：`patch.object(main, "update_allowed_file")` 补丁面在 D5 断裂；
  当前无生产代码/测试使用该补丁点。

### 9.9 Phase D 收口后的台账更新（2026-09-19）

> 回填：§9.1 “54/60（实测时点 HEAD = `2d2a8a59`）”为 D6-C 时点值，已过时。

- **D5b 已提交 `d80b33f4`**：迁出 `restart.py::schedule_self_restart` 与 `assets.py::safe_static_dir`（依赖注入批）。
- **最终口径**：60 个候选中 **56 已迁出**（分布：versioning 9、remote 20、notes 3、staging 9、assets 7、static_pages 6、check 1、restart 1），
  **4 为设计保留**：`UPDATE_LOCK`、`update_from_github`、`rollback_update`、`UPDATE_API_DEPENDENCIES`；无孤儿符号（60 全覆盖）。
- **约束回正**：§9.1 任务书“55/60”口径已被主控实测取代；以后统一用“56 迁出 + 4 保留”。
- **行数口径**：`main.py` 21152 → 20583（`split("\n")`）。
- **两处文档口径瑕疵已修正**（release 仓 `c53c19d7`）：
  「20661 → 20583」改为「21152 → 20583」；§5.1 补记 `update_allowed_file` 例外（69a24418）。
- **独立审核**：Carver（Phase D 真伪，`VERIFIED COMPLETE`）、
  Euclid（文档修正复核，`ACCEPT`）、
  Ramanujan（更新分发白名单审核，`ACCEPT`）。

### 9.8 台账只留单条 task 的原因

`TASKS.md` 按用户裁决仅为「单条 task + 1-2 行简短说明」；所有哈希、门禁数字、批次边界、
注入方案与风险处置统一回落到本文件，避免台账行膨胀。

---

## 10. 文档审核修正记录（2026-09-19）

> 背景：独立审核代理对目标仓 `D:\Working\Code Pro\Gods-Workbench-release`（分支 `main`）文档做了一轮审计，
> 判定 **FAIL**，问题清单 S1–S6。本节逐条记录**判定与处理**。
> 本仓（洁净室）职责限于**台账修正**；本节只登记分工，**不把本仓台账修正冒充 release 仓文档修正**。
> 核查时点：目标仓 `main` HEAD = `2d2a8a59`（只读 `git show` / `git log` / `git grep`，未改动其任何文件）。

| 编号 | 严重度 | 判定 | 处理与现状 |
|---|---|---|---|
| S1 | 高 | **成立** | 本仓：§9.6 如实写明「D1–D4 逐字节等价；D5/D6-A/D6-B/D6-C 为改写 + provider 依赖注入，**不是**逐字节等价迁移」，并以符号名登记、不复制过时行号。release 仓：**已由主控在 `f41ebe51` 修正**（头部「约 5-12 行」改为实测 `−35…+5`；分布 `0×27、-5×12、-8×1、-18×1、-25×3、-35×6、+5×1`）。 |
| S2 | 高 | **成立** | **已在本仓修正**：`TASKS.md` T11/T13/T6/T12/T9/T1 六行全部收敛为单行（≤ 80 字符左右，含状态与指针），明细回落到本文件 §9。 |
| S3 | 中 | **成立** | 本仓：§9.1 逐提交登记批次，**不引用不存在的 `MAIN-PY-PHASE-D-D1-REVIEW.md`**（实测该文件在 release 仓不存在，仅 A/B/C + D2/D3/D4 + D5/D6A/D6B/SECURITY）。release 仓：DOCS-AUDIT 报告仍保留「四个审核报告」措辞（属审计报告对任务书口径的引述）；是否改为「三个报告」或补交 D1 报告，**待主控裁定**。 |
| S4 | 中 | **成立** | **不由本仓处理**（用户指示由主控在 Phase D 收口时统一处理）。实测：release 仓 `f41ebe51` 已将 D2/D3/D4 状态列改为具体提交哈希、§5 补齐，但按指示**本仓不介入、不改动该文档**。 |
| S5 | 中 | **成立** | 本仓：§9.1/§9.3 一律以**符号名**登记，不复制过时硬行号。release 仓：**已由主控在 `f41ebe51` 修正**（移除过时的 `main.py:2084`、`4070-4080` 硬行号，改为「行号随批次漂移，勿硬取」）。 |
| S6 | 低 | **成立** | release 仓：**已由主控在 `f41ebe51` 修正**（`git reset --hard` 回退补注「须经用户确认，且仅限本批未提交改动」）。本仓无对应文档改动。 |

- 本记录仅登记**判定、处理与实测现状**；release 仓的 S1/S4/S5/S6 修正均由**主控/并发 worker** 完成，不计入本仓交付。
- S2 是本仓唯一实际修正项；其余条目本仓仅做**台账侧一致性处理**（去引用、去过时行号、如实记录非等价迁移）。
- 复核方式：对目标仓仅执行只读 `git show` / `git log` / `git grep`。行号偏移分布经 `368ae249 → 69a24418`
  逐符号 AST 推算，得 `0×27、-5×12、-8×1、-18×1、-25×3、-35×6、+5×1`（可测 51/60），范围 **−35…+5**，与审核结论一致。
