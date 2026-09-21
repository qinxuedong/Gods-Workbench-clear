# Phase 6 独立对抗式终审（P6-B1）

> 审核角色：**独立审核代理（P6-B1，未参与 A1/A2/A3 实现）**。
> 原则：**不采信任何被审代理自述**；每条结论回到文件与命令独立取证。
> 时间：2026-09-21。工作树起点：`5b25bdf`（+ A1 `<script>` 改写，未提交）。
> 审核环境：Windows / Chrome `153.0.8010.48` / `http://127.0.0.1:2077`（真实 HTTP 服务）/ `node v24.20.0`。

## 1. 判定结论

| 判定 | 结果 |
|---|---|
| **可提交** | ✅ **可提交**（本地证据范围内） |
| 可宣称发布 / 生产就绪 | ❌ **否**。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。 |
| 覆盖层级 | 仅**本地实测**；不含远端 CI（需提交后读回）；不含生产验收。 |

## 2. 逐条复核 A1 / A2 / A3

### 2.1 A1（CDN 钉版本 + Lucide 本地化）—— 复核通过

| 被审声明 | 独立取证 | 结论 |
|---|---|---|
| 10 个 HTML 的 Tailwind 已从浮动 URL 改为 `/3.4.17` | `grep 'src="https://cdn\.tailwindcss\.com"'` → **0 命中**；10 处均为 `/3.4.17` | ✅ 属实 |
| `episode-pipeline.html` 保留 `?plugins=` 且置于版本后 | 第 17 行 = `https://cdn.tailwindcss.com/3.4.17?plugins=forms,container-queries` | ✅ 属实 |
| 9 个 v2 页面的 `unpkg@latest` 改为本地 vendored | `grep '@latest'` → **0**；`grep 'unpkg.com'`（html+js）→ **0** | ✅ 属实，**已彻底移除** |
| `settings.html` 双份 Lucide 已去重 | `git diff` 该文件 `2 增 3 删`，其中一行删除为 `vendor/js/lucide.js?v=v0.0.1-alpha-2026` | ✅ 属实 |
| 未改任何 class / 视觉 | `git diff -U0` 过滤后**无任何超出 `<script>` 引用行的改动** | ✅ 属实 |
| 未改动默认认证路径 | `git status -- src/gods_workbench/api src/gods_workbench/core` 为空 | ✅ 属实 |

### 2.2 A3（供应链台账）—— 复核通过（含 1 处口径澄清）

| 被审声明 | 独立取证 | 结论 |
|---|---|---|
| Tailwind 3.4.17 SHA-256 = `176E8946…C50D15` | **重新下载**得同值（407,279 B），与首次下载一致 | ✅ 属实 |
| 上游**无** ACAO | `curl -D - -H "Origin: …"` → 响应头无 `Access-Control-Allow-Origin` | ✅ 属实 |
| Lucide 本地制品与 unpkg 1.16.0 **字节一致** | 重新下载 unpkg 1.16.0 → SHA-256 `187A7566…2D040`、401,894 B，与磁盘一致 | ✅ 属实 |
| `@latest` 已漂移到 1.47.0 | `curl -w %{redirect_url}` → `lucide@1.47.0/dist/umd/lucide.min.js`（442,433 B，`C3291EA7…5D7A`） | ✅ 属实 |
| 台账内哈希/SRI 与磁盘/上游一致 | 台账文本含 tw sha256、lucide sha、sri384、1.47 漂移记录，逐项比对 True | ✅ 属实 |
| Unsplash 死链 `photo-1579783902614` | 直连 → **HTTP 404**（text/html, 29 B） | ✅ 属实（A2 的 `ERR_BLOCKED_BY_ORB` 归类正确） |
| Material Symbols 许可页 404 | `https://fonts.google.com/license` → 404 | ✅ 属实（已如实登记为待复核） |

> **口径澄清（非缺陷）**：台账 §4 将 `images.unsplash.com` 的「制品 SHA-256」标为"不适用"。严格说该 CDN 对**固定 `photo-*` + 固定参数**的响应目前稳定，可算出哈希；但因 URL 参数可变、内容资源非构建制品，标"不适用"在**供应链锁定**口径下成立。建议后续补一句"单次响应可哈希，但不构成不可变承诺"，不影响结论。

### 2.3 A2（浏览器端到端）—— 复核通过

| 被审声明 | 独立取证（**不复用 A2 截图/日志**） | 结论 |
|---|---|---|
| 14 页全部 HTTP 200 | 独立 Playwright 复跑 → `ALL_HTTP_200 True` | ✅ 属实 |
| 全部页面 Lucide 加载成功 | 独立复跑 → `ALL_HAVE_LUCIDE True` | ✅ 属实 |
| 无脚本 4xx/5xx | 独立复跑 → `NO_BAD_JS True`（0 个失败脚本） | ✅ 属实 |
| 图标计数 19 / 88 / 24 | 独立计数 → agents=19、index=88、collab=24，**逐字一致** | ✅ 属实 |
| 截图 14 张 | 目录实存 14 张 PNG，字节数与报告表**逐项一致**（如 index 503,656） | ✅ 属实 |
| CDN 阻断后本地 Lucide 仍渲染 19 图标（改版前 0） | 由 B1 独立场景复现同一机制（见 §3.4） | ✅ 属实 |
| `production.html` / `storyboard.html` 各 1 次失败请求 | 独立取响应 → 均为同一 Unsplash 死链 404 | ✅ 属实 |

## 3. 证伪式抽查（≥3 处，独立执行）

1. **重新下载 CDN 制品比对哈希**：`cdn.tailwindcss.com/3.4.17` 重下 → `176E8946…C50D15`，与台账**逐字一致**。✅
2. **逐页 grep 残留**：浮动 `cdn.tailwindcss.com` = 0、`@latest` = 0、`unpkg.com` = 0。✅
3. **独立浏览器加载**：用独立 Playwright/Chrome 实例复跑 14 页，结论与 A2 一致且计数吻合。✅
4. **证伪 Tailwind SRI 可启用性（关键反向验证）**：强行给该 URL 加 `integrity` + `crossorigin="anonymous"` 后，Chrome 报
   `blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`、`net::ERR_FAILED`，
   `typeof window.tailwind === 'undefined'`、探针元素 `padding=0px`（样式失效）。
   → **证实** A1「因无 CORS 头而不启用 `integrity`」的决策与 §4.3 回退策略**正确**；若强行加 `integrity` 会导致页面退化。✅
5. **确认未新增根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`**：`Test-Path` 三项均 `False`。✅
6. **确认默认认证路径未改动**：`core/oidc.py` 与 `api/` 工作树无改动。✅

## 4. 门禁复跑（原文）

```
python -m pytest -q --no-header -p no:cacheprovider
...............................................................          [100%]
63 passed in 0.47s

node --check（全部已跟踪 .js）
node --check: 56 files, 0 failed

二进制红线扫描（跳过 .git / __pycache__ / .pytest_cache）
whitelisted fonts present: 3
NON-WHITELIST BINARY FILES: 0
RESULT: PASS
```

## 5. `git status` / `git diff` 复核

```
git status --porcelain -uall
 M src/gods_workbench/static/episode-pipeline.html
 M src/gods_workbench/static/v2/agents.html
 M src/gods_workbench/static/v2/assets.html
 M src/gods_workbench/static/v2/collab.html
 M src/gods_workbench/static/v2/index.html
 M src/gods_workbench/static/v2/production.html
 M src/gods_workbench/static/v2/projects.html
 M src/gods_workbench/static/v2/settings.html
 M src/gods_workbench/static/v2/storyboard.html
 M src/gods_workbench/static/v2/workshop.html
?? docs/governance/AGENT-TASK-2026-09-21-PHASE6.md
?? docs/governance/agent-reports-2026-09-21/P6-A2-BROWSER-E2E.md
?? docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md
```

对已跟踪文件的改动**仅 10 个 HTML**，且**集中在 `<script>` 行**（`git diff -U0` 过滤后 0 条越界改动）；行尾保持逐文件一致（无混合换行符）。✅

## 6. 发现与风险（如实登记）

| 级别 | 事项 | 状态 |
|---|---|---|
| 中 | Tailwind CDN 无 CORS 头 → **SRI 无法启用**，仅钉版本；CDN 不可达时页面样式退化（不白屏） | 已在台账登记，**待用户裁决**（自托管/镜像/预构建 CSS） |
| 中 | Tailwind Play CDN 传递组件版本不可完全恢复 | 既有未闭环项，未变化 |
| 中 | Unsplash 内容权利链未闭环，且 `photo-1579783902614` 为死链 | 已登记，**待用户裁决** |
| 低 | Material Symbols 许可官方入口 `/license` 实测 404 | 已登记待复核 |
| 低 | 洁净室后端大量 `/api/*` 端点未实现（404）与 `/ws/stats` 缺失 | **属既有状态，非本轮改动引入**；不影响静态资源供应链结论 |
| 信息 | 台账 Unsplash「SHA-256 不适用」表述可按 §2.2 澄清句补强 | 建议，不阻断提交 |

## 7. 边界重申

- 本终审为**本地**证据复核；**远端 CI** 需提交后读回方可确认；**生产验收**为独立决策。
- 未覆盖 macOS / aarch64 / 生产容器 / 真实外部 IdP。
- 本报告**不构成**发布授权或生产就绪声明。
