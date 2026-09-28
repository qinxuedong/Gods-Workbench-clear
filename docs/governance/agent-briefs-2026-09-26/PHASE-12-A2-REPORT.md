# Phase 12 块 A2｜实施报告

- 日期：2026-09-26
- 负责人：主代理（本会话未注册协作/子代理工具，无法派发子代理，见文末说明）
- 契约版本：`p11-b3-cleanroom-1` → `p12-a2-1`

## 1. 逐条接入结果

范围：素材注册表 45 条原 `ASSET_REGISTRY_NOT_INTEGRATED` 操作（不含本轮排除的画布域）。

| 组 | 条数 | 旧行为 | 新行为 | 数据来源 | 测试用例 |
|---|---|---|---|---|---|
| 资产 CRUD | 5 | 503 | 真实落盘；稳定 `ast_0001`；删除移入回收站 | `JsonState(asset_registry)` | import/update/delete roundtrip、stable ids |
| 标签/关系/引用 | 7 | 503 | 真实落盘；未登记 404 | 同上 | tags/relations/reference |
| 图片版本 | 5 | 503 | 真实落盘（含 `edit`/`canvas_id`/`hidden`） | 同上 + `GW_ALLOWED_ROOTS` | image versions lifecycle |
| 预设/目录模板 | 7 | 503 | 真实落盘；`id` 别名与前端对齐 | 同上 | folders/presets/templates |
| 项目实体/门/关联 | 5 | 503 | 真实落盘；未登记 asset 不静默跳过 | 同上 | entities/gates/linking |
| 治理 | 8 | 503 | 回收/归档真实恢复；画布域只记操作条目 | 同上 | governance boundaries |
| 索引 | 2 | 503 | 真实 `rglob` 遍历允许根目录 | `GW_ALLOWED_ROOTS` | index scans allowed roots |
| 配置 | 3 | 503 | 真实落盘偏好/开关/自动化 | `JsonState` | preferences/features/automation |
| 远程素材 | 3 | 503 | httpx 真实 HEAD；失败标 `degraded` | 网络 + `JsonState` | 契约登记（离线环境不联网断言） |
| 工作区任务 | 1 | 503 | 真实状态切换；未登记 404 | `JsonState` | governance boundaries |
| 导出 | 2 | 503 | 纯标准库 PDF / 真实 zip | 内存 + 允许根目录 | pdf real bytes、archive fail-closed |

缺失的 `GET .../media`、`.../image-versions/{id}/media`、`video/frame`、`video/storyboard`、
`POST .../video/clip` 已改为真实文件/ffmpeg 路径；依赖缺失仍 503（`MEDIA_NOT_AVAILABLE` /
`MEDIA_PROCESS_FAILED`），保留失败关闭用例。

## 2. 真实数据源证据

- 落盘位置：`core.storage.JsonState("asset_registry")`，默认 `%LOCALAPPDATA%/GodsWorkbenchClear/data/asset_registry.json`。
- 重启可恢复：`test_a2_state_survives_restart_within_same_data_dir` 用同一 `GW_DATA_DIR` 新建 app 读回。
- 复算命令：`python -m pytest tests/contracts/test_phase11_b3_asset_registry.py -q`
- 稳定 ID 由 `core.storage.next_sequence()` 生成，且改为**同时参考目标集合已有键**，修掉跨集合 0001 冲突（tag/folder/preset/template/entity/version/recycle/remote/job）。

## 3. 失败关闭证据

| 场景 | 响应 |
|---|---|
| 未认证读/写 | 401（先于参数校验） |
| readonly 角色写 | 403 `FORBIDDEN` |
| 未配置 `GW_ALLOWED_ROOTS` 访问本机文件 | 403 `LOCAL_FILE_ACCESS_NOT_ADMITTED`，不回显原始路径 |
| 路径越界 | 403 `PATH_OUTSIDE_ALLOWED_ROOTS`，不回显原始路径 |
| 无媒体文件 | 503 `MEDIA_NOT_AVAILABLE` |
| ffmpeg/ffprobe 缺失或失败 | 503 `MEDIA_PROCESS_FAILED` |
| 未配置允许根目录执行索引 | 503 `INDEX_SOURCE_NOT_AVAILABLE` |
| 打包下载但无可打包文件 | 503 `NO_LOCAL_FILES`（不返回空假包） |
| 非本机 http / 内网地址远程素材 | 403 `URL_NOT_ALLOWED` |
| `expected_version` 不一致 | 409 `VERSION_CONFLICT` + `expected_version`/`current_version` |

## 4. 本块测试结果

```
python -m pytest tests/contracts/test_phase11_b3_asset_registry.py -q
..................                                                       [100%]
18 passed in 0.87s
```

全量：

```
python -m pytest -q
575 passed, 7 skipped in 64.76s
```

## 5. 未闭环项与不确定项

1. **多实例一致性未闭环**：JSON 落盘只保证单进程/单实例一致性；多 worker 并发写属部署方职责。
2. **画布/项目闭环未实现**：`canvases/{id}/restore`、`purge-expired`、`project-recycle/{id}/restore` 只登记真实操作条目并返回 `data_gaps=canvas_store_not_connected` / `project_store_not_connected`，不伪造画布或项目状态。
3. **`open-local` 不启动外部程序**：只做路径准入校验并返回 `opened=false`，这是刻意取舍（避免洁净室引入 shell/进程启动面）；如需真正唤起文件管理器需单独评审。
4. **目录模板 `version` 语义**：当前用请求的 `expected_version` 或 1 回填对外视图，模板内部未维护独立自增 version（仅全局 revision）。前端仅用于展示，未做 CAS 断言；如需模板级 CAS 需另开契约修订。
5. **远程素材探测需联网**：测试只断言 URL 防护与 404/403 分支，未在网络受限环境断言真实 HEAD 成功分支。
6. **`GET /assets` 的 `cursor`/`sort`/`view`/`tag`/`category` 暂未参与过滤**：仅 `query/search`、`limit`、`offset`、`kind`、`archived` 生效；前端当前只依赖这些，其余参数原样接受不报错。

## 6. 需要主代理处理的共享文件改动

- 已由主代理直接改（无子代理）：`docs/contracts/ASSET-REGISTRY-INTERFACE-CATALOG.yaml`。
- 未改 `app.py`、`core/*`、`test_phase8_frontend_backend_api_gap.py`、`tests/hygiene/*`。

## 附：本会话无法派发子代理的说明

用户要求「子代理并行最多 4 个、deepseek-v4.1 max，审核用 GPT-6-Astra high」，但本会话工具集中
**未注册** `spawn_agent` / `send_message` / `wait_agent` / `create_thread`，`request_user_input` 在
Default 模式下亦不可用。因此本块由主代理串行亲自实施，未产生任何子代理产物；审核材料见
`docs/governance/agent-briefs-2026-09-26/PHASE-12-AUDIT-BRIEF.md`（待补），供具备对应模型的
独立审核代理复算。
