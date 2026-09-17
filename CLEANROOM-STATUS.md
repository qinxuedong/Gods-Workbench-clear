# 洁净重写状态

## 当前状态

**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**

当前仓库已完成 **Phase 4（空历史洁净实现脚手架与核心契约模型）**，进入 **Phase 5（最小垂直切片实现）** 阶段。

## 已完成

- 建立洁净实现章程与信息来源边界。
- 建立行为规范、接口契约、黄金夹具、来源证明、审查证明和测试占位目录。
- 完成 Phase 2 脱源码行为规范、契约目录与最小黄金夹具清单（16 项输入材料）。
- 全量校验输入哈希一致性（`docs/provenance/PHASE-2-INPUT-SHA256.txt`）。
- 完成 Phase 3 独立审查登记与签署（4 类独立角色全票通过，契约正式冻结）。
- 建立最小垂直切片规划（`docs/vertical-slices/MINIMAL-VERTICAL-SLICE-SCOPE.md`）。
- 完成 Phase 4 工程脚手架与核心数据模型定义（Pydantic 契约模型、FastAPI 路由骨架）。
- 建立自动化测试套件并通过 100% 黄金夹具验证与防污染自检（14 项测试全部 PASS）。
- 形成 Phase 4 验收记录（`attestations/reviews/PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md`）。

## Phase 2/3/4 输入基线与禁止项

- 输入仓库（只读研究）：`D:\Working\Code Pro\Gods-Workbench-release`（`main=31371df`）
- 允许输入：已冻结的行为规范、接口契约、黄金夹具、公开依赖文档
- 明确排除：`docs/behavior/PLUGIN-PROTOCOL-SPEC.md`（待审状态，不作为实现输入）
- 禁止项：
  - 旧源码复制或片段化复用
  - 旧 `.git`、分支、提交历史作为实现输入
  - 完整测试实现复制
  - 图片、字体、截图、用户数据导入
  - 任何绕过审查门禁的间接输入

## 后续阶段计划

1. Phase 5 以最小垂直切片（切片 A：项目中心最小链路、切片 B：普通画布拓扑读写、切片 C：智能画布错误与异步边界）推进具体业务实现。
2. Phase 6 全面端到端与集成自动化测试。
3. Phase 7 独立审计。
4. Phase 8 法律与发布门禁评估。

## 门禁

- 业务实现必须严格限定在已批准的切片 A/B/C 范围内，且由已冻结夹具驱动验收。
- 发现污染时：立即暂停并按章程重建工作区。
- 未完成独立审查、测试和发布授权前：不得公开分发。
- 正式 `LICENSE` 暂不加入本仓库。
