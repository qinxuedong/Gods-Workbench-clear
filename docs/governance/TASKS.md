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
