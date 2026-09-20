# Phase 4 任务书（2026-09-20 第三轮：发布门禁推进）

> 本文件为**共享任务书**（主代理 /root 编写），Phase 4 全体代理必读。
> 仓库唯一根：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`，分支 `master`。
> 基线提交：`c2d3758`（本地 HEAD == `origin/master`，工作树干净）。
> 上游依据：`HANDOFF-3.md` §5/§6、`CLEANROOM-IMPLEMENTATION-HANDOFF.md` 阶段 4/5/Phase 8、
> `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`、`docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md`、
> `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`。

## 0. 硬规则（违反即作废）

1. 中文输出；遵守根 `AGENTS.md`（KISS、稳定 ID、CAS、标准错误包、端口 2077）。
2. **禁止** `git add` / `git commit` / `git push` / `git remote` / `git checkout` / `git restore` / `git reset`（主代理统一收口）。
3. **禁止** orca 及任何非 Codex 工具；禁止再派生子代理。
4. **禁止**新增图片 / 音视频 / 字体（`AGENTS.md` §1.2 的 3 个思源黑体白名单除外）。
5. **禁止**读取旧仓 `D:\Working\Code Pro\Gods-Workbench-release` 的源码/提交历史；只允许按任务书给出的实测事实引用。
6. 草稿写入 `%TEMP%\gw-<任务>-20260920\`，不得在仓库内留临时文件、`.pyc`、日志。
7. 不得把 python 脚本命名为 `re.py` / `glob.py` 等 stdlib 同名文件。
8. **证据边界**：本地测试通过 ≠ 远端 CI ≠ 生产验收；不得伪造任何数字、命令输出或截图。
9. 破坏性操作（删除、覆盖、白名单变更）一律不做；如认为必要，写入报告由用户裁决。
10. 不得新增根级 `LICENSE`（`AGENTS.md` §1.4：未经独立审计与合规评估前不得添加正式开源许可证）。

## 1. 本轮目标

`HANDOFF-3.md` §6 列出三项未闭环：**真实外部 IdP / 许可证最终结论 / 运行时部署证据**。
Phase 4 只做**可本地复现、可被独立复核**的推进，不声称任何项目"已完成生产就绪"。

| 任务 | 负责人 | 独占可写文件 | 产出报告 |
|---|---|---|---|
| P4-A2 外部 IdP 影子校验 | 代理 A2 | `src/gods_workbench/core/oidc.py`(新)、`tests/contracts/test_oidc_verifier.py`(新)、`requirements.txt` | `docs/governance/agent-reports-2026-09-20/T-oidc-shadow.md`(新) |
| P4-A3 治理文档漂移修正 + 部署可复现证据 | 代理 A3 | `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`(仅追加)、`docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`(仅追加) | `docs/governance/agent-reports-2026-09-20/T-deploy-repro.md`(新) |
| P4-A1 依赖锁定与 SBOM | 代理 A1 | `requirements.lock`(新)、`docs/provenance/SBOM-2026-09-20.cdx.json`(新) | `docs/governance/agent-reports-2026-09-20/T-lock-sbom.md`(新) |
| P4-B1 独立终审（对抗式） | 审核代理 B1 | `attestations/reviews/PHASE-4-INDEPENDENT-REVIEW-2026-09-20.md`(新) | 同左 |
| 收口 | /root | `HANDOFF-4.md`、`docs/governance/TASK-NOTES-2026-09-18.md`(仅追加) 等 | — |

## 2. P4-A2：外部 IdP 影子校验模块（代码，非生产切换）

依据 `docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md` 的 Phase 1「影子模式」。

要求：
1. 新建 `src/gods_workbench/core/oidc.py`，实现**纯函数式**的 OIDC/JWT 校验器，至少覆盖：
   - 签名校验（RS256；拒绝 `alg=none` 与算法降级、拒绝 `HS*` 混淆）；
   - `iss` / `aud` / `exp` / `nbf` / `iat` 校验，允许显式时钟容差参数；
   - 未知 `kid` 时的 JWKS 受控刷新回调（由调用方注入 `jwks_fetcher`，默认不可用即拒绝）；
   - `nonce` / `state` 校验（授权码+PKCE 流程辅助）；
   - 组 claim → 本地角色映射（`gw-admin/gw-governor/gw-editor/gw-reviewer/gw-readonly`），**未知组不升级**，多组取最高已授权等级。
2. **默认关闭、失败关闭（fail closed）**：所有配置缺失/异常路径必须拒绝，不得静默放行。
3. **不得修改** `src/gods_workbench/core/auth.py`、`src/gods_workbench/api/**` 的现有默认行为；本轮不接线、不切换流量。
4. 新增 `tests/contracts/test_oidc_verifier.py`：使用**测试内生成的本地 RSA 密钥**（不得写入仓库任何密钥/凭据）覆盖正向 + 至少 6 条负向用例（过期、错误 iss、错误 aud、未知 kid、alg 混淆、未知组）。
5. 需要使用 `cryptography` 时，在 `requirements.txt` 追加**带上下界**的依赖行（如 `cryptography>=42,<47`），并在报告中说明新增依赖的许可证（Apache-2.0 / BSD-3-Clause）与理由。
6. 门禁：`python -m pytest -q --no-header -p no:cacheprovider` 必须全绿（当前基线 40 passed，本轮新增用例后总数必须 > 40 且 0 failed）。

## 3. P4-A3：治理文档漂移修正 + 部署可复现证据

已知漂移（主代理实测）：
- `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md` 第 26–29 行称 Python 依赖「无 `requirements*.txt`/锁文件」；
- `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md` 第 32 行称「当前仓库没有 `requirements*.txt` 或锁文件」。
- 事实：`requirements.txt` 与 `requirements-dev.txt` 自提交 `97b8b04` 起已被跟踪。

要求：
1. **只追加**「更正注记」章节，不改写历史行；逐条给出原文行号、实测命令与结论。
2. 在 `%TEMP%` 下创建**全新虚拟环境**，按 `requirements-dev.txt` 实测安装（允许联网），记录：Python 版本、pip 版本、安装结果、`pip check`、安装后版本清单（`pip freeze` 摘要）。
3. 诚实记录失败：若联网/安装失败，原文粘贴错误并按「未完成」登记，不得改写成成功。
4. 重新核对并记录：`requirements.txt` / `requirements-dev.txt` 是否覆盖 `src/**` 与 `run.py` 的真实第三方 import（给出 import 扫描命令与结果）。
5. 明确写出：即使安装成功，也**不构成生产验收**；SBOM/锁文件由 P4-A1 负责，本任务不写 `requirements.lock`。

## 4. P4-A1：依赖锁定与 SBOM（**依赖 A2 完成后开始**）

要求：
1. 生成 `requirements.lock`：钉死 `requirements-dev.txt` 闭包内的**精确版本**（含传递依赖），文件顶部注明来源、生成时间、Python 版本与「版本锁，非哈希锁」的口径。
2. 生成 `docs/provenance/SBOM-2026-09-20.cdx.json`：CycloneDX 1.5 兼容 JSON，至少包含：
   - Python 依赖组件（name/version/PURL/license/scope），`scope=runtime` 与 `scope=test` 区分；
   - 仓库内运行时静态资源：`src/gods_workbench/static/vendor/**`（含 3 个白名单字体）逐项 SHA-256；
   - 外部 CDN 依赖（Tailwind CDN）作为 `external` 组件登记，并明确其未钉死版本的风险。
3. 生成过程必须**可复算**：报告中给出生成命令，并给出重算哈希的一致性验证输出。
4. 不得引入新依赖，不得修改 `requirements.txt`（由 A2 负责）。
5. 不得联网下载包（用已安装元数据 + 本地文件哈希即可）；如必须联网，先记录失败再退回本地口径。

## 5. P4-B1：独立终审（对抗式，最终门）

触发条件：A1–A3 全部产出且全绿。**不得采信任何被审代理的自述**。

必须覆盖：
1. 逐项回到仓库文件与命令输出复核 A1/A2/A3 的每条结论；指出任何夸大、错数或口径不符。
2. 复跑门禁并原文粘贴：`python -m pytest -q --no-header -p no:cacheprovider`；全部保留 `.js` 的 `node --check`；二进制红线扫描（跳过 `.git`）。
3. 证伪式抽查 ≥3 处「声称已完成」，用命令尝试推翻；推不翻才记 PASS。
4. 复核 `git status --porcelain -uall` 与改动清单是否一致；确认未新增根级 `LICENSE`、未改默认认证路径、未新增受限二进制。
5. 明确区分：本地实测 / 远端 CI / 生产验收。
6. 给出最终判定：**可提交 / 不可提交**，以及「是否可宣称发布或生产就绪」（默认答案应为否）。

## 6. 收口（主代理执行，禁止子代理）

1. 汇总 A1–A3 + B1，核对 `git status --porcelain -uall` 与 `git diff --stat`。
2. 追加 `docs/governance/TASK-NOTES-2026-09-18.md` 新小节（只追加）。
3. 新增 `HANDOFF-4.md`（本轮真实结论、未闭环项、下一步）。
4. 逐文件 `git add`（严禁 `-A`），中文提交信息，`git push`，读回远端 CI。
5. 生产验收仍为独立决策，不得由本地或 CI 结果假定完成。
