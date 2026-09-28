# Phase 12 任务书 A3｜审查·流水线·提示词条目·公开分享真实接入

## 你的角色
你是 A3 负责人。**唯一目标**：把 23 条「未接入」端点接到**真实落盘状态机**。

## 范围（严格边界）
- 允许改：`src/gods_workbench/api/routes_asset_review.py`、`routes_episode_pipeline_b7.py`、
  `routes_prompt_library_b8.py`、`routes_public_b9.py`、
  `src/gods_workbench/asset_review/**`（可新增模块）、`src/gods_workbench/prompt_library/**`（可新增模块）、
  以及这 4 块对应契约与夹具：
  `docs/contracts/ASSET-REVIEW-INTERFACE-CATALOG.yaml`、`EPISODE-PIPELINE-INTERFACE-CATALOG.yaml`、
  `PROMPT-LIBRARY-B8-ITEM-INTERFACE-CATALOG.yaml`、`PUBLIC-SHARE-INTERFACE-CATALOG.yaml`、
  `tests/contracts/test_phase11_b6_review.py`、`test_phase11_b7_episode.py`、
  `test_phase11_b8_prompt_items.py`、`test_phase11_b9_public_share.py`。
- **禁止改**：`routes_asset_review_b6.py`、`routes_episode_pipeline_b7.py` 之外的新块文件
  （即不要动 A1/A2/A4 的任何路由）、`core/` 已有文件、`app.py`、Phase 8 守卫、hygiene。
- 注意：`routes_asset_review_b6.py` 已有真实实现（9 条），你只处理 `routes_asset_review.py` 的 9 条旧面；
  两者若重复注册同一路径会冲突——**先核实路径是否重叠**，重叠时以 b6 为准并在报告说明。

## 未接入清单（23 条）
见 `docs/governance/agent-briefs-2026-09-26/PHASE-12-A3-GAPS.md`。

## 真实数据源要求

1. **审查会话**：`POST/GET /api/asset-reviews/sessions[/{session_id}]` 落盘（`core.storage.JsonState`，
   命名空间 `asset_review`），稳定 ID `rs-0001` 形态；会话含状态机
   （`open → delivered → approved/rejected`），非法流转返回 `409` 或 `400`（写死在契约）。
2. **评论**：`POST /sessions/{session_id}/comments`、`PATCH /comments/{comment_id}` 真实落盘；
   `comment_id` 为 `rc-0001` 形态。
3. **交付与导出**：`POST /sessions/{session_id}/delivery` 创建交付记录；
   `POST /deliveries/{delivery_id}/export` 用纯标准库生成最小合法 PDF（`%PDF-` 开头、`%%EOF` 结尾），
   或返回 `503` 并写明；禁止假字节。
4. **审批**：`PUT /sessions/{session_id}/approval` 真实落盘审批结论（含角色校验：只读角色 `403`）。
5. **分享**：`POST /api/asset-reviews/shares` 生成**本地**分享令牌（`secrets.token_urlsafe`，
   只存哈希），返回一次性明文令牌。
6. **剧集流水线**：6 条 – `GET/POST /api/episode-pipelines`、`GET /{pipeline_id}`、
   `POST /{pipeline_id}/stages/{stage_id}/{start|complete|cancel}`。
   真实落盘流水线 + 阶段状态机（`pending → running → completed/cancelled`），
   非法流转 `409`，稳定 ID `ep-0001` / `stg-0001` 形态。**阶段推进不执行任何真实渲染**，
   只推进状态（必须在契约里写明「本阶段不触发真实渲染」，避免夸大）。
7. **提示词条目**：`POST /api/prompt-libraries/items`、`PATCH/DELETE /items/{item_id}`、
   `POST /items/delete` 真实落盘到**既有** `PromptLibraryService` 所在命名空间（先读现有实现确认口径），
   稳定 ID 用既有前缀，**不要自创第二套 ID 体系**。
8. **公开分享**：4 条 – `GET /api/public/shares/{share_token}`、
   `POST .../access`、`PUT .../approvals`、`POST .../comments`。
   - `share_token` 为**不透明**令牌，服务端只存哈希；查不到 → `404 SHARE_NOT_FOUND`。
   - 公开端点**不需要**登录（这是公开分享语义），但必须限流（简单内存/落盘计数即可）并在契约写死。
   - **这不是公网托管**：token 只在本地有效，文档必须如实写「本地分享令牌，未接公网托管」。

## 必须写的测试（至少）
- 23 条：写操作未认证 `401`；只读角色写操作 `403`；公开分享端点**无认证**也能访问（且 token 不存在时 `404`）。
- 状态机：合法流转成功；非法流转 `409`/`400`。
- 写→读回：创建会话/流水线/条目/分享后可读；删除后不再返回。
- 分享令牌：返回明文后，用明文能查到，用篡改令牌返回 `404`。
- 稳定 ID 形态断言（`rs-0001`、`ep-0001`、`stg-0001` 等）。
- 重启用例：同 `GW_DATA_DIR` 新实例可读回。

## 交付
报告写入：`docs/governance/agent-briefs-2026-09-26/PHASE-12-A3-REPORT.md`

## 通用硬门禁（逐条必须满足）

1. **契约先行**：先改本块契约 YAML（`version` 号 +1，写死状态码 / 错误码 / 稳定 ID 口径 /
   fail-closed 触发条件 / CAS 粒度），再改实现。契约里必须体现新真实语义，不能只写 503。
2. **零伪造**：任何无法证明的分支必须显式返回 `503` + `data_status=not_integrated`，
   或空集合 + `data_gaps`。**禁止**随机数、常量假曲线、演示数据、假 job_id、假 URL、假进度。
3. **路径安全**：任何本机文件读写必须调用 `gods_workbench.core.storage.resolve_within_roots()`；
   必须已配置 `GW_ALLOWED_ROOTS`（绝对路径，`os.pathsep` 分隔），否则返回 `403`；
   对外展示路径用 `relative_display()`，**绝不回显调用方给出的原始绝对路径**。
4. **失败关闭**：外部依赖（ffmpeg / Provider 凭据 / 允许根目录）缺失或异常 → `503`，
   不得静默降级为假成功。
5. **真实副作用可核验**：写入必须能被紧接着的读接口观察到；删除后读接口不得再返回该对象。
   （请为每条写接口至少写一个「写 → 读回」断言。）
6. **保留既有边界语义**：`401`（未认证）、`403`（只读角色写操作）、`409`（CAS 冲突）
   的既有测试必须继续通过；把本块原「一律 503」的断言改成断言**新真实语义**，
   并**保留**依赖缺失时的 `503` 用例。
7. **禁止改动**：`src/gods_workbench/api/app.py`、`src/gods_workbench/core/*.py`（**除你新建的块内子模块**）、
   `tests/contracts/test_phase8_frontend_backend_api_gap.py`、`tests/hygiene/*`。
   若确实需要改，**停下来在报告里写「需要主代理改 X」，不要自己动**。
8. **语言**：代码注释、文档、报告全部中文。
9. **禁止 git 操作**：不要 `git add/commit/push/checkout/stash/reset/clean`。只改工作树文件。
10. **交付**：完成后把「本块实施报告」写入指定路径，格式见下。

## 实施报告格式（写入指定路径）

```markdown
# Phase 12 块 <X>｜实施报告

- 日期：2026-09-26
- 负责人：<块>代理
- 契约版本：<旧> → <新>

## 1. 逐条接入结果
| # | method path | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|

## 2. 真实数据源证据
（说明数据落在哪、重启是否可恢复、如何用命令复算）

## 3. 失败关闭证据
（依赖缺失 / 越界 / 未认证 时各返回什么，贴命令与响应）

## 4. 本块测试结果
（原样贴 `python -m pytest <本块用例> -q` 输出）

## 5. 未闭环项与不确定项
（必须如实列出，禁止写「无」除非真的没有）

## 6. 需要主代理处理的共享文件改动
（没有就写「无」）
```

## 环境提示

- 仓库根：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（PowerShell，`cwd` 已在此）。
- 运行测试：`python -m pytest <path> -q`。
- 认证：测试里用 `Bearer cleanroom-test` + `X-User-Role: editor` 头即可（既有用例同口径）。
- 未接入清单：`docs/governance/agent-briefs-2026-09-26/PHASE-12-<块>-GAPS.md`。
- 共享基础设施：`src/gods_workbench/core/storage.py`（**只读复用，不要改**）。
