# 洁净实现交接与执行入口

## 0. 文档定位

本文件是 `Gods-Workbench-clear` 的执行入口。仅用于治理与执行说明，不包含旧源码片段、DOM/CSS 结构或用户数据。

## 1. 仓库边界

- 授权旧工作区：`D:\Working\Code Pro\Gods-Workbench-release`，仅用于逐文件分类；不使用其提交历史作为实现输入。
- 画布排除参考：用户计划列出的 Infinite-Canvas 及其画布/智能画布/工具适配关系，仅用于确定排除边界，不复制其实现。
- 新仓库：`Gods-Workbench-clear`，当前治理骨架提交：`e5d65c7`。
- 当前发布状态：**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 2. 强制输入规则

### 2.1 允许输入

1. 已复核的行为规范
2. 已复核的接口契约
3. 已复核的黄金夹具
4. 公开依赖文档
5. `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md` 中逐文件接受的自有非画布切片

### 2.2 禁止输入

- 旧仓库 `.git`、分支、提交历史、完整测试实现或可还原实现细节的材料
- 未登记或依赖闭包未完成的旧源码
- 无限画布、智能画布、画布直接依赖和工具连接器旧实现
- 图片、截图、音视频、用户数据、凭据
- 字体（唯一例外：`AGENTS.md` §1.2 白名单的 3 个开源思源黑体）
- 任何可逆推出旧实现细节的片段化材料

## 3. 当前输入与分类产物

行为规范、契约和黄金夹具作为契约输入；自有代码迁移采用独立的逐文件分类门禁。

当前产物目录：

- `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md`
- `docs/behavior/BEHAVIOR-SPEC-CANVAS.md`
- `docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md`
- `docs/behavior/PLUGIN-PROTOCOL-SPEC.md`（仅待审清单，不实现）
- `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml`
- `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`
- `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json`
- `docs/fixtures/*.json` 与 `docs/fixtures/*.godmap` 最小夹具
- `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`
- `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`
- `attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md`

## 4. 执行顺序

### 阶段 1：审计修订与输入复核

- 统一治理状态，标记历史授权证明失效
- 完成逐文件分类、依赖闭包和来源哈希登记
- 未完成前不得把旧静态副本当作实现输入

### 阶段 2：非画布迁移

- 仅迁移分类表中明确接受的非画布切片
- 记录来源、时间、源哈希、目标哈希、理由和授权结论
- 任何共享依赖不闭环则回到隔离区

### 阶段 3：画布洁净实现

- 先完成项目中心与普通 `god-canvas` 最小垂直切片
- 再补智能画布 `202`、任务续查、冲突和权限路径
- 不复制无限画布、智能画布或工具旧实现

### 阶段 4：验证与复核

- 运行 `pytest -v`
- 执行来源边界、依赖闭包、敏感资源和旧路由污染检查
- 必须覆盖 `401/403/409/202`、非法拓扑和 CAS 冲突

### 阶段 5：独立审计与发布门禁

- 绑定当前确切提交、文件快照和测试输出
- 由未参与实现且可识别的审查者重新复核
- 在独立审查、法律与依赖合规闭环前保持禁止发布

### Phase 8：法律与发布门禁

- 许可证与依赖合规结论未闭环前，不得公开发布

## 5. 污染处理

一旦发现污染（旧源码、旧历史、受限资源、用户数据或其衍生）：

1. 立即暂停当前阶段
2. 隔离受污染路径，不把源码写入证明文件
3. 回到最近洁净边界重写
4. 补齐污染记录与复核证明
5. 复核通过前不得恢复实现

## 6. 当前执行清单

1. 读取修订后的独立审计报告和本章程
2. 读取分类表、来源 manifest、行为规范、契约和黄金夹具
3. 先完成接受切片的迁移证明，再重写旧静态副本
4. 以契约实现项目中心、普通 `god-canvas` 和智能任务路径
5. 每次改动后运行 `pytest -v` 并更新当前证据

## 7. 验收清单

- [ ] 所有接受迁移文件有来源、哈希、依赖闭包和授权结论
- [ ] 项目中心和 `god-canvas` 实现不依赖旧画布代码
- [ ] 未引入旧仓 `.git`、提交历史、资源或用户数据
- [ ] 错误语义覆盖 `401/403/409/202`
- [ ] `PLUGIN-PROTOCOL-SPEC` 仍处于待审且未实现
- [ ] 当前工作树和测试输出已绑定
- [ ] 仓库状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**
