# Phase 10 顶栏可达性证据（第 8 项 E2E 检查）

> 生成时间：2026-09-23（本机实测，headless Chrome + 真实 HTTP）
> 对应工具：`tools/frontend_e2e_smoke.py` 第 8 项 `run_topbar_accessibility()`
> 状态：**待人工裁决**（缺陷已确认，修复涉及视觉设计变更，未获授权前不改 CSS）

---

## 1. 为什么需要这一项

前 7 项 E2E 检查依赖的观测量是「页面错误 / 静态资源 4xx / API 4xx / DOM 断言 / 脚本累积」。
但顶栏（`.topbar-master-deck`）同时具备两个特征，使上述观测量**全部失效**：

1. `src/gods_workbench/static/css/hardware-design-system.css:74` 把 header 尺寸以
   `min-height:116px !important; height:116px !important` **钉死**；
2. 9 个 v2 页面的 header 元素类名里都带 `overflow-hidden`（如
   `src/gods_workbench/static/v2/index.html:360`）。

于是当 header 内部控件总宽超过可视宽度时：

- **不抛 JS 异常**（`pageerror = 0`）；
- **不出现滚动条**（`overflow: hidden`）；
- **不产生 4xx**（不涉及网络请求）。

超出部分被**静默裁掉**。这正是「第 1–7 项全绿但控件已经点不到」的盲区。

---

## 2. 判定方法（机械、可复现）

在 `1920x1080`、`1600x1000`、`1366x768` 三个视口下，逐页（9 页）执行：

1. 取 header 的可见裁剪矩形：`clipLeft = header.left + paddingLeft`，
   `clipRight = header.right - paddingRight`；
2. 对必达控件取「可见交集」：`visibleWidth = max(0, min(right, clipRight) - max(left, clipLeft))`；
3. **中心点命中测试（hit-test）**：在可见交集中心点调用 `document.elementFromPoint(x, y)`，
   要求命中元素是控件本身或其后代 —— 这一步排除了「几何上在视口内、但被其它元素遮住」的情况；
4. **判别力闸门**：`visibleWidth >= max(24px, 控件自身宽度 × 60%)`。
   达不到即判为**不可用**。24px 为 WCAG 2.2 SC 2.5.8（Target Size (Minimum)）的下限锚点。

必达控件（`TOPBAR_TARGETS`）：`#topbarUnifiedTrashBtn`（统一回收站入口）、
`#masterDeckDate`（母带日期）。

**判别力闸门存在的理由（实测依据）**：1920x1080 下 `index.html` 的顶栏回收站
仅剩 **4px** 可见（控件自身宽 36px 的 11%），而 hit-test 仍命中自身。
只做 hit-test 会把这种「只剩一条缝」的状态判为 PASS；叠加闸门后才如实判为不可用。

---

## 3. 实测数据

### 3.1 顶栏横向溢出（`header.scrollWidth - header.clientWidth`，单位 px）

| 页面 | 1920x1080 | 1600x1000 | 1366x768 |
|---|---|---|---|
| `index.html` | 77 | 397 | 631 |
| `projects.html` | 93 | 413 | 647 |
| `production.html` | 99 | 419 | 653 |
| `workshop.html` | 0 | 32 | 266 |
| `storyboard.html` | 99 | 419 | 653 |
| `agents.html` | 106 | 426 | 660 |
| `settings.html` | 0 | 32 | 266 |
| `assets.html` | 106 | 426 | 660 |
| `collab.html` | 106 | 426 | 660 |

三个视口共 27 个「页面-视口」组合；其中 **25 个存在溢出**（1920 下 7 个、1600 下 9 个、1366 下 9 个，
三处并集为 9 页）。溢出量随视口变窄单调上升，符合「header 高度被 `!important` 钉死、
内部控件不换行收缩」的成因判断。

### 3.2 必达控件不可用组合（`视口|选择器`，共 27 个）

| 视口 | 页面 | 不可用控件（可见宽度 / 需要宽度） |
|---|---|---|
| 1920x1080 | `index.html` | 回收站（4 / 24） |
| 1920x1080 | `projects.html` | 回收站（0 / 24） |
| 1920x1080 | `production.html` | 回收站（0 / 24） |
| 1920x1080 | `storyboard.html` | 回收站（0 / 24） |
| 1920x1080 | `agents.html` | 回收站（0 / 24） |
| 1920x1080 | `assets.html` | 回收站（0 / 24） |
| 1920x1080 | `collab.html` | 回收站（0 / 24） |
| 1600x1000 | `index.html` | 回收站（0 / 24） |
| 1600x1000 | `projects.html` | 回收站（0 / 24） |
| 1600x1000 | `production.html` | 回收站（0 / 24） |
| 1600x1000 | `storyboard.html` | 回收站（0 / 24） |
| 1600x1000 | `agents.html` | 回收站（0 / 24） |
| 1600x1000 | `assets.html` | 回收站（0 / 24） |
| 1600x1000 | `collab.html` | 回收站（0 / 24） |
| 1366x768 | `index.html` | 回收站（0 / 24） |
| 1366x768 | `projects.html` | 回收站（0 / 24） |
| 1366x768 | `production.html` | 回收站（0 / 24） |
| 1366x768 | `workshop.html` | 回收站（0 / 24） |
| 1366x768 | `storyboard.html` | 回收站（0 / 24） |
| 1366x768 | `agents.html` | 回收站（0 / 24）、日期（0 / 52） |
| 1366x768 | `settings.html` | 回收站（0 / 24）、日期（0 / 52） |
| 1366x768 | `assets.html` | 回收站（0 / 24）、日期（44 / 52） |
| 1366x768 | `collab.html` | 回收站（0 / 24）、日期（0 / 52） |

**结论（本机实测）**：

- `#topbarUnifiedTrashBtn` 在 **9 页 × 3 视口 = 27 个组合中，23 个不可用**
  （仅 `workshop.html` / `settings.html` 在 1920 与 1600 下共 4 个组合可用）；
- `#masterDeckDate` 仅在 **1366x768** 的 4 个页面不可用，其余 23 个组合可用；
- 即：**统一回收站入口在 1920x1080 这种主流桌面视口下、9 页中有 7 页点不到**。

---

## 4. fail-closed 语义与变异自证

`KNOWN_TOPBAR_OVERFLOW`（键 = 视口）与 `KNOWN_TOPBAR_UNREACHABLE`（键 = 页面）
两张登记表只承载**已知缺口**，判定规则为：

| 情形 | 判定 |
|---|---|
| 实测有缺口、未登记 | **FAIL**（新缺口，必须显式登记或修复） |
| 实测无缺口、已登记 | **FAIL**（提示移除登记，防清单腐化） |
| 实测有缺口、已登记 | PASS（已知缺口，登记在案） |

**变异自证**：`--mutation-selftest` 会以 `ignore_registry=True` 重跑第 8 项，
即清空两张登记表。实测报出 **23 条 FAIL**（27 个不可用组合按「视口+页面」聚合后为 23 条），
证明该判定**不是恒真产物**。若变异体零失败，工具直接以退出码 `2` 作废结论。

实测主运行：**退出码 0**（第 8 项全部为已登记缺口，无未登记项、无登记腐化）。

---

## 5. 本轮修复的工具自身缺陷（如实登记）

第 8 项初版存在**两处工具自身缺陷**，本轮一并修正：

1. **「已登记但不再复现」误报**：登记表按**页面**聚合（一条记录覆盖三个视口），
   初版却在**逐视口**内做 `set(registered) - set(observed)` 差集，
   导致每个视口都把自己没有的组合当作「已消失」误报。实测主运行曾因此产生 **23 条假 FAIL**。
   修正为：在跑完该页**全部视口**后，用三视口观测**并集**与登记表比较。
2. **变异自证结果未落盘**：变异体的失败明细初版只存在内存、未写入 JSON 报告，
   无法在事后审计中复核。修正为将 `topbar_mutation_selftest.failure_count`
   与失败明细写入 `e2e-report.json`。

两项修正后重跑：主运行退出码 `0`、变异自证 `23` 条 FAIL，两者均与预期一致。

---

## 6. 边界（不得越读）

- 本证据全部为**本机**实测：1600 级 headless Chromium + 真实 HTTP（`python -P tools/frontend_e2e_smoke.py --serve`）。
  **本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权**；该工具依赖 Playwright，**不接入 CI**。
- 本项只覆盖 **2 个必达控件**（`#topbarUnifiedTrashBtn`、`#masterDeckDate`）与 **3 个视口**；
  其余顶栏控件（如 `#navPillsGroup`、主题开关等）与更多视口**未纳入分母**，
  不得据此断言「顶栏整体只有这些问题」。
- 本项只证明「控件是否**可被鼠标点到且可见宽度达标**」，
  **不**证明材料被裁掉的控件在功能上是否仍有替代入口（键盘可达性 / 其余入口未测）。
- **未修复**：本项只测量与登记，**没有**修改任何 CSS 或页面结构。
  修复方案（压缩控件宽度 / 允许换行 / 调整 header 高度或 `overflow`）属于**视觉设计决策**，
  须按 `AGENTS.md` §5 由人工确认后实施；修复后必须从两张登记表移除对应条目，否则判定会 FAIL。

---

## 7. 待裁决项

| # | 裁决项 | 选项 | 建议 |
|---|---|---|---|
| 1 | 顶栏控件在大范围视口下被静默裁剪（回收站入口 23/27 组合不可用） | A 维持现状并登记；B 修复顶栏布局；C 改 header 尺寸约束 | **B** —— 统一回收站是核心入口，1920 下 9 页有 7 页点不到；但属视觉变更，须人工确认 |
| 2 | 修复后是否保留第 8 项作为常驻门禁 | A 保留本地门禁；B 移除 | **A** —— 该维度是前 7 项的结构性盲区，去掉后同类回归将无检测能力 |
