# 曜石香槟金拟物科技工作台 · 迭代走查记录

> 状态：SUPPORTING；来源：D:\Working\Code Pro\Gods-Workbench\temp\UI设计稿\拟物科技工作台-0908\walkthrough.md；迁移日期：2026-09-17；洁净室切片迁移（经解耦审查）。

严格遵循用户指示：
> “按当前风格样式(`src/gods_workbench/static/preview-brand-new-version-2.html`)生成其他每一页”
> “不要直接改原项目代码啊，先独立生成单独文件”

已为 Gods-Workbench 顶栏 6 大核心功能导航完整构建并独立生成了 6 套高保真拟物 HTML 文件，原文件 [`preview-brand-new-version-2.html`]() 保持完全独立未改动。

---

## 📸 全页面渲染截图一览

---

## 🗂️ 独立生成页面文件清单与访问链接

| 序号 | 模块名称 | 独立文件路径 | 本地实时预览链接 |
|:---:|:---|:---|:---|
| 0 | 首页 · 控制台 (底模基准) | `src/gods_workbench/static/preview-brand-new-version-2.html` | `src/gods_workbench/static/preview-brand-new-version-2.html` |
| 1 | **项目中心** | `src/gods_workbench/static/preview-v2-projects.html` | `src/gods_workbench/static/preview-v2-projects.html` |
| 2 | **剧集制片** | `src/gods_workbench/static/preview-v2-production.html` | `src/gods_workbench/static/preview-v2-production.html` |
| 3 | **智能体** | `src/gods_workbench/static/preview-v2-agents.html` | `src/gods_workbench/static/preview-v2-agents.html` |
| 4 | **分镜画布** | `src/gods_workbench/static/preview-v2-storyboard.html` | `src/gods_workbench/static/preview-v2-storyboard.html` |
| 5 | **资产库** | `src/gods_workbench/static/preview-v2-assets.html` | `src/gods_workbench/static/preview-v2-assets.html` |
| 6 | **协作** | `src/gods_workbench/static/preview-v2-collab.html` | `src/gods_workbench/static/preview-v2-collab.html` |

---

## 🛠️ 各页面拟物架构与核心设计亮点

### 1. 项目中心 (`preview-v2-projects.html`)
- **顶栏交互**：`项目中心` 胶囊背灯激活高亮（辉光向下），其余待命暗金属。
- **左侧工作流**：项目工程总线树，支持主视觉长片、短剧矩阵、概念PV层级分类。
- **主工作台**：
  - 拟物搜索框、分类筛选胶囊、[网格/列表/甘特图] 三段分段按键、触感“新建项目”按键。
  - 院线长片与连续剧大卡片：附带电影胶卷徽标、ACEScg 标签、多轨激光发光推子（剧本、分镜、渲染三级进度）、拟物优先级物理旋钮。
  - 右侧配备 GPU 算力集群实时监控（4x 节点负载、温控与 VRAM 旋钮）、渲染流水线队列与彩虹 AI 发射微球。

### 2. 剧集制片 (`preview-v2-production.html`)
- **左侧工作流**：剧集场次镜头总线（S01E01 ~ S01E04、场次、镜头直观树状关联）。
- **主工作台**：
  - **场次与镜头序列坞**：EP01-EP04 拟物微动切换，场次完成度微型激光推子。
  - **4K 导演主参考监视屏 (2.39:1 CINEMA)**：高精宽银幕构图网格、实时时间码 `00:14:28:12`、音频动态电平指示条、飞梭转盘 (Jog Shuttle) 与全套走带物理按键。
  - **多轨非编时间线 (NLE Multi-Track)**：V1 画面轨、A1 台词与 SyncLip 语音同步轨、FX 提示词与滤镜轨。
  - **运镜参数台**：焦距/光圈/运镜轨迹（推拉 Dolly-In、摇移 Pan-X、翻转 Roll-Z）三组刻度旋钮与单镜点火发射微球。

### 3. 智能体 (`preview-v2-agents.html`)
- **左侧工作流**：神经网络智能体拓扑总线（AURA 核心、FLUX 视觉、CLAUDE 剧本、VOX 声音）。
- **主工作台**：
  - **机架式智能体模块矩阵**：在线状态绿灯、显存占用、响应延迟、Steps 步数与调用计数。
  - **AURA 神经核参数调试舱**：三大拟物调谐旋钮（温度 Temperature 0.72、Top-P 0.92、CFG Scale 7.5）、上下文驻留激光推子、实时响应流预览与彩虹发射微球。
  - **LoRA 矩阵硬件插线板 (Patch Bay)**：4 组拟物音频插孔式插线板（赛博装甲、钛金光感、瞳孔电弧等权重插接）、显存硬熔断滑动开关与模型热替换按键。

### 4. 分镜画布 (`preview-v2-storyboard.html`)
- **左侧工作流**：分镜幕次总线（第1幕序曲、第2幕交锋、第3幕湮灭）。
- **主工作台**：
  - **画布控制工具带**：选择、画框拖拽、切分、提示词锚点、深度图提取、缩放步进翘板与工程导出按键。
  - **分镜故事板连环画格 (2.39:1 宽画幅)**：6 组电影画框（远景雨夜、中景潜入、特写电弧、俯拍光网等），带时长胶囊、提示词反推、局部重绘按键。
  - **分镜参数与一致性检查舱**：角色面容一致性锁定计（98.6%）、虚化/噪点/光斑微调旋钮、全序列 4K 批渲染彩虹发射微球。

### 5. 资产库 (`preview-v2-assets.html`)
- **左侧工作流**：数字资产仓储总线（角色、场景、机械道具、96kHz 音效、LUT 预设）。
- **主工作台**：
  - **仓储检索与容量栏**：多标签分类、RAID-06 存储池容量指示（3.84 TB / 10 TB）、导入新资产。
  - **资产陈列网格**：GLTF 3D模型、Safetensors LoRA权重、8K HDR EXR贴图、FBX骨骼道具、24-bit 无损 WAV 音效、ACEScg 3D LUT 预设卡片。
  - **3D 模型视口检视舱**：实时 3D 渲染检查箱、旋转模拟旋钮、跨项目依赖引用拓扑树（Referenced by）、存储健康校验。

### 6. 协作 (`preview-v2-collab.html`)
- **左侧工作流**：协同会话与权限总线（主制片、美术总监、总导演、AI 守护进程）。
- **主工作台**：
  - **在线席位机架**：4 席位在线指示灯、独占锁定标签、端到端延迟（0ms, 14ms, 22ms）。
  - **工程资源排他锁看板**：分镜 SH_03 独占倒计时、AURA 参数锁释放、时间线轨申请锁。
  - **团队审片实时动态流**：时间戳审片批注、导演与美术即时沟通记录、批复彩虹发射微球。
  - **协作网关与安全**：AES-256 GCM 加密隧道、WebRTC 直连状态、全局紧急解锁滑动开关、协同快照打包。

---

## 🔗 顶栏跨页面无缝互联

所有新生成的 6 个页面以及首页均在顶栏导航胶囊中配置了互相直链：
- 点击【首页 · 控制台】直达 `preview-brand-new-version-2.html`
- 点击【项目中心】直达 `preview-v2-projects.html`
- 点击【剧集制片】直达 `preview-v2-production.html`
- 点击【智能体】直达 `preview-v2-agents.html`
- 点击【分镜画布】直达 `preview-v2-storyboard.html`
- 点击【资产库】直达 `preview-v2-assets.html`
- 点击【协作】直达 `preview-v2-collab.html`
可在本地浏览器中随意点击任意胶囊无缝畅游全部 7 大模块。
