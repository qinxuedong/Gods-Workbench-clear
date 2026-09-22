# Phase 10A 素材库最小闭环（2026-09-22）

## 状态

**本切片内已闭环（本地）**：契约冻结 → 实现 → 黄金夹具 → 契约测试 → 变异验证 → 全量门禁。
仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 1. 本阶段范围

按 T26 裁决顺序（素材库 → 观测 → 提示词库 → 设置页 → 画布闭环），本阶段只做**素材库**首个最小闭环，
严格覆盖 3 个端点，不多做：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/asset-library` | 读取素材库树；空库返回 `libraries: []` |
| POST | `/api/asset-library/libraries` | 创建素材库（CAS + 重名 409） |
| POST | `/api/asset-library/categories` | 创建分类（父库 CAS + 404 + 重名 409） |

其余 `/api/asset-library/*`（items / libraries 明细 / categories 明细 / workflows/upload）**仍属未实现**，
本阶段未获契约授权，已用测试显式守卫其保持 404。

## 2. 契约冻结（原先的阻塞点已解除）

- 新增 `docs/contracts/ASSET-LIBRARY-INTERFACE-CATALOG.yaml`（`version: p10a-frozen-1`）。
- 该文件把此前的非冻结草案 `docs/governance/asset-library-draft-2026-09-22/` 收敛为**可实现的冻结契约**。
- 冻结的裁决项（此前草案中列出的待确认项，现逐条收口）：

| 编号 | 原草案待确认项 | 本阶段冻结结论 |
|---|---|---|
| 1 | 分类 ID 用 `category_id` 还是 `entity_id` | 用 `category_id`（与素材库域稳定 ID 一致） |
| 2 | 创建成功用 201 还是 200 | **201**（与既有 POST 项目创建一致） |
| 3 | 库/分类版本与 CAS 粒度 | 库级 CAS：创建库校验顶层目录 `version`，创建分类校验父库 `expected_version` |
| 4 | 重名语义 | 同作用域重名（trim + 大小写不敏感）→ 409 `DUPLICATE_LIBRARY_NAME` / `DUPLICATE_CATEGORY_NAME` |
| 5 | 空库语义 | 返回 `libraries: []` + `active_library_id: null`，**不自动建默认库、不返回演示数据** |
| 6 | 版本递增 | 新对象 `version=1`；父库 `version += 1`；顶层目录 `version += 1` |

**关于 `entity_id` 的说明**：根 `AGENTS.md` §3.1 的 `entity_id` 是**画布拓扑节点**的稳定 ID；
素材库分类属于独立实体族，本阶段统一使用 `category_id`，两者不冲突。

## 3. 交付物

| 类型 | 文件 |
|---|---|
| 契约 | `docs/contracts/ASSET-LIBRARY-INTERFACE-CATALOG.yaml` |
| 领域模型 | `src/gods_workbench/asset_library/models.py` |
| 服务层 | `src/gods_workbench/asset_library/service.py` |
| 路由 | `src/gods_workbench/api/routes_asset_library.py`（已接入 `api/app.py`） |
| 黄金夹具 | `docs/fixtures/asset-library-{empty,with-library-category,create-library-request,create-category-request,conflict-409,duplicate-409}.json` |
| 夹具清单 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`（9 → 15 条） |
| 契约测试 | `tests/contracts/test_phase10a_asset_library.py`（14 条） |
| 夹具测试 | `tests/contracts/test_golden_fixtures.py` 追加 5 条 |
| 基线更新 | `tests/contracts/test_phase8_frontend_backend_api_gap.py`（3 条从缺口迁入已实现） |

## 4. 门禁证据（本地实测）

```text
python -P -m pytest -q
301 passed, 7 skipped

python -P -m pytest tests/hygiene -q
16 passed
```

- 素材库契约测试：**14 passed**。
- 黄金夹具测试：**16 passed**（原 11 + 新增 5）。

### 4.1 变异测试（证明守卫非恒真）

对 `service.py` / `routes_asset_library.py` 注入 4 个变异，逐一被守卫捕获并已还原：

| 变异 | 注入内容 | 结果 |
|---|---|---|
| M1 | 去除父库 CAS 校验 | 1 failed, 13 passed |
| M2 | 去除素材库重名守卫 | 1 failed, 13 passed |
| M3 | 空库返回伪造「演示库」 | 1 failed, 13 passed |
| M4 | 写权限检查降级为仅认证 | 1 failed, 13 passed |
| 还原 | — | **14 passed** |

## 5. 洁净室边界声明

- **未引入旧仓源码**：全部实现依据冻结契约与前端调用面**重新编写**；
  原草案 `docs/governance/asset-library-draft-2026-09-22/` 仅作语义参考，未复制其结构或实现。
- **未伪造数据**：空库测试显式断言不得返回演示素材（M3 变异已被守卫拦下）。
- **未越权扩大范围**：未获契约的素材库端点有专门用例断言其仍 404。
- 前端 `js/asset-manager.js` 以 `x.library_id || x.id` 兼容读取；本阶段未改动前端，
  未破坏既有 localStorage 自定义看板状态。

## 6. 仍未闭环（不得写 PASS）

- 真实第三方独立审计（T36 / T40）与发布授权：**未安排**。
- 真实外部 IdP 生产登录：**未执行**。
- 素材库持久化：本阶段为**进程内内存**存储，重启即丢失、多 worker 不共享；属部署方职责。
- 素材库的归档 / 重命名 / 删除 / 条目上传 / 批量操作：**未实现**，需另行立项并冻结契约。
- 本阶段所有证据均为**本机实测**，不等于远端 CI，更不等于生产验收。
