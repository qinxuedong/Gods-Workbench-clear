# V2 统一入口整合设计与执行计划（2026-09-26）

> 状态：调研完成，按本计划顺序执行。目标是让用户从 V2 工作台进入全部业务能力，不再从产品 UI 独立打开根级旧页面；内部 iframe 仅作为 V2 页面内的实现边界，不作为用户入口。
>
> 当前工作树已有本地账户认证等未提交改动，本计划只触碰统一入口相关文件，不回退或覆盖其他改动。

## 1. 当前事实与证据

### 1.1 页面清单

- V2 页面：`index.html`、`projects.html`、`production.html`、`agents.html`、`storyboard.html`、`assets.html`、`collab.html`、`settings.html`、`workshop.html`。
- 根级旧页面：`asset-manager.html`、`api-settings.html`、`canvas-list.html`、`episode-pipeline.html`、`governance.html`、`task-center.html`、`asset-share.html`。
- FastAPI 根路径当前 307 到 `/static/v2/projects.html`；静态目录由 `StaticFiles` 直接暴露。

### 1.2 当前重复/独立打开证据

- `/static/v2/assets.html` 在 `src/gods_workbench/static/v2/assets.html:214` 通过 iframe 加载 `/static/asset-manager.html?embedded=1&vault=1`。
- `/static/v2/settings.html` 在 `src/gods_workbench/static/v2/settings.html:566` 通过 iframe 加载 `/static/api-settings.html?embedded=1`。
- `/static/v2/storyboard.html` 通过 iframe 加载 `/static/canvas-list.html`。
- `/static/v2/workshop.html` 通过 iframe 加载 `/static/episode-pipeline.html`。
- `src/gods_workbench/static/v2/js/v2-shell.js` 只拦截 V2 导航链接；根级页面的 `target="_blank"`、`window.location` 和独立 href 不受统一壳管理。
- 已发现的产品级独立入口包括：V2 首页/项目页/设置页/硬件遥测中的 `asset-manager.html`、`api-settings.html`、`governance.html`，协作页中的 `task-center.html`，首页资产卡片中的 `asset-manager.html#asset=...`，智能体/资产管理器中的 `episode-pipeline.html`。

## 2. 目标状态

1. `/` 继续进入 V2 项目中心，所有用户可见导航只指向 `/static/v2/**`。
2. 根级旧 URL 不再是产品入口：普通直接访问统一 307/308 到对应 V2 路由，并保留 `project_id`、`pipeline_id`、`asset_id`、`view`、`step` 等上下文。
3. `embedded=1` 的根级页面继续作为 V2 内部 iframe 实现，不能重定向，避免 iframe 循环。
4. V2 内的“独立窗口”“打开完整视图”“↗”等文案全部改为 V2 同壳内导航；不得新增 `target="_blank"` 指向本应用页面。
5. 资产、设置、画布、剧本流水线、任务、治理的旧功能入口分别落到 V2 `assets/settings/storyboard/workshop/collab/projects` 上；不足部分在 V2 对应页面增加明确的内部面板或状态，不伪造已接入能力。
6. 公共素材审阅链接保持 token 深链可用，但入口壳改为 V2 兼容视图或明确保留“公共分享深链”例外，不要求登录，不泄漏 token。

## 3. 执行阶段

### 阶段 A：路由与入口契约

- 新增统一入口映射/重定向规则，集中定义根级旧页面到 V2 路由的映射。
- 对 `embedded=1`、公共分享 token、V2 内部 iframe 做明确分支。
- 补充契约测试：旧入口重定向、查询参数保留、内嵌页面仍 200、根路径仍进入 V2。

### 阶段 B：V2 内导航收口

- 移除所有本应用页面的 `target="_blank"` 和直接根级 href。
- 统一改为 V2 同壳路由，并保留业务上下文。
- 为 `settings` 增加 `section=api-settings` 等深链激活；为 `collab` 统一任务/日志视图；为 `projects` 统一回收站/治理视图。
- 首页资产卡片改为 `v2/assets.html?asset_id=...`，不再跳出到根级资产管理页。

### 阶段 C：内部 iframe 边界收口

- 仅保留 V2 页面内部对根级功能切片的 iframe 引用。
- 去掉“独立窗口/完整视图”误导性文案。
- 增加 iframe 加载失败、未接入和返回 V2 的明确状态。
- 不复制旧仓实现，不把 `PLUGIN-PROTOCOL-SPEC.md` 引入运行时。

### 阶段 D：验证与独立审核

- 先运行定向静态入口/路由测试，再运行完整 `pytest -v`。
- 用浏览器验证：根路径、每个 V2 导航、资产/设置/画布/工坊 iframe、旧 URL 重定向、查询参数和浏览器后退。
- 由独立审核代理检查：仍存在的本应用 `target=_blank`、根级用户入口、重定向循环、上下文丢失、公共分享回归、洁净室与未提交改动污染。

## 4. 页面归宿矩阵

| 根级页面 | V2 归宿 | 内部实现 | 直接访问策略 |
|---|---|---|---|
| `asset-manager.html` | `v2/assets.html` | 资产管理器 iframe | 普通访问重定向；`embedded=1` 保留 |
| `api-settings.html` | `v2/settings.html?section=api-settings` | API 设置 iframe | 普通访问重定向；`embedded=1` 保留 |
| `canvas-list.html` | `v2/storyboard.html?view=canvas` | 画布 iframe | 普通访问重定向；`embedded=1` 保留 |
| `episode-pipeline.html` | `v2/workshop.html` | 工坊流水线 iframe | 普通访问重定向；内部参数保留 |
| `task-center.html` | `v2/collab.html?view=tasks|logs` | 协作页任务/日志面板 | 普通访问重定向 |
| `governance.html` | `v2/projects.html?openTrash=1` 或 V2 治理面板 | 项目中心治理/回收站 | 普通访问重定向；能力不足必须明示 |
| `asset-share.html` | V2 公共分享深链视图 | 公共审阅切片 | token 深链必须保留匿名访问，禁止强制登录 |

## 5. 验收门槛

- 静态源码扫描：产品 UI 中不存在指向根级本应用页面的 `target="_blank"`；只允许 V2 内部 iframe 和公共分享兼容边界。
- 路由测试：旧入口、V2入口、嵌入参数、项目上下文、公共 token 均有明确结果；不允许 200 空白或重定向循环。
- 行为测试：所有 V2 入口同一标签/同一壳导航，后退可用，iframe 失败可见，状态不伪造。
- 全量质量门禁：`pytest -v`；黄金夹具、防污染、认证、生产冒烟全部通过。
- 结果说明必须区分：代码/测试通过、浏览器本地验证、未完成的生产验收。

## 6. 风险与回滚

- 风险：重定向会影响 V2 iframe；通过 `embedded=1` 明确绕过。
- 风险：旧页面 query/hash 语义不同；每条映射必须显式白名单复制参数，禁止盲拼接。
- 风险：公共分享 token 是路径段，不得记录到日志或错误文案；公共分享保持独立认证边界。
- 回滚：仅回滚本阶段新增的入口映射、V2 链接和测试；不触碰已有本地账户认证改动。

## 7. 执行记录（2026-09-26）

### 7.1 已完成

- 阶段 A：`app.py` 新增根级业务入口到 V2 的集中映射；普通访问 307，`embedded=1` 返回内部切片；白名单保留项目、资产、画布、任务和工坊上下文。
- 阶段 B：V2 用户导航、首页资产卡片、设置/协作/治理入口已收口到 `/static/v2/**`，不再使用本应用根级页面作为普通入口。
- 阶段 C：资产、设置、画布、工坊仅保留内部 iframe；fallback 均带 `embedded=1`，资产管理器使用 `URL.searchParams` 合并上下文，避免双问号破坏嵌入边界。
- 阶段 D：新增 `tests/contracts/test_v2_unified_entry.py`，覆盖重定向、参数、iframe、公共分享例外、静态入口扫描和文案；定向测试 `7 passed`。
- 浏览器验证（2077 实际服务）：根路径进入 `/static/v2/projects.html`；旧资产入口进入 `/static/v2/assets.html`；旧画布入口保留 `view=canvas`；资产 V2 页面内部 iframe 实际加载 `asset-manager.html?embedded=1`。
- 独立审核代理（GPT-6-Astra high）已完成复审，最后发现的双问号 P1 已修复并确认关闭。

### 7.2 验证结论

最新 `pytest -v` 结果为 `597 passed, 7 skipped`，全量质量门禁通过。

已重启 2077 服务并完成真实浏览器验证：根路径、全部旧业务入口、参数保留和 V2 内部 iframe 均已验证。

### 7.3 公共分享边界

`/static/asset-share.html` 保持匿名公共分享深链，不纳入普通应用导航重定向；这是计划中明确的公共分享例外，不代表普通业务页面仍可独立打开。
