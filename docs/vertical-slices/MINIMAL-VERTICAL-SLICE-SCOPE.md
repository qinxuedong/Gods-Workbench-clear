# 最小垂直切片范围（仅规划）

本文件只定义 Phase 5 的验收边界，不构成业务实现授权。Phase 4/5 必须等待 Phase 3 契约冻结签署。

## 切片 A：项目中心最小链路

覆盖已批准的项目中心列表、创建和编辑冲突路径：

- 活跃项目列表：使用 `projects-hub-list-active` 夹具验证最小返回形状。
- 创建项目：使用 `projects-hub-create-request` 夹具验证最小请求形状。
- 编辑项目：验证 `expected_version` 一致时成功，不一致时返回 `409` 并暴露当前版本。

## 切片 B+C：god-canvas 统一最小链路（普通画布 + 智能画布）

统一命名为 **god-canvas**，整合普通画布拓扑读写与智能画布异步任务管理：

- **普通画布能力（原切片 B）**：
  - 读取与导出 JSON 及 `.godmap` 最小夹具。
  - 验证稳定 ID（`canvas_id`, `entity_id`, `connection_id`）与拓扑结构。
  - 基于 `expected_version` 的 CAS 乐观锁更新，版本不一致返回 `409 CANVAS_VERSION_CONFLICT`。
- **智能画布能力（原切片 C）**：
  - 发起智能异步任务，受理成功返回 `202 Accepted`，携带稳定 `job_id` 与 `poll_hint`。
  - 任务状态续查与查询能力。
  - 鉴权与权限边界：未认证返回 `401 UNAUTHORIZED`，无权限返回 `403 FORBIDDEN`。

## 非目标

- 插件协议、扩展加载和协议协商。
- 图片、字体、截图、用户数据和真实外部服务。
- 未经 Phase 3 批准的接口、行为或夹具。

## 进入条件

1. Phase 3 审查登记中的签署人已指定并完成逐项结论。
2. 输入登记中的材料拥有版本、来源和审查证明。
3. 契约与夹具版本一致，且发布状态仍为 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。
