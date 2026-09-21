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
