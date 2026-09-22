# 素材库接口与黄金夹具草案（DRAFT / NOT FROZEN）

- 日期：2026-09-22
- 状态：**DRAFT / NOT FROZEN（未冻结、不得作为实现授权）**
- 范围：素材库最小候选闭环
  - `GET /api/asset-library`
  - `POST /api/asset-library/libraries`
  - `POST /api/asset-library/categories`
- 目的：为后续人工/架构审核提供可审阅的请求、响应、错误和黄金夹具草案。
- 明确边界：本目录内容不是 `docs/contracts/` 冻结契约，也不是 `docs/fixtures/` 正式黄金夹具；不得据此直接新增后端路由。

## 1. 现有前端证据（仅用于起草）

- `asset-manager/api.js` 已定义上述三个请求。
- 创建素材库当前发送 `{ "name": "..." }`。
- 创建分类当前发送 `{ "library_id": "...", "name": "...", "type": "image" | "workflow" }`。
- `asset-manager.js` 当前读取创建响应中的 `library`、`asset_library.id`、`category.id`，并从 GET 响应读取 `library`。
- 这些前端形状不是已批准的服务端契约，字段语义仍需审核。

## 2. 草案约定（待裁决）

### 2.1 稳定 ID 与时间

- `library_id`、`category_id`、`asset_id` 均使用不透明字符串；禁止把数据库自增整数作为外部契约。
- 时间字段使用 RFC 3339 UTC 字符串，例如 `2026-09-22T06:00:00Z`。
- `version` 为非负整数；创建对象初始值建议为 `1`。

### 2.2 GET `/api/asset-library`

建议成功响应 `200`：

```json
{
  "library": {
    "active_library_id": "library_default",
    "libraries": [
      {
        "library_id": "library_default",
        "name": "默认资产库",
        "version": 1,
        "created_at": "2026-09-22T06:00:00Z",
        "updated_at": "2026-09-22T06:00:00Z",
        "categories": [
          {
            "category_id": "category_image",
            "library_id": "library_default",
            "name": "图片",
            "type": "image",
            "version": 1,
            "items": []
          }
        ]
      }
    ]
  }
}
```

待确认：是否兼容前端现有的 `id` 字段、是否保留顶层 `categories`、是否分页、是否返回完整 `items`，以及空库是否返回 `libraries: []` 还是自动创建默认库。

### 2.3 POST `/api/asset-library/libraries`

请求草案：

```json
{
  "name": "角色参考库"
}
```

成功响应 `201` 草案：

```json
{
  "library": {
    "library_id": "library_characters",
    "name": "角色参考库",
    "version": 1,
    "created_at": "2026-09-22T06:01:00Z",
    "updated_at": "2026-09-22T06:01:00Z",
    "categories": []
  },
  "asset_library": {
    "library_id": "library_characters"
  }
}
```

待确认：创建是否允许 `expected_version`（全局目录版本或不需要）、成功码采用 `200` 还是 `201`、名称是否大小写不敏感去重、是否允许系统库和归档库同名。

### 2.4 POST `/api/asset-library/categories`

请求草案：

```json
{
  "library_id": "library_characters",
  "name": "正面肖像",
  "type": "image"
}
```

成功响应 `201` 草案：

```json
{
  "category": {
    "category_id": "category_portrait",
    "library_id": "library_characters",
    "name": "正面肖像",
    "type": "image",
    "version": 1,
    "items": [],
    "created_at": "2026-09-22T06:02:00Z",
    "updated_at": "2026-09-22T06:02:00Z"
  },
  "library": {
    "library_id": "library_characters",
    "version": 2
  }
}
```

待确认：`type` 枚举（至少 `image`、`workflow`）、分类名称作用域、父库版本是否递增、创建分类是否必须携带 `expected_version`。

## 3. 统一错误包草案

所有错误暂按根宪章外层结构：`{"detail": {"code": "...", "message": "...", ...}}`。

| 状态 | code 草案 | 触发条件 |
|---|---|---|
| 400 | `INVALID_REQUEST` | 缺字段、空名称、非法 `type`、格式错误 |
| 401 | `UNAUTHENTICATED` | 未认证或会话失效 |
| 403 | `FORBIDDEN` | 只读身份或无素材库治理权限 |
| 404 | `LIBRARY_NOT_FOUND` | 分类创建时父库不存在 |
| 409 | `VERSION_CONFLICT` | `expected_version` 与服务端版本不一致 |
| 409 | `DUPLICATE_LIBRARY_NAME` / `DUPLICATE_CATEGORY_NAME` | 同一作用域重名（是否区分大小写待定） |
| 422 | `VALIDATION_ERROR` | Pydantic/字段语义校验失败（是否采用 400 待定） |

409 示例：

```json
{
  "detail": {
    "code": "VERSION_CONFLICT",
    "message": "素材库版本已变化，请重新读取后重试。",
    "resource": "library",
    "library_id": "library_characters",
    "expected_version": 1,
    "actual_version": 2
  }
}
```

## 4. CAS 待确认项

根宪章明确要求编辑、归档、恢复和画布拓扑更新使用 `expected_version`，但本三个候选接口的 CAS 作用域尚未冻结：

1. `GET` 是否返回顶层快照版本（建议增加 `snapshot_version`），以便创建操作使用；
2. 创建素材库是否需要顶层 `expected_version`；
3. 创建分类是否要求父 `library` 的 `expected_version`（本草案倾向要求）；
4. 成功后是只递增父库版本，还是同时递增顶层目录版本；
5. 冲突响应中的 `actual_version` 是否必须返回；
6. 重试是否需要幂等键（尤其未来上传/批量接口）；
7. 归档、重命名、删除等后续接口必须单独冻结，不能由本草案推导实现。

## 5. 黄金夹具草案说明

本目录中的 JSON 文件仅为候选输入/输出快照：

- `golden-get-asset-library.json`：完整 GET 快照；
- `golden-create-library.json`：创建素材库请求与响应；
- `golden-create-category.json`：创建分类请求与响应；
- `golden-error-version-conflict.json`：CAS 冲突错误。

在人工/架构审核通过、字段命名和状态码冻结前，不得复制到 `docs/fixtures/`，不得加入 `GOLDEN-FIXTURE-MANIFEST.json`，不得据此修改实现。

## 6. 冻结前检查清单

- [ ] 审核外部字段名：`library_id`/`category_id` 与前端 `id` 的兼容策略；
- [ ] 冻结状态码（创建 `201` 或 `200`）；
- [ ] 冻结空库、默认库、归档和重名语义；
- [ ] 冻结 CAS 作用域与 `expected_version` 必填性；
- [ ] 冻结 `type` 枚举和媒体安全边界；
- [ ] 将批准后的快照复制到 `docs/fixtures/` 并登记 manifest；
- [ ] 冻结契约后再实现端点与契约测试。
