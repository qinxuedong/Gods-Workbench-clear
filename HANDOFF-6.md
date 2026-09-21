# HANDOFF-6 —— 2026-09-21 Phase 6（供应链钉版本与独立端到端验证）收口

> 基线：`5b25bdfac3d0e3adfdce1b703c4f24cb4c5f6d4a`（`HEAD == origin/master`，工作树干净，仅 Phase 6 任务书未跟踪）。
> 任务书：`docs/governance/AGENT-TASK-2026-09-21-PHASE6.md`。
> 依据：根 `AGENTS.md`、`CLEANROOM-CHARTER.md`、`HANDOFF-5.md`、`CLEANROOM-STATUS.md`、
> `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`。

## 1. 本轮完成（对照 HANDOFF-5 §5 未闭环项 3）

HANDOFF-5 §5「未闭环项 3：Tailwind CDN 策略（URL 未钉死不可变版本、无 SRI / 锁文件）」本轮**部分推进到底**。

| 子任务 | 负责人 | 产物 | 结果 |
|---|---|---|---|
| P6-A1 CDN 供应链钉版本与 Lucide 本地化 | 供应链安全工程师 | 10 个 HTML 的 `<script>` 改写 | 完成（SRI 见 §2 关键发现） |
| P6-A2 浏览器端到端验证 | 前端验证工程师 | `docs/governance/agent-reports-2026-09-21/P6-A2-BROWSER-E2E.md` | 完成（14 页全部 200） |
| P6-A3 供应链与完整性台账 | 供应链安全工程师 | `docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md` | 完成 |
| P6-B1 独立对抗式终审 | 独立审核代理（未参与实现） | `attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md` | 判 **本地可提交** |

## 2. 关键发现：Tailwind CDN **无法启用 SRI**（本轮最重要结论）

- `curl -sS -D - -H "Origin: http://127.0.0.1:2077" https://cdn.tailwindcss.com/3.4.17`
  → 响应头**无 `Access-Control-Allow-Origin`**（对比 unpkg 返回 `Access-Control-Allow-Origin: *`）。
- 跨域脚本的 SRI 校验**要求 CORS 许可**；强行加 `integrity` + `crossorigin="anonymous"` 会被浏览器拒绝。
- **浏览器实测证伪**（Chrome `153.0.8010.48`）：注入 `integrity="sha384-igm5…docC/K"` 后报
  `blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`、`net::ERR_FAILED`，
  `typeof window.tailwind === 'undefined'`、探针元素 `padding=0px`。
- **本轮决策（依任务书 §4.3 回退）**：**仅钉死不可变版本 `/3.4.17`，不添加 `integrity`**；
  推荐替代方案（自托管同字节制品 / 带 CORS 镜像 + 构建期校验 / 用已预构建 `tailwind-utilities.css` 全量覆盖 `v2/*`）
  登记为**待用户裁决**。

## 3. 实测证据（本地 / Windows）

### 3.1 供应链钉版本

- 10 个 HTML 的 Tailwind 全部为 `https://cdn.tailwindcss.com/3.4.17`；`episode-pipeline.html` 保留
  `?plugins=forms,container-queries`（该查询串 302 跳转至 `?plugins=forms@0.5.10,container-queries@0.1.1`）。
- 9 个 `v2/*.html` 的 `https://unpkg.com/lucide@latest` → 本地 `/static/vendor/js/lucide.js?v=1.16.0`。
- **残留检查**：`grep 'src="https://cdn\.tailwindcss\.com"'` = **0**；`grep '@latest'` = **0**；`grep 'unpkg.com'` = **0**。
- Tailwind 3.4.17 SHA-256 = `176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15`（407,279 B）。
- 本地 Lucide SHA-256 = `187A756625C5CE7499C207D1B0D1CF4E1AB95E3F666C7E0CD0FAFC3E6842D040`（401,894 B），
  与 unpkg `lucide@1.16.0` **字节一致**；`lucide@latest` 实测已漂移到 `1.47.0`（442,433 B）。

### 3.2 浏览器端到端（真实内核 + 真实 HTTP 服务）

| 项 | 结果 |
|---|---|
| 服务 | `python run.py`，`GW_RELOAD=false`，`http://127.0.0.1:2077`（**非 TestClient**） |
| 内核 | Chrome `153.0.8010.48`（Playwright `channel=chrome`；自带 chromium 内核缺失，按任务书改用已装 Chrome） |
| 页面 | 14 个（9 个 `v2/*` + `api-settings` / `canvas-list` / `task-center` / `asset-manager` / `asset-share`） |
| HTTP | **14/14 = 200** |
| 脚本 | **0 个 4xx/5xx**；Tailwind / Lucide 在所有引用页面加载成功 |
| 失败请求 | `production.html` / `storyboard.html` 各 1 次 `net::ERR_BLOCKED_BY_ORB`，根因 Unsplash `photo-1579783902614` **已 404 死链** |
| 其他错误 | 既有后端 `/api/*` 未实现（404）与 `/ws/stats` 缺失，**非本轮引入** |
| 改版前后对比 | 阻断外部 CDN 后，本地化 Lucide 仍渲染 **19** 个图标；改版前同一阻断下为 **0** |
| 截图 | 14 张 PNG 写入 `%TEMP%\gw-p6-a2-20260921\`（**不入库**） |

### 3.3 门禁

```
python -m pytest -q --no-header -p no:cacheprovider   ->  63 passed
node --check（全部已跟踪 .js）                        ->  56 files / 0 failed
二进制红线扫描（跳过 .git）                           ->  PASS（仅 3 个 Source Han Sans CN 字体）
```

### 3.4 独立终审（B1）

判 **本地可提交**；证伪式抽查 6 处全部通过（重下 CDN 制品比对哈希、逐页 grep 残留、独立浏览器复跑、
强制 `integrity` 反向验证、无根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`、未改默认认证路径）。
详见 `attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md`。

## 4. 变更文件（本轮，全部为 `<script>` 引用或新增文档）

**已跟踪改动（10 个 HTML，仅 `<script>` 行）**：
`src/gods_workbench/static/episode-pipeline.html`、
`src/gods_workbench/static/v2/` `agents.html` / `assets.html` / `collab.html` / `index.html` / `production.html` /
`projects.html` / `settings.html` / `storyboard.html` / `workshop.html`。

**新增**：
`docs/governance/AGENT-TASK-2026-09-21-PHASE6.md`（任务书）、
`docs/governance/agent-reports-2026-09-21/P6-A2-BROWSER-E2E.md`、
`docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md`、
`attestations/reviews/PHASE-6-INDEPENDENT-REVIEW-2026-09-21.md`、`HANDOFF-6.md`。

**追加**：`docs/governance/TASKS.md`（T17）、`docs/governance/TASK-NOTES-2026-09-18.md`（§15）、`CLEANROOM-STATUS.md`（Phase 6 状态更新）。

## 5. 未闭环项与**待用户确认项**

| # | 事项 | 处置 |
|---|---|---|
| 1 | **Tailwind SRI 替代路径**（自托管 / 镜像 + 构建期校验 / 预构建 CSS 全量覆盖） | **待用户裁决** |
| 2 | Tailwind Play CDN 传递组件版本不可完全恢复 | 未闭环，正式分发前需构建 metafile/lockfile/SBOM |
| 3 | **Unsplash 内容权利链**未闭环，且 `photo-1579783902614` 已死链 | **待用户裁决**（替换为自有/已授权素材） |
| 4 | Material Symbols 许可官方入口（`https://fonts.google.com/license` 实测 404） | 待复核 |
| 5 | 真实外部 IdP 接线（`verify_jwt` 仍为影子模块，未被任何生产路径调用） | 未闭环，属生产变更 |
| 6 | 生产容器部署与验收、macOS / aarch64 覆盖、SBOM 签名 / 来源证明 | 未闭环 |
| 7 | 发布授权 | 仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION** |

## 6. 口径边界（务必区分）

| 层级 | 状态 |
|---|---|
| 本地实测（Windows / Chrome 153） | 通过（14/14 页 200、脚本 0 失败、`63 passed`、`node --check` 56/56、二进制红线 PASS） |
| 远端 CI（GitHub Actions） | 需本文件提交并 `git push` 后读回（见 §7） |
| 生产验收 | **未执行**，独立决策 |

> CI success **不等于**发布授权或生产就绪。

## 7. 下一步（主代理执行）

1. 逐文件 `git add`（**严禁 `git add -A`**）；中文提交信息；`git push`；`gh run list --workflow CI --branch master` 读回远端 CI 结果并追加至本文件。
2. 生产验收仍为独立决策；**待用户确认项**集中于 §5，不在本轮代为决定。
