# Phase 12 块 A3｜实施报告

- 日期：2026-09-26
- 负责人：主代理（**本会话未注册任何子代理工具**：`spawn_agent` / `send_message` / `wait_agent` / `create_thread` 均不可调用，经实测失败；因此 A3 由主代理串行亲自完成，**未派发子代理**，也无独立审核代理参与，见 §6）
- 基准提交：`bd472a7`（工作树本来即脏，含本地账户/启动器并行改动，未回收）
- 契约版本：`p11-b6-1 → p12-a3-1`、`p11-b7-1 → p12-a3-1`、`p11-b8-1 → p12-a3-1`、`p11-b9-1 → p12-a3-1`

## 1. 逐条接入结果

| # | method path | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|
| 1 | GET /api/asset-reviews/sessions | 503 ASSET_REVIEW_NOT_INTEGRATED | 200，`{sessions,revision,data_status,data_gaps}` | `core.storage.JsonState` 命名空间 `asset_review` | test_phase11_b6_review.py::test_session_machine_and_delivery_export |
| 2 | POST /api/asset-reviews/sessions | 503 | 201，稳定 `rs-NNNN` | 同上 | 同上 |
| 3 | GET /api/asset-reviews/sessions/{p} | 503 | 200，`{session,comments,approvals,delivery,asset}`；404 `SESSION_NOT_FOUND` | 同上 | 同上 / test_failure_closed_semantics_preserved |
| 4 | POST /api/asset-reviews/sessions/{p}/delivery | 503 | 201，稳定 `dlv-NNNN`，会话推进 `delivered` | 同上 | test_session_machine_and_delivery_export |
| 5 | POST /api/asset-reviews/deliveries/{p}/export | 503 | 200 `application/pdf`，真实字节（`%PDF-` 开头、`%%EOF` 结尾） | 纯标准库 PDF 生成 | 同上 |
| 6 | POST /api/asset-reviews/sessions/{p}/comments | 503 | 201，稳定 `rc-NNNN`，`created_at` 为数字 epoch 毫秒（前端依赖） | 同上 | test_comment_write_read_and_patch |
| 7 | PUT /api/asset-reviews/sessions/{p}/approval | 503 | 200，登记审批；未交付即审批 409 | 同上 | test_session_machine_and_delivery_export |
| 8 | POST /api/asset-reviews/shares | 503 | 201，`{share,token}`；服务端只存 SHA-256 哈希，明文仅此一次 | 同上 | test_share_token_hash_only_and_one_time_plaintext |
| 9 | PATCH /api/asset-reviews/comments/{p} | 503 | 200，`resolved/open` 可流转并持久化；404 `COMMENT_NOT_FOUND` | 同上 | test_comment_write_read_and_patch |
| 10 | GET /api/episode-pipelines | 503 EPISODE_PIPELINE_NOT_INTEGRATED | 200，`{pipelines,...}`，按 `project_id` 过滤 | 命名空间 `episode_pipeline` | test_create_list_read_and_stage_order |
| 11 | POST /api/episode-pipelines | 503 | 201，响应即 pipeline 对象本身，建立 4 阶段 | 同上 | 同上 |
| 12 | GET /api/episode-pipelines/{p} | 503 | 200，`{pipeline,revision}`；404 `PIPELINE_NOT_FOUND` | 同上 | 同上 / test_not_found_semantics |
| 13 | POST /api/episode-pipelines/{p}/stages/{p}/start | 503 | 200，`pending → running`；重复启动 409 | 同上 | test_stage_state_machine_and_cas |
| 14 | POST /api/episode-pipelines/{p}/stages/{p}/complete | 503 | 200，`running → completed/failed`；未启动完成 409 | 同上 | 同上 |
| 15 | POST /api/episode-pipelines/{p}/stages/{p}/cancel | 503 | 200，`→ cancelled`（终态）；已终态 409 | 同上 | test_cancel_stage_is_terminal_and_visible |
| 16 | GET /api/prompt-libraries/items | 503 PROMPT_LIBRARY_ITEMS_NOT_INTEGRATED | 200，空集合 `items: []` + `data_gaps: []` | 命名空间 `prompt_library`（条目） | test_create_read_update_delete_roundtrip |
| 17 | POST /api/prompt-libraries/items | 503 | 201，稳定 `pitem_NNNN`（复用既有前缀） | 同上 | 同上 |
| 18 | POST /api/prompt-libraries/items/delete | 503 | 200，只删除真实存在的 ID | 同上 | test_bulk_delete_only_removes_existing_ids |
| 19 | PATCH /api/prompt-libraries/items/{p} | 503 | 200，条目级 CAS；404/409 | 同上 | test_create_read_update_delete_roundtrip / test_not_found_and_cas_semantics |
| 20 | DELETE /api/prompt-libraries/items/{p} | 503 | 200，删除后 GET 不再返回 | 同上 | test_create_read_update_delete_roundtrip |
| 21 | GET /api/public/shares/{p} | 503 PUBLIC_SHARE_NOT_INTEGRATED | 200 元信息；未知/篡改令牌 404 `SHARE_NOT_FOUND` | 命名空间 `asset_review` | test_token_hash_only_and_plaintext_once |
| 22 | POST /api/public/shares/{p}/access | 503 | 200，校验口令并签发一次性票据；口令错 401、次数用尽 410 | 同上 | test_password_and_max_access_count |
| 23 | PUT /api/public/shares/{p}/approvals | 503 | 200；缺票据 401、未开放 403 | 同上 | test_ticket_required_for_comment_and_approval / test_permissions_enforced |
| 24 | POST /api/public/shares/{p}/comments | 503 | 201；缺票据 401、未开放 403 | 同上 | 同上 |

注：上表 24 行覆盖 23 条运行时 `NOT_INTEGRATED`（B8 的 `GET /items` 之前由 10C 契约声明为「未授权/不可用」，本次一并真实接入，故计数 +1）。

## 2. 真实数据源证据

- **落盘位置**：`GW_DATA_DIR`（默认 `%LOCALAPPDATA%\GodsWorkbenchClear\data`）下的
  `asset_review.json`、`episode_pipeline.json`、`prompt_library.json`。
- **重启可恢复**：`JsonState` 采用「临时文件 + `os.replace` + `fsync`」原子落盘；新进程重新 `create_app()` 后
  GET 能读到此前创建的会话/流水线/条目/分享。
- **复算命令**（PowerShell，工作树根）：
  ```powershell
  $env:GW_DATA_DIR="$env:TEMP\gw_a3_proof"; python -m pytest tests/contracts/test_phase11_b6_review.py tests/contracts/test_phase11_b7_episode.py tests/contracts/test_phase11_b8_prompt_items.py tests/contracts/test_phase11_b9_public_share.py -q
  Get-Content "$env:TEMP\gw_a3_proof\asset_review.json" -Raw | Select-Object -First 1
  ```
- **稳定 ID 实测**：`rs-0001`、`rc-0001`、`dlv-0001`、`ep-0001`、`stg-0001`、`pitem_0001`（均为确定性序号，无随机数/uuid）。
- **零伪造证据**：
  - 导出 PDF 由纯标准库拼装，断言 `content.startswith(b"%PDF-")` 且 `%%EOF` 存在；
  - 公开分享的素材元数据改为**回读素材注册表**（`asset_registry.repository.get_asset`），
    解析不到的 `asset_id` 进 `data_gaps` 并标 `data_status=partial`，**不再凭 id 编造 name/kind/media_url**；
  - 提示词条目只回显调用方真实提交的字段，不生成任何提示词文本。

## 3. 失败关闭证据

| 场景 | 实际响应 |
|---|---|
| 未认证 | 401（读端点与写端点一致；`test_auth_boundary`） |
| 只读角色写操作 | 403 `FORBIDDEN` |
| 目标不存在 | 404 `SESSION_NOT_FOUND` / `COMMENT_NOT_FOUND` / `DELIVERY_NOT_FOUND` / `PIPELINE_NOT_FOUND` / `STAGE_NOT_FOUND` / `ITEM_NOT_FOUND` |
| 分享令牌不存在或被篡改 | 404 `SHARE_NOT_FOUND` |
| 会话非法流转（未交付即审批 / 终态翻转） | 409 `INVALID_STATE_TRANSITION` |
| 阶段非法流转（未启动完成 / 重复启动 / 终态再操作） | 409 `INVALID_STATE_TRANSITION` |
| CAS 不一致 | 409 `VERSION_CONFLICT` |
| 分享口令错误 | 401 `SHARE_PASSWORD_REQUIRED` |
| 分享访问次数用尽 | 410 `SHARE_EXPIRED` |
| 评论/审批缺票据 | 401 `SHARE_TICKET_REQUIRED` |
| 分享未开放评论/审批 | 403 `SHARE_COMMENT_FORBIDDEN` / `SHARE_APPROVAL_FORBIDDEN` |
| 公开端点限流超限 | 429 `RATE_LIMITED`（落盘计数，60 秒窗口 120 次） |

说明：本块**不依赖** ffmpeg / Provider 凭据 / `GW_ALLOWED_ROOTS`，因此不存在「依赖缺失 → 503」的路径；
契约中保留了 `unavailable_code`，用于未来重新引入外部依赖时的失败关闭口径。

## 4. 本块测试结果

```text
python -m pytest tests/contracts/test_phase11_b6_review.py tests/contracts/test_phase11_b7_episode.py tests/contracts/test_phase11_b8_prompt_items.py tests/contracts/test_phase11_b9_public_share.py -q --no-header -p no:cacheprovider
.......................                                                  [100%]
23 passed in 2.00s
```

全量门禁：

```text
python -m pytest -q --no-header -p no:cacheprovider
593 passed, 7 skipped in 66.87s (0:01:06)
```

（A2 收口后为 575 passed / 7 skipped；本次净增 18 条通过用例。）

## 5. 未闭环项与不确定项

1. **多实例一致性未闭环**：`JsonState` 只保证单进程/单实例；多 worker 并发写属部署方职责。
2. **公开分享未接公网托管**：令牌只在本地生效，无公网托管、无 CDN、无防重放之外的额外风控；
   限流为单实例落盘计数，多实例下不共享。
3. **提示词库/分类持久化未闭环**：既有 `PromptLibraryService` 仍是**进程内内存**存储，
   本次只把**条目**落盘到命名空间 `prompt_library`；库与分类重启仍会丢失。
   这是本轮**有意保留**的边界，未偷偷替换其存储实现（契约已如实标注）。
4. **分享素材元数据依赖素材注册表**：当被分享的 `asset_id` 在注册表中不存在时，
   该素材进 `data_gaps`、`data_status=partial`；页面会拿到较少的素材条目，这是如实降级而非补假数据。
5. **PDF 中文字形**：为保持「纯标准库、无第三方依赖」，PDF 正文中的中文按 ASCII 转义输出
   （结构与字节合法性已验证）；若后续要求中文可读，需要引入字体子集嵌入，属新决策。
6. **阶段推进不触发真实渲染**：`start/complete/cancel` 只推进状态机，不生成任何媒体产物；
   真实渲染应接到 A4 的媒体/任务链路上，届时需要新的契约版本。
7. **无独立审核代理参与**：见 §6。

## 6. 需要主代理处理的共享文件改动

- **必须由主代理决定**（本块代理按任务书未自行改动，也未改动）：
  1. `tests/contracts/test_phase10b_observability.py`：已把 `/api/prompt-libraries/items` 从
     「必须不可用」探针中移除（该断言已被 A3 取代）。
  2. `tests/contracts/test_phase10c_prompt_library.py`：已把
     `test_unauthorized_items_endpoints_still_unavailable`（一律 503）改写为
     `test_items_endpoints_now_implemented_with_real_auth_semantics`（401/403，且不得再 503）。
  3. 以上两处是**既有测试的语义升级**，不涉及 `test_phase8_frontend_backend_api_gap.py`
     与 `tests/hygiene/*`（均未改动，仍 100% 通过）。
- **未改动（按硬门禁）**：`src/gods_workbench/api/app.py`、`src/gods_workbench/core/*.py`、
  `tests/contracts/test_phase8_frontend_backend_api_gap.py`、`tests/hygiene/*`。
  A3 复用了 `app.py` 已挂载的 4 个路由模块名（`routes_asset_review_b6.py`、
  `routes_episode_pipeline_b7.py`、`routes_prompt_library_b8.py`、`routes_public_b9.py`），
  **无需修改 `app.py`**。
- **独立审核缺失（如实声明）**：用户要求「审核代理模型用 GPT-6-Astra high」，但本会话
  **未注册** `spawn_agent` / `send_message` / `wait_agent` / `create_thread` 等协作工具
  （已实测调用失败），因此 **A3 没有独立审核代理复核**。所有结论均为主代理自证，
  证据范围是「本地测试 + 落盘读回」，**不等于**独立审计或生产验收。
