# P7-A1 报告：`/static/api-settings.html` 首屏图标不渲染缺陷修复（2026-09-21）

> 角色：P7-A1 前端缺陷修复工程师（本会话子代理委派不可用，由主代理 `/root` 亲自执行，见 §6 独立性问题声明）。
> 施工依据：`docs/governance/AGENT-TASK-2026-09-21-PHASE7.md` §4。
> 基线：`b4c7153`（Phase 6 补正后）。

## 1. 缺陷与根因

**现象**：`/static/api-settings.html` 首屏 35 个 `data-lucide` 图标占位全部不渲染（`svg.lucide` 计数为 0）。

**根因（代码行号）**：

- `src/gods_workbench/static/js/api-settings.js:271` 定义渲染入口
  `function refreshIcons(){ if(window.lucide) lucide.createIcons(); }`；
- 该文件末尾 `:2079` 的 `window.onload` 首屏引导块中**没有任何** `refreshIcons()` / `createIcons()` 调用；
- `loadProviders()`（`:1914`）为**异步**函数，首屏 `DOMContentLoaded` 完成时 `providers` 尚未加载，
  渲染路径（`renderEditor()` 等）虽会间接调用 `refreshIcons()`，但首屏静态 HTML 中的占位从未被替换；
- 对照仓库既有模式：`canvas-list.js:2130`、`asset-manager.js` 等均在 boot 末尾显式调用 `refreshIcons()`。

**缺陷归属**：该文件末次改动为 `97b8b04`，**非 Phase 6 / 本轮引入**（Phase 6 补正独立复核实测发现但未修复）。

## 2. 修复（最小改动）

`src/gods_workbench/static/js/api-settings.js`，在 `window.onload` 引导块末尾追加 2 行（**纯追加，未删除任何内容**）：

```diff
@@ -2106,4 +2106,6 @@ window.onload = () => {
             if(input === keyInput) updateApimartDomesticHint();
         });
     });
+    // 首屏静态图标渲染：loadProviders() 为异步，此处统一刷新一次以替换初始 HTML 中的 data-lucide 占位
+    refreshIcons();
 };
```

- **未删除任何 HTML class**；未改动数据 / API 逻辑；未改动 `refreshIcons()` 语义。
- 改动文件 SHA-256（修复后）：`4A60D088AD97E57349378E3E4EAC43B7460B72DE104D264A59CDBBFC903BF312`
- `node --check src/gods_workbench/static/js/api-settings.js` → 退出码 0。

## 3. 回归守卫测试（纯 Python，不依赖浏览器）

新增 `tests/contracts/test_phase7_frontend_icon_boot.py`：

1. `test_api_settings_html_has_lucide_placeholders`：断言 HTML 含 `data-lucide` 占位且引用本地 `vendor/js/lucide.js`。
2. `test_api_settings_boot_path_renders_icons`：用花括号配平截取 `window.onload` 引导块，断言块内出现
   `refreshIcons()` 或 `createIcons(` 调用。

**可复现性验证**（证明该守卫确实能拦住缺陷回归）：

```text
=== 修复后（工作区文件）===
  PASS (both)
=== 修复前（git HEAD 版本，回放）===
  预期失败(证明可复现缺陷) -> api-settings.js 的 boot 路径 (window.onload) 未调用 refreshIcons()/createIcons()；...
```

即：对 `git show HEAD:...api-settings.js` 回放版本，该断言**失败**；对修复后版本**通过**。

## 4. 真实浏览器验证（真实 HTTP 服务 + 真实 Chromium）

- 服务：单进程 Python 内 `uvicorn.Server`（`GW_RELOAD=false`），`http://127.0.0.1:2102`（**非 TestClient**）。
- 内核：Playwright + Chromium **151.0.7922.34**
  （`C:\Users\qinxuedong\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe`）。
- 方法：同一服务进程下，先用 `git show HEAD:` 回放**修复前**文件探测一次，再恢复**修复后**文件探测一次。

| 指标 | 修复前 | 修复后 | 判定 |
|---|---:|---:|---|
| 未渲染占位 `i[data-lucide]` | **35** | **0** | 占位全部被替换 ✅ |
| 已渲染 `svg.lucide` | **0** | **35** | 图标全部渲染 ✅ |
| 控制台错误数 | 2 | 2 | 未增加（均为既有 `/api/providers` 404） ✅ |

截图（**未入库**，仅登记路径）：

- `%TEMP%\gw-p7-a1-20260921\before_fix.png`
- `%TEMP%\gw-p7-a1-20260921\after_fix.png`

## 5. 门禁结果

```text
python -m pytest -q --no-header -p no:cacheprovider tests/contracts/test_phase7_frontend_icon_boot.py
-> 2 passed
node --check src/gods_workbench/static/js/api-settings.js
-> exit 0
```

## 6. 独立性问题声明（如实登记）

按任务书 §3，P7-A1 由子代理 `p7_a1_icon_fix` 承担；但本会话的**子代理委派失败**
（对 3 个不同子代理、经由 `spawn_agent` / `followup_task` / `send_message` 共 6 次尝试，
任务正文均未送达，子代理只收到 `AGENTS.md` 上下文并回复「未收到任务」）。
为避免空转，由**主代理 `/root`** 亲自执行本项，并在 §7 由**独立复核章节**对抗式验证。
该偏差与 Phase 6 §9.1 的独立性问题同类，一并如实登记。

## 7. 待主代理提交的文件清单

1. `src/gods_workbench/static/js/api-settings.js`（修复，+2 行）
2. `tests/contracts/test_phase7_frontend_icon_boot.py`（新增回归守卫）
3. `docs/governance/agent-reports-2026-09-21/P7-A1-ICON-FIX.md`（本报告）
