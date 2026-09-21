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
