# P8-A1 前后端接口缺口对账报告（2026-09-21）

> 角色：P8-A1 执行代理（**只读对账 + 纯 Python 契约守卫**）。本轮**未做任何 git 写**。
> 基线：`HEAD == origin/master == 721c00c48e7d42beda4d52e1b6c5625800546fea`（Phase 7 第四批；远端 CI run 35555973366 success）。
> 范围：`src/gods_workbench/static/` 下全部 `.js` / `.html`（排除 `vendor/`）对 `/api/...` 的引用，
> 与 `src/gods_workbench/api/` 实际路由、`docs/contracts/` 冻结契约三方对账。
> 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 1. 结论摘要

| 项 | 数量 |
|---|---|
| 前端引用的去重（归一化）路径 | **188** |
| 后端已实现路由（归一化） | **14** |
| 冻结契约声明的 method+path | **14** |
| 契约声明全部有实现 | **14 / 14** |
| 前端调用且后端有实现 | **8** |
| **前端调用但后端未实现** | **180** |
| 契约声明但前端无调用方 | **3** |

> **数值更正留痕（2026-09-21，提交前反向发现并修复）**
>
> 本报告首版的“前端去重 177 / 未实现 169”是**扫描器缺陷下的错误值**。经两轮修复后，当前基线为
> **188 / 180**（与 `tests/contracts/test_phase8_frontend_backend_api_gap.py` 冻结基线逐字一致）：第一轮修缺陷 A/B → 180/172；第二轮修缺陷 C（helper 拼接线漏扫）→ 188/180。
> 三处缺陷均已在隔离副本内复现、修复并回归（详见 §8.3），本节及 §2.3 / §2.4 的数值与明细已同步。
>
> - 缺陷 A（**提取器失明**）：`_extract_api_literals()` 未跳过 JS **正则字面量**与**模板串 `${}` 内嵌套反引号**，以至后续代码被整体吞并，
>   导致多个文件的 `/api` 引用**完全漏扫**（如 `asset-manager.js` 仅提取 1 条，实际 23 条）。
> - 缺陷 B（**归一化虚增**）：`_collapse_template()` 对**任何** `${...}` 都整体折叠为 `{p}`，把“查询串拼接”误算为“路径参数”，
>   既**虚增** 12 条并不存在的幽灵路径（如 `/api/asset-content/versions/{p}{p}`），又**漏算**其真实基路径（如 `/api/asset-content/versions`）。
> - 缺陷 C（**helper 拼接线结构性漏扫**）：旧提取器只承认**以 `/api` 起头**的字面量，故 `${canvasUrl(id)}/meta`、`${shareUrl(token)}/access` 这类真实可达调用被整体漏扫（第二轮补修）。

### 1.1 核心结论

**契约侧完全闭合**：`docs/contracts/` 共声明 **14** 条 method+path，全部能在 `src/gods_workbench/api/` 找到实现，
并由真实 HTTP 实测确认路由可达（§3 A 组）。**契约缺失 0 条。**

**缺口不在契约，而在实现范围**：前端静态层引用 **188** 条去重后的 `/api` 路径，
仅 **8** 条有后端实现，**180** 条**后端根本不存在**（真实 HTTP 一律 404，§3 B 组）。

即：这不是「契约与实现不一致」，而是 —— **前端功能面 远大于 冻结契约 + 已实现后端切片**。
这些未实现端点**全部不在冻结契约内**；按 `AGENTS.md` §4 与洁净室口径，**不得未经契约直接实现**。

## 2. 三方对账总表

### 2.1 前端调用且后端有实现（8 条）

| endpoint（归一化） | 后端实现位置 |
|---|---|
| `/api/asset-registry/governance/projects/{p}/restore` | `routes_projects.py:94` (POST) |
| `/api/asset-registry/projects` | `routes_projects.py:23` (GET)<br>`routes_projects.py:41` (POST) |
| `/api/asset-registry/projects/{p}` | `routes_projects.py:76` (DELETE)<br>`routes_projects.py:58` (PATCH) |
| `/api/asset-registry/projects/{p}/trash` | `routes_projects.py:112` (POST) |
| `/api/asset-registry/projects/{p}/trash/restore` | `routes_projects.py:130` (POST) |
| `/api/canvases` | `routes_god_canvas.py:35` (GET)<br>`routes_god_canvas.py:52` (POST) |
| `/api/canvases/{p}` | `routes_god_canvas.py:69` (GET)<br>`routes_god_canvas.py:85` (PATCH) |
| `/api/canvases/{p}/restore` | `routes_god_canvas.py:103` (POST) |

### 2.2 冻结契约 vs 实现（14/14 命中）

| method | path（契约原文） | 归一化路径 | 契约文件 | 后端实现 |
|---|---|---|---|---|
| GET | `/api/asset-registry/projects` | `/api/asset-registry/projects` | `PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/asset-registry/projects` | `/api/asset-registry/projects` | `PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 是 |
| PATCH | `/api/asset-registry/projects/{project_id}` | `/api/asset-registry/projects/{p}` | `PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 是 |
| DELETE | `/api/asset-registry/projects/{project_id}` | `/api/asset-registry/projects/{p}` | `PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/asset-registry/governance/projects/{project_id}/restore` | `/api/asset-registry/governance/projects/{p}/restore` | `PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/asset-registry/projects/{project_id}/trash` | `/api/asset-registry/projects/{p}/trash` | `PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/asset-registry/projects/{project_id}/trash/restore` | `/api/asset-registry/projects/{p}/trash/restore` | `PROJECTS-HUB-INTERFACE-CATALOG.yaml` | 是 |
| GET | `/api/canvases` | `/api/canvases` | `CANVAS-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/canvases` | `/api/canvases` | `CANVAS-INTERFACE-CATALOG.yaml` | 是 |
| PATCH | `/api/canvases/{canvas_id}` | `/api/canvases/{p}` | `CANVAS-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/canvases/{canvas_id}/restore` | `/api/canvases/{p}/restore` | `CANVAS-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/canvases/{canvas_id}/workflow/import` | `/api/canvases/{p}/workflow/import` | `CANVAS-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/canvases/{canvas_id}/workflow/export` | `/api/canvases/{p}/workflow/export` | `CANVAS-INTERFACE-CATALOG.yaml` | 是 |
| POST | `/api/canvases/{canvas_id}/tasks` | `/api/canvases/{p}/tasks` | `CANVAS-INTERFACE-CATALOG.yaml` | 是 |

> **契约声明 14 条全部有实现，缺失 0 条。**（HTTP 实测见 §3 A 组）

#### 2.2.1 契约声明但前端无调用方（3 条；非缺陷，但无前端覆盖）

- `POST /api/canvases/{p}/tasks`
- `POST /api/canvases/{p}/workflow/export`
- `POST /api/canvases/{p}/workflow/import`

含义：这是**后端已具备、前端尚未接入**的能力；因此上述端点**没有前端侧端到端覆盖**，
其行为仅由服务层/路由层测试覆盖（如 `tests/contracts/test_god_canvas_service.py`）。

### 2.3 前端调用但后端未实现（180 条，按功能域归并）

| 功能域前缀 | 条数 |
|---|---|
| `/api/ai` | 1 |
| `/api/app-info` | 1 |
| `/api/asset-auth` | 13 |
| `/api/asset-classification` | 2 |
| `/api/asset-classification-prompt` | 1 |
| `/api/asset-content` | 5 |
| `/api/asset-file-info` | 1 |
| `/api/asset-file-reveal` | 1 |
| `/api/asset-library` | 13 |
| `/api/asset-proxy` | 1 |
| `/api/asset-registry` | 55 |
| `/api/asset-reviews` | 8 |
| `/api/asset-thumbnails` | 6 |
| `/api/audio-waveform-data` | 1 |
| `/api/canvas-assets` | 2 |
| `/api/canvases` | 5 |
| `/api/chat` | 2 |
| `/api/codex` | 2 |
| `/api/download-output` | 1 |
| `/api/episode-pipelines` | 5 |
| `/api/gemini-cli` | 2 |
| `/api/jimeng` | 6 |
| `/api/local-assets` | 8 |
| `/api/media-preview` | 1 |
| `/api/media-transcode` | 1 |
| `/api/observability` | 8 |
| `/api/online-image` | 1 |
| `/api/projects` | 2 |
| `/api/prompt-libraries` | 7 |
| `/api/providers` | 4 |
| `/api/public` | 4 |
| `/api/reference-canvases` | 1 |
| `/api/shared-folders` | 4 |
| `/api/storage-files` | 2 |
| `/api/storage-settings` | 1 |
| `/api/video-tasks` | 2 |
| **合计** | **180** |

<details><summary>展开全部 180 条未实现端点</summary>

- `/api/ai/upload`
- `/api/app-info`
- `/api/asset-auth/bootstrap`
- `/api/asset-auth/login`
- `/api/asset-auth/logout`
- `/api/asset-auth/operation-approvals`
- `/api/asset-auth/operation-approvals/{p}`
- `/api/asset-auth/status`
- `/api/asset-auth/teams`
- `/api/asset-auth/teams/{p}`
- `/api/asset-auth/teams/{p}/members`
- `/api/asset-auth/teams/{p}/members/{p}`
- `/api/asset-auth/tokens`
- `/api/asset-auth/users`
- `/api/asset-auth/users/{p}`
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
- `/api/asset-library`
- `/api/asset-library/categories`
- `/api/asset-library/categories/{p}`
- `/api/asset-library/items/batch`
- `/api/asset-library/items/classify`
- `/api/asset-library/items/delete`
- `/api/asset-library/items/move`
- `/api/asset-library/items/{p}`
- `/api/asset-library/items/{p}/avatar-status`
- `/api/asset-library/items/{p}/register-avatar`
- `/api/asset-library/libraries`
- `/api/asset-library/libraries/{p}`
- `/api/asset-library/workflows/upload`
- `/api/asset-proxy/settings`
- `/api/asset-registry`
- `/api/asset-registry/asset-structures`
- `/api/asset-registry/asset-structures/{p}`
- `/api/asset-registry/asset-structures/{p}/current`
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
- `/api/asset-reviews/comments/{p}`
- `/api/asset-reviews/deliveries/{p}/export`
- `/api/asset-reviews/sessions`
- `/api/asset-reviews/sessions/{p}`
- `/api/asset-reviews/sessions/{p}/approval`
- `/api/asset-reviews/sessions/{p}/comments`
- `/api/asset-reviews/sessions/{p}/delivery`
- `/api/asset-reviews/shares`
- `/api/asset-thumbnails/delete`
- `/api/asset-thumbnails/delete-storyboards`
- `/api/asset-thumbnails/generate`
- `/api/asset-thumbnails/generate-background`
- `/api/asset-thumbnails/jobs/{p}`
- `/api/asset-thumbnails/settings`
- `/api/audio-waveform-data`
- `/api/canvas-assets`
- `/api/canvas-assets/download`
- `/api/canvases/assets`
- `/api/canvases/trash`
- `/api/canvases/{p}/meta`
- `/api/canvases/{p}/purge`
- `/api/canvases/{p}/touch`
- `/api/chat`
- `/api/chat/agent`
- `/api/codex/help`
- `/api/codex/status`
- `/api/download-output`
- `/api/episode-pipelines`
- `/api/episode-pipelines/{p}`
- `/api/episode-pipelines/{p}/stages/{p}/cancel`
- `/api/episode-pipelines/{p}/stages/{p}/complete`
- `/api/episode-pipelines/{p}/stages/{p}/start`
- `/api/gemini-cli/help`
- `/api/gemini-cli/status`
- `/api/jimeng/credit`
- `/api/jimeng/help`
- `/api/jimeng/login/start`
- `/api/jimeng/login/status`
- `/api/jimeng/logout`
- `/api/jimeng/status`
- `/api/local-assets`
- `/api/local-assets/caption`
- `/api/local-assets/classify`
- `/api/local-assets/delete`
- `/api/local-assets/folders`
- `/api/local-assets/items`
- `/api/local-assets/move`
- `/api/local-assets/upload`
- `/api/media-preview`
- `/api/media-transcode`
- `/api/observability`
- `/api/observability/asset-volumes`
- `/api/observability/events`
- `/api/observability/health`
- `/api/observability/overview`
- `/api/observability/series`
- `/api/observability/sources`
- `/api/observability/tasks`
- `/api/online-image`
- `/api/projects`
- `/api/projects/{p}`
- `/api/prompt-libraries`
- `/api/prompt-libraries/categories`
- `/api/prompt-libraries/categories/{p}`
- `/api/prompt-libraries/items`
- `/api/prompt-libraries/items/delete`
- `/api/prompt-libraries/items/{p}`
- `/api/prompt-libraries/{p}`
- `/api/providers`
- `/api/providers/fetch-models`
- `/api/providers/probe-async`
- `/api/providers/test-connection`
- `/api/public/shares/{p}`
- `/api/public/shares/{p}/access`
- `/api/public/shares/{p}/approvals`
- `/api/public/shares/{p}/comments`
- `/api/reference-canvases`
- `/api/shared-folders`
- `/api/shared-folders/import`
- `/api/shared-folders/{p}`
- `/api/shared-folders/{p}/tree`
- `/api/storage-files`
- `/api/storage-files/delete`
- `/api/storage-settings`
- `/api/video-tasks`
- `/api/video-tasks/{p}`
</details>

### 2.4 前端引用位置明细（188 条路径 → 文件:行号）

<details><summary>展开</summary>

- `/api/ai/upload`（**未实现**）—— js/asset-manager/api.js:38; v2/js/home-controller.js:500,607,617
- `/api/app-info`（**未实现**）—— js/settings.js:147; v2/js/home-controller.js:1028
- `/api/asset-auth/bootstrap`（**未实现**）—— js/asset-auth/api.js:43; js/hardware-telemetry.js:433
- `/api/asset-auth/login`（**未实现**）—— js/asset-auth/api.js:46; js/hardware-telemetry.js:404,433
- `/api/asset-auth/logout`（**未实现**）—— js/asset-auth/api.js:101; js/hardware-telemetry.js:463
- `/api/asset-auth/operation-approvals`（**未实现**）—— js/asset-auth/api.js:87,93; v2/js/collab-controller.js:73
- `/api/asset-auth/operation-approvals/{p}`（**未实现**）—— js/asset-auth/api.js:93
- `/api/asset-auth/status`（**未实现**）—— js/asset-auth/api.js:40; js/hardware-telemetry.js:237,355; js/task-center.js:1040
- `/api/asset-auth/teams`（**未实现**）—— js/asset-auth/api.js:36,61,64; js/asset-auth/api.js:36,61,64; js/hardware-telemetry.js:473,543,548,564; v2/js/collab-controller.js:72
- `/api/asset-auth/teams/{p}`（**未实现**）—— js/asset-auth/api.js:36
- `/api/asset-auth/teams/{p}/members`（**未实现**，helper 拼接入集）—— js/asset-auth/api.js:74
- `/api/asset-auth/teams/{p}/members/{p}`（**未实现**，helper 拼接入集）—— js/asset-auth/api.js:80
- `/api/asset-auth/tokens`（**未实现**）—— js/asset-auth/api.js:98
- `/api/asset-auth/users`（**未实现**）—— js/asset-auth/api.js:35,49,52; js/asset-auth/api.js:35,49,52; js/hardware-telemetry.js:548,565; v2/js/collab-controller.js:71
- `/api/asset-auth/users/{p}`（**未实现**）—— js/asset-auth/api.js:35
- `/api/asset-classification-prompt`（**未实现**）—— js/asset-manager/api.js:717,723; js/asset-manager/api.js:717,723
- `/api/asset-classification/background`（**未实现**）—— js/asset-manager/api.js:729,735; js/asset-manager/api.js:729,735
- `/api/asset-classification/jobs/{p}`（**未实现**）—— js/asset-manager/api.js:742
- `/api/asset-content`（**未实现**）—— js/asset-manager/api.js:55,59,67,75,82,88,96,103; js/asset-manager/api.js:55,59,67,75,82,88,96,103
- `/api/asset-content/pdf`（**未实现**）—— js/asset-manager/api.js:55
- `/api/asset-content/versions`（**未实现**）—— js/asset-manager/api.js:67,75,88,96,103
- `/api/asset-content/versions/{p}`（**未实现**）—— js/asset-manager/api.js:75,88,96,103; js/asset-manager/api.js:75,88,96,103; js/asset-manager/api.js:75,88,96,103
- `/api/asset-content/versions/{p}/restore`（**未实现**）—— js/asset-manager/api.js:75,88,96,103
- `/api/asset-file-info`（**未实现**）—— js/asset-manager/api.js:121
- `/api/asset-file-reveal`（**未实现**）—— js/asset-manager/api.js:329
- `/api/asset-library`（**未实现**）—— js/asset-manager/api.js:335,341,347,353,359,365,372,378,385,392,406,412,419,425,431,556
- `/api/asset-library/categories`（**未实现**）—— js/asset-manager/api.js:372,378,385
- `/api/asset-library/categories/{p}`（**未实现**）—— js/asset-manager/api.js:378,385; js/asset-manager/api.js:378,385
- `/api/asset-library/items/batch`（**未实现**）—— js/asset-manager/api.js:335
- `/api/asset-library/items/classify`（**未实现**）—— js/asset-manager/api.js:556
- `/api/asset-library/items/delete`（**未实现**）—— js/asset-manager/api.js:419
- `/api/asset-library/items/move`（**未实现**）—— js/asset-manager/api.js:341
- `/api/asset-library/items/{p}`（**未实现**）—— js/asset-manager/api.js:335,341,406,412,419,425,431,556; js/asset-manager/api.js:335,341,406,412,419,425,431,556
- `/api/asset-library/items/{p}/avatar-status`（**未实现**）—— js/asset-manager/api.js:335,341,406,412,419,425,431,556
- `/api/asset-library/items/{p}/register-avatar`（**未实现**）—— js/asset-manager/api.js:335,341,406,412,419,425,431,556
- `/api/asset-library/libraries`（**未实现**）—— js/asset-manager/api.js:353,359,365
- `/api/asset-library/libraries/{p}`（**未实现**）—— js/asset-manager/api.js:359,365; js/asset-manager/api.js:359,365
- `/api/asset-library/workflows/upload`（**未实现**）—— js/asset-manager/api.js:392
- `/api/asset-proxy/settings`（**未实现**）—— js/asset-manager/api.js:835,842; js/asset-manager/api.js:835,842
- `/api/asset-registry`（**未实现**）—— js/asset-manager.js:2852,3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515
- `/api/asset-registry/asset-structures`（**未实现**）—— js/asset-manager/api.js:214,225,231,237,244; js/asset-manager/api.js:214,225,231,237,244
- `/api/asset-registry/asset-structures/{p}`（**未实现**）—— js/asset-manager/api.js:231,237,244; js/asset-manager/api.js:231,237,244
- `/api/asset-registry/asset-structures/{p}/current`（**未实现**）—— js/asset-manager/api.js:231,237,244
- `/api/asset-registry/assets`（**未实现**）—— js/asset-manager/api.js:49,52,196,202,208,251,259,266,273,279,285,316,322,649,655,662,668; v2/js/home-controller.js:1106,1161
- `/api/asset-registry/assets/archive`（**未实现**）—— js/asset-manager/api.js:49
- `/api/asset-registry/assets/export-pdf`（**未实现**）—— js/asset-manager/api.js:52
- `/api/asset-registry/assets/import`（**未实现**）—— js/asset-manager/api.js:251
- `/api/asset-registry/assets/relations`（**未实现**）—— js/asset-manager/api.js:662
- `/api/asset-registry/assets/resolve-reference`（**未实现**）—— js/asset-manager/api.js:259
- `/api/asset-registry/assets/tags`（**未实现**）—— js/asset-manager/api.js:649
- `/api/asset-registry/assets/{p}`（**未实现**）—— js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668; js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668; js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668; js/asset-review/api.js:38
- `/api/asset-registry/assets/{p}/image-versions`（**未实现**）—— js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668; js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668
- `/api/asset-registry/assets/{p}/image-versions/{p}`（**未实现**）—— js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668; js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668
- `/api/asset-registry/assets/{p}/image-versions/{p}/media`（**未实现**）—— js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515
- `/api/asset-registry/assets/{p}/media`（**未实现**）—— js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515; js/episode-pipeline.js:2236
- `/api/asset-registry/assets/{p}/open-local`（**未实现**）—— js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668
- `/api/asset-registry/assets/{p}/relations/{p}`（**未实现**）—— js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668
- `/api/asset-registry/assets/{p}/tags/{p}`（**未实现**）—— js/asset-manager/api.js:49,52,202,208,251,259,266,273,279,285,316,322,649,655,662,668
- `/api/asset-registry/assets/{p}/video/clip`（**未实现**）—— js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515
- `/api/asset-registry/assets/{p}/video/frame`（**未实现**）—— js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515
- `/api/asset-registry/assets/{p}/video/storyboard`（**未实现**）—— js/asset-manager.js:3835,3955,3999,7922,10874,11320,11350,12066,12067,12172,13151,13527,13548,15071,15490,15515
- `/api/asset-registry/facets`（**未实现**）—— js/asset-manager/api.js:611
- `/api/asset-registry/folders`（**未实现**）—— js/asset-manager/api.js:304,310; js/asset-manager/api.js:304,310
- `/api/asset-registry/governance/asset-trash/{p}/restore`（**未实现**）—— v2/js/projects-controller.js:1401
- `/api/asset-registry/governance/assets/{p}/restore`（**未实现**）—— js/governance.js:175
- `/api/asset-registry/governance/audit-outbox/reconcile`（**未实现**）—— js/governance.js:315
- `/api/asset-registry/governance/canvases/purge-expired`（**未实现**）—— js/governance.js:342,371; js/governance.js:342,371
- `/api/asset-registry/governance/canvases/{p}/restore`（**未实现**）—— js/governance.js:209,342,371
- `/api/asset-registry/governance/cascade-preview`（**未实现**）—— js/governance.js:261
- `/api/asset-registry/governance/operations`（**未实现**）—— js/governance.js:294
- `/api/asset-registry/governance/overview`（**未实现**）—— js/governance.js:75; v2/js/projects-controller.js:1238
- `/api/asset-registry/governance/projects/{p}/restore`（**已实现**）—— js/governance.js:192; v2/js/projects-controller.js:953,956
- `/api/asset-registry/index/sync`（**未实现**）—— v2/js/home-controller.js:1304
- `/api/asset-registry/preferences/team`（**未实现**）—— js/settings.js:121,133; js/settings.js:121,133; v2/js/home-controller.js:991,1009; v2/js/home-controller.js:991,1009
- `/api/asset-registry/presets`（**未实现**）—— js/asset-manager/api.js:617,623,629; js/asset-manager/api.js:617,623,629
- `/api/asset-registry/presets/{p}`（**未实现**）—— js/asset-manager/api.js:629
- `/api/asset-registry/project-directory-templates`（**未实现**）—— js/asset-manager/api.js:146,153,159,165,171; js/asset-manager/api.js:146,153,159,165,171
- `/api/asset-registry/project-directory-templates/{p}`（**未实现**）—— js/asset-manager/api.js:159,165,171
- `/api/asset-registry/project-directory-templates/{p}/archive`（**未实现**）—— js/asset-manager/api.js:159,165,171
- `/api/asset-registry/project-directory-templates/{p}/default`（**未实现**）—— js/asset-manager/api.js:159,165,171
- `/api/asset-registry/project-entities/{p}`（**未实现**）—— js/asset-manager/api.js:586
- `/api/asset-registry/project-gates/{p}`（**未实现**）—— js/asset-manager/api.js:580
- `/api/asset-registry/project-recycle/{p}/restore`（**未实现**）—— v2/js/projects-controller.js:1414
- `/api/asset-registry/projects`（**已实现**）—— js/asset-manager/api.js:562,568,574,592,687,693; js/asset-manager/api.js:562,568,574,592,687,693; js/canvas-list/api.js:32,37,48; js/canvas-list/api.js:32,37,48; js/episode-pipeline.js:1842,1857; js/hardware-telemetry.js:41; v2/js/home-controller.js:66,462; v2/js/home-controller.js:66,462; v2/js/projects-controller.js:96,98,100,145,146,147,922,925,993,1006,1034,1037,1092,1163,1194; v2/js/projects-controller.js:96,98,100,145,146,147,922,925,993,1006,1034,1037,1092,1163,1194; v2/js/projects-controller.js:96,98,100,145,146,147,922,925,993,1006,1034,1037,1092,1163,1194; v2/js/projects-controller.js:96,98,100,145,146,147,922,925,993,1006,1034,1037,1092,1163,1194; v2/js/projects-controller.js:96,98,100,145,146,147,922,925,993,1006,1034,1037,1092,1163,1194; v2/js/projects-controller.js:96,98,100,145,146,147,922,925,993,1006,1034,1037,1092,1163,1194; v2/js/projects-controller.js:96,98,100,145,146,147,922,925,993,1006,1034,1037,1092,1163,1194; v2/workshop.html:569,593
- `/api/asset-registry/projects/{p}`（**已实现**）—— js/asset-manager/api.js:568,574,592,693; js/asset-manager/api.js:568,574,592,693; js/canvas-list/api.js:32; js/episode-pipeline.js:1857; v2/js/projects-controller.js:922,925,993,1006,1034,1037,1163,1194; v2/js/projects-controller.js:922,925,993,1006,1034,1037,1163,1194; v2/js/projects-controller.js:922,925,993,1006,1034,1037,1163,1194; v2/workshop.html:593
- `/api/asset-registry/projects/{p}/assets`（**未实现**）—— js/asset-manager/api.js:568,574,592,693
- `/api/asset-registry/projects/{p}/entities`（**未实现**）—— js/asset-manager/api.js:568,574,592,693
- `/api/asset-registry/projects/{p}/trash`（**已实现**）—— v2/js/projects-controller.js:922,925,993,1006,1034,1037,1163,1194
- `/api/asset-registry/projects/{p}/trash/restore`（**已实现**）—— v2/js/projects-controller.js:922,925,993,1006,1034,1037,1163,1194
- `/api/asset-registry/recycle-bin`（**未实现**）—— js/asset-manager/api.js:636,642
- `/api/asset-registry/recycle-bin/{p}/restore`（**未实现**）—— js/asset-manager/api.js:642
- `/api/asset-registry/reindex`（**未实现**）—— js/asset-manager/api.js:128
- `/api/asset-registry/remote-assets`（**未实现**）—— js/asset-manager/api.js:598,604
- `/api/asset-registry/remote-assets/{p}`（**未实现**）—— js/asset-manager/api.js:604
- `/api/asset-registry/settings/features/{p}`（**未实现**）—— js/asset-manager/api.js:292
- `/api/asset-registry/settings/index-automation`（**未实现**）—— js/asset-manager/api.js:298
- `/api/asset-registry/status`（**未实现**）—— js/asset-manager/api.js:189; js/settings.js:147; v2/js/home-controller.js:1029,1106,1146; v2/js/home-controller.js:1029,1106,1146
- `/api/asset-registry/workspace-jobs/{p}`（**未实现**）—— js/episode-pipeline.js:2236; js/task-center.js:1002,1020
- `/api/asset-registry/workspace-jobs/{p}/{p}`（**未实现**）—— js/task-center.js:1002,1020
- `/api/asset-reviews/comments/{p}`（**未实现**）—— js/asset-review/api.js:79
- `/api/asset-reviews/deliveries/{p}/export`（**未实现**）—— js/asset-review/api.js:58
- `/api/asset-reviews/sessions`（**未实现**）—— js/asset-review/api.js:42,45,48,52,64,70; js/asset-review/api.js:42,45,48,52,64,70
- `/api/asset-reviews/sessions/{p}`（**未实现**）—— js/asset-review/api.js:48,52,64,70
- `/api/asset-reviews/sessions/{p}/approval`（**未实现**）—— js/asset-review/api.js:48,52,64,70
- `/api/asset-reviews/sessions/{p}/comments`（**未实现**）—— js/asset-review/api.js:48,52,64,70
- `/api/asset-reviews/sessions/{p}/delivery`（**未实现**）—— js/asset-review/api.js:48,52,64,70
- `/api/asset-reviews/shares`（**未实现**）—— js/asset-review/api.js:75
- `/api/asset-thumbnails/delete`（**未实现**）—— js/asset-manager/api.js:766,772
- `/api/asset-thumbnails/delete-storyboards`（**未实现**）—— js/asset-manager/api.js:772
- `/api/asset-thumbnails/generate`（**未实现**）—— js/asset-manager/api.js:754,760
- `/api/asset-thumbnails/generate-background`（**未实现**）—— js/asset-manager/api.js:760
- `/api/asset-thumbnails/jobs/{p}`（**未实现**）—— js/asset-manager/api.js:748
- `/api/asset-thumbnails/settings`（**未实现**）—— js/asset-manager/api.js:177,183; js/asset-manager/api.js:177,183
- `/api/audio-waveform-data`（**未实现**）—— js/asset-manager/api.js:113
- `/api/canvas-assets`（**未实现**）—— js/asset-manager/api.js:46,699
- `/api/canvas-assets/download`（**未实现**）—— js/asset-manager/api.js:46
- `/api/canvases`（**已实现**）—— js/asset-manager/api.js:675,681; js/canvas-list/api.js:33,45,60,69,72; js/canvas-list/api.js:33,45,60,69,72
- `/api/canvases/assets`（**未实现**）—— js/asset-manager/api.js:681
- `/api/canvases/trash`（**未实现**）—— js/canvas-list/api.js:69,72; js/canvas-list/api.js:69,72
- `/api/canvases/{p}`（**已实现**）—— js/canvas-list/api.js:33,69,72
- `/api/canvases/{p}/meta`（**未实现**，helper 拼接入集）—— js/canvas-list/api.js:63
- `/api/canvases/{p}/touch`（**未实现**，helper 拼接入集）—— js/canvas-list/api.js:76,79
- `/api/canvases/{p}/purge`（**未实现**，helper 拼接入集）—— js/canvas-list/api.js:85
- `/api/canvases/{p}/restore`（**已实现**）—— v2/js/projects-controller.js:1426
- `/api/chat`（**未实现**）—— js/episode-pipeline.js:2116,2118,2123,2132,2134,2139; js/episode-pipeline.js:2116,2118,2123,2132,2134,2139; js/episode-pipeline.js:2116,2118,2123,2132,2134,2139; v2/js/home-controller.js:500,778,780
- `/api/chat/agent`（**未实现**）—— js/episode-pipeline.js:2116,2118,2123; js/episode-pipeline.js:2116,2118,2123; js/episode-pipeline.js:2116,2118,2123; v2/js/agents-controller.js:121
- `/api/codex/help`（**未实现**）—— js/api-settings.js:1140
- `/api/codex/status`（**未实现**）—— js/api-settings.js:1113
- `/api/download-output`（**未实现**）—— js/asset-manager.js:8813,8814,8866; js/asset-manager.js:8813,8814,8866
- `/api/episode-pipelines`（**未实现**）—— js/asset-manager/api.js:828; js/episode-pipeline.js:1981,2016,2042,2079,2105,2107,2108; js/episode-pipeline.js:1981,2016,2042,2079,2105,2107,2108; js/episode-pipeline.js:1981,2016,2042,2079,2105,2107,2108; v2/workshop.html:643,809; v2/workshop.html:643,809
- `/api/episode-pipelines/{p}`（**未实现**）—— js/episode-pipeline.js:1981,2105,2107,2108
- `/api/episode-pipelines/{p}/stages/{p}/cancel`（**未实现**）—— js/episode-pipeline.js:1981,2105,2107,2108
- `/api/episode-pipelines/{p}/stages/{p}/complete`（**未实现**）—— js/episode-pipeline.js:1981,2105,2107,2108
- `/api/episode-pipelines/{p}/stages/{p}/start`（**未实现**）—— js/episode-pipeline.js:1981,2105,2107,2108
- `/api/gemini-cli/help`（**未实现**）—— js/api-settings.js:1187
- `/api/gemini-cli/status`（**未实现**）—— js/api-settings.js:1160
- `/api/jimeng/credit`（**未实现**）—— js/api-settings.js:1060
- `/api/jimeng/help`（**未实现**）—— js/api-settings.js:1093
- `/api/jimeng/login/start`（**未实现**）—— js/api-settings.js:1026
- `/api/jimeng/login/status`（**未实现**）—— js/api-settings.js:1041
- `/api/jimeng/logout`（**未实现**）—— js/api-settings.js:1071
- `/api/jimeng/status`（**未实现**）—— js/api-settings.js:1010
- `/api/local-assets`（**未实现**）—— js/asset-manager/api.js:400,506,514,520,526,532,538,544,550,821
- `/api/local-assets/caption`（**未实现**）—— js/asset-manager/api.js:538,544; js/asset-manager/api.js:538,544
- `/api/local-assets/classify`（**未实现**）—— js/asset-manager/api.js:550
- `/api/local-assets/delete`（**未实现**）—— js/asset-manager/api.js:514
- `/api/local-assets/folders`（**未实现**）—— js/asset-manager/api.js:526,532; js/asset-manager/api.js:526,532
- `/api/local-assets/items`（**未实现**）—— js/asset-manager/api.js:520
- `/api/local-assets/move`（**未实现**）—— js/asset-manager/api.js:400
- `/api/local-assets/upload`（**未实现**）—— js/asset-manager/api.js:506
- `/api/media-preview`（**未实现**）—— js/asset-manager.js:2843,2873,12219; js/asset-manager.js:2843,2873,12219
- `/api/media-transcode`（**未实现**）—— js/asset-manager.js:2888
- `/api/observability`（**未实现**）—— v2/js/collab-controller.js:85
- `/api/observability/asset-volumes`（**未实现**）—— js/task-center.js:15
- `/api/observability/events`（**未实现**）—— js/task-center.js:11
- `/api/observability/health`（**未实现**）—— js/task-center.js:13
- `/api/observability/overview`（**未实现**）—— js/task-center.js:9
- `/api/observability/series`（**未实现**）—— js/task-center.js:10
- `/api/observability/sources`（**未实现**）—— js/task-center.js:14
- `/api/observability/tasks`（**未实现**）—— js/task-center.js:12
- `/api/online-image`（**未实现**）—— js/episode-pipeline.js:2237
- `/api/projects`（**未实现**）—— v2/workshop.html:574,595
- `/api/projects/{p}`（**未实现**）—— js/episode-pipeline.js:1857; v2/workshop.html:595
- `/api/prompt-libraries`（**未实现**）—— js/asset-manager/api.js:437,443,449,455,462,468,474,481,487,493,500; js/asset-manager/api.js:437,443,449,455,462,468,474,481,487,493,500; js/episode-pipeline.js:1843
- `/api/prompt-libraries/categories`（**未实现**）—— js/asset-manager/api.js:462,468,474
- `/api/prompt-libraries/categories/{p}`（**未实现**）—— js/asset-manager/api.js:468,474; js/asset-manager/api.js:468,474
- `/api/prompt-libraries/items`（**未实现**）—— js/asset-manager/api.js:481,487,493,500
- `/api/prompt-libraries/items/delete`（**未实现**）—— js/asset-manager/api.js:500
- `/api/prompt-libraries/items/{p}`（**未实现**）—— js/asset-manager/api.js:487,493,500; js/asset-manager/api.js:487,493,500
- `/api/prompt-libraries/{p}`（**未实现**）—— js/asset-manager/api.js:449,455,462,468,474,481,487,493,500; js/asset-manager/api.js:449,455,462,468,474,481,487,493,500
- `/api/providers`（**未实现**）—— js/api-settings.js:1277,1341,1431,1917,1977; js/api-settings.js:1277,1341,1431,1917,1977; js/asset-manager/api.js:711; js/episode-pipeline.js:1844
- `/api/providers/fetch-models`（**未实现**）—— js/api-settings.js:1431
- `/api/providers/probe-async`（**未实现**）—— js/api-settings.js:1277
- `/api/providers/test-connection`（**未实现**）—— js/api-settings.js:1341
- `/api/public/shares/{p}`（**未实现**）—— js/asset-share/api.js:31
- `/api/public/shares/{p}/access`（**未实现**，helper 拼接入集）—— js/asset-share/api.js:38
- `/api/public/shares/{p}/comments`（**未实现**，helper 拼接入集）—— js/asset-share/api.js:41
- `/api/public/shares/{p}/approvals`（**未实现**，helper 拼接入集）—— js/asset-share/api.js:44
- `/api/reference-canvases`（**未实现**）—— js/asset-manager/api.js:705
- `/api/shared-folders`（**未实现**）—— js/asset-manager.js:2852; js/asset-manager/api.js:790,796,802,809,815; js/asset-manager/api.js:790,796,802,809,815
- `/api/shared-folders/import`（**未实现**）—— js/asset-manager/api.js:815
- `/api/shared-folders/{p}`（**未实现**）—— js/asset-manager/api.js:802,809,815
- `/api/shared-folders/{p}/tree`（**未实现**）—— js/asset-manager/api.js:802,809,815
- `/api/storage-files`（**未实现**）—— js/asset-manager.js:2852; js/asset-manager/api.js:779,784
- `/api/storage-files/delete`（**未实现**）—— js/asset-manager/api.js:784
- `/api/storage-settings`（**未实现**）—— js/asset-manager/api.js:134,137; js/asset-manager/api.js:134,137
- `/api/video-tasks`（**未实现**）—— js/episode-pipeline.js:2250,2251
- `/api/video-tasks/{p}`（**未实现**）—— js/episode-pipeline.js:2250

</details>

> 注：§2.4 使用**报告扫描口径**（逐行定位，便于人工核对）；§1/§2.1/§2.3 使用**守卫口径**
> （模板嵌套感知提取）。两者在动态拼接端点上的计数略有差异属于已知口径差，均已在 §6 声明。

## 3. 真实 HTTP 实测

方式：单进程 Python 内 `uvicorn.Server`（`GW_RELOAD=false`，端口 **2461**）+ `httpx`；
请求头 `Authorization: Bearer cleanroom-test` / `X-User-Role: editor`（**测试用头，非真实 IdP、非生产鉴权**）。

```text
== A. 契约声明端点（14 条，真实 HTTP）==
GET    /api/asset-registry/projects?archived=false                -> 200
POST   /api/asset-registry/projects                               -> 400
PATCH  /api/asset-registry/projects/prj-0001                      -> 400
DELETE /api/asset-registry/projects/prj-0001                      -> 400
POST   /api/asset-registry/governance/projects/prj-0001/restore   -> 400
POST   /api/asset-registry/projects/prj-0001/trash                -> 400
POST   /api/asset-registry/projects/prj-0001/trash/restore        -> 400
GET    /api/canvases?project_id=prj-0001                          -> 200
POST   /api/canvases                                              -> 400
PATCH  /api/canvases/cv-0001                                      -> 400
POST   /api/canvases/cv-0001/restore                              -> 400
POST   /api/canvases/cv-0001/workflow/import                      -> 400
POST   /api/canvases/cv-0001/workflow/export                      -> 200
POST   /api/canvases/cv-0001/tasks                                -> 400

== B. 未实现端点抽样（真实 HTTP）==
GET    /api/asset-registry/assets                                 -> 404
GET    /api/asset-registry/governance/overview                    -> 404
GET    /api/asset-auth/status                                     -> 404
GET    /api/asset-auth/users                                      -> 404
GET    /api/providers                                             -> 404
GET    /api/providers/probe-async                                 -> 404
GET    /api/asset-library                                         -> 404
GET    /api/local-assets                                          -> 404
GET    /api/observability/overview                                -> 404
GET    /api/prompt-libraries                                      -> 404
GET    /api/video-tasks                                           -> 404
GET    /api/episode-pipelines                                     -> 404
GET    /api/review-sessions                                       -> 404
GET    /api/shared-folders                                        -> 404
GET    /api/storage-files                                         -> 404
GET    /api/asset-content                                         -> 404
GET    /api/chat                                                  -> 404
GET    /api/jimeng/status                                         -> 404
GET    /api/canvas-assets                                         -> 404
GET    /api/ws/stats                                              -> 404
```

**口径说明（重要，不得误读）**：

- **A 组**为契约声明的 14 条端点。`POST` / `PATCH` / `DELETE` 返回 **400**，是因为实测发送了**空 JSON body**，
  被请求模型校验拒绝（`INVALID_REQUEST`）。这**恰恰证明路由已挂载并进入了业务校验**，端点**存在**。
  `GET` 类与 `workflow/export` 返回 **200**。
- **B 组**的 20 条抽样覆盖 §2.3 的各个功能域，**一律 404**，证明后端无对应路由。
- `POST /api/asset-registry/projects` 本轮未携带正确请求体，故**未复现** P7-A3 的 201；
  201 与响应字段取证见 `P7-A3-PROJECTS-ID-FIX.md` §8.2（**引用，非本轮复测**）。

## 4. 影响面（按页面）

> 归属推导：解析 HTML 的 `<script src>`，再沿 ES module 的 `from './x.js'` 直接 import 闭包聚合。
> 属**静态推导**，与运行期动态加载可能存在差异，**不是浏览器实测**。

| HTML 页面 | 引用的 /api 路径数 |
|---|---|
| `asset-manager.html` | 125 |
| `v2/collab.html` | 22 |
| `episode-pipeline.html` | 17 |
| `api-settings.html` | 14 |
| `v2/projects.html` | 9 |
| `governance.html` | 8 |
| `v2/index.html` | 8 |
| `task-center.html` | 7 |
| `canvas-list.html` | 5 |
| `v2/settings.html` | 4 |
| `v2/agents.html` | 2 |
| `v2/assets.html` | 1 |
| `v2/production.html` | 1 |
| `v2/storyboard.html` | 1 |
| `asset-share.html` | 0 |
| `v2/workshop.html` | 0 |

共 **16** 个 HTML 页面，与 P6-A2 / P7-A3 记录的 16 页一致。

关键影响（**引用 P7-A3 既有取证**，本轮**未复测**）：
- `asset-manager.html`：首屏被 `GET /api/asset-registry/assets` 的 404 阻断，项目树不渲染（P7-A3 §8.3）。
- `v2/projects.html`：`refreshGlobalTrash()` 依赖 `/api/asset-registry/governance/overview` 404（P7-A3 §12.5）。
- `api-settings.html`：`/api/providers*`（含 `probe-async` / `test-connection` / `fetch-models`）未实现。

## 5. 处置建议（三类，不代为决策）

### 5.1 可直接本地关闭（实施前需用户确认）

对确属「本仓当前洁净切片范围之外」的前端页面/功能块，做**显式占位或禁用降级**
（首屏失败时给出明确提示，而非空白/静默失效）。这属**前端行为变更**，需用户确认。

### 5.2 需用户 / 产品裁决

- 未实现端点的**优先级排序**：先补哪些域（项目中心 / 画布闭环 vs 素材库 / 观测 / 提示词库 / 设置页）。
- 是否将 `asset-manager` / `api-settings` / `task-center` 等**大功能面**整体标记为「未纳入当前切片」。
- 前端是否统一改为「无后端时降级」而非直接 `fetch`。

### 5.3 需补契约

若后续决定实现这些端点，必须**先补 `docs/contracts/` 声明**（方法、路径、状态码、schema），
再实现、再补黄金夹具与契约测试。**当前不在冻结契约内的端点不得直接实现。**

## 6. 取证边界

| 类别 | 说明 |
|---|---|
| 静态扫描 | 前端 `/api` 字符串字面量（含模板串 `${...}` 嵌套）与后端装饰器路由；归一化规则见 §7 |
| 真实 HTTP 实测 | §3 的 34 条请求（A 组 14 + B 组 20），真实 `uvicorn.Server` + `httpx`，端口 2461 |
| 引用既有证据 | §4 中标注「引用 P7-A3」的行，本轮**未复测** |
| **未取证** | 浏览器端逐页交互（属 P8-A2 范围）；动态拼接 URL 的**运行时变体**；外部 IdP 真实鉴权；各未实现端点的**预期业务语义** |

> **计数为静态下界近似**：**路径段位置**的模板占位统一折叠为 `{p}`，故 `/api/x/${a}` 与 `/api/x/${b}` 视为同一路径；
> 而**查询串 / 后缀拼接**（如 `${suffix ? `?${suffix}` : ''}`）不再产生额外路径段（已修正，见 §8.3）；
> **helper 拼接产生的真实路径段**（如 `${canvasUrl(id)}/meta` 的 `/meta`）则相反——属真实端点，已补入基线（见 §8.3 缺陷 C）。
> **helper 拼接类调用（第二轮已修复，不再漏扫）**：形如 `js/canvas-list/api.js` 的
> `${canvasUrl(id)}/meta`、`js/asset-share/api.js` 的 `${shareUrl(token)}/access` 等调用，会生成
> `/api/canvases/{id}/meta`、`/api/public/shares/{id}/access` 等**真实路径**，但字面量以 `` `${ `` 起头、不含独立 `/api` 前缀。
> 现已由 `_frontend_helper_defs()` + `_extract_helper_call_literals()` 还原并入集（详见 §8.3 缺陷 C），
> 共补入 **8 条**；本报告全部计数均按 **188 / 180** 口径。
> 该解析为**一层**：`helper 定义基准路径 + 调用点直接后缀`。若出现「helper 套 helper」或「后缀再拼变量」等更深的运行时组合，仍属本口径的**下界**；本轮已对 `src/gods_workbench/static/` 全量调用点逐一核对，未发现此类更深组合。
> 不排除存在**反向缺口**（后端已实现但前端从未调用）—— 本轮未对该方向作断言。

## 7. 复算命令

```powershell
# 前端 /api 字面量（排除 vendor）
Get-ChildItem -Recurse -File src/gods_workbench/static -Include *.js,*.html |
  Where-Object { $_.FullName -notmatch '\\vendor\\' } |
  Select-String -Pattern '/api/[A-Za-z0-9_\-\$/]' | Measure-Object

# 后端路由（含 APIRouter prefix 展开）
Select-String -Path src/gods_workbench/api/*.py -Pattern 'APIRouter|@(router|jobs_router|app)\.(get|post|patch|put|delete)'

# 契约声明
Select-String -Path docs/contracts/*.yaml -Pattern 'path:'

# 本守卫（含自检）
python -m pytest tests/contracts/test_phase8_frontend_backend_api_gap.py -q --no-header -p no:cacheprovider
```

## 8. 配套契约守卫

`tests/contracts/test_phase8_frontend_backend_api_gap.py`（纯 Python，不依赖浏览器与网络）把本报告基线冻结为显式清单：

| 用例 | 断言 |
|---|---|
| `test_frontend_referenced_api_paths_match_frozen_baseline` | 前端 `/api` 引用全集与基线一致（新增/删除即失败） |
| `test_unimplemented_api_paths_match_frozen_baseline` | 「前端调用但后端未实现」集合与冻结清单一致（核心防漂移） |
| `test_implemented_api_paths_match_frozen_baseline` | 「前端调用且后端已实现」集合一致 |
| `test_backend_route_set_not_narrowed` | 后端路由集合不得被意外缩小 |
| `test_every_contract_endpoint_has_backend_implementation` | 契约每条 method+path 都有后端实现 |
| `test_contract_endpoints_without_frontend_caller_match_baseline` | 「契约声明但前端无调用方」集合一致 |

### 8.1 守卫自检（隔离副本内注入，仓库未被污染）

**自检一：移除已实现的后端路由** —— 在 `%TEMP%` 隔离副本中把 `routes_projects.py` 的 `"/projects"` 改为 `"/__selftest_fake__"`：

```text
FAILED tests/contracts/test_phase8_frontend_backend_api_gap.py::test_every_contract_endpoint_has_backend_implementation
AssertionError: 以下契约端点在后端没有实现（契约与实现不一致）：
  GET /api/asset-registry/projects（契约文件 PROJECTS-HUB-INTERFACE-CATALOG.yaml）
1 failed, 5 passed
```

**自检二：新增前端未实现引用** —— 把 `home-controller.js` 中一处 `/api/asset-registry/status` 改为 `/api/__selftest_new_gap__`：

```text
FAILED ...::test_frontend_referenced_api_paths_match_frozen_baseline
FAILED ...::test_unimplemented_api_paths_match_frozen_baseline
AssertionError: 发现**新增**的「前端调用但后端未实现」端点：
  /api/__selftest_new_gap__
2 failed, 4 passed
```

两次自检**均在隔离副本内完成**；仓库工作区未保留任何注入改动。

### 8.3 扫描器缺陷修复取证（三处缺陷，提交前反向发现，均已修复）

提取器、归一化与 helper 拼接线三处缺陷均在 `%TEMP%` 隔离副本内独立复现、修复并验证，本仓工作区未保留任何注入改动。

**修正前 / 后对照（同一冻结基线口径）**

| 项 | 首版（错误值） | 当前基线 |
|---|---|---|
| 前端去重归一化 `/api` 路径 | 177 | **188**（缺陷 A/B 修后 180，缺陷 C 补 8） |
| 前端调用且后端已实现 | 8 | **8** |
| **前端调用但后端未实现** | 169 | **180**（172 + 缺陷 C 的 8） |
| 后端已实现路由 | 14 | 14 |
| 契约声明 method+path | 14 | 14 |
| 契约声明但前端无调用方 | 3 | 3 |
| **helper 拼接类调用**（旧扫描器结构性漏扫） | 0（未收录） | **8（已入集）** |

**缺陷 A（提取器失明）独立复现：** 修复前 `_extract_api_literals(asset-manager.js)` 只提取 1 条；
修复后 23 条。真凭据：在隔离副本的 `asset-manager.js` **末尾**追加 `const __P__='/api/__probe_tail__';` 后，
守卫由“6 passed（漏报）”变为“2 failed, 4 passed”——证明文件尾部不再被吞并。

**缺陷 B（归一化虚增）独立复现：** 修复前集合含 12 条幽灵路径且漏失 3 条基路径；
修复后幽灵路径 0 条，补回 `/api/asset-content/versions`、`/api/asset-file-info`、`/api/audio-waveform-data`。
规则修正：仅当 `${` 紧接在 `/` 之后才视为路径占位符，否则视为查询串/后缀拼接并截断。

**缺陷 C（helper 拼接类结构性漏扫，第二轮补充修复）：** 旧提取器只承认**以 `/api` 起头**的字面量，因此形如 `` `${canvasUrl(id)}/meta` ``、`` `${shareUrl(token)}/access` `` 的调用虽然真实可达，却因字面量以 `` `${ `` 开头而被整体漏扫。修复方式：新增 `_frontend_helper_defs()` 收集 `` const xxxUrl = (...) => `/api/...` `` 形式的基础路径，并用 `_extract_helper_call_literals()` 提取 `` ${helper(...)} `` 起头的模板串，二者拼接后再归一化入集。

实证：旧实现 180 条，新实现 **188 条**，**净增 8 条、零删除**——
`/api/asset-auth/teams/{p}/members`、`/api/asset-auth/teams/{p}/members/{p}`、
`/api/canvases/{p}/meta`、`/api/canvases/{p}/purge`、`/api/canvases/{p}/touch`、
`/api/public/shares/{p}/access`、`/api/public/shares/{p}/approvals`、`/api/public/shares/{p}/comments`。
8 条**均无对应后端实现**，故 `KNOWN_UNIMPLEMENTED` 172 → **180**，`KNOWN_IMPLEMENTED` 保持 **8**。
**阴性对照**：在 `%TEMP%` 隔离副本中注入一条未登记的 helper 拼接调用后，守卫确定失败并逐字点名该路径（`2 failed, 4 passed`）——证明新逻辑有鉴别力，不是空转。


**第二轮（缺陷 C）追加取证：**

| 项 | 值 |
|---|---|
| 旧扫描器入集数 | 180 |
| 新扫描器入集数 | **188** |
| 净增（新增 - 删除） | **+8 / -0** |
| 8 条是否已实现 | 全部**未实现**（故全入 `KNOWN_UNIMPLEMENTED`） |
| 阴性对照（隔离副本注入 1 条未登记 helper 拼接调用） | 守卫 **2 failed, 4 passed**，逐字点名 `/api/canvases/{p}/__probe_new__` |
| 门禁复跑 | `pytest` **86 passed**；`node --check` **54 / 0 failed** |
| 真实浏览器复跑（端口 2513，16 页） | `pageerror` **0**；`canvas-list.html` `ready` + `canvasIds=['cv-0001']` |

新增 8 条来源：`js/asset-auth/api.js:74,80`、`js/asset-share/api.js:38,41,44`、`js/canvas-list/api.js:63,76,79,85`。

**回归门禁：** `python -m pytest -q --no-header -p no:cacheprovider` → **86 passed**；
`node --check`（非 vendor `.js`）→ **54 / 0 failed**；二进制红线 → **0 违规**。

### 8.2 变更指引

- 若失败原因是**新增缺口**：先确认为笔误还是新功能；确属有意则更新 `KNOWN_UNIMPLEMENTED` 并记录于本报告。
- 若失败原因是**缺口减少**（端点已被实现）：这是**期望的改进**，需同步更新基线并**补契约声明**。
- **不得**为让测试通过而放宽断言或删除条目而不做记录。


## 9. 第三轮收口：提交、远端 CI 与独立审核读回（2026-09-21 追加）

### 9.1 提交与推送

- 提交：`9808bab17b1bb069edfa2d1d6986ddc13fc98930`（中文信息：Phase 8：前后端接口缺口对账（P8-A1）与全站前端深度巡检（P8-A2）），`9 files changed, 2367 insertions(+), 10 deletions(-)`。
- 逐文件 `git add`（**未使用 `git add -A`**）；推送走本机 7897 出口代理（仅本次通道，**未写入仓库配置**）。
- 读回：`git rev-parse HEAD` == `git rev-parse origin/master` == `9808bab17b1bb069edfa2d1d6986ddc13fc98930`（逐字一致）。

### 9.2 远端 CI（GitHub Actions，workflow 「CI」）

```text
gh run view 35564655226 --json conclusion,headSha,event,workflowName,status
{"conclusion":"success","event":"push","headSha":"9808bab17b1bb069edfa2d1d6986ddc13fc98930",
 "workflowName":"CI","status":"completed"}
```

关键步骤原文（`gh run view 35564655226 --log`，Ubuntu 24.04.5 / Python 3.11.16）：

```text
依赖导入通过: 0.141.1 2.13.5 0.53.0
运行全量测试    : 86 passed, 2 warnings in 1.85s
扫描二进制白名单: 二进制白名单扫描通过；允许项仅为 3 个 Source Han Sans CN 字体路径。
```

`headSha` 与本报告基线提交**逐字一致**，故该 success 覆盖本轮工作树（Linux / Python 3.11）。

### 9.3 独立审核（第三轮已成立）

- 第三轮重试后，`/root/p8_review_i` **成功收到任务正文并完成只读核验**（先直接 payload 失败，改为「任务书写盘 + 只读文件引用」后成功）。
- 其结论：冻结基线 **188 / 180** 与真值集合逐字一致（`missing=[] added=[]`）；后端路由 **14**；契约无前端调用方 **3**；12 条 `{p}{p}` 幽灵路径已清除；8 条 helper 拼接路径已入集且确无实现；洁净室红线通过；**独立复跑 `pytest` 86 passed、`node --check` 54/0**。
- 审核代理指出的 3 处**真实文档口径缺陷**（P8-A2 §5.4 「两个缺陷」、§7 第 2 项「仅登记」、§8.4 第 2 项「剩余偏差待立项」）已由主代理**最小修正**，详见 P8-A2 §8.6。
- 边界：该审核代理属**同一多代理框架内的独立执行主体**，**仍不等同于外部第三方机构审计**，也不改变发布阻断项。

### 9.4 口径边界（务必区分）

| 层级 | 状态 |
|---|---|
| 本地实测（Windows） | 通过（`pytest` 86 passed；`node --check` 54/0；二进制红线 0；16 页真实浏览器 `pageerror` 0） |
| 远端 CI（`35564655226` @ `9808bab`） | **success**（Linux Python 3.11.16 / Ubuntu 24.04.5，86 passed，二进制白名单通过） |
| 独立审核 | **已收到结论**（同框架第三方子代理；非外部机构） |
| 生产验收 | **未执行**，仍为独立决策 |

> 本地通过 != 远端 CI != 生产验收。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
