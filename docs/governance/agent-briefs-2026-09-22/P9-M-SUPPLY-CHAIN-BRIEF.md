# 任务书 P9-M：合规/供应链核验（只读）

- 仓库：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（Windows PowerShell）。
- 硬约束：**只读**。不得 git 写；不得编辑或删除任何文件。

## 目标：核实用户裁决第 4 项「Phase 7 滚动的合规/供应链项：按建议执行」

逐项给出证据（文件 + 行号 + 原始片段）：
1. `docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md`：Tailwind 是否钉死 `/3.4.17`、SRI 是否登记为上游限制；Lucide / Three.js 是否双 CDN 逐字节匹配闭环。
2. `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`：`colorama` SPDX 是否为 BSD-3-Clause。
3. `docs/provenance/VENDOR-UPSTREAM-MATCH-AUDIT-2026-09-21.md`：字体（Source Han Sans CN ×3）上游匹配是否仍未闭环、是否如实登记。
4. `docs/provenance/PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md`：六来源权利结论、总条数、许可分布（约 1230 条，4×MIT + 2×CC BY 4.0），是否明确「不宣称已闭环、待用户/法务终裁」。
5. 用 `python -c "import json;d=json.load(open('docs/provenance/SBOM-2026-09-20.cdx.json',encoding='utf-8'));print(len(d.get('components',[])))"` 验证 SBOM 合法 JSON 并报组件数。
6. `git ls-files LICENSE THIRD_PARTY_NOTICES.md` 是否为空（根级是否仍未建立）。

## 必答
第 4 项是「已按建议执行（本地可闭环部分）」还是「未完成」；逐条列出**仍未闭环项**。禁止把「证据化登记」说成「已闭环」。中文、简明、可复算。


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
