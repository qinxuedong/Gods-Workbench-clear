# Phase 10C 提示词库阶段最小闭环（2026-09-22）

## 状态

**本切片内已闭环（本地）**：契约冻结 → 实现 → 黄金夹具 → 契约测试 → 变异验证 → 全量门禁。

仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
本阶段所有证据均为**本机实测**，不等于远端 CI，更不等于生产验收。

## 1. 本阶段范围

`/api/prompt-libraries` 本阶段只做**提示词库结构**：7 个端点，不多做：

| 方法 | 路径 | 语义 |
|---|---|---|
| GET | `/api/prompt-libraries` | 读取提示词库树；空库返回 `libraries: []` |
| POST | `/api/prompt-libraries` | 创建提示词库 |
| PATCH | `/api/prompt-libraries/{library_id}` | 重命名提示词库 |
| DELETE | `/api/prompt-libraries/{library_id}` | 删除提示词库（非空 → 409） |
| POST | `/api/prompt-libraries/categories` | 创建分类 |
| PATCH | `/api/prompt-libraries/categories/{category_id}` | 重命名分类 |
| DELETE | `/api/prompt-libraries/categories/{category_id}` | 删除分类 |

其余 `/api/prompt-libraries/*`（**items 条目 CRUD 与批量删除**）仍属 KNOWN_UNIMPLEMENTED，
未获契约授权，已用测试显式守卫其保持 404/405。

## 2. 契约冻结与裁决项

新增 `docs/contracts/PROMPT-LIBRARY-INTERFACE-CATALOG.yaml`（`version: p10c-frozen-1`），
其 `decisions` 段逐条写死：

| # | 裁决项 | 冻结结论 |
|---|---|---|
| 1 | ID 口径 | 只用 `library_id`（`plib_NNNN`）/ `category_id`（`pcat_NNNN`）；确定性补零序号，禁止随机数/uuid/时间戳；禁止 `pid`/`cid` 别名 |
| 2 | 不得伪造提示词内容 | 空库 `libraries: []`；种子只允许结构（空库/空分类）；不得出现任何提示词文本 |
| 3 | 创建状态码 | 201（库与分类一致，对齐 10A） |
| 4 | 空库语义 | `libraries: []` + `active_library_id: null`，不自动建默认库、不返回演示数据 |
| 5 | CAS 粒度 | 创建库校验顶层目录版本；创建分类校验父库版本；重命名/删除库校验目标库版本；重命名/删除分类校验目标分类版本 |
| 6 | expected_version 位置 | POST/PATCH 在请求体；DELETE 无请求体，故经查询串 `expected_version` 传入（对齐前端空体 DELETE 调用面） |
| 7 | 重名 | 同作用域 trim + 大小写不敏感 → 409 `DUPLICATE_LIBRARY_NAME` / `DUPLICATE_CATEGORY_NAME` |
| 8 | 删除库语义 | 仍含分类 → 409 `LIBRARY_NOT_EMPTY`，**禁止静默级联删除** |
| 9 | 删除分类语义 | 仅移除分类结构；分类内恒无条目（本阶段无条目 CRUD），不存在级联条目删除 |
| 10 | CAS 递增 | 新对象 `version=1`；父库 `version += 1`；顶层目录 `version += 1` |
| 11 | 错误码表 | 400 `INVALID_REQUEST`；401 `UNAUTHORIZED`；403 `FORBIDDEN`；404 `LIBRARY_NOT_FOUND` / `CATEGORY_NOT_FOUND`；409 四码 |

## 3. 交付物

| 类型 | 文件 |
|---|---|
| 契约 | `docs/contracts/PROMPT-LIBRARY-INTERFACE-CATALOG.yaml` |
| 领域模块 | `src/gods_workbench/prompt_library/__init__.py`（模块 docstring） |
| 领域模型 | `src/gods_workbench/prompt_library/models.py`（Pydantic v2） |
| 服务层 | `src/gods_workbench/prompt_library/service.py` |
| 路由 | `src/gods_workbench/api/routes_prompt_library.py`（已接入 `api/app.py`） |
| 黄金夹具 | `docs/fixtures/prompt-library-{empty,with-empty-category,create-request,conflict-409,not-empty-409}.json` |
| 夹具清单 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`（17 → 22 条） |
| 契约测试 | `tests/contracts/test_phase10c_prompt_library.py`（43 条） |
| 夹具测试 | `tests/contracts/test_golden_fixtures.py` 追加 5 条 |
| 基线更新 | `tests/contracts/test_phase8_frontend_backend_api_gap.py`（4 条迁入已实现 + 契约登记） |
| 输入登记 | `docs/provenance/PHASE-2-INPUT-SHA256.txt`（条目数仍为 16） |

## 4. 门禁证据（本地实测）

```text
python -P -m pytest -q
404 passed, 7 skipped

python -P -m pytest tests/hygiene -q
16 passed

tracked JS node --check
57 checked, 0 failed
```

- 提示词库契约测试：**43 passed**。
- 夹具测试 + Phase 8 基线 + 10C 契约测试联合：**72 passed**。

### 4.1 变异测试（证明守卫非恒真）

对 `prompt_library/service.py` 注入 3 个变异，逐一被守卫捕获并已还原：

| 变异 | 注入内容 | 结果 |
|---|---|---|
| M1 | 去除库重名守卫 | 2 failed（创建+重命名各 1；仅创建路径单独跑为 1 failed） |
| M2 | 去除 CAS 校验（`_assert_expected_version` 恒返回） | 6 failed, 37 passed |
| M3 | 删非空库改为静默级联 | 1 failed, 42 passed |
| 还原 | — | **43 passed** |

## 5. 洁净室边界声明

- **未引入旧仓源码**：全部实现依据冻结契约、根宪章与前端调用面**重新编写**。
- **未伪造数据**：模型层不存在 `positive` / `negative` / `scene` 与 `items` 字段；
  源码级反向断言禁止 `import random` / `uuid4`；夹具层面再次断言不含提示词文本字段。
- **未越权扩大范围**：未获契约的 `items*` 端点有专门用例断言其仍 404/405；
  同时把观测阶段原先「`/api/prompt-libraries` 必须 404」的探针改为 `items`（该读取端点已在本阶段授权）。
- **未改动前端**：前端 `asset-manager/api.js` 既有调用面保持不变；
  本阶段响应使用 `library_id` / `category_id`，未引入 `pid` / `cid` 别名。

## 6. 仍未闭环（不得写 PASS）

- 真实第三方独立审计与发布授权：**未安排**。
- 提示词库持久化：本阶段为**进程内内存**存储，重启即丢失、多 worker 不共享。
- **条目 CRUD 与批量删除：未实现**（`/api/prompt-libraries/items*` 仍 404/405）。
- 分类重命名/删除的跨库移动、排序、导入导出：**未实现**。
- 前端真实浏览器 E2E（提示词树渲染与降级路径）在本阶段**未执行**。
- `docs/governance/TASKS.md` 的阶段状态位**未改动**（阶段状态变更需人工明确确认）。
