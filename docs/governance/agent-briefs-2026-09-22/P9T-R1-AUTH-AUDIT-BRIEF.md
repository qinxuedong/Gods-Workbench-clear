# 任务书 F：R1 身份/审计/发布授权 只读复核（用户点名要求）

## 角色
你是独立安全/身份审核代理人（Code Reviewer）。**只读**：禁止任何 git 写操作、禁止修改/创建/删除仓库内任何文件。
你的全部脚本与输出只能写到 `%TEMP%\gw-p9t-review-f\` 与 `%TEMP%\gw-p9t-root\reports\`。

## 环境
- 仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear
- 先自行运行并原样贴进报告：`git rev-parse HEAD`、`git rev-parse origin/master`、`git rev-list --left-right --count origin/master...HEAD`、`git status --porcelain=v1 -uall`
- 预期 HEAD = 482709b（工作树可能带有主代理本轮未提交改动：task-center.js / episode-pipeline.js / 其测试与文档）。
  **注意：不要把这些未提交改动当作你的审查对象**，本轮审查对象是**已提交的身份/审计/发布授权链路**。

## 背景（用户 2026-09-21 六项裁决中的第 5、6 项）
- 裁决 5：身份、审计与发布授权。用户明确「**真正的第三方独立审计：另行安排**」「**发布授权：审计完（才给）**」。
- 裁决 6：**真实外部 IdP 接线**。

## 你要回答的 5 个问题（每个都必须有原始证据，不能只见结论）

### Q1 身份认证现状（代码级）
读 `src/gods_workbench/core/oidc.py`、`src/gods_workbench/core/auth.py`、`src/gods_workbench/core/config.py`、
`src/gods_workbench/api/routes_auth.py`，回答：
- 有几种认证模式？默认是哪个？（`GW_AUTH_MODE` 取值）
- OIDC 模式下：发现文档 / JWKS 拉取 / `iss` / `aud` / `azp` / `exp` `nbf` `iat` / `nonce` / `state` / PKCE / `groups` 映射分别**已实现**还是**未实现**？逐项列表。
- **失败关闭（fail-closed）** 是否成立？有无任何路径会在验签/校验失败时放行？逐条给出代码位置。
- `alg` 是否被限制（是否拒绝 `none`、是否绑定 JWK `alg`/`use`）？给出代码位置。
- OIDC 模式下 `X-User-Role` 是否被忽略？给出代码位置。

### Q2 真实外部 IdP 接线：到底做到哪一步
- 是否存在**真实外部 IdP** 的端到端成功证据（真实用户登录 → 会话建立 → 角色生效）？
  允许你亲自发起只读网络探测，但**不得使用任何真实凭据、不得注册用户、不得写外部状态**。
- 读 `docs/governance/EXTERNAL-IDP-WIRING-RUNBOOK-2026-09-22.md`，特别是 §11/§12 的自述，
  核实其中哪些是**真跑出来的**、哪些是**契约/单元级**的。若文档自述与你的复算不符，逐条点名。
- 亲跑并贴原始输出：
  ```
  python -m pytest -q --no-header -p no:cacheprovider tests/contracts/test_phase9i_real_idp_wiring.py tests/contracts/test_phase9r_oidc_token_binding.py tests/contracts/test_oidc_verifier.py tests/contracts/test_oidc_runtime_wiring.py tests/contracts/test_phase9d_oidc_login_flow.py
  ```
  记录原始 passed / skipped / failed 数字。
- 明确指出该 runbook 第 4 行那张表里「真实用户登录」标的是「未做」还是「已做」。

### Q3 `azp` 比对基准（待裁决项）
- 读 `core/oidc.py::verify_authorized_party`，指出 `azp` 与什么比较（`GW_OIDC_AUDIENCE` 还是 `GW_OIDC_CLIENT_ID`）。
- 说明 OIDC Core 1.0 §3.1.3.7 规则 4/5 的标准语义：`aud` 多值时 `azp` 必须存在且等于**本客户端标识**。
- 判断「以 `GW_OIDC_AUDIENCE` 作 `azp` 基准」在 `GW_OIDC_AUDIENCE == GW_OIDC_CLIENT_ID` 的部署约定下是否安全；
  该约定若被破坏，会出现**误拒**还是**误放**？给出确定结论。
- 明确标注该项属于**需用户/部署方确认**，不要替用户裁决。

### Q4 审计与发布授权现状（必须给出「未执行 / 未授权」的确证或反证）
- `git grep -n -F "NOT AUTHORIZED FOR PUBLIC DISTRIBUTION"`（贴命中原文与文件:行）
- `git grep -n -F "第三方独立审计"`（贴命中原文与文件:行）
- `git ls-files LICENSE THIRD_PARTY_NOTICES.md`（**空输出即未建立**，贴原始输出）
- 读 `docs/governance/TASKS.md` 中 **T36** 与 **T40** 条目原文，确认复选框是 `[ ]` 还是 `[x]`。
- 结论只能写「**未执行 / 未授权**」或给出反证。**严禁写 PASS**。

### Q5 身份链路上的已知未闭环项
- 读 `docs/governance/TASKS.md` 与 runbook，汇总身份/审计/发布相关**仍未闭环**的项（含 `azp` 基准、真实 IdP 凭据、
  第三方独立审计、根级 LICENSE/NOTICES），逐条标注「谁负责 / 缺什么」。

## 硬约束（违反即作废）
- 严禁 `git add / commit / push / checkout / stash / reset / clean` 等一切写操作（只读 git 允许）。
- 严禁修改/创建/删除仓库内任何文件（含 docs、测试）。
- 结束前必须再跑一次 `git status --porcelain=v1 -uall` 并贴原始输出，证明仓库未被你改动。
- 中文、简明、禁夸大。**本地门禁 != 生产验收；同框架复核 != 第三方独立审计。**

## 交付
报告写入（UTF-8）：C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\reports\R1-AUTH-REVIEW.md
结构：
1) HEAD / origin/master / 计数 / git status 原始输出
2) Q1 认证能力矩阵（已实现 / 未实现，含代码位置）
3) Q2 真实 IdP 接线证据等级 + pytest 原始输出
4) Q3 `azp` 基准分析（含「误拒 or 误放」结论）
5) Q4 审计与发布授权「未执行/未授权」证据链
6) Q5 未闭环清单
7) 未覆盖与不确定项（不得省略）
