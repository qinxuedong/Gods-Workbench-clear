# HANDOFF-4 —— 2026-09-20/21 Phase 4：发布门禁推进与独立终审

> 状态：**已完成（本地）**；本轮工作树**未提交、未 push**。
> 依据：根 `AGENTS.md`、`CLEANROOM-IMPLEMENTATION-HANDOFF.md` 阶段 4/5/Phase 8、`HANDOFF-3.md` §5–§6。
> 分支：`master`；基线提交：`c2d3758`（本地 HEAD == `origin/master`）。
> 任务书：`docs/governance/AGENT-TASK-2026-09-20-PHASE4.md`。

## 1. 本轮要解决什么

`HANDOFF-3.md` §6 列出三项未闭环：**真实外部 IdP / 许可证最终结论 / 运行时部署证据**。
Phase 4 只推进「可在本地复现、可被独立复核」的部分，**生产验收明确不在本轮范围**。

## 2. 已完成（文件级）

### 2.1 外部 IdP 影子校验（代理 A2）

- 新增 `src/gods_workbench/core/oidc.py`：纯函数式 OIDC/JWT 校验器。
  - 仅允许 `RS256`；显式拒绝 `alg=none` 与 `HS*` 算法混淆；拒绝 JWKS 携带私钥材料。
  - 校验 `iss` / `aud` / `exp` / `nbf` / `iat`（含可配置时钟容差）、`nonce`、`state`、PKCE S256。
  - 未知 `kid` 触发**注入式** `jwks_fetcher` 受控刷新；无 fetcher 即拒绝。
  - 组 → 角色映射（`gw-admin/gw-governor/gw-editor/gw-reviewer/gw-readonly`），**未知组不升级**，多组取最高。
  - **默认 `enabled=False`，失败关闭**；`core/auth.py` 与 `api/**` **零改动、不接线**。
- 新增 `tests/contracts/test_oidc_verifier.py`：**23 条**（正向 6 + 负向 17）；RSA 密钥运行时生成、不落盘。
- `requirements.txt` 追加 `cryptography>=42,<47`（避免自实现 RSA 验签；`License-Expression: Apache-2.0 OR BSD-3-Clause`）。

### 2.2 依赖锁与 SBOM（代理 A1 → 主代理重写）

- `requirements.lock`：**版本锁，非哈希锁**。
  - 主表 **30 条** = 干净 venv 真实安装后的 `pip freeze`（交付口径）。
  - 附表 **31 条** = 本机开发环境快照（对照）。
  - 登记平台差异：`uvicorn[standard]` 的 `uvloop` 仅非 Windows 安装（Linux CI/容器会装）。
- `docs/provenance/SBOM-2026-09-20.cdx.json`：CycloneDX 1.5，**39 组件**（31 library + 7 file + 1 framework）。
  - Python 组件许可逐条取自本机 METADATA（MIT / MIT-0 / BSD-3-Clause / BSD-2-Clause / MPL-2.0 / PSF-2.0 / Apache-2.0 OR BSD-3-Clause 等）。
  - `src/gods_workbench/static/vendor/**` 7 个文件逐个 SHA-256（**7/7 与磁盘一致**）。
  - Tailwind CDN 作为 `external` 组件登记 URL 未钉死版本的风险。

### 2.3 治理文档漂移更正（代理 A3）

- `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`、`docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`：**仅追加**更正注记（删除列均为 0）。
- 更正事实：`requirements.txt` / `requirements-dev.txt` 自 `97b8b04` 起已被跟踪，原文「无 requirements*.txt / 无锁文件」为漂移。

### 2.4 报告

- `docs/governance/agent-reports-2026-09-20/T-oidc-shadow.md`
- `docs/governance/agent-reports-2026-09-20/T-lock-sbom.md`（含 §7 更正记录）
- `docs/governance/agent-reports-2026-09-20/T-deploy-repro.md`

## 3. 独立终审（审核代理 B1）

- 报告：`attestations/reviews/PHASE-4-INDEPENDENT-REVIEW-2026-09-20.md`
- **R1：不可提交。** 本地门禁全绿，但指出 3 处报告口径缺陷。
- **修正**：① `T-lock-sbom.md` 原「未新增依赖」与 A2 实际新增 `cryptography` 冲突 → 已改为区分「本任务 A1 未改」与「本轮 A2 新增」；② `T-deploy-repro.md` 增加让读者必须连读 §8 的指针；③ `T-oidc-shadow.md` 原把 63 passed 等同 OIDC 专测 → 已改为 23 条专测 + 说明 63 为全仓结果。
- **R2：本地证据范围内可提交。** 三处修正闭环，未发现新缺陷。

## 4. 门禁实测（主代理复跑）

| 检查 | 命令 | 结果 |
|---|---|---|
| 全量测试 | `python -m pytest -q --no-header -p no:cacheprovider` | **63 passed** |
| JS 语法 | 全部 `.js` 的 `node --check` | **56/56 通过** |
| 二进制红线 | 全仓扫描（跳过 `.git`） | 违规 **0**；仅 3 个白名单 `.otf` |
| 治理文档追加性 | `git diff --numstat` | 删除列 **0** |
| 干净环境 | 新 venv `pip install -r requirements-dev.txt` | **成功（30 包）**，`pip check` 通过，63 passed |

## 5. 本轮踩坑（务必记住）

1. **子代理可能产出无法复算的数字。** A1 自报锁 29 条 / SBOM 37 组件，实测为 30 / 39，且多个版本号与 `pip freeze` 不符。**收口前必须由主代理逐条复算**。
2. **子代理沙箱 ≠ 主代理 shell 能力。** A2/A3/B1 均遇到「`python` 不在 PATH / 网络套接字被拒」，因而无法取得某些原始输出；A3 记录安装失败，主代理复跑才成功。**遇到「子代理说做不到」要自己验证一遍**，但**不得把主代理结果冒充子代理证据**。
3. **报告口径要与任务范围对齐。** 「未新增依赖」这类全局表述会与同轮其他任务冲突，需限定到具体任务。
4. **干净 venv 按 requirements 区间解析 ≠ 按 lock 精确安装。** 前者证明「依赖可安装」，不等于「锁可复现」。
5. **`uvicorn[standard]` 的平台差异**：Windows 无 `uvloop`，Linux 有；跨平台锁不可只看本机 `pip freeze`。

## 6. 提交、推送与远端 CI 实测

- 提交：`fa6b374a2449a18ba91902eba696d94828e8728f`（16 文件，+2603 / -0；逐文件 `git add`，未用 `-A`）。
- push：`c2d3758..fa6b374` → `origin/master` 成功；本地 HEAD == `origin/master`；工作树干净。
- 远端 CI run `35521632747` = **success**：
  - Linux `Python 3.11.16` → **`63 passed, 2 warnings in 0.50s`**；
  - 「扫描二进制白名单」通过（仅 3 个白名单 `.otf`）；
  - CI 解析出 `fastapi 0.141.1 / pydantic 2.13.5 / uvicorn 0.53.0`，与 `requirements.lock` **主表（干净 venv 实测）逐版本一致**。
- 证据命令：`gh run list --workflow CI --branch master --limit 3`、`gh run view 35521632747 --log`。

## 6.1 边界

- **本地通过 ≠ 远端 CI ≠ 生产验收。**
- 上一轮远端 CI（`35512673637` / `35512832677` / `35512899099`）= success，但绑定提交 `8c955e2`~`c2d3758`，**不覆盖本轮工作树**。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；字体放行 ≠ 分发授权。
- 未新增根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`（`AGENTS.md` §1.4）。

## 7. 未闭环（下一步候选）

1. **真实外部 IdP**：`verify_jwt` 尚未被任何生产路径调用；无 feature flag、无灰度、无真实 issuer/JWKS、无 Cookie/CSRF/CORS/撤销策略。
2. **许可证最终结论**：提示词快照 6 个 `sources/*.json` 与 Tailwind CDN 的完整许可证闭包；根级 NOTICE/LICENSE 仍未建立。
3. **可复现构建**：哈希锁（wheel/sdist SHA-256）、SBOM 签名与来源证明（SLSA / in-toto）、按 lock 精确重装的干净环境验证、Linux/容器闭包验证。
4. **生产验收**：反向代理/TLS、健康探针、持久化与备份恢复、并发与回滚演练、真实流量与独立人工签字。
5. **发布治理**：远端 CI 必需检查、审批记录、独立安全/许可审核。

## 8. 本轮新增/修改文件清单

新增：

- `src/gods_workbench/core/oidc.py`
- `tests/contracts/test_oidc_verifier.py`
- `requirements.lock`
- `docs/provenance/SBOM-2026-09-20.cdx.json`
- `docs/governance/AGENT-TASK-2026-09-20-PHASE4.md`
- `docs/governance/agent-reports-2026-09-20/T-oidc-shadow.md`
- `docs/governance/agent-reports-2026-09-20/T-lock-sbom.md`
- `docs/governance/agent-reports-2026-09-20/T-deploy-repro.md`
- `attestations/reviews/PHASE-4-INDEPENDENT-REVIEW-2026-09-20.md`
- 本文件

修改（纯追加）：

- `requirements.txt`（+`cryptography>=42,<47`）
- `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`
- `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`
- `CLEANROOM-STATUS.md`
- `docs/governance/TASKS.md`
- `docs/governance/TASK-NOTES-2026-09-18.md`
