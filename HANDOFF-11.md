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
