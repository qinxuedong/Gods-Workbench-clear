# Phase 10B 观测阶段最小闭环（2026-09-22）

## 状态

**本切片内已闭环（本地）**：契约冻结 → 实现 → 黄金夹具 → 契约测试 → 变异验证 → 全量门禁。
仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
本阶段所有证据均为**本机实测**，不等于远端 CI，更不等于生产验收。

## 1. 本阶段范围

`/api/observability` 及其 7 个子资源，共 **8 个 GET 端点**，不多做：

| 方法 | 路径 | 语义 |
|---|---|---|
| GET | `/api/observability` | 观测资源索引（只列本阶段已实现端点） |
| GET | `/api/observability/overview` | 真实项目/任务计数总览 |
| GET | `/api/observability/series` | 指标序列（未接入 → 空 + not_integrated） |
| GET | `/api/observability/events` | 已脱敏认证审计事件（core.audit） |
| GET | `/api/observability/tasks` | god-canvas 进程内任务投影 |
| GET | `/api/observability/health` | 本进程组件可用性（如实） |
| GET | `/api/observability/sources` | 数据源注册表（未接入 → 空数组） |
| GET | `/api/observability/asset-volumes` | 素材体积索引（未接入 → 空数组） |

契约：`docs/contracts/OBSERVABILITY-INTERFACE-CATALOG.yaml`（`version: p10b-frozen-1`）。
契约内已显式写明「未接入数据源一律返回空 + data_status=not_integrated，禁止伪造」。

其余 `/api/*`（含 `/api/asset-library/*` 的 items / libraries 明细、`/api/prompt-libraries*`）
**仍未获契约授权**，已用测试显式守卫其保持不可用（404/405）。

## 2. 零伪造数据口径

| 端点 | 真实来源 | 无数据时的行为 |
|---|---|---|
| overview | `ProjectsService` 内存项目表 + `GodCanvasService` 内存任务表 | 计数为真实 0；未接入指标（p95 延迟）为 null 并登记 data_gaps |
| tasks | `GodCanvasService.list_jobs()`（只读深拷贝投影） | 空数组（`items: []`） |
| events | `core.audit.list_auth_events()`（已脱敏白名单字段） | 空数组，绝不编造事件 |
| health | projects / canvas / asset_library 实例可用性 + 审计缓冲可读性 | 组件不可用即 `failed`，未接入组件即 `not_integrated` |
| series | 无（本阶段无真实时间序列数据源） | 空序列 + `data_status: not_integrated` |
| sources | 无（本阶段未接入数据源注册表） | 空数组 + `data_status: not_integrated` |
| asset-volumes | 无（本阶段未接入素材体积索引） | 空数组 + `data_status: not_integrated` |

- 全模块**不使用** `random` / 随机抖动 / 常量曲线 / 演示数据；源码级反向断言
  （`test_no_randomness_or_fake_telemetry_in_service_source`）持续守卫该口径。
- 硬件遥测（CPU/内存/磁盘）**本阶段不提供**，health 中固定为 `not_integrated`。

## 3. 过滤条件口径（不静默忽略）

无法求值的过滤条件绝不静默忽略，一律在 `data_gaps` 披露：

- **fail-closed**：会误导「命中」判断的条件（events/tasks 上的
  `project_id`/`job_id`/`entity_id`/`asset_id`/`canvas_id`/`stable_id`，tasks 上的
  `source`/`level`）→ 返回**空集合** + `data_status=degraded`；
- **snapshot-disclosed**：tasks 的 `range`/`start_ms`/`end_ms`（任务表无时间戳）→
  返回**真实快照** + `degraded`，并在 `data_gaps` 写明时间条件未生效。
  取舍理由：任务中心默认携带 `range`，返回空会把真实任务误报为「窗口内无任务」。
- 本阶段真实可求值的过滤：events 的 `status`/`level`/`source`/`event_id`/时间窗；
  tasks 的 `status`/`job_id`。

## 4. 交付物

| 类型 | 文件 |
|---|---|
| 契约 | `docs/contracts/OBSERVABILITY-INTERFACE-CATALOG.yaml` |
| 领域模块 | `src/gods_workbench/observability/__init__.py`（模块 docstring） |
| 领域模型 | `src/gods_workbench/observability/models.py`（Pydantic v2） |
| 服务层 | `src/gods_workbench/observability/service.py` |
| 路由 | `src/gods_workbench/api/routes_observability.py`（已接入 `api/app.py`） |
| 只读投影 | `GodCanvasService.list_jobs()`（`src/gods_workbench/god_canvas/service.py`，纯读取深拷贝） |
| 黄金夹具 | `docs/fixtures/observability-empty-not-integrated.json`、`observability-health-truthful.json` |
| 夹具清单 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`（15 → 17 条） |
| 契约测试 | `tests/contracts/test_phase10b_observability.py`（50 条） |
| 夹具测试 | `tests/contracts/test_golden_fixtures.py`（追加 2 条） |
| 基线更新 | `tests/contracts/test_phase8_frontend_backend_api_gap.py`（8 条从缺口迁入已实现） |
| 来源登记 | `docs/provenance/PHASE-2-INPUT-SHA256.txt`（条目数仍为 16） |

## 5. 门禁证据（本地实测）

```text
python -P -m pytest -q
353 passed, 7 skipped

python -P -m pytest tests/hygiene -q
16 passed
```

- 观测契约测试：**50 passed**。
- 黄金夹具测试：**18 passed**（原 16 + 新增 2）。
- Phase 8 缺口基线守卫：**6 passed**。

### 5.1 变异测试（证明守卫非恒真）

对 `observability/service.py` 与 `api/routes_observability.py` 注入 9 个变异，
逐一被守卫捕获并已还原（还原后 50 passed）：

| 变异 | 注入内容 | 结果 |
|---|---|---|
| M1 | sources 空响应改成伪造数据源条目 | 1 failed, 48 passed |
| M2 | 移除 overview 的认证检查（去 401） | 1 failed, 48 passed |
| M3 | health 恒为 ok（未接入组件也报 ok） | 2 failed, 47 passed |
| M4 | 无事件时编造事件 | 3 failed, 46 passed |
| M5 | series 空序列改成伪造波形 | 1 failed, 48 passed |
| M6 | 引入 `import random` | 1 failed, 48 passed |
| M7 | 静默忽略无法求值的 ID 过滤 | 1 failed, 48 passed |
| M8 | 分页忽略 `limit` | 2 failed, 47 passed |
| M9 | 无任务时编造演示任务 | 1 failed, 66 passed（含夹具测试） |
| 还原 | — | **50 passed** |

## 6. 洁净室边界声明

- **未引入旧仓源码**：实现依据冻结契约、根宪章 §3 与前端调用面**重新编写**；
  未读取、未复制旧仓实现。
- **未伪造数据**：M1/M4/M5/M9 四个「伪造数据」变异均被守卫拦下。
- **未越权扩大范围**：未获契约的端点有专门用例断言其仍不可用（404/405）。
- **未改动前端**：本阶段只做后端与契约；`task-center.js` 既有调用面保持不变，
  未破坏其 localStorage 偏好与降级路径。

## 7. 仍未闭环（不得写 PASS）

- 真实第三方独立审计与发布授权：**未安排**。
- 观测数据持久化：本阶段为**进程内内存**读取，重启即丢失、多 worker 不共享。
- 硬件遥测（CPU/内存/磁盘）：**未接入**，health 中固定 `not_integrated`。
- 指标时间序列（series）：**未接入**，固定返回空 + `not_integrated`。
- 数据源注册表（sources）与素材体积（asset-volumes）：**未接入**，固定返回空数组。
- 事件来源仅覆盖 `core.audit` 的认证审计；HTTP 访问日志、任务事件总线等**未接入**。
- 任务表未记录时间戳与 project_id/canvas_id 等关联，故时间窗与作用域过滤**无法求值**
  （已按上述口径披露，而非补齐字段）。
- 前端真实浏览器 E2E（渲染与降级路径）在本阶段**未执行**。
- `docs/governance/TASKS.md` 的阶段状态位**未改动**（阶段状态变更需人工明确确认）。

## 8. R3 独立复核发现的静默失败缺口与修复（2026-09-22）

独立复核 R3（dispatch `ctx_1dec280ac298`）在复跑门禁与文档一致后，指出 3 项**诚实性**缺口。
主代理已独立确证并修复，三项均属「把不可用伪装成正常」的反洁净室红线：

| 编号 | 缺口 | 修复 |
|---|---|---|
| R3-1 | `_read_audit_records()` 异常时返回 `[]`，`events` 在源不可用时仍报 `data_status=ok` + `data_gaps=[]` | 返回类型改为 `Optional[List[...]]`：成功但为空 → `[]`；读取失败 → `None`。`events()` 遇 `None` 立即返回 `degraded` + `data_gaps=[GAP_AUDIT_UNAVAILABLE]` |
| R3-2 | `health()` 的 `audit_buffer` 检查无失败分支，恒为 `ok` | 增加 `records is None` 分支：`status="failed"` + `gaps.append(...)`，整体自动降级为 `degraded` |
| R3-3 | 夹具 `observability-empty-not-integrated.json` 的 `asset_volumes.limit=40` 与服务默认 `DEFAULT_LIMIT=50` 不一致 | 夹具改为 50，与 events/tasks/sources 口径统一 |

### 8.1 新增回归测试（3 条）

- `test_events_degrades_when_audit_source_is_unreadable`
- `test_health_reports_audit_buffer_failure_not_ok`
- `test_read_audit_records_distinguishes_failure_from_empty`

### 8.2 变异复验（证明新守卫非恒真）

| 变异 | 注入点 | 结果 |
|---|---|---|
| M-R3-1 | `_read_audit_records()` 的 `return None` 还原为 `return []` | **3 failed**（三条回归测试全部捕获） |
| M-R3-2 | `health()` 的 `audit_buffer.status` 由 `failed` 改回 `ok` | **1 failed**（`failure_not_ok` 捕获） |
| 还原 | — | 53 passed |

### 8.3 修复后门禁（本地实测）

```text
python -P -m pytest tests/contracts/test_phase10b_observability.py -q
53 passed

python -P -m pytest -q
356 passed, 7 skipped

python -P -m pytest tests/hygiene -q
16 passed
```

> 注：`_read_audit_records()` 是 Phase 10A/10B 内部私有读取口径，本修复未新增任何契约端点，
> 未扩大对外接口面，仅在既有 8 个观测端点内把「静默失败」改为「如实降级」。
