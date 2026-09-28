# 项目真源与阶段门最小持久化方案（待独立审核，尚未实施）

本方案回应 PHASE-12-OUTPUT-CACHE-N1-LIFECYCLE-INDEPENDENT-REVIEW.md 对 A 项的 Required。不得以视频 owner 表或 orphan 失败关闭代替项目恢复。

## 1. 真源与事务
- 生产 ProjectsService 使用仓库外 `projects.json`（现有 JsonState 原子替换），同一快照保存完整 ProjectItem、稳定主体 owner_key、阶段门、请求幂等映射及持久序号/命名空间。阶段门不再另存 registry JSON。
- 不复制旧仓、不迁移未知用户文件。当前内存实例只代表当前进程已存在内容；已有生产项目若没有可验证持久来源不得凭名称恢复或绑定给当前用户。现有黄金夹具只供显式测试实例，生产默认不注入模拟项目。
- 保留 ProjectsService 的内存测试模式（显式构造）用于冻结黄金夹具；全局生产实例启用持久模式。每次方法调用按当前数据根取得状态，禁止在 import 时缓存真实用户数据。测试必须隔离数据根，不能靠清空生产项目冒充恢复。
- 单进程一个域锁覆盖所有项目/门读写；从磁盘状态构造新快照，所有校验和CAS在锁内，原子替换成功后才更新观察缓存。写失败保持原状态，不先修改内存返回成功。多worker不在保证范围。

## 2. 创建与视频ACL相容
- 创建请求可选 gates（code/name严格长度、唯一性、数量上限）；门只能来自用户明确输入。含门创建要求client_request_id，幂等域为稳定主体+键+规范化请求摘要；同键异参409。
- 项目、owner、初始门、幂等映射在一个projects快照中提交。ID不可复用。所有非法输入在任何写入前拒绝。
- 现视频ACL独立存储：先执行已有幂等owner绑定，再原子发布projects快照。若前者失败则不创建项目；若进程在两者间崩溃，最多遗留不可见且无法复用ID的ACL行；视频服务仍须验证项目真源存在，故不会越权形成可操作项目。禁止声称跨库ACID。
- 项目快照发布成功才返回201；含门请求重试从幂等映射恢复同一project_id/gate_id。持久提交前生成的ID使用UUID，失败与重启不复用。不删除未知孤儿ACL。
- 对历史有项目而无owner证明的记录，阶段门写入拒绝；不以全局editor或先到者补写owner。治理者显式授权仍沿用现有视频权限入口，门使用项目真源owner/明确grant，不能把两者暗中等同。

## 3. 权限、生命周期与CAS
- owner_key从认证上下文稳定domain+subject派生，不接受客户端author/owner；local_dev只用于开发模式。
- 项目门GET/发现/PATCH须先校验项目存在和项目访问权；非owner且无显式grant隐藏为404或按冻结契约403。治理角色可以显式管理，普通editor不自动获得全部项目门。
- 阶段门状态固定 pending/approved/changes_requested；允许 pending→approved/changes_requested、changes_requested→pending、approved→changes_requested；同态幂等是否升版本在契约中固定，不随实现漂移。
- 门PATCH用门自身expected_version；项目归档/回收/恢复仍用项目expected_version。门更新与项目生命周期共用同一事务锁，杜绝检查后项目进入回收站仍成功写门。
- 归档项目可按权限读门、不可写门；回收站禁写门；恢复保留project_id/gate_id/version及owner，不重建/重置门。恢复生命周期沿用冻结行为。
- 发现接口从同一项目快照取门，过滤无权项目；不允许registry快照继续泄露全部门。

## 4. 前端与兼容
- 项目创建界面增加可选阶段门输入（空即无门），显式展示已保存的门、版本和状态；更新失败保留用户输入，409重新读回不盲目覆盖。
- 不大范围重写项目中心。原项目创建/编辑/归档响应兼容，新增门字段和接口同步冻结契约、Phase8精确路径。项目列表是否全面按owner过滤属于兼容敏感点，先审查现有业务后明确处理，不能借新增门暗中改变所有项目共享语义。
- 门操作权限必须从后端验证；不能依赖页面隐藏。

## 5. Required验收
1. 从合法HTTP创建项目+门，随后GET与列表发现；浏览器创建/状态更新不是直接塞仓库记录。
2. 完全新服务实例同数据根恢复项目字段、owner、门、幂等与版本；多次重启ID不冲突；不存在的项目不能由孤儿ACL恢复。
3. invalid/duplicate门、owner绑定失败、磁盘写失败无可见半项目；模拟ACL成功但项目提交失败后不赋予项目访问。
4. 两身份跨项目读写拒绝；归档/回收/恢复语义、门CAS、门写与归档屏障竞争。
5. 不同数据根隔离、损坏JSON失败关闭、不自动丢弃或重置。黄金夹具与卫生全量通过，独立审核前不实施。

## 审核后冻结选择
执行 `docs/contracts/PROJECT-PERSISTENCE-GATES-CONTRACT.md`，替代正文中UUID提案：独立持久单调预留+持久确定性数据根namespace，失败不回收。门权限限owner+admin/governor，无通用grant；无权统一404；项目原角色共享行为不改；同态门PATCH不升版本；approved撤回仅治理且需说明。上述选择对应审核P1–P5，尚未实施。
