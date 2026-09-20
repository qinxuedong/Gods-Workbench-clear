# 自有代码迁移与洁净重构分类表

记录日期：2026-09-20  
来源根目录：`D:\Working\Code Pro\Gods-Workbench-release`  
目标根目录：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`  
当前分支：`master`  
发布状态：`NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`

> 本表只记录来源判定、范围和哈希，不复制旧仓源码实现；静态层逐文件事实以 `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md` 为准。

## 四类归属口径

| 类别 | 定义 | 处理 |
|---|---|---|
| ① 用户自有原创切片 | 仅限经依赖复核、与画布/智能任务/插件协议解耦且可逐字节复现的用户自有代码 | 允许迁入；当前仅 2 个日期选择器文件 |
| ② 按契约/夹具自行重写 | 依据 `docs/behavior/`、`docs/contracts/`、`docs/fixtures/` 自行实现，不复制旧仓整文件 | 允许存在；须受契约与卫生用例约束 |
| ③ 第三方资产 | `vendor/` 与 `prompt-registry/` 等明确外部来源内容 | 仅按已登记许可、署名和发布门禁使用 |
| ④ 隔离 / 不迁移 | 无限画布旧提示词、旧画布实现、连接器、comfyui、runninghub 等明确排除项 | 不迁移；已删除项不得回流 |

## 2026-09-20 范围裁决

- `src/gods_workbench/static/v2/**` 整体保留。
- 画布/工具只保留入口首页；快捷工具入口及其内部实现不迁移。
- comfyui / runninghub 不迁移：专属页面、脚本、样式、目录、导航、接口调用和文案均移除。
- 本地二进制仅允许 `AGENTS.md` §1.2 三条思源黑体精确路径；开源许可不等于公开分发授权。

## 类别①：用户自有原创切片（2 个）

| 目标相对路径 | 来源 SHA-256 | 目标 SHA-256 | 结果 |
|---|---|---|---|
| `src/gods_workbench/static/v2/js/project-date-range.js` | `3607B19926040C0F40590781451964003616AA3BC436D7E8674E055C5378A593` | `3607B19926040C0F40590781451964003616AA3BC436D7E8674E055C5378A593` | MATCH |
| `src/gods_workbench/static/v2/css/project-date-range.css` | `794B0E20B8DAC4A48BD1E3ACEE1C1F4D7087B1EAC412B9F34D69DE5F0563197A` | `794B0E20B8DAC4A48BD1E3ACEE1C1F4D7087B1EAC412B9F34D69DE5F0563197A` | MATCH |

哈希登记与授权决定：`docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`。

## 类别②：按契约/夹具自行重写

当前静态层除上述 2 个文件、`vendor/**`、`prompt-registry/**` 和隔离项外，均按洁净仓行为规范、接口契约与黄金夹具自行重写。包括 V2 项目中心、入口页、设置页、普通画布/智能画布业务壳、API 设置及任务/资产 UI。该分类不表示复制旧仓，也不表示生产验收完成。

## 类别③：第三方资产

- `src/gods_workbench/static/vendor/**`：Lucide（ISC/Feather 派生 MIT）、Three.js 0.160.0（MIT）、Source Han Sans CN 三个 OTF（SIL OFL-1.1）及本地加载配置；细节见 `vendor/MANIFEST.md`。
- `src/gods_workbench/static/prompt-registry/**`：外部提示词快照；MIT 与 CC BY 4.0 的来源、署名和限制见 `prompt-registry/NOTICE.md`。
- 第三方存在不改变仓库当前 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION` 状态。

## 类别④：隔离 / 不迁移

| 范围 | 判定依据 | 当前状态 |
|---|---|---|
| `src/gods_workbench/static/system-prompts/infinite-canvas-prompt-templates.md` | 无限画布旧提示词，属于明确隔离范围 | 工作树保留为隔离登记，不进入运行迁移链路 |
| comfyui 专属页面/脚本/样式 | 用户 2026-09-20 裁决不迁移 | 工作树已删除，卫生用例禁止重现 |
| `static/runninghub/` 与 RunningHub 专属实现 | 用户 2026-09-20 裁决不迁移 | 工作树已删除并清除保留层引用 |
| 旧无限画布/智能画布实现、连接器及插件协议 | 根 `AGENTS.md` 排除项与洁净室边界 | 不迁移；不得由静态层隐式引入 |

## 证据边界

- 以上为当前工作树与已登记清单的本地证据，不是远端 CI、生产验收、法律意见或公开发布授权。
- 未执行 `git add`、`git commit`、`git push`、`git remote`；未使用 orca 或非 Codex 工具。
