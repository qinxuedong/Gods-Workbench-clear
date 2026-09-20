# 洁净计划修复实施核验记录

## 记录性质

本文件记录本轮用户指示下的实施核验，不是独立审计、法律意见、生产验收或公开分发授权。独立审计报告是实施前快照；本记录只描述修复后的当前工作树。

## 当前对象

- 工作区：`Gods-Workbench-clear`
- 分支：`master`
- 实施前基线：`abd0e8899650117738cd830d9f027d8e9b93162f`
- 核验时间：`2026-09-17T20:55:00+08:00`
- 核验时工作树：有未提交变更，尚未冻结为唯一交付对象
- 当前发布状态：**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**

## 已实施范围

1. 修订独立审计报告、章程、交接入口、状态和历史证明，撤销与当前事实冲突的旧授权文字。
2. 对 `D:\Working\Code Pro\Gods-Workbench-release` 完成逐文件分类；仅接受两个无画布日期选择器切片，详见 `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`。
3. 重写项目中心、前端壳层、硬件状态脚本和 `god-canvas` 工作台，不保留旧静态整文件副本中的资产、生成器、插件和旧路由引用。
4. 实现项目/画布写操作认证与角色边界、项目生命周期 CAS、拓扑结构校验、导入 ID 重排、智能任务 `202` 和合法状态机。
5. 保持无限画布旧实现、智能画布直接依赖、生成适配器、Chrome/Photoshop 连接器和插件协议隔离。

## 可复现核验

| 检查 | 结果 | 说明 |
|---|---|---|
| `pytest -v` | **40 passed** | 黄金夹具、CAS、并发、拓扑、任务、权限、来源哈希、静态污染和冒烟测试 |
| `python -m compileall -q src run.py` | **通过** | Python 语法编译检查 |
| `node --check` | **通过** | 当前静态层 JavaScript 文件语法检查 |
| `git diff --check` | **通过** | 当前补丁无空白错误 |
| 受限资源扫描 | **通过** | 未发现禁止的图片、字体、音视频后缀 |
| 接受切片目标哈希 | **通过** | 测试强制核对两个目标文件与迁移 manifest |
| 静态旧集成标记扫描 | **通过** | 未发现旧 asset-auth、ComfyUI、RunningHub、插件连接器和旧页面标记 |

## 未关闭门禁

- 工作树仍有未提交变更，不能宣称交付提交已冻结。
- Bearer 检查是本地/测试传输边界，尚未接入可验证的外部身份提供商。
- 仍需未参与本轮实现的可识别审查者复核来源分类、契约/夹具和当前确切快照。
- 许可证、第三方依赖、部署配置和生产验收尚未闭环。

结论：**修复实现核验通过；独立发布审查未完成；不得生产部署或公开分发。**

## 数字更正与状态声明（2026-09-18 追加）

本节仅追加说明，不改动上方历史核验记录。

- 上表「`pytest -v` | **40 passed**」为该记录生成时点的历史数字，**不代表当前工作树**。
- 当前实测：`python -m pytest -q --no-header -p no:cacheprovider` → **5 failed / 35 passed（共 40 项）**。
- 同时，上表「受限资源扫描 通过」「静态旧集成标记扫描 通过」两项与当前实测不符：本仓现存 13 项受限二进制资源（5 图片 / 5 缩略图 / 3 字体）与 173 条旧集成标记，相关用例当前为 FAILED，登记见 `docs/governance/TASKS.md` 第二节与 `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md`。
- 因此本记录**不得作为当前证据**；当前状态以 `docs/governance/TASKS.md` 与 `docs/governance/FILE-GOVERNANCE-2026-09-18.md` 为准。

---

## 后续状态更新（2026-09-20）

用户 2026-09-18 指示并已落地：`AGENTS.md` §1.2 设立**唯一二进制白名单**，逐条精确路径放行 3 个开源思源黑体（Source Han Sans CN，OFL-1.1）：

- `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf`
- `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf`
- `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf`

因此，本文档中「无图片、字体资源」「零二进制」等表述只反映 **2026-09-17/18 当时快照**，现已过时；按本仓库历史记录保护原则，**原文不追溯改写**，以本节为准。图片、截图、音视频、用户数据、凭据及白名单外字体仍一律禁止。
