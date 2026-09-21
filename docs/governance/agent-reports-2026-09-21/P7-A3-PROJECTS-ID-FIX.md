# P7-A3 报告：项目中心稳定实体 ID 契约缺陷修复（含 7 处扩散面，2026-09-21）

> 执行者：主代理 `/root`（Phase 7 第三批）。
> 依据：根 `AGENTS.md` §3.1（统一稳定 ID 规范）、`docs/governance/AGENT-TASK-2026-09-21-PHASE7.md`。
> 基线：`3d426ba`。状态：**本地工作树完成，尚未提交**（提交与远端 CI 由主代理执行）。

## 1. 缺陷事实

| 项 | 内容 |
|---|---|
| 影响页面 | `/static/v2/projects.html`（项目中心，**默认落地页**） |
| 现象 | 首屏抛 `TypeError: Cannot read properties of undefined (reading 'slice')`，项目卡片全部不渲染 |
| 崩溃点 | `src/gods_workbench/static/v2/js/projects-controller.js:479` —— 渲染模板 `` S${(p.id.slice(-1) || '1')} `` |
| 根因 | `load()` 摄取处直接 `state.projects = list;`，而契约/夹具的稳定实体 ID 字段名为 `project_id` |
| 归属 | **既有缺陷**，非本轮引入（本缺陷修复本身为 1 行逻辑替换 + 3 行中文注释，并新增 1 个纯 Python 契约测试文件） |

契约依据：

- `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` → `list_projects.response_200.projects[].project_id: string`
- `docs/fixtures/projects-hub-list-active.json` → 项目对象以 `project_id` 为 ID，**不含 `id` 字段**

## 2. 最小修复（纯增量，1 行逻辑 + 3 行注释）

`src/gods_workbench/static/v2/js/projects-controller.js`（摄取边界归一化）：

```diff
       const list = data?.projects || data;
       if (Array.isArray(list) && list.length > 0) {
-        state.projects = list;
+        // 契约对齐：项目中心 API 的稳定实体 ID 字段为 project_id（见 docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml
+        // 与 docs/fixtures/projects-hub-list-active.json）；此处统一归一化为前端内部使用的 id，
+        // 避免后端返回 project_id 时 p.id 为 undefined 导致渲染报错。
+        state.projects = list.map(p => ({ ...p, id: p.id || p.project_id }));
       } else {
```

口径说明：
- 归一化放在**摄取边界**（单一入口），渲染路径（约 30 处 `p.id`）**全部不改**，避免散点修改引入新风险。
- `p.id || p.project_id` 保留对既有 `id` 字段的兼容，不破坏演示数据（`getDemoProjects` 内部仍用 `id`）。

修复后文件 SHA-256：`DCD1116C6708CF51C45D7E26B078A4BC8D5C874FB2E997949AD2F99C4532892D`
`node --check`：通过。

## 3. 真实浏览器对照实测

方式：单进程 Python 内启动真实 `uvicorn.Server`（`GW_RELOAD=false`，端口 2350）+ Playwright Chromium
（`executable_path=C:\Users\qinxuedong\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe`），
以**同一浏览器流程**分别加载修复前（`git show HEAD:` 回放）与修复后文件，比对页面错误与卡片数。

```text
[BEFORE] pageerrors=1  project_cards=0  has_示例项目A=False
[AFTER]  pageerrors=0  project_cards=1  has_示例项目A=True
```

- 修复前 1 条 `pageerror` 即上文 `TypeError`；修复后归零。
- 项目卡片由 **0 → 1**，且首条卡片名称与黄金夹具 `示例项目 A` 一致 —— 说明数据经归一化后已真实走到渲染分支。

## 4. 回归守卫测试（新增）

`tests/contracts/test_phase7_projects_id_contract.py`（**纯 Python 契约测试，不启动浏览器**）。首轮 3 个用例覆盖本页缺陷，扩散面补齐后扩展为 **9 个用例**（见 §8.4）。下列为首轮 3 个：

| 用例 | 断言 |
|---|---|
| `test_projects_hub_contract_declares_project_id_as_stable_id` | 前置事实：契约 + 夹具均以 `project_id` 为稳定 ID，且夹具**不含** `id` |
| `test_projects_controller_normalizes_project_id_at_ingest` | **核心**：摄取窗口内必须为 `state.projects = list.map(` + `project_id` + `id: p.id || p.project_id` |
| `test_projects_controller_render_path_consumes_project_id` | 前置事实：渲染路径确实存在 `p.id.slice(`（即本缺陷的崩溃点） |

### 4.1 可复现性证明（守卫对修复前确定失败）

以 `git show HEAD:src/gods_workbench/static/v2/js/projects-controller.js` 还原修复前文本，注入守卫断言：

```text
HEAD(before)        => FAIL  (no map ingest)
workspace(after)    => PASS  (ok)
REPRO-PROOF-OK
```

进一步以**测试函数本体**复跑（`CONTROLLER_JS` 指向临时还原文件）：

```text
[BEFORE] pytest guard => FAIL as expected
  reason: 项目列表摄取未做实体 ID 归一化…裸赋 `state.projects = list`…
[AFTER]  pytest guard => PASS
TEMP cleanup: removed
```

结论：守卫对修复前**确定失败**、对修复后通过 —— 具备真实回归防护能力，非空断言。

## 5. 门禁复跑（本地）

| 门禁 | 命令 | 结果 |
|---|---|---|
| 全量测试 | `python -m pytest -q --no-header -p no:cacheprovider` | **68 passed**（本文件 §5 记录时的阶段值；扩散面补齐后见 §8.5 = **74 passed**） |
| 语法检查 | `node --check` 全部已跟踪 `.js` | 56 通过 / 0 失败 |
| 二进制红线 | 白名单外二进制扫描 | 违规 **0** |
| SBOM JSON | `json.load(...)` | 合法（39 组件） |

## 6. 边界与未闭环

- **`globalTrashState.projects` 未验证**：`refreshGlobalTrash()`（`:1232`）读取
  `/api/asset-registry/governance/overview` 并直接使用 `p.id`（`:1294`–`:1311`）。
  该 endpoint 当前返回 **404**（后端未实现），**无法取证**，故本轮**未做归一化**，登记为待办而非宣称已修。
- `/ws/stats` 的 403 与各页 `/api/*` 404 均为**既有未实现后端**，非本轮引入；全站 16 页扫描中
  仅 `projects.html` 存在 `pageerror`。
- 本地通过 ≠ 远端 CI ≠ 生产验收。

## 7. 待提交清单（显式逐文件 `git add`，严禁 `git add -A`）

- `src/gods_workbench/static/v2/js/projects-controller.js`（修改）
- `src/gods_workbench/static/v2/js/home-controller.js`（修改）
- `src/gods_workbench/static/v2/workshop.html`（修改）
- `src/gods_workbench/static/js/hardware-telemetry.js`（修改）
- `src/gods_workbench/static/js/episode-pipeline.js`（修改）
- `src/gods_workbench/static/js/canvas-list.js`（修改）
- `src/gods_workbench/static/js/asset-manager.js`（修改）
- `tests/contracts/test_phase7_projects_id_contract.py`（新增）
- `docs/governance/agent-reports-2026-09-21/P7-A3-PROJECTS-ID-FIX.md`（本文件，新增）
- `HANDOFF-7.md`、`CLEANROOM-STATUS.md`、`docs/governance/TASKS.md`、`docs/governance/TASK-NOTES-2026-09-18.md`（仅追加）

---

## 8. 扩散面：同一根因在其余 6 个前端文件中的复现（本轮补齐）

`projects.html` 只是**首个被发现**的复现点。同一根因（契约字段 `project_id` vs 前端内部 `id`）
在前端共有 **7 处**入口，均在**摄取边界**归一化。全部经真实浏览器实测取证。

| # | 文件 | 位置 | 实测症状（修复前） | 修复后实测 |
|---|---|---|---|---|
| 1 | `static/v2/js/projects-controller.js` | `load()` 列表摄取 | `pageerror=1`、卡片 0 | `pageerror=0`、卡片 1、命中 `示例项目 A` |
| 2 | `static/v2/js/projects-controller.js` | `handleCreateProject()` | 新建后不写 localStorage、不选中，卡片渲染 `p.id.slice` 抛错 | 卡片 1→2、`ls=prj-0002`、`ls_name=名称`、无 pageerror |
| 3 | `static/v2/js/home-controller.js` | `reloadProjects()` 列表摄取 | `data-project-id=""`、`onclick=V2Home.selectProject('')`，点击后 `localStorage.workspace_project_id=null` | `data-project-id="prj-0001"`，点击后 `= 'prj-0001'` |
| 4 | `static/v2/js/home-controller.js` | `handleCreateProject()` | 同上（新建路径）；**另有 `updateNavPillsProject` ReferenceError 遮蔽**（见 §10 —— 该缺陷修复前本行「卡片数递增」**不成立**） | 卡片 **1→2**、属性无空值、导航胶囊同步（§10.4） |
| 5 | `static/v2/workshop.html` | `fetchProjects()` 目录 + 单项目 | 项目名回退为内置演示工程 `《神谕之地》` | 标题 `示例项目 A · 影视工坊流水线` |
| 6 | `static/js/hardware-telemetry.js` | `renderProjectCalendar()` | 排期条 `data-project-calendar-project=""`，点击跳转**静默失效** | 属性 `prj-0001`，点击后 URL 变为 `projects.html?project_id=prj-0001` |
| 7 | `static/js/episode-pipeline.js` | `load()` 列表 + 单项目 | 项目名显示为 `prj-0001`（未回退到真实名称） | 显示 `示例项目 A` |
| 8 | `static/js/canvas-list.js` | `normalizeProject()` | 项目行 `data-project-id="undefined"`（**字符串**，非空） | 行 `data-project-id="prj-0001"` |
| 9 | `static/js/asset-manager.js` | `loadRegistryBootstrap()` + `createRegistryProject()` | 项目树不渲染（`activeProjectId=undefined`） | 项目树 `data-project="prj-0001"`、名称 `示例项目 A` |

> 表内编号 1–9 对应 **7 个文件**（`projects-controller.js`、`home-controller.js` 各含列表 + 新建两条路径）。

### 8.1 归一化口径（统一）

全部采用同一句式，集中在**摄取边界**，渲染/消费路径一律不改：

```js
// 契约对齐：项目中心 API 的稳定实体 ID 字段为 project_id（见 docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml，
// 黄金夹具 docs/fixtures/projects-hub-list-active.json 不含 id）；此处归一化为内部 id，…
const id = item.id || value.project_id;
```

`canvas-list.js` 的 `normalizeProject()` 是唯一一处需要内联赋值的（该函数本就是归一化入口）。
新建项目路径额外补全 `name`（创建接口只回传 `project_id` / `version`，不含 `name`）。

### 8.2 后端字段取证（真实 HTTP，非推断）

真实 `uvicorn.Server` + `httpx` 实测：

```text
GET /api/asset-registry/projects?archived=false -> 200
  item0 keys: project_id, name, project_type, stage, progress, scenes, shots, description,
              start_at, due_at, version, archived_at, deleted_at, updated_at
  item0 has 'id'? -> False

POST /api/asset-registry/projects (Bearer + X-User-Role: editor) -> 201
  {"project":{"project_id":"prj-0002","version":1,"archived_at":null,"deleted_at":null}}
  project keys: ['archived_at','deleted_at','project_id','version']   # 无 id、无 name

GET /api/asset-registry/governance/overview -> 404   # 仍未实现
```

即：**契约与实现一致地使用 `project_id`**，前端 7 处入口的 `id` 假设是缺陷侧。

### 8.3 未实现后端导致的隔离取证

`asset-manager.html` 首屏被 `GET /api/asset-registry/assets` 的 **404** 阻断，`registryBootstrapCompleted`
永远为 false，故项目树不渲染。为**隔离该既有后端缺口**并验证归一化本身，实测时对该 endpoint 施加
Playwright 路由桩（返回契约形状的空集合），随后切到「项目制片」页签：

```text
AFTER (projects tab, stubbed): {"tree_parents": ["prj-0001"], "names": ["示例项目 A"], "has_sampleA": true}
```

即**在既有后端缺口被隔离后**，归一化确实使项目树恢复。

### 8.4 回归守卫扩展与可复现性

`tests/contracts/test_phase7_projects_id_contract.py` 由 3 个用例扩展为 **9 个用例**（§10 再增至 **10 个**），
逐一覆盖上表 7 个文件（含列表与新建两条路径）。以 `git show HEAD:<path>` 还原全部修复前文本后注入同一批断言：

```text
file                       BEFORE(HEAD)     AFTER(workspace)
home-controller.js         FAIL(expected)   PASS
workshop.html              FAIL(expected)   PASS
hardware-telemetry.js      FAIL(expected)   PASS
episode-pipeline.js        FAIL(expected)   PASS
canvas-list.js             FAIL(expected)   PASS
asset-manager.js           FAIL(expected)   PASS
projects-controller.js     FAIL(expected)   PASS
home-controller.js#2       FAIL(expected)   PASS   （§10 新增第 10 个用例：越界 helper 调用）
修复前失败断言: 8 条失败 / 共 10 个用例（另 2 个为「契约与渲染前置事实」断言，修复前即应通过）
REPRO-PROOF-OK
```

> **更正（2026-09-21，独立审核代理发现，主代理复跑确认）**：本行原写「修复前确定失败: 7 / 7」，
> 与实测口径不符。以 `git show HEAD:<path>` 还原 7 个文件修复前文本后运行本守卫，
> 实测为 **8 failed / 2 passed（共 10 个用例）**；矩阵原表也漏列 `home-controller.js#2` 一行，已补齐。
> 独立复核方式：`git archive 3d426ba | tar -x` 到 `%TEMP%` 隔离副本，覆盖 7 个源文件后运行
> `python -m pytest -q tests/contracts/test_phase7_projects_id_contract.py` → `8 failed, 2 passed`。

### 8.5 门禁（扩展后复跑）

> 下表为**扩散面补齐、§10 缺陷二修复之前**的阶段快照；缺陷二修复后的最终值见 §10.7。

| 门禁 | 命令 | 结果 |
|---|---|---|
| 全量测试 | `python -m pytest -q --no-header -p no:cacheprovider` | **74 passed**（阶段值；最终见 §10.7 = **75 passed**） |
| 语法检查 | `node --check` 全部已跟踪 `.js` | 56 通过 / 0 失败 |
| 二进制红线 | 白名单外二进制扫描 | 违规 **0** |
| SBOM JSON | `json.load(...)` | 合法（39 组件） |

### 8.6 边界

- `asset-manager.html` 的项目树取证依赖**路由桩隔离**既有 `GET /api/asset-registry/assets` 404；
  该后端缺口**不在本轮范围**，如实登记为既有未实现项，**不宣称已修**。
- `refreshGlobalTrash()` 依赖的 `/api/asset-registry/governance/overview` 仍为 **404**，同样未取证未改。
- 前端**不发送** `Authorization` / `X-User-Role`，故创建/编辑类写在真实后端下返回 **401**（见 §9），
  这是**既有未闭环项**（真实 IdP 未接线），非本轮引入。

---

## 9. 取证时发现的既有未闭环项（非本轮引入，如实登记）

**前端不发送认证头**：`git grep` 全前端目录，`Authorization` 仅出现在 `api-settings.html` 的说明文案中；
`X-User-Role` 零命中。而后端 `routes_projects.py` 对 `POST` / `PATCH` / `DELETE` 要求
`require_edit_access(...)` / `require_governance_access(...)`，即**读取**（`GET /projects`）放行、
**写入**必须携带 Bearer + 角色头。

真实 HTTP 实测（无认证头）：

```text
POST /api/asset-registry/projects -> 401
{"detail":{"code":"unauthorized","message":"会话失效，请重新登录"}}
```

因此本轮对**新建项目路径**的浏览器 E2E 采用**测试期路由头注入**
（`Authorization: Bearer local-test` + `X-User-Role: editor`）以隔离该缺口，验证归一化本身：

```text
### projects: cards 1 -> 2
   {"cards":2,"ids":["prj-0002","prj-0001"],"has_new":true,"empty_attr":0,
    "ls":"prj-0002","ls_name":"P7A3 UI 新建验证"}    pageerrors: 0
```

**边界声明**：
- 「前端写路径在真实后端下返回 401」属**既有未闭环项**（真实外部 IdP 未接线，`core/oidc.py` 为影子模块且未接入生产路径），
  **不是本轮引入**，本轮也**未**实现任何认证接线（避免越权扩展范围）。
- 上述 E2E 结论仅在「认证缺口被隔离」的前提下成立；**不得**外推为「新建功能生产可用」。

---

## 10. 取证途中发现的第二个既有缺陷：`updateNavPillsProject` ReferenceError

### 10.1 发现经过（诚实记录）

§8 对 `home-controller.js` 新建路径做浏览器 E2E 时，**第一次实测并未通过**：卡片数恒为 **1**，
但 `localStorage.workspace_project_id` 已写入 `prj-0002`。当时一并采集到控制台原文：

```text
新建项目网络异常: ReferenceError: updateNavPillsProject is not defined
    at Object.handleCreateProject (http://127.0.0.1:2453/static/v2/js/home-controller.js:...)
```

即：**在该缺陷未修之前，§8 表中「home-controller.js 新建路径」一行的
「卡片递增」结论并不成立**。本报告在此**显式更正**，并给出修复后复测结论（§10.4）。

### 10.2 缺陷定性

`updateNavPillsProject` **仅**定义于 `projects-controller.js` 的 `V2Projects` 模块内部
（`projects-controller.js:740`，全仓定义数 = 1）；它在 `home-controller.js` 的作用域中**不可见**。
`home-controller.js:479`（原行号）在 `handleCreateProject()` 的 `res.ok` 分支内调用了它，
抛出 `ReferenceError`，被**同一个 `try` 的外层 `catch` 吞掉**（catch 仅 `console.warn`），
导致其后紧随的 `renderProjectsList()`（`:485`）**永不执行** —— 新建项目卡片不出现。

- **归属**：**既有缺陷**。以 `git show HEAD:…home-controller.js` 复核，修复前同样为「定义 0 次 / 调用 1 次」，
  与本轮改动**无因果关系**。
- **本文件自身的等价辅助函数为** `updateNavPills(targetId)`（`home-controller.js:365`），实现语义相同
  （批量改写 `#navPillsGroup a` 的 `project_id` 查询参数）。

### 10.3 最小修复

```diff
-          updateNavPillsProject();
+          // 既有缺陷修复：原调用 updateNavPillsProject() 在本文件作用域内并不存在
+          // （它只定义于 projects-controller.js 的 V2Projects 模块内），会抛 ReferenceError 并被
+          // 外层 catch 吞掉，导致随后的 renderProjectsList() 永不执行、新建卡片不出现。
+          // 本文件自身的等价辅助函数为 updateNavPills(targetId)。
+          updateNavPills(created.id);
```

### 10.4 修复后复测（真实浏览器，端口 2454）

```text
cards: 1 -> 2
{"cards":2,"ids":["prj-0002","prj-0001"],"empty_attr":0,
 "ls":"prj-0002","ls_name":"P7A3 index 复验",
 "nav_hrefs":["projects.html?project_id=prj-0002",
              "workshop.html?project_id=prj-0002",
              "production.html?project_id=prj-0002"]}
pageerrors: 0        console ReferenceError: 无
```

卡片 **1→2**、ID 无空值、导航胶囊三处 `project_id` 已同步为新建项目 —— 缺陷确实闭合。
（另有若干既有 `/api/*` 404 资源错误，与本缺陷无关。）

### 10.5 回归守卫

`tests/contracts/test_phase7_projects_id_contract.py` 新增第 10 个用例
`test_home_controller_create_path_does_not_call_out_of_scope_helper`：

- **先剥离行注释与块注释**再断言，避免把本次新增的说明文字误判为调用（首版即因未剥离而误报，已修正）；
- 断言 `home-controller.js` 中**不存在** `updateNavPillsProject(` 调用，且**不存在**其本地定义；
- 正向断言新建路径改为调用本文件的 `updateNavPills(created.id)`。

对 `git show HEAD:` 的修复前文本，该守卫**确定失败**（见 §8.4 矩阵中 `home-controller.js#2` 一行）。

### 10.6 全站同类缺陷扫描（防漏网）

1. **静态扫描**（剥离注释/字符串/模板串后，逐个文件比对「被调用标识符 vs 本文件定义集 + 浏览器全局集」）：
   命中项经逐条人工复核，**均为扫描器误报**（关键字残留 `if/for/catch/while/function`、
   跨模块解构导出、外部 CDN 全局 API 等），**未再发现真实的跨作用域未定义调用**。
   例：`home-controller.js` 可疑项 `reloadAssetOverview` / `renderDirectives` / `setupKeyboardShortcuts` /
   `switchView` 经核查**均在本文件内定义**（`:1107` / `:1318` / `:426` / `:842`）。
2. **全站真实浏览器扫描**（16 个 HTML 页面，真实 `uvicorn.Server` + Chromium，`domcontentloaded` + 1.3s 稳定期）：

```text
HTML 页面数: 16
api-settings / asset-manager / asset-share / canvas-list / episode-pipeline / governance /
task-center / v2-agents / v2-assets / v2-collab / v2-index / v2-production /
v2-projects / v2-settings / v2-storyboard / v2-workshop
   —— 每页 pageerror = 0
含 ReferenceError 的页面数: 0 | 总计: 0
```

即本轮结束时**全站无 JavaScript 运行时异常**（`pageerror` 为 0）。

### 10.7 门禁（缺陷二修复后复跑）

| 门禁 | 结果 |
|---|---|
| `python -m pytest -q --no-header -p no:cacheprovider` | **75 passed**（65 + 10 新增） |
| `node --check`（全部已跟踪 `.js`） | 56 通过 / 0 失败 |
| 二进制红线（白名单外） | 违规 **0** |
| SBOM JSON | 合法（39 组件） |
| 真实浏览器全站 16 页 | `pageerror` **0** |
