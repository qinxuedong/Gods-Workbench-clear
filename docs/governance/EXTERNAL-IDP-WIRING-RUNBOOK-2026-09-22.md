# 真实外部 IdP 接线运行手册（2026-09-22）

> 状态：**已实现 + 已对真实上游只读实测**，但**未完成生产登录验收**，仓库仍为
> **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
> 本手册只描述**部署方**如何把本仓接到真实外部 IdP，不构成发布授权或生产就绪结论。

## 1. 适用范围与证据边界

| 层级 | 覆盖内容 | 是否已闭环 |
|---|---|---|
| 代码路径 | 授权码 + PKCE（S256）、discovery、JWKS、RS256 校验、组→角色映射、服务端会话 | 已实现（`core/oidc.py` / `core/config.py` / `core/session.py` / `api/routes_auth.py`） |
| 本仓自建 IdP 桩 | 配置解析、失败关闭、本地 HTTP 全链路 | 已实现并进默认门禁 |
| 第三方 OP 软件本地实例 | 与「非本仓实现」的 OP 互操作（`oidc-provider@9.12.2`） | 已实现（opt-in，未安装即 skip） |
| **真实外部 IdP 生产端点** | discovery → `jwks_uri` → JWKS → 授权 URL 构造 → 运行期就绪与失败关闭 | **已只读实测**（Google、Microsoft 单租户 issuer） |
| 真实用户登录 | 真实 `client_id`、用户目录、授权码换 id_token、组声明 | **未做**（需部署方凭据与人工批准） |
| 生产部署 / 发布授权 | TLS、反向代理、密钥管理、灰度、回滚演练、独立审计 | **未做** |

**结论口径**：可以声称「本仓 OIDC 接线已对真实上游元数据完成只读实测」；
**不可以**声称「已接入生产 IdP 可登录」「生产就绪」「已获发布授权」。

## 2. 必需环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `GW_AUTH_MODE` | 是 | 固定 `oidc`。缺省为 `local`（仅开发/测试）。 |
| `GW_OIDC_ISSUER` | 是 | IdP issuer，**必须**与 discovery 文档自述 `issuer` 逐字一致。 |
| `GW_OIDC_AUDIENCE` | 是 | id_token 的 `aud`。 |
| `GW_OIDC_CLIENT_ID` | 是（登录） | 公共客户端 ID；本仓**不使用** client [FUNC]（PKCE 公共客户端）。 |
| `GW_OIDC_REDIRECT_URI` | 是（登录） | 固定回调地址，必须与 IdP 注册值逐字一致。 |
| `GW_OIDC_JWKS_URL` | 否 | 显式指定则优先；缺省走 `issuer + /.well-known/openid-configuration` 的 discovery。 |
| `GW_OIDC_GROUPS_CLAIM` | 否 | 组声明名，缺省 `groups`。 |
| `GW_OIDC_LEEWAY_SECONDS` | 否 | 时钟容差，缺省 60。 |
| `GW_OIDC_SCOPES` | 否 | 缺省 `openid profile email`。 |
| `GW_OIDC_ENDPOINT_HOSTS` | 跨主机 IdP 必需 | 逗号/空白分隔的**完整主机名**白名单，**完整替换**默认空集合。 |

> `GW_OIDC_ENDPOINT_HOSTS` 是**部署方显式 opt-in**：本仓**不预置**任何第三方主机，
> 默认严格同源。匹配为**逐字相等**（无 PSL / 无 eTLD+1 推导），
> **不是通用安全边界**，必须按 IdP 官方 discovery 文档逐条照抄。

## 3. 已实测的真实上游示例

### 3.1 Google

```text
GW_AUTH_MODE=oidc
GW_OIDC_ISSUER=https://accounts.google.com
GW_OIDC_AUDIENCE=<Google OAuth 客户端 ID>
GW_OIDC_CLIENT_ID=<Google OAuth 客户端 ID>
GW_OIDC_REDIRECT_URI=https://<你的域名>/api/asset-auth/callback
GW_OIDC_GROUPS_CLAIM=groups          # Google 默认不签发 groups，需 Workspace 管理员配置自定义声明
GW_OIDC_ENDPOINT_HOSTS=accounts.google.com,www.googleapis.com,oauth2.googleapis.com
```

实测（2026-09-22，只读）：

```text
discovery issuer            -> https://accounts.google.com            （与配置逐字一致）
jwks_uri                    -> https://www.googleapis.com/oauth2/v3/certs
authorization_endpoint      -> https://accounts.google.com/o/oauth2/v2/auth
token_endpoint              -> https://oauth2.googleapis.com/token
id_token_signing_algs       -> ["RS256"]
JWKS 公钥数 / 私钥材料      -> 2 / 无
运行期 auth_mode / ready    -> oidc / true；login_ready=true
/healthz oidc_ready         -> true；release_authorized=false
写操作（无凭据/伪造 Bearer/仅 X-User-Role/本地 legacy 凭据） -> 均 401
/login                      -> 200，PKCE S256、含 state/nonce、无 client_secret/access_token/id_token
```

### 3.2 Microsoft Entra ID（单租户）

```text
GW_OIDC_ISSUER=https://login.microsoftonline.com/<租户 ID>/v2.0
GW_OIDC_ENDPOINT_HOSTS=login.microsoftonline.com
```

实测：discovery 自述 issuer 与配置一致；`jwks_uri` / `token_endpoint` 均在该主机内，白名单可覆盖。

### 3.3 Microsoft Entra ID 多租户（`common` / `organizations`）——**当前不可接线**

实测：`https://login.microsoftonline.com/common/v2.0` 的 discovery 文档自述
`issuer` 含 `{tenantid}` 占位符，与配置 issuer **不一致**，被 R6-14 mix-up 防护**正确拒绝**。

```text
discovery_ok = false
ValueError: discovery 文档 issuer 与配置 issuer 不一致，已拒绝
```

**这属预期行为**，不是缺陷：OIDC Discovery 1.0 §4.3 要求自述 issuer 与检索 issuer 一致。
接入多租户需部署方**自行**选择：逐租户固定 issuer，或另行设计受控的多 issuer 校验
（**属新架构决策，未在本切片实现**）。

## 4. 组到角色映射

| IdP 组 | 本地角色 | 权限边界 |
|---|---|---|
| `gw-admin` | `admin` | 项目/画布治理与管理 |
| `gw-governor` | `governor` | 生命周期治理、画布写入 |
| `gw-editor` | `editor` | 项目/画布编辑 |
| `gw-reviewer` | `reviewer` | 审阅 |
| `gw-readonly` | `readonly` | 只读 |

规则：完整匹配 + 大小写规范化；多组取**最高已授权**角色；未知组**不升级**；
无命中即 `ForbiddenException`（403）。`GW_AUTH_MODE=oidc` 下 `X-User-Role` 被**完全忽略**。

## 5. 接线检查清单（部署方逐项确认）

- [ ] IdP 侧注册**公共客户端** + 固定 `redirect_uri`，启用 PKCE（S256）。
- [ ] 已按 §2 配齐变量；`GW_OIDC_ENDPOINT_HOSTS` 逐条抄自 IdP 官方 discovery（含 `jwks_uri` 主机与 `token_endpoint` 主机）。
- [ ] `GET /healthz` 返回 `auth_mode=oidc`、`oidc_ready=true`。
- [ ] `GET /api/asset-auth/status` 如实返回登录状态；未登录时 `authenticated=false`。
- [ ] 无凭据 / 伪造 Bearer / `X-User-Role` 提权尝试 **均 401**（失败关闭）。
- [ ] 组声明在 id_token 中实际出现，且 5 个组名与 §4 表一致。
- [ ] 反向代理已终结 TLS；issuer 为 `https://`（本地回环联调例外）。
- [ ] 已确认会话存储边界：`_SESSIONS` / `_FLOW_STATES` 是**单进程内存**，多实例/多 worker 前必须换共享存储（**未闭环**）。
- [ ] 已确认会话绝对上限：`SESSION_ABSOLUTE_MAX_SECONDS`（缺省 24h）已在服务端强制，滑动续期不会越过；浏览器 Cookie 的 `Max-Age`（8h）短于该上限，属预期。
- [ ] 已确认 Cookie 属性（HttpOnly + SameSite=Lax；HTTPS 下 Secure）。
- [ ] 已确认令牌原文不出现在 Cookie / URL / 响应体 / 日志。

## 6. 回滚

1. 立即停用灰度，**保留**审计日志与失败样本。本仓自 Phase 9Q 起会产生认证事件审计（logger `gods_workbench.audit`，见 §10）；**持久化留存由部署方负责**，部署前必须已接入日志管道，否则回滚时无账可查。
2. 通过部署配置切回最近一次已验证的认证适配器；回退必须由管理员审批、限时、可观测。
3. 清理失效会话 Cookie，撤销受影响 refresh token，重新验证 `/healthz`、匿名只读与编辑/治理边界。
4. **不得**用伪造 `X-User-Role` 或 `GW_AUTH_MODE=local` 绕过权限来「恢复可用」。

## 7. 未闭环项（不得写 PASS）

- 真实用户登录（真实 `client_id` + 用户目录授权 + 授权码换 id_token）**未执行**。
- 令牌撤销、密钥轮换并发窗口、多实例会话一致性**未压测**。
- `core/session.py` 的会话绝对过期上限（R6-7）已在**本地**闭环：`SESSION_ABSOLUTE_MAX_SECONDS`（24h）+ `_Session.absolute_expires_at`，滑动续期被封顶；但**未在真实多实例/生产环境验收**，且仍为单进程内存存储。
- Microsoft 多租户（`common` / `organizations`）**当前不可接线**。
- 时钟偏差、反向代理、TLS、CSRF/CORS **未实测**；审计**落点已交付**（§10），但审计**存储**、保留策略与时间同步**未实测**。
- 生产部署与发布授权：**另行安排**；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


## 8. 第二家真实第三方 OP 只读复算（2026-09-22 追加）

除 §3 的 Google / Microsoft 外，本轮又以 **Duende IdentityServer 官方演示 OP** 做了一次
「非 Google 系」的只读复算，以排除「只对一家人工适配」的可能：

```text
GW_REAL_IDP_ISSUER=https://demo.duendesoftware.com
GW_REAL_IDP_ENDPOINT_HOSTS=demo.duendesoftware.com
python -m pytest -q tests/contracts/test_phase9i_real_idp_wiring.py
-> 5 passed
```

实测要点：discovery 文档自述 `issuer` 与配置逐字一致；`jwks_uri` / `authorization_endpoint`
均在同源主机内（单一主机，白名单可覆盖）；`id_token_signing_alg_values_supported = ["RS256"]`；
授权 URL 携带 PKCE S256 且不含任何密钥；无凭据 / 伪造 Bearer / `X-User-Role` 提权一律 401。

**边界不变**：以上仍属**只读元数据与授权 URL 构造**层面的实测，**未**执行真实用户登录
（无真实 `client_id` 与用户目录授权），**不构成**生产就绪或发布授权。

## 9. 远端 CI 读回（2026-09-22 追加）

本手册随提交 `76887b429125c64422b2b84ec0b05bfc85a3377a` 一并入库；
该 SHA 在 GitHub Actions workflow `CI`（run `35665256938`，push, master）读回
`conclusion = success`，且 `headSha` 与本地 `git rev-parse HEAD` **逐字一致**。
远端 CI 只证明该 SHA 在 CI 环境通过，**不等于**生产验收，**不构成**发布授权。


## 10. 认证事件审计落点（2026-09-22 追加，Phase 9Q）

本轮补上认证路径的审计落点，闭环独立复核发现的 D12（原先 `src/` 内
`logging` / `audit` 命中数为 0）。

- 模块：`src/gods_workbench/core/audit.py`；logger 名 `gods_workbench.audit`（INFO）。
- 覆盖事件：`auth.login.started` / `auth.login.denied` /
  `auth.login.already_authenticated` / `auth.callback.rejected` /
  `auth.session.established` / `auth.token.rejected` / `auth.role.rejected` / `auth.logout`。
- 记录字段（**白名单**）：`event` / `outcome` / `reason` / `subject` / `role` /
  `auth_mode` / `at`；另提供 `GET` 无关的进程内读取函数 `list_auth_events()`（仅供核验）。
- **绝不记录**：令牌原文、授权码、`code_verifier`、`state` / `nonce`、Cookie 值。

**部署方前置条件（未闭环，不得写 PASS）**

- 落点当前为**进程内环形缓冲（2048 条）+ 标准库日志**：进程重启即丢失，
  多实例 / 多 worker **不共享**。生产必须把 `gods_workbench.audit` 接入
  持久化日志管道 / SIEM，并自行定义保留期与时间同步。
- 审计**存储与保留策略未实测**；有落点**不等于**通过第三方独立审计，
  也**不构成**发布授权。


## 11. 令牌绑定加固（2026-09-22 追加，Phase 9R）

本轮对「真实外部 IdP 接线」补两条 **OIDC 规范强制** 的令牌绑定校验，
来源是本手册 §3 / §8 只读实测暴露的规范级缺口。

| 编号 | 规范依据 | 加固前 | 加固后 |
|---|---|---|---|
| R9-1 | OIDC Core 1.0 §3.1.3.7 规则 4 / 5 | 未校验 `azp` | `aud` 多值缺 `azp` -> 拒绝；`azp` 与本客户端 `audience` 不一致 -> 拒绝；单值无 `azp` -> 放行 |
| R9-2 | RFC 7517 §4.2 / §4.3 | JWK `use` / `alg` 未约束 | 显式 `use != sig` 或显式 `alg != RS256` -> 拒绝；**未声明 -> 仍按 RS256 使用** |

**为什么不能一刀切拒绝未声明的 `alg`**：本轮只读实测显示
Microsoft MSA 的 JWKS（8 keys）**不返回 `alg`**，而 Google（2 keys）与 Duende（1 key）
均返回 `use=sig alg=RS256`。若对未声明 `alg` 一律拒绝，Microsoft 系 IdP 将**完全无法接线**。

**部署方核对项（仍属部署方职责）**：

- `azp` 与 `aud` 的比对基准是 `GW_OIDC_AUDIENCE`；本仓为公共客户端，
  部署时应保持 `GW_OIDC_AUDIENCE == GW_OIDC_CLIENT_ID`，否则需自行确认语义。
- 若 IdP 的 JWKS 用同一 `kid` 同时发布签名密钥与加密密钥，本仓会拒绝非签名用途的那把；
  请确认 IdP 的 `kid` 唯一性（主流 IdP 均满足）。

**边界**：本项为静态规范遵从 + 本地契约测试（`tests/contracts/test_phase9r_oidc_token_binding.py`，10 条；
对修复前版本 6 条可复现失败）。**未**执行真实用户登录，**不**证明生产登录可用，
**不**构成生产就绪或发布授权。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
