# UI-DESIGN-V2-STITCH-TOKENS

> 状态：SUPPORTING；来源：合并 `stitch_skeuomorphic_black_gold_dashboard/{画布,画布内节点设计,排期,资产库}/DESIGN.md`（旧仓四份同源 Stitch 稿）；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

## 1. 说明

本文件由旧仓四份 Stitch 页面稿（画布、画布内节点设计、排期、资产库）的 `DESIGN.md` 合并提炼而成。四份来源内容完全同源（同一 token 集），差异仅在页面职责，故合并为一份。

- 仅保留色彩、字阶、圆角、间距等 token 与页面职责，供实现对照。
- 已丢弃全部截图引用、第三方设计工具来源描述与生成提示。
- 本文件 token 若与 `UI-DESIGN-V2-BASELINE.md`、`DESIGN-SYSTEM-INDEX.md` 冲突，以后两者为准；本文件仅作 Stitch 局部覆盖参考，不得另建第三套全局 token。

## 2. 色彩 Token

### 2.1 表面与底盘

| Token | 值 | 用途 |
| --- | --- | --- |
| `surface` | `#090a0d` | 曜石底盘主表面 |
| `surface-dim` | `#07080a` | 下沉暗面 |
| `surface-bright` | `#171920` | 高亮表面 |
| `surface-container-lowest` | `#040507` | 最深凹槽 |
| `surface-container-low` | `#0d0f15` | 低级容器 |
| `surface-container` | `#101217` | 面板暗底 |
| `surface-container-high` | `#141720` | 高级容器 |
| `surface-container-highest` | `#1a1d26` | 最高级容器 |
| `background` | `#121316` | 页面背景 |
| `surface-variant` | `#343538` | 表面变体 |

### 2.2 品牌与强调

| Token | 值 | 用途 |
| --- | --- | --- |
| `primary` | `#dfc384` | 主品牌香槟金 |
| `on-primary` | `#1a1308` | 主色上的文字 |
| `primary-container` | `#fae2c8` | 主色容器 |
| `secondary` | `#eddab3` | 次级浅香槟金 |
| `on-secondary` | `#101217` | 次级上的文字 |
| `secondary-container` | `#524528` | 次级容器 |
| `tertiary` | `#38bdf8` | 算力/当前青色 |
| `tertiary-container` | `#7ad0ff` | 青色容器 |
| `gold-dim` | `#947a57` | 阴影铜金 |
| `surface-tint` | `#dfc384` | 表面着色 |

### 2.3 描边、文字与语义

| Token | 值 | 用途 |
| --- | --- | --- |
| `outline` | `rgba(223, 195, 132, 0.2)` | 金色描边 |
| `outline-variant` | `rgba(255, 255, 255, 0.08)` | 弱描边 |
| `on-surface` | `#e3e2e6` | 主文字 |
| `on-surface-variant` | `#cfc5b5` | 次级文字 |
| `error` | `#ef4444` | 失败/高负荷 |
| `on-error` | `#ffffff` | 错误上的文字 |

> 语义色沿用基线：emerald 在线/完成、cyan 算力/当前、amber 排队/注意、rose 失败/高负荷、slate 归档。

## 3. 字阶 Token

字体统一为**思源黑体 Source Han Sans CN（Bold/Medium/Normal 三档，本地 `static/vendor/fonts/`，经 `static/vendor/css/fonts.css` 声明）**。

| Token | 字号 | 字重 | 行高 | 字距 | 用途 |
| --- | --- | --- | --- | --- | --- |
| `headline-xl` | 40px | 600 | 48px | -0.02em | 页面主标题 |
| `headline-xl-mobile` | 30px | 600 | 36px | -0.01em | 移动端主标题 |
| `headline-lg` | 28px | 600 | 36px | -0.01em | 大标题 |
| `headline-md` | 22px | 500 | 30px | — | 中标题 |
| `headline-sm` | 18px | 500 | 26px | — | 区块/卡片标题 |
| `body-lg` | 16px | 400 | 24px | — | 大正文 |
| `body-md` | 14px | 400 | 20px | — | 正文与控件 |
| `body-sm` | 12px | 400 | 18px | — | 元数据/辅助 |
| `label-lg` | 13px | 500 | 18px | 0.04em | 标签 |
| `label-md` | 11px | 500 | 16px | 0.06em | 小标签 |
| `label-sm` | 10px | 400 | 14px | 0.08em | 微标签 |

> 注：Stitch 稿的 10/11/13/16/22/28/30/40px 属于局部稿历史取值；生产实现以基线四级字阶 24/18/14/12px 为准，禁止新增 8–13px 或 15–17px 正文尺寸。

## 4. 圆角 Token

| Token | 值 |
| --- | --- |
| `rounded-sm` | 0.125rem |
| `rounded-DEFAULT` | 0.25rem |
| `rounded-md` | 0.375rem |
| `rounded-lg` | 0.5rem |
| `rounded-xl` | 0.75rem |
| `rounded-full` | 9999px |

## 5. 间距 Token

| Token | 值 | 用途 |
| --- | --- | --- |
| `gutter` | 1rem | 标准栏间距 |
| `gutter-mobile` | 0.75rem | 移动端栏间距 |
| `margin` | 1.5rem | 标准外边距 |
| `margin-mobile` | 1rem | 移动端外边距 |
| `space-xs` | 0.25rem | 最小间距 |
| `space-sm` | 0.5rem | 小间距 |
| `space-md` | 1rem | 中间距 |
| `space-lg` | 1.5rem | 大间距 |
| `space-xl` | 2.5rem | 最大间距 |

> 基线网格：24px 外边距、32px 区块间距、56px 内容行高；表格与可扫描列表使用 2% 透明度偶数行斑马纹。

## 6. 页面职责

| 页面 | 职责 | 主要组件 |
| --- | --- | --- |
| 画布（Canvas） | 分镜画布总览与工具带 | 工具带、故事板画格、缩放步进、参数检验舱 |
| 画布内节点设计（Node Design） | 画布内节点形态与连线规范 | 节点卡片、端口、连线、选中态 |
| 排期（Scheduling） | 项目排期与资源视图 | 时间轴、排期条、资源泳道、状态标签 |
| 资产库（Asset Vault） | 数字资产仓储与检视 | 检索与容量栏、资产网格、3D 视口检视舱 |

以上四个页面在旧仓中为局部覆盖范围，仅能复用本文件 token，不得创建第三套全局 token。
