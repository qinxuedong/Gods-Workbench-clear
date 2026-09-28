# Phase 12 产物隔离、缓存、N1及Registry最小生产链独立审核

## 一、结论先行

- OUTPUT内部状态隔离：本次审核范围内通过，无新增Required。
- 媒体缓存M1/M2：通过；精确删除专用分镜、保留旧混用帧的语义正确。
- N1上传409覆盖：已修复，可关闭原问题；补偿与同进程共享域锁通过。
- Registry方案A（项目门）：暂不通过直接实施，须先冻结下述项目真源/权限/生命周期前置方案。
- Registry方案B（索引任务）、C（本地审计收据sink）：有条件通过，纳入第五节Required后实施。设计通过不是实现验收。
- 本地账号浏览器启动修复：本次真实Chrome测试及两项定向测试通过，不据此追认全部历史故障同因。

本轮只新增本报告；没有改生产代码、提交、清理共享工作树、读取旧仓或进行收费Provider/真实CLI账号调用。未采纳他人的全量805 passed/8 skipped作为本轮最终证明。

## 二、独立执行证据

1. 独立执行：
   `python -m pytest tests/contracts/test_phase12_output_boundary.py tests/contracts/test_phase11_b4_asset_library.py tests/contracts/test_phase12_success_paths.py -q --no-header -p no:cacheprovider`
   **56 passed，1 skipped，10.74秒**。
   日志：`%TEMP%/gw-independent-output-n1-review-tests.txt`。
2. OUTPUT单独重跑带跳过原因：**26 passed，1 skipped，2.82秒**。
   文件symlink用例因Windows创建权限1314跳过；不是通过。真实Junction的命名空间根、嵌套、同命名空间别名、异资产分镜目录四种情形均实际运行通过。
   日志：`%TEMP%/gw-independent-output-boundary-skip.txt`。
3. `python -m pytest tests/smoke/test_local_account_browser.py -q --no-header -p no:cacheprovider`
   **3 passed，7.28秒**，包括本轮真实Chrome启动、注册登录、应用进程重启保留会话、退出登录；另含拒绝TCP自身端口及启动失败回收自有进程。
   日志：`%TEMP%/gw-independent-local-browser-review-tests.txt`。
4. 审核者额外脚本（生产域锁未替换）：`%TEMP%/gw-independent-n1-output-review.py`。
   成功证据：`%TEMP%/gw-independent-n1-output-6bwt8kv4/evidence.json`。
   - A同名已登记、B目标尚不存在：真实HTTP409；B不留文件或临时文件。
   - 同根正常覆盖上传：HTTP201；文件SHA256与索引大小13字节相符。
   - 合法local_assets目录内JSON附件仍HTTP200，且attachment下载，不按后缀误封用户附件。
   - 上传暂停在暂存写入前；主线程无法非阻塞取得真实域锁；竞争索引线程被阻塞，上传结束后竞争索引报跨根409；无死锁。
5. 源码快照SHA256：`%TEMP%/gw-independent-output-n1-source-hashes.json`。共享目录仍有其他实施在途，以上不是不可变提交或最终CI证据。

注：额外脚本最初因TEMP内同名re模块污染导入失败，已用Python隔离模式`-I`重新运行；首版误把上传成功码预期为200，按已有路由201修正后通过。没有为通过修改生产代码。

## 三、OUTPUT与媒体缓存验收

### OUTPUT

- `core/storage.py:109-184`用四个精确目录作为统一边界；拒绝绝对/UNC/ADS/穿越/前缀近似/保留设备名/尾点等路径。
- 从数据根逐个检查原始组件的lstat及重解析属性，包含四目录自身；不是把resolve后的链接目标重新定义为白名单根。
- `media/repository.py:348`显式path与asset_id候选都使用同一产物准入；`api/routes_media.py`读响应前再次检查。
- `asset_library/repository.py:863,879`列表不进入非法链接；批量删除先全量预检，混合内部状态请求零删除；执行期失败准确报告partial，删除计数只算实际删除。
- 临时内部JSON、模拟团队数据库文件名、video专用ACL目录均403且不列出；没有访问真实数据库。
- 四命名空间正向读/删/删除后404、匿名401、readonly写403及磁盘部分失败通过。

范围：这是通用内部状态隔离，不是四个合法产物目录的完整项目/租户ACL审计，也不是防御本机恶意进程在检查与打开之间换路径的无竞态文件系统沙箱。视频必须继续使用专用ACL入口。

### M1/M2

- `asset_registry/media_probe.py:88,95`统一专用目录和生成文件命名；`media/repository.py:524`精确ID、全批预检后删除。
- asset_1不匹配asset_10；同资产独立单帧、clip和不匹配帧名保留。目录自身/子链接不能借别名删除其他资产。
- 真实FFmpeg生成源视频，经注册表真实来源生成分镜、HTTP下载并逐字节匹配磁盘、删除后HTTP404；同资产单帧和clip仍存在，再次删除返回0。
- 部分I/O失败返回partial及真实removed；`legacy_shared_frames_preserved`明确保留旧布局，不声称历史缓存全清。

范围：不宣称匿名同名跨根媒体缓存碰撞已解决，也不把旧混用帧推断归属后删除。

## 四、N1上传补偿复核

`api/routes_local_assets.py:62`已改为`upload_and_index_local_asset`，不再先裸save_upload再索引。
`asset_library/repository.py:329`在同一真实域锁内完成根身份冲突预检、暂存/替换、索引提交和失败补偿。

- 既有B文件冲突HTTP409，原SHA256不变，索引保持A。
- 索引提交故障注入：已有文件原字节恢复；新建文件移除；暂存文件不残留，返回标准500而不是成功。
- 域锁与索引/移动/删除共用，覆盖预检至提交窗口；审核者额外测试没有用自定义锁替换真实锁。
- 补偿自身失败有明确`LOCAL_ASSET_UPLOAD_PARTIAL_FAILURE`分支，不谎称已回滚。

本结论关闭此前“409但文件已经覆盖”的P1；不宣称进程崩溃时跨文件与JSON的ACID事务、多worker共享锁或所有磁盘故障均已穷举。

## 五、Registry最小生产链方案裁定

依据：`PHASE-12-REGISTRY-LIFECYCLE-DESIGN.md`。本节为设计审核，不豁免全量真实接入目标，也不批准超出已确认范围的大规模架构更改。

### A：项目门暂不通过直接实施

当前事实：`projects_hub/service.py:32`项目仍为内存`_projects`；`create_project`只在内存发布项目。视频store的`video_projects`记录是owner授权绑定，不含完整项目版本、归档/回收状态，不能替代项目真源。`asset_registry/repository.py:712,724`目前门仅有pending初始字符串，更新允许任意字符串且校验全局revision，不是门版本。

以下先决条件需先冻结契约并提请确认：

**A1｜项目真源必须可恢复。**优先先提出并审核最小项目持久化方案，保存真实project_id、版本、生命周期及稳定主体归属，重启不复用ID、不用测试种子覆盖真实项目。不能仅凭视频owner表或门里复制的名称判定项目存在。若暂时保留内存真源，重启后的孤儿门必须失败关闭，但此时A仍未完成，不能转成验收通过。

**A2｜权限来源与读写边界。**门的project_id创建后不可客户端改绑；GET/项目详情/快照发现及PATCH均按可信主体和真实项目归属过滤。editor角色不是所有项目的成员授权；需明确采用owner-only还是项目成员模型、admin是否有治理特权，不能把客户端角色头当生产主体。跨项目未知/无权响应保持一致，不泄露门内容。

**A3｜项目生命周期联动。**归档项目只读，回收站项目不得写门；恢复后保留原gate_id与版本，是否恢复原门状态须明文冻结。不存在项目拒绝。校验项目活跃状态与门落盘必须处于一致串行边界，避免门检查通过后项目被归档仍写成功；锁顺序固定并测并发。若未来永久删除另有契约，再明确级联/墓碑；本方案不能擅自新增永久删除功能。

**A4｜门状态与版本。**冻结pending/approved/changes_requested状态及合法转换（是否允许approved撤回、谁有权限、是否必须说明），不能只校验枚举。门独立version+expected_version，缺失拒绝、陈旧409；note更新同样CAS。项目版本与门版本各自职责写清，不使用素材全局revision冒充。现有前端仅找到通用PATCH包装，尚无足以替代状态契约的实际门UI枚举证据。

**A5｜创建一致性与发现。**项目、owner、初始gates跨存储写入必须说明失败补偿及进程崩溃恢复策略；尤其不能只在第二步失败后补偿门却留下可见项目/错误ACL。门code在同项目唯一、code/name长度/空值/规范化/最大数组规模先验证；无gates保持旧创建行为。真实HTTP创建后返回或可发现gate_id，重启后同ID、权限、版本与生命周期读回一致。不要新增随意默认门来制造生产来源。

### B：索引工作区任务有条件通过

复用现有索引生产入口、显式background=true、独立任务存储和有界执行器方向正确，纳入以下Required：

- **B1权限/准入持续有效。**排队记录稳定主体，GET及动作均隔离；不能只在提交时鉴权。根配置指纹变化或权限撤销后resume/retry/提交要失败关闭。恢复时不接受请求体重绑主体或根。
- **B2提交原子且不丢并发写。**扫描期间其他素材编辑/索引可能改变注册表。提交时用锁内版本校验或经冻结的安全合并规则，不能拿旧扫描快照覆盖新资产/标签。取消、暂停、提交竞争必须有明确线性化点；已提交就如实返回成功/不可取消，不能状态cancelled但索引已经更新。
- **B3动作真实且有边界。**暂停到安全检查点才报paused；resume继续；retry复用稳定job_id但增加attempt。重复动作、队列已满、工作线程异常、重启interrupted与扫描规模/错误上限要有定义及测试，不能仅改字符串。后台模式之外旧同步响应保持兼容。

### C：本地审计收据sink有条件通过

独立本地持久收据可作为本次最小真实sink，不必构建外部消息总线，纳入以下Required：

- **C1事件不可变。**删除/恢复真实治理操作与pending事件在同一registry事务落盘；稳定event_id、事件schema版本、有限脱敏主体和确定性内容摘要。重试不能重造event_id/时间/正文；无效或失败的源操作不产生伪成功事件。
- **C2ACK真实性。**sink写入后按event_id及摘要实际读回才ACK；同ID不同内容拒绝。ACK成功但源状态提交失败可安全重投；sink失败或读回失败保留pending/failed，不能标replayed。并发reconcile也不重复实际收据。
- **C3收据权限与边界。**overview需治理权限和有界分页/条数，不泄露主体凭据/请求内容；收据文件仍在内部状态区，不能放入四个公共产物命名空间。只宣称本机持久化审计，不宣称外部投递、签名或防管理员篡改。

### 最低验收与范围

A：真实HTTP创建项目带用户给定门→发现ID→状态/CAS→归档拒写→恢复→全进程重启及权限复查。
B：真实HTTP索引任务→真实索引效果→暂停/取消/冲突/失败重试→重启中断恢复口径。
C：真实删除/恢复→真实pending→真实sink收据→ACK后replayed→故障与重复投递不重复。

人工直接调repo造门、任务或事件只用于组件/故障测试，不能冒充生产来源。未通过项目真源前置条件不应开工硬补A；B/C可在Required落实并完成契约冻结后独立实施。任何排除范围仍需用户明确批准。
