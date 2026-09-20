# 当前快照审计（2026-09-20）

## 总体结论

**本地有限静态取证完成；自动化测试受环境阻塞，当前快照不具备冻结/生产/分发通过结论。** 本报告是独立于实现自述的命令复核，不是独立第三方或人工审计。

- HEAD：`cde7433cd24e297ceeabd248365908a8da006813`；分支：`master`。
- 主采集窗口：`2026-09-20T17:59:44.059049+08:00` 至 `2026-09-20T17:59:47.407024+08:00`（UTC+08:00）。补充取证：`2026-09-20T18:01:47.575761+08:00` 至 `2026-09-20T18:01:47.731424+08:00`。
- 绑定的是上述 HEAD **加当时的未提交/未跟踪工作树**，不是干净提交。工作树由其他任务并行修改，不是原子快照；不得把本报告推广为后续文件版本的验收。
- 只读审计当前洁净仓；没有读取旧仓源码/提交历史。未修改契约、夹具、业务实现或门禁状态。

## 快照数字与口径

以下数字严格来自主采集窗口的 snapshot-start / snapshot-end，不代表写入本文后的仓库：

| 口径 | 实测 |
|---|---:|
| git ls-files 索引路径 | 206 |
| 上述索引路径在磁盘仍存在 | 201 |
| 索引列出但磁盘不存在 | 5 |
| 磁盘文件（排除 .git，包含忽略缓存） | 284 |
| 磁盘文件（进一步排除 __pycache__ / .pytest_cache） | 246 |
| static 下磁盘文件 | 108 |
| node --check 检查的保留 .js | 56 |
| node --check 失败 | 0 |

- 工作树不是 clean。完整 `git status --porcelain -uall`、`git diff --stat` 与警告附后；不把索引计数等同当前磁盘文件数。
- Git 报全局 ignore 文件访问拒绝；索引枚举正常，但未跟踪/忽略判定存在环境限制，不把 porcelain 当全部磁盘清单。
- 补充取证时非缓存文件变为 249，且检测到他人正在修改 HANDOFF、T-release-ops 和 api-settings.js 等文件（原始变化清单见重签报告 supplement）。这些不是本会话写入；本会话没有回滚或覆盖它们。
- 由于 api-settings.js 在扫描后改变，56/0 只能约束扫描时版本；最终提交前必须重跑。不存在“用同一 HEAD 证明整个脏工作树固定不变”的结论。

## 测试与静态检查

| 命令/检查 | 真实结果 | 边界 |
|---|---|---|
| `python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q` | 退出 1，No module named pytest | 未执行用例 |
| `python -m pytest tests/contracts/test_golden_fixtures.py -v` | 退出 1，No module named pytest | 未执行用例 |
| `python -m pytest tests/contracts/test_remediation_boundaries.py -v` | 退出 1，No module named pytest | 未执行用例 |
| `pytest -v` | 进程未启动，WinError 2 | 没有 pytest 进程退出码/通过数 |
| 运行态 API 探针 | 退出 1，No module named fastapi | 请求代码尚未执行；没有 HTTP 实测结果 |
| 16 项哈希重算 | 16 一致、0 不一致 | 仅字节一致 |
| JSON / .godmap 清单解析 | 9 个夹具可解析 | 不是模型和服务语义测试 |
| 全部保留独立 .js 的 `node --check` | 56 项、0 失败 | 不含 HTML 内联脚本运行，不是页面交互或功能验收 |

## 二进制与插件排除

- 以全仓磁盘为范围排除 `.git`；检查图片、音视频、字体、压缩包、可执行扩展名，并对非 .pyc 文件扫描 NUL 字节。具体扩展名集合与哈希见原始输出。
- 仅发现 AGENTS.md 的 **3 条精确白名单 .otf** 资源候选，非白名单资源候选 **0**。没有新增、删除或修改字体。
- 单列现有 **33 个 .pyc 运行缓存**，没有把它们误称为源码资源或“全仓只有三个二进制文件”。不读取 Git 对象库，也不承诺识别全部混淆/编码后的二进制。
- 插件协议相关 3 个标记在扫描的源码/静态文本中 0 命中；登记表内插件协议的哈希仅验证排除文档字节，绝不构成实现授权。

## 静态层与契约一致性观察

1. 后端源码装饰器 18 条 method/path；14 条契约路径均存在，完整枚举在重签报告。这里只验证声明，不是服务启动后的路由枚举。
2. V2 projects-controller 的项目创建/编辑/治理调用使用 `/api/asset-registry/...`，若干写操作携带 expected_version（逐行摘录在 supplement）；不因此认定全部鉴权、冲突刷新、功能交互已通过。
3. 静态层还有 `/api/providers`、`/api/asset-auth/...`、`/api/asset-registry/governance/overview` 等调用，所读后端路由及冻结目录没有对应项。属于前后端范围差异；应逐页明确占位/禁用/后续实现，不能将 V2 “保留”解释为这些功能已验收。
4. `/api/` 文字命中 330 行只是词法统计，包含说明与外部 URL，不是 330 个端点或 330 个坏链。仅展示前 45 行样例，未声称完成全部调用图或坏链验证。
5. 主窗口 comfyui/runninghub 的 5 个删除目标均不存在，但 api-settings.js 仍有 2 处已删路径引用；T-scope 报告/注册表缺失，卫生用例旧口径尚允许标记。后续正在修改，不能给最终范围清理 PASS。
6. CAS/202/poll_hint、认证边界的问题及文件行号见重签报告；本任务只报告，不修改代码、契约和他人任务文件。

## 未覆盖项与证据边界

- **本地实测 ≠ 远端 CI ≠ 生产验收。** 本轮本地实测仅包括可执行的脚本/Node/Git；pytest 和 API 测试未成功运行。
- 未执行远端 CI 查询/触发、push、部署、生产验收、浏览器端交互、外部 IdP、依赖安装、许可证全面核验、旧仓源码比对、人工第三方审计。
- 未执行任何 git add / commit / push / remote。未读取旧仓实现或使用旧仓提交历史；未改写他人输出。
- 后续新增/修改文件均不被本报告早先扫描自动覆盖；T-scope 完成后，必须对确定版本重采快照、重跑全量 pytest 和 JS 检查，并请人工外审。
- 发布状态继续 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 原始快照、扫描与失败输出

### snapshot-start

- 命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py snap`
- 开始：2026-09-20T17:59:44.059049+08:00；结束：2026-09-20T17:59:44.302589+08:00
- 退出码：0

标准输出（完整）：
```text
$ git rev-parse HEAD
cde7433cd24e297ceeabd248365908a8da006813
退出码: 0
$ git branch --show-current
master
退出码: 0
$ git status --porcelain -uall
 M CLEANROOM-CHARTER.md
 M CLEANROOM-IMPLEMENTATION-HANDOFF.md
 M CLEANROOM-STATUS.md
 M README.md
 M attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md
 M attestations/reviews/INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md
 M attestations/reviews/PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md
 M docs/design/README.md
 M src/gods_workbench/static/api-settings.html
 D src/gods_workbench/static/comfyui-settings.html
 D src/gods_workbench/static/css/comfyui-settings.css
 D src/gods_workbench/static/js/comfyui-settings.js
 M src/gods_workbench/static/js/hardware-telemetry.js
 M src/gods_workbench/static/js/i18n.js
 D src/gods_workbench/static/js/i18n/comfyui-settings.js
 D src/gods_workbench/static/runninghub/api_providers.json
 M src/gods_workbench/static/v2/index.html
 M src/gods_workbench/static/v2/settings.html
?? .github/workflows/ci.yml
?? docs/governance/AGENT-TASK-2026-09-20.md
?? docs/governance/DEPLOYMENT-ACCEPTANCE-EVIDENCE-2026-09-20.md
?? docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md
?? docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md
?? docs/governance/REMOTE-AND-CI-PLAN-2026-09-20.md
?? docs/governance/agent-reports-2026-09-20/T-fonts.md
?? docs/governance/agent-reports-2026-09-20/T-release-ops.md
?? requirements-dev.txt
?? requirements.txt
warning: unable to access 'C:\Users\qinxuedong/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\qinxuedong/.config/git/ignore': Permission denied
退出码: 0
$ git diff --stat
 CLEANROOM-CHARTER.md                               |    2 +-
 CLEANROOM-IMPLEMENTATION-HANDOFF.md                |    3 +-
 CLEANROOM-STATUS.md                                |    2 +-
 README.md                                          |    3 +-
 ...LEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md |   12 +
 .../INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md      |   12 +
 .../PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md       |   12 +
 .../PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md    |   12 +
 .../PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md     |   12 +
 ...ASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md |   12 +
 docs/design/README.md                              |    2 +-
 src/gods_workbench/static/api-settings.html        |  123 +-
 src/gods_workbench/static/comfyui-settings.html    |  134 -
 src/gods_workbench/static/css/comfyui-settings.css |  243 --
 src/gods_workbench/static/js/comfyui-settings.js   | 1434 ---------
 src/gods_workbench/static/js/hardware-telemetry.js |   32 +-
 src/gods_workbench/static/js/i18n.js               |    1 -
 .../static/js/i18n/comfyui-settings.js             |   72 -
 .../static/runninghub/api_providers.json           | 3165 --------------------
 src/gods_workbench/static/v2/index.html            |   27 -
 src/gods_workbench/static/v2/settings.html         |   27 -
 21 files changed, 85 insertions(+), 5257 deletions(-)
warning: in the working copy of 'src/gods_workbench/static/api-settings.html', LF will be replaced by CRLF the next time Git touches it
退出码: 0
git ls-files -z 退出码: 0 索引路径数: 206 磁盘仍存在: 201 索引列出但磁盘不存在: 5
git ls-files 原始输出 SHA-256: 060786e4802986db9b2ae9b3eb68a11f5671f9c83e4b9f3b7221a6bea29cb619
磁盘文件数（排除 .git，包含忽略缓存）: 284
磁盘文件数（再排除 __pycache__ / .pytest_cache）: 246
静态层磁盘文件数: 108
docs/governance/agent-reports-2026-09-20/T-scope.md 存在=False 
docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md 存在=False 
```

标准错误（完整）：
```text
（空）
```

### snapshot-end

- 命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py snap`
- 开始：2026-09-20T17:59:47.162193+08:00；结束：2026-09-20T17:59:47.407024+08:00
- 退出码：0

标准输出（完整）：
```text
$ git rev-parse HEAD
cde7433cd24e297ceeabd248365908a8da006813
退出码: 0
$ git branch --show-current
master
退出码: 0
$ git status --porcelain -uall
 M CLEANROOM-CHARTER.md
 M CLEANROOM-IMPLEMENTATION-HANDOFF.md
 M CLEANROOM-STATUS.md
 M README.md
 M attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md
 M attestations/reviews/INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md
 M attestations/reviews/PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md
 M docs/design/README.md
 M src/gods_workbench/static/api-settings.html
 D src/gods_workbench/static/comfyui-settings.html
 D src/gods_workbench/static/css/comfyui-settings.css
 D src/gods_workbench/static/js/comfyui-settings.js
 M src/gods_workbench/static/js/hardware-telemetry.js
 M src/gods_workbench/static/js/i18n.js
 D src/gods_workbench/static/js/i18n/comfyui-settings.js
 D src/gods_workbench/static/runninghub/api_providers.json
 M src/gods_workbench/static/v2/index.html
 M src/gods_workbench/static/v2/settings.html
?? .github/workflows/ci.yml
?? docs/governance/AGENT-TASK-2026-09-20.md
?? docs/governance/DEPLOYMENT-ACCEPTANCE-EVIDENCE-2026-09-20.md
?? docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md
?? docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md
?? docs/governance/REMOTE-AND-CI-PLAN-2026-09-20.md
?? docs/governance/agent-reports-2026-09-20/T-fonts.md
?? docs/governance/agent-reports-2026-09-20/T-release-ops.md
?? requirements-dev.txt
?? requirements.txt
warning: unable to access 'C:\Users\qinxuedong/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\qinxuedong/.config/git/ignore': Permission denied
退出码: 0
$ git diff --stat
 CLEANROOM-CHARTER.md                               |    2 +-
 CLEANROOM-IMPLEMENTATION-HANDOFF.md                |    3 +-
 CLEANROOM-STATUS.md                                |    2 +-
 README.md                                          |    3 +-
 ...LEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md |   12 +
 .../INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md      |   12 +
 .../PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md       |   12 +
 .../PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md    |   12 +
 .../PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md     |   12 +
 ...ASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md |   12 +
 docs/design/README.md                              |    2 +-
 src/gods_workbench/static/api-settings.html        |  123 +-
 src/gods_workbench/static/comfyui-settings.html    |  134 -
 src/gods_workbench/static/css/comfyui-settings.css |  243 --
 src/gods_workbench/static/js/comfyui-settings.js   | 1434 ---------
 src/gods_workbench/static/js/hardware-telemetry.js |   32 +-
 src/gods_workbench/static/js/i18n.js               |    1 -
 .../static/js/i18n/comfyui-settings.js             |   72 -
 .../static/runninghub/api_providers.json           | 3165 --------------------
 src/gods_workbench/static/v2/index.html            |   27 -
 src/gods_workbench/static/v2/settings.html         |   27 -
 21 files changed, 85 insertions(+), 5257 deletions(-)
warning: in the working copy of 'src/gods_workbench/static/api-settings.html', LF will be replaced by CRLF the next time Git touches it
退出码: 0
git ls-files -z 退出码: 0 索引路径数: 206 磁盘仍存在: 201 索引列出但磁盘不存在: 5
git ls-files 原始输出 SHA-256: 060786e4802986db9b2ae9b3eb68a11f5671f9c83e4b9f3b7221a6bea29cb619
磁盘文件数（排除 .git，包含忽略缓存）: 284
磁盘文件数（再排除 __pycache__ / .pytest_cache）: 246
静态层磁盘文件数: 108
docs/governance/agent-reports-2026-09-20/T-scope.md 存在=False 
docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md 存在=False 
```

标准错误（完整）：
```text
（空）
```

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

### full-suite

- 命令：`pytest -v`
- 开始：2026-09-20T17:59:44.473750+08:00；结束：2026-09-20T17:59:44.479762+08:00
- 退出码：未启动，无进程退出码
异常说明：采集器捕获进程启动异常；最初控制台的 127 是采集器占位，不是 pytest 真实退出码。

标准输出（完整）：
```text
（空）
```

标准错误（完整）：
```text
PermissionError(13, '拒绝访问。', None, 5, None)```

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

### resources-static-js

- 命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py scan`
- 开始：2026-09-20T17:59:44.479762+08:00；结束：2026-09-20T17:59:47.114160+08:00
- 退出码：0

标准输出（完整）：
```text
资源候选 src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf 字节=9036076 白名单=True SHA-256=0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a
资源候选 src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf 字节=8812324 白名单=True SHA-256=9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a
资源候选 src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf 字节=8806392 白名单=True SHA-256=dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab
资源候选数: 3 非白名单候选数: 0 运行期 .pyc 缓存数（不计入资源授权）: 33
扫描：排除 .git，.pyc 单列；扩展名集合=.7z,.aac,.avi,.avif,.bin,.bmp,.dll,.dylib,.eot,.exe,.flac,.gif,.gz,.heic,.ico,.jpeg,.jpg,.m4a,.mkv,.mov,.mp3,.mp4,.ogg,.otf,.pdf,.png,.psd,.rar,.so,.tar,.tif,.tiff,.ttf,.wasm,.wav,.webm,.webp,.woff,.woff2,.zip；另检所有非 .pyc 文件的 NUL 字节；不等于所有编码资源的完整取证。
插件协议标记命中数: 0

删除路径残留引用数: 2
src/gods_workbench/static/js/api-settings.js:1006: /static/runninghub/
src/gods_workbench/static/js/api-settings.js:2233: /static/runninghub/
删除目标 comfyui-settings.html 仍存在=False
删除目标 css/comfyui-settings.css 仍存在=False
删除目标 js/comfyui-settings.js 仍存在=False
删除目标 js/i18n/comfyui-settings.js 仍存在=False
删除目标 runninghub 仍存在=False
静态 /api/ 文字命中行数: 330 （仅词法观察，不推断完整浏览器调用图）
src/gods_workbench/static/api-settings.html:101: <span class="ms-line">方舟默认请求地址：<span class="inline-code">https://ark.cn-beijing.volces.com/api/v3</span></span>
src/gods_workbench/static/api-settings.html:102: <span class="ms-line">Seedance 视频生成使用方舟 API Key，验证会请求 <span class="inline-code">/api/v3/models</span>。</span>
src/gods_workbench/static/js/api-settings.js:74: const VOLCENGINE_DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
src/gods_workbench/static/js/api-settings.js:926: `/api/runninghub/workflow-info?workflowId=${encodeURIComponent(cleanId)}`,
src/gods_workbench/static/js/api-settings.js:1008: // 静态模板会随 /api/providers 合并返回完整字段；手动粘贴的新卡片通常没有这些配置。
src/gods_workbench/static/js/api-settings.js:1033: await requestJson(`/api/runninghub/workflows/${encodeURIComponent(entryId)}`, {method:'DELETE'}, '删除工作流失败');
src/gods_workbench/static/js/api-settings.js:1153: `/api/runninghub/workflows/${encodeURIComponent(workflowId)}`,
src/gods_workbench/static/js/api-settings.js:1289: `/api/runninghub/app-info?webappId=${encodeURIComponent(appId)}`,
src/gods_workbench/static/js/api-settings.js:1315: const {data} = await requestJson('/api/runninghub/workflows/fetch', {
src/gods_workbench/static/js/api-settings.js:1489: const {data} = await requestJson(`/api/runninghub/workflows/${encodeURIComponent(config.workflowId)}`, {
src/gods_workbench/static/js/api-settings.js:1689: const {data} = await requestJson('/api/ai/upload', {method:'POST', body:form}, '上传失败');
src/gods_workbench/static/js/api-settings.js:1741: const {data} = await requestJson('/api/runninghub/upload-asset', {
src/gods_workbench/static/js/api-settings.js:1820: const endpoint = rhEditorMode === 'workflow' ? '/api/runninghub/workflow-submit' : '/api/runninghub/submit';
src/gods_workbench/static/js/api-settings.js:1845: `/api/runninghub/query?taskId=${encodeURIComponent(taskId)}&job_id=${encodeURIComponent(jobId)}`,
src/gods_workbench/static/js/api-settings.js:2777: const {data} = await requestJson('/api/jimeng/status', undefined, '读取即梦 CLI 状态失败');
src/gods_workbench/static/js/api-settings.js:2793: const {data} = await requestJson('/api/jimeng/login/start', {method:'POST'}, '启动登录失败');
src/gods_workbench/static/js/api-settings.js:2808: const {data} = await requestJson('/api/jimeng/login/status', undefined, '读取登录状态失败');
src/gods_workbench/static/js/api-settings.js:2827: const {data} = await requestJson('/api/jimeng/credit', undefined, '查询余额失败');
src/gods_workbench/static/js/api-settings.js:2838: const {data} = await requestJson('/api/jimeng/logout', {method:'POST'}, '退出登录失败');
src/gods_workbench/static/js/api-settings.js:2860: const {data} = await requestJson('/api/jimeng/help', {
src/gods_workbench/static/js/api-settings.js:2880: const {data} = await requestJson('/api/codex/status', undefined, '读取 GPT CLI 状态失败');
src/gods_workbench/static/js/api-settings.js:2907: const {data} = await requestJson('/api/codex/help', {
src/gods_workbench/static/js/api-settings.js:2927: const {data} = await requestJson('/api/gemini-cli/status', undefined, '读取 Antigravity CLI 状态失败');
src/gods_workbench/static/js/api-settings.js:2954: const {data} = await requestJson('/api/gemini-cli/help', {
src/gods_workbench/static/js/api-settings.js:3084: const {data} = await requestJson('/api/providers/test-connection', {
src/gods_workbench/static/js/api-settings.js:3102: const {data} = await requestJson('/api/providers/probe-async', {
src/gods_workbench/static/js/api-settings.js:3167: const {data} = await requestJson('/api/providers/test-connection', {
src/gods_workbench/static/js/api-settings.js:3321: const {data} = await requestJson('/api/providers/fetch-models', {
src/gods_workbench/static/js/api-settings.js:3831: const {data} = await requestJson('/api/providers', undefined, tr('api.loadFailed'));
src/gods_workbench/static/js/api-settings.js:3901: const {data} = await requestJson('/api/providers', {
src/gods_workbench/static/js/asset-auth/api.js:35: const userUrl = userId => `/api/asset-auth/users/${encodeURIComponent(userId)}`;
src/gods_workbench/static/js/asset-auth/api.js:36: const teamUrl = teamId => `/api/asset-auth/teams/${encodeURIComponent(teamId)}`;
src/gods_workbench/static/js/asset-auth/api.js:40: return request('/api/asset-auth/status', sameOriginInit(init));
src/gods_workbench/static/js/asset-auth/api.js:43: return request('/api/asset-auth/bootstrap', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
src/gods_workbench/static/js/asset-auth/api.js:46: return request('/api/asset-auth/login', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
src/gods_workbench/static/js/asset-auth/api.js:49: return request('/api/asset-auth/users', sameOriginInit(init));
src/gods_workbench/static/js/asset-auth/api.js:52: return request('/api/asset-auth/users', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
src/gods_workbench/static/js/asset-auth/api.js:61: return request('/api/asset-auth/teams', sameOriginInit(init));
src/gods_workbench/static/js/asset-auth/api.js:64: return request('/api/asset-auth/teams', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
src/gods_workbench/static/js/asset-auth/api.js:87: `/api/asset-auth/operation-approvals${suffix ? `?${suffix}` : ''}`,
src/gods_workbench/static/js/asset-auth/api.js:93: `/api/asset-auth/operation-approvals/${encodeURIComponent(approvalId)}`,
src/gods_workbench/static/js/asset-auth/api.js:98: return request('/api/asset-auth/tokens', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
src/gods_workbench/static/js/asset-auth/api.js:101: return request('/api/asset-auth/logout', sameOriginInit({...init, method: 'POST'}));
src/gods_workbench/static/js/asset-manager/api.js:38: return transport.request('/api/ai/upload', {
src/gods_workbench/static/js/asset-manager/api.js:46: return transport.request('/api/canvas-assets/download', jsonInit(payload, {...init, method: 'POST'}));
node --check src/gods_workbench/static/js/api-settings.js 退出码=0
node --check src/gods_workbench/static/js/asset-auth/api.js 退出码=0
node --check src/gods_workbench/static/js/asset-auth/http.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager/api.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager/classification.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager/coverflow.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager/formatters.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager/http.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager/path-utils.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager/storage.js 退出码=0
node --check src/gods_workbench/static/js/asset-manager.js 退出码=0
node --check src/gods_workbench/static/js/asset-review/api.js 退出码=0
node --check src/gods_workbench/static/js/asset-review/http.js 退出码=0
node --check src/gods_workbench/static/js/asset-review.js 退出码=0
node --check src/gods_workbench/static/js/asset-share/api.js 退出码=0
node --check src/gods_workbench/static/js/asset-share/http.js 退出码=0
node --check src/gods_workbench/static/js/asset-share.js 退出码=0
node --check src/gods_workbench/static/js/aura-trace.js 退出码=0
node --check src/gods_workbench/static/js/canvas/http.js 退出码=0
node --check src/gods_workbench/static/js/canvas-list/api.js 退出码=0
node --check src/gods_workbench/static/js/canvas-list/http.js 退出码=0
node --check src/gods_workbench/static/js/canvas-list.js 退出码=0
node --check src/gods_workbench/static/js/context-hotkeys.js 退出码=0
node --check src/gods_workbench/static/js/context-prefetch.js 退出码=0
node --check src/gods_workbench/static/js/directory-settings-nav.js 退出码=0
node --check src/gods_workbench/static/js/episode-liquid-metal.js 退出码=0
node --check src/gods_workbench/static/js/episode-pipeline.js 退出码=0
node --check src/gods_workbench/static/js/floating-dismissal.js 退出码=0
node --check src/gods_workbench/static/js/governance.js 退出码=0
node --check src/gods_workbench/static/js/hardware-telemetry.js 退出码=0
node --check src/gods_workbench/static/js/http-transport.js 退出码=0
node --check src/gods_workbench/static/js/i18n/api-settings.js 退出码=0
node --check src/gods_workbench/static/js/i18n/canvas.js 退出码=0
node --check src/gods_workbench/static/js/i18n/common.js 退出码=0
node --check src/gods_workbench/static/js/i18n/governance.js 退出码=0
node --check src/gods_workbench/static/js/i18n/smart-canvas.js 退出码=0
node --check src/gods_workbench/static/js/i18n/studio.js 退出码=0
node --check src/gods_workbench/static/js/i18n/task-center.js 退出码=0
node --check src/gods_workbench/static/js/i18n-core.js 退出码=0
node --check src/gods_workbench/static/js/i18n.js 退出码=0
node --check src/gods_workbench/static/js/settings.js 退出码=0
node --check src/gods_workbench/static/js/task-center.js 退出码=0
node --check src/gods_workbench/static/js/theme.js 退出码=0
node --check src/gods_workbench/static/js/touch-mouse.js 退出码=0
node --check src/gods_workbench/static/js/workspace-common.js 退出码=0
node --check src/gods_workbench/static/v2/js/agents-controller.js 退出码=0
node --check src/gods_workbench/static/v2/js/assets-controller.js 退出码=0
node --check src/gods_workbench/static/v2/js/collab-controller.js 退出码=0
node --check src/gods_workbench/static/v2/js/home-controller.js 退出码=0
node --check src/gods_workbench/static/v2/js/production-controller.js 退出码=0
node --check src/gods_workbench/static/v2/js/project-date-range.js 退出码=0
node --check src/gods_workbench/static/v2/js/projects-controller.js 退出码=0
node --check src/gods_workbench/static/v2/js/storyboard-controller.js 退出码=0
node --check src/gods_workbench/static/v2/js/v2-shell.js 退出码=0
node --check src/gods_workbench/static/vendor/js/lucide.js 退出码=0
node --check src/gods_workbench/static/vendor/js/three-0.160.0.module.js 退出码=0
JS 检查总数: 56 失败: 0
```

标准错误（完整）：
```text
（空）
```

## 当前快照审计（R2，2026-09-20）

本附录为**追加**，不改写上文任何一行。上文绑定 `cde7433` + 当时脏工作树；本节记录修正后的当前快照实测。

### 本轮实测（Python 3.11，工作目录为本仓根）

| 检查 | 命令 | 结果 |
|---|---|---|
| 全量测试 | `python -m pytest -q --no-header -p no:cacheprovider` | **40 passed** |
| JS 语法 | `node --check`（全部保留 `.js`） | **56 / 56 通过** |
| 二进制白名单 | 全仓扫描（排除 `.git`） | 违规 **0**；仅 3 个白名单 `.otf` |
| 源码残留 | `runninghub` / `comfyui` / `.rh-` | **0** |
| 静态层字节 | `Get-ChildItem -Recurse -File src/gods_workbench/static` | **108 文件 / 35,041,179 字节** |

### 行尾口径

上一版远端 CI 失败由 **CRLF/LF 哈希口径不统一**造成（详见 `PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md` 修正后重签附录）。已新增 `.gitattributes` 并令卫生用例按**内容归一化**计算哈希；Windows 与 LF 检出得到同一结论。

### 边界

本地通过 **≠** 远端 CI **≠** 生产验收。远端结果以 GitHub Actions 实际 run 为准。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
