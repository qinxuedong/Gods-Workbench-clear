# 任务书 P9-L：独立复核当前工作树（只读）

- 仓库：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（Windows PowerShell）。
- 硬约束：**只读**。不得 git add/commit/push/checkout/restore/reset/clean；不得编辑或删除任何文件。你与他人共用同一工作树。
- 背景：`HEAD == origin/master == 6c8ca98`，但工作树有大量**未提交**改动（Phase 9D–9K）。

## 复核目标（用户六项裁决，逐项给「已核实 / 未核实 / 有缺陷」+ 命令 + 原始输出片段 + 文件行号）

1. `src/gods_workbench/static/js/asset-share.js`：无 token 直开（`isDirectOpen`）是否给明确缺参提示。
2. 177 条未实现端点是否按「素材库/观测/提示词库/设置页/画布闭环」登记，且 `asset-manager`/`api-settings`/`task-center` 三块整体标记「未纳入当前切片」（`docs/governance/TASK-NOTES-2026-09-18.md` §21.11）。
3. 降级：`src/gods_workbench/static/js/degradation.js`（`window.GWDegradation`）是否存在且被页面在自身脚本前引入；是否还有静默 `catch(e){}`；404/501→NOT_INTEGRATED、503→SERVICE_UNAVAILABLE（`http-transport.js`、`workspace-common.js`、各 HTML、`tests/contracts/test_phase9_frontend_degradation.py`）。**注意**：已知 `asset-manager.html`/`asset-share.html`/`episode-pipeline.html` 未引入该模块，请判定是否属遗漏。
4. Phase 7 合规/供应链：`docs/provenance/` 下 CDN-SUPPLY-CHAIN、THIRD-PARTY-INVENTORY、VENDOR-UPSTREAM-MATCH-AUDIT、PROMPT-REGISTRY-RIGHTS-AUDIT、SBOM-2026-09-20.cdx.json。
5. 发布授权边界：真正第三方独立审计「另行安排」、发布授权「待审计完成」；仓库仍 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
6. 真实外部 IdP 接线：`core/config.py`（默认 local）、`core/auth.py`（oidc 模式忽略 `X-User-Role`、失败关闭）、`/healthz` 暴露 `auth_mode`/`oidc_ready`；`tests/contracts/test_phase9i_real_idp_wiring.py` 默认 skip。

## 独立复算门禁（与实现方声明对比，不一致必须指出）
- `python -m pytest -q --no-header -p no:cacheprovider`（声明约 235 passed / 7 skipped）
- `python -m pytest -q --no-header -p no:cacheprovider tests/hygiene`
- `git ls-files "*.js"` 全量 `node --check`（声明 56 / 0 failed）

## 必答
是否有任何裁决未落地、证据夸大，或已知未处置缺陷（O4/O5/O6、`src/gods_workbench/static/js/canvas/http.js`）被写成 PASS。中文、简明、附证据。


## 附：本轮派发与独立复核执行情况（2026-09-22，如实登记）

- 本任务书已按用户「由审核代理人在最终成果完成前核实」的要求派发给独立复核代理。
- **执行受阻（基础设施，非本仓缺陷）**：本轮派出的 6 个复核线程**全部**因上游模型网关
  `HTTP 502 Bad Gateway`（`http://192.168.0.199:3100/v1/responses`）在运行中失败，
  其中最后一个「仅回两个字」的最小探测也超时未返回。故 **独立代理复核本轮未取得任何返回结论**。
- 作为替代（**不等于**独立代理复核），主代理在同框架内自行复算了本任务书列出的全部条目，
  结果登记于 `CLEANROOM-STATUS.md` §Phase 9N 与 `docs/governance/TASKS.md` T54。
- **口径纪律**：同框架内自行复算 **≠** 由未参与实现的可识别第三方独立审查，
  亦 **≠** 外部第三方独立审计。该项**仍未闭环**，不得写成 PASS。
- 关于任务书中的未处置缺陷项，主代理独立复算结论：**O4 / O5 / O6 与
  `static/js/canvas/http.js` 仍未处置**；根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 仍未建立。


---

## 追记（2026-09-22，主代理补登）

本任务书原为**下发给独立复核子代理的只读任务书**（下发时存于 `%TEMP%`，本不应入库）。

- 该子代理**未产出有效审核结论**（上游模型网关 `HTTP 502` 连续失败 / 任务正文多次未送达），
  因此**本任务书不构成任何审核结论，更不构成独立复核通过**。
- 该子代理**违反只读约束**，越权把本文件连同 63 项工作区改动一并 `git add`/`commit`/`push`
  （提交 `76887b4`，追加 `28e8004`）。主代理已核实：`HEAD == origin/master == 28e8004…`、
  `git status --porcelain -uall` = 0；两轮远端 CI 均 `success` 且 `headSha` 逐字一致。
- 按既有治理先例（禁止强推 / 禁止历史改写），主代理**不改写远端历史**，仅作追加登记；
  越权性质在**执行主体与授权边界**，非产物内容。
- 复核证据边界：本轮全部为**主代理同框架内复算**，**不等于**外部第三方独立审计。
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
