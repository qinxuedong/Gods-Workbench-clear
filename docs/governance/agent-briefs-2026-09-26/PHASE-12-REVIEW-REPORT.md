# Phase 12 第二轮独立审核报告

- 审核日期：2026-09-26
- 审核对象：`PHASE-12-SUMMARY-REPORT.md` 及本轮修复声称
- 审核方式：独立证伪复跑；本轮只覆写本报告，未修改其他仓库文件。

## 一、结论

**结论：不通过。**

上一轮列出的 3 项 Required 修复大体已落地并可复现：CLI 门禁在开启配置后可执行，GPU 遥测由真实 `nvidia-smi` 驱动，首页 AURA 静态「已接入」文案已改为「读取中…」并由 `/api/chat` 驱动；全量测试也通过。

但本轮发现新的 **Required**：`tests/contracts/test_phase9_frontend_degradation.py` 的新增 V2/AURA 守卫主要是源码字符串存在性检查，空实现或仅注释实现即可通过，不能阻止真实回归。该问题直接违反本轮要求“确认守卫真的能拦住回归”，因此当前不能签发“通过”。

## 二、逐条核实上一轮 Required

### 1. CLI 配置门禁与帮助端点

**判定：修复真实；原“全部已接入”口径仍必须保持区分。**

默认配置复跑：

```text
python tools/_probe_p12.py
TOTAL 241 NOT_INTEGRATED 10
  CANVAS_EXCLUDED     4 （用户口径：画布域，本轮排除）
  CONFIG_GATED        6 （依赖 GW_CLI_EXECUTION=1 + CLI 在 PATH，未配置即 fail-closed）
  REAL_NOT_INTEGRATED 0 （后端确实没有该能力）
1 api/codex/help
1 api/gemini-cli/help
1 api/jimeng/credit
1 api/jimeng/help
1 api/jimeng/login
1 api/jimeng/logout
1 api/canvas-assets/download
1 api/shared-folders/import
1 api/video-tasks
1 api/canvases/assets
```

开启配置后复跑：

```text
$env:GW_CLI_EXECUTION=1
python tools/_probe_p12.py
TOTAL 241 NOT_INTEGRATED 6
  CANVAS_EXCLUDED     4 （用户口径：画布域，本轮排除）
  CONFIG_GATED        2 （依赖 GW_CLI_EXECUTION=1 + CLI 在 PATH，未配置即 fail-closed）
  REAL_NOT_INTEGRATED 0 （后端确实没有该能力）
1 api/jimeng/credit
1 api/jimeng/login
1 api/canvas-assets/download
1 api/shared-folders/import
1 api/video-tasks
1 api/canvases/assets
```

直接 TestClient 请求（开启 `GW_CLI_EXECUTION=1`、本地登录会话）：

```text
POST /api/codex/help       -> 200, protocol=codex,      returncode=0
POST /api/gemini-cli/help  -> 200, protocol=gemini-cli, returncode=0
POST /api/jimeng/help      -> 200, protocol=jimeng,     returncode=0
```

因此，`codex/gemini-cli/jimeng` 这 3 个实际存在的 help 路由不再返回 `*_NOT_INTEGRATED`。不过审核简报所写“4 个 help 端点”与当前 OpenAPI 不符：当前只发现上述 3 个 `POST` help 路由，没有第 4 个可核验对象。配置门禁关闭时仍有 6 项 fail-closed，不能写成“当前运行时全部接入”。

### 2. GPU/显存真实接入

**判定：修复真实。**

命令：

```text
nvidia-smi --query-gpu=index,name,memory.total,memory.used,utilization.gpu --format=csv,noheader,nounits
0, NVIDIA GeForce RTX 5090, 32607, 20139, 4
```

同一轮 TestClient 请求：

```text
GET /api/observability/health -> HTTP 200
status=partial, gpu_telemetry.status=ok
NVIDIA_SMI: 0, NVIDIA GeForce RTX 5090, 32607, 20139, 4
API_GPU: {
  "gpu_count": 1,
  "gpu_utilization_percent": 1.0,
  "gpu_memory_percent": 61.75,
  "devices": [{
    "index": 0,
    "name": "NVIDIA GeForce RTX 5090",
    "memory_total_mib": 32607.0,
    "memory_used_mib": 20134.0,
    "utilization_percent": 1.0,
    "memory_utilization_percent": 61.747477535498504
  }]
}
```

设备名、设备数、总显存一致；利用率/已用显存因两次采样时刻不同而有小幅变化，符合实时读数，不是静态伪造。

代码与前端接线抽查：

- `src/gods_workbench/observability/telemetry.py:45,50,59`：执行 `nvidia-smi` 并解析真实设备读数；
- `src/gods_workbench/observability/service.py:695-704`：输出 `gpu_telemetry` 检查项；
- `src/gods_workbench/static/js/hardware-telemetry.js:175,194-207`：请求 `/api/observability/health`，筛选 `gpu_telemetry`，调用 `applyGpuTelemetry`；
- `hardware-telemetry.js` 中 GPU 卡片由 `devices` 数组写入，不是固定型号/显存文本。

### 3. 首页 AURA 静态断言

**判定：声明的修复真实。**

源码核对：

```text
src/gods_workbench/static/v2/index.html:815
<span id="auraBusStatus">AURA 智能体总线 · 读取中…</span>

src/gods_workbench/static/v2/js/home-controller.js:1467-1500
按真实 POST /api/chat 的成功、失败、异常结果写入状态；失败路径设置 data-gw-degradation。
```

全仓 `v2/*.html` 扫描结果：

```text
ALL_HTML_FILE_OCCURRENCES [('workshop.html', [792])]
HTML_TEXT_NODE_HITS []
```

`workshop.html:792` 的“已接入”位于脚本中的运行期赋值：

```js
text.textContent = 'PIPELINE ENGINE BUS: 已接入 · ' + episodes.length + ' 条流水线';
```

它不是初始 HTML 文本节点，且位于 `episodesDegradation` 为空（真实请求成功）分支；本轮要求的“HTML 文本节点静态断言”未再发现。当前守卫也确实通过：

```text
python -m pytest tests/contracts/test_phase9_frontend_degradation.py -q --no-header -p no:cacheprovider
72 passed in 0.59s
```

## 三、全量测试

按简报要求原命令复跑：

```text
python -m pytest tests -q --no-header -p no:cacheprovider
619 passed, 7 skipped in 84.47s (0:01:24)
```

## 四、新发现的问题

### Required：新增前端守卫可被“空实现/仅注释”骗过

目标守卫：`test_v2_aura_bus_status_is_driven_by_real_chat_endpoint`。

该测试只读取字符串并断言关键字存在：`id="auraBusStatus"`、`读取中…`、`home-controller.js`、`syncAuraBusStatus`、`'/api/chat'`、`auraBusStatus`、`data-gw-degradation`；没有执行 JS，也没有验证函数是否被调用、请求是否真的发出或 DOM 是否真的更新。

实际变异验证（使用临时文件，不改仓库）：将 `index.html` 只写入注释，将 `home-controller.js` 只写入一行包含上述关键字的注释，然后调用同一个守卫函数，结果为：

```text
MUTATION_RESULT=PASS_EMPTY_COMMENT_ONLY
```

因此该守卫不能拦住“函数删空、只留注释、从页面移除调用”等回归。现有 `test_phase9_degradation_runtime.py` 只覆盖共享 transport/degradation 的 Node 行为，不覆盖 AURA 首页控制器或 GPU/任务中心等 V2 控制器的实际运行路径。建议至少补充：

1. Node/jsdom（或等价 DOM harness）执行 `syncAuraBusStatus`，断言真实 `fetch('/api/chat')` 被调用；
2. 成功、401/403/404/501/503、网络异常分别断言 DOM 文案和 `data-gw-degradation`；
3. 对 V2 控制器采用可执行行为测试，而非只检查源码关键词。

### Optional：help 端点数量口径不一致

当前 `app.openapi()['paths']` 中仅有：

```text
/api/codex/help       ['post']
/api/gemini-cli/help  ['post']
/api/jimeng/help      ['post']
```

简报写“4 个 help 端点”无法在当前仓库中复核。三条实际端点已经全部实测通过，问题属于审核口径/报告准确性，不改变上述 Required 结论。

## 五、证据边界

- 所有结论均为本机 `D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear` 当前工作树的复跑结果；未引用他人测试结论。
- TestClient 使用本地测试账号与会话，不能替代真实浏览器、生产认证、远端 CLI 或多用户并发验证。
- GPU 数值是实时采样，接口与独立 `nvidia-smi` 不保证同一毫秒完全相等；本次核对的是来源、设备名/数量/总显存及读数合理一致性。
- `python tools/_probe_p12.py` 是 OpenAPI 端点探针；其 `CONFIG_GATED`/`CANVAS_EXCLUDED` 分类依赖脚本内固定集合，不能证明未列入探针的业务语义。
- 工作树在审核前已有大量未提交改动；本轮没有改动这些文件，仅覆写本报告。

**最终判定：不通过。**阻断项为“V2/AURA 前端守卫可被空实现或注释实现骗过”，不是本轮三项运行时修复本身。
