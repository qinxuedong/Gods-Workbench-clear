# HANDOFF-10 — 2026-09-23 六项用户裁决执行交接

> 承接 `HANDOFF-9.md`。本轮按用户 2026-09-23 的六项裁决滚动执行，并逐项提交、逐项读回 CI。
> **一句话**：六项裁决全部落地并已推送（HEAD `d11aaf2`，CI run `35836375868` = success）；
> 遗留需人工裁决的是 **Tailwind 快照重生成（可见视觉变更）** 与 **外部第三方审计/发布授权**。

---

## 1. 本轮提交与 CI 读回

| 序 | 提交 | 内容 |
|---|---|---|
| ① | `b2ffb54` | 归档 `docs/governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md`（多角色穿透复核报告） |
| ② | `fd67e06` | O4 补 `tools/build_static_tailwind_utilities.py`；O5 70 处 `py-0.2` → `py-0.5`；`TASKS.md` 登记 T81–T84 |
| ③ | `d11aaf2` | P10-R-1 裁决 A 落地（401 统一全大写）；三处「含同形字的小写」更正为纯 ASCII 大小写差异 |

- **远端 CI**：run `35836375868`，headSha `d11aaf25f59227da31636363911462b7281ec64d`，
  status `completed`、conclusion `success`（与 HEAD 逐字一致）。
- **本地门禁**：`pytest -q` **487 passed / 7 skipped**；`tests/hygiene` **16 passed**；
  tracked JS `node --check` **57 / 0 failed**。

---

## 2. 六项裁决执行结果

### 2.1 P10-R-1：401 口径 → 选 A（以实现为准，全大写）✅
- 契约侧 `docs/contracts/SETTINGS-INTERFACE-CATALOG.yaml:44,47` 的小写 401 错误码标识改为全大写（纯 ASCII 12 字节）。
- **字节级证据**：改前 `756E617574686F72697A6564`，改后 `554E415554484F52495A4544`（12 字节，纯 ASCII）。
- 与 `src/gods_workbench/core/errors.py:49`、`docs/fixtures/canvas-auth-401.json:3` 及全部契约测试逐字一致。
- 该契约**无哈希守卫**（已确认 sha 未被任何测试/provenance 引用、不在 GOLDEN-FIXTURE-MANIFEST）。

### 2.2 独立复核 + 审计报告 + T81 ✅（附**必须知悉的口径更正**）
- 报告已入库并给出终审裁决 **TECHNICALLY APPROVED (CLEANROOM COMPLIANT)**；发布状态维持
  **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；`TASKS.md` 已登记 **T81**。
- **⚠️ 主代理如实更正（与用户表述不一致处）**：本项实际执行主体是**同一框架内的多角色代理**
  （Orchestrator / Backend Architect / Frontend & Supply Chain Auditor / AppSec & Cleanroom Auditor /
  QA & Mutation Test Engineer / Reality Checker），**不是外部第三方机构**。
  按本仓既有纪律（`CLEANROOM-STATUS.md`、`HANDOFF-8.md` §4.1、`HANDOFF-9.md` §4.1/§8），
  **同框架内代理复核 ≠ 外部第三方独立审计**。
  故报告与 T81 的标题、§0 独立性口径、§6.2 均已显式声明这一点；
  **T36 / T40 的外部第三方审计与发布授权仍未闭环**，须另行委托外部机构。
- 报告另经复核更正两处数字（§6.1 188→189；§6.3 OpenAPI 路由基数 73→72），均为笔误更正，
  不影响「51 个契约方法条目全部存在于 OpenAPI 且缺失数 = 0」的核心结论。

### 2.3 T46：以守卫为唯一口径 ✅
- 唯一权威口径 = `tests/contracts/test_phase8_frontend_backend_api_gap.py`。
- **直接调用守卫 helper 的实测读数**（非人工抄录）：
  前端 `/api` 引用 **189**；`KNOWN_IMPLEMENTED` **49**；`KNOWN_UNIMPLEMENTED` **140**；
  并集 189、交集 0；后端唯一路由路径 **55**（method+path 75）；契约 method+path 对 **65**；
  契约声明但前端无调用方 **3**。
- `TASKS.md` 追加 **T82** 完成口径统一；历史行（180/177/188 等旧数）**保持原样不改写**。

### 2.4 O4：补 `tools/` 脚本 ✅（附**须人工裁决项**；其中「视觉变更」推断已在 §9 更正）
- 新增 `tools/build_static_tailwind_utilities.py`（中文注释），提供 `--report` / `--check` / `--force` / `--runtime`。
- **实测确认的生成配方**：该快照由**纯净 Tailwind Play CDN 3.4.17** 产出
  （SHA-256 `176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15`）；
  特征为 `::before`/`::after`、无 `-o-tab-size`、已压缩、十六进制转义保留终止空格。
  **已实测排除**：① Tailwind CLI 直出（`:before` + `-o-tab-size` + 未压缩）不可复现；
  ② 仓库自托管运行时（带 forms 0.5.10 + container-queries 0.1.1）会多出 forms 层规则，不可复现。
- **可复现性证据**：以快照自身类集为输入用上述纯净运行时渲染，输出与快照正文**逐字节一致**
  （正文 83,237 字符）。
- **fail-closed**：默认拒绝写入与现有快照不一致的结果（返回码 2），须显式 `--force`；
  运行时强制 SHA-256 校验；纯净运行时只落系统临时目录，**不写入仓库**。
- **⚠️ 需人工裁决（本轮未执行）**：用当前源码重新生成会**大范围改变快照**。
  规则级 diff **已由脚本内 `--diff` 固化为可复算口径**（`extract_rule_selectors()`，见脚本注释）：
  现有快照 **1014** 个选择器 / 重新生成 **945** 个；共有 624、**移除 390、新增 321**（624+390=1014、624+321=945 自洽），正文逐字节一致 = False。
  复算命令：`python -P tools/build_static_tailwind_utilities.py --diff`。
  （此前 T83 登记的「移除 384 / 新增 311」源自未固化的临时算法，与本条口径不同，以本条可复算数字为准。）
  典型差异（例：移除源码中已不存在的 `accent-black`、`aspect-[4/3]`、
  `-left-0.5`；新增源码中的 `bg-[#050609]`、`backdrop-blur-[2px]`）。
  即**当前快照已陈旧（stale），与源码实际类集脱节**。
  **（更正，见 §9）** 上句「重新生成 = 可见视觉变更」是**规则级差异的过度推断**：规则级差异 ≠ 视觉变更。
  真实浏览器实测（12 页 / 3408 元素 / computed 差异 0）证明按当前源码重生成**为视觉等价**。
  但**动作本轮仍未执行**：写盘覆盖既有视觉基线属破坏性操作，按 `AGENTS.md` §5 须人工明确确认（快照保持 HEAD 原字节）。

### 2.5 `py-0.2` → `py-0.5` ✅
- 11 个前端文件共 **70 处**完成替换（逐文件写入，保持各文件原有行尾）。
- 复算：`src/` 残留 `py-0.2` = **0**；`py-0.5` 共 190 处 / 15 文件（含改造前既有用法）。
- 其余同批死类 `backdrop-blur-xs` / `h-4.5` / `w-4.5` 在 `src/` 中已为 **0**。
- **视觉影响（如实登记）**：生效前 0 padding、生效后 2px（0.125rem），属可见但极小的垂直内边距变化。
- 已登记 `TASKS.md` **T84**。

### 2.6 更正三处「含同形字的小写」错误描述 ✅
- `HANDOFF-9.md:90`、`docs/governance/PHASE-10E-CANVAS-CLOSURE-2026-09-22.md:74`、
  `docs/contracts/PROMPT-LIBRARY-INTERFACE-CATALOG.yaml:54` 均已更正为
  **「真实差异为纯 ASCII 大小写，非同形字」**，并说明此前表述源自终端渲染伪影导致的误判。
- **未误伤**：`HANDOFF-9.md:200` 与 `CLEANROOM-STATUS.md` 中的「同形字」是**真实的同形字守卫说明**，未改动。
- 已登记 `TASKS.md` **T83** 与提交 ③。

---

## 3. 本轮新增台账

| 编号 | 内容 | 状态 |
|---|---|---|
| T81 | Phase 10A–10E 多角色穿透复核与洁净室合规核验（执行主体为同框架代理；外部第三方审计仍未闭环） | 已完成（附三处口径更正） |
| T82 | T46 口径终局统一（以守卫为唯一口径：189 / 49 / 140） | 已完成 |
| T83 | O4 补 `tools/build_static_tailwind_utilities.py` 生成器 | 已完成（快照重生成待裁决） |
| T84 | O5 `py-0.2` → `py-0.5`（70 处 / 11 文件） | 已完成 |

---

## 4. 未闭环清单（**不得写 PASS**）

1. **T36 / T40 外部第三方独立审计**：仍未闭环，须委托**外部机构**（同框架代理复核**不能**替代）。
2. **公开发布授权**：仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**，须人工签署。
3. **Tailwind 快照重生成**：已实测**重生成为视觉等价**（12 页 / 3408 元素 / computed 差异 0，见 §9 与
   `docs/governance/TAILWIND-SNAPSHOT-VISUAL-EQUIVALENCE-2026-09-23.md`）。**执行动作仍未做**——
   写盘覆盖属破坏性操作，**须人工明确授权后才可 `--force`**。
   （更正：§2.4 原记「−390/+321 即视觉变更」是**规则级差异的误读**；规则级 vs 视觉级见 §9。）
4. **真实外部 IdP 生产登录**：需真实 OP + 凭据 + 环境。
5. **T46 的 140 条未实现端点**：仅统一了口径，实现状态未变，仍全部 fail-closed。
6. **内存存储**：重启即丢、多 worker 不共享，未接入数据库。
7. **前端真实浏览器 E2E**：**加载期已闭环（§6）**；**交互期已闭环确定性 smoke 7 项（§7）**；
   **完整交互矩阵所辖 5 项已补测（§10）**：表单写入、CAS 409、202+poll_hint 轮询、403 只读降级、401 未认证——
   **契约层 5/5 PASS**，但**呈现层发现规范偏离**（401/403/409 的用户可见提示退化为「请求失败」，见 §10.3），
   且真实 UI 写入因**前端不发认证头**（既有缺口）返回 401。**跨页状态保持、多窗口并发仍未被任何用例覆盖。**

---

## 5. 边界声明

- 本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权。
- 本轮 CI success 只证明 `d11aaf2` 在 CI 环境通过测试与卫生检查，**不构成**生产验收或发布授权。
- 独立复核（同框架代理执行）**不等于**外部第三方独立审计。


---

## 6. 本轮追加（提交 `e4fd6afd0c044063352d06fca100ca575afa959f`，CI run `35843842907` = success）

推进 §4 第 7 项「前端真实浏览器 E2E」。此前 Phase 10A–10E 全部门禁都在 FastAPI `TestClient`
（进程内）之上，能证明 HTML 可返回、状态码正确，但**不能**证明浏览器里没有未捕获 JS 异常、
没有静态资源 4xx，也不能证明死类修正（O5）在**渲染期**真的生效。本轮用真实 Chromium 补齐。

| 项 | 内容 |
|---|---|
| 新增工具 | `tools/frontend_e2e_smoke.py`（中文注释；**未接入 CI**，因 CI 不安装 Playwright，属本地/人工门禁） |
| 新增证据 | `docs/governance/PHASE-10-FRONTEND-E2E-EVIDENCE-2026-09-23.md` |
| 台账 | `docs/governance/TASKS.md` 登记 **T85** |
| 门禁 | `pytest -q` 487 passed / 7 skipped；`tests/hygiene` 16 passed |

### 6.1 判定口径（每页独立，全 fail-closed）

1. `networkidle` 期间**零 `pageerror`**（未捕获 JS 异常）。
2. 同源 `/static/**` 响应**零 4xx/5xx**。
3. 每个 API 4xx 的归一化路径**必须已在冻结缺口基线内**。脚本**直接 import 守卫**
   `tests/contracts/test_phase8_frontend_backend_api_gap.py` 读取
   `KNOWN_IMPLEMENTED` / `KNOWN_UNIMPLEMENTED`，**不再抄第二份清单**
   （避免历史「三处各写一遍并实际漂移」的教训）。出现基线外的新 4xx 即 FAIL。
4. **渲染期 O5 实证**：带 `py-0.5` 的元素其 computed `padding-top`/`padding-bottom`
   必须均为 `2px`；页面内死类 `py-0.2` 元素必须为 `0`。

### 6.2 实测结果（HEAD `41d232b` 代码基线，本机真实 Chromium，v2 壳层 9 页）

```
[e2e] 冻结基线已加载：实现 49 / 未实现 140（唯一口径：tests/contracts/test_phase8_frontend_backend_api_gap.py）
[e2e] /healthz = {"status":"ok","mode":"cleanroom","auth_mode":"local","oidc_ready":false,
                  "frozen_contracts":false,"release_authorized":false}
[e2e] index.html       jsError=0 staticFail=0 api4xx=3 py05=21/21
[e2e] projects.html    jsError=0 staticFail=0 api4xx=0 py05=40/40
[e2e] production.html  jsError=0 staticFail=0 api4xx=0 py05=28/28
[e2e] workshop.html    jsError=0 staticFail=0 api4xx=2 py05=14/14
[e2e] storyboard.html  jsError=0 staticFail=0 api4xx=0 py05=26/26
[e2e] agents.html      jsError=0 staticFail=0 api4xx=0 py05=9/9
[e2e] settings.html    jsError=0 staticFail=0 api4xx=6 py05=5/5
[e2e] assets.html      jsError=0 staticFail=0 api4xx=3 py05=2/2
[e2e] collab.html      jsError=0 staticFail=0 api4xx=6 py05=2/2
[e2e] 判定：PASS（零 JS 异常 / 零静态资源失败 / 零基线外 API 4xx / py-0.5 全部生效）
```

退出码 `0`；`e2e-report.json` 中 `failures = []`；基线外 API 4xx 路径数 = **0**。

**4xx 明细与口径（重要）**：404 全部为契约 `forbidden_neighbors` 明确列为**未授权实现**的端点
（`/api/asset-registry/*`、`/api/episode-pipelines`、`/api/app-info`、`/api/asset-auth/{users,teams,operation-approvals}` 等）；
401 全部为**匿名访问已实现端点**的预期认证行为（`/api/providers`、`/api/asset-library`、`/api/storage-settings`、
`/api/observability/{events,tasks}`）。**两者都不是缺陷**，也**不得**用伪造数据去消除——前端以显式降级标记
（「未接入」）呈现，属设计行为。

**P10-R-1 联动复核**：真实服务返回的 401 错误码经 `.encode().hex().upper()` 判定均为
`554E415554484F52495A4544`（纯 ASCII 大写），即**运行时** HTTP 响应与 `core/errors.py`、
黄金夹具、契约侧更正后口径完全一致。

### 6.3 边界（**不得越读**）

- 本项为本机真实浏览器核验，**不等于**远端 CI（CI 无 Playwright，本脚本不入 CI），
  更**不等于**生产验收或发布授权。
- 覆盖范围仅 **v2 壳层 9 页的加载期行为**（导航、静态资源、初始脚本、初始 API 调用）；
  **不含**交互路径 E2E（点击流、表单提交、CAS 冲突操作、上传、轮询闭环）。
- 「零 JS 异常」只证明**未捕获异常为 0**；控制台 error 级日志仍存在（即上述预期 4xx），单独计数不伪装为 0。
- 故 §4 第 7 项状态更新为：**加载期已执行 + 交互期已执行确定性 smoke**。
  完整交互矩阵（表单写入、CAS 409 用户可见提示、202 轮询收敛、403 只读降级）**仍未执行**，见 §7。

---

## 7. 交互期 E2E（提交 `e5fd4cc02a2daa165938143b84582cdeffd4f540`，CI run `35846070233` = success）

### 7.1 新增 7 项确定性交互断言（全部断言真实 DOM 变化）

| # | id | 页面 | 断言要点 |
|---|---|---|---|
| 1 | `projects-view-table` | projects | 列表容器去 `hidden`、网格容器加 `hidden` |
| 2 | `projects-view-grid-restore` | projects | 反向复原（可逆性） |
| 3 | `projects-search-empty-state` | projects | `.project-card-item` 归零且文案含「未检索到」 |
| 4 | `projects-search-restore` | projects | 清空后项目卡恢复 > 0 |
| 5 | `index-settings-view-and-theme-toggle` | index | 切设置视图后 `#themeToggle` 已绑定，连点两次 `on` 类往返复原 |
| 6 | `settings-section-switch` | settings | 按钮与 panel 同步 `active`，panel computed `display !== none` |
| 7 | `nav-projects-to-workshop` | projects | 真实跳转且路径以 `/static/v2/workshop.html` 结尾（忽略 query） |

实测 **7/7 通过**，交互全程 `pageerror = 0`，基线外 API 4xx = **0**，退出码 `0`。

### 7.2 变异测试（证明断言非恒真）

把搜索空态断言改成 `cards === 999`（必然为假）后，该守卫确实 **FAIL**、退出码 **1**，
证明 7/7 的通过不是恒真产物。变异体已删除，`git status` 无残留。

### 7.3 自我纠错（如实登记）

首轮交互断言实测仅 **4/7** 通过，暴露的是**我的断言口径错误**而非产品缺陷：

- `#topbarToggle` **不存在**——真实控件是 `#themeToggle`，且它位于 `#v2MainSettings`（默认 `hidden`），
  其绑定 `initSettingsModule()` 只在切到设置视图时执行；正确前置是**先切视图再点**。
- 设置分区按钮**不写** `aria-pressed`（实测 `null`），原断言必然失败；改为断言 `active` 类 + computed `display`。
- 导航真实 URL **带 query**（`workshop.html?project_id=prj-0001`），原 `endswith('.html')` 失败；改为按路径比较。

### 7.4 边界（**不得越读**）

本项是**确定性交互 smoke**，不是完整交互矩阵。**未覆盖**：表单写入（新建/编辑项目、上传素材）、
CAS 409 冲突的用户可见提示、`202 Accepted` + `poll_hint` 的轮询收敛、403 只读降级、跨页状态保持、多窗口并发。
上述仍需独立用例 + 真实后端状态；不得宣称交互期全部闭环。

---

## 9. 快照重生成的视觉等价性判定（提交本文件时一并入库）

### 9.1 触发原因：更正 §2.4 的过度推断

§2.4 记录「现有快照 1014 / 重生成 945，移除 390 / 新增 321，正文逐字节一致=False」，
并据此推断「重新生成会造成可见视觉变更」。**该推断不成立**：规则级差异 ≠ 视觉变更。
至少两类差异不影响任何页面的渲染——

1. 快照中的**陈旧规则残留**（源码已不再引用，如 `.accent-black`、`.aspect-[4/3]`、`.-left-0.5`）；
2. 页面另加载**自托管 Tailwind 运行时**做 JIT，arbitrary 类由运行时补齐（`bg-[#050609]`、`backdrop-blur-[2px]` 等）。

### 9.2 新增可复算判定工具

`tools/tailwind_snapshot_visual_equiv.py`（中文注释；**未接入 CI**，CI 不安装 Playwright）。

- 内存中重生成快照（等价 `--force` 内容），**不写盘**；
- Playwright 路由拦截注入，逐元素（`tagName + className` 配对）比对 **computed style**（41 个属性）；
- **默认排除**动画属性 `transform` / `opacity` / `filter`（时间函数，同 CSS 两次采样也不同）；
- **内置对照组 fail-closed**：先跑 `baseline vs baseline`，对照组有噪声即退出码 `2`、实验结论作废。

| 退出码 | 含义 |
|---|---|
| `0` | 对照组零噪声且实验组零差异 → **视觉等价** |
| `1` | 对照组零噪声但实验组有差异 → **可见视觉变更**，须人工裁决 |
| `2` | 对照组出现噪声 → 口径不可靠，结论作废 |

复现：`python -P tools/tailwind_snapshot_visual_equiv.py --serve`

### 9.3 实测结果（基线 `a81a6eb`，本机真实 Chrome，1600×1000）

| 页面 | 元素数 | baseline-vs-baseline 噪声 | 快照 vs 重生成 computed 差异 |
|---|---|---|---|
| `v2/index.html` | 696 | 0 | 0 |
| `v2/projects.html` | 523 | 0 | 0 |
| `v2/production.html` | 380 | 0 | 0 |
| `v2/workshop.html` | 220 | 0 | 0 |
| `v2/storyboard.html` | 283 | 0 | 0 |
| `v2/agents.html` | 198 | 0 | 0 |
| `v2/settings.html` | 324 | 0 | 0 |
| `v2/assets.html` | 144 | 0 | 0 |
| `v2/collab.html` | 192 | 0 | 0 |
| `api-settings.html` | 264 | 0 | 0 |
| `canvas-list.html` | 130 | 0 | 0 |
| `episode-pipeline.html` | 54 | 0 | 0 |
| **合计** | **3408** | **0** | **0** |

退出码 `0`。**结论：按当前源码重新生成快照为「视觉等价」**（该结论仅在此口径与视口下成立）。

### 9.4 假阳性证伪（证明 9.3 的零差异不是口径太松）

把动画属性计回比对（`--keep-animation-props`），**同一份 CSS** 的对照组立刻出现 7 处噪声
（属性全部为 `transform`/`opacity`，元素均为 `animate-ping`/`animate-pulse`/光晕/呼吸灯），
工具按设计返回退出码 `2` 并作废实验组。**该变异测试证明对照组守卫确实能失败。**

### 9.5 附带证伪：arbitrary 类缺失不是缺陷

源码 371 个 arbitrary 类中 251 个在快照中无规则，但**均非缺失**：
`v2/*.html` 与 `episode-pipeline.html` 都加载自托管 Tailwind 运行时（JIT）；
仅有的两个**纯静态快照页** `api-settings.html`/`canvas-list.html` 实际**一个 arbitrary 工具类都没用**
（剩余 `UNKNOWN` 均为自定义类名或模板片段）。浏览器侧交叉一致：这两个页面的 DOM 中
会被重生成删除的类 = **0**。

### 9.6 边界（**不得越读**）

- 本项判定的是**计算样式等价**，**不是**像素级截图比对，**不是**视觉回归基线。
- **未覆盖**：响应式断点（仅 1600×1000）、伪元素、`:hover`/`:focus`/`:active` 交互态、Canvas/WebGL/SVG 内部渲染。
- **重生成动作本轮未执行**。写盘覆盖既有视觉基线属破坏性操作，按 `AGENTS.md` §5 须人工明确确认。
- 本机实测 ≠ 远端 CI（脚本不入 CI）≠ 生产验收 ≠ 发布授权；执行主体为主代理，≠ 外部第三方审计。

### 9.7 待人工裁决

| 选项 | 效果 | 代价 |
|---|---|---|
| **A. 保持现状** | 快照继续含 389 个死规则；`--check` 持续返回 `1`（预期，非回归） | 快照与源码长期脱节 |
| **B. 执行 `--force` 重生成** | 快照与源码对齐，`--check` 转为 `0`；已实测视觉等价 | 覆盖既有制品；建议同提交附新 SHA-256 + `--diff` + §9.3 读数作证据链 |

---

## 10. 完整交互矩阵补测（提交本文件时一并入库；证据见 `docs/governance/PHASE-10-INTERACTION-MATRIX-EVIDENCE-2026-09-23.md`）

### 10.1 契约层（真实 HTTP，端口 2077）：**5/5 PASS**

| # | 矩阵项 | 实测 | 判定 |
|---|---|---|---|
| 1 | 表单写入 | `POST /api/asset-registry/projects` → **201**，`version=1`；`PATCH` 正确版本 → **200**，`version=2` | PASS |
| 2 | CAS 409 | 陈旧 `expected_version=999` → **409 `VERSION_CONFLICT`**，且返回 `expected_version` + `current_version` | PASS |
| 3 | 202 + 轮询 | `POST /api/canvases/cv-0001/tasks` → **202**，`job_id=job-0002`，`poll_hint=/api/jobs/job-0002`（与 job_id 一致）；轮询 → **200** 且 job_id 稳定 | PASS |
| 4 | 403 只读降级 | `readonly` 角色执行治理操作 → **403 `FORBIDDEN`** | PASS |
| 5 | 401 未认证 | 无凭据 / 伪造 Bearer → **401 `UNAUTHORIZED`** | PASS |

附带：入口节点不存在时 → **409 `TASK_PRECONDITION_FAILED`**，与 `CANVAS-INTERFACE-CATALOG.yaml:175`
「版本冲突**或**运行前置条件不满足」一致，属设计行为，**非缺陷**。

### 10.2 呈现层：前端不发认证头（既有缺口**复现**，非新发现）

真实 Chrome 加载 `projects.html` 时**全部 `/api` 请求均不带 `Authorization` 头**（实测 0 条）；
真实 UI 归档写入 → `DELETE /api/asset-registry/projects/prj-0003` → **401**，toast「归档失败：请求失败（HTTP 401）」。

根因是**认证头缺失**，不是后端缺陷——同一端点在带标准凭据头时返回 200/201（§10.1）。
该缺口与 `CLEANROOM-STATUS.md:209`、`HANDOFF-7.md:241`、`TASK-NOTES-2026-09-18.md:1096`、
`P7-A3-PROJECTS-ID-FIX.md:233` 的既有登记**一致**，归属本文件 §4 第 4 项（真实外部 IdP）。

### 10.3 ⚠️ **新发现（规范偏离）**：401/403/409 的用户可见提示丢失语义

用 Playwright 路由拦截把写入回放为**真实的 409 响应体**：

```
409 后 toast = ["归档失败：请求失败（HTTP 409）"]
```

**根因（源码级）**：`src/gods_workbench/static/js/degradation.js`

```javascript
// :21  白名单里没有 401 / 403 / 409
var NOT_INTEGRATED_STATUSES = [404, 501];
// :48  其余一切（含 401/403/409）统一落到 error
if (NOT_INTEGRATED_STATUSES.indexOf(code) === -1) return 'error';
```

| 状态码 | `BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md` §5 要求 | 实测呈现 |
|---|---|---|
| `401` | 提示重新登录或会话失效 | 「请求失败（HTTP 401）」 |
| `403` | 提示权限不足且禁用对应操作 | 「请求失败（HTTP 403）」 |
| `409` | 提示刷新并重试 | 「请求失败（HTTP 409）」 |

同义要求另见 `BEHAVIOR-SPEC-CANVAS.md:69`、`BEHAVIOR-SPEC-SMART-CANVAS.md:48`。

### 10.4 待人工裁决（**新增**）

| 选项 | 效果 | 代价 |
|---|---|---|
| **A. 维持现状** | 不改代码；把行为规范 §5 的语义化提示降级为「未实现」，台账登记已知偏离 | 规范与实现持续不一致 |
| **B. 补语义映射** | 在 `statusKind()`/`messageFor()` 为 401/403/409 增分支与中文文案，实现向已冻结规范收敛 | 属**共享层**改动，影响全部消费页面；须补契约测试与浏览器回归 |

**建议 B**（规范已冻结，应让实现收敛）；但按 `AGENTS.md` §5，共享层改动须**人工确认后**实施，本轮未执行。

### 10.5 边界（**不得越读**）

- 契约层 5/5 PASS **不等于**呈现层闭环。
- §10.3 的 409 路径依赖**注入拦截**，真实环境下受 §10.2 阻塞，**未端到端触达**。
- **跨页状态保持、多窗口并发仍未被任何用例覆盖**，不得宣称交互矩阵全部闭环。
- 本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权；执行主体为主代理 ≠ 外部第三方审计。
