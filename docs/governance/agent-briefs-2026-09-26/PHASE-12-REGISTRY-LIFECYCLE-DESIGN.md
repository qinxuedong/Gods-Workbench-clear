# 项目门、索引工作区任务、审计outbox最小生产链（待方案审核）

## 审核确认的剩余范围
PHASE-12-PDF-PERSISTENCE-INDEPENDENT-REVIEW.md第五节：create_project_gate/create_workspace_job只有定义，没有真实生产调用者；reconcile仅改状态而无投递。不能通过测试直接塞仓库记录称端到端完成。本文件是提案，不代表批准或已实施。

## A. 项目门来源
- 优先复用已存在的项目创建入口：请求增加可选gates数组，每项明确code/name，不凭空生成默认门；前端项目创建提供可选阶段门输入，用户明确提供内容后才生成稳定gate_id。
- 项目创建与门创建需原子效果或有明确补偿：非法/重复门应在创建项目之前拒绝；门落盘失败不得返回“项目+门全部创建”。门归属真实project_id，项目GET/注册表快照可发现，与已有PATCH /project-gates/{gate_id}读回一致。
- 状态采用明确有限集合pending/approved/changes_requested（最终须核对已有前端枚举再冻结），PATCH使用实际对象version及expected_version；不能继续只校验不相关全局revision。错误状态400、未知404、跨项目/非编辑角色拒绝。
- 不借此实现项目持久化；项目服务仍内存时必须承认重启项目关联验证问题，不能把门持久化孤儿假称成功。方案审核需裁定是否复用现有项目恢复材料还是先最小持久化项目真源；未经批准不自行扩改。

## B. 工作区任务来源与真实效果
- 复用POST /asset-registry/reindex与/index/sync，新增显式background=true模式（返回202+稳定job_id+poll_hint）；旧同步请求保持真实统计结果。前端索引按钮使用后台模式，任务中心展示这些真实任务，不再只有手工状态记录。
- 单进程有界执行器执行真实允许根扫描；独立任务存储避免任务进度修改素材全局revision而破坏CAS。源请求权限、稳定发起主体与允许根配置指纹入安全元数据；不存绝对根路径/凭据。
- queued/running/paused/succeeded/failed/cancelled/interrupted明确迁移；pause等待安全检查点，resume继续扫描，cancel阻止尚未提交的索引变更，retry只对失败/取消/中断执行真实新attempt，不只是修改字符串。原job_id稳定，attempt递增，CAS和幂等避免重复提交。
- 扫描结果一次原子提交；失败/取消不得半覆盖索引。重启活动任务标interrupted，不自动重复有副作用命令。任务GET/actions/action_reasons与前端使用job_id一致，不用id别名作主真值。
- 不扩成通用远程任务系统，不承担视频任务调度；视频继续专用服务。

## C. 审计outbox来源与真实sink
- 素材删除/回收恢复这两个既有治理写操作在同一次registry事务中追加事件（event_id、asset_id、类型、时间、有限脱敏主体），形成真实pending；不保存请求正文/文件内容/凭据。
- 使用单实例本地持久化审计收据sink（独立JsonState），收到event_id后原子写入事件/内容摘要，读回同event_id及摘要成功才算ACK。相同ID+相同内容幂等，相同ID+不同内容拒绝。
- reconcile真实投递pending/failed并验证ACK后才记replayed；失败保留pending/failed与安全错误码。ACK后registry标记失败可安全重复投递，不产生重复事件。
- 治理overview展示有限最近收据及统计供读回，不新建外部消息总线；这是本地审计持久化，不宣称外部系统送达或加密签名。

## 验收
只使用合法HTTP生产来源创建门/任务/事件→GET发现→真实操作/文件效果→重复/失败/重启验证。组件注入只用于故障和竞争，不冒充创建来源。补权限/CAS/取消提交竞争/失败重试/收据幂等；任务中心真实浏览器及精确契约门禁。实施之前先独立审查本提案。
