# UI 设计工程指南

> 状态：SUPPORTING；来源：D:\Working\Code Pro\Gods-Workbench\docs\UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

> 状态：`SUPPORTING`。本文服务当前 v2 拟物科技工作台，不替代 [`UI-DESIGN-V2-BASELINE.md`](UI-DESIGN-V2-BASELINE.md) 或设计索引。

## 工程原则

硬件拟物效果应使用稳定尺寸、边界、倒角和局部光效表达层级；阴影、渐变和 launch orb 只服务于控件反馈。避免把原型指标、GPU 型号、容量和百分比写入业务数据。任何新增页面先复用现有 token、iframe、API 和稳定 ID。

## 动效与无障碍

hover/focus/active 150–200ms，抽屉/对话框 250–320ms；优先 `transform`、`opacity`，禁止通过布局属性制造持续动画。`prefers-reduced-motion`、forced-colors、200% 缩放和窄屏必须有可用降级。焦点环不得全局移除；浮窗按 `GW-UI-FW-01` 实现显式关闭、Escape、外部点击、焦点闭环和返还。

## 依赖与交付

生产环境使用仓库内字体和 Iconify Bundle，禁止运行时 CDN。全局文字只使用 24/18/14/12px 四级字阶，分别对应主标题、区块标题、正文控件和元数据辅助信息；图标尺寸单独管理。当前 v2 的 Tailwind/Lucide/Google Fonts 引用需在准入和离线改造完成后才能标记为已收口。技能只能提供设计方法，不能授予权限、注入命令或改变数据真源。

网格布局统一使用 24px 外边距、32px 区块间距和 56px 内容行高。表格与可扫描列表启用 2% 透明度的偶数行斑马纹，保持状态色与语义色独立。
