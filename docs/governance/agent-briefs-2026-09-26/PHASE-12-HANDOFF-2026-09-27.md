# Phase 12｜后端接入进度与交接说明

- 日期：2026-09-27
- 仓库：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`
- 当前 HEAD：`c71c6980a120f548b93abb65fd86b7b0ace03daa`
- 结论状态：**实施与回归正在收口；不得标记 Phase 12 完成。**
- 范围：除画布域外，既有后端端点/能力真实接入；不以静态文案、空实现、随机数或演示数据冒充接入。

## 1. 当前进度摘要

### 已完成或已有代码证据

1. 已建立设计与执行计划：
   - `docs/governance/PHASE-12-BACKEND-INTEGRATION-DESIGN.md`
   - `docs/governance/PHASE-12-BACKEND-INTEGRATION-PLAN.md`
2. A1–A4 分工实施报告已落盘：素材库/本地素材、素材注册表、审查与流水线/提示词/分享、媒体/观测/Provider/AI；详情见 `docs/governance/agent-briefs-2026-09-26/PHASE-12-A*-REPORT.md`。
3. 前端真实数据修复已写入工作树：硬件与 GPU 遥测、任务队列、项目资产规模、AURA/聊天状态、Provider 时延等。HTML 静态占位仍可能在加载前短暂显示；失败状态应由真实请求结果驱动并保留降级标记。
4. 新增可执行 V2 运行时守卫：`tests/contracts/test_phase12_v2_runtime_degradation.py`，覆盖 API 请求、HTTP/网络失败、DOM 降级、GPU 推子和项目资产规模，并包含空函数/注释变异防回归。
5. 修复 `v2-shell.js` 顶栏重复注入的 GPU/VRAM 假“未接入”，以及项目卡 render 重建后资产规模未同步的问题。

### 2026-09-27 本轮可复现验证

基于上述 HEAD、执行时工作树（当时未提交，已有大量修改）：

| 验证 | 结果 |
|---|---|
| `python -m pytest tests -q --no-header -p no:cacheprovider` | **639 passed, 7 skipped**（86.20s） |
| `python -m pytest tests/contracts/test_phase9_frontend_degradation.py -q --no-header -p no:cacheprovider` | **74 passed** |
| `python -m pytest tests/contracts/test_phase12_v2_runtime_degradation.py -q --no-header -p no:cacheprovider` | **18 passed** |
| `node --check`（hardware-telemetry、v2-shell、projects/home/agents controllers） | 通过 |
| 西里尔字母/零宽字符扫描（静态目录与 Phase 12 运行时测试） | `HOMOGLYPH FILES 0` |
| `python tools/_probe_p12.py`（默认环境） | 241 操作中 10 个响应 `*_NOT_INTEGRATED`：静态分类为 canvas 4、config-gated 6、real 0 |
| 设置 `GW_CLI_EXECUTION=1` 后的探针观察 | 并行执行记录的 stdout 分别报剩 1 项和 6 项，但各轮完整响应未可靠留存/绑定，且存在 CLI 登录/登出副作用；**两组结果均视为不可复核，不作为缺口减少证据** |
| `python tools/audit_api_refs.py` | **未能复跑：当前工作树不存在该脚本**；报告里历史的 `TOTAL missing refs: 0` 不应作为本轮新验证结果 |

以上不等于真实浏览器全站验收、生产验收、外部 Provider/CLI 联通或独立审计。最近一次浏览器证据来自先前报告，本轮未重新完成 9 页浏览器复验。

## 2. 必须保留的真实缺口与口径风险

### 2.1 视频渲染/导出：当前未接入

- 当前路由 `src/gods_workbench/api/routes_canvas_closure.py` 对 `POST /api/video-tasks` 明确返回 `503 VIDEO_RENDERER_NOT_INTEGRATED`，不创建假任务；契约测试 `tests/contracts/test_phase10e_canvas_closure.py` 也固定了此行为。
- `tools/_probe_p12.py` 把该路径硬编码进 `CANVAS_EXCLUDED`，因此输出 `REAL_NOT_INTEGRATED 0` **不能证明“除画布外所有能力均已接入”**。
- 该路由归属 `canvas-closure` 契约，但 `src/gods_workbench/static/js/episode-pipeline.js` 的生产流程也会调用它。继续工作前应按用户范围裁定：若画布排除只指 `god-canvas` 拓扑/智能任务，则视频渲染必须纳入缺口并接入真实 renderer；若它也被正式定义为画布域排除，需在交接/报告写明，不得把它表述成已接入。

### 2.2 团队消息：没有消息收发 API

OpenAPI 当前包含团队/成员管理接口（`/api/asset-auth/teams*`），但未发现团队消息/消息历史/发送接口。团队管理存在不等于团队消息接入。若 collab 页面仍承诺消息功能，需要先冻结契约和存储/投递边界，再实现与验收。

### 2.3 Provider 吞吐：没有 tokens/s 指标契约

`src/gods_workbench/settings/probes.py` 有 Provider 连通性、模型发现及 `latency_ms`，源码未发现 `throughput` / `tokens_per_second` 指标。任务中心的响应字节统计也不能替代模型 tokens/s。不得用 Provider 延迟或响应体字节数冒充推理吞吐。

### 2.4 配置门禁不是“当前已连接”

无真实凭据/配置时，聊天与 CLI 端点 fail-closed 是正确行为，但仅证明存在配置驱动调用路径，不证明当前环境已成功连接上游。默认探针的 config-gated 数量还依赖本机环境和脚本内静态分类。

### 2.5 探针的覆盖/副作用限制

- `tools/_probe_p12.py` 虽遍历了 241 个 OpenAPI 操作，但 GET/DELETE 等路径参数没有替换，写请求统一发送 `{}`；它只按错误码中是否含 `NOT_INTEGRATED` 汇总。因此 `241` 是被枚举的操作数，不是 241 个业务流程通过或真实数据源验证。
- 审核时读取的共享临时 JSON 响应分布为 `200=72、400=83、403=5、404=68、503=13`。因无法可靠绑定运行轮次，该分布仅用于说明覆盖盲区，不作为默认或启用轮的独立验收证据。大量 400/404 表明需要合法请求夹具和真实实体 ID；例如 `/api/chat`、`/api/chat/agent` 空请求只证明输入校验，不证明真实上游调用成功。
- 脚本只跳过 `POST /api/asset-auth/logout`，没有排除即梦 login/logout。若 `GW_CLI_EXECUTION=1`，`core/cli_runtime.py` 存在实际 CLI 登录/登出调用路径；再次扫测前应隔离 CLI 用户目录/测试账号，或明确排除有副作用操作，并将每轮 JSON 输出存到唯一文件名，避免共享 `%TEMP%\\gw_probe_rows.json` 被并行覆盖。


## 3. 现有报告/探针需要交接人先校正

1. `PHASE-12-SUMMARY-REPORT.md` 仍有过期数字 `612 passed / 72 passed`；本轮现测为 `639 / 7 skipped`、Phase 9 守卫 `74`、Phase 12 runtime 守卫 `18`。
2. 总报告 §0 仍写“未派子代理、无独立审核”；§5 又记了先前审核意见，口径不一致。不要直接复制为最终报告。
3. 报告的“真实未接入数量 = 0”依赖 `tools/_probe_p12.py` 的静态白名单分类；其把 `/api/video-tasks` 归为 canvas exclusion，而该端点确实没有 renderer。必须先校正口径再下总量结论。
4. 设计/执行计划记载初始 OpenAPI 基数 239；当前探针扫描 241 个操作，需在最终报告里注明基线变化及比较口径。
5. `docs/governance/agent-briefs-2026-09-26/PHASE-12-REVIEW-REPORT.md` 仍保存第二轮“不通过”结论；第三轮简报 `PHASE-12-REVIEW-BRIEF-3.md` 已提出复核清单，但**当前未获得第三轮 PASS 报告**。不能声称独立审核通过。
6. `audit_api_refs.py` 不在当前 `tools/` 或仓库中；需恢复可复现脚本或以当前契约测试明确替代，并记录检验范围。

## 4. 工作树保护与基线

当前工作树有大量已修改文件及未跟踪文件，涉及 API、契约、前端、测试、报告和临时审查产物。不要运行 `git reset`、`git clean`、批量 checkout、stash、提交或推送；不要删除未跟踪文件。先由接手人检查 `git status --short`，仅操作明确归属本任务的文件。HEAD 是已有代码基线，测试输出应与 HEAD 和工作树状态同时记录，不能把未提交结果写成某个提交已通过。

## 5. 建议接手顺序

1. **范围核定**：明确“除画布”的边界，尤其 `/api/video-tasks` 是否属于排除项；在设计文档与探针分类中一致表达。
2. **重新计算缺口**：先设计可安全重复运行的探针，使用合法请求夹具、稳定测试实体及读回/持久化断言，并保存每轮完整响应；将静态分类改成依据端点契约、真实返回码、配置与依赖状态的可核验分类；分开统计“代码无实现”“配置缺失”“硬件/依赖缺失”“明确排除”，同时隔离或排除 CLI 登录/登出副作用端点，并让测试能阻止错误分类。
3. **实现剩余非画布能力**：若视频渲染不属于排除项，先冻结真实 renderer 的契约/依赖/任务持久化/轮询/失败与取消语义，再接真实执行器；对团队消息和 Provider tokens/s 先裁定是否属于既有产品范围，不得以改文案冒充完成。
4. **补足最终验证**：重跑专项、全量测试、探针（默认与配置启用）、API 引用检查、JS 语法/污染扫描及真实浏览器页面验证；逐项记录精确命令和结果。
5. **独立审核**：由 GPT-6-Astra high 只读核实修正后的报告、分类器、变异测试与运行证据；Required 清零并收到明确 PASS 后方可收口。
6. **更新总结报告**：统一数字、边界、缺口、审核轮次与证据日期；保留多实例一致性、真实上游配置、生产验收等限制，不扩大结论。

## 6. 团队分工记录

- A1：素材库 / 本地素材；A2：素材注册表；A3：审查 / 流水线 / 提示词 / 分享；A4：媒体 / 观测 / Provider / AI；主代理负责集成与质量门禁。详见设计文档和各 A1–A4 报告。
- 当前运行环境提供的 DeepSeek 代理选项是 `deepseek-v4.1-flash`（可用 high），没有可选 `deepseek-v4.1 max` 档位；最终审核模型仍按要求使用 GPT-6-Astra high。模型不匹配不构成质量通过证据。

**交接判定：已形成设计、分块实现和可复现的本地测试进度；“除画布外全量已接入”尚未被充分证明。尤其不能忽略视频任务分类错误、三类能力边界、过期总结数字以及第三轮独立审核缺失。**