# Gods' Workbench 设计系统索引

> 状态：CURRENT；来源：D:\Working\Code Pro\Gods-Workbench\docs\DESIGN-SYSTEM-INDEX.md；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

状态：`CURRENT`  | 生效：2026-09-16

## 规范层级

1. `DESIGN.md`：最终设计摘要与开发入口。
2. `static/v2/*.html` 与 `static/css/hardware-design-system.css`：当前拟物科技工作台的实现事实。
3. 本索引及专项文档：范围、覆盖优先级、验证和回滚。
4. `docs/design-proposals/`：提案、实施记录和证据，不得创建新的全局真源。
5. 根旧壳 16 页的 SIGNAL-FLOW 文档：`LEGACY/迁移中`，仅用于兼容和迁移追溯。

## 当前范围

v2 九个入口为 `index`、`projects`、`production`、`agents`、`storyboard`、`assets`、`collab`、`settings`、`workshop`。`assets` 复用资产中心 iframe，`settings` 复用 API/ComfyUI 设置 iframe，`workshop` 提供剧本、资产、分镜、视频四步流程。局部覆盖记录见 `ASSET-VAULT-STITCH-20260916.md`（未随本次迁移入库） 与 `CANVAS-OVERVIEW-STITCH-20260916.md`（未随本次迁移入库）。

根 `static/index.html` 的 16 个 `PAGE_IDS` 仍服务旧壳生产页面，当前标为 `LEGACY/迁移中`；其 SIGNAL-FLOW tokens 可作为共享语义和迁移目标，不能覆盖 v2 硬件层。

## 硬件系统约束

- 曜石底盘与香槟钛金为主色；emerald/cyan/amber/rose/slate 为状态色。
- 双层顶栏实际高度约 116px；禁止文档继续写 96px 或全局 `zoom:1.1`。
- 倒角、金属渐变、局部阴影、UV 表和 launch orb 只表达控件层级，不表达业务真源。
- 组件保持稳定尺寸、可读文字、键盘焦点、窄屏单列和 reduced-motion 降级。
- 全局文字采用四级像素字阶：24px 主标题、18px 区块/卡片标题、14px 正文与控件、12px 元数据/辅助说明/等宽信息；不得新增其他文字字号。
- 全局网格采用 24px 外边距、32px 区块间距；列表行高 56px；表格和可扫描列表使用 2% 透明度的二级斑马纹。
- 生产环境不得依赖 CDN；当前 v2 的 `cdn.tailwindcss.com`、`unpkg.com/lucide`、Google Fonts 和 Unsplash 图片属于待整改技术债，未完成准入前不得宣称离线交付完成。

## 数据与交互门禁

真实关系使用 `project_id`、`entity_id`、`canvas_id`、`job_id`、`asset_id`；流水线可使用受控辅助键 `pipeline_id`。v2 当前仍有 mock/fallback 数据，不能作为生产证据。保留 API、数据库、ACL、任务中心、审计和稳定 ID。浮窗目标遵循 `GW-UI-FW-01`，但 workshop modal、reduced-motion、forced-colors 和 CDN 整改仍待验证。状态必须有颜色之外的文字或图标信号。

## 文档地图

| 文档 | 状态 | 作用 |
| --- | --- | --- |
| `DESIGN.md` | CURRENT | 最终入口 |
| `temp/UI设计稿/拟物科技工作台-0908/拟物科技工作台完整设计文档.md` | CURRENT | 调研更新版设计说明 |
| `docs/UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md` | SUPPORTING | 动效、无障碍和工程实践 |
| `.agents/skills/gods-workbench/references/design.md` | SUPPORTING | 技能路由 |
| `docs/design-proposals/SIGNAL-FLOW-16-PAGE-DESIGN-SPEC.md` | LEGACY | 旧壳迁移参考 |
| `docs/archive/design/DESIGN-LEGACY-SIGNAL-FLOW-20260916.md` | ARCHIVED | 根规范旧快照 |

新增设计文档必须标注状态、来源、作用域、验证和回滚；修改 token、字体、布局或全局交互时同步更新本文档、`DESIGN.md`、技能参考和相关测试合同。
