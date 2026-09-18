# 第二轮验收审核报告（2026-09-18）

- 审核代理人：本轮最终验收审核代理人（未参与本轮任何编写）
- 审核性质：只读审计；未执行删除、回退、覆盖、`git add` 或 `git commit`
- 审核对象：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`
- 被审裁决：D1 本地二进制仅允许 3 个开源思源黑体、D2 修订 `AGENTS.md` 二进制红线、D3 V2 命名断言改「影视工坊」、D4 清理残留图片；另加 `TASKS.md` 极简重构要求
- 全部结论均由现场命令取证；未采用任何文档自述作为判定依据

## 一、审核范围

| 维度 | 覆盖内容 |
|---|---|
| A 二进制裁决 | 全仓（排除 `.git`）受限扩展名遍历、图片目录清空、12 个被删文件名的引用清查、`AGENTS.md` 第 1 节第 2 条、两个卫生用例白名单实现 |
| B 命名裁决 | 两个测试文件断言、后端 `god_canvas` / `god-canvas` 未被误改、`workshop.html` 独立取证、两文件独立执行 |
| C 文档重构 | `TASKS.md` 结构合规性、`TASK-NOTES-2026-09-18.md` 承接内容、`[x]` 条目证据抽验 |
| D 测试与卫生 | 全量 `pytest`、临时垃圾文件、`.mimosa`、两个前端 JS 语法与一个 JSON 解析 |
| E 遗留项 | `.git` 对象库 P1 独立复算、旧集成标记用例失败登记 |

命令与结果摘要：

- 二进制遍历：`python` 递归脚本，扩展名集合 `{.png,.jpg,.jpeg,.gif,.webp,.bmp,.ico,.ttf,.otf,.woff,.woff2,.eot}`，排除 `.git` 路径分量
- 引用清查：`python` 递归脚本扫描全仓 `.html/.js/.css/.json`（另加 `.py/.md/.txt/.toml/.yml/.yaml` 扩查）
- 测试：`python -m pytest -q --no-header -p no:cacheprovider`
- 定向测试：`python -m pytest -q --no-header -p no:cacheprovider tests/contracts/test_projects_hub_service.py tests/smoke/test_production_smoke.py`
- 前端语法：`node --check <file>`；JSON：`python -c "import json;json.load(open(...,encoding='utf-8'))"`
- Git 取证：`git for-each-ref`、`git rev-list --objects --all --not master`、`git cat-file --batch-check`、`git cat-file -s`、`git count-objects -vH`、`git status --porcelain -uall`、`git diff --name-only abd0e88`、`git diff --shortstat abd0e88`

## 二、逐项复核表

### A. 二进制裁决（D1 / D2 / D4）

| 编号 | 复核项 | 复核命令 | 结果 | 判定 |
|---|---|---|---|---|
| A1 | 全仓排除 `.git` 后只剩 3 个 OTF | `python` 递归遍历（见上） | 命中 3 个文件：`src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf` = 9,036,076 字节；`...-Medium.otf` = 8,812,324 字节；`...-Normal.otf` = 8,806,392 字节。合计 26,654,792 字节（25.42 MiB）。扩充扩展名（含音视频、压缩包、可执行文件）复扫同样仅 3 个 | 一致 |
| A2 | `static/images/` 与 `static/runninghub/thumbnails/` 无图片文件 | `python os.listdir` | 两目录均**存在但条目为 0**（`images` 无任何文件；`thumbnails` 无任何文件）。`git ls-files` 对两目录返回空 | 一致 |
| A3 | 无死链：12 个被删文件名在代码/静态资源中无残留引用 | `python` 递归扫描 154 个 `.html/.js/.css/.json`；另加 `src/`（143 个）+ `tests/` 定向复扫 | 代码/静态资源命中 **0**。全仓含文档扫描命中 43 处，全部位于 `docs/governance/`（42 处）与 `docs/migration/`（1 处），属允许保留的审计登记文字 | 一致 |
| A4 | `AGENTS.md` 第 1 节第 2 条已改为唯一白名单且未放宽 | `python` 严格 UTF-8 解码 + 关键词布尔断言 | 第 12 行为「二进制资源授权边界」；含「除下列 3 个文件之外」「唯一白名单」「逐条精确路径」；15/16/17 行分别列出 3 条 OTF 精确路径；含「除白名单外的字体一律走 CDN 或系统原生字体栈」。不含「任意字体」等放宽表述；无零宽字符、无控制字符、无 NUL | 一致 |
| A5 | 两个卫生用例引入 3 条白名单且白名单外仍严格拦截；`.svg` 未误入 `BANNED_EXTENSIONS` | `python` 行级解析 | `tests/hygiene/test_cleanroom_hygiene.py:20` `ALLOWED_BINARY_ALLOWLIST = {`，21-23 行为 3 条 OTF；非白名单命中一律 append 到 `found_banned` 并断言为空，白名单外仍严格拦截。`BANNED_EXTENSIONS`（第 12 行起）**不含** `.svg`。`tests/hygiene/test_phase6_deep_hygiene.py:31` `allowed_binary_allowlist = {`，32-34 行为 3 条 OTF，`ignored_dirs` 仅排除 `.git` 等构建目录，白名单外同样严格拦截；其 `banned_extensions`（第 22 行起）**不含** `.svg` | 一致（附 1 条命名差异，见 P2-1） |

### B. 命名裁决（D3）

| 编号 | 复核项 | 复核命令 | 结果 | 判定 |
|---|---|---|---|---|
| B6 | 两个测试断言已改「影视工坊」，后端命名断言未被误改 | `Select-String` + `git diff` | `tests/contracts/test_projects_hub_service.py:117` = `assert "影视工坊" in resp_workshop.text`；`tests/smoke/test_production_smoke.py:55` = 同一断言。差异行显示仅把 `assert "god-canvas" in resp_workshop.text` 改为「影视工坊」，注释同步改写。后端 `god_canvas` 包、`routes_god_canvas.py`、`test_god_canvas_service.py`、`test_phase6_deep_hygiene.py` 的 `god-canvas` 断言全部保留未动 | 一致 |
| B7 | `workshop.html` 确实含「影视工坊」 | `Select-String` | 命中 6 处，含第 7 行 `<title>影视工坊 · Gods' Workbench v2</title>`、第 221 行导航文字；该文件不含 `god-canvas` 字符串 | 一致 |
| B8 | 独立跑两个测试文件 | `python -m pytest -q ... <两文件>` | `5 passed in 0.15s`（退出码 0） | 一致 |

### C. TASKS 文档重构

| 编号 | 复核项 | 复核命令 | 结果 | 判定 |
|---|---|---|---|---|
| C9 | `TASKS.md` 结构合规 | `python` 行级结构解析 | 总行数 **14**，非空行 14，任务条数 **12**（T1-T12）。无代码围栏、无表格分隔行、无管道表格、无多行子条目。结构为：第 1 行标题「# 任务台账」+ 第 2 行单行说明（指向 `TASK-NOTES-2026-09-18.md`）+ 第 3-14 行 12 条任务行。最长行 140 字符，每条任务均为单行 | 一致 |
| C10 | `TASK-NOTES-2026-09-18.md` 存在并承接长说明 | `python` 关键词 + 分节解析 | 存在，162 行 / 7,365 字符。§1 受限二进制现状（含 3 条 OTF 逐条字节数与 12 项清理清单）；§2 `.git` 对象库 P1（checkpoint 引用/独占 blob/体积）；§3 V2 命名基线；§4 旧集成标记用例（专项，未完成）；§5 测试基线；§6 交付物清单（目标仓 + 本仓双清单）；§7 变更来源。六项要求全部覆盖 | 一致 |
| C11 | `[x]` 条目证据抽验 | `python` 路径存在性 + 行号比对 | T7 白名单：`AGENTS.md` 含 `ALLOWED_BINARY_ALLOWLIST` 语义描述、两个卫生用例已白名单化，属实；T8 清理：两目录实测空、`vendor/fonts/` 实测仅 3 个 otf，属实；T9 命名：`test_projects_hub_service.py:117` 与 `test_production_smoke.py:55` 实测确为「影视工坊」，行号相符，属实；T1 `/static/` 裸目录 404：实测 `404`，`/` = `307 → /static/v2/projects.html`，属实。T2/T3/T4/T5/T6 所引治理文档均真实存在 | 一致 |

### D. 测试与卫生

| 编号 | 复核项 | 复核命令 | 结果 | 判定 |
|---|---|---|---|---|
| D12 | 全量测试 | `python -m pytest -q --no-header -p no:cacheprovider` | **1 failed / 39 passed in 0.51s**（退出码 1）。唯一失败用例：`tests/hygiene/test_cleanroom_hygiene.py::test_static_layer_has_no_legacy_integration_markers`，断言静态层禁用标记命中约百余处（`lucide`、`runninghub`、`comfyui`、`settings.html`、`asset-manager.html`、`unsplash.com`、`window.v2projects` 等）。该失败已在 `TASK-NOTES` §4 登记为「专项任务，尚未完成」，并在 §5 测试基线中以「1 failed / 39 passed」如实记录，归因亦标注为「与二进制清理、V2 命名无关」。与登记完全吻合，属**既有/专项待办**，非本轮引入 | 一致（如实登记，未隐瞒） |
| D13 | 无临时/垃圾文件；`.mimosa/` 不入 `git status` | `Get-ChildItem -Recurse -Force` + `git status` + `git ls-files` | `tmp_*`、`*.bak`、`*.orig`、`*~`、`audit_snapshot.json`、`*.tmp` 全部 **0 命中**（已排除 `.git`、`node_modules`）；`git ls-files` 亦无此类跟踪文件。`.mimosa` 目录存在于磁盘但 `.gitignore` 含 `.mimosa/`，`git status --porcelain -uall` 中 `mimosa` 命中 **0 次**。另：磁盘存在 `.pytest_cache/`，但不属用户列举的垃圾文件类型，且已被 `.gitignore` 忽略，`git status` 零命中 | 一致 |
| D14 | 前端语法与 JSON 解析 | `node --check` ×2 + `python json.load` | `src/gods_workbench/static/js/api-settings.js` 退出码 0；`src/gods_workbench/static/js/asset-share.js` 退出码 0；`src/gods_workbench/static/runninghub/api_providers.json` 解析成功（顶层为数组） | 一致 |

### E. 遗留项是否被如实登记

| 编号 | 复核项 | 复核命令 | 结果 | 判定 |
|---|---|---|---|---|
| E15 | `.git` 对象库 P1 独立复算并被登记为待确认 | `git for-each-ref` + `git rev-list --objects --all --not master` + `git cat-file --batch-check` + `git cat-file -s` + `git count-objects -vH` | `refs/copilot/checkpoints/**` = **16** 条引用；`--not master` 独占对象 **333**（237 blob / 16 commit / 80 tree）；按扩展名过滤的独占二进制 blob = **13** 个（5 图片 / 5 缩略图 / 3 OTF），逐条 `cat-file -s` 累加 = **26,807,233 字节 = 25.57 MiB**；`count-objects -vH` = 538 个松散对象 / 24.80 MiB / 无 pack。`TASK-NOTES` §2 表格登记为 16 引用、333 对象（237/16/80）、13 个受限二进制 blob、26,807,233 字节 = 25.57 MiB、24.80 MiB，**逐项吻合**。`TASKS.md` T12 标注 `[ ]`「P1，破坏性操作，待用户确认」，`TASK-NOTES` §2 明示「未获用户明确确认前不得执行」 | 一致（未标为已完成） |
| E16 | 旧集成标记用例失败如实登记为专项待办 | `python` 关键词 + 分节解析 + 全量测试 | `TASK-NOTES` §4 标题为「旧集成标记用例（专项，未完成）」，明示「本项为专项任务，尚未完成，改写基线与用例须单独提请审核」；§5 测试基线如实记录该用例为唯一失败项。全量测试实测与之吻合 | 一致（未隐藏） |

### 补充独立取证

| 项目 | 命令 | 结果 |
|---|---|---|
| `workshop.html` 后端命名未被误改 | `Select-String` 全树 | `god_canvas` 包目录、`routes_god_canvas.py`、`test_god_canvas_service.py`、`test_phase6_deep_hygiene.py:85` 的 `god-canvas` 断言均保留 |
| 被删文件备份完整性 | `%TEMP%\gw-image-purge-20260918-090155` + `MANIFEST.txt` | 备份目录存在，含 12 个源文件与 `MANIFEST.txt`；清单 12 行、12 个 SHA-256，字节数与 `TASK-NOTES` §1.2 表格逐条吻合 |
| 全仓 `.svg` 现状 | `python` 递归 | 全仓（排除 `.git`）`.svg` 文件数 = **0**，2 个 `volcengine-theme-*.svg` 已清除 |
| 工作区规模 | `git status --porcelain -uall` / `git diff` | HEAD = `abd0e88`（`master`）；42 个已跟踪文件修改 + 164 个未跟踪 = 206 条；`git diff --shortstat abd0e88` = 42 files changed, 1791 insertions(+), 401 deletions(-) |
| 路由与入口 | `TestClient` | `/static/` = 404；`/` = 307 → `/static/v2/projects.html`；`/static/v2/projects.html` = 200；`/static/v2/workshop.html` = 200 |

## 三、发现问题

### P0（阻断性）

无。本轮 4 项裁决（D1/D2/D3/D4）与 `TASKS.md` 重构要求的落地结果，经逐项独立取证均与要求一致；未发现二进制红线残留、死链、命名误改或遗留项隐瞒。

### P1（须在发布/交付前处置）

1. **`.git` 对象库内嵌二进制仍未处置（破坏性操作，待用户确认）**：`refs/copilot/checkpoints/**` 16 条引用仍使 13 个受限二进制 blob（26,807,233 字节 = 25.57 MiB）在对象库内可达，含 5 张图片、5 张缩略图与 3 个 OTF。已如实登记于 `TASKS.md` T12 与 `TASK-NOTES` §2，但**尚未解决**，属发布前必须由用户明确授权的唯一硬前置。

### P2（文档/工程改进项，不阻断本轮验收）

1. **卫生用例白名单变量命名不统一**：`tests/hygiene/test_cleanroom_hygiene.py` 使用模块级常量 `ALLOWED_BINARY_ALLOWLIST`，而 `tests/hygiene/test_phase6_deep_hygiene.py` 使用函数内局部变量 `allowed_binary_allowlist`。两者语义与 3 条路径完全一致、拦截行为同样严格，仅命名大小写/作用域不同，建议后续统一以便自动化检索与交叉核对。
2. **`TASKS.md` 未为「旧集成标记用例」单列任务行**：该失败已在 `TASK-NOTES` §4 明确登记为专项待办、§5 记录真实测试基线，但 `TASKS.md` 仅 T10-T12 三条待办中无对应用例条目。台账与说明文档之间的可追溯性存在缺口，建议在下一版台账中补一条待办行（保持单行极简格式）。
3. **`TASK-NOTES` §7 变更规模数字已发生快照漂移**：文档记「未跟踪新增文件 163 个；合计 205 条（42 M + 163 ??）」，现场实测为 **164** 个未跟踪、**206** 条（42 M + 164 ??）；差额与 `TASKS.md`（09:13:58）在说明文档（09:12:07）之后落盘相符。`git diff --shortstat abd0e88` 的 42 files changed / 1791 insertions / 401 deletions 与文档一致。建议将该项标注为「截至撰写时快照」或刷新数字。
4. **D4 表述中的图片数量与实测不符**：用户裁决原文为「清理 6 张残留图片（含 2 个 SVG）」，而实际清理文件为 **12 个**（`static/images/` 下 7 个，含 2 个 SVG；`runninghub/thumbnails/` 下 5 个 JPG）。文件名称集合与正文清单（7 + 5 = 12）完全一致，判定以清单为准；此处仅为表述与实测的计数差异，建议在后续登记中统一口径。

## 四、是否可提交结论

### 结论：**可提交（附带前置条件）**

判定依据：

1. 二进制红线（A1-A5）全部通过：工作区（排除 `.git`）仅剩 3 个白名单 OTF，图片目录已清空，12 个被删文件名在代码/静态资源中零残留，`AGENTS.md` 与两个卫生用例均已按唯一白名单收紧，`.svg` 未被误列入禁用扩展名。
2. 命名裁决（B6-B8）全部通过：两处断言已改「影视工坊」，后端 `god_canvas` / `god-canvas` 命名未被误改，两测试文件独立执行 `5 passed`。
3. 文档重构（C9-C11）通过：`TASKS.md` 为 14 行、12 条任务、单行式结构；`TASK-NOTES` 完整承接六类长说明；`[x]` 条目抽验证据真实。
4. 卫生与遗留项（D12-D14、E15-E16）通过：全量测试唯一失败项为已登记专项待办；无临时垃圾文件；`.mimosa` 不入 `git status`；前端语法与 JSON 解析正常；`.git` 对象库 P1 独立复算与登记逐项吻合且未被标为已完成。

### 前置条件（提交前必须满足）

1. **P1 单独处置、不得夹带**：提交本轮工作区变更时，不得同时执行 `.git` 对象库的引用删除 / `reflog expire` / `gc --prune=now`。该项为破坏性操作，须先取得用户明确授权，并建议在提交后单独执行、单独留存执行前后对比记录。
2. **沿用当前发布状态**：维持 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`，在 P1 处置完成前不得添加正式开源许可证或对外发布。
3. **提交前后各跑一次门禁**：提交前 `python -m pytest -q --no-header -p no:cacheprovider` 应稳定为 `1 failed / 39 passed`（唯一失败项为已登记专项待办）；提交后须复跑确认无新增失败。若将「旧集成标记用例」纳入本轮修复范围，须单独提请审核其基线改写方案。
4. **同步刷新文档快照数字**：建议在提交同时（或在提交说明中注明）刷新 `TASK-NOTES` §7 的未跟踪文件数与 `TASKS.md` 台账条数，使台账与实际状态一致。
