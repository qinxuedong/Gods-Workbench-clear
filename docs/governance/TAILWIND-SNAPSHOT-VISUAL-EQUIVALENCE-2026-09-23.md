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

0. **判别力闸门（fail-closed，第 0 步）**：逐页把快照整体置空后重新加载。
   若该页 computed 差异仍为 `0`，说明**该页并不消费本地快照**（其 Tailwind 样式来自页面自带的
   自托管运行时 JIT，或该页根本不引用快照），该页**不纳入分母**。
   若没有任何页面具备判别力，工具直接退出码 `2`，本次结论作废。
   （**为什么必须加这一步**：把无判别力的页面计入分母，会把「零差异」放大成虚假可信度。）
1. 在内存中重新生成快照（等价于 `--force` 会写入的内容），**不写盘**；
2. 用 Playwright 路由拦截，把该内容注入受检页面对 `tailwind-utilities.css` 的请求；
3. 逐元素（按 `tagName + className` 配对）比对 **computed style**，覆盖 41 个布局/配色/排版/装饰属性；
4. **默认排除 CSS 动画采样属性** `transform` / `opacity` / `filter`——它们是时间函数，
   **同一份 CSS** 前后两次加载也会不同，计入即制造假阳性；
5. **内置对照组（fail-closed）**：先跑「baseline vs baseline」。对照组一旦出现差异，
   说明本机采样口径不可靠，工具**直接失败并作废实验组结论**；
6. **变异自证（可选，`--mutation-selftest`）**：在具备判别力的页面上，删掉「该页运行时真实使用」
   的全部单类规则后重新注入，要求 computed 差异 **> 0**；否则退出码 `2`。
   这一步证明本口径**不是恒真**（即证明「零差异」是可靠读数，而非工具失效）。

### 2.2 退出码

| 退出码 | 含义 |
|---|---|
| `0` | 判别力闸门通过 **且** 对照组零噪声 **且** 实验组零 computed 差异 → **视觉等价**，可安全覆盖（仍需人工授权 `--force`） |
| `1` | 判别力闸门通过、对照组零噪声，但实验组有 computed 差异 → **可见视觉变更**，须人工裁决 |
| `2` | 无页面具判别力 **/** 对照组出现噪声 **/** 变异自证失败 → **结论作废**（fail-closed） |

### 2.3 复现命令

```powershell
# 全量（12 页：v2 壳层 9 页 + api-settings + canvas-list + episode-pipeline）
python -P tools/tailwind_snapshot_visual_equiv.py --serve --mutation-selftest

# 或用已在运行的 2077 服务
python -P tools/tailwind_snapshot_visual_equiv.py --base-url http://127.0.0.1:2077 --mutation-selftest

# 复现假阳性（证明动画属性确实是非确定性来源）
python -P tools/tailwind_snapshot_visual_equiv.py --serve --pages v2/index.html,api-settings.html,canvas-list.html --keep-animation-props
```

产物（JSON 报告）**只落系统临时目录**；脚本对指向仓库静态目录的输出路径直接拒绝（`AGENTS.md` §1.2）。

---

## 3. 实测结果（基线 `a81a6eb`，本机真实 Chrome，1600×1000）

### 3.1 第 0 步：判别力闸门（**这一步推翻了旧版 §3 的分母**）

```
[equiv] 第 0 步：页面判别力闸门（置空快照，要求出现 computed 差异）
    v2/index.html            置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/projects.html         置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/production.html       置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/workshop.html         置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/storyboard.html       置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/agents.html           置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/settings.html         置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/assets.html           置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    v2/collab.html           置空差异 0      -> 无判别力，排除（该页不消费本地快照）
    api-settings.html        置空差异 256    -> 有判别力，纳入判定
    canvas-list.html         置空差异 122    -> 有判别力，纳入判定
    episode-pipeline.html    置空差异 0      -> 无判别力，排除（该页不消费本地快照）
[equiv] 判别力闸门通过：2/12 页纳入判定（api-settings.html，canvas-list.html）
```

**只有 2 页具备判别力**：`api-settings.html`、`canvas-list.html`。
这 2 页正是**只依赖静态快照**、不加载自托管 Tailwind 运行时的页面（与 §1.1 的静态扫描结论一致）。

### 3.2 对照组（baseline vs baseline，同一份 CSS 加载两次）

```
[equiv] 第 1 步：对照组（baseline vs baseline，同一份 CSS 加载两次）
    12 页全部 噪声差异 0
[equiv] 对照组零噪声，口径可靠。
```

### 3.3 实验组（现有快照 vs 内存重生成，**仅统计有判别力的页面**）

```
[equiv] 第 2 步：实验组（现有快照 vs 内存重生成，仅统计有判别力的页面）
    api-settings.html        元素 264   computed 差异 0
    canvas-list.html         元素 133   computed 差异 0

[equiv] 合计：元素 397 个，computed 差异 0 处
[equiv] 判定：重生成为「视觉等价」——可安全覆盖（仍需人工授权 --force）。
EXIT=0
```

### 3.4 变异自证（证明 §3.3 的零差异不是工具恒真）

对 2 个有判别力的页面，分别删掉「该页运行时真实使用」的全部快照单类规则后再注入：

```
        [变异自证] 已删除本页在用规则后 computed 差异 = 50 -> 通过      # api-settings.html
        [变异自证] 已删除本页在用规则后 computed 差异 = 35 -> 通过      # canvas-list.html
```

典型差异样本（删除后用 computed 实测，不是推断）：

```json
{"tag": "svg", "cls": "lucide lucide-plus w-4 h-4",
 "changes": {"width": ["16px", "24px"], "height": ["16px", "24px"]}}
```

即删除 `w-4` 后图标从 16px 变回浏览器默认 24px——**本口径对该页确有分辨力**。

### 3.5 假阳性来源的证伪（证明 §3.3 的零差异不是口径太松）

把动画属性（`transform` / `opacity` / `filter`）加回比对（`--keep-animation-props`），
**同一份 CSS** 的对照组立刻出现噪声，工具按设计退出码 `2`：

```
[equiv] 第 1 步：对照组（baseline vs baseline，同一份 CSS 加载两次）
    v2/index.html            元素 740   噪声差异 7
    api-settings.html        元素 264   噪声差异 1
[equiv] 判定：口径不可靠 —— 对照组出现 8 处噪声，退出码 2。
EXIT=2
```

逐条核对：这些差异的属性全部是 `transform` 或 `opacity`，元素类名均为动画元素
（`animate-ping`、`animate-pulse`、`bg-gradient-to-r` 光晕、`hw-avatar-keycap-status` 呼吸灯）。
即——**在 CSS 完全相同的条件下也会出现**，属采样噪声，与本项对照内容无关。

这同时构成一道**独立**的自证：本工具的对照组守卫**确实能失败**。

### 3.6 与旧版结论的差异（**必须如实登记**）

旧版本文件登记为「12 页 / 3408 元素 / computed 差异 0」。该读数**方向正确但不具判别力**：
12 页中有 10 页并不消费本地快照，把它们计入分母会稀释结论。
**更正后的权威口径为：2 页 / 397 元素 / computed 差异 0，且 2 页均通过变异自证。**

定性结论不变（重生成为视觉等价），但**证据强度与覆盖范围以本节为准**。

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

基于 §3.3 与 §3.4：**重新生成为视觉等价**（该判定仅在此口径与视口下成立，见 §4 边界）。
可选处置（须人工裁决其一）：

| 选项 | 效果 | 代价 |
|---|---|---|
| **A. 保持现状，不重生成** | 快照继续含 389 个死规则；`--check` 持续返回 `1`（属预期，非回归） | 快照与源码长期脱节，可复现性缺口保留 |
| **B. 执行 `--force` 重生成** | 快照与源码对齐；`--check` 转为 `0`；已实测视觉等价 | 覆盖既有制品，事后不可从仓库内容直接追溯「删了什么」 |

若选 **B**，建议在同一提交内一并落入：重生成后的新 SHA-256、
`--diff`（规则级前后计数）、本文件 §3.3 的 computed 零差异读数 + §3.4 变异自证读数，作为该次视觉变更的证据链。
