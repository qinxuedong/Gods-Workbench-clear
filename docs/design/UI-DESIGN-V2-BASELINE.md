# Gods' Workbench 设计规范基线

> 状态：CURRENT；来源：D:\Working\Code Pro\Gods-Workbench\DESIGN.md；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

> 状态：`CURRENT`；版本：v3.0（2026-09-16）。治理入口：[`DESIGN-SYSTEM-INDEX.md`](DESIGN-SYSTEM-INDEX.md)。

## 当前基线

当前重构以 `static/v2/` 的拟物科技工作台为主视觉系统：曜石深黑底盘、香槟钛金硬件层、双层遥测顶栏、UV 表、总线树、机械推子和受控光效。v2 当前包含 `index`、`projects`、`production`、`agents`、`storyboard`、`assets`、`collab`、`settings`、`workshop` 九个入口；其中资产和设置部分通过 iframe 复用现有页面，影视工坊提供剧本→资产→分镜→视频四步流程。旧 `PAGE_IDS` 16 页壳层和 SIGNAL-FLOW graphite 规范保留作兼容参考，不得覆盖 v2 主视觉。

事实来源依次为：当前页面 HTML/JS、`static/css/hardware-design-system.css`、专项接入记录、本文档和索引。v2 控制器目前仍含硬编码项目/剧集/成员/智能体 fallback、localStorage 回退和 Unsplash 远程图片；这些是演示数据与整改项，不得冒充生产真实数据。

## Token 与字体

硬件系统核心色：`--chassis-bg #090a0d`、`--panel-dark #101217`、`--card-start #171920`、`--card-end #0f1115`、`--gold-primary #dfc384`、`--gold-light #eddab3`、`--gold-bronze #947a57`、`--gold-shadow #6f654c`；语义色为 emerald（在线/完成）、cyan（算力/当前）、amber（排队/注意）、rose（失败/高负荷）、slate（归档）。

页面不得继续使用外链字体或图标 CDN；生产接入应使用仓库内自托管字体与 Iconify Bundle。字体统一为 思源黑体 Source Han Sans CN（Bold/Medium/Normal 三档，本地 `static/vendor/fonts/`，经 `static/vendor/css/fonts.css` 声明），用于英文、中文、时间码、ID、参数与日志。全局只允许四级像素字阶：24px（页面/主标题）、18px（区块/卡片标题）、14px（正文、按钮、表单和状态）、12px（元数据、辅助说明和等宽信息）。不得新增 8–13px 或 15–17px 的文字尺寸；图标尺寸不属于字阶。字号须保证正文、焦点和状态在 200% 缩放下可读。

全局网格采用 24px 外边距和 32px 区块间距；内容列表行高固定为 56px。表格和可扫描列表使用二级斑马纹（偶数行使用 2% 透明度的表面层），不以额外彩色边条表达分组。

## 组件与布局

顶栏以当前实现为准，基准高度约 116px，包含 upper deck 与 recessed lower deck；不得继续宣称 96px 或全局 `zoom:1.1`。机械控件可使用倒角、金属渐变、局部阴影和无外部辉光推子，但必须有清晰边界、静态尺寸和纯色降级。彩虹 launch orb 仅作为 AI 触发控件，不能承担权限或任务状态真源。桌面多栏在窄屏折叠为单栏；局部表格/画布可滚动，整页不得横向溢出。

资产页以真实资产中心 iframe、筛选/详情/权限和稳定 `asset_id` 为准；画布总览和资产库 Stitch 只在登记范围内做局部覆盖。设置页的 iframe 与首页内联设置入口当前并存，迁移完成前以后端配置真源为准，禁止新增第二份持久状态。

## 交互、安全与状态

所有实体关系使用 `project_id`、`entity_id`、`canvas_id`、`job_id`、`asset_id`；流水线编排可使用受控辅助键 `pipeline_id`，不得以文件名、路径、截图或 URL 猜测关系。保留真实 API、任务中心、ACL、审计和可恢复性。组件覆盖 loading、empty、error、success、queued、failed、archived、read-only，并以文字/图标辅助颜色。

浮窗目标遵循 `GW-UI-FW-01`：显式关闭、最上层 Escape、外部点击关闭、焦点闭环与返还、嵌套后进先出；未保存或破坏性状态必须确认。当前 workshop modal、全局 reduced-motion/forced-colors 和 CDN/远程图片整改尚未全量验证，不能宣称门禁已完成。

## 规范路由

详细治理、优先级、覆盖范围、验证和回滚见 [`DESIGN-SYSTEM-INDEX.md`](DESIGN-SYSTEM-INDEX.md)；工程实践见 [`UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md`](UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md)；SIGNAL-FLOW 仅作为 legacy/共享语义参考，见 `SIGNAL-FLOW-16-PAGE-DESIGN-SPEC.md`（旧壳规范，未随本次迁移入库）。
