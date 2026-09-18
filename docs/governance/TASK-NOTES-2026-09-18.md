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

- `/static/` 裸目录 404：入口 `/` 仍 307 跳转 `/static/v2/projects.html`（实测 `/static/` = 404，`/static/v2/projects.html` = 200），用户已答复「ok」，可接受。
- 发布状态：仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- 唯一剩余硬前置：§2 的 `.git` 对象库内嵌二进制处置（P1，破坏性操作，须用户明确确认）。