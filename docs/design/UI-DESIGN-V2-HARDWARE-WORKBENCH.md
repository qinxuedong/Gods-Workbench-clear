# 拟物科技工作台设计说明（V2 硬件工作台）

> 状态：CURRENT；来源：D:\Working\Code Pro\Gods-Workbench\temp\UI设计稿\拟物科技工作台-0908\拟物科技工作台完整设计文档.md；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

> 状态：`CURRENT / DESIGN INPUT`；更新：2026-09-16。本文基于当前 `static/v2` 页面和 `hardware-design-system.css` 重写；旧版已保存为同目录 `docs/拟物科技工作台完整设计文档-0908-归档.md`。

## 1. 调研结论

原 v2.4 文档把原型数据、7 个页面、96px 顶栏和 `zoom:1.1` 写成了产品事实。当前代码显示 v2 已扩展为 9 个入口：`index`、`projects`、`production`、`agents`、`storyboard`、`assets`、`collab`、`settings`、`workshop`。顶栏实际约 116px；资产页和设置页通过 iframe 复用真实页面；workshop 是剧本→资产→分镜→视频四步流水线。项目名、GPU、RAID、百分比、延迟和容量仍是原型占位，不能进入 API、数据库或 fixture。

## 2. 设计语言

主视觉是“曜石底盘 + 香槟钛金硬件机架”：双层遥测顶栏、凹槽导航、UV 表、机械推子、总线树、局部金属倒角和受控背光。光效服务于当前状态和操作反馈，不使用全屏霓虹或营销式 Hero。主面板保持稳定尺寸和密集信息；窄屏折叠为单列，局部内容滚动，整页不横向溢出。

## 3. Token 与排版

底盘：`#090a0d`；面板：`#101217`；卡片层：`#171920`→`#0f1115`；主金：`#dfc384`；高光金：`#eddab3`；铜金：`#947a57`；阴影金：`#6f654c`。emerald 表示在线/完成，cyan 表示算力/当前，amber 表示排队/注意，rose 表示失败/高负荷，slate 表示归档。

字体统一为 思源黑体 Source Han Sans CN（Bold/Medium/Normal 三档，本地 `static/vendor/fonts/`，经 `static/vendor/css/fonts.css` 声明）。全局文字固定为四级像素字阶：24px 主标题、18px 区块/卡片标题、14px 正文与控件、12px 元数据/辅助说明/等宽信息，禁止使用 8–13px 或 15–17px 文字。生产版本必须改为本地字体与 Iconify Bundle；当前页面对 Google Fonts、Tailwind CDN 和 unpkg Lucide 的引用属于待整改项，不能宣称已完成离线交付。

网格与列表采用 24px 外边距、32px 区块间距、56px 行高；表格和可扫描列表使用 2% 透明度的偶数行斑马纹。

## 4. 页面职责

| 页面 | 当前职责 |
| --- | --- |
| `index` | 总览、遥测、导航、快速动作与上下文工作流 |
| `projects` | 项目筛选、视图切换、进度和任务队列 |
| `production` | 剧集、场次、监视器、时间线和镜头控制 |
| `agents` | 智能体矩阵、参数和模型运行状态 |
| `storyboard` | 分镜画布、镜头参数和序列动作 |
| `assets` | 资产库入口、筛选、详情、ACL 和 iframe 复用 |
| `collab` | 团队席位、资源锁和批注流 |
| `settings` | 工作区设置并嵌入 API/ComfyUI 设置 |
| `workshop` | 剧本、资产、分镜、视频四阶段制片流 |

## 5. 交互和数据边界

稳定关系使用 `project_id`、`entity_id`、`canvas_id`、`job_id`、`asset_id`，流水线编排可使用受控辅助键 `pipeline_id`。当前 v2 控制器仍有硬编码项目/剧集/成员/智能体、localStorage 回退和 Unsplash 图片，这些只能作为演示 fallback，不能当作生产数据。真实 API、任务中心、ACL、审计和可恢复性优先于视觉原型。所有状态同时提供文字或图标信号。浮窗目标遵循 `GW-UI-FW-01`；当前 workshop modal、reduced-motion/forced-colors 和外链资源仍待整改验证。

## 6. 覆盖与迁移

v2 硬件系统是本轮重构目标；根旧壳 16 页及 SIGNAL-FLOW 文档标为 `LEGACY/迁移中`。资产库 Stitch 和画布 Stitch 仅在登记页面做局部覆盖，不能创建第三套 token。首页内联设置与 settings iframe 暂时并存，后端配置为唯一持久真源。回滚应恢复页面级 CSS/入口接入，保留稳定 ID、API、权限和任务状态机。完整治理见根 [`UI-DESIGN-V2-BASELINE.md`](UI-DESIGN-V2-BASELINE.md) 与 [`DESIGN-SYSTEM-INDEX.md`](DESIGN-SYSTEM-INDEX.md)。
