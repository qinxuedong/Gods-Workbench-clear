# HANDOFF-3 —— 2026-09-20 CI 修复与 Phase 3 修正收口

> 状态：**本地已完成，待 push / 远端 CI 实测**。
> 依据：根 `AGENTS.md`；真源为 `D:\Working\Code Pro\Gods-Workbench-release`。

## 1. 本轮解决的核心问题：远端 CI 失败

- 现象：CI run `35508749903` / `35508682089` 步骤「运行全量测试」失败（`2 failed, 38 passed`）。
- 失败用例：`test_accepted_non_canvas_slices_match_migration_manifest`、`test_phase2_input_hashes_match_current_files`。
- 根因（已实证）：哈希登记值绑定 **Windows CRLF 字节**，Linux CI 检出为 **LF**，同一文件字节不同导致断言失败。CI 报错值 `b0765218…` / `1ae7a240…` / `1ca8a32…` 恰等于 git blob（LF）哈希。
- 修复：① 新增 `_canonical_sha256()`（CRLF/CR→LF 归一），两处断言行尾无关；② 16+2 条登记哈希重算为 LF 值；③ 新增 `.gitattributes`（`* text=auto eol=lf` + 二进制标记）。
- 验证：Windows 工作树 **40 passed**；LF 全树仿真 **40 passed**；`node --check` 56/56；二进制白名单仅 3 个 `.otf`。

## 2. Phase 3 契约修正（P1-1 / P1-2）

- `restore_canvas` / `import_canvas_workflow` 的 `expected_version` → **必填 integer**；服务层去掉 `is not None` 短路。
- `run_smart_canvas_task` → **仅 202**，删除 `response_200`，`poll_hint: string`。
- 契约 `version`: `remediation-1` → `remediation-2`。
- `CANVAS-INTERFACE-CATALOG.yaml` 内容变更 → `PHASE-2-INPUT-SHA256.txt` 对应条目已重算为新哈希。

## 3. 文档漂移与来源分类

- 文档漂移：4 个历史文档追加 2026-09-20 指针，明确「仅 3 个开源思源黑体白名单；放行 ≠ 公开分发授权」；`CLEANROOM-CHARTER/STATUS/README/design-README` 已白名单一致。
- 来源分类：`T-classification.md` 证明 `git ls-files` = 磁盘 = 108，comfyui/runninghub 5 项删除已提交（`97b8b04`）。

## 4. 本轮新增/修改文件

- 代码/测试：`src/gods_workbench/api/routes_god_canvas.py`、`src/gods_workbench/god_canvas/service.py`、`src/gods_workbench/god_canvas/tasks.py`、`tests/contracts/test_god_canvas_service.py`、`tests/hygiene/test_cleanroom_hygiene.py`
- 契约/登记：`docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`、`docs/provenance/PHASE-2-INPUT-SHA256.txt`、`docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`、`docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md`（追加）
- 审计：`attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md`（R2）、`attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md`（R2）
- 报告：`docs/governance/agent-reports-2026-09-20/T-docs-drift.md`、`T-classification.md`、`T-ci-remote.md`、`REVIEW-PHASE3-FINAL.md`
- 治理：`docs/governance/AGENT-TASK-2026-09-20-PHASE3.md`、`.gitattributes`、本文件

## 5. 下一步（主代理执行）

1. 逐文件 `git add`（禁止 `git add -A`）；中文提交信息。
2. `git push` → `gh workflow run CI`；据实记录结果。
3. 生产验收为**独立决策**，不得由本地通过假定完成。

## 6. 边界

- **本地通过 ≠ 远端 CI ≠ 生产验收。**
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；字体放行 ≠ 分发授权。
- 未闭环：真实外部 IdP、许可证最终结论、运行时部署证据。
