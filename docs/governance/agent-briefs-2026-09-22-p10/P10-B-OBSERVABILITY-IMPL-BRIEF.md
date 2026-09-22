你是 Gods-Workbench-clear 仓库的实现代理（Phase 10B：观测阶段）。仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear
先读根 AGENTS.md 与 docs/governance/PHASE-10A-ASSET-LIBRARY-2026-09-22.md 以对齐洁净室铁律与 Phase 10A 的工程范式。

# 目标
按 T26 顺序（素材库 → **观测** → 提示词库 → 设置页 → 画布闭环），实现「观测」阶段最小闭环。

# 范围（严格）
只实现以下 8 个端点，方法均为 **GET**：
/api/observability、/api/observability/overview、/api/observability/series、/api/observability/events、/api/observability/tasks、/api/observability/health、/api/observability/sources、/api/observability/asset-volumes

**禁止**实现其它任何 /api/* 端点；禁止实现 /api/asset-library/* 的 items/libraries 明细等（Phase 10A 已明确它们仍未获授权）。

# 硬性约束（违反即视为失败）
1. **零伪造数据**：绝对不得使用 Math.random、硬编码假遥测、假 CPU/RAM、假任务、假事件。
   所有返回值必须来自**真实进程内状态**或**显式空/降级**：
   - overview 的任务/项目计数必须来自既有 `ProjectsService`、`GodCanvasService`（jobs）等真实服务的当前内存状态；
   - health 必须如实反映本进程各组件可用性（如 projects/canvas/asset_library 服务实例是否可用），
     不得无条件返回 "ok"；未接入的组件必须标为 "unknown" 或 "not_integrated"；
   - events 只能来自真实来源（如 `core/audit.py` 的**已脱敏**审计缓冲），不得编造事件；
     若无事件必须返回空数组；
   - series 若无真实时间序列数据源，必须返回空序列并在响应中标记 `data_status: "not_integrated"`，**不得伪造波形**；
   - sources / asset-volumes 若无真实来源，必须返回空数组 + `data_status: "not_integrated"`。
2. **稳定 ID**：job_id / project_id / entity_id / asset_id / canvas_id，禁止 id/pid/cid 别名。
3. **认证**：所有端点要求认证；未认证返回 401 且错误码为纯 ASCII 小写 `unauthorized`（复用 core/errors.py 的 UnauthorizedException）。只读角色可读。
4. **不落敏**：响应与日志绝不包含令牌、授权码、code_verifier、state、nonce、Cookie 值。
5. **真实支持查询参数**：至少解析并如实响应 range、limit、status、source、project_id、job_id、entity_id、asset_id、canvas_id、stable_id、cursor、start_ms、end_ms。
   未识别的参数不得 500；分页用 next_cursor + has_more。
6. **中文注释/文档/提交信息**（根 AGENTS.md §2.3）。

# 交付物（全部必须）
1. `docs/contracts/OBSERVABILITY-INTERFACE-CATALOG.yaml`：冻结契约，含 8 个端点的 method/path/query/status/schema/errors/acceptance；
   并在文件内显式写明「未接入数据源一律返回空 + data_status=not_integrated，禁止伪造」。
2. `src/gods_workbench/observability/`（`__init__.py` 领域模块 docstring、`models.py` Pydantic v2 模型、`service.py` 服务层）。
3. `src/gods_workbench/api/routes_observability.py`，并在 `src/gods_workbench/api/app.py` 注册 router。
4. 黄金夹具：至少覆盖「无数据时的诚实空响应」与「健康检查如实状态」两类，写入 `docs/fixtures/` 并登记到 `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`。
5. 契约测试 `tests/contracts/test_phase10b_observability.py`：至少覆盖 8 个端点的 200 形状、401、空/not_integrated 诚实语义、分页参数、以及「不得出现伪造字段」的反向断言。
6. 更新 `tests/contracts/test_phase8_frontend_backend_api_gap.py`：把新实现的 8 条从 `KNOWN_UNIMPLEMENTED` 迁入 `KNOWN_IMPLEMENTED`，并同步 `KNOWN_BACKEND_PATHS`；把新契约文件加入 `CONTRACTS`。
7. 更新 `docs/provenance/PHASE-2-INPUT-SHA256.txt` 中因本次变更而变化的条目（按该文件既有规则重新计算，条目数必须仍为 16）。

# 必须遵守的工程细节
- 文件行尾统一 LF、UTF-8 无 BOM（仓库 .gitattributes 为 `* text=auto eol=lf`）。
- 用 `python -P` 运行 python，避免本机 TEMP 下同名模块污染。
- 每步跑门禁：`python -P -m pytest -q` 必须全绿，且 `python -P -m pytest tests/hygiene -q` 必须全绿。
- **变异测试**：至少注入 3 个变异（如把空响应改成伪造数据、去掉 401、把 health 恒为 ok），证明守卫能捕获，逐一还原并记录结果。
- 严禁 `git add -A`；只允许逐文件 `git add`。**本轮禁止 git commit / git push**（由协调代理统一提交）。

# 证据要求
完成后回报：修改/新增文件清单、门禁数字、变异测试结果、以及你**明确未实现**的内容清单。
运行：
orca orchestration send --subject "Phase10B观测交付" --outcome succeeded --body "<回报>" --from $env:ORCA_TERMINAL_HANDLE
