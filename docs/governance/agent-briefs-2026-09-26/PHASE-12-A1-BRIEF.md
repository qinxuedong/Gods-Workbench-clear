# Phase 12 任务书 A1｜素材库与本地素材真实接入

## 你的角色
你是 A1 负责人。**唯一目标**：把素材库与本地素材这 40 条「未接入」端点接到**真实本地数据源**。

## 范围（严格边界）
- 允许改：`src/gods_workbench/api/routes_asset_library_b4.py`、`src/gods_workbench/api/routes_local_assets.py`、
  `src/gods_workbench/asset_library/**`（可新增模块）、
  `docs/contracts/ASSET-LIBRARY-B4-INTERFACE-CATALOG.yaml`、`docs/contracts/LOCAL-ASSET-INTERFACE-CATALOG.yaml`、
  `docs/fixtures/phase11-b4-*.json`、`docs/fixtures/phase11-local-*.json`（若无则按需新建）、
  `tests/contracts/test_phase11_b4_asset_library.py`、`tests/contracts/test_phase11_b4_*.py`。
- 禁止改：`routes_asset_library.py`（基础能力，已真实）、`routes_asset_registry.py`（属 A2）、
  任何 `core/` 下已有文件、`app.py`、Phase 8 守卫、hygiene。

## 未接入清单（40 条，逐条必须落地）
见 `docs/governance/agent-briefs-2026-09-26/PHASE-12-A1-GAPS.md`，摘要：

- 分类提示词：`GET/PATCH /api/asset-classification-prompt`
- 后台分类任务：`POST/DELETE /api/asset-classification/background`、`GET /api/asset-classification/jobs/{job_id}`
- 素材内容：`GET/PATCH /api/asset-content`、`GET /api/asset-content/pdf`、
  `GET /api/asset-content/versions`、`GET/PATCH/DELETE /api/asset-content/versions/{version_id}`、
  `POST /api/asset-content/versions/{version_id}/restore`
- 文件信息：`GET /api/asset-file-info`、`POST /api/asset-file-reveal`
- 素材库写：`PATCH/DELETE /api/asset-library/categories/{category_id}`、
  `POST /api/asset-library/items/batch`、`POST /api/asset-library/items/classify`、
  `POST /api/asset-library/items/delete`、`POST /api/asset-library/items/move`、
  `PATCH/DELETE /api/asset-library/items/{item_id}`、
  `POST /api/asset-library/items/{item_id}/avatar-status`、`POST /api/asset-library/items/{item_id}/register-avatar`、
  `PATCH/DELETE /api/asset-library/libraries/{library_id}`、`POST /api/asset-library/workflows/upload`
- 本地素材（12 条）：`/api/local-assets`（列表/上传/删除/移动/重命名/文件夹/分类/字幕）、`/api/storage-files`（列表/删除）

## 真实数据源要求

1. **素材库集合**：用 `core.storage.JsonState` 命名空间 `asset_library` 落盘，替换现有纯内存 `AssetLibraryService`
   的「重启即丢」现状（既有 `routes_asset_library.py` 的基础读取可继续读同一份）。
2. **素材条目**：条目承载 `asset_id`（稳定 ID）、名称、类别、库归属、文件引用（相对允许根的展示串）、
   `version`（CAS 用）。`POST /api/asset-library/items/batch` 批量创建，写成功返回真实 `asset_id`。
3. **本机文件**：
   - `GET /api/asset-file-info` 对已在允许根目录内的文件返回真实 `size / mtime / 扩展名`；
     图片用 PIL 读真实宽高（`Pillow` 已安装）。
   - `POST /api/asset-file-reveal` 只解析路径并返回「已定位」事实，**不得**调用 `explorer.exe` 或任何外部进程；
     若你判断必须有外部副作用，则返回 `503` 并在报告里说明。
   - `POST /api/local-assets/upload` 接受**允许根目录内的目标路径 + 来源内容**；
     若来源是请求体 base64，必须限制大小上限（自定并在契约写死）并真实落盘。
4. **分类**：真实调用路径 = 基于文件名/扩展名/已配置规则的**确定性**规则分类（写死规则集，禁止随机）。
   规则集与提示词（`asset-classification-prompt`）用 `JsonState` 落盘。
   后台任务：`POST /api/asset-classification/background` 返回真实 `job_id` + `poll_hint`，
   任务状态也落盘；`DELETE` 停止任务并置为 `cancelled`。
5. **内容与版本**：`asset-content` 为纯文本内容（可落盘）；版本列表为真实历史；
   `restore` 把某一版恢复为当前版并**新增**一个版本号（不得篡改历史）。
6. **`GET /api/asset-content/pdf`**：用 `reportlab` **未安装**。请用**纯标准库**生成最小合法 PDF
   （或判断后返回 `503` 并在契约写明），不得返回假 PDF 字节。若用标准库实现，必须能被
   `%PDF-` 开头且 `%%EOF` 结尾的断言验证。

## 必须写的测试（至少）
- 40 条操作：未认证 `401`、只读写操作 `403`。
- 写→读回：创建条目后能在列表读到；重命名后名称变化；删除后不再返回。
- 路径安全：请求 `C:/outside/xx.txt` 或 `../xx` → `403`，且响应体**不含**该原始路径字符串。
- 未配置 `GW_ALLOWED_ROOTS` 时，所有本机文件端点 `403 LOCAL_FILE_ACCESS_NOT_ADMITTED`。
- 重启用例：同一 `GW_DATA_DIR` 下新建 TestClient 能读到上一实例写入的数据。
- 契约文件 `method/path` 条数与本块操作数一致（沿用既有 `_pairs()` 方式）。

## 交付
报告写入：`docs/governance/agent-briefs-2026-09-26/PHASE-12-A1-REPORT.md`

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
