# T-oidc-shadow：外部 IdP 影子校验模块（P4-A2，代理 A2）

## 1. 目标

按 `docs/governance/AGENT-TASK-2026-09-20-PHASE4.md` §2「P4-A2」执行：
新增外部 IdP 影子校验模块（Phase 1 并行验证，不接线、不切换流量），
默认关闭、失败关闭，不修改 `core/auth.py` 与 `api/**` 的现有默认行为。

## 2. 实现

### 2.1 新增 `src/gods_workbench/core/oidc.py`

纯函数式影子校验模块，导出：

- `OidcConfig`：配置对象，`enabled` 默认 `False`；`jwks_fetcher` 由调用方注入，默认 `None`。
- `OidcIdentity`：校验通过后的最小身份上下文（不保存令牌原文）。
- `split_token` / `decode_header` / `decode_claims`：JWT 解析（仅解析）。
- `verify_jwt`：主校验入口。
- `resolve_role` / `normalize_groups`：组到本地角色映射。
- `generate_state` / `generate_nonce` / `verify_state` / `verify_nonce`：nonce / state 流程辅助。
- `generate_pkce_pair` / `build_authorization_url`：PKCE S256 与授权跳转 URL 构造。

### 2.2 新增 `tests/contracts/test_oidc_verifier.py`

使用**测试内运行时生成**的 RSA 2048 私钥签发验证令牌，密钥仅在内存，
不落盘、不入库。覆盖正向 6 条 + 负向 17 条，共 23 条。

### 2.3 `requirements.txt`

在文件末尾追加（不修改既有行）：

```
# 外部 IdP 影子校验（Phase 1，仅新增模块与测试，不接线）所需密码学依赖
cryptography>=42,<47
```

## 3. 逐条覆盖（任务书 §2 六条）

| 要求 | 实现 | 测试证据 |
|---|---|---|
| 1. 签名校验仅 RS256，拒绝 `alg=none` 与 `HS*` 混淆 | `ALLOWED_ALGORITHMS={"RS256"}`；`alg=none`/`HS*` 显式前置拦截；签名用 RSASSA-PKCS1-v1_5+SHA-256 | `test_alg_none_rejected`、`test_hs256_confusion_rejected`、`test_tampered_signature_rejected` |
| 1. `iss`/`aud`/`exp`/`nbf`/`iat` 校验 + 显式时钟容差 | `verify_issuer`/`verify_audience`/`verify_time_claims`，`leeway_seconds` | `test_valid_token_returns_identity`、`test_expired_token_rejected`、`test_wrong_issuer_rejected`、`test_wrong_audience_rejected`、`test_not_yet_valid_token_rejected`、`test_time_claims_within_leeway_pass` |
| 1. 未知 `kid` 时 JWKS 受控刷新（注入 `jwks_fetcher`，默认不可用即拒绝） | `_resolve_public_key`：先查缓存 JWKS，未命中且有 fetcher 才刷新一次，异常/仍缺失即拒绝，禁止盲重试 | `test_jwks_refresh_on_unknown_kid`、`test_unknown_kid_without_fetcher_rejected`、`test_jwks_fetcher_failure_rejected`、`test_jwks_with_private_material_rejected` |
| 1. `nonce`/`state` 流程辅助 | `verify_state`（常量时间比较）、`verify_nonce`、`generate_*`、PKCE S256 | `test_state_mismatch_rejected`、`test_nonce_mismatch_rejected`、`test_valid_token_with_expected_nonce`、`test_pkce_pair_uses_s256`、`test_authorization_url_contains_pkce_and_no_secret` |
| 1. 组→角色映射，未知组不升级，多组取最高已授权等级 | `GROUP_ROLE_MAPPING`（`gw-admin/governor/editor/reviewer/readonly`）；`resolve_role` 按 `ROLE_PRIORITY` 取最高；无命中返回 `None`，`verify_jwt` 失败关闭 | `test_group_mapping_takes_highest_authorized_role`、`test_group_mapping_is_case_insensitive`、`test_unknown_group_rejected`、`test_missing_groups_rejected` |
| 2. 默认关闭、失败关闭 | `OidcConfig.enabled=False` 默认；`verify_jwt` 先检查依赖/开关/配置，全部失败关闭 | `test_disabled_config_rejects` |
| 3. 不修改 `core/auth.py` 与 `api/**` | 未改动上述文件（`git diff --stat` 仅 `requirements.txt`） | `git status` / `git diff --stat` 输出见 §5 |
| 4. 测试内生成 RSA 密钥，正向 + ≥6 负向 | 23 条测试；负向 17 条（≥6） | `python -m pytest ... tests/contracts/test_oidc_verifier.py` → 23 passed |
| 5. `cryptography` 带上下界依赖 + 许可证 | `cryptography>=42,<47`；许可证 `Apache-2.0 OR BSD-3-Clause` | 本地包元数据（见 §4） |
| 6. 全量门禁 > 40 且 0 failed | 63 passed | §5 原始输出 |

## 4. 新增依赖与许可证

- 依赖行：`cryptography>=42,<47`（追加到 `requirements.txt` 末尾，未改动既有行）。
- 理由：RS256 签名校验、RSA JWK → 公钥转换、SHA-256 需要经审计的密码学实现；
  自实现 RSA 验签属于高风险，故引入 `cryptography`。
- 许可证：`cryptography` 当前本地元数据声明 `License-Expression: Apache-2.0 OR BSD-3-Clause`
  （`License-File: LICENSE.APACHE` / `LICENSE.BSD`）。即 Apache-2.0 或 BSD-3-Clause。
- 证据边界：以上许可证结论来自本机已安装包元数据（`cryptography-46.0.7.dist-info/METADATA`），
  属于「本地实测」口径；本轮不构成发布合规闭环，最终许可证结论由治理/独立复核裁定。

## 5. 原始命令输出

### 5.1 基线（改动前）

```
........................................                                 [100%]
40 passed in 0.41s
```

### 5.2 全量门禁 `python -m pytest -q --no-header -p no:cacheprovider`

```
...............................................................          [100%]
63 passed in 0.39s
```

（0 failed，63 > 40。注：本机 `PATH` 无 `python`，为执行该字面命令，
在 `%TEMP%\gw-a2-20260920\bin` 临时放置了一个 `python.cmd` 包装器，
转发到本机 Python 3.12 嵌入式解释器 + 复用纯 Python 的 pytest 9.1.1 /
cryptography 46.0.7；包装器与缓存均在 `%TEMP%`，未入库。运行时出现
`PytestRemovedIn10Warning: pytest.console_main() is deprecated`，不影响结果。）

### 5.3 单独运行新增测试文件

```
============================= test session starts =============================
collected 23 items

tests\contracts\test_oidc_verifier.py .......................            [100%]

============================= 23 passed in 0.10s ==============================
```

### 5.4 卫生自检

```
tests/hygiene ..........                                                 [100%]
10 passed in 0.15s
```

### 5.5 改动清单与工作区状态

```
 M requirements.txt
?? docs/governance/AGENT-TASK-2026-09-20-PHASE4.md   （他人任务书，非本代理写入）
?? src/gods_workbench/core/oidc.py
?? tests/contracts/test_oidc_verifier.py
```

```
git diff --stat
 requirements.txt | 3 +++
 1 file changed, 3 insertions(+)
```

`git diff --stat` 仅显示 `requirements.txt`，证明未改动 `core/auth.py` 与 `api/**` 的既有内容。
密钥/凭据扫描（`BEGIN ... PRIVATE KEY`）在两份新文件中均无命中，测试 RSA 密钥仅运行时生成、不落盘。

## 6. 证据边界声明

- 本轮为 **Phase 1 影子模式实现**：新增独立模块与契约测试，**不接线、不切换流量**。
- 未启用任何 feature flag，未配置真实 IdP，未对接任何真实 issuer / JWKS / 客户端密钥。
- 未执行任何真实登录、密钥轮换、TLS/反向代理或多实例验证。
- 未修改 `core/auth.py`、`api/**` 的现有默认行为；`X-User-Role` 仍是当前运行默认路径。
- 因此本报告**只能证明**：影子校验模块在本轮新增的 **23 条** OIDC 专测下行为正确。
  全量门禁（含既有用例）为 **63 passed**，该数字是全仓结果，不可单独归因于 OIDC 模块。
  它**不能证明** OIDC 已启用、生产就绪、满足发布门禁或通过独立复核。
- 本地 `pytest` 通过 ≠ 远端 CI 通过 ≠ 生产验收；生产验收需独立人员另行完成。
- 依赖许可证结论为本地元数据口径，不构成合规闭环。

## 7. 未完成 / 不确定项

- 未接线：`verify_jwt` 尚未被任何 API 或认证中间件调用，属预期（本轮范围）。
- 未实现真实的 JWKS HTTP 抓取（`jwks_fetcher` 由调用方注入）；本轮只验证刷新回调语义。
- 未定义 feature flag、未做灰度、未做安全审计（Cookie/CSRF/CORS/撤销策略）。
- 本机缺 `python` on PATH，门禁是经 `%TEMP%` 包装器在本机 Python 3.12 上跑出的；
  与目标 Python 3.11 存在版本差异，未在 3.11 上复跑。
- 未在 `requirements-dev.txt` 单独声明，因 `requirements-dev.txt` 已通过 `-r requirements.txt` 继承。