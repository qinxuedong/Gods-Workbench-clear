# Phase 10D 设置页阶段最小闭环（2026-09-22）

## 状态

**本切片内已闭环（本地）**：契约冻结 → 实现 → 黄金夹具 → 契约测试 → 变异验证 → 全量门禁。

仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
本阶段所有证据均为**本机实测**，不等于远端 CI，更不等于生产验收。

## 1. 本阶段范围

按 T26 顺序（素材库 → 观测 → 提示词库 → **设置页** → 画布闭环），
本阶段只做设置页 8 条归一化路径 / 13 个方法，不多做：

| 方法 | 路径 | 语义 |
|---|---|---|
| GET | `/api/storage-settings` | 读取存储设置；无来源时 `configured: false` |
| PATCH | `/api/storage-settings` | 保存存储设置（CAS `revision`） |
| GET | `/api/providers` | 读取平台列表；默认 `providers: []` |
| PUT | `/api/providers` | 整体替换平台列表（CAS `revision`，剥离凭据） |
| POST | `/api/providers/fetch-models` | 本阶段 fail-closed（503） |
| POST | `/api/providers/probe-async` | 本阶段 fail-closed（503） |
| POST | `/api/providers/test-connection` | 本阶段 fail-closed（503） |
| GET | `/api/asset-registry/asset-structures` | 读取结构集合 |
| POST | `/api/asset-registry/asset-structures` | 创建结构 |
| GET | `/api/asset-registry/asset-structures/{structure_id}` | 读取单结构 |
| PATCH | `/api/asset-registry/asset-structures/{structure_id}` | 更新结构 |
| PATCH | `/api/asset-registry/asset-structures/{structure_id}/current` | 切换当前素材 |
| DELETE | `/api/asset-registry/asset-structures/{structure_id}` | 删除结构 |

相邻未授权端点（`/api/asset-registry/assets*`、`/api/local-assets*`、`/api/storage-files*`、
`/api/asset-registry/reindex`、`/api/asset-registry/project-directory*`）仍属 KNOWN_UNIMPLEMENTED，
已用测试显式守卫其保持 404/405。

## 2. 契约冻结与裁决项

新增 `docs/contracts/SETTINGS-INTERFACE-CATALOG.yaml`（`version: p10d-frozen-1`）。

| # | 裁决项 | 冻结结论 |
|---|---|---|
| 1 | 稳定 ID | 结构体 `structure_id`（`strc_NNNN`）；provider 以调用方提交的 `id`/`provider_id` 为准，服务端不自造厂商 ID |
| 2 | 零伪造 | 空 providers、未配置 storage-settings 如实标记；探测端点不得返回模型列表/延迟 |
| 3 | 探测语义 | 三个探测端点一律 503 `PROVIDER_PROBE_NOT_INTEGRATED` |
| 4 | CAS | 存储/平台用 `revision` → 409 `VERSION_CONFLICT`；结构体用结构级 `version` → 409 `STRUCTURE_VERSION_CONFLICT` |
| 5 | 凭据 | provider 的 key/secret/token/password 一类字段剥离，不落库、不回显 |
| 6 | 认证 | 读需认证，写需 `require_edit_access` |

## 3. 交付物

| 类型 | 文件 |
|---|---|
| 契约 | `docs/contracts/SETTINGS-INTERFACE-CATALOG.yaml` |
| 领域模块 | `src/gods_workbench/settings/{__init__,models,service}.py` |
| 路由 | `src/gods_workbench/api/routes_settings.py`（已接入 `api/app.py`） |
| 黄金夹具 | 5 件 `docs/fixtures/settings-*.json` |
| 夹具清单 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`（22 → 27 条） |
| 契约测试 | `tests/contracts/test_phase10d_settings.py` |
| 基线更新 | `tests/contracts/test_phase8_frontend_backend_api_gap.py` |
| 输入登记 | `docs/provenance/PHASE-2-INPUT-SHA256.txt`（条目数仍为 16） |

## 4. 仍未闭环（不得写 PASS）

- 真实第三方独立审计与发布授权：**未安排**。
- 设置页持久化：本阶段为**进程内内存**存储，重启即丢失、多 worker 不共享。
- 真实外网探测 / 拉取上游模型：**未接入**，探测端点固定 fail-closed。
- 素材注册表成员元数据、本地素材库文件扫描、存储文件浏览：**未实现**。
- 前端真实浏览器 E2E 在本阶段**未执行**。
- `api-settings` 页面整体仍标记为「未纳入当前切片」的大功能面；本阶段只补后端契约最小闭环。

## 5. 门禁证据（本地实测）

```text
python -P -m pytest tests/contracts/test_phase10d_settings.py -q
29 passed

python -P -m pytest -q
438 passed, 7 skipped

python -P -m pytest tests/hygiene -q
16 passed
```

### 5.1 变异测试（证明守卫非恒真）

| 变异 | 注入点 | 结果 |
|---|---|---|
| M1 | 存储设置 CAS 判断改为恒假 | **1 failed**（`test_patch_storage_settings_success_and_cas_conflict`） |
| M2 | ProviderService 默认预置演示厂商 | **1 failed**（`test_get_providers_empty_by_default`） |
| M3 | `raise_probe_not_integrated` 直接 return | **3 failed**（三条探测路径全部捕获） |
| 还原 | — | **29 passed** |

## 6. 洁净室边界声明

- 未引入旧仓源码；实现依据冻结契约与前端调用面重新编写。
- 未伪造厂商列表、根目录、模型列表或延迟数字。
- 未越权实现 `/api/asset-registry/assets*` / `/api/local-assets*` / `/api/storage-files*`。
- 未改动前端。`local_libraries[].id` 与 provider 条目的 `id` 为前端既有调用面兼容字段，
  服务端同时登记 `provider_id`；结构体对外只使用 `structure_id`。
