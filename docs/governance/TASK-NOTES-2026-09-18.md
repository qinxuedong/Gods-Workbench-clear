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

## 2. Git 对象库内嵌二进制（P1，2026-09-19 已获用户授权、执行完成）

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

### 2.1 处置方案（破坏性操作；已于 2026-09-19 执行）

    git bundle create <仓库外备份路径> --all   # 建议先备份
    git for-each-ref --format="%(refname)" refs/copilot/ | ForEach-Object { git update-ref -d $_ }
    git reflog expire --expire=now --all
    git gc --prune=now

- 预期效果：`git rev-list --all --not master` 归零；`git count-objects -vH` 体积显著下降；`refs/copilot/checkpoints/**` 内 13 个二进制 blob 不再可达。
- 前置：确认 Copilot checkpoint 无保留价值；如需留档，先 `git bundle create` 备份到仓库之外。
- **前置已满足**：用户 2026-09-19 已**明确授权**，且已先建仓外完整 bundle 备份；本处置**已执行完成**，结果详见 §2.3。

### 2.2 卫生用例覆盖盲区

`tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets` 的 `ignored_dirs` 显式包含 `.git`（第 38 行），因此该用例只扫工作区文件、**不覆盖 git 对象库**。建议后续为卫生套件补一条「git 对象库零独占二进制」用例。

### 2.3 处置执行结果（2026-09-19，破坏性操作已获用户明确授权后执行）

用户于 2026-09-19 就「仍待人工裁决」四项全部下达裁决，并**明确授权执行本次 `.git` 内嵌二进制清理（破坏性操作）**。执行前后均在本洁净室仓 `D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear` 做只读实测：

| 项 | 实测值 | 来源命令 |
|---|---:|---|
| `refs/copilot/` 引用命中 | 0 | `git for-each-ref refs/copilot/` |
| 仅由非 master 引用可达的对象 | 0 行 | `git rev-list --objects --all --not master` |
| 完整性自检 | exit 0、无输出 | `git fsck --no-progress` |
| unreachable 对象 | 空 | `git fsck --unreachable` |
| count / size / in-pack / packs | 20 / 346 / 503 / 1 | `git count-objects -v` |
| size-pack / prune-packable / garbage | 24362 / 0 / 0 | `git count-objects -v` |
| **全库可达对象中含 NUL 的二进制 blob** | **仅 3 个，全部为白名单思源黑体** | 逐 blob 扫描 `git rev-list --objects --all` |
| 处置后 ref 集合 | 仅 `refs/heads/master` | `git for-each-ref` |

复核后保留的 3 个二进制 blob（`AGENTS.md` 白名单，本地运行期强依赖）：

| 路径 | 字节数 |
|---|---:|
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf` | 9,036,076 |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf` | 8,812,324 |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf` | 8,806,392 |

处置前的仓外完整备份（**先备份、后清理**）：

| 项 | 值 | 来源命令 |
|---|---|---|
| bundle 路径（仓库之外） | `C:\Users\qinxuedong\AppData\Local\Temp\godswb-clear-all-20260919-220743.bundle` | `git bundle create` |
| 文件大小 | 25,127,364 字节 | 文件系统 stat |
| SHA-256 | `8000090F9B64C3B75AE30D734A4A1653829DE4D234F46D63B1D13A7A6ED9F9A2` | 文件哈希 |
| 完整性验证 | `git bundle verify` 输出 `is okay` | `git bundle verify` |
| 含 ref 数 | 18（16 个 `refs/copilot/checkpoints/**` + `refs/heads/master` + `HEAD`），记录为 complete history | `git bundle verify` |

- 执行为「**已获用户明确授权 + 已建仓外完整 bundle 备份**」两项前置同时满足下进行；处置后 `refs/copilot/checkpoints/**` 内 13 个受限二进制 blob 不再可达，全库可达对象中除 3 个白名单 `.otf` 外无其它含 NUL 的二进制 blob。
- **证据边界**：以上均为**本地 `.git` 对象库实测**（只读命令 + 文件哈希）；洁净室仓**未 push、未跑远端 CI、未做生产验收**，不得据此外推为发布就绪。§2.2 所述卫生用例 `ignored_dirs` 仍忽略 `.git` 的盲区**依然存在**，建议另立任务补用例。

---

## 3. V2 命名基线

- 事实：用户自有 V2 前端 `src/gods_workbench/static/v2/workshop.html` 标题为「影视工坊 · Gods' Workbench v2」，页面内不含 `god-canvas` 字符串；两个失败断言沿用占位页时代的 `god-canvas` 字符串，属迁移断言未同步。
- 原失败断言：
  - `tests/contracts/test_projects_hub_service.py:117`：`assert "god-canvas" in resp_workshop.text`
  - `tests/smoke/test_production_smoke.py:55`：`assert "god-canvas" in resp_workshop.text`
- 用户裁决：**改断言为「影视工坊」**（方案 A，仅改测试层，前端零改动）。
- 现状：已由另一位负责人落地，两处断言现均为 `assert "影视工坊" in resp_workshop.text`（行号不变：117 / 55）。

---

## 4. 旧集成标记用例（专项，2026-09-19 已完成）

`tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers`（第 72 行起）的 `forbidden_markers` 基线需按「V2 为保留前端」重定义。**以下为重定义前的原基线状态（历史记录，已由 §4.1 完成重定义）：**

- 原基线把 `lucide`、`runninghub`、`comfyui`、`settings.html`、`asset-manager.html`、`unsplash.com`、`window.v2projects` 等一并列为禁用标记，导致静态层大量误报（实测超 100 处命中）。
- 按 V2 保留口径，`lucide`（CDN 图标）、V2 页面自有业务标识等应从禁用清单中剔除或白名单化；真正的「旧版经典集成」标记需重新界定。
- 本项已由用户 2026-09-19 裁决授权并落地，**完成明细见 §4.1**（基线重定义提交 `28c23bf`、快捷工具与画布内页移除提交 `996c3ba`）。

### 4.1 T13 完成节（2026-09-19）

用户 2026-09-19 裁决：V2 前端**整体保留**；画布/工具**只保留“入口首页”内容**，快捷工具入口及其内部内容不迁移。据此分两个本地提交落地：

| 项 | 内容 | 提交 |
|---|---|---|
| 卫生用例基线重定义 | 重定义 `tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers` 的 `forbidden_markers` | `28c23bf` |
| 快捷工具与画布内页移除 | 删除快捷工具/画布内页并剪除 V2 storyboard 入口 | `996c3ba` |

**基线重定义口径（为什么原基线是误报）**：原 `forbidden_markers` 把一批**V2 保留前端的合法标识**与真正的“旧版经典集成”红线混在一起，导致静态层 130+ 处误报。按“V2 整体保留”口径：

- **移除的合法标识**（不再视为禁用标记）：`storyboard.html` / `production.html` / `agents.html` / `collab.html` / `settings.html`（V2 页面互链）、`lucide`（`AGENTS.md` 授权的 CDN 图标库）、`unsplash.com`、`window.V2Projects`、`asset-manager.html` / `comfyui` / `runninghub`（V2 链路仍在使用）。
- **保留/新增的真正红线**（以 `/static/` 前缀精确匹配，避免误伤 `v2/*.html`）：`/static/home.html`、`/static/index.html`、`/static/gpt-chat.html`、`/static/project-board.html`、`/static/settings.html`、`chrome-local`。

**删除的快捷工具入口与画布内页**（`996c3ba`，共 36 个文件）：

| 类别 | 清单 |
|---|---|
| 快捷工具 6 页 | `zimage` / `online` / `klein` / `enhance` / `angle` / `video` 的 `.html` |
| 画布内页 2 页 | `canvas.html`、`smart-canvas.html` |
| 连带专属资源 28 个 | `css/{canvas-tools,canvas,smart-canvas}.css`；`js/{canvas,smart-canvas,video,image-preview,history-bulk-manager,generator-touchbar-context,ltx-director-timeline}.js`；`js/canvas/` 全部 18 个模块 |

**同步剪除引用**：`v2/storyboard.html` 移除“快捷工具”rail 分组、6 个 `data-canvas-tool` 按钮、`openCanvasToolPage()` 及其清尾调用（保留“全局画布”分组）；`js/canvas-list.js` 仅保留 `canvas-open` postMessage；`js/asset-manager.js` 删除无调用点的 `canvasAssetOpenUrl()` 及指向 `canvas.html` 的锚点。`canvas-list.html` 作为 V2 storyboard“全局画布”入口保留。

**门禁实测（本地）**：

| 项 | 结果 | 来源命令 |
|---|---|---|
| 全量测试 | **40 passed**（此前唯一失败用例已转绿） | `python -m pytest -q --no-header -p no:cacheprovider` |
| 该卫生用例定向 | 6 passed | `python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q` |
| JS 语法检查 | 0 失败（全仓 `.js`） | `node --check` |
| 保留页面坏链扫描 | 0 | 坏链扫描脚本 |
| 删除页残留引用扫描 | 0 | 残留引用扫描脚本 |

- 变更记录另见 `docs/migration/T13-QUICK-TOOL-REMOVAL-2026-09-19.md`（`996c3ba` 内）。
- **证据边界**：以上均为**本地门禁与本地提交**（`28c23bf` / `996c3ba`）；**未 push、未跑远端 CI、未做生产验收**。

---

## 5. 测试基线

命令统一为：`python -m pytest -q --no-header -p no:cacheprovider`。

| 时点 | 结果 | 说明 | 依据提交 |
|---|---:|---|---|
| **当前（2026-09-19）** | **40 passed / 0 failed** | T13 落地后全量转绿 | `28c23bf` + `996c3ba`（本地提交） |
| 历史 | 1 failed / 39 passed | 唯一失败为 §4 旧集成标记用例基线问题 | T13 前 |
| 历史 | 5 failed / 35 passed | 含二进制残留与命名断言失败 | 二进制清理前 |
| 基线仓对照 | 32 passed | 基线 `HEAD = abd0e88` 解包后 | 前序治理记录实测 |

- **当前实测（2026-09-19）**：`python -m pytest -q --no-header -p no:cacheprovider` = **40 passed**；此前唯一失败用例 `tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers` 已随 §4.1 基线重定义转绿。
- **沿革**：修复前基线为 5 failed / 35 passed；二进制清理 + 白名单 + 命名断言落地后收敛为 1 failed / 39 passed；T13 重定义旧集成标记基线并移除快捷工具内页后收敛为 **40 passed / 0 failed**。
- **证据边界**：以上均为**本地门禁**结果；**未 push、未跑远端 CI、未做生产验收**，不等于生产就绪。

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
- 唯一剩余硬前置：§2 的 `.git` 对象库内嵌二进制处置（P1，破坏性操作，须用户明确确认）——**已于 2026-09-19 获用户明确授权并执行完成（T12，见 §2）**。

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

### 9.10 Phase E 进度（2026-09-19 滚动更新）

> 口径：实施仓 `D:\Working\Code Pro\Gods-Workbench-release`（分支 `main`），
> 只读 `git log` / `git show <rev>:main.py` / 本地门禁命令取证。**未 push、未跑远端 CI**。

**已完成的本地提交（均未 push）**

| 批次 | 内容 | 提交 |
|---|---|---|
| E0 | 路由身份快照门禁（394 行 / 9 用例，零行为变更） | `ba32e1c9` |
| 勘察 | `docs/architecture/MAIN-PY-PHASE-E-RECON.md`（含 E0–E10 方案） | `25216c1b` |
| E1 | 更新域装配入口 → `app_runtime/routers/assembly.py`；main 内 `include_router` 43 → 42 | `2896db12` |
| E2 | shell/media 域 4 条 → `app_runtime/routers/shell_media.py` | `f04334fb`（测试补齐 `987d3442`） |
| E3 | 本地资产 / 素材库域 30 条 → `app_runtime/routers/local_assets.py` | `847fad0d` |
| E4 | 生成 / 任务提交域 25 条 → `app_runtime/routers/generation.py` | `00bf6492` |
| E5 | 工作流导入 / 导出域 5 条 → `app_runtime/routers/workflows.py` | `a94af7f1` |
| E6 | 对话 / 历史域 7 条 → `app_runtime/routers/chat.py` | `5db98092` |
| E7 | 外部集成域 24 条 → `app_runtime/routers/integrations.py` | `5c377a77` |

表中 `25216c1b` 为 E0 后的**勘察**提交（`MAIN-PY-PHASE-E-RECON.md`），非实现批次；E2 行为实现提交 `f04334fb` + 测试补齐 `987d3442`。

**覆盖度**：95/95 条原地 `@app.*` 路由实现体已全部迁出；`main.py` 只保留同名薄包装
（装饰器 + 原签名 + 单条纯委托）。`main.py` 规模：20583 行（Phase D 收口）→ **16782 行 / 741731 B**（E7 后）。

**冻结不变量（E1–E7 各批实测不变）**

| 项 | 冻结值 |
|---|---|
| 路由身份 | **361** 条 / SHA-256 `eb79bd54285dec1175630683737285da7f00ae5f0c6d39eb89483e9b30ff900a` |
| OpenAPI（CRLF+UTF-8） | **579853 B** / SHA-256 `48c4cf7d285c537e763083317d2d7a4451de928aa48076ec98fa189b94df7cac` |
| routes / paths / schemas | 146 / 288 / 181 |
| `main.app.router.dependencies` 长度 | 1（`Depends(authorize_http_request)`） |
| 路由类型分布 | `APIRoute=95 / APIWebSocketRoute=1 / Mount=3 / Route=4 / _IncludedRouter=43`，合计 146 |
| `include_router` 调用 | main.py 42 + `assembly.py` 1 = 43 |

**门禁证据（本地）**

- 三项契约门禁 `python tools/{check_openapi_contract,check_provider_contract,route_permissions}.py --check` 均 exit 0。
- 门禁批次（E0/E1–E6 + 路由/权限/OpenAPI 契约）`pytest`：**170 passed / 731 subtests**。
- 含 E7 新门禁的完整 Phase E 批次 `pytest`：**179 passed / 878 subtests**（2026-09-19 主控实测复核）。
- E7 定向：新门禁 `tests/test_phase_e7_integrations_extraction.py` **9 passed / 147 subtests**；
  定向回归（jimeng / codex / runninghub / task-center / log / generation）**116 passed / 44 subtests**。
- 全量 `pytest -q`：**8 failed / 2630 passed / 274 skipped / 3476 subtests**。
  其中 **7 条为 Phase D 起即有、各批无关的 static 前端/元数据契约失败**；
  另 **1 条 `test_asset_thumbnail_cache::test_non_mp4_video_is_transcoded_and_cached` 为本机 PATH 无 `ffmpeg` 所致**
  （本机已装 ffmpeg 但不在 PATH；将其 bin 目录加入 PATH 后该测试 **21 passed**，代码路径与 HEAD 逐字节相同）。

**已获授权、实施中项（用户 2026-09-19 裁决）**

- **E8 / E9 / E10**：43 处 `include_router` 收敛进 `assembly.py`。会改变注册顺序与路由类型分布
  （预期 `APIRoute` 95→91、`_IncludedRouter` 43→44、合计 146→143），
  且 `tests/test_phase_e_route_identity_gate.py:82-84`、`tests/test_phase_e1_update_domain_assembly.py:108-117`
  已把「main=42 / assembly=1 / 合计=43」与「assembly 内 `include_router` 恰 1 次」钉死；**用户已于 2026-09-19 授权重新基线冻结不变量**。
- **Phase F / G**：生命周期 / WebSocket / 全局协程 / 画布 CAS / `create_app()` 收敛；**已获用户授权、实施中（release 仓）**。

**独立复核（2026-09-19，主控对抗复核）**

- 还原基线：`git show 5c377a77~1:main.py` 与新 `app_runtime/routers/integrations.py` 逐函数比对。
- 24/24 条 integrations 实现体 AST 等价（剥离装饰器 + `_resolve_dependency('X')`→X 归一化）：**MISMATCH: []**。
- 24 条同名薄包装装饰器与签名对基线 **0 差异**；4 条同源路由保留真实 `ensure_same_origin_request(request)`；
  `open_registry_asset_locally` 保留 `request_principal` + `{admin,editor}` + 403。
- 冻结不变量主控独立复算命中：路由 361 / `eb79bd54…900a`；OpenAPI 579853 B / `48c4cf7d…7cac`；deps 长度 1；
  路由类型 `APIRoute=95 / APIWebSocketRoute=1 / Mount=3 / Route=4 / _IncludedRouter=43` = 146。
- 全量 `pytest -q` 主控复现：**8 failed / 2630 passed / 274 skipped / 3476 subtests passed**，8 条失败与 §9.10 归因逐条一致
  （7 条 static 契约失败文件自 Phase D/E 各批均未被改动；1 条 ffmpeg 缺失，加入其 bin 目录后该测试 **21 passed**）。
- 限制说明：代理服务本会话多次返回 `completed: null`（Reality Checker / worker 均如此），故本轮独立复核由主控本人执行并留痕。

**证据边界**：以上全部为**本地**门禁与本地提交证据；**未 push、未跑远端 CI、未做生产验收**，
不得据此外推为发布就绪。

### 9.11 用户裁决：重新基线冻结不变量 + Phase F/G 开工（2026-09-19）

用户于 **2026-09-19** 就「仍待人工裁决」的四项全部下达裁决，其中与 T11 相关的三项：

| 裁决项 | 裁决内容 | 影响 |
|---|---|---|
| **重新基线冻结不变量** | **授权**：允许在收敛后重新计算并更新冻结值（含 `.git` 对象库清理后路由/OpenAPI 冻结值的复算，以及 `main=42 / assembly=1 / 合计=43` 断言的重算） | §9.10 中「E8–E10 与 Phase F/G 待人工裁决」改为「已获授权」 |
| **E8–E10** | **授权**：43 处 `include_router` 收敛 | 改动 `main.py` `include_router` 42 与 `app_runtime/routers/assembly.py` 1，注册顺序与路由类型分布按预期变化（`APIRoute` 95 → 91、`_IncludedRouter` 43 → 44、合计 146 → 143） |
| **Phase F** | **授权**：生命周期 / WebSocket / 全局协程 / 画布 CAS 的机械拆分 | 高风险机械拆分 + 画布 CAS 资源桥接 |
| **Phase G** | **授权**：`main.py` 收敛为 `create_app()` 兼容入口（含 `main:app` 调用方迁移、Dockerfile 与启动脚本） | 收敛前须完成 `main:app` 调用方检索与迁移 |

- **实施归属**：以上 E8–E10 / Phase F / Phase G 均在 **release 仓** `D:\Working\Code Pro\Gods-Workbench-release`（分支 `main`）实施，本洁净室仓**只记台账**，不改 release 仓任何文件。
- **状态**：截至本记录（2026-09-19），上述三项在本仓台账中标记为「**已获用户授权、实施中**」。
- **证据边界**：本记录只登记**裁决事实与日期**；E8–E10 / Phase F / Phase G 的**实现完成度、门禁结果**以 release 仓在实施后的实测为准，**
  未完成前不得据本裁决宣称已完成或生产就绪**。

### 9.12 Phase E8–E10 / Phase F / Phase G 完成记录（2026-09-20，滚动更新）

> 实施归属：以下全部在 **release 仓** `D:\Working\Code Pro\Gods-Workbench-release`（分支 `main`）落地；
> 本洁净室仓只记台账，未改 release 仓任何文件。基线：`a640557b` 之前为 Phase E7（`5c377a77`）。

| 批次 | 提交 | 内容 | 门禁实测 |
|---|---|---|---|
| E8 | `a9f223f2` | registry 域 7 处 `include_router` 收敛 | 三项 `--check` exit 0；不变量命中 |
| E9 | `16926f81` | canvas 域 11 处 `include_router` 收敛 | 同上 |
| E10 | `1bd5bcf6` | 剩余 24 处 `include_router` 收敛；`main.py` `include_router` 归零 | Phase E 全批 212 passed / 962 subtests |
| F1 | `497db84b` | `ConnectionManager` 机械迁移到 `app_runtime/runtime/websocket_manager.py`（main 保留兼容子类 + `_namespace()` 晚绑定） | 新增 6 用例；不变量命中 |
| F2 | `03f81f54` | `app_lifespan` / `startup_event` / `_run_startup_maintenance` / `_schedule_global_coroutine` 迁移到 `app_runtime/runtime/lifecycle.py`（main 保留同名薄委托 + `lambda: globals()` 命名空间） | 新增 13 用例；243 passed / 962 subtests |
| F3 | `8043ac4a` | F2 明确延后的 5 个关闭 / 派生派发辅助符号（`_mark_asset_index_derived_dispatch_unresolved`、`_asset_index_clean_shutdown_allowed`、`_asset_registry_lifecycle_is_closing`、`_drain_asset_registry_tasks_for_shutdown`、`_continue_derived_dispatch_after_completion`）迁移到同一模块 | 新增 12 用例；243 passed / 962 subtests |
| G | `0d607c97` | 按勘察报告 `_g1/RECON.md` §4.2 方案 A 引入 `create_app()`；只包「app 对象 + 4 中间件 + `app.state.allowed_origins`」，`app = create_app()` 保持模块级 | 新增 7 用例；真实 `uvicorn "main:app"` 冒烟 `/health/live` → 200；290 passed / 962 subtests |

**冻结不变量（E10 → G，逐批零漂移，实测）**：
- 路由身份 **361** 条 / SHA-256 `eb79bd54285dec1175630683737285da7f00ae5f0c6d39eb89483e9b30ff900a`；
- 路由类型分布 APIRoute=95 / APIWebSocketRoute=1 / Mount=3 / Route=4 / _IncludedRouter=43 = **146**；
- `app.router.dependencies` 长度 **1**（`authorize_http_request`）；
- OpenAPI **579853 B** / SHA-256 `48c4cf7d285c537e763083317d2d7a4451de928aa48076ec98fa189b94df7cac`；paths 288 / schemas 181；
- mount 集合 `{/static, /output, /assets}`；首个 websocket `/ws/stats`；
- 顺序指纹（`_e9/fingerprint.py`）四段全部与 `_e10/fp_f1.json` 一致。

**证据边界**：以上均为**本地**门禁与**本地**提交；**未 push、未跑远端 CI、未做生产验收**，不等于生产就绪。
全量 `pytest -q` 在本机为 **2670 passed / 271 skipped / 3476 subtests / 7 failed**；7 条失败均为**既有、与本拆分无关**的
静态前端契约用例（`test_episode_pipeline_frontend_contract` / `test_floating_window_frontend_contract` /
`test_gw045_topbar_contract`×2 / `test_m3_asset_manager_module_contract` / `test_release_metadata` /
`test_signal_flow_design_system_contract`），经核实**均不 import `main`**，且 E10 以来 `git diff` 未触及 `static/` 或这些测试文件。

**Phase F 批次边界说明**：`CANVAS_CAS_DEPENDENCIES.canvas_lock=CANVAS_LOCK` 与
`CANVAS_REFERENCE_API_DEPENDENCIES.canvas_lock=lambda: CANVAS_LOCK` 是两种**不可互换**的绑定语义
（早绑定快照 vs 晚绑定），已实测确认；本轮 F 批**未**改动画布 CAS 资源桥接实现体（`main.py` 15 处
`with CANVAS_LOCK` 与 `asset_registry/canvas_engine/**` 的 `import main` 桥接保持原样），
「统一两种绑定形态」属需用户显式授权的独立批次，不在本批范围。详见 `_f3/RECON.md`。

### 9.13 T12/T13 与 Phase E8–G 最终状态回填（2026-09-20）

- **T12 已完成**（2026-09-19 获用户明确授权后执行，破坏性）：仓外完整 bundle 备份`C:\Users\qinxuedong\AppData\Local\Temp\godswb-clear-all-20260919-220743.bundle`（25,127,364 字节 / SHA-256 `8000090F…9F9A2` / `git bundle verify` = `is okay` / 含 18 个 ref）；引用清理后全仓仅剩 3 个白名单 `.otf`。洁净室仓提交：`7643fd6` 之前为 `abd0e88`。详见 §2。
- **T13 已完成**：本地提交 `28c23bf` + `996c3ba`（旧集成标记卫生用例基线重定义 + 移除快捷工具/画布内页）；全量 `pytest` **40 passed**（本地）。详见 §4.1。
- **Phase E8–E10 / F / G 已完成**（实施在 release 仓 `D:\Working\Code Pro\Gods-Workbench-release`，本仓只记台账）：E8 `a9f223f2`、E9 `16926f81`、E10 `1bd5bcf6`、F1 `497db84b`、F2 `03f81f54`、F3 `8043ac4a`、G `0d607c97`。详见 §9.12。
- **Phase G 最终形态**：采用**方案 A**，`main.py` 保留模块级 `app = create_app()`，**不切换** `uvicorn main:create_app --factory`；`main:app` 调用方**无需迁移**，旧「13 处待迁移清单」结论**作废**（回填见 §11.3）。
- **冻结不变量（release 仓实测命中）**：路由 361 条 / `eb79bd54285dec1175630683737285da7f00ae5f0c6d39eb89483e9b30ff900a`；OpenAPI 579853 B / `48c4cf7d285c537e763083317d2d7a4451de928aa48076ec98fa189b94df7cac`；routes/paths/schemas = 146/288/181；`main.app.router.dependencies` 长度 1。
- **证据边界**：以上均为**本地**门禁与**本地**提交；**未 push、未跑远端 CI、未做生产验收**，**不等于生产就绪**。

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
---

## 11. 「仍待您裁决」四项人工决策逐项解释（2026-09-19 裁决）

> 面向非深技术读者。四项均已于用户 2026-09-19 裁决中明确授权。
> **重要前提**：以下所有数字都标注了来源命令/提交；**「本地门禁通过」不等于「生产就绪」**。
> 当前证据等级统一为：**本地门禁通过 / 本地提交 / 未 push / 未跑远端 CI / 未做生产验收**。

### 11.1 重新基线冻结不变量

**这一项到底是什么**：拆分 `main.py` 时，为了防止“越拆越乱”，先给整站拍了张“快照”——路由条数、OpenAPI 文档大小、启动依赖顺序等。任何一批拆分都必须让快照一模一样（否则说明 URL 或响应被改坏了）。但路由合并本身会**有意**改变路由计数，于是快照里的 `main=42 / assembly=1 / 合计=43` 这类断言必须“重新算一遍”。

**为什么当初必须人裁决**：重算基线 = 主动放弃一层“防退化”保护。只有人能确认“这组新数字确实是预期变化，而不是把 bug 一起算进基线”。

**不动它的后果**：E8–E10 无法开工；或者强行开工就会撞上写死的断言（`tests/test_phase_e_route_identity_gate.py` 第 82–84 行、`tests/test_phase_e1_update_domain_assembly.py` 第 108–117 行），门禁直接红。

**现在裁决后怎么做**：用户**已授权**重新基线；在 release 仓收敛后按新口径复算路由/OpenAPI 冻结值，并同步更新上述两处硬编码断言。

| 风险 | 回滚 | 证据边界 |
|---|---|---|
| 新基线“洗白”了非预期变化 | 基线值连同胞断言一起 `git revert` 回旧值，再重跑门禁 | 冻结值来源：release 仓 `tests/test_phase_e_route_identity_gate.py`（路由 361 / SHA-256 `eb79bd54…900a`；OpenAPI 579853 B / SHA-256 `48c4cf7d…7cac`），E1–E7 各批实测命中 |
| 两处断言口径不一致 | 以 `test_phase_e_route_identity_gate.py` 为单一真源，另一处对齐 | 建议改基线后**独立复算**，不采信实现者自述 |

### 11.2 Phase F（生命周期 / WebSocket / 全局协程 / 画布 CAS 的机械拆分）

**这一项到底是什么**：把 `main.py` 里“启动/关闭钩子（生命周期）”、“WebSocket 长连接”、“后台常驻任务（全局协程）”以及“画布并发控制（CAS）”这几类代码，**按原样**搬到独立模块。只搬位置，不改逻辑。

**为什么当初必须人裁决**：这几类的失败模式是“进程起来看着正常，但连接会静默掉线、并发下会互相覆盖”。不像普通接口那样改坏了立刻报错，所以需要人明确承担“允许动这块”的责任。

**不动它的后果**：`main.py` 继续背着最大块的“不可测”代码；后续 Phase G 无法收口（因为 `create_app()` 必须能重建这些资源）。

**现在裁决后怎么做**：用户**已授权** Phase F 开工；在 release 仓 `main` 分支实施。

| 风险 | 回滚 | 证据边界 |
|---|---|---|
| WebSocket 首个连接、心跳、断开行为发生变化 | 以“首个 websocket 路径 = `/ws/stats`”等冻结项做前后对比；异常则 `git revert` 该批提交 | 冻结项来源：release 仓路由身份快照（`main.app.router.dependencies` 长度 1；mount 集合 `{/static, /output, /assets}`；首个 websocket `/ws/stats`；无 `/api/speech`），均为 local 实测 |
| 全局协程被重复启动或未启动 | 启动日志 + 应用生命周期用例；异常即回滚 | 需在**独立审核**后才能标记完成（见 §9.8 / HANDOFF §5.4） |
| 画布 CAS 资源桥接改变并发语义 | 以并发热点用例回归；异常即回滚 | **尚未实测**：截至本记录 Phase F 未开工，无当前证据 |

### 11.3 Phase G（`main.py` 收敛为 `create_app()` 兼容入口）

**这一项到底是什么**：把 `main.py` 变成一个小小的“兼容外壳”——里面只有一个 `create_app()` 函数负责组装整个应用。原来的 `main.py` 顶部代码（应用实例、挂路由、依赖）全部搬进 `app_runtime/`。

**为什么当初必须人裁决**：外部启动方式（`main:app`、Dockerfile、启动脚本）都直接指向 `main.py`。收敛后如果漏改一处调用方，部署/启动就会**当场起不来**。

**不动它的后果**：拆分永远停在“半成品”——`main.py` 仍是巨型文件，Phase D/E/F 的模块化收益无法在启动层面兑现。

**现在裁决后怎么做（历史结论 + 2026-09-20 回填）**：用户**已授权** Phase G；当时**前置动作**结论是先完成 13 处 `main:app` 调用方的检索与迁移（含 Dockerfile 与启动脚本）——以下为**历史结论**。

> **最终事实（2026-09-20 回填）**：Phase G 已采用**方案 A**——`main.py` 保留模块级 `app = create_app()`，**不切换** `uvicorn main:create_app --factory`。因此 `main:app` 全部调用方**无需迁移**；上述「13 处待迁移清单」**已作废**（历史结论原文保留于此，不作无痕篡改）。

| 风险 | 回滚 | 证据边界 |
|---|---|---|
| 漏改 `main:app` 调用方导致启动失败 | `git revert` 收敛提交；`main:app` 旧路径仍可用 | 依据：HANDOFF §3 “收敛前必须先完成 13 处 `main:app` 调用方检索与迁移”；**该 13 处为待迁移清单，不是已迁移事实**（2026-09-20 回填：该历史结论**已作废**——Phase G 最终采用方案 A，`main.py` 保留模块级 `app = create_app()`，`main:app` 调用方**无需迁移**） |
| Dockerfile / 启动脚本与代码不一致 | 同步修改并做一次干净环境启动验证 | 需**未跑远端 CI、未做生产验收**，最终必须补独立审核 |
| 启动参数（host/port/workers）漂移 | 对照 Phase A 启动参数快照 | 快照来源：release 仓 Phase A 冻结（`eb9a4595` 等） |

### 11.4 T12（`.git` 内嵌二进制清理，破坏性）+ T13（旧集成标记卫生用例基线重定义）

**T12 是什么**：干净的是工作区，但 `.git` 对象库里还塞着一批旧的 checkpoint 二进制（图片/缩略图/字体）。T12 就是把这些 checkpoint 引用删掉、把仓库压缩（`git gc`），让那些二进制不再可达。

**T13 是什么**：一条卫生用例（`test_static_layer_has_no_legacy_integration_markers`）把一批 **V2 保留前端的合法标识**当成了“旧版集成痕迹”，导致 130+ 处误报。T13 就是按“V2 整体保留”口径重写这条用例的禁用标记清单，并移除不再迁移的快捷工具页。

**为什么当初必须人裁决**：
- T12 是**破坏性**操作：删引用 + `gc` 后，那些 checkpoint 历史就**不可恢复**（除非有备份）。这种操作必须人来承担。
- T13 属于“**放宽门禁**”：放宽守卫本身就是风险，必须人来确认“放掉的是误报，不是真红线”。

**不动它的后果**：
- T12 不动：`.git` 体积与受限二进制长期滞留，且现有卫生用例**忽略 `.git`**（`ignored_dirs` 含 `.git`），永远不会报警。
- T13 不动：全量门禁长期挂 1 条红（`1 failed / 39 passed`），后续每批都得人工解释“这条是已知失败”，守卫形同虚设。

**现在裁决后怎么做**：
- T12：用户**已明确授权**；**先建仓外完整 bundle 备份**，**再**删 `refs/copilot/checkpoints/**` + `gc`。已执行完毕，复核后仅剩 3 个白名单 `.otf`（详见 §2.3）。
- T13：用户**已授权**；已落地为两个本地提交 `28c23bf`（基线重定义）+ `996c3ba`（移除快捷工具/画布内页），详见 §4.1。

| 风险 | 回滚 | 证据边界 |
|---|---|---|
| T12 误删仍有价值的 checkpoint | **仓外 bundle** `C:\Users\qinxuedong\AppData\Local\Temp\godswb-clear-all-20260919-220743.bundle`（25,127,364 字节 / SHA-256 `8000090F…9F9A2` / `git bundle verify` = `is okay` / 含 18 个 ref）可完整还原 | 全部为本地 `.git` 只读实测：`git for-each-ref`、`git rev-list --objects --all --not master`、`git fsck --no-progress`、`git count-objects -v` |
| T12 清理后误以为“仓库已合规” | — | §2.2 盲区**仍在**：`test_phase6_deep_hygiene.py` 的 `ignored_dirs` 含 `.git`，不覆盖对象库 |
| T13 放宽后真红线被放过 | `git revert 28c23bf` 可恢复旧禁用清单 | 红线口径来源：`28c23bf` 提交信息与 diff（保留 `/static/home.html`、`/static/index.html`、`/static/gpt-chat.html`、`/static/project-board.html`、`/static/settings.html`、`chrome-local`，带 `/static/` 前缀精确匹配） |
| T13 删除页面后残留坏链 | `git revert 996c3ba` 可整体恢复 36 个文件 | 实测：`node --check` 0 失败；保留页面坏链扫描 0；删除页残留引用扫描 0；`pytest` 40 passed（均为**本地**门禁） |

---

**统一证据边界声明**：本节四项的数字分别来自**本地 `.git` 只读命令**、**本地提交 `28c23bf` / `996c3ba`**、**本地 `pytest` 40 passed**，以及 release 仓**已完成批次（E0–E7）的本地门禁记录**。全部**未 push、未跑远端 CI、未做生产验收**，**不得将本地门禁通过解读为生产就绪**。

### 11.5 第三轮用户裁决：画布 CAS 绑定统一 + 端口统一 2077（2026-09-20）

> 用户 2026-09-20 就两项治理口径作出裁决并授权执行；实施在 **release 仓** `D:\Working\Code Pro\Gods-Workbench-release`（分支 `main`），本洁净仓只记台账。原文（§11.2 / §11.3 历史结论）不改，此处追加口径。

**这一项到底是什么**
- **画布 CAS 绑定语义统一**：画布「乐观锁」（CAS）依赖里有一个“拿并发锁”的出口，历史上存在两种写法——
  **早绑定值快照**（`canvas_lock=CANVAS_LOCK`，导入时就把锁对象烤进去）与 **晚绑定调用式**（`canvas_lock=lambda: CANVAS_LOCK`，调用时才解析）。
  两种写法并存会让「测试里用 `patch.object(main,"CANVAS_LOCK", ...)` 换锁」只对一部分依赖生效，属于隐蔽不一致。本轮**统一为晚绑定调用式**。
- **端口统一 2077**：同一应用历史上写死了三套端口口径——`main.py` 默认 3000、`Dockerfile`/Compose/CI 3333、洁净仓 `AGENTS.md` 要求 2077。
  用户裁决统一为 **2077**，终结三处并存。

**为什么当初必须人裁决**
- CAS 绑定统一会触碰并发控制的绑定面；若把晚绑定反向改成值快照，会让 `patch.object(main,"CANVAS_LOCK")` 失效（测试/运行期替换被静默忽略），属高风险语义变更，必须由人拍板方向。
- 端口变更会牵动启动脚本、容器、CI、健康检查、浏览器插件与用户文档，暴露面广，须人来承担“统一到哪个值”的责任。

**现在裁决后怎么做（已完成）**
- CAS：统一为**晚绑定调用式**；release 提交 `40ab81cb`（7 文件）。独立审核代理 **V1** 复核 **PASS**（8/8 ACCEPT，含 `patch.object` 动态端到端）。
- 端口：统一为 **2077**；release 提交 `8b85d4c5`（载体同步）+ `006f3ddc`（根级设计文档更正注记）。独立审核代理 **V2** 复核 **PASS**。
- 冻结不变量零漂移：路由身份 361 / `eb79bd54285dec1175630683737285da7f00ae5f0c6d39eb89483e9b30ff900a`；OpenAPI 579853 B / `48c4cf7d285c537e763083317d2d7a4451de928aa48076ec98fa189b94df7cac`；`main.app.router.dependencies` 长度 1。

| 风险 | 回滚 | 证据边界 |
|---|---|---|
| CAS 反向绑定导致 `patch.object` 失效 | `git revert 40ab81cb` | V1 独立实测：patch 后 reference/attach/cas/lifecycle 四处 `canvas_lock()` 均返回新锁 |
| 端口漂移导致启动/健康检查不一致 | `git revert 8b85d4c5` | V2 独立残留扫描：当前有效载体无 3000/3333 残留 |
| 端口改动引入路由/契约漂移 | 同上 | 两项提交后不变量逐字节零漂移（361 / 579853 B / deps 1） |

**独立审核**
- 本轮子代理内置 `spawn_agent` 未注册，改用本机 `codex exec`（Codex 自身）起**两个独立审核进程**：**V1**（CAS）/ **V2**（端口），均 **PASS**（各 8/8 ACCEPT）。
- 全量 `pytest -q`（release 仓，本地复跑）：**2677 passed / 271 skipped / 3476 subtests / 7 failed**；7 条失败均为与本次改动无关的既有 static 前端契约失败。

> **证据边界**：以上均为**本地**门禁、**本地**提交与**本地**只读复核；**未 push、未跑远端 CI、未做生产验收**。
> 剩余**只能由用户拍板**的项：是否 push / 跑远端 CI / 做生产验收。

