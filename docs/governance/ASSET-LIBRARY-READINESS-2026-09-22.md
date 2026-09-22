# 素材库阶段准备报告（2026-09-22）

## 状态

**契约阻塞，禁止直接新增后端素材库路由。**

T26 已确定制作顺序为“素材库 → 观测 → 提示词库 → 设置页 → 画布闭环”，但该裁决只确定产品排序，不等于批准素材库接口契约或后端实现。

## 当前证据

- 当前冻结契约仅覆盖项目中心和 god-canvas：
  - `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml`
  - `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`
- 当前黄金夹具不包含素材库响应：`docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`。
- 前端首屏入口：`src/gods_workbench/static/js/asset-manager.js` 调用 `assetManagerApi.getAssetLibrary()`。
- 前端 API 形状：`src/gods_workbench/static/js/asset-manager/api.js`。
- 当前权威缺口基线：前端引用 188、后端已实现 14、前端调用但后端未实现 180。
  - 依据：P8-A1 报告 §2 与 `tests/contracts/test_phase8_frontend_backend_api_gap.py` 的冻结基线断言。

## 最小闭环候选（仅候选，不是批准实现）

1. `GET /api/asset-library`
2. `POST /api/asset-library/libraries`
3. `POST /api/asset-library/categories`

本阶段仅覆盖上述 3 个端点；其余 `/api/asset-library/*`、`/api/local-assets/*`、上传、批量、移动、删除、缩略图和素材注册端点仍属于后续切片，不在本阶段实现范围。

候选响应需要至少稳定表达：`library_id`、`category_id`、`asset_id`、库/分类/条目树、`created_at`，以及统一错误包和权限语义。

## 开工前必须冻结

1. 方法、路径、请求/响应 JSON；
2. 空库、重复名称、删除/归档语义；
3. `401/403/409` 与 CAS `expected_version` 规则；
4. 文件/媒体路径、上传和缩略图安全边界；
5. 至少 2 个素材库黄金夹具和对应契约测试：非空库树成功响应、空库或重复名称错误响应；如采用 CAS，再增加 409 `VERSION_CONFLICT` 响应；
6. 审核并将端点从 `KNOWN_UNIMPLEMENTED` 移入实现基线。

## 本轮已执行边界

- 未新增 `/api/asset-library` 或 `/api/asset-registry/assets` 后端路由；
- 未伪造空库数据、未引入旧仓源码；
- 保持前端“未接入”显式降级语义；
- 待契约/夹具冻结后，按 T26 顺序进入素材库实现。

## 依据

- 根 `AGENTS.md` 洁净室输入来源与 CAS/错误语义约束；
- `docs/governance/agent-reports-2026-09-21/P8-A1-FRONTEND-BACKEND-API-GAP.md`；
- `tests/contracts/test_phase8_frontend_backend_api_gap.py`；
- `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`。

> 本文件是准备/阻塞登记，不是冻结接口契约，不授权实现后端。
