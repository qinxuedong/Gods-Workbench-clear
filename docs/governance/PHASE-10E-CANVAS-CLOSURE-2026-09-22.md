# Phase 10E 画布闭环阶段最小闭环（2026-09-22）

## 状态

**本切片内已闭环（本地）**：契约冻结 → 实现 → 黄金夹具 → 契约测试 → 变异验证 → 全量门禁。

仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
本阶段所有证据均为**本机实测**，不等于真实外部接口验收或发布授权。

按 T26 顺序（素材库 → 观测 → 提示词库 → 设置页 → **画布闭环**），本阶段为最后一段切片：
补齐画布闭环 15 条路径 / 20 个方法条目（含方法别名），
使 god-canvas 的元信息、归档、回收站、共享文件夹、视频任务、参考画布、素材索引形成最小可验证闭环。

## 1. 范围与端点清单

| 方法 | 路径 | 语义 |
|---|---|---|
| GET | `/api/canvas-assets` | 读取画布素材索引快照（空来源时 `canvases`/`items` 为空，`data_status: not_integrated`） |
| POST | `/api/canvas-assets/download` | 素材打包下载；本阶段固定 503 `CANVAS_ASSET_DOWNLOAD_NOT_INTEGRATED` |
| POST | `/api/canvases/assets` | 素材挂接到画布；本阶段固定 503 `CANVAS_ASSET_ATTACH_NOT_INTEGRATED` |
| GET | `/api/reference-canvases` | 参考画布列表；起始为空、非伪造条目 |
| POST | `/api/reference-canvases` | 创建参考画布（`title` 必填，CAS 生效） |
| GET | `/api/shared-folders` | 共享文件夹列表；起始为空、`revision` 稳定 |
| POST | `/api/shared-folders` | 登记共享文件夹（路径归一化 + 越界拒绝、确定性 ID） |
| POST | `/api/shared-folders/import` | 导入共享文件夹条目；本阶段固定 503 `SHARED_FOLDER_IMPORT_NOT_INTEGRATED` |
| GET | `/api/shared-folders/{folder_id}/tree` | 读取目录树；目标存在时 503 `SHARED_FOLDER_TREE_NOT_INTEGRATED`，不存在 404 |
| DELETE | `/api/shared-folders/{folder_id}` | 移除共享文件夹 |
| GET | `/api/video-tasks` | 视频任务列表；起始为空、`data_status: not_integrated` |
| POST | `/api/video-tasks` | 创建视频任务；本阶段固定 503 `VIDEO_RENDERER_NOT_INTEGRATED` |
| GET | `/api/video-tasks/{video_task_id}` | 读取单任务；不存在返回 404 `VIDEO_TASK_NOT_FOUND` |
| GET | `/api/canvases/trash` | 回收站 / 归档视图；起始为空、非伪造条目 |
| PATCH / POST | `/api/canvases/{canvas_id}/meta` | 更新画布元信息（**方法别名并存**，CAS 生效） |
| POST | `/api/canvases/{canvas_id}/touch` | 归档 / 解归档（`archive` / `unarchive`） |
| POST / DELETE | `/api/canvases/{canvas_id}/purge` | 彻底删除（**方法别名并存**） |
| DELETE | `/api/canvases/{canvas_id}` | 移入回收站 |

相邻未授权端点已用测试显式守卫其保持 404/405。

## 2. 契约冻结与裁决项

新增契约 `docs/contracts/CANVAS-CLOSURE-INTERFACE-CATALOG.yaml`（`version: p10e-frozen-1`）。

| # | 裁决项 | 结论 |
|---|---|---|
| 1 | 方法别名 | 任务书写 `PATCH /meta`、`POST /purge`，前端实测为 `POST /meta`、`DELETE /purge`；两组方法**并存**、共享同一实现与守卫，`decisions.method_aliases` 显式声明 |
| 2 | 方法条目计数 | 15 条独立路径 / 20 个方法条目。其中 5 条路径各带两个方法；reference-canvases / shared-folders / video-tasks 为天然 GET+POST 配对（本身就是两个资源动作），meta / purge 为别名对（各自共享同一实现与守卫）。“3 个别名条目”的口径不准，已修正 |
| 3 | 稳定 ID | `canvas_id` / `folder_id`（`fold_NNNN` 确定性序号）/ `video_task_id` / `asset_id`；前端兼容字段 `id` / `project` 由 `decisions.frontend_compat` 显式声明 |
| 4 | 零伪造 + fail-closed | 未接入的渲染 / 扫描 / 打包链路一律 503 且不携带 `task_id`/`progress`/`eta`/`url` |
| 5 | CAS | 元信息 / 归档 / 回收站 / 画布拓扑写操作必须携带 `expected_version`，冲突返回 409 `CANVAS_VERSION_CONFLICT` |
| 6 | 认证 | 读需认证（401 `UNAUTHORIZED`），写需 `require_edit_access`（403 FORBIDDEN） |
| 7 | 生命周期侧表 | `GodCanvasService._lifecycle` 承载 kind / entity_id / archived_at / deleted_at；**不改 `CanvasItem`**，避免破坏既有 `/api/canvases` 契约模型 |

## 3. 交付物

| 类型 | 文件 |
|---|---|
| 契约 | `docs/contracts/CANVAS-CLOSURE-INTERFACE-CATALOG.yaml` |
| 领域模块 | `src/gods_workbench/canvas_closure/{__init__,models,service}.py` |
| 路由 | `src/gods_workbench/api/routes_canvas_closure.py`（已接入 `api/app.py`） |
| 服务扩展 | `src/gods_workbench/god_canvas/service.py`（生命周期侧表 + meta/touch/trash/purge/reference 载荷） |
| 黄金夹具 | 6 件 `docs/fixtures/canvas-closure-*.json` |
| 夹具清单 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`（27 → 33 条） |
| 契约测试 | `tests/contracts/test_phase10e_canvas_closure.py`（43 用例） |
| 基线对齐 | `tests/contracts/test_phase8_frontend_backend_api_gap.py`（14 条从 KNOWN_UNIMPLEMENTED 转入 KNOWN_IMPLEMENTED） |
| 输入登记 | `docs/provenance/PHASE-2-INPUT-SHA256.txt`（条目数仍为 16） |

## 4. 仍未闭环（不得写 PASS）

- 真实第三方独立审计与发布授权：**未安排**；仓库仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION。
- 真实外部 IdP **生产**登录：未做。
- 全部存储仍是**进程内内存**，重启即丢失、多 worker 不共享。
- 视频渲染、素材打包下载、素材挂接、共享文件夹真实目录扫描 / 导入：**未接入**，端点固定 fail-closed。
- 前端真实浏览器 E2E 在本阶段**未执行**。
- `AGENTS.md` 401 大小写口径漂移（P10-R-1）**已由用户 2026-09-23 裁决 A 收口**：以实现为准（**全大写 `UNAUTHORIZED`**），契约侧小写写法已更正。**更正**：该差异的真实性质是**纯 ASCII 大小写**，**不是同形字**；此前「含同形字的小写」表述源自终端渲染伪影造成的误判，现如实更正。

## 5. 门禁证据（本地实测）

```text
python -P -m pytest tests/contracts/test_phase10e_canvas_closure.py -q
43 passed

python -P -m pytest -q
487 passed, 7 skipped

python -P -m pytest tests/hygiene -q
16 passed
```

### 5.1 变异测试（证明守卫非恒真）

| 变异 | 注入点 | 结果 |
|---|---|---|
| M1 | `god_canvas/service.py` 元信息 CAS 判断改为恒假 | **3 failed**（`test_update_canvas_meta_cas_conflict_matches_fixture` 等 CAS 系列全部捕获） |
| M2 | `create_video_task` 改为直接返回伪造 `task_id`/`progress`/`eta`/`url` | **1 failed**（`test_create_video_task_is_fail_closed`） |
| M3 | `list_reference_canvases` 空集合塞入演示条目 | **1 failed**（`test_reference_canvases_start_empty`） |
| M4 | `canvas_closure/models.py` 放开共享文件夹 `..` 越界校验 | **1 failed**（越界路径用例被捕获） |
| M5 | `god_canvas/service.py` 去掉 `CANVAS_NOT_IN_TRASH` 守卫 | **2 failed**（purge 流程用例被捕获） |
| M6 | `canvas_closure/service.py` 删除不存在共享文件夹改为静默成功 | **1 failed**（404 用例被捕获） |
| 还原 | — | **43 passed** |

六次变异均按预期失败，说明对应守卫与「零伪造」断言不是恒真；每次注入后均已完整还原（逐字节比对一致）。

### 5.2 默认运行时边界（避免误读）

`src/gods_workbench/god_canvas/service.py` 的默认单例 `default_god_canvas_service`
以 `seed_golden_fixture=True` 预置一张黄金画布 `cv-0001`（该行为在 Phase 8 即已存在，
**本阶段未修改**）。因此在未重置的默认进程内，
`GET /api/canvas-assets` 的 `canvases` 不为空（含 `cv-0001`）。

`canvas-closure-asset-index-empty.json` 对应的是**显式空来源服务**（`GodCanvasService(seed_golden_fixture=False)`）
的快照，用于验证“无来源时不伪造条目”，
**不代表默认进程启动即返回空集**。中标套件与入口文档不得将两者混淆。

## 5.3 独立复核与自证边界（重要）

本轮**未能建立独立第三方复核通道**：多个子代理（Codex 子任务与 Orca worker）
均因 `429 Too Many Requests` / 传输失败而未接收任务与回报；
已事实清点为“本轮无独立复核”，不得当作已完成审计。

**代以本机对抗式重算作为下级陈述**（不等于独立第三方审计）：

| 项 | 方法 | 结果 |
|---|---|---|
| 契约完整性 | `yaml.safe_load` + `app.openapi()["paths"]` 交集比对 | 20 个方法条目 / 15 条路径，**无缺失注册** |
| fail-closed | TestClient 实测 4 个 503 端点 | 均 503，响应体无 `task_id`/`progress`/`eta`/`url` |
| 空集合 | `seed_golden_fixture=False` 服务实测 | trash / reference / shared-folders / video-tasks 均空 |
| CAS | PATCH/POST `/meta` 、DELETE 原生与未入回收站 purge | 409 `CANVAS_VERSION_CONFLICT` / 409 `CANVAS_NOT_IN_TRASH` |
| 别名等价 | meta PATCH/POST、purge POST/DELETE 各组 | 同实现同守卫，200/404/401 行为一致 |
| 认证权限 | 未认证 / readonly | 401 / 403，符合契约 |
| 洁净室 | 文件扫描 | 无 `random`/`uuid` 生成业务数据 |

**同时复算 Phase 10D**（历史提交 `151669d`，CI run 35720901338 = success）：
契约 13 个方法 / 8 条路径；`GET /api/storage-settings` 为 `configured:false`、
`GET /api/providers` 为 `providers:[]`；三条探测端点均 503 `PROVIDER_PROBE_NOT_INTEGRATED`；
存储设置 409 `VERSION_CONFLICT`；结构体 409 `STRUCTURE_VERSION_CONFLICT`；
provider 的 `[FUNC]`/`token`/`password` 不回显；隔储邻域端点 404。

**结论口径**：上述为**本机对抗式自证**，
不能替代 T36/T40 的真实第三方独立审计与发布授权。

## 6. 洁净室边界声明

- 未引入旧仓源码；实现依据冻结契约与前端调用面重新编写。
- 未伪造视频任务、素材条目、共享文件夹条目或参考画布条目。
- 未改变既有 `/api/canvases` 契约模型；生命周期元数据放入侧表。
- 未改动前端。
