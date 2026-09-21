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
