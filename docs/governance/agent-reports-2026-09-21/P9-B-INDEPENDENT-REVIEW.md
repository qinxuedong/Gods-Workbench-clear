# P9-B 独立审核报告：Phase 9 六项裁决落地改动（2026-09-21）

> 审核对象：并发会话在 `b0f25897281eeee925bfe8b4d8e42d0344df0445` 之上的**未提交工作树改动**
> （OIDC 运行期接线 + 前端「无后端显式降级」+ 无 token 提示 + 治理文档追加）。
> 审核范围：`src/gods_workbench/core/config.py`、`core/auth.py`、`api/app.py`、
> `static/js/http-transport.js`、`static/js/workspace-common.js`、`static/js/asset-share.js`、
> `tests/contracts/test_oidc_runtime_wiring.py`、`tests/contracts/test_phase9_frontend_degradation.py`。
> 审核方式：**只读**（未修改被测文件、未 git add/commit/push）。审核主体与实现主体不同。
> 证据边界：本地实测；**不等于**生产验收、法律合规或发布授权。

## 0. 结论总览

| # | 严重性 | 问题 | 判定 |
|---|---|---|---|
| D1 | **高** | JWKS TTL 缓存被「每请求重建配置」击穿：5 次请求 → **5 次网络拉取**（声明为 TTL 缓存，应为 1） | **真实缺陷** |
| D2 | **中** | `503` 被归类为「未接入后端」，会把已实现端点的服务不可用误报为「未纳入当前切片」 | **真实缺陷（语义错误）** |
| D3 | 低 | `test_phase9_frontend_degradation.py` 未断言 501/503 行为（该分支无守卫） | 测试覆盖缺口 |
| D4 | 低 | `docs/governance/TASK-NOTES-2026-09-18.md` 21.11.3 的「带 TTL 缓存」表述与 D1 实测不符 | 文档夸大 (口径错配) |
| — | 参考 | `static/js/canvas/http.js` 仍存在，触犯 `AGENTS.md` §4.2 字面（§7 第 2 项待裁决项） | 待用户裁决 |

通过项（无缺陷）：OIDC「失败关闭」语义、`X-User-Role` 在 oidc 模式被忽略、
角色白名单、JWKS URL scheme 白名单、响应体积上限、无硬编码密钥、统一错误包一致性。

## 1. D1（高）：JWKS TTL 缓存被击穿

### 1.1 代码路径

`core/auth.py:53-54`（每次请求调用）：

```python
token = _extract_bearer_token(authorization)
runtime = load_runtime_auth_config()      # 每个请求重新装载
```

`core/config.py:112-143`（每次都新建 fetcher，缓存字典随闭包一同重建）：

```python
def load_runtime_auth_config() -> RuntimeAuthConfig:
    ...
    oidc_config = OidcConfig(
        ...
        jwks_fetcher=build_jwks_fetcher(JwksEndpointConfig(url=jwks_url)),   # 新闭包 => 新 cache
    )
```

`core/config.py:85-99` 的缓存位于 `build_jwks_fetcher` 内部：

```python
def build_jwks_fetcher(config: JwksEndpointConfig):
    cache: dict = {"at": 0.0, "document": None}     # 仅在本次闭包内有效
```

`OidcConfig.jwks` 始终为空（`config.py` 只注入 `jwks_fetcher`，未注入 `jwks`），
因此 `oidc.py:299-305` 的 `_resolve_public_key` **每个请求都会走 fetcher 分支**。

### 1.2 实测（构造 RSA 密钥 + 本地 monkeypatch 计数，未访问真实网络）

```
5 次 require_authenticated 全部成功（roles=[editor x5]）
jwks 网络拉取次数 = 5
若 TTL 缓存按声明生效 = 1
```

对照（同一配置对象内连续两次调用）：

```
same_config_two_calls = 1        # 闭包内缓存确实有效
three_requests        = 3        # 每请求重建后失效
```

### 1.3 影响

- 每个携带未知 `kid`（或首次/缓存空）的认证请求都会对 IdP 发一次 JWKS 请求；
  认证链路上游不可用时，合法请求会被放大成对 IdP 的请求风暴。
- 认证延迟新增一次同步外呼（`JWKS_TIMEOUT_SECONDS = 5`），最坏每请求 +5s。
- 与 21.11.3 声明的「带 TTL 缓存」不符。

### 1.4 建议（不代为实施）

把运行期配置与 fetcher 做**进程级缓存**（模块级 memo 或 `functools.lru_cache` 包住
`load_runtime_auth_config`，注意测试需可清空），或将 JWKS 文档缓存提升到
`OidcConfig` 之外的可复用位置。修复后须补一条「N 次请求 → 1 次拉取」的断言。

## 2. D2（中）：503 被误判为「未接入后端」

`static/js/http-transport.js:18`：

```javascript
const NOT_INTEGRATED_STATUSES = new Set([404, 501, 503]);
```

`static/js/workspace-common.js` 的 `isNotIntegrated` 同样使用 `[404, 501, 503]`。

`503 Service Unavailable` 表示**路由存在但服务暂不可用**（上游生成服务宕机、
依赖不可用、限流/维护）。当前逻辑会把这类响应对用户显示为
「该功能尚未接入后端（未纳入当前切片）」，把**可恢复的暂时故障**误导为**永久的功能缺失**。
`501 Not Implemented`、`404 Not Found`（无标准错误包）归为未接入是合理的；503 不是。

### 建议

- 从「未接入」集合中移除 `503`（保留 404/501），或在 503 分支改用
  「服务暂时不可用，请稍后重试」并单独标记（例如 `code=SERVICE_UNAVAILABLE`）。

## 3. D3（低）：501/503 分支缺少测试守卫

`tests/contracts/test_phase9_frontend_degradation.py` 中：

```
含 "404" : True
含 "501" : False
含 "503" : False
```

该文件的 6 个用例全部是**静态源码字符串断言**（检查关键字存在），
没有构造 404/501/503/业务 404 的响应对象验证 `isNotIntegratedResponse` 的**行为**。
因此 D2 这类语义错误不会被现有测试发现。

### 建议

补行为级用例：给定 mock Response（含/不含对象型 `detail`、状态 404/501/503/400/409），
断言 `isNotIntegratedResponse` 的返回与「业务错误必须透传」。

## 4. D4（低）：文档口径夸大

`docs/governance/TASK-NOTES-2026-09-18.md` 21.11.3 声称
「JWKS 拉取：仅允许 HTTPS（本地回环 http 例外），带 TTL 缓存、超时与响应体积上限」。

其中 scheme 白名单、超时、体积上限**成立**；但「带 TTL 缓存」在真实请求路径下**不成立**（见 D1）。
建议在修复 D1 后保留该表述，或在修复前改为「缓存作用域限于单次配置装载」。

## 5. 通过项（已核验无缺陷）

| 检查 | 结果 |
|---|---|
| 未识别 `GW_AUTH_MODE` 取值 → 回落 `oidc` 并失败关闭（拒绝而非放行） | 通过（`config.py:36-43`） |
| oidc 模式忽略 `X-User-Role`，角色仅来自 IdP 组声明 | 通过（`auth.py:56-72`，测试 148 行覆盖） |
| 角色白名单 + 越权 403 | 通过（`auth.py:70-71, 78-79`） |
| JWKS URL 仅 HTTPS / 本地回环 http | 通过（`config.py:55-64`，测试 126 行覆盖） |
| JWKS 响应体积上限 `512 KiB` + 非 2xx 拒绝 | 通过（`config.py:72-82`） |
| 配置缺失 → 校验前即 401（不泄露） | 通过（`auth.py:57-59`） |
| 无硬编码密钥/口令（正则扫描 `config.py`/`auth.py`） | 通过（0 命中） |
| `/healthz` 仍声明 `release_authorized: false` | 通过（`app.py`） |
| 统一错误包 `{"detail":{"code","message",...}}` 全路径一致 | 通过（`app.py:25-53`，`core/errors.py:20-42`） |
| 401 错误码字面量（UTF-8 十六进制 `55 4E 41 55 54 48 4F 52 49 5A 45 44` = `UNAUTHORIZED`）与夹具/测试逐字一致 | 通过（三层 sha256 相同 `87a5e00b…`） |

## 6. §7 第 2 项待裁决项（滚动）

`src/gods_workbench/static/js/canvas/http.js`（512 字节，无调用方）仍在 tracked 列表中，
目录名触犯 `AGENTS.md` §4.2「严禁携带 `static/js/canvas/`」字面。
其内容为对 `../http-transport.js` 的 16 行薄封装，登记于
`STATIC-SCOPE-REGISTRY-2026-09-20.md` 第 2 类「按契约/夹具自行重写」。
**建议**：(a) 删除（零功能损失、符合 §4.2）；或 (b) 保留并修订 §4.2 表述 + 补名实守卫。
删除属破坏性操作，**待用户裁决**。

## 7. 边界声明

- 本报告为**本地只读实测**；未执行真实 IdP 联调、未做生产部署与验收。
- 报告出具时工作树处于**未提交**状态（`HEAD == origin/master == b0f2589`），
  被测改动尚未进入任何已提交快照，故结论**不绑定**远端 CI。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 8. 受审快照绑定（LF 归一化 SHA-256）

本节绑定本报告审核时的工作树文件版本；下列哈希任一条变化即表示受审对象已变更，本报告结论需重算。

| 文件 | LF 归一化 SHA-256 |
|---|---|
| `src/gods_workbench/core/config.py` | `3B5FE6A028281A31F8CD0BDDB2D63E8A088A1D264578ED8CF7CCAF1E3E8BA902` |
| `src/gods_workbench/core/auth.py` | `D7E294F51FB41898FA313F65849B0D24C0C6880CA0AA43A8115C6EF8A7FD430D` |
| `src/gods_workbench/api/app.py` | `EB351F03F1EC911366ADDF1B40685CE942FC92B75A1EFBDF932544ACA273B349` |
| `src/gods_workbench/static/js/http-transport.js` | `0C2AB299A49081B58AE141221C921C76CBF7C077DDF865F891C7862B6945C6A9` |
| `src/gods_workbench/static/js/workspace-common.js` | `FDB20B75A68A6309CCF78243555A0B288B04B495B80312C4F2A75865DEDC00E9` |
| `src/gods_workbench/static/js/asset-share.js` | `DD8D2328A48381853958B7D9EA14644489137D53A2CF118D10DE6A6C1E69A8A3` |
| `tests/contracts/test_oidc_runtime_wiring.py` | `B37B885159E82D3BC558215B42FD5F432007C8DF88C23A4B2A5C014220DACCAE` |
| `tests/contracts/test_phase9_frontend_degradation.py` | `E8FE9CBBAA3D9F036399EC6009960C38CAD00C3D5D4785A233C88CCB4B2FA7CB` |

（基线提交 `HEAD == origin/master == b0f25897281eeee925bfe8b4d8e42d0344df0445`；上述文件均处**未提交**状态。）

---

## 9. R2 复核（2026-09-21 追加，仅追加不改动上文）

> 触发：D1/D2/D3/D4 修复已落入工作树，按本报告 §8 自身绑定规则需重算。
> 方法：**不复用实现方脚本**，在 `%TEMP%\gw-rev2-20260921\` 下另建 21 个独立探针复算。

### 9.1 上轮缺陷闭合情况

| 上轮 | 判定 | R2 独立复算证据 |
|---|---|---|
| D1 JWKS TTL 缓存被击穿 | **已修复** | 自建 2048-bit RSA + 计数探针：5 次 `require_authenticated` → JWKS 拉取 **1** 次（`r2_1_jwks_cache.json`） |
| D2 503 被误判为「未接入」 | **已修复** | Node 真实执行 `http-transport.js` 9 个响应级 + 6 个传输级用例全部通过：503 → `SERVICE_UNAVAILABLE`/`retryable=true`/`unavailable=false`；业务 404（对象 detail）原样透传（`r2_2_degradation.json`） |
| D3 缺行为级守卫 | **已修复** | 新增 `tests/contracts/test_phase9_degradation_runtime.py`（Node 真实执行，6 用例）已存在且通过 |
| D4 文档口径夸大 | **已修复** | `TASK-NOTES-2026-09-18.md` L1453-1568 已登记 D1 缺陷、修复方式与新口径 |
| §8 绑定表 4 条哈希失效 | **需重算** | 见 9.3-D10 |

### 9.2 §7 七项验收清单（R2 独立复算）

| # | 判定 | 独立证据 |
|---:|---|---|
| 1 迁移文件来源/哈希/闭包/授权 | **PASS** | 2 条 `ACCEPTED_MIGRATION` LF 归一化哈希逐字匹配（`r2_4_manifest.json`） |
| 2 项目中心/`god-canvas` 不依赖旧画布代码 | **PASS**（含 1 项待裁决） | `src/` 旧仓路径命中 **0**；`nested .git` **0** |
| 3 未引入旧仓 `.git`/历史/资源/用户数据 | **PASS** | tracked 269；白名单外二进制 **0**；仅 3 个思源黑体白名单在位 |
| 4 错误语义 401/403/409/202 | **PASS** | 契约测试命中数：`UNAUTHORIZED` 6 / `FORBIDDEN` 5 / `VERSION_CONFLICT` 8 / `CANVAS_VERSION_CONFLICT` 6 / `202` 28 |
| 5 `PLUGIN-PROTOCOL-SPEC` 未实现 | **PASS** | `src/` 下 `.py/.js/.html/.css` 命中 **0** |
| 6 当前工作树与测试输出已绑定 | **PASS** | `pytest` **114 passed**；`node --check` **54/0 failed**（node v24.20.0） |
| 7 仍为 NOT AUTHORIZED | **PASS** | 根级 `LICENSE`/`THIRD_PARTY_NOTICES.md` 均不存在；`/healthz` `release_authorized=false` |

401 错误码字面量复核：`core/errors.py:49` 与 `docs/fixtures/canvas-auth-401.json` 的 code 均为 **纯 ASCII** 12 字符，
UTF-8 十六进制 `554E415554484F52495A4544`，同形字排查 `_non_ascii_letters` = **0**（`r2_18_errorcode.json`）。

### 9.3 R2 新发现（上轮未覆盖）

| # | 严重性 | 问题 | 独立实测证据 |
|---|---|---|---|
| D5 | **中** | **重定向绕过 JWKS/discovery URL 白名单**：`is_allowed_jwks_url` 只校验初始 URL，`urlopen` 自动跟随 302，对**重定向目标不重新校验**。实测从白名单内的 `http://127.0.0.1` 302 到白名单外的 `http://0.0.0.0:28901` 仍取到文档（`fetch_ok=true`，目标被命中 2 次），而同址直配被白名单拒绝（`r2_21_redirect_local.json`） | 白名单语义由「仅 HTTPS 或本地回环」被降级为「首跳合法即可」。**影响上界（如实口径）**：读取到的响应体只在 `fetch_jwks` 内解析 `keys` 后丢弃，未回传给请求方，故当前的影响面是「受配置驱动的 SSRF 原语」，**不是**数据外泄通道 |
| D6 | **中** | **discovery 瞬时失败被永久固化**：`_RUNTIME_CACHE` 以环境变量指纹为键缓存 `ready=False`，环境变量不变时不会重试。实测 IdP 先不可用 → `ready=false`；同一进程内 IdP 恢复后仍 `ready=false`；清缓存后才 `ready=true`（`r2_7_cache_negative.json`） | 修复 D1 时引入的可用性回归：瞬时故障需重启进程才能恢复 |
| D7 | **低-中** | **「受控刷新一次」在 TTL 内形同虚设**：`oidc._resolve_public_key` 未知 kid 时调用 `jwks_fetcher()`，但该 fetcher 被 TTL 缓存拦下，返回同一份旧文档。实测第二次调用仍返回旧 kid，新 kid 不可解析（`r2_13_refresh.json`） | IdP 轮换密钥后的 300s 窗口内，合法新令牌全被 401 |
| D8 | **中** | **已登记的接受文档哈希漂移，且无测试守卫**：`docs/design/README.md` 在 `97b8b04` 被修改第 6 行，当前 LF 归一化 SHA-256 `38963FD67614F78CDC9AE5028A598CD9CA8233C2D70997515C10779B84786270`，与迁移清单登记的 `9118CE0AFCEE4DE1848DB1FC2E496090B0F60C79AF70DD79714FBAC0F749E10B` 不符。其余 10 条（2 迁移 + 8 文档）全部匹配。`tests/hygiene/test_cleanroom_hygiene.py` 仅断言 2 个代码切片，**未覆盖 9 条 `ACCEPTED_DOC_MIGRATION`**，故 CI 不会发现 | 修改本身内容合理（对齐字体白名单新规），但**清单未同步、守卫缺失** |
| D9 | **低** | `P9-ACCEPTANCE-AUDIT.md` 内部口径不一致：§1 第 6 项与 §6 写 **100 passed**（L17/L125/L153），§8.4 写 **114 passed**（L213/L233）。同一文档两个门禁数字并存 | 以当前实测为准应为 **114** |
| D10 | **低** | 本报告 §8 绑定表 **4 条哈希已失效**：`http-transport.js`、`workspace-common.js`、`test_oidc_runtime_wiring.py`、`test_phase9_frontend_degradation.py`（D1/D2 修复后重写）。按 §8 自身规则需重算 | 逐条对照结果见 R2 复算 |

### 9.4 R2 通过项补强（独立复核，未复用实现方脚本）

- 失败关闭：未知模式 → 按 `oidc` 处理且 `ready=false`；缺 issuer/audience → `ready=false`。
- `X-User-Role` 在 oidc 模式被忽略（真实 HTTP 本地 IdP E2E：`gw-readonly` + 伪造 `governor` 头 → **403**）。
- JWKS 体积上限 512 KiB / discovery 上限 128 KiB / 非 2xx 拒绝 / 非 JSON 拒绝，均在位。
- 无硬编码密钥、令牌或客户端凭据（源码扫描 0 命中）。
- `/healthz` 暴露 `auth_mode`/`oidc_ready`/`release_authorized: false`，`release_authorized` 未被改动。
- `node --check`（非 vendor 已跟踪 `.js`）**54/54 通过，0 失败**。

### 9.5 处置建议（按优先级）

1. **D5 必须先修**：`fetch_jwks` / `fetch_discovery_document` 改为**禁用自动重定向**（`urllib.request.HTTPRedirectHandler` 子类返回 `None`）或对每一跳重新执行 `is_allowed_jwks_url`，并补一条「重定向到白名单外必须失败」的行为用例。
2. **D8 必须处置**：要么把 `docs/design/README.md` 的改动**回退**到登记哈希，要么**同步更新清单哈希并新增 9 条文档的守卫用例**；二者择一，不能维持现状。
3. **D6 建议修**：`ready=False` 的运行期配置**不进缓存**（或加短负缓存 TTL），避免瞬时故障需重启。
4. **D7 建议修**：区分「TTL 内正常读取」与「未知 kid 触发的受控刷新」（例如刷新路径绕过 TTL，或 TTL 收到远小于密钥轮换窗口）。
5. **D9/D10 文档同步**：统一门禁数字，重算 §8 绑定表。

### 9.6 边界声明（R2）

- 全部结论为**本地只读实测**（Windows / CPython 3.11.9 / Node v24.20.0）；**未**做真实 IdP 生产接线、**未**做生产部署与验收。
- 被测对象为**未提交工作树**（`HEAD == origin/master == b0f25897281eeee925bfe8b4d8e42d0344df0445`），故结论**不绑定**远端 CI。
- R2 未修改任何被测源码或测试，未执行 `git add` / `commit` / `push`，未删除任何文件。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


---

## 10. R3 闭环（2026-09-21 追加，仅追加不改动上文）

> 处置 R2 报告 §9.3 的 D5–D10；本轮为**实现方修复**，非独立审核，
> 因此 §8/§9 的哈希重算与本节结论均属**主代理自采证据**。

### 10.1 缺陷处置

| # | 严重性 | 处置 | 落地 |
|---|---|---|---|
| D5 | 中 | **已修** | `core/config.py` 新增 `_NoRedirectHandler`（任何 3xx 返回 `None`）+ `_NO_REDIRECT_OPENER`，`_read_limited` 改走该 opener；**重定向一律失败关闭**，不再存在「首跳合法即可」的降级 |
| D6 | 中 | **已修** | `_NEGATIVE_CACHE` 短负缓存（`NEGATIVE_CACHE_SECONDS = 5`）；`ready=False` 不再长期固化，故障可自愈且不会每请求重打 IdP |
| D7 | 低-中 | **已修** | `build_jwks_fetcher` 增加 `force_refresh()`（绕过 TTL + `FORCE_REFRESH_MIN_SECONDS = 10` 限流）；`oidc._resolve_public_key` 先走 TTL 常规路径，仍未命中才受控强刷一次 |
| D8 | 中 | **已处置** | 清单追加「哈希更正登记（2026-09-21）」，登记 `docs/design/README.md` 现行 LF 归一化 SHA-256；`tests/hygiene/test_cleanroom_hygiene.py` 新增 `test_accepted_doc_slices_match_migration_manifest`，对全部 **9 条** `ACCEPTED_DOC_MIGRATION` 做内容守卫（同路径多登记取最后一条） |
| D9 | 低 | **已修** | `P9-ACCEPTANCE-AUDIT.md` 统一为 **119 passed**（原 100/86/112/114 并存） |
| D10 | 低 | **已修** | 本节上方 §8 绑定表已按当前工作树重算 |

### 10.2 新增回归用例（`tests/contracts/test_oidc_runtime_wiring.py`）

- `test_redirect_to_non_whitelisted_host_is_rejected`：白名单内首跳 302 到 `http://0.0.0.0:PORT`，
  断言抛出异常且**白名单外目标命中 0 次**（D5）。
- `test_discovery_failure_recovers_without_process_restart`：discovery 失败后同进程内重试应恢复（D6）。
- `test_unknown_kid_forces_refresh_bypassing_ttl`：TTL 内未知 kid 触发 `force_refresh` 真实外呼（D7）。
- `test_verify_jwt_accepts_rotated_kid_within_ttl_window`：端到端验证轮换密钥令牌在 TTL 窗口内被接受（D7）。

### 10.3 本轮门禁（主代理实测）

```
python -m pytest -q --no-header -p no:cacheprovider   -> 119 passed
node --check（非 vendor .js，54 个）                     -> 54/0 failed
二进制白名单越界                                        -> 0（仅 3 个思源黑体）
```

### 10.4 当前受审快照（LF 归一化 SHA-256，2026-09-21 R3）

| 文件 | SHA-256 |
|---|---|
| `src/gods_workbench/core/config.py` | `3B5FE6A028281A31F8CD0BDDB2D63E8A088A1D264578ED8CF7CCAF1E3E8BA902` |
| `src/gods_workbench/core/auth.py` | `D7E294F51FB41898FA313F65849B0D24C0C6880CA0AA43A8115C6EF8A7FD430D` |
| `src/gods_workbench/core/oidc.py` | `BAD2F16148308F10AC6DFC338E1D16EBD8494F693345F42648B57E2FB1FFBAFD` |
| `src/gods_workbench/api/app.py` | `EB351F03F1EC911366ADDF1B40685CE942FC92B75A1EFBDF932544ACA273B349` |
| `src/gods_workbench/static/js/http-transport.js` | `0C2AB299A49081B58AE141221C921C76CBF7C077DDF865F891C7862B6945C6A9` |
| `src/gods_workbench/static/js/workspace-common.js` | `FDB20B75A68A6309CCF78243555A0B288B04B495B80312C4F2A75865DEDC00E9` |
| `src/gods_workbench/static/js/asset-share.js` | `DD8D2328A48381853958B7D9EA14644489137D53A2CF118D10DE6A6C1E69A8A3` |
| `tests/contracts/test_oidc_runtime_wiring.py` | `B37B885159E82D3BC558215B42FD5F432007C8DF88C23A4B2A5C014220DACCAE` |
| `tests/contracts/test_phase9_degradation_runtime.py` | `5AB918E4FBEBB2E6603C03CEADF79298D4785ECC7D5B6DEB49005D26CCCF05B8` |
| `tests/contracts/test_phase9_frontend_degradation.py` | `E8FE9CBBAA3D9F036399EC6009960C38CAD00C3D5D4785A233C88CCB4B2FA7CB` |
| `tests/hygiene/test_cleanroom_hygiene.py` | `19D9D3858AB4FDA0718A6E78FA703004EE7822FB370672CD6CBD4B34A78C43EA` |
| `requirements.txt` | `0664213E430EB7D679CB99926181EBB3C412D0F11ACE7AD700383BF70F0B20EA` |

### 10.5 边界声明（R3）

- 本轮结论为**实现方自采**，不构成独立审计结论；D5–D10 的最终确认仍需独立复核。
- 未接入生产 IdP、未做 authorization code/PKCE 回调、未做密钥轮换并发窗口压测、未执行生产验收。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

---

## 11. R3 独立闭环确认（2026-09-21 追加，仅追加不改动上文）

> 主体：**独立审核方**（非实现方）。对 §10「R3 闭环」逐条复算，方法为**自建探针 + 突变测试**，
> 全程只读仓库，未修改任何被测源码、未 `git add/commit/push`。证据目录：`%TEMP%\gw-rev2-20260921\`。

### 11.1 逐条复核结论

| # | §10 声称 | 独立复核 | 证据 |
|---|---|---|---|
| D5 | 禁用自动重定向 | **确认成立** | 自建 302 探针：白名单内首跳 → 白名单外 `http://0.0.0.0:PORT`，目标命中 **0** 次且抛 `HTTPError: 302`；同址直配亦被白名单拒绝（`r3_a_redirect.json`）。**关键**：把 `_read_limited` 改回 `urlopen`（补回 import）后该守卫**确实失败**（`r4_5.json`），证明它不是假守卫 |
| D6 | 失败结果短负缓存（自愈） | **确认成立** | 自建真实 discovery 服务：IdP 先不可用 → `ready=false`；启动后立即仍 `false`（负缓存窗口内，符合设计）；等待 `NEGATIVE_CACHE_SECONDS+1s` → `ready=true` 且解析出 `jwks_url`（`r3_c_d6_d7.json`）。突变「非 ready 也进长期缓存」→ 守卫失败（`r4_3.json`） |
| D7 | 未知 kid 走 `force_refresh()` 绕过 TTL | **确认成立** | 探针：常规读取命中 TTL 返回旧文档；`force_refresh()` 返回新文档（`r3_c_d6_d7.json`）。突变「force_refresh 退化为普通读」→ 守卫失败（`r4_2.json`）。**抗自 DoS 实测**：连续 200 次 `force_refresh()` 仅多 1 次外呼（`FORCE_REFRESH_MIN_SECONDS=10` 限流生效）；窗口过后放行（`r5_force_refresh_dos.json`） |
| D8 | 清单追加哈希更正 + 新增文档守卫 | **确认成立** | 清单 11 条按 **latest-wins** 全部匹配磁盘（含追加的 README 更正条目）。新增 `test_accepted_doc_slices_match_migration_manifest` 覆盖 9 份 `ACCEPTED_DOC_MIGRATION`。**突变测试**：改写任一登记文档 → 失败；把清单哈希改回旧值 → 失败（`r4_1_mutation.json`） |
| D9 | 门禁数字统一 | **确认成立** | `P9-ACCEPTANCE-AUDIT.md` 全文仅出现 **119 passed**，`100`/`114` 已清除；`TASKS.md` L132/L154 亦为 119（`r3_final.json`） |
| D10 | §8 绑定表已重算 | **确认成立** | §8（8 条）与 §10（12 条）逐条 LF 归一化 SHA-256 与磁盘一致，stale **0**（`r3_final.json`） |

### 11.2 §7 七项验收清单（R3 最终快照）

| # | 判定 | 独立证据 |
|---:|---|---|
| 1 迁移文件来源/哈希/闭包/授权 | **PASS** | 11 条登记（2 迁移 + 9 文档）latest-wins 全部逐字匹配 |
| 2 项目中心/`god-canvas` 不依赖旧画布代码 | **PASS**（含 1 项待裁决） | `src/` 旧仓路径命中 0；`nested .git` 0 |
| 3 未引入旧仓 `.git`/历史/资源/用户数据 | **PASS** | tracked 269；白名单外二进制 **0**；仅 3 个思源黑体在位 |
| 4 错误语义 401/403/409/202 | **PASS** | 契约测试命中：401/403/409/`CANVAS_VERSION_CONFLICT`/202 均在位 |
| 5 `PLUGIN-PROTOCOL-SPEC` 未实现 | **PASS** | `src/` 下命中 **0** |
| 6 当前工作树与测试输出已绑定 | **PASS** | `pytest` **119 passed**；`node --check` **54/0 failed**；`tests/hygiene` **7 passed** |
| 7 仍为 NOT AUTHORIZED | **PASS** | 根级 `LICENSE`/`THIRD_PARTY_NOTICES.md` 不存在；`/healthz` `release_authorized=false` |

### 11.3 R3 残留观察（不阻塞，但需登记）

| # | 严重性 | 观察 | 证据 |
|---|---|---|---|
| O1 | 低 | **D6 守卫未覆盖出厂默认值**：`test_discovery_failure_recovers_without_process_restart` 内部 `monkeypatch.setattr(NEGATIVE_CACHE_SECONDS, 0)`，只验证「负缓存逻辑存在」，不验证 `NEGATIVE_CACHE_SECONDS = 5` 这个**出厂值**是否合理。实测把默认值改成 `10**9`（等同永久固化）守卫**仍通过** | `r4_3.json` 的 `mutC_negative_ttl_huge` |
| O2 | 低 | D5 现已「重定向一律失败关闭」，属**有意收紧**：即使 302 指向的**也是**白名单内主机（如 127.0.0.1），同样会失败。真实 IdP 若用 302 跳转到规范 JWKS 地址将不可用。当前无真实 IdP 接线，故不构成缺陷；接入生产 IdP 前需复核 | 对照实测：`B_allowed_redirect` 亦 `fetch_ok=false`（`r3_a_redirect.json`） |
| O3 | 低 | `P9-ACCEPTANCE-AUDIT.md` 的 §1 第 6 项把门禁写为 PASS，依据是 119 passed —— 但该 119 是**未提交工作树**上的本地实测；远端 CI 仍停在 `b0f2589`（86 passed 口径），**不覆盖本轮改动**。该报告自身的 §6/§8 已如实标注，但表头易被误读为「已绑定的远端证据」 | `git rev-parse HEAD == origin/master == b0f2589`（本地工作树未提交） |

### 11.4 §7 第 2 项待裁决项（滚动保留，未变）

`src/gods_workbench/static/js/canvas/http.js`（512 B，无任何调用方，仅被自身与文档引用）仍触犯
`AGENTS.md` §4.2「严禁携带 `static/js/canvas/`」的**字面**表述。建议：(a) 删除；或 (b) 修订 §4.2 表述
以区分「上游旧实现」与「同路径自写薄封装」并补名实守卫。删除属破坏性操作，**待用户裁决**。

### 11.5 边界声明（R3）

- 全部结论为**本地只读实测**（Windows / CPython 3.11.9 / Node v24.20.0）。
- 被测对象为**未提交工作树**（`HEAD == origin/master == b0f25897281eeee925bfe8b4d8e42d0344df0445`），
  故 §11 结论**不绑定**远端 CI；提交后的远端 CI 读回需另行完成。
- **未**接入生产 IdP、**未**做 authorization code / PKCE 回调、**未**做密钥轮换并发压测、**未**做生产验收。
- 真正的**外部第三方**独立审计仍未安排（本轮与 Phase 6/7/9 同类，独立性限于「实现主体与审核主体分离 + 自建探针 + 突变测试」）。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


---

## 12. R4：R3 残留观察处置（2026-09-21 追加，实现方自采）

> R3 报告 §11.3 提出 3 项不阻塞观察；本节登记处置结果。**仍属实现方自采**，
> 不是独立审计结论。

| # | R3 观察 | 处置 | 文件 |
|---|---|---|---|
| O1 | D6 守卫未覆盖负缓存**出厂默认值**（把默认值改成 `10**9` 仍会通过） | **已修**：新增 `test_negative_cache_default_is_bounded`，断言 `0 < NEGATIVE_CACHE_SECONDS <= 60` 且 `FORCE_REFRESH_MIN_SECONDS > 0` | `tests/contracts/test_oidc_runtime_wiring.py` |
| O2 | 重定向「一律失败关闭」也会拒绝**白名单内**跳转（同一 IdP 换路径） | **已升级**：`_NoRedirectHandler` → `_ValidatingRedirectHandler`，对**每一跳**重新执行 `is_allowed_jwks_url`，非法返回 `None`（失败关闭），白名单内跳转允许，跳数上限 `_MAX_REDIRECTS = 3`；新增 `test_redirect_within_whitelist_is_followed` | `src/gods_workbench/core/config.py`、`tests/contracts/test_oidc_runtime_wiring.py` |
| O3 | 验收报告 §1 第 6 项的本地实测数字置于「验收 PASS」语境，易被误读为远端 CI 已通过 | **已修**：在结论总览表后插入「门禁口径限定（O3）」注记，明确为未提交工作树的本地实测、不覆盖 `b0f2589` | `docs/governance/agent-reports-2026-09-21/P9-ACCEPTANCE-AUDIT.md` |

### 12.1 处置后门禁（实现方实测）

```
python -m pytest -q --no-header -p no:cacheprovider   -> 121 passed
node --check（非 vendor .js，54 个）                     -> 54/0 failed
```

### 12.2 证伪记录（O2 升级后重做）

- 把 `_ValidatingRedirectHandler.redirect_request` 的逐跳校验删掉（恢复为无条件跟随）后，
  `test_redirect_to_non_whitelisted_host_is_rejected` **确实失败**（`DID NOT RAISE Exception`），
  改完已还原 → 证明该守卫真实有效。

### 12.3 当前工作树关键文件（LF 归一化 SHA-256，R4 快照）

| 文件 | SHA-256 |
|---|---|
| `src/gods_workbench/core/config.py` | `3B5FE6A028281A31F8CD0BDDB2D63E8A088A1D264578ED8CF7CCAF1E3E8BA902` |
| `src/gods_workbench/core/auth.py` | `D7E294F51FB41898FA313F65849B0D24C0C6880CA0AA43A8115C6EF8A7FD430D` |
| `src/gods_workbench/core/oidc.py` | `BAD2F16148308F10AC6DFC338E1D16EBD8494F693345F42648B57E2FB1FFBAFD` |
| `src/gods_workbench/api/app.py` | `EB351F03F1EC911366ADDF1B40685CE942FC92B75A1EFBDF932544ACA273B349` |
| `src/gods_workbench/static/js/http-transport.js` | `0C2AB299A49081B58AE141221C921C76CBF7C077DDF865F891C7862B6945C6A9` |
| `src/gods_workbench/static/js/workspace-common.js` | `FDB20B75A68A6309CCF78243555A0B288B04B495B80312C4F2A75865DEDC00E9` |
| `src/gods_workbench/static/js/asset-share.js` | `DD8D2328A48381853958B7D9EA14644489137D53A2CF118D10DE6A6C1E69A8A3` |
| `tests/contracts/test_oidc_runtime_wiring.py` | `B37B885159E82D3BC558215B42FD5F432007C8DF88C23A4B2A5C014220DACCAE` |
| `tests/contracts/test_phase9_degradation_runtime.py` | `5AB918E4FBEBB2E6603C03CEADF79298D4785ECC7D5B6DEB49005D26CCCF05B8` |
| `tests/contracts/test_phase9_frontend_degradation.py` | `E8FE9CBBAA3D9F036399EC6009960C38CAD00C3D5D4785A233C88CCB4B2FA7CB` |
| `tests/hygiene/test_cleanroom_hygiene.py` | `19D9D3858AB4FDA0718A6E78FA703004EE7822FB370672CD6CBD4B34A78C43EA` |
| `requirements.txt` | `0664213E430EB7D679CB99926181EBB3C412D0F11ACE7AD700383BF70F0B20EA` |

### 12.4 边界（R4）

- 未接入生产 IdP、未做 authorization code / PKCE 回调、未做密钥轮换并发压测、未执行生产验收。
- 全部结论为**未提交工作树**的本地实测，**不绑定**远端 CI。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


---

## 13. R5 / R6 闭环：R6-8 修复与前端降级收口（2026-09-21 追加，实现方自采 + 独立复核读回）

> 本节**仅追加**，不修改 §0–§12 的任何历史行与哈希快照。
> 落盘权说明：本节由**主代理**（实现方）依据独立复核代理的实测结论登记；
> 独立复核方另出具 `docs/governance/agent-reports-2026-09-21/P9-D-INDEPENDENT-REVIEW.md`，
> 其结论与本节交叉印证，但**同框架内复核 ≠ 外部第三方审计**。

### 13.1 R6-8（高）：OIDC 重定向逐跳重校验未锁同源 —— 已修复

- **缺陷**：`src/gods_workbench/core/config.py` 的 `_ValidatingRedirectHandler.redirect_request`
  在跟随重定向时逐跳重校验「目标在白名单范围内」，但**未校验同源**，异源 302 被跟随。
- **复现（修复前）**：双端口真实 HTTP，`fetched kids = ['ATTACKER-KEY']`、attacker hits = **1**。
- **修复**：`redirect_request` 增加「与**起始 origin** 同源」校验（`is_same_origin_as`）；
  起始 origin 由 `_read_limited` 在发请求前写入 `threading.local()`（`_REDIRECT_GUARD`），
  `finally` 恢复，避免并发串号；**未绑定起始 origin 时一律拒绝**。
- **实测（修复后）**：`exception: HTTPError 302`、attacker hits = **0**、`VERDICT: blocked`。
- **新增守卫**：`tests/contracts/test_phase9d_r6_hardening.py` 追加 3 条（累计 20 用例）；
  `tests/contracts/test_oidc_runtime_wiring.py` 的 `test_redirect_within_whitelist_is_followed`
  重写为**真正同源**（同一台服务器 `/jwks` → `/keys`），并新增 `test_redirect_to_foreign_origin_is_blocked`。
- **独立复核要求**：303 / 307、相对 Location、主机名大小写、显式端口 vs 默认端口、IDN/punycode、多跳链式、
  并发串号 —— 由 `P9-D-INDEPENDENT-REVIEW.md` 逐条给出实测结果。

### 13.2 R6-7（中）：会话绝对过期上限 —— **未实施，已登记待裁决**

`src/gods_workbench/core/session.py` 的 `get_session` 目前**只有滑动过期**，无绝对过期上限。
本轮**未实施**，登记为待用户裁决项（见 `docs/governance/TASK-NOTES-2026-09-18.md` §21.13.6）。

### 13.3 前端「无后端时显式降级」收口（用户裁决第 3 项）

补齐 §9/§11 未覆盖的入口，**全部明说未接入 / 未验证**：

- `v2/js/home-controller.js`：删除伪造工程目录（`proj-demo-*` / `proj-local-*`）与伪造资产 `AURA_Protagonist_*` 等 4 条；
  `/api/chat` 失败不再谎称「已调配本地智能体管线，就绪待命」。
- `v2/js/projects-controller.js`：整体删除 `getDemoProjects()`（含 `proj-trash-01`）；
  写路径「只有后端确认成功才提示成功」；计数不可知显示 `—`。
- `v2/workshop.html`（内联脚本）：`demoProjectCatalog` **不再并入真实 `projects`**；
  分集失败不再伪装成「该项目没有分集」；`prevProject` / `nextProject` 增加空目录守卫。
- 头像键帽 / 席位凭据块 / 就绪·在线断言：全部改为显式未接入占位，**只有真实认证成功**才点亮绿色
  （`.hw-avatar-keycap-status` 默认中性琥珀脉冲，`data-gw-identity="authenticated"` 才为绿色）。

### 13.4 新增跨模块一致性守卫（回应独立复核 D-建议）

- 新增 `tests/contracts/test_phase9d_cross_module_consistency.py`（6 用例，Node 真实执行），
  同时加载 `static/js/degradation.js` 与 `static/js/http-transport.js`，对 10 个输入逐条对照。
- **分歧数 = 0**（对照表见 `docs/governance/TASK-NOTES-2026-09-18.md` §21.13.4）。此守卫防止任一侧改判定后 CI 不报错。

### 13.5 口径漂移更正（登记）

§11.2 L328 与 §9.2 L202 写「tracked **269**」，实为 **275** —— **本轮不改写历史行**，
在 `docs/governance/TASK-NOTES-2026-09-18.md` §21.13.6 登记为待裁决项 **O6**。

### 13.6 本轮门禁（主代理实测，未提交工作树）

```text
python -m pytest -q --no-header -p no:cacheprovider                 -> 160 passed
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene    -> 11 passed
python -m pytest -q --no-header -p no:cacheprovider tests/contracts/test_phase7_projects_id_contract.py -> 10 passed
node --check（非 vendor .js，55 个）                                  -> 55 / 0 failed
同形字扫描（28 个改动文件，ord() 判定）                                 -> 0 命中
```

### 13.7 独立性与边界

- 本节由**实现方（主代理）**自采登记；R6-8 / 前端降级的**独立复算**见 `P9-D-INDEPENDENT-REVIEW.md`。
- **同框架内复核 ≠ 外部第三方独立审计**；**未**接入生产 IdP；**未**做令牌撤销与密钥轮换并发压测。
- `_SESSIONS` / `_FLOW_STATES` 为**单进程内存存储**；多实例 / 多 worker 部署前必须换外部共享存储。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；发布授权**待第三方独立审计完成**。

---

## §14 Phase 9E / 9F / 9G 追加登记（2026-09-21，**落盘权 = 主代理**）

> 本节由**主代理**追加登记；§13.x 及其以前各节的数字/判断为**当时真实值**，**不就地改写**。
> 独立复核方（R6，外部线程）另行出具 `P9-D-INDEPENDENT-REVIEW.md`；**本节不代表其结论**。

### 14.1 本轮由**独立复核方**发现、主代理复核并已修复的真实缺陷

| 编号 | 缺陷 | 影响 | 状态 |
|---|---|---|---|
| R6-9 | `static/js/asset-review.js` 授权门禁 **fail-open**：`can()` 依赖后端**不存在**的 `auth_required` 字段，`!undefined === true` | **未认证访客**在 `asset-manager.html` / `v2/collab.html` 被判为拥有 admin/editor/reviewer **全部权限** | **已修复**（fail-closed + `needsLogin()` + 显式降级） |
| R6-10 | 真实 IdP 互操作：Google `issuer` 与 `jwks_uri` / `token_endpoint` **跨主机**，原「逐字同源」判据使其**无任何配置可接线** | `oidc_ready=false`、`/api/asset-auth/login` **503 OIDC_NOT_CONFIGURED** | **已修复**（opt-in `GW_OIDC_ENDPOINT_HOSTS`，默认严格） |
| R6-12 | `X \|\| 默认值` 静默伪造：`progress \|\| 10/60/75`、`scenes \|\| 24`、`shots \|\| 72` | 后端 `create_project()` 即 `progress=0.0`，**真实 0% 被显示成 10% / 60% / 75%**（与真实值相反） | **已修复**（`Number.isFinite` 判定 + 显式「未接入」+ Node 行为级守卫） |

### 14.2 主代理本轮独立发现并修复的事项

- 顶栏拟物推子的**具体读数**（`78% / 82% / 75% / 92% / 68% / 88%` 与 `14.8G / 18.4G / 12.2G`）
  会被读成真实算力/显存遥测 → 统一改为 **`0%` + 「未接入」+ 结构化降级标记**。
- 令牌交换路径原会跟随同源 3xx → 新增 `_NO_REDIRECT_OPENER`，**任何 3xx 失败关闭**。
- `authorization_endpoint` 与 `token_endpoint` 采用**刻意不对称**的受信口径（前者严格同源，后者可白名单）。

### 14.3 本轮门禁（主代理实测，未提交工作树）

```text
python -m pytest -q --no-header -p no:cacheprovider                 -> 208 passed
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene    -> 11 passed
node --check（static/ 下非 vendor 全量 55 个 + vendor 2 个）           -> 57 / 0 failed
同形字扫描（42 个改动文件，ord() 判定）                                 -> 0 命中
真实浏览器 E2E（16 页，Playwright/Chrome）                             -> pageerror 0
```

### 14.4 §13.1 / §13.7 对 `P9-D-INDEPENDENT-REVIEW.md` 的引用

§13.1 / §13.7 引用的 `docs/governance/agent-reports-2026-09-21/P9-D-INDEPENDENT-REVIEW.md`
**由独立复核方（外部线程）创建**；主代理**不创建、不改写**该文件，引用保持原样。

### 14.5 边界（不得外推）

- `GW_OIDC_ENDPOINT_HOSTS` 为**部署方显式 opt-in**；默认严格同源未变；本仓不预置第三方主机；
  其匹配为**幼稚逐字相等**（**无 PSL / 无 eTLD+1**），**不是通用安全边界**。
- 本地通过 ≠ 远端 CI ≠ 生产验收；**同框架内 / 外部线程复核 ≠ 外部第三方独立审计**。
- **未接入生产 IdP**；未做令牌撤销与密钥轮换并发压测；Google 联调仅覆盖元数据 / JWKS / 授权 URL 构造。
- `_SESSIONS` / `_FLOW_STATES` 为单进程内存存储；多实例 / 多 worker 前须换外部共享存储。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**，发布授权**待第三方独立审计完成**。
