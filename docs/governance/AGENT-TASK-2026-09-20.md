# Agent 任务书（2026-09-20）

> 本文件为**共享任务书**。子代理只接收「读取本文件并完成 T-xxx」的极短指令，长内容一律以本文件为唯一真源。
> 仓库根：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（分支 `master`）。
> 全体代理必须遵守根 `AGENTS.md`（中文输出、KISS、二进制红线、破坏性操作先备份）。
> **禁止** `git add` / `git commit` / `git push` / `git remote`（由主代理统一收口）。
> **禁止**使用 orca 或非 Codex 工具；**禁止**再派生子代理。
> 各任务输出文件互不重叠，**只写自己的输出文件**，不得改动他人文件。

## 交付边界总则

- 证据边界必须诚实：本地实测 ≠ 远端 CI ≠ 生产验收。未执行的命令写「未执行」。
- 不得伪造数字、不得声称已验证未验证项、不得声明「可发布」。
- 写入一律 UTF-8 无 BOM，中文标点正常，不得出现 U+FFFD 替换符。

---

## T-fonts（字体白名单文档漂移修复）

状态：**已由主代理完成**，输出见 `docs/governance/agent-reports-2026-09-20/T-fonts.md`（如缺失，子代理补写）。

---

## T-scope（迁移范围口径统一 + comfyui/runninghub 不迁移）

**用户 2026-09-20 裁决**
- V2 前端**整体保留**（`src/gods_workbench/static/v2/**`）。
- 画布/工具**只保留「入口首页」内容**；快捷工具入口及其内部内容**不迁移**。
- **comfyui / runninghub 不迁移**。

**已完成（主代理，勿重复）**
- 已删除：`static/comfyui-settings.html`、`static/css/comfyui-settings.css`、`static/js/comfyui-settings.js`、`static/js/i18n/comfyui-settings.js`、`static/runninghub/`（整目录）。
- 已剪除：`v2/index.html`、`v2/settings.html`（comfyui 导航项/分区/iframe）、`js/hardware-telemetry.js`（comfyui 卡片与快捷配置）、`js/i18n.js`（comfyui-settings 词条）。
- 备份：`%TEMP%\gw-scope-purge-20260920\`。

**待完成（你的工作）**
1. `src/gods_workbench/static/api-settings.html`：移除 RunningHub 专属块（`runninghub-hint`、`#runninghubConfigBlock`、`rhPasteInput`、`rhWorkflowEditorOverlay`、`<option value="runninghub">` 等），保留其它平台。
2. `src/gods_workbench/static/js/api-settings.js`：移除 RunningHub 专属函数与分支（约 60 个 `rh*`/`RunningHub*` 函数、`ONBOARDING_GUIDES.runninghub`、`RECOMMENDED_APIS` 的 runninghub 项、`API_PROTOCOLS` 中的 `runninghub`、`FIXED_PROTOCOL_PROVIDER_IDS` 的 `runninghub`），并改写混合函数中的 RH 分支。
3. `src/gods_workbench/static/js/i18n/api-settings.js`、`i18n/canvas.js`、`i18n/smart-canvas.js`、`i18n/studio.js`、`i18n/common.js`：移除 RH/ComfyUI 词条。
4. `src/gods_workbench/static/css/api-settings.css`、`css/obsidian-gold-settings.css`、`css/signal-flow.css`：移除 RunningHub/ComfyUI 专属规则（若是与工具无关的通用设计 token，保留并逐条说明理由）。
5. `src/gods_workbench/static/v2/agents.html`、`v2/production.html`、`js/episode-pipeline.js`、`js/task-center.js`：剪除 comfyui/runninghub 文案与调用。
6. **重定义卫生用例基线**：更新 `tests/hygiene/test_cleanroom_hygiene.py`，使 comfyui/runninghub 不再被放行；新增断言「已删文件不得重现、保留页面不得引用已删路径」；保持原有 6 用例全绿、不得放宽既有断言。
7. **统一来源分类口径**：重写 `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`，明确四类归属：
   - ①用户自有原创切片（2 个日期选择器，源/目标 SHA-256 登记）
   - ②按契约/夹具自行重写
   - ③第三方（`vendor/`、`prompt-registry`，注明许可）
   - ④隔离/不迁移（无限画布/智能画布旧实现、连接器、comfyui、runninghub 等）
   并新建 `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md`：对 `src/gods_workbench/static/**` **逐文件**清点（相对路径 + 大小 + 归属四类之一 + 一句话依据 + 汇总计数）。
8. **台账**：在 `docs/governance/TASK-NOTES-2026-09-18.md` 末尾**追加** `## 12. 2026-09-20 范围口径统一与 comfyui/runninghub 移除`（不得改写历史章节）。

**门禁**
- `python -m pytest -q --no-header -p no:cacheprovider` 必须全绿。
- `node --check` 覆盖所有保留的 `.js`（含 i18n），0 失败。
- 自证无坏链、无残留引用（不得出现 `/static/runninghub/`、`comfyui-settings.html`）。

**输出文件**：`docs/governance/agent-reports-2026-09-20/T-scope.md`

---

## T-compliance（许可/第三方合规 + 外部 IdP 方案 + 部署验收方案）

创建 3 个新文件（不得改其它文件）：

1. `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`
   - 组件清单表：组件 / 版本或标识 / 来源 / 许可证 / 分发义务 / 本地哈希或路径 / 结论（闭环 or 未闭环）/ 未闭环原因
   - 覆盖：3 个 Source Han Sans CN `.otf`（OFL-1.1）、`vendor/js/{lucide.js,three-0.160.0.module.js}`、Tailwind CDN / Lucide CDN、`prompt-registry` 各 JSON、Python 运行期依赖（按 `src/**` 真实 import）
   - 明确「洁净仓当前 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION」，不得据此声明许可通过
2. `docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md`
   - 现状：`src/gods_workbench/core/auth.py` 的本地 Bearer + `X-User-Role`（引用真实行号）
   - 目标：OIDC 授权码 + PKCE、JWT 校验、JWKS 轮换、组→`editor`/`governor`/`admin` 映射、匿名只读降级
   - 保留契约：401/403/409/202、`{"detail":{"code","message"}}` 不得变
   - 迁移步骤、回滚、验收清单；明确「本文档只是方案，未实现」
3. `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`
   - 当前形态 `python run.py`、端口 2077、健康检查；验收清单含可复制命令与期望输出
   - 区分「本地可验收」与「需远端/生产环境验收」；列出尚缺的生产要件

**输出文件**：`docs/governance/agent-reports-2026-09-20/T-compliance.md`

---

## T-phase3（Phase 3 契约冻结重签 + 当前快照独立审计）

1. 实测：`python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q`；自写脚本重算 `docs/provenance/PHASE-2-INPUT-SHA256.txt` 的 16 项 SHA-256；`git rev-parse HEAD`；`git ls-files` 计数；读 `src/gods_workbench/api/*.py` 列出方法与路径。
2. 新建 `attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md`：逐项检查（契约/夹具/输入哈希/边界/错误语义/插件协议排除），每项给命令 + 输出摘要 + 结论；签署人写清为「自动化 Codex 子代理会话身份」，要求后续人工外审；明确「机器自证 ≠ 独立第三方审计」；绑定确切 HEAD SHA。
3. 新建 `attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md`：快照基线（HEAD/分支/工作树状态/文件计数）、测试实测、二进制扫描、静态层与契约一致性观察；证据边界（本地 ≠ 远端 CI ≠ 生产）；未覆盖项。
4. 对 `attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md` 与 `PHASE-3-GATE-CHECK-2026-09-17.md` 只在末尾追加 `## 后续状态更新（2026-09-20）` 指针小节，**不得改写原文**。

**注意**：主代理此刻存在未提交改动（comfyui/runninghub 移除中）。快照数字请注明时点，并记录当时存在未跟踪/未提交改动。

**输出文件**：`docs/governance/agent-reports-2026-09-20/T-phase3.md`

---

## T-handoff（HANDOFF 收口 + HANDOFF-2 + P3 标签）

1. 在 `D:\Working\Code Pro\Gods-Workbench-release` 实测：`git rev-parse HEAD`、`git log --oneline -1`、`git rev-list --count origin/main..HEAD`、`main.py` 字节数/SHA-256/`splitlines()` 行数/`split("\n")` 行数/`app.include_router` 次数/`@app.*` 路由数。
2. 修订 `HANDOFF.md`：修正 §1 的 `main.py` 时效标签（HEAD/字节/SHA-256/行数，标注「2026-09-20 实测快照」）；顶部状态区加「**状态：已完成（本地）**」并保留诚实边界；对齐字体口径；末尾追加 `## 8. 2026-09-20 收口说明`。
3. 新建 `HANDOFF-2.md`：本轮四项裁决、洁净仓治理线（T12/T13/comfyui-runninghub 移除/静态层范围登记）、release 拆分行（Phase A–G、E8–E10/F/G、CAS 晚绑定 `40ab81cb`、端口 2077 `8b85d4c5`+`006f3ddc`）、待闭环（Phase 3 重签、许可合规、外部 IdP、部署验收、push/CI/生产验收）、关键命令与证据边界、文档路径索引。
   - 索引前先确认目标文件是否存在；不存在则写「计划产出」。
4. 修正 `HANDOFF.md` 中过时的 `0d607c97` / `16461` / `732931 B` / `e252ae9c…` 标签，凡属历史记录处保留并加注「历史快照」。

**输出文件**：`docs/governance/agent-reports-2026-09-20/T-handoff.md`

---

## T-release-ops（remote/CI 就绪 + 部署验收证据）

1. 新建 `.github/workflows/ci.yml`：Python 3.11；安装运行期+测试依赖；`python -m pytest -q --no-header -p no:cacheprovider`；加二进制白名单扫描步骤。
2. 新建 `requirements.txt` + `requirements-dev.txt`：按 `src/**`、`tests/**` 真实 import 推导（fastapi/uvicorn/pydantic/pytest/httpx 等），并实际验证可导入。
3. 新建 `docs/governance/REMOTE-AND-CI-PLAN-2026-09-20.md`：remote 地址、分支策略、CI 触发、失败排查、回滚；给出**待主代理执行**的精确命令序列（`git remote add` / `push` / `gh run watch`）。
4. 实测本地部署验收：启动 `python run.py`（端口 2077），实测 `/`、`/docs`、`/healthz` 等真实路由的状态码与响应摘要，测完**必须关进程**；写入 `docs/governance/DEPLOYMENT-ACCEPTANCE-EVIDENCE-2026-09-20.md`，标注「本地验收，非生产验收」。
5. release 仓只读核对：`git status --porcelain`、ahead 数、HEAD SHA、`origin/main` SHA、`gh run list --limit 5`（历史 CI 为 failure，不得当现行证据）。

**注意**：不得 `git remote add`、不得 push（由主代理执行）。

**输出文件**：`docs/governance/agent-reports-2026-09-20/T-release-ops.md`

---

## 主代理补充说明（2026-09-20，第二轮派发口径）

1. **T-scope 口径澄清（不得扩大删除范围）**：
   - V2 前端 src/gods_workbench/static/v2/** **整体保留**；本轮**只**移除其中对 comfyui/runninghub 的文案、导航项、iframe、调用与专属规则。
   - 画布/工具只保留「入口首页」；**快捷工具入口及其内部内容不迁移**。
   - **comfyui / runninghub 一律不迁移**：不得在保留文件中出现 /static/runninghub/、comfyui-settings.html、comfyui-settings.js、comfyui-settings.css 引用；不得残留 RunningHub 专属字段/函数/协议标识。
   - 禁止删除 v2 的其它页面与控制器；禁止扩大删除到与本裁决无关的文件。
2. **T-fonts 口径**：3 个思源黑体为开源字体（Source Han Sans CN，OFL-1.1），**放行**；仅需修复文档漂移并补写报告，不改 AGENTS.md 白名单路径。
3. **T-phase3 / T-compliance / T-handoff / T-release-ops** 按原任务书执行，输出文件互不重叠。
4. 全体代理**禁止** git add / git commit / git push / git remote；由主代理统一收口与验收。
5. 测试与远端 CI 由主代理在全部子任务完成后统一执行；子代理只需运行自己改动范围内的聚焦检查，并如实标注「未执行」。


---

## 主代理派工与依赖（2026-09-20 补充）

**共同约束（适用于全部 T-xxx）**
- 只写自己小节的输出文件与所属改动文件；不得修改其他小节涉及的文件。
- 禁止 git add / git commit / git push / git remote；禁止派生子代理；禁止使用 orca 或非 Codex 工具。
- `D:\Working\Code Pro\Gods-Workbench-release` 视为**只读**：仅 T-handoff / T-release-ops 可读取，任何代理都禁止写入或修改该仓。
- 完成后必须在自己输出文件中列出：改动清单（新增/修改/删除）、执行的命令与输出摘要、门禁结果、未完成项、证据边界。
- 一律 UTF-8 无 BOM，不得出现 U+FFFD 替换符。

**派工表**

| 任务 | 负责人 | 输出文件 | 依赖 |
|---|---|---|---|
| T-fonts | T-compliance（补写报告） | docs/governance/agent-reports-2026-09-20/T-fonts.md | 无（主代理已完成文档改动） |
| T-scope | T-scope | docs/governance/agent-reports-2026-09-20/T-scope.md | 无 |
| T-compliance | T-compliance | docs/governance/agent-reports-2026-09-20/T-compliance.md | 无 |
| T-handoff | T-handoff | docs/governance/agent-reports-2026-09-20/T-handoff.md | 无（只读 release） |
| T-release-ops | T-release-ops | docs/governance/agent-reports-2026-09-20/T-release-ops.md | 无（只读 release） |
| T-phase3 | T-phase3 | docs/governance/agent-reports-2026-09-20/T-phase3.md | 依赖 T-scope 完成 |
| T-review-1 | Reviewer-1 | docs/governance/agent-reports-2026-09-20/REVIEW-1.md | 依赖 T-scope / T-compliance / T-handoff / T-release-ops |
| T-review-final | Reviewer-2 | docs/governance/agent-reports-2026-09-20/REVIEW-FINAL.md | 依赖全部任务完成 |

**脚本/临时文件卫生**：所有自造草稿写入 `%TEMP%`，不得在仓库内新增临时文件。


---

## T-fonts（详版，供补写报告用）

**背景**：3 个思源黑体 Source Han Sans CN（Bold/Medium/Normal，OFL-1.1）为开源字体，用户 2026-09-20 裁决**放行**，作为 `AGENTS.md` §1.2 唯一二进制白名单（逐条精确路径）。

**要求（只做文档口径修复，不改白名单路径、不动 `.otf` 文件）**
1. 校对以下文件当前口径是否与 `AGENTS.md` §1.2 一致，凡写「不得提交字体 / 严禁本地字体 / 违反 §1.2」等已过时表述，按「历史快照不改写 + 追加后续状态更新指针」原则处理：
   - `AGENTS.md`、`CLEANROOM-CHARTER.md`、`CLEANROOM-STATUS.md`、`README.md`、`CLEANROOM-IMPLEMENTATION-HANDOFF.md`、`docs/design/README.md`
   - `attestations/reviews/*.md`（历史审核报告，**只允许末尾追加**指针小节，不得改写原文）
   - `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md`、`FILE-GOVERNANCE-2026-09-18.md`、`FILE-GOVERNANCE-REVIEW-2026-09-18.md`（历史台账，同上）
2. 逐文件给出：路径 / 当前是否漂移 / 处置（无需改 / 已追加指针 / 仍待裁决）/ 证据行号。
3. 明确 `AGENTS.md` §1.2 白名单三条精确路径，并说明其余图片/音视频/字体仍一律禁止。
4. 结论必须写明：**「开源字体放行」不等于「公开分发授权」**；洁净仓仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION。

**门禁**：`python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q` 的二进制白名单用例仍 PASS。

**输出文件**：`docs/governance/agent-reports-2026-09-20/T-fonts.md`

---

## T-review-1（第一轮独立审核：范围 / 合规 / 收口 / 发布就绪）

**角色**：**独立审核代理**，不得信任任何被审代理的自述，必须回到仓库文件与命令输出取证。

**审核对象（逐一实测）**
1. T-scope 产物：`src/gods_workbench/static/**` 是否已无 `/static/runninghub/`、`comfyui-settings.html`、`comfyui-settings.js`、`comfyui-settings.css` 引用；已删文件是否确不存在；保留文件是否未被误删；`tests/hygiene/test_cleanroom_hygiene.py` 基线是否收紧且 6 用例全绿；`docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md` 逐文件计数是否与 `git ls-files`/磁盘一致。
2. T-compliance 产物：3 个新文件是否存在、组件清单是否与磁盘/import 事实一致、是否明确未闭环项、是否越界改动其它文件。
3. T-handoff 产物：`HANDOFF.md` P3 标签是否已更正（HEAD/字节/SHA-256/行数）、历史快照是否保留并加注、`HANDOFF-2.md` 是否存在且索引指向真实文件。
4. T-release-ops 产物：`requirements*.txt` 是否可导入、`.github/workflows/ci.yml` 是否语法合理、部署验收证据是否为**真实**启动输出（非编造）、release 仓是否未被写入。

**方法要求**：对每条给出「命令 + 原始输出摘要 + 一致/不一致/无法验证」。发现的问题按 P0/P1/P2/P3 分级并给出文件:行号。

**输出文件**：`docs/governance/agent-reports-2026-09-20/REVIEW-1.md`

---

## T-review-final（最终独立审核：整体交付判定）

**角色**：**独立审核代理**（建议与 T-review-1 不同会话），对**全部**产物做整体判定。

**必须覆盖**
1. 用户四项裁决逐条闭环验证（字体放行 + 文档漂移；V2 保留 + 画布/工具仅入口首页 + comfyui/runninghub 不迁移；HANDOFF P3 标签 + HANDOFF 完成 + HANDOFF-2；Phase 3 重签 + 快照审计 + 许可/IdP/部署方案 + remote/CI 就绪）。
2. 门禁复跑：`python -m pytest -q --no-header -p no:cacheprovider` 全量；所有保留 `.js` 的 `node --check`。
3. 二进制红线复扫：全仓仅 3 个白名单 `.otf`，不得有其它图片/音视频/字体。
4. `git status --porcelain -uall` 与改动清单一致性；`git diff --stat` 与实际改动一致。
5. 证伪式抽查：至少挑 3 个「声称已完成」的点，尝试用命令推翻；推不翻才记 PASS。
6. 明确证据边界：本地实测 ≠ 远端 CI ≠ 生产验收；push/CI/生产验收**未执行**。
7. 给出最终判定：**可提交 / 不可提交**，以及是否「可宣称交付」。

**输出文件**：`docs/governance/agent-reports-2026-09-20/REVIEW-FINAL.md`
