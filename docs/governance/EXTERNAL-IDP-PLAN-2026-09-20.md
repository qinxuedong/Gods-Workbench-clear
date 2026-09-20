# 外部 IdP 迁移方案（2026-09-20）

## 状态声明

本文档是**方案，不是实现**。当前仓库仍使用本地/测试 Bearer 边界；OIDC、JWKS、组映射和匿名只读降级均未实现、未接入外部 IdP，也未完成生产验收。

## 当前实现事实

- `src/gods_workbench/core/auth.py:25-40` 的 `require_authenticated()` 只检查 `Authorization` 是否为 `Bearer <credential>`，并把 `invalid`/`expired` 当作无效凭据；角色来自函数参数 `user_role`，默认 `editor`。
- `src/gods_workbench/core/auth.py:13-16` 使用本地固定角色集合：`editor`、`admin`、`governor`、`reviewer`、`readonly`、`guest`；写权限为 `editor/admin/governor`，治理权限为 `admin/governor`。
- `src/gods_workbench/api/routes_projects.py:50-53` 等路由将 `X-User-Role` 作为 Header 读入后直接传给认证函数；`routes_god_canvas.py:61-64` 及同类路由同样使用该模式。该 Header 是测试/本地输入，不能视为可信身份声明。
- `src/gods_workbench/api/app.py:54-62` 的健康检查返回 `status=ok`、`mode=cleanroom`、`frozen_contracts=false`、`release_authorized=false`，这不是 IdP 就绪证明。

## 目标架构

### 1. 浏览器登录

采用 OIDC Authorization Code + PKCE（S256）：

1. 前端向后端请求登录入口；后端生成 `state`、`nonce`、PKCE `code_verifier`，只在服务端会话/短期加密状态中保存，不放入 URL 日志。
2. 浏览器跳转至配置的 `issuer` 授权端点，使用固定 `client_id`、固定 `redirect_uri`、`response_type=code`、`scope=openid profile email`（按 IdP 最小化）。
3. 回调只接受一次性 `code`，校验 `state` 与 `nonce` 后在后端通过 TLS token endpoint 换取令牌；不得把 client secret 放入前端。
4. 后端建立 HttpOnly、Secure、SameSite 合适的会话 Cookie；不把 access token 写入 `localStorage`，不在日志/错误响应中输出 token。

### 2. JWT 与 JWKS

- 仅信任配置的 `issuer`，并严格校验 `iss`、`aud`、`exp`、`nbf`、`iat`、`sub`、`nonce`（适用时）及允许的签名算法；拒绝 `alg=none` 与算法降级。
- 从 `jwks_uri` 获取公钥并缓存；按 `kid` 缓存命中，遇未知 `kid` 触发一次受控刷新，刷新失败拒绝请求；设置过期时间、超时和熔断，避免每请求打 IdP。
- 记录 `issuer`、`kid`、校验结果和关联 `job_id/project_id`（不记录原始 JWT）；支持 IdP 密钥轮换的双钥重叠窗口。
- 校验失败统一映射为现有 `401`，不得泄漏“哪个 claim 失败”的敏感细节。

### 3. 组到本地角色映射

建议使用受控配置（环境变量或部署密钥管理器注入），而非请求 Header：

| IdP 组/claim | 本地角色 | 权限边界 |
|---|---|---|
| `gw-admin` | `admin` | 项目/画布治理与管理 |
| `gw-governor` | `governor` | 生命周期治理、画布写入 |
| `gw-editor` | `editor` | 项目/画布编辑 |
| `gw-reviewer` | `reviewer` | 审阅/只读 |
| `gw-readonly` 或无写组 | `readonly` | 只读 |

映射规则：组名必须完整匹配、大小写规范化后再查表；多组按最高明确授权角色取值；未知组不自动升级。没有有效会话或只有匿名请求时，按产品要求**匿名只读降级**：允许公开读取/入口页，任何写入、治理、智能任务提交均返回 `403`；若契约明确要求必须登录的读取接口，则仍返回 `401`，不得将匿名降级扩大到受保护资源。

## 必须保持不变的接口契约

- `401 Unauthorized`：会话缺失、过期、签名/issuer/audience/nonce 校验失败。
- `403 Forbidden`：已识别身份但无当前资源权限；匿名只读降级下的写操作也用 `403`。
- `409 Conflict`：CAS 版本不一致，保留 `VERSION_CONFLICT` 或 `CANVAS_VERSION_CONFLICT`。
- `202 Accepted`：`god-canvas` 智能任务继续返回稳定 `job_id` 与 `poll_hint`。
- 所有错误继续使用 `{"detail":{"code":"...","message":"..."}}` 外层结构；可选的 `expected_version`、`current_version`、`canvas_id` 字段不改名。
- `project_id`、`canvas_id`、`entity_id`、`job_id`、`asset_id` 与 `expected_version` 语义不变；IdP 接入不得绕过 CAS。

## 分阶段迁移步骤

### Phase 0：配置与威胁建模

- 确认 issuer、JWKS URI、audience、允许算法、组 claim 名称、redirect URI、Cookie 域、时钟容差和退出/撤销策略。
- 把 client secret（如需）放入密钥管理器；禁止写入仓库、前端、日志与文档示例中的真实值。
- 定义匿名可读路由白名单、CORS/CSRF 策略、回调错误页和审计字段。

### Phase 1：并行验证（不改变现有默认路径）

- 增加独立 OIDC 校验模块和 feature flag；以影子模式验证 issuer/JWKS/claim/组映射，不影响当前本地 Bearer 流量。
- 为有效 token、过期 token、错误 issuer、错误 audience、未知 kid、无组、多组、匿名读/写建立契约测试。
- 禁止把 `X-User-Role` 当作生产授权来源；保留它仅用于明确标注的本地测试夹具。

### Phase 2：受控切换

- 测试环境启用 OIDC，保留短时本地回退开关；回退开关默认关闭，且仅允许部署管理员使用。
- 小范围用户/组灰度，比较 `401/403`、登录回调错误、JWKS 刷新失败和授权决策日志。
- 验证多实例共享会话/密钥缓存策略，验证时钟偏差和密钥轮换。

### Phase 3：生产启用

- 先在反向代理/TLS 与密钥管理就绪后启用；完成回滚演练和人工批准。
- 关闭生产 `X-User-Role` 信任路径；删除或隔离本地 Bearer 回退，仅保留受控 break-glass 运维流程。
- 更新运行手册、审计字段、数据保留与隐私说明；生产验收需由独立人员完成。

## 回滚方案

1. 发现 IdP 不可用、签名轮换异常、角色映射错误或 401/403 激增时，先停止灰度并保留审计日志。
2. 通过部署配置将流量切回最近一次已验证的认证适配器；回退必须由管理员审批、限时、可观测，不得通过伪造 `X-User-Role` 绕过权限。
3. 清理失效会话 Cookie、撤销受影响 refresh token，重新验证 `/healthz`、匿名只读与编辑/治理边界。
4. 修复后重新执行 Phase 1/2 验收；未经复核不得再次扩大灰度。

## 验收清单

- [ ] 授权码 + PKCE：state/nonce 一次性、重放失败、redirect URI 精确匹配。
- [ ] JWT：issuer/audience/exp/nbf/iat/signature/alg/kid 校验；未知 kid 触发受控 JWKS 刷新。
- [ ] JWKS：缓存、超时、轮换、旧钥匙重叠窗口和 IdP 不可用时的拒绝策略均有测试。
- [ ] 组映射：editor/governor/admin 与 reviewer/readonly 的正负向用例齐全；未知组不升级。
- [ ] 匿名：只读白名单可读；写入、治理、智能任务按契约返回 `403`；受保护读取仍按契约返回 `401`。
- [ ] 合约回归：401/403/409/202、标准错误包、稳定 ID、CAS 与 `poll_hint` 全部不变。
- [ ] 安全：无 token/secret 日志；Cookie、CSRF、CORS、TLS、退出登录和撤销策略已实测。
- [ ] 运维：指标、审计、告警、回滚、密钥轮换和多实例一致性均有证据。

## 未完成项与证据边界

当前仅完成方案记录和现状行号核对；未修改 `src/**`、未配置任何 IdP、未执行远端登录/密钥轮换/生产验收。本文不能证明 OIDC 已实现，也不能证明发布或生产就绪。
