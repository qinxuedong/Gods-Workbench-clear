# Tailwind 静态快照「重生成是否造成可见视觉变更」判定证据（2026-09-23）

> **执行主体**：主代理（本仓内执行，**非**外部第三方）。本文件只登记**可复现的渲染实测**。
> **代码基线**：`a81a6eb4e1acadd2309215bedc537bb737e26670`（工作树干净）。提交本文件后 SHA 随之变化。
> **上位口径**：`AGENTS.md`、`CLEANROOM-STATUS.md`、`HANDOFF-10.md`、`docs/governance/TASKS.md`。

---

## 1. 为什么需要这一项（把「规则级差异」与「视觉变更」分开）

`HANDOFF-10.md` §2.4 登记：用当前源码重新生成快照，规则级口径为
**现有 1014 个选择器 / 重生成 945 个；共有 624、移除 390、新增 321**，正文逐字节一致 = `False`。
据此当时的结论是「重新生成会造成可见视觉变更，须人工裁决」。

**但这个推论不成立**，因为规则级差异 ≠ 视觉变更，共两类假阳性来源：

| 来源 | 机理 | 是否影响渲染 |
|---|---|---|
| 陈旧规则残留 | 快照是历史累积产物，含源码已不再引用的规则（如 `.accent-black`、`.aspect-[4/3]`） | **否**——没有任何元素在用 |
| 运行时 JIT 补齐 | 页面同时加载自托管 Tailwind 运行时（`vendor/js/tailwindcss-cdn.js`），arbitrary 类由运行时现算 | **否**——样式来自运行时，不依赖快照 |

因此必须**在真实浏览器里逐元素比对 computed style** 才能下结论。本项即补齐该判定。

### 1.1 先证伪「arbitrary 类缺失 = 视觉缺陷」这一假设

源码中 371 个 arbitrary 类里，有 **251 个在现有快照中没有对应规则**（如 `bg-[#050609]`、
`backdrop-blur-[2px]`、`bg-[#181c26]`）。看起来像大面积样式缺失，实测**全部不是缺陷**：

| 消费面 | 是否加载自托管 Tailwind 运行时 | arbitrary 类样式来源 |
|---|---|---|
| `v2/*.html` 9 页 | **是**（`<script src="/static/vendor/js/tailwindcss-cdn.js?v=3.4.17">`） | 运行时 JIT，与快照无关 |
| `episode-pipeline.html` | **是**（同 CDN + 内联 `tailwind-config`） | 运行时 JIT，与快照无关 |
| `api-settings.html`、`canvas-list.html` | 否（**只**用静态快照） | 这两页源码中 arbitrary 类实际用了 **0** 个（缺规则的类一个都不在上面） |

判定命令（只读，纯静态扫描）：对两个纯快照页，取其 HTML + 其 `<script src>` 引用的本地 JS 类名集合，
再剔除这两页自有 CSS 中已定义的类名，剩余 `UNKNOWN` 均为**非 Tailwind 的自定义类名或模板片段**
（如 `api-standard-key-row`、`studio-scale-viewport`、`tone`、`+`、`||`），**没有一个是 Tailwind 工具类**。
浏览器侧交叉验证一致：这两页 DOM 上出现的类中，会被重生成删除的类为 **0**。

---

## 2. 新判定工具

`tools/tailwind_snapshot_visual_equiv.py`（中文注释；**未接入 CI**——CI 不安装 Playwright，属本地/人工门禁）。

### 2.1 判定口径（刻意写成机械、可复现）

1. 在内存中重新生成快照（等价于 `--force` 会写入的内容），**不写盘**；
2. 用 Playwright 路由拦截，把该内容注入受检页面对 `tailwind-utilities.css` 的请求；
3. 逐元素（按 `tagName + className` 配对）比对 **computed style**，覆盖 41 个布局/配色/排版/装饰属性；
4. **默认排除 CSS 动画采样属性** `transform` / `opacity` / `filter`——它们是时间函数，
   **同一份 CSS** 前后两次加载也会不同，计入即制造假阳性；
5. **内置对照组（fail-closed）**：先跑「baseline vs baseline」。对照组一旦出现差异，
   说明本机采样口径不可靠，工具**直接失败并作废实验组结论**。

### 2.2 退出码

| 退出码 | 含义 |
|---|---|
| `0` | 对照组零噪声 **且** 实验组零 computed 差异 → **视觉等价**，可安全覆盖（仍需人工授权 `--force`） |
| `1` | 对照组零噪声，但实验组有 computed 差异 → **可见视觉变更**，须人工裁决 |
| `2` | 对照组出现噪声 → 本机口径不可靠，**结论作废**（fail-closed） |

### 2.3 复现命令

```powershell
# 全量（12 页：v2 壳层 9 页 + api-settings + canvas-list + episode-pipeline）
python -P tools/tailwind_snapshot_visual_equiv.py --serve

# 或用已在运行的 2077 服务
python -P tools/tailwind_snapshot_visual_equiv.py --base-url http://127.0.0.1:2077

# 复现假阳性（证明动画属性确实是非确定性来源）
python -P tools/tailwind_snapshot_visual_equiv.py --serve --pages v2/index.html --keep-animation-props
```

产物（JSON 报告）**只落系统临时目录**；脚本对指向仓库静态目录的输出路径直接拒绝（`AGENTS.md` §1.2）。

---

## 3. 实测结果（基线 `a81a6eb`，本机真实 Chrome，1600×1000）

### 3.1 对照组（baseline vs baseline，同一份 CSS 加载两次）

```
[equiv] 第 1 步：对照组（baseline vs baseline，同一份 CSS 加载两次）
    v2/index.html            元素 696   噪声差异 0
    v2/projects.html         元素 523   噪声差异 0
    v2/production.html       元素 380   噪声差异 0
    v2/workshop.html         元素 220   噪声差异 0
    v2/storyboard.html       元素 283   噪声差异 0
    v2/agents.html           元素 198   噪声差异 0
    v2/settings.html         元素 324   噪声差异 0
    v2/assets.html           元素 144   噪声差异 0
    v2/collab.html           元素 192   噪声差异 0
    api-settings.html        元素 264   噪声差异 0
    canvas-list.html         元素 130   噪声差异 0
    episode-pipeline.html    元素  54   噪声差异 0
```

### 3.2 实验组（现有快照 vs 内存重生成）

```
[equiv] 对照组零噪声，口径可靠。
[equiv] 第 2 步：实验组（现有快照 vs 内存重生成）
    v2/index.html            元素 696   computed 差异 0
    v2/projects.html         元素 523   computed 差异 0
    v2/production.html       元素 380   computed 差异 0
    v2/workshop.html         元素 220   computed 差异 0
    v2/storyboard.html       元素 283   computed 差异 0
    v2/agents.html           元素 198   computed 差异 0
    v2/settings.html         元素 324   computed 差异 0
    v2/assets.html           元素 144   computed 差异 0
    v2/collab.html           元素 192   computed 差异 0
    api-settings.html        元素 264   computed 差异 0
    canvas-list.html         元素 130   computed 差异 0
    episode-pipeline.html    元素  54   computed 差异 0

[equiv] 合计：元素 3408 个，computed 差异 0 处
[equiv] 判定：重生成为「视觉等价」——可安全覆盖（仍需人工授权 --force）。
EXIT=0
```

**结论**：在 `tags/class 配对 + 排除动画属性` 的口径下，按当前源码重新生成快照，
**12 页共 3408 个元素的 computed style 零差异**。先前「会造成可见视觉变更」的判断是**规则级差异的误读**，已更正。

### 3.3 假阳性来源的证伪（证明 §3.2 的零差异不是口径太松）

若把动画属性计回比对（`--keep-animation-props`），**同一份 CSS** 的对照组立刻出现噪声：

```
[equiv] 第 1 步：对照组（baseline vs baseline，同一份 CSS 加载两次）
    v2/index.html            元素 696   噪声差异 7
[equiv] 判定：口径不可靠 —— 对照组出现 7 处噪声，退出码 2。
EXIT=2
```

逐条核对：这 7 处差异的属性全部是 `transform` 或 `opacity`，元素类名均为动画载体
（`animate-ping`、`animate-pulse`、`bg-gradient-to-r` 光晕、`hw-avatar-keycap-status` 呼吸灯）。
即——**在 CSS 完全相同的条件下也会出现**，属采样噪声，与快照内容无关。

这同时构成**变异自证**：本工具的对照组守卫**确实能失败**，§3.2 的 `EXIT=0` 不是恒真产物。

---

## 4. 边界声明（**不得越读**）

- 本项判定的是**计算样式等价**，**不是**像素级截图比对，也**不是**视觉回归基线。
  响应式断点（仅 1600×1000 视口）、伪元素（`::before`/`::after`）、
  `:hover`/`:focus`/`:active` 等交互态样式、非 DOM 内容（Canvas/WebGL/SVG 内部渲染）**均未覆盖**。
- 本项**不代表**快照已重生成。**重生成动作本轮未执行**——它是写盘覆盖既有视觉基线的操作，
  按 `AGENTS.md` §5 属破坏性操作，须人工明确确认后才可 `--force`。
- 本机实测 ≠ 远端 CI（本脚本不入 CI，CI 不安装 Playwright）≠ 生产验收 ≠ 发布授权。
- 执行主体为主代理，**不等于**外部第三方独立审计。

---

## 5. 对本项裁决的建议

基于 §3.2：**重新生成为视觉等价**（该判定仅在此口径与视口下成立，见 §4 边界）。
可选处置（须人工裁决其一）：

| 选项 | 效果 | 代价 |
|---|---|---|
| **A. 保持现状，不重生成** | 快照继续含 389 个死规则；`--check` 持续返回 `1`（属预期，非回归） | 快照与源码长期脱节，可复现性缺口保留 |
| **B. 执行 `--force` 重生成** | 快照与源码对齐；`--check` 转为 `0`；已实测视觉等价 | 覆盖既有制品，事后不可从仓库内容直接追溯「删了什么」 |

若选 **B**，建议在同一提交内一并落入：重生成后的新 SHA-256、
`--diff`（规则级前后计数）、本文件 §3.2 的 computed 零差异读数，作为该次视觉变更的证据链。
