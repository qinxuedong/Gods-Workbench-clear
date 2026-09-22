# 素材库契约草案（非冻结）

> 状态：DRAFT / NOT FROZEN / 不得据此实现后端。
> 目的：供用户/审核方确认后，迁移为 `docs/contracts/` 中的冻结契约。

## 候选范围

仅覆盖第一阶段最小闭环：

- `GET /api/asset-library`
- `POST /api/asset-library/libraries`
- `POST /api/asset-library/categories`

其余素材库、上传、文件、缩略图、批量导入和资产注册端点不在本草案范围。

## 稳定 ID 与版本

- 库：`library_id`
- 分类：`entity_id`（待确认是否改为 `category_id`；不得在冻结前自行决定）
- 素材：`asset_id`
- 写操作请求预留 `expected_version`；版本冲突统一返回外层 `detail.code=VERSION_CONFLICT` 和 HTTP 409。

## GET /api/asset-library

成功 200：响应顶层包含 `library`，其包含 `active_library_id`、`libraries[]`；每个库包含 `library_id`、`name`、`categories[]`；分类包含名称、类型和 `items[]`。素材条目至少包含 `asset_id`、`name`、`url`、`created_at`、`library_id`、`category_id`。

空库必须返回结构完整的空数组，不得返回演示数据或伪造素材。

## POST /api/asset-library/libraries

请求草案：`name`、可选 `expected_version`。

成功 201 或 200（待确认）：返回新库对象以及可重新渲染的 `library` 树。

重名、非法名称、权限和版本冲突的状态码与错误码待冻结。

## POST /api/asset-library/categories

请求草案：`library_id`、`name`、`type`、可选 `expected_version`。

成功 201 或 200（待确认）：返回新分类对象以及可重新渲染的 `library` 树。

库不存在、重名、非法类型、权限和版本冲突的状态码与错误码待冻结。

## 必须由审核方裁决

1. 分类 ID 统一使用 `category_id` 还是现有实体 ID 约定 `entity_id`；
2. 创建成功使用 201 还是 200；
3. 库/分类版本的存储与 CAS 粒度；
4. 重名、归档、删除语义；
5. 认证角色与审计 outbox 语义。
