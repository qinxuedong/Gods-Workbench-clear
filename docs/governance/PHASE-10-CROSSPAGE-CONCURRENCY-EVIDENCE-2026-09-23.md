# Phase 10 跨页状态保持 + 多窗口并发证据（2026-09-23）

> **执行主体**：主代理（同框架）。**不等于**外部第三方独立审计（T36/T40 须外部机构）。
> **基线**：本文件提交时的 HEAD（前序提交：第 3 版快照视觉等价口径更正）。
> **上位口径**：`AGENTS.md`、`CLEANROOM-STATUS.md`、`HANDOFF-10.md`、`docs/governance/TASKS.md`。

---

## 1. 为什么需要这一项

`HANDOFF-10.md` §4 第 7 项此前登记的边界是：
「契约层 5/5 PASS、加载期 E2E 已闭环、7 项交互 smoke 已闭环，但
**跨页状态保持、多窗口并发仍未被任何用例覆盖**」。

本文件即补测这两块，并严格区分四层证据：

| 层 | 本次覆盖 | 手段 |
|---|---|---|
| 契约层（HTTP 语义） | 是 | 真实 HTTP 2077 + 标准凭据头 |
| 并发层（真实竞争） | 是 | 多线程同一 `expected_version` 并发 PATCH |
| 呈现层（浏览器行为） | 是 | Playwright + 本机真实 Chrome 1600x1000 |
| 生产验收 / 发布授权 | **否** | 须真实环境 + 人工签署 |

---

## 2. 复现入口

```powershell
# 全部为只读探针，产物只落系统临时目录，不写入仓库
python -P <探针>.py     # 本轮探针均落在 %TEMP%，不入仓
```

标准凭据（本地模式）：`X-User-Role: editor` + `Authorization: Bearer cleanroom-probe`。

---

## 3. 跨页状态保持（呈现层，真实浏览器）

### 3.1 通过项：localStorage 承载的跨页上下文一致

| 检查 | 结果 |
|---|---|
| `canvas_overview_density`：点击「紧凑」→ 写入 `compact` + `documentElement` 挂 `canvas-overview-compact` | PASS |
| 同上，**整页 reload 后回显** | PASS（`ls=compact`，`cls=true`） |
| `canvas_overview_sort`：页面 A 设为 `name` → **新开的窗口 B** 读到 `name` | PASS（跨窗口共享同一 `localStorage`） |
| `studio_theme`：页面 A `StudioTheme.set('light')` → **已打开的页面 B 实时同步**（未 reload） | PASS（`data-theme: dark → light`） |
| 同上，改回 `dark` → B 实时跟随 | PASS |
| 项目上下文**载体**：`projects.html` 选 `prj-0002` → 导航到 `production.html`，URL 携带 `?project_id=prj-0002` 且 `localStorage.workspace_project_id=prj-0002` | PASS（仅载体） |
| 同上，`#navPillsGroup` 全部链接被重写为携带当前 `project_id` | PASS |

**重要限定**：上表最后两行的 PASS 只证明**状态载体**（URL / `localStorage` / 导航链接）在跨页后一致，
**不证明**依赖这些载体的**页级呈现**也一致——`production.html` 的可见项目标题在壳层路由后**不渲染**，
见 §3.2。两条路径**并非等价**。

### 3.2 ⚠️ **新发现（真实缺陷）**：壳层部分路由丢失 `topbar-master-deck` 内的页级元素

**现象**：`v2-shell.js` 的部分路由（partial navigation）只替换
`shellWorkspace()` = `.topbar-master-deck` 的**下一个兄弟节点**，即 `<main>` 工作区；
**不替换 deck 本身**。因此任何**位于 deck 内部、但只有某一页才有的 `id`**，
在从别的页面通过壳层路由进入该页后**不会出现**。

**实测（整页加载 vs 壳层路由，检查 `.topbar-master-deck [id]` 集合差）**：

| 目标页 | 该 id 在整页加载时归属 | 壳层路由后是否缺失 |
|---|---|---|
| `production.html` | `currentProjectDisplayTitle` | **缺失** |
| `workshop.html` | `workshopProjectTitle` | **缺失** |
| `storyboard.html` | `storyboardNavCanvas` | **缺失** |
| `index.html` | `navPillDashboard`、`navPillSettings`、`uvNeedleGradCPU` | **缺失** |
| `projects.html` / `agents.html` / `assets.html` / `collab.html` | 无独有 deck id | 无差异 |

**交叉验证（`production.html` 对照）**：

```
整页加载 /static/v2/production.html?project_id=prj-0002
  deck 可见文本：… 剧集制片 … STAGE 未接入 VRAM 未接入 FLUX …
  currentProjectDisplayTitle：存在、可见，文本 'prj-0002 · 剧集制片工坊'

从 projects.html 点击导航「剧集制片」进入（同 origin、壳层拦截）
  URL：production.html?project_id=prj-0002（导航确实发生）
  deck 可见文本：… 剧集制片 … FLUX 未接入 VRAM 未接入 FLUX …（**少了 STAGE 段**）
  currentProjectDisplayTitle：**元素不存在**
```

**影响面（仅陈述实测，不外推）**：
`production-controller.js:184` 通过 `document.getElementById('currentProjectDisplayTitle')` 更新项目标题，
该元素缺失时标题**不渲染**（该行有空值保护，故**不抛异常**，静默降级）。
本轮实测全程 `pageerror = 0`——即**这类缺陷不会以 JS 异常暴露**，只能靠 DOM 断言发现。

**视觉证据（截图，仅存于系统临时目录，不入仓——仓库禁止二进制资产）**：

| 路径 | 内容 |
|---|---|
| `%TEMP%\gw-state\full-production.png` | 整页加载：topbar 中央显示 `prj-0002 · 剧集制片工坊`，deck 含 `STAGE 未接入` 段 |
| `%TEMP%\gw-state\partial-production.png` | 壳层导航进入：topbar 中央为 `PROJECT ASSET MASTER DECK`，deck **丢失 `STAGE` 段** |

**归属**：属 `v2-shell.js` 部分路由机制的**结构性缺口**，非某一页的书写错误。
修复需人工裁决（选项见 §5）。

### 3.3 边界（不得越读）

- 仅覆盖 1600x1000 视口、headless Chrome、本地 `python run.py` 单进程。
- 未覆盖：`:hover`/`:focus` 交互态、响应式断点、真实多用户会话、浏览器前进/后退栈完整性。
- §3.1 的 PASS 仅证明**已测的 6 项**状态载体（localStorage / URL 参数）在两条导航路径下一致。

---

## 4. 多窗口并发（并发层，真实 HTTP 竞争）

### 4.1 服务端 CAS 在真实并发下成立（**PASS**）

方法：新建项目得到 `version=1`，用 `threading.Barrier` 让 **3 个线程同时**以
`expected_version=1` 发 PATCH。

```
create -> 201 pid=prj-0005 ver=1
3x concurrent PATCH same expected_version=1 -> {409: 2, 200: 1}
    {"worker": 0, "status": 409, "code": "VERSION_CONFLICT", "current_version": 2}
    {"worker": 1, "status": 409, "code": "VERSION_CONFLICT", "current_version": 2}
    {"worker": 2, "status": 200, "new_version": 2}
```

**判定**：恰好 **1 个成功、2 个 409**，且 409 携带 `current_version=2`。
符合 `AGENTS.md` §3.2（CAS 乐观锁、禁止静默覆盖）与
`PROJECTS-HUB-INTERFACE-CATALOG.yaml` 的 409 语义。

### 4.2 浏览器多窗口的共享与广播语义

| 载体 | 跨窗口可见 | 已打开窗口**实时**跟随 | 备注 |
|---|---|---|---|
| `localStorage`（读） | 是 | 仅在同源 `storage` 事件监听处 | 本次实测 `studio_theme` 实时同步 |
| `localStorage`（写） | 是 | 由各页自身是否监听 `storage` 决定 | `canvas-list.js` **未**监听 `canvas_overview_*`，故不实时跟随（见 §4.3） |
| `BroadcastChannel` | 是 | 是 | `api-settings.js`（`studio-api`）、`aura-trace.js` 使用 |

### 4.3 ⚠️ 登记（**能力缺口，非缺陷判定**）：`canvas_overview_*` 无跨窗口实时同步

实测：在窗口 B 直接改写 `canvas_overview_density`，窗口 A（已打开的 `canvas-list.html`）
的 `canvas-overview-compact` 类**不变更**（三次采样均为 `true`）。

原因：`canvas-list.js` 只在**初始加载**读取 `localStorage`（`canvas-list.js:216-223`），
**未注册 `storage` 事件监听**——与 `theme.js:278` 的做法不同。

**判定级别**：`docs/behavior/` 内**未检索到**对「画布库视图偏好需跨窗口实时同步」的要求，
故本轮**不判定为规范偏离**，仅登记为能力缺口，供将来裁决。

### 4.4 边界（不得越读）

- 并发测试为**单进程 in-memory 存储**（重启即丢、多 worker 不共享，属既有登记项）。
  它验证的是 **CAS 语义**，**不是**跨进程/跨实例的分布式一致性。
- 未做压力/长稳测试（并发度 3、单轮）。
- 未验证「浏览器多窗口 + 服务端并发」组合场景下的 UI 呈现（本轮两者分别验证）。

---

## 5. 待人工裁决

| # | 裁决项 | 选项 | 建议 |
|---|---|---|---|
| 1 | `v2-shell.js` 部分路由丢失 deck 内页级元素（§3.2） | **A** 维持现状（该标题在壳层导航后不显示）；**B** 让部分路由同时协调 deck 内的页级元素；**C** 把页级元素从 deck 移入工作区（改页面结构） | **B**——A 会让「整页加载 / 壳层导航」两条路径呈现不一致；C 改动面更大且会动已冻结的视觉结构 |
| 2 | `canvas-list.js` 视图偏好跨窗口实时同步（§4.3） | **A** 维持现状（下次加载生效）；**B** 补 `storage` 监听 | **A**——行为规范无此要求，属锦上添花，不建议为无规范支撑的功能扩大改动面 |

两者均属**共享层改动**（`v2-shell.js` 影响全部 v2 页面），按 `AGENTS.md` §5 须人工确认后实施。

---

## 6. 边界声明

- 本机实测 ≠ 远端 CI（探针不入 CI）≠ 生产验收 ≠ 发布授权。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- 外部第三方独立审计（T36/T40）**仍未闭环**，本文件不构成其替代。
