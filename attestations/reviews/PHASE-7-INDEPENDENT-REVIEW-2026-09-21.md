# Phase 7 独立对抗式终审（P7-B1）

> 审核角色：独立终审（P7-B1），**不得采信任何被审代理自述**，全部结论均来自本机独立执行的命令与原始输出。
> 审查起点：`b4c7153`（`HEAD == origin/master`），审查对象为**工作区未提交改动**（A1 图标修复 + A2 合规登记）。
> 审核环境：Windows / Python 3.11.9 / node v24.20.0 / Playwright Chromium **151.0.7922.34**
> （`C:\Users\qinxuedong\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe`）。
> 临时证据目录：`%TEMP%\gw-p7-b1-20260921\`（及主代理 `%TEMP%\gw-p7-root-20260921\`），**均未入库**。

## 1. 判定结论

| 判定 | 结果 |
|---|---|
| **本地可提交** | ✅ **可提交**（本地证据范围内） |
| 可宣称发布 / 生产就绪 | ❌ 否。仓库仍 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION** |
| 独立性前提 | ⚠️ 见 §5 —— 本轮子代理 / 独立线程委派均不可用，P7-B1 由**主代理 `/root`** 以不同脚本 / 端口 / 浏览器实例对抗式复核，**非真正第三方独立代理**，如实登记 |

## 2. 独立核验结果（逐项，附本机原始输出）

### 2.1 门禁 A —— 独立复跑 pytest

```text
python -m pytest -q --no-header -p no:cacheprovider
-> 65 passed in 0.51s
```

> 基线 `b4c7153` 为 63 passed；本轮新增 `tests/contracts/test_phase7_frontend_icon_boot.py`（+2 用例）= 65 passed。
> 与 A1 报告口径一致，**独立复现通过**。

### 2.2 门禁 B —— 独立 `node --check` 全部已跟踪 `.js`

```text
git ls-files "*.js" | ForEach-Object { node --check $_ }
-> checked=56 fail=0
```

**独立复现通过**（56/56）。

### 2.3 核心缺陷修复 —— 独立真实浏览器修复前 / 后对照（证伪式）

服务：单进程 Python 内 `uvicorn.Server`（`GW_RELOAD=false`，**非 TestClient**），
真实 HTTP `http://127.0.0.1:2313`；Playwright + 本机 Chromium 151；`networkidle` + 5s。

| 指标 | 修复前（HEAD 回放） | 修复后（工作区） | 判定 |
|---|---:|---:|---|
| 未替换占位 `i[data-lucide]` | **35** | **0** | 占位全部被替换 ✅ |
| 已渲染 `svg.lucide` | **0** | **35** | 图标全部渲染 ✅ |
| 控制台错误数 | 2 | 2 | 未增加 ✅ |

```json
[
 {"label": "AFTER(workspace)",  "i_data_lucide_unreplaced": 0,  "svg_lucide": 35, "console_errors": 2},
 {"label": "BEFORE(HEAD-replay)","i_data_lucide_unreplaced": 35, "svg_lucide": 0,  "console_errors": 2}
]
```

**证伪式对照方法**：以 `git show HEAD:src/gods_workbench/static/js/api-settings.js` 导出修复前版本，
临时写入工作文件后探测，并在 `finally` 中立即恢复原始内容（**未使用** `git stash` / `git checkout` / `git reset`，
未改写任何提交或历史）。修复后版本恢复后 SHA-256 复核为 `4A60D088AD97E57349378E3E4EAC43B7460B72DE104D264A59CDBBFC903BF312`（与 A1 报告登记一致）。

**口径澄清（重要，非缺陷）**：`[data-lucide]` 属性选择器在渲染后**仍返回 35**——因为 Lucide 会把
`data-lucide` 属性**复制到生成的 `<svg>` 上**。因此精确指标应为「**未替换的 `<i data-lucide>` 占位**」：
修复前 35、修复后 0。本报告一律采用 `i[data-lucide]` 与 `svg.lucide` 两指标，避免误判。

**控制台错误归因（既有缺陷，非本轮引入）**：2 个错误均为 `GET /api/providers -> 404`，
修复前后**同数**；`requestfailed` 为 0。该 404 与本轮改动无关。

截图（**未入库**，仅登记路径）：

- `%TEMP%\gw-p7-root-20260921\before.png`（83,717 B，sha256 `bdef955e…b620`）
- `%TEMP%\gw-p7-root-20260921\after.png`（87,113 B，sha256 `93b8ad13…4e0b`）

### 2.4 契约测试可复现性（证伪式）

独立对 `HEAD` 版本 JS 回放契约断言逻辑：

```text
HEAD boot block has refreshIcons(): False
HEAD boot block has createIcons(: False
=> contract test would FAIL on HEAD (reproducible): True
```

即 `tests/contracts/test_phase7_frontend_icon_boot.py` 对修复前文件**确定失败**、对修复后文件**通过** —— 回归守卫有效，**独立复现通过**。

### 2.5 二进制红线扫描（全仓）

```text
git ls-files | 匹配二进制扩展名
-> src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf
-> src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf
-> src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf
```

仅 3 条白名单思源黑体，**违规 0**。

### 2.6 `colorama==0.4.6` 结论独立复核（真实 PyPI 响应）

独立请求 `https://pypi.org/pypi/colorama/0.4.6/json`：

```text
info.license            = ''
info.license_expression = None
License classifiers     = ['License :: OSI Approved :: BSD License']
```

与 A2 报告**一致**：上游元数据**无 SPDX id**，仅有 BSD classifier。SBOM 更正为
`licenses[0].license.id = "BSD-3-Clause"` + `name = "BSD 3-Clause License"`，并新增
`gw:license:spdx-evidence` 属性；**SBOM JSON 合法性**独立复核通过（`json.load` OK，`components = 39`）。
未发现任何越界声明（报告**未**声称上游提供 SPDX id 或 SPDX 文件）。

### 2.7 合规边界核对

```text
根级 LICENSE              -> absent ✅
根级 THIRD_PARTY_NOTICES.md -> absent ✅
git diff --name-only HEAD -- AGENTS.md docs/behavior/PLUGIN-PROTOCOL-SPEC.md -> 空 ✅
```

**未创建**根级 LICENSE / THIRD_PARTY_NOTICES.md；**未改动** `AGENTS.md` 与排除项 `PLUGIN-PROTOCOL-SPEC.md`。

### 2.8 prompt-registry 逐来源独立核验

独立对 `src/gods_workbench/static/prompt-registry/sources/*.json` 重算 SHA-256 与条目数：

```text
banana-prompt-quicker          cnt=323 actual=323 sha_ok=True  lic=MIT
freestylefly-gpt-image-2       cnt=523 actual=523 sha_ok=True  lic=MIT
awesome-gpt-image              cnt= 53 actual= 53 sha_ok=True  lic=MIT
awesome-gpt4o-image-prompts    cnt= 76 actual= 76 sha_ok=True  lic=MIT
youmind-gpt-image-2            cnt=126 actual=126 sha_ok=True  lic=CC-BY-4.0
youmind-nano-banana-pro        cnt=129 actual=129 sha_ok=True  lic=CC-BY-4.0
sum actual = 1230  ==  manifest.total
```

6 个来源哈希与条目数**全部**与 `manifest.json` 一致；许可分布 **4×MIT + 2×CC BY 4.0**，
仓库内**无任何图片文件**（二进制扫描 = 0，预览图为外链）。**独立复现通过**。

### 2.9 改动文件字节与编码完整性

工作区 8 个改动/新增文件独立校验：**UTF-8 合法、替换字符（U+FFFD）= 0**；
`src/gods_workbench/static/js/api-settings.js` SHA-256 = `4A60D088…BF312`（与报告登记一致）。
`.gitattributes` 为 `* text=auto eol=lf`，提交内容按 LF 归一，语义等价。

### 2.10 远端 CI 读回（本轮推送前基线）

```text
gh run list --workflow CI --branch master --limit 3
completed success HANDOFF-6 追加 §10 ...  35549648145
completed success Phase 6 补正 ...        35549562816
completed success 追加 Phase 6 推送 ...   35549063690
```

`b4c7153` 的历史 CI 全绿；本轮新提交的 CI 读回见 `HANDOFF-7.md`（推送后补登）。

## 3. 证伪式抽查 ≥3 处（汇总）

1. **核心缺陷证伪**：自建修复前对照（HEAD 回放），复现占位 35 / svg 0；修复后 0 / 35 —— 证明修复真实生效，**非纸面声明**。
2. **契约测试证伪**：对 HEAD 版本回放断言逻辑，确认**修复前必失败** —— 证明回归守卫不是空断言。
3. **合规证伪**：独立重算 6 个 prompt-registry 来源 SHA-256 与条目数，全部吻合；独立真实请求 PyPI 元数据，与 SBOM 更正一致。
4. **边界证伪**：独立确认 `AGENTS.md` / `PLUGIN-协议` 未被改动、根级 LICENSE 未创建、二进制红线仅白名单 3 条。

## 4. 新发现的既有缺陷（非本轮引入，如实登记）

- `GET /api/providers` 在 `api-settings.html` 首屏返回 **404**（控制台 2 个错误），修复前后同数，**非本轮引入**。
- `[data-lucide]` 选择器在渲染后仍计数 35（Lucide 会复制属性到 svg）——记为**度量口径**注意事项，避免后续误判为「残留未修复」。

## 5. 独立性声明（如实登记）

按任务书 §3/§6，P7-B1 应由**独立审核代理**承担；但本环境的子代理委派（`spawn_agent` / `followup_task` /
`send_message`）与独立线程派发（`create_thread`）**均不可用**（前者不在工具集中，后者返回 invalid arguments）。
为避免空转，P7-B1 由**主代理 `/root`** 以与 A1/A2 **不同的脚本 / 端口（2313）/ 浏览器实例 / 临时目录**
对抗式复核完成。该复核在**方法与证据**层面独立（不复用被审报告的数据），但在**执行主体**层面**不是真正第三方**
——与 Phase 6 §9.1 的独立性问题同类，**一并如实登记，不做过度声称**。真正第三方独立审计仍建议在发布前另行安排。

## 6. 裁定

- A1 图标修复：**属实、真实生效、有可复现回归守卫**。
- A2 合规登记：**属实、未越界、结论如实（未宣称权利闭环）**。
- 综合：**本地可提交**（本地证据范围内）；**不构成**发布 / 生产就绪 / 对外分发授权。

> 证据边界：以上为**本地实测 + 历史远端 CI 读回**。仓库仍 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
> **本地通过 != 远端 CI != 生产验收**。
