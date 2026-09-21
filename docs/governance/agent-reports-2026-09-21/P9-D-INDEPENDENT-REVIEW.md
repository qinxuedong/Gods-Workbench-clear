# P9-D 独立复核报告：Phase 9D/9G R6 加固与洁净验收

- 日期：2026-09-21（Asia/Shanghai）
- 复核对象：`Gods-Workbench-clear` 当前工作树
- 复核性质：与实现线程同仓库、同 cwd、不同线程的**独立复算**；本报告不等于外部第三方独立审计。
- 证据边界：本轮以本地源码、测试、Node 行为级脚本及浏览器复算为准；未将实现方口述当作独立证据。门禁最终数字以组长收口复算填入。

## 1. R6 逐条复核结论

| 编号 | 结论 | 复算方式 | 证据/边界 |
|---|---|---|---|
| R6-1 | PASS | 直接导入 `core.session`，登记两条不同 `state`，调用 `_prune()` / `pop_flow_state()`，检查两条流程各自保留且单次消费。 | `_prune` 分别按会话 `expires_at` 与流程 `created_at + FLOW_STATE_TTL_SECONDS` 清理；未复算绝对过期上限。 |
| R6-2 | PASS | 直接调用 `is_same_origin_as()`，覆盖恶意前缀、userinfo、异主机、异 scheme、异端口。 | `idp.example.com.evil.com`、`idp.example.com@evil.com`、`http://`、`:8443` 等均应拒绝；具体最新输出以组长收口复算为准。 |
| R6-3 | PASS | 对照后端 `/api/asset-auth/status` 返回结构与前端读取字段，并执行跨模块一致性契约测试。 | 未认证时 `principal` 为 null；前后端字段名不再错位。 |
| R6-4 | PASS | 检查登录入口 HTML/JS 与请求体，运行 OIDC 登录契约测试及真实授权码 + PKCE 浏览器流程。 | 登录改为 302 跳转授权端点；本页不收集或外发用户名/密码。 |
| R6-5 | PASS | 直接调用 `_b64url_decode("!!!!")` 及其它非法片段，断言抛 `UnauthorizedException`。 | 非法 Base64URL 不再静默变成空字节。 |
| R6-6 | PASS | 构造 HTTP/HTTPS issuer，调用 `_issuer_uses_https()` 并检查 `set_cookie(..., secure=...)`。 | HTTPS issuer 设置 `Secure`；本地 HTTP 回环联调不设置 `Secure`，以免浏览器丢弃 Cookie。 |
| R6-7 | **未实施，待裁决** | 只读检查 `core/session.py::get_session` 的过期逻辑。 | 当前为滑动过期，无绝对过期上限；不得把 PASS 外推为已解决。 |
| R6-8 | PASS | 双端口 HTTP 端到端构造同源/异源 302，检查 `_REDIRECT_GUARD`、逐跳 `is_same_origin_as()` 与攻击者命中数；覆盖相对 Location / 多跳 / 303、307 的守卫测试以组长收口结果为准。 | 异源重定向失败关闭；合法同源跳转可用；令牌交换路径另用无重定向 opener。 |
| R6-9 | PASS（**由复核方发现**） | 抽取 `static/js/asset-review.js` 的 `can()` 表达式，使用 Node 行为级 fixture 覆盖未认证、无 principal、低角色、高角色。 | 旧 `!state.auth?.auth_required` 会 fail-open；现改为 `authenticated && principal` 后再比较角色等级。 |
| R6-10 | PASS（**实现方发现，复核方独立确认**） | 直接调用 `resolve_endpoint_hosts()` / `is_trusted_endpoint()`，分别测试默认空集合、恶意 allowlist、Google issuer 与跨主机 JWKS/token 端点。 | 默认仍严格同源；显式 `GW_OIDC_ENDPOINT_HOSTS` 才可接入官方跨主机端点；授权端点与重定向守卫不被白名单放宽。 |
| R6-11 | PASS（**复核方独立扫描确认**） | `git grep`/源码上下文扫描 `Math.random`、静态硬件百分比/容量/算力、9 个 v2 页顶栏在线灯；真实 Chrome 逐页检查降级标记与 pageerror。 | 已确认 `hardware-telemetry.js` 随机伪遥测清零、顶栏改为 `not_integrated` 琥珀状态、具体顶栏推子读数归零。设置页、动态成员 `ONLINE/ACTIVE` 等残留应由组长收口扫描决定是否继续处置。 |
| R6-12 | PASS（独立 Node 行为级复算） | Node 真实执行 `rawNumber()` / `progressMeta()` / `projectProgressMeta()`，输入 `0`、`'0'`、缺失、null、空串、非数及仅实体计数 fixture。 | 真实 0 保留为 0%；缺失值显式「未接入」；不再以 10/60/75/24/72 等数字静默替代。 |

## 2. 洁净计划 §7 七项验收清单

以下为本地复算口径；最终工作树数字以组长收口复算为准。

1. **接受迁移文件有来源、哈希、依赖闭包和授权结论：PASS**。复算命令：`git grep -n "来源\|SHA-256\|依赖闭包\|授权" docs/provenance docs/governance attestations`；仅接受已登记的治理材料。
2. **项目中心与 god-canvas 不依赖旧画布代码：PASS**。复算命令：`git grep -n "static/js/canvas/\|Infinite-Canvas\|Gods-Workbench-release" -- src`；应为 0 命中。
3. **未引入旧仓 .git、提交历史、资源或用户数据：PASS**。复算命令：`git ls-files` + 嵌套 `.git` 目录扫描 + 二进制白名单扫描；不得发现旧仓路径、嵌套仓库或越界资源。
4. **错误语义覆盖 401/403/409/202：PASS**。复算命令：`pytest -q tests/contracts`，并检索 `status_code` / 标准错误包 `detail.code` / `202 Accepted` 契约。
5. **PLUGIN-PROTOCOL-SPEC 仍待审且未实现：PASS**。复算命令：`git grep -n "PLUGIN-PROTOCOL" -- src`；应为 0 命中；规范文件仅留在 `docs/behavior/`。
6. **当前工作树和测试输出已绑定：PASS（绑定文档待组长填最新门禁值）**。复算命令：`git rev-parse HEAD; git rev-parse origin/master; git status --porcelain=v1; pytest -q`。
7. **仓库仍 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION：PASS**。复算命令：`git grep -n "NOT AUTHORIZED FOR PUBLIC DISTRIBUTION" -- AGENTS.md CLEANROOM-STATUS.md docs`；不得将本地/CI 通过解释为发布授权。

## 3. 门禁（复核方收口实测值）

本节数字为**复核方**在实现方停止改动后重新执行的真实值（2026-09-21，本地 Windows）：

- 全量 pytest：**218 passed, 3 skipped**（命令 `python -m pytest -q --no-header -p no:cacheprovider`；3 个 skip 均为缺 `oidc-provider` 包）
- `tests/hygiene`：**11 passed**（命令 `python -m pytest -q --no-header -p no:cacheprovider tests/hygiene`）
- 跟踪 `.js` 的 `node --check`：**56 / 0 failed**（`git ls-files "*.js"` 全量）
- 真实浏览器全站 `pageerror`：**0**（真实 uvicorn + 真实 Chrome，16 页）
- 当前 tracked 文件数：**275**（`git ls-files` 计数）
- Tailwind 死类扫描：`py-0.2` **70 处 / 11 文件**、`backdrop-blur-xs` **2**、`h-4.5` / `w-4.5` **各 1**（**未处置**，待裁决）
- 可选加固证据（复核方独立复算）：装好 `oidc-provider` 并设 `GW_OIDC_PROVIDER_MODULE_DIR` 后全量 **221 passed**，其中真实第三方 OP 互操作用例 **3 passed**（默认环境下这 3 条会 skip，证明为真 opt-in）
- 变异测试（复核方在 `%TEMP%` 副本上执行，仓库零改动）：基线 92 passed；`can()` 回退 fail-open → 1 failed；scenes/shots falsy 兜底 → 1 failed；issuer 改 `startswith` → 4 failed；还原后 92 passed

门禁数字绑定的是**未提交工作树**；实现方若继续改动，本节数字即失效，必须重跑。

## 4. 待用户裁决项（不擅自执行）

- **O4**：`static/css/tailwind-utilities.css` 首行指向不存在/不可复现的 `tools/build_static_tailwind_utilities.py`；需决定自托管、预构建或其它可复现路径。
- **O5**：`py-0.2`、`backdrop-blur-xs`、`h-4.5/w-4.5` 为 Tailwind v3.4.17 不生成的死类；建议最小修正会产生视觉变更，待用户授权。
- **O6**：`P9-B-INDEPENDENT-REVIEW.md` 历史段落写 `tracked 269`，当前值应由组长复算确认；历史行是否更正待裁决。
- **R6-7**：会话滑动过期无绝对上限，是否实施上限待裁决。
- **`static/js/canvas/http.js`**：512 B、当前零调用方且触犯洁净迁移边界；删除属破坏性操作，必须取得用户明确授权后执行。

上述 O4/O5/O6/R6-7 与 `static/js/canvas/http.js` 已在洁净状态与任务台账中登记；本报告不代为执行。

## 5. 边界与限制

- 本地实测 ≠ 远端 CI ≠ 生产验收；远端 CI 需绑定确切提交 SHA，生产验收仍是独立决策。
- 同框架复核、同工作目录不同线程的复算 ≠ 外部第三方独立审计。
- 本轮未接入生产 IdP；Google/本地 IdP 互操作只代表配置与授权码流程复算，不代表生产信任根、撤销、轮换或压测完成。
- `_SESSIONS` / `_FLOW_STATES` 仍是单进程内存存储；多实例、多 worker 前必须换外部共享存储并重新验收。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；无发布授权，不得据本地门禁通过对外发布。

## 6. 本报告落盘说明

本文件由独立复核方创建，仅写入本文件；未执行 git add、commit、push，也未改写实现代码或其它治理文件。
