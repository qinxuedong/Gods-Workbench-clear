# 本轮视频实现与本地审计outbox独立验收

## 总结

- 视频合法上下文的真实浏览器生成/预览/下载/本地导出/刷新读回通过，但有两项独立复现P1，**本轮视频实现不能整体关闭**。
- C本地审计sink的生产事件来源、持久收据ACK、幂等、失败保留、并发重放及跨进程恢复通过；批次选择有P2饥饿问题，建议修复后关闭C。
- 两份补充设计已另写 `PHASE-12-PROJECT-VIDEO-CONTEXT-DESIGN-REVIEW.md`：项目持久化有条件通过；视频选择器按V1-V4可实施。普通UI创建分集缺上下文仍未完成，不被本报告的合法上下文浏览器通过覆盖。

## 🔴 V-P1-1：远端创建在途取消错误否认计费风险，并丢弃迟到引用

位置：`video_tasks/store.py:261-265,276-286`；`video_tasks/service.py:391-412`。

`cancel`仅在已有upstream_task_id时设置remote_may_continue。远端POST已经发送、响应尚未返回时upstream_task_id仍空；取消会返回remote_may_continue_or_bill=false。响应随后返回task_id，set_upstream_task因任务已canceled拒绝写入，稳定上游引用永久丢失。取消没有调用远端取消接口，因此不能声称没有后续计费风险。

独立真实HTTP复现（全本地回环Provider，未调用商业服务）：
1. 经合法HTTP创建项目、画布、节点，不替换上下文校验。
2. POST视频任务，夹具Provider已接收一次创建POST，延迟响应。
3. 此时HTTP取消返回200/canceled/remote_cancelled=false/remote_may_continue_or_bill=false。
4. Provider释放响应返回稳定task_id；工作线程结束后GET仍否认风险，数据库upstream_task_id仍null。

证据：`%TEMP%/gw-video-cancel-review-f8c5612614334a949344f6511edbc691/evidence.json`。

**建议/Required：**以持久化的创建派发状态区分从未执行、已开始/结果未知；派发前与取消有清晰串行点，已取消未派发者不得再POST。已派发即保守标记远端可能继续/计费；迟到task_id仍可安全保存为取消任务的追踪引用，但不能恢复本地发布、轮询发布或自动重提。补“响应前取消”“响应后取消”“queued取消”“未知响应”“重启后读回风险”的屏障测试。

## 🔴 V-P1-2：拒绝覆盖已有目标时，异常清理反而删除已有文件

位置：`video_tasks/store.py:289-320`，尤其299与315-320。

complete_success先设置final_path，再发现目标已存在并抛错；两个异常分支只判断final_path存在便unlink，因此会删除不是本次调用创建的既有MP4。这违反唯一产物不覆盖的保护意图，也可能破坏崩溃后尚待人工核验的文件。

独立组件复现：创建并运行临时导出任务；预放同名目标字节`pre-existing-do-not-delete`和新临时文件；调用发布返回VIDEO_STORAGE_UNAVAILABLE，既有目标消失，新临时文件保留，任务仍running。

证据：`%TEMP%/gw-video-publish-review-e8e5507606244639b8b798acfbc6b126/evidence.json`。此为发布故障复现，未拿人工文件冒充完整业务来源。

**建议/Required：**单独记录“本次是否成功发布/拥有目标”的标志，只有该标志为真才补偿删除；不要以路径变量非空推定所有权。补既有文件hash不变、本次os.replace后数据库提交失败仅删除本次文件、取消先到不发布的回归。

## 🟡 C-P2-1：固定前100个失败项可永久阻塞健康后续事件

位置：`asset_registry/repository.py:835-836`。

候选总是字典前100个pending/failed；失败仍保留原顺序。当前100项永久失败时，第101项及之后即使sink正常，也永远不会被尝试。仅反复点击“重放”不能推进健康积压。

独立复现：101项均由真实HTTP导入→删除产生；故障注入只让前100个事件的sink失败，第101项可正常送达。连续两次reconcile均count=0、remaining=101；健康事件未被调用且保持pending。

证据：`%TEMP%/gw-outbox-independent-7b6345ede01b44b7be6f4be485acd7dc/evidence.json`。

**建议/Required：**保持每批上限但使用持久游标、最久未尝试优先或其他公平重试选择；失败保留，不允许跳过后虚报replayed。补超过100个事件、部分永久失败、多批推进/重启公平性回归。无须引入外部消息总线。

## 已通过证据与优点

### 独立测试

`python -m pytest tests/contracts/test_phase12_audit_outbox.py tests/contracts/test_video_tasks.py tests/contracts/test_video_project_acl.py tests/smoke/test_video_tasks_browser.py -q --no-header -p no:cacheprovider`

**18 passed，2 warnings，13.29秒，无skip**。两个warning是websockets弃用提示，不是断言失败。
日志：`%TEMP%/gw-independent-video-outbox-tests.txt`。
源码SHA256快照：`%TEMP%/gw-independent-video-outbox-source-hashes.json`。

这些通过不覆盖上面的新增失败场景，不使用父代理全量中间快照证明最终完成。

### 视频真实浏览器

本轮重新运行Chrome，不是复用上一轮截图：本地账号、合法HTTP项目/画布/实体/流水线上下文；回环Provider生成；播放器metadata ready且96像素宽；下载字节等于源；本地FFmpeg导出1280x720/H264/30fps；刷新后任务和下载链接读回；上游只创建一次，零pageerror。已目视当前截图，页面视频卡及下载入口可见；没有据此声称全页面逐像素审计。

独立证据目录：`%TEMP%/pytest-of-qinxuedong/pytest-2622/test_video_generate_preview_ex0/`，包含`video-browser-evidence.json`、`video-browser.png`及真实媒体。

范围：测试初始上下文来自合法HTTP、草稿来自localStorage输入准备；不是普通UI无上下文分集路径。Provider为本地协议夹具，不是真实商业Provider/账号验收。

### C真实来源与ACK

- 删除、回收恢复、取消归档与事件在同一registry事务；认证上下文由路由传递，事件只保存主体摘要，不含原始token/请求。
- sink同ID同内容幂等、同ID异内容拒绝；重新读回event/digest才ACK。
- sink失败或读回失败保留failed；ACK后registry提交失败重投不会重复收据；并发重放总共只一份收据。
- governance概览及reconcile要求治理权限，普通editor403；返回最多50个脱敏收据；内部收据文件不能走通用下载。
- 生产JS事件处理函数Node执行验证部分失败计数、重新读回、禁用重复点击；这不是治理页完整浏览器交互验收。
- 审核者另起全新Python进程，通过HTTP治理概览读回原event_id及1份持久收据。该证据与上述101项公平性复现位于同一独立目录。

## 工作边界

仅新增本人两份审核报告。没有修改被审实现、提交、清理共享工作树、读取旧仓源码或调用真实收费服务。分享新修复、CLI及项目持久化/选择器实际代码不纳入本轮实现通过结论；后续应按定向修复再审，而非用新增普通路径通过替代失败用例。
