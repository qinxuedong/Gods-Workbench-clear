# Phase 12｜A1–A4 中期覆盖独立审核（2026-09-27）

## 一、结论与边界

**结论：Required 尚未清零，不可宣布“除画布外全部真实接入”。**已有真实落盘、允许根路径防护、角色门禁、缩略图/波形和分享票据实现值得保留；问题不是所有代码都无效，而是少量明确缺陷与大量尚未验收的成功分支被总体通过数遮住。

- 本次是原 A1–A4 中期独立审核，**不验收正在实施的视频生成/导出**，不以团队负责人 708/7、旧报告或主代理近期吞吐结果作为本人新执行证据。
- 依据本仓 AGENTS、Phase12 DESIGN/PLAN/HANDOFF/ROLLING、A2/A3/A4 报告、当前 contracts/behavior 与当前源码/测试；未访问旧仓源码或历史；未提交、推送、清理或删除工作树文件。
- 使用 code-review 技能的“规范/需求”双轴；本任务明确禁止再派子代理，因此两个轴由本独立审核代理完成。不把缺失外部 Issue 追踪器当作本次本地指定规范审核的阻塞。
- Anytype 只读检索工具本轮未暴露，无法调用；本次不依赖历史个人知识或旧仓记忆。内存索引的 quick pass 没有本洁净仓命中。
- 本次仅新增本报告。复现脚本、数据、PDF/PNG、逐请求矩阵均在 `%TEMP%`，没有真实付费调用或 CLI 登录。

### 本轮新证据

1. 定向已有测试（B2/B3/B4/B5/B6/B7/B8/B9 + P10b/P10c/P10d）：**206 passed，36.79s**。
2. 同一集合加只读请求记录器复跑：**206 passed，36.84s**；记录 **580 次 /api 请求**。按当前 11 个 A1–A4 路由模块展开共 **177 个方法/路径**，其中 **118 个曾收到 2xx，59 个没有 2xx**。这不是 118 条业务验收通过，更不是整个 OpenAPI 覆盖率；177 包括部分既有相邻接口，且不含新视频/团队、P12 聊天测试集合。
3. 最小复现确认：本地素材重复 ID、移动后陈旧索引、不存在项目“恢复成功”、模板字段更新无效/过期 CAS 放行、重启后的提示词串库、注册表 PDF 空白。
4. PDF 用 PyMuPDF 实际渲染并目视检查：842×595 白页，像素全部 255，文本提取为空。并非仅靠 `%PDF-` 签名推断。

日志：`%TEMP%/gw-phase12-coverage-focused.txt`、`gw-phase12-coverage-instrumented.txt`。
请求矩阵：`%TEMP%/gw-phase12-coverage-requests.json`。
复现脚本：`%TEMP%/gw-phase12-coverage-repro.py`（运行用 `python -P`，避免其他任务在临时目录留下的 `re.py` 遮蔽标准库）。
复现产物：`%TEMP%/gw-coverage-review-054q_n1k/{evidence.json,registry.pdf,registry.png}`。

## 二、Required：已经确认的实际缺陷

### R1 🔴 P1｜多个本地文件得到同一个稳定 asset_id

位置：`src/gods_workbench/asset_library/repository.py:368-388`，特别是 **377**。

索引字典以展示路径为 key，却把这些路径传给 `next_sequence("local_", ...)`；普通文件名都不匹配 ID 前缀。分别登记 alpha.png、beta.png，二者均返回 `local_0001`。`update_local_entry`（391 起）按 asset_id 找第一条，因此用户更新第二条可能改到第一条。

**建议**：序号基于记录里的 asset_id 或独立持久化计数器；保留重新索引同一对象的 ID。补两个不同文件上传/索引、重启、按 ID 更新第二条且第一条不变的测试。单文件往返测试不能覆盖此风险。

### R2 🔴 P1｜移动/删除只修改文件系统，不更新本地索引读回

位置：`asset_library/repository.py:317-338,360-365`；`api/routes_local_assets.py:67-88`。

移动函数只执行 `src.replace(dst)`，删除函数只 unlink；GET 索引直接读取旧 records。复现 alpha→gamma 后实际 gamma 存在、alpha 不存在，但 GET 仍返回 alpha。当前 `test_b4_local_asset_write_read_delete_roundtrip` 只检查磁盘目标，不在移动/删除后 GET；违背 DESIGN §4.5 的写后可观察/删除后不返回要求。

**建议**：文件操作与索引更新有明确失败补偿，移动保留 asset_id 并改路径，删除移除索引；覆盖磁盘和 GET、重启后的双重读回。多文件部分失败也需明确语义，不能留下误导列表。

### R3 🔴 P1｜注册表 PDF 内容位于页面外，正常小清单导出白页

位置：`asset_registry/repository.py:952-960`，以及 `api/routes_asset_registry.py:89-98`。

文字从 y=760 开始，但页面高度为595；单项导出的文字全在页外。复现 HTTP200、有效 PDF 头尾，但实际渲染全白。另有 `[:40]` 静默截断，而响应 `X-PDF-Exported` 仍报告所有请求 ID、`X-PDF-Skipped=0`。

**建议**：统一页面坐标/排版，分页或明确限制，不可静默丢弃；用1/41条清单验证可见文字/页数/统计，而非只测签名。中文处理见 R9。

### R4 🔴 P1｜目录模板 PATCH 忽略创建/读回使用的 directory_tree

位置：`api/routes_asset_registry.py:861-882`；`asset_registry/repository.py:518-529`。

创建接受 directory_tree，读回也返回该字段，但 PATCH 原样传给仅识别 folders 的仓库。提交 `directory_tree:["changed"]` 得200、revision增加，读回仍为 `["initial"]`。name/slot_mapping 同样没有实现完整落盘，不能通过“请求成功”证明模板编辑成功。

**建议**：冻结输入字段映射并统一 create/update/read；受支持字段必须持久化，不支持字段显式拒绝。补非默认值写→GET→新实例读回；现有模板测试只测创建/归档和未知模板404。

### R5 🔴 P1｜模板归档/默认操作绕过 CAS，并回显伪 version

位置：`api/routes_asset_registry.py:886-906,911-919`；`asset_registry/repository.py:534-555`。

两类操作完全不校验 expected_version；view.version 则直接取请求 expected_version 或常量1。复现 `expected_version:999` 仍200归档，并返回 `version:999`。这与 catalog `decisions.cas` 的所有写操作冲突，不是“前端只展示”的合理免责。模板对象 version 与全局 revision 混用还使客户端正确读回后无法可靠构造下一次 CAS。

**建议**：先明确模板级或集合级版本，再一致校验并返回服务端真实值。覆盖过期归档/默认409且无状态变化，成功后版本递增；禁止从请求生成版本。

### R6 🔴 P1｜未存在的项目也能恢复成功；缺口提示不能抵消 restored=true

位置：`asset_registry/repository.py:641-648`；`api/routes_asset_registry.py:989-999`。

任意 project_id 仅追加日志，返回 `restored:true,data_status:ok`；payload 的 expected_version 被忽略。本次不存在 ID + expected_version999 得200。附加 `project_store_not_connected` 不能把未发生的恢复变为成功。

**建议**：项目恢复应对接现有项目状态服务并校验 CAS/治理权限、404；若该操作确实被用户批准排除，必须真实失败关闭或只返回 recorded，不可宣称 restored。本次未找到用户批准“项目恢复也排除”的证据；“除画布外”不自动排除项目，目录模块归属不能代替用户范围。画布 restore 的同型返回（repository.py:679-685）属于已排除域，本报告不要求实现它，但同样不能把它计作真实恢复。

### R7 🔴 P1｜提示词父库重启归零导致持久化条目串到新库

位置：`prompt_library/service.py:85-91,124-125`；`prompt_library/items_repository.py:71-83,86-117`。

父库在内存中，序号重启从0开始；条目按字符串 library_id 持久化。旧库 plib_0001 写入条目后，新 service 首个新库又是 plib_0001，查询新库得到旧库条目。复现已确认。比“父库丢失”更严重：历史内容被绑定到语义不同的新库。条目创建也未验证父库/分类存在，现有测试直接使用未创建的 plib_0001。

**建议**：父库/分类/条目的持久化与稳定 ID 生命周期须一致；最小也必须防止 ID 重用和孤儿误绑定，不能仅在报告注明“有意留白”。新增真实进程重启集成测试（不仅 create_app，因为模块级 singleton 不等于重启）、父子完整性与删除非空父项门禁。

### R8 🟡 P2｜已接受的查询参数被静默忽略

位置：`api/routes_asset_registry.py:171-189`；`asset_registry/repository.py:219-238`。

cursor/sort/view/category/tag 被接收但没有传入查询层。复现指定 hero 标签、未知 category、非法 cursor，仍返回两条全量素材并 `data_gaps=[]`。这是实现缺口，而不是缺外部凭据。

**建议**：已冻结支持的过滤/分页语义落实且稳定排序；无冻结语义的参数先澄清或显式 UNSUPPORTED_OPTION，不可假装应用成功。补两标签/分类、跨页游标、不支持参数、排序一致性测试；不要求为纯显示用 view 无依据地增加服务端能力。

### R9 🟡 P2｜中文 PDF 被替换成问号，旧报告“ASCII转义”不准确

位置：`asset_library/repository.py:243`、`asset_registry/repository.py:956`、`asset_review/repository.py:392-397`。

`encode(...,"replace")` 是不可逆替换为 `?`，不是 `\uXXXX` 转义。中文库内容/素材名/审查标题丢失。现有中文文件名响应头处理正确，但不证明正文可读。

**建议**：正文至少实现约定的无损表达；中文排版方案可复用当前三条明确授权字体路径（需要先冻结实现方案，不擅增二进制/依赖）。标准库约束不是丢弃用户内容的授权；若产品明确只接受ASCII，应在入口拒绝且需用户确认。验收应文本内容比较+渲染目视，不只是合法字节。

## 三、旧报告留白的范围判定

| 留白 | 当前冻结材料 | 本次裁定 |
|---|---|---|
| open-local / file-reveal 不唤起程序 | ASSET-REGISTRY catalog decisions.open_local_semantics 明确只做准入，A1实现同类行为 | **不是违反现有窄契约的代码缺陷**；但不等于“已打开”。若完整目标要求唤起，应单独授权固定安全进程动作；本次不要求冒然启动。报告需从业务完成项剔除。 |
| 画布恢复/清理只记日志 | 原范围明确排除画布 | 不扩实现范围；日志与成功恢复仍必须区分。 |
| 项目恢复只记日志 | A2 catalog 自写 canvas_boundary 把项目与画布合并，且 review_status=implementation_pending_independent_review | **无独立/用户批准证据，不能据此缩窄上位目标**；R6 为实锤虚假结果，必须先处理。 |
| 模板 version 假定/字段忽略 | A2报告承认版本未闭环；catalog反而规定写操作CAS | 真实契约缺陷 R4/R5，不需要外部配置。 |
| cursor/sort/tag/category | 报告承认未参与 | 无明确豁免；至少不得静默成功，见R8。 |
| 提示词父库内存、条目落盘 | B8 catalog explicit_limit 有注明 | 承认限制不等于用户接受；父库持久化范围需对齐，但 ID重用导致串库是必须修的稳定身份缺陷R7。 |
| PDF中文ASCII | A3报告称“ASCII转义”并建议新决策；源码实际replace | 文档与实现不符；最低无损内容验收缺失，见R3/R9。 |
| 流水线start/complete只推进状态 | 原B7明确状态机，不自动媒体产物 | 原B7可以按状态机验收；新增视频端到端另行验收，不把B7成功算作视频完成。 |
| CLI登录status固定false | PLATFORM catalog保留PATH观察，代码未读登录态 | **实现仍欠缺状态观测，不是仅“缺登录凭据”**。若完整登录流程属于目标，需修订契约并补受控可执行夹具；不得调用真实登录证明它。 |
| Provider公网、真实CLI版本/登录、远端图片 | 依赖外部运行环境 | 可标外部配置验收受限；但loopback HTTP、假CLI固定argv、真FFmpeg/PNG夹具的本地成功证据仍可补，不能因无商业密钥全部不测。 |

## 四、具体业务语义覆盖矩阵

测试文件缩写：B2–B9分别对应 `tests/contracts/test_phase11_b2_platform.py` 至各域同名文件；O=`test_phase10b_observability.py`，S=`test_phase10d_settings.py`。下表只把断言实际支持的部分计为业务证据；附录逐方法列全量请求触达。

| 域/具体操作 | 真成功路径测试 | 读回/产物证据 | 权限/失败证据 | 必补项/判定 |
|---|---|---|---|---|
| A1 POST local-assets/upload→move→delete | B4 `test_b4_local_asset_write_read_delete_roundtrip` | 验证磁盘字节、移动目标存在、删除目标不存在；首次GET count | B4未配置根/越界/401/readonly403 | R1/R2：两个文件、移动/删除后GET、重启 |
| A1 库/分类/条目创建，条目PATCH/DELETE | B4 `test_b4_library_item_lifecycle_and_cas` | GET嵌套树含重命名项且不再含删除项 | CAS冲突、按接口矩阵401/403 | 库/分类重命名删除、条目move/bulk-delete、avatar/workflow需独立成功夹具 |
| A1 asset-content PATCH/GET、版本restore/delete、export-pdf | B4 `test_b4_content_versions_and_real_pdf` | 内容两次写/旧版本恢复/删除；PDF仅签名 | B4文件操作边界 | 版本单项GET/PATCH/DELETE成功、中文完整正文、PDF渲染 |
| A1 classification prompt/job POST/GET | B4 `test_b4_classification_job_is_real_and_queryable` | 真实提交项与job查询 | 401/403 | stop语义、空/缺失对象；不能把扩展名分类称AI分类 |
| A1 库落盘重启 | B4 `test_b4_state_survives_restart_within_same_data_dir` | 同data_dir新app读 | 隔离tmp | 非所有实体跨进程恢复证明 |
| A1 local folders、caption、storage-files | 本次无2xx成功业务测试 | 无 | 只有路由/鉴权/参数失败触达 | 新建/改名、字幕真实文件、storage列出/删除后GET必补 |
| A2 assets/import→PATCH→archive→DELETE | B3 `test_a2_import_returns_stable_ids_and_reads_back`,`test_a2_asset_update_archive_delete_roundtrip` | 名称/归档/删除后404 | CAS版本与路径准入 | 导入multipart真实文件、多个ID与重启、过滤见R8 |
| A2 tags/relations/reference、image-versions | B3 `test_a2_tags_relations_and_reference_resolve`,`test_a2_image_versions_lifecycle` | 添加/删除/列表字段 | 未登记404、路径403 | 媒体字节GET真实文件成功；更新关联后读回完整性 |
| A2 presets/folders/templates | B3 `test_a2_folders_presets_and_directory_templates` | presets删除404；模板创建数量/归档响应 | 未知template404 | R4/R5；不可把模板创建响应等同更新持久化 |
| A2 projects/entities/gates/linking | B3 `test_a2_project_entities_gates_and_linking` | 关联asset_id与缺素材404 | auth矩阵 | gate成功创建来源及PATCH读回缺；project restore见R6 |
| A2 index/reindex/sync | B3 `test_a2_index_scans_allowed_roots_for_real` | 真根目录2文件、scanned/indexed、缺盘集合 | 未配置503、路径越界 | 文件改动后第二次同步、来源失效/重复扫描稳定ID |
| A2 preferences/features/automation | B3 `test_a2_preferences_features_and_index_automation` | preferences GET；功能/调度参数更新响应 | 无效配置400 | 调度配置持久化不等于定时自动执行，勿称自动任务验收 |
| A2 PDF/ZIP、frame/storyboard/clip | B3 `test_a2_pdf_and_archive_exports_are_real_bytes` | PDF头尾；ZIP只有NO_LOCAL_FILES503 | 依赖缺失503 | R3/R9；ZIP解包成员hash、真视频产物时长/帧数、重启读回 |
| A2 治理/remote/workspace-jobs | B3 `test_a2_governance_boundaries_and_unknown_entity_404` | 记录式治理和未知job失败 | 404/400、canvas data_gaps | 资产恢复/回收恢复读回，真实HEAD loopback，job真实生命周期；画布排除 |
| A3 review session/comment/delivery/approval | B6 `test_session_machine_and_delivery_export`,`test_comment_write_read_and_patch` | 会话状态GET、comments状态、审批/交付ID | 未交付审批409、未知404、readonly403 | PDF正文/重启、权限矩阵；R9 |
| A3 episode pipeline create/start/complete/cancel | B7 `test_create_list_read_and_stage_order`,`test_stage_state_machine_and_cas`,`test_cancel_stage_is_terminal_and_visible` | GET阶段状态、顺序/版本冲突 | 401/403/404/409 | 是状态机证据，不是renderer产物；视频独立验收 |
| A3 prompt items POST/PATCH/DELETE/bulk | B8 `test_create_read_update_delete_roundtrip`,`test_bulk_delete_only_removes_existing_ids` | 条目GET出现/删除消失/版本递增 | 401/403、404/409 | 测试父库未真实创建；R7父子/跨进程一致性 |
| A3 public share GET/access/comment/approval | B9 `test_password_and_max_access_count`,`test_ticket_required_for_comment_and_approval`,`test_permissions_enforced` | ticket后评论/审批内容响应；次数限制 | 错口令401、无票401、禁止403、未知404、次数410 | 评论/审批写后通过私有会话GET再读；过期票据/重启；当前不含公网托管 |
| A4 thumbnails generate/background/job/delete | B5 `test_b5_local_file_read_write_and_thumbnail` | PIL读取128×64产物，后台job succeeded，删除磁盘文件 | 越界403/未配置403 | job里产物经返回URL可下载；delete-storyboards实物测试 |
| A4 waveform/preview/transcode/online-image | B5 `test_b5_waveform_real_rms`,`test_b5_missing_dependency_fails_closed`,`test_b5_online_image_ssrf_blocked` | 真PCM/ffmpeg非零波形；preview有200 | missing ffmpeg503、SSRF403 | transcode真实可解码视频/图片下载成功未证；SSRF拒绝不是下载成功 |
| A4 observability series/health/sources/volumes/events/tasks | O real-root、real-hardware、GPU、audit、pagination系列测试 | 根目录大小/真实采样或明确degraded、任务审计投影 | 无psutil/NVML降级、凭据不泄漏、参数400 | GPU外部真实采样本次不替代九页浏览器绑定证据；历史序列长度持久化范围另核 |
| A4 Provider fetch-models/test/probe/job | S probe失败/SSRF/readonly测试 | **本集合没有探测2xx** | 403/503防护存在 | 受控HTTP模型列表/延迟→真实job→GET成功、错误/取消/重启；旧报告临时成功不充当当前回归 |
| A4 AI upload、CLI help/login/status/credit | B2 `test_ai_upload_persists_real_file`,`test_cli_help_executes_when_gated` | 上传保存字节；假codex固定argv真实进程 | 门禁/缺命令503、readonly403 | 其他CLI协议夹具、退出码/畸形输出/超时、登录后status；禁止运行真实登录 |
| A4 chat/agent与tokens/s | 不属于本次206测试集合；主代理已另有P12 loopback报告 | 本报告不复用为本人新验收 | 新实现另审 | 应整合P12成功/缺usage/归属/权限测试，商业Provider联通仍外部限制 |

## 五、Required：收口前最小验收补齐

1. **先修 R1–R7，再补与缺陷对应的失败→成功回归；R8/R9或落实或得到明确的范围/输入限制批准。**不要仅调整测试白名单让现状通过。
2. 59个“无2xx”不是自动59个缺陷，但其中 A1内容版本/库分类写/本地字幕存储、A2 ZIP和视频媒体/治理/远程素材、A4 Provider探测和转码，均需要合法夹具、成功副作用和随后读回。逐项填写“通过/明确排除/依赖限制”，不能只写 OpenAPI存在或401/503。
3. 外部系统采用无付费受控边界：loopback HTTP真往返、合成1秒视频+真实ffmpeg/ffprobe、临时目录PNG/字幕/ZIP、固定argv假CLI可执行文件。公网真实联通单独标待配置。
4. 建议额外补真实本地账户模式下的跨角色写/治理，避免仅 local 测试头角色通过被误认为生产权限验收；公开分享特殊权限继续单列。
5. 最终所有负责人稳定后再跑全量pytest、黄金夹具/卫生、JS、探针和认证九页浏览器；绑定最终工作树文件hash，而非引用本报告206通过或旧708通过。

## 六、逐操作触达附录（自动记录，不等于业务验收）

下表“2xx测试”仅说明确有该成功HTTP响应；成功是否读回/校验产物必须回到第四节。测试名带失败关闭/empty/truth时尤其不能升级解释为业务闭环。接口均来自本次11个模块实际路由，不由空请求探针猜测。公共分享路由按token占位归一化；不保存令牌、请求体或上游凭据。

### routes_asset_library_b4

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/asset-classification-prompt` | 200,401 | `test_b4_state_survives_restart_within_same_data_dir` |
| `PATCH /api/asset-classification-prompt` | 200,401,403 | `test_b4_state_survives_restart_within_same_data_dir` |
| `POST /api/asset-classification/background` | 200,401,403 | `test_b4_classification_job_is_real_and_queryable` |
| `DELETE /api/asset-classification/background` | 401,403 | **未证明成功** |
| `GET /api/asset-classification/jobs/{job_id}` | 200,401 | `test_b4_classification_job_is_real_and_queryable` |
| `GET /api/asset-content` | 200,401 | `test_b4_content_versions_and_real_pdf` |
| `PATCH /api/asset-content` | 200,401,403 | `test_b4_content_versions_and_real_pdf` |
| `GET /api/asset-content/pdf` | 200,401 | `test_b4_content_versions_and_real_pdf` |
| `GET /api/asset-content/versions` | 200,401 | `test_b4_content_versions_and_real_pdf` |
| `GET /api/asset-content/versions/{version_id}` | 401 | **未证明成功** |
| `PATCH /api/asset-content/versions/{version_id}` | 401,403 | **未证明成功** |
| `DELETE /api/asset-content/versions/{version_id}` | 401,403 | **未证明成功** |
| `POST /api/asset-content/versions/{version_id}/restore` | 200,401,403 | `test_b4_content_versions_and_real_pdf` |
| `GET /api/asset-file-info` | 200,401,403 | `test_b4_file_info_returns_real_metadata` |
| `POST /api/asset-file-reveal` | 401,403 | **未证明成功** |
| `PATCH /api/asset-library/categories/{category_id}` | 401,403 | **未证明成功** |
| `DELETE /api/asset-library/categories/{category_id}` | 401,403 | **未证明成功** |
| `POST /api/asset-library/items/batch` | 201,401,403 | `test_b4_library_item_lifecycle_and_cas` |
| `POST /api/asset-library/items/classify` | 200,401,403 | `test_b4_library_item_lifecycle_and_cas` |
| `POST /api/asset-library/items/delete` | 401,403 | **未证明成功** |
| `POST /api/asset-library/items/move` | 401,403 | **未证明成功** |
| `PATCH /api/asset-library/items/{item_id}` | 200,401,403 | `test_b4_library_item_lifecycle_and_cas` |
| `DELETE /api/asset-library/items/{item_id}` | 200,401,403 | `test_b4_library_item_lifecycle_and_cas` |
| `POST /api/asset-library/items/{item_id}/avatar-status` | 401,403 | **未证明成功** |
| `POST /api/asset-library/items/{item_id}/register-avatar` | 401,403 | **未证明成功** |
| `PATCH /api/asset-library/libraries/{library_id}` | 401,403 | **未证明成功** |
| `DELETE /api/asset-library/libraries/{library_id}` | 401,403 | **未证明成功** |
| `POST /api/asset-library/workflows/upload` | 401,403 | **未证明成功** |

### routes_local_assets

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/local-assets` | 200,401 | `test_b4_local_asset_write_read_delete_roundtrip` |
| `POST /api/local-assets/upload` | 201,401,403 | `test_b4_local_asset_write_read_delete_roundtrip` |
| `POST /api/local-assets/delete` | 200,401,403 | `test_b4_local_asset_write_read_delete_roundtrip` |
| `POST /api/local-assets/move` | 200,401,403 | `test_b4_local_asset_write_read_delete_roundtrip` |
| `PATCH /api/local-assets/items` | 401,403 | **未证明成功** |
| `POST /api/local-assets/folders` | 401,403 | **未证明成功** |
| `PATCH /api/local-assets/folders` | 401,403 | **未证明成功** |
| `POST /api/local-assets/classify` | 401,403 | **未证明成功** |
| `POST /api/local-assets/caption` | 401,403 | **未证明成功** |
| `PATCH /api/local-assets/caption` | 401,403 | **未证明成功** |
| `GET /api/storage-files` | 401 | **未证明成功** |
| `POST /api/storage-files/delete` | 401,403 | **未证明成功** |

### routes_asset_registry

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/asset-registry` | 200,401 | `test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/status` | 200 | `test_a2_cas_conflict_returns_409_with_versions`；`test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/assets` | 200,401 | `test_a2_import_returns_stable_ids_and_reads_back`；`test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/assets/{asset_id}` | 200,404 | `test_a2_asset_update_archive_delete_roundtrip`；`test_a2_state_survives_restart_within_same_data_dir` |
| `GET /api/asset-registry/assets/{asset_id}/image-versions` | 200 | `test_a2_image_versions_lifecycle` |
| `GET /api/asset-registry/assets/{asset_id}/image-versions/{version_id}/media` | 未执行 | **未证明成功** |
| `GET /api/asset-registry/assets/{asset_id}/media` | 503 | **未证明成功** |
| `GET /api/asset-registry/assets/{asset_id}/video/frame` | 未执行 | **未证明成功** |
| `GET /api/asset-registry/assets/{asset_id}/video/storyboard` | 未执行 | **未证明成功** |
| `GET /api/asset-registry/facets` | 200 | `test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/folders` | 200 | `test_a2_folders_presets_and_directory_templates`；`test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/governance/overview` | 未执行 | **未证明成功** |
| `GET /api/asset-registry/governance/cascade-preview` | 未执行 | **未证明成功** |
| `GET /api/asset-registry/preferences/team` | 200 | `test_a2_preferences_features_and_index_automation`；`test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/presets` | 200 | `test_a2_folders_presets_and_directory_templates`；`test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/project-directory-templates` | 200 | `test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/recycle-bin` | 200 | `test_a2_asset_update_archive_delete_roundtrip`；`test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/remote-assets` | 200 | `test_a2_read_only_truth_endpoints_return_real_shapes` |
| `GET /api/asset-registry/workspace-jobs/{job_id}` | 404 | **未证明成功** |
| `POST /api/asset-registry/assets/import` | 200,401,403 | `test_a2_asset_update_archive_delete_roundtrip`；`test_a2_cas_conflict_returns_409_with_versions`（另9项，见JSON） |
| `POST /api/asset-registry/assets/archive` | 503 | **未证明成功** |
| `POST /api/asset-registry/assets/export-pdf` | 200 | `test_a2_pdf_and_archive_exports_are_real_bytes` |
| `POST /api/asset-registry/assets/archive-bundle` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/assets/relations` | 200 | `test_a2_tags_relations_and_reference_resolve` |
| `POST /api/asset-registry/assets/resolve-reference` | 200,404 | `test_a2_tags_relations_and_reference_resolve` |
| `POST /api/asset-registry/assets/tags` | 200 | `test_a2_tags_relations_and_reference_resolve` |
| `PATCH /api/asset-registry/assets/{asset_id}` | 200,409 | `test_a2_asset_update_archive_delete_roundtrip`；`test_a2_cas_conflict_returns_409_with_versions` |
| `DELETE /api/asset-registry/assets/{asset_id}` | 200 | `test_a2_asset_update_archive_delete_roundtrip` |
| `POST /api/asset-registry/assets/{asset_id}/image-versions` | 200,403 | `test_a2_image_versions_lifecycle`；`test_a2_path_admission_fails_closed_and_never_echoes_raw_path` |
| `PATCH /api/asset-registry/assets/{asset_id}/image-versions/{version_id}` | 200 | `test_a2_image_versions_lifecycle` |
| `DELETE /api/asset-registry/assets/{asset_id}/image-versions/{version_id}` | 200 | `test_a2_image_versions_lifecycle` |
| `POST /api/asset-registry/assets/{asset_id}/open-local` | 未执行 | **未证明成功** |
| `DELETE /api/asset-registry/assets/{asset_id}/relations/{related_asset_id}` | 200,404 | `test_a2_tags_relations_and_reference_resolve` |
| `DELETE /api/asset-registry/assets/{asset_id}/tags/{tag_id}` | 200,404 | `test_a2_tags_relations_and_reference_resolve` |
| `POST /api/asset-registry/assets/{asset_id}/video/clip` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/folders` | 200 | `test_a2_folders_presets_and_directory_templates` |
| `POST /api/asset-registry/governance/asset-trash/{entry_id}/restore` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/governance/assets/{asset_id}/restore` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/governance/audit-outbox/reconcile` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/governance/canvases/purge-expired` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/governance/canvases/{canvas_id}/restore` | 200 | `test_a2_governance_boundaries_and_unknown_entity_404` |
| `POST /api/asset-registry/governance/operations` | 200,400,403 | `test_a2_governance_boundaries_and_unknown_entity_404` |
| `POST /api/asset-registry/index/sync` | 200,503 | `test_a2_index_scans_allowed_roots_for_real` |
| `POST /api/asset-registry/reindex` | 200,503 | `test_a2_index_scans_allowed_roots_for_real` |
| `PATCH /api/asset-registry/preferences/team` | 200 | `test_a2_preferences_features_and_index_automation` |
| `PATCH /api/asset-registry/settings/features/{feature_id}` | 200,404 | `test_a2_preferences_features_and_index_automation` |
| `PATCH /api/asset-registry/settings/index-automation` | 200,400 | `test_a2_preferences_features_and_index_automation` |
| `POST /api/asset-registry/presets` | 200 | `test_a2_folders_presets_and_directory_templates` |
| `DELETE /api/asset-registry/presets/{preset_id}` | 200,404 | `test_a2_folders_presets_and_directory_templates` |
| `POST /api/asset-registry/project-directory-templates` | 200 | `test_a2_folders_presets_and_directory_templates` |
| `PATCH /api/asset-registry/project-directory-templates/{template_id}` | 404 | **未证明成功** |
| `POST /api/asset-registry/project-directory-templates/{template_id}/archive` | 200 | `test_a2_folders_presets_and_directory_templates` |
| `POST /api/asset-registry/project-directory-templates/{template_id}/default` | 200 | `test_a2_folders_presets_and_directory_templates` |
| `POST /api/asset-registry/projects/{project_id}/entities` | 200 | `test_a2_project_entities_gates_and_linking` |
| `PATCH /api/asset-registry/project-entities/{entity_id}` | 200 | `test_a2_project_entities_gates_and_linking` |
| `POST /api/asset-registry/projects/{project_id}/assets` | 200,404 | `test_a2_project_entities_gates_and_linking` |
| `PATCH /api/asset-registry/project-gates/{gate_id}` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/project-recycle/{project_id}/restore` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/recycle-bin/{entry_id}/restore` | 200 | `test_a2_asset_update_archive_delete_roundtrip` |
| `POST /api/asset-registry/remote-assets` | 未执行 | **未证明成功** |
| `DELETE /api/asset-registry/remote-assets/{asset_id}` | 未执行 | **未证明成功** |
| `POST /api/asset-registry/workspace-jobs/{job_id}/{action}` | 400,404 | **未证明成功** |

### routes_asset_review_b6

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/asset-reviews/sessions` | 200,401 | `test_session_machine_and_delivery_export`；`test_share_token_hash_only_and_one_time_plaintext`（另1项，见JSON） |
| `POST /api/asset-reviews/sessions` | 201,401,403 | `test_comment_write_read_and_patch`；`test_session_machine_and_delivery_export` |
| `GET /api/asset-reviews/sessions/{session_id}` | 200,401,404 | `test_comment_write_read_and_patch`；`test_session_machine_and_delivery_export` |
| `POST /api/asset-reviews/sessions/{session_id}/delivery` | 201,401,403 | `test_session_machine_and_delivery_export` |
| `POST /api/asset-reviews/deliveries/{delivery_id}/export` | 200,401,403,404 | `test_session_machine_and_delivery_export` |
| `POST /api/asset-reviews/sessions/{session_id}/comments` | 201,401,403 | `test_comment_write_read_and_patch` |
| `PATCH /api/asset-reviews/comments/{comment_id}` | 200,401,403 | `test_comment_write_read_and_patch` |
| `PUT /api/asset-reviews/sessions/{session_id}/approval` | 200,401,403,409 | `test_session_machine_and_delivery_export` |
| `POST /api/asset-reviews/shares` | 201,401,403 | `test_password_and_max_access_count`；`test_permissions_enforced`（另3项，见JSON） |

### routes_episode_pipeline_b7

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/episode-pipelines` | 200,401 | `test_create_list_read_and_stage_order` |
| `POST /api/episode-pipelines` | 201,401,403 | `test_cancel_stage_is_terminal_and_visible`；`test_create_list_read_and_stage_order`（另2项，见JSON） |
| `GET /api/episode-pipelines/{pipeline_id}` | 200,401,404 | `test_cancel_stage_is_terminal_and_visible`；`test_create_list_read_and_stage_order`（另1项，见JSON） |
| `POST /api/episode-pipelines/{pipeline_id}/stages/{stage_id}/start` | 200,401,403,404,409 | `test_stage_state_machine_and_cas` |
| `POST /api/episode-pipelines/{pipeline_id}/stages/{stage_id}/complete` | 200,401,403,409 | `test_stage_state_machine_and_cas` |
| `POST /api/episode-pipelines/{pipeline_id}/stages/{stage_id}/cancel` | 200,401,403,409 | `test_cancel_stage_is_terminal_and_visible` |

### routes_prompt_library_b8

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/prompt-libraries/items` | 200,401 | `test_bulk_delete_only_removes_existing_ids`；`test_create_read_update_delete_roundtrip` |
| `POST /api/prompt-libraries/items` | 201,401,403 | `test_bulk_delete_only_removes_existing_ids`；`test_create_read_update_delete_roundtrip`（另1项，见JSON） |
| `PATCH /api/prompt-libraries/items/{item_id}` | 200,401,403,404,409 | `test_create_read_update_delete_roundtrip` |
| `DELETE /api/prompt-libraries/items/{item_id}` | 200,401,403,404 | `test_create_read_update_delete_roundtrip` |
| `POST /api/prompt-libraries/items/delete` | 200,401,403 | `test_bulk_delete_only_removes_existing_ids` |

### routes_public_b9

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/public/shares/{share_token}` | 200,404 | `test_password_and_max_access_count`；`test_share_token_hash_only_and_one_time_plaintext`（另1项，见JSON） |
| `POST /api/public/shares/{share_token}/access` | 200,401,404,410 | `test_password_and_max_access_count`；`test_permissions_enforced`（另1项，见JSON） |
| `PUT /api/public/shares/{share_token}/approvals` | 200,401,403,404 | `test_ticket_required_for_comment_and_approval` |
| `POST /api/public/shares/{share_token}/comments` | 201,401,403,404 | `test_ticket_required_for_comment_and_approval` |

### routes_media

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/asset-proxy/settings` | 200,401 | `test_b5_settings_write_readback` |
| `PATCH /api/asset-proxy/settings` | 200,401,403 | `test_b5_settings_write_readback` |
| `GET /api/asset-thumbnails/settings` | 200,401 | `test_b5_settings_write_readback` |
| `PATCH /api/asset-thumbnails/settings` | 200,401,403 | `test_b5_settings_write_readback` |
| `POST /api/asset-thumbnails/generate` | 200,401,403 | `test_b5_local_file_read_write_and_thumbnail` |
| `POST /api/asset-thumbnails/generate-background` | 202,401,403 | `test_b5_local_file_read_write_and_thumbnail` |
| `GET /api/asset-thumbnails/jobs/{job_id}` | 200,401 | `test_b5_local_file_read_write_and_thumbnail` |
| `POST /api/asset-thumbnails/delete` | 200,401,403 | `test_b5_local_file_read_write_and_thumbnail` |
| `POST /api/asset-thumbnails/delete-storyboards` | 401,403 | **未证明成功** |
| `GET /api/media-preview` | 200,401 | `test_b5_missing_dependency_fails_closed` |
| `GET /api/media-transcode` | 401,503 | **未证明成功** |
| `GET /api/audio-waveform-data` | 200,401 | `test_b5_waveform_real_rms` |
| `GET /api/download-output` | 200,401 | `test_ai_upload_persists_real_file` |
| `POST /api/online-image` | 401,403 | **未证明成功** |

### routes_observability

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/observability` | 200,401,403 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_every_endpoint_accepts_full_recognized_query_set`（另2项，见JSON） |
| `GET /api/observability/overview` | 200,401 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_every_endpoint_accepts_full_recognized_query_set`（另3项，见JSON） |
| `GET /api/observability/series` | 200,401 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_every_endpoint_accepts_full_recognized_query_set`（另3项，见JSON） |
| `GET /api/observability/events` | 200,400,401 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_configurable_fields_match_contract`（另15项，见JSON） |
| `GET /api/observability/tasks` | 200,401 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_empty_list_endpoints_report_no_more_pages`（另9项，见JSON） |
| `GET /api/observability/health` | 200,401 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_every_endpoint_accepts_full_recognized_query_set`（另6项，见JSON） |
| `GET /api/observability/sources` | 200,401 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_empty_list_endpoints_report_no_more_pages`（另4项，见JSON） |
| `GET /api/observability/asset-volumes` | 200,401 | `test_all_eight_endpoints_return_200_with_expected_shape`；`test_asset_volumes_scans_real_root`（另5项，见JSON） |

### routes_settings

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `GET /api/storage-settings` | 200,401 | `test_get_storage_settings_unconfigured`；`test_readonly_role_can_read_storage_settings` |
| `PATCH /api/storage-settings` | 200,403,409 | `test_patch_storage_settings_success_and_cas_conflict` |
| `GET /api/providers` | 200,401 | `test_get_providers_empty_by_default` |
| `PUT /api/providers` | 200,400,403,409 | `test_put_providers_cas_conflict`；`test_put_providers_strips_credentials_and_accepts_frontend_id` |
| `POST /api/providers/fetch-models` | 503 | **未证明成功** |
| `POST /api/providers/probe-async` | 503 | **未证明成功** |
| `GET /api/providers/probe-async/jobs/{job_id}` | 未执行 | **未证明成功** |
| `POST /api/providers/test-connection` | 403,503 | **未证明成功** |
| `GET /api/asset-registry/asset-structures` | 200 | `test_list_asset_structures_empty` |
| `POST /api/asset-registry/asset-structures` | 201,400,403,409 | `test_create_structure_collection_cas_conflict`；`test_create_structure_stable_id_and_no_member_metadata`（另4项，见JSON） |
| `GET /api/asset-registry/asset-structures/{structure_id}` | 404 | **未证明成功** |
| `PATCH /api/asset-registry/asset-structures/{structure_id}` | 403,409 | **未证明成功** |
| `PATCH /api/asset-registry/asset-structures/{structure_id}/current` | 200 | `test_set_current_success` |
| `DELETE /api/asset-registry/asset-structures/{structure_id}` | 200,403,409 | `test_delete_structure_success_and_cas_conflict` |

### routes_ai

| 操作 | 观测状态码 | 2xx测试（至多列2条） |
|---|---|---|
| `POST /api/ai/upload` | 200,403 | `test_ai_upload_persists_real_file` |
| `GET /api/app-info` | 200,401 | `test_app_info_is_truthful_and_authenticated` |
| `GET /api/chat/config` | 200,401 | `test_chat_configuration_is_read_only_and_authenticated` |
| `POST /api/chat` | 401,403,503 | **未证明成功** |
| `POST /api/chat/agent` | 503 | **未证明成功** |
| `GET /api/codex/status` | 200 | `test_cli_status_observes_path_without_execution` |
| `POST /api/codex/help` | 200,503 | `test_cli_help_executes_when_gated` |
| `GET /api/gemini-cli/status` | 200 | `test_cli_status_observes_path_without_execution` |
| `POST /api/gemini-cli/help` | 503 | **未证明成功** |
| `GET /api/jimeng/credit` | 503 | **未证明成功** |
| `POST /api/jimeng/help` | 503 | **未证明成功** |
| `POST /api/jimeng/login/start` | 401,403,503 | **未证明成功** |
| `GET /api/jimeng/login/status` | 200 | `test_jimeng_login_status_never_fakes_qr_or_login` |
| `POST /api/jimeng/logout` | 503 | **未证明成功** |
| `GET /api/jimeng/status` | 200,401 | `test_cli_status_observes_path_without_execution` |

## 七、快照定位

- 当前 HEAD：`c71c6980a120f548b93abb65fd86b7b0ace03daa`。
- 文件SHA-256清单：`%TEMP%/gw-phase12-coverage-source-manifest.json`。该清单记录复核收尾的有关文件，不声称并行工作树在整个测试期间不变；最终验收必须稳定后重跑。
- 本报告不作公开发布、生产就绪或付费上游联通结论。
- 本审核跨本地日期完成：2026-09-27 至 2026-09-28；按交接任务约定保留 2026-09-27 文件名。
