# 任务书 G：用户六项裁决「当前闭环状态」只读核实

## 角色
独立核实代理人。**只读**：严禁 git 写操作（add/commit/push/checkout/stash/reset/clean），严禁修改/创建/删除仓库内任何文件。
你的脚本与输出只允许放 C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\ 下。

## 基线
仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear
预期 HEAD = 714414a9aa5665f65c576809698ff387971f91ef；工作树应干净。
先自行运行并原样贴进报告：git rev-parse HEAD / git rev-parse origin/master / git rev-list --left-right --count origin/master...HEAD / git status --porcelain=v1 -uall

## 核实对象：用户 2026-09-21 六项裁决 + 2026-09-22 追加项
逐项给出「已闭环 / 部分闭环 / 未闭环」结论，每项必须附**原始证据**（命令原文输出、文件:行号）。禁止把「本地断言」写成「生产验收」，禁止把「同框架复核」写成「第三方独立审计」。

1. /static/asset-share.html 无 token 直开 → 必须给明确缺参提示（禁 404、禁静默坏掉）。
   - 读 src/gods_workbench/static/js/asset-share.js 与 js/asset-share/*.js，指出判定逻辑与错误分支，贴关键行号。
   - 若本机 127.0.0.1:2077 没有服务，可只读启动一个（python run.py 或 uvicorn），用后关闭；不得写入仓库。
   - 记录：HTTP 状态、页面文案、是否发起 /api/* 请求、page_errors。
   - 现有证据参考：C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\reports\ASSET-SHARE-DIRECT.json（自行复算，不得直接抄）

2. 180 条未实现端点按顺序推进（素材库 → 观测 → 提示词库 → 设置页 → 画布闭环）；asset-manager / api-settings / task-center 三块大功能面整体标记「未纳入当前切片」。
   - 确证后端是否**零新增**这 180 条（给证据命令，例如对若干代表性端点的路由存在性检查）。
   - 确证三块大功能面的「未纳入当前切片」标记位置（文件:行号、实际文案）。
   - 核实清单来源：docs/governance/agent-reports-2026-09-21/P8-A1-FRONTEND-BACKEND-API-GAP.md §2.3 与 tests/contracts/test_phase8_frontend_backend_api_gap.py::KNOWN_UNIMPLEMENTED
   - 报告该清单当前条数（用命令复算，不要只引用文档）。

3. 前端是否统一「无后端时显式降级」（明说「未接入」，而非静默坏掉）。
   - 扫描 src/gods_workbench/static/js/ 下是否仍有 .catch(() => 回落) / try{catch} 静默降级模式（排除 vendor/）。
   - 给出仍未做显式降级的文件:行号清单。

4. Phase 7 滚动的合规/供应链项按建议执行。
   - 读 docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md，列出「已执行项」与「仍未闭环项」，逐条给证据或缺失原因。
   - 重点：Tailwind Play CDN 版本钉死现状、SRI/integrity 是否可用、根级 LICENSE / THIRD_PARTY_NOTICES.md 是否建立（git ls-files LICENSE THIRD_PARTY_NOTICES.md 原始输出）。

5. 身份、审计与发布授权（发布阻断项）：真正的第三方独立审计另行安排；发布授权待审计完成。
   - git grep -n -F "NOT AUTHORIZED FOR PUBLIC DISTRIBUTION"
   - git grep -n -F "第三方独立审计"
   - git ls-files LICENSE THIRD_PARTY_NOTICES.md（空输出即未建立，贴原始输出）
   - docs/governance/TASKS.md 中 T36 与 T40 原文，确认复选框是 [ ] 还是 [x]。
   - 结论只能写「未执行 / 未授权」或给出反证，严禁写 PASS。

6. 真实外部 IdP 接线。
   - 读 docs/governance/EXTERNAL-IDP-WIRING-RUNBOOK-2026-09-22.md 与 src/gods_workbench/core/oidc.py、core/auth.py、core/config.py、api/routes_auth.py。
   - 结论必须区分：影子校验模块 / 契约测试 / 真实外部 IdP 生产登录。
   - 明确 runbook 中「真实用户登录」标的是「未做」还是「已做」。

## 硬约束
- 只读；结束前再跑一次 git status --porcelain=v1 -uall 并贴原始输出，证明仓库未被你改动。
- 中文、简明、禁夸大。
- 本地门禁 != 远端 CI != 生产验收；同框架复核 != 第三方独立审计。

## 交付
报告 UTF-8 写入：C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\reports\DECISIONS-STATUS-AUDIT.md
结构：
1) git 原始输出
2) 六项逐项：结论（已闭环/部分闭环/未闭环）+ 原始证据 + 复算命令
3) 仍未闭环清单（最重要）
4) 未覆盖与不确定项（不得省略）
