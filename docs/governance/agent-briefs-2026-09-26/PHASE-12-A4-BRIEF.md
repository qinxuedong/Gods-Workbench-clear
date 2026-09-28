# Phase 12 任务书 A4｜媒体·观测遥测·Provider·AI 真实接入

## 你的角色
你是 A4 负责人。**唯一目标**：把媒体 14 条 + Provider 探测 3 条 + AI 7 条「未接入」端点，
以及观测 4 条「degraded」端点接到**真实数据源**。

## 范围（严格边界）
- 允许改：`src/gods_workbench/api/routes_media.py`、`routes_observability.py`、`routes_settings.py`、`routes_ai.py`、
  `src/gods_workbench/media/**`、`src/gods_workbench/observability/**`、`src/gods_workbench/settings/**`、
  `docs/contracts/MEDIA-INTERFACE-CATALOG.yaml`、`OBSERVABILITY-INTERFACE-CATALOG.yaml`、
  `SETTINGS-INTERFACE-CATALOG.yaml`、`PLATFORM-INTERFACE-CATALOG.yaml`（AI 相关段落）、
  `tests/contracts/test_phase11_b5_media.py`、`test_phase10b_observability.py`、
  `test_phase10d_settings.py`、`test_phase11_b2_platform.py`。
- **禁止改**：`core/` 已有文件、`app.py`、其他块路由、Phase 8 守卫、hygiene。

## 未接入清单（24 条 + 观测 4 条）
见 `docs/governance/agent-briefs-2026-09-26/PHASE-12-A4-GAPS.md`。摘要：

- **媒体（14）**：`/api/asset-proxy/settings`（GET/PATCH）、`/api/asset-thumbnails/settings`（GET/PATCH）、
  `/api/asset-thumbnails/{delete, delete-storyboards, generate, generate-background}`、
  `/api/asset-thumbnails/jobs/{job_id}`、`/api/audio-waveform-data`、`/api/download-output`、
  `/api/media-preview`、`/api/media-transcode`、`/api/online-image`
- **Provider 探测（3）**：`POST /api/providers/{fetch-models, probe-async, test-connection}`
- **AI（7）**：`POST /api/ai/upload`、`/api/codex/help`、`/api/gemini-cli/help`、
  `GET /api/jimeng/credit`、`POST /api/jimeng/help`、`/api/jimeng/login/start`、`/api/jimeng/logout`
- **观测（4，当前 200+degraded）**：`GET /api/observability/{series, health, sources, asset-volumes}`

## 真实数据源要求

1. **本机媒体**（`ffmpeg` / `ffprobe` 已在本机 PATH，`PIL` 已安装）：
   - `POST /api/asset-thumbnails/generate`：对允许根目录内的**真实图片**用 PIL 生成缩略图并落盘到数据目录；
     返回真实输出路径（相对展示串）与真实尺寸。视频缩略图用 ffmpeg 抽帧（若 `ffprobe` 不可用 → `503`）。
   - `GET /api/media-preview`：对允许根目录内的真实文件返回真实元数据（时长/分辨率/大小），
     图片走 PIL，音视频走 `ffprobe`。
   - `GET /api/media-transcode`：真实调用 ffmpeg 转码到数据目录；输入越界 → `403`；ffmpeg 缺失 → `503`。
   - `GET /api/audio-waveform-data`：用 ffmpeg 解码后按固定桶宽计算**真实** RMS 包络（禁止随机/常量曲线）；
     无音频流 → `400` 或 `503`（写死在契约）。
   - `POST /api/asset-thumbnails/generate-background`：返回真实 `job_id` + `poll_hint`，
     后台状态真实落盘，可被 `GET /jobs/{job_id}` 查到。
   - `GET /api/download-output`：只允许下载数据目录内的产物，返回真实字节流 + `Content-Disposition`。
   - `POST /api/online-image`：**允许**真实 HTTP 抓取远端图片（`httpx` 已安装）到数据目录，
     带大小上限与超时；网络失败 → `503`。禁止回显请求里的内网地址。
   - `asset-proxy/settings`、`asset-thumbnails/settings`：`JsonState` 落盘（含体积上限/目标格式等），
     `delete` / `delete-storyboards` 真实删除数据目录内的产物。
2. **Provider 探测（3 条）**：真实发 HTTP 请求到调用方提交的 `base_url`（要求 `https://` 或显式允许的
   `http://127.0.0.1`），带调用方提交的凭据（**只用不存**，必须从日志/响应中剥离）。
   - `fetch-models` → 真实 `GET /v1/models` 结果。
   - `test-connection` → 真实往返延迟（毫秒，实测）。
   - `probe-async` → 真实返回 `job_id` + `poll_hint`，后台探测状态落盘。
   - 无凭据或网络失败 → `503 PROVIDER_PROBE_*`，**不得**伪造模型列表或延迟数字。
   - 必须做 SSRF 防护：拒绝内网/回环地址（除显式允许 `127.0.0.1`）、拒绝非 http(s) scheme。
3. **AI（7 条）**：
   - `POST /api/ai/upload`：真实接收上传并落盘到数据目录（大小上限写死），返回真实 `asset_id`。
   - `codex/help`、`gemini-cli/help`、`jimeng/help`、`jimeng/login/start`、`jimeng/logout`、`jimeng/credit`：
     这些依赖**外部 CLI 子进程**。请实现为**配置驱动**：仅当环境变量
     `GW_CLI_EXECUTION=1` **且** `shutil.which()` 找到命令时才真实执行（带超时、参数白名单、
     不使用 `shell=True`）；否则 `503` 并写明未准入。**禁止**在未配置时伪造成功。
   - `jimeng/logout` 若 CLI 不可用 → `503`（不要静默成功）。
4. **观测（4 条）**：
   - `health`：`hardware_telemetry` 组件改为**真实** `psutil` 读数可用状态（`status=ok` +
     真实 CPU/内存/磁盘数值）；`metrics_series` / `source_registry` / `asset_volume_index`
     若你实现了 `series` / `sources` / `asset-volumes` 则改为 `ok`，否则保持 `not_integrated`。
   - `series`：用 `psutil` **真实采样**（至少 2 个时间点）生成 CPU/内存序列；
     采样不足时返回 `data_status=degraded` 并写明，**禁止**插值造假。
   - `sources`：真实登记本进程已接入的数据源（psutil / audit / services），不再是空数组。
   - `asset-volumes`：真实遍历允许根目录统计素材体积（未配置根目录 → 空 + `data_status=not_integrated`）。
   - 契约里把「hardware_telemetry 固定 not_integrated」的旧决策**更新**为真实遥测口径。

## 必须写的测试（至少）
- 每条：未认证 `401`；写操作只读 `403`。
- 媒体：用 `tmp_path` 生成一张真实 PNG → 调 generate 得到真实缩略图 → 文件存在且尺寸正确。
- 波形：用 ffmpeg 生成 1 秒正弦 wav → 波形数组长度 > 0 且非全常量。
- Provider：`httpx` 打桩或本地极小 HTTP 服务 → 真实往返；SSRF 用例（`http://169.254.169.254/`）→ `400/403`。
- 观测：`health` 中 `hardware_telemetry` 为 `ok` 且带真实数值；`series` 至少返回 2 个采样点。
- 依赖缺失：把 `PATH` 清空或 monkeypatch `shutil.which` 返回 None → `503`。

## 交付
报告写入：`docs/governance/agent-briefs-2026-09-26/PHASE-12-A4-REPORT.md`

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
