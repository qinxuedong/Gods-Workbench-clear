# 静态层来源范围登记（2026-09-20）

记录日期：2026-09-20
仓库：`Gods-Workbench-clear`（分支 master）
范围：`src/gods_workbench/static/**`（**工作树现存文件**逐文件清点）
发布状态：`NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`

> 归属四类口径见 `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`：
> ① 用户自有原创切片；② 按契约/夹具重写；③ 第三方资产；④ 隔离/不迁移。
> 2026-09-20 用户裁决：V2 前端整体保留；画布/工具只保留入口首页；快捷工具入口及其内部内容不迁移；comfyui/runninghub 不迁移。

## 汇总计数

| 类别 | 文件数 | 字节数 |
|---|---:|---:|
| ① 用户自有原创切片 | 2 | 10385 |
| ② 按契约/夹具重写 | 90 | 4282873 |
| ③ 第三方资产 | 15 | 30723433 |
| ④ 隔离/不迁移 | 1 | 24488 |
| **合计** | **108** | **35041179** |

清点命令：`Get-ChildItem -Recurse -File src/gods_workbench/static`（磁盘实测）；与 `git ls-files src/gods_workbench/static`（113 条，含 5 个已从工作树删除但尚未提交的跟踪文件）交叉核对。

## 逐文件明细

| # | 相对路径 | 字节数 | 归属 | 依据 |
|---:|---|---:|---|---|
| 1 | `src/gods_workbench/static/api-settings.html` | 36783 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 2 | `src/gods_workbench/static/asset-manager.html` | 4526 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 3 | `src/gods_workbench/static/asset-share.html` | 941 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 4 | `src/gods_workbench/static/canvas-list.html` | 14715 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 5 | `src/gods_workbench/static/css/api-settings.css` | 176078 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 6 | `src/gods_workbench/static/css/asset-manager-coverflow.css` | 10720 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 7 | `src/gods_workbench/static/css/asset-manager.css` | 268435 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 8 | `src/gods_workbench/static/css/asset-review.css` | 23266 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 9 | `src/gods_workbench/static/css/asset-share.css` | 6949 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 10 | `src/gods_workbench/static/css/asset-vault.css` | 79491 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 11 | `src/gods_workbench/static/css/canvas-list.css` | 36029 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 12 | `src/gods_workbench/static/css/canvas-overview.css` | 34386 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 13 | `src/gods_workbench/static/css/context-hotkey-feedback.css` | 844 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 14 | `src/gods_workbench/static/css/context-tree-animations.css` | 6607 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 15 | `src/gods_workbench/static/css/directory-settings.css` | 6185 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 16 | `src/gods_workbench/static/css/episode-pipeline.css` | 82194 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 17 | `src/gods_workbench/static/css/episode-video-script.css` | 6247 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 18 | `src/gods_workbench/static/css/hardware-design-system.css` | 48299 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 19 | `src/gods_workbench/static/css/obsidian-gold-settings.css` | 15396 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 20 | `src/gods_workbench/static/css/project-calendar-dialog.css` | 6699 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 21 | `src/gods_workbench/static/css/signal-flow.css` | 379849 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 22 | `src/gods_workbench/static/css/tailwind-utilities.css` | 83377 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 23 | `src/gods_workbench/static/css/theme.css` | 55574 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 24 | `src/gods_workbench/static/css/workspace-pages.css` | 72766 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 25 | `src/gods_workbench/static/episode-pipeline.html` | 7055 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 26 | `src/gods_workbench/static/governance.html` | 16856 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 27 | `src/gods_workbench/static/js/api-settings.js` | 109677 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 28 | `src/gods_workbench/static/js/asset-auth/api.js` | 4707 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 29 | `src/gods_workbench/static/js/asset-auth/http.js` | 518 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 30 | `src/gods_workbench/static/js/asset-manager.js` | 1146056 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 31 | `src/gods_workbench/static/js/asset-manager/api.js` | 38140 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 32 | `src/gods_workbench/static/js/asset-manager/classification.js` | 5682 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 33 | `src/gods_workbench/static/js/asset-manager/coverflow.js` | 31925 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 34 | `src/gods_workbench/static/js/asset-manager/formatters.js` | 549 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 35 | `src/gods_workbench/static/js/asset-manager/http.js` | 515 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 36 | `src/gods_workbench/static/js/asset-manager/path-utils.js` | 140 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 37 | `src/gods_workbench/static/js/asset-manager/storage.js` | 527 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 38 | `src/gods_workbench/static/js/asset-review.js` | 67134 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 39 | `src/gods_workbench/static/js/asset-review/api.js` | 3953 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 40 | `src/gods_workbench/static/js/asset-review/http.js` | 437 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 41 | `src/gods_workbench/static/js/asset-share.js` | 17829 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 42 | `src/gods_workbench/static/js/asset-share/api.js` | 2148 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 43 | `src/gods_workbench/static/js/asset-share/http.js` | 347 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 44 | `src/gods_workbench/static/js/aura-trace.js` | 6924 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 45 | `src/gods_workbench/static/js/canvas-list.js` | 100432 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 46 | `src/gods_workbench/static/js/canvas-list/api.js` | 3810 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 47 | `src/gods_workbench/static/js/canvas-list/http.js` | 565 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 48 | `src/gods_workbench/static/js/canvas/http.js` | 512 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 49 | `src/gods_workbench/static/js/context-hotkeys.js` | 3218 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 50 | `src/gods_workbench/static/js/context-prefetch.js` | 9079 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 51 | `src/gods_workbench/static/js/directory-settings-nav.js` | 1102 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 52 | `src/gods_workbench/static/js/episode-liquid-metal.js` | 48221 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 53 | `src/gods_workbench/static/js/episode-pipeline.js` | 247491 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 54 | `src/gods_workbench/static/js/floating-dismissal.js` | 32370 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 55 | `src/gods_workbench/static/js/governance.js` | 19412 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 56 | `src/gods_workbench/static/js/hardware-telemetry.js` | 39140 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 57 | `src/gods_workbench/static/js/http-transport.js` | 3098 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 58 | `src/gods_workbench/static/js/i18n-core.js` | 2614 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 59 | `src/gods_workbench/static/js/i18n.js` | 1292 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 60 | `src/gods_workbench/static/js/i18n/api-settings.js` | 16666 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 61 | `src/gods_workbench/static/js/i18n/canvas.js` | 26508 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 62 | `src/gods_workbench/static/js/i18n/common.js` | 3249 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 63 | `src/gods_workbench/static/js/i18n/governance.js` | 11767 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 64 | `src/gods_workbench/static/js/i18n/smart-canvas.js` | 24678 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 65 | `src/gods_workbench/static/js/i18n/studio.js` | 9170 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 66 | `src/gods_workbench/static/js/i18n/task-center.js` | 18308 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 67 | `src/gods_workbench/static/js/settings.js` | 10967 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 68 | `src/gods_workbench/static/js/task-center.js` | 94599 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 69 | `src/gods_workbench/static/js/theme.js` | 12124 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 70 | `src/gods_workbench/static/js/touch-mouse.js` | 6240 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 71 | `src/gods_workbench/static/js/workspace-common.js` | 9123 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 72 | `src/gods_workbench/static/prompt-registry/NOTICE.md` | 2363 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 73 | `src/gods_workbench/static/prompt-registry/manifest.json` | 3534 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 74 | `src/gods_workbench/static/prompt-registry/sources/awesome-gpt-image.json` | 61366 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 75 | `src/gods_workbench/static/prompt-registry/sources/awesome-gpt4o-image-prompts.json` | 96430 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 76 | `src/gods_workbench/static/prompt-registry/sources/banana-prompt-quicker.json` | 397075 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 77 | `src/gods_workbench/static/prompt-registry/sources/freestylefly-gpt-image-2.json` | 1195361 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 78 | `src/gods_workbench/static/prompt-registry/sources/youmind-gpt-image-2.json` | 346446 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 79 | `src/gods_workbench/static/prompt-registry/sources/youmind-nano-banana-pro.json` | 281937 | ③ | 第三方提示词快照（MIT / CC BY 4.0，见 NOTICE.md） |
| 80 | `src/gods_workbench/static/system-prompts/infinite-canvas-prompt-templates.md` | 24488 | ④ | 无限画布旧提示词，隔离不迁移 |
| 81 | `src/gods_workbench/static/task-center.html` | 18109 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 82 | `src/gods_workbench/static/update-notes.json` | 486 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 83 | `src/gods_workbench/static/v2/agents.html` | 21178 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 84 | `src/gods_workbench/static/v2/assets.html` | 15332 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 85 | `src/gods_workbench/static/v2/collab.html` | 28159 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 86 | `src/gods_workbench/static/v2/css/project-date-range.css` | 2574 | ① | 用户自有原创切片（哈希登记于 AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt） |
| 87 | `src/gods_workbench/static/v2/index.html` | 102411 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 88 | `src/gods_workbench/static/v2/js/agents-controller.js` | 7464 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 89 | `src/gods_workbench/static/v2/js/assets-controller.js` | 6354 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 90 | `src/gods_workbench/static/v2/js/collab-controller.js` | 10302 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 91 | `src/gods_workbench/static/v2/js/home-controller.js` | 61706 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 92 | `src/gods_workbench/static/v2/js/production-controller.js` | 24843 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 93 | `src/gods_workbench/static/v2/js/project-date-range.js` | 7811 | ① | 用户自有原创切片（哈希登记于 AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt） |
| 94 | `src/gods_workbench/static/v2/js/projects-controller.js` | 71762 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 95 | `src/gods_workbench/static/v2/js/storyboard-controller.js` | 8511 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 96 | `src/gods_workbench/static/v2/js/v2-shell.js` | 12974 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 97 | `src/gods_workbench/static/v2/production.html` | 33872 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 98 | `src/gods_workbench/static/v2/projects.html` | 63475 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 99 | `src/gods_workbench/static/v2/settings.html` | 40629 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 100 | `src/gods_workbench/static/v2/storyboard.html` | 24296 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 101 | `src/gods_workbench/static/v2/workshop.html` | 57780 | ② | 按 docs/behavior 契约与 docs/fixtures 夹具自行重写 |
| 102 | `src/gods_workbench/static/vendor/MANIFEST.md` | 8586 | ③ | 第三方资产（许可见 vendor/MANIFEST.md 与许可合规清单） |
| 103 | `src/gods_workbench/static/vendor/css/fonts.css` | 677 | ③ | 第三方资产（许可见 vendor/MANIFEST.md 与许可合规清单） |
| 104 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf` | 9036076 | ③ | 第三方资产（许可见 vendor/MANIFEST.md 与许可合规清单） |
| 105 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf` | 8812324 | ③ | 第三方资产（许可见 vendor/MANIFEST.md 与许可合规清单） |
| 106 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf` | 8806392 | ③ | 第三方资产（许可见 vendor/MANIFEST.md 与许可合规清单） |
| 107 | `src/gods_workbench/static/vendor/js/lucide.js` | 401894 | ③ | 第三方资产（许可见 vendor/MANIFEST.md 与许可合规清单） |
| 108 | `src/gods_workbench/static/vendor/js/three-0.160.0.module.js` | 1272972 | ③ | 第三方资产（许可见 vendor/MANIFEST.md 与许可合规清单） |

## 已从工作树移除（未提交）

以下文件仍在 `git ls-files` 中（删除尚未提交），但**已从工作树删除**，属类别 ④（用户裁决 comfyui/runninghub 不迁移）：

| 原相对路径 | 归属 | 状态 |
|---|---|---|
| `src/gods_workbench/static/comfyui-settings.html` | ④（comfyui 不迁移） | 已从工作树删除，未提交 |
| `src/gods_workbench/static/css/comfyui-settings.css` | ④（comfyui 不迁移） | 已从工作树删除，未提交 |
| `src/gods_workbench/static/js/comfyui-settings.js` | ④（comfyui 不迁移） | 已从工作树删除，未提交 |
| `src/gods_workbench/static/js/i18n/comfyui-settings.js` | ④（comfyui 不迁移） | 已从工作树删除，未提交 |
| `src/gods_workbench/static/runninghub/api_providers.json` | ④（runninghub 不迁移） | 已从工作树删除，未提交 |

## 证据边界

- 本登记为**工作树实测**；计数与字节数取自本次命令输出，不构成远端 CI 或生产验收。
- 洁净仓当前仍为 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。

## 追加更新（2026-09-20 收口）

本节为**追加**，不改写上文逐文件登记与合计数。

- §「已从工作树移除（未提交）」所列 5 个 comfyui/runninghub 文件，已于提交 `97b8b04` **落库删除**；当前 `git ls-files src/gods_workbench/static` 与磁盘**同为 108**，差集为 0。
- 合计口径不变：108 文件 / 35,041,179 字节；四类 ① 2 / ② 90 / ③ 15 / ④ 1。
- 复核见 `docs/governance/agent-reports-2026-09-20/T-classification.md`。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
