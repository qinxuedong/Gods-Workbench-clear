# Phase 12｜后台索引、CLI、分享与 Outbox 公平性独立审核

> 最新判定见文末最终收口：claim兼容及V-P2-6已关闭，本报告Required=0；本轮已授权代码与本机隔离验收完成。非商业Provider/真实CLI/OIDC生产验收，非发布授权。前文Required仅为审核历史。

审核日期：2026-09-28（本地时区）。对象为本轮共享工作树实际文件，不使用作者口头测试结论、旧仓源码或旧仓历史。仅新增本报告；临时脚本、日志、截图、真实测试文件均位于仓库外 TEMP。

## 结论

| 范围 | 结论 | Required 收口 |
|---|---|---|
| B 后台索引 | **Required，暂不收口** | B1 与通常 B3 路径通过；B2 仍有已提交任务被取消的故障窗口，见 I-P1 |
| CLI 登录闭环 | **PASS（限定受控协议夹具）** | C1–C3 本轮范围通过；不代表真实 Dreamina 账户或真实授权输出验收 |
| 分享闭环 | **Required，暂不收口** | S1、S2 及匿名普通路径通过；S3 页面级请求生命周期未闭合，见 S-P2 |
| Outbox 公平性 | **PASS** | 原 C-P2-1 关闭；101 个真实 HTTP 来源事件、前100持续失败、独立新进程仍投递第101个 |

设计上的独立任务存储、注册表安全增量合并、受管 CLI 代次隔离、分享的持久限流和显式 MIME 准入、Outbox 持久轮转方向正确。下面两项均有独立复现，不是泛泛改进建议。

## Standards

本轮受审范围未发现新增的洁净室输入、二进制白名单、技术栈或中文新增注释硬违规。未引入插件运行时；索引任务使用稳定 job_id、动作携带 expected_version；公开分享及 CLI 权限没有被本轮修复降为前端判断。

黄金夹具与卫生用例独立运行通过，见证据节。这不代表完成版权独立审计，不改变 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。共享工作树仍有其他代理修改项目持久化及视频代码；那些未完成范围不在本报告的 Standards/Spec 放行之内。

## Spec

### 🔴 I-P1｜成功状态写失败后，已提交索引仍可被 cancel 改成 cancelled

位置：`src/gods_workbench/asset_registry/index_jobs.py:232-252`；故障处理相关 `:286-307`，收据恢复相关 `:110-123`。

**违反：**原 B2 与 `REGISTRY-INDEX-JOBS-CONTRACT.md` 的“已提交不得改成 cancelled”“提交与收据同事务、按收据恢复成功”。

**独立复现：**合法 HTTP 提交后台任务，扫描真实文件。仅故障注入 `_save` 对 succeeded 的两次写入均抛 OSError；注册表资产与 `job_index_00000001:1` 收据已经存在。执行线程结束后、不重启服务，GET 仍返回 running/version=2，且 cancel=true；随后携带该版本 POST cancel 返回 **200/cancelled/version=3**，但资产数量仍为1、收据仍存在，并开放 retry。

**原因：**恢复只在初始化执行；普通 `_job/detail/operate` 仅相信陈旧任务快照。异常分支第二次保存失败被吞掉后，动作路径没有重新查提交收据。共用 condition 锁只覆盖活跃线程竞争，不能覆盖“业务提交成功、状态写失败后线程已退出”的窗口。

**建议/Required：**读取及动作决策前在相同串行边界按 job_id+attempt 核对收据；收据存在则只能呈现/恢复 succeeded 或失败关闭，不能接受 cancel/pause/retry。补“连续成功状态写失败→线程退出→不重启读取/取消/重试”的回归，再保留现有重启收据恢复测试。

证据：`%TEMP%/gw-closure-independent/receipt_race.py`、`receipt-race.txt`；结构化证据 `%TEMP%/gw-index-receipt-race-jkdfy_zf/evidence.json`。故障注入不构造任务记录或资产记录。

### 🟡 S-P2｜仅媒体加载器有代次，迟到的 access 响应可在 pagehide 后重建票据与 Blob

位置：`src/gods_workbench/static/js/asset-share.js:70-76`、`:280`，同类 await 写回位于 `:253-263`。

**违反：**原 S3 的“离页立即失效旧请求代次并 Abort，防止迟到响应重建已撤销 URL”。

**独立复现：**默认 local_account 后端，匿名真实 Chrome 打开合法分享并填写口令；浏览器拦截器仅延迟真实 `/access` 响应。触发 `pagehide(persisted=true)` 后再放行该响应，页面重新恢复评论表单，并新建1个 Blob URL、撤销0个。`mediaSession.invalidate()` 本身有效，但旧 `unlock()` 完成后重新调用 render/loadPreview，绕过了媒体层旧代次检查。

**证据边界：**本用例使用真实浏览器和 HTTP，生命周期事件为受控 dispatch；不是实际跨页导航/BFCache 命中验收。它直接执行生产 pagehide 处理器，足以验证迟到响应保护缺失，不能据此扩大为已证明某浏览器 BFCache 漏洞。

**建议/Required：**给页面元信息/access/comment/approval 等异步请求统一生命周期代次和 AbortController；pagehide/换票前递增并取消，await 后验证代次及页面有效性，再更新状态或 render。保留媒体层的有界读取与 URL 撤销。补延迟 access（以及迟到写响应）在离页/换票后不得回填、不得发起新媒体请求的生产页面测试；仅测 mediaSession 组件不足以关闭 S3。

证据：`%TEMP%/gw-closure-independent/share_lifecycle.py`、`share-lifecycle.txt`；结构化证据 `%TEMP%/gw-share-lifecycle-review-a9417rq5/evidence.json`。

## 已独立验证的 Required 与边界

### B 索引

- 权限撤销提交失败关闭、根变动拒绝提交及 retry、主体隔离、任务动作 CAS、幂等键冲突均经过本轮专项复跑。
- 暂停/恢复是真实扫描检查点，不只是改字符串；取消先到不提交，提交先到常规竞争拒绝取消；并发编辑保留、不同根同名资产不覆盖。
- 有界队列拒绝与执行器异常、文件数量限制、实际子进程退出后 interrupted/显式 retry、成功收据重启恢复、旧同步响应兼容均通过现有专项。本轮没有逐一压满250000文件/500000目录项/1000任务，不把低阈值故障测试冒充满负荷验收。
- Chrome 真实点击任务中心重建索引、暂停、恢复、刷新读回通过，产物为真实文件；目视截图可见稳定 job_id 和实际结果。素材来源按钮接线作源码审阅，不把任务中心用例说成两个入口均独立浏览器覆盖。
- 保留单实例边界；OIDC 仅限服务端可见会话，不声称 IdP 远端即时撤权验收。

### CLI

- 本轮独立运行 CLI 两个文件共 **24 条**，不沿用作者“37专项”的未核对口径。
- 成功后再失败为 unknown 而非 false；普通 login 成功、成功 logout、初始/重建控制器 unknown；异主体 status 拒绝与在途启动隔离、治理权限、固定 dreamina/user_credit argv、授权字段及显式 host allowlist 均通过。
- 无换行超量、主动超时及回收、自有进程应用退出回收、旧代次迟到、终态清材料、Windows CREATE_NO_WINDOW 均有受控用例。
- 另以 Node 执行**生产 JS 函数**验证：确认取消不请求、busy 防重复、轮询不并发、离页 Abort、迟到响应不重建授权材料、unknown 呈现。非完整 CLI 设置页浏览器验收。
- 所有外部进程执行用受控 Python 夹具；未真实登录、登出、查余额或调用付费服务。实际 Dreamina 授权输出若不匹配明确字段/配置主机，会按设计降级，不能据此宣称真实账户已通过。

### 分享

- S1：share_id+asset_id 隔离、真实资产及 session 重验、到期/票据轮换与写入串行化、失败口令计数独立持久化、未知 token 固定桶与请求体上限通过。
- S2：票据头、MIME 明确准入、主动内容拒绝、下载授权、Range/错误 no-store、实际下载字节通过。
- 一次性 token 创建函数、`/share/{token}` 匿名壳、审批呈现和读取真实 Blob 已完成普通路径；匿名 Chrome 在 local_account 模式下评论/审批/下载/刷新读回通过，零 pageerror。审核者目视 screenshot 确认评论仅文字显示、审批记录和单票据提示可见。
- S3 媒体组件的代次/Abort/大小上限/URL 撤销 **4 条 Node 测试通过**，但不能覆盖上面的页面级迟到回填，因此整体分享仍 Required。

### Outbox

- 原8条专项全部复跑通过，游标与 registry 同事务持久化；失败仍保留，不虚报 replayed。
- 审核者额外通过 HTTP 导入并删除101资产产生101事件，仅注入前100项投递永久失败。第一批 count=0/failed=100 后，启动**全新 Python 进程**经 HTTP reconcile：准确 replayed=[evt_0101]，remaining=100，sink 仅1份收据。原公平性 P2 关闭，不是仅重建 app 对象模拟重启。
- 证据：`%TEMP%/gw-closure-independent/outbox_restart.py`、`outbox-restart.txt`；`%TEMP%/gw-outbox-restart-review-ukysg5pi/evidence.json`。

## 本轮独立测试证据

所有 Python 调用使用 `-p no:cacheprovider`，basetemp 指向 `%TEMP%/gw-closure-independent/`。没有修改仓库用例。

1. 索引14 + CLI24 + Outbox8 + Chrome2：**48 passed，2个 websockets 弃用警告，无 skip**；16.48秒。日志 `target-tests.txt`。
2. 分享闭环/既有分享、黄金夹具、卫生：**60 passed，无 skip**；8.37秒。日志 `extra-tests.txt`。
3. `node --test tests/frontend/asset-share-media.test.mjs`：**4 passed**。日志 `share-media-node.txt`。
4. 审核者 CLI 生产函数 Node 脚本通过：`cli_frontend.cjs`、`cli-frontend.txt`。
5. 两个新增缺陷脚本均成功复现缺陷；不能算成产品通过用例。

合计本轮仓库 Python 专项 **108 passed**，并非全量最终快照；未引用先前852 passed/8 skip作为最终验收。源文件 SHA256 快照：`%TEMP%/gw-closure-independent/review-source-sha256.json`。本轮不提交、不推送、不发布。

**双轴汇总：Standards 0 项新增硬违规；Spec 2 项 Required（索引P1、分享P2）。先定向修复两项并复跑故障窗口，再由主代理做完成态全量回归；CLI和Outbox不必扩大重构。**

---

## 第二轮独立复核：索引/分享关闭，视频新增 Required

本节覆盖上文旧结论。证据根：`%TEMP%/gw-closure-recheck-2b192f79b0dd472c83c7ee6c21b2bd9c/`。未运行全量，未改业务代码。

### 已关闭

- **I-P1 PASS**：重跑审核者原 `receipt_race.py`（仅将旧缺陷断言改成修复断言）。持续拒绝两次及之后的 succeeded 状态写入，线程结束但不重启；GET/status/同键重放均按持久收据呈现 succeeded，cancel/retry均409，资产仍1条。证据 `receipt_race_fixed.py`、`receipt-race-fixed.txt`。`_committed_truth`已进入详情、动作、列表、同键提交路径。
- **S-P2 PASS**：重跑审核者原延迟真实 access 响应脚本，pagehide后放行：Blob创建数0、表单未恢复；pageshow后回到口令表单且未展示陈旧媒体。生产页面统一epoch与Abort已覆盖load/access/comment/approval及下载。证据 `share_lifecycle_fixed.py`、`share-lifecycle-fixed.txt`。现有延迟access/comments测试实际位于 `tests/smoke/test_share_browser.py`，不是另一个文件；两种情形均本轮通过。仍是受控生命周期事件，而非声称真实BFCache命中。
- **原 V-P1-1 PASS**：重跑上一审核者原真实HTTP/回环Provider取消脚本：已派发未返回task_id时取消立即报告风险true；迟到task_id保留且维持canceled。证据 `video-cancel/repro.py`、`video-cancel/evidence.json`。专项另覆盖queued取消无POST、未知创建不重提、收到task_id后迟到completed轮询不下载、不发布。
- **原 V-P1-2 PASS**：重跑原既有目标冲突脚本，返回VIDEO_STORAGE_UNAVAILABLE，既有文件及本次临时文件均保留；本次独占发布后数据库失败只移除自身文件、取消先到不发布也通过。`os.link`提供目标不存在的原子创建，published标记限定异常清理所有权。

### 视频 Spec 新增 Required

#### 🟡 V-P2-3｜身份查询被后续刷新抢占时，提交仍沿陈旧主体继续

位置：`static/js/episode-pipeline.js:2542-2550`、`:2694-2707`（导出同类 `:2767`）。

`refreshVideoIdentity()`发现自身代次已过期只return；await它的generateVideo并不知道“本次没有得到有效身份”。独立执行生产JS：actorA保留未知请求→生成按钮发查询1→focus刷新发查询2→查询1返回实际actorB但因过期丢弃→调用者继续用旧state.actorA通过校验并POST；查询2尚未完成。证据 `video-identity-race.cjs/txt`：`race_posts=1, stale_actor=actorA`。后端在夹具中403，不声称已经发生真实越权收费，但前端“异主体未知请求绝不POST”门禁被绕过。

**Required：**身份刷新返回明确的成功代次/主体，过期或失败结果不得让提交继续；调用者验证该结果仍是当前代次，并保证旧主体未知请求在有新查询未确认时失败关闭。补并发focus/pageshow身份刷新与生成/导出恢复的竞态测试。

#### 🟡 V-P2-4｜原本未知的提交在重试401/403/404后被误当作从未受理

位置：`static/js/episode-pipeline.js:2754-2756`、`:2818-2820`。

catch将当前请求的400/401/403/404/422全部视为definitelyRejected并清空videoSubmission/videoExportSubmission。这只证明**当前重试**被拒绝，不能证明断线前第一次提交没有成功。独立生产函数复现：已有原key+原payload未知生成与导出，身份查询成功，同键重试遇到401，两者原提交均被清空，状态failed。重新登录后会允许走新key，而先前任务可能仍在执行。证据 `video-unknown-rejection.cjs/txt`，两个 `original_key_lost=true`。

**Required：**区分首次提交已明确拒绝与既有未知提交的恢复请求；后者无论本次401/403/404，都保留原key、payload、原主体与未知标记，只禁止继续/要求恢复原账号或人工查证。不能让这次拒绝抹去前一次副作用不确定性。生成与导出都补回归。

#### 🟡 V-P2-5｜成功视频仍显示“本地任务已取消”

位置：`video_tasks/service.py:52`、`static/js/episode-pipeline.js:1674,2646`。

begin_remote_create将remote_may_continue置1后，成功路径也保留；任务视图直接暴露true，UI不检查canceled状态就显示“本地任务已取消，但上游任务可能继续运行或计费”。本轮真实Chrome成功生成截图同时出现“已生成视频”、可播放视频与上述取消警告；该流程未点击取消。

**Required：**区分持久派发历史、未知远端风险和当前取消状态；至少取消文案只在真实canceled时出现，成功任务不得伪称取消。保留真正已取消/未知任务的风险警告，补成功与取消两条UI断言。直接证据 `pytest/test_video_generate_preview_ex0/video-browser.png`，审核者已目视。

### 第二轮已通过证据与限定

- 索引15+Chrome1、分享契约8+Chrome普通及生命周期3、视频契约14+ACL1+生产JS1+Chrome1：**44 passed，2个弃用警告，无skip，40.71秒**。日志 `target-tests.txt`。这不覆盖上述新增失败竞态。
- 分享媒体Node：**4 passed**，日志 `share-node.txt`。受审关键源码SHA256：`source-sha256.json`。
- 视频Chrome是真实local_account+持久ProjectsService、HTTP真实项目/画布/实体和**无production_context的分集**，手选真实画布/实体后按钮启用；生成metadata宽96、下载字节一致、FFmpeg1280×720/H264/30fps导出、刷新偏好按身份分区恢复，上游POST恰好1，pageerror=0。不过分集创建仍由HTTP准备，镜头草稿由localStorage准备；不能写成“从UI新建分集与手填全部草稿”已验收。
- V1/V2通常选择、身份切换隔离、迟到拓扑拒绝、V3原key/payload通常重试通过；新增并发身份与拒绝响应边界仍阻断V3收口。视频契约多数`_service`组件夹具替换了上下文校验，不能用它替代真实权限链；本轮HTTP原复现与Chrome未替换上下文校验。
- **Standards：无新增硬违规；Spec：本轮关闭索引I-P1、分享S-P2及视频两项旧P1，新视频3项P2 Required。CLI/Outbox沿第一轮限定PASS，本轮未重审其全部范围。**


### 视频误提示的即时复核补充

主代理按本轮发现最小修正成功/取消/未知文案后，审核者再次运行 `test_video_context_js.py` 与 `test_video_tasks_browser.py`：**2 passed，8.69秒**，证据 `video-label-fixed.txt`及`video-label-fixed/`。成功态只隐藏不适用警告，不清除后端派发历史；canceled才使用“已取消”。因此 **V-P2-5关闭**。V-P2-3与V-P2-4仍Required；此次普通成功路径通过不覆盖它们。

---

## 项目持久化与阶段门独立审核（独立范围结论）

**结论：Required，2项P1；不接受项目持久化整体收口。** ID预留、源快照和同域锁设计可保留，无须扩大重构。项目真源完整性与真实权限撤销还有以下两处可复现缺口。

### Standards

- 实际核对 `PROJECTS-HUB-INTERFACE-CATALOG.yaml` 增补：创建幂等/初始门字段、创建409、门发现/详情/PATCH三个接口；与已冻结 `PROJECT-PERSISTENCE-GATES-CONTRACT.md` 的实施范围一致，没有扩大成通用成员系统。
- SHA256实际为 `2bc11363021150fb16822b75eab1fcf0a3d84ee17efcb5b95f482fd0dc7b71ac`，`docs/provenance/PHASE-2-INPUT-SHA256.txt:10`与实物一致。登记diff确实只更新该条；未改卫生断言。本轮再次黄金+卫生 **46 passed，4.25秒**。
- 下述readonly写入同时违反AGENTS只读降级与既有编辑权限边界；属于真实权限问题，不是代码风格建议。

### 🔴 P-P1-1｜owner降为readonly后仍可批准阶段门

位置：`api/routes_asset_registry.py:1029`、`projects_hub/service.py:596-600,631-647`。

路由只执行 `_read_auth`；域层 `_validate_owner_access`只判断owner或治理角色，未检查owner当前是否仍有写权限。同一个函数适合读可见性，却直接用于写准入。

**独立真实HTTP复现：**local_account模式经setup创建账户与带门项目；随后在测试账户数据库将该owner角色改为readonly。该主体GET仍200符合只读，但PATCH pending→approved也 **200/version=2**。并非伪造X-User-Role绕过生产认证。

**Required：**写路径在不泄露无权对象的前提下同时验证当前角色可写与owner/治理归属；readonly/reviewer不能因过去是owner继续修改。应保留其合法只读能力，并测试角色降级后的首次写、同态写和CAS错误不可抢先泄露对象。

证据：`gate-readonly.py/txt`；`%TEMP%/gw-gate-readonly-review-ozuj13hs/evidence.json`。

### 🔴 P-P1-2｜项目真源已缺失，重启恢复仍派发远端视频创建

位置：`video_tasks/service.py:186-193,316-325,391-403`；授权入口同类缺口 `:246-251`。

违反原项目P4与冻结契约“视频所有创建/授权/恢复执行必须验证项目真源存在”。HTTP新建检查了项目，但恢复执行仅以video数据库的queued/running与ACL为依据；未在恢复和远端派发前读取项目真源。`authorize_asset`也仅查video owner与文件，缺少同一项目存在性守卫（本轮动态复现针对恢复路径）。

**独立真实HTTP+新进程复现：**合法HTTP创建项目、真实画布/节点，再提交视频；仅暂停调度以留下合法queued记录（没有手写任务或ACL）。随后在TEMP故障注入源快照缺失，保留预留状态及视频数据库。全新Python进程的项目读取明确返回 `PROJECT_STATE_MISSING`，但初始化视频服务仍向回环Provider发送 **1次创建POST**、`upstream_create_dispatched=1`，之后因夹具无task_id而interrupted。源服务失败关闭没有传递到计费执行边界。

**Required：**在恢复筛选/实际执行前重新验证项目真源及可信owner关联，源缺失/损坏/不可读取必须阻止新远端POST及本地导出；授权入口采用同一守卫。不能为测试放宽授权、从孤儿ACL重建项目或自动认领。补queued及已知upstream_id恢复、源缺失/损坏/归属不符、授权写入四类故障，断言无新POST/下载/产物发布。

证据：`project-recovery.py/txt`；`%TEMP%/gw-project-recovery-review-0suvg4rh/evidence.json`。全部Provider为本地回环，未产生商业请求。

### 项目已通过的证据及边界

- 本轮独立执行 `test_project_persistence_gates.py`、`test_project_persistence_frontend_runtime.py`、`test_project_gates_browser.py`：**9 passed，2个弃用警告，无skip，4.50秒**，并非直接沿用作者14+13口径。日志 `project-tests.txt`。
- 覆盖持久生产空库不注入黄金项目、HTTP真实owner/门/幂等、无权门发现过滤与404、状态迁移/CAS、治理撤回note、归档/回收/恢复保留门、全新进程读回、源损坏拒绝、ACL/快照发布失败烧号、数据根迁移保持namespace、并发预留、门更新与归档域锁屏障。
- 生产JS函数执行验证门读回失败保留幂等键、成功读回后清键及表单；Chrome经真实local_account UI立项、输入2门、读回真实pending/version1并显示“待审核v1”通过。审核者为目视验证复制现有用例至TEMP仅增加截图，独立再跑 **1 passed，4.08秒**；截图 `project-visual-2/test_browser_creates_and_reads0/project-gates-review.png`已目视。该测试没有在浏览器执行门批准操作，不将HTTP门更新测试冒称门管理全UI验收。
- TEMP副本首次pytest收集误扫临时Chrome目录失败，显式rootdir/confcutdir后正常通过；不是产品失败，也未修改仓库用例。
- 项目/视频依赖的源码哈希快照 `projects-source-sha256.json`；所有脚本/日志沿本节上方第二轮证据根。

**当前最终范围汇总：索引PASS、分享PASS；CLI/Outbox保持首轮限定PASS；视频旧P1及错误取消文案已关闭，但V-P2-3、V-P2-4未关闭；项目阶段门P-P1-1、P-P1-2未关闭。全仓最终SHA与全量回归由主代理统一，本报告不作整体完成或发布批准。**

## 第三轮独立复核｜视频身份恢复、团队消息、Provider 吞吐与成功分支边界

本轮证据根：`%TEMP%/gw-closure-third-caf4188424ac43e1afa4f4188404d6a4/`。仍只更新本报告，其他源码及测试由实施代理修改。共享工作树在审核期间继续变化，以下每次执行按各自日志记录，不合并宣称最终稳定全量通过。

### 视频 V-P2-3 / V-P2-4：原竞态复现关闭

- **V-P2-3 已关闭。** 将第二轮 `video-identity-race.cjs` 内嵌生产函数替换为当前实际函数后，改为修复断言执行。旧身份查询被 focus 新代次抢占时，`race_posts=0`、原未知提交完整保留；不是仅重跑旧代码或只改测试期望。身份刷新返回主体及代次，上游提交在 await 前后复核有效代次，不再沿旧主体发 POST。
- **V-P2-4 已关闭。** 同样重新嵌入当前生产函数执行第二轮未知结果拒绝复现；生成及导出的原 key/payload 均保留。已有未知提交的同键重试被拒绝不再被当作首次请求未受理。专项仓库用例补充验证 401/403/404/400/422 与生成/导出两动作。
- 证据：`prepare-video-recheck.py`、`video-identity-race-fixed.cjs/txt`、`video-unknown-rejection-fixed.cjs/txt`。两份独立脚本最终日志已纠正为“零 POST / 保留未知提交”，避免旧失败描述与新断言矛盾。

### 团队消息：本轮范围 PASS

实现审阅确认：使用精确 `identity_domain + external_subject` 解析作者，不把 `owner_subject` 当作者；全局 readonly/reviewer 与团队只读不能发送。权限验证在幂等重放之前，成员治理与消息操作共享域锁，消息/团队/身份/成员/幂等记录同 SQLite，写入使用事务分配单调 sequence。坏库拒绝而不自动重建，持久失败重新加载已提交快照。前端历史 cursor 与增量 sequence 独立，并用页面/团队/请求代次阻止迟到回填。

独立执行而非仅引用作者九页 JSON：

1. `team-browser.py` 启动全新临时 local_account 服务，复用九页门禁中的**团队专项工作流**，真实 Chrome 显式绑定身份，经 HTTP 创建团队及 75 条历史；历史分页与增量合流仍保留历史游标且去重；UI 发送第 76 条，刷新读回；含 `<img ... onerror=...>` 的消息只作为文本展示，无新增 img、无脚本执行、无 pageerror。结果所有断言为 true，截图已目视。结束登出 204、活跃会话 0。
2. `team-extra.py` 在**全新 Python 进程**通过生产 AuthManagementStore 读取上述数据库：76 条、末序号 76；不是只在原进程重建对象。没有向新进程传递浏览器 cookie。
3. 同一独立脚本另建真实 local_account 临时账户/团队/消息，将账户认证真源降为 readonly；GET 200 且 `can_send=false`，新消息与原幂等键重放均 403。不是依赖可伪造角色头的生产权限证明。

证据：`team-browser.txt`、`team-browser/result.json`、`team-browser/team-messages-workflow.png`、`team-extra.py/txt`。本轮只独立跑团队流程，不将其称为九页整体再次通过；九页其他页面仍以主代理统一验收为准。未验证真实 OIDC、跨进程同时写入或多实例部署，不扩张单实例事务边界。

### Provider tokens/s：本地协议及真实 Chrome 范围 PASS

已审服务端和前端实现：页面加载只读公开配置；用户显式选 Provider/模型并确认费用后才 POST；并发上限 2、输出上限 512、不自动重试、不跟随重定向。输出吞吐仅使用合法非负整数 `usage.completion_tokens / 端到端耗时`，不以文本长度估 token；无 usage、无效计数/耗时/结果均降级不可用。服务端模型及 Provider 归属为权威，不向浏览器透传密钥或原始上游响应。UI 标注端到端而非模型解码速度，切换模型清旧读数。

本轮独立复跑 `test_provider_metrics_browser_real_loopback`：加载零 POST、取消确认零 POST；确认后回环响应 completion_tokens=24、elapsed_seconds≈0.453、tokens_per_second≈52.9801，公式与 UI 一致；切换无 usage 模型后为 null/usage_missing；刷新不重发。总回环调用恰为 2，无 pageerror。`pytest/test_provider_metrics_browser_0/provider-metrics-browser.json` 与截图已读回和目视核对。

**边界：**真实 Chrome + 本地回环 HTTP 协议，不是商业 Provider 质量/计费/延迟现场验收，更不是纯解码 tokens/s 基准。

### 11 条成功分支：证据分类，不统称 11 条生产端到端闭环

| 用例 | 实际初态及验证范围 | 不能扩张的结论 |
|---|---|---|
| auth users GET/DELETE | HTTP 建治理用户、列表、删除；开发角色夹具 | 非真实外部身份生命周期 |
| operation approval PUT | 直接注入 `_Approval` 后 HTTP 更新 | 非申请创建→批准完整业务链 |
| library/category/item lifecycle | HTTP 创建、移动、改名、删除及 CAS 读回 | 不包含外部内容生产 |
| asset classification DELETE | 直接写 running 任务快照，再 HTTP 取消 | 非分类算法执行/真实运行任务取消闭环 |
| avatar status/register | HTTP 建素材，允许根内受控字节文件，注册/状态读回 | 文件不是合法图片，不证明图片解码/外部头像同步 |
| workflows upload | HTTP base64 上传、允许根真实落盘并比较字节 | 非工作流运行 |
| asset structure GET/PATCH | 替换为专用内存 AssetStructureService，HTTP/CAS 读回 | 非生产持久化或新进程恢复 |
| canonical project patch/governance restore | HTTP 创建、改名、归档、治理恢复、版本递增及列表读回 | 非阶段门管理全 UI |
| local assets PATCH | HTTP 上传受控字节、注册、改名、读回 | 文件不是合法 PNG，不证明图片处理 |
| video project claim/authorize | 直接 ProjectsService 构造无视频 ACL 初态；FFmpeg 真 MP4、HTTP claim/import/authorize | 不是生产 HTTP 新建链，也不证明历史迁移；当前 owner 夹具需纠正，见后文 |
| video task cancel | HTTP 建项目后直接 store.create_job 写 queued，再 HTTP cancel/GET | 虚拟画布/节点未过真实上下文创建验证，非 Provider 任务生命周期 |

以上用例适合作为目标成功分支补充；批准/分类/结构/视频初态的受控构造应如实标明，不能以通过数量替代生产链证明。

### 项目修复样本复跑：两条原故障不再重现，但本轮暂不整体放行

项目实施代理仍在修改共享文件，尚未按完成交付的固定快照复核。本审核额外对当前样本做了以下检查，不能用来替代交付后的最终一致快照：

- 第二轮原 `gate-readonly.py` 仅将最后断言改为读 200/写 403 后复跑通过；源代码在 owner/治理可见性之后、CAS 与同态更新之前验证当前写角色。当前样本关闭 readonly owner 写入窗口，且保留只读读取。
- 第二轮原 `project-recovery.py` 仅将最后断言改为 Provider POST=0、job=interrupted、dispatched=0 后复跑通过。新进程仍读到 `PROJECT_STATE_MISSING`，但不再向回环 Provider 发 POST。实际执行、授权、轮询/下载/发布路径新增项目真源/owner 校验。
- 独立专项 `test_project_gate_current_role.py + test_video_project_source_guard.py + test_project_persistence_gates.py + test_video_tasks.py` 当次为 **27 passed，11.06 秒**。原复现记录为 `gate-readonly-fixed.py/txt`、`project-recovery-fixed.py/txt`，专项为 `project-tests.txt`。实施中测试文件继续增加，27 只代表该次收集数。

**🟡 仍需收口：新项目 owner 守卫与成功分支夹具不一致。** 随后独立执行 `test_phase12_success_branches.py + test_video_tasks_browser.py`，得到 **1 failed、11 passed、2 warnings，9.96 秒**。失败位置 `test_phase12_success_branches.py:486`：直接 `create_project(...)` 未提供 owner_key；claim 只绑定视频侧 ACL，新真源守卫下授权返回 `404 VIDEO_PROJECT_NOT_FOUND`，不是预期 200。此结果不应通过弱化 owner 校验修复；应为“真源已有可信 owner、仅缺视频 ACL”的合法受控初态配置正确 owner，并保留无 owner/错 owner 拒绝测试。若确实要求无 owner 的历史项目迁移，应另有经审核迁移契约，不能把孤儿 ACL 自动提升为真源。

日志：`post-project-tests.txt`。其中视频真实 Chrome 用例通过，但不能据此把当前 11 成功分支或项目修复整体标绿。**P-P1-1/P-P1-2 的原故障在本轮样本已修复；正式关闭及成功夹具收口等待实施完成后的固定快照复核。**

### 本轮执行汇总与最终边界

- `test_video_context_js.py`、团队契约、chat metrics、home Provider runtime、11 成功分支、团队前端运行时及 Provider Chrome 共 **58 passed，2 warnings，8.78 秒**；见 `target-tests.txt`。该次成功发生在后续项目 owner 守卫联动完成前，不能覆盖上述后来出现的 404 失败。
- 两条原视频复现、团队真实 Chrome、团队新进程持久读回、local_account 降权复测均通过。
- 项目原复现与当次 27 项通过；随后的成功分支+视频 Chrome 为 1 failed/11 passed。所有弃用警告来自 websockets/uvicorn，不是被忽略的业务失败。
- 源码哈希记录在 `third-source-sha256.json`；这是报告落盘时取样，不声称所有早先测试都针对该最终哈希执行。

**当前裁定：索引、CLI、分享、Outbox 保持前述限定 PASS；视频 V-P2-3/V-P2-4 已关闭；团队消息与 Provider tokens/s 在本轮明确范围 PASS；项目原两 P1 的修复样本已验证，但正式交付复核及 owner 成功夹具仍待收口。没有全仓最终稳定 SHA/全量回归结论，不代表真实 CLI 账户、商业 Provider、真实 OIDC 或发布授权验收。**

## 交付后复核补记及 claim 最小兼容设计审核

本节在主代理解除矩阵期间的工作树写入冻结后补记。冻结期间只读源码、执行仓库外复现；未改业务实现。

### 原项目 P1 的正式复核

实施交付后重新执行 `gate-readonly-fixed.py` 与 `project-recovery-fixed.py`，结果仍为只读 owner 读200/写403，以及新进程在 `PROJECT_STATE_MISSING` 下 interrupted、Provider POST=0、dispatched=0。`delivered-before-sha256.json` 与 `delivered-after-sha256.json` 一致。**P-P1-1、P-P1-2 原缺陷关闭。**

同次项目门/真源守卫/持久化/成功分支专项为 **24 passed、1 failed，5.56秒**，失败仍为视频 claim/authorize 成功夹具。内存项目未传 owner_key 时并非真正无owner，而是分配固定 `memory-test-owner` 摘要，与HTTP主体不同；前节“未提供owner”的表述指调用参数缺失，不代表项目内无owner字段。仅在TEMP插件给夹具补当前真实主体owner，不替换生产授权函数，原失败用例变为 **1 passed，0.26秒**。证据 `delivered-tests.txt`、`owner_fixture.py`、`owner-fixture-check.txt`。

但是，修夹具只能证明本人恢复ACL路径。冻结 `VIDEO-TASKS-INTERFACE-CATALOG.yaml` 的 `security.identity.project_access` 明确保留持久owner或显式grant，以及治理员授权历史无ACL项目的语义。现有 claim 成功仅写视频ACL，而双owner严格相等校验会拒绝不同真源owner的治理显式授权，因此兼容性问题不能仅靠改成功测试消除。

### claim 来源绑定方案：有条件通过，可进入最小实现

审核对象为主代理提出的设计，**不是已经实现/测试通过的代码**：视频ACL增加可空 `source_owner_key`；将受权视频主体与来源项目owner分别记录；保持项目真源完整性与所有旧安全守卫。

建议正式锁定以下不变量：

1. **来源只从完整项目真源读取。** 新增内部只读访问器，在项目域锁与既有快照验证下取得该 project_id 的实际owner。不得接收客户端owner，不公开主体摘要，不从video ACL、名称、任务记录反推或回填项目。缺项目、损坏、不可读、owner字段非法均先拒绝，claim不得新增/修改ACL。
2. **访问判定为三方匹配。** 同一 project_id 下 `ACL.owner_key == authenticated_actor`；非NULL时 `ACL.source_owner_key == 当前项目真源owner`。旧NULL仅允许 `当前真源owner == authenticated_actor == ACL.owner_key`，且读取/执行不得悄悄补列或扩大权限。异主体旧NULL须经当前有效admin/governor显式claim补来源。
3. **claim不替换受权人，不改项目owner。** 无ACL时，治理主体自授权并记录当前真源owner；已有ACL属其他主体时409且全行不变；同主体同来源为幂等；同主体NULL可在治理权限检查后补来源。**已有非NULL来源与当前真源owner不同时应拒绝，不把普通重复claim做成静默重绑定**；若将来要支持所有权变更后的重新授权，另行定义明确操作及旧任务处理，不混入本次最小修复。
4. **事务与执行边界不退化。** ACL检查/插入/NULL补齐在单SQLite写事务内完成，补齐条件包括project_id、原受权actor及source_owner_key仍为NULL。既有创建的pre-publish注册写入 `source_owner_key=创建actor`，但执行仍必须等项目真源真正发布；孤儿ACL不能据此恢复项目。恢复入队、执行、远端POST、轮询/下载、发布、导出、素材授权继续复用统一守卫；终态interrupted不因claim重新调度。跨库不宣称ACID，不引入反向锁顺序。
5. **迁移只增列，不猜来源。** 升级版本仅新增可空列，旧行保持NULL；保留原actor/granted_by/时间、任务、幂等键、产物及旧派发风险迁移。旧/新INSERT一律显式列名，避免现有 `INSERT INTO video_projects VALUES(...)` 因加列失败。未知schema版本/损坏继续503、不重建；可重复初始化与中途迁移失败须有回归。
6. **明确单受权主体范围。** 此方案保留“真源owner本人”及“治理显式自授权的grantee”两种来源，不实现多成员grant或任意代理指定受权人。新建项目已经自动有owner ACL，其他治理主体claim必须409，不能借兼容历史路径覆盖该owner。

该方案是可接受的最小修复：只加一个来源字段和内部取真源owner能力，不需要把项目owner改给治理员，也不需要取消真源检查。须满足上述非NULL来源不静默重绑定与NULL失败关闭要求。

### 必须覆盖的独立验收矩阵

- **新建不被夺权：** 真实HTTP主体A创建项目，A原ACL正常；不同治理主体B claim409，A/来源绑定不变。
- **合法历史显式grant：** 生产持久 ProjectsService 用真实主体A的owner_key建立“有可信真源、无视频ACL”的隔离历史初态（不附before_publish）；明确这是受控历史初态，不能冒称普通HTTP创建后可覆盖。不同治理主体B经真实HTTP claim、授权、创建视频202，并验证回环执行；主体C editor与A均不能因项目可见绕过仅给B的视频ACL。至少区分A/B/C的identity，而非只改同一Bearer的角色。
- **旧库兼容：** 真旧schema升级不丢任务/产物/幂等。NULL且A==真源owner可用；NULL且B!=真源owner不得执行，B只有当前治理授权后才能补来源并可用；其他主体不能覆盖。非NULL来源错配、owner变化、缺失/损坏/不可读均拒绝且ACL不变。
- **恢复和计费边界：** queued、已知upstream_id、导出各验证失败时无新增POST/轮询/下载/发布；交付后重跑本报告原真实HTTP新进程复现，不能让合成单测owner替身取代它。
- **并发/幂等：** 两治理主体竞争claim最多一方写成功；相同主体重放不改granted_by/时间/来源；NULL补齐失败回滚，旧记录保留；owner变化后非NULL绑定不被claim悄悄刷新。

**最新裁定：原项目两P1关闭；claim/grant兼容联动仍Required，但上述设计可进入实施。其他范围沿用第三轮限定PASS。尚无该方案实现验收或最终全仓稳定快照结论。**

## 最终收口｜claim 来源绑定、V-P2-6 与统一验收证据

本节为当前有效结论；以上 Required 章节保留为发现、修复及复核历史。审核者只更新本报告，未修改源码、测试或冻结契约。

### claim/grant 兼容实现：PASS

已按上一节批准的设计审阅交付实现并独立复核：schema v3 事务扩展可空 `source_owner_key`；当前来源仅从完整项目真源内部读取；ACL受权actor与真源owner来源分别验证。旧NULL只允许真源owner本人兼容，读取不回填；治理显式claim可补同受权主体的NULL来源；既有非NULL来源错配拒绝重绑定；其他主体无法覆盖；项目owner不被claim修改。

独立证据根：`%TEMP%/gw-claim-independent-8881536b42004797836f1946965e4b3c/`。

- `http-claim-delivered.py/txt` 与后续修复复跑使用真实回环HTTP、local_account真实会话。A经HTTP首次设置，B/C账户为隔离数据库初态并经真实密码登录；没有使用角色头冒充生产权限。A/B/C为三个不同主体。
- A普通HTTP创建的新项目自动绑定本人来源和ACL；不同治理B claim409，原行不变。
- 历史初态明确由生产持久ProjectsService以真实A的owner_key创建，但不附视频ACL回调；这是受控历史夹具，不冒称普通HTTP创建后可覆盖ACL。B真实HTTP claim、授权成功，提交视频202，回环Provider实际收到1次创建POST；C editor拒绝403，A不能覆盖已给B的单主体视频ACL。项目owner始终仍为A，B同键claim不改变既有行。
- 本人NULL兼容不回填；异主体NULL拒绝，当前治理主体可显式补来源；非NULL来源与真源owner不符时claim409且原行不变，授权/新任务拒绝。缺失、损坏真源同样拒绝且不修改ACL。
- `migration-review.py` 独立手建旧版schema，不复用作者迁移助手。v1/v2经全新Python进程执行生产迁移，再由第二个新进程重复初始化；ACL/任务/请求幂等/素材/产物保持，旧NULL不凭空填充，v1远端派发风险迁移仍保留。版本升级写入被故障触发器拒绝时整笔回滚；未知版本503、旧结构和记录不被重建。详见 `migration-delivered.txt` 与 `delivered/migration-result.json`。
- 再次执行第二轮原真实HTTP来源任务＋新进程恢复复现：缺真源仍interrupted，Provider POST=0，dispatched=0；`project-recovery-final.txt`。没有以合成owner检查替身替代这项证明。

**边界：**上述独立claim生成验证到真实回环派发后主动取消，不将它说成独立完成了生成媒体。媒体完成、预览/下载和FFmpeg链路沿用前述真实浏览器专项及主代理最终全量覆盖，不混淆证据来源。

### V-P2-6｜真源故障阻断任务观察与取消：已关闭

此项为claim交付额外将真源守卫加入详情/列表/取消时引入的联动回归。原独立复现确认：合法任务已派发后TEMP真源缺失，原主体GET、列表、cancel均503，持久任务仍running且继续轮询上游。取消与历史状态读取不应成为项目故障时不可用的止损入口。

最小修复仅移除这三个操作的当前项目真源门槛，保留持久job.actor_key隔离及取消路由的当前可写角色要求。创建、授权、执行及产物读取仍使用严格三方来源守卫。

**原脚本改为修复断言后独立通过：**`http-claim-observation-fixed.py/txt`、`observation-fixed/http-result.json`。

- 真实上游GET通过事件屏障保持在途，再暂时移走项目真源；原主体详情200、列表200、取消200。
- 取消后持久状态canceled，响应仍明确 `remote_may_continue_or_bill=true`，没有宣称远端取消或退费。
- 释放迟到GET后，在有界观察窗口内没有第二次轮询。
- 同一账户认证真源临时降readonly时取消403；其他主体详情/取消404、列表不包含该任务。
- 产物读取仍503，不以可观测性修复绕过媒体权限。
- 同次重复验证所有claim/NULL/来源错配/坏真源断言通过。

最后专项独立执行：视频ACL、项目来源守卫、11成功分支、门当前角色共 **29 passed，8.79秒**；Phase10E **37 passed，2.18秒**。日志 `observation-target-tests.txt`、`phase10e-tests.txt`。Phase10E改用真实其他主体HTTP创建项目证明editor被ACL拒绝，不再让无可信owner的黄金项目假扮该权限用例。四个核心源码执行前后SHA256一致，见 `observation-before.json/after.json`。

### 主代理最终全量与九页证据：已独立读回核对，未重复冒称独立全量执行

审核者直接读取最终JSON和pytest文本日志，并重新计算快照文件映射摘要：

- `%TEMP%/phase12-coverage-cd412584f1044987b9e18c92e5c4b33e.json/.txt`
- pytest退出码0，**904 passed、8 skipped、3 warnings，172.21秒**。保留skip事实，不称所有用例均实际执行。3个警告分别包括Pydantic字段alias警告与websockets/uvicorn弃用警告。
- `stable_snapshot=true`，开始/结束599个文件映射完全相同，重新计算摘要与报告一致：`6cc92191bc33cccb2a69c0b2cb49ad9346b00d611e525704b1991690681c1d9f`。这是文件快照摘要，**不是Git提交SHA**。
- 本节落盘前再次逐文件比较当前599文件，全部一致。后续治理文档收口会改变全树摘要，不把文档更新后工作树冒称原始全文件快照；源码/测试/契约保持绑定本次验收快照。
- OpenAPI **256操作，253触达，248有2xx，2265次请求**。这是方法/路径/状态的覆盖证据，不等于248条完整生产业务链；本报告对11条成功分支的受控初态边界继续有效。

8个无2xx操作逐项核对如下：

| 分类 | 操作 | 实际证据/边界 |
|---|---|---|
| 正常重定向语义 | GET `/api/asset-auth/callback` | 16次均302；受控OIDC契约测试，不是实际外部IdP现场验收 |
| 冻结失败关闭 | POST `/api/canvas-assets/download` | 503/401/403；不宣称下载实现完成 |
| 冻结失败关闭 | POST `/api/canvases/assets` | 503 |
| 冻结失败关闭 | POST `/api/shared-folders/import` | 503 |
| 冻结失败关闭 | GET `/api/shared-folders/{folder_id}/tree` | 404/503 |
| 明确排除、未执行 | POST `/api/asset-registry/governance/canvases/purge-expired` | attempts=0 |
| 明确排除、未执行 | POST `/api/canvases/{canvas_id}/workflow/export` | attempts=0 |
| 明确排除、未执行 | POST `/api/canvases/{canvas_id}/workflow/import` | attempts=0 |

九页最终报告 `%TEMP%/gw-phase12-auth-browser-zsfr4cdg/phase12-authenticated-browser.json`：状态PASS、failures为空、fatal_error为空；9页均真实local_account认证200且无pageerror；9页、7交互、9路由、8重复导航、27顶栏、27项变异失败保护验证。团队75条历史、分页/增量、UI发送、刷新读回、纯文本渲染全部true；登出204、剩余会话0；9张报告列明截图均存在。这里是**审核者独立核对主代理最终执行产物**，不是再次运行九页；团队流程本审核另有前述独立Chrome证据。

核对记录：`%TEMP%/gw-claim-independent-8881536b42004797836f1946965e4b3c/final-evidence-check.json`。

### 最终独审裁定

| 范围/原问题 | 当前状态 |
|---|---|
| 索引 I-P1 | 已关闭，限定范围PASS |
| 分享 S-P2 | 已关闭，限定范围PASS |
| CLI、Outbox公平性 | 保持前述限定PASS |
| 视频 V-P1-1/V-P1-2、V-P2-3/V-P2-4/V-P2-5 | 已关闭 |
| 项目 P-P1-1/P-P1-2 | 已关闭 |
| claim显式grant兼容 | 来源绑定实现及独立复核PASS |
| 视频 V-P2-6 | 原复现修复断言通过，已关闭 |
| 团队消息、Provider tokens/s | 保持明确本机/回环证据范围PASS |

**本报告已列 Required = 0。本轮已授权代码范围与本机隔离验收完成。** 该结论不包含冻结失败关闭/明确排除功能的业务实现，不代表真实商业Provider、真实CLI账户、真实OIDC生产验收，也不构成版权合规审计或发布许可。仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

### 文档最终短复核：PASS

已读回 `PHASE-12-FINAL-ACCEPTANCE.md` 全文及ledger、queue、旧summary顶部收口指引。完成口径明确限定本轮授权实现与本机验收，保留8项无2xx操作、skip、受控历史初态及外部现场/发布限制；未发现新的超证据完成声称。

已核对最新九页报告 `%TEMP%/gw-phase12-auth-browser-qzc2ltyn/phase12-authenticated-browser.json`：PASS，9页/7交互/9路由/8重复导航/27顶栏/27变异保护，团队历史、发送、刷新、纯文本断言通过，无pageerror，剩余会话0。此报告替代上一轮九页报告作为最终同版补跑证据，不冒称由审核者再次执行。

`%TEMP%/gw-phase12-final-verification-manifest.json` 正确绑定该九页报告及904通过稳定矩阵。审核者重新枚举当前Git可见文件、逐文件计算并核对全部453份非治理文件，与矩阵和manifest完全一致；重算摘要为 `2f7580fb2fde573998808282956cbc2b17ef908d6b8acefa9486b1519494e532`。当前仅治理文档发生收口变化，本次没有重跑测试或修改源码。

核对记录：`%TEMP%/gw-claim-independent-8881536b42004797836f1946965e4b3c/final-document-check.json`。**最终独审维持PASS、Required=0；仅本轮代码与本机隔离验收完成，非真实商业Provider/CLI/OIDC生产验收或发布授权。**
