# HANDOFF-8 —— 2026-09-22 交接文档（任务 / 已完成 / 当前卡点 / 下一步）

> 仓库：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`
> 基线：`714414a9aa5665f65c576809698ff387971f91ef`（`HEAD == origin/master`，`0/0`）
> 远端 CI：run `35684060664` → `conclusion = success`，`headSha` 与基线逐字一致
> 发布状态：**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**（未变）
> 依据：根 `AGENTS.md`、`HANDOFF-5.md` ~ `HANDOFF-7.md`、`docs/governance/TASKS.md`

---

## 1. 我们在做什么任务

延续洁净计划（Cleanroom）第 9 阶段，落地用户 2026-09-21 的**六项裁决**与 2026-09-22 追加裁决。目标是：在不引入旧仓源码、不越权扩大范围的前提下，把「前端调用但后端未实现」的现状，从**静默坏掉**改为**显式降级 / 明确标记未纳入当前切片**，并把身份、审计、发布授权三项阻断项的真实状态登记清楚。

六项裁决原文（简记）：

| # | 裁决 | 性质 |
|---|---|---|
| 1 | `asset-share.html` 无 token 直开 → 给明确缺参提示 | 前端，本地可闭环 |
| 2 | 180 条未实现端点**按顺序**推进（素材库 → 观测 → 提示词库 → 设置页 → 画布闭环）；`asset-manager` / `api-settings` / `task-center` 三块整体标「未纳入当前切片」 | 产品排序 + 大工程量 |
| 3 | 前端统一「无后端时显式降级」（明说「未接入」，不静默坏掉） | 前端，本地可闭环 |
| 4 | Phase 7 滚动的合规 / 供应链项按建议执行 | 合规，部分可本地 |
| 5 | 身份、审计与发布授权：第三方独立审计**另行安排**；发布授权**待审计完成** | 外部阻断 |
| 6 | 真实外部 IdP 接线 | 需真实 OP + 凭据 |

---

## 2. 已经完成了什么

### 2.1 本轮（Phase 9T）提交内容

提交 `714414a`（10 文件，+919 / −20），已在 `origin/master`，远端 CI 绿。

| 裁决 | 落地内容 | 状态 |
|---|---|---|
| 1 | `src/gods_workbench/static/js/asset-share.js:48` 缺参分支：`if(!token){error('缺少分享令牌，请使用完整的分享链接打开本页面。');return;}`。实测 `/static/asset-share.html` 直开渲染缺参文案、**未发起任何 `/api/*` 请求**、`page_errors=[]` | **已闭环**（本机实测，非生产验收） |
| 2 | **本轮零实现任何后端端点**（后端全部装饰器路由实测仅 **19** 条，分布于 `routes_auth.py` 4 / `routes_god_canvas.py` 8 / `routes_projects.py` 7）；三块大功能面「未纳入当前切片」标记已落地 | **部分闭环**（标记完成，实现未开工） |
| 3 | 修 2 处真实缺陷：`task-center.js` 未读 `error.code` 一律报「暂不可用」；`episode-pipeline.js` 静默 `.catch` 回落演示数据。另修独立复核发现的 D1–D5：状态不复位、逐条 kind 串味、残留静默单查、文档口径不一致、`loadPipelines()` 漏网 | **已闭环**（真实 Chrome + 真实 uvicorn:2077） |
| 4 | Tailwind Play CDN **插件版本钉死**：`?plugins=forms@0.5.10,container-queries@0.1.1`，消除依赖上游 302 的浮动解析 | **部分闭环** |
| 5 | 保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；`docs/governance/TASKS.md` 中 `T36` / `T40` 复选框仍为 `[ ]`；`git ls-files LICENSE THIRD_PARTY_NOTICES.md` **空输出** | **未执行 / 未授权** |
| 6 | `core/oidc.py` 校验链齐备（PKCE/state/nonce/iss/aud/azp/exp-nbf-iat/alg 白名单/JWK/失败关闭/`groups`→role）；默认 `GW_AUTH_MODE=local`，OIDC 模式忽略 `X-User-Role` | **部分闭环**（无真实生产登录） |

### 2.2 门禁证据（本地亲跑）

```text
python -m pytest -q --no-header -p no:cacheprovider   ->  281 passed, 7 skipped
pytest tests/hygiene                                   ->  16 passed
node --check（全部 tracked *.js）                       ->  57 / 0 failed
```

### 2.3 合规 / 供应链已复算项

- Tailwind 三个 URL 实测（**禁跟随重定向**，逐目标单独请求）：

| URL | 状态 | 字节数 | SHA-256 | ACAO |
|---|---|---|---|---|
| `/3.4.17` | 200 | 407,279 | `176E8946…0D15` | 无 |
| `?plugins=forms,container-queries` | 200（302 后） | 418,973 | `A789CE5A…E60A` | 无 |
| `?plugins=forms@0.5.10,container-queries@0.1.1` | 200 | 418,973 | `A789CE5A…E60A` | 无 |

- **上游始终无 `Access-Control-Allow-Origin`** → SRI / `integrity` **当前不可启用**（确定结论）。
- `prompt-registry`：6 源 / 1230 条 / 4×MIT + 2×CC-BY-4.0（上游声明 ≠ 内容权利再授予）。
- `vendor/MANIFEST.md` 中 `js/tailwindcss-cdn.js` 仍为 **BLOCKED**。
- 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` **未建立**。

### 2.4 任务台账余量

`docs/governance/TASKS.md` 复选框条目：**合计 70，已收口 63，未收口 7**。

未收口：`T26`（180 条实现排序）、`T35`（O4/O5/O6 等待裁决）、`T36` / `T40`（第三方审计 + 发布授权）、`T46`（口径更正）、`T61`（O4/O5/O6 复核结论）、`T66`（Phase 9T 独立复核）。

---

## 3. 当前卡在哪里

### 3.1 卡点一：独立复核通道不可用（本项目最关键的流程卡点）

按用户要求「由审核代理人在最终成果完成前核实」，本轮尝试了全部可用通道，**均未取得任何独立结论**：

| 通道 | 实测结果 |
|---|---|
| `followup_task` / `send_message`（既有 `/root/*` 代理） | 消息可送达（代理会回「无新任务，请下达目标」），但**任务正文不生效**：代理仍只收到环境上下文，未读取任务书。与 Phase 9N/9O、`HANDOFF-7 §5` 同类。 |
| `spawn_agent`（新建代理） | `/root/r2_auth_review` 首次派发即 `429 Too Many Requests`，重试上限耗尽；后续 `r2_*` / `r3_*` 派发后仍只回「未收到具体任务」。 |
| `create_thread`（新对话） | 全部 `target` 形态（`project` / `workspace` / `projectless` / 裸 `projectId` / `local` / 组合对象）均返回 `create_thread received invalid arguments`，**当前不可用**。 |
| 任务书写盘 + 极短消息指路径 | 消息送达，但代理侧未读取任务书。 |
| 历史记录 | `docs/governance/agent-briefs-2026-09-22/P9-L-INDEPENDENT-REVIEW-BRIEF.md` 附注记载：更早一轮 6 个复核线程因上游网关 `HTTP 502 Bad Gateway`（`http://192.168.0.199:3100/v1/responses`）全部失败。 |

**结论**：本轮**没有外部独立复核**。主代理同框架内复算**不得**表述为独立复核。该缺陷已如实登记，不得写成「已独立复核」。

### 3.2 卡点二：需用户裁决（本仓不能自主推进）

| 编号 | 事项 | 为什么卡 |
|---|---|---|
| O4 | Tailwind 是否自托管 | 自托管需修订 `AGENTS.md` §1.2（二进制白名单）/ §2.1（前端技术栈），属**宪章变更**，须用户授权 |
| O5 | 死类修正 `h-4.5/w-4.5`、`backdrop-blur-xs` | **有视觉变更**，须用户授权 |
| — | 删除 `src/gods_workbench/static/js/canvas/http.js` | **破坏性操作**，须用户明确确认 |
| T63-发现3 | `azp` 比对基准：现以 `GW_OIDC_AUDIENCE` 作基准，OIDC Core 1.0 §3.1.3.7 规则 4/5 标准要求是本客户端标识 | 若部署约定 `GW_OIDC_AUDIENCE == GW_OIDC_CLIENT_ID` 被破坏 → **误拒**（fail-closed，**不会误放**）；语义口径需部署方确认 |
| — | 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 是否建立、范围如何 | 当前未授权分发，不得添加正式开源许可证 |
| T46 | 未实现端点口径：实测 177（189 引用 / 12 已实现）与他处 180 并存 | 本项目口径为「追加更正、不改写历史行」，需确认是否统一 |
| T26 | 180 条端点**实现顺序与排期** | 属产品裁决 + 巨大工程量 |

### 3.3 卡点三：需外部安排

- **第三方独立审计**（`T36` / `T40`）：本仓不能自主完成，须外部委托；发布授权**依赖审计完成**。
- **真实外部 IdP 生产登录**：需真实 OP + 真实凭据 + 真实环境；`docs/governance/EXTERNAL-IDP-WIRING-RUNBOOK-2026-09-22.md` 中「真实用户登录」标示为**未做**。
- **`prompt-registry` 内容权利链**：上游许可声明不重新授予内容权利，需逐来源审查（用户 / 法务）。

---

## 4. 下一步计划

### 4.1 立即可做（主代理，本地闭环）

1. **交接文档与任务书入库**：本文件 `HANDOFF-8.md` + `docs/governance/agent-briefs-2026-09-22/P9T-*.md`（4 份复核任务书）逐文件 `git add`（**严禁 `git add -A`**），中文提交信息，推送并读回远端 CI 的 `conclusion` 与 `headSha`。
2. **保持 goal 活跃**，不标 complete；`T66` 保持「进行中」而非 `[x]`。

### 4.2 等用户裁决后执行（按优先级）

1. O4 / O5 / `canvas/http.js` 删除 → 拿到授权后落地 + 逐页视觉复核 + 变异测试 + 提交读回 CI。
2. `azp` 基准口径 → 若确认「audience ≡ client_id」为部署约定，则补充**文档化前置条件**（不改语义）；若确认应比 `client_id`，则改为读 `GW_OIDC_CLIENT_ID` 并补契约测试。
3. 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` → 按用户给定范围建立（**不得在授权前添加正式开源许可证**）。
4. T46 口径统一 → 以追加方式登记，不改写历史行。

### 4.3 需外部推进

1. 第三方独立审计 → 委托外部机构；完成后才评估发布授权。
2. 真实外部 IdP 生产登录 → 落实 OP / 凭据 / 环境后做端到端验证（真实用户登录 → 会话建立 → 角色生效）。
3. `prompt-registry` 逐来源权利审查。

### 4.4 独立复核通道修复建议（供下一轮）

- 复核任务书已**入库到仓库路径**（不再只放 `%TEMP%`），避免代理因临时目录不可读而拿不到正文：
  - `docs/governance/agent-briefs-2026-09-22/P9T-R1-AUTH-AUDIT-BRIEF.md`（身份/审计/发布授权，Q1–Q5）
  - `docs/governance/agent-briefs-2026-09-22/P9T-DECISIONS-STATUS-BRIEF.md`（六项裁决闭环状态）
  - `docs/governance/agent-briefs-2026-09-22/P9T-SUPPLY-CHAIN-BRIEF.md`（合规/供应链复算）
  - `docs/governance/agent-briefs-2026-09-22/P9T-CODE-REVIEW-BRIEF.md`（`482709b..714414a` 对抗式代码审查）
- 下一轮派发时**消息体自带全部指令**（不依赖代理读文件），并把「只读 + 禁 git 写 + 报告输出路径」写进消息首段。
- 若 `429`，按用户要求**串行派发**，一次只发一个。

---

## 5. 复现入口

```powershell
cd "D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear"
git rev-parse HEAD                       # 应为 714414a9aa5665f65c576809698ff387971f91ef
git status --porcelain=v1 -uall
python -m pytest -q --no-header -p no:cacheprovider   # 281 passed, 7 skipped
pytest tests/hygiene                                   # 16 passed
gh run list --workflow CI --branch master --limit 3
python run.py                                          # 本机端口 2077
```

---

## 6. 边界重申

- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；字体白名单放行 ≠ 分发授权。
- 本轮所有实测为**本机 Chrome + 本机 uvicorn**，**不等于**生产验收。
- **180 条未实现端点本轮零实现**，缺口保持原状。
- 子代理通道受限：**同框架复核 ≠ 第三方独立审计**，本轮**无**外部独立复核。
