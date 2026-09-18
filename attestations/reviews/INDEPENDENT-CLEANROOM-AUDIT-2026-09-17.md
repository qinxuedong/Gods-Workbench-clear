# 独立洁净室重构审核报告（修订版）

## 1. 审核范围与方法

本报告是洁净计划实施前的审核快照；后续修复动作不会自动改变本报告的否决结论，也不等同于独立复核。

- 审核日期：2026-09-17
- 审核对象：当前工作区 `Gods-Workbench-clear`，以 `HEAD=abd0e88` 及当前工作树为准。
- 审核范围：章程、交接文档、行为规范、接口契约、黄金夹具、来源证明、阶段证明、`src/`、测试套件和 Git 工作树。
- 复核动作：执行 `pytest -v`；检查黄金夹具输入哈希；核对当前源文件路径；仅为来源分类目的核对用户授权旧工作区的文件元数据和候选文件哈希；不把旧仓提交历史或旧源码实现作为洁净实现输入。
- 旧工作区边界：`D:\Working\Code Pro\Gods-Workbench-release`。用户本次计划授权的仅是可证明属于用户且与画布无关的非画布切片。

本报告不把阶段证明中的自我声明当作独立证据。任何阶段结论必须同时满足：当前路径真实存在、证据可复现、来源边界明确、治理状态一致，并且绑定到确切交付对象。

## 2. 修订后的总裁定

**REJECTED / REMEDIATION REQUIRED / NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**

当前测试可运行，但不能证明洁净计划已完成，也不能授权生产或公开分发。用户提出的“按功能和依赖分区处理”边界成立；它替代“旧仓库所有源码一律不可读取”的过宽表述，但不自动批准任何整文件迁移。无限画布、智能画布、工具连接器、生成适配器及其无法证明解耦的共享依赖仍然禁止复制。

## 3. 发现摘要

| # | 严重性 | 当前证据 | 发现 | 裁定影响 |
|---|---|---|---|---|
| 1 | 🔴 CRITICAL | `CLEANROOM-CHARTER.md`、`CLEANROOM-IMPLEMENTATION-HANDOFF.md`、`CLEANROOM-STATUS.md`、`docs/contracts/*.yaml`、`docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`、Phase 7 证明 | 治理状态不一致：章程/夹具/契约仍是未授权或待审，Phase 7 仍声称已授权，阶段证明还声称契约已冻结。 | 必须统一为“修复中，禁止发布”；历史授权声明失效。 |
| 2 | 🔴 CRITICAL | `git status --porcelain=v1 -uall`；当前 `HEAD=abd0e88` | 当前工作树有已修改的 `CLEANROOM-STATUS.md` 和未跟踪的本审计报告；交付对象未冻结。 | 任何旧授权不能覆盖当前工作树。 |
| 3 | 🔴 CRITICAL | 当前文件与 `D:\Working\Code Pro\Gods-Workbench-release\static\v2` 的 SHA-256 比对 | `projects.html`、`projects-controller.js`、`project-date-range.js`、`v2-shell.js`、`project-date-range.css`、`static/js/hardware-telemetry.js` 共 6 个文件与旧工作区整文件完全一致。它们含画布、素材、插件、ComfyUI、旧路由和认证 UI 依赖，不能作为“已解耦非画布迁移”接受。 | 当前静态层必须隔离并以行为契约重写；不得继续扩散整文件复制。 |
| 4 | 🟠 HIGH | `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17.txt`；`attestations/reviews/AUTHORIZED-CODE-MIGRATION-2026-09-17.md`；`CLEANROOM-STATUS.md` | 来源登记写明“本次没有形成代码迁移”，状态文档却声称 V2 前端已完成净化移植。 | 必须建立逐文件分类、依赖闭包、来源哈希、迁移理由和结果；在此之前不得称为已迁移。 |
| 5 | 🟠 HIGH | `src/gods_workbench/static/js/hardware-telemetry.js`；`src/gods_workbench/static/v2/*` | 前端残留 `/api/asset-auth/*`、固定 `admin`、资产管理、ComfyUI、旧页面和画布回收站等不存在或被排除的能力。当前后端并没有此前报告所称的 `/api/asset-auth/status` 免认证端点；此前该项被表述为后端认证漏洞并不准确，实际问题是静态层的幻影路由和固定身份文案。 | 必须删除这些引用并让写操作显式遵循 401/403；不能用不存在的后端端点作生产安全结论。 |
| 6 | 🟠 HIGH | `attestations/reviews/PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md` 与 `src/gods_workbench/` | Phase 4 记录引用 `src/gods_workbench/canvas/*`、`routes_canvas.py`，当前实现实际是 `god_canvas/*`、`routes_god_canvas.py`。 | 阶段证据必须标记为历史/失效并重新绑定当前路径。 |
| 7 | 🟡 MEDIUM | `docs/contracts/*.yaml`、`docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`、Phase 3 证明 | Markdown 声称已冻结，机器可读元数据仍为 `draft`/`pending_independent_review`；没有可识别审查者、签名或不可变审查会话记录。 | 只能把契约作为待复核材料；不能伪造新的独立签署。 |
| 8 | 🟡 MEDIUM | `tests/hygiene/test_cleanroom_hygiene.py`、`tests/hygiene/test_phase6_deep_hygiene.py` | 卫生测试只覆盖少量字符串、后缀和命名，不能证明来源、依赖闭包、整文件复制或前端幻影路由已清除。 | 必须补充来源/依赖登记和针对静态层的污染门禁。 |
| 9 | 🟡 MEDIUM | `attestations/reviews/PHASE-5*`、`PHASE-6*`、`PHASE-7*` | 历史测试数字分别为 20、29、32，但没有全部绑定到当前提交和当前文件快照；Phase 7 还包含与当前事实不符的正式授权结论。 | 历史结果只能作背景，不能作当前准出证据。 |

## 4. 当前可复现事实

- 当前执行 `pytest -v`：**32 passed in 0.27s**。
- `docs/provenance/PHASE-2-INPUT-SHA256.txt` 登记的 16 项路径当前存在且哈希匹配。
- 当前仓库未发现测试禁止的常见图片、字体、音视频和压缩二进制后缀。
- `PLUGIN-PROTOCOL-SPEC` 当前未发现对应 Python 运行时模块，但它仍然是明确排除项。
- 当前 API 使用 `god_canvas` 与 `routes_god_canvas.py`，未发现此前报告指向的 `/api/asset-auth/status` 后端路由。
- 当前工作树未冻结，且静态层存在可验证的旧工作区整文件副本；因此测试全绿不等于来源洁净或生产就绪。

## 5. 按新计划采用的处理边界

| 分类 | 处理规则 |
|---|---|
| 可迁移自有非画布代码 | 只有在来源归属已获用户授权、依赖闭包不触及画布/智能画布/工具/设置排除区、并完成哈希与人工结论登记后，才允许迁移。 |
| 无限画布、智能画布和直接依赖 | 禁止复制旧实现；只以已复核的行为规范、接口契约和黄金夹具为输入重构 `god-canvas`。 |
| Chrome 本地素材导入、Photoshop UXP、生成提供商/适配器 | 当前隔离；不能因“用户自有”自动进入洁净仓。 |
| 共享依赖或归属不明代码 | 先列为待确认，不迁移、不导入、不作为实现输入。 |
| 图片、字体、截图、音视频、用户数据和凭据 | 永久排除，不得进入仓库或证明文件。 |
| `PLUGIN-PROTOCOL-SPEC.md` | 保持单独待审，不实现、不建立运行时依赖。 |

## 6. 修复门禁与执行顺序

1. 统一章程、交接文件、状态、契约元数据和阶段证明的治理状态，并将旧授权证明标为历史失效。
2. 对 `D:\Working\Code Pro\Gods-Workbench-release` 建立逐文件/目录分类表；只登记用户明确授权且证明与画布无关的候选。
3. 将当前旧工作区整文件静态副本视为待处理输入：不直接继续使用；按契约重写项目中心和普通 `god-canvas` 最小垂直切片。
4. 补强后端认证/角色边界、拓扑引用校验、CAS 和 `202/401/403/409` 测试，并清除不存在的旧 API 与固定身份文案。
5. 为每个实际迁移文件登记来源路径、获取时间、SHA-256、依赖闭包、迁移理由、人工授权结论和目标哈希；无法闭环的候选留在隔离区。
6. 绑定新的测试输出、当前提交和文件快照后，再请求未参与实现的可识别审查者进行独立复核。

在以上门禁全部通过前，本报告不授予生产、部署或公开分发授权。
