# 拟物科技工作台完整设计系统与 UI 规范（0908 归档）

> 状态：ARCHIVED；来源：D:\Working\Code Pro\Gods-Workbench\temp\UI设计稿\拟物科技工作台-0908\docs\拟物科技工作台完整设计系统与UI规范文档.md；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

## 完整设计系统规范与全模块架构说明文档 (Design System & Architecture Specification)

> **版本**：v2.4.0 旗舰拟物稳定版  
> **设计语言**：曜石深黑 (Obsidian Chassis) · 香槟钛金 (Champagne Titanium) · 拟物硬件机架 (Skeuomorphic Hardware Deck)  
> **归档日期**：2026-09-08 / 2026-09-09  
> **归档目录**：`D:\Working\Code Pro\Gods-Workbench\temp\UI设计稿\拟物科技工作台-0908`

---

## 一、设计哲学与核心理念 (Design Philosophy)

### 1.1 风格定位
Gods' Workbench 是面向下一代影视动画与多模态 AI 制片的专业级工作台。视觉风格定位为**“现代旗舰拟物科技机架”**：
- **融合灵感**：顶级专业母带级音频工作台（Mastering Consoles）、高精航电座舱（Avionics Cockpit）以及工业级钛金控制台。
- **克制与真实**：摒弃泛滥且刺眼的扁平霓虹发光，追求真实硬件的物理微距倒角、物理按键背灯向下漫反射、金属凹槽嵌合度与触觉级反馈。
- **纯净沉浸**：滑杆、推子与进度条均严格采用无外部辉光的纯净机械轨道设计，减少杂光干扰，确保长时间专注作业时的视觉舒适度。

### 1.2 核心设计原则
1. **真实物理光学 (True Physical Optics)**：背光按键光晕符合真实背灯特性（向下面板衰减，上方无光害）；旋钮具有环形切槽高光与轴心立体感。
2. **第一性原理与 KISS (Keep It Simple, Stupid)**：以最纯粹的 CSS / SVG 矢量方式呈现复杂的机械质感，杜绝过度渲染和多余图层重叠。
3. **高信息密度与模块呼吸感**：在 1440x900 视口下整体保持 1.1 倍放大比例，信息呈现清晰锐利且不溢出视口。

---

## 二、色彩系统规范 (Design Tokens & Color Palette)

本系统采用采样于旗舰硬件的纯正香槟钛金色谱，彻底纠正了刺眼的高饱和黄色，呈现出沉稳典雅的暗金奢华质感。

### 2.1 基础架构色谱 (CSS Root Variables)

```css
:root {
  /* 沉稳黑曜石机架基底 */
  --chassis-bg: #090a0d;       /* 主机身底盘深黑 */
  --panel-dark: #101217;       /* 嵌槽面板暗底 */
  --card-start: #171920;       /* 拟物卡片渐变起始 */
  --card-end: #0f1115;         /* 拟物卡片渐变终点 */
  
  /* 纯正香槟钛金质感色谱 (已校准消除高饱和度黄) */
  --gold-flare: #fae2c8;       /* 倒角高光极亮金 */
  --gold-light: #eddab3;       /* 次级高光浅香槟金 */
  --gold-primary: #dfc384;     /* 主品牌香槟金 (Primary Gold) */
  --gold-medium: #c9ad6e;      /* 中阶反光金 */
  --gold-bronze: #947a57;      /* 阴影铜金色 */
  --gold-shadow: #6f654c;      /* 刻线深凹阴影 */
  --gold-dim: rgba(223, 195, 132, 0.16);  /* 极浅金色环境遮罩 */
  --gold-glow: rgba(223, 195, 132, 0.35); /* 柔和向下漫反射辉光 */
}
```

### 2.2 功能语义色 (Semantic Status Colors)

| 语义状态 | 色值 | 应用场景 |
|---|---|---|
| **Online / Active (在线/就绪)** | `#34d399` / `#10b981` (Emerald) | 系统通电指示灯、实时工作流正常流转节点 |
| **Compute / Neural (算力/神经网络)** | `#38bdf8` / `#22d3ee` (Cyan) | VRAM 显存监视、AI 模型激活、RAM 指针 |
| **Standby / Queued (待命/排期)** | `#f59e0b` / `#fbbf24` (Amber) | 队列等待、未完成场次、计划中幕次 |
| **Critical / High Load (高负荷/告警)** | `#ef4444` / `#f87171` (Rose) | VU 表 80-100% 红色警示刻度、阻塞节点 |
| **Archived (归档/封存)** | `#64748b` / `#94a3b8` (Slate) | 已发布工程、已冻结资产、非活动音轨 |

---

## 三、排版与字体系统 (Typography Hierarchy)

严格遵循三套专业级排版字体分工，满足工程数字化要求：

1. **英文字符与科技大标题**：思源黑体 Source Han Sans CN（Bold/Medium/Normal 三档，本地 `static/vendor/fonts/`，经 `static/vendor/css/fonts.css` 声明）, sans-serif (几何现代、稳健坚实)
2. **数据读数、时钟、参数、时间码**：思源黑体 Source Han Sans CN（Bold/Medium/Normal 三档，本地 `static/vendor/fonts/`，经 `static/vendor/css/fonts.css` 声明）, monospace (等宽、极高辨识度)
3. **正文字符与中文标签**：思源黑体 Source Han Sans CN（Bold/Medium/Normal 三档，本地 `static/vendor/fonts/`，经 `static/vendor/css/fonts.css` 声明）, -apple-system, BlinkMacSystemFont, sans-serif

### 字阶与行高规范

| 等级 | 字体大小 | 字重 | 适用场景 |
|---|---|---|---|
| **H1 品牌标** | 12px / 14px | Bold 800 (tracking-widest) | 机架标牌 `GODS' WORKBENCH` |
| **H2 面板题** | 12px | SemiBold 600 (tracking-wide) | 各模块主面板标题栏 |
| **H3 卡片题** | 11px / 12px | Bold 700 | 项目名、智能体名称、场次标题 |
| **Body 正文** | 10.5px / 11px | Regular 400 (leading-relaxed) | 控制台输出、提示词说明、审计日志 |
| **Data 读数** | 9px / 10px | Mono Bold 700 | 时钟、时间码、百分比、Token 吞吐 |
| **Tag 角标** | 7.5px / 8px | Mono SemiBold 600 | 格式标签 (GLTF, EXR, 4K)、节点编号 |

---

## 四、拟物硬件控件库与 CSS 规范 (Hardware Components)

### 4.1 顶栏双层拟物机架 (Master Telemetry Deck)
- **高度标准**：顶栏整体增高为 `h-24` (96px)，由上下两层构成：
  - **Upper Deck**：主电源开关、品牌徽标、Online 呼吸指示灯、日期铭牌、中央 24-Bus 引擎铭牌、右侧播控组合键与数字时钟。
  - **Lower Deck (`recessed-deck-slot`)**：背景透明度严格设为 `rgba(45, 49, 58, 0.50)` 灰色半透明微凹跑道，两侧分布导航胶囊按键、激光推子与拨码开关。
- **微距光感**：集成 4px OLED 亚像素点阵背景与顶栏底边微距环境光亮线 (`topbar-ambient-edge`)。

### 4.2 双梯形高精模拟 UV 电平表 (Dual Trapezoid UV Meters)
- **外观形态**：非规则倒角梯形暗金属描边框体，彻底解决多层错位乱线。
- **覆盖角度**：144° 宽视角展开（-72° 至 +72°），圆心对齐于 (74, 48)。
- **刻度系统**：细致刻度线与 80-100% 同心加粗红色过载报警弧线。
- **数字下沉**：0, 20, 40, 60, 80, 100 沿同心大半径展开，中央底部半圆金属枢纽直接容纳大字号当前百分比（如 `42%`, `68%`）。
- **矢量表针**：采用微锥形矢量多边形 `<polygon>` 解决渐变透明渲染 Bug，搭载自然随机扰动模拟硬件指针律动。

### 4.3 背灯长圆胶囊按键 (Backlit Pill Capsules)
- **激活态 (`pill-capsule-active`)**：
  - 核心采用径向漫射高光：`radial-gradient(ellipse 75% 65% at 50% 50%, #ffffff, #fff2dc, #f5cf92, #dfac64, #b8823f)`。
  - **背灯辉光向下投射**：投影集中于下方 `0 8px 20px 1px rgba(223, 195, 132, 0.65)` 与 `0 14px 28px 2px rgba(186, 147, 91, 0.42)`，模拟真实有背光芯片透光时的向下漫反射，按键上方保持洁净无杂光。
- **待命态 (`pill-capsule-inactive`)**：
  - 采用沉稳暗色金属拉丝质感，悬停时边框呈现微金反光。

### 4.4 纯净机械滑杆与推子 (Clean Mechanical Faders & Sliders)
- **最新改动规范**：彻底移除外部漫射光晕 (`box-shadow: none`)。
- **轨道标准 (`hw-fader-track-horizontal`)**：沉底内凹微凹槽，配合纯色渐变填充条，边缘清晰平滑。
- **3D 抓手 (`hw-fader-thumb-3d`)**：金属磨砂矩形滑块，带中央定位刻线。

### 4.5 彩虹环形 AI 微球发射按钮 (Prismatic Launch Orb)
- **形态标准**：圆环形 AI 智能体核心点火键，参考现代前沿 AI 棱镜光效。
- **外环光效**：采用 `conic-gradient` 呈现青色、紫色、琥珀色、粉色动态彩虹环，边缘带多重轻量光晕。
- **内部核心**：深黑吸光内胆，中央微球带径向呼吸渐变与浮动微动反馈。

### 4.6 上下文工作流总线树 (Workflow Bus Tree)
- **总线干线**：左侧 1.5px 纵向渐变香槟金主总线。
- **正交支线**：每个子节点向左延伸正交支线，交界处嵌入香槟金色微小发光触点 (`card-connector-pin`)。
- **四级悬浮抽屉 (`tree-flyout-panel`)**：超过三级节点点击后向右弹出高斯模糊半透明工作台，呈现更细化的微调操作卡片。

---

## 五、全模块页面架构体系 (7 大功能模块)

每个页面均作为独立完整的静态 HTML 原型存在，可在浏览器中双击直接运行，顶栏导航胶囊均已建立相互跳转。

```
                       [ 首页 · 控制台 ]
                    preview-brand-new-version-2.html
                                │
   ┌───────────────┬────────────┴──┬─────────────┬─────────────┐
   ▼               ▼               ▼             ▼             ▼
[项目中心]       [剧集制片]      [智能体]      [分镜画布]     [资产库]      [协作]
projects        production      agents       storyboard     assets       collab
```

### 1. 首页 · 控制台 (`preview-brand-new-version-2.html`)
- **定位**：系统主仪表盘与日常任务调度入口。
- **主要内容**：
  - 左列：最近项目卡片、资产仓储概览仪表盘、排他协作状态开关。
  - 中列：旗舰级智能体对话机舱、彩虹 AI 微球发射栏、提示词快捷芯片。
  - 右列：工作流实时动态流水、下一步行动指令步进键、大型多环 AIICOMP 压限调音旋钮与快速立项按键。

### 2. 项目中心 (`preview-v2-projects.html`)
- **定位**：全周期影视项目的矩阵式管控与 GPU 集群算力分配。
- **主要内容**：
  - 顶部嵌槽搜索栏、[全部/制作中/渲染中/待审阅/已归档] 状态胶囊、视图模式切换。
  - 8K ACEScg 院线长片大卡片：剧本、分镜、渲染三级进度条、优先级旋钮。
  - 右侧 4 节点 GPU 集群监控卡片（RTX 4090 / A100 温控与负载）、渲染任务批处理队列。

### 3. 剧集制片 (`preview-v2-production.html`)
- **定位**：多集连续剧单集深入制作与非编导演工坊。
- **主要内容**：
  - 左侧场次镜头目录树（EP01-EP04 快速切换，场次时长与状态指示）。
  - **4K 导演监视屏 (2.39:1 CINEMA)**：高精时间码 `00:14:28:12`、音频动态电平指示条、飞梭转盘 (Jog Shuttle) 与全套走带按键。
  - **多轨非编时间线 (NLE Multi-Track)**：V1 画面、A1 声画 SyncLip 语音同步、FX 提示词滤镜轨。
  - 镜头运镜旋钮组（Dolly-In, Pan-X, Roll-Z）与单镜点火发射微球。

### 4. 智能体 (`preview-v2-agents.html`)
- **定位**：多模态 AI 智能体机架运维与神经网络参数实时调谐。
- **主要内容**：
  - 机架式智能体模块（AURA 核心脑、FLUX 视觉原画、SCRIPT 剧本、VOX 拟声）。
  - **AURA 神经核调试舱**：Temperature (0.72)、Top-P (0.92)、CFG Scale (7.5) 三大调音旋钮、上下文内存驻留推子、交互式 Token 输出视口。
  - **LoRA 硬件插线板 (Patch Bay)**：4 组拟物音频插孔式插线板，支持赛博装甲、钛金光影等权重即插即用，配备显存过载熔断滑动开关。

### 5. 分镜画布 (`preview-v2-storyboard.html`)
- **定位**：视觉故事板电影级连环画格编排与一致性校验。
- **主要内容**：
  - 顶部画布工具带（指针选择、平移、切分画框、提示词锚点、深度图提取、100% 缩放步进翘板）。
  - **6 组 2.39:1 电影宽画幅故事板连环画格**：雨夜全景、暗室潜入、电弧特写等，带景别标签与时长芯片。
  - 镜头参数检验舱：角色面容锁定计 (98.6%)、虚化 (BOKEH) / 胶片颗粒 (GRAIN) / 镜头光斑 (FLARE) 拟物旋钮、全序列 4K 批渲染点火台。

### 6. 资产库 (`preview-v2-assets.html`)
- **定位**：三维数字资产、无损音频与风格权重的专业仓储金库。
- **主要内容**：
  - RAID-06 存储池容量指示（3.84 TB / 10 TB 状态）。
  - 涵盖 GLTF 3D模型（1.4M面）、Safetensors LoRA权重、8K HDR EXR贴图、FBX骨骼道具、24-bit 无损 WAV 音效、ACEScg 3D LUT 卡片。
  - **3D 视口检视舱**：实时 3D 渲染检查箱、旋转模拟旋钮、跨工程依赖引用拓扑树（Referenced by）。

### 7. 协作 (`preview-v2-collab.html`)
- **定位**：多席位团队实时排他协同与审片批注仲裁。
- **主要内容**：
  - 4 个团队成员拟物机架席位（主机 admin、美术总监、总导演、AI 渲染守护进程，带 0ms/14ms/22ms 实时延迟）。
  - **工程资源排他锁看板**：分镜 SH_03 独占租约倒计时、AURA 参数锁释放、时间线轨申请锁。
  - 团队审片实时动态流（时间戳审片批注、即时沟通输入框与彩虹发射微球）与 AES-256 P2P 加密隧道监控。

---

## 六、视口与响应式控制规范 (Viewport & Scaling)

为了保证工业级硬件机架的信息密度与微距纹理在笔记本及主流显示器上均能完美呈现：
- **全局缩放比例**：
  ```css
  body {
    zoom: 1.1;
    width: calc(100vw / 1.1);
    height: calc(100vh / 1.1);
    overflow: hidden;
  }
  ```
- **纵向紧凑设计 (Compact Vertical Alignment)**：
  - 侧边栏与主工作台均使用 `min-h-0` 和 `overflow-y-auto`，确保即便在 768p / 900p / 1080p 屏幕下，底部管理员信息栏、播放底座以及右下角操作点火台均完全可见，不发生窗口截断。

---

## 七、设计文件交付与归档清单 (Deliverable Assets)

所有产物均完整归档至：
`D:\Working\Code Pro\Gods-Workbench\temp\UI设计稿\拟物科技工作台-0908\`

```
拟物科技工作台-0908/
├── preview-brand-new-version-2.html  # 【终版】首页·控制台原型
├── preview-v2-projects.html          # 【终版】项目中心独立页
├── preview-v2-production.html        # 【终版】剧集制片独立页
├── preview-v2-agents.html            # 【终版】智能体独立页
├── preview-v2-storyboard.html        # 【终版】分镜画布独立页
├── preview-v2-assets.html            # 【终版】资产库独立页
├── preview-v2-collab.html            # 【终版】协作独立页
├── preview-brand-new-version-1.html  # 对照方案 1 历史存档
├── README.md                         # 快速查阅总索引
├── walkthrough.md                    # 迭代优化全景文档
├── docs/                             # 本文档及各子规范文档
├── html/                             # 全部 10 个 HTML 原型备份
├── screenshots/                      # 45 张高精验证截图
├── scripts/                          # 页面生成器与自动化验证脚本
└── references/                       # 21 张设计需求参考素材
```

---
*Gods' Workbench Design System · Built with Precision & Craftsmanship*
