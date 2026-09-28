# Phase 12｜R1/R2/R4/R5/R6/R7/R8 修复独立复核

## 结论

**本轮修复有效，但还有2项Required，不能全项关闭。**R4/R5/R6及R8的本次指定行为可关闭；R1/R2在单根正常路径已修复，仍存在多根同名路径身份冲突；R7的真实进程重启问题已修复，但父子写入没有共同事务边界，单进程并发可新建孤儿。

本次不审仍在途的视频/PDF，不改变生产代码，仅新增此报告；不派子代理、不执行付费服务或真实CLI登录。

## 逐项状态与新证据

| 原项 | 状态 | 本次独立证据 |
|---|---|---|
| R1 本地素材重复ID | 单根修复通过，多根残余未关闭 | B4两个文件ID唯一、重复索引稳定、修改第二条不改第一条；历史重复ID先409再显式修复；独立双进程读回仍保持ID。多根缺陷见N1。 |
| R2 移动/删除后索引陈旧 | 单根修复通过；完整多根行为受N1影响 | B4移动后磁盘/GET一致且保留ID，删除后GET空、新app仍空；索引写失败补偿测试通过；独立新Python进程读回移动路径通过。 |
| R4 模板字段更新丢弃 | 已关闭本项 | B3 `test_directory_template_fields_survive_update_and_new_app`通过；独立双进程进一步确认name、folders、slot_mapping和version=2均落盘读回。未知字段400且不改变记录。 |
| R5 模板CAS及假版本 | 已关闭本项 | B3归档/default参数化测试通过：缺失/布尔/字符串版本400，999返回409且GET无变化；正确值操作后真实版本递增；默认切换同步递增被改变记录版本。 |
| R6 项目假恢复 | 已关闭“只记日志冒充恢复”缺陷 | B3真实项目创建→归档→回收→恢复；401/403/未知404/非法版本400/过期409；同一项目中心GET显示deleted_at、archived_at清空且version=4；重复恢复409。**项目中心仍是内存服务，本项通过不等于项目跨进程持久化验收。** |
| R7 提示词父树重启丢失/串库 | 重启修复通过，父子一致性未全关闭 | B8 `test_prompt_library_and_items_survive_real_process_restart_without_id_reuse`确实启动两个独立Python进程；旧父库/分类/条目读回，新库为plib_0002且无旧条目；孤儿遗留ID高水位迁移通过。并发残余见N2。 |
| R8 筛选/游标静默忽略及前端409 | 已关闭本次行为缺陷 | B3标签/排除标签/category/project/recent/sort及分页通过；无支持的root/collection显式400；cursor绑定过滤和revision，跨查询400、状态变化409。独立Node执行真实loadMore/refresh/apiJsonResponse函数，409后丢弃缓存和旧游标、重新请求第一页且不拼接旧页，忙态清零。 |

### 定向门禁

命令：

```powershell
python -m pytest tests/contracts/test_phase11_b3_asset_registry.py tests/contracts/test_phase11_b4_asset_library.py tests/contracts/test_phase11_b8_prompt_items.py tests/contracts/test_phase10c_prompt_library.py tests/contracts/test_projects_hub_service.py -k 'not pdf' -q --no-header -p no:cacheprovider
```

结果：**93 passed, 2 deselected，9.23秒**。
日志：`%TEMP%/gw-phase12-remediation-review-tests.txt`。

独立双进程（本地索引移动+目录模板）成功证据：`%TEMP%/gw-rereview-restart-jyj07nx0/evidence.json`。
前端真实函数隔离执行脚本/结果：`%TEMP%/gw-r8-frontend-independent.cjs`、`gw-r8-frontend-independent.txt`。结果PASS，依次请求旧offset2/cursor、offset0/空cursor，只有新列表被应用，未append。此证据是函数级VM执行，不冒充真实浏览器截图验收。

## N1 🔴 P1 Required｜多允许根的相同相对路径仍会复用身份并覆盖索引

位置：
- `src/gods_workbench/asset_library/repository.py:589-611`，关键 **598-599**：以 `relative_display(path)` 做唯一key并直接复用旧entry。
- `src/gods_workbench/core/storage.py:94-101`：不同允许根均只保留相对路径。
- 移动同样使用无根身份的source_key/target_key（`asset_library/repository.py:389-390`）。

**独立复现**：允许根A、B各有一个same.png（大小10和22字节）。先后索引均返回`local_0001`；第二次把第一条大小改成22；最终GET只含1条且data_gaps为空，而磁盘实际2个文件。复现没有删除用户文件，两个文件均在临时目录。

这不是要求新增产品能力：`GW_ALLOWED_ROOTS`本身接受多个根；修复只增加ID高水位不能消除“同一路径key等于同一对象”的错误假设。移动/删除也必须不能影响另一个根的同名索引。

**最小建议**：内部身份使用允许根身份+相对路径，展示串仍不泄露原始绝对路径；若本轮不扩内部路径模型，至少在覆盖/文件副作用之前检测跨根歧义并409失败关闭，不能静默认作同一对象。补两个根同名文件、按ID修改、移动/删除一方后另一方读回不变与重启测试。

证据：`%TEMP%/gw-r1-multiroot-juun1tlv/evidence.json`，摘要`%TEMP%/gw-r1-multiroot-review.txt`。

## N2 🔴 P1 Required｜父库删除与条目创建的校验/提交不是同一原子边界

位置：
- `src/gods_workbench/prompt_library/items_repository.py:121-156`，**131**先校验父引用，稍后才进入条目namespace的mutate。
- `src/gods_workbench/prompt_library/service.py:270-293`，**280-281**读取条目判断空库后，再单独删除父库并写tree namespace。
- 同型风险：分类删除 `service.py:352-373` 与条目创建/更新引用校验。

**独立确定性并发复现**（生产服务函数、两线程、事件控制交错，不是多worker）：
1. 条目创建通过 `_validate_parent_refs(plib_0001)`，在提交前暂停。
2. 父库删除看到条目集合为空，成功删除并持久化；目录为空。
3. 条目创建继续，成功落盘到已不存在的plib_0001。
4. GET得到新孤儿条目，data_gaps含LIBRARY_NOT_FOUND，两项写调用均返回成功。

父服务自己的`self._lock`与两个不同JsonState命名空间锁，不能保护跨父子关系。外层是单进程API时，父库同步路由线程池和条目路由也仍可交错；本次证据明确是底层生产函数并发复现，不宣称跑了并发HTTP压测。

**最小建议**：父库/分类删除与条目创建/改分类共享同一域锁/事务边界，锁顺序固定，覆盖“验证父存在/确认无子项→落盘提交”整个区间。原单实例设计无需引入分布式锁。补确定性竞争测试：只能“创建先赢、删除409”或“删除先赢、创建404”；不能双方成功或死锁。

证据脚本：`%TEMP%/gw-r7-independent-review.py`。
实际结果：`%TEMP%/gw-r7-independent-lp0g8yjk/race-evidence.json`，摘要`%TEMP%/gw-r7-independent-review.txt`。

## 下一步

先处理N1/N2并跑对应回归，再重新提交本项复核；既有93通过不覆盖这两个缺陷。PDF/视频及最终全树、九页浏览器仍由后续稳定工作树验收，本报告不提前给全阶段完成或生产发布结论。
