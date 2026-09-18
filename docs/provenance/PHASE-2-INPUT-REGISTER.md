# 输入登记表（洁净修复基线）

本登记表是本轮洁净修复的输入索引。历史 Phase 3 的“正式冻结”声明已重开；本轮由用户明确授权进入修复实施，独立发布审查仍未完成。除明确排除的插件协议外，以下材料可作为本轮实现输入，但不能作为生产或公开分发授权。

| 类型 | 路径或范围 | 当前版本 | 当前状态 | 来源类别 | 审查结论 |
|---|---|---|---|---|---|
| 行为规范 | `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md` | remediation-1 | 修复输入（发布审查未完成） | 只读研究观察与公开文档 | USER-DIRECTED (2026-09-17) |
| 行为规范 | `docs/behavior/BEHAVIOR-SPEC-CANVAS.md` | remediation-1 | 修复输入（发布审查未完成） | 只读研究观察与公开文档 | USER-DIRECTED (2026-09-17) |
| 行为规范 | `docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md` | remediation-1 | 修复输入（发布审查未完成） | 只读研究观察与公开文档 | USER-DIRECTED (2026-09-17) |
| 待审清单 | `docs/behavior/PLUGIN-PROTOCOL-SPEC.md` | draft | 明确排除（禁止实现） | 待单独安全与协议审查 | EXCLUDED (待单独审查) |
| 接口契约 | `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` | remediation-1 | 修复输入（发布审查未完成） | 只读研究观察与公开文档 | USER-DIRECTED (2026-09-17) |
| 接口契约 | `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml` | remediation-1 | 修复输入（发布审查未完成） | 只读研究观察与公开文档 | USER-DIRECTED (2026-09-17) |
| 黄金夹具 | `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`及其列出的文件 | remediation-1 | 修复输入（发布审查未完成） | 脱源码最小夹具集合 | USER-DIRECTED (2026-09-17) |

## 来源边界与冻结约束

- 研究基线仅作为历史研究记录，不得作为实现代码的直接输入。
- 本登记材料不包含旧源码、测试实现、资源文件、用户数据或可逆推出实现的片段。
- 所有修复输入与 `docs/provenance/PHASE-2-INPUT-SHA256.txt` 强绑定。任何文本变更均须重新生成哈希并重新复核。
- 本登记表不改变仓库发布状态；当前仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
