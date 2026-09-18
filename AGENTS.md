# Gods-Workbench-clear 智能代理作业宪章 (AGENTS.md)

本文件是所有 AI 代理与开发者在 `Gods-Workbench-clear` 仓库中开展工作的**最高行为规约与架构基准**。任何代理在规划、编码、移植、重构或提交前必须严格遵循本文件。

---

## 1. 洁净室铁律与防污染红线 (Cleanroom Guardrails)

1. **唯一合法输入来源**：
   - 仅限读取并依据已审核冻结的材料：`docs/behavior/`（行为规范）、`docs/contracts/`（接口契约）、`docs/fixtures/`（黄金夹具）以及经过解耦审查的自有切片。
   - **绝对禁止**直接复制旧仓源码实现或复用旧仓提交历史。
2. **二进制资源授权边界**：
   - 仓库内严禁提交任何图片、截图、音频、视频、压缩包、可执行文件，以及**除下列 3 个文件之外**的任何字体文件（`.ttf`, `.otf`, `.woff`, `.woff2`, `.eot` 等一律禁止）。
   - **唯一白名单**（用户 2026-09-18 指示，开源思源黑体，本地运行期强依赖）：
     - `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf`
     - `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf`
     - `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf`
   - 图标仍使用 Lucide CDN，样式使用 Tailwind CDN；除白名单外的字体一律走 CDN 或系统原生字体栈。
   - 白名单为**逐条精确路径**，任何新增本地二进制都必须先修订本节并同步卫生用例，否则视为违规。
3. **明确排除项**：
   - `docs/behavior/PLUGIN-PROTOCOL-SPEC.md`（插件协议）当前属于明确排除项，严禁在后端或前端代码中隐式实现或引入运行时依赖。
4. **发布状态**：
   - 当前仓库发布状态为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**，未经独立审计与合规评估前，不得添加正式开源许可证或对外发布。

---

## 2. 技术栈与极简原则 (Tech Stack & KISS)

1. **前端技术栈（极简、原生、高质感）**：
   - **核心哲学**：恪守 KISS 原则，杜绝过度工程化。
   - **架构方案**：原生 HTML5 + 现代化原生 JavaScript + CSS。
   - **视觉系统**：统一沿用“黑金拟物科技硬件设计系统”（Hardware Design System）与 Tailwind CSS CDN。
   - **严禁事项**：不引入 React、Vue、Webpack、Vite 等沉重构建链或前端框架，保持随时可在浏览器直接打开运行的高效性。
2. **后端技术栈**：
   - Python 3.11 + FastAPI + Pydantic v2，目录位于 `src/gods_workbench/`。
   - **默认运行端口**：统一固定为 `2077`（快速启动入口：`python run.py`）。
3. **语言与注释要求**：
   - 所有代码注释、文档、Commit Message 和解释说明**必须使用中文**。

---

## 3. 核心架构契约与数据不变量 (Core Invariants)

1. **统一稳定 ID 规范**：
   - 生产链路核心实体 ID 必须统一命名为：`project_id`、`canvas_id`、`entity_id`、`job_id`、`asset_id`。
   - 严禁随意自创别名（如 `pid`, `cid`, `id` 等不规范字段）。
2. **CAS 乐观锁与并发控制**：
   - 所有项目的编辑、归档、解归档、移入/恢复回收站，以及画布拓扑更新，必须携带 `expected_version`。
   - 版本不一致时，必须返回 `409` 状态码与标准错误包（`VERSION_CONFLICT` 或 `CANVAS_VERSION_CONFLICT`），禁止静默覆盖。
3. **标准错误与异步语义**：
   - `401 Unauthorized`：未认证或会话失效。
   - `403 Forbidden`：权限不足（只读降级）。
   - `409 Conflict`：CAS 版本冲突。
   - `202 Accepted`：`god-canvas` 智能任务必须返回 `202`，并携带稳定 `job_id` 与 `poll_hint`。
   - 错误响应外层结构必须统一封装为 `{"detail": {"code": "...", "message": "...", ...}}`。
4. **god-canvas 统一架构**：
   - 画布引擎统一命名为 **`god-canvas`**，包含普通画布拓扑交互与智能画布任务编排双重能力。
   - 严禁拆分为互不兼容的平行体系，统一使用 CAS 乐观锁版本与稳定 ID 体系。

---

## 4. 自有代码切片移植准则 (Slice Migration Policy)

若需从旧仓引入用户自主原创的功能切片（如 V2 前端项目中心）：

1. **切片事前审查**：确认该切片为 100% 自有独立设计，无第三方版权/上游争议。
2. **彻底解耦净化**：
   - 剥离对旧仓全局脏状态或非标准环境变量的依赖；
   - 严禁携带 `static/js/canvas/`（上游画布旧实现），画布入口统一做优雅占位降级；
   - 清理所有本地二进制字体或图片引用。
3. **契约无缝对齐**：移植后的前端必须直接对接 `src/gods_workbench/api/` 的冻结接口，并在新仓编写针对性契约测试。

---

## 5. Agent 工作流与质量门禁 (Agent Workflow)

1. **结构化流程**：
   - 严格遵循：`构思方案 → 提请审核 → 分解为具体任务`。
   - 未获用户确认前，不盲目进行破坏性修改或大范围重写。
2. **持续验证门禁**：
   - 每次实施改动后，必须运行自动化测试：
     ```powershell
     pytest -v
     ```
   - 确保黄金夹具测试（`test_golden_fixtures.py`）与防污染自检（`test_cleanroom_hygiene.py`）持续 **100% PASS**。
3. **破坏性操作安全保护**：
   - 任何涉及文件删除、大范围覆盖、阶段状态变更等破坏性操作，必须获得人工明确确认。
