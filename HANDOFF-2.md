# HANDOFF-2 — 2026-09-20 收口索引

> **状态：已完成（本地）**。本文是洁净仓的交接索引，不是真源；release 真源仍为 `D:\Working\Code Pro\Gods-Workbench-release`。本轮未执行 `git add`、`git commit`、`git push`、`git remote`，也未修改他人输出文件。

## 1. 本轮四项裁决

1. **字体放行但不扩大授权**：Source Han Sans CN Bold/Medium/Normal 仅按根 `AGENTS.md` §1.2 三条精确路径列入白名单；开源字体放行不等于公开分发授权，洁净仓仍为 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。
2. **迁移范围**：`src/gods_workbench/static/v2/**` 整体保留；画布/工具仅保留入口首页；快捷工具入口及内部内容不迁移；comfyui/runninghub 不迁移。
3. **交接文档**：`HANDOFF.md` §1 已换成 2026-09-20 release 实测标签并保留历史快照注记；本文件建立；`T-handoff.md` 记录证据。
4. **Phase 3 与发布治理**：Phase 3 重签、当前快照审计、许可合规、外部 IdP、部署验收，以及 push/CI/生产验收均不得由本地文档假定完成，必须按对应方案和独立审核闭环。

## 2. 洁净仓治理线

| 线 | 当前交接口径 | 证据/说明 |
|---|---|---|
| T12 | 已在既有 HANDOFF 台账中记为完成 | 破坏性清理历史由主代理执行；本轮不重做 |
| T13 | 已在既有 HANDOFF 台账中记为完成 | 卫生基线历史结果保留；本轮不改他人测试文件 |
| comfyui/runninghub 移除 | 工作树可见相关删除/剪除改动；本轮只记录，不代替 T-scope 审核 | 需以 T-scope 报告、卫生用例和静态扫描为准 |
| 静态层范围登记 | **已产出（2026-09-20）** | `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md`：108 现存文件 / 35041179 字节；逐文件四类归属 |

## 3. release 拆分线

- **Phase A–G**：HANDOFF 现有台账记为本地完成；本地提交、未 push。
- **E8–E10**：43 处 `include_router` 收敛到 `app_runtime/routers/assembly.py`，`main.py` 中为 0；HTTP `@app.*` 薄包装保持 95 条。
- **Phase F/G**：生命周期、WebSocket、全局协程、关闭派发辅助与 `create_app()` 入口收敛已在历史台账中记为本地完成；`0d607c97` 作为历史快照提交。
- **画布 CAS 晚绑定**：提交 `40ab81cb`，`canvas_lock` 统一为调用式晚绑定。
- **端口 2077**：提交 `8b85d4c5` + `006f3ddc`，当前口径为 2077。
- **当前 release 实测快照**：HEAD `006f3ddce51cd1c022c51f2b963f91380cee6072`；`git log --oneline -1` 为 `006f3ddc docs: 更正根级设计文档 Coolify 内部端口口径为 2077`；`origin/main..HEAD` 为 41；`main.py` 732947 B / SHA-256 `c54f368a48cd0123a74733d3b0423eebabe7cf9f7e3af98522ff3ed0fee8e89a` / `splitlines()` 16460 / `split("\n")` 16461 / `app.include_router` 0 / HTTP `@app.*` 95。

## 4. 待闭环

- Phase 3 契约冻结重签与当前快照独立审计。
- 许可/第三方合规清单与分发边界。
- 外部 IdP 方案（OIDC + PKCE/JWKS/组映射）落地前的方案审查。
- 部署验收计划与真实本地/远端/生产证据分层。
- `push`、远端 CI、生产验收：未执行；不得由本地提交或历史 CI 代替。

## 5. 关键命令与证据边界

```powershell
# release 仓只读快照
git rev-parse HEAD
git log --oneline -1
git rev-list --count origin/main..HEAD

# main.py 指标（Python）
# bytes / SHA-256 / splitlines() / split("\n") / app.include_router / HTTP @app.*

# 洁净仓门禁（由后续审核按任务书执行）
python -m pytest -q --no-header -p no:cacheprovider
node --check <所有保留 .js>
```

本轮实际执行的 release 只读命令输出已写入 `docs/governance/agent-reports-2026-09-20/T-handoff.md`。本地命令输出只能证明本地快照；不能证明远端 CI、push 成功或生产验收。

## 6. 文档路径索引（先读回存在性）

### 已存在（本文定稿时实测）

- `HANDOFF.md`
- `docs/governance/AGENT-TASK-2026-09-20.md`
- `docs/governance/agent-reports-2026-09-20/T-fonts.md`
- `docs/governance/agent-reports-2026-09-20/T-compliance.md`
- `docs/governance/agent-reports-2026-09-20/T-release-ops.md`
- `docs/governance/agent-reports-2026-09-20/T-handoff.md`
- `docs/governance/agent-reports-2026-09-20/T-phase3.md`
- `docs/governance/agent-reports-2026-09-20/T-scope.md`
- `docs/governance/agent-reports-2026-09-20/T-hygiene.md`
- `docs/governance/agent-reports-2026-09-20/T-v2.md`
- `docs/governance/REMOTE-AND-CI-PLAN-2026-09-20.md`
- `docs/governance/DEPLOYMENT-ACCEPTANCE-EVIDENCE-2026-09-20.md`
- `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`
- `docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md`
- `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`
- `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`
- `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md`
- `attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md`
- `attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md`
- `.github/workflows/ci.yml`、`requirements.txt`、`requirements-dev.txt`

- `docs/governance/agent-reports-2026-09-20/REVIEW-1.md`
- `docs/governance/agent-reports-2026-09-20/REVIEW-FINAL.md`

### 待产出

- 无（全部计划产物已落地；尚未执行 push / 远端 CI / 生产验收，见 §5）

注：路径存在性以本仓当前工作树为准；存在不等于内容已通过独立审核。

## 7. 本轮文件边界

本轮只写：`HANDOFF.md`、`HANDOFF-2.md`、`docs/governance/agent-reports-2026-09-20/T-handoff.md`。

## 8. 推送与远端 CI 实测（2026-09-20 收口）

- **提交**：`97b8b0474a702fa5b0161b0e5847b9a8824f55b7`（master 上 66 项变更：新增 26 / 修改 30 / 删除 5 等）。
- **remote**：`git remote add origin https://github.com/qinxuedong/Gods-Workbench-clear.git`（用户已授权配置 remote）。
- **push**：`git push -u origin master` 成功；`origin/master` == 本地 HEAD `97b8b04`；工作树 `git status --porcelain` 为空。
- **远端 CI**：推送触发 workflow run [`35508682089`](https://github.com/qinxuedong/Gods-Workbench-clear/actions/runs/35508682089)（job `106072698272`），**3 秒即失败，但失败原因是账户计费/额度**——GitHub 官方注解：
  > The job was not started because recent account payments have failed or your spending limit needs to be increased.
  即**任务根本未启动、未执行任何步骤**（`steps: []`），**不是代码或测试失败**。
- **结论与边界**：`push` = 已执行且成功；**远端 CI = 未真正跑通（被计费拦截）**，不能据此认定通过或失败；生产验收仍未执行。
  待账户计费恢复后，需重跑 `gh workflow run CI` 或重新 push 以取得真实绿/红信号。
- 本次未写入 `D:\Working\Code Pro\Gods-Workbench-release`（全程只读）。
