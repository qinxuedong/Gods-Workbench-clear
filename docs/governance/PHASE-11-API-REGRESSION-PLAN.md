# Phase 11｜140 条 API 缺口整块回归接入计划

> 状态：B1–B9 全部通过独立复核，140 条接口回归接入已收口。
>
> 基线：`tests/contracts/test_phase8_frontend_backend_api_gap.py` 的 `KNOWN_UNIMPLEMENTED`。
>
> 记录日期：2026-09-25。

## 1. 目标与口径

- 初始守卫口径：前端归一化 `/api` 路径 189 条，其中已实现 49 条、未实现 140 条。
- 当前阶段口径（B9 收口后）：已实现 189 条、剩余未实现 0 条；140 条原始登记仍作为 Phase 11 总范围。
- 本文件只规划这 140 条缺口的**回归接入顺序**；不把“前端存在调用”自动视为“允许实现”。
- 140 条是归一化路径数，不是 method+path 操作数；每个模块在 B0 阶段必须补齐 HTTP 方法、请求/响应、权限、CAS、错误码和幂等语义。
- 历史文档中的 180、177、188 等数字保留为历史快照；本计划以当前守卫的 189/49/140 为唯一基线。
- 不复制旧仓实现；所有实现必须先有冻结契约、黄金夹具和依赖闭包。

## 2. B0：归属与处置冻结（不计入 140）

在任何代码实现前，对 140 条逐条标记：

| 标记 | 含义 | 处置 |
|---|---|---|
| A | 批准实现 | 进入对应模块块次序 |
| B | 前端调用应删除 | 先移除调用并回归前端 |
| C | 保留但暂不接入 | 继续显式 fail-closed |
| D | 需要用户裁决 | 不得擅自实现 |

B0 产物：

- `docs/governance/PHASE-11-API-REGRESSION-REGISTRY.yaml`（逐条登记表，含方法和文件归属）。
- 每条接口绑定前端文件、目标后端文件、契约文件、夹具、测试文件和处置标记。
- B0 未完成前，不更新 `KNOWN_IMPLEMENTED`，不删除 `KNOWN_UNIMPLEMENTED`；B1 已通过独立审核后，已按门禁将 10 条迁入已实现基线。

## 3. 串行整块接入顺序

| 块次 | 归属模块 | 路径数 | 后端目标 | 前端涉及文件 | 契约目标 |
|---|---|---:|---|---|---|
| B1 | 认证、团队与操作授权 | 10 | `src/gods_workbench/api/routes_auth_management.py`、`src/gods_workbench/core/auth_management.py`、`src/gods_workbench/core/auth.py` | `static/js/asset-auth/api.js`、`static/js/asset-auth/http.js`、`asset-manager.html`、`v2/index.html`、`v2/settings.html`、`v2/collab.html` | `docs/contracts/AUTH-INTERFACE-CATALOG.yaml`（计划新增） |
| B2 | 平台、项目与 AI/Provider | 16 | `src/gods_workbench/api/routes_projects.py`、计划新增 `routes_ai.py`，必要时扩展 `routes_settings.py` 与 `src/gods_workbench/api/app.py` | `static/v2/js/home-controller.js`、`projects-controller.js`、`agents-controller.js`、`static/js/api-settings.js`、`static/js/episode-pipeline.js`、`static/v2/index.html` | `docs/contracts/PLATFORM-INTERFACE-CATALOG.yaml`（计划新增） |
| B3 | Asset Registry 核心资产域 | 52 | 计划新增 `src/gods_workbench/api/routes_asset_registry.py` 与 `src/gods_workbench/asset_registry/`，并扩展 `src/gods_workbench/api/app.py` | `static/js/asset-manager/api.js`、`asset-manager.js`、`governance.js`、`settings.js`、`canvas-list/api.js`、`asset-review/api.js`、`task-center.js`、`static/v2/js/home-controller.js`、`projects-controller.js` | `docs/contracts/ASSET-REGISTRY-INTERFACE-CATALOG.yaml`（计划新增） |
| B4 | 素材库与本地素材接入 | 30 | `src/gods_workbench/api/routes_asset_library_b4.py`、`src/gods_workbench/api/routes_local_assets.py`、`src/gods_workbench/asset_library/b4_service.py` | `static/js/asset-manager/api.js`、`asset-manager.js`、`asset-manager/classification.js`、`asset-manager/storage.js`、`asset-manager/path-utils.js`、`asset-manager.html` | 扩展 `docs/contracts/ASSET-LIBRARY-INTERFACE-CATALOG.yaml`，必要时新增 `LOCAL-ASSET-INTERFACE-CATALOG.yaml` |
| B5 | 媒体处理与缩略图 | 12 | 计划新增 `src/gods_workbench/api/routes_media.py` 与媒体任务服务模块，并扩展 `src/gods_workbench/api/app.py` | `static/js/asset-manager/api.js`、`asset-manager.js`、`asset-review.js`、`episode-pipeline.js` | `docs/contracts/MEDIA-INTERFACE-CATALOG.yaml`（计划新增） |
| B6 | 资产审查与交付 | 8 | `src/gods_workbench/api/routes_asset_review_b6.py`、`src/gods_workbench/asset_review/service.py`、`src/gods_workbench/asset_library/b4_service.py` | `static/js/asset-review/api.js`、`asset-review/http.js`、`asset-review.js`、`asset-review.css`、`asset-share.js` | `docs/contracts/ASSET-REVIEW-INTERFACE-CATALOG.yaml`（计划新增） |
| B7 | 剧集/影片流水线 | 5 | `src/gods_workbench/api/routes_episode_pipeline_b7.py`、`src/gods_workbench/asset_library/b4_service.py` | `static/js/episode-pipeline.js`、`episode-pipeline.html`、`episode-pipeline.css`、`static/v2/workshop.html` | `docs/contracts/EPISODE-PIPELINE-INTERFACE-CATALOG.yaml`（计划新增） |
| B8 | 提示词库剩余能力 | 3 | `src/gods_workbench/api/routes_prompt_library_b8.py` 提供 items 洁净室边界；既有 `routes_prompt_library.py` 保留基础能力 | `static/js/asset-manager/api.js`、`static/js/episode-pipeline.js` | `docs/contracts/PROMPT-LIBRARY-B8-ITEM-INTERFACE-CATALOG.yaml` |
| B9 | 分享与公开访问 | 4 | `src/gods_workbench/api/routes_public_b9.py` 提供公开分享 fail-closed 边界；当前无公开分享服务模块 | `static/js/asset-share/api.js`、`asset-share/http.js`、`asset-share.js`、`asset-share.html`、`static/v2/collab.html` | `docs/contracts/PUBLIC-SHARE-INTERFACE-CATALOG.yaml` |

总计：`10 + 16 + 52 + 30 + 12 + 8 + 5 + 3 + 4 = 140`。
每次只推进一个块；当前块的契约、实现、前端接线、变异测试、全量门禁和当前 SHA 读回完成后，才进入下一块。

## 4. 各块范围与硬门禁

### B1｜认证、团队与操作授权（10 条）

- 后端：`src/gods_workbench/api/routes_auth_management.py`、`src/gods_workbench/core/auth_management.py`、`src/gods_workbench/core/auth.py`
- 前端：`static/js/asset-auth/api.js`、`static/js/asset-auth/http.js`、`asset-manager.html`、`v2/index.html`、`v2/settings.html`、`v2/collab.html`
- 契约：`docs/contracts/AUTH-INTERFACE-CATALOG.yaml`（计划新增）
- 说明：作为后续资产、审查、分享模块的身份与权限前置块。

接口路径：

- `/api/asset-auth/bootstrap`
- `/api/asset-auth/operation-approvals`
- `/api/asset-auth/operation-approvals/{p}`
- `/api/asset-auth/teams`
- `/api/asset-auth/teams/{p}`
- `/api/asset-auth/teams/{p}/members`
- `/api/asset-auth/teams/{p}/members/{p}`
- `/api/asset-auth/tokens`
- `/api/asset-auth/users`
- `/api/asset-auth/users/{p}`

### B2｜平台、项目与 AI/Provider（16 条）

- 后端：`src/gods_workbench/api/routes_projects.py`、计划新增 `routes_ai.py`，必要时扩展 `routes_settings.py` 与 `src/gods_workbench/api/app.py`
- 前端：`static/v2/js/home-controller.js`、`projects-controller.js`、`agents-controller.js`、`static/js/api-settings.js`、`static/js/episode-pipeline.js`、`static/v2/index.html`
- 契约：`docs/contracts/PLATFORM-INTERFACE-CATALOG.yaml`（计划新增）
- 说明：codex、gemini-cli、jimeng 及本地 AI 上传必须先做范围裁决，不因前端存在调用就自动接入。

接口路径：

- `/api/ai/upload`
- `/api/app-info`
- `/api/chat`
- `/api/chat/agent`
- `/api/codex/help`
- `/api/codex/status`
- `/api/gemini-cli/help`
- `/api/gemini-cli/status`
- `/api/jimeng/credit`
- `/api/jimeng/help`
- `/api/jimeng/login/start`
- `/api/jimeng/login/status`
- `/api/jimeng/logout`
- `/api/jimeng/status`
- `/api/projects`
- `/api/projects/{p}`

### B3｜Asset Registry 核心资产域（52 条）

- 后端：计划新增 `src/gods_workbench/api/routes_asset_registry.py` 与 `src/gods_workbench/asset_registry/`，并扩展 `src/gods_workbench/api/app.py`
- 前端：`static/js/asset-manager/api.js`、`asset-manager.js`、`governance.js`、`settings.js`、`canvas-list/api.js`、`asset-review/api.js`、`task-center.js`、`static/v2/js/home-controller.js`、`projects-controller.js`
- 契约：`docs/contracts/ASSET-REGISTRY-INTERFACE-CATALOG.yaml`（计划新增）
- 说明：最大块；统一覆盖资产、关系、版本、回收站、项目资产、治理、索引与 workspace job。

接口路径：

- `/api/asset-registry`
- `/api/asset-registry/assets`
- `/api/asset-registry/assets/archive`
- `/api/asset-registry/assets/export-pdf`
- `/api/asset-registry/assets/import`
- `/api/asset-registry/assets/relations`
- `/api/asset-registry/assets/resolve-reference`
- `/api/asset-registry/assets/tags`
- `/api/asset-registry/assets/{p}`
- `/api/asset-registry/assets/{p}/image-versions`
- `/api/asset-registry/assets/{p}/image-versions/{p}`
- `/api/asset-registry/assets/{p}/image-versions/{p}/media`
- `/api/asset-registry/assets/{p}/media`
- `/api/asset-registry/assets/{p}/open-local`
- `/api/asset-registry/assets/{p}/relations/{p}`
- `/api/asset-registry/assets/{p}/tags/{p}`
- `/api/asset-registry/assets/{p}/video/clip`
- `/api/asset-registry/assets/{p}/video/frame`
- `/api/asset-registry/assets/{p}/video/storyboard`
- `/api/asset-registry/facets`
- `/api/asset-registry/folders`
- `/api/asset-registry/governance/asset-trash/{p}/restore`
- `/api/asset-registry/governance/assets/{p}/restore`
- `/api/asset-registry/governance/audit-outbox/reconcile`
- `/api/asset-registry/governance/canvases/purge-expired`
- `/api/asset-registry/governance/canvases/{p}/restore`
- `/api/asset-registry/governance/cascade-preview`
- `/api/asset-registry/governance/operations`
- `/api/asset-registry/governance/overview`
- `/api/asset-registry/index/sync`
- `/api/asset-registry/preferences/team`
- `/api/asset-registry/presets`
- `/api/asset-registry/presets/{p}`
- `/api/asset-registry/project-directory-templates`
- `/api/asset-registry/project-directory-templates/{p}`
- `/api/asset-registry/project-directory-templates/{p}/archive`
- `/api/asset-registry/project-directory-templates/{p}/default`
- `/api/asset-registry/project-entities/{p}`
- `/api/asset-registry/project-gates/{p}`
- `/api/asset-registry/project-recycle/{p}/restore`
- `/api/asset-registry/projects/{p}/assets`
- `/api/asset-registry/projects/{p}/entities`
- `/api/asset-registry/recycle-bin`
- `/api/asset-registry/recycle-bin/{p}/restore`
- `/api/asset-registry/reindex`
- `/api/asset-registry/remote-assets`
- `/api/asset-registry/remote-assets/{p}`
- `/api/asset-registry/settings/features/{p}`
- `/api/asset-registry/settings/index-automation`
- `/api/asset-registry/status`
- `/api/asset-registry/workspace-jobs/{p}`
- `/api/asset-registry/workspace-jobs/{p}/{p}`

### B4｜素材库与本地素材接入（30 条）

- 后端：实际挂载 `src/gods_workbench/api/routes_asset_library_b4.py`、`src/gods_workbench/api/routes_local_assets.py`，共享边界服务为 `src/gods_workbench/asset_library/b4_service.py`
- 前端：`static/js/asset-manager/api.js`、`asset-manager.js`、`asset-manager/classification.js`、`asset-manager/storage.js`、`asset-manager/path-utils.js`、`asset-manager.html`
- 契约：扩展 `docs/contracts/ASSET-LIBRARY-INTERFACE-CATALOG.yaml`，必要时新增 `LOCAL-ASSET-INTERFACE-CATALOG.yaml`
- 说明：文件路径越界、真实存在性、上传/移动/删除幂等和用户数据边界是本块硬门禁。

接口路径：

- `/api/asset-classification-prompt`
- `/api/asset-classification/background`
- `/api/asset-classification/jobs/{p}`
- `/api/asset-content`
- `/api/asset-content/pdf`
- `/api/asset-content/versions`
- `/api/asset-content/versions/{p}`
- `/api/asset-content/versions/{p}/restore`
- `/api/asset-file-info`
- `/api/asset-file-reveal`
- `/api/asset-library/categories/{p}`
- `/api/asset-library/items/batch`
- `/api/asset-library/items/classify`
- `/api/asset-library/items/delete`
- `/api/asset-library/items/move`
- `/api/asset-library/items/{p}`
- `/api/asset-library/items/{p}/avatar-status`
- `/api/asset-library/items/{p}/register-avatar`
- `/api/asset-library/libraries/{p}`
- `/api/asset-library/workflows/upload`
- `/api/local-assets`
- `/api/local-assets/caption`
- `/api/local-assets/classify`
- `/api/local-assets/delete`
- `/api/local-assets/folders`
- `/api/local-assets/items`
- `/api/local-assets/move`
- `/api/local-assets/upload`
- `/api/storage-files`
- `/api/storage-files/delete`

### B5｜媒体处理与缩略图（12 条）

- 后端：计划新增 `src/gods_workbench/api/routes_media.py` 与媒体任务服务模块，并扩展 `src/gods_workbench/api/app.py`
- 前端：`static/js/asset-manager/api.js`、`asset-manager.js`、`asset-review.js`、`episode-pipeline.js`
- 契约：`docs/contracts/MEDIA-INTERFACE-CATALOG.yaml`（计划新增）
- 说明：异步任务必须使用 202、稳定 job_id、poll_hint；禁止伪造 progress、eta、url。

接口路径：

- `/api/asset-proxy/settings`
- `/api/asset-thumbnails/delete`
- `/api/asset-thumbnails/delete-storyboards`
- `/api/asset-thumbnails/generate`
- `/api/asset-thumbnails/generate-background`
- `/api/asset-thumbnails/jobs/{p}`
- `/api/asset-thumbnails/settings`
- `/api/audio-waveform-data`
- `/api/download-output`
- `/api/media-preview`
- `/api/media-transcode`
- `/api/online-image`

### B6｜资产审查与交付（8 条）

- 后端：实际挂载 `src/gods_workbench/api/routes_asset_review_b6.py`；边界服务登记为 `src/gods_workbench/asset_review/service.py` 与 `src/gods_workbench/asset_library/b4_service.py`；旧 `routes_asset_review.py` 未挂载，保留待后续清理裁决
- 前端：`static/js/asset-review/api.js`、`asset-review/http.js`、`asset-review.js`、`asset-review.css`、`asset-share.js`
- 契约：`docs/contracts/ASSET-REVIEW-INTERFACE-CATALOG.yaml`（计划新增）
- 说明：审查会话、评论、审批、交付导出与分享关联必须形成明确状态机。

接口路径：

- `/api/asset-reviews/comments/{p}`
- `/api/asset-reviews/deliveries/{p}/export`
- `/api/asset-reviews/sessions`
- `/api/asset-reviews/sessions/{p}`
- `/api/asset-reviews/sessions/{p}/approval`
- `/api/asset-reviews/sessions/{p}/comments`
- `/api/asset-reviews/sessions/{p}/delivery`
- `/api/asset-reviews/shares`

### B7｜剧集/影片流水线（5 条）

- 后端：实际挂载 `src/gods_workbench/api/routes_episode_pipeline_b7.py`，复用 `src/gods_workbench/asset_library/b4_service.py` 的失败关闭边界；未引入不存在的 `episode_pipeline` 目录
- 前端：`static/js/episode-pipeline.js`、`episode-pipeline.html`、`episode-pipeline.css`、`static/v2/workshop.html`
- 契约：`docs/contracts/EPISODE-PIPELINE-INTERFACE-CATALOG.yaml`（计划新增）
- 说明：stage 状态机、幂等、取消、轮询和旧项目响应隔离必须一并回归。

接口路径：

- `/api/episode-pipelines`
- `/api/episode-pipelines/{p}`
- `/api/episode-pipelines/{p}/stages/{p}/cancel`
- `/api/episode-pipelines/{p}/stages/{p}/complete`
- `/api/episode-pipelines/{p}/stages/{p}/start`

### B8｜提示词库剩余能力（3 条）

- 后端：当前由 `src/gods_workbench/api/routes_prompt_library_b8.py` 提供 items 层洁净室边界；既有 `routes_prompt_library.py` 与 `prompt_library/` 保留基础能力
- 前端：`static/js/asset-manager/api.js`、`static/js/episode-pipeline.js`
- 契约：`docs/contracts/PROMPT-LIBRARY-B8-ITEM-INTERFACE-CATALOG.yaml`
- 说明：补齐 items 层级的版本、删除、来源与许可约束。

接口路径：

- `/api/prompt-libraries/items`
- `/api/prompt-libraries/items/delete`
- `/api/prompt-libraries/items/{p}`

### B9｜分享与公开访问（4 条）

- 后端：当前由 `src/gods_workbench/api/routes_public_b9.py` 提供公开分享 fail-closed 边界，尚无公开分享服务模块
- 前端：`static/js/asset-share/api.js`、`asset-share/http.js`、`asset-share.js`、`asset-share.html`、`static/v2/collab.html`
- 契约：`docs/contracts/PUBLIC-SHARE-INTERFACE-CATALOG.yaml`
- 说明：分享 token 生命周期、过期/撤销、公开访问与内部权限隔离必须闭环。

接口路径：

- `/api/public/shares/{p}`
- `/api/public/shares/{p}/access`
- `/api/public/shares/{p}/approvals`
- `/api/public/shares/{p}/comments`

## 5. 每个块的固定回归闸门

1. **方法补全**：从前端调用点确认 HTTP method、参数、请求体、响应体和错误分支。
2. **契约冻结**：更新对应 YAML，新增最小黄金夹具，不得先写路由再补契约。
3. **后端实现**：路由、服务、数据模型、稳定 ID、统一错误包、权限和 CAS。
4. **前端接线**：成功路径替换显式降级；失败路径继续保留可见降级，不得静默空列表。
5. **契约测试**：至少覆盖正常路径、401、403、404、409、422；异步模块另测 202、轮询、超时、取消。
6. **并发/幂等测试**：重复提交、旧版本、重复回调、旧项目响应回写、跨用户访问。
7. **变异测试**：删除路由、删除关键字段、篡改状态码或 CAS，必须使对应测试失败。
8. **缺口基线更新**：只有该块完全通过后，才把已实现路径从 `KNOWN_UNIMPLEMENTED` 移入 `KNOWN_IMPLEMENTED`。
9. **本地门禁**：
   ```powershell
   python -P -m pytest -q
   python -P -m pytest tests/hygiene -q
   node --check <本块涉及的全部 JavaScript>
   ```
10. **提交与 CI**：每块至少一个可识别提交；远端 CI 必须绑定当前 SHA；失败或 SHA 不一致不得进入下一块。

## 6. 回归证据与文件约定

| 产物 | 约定 |
|---|---|
| 逐条归属表 | `docs/governance/PHASE-11-API-REGRESSION-REGISTRY.yaml` |
| 契约 | `docs/contracts/<MODULE>-INTERFACE-CATALOG.yaml` |
| 黄金夹具 | `docs/fixtures/phase11-<block>-*.json` |
| 契约测试 | `tests/contracts/test_phase11_<block>_*.py` |
| 浏览器/E2E | `tests/e2e/phase11_<block>_*.py` 或 `tools/phase11_<block>_*.py` |
| 块级报告 | `docs/governance/PHASE-11-<BLOCK>-REPORT-YYYY-MM-DD.md` |
| 缺口基线 | `tests/contracts/test_phase8_frontend_backend_api_gap.py`，追加治理记录后再更新 |

证据必须绑定当前提交 SHA；本地通过、远端 CI、生产验收和发布授权四者分开记录。

## 7. 明确不自动推进的事项

- 不因前端调用存在就实现 `codex`、`gemini-cli`、`jimeng`、在线图片、本地文件扫描或媒体转码。
- 不引入 `PLUGIN-PROTOCOL-SPEC.md` 运行时依赖。
- 不复制旧仓源码、旧测试实现、用户数据或二进制资源。
- 不把 C/D 类接口从缺口基线中删除；必须保留显式 fail-closed 证据。
- 不在本计划阶段修改业务代码。

## 8. 当前状态

B1–B9 已按计划顺序完成 140 条路径的契约、路由边界、夹具、回归测试和独立审核收口。当前缺口守卫为 `KNOWN_IMPLEMENTED=189`、`KNOWN_UNIMPLEMENTED=0`。

本计划证据仅代表当前工作树的本地契约/洁净室回归；不等同于远端 CI、生产验收、第三方审计或公开发布授权。
