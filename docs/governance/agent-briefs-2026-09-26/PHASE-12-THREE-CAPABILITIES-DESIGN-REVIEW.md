# Phase 12 三项新增能力｜实施前独立设计审核

- 日期：2026-09-27。
- 审核对象：`PHASE-12-THREE-CAPABILITIES-DESIGN-2026-09-27.md` 及 REVIEW-BRIEF、当前洁净室 AGENTS、冻结契约、当前自有实现。
- **结论：需修订；方向与用户授权一致，以下 Required 写入增补冻结契约后可进入实施，无需再次询问是否实施三项。** 这不是否定范围，也不是最终验收通过。
- 本次仅静态方案核实，没有运行付费 Provider、媒体生成、全量测试或浏览器验收。未访问旧仓；工作树现有 106 项改动未回退；唯一写入本报告。Anytype 当前工具未提供 search_knowledge，未借此访问其他空间。记忆检索未找到本洁净室相关条目，未采用旧项目实现知识。

## 总评

方案正确保留了远端 prompt/provider/model 视频生成、真实本地导出、消息持久化与真实吞吐四个关键边界；明确不以桩或失败关闭代替能力完成，值得保留。当前仍是原则清单，尚缺可以据此编码的身份映射、原子权限状态、收费触发及作业恢复定义。以下是最小补齐项，不要求重做整个平台。

## Required（实施前冻结，实施中逐项验证）

### R1 🔴 团队身份不能直接复用当前宽松的主体查找

证据：`core/auth_management.py:207-213` 的 `_subject_user` 同时用 `external_subject` 和 `owner_subject` 匹配；`create_user` 将创建者写入新用户的 owner_subject（约 300-305 行）。一个创建者可能匹配其创建的其他成员，不能据此为消息认定作者或成员资格。`_visible_team`（239-243 行）允许治理角色/团队创建者绕过成员列表，也不能不加说明地当作消息发送规则。

最小修订：
- 消息作者仅由经过认证的主体经**唯一身份绑定**得到稳定 `user_id`；创建者/管理权不等于被创建者本人。明确绑定认证模式及身份域，禁止由消息 payload 指定作者或角色。
- local_account 的认证主体已是账户 `user_id`（`core/auth.py:74`），必须与治理成员引用显式对齐；OIDC 映射由可信认证上下文建立，不能信任客户端提交 external_subject。开发 local 的 token 摘要身份不是生产持久账户。
- 固定读写矩阵：建议团队 owner/治理角色可读；成员可读；发送至少同时满足全局写权限与团队写角色，readonly/reviewer 不得借全局角色绕过团队限制。若治理者允许非成员发消息，明确为治理权限而非伪造成普通成员。
- 每次历史查询、增量查询和发送均重新检查当前权限；移除成员后不能因重放成功幂等键继续读消息。复活权限不得靠重启、重新登录自动补旧成员关系。

### R2 🔴 消息和权限需要同一原子边界；不能只给现有字典加启动保存

证据：`AuthManagementStore.__init__/reset`（168-181 行）清空用户、团队、成员与 bootstrap 标记；`core/storage.py:120-130` 把缺文件和损坏/读取失败都变为默认值。直接套此默认策略可能丢失撤权状态并重新开放 bootstrap。local-account 增补契约当前明确不覆盖团队持久化，需要显式增补而非默默改变。

最小修订：
- 持久化治理用户身份引用、团队、成员、版本、bootstrap 完成标记与消息/幂等记录。不迁移临时 Bearer 原文，不要求把审批和 token 生命周期一并重构。
- 可用一个新 SQLite 存储，或一个具严格读取与原子更新的独立 JSON 命名空间；成员变更和消息权限校验/追加共享事务或同一锁，权限检查到写入之间不得释放锁。无需引入分布式基础设施。
- 缺文件允许初始化；已有存储损坏/不可读必须 503，不能当空库重新 bootstrap；写盘失败不得返回成功或留下可见内存成功状态。
- 初始化与测试 reset 分离；生产启动不得调用破坏性 reset。旧内存没有可恢复历史，不能宣称迁移回收了上次进程数据；若保留当前进程数据迁移，须显式一次性、版本化且不覆盖已有持久状态。
- 账户数据库和治理存储之间只存身份引用，每次认证仍以账户/IdP为权威，不把旧角色快照当有效会话；明确单实例部署限制。

### R3 🔴 页面当前已经在加载时调用付费对话，必须同步消除

证据：`static/v2/js/agents-controller.js:176-185` 的 probeAgentProvider 发送 `POST /api/chat/agent` + ping，233 行初始化直接调用。新增一个收费提示按钮而保留这条自动请求，仍不满足方案。`settings/chat.py` 当前返回 reply/raw，但未计量；当前 provider 字段也不能证明已选择对应 Provider。

最小冻结：
- 优先在现有真实 chat 成功响应增量添加 `metrics`，避免新增一套测量服务。字段至少 `kind=end_to_end_output_tokens_per_second`、`output_tokens`、`elapsed_seconds`、`tokens_per_second`、`usage_source`、`unavailable_reason`，以及服务端核实的 provider/model 归属。
- 单调时钟在请求发出前开始、完整响应体收到后结束；usage 仅使用该适配器契约定义的真实输出 token 字段。必须是有限非负整数且拒绝 bool；耗时必须有限且 >0。有效 0 token 可返回 0；usage 缺失/非法为 null + 原因；失败不得留下本次成功读数。
- 不声称解码速度，除非另有首/末 token 时间。前端显示“端到端输出 tokens/s”，不能与浏览器 latency 混用。
- 移除初始化中的生成型 ping；配置状态只做无生成请求的读取。用户点击发送/测量时提示可能计费、防重复提交，并有输出 token 上限、请求超时与并发上限；超时后不自动重试付费请求。
- 归属来自实际解析的服务端配置，不把任意传入 provider 标签贴在环境默认 Provider 上；切换 Provider/模型或失败时清除陈旧读数。凭据不进入 metrics、raw、错误、持久记录或日志；新增路径不要延续任意透传上游 raw 的做法。

### R4 🔴 视频必须冻结远端生成与本地导出两个类型及结果未知语义

证据：`episode-pipeline.js:2315-2316` 实际发送 prompt/provider_id/model/duration/aspect_ratio/production_context 并消费 result.videos 或 items；`routes_canvas_closure.py:225-268` 仍是空列表/503/404；旧 CANVAS-CLOSURE 契约尚禁止返回 job_id。方案不能据此只接 FFmpeg。

最小冻结：
- 保留 `POST /api/video-tasks`（生成）并返回 202 + 权威 `job_id` + `poll_hint`；GET 列表/详情/取消沿同一作业系统。可新增 `POST /api/video-exports`（导出）作为同一 job 模型的入口，不另建并行 canvas 引擎。
- 生成参数保留现有字段并严格验证；不支持的时长/比例返回显式错误，不能静默把当前硬编码 duration=5 送给不支持它的上游。production_context 的 project_id/canvas_id/entity_id 必须验证存在、关联及权限，不只检查全局 editor。
- 导出输入优先是已授权 asset_id 列表及有限 preset，不接受任意命令/FFmpeg参数/URL协议/输出路径。允许目录不等于有资源所有权，仍需校验主体权限。输出到仓库外数据目录；不得任意覆盖用户已有文件。
- 统一 queued/running/succeeded/failed/canceled/interrupted；accepted 可仅作HTTP接受语义。终态不可覆盖；每次转换、幂等键占用和产物登记原子化。幂等键作用域为主体+操作+键，同键异参409。
- 先落盘再调度；远端创建超时意味着结果未知，不可自动再次提交或重新收费。保存上游 job 引用（不能替代本地 job_id），重启后可安全查询既有上游作业，无法确认则 interrupted；本地执行中任务重启按 interrupted 处理。凭据只在执行时从服务端引用解析，不能持久化原文。
- 取消首先终止本地交付意图并阻止迟到结果发布；若 Provider 不支持远端取消，明确返回远端可能仍执行/计费，不谎称已取消云端。FFmpeg 超时/取消须停止子进程并清理自身临时文件。
- 远端创建/轮询/下载使用冻结的适配器协议、地址准入、重定向校验与大小/时间上限。下载不可把 Provider Bearer 转发到任意产物域；对 FFmpeg 只提供已验证本地媒体，避免由媒体清单触发隐式网络读取。
- 成功必须真实下载/登记产物、ffprobe验明媒体后才发布；产物用受鉴权的本地内容路由，不能以公开静态目录暴露。前端保留预览/下载并新增导出/取消，离页停轮询，回来能恢复服务端 job_id；不能依赖原始签名URL永久有效。

### R5 🔴 必须更新相冲突的冻结契约与门禁，不能删掉降级用例冒充通过

- 新增 `TEAM-MESSAGES-INTERFACE-CATALOG.yaml` 与 `VIDEO-TASKS-INTERFACE-CATALOG.yaml`；增补 AUTH、LOCAL-ACCOUNT-AUTH、PLATFORM/SETTINGS、CANVAS-CLOSURE 对应能力。列明新契约取代旧版视频仅503的适用条件。
- EPISODE-PIPELINE 当前显式“阶段转换不触发真实模型/渲染”可继续保持：视频提交由独立视频按钮发起；若改变阶段自动触发，必须一并修订契约，不能顺手偷偷接线。
- 全部标准错误仍为 detail.code/message。消息最小端点：GET/POST `/api/asset-auth/teams/{team_id}/messages`；POST 输入 text/client_request_id，输出 message_id/team_id/author_user_id/created_at/sequence；GET limit/cursor/after_sequence 的排他/边界/排序需固定，不能仅用秒级时间做游标。幂等首次/重放状态码冻结，同键异文409；限制长度、拒绝空白、前端文本渲染。
- 精确更新 `test_phase10e_canvas_closure.py`、`test_golden_fixtures.py` 相关夹具和 `test_phase8_frontend_backend_api_gap.py` 路由基线。保留无配置503、匿名401、只读403、未知任务404，不泛化接受任意4xx/5xx。

## 最小文件所有权及实施顺序

1. **集成负责人先冻结契约/夹具**：仅 docs/contracts、关联 fixtures 与接口基线；把以上决策写成确定值而非待选项。
2. **实施代理（GPT-6-luna max）串行团队块**：core/auth_management.py + 新持久化/消息模块、routes_auth_management.py、collab-controller.js/collab.html、专属测试。core/auth.py/local_accounts.py 若需改身份绑定只由同一代理持有；勿另起代理修改认证共享文件。
3. **同一实施代理串行吞吐块**：settings/chat.py、routes_ai.py、agents-controller.js/agents.html、专属测试。Provider解析若需 settings/service.py，提前独占该文件，不能与视频块并行争写。
4. **同一实施代理串行视频块**：新增 video_tasks 包，routes_canvas_closure.py 的视频路由替换或独占新路由注册、episode-pipeline.js、专属媒体/任务测试。共享 api/app.py、core/storage.py 由集成负责人单点修改。
5. 可以让第二代理仅做独立审核/浏览器验证，但不要与正在写同一前端文件的实施块同时验收；总子代理并发≤2。最终 GPT-6-Astra high 对集成后的精确工作树审核，不能复用本报告当最终放行。

## 必须取得的证据与最低验收集合

- **协议证据未齐**：当前设计只提供官方视频文档候选地址，没有可读取正文。至少取得一个拟支持 Provider 的官方/用户提供协议（创建参数、鉴权、状态、轮询、产物下载、取消/幂等能力），记录版本或取证日期后冻结；不要求通吃所有 Provider。usage 字段同样只按选定 chat 协议支持，不猜测。
- 消息：多主体/多团队、作者伪造、创建者不冒名、并发发送/撤权、幂等/游标、移除后重启不能恢复权限、坏盘失败关闭、真实浏览器发送后刷新可见。
- 吞吐：确定性受控时钟与上游usage公式、缺失/负数/bool/NaN/无穷/零耗时、Provider切换、上游失败，以及页面加载绝不POST生成；浏览器真实点击显示归属和计费说明。
- 视频：受控HTTP上游验证创建→轮询→下载（明确不是商业Provider验收）；真实FFmpeg/ffprobe临时媒体验证输出；重启/超时结果未知/取消竞争/幂等、跨用户产物、路径越界、重定向与凭据泄漏测试；前端完整提交/恢复/预览/下载/导出。
- 集成后 `pytest -v`、黄金夹具和卫生门禁100%通过，JS守卫及真实认证浏览器。缺真实商业凭据只能说明“真实上游现场验收待配置”，不能以成功桩宣称真实服务已验收。

## Optional（不应阻塞本轮）

- 消息 WebSocket/已读回执/附件/搜索/编辑撤回；先轮询纯文本即可。
- 多实例任务队列与分布式锁；当前单实例有界工作器即可。
- 流式解码 tokens/s、长期指标历史、多个视频 Provider、复杂剪辑时间线；先完成一个有协议证据的端到端适配器与真实导出。

**下一步：实施负责人按R1–R5冻结最小增补契约，再依次实施与验证。三项未完成，Phase 12 未因此完成，公开分发状态不变。**
