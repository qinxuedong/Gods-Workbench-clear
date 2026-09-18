# Gods Workbench（洁净修复版）

本仓库是依据行为规范、接口契约、黄金夹具和逐文件来源分类进行的私有洁净实现。当前状态为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**，测试通过不等于生产就绪或独立发布授权。

## 当前实现范围

- 项目中心：活跃/归档/回收站筛选、搜索、创建、编辑、排期和 CAS 生命周期治理。
- `god-canvas`：普通拓扑读取、节点拖动、节点删除、CAS 保存、JSON/`.godmap` 导入导出。
- 智能画布最小链路：`202 Accepted`、稳定 `job_id`、任务轮询、状态机和权限错误语义。
- 原生前端：HTML5、现代 JavaScript、CSS；仅保留两个经审查的日期选择器非画布切片，项目中心和画布 UI 均按契约重写。

## 认证边界

匿名请求可读取当前本地演示数据；所有写操作需要 `Authorization: Bearer <token>`。`X-User-Role` 仅用于本地/测试角色矩阵，支持 `editor`、`governor`、`admin` 和只读角色。当前未接入外部身份提供商，因此不得把此仓库视为生产认证方案。

## 快速启动

环境：Python 3.11+、FastAPI、Uvicorn、Pydantic v2。

```powershell
python run.py
```

默认服务地址：`http://127.0.0.1:2077`

- 项目中心：`http://127.0.0.1:2077/`（307 重定向到 `/static/v2/projects.html`）
- `god-canvas`：`http://127.0.0.1:2077/static/v2/workshop.html`
- API 文档：`http://127.0.0.1:2077/docs`

## 验证

```powershell
pytest -v
```

验证覆盖黄金夹具、项目与画布 CAS、并发竞争、拓扑结构、`.godmap`、任务状态机、401/403/409/202、静态边界和受限资源扫描。

## 来源与排除

- 自有代码分类：`docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`
- 迁移哈希：`docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`
- 行为/契约/夹具输入：`docs/behavior/`、`docs/contracts/`、`docs/fixtures/`
- 无限画布、智能画布旧实现、Chrome/Photoshop 连接器、生成适配器、图片字体媒体、用户数据和 `PLUGIN-PROTOCOL-SPEC.md` 均不作为当前实现输入。
- 历史阶段证明已标记为历史材料；最终独立复核尚未完成。
