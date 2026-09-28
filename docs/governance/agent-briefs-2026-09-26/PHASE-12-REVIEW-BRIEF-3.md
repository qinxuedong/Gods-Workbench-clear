# Phase 12 第三轮独立审核简报（针对第二轮 Required 的修复）

- 审核对象：`docs/governance/agent-briefs-2026-09-26/PHASE-12-SUMMARY-REPORT.md` 及本轮修复
- 工作树：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`（HEAD `c71c6980`，脏，禁止 commit/push）
- 审核方式：证伪式、只读复核；只允许覆写你自己的审核报告，不得改动仓库其他文件

## 一、第二轮 Required 的原文

> **Required：新增前端守卫可被“空实现/仅注释”骗过**
>
> `test_v2_aura_bus_status_is_driven_by_real_chat_endpoint` 只读取字符串并断言关键字存在，
> 没有执行 JS，也没有验证函数是否被调用、请求是否真的发出或 DOM 是否真的更新。
> 实测将 `index.html` 只写入注释、`home-controller.js` 只写入一行包含关键字的注释后，
> 结果为 `MUTATION_RESULT=PASS_EMPTY_COMMENT_ONLY`。
> 建议至少补充：
> 1. Node/jsdom（或等价 DOM runtime）执行 `syncAuraBusStatus`，断言真实 `fetch('/api/chat')` 被调用；
> 2. 成功、401/403/404/501/503、网络异常分别断言 DOM 文案和 `data-gw-degradation`；
> 3. 对 V2 控制器采用可执行行为测试，而非只检查源码关键词。

## 二、本轮声称的修复

1. 新增 `tests/contracts/test_phase12_v2_runtime_degradation.py`：
   - 用 Node `vm` + 自带最小 DOM（零外部依赖，不引入 jsdom/Playwright）**真实装载并执行** V2 控制器；
   - 断言真实发出的 `fetch`（URL + 方法），而不是源码中出现过地址；
   - 覆盖 `/api/chat`、`/api/chat/agent` 的 200 / 503(CHAT_NOT_INTEGRATED) / 503(其他) / 401/403/404/501 / 网络异常；
   - 覆盖项目卡「资产规模」真实 total 与失败降级；覆盖 GPU `applyGpuTelemetry` ok / 缺项；
   - **含两条反向变异用例**：把函数体替换为空实现/仅注释后，断言守卫必须失败。
2. 修复项目卡「资产规模」真实读数时机：`syncAssetScale()` 从 `init()` 移到 `render()` 末尾，
   修复「render 重建 innerHTML 后真实读数未回写、永远停在静态初值『未接入』」的假降级。

## 三、你必须独立核实的事项

1. **守卫是否真的可执行**：新测试是否真的执行 JS？把被测控制器函数体替换为空实现 / 仅注释后，
   守卫是否**确实失败**？请自己做一次变异验证并给出结论。
2. **是否引入外部依赖**：新测试是否依赖 jsdom / Playwright / 网络？在无这些依赖时是否仍能跑？
3. **断言强度**：是否存在「只看源码字符串」的漏网断言仍被当作 Required 的守卫？
4. **资产规模修复**：`syncAssetScale()` 是否确实在 `render()` 之后执行？`init()` 里是否已移除早期调用？
5. **回归**：全量 `pytest` 是否通过？新增测试是否稳定（重复执行结果一致）？
6. 上一轮 **Optional**（help 端点数量口径）是否已澄清。

## 四、必须复跑的命令

```powershell
python -m pytest tests/contracts/test_phase12_v2_runtime_degradation.py -q --no-header -p no:cacheprovider
python -m pytest tests -q --no-header -p no:cacheprovider
python tools/_probe_p12.py
```

## 五、输出要求

把结论写入 `docs/governance/agent-briefs-2026-09-26/PHASE-12-REVIEW-REPORT.md`（覆写），必须包含：

- 一、结论（通过 / 不通过）
- 二、逐条核实（含你自己的变异验证证据）
- 三、新发现问题（如有，标注 Required / Optional）
- 四、证据边界

**判定口径**：只有当「新守卫真的能拦住空实现/注释实现」这一条被你自己复现证实，且全量测试通过时，才可签「通过」。


## 六、同一轮追加修复（请一并核实）

**第二处假「未接入」（本轮新发现，已修）**：`v2-shell.js` 的 `standardRightDeck()` 在每条
v2 页顶栏注入一组 FLUX/VRAM 推子，读数永久写死「未接入」，标题声称
「本切片无任何真实算力/GPU 遥测数据源」；但同一顶栏另一侧（页面自带块）已由
`nvidia-smi` 驱出真实读数（实测同屏并存「FLUX 2% / VRAM 62%」与「FLUX 未接入 / VRAM 未接入」）。

修复：

- `v2-shell.js`：注入读数位改为可驱动钩子 `data-gw-gpu-util` / `data-gw-gpu-vram`，
  初值「读取中…」；并在注入后立即回放 `HardwareDeck.lastGpuCheck`（避免 15s 空窗）。
- `hardware-telemetry.js`：`applyGpuTelemetry` 统一写入这些钩子（真实百分比或显式降级），
  并新增 `lastGpuCheck` 缓存最近一次真实检查项。
- 守卫：改 `test_v2_shell_injected_faders_have_no_stale_readouts`，新增
  `test_v2_shell_injected_faders_are_driven_by_real_gpu_telemetry`，以及
  `test_phase12_v2_runtime_degradation.py` 中两条运行时用例
  （真实读数写入 / 缺项降级）。

请独立核实：浏览器实测注入推子是否已显示真实百分比；缺 GPU 时是否降级「未接入」。
