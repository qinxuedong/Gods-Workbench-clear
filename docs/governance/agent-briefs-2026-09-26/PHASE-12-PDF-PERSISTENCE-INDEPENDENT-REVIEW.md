# Phase 12｜PDF与持久化残余项独立实现复核

## 结论

- **R3/R9 PDF：按已审核的分页、中文/转义及原文附件边界通过；本轮未发现Required。**
- **N2 父子并发：通过，可关闭本项；仅单进程承诺，不扩为多worker一致性。**
- **N1 多根同名身份：索引/移动/删除直接路径修复通过，但上传入口仍先覆盖文件再返回409，Required未关闭。**
- 另按主代理补充问题裁定：project_gate/workspace_job无生产创建来源、outbox无真实投递属于未完成范围/真实语义缺口，不能用仓库函数造数据的200测试替代端到端验收，见末节。

本报告不审在途视频，不把全量765/7/5或Phase8在途失败作为最终验收；未改生产代码、未派子代理、未登录CLI/调用付费服务。

## 一、本次新运行证据

```powershell
python -m pytest tests/contracts/test_phase12_pdf.py tests/contracts/test_phase11_b4_asset_library.py tests/contracts/test_phase11_b8_prompt_items.py tests/contracts/test_phase10c_prompt_library.py -q --no-header -p no:cacheprovider
```

**83 passed，8.86秒**，日志：`%TEMP%/gw-review-pdf-n1n2-tests.txt`。不是仅引用实施负责人68通过或主代理14通过。

## 二、PDF：规范轴与需求轴

### 规范轴：通过本次边界

- `core/text_pdf.py`仅使用标准库，自研PDF对象/流/xref；不引入运行依赖/字体二进制。
- STSong-Light、UniGB-UTF16-H与ToUnicode；实际正文限制为ASCII/GB2312印刷字符，其余使用明确Unicode转义；固定DW=1000对应每字符11点、每行45字符，避免中英混排使用错误半宽。
- 转义后按物理行分页42行/页，A4纵向；1MiB源字节、180000显示字符、100页、映射数上限显式拒绝，不截断；孤立代理字符400。
- source.txt保存转换前UTF-8字节；Names/EmbeddedFiles/Filespec/EF链可由独立解析器抽取。没有JS/Launch/OpenAction。

### 需求轴：通过本次边界

- 本轮真实三HTTP面覆盖：注册表PDF 1/41/100项、去重计数、未知ID整批404、正文与交付中文、响应文件名、既有权限边界。
- 注册表与正文不再截40行；注册表原坐标白页缺陷消失。中文可见，Emoji/罕见字显示为明确转义，不冒称具有这些字形。
- 额外独立常量oracle复核0/1/42/43/100行分页，不调用生产 `_physical_lines`当预期值；附件字节、文字顺序与页数均通过。

### 目视与当前文件绑定

已逐张目视主代理留存的**六张Chrome原生阅读器截图**：registry第1/3页、content第1/3页、delivery第1/2页。中文与末项可读，未见白页、越界裁切或重叠；正文尾部Unicode转义可见。英文采用全宽网格导致字距疏，不是数据丢失，可作为非阻塞美观改进。

截图目录：`%TEMP%/gw-phase12-pdf-verified-urc5lr62`。本轮没有重新启动Chrome，明确复用了提供的截图，不假称独立新浏览器轮。

但已重新读取三份PDF，并确认：

1. SHA256与原证据manifest相同；当前生成器SHA256也是 `650fb76a3c9ffbae2a743c5a7ca39c0e35241ad563b2fee5a2b774151d251725`。
2. 抽出source.txt后用当前生成器重新生成，三份PDF均**逐字节一致**，将截图对应产物绑定到当前生成器。
3. 独立PyMuPDF重新解析/渲染全部8页：registry3、content3、delivery2。所有文字bbox在安全边界内，各页非白；附件hash与manifest一致。

独立机器可读结果：`%TEMP%/gw-pdf-independent-review.json`。

**保留边界**：非嵌入字体未证明任意阅读器相同；PyMuPDF仅验收依赖，不能把未来环境importorskip视为通过；共享生成器输入上限及转义格式是本轮承诺，不等于高级排版/字体子集支持。

## 三、N2：父子引用原子边界已修复

位置：`prompt_library/coordination.py`共享RLock；`items_repository.py:155-157,196-197`；`service.py:273,355`等统一“域锁→对象锁/namespace锁”的顺序。

- 新专项竞争测试覆盖创建条目vs删父库、改分类vs删分类，既有真实双进程父树/条目恢复测试仍通过。
- 本轮另用**未替换的真实域锁**独立复现：创建通过父校验后暂停；另一线程非阻塞取得域锁失败；删除线程进入等待；释放创建后，创建成功而删除409 LIBRARY_NOT_EMPTY，最终父子完整且无data_gaps、无死锁。
- 结果：`%TEMP%/gw-n2-locked-review-wrtcvvji/evidence.json`。

规范轴符合单进程一致性；需求轴解决此前双方成功产生新孤儿的复现，因此关闭N2。不据此承诺进程崩溃/多worker分布式事务。

## 四、N1仍有Required：上传先写文件后检测跨根冲突

### 已通过部分

`asset_library/repository.py:477-522`增加内部根身份摘要，公开响应不暴露；索引第二根同名路径、从错误根移动/删除均409且无副作用，原根移动后第二根才能登记；专项测试通过。该失败关闭取舍已明确，不要求本轮升级为允许同时登记同相对路径的多根完整模型。

### 🔴 P1 未关闭

位置：`api/routes_local_assets.py:61-63`，`asset_library/repository.py:280-293`。

上传路由顺序仍是 `save_upload()` 写真实目标文件，再 `index_local_files()` 检测根身份冲突。当前真实HTTP独立复现：

- 根A/same.png已登记，根B/same.png原字节为root-B-original；
- POST上传根B的新内容，返回 **409 LOCAL_ASSET_PATH_AMBIGUOUS**；
- 根B文件已变成 **overwritten-despite-409**，索引仍只有A且未变化。

这违反“检测跨根歧义先拒绝、无副作用”，会丢失已有文件内容。不是未配置外部服务，不能用三个仓库函数测试通过掩盖。

**最小建议**：上传写入前也做同一根身份/冲突预检，且索引提交失败有明确文件补偿或部分失败语义；在索引与文件副作用之间保持一致锁/序列边界，避免预检后另一个同名登记插入。补真实HTTP测试（已存在目标的原字节/hash必须不变）以及新目标不能留下未登记文件；不要仅修改错误码。

证据：`%TEMP%/gw-n1-upload-review-r5qlvv1s/evidence.json`，日志`%TEMP%/gw-n1-upload-review.txt`。全部临时文件，未触碰真实用户素材。

## 五、附加范围裁定：gate / workspace_job / audit_outbox

源码定位：`asset_registry/repository.py:712` create_project_gate、`:1158` create_workspace_job，在当前生产源码搜索仅见定义，无调用；`:821-831` reconcile仅把pending改replayed，没有实际sink调用。冻结ASSET-REGISTRY catalog的reconcile响应却要求“真实重放pending outbox”。

### Required最低要求

1. **不得以人工造仓库记录宣称业务闭环。**这样的fixture可以验证GET/PATCH/状态机分支，必须标为组件测试；它不证明用户实际能够产生gate/job或任务执行。
2. **gate/job先补最小来源契约。**冻结“哪个既有业务操作创建记录、稳定ID如何回传/发现、对象归属、权限、状态变更与真实任务效果”。优先复用已有项目/索引/媒体生产入口；未有冻结依据前不凭审核意见自行新增通用POST或虚构默认gate。当前无来源时继续登记未完成，或明确失败关闭；不能把它视为无凭据限制。
3. **outbox必须先修虚假replayed。**只有真实受准入sink明确接收并可读回后才能标replayed；需要事件幂等ID、投递失败保留pending/failed、重试不重复副作用。若当前没有sink/生产者，最小安全修复是拒绝重放/如实报告未接入并保留条目，不能通过直接变状态“补成功测试”。配置sink与业务接线仍是后续Required，不自动被审查豁免。
4. 范围缩减只能明确提出并获用户批准。现有“除画布外全部真实接入”的目标包含这些已列端点；审核不能把缺生产者静默排除。工作区任务的取消/重试若没有实际执行者，也只能称记录状态变化，不能称取消/重跑任务成功。

上述裁定不要求新建大型消息总线/任务平台；要求的是证据与声明相符，并补冻结的最小真实生产链。
