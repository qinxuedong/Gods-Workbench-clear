# Phase 6 任务书（2026-09-21 第五轮：供应链钉版本与独立端到端验收）

> 共享工作目录：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`
> 本轮基线：`master` 单根，`HEAD == origin/master == 5b25bdfac3d0e3adfdce1b703c4f24cb4c5f6d4a`，
> 工作树干净（`git status --porcelain -uall` 为空），远端 CI run `35527236054` = success。
> 依据：根 `AGENTS.md`、`CLEANROOM-CHARTER.md`、`HANDOFF-5.md` §5、`CLEANROOM-STATUS.md`、
> `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`。

## 0. 本轮总原则（用户 2026-09-21 授权）

0. 本节任务由**主代理统一收口**：`git add` / `git commit` / `git push` 只允许主代理执行；
   子代理**禁止**执行任何 `git` 写操作。
0.1 硬规则（违反即作废，与 Phase 5 §0.1 完全一致）：
1. 禁止直接读取旧仓 `D:\Working\Code Pro\Gods-Workbench-release` 的源码或提交历史。
2. 禁止新增图片 / 音视频 / 字体（`AGENTS.md` §1.2 三条思源黑体白名单除外）。
3. 禁止把任何真实密钥 / token / 凭据写入仓库、报告或日志。
4. 禁止修改 `AGENTS.md` 中明确排除的 `docs/behavior/PLUGIN-PROTOCOL-SPEC.md`。
5. 不得把未执行写成已通过；不得伪造命令输出。
6. 临时草稿写 `%TEMP%\gw-<任务>-20260921\`，不得在仓库内留下临时文件或 `.pyc`。

## 1. 本轮目标

把 `HANDOFF-5.md` §5 中 8 条未闭环项里，**可在本地/受控环境闭环**的两条推进到底：

- **未闭环项 3（部分）**：Tailwind CDN **供应链风险** —— 由「URL 未钉死不可变版本、无 SRI」
  推进为**钉死不可变版本 + SRI 完整性校验 + 供应链台账**。
- **未闭环项 3（部分）**：前端依赖的**浏览器端实际可用性**从未验证过 ——
  由「无浏览器证据」推进为**本地端到端浏览器验证证据**（真实 HTTP 服务 + 真实浏览器内核）。

**不包含**（本轮明确不触碰，仍在 `HANDOFF-5.md` §5 待用户/法务裁决）：
真实外部 IdP 接线、`colorama` SPDX 结论、`prompt-registry` 内容权利链、
根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`、生产容器部署、SBOM 签名 / 来源证明、macOS / aarch64。

## 2. 已核实的事实基线（主代理实测，2026-09-21）

| 事实 | 命令 / 证据 | 结论 |
|---|---|---|
| 本地 Python / WSL | `python --version` / `wsl -e bash -lc "python3.11 -V"` | 3.11.9 / 3.11.15 |
| 本地测试 | `python -m pytest -q --no-header -p no:cacheprovider` | **63 passed** |
| 前端 JS 总数 | `Get-ChildItem src -Recurse -Filter *.js` | 56 个 |
| Tailwind CDN 引用 | 10 个 HTML（9 个 `v2/*.html` + `episode-pipeline.html`） | `https://cdn.tailwindcss.com`（**未钉版本**） |
| Lucide CDN 引用 | 9 个 `v2/*.html` | `https://unpkg.com/lucide@latest`（**浮动版本**） |
| 本地已 vendored 的 Tailwind | `src/gods_workbench/static/css/tailwind-utilities.css` 首行 | `tailwindcss v3.4.17 \| MIT`，但**只被 3 个旧页面引用**，未覆盖 `v2/*` 的 arbitrary-value 类 |
| 本地已 vendored 的 Lucide | `src/gods_workbench/static/vendor/js/lucide.js` | v1.16.0 ISC，SHA-256 `187a7566...2d040`，**与 `unpkg lucide@1.16.0/dist/umd/lucide.min.js` 字节一致**（已实测） |
| `v2/*.html` 用到的 66 个 Lucide 图标名 | 全部存在于 vendored 1.16.0 | **可零风险切本地** |
| `cdn.tailwindcss.com/3.4.17` 制品 | 实测下载 | 407,279 字节，SHA-256 `176e894661aa9cdc9a5cba6c720044cbbf7b8bd80d1c9a142a7c24b1b6c50d15`（与 `vendor/MANIFEST.md` 记载一致） |
| `cdn.tailwindcss.com`（无版本）与 `/3.4.17` | 实测两者字节与哈希**完全相同** | 当前浮动 URL 恰好解析到 3.4.17，但**无版本承诺** |
| Tailwind CDN 响应头 | `curl -D - -H "Origin: http://127.0.0.1:2077"` | **无 `Access-Control-Allow-Origin`** |
| unpkg 响应头 | 同上 | `Access-Control-Allow-Origin: *`，`Content-Length: 401894` |
| 本机浏览器自动化 | `python -c "import playwright"` | playwright 可用（需实测内核是否就绪） |
| 本机 Node | `node --version` / `npm --version` | v24.20.0 / 11.19.0 |
| Docker | `docker info` | **守护进程未运行**（不可用于本轮容器验收） |
| `tools/` 目录 | `Test-Path .\tools` | **不存在**（`tailwind-utilities.css` 首行提到的构建脚本缺失） |

## 3. 任务分解

| 任务 | 负责人 | 产物 | 验收 |
|---|---|---|---|
| P6-A1 CDN 供应链钉版本与 SRI | 供应链安全工程师 | 10 个 HTML 的 CDN 引用改写 + 台账 | 钉死版本 + SRI + 无 `@latest` |
| P6-A2 浏览器端到端验证 | 前端验证工程师 | `docs/governance/agent-reports-2026-09-21/` 报告 | 真实浏览器加载全部 v2 页面无致命错误 |
| P6-A3 供应链与完整性台账 | 供应链安全工程师 | `docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md` | 每个外部 URL 有版本、哈希、SRI、许可证、失败模式 |
| P6-B1 独立对抗式终审 | 独立审核代理（未参与实现） | `attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md` | 判「可提交 / 不可提交」，证伪式抽查 ≥3 处 |

### P6-A1 硬要求

1. **Tailwind**：把所有 `https://cdn.tailwindcss.com`（含 `?plugins=forms,container-queries` 形式）
   改为**不可变 pinned 版本 URL** `https://cdn.tailwindcss.com/3.4.17`（保留 `?plugins=` 查询串，置于版本之后：
   `https://cdn.tailwindcss.com/3.4.17?plugins=forms,container-queries`），并加 **`integrity`** 属性。
   - 必须**先实测**哪个 `sha384`/`sha256` 值与该 URL 的真实字节匹配；不得照抄第三方博客。
   - 必须实测：加了 `integrity` 后浏览器**真的加载成功**（否则回退策略见 §4）。
2. **Lucide**：把所有 `https://unpkg.com/lucide@latest` 改为**本地已 vendored 制品**
   `/static/vendor/js/lucide.js?v=1.16.0`（字节已被主代理验证与上游 1.16.0 一致），
   从而在本轮**彻底移除 lucide 的外部 CDN 依赖**。
   - 注意 `v2/settings.html` 同时引用了 unpkg 与本地两份，**必须去重**，只保留一份（放 `<head>` 或统一位置，
     并保证 `window.lucide.createIcons()` 调用时机仍有效）。
   - `v2/workshop.html`、`index.html` 等用 `window.lucide?.createIcons()`，需在改动后实测不抛错。
3. **禁止**在本轮把 Tailwind 改成自托管 vendored 文件（会产生新的大体积生成物与 `tools/` 脚本缺失问题），
   也**禁止**修改 `src/gods_workbench/static/css/tailwind-utilities.css`。
4. 改动必须保持「黑金拟物科技硬件设计系统」视觉不变：**不得删除任何 class**，只改 `<script>` 引用。
5. 若 `integrity` 在实测中导致任一页面渲染失败，**不得**为过测试而删掉 `integrity`；
   必须如实登记失败并给出可选方案，交用户裁决。

### P6-A2 硬要求

1. 用**真实 HTTP 服务**（`python run.py`，`GW_RELOAD=false`，端口 2077）而非 `TestClient`。
2. 用**真实浏览器内核**（Playwright chromium / 已装 Edge / Chrome 任选其一，须在报告中写明实际用了哪个及版本）
   打开并验证：`/static/v2/` 下全部 9 个页面 + `/static/api-settings.html` + `/static/canvas-list.html` +
   `/static/task-center.html` + `/static/asset-manager.html` + `/static/asset-share.html`。
3. 每个页面必须记录：HTTP 200、**控制台错误**、**失败的网络请求**（含 4xx/5xx 与 `net::ERR_*`）、
   以及 `<script>` 是否加载成功。**网络失败必须逐条列出 URL**，不得只写「无错误」。
4. 必须截图留证（PNG 写到 `%TEMP%\gw-p6-a2-20260921\`，**不得入库**，只在报告中记录路径与尺寸）。
5. 必须区分三类结论：**HTTP 服务可用** / **CDN 制品可用** / **本地 vendored 制品可用**。
   特别要记录：改版前若某页面因 CDN 不可达而失败，改版后是否恢复（这是本任务的真实价值）。
6. 若 Playwright 内核不可用，**如实登记**，改用其它已安装浏览器（Edge/Chrome via CDP）或
   明确标注「浏览器验证未完成」，不得用 `requests`/`curl` 冒充浏览器证据。

### P6-A3 硬要求

1. 生成 `docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md`，逐条登记**每一个**外部网络依赖：
   | 字段 | 必填 |
   |---|---|
   | 精确 URL（含版本） | 是 |
   | 引用它的仓库文件（完整相对路径） | 是 |
   | 制品 SHA-256（实算） | 是 |
   | SRI 值（若使用 `integrity`） | 是 |
   | 许可证（含上游 LICENSE URL） | 是 |
   | 失败模式（CDN 不可达时页面表现） | 是 |
   | 是否可本地化（及本轮决策） | 是 |
2. 必须包含：Tailwind CDN、Lucide（标注**本轮已本地化**）、
   `production.html` 中的 `images.unsplash.com` 外链（若存在，如实登记为**内容权利链未闭环**）、
   `api-settings.js` 中的**第三方 API 服务商 URL 列表**（`https://api-inference.modelscope.cn/v1` 等，
   属运行期用户配置项，登记为「配置项而非构建依赖」并说明边界）。
3. 必须新增一节「SRI 适用性边界」：说明为什么 Tailwind CDN **无 `Access-Control-Allow-Origin`** 会影响
   `integrity` 的前置条件（CORS 与 SRI 的关系），并如实记录**实测结论**。
4. 不得创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。

### P6-B1 硬要求（独立终审）

触发条件：A1–A3 全部产出后。**不得采信任何被审代理自述。**
必须覆盖：
1. 逐条回到文件与命令取证，复核 A1/A2/A3 的每条结论；指出夸大、错数、口径不符。
2. 复跑门禁并原文粘贴：`python -m pytest -q --no-header -p no:cacheprovider`；
   全部 `.js` 的 `node --check`；二进制红线扫描（跳过 `.git`）。
3. **证伪式抽查 ≥3 处**：
   - 重新下载 A1 使用的 CDN 制品，比对 SHA-256 / SRI 是否与仓库中写的一致；
   - 逐页 `grep` 确认再无 `@latest`、再无浮动 `cdn.tailwindcss.com`（不带版本）；
   - 独立跑一次浏览器加载（不得复用 A2 的截图或日志原文），比对 A2 结论；
   - 校验 `CDN-SUPPLY-CHAIN-2026-09-21.md` 中的 SHA-256 是否与磁盘/上游一致；
   - 确认未新增根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`，未改默认认证路径。
4. 复核 `git status --porcelain -uall` 与 `git diff --numstat`（对已跟踪文件的改动应集中于 HTML 的 `<script>` 行）。
5. 明确区分：本地实测 / 远端 CI / 生产验收。
6. 判定：**可提交 / 不可提交**；是否可宣称发布或生产就绪（默认为否）。

## 4. Tailwind `integrity` 回退策略（必须按此顺序）

1. 先实测 `curl -D -` 看 `cdn.tailwindcss.com/3.4.17` 是否返回 `Access-Control-Allow-Origin`。
2. 若**有** ACAO：计算 `sha384`，加 `integrity` + `crossorigin="anonymous"`，浏览器实测通过 → 采用。
3. 若**无** ACAO：`integrity` 在跨域场景下会导致脚本被浏览器拒绝加载（SRI 要求 CORS）。
   此时**不得**强行保留 `integrity` 让页面白屏；应：
   - 仍钉死不可变版本 `/3.4.17`（消除浮动版本风险）；
   - **不添加** `integrity`；
   - 在 `CDN-SUPPLY-CHAIN-2026-09-21.md` 中**如实登记**「因上游无 CORS 头，SRI 无法启用」
     及推荐替代（自托管 / 镜像 + 构建期校验），标注**待用户裁决**。
4. 两条路径都必须有浏览器实测证据，不得只有 `curl`。

## 5. 收口（主代理执行，禁止子代理）

1. 汇总 A1–A3 + B1，核对 `git status --porcelain -uall` 与 `git diff --numstat`。
2. 追加 `docs/governance/TASKS.md`（T17）、`docs/governance/TASK-NOTES-2026-09-18.md` 新小节、
   `CLEANROOM-STATUS.md`。
3. 新增 `HANDOFF-6.md`（本轮真实结论、未闭环项、待用户确认项、下一步）。
4. 逐文件 `git add`（**严禁 `-A`**），中文提交信息，`git push`，读回远端 CI。
5. 生产验收仍为独立决策；**待用户确认项**集中列入 `HANDOFF-6.md`，不在本轮代为决定。