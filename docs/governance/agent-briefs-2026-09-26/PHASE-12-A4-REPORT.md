# Phase 12 块 A4｜实施报告

- 日期：2026-09-26
- 负责人：A4 块（本会话为主代理串行亲自实施）
- 契约版本：`p11-b5-1 -> p12-a4-1`（MEDIA）、`p10d-frozen-1 -> p12-a4-1`（SETTINGS）、`phase11-b2-frozen-1 -> p12-a4-1`（PLATFORM）、`p12-a4-1`（OBSERVABILITY，本轮前半段完成）
- 基准提交：`bd472a7`（工作树本来即脏，含本地账户/启动器并行改动，未回收）

## 0. 前置声明：本会话未派子代理

用户原始目标要求「所有可用代理人组成专业团队 / 子代理并行最多 4 个 / 审核代理用 GPT-6-Astra high」。
本会话实际调用 `spawn_agent` / `send_message` / `wait_agent` / `create_thread` 均失败（工具不可用），
因此 A4 由主代理串行亲自实施，没有独立审核代理。本报告全部结论为主代理自证，
不构成独立审计或生产验收。

## 1. 逐条接入结果

### 1.1 媒体与缩略图（14 条）

| # | method path | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|
| 1 | GET /api/asset-proxy/settings | 503 MEDIA_NOT_INTEGRATED | 200，默认关闭 + notice；凭据字段剥离 | JsonState 命名空间 media_settings | test_b5_settings_write_readback |
| 2 | PATCH /api/asset-proxy/settings | 503 | 200，写后读回，revision 递增，凭据不落库不回显 | 同上 | 同上 |
| 3 | GET /api/asset-thumbnails/settings | 503 | 200，默认 mode=source、width=256 | 同上 | 同上 |
| 4 | PATCH /api/asset-thumbnails/settings | 503 | 200，width 夹在 64-2048，mode 白名单 | 同上 | 同上 |
| 5 | POST /api/asset-thumbnails/generate | 503 | 200，PIL 真实重采样并落盘 GW_DATA_DIR/media_output/thumbnails | 允许根目录内真实文件 + PIL | test_b5_local_file_read_write_and_thumbnail |
| 6 | POST /api/asset-thumbnails/generate-background | 503 | 202，真实执行后登记 tjob_NNNN + poll_hint=/api/asset-thumbnails/jobs/{id} | JsonState 命名空间 media_jobs | 同上 |
| 7 | GET /api/asset-thumbnails/jobs/{job_id} | 503 | 200 回读任务；不存在 404 THUMBNAIL_JOB_NOT_FOUND | 同上 | 同上 |
| 8 | POST /api/asset-thumbnails/delete | 503 | 200，真实删除缓存并返回真实 removed 计数；删除后不再可读 | 数据目录内真实文件 | 同上 |
| 9 | POST /api/asset-thumbnails/delete-storyboards | 503 | 200，同上（kind=storyboards） | 同上 | test_b5_auth_and_readonly_boundary |
| 10 | GET /api/media-preview | 503 | 200 真实字节：图片走 PIL，视频走 ffmpeg 抽帧 | 允许根目录 + PIL/ffmpeg | test_b5_missing_dependency_fails_closed |
| 11 | GET /api/media-transcode | 503 | 200 ffmpeg 真实 H.264 MP4；缺失/失败 503 | ffmpeg | 同上 |
| 12 | GET /api/audio-waveform-data | 503 | 200 真实 RMS 包络（16k 单声道、240 桶）；无音频流 400 | ffmpeg 真实解码 | test_b5_waveform_real_rms |
| 13 | GET /api/download-output | 503 | 200，只允许 GW_DATA_DIR 内文件；越界 403、不存在 404 | 数据目录 | test_b5_local_file_read_write_and_thumbnail |
| 14 | POST /api/online-image | 503 | 200 真实 httpx 抓取（20s 超时 / 16MB 上限 / 不跟随重定向） | httpx + 真实远端 | test_b5_online_image_ssrf_blocked |

### 1.2 Provider 探测（3 条 + 1 条新增轮询端点）

| # | method path | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|
| 15 | POST /api/providers/fetch-models | 503 PROVIDER_PROBE_NOT_INTEGRATED | 200 真实 GET {base_url}/v1/models，模型列表来自上游原文 | httpx | test_provider_probe_endpoints_fail_closed_without_upstream |
| 16 | POST /api/providers/probe-async | 503 | 200 真实请求后登记 pjob_NNNN + poll_hint，可回读；raw 已剥离凭据 | httpx + JsonState 命名空间 provider_probes | 同上 / test_provider_probe_ssrf_blocked |
| 17 | POST /api/providers/test-connection | 503 | 200 真实往返 + 实测 latency_ms | httpx | 同上 |
| +1 | GET /api/providers/probe-async/jobs/{job_id} | （无） | 200 回读探测任务；不存在 404 PROVIDER_PROBE_JOB_NOT_FOUND | 同上 | 契约/实现一致性守卫 |

### 1.3 AI 与 CLI（7 条）

| # | method path | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|
| 18 | POST /api/ai/upload | 503 AI_UPLOAD_NOT_INTEGRATED | 200 真实接收 multipart 并落盘 GW_DATA_DIR/ai_uploads，返回 upl_NNNN 与真实下载 URL | 真实上传字节 | test_ai_upload_persists_real_file |
| 19 | POST /api/codex/help | 503 CLI_HELP_NOT_INTEGRATED | 门禁通过时执行固定 <codex> --help；未启用 503 | 真实子进程 | test_cli_help_executes_when_gated |
| 20 | POST /api/gemini-cli/help | 503 | 同上（候选命令 gemini/gemini-cli/antigravity） | 同上 | test_external_actions_fail_closed_without_leaking_payload |
| 21 | POST /api/jimeng/help | 503 | 同上（候选命令 dreamina/jimeng） | 同上 | 同上 |
| 22 | GET /api/jimeng/credit | 503 JIMENG_CREDIT_NOT_INTEGRATED | 门禁通过时执行固定 jimeng credit；未启用 503，绝不伪造余额 | 同上 | 同上 |
| 23 | POST /api/jimeng/login/start | 503 JIMENG_LOGIN_NOT_INTEGRATED | 门禁通过时执行固定 jimeng login；二维码仅从真实输出提取 | 同上 | 同上 |
| 24 | POST /api/jimeng/logout | 503 | 门禁通过时执行固定 jimeng logout | 同上 | 同上 |

### 1.4 观测（4 条，本轮前半段已完成并复测）

| # | method path | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|
| 25 | GET /api/observability/health | 固定 not_integrated | 200 psutil 真实 CPU/内存/磁盘读数 | psutil | test_phase10b_observability.py |
| 26 | GET /api/observability/series | 空 + not_integrated | 真实采样序列；少于 2 点则 data_status=degraded（禁插值） | 命名空间 observability_samples | 同上 |
| 27 | GET /api/observability/sources | 空 + not_integrated | 真实登记本进程组件 | 进程内真实状态 | 同上 |
| 28 | GET /api/observability/asset-volumes | 空 + not_integrated | 真实遍历 GW_ALLOWED_ROOTS 统计体积；未配置则空 + not_integrated | 允许根目录 | 同上 |

## 2. 真实数据源证据

- 落盘命名空间（core.storage.JsonState，原子替换、重启可恢复）：
  media_settings、media_jobs、provider_probes、ai_uploads、observability_samples。
- 真实文件输出：GW_DATA_DIR/media_output/{thumbnails,transcode,online}、GW_DATA_DIR/ai_uploads/。
- 真实外部进程：ffmpeg（抽帧/波形/转码）、ffprobe（时长）、PIL（图像重采样）。
- 真实网络：httpx 对上游 /v1/models 与远端图片 URL 发请求。
- 稳定 ID 口径：tjob_NNNN（缩略图任务）、pjob_NNNN（Provider 探测任务）、upl_NNNN（上传），
  由序号计数器推导，禁止随机数与 uuid。
- 复算命令：python -m pytest tests/contracts/test_phase11_b5_media.py tests/contracts/test_phase10d_settings.py tests/contracts/test_phase11_b2_platform.py tests/contracts/test_phase10b_observability.py -q

## 3. 失败关闭证据

| 场景 | 结果 |
|---|---|
| 未认证访问任意端点 | 401 unauthorized |
| 只读角色调用写/执行端点 | 403 |
| 未配置 GW_ALLOWED_ROOTS 读取本机文件 | 403 LOCAL_FILE_ACCESS_NOT_ADMITTED |
| 本机文件越界（不在允许根目录） | 403 PATH_OUTSIDE_ALLOWED_ROOTS，错误体不回显原始绝对路径 |
| shutil.which 缺失（ffmpeg/PIL/httpx） | 503 + data_status=not_integrated |
| 上游不可达 / 返回 4xx | 503 PROVIDER_PROBE_FAILED，不返回模型列表或延迟数字 |
| 内网/回环/链路本地/保留网段 URL | 403 SSRF_BLOCKED |
| 非本机明文 http | 403 URL_NOT_ALLOWED |
| GW_CLI_EXECUTION 未设为 1 | 503 CLI_HELP_NOT_INTEGRATED / JIMENG_*_NOT_INTEGRATED |
| 下载目标在 GW_DATA_DIR 之外 | 403 PATH_OUTSIDE_ALLOWED_ROOTS |
| 素材没有可读本地文件 | 503 MEDIA_NOT_AVAILABLE |

## 4. 本块测试结果

```text
python -m pytest tests -q --no-header -p no:cacheprovider
........................................................................ [ 11%]
........................................................................ [ 23%]
........................................................................ [ 35%]
........................................................................ [ 47%]
........................................................................ [ 58%]
........................................................................ [ 70%]
........................................................................ [ 82%]
...................sssssss.............................................. [ 94%]
...................................                                      [100%]
604 passed, 7 skipped in 78.00s (0:01:18)
```

定向复测（本块 4 个域）：106 passed。

## 5. 运行期剩余 *_NOT_INTEGRATED

对 OpenAPI 全量端点逐一探测，本块结束后剩余 10 条：

| method path | 错误码 | 归属 |
|---|---|---|
| POST /api/canvas-assets/download | CANVAS_ASSET_DOWNLOAD_NOT_INTEGRATED | 画布域（本轮排除） |
| POST /api/canvases/assets | CANVAS_ASSET_ATTACH_NOT_INTEGRATED | 画布域（本轮排除） |
| POST /api/shared-folders/import | SHARED_FOLDER_IMPORT_NOT_INTEGRATED | 画布闭环（本轮排除） |
| POST /api/video-tasks | VIDEO_RENDERER_NOT_INTEGRATED | 画布闭环（本轮排除） |
| POST /api/codex/help | CLI_HELP_NOT_INTEGRATED | AI：依赖门禁，未设 GW_CLI_EXECUTION=1 |
| POST /api/gemini-cli/help | CLI_HELP_NOT_INTEGRATED | 同上 |
| POST /api/jimeng/help | CLI_HELP_NOT_INTEGRATED | 同上 |
| GET /api/jimeng/credit | JIMENG_CREDIT_NOT_INTEGRATED | 同上 |
| POST /api/jimeng/login/start | JIMENG_LOGIN_NOT_INTEGRATED | 同上 |
| POST /api/jimeng/logout | JIMENG_LOGIN_NOT_INTEGRATED | 同上 |

说明：AI/CLI 6 条的「未接入」是配置门禁的默认失败关闭，不是能力缺失：
GW_CLI_EXECUTION=1 且 shutil.which() 命中时确实会真实执行（已用假可执行文件验证 codex/help 200）。
本机实际是否安装/登录这些 CLI、真实公网 Provider 是否可用，本会话未验证。

## 6. 未闭环项与不确定项

1. 多实例一致性：全部落盘为单进程 JSON 快照；多 worker / 多实例并发未闭环，属部署方职责。
2. CLI 真实联通：仅验证了「门禁打开时执行固定 argv」的代码路径；未验证真实 codex/gemini/jimeng 的版本、登录与输出格式。
3. Provider 真实公网：仅用本地 HTTP 服务验证真实往返；未对任何真实公网 Provider 验证。
4. 远端图片：未对真实公网图片站点做端到端抓取验证（仅验证 SSRF 拒绝与本地路径）。
5. 上传与素材注册表未打通：/api/ai/upload 只落盘并返回下载 URL，未自动写入素材注册表（由调用方按需登记）。
6. jimeng/login/status 仍固定返回 logged_in=false：未接入真实登录态的读取，本轮未声称已联通。
7. 分享托管、发布授权、生产验收、第三方独立审计均不在本轮范围。
8. 无独立审核代理（见第 0 节）。

## 7. 需要主代理处理的共享文件改动

- 已由主代理执行（本会话即主代理）：
  - 新增 src/gods_workbench/core/cli_runtime.py（AI 上传 + CLI 门禁执行）。
  - 新增 src/gods_workbench/settings/probes.py（Provider 真实探测）。
  - 新增源码守卫基线：KNOWN_CONTRACT_WITHOUT_FRONTEND_CALLER 增加 1 条（GET /api/providers/probe-async/jobs/{p}）。
  - 契约：MEDIA-INTERFACE-CATALOG.yaml（p12-a4-1）、SETTINGS-INTERFACE-CATALOG.yaml（p12-a4-1，13 -> 14 方法）、
    PLATFORM-INTERFACE-CATALOG.yaml（p12-a4-1）、OBSERVABILITY-INTERFACE-CATALOG.yaml（p12-a4-1）。
- 遗留：src/gods_workbench/core/platform.py 中的 reject_upload/reject_cli_help/reject_jimeng_credit/reject_jimeng_login
  已无调用方（本块禁止改 core/*，未删除）。


## 8. 收口后追加（2026-09-26 晚）

A4 完成后的「前端假未接入清理」与全量收口结论见
`docs/governance/agent-briefs-2026-09-26/PHASE-12-SUMMARY-REPORT.md`：

- 运行时探测复跑：`TOTAL 241 NOT_INTEGRATED 10`，其中 `REAL_NOT_INTEGRATED 0`
  （4 条画布域按用户口径排除，6 条 CLI 属配置门禁 fail-closed）。
- 全量测试复跑：**612 passed, 7 skipped**（本报告 §4 的 604 为当轮快照）。
- 前端 9 项假「未接入」已清理：workshop 遥测接线、顶栏前缀状态位、
  assets 真实空态、production STAGE 汇总、index 渲染总线、projects 立项状态位、
  agents 真实时延；均由真实浏览器 E2E 验证（pageerrors=[]）。
- 剩余「未接入」仅 4 类真实缺口：GPU/显存、渲染/导出、团队消息、Provider 吞吐。
