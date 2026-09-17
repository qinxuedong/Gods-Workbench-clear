# Phase 2 输入登记表

本登记表是 Phase 3 契约冻结审查的输入索引与状态记录。经 2026-09-17 独立审查登记，除明确排除的插件协议外，以下契约材料已完成审查并正式冻结为**允许实现的有效输入（FROZEN）**。

| 类型 | 路径或范围 | 当前版本 | 当前状态 | 来源类别 | 审查结论 |
|---|---|---|---|---|---|
| 行为规范 | `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md` | v1-frozen | 已冻结（允许实现） | 只读研究观察与公开文档 | APPROVED (2026-09-17) |
| 行为规范 | `docs/behavior/BEHAVIOR-SPEC-CANVAS.md` | v1-frozen | 已冻结（允许实现） | 只读研究观察与公开文档 | APPROVED (2026-09-17) |
| 行为规范 | `docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md` | v1-frozen | 已冻结（允许实现） | 只读研究观察与公开文档 | APPROVED (2026-09-17) |
| 待审清单 | `docs/behavior/PLUGIN-PROTOCOL-SPEC.md` | draft | 明确排除（禁止实现） | 待单独安全与协议审查 | EXCLUDED (待单独审查) |
| 接口契约 | `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` | v1-frozen | 已冻结（允许实现） | 只读研究观察与公开文档 | APPROVED (2026-09-17) |
| 接口契约 | `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml` | v1-frozen | 已冻结（允许实现） | 只读研究观察与公开文档 | APPROVED (2026-09-17) |
| 黄金夹具 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`及其列出的文件 | v1-frozen | 已冻结（允许实现） | 脱源码最小夹具集合 | APPROVED (2026-09-17) |

## 来源边界与冻结约束

- 研究基线仅作为历史研究记录，不得作为实现代码的直接输入。
- 本登记材料不包含旧源码、测试实现、资源文件、用户数据或可逆推出实现的片段。
- 所有已冻结材料与 `docs/provenance/PHASE-2-INPUT-SHA256.txt` 强绑定。任何文本变更均须触发重新审查。
