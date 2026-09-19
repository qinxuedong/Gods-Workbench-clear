# 二进制资源合规与 V2 命名基线记录（2026-09-18）

- **记录对象**：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（洁净仓）工作区现状。
- **记录目的**：为用户第 2 项要求「二进制资源合规 + V2 命名基线」做正式文档记录，供后续处理。
- **处理状态**：**本项按用户指示属后续处理，本轮不阻塞提交，但提交前必须登记。** 本记录为只读盘点结果，未对任何仓库文件做新增、修改、删除、移动或回退。
- **数据来源**：本记录全部数字均为本轮实测（`git status/ls-files`、逐文件字节数与 SHA-256、全工作区文本引用扫描、`pytest -q`、FastAPI `openapi.json` 路由枚举）。引用旧报告的过时数字（如 25.6 MB、5 张缩略图「仅被自身引用」等）已按实测更正。

---

## 1. 二进制资源现状清单

**受限二进制定义**：`AGENTS.md` §1.2 所列图片、截图、音频、视频与本地字体文件。**`volcengine-theme-*.svg` 为 SVG 文本，不属受限二进制，故不列入本清单。**

**实测量合计：13 项，26,807,233 字节 = 25.57 MiB（26.81 MB）**，其中 3 个字体 OTF 占 26,654,792 字节（25.42 MiB，约 99.4%）。

| # | 路径（相对仓库根） | 字节数 | 被谁引用（全工作区文本扫描） | 运行期必需 | 是否与用户源一致 |
|---:|---|---:|---|---|---|
| 1 | `src/gods_workbench/static/images/RunningHub-B.png` | 2,970 | `src/gods_workbench/static/js/api-settings.js` | 是（API 设置页徽标，浅色态） | 是（与 `Gods-Workbench-release` 及旧仓 HEAD blob 逐字节一致） |
| 2 | `src/gods_workbench/static/images/RunningHub-W.png` | 1,806 | `src/gods_workbench/static/js/api-settings.js` | 是（API 设置页徽标，深色态） | 是（同上） |
| 3 | `src/gods_workbench/static/images/logo.png` | 33,811 | 10 个 `.html` + `src/gods_workbench/static/js/asset-share.js`（共 11 个文件） | 是（页面品牌标识，长驻） | 是（与 release 仓、旧仓逐字节一致） |
| 4 | `src/gods_workbench/static/images/modelscope-1.gif` | 49,941 | `src/gods_workbench/static/js/api-settings.js` | 是（ModelScope 徽标，暗色态） | 是（同上） |
| 5 | `src/gods_workbench/static/images/modelscope.gif` | 35,929 | `src/gods_workbench/static/js/api-settings.js`、`static/angle.html`、`static/zimage.html` | 是（ModelScope 徽标，浅色态） | 是（同上） |
| 6 | `src/gods_workbench/static/runninghub/thumbnails/workflow-2058541134623891458.jpg` | 5,143 | `src/gods_workbench/static/runninghub/api_providers.json` | 否（仅配置清单内缩略图；缺失时前端降级） | 是（与 release 仓、旧仓逐字节一致） |
| 7 | `src/gods_workbench/static/runninghub/thumbnails/workflow-2058554058318897153.jpg` | 4,546 | 同上 | 否（同上） | 是（同上） |
| 8 | `src/gods_workbench/static/runninghub/thumbnails/workflow-2058818588181622785.jpg` | 4,976 | 同上 | 否（同上） | 是（同上） |
| 9 | `src/gods_workbench/static/runninghub/thumbnails/workflow-2058824859437850625.jpg` | 5,074 | 同上 | 否（同上） | 是（同上） |
| 10 | `src/gods_workbench/static/runninghub/thumbnails/workflow-2064542485938008065.jpg` | 8,245 | **无任何文本引用**（`api_providers.json` 只登记 4 张） | 否 | 是（与 release 仓、旧仓逐字节一致） |
| 11 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf` | 8,806,392 | `static/vendor/css/fonts.css`、`static/css/signal-flow.css`、`static/vendor/MANIFEST.md` | 是（`fonts.css` 声明后由 17 个页面/样式引入） | 是（与 release 仓、旧仓 HEAD blob 逐字节一致） |
| 12 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf` | 8,812,324 | 同上 | 是（同上） | 是（同上） |
| 13 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf` | 9,036,076 | 同上 | 是（同上） | 是（同上） |
| — | **合计（13 项）** | **26,807,233** | — | 运行期实际必需 8 项（5 徽标 + 3 字体） | 13/13 与用户源一致 |

**引用可达性补充说明**：

- `src/gods_workbench/static/vendor/css/fonts.css` 通过 `@font-face` 声明 3 个 OTF 字重，被 **17 个 `.html`/`.css` 文件**引入（含 `v2/workshop.html`、`v2/settings.html`、`angle.html`、`css/signal-flow.css` 等），因此 3 个字体属**运行期强依赖**。
- 5 张 jpg 缩略图仅有 **4/5** 被 `runninghub/api_providers.json` 引用；`workflow-2064542485938008065.jpg` 在全工作区**无任何文本引用**，属孤儿资源。
- `logo.png` 为 11 个文件引用（10 个 `.html`：`angle.html`、`asset-manager.html`、`asset-share.html`、`canvas-list.html`、`canvas.html`、`enhance.html`、`klein.html`、`online.html`、`smart-canvas.html`、`zimage.html`；1 个 `.js`：`js/asset-share.js`），非旧报告所称「11 个页面」。

**卫生用例影响**：`tests/hygiene/test_cleanroom_hygiene.py::test_no_banned_binary_assets` 与 `tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets` 对这 13 项全部报违规，是本轮 `python -m pytest -q`（**5 failed / 35 passed**）中 2 项失败的**唯一**直接原因。

---

## 2. 冲突陈述

| # | 依据 | 原文要点 | 与本记录的冲突 |
|---:|---|---|---|
| 1 | `AGENTS.md` §1.2 | 「仓库内严禁提交任何图片、截图、音频、视频或本地字体文件（`.ttf`, `.otf`, `.woff` 等）」；「前端所需字体一律使用 Google Fonts CDN 或系统原生字体栈，图标使用 Lucide CDN，样式使用 Tailwind CDN」 | 与现状清单 13 项**直接冲突**，且已导致 2 个卫生用例 FAILED |
| 2 | 用户会话指令 | 「字体全部替换为思源黑体（Bold/Medium/Normal 三档）」 | 要求保留 `SourceHanSansCN-*.otf` 本地字体，与 §1.2「一律使用 CDN/系统字体栈」冲突 |
| 3 | 用户会话指令 | 「剩余图片全部迁移」 | 要求保留 5 张徽标 + `logo.png`（以及缩略图），与 §1.2「严禁提交图片」冲突 |

**冲突点归纳**：`AGENTS.md` §1.2 是「零二进制」硬红线，而用户会话中明确要求**字体本地化 + 图片迁移**。二者不能同时满足，必须由用户择一裁决；在裁决前，任何以 §1.2 为依据的批量删除都会违背用户已表达的产品意图。

---

## 3. 三个候选方案与代价

### 方案（a）：改 Google Fonts CDN / 系统字体栈 + 图片内联 SVG

- **做法**：删除 3 个 OTF，改用 CDN 或系统字体栈；5 张徽标与 `logo.png` 改为内联 SVG/CSS 或 CDN。
- **代价**：
  - **严守 §1.2 红线**，2 个卫生用例可恢复 PASS，仓库体积立减约 25.57 MiB。
  - **直接偏离用户明确指令**（「思源黑体三档」「图片全部迁移」），需用户书面改口。
  - 中文思源黑体走 CDN 存在**首屏闪烁/离线不可用**风险；系统字体栈将导致**跨平台字形不一致**，破坏既有「思源黑体」视觉基线。
  - `logo.png` 与 5 张徽标为位图，内联 SVG 需**重绘**（非等价替换），有品牌一致性风险。

### 方案（b）：保留本地资源 + 在 `AGENTS.md` 开辟显式白名单（**推荐**）

- **做法**：修订 `AGENTS.md` §1.2，新增**显式白名单**，逐条列明允许的本地二进制资源；同步修改 2 个卫生用例使其白名单感知。
- **白名单条目（建议文本，逐条对齐现状清单）**：
  1. `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-{Normal,Medium,Bold}.otf`（思源黑体三档，用户指令指定，运行期强依赖）。
  2. `src/gods_workbench/static/images/logo.png`（品牌标识，11 个文件引用）。
  3. `src/gods_workbench/static/images/{modelscope.gif,modelscope-1.gif,RunningHub-B.png,RunningHub-W.png}`（API 设置页徽标）。
  4. `src/gods_workbench/static/runninghub/thumbnails/*.jpg`（**上限 4 项**；其中 `workflow-2064542485938008065.jpg` 无引用，建议另行清理）。
  5. 白名单**不含** `.svg`（文本资源本就不受限），也不含任何其他扩展名。
- **对应卫生测试修改**：
  - `tests/hygiene/test_cleanroom_hygiene.py`：在 `BANNED_EXTENSIONS` 之外新增 `ALLOWED_BINARY_ALLOWLIST`（精确路径集合），`test_no_banned_binary_assets` 改为「命中 BANNED_EXTENSIONS 但不在白名单内」才报错。
  - `tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets`：同样引入同一白名单（建议抽到共享常量模块，避免两份名单漂移）。
  - 白名单需**锁定路径与 SHA-256**，任何替换/新增二进制必须同步更新名单，否则沿用原红线报错。
- **代价**：
  - 用户指令与现状均得以保留，2 个卫生用例可恢复 PASS（须先改测试）。
  - `AGENTS.md` 红线被**显式放宽**，必须配套哈希锁定与许可证/来源登记，否则白名单会失守。
  - 需一次性完成「名单常量抽取 + 两个测试改造 + AGENTS.md 修订」三处联动。

### 方案（c）：保留资源但移出 Git 跟踪（仅运行期本地提供）

- **做法**：将 13 项加入 `.gitignore`、`git rm --cached`（保留工作区文件），由部署/运行期本地提供。
- **代价**：
  - 仓库可保持「零提交二进制」，2 个卫生用例按现行逻辑可恢复 PASS。
  - **洁净仓将无法自包含运行**：字体与徽标缺失会导致 `v2/workshop.html` 等页面降级或 404，与「随时可在浏览器直接打开运行」的 KISS 目标冲突。
  - 分发/CI 需新增资源注入步骤，**违背极简原则**，且 `%TEMP%` 式占位降级无法覆盖字体。
  - 仍需同步修订 `.gitignore` 与卫生用例（否则 `git status` 与测试口径不一致）。

---

## 4. 建议

**建议采用方案（b）：保留本地资源 + 在 `AGENTS.md` 开辟显式白名单。**

**理由**：

1. **忠于用户已表达的指令**。用户明确要求「字体全部替换为思源黑体（三档）」与「剩余图片全部迁移」，方案（b）不要求用户改口，避免返工。
2. **现状数据支撑保留**。13 项中 8 项为运行期实际必需（5 徽标 + 3 字体），3 个 OTF 已被 17 个页面/样式引入，删除将造成明确功能退化。
3. **代价可控且可审计**。方案（a）需重绘位图并承担跨平台字形漂移；方案（c）破坏仓库自包含。方案（b）只需三处联动（白名单常量、2 个测试、AGENTS.md），并可用 SHA-256 锁定把「放宽红线」限制在可枚举的 13 条路径内。
4. **顺带收敛孤儿资源**。方案（b）白名单把 jpg 上限设为 4 项，可同时处理无引用的 `workflow-2064542485938008065.jpg`。

**执行约束**：

- **本项按用户指示属后续处理，本轮不阻塞提交，但提交前必须登记。**
- 采纳方案（b）前，`AGENTS.md` §1.2 与 2 个卫生用例**必须同批修订**，不得只删资源或只改测试。
- 白名单须以「精确路径 + SHA-256」形式登记，并附许可证/来源说明（`static/vendor/MANIFEST.md` 已记录字体来源，可复用）。
- 若用户最终选择方案（a）或（c），本记录第 1 节清单可直接作为执行清单使用。

---

## 5. V2 命名基线（`god-canvas`）

### 5.1 现状

| 项目 | 现状 |
|---|---|
| 断言来源 1 | `tests/contracts/test_projects_hub_service.py:117` — `assert "god-canvas" in resp_workshop.text` |
| 断言来源 2 | `tests/smoke/test_production_smoke.py:55` — `assert "god-canvas" in resp_workshop.text` |
| 被断言文件 | `src/gods_workbench/static/v2/workshop.html`（本仓实测 57,780 字节，标题 `<title>影视工坊 · Gods' Workbench v2</title>`） |
| 实测结果 | 2 个用例**均失败**：`assert 'god-canvas' in resp_workshop.text` → AssertionError（当前 `v2/workshop.html` **不含** `god-canvas`） |
| 对照 | `git show HEAD:src/gods_workbench/static/v2/workshop.html`（4,827 字节）为洁净重构占位页，标题「工作台 (洁净重构中)」，**含** 3 处 `god-canvas` |
| 用户源 | `Gods-Workbench-release` 与 `Gods-Workbench` 的 `static/v2/workshop.html` 标题同为「影视工坊」，**均不含** `god-canvas` |

**根因**：本轮迁移把 HEAD 中的占位页整体替换为用户自有 V2 页面（标题「影视工坊」），而 2 个断言仍沿用占位页时代的 `god-canvas` 字符串，属**迁移断言未同步**，并非迁移缺陷。

### 5.2 两个候选方案

**方案 A：改断言**

- 把 2 处 `assert "god-canvas" in resp_workshop.text` 改为**面向真实页面**的断言，例如断言标题「影视工坊」或改用页面级标识。
- 修改点：`tests/contracts/test_projects_hub_service.py:117`、`tests/smoke/test_production_smoke.py:55`（共 2 行）。
- 影响面：**仅测试层**，前端零改动；2 个失败用例可立即恢复 PASS。

**方案 B：改前端文案**

- 在 `src/gods_workbench/static/v2/workshop.html` 中补入 `god-canvas` 字样（如标题、导航或页脚注明「god-canvas 统一画布引擎」），使断言成立。
- 修改点：`src/gods_workbench/static/v2/workshop.html`（用户自有前端文件）。
- 影响面：**改动用户迁移产物**。现标题「影视工坊」与用户源一致，补字将造成与用户源产生新的差异（另需评估是否同步回写用户仓），并把「迁移断言」问题转嫁到前端。

### 5.3 推荐与影响面

**推荐方案 A（改断言）**，理由：

1. **命名口径已由用户前端确定**。用户旧仓与 release 仓的 `v2/workshop.html` 均以「影视工坊」为标题且不含 `god-canvas`，说明 workshop 页的对外命名就是「影视工坊」；`god-canvas` 是引擎内部命名（`AGENTS.md` §3.4 已明确），不应作为页面字符串出现。
2. **改动面最小**。仅 2 行断言，不触碰用户迁移产物，不会引入与用户源的新差异。
3. **修复正确层级**。失败根因是「迁移后断言未同步」，应在测试层修正；改前端文案属于用产品代码迁就过时断言。

**影响面**：

- 方案 A：2 个用例恢复 PASS；`tests/contracts/test_projects_hub_service.py` 与 `tests/smoke/test_production_smoke.py` 需同步更新断言（建议断言「影视工坊」或页面主标识，而非引擎名）。
- 方案 B：`v2/workshop.html` 与用户源产生差异，需回写用户仓并重新登记迁移哈希，连锁成本更高。

**待用户裁决命名口径**：若用户确认 `god-canvas` 应作为 workshop 页面的正式对外名称，则应改走方案 B，并同步更新用户仓与迁移登记；否则采用方案 A。

---

## 6. 本记录与既有文档的关系

- 本记录与 `docs/governance/FILE-GOVERNANCE-2026-09-18.md` 互补：后者为变更判定，前者为二进制合规与 V2 命名的**后续处理登记**。
- 本记录第 1 节清单更正了旧报告中「25.6 MB」「5 张缩略图均被引用」等表述（实测为 25.57 MiB、仅 4/5 有引用）。
- 本记录第 5 节与旧报告 §5.3 第 2 项结论一致（属迁移断言未同步），并补充了推荐方案与影响面。
- **本记录未修改任何其他文件，未执行 `git add/commit`，未删除任何文件。**

## 7. 补充：Git 对象库内的受限二进制（本轮盘点新发现，P1）

> 本节为 2026-09-18 追加；属工作区之外的第二处二进制残留面，与上文 §1 的工作区清单**互不重叠**。

| 项 | 实测 |
|---|---:|
| `refs/copilot/checkpoints/**` 额外引用 | **16** 条（`git for-each-ref` 共 17 条，含 `refs/heads/master`） |
| 仅由这些引用可达的对象 | **333** 个（237 blob / 16 commit / 80 tree） |
| 仅由这些引用可达的 blob 体积 | **36.79 MiB** |
| 其中受限二进制 blob | **13** 个（5 图片 / 5 缩略图 / 3 OTF），与 §1 工作区清单同一批文件 |
| 其中工具会话状态 | `.mimosa/**` 35 个文件（4 个 checkpoint 快照内） |
| `.git` 目录总体积 | 24.80 MiB（loose object 538 个，无 pack） |
| 远端 | 无（`git remote -v` 为空，未外泄） |

**为何现有卫生用例检测不到**：`tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets` 的 `ignored_dirs` 集合**显式包含 `.git`**，因此该用例只扫工作区文件、不扫 git 对象库。这是当前红线的**检出盲区**，建议后续为卫生套件补一条「git 对象库零独占二进制」用例。

**处置方案（破坏性操作，待用户确认）**：

```powershell
git for-each-ref --format="%(refname)" refs/copilot/ | ForEach-Object { git update-ref -d $_ }
git reflog expire --expire=now --all
git gc --prune=now
```

- 预期效果：`git rev-list --all --not master` 归零；`git count-objects -vH` 体积由 24.80 MiB 显著下降；`git rev-list --objects --all` 中不再出现上述 13 个二进制 blob。
- **前置**：`refs/copilot/checkpoints/**` 为 Copilot 工具会话检查点，删除前请确认无保留价值；如需留档，可先 `git bundle create <file> --all` 备份到仓库之外。
- 验证：处置后重跑 §1 的清单命令，工作区 13 项仍在（属另一裁决项，见 §2），但对象库侧应归零。


---

## 8. 用户裁决与落地结果（2026-09-18）

用户已就本文档 §2/§3/§5 的待裁决事项给出明确口径，实施结果如下：

### 8.1 二进制资源（对应 §2/§3/§4）

**用户裁决原文**：「字体只能引入那 3 个思源黑体（开源的），其他图片别引入了。」

- **采纳口径**：§3 方案（b）的**收窄版** —— 不再为图片开白名单，改为**只保留 3 个开源思源黑体**，其余图片一律不入库。
- **§2/§3 中方案的相应调整**：方案（a）的「字体改 CDN」不被采纳（字体保留本地）；方案（b）的白名单**只包含 3 个 OTF 路径**，**不包含任何图片**。
- **§1 清单中的 12 个图片资源已全部清理**：

| 目录 | 清理结果 |
|---|---|
| `src/gods_workbench/static/images/` | 7 个文件全部删除（`logo.png`、`modelscope.gif`、`modelscope-1.gif`、`RunningHub-B.png`、`RunningHub-W.png`、`volcengine-theme-dark.svg`、`volcengine-theme-light.svg`） |
| `src/gods_workbench/static/runninghub/thumbnails/` | 5 个 jpg 全部删除 |

- 备份位置：`%TEMP%\gw-image-purge-20260918-090155\`（含 `MANIFEST.txt`，12 条 SHA-256 已复核一致）。
- 引用已同步清理：10 个页面 favicon 行、`js/asset-share.js`（2 处）、`static/angle.html`（1 处）、`static/zimage.html`（1 处）、`js/api-settings.js`（6 处，改为 `provider-logo-fallback` 文本占位）、`runninghub/api_providers.json`（4 个 `thumbnail` 键）。
- **保留清单（最终）**：

| 资源 | 字节数 | 说明 |
|---|---:|---|
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf` | 9,036,076 | 开源思源黑体，用户指定 |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf` | 8,812,324 | 同上 |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf` | 8,806,392 | 同上 |
| **合计** | **26,654,792** | 约 25.42 MiB |

- **红线与用例已同步修订**：`AGENTS.md` §1.2 改为「二进制资源授权边界 + 唯一白名单（3 个 OTF 精确路径）」；`tests/hygiene/test_cleanroom_hygiene.py` 与 `tests/hygiene/test_phase6_deep_hygiene.py` 增加 `ALLOWED_BINARY_ALLOWLIST`，白名单外仍严格拦截。`.svg` 未列入 `BANNED_EXTENSIONS`（文本资源）。

### 8.2 V2 命名基线（对应 §5）

**用户裁决原文**：「D3，改断言。」

- **采纳方案 A（改断言）**，实施如下：
  - `tests/contracts/test_projects_hub_service.py:117` → `assert "影视工坊" in resp_workshop.text`
  - `tests/smoke/test_production_smoke.py:55` → `assert "影视工坊" in resp_workshop.text`
- 两处注释同步改为「V2 影视工坊工作台」。
- 后端引擎命名（`god_canvas` 模块、`routes_god_canvas.py` 等）**保持不变**。
- 实测：上述两个测试文件 **5 passed**。

### 8.3 收口后的测试基线（实测）

| 项 | 值 |
|---|---|
| 命令 | `python -m pytest -q --no-header -p no:cacheprovider` |
| 结果 | **1 failed / 39 passed** |
| 唯一失败 | `tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers`（§2.3 旧集成标记基线，专项未完成，与二进制/命名裁决无关） |
| 相对此前 | 由 5 failed / 35 passed 收敛至 1 failed / 39 passed（4 项失败已按裁决消除） |

### 8.4 仍待处置（P1，破坏性操作，须用户确认）

§7 所述 `.git` 对象库内的 16 个 `refs/copilot/checkpoints/**` 引用（含 13 个独占二进制 blob，约 25.57 MiB）**尚在**，用户本轮未就该破坏性操作表态，保持待裁决（见 `docs/governance/TASKS.md` T12）。

## 9. 后续状态更新（2026-09-20）

- §8.4 记录的「16 个 `refs/copilot/checkpoints/**` 引用 / 13 个独占二进制 blob / 约 25.57 MiB **尚在**、保持待裁决」：**已于 2026-09-19 获用户明确授权并执行完成**——先做仓外完整 bundle 备份（`C:\Users\qinxuedong\AppData\Local\Temp\godswb-clear-all-20260919-220743.bundle`，25,127,364 字节 / SHA-256 `8000090F…9F9A2` / `git bundle verify` = `is okay` / 含 18 个 ref），再清理引用；**清理后全仓仅剩 3 个白名单 `.otf`**。
- §8.3 的唯一失败用例 `tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers`：已随 **T13 基线重定义**转绿，全量 `pytest` **40 passed**（本地）。
- 证据边界：均为**本地**门禁与**本地**提交（洁净室仓 `7643fd6` 之前为 `abd0e88`；T13 为 `28c23bf` + `996c3ba`）；**未 push、未跑远端 CI、未做生产验收**，**不等于生产就绪**。
- 指针：`TASK-NOTES-2026-09-18.md` §2（T12）、§4.1（T13）。本文档 §8.4 / §8.3 原文保留不改。

