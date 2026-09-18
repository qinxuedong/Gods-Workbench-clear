# 自有代码迁移与洁净重构分类表

## 记录信息

- 记录日期：2026-09-17
- 用户授权来源根目录：`D:\Working\Code Pro\Gods-Workbench-release`
- 目标根目录：当前 `Gods-Workbench-clear`
- 依据：用户本次“自有代码迁移与画布洁净重构计划”及修订后的独立审计报告。
- 规则：只记录路径、哈希、依赖结论和处理决定，不把旧仓源码或用户数据写入证明文件。

## 分类结果

| 来源范围/目标路径 | 分类 | 依赖闭包检查 | 处理决定 |
|---|---|---|---|
| `static/v2/js/project-date-range.js` → `src/gods_workbench/static/v2/js/project-date-range.js` | 可迁移自有非画布切片 | 仅日期选择器 DOM、浏览器日期 API；未发现画布、智能任务、插件、生成器、资产路由或用户数据依赖 | 接受迁移；保留为唯一实际迁移切片，并登记源/目标哈希 |
| `static/v2/css/project-date-range.css` → `src/gods_workbench/static/v2/css/project-date-range.css` | 可迁移自有非画布样式切片 | 仅日期选择器样式；未发现画布、插件、资产或外部服务依赖 | 接受迁移；登记源/目标哈希 |
| `static/v2/projects.html`、`static/v2/js/projects-controller.js` | 画布耦合的旧整文件候选 | 含画布回收站、旧页面、资产管理、旧 API 和跨页面旧壳层依赖 | 不接受整文件迁移；以项目中心行为规范重写 |
| `static/v2/js/v2-shell.js`、`static/css/hardware-design-system.css`、`static/js/hardware-telemetry.js` | 共享依赖/待确认 | 含旧路由、固定身份、资产/团队/ComfyUI/插件等跨域引用 | 不迁移；以最小洁净壳层和状态脚本重写 |
| `static/v2/workshop.html` | 无限画布/智能画布入口 | 与 `god-canvas` 入口及画布交互边界耦合 | 禁止复制旧实现；以契约重写普通画布最小 UI |
| `asset_registry/canvas_engine/`、`asset_registry/storage_bridge/`、`backend/comfyui/` | 画布直接依赖/共享依赖 | 直接处理画布资产、工作流或运行桥接 | 隔离，不迁移 |
| `tools/chrome-local-asset-importer/`、`tools/photoshop-asset-connector/` | 工具排除区 | 项目/画布插件协议耦合 | 隔离，不迁移 |
| `backend/generation_api/providers/*.py`、`tools/route_permissions.py` | 待确认共享依赖 | 存在画布提示词、资产命名、智能任务或路由能力耦合 | 拒绝本轮迁移 |
| `main.py`、`static/` 其他文件、`data/`、`assets/`、`tests/`、`docs/`、`.git/` | 明确排除/非实现输入 | 含入口闭包、资源、数据、历史或不可证明的实现细节 | 不复制、不作为实现输入 |

## 哈希证明

以下哈希只用于证明实际接受的两个无画布切片来源关系；不构成对其他旧仓文件的迁移授权。哈希值由本次执行重新生成。

| 相对路径 | 来源 SHA-256 | 目标 SHA-256 | 结果 |
|---|---|---|---|
| `static/v2/js/project-date-range.js` | 见 `AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` | 见 `AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` | MATCH |
| `static/v2/css/project-date-range.css` | 见 `AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` | 见 `AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` | MATCH |

## 迁移结论

本轮允许的代码迁移仅限上述两个日期选择器切片。项目中心、普通画布和智能画布的业务实现均按当前行为规范、接口契约和黄金夹具重新编写；不把旧仓整文件副本当作实现输入。任何无法证明与画布完全解耦的新候选，自动回到“待确认/隔离”状态。
