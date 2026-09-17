# CLEANROOM IMPLEMENTATION HANDOFF

## 0. 文档定位

本文件是从旧仓库切换到 `Gods-Workbench-clear` 的**唯一执行入口**。仅用于治理与执行说明，不包含任何旧源码片段、实现命名、DOM/CSS 结构或用户数据。

## 1. 仓库边界

- 旧仓库：`qinxuedong/Gods-Workbench` 的 `main`（研究基线 `31371df`）仅为**历史/研究仓**。
- 新仓库：`Gods-Workbench-clear`，当前治理骨架提交：`e5d65c7`。
- 当前发布状态：**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 2. 强制输入规则

### 2.1 允许输入

1. 审核通过的行为规范
2. 审核通过的接口契约
3. 审核通过的黄金夹具
4. 公开依赖文档

### 2.2 禁止输入

- 旧仓库 `main/feature` 的源码、`.git`、分支、提交历史
- 旧仓库完整测试实现或可还原实现细节的内容
- 图片、字体、截图、用户数据
- 任何可逆推出旧实现细节的片段化材料

## 3. Phase 2 当前工作与产物目录

Phase 2 目标：旧仓行为规范提取（脱源码）。

当前产物目录：

- `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md`
- `docs/behavior/BEHAVIOR-SPEC-CANVAS.md`
- `docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md`
- `docs/behavior/PLUGIN-PROTOCOL-SPEC.md`（仅待审清单，不实现）
- `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml`
- `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`
- `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`
- `docs/fixtures/*.json` 与 `docs/fixtures/*.godmap` 最小夹具

## 4. 后续阶段执行顺序

### Phase 3：契约冻结

- 冻结行为规范、接口契约、错误语义与夹具版本
- 完成独立审查前，不得进入实现

### Phase 4：空历史洁净实现

- 仅以冻结契约和夹具为输入重写
- 禁止从旧仓复制任何实现细节

### Phase 5：垂直切片

- 先做最小可运行链路，覆盖项目中心与画布关键路径
- 每个切片都需通过契约与夹具验收

### Phase 6：测试

- 建立接口、行为、冲突、权限、恢复场景测试
- 必须覆盖 `401/403/409/202`

### Phase 7：独立审计

- 审查输入来源、实现一致性、污染风险、测试证据

### Phase 8：法律与发布门禁

- 许可证与依赖合规结论未闭环前，不得公开发布

## 5. 污染处理

一旦发现污染（旧源码、旧历史、受限资源、用户数据或其衍生）：

1. 立即暂停当前阶段
2. 隔离并销毁受污染工作区
3. 回到最近洁净基线重建
4. 补齐污染记录与复核证明
5. 复核通过前不得恢复实现

## 6. 切换后第一批操作清单

1. 读取并确认 `CLEANROOM-CHARTER.md` 与 `CLEANROOM-STATUS.md`
2. 仅从 Phase 2 产物目录读取输入材料
3. 建立 Phase 3 审查任务与签署人
4. 标记未审材料为“不可实现输入”
5. 准备最小垂直切片范围，不写业务代码

## 7. 首批验收清单

- [ ] 所有输入材料均有来源记录与审查状态
- [ ] 行为规范/契约/夹具版本一致
- [ ] 未引入旧仓源码、旧 `.git` 或提交历史
- [ ] 错误语义覆盖 `401/403/409/202`
- [ ] `PLUGIN-PROTOCOL-SPEC` 仍处于待审且未实现
- [ ] 仓库状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**
