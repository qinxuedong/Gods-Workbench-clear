# Phase 12 任务书 A2｜素材注册表真实接入

## 你的角色
你是 A2 负责人。**唯一目标**：把素材注册表这 45 条「未接入」端点接到**真实落盘注册表**。

## 范围（严格边界）
- 允许改：`src/gods_workbench/api/routes_asset_registry.py`、`src/gods_workbench/asset_registry/**`、
  `docs/contracts/ASSET-REGISTRY-INTERFACE-CATALOG.yaml`、`docs/fixtures/phase11-b3-*.json`、
  `tests/contracts/test_phase11_b3_asset_registry.py`。
- 禁止改：`core/` 已有文件、`app.py`、`routes_projects.py`、`routes_god_canvas.py`、
  其他块的路由文件、Phase 8 守卫、hygiene。

## 未接入清单（45 条）
见 `docs/governance/agent-briefs-2026-09-26/PHASE-12-A2-GAPS.md`。摘要（按类别）：

- **媒体取图**（4）：`GET .../assets/{asset_id}/media`、`.../image-versions/{version_id}/media`、
  `.../video/frame`、`.../video/storyboard`。→ 这些**允许**读允许根目录内的真实图片/视频帧（PIL/ffmpeg 可选），
  或返回 `503` 说明依赖未准入。若实现，必须使用 `resolve_within_roots()`。
- **资产 CRUD**：`POST /assets/archive`、`PATCH/DELETE /assets/{asset_id}`、`POST /assets/import`、
  `POST /assets/relations`、`DELETE .../relations/{related_asset_id}`、`POST/DELETE .../tags`、
  `POST /assets/resolve-reference`、`POST .../open-local`
- **图片版本**：`POST/PATCH/DELETE .../image-versions[/{version_id}]`
- **视频剪辑**：`POST .../video/clip`
- **治理**：`POST /governance/asset-trash/{entry_id}/restore`、`/governance/assets/{asset_id}/restore`、
  `/governance/canvases/{canvas_id}/restore`、`/governance/canvases/purge-expired`、
  `/governance/audit-outbox/reconcile`、`/governance/operations`、`GET /governance/cascade-preview`、
  `/recycle-bin/{entry_id}/restore`、`/project-recycle/{project_id}/restore`
- **索引**：`POST /reindex`、`POST /index/sync`
- **配置**：`PATCH /preferences/team`、`PATCH /settings/features/{feature_id}`、`PATCH /settings/index-automation`
- **预设与目录模板**：`POST/DELETE /presets[/{preset_id}]`、
  `POST/PATCH /project-directory-templates[/{template_id}]`、
  `POST .../archive`、`POST .../default`
- **项目实体与门**：`PATCH /project-entities/{entity_id}`、`PATCH /project-gates/{gate_id}`、
  `POST /projects/{project_id}/assets`、`POST /projects/{project_id}/entities`
- **远程素材**：`POST/GET/DELETE /remote-assets[/{asset_id}]`
- **工作区任务**：`POST /workspace-jobs/{job_id}/{action}`
- **PDF 导出**：`POST /assets/export-pdf`

## 真实数据源要求

1. **注册表落盘**：用 `core.storage.JsonState` 命名空间 `asset_registry` 落盘，
   `AssetRegistryService` 从 JSON 读改写（原子替换）。既有 17 条只读真值接口继续可用。
2. **稳定 ID**：`asset_id` / `entity_id` / `gate_id` / `entry_id` / `preset_id` / `template_id` 一律
   用 `core.storage.next_sequence()` 生成确定性序号 ID，**禁止 uuid/随机**。
3. **CAS**：写操作必须带 `expected_version`，冲突返回 `409 VERSION_CONFLICT`（沿用既有错误包）。
4. **关系/标签**：真实落盘的多对多关系集合；`resolve-reference` 真实解析已存在的 `asset_id`。
5. **open-local**：只做路径解析与存在性检查，**不得**调用 `explorer.exe` / `start` / `subprocess`。
6. **export-pdf**：`reportlab` 未安装。用纯标准库生成最小合法 PDF，或返回 `503` 并写明；
   禁止返回假字节。
7. **remote-assets**：**允许**真实的 HTTP HEAD/GET 探测（`httpx` 已安装）来记录远程素材元数据；
   网络失败必须 `503` 或 `data_status=degraded`，禁止编造元数据。**禁止**下载任意大文件。
8. **reindex / index-sync**：真实遍历允许根目录统计文件数/体积；未配置根目录 → `503`。
9. **审计类（audit-outbox/reconcile、operations）**：真实读写落盘的 outbox 条目；
   无条目即返回空数组，不得编造。

## 必须写的测试（至少）
- 45 条：未认证 `401`；写操作只读角色 `403`；带错误 `expected_version` → `409`。
- 写→读回：创建预设/模板/远程素材后能读到；删除后不再返回。
- 稳定 ID：连续创建得到 `pr-0001`/`pr-0002` 形态而非随机串。
- 路径安全：`open-local` 传入 `C:/outside/x` → `403`，响应不含原始路径。
- 重启用例：同 `GW_DATA_DIR` 新实例可读回上一实例数据。

## 交付
报告写入：`docs/governance/agent-briefs-2026-09-26/PHASE-12-A2-REPORT.md`

## 通用硬门禁（逐条必须满足）

1. **契约先行**：先改本块契约 YAML（`version` 号 +1，写死状态码 / 错误码 / 稳定 ID 口径 /
   fail-closed 触发条件 / CAS 粒度），再改实现。契约里必须体现新真实语义，不能只写 503。
2. **零伪造**：任何无法证明的分支必须显式返回 `503` + `data_status=not_integrated`，
   或空集合 + `data_gaps`。**禁止**随机数、常量假曲线、演示数据、假 job_id、假 URL、假进度。
3. **路径安全**：任何本机文件读写必须调用 `gods_workbench.core.storage.resolve_within_roots()`；
   必须已配置 `GW_ALLOWED_ROOTS`（绝对路径，`os.pathsep` 分隔），否则返回 `403`；
   对外展示路径用 `relative_display()`，**绝不回显调用方给出的原始绝对路径**。
4. **失败关闭**：外部依赖（ffmpeg / Provider 凭据 / 允许根目录）缺失或异常 → `503`，
   不得静默降级为假成功。
5. **真实副作用可核验**：写入必须能被紧接着的读接口观察到；删除后读接口不得再返回该对象。
   （请为每条写接口至少写一个「写 → 读回」断言。）
6. **保留既有边界语义**：`401`（未认证）、`403`（只读角色写操作）、`409`（CAS 冲突）
   的既有测试必须继续通过；把本块原「一律 503」的断言改成断言**新真实语义**，
   并**保留**依赖缺失时的 `503` 用例。
7. **禁止改动**：`src/gods_workbench/api/app.py`、`src/gods_workbench/core/*.py`（**除你新建的块内子模块**）、
   `tests/contracts/test_phase8_frontend_backend_api_gap.py`、`tests/hygiene/*`。
   若确实需要改，**停下来在报告里写「需要主代理改 X」，不要自己动**。
8. **语言**：代码注释、文档、报告全部中文。
9. **禁止 git 操作**：不要 `git add/commit/push/checkout/stash/reset/clean`。只改工作树文件。
10. **交付**：完成后把「本块实施报告」写入指定路径，格式见下。

## 实施报告格式（写入指定路径）

```markdown
# Phase 12 块 <X>｜实施报告

- 日期：2026-09-26
- 负责人：<块>代理
- 契约版本：<旧> → <新>

## 1. 逐条接入结果
| # | method path | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|

## 2. 真实数据源证据
（说明数据落在哪、重启是否可恢复、如何用命令复算）

## 3. 失败关闭证据
（依赖缺失 / 越界 / 未认证 时各返回什么，贴命令与响应）

## 4. 本块测试结果
（原样贴 `python -m pytest <本块用例> -q` 输出）

## 5. 未闭环项与不确定项
（必须如实列出，禁止写「无」除非真的没有）

## 6. 需要主代理处理的共享文件改动
（没有就写「无」）
```

## 环境提示

- 仓库根：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（PowerShell，`cwd` 已在此）。
- 运行测试：`python -m pytest <path> -q`。
- 认证：测试里用 `Bearer cleanroom-test` + `X-User-Role: editor` 头即可（既有用例同口径）。
- 未接入清单：`docs/governance/agent-briefs-2026-09-26/PHASE-12-<块>-GAPS.md`。
- 共享基础设施：`src/gods_workbench/core/storage.py`（**只读复用，不要改**）。
