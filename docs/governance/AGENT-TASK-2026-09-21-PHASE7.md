# Phase 7 任务书（2026-09-21 第六轮：既有前端缺陷修复 + 可本地关闭的合规项）

> 基线：`b4c7153`（Phase 6 补正后）；`HEAD == origin/master == b4c715383972f85ed6b3e4bd6c9479d1a19850a2`；
> `git status --porcelain -uall` 为空；远端 CI run `35549648145` = success。
> 依据：根 `AGENTS.md`、`CLEANROOM-CHARTER.md`、`HANDOFF-5.md` §5、`HANDOFF-6.md` §9/§10、`CLEANROOM-STATUS.md`。
> 本任务书为 Phase 7 唯一施工依据；与 `AGENTS.md` 冲突时以 `AGENTS.md` 为准。

## 0. 本轮总原则（硬规则）

0.1 `git add` / `git commit` / `git push` **仅限主代理（`/root`）执行**；子代理**禁止**执行任何 `git` 写操作
    （禁止 `git add` / `git commit` / `git push` / `git checkout` / `git reset` / `git stash` / 分支或历史改写）。
    子代理只写工作区文件，并在报告中列出「待主代理提交的文件清单」。

0.2 以下为全局红线（与 `AGENTS.md` §1 一致）：

1. 禁止直接复制旧仓 `D:\Working\Code Pro\Gods-Workbench-release` 的源码实现、资源或提交历史。
2. 禁止新增图片 / 音视频 / 压缩包 / 可执行文件；字体仅允许 `AGENTS.md` §1.2 三条思源黑体白名单路径。
3. 禁止把任何真实密钥 / token / 凭据写入仓库、报告或日志。
4. 禁止实现或引入 `docs/behavior/PLUGIN-PROTOCOL-SPEC.md` 的任何运行时依赖。
5. 不得把未执行的写作「已执行」；不得伪造 `pytest` / 浏览器 / CI 结论。
6. 临时文件只写 `%TEMP%\gw-p7-<角色>-20260921\`，不得在仓库内留下临时文件或 `.pyc`。
7. 不得创建根级 `LICENSE` 或 `THIRD_PARTY_NOTICES.md`（需用户明确授权）。

## 1. 本轮目标（选择理由）

Phase 5 / Phase 6 已收口。`HANDOFF-5.md` §5 的 8 条未闭环项中，多数为**用户/法务裁决项**
（根级 LICENSE、真实外部 IdP 接线、发布授权、prompt-registry 内容权利终裁、Tailwind SRI 替代方案）。
本轮只做**可本地关闭、且不越权**的两件事，外加一次**真正独立**的终审：

- **P7-A1（真实缺陷修复）**：`/static/api-settings.html` 首屏 **35 个 `data-lucide` 占位不渲染**（0 个 svg）。
  这是 Phase 6 补正独立复核时**实测发现、但未修复**的既有缺陷，属可本地关闭的真实 UX 缺陷。
- **P7-A2（合规可本地关闭项）**：`HANDOFF-5.md` §5 第 2 条（`colorama==0.4.6` 的 SPDX 许可证）
  与第 4 条（prompt-registry 逐来源权利审查）的**证据化落地**——只写文档与 SBOM 更正，不改提示词内容。
- **P7-B1（独立终审）**：由**独立代理会话**（非实现方）对抗式复核，覆盖 A1/A2 全部产出。

**不在本轮范围**（保持待用户裁决，不得代为决策）：根级 LICENSE / NOTICES、真实外部 IdP 接线、
发布授权、Tailwind SRI 替代路径选型、Unsplash 内容权利链、提示词正文删改。

## 2. 已核实的事实基线（主代理实测，2026-09-21）

| 事实 | 命令 / 证据 | 结论 |
|---|---|---|
| 仓库同步 | `git rev-parse HEAD` == `git rev-parse origin/master` == `b4c7153...`；`git rev-list --left-right --count origin/master...HEAD` | `0/0` |
| 本地测试 | `python -m pytest -q --no-header -p no:cacheprovider` | **63 passed** |
| JS 语法 | 全部已跟踪 `.js` 的 `node --check` | **56 / 0** |
| 远端 CI | `35549648145`（`b4c7153`） | **success**，`headSha` 逐字一致 |
| 图标缺陷（实测） | Playwright Chromium 151 + 真实 uvicorn，`/static/api-settings.html` `networkidle`+2.5s | `data-lucide` 残留 **35**，`svg.lucide` **0**；手动 `window.lucide.createIcons()` 后 **35 svg / 0 残留** |
| 全站图标对照（实测） | 16 个 HTML 逐页 `data-lucide` 与 `svg.lucide` 计数 | **仅 `api-settings.html` 残留 >0**；其余 15 页 `data-lucide == svg.lucide`（渲染成功） |
| 静态资源缺失（实测） | 16 页全部失败请求逐条分类 | **静态资源缺失 0**；失败请求全部为未实现 `/api/*`（404）与 Unsplash 死链 |
| 缺陷归属 | `git log -1 --format=%h -- src/gods_workbench/static/api-settings.html` | `97b8b04`（**非本轮引入**） |
| 根因定位（代码） | `api-settings.js:271` 定义 `refreshIcons()`；`2079` 的 `window.onload` 未在首屏渲染后调用 `refreshIcons()` | 首屏无图标；`refreshIcons()` 仅在后续交互路径触发 |
| `colorama` SPDX | `https://pypi.org/pypi/colorama/0.4.6/json` → `license` 空、`license_expression` 无、classifier `License :: OSI Approved :: BSD License` | 上游元数据未给 SPDX id；classifier 指向 BSD（BSD-3-Clause 为其实际许可证） |
| 工作页图标约定 | `canvas-list.js:2130`、`asset-manager.js` 等在 boot 末尾调用 `refreshIcons()` | 「boot 末尾调用」为仓库既有模式 |

## 3. 任务分解

| 编号 | 角色 | 负责人 | 交付物 |
|---|---|---|---|
| P7-A1 | 前端缺陷修复工程师 | 子代理 `p7_a1_icon_fix` | `src/gods_workbench/static/js/api-settings.js`（必要时含其 HTML）修改 + 本地真实浏览器证据 + 报告 |
| P7-A2 | 合规与 SBOM 工程师 | 子代理 `p7_a2_license` | SBOM / 合规清单追加更正 + prompt-registry 权利审查文档 + 报告 |
| P7-B1 | 独立终审代理 | 子代理 `p7_b1_review`（独立会话） | `attestations/reviews/PHASE-7-INDEPENDENT-REVIEW-2026-09-21.md` |

主代理负责：本任务书、`HANDOFF-7.md`、门禁复跑、`git add/commit/push`、远端 CI 回读、`CLEANROOM-STATUS.md` / `docs/governance/TASKS.md` / `TASK-NOTES` 收口。

## 4. P7-A1 硬要求（图标缺陷修复）

1. **根因必须先用证据说明**：给出「首屏渲染路径」与「缺失的 `createIcons()` 调用点」的代码行号引用。
2. **最小改动**：优先保持仓库既有模式（boot 末尾调用 `refreshIcons()`）。**不得删除任何 HTML class**，
   不得改动数据/API 逻辑，不得重写 `refreshIcons()` 语义。
3. **必须真实浏览器验证**（真实 HTTP 服务 `python run.py` 或等价 uvicorn，`GW_RELOAD=false`；真实 Chromium）：
   - 修复前：`data-lucide` 残留 == 35、`svg.lucide` == 0（复现缺陷）；
   - 修复后：`data-lucide` 残留 == 0、`svg.lucide` == 预期的 35；
   - 控制台错误数**不得增加**；截图写到 `%TEMP%\gw-p7-a1-20260921\`（**不得入库**）。
4. **回归守卫**：新增一个**纯 Python 契约测试**（放入 `tests/`，不依赖浏览器），断言
   `api-settings.js` 在首屏路径上确实调用了 `createIcons()`（例如 boot 段落在 `window.onload` 之后调用
   `refreshIcons()`）。测试必须能**复现性失败**（即对修复前的文件断言失败）——在报告中说明你的验证方式。
5. `node --check` 对改动后的 JS 必须通过；不得引入新的外部依赖或 CDN。

## 5. P7-A2 硬要求（合规可本地关闭项）

1. **`colorama==0.4.6` SPDX 落地**：以 `https://pypi.org/pypi/colorama/0.4.6/json` 的真实响应为依据，
   在 `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md` **追加**一节（只追加，不改历史行），
   如实说明：上游元数据无 SPDX `license` / `license_expression`，仅有 classifier `License :: OSI Approved :: BSD License`，
   并给出你据此采取的表述（不得声称上游提供了 SPDX id 或 SPDX 文件）。
   - 同步更正 `docs/provenance/SBOM-2026-09-20.cdx.json` 中该组件的许可证字段（如适用），**保持 JSON 合法**，
     并在报告中给出更正前后的字段值。
2. **prompt-registry 逐来源权利审查**：新增 `docs/provenance/PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md`，
   覆盖 `src/gods_workbench/static/prompt-registry/NOTICE.md` 中列出的 **6 个来源**，每个来源给出
   条目数、许可、维护者/主页、`sourceUrl` 是否随快照保留、预览图是否为外链（非本仓复制）、
   以及「上游声明不重新授予内容权利」的边界。**不得删改任何提示词 JSON 内容**，不得复制任何图片。
3. 结论必须如实：本轮**只完成证据化登记**，不宣称 prompt-registry 内容权利已闭环；公开发布仍待用户/法务终裁。
4. 不得创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。

## 6. P7-B1 硬要求（独立终审）

触发条件：A1–A2 全部产出后。**不得采信任何被审代理自述。**
必须覆盖（≥3 处证伪式抽查）：

1. 独立复跑 `python -m pytest -q --no-header -p no:cacheprovider`，记录通过数；
2. 独立运行 `node --check` 覆盖全部已跟踪 `.js`，记录失败数；
3. 独立真实浏览器复跑 `/static/api-settings.html`，核对 `data-lucide` 残留与 `svg.lucide` 计数，
   并**自行重跑修复前对照**（`git stash`/副本方式，不得改写历史）以证明修复真实生效；
4. 二进制红线扫描（全仓，白名单仅 3 个思源黑体）；
5. 核对 `colorama` 结论是否与 PyPI 真实响应一致；核对 SBOM 是否仍为合法 JSON；
6. 核对**未创建**根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`；核对**未修改** `AGENTS.md` 排除项。
7. 判「本地可提交 / 不可提交」，并附独立复现命令与原始输出片段。

## 7. 验收与边界

- 本地门禁：`python -m pytest -q --no-header -p no:cacheprovider` 全绿；`node --check` 全绿；二进制红线 0 违规。
- 远端 CI：主代理推送后读回 `gh run view <id> --json conclusion,headSha`，`headSha` 必须逐字匹配。
- **仓库仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；本地通过 != 远端 CI != 生产验收。
