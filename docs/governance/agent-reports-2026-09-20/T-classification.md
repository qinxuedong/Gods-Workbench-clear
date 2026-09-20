# T-classification —— 来源分类口径统一与移除闭环（2026-09-20）

## 任务
用户裁决：V2 前端整体保留；画布/工具仅保留入口首页；快捷工具入口及内部内容不迁移；comfyui/runninghub 不迁移。需证明来源分类口径统一。

## 口径
四类归属见 `CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`，静态层逐文件登记见 `STATIC-SCOPE-REGISTRY-2026-09-20.md`：
① 用户自有原创切片；② 按契约/夹具重写；③ 第三方资产；④ 隔离/不迁移。

## 实测（本轮，删除已提交后）

| 口径 | 值 |
|---|---:|
| `git ls-files src/gods_workbench/static` 索引路径数 | 108 |
| 磁盘现存文件数（排除 `__pycache__`） | 108 |
| 索引与磁盘差集 | 0 |
| 磁盘现存总字节 | 35,041,179 |

**关键结论**：comfyui/runninghub 的 5 个删除文件已于提交 `97b8b04` 落库，`git ls-files` 与磁盘**同为 108**，差集为 0。`STATIC-SCOPE-REGISTRY-2026-09-20.md` 中「索引 113 / 磁盘 108，5 项已从工作树移除（未提交）」为其**定稿时快照**；该 5 项现已提交，见本报告与登记表追加指针。

## 口径闭环
- 磁盘现存 108 个文件的四类计数（见 `STATIC-SCOPE-REGISTRY-2026-09-20.md` 合计行）自洽：2 + 90 + 15 + 1 = 108；字节合计 **35,041,179**，与 `TASK-NOTES-2026-09-18.md` §12.6 更正一致。
- 原 ④ 类 5 项（`comfyui-settings.html`、`css/comfyui-settings.css`、`js/comfyui-settings.js`、`js/i18n/comfyui-settings.js`、`runninghub/api_providers.json`）已全部删除并提交。
- comfyui/runninghub 移除依赖闭包：`tests/hygiene/test_cleanroom_hygiene.py` 断言①已删文件不得重现、②保留页面不得引用已删路径、③静态层不得保留 comfyui/runninghub/running-hub 业务标识；本机复跑该用例通过。

## 证据边界
计数与字节取自本轮命令输出；不构成远端 CI 或生产验收。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
