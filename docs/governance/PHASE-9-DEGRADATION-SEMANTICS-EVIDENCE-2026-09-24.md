# Phase 9 401/403/409 降级语义映射证据（2026-09-24）

## 1. 变更范围

本轮仅收口共享经典脚本 `src/gods_workbench/static/js/degradation.js`，并补充其契约守卫：

- `401` → `unauthorized`：会话失效或未认证，提示重新登录；
- `403` → `forbidden`：权限不足，切换为只读；
- `409` → `conflict`：CAS 版本冲突，提示刷新并解决并发差异后重试。

`404/501` 的 `not_integrated`、`503` 的 `service_unavailable` 语义保持不变。
409 错误包中的具体 `detail.code` 会保留（例如 `CANVAS_VERSION_CONFLICT`），分类层不伪造领域错误码。

## 2. 冻结依据

- `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md:100-104`：
  401 提示重新登录或会话失效；403 提示权限不足且禁用对应操作；409 提示刷新并重试。
- `docs/behavior/BEHAVIOR-SPEC-CANVAS.md:64-69`：
  401 会话失效/未认证并禁止写操作；403 无写权限并只读降级；409 版本冲突并提示刷新解决并发差异。
- `docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md:43-48`：
  401 禁止任务发起与画布写入；403 仅保留只读能力；409 拉取最新并重试。

## 3. 实现证据

- `degradation.js:9-14`：共享模块注释登记 401/403/409 与 404/501/503 的分离语义。
- `degradation.js:22-29`：三类冻结语义文案及状态集合。
- `degradation.js:53-63`：`statusKind()` 按 HTTP 状态映射 `unauthorized`、`forbidden`、`conflict`。
- `degradation.js:65-80`：`classifyResponse()` 返回分类与对应提示。
- `degradation.js:82-111`：结构化错误保留标准错误码；403 标记 `readOnly=true`，409 标记 `refreshRequired=true` 与可重试。
- `degradation.js:122-140`：暴露三类语义谓词，供传统脚本调用。
- `degradation.js:143-169`：显式占位按分类渲染，不把认证、权限和冲突归为通用请求失败。

## 4. 自动化验证

命令：

```text
python -m pytest tests/contracts/test_phase9_degradation_runtime.py tests/contracts/test_phase9_frontend_degradation.py -q
```

结果：`68 passed in 0.41s`。

运行时守卫通过 Node 真实加载 `degradation.js`，验证：

- 401 → `unauthorized` / `UNAUTHORIZED` / `UnauthorizedError`，提示重新登录；
- 403 → `forbidden` / `FORBIDDEN` / `ForbiddenError`，`readOnly=true`；
- 409 + `CANVAS_VERSION_CONFLICT` → `conflict` / 保留原错误码 / `ConflictError`，`retryable=true`、`refreshRequired=true`；
- 原有 404/501/503/200 分支继续通过。

变异自证（仅临时目录，未修改仓库）：将 `401` 映射改为 `error` 后，Node 负向探针退出码为 `1`，捕获到实际分类 `error` 与预期 `unauthorized` 不一致；正式文件随后未被修改。

## 5. 证据边界

以上是本地 Python 契约测试与 Node 脚本运行时行为证据，不等于真实浏览器 E2E、远端 CI、后端端点已实现或生产验收。未修改 `http-transport.js`；本轮只负责经典共享降级模块的语义分类与结构化错误投影。
