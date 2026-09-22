# CDN 与外部依赖供应链台账（2026-09-21 / Phase 6）

> 基线提交：`5b25bdfac3d0e3adfdce1b703c4f24cb4c5f6d4a`（Phase 6 起始工作树）。
> 本台账由 **P6-A3（供应链与完整性台账）** 产出，由 **P6-B1（独立审核代理，未参与实现）** 抗证式复核。
> 范围：`src/gods_workbench/static/` 下**全部**外部网络依赖（构建期与运行期）。
> 边界：本台账只登记事实与风险，**不构成发布授权**；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 0. 实测环境

| 项 | 值 |
|---|---|
| 实测日期 | 2026-09-21（Asia/Shanghai） |
| 主机 | Windows，Chrome `153.0.8010.48`（Playwright `channel=chrome`，真实浏览器内核） |
| 本地服务 | `python run.py`，`GW_RELOAD=false`，`http://127.0.0.1:2077`（真实 HTTP 服务，非 TestClient） |
| 网络探针 | `curl -D - -H "Origin: http://127.0.0.1:2077"` |
| 临时工件目录 | `%TEMP%\gw-p6-a3-20260921\`（**不入库**） |

---

## 1. Tailwind Play CDN（`cdn.tailwindcss.com`）

| 字段 | 内容 |
|---|---|
| 精确 URL（钉版本后） | `https://cdn.tailwindcss.com/3.4.17` |
| 带插件查询串形式 | `https://cdn.tailwindcss.com/3.4.17?plugins=forms,container-queries` |
| 引用文件（完整相对路径） | `src/gods_workbench/static/v2/agents.html`、`assets.html`、`collab.html`、`index.html`、`production.html`、`projects.html`、`settings.html`、`storyboard.html`、`workshop.html`（9 个页面，第 8/10/9 行区）；`src/gods_workbench/static/episode-pipeline.html`（第 17 行，带 `?plugins=`） |
| 制品 SHA-256（实算） | `176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15`（407,279 B） |
| SRI（`sha384`，**仅记录，未启用**） | `sha384-igm5BeiBt36UU4gqwWS7imYmelpTsZlQ45FZf+XBn9MuJbn4nQr7yx1yFydocC/K`（sha256：`sha256-F26JRmGqnNyaXLpscgBEy797i9gNHJoUKnwksbbFDRU=`） |
| `integrity` 是否使用 | **否（未启用）**。原因见 §3：上游无 `Access-Control-Allow-Origin`，启用 `integrity` 会被浏览器 CORS 策略拒绝，导致脚本不加载、页面无样式（已实测复现）。 |
| 许可证 | MIT（Tailwind CSS v3.4.17）。上游 LICENSE：`https://github.com/tailwindlabs/tailwindcss/blob/v3.4.17/LICENSE`。注：Play CDN 内嵌的传递组件版本不可完全恢复（见 `src/gods_workbench/static/vendor/MANIFEST.md`），正式分发前仍需构建 metafile/lockfile。 |
| 失败模式（CDN 不可达时页面表现） | Tailwind 脚本加载失败 → `window.tailwind` 未定义 → 页面**无 Tailwind 工具类样式**（布局/间距/字号退化），HTML 结构与本地 CSS 仍可用，页面**不会白屏**。已实测：阻断 `cdn.tailwindcss.com` 后 `typeof window.tailwind === 'undefined'`，页面文本仍可渲染。 |
| 是否可本地化（及本轮决策） | **可本地化**（已有 `src/gods_workbench/static/css/tailwind-utilities.css` 预构建产物，但仅被 `api-settings.html` / `canvas-list.html` / `episode-pipeline.html` 引用，且未覆盖 `v2/*` 的 arbitrary-value 类）。**本轮决策：不本地化**，仅钉死版本；自托管需完整重新生成 CSS 并做视觉回归，属独立任务，**待用户裁决**。 |
| 查询串说明 | `?plugins=forms,container-queries` 会 302 跳到 `/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1`（版本已由上游固定，但依赖两个插件子包，非本仓可控）。 |

---

## 2. Lucide 图标（本轮已本地化，外部 CDN 依赖已移除）

| 字段 | 内容 |
|---|---|
| 原外部 URL（已弃用） | `https://unpkg.com/lucide@latest`（**浮动版本**；实测 2026-09-21 解析为 `lucide@1.47.0`，442,433 B，SHA-256 `C3291EA757FF3DA0FC45A41D3FF60D61DA9B257314962C5CDDED94CA0DF05D7A`） |
| 现行引用 URL（本地） | `/static/vendor/js/lucide.js?v=1.16.0` |
| 引用文件（完整相对路径） | `src/gods_workbench/static/v2/agents.html`、`assets.html`、`collab.html`、`index.html`、`production.html`、`projects.html`、`settings.html`、`storyboard.html`、`workshop.html`（9 个页面，第 9/11/10 行区）。`settings.html` 原有的第二份本地引用（查询串 `v=v0.0.1-alpha-2026`）已**去重**，仅保留一份。 |
| 制品 SHA-256（实算） | `187A756625C5CE7499C207D1B0D1CF4E1AB95E3F666C7E0CD0FAFC3E6842D040`（401,894 B） |
| 上游一致性 | **已实测**：`https://unpkg.com/lucide@1.16.0/dist/umd/lucide.min.js` 与本仓 `src/gods_workbench/static/vendor/js/lucide.js` **字节一致**（同长度 401,894 B、同 SHA-256）。 |
| SRI | 本地同源资源**无需** `integrity`（同源加载不受 CDN CORS 约束）。 |
| 许可证 | ISC（Lucide v1.16.0）。 |
| 失败模式（外部 CDN 完全不可达） | **不再受影响**：本地 Lucide 仍加载，`window.lucide.createIcons()` 可用。已实测：阻断 `unpkg.com` + `cdn.tailwindcss.com` 后，`/static/v2/agents.html` 仍渲染 **19** 个 `svg.lucide` 图标；改版前写法（`unpkg@latest`）在同一阻断下加载失败、图标数 **0**。 |
| 是否可本地化（及本轮决策） | **已完成本地化**（本轮成果）。图标名兼容性已核对：`v2/*` 使用的图标名全部存在于 1.16.0。 |

---

## 3. Google Fonts / Material Symbols（`fonts.googleapis.com`、`fonts.gstatic.com`）

| 字段 | 内容 |
|---|---|
| 精确 URL | 样式表 `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`；字体文件由 `fonts.gstatic.com` 提供（`<link rel="preconnect">` 预连接） |
| 引用文件（完整相对路径） | `src/gods_workbench/static/episode-pipeline.html` 第 13–15 行 |
| 制品 SHA-256（实算，CSS 响应） | `43CF07907373A7D4E4EC8DDE2EDF0214562B477B7F92CA90AF93205B45DA1966`（2,444 B，实测日期响应） |
| SRI | **未使用**。字体 CSS 由 `@font-face` 间接拉取 `gstatic` 二进制，`integrity` 无法覆盖二次请求；且字体为运行时可选增强。 |
| 许可证 | Material Symbols 图标字体：Apache License 2.0。上游许可正文入口：`https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE`（实测 200）；`https://fonts.google.com/license` 实测 404，已弃用该入口。 |
| 失败模式（CDN 不可达时页面表现） | 图标字体不加载 → Material Symbols 字形的 `span` 退化为文字/方块，`episode-pipeline.html` 视觉降级；页面结构与功能不受影响。 |
| 是否可本地化（及本轮决策） | **可本地化**，但**本轮决策：不本地化**（超出 Phase 6 授权范围，且 `AGENTS.md` §1.2 对本地字体二进制白名单极严：仅允许 3 个 Source Han Sans CN 字体路径）。**待用户裁决**。 |

---

## 4. Unsplash 图片外链（`images.unsplash.com`）

| 字段 | 内容 |
|---|---|
| 精确 URL | `src/gods_workbench/static/v2/production.html:342` 的 `<img id="mainMonitorImage" src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop" ...>`；另有 `v2/js/*-controller.js` 中多处 `cover_media_url` / `img` / `imageUrl` 指向 `images.unsplash.com`（home / production / projects / storyboard 控制器）。 |
| 引用文件（完整相对路径） | `src/gods_workbench/static/v2/production.html`；`src/gods_workbench/static/v2/js/home-controller.js`、`production-controller.js`、`projects-controller.js`、`storyboard-controller.js` |
| 制品 SHA-256（实算） | **不构成锁定值**：外链为运行时拉取的内容资源；对**固定 `photo-*` + 固定参数**单次响应可计算哈希（例如 `photo-1518709268805` + `?q=80&w=1200&auto=format&fit=crop` 实测 200、267,214 B），但参数可变、内容非构建制品，**不构成不可变承诺**，故不作为供应链锁定对象。 |
| SRI | **不适用**（图片元素内容资源，非脚本）。 |
| 许可证 | **内容权利链未闭环**：Unsplash License 不等于对每个 `photo-*` 资产的再分发授权，本节如实登记为 **内容权利链未闭环**，不得视为已许可。 |
| 失败模式（不可达时页面表现） | 图片位显示占位/破图，`onerror` 回退为 `data-lucide` 占位图标；页面功能不受影响。**已实测**：`photo-1579783902614-a3fb3927b675` 当前返回 **HTTP 404**（`text/html`，29 B），浏览器记为 `net::ERR_BLOCKED_BY_ORB`（即"失效图片"，非网络中断）；`production.html` / `storyboard.html` 各 1 次失败请求。其余抽查 `photo-1518709268805`（200，267,214 B）、`photo-1509198397868`（200，17,190 B）、`photo-1534447677768`（200，13,140 B）正常。 |
| 是否可本地化（及本轮决策） | **可本地化**（须替换为自有/已授权素材），但**本轮决策：不本地化**，仅如实登记为未闭环项，**待用户裁决**。 |

---

## 5. SRI 适用性边界（CORS 与 SRI 的关系）

`<script integrity="...">` 的校验前提是浏览器能**读取**该跨域响应体；而跨域脚本默认是"不透明"的，脚本引擎不会把响应体交给 SRI 校验。因此规范要求：**跨域脚本启用 `integrity` 时必须同时具备 CORS 许可（`crossorigin="anonymous"` + 响应头 `Access-Control-Allow-Origin`）**，否则浏览器直接以 CORS 失败拒绝加载该脚本。

**实测结论（Tailwind CDN）**：

1. `curl -sS -D - -H "Origin: http://127.0.0.1:2077" https://cdn.tailwindcss.com/3.4.17` → 响应头中 **无 `Access-Control-Allow-Origin`**（对比：`https://unpkg.com/lucide@1.16.0/...` 返回 `Access-Control-Allow-Origin: *`）。
2. **真实浏览器复现**：以注入方式给该 URL 加上 `integrity="sha384-igm5...docC/K"` + `crossorigin="anonymous"` 后，Chrome 153 控制台报：
   `Access to script at 'https://cdn.tailwindcss.com/3.4.17' from origin ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
   → `net::ERR_FAILED`，`typeof window.tailwind === 'undefined'`，探针元素 `computed color = rgb(0,0,0)`（**未应用工具类，页面退化**）。
3. 而未加 `integrity` 的现状（`<script src="https://cdn.tailwindcss.com/3.4.17">`）在同环境 `window.tailwind === true`、页面样式正常。

**结论**：Tailwind CDN **因上游无 CORS 头，SRI 无法启用**。本轮按任务书 §4.3 回退：只钉死不可变版本 `/3.4.17`，**不添加** `integrity`。推荐替代方案（**待用户裁决**）：①自托管与该 URL 字节一致的制品并加构建期哈希校验；②改用已预构建的 `tailwind-utilities.css` 全量覆盖 `v2/*`（需重新生成 + 视觉回归）；③使用带 CORS 的镜像并验证 ACAO。

---

## 6. 运行期配置项（**非构建依赖**，仅登记边界）

以下 URL 出现在 `src/gods_workbench/static/js/api-settings.js` 中，属**用户可配置的第三方 API 服务商地址/注册与文档链接**，不是页面构建或渲染依赖；本台账登记以明确边界，不作为供应链制品锁定对象：

- `https://api-inference.modelscope.cn/v1`（ModelScope 默认 Base URL）
- `https://ark.cn-beijing.volces.com/api/v3`（火山方舟默认 Base URL）
- `https://apistudio.vip`、`https://www.vip-gpt.net`、`https://api.ai-tudou.net`、`https://new.exellome.online`、`https://www.fhl.mom`、`https://api.apimart.ai`、`https://apihub.agnes-ai.com`（服务商 Base URL）
- `https://api.example.com/v1`（占位示例值）
- 注册/文档跳转链接（如 `https://www.modelscope.cn/my/access/token`、`https://platform.agnes-ai.com/settings/apiKeys`、`https://space.bilibili.com/78652351` 等）

**边界**：这些 URL 由用户在设置页自行填写/选择，运行时才可能被访问；其可用性与合规性由用户所选服务商决定，**不属本仓供应链锁定范围**。本仓不内置任何真实密钥/token。

---

## 7. 未闭环与待用户裁决

1. **Tailwind SRI 不可启用**（上游无 CORS 头）——需用户在「自托管/镜像/预构建 CSS」三条路径中裁决（§5）。
2. **Tailwind Play CDN 传递组件版本不可完全恢复**——正式分发前需构建 metafile/lockfile/SBOM。
3. **Material Symbols 字体许可入口已更正**：`https://fonts.google.com/license` 实测 404，改用上游仓库 `LICENSE` 正文（实测 200）；Apache-2.0 的 NOTICE 义务清单与分发包内正文装配**仍未闭环**（详见 §9.3/§9.5）。
4. **Unsplash 内容权利链未闭环**；其中 `photo-1579783902614-a3fb3927b675` 死链（404）**已于 Phase 9 替换**为同在用的 `photo-1511447333015-45b65e60f6d5`（实测 200，见 §9.2），但授权问题仍待用户/法务裁决。
5. 本台账仅覆盖 `src/gods_workbench/static/` 的**外部网络依赖**；Python 依赖闭包见 `requirements.lock.hashes` 与 `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`。

---

## 8. 证据清单（可复算命令）

```powershell
# 1) Tailwind 制品哈希与 SRI
curl.exe -sS -o "$env:TEMP\tw.js" "https://cdn.tailwindcss.com/3.4.17"
Get-FileHash "$env:TEMP\tw.js" -Algorithm SHA256   # 176E8946...C50D15
# 2) ACAO 缺失
curl.exe -sS -D - -o NUL -H "Origin: http://127.0.0.1:2077" "https://cdn.tailwindcss.com/3.4.17"   # 无 Access-Control-Allow-Origin
# 3) Lucide 上游一致性
curl.exe -sSL -o "$env:TEMP\lu.js" "https://unpkg.com/lucide@1.16.0/dist/umd/lucide.min.js"
Get-FileHash "$env:TEMP\lu.js" -Algorithm SHA256   # 与 vendor/js/lucide.js 同为 187A7566...2D040
# 4) 浮动版本漂移
curl.exe -sS -o NUL -w "%{redirect_url}`n" "https://unpkg.com/lucide@latest"   # -> lucide@1.47.0
# 5) 页面残留检查（应为空）
Get-ChildItem -Recurse -File -Path src -Include *.html | Select-String 'src="https://cdn\.tailwindcss\.com"'
Get-ChildItem -Recurse -File -Path src -Include *.html | Select-String 'unpkg\.com/lucide'
```

---

## 9. Phase 9 追加实测（2026-09-21，用户裁决 4「按建议执行」）

本轮以**只读 HTTP 探针**重新实测 `src/gods_workbench/static/` 的全部外链，
原始状态码落盘于 `%TEMP%\gw-root-20260921\urlstatus-phase9.json`（可复算，见 §9.4）。

### 9.1 实测结果（逐条状态码）

| 外链 | 状态 | 处置 |
|---|---|---|
| `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?...` | **404**（`text/html`） | **死链，本轮已替换**（见 §9.2） |
| 其余 6 个 Unsplash 图（`photo-1518709268805-4e9042af9f23`、`photo-1509198397868-475647b2a1e5`、`photo-1534447677768-be436bb09401`、`photo-1511447333015-45b65e60f6d5`、`photo-1508739773434-c26b3d09e071`、`photo-1618005182384-a83a8bd57fbe`） | 200（`image/jpeg`） | 保留（内容权利链仍待裁决，见 §9.3） |
| `https://fonts.google.com/license` | **404** | **许可入口更正**（见 §9.3） |
| `https://fonts.google.com/icons` | 200 | 保留（图标浏览页，非许可正文） |
| `https://github.com/google/material-design-icons/blob/master/LICENSE` | 200 | 作为 Material Symbols / Material Icons 的**许可正文入口** |
| `https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE` | 200（`text/plain`） | 同上（原始正文，便于机器读取） |
| `https://raw.githubusercontent.com/google/material-design-icons/master/README.md` | 200 | 上游自述：Material Symbols 与 Material Icons 为**同一套官方图标设计**，Symbols 为现行集合 |
| `https://api.github.com/repos/google/material-design-icons` | 200 | 上游仓库元数据（确认 `license` 字段存在） |
| `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:...` | 200（`text/css`） | `episode-pipeline.html` 的图标字体依赖可达 |

### 9.2 Unsplash 死链替换（本轮最小改动）

- 死链 `photo-1579783902614-a3fb3927b675` 在静态层共 **7 处**引用：
  `v2/js/home-controller.js:107`、`v2/js/projects-controller.js:264`、
  `v2/js/production-controller.js:53`（`sh-02-03`）、`v2/js/production-controller.js:155`（`sh-02`）、
  `v2/js/storyboard-controller.js:67`，以及 `docs/` 中的登记性引用（不属运行时代码）。
- 替换目标：**已在其他位置使用且实测 200** 的 `photo-1511447333015-45b65e60f6d5`
  （未引入任何新的上游资产或新的权利主体），保持原 `?q=&w=&auto=fit=crop` 查询串不变。
- 处置口径：**不新增图片文件**（洁净室二进制红线不变），仍为外链；本地 `assets` 目录未落任何图片。
- 该替换只消除「确定性死链」，**不解决** Unsplash 的内容权利链问题（见 §9.3）。

### 9.3 内容权利与许可入口（如实边界）

- **Material Symbols / Material Icons**：上游 `material-design-icons` 仓库 `LICENSE` 为
  **Apache License 2.0** 正文（`https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE`，实测 200）。
  台账原先登记的 `https://fonts.google.com/license` 实测 **404**，已更正为上述仓库 LICENSE（HTML 页 + raw 正文两处）。
  仍然**未**完成：Apache-2.0 的 `NOTICE` 义务清单与分发包内正文装配（仍未创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`）。
- **Unsplash 图片**：全部为**外链**，仓库内无图片文件；`images.unsplash.com` 的
  **内容权利链未闭环**（上游声明不重新授予本仓分发权），仍登记为**待用户 / 法务裁决**。
- **提示词库预览图 / 参考图**：同样为外链，权利链见
  `docs/provenance/PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md`，仍待裁决。
- **Tailwind CDN**：版本已钉死 `/3.4.17`（10 个 HTML，其中 `episode-pipeline.html` 带 `?plugins=forms,container-queries`）；
  上游**无 `Access-Control-Allow-Origin`**，故 SRI **不可启用**——属上游限制，替代路径（自托管 / 预构建 CSS / 带 CORS 镜像）仍**待用户裁决**（§5）。

### 9.4 可复算命令

```powershell
# 1) 外链状态码（Phase 9 探针，输出 JSON）
python "%TEMP%\gw-root-20260921\urlprobe9.py"

# 2) 死链替换后再复算一次，应无 404
Select-String -Path src\gods_workbench\static\v2\js\*.js -Pattern 'photo-1579783902614-a3fb3927b675'
# 期望：无输出（死链已清除）

# 3) Material Symbols 许可正文
curl.exe -sS -o NUL -w "%{http_code}\n" "https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE"
# 期望：200
```

### 9.5 未闭环（本节的“未做”，不得外推）

- **未**为 Unsplash 取得授权，**未**替换为自有/已授权素材。
- **未**创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`；**未**发布。
- **未**解决 Tailwind SRI（上游 CORS 限制）。
- **未**闭环字体上游匹配（本地 1.004 vs 上游 2.005R，见 `VENDOR-UPSTREAM-MATCH-AUDIT-2026-09-21.md` §4）。

---

## 10. Phase 9T 追加实测：Tailwind 插件版本已钉死（2026-09-22）

### 10.1 实测（主代理亲跑，真实网络，Windows PowerShell）

| URL | 状态码 | 字节数 | SHA-256 |
|---|---|---|---|
| `https://cdn.tailwindcss.com/3.4.17` | 200 | 407,279 | `176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15` |
| `https://cdn.tailwindcss.com/3.4.17?plugins=forms,container-queries` | **302** | — | Location: `/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1` |
| `https://cdn.tailwindcss.com/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1` | 200 | **418,973** | `A789CE5A73191759006B64A0C05F63AFBF9AA43A86511BF798D688737429E60A` |

浏览器侧复算（真实 Chrome + 真实 HTTP，`/static/episode-pipeline.html`）：
加载序列为 `302` → `200`（重定向后），`typeof window.tailwind === "object"`（脚本正常生效）。

### 10.2 处置（本地可闭环部分，已执行）

- `src/gods_workbench/static/episode-pipeline.html:17` 的引用由
  `?plugins=forms,container-queries`（浮动，依赖上游 302 解析）
  改为 **`?plugins=forms@0.5.10,container-queries@0.1.1`**（显式钉死传递插件版本）。
- 新增静态守卫 `tests/contracts/test_phase9_frontend_degradation.py`：
  `test_tailwind_plugin_versions_are_pinned`（禁止未钉死插件版本，并强制 episode-pipeline 使用钉死版）、
  `test_tailwind_base_version_is_still_pinned`（所有 `cdn.tailwindcss.com` 引用必须带 `/3.4.17`）。
- 变异测试：把 URL 改回未钉死形式、并把 `v2/index.html` 改成无版本形式 →
  上述两条守卫**同时变红**（原始输出 `%TEMP%\gw-p9t-root\reports\MUTATION-P9T-TAILWIND.txt`）。

### 10.3 仍未闭环（不得写 PASS）

- **上游无 `Access-Control-Allow-Origin`**，故 SRI/`integrity` **仍不可启用**（§5 结论未变）；
  本次钉死仅消除**302 间接跳转与插件版本浮动**，不解决完整性校验缺口。
- Tailwind Play CDN 的**传递组件版本仍不可完全恢复**：正式分发前仍需构建
  metafile / lockfile / SBOM（`src/gods_workbench/static/vendor/MANIFEST.md` 中
  `js/tailwindcss-cdn.js` 条目状态**仍为 `BLOCKED`**）。
- 自托管替代路径（台账 §5 建议①②③）**仍需用户裁决**：`AGENTS.md` §1.2 与 §2.1
  明确写「样式使用 Tailwind CDN」「视觉系统……与 Tailwind CSS CDN」，
  自托管属**宪章变更**，须用户明确授权后方可执行；本轮**未改动 `AGENTS.md`**。
- 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 仍未建立（`AGENTS.md` §1.4 禁止未经审计添加）。
---

## 11. 主代理独立复算（2026-09-22，只读；**同框架自审**，非第三方审计）

> 子代理通道本轮失效（3 次派发只送达环境上下文），故由主代理直接复算。
> 结论**不构成**独立审核；所有请求均为只读 GET。

### 11.1 Tailwind Play CDN（禁跟随重定向，取原始状态码）

| URL | 原始状态 | Location / 字节 | SHA-256 | ACAO |
|---|---|---|---|---|
| `https://cdn.tailwindcss.com/3.4.17` | **200** | 407,279 B | `176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15` | 无 |
| `...?plugins=forms,container-queries` | **302** | `Location: /3.4.17?plugins=forms@0.5.10,container-queries@0.1.1` | — | 无 |
| `...?plugins=forms@0.5.10,container-queries@0.1.1` | **200** | 418,973 B | `A789CE5A73191759006B64A0C05F63AFBF9AA43A86511BF798D688737429E60A` | 无 |

**复算结论**：与 §10 记录**逐字一致**；未钉死版本确实经 **302** 间接跳转，钉死后为单跳 200。
**上游始终不返回 `Access-Control-Allow-Origin`** → `integrity`/SRI 仍不可启用（§5 结论未变）。
证据：`%TEMP%\gw-p9t-root\reports\TAILWIND-PROBE.json`、`NO-REDIRECT-PROBE.json`。

### 11.2 其余台账项复算

| 项 | 实测 | 台账 | 判定 |
|---|---|---|---|
| Google Fonts 许可入口 `https://fonts.google.com/license` | **404** | 台账称 404 | 一致 |
| Material Symbols 上游 LICENSE（GitHub） | **200** | 台账称改用上游仓库正文 | 一致 |
| prompt-registry `sources/*.json` | **6 个文件 / 1,230 条** | 台账称 6 来源 / 约 1230 条 | 一致 |
| prompt-registry 许可分布 | **4×MIT + 2×CC-BY-4.0** | 台账同 | 一致 |
| `vendor/MANIFEST.md` 中 `js/tailwindcss-cdn.js` | 条目存在、状态仍含 **`BLOCKED`** | 台账同 | 一致 |
| 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` | `git ls-files` **空输出** | 台账称未建立 | 一致 |

证据：`%TEMP%\gw-p9t-root\reports\SUPPLY-COUNT.json`。

### 11.3 仍未闭环（口径不变）

- SRI/`integrity`：**上游限制**（无 ACAO），本仓无法本地闭环。
- Tailwind Play CDN 传递组件版本**不可完全恢复**；`js/tailwindcss-cdn.js` 仍 **`BLOCKED`**。
- 自托管替代路径属**宪章变更**（`AGENTS.md` §1.2/§2.1 明写使用 CDN），**需用户裁决**；本轮未改 `AGENTS.md`。
- 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 仍未建立（§1.4 禁止未审计添加），需发布授权后处理。
