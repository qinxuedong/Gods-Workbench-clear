# 经典版移除方案（2026-09-18）

> 目标：删除 V2 界面右上角「经典版」入口及其指向的经典（V1）页面，只保留 V2 前端。
> 依据：AGENTS.md 第 5 条（破坏性操作需人工确认）；本次执行前用户已在会话中明确授权。

## 一、已完成：移除「经典版」按钮

已从 9 个 V2 页面删除 `<a>…经典版…</a>` 区块：

| V2 页面 | 原按钮目标 |
|---|---|
| v2/index.html、v2/agents.html、v2/assets.html、v2/collab.html、v2/production.html、v2/storyboard.html | /static/home.html |
| v2/projects.html | /static/project-board.html |
| v2/settings.html | /static/settings.html |
| v2/workshop.html | /static/episode-pipeline.html（id=classicPipelineLink） |

## 二、经典页面删除边界（逐文件判定）

### 2.1 删除（经典专属）

| 文件 | 依据 |
|---|---|
| `static/index.html` | V1 单页壳（4261 行），仅自身引用；头部即为跳转脚本 |
| `static/home.html` | V1 首页；实际引用仅 `index.html:2328` 与 `hardware-design-system.css:128`（CSS 抑制规则） |
| `static/gpt-chat.html` | 仅被 `home.html:42`、`index.html:2337` 引用 |
| `static/project-board.html` | V1 项目板；引用为 `index.html:2329,2915`、`js/episode-pipeline.js:2359`、`v2/js/projects-controller.js:768`（classic 分支） |
| `static/settings.html` | 经典版精简设置页（609 行）；`v2/settings.html`（746 行，5 分区）为其超集 |
| `static/js/home.js`、`static/css/home-project-preview.css` | 仅 `home.html` 引用 |
| `static/js/project-board.js` | 仅 `project-board.html` 引用 |
| `static/js/i18n/home.js`、`static/js/i18n/project-board.js` | 仅被 `js/i18n.js` 模块列表引用，对应页面删除后成孤儿 |
| `static/js/workspace-context.js`、`static/js/workspace-topbar-void.js` | 仅 `index.html` 引用 |
| `static/images/gods-workbench-wordmark.svg` | 仅 `index.html` 引用 |

### 2.2 保留（原因）

| 文件 | 原因 |
|---|---|
| `static/episode-pipeline.html` | **V2 workshop 的主体内嵌页**（`v2/workshop.html:966,972`），删除会直接打断 V2 制片工作台 |
| `static/v2/settings.html` | V2 设置页，经典按钮删除后成为唯一设置入口 |
| `static/css/signal-flow.css`、`css/workspace-pages.css`、`vendor/js/lucide.js`、`js/theme.js`、`js/hardware-telemetry.js`、`js/settings.js`、`js/workspace-common.js`、`js/floating-dismissal.js` | 被保留页面（含 V2）继续引用，属共享资源 |
| `static/canvas.html`、`canvas-list.html`、`smart-canvas.html`、`asset-manager.html`、`task-center.html`、`governance.html`、`angle/enhance/klein/online/video/zimage.html` 及配套 css/js | 被 V2 自身导航引用（`v2/storyboard.html` 工具轨、`v2/projects.html`、`v2/collab.html` 等），非经典版专属，删除会打断 V2 功能；如需进一步收敛须另行确认 |

## 三、残留引用同步清理（必做）

| 位置 | 现状 | 处理 |
|---|---|---|
| `v2/workshop.html:625` | 选择器含已删的 `#classicPipelineLink` | 从选择器移除该 id |
| `v2/js/projects-controller.js:767-768` | `else if (target === 'classic')` → `/static/project-board.html` | 删除该分支 |
| `js/episode-pipeline.js:2355-2361` | `gotoProjectBoard()` → `project-board.html` | 改跳 `/static/v2/projects.html` |
| `js/canvas.js:31`、`js/smart-canvas.js:15` | 设置跳转指向 `/static/settings.html` | 改为 `/static/v2/settings.html` |
| `js/hardware-telemetry.js:696` | 「通用偏好」卡片指向 `/static/settings.html` | 改为 `/static/v2/settings.html` |
| `css/hardware-design-system.css:128` | `a[href="/static/home.html"]` 抑制规则 | 删除该规则 |
| `js/i18n.js:12,18` | 模块列表含已删 i18n 字典 | 移除两条 |
| `css/signal-flow.css:935` | 注释提及 home.html | 更新注释文案 |

## 四、测试门禁同步

`tests/hygiene/test_cleanroom_hygiene.py` 的 `forbidden_markers` 含 `settings.html`、`project-board.html`、`asset-manager.html`、`comfyui`、`runninghub`、`lucide`、`/api/asset-auth` 等，与「保留 V2 可达页面」的现状冲突，需按新基线收敛；`tests/hygiene/test_phase6_deep_hygiene.py` 的 `static/index.html` 断言分支在删除后自动跳过。


---

## 五、执行结果（2026-09-18 收尾）

### 5.1 已删除（11 个，与第 2.1 节一致）

`static/index.html`、`static/home.html`、`static/gpt-chat.html`、`static/project-board.html`、`static/settings.html`、`static/js/home.js`、`static/js/project-board.js`、`static/js/i18n/home.js`、`static/js/i18n/project-board.js`、`static/css/home-project-preview.css`、`static/images/gods-workbench-wordmark.svg`

删除前哈希与字节数已登记至 `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 的「经典版（V1）页面删除登记」区块。

### 5.2 已清理的 8 处残留引用（与第 3 节一致）

全部完成并通过 `node --check`。另额外修正 `v2/js/home-controller.js:406` 一处过时注释（仍提及 `/static/project-board.html`）。

### 5.3 复核结论

- 坏链扫描（`href`/`src` 指向 `/static/…` 缺失资源）：**0 条**
- 代码中引用已删 11 文件的残留：**0 条**（仅方案文档与 provenance 登记保留记录）
- `static/episode-pipeline.html`、`static/v2/settings.html` 均完好保留

### 5.4 测试基线现状（`python -m pytest -q`）

5 failed / 35 passed。逐项归因：

| 失败用例 | 归因 |
|---|---|
| `tests/hygiene/test_cleanroom_hygiene.py::test_no_banned_binary_assets` | **既有**：保留资源中仍有 `logo.png`、`modelscope*.gif`、`RunningHub-*.png`、`runninghub/thumbnails/*.jpg`、3 个 `.otf` 字体（合计 13 项），与本次删除无因果关系 |
| `tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets` | **既有**：同上 13 项 |
| `tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers` | **部分既有**：本次删除使其违规条目由 198 降至 173（减少 25 条），但 `lucide`/`comfyui`/`runninghub`/`/api/asset-auth` 等标记来自**保留的 V2 页面与共享资源**，需另立基线收敛任务 |
| `tests/contracts/test_projects_hub_service.py::test_api_static_and_projects_integration` | **既有**：断言 `"god-canvas" in workshop.html`；当前迁移来的 workshop.html 不含该字符串（迁移前 HEAD 版本含、旧仓源不含），与本次删除无关 |
| `tests/smoke/test_production_smoke.py::test_production_smoke_frontend_static_routing` | **既有**：同上，同一断言 |

结论：**本次改动未引入新的测试回归**；上表 5 项在本次改动前即为失败或恒失败，需另案处理（二进制资源合规与 V2 命名基线）。


### 5.5 独立审核发现的问题及其修复（2026-09-18）

删除 V1 壳 `index.html` 后暴露出两处**运行时可回归**，均由独立审核代理人发现并经主控复核：

| # | 问题 | 证据 | 修复 |
|---|---|---|---|
| 1 | `js/task-center.js:1038` 调用 `navigate('project-board', …)`，`navigate()` 会拼出已删的 `/static/project-board.html`，任务中心「相关项目」跳转 404 | `js/workspace-common.js:50,65` 的 `/static/${standalonePage}.html` | 在 `navigate()` 增加 V2 路由别名映射 `{ 'project-board': 'v2/projects' }`，使目标落到 `/static/v2/projects.html` |
| 2 | `js/episode-pipeline.js:2357` 向父窗发送 `episode-open-project-board`，其监听方原本是**已被删除的 V1 壳**（`index.html:3218`）；删除后剧集流水线的「返回项目」失效 | 旧壳备份 `index.html:3218`；旧仓 `v2/workshop.html` 亦无此监听 | 在 `v2/workshop.html` 既有 message 监听内新增该类型分支，跳转 `/static/v2/projects.html` 并透传 `project_id` |

**连带清理**（同源过时残留，独立审核亦提及）：

| 位置 | 处理 |
|---|---|
| `v2/settings.html` 两处注释「经典版返回」 | 改为「系统状态」/「RAM 仪表与时钟」 |
| `v2/index.html`、`v2/settings.html`「默认启动页」下拉 | 选项值 `home`/`project-board`/`canvas` → `index`/`projects`/`storyboard`（对齐 V2 实际路由） |
| `v2/js/home-controller.js:914`、`js/settings.js:95` | fallback `'home'` → `'index'` |

修复后复扫：直接链接、`/static/${…}.html` 模板拼接、`navigate()` 三类引用**坏链合计 0**；`node --check` 全部通过；`python -m pytest -q` 维持 5 failed / 35 passed（与 5.4 节同因，均非本次引入）。
