# Phase 10 完整交互矩阵补测证据（2026-09-23）

> **执行主体**：主代理（本仓内执行，**非**外部第三方）。本文件只登记**可复现的真实服务 HTTP / 真实浏览器实测**。
> **代码基线**：`ded94f8`（工作树干净）。提交本文件后 SHA 随之变化。
> **上位口径**：`AGENTS.md`、`CLEANROOM-STATUS.md`、`HANDOFF-10.md`、`docs/governance/TASKS.md`、
> `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md`、`docs/behavior/BEHAVIOR-SPEC-CANVAS.md`。

---

## 1. 为什么需要这一项

`HANDOFF-10.md` §4 第 7 项与 §§6.3/7.4 明确登记：前端 E2E 只完成了**加载期**与 **7 项确定性交互 smoke**，
**完整交互矩阵未执行**。未覆盖项为：

1. 表单写入（新建/编辑项目）
2. CAS 409 冲突的**用户可见提示**
3. `202 Accepted` + `poll_hint` 的**轮询收敛**
4. 403 只读降级
5. 401 未认证语义

本轮把上述五项**全部实测**，并对每项区分「契约层（真实 HTTP 服务）」与「呈现层（真实浏览器 DOM）」。

---

## 2. 复现入口

所有探针均以 `GW_RELOAD=false` 启动 `python run.py`（端口 2077），随后：

```powershell
# 契约层：真实 HTTP + 标准凭据头（X-User-Role + Authorization）
# 呈现层：Playwright + 本机真实 Chrome（1600x1000）
python -P tools/frontend_e2e_smoke.py --serve      # 加载期 + 7 项交互 smoke（既有工具）
```

探针脚本本轮只落在系统临时目录，**不写入仓库**（AGENTS.md §1.2）。

---

## 3. 契约层实测（真实 HTTP，端口 2077）

命令行口径：`X-User-Role: editor` + `Authorization: Bearer cleanroom-probe` 作为编辑者；
`X-User-Role: readonly` 作为只读角色。

### 3.1 表单写入 + CAS 版本推进

```
A) POST /api/asset-registry/projects   -> 201  project_id=prj-0003 version=1
C) PATCH （expected_version=1，正确） -> 200  new_version=2
```

### 3.2 CAS 409 冲突（陈旧 expected_version）

```
B) PATCH /api/asset-registry/projects/prj-0003  body={expected_version: 999}
   -> 409
   body = {"detail": {"code": "VERSION_CONFLICT", "message": "expected_version 与当前版本不一致",
                      "expected_version": 999, "current_version": 1}}
```

**判定**：错误码为契约规定的 `VERSION_CONFLICT`，且**同时返回** `expected_version` / `current_version`，
满足 `PROJECTS-HUB-INTERFACE-CATALOG.yaml:92` 与行为规范 §5 的 409 语义。

### 3.3 403 只读降级

```
D) DELETE /api/asset-registry/projects/prj-0003  （X-User-Role: readonly，expected_version=2）
   -> 403
   body = {"detail": {"code": "FORBIDDEN", "message": "无项目回收站操作权限"}}
```

### 3.4 401 未认证语义

```
E) DELETE 无任何凭据              -> 401  {"detail":{"code":"UNAUTHORIZED","message":"会话失效，请重新登录"}}
F) DELETE Authorization: Bearer invalid -> 401  同上
```

### 3.5 `202 Accepted` + `job_id` + `poll_hint` 轮询收敛

```
C) POST /api/canvases/cv-0001/tasks
   body = {entry_nodes: ["nd-0001"], run_mode: "single", inputs: {prompt: "probe"}}
   -> 202
   body = {"job_id": "job-0002", "state": "accepted",
           "poll_hint": "/api/jobs/job-0002", "result": null, "error": null}

   轮询 GET /api/jobs/job-0002
   -> 200
   body = {"job_id": "job-0002", "state": "accepted",
           "poll_hint": "/api/jobs/job-0002", "result": null, "error": null}
```

**判定**：`poll_hint` 与 `job_id` 一致（`/api/jobs/<job_id>`），轮询返回稳定 `job_id`，
与 `tests/contracts/test_god_canvas_service.py:154` 的契约断言一致。

### 3.6 附带：前置条件不满足时的 409（**非缺陷**）

```
POST /api/canvases/cv-0002/tasks  body={entry_nodes:["entity-1"]}
   -> 409 {"detail":{"code":"TASK_PRECONDITION_FAILED","message":"入口节点不存在: entity-1"}}
```

与 `CANVAS-INTERFACE-CATALOG.yaml:175`「版本冲突**或运行前置条件不满足**」一致，属设计行为。

---

## 4. 呈现层实测（真实浏览器，**关键发现**）

### 4.1 前置事实：前端不发送认证头（**已登记的既有缺口，非本轮新发现**）

真实浏览器加载 `/static/v2/projects.html` 时，全部 `/api` 请求**均不带** `Authorization` 头：

```
页面加载期 /api 调用（真实 Chrome）：
    200 /api/asset-auth/status
    200 /api/asset-registry/projects?archived=false
    200 /api/asset-registry/projects?archived=true
    200 /api/asset-registry/projects?deleted=true
   带 Authorization 头的请求数 = 0
```

这与 `CLEANROOM-STATUS.md:209`、`HANDOFF-7.md:241`、`TASK-NOTES-2026-09-18.md:1096`、
`P7-A3-PROJECTS-ID-FIX.md:233` 的既有登记**完全一致**，本轮如实复现，**不重复计为新缺陷**。

证据：全前端目录 `Authorization` 仅出现在 `api-settings.html` 的说明文案中（`git grep` 口径）。

### 4.2 真实 UI 归档写入：**返回 401**（既有缺口的运行时确证）

```
项目卡数 = 3
点击卡片内「归档」按钮     -> ok
确认按钮文案             = 确认归档     （证明命中的是卡片操作，不是筛选 pill）
点击确认                 -> DELETE /api/asset-registry/projects/prj-0003  -> 401
toast 文本               = ["归档失败：请求失败（HTTP 401）"]
```

**判定**：401 的**根因**是前端不发认证头（§4.1），**不是**后端缺陷——同一端点在带标准凭据头时返回 200/201（§3.1）。
该缺口在真实外部 IdP 接线闭环前**无法**从仓内消除（缺少真实 OP 与凭据）。

### 4.3 ⚠️ **新发现**：409 / 401 的用户可见提示**丢失语义**（规范偏离）

用 Playwright 路由拦截，把写入请求回放为**真实的 409 响应体**（与 §3.2 逐字节同构）：

```
=== 拦截为 409 VERSION_CONFLICT ===
  409 后 toast = ["归档失败：请求失败（HTTP 409）"]
  toast 节点数 = 1
```

**问题**：规范要求的是**语义化提示**，实测是**通用文案**——

| 状态码 | `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md` §5 要求 | 实测呈现 |
|---|---|---|
| `401` | 「前端应提示重新登录或会话失效」 | `归档失败：请求失败（HTTP 401）` |
| `403` | 「前端应提示权限不足且禁用对应操作」 | 由 `degradation.js` 归为 `error`，文案同样为「请求失败」 |
| `409` | 「前端应提示刷新并重试」 | `归档失败：请求失败（HTTP 409）` |

**根因（源码级）**：`src/gods_workbench/static/js/degradation.js:21` 与 `:45-52` 的 `statusKind()`
只把 `404` / `501` 归入 `not_integrated`、把 `503` 归入 `service_unavailable`，
**其余一切状态码（含 401/403/409）统一落到 `error`**，其 `messageFor()` 仅产出「请求失败（HTTP N）」。

```javascript
// degradation.js:21  —— 状态码白名单里没有 401 / 403 / 409
var NOT_INTEGRATED_STATUSES = [404, 501];
// degradation.js:48  —— 其余一律 error
if (NOT_INTEGRATED_STATUSES.indexOf(code) === -1) return 'error';
```

### 4.4 边界（**不得越读**）

- 本节只证明**提示文案缺少语义映射**，**不**证明后端契约有误（后端 §3.2/§3.3/§3.4 均正确）。
- 4.2 的 401 是**认证头缺失**的表现，**不**代表归档端点不可用。
- 4.3 的 409 是**拦截注入**，用于隔离验证呈现层；真实环境下因 §4.2 会先返回 401，
  409 提示路径**在真实外部 IdP 接线前无法端到端触达**。

---

## 5. 汇总表

| # | 矩阵项 | 契约层（真实 HTTP） | 呈现层（真实浏览器） | 判定 |
|---|---|---|---|---|
| 1 | 表单写入 | ✅ 201 / 200，版本 1→2 | ⚠️ 真实 UI 写入 401（§4.2，认证头缺失） | 契约 PASS；呈现受既有缺口阻塞 |
| 2 | CAS 409 | ✅ 409 `VERSION_CONFLICT` + 双版本号 | ⚠️ 文案为「请求失败」（§4.3） | 契约 PASS；呈现**规范偏离** |
| 3 | 202 + 轮询 | ✅ 202 + 稳定 `job_id` + `poll_hint` 一致 | 未覆盖（无 UI 入口） | 契约 PASS |
| 4 | 403 只读降级 | ✅ 403 `FORBIDDEN` | ⚠️ 文案为「请求失败」（§4.3） | 契约 PASS；呈现**规范偏离** |
| 5 | 401 未认证 | ✅ 401 `UNAUTHORIZED` | ⚠️ 文案为「请求失败」（§4.3） | 契约 PASS；呈现**规范偏离** |

---

## 6. 待人工裁决

### 6.1 后端契约：**无待裁决项**
§3 五项在真实 HTTP 服务下全部与契约/行为规范一致（含 409 的错误码与双版本号字段）。

### 6.2 前端认证头接线（**已登记的既有缺口，本轮不新增裁决**）
归属 `HANDOFF-10.md` §4 第 4 项「真实外部 IdP 生产登录」：需真实 OP + 凭据 + 环境才可从仓内闭环。

### 6.3 ⚠️ **需裁决**：`degradation.js` 是否为 401/403/409 增加语义化映射

现状与 `BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md` §5（以及 `BEHAVIOR-SPEC-CANVAS.md:69`、
`BEHAVIOR-SPEC-SMART-CANVAS.md:48` 的同义要求）**不符**。可选处置：

| 选项 | 效果 | 代价 |
|---|---|---|
| **A. 维持现状** | 不改代码；把 §5 的语义化提示降级为「未实现」，在台账登记为已知偏离 | 行为规范与实现持续不一致；用户看到的仍是通用文案 |
| **B. 补语义映射** | 在 `statusKind()`/`messageFor()` 中为 `401`/`403`/`409` 增加专门分支与中文文案，前端呈现符合 §5 | 改动共享 `degradation.js`，影响全部消费页面；须补契约测试与浏览器回归 |

**建议**：选 **B**（行为规范已冻结，实现应向规范收敛）。但该改动属**共享层**，
影响面覆盖 v2 壳层与旧页，按 `AGENTS.md` §5 须**人工确认后**再实施。

---

## 7. 边界声明

- 本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权。
- 执行主体为主代理，**不等于**外部第三方独立审计。
- 4.3 的 409 提示路径依赖**注入拦截**，真实环境下受 §4.2 阻塞，**未端到端触达**。
- 本项**未**覆盖：跨页状态保持、多窗口并发、响应式断点、`:hover`/`:focus` 交互态。
