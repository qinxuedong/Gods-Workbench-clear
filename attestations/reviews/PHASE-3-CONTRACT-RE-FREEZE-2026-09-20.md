# Phase 3 契约冻结重签记录（2026-09-20）

## 判定

**重签取证已记录，冻结不予批准（GATE REOPENED / BLOCKED）。** 输入哈希一致不等于契约满足根规约，更不等于来源、许可和发布授权完成。契约与夹具的 `review_status` 仍为 `user_directed_remediation_input_pending_independent_release_review`，本文件不擅自修改该状态。

- HEAD：`cde7433cd24e297ceeabd248365908a8da006813`；分支：`master`。
- 主采集窗口：`2026-09-20T17:59:44.059049+08:00` 至 `2026-09-20T17:59:47.407024+08:00`（UTC+08:00）。补充取证：`2026-09-20T18:01:47.575761+08:00` 至 `2026-09-20T18:01:47.731424+08:00`。
- 绑定的是上述 HEAD **加当时的未提交/未跟踪工作树**，不是干净提交。工作树由其他任务并行修改，不是原子快照；不得把本报告推广为后续文件版本的验收。
- 只读审计当前洁净仓；没有读取旧仓源码/提交历史。未修改契约、夹具、业务实现或门禁状态。

## 逐项核验

| 项目 | 真实命令 / 证据节 | 输出摘要 | 结论 |
|---|---|---|---|
| 契约 | `python audit.py routes`（实际绝对路径命令见附录） | 两份目录提取出 14 组 method/path，均找到源码装饰器；源码共 18 条，另有 `/`、`/healthz`、画布拓扑 GET 和 job GET | 路径覆盖成立，不等于请求/响应和授权全部一致；只按文本提取 YAML 字段，未执行 YAML 解析器 |
| 黄金夹具 | 同上；`python supplement.py` | 清单 9 个夹具均可被 JSON 解析；4 个错误夹具具有 detail/code/message；202 夹具有 job_id/state/poll_hint | 静态结构 PASS；Pydantic/HTTP 验证未通过执行门禁 |
| 夹具自动化门禁 | `python -m pytest tests/contracts/test_golden_fixtures.py -v` | `No module named pytest` | BLOCKED，未收集或执行用例，不填写通过数 |
| 16 项输入哈希 | `python audit.py hashes` | 16 项匹配，0 项不匹配，逐项原始输出附后 | PASS；哈希证明字节一致，不证明来源合法或已被冻结 |
| 边界 | `python -m pytest tests/contracts/test_remediation_boundaries.py -v`；源码摘录见 supplement | pytest 缺失；导入拓扑允许缺省 expected_version；读接口仅对特定 invalid 字符串拒绝 | 动态门禁 BLOCKED；发现静态规约差异，须修正/裁决后复核 |
| 错误/异步语义 | `python supplement.py`；`python audit.py probes` | 错误夹具结构匹配；任务路由声明 202，但契约允许 200、poll_hint 可选；动态探针在导入 fastapi 时失败 | 静态部分匹配，整体不能签 PASS |
| 插件协议排除 | `python audit.py scan` | 对 src 下 .py/.html/.js/.css/.json 搜索 PluginProtocol、plugin_connector、PLUGIN-PROTOCOL-SPEC，0 命中 | 有限静态扫描 PASS；不构成无隐式实现的形式化证明 |
| 洁净卫生自动化门禁 | `python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q` | `No module named pytest` | BLOCKED，不得声称 6 个卫生测试通过 |
| T-scope 依赖 | `python audit.py snap` / `scan` | 主采集窗口 T-scope 报告和静态注册表均不存在；删除路径残留引用 2 处，卫生规则仍放行 comfyui/runninghub 标记 | 依赖未验收，不能关闭 Phase 3 |

## 不予冻结的具体原因

1. **P1 — 拓扑写入 CAS 约束不一致。** `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:111` 将工作流导入的 expected_version 标为可选；`src/gods_workbench/api/routes_god_canvas.py:133` 默认为 None，服务层只在版本非 None 时检查（具体行见 supplement）。导入会改变拓扑，不能仅凭 PATCH 必填就宣称符合 AGENTS.md §3.2。恢复接口也为可选版本，需明确其适用规则。
2. **P1 — 智能任务契约比根规约宽。** 画布目录第 162、170–176 行允许 200 completed，202 的 poll_hint 可选，与 AGENTS.md §3.3 的“必须 202 + job_id + poll_hint”不一致。当前路由第 179 行声明 202 不能消除契约文本矛盾。
3. **P1 — 验证环境与来源/身份门禁未闭环。** Python 3.11 进程启动被权限拒绝；可运行环境为 Python 3.12.14，缺少 pytest / fastapi。没有复制可执行文件绕过限制，也没有安装依赖或更改系统配置。契约/夹具仍待外审，不能由机器自证升级为冻结批准。
4. **P1 — 范围清理尚在进行。** 主窗口的 `src/gods_workbench/static/js/api-settings.js:1006,2233` 仍引用 `/static/runninghub/`。这是当时版本的发现，后续并行编辑可能改变行号/命中数；需要对 T-scope 最终输出复扫，不能用历史命中替代最终验收。
5. **P2 — 认证与错误包仅有局部证据。** 项目/画布 GET 的源码只显式拒绝 `authorization == "invalid"`；`core/auth.py` 是测试用 Bearer 格式/角色检查，不是外部 IdP。`app.py` 为 CleanroomException 和 RequestValidationError 提供错误包，但本次未验证所有原生 404/405 等错误都遵循该包装。不得宣称生产认证/所有异常响应一致。
6. **P2 — 目录覆盖存在增量。** 14 条契约之外的两个业务 GET（拓扑读取、job 查询）以及两个管理入口需在正式冻结前明确登记范围；job 查询与 poll_hint 的关系目前仅有源码/夹具证据。

## 签署与后续外审

- 签署人：**自动化 Codex 子代理会话身份**（本次 T-phase3 受托自动化执行者；没有可验证的自然人审计身份或第三方签名）。
- 签署日期：2026-09-20；绑定 HEAD 及工作树取证时点如上。
- 签署范围：确认本报告记录的命令、失败输出、哈希与静态观察；**不批准契约冻结，不签署分发或生产验收**。
- **机器自证 ≠ 独立第三方审计。** 后续必须由可验证身份的人工外审者复核来源、切片授权、许可、契约差异和测试证据；独立性不能由角色名称代替。
- 外审前置：T-scope 收口 → 对确定的内容快照重新取证 → 在可用 Python 3.11 环境复跑卫生/黄金夹具/全量 pytest → 修正或书面裁决上述差异 → 人工签署。禁止用本报告反向修改任何人的输出或阶段状态。
- 状态继续为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；开源字体白名单不等于公开分发授权。

## 证据附录

环境：采集器设置 `PYTHONDONTWRITEBYTECODE=1`、`PYTHONIOENCODING=utf-8`、`PYTEST_ADDOPTS=-p no:cacheprovider`，防止新增仓库缓存。脚本完整源码与复现方法见 T-phase3 报告；字体/静态扫描原文见当前快照审计。

### hygiene

- 命令：`python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q`
- 开始：2026-09-20T17:59:44.303106+08:00；结束：2026-09-20T17:59:44.323926+08:00
- 退出码：1

标准输出（完整）：
```text
（空）
```

标准错误（完整）：
```text
C:\Users\qinxuedong\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe: No module named pytest
```

### hashes

- 命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py hashes`
- 开始：2026-09-20T17:59:44.325429+08:00；结束：2026-09-20T17:59:44.375361+08:00
- 退出码：0

标准输出（完整）：
```text
PASS docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md 登记=f675864e0b7bb91d1817ecaf9dc643f96f41d090a90b57b3dfa752f358cf627f 实算=f675864e0b7bb91d1817ecaf9dc643f96f41d090a90b57b3dfa752f358cf627f
PASS docs/behavior/BEHAVIOR-SPEC-CANVAS.md 登记=e18d6d9151ed2b2d317a54f8a9af5cbb4e3818aa4f8163086bfc019f37b00188 实算=e18d6d9151ed2b2d317a54f8a9af5cbb4e3818aa4f8163086bfc019f37b00188
PASS docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md 登记=9c18704f9972e30054a8ec20d9671f65bbf4203083577f82f06fea04f345bf31 实算=9c18704f9972e30054a8ec20d9671f65bbf4203083577f82f06fea04f345bf31
PASS docs/behavior/PLUGIN-PROTOCOL-SPEC.md 登记=f474a6de79afd3812a2783c2da8d12b1314b66c9cb7e2a4ae5e3a42fdb0b6242 实算=f474a6de79afd3812a2783c2da8d12b1314b66c9cb7e2a4ae5e3a42fdb0b6242
PASS docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml 登记=1c7aa1a583bf6839525c1949666fb9ebf3cab5595735b9f518587341a1a81f3d 实算=1c7aa1a583bf6839525c1949666fb9ebf3cab5595735b9f518587341a1a81f3d
PASS docs/contracts/CANVAS-INTERFACE-CATALOG.yaml 登记=11d070809a171bea44c03131bf32e83d99d1451a9ef5b773391b0d2d75dd5b33 实算=11d070809a171bea44c03131bf32e83d99d1451a9ef5b773391b0d2d75dd5b33
PASS docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json 登记=0ce79f2c17f6b6068cc5875e052bc9b3d5a43b5355446a5401ffae39663e3ead 实算=0ce79f2c17f6b6068cc5875e052bc9b3d5a43b5355446a5401ffae39663e3ead
PASS docs/fixtures/projects-hub-list-active.json 登记=c845069c4ba7d6b824e01d96a83f443980a847d185b7d768604e9d26ded6fb88 实算=c845069c4ba7d6b824e01d96a83f443980a847d185b7d768604e9d26ded6fb88
PASS docs/fixtures/projects-hub-create-request.json 登记=cc4e8df3b4ab5028549c1ec06263189be7d68b2fb4ee60552a7e2ea102f2bc6c 实算=cc4e8df3b4ab5028549c1ec06263189be7d68b2fb4ee60552a7e2ea102f2bc6c
PASS docs/fixtures/projects-hub-update-conflict-409.json 登记=1d758466523213aaa211e2a775ae70f920d1cc22cf059137f611a3266df18b88 实算=1d758466523213aaa211e2a775ae70f920d1cc22cf059137f611a3266df18b88
PASS docs/fixtures/canvas-workflow-minimal.json 登记=d8ea3db721bda2720eac7ba1e285e4840b54e2045fa9191d688bd08541502ad0 实算=d8ea3db721bda2720eac7ba1e285e4840b54e2045fa9191d688bd08541502ad0
PASS docs/fixtures/canvas-workflow-minimal.godmap 登记=6effafe14f6be864888e241189cd691c066ffb94e5527e11f36364199c91e0fe 实算=6effafe14f6be864888e241189cd691c066ffb94e5527e11f36364199c91e0fe
PASS docs/fixtures/canvas-save-conflict-409.json 登记=f0fe637d19e9d1ba3925ba00cda14615262889ee49509626eeb2752deb0921b4 实算=f0fe637d19e9d1ba3925ba00cda14615262889ee49509626eeb2752deb0921b4
PASS docs/fixtures/canvas-task-accepted-202.json 登记=b74b107e660b869a82509b5c5869654a588f6d037a73f229f3a53763bd614a8a 实算=b74b107e660b869a82509b5c5869654a588f6d037a73f229f3a53763bd614a8a
PASS docs/fixtures/canvas-auth-401.json 登记=2f276ffa89ee9251dfdff172bbb67ebb4150df25b1ee3f8c75772c4e19a2bbf7 实算=2f276ffa89ee9251dfdff172bbb67ebb4150df25b1ee3f8c75772c4e19a2bbf7
PASS docs/fixtures/canvas-forbidden-403.json 登记=d75071a9ccdee0b62eff2b2b9b2640f0281d976f5e20bc97215af7795fdaff9a 实算=d75071a9ccdee0b62eff2b2b9b2640f0281d976f5e20bc97215af7795fdaff9a
项目数: 16 匹配: 16 不匹配: 0
```

标准错误（完整）：
```text
（空）
```

### routes-contracts-fixtures

- 命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py routes`
- 开始：2026-09-20T17:59:44.376365+08:00；结束：2026-09-20T17:59:44.432420+08:00
- 退出码：0

标准输出（完整）：
```text
GET /healthz | src/gods_workbench/api/app.py:54 | health_check
GET / | src/gods_workbench/api/app.py:64 | index_redirect
GET /api/canvases | src/gods_workbench/api/routes_god_canvas.py:35 | list_canvases
POST /api/canvases | src/gods_workbench/api/routes_god_canvas.py:52 | create_canvas
GET /api/canvases/{canvas_id} | src/gods_workbench/api/routes_god_canvas.py:69 | get_canvas_topology
PATCH /api/canvases/{canvas_id} | src/gods_workbench/api/routes_god_canvas.py:85 | update_canvas_topology
POST /api/canvases/{canvas_id}/restore | src/gods_workbench/api/routes_god_canvas.py:103 | restore_canvas
POST /api/canvases/{canvas_id}/workflow/import | src/gods_workbench/api/routes_god_canvas.py:122 | import_canvas_workflow
POST /api/canvases/{canvas_id}/workflow/export | src/gods_workbench/api/routes_god_canvas.py:150 | export_canvas_workflow
POST /api/canvases/{canvas_id}/tasks | src/gods_workbench/api/routes_god_canvas.py:175 | run_smart_canvas_task
GET /api/jobs/{job_id} | src/gods_workbench/api/routes_god_canvas.py:196 | get_smart_job_status
GET /api/asset-registry/projects | src/gods_workbench/api/routes_projects.py:23 | list_projects
POST /api/asset-registry/projects | src/gods_workbench/api/routes_projects.py:41 | create_project
PATCH /api/asset-registry/projects/{project_id} | src/gods_workbench/api/routes_projects.py:58 | update_project
DELETE /api/asset-registry/projects/{project_id} | src/gods_workbench/api/routes_projects.py:76 | archive_project
POST /api/asset-registry/governance/projects/{project_id}/restore | src/gods_workbench/api/routes_projects.py:94 | unarchive_project
POST /api/asset-registry/projects/{project_id}/trash | src/gods_workbench/api/routes_projects.py:112 | move_project_to_trash
POST /api/asset-registry/projects/{project_id}/trash/restore | src/gods_workbench/api/routes_projects.py:130 | restore_project_from_trash
源文件装饰器路由总数: 18
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml {"review_status": "\"user_directed_remediation_input_pending_independent_release_review\"", "distribution": "\"NOT AUTHORIZED FOR PUBLIC DISTRIBUTION\""} （标准库按字段读取，不冒充 YAML 解析器验证）
契约 GET /api/canvases 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/canvases 有实现=True 状态=None 请求=None 查询=None
契约 PATCH /api/canvases/{canvas_id} 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/canvases/{canvas_id}/restore 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/canvases/{canvas_id}/workflow/import 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/canvases/{canvas_id}/workflow/export 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/canvases/{canvas_id}/tasks 有实现=True 状态=None 请求=None 查询=None
docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml {"review_status": "\"user_directed_remediation_input_pending_independent_release_review\"", "distribution": "\"NOT AUTHORIZED FOR PUBLIC DISTRIBUTION\""} （标准库按字段读取，不冒充 YAML 解析器验证）
契约 GET /api/asset-registry/projects 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/asset-registry/projects 有实现=True 状态=None 请求=None 查询=None
契约 PATCH /api/asset-registry/projects/{project_id} 有实现=True 状态=None 请求=None 查询=None
契约 DELETE /api/asset-registry/projects/{project_id} 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/asset-registry/governance/projects/{project_id}/restore 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/asset-registry/projects/{project_id}/trash 有实现=True 状态=None 请求=None 查询=None
契约 POST /api/asset-registry/projects/{project_id}/trash/restore 有实现=True 状态=None 请求=None 查询=None
契约端点数: 14 缺失: [] 实现增量: [('GET', '/'), ('GET', '/api/canvases/{canvas_id}'), ('GET', '/api/jobs/{job_id}'), ('GET', '/healthz')]
夹具元数据: {"version": "remediation-1", "source": "old-repo-readonly-research-main-31371df", "review_status": "user_directed_remediation_input_pending_independent_release_review", "distribution": "NOT AUTHORIZED FOR PUBLIC DISTRIBUTION"}
夹具可解析 projects-hub-list-active.json 顶层键=['projects']
夹具可解析 projects-hub-create-request.json 顶层键=['description', 'due_at', 'name', 'project_type', 'start_at']
夹具可解析 projects-hub-update-conflict-409.json 顶层键=['detail']
夹具可解析 canvas-workflow-minimal.json 顶层键=['canvas_id', 'connections', 'nodes', 'version']
夹具可解析 canvas-workflow-minimal.godmap 顶层键=['format', 'payload', 'version']
夹具可解析 canvas-save-conflict-409.json 顶层键=['detail']
夹具可解析 canvas-task-accepted-202.json 顶层键=['job_id', 'poll_hint', 'state']
夹具可解析 canvas-auth-401.json 顶层键=['detail']
夹具可解析 canvas-forbidden-403.json 顶层键=['detail']
清单夹具数: 9
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:22: response_200:
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:61: expected_version: integer
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:73: response_200:
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:87: expected_version: "integer | optional"
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:95: response_200:
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:111: expected_version: "integer | optional"
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:119: response_200:
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:145: response_200:
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:157: expected_version: "integer | optional"
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:170: response_200:
观察 docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:176: poll_hint: "string | optional"
观察 src/gods_workbench/api/routes_god_canvas.py:46: if authorization == "invalid":
观察 src/gods_workbench/api/routes_god_canvas.py:61: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_god_canvas.py:80: if authorization == "invalid":
观察 src/gods_workbench/api/routes_god_canvas.py:95: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_god_canvas.py:113: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_god_canvas.py:133: expected_version: Optional[int] = Query(None, description="期望 CAS 版本"),
观察 src/gods_workbench/api/routes_god_canvas.py:135: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_god_canvas.py:159: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_god_canvas.py:185: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_projects.py:35: if authorization == "invalid":
观察 src/gods_workbench/api/routes_projects.py:50: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_projects.py:68: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_projects.py:86: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_projects.py:104: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_projects.py:122: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/routes_projects.py:140: x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
观察 src/gods_workbench/api/app.py:60: "frozen_contracts": False,
观察 src/gods_workbench/api/app.py:61: "release_authorized": False,
观察 src/gods_workbench/core/auth.py:32: if not separator or scheme.lower() != "bearer" or not credential.strip():
观察 src/gods_workbench/core/auth.py:34: if credential.strip().lower() in {"invalid", "expired"}:
观察 tests/hygiene/test_cleanroom_hygiene.py:80: comfyui / runninghub 等业务标识，不再作为禁用标记（重定义前曾造成 130+ 处误报）。
```

标准错误（完整）：
```text
（空）
```

### golden-fixtures

- 命令：`python -m pytest tests/contracts/test_golden_fixtures.py -v`
- 开始：2026-09-20T17:59:44.432420+08:00；结束：2026-09-20T17:59:44.453112+08:00
- 退出码：1

标准输出（完整）：
```text
（空）
```

标准错误（完整）：
```text
C:\Users\qinxuedong\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe: No module named pytest
```

### boundaries

- 命令：`python -m pytest tests/contracts/test_remediation_boundaries.py -v`
- 开始：2026-09-20T17:59:44.453112+08:00；结束：2026-09-20T17:59:44.473750+08:00
- 退出码：1

标准输出（完整）：
```text
（空）
```

标准错误（完整）：
```text
C:\Users\qinxuedong\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe: No module named pytest
```

### runtime-probes

- 命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py probes`
- 开始：2026-09-20T17:59:47.115164+08:00；结束：2026-09-20T17:59:47.162193+08:00
- 退出码：1

标准输出（完整）：
```text
（空）
```

标准错误（完整）：
```text
Traceback (most recent call last):
  File "C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py", line 140, in <module>
    globals()[sys.argv[1]](); sys.exit()
    ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py", line 112, in probes
    from fastapi.testclient import TestClient
ModuleNotFoundError: No module named 'fastapi'
```

### supplement

- 命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\supplement.py`
- 开始：2026-09-20T18:01:47.575761+08:00；结束：2026-09-20T18:01:47.731424+08:00
- 退出码：0

标准输出（完整）：
```text
解释器: C:\Users\qinxuedong\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe
Python: 3.12.14 (main, Aug 25 2026, 14:01:42) [MSC v.1944 64 bit (AMD64)]
$ node --version
退出码: 0
v24.20.0
$ git --version
退出码: 0
git version 2.53.0.windows.2
$ C:\Users\qinxuedong\AppData\Local\Programs\Python\Python311\python.exe --version
进程未启动: PermissionError(13, '拒绝访问。', None, 5, None)
错误夹具结构 canvas-auth-401.json 预期=UNAUTHORIZED 满足=True {"detail": {"code": "UNAUTHORIZED", "message": "会话失效，请重新登录"}}
错误夹具结构 canvas-forbidden-403.json 预期=FORBIDDEN 满足=True {"detail": {"code": "FORBIDDEN", "message": "无当前项目写权限"}}
错误夹具结构 canvas-save-conflict-409.json 预期=CANVAS_VERSION_CONFLICT 满足=True {"detail": {"code": "CANVAS_VERSION_CONFLICT", "message": "画布版本冲突，请刷新后重试", "expected_version": 11, "current_version": 12, "canvas_id": "cv-0001"}}
错误夹具结构 projects-hub-update-conflict-409.json 预期=VERSION_CONFLICT 满足=True {"detail": {"code": "VERSION_CONFLICT", "message": "expected_version 与当前版本不一致", "expected_version": 5, "current_version": 6}}
异步夹具结构 PASS {"job_id": "job-0001", "state": "accepted", "poll_hint": "/api/jobs/job-0001"} （HTTP 状态码未动态测试）
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:153:   - name: run_smart_canvas_task
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:154:     method: POST
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:155:     path: /api/canvases/{canvas_id}/tasks
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:156:     body:
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:157:       expected_version: "integer | optional"
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:158:       entry_nodes: array
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:159:       run_mode: "enum(single|cascade)"
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:160:       inputs: object
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:161:     status:
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:162:       - 200
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:163:       - 202
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:164:       - 400
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:165:       - 401
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:166:       - 403
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:167:       - 404
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:168:       - 409
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:169:     schema:
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:170:       response_200:
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:171:         job_id: string
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:172:         state: "completed"
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:173:       response_202:
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:174:         job_id: string
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:175:         state: "accepted"
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:176:         poll_hint: "string | optional"
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:177:     errors:
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:178:       202: "异步受理，不代表失败"
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:179:       409: "版本冲突或运行前置条件不满足"
docs/contracts/CANVAS-INTERFACE-CATALOG.yaml:180:     acceptance: "返回 202 时必须提供可追踪 job_id。"
src/gods_workbench/api/routes_god_canvas.py:175: @router.post(
src/gods_workbench/api/routes_god_canvas.py:176:     "/{canvas_id}/tasks",
src/gods_workbench/api/routes_god_canvas.py:177:     response_model=SmartCanvasTaskResponse,
src/gods_workbench/api/routes_god_canvas.py:178:     summary="发起智能画布任务",
src/gods_workbench/api/routes_god_canvas.py:179:     status_code=status.HTTP_202_ACCEPTED,
src/gods_workbench/api/routes_god_canvas.py:180: )
src/gods_workbench/api/routes_god_canvas.py:181: def run_smart_canvas_task(
src/gods_workbench/api/routes_god_canvas.py:182:     canvas_id: str,
src/gods_workbench/api/routes_god_canvas.py:183:     payload: SmartCanvasTaskRequest,
src/gods_workbench/api/routes_god_canvas.py:184:     authorization: Optional[str] = Header(None),
src/gods_workbench/api/routes_god_canvas.py:185:     x_user_role: str = Header("editor", alias="X-User-Role", description="用户角色权限"),
src/gods_workbench/api/routes_god_canvas.py:186: ):
src/gods_workbench/api/routes_god_canvas.py:187:     """发起异步执行任务并返回 202 Accepted 及稳定 job_id。"""
src/gods_workbench/api/routes_god_canvas.py:188:     return default_god_canvas_service.submit_smart_task(
src/gods_workbench/api/routes_god_canvas.py:189:         canvas_id=canvas_id,
src/gods_workbench/api/routes_god_canvas.py:190:         payload=payload,
src/gods_workbench/api/routes_god_canvas.py:191:         authorization=authorization,
src/gods_workbench/api/routes_god_canvas.py:192:         user_role=x_user_role,
src/gods_workbench/api/routes_god_canvas.py:193:     )
src/gods_workbench/api/routes_god_canvas.py:194: 
src/gods_workbench/api/routes_god_canvas.py:195: 
src/gods_workbench/api/routes_god_canvas.py:196: @jobs_router.get(
src/gods_workbench/api/routes_god_canvas.py:197:     "/{job_id}",
src/gods_workbench/api/routes_god_canvas.py:198:     response_model=SmartCanvasTaskResponse,
src/gods_workbench/api/routes_god_canvas.py:199:     summary="查询异步任务状态",
src/gods_workbench/api/routes_god_canvas.py:200:     status_code=status.HTTP_200_OK,
src/gods_workbench/api/routes_god_canvas.py:201: )
src/gods_workbench/api/routes_god_canvas.py:202: def get_smart_job_status(job_id: str):
src/gods_workbench/api/routes_god_canvas.py:203:     """根据 job_id 查询智能画布任务状态。"""
src/gods_workbench/api/routes_god_canvas.py:204:     return default_god_canvas_service.get_job(job_id)
src/gods_workbench/core/auth.py:23: 
src/gods_workbench/core/auth.py:24: 
src/gods_workbench/core/auth.py:25: def require_authenticated(
src/gods_workbench/core/auth.py:26:     authorization: Optional[str],
src/gods_workbench/core/auth.py:27:     user_role: Optional[str] = "editor",
src/gods_workbench/core/auth.py:28: ) -> AuthContext:
src/gods_workbench/core/auth.py:29:     """要求 Bearer 会话并返回角色上下文。"""
src/gods_workbench/core/auth.py:30:     raw = (authorization or "").strip()
src/gods_workbench/core/auth.py:31:     scheme, separator, credential = raw.partition(" ")
src/gods_workbench/core/auth.py:32:     if not separator or scheme.lower() != "bearer" or not credential.strip():
src/gods_workbench/core/auth.py:33:         raise UnauthorizedException()
src/gods_workbench/core/auth.py:34:     if credential.strip().lower() in {"invalid", "expired"}:
src/gods_workbench/core/auth.py:35:         raise UnauthorizedException()
src/gods_workbench/core/auth.py:36: 
src/gods_workbench/core/auth.py:37:     role = (user_role or "editor").strip().lower()
src/gods_workbench/core/auth.py:38:     if role not in KNOWN_ROLES:
src/gods_workbench/core/auth.py:39:         raise ForbiddenException(message="未知用户角色，已拒绝请求")
src/gods_workbench/core/auth.py:40:     return AuthContext(role=role)
src/gods_workbench/core/auth.py:41: 
src/gods_workbench/core/auth.py:42: 
src/gods_workbench/core/auth.py:43: def require_edit_access(authorization: Optional[str], user_role: Optional[str] = "editor") -> AuthContext:
src/gods_workbench/core/auth.py:44:     """要求已认证且具备项目/画布写权限。"""
src/gods_workbench/core/auth.py:45:     context = require_authenticated(authorization, user_role)
src/gods_workbench/core/auth.py:46:     if context.role not in EDIT_ROLES:
src/gods_workbench/core/auth.py:47:         raise ForbiddenException(message="无当前资源写权限，已降级为只读")
src/gods_workbench/core/auth.py:48:     return context
src/gods_workbench/core/auth.py:49: 
src/gods_workbench/core/auth.py:50: 
src/gods_workbench/core/auth.py:51: def require_governance_access(
src/gods_workbench/core/auth.py:52:     authorization: Optional[str],
src/gods_workbench/core/auth.py:53:     user_role: Optional[str] = "editor",
src/gods_workbench/api/app.py:24:     @app.exception_handler(CleanroomException)
src/gods_workbench/api/app.py:25:     async def cleanroom_exception_handler(request: Request, exc: CleanroomException):
src/gods_workbench/api/app.py:26:         """统一处理契约异常并返回标准错误包。"""
src/gods_workbench/api/app.py:27:         envelope = exc.to_envelope()
src/gods_workbench/api/app.py:28:         return JSONResponse(
src/gods_workbench/api/app.py:29:             status_code=exc.status_code,
src/gods_workbench/api/app.py:30:             content=envelope.model_dump(exclude_none=True),
src/gods_workbench/api/app.py:31:         )
src/gods_workbench/api/app.py:32: 
src/gods_workbench/api/app.py:33:     @app.exception_handler(RequestValidationError)
src/gods_workbench/api/app.py:34:     async def validation_exception_handler(request: Request, exc: RequestValidationError):
src/gods_workbench/api/app.py:35:         """把 FastAPI 参数校验错误统一为契约要求的 400 错误包。"""
src/gods_workbench/api/app.py:36:         return JSONResponse(
src/gods_workbench/api/app.py:37:             status_code=400,
src/gods_workbench/api/app.py:38:             content={
src/gods_workbench/api/app.py:39:                 "detail": {
src/gods_workbench/api/app.py:40:                     "code": "INVALID_REQUEST",
src/gods_workbench/api/app.py:41:                     "message": "请求参数不合法",
src/gods_workbench/api/app.py:42:                     "errors": [
src/gods_workbench/api/app.py:43:                         {
src/gods_workbench/api/app.py:44:                             "loc": list(error.get("loc", ())),
src/gods_workbench/api/app.py:45:                             "msg": error.get("msg", "请求参数不合法"),
src/gods_workbench/api/app.py:46:                             "type": error.get("type", "invalid_request"),
src/gods_workbench/api/app.py:47:                         }
src/gods_workbench/api/app.py:48:                         for error in exc.errors()
src/gods_workbench/api/app.py:49:                     ],
src/gods_workbench/api/app.py:50:                 }
src/gods_workbench/api/app.py:51:             },
src/gods_workbench/static/v2/js/projects-controller.js:1: /**
src/gods_workbench/static/v2/js/projects-controller.js:2:  * Gods' Workbench v2 - 项目中心控制器 (projects-controller.js)
src/gods_workbench/static/v2/js/projects-controller.js:3:  * 提供看板模式 (Kanban) 与列表模式 (Table) 双视图切换、分类筛选、实时检索与后端项目 CRUD 对接
src/gods_workbench/static/v2/js/projects-controller.js:4:  */
src/gods_workbench/static/v2/js/projects-controller.js:5: 
src/gods_workbench/static/v2/js/projects-controller.js:6: window.V2Projects = (function () {
src/gods_workbench/static/v2/js/projects-controller.js:7:   'use strict';
src/gods_workbench/static/v2/js/projects-controller.js:8: 
src/gods_workbench/static/v2/js/projects-controller.js:9:   const state = {
src/gods_workbench/static/v2/js/projects-controller.js:10:     projects: [],
src/gods_workbench/static/v2/js/projects-controller.js:11:     filterType: 'all',
src/gods_workbench/static/v2/js/projects-controller.js:12:     filterScope: 'active', // 'active' | 'archived' | 'trash'
src/gods_workbench/static/v2/js/projects-controller.js:13:     searchQuery: '',
src/gods_workbench/static/v2/js/projects-controller.js:14:     currentView: 'kanban',
src/gods_workbench/static/v2/js/projects-controller.js:15:     activeProjectId: null,
src/gods_workbench/static/v2/js/projects-controller.js:16:     pendingAction: null,
src/gods_workbench/static/v2/js/projects-controller.js:17:     counts: { active: 0, archived: 0, trash: 0 }
src/gods_workbench/static/v2/js/projects-controller.js:18:   };
src/gods_workbench/static/v2/js/projects-controller.js:19: 
src/gods_workbench/static/v2/js/projects-controller.js:20:   // 全局统一回收站数据状态池（工程、素材资产、工程画布集中隔离）
src/gods_workbench/static/v2/js/projects-controller.js:21:   const globalTrashState = {
src/gods_workbench/static/v2/js/projects-controller.js:22:     currentTab: 'projects', // 'projects' | 'assets' | 'canvases'
src/gods_workbench/static/v2/js/projects-controller.js:23:     projects: [],
src/gods_workbench/static/v2/js/projects-controller.js:24:     assets: [],
src/gods_workbench/static/v2/js/projects-controller.js:25:     canvases: [],
src/gods_workbench/static/v2/js/projects-controller.js:26:     initialized: false
src/gods_workbench/static/v2/js/projects-controller.js:27:   };
src/gods_workbench/static/v2/js/projects-controller.js:28: 
src/gods_workbench/static/v2/js/projects-controller.js:29:   const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
src/gods_workbench/static/v2/js/projects-controller.js:30: 
src/gods_workbench/static/v2/js/projects-controller.js:31:   // 原始项目日期路由使用毫秒时间戳；datetime-local 不带时区，按本地时间转换。
src/gods_workbench/static/v2/js/projects-controller.js:32:   const dateInputTimestamp = value => {
src/gods_workbench/static/v2/js/projects-controller.js:33:     const text = String(value || '').trim();
src/gods_workbench/static/v2/js/projects-controller.js:34:     if (!text) return null;
src/gods_workbench/static/v2/js/projects-controller.js:35:     const numeric = Number(text);
src/gods_workbench/static/v2/js/projects-controller.js:36:     if (Number.isFinite(numeric) && numeric > 0) return numeric;
src/gods_workbench/static/v2/js/projects-controller.js:37:     const timestamp = new Date(text).getTime();
src/gods_workbench/static/v2/js/projects-controller.js:38:     return Number.isFinite(timestamp) ? timestamp : null;
src/gods_workbench/static/v2/js/projects-controller.js:39:   };
src/gods_workbench/static/v2/js/projects-controller.js:40:   const dateInputValue = value => {
src/gods_workbench/god_canvas/service.py:91: poll_hint="/api/jobs/job-0001",
src/gods_workbench/god_canvas/service.py:168: 若 expected_version 与当前版本不一致，严格返回 409 CANVAS_VERSION_CONFLICT。
src/gods_workbench/god_canvas/service.py:176: if top.version != payload.expected_version:
src/gods_workbench/god_canvas/service.py:178: expected_version=payload.expected_version,
src/gods_workbench/god_canvas/service.py:191: def restore_canvas(self, canvas_id: str, expected_version: Optional[int] = None) -> CanvasMutationResult:
src/gods_workbench/god_canvas/service.py:199: if expected_version is not None and top.version != expected_version:
src/gods_workbench/god_canvas/service.py:201: expected_version=expected_version,
src/gods_workbench/god_canvas/service.py:210: def import_workflow(
src/gods_workbench/god_canvas/service.py:216: expected_version: Optional[int] = None,
src/gods_workbench/god_canvas/service.py:225: if expected_version is not None and top.version != expected_version:
src/gods_workbench/god_canvas/service.py:227: expected_version=expected_version,
src/gods_workbench/god_canvas/service.py:359: if payload.expected_version is not None and top.version != payload.expected_version:
src/gods_workbench/god_canvas/service.py:361: expected_version=payload.expected_version,
src/gods_workbench/god_canvas/service.py:378: poll_hint = f"/api/jobs/{job_id}"
src/gods_workbench/static/v2/js/projects-controller.js:96: let targetUrl = '/api/asset-registry/projects?archived=false';
src/gods_workbench/static/v2/js/projects-controller.js:98: targetUrl = '/api/asset-registry/projects?deleted=true';
src/gods_workbench/static/v2/js/projects-controller.js:100: targetUrl = '/api/asset-registry/projects?archived=true';
src/gods_workbench/static/v2/js/projects-controller.js:142: fetch('/api/asset-registry/projects?archived=false', { credentials: 'same-origin' }).catch(() => null),
src/gods_workbench/static/v2/js/projects-controller.js:143: fetch('/api/asset-registry/projects?archived=true', { credentials: 'same-origin' }).catch(() => null),
src/gods_workbench/static/v2/js/projects-controller.js:144: fetch('/api/asset-registry/projects?deleted=true', { credentials: 'same-origin' }).catch(() => null)
src/gods_workbench/static/v2/js/projects-controller.js:919: // 10. 归档项目 (DELETE /api/asset-registry/projects/{project_id})
src/gods_workbench/static/v2/js/projects-controller.js:922: const res = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}`, {
src/gods_workbench/static/v2/js/projects-controller.js:926: body: JSON.stringify({ expected_version: version || 1 })
src/gods_workbench/static/v2/js/projects-controller.js:950: // 11. 取消归档 (POST /api/asset-registry/governance/projects/{project_id}/restore)
src/gods_workbench/static/v2/js/projects-controller.js:953: const res = await fetch(`/api/asset-registry/governance/projects/${encodeURIComponent(projectId)}/restore`, {
src/gods_workbench/static/v2/js/projects-controller.js:957: body: JSON.stringify({ expected_version: version || 1 })
src/gods_workbench/static/v2/js/projects-controller.js:990: const archRes = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}`, {
src/gods_workbench/static/v2/js/projects-controller.js:994: body: JSON.stringify({ expected_version: currentVersion })
src/gods_workbench/static/v2/js/projects-controller.js:1003: const trashRes = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}/trash`, {
src/gods_workbench/static/v2/js/projects-controller.js:1007: body: JSON.stringify({ expected_version: currentVersion })
src/gods_workbench/static/v2/js/projects-controller.js:1031: // 13. 从统一回收站安全恢复 (POST /api/asset-registry/projects/{project_id}/trash/restore)
src/gods_workbench/static/v2/js/projects-controller.js:1034: const res = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}/trash/restore`, {
src/gods_workbench/static/v2/js/projects-controller.js:1038: body: JSON.stringify({ expected_version: version || 1 })
src/gods_workbench/static/v2/js/projects-controller.js:1089: const res = await fetch('/api/asset-registry/projects', {
src/gods_workbench/static/v2/js/projects-controller.js:1156: // 16. 处理编辑工程提交 (PATCH /api/asset-registry/projects/{id})
src/gods_workbench/static/v2/js/projects-controller.js:1183: expected_version: parseInt(verInput?.value, 10) || 1
src/gods_workbench/static/v2/js/projects-controller.js:1187: const res = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}`, {
src/gods_workbench/static/v2/js/projects-controller.js:1231: const response = await fetch('/api/asset-registry/governance/overview', { credentials: 'same-origin' });
src/gods_workbench/static/v2/js/projects-controller.js:1394: await fetch(`/api/asset-registry/governance/asset-trash/${encodeURIComponent(id)}/restore`, {
src/gods_workbench/static/v2/js/projects-controller.js:1407: const response = await fetch(`/api/asset-registry/project-recycle/${encodeURIComponent(entryId)}/restore`, { method: 'POST', credentials: 'same-origin' });
src/gods_workbench/static/v2/js/projects-controller.js:1419: await fetch(`/api/canvases/${encodeURIComponent(id)}/restore`, {
自采集初始时点以来工作树文件内容变化（本会话尚未写仓库）: ["HANDOFF-2.md", "HANDOFF.md", "docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md", "docs/governance/agent-reports-2026-09-20/T-handoff.md", "docs/governance/agent-reports-2026-09-20/T-release-ops.md", "src/gods_workbench/static/js/api-settings.js"]
复核文件 SHA-256 AGENTS.md 88bf0a62751fc99f212d2bbd138829ad8182b06e0bf4ba80082b476d08d32239
复核文件 SHA-256 docs/governance/AGENT-TASK-2026-09-20.md b3f6865024f2c7f9f05ddfe5a41200bf9f57a489d7f9da6fdfdd83699d574420
复核文件 SHA-256 src/gods_workbench/api/__init__.py 50ee87c7b226c6a957f156c96210637b5d4fb6cef437ecfb2fb9f1390c84d4e9
复核文件 SHA-256 src/gods_workbench/api/app.py 6ac2f30dca56525eb402027ed5ebaf990420a9c529aa7ea5bf449fc8293f0888
复核文件 SHA-256 src/gods_workbench/api/routes_god_canvas.py 4c35f42dced72f5d7b89ceb85e2ddb39745fc5ba7d88b74f11913e71f44b3ffa
复核文件 SHA-256 src/gods_workbench/api/routes_projects.py e90bd315060b924d450f647697785b34b769b8a294f26fa019b1c54832b417af
复核文件 SHA-256 src/gods_workbench/core/__init__.py 57a37d96ec5a0b8fb43219170ef391f562674b7363d033122f57c90c0c51da60
复核文件 SHA-256 src/gods_workbench/core/auth.py abb16ec1bb070a862c0f974dc1372e56ddb9195d916ac3dde3c72396e5e847b7
复核文件 SHA-256 src/gods_workbench/core/errors.py b5045bc5386be6ad81489ed70fccf1672daf67dfc97a00d6e97cd2bce6777cd0
复核文件 SHA-256 src/gods_workbench/core/models.py 2b36d93e54d2e8669e779c045a34c1c0963b1c74f71ec2baa6a39fa803f1939b
复核文件 SHA-256 src/gods_workbench/god_canvas/__init__.py da60d18b1e356acfaf24ba332dd4b10a865d6b47d638ead1794528c0d65d36c5
复核文件 SHA-256 src/gods_workbench/god_canvas/godmap.py 229f382b768bfcd1c6ae560d8b37482351c34f698bbf27cb92a6c6231a1f874e
复核文件 SHA-256 src/gods_workbench/god_canvas/models.py 3b753f42c11658d1b276aaf1a87d8ea52a2eb34202e4e1a41e2525b4cd1beea5
复核文件 SHA-256 src/gods_workbench/god_canvas/service.py 6deba86de1f78a1134668b80d4d0f6db1e16df34edc4b691cd326dc773d479f4
复核文件 SHA-256 src/gods_workbench/god_canvas/tasks.py c14f7558871d86bbd55472494824f3a9de8626a436a30fca8667bf89ddaeb0cb
复核文件 SHA-256 src/gods_workbench/projects_hub/__init__.py 5bd5e5608df96935f8779b9319f2d97468c9885cc4bf29d48590ec4144d40b89
复核文件 SHA-256 src/gods_workbench/projects_hub/models.py b460d619c68a1fc49a3ee164b63873baa9003f3f677e4fa0e14d90f5b4703060
复核文件 SHA-256 src/gods_workbench/projects_hub/service.py 6ca6de2dfe971abea3bab654e4d6f4df0132820145752f45fa8da28a16784785
复核文件 SHA-256 src/gods_workbench/static/js/api-settings.js 43d2b8de08a00e981eed032238530654807447e4d5aa6c043fe31da8203a0571
复核文件 SHA-256 tests/hygiene/test_cleanroom_hygiene.py debc3d31c663d64aa071d2a034200ecdcbc3e6c5ae3b00e5aef076d5da1b6ee7
非缓存磁盘清单数量: 249 清单规范 JSON SHA-256: bccf134f90f8a72af484a9e063b2e4f21b266b472aea616c5a18efce48a1f3a5
```

标准错误（完整）：
```text
（空）
```

## 修正后重签（R2，2026-09-20）

本附录为**追加**，不改写上文任何一行。上文记录的是 `cde7433` 时点的 GATE REOPENED 判定；本节记录针对上节 P1 项的修正后重签。

### 修正项与证据

| 上节 P1 | 修正 | 证据 |
|---|---|---|
| P1-1 拓扑写入 CAS 过宽（契约 optional、路由默认 None） | `restore_canvas` / `import_canvas_workflow` 的 `expected_version` 改为**必填 integer**；服务层去掉 `is not None` 短路，直接 `!=` 判 409 | `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`（restore/import 两处 `expected_version: integer`）；`src/gods_workbench/api/routes_god_canvas.py`；`src/gods_workbench/god_canvas/service.py` |
| P1-2 智能任务契约过宽（允许 200、poll_hint 可选） | 契约收敛为**仅 202**，删除 `response_200`，`poll_hint: string`；`SmartCanvasTaskResponse` 说明 202 必填、终态清空 | `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`（`run_smart_canvas_task`，version→`remediation-2`）；`src/gods_workbench/god_canvas/tasks.py` |
| P1-3 验证环境阻塞（无 pytest / fastapi） | 本机 Python 3.11 已装依赖，全量门禁可跑并据实记录（见下） | 本轮命令输出 |
| P1-4 范围清理中（`/static/runninghub/` 残留） | comfyui/runninghub 全量移除；卫生用例改为“已删文件不得重现、保留页面不得引用已删路径、不得保留业务标识” | `tests/hygiene/test_cleanroom_hygiene.py` |
| P1-5 认证仅拒字符串 `invalid` | 仍为**未闭环**；外部身份提供商方案见 `docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md` | 不在本轮契约冻结范围 |

### 跨平台行尾修正（本轮关键修复）

远端 CI（GitHub Actions run `35508749903` / `35508682089`）失败根因：哈希登记值绑定 **Windows CRLF 字节**，而 Linux 检出为 **LF**，同一文件字节不同导致两条哈希断言失败。

- 修正：`tests/hygiene/test_cleanroom_hygiene.py` 新增 `_canonical_sha256()`（CRLF/CR→LF 归一）；`docs/provenance/PHASE-2-INPUT-SHA256.txt` 16 条、`AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 2 条哈希重算为 LF 归一值；新增 `.gitattributes`（`* text=auto eol=lf` + 二进制标记）。
- 证据：Windows 工作树 `python -m pytest` → **40 passed**；全树 LF 仿真 → **40 passed**；`node --check` 56/56；二进制白名单仅 3 个 `.otf`。

### 重签结论

SSoT 更正（P1-1 / P1-2）与跨平台行尾一致性问题已按证据修正，本地门禁复跑通过。**但本记录仍是机器自证加本地复核，不构成独立第三方审计，也不构成发布或生产授权**；P1-5（真实 IdP）与许可证/部署验收仍待闭环。仓库继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
