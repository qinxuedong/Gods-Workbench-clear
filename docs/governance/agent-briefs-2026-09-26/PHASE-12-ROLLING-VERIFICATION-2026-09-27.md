# Phase 12｜滚动实施与验证记录

- 日期：2026-09-27。
- 代码基线：`c71c6980a120f548b93abb65fd86b7b0ace03daa` **加当前未提交工作树**；本记录不代表该提交本身已通过。
- 状态：继续实施与核验，**未宣告 Phase 12 完成**；不改变发布授权或其他阶段状态。
- 主交接：`PHASE-12-HANDOFF-2026-09-27.md`；复核交接补充范围与探针风险。
- 工作树保护：保留所有既有修改/未跟踪文件；不 reset、clean、stash、提交、推送或删除。

## 一、执行计划与负责人

用户已要求按交接继续实施。本轮优先修正交接明确要求的验证工具与证据；不借此扩充未经冻结的产品能力。

1. 范围核查：架构代理原调用遇到 429 终止，主代理接管只读核查。
2. 安全探针：测试自动化负责人（GPT-6-luna / max），负责 `tools/_probe_p12.py` 与针对性测试；隔离数据、真实夹具、读回、分类和唯一结果文件。
3. 集成验证：主代理负责全量 pytest、契约/黄金夹具/污染检查、API 引用守卫、JS 语法和九页真实浏览器回归。
4. 独立审核：GPT-6-Astra / high，只读核实当前工作树、变异测试和证据，单独出具报告；收到结果前不声称通过。
5. 修正与再审：按 Required 问题修复后重跑并再次独立核实。

代理尽量串行，同时运行子代理不超过 2 个。不为“所有可用代理人”创建无关角色，也不把未成功执行的代理调用算作成果。

## 二、范围证据与不得掩盖的缺口

| 能力 | 当前冻结材料与实现边界 | 本轮处置 |
|---|---|---|
| 视频渲染/导出 | `CANVAS-CLOSURE-INTERFACE-CATALOG.yaml` 明定 POST `/api/video-tasks` 返回 503 `VIDEO_RENDERER_NOT_INTEGRATED`；`EPISODE-PIPELINE-INTERFACE-CATALOG.yaml` 明定仅推进阶段状态，不触发渲染或模型、不产出媒体 | 保留真实缺口，不能因路由在画布模块就宣称非画布能力全部接入；扩展 renderer 需用户确认范围并审核新契约 |
| 团队消息 | 现有团队/成员管理不等于消息历史、收发与存储；没有已冻结消息端点契约 | 不以文案替代实现；产品范围待确认 |
| Provider 吞吐 | 当前探测测量连通性、模型与延迟，不提供 tokens/s 契约 | 不拿时延/字节数伪造吞吐；需确认范围和可核验计量契约 |
| 外部模型与 CLI | 无配置失败关闭不等于真实上游验收 | 默认不调用外网付费模型，不登录/登出真实 CLI；受控桩仅证明调用路径 |
| 公开发布/第三方审计 | 历史 HANDOFF-11 工程 9/10 未授权；仓库仍 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION | 不擅自变更许可证、发布或声称第三方审计通过 |

这里不是重新缩小用户目标：上述缺口保留为**未完成/待裁定**，不能用于得出“全部完成”。先继续所有无需新增产品裁决的实施与验证。

## 三、当前新增证据

- 全量基线：`python -m pytest -v` → **639 passed, 7 skipped in 90.99s**。
- 输出目录：`C:\Users\QINXUE~1\AppData\Local\Temp\gw-phase12-20260927-203133`，含 `baseline-pytest.txt`、既有修改清单与差异快照；未跟踪文件仍保留原位。
- 浏览器验证：已在独立临时数据根和账户数据库启动，真实 CLI 执行关闭；结果待回收。
- Anytype：当前会话无可调用的 `search_knowledge`，资源/资源模板列表为空；未访问其他空间。未据历史旧仓记忆推断当前洁净室实现。

## 四、历史报告勘误

`PHASE-12-SUMMARY-REPORT.md` 的“后端缺口为零”和历史探针统计不作为当前完成证据。旧探针操作枚举数不等于业务流程通过；历史 CLI 启用轮存在副作用和共享输出轮次不明问题，不重放旧危险命令。旧报告与审核保留作为历史记录，新结果逐项在本记录和独立审核中追加。

### 专项验证回收

- `python -m pytest tests/contracts/test_phase8_frontend_backend_api_gap.py tests/contracts/test_phase9_frontend_degradation.py tests/contracts/test_phase12_v2_runtime_degradation.py tests/hygiene -v`：**114 passed in 13.56s**；输出 `focused-gates.txt`。
- `python -m pytest tests/contracts/test_golden_fixtures.py -v`：**34 passed in 0.14s**。
- 10 个交接列出的 JavaScript 文件 `node --check` 全部退出码 0；明细 `js-syntax.txt`。
- API 引用检查使用现有 Phase 8 六条契约/路径守卫替代缺失的 `audit_api_refs.py`；它检验静态路径/已列契约方法，不证明端点业务成功，也不是全部契约全集覆盖。
- 主代理发现现有 `frontend_e2e_smoke.py` 每个浏览器上下文没有登录；仅该脚本通过不能证明受保护能力成功。已新增浏览器测试负责人（GPT-6-luna max），与探针负责人独立分文件并行，合计两个子代理。
- 已向用户请求视频渲染/导出、团队消息、Provider tokens/s 三项新增实现的范围确认；等待期间继续所有验证链实施，不将它们排除后冒称全部完成。

### 未认证浏览器基线（不能替代认证验收）

`python -P tools/frontend_e2e_smoke.py --serve --mutation-selftest --artifacts-dir <证据目录>/browser` 退出码 0；原始 `browser/e2e-report.json` 记录：9 页、7 项交互、9 页路由一致性、8 项往返导航、27 项顶栏组合、0 未登记失败；变异自测产生 27 条预期失败。

本轮使用 `GW_AUTH_MODE=local` 且各浏览器 context 未携带认证信息，业务接口返回 401。因此该结果只支持未认证页面的渲染/降级和导航稳定性，**不支持业务真实接入**。已目视检查 `v2-agents.png`：GPU/CPU/RAM 暂不可用，与未认证状态一致，不能挪用历史真实 GPU 截图作为本轮证据。

## 五、范围授权更新

用户已明确要求视频渲染/导出、团队消息、Provider tokens/s 三项全部纳入。本记录先前“待裁定”是授权前历史状态，**现在三项都是必须完成的任务**。方案见 `PHASE-12-THREE-CAPABILITIES-DESIGN-2026-09-27.md`。方案须经技术审核并细化冻结契约再实现；不能以当前合同旧有限制永久排除新增授权。

## 六、安全探针首轮交付与主代理复跑

- 测试自动化负责人完成 `tools/_probe_p12.py`、`tests/contracts/test_phase12_probe.py`；全量自验 **658 passed / 7 skipped（89.65s）**，专项 **12 passed（3.48s）**。该全量数字对应执行当时共享工作树，不冒称已包含后续功能。
- 主代理独立复跑：`python tools/_probe_p12.py --output-dir <证据目录>`，退出码 0，报告 `phase12-probe-edf3e6070bc54b3d95f4c899dd62f6bf.json`。
- 当前纯 OpenAPI 枚举独立核实为 **242 项**；与旧交接 241、最初设计 239 分开记载，不以旧数字覆盖当前事实。
- 触达 9 项/12 次尝试；1 条持久化业务流，2 个操作验证持久化读回；3 项仅路由读回；**233 项未执行**（包括明确画布排除、安全不执行以及未评估），205 项未评估。命令成功仅证明其声明覆盖的流程与守卫运行成功，不代表所有业务完成。
- 安全记录：真实 CLI 子进程 0，3 次 help 为受控桩；外网/付费请求 0；登录登出不执行；环境及猴补丁已恢复；输出唯一命名且响应脱敏。
- 视频渲染/导出、团队消息、Provider tokens/s 在报告中保留为 **IN_SCOPE_USER_AUTHORIZED_UNIMPLEMENTED / CODE_MISSING**，不再“待裁定”，也没有借画布白名单消除视频缺口。
- 实施前设计独立审核已派发 GPT-6-Astra high；另一浏览器负责人仍在交付，当前子代理并发保持 2。

## 七、方案审核与新增功能实施启动

- GPT-6-Astra high 已出 `PHASE-12-THREE-CAPABILITIES-DESIGN-REVIEW.md`：**需修订**，方向认可，R1–R5先冻结再实施；这是方案审核，非最终通过。
- 关键 Required：治理创建者不能冒认被创建成员；团队/成员/消息/撤权同一事务持久化；坏库失败关闭；移除现有首页/agents加载时自动计费ping；真实usage与端到端时间；视频结果未知不重复收费、取消竞争、产物鉴权。
- 团队消息负责人 GPT-6-luna max 正在按R1/R2/R5冻结契约与实施；吞吐负责人 GPT-6-luna max 正在按R3/R5冻结契约与实施。两块文件独占，最多2子代理，不读取旧仓。
- 外部协议证据已成功补齐，见 `docs/contracts/PHASE12-PROVIDER-PROTOCOL-EVIDENCE-2026-09-27.md`；视频拟采用NewAPI unified-video，非已关闭的OpenAI官方Videos。尚未调用真实付费Provider。

## 八、认证浏览器揭示并修复项目详情405

认证浏览器负责人交付新增 `tools/phase12_authenticated_browser.py`、`tests/smoke/test_phase12_browser_gate.py`，并为既有E2E五类检查增加可选context工厂（默认行为保留）。全量自验662通过/7跳过；认证轮 `browser/auth-run-3/phase12-authenticated-browser.json` **FAIL**：assets页13次GET `/api/asset-registry/projects/prj-0001` 返回405。账号setup201、login200、logout204且结束活动会话数0均已证实。

主代理按已有冻结PLATFORM详情契约修正：
- `asset-manager/api.js::getRegistryProject` 改用 GET `/api/projects/{project_id}`；PATCH注册表写路径保持不变。
- `episode-pipeline.js` 单项目读取也直接使用该冻结GET，保留失败显式降级，不再先请求必然405的写路径。
- 新增可执行Node请求包装器测试 `test_project_detail_frontend_runtime.py`；两条专项通过，Phase8/9其余80条同时通过；JS语法通过。
- 修改后主代理全量 `python -m pytest -v`：**664 passed / 7 skipped，90.64s**，日志 `project-detail-fix-pytest.txt`。
- 新认证浏览器轮正在运行，输出 `browser/auth-project-detail-fix`；完成前不声称浏览器门禁通过。后续团队/吞吐/视频改动完成后还必须统一重跑。

### 项目详情修复后的认证轮回收与GPU隔离修正

- `browser/auth-project-detail-fix/phase12-authenticated-browser.json`：**PASS**。9/9页认证与受保护业务API均200；7交互、9路由、8往返、27顶栏、27预期变异失败；pageerror为0；setup201/login200/logout204，结束活动会话0。
- 本轮GPU展示与接口的“不可用”降级一致，但主代理进一步对照本机发现：隔离环境漏掉 `PROGRAMFILES`/`PROGRAMW6432` 时 nvidia-smi 实际退出255（NVML初始化错误）；任一变量补回则退出0。这是测试隔离制造的硬件缺失，不能描述成本机没有GPU。
- 已在工具白名单补回两个非秘密系统目录环境变量，并增强环境隔离测试；真实隔离环境已读到 RTX 5090。另将GPU UI比较绑定同一真实HTTP采样，避免拿稍后变化读数误判旧采样；必须在捕获的真实health响应中找到UI缓存样本，不伪造数据。
- 新真实GPU认证轮：`browser/auth-real-gpu`，当前执行句柄41645；结果尚未回收。
- GPU工具修改后的全量碰到团队权限模块开发中状态：**9 failed / 655 passed / 7 skipped（92.79s）**；9项均为B1认证管理旧测试，已交团队负责人修复。日志 `gpu-isolation-fix-pytest.txt`。因此此前664通过是新增功能实施前快照，**不能作为当前集成已通过**。

### 真实GPU认证轮已回收

`browser/auth-real-gpu/phase12-authenticated-browser.json` 返回 **PASS**：9/9页GPU均为真实读数，每页 `rendered_gpu_sample_observed_from_http=true` 且UI与同一HTTP采样一致；认证和受保护业务200，setup201/login200/logout204，结束会话0。已目视检查项目页截图，GPU区显示真实RTX 5090及31.8GiB上限，不再被测试隔离误降级。该轮仍是三项新增能力完成前的验证链证据，不替代团队消息、吞吐或视频端到端验收。

## 九、后续收口不可遗漏

1. 团队消息、吞吐交付后先解决集成回归，再完成视频远端生成和本地导出，不把后者缩成“路径已存在”。
2. 安全探针当前只验证1条持久化业务流，这是验证工具的第一批，非“除画布全量接入”的证明。最终必须把A1–A4已有契约测试与新三项任务组成可追溯覆盖矩阵；尚无有效业务夹具/读回证据的域继续补测，未覆盖仍显式列出。
3. Phase8路由/引用基线由主代理单点同步；各域契约增补必须有精确方法、状态、权限/失败断言，不能简单扩充可接受错误白名单。
4. 稳定工作树后再跑最终全量pytest、黄金夹具、卫生、JS、安全探针和认证九页浏览器；绑定文件hash/当前HEAD+脏工作树快照。开发中测试与先前快照不可冒充最终当前证据。
5. 最后GPT-6-Astra high独立复核实现、故障/权限/变异和最终证据。Required未清零或任一授权功能未完成，目标保持进行中，不发布、不提交推送。

## 十、续接集成：真实模型选择与吞吐协议验证

- 团队负责人当前交付全量703通过/7跳过，但自查发现历史分页被增量响应覆盖、BFCache恢复busy/sending未清理；已交回原负责人修复，未验收完成。
- 主代理修复首页预设模型冒名路由：模型列表来自只读 `/api/chat/config`；多Provider无默认时要求明确选择；POST携带真实 `provider_id/model`，显式费用确认、防重复、40秒取消等待且不自动重试；配置失效清空选择。增加可执行Node测试验证选择、取消确认、并发去重、失效配置。
- 首页修改后全量 `python -m pytest -v`：704通过/7跳过，94.75秒；日志 `%TEMP%/gw-phase12-home-provider-pytest.txt`。这是视频实施前快照，不是最终完成证据。首页+V2运行时专项20通过。
- 安全探针新增真实loopback HTTP Chat Completions协议流程：分别触发 `/api/chat` 和 `/api/chat/agent`，验证12输出token / 实测耗时公式、服务商归属、缺usage为空；不使用真实凭据、不访问商业Provider。13项探针专项通过。报告 `C:/Users/QINXUE~1/AppData/Local/Temp/gw-p12-integration/phase12-probe-5b5e2a3cf7654f54a5c0ed38a12b485f.json` 枚举247、触达11、未执行236；仍不是全业务覆盖。
- 修正OpenAPI无指标schema不等于实现缺失的误判；本地HTTP协议证据独立分级，不计入持久化业务通过数。指标数值可留存，但凭据字段仍脱敏。
- 视频负责人GPT-6-luna max已启动，负责远端生成与真实本地FFmpeg导出；和团队修复最多同时2子代理。最终独立审核仍未进行。

## 十一、团队真实浏览器与 A1–A4 中期独立审核

### 团队消息补齐
- 原负责人修复历史游标被增量覆盖、BFCache锁释放及消息去重，3项Node回归通过。
- 主代理九页认证门禁 `C:/Users/qinxuedong/AppData/Local/Temp/gw-p12-integration/browser-team/phase12-authenticated-browser.json` **PASS**：九页、7交互；新增75条历史→增量后继续分页无重复→UI真实发送第76条→刷新读回→HTML样例仍为纯文本；pageerror为0，logout204且活动会话0。
- 目视发现发送区权限提示未结束加载，进而核实只读UI未按服务端写权限禁用。已契约先行增加GET messages `can_send`（同一SQLite读事务计算，不作为写入凭证）；前端切队即禁用、读取完成后反映真实权限，POST仍实时重新鉴权。另修复URL直接进入团队时缺少独立取消域、在途发送切队后sending锁未复位。
- 团队专项17通过（含只读UI禁止POST、发送切队再返回复用幂等键）。再次真实浏览器 `C:/Users/qinxuedong/AppData/Local/Temp/gw-p12-team-current-k8v4vqm9/team-current.json` **accepted=true**，相同75条分页/发送/刷新/XSS均通过、logout204且活动会话0；已目视截图“可发送纯文本团队消息”不再停在加载。
- 吞吐极大整数usage除法溢出回归已补：输出null/rate_invalid而非500。首页/吞吐/浏览器工具专项40通过。最后稳定于视频路由拆分前的全量为710通过/7跳过；不能用此替代后续工作树门禁。

### A1–A4 独立审核（GPT-6-Astra high）
- 新报告 `PHASE-12-COVERAGE-REVIEW-2026-09-27.md`；206专项通过不能证明完整验收。177个方法路径中118曾有2xx、59无成功证据，并提供逐操作→测试映射，明确不把2xx数量当业务完成数。
- Required R1–R9：本地素材重复ID；移动删除索引陈旧；PDF白页/截断；目录模板字段更新无效；模板CAS伪版本；项目假恢复；提示词父库重启串库；查询参数静默忽略；PDF中文丢失。
- R1/R2/R7已分派GPT-6-luna max持久化负责人，与视频负责人并发，共2位，不再派其他子代理。R3/R6/R8/R9仍待修复；审核未清零，目标未完成。

### 主代理模板 R4/R5 修复
- 注册表契约升级p12-a2-2：模板记录级version；PATCH/归档/默认要求expected_version，缺失或非法400、过期409；受影响默认记录递增真实版本，历史无version记录按1迁移。
- 创建/PATCH/GET一致落盘name/project_type/directory_tree/slot_mapping，兼容folders别名，拒绝矛盾/未知字段与无效路径映射；GET不再回填请求伪版本。
- 前端默认操作改传当前模板expected_version，非无效expected_revision；Node实际执行验证请求版本来自选中模板，后端写→新app读回、CAS无副作用等专项24通过。
- 最新完成的开发中全量 `%TEMP%/gw-phase12-team-permission-pytest.txt`：10失败/703通过/7跳过，因视频旧路由已拆而新路由未挂（8项连带）与新项目访问变更导致OIDC/本地账号创建409（2项），已交视频负责人核查。模板修复后新全量正在运行 `%TEMP%/gw-phase12-template-cas-pytest.txt`；开发中不宣称总体通过。
- 7项长期跳过为真实外部OIDC/IdP现场用例，非本地账户浏览器；最终仍需明确环境配置边界。

### 模板轮全量已回收，继续工作起点

- `%TEMP%/gw-phase12-template-cas-pytest.txt`：**8 failed / 707 passed / 7 skipped，93.15秒**。3项真实账户/OIDC创建返回`PROJECT_ACCESS_EXISTS`（新项目与ACL生命周期不一致，交视频负责人修根因）；另外5项为Phase8四门禁和探针集成（待视频接口稳定后由主代理同步）。不能引用710通过作为此刻工作树状态。
- 当前两位活动实施负责人：`/root/video_engineer`（视频完整链与项目访问）、`/root/persistence_remediation`（审核R1/R2/R7）；`/root/coverage_reviewer`已交付并停止。下轮先查询代理真实状态，不重复派发在途任务。
- 主代理下一块：R3/R9真实PDF文字/中文/分页、R8过滤分页参数；待视频项目服务稳定后对接R6项目回收恢复。随后补报告所列59个无2xx项中的合法业务夹具与读回，不能将统计自动解释为缺陷或通过。
- 本轮主代理执行句柄44162/47456/40422/85821/54814/64953/76498/26150均已回收；没有遗留主代理浏览器服务，会话已撤销。子代理进程状态需续接时再查。


## 十二、续接修复 R6/R8（仍待独立复核）

- 继承两名在途负责人，不重复创建；视频与持久化负责人仍在工作，保持最多两个子代理。
- R8：落实recent_days按UTC零点窗口过滤并绑定查询游标；注册表无root/collection关联模型，非空root_id/collection_id明确400 UNSUPPORTED_OPTION，不静默忽略。其他既有sort/tag/category/cursor已覆盖。
- 前端统一错误解析保留detail.message/code/status；分页遇409 VERSION_CONFLICT丢弃旧游标和预取、重载第一页，不拼接新旧快照。新增Node实际执行测试验证一次重读且未append。
- R6：project-recycle恢复调用已有项目中心restore_from_trash状态机；正整数expected_version必填，治理鉴权、未知404、版本/生命周期冲突409；成功GET删除/归档状态清空且版本递增。不再只写日志返回restored:true。
- 注册表及前端专项28通过；新增R6后注册表专项25通过。最近全量为6 failed/721 passed/7 skipped，日志%TEMP%/gw-phase12-query-final-pytest.txt；该轮在两个实施负责人仍修改期间，仅用于发现回归，不作为最终门禁。
- 全量遗留：4个Phase8视频基线/接口门禁、项目列表测试跨用例ID、提示词生成器静态守卫；已通知对应负责人。未把任何失败改成成功或跳过。
- PDF官方规格已实际下载读取Adobe官方PDF32000_2008.pdf（仓库外%TEMP%/gw-pdf-iso32000-reference.pdf），确认Table118 UniGB-UTF16-H（PDF第281页）、ToUnicode（300-301页）及EmbeddedFiles（89/111-112页）条目。web工具返回空输出，不声称其提供有效引用。实现仍待设计复核。


### 合法成功分支补齐（续）

- 新增tests/contracts/test_phase12_success_paths.py：loopback真实Provider模型发现、实测连接时延、探测任务GET与新app读回；远程素材HEAD元数据登记/GET/删除；本地素材字节下载及ZIP逐成员SHA256；回收恢复；正文历史版本GET/PATCH/DELETE；本地说明/分类、目录改名、存储文件删除后不再列出。
- 真FFmpeg合成2秒160×120视频，抽帧PIL检查尺寸和红色像素、分镜文件、1秒剪辑、转码下载后ffprobe检查H264与时长。该成功流程复现media-transcode生成成功但HTTP404：返回的output仅basename而下载路由按数据根拼接。已定点改为相对数据根的完整输出路径，复测通过。
- 远程素材URL原本使用127.0.0.1字符串前缀放行且自动跟随重定向；补齐检查为解析主机/DNS、URL内凭据拒绝、禁止重定向、不使用环境代理。回环伪装/内网/凭据拒绝及302不追随有新回归。不把这些测试称为完整网络安全审计。
- 目前新成功分支8项均已各自执行通过（先7项再FFmpeg1项）；最终需整体重跑。全量%TEMP%/gw-phase12-r6-media-pytest.txt仍在执行，尚未回收终态。
- 视频负责人已交付ACL生命周期专项9通过，但视频路由尚未挂载、前端与端到端未收尾，故其ACL交付不代表视频能力已完成。下一轮须继续视频完整交付。


## 十三、PDF实施与进一步独立复核

- Astra对PDF方案给出有条件通过（D1–D4），报告PHASE-12-PDF-REPAIR-DESIGN-REVIEW.md；主代理新增core/text_pdf.py共享标准库生成器，替换注册表/正文/交付三面，完整分页、中文字形、ToUnicode、原始UTF8附件与明确资源上限。
- 注册表导出同一状态快照去重、未知404，导出计数与实际内容一致。正文响应文件名补RFC5987。权限沿用既有行为：注册表和正文是认证读取，readonly可导出；交付POST仍readonly403，未为满足测试擅改权限。
- tests/contracts/test_phase12_pdf.py 14项通过；联合B3/B4/B6共60通过。PDF回归使用PyMuPDF实际解析、逐页渲染、文字bbox与精确源文附件比较，非只测签名。
- 三HTTP面的实际PDF与原生Chrome/PyMuPDF首尾页截图保留在C:/Users/qinxuedong/AppData/Local/Temp/gw-phase12-pdf-verified-urc5lr62。注册表3页含第100项，正文3页含长行和转义Emoji/罕见字，交付2页含末项。Chrome 154.0.8037.57原生PDF扩展画面6张首尾图已由主代理目视，中文与末项可读。非嵌入字体Chrome/PyMuPDF外观不同是既定边界，不称任意阅读器一致。
- tools/phase12_pdf_verification.py可重复生成证据；其自动报告保持rendered_pending_visual_review，避免脚本自动替代目视审核。最终仍待Astra独立PDF实现验收。
- 中间几次Chrome回环HTTP取PDF收到204且本机HTTP服务未收到请求，原因未确定；改用实际HTTP导出文件的file URI在Chrome原生PDF阅读器打开，不是HTML重新绘制。不得把异常204宣称PDF本身坏了。
- 另一次全量5 failed/731 passed/7 skipped，日志%TEMP%/gw-phase12-r6-media-pytest.txt；其中4 Phase8在等视频挂载；本地账户浏览器测试服务提前退出，旧临时日志已被pytest后续保留策略清理，原因未核实。单独复跑该浏览器测试1 passed/7.26s，最终全量仍需重跑，不掩盖间歇失败。
- 独立复核报告PHASE-12-COVERAGE-REMEDIATION-REVIEW.md确认R4/R5/R6/R8通过；发现N1多根同名索引覆盖、N2父子操作单进程并发孤儿，已重新分配持久化负责人修复，未把R1/R2/R7提前全部关闭。


### 本轮测试终态及后续队列
- PDF实现后全量：4 failed / 748 passed / 7 skipped / 8 warnings，102.69秒，%TEMP%/gw-phase12-pdf-full-pytest.txt。4失败仍是视频迁移中的Phase8；8警告为视频重复operation_id，已通知视频负责人去重挂载。此轮不是稳定工作树最终验收。
- public分享成功分支补齐时进一步发现：公共写入无法重新读取、期限未执行、限流副本未持久化、公共媒体指向受登录保护的地址。已写PHASE-12-SHARE-CLOSURE-DESIGN.md待独立审核，尚未修改分享生产逻辑；不得把现有路由200当成端到端分享通过。
- 下一步顺序：接收N1/N2修复→空闲槽请Astra复核PDF实现并审分享方案→继续分享修复/覆盖；并接收完整视频实现后同步Phase8/安全探针。CLI退出码/状态观测和其余覆盖矩阵仍需逐项完成或依冻结契约明确依赖边界。
- 保持最多两名子代理（视频负责人、持久化修复负责人），无提交、推送、公开发布或阶段完成变更。


## 十四、CLI边界与媒体读回续接
- 提示词在途缩进问题已由原负责人修复并恢复可导入；N1/N2尚在实施，不提前验收。
- CLI非零退出与超时不能被包装为成功。显式受控错误元数据原被ErrorDetail丢弃，新增可选returncode/result_unknown后7项HTTP边界测试通过（均用Python受控子进程或超时替身，未运行真实账号命令）。
- 仅运行本机官方dreamina.exe `-h`、`login -h`、`user_credit -h`，三者退出0。确认余额命令user_credit以及OAuth Device Flow普通login等待完成。冻结PHASE-12-CLI-CLOSURE-DESIGN.md待Astra审核；当前登录running/status及旧credit命令尚未修复，不能称CLI闭环。
- CLI错误包修复后的全量：5 failed / 762 passed / 7 skipped，106.80秒，%TEMP%/gw-phase12-cli-boundary-full-pytest.txt。5失败均为在途视频相关Phase8门禁；无重复operation_id警告不代表视频已挂载，当前仍待负责人完整交付。
- 新合法图片版本字节、ZIP别名、治理概览/级联/归档恢复/回收恢复验证通过；远端图片真实HTTP获取后下载复现404，根因与转码相同：输出回显仅basename。缩略图/远端图片统一改为相对数据根完整路径，远端抓取禁环境代理/URL凭据、拒绝3xx并流式执行16MiB上限。联合成功路径及B5共18 passed，不是全量最终证据。
- 进一步静态发现分镜删除读media_output/storyboards，而真实分镜生成复用media_output/{asset_id}/frame_*，需要补明确缓存命名/归属后真实删除回归；不得用空目录removed=0冒充已删除。该项尚未修改，列入后续审核/实施队列。

## 十五、视频真实浏览器与本地审计收据（续接）

- 独立审核 OUTPUT/N1/缓存/本地账户启动通过，具体见 PHASE-12-OUTPUT-CACHE-N1-LIFECYCLE-INDEPENDENT-REVIEW.md；A项目门暂不通过直接实施，B/C条件通过。
- 主代理新增 test_video_tasks_browser.py，以Chrome+真实本地账户HTTP+回环Provider+FFmpeg验证真实页面生成→播放器metadata→字节下载→合并720p/30fps→下载ffprobe→刷新读回，上游POST仅1次。专项1通过，约8.5秒；不是商业Provider验收。
- 浏览器实测暴露并修复两个前端问题：空stage上下文遮蔽pipeline稳定关联；导出成功渲染引用未定义的exportDownloadUrl。Node语法检查通过。
- 仍发现普通UI创建分集不提供canvas/entity，因此新增 PHASE-12-VIDEO-CONTEXT-DESIGN.md 待审。当前浏览器通过范围只覆盖已有合法production_context的流水线，不能据此关闭所有视频Required。
- C1–C3本地审计sink已实施：真实删除/回收恢复/取消归档同事务产生不可变事件与摘要；内部独立收据写后读回ACK；失败保留failed；ACK后源提交失败可幂等重投；overview最多50条、reconcile最多100条。契约 AUDIT-OUTBOX-LOCAL-SINK-CONTRACT.md；B3+新专项31通过。待Astra独立实现审核。
- 新前置方案 PHASE-12-PROJECT-PERSISTENCE-DESIGN.md 待审；未直接实施项目门或冒称内存项目可恢复。
- 分享负责人仍在实施；CLI完整闭环已交Luna max负责人。本轮最多两活动子代理。
- 全量日志 %TEMP%/gw-phase12-video-outbox-full-pytest.txt 运行中；结果待回收，非最终稳定快照。


## 十六、分享真实访客闭环与前端接线修正

- 分享负责人完成真实资产/session关联、到期与持久有界限流、票据竞争、受保护媒体及Blob生命周期。其交付时尚未执行真实浏览器。
- 主代理随后用Chrome发现并修复：缺少/share/{token}页面路由；创建链接读data.secret而服务端返回token；审批读回但前端不展示。新增匿名壳(no-store/no-referrer/nosniff)、一次性token显式校验、转义审批列表及ISO/epoch时间兼容。
- tests/smoke/test_share_browser.py：真实密码验证→Blob图片naturalWidth→提交评论与审批→下载字节核对→刷新重新验证后评论审批仍存在；无私有账户cookie、XSS文本不执行、无pageerror。与分享专项合计9通过；Node语法检查通过。
- 分享浏览器截图/证据已复制到仓库外 `%TEMP%/gw-share-browser-verified-469ca98b739c4bb2bbdd0b13f382a572`。主代理已目视检查。
- 视频浏览器证据另存 `%TEMP%/gw-video-browser-verified-be579267cd2242ddab3e4cca203863b8`，已目视检查。
- Phase8只追加精确分享媒体路径，6项通过；不放宽扫描差集/错误码。
- C审计前端原先误读res.outbox导致计数总为0，现采用实际count/remaining并重新GET概览；busy防重、partial明确失败。生产事件函数Node回归通过，C专项现7项通过。
- 第二次全量817 passed/8 skipped/3 failed：2项Phase8已修；1项probe读取CLI在途半套接口发生context缺参，已通知CLI负责人。最新全量 `%TEMP%/gw-phase12-share-browser-full-pytest.txt` 运行中，须回收，不代表最终稳定快照。

## 十七、独立审核残余与已分派修复

- PHASE-12-PROJECT-VIDEO-CONTEXT-DESIGN-REVIEW.md：项目真源和视频选择器方案均条件通过。项目P1–P5已进一步冻结到PROJECT-PERSISTENCE-GATES-CONTRACT.md：选择确定性namespace+独立持久单调预留，不采用UUID；owner+治理门权限、精确CAS/迁移/幂等与共享项目兼容边界已明确。项目持久化与门仍未实施。
- PHASE-12-VIDEO-OUTBOX-INDEPENDENT-REVIEW.md：视频2项P1（在途创建取消风险标记、拒绝覆盖却删除既有文件），已交Luna max video_remediation修复，同时实施V1–V4选择器及普通UI路径真实浏览器。不能以现有成功路径覆盖这两项失败。
- Outbox P2（前100项失败饿死健康后项）主代理已改为持久轮转游标，cursor与源状态同事务提交；101条真实HTTP事件的失败注入回归通过，专项现8通过。待独立复核。
- 分享浏览器全量已回收：817 passed/8 skipped/5 failed，全部失败来自CLI在途权限/协议测试；已通知CLI负责人。Phase8及分享/视频浏览器通过，但非最终稳定快照。
- 主代理本轮各测试进程句柄已回收。当前活动子代理：cli_engineer、video_remediation，最多两名。下一空槽优先安排项目持久化/门或B索引任务；完成前Astra继续独立审核C公平性、分享、CLI、视频及新增registry链路。

### 最新回收全量
`%TEMP%/gw-phase12-outbox-fairness-full-pytest.txt`：**840 passed /8 skipped /2 warnings，131.01秒**。分享/视频成功路径Chrome均通过；黄金夹具与卫生通过。CLI与视频修复仍在共享目录继续实施，因此此结果不是最终不可变快照，不覆盖审核发现尚未复核的P1/P2或未实施项目门/索引任务。主代理暂无在途测试进程。


## 十八、后台索引真实执行链与视频上下文收敛

- 主代理根据B1–B3审核，新增 `docs/contracts/REGISTRY-INDEX-JOBS-CONTRACT.md` 和 `asset_registry/index_jobs.py`。后台reindex/sync返回202+稳定job_id/poll_hint；独立持久任务、主体隔离、全动作CAS、有界任务/扫描/重试、暂停检查点、取消提交串行边界、持久提交收据、重启interrupted及显式retry。
- 提交采用当前registry锁内增量合并，只加稳定根+相对路径新项，不拿旧快照覆盖标签/手工资产。任务进度不增加registry revision；同步旧接口保持不变。任务store损坏失败关闭，不复用ID。权限检查覆盖当前本地账户角色/有效会话、OIDC服务端会话、根配置指纹；不宣称远端IdP即时撤销已验收。
- 任务中心通过真实status发现，统一job_id，全动作expected_version，增加暂停/启动索引按钮及实际结果；素材来源索引请求切后台。Node语法通过。
- `tests/contracts/test_phase12_index_jobs.py` 14通过：真实HTTP源、摘要/主体隔离/幂等、暂停恢复/取消重试、根变更、并发素材合并、容量/执行器异常、账户降权、提交赢取消、真实子进程退出恢复、两根同名、损坏快照、提交收据恢复。文件摘要回归发现Windows DirEntry缓存inode/dev为0，已改真实Path.lstat再与fd身份比较。
- `tests/smoke/test_index_jobs_browser.py` 1通过：默认local_account登录、实际页面点击后台索引、暂停/恢复、真实扫描文件→索引1条→刷新读回。证据 `%TEMP%/gw-index-browser-verified-b5dba22d4238484f84cd3fb1adc6d706`，主代理已目视；观测事件未配置的降级横幅与真实索引成功分别展示，未用日志伪造任务。
- 中间全量 `%TEMP%/gw-phase12-index-initial-full.txt`：852 passed /8 skipped /3 warnings，135.50秒；之后仍有新增修改，不是最终稳定快照。
- 视频负责人已修在途创建风险标志、迟到task_id保留、拒绝覆盖不删除旧MP4、V1–V4选择器；其末次浏览器曾因项目持久化接线中途状态失败。主代理修浏览器异常清理key未赋值，并显式用持久ProjectsService替代黄金内存夹具。普通分集未注入production_context，手选真实画布/实体→生成→播放器→下载字节→FFmpeg H264/720p/30fps导出→刷新偏好读回现通过。
- 主代理补Provider已返回task_id、轮询在途时取消：迟到completed响应后重新检查状态，不再下载/发布；`tests/contracts/test_video_tasks.py`14通过。
- 执行生产JS函数回归发现跨账号旧未知提交可能以同key在另一主体域产生新请求；新增submission.actor_id，提交前刷新身份，旧未知身份不匹配/缺失时失败关闭，保留原payload和key，绝不自动换键重提。`tests/contracts/test_video_context_js.py`覆盖主体偏好隔离、迟到拓扑不覆盖新选择、同主体原payload/key、换主体不发POST，与真实视频浏览器合计2通过。
- 当前活动：project_persistence_engineer（Luna max，项目门/持久化）；closure_review（Astra high，独立审核B/CLI/分享/C公平性）。video_remediation已释放活动槽。B及视频补充修复尚未独立通过，目标仍active，未提交/推送/发布。

## 十九、项目阶段门交付与九页、吞吐浏览器实证（2026-09-28）

- 项目负责人交付了持久项目真源、阶段门接口/状态/CAS、创建幂等与前端真实门回读；Phase8精确接口基线已同步。负责人专项14+13通过、真实Chrome立项1通过；独立实现审核仍待Astra完成，不据此关闭项目门。
- 九页认证浏览器终态PASS：`%TEMP%/gw-phase12-auth-browser-8tsdje43/phase12-authenticated-browser.json`。9页、7交互、9壳路由、8重复导航、27顶栏组合、27变异自证；pageerror全空。真实HTTP创建测试项目并GET列表精确读回，不再依赖生产黄金seed。团队消息75条历史、增量后加载历史、UI发送、刷新读回与纯文本渲染通过；已目视截图。
- 主代理新增 `tests/smoke/test_provider_metrics_browser.py`：真实Chrome→生产/chat/agent→回环HTTP Chat Completions。加载不POST、取消确认不POST、主动发送后usage/单调耗时计算、Provider/model归属提示、切换清除旧读数、无usage为null并显示不可用、刷新不重发，1通过。证据 `%TEMP%/gw-provider-browser-20260928-0328/test_provider_metrics_browser_0/`，已目视；不是商业Provider现场验收。
- 最新非稳定全量 `%TEMP%/gw-phase12-project-share-full.txt`：874 passed /8 skipped /1 failed，159.70秒。唯一失败为项目契约增补后的Phase2输入SHA登记未同步。核对差异为已审设计的创建幂等与门接口后，仅更新该契约登记至 `2bc11363021150fb16822b75eab1fcf0a3d84ee17efcb5b95f482fd0dc7b71ac`，不改卫生断言；黄金/卫生46通过。仍须统一全量重跑。
- 索引I-P1已补普通GET/列表/幂等/动作前核对提交收据，连续成功状态写失败后不可再取消/重试；15专项+1Chrome通过。分享S-P2已补页面epoch/Abort覆盖access/comment/approval及迟到分支，85相关Python+4媒体Node通过；受控pagehide不是实际BFCache命中。均交Astra复核。
- 覆盖矩阵首次869 passed/8 skipped/3 failed、256操作/246触达/225有2xx，快照不稳定；旧三失败已定向修复。2xx只作触达，不自动业务验收；新增coverage_completion负责人补合法成功分支，排除项按契约保留。
- 当前仅两名活动子代理：closure_review（Astra high独审）、coverage_completion（Luna max补HTTP成功证据）。未提交/推送/发布，目标active。

## 二十、独立复核结果与第二轮定向修复

- Astra以原独立复现脚本复跑，关闭索引I-P1、分享S-P2、视频旧两P1；成功视频误显示取消的V-P2-5亦关闭。
- 新增Required四项，尚不最终完成：P-P1-1只读owner仍能改项目门；P-P1-2项目真源缺失时视频恢复/授权未失败关闭；V-P2-3身份查询被focus新代次抢占后提交仍用旧主体；V-P2-4未知请求重试遇本次拒绝误清原幂等键。
- 后端两P1交Luna max `project_gate_remediation`；主代理修前端两P2。身份刷新显式返回主体/代次，失败或过期结果不能提交；上下文异步验证之后再次核对；已有未知请求的400/401/403/404/422拒绝不能抹掉历史key/payload。生产函数Node覆盖生成/导出双动作、并发身份刷新、身份查询失败和五类拒绝，专项通过。真实视频Chrome在该修复后仍通过。
- 最新视频实物截图及JSON保留在 `%TEMP%/gw-video-identity-remediation-20260928/test_video_generate_preview_ex0/`；前一次 `%TEMP%/gw-video-final-browser-20260928-0333/` 已目视确认成功任务无取消误报。
- 安全探针 `%TEMP%/phase12-probe-7561dbccb16c46949824e6f1210cb492.json`：255个/api操作（矩阵另计/healthz为256）、11触达、244未执行；不得视为全覆盖。媒体Node4通过。
- 当前活动仅coverage_completion与project_gate_remediation；Astra等待释放槽后复核，不突破两个活动子代理限制。
- 追加全量回收：`%TEMP%/gw-phase12-identity-full.txt` **876 passed /8 skipped /2 warnings，164.62秒**。该运行包含前端身份修复与tokens/s Chrome，但后端两P1和成功路径补测仍在途，不能作为最终稳定验收。

## 二十一、全量矩阵与claim兼容收口

- 统一矩阵 `%TEMP%/phase12-coverage-ba9accc6eb5049ffb648a20f6c7d8c6b.json`：892 passed /8 skipped /2 failed，168.17秒；256操作、253触达、247有2xx、2204次请求。源码/测试快照一致，但独审报告在启动窗口写入，整体stable_snapshot=false，不能叫不可变最终工作树。
- 两失败分别为Phase10E历史非owner断言（由403精确改为隐藏真源存在性的404 VIDEO_PROJECT_NOT_FOUND，单项通过），以及成功分支历史claim夹具与真源owner不一致。未放宽后端守卫。
- Astra第三轮关闭视频V-P2-3/V-P2-4和项目P-P1-1/P-P1-2；团队消息独立Chrome75→76条、全新Python进程读回、readonly读取200/发送及重放403；tokens/s独立Chrome+回环HTTP亦通过。
- 仍有claim兼容Required：治理claim返回200后，显式授权主体不能通过新真源owner严格守卫。不能只修夹具掩盖接口语义。本轮选择保留冻结owner或显式grant，而非收窄契约冒称完成。
- Astra已条件批准最小方案：ACL增加可空source_owner_key，来源只从项目持久真源内部读取；访问同时核对受权actor与来源owner；旧NULL只允许真源owner本人，禁止读取自动补齐；治理claim允许无ACL插入、同actor同来源幂等、同actor旧NULL补来源，不得覆盖别的actor或刷新非NULL错配。迁移保留数据、SQLite事务内串行检查，项目owner不变、interrupted不自动复活。交project_gate_remediation实施。
- 剩余无2xx中OIDC callback为合法302；四项canvas/shared-folder冻结fail-closed；三项画布接口未执行不计通过；视频authorize待claim修复后重跑。最终须重跑完整矩阵和独审，不以247项2xx冒称256项业务全部通过。

## 二十二、最终Required清零与稳定快照

- claim显式授权来源绑定、schema v3迁移/回滚经Astra独立真实HTTP和全新Python进程验证通过。新增任务读/取消过严导致源故障无法止损的V-P2-6也已定向修复：原actor状态与风险可读、可写角色可取消；他人404、readonly403、产物仍严格守卫。原真实local_account独立复现改为修复断言后通过，Required清零。
- 最终完整矩阵：`%TEMP%/phase12-coverage-cd412584f1044987b9e18c92e5c4b33e.json`及同名txt，**904 passed /8 skipped /3 warnings，172.21秒，exit0**。
- 全部Git可见文件开始/结束hash一致：`6cc92191bc33cccb2a69c0b2cb49ad9346b00d611e525704b1991690681c1d9f`，stable_snapshot=true。
- 256操作、253有请求、248有2xx、2265次实际请求。其余8为OIDC合法302、4个冻结fail-closed、3个未执行画布排除；不计通过、不自动推断业务全部状态验收。
- 三新增均完成本轮限定范围验收。20个变动JS语法、媒体Node4通过；黄金与卫生通过。8skip边界不变。
- 本轮最终结论汇总至 `PHASE-12-FINAL-ACCEPTANCE.md`；旧总报告顶部已指向最终报告，历史审计不删除。未提交、推送、发布，商业Provider/真实CLI/OIDC与公开发布不在此次通过结论内。
