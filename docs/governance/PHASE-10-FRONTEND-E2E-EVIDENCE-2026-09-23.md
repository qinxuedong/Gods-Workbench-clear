# Phase 10 前端真实浏览器 E2E 核验证据（2026-09-23）

> **执行主体**：主代理（本仓内执行，**非**外部第三方）。本文件只登记**可复现的渲染期证据**，
> 不构成生产验收、不构成公开发布授权。
> **基线**：`41d232b`（六项裁决落地后的 HEAD）；提交本文件后 SHA 随之变化。
> **上位口径**：`AGENTS.md`、`CLEANROOM-STATUS.md`、`HANDOFF-10.md`、`docs/governance/TASKS.md`。

---

## 1. 为什么需要这一项

`HANDOFF-9.md` §6 与 `HANDOFF-10.md` §4 均把「**前端真实浏览器 E2E 未执行**」列为未闭环项。
此前全部 Phase 10 门禁都建立在 FastAPI `TestClient` 之上，属**进程内**验证：

| 维度 | TestClient 能证明 | TestClient 不能证明 |
|---|---|---|
| HTML 可达 | ✅ 状态码与关键文案 | 浏览器里样式是否真的生效 |
| 静态资源 | ✅ 单个路径 200 | 页面真实引用的脚本/样式是否全部 200 |
| 前端逻辑 | ❌ | 是否存在未捕获 JS 异常 |
| 死类修正（O5） | ❌ | `py-0.5` 是否渲染出 2px 内边距 |

本项用**真实 Chromium**补齐上述缺口，并把核验固化为可复现工具。

---

## 2. 复现入口

```powershell
# 1) 自起服务再跑（脚本会以 GW_RELOAD=false 启动 run.py）
python -P tools/frontend_e2e_smoke.py --serve

# 2) 指向已在运行的 2077 服务
python -P tools/frontend_e2e_smoke.py --base-url http://127.0.0.1:2077
```

- 工具：`tools/frontend_e2e_smoke.py`（本轮新增，未接入 CI——CI 不安装 Playwright）。
- 受检页面：`v2/` 壳层全部 9 页（与 `v2-shell.js` 的 `ROUTES` 一致）。
- 产物（截图 + `e2e-report.json`）默认落在**系统临时目录**，**绝不写入仓库**
  （`AGENTS.md` §1.2 禁止仓库内图片/二进制资产；脚本对指向仓库静态目录的输出会直接拒绝）。

---

## 3. 判定口径（每页独立，全部 fail-closed）

1. `networkidle` 期间 **零 `pageerror`**（未捕获 JS 异常）。
2. 同源 `/static/**` 响应 **零 4xx/5xx**。
3. 每个 API 4xx/5xx 的归一化路径**必须已在冻结缺口基线中登记**（`KNOWN_IMPLEMENTED` ∪ `KNOWN_UNIMPLEMENTED`）。
   脚本**直接 import** 守卫 `tests/contracts/test_phase8_frontend_backend_api_gap.py` 读取基线，
   不再抄一份清单（避免历史「三处各写一遍并漂移」的教训）。出现基线外的新 4xx 即判 FAIL。
4. 渲染期 O5 实证：带 `py-0.5` 的元素其 computed `padding-top`/`padding-bottom` 必须均为 `2px`；
   且页面内**不得**残留死类 `py-0.2` 元素。

---

## 4. 本轮实测结果（HEAD `41d232b`，本机）

命令：`python -P tools/frontend_e2e_smoke.py --base-url http://127.0.0.1:2077`

```
[e2e] 冻结基线已加载：实现 49 / 未实现 140（唯一口径：tests/contracts/test_phase8_frontend_backend_api_gap.py）
[e2e] /healthz = {"status":"ok","mode":"cleanroom","auth_mode":"local","oidc_ready":false,
                  "frozen_contracts":false,"release_authorized":false}
[e2e] index.html       jsError=0 staticFail=0 api4xx=3 py05=21/21
[e2e] projects.html    jsError=0 staticFail=0 api4xx=0 py05=40/40
[e2e] production.html  jsError=0 staticFail=0 api4xx=0 py05=28/28
[e2e] workshop.html    jsError=0 staticFail=0 api4xx=2 py05=14/14
[e2e] storyboard.html  jsError=0 staticFail=0 api4xx=0 py05=26/26
[e2e] agents.html      jsError=0 staticFail=0 api4xx=0 py05=9/9
[e2e] settings.html    jsError=0 staticFail=0 api4xx=6 py05=5/5
[e2e] assets.html      jsError=0 staticFail=0 api4xx=3 py05=2/2
[e2e] collab.html      jsError=0 staticFail=0 api4xx=6 py05=2/2
[e2e] 判定：PASS（零 JS 异常 / 零静态资源失败 / 零基线外 API 4xx / py-0.5 全部生效）
```

退出码 `0`；`e2e-report.json` 中 `failures = []`。

### 4.1 API 4xx 明细（全部已在冻结基线中登记，无一项越界）

| 页面 | 4xx 路径 | 基线归类 |
|---|---|---|
| index | `/api/asset-registry/assets`、`/api/asset-registry/status` | 未实现（fail-closed） |
| index | `/api/providers` | 已实现，未带会话 → 401（预期） |
| workshop | `/api/episode-pipelines` | 未实现（fail-closed） |
| settings | `/api/app-info`、`/api/asset-auth/teams`、`/api/asset-auth/users`、`/api/asset-registry/preferences/team`、`/api/asset-registry/status` | 未实现（fail-closed） |
| settings | `/api/providers` | 已实现，未带会话 → 401（预期） |
| assets | `/api/asset-registry/assets` | 未实现（fail-closed） |
| assets | `/api/asset-library`、`/api/storage-settings` | 已实现，未带会话 → 401（预期） |
| collab | `/api/asset-auth/operation-approvals`、`/api/asset-auth/teams`、`/api/asset-auth/users` | 未实现（fail-closed） |
| collab | `/api/observability/events`、`/api/observability/tasks` | 已实现，未带会话 → 401（预期） |

**口径说明（重要）**：上表 401 来自**未携带会话 Cookie**的匿名访问，属契约要求的认证行为；
404 来自**契约明确未授权实现**的端点（`CANVAS-CLOSURE-INTERFACE-CATALOG.yaml` 的
`forbidden_neighbors` 区块列明「未授权端点保持 404/405」）。
**两者都不是缺陷**，也不需要伪造数据去消除——前端以显式降级标记（「未接入」）呈现，这是设计行为。

### 4.2 O5 渲染期实证

`py-0.5` 命中元素在 9 页全部取得 `padding-top: 2px / padding-bottom: 2px`（命中数 = 生效数），
且 `py-0.2` 死类元素为 **0**。这是「`py-0.2` → `py-0.5` 修正确实在浏览器里生效」的直接证据，
补上了 `TestClient` 无法给出的最后一环。

### 4.3 401 标识符的字节级复核（P10-R-1 联动）

真实服务返回的 401 错误码经 `.encode().hex().upper()` 判定：

```
/api/providers           401 code bytes = 554E415554484F52495A4544  (纯 ASCII 大写 UNAUTHORIZED)
/api/asset-library       401 code bytes = 554E415554484F52495A4544
/api/storage-settings    401 code bytes = 554E415554484F52495A4544
/api/observability/events 401 code bytes = 554E415554484F52495A4544
/api/observability/tasks 401 code bytes = 554E415554484F52495A4544
```

即**运行时**行为（HTTP 响应）与 `core/errors.py`、黄金夹具、契约侧更正后的口径完全一致。

---

## 5. 边界声明（**不得越读**）

1. 本项为**本机真实浏览器**核验，**不等于**远端 CI（CI 无 Playwright，本脚本不入 CI），
   更**不等于**生产验收或发布授权。
2. 本文件 §1–§5 覆盖 **`v2/` 壳层 9 页的加载期行为**（导航、静态资源、初始脚本、初始 API 调用）；
   §6 追加 **7 项确定性交互 smoke**。**完整交互矩阵仍未覆盖**（表单写入、CAS 409 用户可见提示、
   `202 Accepted` + `poll_hint` 轮询收敛、403 只读降级、跨页状态保持、多窗口并发），这些仍需独立用例。
3. 「零 JS 异常」只证明**未捕获异常为 0**；控制台 error 级日志仍存在（主要是上述预期 4xx），
   脚本单独计数但**不**把它们伪装成 0。
4. 未闭环项以 `HANDOFF-10.md` §4 为准。本文件把其中的「前端真实浏览器 E2E」由**未执行**推进为
   「**加载期已闭环 + 交互期确定性 smoke 已闭环；完整交互矩阵仍未执行**」。
---

---

## 6. 交互期 E2E（本轮追加，已实测；提交 `e5fd4cc02a2daa165938143b84582cdeffd4f540`，CI run `35846070233`）

§6 只覆盖**加载期**。本节把覆盖推进到**交互期**：在真实 Chromium 里执行确定的用户动作，
断言**真实 DOM 变化**（而非「没抛异常」），并沿用同样的 fail-closed 口径。

### 6.1 受测交互与断言（7 项）

| # | id | 页面 | 动作 | 断言（真实渲染期） |
|---|---|---|---|---|
| 1 | `projects-view-table` | projects | 点 `#viewBtnTable` | `#projectTableView` 去掉 `hidden` 且 `#projectsGridViewContainer` 带上 `hidden` |
| 2 | `projects-view-grid-restore` | projects | 点 `#viewBtnGrid` | 反向复原（可逆性） |
| 3 | `projects-search-empty-state` | projects | 输入不存在的关键字并派发 `input` | `.project-card-item` 归零**且**容器文案含「未检索到」（搜索真的过滤了 DOM） |
| 4 | `projects-search-restore` | projects | 清空关键字 | `.project-card-item` 恢复 > 0 |
| 5 | `index-settings-view-and-theme-toggle` | index | 调 `V2Home.switchView('settings')` | `#v2MainSettings` 可见、`#themeToggle.onclick` 已绑定，且**连点两次** `on` 类先变后回到初值 |
| 6 | `settings-section-switch` | settings | 点 `[data-section="permissions"]` | 按钮与 `[data-panel="permissions"]` 同时 `active`，且 panel 的 computed `display !== none` |
| 7 | `nav-projects-to-workshop` | projects | 点导航 `a.nav-pill-btn[title="影视工坊"]` | 真实跳转，且路径以 `/static/v2/workshop.html` 结尾（含 query 一并容错） |

### 6.2 实测结果（HEAD `41d232b` 代码基线）

```
[e2e] 交互期：7/7 项通过
    - projects-view-table                passed=True
    - projects-view-grid-restore         passed=True
    - projects-search-empty-state        passed=True
    - projects-search-restore            passed=True
    - index-settings-view-and-theme-toggle passed=True
    - settings-section-switch            passed=True
    - nav-projects-to-workshop           passed=True
[e2e] 判定：PASS（零 JS 异常 / 零静态资源失败 / 零基线外 API 4xx / py-0.5 全部生效）
```

交互期 7 项全程 `pageerror = 0`，且未产生任何基线外的 API 4xx。退出码 `0`。

### 6.3 变异测试（证明断言非恒真）

把 `projects-search-empty-state` 的断言改成 `cards === 999`（必然为假），复制为仓内临时变异体后执行：

```
    - projects-search-empty-state        passed=False 断言返回假值
[e2e] 判定：FAIL
MUTANT_EXIT=1
```

即**断言确实能失败**，7/7 的通过不是恒真产物。变异体已删除（`git status` 无残留），仓库未受影响。

### 6.4 过程中的自我纠错记录（如实登记）

首轮编写本节时，我（主代理）先写了 7 项断言，实测**只有 4/7 通过**，暴露的是**断言写错**而非产品缺陷：

1. `#topbarToggle` **不存在**——真实控件是 `#themeToggle`。且它位于 `#v2MainSettings`（默认
   `hidden`），其绑定代码 `initSettingsModule()` 仅在切到设置视图时执行。故正确前置条件是
   「先切设置视图再点」，而非「在仪表盘直接点」。
2. 设置分区按钮**不写** `aria-pressed`（实测为 `null`），原断言用 `aria-pressed === 'true'` 必然失败；
   改为断言 `active` 类 + panel 的 computed `display`。
3. 导航真实 URL 带 query（`workshop.html?project_id=prj-0001`），原 `url.endswith('.html')` 断言失败；
   改为按**路径**比较。

这三处都是**我的断言口径错误**，产品行为本身正确。已按真实 DOM 改写断言并全量复跑。

### 6.5 边界（**不得越读**）

- 本节是**确定性交互的 smoke**，不是完整交互测试矩阵。**未覆盖**：
  表单写入（新建/编辑项目、上传素材）、CAS 冲突交互（409 版本冲突的用户可见提示）、
  轮询闭环（`202 Accepted` + `poll_hint` 后的任务状态收敛）、权限降级（403 只读态）、
  跨页状态保持、多窗口并发。
- 上述未覆盖项仍需**独立用例 + 真实后端状态**，不得因本节通过而宣称交互期全部闭环。
- 本机实测 ≠ 远端 CI（本脚本不入 CI）≠ 生产验收 ≠ 发布授权。
