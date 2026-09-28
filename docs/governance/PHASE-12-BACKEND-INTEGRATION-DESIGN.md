> **2026-09-27 范围授权更新**：用户已明确将视频渲染/导出、团队消息、Provider tokens/s 全部纳入本轮新增实现。本文下方“待裁定”和按文件名将全部视频路由排除的历史口径不再有效；其余画布排除不变。新增实施与权限、持久化、计量验收约束见 `agent-briefs-2026-09-26/PHASE-12-THREE-CAPABILITIES-DESIGN-2026-09-27.md` 和对应契约。公开发布/生产验收未授权。

> **2026-09-27 验证口径勘误（不改变授权范围）**：下文 239 / 136 / 132 是历史空请求探针统计，不是业务流程验收结果；当前工作树 OpenAPI 枚举为 241，必须与各轮覆盖、合法夹具、读回结果分别报告。尤其 `/api/video-tasks` 虽归入画布闭环文件，仍被生产流程调用且 renderer 真实缺失，不能只靠模块归属将其排除后声称“其他能力全部接入”。视频渲染、团队消息、Provider tokens/s 的新增产品范围待用户裁定，现有冻结契约不擅改。当前验证记录见 `agent-briefs-2026-09-26/PHASE-12-ROLLING-VERIFICATION-2026-09-27.md`；本轮子代理尽量串行、最多 2 个，实施 GPT-6-luna max，审核 GPT-6-Astra high。
# Phase 12｜真实后端接入总体设计（主代理）

- 记录日期：2026-09-26
- 基线：工作树 `HEAD = bd472a7`（存在未提交的本地账户/启动器改动，属并行工作，不回收）。
- 发布状态：**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。本设计不等于生产验收。

## 1. 权威缺口基线（运行时探测，非静态推断）

用 `TestClient` + 本地账户管理员会话，对 OpenAPI 全部 239 个 `/api` 操作逐一发请求（空 JSON），
以响应中的 `code == *_NOT_INTEGRATED` 判定「未接入」：

| 域 | 未接入操作数 |
|---|---|
| 素材注册表 `asset-registry` | 45 |
| 素材库 + 本地素材 `asset-library / asset-content / local-assets / storage-files` | 40 |
| 媒体与缩略图 `asset-thumbnails / asset-proxy / media-* / audio / online-image` | 14 |
| 素材审查 `asset-reviews` | 9 |
| 剧集流水线 `episode-pipelines` | 6 |
| 提示词库条目 `prompt-libraries/items` | 4 |
| 公开分享 `public/shares` | 4 |
| Provider 探测 `providers/*` | 3 |
| AI 对话/上传/CLI 帮助 `ai / chat / jimeng / codex / gemini-cli` | 7 |
| 画布闭环（**本轮排除**） | 4 |
| 合计（含画布） | 136 |
| **本轮范围（排除画布）** | **132** |

另有观测 4 条（`series / health / sources / asset-volumes`）当前返回 `200 + data_status=degraded`，
原因是宿主机遥测与指标序列未接入；本轮一并接入为真实数据。

## 2. 共享基础设施（主代理提供，子代理只读复用）

新增 `src/gods_workbench/core/storage.py`：

- `data_root()`：单实例数据根目录，`GW_DATA_DIR` 可覆盖（必须绝对路径）。
- `JsonState`：命名空间 JSON 状态容器，读改写全程持锁、原子替换落盘、重启可恢复。
- `resolve_within_roots()`：本机文件访问必须锚定 `GW_ALLOWED_ROOTS`（绝对路径列表）；
  未配置即禁止一切本机文件访问；解析后越界返回 `403 PATH_OUTSIDE_ALLOWED_ROOTS`。
- `relative_display()`：对外只暴露相对允许根的展示串，绝不回显调用方原始绝对路径。
- `next_sequence()`：确定性序号 ID，禁止随机数/uuid。

**证据边界**：JSON 落盘只保证单实例一致性；多 worker / 多实例并发属部署方职责，文档必须如实标注。

## 3. 各块真实数据源与负责人

| 块 | 负责人 | 路由文件（独占） | 契约（独占） | 真实数据源 |
|---|---|---|---|---|
| A1 素材库 + 本地素材 | 素材库代理 | `routes_asset_library_b4.py`、`routes_local_assets.py` | `ASSET-LIBRARY-B4-*`、`LOCAL-ASSET-*` | 落盘 JSON 库 + `GW_ALLOWED_ROOTS` 内真实文件 + PIL 元数据 |
| A2 素材注册表 | 注册表代理 | `routes_asset_registry.py` | `ASSET-REGISTRY-*` | 落盘 JSON 注册表（资产/关系/标签/版本/预设/目录模板/治理） |
| A3 审查·流水线·提示词·分享 | 协作域代理 | `routes_asset_review.py`、`routes_episode_pipeline_b7.py`、`routes_prompt_library_b8.py`、`routes_public_b9.py` | 对应 4 份 catalog | 落盘 JSON 会话/流水线/条目/分享令牌（分享为本地令牌，不是公网托管） |
| A4 媒体·观测·Provider·AI | 媒体与外部代理 | `routes_media.py`、`routes_observability.py`、`routes_settings.py`、`routes_ai.py` | `MEDIA-*`、`OBSERVABILITY-*`、`SETTINGS-*`、`PLATFORM/AI` | ffmpeg/ffprobe + PIL 真实缩略图/波形/转码；psutil 真实遥测；Provider 真实 HTTP 探测（无凭据 fail-closed） |

## 4. 硬门禁（每块相同，审核代理逐条核）

1. **契约先行**：先改契约（version 号 +1，写死状态码/错误码/ID 口径/fail-closed 条件），再动实现。
2. **零伪造**：任何无法证明的分支必须显式 `data_status=not_integrated` + `503` 或空集合 + `data_gaps`；
   禁止随机数、常量曲线、演示数据、假 job_id、假 URL。
3. **路径安全**：所有本机文件读写必须经 `resolve_within_roots()`；未配置根目录即拒绝；不得回显原始绝对路径。
4. **失败关闭**：外部依赖（ffmpeg / Provider / 凭据 / 允许根目录）缺失或异常返回 `503`，不得静默假成功。
5. **真实副作用可核验**：写入必须可通过紧随其后的读接口观察到；删除必须使读接口不再返回该对象。
6. **测试更新**：本块原有的 `*_NOT_INTEGRATED` 断言必须改为断言**新真实语义**；
   同时保留 `401`（未认证）、`403`（只读降级）、`503`（依赖缺失）用例。
7. **禁止改动**：`src/gods_workbench/api/app.py`、`src/gods_workbench/core/*`（除本块新子模块）、
   `tests/contracts/test_phase8_frontend_backend_api_gap.py`、`tests/hygiene/*` 由主代理统一维护。
8. **中文**：代码注释、文档、提交信息一律中文。
9. **不得 git commit/push**：子代理只改工作树文件，由主代理统一评审与提交。

## 5. 执行顺序

1. Wave 0（已完成）：权威缺口探测、共享基础设施、本设计、4 份任务书。
2. Wave 1：A1–A4 并行实施（≤4 并发），各自完成「契约 → 实现 → 本块测试 → 自检报告」。
3. Wave 2：主代理集成，跑全量 `pytest -v`，修跨块回归，同步 Phase 8 守卫基线。
4. Wave 3：审核代理（`gpt-6-astra` high）逐块独立核实。
5. Wave 4：主代理按审核意见修正，出 Phase 12 总报告，登记仍未闭环项。