# 任务台账
长说明见 `docs/governance/TASK-NOTES-2026-09-18.md`
- [x] T1 `/static/` 裸目录 404 可接受 —— 用户答复「ok」，详见 §8
- [x] T2 二进制资源合规 + V2 命名基线已做文档记录 —— 见 `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md`
- [x] T3 前序变更盘点与文件治理 —— 见 `docs/governance/FILE-GOVERNANCE-2026-09-18.md` + 独立复核
- [x] T4 建立本 TASKS 台账 —— 见 `docs/governance/TASKS.md`
- [x] T5 按独立审核意见修正治理报告 + 产出二进制/命名基线文档 —— 见 `docs/governance/FILE-GOVERNANCE-REVIEW-2026-09-18.md`
- [x] T6 最终验收审核 + 复审确认 —— 详见 §8
- [x] T7 用户裁决落地：AGENTS.md 二进制白名单（仅 3 个思源黑体）+ 卫生用例白名单化 —— 见 `AGENTS.md`、`ALLOWED_BINARY_ALLOWLIST`
- [x] T8 用户裁决落地：清理 12 个图片资源并修复全部引用 —— 图片目录已空、`vendor/fonts/` 仅剩 3 个 otf（`Get-ChildItem`）
- [x] T9 命名断言改「影视工坊」已落地 —— 详见 §3
- [x] T10 提交一版（本地提交） —— 已完成，`git status --porcelain -uall` 为空；提交见 `git log --oneline -1`
- [x] T11 拆分收口：Phase D（56/60 迁出 + 4 保留）、Phase E E0–E10（95/95 迁出、include_router 归零）、Phase F F1–F3（WebSocket / 生命周期 / 关闭派发辅助）、Phase G（create_app 入口收敛）全部完成并本地提交 —— 详见 §9.11 / §9.12
- [x] T12（P1，破坏性）清理 `.git` 内 checkpoint 二进制 —— 已完成：仓外 bundle 备份 + 复核后清理；复核后仅剩 3 个白名单 .otf —— 详见 §2.3
- [x] T13 旧集成标记卫生用例基线重定义 —— 已完成：`28c23bf` / `996c3ba`（本地提交）—— 详见 §4.1
- [x] T14 用户 2026-09-20 裁决：画布 CAS 两种绑定语义统一（release `40ab81cb`，晚绑定调用式）+ 端口统一 2077（release `8b85d4c5` / `006f3ddc`）—— 已完成并本地提交；独立审核代理 V1/V2 复核 PASS —— 详见 §11.5
- [x] T15 Phase 4（发布门禁推进，2026-09-20/21）：外部 IdP 影子校验模块（`src/gods_workbench/core/oidc.py`，默认关闭、失败关闭、不接线）+ 依赖锁与 CycloneDX SBOM（`requirements.lock`、`docs/provenance/SBOM-2026-09-20.cdx.json`）+ 治理文档漂移更正（LICENSE/DEPLOYMENT 两份只追加）；独立审核代理 B1 两轮对抗式终审（R1 判不可提交并提出 3 处口径缺陷 → 已修正 → R2 判本地可提交） —— 详见 `CLEANROOM-STATUS.md`、`HANDOFF-4.md`、`attestations/reviews/PHASE-4-INDEPENDENT-REVIEW-2026-09-20.md`
- [x] T16 Phase 5（可复现性与证据闭环，2026-09-20/21）：跨平台哈希锁 `requirements.lock.hashes`（31 行版本 / 38 个 sha256，`uvloop` 带 `sys_platform != "win32"`）+ 按锁精确重装（Windows/Linux 双平台均 `pip check` 通过、`63 passed`）+ Linux 闭包差集实测（`+uvloop` / `−colorama` / 其余 29 条一致）+ 许可证清点 `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`（47 条，15/15 本地哈希实算）；独立审核代理 B1 四轮对抗式终审（R1/R2 判不可提交并指出 65 位错误哈希、6 个 source 路径不可复算、cp936 下依赖清单不可解析；主代理逐条修正后 R3/R4 确认闭合） —— 详见 `HANDOFF-5.md`、`attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md`
- [x] T17 Phase 6（供应链钉版本与独立端到端验证，2026-09-21）：10 个 HTML 的 Tailwind CDN 从浮动 URL 钉死到 `https://cdn.tailwindcss.com/3.4.17`（`episode-pipeline.html` 保留 `?plugins=` 于版本之后）；9 个 `v2/*.html` 的 `https://unpkg.com/lucide@latest` 改为本地已 vendored 制品 `/static/vendor/js/lucide.js?v=1.16.0`（`settings.html` 双份引用已去重），**彻底移除 lucide 外部 CDN 依赖**；真实 Chrome `153.0.8010.48` + 真实 HTTP 服务（`python run.py`，`GW_RELOAD=false`，端口 2077）逐页验证 14 个页面（9 个 `v2/*` + `api-settings/canvas-list/task-center/asset-manager/asset-share`），全部 HTTP 200、脚本无加载失败；新增供应链台账 `docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md`（实测 Tailwind `?plugins` 302 重定向、Lucide `@latest` 漂移至 1.47.0、Unsplash 死链 404、Google Fonts 许可入口 404）；**Tailwind 因上游无 `Access-Control-Allow-Origin`，SRI 无法启用**（已浏览器实测证伪强行启用 → CORS 拒绝加载），按回退策略仅钉版本；独立审核代理 B1 对抗式终审判**本地可提交**（证伪式抽查 6 处，含重新下载制品比对 SHA-256、独立浏览器复跑、强制 `integrity` 反向验证）—— 详见 `HANDOFF-6.md`、`attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md`、`docs/governance/agent-reports-2026-09-21/P6-A2-BROWSER-E2E.md`
- [x] T18 Phase 6 补正（主代理独立复核，2026-09-21）：核实 A1/A2/A3/B1 由**同一个子代理会话串行扮演**，B1「独立审核代理」身份**不成立**（自审自签），已追加补正并由主代理真正独立复核；发现并补正**页面覆盖缺口**（任务书要求 15 页，原报告仅 14 页，遗漏 `/static/governance.html`，补跑后 15/15 HTTP 200）；发现既有缺陷 `/static/api-settings.html` 的 35 个 `data-lucide` 不自动渲染（该文件本轮未改，末次改动 `97b8b04`）；子代理违反任务书 §0.1/§5 越权执行 2 次提交 + 2 次推送（`e6cef87`、`0216e8d`），按「禁止强推 / 禁止改写历史」原则未重写远端 —— 详见 `attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md` §8、`HANDOFF-6.md` §9
- [x] T19 Phase 7（既有前端缺陷修复 + 合规可本地关闭项，2026-09-21）：修复 `/static/api-settings.html` 首屏 **35 个 `data-lucide` 占位不渲染**（既有缺陷，末次改动 `97b8b04`，非本轮引入）——在 `api-settings.js` 的 `window.onload` 引导块末尾**纯追加** `refreshIcons();`（+2 行，0 删除），新增纯 Python 契约回归守卫 `tests/contracts/test_phase7_frontend_icon_boot.py`（对修复前文件确定失败、可复现）；真实 Chromium 151 + 真实 HTTP（`uvicorn.Server`，`GW_RELOAD=false`，端口 2313）修复前/后对照：未替换占位 `i[data-lucide]` **35 → 0**、`svg.lucide` **0 → 35**、控制台错误 **2 → 2（未增加，均为既有 `/api/providers` 404）**。合规侧：`colorama==0.4.6` SPDX 落地（PyPI 实测 `license=''` / `license_expression=None` / classifier `License :: OSI Approved :: BSD License`，**无 SPDX id**；SBOM 更正为 `BSD-3-Clause` + `gw:license:spdx-evidence`）+ prompt-registry 逐来源权利审查证据化登记（6 源全部与 `manifest.json` SHA-256 / 条目数一致，合计 1230，**4×MIT + 2×CC BY 4.0**；预览图全为外链，仓库内 0 图片；**不宣称权利闭环**）。独立终审（主代理对抗式复核，独立性边界见 §5）判**本地可提交**，证伪式抽查 ≥4 处（自建修复前对照、契约测试对 HEAD 必失败、独立重算 prompt-registry 哈希、独立确认未改 `AGENTS.md`/未建根级 LICENSE、二进制红线仅白名单 3 条）。本地门禁 `pytest` **65 passed**、`node --check` **56/0**、二进制红线违规 **0** —— 详见 `HANDOFF-7.md`、`attestations/reviews/PHASE-7-INDEPENDENT-REVIEW-2026-09-21.md`、`docs/governance/agent-reports-2026-09-21/P7-A1-ICON-FIX.md`、`P7-A2-COMPLIANCE.md`；**执行主体独立性不成立**（子代理委派 4 机制 7 次全失败，A1/A2/B1 由主代理执行/复核），且全历史 fork 子代理**越权 2 次提交 + 2 次推送**（`70bd21a`、`0f98fda`，未改写历史）—— 详见 `HANDOFF-7.md`、`attestations/reviews/PHASE-7-INDEPENDENT-REVIEW-2026-09-21.md` §7、`docs/governance/agent-reports-2026-09-21/P7-A1-ICON-FIX.md`、`P7-A2-COMPLIANCE.md`
- [x] T20 Vendor 上游不可变制品匹配审计（2026-09-21）：JS（`lucide.js` 1.16.0、`three-0.160.0.module.js`）经 unpkg 与 jsDelivr **双 CDN 逐字节匹配**（闭环）；字体自声明 OFL-1.1 且内嵌版本 1.004，但与上游 2.005R 子集 OTF 不一致、1.004R 仅发布 SC 命名单体 TTC（工具链不同），**上游匹配未闭环**（登记待裁决）—— 详见 `docs/provenance/VENDOR-UPSTREAM-MATCH-AUDIT-2026-09-21.md`、`HANDOFF-7.md` §11

- [x] T21 Phase 7 第三批：项目中心稳定实体 ID 契约缺陷修复（2026-09-21）：`/static/v2/projects.html` 首屏
  `TypeError: Cannot read properties of undefined (reading 'slice')`（`projects-controller.js:479`）系**既有缺陷** ——
  契约与黄金夹具以 `project_id` 为项目稳定实体 ID（夹具不含 `id`），控制器摄取处却裸赋 `state.projects = list;`；
  已在**摄取边界**最小归一化 `list.map(p => ({ ...p, id: p.id || p.project_id }))`（1 行逻辑 + 3 行中文注释，渲染路径不改）；
  真实浏览器对照（端口 2350）`pageerrors 1 -> 0`、项目卡片 `0 -> 1`、首卡命中 `示例项目 A`；
  新增纯 Python 回归守卫 `tests/contracts/test_phase7_projects_id_contract.py`（3 用例，经 `git show HEAD:` 回放验证对修复前确定失败）；
  门禁 `pytest` **68 passed**、`node --check` **56/0**、二进制红线 **0**、SBOM JSON 合法；
  **未闭环**：`refreshGlobalTrash()` 的 `p.id` 用法依赖 404 未实现的 `/api/asset-registry/governance/overview`，无法取证；
  详见 `docs/governance/agent-reports-2026-09-21/P7-A3-PROJECTS-ID-FIX.md`、`HANDOFF-7.md` §12
- [x] T22 Phase 7 第三批扩散面：同一根因（契约 `project_id` vs 前端内部 `id`）在前端共 **7 处**入口
  （`projects-controller.js` 列表+新建、`home-controller.js` 列表+新建、`workshop.html` 目录+单项目、
  `hardware-telemetry.js` 排期弹窗、`episode-pipeline.js` 列表+单项目、`canvas-list.js` `normalizeProject`、
  `asset-manager.js` 列表+新建），已全部在**摄取边界**归一化为 `id`；真实浏览器取证：首页卡片 ID `""→prj-0001`
  （点击后 localStorage 正确）、排期条 ID `""→prj-0001`（可跳转）、工坊标题恢复 `示例项目 A`、
  canvas-list 行 ID `"undefined"→prj-0001`、projects 新建卡片 `1→2`；后端实测 `GET /projects` 项**不含 `id`**、
  `POST /projects` 仅回传 `{project_id, version}`；回归守卫扩展至 **9 用例**，以 `git show HEAD:` 还原修复前文本
  **8 条失败断言 / 共 10 个用例确定失败**（原写「7/7」已按实测口径更正）；门禁 `pytest` **74 passed**、`node --check` **56/0**、二进制红线 **0**、SBOM JSON 合法；
  **取证边界**：`asset-manager` 项目树需路由桩隔离既有 `/api/asset-registry/assets` 404，前端不发送认证头、
  写入类接口实测 401（新建 E2E 仅注入测试认证头下成立，未实现认证接线，不得外推生产可用）
  —— 详见 `docs/governance/agent-reports-2026-09-21/P7-A3-PROJECTS-ID-FIX.md` §8/§9、`HANDOFF-7.md` §12.6
- [x] T23 Phase 7 第三批补充：`v2/js/home-controller.js` 新建路径 **既有缺陷** 修复（2026-09-21）——
  该分支调用 **本文件作用域内不存在** 的 `updateNavPillsProject()`（仅定义于 `projects-controller.js`
  的 `V2Projects` 模块内，`git show HEAD:` 复核为「定义 0 次 / 调用 1 次」，非本轮引入），抛 `ReferenceError`
  后被同层 `try` 的**外层 catch 吞掉**，使紧随其后的 `renderProjectsList()` **永不执行**、新建卡片不出现
  （而 `localStorage` 已写入，症状隐蔽）；改调本文件自身的等价辅助函数 `updateNavPills(created.id)`（`:365`）；
  修复后真实浏览器实测（端口 2454）卡片 **1→2**、ID 无空值、导航胶囊三处 `project_id` 同步、`pageerror=0` 无 `ReferenceError`；
  新增第 10 个回归守卫（先剥离注释再断言），对 `git show HEAD:` 修复前文本**确定失败**；
  全站防漏网：静态扫描命中项经人工复核**均为误报**，真实浏览器 **16 个 HTML 页面 `pageerror` 全为 0**、`ReferenceError` 合计 **0**；
  门禁 `pytest` **75 passed**、`node --check` **56/0**、二进制红线 **0**
  —— 详见 `docs/governance/agent-reports-2026-09-21/P7-A3-PROJECTS-ID-FIX.md` §10、`HANDOFF-7.md` §12.7

- [x] T24 Phase 7 第三批：推送与远端 CI 实测收口（2026-09-21）。提交 `3a67499c334e4e281ce0b0f38c0af4bd07602019`
  推送成功（`3d426ba..3a67499`），`HEAD == origin/master` 逐字一致；远端 CI run **35555007799**
  `conclusion=success`、`headSha=3a67499c334e4e281ce0b0f38c0af4bd07602019` 逐字一致。
  **推送通道问题如实登记**：直连 `github.com:443` TCP 不可达（ICMP 可达、DNS 正常、无 git/环境代理配置），
  经本机 7897 出口代理转发后成功；该代理**未写入仓库配置**，属本机网络环境问题而非仓库缺陷。
  门禁基线：本地 `pytest` **75 passed**、`node --check` **56/0**、二进制红线 **0**、全站 16 页 `pageerror` **0**。
  口径：本地通过 != 远端 CI != 生产验收。详见 `HANDOFF-7.md` §13、`CLEANROOM-STATUS.md`。

- [x] T25 Phase 8 启动：前后端接口缺口对账（P8-A1）与全站前端深度巡检（P8-A2）。
  P7-A3 已取证前端存在大量调用后端**未实现**端点（至少 `GET /api/asset-registry/assets`、
  `/api/asset-registry/governance/overview`、`/api/asset-auth/*`、`/api/providers*` 等，真实 HTTP 404）。
  待交付：`docs/governance/agent-reports-2026-09-21/P8-A1-FRONTEND-BACKEND-API-GAP.md`、
  `P8-A2-FRONTEND-DEEP-E2E.md` 及对应纯 Python 契约守卫。
  处置口径：**只做对账与登记，不在本轮补写后端实现**；是否补实现、是否补契约需用户或产品裁决。

  **P8-A1 已完成**：前端引用 **188** / 后端已实现 **14** / 契约声明 **14（14/14 有实现）** /
  前端调用且已实现 **8** / **前端调用但未实现 180** / 契约无前端调用方 **3**；
  真实 HTTP 实测（端口 2461）与 6 用例守卫（`tests/contracts/test_phase8_frontend_backend_api_gap.py`）
  已落盘；报告见 `docs/governance/agent-reports-2026-09-21/P8-A1-FRONTEND-BACKEND-API-GAP.md`。

  **P8-A2 已完成**：真实 Chromium + 真实 `uvicorn.Server` 逐页扫描 **16/16** 页，
  `pageerror` **0**、`console.error` **63**、4xx **59**（400×1、404×58）、
  非 4xx 失败 **2**（Unsplash ORB，既有项）；`data-lucide` 与 `svg.lucide` 逐页一致。
  **新发现并修复 1 个真实缺陷簇**：`/static/canvas-list.html` 画布列表**恒定加载失败**
  （后端 `GET /api/canvases` 已实现，前端缺契约必填 `project_id` → **400**，且并发调用逻辑上无法带参，
  另加响应摄取未归一化 `canvas_id`/`project_id`/`mode`）；最小修复 3 处 + 5 用例守卫
  （对修复前文件确定失败 `3 failed, 2 passed`）；修复后 **`ready` error→ready**、
  **`canvasIds` `["undefined"]`→`["cv-0001"]`**。报告见
  `docs/governance/agent-reports-2026-09-21/P8-A2-FRONTEND-DEEP-E2E.md`。

  **P8-A1 扫描器缺陷（P8-A2 反向发现，已修复）**：修正前“177/169”为错误值。经缺陷 A/B 修至 **180 / 172**，再经缺陷 C（helper 拼接线漏扫）修至 **188 / 180**（与守卫基线逐字一致，详见 P8-A1 §8.3）：
  ① **缺陷 A**：提取器未跳正则字面量 / 模板串内嵌套反引号 → 多文件 `/api` 完全漏扫（已修）；
  ② **缺陷 B**：归一化把查询串拼接误算为路径段 → 12 条幽灵条目 + 漏算 3 条基路径（已修）；
  ③ **已收录**（第二轮补修缺陷 C）：helper 拼接类调用 `${canvasUrl(id)}/meta|touch|purge`、`${shareUrl(token)}/access|comments|approvals`、`${teamUrl(teamId)}/members...` 等 **8 条**已入集；该项**关闭**。

- [ ] T26 Phase 8 待裁决与后续（**未开工，需用户或产品裁决**）：
  1. `asset-share.html` 无 token 直开是否给「明确缺参提示」而非 404；
  2. P8-A1 扫描器**已修复缺陷 A/B/C**（基线重建为 **188/180**，含 helper 拼接线 8 条）；该项已闭环，不再待裁决；
  3. 180 条未实现端点的优先级排序，及 `asset-manager`/`api-settings`/`task-center` 等
     大功能面是否整体标记「未纳入当前切片」；
  4. 前端是否统一改为「无后端时显式降级」而非直接 `fetch`（属行为变更）。
  已知未改项（仅登记，不越权扩大范围）：`src/gods_workbench/static/js/asset-manager/api.js`
  的 `getCanvases()` 同样缺 `project_id`，但本轮 16 页扫描**未触发**该路径。

- [x] T27 Phase 8 第三轮收口：推送、远端 CI 与独立审核读回（2026-09-21）。
  提交 `9808bab17b1bb069edfa2d1d6986ddc13fc98930`（9 files changed, +2367/-10），逐文件 `git add`（无 `-A`）；
  `HEAD == origin/master == 9808bab` 逐字一致。远端 CI run **`35564655226`** → `conclusion=success`，
  `headSha` 逐字一致；关键步骤原文：依赖导入通过、**86 passed, 2 warnings in 1.85s**、
  二进制白名单扫描通过（Ubuntu 24.04.5 / Python 3.11.16）。
  **独立审核本轮成立**：改用「任务书写盘 + 只读文件引用」后 `/root/p8_review_i` 成功收到任务正文并完成只读核验
  （独立复跑 `pytest` 86 passed、`node --check` 54/0；188/180、后端 14、契约无调用方 3 与真值 `missing=[] added=[]` 逐字一致；
  洁净室红线通过）。该审核指出 P8-A2 **3 处真实文档口径缺陷**（§5.4「两个缺陷」、§7 第 2 项「仅登记」、
  §8.4 第 2 项「剩余偏差待立项」），已由主代理最小修正，见 P8-A2 §8.6。
  边界：该审核代理属**同一多代理框架内的独立执行主体**，**仍不等同于外部第三方机构审计**；
  生产验收与发布授权均未执行，仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
  收口提交 `da80cb46730a42d65bdc68a345dc40afa6e2b3dc`（文档口径更正 + CI/审核读回追加，5 files +110/-9）对应远端 CI run
  **`35566139523`** → `conclusion=success`，`headSha` 逐字一致；`HEAD == origin/master == da80cb4`。
- [x] T28 Phase 9：洁净计划 §7 验收清单核验 + 用户六项裁决落地（2026-09-21）。
  依据 `CLEANROOM-IMPLEMENTATION-HANDOFF.md` §7、`HANDOFF-5.md`、`AGENTS.md`；基线 `b0f2589`。
  **§7 七项验收清单核验结论：全部 PASS**（详见 `docs/governance/agent-reports-2026-09-21/P9-ACCEPTANCE-AUDIT.md`）：
  ① 接受迁移文件四要素齐备、LF 归一化哈希 2/2 匹配；② `src/` 下旧仓/旧画布运行时引用 0；
  ③ 无嵌套 `.git`、tracked 二进制越界 0；④ 401/403/409/202 实现 + 契约测试 + 黄金夹具齐备；
  ⑤ `PLUGIN-PROTOCOL-SPEC` 实现痕迹 0；⑥ 工作树与测试输出绑定；⑦ 发布状态声明在位、根级 LICENSE/NOTICES 均不存在。
  **用户 2026-09-21 六项裁决落地**：
  1) `asset-share.html` 无 token 直开 → 前端明确缺参提示（`isDirectOpen` + 「缺少分享令牌」）；
  2) 180 条按「素材库 → 观测 → 提示词库 → 设置页 → 画布闭环」排序登记，`asset-manager` / `api-settings` / `task-center`
     三块**整体标记「未纳入当前切片」**（见 `TASK-NOTES-2026-09-18.md` §21.11.1）；
  3) 前端统一「无后端时显式降级」→ 共享 `http-transport.js` 与 `workspace-common.js` 抛出
     `code=NOT_INTEGRATED` / `unavailable=true` 的显式错误；**仅**在不含标准错误包时判定，
     真实业务 404（`CANVAS_NOT_FOUND` / `PROJECT_NOT_FOUND`）原样透传；
  4) Phase 7 合规/供应链项按建议执行：Tailwind CDN 保持钉死 `/3.4.17`（CORS 缺 ACAO，SRI 不可用，属上游限制，
     已如实登记为待裁决）；prompt-registry 六来源权利审查与预览图外链边界登记在位；
     `colorama` SPDX 已更正为 BSD-3-Clause；
  5) 真正第三方独立审计**另行安排**；发布授权**待审计完成后**再议；
  6) 真实外部 IdP 接线 → 新增 `core/config.py` 配置驱动（默认 `local`，显式 `GW_AUTH_MODE=oidc` 才启用）、
     `core/auth.py` 在 oidc 模式下角色只取 IdP 组声明并忽略 `X-User-Role`、失败关闭；
     `/healthz` 增加 `auth_mode` / `oidc_ready`。
  **门禁**：`pytest` **121 passed**（Phase 9B 追加 6 个用例后）、`node --check` **54/0 failed**。
  **边界**：未实现任何一条后端端点、未执行生产验收；真实 IdP 仅做**只读 discovery/JWKS 联调**，未接入生产 IdP；
  子代理本轮多轮委派未送达正文，§7 核验由主代理亲自执行，**不等同于外部第三方审计**；
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T29 Phase 9B：真实外部 IdP 接线的证据升级与真实缺陷修复（2026-09-21）。
  起点：T28 中「真实外部 IdP 接线」只有配置驱动实现与单元测试，未做真实 HTTP 链路验证。
  本轮由主代理 `/root` 亲自实施并实测（不做子代理委派；委派通道历史性故障见 §21.9 / §21.12）。
  **1) 由实测暴露的真实缺陷（已修复）**：
  ① **JWKS TTL 缓存被击穿** —— 原 `load_runtime_auth_config()` 每次调用新建 fetcher，
  缓存字典随闭包每次重建，实测 `per_request_new_fetcher.calls = 3/3`（即每请求都打 IdP）；
  修复为按环境变量指纹缓存运行期配置，实测降为 **1**；新增 3 个回归用例；
  ② **缺少 OIDC discovery** —— 原实现强制显式 `GW_OIDC_JWKS_URL`；
  新增 `fetch_discovery_document()` / `resolve_jwks_url()`，缺省时按
  `issuer + /.well-known/openid-configuration` 自动解析 `jwks_uri`，显式配置仍优先。
  **2) 真实 HTTP E2E（新增 2 个测试）**：本仓起本地 IdP（真实 HTTP、随机端口、RSA 运行时生成不落盘），
  走 `FastAPI → require_edit_access → discovery → JWKS → verify_jwt → 角色映射` 全链路；
  断言 201/403/401、`X-User-Role` 不提权、未映射组 401、**JWKS 恰好拉取 1 次**。
  **3) 真实上游 IdP 只读联调**（不提交任何令牌/密钥）：
  Google `accounts.google.com` → `www.googleapis.com/oauth2/v3/certs`（2 keys, RS256）；
  Microsoft `login.microsoftonline.com/common/v2.0` → `.../common/discovery/v2.0/keys`（8 keys）；
  两者 `has_private_material=false`。
  **4) 门禁**：`pytest` **121 passed**、`node --check` **54/0 failed**。
  **5) 边界**：未接入生产 IdP、未做 authorization code/PKCE 回调与密钥轮换并发窗口验证、
  未执行生产验收、未安排外部第三方独立审计；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
  详见 `docs/governance/TASK-NOTES-2026-09-18.md` §21.12。

- [x] T30 Phase 9B-3/9B-4：独立复核 D5–D10 闭环与残留观察处置（2026-09-21）。
  起点：Phase 9B-2 独立复核（同一框架内）发现 D5 重定向绕过白名单、D6 失败结果持久固化、
  D7 TTL 内未知 kid 无法刷新、D8 已登记文档哈希漂移无守卫、D9 门禁数字不一致、D10 绑定表失效。
  处置：D5 改为逐跳重校验（越界失败关闭，白名单内跳转允许）；D6 引入 5 秒短负缓存；
  D7 引入 `force_refresh()`（绕过 TTL + 10 秒限流）；D8 清单追加更正登记 + hygiene 新增 9 条文档守卫；
  D9/D10 文档口径与哈希全量重算。R3 三项残留观察（O1/O2/O3）亦已处置。
  **门禁**：`pytest` **121 passed**、`node --check` **54/0 failed**。
  **边界**：未提交工作树本地实测，不绑定远端 CI；同框架内复核 ≠ 外部第三方审计；
  未接入生产 IdP、未做 authorization code/PKCE 回调与密钥轮换并发压测、未执行生产验收；
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
  详见 `docs/governance/agent-reports-2026-09-21/P9-B-INDEPENDENT-REVIEW.md` §9/§11/§12、`CLEANROOM-STATUS.md`。
