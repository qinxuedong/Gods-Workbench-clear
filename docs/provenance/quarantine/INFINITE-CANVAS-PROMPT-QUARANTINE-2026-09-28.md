# 无限画布旧提示词隔离登记（2026-09-28）

记录日期：2026-09-28  
裁决：用户已裁决 **继续隔离，不准入运行链路**（审计项 A-01）。  
发布状态：`NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`（本登记不改变发布状态）。

本文件只登记位置、字节数与哈希，**不复制提示词正文**。正文仅保留在同目录的隔离副本中，该目录不在 `StaticFiles` 挂载范围内，不得被 `/static` 提供。

| 项 | 值 |
|---|---|
| 原路径 | `src/gods_workbench/static/system-prompts/infinite-canvas-prompt-templates.md` |
| 原 URL | `/static/system-prompts/infinite-canvas-prompt-templates.md` |
| 新位置 | `docs/provenance/quarantine/infinite-canvas-prompt-templates.md` |
| 字节数 | 24488 |
| SHA-256（工作树原始字节） | `3ac024d06e99c3601bfd88f5956050e9242512f117901ef2083459ac278326c9` |
| SHA-256（CRLF/CR 归一为 LF） | `12e4ad04d880b09c4e58a666103286553277b34362463bf0201a5d3d3e9723a2` |
| 隔离裁决 | 继续隔离；移出静态挂载目录；应用层拒绝原 URL；不进入运行迁移链路，不进入交付导出清单 |
| 归属 | ④ 隔离 / 不迁移 |

## 边界

- 原路径不得再被 Git 跟踪，也不得由静态服务返回 200。
- 隔离副本不是运行制品，不得复制到 `src/gods_workbench/static/**` 或任何可被 `/static` 提供的路径。
- 本登记不是洁净终验通过，也不是公开发布授权。
