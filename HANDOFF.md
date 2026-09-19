# HANDOFF — `main.py` 拆分项目交接文档

> 生成时间：2026-09-20（滚动更新；最新一次：第二轮独立审核代理 Godel 复核 PASS（A–G 七项实测全绿，无与宣称值不符处）+ HANDOFF 残留重复行清理 + Phase A–G 状态回填）　｜　用途：让下一个代理无需回溯对话即可继续。
> 本文件是**交接说明**，不是真源；一切以仓库文件与 `git log` 为准。

---

## 1. 我们在做什么任务

把 **release 工作仓** `D:\Working\Code Pro\Gods-Workbench-release`（分支 `main`，remote `origin`
= `https://github.com/qinxuedong/Gods-Workbench.git`）根目录里的**巨型 `main.py`** 分阶段拆分，
最终收敛为「入口兼容层 + 若干 `app_runtime/*` 模块」。

- `main.py` E7 基线（HEAD `5c377a77`，**历史快照**）：**16782 行**（`split("\n")` 口径）/ **741731 B** / 顶层定义 **722** 个 /
  （历史）`app.include_router(...)` **42 处（另 1 处在 `app_runtime/routers/assembly.py`，合计 43）** / `@app.*` 原地 HTTP 路由 **95 条**。
- **当前 `main.py`（HEAD `0d607c97`，Phase G 之后）**：**16461 行**（`split("\n")` 口径，`splitlines()` 为 16460）/ **732931 B** / SHA-256 `e252ae9c68321404a826d09cf3c7d1bc9076ecb3d8f88224c372e76970ebd514` / `app.include_router(...)` **0 处**（43 处全部在 `app_runtime/routers/assembly.py`）。
- 方案文档：`docs/architecture/MAIN-PY-DECOMPOSITION-PLAN.md`（Phase A–G）。
- 硬性目标：**拆分不等于重构**——URL、方法、状态码、响应结构、认证依赖顺序、启动方式全部保持兼容。

**两个仓库的关系（务必分清）：**

| 仓库 | 角色 | 内容 |
|---|---|---|
| `Gods-Workbench-release` | **真源 / 工作仓** | 有 `main.py`、`app_runtime/`、`asset_registry/`、测试；拆分在此进行 |
| `Gods-Workbench-clear-all\Gods-Workbench-clear` | **洁净室台账仓**（本文件所在仓） | 只有 `docs/**`、`src/**`、`tests/**`；**没有 `main.py`**，只记台账/治理/审核 |

---

## 2. 已经完成了什么

### 2.1 阶段进度（release 仓）

| 阶段 | 内容 | 状态 | 提交 |
|---|---|---|---|
| Phase A | 基线冻结（路由/OpenAPI/启动参数快照） | 完成 | `eb9a4595` 等 |
| Phase B | 79 个 Pydantic 模型 → `app_runtime/models/` | 完成 | `9e1b0fe2` |
| Phase C | 请求限额常量与纯解析 → `app_runtime/core/` | 完成 | `368ae249` |
| **Phase D 第 1 项** | 更新 / 备份 / 回滚 / 自重启 | **完成** | D1–D6-C 见下 |
| Phase E | API 路由抽离 | **完成（本地门禁全绿）**：E0–E10 全部落地，43 处 `include_router` 收敛进 `app_runtime/routers/assembly.py`，`main.py` `include_router` 归零 | E0 `ba32e1c9`、勘察 `25216c1b`、E1 `2896db12`、E2 `f04334fb`+`987d3442`、E3 `847fad0d`、E4 `00bf6492`、E5 `a94af7f1`、E6 `5db98092`、E7 `5c377a77`、E8 `a9f223f2`、E9 `16926f81`、E10 `1bd5bcf6` |
| Phase F | 生命周期 / WebSocket / 全局协程 / 关闭派发辅助 | **完成（本地门禁全绿）**：F1 WebSocket 连接管理器、F2 生命周期/启动维护/全局协程、F3 关闭与派生派发辅助，均迁至 `app_runtime/runtime/`，main 保留同名薄委托 | F1 `497db84b`、F2 `03f81f54`、F3 `8043ac4a` |
| Phase G | 入口收敛（`create_app()`） | **完成（本地门禁全绿）**：按 `_g1/RECON.md` §4.2 方案 A 引入 `create_app()`，保留模块级 `app = create_app()`；`main:app` 启动串零改动 | `0d607c97` |

### 2.2 Phase D 第 1 项：60 符号 → **56 迁出 + 4 设计保留**

- 迁出模块（8 个）：`app_runtime/services/updates/{versioning,remote,notes,staging,assets,static_pages,check,restart}.py`
- 分布：versioning 9 / remote 20 / notes 3 / staging 9 / assets 7 / static_pages 6 / check 1 / restart 1
- **4 个设计保留在 `main.py`**（D6，永久）：`UPDATE_LOCK`、`update_from_github`、`rollback_update`、`UPDATE_API_DEPENDENCIES`
- `main.py` 顶层定义数 **60 → 4**；行数 **21152 → 20583**（`split("\n")`）
- 迁移性质：**D1–D4（37 符号）逐字节等价**；**D5 / D5b / D6-A/B/C（19 符号）为「改写 + provider 依赖注入」**（用 `configure_dependencies(...)` + `_resolve_dependency(...)` fail-closed 保 `patch.object(main, ...)` 补丁面）
- 批次提交：`d737f944`(D1) → `352a5f06`(D2) → `4ed27afb`(D3) → `3ea0e65d`(D4) → `6f1ff294`(D5) → `25f112b3`(D6-A) → `fe41d0bc`(D6-B) → `2d2a8a59`(D6-C) → `d80b33f4`(D5b)

### 2.3 自更新分发白名单

- `app_runtime/**` 已纳入更新分发：`app_runtime/services/updates/versioning.py::update_allowed_file` 增加
  `or path.startswith("app_runtime/")`（提交 `69a24418`，用户明确要求的行为变更）。
- `REQUIRED_UPDATE_ROOT_FILES` 保持 `{main.py, app_version.py, VERSION}` 不变；拒绝语义未放宽。

### 2.4 Phase E 进度（E0–E10 全部完成、本地提交）

- **E0**（`ba32e1c9`）：新增路由身份快照门禁 `tests/test_phase_e_route_identity_gate.py`（零行为变更）。
- **勘察**（`25216c1b`）：`docs/architecture/MAIN-PY-PHASE-E-RECON.md`（含 E0–E10 分批方案）。
- **E1**（`2896db12`）：更新域路由装配入口迁入 `app_runtime/routers/assembly.py`；main 内 `include_router` 43 → 42（另 1 在 assembly），合计不变。
- **E2**（`f04334fb` + 测试补齐 `987d3442`）：shell/media 域 4 条原地路由 → `app_runtime/routers/shell_media.py`。
- **E3**（`847fad0d`）：本地资产 / 素材库域 30 条 → `app_runtime/routers/local_assets.py`。
- **E4**（`00bf6492`）：生成 / 任务提交域 25 条 → `app_runtime/routers/generation.py`。
- **E5**（`a94af7f1`）：工作流导入 / 导出域 5 条 → `app_runtime/routers/workflows.py`。
- **E6**（`5db98092`）：对话 / 历史域 7 条 → `app_runtime/routers/chat.py`。
- **E7**（`5c377a77`）：外部集成域 24 条 → `app_runtime/routers/integrations.py`。
- **覆盖度**：95/95 条原地 `@app.*` 路由实现体已全部迁出；main.py 仅保留同名薄包装（装饰器 + 原签名 + 单条纯委托）。
- **已完成**：E8 / E9 / E10 把 43 处 `include_router` 全部收敛进 `app_runtime/routers/assembly.py`；`main.py` 内 `app.include_router(...)` 归零，95 条 `@app.*` 薄包装保持模块顶层。
  `tests/test_phase_e_route_identity_gate.py`（`MAIN_INCLUDE_ROUTER_CALL_COUNT = 0` / 装配层由 `app_runtime/routers/assembly.py` 承担）与
  `tests/test_phase_e1_update_domain_assembly.py`（assembly 内 `include_router` 调用总数为 43、`main.py` 为 0）的门禁数字。**实测最终结果与当时预期不同**：`include_router` 从 `main.py` 搬进 `app_runtime/routers/assembly.py` **不改变路由类型分布**（`APIRoute`=95 / `APIWebSocketRoute`=1 / `Mount`=3 / `Route`=4 / `_IncludedRouter`=43，合计 146），路由身份仍为 361 条。
- **Phase F / G**：生命周期、WebSocket、全局协程、关闭派发辅助、`create_app()` 入口收敛**已全部完成并本地提交**（F1/F2/F3/G，见 §2.1 表）；**未 push、未跑远端 CI**。

### 2.5 文档修正与台账

- `c53c19d7`：修正 Phase D 收口文档两处口径瑕疵（行数「20661→20583」改为「21152→20583」；§5.1 补记 `update_allowed_file` 例外）。
- `bf3c890`（洁净仓）：T11 台账更新为「56/60 迁出 + 4 设计保留」，长说明落 `TASK-NOTES-2026-09-18.md` §9.9。

### 2.6 独立审核

| 审核对象 | 范围 | 结论 |
|---|---|---|
| Ramanujan | `app_runtime/**` 白名单 | `ACCEPT`（对抗自证 3 项篡改均被门禁捕获） |
| Carver | Phase D 第 1 项是否真收口 | `VERIFIED COMPLETE`（250 passed / 504 subtests） |
| Euclid | 两处文档修正 | `ACCEPT` |
| 主控对抗复核 | E4 源上原版 `test_generation_job_logging_contract.py` 确实 FAIL | 确认适配必要、未放宽断言 |
| 主控对抗复核（E7，2026-09-19） | 24 条 integrations 实现体 vs 迁移前 `5c377a77~1` 基线（剥离装饰器 + `_resolve_dependency('X')`→X 归一化） | AST 等价 `MISMATCH: []`；装饰器/签名 0 差异；4 条同源路由保留 `ensure_same_origin_request`；`open_registry_asset_locally` 保留 `request_principal`+{admin,editor}+403 |
| 独立审核代理 Lovelace（E7 台账与代码事实，2026-09-19） | 提交 `01ee08f` 变更范围 / 编码 / 围栏 / release 仓关键数字与 9 个提交哈希存在性 | `ACCEPT`（独立复现 16782 行 / 741731 B / 722 定义 / 95 条 HTTP 路由 / main 42 + assembly 1；170-731 与 179-878 口径自洽） |

### 2.7 冻结不变量（实测复核；用户 2026-09-19 已授权重新基线）

| 项 | 冻结值 |
|---|---|
| 路由身份 | **361** 条 / SHA-256 `eb79bd54285dec1175630683737285da7f00ae5f0c6d39eb89483e9b30ff900a` |
| OpenAPI（`indent=2, sort_keys=True, ensure_ascii=False` → `\n` 换 CRLF → UTF-8） | **579853 B** / SHA-256 `48c4cf7d285c537e763083317d2d7a4451de928aa48076ec98fa189b94df7cac` |
| routes / paths / schemas | 146 / 288 / 181 |
| `main.app.router.dependencies` 长度 | **1** |
| mount 集合 | `{/static, /output, /assets}` |
| 首个 websocket | `/ws/stats`；**无 `/api/speech`** |
| 冻结失败集合 | 7 条（`test_episode_pipeline_frontend_contract`、`test_floating_window_frontend_contract`、`test_gw045_topbar_contract`×2、`test_m3_asset_manager_module_contract`、`test_release_metadata`、`test_signal_flow_design_system_contract`），**不得新增** |

---

## 3. 当前卡在哪里

**E0–E10、Phase F（F1–F3）、Phase G 均已完成、本地门禁全绿并本地提交；未 push、未跑远端 CI、未做生产验收。**

- **E8 / E9 / E10（43 处 `include_router` 收敛）**：**已完成**（`a9f223f2` / `16926f81` / `1bd5bcf6`）。`main.py` 内 `app.include_router(...)` 已归零；**实测路由类型分布与路由身份均未变化**（361 条 / `eb79bd54…900a`、APIRoute=95 / _IncludedRouter=43 / 合计 146），变的只有 `main=0 / assembly=43`。
- **Phase F（生命周期 / WebSocket / 全局协程 / 关闭派发辅助）**：**已完成**（F1 `497db84b` / F2 `03f81f54` / F3 `8043ac4a`）。
- **工作区状态（写入时，2026-09-20）**：release 仓仅余他人未跟踪文件与勘察脚本目录 `_e9/` `_e10/` `_f3/` `_g1/` 等（**不动**）；release `main` 已 ahead origin/main **38 个提交**（Phase E8–G 七个批次 + 文档漂移修正 `546061df` + 独立审核报告 `15699e64`），**未 push**。

## 4. 下一步计划

### 4.1 用户裁决结果（2026-09-19）

用户已于 **2026-09-19** 就「仍待人工裁决」四项全部下达裁决与授权。逐项结果：

1. **重新基线冻结不变量 —— 已授权。** 允许在收敛后重新计算并更新冻结值，含 `.git` 对象库清理后路由/OpenAPI 冻结值的复算，以及 `main=42 / assembly=1 / 合计=43` 断言的重算。
   （**实测最终结果与这条当时的预测不同，此处按实测更正**：路由类型分布 `APIRoute`=95、`APIWebSocketRoute`=1、`Mount`=3、`Route`=4、`_IncludedRouter`=43，合计仍为 **146**；路由身份仍为 **361** 条 —— 把 `include_router` 调用从 `main.py` 搬进 `app_runtime/routers/assembly.py` **不改变路由类型分布**，变的只是 `main=0 / assembly=43`）。实施时同步 `tests/test_phase_e_route_identity_gate.py` 与
   `tests/test_phase_e1_update_domain_assembly.py` 的硬编码值为重算后的基线。
3. **Phase F —— 已完成。** 生命周期 / WebSocket / 全局协程 / 关闭派发辅助的机械拆分全部落地（F1–F3）；画布 CAS 资源桥接的「两种绑定语义统一」属独立授权批次，本轮未改。
4. **Phase G —— 已完成。** `main.py` 引入 `create_app()` 兼容入口并保留模块级 `app = create_app()`；未切换 `--factory`（实测负面结论）。
5. **T12（`.git` 内嵌二进制清理，破坏性）—— 已获用户明确授权并执行完成。** 前置为仓外完整 bundle 备份，复核后仅剩 3 个白名单 `.otf`（洁净室仓实测，详见 `TASK-NOTES-2026-09-18.md` §2.3）。
6. **T13（旧集成标记卫生用例基线重定义）—— 已获授权并落地。** 本地提交 `28c23bf` + `996c3ba`；全量 `pytest` 40 passed（详见 `TASK-NOTES-2026-09-18.md` §4.1）。

> **实施归属**：以上第 1–4 项均在 **release 仓** `D:\Working\Code Pro\Gods-Workbench-release`（分支 `main`）实施；本洁净室仓只记台账。
> **证据边界**：T12/T13 的实测均为**本地**门禁与**本地**提交（`28c23bf` / `996c3ba`）；E8–E10 / Phase F / Phase G 已**本地完成并本地提交**（`a9f223f2`/`16926f81`/`1bd5bcf6`/`497db84b`/`03f81f54`/`8043ac4a`/`0d607c97`），全部门禁为**本地实测**；全局仍为 **未 push、未跑远端 CI、未做生产验收**，不等于生产就绪。

### 4.2 已完成批次（E0–E7，全部本地提交、未 push）

- E0 `ba32e1c9` / 勘察 `25216c1b` / E1 `2896db12` / E2 `f04334fb`+`987d3442` / E3 `847fad0d` /
  E4 `00bf6492` / E5 `a94af7f1` / E6 `5db98092` / E7 `5c377a77`。
- 每批门禁：`check_openapi_contract` / `check_provider_contract` / `route_permissions` 三项 `--check` exit 0，
  门禁批次（E0/E1–E6 + 路由/权限/OpenAPI 契约）`pytest` **170 passed / 731 subtests**；
  含 E7 新门禁的完整 Phase E 批次 **179 passed / 878 subtests**；E7 定向回归 **116 passed / 44 subtests**。
- **证据边界**：以上均为**本地**门禁与本地提交；**未 push、未跑远端 CI、未做生产验收**。

### 4.3 最终交付前
- [x] **补一轮真正独立的代理审核**（Phase E / F / G 各一次）—— **已完成**：独立审核代理 **Gauss**（agent id `01a0bafa-30fd-7b02-97ae-7dedc57f7111`）对 release 仓 Phase E8–E10 + F1–F3 + G 逐条独立实测复核，结论 **PASS（9/10 ACCEPT；唯一 REJECT 属文档时效口径，已闭环）**；报告落盘 release 仓 `docs/architecture/MAIN-PY-PHASE-E8-G-REVIEW.md`（提交 `15699e64`）。
- [x] 更新洁净室台账（`docs/governance/TASKS.md` / `TASK-NOTES-2026-09-18.md`）与本文件 —— **已完成**（洁净仓提交 `661a79e` + 本次）。

- [ ] **仍待人工决策（不得代用户拍板）**：是否 push / 跑远端 CI / 做生产验收；画布 CAS 两种绑定语义统一（需用户显式授权的独立批次）；端口口径 `main.py` 3000 / `Dockerfile` 3333 / 洁净仓 `AGENTS.md` 2077 三处并存。

### 4.4 文档漂移修正批次（2026-09-20，已完成、本地提交、未 push）

- release 仓 `546061df`：Phase A–G 完成状态回填 —— `MAIN-PY-DECOMPOSITION-PLAN.md` §9 由「PLANNED — 未执行」改为已完成后实测小结（含批次 sha / 冻结不变量 / 方案 A / 证据边界）；`MAIN-PY-PHASE-D-SEQUENCE.md`、`MAIN-PY-PHASE-E-RECON.md`、`MAIN-PY-PHASE-G-CALLSITE-RECON.md`、`MAIN-PY-PHASE-D-D6-RECON.md` 各追加「后续状态更新（2026-09-20）」小节，**原文不改**（历史勘察记录保持原样）。
- release 仓 `15699e64`：落盘独立审核报告 `docs/architecture/MAIN-PY-PHASE-E8-G-REVIEW.md`。
- 洁净仓 `661a79e`：`TASK-NOTES-2026-09-18.md` §9.13 完成状态回填 + §4/§11.3 口径更正；`BINARY-AND-NAMING-BASELINE` / `FINAL-ACCEPTANCE-REVERIFY` / `ROUND2-ACCEPTANCE-AUDIT` / `CLEANROOM-STATUS.md` 追加「后续状态更新（2026-09-20）」指针，**原文不改**。
- 独立审核唯一 REJECT（`_f3/RECON.md` / `_g1/RECON.md` / `MAIN-PY-PHASE-G-CALLSITE-RECON.md` 的行数、字节数为 Phase G **改动之前**的快照，与 G 之后 HEAD 不同但各自自洽）已在 `MAIN-PY-PHASE-G-CALLSITE-RECON.md` 的「后续状态更新」小节显式澄清口径。
- **证据边界**：以上均为**本地**提交与本地门禁结果；**未 push、未跑远端 CI、未做生产验收**。


### 4.5 第二轮独立审核（Godel，2026-09-20，只读复核）

- 审核代理 **Godel**（agent id `01a0bb25-9525-7fb3-845d-181d6721c55f`）对本轮四项授权任务逐条只读实测复核，结论 **PASS**，七项（A–G）全部 ACCEPT，**无与宣称值不符处**。
- 复核实测命中：release `main` ahead origin/main **38**，受跟踪文件无改动，仅他人未跟踪文件；路由身份 **361** / `eb79bd54…900a`；OpenAPI **579853 B** / `48c4cf7d…dfcac`；`deps` 长度 **1**；类型分布 `APIRoute`=95 / `APIWebSocketRoute`=1 / `Mount`=3 / `Route`=4 / `_IncludedRouter`=43（合计 146）；三项契约工具均 exit 0；`main.py` **732931 B** / `e252ae9c…d514` / `app.include_router(` 0 处、AST 实测 assembly 恰 43 处；定向 6 文件 pytest **51 passed / 7 subtests**；洁净仓受限后缀对象**仅 3 个白名单 `.otf`**、全量 pytest **40 passed**；T13 提交 `28c23bf` / `996c3ba` 存在，V2 前端保留、快捷工具 6 页与画布内页已移除。
- 口径知会（不构成 REJECT）：assembly 内 `include_router` 朴素子串计数为 44，多出的 1 处在模块 docstring 文本；AST 实测调用恰为 43。
- 本轮清理：`664c7c5`（删除 HANDOFF.md 第 142 行残留重复行）。
- **证据边界**：以上均为**本地**只读实测与本地提交；**未 push、未跑远端 CI、未做生产验收**。
---

## 5. 踩过的坑（绝对不要再踩）

### 5.1 Git / 仓库纪律

1. **禁止 `git add -A`**（脏工作区会吞掉他人改动）——只 `git add` 自己改的文件。
2. **禁止 `git reset --hard` / `git checkout --`**（会覆盖用户工作）；回滚只恢复本批变更。
3. **release 仓只在本地提交，绝不 `push`。** 它虽是 GitHub `origin` 的真源工作区，但本轮纪律是「本地提交 + 不推送」。
4. **不动别人的未跟踪文件**（release 仓当前为 `_deps.py`；历史例 `_cmsg.txt`）。
5. 提交信息统一中文，用 `git commit -F <utf8文件>`；提交前删临时文件。
6. 别混淆两个仓：release 有 `main.py`；洁净室仓**没有** `main.py`，**不要**在洁净仓建 `main.py`
   或复制旧仓实现（洁净室铁律）。洁净仓严禁提交任何图片/截图/音频/视频/压缩包/可执行文件，
   字体只允许 3 个思源黑体 `.otf`。

### 5.2 代码 / 路由（最危险）

7. **不要改动 `UPDATE_API_DEPENDENCIES` 的 7 个 lambda（一字不改）**：它们是刻意的运行期延迟解析，
   改了会让 `patch.object(main, ...)` 失效。
8. **全局认证依赖位置不能乱动**：`app.router.dependencies.append(Depends(authorize_http_request))` 在
   `app = FastAPI(...)` **之后**，而 websocket 注册点**更早**；把 websocket 挪到该 append 之后再注册会 **TypeError**。
   （websocket 的鉴权由它自己显式完成。）
9. **新模块硬约束**：禁止反向 `import main`、禁止模块级读环境变量、禁止模块级副作用。
10. **两处投影清单必须同步**：`asset_registry/openapi_contract.py::MODEL_SOURCE_FILES` +
    `asset_registry/provider_contract.py::PROJECTED_MODEL_SOURCE_FILES`；漏了会静默误报。
11. **`openapi_contract.py` 会静态读 `main.py` 源码**并断言工厂「恰好直接 `include_router` 一次」——
    迁路由必须同步 `_MAIN_ROUTER_FACTORIES` / `_static_main_router_factory_calls`，**不得放宽断言**。
12. **不要注册 `asset_registry/speech_api.py`**（GW-034 默认关闭是已入库契约，`tests/test_gw034_default_disabled.py` 守护）。
13. **门禁断言必须硬编码字面值**，禁止写 `assertEqual(main.X, module.X)`（自证式永真）。
14. **冻结不变量不得漂移**（见 §2.7）：OpenAPI 579853 B / `48c4cf7d...`；路由 361 / `eb79bd54...`；deps 长度 1。
    E1–E7 各批均已实测命中（含 E7：361 / `eb79bd54...`、579853 B / `48c4cf7d...`、deps 1）。

### 5.3 Windows / 工具环境

15. **运行任何 `import main` 前必须**：`$env:GODS_WORKBENCH_OBSERVABILITY_CURSOR_SECRET='x'`（否则直接 RuntimeError）。
16. **PowerShell 控制台会把正常 UTF-8 中文显示成乱码**：判编码问题**必须**用 python 读字节
    `decode('utf-8')` + 查 `b'\xef\xbf\xbd'`（U+FFFD），输出用 `json.dumps(..., ensure_ascii=True)`。
    控制台乱码 ≠ 文件损坏。
17. **中文编辑统一用「写 `.py` → `python .py` → 删 `.py`」**（避免内联中文被控制台损坏）；
    PowerShell **无 heredoc**、**无 `rm -f`**（用 python `os.remove`）。
18. **行数口径要统一**：文档用 `split("\n")`（Phase D 起点 21152 → Phase D 收口 20583 → E7 后 16782）；
    `splitlines()` 会少 1。别再把某批的值（如 `20661`）当成 Phase D 起点。

### 5.4 多代理协作

19. **串行分派**代理，已完成先 `close_agent` 再开新的；并发上限约 4。
    **实测警示**：本会话子代理多次返回 `completed: null`（服务异常）；此时由主控本人完成关键路径，并自行做对抗复核，不得据此停工。
20. **子代理若约 30 分钟无落盘产出** → `interrupt` 要一句话进度 + **缩小范围重派**（上次 E1 就是反面教材）。
21. **最终成果完成前必须有真正独立的审核代理**核实（需求范围 / 实现 / 安全 / 测试证据 / 文档一致），
    否则不得标记完成或宣告发布就绪。
22. **在最终成果完成前**：不得仅凭子代理自述或聊天结论断言完成；须回到仓库文件、`git log`、实测命令输出取证。

---

## 6. 关键文件路径速查

**release 仓** `D:\Working\Code Pro\Gods-Workbench-release`

- 方案：`docs/architecture/MAIN-PY-DECOMPOSITION-PLAN.md`
- Phase D 序列/进度：`docs/architecture/MAIN-PY-PHASE-D-SEQUENCE.md`
- Phase D 基线（60 符号表）：`docs/architecture/MAIN-PY-PHASE-D-BASELINE.md`
- **Phase E 勘察（下一步依据）**：`docs/architecture/MAIN-PY-PHASE-E-RECON.md`
- Phase D 审核记录：`docs/architecture/MAIN-PY-PHASE-D-*-REVIEW.md`、`MAIN-PY-PHASE-D-DOCS-AUDIT.md`、`MAIN-PY-PHASE-D-SECURITY-REVIEW.md`
- Phase E 门禁：`tests/test_phase_e_route_identity_gate.py`
- Phase D 门禁：`tests/test_phase_d_*_contract.py`、`tests/test_phase_d_patch_surface_regression.py`
- 更新器模块：`app_runtime/services/updates/*.py`
- 契约工具：`tools/{check_openapi_contract,check_provider_contract,route_permissions}.py`

**洁净室仓** `D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`

- 台账：`docs/governance/TASKS.md`、`docs/governance/TASK-NOTES-2026-09-18.md`
- 治理/合规：`docs/governance/FILE-GOVERNANCE-2026-09-18.md`、`BINARY-AND-NAMING-BASELINE-2026-09-18.md`

---

## 7. 复现命令（快速自检）

```powershell
# 1) 双仓状态（应为 clean；release ahead origin/main，未 push）
cd "D:\Working\Code Pro\Gods-Workbench-release"; git status --short; git rev-list --count origin/main..HEAD
cd "D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear"; git status --short

# 2) import main 的必备环境变量
$env:GODS_WORKBENCH_OBSERVABILITY_CURSOR_SECRET='x'

# 3) 三项契约门禁（应全 exit 0）
python tools/check_openapi_contract.py --check
python tools/check_provider_contract.py --check
python tools/route_permissions.py --check

# 4) Phase E 路由身份快照门禁（9 用例）
python -m pytest tests/test_phase_e_route_identity_gate.py -q

# 5) Phase E 全批门禁（E0/E1/E2/E3/E4/E5/E6/E7 + 路由/权限/OpenAPI 契约）
python -m pytest tests/test_phase_e_route_identity_gate.py tests/test_phase_e1_update_domain_assembly.py `
  tests/test_phase_e2_shell_media_extraction.py tests/test_phase_e3_local_assets_extraction.py `
  tests/test_phase_e4_generation_extraction.py tests/test_phase_e5_workflows_extraction.py `
  tests/test_phase_e6_chat_extraction.py tests/test_phase_e7_integrations_extraction.py `
  tests/test_route_permissions.py tests/test_app_permissions.py tests/test_m3_openapi_contract.py -q

# 6) 全量（已知与各批无关的既有失败：static 前端契约 7 条 + 本机缺 ffmpeg 1 条）
python -m pytest -q
```
