# Reviewer-1 独立审核报告（2026-09-20）

## 结论

**判定：有条件通过（仅限当前洁净仓本地门禁与静态范围；不构成发布授权）。**

当前工作树的全量测试、卫生测试、JavaScript 语法检查、二进制红线、删除路径与类名一致性均通过。仍有两项文档/治理未闭环：

- **P2：** `TASK-NOTES-2026-09-18.md` §12.5 的静态层总字节数仍是旧值，与当前登记表/磁盘实测不一致。
- **P2：** `HANDOFF-2.md` 明确把 `REVIEW-FINAL.md` 列为“待产出”，该路径当前不存在；因此若把整个索引按“逐条已存在”解释，不能通过。

**证据边界：**以下全部是本地工作树/本地 `.git` 的只读实测（本报告文件除外）。本地实测 ≠ 远端 CI ≠ 生产验收。当前未执行 push、远端 CI 或生产验收；不能据此宣称发布就绪。

---

## P0/P1：未发现

未发现会导致洁净室边界立即失效的 P0，亦未发现当前代码/测试层面的 P1 阻断项。

---

## P2：未闭环项

### P2-1：静态层汇总在历史追加记录中漂移

- **文件/行号：** `docs/governance/TASK-NOTES-2026-09-18.md:663-668`，重点为 `:666`。
- **命令：**
  ```powershell
  python - <<'PY'
  # 递归统计 src/gods_workbench/static 文件数/字节数，并解析 STATIC-SCOPE-REGISTRY
  PY
  Get-Content docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md
  ```
- **原始输出摘要：**
  ```text
  disk_count 108 disk_bytes 35041179
  registry_rows 108 registry_bytes 35041179
  size_mismatch_count 0
  ```
  登记表 `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md:14-20` 也写明合计 `108 / 35041179`；但 `TASK-NOTES...:666` 仍写 `35,024,949`。
- **判定：不一致（P2）。**
- **建议：**仅追加更正注记，说明 CSS 更新后当前值为 `35,041,179` 字节；不要改写 §1–§12.4 历史章节。

### P2-2：HANDOFF-2 的“待产出”路径尚未全部存在

- **文件/行号：** `HANDOFF-2.md:81-86`。
- **命令：**
  ```powershell
  Test-Path docs/governance/agent-reports-2026-09-20/REVIEW-1.md
  Test-Path docs/governance/agent-reports-2026-09-20/REVIEW-FINAL.md
  ```
- **原始输出摘要：**
  ```text
  REVIEW-1.md       => False（本报告写入前）；写入本报告后为 True
  REVIEW-FINAL.md   => False
  ```
  `HANDOFF-2.md:58-79` 的“已存在”索引条目逐条存在；`:83-84` 明确属于“待产出”。
- **判定：条件性不一致（P2）。**
- **说明：**如果“索引”只指“已存在”小节，则通过；如果要求整个索引逐条 `Test-Path` 为 True，则 `REVIEW-FINAL.md` 尚未满足。该文件不应被伪造为已完成。

---

## P3：记录项（不阻断当前本地门禁）

### P3-1：release 参考仓不是干净工作树

- **仓库：** `D:\Working\Code Pro\Gods-Workbench-release`。
- **命令：**
  ```powershell
  git status --porcelain=v1 -uall
  git rev-parse HEAD
  git rev-list --left-right --count HEAD...origin/main
  ```
- **原始输出摘要（审核前后相同）：**
  ```text
  status_count=120
  HEAD=006f3ddce51cd1c022c51f2b963f91380cee6072
  ahead=41  0
  前 5 项：?? _deps.py、?? _e10/add_import.py、?? _e10/assembly_before.py、?? _e10/bind2.py、?? _e10/bindcheck.py
  ```
- **判定：无法验证“从未被写入”；可验证本次审核未改变该快照。**
- **说明：**参考仓在本审核开始时已经有 120 条 dirty/untracked 项；本审核未对其执行写命令。HEAD、ahead 数以及 dirty 条数在审核前后保持一致。该仓状态不能当作干净 release 验收证据。

---

## 逐项审核清单

### 1. 全量 pytest、卫生测试及卫生断言是否收紧

- **命令：**
  ```powershell
  python -m pytest -q --no-header -p no:cacheprovider
  python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q -p no:cacheprovider
  git diff --unified=3 -- tests/hygiene/test_cleanroom_hygiene.py
  ```
- **原始输出摘要（当前稳定工作树复测）：**
  ```text
  40 passed in 0.41s
  6 passed in 0.13s
  ```
  卫生测试新增了删除路径、删除路径引用、`comfyui/runninghub/running-hub` 标识断言；当前 AST 断言数 `HEAD=12`、`current=15`，目标函数断言 `1 -> 4`，没有删除既有断言。
- **判定：一致，PASS。**
- **补充：**首次复跑时工作树 CSS 正在变更，曾得到 `39 passed, 1 failed`（4 个 CSS 旧标识）；随后在当前工作树复测为全绿。报告采用后一次稳定快照。
- **位置：**`tests/hygiene/test_cleanroom_hygiene.py:72-149`。

### 2. 静态层标识与已删文件

- **命令：**
  ```powershell
  # Python 递归扫描 static 下所有 .html/.css/.js
  # Test-Path 五个删除目标
  ```
- **原始输出摘要：**
  ```text
  deleted_paths:
  comfyui-settings.html              False
  css/comfyui-settings.css           False
  js/comfyui-settings.js             False
  js/i18n/comfyui-settings.js        False
  runninghub                       False
  marker_violations []
  ```
- **判定：一致，PASS。**
- **位置：**删除路径由 `tests/hygiene/test_cleanroom_hygiene.py:92-116` 约束；当前静态层无 `comfyui`、`runninghub`、`running-hub` 命中。V2 复核：磁盘 `19` 文件、`git ls-files` `19` 文件，缺失 `0`、未跟踪 `0`。

### 3. api-settings 类名一致性

- **命令：**
  ```powershell
  # 从 api-settings.html / api-settings.js 提取 class 引用，
  # 从 css/api-settings.css 提取 CSS 类选择器，计算差集
  ```
- **原始输出摘要：**
  ```text
  provider refs 21 missing []
  onboarding refs 25 missing []
  htmljs rh refs []
  css old rh count 0
  ```
  关键保留类位于 `api-settings.html:119-159`、`api-settings.js:408-432,630-643`；CSS 中性命名位于 `api-settings.css:354-385,3547-3714` 等范围。
- **判定：一致，PASS。**
- **结论：**共用类已统一为 `provider-key-*`、`provider-card-title-field`、`onboarding-provider-*`；HTML/JS 没有引用已从 CSS 删除的类，也没有遗留 `rh-*` 引用。

### 4. 二进制红线

- **命令：**
  ```powershell
  # 全仓递归扫描受限扩展名，跳过 .git，仅允许 AGENTS.md 三条精确路径
  ```
- **原始输出摘要：**
  ```text
  banned_nonallow []
  all_otf =
    SourceHanSansCN-Bold.otf
    SourceHanSansCN-Medium.otf
    SourceHanSansCN-Normal.otf
  ```
  字节数分别为 `9036076`、`8812324`、`8806392`。
- **判定：一致，PASS。**
- **位置：**`AGENTS.md:13-18`；卫生白名单 `tests/hygiene/test_cleanroom_hygiene.py:18-24`。

### 5. 文档字体口径与 TASK-NOTES §12 追加性

- **命令：**
  ```powershell
  rg -n -i "Source Han|思源|font|字体|otf|woff|ttf|黑体" \
    AGENTS.md CLEANROOM-CHARTER.md CLEANROOM-STATUS.md README.md \
    CLEANROOM-IMPLEMENTATION-HANDOFF.md docs/design/README.md \
    docs/governance/TASK-NOTES-2026-09-18.md
  git diff --unified=3 -- docs/governance/TASK-NOTES-2026-09-18.md
  ```
- **原始输出摘要：**
  ```text
  五份主文档均指向 AGENTS.md §1.2 三条思源黑体白名单；docs/design/README.md:30、:33 明确 Bold/Medium/Normal 与本地 fonts.css。
  TASK-NOTES §12 从 :629 开始，:631 明确“追加记录，不改写 §1–§11”；:668 再声明仅追加。
  ```
- **判定：**字体口径**一致，PASS**；历史追加性**一致，PASS**；但 §12.5 汇总字节数见 P2-1。

### 6. 来源分类与 STATIC-SCOPE-REGISTRY 可复算性

- **命令：**
  ```powershell
  # 递归统计 static；解析 STATIC-SCOPE-REGISTRY；交叉核对 git ls-files
  git ls-files src/gods_workbench/static
  ```
- **原始输出摘要：**
  ```text
  disk_count 108 disk_bytes 35041179
  registry_rows 108 registry_bytes 35041179
  counts={1:2, 2:90, 3:15, 4:1}
  size_mismatch [] ; extra set() ; missing set()
  git ls-files static 113
  tracked_missing = 5 个 comfyui/runninghub 删除路径
  ```
  两个日期选择器 SHA-256 与分类表 `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md:27-34` 登记相同；四类范围见 `:11-18,20-25,40-53`。
- **判定：**当前分类表/登记表与磁盘、`git ls-files` **一致，PASS**；TASK-NOTES 汇总漂移另列 P2-1。

### 7. HANDOFF、P3 快照与 HANDOFF-2 索引

- **命令：**
  ```powershell
  rg -n "状态：已完成|当前 `main.py`|006f3dd|732947|c54f368|文档路径索引|待产出" HANDOFF.md HANDOFF-2.md
  # release 仓：Get-Item main.py；Get-FileHash main.py -Algorithm SHA256；git rev-parse HEAD
  # 对 HANDOFF-2:58-84 的每个路径执行 Test-Path
  ```
- **原始输出摘要：**
  ```text
  HANDOFF.md:5 状态：已完成（本地）
  HANDOFF.md:17 当前 HEAD=006f3dd...，main.py=732947 B，SHA=c54f...
  release 实测：HEAD=006f3dd...；main.py=732947；SHA=c54f...；HEAD...origin/main=41 0
  HANDOFF-2.md:58-79 的已存在清单全部 True；:84 REVIEW-FINAL.md=False
  ```
- **判定：**HANDOFF 状态与当前 release 快照**一致，PASS**；HANDOFF-2 的“已存在”部分**一致**，但全索引逐条存在性按严格口径**不一致，见 P2-2**。

### 8. release 仓只读状态与 main.py 声明

- **命令：**
  ```powershell
  git status --porcelain=v1 -uall
  git rev-parse HEAD
  git rev-list --left-right --count HEAD...origin/main
  Get-Item main.py
  Get-FileHash main.py -Algorithm SHA256
  ```
- **原始输出摘要：**
  ```text
  status_count=120（审核前后相同）
  HEAD=006f3ddce51cd1c022c51f2b963f91380cee6072
  ahead=41 0
  main.py=732947 B
  SHA-256=c54f368a48cd0123a74733d3b0423eebabe7cf9f7e3af98522ff3ed0fee8e89a
  ```
- **判定：**`main.py` 声明**一致，PASS**；本审核未改变 release 仓状态。但 release 工作树本来就 dirty，不能给出“绝对未被写入”的历史证明，见 P3-1。

---

## 未闭环清单

1. 更正 `docs/governance/TASK-NOTES-2026-09-18.md:666` 的静态层字节汇总（只追加注记，不改写历史章节）。
2. 生成 `REVIEW-FINAL.md` 后再将 `HANDOFF-2.md:84` 的待产出项改为真实存在，或保留清晰的“待产出”语义并接受严格索引检查不通过。
3. 远端 push、远端 CI、生产验收仍未执行；不得把本地 `pytest` 40 passed 当作远端/生产证据。

---

## 本次审核写入边界

仅新建：`docs/governance/agent-reports-2026-09-20/REVIEW-1.md`。未执行 git add、commit、push、remote，未修改 release 仓或其它文件。
