# HANDOFF-11｜工程 1–8 收口交接（2026-09-24）

## 1. 交接范围

本交接承接 `HANDOFF-10.md`，执行用户已批准的工程 1–8；工程 9（公开发布）与工程 10（外部第三方审计）不在本轮授权范围内，不阻塞工程 1–8。

用户裁决保持：

- P10-R-1：选 A；
- T46：以守卫为唯一口径；
- O4：补 `tools/` 脚本；
- `py-0.2` 更正为 `py-0.5`；
- 三处“同形字”错误描述按用户授权改为纯 ASCII 大小写差异；
- canvas-list 跨窗口同步维持现状，不改动。

## 2. 本轮完成

提交 `f86cd72`（相对父提交 `447d840`）：

1. **壳层路由页级 deck 同步**：切换时同步上层与下层完整 deck，恢复 production/workshop/storyboard/index 的页级元素。
2. **module 保真**：路由脚本复制保留原始 `type` 等属性，module 不再降级为普通脚本。
3. **脚本生命周期**：按稳定指纹去重，避免重复注入；连续导航 script 数回到稳定基线。
4. **控制器刷新**：路由后按目标页刷新必要控制器，保留 workshop 标题同步。
5. **错误登记收口**：已修复的壳层/连续导航缺陷从 `KNOWN_*` 清除，新增缺口仍 fail-closed。
6. **顶栏响应式布局**：保留导航、回收站、模式切换与身份入口；窄视口仅收起非必要推子/装饰区，消除静默裁剪与横向溢出。
7. **顶栏门禁强化**：旧顶栏登记清空；加入真实 `display:none` 变异自证；缺失 `.topbar-master-deck` 时 fail-closed。

## 3. 证据

- `node --check src/gods_workbench/static/v2/js/v2-shell.js`：通过。
- `python -P -m pytest -q`：489 passed / 7 skipped。
- `python -P -m pytest tests/hygiene -q`：16 passed。
- 壳层页级/module 一致性：9/9 页面无未登记缺口。
- 连续导航：8 个目标页 script growth=0、page errors=0。
- 顶栏：27 个页面-视口组合均 `headerOverflow=0`，两个必达控件均可用。
- 真实变异自证：隐藏两个目标控件后产生 27 条失败，证明判定不是恒真。
- 全量命令：`python -P tools/frontend_e2e_smoke.py --serve --mutation-selftest` 退出码 0。

## 4. 当前边界与未授权事项

- 发布状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；本轮没有新增许可证或公开发布动作。
- 本机浏览器与本机 pytest 证据不等于远端 CI、生产验收或外部第三方审计。
- 工程 9/10 需要后续用户明确裁决；独立技术复核不等于外部审计。
- 本轮未修改 canvas-list 跨窗口同步行为。

## 5. 下一步

已串行派发 Astra 独立审核代理对提交 `f86cd72` 做最终复核；本轮工具会话在其返回独立结论前被中断，故本交接不冒称已取得新的独立 PASS。已有本机门禁全部通过；若要求新的独立签字，应继续单独运行审核代理并将其结论追加到本文件。

## 6. NEEDS WORK → 修复 → 待最终独立复核（2026-09-24）

上一轮 Luna 独立审核对提交 `dfa312e` 返回 **NEEDS WORK**，阻断点为：

- 路由脚本永久指纹会阻止返回页重新注入；
- 返回页旧控制器闭包仍可能绑定旧 DOM；
- `refreshRouteController()` 覆盖范围不足；
- assets 页 iframe `load` 监听器返回后可能失效；
- 连续导航门禁只看脚本数与 pageerror，未验证控制器重绑定。

本轮已完成修复并提交：

- `dfa312e`：控制器 `rebind` 生命周期、路由完成后的页级重绑定、assets iframe/MutationObserver 重绑定、旧监听清理；
- `170a5e2`：连续导航新增 `ROUTE_REBIND_PROBE_JS`，逐步检查控制器入口与代表性新 DOM，未重绑定时 fail-closed。

最新证据（当前 HEAD `170a5e2`）：

- `python -P -m pytest -q`：489 passed / 7 skipped；
- `python -P -m pytest tests/hygiene -q`：16 passed；
- `python -P tools/frontend_e2e_smoke.py --serve --mutation-selftest`：退出码 0；
- route consistency：9/9 页面无未登记缺口；
- repeat navigation：8 个目标页 script growth=0、page errors=0、lifecycle probe 无失败；
- 顶栏专项：27 个页面-视口组合均无 overflow，27/27 必达控件可用；
- mutation selftest：真实隐藏目标控件后仍产生 27 条 FAIL；
- assets 专项真实浏览器：`projects → assets → projects → assets`，返回后 `window.V2Assets.rebind = true`、新 iframe 存在、page errors=0。

**状态**：修复证据已齐，但在新的独立审核代理返回 PASS 前，不把工程 1–8 标记为最终完成；工程 9/10 仍未授权。

## 7. 第二次 NEEDS WORK → Workshop 生命周期修复（2026-09-24）

Astra 串行独立复核对 `0eed42d` 返回 **NEEDS WORK**，新增唯一阻断为 Workshop 控制器 `init()` 非幂等：连续返回页面会重复创建 `setInterval(updateClock, 1000)`，并重复触发请求；原探针只检查入口与 DOM，无法发现该泄漏。

已由串行实现代理完成并提交 `b007fe1`：

- `V2Workshop.rebind` 正式导出，壳层不再调用非幂等 `init`；
- 增加 `dispose`，离开 Workshop 时清理时钟、取消未完成请求、移除 `message`/`popstate` 监听；
- 以 `episodesView` 新根节点做幂等边界，同一 DOM 不重复发起项目/分集请求；
- 请求加入生命周期代际、epoch、项目 ID 校验及 `AbortController`，旧项目/离页响应不得回写；
- `switchStep(..., skipEpisodesFetch)` 消除 rebind 分集双请求；
- E2E 连续导航探针增加 `updateClock` interval 计数，Workshop 每次返回必须恰好 1 个。

最新门禁（当前 HEAD `b007fe1`）：

- `node --check`：V2 shell 与 Workshop 内联脚本通过；
- `python -P -m pytest -q`：489 passed / 7 skipped；
- `python -P -m pytest tests/hygiene -q`：16 passed；
- `python -P tools/frontend_e2e_smoke.py --serve --mutation-selftest`：退出码 0；
- 8 个连续导航目标均 script growth=0、page errors=0、lifecycle probe=0；Workshop `updateClock` timer count=1；
- 9/9 route consistency 无未登记缺口；27 个顶栏组合通过；mutation selftest 仍报 27 条 FAIL。

**状态**：等待下一轮串行独立审核；在其明确 PASS 前，工程 1–8 不标记为最终完成。

## 8. 最终独立复核 PASS 与治理裁决（2026-09-24）

新的串行独立复核代理（Astra）已对当前 HEAD `cedc533` 完成只读复核并明确返回 **PASS**。核实内容：

- `pytest -q`：489 passed / 7 skipped；
- `tests/hygiene`：16 passed；
- V2 shell 与 Workshop 内联脚本 `node --check` 通过；
- 完整 E2E 退出码 0；9/9 route consistency、8/8 连续导航生命周期、script growth=0、page errors=0；
- Workshop 每次返回 `updateClock` interval 数量均为 1；
- 顶栏 27 个页面-视口组合通过；mutation selftest 产生 27 条预期失败；
- 未发现 Workshop 控制器生命周期、旧请求回写或旧监听残留阻断。

**最终技术裁决**：工程 1–8 **TECHNICALLY COMPLETE / INDEPENDENTLY VERIFIED PASS**。

**边界声明**：

- 本结论是本地技术复核与串行独立代理签字，不等同于远端 CI、生产验收或外部第三方审计；
- 工程 9（公开发布）与工程 10（外部第三方审计）仍等待用户后续裁决；
- 仓库发布状态继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；不得据此添加许可证或公开分发。
