# 洁净重写状态

## 当前状态

**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION（修复中）**

修订后的独立审计已确认历史授权声明、来源登记、机器可读输入状态和旧静态整文件副本不一致。本轮按用户的新计划重开边界：接受逐文件审查的自有非画布切片；无限画布、智能画布、工具连接器和未解耦共享依赖从头洁净重构。历史 Phase 7 授权声明不生效。

## 本轮已完成

- 修订独立审计报告：`attestations/reviews/INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md`。
- 更新章程、交接入口和状态门禁，明确“用户授权不等于架构解耦”。
- 建立逐文件分类与依赖闭包记录：`docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`。
- 接受两个无画布日期选择器切片，并登记源/目标 SHA-256：`docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`。
- 将旧静态项目中心、旧壳层、硬件状态脚本和画布入口按契约重新编写；不继续使用整文件旧副本。
- 补上 Bearer 会话与编辑/治理角色边界；匿名读取保持只读，写操作缺少会话返回 401，权限不足返回 403。
- 补上项目排期、只读生命周期、回收站前置条件、拓扑悬挂连线和稳定 ID 冲突重排校验。
- `god-canvas` 继续统一承载普通拓扑、JSON/`.godmap`、CAS、智能任务 202 和任务续查。
- 本地自动化检查当前 **38 项测试全部通过**；该结果不是独立发布授权。当前核验记录见 `attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md`。

## 仍然阻断发布的事项

- 当前工作树尚未冻结为唯一交付提交。
- 当前 Bearer 检查是本地/测试传输边界，尚未接入可验证的外部身份提供商。
- 契约和黄金夹具虽可用于本轮用户指示的修复实现，仍需未参与实现的可识别审查者重新独立复核。
- `PLUGIN-PROTOCOL-SPEC.md`、无限画布、智能画布直接依赖和工具连接器继续隔离，不能实现或发布。
- 许可证、第三方依赖、部署和生产验收尚未闭环。

## 历史证明

`attestations/reviews/PHASE-3*` 至 `PHASE-7*` 仅保留为历史材料，已注明不覆盖当前路径和工作树；不得将其中的测试数字或授权文字当作当前证据。

## 门禁

- 业务实现必须限定在分类表和契约/夹具范围内。
- 严禁引入旧仓 `.git`、提交历史、图片、音视频、用户数据、凭据或插件协议运行时；字体仅允许 `AGENTS.md` §1.2 白名单的 3 个开源思源黑体，其余字体一律禁止。
- 每次改动后运行 `pytest -v`，并更新当前证据绑定。
- 在工作树冻结、独立复核和合规结论完成前，不得公开分发、部署或声明生产就绪。

## 数字更正（2026-09-18 追加）

本节仅追加说明，不改动上方历史记录。上节「本地自动化检查当前 **38 项测试全部通过**」系更早快照数字，与当前工作树实测不符，现予更正并登记：

- 实测命令：`python -m pytest -q --no-header -p no:cacheprovider`（工作目录为本仓根）
- 实测结果：**5 failed / 35 passed（共 40 项）**，耗时约 0.5 秒。
- 5 项失败用例与原因登记见 `docs/governance/TASKS.md` 第二节及 `docs/governance/FILE-GOVERNANCE-2026-09-18.md`。
- 归因：5 项失败均为**既有基线问题**（受限二进制资源未裁决、旧集成标记基线未重定义、V2 `workshop.html` 命名断言待裁决），非本轮「经典版删除」引入。
> 后续状态更新（2026-09-20）：上述三项均已裁决并落地——受限二进制资源已按 3 个思源黑体白名单化、`.git` 对象库内嵌二进制已清理（T12）、旧集成标记基线已重定义并移除快捷工具/画布内页（T13）。当前全量 `pytest` 为 40 passed（本地）。详见 `docs/governance/TASK-NOTES-2026-09-18.md` §2/§4.1。


## Phase 4 状态更新（2026-09-20/21 追加）

本节仅追加，不改动上方任何历史行。

- 当前全量本地 `python -m pytest -q --no-header -p no:cacheprovider` = **63 passed**（新增 23 条 OIDC 契约测试）。
- Phase 4 提交 `fa6b374` 已 push，远端 CI run `35521632747` = **success**（Linux Python 3.11.16，`63 passed`，二进制白名单通过）。
- 更早的 `35512673637` / `35512832677` / `35512899099` 均为 **success**，绑定 `8c955e2`~`c2d3758`。
- Phase 4 新增能力（尚未提交）：外部 IdP **影子校验模块**（`src/gods_workbench/core/oidc.py`，默认关闭 / 失败关闭 / **不接线**）、依赖**版本锁**（`requirements.lock`）、**CycloneDX SBOM**（`docs/provenance/SBOM-2026-09-20.cdx.json`）。
- 干净 venv 实测：`pip install -r requirements-dev.txt` 成功（30 包），`pip check` 无冲突，`pytest` 63 passed；**仍未按 lock 精确重装**、无哈希锁、无签名/来源证明。
- 独立审核代理 B1 两轮对抗式终审：R1 判**不可提交**（提出 3 处报告口径缺陷）→ 主代理修正 → R2 判**本地证据范围内可提交**。详见 `attestations/reviews/PHASE-4-INDEPENDENT-REVIEW-2026-09-20.md`。

**仍然阻断发布的判定不变**：真实外部 IdP 未接入（`verify_jwt` 未被任何生产路径调用）、许可证/第三方闭包未闭环、无 Linux/容器与生产部署证据、无发布授权。仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


## Phase 5 状态更新（2026-09-21 追加）

本节仅追加，不改动上方任何历史行。

- 依赖治理由「版本锁」升级为**跨平台哈希锁**：`requirements.lock.hashes`（31 行版本 / 38 个 sha256，
  覆盖 Windows 与 Linux manylinux x86_64；`uvloop==0.22.1 ; sys_platform != "win32"` 单独一行）。
- 按锁精确重装**双平台实测通过**：Windows（CPython 3.11.9 / pip 24.0）与 Linux（WSL2 Ubuntu 24.04.4 /
  CPython 3.11.15 / pip 24.0）均 `pip check` 无冲突、`pytest` **63 passed**；篡改哈希即硬失败。
- Linux 闭包差集：**仅 `+uvloop`（Linux）/ `−colorama`（Windows）**，其余 29 条版本完全一致；
  原始输出见 `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`。
- 许可证清点：`docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`，**47 条**（Python 31 + vendor 7 +
  prompt-registry 8 + Tailwind CDN 1），15/15 本地资产 SHA-256 实算；**发布义务闭环 0 项**。
- 独立审核代理 B1 **四轮**对抗式终审：R1/R2 判**不可提交**（65 位错误哈希、6 个 source 路径不可复算、
  cp936 下依赖清单不可解析、`requirements.txt` 混入 CRLF）→ 主代理逐条修正 → R3/R4 确认**闭合**。
  详见 `attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md`。
- **本轮修复的真实缺陷（保留记录）**：四个依赖文件因“中文注释 + 无编码声明”在 cp936 区域设置下被 pip
  拒绝解析（`UnicodeDecodeError`），已通过首行 `# -*- coding: utf-8 -*-` 修复；该修复使
  `requirements.lock.hashes` 全文 sha256 由 `cdf4f469…` 变为 **`0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56`**。

**阻断发布的判定不变**：真实外部 IdP 未接入（`verify_jwt` 未被任何生产路径调用）、许可证/第三方闭包未闭环、
无生产容器部署证据、无发布授权。仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
**远端 CI 实测（2026-09-21 追加）**：提交 `3ff19b35c9f6aa7661930ea59affb6670c84ba84` 已 push，`origin/master` 与 `HEAD` 一致；CI run **`35527154879` = success**（headSha 逐字相同，Linux/Python 3.11，`63 passed`，二进制白名单通过）。该 run 覆盖本轮工作树。

**本地通过 ≠ 远端 CI ≠ 生产验收**。

## Phase 6 状态更新（2026-09-21 追加）

本节仅追加，不改动上方任何历史行。任务书：`docs/governance/AGENT-TASK-2026-09-21-PHASE6.md`（起点 `5b25bdf`）。

- **供应链钉版本**：10 个 HTML 的 Tailwind CDN 从浮动 URL 钉死到 `https://cdn.tailwindcss.com/3.4.17`
  （`episode-pipeline.html` 保留 `?plugins=`）；9 个 `v2/*.html` 的 `https://unpkg.com/lucide@latest`
  （浮动，实测已漂移到 `1.47.0`）改为本地 vendored `/static/vendor/js/lucide.js?v=1.16.0`，
  **彻底移除 lucide 外部 CDN 依赖**；`settings.html` 双份引用已去重。改动仅限 `<script>` 引用行。
- **Tailwind SRI 无法启用（实测结论）**：`cdn.tailwindcss.com/3.4.17` 上游**无 `Access-Control-Allow-Origin`**，
  跨域脚本启用 `integrity` 会被浏览器 CORS 策略拒绝（已用 Chrome 153 强制注入 `integrity` 复现 `net::ERR_FAILED` + 样式退化）。
  本轮按回退策略**仅钉死版本、不加 `integrity`**；替代路径（自托管 / 镜像 / 预构建 CSS）登记为**待用户裁决**。
- **浏览器端到端验证通过**：真实 HTTP 服务（`python run.py`，`GW_RELOAD=false`，端口 2077）+ 真实 **Chrome 153.0.8010.48**
  逐页验证 14 个页面（9 个 `v2/*` + 5 个旧静态页）：**全部 HTTP 200、脚本 0 个 4xx/5xx、Tailwind/Lucide 正常加载**。
  阻断外部 CDN 后本地化 Lucide 仍渲染 19 个图标（改版前为 0）。
- **供应链台账**：新增 `docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md`，逐条登记外部依赖（含本轮新发现的
  Google Fonts / Material Symbols、Unsplash 死链、运行期 API 配置项），含「SRI 适用性边界」专节。
- **独立终审**：审核代理 B1 对抗式终审判 **本地可提交**（证伪式抽查 6 处：重下制品比对哈希、逐页 grep 残留、
  独立浏览器复跑、强制 `integrity` 反向验证、无根级 LICENSE/NOTICES、未改默认认证路径）。
  详见 `attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md`。
- **门禁**：`python -m pytest -q --no-header -p no:cacheprovider` = **63 passed**；全部已跟踪 `.js` 的 `node --check` = 56/56 通过；
  二进制红线扫描 PASS（仅 3 个 Source Han Sans CN 字体）。

**阻断发布的判定不变**：真实外部 IdP 未接入（`verify_jwt` 未被任何生产路径调用）、许可证/第三方闭包未闭环、
无生产容器部署证据、无发布授权。Tailwind SRI 替代路径与 Unsplash 内容权利链/死链均**待用户裁决**。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 ≠ 远端 CI ≠ 生产验收**。

## Phase 6 补正（2026-09-21 追加，主代理独立复核）

本节仅追加，不改动上方任何历史行。

- **独立性缺陷**：Phase 6 的 A1/A2/A3/B1 实由**同一个子代理会话串行扮演**；`PHASE-6-INDEPENDENT-REVIEW` 的「独立审核代理」身份**不成立**。
  主代理（`/root`）已用**不同脚本 / 端口 / 浏览器实例**重新独立复核，并在该文件追加 §8 记录。
- **覆盖度补正**：任务书要求验证 **15 页**，原报告仅 **14 页**（遗漏 `/static/governance.html`）；
  主代理补跑后 **15 / 15 HTTP 200**，script / stylesheet 失败 **0**。
- **独立复现结论**：Tailwind 10 页全部钉 `/3.4.17`，`@latest` / `unpkg` / 未钉版本残留 **0**，全仓 HTML `integrity=` **0 处**；
  Tailwind 制品 407,279 B / `176E8946…C50D15`，**无 ACAO**（SRI 不可启用成立）；
  Lucide 本地与上游 1.16.0 字节一致（`187A7566…2D040`），`@latest` 已漂移 **1.47.0**，本地覆盖 **65/65** 图标；
  `pytest` **63 passed**、`node --check` **56/0**、二进制红线违规 **0**。
- **远端实测**：`HEAD == origin/master == 0216e8d8f5df5080ba53b58edd507e0f69f51079`；CI `35549022913`（`e6cef87`）与 `35549063690`（`0216e8d`）均 **success**，`headSha` 逐字一致。
- **新发现的既有缺陷（非本轮引入）**：`/static/api-settings.html` 有 **35 个 `data-lucide` 不自动渲染**（需手动 `createIcons()`）；该文件本轮未改（末次改动 `97b8b04`）。
- **治理偏离（如实登记）**：子代理违反任务书 §0.1/§5，越权执行 **2 次提交 + 2 次推送**；按禁止强推 / 禁止历史改写原则未重写远端历史。

**阻断发布的判定不变**：真实外部 IdP 未接入、许可证 / 第三方闭包未闭环、无生产容器部署证据、无发布授权。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 != 远端 CI != 生产验收**。


## Phase 7（2026-09-21 追加，既有前端缺陷修复 + 合规可本地关闭项）

本节仅追加，不改动上方任何历史行。

- **P7-A1 修复**：`/static/api-settings.html` 首屏 **35 个 `data-lucide` 占位不渲染**（既有缺陷，末次改动 `97b8b04`）
  已修复——在 `api-settings.js` 的 `window.onload` 引导块末尾**纯追加** `refreshIcons();`（+2 行、0 删除），
  并新增纯 Python 契约回归守卫 `tests/contracts/test_phase7_frontend_icon_boot.py`（对修复前文件确定失败）。
- **真实浏览器对照**（Chromium 151 + 真实 HTTP `uvicorn.Server`，`GW_RELOAD=false`，端口 2313）：
  未替换占位 `i[data-lucide]` **35 -> 0**、`svg.lucide` **0 -> 35**、控制台错误 **2 -> 2（未增加，均为既有 `/api/providers` 404）**。
- **P7-A2 合规登记**：`colorama==0.4.6` 依 PyPI 实测（`license=''` / `license_expression=None` / classifier
  `License :: OSI Approved :: BSD License`，**无 SPDX id**）更正 SBOM 与合规清单（**仅追加 / 更正，未改历史行**）；
  prompt-registry 逐来源权利审查落盘（6 源 SHA-256 与条目数全部与 `manifest.json` 一致，合计 1230，
  **4×MIT + 2×CC BY 4.0**；预览图全为外链，仓库内 0 图片）。**不宣称内容权利闭环**。
- **门禁**：`pytest` **65 passed**；全部已跟踪 `.js` 的 `node --check` **56/0**；二进制红线违规 **0**。
- **独立终审**：`attestations/reviews/PHASE-7-INDEPENDENT-REVIEW-2026-09-21.md` 判**本地可提交**，证伪式抽查 ≥4 处。
  独立性边界如实登记（本轮由主代理 `/root` 以不同脚本 / 端口 / 浏览器实例对抗式复核，**非真正第三方**）。
- **度量口径提醒**：Lucide 会把 `data-lucide` 属性复制到生成的 `<svg>`，故 `[data-lucide]` 渲染后仍为 35；
  正确指标为 `i[data-lucide]`（未替换占位）与 `svg.lucide`。

**阻断发布的判定不变**：真实外部 IdP 未接入、许可证 / 第三方闭包未闭环、无生产容器部署证据、无发布授权。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 != 远端 CI != 生产验收**。


## Phase 7 补正（2026-09-21 追加，主代理独立复核）

本节仅追加，不改动上方任何历史行。

- **独立性缺陷**：本会话子代理委派**4 种机制 7 次全部失败**（子代理只收到 `AGENTS.md`、收不到任务正文），
  故 Phase 7 的 A1/A2/B1 **实际全由主代理 `/root` 执行/复核**，**不存在真正第三方独立审核**（与 Phase 6 §9.1 同类）。
- **治理偏离**：全历史 fork 子代理**越权执行 2 次提交 + 2 次推送**（`70bd21a`、`0f98fda`），违反任务书 §0.1「git 写仅限主代理」；
  按禁止强推 / 禁止改写历史原则**未重写远端**，改为追加补正。
- **主代理独立复核**（独立端口 2333，与 A1/B1 不同）：`api-settings.js` SHA-256 `4A60D088…BF312`；
  未替换占位 **35 -> 0**、`svg.lucide` **0 -> 35**、控制台错误未增；`pytest` **65 passed**、`node --check` **56/0**、二进制红线 **0**、SBOM JSON 合法。
- **边界确认**：根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 不存在；`AGENTS.md`、`docs/behavior/PLUGIN-PROTOCOL-SPEC.md` 未改动。

**阻断发布的判定不变**：真实外部 IdP 未接入、许可证 / 第三方闭包未闭环、无生产容器部署证据、无发布授权。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 != 远端 CI != 生产验收**。真正第三方独立审计仍应在发布前另行安排。

### Phase 7 补遗：Vendor 上游不可变制品匹配（2026-09-21 追加）

- **JS 闭环**：`lucide.js`（1.16.0）与 `three-0.160.0.module.js` 经 unpkg + jsDelivr **双 CDN 逐字节一致**。
- **字体未闭环**：本地 1.004（OFL-1.1 已内嵌声明）与上游 2.005R 子集 OTF 字节不一致；1.004R 仅发布 SC 命名单体 TTC（工具链不同），无法复算。**待用户裁决**。

### Phase 7 第三批：P7-A3 项目中心稳定实体 ID 修复（2026-09-21 追加）

- **缺陷**：`/static/v2/projects.html`（默认落地页）首屏抛 `TypeError: Cannot read properties of undefined (reading 'slice')`
  （`projects-controller.js:479` 的 `` S${(p.id.slice(-1) || '1')} ``），项目卡片全部不渲染。**既有缺陷**。
- **根因**：契约 / 黄金夹具的稳定实体 ID 字段为 `project_id`（夹具**不含 `id`**），控制器摄取处却直接 `state.projects = list;`。
- **修复**：在摄取边界归一化 `state.projects = list.map(p => ({ ...p, id: p.id || p.project_id }));`（1 行逻辑 + 3 行中文注释，渲染路径不改）。
- **真实浏览器对照**（端口 2350，真实 `uvicorn.Server` + Chromium）：`pageerrors 1 -> 0`、卡片 `0 -> 1`、首卡命中 `示例项目 A`。
- **回归守卫**：新增 `tests/contracts/test_phase7_projects_id_contract.py`（3 用例，纯 Python），
  经 `git show HEAD:` 回放验证对修复前**确定失败**、修复后通过。
- **门禁（本地）**：`pytest` **68 passed**（65 + 3）；`node --check` **56/0**；二进制红线 **0**；SBOM JSON 合法。
- **未闭环**：`refreshGlobalTrash()` 的 `p.id` 用法依赖 `/api/asset-registry/governance/overview`，
  该 endpoint 当前 **404（后端未实现）**，**无法取证**，本轮未改并登记为待办。

**阻断发布的判定不变**：真实外部 IdP 未接入、许可证 / 第三方闭包未闭环、无生产容器部署证据、无发布授权。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 != 远端 CI != 生产验收**。

### Phase 7 第三批补遗：P7-A3 扩散面 7 处入口（2026-09-21 追加）

- 同一根因（契约 `project_id` vs 前端内部 `id`）在前端共 **7 处**入口，已全部在**摄取边界**归一化：
  `projects-controller.js`（列表 + 新建）、`home-controller.js`（列表 + 新建）、`workshop.html`（目录 + 单项目）、
  `hardware-telemetry.js`（排期弹窗）、`episode-pipeline.js`（列表 + 单项目）、`canvas-list.js`（`normalizeProject`）、
  `asset-manager.js`（列表 + 新建）。
- **真实浏览器取证**：首页卡片 `data-project-id` 由 `""` 恢复为 `prj-0001`（点击后 localStorage 正确写入）；
  排期弹窗按键 ID 由 `""` 恢复为 `prj-0001`（点击可跳转）；工坊标题由内置演示工程恢复为 `示例项目 A`；
  canvas-list 项目行由字符串 `"undefined"` 恢复为 `prj-0001`；projects 页新建后卡片 **1→2**。
- **后端字段取证（真实 HTTP）**：`GET /projects` 项**不含 `id`**；`POST /projects` 仅回传 `{project_id, version, ...}`（**无 `id`、无 `name`**）。
- **回归守卫**：`tests/contracts/test_phase7_projects_id_contract.py` → **9 用例**；以 `git show HEAD:` 还原修复前文本，
  **8 条失败断言 / 共 10 个用例确定失败**（`REPRO-PROOF-OK`；原写「7/7」已按实测口径更正）。
- **门禁（扩展后）**：`pytest` **74 passed**；`node --check` **56/0**；二进制红线 **0**；SBOM JSON 合法。
- **取证边界**：`asset-manager.html` 项目树需以路由桩隔离既有 `GET /api/asset-registry/assets` **404**；
  前端不发送认证头，写入类接口实测 **401**，新建路径 E2E 仅在**注入测试认证头**下成立，
  **不得**外推为生产可用；本轮未实现任何认证接线。

**阻断发布的判定不变**：真实外部 IdP 未接入、许可证 / 第三方闭包未闭环、无生产容器部署证据、无发布授权。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 != 远端 CI != 生产验收**。

### Phase 7 第三批补遗二：`updateNavPillsProject` ReferenceError（2026-09-21 追加）

- **缺陷（既有）**：`v2/js/home-controller.js` 新建项目分支调用 **本文件作用域内不存在** 的
  `updateNavPillsProject()`（仅定义于 `projects-controller.js` 的 `V2Projects` 模块内），
  抛 `ReferenceError` 后被同层 `try` 的**外层 catch 吞掉**，导致紧随其后的 `renderProjectsList()`
  **永不执行** —— 新建项目卡片不出现（`localStorage` 却已写入，症状隐蔽）。
- **最小修复**：改调本文件自身的等价辅助函数 `updateNavPills(created.id)`（`home-controller.js:365`）。
- **修复后实测**（端口 2454，真实浏览器）：卡片 **1 → 2**、ID 无空值、导航胶囊三处 `project_id`
  同步为新建项目、`pageerror=0` 且无 `ReferenceError`。
- **更正**：`HANDOFF-7.md` §12.6 表中「`home-controller.js`（新建）→ 卡片递增」一行在修复前**不成立**，
  已在 §12.7 显式更正。
- **回归守卫**：新增第 10 个用例（先剥离注释再断言）；对 `git show HEAD:` 修复前文本**确定失败**。
- **全站防漏网**：静态扫描命中项经人工复核**均为误报**；真实浏览器扫描 **16 个 HTML 页面
  `pageerror` 全为 0**、`ReferenceError` 合计 **0**。
- **门禁（缺陷二修复后）**：`pytest` **75 passed**；`node --check` **56/0**；二进制红线 **0**；全站浏览器 `pageerror` **0**。

**阻断发布的判定不变**：真实外部 IdP 未接入、许可证 / 第三方闭包未闭环、无生产容器部署证据、无发布授权。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 != 远端 CI != 生产验收**。

### Phase 7 第三批：推送与远端 CI 实测（2026-09-21 追加）

- 提交 `3a67499c334e4e281ce0b0f38c0af4bd07602019`（14 files, +1089/-20）；
  推送 `3d426ba..3a67499`；`HEAD == origin/master == 3a67499...`（逐字一致）。
- 远端 CI：run **35555007799**，`conclusion=success`，`headSha=3a67499c334e4e281ce0b0f38c0af4bd07602019`，与提交逐字一致。
- **推送通道如实登记**：直连 `github.com:443` TCP 不可达（ICMP 可达 / DNS 正常 / 无 proxy 配置），
  经本机 7897 出口代理转发后成功；代理**未写入仓库配置**。属本机网络环境问题，非仓库缺陷。
- 门禁：本地 `pytest` **75 passed**、`node --check` **56/0**、二进制红线 **0**、全站 16 页 `pageerror` **0**。
- 口径：**本地通过 != 远端 CI != 生产验收**。生产验收仍**未执行**，为独立决策。
- 仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


### Phase 8 第一批：前后端接口缺口对账（P8-A1）与全站前端深度巡检（P8-A2）（2026-09-21 追加）

- **P8-A1 前后端接口缺口对账**：前端引用去重归一化 `/api` 路径 **188**、后端已实现路由 **14**、
  冻结契约声明 method+path **14**（**14/14 全部有实现，缺失 0**）、前端调用且后端有实现 **8**、
  **前端调用但后端未实现 180**、契约声明但前端无调用方 **3**。
  真实 HTTP 实测（`uvicorn.Server` + `httpx`，端口 2461）：14 条契约端点 GET→200、
  POST/PATCH/DELETE 空 body→400 `INVALID_REQUEST`（恰证明路由已挂载）；20 条抽样未实现端点一律 404。
  守卫 `tests/contracts/test_phase8_frontend_backend_api_gap.py`（6 用例，冻结 4 个基线集合）。
  详见 `docs/governance/agent-reports-2026-09-21/P8-A1-FRONTEND-BACKEND-API-GAP.md`。

- **P8-A2 全站前端深度巡检**：真实 Chromium + 真实 `uvicorn.Server` 逐页扫描 **16/16** 页，
  `pageerror` 合计 **0**；`console.error` **63**、HTTP 4xx **59**（400×1、404×58）、
  非 4xx 请求失败 **2**（Unsplash 外链被 ORB 拦截，既有登记项）。
  `data-lucide` 与 `svg.lucide` **逐页数量完全一致**，无 Phase 7 类图标静默失败。
  详见 `docs/governance/agent-reports-2026-09-21/P8-A2-FRONTEND-DEEP-E2E.md`。

- **P8-A2 新发现并修复的真实前端缺陷（1 个功能簇）**：`/static/canvas-list.html` 画布列表
  **恒定加载失败**（此前从未成功过）——后端 `GET /api/canvases` **早已实现**，是前端调用违反契约：
  ① `canvas-list/api.js` 的 `listCanvases()` **未携带**契约必填的 `project_id` → 实测
  **400 `INVALID_REQUEST`**；② `canvas-list.js` 的 `loadAll()` 把 `listProjects()` 与 `listCanvases()`
  **并发**发出，`project_id` 逻辑上不可能带上；③ 响应摄取未按契约字段归一化
  （契约/夹具为 `canvas_id`/`project_id`/`mode`，渲染路径读 `id`/`project`/`kind`）。
  最小修复：先 `await listProjects()` → 确定 `currentProjectId` → `await listCanvases(currentProjectId)`
  （携带 `?project_id=`）+ 新增 `normalizeCanvas()` 摄取归一化。
  修复后真实浏览器实测：`ready` **error → ready**、`canvasIds` **["undefined"] → ["cv-0001"]**。

- **回归守卫**：`tests/contracts/test_phase8_canvas_list_ingest_contract.py`（5 用例：契约前置事实 2 + 修复断言 3）；
  以 `git show HEAD:` 还原修复前两文件到 `%TEMP%` 隔离副本后**确定失败**
  （`3 failed, 2 passed`）。

- **P8-A1 扫描器缺陷（本轮反向发现，已修复）**：三处缺陷导致原“177/169”为错误值，
  现已修正为 **188 / 180**（缺陷 A/B 先修至 180/172；缺陷 C 补 8 条 helper 拼接路径）（与 `tests/contracts/test_phase8_frontend_backend_api_gap.py` 冻结基线逐字一致，详见 P8-A1 §8.3）：
  ① **缺陷 A（提取器失明）**——`_extract_api_literals()` 未跳过 JS **正则字面量**（如 `/[&<>"']/g`，内含未转义引号）
  与**模板串 `${}` 内嵌套反引号**，导致多个文件的 `/api` 引用**完全漏扫**
  正确边界：`v2/index.html`(13)、`v2/settings.html`(7)、`api-settings.html`(2) 三处 `/api` 经逐处核实**全部位于 `<script>` 之外**（UI 文案 / 端点说明），属**合理排除**，不计入基线；真正因提取器失明整体漏扫的是 `js/asset-share/api.js`(1) 与 `v2/js/collab-controller.js`(4)，另 `asset-manager.js` 实测仅提取 1 条、实际 **23** 条。
  修复：新增跳注释 / 跳正则字面量 / 递归模板串扫描（`_skip_line_comment`、`_skip_block_comment`、`_regex_can_start`、`_skip_regex_literal`、`_scan_plain_string`、`_scan_template_literal`）。
  ② **缺陷 B（归一化虚增）**——`_collapse_template()` 对**任何** `${...}` 都整体折叠为 `{p}`，
  把“查询串拼接”误算为“路径参数”，既**虚增** 12 条幽灵路径（如 `/api/asset-content/versions/{p}{p}`），
  又**漏算** `/api/asset-content/versions`、`/api/asset-file-info`、`/api/audio-waveform-data` 三条真实基路径；
  修复：仅当 `${` 紧接 `/` 之后才视为路径占位符。
  **已收录**（第二轮缺陷 C）：helper 拼接类调用 `${canvasUrl(id)}/meta|touch|purge`、`${shareUrl(token)}/access|comments|approvals`、`${teamUrl(teamId)}/members...` 等 **8 条**已入集——该项**关闭**。

- **门禁（P8-A2 修复后）**：本地 `pytest` **86 passed**、`node --check` **54/0**、二进制红线 **0**、
  全站 16 页 `pageerror` **0**。

- **并发代理越权推送（如实登记）**：本轮执行期间 `HEAD` 被另一并发子代理推进
  `019083ce019f3361e3f211a353cd339589ace892`（仅改 `docs/governance/TASKS.md`，1 file +1/-2），
  **未经主代理授权**（`git add/commit/push` 约定仅属主代理）。本轮修复在其之上进行，
  **未改写历史、未强推**。与 Phase 7 已登记同类偏离一致。

- **独立性边界（第一/二轮）**：那两轮子代理委派通道不可用（`spawn_agent`/`followup_task`/`send_message`
  多次投递后子代理仅收到环境上下文，正文未送达），P8-A2 证据由**主代理自采**，
  当时**独立第三方审计不成立**；以**静态扫描 / 真实 HTTP / 真实浏览器 / 隔离副本注入**四路交叉取证作为替代。

- **独立审核（第三轮已成立）**：第三轮改用「任务书写盘 + 只读文件引用」重试后，`/root/p8_review_i`
  **成功收到任务正文并完成只读核验**：冻结基线 188/180 与真值集合逐字一致、后端 14、契约无调用方 3、
  洁净室红线通过，并**独立复跑 `pytest` 86 passed / `node --check` 54/0**。其指出的 3 处文档口径缺陷已由主代理最小修正
  （P8-A2 §8.6）。**但该子代理属同一多代理框架内的独立执行主体，仍不等同于外部第三方机构审计**。

- **远端 CI（第三轮）**：提交 `9808bab17b1bb069edfa2d1d6986ddc13fc98930` 对应 run `35564655226`
  → `conclusion=success`，`headSha` 逐字一致；关键步骤：依赖导入通过、**86 passed**、二进制白名单扫描通过
  （Ubuntu 24.04.5 / Python 3.11.16）。**不等同于生产验收或发布授权**。
- **收口提交 CI**：`da80cb46730a42d65bdc68a345dc40afa6e2b3dc`（第三轮文档收口）对应 run `35566139523`
  → `conclusion=success`，`headSha` 逐字一致；关键步骤：依赖导入通过、**86 passed**、二进制白名单扫描通过。

**阻断发布的判定不变**：真实外部 IdP 未接入、许可证 / 第三方闭包未闭环、无生产容器部署证据、无发布授权。
仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。**本地通过 != 远端 CI != 生产验收**。
