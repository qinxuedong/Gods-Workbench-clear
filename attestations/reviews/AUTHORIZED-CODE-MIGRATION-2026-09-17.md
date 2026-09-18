# 自有非画布代码迁移记录（历史记录，已由 v2 分类表取代）

## 授权边界

用户已明确授权迁移其本人拥有、且不属于无限画布/智能画布核心的代码。该授权不包括画布旧实现、资源、用户数据或未能确认依赖关系的模块。

## 本次候选审查

来源根目录：`D:\Working\Code Pro\Gods-Workbench-release`

| 来源 | 目标 | 分类 | 处理 |
|---|---|---|---|
| `backend/generation_api/providers/*.py` | — | 生成服务提供商 | 拒绝迁移：含画布提示词、资源命名和适配语义 |
| `tools/route_permissions.py` | — | 路由权限校验工具 | 拒绝迁移：直接登记画布/智能画布路由和能力 |

## 明确排除

- `main.py`：包含应用总入口和跨域功能，依赖闭包尚未拆分。
- `static/`：包含 `static/js/canvas`、画布界面和资源。
- `data/`、`assets/`：运行时数据、项目数据和用户/资源内容。
- `asset_registry/canvas_engine/`：画布引擎直接实现。
- `asset_registry/storage_bridge/`：与画布资源存储边界未完成拆分。
- `backend/comfyui/`：包含画布资产上传/运行桥接语义，暂列共享依赖。
- `tools/chrome-local-asset-importer/`、`tools/photoshop-asset-connector/`：包含项目/画布协议耦合。
- `tests/`、`docs/`、`.git/`：不复制旧实现、旧测试、旧历史或用户材料。

## 历史结论

本记录只反映早期候选审查，不再作为当前迁移结论。当前结论以 `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md` 和 `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 为准；本轮仅接受其中登记的日期选择器 JavaScript/CSS 两个无画布切片，其余候选继续隔离。
