# Phase 3 修正任务书（2026-09-20 第二轮）

> 本文件为**共享任务书**（主代理 /root 编写）。子代理只接收「读取本文件 + 完成指定小节 + 写自己的报告」的短指令。
> 仓库唯一根：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（分支 `master`，当前 HEAD `6a3389f`，工作树干净）。
> 全体代理遵守根 `AGENTS.md`：中文输出、KISS、二进制红线、破坏性操作先备份到 `%TEMP%`。
> 禁止 `git add` / `git commit` / `git push` / `git remote`（由主代理统一收口）。
> 禁止使用 orca 或任何非 Codex 工具；禁止再派生子代理。
> 只写自己名下的文件。
> 证据边界：本地实测 不等于 远端 CI 不等于 生产验收。未执行的命令一律写「未执行」，不得伪造数字。
> 草稿写入 `%TEMP%\gw-<task>-20260920\`，不得在仓库内留临时文件。
> 不要把 python 脚本命名为 `re.py` / `glob.py` 等 stdlib 同名文件（会污染导入）。

## 0. 已确认事实（主代理实测，可复验，不必重复推导）

- 当前 release 实测快照：`D:\Working\Code Pro\Gods-Workbench-release`，HEAD `006f3ddce51cd1c022c51f2b963f91380cee6072`；
  `main.py` = 732947 B / SHA-256 `c54f368a48cd0123a74733d3b0423eebabe7cf9f7e3af98522ff3ed0fee8e89a` /
  splitlines() 16460 / split("\n") 16461 / app.include_router 0 / @app.* 95。
- 洁净仓 `git status --porcelain -uall` 为空；HEAD == origin/master == 6a3389fc4bb9e539f2d889b1a77e4655d645c333。
- 本地门禁：`python -m pytest -q --no-header -p no:cacheprovider` 得到 40 passed（主代理实测）。
- 环境：Python 3.11.9（fastapi 0.140.0 / pydantic 2.12.5 / pytest 9.1.1）、Node v24.20.0、gh 2.96.0（已登录 qinxuedong，token 含 repo/workflow）。
- 全仓文本文件均为严格 UTF-8，无 U+FFFD、无西里尔/希腊同形字（主代理字节级实测；终端乱码只是渲染问题）。

## 1. 待修正的三类真实问题（来源：REVIEW-FINAL / REVIEW-1）

### P1-1 CAS 约束不一致
- 契约 `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`
  - L87 `restore_canvas` 的 `expected_version: "integer | optional"`
  - L111 `import_canvas_workflow` 的 `expected_version: "integer | optional"`
- 章程 `AGENTS.md` L47-L49：所有项目的编辑/归档/解归档/移入或恢复回收站，以及画布拓扑更新，必须携带 `expected_version`；不一致必须 409，禁止静默覆盖。
- 实现：
  - `src/gods_workbench/api/routes_god_canvas.py` L111 `payload: Optional[CasVersionRequest] = None`；L133 `expected_version: Optional[int] = Query(None, ...)`
  - `src/gods_workbench/god_canvas/service.py` L191 `restore_canvas(..., expected_version: Optional[int] = None)`；L225 `if expected_version is not None and top.version != expected_version:`（None 时跳过 CAS）
  - `import_workflow` L210/L225 同模式
- 结论：导入/恢复都会改变画布版本（拓扑/状态写入），按章程必须强制 `expected_version`；None 跳过 CAS 属静默覆盖反模式。

### P1-2 智能任务契约比章程宽
- 契约 L161-L176：`run_smart_canvas_task` 同时允许 200（state: completed）与 202，且 `poll_hint: "string | optional"`。
- 章程 `AGENTS.md` L54：202 Accepted：god-canvas 智能任务必须返回 202，并携带稳定 job_id 与 poll_hint。
- 实现：路由 L179 已是 `status.HTTP_202_ACCEPTED`（符合）；`src/gods_workbench/god_canvas/tasks.py` L40 docstring 仍写「支持 200 Completed 与 202 Accepted 契约」；L46 `poll_hint: Optional[str] = None`。
- 注意：`GET /api/jobs/{job_id}` 复用同一 `SmartCanvasTaskResponse`，终态（completed/failed/cancelled）合法地返回 poll_hint = null（service.py L432-L433）。因此模型层 poll_hint 允许 Optional 是对的；契约只应把 `run_smart_canvas_task` 的 202 响应里 poll_hint 标为必填，并删除 200 分支。

### P2 来源分类口径未闭环
- `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md` 的口径被 REVIEW-FINAL 判为「部分一致」：只认证 2 个自有切片，但卫生基线按「V2 整体保留」放行，且 comfyui/runninghub「不迁移」的删除闭包证据未统一。
- `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md` 已有逐文件四类登记（108 现存 / 35041179 B；分类 2+90+15+1），但两文件口径需互相对齐并显式说明删除闭包。

## 2. 任务与文件所有权（严格边界）

| 任务 | 负责人 | 独占可写文件 | 输出报告 |
|---|---|---|---|
| T-A1 P1 契约对齐 | 代理 A1 | 见 §3 | `docs/governance/agent-reports-2026-09-20/T-phase3-fix.md` |
| T-A2 来源分类统一 | 代理 A2 | 见 §4 | `docs/governance/agent-reports-2026-09-20/T-classification.md` |
| T-A3 文档漂移清点 | 代理 A3 | 见 §5 | `docs/governance/agent-reports-2026-09-20/T-docs-drift.md` |
| T-A4 远端/CI 取证 | 代理 A4 | 见 §6 | `docs/governance/agent-reports-2026-09-20/T-ci-remote.md` |
| T-B1 重签+快照审计 | 代理 B1（A1-A3 完成后） | 见 §7 | 追加进两份 attestations/reviews/* |
| T-B2 独立终审 | 代理 B2（全部完成后） | 见 §8 | `docs/governance/agent-reports-2026-09-20/REVIEW-PHASE3-FINAL.md` |
| 收口（台账/提交/推送/CI） | 主代理 | HANDOFF-3、TASK-NOTES 追加、提交推送 | - |

## 3. T-A1：P1 契约对齐（最高优先，唯一强阻塞项）

目标：让 `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`（契约）、`AGENTS.md` §3（章程）、`src/**`（实现）、`tests/**`（测试）四层对 CAS 与 202 语义完全一致。

必须完成的改动（方案已定，不要改设计）

1. `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`
   - L87：`expected_version: "integer | optional"` 改为 `expected_version: integer`（必填）。
   - L111：同上改为必填。
   - L161-L176：删除 `- 200` 与整个 `response_200:` 块；`response_202.poll_hint` 由 `"string | optional"` 改为 `string`。
   - 同步 `acceptance`：明确「受理必须 202 且携带稳定 job_id 与 poll_hint」。
   - `version: remediation-1` 改为 `remediation-2`；`review_status` 保持「待独立发布复核」语义（不要自称已批准冻结）。
   - 不要把 `run_smart_canvas_task` 的 `expected_version` 改成必填（该端点不构成拓扑更新）。
2. `src/gods_workbench/api/routes_god_canvas.py`
   - L109-L119 `restore_canvas`：body 改为必填（`payload: CasVersionRequest`），删除 `if payload else None` 兜底；保留 `require_edit_access`。
   - L133 `import_canvas_workflow`：`expected_version: int = Query(..., description=...)`（必填）。
3. `src/gods_workbench/god_canvas/service.py`
   - `restore_canvas(self, canvas_id: str, expected_version: int)`；去掉 `is not None` 短路，直接 `if top.version != expected_version: raise CanvasVersionConflictException(...)`。
   - `import_workflow(..., expected_version: int, ...)` 同规则。
   - 不要改 `submit_smart_task` 的 `expected_version` 可选语义。
4. `src/gods_workbench/god_canvas/tasks.py`
   - L40 docstring：删「支持 200 Completed 与 202 Accepted 契约」，改为「对齐 202 Accepted 契约；poll_hint 仅在非终态提供」。
   - `poll_hint` 保持 Optional（终态为 None），补注释说明终态清空。
5. `tests/`（契约测试必须与实现同步，这是对齐，不是放宽）
   - `tests/contracts/test_god_canvas_service.py` L119/L134：两处 `service.import_workflow(...)` 补 `expected_version=<当前版本>`（seed_golden_fixture=True 初始为 1）。
   - `tests/contracts/test_remediation_boundaries.py` L101 已带 `expected_version=1`，确认无需改。
   - 新增/加强断言（至少各 1 条）：
     - import 缺 `expected_version` 必须失败（HTTP 层 400 INVALID_REQUEST，或服务层 TypeError 明确断言）。
     - restore 版本不一致必须 409 CANVAS_VERSION_CONFLICT。
     - `run_smart_canvas_task` 响应只能是 202，且 202 响应体含非空 job_id 与 poll_hint。
   - 修改测试后不得降低既有 `test_golden_fixtures.py` / `test_cleanroom_hygiene.py` 的强度。
6. 前端调用方（同一 expected_version 语义）
   - `src/gods_workbench/static/js/canvas-list/api.js` L76 `restoreCanvas(id, init)` 改为 `restoreCanvas(id, payload, init)`，POST body 携带 `{expected_version}`。
   - `src/gods_workbench/static/js/canvas-list.js` L1945 `restoreCanvas(id)`：从列表项取版本（优先 c.version，回退 c.governance_version）传入；取不到时不要伪造，写注释说明。
   - `src/gods_workbench/static/v2/js/projects-controller.js` L1419 的 `/api/canvases/{id}/restore` POST：改为携带 expected_version（同上回退策略）。该仓后端当前没有 `/api/canvases/trash` 等端点，属前端先行；只要不新增不存在的 API，允许按最小改动补齐 body。
   - 修改后必须 `node --check` 通过。
7. 契约哈希同步（关键，漏了必挂测试）
   - 契约被改后，`docs/provenance/PHASE-2-INPUT-SHA256.txt` 中 `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml` 的 SHA-256 必须更新为新值（`Get-FileHash -Algorithm SHA256`），条目数仍为 16。
   - 运行 `python -m pytest tests/contracts/test_golden_fixtures.py::test_phase2_input_hashes_match_current_files -q` 必须 PASS。
8. 不要改 `AGENTS.md`（章程是权威，本次是让其他三层服从它）。

门禁（必须在报告中贴原始输出摘要）
- `python -m pytest -q --no-header -p no:cacheprovider`（要求全绿，用例数 大于等于 40）
- 对全部保留 .js 执行 `node --check`
- `python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q`（6 passed）

报告要点：逐文件 diff 摘要；契约新旧 SHA-256；四层一致性对照表；未执行项。

## 4. T-A2：来源分类口径统一（P2）

目标：把「①用户自有原创切片（2 个）」「②按契约/夹具重写（90）」「V2 整体保留」「comfyui/runninghub 不迁移」统一为一套可复算口径。

可写文件
- `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`（就地重写口径说明；历史结论保留，用追加/标注式）
- `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md`（对齐计数与口径）
- 报告 `docs/governance/agent-reports-2026-09-20/T-classification.md`

要求
1. 用 `git ls-files 'src/gods_workbench/static/**'` 与磁盘递归集合比对，给出：索引数 / 现存数 / 路径集合差异 / 字节总数；解释 `git ls-files`（113）与现存（108）的 5 个差异。
2. 逐文件四类归属（①用户自有原创切片 ②按契约/夹具重写 ③第三方（含许可） ④隔离/不迁移），给出汇总计数与每类判定依据（引用 `AGENTS.md` 或 `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`）。
3. 删除闭包证明：列出 comfyui/runninghub 被移除的全部文件与引用点，并给出「保留文件已无引用」的扫描命令与结果（`runninghub|comfy|\.rh-` 命中数应为 0）。
4. 明确口径声明：为什么「只认证 2 个切片」与「V2 整体保留」不矛盾——V2 属于②/①的逐文件登记范围，卫生基线按当前磁盘实际放行；任何未登记文件不得视为已认证。
5. 结论写明：来源分类统一 不等于 公开分发授权；洁净仓仍 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。

禁止：修改测试断言强度；修改 `AGENTS.md`。

## 5. T-A3：文档漂移清点（字体白名单口径）

目标：确认「3 个开源思源黑体放行」已在所有权威/治理文档一致，历史文档按「不改写 + 追加指针」处理。

可写文件（仅追加指针小节，或修正明显漂移）
- `CLEANROOM-CHARTER.md`、`CLEANROOM-STATUS.md`、`CLEANROOM-IMPLEMENTATION-HANDOFF.md`、`README.md`、`docs/design/README.md`
- `attestations/reviews/*.md`（只允许末尾追加指针小节）
- `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md`、`FILE-GOVERNANCE-2026-09-18.md`、`FILE-GOVERNANCE-REVIEW-2026-09-18.md`（历史台账，追加指针）
- 报告 `docs/governance/agent-reports-2026-09-20/T-docs-drift.md`

要求
1. 全仓扫描「不得提交任何字体 / 字体一律禁止 / 零二进制 / 无字体资源」等表述，逐文件给出：路径 / 行号 / 当前是否漂移 / 处置（无需改 / 已追加指针 / 仍待裁决）/ 证据。
2. 核对 `AGENTS.md` §1.2 三条精确路径白名单与 `tests/hygiene/test_cleanroom_hygiene.py` 的 `ALLOWED_BINARY_ALLOWLIST` 完全一致（逐条比对字符串）。
3. 核对 `AGENTS.md` §4.2 第 2 条是否已含「（`AGENTS.md` §1.2 三条思源黑体白名单路径除外）」例外语句；已存在则记录，不重复改写。
4. 二进制红线实测：全仓（跳过 .git）仅 3 个白名单 .otf，无其它图片/音视频/字体。
5. 结论写明：「开源字体放行」不等于「公开分发授权」；洁净仓仍 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。

门禁：`python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q` 必须 PASS。

## 6. T-A4：远端 / CI 取证（只读 + 报告）

目标：如实记录远端 CI 现状与可执行取证步骤，不得声称 CI 已通过。

可写文件
- 报告 `docs/governance/agent-reports-2026-09-20/T-ci-remote.md`
- （如需）`docs/governance/REMOTE-AND-CI-PLAN-2026-09-20.md` 追加现状小节

要求
1. `gh run list --limit 5`、`gh run view <id>`、`gh run view <id> --log-failed`：取证最近 run 结论（历史 run 35508682089 / 35508749903 为任务未启动：steps: [] + 计费注解）。
2. `git remote -v`、`git rev-parse HEAD`、`git rev-parse origin/master`、`git status --porcelain -uall`：确认 remote 已配置与本地/远端同步状态（以当前输出为准）。
3. 给出「重跑 CI」的准确命令与前置条件（计费/额度恢复），并明确：未执行重跑（本任务默认只做只读取证，不触发新 run）。
4. 明确证据边界：历史 CI 失败 不等于 代码失败；本地绿 不等于 远端绿 不等于 生产验收。
5. 禁止 `gh workflow run` / `git push`（由主代理在收口阶段决定）。

## 7. T-B1：Phase 3 重签 + 当前快照审计（依赖 A1-A3）

触发条件：A1 已完成并全绿；A2/A3 已产出报告并落盘。若 A1 未完成，不要开始本任务。

可写文件
- `attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md`（追加新章节 `## 修正后重签（R2）`，不改写原文；原文的 GATE REOPENED 保留）
- `attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md`（追加 `## 当前快照审计（R2）`）
- 报告 `docs/governance/agent-reports-2026-09-20/T-phase3-refreeze.md`

要求
1. 独立复核 A1 的四层一致性：契约 YAML 全文对照 `AGENTS.md` §3 与 `src/**` 实现行号，给出「一致/不一致」判定。
2. 复跑全量 pytest + 全部保留 .js `node --check` + 二进制红线扫描，贴原始输出。
3. 快照审计：洁净仓 HEAD / 工作树状态 / 静态层计数与字节 / 契约 SHA-256 与 `PHASE-2-INPUT-SHA256.txt` 一致性。
4. 判定：明确写「Phase 3 契约是否可冻结」与「是否可宣称交付/发布就绪」。若仍有 P1，必须写 `GATE REOPENED` 并列出文件:行号。
5. 证据边界声明：push/远端 CI/生产验收是否执行。

## 8. T-B2：独立终审（对抗式，最终门）

触发条件：A1-A4 与 B1 全部完成。不得信任任何被审代理的自述，必须回到仓库文件与命令输出取证。

可写文件
- 报告 `docs/governance/agent-reports-2026-09-20/REVIEW-PHASE3-FINAL.md`

必须覆盖
1. 用户四项裁决逐条闭环：①字体放行 + 文档漂移修复；②V2 整体保留 + 画布/工具仅入口首页 + comfyui/runninghub 不迁移；③P3 标签更新；④HANDOFF 完成 + HANDOFF-2。
2. 用户追加三项：Phase 3 契约冻结重签 / 当前快照独立审计 / 来源分类口径统一。
3. 门禁复跑：全量 pytest；全部保留 .js `node --check`；二进制红线；`runninghub|comfy|\.rh-` 残留 = 0。
4. `git status --porcelain -uall` 与改动清单一致；`git diff --stat` 与改动一致。
5. 证伪式抽查 大于等于 3 处「声称已完成」的点，用命令尝试推翻；推不翻才记 PASS。
6. 明确区分：本地实测 / 远端 CI / 生产验收。
7. 最终判定：可提交 / 不可提交；是否可宣称交付。

## 9. 收口（主代理执行，禁止子代理）

1. 汇总 A1-A4 + B1 + B2 报告，核对 `git status --porcelain -uall` 与 `git diff --stat`。
2. 追加 `docs/governance/TASK-NOTES-2026-09-18.md`（只追加新小节，不改历史）。
3. 新增 `HANDOFF-3.md`（记录本轮真实结论与未闭环项）。
4. 逐文件 `git add`（严禁 -A），中文提交信息，`git push`。
5. 重跑远端 CI（`gh workflow run CI`）；若仍被计费拦截，如实记录「任务未启动」。
6. 生产验收另行拍板，不得由本地文档假定完成。
