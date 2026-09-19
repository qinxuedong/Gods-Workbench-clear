# T13 快捷工具 / 画布内页移除记录（2026-09-19）

> 用户 2026-09-19 裁决：**V2 前端保留；画布/工具只迁移保留「入口首页」内容；快捷工具入口和里面内容不迁移。**
> 依据：`AGENTS.md` 第 5 条（破坏性删除需人工确认）；本次已获用户明确授权。

## 一、删除边界

### 1.1 快捷工具页（6 页，整页删除）
`static/zimage.html`、`static/online.html`、`static/klein.html`、`static/enhance.html`、`static/angle.html`、`static/video.html`

删除前唯一引用者：`static/v2/storyboard.html`「快捷工具」rail 分组（见 §二）。
删除后：`v2/storyboard.html` 只保留「全局画布」分组。

### 1.2 画布内页（2 页，整页删除）
`static/canvas.html`（经典画布）、`static/smart-canvas.html`（智能画布）

删除前引用者：
| 文件 | 引用 | 处理 |
|---|---|---|
| `static/js/canvas-list.js:1142-1144` | `window.location.href` 跳转 `/static/canvas.html` 或 `/static/smart-canvas.html` | 剪除跳转，仅保留向宿主 `postMessage({type:'canvas-open'})`，由 `v2/storyboard` 决定后续 |
| `static/js/asset-manager.js:3225-3229` | `canvasAssetOpenUrl()` 生成内页 URL | 删除该死函数（全仓无调用点） |
| `static/js/asset-manager.js:11511` | 「打开画布」`<a href="/static/canvas.html?id=...">` | 删除该锚点（参考画布对象仍在，仅去掉不可达内页链接） |

### 1.3 连带删除的专属资源（28 个，删除后确无其他引用者）
- CSS：`css/canvas-tools.css`、`css/canvas.css`、`css/smart-canvas.css`
- JS：`js/canvas.js`、`js/smart-canvas.js`、`js/video.js`、`js/image-preview.js`、
  `js/history-bulk-manager.js`、`js/generator-touchbar-context.js`、`js/ltx-director-timeline.js`
- `js/canvas/` 全部 18 个模块（classic-* / smart-* / state.js）

判定依据：对保留文件（含全部 `v2/**`）做引号级精确匹配（`"/static/<path>"`、`"<path>"`、`"<basename>"`）+ ESM import specifier 扫描，均无命中；再经 `.html` `href/src` 全量坏链扫描确认 0。

### 1.4 明确保留（不删）
`canvas-list.html`（V2 storyboard「全局画布」入口，保留）、`asset-manager.html`、
`api-settings.html`、`comfyui-settings.html`、`task-center.html`、`episode-pipeline.html`、
`governance.html`、`asset-share.html`、全部 `v2/**`、共享资源
（`hardware-design-system.css`、`vendor/js/lucide.js`、3 个白名单 `.otf`）。

## 二、`v2/storyboard.html` 同步剪除
- 移除「快捷工具」标题块与 6 个 `data-canvas-tool` 按钮；
- 移除 `window.openCanvasToolPage()` 函数；
- 移除 `openCanvasOverview()` 中对 `[data-canvas-tool]` 的清尾调用；
- 保留「全局画布」分组与 `openCanvasOverview()` / `embeddedCanvasRoute()` / `canvas-list.html` 内嵌。

## 三、门禁实测（全部本地）
| 检查 | 命令 | 结果 |
|---|---|---|
| 卫生用例 | `python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q` | 6 passed |
| 全量 | `python -m pytest -q` | **40 passed / 0 failed** |
| JS 语法 | `node --check`（全仓非 vendor + vendor 全部 .js） | 0 失败 |
| 坏链 | 遍历保留 `.html` 的 `/static/...` 与相对 `.html` 链接 | **0 坏链** |
| 删除页残留引用 | `/static/{zimage,online,klein,enhance,angle,video,canvas,smart-canvas}.html` 全仓扫描 | 0 |

## 四、证据边界
以上均为**本地**验证；未 push、未跑远端 CI、未做生产验收。