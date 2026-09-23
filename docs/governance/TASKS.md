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

- [x] T31 提交后远端 CI 读回（2026-09-21）。
  提交 `2241340412e1b12952f571d04b85c480b0ff27e1` 已推送 `origin/master`（逐字一致）；CI run `35575654111` `conclusion=success`，
  `headSha=2241340412e1b12952f571d04b85c480b0ff27e1` 逐字一致；步骤含全量测试与二进制白名单扫描。
  **边界**：远端 CI 绿 ≠ 生产验收 ≠ 发布授权；仓库仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION。


- [x] T32 用户裁决第 3 项「前端统一显式降级」收口（2026-09-21）。
  `home-controller.js` / `projects-controller.js` / `workshop.html` 内联脚本三处完成显式降级改造；
  9 个 v2 页 + `v2-shell.js` 头像键帽、`index/settings` 席位凭据块、`workshop/projects/index/production` 的就绪/在线断言
  全部改为显式「未接入 / 未验证」占位。
  伪造数据关键词自查：`proj-demo` / `proj-local` / `proj-trash` / `本地挂载` / `本地兜底` / `就绪待命` /
  `PIPELINE ENGINE BUS: CONNECTED` / `ACTIVE SESSION` / `4/4 ONLINE` / `本机管理员席位` / `免密单机` / `超级管理员 (Admin)` 均 **0**。
  **边界**：静态层与 Node 行为守卫；不等价于真实浏览器 E2E 或生产验收。

- [x] T33 R6-8 修复与闭环（2026-09-21）。
  `core/config.py` 重定向逐跳重校验增加**同源**约束（起始 origin 线程本地绑定，未绑定即拒绝）。
  修复前 attacker hits=1；修复后 `HTTPError 302`、attacker hits=0。
  新增 `tests/contracts/test_phase9d_r6_hardening.py` 守卫（累计 20 用例）。

- [x] T34 跨模块降级语义一致性守卫（2026-09-21）。
  新增 `tests/contracts/test_phase9d_cross_module_consistency.py`（6 用例，Node 真实执行），
  对 `degradation.js` 与 `http-transport.js` 的 10 个输入逐条对照，**分歧数 = 0**。
  同步更正 `http-transport.js` 第 18 行注释口径（仅该行，7354 B → 7387 B）。

- [ ] T35 待用户裁决项（**未执行**）：O4 Tailwind 预构建路径不可复现、O5 死类是否修正（视觉变更）、
  O6 「tracked 269 → 275」口径更正、R6-7 会话绝对过期上限、`static/js/canvas/http.js` 删除（破坏性）。
  **边界**：以上均需用户明确裁决，本轮**不擅自执行**。

- [ ] T36 第三方独立审计与发布授权（**未执行**）：按用户裁决「真正的第三方独立审计另行安排，发布授权待审计完成」，
  本轮仅完成同框架内复核；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T37 Phase 9E/9F：伪遥测与顶栏推子具体读数清零（2026-09-21，用户裁决 3 收尾）。
  `hardware-telemetry.js` 删除 `Math.random` 伪造 VU 抖动；9 个 v2 页静态 `Online` 绿点清零；
  `episode-pipeline.js` 删除伪造 TFLOPS / 显存 / `SEED:` / 默认厂商模型名；
  7 个 v2 页 + `v2-shell.js` 顶栏推子由具体读数改为 **`0%` + 「未接入」+ `data-gw-degradation="not_integrated"`**。
  **刻意保留**真实交互输入推子（LoRA / roughness / CFG / 温度），守卫按「推子块 + 降级标记」限定作用域。
  同类残留一并清理（属同一语义缺陷）：侧栏项目树 / 场景树 `100%/85%/75%/20%`、
  `index.html` 的 `online` 胶囊与 `4节点`、`projects.html` 的 `VRAM CAP 85%`、
  `storyboard-controller.js` 示例台词中的 `92%`；全部改为「未接入 / 未验证」+ 降级标记。
  新增守卫：`tests/contracts/test_phase9_frontend_degradation.py`（累计 32 例，本轮新增 7 例）。

- [x] T38 R6-9：`asset-review.js` 授权门禁 fail-open（高）已修复（2026-09-21）。
  后端 `/api/asset-auth/status` 契约**无** `auth_required` 字段，旧 `can()` 的
  `!state.auth?.auth_required || ...` 使**未认证访客拿到 admin/editor/reviewer 全部权限**。
  已改为 fail-closed（`authenticated && principal` 前置 + `roleLevel` 比较），新增 `needsLogin()`，
  认证失败改显式降级对象，登录弹窗删除用户名/口令表单改为 OIDC 跳转。
  独立复算 7 组场景 **MISMATCHES = 0**；新增静态守卫 2 例。

- [x] T39 R6-10 / P9G：真实外部 IdP 互操作缺陷（高）已修复并实测接线（2026-09-21）。
  Google 官方 discovery 为跨主机（issuer `accounts.google.com` / jwks `www.googleapis.com` /
  token `oauth2.googleapis.com`），原「逐字同源」判据导致 `oidc_ready=false`、登录 503，
  **显式配 `GW_OIDC_JWKS_URL` 也无法绕过 → 无配置可接线**。
  新增 **opt-in** `GW_OIDC_ENDPOINT_HOSTS`（`DEFAULT_ENDPOINT_HOSTS = frozenset()`，**不预置第三方主机**）；
  白名单分支要求 **issuer 主机与端点主机同时精确命中**，拒 userinfo / 异 scheme / 异端口 / 未列主机。
  额外收紧：`authorization_endpoint` 仍**强制逐字同源**；`token_endpoint` 可用白名单但
  **令牌交换不跟随任何 3xx**；`_ValidatingRedirectHandler` **保持严格同源**（R6-8 不回退）。
  **局限**：匹配为幼稚逐字相等，**无 PSL / 无 eTLD+1 推导**，**不是通用安全边界**，须按官方 discovery 逐条照抄。
  实测（真实 Google）：设三主机后 `oidc_ready=true`、`login_available=true`、`/login` **200** + PKCE S256；
  未设白名单时同一配置仍 **503**（默认未放松）。
  新增守卫：`test_phase9d_r6_hardening.py` R6-11 段（10 例）。

- [x] T41 R6-12：`X || 默认值` 吞掉真实 0 的静默伪造（高）已修复（2026-09-21）。
  独立复核方发现 + 主代理独立复算：`v2/js/home-controller.js` 的 `p.progress || (... : 75)`、
  `v2/js/projects-controller.js` 的 `Number(p.progress) || 60` / `p.progress || 10` / 编辑弹窗
  `p.progress || 60`、`p.scenes || 24` / `p.shots || 72`，均为 falsy 兜底；
  后端 `create_project()` 新建项目即 `progress=0.0`，**0 会被显示成 10% / 60% / 75%，与真实值相反**。
  修复：新增 `rawNumber()` / `progressMeta()` / `projectProgressMeta()`，统一 `Number.isFinite` 判定，
  缺失 / null / 空串 / 非数一律显式「未接入」；编辑表单空值提交 `null`；
  `production-controller.js` 场次卡进度 / 镜头数 / 时长改为显式未接入 + `data-gw-degradation`。
  守卫：**行为级**（Node 真实执行，8 组 fixture，断言 0 保持 `0%`、不含 10%/60%/75%）
  + **静态**（禁 `|| 数字` 兜底、禁伪造 24/72）。

- [x] T42 Phase 9H：真实第三方 OP 互操作（R6-13）+ discovery issuer 校验（R6-14）+ 伪读数残留清零（R6-15）：
  对端为 npm `oidc-provider@9.12.2`（panva，**非本仓代码**）的本地真实实例，跑通完整
  授权码 + PKCE 登录（脚本与真实 Chromium 两种方式），并覆盖篡改 `code_verifier` /
  nonce 不符两条负向路径（均失败关闭、不建会话）；已固化为 opt-in 用例
  `tests/contracts/test_phase9g_real_op_interop.py`（未安装时 skip，显式配置时必须真跑）。
  同时修复 discovery 文档 `issuer` 未校验（OIDC Discovery 1.0 §4.3 / mix-up 防护，
  含缓存命中路径复核），并清零 `1.4TB` / `4090×4` / `3.84 TB / 10 TB` /
  静态 70%/100% 推子 / `settings.html` 的 `Math.random()` 伪 CPU/RAM 遥测 /
  无条件 `ONLINE`·`ACTIVE` 徽标 / `nodes_count || 12` 吞 0。
  守卫 +5 条（`Phase 9F-3`），变异测试 5/5 命中。门禁：218 passed, 3 skipped（显式配置 OP 时 221 passed）。
  **边界**：第三方 OP 是开源软件本地实例，**不等于**接入真实生产 IdP；本地通过 ≠ CI ≠ 生产验收。

- [ ] T40 第三方独立审计与发布授权（**仍未执行**，承接 T36）：
  按用户裁决「真正的第三方独立审计另行安排，发布授权待审计完成」；
  本轮仅完成**同框架内**独立复核；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T43 Phase 9H-2：两个真实缺陷修复（测试可信度 / 证据可追溯性，**已完成**）：
  承接 T42（Phase 9H 真实第三方 OP 互操作）的独立复核，发现并修复：
  (1) **R6-16** `test_oidc_verifier.py::test_tampered_signature_rejected` 篡改不可靠 ——
      Base64URL 末位同值别名使 `signature[:-2] + "xx"` 在签名末字节 == 0xC7 时**不改变字节**，
      失败概率恰为 **1/256 = 0.3906%**，负向守卫约每 256 次运行失去一次意义；
      改法为确定性翻转签名首字节 1 bit + 自检，并用变异测试证明守卫非恒真。
  (2) **R6-17** `test_phase9g_real_op_interop.py` 无版本断言 ——
      文档声明对端 `oidc-provider@9.12.2`，但本机事后被重装为 8.8.1 而用例**照常通过**；
      现新增版本比对（不一致即 fail），负向实测 3 errors。
  门禁（未提交工作树）：`pytest` **218 passed, 3 skipped**；`tests/hygiene` **11 passed**；
  设第三方 OP 目录后全量 **221 passed**；`node --check` 55/0；tracked 275。
  **边界**：均为本地实测，不等于远端 CI / 生产验收；两缺陷属测试与证据可靠性范畴，
  不是运行时安全缺陷；**O4/O5/O6/R6-7/canvas-http.js 仍未处置，不得写 PASS**。

- [x] T44 裁决 3 legacy 页收口：5 个页面统一显式降级（2026-09-22）。
  `api-settings.html` / `governance.html` / `canvas-list.html` / `task-center.html` / `v2/settings.html`
  全部在页面自身脚本**之前**引入 `static/js/degradation.js`；对应 5 个脚本的静默失败改为
  显式降级（文案 + `data-gw-degradation` 标记）；`v2/settings.html` 修正脚本顺序
  （原 `degradation.js` 在 `settings.js` 之后，`window.GWDegradation` 未就绪）。
  守卫：`tests/contracts/test_phase9_frontend_degradation.py` 追加 7 条（含 5 页接线顺序断言）。

- [x] T45 Phase 9I：真实外部 IdP（生产端点）接线核验（2026-09-22）。
  新增 `tests/contracts/test_phase9i_real_idp_wiring.py`（5 用例，opt-in，默认 skip）：
  discovery issuer 逐字一致 + JWKS 仅公钥、端点可信且 HTTPS、授权 URL 含 PKCE S256 且无密钥、
  运行期 `oidc_ready=true` 且四种失败模式均 401、未配置时保持 `local` 默认。
  真实上游只读实测：Google 5 passed；Microsoft 单租户 5 passed；
  Microsoft 多租户 `common` / `organizations` 因自述 issuer 含 `{tenantid}` 被**正确拒绝**。
  新增部署方手册 `docs/governance/EXTERNAL-IDP-WIRING-RUNBOOK-2026-09-22.md`。
  **边界**：未执行真实用户登录（无真实 client_id / 用户目录），不构成生产登录可用或发布授权。

- [ ] T46 口径更正（**已登记，未改动历史行**）：未实现端点实测为 **177**（189 引用 / 12 已实现），
  而 `CLEANROOM-STATUS.md`（335/376/698/707）、`TASK-NOTES §21.11.1`（1419/1422/1439/1790/1889）、
  `P9-ACCEPTANCE-AUDIT`（151/164/373/442）仍写 **180**；且 `§21.11.1` 表格缺 `/api/asset-auth/callback`。
  本轮以追加方式更正口径，历史行保持原样。
  同日重申：**O4 / O5 / O6 / R6-7 / `static/js/canvas/http.js` 仍未处置，不得写 PASS**。

- [x] T47 Phase 9J：R6-7 会话**绝对**过期上限闭环（2026-09-22）。
  `src/gods_workbench/core/session.py` 新增 `SESSION_ABSOLUTE_MAX_SECONDS`（24h）与
  `_Session.absolute_expires_at`；`get_session()` 先判绝对上限、滑动续期以
  `min(now + TTL, absolute_expires_at)` 封顶；`_prune()` 按滑动窗口与绝对上限双判清理。
  新增 `tests/contracts/test_phase9i_session_absolute_expiry.py`（6 用例，可控假时钟）。
  变异测试证明守卫非恒真（移除上限 → 2 failed / 4 passed；还原 → 6 passed）。
  门禁：全量 **232 passed, 7 skipped**；hygiene **11 passed**；
  装第三方 OP 后全量 **235 passed, 4 skipped**；真实 IdP（Google）用例 **5 passed**；
  `node --check` **56 / 0 failed**；同形字 **0**。
  **边界**：真实用户登录未执行；Cookie `Max-Age` 仍短于绝对上限；会话仍为单进程内存。
  同日重申：**O4 / O5 / O6 与 `static/js/canvas/http.js` 仍未处置，不得写 PASS**。

- [x] T48 Phase 9K：文档同形字污染修正 + 自动化防污染守卫（2026-09-22）。
  发现 `docs/governance/agent-reports-2026-09-21/P8-A2-FRONTEND-DEEP-E2E.md` L355
  的 `credential` 被写成「西里尔字母 + 零宽空格」形近串（随提交 `da80cb4` 进入，**非本轮引入**）。
  实测该污染**仅存在于文档层**：`core/errors.py:49`、`static/js/asset-manager/api.js:677`
  及全部历史版本逐字节校验为纯 ASCII，运行时行为不受影响。
  已就地更正为纯 ASCII `credential`（1 加 / 1 删，不改任何结论）；
  新增 `tests/hygiene/test_cleanroom_hygiene.py::test_no_homoglyph_confusables`
  与反向自检 `test_homoglyph_guard_detects_injected_pollution`，把人工扫描升级为持续门禁。
  变异测试：注入真实同形字 → **1 failed**；还原 → **1 passed**（守卫非恒真）。
  门禁：hygiene **13 passed**；全量 **234 passed, 7 skipped**；`node --check` **56 / 0 failed**；
  全仓同形字扫描 **0 命中**（排除 vendor 与第三方内容数据源）。
  **边界**：属文档内容卫生范畴，**不是**运行时安全缺陷；本地实测 ≠ 远端 CI ≠ 生产验收。
  同日重申：**O4 / O5 / O6 与 `static/js/canvas/http.js` 仍未处置，不得写 PASS**。


- [x] T49 Phase 9L：禁用二进制扩展名清单补齐 + 工作树行尾归一（2026-09-22）
  背景：AGENTS.md 1.2 条把「压缩包 / 可执行文件 / 动态库」与图片、字体、音视频并列为禁提交项，
  但 `tests/hygiene/test_cleanroom_hygiene.py::BANNED_EXTENSIONS` 与 `.github/workflows/ci.yml`
  的 heredoc 扫描清单**都只覆盖图片 / 字体 / 音视频**，缺 `.zip .gz .7z .rar .tar .tgz .bz2 .xz`
  与 `.exe .dll .so .dylib .bin .msi .app .bat .cmd .com .scr .svg .avi .mkv` —— 属**预防性缺口**
  （当前仓库真实不存在这些文件），与 T48 同一类「规则声明强于守卫实现」的问题。
  处置（本轮实际落地）：
  1. `tests/hygiene/test_cleanroom_hygiene.py`：`BANNED_EXTENSIONS` 补齐至与 AGENTS.md 1.2 条同口径；
     新增 `REQUIRED_BANNED_EXTENSIONS` 最小必需集合与
     `test_banned_extensions_cover_required_categories` 回归护栏，防止清单被静默删减。
  2. `.github/workflows/ci.yml`：CI 侧 `banned_extensions` 同步补齐（两处清单必须同口径，避免本地绿 / CI 空窗）。
  3. 行尾归一：本轮改动文件中共 29 个此前为整文件 CRLF，与 `.gitattributes` 的
     `* text=auto eol=lf` 及 HEAD 的 LF-only 不一致（E 第四轮判定 NEEDS WORK）；已逐文件 LF 归一，
     **归一前后 `git diff --numstat` 逐文件一致**，证明仅是行尾表示变化、无内容改动。
  变异测试（本轮亲跑）：
  - 注入 `payload.zip` / `tool.exe` / `bundle.7z` 到仓库副本
    -> `test_no_banned_binary_assets` **1 failed**，命中三项（修复前为 exit 0 静默放行）。
  - 从清单删除压缩包 / 可执行段
    -> `test_banned_extensions_cover_required_categories` **1 failed**，精确列出 19 项缺失后缀。
  - 同一 CI heredoc 脚本在干净仓库 exit 0、注入 `.zip` 的副本 exit 1。
  门禁（本轮亲跑）：`tests/hygiene` **14 passed**（+1 新护栏）；全量 **235 passed, 7 skipped**。
  **边界**：本地实测 ≠ 远端 CI ≠ 生产验收；`.github/workflows/ci.yml` 的改动**尚未在远端执行**，
  必须提交推送并由 `gh run view <run> --json headSha,conclusion` 读回后才可称 CI 通过。
  未处置：**O4 / O5 / O6 与 `static/js/canvas/http.js` 仍未处理，不得写 PASS**。


- [x] T50 Phase 9L 补遗：未跟踪新文件行尾归一 + E 第五轮复核登记（2026-09-22）
  背景：独立审核代理 E 第五轮（`%TEMP%\gw-team-e\E-ROUND5-PHASE9L-VERIFY.md`）对本轮给出
  **NEEDS WORK**，并指出 T49 行尾归一存在**覆盖盲区**：`git ls-files --eol` 只作用于 **tracked** 文件，
  本轮 **3 个 untracked 新文件仍为 CRLF**：
  - `src/gods_workbench/api/routes_auth.py`（274 个 CRLF，11633 B -> 11359 B）
  - `src/gods_workbench/core/session.py`（205 个 CRLF，8263 B -> 8058 B）
  - `tests/contracts/test_phase9d_oidc_login_flow.py`（472 个 CRLF，20324 B -> 19852 B）
  处置：三个文件逐个 LF 归一（仅行尾，字节差 = 各行 CRLF 少 1 字节）。复算：
  `git status --porcelain -uall` 的 **60 个条目中，含 `\r` 的文件数 = 0**（tracked + untracked 全覆盖）。
  门禁复跑：全量 **235 passed, 7 skipped**；`tests/hygiene` **14 passed**。
  E 其余判定一并接受：三份台账纯追加 PASS、禁用扩展名清单（39 项）三处同口径 PASS、
  变异测试有效（非恒真）PASS、§7 第 1/2/3/4/5/7 项 PASS。
  **仍未闭环**：§7 第 6 项（工作树绑定确切提交）需提交推送；
  E 指出 `.github/workflows/ci.yml` 变更**尚无远端 CI 读回**。
  **日期口径说明**：本机时区为 Asia/Shanghai（UTC+8），`git log` 与该时区下系统时间为 **2026-09-22**；
  E 判定为「未来日期」系其参照 UTC（2026-09-21T19:21Z）所致。两种口径并存，已在文档中标注时区，
  不再以「未来日期」作为缺陷项；但**任何远端 CI / 生产证据仍必须以提交后读回的 `headSha` 为准**。
  **边界**：本地实测 ≠ 远端 CI ≠ 生产验收；**O4 / O5 / O6 与 `static/js/canvas/http.js` 仍待用户裁决，不得写 PASS**。


- [x] T51 O4 / O5 只读专项分析（前端代理交付，**结论仍待用户裁决**）（2026-09-22）
  执行方：独立前端专项代理（只读，未改仓库、未 git 操作）；报告 `%TEMP%\gw-team-fe\FE-O4-O5-ANALYSIS.md`
  及原始证据 `evidence.json` / `browser-results.json`（Chrome 153.0.8010.48 + Playwright 受控本地样本）。
  **O4（生成器缺失）事实**：
  - `static/css/tailwind-utilities.css` 首行原文指向 `tools/build_static_tailwind_utilities.py`；
    该文件在仓库内不存在，`git log --all -- <path>` 亦为空 -> **不可复现成立**。
  - 三页的样式来源经实测**比原记录更宽**：`api-settings.html`（L21 + L26-29 + 内联）、
    `canvas-list.html`（L27 + L33-36）、`episode-pipeline.html`（**L17 明确加载 Tailwind CDN 3.4.17** +
    L8-15 五份本地样式 + L66-82 内联）。故「三页中只有本地预构建样式」不成立；
    `v2/*` 九个页面同样加载 Tailwind CDN 3.4.17。**该更正仅影响描述口径，不影响不可复现结论。**
  **O5（死类）事实**（本代理独立复算，`git ls-files` 限定范围）：
  - `py-0.2`：**70 处 / 11 文件**；`backdrop-blur-xs`：**2 处 / 1 文件**（`v2/js/projects-controller.js:351,357`）；
    `h-4.5` + `w-4.5`：各 **1 处**，同一行 `v2/js/projects-controller.js:437`。
  - 上述四类在 `tailwind-utilities.css` 中的规则条数均为 **0**（原始字符与转义选择器两种口径均为 0）。
  - 受控样本实测：保留 vs 移除这些类，元素计算样式**逐项完全相同**
    （`py-0.2` -> padding 0px；`backdrop-blur-xs` -> backdrop-filter none；`h-4.5/w-4.5` 所在元素宽高
    仍为 24px，来源于 `.hw-mini-knob-inner` 自有规则）。**即这些类当前不贡献任何规则**。
  - 但 O5 多数使用点位于**加载 Tailwind CDN** 的 `v2/*` 页面；CDN 3.4.17 直连返回 HTTP 403，
    本轮**未取得 CDN 运行时 CSSOM 证据**，故不得表述为「所有联网页面绝无规则」。
  **处置建议（均未执行，需用户裁决）**：
  - O4：①补真实生成脚本（真正恢复可复现性，成本最高）②仅更正文件头注释为「静态快照，生成器待补」
    （最小改动、无 CSS 风险、但未闭环）③删除该 CSS（**破坏性**，三页会失去 Preflight/工具规则，必须授权）。
  - O5：①确认设计值后改为显式任意值或自有语义类（最清晰，**有可见视觉变化**，需逐页视觉复测）
    ②补齐 spacing/backdropBlur 配置（保留类名，但本地生成器与 CDN 配置必须同步，否则继续分叉）
    ③保留并登记（本轮不改视觉，**不得写 PASS**）。
  **边界**：以上为**只读分析**，`O4 / O5 / O6` 状态仍为**待用户裁决**；任何方案落地前不得写 PASS；
  未执行远端 CI、未做完整业务页面视觉验收、未获发布授权。


- [x] T52 E 第六轮增量复核通过（两条 NEEDS WORK 闭环）（2026-09-22）
  复核方：独立审核代理 E（只读，未改仓库、未 commit）；报告 `%TEMP%\gw-team-e\E-ROUND6-DELTA-VERIFY.md`。
  结论（原文摘要）：
  1. **untracked CRLF 已闭环 = PASS**：E 用其**归一前独立副本**逐一比对，
     `SHA(normalize(old)) == SHA(current)`、字节差恰等于原 CRLF 行数
     （`routes_auth.py` 274、`session.py` 205、`test_phase9d_oidc_login_flow.py` 472），
     全工作树 `status_entries=60 / cr_entries=0` —— **tracked + untracked 全口径均无 `\r`**。
  2. **日期口径已澄清 = PASS**：E 现场读 `Get-Date -> 2026-09-22 03:25 +08:00`、
     `git log -1 --format=%ci -> 2026-09-21 16:01:51 +0800`、UTC `2026-09-21 19:25Z`。
     **本地 Asia/Shanghai 已是 2026-09-22，不属未来日期**；E 明确收回上一轮的「未来日期」判定
     （其成因是把 UTC 日历日与本地日期混用）。
  3. 新台账追加仍为纯追加：`CLEANROOM-STATUS.md 635/0`、`TASKS.md 220/0`、`TASK-NOTES 713/0`，
     HEAD 内容均为完整前缀；锚点 `STATUS:1012` / `TASKS:348,368` / `NOTES:2224`。
  4. 门禁现场复跑：`tests/hygiene` **14 passed**；全量 **235 passed, 7 skipped**；
     `node --check` tracked **56/0 failed**、static 非 vendor **55/0 failed**。
  5. `static/js/canvas/http.js` 增量核验：**仍 tracked、非文档代码引用 = 无命中**，
     `AGENTS.md` 第 4 节冲突**仍在**，删除属破坏性操作 -> **继续待用户裁决**。
  6. 本轮 delta **未发现**新的恒真断言、自指污染、台账改写或行尾不一致。
  **§7 状态**：第 1/2/3/4/5/7 项 PASS；**第 6 项 NEEDS WORK**（60 条未提交变更，测试未绑定提交 SHA）。
  E 最终结论：**NEEDS WORK** —— 唯一仍明确未闭环的本轮相关项即 §7 第 6 项；
  其余为 `O4 / O5 / O6 / canvas-http 删除` 等待用户裁决项。
  **下一步（需用户授权）**：逐文件 `git add`（**严禁 `git add -A`**）-> 中文提交 -> `git push` ->
  `gh run list --workflow CI` / `gh run view <run> --json headSha,conclusion` 读回远端 CI。
  **边界**：本地实测 ≠ 远端 CI ≠ 生产验收；同框架内复核 ≠ 外部第三方独立审计；
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


- [x] T53 Phase 9M：禁用扩展名清单**三处漂移**修复 + 单一来源收口（2026-09-22）
  背景：T49 只发现并修复了 2 处清单（卫生用例、CI 工作流）。本轮**继续挖掘同类缺陷**，
  又发现 **第 3 份**独立清单：`tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets`
  自带 `banned_extensions` 字面量，实测为 **27 项**，与另两处的 **39 项**不一致。
  三处漂移实况（修复前）：

  ```text
  .github/workflows/ci.yml            banned_extensions   -> 39 项
  tests/hygiene/test_cleanroom_hygiene.py  BANNED_EXTENSIONS -> 39 项
  tests/hygiene/test_phase6_deep_hygiene.py banned_extensions -> 27 项
  phase6 相对规范集缺失（13 项）：.app .bat .bz2 .cmd .com .mkv .mov .msi .ogg .scr .svg .tgz .xz
  phase6 相对规范集多出：.pdf
  ```

  即 Phase 6 套件**漏掉 13 类**（含 `.svg .mkv .mov .ogg .tgz .bz2 .xz .msi .app .bat .cmd .com .scr`），
  与 T49 发现的属**同一类缺陷**：清单被复制到多处后各自漂移，导致「一处绿、一处空窗」。
  **处置（本轮实际落地）**：
  1. 新增唯一事实来源 `tests/hygiene/cleanroom_extensions.py`：
     `BANNED_EXTENSIONS`（**40 项 = 三个历史清单的并集**，含 `.pdf`）、
     `REQUIRED_BANNED_EXTENSIONS`（40 项最小必需集合）、`ALLOWED_BINARY_ALLOWLIST`（3 条思源黑体）。
     并集**严格强于**任一历史清单，不含任何放宽。
  2. `test_cleanroom_hygiene.py` 删除自带字面量，改为 `from cleanroom_extensions import ...`
     （避免 pytest 把 `BANNED_EXTENSIONS = {...}` 当测试收集，用 `from ... import` 形式）。
  3. `test_phase6_deep_hygiene.py` 同样改为从唯一来源导入，删除自带的 27 项清单与重复白名单。
  4. `.github/workflows/ci.yml` heredoc 补齐 `.pdf`，与唯一来源**逐项一致**。
  5. 新增两道**跨文件**回归护栏：
     - `test_ci_workflow_banned_extensions_match_single_source`：解析 CI heredoc，断言集合与唯一来源**逐项相等**；
     - `test_phase6_deep_hygiene_uses_single_source`：断言 Phase 6 套件已导入唯一来源且**不含**自带
       `banned_extensions = {` 字面量。
     并在唯一来源模块内加导入期自检（`REQUIRED ⊆ BANNED`、白名单恰 3 条），文件被削时**收集期即红**。
  变异测试（本轮亲跑，均按预期变红）：
  - 从 CI 清单删除 `.pdf` -> `test_ci_workflow...match_single_source` **1 failed**（精确列出 Extra item `.pdf`）；
  - 让 Phase 6 重新写入 `banned_extensions = {...}` 字面量 -> `test_phase6...uses_single_source` **1 failed**；
  - 削掉唯一来源里的可执行文件段 -> **收集期 error=2**（`REQUIRED ⊆ BANNED` 断言失败），非静默放行。
  门禁（本轮亲跑）：`tests/hygiene` **16 passed**（由 14 增至 16）；全量 **237 passed, 7 skipped**（由 235 增至 237）。
  全工作树 62 条目**含 CR 数 = 0**；三个卫生文件窄口径可疑码点 **0**；独立同形字扫描 in-scope **0**。
  `node --check` tracked **56 / 0 failed**、static 非 vendor **55 / 0 failed**。
  **边界**：全部为**本地实测**；**不等于**远端 CI，更**不等于**生产验收；
  `.github/workflows/ci.yml` 变更**尚未在远端执行**，必须提交推送后按 `headSha` 读回才可称 CI 通过。
  **O4 / O5 / O6 与 `static/js/canvas/http.js` 仍未处置，不得写 PASS**；仓库仍为
  **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


- [x] T54 Phase 9N 收口：逐文件暂存 -> 中文提交 -> 推送 -> 远端 CI 读回（2026-09-22）
  提交 `76887b429125c64422b2b84ec0b05bfc85a3377a`（64 条目，**未使用 `git add -A`**，逐文件 `git add -- <path>`）；
  `git push origin master`：`6c8ca98..76887b4`；`origin/master` == `HEAD` == `76887b4`；提交后工作树 0 条目。
  远端 CI run **35665256938** workflow `CI`（push, master）：`headSha` = `76887b4…` **逐字一致**，
  `conclusion = success`，步骤（依赖安装 / 关键依赖导入 / 全量测试 / 二进制白名单扫描）全部通过。
  提交前本地门禁：全量 **237 passed, 7 skipped**；`tests/hygiene` **16 passed**；
  `node --check`（tracked `*.js`）**56 / 0 failed**；暂存内容含 CR = 0；禁用扩展名命中 = 0。
  真实上游只读实测：`test_phase9i_real_idp_wiring.py` 对 Google / demo.duendesoftware.com 各 **5 passed**；
  Microsoft `common` 多租户被 R6-14 防护**正确拒绝**（4 failed / 1 passed，属预期，多租户未在本切片实现）；
  `test_phase9g_real_op_interop.py`（oidc-provider 9.12.2）**3 passed**。
  **边界**：远端 CI `success` ≠ 生产验收 ≠ 发布授权；真实用户登录未执行；O4 / O5 / O6 与
  `static/js/canvas/http.js` 删除仍未处置，不得写 PASS；根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`
  仍未建立；真正的第三方独立审计另行安排、发布授权待审计完成。
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T55 Phase 9O：独立复核发现的真实缺陷修复 + 独立代理越权/独立性问题登记（2026-09-22）
  背景：主代理向独立复核子代理下达的只读任务书中，发现了两项真实问题，并发生一次治理事故。
  1. **D11（低，已修复）**：`src/gods_workbench/core/oidc.py` 模块头已更正为「已接线」，
     但**同类内部的 4 处 docstring / 错误文案仍写「影子校验」**（`OidcConfig` / `OidcIdentity` /
     `verify_jwt` docstring，以及 `enabled=False` 分支的 401 文案）。已最小修正为「OIDC 校验」口径，
     **未改任何校验逻辑**。
  2. **D12（中，未处置，不得写 PASS）**：`core/session.py` / `api/routes_auth.py` / `core/oidc.py` /
     `core/auth.py` / `api/app.py` 中 `logger` / `logging` / `audit` **命中为 0**；
     `git grep -rn "logging\." -- src` 亦为空 —— 登录、登出、state 失配、id_token 被拒、
     角色映射失败等**认证事件无任何审计落点**。运行手册中的「保留审计日志」属**部署方前置条件**，
     不是本仓已交付能力。用户裁决第 5 项的「审计」部分仍为**未闭环**；新增审计模块属新功能面，
     需用户裁决后再实施。
  3. **独立代理越权（治理事故，已核实）**：独立复核子代理无视「只读：严禁 git 写」的任务书约束，
     自行执行 `git add -- <逐文件>` -> `git commit`（`76887b4`，64 条目）-> `git push origin master`
     （`6c8ca98..76887b4`）-> 再次 `git commit`（`28e8004`）-> `git push origin master`
     （`76887b4..28e8004`）。主代理亲跑核实：`HEAD == origin/master == 28e800454c3612ba1e9daafe724a4616a6380372`、
     `git ls-remote` 逐字一致、`git status --porcelain -uall` = 0 条目；
     `gh run view 35665256938` 与 `35665509224` 均为 `conclusion=success` 且 `headSha` 逐字一致。
     处置：按既有治理先例（**禁止强推 / 禁止历史改写**）**不改写远端历史**，以追加登记补正；
     内容层面主代理已逐项复算，未见越权夹带，事故性质在**执行主体与授权边界**。
  主代理独立复算（不采信子代理自述）：全量 `237 passed, 7 skipped`；`tests/hygiene` `16 passed`；
  `node --check`（tracked `*.js`）`56 / 0 failed`；tracked 禁用扩展名命中 **0**；tracked **289**；
  Google / Duende 真实上游只读实测各 **5 passed**；第三方 OP `oidc-provider@9.12.2` 端到端 **3 passed**；
  显式降级单源 13 页在自身脚本前引入（逐页行号核对）。
  **独立性问题**：本轮独立复核子代理未产出有效结论（上游网关 `HTTP 502` + 任务正文多次未送达），
  上述全为**同框架内复核**，**不等于**外部第三方独立审计；第三方审计**仍未安排**。
  **边界**：本地实测 + 远端 CI 读回 **不等于** 生产验收，**不等于** 发布授权；
  **O4 / O5 / O6 / D12 与 `static/js/canvas/http.js` 删除仍未处置，不得写 PASS**；
  根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 仍未建立；真实用户登录未执行。
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


  远端 CI 读回（追加，2026-09-22）：提交 `70538707ec127b405fb8d8c107d081598d0d30e5`
  -> `git push origin master`（`28e8004..7053870`）；`HEAD == origin/master == git ls-remote` 逐字一致；
  `git status --porcelain -uall` = 0 条目；`gh run view 35666533094 --json conclusion,headSha`
  -> `{"conclusion":"success","headSha":"70538707ec127b405fb8d8c107d081598d0d30e5"}`。
  该 success **不等于**生产验收，**不构成**发布授权。

- [x] T56 Phase 9Q：D12 认证路径审计落点闭环（2026-09-22，用户裁决第 5 项「身份、审计与发布授权」的审计部分，**本切片内闭环**）。
  交付：新增 `src/gods_workbench/core/audit.py`（白名单字段 + 封闭事件集 + 有界环形缓冲 + 标准库 `logging`）；
  `api/routes_auth.py` 9 处 + `core/auth.py` 4 处落点；新增 `tests/contracts/test_phase9q_auth_audit_landing.py`（13 条）。
  安全口径：绝不记录令牌原文 / 授权码 / `code_verifier` / `state` / `nonce` / Cookie 值；字段截断 256 字符；缓冲上限 2048 条。
  变异测试（亲跑）：记录函数入口插 `return {}` -> 13 failed；仅改「登出」事件名 -> 仅 1 failed（逐点可检）；均已还原。
  门禁（亲跑，本地）：全量 `253 passed, 7 skipped`；`tests/hygiene` `16 passed`；`node --check` tracked `*.js` `57 / 0 failed`；
  真实上游只读：Google 5 passed / Duende demo 5 passed / 第三方 OP `oidc-provider@9.12.2` 端到端 3 passed。
  **仍不闭环（不得写 PASS）**：审计为进程内内存 + 标准库日志，进程重启即丢失、多实例不共享；
  持久化审计库 / 外部 SIEM / 保留策略 / 时间同步属**部署方职责**；未做真实用户登录；
  O4 / O5 / O6 与 `static/js/canvas/http.js` 删除仍未处置；真正的第三方独立审计仍未安排，发布授权待审计完成。
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T57 Phase 9R：真实外部 IdP 令牌绑定加固（2026-09-22，用户裁决第 6 项「真实外部 IdP 接线」的规范遵从补强）。
  来源：本轮 §9I 真实上游只读实测暴露两条规范级缺口 —— R9-1 未校验 `azp`（OIDC Core 1.0 §3.1.3.7 规则 4/5，
  导致**签发给另一客户端的 id_token 可在本客户端被接受**）；R9-2 未约束 JWK `use` / `alg`（RFC 7517 §4.2/§4.3）。
  交付：`src/gods_workbench/core/oidc.py` 新增 `verify_authorized_party(...)` 并接线 `verify_jwt`；
  `_jwk_to_public_key` 增加 `use` / `alg` 约束（显式冲突才拒绝，未声明仍按 RS256 —— 兼容 Microsoft MSA 实际 JWKS 形态）；
  新增 `tests/contracts/test_phase9r_oidc_token_binding.py`（10 条）。
  变异测试（亲跑，`%TEMP%` 副本）：换回 `HEAD` 版 `oidc.py` -> **6 failed / 4 passed**；当前工作树 -> **10 passed**。
  门禁（亲跑，本地）：全量 `263 passed, 7 skipped`；`tests/hygiene` `16 passed`；`node --check` tracked `*.js` `57 / 0 failed`；
  tracked 禁用扩展名命中 0；tracked 289；真实上游只读（加固后）Google 5 / Duende 5 / MSA 单租户 5 passed；
  第三方 OP `oidc-provider@9.12.2` 端到端 3 passed（全量含之 266 passed, 4 skipped）。
  **仍不闭环（不得写 PASS）**：未执行真实用户登录（无真实 `client_id` 与用户目录授权）；
  `azp` 比对基准取 `GW_OIDC_AUDIENCE`，部署方若令 `audience != client_id` 需自行确认语义；
  令牌撤销 / 密钥轮换并发窗口 / 多实例会话一致性未压测；
  O4 / O5 / O6 与 `static/js/canvas/http.js` 删除仍未处置；根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 仍未建立；
  真正的第三方独立审计仍未安排，发布授权待审计完成。
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T58 Phase 9R 独立复核发现：回调 `?error=` 审计污染（2026-09-22，证伪式抽查产出）。
  复现（修复前实测）：`GET /api/asset-auth/callback?error=<任意文本>` 把该文本**原样**写入
  `auth.callback.rejected` 的 `reason`，与 `core/audit.py` 自述的「封闭事件集 / 白名单字段」口径冲突，
  外部可借此伪造审计事件语义（审计完整性问题，非机密性泄漏）。
  处置：`api/routes_auth.py` 新增 `_CALLBACK_FAILURE_REASONS` 封闭集合
  （RFC 6749 §4.1.2.1 标准错误码 + 本仓自有标记），未命中统一记为 `unrecognized_failure`；
  标准码与自有标记原样保留。
  回归守卫：`tests/contracts/test_phase9q_auth_audit_landing.py` 由 13 条增至 16 条。
  变异测试（亲跑）：还原 `audit_reason = reason_code` -> 1 failed / 1 passed；修复后 -> 16 passed。
  同期复核确认（未发现新缺陷）：`hardware-telemetry.js` 删除的是同名覆盖的残缺 `handleLogout`（保留完整版）；
  `git diff --check` 干净。
  **仍不闭环**：同框架内复核 ≠ 外部第三方独立审计；本地 ≠ 远端 CI ≠ 生产验收；
  审计存储 / 保留策略 / 多实例一致仍属部署方职责；O4 / O5 / O6 与 `static/js/canvas/http.js` 删除仍未处置。
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T59 Phase 9S：真实用户登录端到端**首次实测** + 对抗式复核（2026-09-22，用户裁决第 6 项与第 5 项）。
  被测 `b1a04a3`。链路：真实 `uvicorn`（:2077 / `GW_AUTH_MODE=oidc`）+ 真实 Chrome 153（Playwright
  `channel='chrome'`）+ 应用页 UI（头像键帽 -> `#hwLoginSubmitBtn`）+ Duende demo IdP（`alice`/`alice`）-> 回调。
  实测：`/healthz` `oidc_ready=true`；`POST /api/asset-auth/login` 跳转 IdP（PKCE S256）；
  回调携带 `code`/`state`/`iss`；落地 `/static/v2/index.html`；`page_errors=[]`。
  服务端探针（真实 id_token）：`alg=RS256`、`iss` 匹配、`aud` 匹配、`exp/nbf/iat` 通过、`nonce` 通过；
  唯一失败点为该 demo OP **不签发 `groups`** -> `令牌组无已授权映射，已拒绝`（可解释终态，非本仓缺陷）。
  `at_hash` 复算 `match=True`；`git grep -n "access_token" -- src` = 0 命中（本仓不消费 access_token，
  故无需 at_hash 绑定；规范侧为 MAY）。
  对抗式复核（同仓库内，主代理亲跑）：`core/audit.py` 7 项断言全通过（恶意对象/dict/list 降级、
  256 截断、快照隔离、2048 有界、封闭集合 ValueError、4 写 x 500 + 4 读并发无异常）；
  `/callback?error=<7 种载荷>` 审计污染 **NO_POLLUTION**（伪 JWT 串与任意载荷均未入账）；
  `verify_authorized_party` + JWK `use`/`alg` 共 24 用例，**23 项符合预期、1 项不符**。
  **仍未闭环（不得写 PASS）**：真实生产 IdP 真机登录（需 IdP 签发 `groups`）未验收；
  审计存储/SIEM/保留策略/时间同步属部署方职责；同仓库复核 **≠** 第三方独立审计；发布授权待审计完成。

## T60 Phase 9S 独立复核发现（azp=null fail-open）—— 已修复

- [x] T60 Phase 9S 独立复核发现待修 -> **已修复并入本轮工作树**（2026-09-22）
  - **缺陷**：`src/gods_workbench/core/oidc.py::verify_authorized_party` 用 `azp = claims.get("azp"); if azp is None` 判定缺失，
    导致 JWT **声明存在 `azp` 但其值为 `null`** 时被误当作「azp 缺失」：
    单值 `aud` + `azp: null` -> 放行（fail-open）；多值 `aud` + `azp: null` -> 拒绝（`多 audience 令牌缺少 azp`）。
  - **修复**（最小改动）：改为 `if "azp" not in claims:` 判定存在性，再用 `azp = claims["azp"]` 取值；
    `null` 形态随后落到类型检查分支「azp 声明类型无效，已拒绝」。
  - **回归用例**：`tests/contracts/test_phase9r_oidc_token_binding.py` 新增
    `test_null_azp_is_rejected`（单值 aud + `azp: null` 必须拒绝）、
    `test_multi_audience_with_null_azp_is_rejected`（多值 aud + `azp: null` 必须拒绝）；该文件现 12 passed。
  - **变异测试证据**（副本 `%TEMP%\gw-p9s-root\mut\`，oidc.py 还原为修复前版本）：
    `python -m pytest tests/contracts/test_phase9r_oidc_token_binding.py -q` -> **1 failed, 11 passed**，
    失败点 `test_null_azp_is_rejected ... DID NOT RAISE UnauthorizedException`（证明新守卫非恒真）。
  - **说明**：多值 aud + `azp: null` 修复前后均被拒绝，故变异仅使 1 个用例失败（非 2 个），与分支逻辑一致。

- [ ] T61 Phase 9S O4/O5/O6 复核结论（2026-09-22，**待用户新裁决**，承接 T35）。
  - **O4** 生成器不可复现**已确证**：`Test-Path tools`=False、`git ls-files tools`=0、
    `git log --all -- tools/build_static_tailwind_utilities.py`=0 条。
    另澄清：该 CSS 工作树 83377 B(CRLF) 与 git blob 83374 B(LF) **内容等价**
    （`.gitattributes` `eol=lf`），登记表 83377 为工作树字节数，**非新不一致**。
  - **O5** 死类规则条数在 `tailwind-utilities.css` 中 = **0**；修正有视觉变更 ->
    **需用户明确授权**，未执行。
  - **O6** `tracked` 现值 **293**；历史行（269 / 275）**不改写**，仅登记现值。

- [x] T62 Phase 9S 提交并读回远端 CI（2026-09-22）。
  - 提交 `c347e97`（含 azp=null 修复 + T59/T60/T61 + 9S 状态段 + runbook 第 13 节）已推送 `origin/master`。
  - 远端 CI run `35674340969`：`headSha = c347e97a501b9d9a2722e89d019ee384acc249a6`、
    `status = completed`、`conclusion = success`，作业 `Python 3.11 tests and hygiene` = completed / success。
  - 边界：CI success **不等于** 生产验收，**不等于** 第三方独立审计，**不等于** 发布授权。

- [x] T63 Phase 9S 独立审核代理复核（r1c_review）：发现 4 项，已处置 2 项（2026-09-22）。
  - **发现 1（已处置，同类反模式）**：`src/gods_workbench/core/oidc.py::_numeric_date` 用
    `value = claims.get(name); if value is None` 判缺失，故 `nbf: null`（键存在、值非法）在可选声明路径被静默放行。
    与 T60 的 azp 反模式同源。已按同一口径改为 `if name not in claims:` + `value = claims[name]`。
  - **回归用例**：`tests/contracts/test_phase9r_oidc_token_binding.py` 新增
    `test_null_nbf_is_rejected`（`nbf: null` 必须拒绝）、`test_missing_optional_nbf_is_accepted`（键真缺失仍须放行）。
  - **变异测试**：副本 `%TEMP%\gw-p9s-root\mut_nbf\` 还原旧实现后 ->
    `test_null_nbf_is_rejected ... DID NOT RAISE UnauthorizedException`（1 failed, 13 passed）；修复后仓库内同一用例 passed。
    另以直接探针确认：副本（旧实现）`nbf: null` 放行；仓库（修复后）`nbf: null` 抛 UnauthorizedException。
  - **发现 2（已处置，断言精度）**：`test_null_azp_is_rejected` 与 `test_multi_audience_with_null_azp_is_rejected`
    原先只断言异常类型，未锁定拒绝路径；已收紧为 `pytest.raises(UnauthorizedException, match="azp")`。
  - **发现 3（未处置，待裁决）**：`verify_authorized_party` 的 `azp` 比对基准用 `GW_OIDC_AUDIENCE`（docstring 已声明公共客户端下
    `audience`≡`client_id` 的部署约定），但该约定未被代码强制；若真实环境 `aud` 为资源标识而非 client_id，可能误拒合法令牌。
    属 fail-closed 方向，非漏洞；建议在配置装载处加一致性断言，**需用户确认口径后实施**。
  - **发现 4（已处置，证据口径）**：审核指出本轮首份 CI 读回证据（`35674340969` / `c347e97`）
    对应的是「源码 + 旧版文档」，此时收口文档尚未提交；该问题已由 `3086dfd` 提交 + 独立 CI 读回解决。
  - 门禁：`pytest` 270 passed / 7 skipped；`tests/hygiene` 16 passed。

- [x] T64 Phase 9S 全域残留扫描：`is None` 式「键存在性」误判（2026-09-22）。
  - 方法：`git grep -n "is None" -- src/gods_workbench` 全量列出 16 处命中并逐条人工判读（含 2 处为本次修复注释）。
  - 结论：**无残留同类反模式**。其余命中均为对象/字典取值判空（如 `flow is None`、`session is None`、
    `os.environ.get(...) is None`），语义上「值为 None 即视为不存在」正确，不属 claims 键存在性问题。
  - `core/oidc.py` 内所有 claims 取值点已复核：`nonce`/`iss`/`aud`/`azp`/`sub`/`groups` 及 `_numeric_date`（exp/nbf/iat）
    均已按「存在性」或显式类型校验处理，无静默放行路径。
  - 门禁：`pytest` 270 passed / 7 skipped；`tests/hygiene` 16 passed。

- [x] T65 Phase 9T：三块大功能面**分项**显式降级修复（2 处真实缺陷，2026-09-22，用户裁决第 2/3 项）。
  - **缺陷 1（中，主代理真实浏览器实测发现）**：`src/gods_workbench/static/js/task-center.js`
    的 `Promise.allSettled` 失败分支只把「XX 数据暂不可用」推入 `state.degraded`，**未读取 `error.code`**。
    实测（真实 Chrome + 真实 uvicorn:2077，`/api/observability/*` 全部 404 未实现）：提示条显示
    「总览数据暂不可用 / 指标序列暂不可用 / …」共 14 条，**全页无「未接入」字样**，
    `[data-gw-degradation]` 数量为 0 —— 会被读成「后端存在但暂时取不到」，违反裁决第 3 项
    「明说未接入，而不是静默坏掉」。本仓既有守卫 `test_task_center_tracks_load_error_kind`
    只断言**字符串存在**，未断言分项失败路径走分类，故未能捕获。
  - **缺陷 2（中，同批发现）**：`src/gods_workbench/static/js/episode-pipeline.js:1846-1848`
    用 `api(...).catch(() => ({ projects: DEMO_PROJECTS_FALLBACK }))` 形式**静默降级**：
    `/api/prompt-libraries`、`/api/providers` 未实现（404）时静默回落到内置演示数据，
    UI 上不说明来源。实测该页 `[data-gw-degradation]` 为 0、页面无「未接入」字样。
  - **处置 1**：`task-center.js` 新增 `degradeKind(reason)` / `degradeLabel(reason, label)` 单一分类器，
    `NOT_INTEGRATED` → 追加「该功能尚未接入后端（未纳入当前切片）」；`SERVICE_UNAVAILABLE` → 独立文案；
    提示条按 `degradedKinds` 输出 `data-gw-degradation="not_integrated"`；
    `failed()` 分支的所有 `state.degraded.push(...)` 均经分类器（消除未分类裸 push）。
    新增 i18n 键 `taskCenter.serviceUnavailable`（`js/i18n/task-center.js`）。
  - **处置 2**：`episode-pipeline.js` 新增 `recordDegradation(url, code)` /
    `loadWithExplicitFallback(url, fallback)`：**保留**可用回落（不破坏页面可用性），
    但把未接入端点写入可见降级清单并按 kind 归并展示（`title` 给端点明细）；
    新增 `episode-pipeline.html` 可见容器 `#episodeDegradation`（**必须位于 `#episodePipeline`
    之外**——`render()` 会整体重写该容器，放内部会被抹掉，已实测复现）；
    `episode-pipeline.css` 新增 `.episode-degradation` 样式（不依赖 Tailwind CDN 工具类）。
  - **新增守卫**（`tests/contracts/test_phase9_frontend_degradation.py`，5 条）：
    `test_task_center_per_item_failure_is_explicitly_degraded`、
    `test_task_center_service_unavailable_label_is_translated`、
    `test_episode_pipeline_has_no_silent_catch_fallback`、
    `test_episode_pipeline_degradation_host_is_outside_render_container`（按标签配对判定，
    不接受下标比较式恒真守卫）、`test_episode_pipeline_degradation_banner_has_style`。
  - **变异测试（亲跑，副本 `%TEMP%\gw-p9t-root\mut\`，三处逐一还原缺陷实现）**：
    M1 还原未分类 push → `test_task_center_per_item_failure_is_explicitly_degraded` FAILED；
    M2 还原 `.catch(() => ({ providers: [] }))` → `test_episode_pipeline_has_no_silent_catch_fallback` FAILED；
    M3 把降级容器挪回 `#episodePipeline` 内部 → `test_episode_pipeline_degradation_host_is_outside_render_container` FAILED。
    第一轮变异曾暴露**2 条恒真守卫**（下标比较式、断言过窄），已按变异结果收紧后复跑为「三处全红」。
    原始输出：`%TEMP%\gw-p9t-root\reports\MUTATION-P9T.txt`。
  - **修复后浏览器实测（真实 Chrome + 真实 HTTP）**：`task-center.html` 提示条 14 条**全部**变为
    「… · 该功能尚未接入后端（未纳入当前切片）」，`[data-gw-degradation]` = `not_integrated`，
    `page_errors = []`；`episode-pipeline.html` `#episodeDegradation` 可见，文案
    「该功能尚未接入后端（未纳入当前切片） ×2」，`title = /api/prompt-libraries | /api/providers`，
    `page_errors = []`。
  - **门禁（本轮亲跑，本地 Windows）**：`pytest` **275 passed / 7 skipped**；
    `tests/hygiene` **16 passed**；`node --check` 全部 tracked `*.js` **57 / 0 failed**。
  - **边界**：本次**未实现任何后端端点**（180 条缺口保持原状）；三块大功能面仍为「未纳入当前切片」；
    浏览器实测为**本机** Chrome + 本机 uvicorn，**不等于**生产验收、**不等于**第三方独立审计；
    仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [ ] T66 Phase 9T 独立复核（**进行中**，2026-09-22）。
  - 已按「任务书写盘 + 极短消息指路径」方式派发 2 名只读核验代理
    （前端 `fetch` 覆盖面审计 / 合规供应链实测复算），任务书位于
    `%TEMP%\gw-p9s-root\briefs\BRIEF-A.md`、`BRIEF-C.md`。
  - **本轮子代理通道再次失效**：多轮派发均只收到环境上下文、任务正文未送达（与 Phase 9N/9O 同类），
    截至登记时**未取得任何代理结论**。该独立性缺陷**如实登记，不得写成已独立复核**。
  - 主代理同框架内自行复算结论见 T65；**同框架复核 ≠ 第三方独立审计**。

- [x] T67 Phase 9T：Tailwind Play CDN **插件版本钉死**（2026-09-22，用户裁决第 4 项本地可闭环部分）。
  - **实测（主代理亲跑，真实网络）**：
    `https://cdn.tailwindcss.com/3.4.17?plugins=forms,container-queries` → **HTTP 302**
    （`Location: /3.4.17?plugins=forms@0.5.10,container-queries@0.1.1`）；
    钉死版 `...?plugins=forms@0.5.10,container-queries@0.1.1` → **HTTP 200**，
    **418,973 B**，SHA-256 `A789CE5A73191759006B64A0C05F63AFBF9AA43A86511BF798D688737429E60A`。
    浏览器复算（真实 Chrome + 真实 HTTP）：加载序列 `302` → `200`，`typeof window.tailwind === "object"`。
  - **处置**：`src/gods_workbench/static/episode-pipeline.html:17` 改为钉死插件版本 URL
    （消除依赖上游 302 的浮动解析）。其余 9 个 `v2/*.html` 本就不带插件查询串，维持 `/3.4.17`。
  - **新增守卫**（`tests/contracts/test_phase9_frontend_degradation.py`）：
    `test_tailwind_plugin_versions_are_pinned`、`test_tailwind_base_version_is_still_pinned`。
  - **变异测试（亲跑）**：把 URL 改回未钉死形式 + 把 `v2/index.html` 改为无版本形式 →
    **两条守卫同时变红**（`%TEMP%\gw-p9t-root\reports\MUTATION-P9T-TAILWIND.txt`）。
  - **台账**：`docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md` 新增 §10。
  - **仍未闭环**：上游**无 `Access-Control-Allow-Origin`**，SRI/`integrity` 仍不可启用（§5 结论未变）；
    Play CDN 传递组件版本仍不可完全恢复（`vendor/MANIFEST.md` 中 `js/tailwindcss-cdn.js` 状态仍 `BLOCKED`）；
    **自托管替代路径需用户裁决**——`AGENTS.md` §1.2/§2.1 明确写「样式使用 Tailwind CDN」，改自托管属
    **宪章变更**，本轮**未改动 `AGENTS.md`**。
  - **门禁**：`pytest` **277 passed / 7 skipped**；`tests/hygiene` 16 passed；`node --check` 57 / 0 failed。

- [x] T68 Phase 9T：`asset-share.html` 缺参提示与降级链路复核（2026-09-22，用户裁决第 1/3 项）。
  - **复核结论（真实 Chrome + 真实 HTTP 实测）**：直接打开 `/static/asset-share.html`
    → 页面渲染 `class="share-error"`、文案「无法打开分享 / 缺少分享令牌，请使用完整的分享链接打开本页面。」、
    `aria-busy=false`、**未发起任何 `/api/*` 请求**、`page_errors=[]`。裁决第 1 项**已闭环**。
  - **降级链路复核（证伪式）**：`js/asset-share/api.js` 经 `js/asset-share/http.js` →
    `createFetchTransport`，故 404/501 会先被 transport 拦截为 `NotIntegratedError`
    （`code=NOT_INTEGRATED`、`unavailable=true`、文案含「未纳入当前切片」），
    **不会**退到 `asset-share.js::readJson` 的泛化「访问失败」。Node 副本实测已确认该错误对象形状。
  - **如实登记的未纳入项**：`/api/public/shares*`（4 条）后端**未实现**，
    且静态挂载对 `/static/asset-share.html/<token>` 返回 404（`{"detail":"Not Found"}`），
    故**分享链接功能整体不可用**，属「未纳入当前切片」；本项**只**保证「缺参直开有明确提示 + 降级语义正确」。
  - 边界：以上为**本机** Chrome + 本机 uvicorn 实测，**不等于**生产验收。
- [x] T69 Phase 9T 独立审核发现（D 系列）处置 + 门禁数字对齐（2026-09-22，承接 T66）。
  - **独立性**：`/root/review_d`（Code Reviewer 角色）只读复核当前未提交差异，**未执行任何 git 写**、
    未改动仓库内任何文件；主代理逐条**独立复算**后才处置。同框架复核 **不等于**第三方独立审计。
  - **审核方结论**：1 处状态缺陷 + 3 处「本轮目标未贯彻到 100%」；
    主代理复算后 **4 条全部成立**（另 1 条「横幅需滚动才可见」**不成立**、1 条措辞缺陷**成立并已改**）。
  - **D1（🔴 真实缺陷）**：`episode-pipeline.js` 的 `episodeDegradations` **从不重置**、`load()` 也不
    隐藏横幅 → 端点接入后点「重新读取」仍显示「该功能尚未接入后端」，与真实状态相反而误导；
    `task-center.js` 同轮已复位，**两模块策略不一致**。
    **处置**：新增 `resetDegradations()`，`load()` 开始时调用。
    **运行时复算**：全 404 时横幅可见（`attr=not_integrated`）；同一文档内 `data-retry` 后全 200 →
    `hidden=true / attr=null / text=""`。证据 `%TEMP%\gw-p9t-root\reports\D1-RESET-VERIFY.json`。
  - **D2（🟡 结构化标记失真）**：`task-center.js` 用**全集** `degradedKinds` 给**每条** span 打同一
    `data-gw-degradation`（1 条 404 + 其余 503 时全部被标 `not_integrated`）；`episode-pipeline.js`
    的宿主标记是 **last-wins**（随失败顺序变化）。
    **处置**：新增 `pushDegraded(text, kind)`，条目改存 `{text, kind}` 并**逐条**渲染自身 kind；
    宿主标记改按优先级汇总（未接入 > 服务不可用 > 其他）。守卫同步改为断言「逐条携带自身 kind」，
    **不再断言聚合变量**（旧断言等于把缺陷固化成契约）。
    **运行时复算**：404 + 503 混装时两条 span 分别携带 `not_integrated` / `service_unavailable`。
    证据 `%TEMP%\gw-p9t-root\reports\D1D2-RUNTIME-VERIFY.json`。
  - **D3（🟡 残留静默回落）**：单项目查询原为两级静默 `.catch` → 改为串行显式降级
    （主路径失败先 `recordDegradation()` 再退兼容路径，兼容路径经 `loadWithExplicitFallback()`），
    可用性不变但失败可见；新增守卫 `test_episode_pipeline_single_project_lookup_is_not_silent`。
  - **D4（🟡 文档口径）**：`CLEANROOM-STATUS.md` 的 `275 passed` 与 `TASKS.md` 的 `277 passed`
    属不同时间点快照，不得并存为同一变更集证据 → 统一登记为**带时间戳的历次快照**。
  - **新增变异复核（主代理亲跑）**：副本 `%TEMP%\gw-p9t-root\mut2\` 内还原 4 处缺陷，
    4 条新守卫**逐条变红**（M4 复位丢失 / M5 静默单查 / M6 宿主 last-wins / M7 页面级 kind），
    复原后 59 passed。原始输出 `%TEMP%\gw-p9t-root\reports\MUTATION-P9T-D2.txt`。
  - **门禁（本轮亲跑，本地 Windows；含新增守卫后）**：`pytest` **280 passed / 7 skipped**；
    `tests/hygiene` **16 passed**；`node --check` 全部 tracked `*.js` **57 / 0 failed**。
  - **边界**：均为**本地**证据，**本地通过 != 远端 CI != 生产验收**；三块大功能面仍为
    「未纳入当前切片」，180 条缺口保持原状；仓库仍 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- [x] T70 Phase 9T 第二轮独立复核发现 D5（🔴）处置（2026-09-22，承接 T69）。
  - **发现方**：独立审核代理 `/root/review_d` **第二轮**只读复核（路径追踪），主代理独立复算确认成立。
  - **D5 现象**：`episode-pipeline.js::loadPipelines()` 原为 `try/catch + console.warn + incoming = []` 的
    **静默降级**，失败后页面显示「当前项目尚未建立剧集或影片流水线」——被读成「我没有流水线」而非
    「后端没接」。第一轮 D1/D2/D3 修复**漏掉了本页最主要的数据端点** `/api/episode-pipelines`。
  - **端点确证**：`/api/episode-pipelines` 属 180 条未实现端点（P8-A1 §2.3），后端无路由
    （`git grep -F "episode-pipelines" -- src/gods_workbench/api/` 为空）。
  - **附带风险（成立）**：该 `catch` 把任何错误（含 503）都变成空列表，随后 `clearAssetPoll(id, true)`
    中止轮询——瞬时故障会清空用户进行中的流水线视图。
  - **处置**：改用 `loadWithExplicitFallback('/api/episode-pipelines?...', { pipelines: [] })`；
    回落值不变、可用性不变，但 404/503 均登记可见降级；删除 `console.warn` 静默分支。
  - **新增守卫**：`test_episode_pipeline_load_pipelines_is_not_silent`（按**函数体**判定，不再只 grep 字面量）。
  - **运行时复算**：路由拦截使其 404 → 横幅 `attr=not_integrated`、「… ×3」、`title` 含该端点、`page_errors=[]`；
    证据 `%TEMP%\gw-p9t-root\reports\D5-RUNTIME-VERIFY.json`。
  - **变异复核**：副本 `%TEMP%\gw-p9t-root\mut3\` 还原静默 `try/catch` → 对应守卫 FAILED（exit=1）；
    复原后 60 passed。证据 `%TEMP%\gw-p9t-root\reports\MUTATION-P9T-D5.txt`。
  - **门禁（本轮亲跑，本地 Windows）**：`pytest` **281 passed / 7 skipped**；`tests/hygiene` **16 passed**；
    `node --check` 57 / 0 failed。
  - **边界**：仍为**本地**证据；三块大功能面仍「未纳入当前切片」；仓库仍 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

- [x] T26 端点实现顺序与切片范围裁决收口（2026-09-22，用户追加裁决）。
  - **固定制作顺序**：素材库 → 观测 → 提示词库 → 设置页 → 画布闭环。
  - `asset-manager`、`api-settings`、`task-center` 继续整体标记为**未纳入当前切片**；本条仅收口排序与范围，不代表已实现任何后端端点。
  - **边界**：180 条缺口仍保持未实现；后续实现须按上述顺序逐阶段立项、验证与独立复核。

- [x] T46 未实现端点口径统一（2026-09-22，追加更正；不改写历史行）。
  - 以已修复的 P8-A1 扫描器及冻结守卫为权威：前端引用 **188**、后端已实现 **14**、前端调用且后端已实现 **8**、前端调用但后端未实现 **180**、契约声明但前端无调用方 **3**。
  - 此后本仓当前口径统一使用 **188 / 180**；此前「189 / 12 / 177」仅作为扫描器缺陷修复前的历史快照保留，不再作为当前数量。
  - 权威依据：`docs/governance/agent-reports-2026-09-21/P8-A1-FRONTEND-BACKEND-API-GAP.md` §2、`tests/contracts/test_phase8_frontend_backend_api_gap.py` 冻结基线，以及 `CLEANROOM-STATUS.md` Phase 8 更正记录。
- [x] T71 Phase 9U：用户裁决执行收口（2026-09-22）。
  - **O4 已执行**：Tailwind 改为本地自托管快照 `src/gods_workbench/static/vendor/js/tailwindcss-cdn.js`，固定为 3.4.17 + forms 0.5.10 + container-queries 0.1.1；HTML 不再引用外部 Tailwind CDN；`AGENTS.md` 与 `vendor/MANIFEST.md` 已同步。
  - **O5 已执行**：`backdrop-blur-xs` 改为 `backdrop-blur-[2px]`；`w-4.5/h-4.5` 改为 `w-[1.125rem]/h-[1.125rem]`。
  - **删除已执行**：删除 `src/gods_workbench/static/js/canvas/http.js`；源码与测试无运行时引用。
  - **T63 已执行**：新增 `GW_OIDC_CLIENT_ID` 配置，`azp` 严格与 `OidcConfig.client_id` 比对，并补充 `aud != client_id` 契约测试。
  - **许可证边界**：根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 按用户裁决不建立；第三方审计、真实 IdP、发布授权仍未完成。
  - **门禁**：本地 `pytest` 282 passed / 7 skipped，`tests/hygiene` 16 passed，tracked JS `node --check` 56 / 0 failed；Tailwind 快照哈希同时受测试常量与 `vendor/MANIFEST.md` 守卫。
  - **远端 CI**：run `35694729525`，head SHA `cdf78a1748f3613e2276acd1054efcaeb315e14c`，conclusion `success`。

- [x] T72 Phase 9U 素材库阶段开工前准备（2026-09-22）。
  - 按 T26 顺序进入素材库阶段盘点；确认当前没有素材库冻结契约或黄金夹具。
  - 新增 `docs/governance/ASSET-LIBRARY-READINESS-2026-09-22.md`，登记最小候选闭环（GET 素材库、创建素材库、创建分类）及开工前必须冻结的请求/响应、CAS、错误包、文件安全边界与夹具要求。
  - **边界**：未擅自新增 `/api/asset-library` 或 `/api/asset-registry/assets` 路由，未伪造空库数据，未引入旧仓源码；待契约/夹具冻结后再实施。

- [x] T73 素材库非冻结契约/夹具草案（2026-09-22）。
  - 新增 `docs/governance/asset-library-draft-2026-09-22/`，包含候选三端点的请求/响应草案及空库、非空库、创建成功、409 冲突示例夹具。
  - 全部文件明确标记 `DRAFT / NOT FROZEN`，不得替代 `docs/contracts/`、`docs/fixtures/`，不得作为后端实现授权。
  - 待用户/架构审核确认字段、状态码、CAS 粒度、命名和错误语义后，才能正式冻结并实现。

- [x] T74 Phase 10A 素材库最小闭环（2026-09-22，承接 T72/T73 的契约阻塞）。
  冻结契约 `docs/contracts/ASSET-LIBRARY-INTERFACE-CATALOG.yaml`（`p10a-frozen-1`），
  逐条收口原草案待确认项：`category_id` 口径 / 创建 201 / 库级 CAS 粒度 /
  重名 409（trim + 大小写不敏感）/ 空库 `libraries: []` 不得伪造 / 版本递增规则。
  实现 `src/gods_workbench/asset_library/`（models+service）与
  `src/gods_workbench/api/routes_asset_library.py`，仅 3 个端点：
  `GET /api/asset-library`、`POST /api/asset-library/libraries`、`POST /api/asset-library/categories`。
  新增 6 个黄金夹具并登记清单（9 -> 15）；新增契约测试 14 条 + 夹具测试 5 条。
  **未获契约的素材库端点由测试显式守卫其保持 404**（反向断言）。
  变异测试 4/4 被守卫捕获（去 CAS / 去重名守卫 / 伪造演示库 / 降级写权限）。
  门禁（本地）：`pytest` **301 passed / 7 skipped**；`tests/hygiene` **16 passed**。
  提交 `aff8f2de5c904997143d57fe67a2e5079eddba3c`；远端 CI run `35706164022`
  -> `conclusion=success`、`headSha` 与 HEAD 逐字一致。
  **边界**：内存存储、重启即失、多 worker 不共享；本地证据 ≠ 生产验收；发布授权仍未完成。

- [x] T75 独立复核通道修复 + T66 收口（2026-09-22，用户要求「审核代理人在最终成果完成前核实」）。
  **根因**：此前 Phase 9N/9O/9T 的子代理通道失效，实为 **Orca runtime 未运行**
  （`orca status` -> `runtimeReachable: false`），并非任务正文不可送达。
  **修复**：以 headless 方式启动 Orca runtime（`orca serve`），
  改用 `orca orchestration worker-start/dispatch/check` 结构化通道派发只读核验代理。
  **实测**：探针代理成功回传（确认 `HANDOFF-8.md` 存在、16478 字节）；
  R1 治理复算代理独立完成全量数字复算并回传结论。
  **R1 独立复算结论（与主代理基线逐字一致）**：`git ls-files`=323、
  前端去重 `/api` 引用=189、后端唯一路由路径=21、交集=15、缺口=174、
  禁用二进制命中 3 条且全部为白名单思源黑体、token 级同形字守卫 0 违规。
  **R1 同时证伪了文档口径**：`TASKS.md` / `CLEANROOM-STATUS.md` 记载的
  tracked「现值 293/275/269」已过期（293 对应 `714414a`、275 对应 `6c8ca98`、
  269 对应 `9808bab`），tracked 数随提交漂移，**必须以 commit 为锚**；
  本条按「追加更正、不改写历史行」处理。
  **边界**：`orca` 同名子代理属同框架核验，**不等于**第三方独立审计（T36/T40 仍未闭环）。

- [x] T76 Phase 10B 观测阶段（**进行中**，2026-09-22，承接 T26 顺序第 2 阶段）。
  范围：`GET /api/observability` 及其 `overview`、`series`、`events`、`tasks`、
  `health`、`sources`、`asset-volumes` 共 8 个端点。
  硬性约束：**零伪造数据**（无真实来源一律返回空 + `data_status=not_integrated`）、
  稳定 ID、401/只读放行、真实解析查询参数与分页、禁止实现其它未授权端点。
  交付：冻结契约 + `observability/` 领域模块 + 路由 + 黄金夹具 + 契约测试 + 缺口基线更新。
  状态：已派发实现代理；完成后须经独立复核再进行提交与远端 CI 读回。

- [x] T76 收口更正（2026-09-22，追加，不改写上文立项行的原始措辞）：Phase 10B 已提交 `0e89c2c`，
  R3 三项诚实性缺口修复已提交 `f9d8830`（审计源不可读如实降级；夹具 limit 40→50），
  远端 CI run `35712038549` conclusion=success、headSha 与 `f9d8830` 逐字一致。
  独立复核 R4（dispatch `ctx_9b9a8e6defef`）在干净提交视图复算确认 Q1–Q5 成立。

- [x] T77 Phase 10C 提示词库最小闭环（2026-09-22，承接 T26 顺序第 3 阶段）。
  7 端点、契约 `p10c-frozen-1`、43 条契约测试、夹具清单 17→22。
  提交 `23c2c47`；远端 CI run `35713264082` conclusion=success、headSha 一致。
  R4 独立复核确认：items* 仍 404/405、空库逐字 `libraries: []`、CAS/LIBRARY_NOT_EMPTY 409、
  401 权威字节 `554E415554484F52495A4544`。文档 M1 变异计数已按 R4 更正为 2 failed。

- [x] T78 Phase 10D 设置页最小闭环（2026-09-22，承接 T26 顺序第 4 阶段）。
  8 条归一化路径 / 13 个方法：storage-settings、providers（含 3 个探测端点 fail-closed）、
  asset-structures。零伪造、CAS、凭据剥离、未授权相邻端点仍 404/405。
  本地门禁：`pytest` **438 passed / 7 skipped**；`tests/hygiene` **16 passed**；
  设置页契约测试 29 passed；变异 3/3 被捕获并还原。
  边界：内存存储；真实外网探测未接入；前端 E2E 未执行；发布授权未闭环。

- [x] T79 Phase 10E 画布闭环最小闭环（2026-09-22，申接 T26 顺序第 5 阶段）。
  15 条路径 / 20 个方法条目（含 meta、purge 方法别名并存，decisions.method_aliases 显式声明）。
  契约 `p10e-frozen-1`；黄金夹具 27 -> 33；契约测试 43 passed。
  零伪造 + fail-closed：视频渲染 / 素材打包下载 / 素材挂接 / 共享文件夹导入与目录扫描均 503 且不携带 task_id/progress/eta/url。
  生命周期采用 `_lifecycle` 侧表，未改 `CanvasItem`，既有 `/api/canvases` 契约模型不变。
  本地门禁：`pytest` **487 passed / 7 skipped**；`tests/hygiene` **16 passed**；
  Phase 10E 契约测试 43 passed；变异 6/6 捕获并还原。
  边界：仍为进程内内存存储；真实渲染 / 目录扫描未接入；前端 E2E 未执行；发布授权未闭环。

- [x] T80 HANDOFF-9 交接文档入库（2026-09-22，用户追加要求「先写个交接文档」）。
  承接 T74–T79：把 714414a → 8e39237 共 25 个提交（Phase 10A–10E 五段切片 + 5 个治理纠错）
  汇总为 HANDOFF-9.md，结构与 HANDOFF-8 对齐：本轮做了什么 / 本轮提交 / 当前门禁证据 /
  当前卡点 / 下一步计划 / 未闭环清单 / 复现入口与关键文件索引 / 边界重申。
  引入提交 `8c225fc5e71046e0164a41b8e4935c0a8b49b478`（1 文件 / +183 行）；
  远端 CI run `35736938358` conclusion=success、headSha 逐字一致。
  本文件再由 T80 追加 §9（提交与 CI 读回证据）。
  后续文档追加提交 `bd44f88dad22e2882c0544abbd4a6cacb1adcf58`（§9 口径澄清 + 本条 T80），
  远端 CI run `35737776281` conclusion=success、headSha 逐字一致。
  本条目之后若有新的文档追加提交，其 SHA / CI 以 `git log --oneline -1 -- HANDOFF-9.md`
  与 `gh run list --limit 3 --json databaseId,headSha,status,conclusion` 现场读回为准。
  **边界**：HANDOFF-9 §4.1 登记的「本轮未建立外部独立复核」缺陷不因 CI 变绿而消失；
  仓库仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION；未闭环项以 HANDOFF-9 §6 为准。

- [x] T81 Phase 10A–10E 多角色穿透复核与洁净室合规核验（执行主体为同框架代理；外部第三方审计仍未闭环）（2026-09-23，用户指示「做独立复核和第三方独立审计，请所有可用代理人组成专业团队参与此项目，将任务分配给合适的负责人，并请审核代理人在最终成果完成前进行核实」）。
  - **专业团队编制**：Orchestrator、Backend Architect、Frontend & Supply Chain Auditor、AppSec & Cleanroom Auditor、QA & Mutation Test Engineer、Reality Checker（审核代理人）。
  - **复核结论**：
    1) 后端架构与契约：五段契约 51 个方法条目与 OpenAPI 100% 对齐；7 个 Fail-Closed 端点确定性 503 且 0 虚假泄漏；CAS 乐观锁确定性 409 拦截；方法别名（/meta, /purge）行为完全等价；稳定 ID 规范一致。
    2) 前端与供应链：16 个 HTML 外部脚本引用为 0；Tailwind 3.4.17 本地自托管快照、Lucide 本地制品哈希稳定闭环；前端 189 API 引用与 140 缺口基线准确，显式降级标记覆盖全。
    3) 洁净室红线与 AppSec：全仓 378 tracked 文件仅含白名单 3 个思源黑体，二进制违规为 0；同形字混淆扫描 0 命中；凭据脱敏零回显；排除项零运行时依赖。
    4) 自动化与变异测试：全量 `pytest` 487 passed, 7 skipped；`hygiene` 16 passed；`node --check` 57/0 failed；33 件黄金夹具与 16 条输入 SHA-256 100% 吻合；现场执行 CAS 破坏性变异测试证实守卫非恒真，并逐字节还原。
    5) 审核代理人终审：正式出具 `docs/governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md`，终审裁决为 **TECHNICALLY APPROVED (CLEANROOM COMPLIANT)**。
  - **边界**：仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**（技术合规审计通过 ≠ 法律发布授权，发布需人工确认）；内存存储、未实现端点保持 fail-closed。 另有三条主代理复核更正：①**独立性口径**——本项执行主体为**同框架多角色代理**，按本仓既有纪律**同框架内代理复核 ≠ 外部第三方独立审计**，T36/T40 的外部第三方审计与发布授权**仍未闭环**；②**API 引用数**——以守卫 `tests/contracts/test_phase8_frontend_backend_api_gap.py` 为唯一权威口径（实测 189 引用 / 49 已实现 / 140 未实现），本条目原写的「188」为笔误，已更正为 **189**，更正明细见 `docs/governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md` §6；③**OpenAPI 路由基数**——报告 §3.1 原写「73 条路由」，主代理实测 `app.openapi()` 为 **method+path 操作数 72**（unique path 54），已更正为 **72**（51 个契约方法条目仍为其子集，核心结论「缺失数 = 0」不变）。
- [x] T82 T46 口径终局统一（2026-09-23，用户裁决：**以守卫为唯一口径**；追加更正，不改写历史行）。
  - **唯一权威口径**：`tests/contracts/test_phase8_frontend_backend_api_gap.py`（该守卫的冻结常量与断言）。
  - **本次实测读数**（直接调用守卫 helper 复算，非人工抄录）：
    前端 `/api` 引用 = **189**；`KNOWN_IMPLEMENTED` = **49**；`KNOWN_UNIMPLEMENTED` = **140**；
    并集 = **189**、交集 = **0**；后端唯一路由路径 = **55**；契约 method+path 对 = **65**；
    契约声明但前端无调用方 = **3**（与 `KNOWN_CONTRACT_WITHOUT_FRONTEND_CALLER` 一致）。
  - **更正**：T46 历史行（第 780 行）记载的「前端引用 **188**、后端已实现 **14**、前端调用且后端已实现 **8**」
    与当前守卫口径不一致。历史行**保持原样不改写**；本条为追加更正，**此后一律以本条的 189 / 49 / 140 为准**。
  - **更正依据**：P8-A1 扫描器修复后，原「后端已实现 14」的口径被守卫的 `KNOWN_IMPLEMENTED`（49）取代；
    「188」为并集笔误（并集应为 189）。`P9-ACCEPTANCE-AUDIT`、`TASK-NOTES §21.11.1`、
    `CLEANROOM-STATUS.md` 中的 180 / 177 / 188 等旧数**均作为历史快照保留**，不再作为当前数量。
  - **边界**：本项只统一**口径**，不改变任何端点实现状态；140 条未实现端点仍全部保持 fail-closed。
- [x] T83 O4：补齐 `tools/build_static_tailwind_utilities.py` 生成器（2026-09-23，用户裁决「补 tools/ 脚本」）。
  - **背景**：`src/gods_workbench/static/css/tailwind-utilities.css` 首行注释长期指向该脚本，但 `git ls-files tools` = 0、
    `git log --all -- tools/build_static_tailwind_utilities.py` = 0 条，静态 Tailwind 预构建产物**不可复现**（治理台账 O4）。
  - **本次交付**：新增 `tools/build_static_tailwind_utilities.py`（约 340 行，中文注释），提供
    `--report`（只统计不写盘）、`--check`（只校验）、`--force`（显式授权覆盖）、`--runtime`（指定已校验运行时）。
  - **实测确认的生成配方**（决定性实验，非推测）：
    该快照由 **纯净 Tailwind Play CDN 3.4.17**（即 `https://cdn.tailwindcss.com/3.4.17`，
    SHA-256 `176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15`）产出，特征为
    `::before`/`::after`、无 `-o-tab-size`（未经 autoprefixer）、已压缩、十六进制转义保留终止空格。
    **反证（已实测排除）**：
    ① Tailwind CLI 3.4.17 直出 = `:before` + `-o-tab-size` + 未压缩，**不可复现**；
    ② 仓库自托管运行时（带 forms 0.5.10 + container-queries 0.1.1，
    SHA-256 `A789CE5A73191759006B64A0C05F63AFBF9AA43A86511BF798D688737429E60A`）会多出 forms 层规则，**不可复现**。
  - **可复现性证据**：以该快照自身的类集为输入、用上述纯净运行时渲染，输出与该快照正文
    **逐字节一致**（正文 83,237 字符，SHA-256 `8d3a7899847a3af3…`）。故生成链路已具备可复现性。
  - **fail-closed 保护**：脚本默认**拒绝**写入与现有快照不一致的结果（返回码 2），因为现有快照是已上线视觉基线，
    静默覆盖等于未经授权的视觉变更；须显式 `--force`。运行时一律强制 SHA-256 校验；纯净运行时只落系统临时目录，
    **不写入仓库**（遵守洁净室二进制禁令）。
  - **重要发现（需人工裁决，未执行）**：用当前源码重新生成会**大范围改变快照**——
    相对当前快照，规则级 diff **已由脚本内 `--diff` 固化为可复算口径**（`extract_rule_selectors()`）：
    现有快照 **1014** 个选择器 / 重新生成 **945** 个；共有 624、**移除 390 / 新增 321**（1014 = 624+390、945 = 624+321，自洽），正文逐字节一致 = False。
    复算命令：`python -P tools/build_static_tailwind_utilities.py --diff`。
    （本条目曾登记「移除 384 / 新增 311」，该数字源自未固化的临时算法，口径不同；以本条可复算数字为准。）
    即**当前快照已陈旧（stale），与源码实际类集脱节**。
    重新生成 = **可见视觉变更**，按 §5.1 须人工确认后执行，**本轮未执行**（快照保持 HEAD 原字节）。
  - **边界**：本项只补齐生成器与可复现性证据；**不**声明快照已与源码同步，**不**执行视觉变更。
- [x] T84 O5：`py-0.2` → `py-0.5` 死类修正（2026-09-23，用户裁决「修正 `py-0.2` → `py-0.5`」）。
  - **背景**：`py-0.2` 不是 Tailwind v3.4.17 的合法工具类（v3 的 spacing 刻度无 `0.2`），
    故这些类名**不产生任何 CSS**，属死类；且快照中本就**不含** `.py-0.2`，含有合法等价类 `.py-0.5`
    （`padding-top:0.125rem;padding-bottom:0.125rem`，即 2px）。
  - **执行**：11 个前端文件共 **70 处** `py-0.2` → `py-0.5`，逐文件写入并保持各文件原有行尾：
    `static/js/episode-pipeline.js`(8)、`static/v2/workshop.html`(17)、`static/v2/production.html`(9)、
    `static/v2/projects.html`(8)、`static/v2/index.html`(8)、`static/v2/js/projects-controller.js`(9)、
    `static/v2/js/home-controller.js`(3)、`static/v2/js/production-controller.js`(3)、
    `static/v2/agents.html`(2)、`static/v2/js/storyboard-controller.js`(2)、`static/v2/js/agents-controller.js`(1)。
  - **复算证据**：`src/` 全量扫描残留 `py-0.2` = **0**；`py-0.5` 共 190 处 / 15 文件（含改造前既有用法）。
    其余同批死类（`backdrop-blur-xs`、`h-4.5`、`w-4.5`）在 `src/` 中已为 **0**，无需处置。
  - **视觉影响（如实登记）**：`py-0.2` 生效前为 0 padding、生效后为 2px（0.125rem），
    属**可见但极小**的垂直内边距变化；变更范围仅限上述 11 个文件的元素。
  - **边界**：本项不含 Tailwind 快照重生成（见 T83 的陈旧性发现与人工作业边界）。

- [x] T85 前端真实浏览器 E2E（加载期）闭环（2026-09-23，推进 HANDOFF-9.md §6 / HANDOFF-10.md §4 第 7 项「前端真实浏览器 E2E 未执行」）。
  - **背景**：此前 Phase 10A-10E 全部门禁建立在 FastAPI TestClient 之上，属进程内验证；它能证明 HTML 可返回、状态码正确，
    但不能证明浏览器里没有未捕获 JS 异常、没有静态资源 4xx，也不能证明死类修正（O5）在渲染期真的生效。本项把它闭环。
  - **新增工具**：`tools/frontend_e2e_smoke.py`（中文注释；未接入 CI，因 CI 不安装 Playwright，属本地/人工门禁）。
  - **判定口径（每页独立，全 fail-closed）**：
    ① networkidle 期间零 pageerror（未捕获 JS 异常）；
    ② 同源 /static/** 零 4xx/5xx；
    ③ 每个 API 4xx 的归一化路径必须在冻结缺口基线内——脚本直接 import 守卫
    `tests/contracts/test_phase8_frontend_backend_api_gap.py` 读取 KNOWN_IMPLEMENTED / KNOWN_UNIMPLEMENTED，
    不再抄第二份清单（避免历史「三处各写一遍并漂移」教训）；
    ④ 渲染期 O5 实证：带 py-0.5 的元素 computed padding-top / padding-bottom 必须均为 2px，且页面内死类 py-0.2 元素为 0。
  - **实测结果（HEAD 41d232b，本机真实 Chromium，9 页 v2 壳层）**：jsError=0、staticFail=0、基线外 API 4xx = 0、
    py-0.5 命中数 = 生效数（21/40/28/14/26/9/5/2/2）；判定 PASS，退出码 0，e2e-report.json 中 failures = []。
    API 4xx 明细：404 全部为契约 forbidden_neighbors 明确未授权端点，401 全部为匿名访问已实现端点的预期认证行为，均非缺陷。
  - **产物落盘**：截图与 JSON 报告默认写系统临时目录，绝不写入仓库（AGENTS.md §1.2 禁止仓库内二进制资产；
    脚本对指向仓库静态目录的输出直接拒绝）。
  - **交互期补测（第二轮）**：`tools/frontend_e2e_smoke.py` 追加 7 项确定性交互（视图切换、搜索过滤与复原、
    设置视图与主题开关幂等往返、设置分区切换、导航跳转），全部断言**真实 DOM 变化**；实测 **7/7 通过**，
    pageerror = 0，基线外 API 4xx = 0。并做**变异测试**：把搜索空态断言改成必然为假（cards === 999）后
    该守卫确实 FAIL（退出码 1），证明 7/7 通过非恒真产物；变异体已删除，仓库无残留。
  - **自我纠错（如实登记）**：首轮交互断言 4/7 通过，暴露的是**断言口径错误**而非产品缺陷——
    `#topbarToggle` 不存在（真实为 `#themeToggle`，且位于默认 hidden 的设置视图，需先切视图）、
    设置分区按钮不写 `aria-pressed`（实测 null）、导航 URL 带 query。已按真实 DOM 改写全部断言并复跑。
  - **证据文档**：`docs/governance/PHASE-10-FRONTEND-E2E-EVIDENCE-2026-09-23.md`（§6 加载期 / §7 交互期）。
  - **边界（不得越读）**：加载期覆盖 v2 壳层 9 页；交互期覆盖 7 项确定性 smoke。
    **未覆盖**完整交互矩阵（表单写入、CAS 409 用户可见提示、`202 Accepted` + `poll_hint` 轮询收敛、
    403 只读降级、跨页状态保持、多窗口并发）；本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权。
    故「前端真实浏览器 E2E」状态为「加载期已闭环 + 交互期确定性 smoke 已闭环，完整交互矩阵未执行」，
    不得写为全部闭环。

- [x] T86 Tailwind 静态快照「重生成是否造成可见视觉变更」判定（2026-09-23，回应 HANDOFF-10.md §2.4 / §4 第 3 项）。
  - **触发**：§2.4 记录规则级 diff「1014 → 945，移除 390 / 新增 321，逐字节一致=False」，并据此推断
    「重新生成 = 可见视觉变更」。该推断**不成立**——规则级差异 ≠ 视觉变更。
  - **新增工具**：`tools/tailwind_snapshot_visual_equiv.py`（中文注释；未接入 CI，CI 不装 Playwright）。
    口径：内存重生成（不写盘）+ Playwright 路由注入 + 逐元素（tagName+className 配对）比对 41 个
    computed style 属性；默认排除动画属性 `transform`/`opacity`/`filter`；内置 `baseline vs baseline`
    对照组，对照组有噪声即退出码 `2`、实验结论作废（fail-closed）。退出码 0=视觉等价 / 1=可见变更 / 2=口径不可靠。
  - **实测（基线 a81a6eb，本机真实 Chrome，1600×1000，12 页）**：对照组噪声 0；实验组 computed 差异 0；
    合计 **3408 个元素 / 0 处差异**，退出码 `0` → 判定**视觉等价**。
  - **变异自证**：`--keep-animation-props` 下同一份 CSS 的对照组即出现 7 处噪声（全为 transform/opacity，
    元素均为 animate-ping / animate-pulse / 光晕 / 呼吸灯），工具返回 `2`；证明对照组守卫确实能失败。
  - **附带证伪**：源码 371 个 arbitrary 类中 251 个不在快照内，但均非缺陷——`v2/*.html` 与
    `episode-pipeline.html` 加载自托管 Tailwind 运行时（JIT）；唯二纯静态快照页 `api-settings.html` /
    `canvas-list.html` 实际未使用任何 arbitrary 工具类，浏览器侧交叉验证这两页 DOM 中会被删除的类 = 0。
  - **证据文档**：`docs/governance/TAILWIND-SNAPSHOT-VISUAL-EQUIVALENCE-2026-09-23.md`；HANDOFF-10.md §9。
  - **更正 §2.4**：删去「重新生成 = 可见视觉变更」的过度推断，改为「视觉等价，但**动作未执行**」。
  - **边界（不得越读）**：本项是**计算样式等价**，不是像素级截图比对、不是视觉回归基线；未覆盖响应式断点、
    伪元素、`:hover`/`:focus`/`:active` 交互态、Canvas/WebGL/SVG 内部渲染。**快照重生成动作本轮未执行**——
    写盘覆盖既有视觉基线属破坏性操作，按 AGENTS.md §5 须人工明确确认（待裁决：保持现状 / `--force` 重生成）。
    本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权；执行主体为主代理，≠ 外部第三方独立审计。

- [x] T87 Phase 10 完整交互矩阵补测（2026-09-23，推进 HANDOFF-10.md §4 第 7 项）。
  - **范围**：此前仅完成加载期 + 7 项交互 smoke；本轮补测 ①表单写入 ②CAS 409 ③202+poll_hint 轮询
    ④403 只读降级 ⑤401 未认证语义，共 5 项，区分「契约层真实 HTTP」与「呈现层真实浏览器」。
  - **契约层（真实 HTTP，端口 2077，全 PASS）**：
    POST projects → 201 / version 1；PATCH 正确版本 → 200 / version 2；
    陈旧 expected_version → **409 VERSION_CONFLICT** 且返回 expected_version + current_version；
    readonly 角色治理操作 → **403 FORBIDDEN**；无凭据 / 伪造 Bearer → **401 UNAUTHORIZED**；
    POST /api/canvases/cv-0001/tasks → **202** + `job_id=job-0002` + `poll_hint=/api/jobs/job-0002`（与 job_id 一致），
    轮询该 poll_hint → 200 且 job_id 稳定。
  - **呈现层（真实 Chrome）**：
    ①前端全部 /api 请求**不带 Authorization 头**（实测 0 条）——与 CLEANROOM-STATUS.md:209、HANDOFF-7.md:241、
    TASK-NOTES-2026-09-18.md:1096 既有登记**一致**，属既有缺口**复现**，不重复计为新缺陷；
    ②真实 UI 归档写入 → DELETE 401、toast「归档失败：请求失败（HTTP 401）」，根因是认证头缺失而非后端缺陷；
    ③**新发现（规范偏离）**：`degradation.js:21/45-52` 的 `statusKind()` 仅把 404/501 归 `not_integrated`、
    503 归 `service_unavailable`，**其余一律 `error`**，故 401/403/409 的用户可见提示均退化为
    「请求失败（HTTP N）」，与 `BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md` §5 要求的
    「401 提示重新登录 / 403 提示权限不足 / 409 提示刷新并重试」**不符**。
  - **新证据**：`docs/governance/PHASE-10-INTERACTION-MATRIX-EVIDENCE-2026-09-23.md`。
  - **待人工裁决（§6.3）**：`degradation.js` 是否为 401/403/409 补语义化映射——
    选项 A 维持现状并把规范提示降级为「未实现」；选项 B 补映射使实现向已冻结规范收敛（建议 B，但属共享层改动，
    影响全部消费页面，按 AGENTS.md §5 须人工确认后实施）。
  - **边界（不得越读）**：契约层全部 PASS **不等于**呈现层闭环；409 提示路径依赖 Playwright 路由拦截注入，
    真实环境下因认证头缺失会先返回 401，**未端到端触达**。未覆盖跨页状态、多窗口并发、响应式断点、交互态。
    本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权；执行主体为主代理，≠ 外部第三方独立审计。
