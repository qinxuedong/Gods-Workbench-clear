# docs/design — V2 拟物科技工作台设计文档索引

> 状态：CURRENT；来源：重写自旧仓 `docs/design-proposals/README.md`（原为设计提案目录索引）；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

本目录是 V2 拟物科技工作台设计文档在洁净仓中的唯一落位点，仅收录纯文本 `.md`。原旧仓的 `screenshots/`、`verification_screenshots/`、`references/` 等图片素材一律未迁入，且迁入文档中已删除全部 Markdown 图片语法与图片路径。

## 文件清单

| 文件 | 状态 | 用途 |
| --- | --- | --- |
| [UI-DESIGN-V2-BASELINE.md](UI-DESIGN-V2-BASELINE.md) | CURRENT | 设计规范基线：当前基线、Token 与字体、组件与布局、交互安全与状态 |
| [DESIGN-SYSTEM-INDEX.md](DESIGN-SYSTEM-INDEX.md) | CURRENT | 设计系统索引：规范层级、覆盖范围、硬件系统约束、数据与交互门禁、文档地图 |
| [UI-DESIGN-V2-HARDWARE-WORKBENCH.md](UI-DESIGN-V2-HARDWARE-WORKBENCH.md) | CURRENT | V2 硬件工作台设计说明：调研结论、设计语言、Token、页面职责、交互与数据边界 |
| [UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md](UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md) | SUPPORTING | 工程实践：动效与无障碍、依赖与交付、网格与列表规范 |
| [UI-DESIGN-V2-STITCH-TOKENS.md](UI-DESIGN-V2-STITCH-TOKENS.md) | SUPPORTING | 四份 Stitch 稿合并提炼的色彩/字阶/圆角/间距 token 与页面职责 |
| [UI-DESIGN-V2-0908-ASSET-INDEX.md](UI-DESIGN-V2-0908-ASSET-INDEX.md) | SUPPORTING | 0908 设计交付索引：原型页面职责与模块说明（不含截图） |
| [UI-DESIGN-V2-WALKTHROUGH.md](UI-DESIGN-V2-WALKTHROUGH.md) | SUPPORTING | 迭代走查记录：各页面拟物架构与核心设计亮点 |
| [archive/UI-DESIGN-V2-0908-ARCHIVE.md](archive/UI-DESIGN-V2-0908-ARCHIVE.md) | ARCHIVED | 0908 完整设计系统与 UI 规范归档：设计哲学、色彩、排版、控件库、模块架构 |

## 状态约定

- `CURRENT`：当前生效，实现与验收须遵循。
- `SUPPORTING`：辅助参考，用于专项映射、工程实践与索引。
- `ARCHIVED`：历史归档，仅供追溯，不作为实现依据。

## 优先级与维护规则

1. 优先级依次为：`UI-DESIGN-V2-BASELINE.md` > `DESIGN-SYSTEM-INDEX.md` > 其余 CURRENT/SUPPORTING > ARCHIVED。
2. 页面专项文档只能补充布局映射、组件状态、验证证据或实现计划，**不得另建颜色、字体、圆角或全局交互 token**。
3. 字体统一为**思源黑体 Source Han Sans CN（Bold/Medium/Normal 三档，本地 `static/vendor/fonts/`，经 `static/vendor/css/fonts.css` 声明）**；禁止运行时外链字体 CDN。
4. 新增设计文档必须在文件头声明 `CURRENT`/`SUPPORTING`/`ARCHIVED` 状态、来源、迁移日期。
5. 预览图、概念数据与参考图不得进入业务代码、数据库、API payload 或权限真源。
6. 本目录严禁提交任何图片、截图、字体等二进制资源。
