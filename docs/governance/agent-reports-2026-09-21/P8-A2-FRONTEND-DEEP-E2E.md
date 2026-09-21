# P8-A2 全站前端深度巡检报告（2026-09-21）

> 角色：P8-A2 执行代理（主代理，见 §8 独立性边界）。
> 基线：本轮起点 `HEAD == origin/master == 721c00c48e7d42beda4d52e1b6c5625800546fea`；
> 执行期间出现**并发子代理越权推送** `019083ce019f3361e3f211a353cd339589ace892`（见 §8.3）。
> 扫描对象：`src/gods_workbench/static/` 下全部 `.html`（排除 `vendor/`），共 **16 页**。
> 手段：真实 `uvicorn.Server`（`GW_RELOAD=false`）+ 真实 Chromium（Playwright，
> `chromium-1234/chrome-win64/chrome.exe`，视口 1440x900，headless）。
> 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

---

## 1. 结论摘要

| 项 | 结果 |
|---|---|
| 覆盖页面 | **16 / 16** |
| `pageerror` 合计 | **0**（与 P7-A3 历史结论一致） |
| `console.error` 合计 | **63**（全部为「资源加载失败」类，逐条定性见 §4） |
| HTTP 4xx 合计 | **59**（400 × **1**，404 × **58**） |
| 非 4xx 的请求失败 | **2**（均为 Unsplash 外链图片被 ORB 拦截，既有登记项） |
| `data-lucide` 占位未渲染 | **0**（`svg.lucide` 与 `data-lucide` 逐页数量一致，见 §5.3） |
| **本轮新发现真实前端缺陷** | **1 个功能簇（3 个断言）**：`canvas-list` 画布列表**恒定加载失败** + 卡片 ID 退化为 `undefined`（§3，已修复） |
| 其余 4xx | **全部**为 P8-A1 已登记的「后端未实现端点」缺口，非新缺陷（交叉核对见 §5.2） |

**关键新结论**：`/static/canvas-list.html` 在真实后端下**从未成功加载过画布列表**。
这不是「后端没实现」——**后端 `GET /api/canvases` 早已实现且契约完备**，是前端调用方式违反契约：
缺 `project_id`（必填）→ 后端按契约返回 `400 INVALID_REQUEST`；且响应摄取未按契约字段归一化。
详见 §3（含修复前后对照）。

---

## 2. 方法与可复现入口

- 应用：`create_app()`（`src/gods_workbench/api/app.py`），`uvicorn.Server` 监听 `127.0.0.1:2481`。
- 采集：`pageerror` / `console`（error+warning）/ `response`（status ≥ 400，含完整 URL 与 method）/
  `requestfailed`（含 URL、failure 文本、resource_type）。
- 每页等待 2200ms 后统计 DOM：`data-project-id` / `data-lucide` / `svg.lucide` / `canvas` / `img`，
  并记录 `document.documentElement.dataset.canvasListReady`、`document.title`、`body.innerText` 前 300 字。
- 原始数据：`%TEMP%\gw-probe-20260921\p8a2b_scan.json`（脚本同目录 `p8a2b_scan.py`）。

```powershell
python %TEMP%\gw-probe-20260921\p8a2b_scan.py
```

---

## 3. 本轮发现的真实前端缺陷（已修复）

### 3.1 缺陷：`canvas-list` 画布列表恒定加载失败

**现象**（真实浏览器 + 真实后端，port 2481）：页面 `dataset.canvasListReady` 恒为 `error`，
总览脚注显示「**画布加载失败**」、「API 状态: **失败**」，画布卡片数为 **0**。

**根因（三条独立事实链）**：

1. `src/gods_workbench/static/js/canvas-list/api.js:39-41`（缺陷版本）：
   ```js
   listCanvases(init) {
       return request('/api/canvases', init);
   },
   ```
   **未携带 `project_id`**。而契约 `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml` 的
   `list_canvases.request_query.project_id` 为**必填**。
2. `src/gods_workbench/static/js/canvas-list.js:344-347`（缺陷版本）把两个请求**并发**发出：
   ```js
   const [pRes, cRes] = await Promise.all([
       canvasListApi().listProjects(),
       canvasListApi().listCanvases()
   ]);
   ```
   `project_id` 只有在**项目列表返回之后**才能确定，并发时**逻辑上不可能**带上该参数。
3. 契约 `list_canvases.response_200` 与黄金夹具 `docs/fixtures/canvas-workflow-minimal.json`
   使用 `canvas_id` / `project_id` / `mode`，而渲染路径读取 `id` / `project` / `kind`
   （如 `canvas-list.js:1011` `card.dataset.canvasId = c.id`），**摄取边界未归一化**。

**真实 HTTP 复现原文**（`uvicorn.Server` + `httpx`，端口 2473）：

```text
GET /api/canvases
   -> 400  {"detail":{"code":"INVALID_REQUEST","message":"请求参数不合法",
             "errors":[{"loc":["query","project_id"],"msg":"Field required","type":"missing"}]}}

GET /api/canvases?project_id=prj-0001
   -> 200  {"canvases":[{"canvas_id":"cv-0001","title":"基准工作流画布",
             "project_id":"prj-0001","version":1,"mode":"classic"}]}
```

**真实浏览器复现原文**（端口 2475，缺陷版本）：

```text
{ "ready": "error", "projectRows": ["prj-0001"], "canvasCards": 0,
  "overviewApiState": "待连接" }
REQ GET 400 http://127.0.0.1:2475/api/canvases
REQ GET 200 http://127.0.0.1:2475/api/asset-registry/projects?archived=false
REQ GET 404 http://127.0.0.1:2475/api/canvases/trash
```

**卡片 ID 退化的独立取证**（端口 2489，缺陷版本 + 用路由桩填入**契约形状**数据以隔离 400）：

```text
A) 契约形状数据（canvas_id/title/project_id/version/mode）:
{ "ready": "ready", "totalCount": "2", "canvasCards": 2,
  "canvasIds": ["undefined", "undefined"],
  "cardTitles": ["STANDARD\n基准工作流画布\n独立工作区\n0 节点\n--",
                 "STANDARD\n智能画布 B\n独立工作区\n0 节点\n--"] }
```

即：即便数据到位，`data-canvas-id` 也是字符串 `"undefined"`，项目归属被折叠到 standalone 桶。

### 3.2 修复内容（3 处，最小改动）

| 文件 | 改动 |
|---|---|
| `src/gods_workbench/static/js/canvas-list/api.js` | `listCanvases(projectId, init)` 改为请求 `` `/api/canvases?project_id=${encodeURIComponent(pid)}` ``；`pid` 为空时**不发请求**、直接返回明确的失败结果 |
| `src/gods_workbench/static/js/canvas-list.js` | 新增 `normalizeCanvas()`：在**摄取边界**把 `canvas_id → id`、`project_id → project`、`mode → kind` 归一化 |
| `src/gods_workbench/static/js/canvas-list.js` | `loadAll()` 由 `Promise.all` 并发改为**先 `await listProjects()`、确定 `currentProjectId` 后再 `await listCanvases(currentProjectId)`**，并 `.map(normalizeCanvas)` |

### 3.3 修复后真实浏览器实测（端口 2501，真实后端）

```text
{ "ready": "ready", "overviewSource": "CANVAS CLUSTER READY", "total": "1",
  "cards": 1, "canvasIds": ["cv-0001"], "projectRows": ["prj-0001"] }
请求：
   200 http://127.0.0.1:2501/api/asset-registry/projects?archived=false
   200 http://127.0.0.1:2501/api/canvases?project_id=prj-0001
   404 http://127.0.0.1:2501/api/canvases/trash
```

`ready` 由 `error` → **`ready`**；`canvasIds` 由 `["undefined"]` → **`["cv-0001"]`**。

> 剩余 404 `/api/canvases/trash` 属 P8-A1 已登记缺口，**本轮不改后端实现**。

### 3.4 配套契约守卫

`tests/contracts/test_phase8_canvas_list_ingest_contract.py`（纯 Python，5 用例）：
契约前置事实 2 条 + 修复断言 3 条（携带 `project_id`、`loadAll` 串行、摄取归一化）。

**对修复前文件确定失败**（隔离副本 `%TEMP%\gw-probe-20260921\pfx1\`，用 `git show HEAD:` 还原修复前两文件）：

```text
FAILED test_canvas_list_api_sends_project_id
FAILED test_canvas_list_load_all_is_sequential
FAILED test_canvas_list_normalizes_contract_fields_at_ingest
3 failed, 2 passed
```

---

## 4. 16 页逐页矩阵（原始数据）

| 页面 | pageerror | console.error | warn | 400 | 404 | reqfail | data-lucide | svg.lucide | data-project-id | canvasListReady |
|---|---|---|---|---|---|---|---|---|---|---|
| `api-settings.html` | 0 | 2 | 0 | 0 | 1 | 0 | 35 | 35 | 0 |  |
| `asset-manager.html` | 0 | 6 | 0 | 0 | 5 | 0 | 30 | 30 | 0 |  |
| `asset-share.html` | 0 | 1 | 0 | 0 | 1 | 0 | 1 | 1 | 0 |  |
| `canvas-list.html` | 0 | 2 | 0 | 1 | 1 | 0 | 26 | 26 | 1 | `error`（修复后 `ready`） |
| `episode-pipeline.html` | 0 | 3 | 2 | 0 | 3 | 0 | 0 | 0 | 0 |  |
| `governance.html` | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |  |
| `task-center.html` | 0 | 15 | 0 | 0 | 15 | 0 | 24 | 24 | 0 |  |
| `v2/agents.html` | 0 | 1 | 1 | 0 | 1 | 0 | 19 | 19 | 0 |  |
| `v2/assets.html` | 0 | 7 | 1 | 0 | 6 | 0 | 16 | 16 | 0 |  |
| `v2/collab.html` | 0 | 9 | 1 | 0 | 8 | 0 | 24 | 24 | 0 |  |
| `v2/index.html` | 0 | 4 | 1 | 0 | 4 | 0 | 88 | 88 | 1 |  |
| `v2/production.html` | 0 | 1 | 1 | 0 | 1 | 1 | 24 | 24 | 0 |  |
| `v2/projects.html` | 0 | 1 | 1 | 0 | 1 | 0 | 54 | 54 | 1 |  |
| `v2/settings.html` | 0 | 7 | 1 | 0 | 7 | 0 | 35 | 35 | 0 |  |
| `v2/storyboard.html` | 0 | 1 | 1 | 0 | 1 | 1 | 23 | 23 | 0 |  |
| `v2/workshop.html` | 0 | 2 | 1 | 0 | 2 | 0 | 33 | 33 | 0 |  |
| **合计** | **0** | **63** | **12** | **1** | **58** | **2** | — | — | — | — |

`console.error` 合计 63 条与 4xx 合计 59 条不等，差额来自：同一次失败请求在 DevTools 与
`console` 各计一次、以及 2 条 `requestfailed`（无 HTTP 状态）。逐条归类见 §5。

---

## 5. 失败请求分类（「未实现端点」vs「真实缺陷」）

### 5.1 分类口径

- **A 类（后端未实现，已登记）**：目标路径在 P8-A1 的 `KNOWN_UNIMPLEMENTED` 冻结集内 → 不属新缺陷。
- **B 类（真实前端缺陷）**：路径**已实现**却因调用方式错误而失败，或非 HTTP 层面的功能失效。
- **C 类（外部资源）**：第三方外链失败，属既有登记项。

### 5.2 与 P8-A1 冻结基线的交叉核对（逐条）

把浏览器实测的 **24 条去重非 2xx 路径**逐条回查 P8-A1 基线（当时为 177 条，两轮修正后为 **188** 条，见 §5.4 与 P8-A1 §8.3）：

```text
404 /api/app-info                                  在基线内
404 /api/asset-auth/operation-approvals            当时未收录 → **已修复，现已入集**
404 /api/asset-auth/status                         在基线内
404 /api/asset-auth/teams                          在基线内
404 /api/asset-auth/users                          在基线内
404 /api/asset-library                             在基线内
404 /api/asset-registry/assets                     在基线内
404 /api/asset-registry/governance/overview        在基线内
404 /api/asset-registry/preferences/team           在基线内
404 /api/asset-registry/status                     在基线内
400 /api/canvases                                  在基线内
404 /api/canvases/trash                            在基线内
404 /api/episode-pipelines                         在基线内
404 /api/observability/asset-volumes               在基线内
404 /api/observability/events                      在基线内
404 /api/observability/health                      在基线内
404 /api/observability/overview                    在基线内
404 /api/observability/series                      在基线内
404 /api/observability/sources                     在基线内
404 /api/observability/tasks                       在基线内
404 /api/prompt-libraries                          在基线内
404 /api/providers                                 在基线内
404 /api/public/shares/asset-share.html            >>> 基线未收录 <<<
404 /api/storage-settings                          在基线内
```

**2 条「当时基线未收录」的定性**（本轮新增发现，属 P8-A2 对 P8-A1 的补充；第 1 条已随 §5.4 缺陷 B 修复而入集）：

1. `/api/asset-auth/operation-approvals`（**无尾斜杠、无 id**）
   来源 `src/gods_workbench/static/v2/js/collab-controller.js:73`
   （`return '/api/asset-auth/operation-approvals?status=all&limit=100';`）与
   `src/gods_workbench/static/js/asset-auth/api.js:87`。
   P8-A1 的扫描器因 `asset-auth/api.js:87` 的**嵌套模板插值** `operation-approvals${suffix ? `?${suffix}` : ''}`
   把后缀折叠为 `{p}`，产出了 `...operation-approvals{p}` 这一**并不存在的路径**，
   真正的 `/api/asset-auth/operation-approvals`（**无后缀**）反而**未入集**。
   → 属**扫描器的覆盖缺口**（见 §5.4，**已修正**；修正后 `in scan set = True`），后端同样未实现该端点（A 类缺口）。
2. `/api/public/shares/asset-share.html`
   来源 `src/gods_workbench/static/js/asset-share.js:6`：
   `const token = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop()||'');`
   **直接以静态路径打开**时 token 退化为文件名 `asset-share.html`，
   于是请求 `/api/public/shares/asset-share.html` → 404。

### 5.3 「静默失败」专项

`data-lucide` 与 `svg.lucide` **逐页数量完全一致**（16/16 页，见 §4 两列），
即**不存在** Phase 7 修复过的「图标占位不渲染」类静默失败。

但存在**功能级静默失败**（页面不报错、也不提示，只是功能不生效）：

| 页面 | 静默失败表现 | 定性 |
|---|---|---|
| `governance.html` | 正文出现「**载入失败：Not Found**」（`/api/asset-registry/governance/overview` 404） | A 类缺口；页面已显示错误文案，**非静默** |
| `asset-share.html` | 显示「**无法打开分享 / Not Found**」 | 见 §5.5 定性 |
| `canvas-list.html` | **修复前**：脚注「画布加载失败」+ 空板，**无任何错误提示** | **B 类真实缺陷，已修复** |
| `task-center.html` | 15 条 404，但页面显示「总览数据暂不可用 / 等待真实数据」 | A 类缺口；有降级文案 |
| `v2/*` 各页 | `asset-auth/status` 404 → 静默降级为本地演示数据 | A 类缺口，**未改**（见 §7） |

### 5.4 P8-A1 扫描器的覆盖缺口（由本轮 E2E 反向发现）

P8-A1 报告 §6 自述「计数为静态下界近似」。本轮 E2E 反向暴露出扫描器的**三处缺陷**（A/B 由本轮 E2E 反向发现，C 经第二轮补修；现均已修正，
177/169 → **188/180**（缺陷 A/B 修后 180/172，缺陷 C 补 8 条 helper 拼接路径），详见 P8-A1 §8.3）：

1. 【**已修复**，缺陷 B】**插值拼接被误算为独立路径**（12 条「幽灵条目」）：
   `.../operation-approvals{p}`、`/api/asset-content{p}`、`/api/asset-registry/assets{p}`、
   `/api/episode-pipelines{p}`、`/api/asset-proxy/settings{p}`、`/api/asset-file-info{p}`、
   `/api/audio-waveform-data{p}`、`/api/asset-reviews/sessions{p}`、
   `/api/asset-registry/project-directory-templates{p}`、
   `/api/asset-content/versions{p}`、`/api/asset-content/versions/{p}{p}`、
   `/api/asset-library/categories/{p}{p}`。
   这些字符串源自 `` `${suffix ? `?${suffix}` : ''}` `` / `'${query}'` 这类**查询串拼接**，
   归一化后 `{p}` 与前一字符**粘连**，**并不是真实路径段**。
   根因并非提取器，而在 `_collapse_template()` 对**任何** `${...}` 都整体折叠为 `{p}`（已修：仅当 `${` 紧接 `/` 之后才视为路径占位）。
   同时它还**漏算**了真实基路径 `/api/asset-content/versions`、`/api/asset-file-info`、`/api/audio-waveform-data`。
2. **helper 拼接的真实调用被漏算**：`js/canvas-list/api.js` 用
   `canvasUrl(id) = `/api/canvases/${...}`` 再拼后缀，
   真实调用 `/api/canvases/{id}/meta`、`/api/canvases/{id}/touch`、`/api/canvases/{id}/purge`
   **均不在当时的 177 条集合内**（实测 `in scan set = False`）；该 helper 拼接类调用**已于第二轮纳入扫描器**（见 P8-A1 §6、§8.3 缺陷 C）。
3. 【**已修复**，缺陷 A】**2 个 JS 文件因提取器失明而整体漏扫**（含 `/api/` 但提取 0 条），另有 1 个文件严重少算：
   `js/asset-share/api.js`(1)、`v2/js/collab-controller.js`(4)；`asset-manager.js` 实测仅提取 1 条、实际 **23** 条。
   另有 `api-settings.html`(2)、`v2/index.html`(13)、`v2/settings.html`(7) 三处 `/api` 经逐处核实**全部位于 `<script>` 之外**
   （UI 文案 / 端点说明），非代码调用，属**合理排除**，不计入基线。
   主因：`_extract_api_literals()` **未跳过 JS 正则字面量**。正则内部可含未转义引号
   （如 `/[&<>"']/g`），提取器把该引号当作**字符串起始**，把后续大段代码**整体吞并**，
   从而跳过其中所有 `/api` 引用。**另一根因**：模板串 `${}` 内嵌套反引号（如 `` `[data-tab="${CSS.escape(id)}"]` ``）
   会被当作新串起点，同样吞并到文件末尾（`asset-manager.js` 实测仅提取 1 条，实际 23 条）。
   修正：新增 `_skip_line_comment` / `_skip_block_comment` / `_regex_can_start` / `_skip_regex_literal`，
   以及递归处理内嵌套字符串的 `_scan_plain_string` / `_scan_template_literal`。

> **当前状态（提交前更新）**：第 1 类（缺陷 B）与第 3 类（缺陷 A）**均已修复并回归**，
> 冻结基线重建为 **188 条去重路径 / 180 条未实现**（P8-A1 §8.3），守卫与报告已逐字对齐。
> **第 2 类（helper 拼接类调用）已于第二轮纳入扫描器**（补 8 条），原「待裁决」项关闭。
>
> **主代理本轮独立复跑（2026-09-21，第二轮）**：真实 `uvicorn.Server`（端口 2513）+ Chromium（`chromium-1234`，1440x900，headless）覆盖同上 **16 页**，结果 **`pageerror` 合计 0**；`canvas-list.html` 的 `dataset.canvasListReady = 'ready'`、`[data-canvas-id]` = `['cv-0001']`——P8-A2 修复在修正后基线上依旧成立。

### 5.5 `asset-share.html` 直接打开的定性（**登记，不改**）

`asset-share.js:6` 以 `location.pathname` **末段**为分享 token。真实分享链接形如
`/static/asset-share.html/<token>`（或由后端分发的短链）；**直接以静态路径打开**时
末段退化为文件名，于是请求 `/api/public/shares/asset-share.html`。

实测（端口 2481）：

```text
404 GET http://127.0.0.1:2481/api/public/shares/asset-share.html
页面正文：无法打开分享 Not Found
```

- 页面**确实**进入了错误态并给出可见提示（`app.className='share-error'`），**不属静默失败**。
- 是否为缺陷取决于产品裁决：若要求「无 token 直开」给出**明确缺参提示**而非 404，
  则需要一次前端改动；若视为**预期行为**，则维持现状。
- **本轮只登记、不改**（属产品口径，不代决）。

### 5.6 其余 A / C 类明细（按域聚合）

| 域 | 实测路径（去重） | 归属页面 |
|---|---|---|
| 观测 | `/api/observability/{overview,series,events,tasks,health,sources,asset-volumes}` | `task-center.html`(15)、`v2/collab.html` |
| 资产 | `/api/asset-registry/assets`、`/api/asset-library`、`/api/asset-registry/status`、`/api/asset-registry/preferences/team`、`/api/storage-settings` | `asset-manager.html`、`v2/assets.html`、`v2/index.html`、`v2/settings.html` |
| 认证 | `/api/asset-auth/{status,users,teams,operation-approvals}` | 8 个页面 |
| 平台 | `/api/providers`、`/api/app-info` | `api-settings.html`、`v2/index.html`、`v2/settings.html`、`episode-pipeline.html` |
| 内容治理 | `/api/asset-registry/governance/overview` | `governance.html` |
| 流水线 | `/api/episode-pipelines`、`/api/prompt-libraries` | `episode-pipeline.html`、`v2/workshop.html` |
| 画布回收站 | `/api/canvases/trash`、`/api/canvases/trash?view=archived` | `canvas-list.html` |
| 外部资源（C 类） | `https://images.unsplash.com/photo-1579783902614-a3fb3927b675` | `v2/production.html`、`v2/storyboard.html` |

C 类原文（端口 2481）：

```text
FAIL [image] https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=300&auto=format&fit=crop :: net::ERR_BLOCKED_BY_ORB
FAIL [image] https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600&auto=format&fit=crop :: net::ERR_BLOCKED_BY_ORB
```

属既有登记项（Unsplash 内容权利链未闭环），**本轮不重复裁决**。

---

## 6. 门禁复跑（本轮修复后）

| 门禁 | 结果 |
|---|---|
| `pytest -q --no-header -p no:cacheprovider` | **86 passed**（P8-A1 的 81 + 本轮画布守卫 5） |
| `node --check`（已跟踪非 vendor `.js`） | **54 / 0 failed**（含本轮改动的 2 个文件单独复核 exit=0） |
| 二进制红线 | 违规 **0**（仅白名单 3 个思源黑体 `.otf`） |

> 修复前后对照断言：修复前 `canvas-list.html` `ready=error`、`canvasIds=["undefined"]`；
> 修复后 `ready=ready`、`canvasIds=["cv-0001"]`（§3.1 / §3.3 原文）。

---

## 7. 明确未做的事（边界，不得外推）

1. **未补写任何后端实现**（180 条缺口保持原状），符合 T25「只做对账与登记」口径。
2. **未在本轮修改 P8-A1 扫描器的判定逻辑**（§5.4 缺陷 A/B/C 的修复与冻结基线重建，已由 P8-A1 §8.3 批次完成）。
   原因：`tests/contracts/test_phase8_frontend_backend_api_gap.py` 的 `KNOWN_*`
   与本轮修复存在**语义耦合**——若同时修扫描器，须连带重建冻结集（已于 P8-A1 §8.3 完成：177/169 → **188/180**），
   属**独立批次**，需先做方案评审（符合 `AGENTS.md` §5.1「构思方案 → 提请审核 → 分解任务」）。
3. **未改 `asset-share.html` 无 token 行为**（§5.5 属产品裁决）。
4. **未改 `v2/*` 页面的 `asset-auth/status` 404 降级行为**（属 P8-A1 §5.1 待裁决项）。
5. **未改 `asset-manager/api.js:674-679` 的 `getCanvases()`**（同样缺 `project_id`）：
   该路径在本轮 16 页扫描中**未被实际触发**（`asset-manager.html` 未发出该请求），
   且其对应端点 `/api/canvases/assets` 本属未实现缺口。
   按「最小改动、不越权扩大范围」原则**仅登记，不改**。
   证据：`src/gods_workbench/static/js/asset-manager/api.js:674`
   ```js
   getCanvases(init = {}) {
       return transport.request('/api/canvases', { ...init, credential: 'same-origin' });
   },
   ```

> **更正（2026-09-22）**：上面引用的代码片段中，`credential` 曾被写成含西里尔字母与零宽空格的形近串，
> 属**历史文档污染**（与本报告 §8 所记的历史行同类）。本轮已**就地更正为纯 ASCII `credential`**，不改变任何结论。
> 持续门禁见 `tests/hygiene/test_cleanroom_hygiene.py::test_no_homoglyph_confusables`；
> 实测该污染**仅存在于本报告的引用片段**，`src/` 下真实源码及其全部历史版本均无此问题。

---

## 8. 独立性与治理边界（如实登记）

### 8.1 执行主体独立性不成立

本轮 **P8-A2 由主代理执行**。子代理委派通道在本环境中**持续不可用**：
`spawn_agent` / `followup_task` / `send_message` 多次投递后，子代理仅收到环境上下文、
**任务正文未送达**（`/root/p8_a2_frontend_e2e`、`/root/p8a1_review`、`/root/p8a1_review_b`
均回报「没有具体任务内容」）。

**因此本报告的「独立审核」不成立**，所有证据均为**主代理自采**。

### 8.2 本轮尝试的取证替代

为降低单点风险，本轮采用了**不同工具链交叉取证**：
静态扫描（纯 Python 解析）↔ 真实 HTTP（`httpx` + `uvicorn.Server`）↔ 真实浏览器（Chromium/Playwright）↔
隔离副本注入（`git show HEAD:` + `%TEMP%` 副本）。
三者对本缺陷的结论一致（§3.1 / §3.3 / §3.4）。**但这不等于独立第三方审计。**

### 8.3 并发子代理越权推送（重要）

本轮执行期间，仓库 `HEAD` 被**另一并发代理**推进：

```text
019083ce019f3361e3f211a353cd339589ace892  文档更正：TASKS.md 去除重复 T19 条目（合并保留独立性/治理登记）
```

- 该提交**仅改 `docs/governance/TASKS.md`**（1 file changed, +1/-2），**未触碰**本轮修复文件。
- 该推送**未经主代理授权**（`git add/commit/push` 权限按约定仅属主代理）。
- 与 Phase 7 已登记的同类偏离一致（见 `HANDOFF-7.md` §12、`attestations/reviews/PHASE-7-INDEPENDENT-REVIEW-2026-09-21.md` §7）。
- 影响：本轮基线由 `721c00c` 变为 `019083c`；本轮修复**在其之上**进行，未改写历史、未强推。

### 8.4 待用户裁决（滚动保留）

1. `asset-share.html` 无 token 直开是否给「明确缺参提示」（§5.5）。
2. P8-A1 扫描器的 helper 拼接类偏差**已闭环**（缺陷 C 已补 8 条入集，§5.4）；如需继续扩大解析深度（多层拼接）请另行裁决。
3. 180 条未实现端点的优先级排序与「未纳入当前切片」范围裁量（P8-A1 §5.2）。
4. 前端是否统一改为「无后端时显式降级」而非直接 `fetch`（P8-A1 §5.1）。
5. Tailwind SRI 替代路径；Unsplash 内容权利链；Material Symbols 许可入口；
   prompt-registry 预览图外链权利链；思源黑体上游匹配（Phase 7 滚动项）。
6. 真实外部 IdP 接线；前端无认证头导致写入接口 401。
7. **是否安排真正第三方独立审计**（本环境子代理通道不可用，§8.1）。
8. 发布授权（仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**）。

### 8.5 取证边界（不得外推）

| 层级 | 状态 |
|---|---|
| 本地实测（Windows + Chromium + uvicorn） | 通过（`pytest` 86 passed；`node --check` 54/0；16 页 `pageerror` 0） |
| 远端 CI（GitHub Actions `CI`） | **success**：run `35564655226`，`headSha` 逐字为 `9808bab17b1bb069edfa2d1d6986ddc13fc98930`；关键步骤原文：依赖导入通过、`86 passed, 2 warnings in 1.85s`、二进制白名单扫描通过（Linux / Python 3.11.16 / ubuntu-24.04） |
| 生产验收 | **未执行**，仍为独立决策 |

> 本地通过 != 远端 CI != 生产验收。

### 8.6 第三轮：独立审核代理已成功送达（对 §8.1 的更正）

§8.1 记录的「子代理通道持续不可用」是**第二轮为止**的事实，**第三轮已改变**：

- 第三轮重新尝试派发审核代理（先用直接 payload，再用「任务书写盘 + 只读文件引用」方式重试）后，
  `/root/p8_review_i` **成功收到任务正文并完成只读核验**（此前 `/root/p8_review_h` 等仍只收到环境上下文）。
- 该审核代理**独立复跑**（未复用主代理中间产物）并给出结论：
  - 冻结基线 **188 / 180** 与真值集合**逐字一致**（`missing=[] added=[]`）；后端路由 **14**；契约无前端调用方 **3**；
  - 12 条 `{p}{p}` 幽灵路径确已清除；8 条 helper 拼接路径确已入集且在 `routes_god_canvas.py` 中确无实现；
  - 洁净室红线通过（无白名单外二进制、无根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`、未实现 `PLUGIN-PROTOCOL-SPEC.md`）；
  - **独立复跑 `pytest` 86 passed、`node --check` 54/0**。

- **审核代理指出的真实文档缺陷（已由主代理在本轮修正）**：
  1. §5.4 首段仍写「两个独立缺陷」，与 §8.3 及 P8-A1 §8.3 的**三处缺陷（A/B/C）**口径不一致 -> 已改为「三处缺陷（A/B 由本轮 E2E 反向发现，C 经第二轮补修）」；
  2. §7 第 2 项原写「未修改 P8-A1 的扫描器与冻结基线（三类偏差仅登记）」，与「缺陷 A/B/C 已修复、基线已重建为 188/180」矛盾 -> 已改为「未在本轮修改扫描器判定逻辑；修复与基线重建已由 P8-A1 §8.3 批次完成」；
  3. §8.4 第 2 项原把 helper 拼接类列为「剩余偏差、待立项修复」，与「缺陷 C 已闭环」矛盾 -> 已改为「已闭环；如需继续扩大解析深度（多层拼接）请另行裁决」。

> **边界（不得外推）**：该审核代理是**同一多代理框架内的独立执行主体**，其核验针对**已提交的 `9808bab` 工作树**；
> 这**仍不等同于**外部第三方机构审计，也不改变发布阻断项与「≠ 生产验收」的结论。
