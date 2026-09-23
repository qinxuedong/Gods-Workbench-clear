# HANDOFF-9 —— 2026-09-22 交接文档（T26 五段切片全部完成）

> 交接时间：2026-09-22
> 仓库：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`
> 基线：`8e3923708b2638c72733847b83c261299e9941f0`（`HEAD == origin/master`，`0/0`）
> 工作树：干净（`git status --short` 空输出）
> 远端 CI：run `35734488826` → `conclusion = success`，`headSha` 与基线逐字一致
> 发布状态：**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**（未变）
> 上位文档：`AGENTS.md`、`HANDOFF-5.md` ~ `HANDOFF-8.md`、`docs/governance/TASKS.md`、`CLEANROOM-STATUS.md`

---

## 1. 本轮做了什么（一句话）

按 `HANDOFF-8.md` 的用户裁决第 2 项，把 T26 规定的**五段实现顺序**
（素材库 → 观测 → 提示词库 → 设置页 → 画布闭环）**全部走完**，
并把每段都做成「契约冻结 → 实现 → 黄金夹具 → 契约测试 → 变异验证 → 全量门禁 → 提交读回 CI」的本地闭环。

T26 五段状态：**素材库 ✅ → 观测 ✅ → 提示词库 ✅ → 设置页 ✅ → 画布闭环 ✅**

---

## 2. 本轮提交（`714414a` → `8e39237`，共 25 个提交）

### 2.1 五段切片

| 提交 | 阶段 | 契约版本 | 方法条目 / 独立路径 | 夹具累计 | 远端 CI |
|---|---|---|---|---|---|
| `aff8f2d` | Phase 10A 素材库 | `p10a-frozen-1` | 3 / 3 | 9→15 | `35706164022` ✅ |
| `0e89c2c` | Phase 10B 观测 | `p10b-frozen-1` | 8 / 8 | 15→17 | `35709942468` ✅ |
| `f9d8830` | 10B R3 修复（审计源不可读须如实降级） | — | 3 项缺口 | 17 | `35712038549` ✅ |
| `23c2c47` | Phase 10C 提示词库 | `p10c-frozen-1` | 7 / 4 | 17→22 | `35713264082` ✅ |
| `151669d` | Phase 10D 设置页 | `p10d-frozen-1` | 13 / 8 | 22→27 | `35720901338` ✅ |
| `e93b6f1` | Phase 10E 画布闭环 | `p10e-frozen-1` | 20 / 15 | 27→33 | `35725815507` ✅ |

> 上表「方法条目 / 独立路径」为主代理用 `yaml.safe_load` 实测所得；
> 后端装饰器路由总数由 `714414a` 的 22 条增至 `e93b6f1` 的 73 条（五段新增加 51 条）。

### 2.2 治理纠错提交（Phase 10E 复核阶段）

| 提交 | 内容 | 远端 CI |
|---|---|---|
| `09b96cc` | 修正文档口径漂移（路径计数 17→15、回收站端点名 `/api/canvas-trash`→`/api/canvases/trash`） | `35730545813` ✅ |
| `8ad66ef` | 修正夹具口径（素材索引空快照为**三类**，非五类）+ 重算 provenance 哈希 | `35732570754` ✅ |
| `92e3a2e` | 补录变异证据 M4–M6 | `35733720926` ✅ |
| `fb65622` | TASKS.md 变异计数同步 3/3 → 6/6 | `35734004108` ✅ |
| `8e39237` | 5.3 节：独立复核边界 + 自证证据 | `35734488826` ✅ |

---

## 3. 当前门禁证据（HEAD `8e39237` 本机实测）

```text
python -P -m pytest -q                          ->  487 passed, 7 skipped
python -P -m pytest tests/hygiene -q            ->  16 passed
python -P -m pytest tests/contracts/test_phase10e_canvas_closure.py -q  ->  43 passed
node --check（全部 tracked *.js，57 个）          ->  0 failed
```

- 黄金夹具清单：**33 条**（含 6 件 `canvas-closure-*.json`）。
- 输入登记 `docs/provenance/PHASE-2-INPUT-SHA256.txt`：**仍为 16 条**，逐条哈希与当前文件一致（CRLF 归一为 LF）。
- 变异测试：Phase 10E 共 **6 次**（M1–M6），全部按预期失败并**逐字节还原**，还原后 43 passed。
- 阶段报告：`docs/governance/PHASE-10E-CANVAS-CLOSURE-2026-09-22.md`（含 §5.1 变异、§5.2 默认运行时边界、§5.3 复核边界）。

---

## 4. 当前卡点

### 4.1 卡点一：独立复核通道不可用（**本项目最关键的流程卡点**）

连续尝试均失败，与 `HANDOFF-8.md` §3.1 同源：

| 通道 | 尝试 | 结果 |
|---|---|---|
| `spawn_agent`（Codex 子任务） | 多次，串行 | 代理**只收到环境上下文**，任务正文未送达；回「请说明要做什么」；部分实例直接 `429 Too Many Requests` |
| `followup_task` / `send_message` | 多轮 | 消息可送达，但代理侧**未读取任务正文** |
| Orca worker（`orca orchestration`） | 多次 | 终端反复重连、零落盘；`worker-stop` |

**结论**：本轮**没有外部独立复核**，已如实登记在
`docs/governance/PHASE-10E-CANVAS-CLOSURE-2026-09-22.md` §5.3，
不得因 CI 变绿而视为已审计。代以**主代理本机对抗式重算**（契约↔`app.openapi()` 比对、
TestClient 实测 503/CAS/别名/401-403、同步复算 Phase 10D）。

### 4.2 卡点二：需用户裁决（不能自主推进）

| 编号 | 事项 | 为何需要用户 |
|---|---|---|
| T36 / T40 | 第三方独立审计与发布授权 | **外部阻断**，须外部委托 |
| T35 / T61 | O4 Tailwind 预构建路径、O5 死类修正（视觉变更）、O6 | 需用户新裁决 |
| P10-R-1 | `AGENTS.md` 401 大小写口径漂移（宪章写 `Unauthorized`，实现/黄金夹具/契约测试为**全大写** `UNAUTHORIZED`；实现与 `core/errors.py`、`docs/fixtures/canvas-auth-401.json` 及全部契约测试逐字一致） | **用户 2026-09-23 裁决 A：以实现为准（全大写 `UNAUTHORIZED`）**，契约侧小写写法已更正；**注：真实差异为纯 ASCII 大小写，非同形字**——此前「含同形字的小写」表述系终端渲染伪影导致的误判，已更正 |
| — | 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` | 按用户裁决**不建立** |
| T46 | 未实现端点口径统一（当前 140 条） | 属产品裁决 + 大工程量 |

### 4.3 卡点三：需外部安排

- **第三方独立审计**（T36/T40）：本仓不能自主完成；发布授权**依赖审计完成**。
- **真实外部 IdP 生产登录**：需真实 OP + 凭据 + 环境。

---

## 5. 下一步计划

### 5.1 立即可做（拿到独立复核通道后）

1. **修复复核通道**：下一轮派发时**消息体自带全部指令**（不依赖代理读文件），
   首段写死「只读 + 禁 `git` 写 + 报告输出路径」；若 `429` 则**串行派发、一次一个**。
2. **对 Phase 10A–10E 五个切片各派一次独立复核**，任务书建议落在
   `docs/governance/agent-briefs-2026-09-22/`（`HANDOFF-8.md` §4.4 已有先例）。
3. 复核重点是**零伪造 + fail-closed + CAS + 方法别名**四类守卫，以及
   文档数字与实际实现是否一致（本轮 3 处缺陷均为「文档口径 ≠ 实际」类）。

### 5.2 等用户裁决后执行

1. ~~P10-R-1 401 口径~~ → **已由用户 2026-09-23 裁决 A 收口**：以实现为准（全大写 `UNAUTHORIZED`），`docs/contracts/SETTINGS-INTERFACE-CATALOG.yaml` 的小写写法已更正为全大写；真实差异为**纯 ASCII 大小写**，**非同形字**。
2. T35 / T61 的 O4 / O5 / O6 → 按新裁决落地。
3. 根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` → 按用户给定范围建立。
4. T46 口径统一 → **追加更正、不改写历史行**。

### 5.3 需外部推进

1. 第三方独立审计 → 委托外部机构；完成后才评估发布授权。
2. 真实外部 IdP 生产登录 → 落实 OP / 凭据 / 环境后端到端验证。

---

## 6. 未闭环清单（**不得写 PASS**）

- 真实第三方独立审计与发布授权：**未安排**；仓库仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION。
- **全部存储仍是进程内内存**，重启即失、多 worker 不共享。
- 视频渲染、素材打包下载、素材挂接、共享文件夹真实目录扫描 / 导入：**未接入**，端点固定 fail-closed
  （503 且不携带 `task_id`/`progress`/`eta`/`url`）。
- 真实外部 IdP **生产**登录：未做。
- **前端真实浏览器 E2E**：未执行。
- `asset-manager` / `api-settings` / `task-center` 三块大功能面：仍「未纳入当前切片」。
- 前端引用端点基线（Phase 10E 后主代理重扫实测，非转述常量）：
  - 前端引用的归一化 `/api` 路径 **189** 条 = **已实现 49** + **未实现 140**（两者无交集）；
  - 后端静态解析出的路由路径 **55** 条；
  - 同一口径下的相位对比（主代理逐提交重扫，`714414a` → HEAD）：
    已实现 **12 → 49**（五段切片共新增 37 条），未实现 **177 → 140**，前端引用总数恒为 **189**（未删基线条目）。
  - 注意：`HANDOFF-8.md` §8.1 记录的 `188 / 14 / 8 / 180` 是**另一套计数口径**
    （「后端已实现路由总数」「前端调用且后端已实现」分开计），与本文件的
    「前端引用 ∩ 后端路由」口径不可直接相减，故不在此做跨口径差值。
  - 140 条未实现端点保持未实现，未伪造数据。
- 默认运行时会预置 `cv-0001`（Phase 8 既有行为，本阶段未改），故默认进程内 `/api/canvas-assets` 的
  `canvases` **非空**；空快照夹具只对应显式空来源服务。见 10E 报告 §5.2。

---

## 7. 复现入口

```powershell
cd "D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear"
git rev-parse HEAD              # 应为 8e3923708b2638c72733847b83c261299e9941f0
git rev-parse origin/master     # 应与上一行一致
git rev-list --left-right --count origin/master...HEAD   # 应为 0    0
git status --short              # 应为空
python -P -m pytest -q                                   # 487 passed, 7 skipped
python -P -m pytest tests/hygiene -q                     # 16 passed
gh run list --limit 3 --json databaseId,headSha,status,conclusion
python run.py                                            # 本机端口 2077
```

关键文件索引：

| 用途 | 路径 |
|---|---|
| 五段契约 | `docs/contracts/{ASSET-LIBRARY,OBSERVABILITY,PROMPT-LIBRARY,SETTINGS,CANVAS-CLOSURE}-INTERFACE-CATALOG.yaml` |
| 领域模块 | `src/gods_workbench/{asset_library,observability,prompt_library,settings,canvas_closure}/` |
| 路由 | `src/gods_workbench/api/routes_{asset_library,observability,prompt_library,settings,canvas_closure}.py` |
| 五段契约测试 | `tests/contracts/test_phase10{a,b,c,d,e}_*.py` |
| 夹具清单 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`（33 条） |
| 输入登记 | `docs/provenance/PHASE-2-INPUT-SHA256.txt`（16 条） |
| 阶段报告 | `docs/governance/PHASE-10D-SETTINGS-2026-09-22.md`、`docs/governance/PHASE-10E-CANVAS-CLOSURE-2026-09-22.md` |
| 任务台账 | `docs/governance/TASKS.md`（T74–T79 为本轮五段） |

---

## 8. 边界重申

- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；字体白名单放行 ≠ 分发授权。
- 本轮所有证据为**本机实测 + 远端 CI 读回**，**不等于**生产验收，**不等于**第三方独立审计。
- 口径链：**本机通过 ≠ 远端 CI ≠ 生产验收 ≠ 发布授权**。
- 本轮**未建立独立复核**（§4.1），此缺陷**不因 CI 变绿而消失**。

---

## 9. 本文件引入提交与远端 CI 实测（2026-09-22 追加）

本节记录**引入本文件的那一次提交**；本节自身若后续追加修订，其 SHA 以
`git log --oneline -1 -- HANDOFF-9.md` 与 `docs/governance/TASKS.md` T80 登记为准。

> 说明：头部 §0 的基线 `8e39237` 是**代码基线**（本文件引入前的最后一个代码提交），
> 不随本文档自身的追加提交变动。

- 提交：`8c225fc5e71046e0164a41b8e4935c0a8b49b478`（「HANDOFF-9：T26 五段切片交接文档（已完成 / 卡点 / 下一步 / 未闭环清单）」），改动 1 文件 / +183 行。
- 推送：`git push origin master` → `8e39237..8c225fc  master -> master`。
- 推送后读回：`git rev-parse HEAD` = `git rev-parse origin/master` = `8c225fc...`；`git rev-list --left-right --count origin/master...HEAD` = `0` 与 `0`（0/0）。
- 远端 CI：run `35736938358` → `status = completed`、`conclusion = success`、`headSha` 与 `8c225fc...` 逐字一致（`gh run list --json databaseId,headSha,status,conclusion` 读回）。
- 提交前本地门禁复跑：`pytest` **487 passed, 7 skipped**；`tests/hygiene` **16 passed**。
- 同形字守卫：本文件不含西里尔/零宽等可疑码点（主代理逐字符扫描实测 0 命中）。
- **边界**：CI success **不等于**生产验收，**不等于**第三方独立审计，**不等于**发布授权。§4.1 登记的「未建立外部独立复核」缺陷**不因 CI 变绿而消失**。
