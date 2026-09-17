# Phase 5 最小垂直切片验收记录

## 记录日期

**2026-09-17**

## 阶段目标

以 Phase 3 冻结契约与黄金夹具为唯一输入边界，在 Phase 4 洁净骨架之上实施最小垂直切片。覆盖：
1. 切片 A：项目中心端到端最小链路与 V2 前端自有切片净化点亮；
2. 切片 B+C：`god-canvas` 统一最小链路（普通画布拓扑读写、CAS 乐观锁、.godmap 导入导出，以及智能画布 202 Accepted 异步受理状态机与 401/403 权限边界）。

---

## 产出物清单

### 1. 切片 A：项目中心前端点亮与内存服务层
- `src/gods_workbench/projects_hub/service.py`：线程安全内存数据存储，提供 CRUD、CAS 乐观锁并发控制（`expected_version` 不匹配抛 `VERSION_CONFLICT` 409）与归档/回收站流转。
- `src/gods_workbench/static/`：纯自有 V2 前端切片净化移植：
  - `hardware-design-system.css`、`project-date-range.css`；
  - `projects.html`、`projects-controller.js`、`v2-shell.js`、`hardware-telemetry.js`、`project-date-range.js`；
  - `workshop.html`（工作台/画布入口友好洁净重写占位页）；
  - 彻底排除上游旧画布脚本与本地二进制字体文件，全量采用线上 CDN。
- `run.py`：项目根目录一键启动入口，统一固定默认运行端口为 `2077`。

### 2. 切片 B+C：`god-canvas` 统一拓扑与智能异步任务
- `src/gods_workbench/god_canvas/models.py`：支持节点、连线（双向别名兼容）、拓扑模型与任务模型。
- `src/gods_workbench/god_canvas/godmap.py`：`.godmap` 原生格式编解码工具。
- `src/gods_workbench/god_canvas/service.py`：`GodCanvasService` 统一管理普通拓扑与智能任务池：
  - 普通拓扑：绑定黄金夹具种子 `cv-0001`，严格支持基于 `expected_version` 的 CAS 乐观锁并发控制（409 `CANVAS_VERSION_CONFLICT`）；
  - 导入导出：支持 JSON 与 `.godmap` 结构校验导入与导出；
  - 智能任务：`submit_smart_task` 状态机，受理成功返回 `202 Accepted`，携带稳定 `job_id` 与 `poll_hint: /api/jobs/{job_id}`；
  - 权限边界：未认证拦截为 `401 UNAUTHORIZED`，只读角色拦截为 `403 FORBIDDEN`。
- `src/gods_workbench/api/routes_god_canvas.py`：挂载 `/api/canvases` 与 `/api/jobs/{job_id}`。

### 3. 规约与治理文档同步
- `AGENTS.md`：确立 `god-canvas` 统一命名规范与 2077 默认运行端口规范。
- `docs/vertical-slices/MINIMAL-VERTICAL-SLICE-SCOPE.md`：合并切片 B 与切片 C 为 `切片 B+C：god-canvas 统一最小链路`。

---

## 验证与测试结果

- **测试命令**：`pytest -v`
- **执行结果**：`20 passed in 0.14s` (通过率 100%)
- **测试覆盖范畴**：
  - 9 个黄金夹具契约解析与断言：100% PASS；
  - 项目中心 CRUD、CAS 409 冲突与生命周期状态机：PASS；
  - 前端静态文件挂载、首页 307 重定向与 API 探测：PASS；
  - `god-canvas` 拓扑读写、CAS 409 冲突与 `.godmap` 编解码：PASS；
  - 智能任务 202 受理、job 状态轮询、401 未认证与 403 权限降级：PASS；
  - 全仓洁净卫生自检（无受限二进制、无旧仓依赖泄漏、插件协议排除）：PASS。

---

## 结论与后续阶段授权

**Phase 5 最小垂直切片验收完毕**。业务数据流与前端页面已真实打通，符合洁净室章程与《AGENTS.md》，**批准进入 Phase 6（全面测试与契约质量门禁）**。
