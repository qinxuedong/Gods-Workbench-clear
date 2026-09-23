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
  真实浏览器实测证明按当前源码重生成**为视觉等价**；**权威口径见 §9.3**（2 页 / 397 元素 / computed 差异 0
  + 2/2 变异自证通过——旧记的「12 页 / 3408 元素」已被 §9.2 判别力闸门更正）。
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
3. **Tailwind 快照重生成**：已实测**重生成为视觉等价**。**权威口径（经 §9 判别力闸门与变异自证更正）：
   2 页 / 397 元素 / computed 差异 0，且两页变异自证 50 / 35 处差异均通过**（见 §9.3–§9.4 与
   `docs/governance/TAILWIND-SNAPSHOT-VISUAL-EQUIVALENCE-2026-09-23.md`）。**执行动作仍未做**——
   写盘覆盖属破坏性操作，**须人工明确授权后才可 `--force`**。
   （更正 1：§2.4 原记「−390/+321 即视觉变更」是**规则级差异的误读**；规则级 vs 视觉级见 §9。
   更正 2：§9 旧版「12 页 / 3408 元素」把 10 个**不消费本地快照**的页面计入分母，已由判别力闸门排除。）
4. **真实外部 IdP 生产登录**：需真实 OP + 凭据 + 环境。
5. **T46 的 140 条未实现端点**：仅统一了口径，实现状态未变，仍全部 fail-closed。
6. **内存存储**：重启即丢、多 worker 不共享，未接入数据库。
7. **前端真实浏览器 E2E**：**加载期已闭环（§6）**；**交互期已闭环确定性 smoke 7 项（§7）**；
   **完整交互矩阵所辖 5 项已补测（§10）**：表单写入、CAS 409、202+poll_hint 轮询、403 只读降级、401 未认证——
   **契约层 5/5 PASS**，但**呈现层发现规范偏离**（401/403/409 的用户可见提示退化为「请求失败」，见 §10.3），
   且真实 UI 写入因**前端不发认证头**（既有缺口）返回 401。
   **跨页状态保持与多窗口并发已补测（§11）**：跨页状态载体 4 项 PASS、真实并发 CAS 1×200 + 2×409 PASS；
   继而补齐**前进/后退栈完整性**（§12.2，URL 与工作区复原 PASS），
   并由此**新发现三个壳层部分路由真实缺陷**：
   ① 丢失 deck 内页级元素（§11.2，静默降级）；
   ② 丢失 `type="module"` 语义（§11.4，显式抛错）；
   ③ `runRouteScripts()` 只追加不替换导致 script 元素单调累积、含顶层 `const` 的内联脚本重复声明抛错（§12.3）。
   另修正一处**工具自身缺陷**（`start_server()` 的 `stdout=PIPE` 写满阻塞，§12.4）。
   故第 7 项**仍不得写为全部闭环**——状态为「**已覆盖并发现三缺陷 + 一工具缺陷已修正**」。

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

判定口径（机械、可复现、fail-closed）：

0. **判别力闸门**：逐页把快照整体**置空**后重新加载。若该页 computed 差异仍为 `0`，
   说明它**并不消费本地快照**（样式来自页面自带的 Tailwind 运行时 JIT），该页**不纳入分母**。
   若没有任何页面具判别力 → 退出码 `2`，结论作废。
1. 在内存中重生成快照（等价 `--force` 内容），**不写盘**；
2. 用 Playwright 路由拦截，注入受检页面对 `tailwind-utilities.css` 的请求；
3. 逐元素（`tagName + className` 配对）比对 **computed style**（41 个属性）；
4. **默认排除**动画属性 `transform` / `opacity` / `filter`（时间函数，同一份 CSS 采样也不同）；
5. **对照组 fail-closed**：先跑 `baseline vs baseline`，有噪声即退出码 `2`、实验结论作废；
6. **变异自证（`--mutation-selftest`）**：删掉「该页运行时真实在用」的全部快照单类规则后重新注入，
   要求 computed 差异 **> 0**；否则退出码 `2`。（这一步证明工具**不是恒真**。）

| 退出码 | 含义 |
|---|---|
| `0` | 闸门通过 + 对照组零噪声 + 实验组零差异 → **视觉等价**（仍需人工授权 `--force`） |
| `1` | 闸门通过 + 对照组零噪声 + 实验组有差异 → **可见视觉变更**，须人工裁决 |
| `2` | 无判别力页 / 对照组有噪声 / 变异自证失败 → 结论作废 |

复现：`python -P tools/tailwind_snapshot_visual_equiv.py --serve --mutation-selftest`

### 9.3 实测结果（基线 `a81a6eb`，本机真实 Chrome，1600×1000）

**第 0 步判别力闸门（这一步推翻了旧版分母）**：12 页中仅 **2 页**通过——
`api-settings.html`（置空差异 256）、`canvas-list.html`（置空差异 122）。
v2 壳层 9 页与 `episode-pipeline.html` 置空差异均为 **0**，**不消费本地快照**，已排除。

| 页面 | 元素数 | 对照组噪声 | 快照 vs 重生成 computed 差异 | 变异自证 |
|---|---|---|---|---|
| `api-settings.html` | 264 | 0 | 0 | **50**（通过） |
| `canvas-list.html` | 133 | 0 | 0 | **35**（通过） |
| **合计（纳入判定的页面）** | **397** | **0** | **0** | 2/2 通过 |
| 其余 10 页（无判别力，仅列对照） | 3318 | 全 0 | —（不消费快照） | — |

**结论：按当前源码重新生成快照为「视觉等价」**（仅在此口径与视口下成立，见 §9.6）。
变异自证样本（实测 computed，非推断）：删除 `w-4` 后
`{"tag":"svg","cls":"lucide lucide-plus w-4 h-4","changes":{"width":["16px","24px"],"height":["16px","24px"]}}`。

**必须如实登记的口径更正**：旧版本文件记「12 页 / 3408 元素 / 0 差异」。方向正确但**不具判别力**——
10 页本就不消费快照，计入分母会稀释结论。**权威口径更正为：2 页 / 397 元素 / 0 差异 + 2/2 变异自证通过。**

### 9.4 假阳性证伪（证明 9.3 的零差异不是口径太松）

把动画属性计回比对（`--keep-animation-props`），**同一份 CSS** 的对照组立刻出现 **8 处**噪声
（`v2/index.html` 7 处 + `api-settings.html` 1 处；属性全是 `transform`/`opacity`，
元素均为 `animate-ping`/`animate-pulse`/光晕/呼吸灯），工具按设计返回退出码 `2`。
即**对照组守卫确实能失败**。

### 9.5 附带证伪：arbitrary 类缺失不是缺陷

源码 371 个 arbitrary 类中 251 个在快照中无规则，但**均非缺失**：
`v2/*.html` 与 `episode-pipeline.html` 都加载自托管 Tailwind 运行时（JIT）；
仅有的两个**纯静态快照页** `api-settings.html`/`canvas-list.html` 实际**一个 arbitrary 工具类都没用**
（剩余 `UNKNOWN` 均为自定义类名或模板片段）。浏览器侧交叉一致：这两个页面的 DOM 中
会被重生成删除的类 = **0**。

### 9.6 边界（**不得越读**）

- 本项判定的是**计算样式等价**，**不是**像素级截图比对，**不是**视觉回归基线。
- **覆盖范围仅 2 页**（api-settings / canvas-list）——它们是目前唯一真正消费本地快照的页面。
  其余页面的样式由 JIT 运行时决定，**本地快照对它们无影响**（这本身也是本次闸门的副产物结论）。
- **未覆盖**：响应式断点（仅 1600×1000）、伪元素、`:hover`/`:focus`/`:active` 交互态、Canvas/WebGL/SVG 内部渲染。
- **重生成动作本轮未执行**。写盘覆盖既有视觉基线属破坏性操作，按 `AGENTS.md` §5 须人工明确确认。
- 本机实测 ≠ 远端 CI（脚本不入 CI）≠ 生产验收 ≠ 发布授权；执行主体为主代理，≠ 外部第三方审计。

### 9.7 待人工裁决

| 选项 | 效果 | 代价 |
|---|---|---|
| **A. 保持现状** | 快照继续含死规则；`--check` 持续返回 `1`（预期，非回归） | 快照与源码长期脱节 |
| **B. 执行 `--force` 重生成** | 快照与源码对齐，`--check` 转为 `0`；2 页实测视觉等价 | 覆盖既有制品；建议同提交附新 SHA-256 + `--diff` + §9.3 读数作证据链 |


---

## 11. 跨页状态保持 + 多窗口并发（第 4 版；证据见 `docs/governance/PHASE-10-CROSSPAGE-CONCURRENCY-EVIDENCE-2026-09-23.md`）

推进 §4 第 7 项**最后未覆盖的两块**：跨页状态保持、多窗口并发。

### 11.1 跨页状态保持（呈现层，真实浏览器）：**已测载体 PASS**

| 检查 | 结果 |
|---|---|
| `canvas_overview_density` 点击「紧凑」→ 写入 + 挂 `canvas-overview-compact`；reload 后回显 | PASS |
| `canvas_overview_sort` 页 A 设为 `name` → 新开窗口 B 读到 `name` | PASS |
| `studio_theme` 页 A 置 `light` → **已打开的**页 B 实时同步（未 reload），改回亦跟随 | PASS |
| 项目上下文载体：选 `prj-0002` → `production.html` URL 带 `?project_id=prj-0002`、`localStorage` 一致、导航链接全部重写 | PASS（**仅载体**） |

### 11.2 ⚠️ **新发现（真实缺陷）**：壳层部分路由丢失 deck 内页级元素

`v2-shell.js` 的部分路由只替换 `.topbar-master-deck` 的**下一个兄弟节点**（`<main>` 工作区），
**不替换 deck 本身**。故任何**只在某一页存在于 deck 内**的 `id`，经壳层路由进入该页后**不会出现**：

| 目标页 | 缺失的 deck 内 id |
|---|---|
| `production.html` | `currentProjectDisplayTitle` |
| `workshop.html` | `workshopProjectTitle` |
| `storyboard.html` | `storyboardNavCanvas` |
| `index.html` | `navPillDashboard`、`navPillSettings`、`uvNeedleGradCPU` |
| `projects/agents/assets/collab.html` | 无（这些页无独有 deck id） |

**截图交叉确证**（`production.html`）：整页加载 topbar 显示 `prj-0002 · 剧集制片工坊` 且 deck 含
`STAGE 未接入` 段；壳层导航进入后 topbar 变为 `PROJECT ASSET MASTER DECK` 且 **`STAGE` 段消失**。
`production-controller.js:184` 有空值保护，故**不抛异常**（全程 `pageerror = 0`），属**静默降级**。

### 11.3 多窗口并发（并发层，真实 HTTP 竞争）

**服务端 CAS 成立（PASS）**：`threading.Barrier` 让 3 线程同时以 `expected_version=1` 发 PATCH：

```
3x concurrent PATCH same expected_version=1 -> {409: 2, 200: 1}
    {"worker": 0, "status": 409, "code": "VERSION_CONFLICT", "current_version": 2}
    {"worker": 1, "status": 409, "code": "VERSION_CONFLICT", "current_version": 2}
    {"worker": 2, "status": 200, "new_version": 2}
```

恰好 1 成功 + 2 冲突，409 携带 `current_version`，符合 `AGENTS.md` §3.2（禁止静默覆盖）。

**浏览器跨窗口语义**：`localStorage` 读跨窗口可见；**实时**跟随取决于各页是否监听 `storage` 事件。
`theme.js:278` 有监听（实测同步）；`canvas-list.js` 仅在初始加载读取（**无**监听），
故 `canvas_overview_*` 在已打开窗口内**不实时跟随**。`docs/behavior/` 未检索到该实时性要求，
故**不判定为规范偏离**，仅登记为能力缺口。

### 11.4 ⚠️ **第二个新发现（真实缺陷）**：壳层部分路由丢失 `type="module"` 语义

`v2-shell.js:71-87` 的 `runRouteScripts()` 用 `createElement('script')` + `src` + `async=false`
重建页面脚本，**不保留 `type="module"`**，于是 `collab.html` 的两个模块脚本被当普通脚本执行。

| 项 | 整页加载 `/static/v2/collab.html` | 壳层导航进入 |
|---|---|---|
| `type="module"` 脚本数 | **2** | **0** |
| 未捕获 JS 异常 | **0** | **2 × `Cannot use import statement outside a module`** |

缺失脚本：`/static/js/asset-review/api.js?v=20260916-collab-team`、
`/static/js/asset-auth/api.js?v=20260916-collab-team`。

**与 §11.2 的危害等级不同**：§11.2 因控制器有空值保护属**静默**降级（`pageerror = 0`）；
本项**显式抛错**（`pageerror` 非零）。

### 11.5 附带登记（**归类修正，非新缺陷**）：`settings.html` 导航归属

首轮曾记 `settings.html`「壳层路由未到达」。再核查后更正：`projects.html` 上的「系统设置」
指向 `index.html?view=settings`（**并非** `settings.html`），点击后经服务端 `307` 落到
`settings.html#section=general`，属**正常导航**——是探针目标匹配写错，非导航失败。
已登记 `NAV_HREF_ALIAS`。**不影响 §11.2 / §11.4 两项结论**（各有截图或对照实测支撑）。

### 11.6 检测能力已固化进工具 + 变异自证

`tools/frontend_e2e_smoke.py` 新增第 6 项「壳层路由一致性」：逐页对比整页加载 vs 壳层路由的
① deck 内 `id` 集合、② `type="module"` 脚本集合、③ `pageerror` 集合，
按三类 `KNOWN_*` 基线做 **fail-closed** 判定——未登记的新缺口判 FAIL；
已登记缺口不再复现也判 FAIL 并提示移除登记（防清单腐化）。

**实测**：工具现返回 **EXIT=0**；输出区分「已知丢失 / 未登记」；
PASS 措辞已修正为「不存在**未登记**缺口」，**不再**宣称「零 JS 异常」。

**变异自证**：临时清空三个 `KNOWN_*` 表后重跑 → **EXIT=1**，逐条报出 6 个 deck 缺口 +
collab 模块丢失 + 异常（变异体仅在临时副本生效，运行后已逐字节恢复）。

### 11.7 待人工裁决（**新增 3 项**）

| # | 裁决项 | 选项 | 建议 |
|---|---|---|---|
| 1 | 壳层部分路由丢失 deck 内页级元素（§11.2） | **A** 维持现状（该标题在壳层导航后不显示）；**B** 让部分路由同时协调 deck 内的页级元素；**C** 把页级元素从 deck 移入工作区 | **B**——A 会让两条路径呈现不一致；C 会动已冻结的视觉结构 |
| 2 | 壳层部分路由丢失 `type="module"` 语义（§11.4） | **A** 维持现状（协作页模块能力不可用 + 抛错）；**B** 在 `runRouteScripts()` 中保留 `type="module"`；**C** 改写协作页不再依赖 module 脚本 | **B**——最小且直接消除抛错；C 会改动已冻结页面结构 |
| 3 | `canvas-list.js` 视图偏好跨窗口实时同步（§11.3） | **A** 维持现状（下次加载生效）；**B** 补 `storage` 监听 | **A**——无规范支撑，不建议扩大改动面 |

三项均属**共享层改动**（`v2-shell.js` 影响全部 v2 页面），按 `AGENTS.md` §5 须人工确认后实施。

### 11.8 边界（**不得越读**）

- 仅 1600x1000 视口、headless Chrome、本地单进程 `python run.py`。
- 未覆盖：响应式断点、`:hover`/`:focus` 交互态、浏览器前进/后退栈完整性、真实多用户会话。
- 并发测试为**单进程 in-memory 存储**（重启即丢、多 worker 不共享，属既有登记项）；
  验证的是 **CAS 语义**，**不是**跨进程/跨实例的分布式一致性。
- 未做压力/长稳测试（并发度 3、单轮）；未验证「多窗口 + 服务端并发」组合下的 UI 呈现。
- 截图与探针仅落系统临时目录，**不入仓**。
- 本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权；执行主体为主代理，≠ 外部第三方独立审计。

### 11.9 对 §4 第 7 项的更新

- 原状态：契约层 5/5 PASS；加载期 + 7 项交互 smoke 已闭环；**跨页状态保持、多窗口并发未覆盖**。

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

---

## 12. 前进/后退栈完整性 + 连续导航（第 6 版改进；证据见 `docs/governance/PHASE-10-CROSSPAGE-CONCURRENCY-EVIDENCE-2026-09-23.md` §3.7–§3.8）

### 12.1 闭环对象

§11.8 曾把「浏览器前进/后退栈完整性」明确登记为**未覆盖**。本轮以真实浏览器探针补测，
并因为改用「同一 context 内**连续**交替导航」而**暴露出第 6 项检查看不见的第三个真实缺陷**。

### 12.2 前进/后退 URL 与 deck 状态：**PASS**

`projects.html → production.html → workshop.html` 后依次 `back × 2`、`fwd × 2`：

| 断言 | 结果 |
|---|---|
| `back1` 回到 production.html | true |
| `back2` 回到 projects.html | true |
| `fwd1` 回到 production.html | true |
| `fwd2` 回到 workshop.html | true |
| deck `[id]` 集合与整页加载一致 | true |
| `back` 时 `<main>` 工作区复原 | true |

即**历史栈本身的 URL 与工作区复原语义正确**；缺陷出在「每次部分路由的脚本注入方式」。

### 12.3 ⚠️ **第三个新发现（真实缺陷）**：脚本元素单调累积 + 重复声明抛错

**实测（同一 context，从 projects.html 出发，5 步交替导航）**：

| 目标页 | script 元素数（起始 → 最终） | 净增 | 未捕获异常 |
|---|---|---|---|
| index.html | 7 → 33 | +26 | 0（静默） |
| production.html | 7 → 24 | +17 | 0（静默） |
| workshop.html | 7 → 21 | +14 | **2** |
| storyboard.html | 7 → 27 | +20 | 0（静默） |
| agents.html | 7 → 27 | +20 | 0（静默） |
| settings.html | 7 → 33 | +26 | 0（静默） |
| assets.html | 7 → 24 | +17 | 0（静默） |
| collab.html | 7 → 33 | +26 | **6** |

**根因**：`v2-shell.js` 的 `runRouteScripts()`（`:71-87`）每次部分路由都向 `<body>`
**追加**目标页脚本，**从不移除上一次注入的脚本**：

- 含**顶层 `const`** 的内联脚本第二次执行即抛
  `Failed to execute 'appendChild' on 'Node': Identifier 'V2Workshop' has already been declared`
  （`workshop.html` 内联 `<script>` 以 `const V2Workshop = ...` 起头，故第 2 次进入即抛错，script 数 15）；
- `collab.html` 的两条 module 脚本被反复降级执行（§11.4 同一根因），每次抛
  `Cannot use import statement outside a module`（5 步共 6 次）；
- 其余页面内联脚本未用顶层 `const`/`let`，故**静默累积**、无异常，只能靠 script 计数发现。

**为何此前未发现**：第 6 项检查每个目标页**只做一次**壳层导航，累积量等于单步增量，
既不触发重复声明，也不产生可比较的基线差异。**这解释了 §11.4 的 module 丢失为何只在
「反复到达」时才升级为持续抛错。**

**未发生整页回退**：`console` 无 `v2-shell.js:139` 的 `partial route failed ... falling back`
告警；`framenavigated` 记录为同 URL 的 SPA `pushState`。

### 12.4 工具自身缺陷（**已修正，非被测站点缺陷**）：`stdout=PIPE` 写满阻塞

**症状**：连续导航时 `Page.goto` 间歇性 30s 超时；而同一服务用 `urllib` 直连
`/healthz` 与 `/static/v2/projects.html` 均 200、耗时 < 0.1s —— **服务端健康，脚手架挂起**。

**根因**：`tools/frontend_e2e_smoke.py` 的 `start_server()` 用
`stdout=subprocess.PIPE, stderr=subprocess.STDOUT` 且**从不读取**。服务端持续写访问日志，
Windows 管道缓冲（约 4–8KB）写满后子进程阻塞在 `write()`，后续 HTTP 请求全部挂起。

**对照实验（判定性）**：仅把子进程输出从 `PIPE` 改为重定向到**临时目录日志文件**，
同一脚本、同一浏览器、同一序列立刻全程通过（连续 8 轮交替导航 script 13→55 稳定递增、
零超时；服务端日志 6116 字节）。

**修正**：`start_server()` 返回 `(进程, 日志句柄)`，日志写入 `artifacts_dir/server.log`
（**系统临时目录，不入仓**），收尾关闭句柄。
`tools/tailwind_snapshot_visual_equiv.py` 原本即用 `DEVNULL`，不受影响。

### 12.5 检测能力已固化进工具 + 变异自证

`tools/frontend_e2e_smoke.py` 新增**第 7 项「连续壳层导航稳定性」**：
在同一 context 内对每个目标页做 5 步交替导航（target ⇄ projects.html），断言

1. 每一步都**真实到达**目标页（URL 路径与目标一致，`settings.html` 走 `NAV_HREF_ALIAS`）；
2. `document.querySelectorAll('script').length` **不产生未登记的累积**；
3. **不出现未登记的未捕获 JS 异常**。

配两类 fail-closed 登记表：

- `KNOWN_REPEAT_NAV_SCRIPT_GROWTH`（8 个页面的累积）；
- `KNOWN_REPEAT_NAV_PAGE_ERRORS`（`workshop.html` 的 `V2Workshop` 重复声明；`collab.html` 的 module 降级）。

未登记 → FAIL；**已登记但不再复现 → 同样 FAIL 并提示移除登记**（防清单腐化）。

**实测**：脚本 **EXIT=0**，8/8 目标页全部「到达 + 累积已登记 + 无未登记异常」。

**变异自证（证明断言非恒真）**：清空上述两张登记表后重跑 → **EXIT=1，共 10 条 FAIL**：

- 8 条「script 元素累积未登记」（+26 / +17 / +14 / +20 / +20 / +26 / +17 / +26）；
- `workshop.html` 未登记异常（`V2Workshop` 重复声明）×1；
- `collab.html` 未登记异常（module 降级）×1。

变异体只作用于**临时副本**，正式文件未受影响。

### 12.6 待人工裁决（**新增 1 项，编号 1c**）

| # | 裁决项 | 选项 | 建议 |
|---|---|---|---|
| 1c | `runRouteScripts()` 每次部分路由**只追加不替换**脚本 → script 元素单调累积；含顶层 `const` 的内联脚本重复声明抛错，module 脚本重复降级（§12.3） | **A** 维持现状（连续导航后页面能力退化 + 持续抛错）；**B** 注入前**先移除本页上次注入的脚本**（等价替换）或给注入脚本加稳定标记做幂等；**C** 每次部分路由对目标页脚本做整组替换 | **B**——最小改动直接消除累积与重复声明；且与 §11.4 的 module 修复落在**同一处代码**，建议**合并为一个变更**一并实施 |

至此，§11.7 的三项 + 本项的 **1 / 1b / 1c 三项**同属 `v2-shell.js` 共享层改动，
按 `AGENTS.md` §5 须人工确认后实施。

### 12.7 边界（**不得越读**）

- 仅 1600×1000 视口、headless Chrome、本地单进程 `python run.py`；
  未覆盖响应式断点与真实多用户会话。
- 仅验证**部分路由**路径；整页加载路径无此累积。
- 未做长稳/压力测试（每页 5 步、单轮）。
- 探针与日志只落系统临时目录，**不入仓**。
- 本机实测 ≠ 远端 CI（第 7 项不入 CI）≠ 生产验收 ≠ 发布授权；
  执行主体为主代理，≠ 外部第三方独立审计。

### 12.8 对 §4 第 7 项的再次更新

- 原状态：跨页状态保持与多窗口并发已补测；契约层 5/5 PASS；**但仍有两个壳层路由待裁决缺陷**。
- 现状态：前进/后退栈完整性**已补测**（URL 与工作区复原 PASS）；
  **新发现第三个壳层路由真实缺陷（脚本累积/重复声明）**，
  故第 7 项**仍不得写为全部闭环**——已从「两缺陷」升级为「**三缺陷 + 一项工具缺陷已修正**」。

- 现状态：**跨页状态保持（载体已测）** 与 **多窗口并发（CAS 语义）** 已补测；
  但**新发现 §11.2 的壳层路由缺陷**，故第 7 项**仍不得写为全部闭环**——
  已从「未覆盖」转为「已覆盖并发现待裁决缺陷」。

---

---

## 13. 需人工裁决清单（终稿汇总，2026-09-23 第 8 版）

### 13.1 工程类待裁决（**均须人工确认后实施**，`AGENTS.md` §5）

| # | 裁决项 | 位置 | 选项 | 建议 |
|---|---|---|---|---|
| 1 | Tailwind 快照是否执行 `--force` 重生成 | §4 第 3 项；`TASKS.md` T83 | A 保持现状（快照陈旧）；B 授权 `--force` 覆盖 | **B**——已实测**视觉等价**（2 页 / 397 元素 / computed 差异 0 + 2/2 变异自证），且生成链路可复现 |
| 2 | 壳层部分路由丢失 deck 内页级元素 | §11.2 / §11.7 裁决项 1；证据 §3.2 | A 维持现状；B 部分路由同时协调 deck 内页级元素；C 改页面结构 | **B**——A 会让两条到达路径呈现不一致 |
| 3 | 壳层部分路由丢失 `type="module"` 语义 | §11.4 / §11.7 裁决项 1b；证据 §3.4 | A 维持现状；B `runRouteScripts()` 保留 `type="module"`；C 改写协作页 | **B**——最小且直接消除抛错 |
| 4 | `runRouteScripts()` 只追加不替换 → 脚本累积 / 重复声明 | §12.6 裁决项 1c；证据 §3.7 | A 维持现状；B 注入前先移除本页上次注入的脚本；C 整组替换 | **B**——最小改动；与第 3 项落在**同一处代码**，建议**合并为一个变更** |
| 5 | `degradation.js` 是否为 401/403/409 补语义映射 | §10.4；交互矩阵证据 §4.3 | A 维持现状；B 补映射向已冻结规范收敛 | **B** |
| 6 | `canvas-list.js` 视图偏好跨窗口实时同步 | §11.3 / §11.7 裁决项 3；证据 §3.3 | A 维持现状；B 补 `storage` 监听 | **A**——无规范支撑，不建议扩大改动面 |

第 2/3/4 项同属 `v2-shell.js` 共享层，建议**合并实施**（一次变更、一次复核）。

### 13.2 治理类待裁决（**不可由工程自决**）

| # | 裁决项 | 状态 | 说明 |
|---|---|---|---|
| 7 | 公开发布授权 | **仍未授权** | 仓库维持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**，须人工签署 |
| 8 | 委托外部第三方独立审计机构（T36 / T40） | **仍未闭环** | 同框架代理复核**不能**替代；本轮再次尝试派发亦失败（见 §13.3） |

### 13.3 本轮独立复核通道状态（**如实登记**）

- 按用户「独立复核和第三方独立审计交其他 agent 做」的指示，本轮以**三种方式**再次尝试派发只读独立复核代理：
  ① 直接 `spawn_agent` 传完整任务正文；② 任务书写盘（`%TEMP%\gw-v7-briefs\BRIEF-V7.md`）+ 极短消息指路径；
  ③ `fork_turns=all` 全上下文分叉。**三次均复现「任务正文未送达」**——代理只回「我已就位，请给出具体任务」。
- 另探测 Orca 编排通道（`orca orchestration run-current`）：因 **Orca 应用未运行**（`orca-runtime.json` 不存在）不可用。
- **故本轮 T88–T90 的新增发现仅有主代理自测证据，未取得任何独立复核结论**；
  该独立性缺陷如实登记，**不得写成「已独立复核」**。

### 13.4 已本地闭环、**无需**裁决的事项（本轮复算新增）

| 项 | 原状态 | 现状态 | 依据 |
|---|---|---|---|
| T35/T61 的 O4（生成器） | 不存在、不可复现 | **已补齐** | T83；`tools/build_static_tailwind_utilities.py` |
| T35/T61 的 O5（死类） | 未修正、待授权 | **已修正** | T84；`src/` 内 `py-0.2` 残留 0 |
| T35/T61 的 R6-7（会话绝对上限） | 未闭环 | **已闭环** | T47；`session.py` + 专项测试通过 |
| T35/T61 的 `static/js/canvas/http.js` 删除 | 待裁决（破坏性） | **已执行并闭环** | `cdf78a1`（2026-09-22）；`src/` 内零引用 |
| T26 子项 1（`asset-share.html` 缺参提示） | 待裁决 | **已实现且实测通过** | T93；实测返回「缺少分享令牌」提示，200 + `pageerror = 0` |
| T26 子项 2（P8-A1 扫描器） | 已自注闭环 | **保持闭环** | `TASKS.md` 原文 |

O6（tracked 计数口径）**无待办动作**：现值 387（历史行保持原样）。

### 13.5 仍未闭环、**不得写 PASS** 的清单

1. T36 / T40 外部第三方独立审计（须外部机构）
2. 公开发布授权
3. Tailwind 快照 `--force` 写盘（待第 13.1 节第 1 项裁决）
4. 三个 `v2-shell.js` 共享层缺陷（待第 13.1 节第 2/3/4 项裁决）
5. 真实外部 IdP 生产登录（需真实 OP + 凭据 + 环境；7 个 skip 即此处）
6. T46 的 140 条未实现端点（仅统一口径，实现状态未变）
7. 内存存储（重启即丢、多 worker 不共享）
8. `degradation.js` 语义映射（待第 13.1 节第 5 项裁决）
9. 完整交互矩阵的「全部闭环」结论（因上述三个壳层缺陷未修，**不得**写为全部闭环）

### 13.6 边界声明

- 本清单所有实测均为**本机**证据（1600×1000 headless Chrome + 真实 HTTP / 本机只读复算）。
- **本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权**。
- 最近一次已读回的 CI 成功：run `35870276155`，headSha `f12e177`（T92 提交）；
  其只证明该 SHA 在 CI 环境通过测试与卫生检查。
- **同框架代理复核 ≠ 外部第三方独立审计**；本轮独立复核通道故障已如实登记（§13.3）。
- **清单已扩容**：本节之外，§14.7 另登记第 9 / 10 项待裁决（顶栏静默裁剪是否修复、
  第 8 项是否保留为常驻本地门禁）。截至第 9 版，**待人工裁决合计 10 项**。

---

## 14. 第 8 项 E2E：顶栏可达性（2026-09-23 第 9 版）

### 14.1 为什么要加这一项

第 1–7 项的观测量是 pageerror / 静态资源 4xx / API 4xx / DOM 集合差 / 脚本累积。
顶栏（`.topbar-master-deck`）同时满足两个条件，使这些观测量**全部失效**：

1. `hardware-design-system.css:74` 用 `!important` 把 header 高度**钉死**为 116px；
2. 9 个 v2 页面的 header 都带 `overflow-hidden`（如 `index.html:360`）。

于是控件超宽时被**静默裁掉**：不抛异常、不出滚动条、不产生 4xx。
「七项全绿但控件已点不到」正是这个盲区。

### 14.2 判定口径（机械、可复算）

3 个视口（1920x1080 / 1600x1000 / 1366x768）× 9 页，对两个必达控件
（`#topbarUnifiedTrashBtn`、`#masterDeckDate`）：

1. 算 header 可见裁剪矩形（扣除 `padding`）；
2. 取控件与裁剪矩形的**可见交集**；
3. **中心点 hit-test**：`document.elementFromPoint()` 必须命中控件自身或其后代；
4. **判别力闸门**：`visibleWidth >= max(24px, 控件自身宽度 × 60%)`（24px 锚定 WCAG 2.2 SC 2.5.8）。

登记表 fail-closed：**未登记 → FAIL**；**已登记但全部视口均不再复现 → 同样 FAIL**（防清单腐化）。

**判别力闸门不是可选项**：1920 下 `index.html` 的回收站仅剩 **4px** 可见（36px 控件的 11%），
而 hit-test **仍命中自身**——只做 hit-test 会把它判成 PASS。

### 14.3 实测结论（本机，1600 级 headless Chromium + 真实 HTTP）

| 指标 | 实测 |
|---|---|
| 顶栏横向溢出（27 个「页面-视口」组合） | **25 个存在**（1920 下 7、1600 下 9、1366 下 9） |
| `#topbarUnifiedTrashBtn` 不可用 | **23 / 27**（仅 `workshop.html`、`settings.html` 在 1920 与 1600 下共 4 个组合可用） |
| `#masterDeckDate` 不可用 | **4 / 27**（全部在 1366x768） |

一句话：**统一回收站入口在 1920x1080 下，9 页里有 7 页鼠标点不到。**

成因证据链：`hardware-design-system.css:74`（`height:116px !important`）→
9 页 header `overflow-hidden` → 控件总宽在窄视口下超过可视宽度 → 静默裁剪。

### 14.4 变异自证

`--mutation-selftest` 以 `ignore_registry=True`（清空两张登记表）重跑第 8 项，
实测报出 **23 条 FAIL**（27 个不可用组合按「视口+页面」聚合后为 23 条），
证明该判定**非恒真**；若变异体零失败，工具以退出码 `2` 直接作废结论。

主运行（含登记表）退出码 **0**：无未登记缺口、无登记腐化。

### 14.5 本轮修正的工具**自身**缺陷（2 处，如实登记）

1. **假 FAIL**：「已登记但不再复现」初版在**逐视口**内做 `set(registered) - set(observed)` 差集，
   而登记表按**页面**聚合（一条记录覆盖三个视口），导致每个视口都把自己没有的组合误报为「已消失」，
   实测曾产生 **23 条假 FAIL**。修正为：跑完该页全部视口后用**三视口观测并集**比较。
2. **证据未落盘**：变异自证结果初版只留在内存，未写进 JSON 报告，事后无法复核。
   修正为写入 `e2e-report.json` 的 `topbar_mutation_selftest`（含 `failure_count` 与明细）。

### 14.6 边界（不得越读）

- 全部为**本机**实测；该工具依赖 Playwright，**不接入 CI**。
  **本机实测 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权。**
- 本项只覆盖 **2 个控件 × 3 个视口**；顶栏其余控件与更多视口**未纳入分母**，
  不得据此断言「顶栏整体只有这些问题」。
- 本项只测「能否命中且可见宽度达标」，**未测键盘可达性**与「被裁控件是否有替代入口」。
- **未修复**：本项只测量与登记，**没有**改动任何 CSS / 页面结构。

### 14.7 新增待裁决项

| # | 裁决项 | 选项 | 建议 |
|---|---|---|---|
| 9 | 顶栏控件在大范围视口下被静默裁剪（回收站入口 23/27 组合不可用） | A 维持现状并登记；B 修复顶栏布局；C 改 header 尺寸/`overflow` 约束 | **B** —— 统一回收站是核心入口，1920 下 9 页有 7 页点不到；但属**视觉设计变更**，须人工确认 |
| 10 | 修复后是否保留第 8 项为常驻本地门禁 | A 保留；B 移除 | **A** —— 该维度是前 7 项的结构性盲区，去掉后同类回归将失去检测能力 |

> 第 9 项若裁决修复，须同步从 `tools/frontend_e2e_smoke.py` 的
> `KNOWN_TOPBAR_OVERFLOW` 与 `KNOWN_TOPBAR_UNREACHABLE` 移除对应条目，
> 否则守卫会以「已登记但不再复现」判 FAIL。

### 14.8 门禁复核

- `python -P -m pytest -q` → **487 passed / 7 skipped**
- `python -P -m pytest tests/hygiene -q` → **16 passed**
- `python -P tools/frontend_e2e_smoke.py --serve --mutation-selftest` → 退出码 **0**，变异体 23 条 FAIL

证据文档：`docs/governance/PHASE-10-TOPBAR-OVERFLOW-EVIDENCE-2026-09-23.md`
台账登记：`docs/governance/TASKS.md` **T94**
