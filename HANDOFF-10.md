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

### 2.4 O4：补 `tools/` 脚本 ✅（附**需人工裁决的重大发现**）
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
- **⚠️ 需人工裁决（本轮未执行）**：用当前源码重新生成会**大范围改变快照**——
  规则级 diff 为**移除 384 条 / 新增 311 条**（例：移除源码中已不存在的 `accent-black`、`aspect-[4/3]`、
  `-left-0.5`；新增源码中的 `bg-[#050609]`、`backdrop-blur-[2px]`）。
  即**当前快照已陈旧（stale），与源码实际类集脱节**。
  重新生成 = **可见视觉变更**，按 `AGENTS.md` §5.3 须人工确认，**本轮未执行**（快照保持 HEAD 原字节）。

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
3. **Tailwind 快照重生成**：快照已陈旧（规则级 −384 / +311），重新生成 = 视觉变更，**须人工裁决**。
4. **真实外部 IdP 生产登录**：需真实 OP + 凭据 + 环境。
5. **T46 的 140 条未实现端点**：仅统一了口径，实现状态未变，仍全部 fail-closed。
6. **内存存储**：重启即丢、多 worker 不共享，未接入数据库。
7. **前端真实浏览器 E2E**：**加载期已闭环（§6）**；**交互期已闭环确定性 smoke 7 项（§8）**；**完整交互矩阵仍未执行**（表单写入、CAS 409 用户可见提示、202 轮询收敛、403 只读降级、跨页状态、多窗口并发）。

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
  交互期的完整矩阵（表单写入、CAS 409 用户可见提示、202 轮询收敛、403 只读降级）**仍未执行**，见 §8。

---

## 8. 交互期 E2E（提交 `e5fd4cc02a2daa165938143b84582cdeffd4f540`，CI run `35846070233` = success）

### 8.1 新增 7 项确定性交互断言（全部断言真实 DOM 变化）

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

### 8.2 变异测试（证明断言非恒真）

把搜索空态断言改成 `cards === 999`（必然为假）后，该守卫确实 **FAIL**、退出码 **1**，
证明 7/7 的通过不是恒真产物。变异体已删除，`git status` 无残留。

### 8.3 自我纠错（如实登记）

首轮交互断言实测仅 **4/7** 通过，暴露的是**我的断言口径错误**而非产品缺陷：

- `#topbarToggle` **不存在**——真实控件是 `#themeToggle`，且它位于 `#v2MainSettings`（默认 `hidden`），
  其绑定 `initSettingsModule()` 只在切到设置视图时执行；正确前置是**先切视图再点**。
- 设置分区按钮**不写** `aria-pressed`（实测 `null`），原断言必然失败；改为断言 `active` 类 + computed `display`。
- 导航真实 URL **带 query**（`workshop.html?project_id=prj-0001`），原 `endswith('.html')` 失败；改为按路径比较。

### 8.4 边界（**不得越读**）

本项是**确定性交互 smoke**，不是完整交互矩阵。**未覆盖**：表单写入（新建/编辑项目、上传素材）、
CAS 409 冲突的用户可见提示、`202 Accepted` + `poll_hint` 的轮询收敛、403 只读降级、跨页状态保持、多窗口并发。
上述仍需独立用例 + 真实后端状态；不得宣称交互期全部闭环。
