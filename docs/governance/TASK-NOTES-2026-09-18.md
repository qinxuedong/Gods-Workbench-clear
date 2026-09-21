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


## 12. 2026-09-20 范围口径统一与 comfyui/runninghub 移除

> 本节为**追加记录**，不改写 §1–§11 任何历史章节。

### 12.1 用户四条裁决

1. **开源字体放行 + 修复文档漂移**：3 个思源黑体 Source Han Sans CN（Bold / Medium / Normal，OFL-1.1）为开源字体，按 `AGENTS.md` §1.2 三条**精确路径**列入唯一二进制白名单；`CLEANROOM-CHARTER.md`、`CLEANROOM-STATUS.md` 等处“不得提交字体”的过时表述已更正为「除 `AGENTS.md` §1.2 三条精确路径白名单外禁止任何字体」。
2. **迁移范围**：`src/gods_workbench/static/v2/**` **整体保留**；画布/工具**只保留“入口首页”内容**；**快捷工具入口及其内部内容不迁移**；**comfyui / runninghub 不迁移**。
3. **P3 标签更新**：`HANDOFF.md` §1 的「当前 `main.py`」标签由历史 HEAD `0d607c97` 更新为当前 release HEAD `006f3ddce51cd1c022c51f2b963f91380cee6072`（`main.py` 732947 B / SHA-256 `c54f368a48cd0123a74733d3b0423eebabe7cf9f7e3af98522ff3ed0fee8e89a`），历史快照按「历史记录不改写 + 追加注记」保留。
4. **交接文档**：`HANDOFF.md` 标记完成；新建 `HANDOFF-2.md` 记录本轮新内容并给出文档路径索引。

### 12.2 来源分类口径统一（四类）

重写 `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md` 为四类归属：
- ① **用户自有原创切片**（仅 2 个日期选择器，源/目标 SHA-256 已登记并复核 MATCH）
- ② **按契约/夹具自行重写**（项目中心、画布、智能画布业务实现等）
- ③ **第三方资产**（`vendor/**`、`prompt-registry/**`，注明许可）
- ④ **隔离 / 不迁移**（无限画布旧实现、连接器、comfyui、runninghub 等）

新建 `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md`：对 `src/gods_workbench/static/**` **逐文件**清点（相对路径 + 字节数 + 四类归属 + 依据），并汇总计数（工作树现存 109 文件 / 3520 万字节级）。

### 12.3 comfyui / runninghub 移除

- **删除文件**：`static/comfyui-settings.html`、`static/css/comfyui-settings.css`、`static/js/comfyui-settings.js`、`static/js/i18n/comfyui-settings.js`、`static/runninghub/api_providers.json`（备份于 `%TEMP%\gw-scope-purge-20260920\`）。
- **清理实现**：`static/js/api-settings.js`、`static/api-settings.html`、`static/css/{api-settings,signal-flow,obsidian-gold-settings,theme}.css`、`static/js/{episode-pipeline,task-center,floating-dismissal}.js`、i18n 5 文件等移除 RunningHub / ComfyUI 专属实现与调用。
- **共用类改名（不保留 rh- 前缀）**：`.rh-key-item` / `.rh-key-head` / `.rh-key-title` / `.rh-key-desc` / `.rh-card-title-field` / `.onboarding-rh-*` 被 Volcengine / 即梦 CLI / AI Platform CLI / Antigravity / ModelScope 面板共用，因此**不能删除**；但 `rh-` 前缀源自 RunningHub 语义，本轮统一**改名为中性名**：`.provider-key-item` / `.provider-key-head` / `.provider-key-title` / `.provider-key-desc` / `.provider-card-title-field` / `.onboarding-provider-*`，并同步 `api-settings.html` 与 `api-settings.js` 的 class 引用（HTML/JS/CSS 三处一致，脚本已校验“无用到未定义类”）。RunningHub 专属类（`.rh-paste-input`、`.rh-card-*`、`.rh-config-card`、`.rh-thumb`、`.rh-empty`、`.rh-workflow-editor-*`、`.rh-preview-*`、`.rh-node-popover` 等）已随规则一并移除。
- **卫生用例收紧**：`tests/hygiene/test_cleanroom_hygiene.py` 不再把 comfyui / runninghub 列为放行，新增“已删文件不得重现、保留页面不得引用已删路径”断言。

### 12.4 证据边界

- 以上均为**本地工作树**实测与本地文档登记。
- **未 push、未跑远端 CI、未做生产验收**；`D:\Working\Code Pro\Gods-Workbench-release` 全程只读。
- 洁净仓当前仍为 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。

### 12.5 T-prov 实测补充（2026-09-20）

- 四类来源口径与 `CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`、`STATIC-SCOPE-REGISTRY-2026-09-20.md` 对齐：① 2 个日期选择器；② 契约/夹具自行重写；③ `vendor/**` 与 `prompt-registry/**` 第三方；④ 无限画布旧实现、连接器、comfyui、runninghub 隔离/不迁移。
- 静态层本次工作树实测：108 个现存文件、35,024,949 字节；类别计数为 ① 2 / 10,385 字节，② 90 / 4,266,643 字节，③ 15 / 30,723,433 字节，④ 1 / 24,488 字节。`git ls-files` 共 113 条，其中 5 条 comfyui/runninghub 路径已从工作树移除，不计入现存字节汇总。
- 日期选择器目标文件实测 SHA-256 与 `AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 一致；旧 SHA/字节/行数仅作历史快照，不覆盖本轮实测。
- 本补充仅追加，不改写 §1–§12.4；未执行 git add、git commit、git push、git remote，未执行远端 CI 或生产验收。

### 12.6 修正注记：静态层字节汇总（2026-09-20）

§12.5 记录的静态层汇总「108 个现存文件、35,024,949 字节」为**当时快照**；随后本轮 4 个 CSS 文件完成 comfyui/runninghub 规则清理与共用类改名（`.rh-*` → `.provider-key-*` / `.provider-card-title-field` / `.onboarding-provider-*`），字节数已变化。

- **当前实测（`Get-ChildItem -Recurse -File src/gods_workbench/static`）**：108 个文件 / **35,041,179 字节**。
- 与 `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md` 的合计行 **108 / 35041179** 一致；类别计数不变：① 2（10,385 字节）、② 90（4,282,873 字节）、③ 15（30,723,433 字节）、④ 1（24,488 字节）。
- 本注记为**追加更正**，不改写 §12.1–§12.5 任何一行；历史快照数字保留在 §12.5 中并以此注记覆盖其时效。

### 12.7 远端 CI 失败根因与修复（2026-09-20）

- **现象**：GitHub Actions run `35508749903` / `35508682089` 在「运行全量测试」失败，`2 failed, 38 passed`。
- **失败用例**：`tests/hygiene/test_cleanroom_hygiene.py::test_accepted_non_canvas_slices_match_migration_manifest`、`::test_phase2_input_hashes_match_current_files`。
- **根因（实证）**：`PHASE-2-INPUT-SHA256.txt` 与本轮前的 `AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 的登记哈希绑定 **Windows CRLF 原始字节**；Linux CI 检出为 **LF**，同一文件字节不同。CI 报错值 `b0765218…` / `1ae7a240…` / `1ca8a32…` 恰等于 git blob（LF）哈希，证明差异 100% 来自行尾。
- **修复**：① `tests/hygiene/test_cleanroom_hygiene.py` 新增 `_canonical_sha256()`（CRLF/CR→LF 归一），两处哈希断言改为行尾无关；② 16 条输入哈希 + 2 条迁移目标哈希重算为 LF 归一值；③ 新增 `.gitattributes`（`* text=auto eol=lf` + 二进制标记）。
- **本轮实测**：Windows 工作树 `python -m pytest -q --no-header -p no:cacheprovider` → **40 passed**；全树 LF 仿真 → **40 passed**；`node --check` 56/56；二进制白名单违规 0（仅 3 个 `.otf`）。
- **边界**：以上均为**本地**证据；**未 push、未跑远端 CI、未做生产验收**（以实际 GitHub Actions run 为准）。仓库仍为 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。
- **同轮 Phase 3 契约修正**：`restore_canvas` / `import_canvas_workflow` 的 `expected_version` 改必填 integer 并强制 CAS；`run_smart_canvas_task` 收敛为仅 202 + `poll_hint: string`；契约 version → `remediation-2`。详见 `attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md` 修正后重签（R2）。
- **本注记为追加**，不改写 §1–§12.6 任何一行。


## 13. Phase 4：发布门禁推进（2026-09-20/21，滚动更新）

> 本节仅追加，不改写 §1–§12.7 任何一行。工作目录：洁净仓根；基线提交 `c2d3758`（本地 == `origin/master`）。
> 任务书：`docs/governance/AGENT-TASK-2026-09-20-PHASE4.md`。

### 13.1 起点（HANDOFF-3 的三个未闭环项）

`HANDOFF-3.md` §6 列明未闭环：**真实外部 IdP / 许可证最终结论 / 运行时部署证据**。本轮针对前两项与证据链推进，第三项（生产验收）明确**不在本轮范围**。

### 13.2 分派与产物

| 任务 | 负责人 | 产物 | 结果 |
|---|---|---|---|
| P4-A2 外部 IdP 影子校验 | 代理 A2 | `src/gods_workbench/core/oidc.py`、`tests/contracts/test_oidc_verifier.py`、`requirements.txt`(+`cryptography>=42,<47`)、`T-oidc-shadow.md` | 完成；23 条专测 |
| P4-A3 治理文档漂移 + 部署可复现证据 | 代理 A3 | 两份治理文档追加章节、`T-deploy-repro.md` | 完成；沙箱内安装失败，主代理复跑成功（见 §13.4） |
| P4-A1 依赖锁与 SBOM | 代理 A1 | `requirements.lock`、`docs/provenance/SBOM-2026-09-20.cdx.json`、`T-lock-sbom.md` | **首版含不可复算数字，主代理重算重写** |
| P4-B1 独立对抗式终审 | 审核代理 B1 | `attestations/reviews/PHASE-4-INDEPENDENT-REVIEW-2026-09-20.md` | R1 不可提交 → 修正 → R2 本地可提交 |

### 13.3 门禁实测（主代理复跑）

- `python -m pytest -q --no-header -p no:cacheprovider` → **63 passed**（基线 40 + 新增 23）。
- `.js` 的 `node --check` → **56/56 通过**。
- 二进制红线扫描（跳过 `.git`）→ 违规 **0**，仅 3 个白名单 `.otf`。
- 治理文档追加性：`git diff --numstat` 删除列均为 **0**（纯追加）。
- 未新增根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。

### 13.4 干净环境安装实测（本轮证据升级）

在 `%TEMP%\gw-root-20260920\venv-clean`（CPython 3.11.9）实测：

- `pip install -r requirements-dev.txt` **成功**（30 包）；
- `pip check` → `No broken requirements found.`；
- `pytest` → **63 passed**。

**边界**：该干净环境按**区间约束**解析，**未按 `requirements.lock` 精确钉版本重装**；未在 Linux/容器复跑（Linux 闭包会额外含 `uvloop`）；无哈希锁、无 SBOM 签名与来源证明。

### 13.5 发现的真实缺陷与处置（重要）

代理 A1 首版 `requirements.lock` 与 SBOM **含有无法复算的推测版本**（如 certifi 2025.8.3 / cffi 2.0.0 / httptools 0.7.1 / idna 3.1 / pycparser 2.23 / Pygments 2.19.2），且 A1 明确登记其沙箱**无法执行 Python**。主代理据此：

1. 用 `pip list --format=freeze` + `importlib.metadata` 复算真实版本；
2. 新建干净 venv 实测安装，取得权威闭包；
3. 重写 `requirements.lock`（主表 30 条 = 干净 venv 实测；附表 31 条 = 本机快照）与 SBOM（39 组件 = 31 library + 7 file + 1 framework）；
4. 在 `T-lock-sbom.md` §7 保留「更正记录」，不掩盖首版错误。

另：审核代理 B1 在 R1 指出 3 处报告口径缺陷（`T-lock-sbom.md` 的「未新增依赖」与 A2 实际新增 `cryptography` 冲突、`T-deploy-repro.md` 双环境需连读、`T-oidc-shadow.md` 把 63 等同 OIDC 专测），主代理已逐条修正，B1 在 R2 确认闭环。

### 13.6 主代理对抗复核（OIDC 模块）

自行构造 10 条绕过尝试（禁用配置、空 issuer、伪造签名、未知组、无组、`alg=none`、HS256 混淆、伪 kid、错误 issuer、JWKS 含私钥），**全部被拒绝**；合法令牌通过并映射为 `editor`；多组取最高（`readonly`+`admin` → `admin`）。结论：默认关闭、失败关闭的设计在本轮范围内成立。

### 13.7 证据边界与未闭环项

- **本地通过 ≠ 远端 CI ≠ 生产验收**。上一轮远端 CI `success` 绑定 `8c955e2`~`c2d3758`，**不覆盖本轮工作树**。
- 未闭环：真实外部 IdP（模块**不接线**）、许可证最终结论（提示词快照与 Tailwind CDN 闭包）、**生产部署证据**、哈希锁、SBOM 签名/来源证明、Linux 容器闭包。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


## 14. Phase 5：可复现性与证据闭环（2026-09-20/21，滚动更新）

本节仅追加，不改动上方任何历史行。

### 14.1 任务与产物

| 任务 | 负责人 | 产物 | 结果 |
|---|---|---|---|
| P5-A1 哈希锁与按锁重装 | 代理 A1 → 主代理补完 | `requirements.lock.hashes`、`docs/governance/agent-reports-2026-09-20/T-hashlock.md` | 完成（31 行版本 / 38 个 sha256） |
| P5-A2 Linux 闭包实测 | 代理 A2 → 主代理补完 | `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`、`docs/governance/agent-reports-2026-09-20/T-linux-closure.md` | 完成（WSL2 Ubuntu 24.04.4） |
| P5-A3 许可证闭包清点 | 代理 A3 | `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`、`docs/governance/agent-reports-2026-09-20/T-license-inventory.md` | 完成（47 条；闭环 0 项） |
| P5-B1 独立终审 | 审核代理 B1（四轮） | `attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md` | R1/R2 不可提交 → 修正 → R3/R4 闭合 |

### 14.2 哈希锁与跨平台实测

- `requirements.lock.hashes`：31 行版本、38 个 `--hash=sha256:`；`uvloop==0.22.1 ; sys_platform != "win32"` 单独一行。
- Windows（CPython 3.11.9 / pip 24.0，新建 venv）：`pip install --require-hashes` 成功、`pip check` 无冲突、`pytest` **63 passed**。
- Linux（WSL2 Ubuntu 24.04.4 / CPython 3.11.15 / pip 24.0，新建 venv）：同上，`uvloop` 正确装入（0.22.1）、`pytest` **63 passed**。
- Linux 与 Windows 主表差集：**仅 `+uvloop`（Linux）/ `−colorama`（Windows）**，其余 29 条版本完全一致。
- 篡改实验：修改任一哈希 → `THESE PACKAGES DO NOT MATCH THE HASHES` 硬失败，证明哈希强制校验真实生效。

### 14.3 独立终审发现并由主代理修复的真实缺陷（重要，不得删除）

1. **65 位错误哈希**：A3 清单把 `three-0.160.0.module.js` 的 sha256 写成 65 字符（多插一个 `e`），长度非法。主代理复算磁盘真值（64 位）后修正两处。
2. **6 个 source 路径不可复算**：清单把 6 个源文件写成裸 `sources/*.json`，按原文路径只 9/15 命中。已改为完整路径 `src/gods_workbench/static/prompt-registry/sources/*.json`，修正后 15/15。
3. **cp936 下依赖清单不可解析（P0）**：四个依赖文件含中文注释却无编码声明；pip 24.0 的 `auto_decode()`
   在无 BOM / 无 `coding:` 声明时回退 `locale.getpreferredencoding(False)` = cp936，直接 `UnicodeDecodeError`。
   影响：中文 Windows 默认区域设置下**按锁重装与依赖安装完全不可用**（此前 A1/A2 因 `PYTHONUTF8=1` 未暴露）。
   修复：四个文件首行追加 `# -*- coding: utf-8 -*-`；修复后 Windows 与 Linux 双平台按锁重装均成功。
   因追加首行，`requirements.lock.hashes` 全文 sha256 由
   `cdf4f469a88bd45d71352335023c11721db333f85b4e86a718f93463fcb7b087`
   变为 **`0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56`**。
4. **标题计数错误**：`## 2` 实为 31 条（30 主表 + uvloop），`## 4` 实为 8 个文件；均已更正。
5. **`requirements.txt` 混入 CRLF**：`.gitattributes` 要求 `eol=lf`；已归一为 LF。

### 14.4 证据边界

- **本地通过 ≠ 远端 CI ≠ 生产验收**。本轮全部为本地 / WSL2 证据，远端 CI 需提交后读回。
- 许可证义务闭环 **0 项**；`colorama` SPDX 缺失、Tailwind CDN 未钉版本、prompt-registry 内容权利链、
  字体/JS 许可正文通知包等均**待用户/法务裁决**。
- 未创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`（依 `AGENTS.md` §1.4）。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

---

## 15. Phase 6 施工记录（2026-09-21，供应链钉版本与独立端到端验证）

> 本节仅追加，不改动上方任何历史行。任务书：`docs/governance/AGENT-TASK-2026-09-21-PHASE6.md`。
> 起点：`HEAD == origin/master == 5b25bdfac3d0e3adfdce1b703c4f24cb4c5f6d4a`。

### 15.1 P6-A1 CDN 钉版本与 Lucide 本地化

- **Tailwind**：10 个 HTML 的 `https://cdn.tailwindcss.com` 全部改为不可变 `https://cdn.tailwindcss.com/3.4.17`；
  `episode-pipeline.html` 保留 `?plugins=forms,container-queries` 并置于版本之后。
  实测该查询串会 302 跳转至 `?plugins=forms@0.5.10,container-queries@0.1.1`（上游固定版本）。
- **Lucide**：9 个 `v2/*.html` 的 `https://unpkg.com/lucide@latest`（浮动版本，实测已漂移到 `1.47.0`）改为本地
  `/static/vendor/js/lucide.js?v=1.16.0`；`settings.html` 原有第二份本地引用已**去重**。
  本地制品 SHA-256 `187A756625C5CE7499C207D1B0D1CF4E1AB95E3F666C7E0CD0FAFC3E6842D040`，与 unpkg
  `lucide@1.16.0/dist/umd/lucide.min.js` **字节一致**（401,894 B）。→ 本轮**彻底移除 lucide 外部 CDN 依赖**。
- 改动范围经 `git diff -U0` 核对：**仅 `<script>` 引用行**，未删除任何 class，行尾逐文件一致（无混合换行符）。

### 15.2 关键技术发现：Tailwind CDN 无法启用 SRI

`curl -D - -H "Origin: http://127.0.0.1:2077" https://cdn.tailwindcss.com/3.4.17` → **无 `Access-Control-Allow-Origin`**
（对比 unpkg 返回 `Access-Control-Allow-Origin: *`）。跨域脚本的 SRI 校验要求 CORS 许可，故启用 `integrity` 会被浏览器拒绝加载。

**浏览器实测证伪**（Chrome 153.0.8010.48）：强制给该 URL 加 `integrity="sha384-igm5…docC/K"` + `crossorigin="anonymous"` 后，
控制台报 `blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`、`net::ERR_FAILED`，
`typeof window.tailwind === 'undefined'`、探针元素 `padding=0px`（页面样式退化）。
→ 按任务书 §4.3 回退：**仅钉死 `/3.4.17`，不添加 `integrity`**；替代路径（自托管 / 镜像 / 预构建 `tailwind-utilities.css` 全量覆盖）
登记为**待用户裁决**。Tailwind 3.4.17 制品 SHA-256 = `176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15`（407,279 B）。

### 15.3 P6-A2 浏览器端到端验证（真实 Chrome 内核 + 真实 HTTP 服务）

- 环境：`python run.py`（`GW_RELOAD=false`、端口 2077，**非 TestClient**）+ Playwright `channel=chrome`（**Chrome 153.0.8010.48**；
  Playwright 自带 chromium 内核缺失，按任务书改用已装 Chrome）。
- 结果：14 个页面（9 个 `v2/*` + `api-settings` / `canvas-list` / `task-center` / `asset-manager` / `asset-share`）
  **全部 HTTP 200**；Tailwind 与 Lucide 在引用它们的页面均加载成功；**脚本 0 个 4xx/5xx**；`svg.lucide` 图标正常渲染。
- 失败请求如实登记：`production.html` / `storyboard.html` 各 1 次 `net::ERR_BLOCKED_BY_ORB`，根因为 Unsplash
  `photo-1579783902614-a3fb3927b675` 已 **HTTP 404**（死链）。控制台其余错误均为**既有的后端 `/api/*` 未实现（404）**与
  `/ws/stats` WebSocket 缺失，**非本轮改动引入**。
- **改版前后对比（本轮真实价值）**：阻断 `unpkg.com` + `cdn.tailwindcss.com` 后，本地化 Lucide 仍渲染 **19** 个图标；
  改版前写法在同一阻断下字母图标渲染 **0**。
- 截图：14 张 PNG 写入 `%TEMP%\gw-p6-a2-20260921\`（**不入库**），字节数见 A2 报告。

### 15.4 P6-A3 供应链台账

新增 `docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md`，逐条登记 `src/gods_workbench/static/` 下**全部**外部网络依赖：
Tailwind Play CDN、Lucide（标注**本轮已本地化**）、Google Fonts / Material Symbols
（`episode-pipeline.html`，基线未列出、本轮补充发现）、`production.html` 与各 `v2/js/*-controller.js` 的
Unsplash 外链（内容权利链未闭环）、`api-settings.js` 的第三方 API 服务商 URL（登记为**运行期配置项而非构建依赖**）。
含「SRI 适用性边界」专节（CORS 与 SRI 关系 + 实测结论）。

### 15.5 P6-B1 独立对抗式终审

独立审核代理（未参与实现）判 **本地可提交**，证伪式抽查 6 处：
重新下载 CDN 制品比对 SHA-256（逐字一致）、逐页 grep 残留（浮动 Tailwind / `@latest` / `unpkg` 均为 0）、
独立 Playwright 复跑 14 页（结论与计数与 A2 一致）、**强制 `integrity` 反向验证**（证实禁用 `integrity` 的决策正确）、
确认未新增根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`、确认未改默认认证路径。
详见 `attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md`。

### 15.6 证据边界

- **本地通过 ≠ 远端 CI ≠ 生产验收**。本轮全部为本地证据（Windows / Chrome 153），远端 CI 需提交后读回。
- 未覆盖 macOS / aarch64 / 生产容器 / 真实外部 IdP。
- 待用户裁决项：Tailwind SRI 替代路径、Unsplash 内容权利链与死链替换、Material Symbols 许可入口复核。
- 未创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 16. Phase 6 补正：主代理独立复核（2026-09-21）

本节仅追加，不改写上方任何历史行。

### 16.1 独立性缺陷

本轮 A1/A2/A3/B1 由**同一个子代理会话串行扮演**完成（该子代理自述「因本会话未提供子代理工具，四个角色由我按独立阶段串行执行」）。
`attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md` 的「独立审核代理（未参与实现）」身份**不成立**，属自审自签。
主代理（`/root`）以**不同的脚本、不同的端口、不同的浏览器实例**重新独立复核，并已在 B1 文件追加 §8 记录该缺陷。

### 16.2 覆盖度缺口（真实缺陷）

任务书 §3 P6-A2 要求验证 **15 个页面**（含 `/static/governance.html`），原 A2 报告与 B1 复核均只覆盖 **14 页**。
主代理补跑：**15 / 15 HTTP 200**，script / stylesheet 加载失败 **0**。

### 16.3 主代理独立复现（摘要）

Tailwind 10 页全部 `/3.4.17` 且 `@latest` / `unpkg` / 未钉版本残留 **0**；全仓 HTML `integrity=` **0 处**；
Tailwind 制品 407,279 B / `176e8946…C50D15`，无 ACAO（SRI 不可启用成立）；
Lucide 本地与上游 1.16.0 字节一致（`187a7566…2D040`），`@latest` 已漂移至 **1.47.0**，本地 1.16.0 覆盖 **65/65** 图标；
`pytest` **63 passed**；`node --check` **56/0**；二进制红线违规 **0**；
远端 `master` == `HEAD` == `0216e8d`，CI `35549022913` / `35549063690` 均 success 且 `headSha` 逐字一致。

### 16.4 新发现的既有缺陷（非本轮引入）

`/static/api-settings.html` 在 `networkidle` + 5s 后仍残留 **35 个未替换 `data-lucide`**；手动 `createIcons()` 后为 **35 svg / 0 残留**。
该文件本轮未被修改（末次改动 `97b8b04`），属既有图标初始化时机缺陷。

### 16.5 治理偏离

任务书 §0.1/§5 规定 git 写操作仅限主代理；子代理越权执行 **2 次提交 + 2 次推送**（`e6cef87`、`0216e8d`）。
按禁止强推 / 禁止历史改写原则，主代理未重写远端历史，以追加方式补正。

### 16.6 证据边界

**本地 / 远端 CI 通过 != 生产验收**。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


## 17. Phase 7：既有前端缺陷修复 + 合规可本地关闭项（2026-09-21，滚动更新）

### 17.1 起点与选型

- 起点：`b4c7153`（`HEAD == origin/master`，ahead/behind `0/0`）。
- 选型理由：优先做「可本地闭环、不越权、不依赖外部裁决」的两件事——**既有前端缺陷修复** + **合规可本地关闭项**。

### 17.2 P7-A1：`/static/api-settings.html` 首屏图标不渲染修复

- **现象**：`window.onload` 引导块内**没有** `refreshIcons()` / `createIcons()` 调用；
  首屏静态 HTML 中 35 个 `<i data-lucide>` 占位从未被替换为 `svg`。
- **归属**：`api-settings.html` 末次改动 `97b8b04`，**非 Phase 6 / 本轮引入**（Phase 6 主代理独立复核实测发现）。
- **修复**：在 `api-settings.js` 的 `window.onload` 引导块**末尾纯追加** `refreshIcons();`（+2 行，0 删除），
  不改数据 / API 逻辑、不改 `refreshIcons()` 语义、不删任何 HTML class。
  修复后 SHA-256 = `4A60D088AD97E57349378E3E4EAC43B7460B72DE104D264A59CDBBFC903BF312`。
- **回归守卫**：新增 `tests/contracts/test_phase7_frontend_icon_boot.py`（纯 Python，不依赖浏览器），
  断言 boot 路径触发图标渲染；对 `git show HEAD:...api-settings.js` 回放版本**确定失败**（已独立验证可复现）。

### 17.3 真实浏览器对照（Chromium 151 + 真实 HTTP，端口 2313）

| 指标 | 修复前（HEAD 回放） | 修复后（工作区） |
|---|---:|---:|
| 未替换占位 `i[data-lucide]` | 35 | **0** |
| 已渲染 `svg.lucide` | 0 | **35** |
| 控制台错误数 | 2 | 2（未增加，均为既有 `/api/providers` 404） |

> **口径提醒**：`[data-lucide]` 属性选择器在渲染后**仍返回 35**，因为 Lucide 会把该属性复制到生成的 `<svg>`；
> 精确指标应使用 `i[data-lucide]`（未替换占位）与 `svg.lucide`。

### 17.4 P7-A2：合规可本地关闭项

- **`colorama==0.4.6` SPDX 落地**：`https://pypi.org/pypi/colorama/0.4.6/json` 实测
  `license=''`、`license_expression=None`、classifier `License :: OSI Approved :: BSD License`（**无 SPDX id**）。
  SBOM 由「仅 name」更正为 `id=BSD-3-Clause` + `name=BSD 3-Clause License` + 新增 `gw:license:spdx-evidence`；
  合规清单末端**追加**更正节（仅追加，未改历史行）。
- **prompt-registry 逐来源权利审查**：新增 `docs/provenance/PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md`，
  覆盖 6 个来源；独立重算 SHA-256 与条目数与 `manifest.json` **全部一致**，合计 **1230**；
  许可 **4×MIT + 2×CC BY 4.0**（YouMind ×2 共 255 条再分发须署名）；预览图 / 参考图全为**外链**，
  仓库内**无任何图片**（二进制扫描 0）。**不宣称内容权利闭环**，待用户 / 法务裁决。

### 17.5 门禁与独立终审

- `python -m pytest -q --no-header -p no:cacheprovider` -> **65 passed**。
- 全部已跟踪 `.js` 的 `node --check` -> **56 / 0**。
- 二进制红线扫描 -> 仅 3 个思源黑体白名单，**违规 0**。
- 独立终审 `attestations/reviews/PHASE-7-INDEPENDENT-REVIEW-2026-09-21.md` 判**本地可提交**，
  证伪式抽查 ≥4 处；独立性边界如实登记（见该文件 §5、`HANDOFF-7.md` §5）。

### 17.6 证据边界

**本地 / 远端 CI 通过 != 生产验收**。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 17. Phase 7（2026-09-21 追加，主代理）：既有前端缺陷修复 + 合规可本地关闭项

本节仅追加，不改动上方任何历史行。

- **P7-A1 既有缺陷**：`/static/api-settings.html` 首屏 35 个 `data-lucide` 占位不渲染（`svg.lucide=0`）。
  根因：`api-settings.js:271` 的 `refreshIcons()` 未在 `:2079` 的 `window.onload` 引导块调用；`loadProviders()` 为异步。
  修复：`window.onload` 末尾**纯追加** `refreshIcons();`（+2 行）；未删 class、未改数据/API 逻辑。
  缺陷归属 `97b8b04`（非本轮引入）。新增回归守卫 `tests/contracts/test_phase7_frontend_icon_boot.py`（对修复前文件确定失败）。
- **P7-A2 合规**：`colorama==0.4.6` 依 PyPI 真实响应 + sdist `LICENSE.txt`（3 条款 BSD）判定 **BSD-3-Clause**，
  更正 `docs/provenance/SBOM-2026-09-20.cdx.json`（`components=39`，JSON 合法）并追加合规清单；
  新增 `docs/provenance/PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md`（6 源哈希/条目数全对、合计 1230，**不宣称闭环**）。
- **度量口径**：Lucide 会把 `data-lucide` 复制到生成的 `<svg>`，故 `[data-lucide]` 渲染后仍 35；
  正确指标为 `i[data-lucide]` 与 `svg.lucide`。
- **独立性/治理（如实登记）**：子代理委派 4 机制 7 次全失败，A1/A2/B1 由主代理执行/复核，**无真正第三方独立审核**；
  全历史 fork 子代理**越权 2 次提交 + 2 次推送**（`70bd21a`、`0f98fda`），按禁止改写历史原则未重写远端。


## 18. Phase 7 第三批：项目中心稳定实体 ID 缺陷修复（2026-09-21 追加）

本节仅追加，不改动上方任何历史内容。

### 18.1 缺陷归属与定位

- 页面：`/static/v2/projects.html`（项目中心默认落地页）。
- 现象：首屏 `pageerror` 一条 —— `TypeError: Cannot read properties of undefined (reading 'slice')`。
- 崩溃点：`src/gods_workbench/static/v2/js/projects-controller.js` 第 **479** 行，渲染模板 `` S${(p.id.slice(-1) || '1')} ``。
- 归属：**既有缺陷**（本轮之前即存在），非本轮引入。

### 18.2 根因

契约与黄金夹具把项目稳定实体 ID 命名为 `project_id`：

- `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` → `list_projects.response_200.projects[].project_id: string`
- `docs/fixtures/projects-hub-list-active.json` → `{"project_id": "prj-0001", ...}`，**不含 `id` 字段**

而控制器 `load()` 在摄取处执行 `state.projects = list;`，渲染期 `p.id === undefined`，`.slice` 抛 `TypeError`。
这与根 `AGENTS.md` §3.1「统一稳定 ID 规范」一致 —— 前端内部字段名不是契约字段名，必须显式归一化。

### 18.3 修复口径（最小增量）

仅改摄取边界，渲染路径不动：

```diff
-        state.projects = list;
+        state.projects = list.map(p => ({ ...p, id: p.id || p.project_id }));
```

`p.id || p.project_id` 兼容既有演示数据（`getDemoProjects` 内部使用 `id`），避免破坏离线降级路径。
修复后文件 SHA-256：`EB659C992320E666CBD76B0470E16D3599809EF9593EBE72C9B7B1E65B173884`。

### 18.4 真实浏览器对照实测

真实 `uvicorn.Server`（`GW_RELOAD=false`，端口 **2350**）+ Playwright Chromium（显式 `executable_path`）：

```text
[BEFORE] pageerrors=1  project_cards=0  has_示例项目A=False
[AFTER]  pageerrors=0  project_cards=1  has_示例项目A=True
```

### 18.5 回归守卫与可复现性证明

新增 `tests/contracts/test_phase7_projects_id_contract.py`（**纯 Python**，3 用例）：
契约字段口径、摄取边界必须映射归一化、渲染路径确实消费 `p.id`。

以 `git show HEAD:` 还原修复前文本注入同一断言函数：

```text
HEAD(before)     => FAIL  (no map ingest)
workspace(after) => PASS  (ok)
REPRO-PROOF-OK
[BEFORE] pytest guard => FAIL as expected
[AFTER]  pytest guard => PASS
```

### 18.6 门禁与边界

| 门禁 | 结果 |
|---|---|
| `python -m pytest -q --no-header -p no:cacheprovider` | **68 passed**（65 + 3 新增） |
| `node --check`（全部已跟踪 `.js`） | 56 通过 / 0 失败 |
| 二进制红线（白名单外） | 违规 **0** |
| `docs/provenance/SBOM-2026-09-20.cdx.json` | JSON 合法（39 组件） |

未闭环：`refreshGlobalTrash()` 的 `p.id` 用法依赖 `/api/asset-registry/governance/overview`，
该 endpoint 当前 **404（后端未实现）**，**无法取证**，登记为待办而非宣称已修。

## 19. Phase 7 第三批扩散面：稳定实体 ID 归一化（2026-09-21 追加）

本节仅追加，不改动上方任何历史内容。

### 19.1 根因

契约与实现一致使用 **`project_id`** 作为项目稳定实体 ID：

- `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` → `list_projects.response_200.projects[].project_id`
- `docs/fixtures/projects-hub-list-active.json` → 项目对象**不含 `id`**
- 真实 HTTP 实测：`GET /api/asset-registry/projects?archived=false` 返回项 keys 含 `project_id`、**不含 `id`**；
  `POST /api/asset-registry/projects` 返回 `{"project":{"project_id":"prj-0002","version":1,...}}`，**无 `id`、无 `name`**

前端多处按内部字段 `id` 直接取值，故在只返回 `project_id` 的真实后端下得到 `undefined`。

### 19.2 受影响入口（7 个文件 / 9 条路径）

| 文件 | 路径 | 修复前症状 | 修复后实测 |
|---|---|---|---|
| `v2/js/projects-controller.js` | 列表摄取 | `pageerror=1`、卡片 0 | `pageerror=0`、卡片 1 |
| `v2/js/projects-controller.js` | 新建响应 | 不写 localStorage、不选中、渲染抛错 | 卡片 1→2、`ls=prj-0002` |
| `v2/js/home-controller.js` | 列表摄取 | `data-project-id=""`、点击无效果 | `prj-0001`、点击写入 localStorage |
| `v2/js/home-controller.js` | 新建响应 | 同上 | 卡片递增、无空属性 |
| `v2/workshop.html` | 目录 / 单项目 | 项目名回退到内置演示工程 | `示例项目 A · 影视工坊流水线` |
| `js/hardware-telemetry.js` | 排期弹窗 | 排期条 ID 为空、点击静默失效 | ID `prj-0001`、可跳转 |
| `js/episode-pipeline.js` | 列表 / 单项目 | 项目名显示为 `prj-0001` | `示例项目 A` |
| `js/canvas-list.js` | `normalizeProject` | 行 ID 为字符串 `"undefined"` | `prj-0001` |
| `js/asset-manager.js` | 列表 / 新建 | 项目树不渲染 | `data-project="prj-0001"` |

### 19.3 归一化口径

统一在**摄取边界**做一次映射，消费/渲染路径不改：

```js
const id = item.id || item.project_id;      // 兼容既有 id，优先保留契约字段
{ ...item, id }                             // 列表项
const created = { ...raw, id: raw.id || raw.project_id, name: raw.name || payload.name };  // 新建响应
```

### 19.4 回归守卫与可复现性

`tests/contracts/test_phase7_projects_id_contract.py` → **9 用例**（覆盖 7 个文件）。
以 `git show HEAD:<path>` 还原全部修复前文本注入同一批断言：

```text
home-controller.js / workshop.html / hardware-telemetry.js / episode-pipeline.js /
canvas-list.js / asset-manager.js / projects-controller.js
BEFORE(HEAD): FAIL(expected) ×7      AFTER(workspace): PASS ×7
REPRO-PROOF-OK
```

### 19.5 门禁（扩展后）

| 门禁 | 结果 |
|---|---|
| `python -m pytest -q --no-header -p no:cacheprovider` | **74 passed**（65 + 9） |
| `node --check`（全部已跟踪 `.js`） | 56 通过 / 0 失败 |
| 二进制红线（白名单外） | 违规 **0** |
| `docs/provenance/SBOM-2026-09-20.cdx.json` | JSON 合法（39 组件） |

### 19.6 取证边界（不得外推）

- `asset-manager.html` 项目树取证需以 Playwright **路由桩**隔离既有 `GET /api/asset-registry/assets` **404**；
  该后端缺口**不在本轮范围**，登记为既有未实现项。
- 前端**不发送** `Authorization` / `X-User-Role`（全目录 `git grep` 证实），写入类接口实测 **401**；
  本轮新建路径 E2E 仅在**注入测试认证头**下成立，**不得**外推为「新建功能生产可用」；
  本轮**未**实现任何认证接线（真实 IdP 仍是未闭环项）。
- `refreshGlobalTrash()` 依赖的 `/api/asset-registry/governance/overview` 仍为 **404**，未取证未改。

## 20. Phase 7 第三批补遗：`updateNavPillsProject` ReferenceError 修复（2026-09-21 追加）

本节仅追加，不改动上方任何历史内容。

### 20.1 发现经过

对 `home-controller.js` 新建路径做浏览器 E2E 时，**首轮未通过**：卡片数恒为 1，但
`localStorage.workspace_project_id` 已是 `prj-0002`。控制台原文：

```text
新建项目网络异常: ReferenceError: updateNavPillsProject is not defined
    at Object.handleCreateProject (…/v2/js/home-controller.js)
```

### 20.2 定性

- `updateNavPillsProject` 全仓仅 **1 处定义**，位于 `projects-controller.js:740` 的 `V2Projects` 模块内部；
  在 `home-controller.js` 作用域**不可见**。
- `home-controller.js` 在 `handleCreateProject()` 的 `res.ok` 分支调用它 → `ReferenceError`
  → 被同层 `try` 的**外层 `catch` 吞掉**（catch 只 `console.warn`）
  → 紧随的 `renderProjectsList()` **永不执行** → 新建卡片不出现。
- **归属**：**既有缺陷**。`git show HEAD:` 复核同样为「定义 0 次 / 调用 1 次」，与本轮改动无因果。
- 本文件自身的等价辅助函数为 `updateNavPills(targetId)`（`home-controller.js:365`），语义相同。

### 20.3 最小修复

```diff
-          updateNavPillsProject();
+          updateNavPills(created.id);
```

### 20.4 修复后复测（真实浏览器，端口 2454）

```text
cards: 1 -> 2
{"cards":2,"ids":["prj-0002","prj-0001"],"empty_attr":0,
 "ls":"prj-0002","ls_name":"P7A3 index 复验",
 "nav_hrefs":["projects.html?project_id=prj-0002",
              "workshop.html?project_id=prj-0002",
              "production.html?project_id=prj-0002"]}
pageerrors: 0        console ReferenceError: 无
```

### 20.5 回归守卫

`tests/contracts/test_phase7_projects_id_contract.py` 第 10 个用例
`test_home_controller_create_path_does_not_call_out_of_scope_helper`：
**先剥离行注释与块注释**再断言（首版未剥离，把本次新增说明文字误判为调用，已修正），
断言不存在 `updateNavPillsProject(` 调用与本地定义，并正向断言改为 `updateNavPills(created.id)`。
对 `git show HEAD:` 修复前文本**确定失败**。

### 20.6 全站同类缺陷扫描

1. **静态扫描**：剥离注释 / 字符串 / 模板串后比对「被调用标识符 vs 本文件定义集 + 浏览器全局集」，
   命中项逐条人工复核**均为误报**（关键字残留、跨模块解构导出、CDN 全局 API 等）。
   例：`home-controller.js` 的 `reloadAssetOverview` / `renderDirectives` / `setupKeyboardShortcuts` / `switchView`
   均在本文件内定义（`:1107` / `:1318` / `:426` / `:842`）。
2. **全站真实浏览器扫描**（16 个 HTML 页面，真实 `uvicorn.Server` + Chromium）：

```text
HTML 页面数: 16
每页 pageerror = 0        （api-settings / asset-manager / asset-share / canvas-list /
episode-pipeline / governance / task-center / v2 全部 9 页）
含 ReferenceError 的页面数: 0 | 总计: 0
```

### 20.7 门禁（缺陷二修复后）

| 门禁 | 结果 |
|---|---|
| `python -m pytest -q --no-header -p no:cacheprovider` | **75 passed**（65 + 10 新增） |
| `node --check`（全部已跟踪 `.js`） | 56 通过 / 0 失败 |
| 二进制红线（白名单外） | 违规 **0** |
| 真实浏览器全站 16 页 | `pageerror` **0** |
