# PHASE-5 独立对抗式终审报告（B1，2026-09-21）

## 一、审查范围

审查对象：
- `requirements.lock.hashes`
- `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`
- `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`
- `docs/governance/agent-reports-2026-09-20/T-hashlock.md`
- `docs/governance/agent-reports-2026-09-20/T-linux-closure.md`
- `docs/governance/agent-reports-2026-09-20/T-license-inventory.md`
- `docs/governance/AGENT-TASK-2026-09-21-PHASE5.md`

只读审查；未执行 `git add/commit/push/remote/checkout/restore/reset`，未读取旧仓。除本报告外未修改仓库文件。

## 二、方法

1. PowerShell 原生命令核对文件结构、SHA-256、状态、差异、存在性。
2. `node --check` 遍历全部 `.js`（排除 `.git`）。
3. 以 `py -m pip` 尝试哈希锁验证及 `py -m pytest`；记录真实原始失败输出。
4. 逐项复算 vendor 7 个文件与 prompt-registry 8 个文件哈希；另外检查清单中的相对路径错误。
5. 对 Linux 闭包声明与 `requirements.lock` 主表进行文本/数量/差集交叉核对。
6. 扫描二进制扩展名及根级 `LICENSE`、`THIRD_PARTY_NOTICES.md`。

环境原始输出：
```text
Get-Command python,python3,py,node,git

Name     Source                           Version
py.exe   C:\WINDOWS\py.exe                3.11.9150.1013
node.exe C:\Program Files\nodejs\node.exe 24.20.0.0
git.exe  C:\Program Files\Git\cmd\git.exe 2.53.0.2

node --version
v24.20.0
```

虽然存在 `py.exe` 启动器，但本机没有可用 Python 安装。原文：
```text
py -m pip --version
No installed Python found!
py -m pytest -q --no-header -p no:cacheprovider
No installed Python found!
```
结论：本机 Python 测试/ pip 验证未取得，环境阻塞；不得把报告内历史 Python 数字当成本次实测。

## 三、逐条发现

### A. 结构复核

原始命令输出：
```text
non_comment_lines=31
hash_count=38
uvloop==0.22.1 ; sys_platform != "win32" --hash=sha256:56a2d1fae65fd82197cb8c53c367310b3eabe1bbb9fb5a04d28e3e3520e4f702
requirements.lock main_noncomment=30

Algorithm : SHA256
Hash      : CDF4F469A88BD45D71352335023C11721DB333F85B4E86A718F93463FCB7B087
```

结果：
- 非注释非空行 31，符合“主表 30 + uvloop 1”。
- `--hash=sha256:` 出现 38 次，符合文件声明。
- `uvloop==0.22.1` 存在，并带 `sys_platform != "win32"`。
- 文件 SHA-256 与目标 `cdf4f469a88bd45d71352335023c11721db333f85b4e86a718f93463fcb7b087` 一致（PowerShell 输出大小写不同但值相同）。
- `requirements.lock` 非注释主表为 30 条。

### B1. 哈希锁证伪式抽查

尝试执行：
```text
py -m pip download --require-hashes --no-deps --only-binary=:all: -r requirements.lock.hashes -d %TEMP%\gw-b1-20260921\wheels
No installed Python found!
```

结论：本次无法执行 `pip hash` / `pip download --require-hashes`；不能独立证明任意 wheel 字节与锁中哈希真实匹配。`T-hashlock.md` 的“成功/63 passed”属于历史报告，不是本次复跑证据。

### B2. 15 个本地文件哈希复算

清单表正则解析得到 15 条；其中 vendor 7 条路径可直接解析。prompt-registry 六个 source 条目在清单中写成 `sources/*.json`，相对于仓库根目录并不存在，直接复算结果为 6 个 `MISSING`。原始摘要：
```text
parsed=15
... vendor 7 + manifest.json + NOTICE.md ... match=True
sources/banana-prompt-quicker.json ... actual=MISSING ... match=False
sources/freestylefly-gpt-image-2.json ... actual=MISSING ... match=False
sources/awesome-gpt-image.json ... actual=MISSING ... match=False
sources/awesome-gpt4o-image-prompts.json ... actual=MISSING ... match=False
sources/youmind-gpt-image-2.json ... actual=MISSING ... match=False
sources/youmind-nano-banana-pro.json ... actual=MISSING ... match=False
matches=9/15
three hash length:
64
```

随后按实际仓库前缀 `src/gods_workbench/static/prompt-registry/` 修正路径复算，六个 source 的实际 SHA-256 分别与表值一致：
```text
banana-prompt-quicker.json  0ae590d56820d1d9716691e96410ee6869dec28a7261de397f74ad2f6cbedda5
freestylefly-gpt-image-2.json  6dd7eed617ccd629e2c96e1adeb4cf23640f86d6e1769aaa98ebee9de94e1a30
awesome-gpt-image.json  e5508cad635279cd2c9ddda70d422ad9de8700e7e349e463f2fe433e562a99ec
awesome-gpt4o-image-prompts.json  ece926584179496d426bd9703c0ea30a13b89a9ce0101bb340056d049e58979d
youmind-gpt-image-2.json  4d343babe6bc0e9b5aecc57e2cc7b5afa774a8d386c33f9b3b3a6123f18e748a
youmind-nano-banana-pro.json  61ea3a3a3eba2d9fcb3f21bcaa99a8ac13c720d39b20a7748ce951ddcc3104c9
```

结论：文件内容层面为 15/15 匹配；但清单中的 6 个 source 路径书写不自洽，属于可复算性缺陷，不能按原文路径宣称 15/15 已验证。

### B3. Linux 闭包与主表差集

`requirements.lock` 主表本次复核为 30 条。`LINUX-CLOSURE-2026-09-21.txt` 与 `T-linux-closure.md` 均声明真实 WSL Linux 闭包：`uvloop==0.22.1`，相对主表“仅 Linux +uvloop、仅 Windows -colorama、其余 29 条版本一致”。文本证据还明确指出：按 `requirements-dev.txt` 区间解析的 Linux 闭包不含 colorama，但哈希锁在 Linux 上会因普通条目额外安装 colorama；这属于超集口径差异，报告已登记。

本次没有可用 Python/WSL 运行时，无法重新安装或重算 freeze 差集。因此该差集结论只能标记为“与文件内部陈述一致，未独立复跑”。

### B4. 根级通知文件

原始输出：
```text
Test-Path LICENSE
False
Test-Path THIRD_PARTY_NOTICES.md
False
```

结果：未发现根级 `LICENSE` 或 `THIRD_PARTY_NOTICES.md`，符合任务书“不新增根级许可证/通知文件”的要求；这不等于许可证闭包已完成。

### C. 卫生

全部 JavaScript（排除 `.git`）实跑：
```text
js_count=56
fail_count=0
```

二进制扩展扫描：
```text
binary_candidates=3
src\gods_workbench\static\vendor\fonts\SourceHanSansCN-Bold.otf
src\gods_workbench\static\vendor\fonts\SourceHanSansCN-Medium.otf
src\gods_workbench\static\vendor\fonts\SourceHanSansCN-Normal.otf
```

三者均为 AGENTS.md 精确白名单字体；PowerShell 输出使用反斜杠，规范化后与白名单三条路径一致。未发现图片、音视频、压缩包、可执行文件或其他字体。

### D. Git 状态与差异

原始输出（含 Git 全局忽略文件权限警告）：
```text
warning: unable to access 'C:\Users\qinxuedong/.config/git/ignore': Permission denied
?? docs/governance/AGENT-TASK-2026-09-21-PHASE5.md
?? docs/governance/agent-reports-2026-09-20/T-hashlock.md
?? docs/governance/agent-reports-2026-09-20/T-license-inventory.md
?? docs/governance/agent-reports-2026-09-20/T-linux-closure.md
?? docs/provenance/LINUX-CLOSURE-2026-09-21.txt
?? docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md
?? requirements.lock.hashes

--- NUMSTAT ---
```

结果：当前审查对象全部为未跟踪文件；`git diff --numstat` 对已跟踪文件为空，因此无法据此证明“已跟踪改动纯追加”。这是未跟踪产物，不是已跟踪追加修改。

### E. pytest 门禁

任务书要求 `python -m pytest -q --no-header -p no:cacheprovider`。本机原文为 `No installed Python found!`，本次门禁未取得、不能判定通过。

## 四、证伪记录

1. **哈希锁真实匹配**：失败于本机无 Python；未伪造成功数字。
2. **15 个本地资产哈希**：原始清单路径仅 9/15 可直接命中；修正仓库前缀后 15/15 值匹配。该差异暴露清单路径错误。
3. **uvloop/版本差集**：主表 30 条、锁文件 31 条和文件中 `+uvloop/-colorama/29 条一致`；但本次未取得 Python/WSL 运行时，未独立复跑。
4. **根级许可证通知**：`LICENSE=False`、`THIRD_PARTY_NOTICES.md=False`。
5. **JS 语法**：56 个文件全部 `node --check` 通过。

## 五、夸大或错数之处

1. `T-hashlock.md` 将历史“pip 安装成功、63 passed、哈希强制生效”写成完成结论；本次环境无法取得 Python，不能作为当前独立实测。
2. `T-linux-closure.md` / `LINUX-CLOSURE` 的 WSL 结果在本次未复跑，只能归类为历史/文件内证据，不是 B1 当前复核证据。
3. `THIRD-PARTY-INVENTORY` 统计“15/15 全部实测”在内容上可由加前缀后复算支持，但六个 source 表路径缺少 `src/gods_workbench/static/prompt-registry/` 前缀，按表面路径只能得到 9/15；该表述存在可复算性夸大。
4. “47 个实际资产/依赖条目”是文档口径统计，不代表许可证义务闭环；文档自身已承认闭环为 0 项，不能宣称可发布。
5. `git diff --numstat` 为空不代表未跟踪文件是“纯追加”；它只说明没有已跟踪 diff。

## 六、最终判定

**判定：不可提交。**

理由：
- 必需的本机 Python pytest 门禁未取得，哈希锁 pip 证伪抽查未取得；
- prompt-registry 清单存在 6 个相对路径错误，影响审查可复算性；
- Linux/Windows 闭包与历史 63 passed 数字本次无法独立重跑；
- 许可证闭包文档明确仍有待用户/法务裁决项。

证据边界必须严格区分：
- **本地实测（本次）**：文件结构、SHA-256、JS 语法、状态、根级文件、二进制扫描；
- **历史/文件内证据**：T-hashlock、T-linux-closure、LINUX-CLOSURE 中的 pip/WSL/63 passed；
- **远端 CI**：本次未查询、未验证；
- **生产验收**：未执行。

**不得宣称发布就绪或生产就绪。** 当前最多可称为“部分文档与静态卫生检查通过，关键运行时门禁未闭环”。

## 七、未闭环项

1. 提供可用 Python 3.11 运行时，在干净临时环境重新执行 `pip download --require-hashes`、`pip check`、全量 pytest，并保存原始输出。
2. 在真实 WSL/Linux 重新执行闭包与 freeze 差集，确认 `uvloop`、`colorama` 超集口径。
3. 修正 `THIRD-PARTY-INVENTORY-2026-09-21.md` 六个 source 文件路径，或明确写成仓库根相对完整路径后重新复算。
4. 重新复核所有 15 个资产哈希并保留逐文件原始输出。
5. 许可证/通知正文、Tailwind CDN 固定版本/SRI/传递依赖策略仍待用户/法务裁决。
6. 远端 CI 与生产环境尚未验收；不得由本地文档或静态检查替代。
7. 本报告写入后将新增一个未跟踪审查文件；后续提交前仍须由主代理按文件逐项核对，禁止 `git add -A`。

## 八、R2 复核（2026-09-21）

本节为第二轮独立复核；保留并不采信 R1/主代理自述，仅记录本轮直接命令与输出。

### 1. R1 三项缺陷逐项判定

1. **Three.js SHA-256：未修复（文档仍含非法长度串）**。
   - 命令：
     ```powershell
     $docs=@("docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md","docs/governance/agent-reports-2026-09-20/T-license-inventory.md")
     foreach($f in $docs){$text=Get-Content -Raw $f; foreach($m in [regex]::Matches($text,'(?i)(?<![0-9a-f])[0-9a-f]{40,80}(?![0-9a-f]))'){if($m.Value.Length -ne 64){...}}}
     ```
   - 原文输出：
     ```text
     docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md :: len=65 :: 76dea8151bc9352aeef3528b4262e249b2604f62543828328db978d060d61a495
     ```
   - 该串位于 inventory 第 138 行的“修正前登记”历史说明中；因此 A 项“所有 40–80 位十六进制串长度均为 64”仍不成立。当前资产表中的 Three.js 64 位串为 `76dea8151bc9352aeef3528b4262e249b2604f62543828328db978d060d61a495`，磁盘复算为同值；但文档整体仍有 65 位串，不能判定已修复。

2. **6 个 `sources/*.json` 路径：已修复**。
   - 机械读取 inventory 资产表中原文字面路径，不添加前缀：
     ```text
     ASSET_ROWS=15 HITS=15
     ```
   - 结论：**按原文路径即 15/15**。6 个 `src/gods_workbench/static/prompt-registry/sources/*.json` 均 `Test-Path=True`，并逐项 SHA-256 与登记值一致；vendor 7 项及 prompt-registry 8 项合计亦为 15/15。

3. **四个依赖文件首行编码声明：文件级已修复；行尾卫生未完全修复**。
   - 首行均为 `# -*- coding: utf-8 -*-`，首字节均为 `23-20-2D-2A-2D-20-63-6F-64-69-6E-67-3A-20-75-74`，无 BOM。
   - 原文行尾检查：
     ```text
     requirements.txt CR=3 LF=8
     requirements-dev.txt CR=0 LF=5
     requirements.lock CR=0 LF=91
     requirements.lock.hashes CR=0 LF=52
     ```
   - `requirements.txt` 存在 3 个 CR 字节，构成混合 CRLF/LF；与 `.gitattributes` 的 `* text=auto eol=lf` 不符。因此只能判定“首行声明已修复”，不能判定 C 项整体通过。

### 2. Python / pip 独立验证边界

按要求首次尝试绝对路径命令：

```powershell
& 'C:\Users\qinxuedong\AppData\Local\Programs\Python\Python311\python.exe' -V
```

原文输出：

```text
ResourceUnavailable:
Program 'python.exe' failed to run: An error occurred trying to start process 'C:\Users\qinxuedong\AppData\Local\Programs\Python\Python311\python.exe' with working directory 'D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear'. 拒绝访问。
```

随后 `python -V`、`python3 -V` 均“未识别为 cmdlet”，`py -V` 原文输出 `No installed Python found!`。故 Python **无法独立取得**；编码修复无法由我独立运行 pip 验证，只能作文件级复核；未创建 venv，未执行 `pip install --dry-run`。

### 3. 卫生复跑

- 全部 `.js`：`node --check` 逐文件执行，原文摘要：`JS_TOTAL=56 JS_BAD=0`。
- 二进制红线扫描：`BINARY_TOTAL=3 BINARY_VIOLATIONS=0`；仅命中白名单三条 Source Han Sans CN `.otf`。
- 根级发布文件：`LICENSE=False THIRD_PARTY_NOTICES=False`。
- 本轮复跑 `git status --porcelain -uall` 原文：
  ```text
   M requirements-dev.txt
   M requirements.lock
   M requirements.txt
  ?? attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md
  ?? docs/governance/AGENT-TASK-2026-09-21-PHASE5.md
  ?? docs/governance/agent-reports-2026-09-20/T-hashlock.md
  ?? docs/governance/agent-reports-2026-09-20/T-license-inventory.md
  ?? docs/governance/agent-reports-2026-09-20/T-linux-closure.md
  ?? docs/provenance/LINUX-CLOSURE-2026-09-21.txt
  ?? docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md
  ?? requirements.lock.hashes
  ```
  另有 Git 全局 ignore 文件权限警告，不影响上述状态读取。

### 4. `requirements.lock.hashes` 复算

```text
NONCOMMENT_LINES=31
HASH_SHA256_COUNT=38
UVLOOP_LINE=uvloop==0.22.1 ; sys_platform != "win32" --hash=sha256:56a2d1fae65fd82197cb8c53c367310b3eabe1bbb9fb5a04d28e3e3520e4f702
FILE_SHA256=0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56
```

目标文件 SHA-256 **匹配**；非注释行数 31、hash 次数 38，`uvloop` 带 `sys_platform != "win32"`。由于无 Python，未作 pip 语义解析。

### 5. 证据边界与最终判定

- **本地实测**：两份清单正则抽取、磁盘 SHA-256、原文字面路径 `Test-Path`、四文件首行/字节/行尾、Node JS 语法、二进制红线、根级文件、git status、hash-lock 指标。
- **历史文件证据**：R1 报告及清单中“修正前登记”等文字；本轮仅把它作为被审查文本，不视为运行时验证。
- **远端 CI**：未查。
- **生产验收**：未做。

**最终判定：不可提交。** 直接阻断理由至少有两项：
1. inventory 文档仍包含 65 位十六进制串，A 项未闭合；
2. `requirements.txt` 含 3 个 CR 字节，未满足声明的 LF 行尾卫生；
3. Python 不可用，pip 编码修复无法独立验证。
#### 附：15 个原文路径逐条磁盘复算摘要

```text
src/gods_workbench/static/vendor/MANIFEST.md | 1148e1d02d166783784fd2efccf290c322931ddf9a4061b3b4548bd49581c648
src/gods_workbench/static/vendor/css/fonts.css | 0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3
src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf | 0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a
src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf | 9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a
src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf | dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab
src/gods_workbench/static/vendor/js/lucide.js | 187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040
src/gods_workbench/static/vendor/js/three-0.160.0.module.js | 76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
src/gods_workbench/static/prompt-registry/manifest.json | f0c938b5a4102ec71b15daa755f7a3ba10e19445a9b2ea15bfc108aaaa93f349
src/gods_workbench/static/prompt-registry/NOTICE.md | 297c53ac333bbcb1a4942fdcea7f84afd9da78f0952b731652c8f03c6b0652d9
src/gods_workbench/static/prompt-registry/sources/banana-prompt-quicker.json | 0ae590d56820d1d9716691e96410ee6869dec28a7261de397f74ad2f6cbedda5
src/gods_workbench/static/prompt-registry/sources/freestylefly-gpt-image-2.json | 6dd7eed617ccd629e2c96e1adeb4cf23640f86d6e1769aaa98ebee9de94e1a30
src/gods_workbench/static/prompt-registry/sources/awesome-gpt-image.json | e5508cad635279cd2c9ddda70d422ad9de8700e7e349e463f2fe433e562a99ec
src/gods_workbench/static/prompt-registry/sources/awesome-gpt4o-image-prompts.json | ece926584179496d426bd9703c0ea30a13b89a9ce0101bb340056d049e58979d
src/gods_workbench/static/prompt-registry/sources/youmind-gpt-image-2.json | 4d343babe6bc0e9b5aecc57e2cc7b5afa774a8d386c33f9b3b3a6123f18e748a
src/gods_workbench/static/prompt-registry/sources/youmind-nano-banana-pro.json | 61ea3a3a3eba2d9fcb3f21bcaa99a8ac13c720d39b20a7748ce951ddcc3104c9
```
以上 15 行均为原文表路径直接 `Test-Path` 命中，并与同路径 `Get-FileHash -Algorithm SHA256` 值一致。
## 九、R3 收口复核（2026-09-21）

### 1. 三份清单十六进制串正则核对：未闭合

命令：
```powershell
$files=@('docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md','docs/governance/agent-reports-2026-09-20/T-license-inventory.md','docs/governance/agent-reports-2026-09-20/T-hashlock.md'); $rx='(?<![0-9a-f])[0-9a-f]{40,80}(?![0-9a-f])'; foreach($f in $files){ $t=[IO.File]::ReadAllText((Join-Path (Get-Location) $f)); $ms=[regex]::Matches($t,$rx); $vals=$ms|ForEach-Object Value|Sort-Object -Unique; "FILE: $f"; $vals|Where-Object {$_.Length -ne 64 -and $_.Length -ne 40 -and $_.Length -ne 72}|ForEach-Object {"NON_EXPECTED length=$($_.Length) value=$_"}; "ALL_MATCH_COUNT=$($vals.Count)"; "HAS_65=$([bool]($vals|Where-Object Length -eq 65))" }
```

原文输出：
```text
FILE: docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md
NON_EXPECTED length=47 value=f3528b4262e249b2604f62543828328db978d060d61a495
ALL_MATCH_COUNT=17
HAS_65=False
FILE: docs/governance/agent-reports-2026-09-20/T-license-inventory.md
ALL_MATCH_COUNT=15
HAS_65=False
FILE: docs/governance/agent-reports-2026-09-20/T-hashlock.md
NON_EXPECTED length=47 value=f3528b4262e249b2604f62543828328db978d060d61a495
ALL_MATCH_COUNT=6
HAS_65=False
```

结论：三份文件均**不存在 65 位串**；但前述两个文件仍各含一个 47 位串，故本项**未闭合**。40 位提交哈希与 72 位 `deadbeef` 篡改实验前缀按题设视为预期。

### 2. 四个 requirements 文件行尾字节统计：已闭合

命令：
```powershell
$reqs=@('requirements.txt','requirements-dev.txt','requirements.lock','requirements.lock.hashes'); foreach($f in $reqs){$p=Join-Path (Get-Location) $f;$raw=[IO.File]::ReadAllText($p);$b=[IO.File]::ReadAllBytes($p);$cr=($b|Where-Object {$_ -eq 13}).Count;$lf=($b|Where-Object {$_ -eq 10}).Count;$crlf=0;for($i=0;$i -lt $b.Length-1;$i++){if($b[$i]-eq 13 -and $b[$i+1]-eq 10){$crlf++}};"FILE: $f";"RAW_LENGTH=$($raw.Length) BYTE_LENGTH=$($b.Length) CR=$cr LF=$lf CRLF=$crlf";"EOL_LF_ONLY=$($cr -eq 0 -and $crlf -eq 0)}
```

原文输出：
```text
FILE: requirements.txt
RAW_LENGTH=172 BYTE_LENGTH=242 CR=0 LF=8 CRLF=0
EOL_LF_ONLY=True
FILE: requirements-dev.txt
RAW_LENGTH=87 BYTE_LENGTH=109 CR=0 LF=5 CRLF=0
EOL_LF_ONLY=True
FILE: requirements.lock
RAW_LENGTH=2253 BYTE_LENGTH=2769 CR=0 LF=91 CRLF=0
EOL_LF_ONLY=True
FILE: requirements.lock.hashes
RAW_LENGTH=4538 BYTE_LENGTH=5016 CR=0 LF=52 CRLF=0
EOL_LF_ONLY=True
```

结论：四个文件均为 LF-only，满足 `.gitattributes` 的 `* text=auto eol=lf`；`requirements.txt` 的 CR 计数为 **0**。本项**已闭合**。

### 3. 四个文件首行与 BOM：已闭合

命令：
```powershell
$reqs=@('requirements.txt','requirements-dev.txt','requirements.lock','requirements.lock.hashes'); foreach($f in $reqs){$p=Join-Path (Get-Location) $f;$b=[IO.File]::ReadAllBytes($p);$lines=[IO.File]::ReadAllLines($p);$b0=if($b.Length -gt 0){$b[0]}else{-1};$b1=if($b.Length -gt 1){$b[1]}else{-1};$b2=if($b.Length -gt 2){$b[2]}else{-1};"FILE: $f";"FIRST_LINE=<$($lines[0])>";"FIRST3=[$b0,$b1,$b2] BOM_UTF8=$($b0 -eq 239 -and $b1 -eq 187 -and $b2 -eq 191)"}
```

原文输出：
```text
FILE: requirements.txt
FIRST_LINE=<# -*- coding: utf-8 -*->
FIRST3=[35,32,45] BOM_UTF8=False
FILE: requirements-dev.txt
FIRST_LINE=<# -*- coding: utf-8 -*->
FIRST3=[35,32,45] BOM_UTF8=False
FILE: requirements.lock
FIRST_LINE=<# -*- coding: utf-8 -*->
FIRST3=[35,32,45] BOM_UTF8=False
FILE: requirements.lock.hashes
FIRST_LINE=<# -*- coding: utf-8 -*->
FIRST3=[35,32,45] BOM_UTF8=False
```

结论：四个文件首行均为 `# -*- coding: utf-8 -*-`，前三字节均为 `[35,32,45]`，无 UTF-8 BOM。本项**已闭合**。

### 4. `requirements.lock.hashes` 完整性指标：已闭合

命令：
```powershell
$p=Join-Path (Get-Location) 'requirements.lock.hashes';$lines=[IO.File]::ReadAllLines($p);$n=@($lines|Where-Object {$_.Trim() -ne '' -and -not $_.Trim().StartsWith('#')}).Count;$hc=([regex]::Matches([IO.File]::ReadAllText($p),'--hash=sha256:')).Count;$uv=@($lines|Where-Object {$_ -match 'uvloop'});$sha=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant();"NONCOMMENT_LINES=$n";"SHA256_HASH_COUNT=$hc";'UVLOOP_LINES:';$uv|ForEach-Object{$_};"UVLOOP_HAS_SYS_PLATFORM_WIN32=$([bool]($uv|Where-Object {$_ -match 'sys_platform != "win32"'}))";"FILE_SHA256=$sha"
```

原文输出：
```text
NONCOMMENT_LINES=31
SHA256_HASH_COUNT=38
UVLOOP_LINES:
# 说明：uvloop 行带环境标记 sys_platform != "win32"，避免在 Windows 被强制安装（已实测：无标记时 Windows 安装报 hash 不符，因为 uvloop 不发布 win wheel）。
#   * 额外并 `uvloop==0.22.1`（仅非 Windows 平台出现于 uvicorn[standard] 闭包）。
uvloop==0.22.1 ; sys_platform != "win32" --hash=sha256:56a2d1fae65fd82197cb8c53c367310b3eabe1bbb9fb5a04d28e3e3520e4f702
UVLOOP_HAS_SYS_PLATFORM_WIN32=True
FILE_SHA256=0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56
```

结论：非注释行数、hash 次数、`uvloop` 平台标记及文件 SHA-256 均与目标一致。本项**已闭合**。

### R3 总判定与证据边界

就**本轮 4 项可独立核对事项**而言，**仍有未闭合项**：仅第 1 项仍发现 47 位十六进制串；其余 3 项已闭合。

重申证据边界：我在沙箱内**无法**独立运行 pip/pytest，因此对“按锁重装成功、63 passed”只能标注为**主代理自述证据，未经我独立复现**；远端 CI 与生产验收未做。

## 十、R4 最终收口确认（2026-09-21）

### 1. 六份 Phase 5 文件十六进制串长度核对

**结论：已闭合。** 使用用户指定正则 `(?<![0-9a-f])[0-9a-f]{20,80}(?![0-9a-f])` 抽取全部十六进制串；除 `T-hashlock.md` 中长度 72 的 `deadbeef...` 篡改实验串（预期例外）外，未发现长度不属于 `{40, 64}` 的串。

命令（原文）：
```powershell
$files=@('docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md','docs/governance/agent-reports-2026-09-20/T-license-inventory.md','docs/governance/agent-reports-2026-09-20/T-hashlock.md','docs/governance/agent-reports-2026-09-20/T-linux-closure.md','docs/provenance/LINUX-CLOSURE-2026-09-21.txt','requirements.lock.hashes'); $rx='(?<![0-9a-f])[0-9a-f]{20,80}(?![0-9a-f])'; $out = foreach($f in $files){ $t=[IO.File]::ReadAllText((Join-Path (Get-Location) $f)); $ms=[regex]::Matches($t,$rx); $vals=@($ms|ForEach-Object Value); $uniq=@($vals|Sort-Object -Unique); "FILE: $f"; "MATCH_COUNT=$($vals.Count) UNIQUE_COUNT=$($uniq.Count)"; $uniq | ForEach-Object { "HEX length=$($_.Length) value=$_" }; $bad=@($uniq|Where-Object {$_.Length -notin @(40,64)}); "OUTSIDE_40_OR_64_COUNT=$($bad.Count)"; $bad | ForEach-Object { "OUTSIDE length=$($_.Length) value=$_" }; Write-Output '' }; $out | Tee-Object -FilePath (Join-Path $tmp 'regex-output.txt'); Write-Output "OUTPUT_FILE=$(Join-Path $tmp 'regex-output.txt')"
```

原文输出：
```textFILE: docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md
MATCH_COUNT=17 UNIQUE_COUNT=16
HEX length=64 value=0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3
HEX length=64 value=0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a
HEX length=64 value=0ae590d56820d1d9716691e96410ee6869dec28a7261de397f74ad2f6cbedda5
HEX length=64 value=1148e1d02d166783784fd2efccf290c322931ddf9a4061b3b4548bd49581c648
HEX length=64 value=187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040
HEX length=64 value=297c53ac333bbcb1a4942fdcea7f84afd9da78f0952b731652c8f03c6b0652d9
HEX length=64 value=4d343babe6bc0e9b5aecc57e2cc7b5afa774a8d386c33f9b3b3a6123f18e748a
HEX length=64 value=61ea3a3a3eba2d9fcb3f21bcaa99a8ac13c720d39b20a7748ce951ddcc3104c9
HEX length=64 value=6dd7eed617ccd629e2c96e1adeb4cf23640f86d6e1769aaa98ebee9de94e1a30
HEX length=64 value=702d43e1146d42567b795c735bf50dec550901e34aff270656a4b4efc9dbbd2e
HEX length=64 value=76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
HEX length=64 value=9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a
HEX length=64 value=dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab
HEX length=64 value=e5508cad635279cd2c9ddda70d422ad9de8700e7e349e463f2fe433e562a99ec
HEX length=64 value=ece926584179496d426bd9703c0ea30a13b89a9ce0101bb340056d049e58979d
HEX length=64 value=f0c938b5a4102ec71b15daa755f7a3ba10e19445a9b2ea15bfc108aaaa93f349
OUTSIDE_40_OR_64_COUNT=0

FILE: docs/governance/agent-reports-2026-09-20/T-license-inventory.md
MATCH_COUNT=15 UNIQUE_COUNT=15
HEX length=64 value=0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3
HEX length=64 value=0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a
HEX length=64 value=0ae590d56820d1d9716691e96410ee6869dec28a7261de397f74ad2f6cbedda5
HEX length=64 value=1148e1d02d166783784fd2efccf290c322931ddf9a4061b3b4548bd49581c648
HEX length=64 value=187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040
HEX length=64 value=297c53ac333bbcb1a4942fdcea7f84afd9da78f0952b731652c8f03c6b0652d9
HEX length=64 value=4d343babe6bc0e9b5aecc57e2cc7b5afa774a8d386c33f9b3b3a6123f18e748a
HEX length=64 value=61ea3a3a3eba2d9fcb3f21bcaa99a8ac13c720d39b20a7748ce951ddcc3104c9
HEX length=64 value=6dd7eed617ccd629e2c96e1adeb4cf23640f86d6e1769aaa98ebee9de94e1a30
HEX length=64 value=76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
HEX length=64 value=9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a
HEX length=64 value=dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab
HEX length=64 value=e5508cad635279cd2c9ddda70d422ad9de8700e7e349e463f2fe433e562a99ec
HEX length=64 value=ece926584179496d426bd9703c0ea30a13b89a9ce0101bb340056d049e58979d
HEX length=64 value=f0c938b5a4102ec71b15daa755f7a3ba10e19445a9b2ea15bfc108aaaa93f349
OUTSIDE_40_OR_64_COUNT=0

FILE: docs/governance/agent-reports-2026-09-20/T-hashlock.md
MATCH_COUNT=6 UNIQUE_COUNT=5
HEX length=64 value=0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56
HEX length=64 value=117bac03a25ede5df5440e855b32d556049ca169ead221505badf432fed4b101
HEX length=64 value=76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
HEX length=64 value=cdf4f469a88bd45d71352335023c11721db333f85b4e86a718f93463fcb7b087
HEX length=72 value=deadbeef117bac03a25ede5df5440e855b32d556049ca169ead221505badf432fed4b101
OUTSIDE_40_OR_64_COUNT=1
OUTSIDE length=72 value=deadbeef117bac03a25ede5df5440e855b32d556049ca169ead221505badf432fed4b101

FILE: docs/governance/agent-reports-2026-09-20/T-linux-closure.md
MATCH_COUNT=1 UNIQUE_COUNT=1
HEX length=64 value=56a2d1fae65fd82197cb8c53c367310b3eabe1bbb9fb5a04d28e3e3520e4f702
OUTSIDE_40_OR_64_COUNT=0

FILE: docs/provenance/LINUX-CLOSURE-2026-09-21.txt
MATCH_COUNT=1 UNIQUE_COUNT=1
HEX length=64 value=56a2d1fae65fd82197cb8c53c367310b3eabe1bbb9fb5a04d28e3e3520e4f702
OUTSIDE_40_OR_64_COUNT=0

FILE: requirements.lock.hashes
MATCH_COUNT=38 UNIQUE_COUNT=38
HEX length=64 value=0c84bdef916556cbe1d5a43b423398be4dd3cba6522b463e53d848578b920695
HEX length=64 value=117bac03a25ede5df5440e855b32d556049ca169ead221505badf432fed4b101
HEX length=64 value=2363c69b61c4a97c838da3b130dcd6468f4848992b21a82f2a63ec34377137d9
HEX length=64 value=255bc9599cf7748b4b1a446ccc735421bd08a2ae529a8b88597d3de5664ee360
HEX length=64 value=2d400746a40668fc9dec9810239072b40b4484b640a8c38fd654a024c7a1bf55
HEX length=64 value=346a034f080da3755d8e9cb5e00e8b07de1d39e4f6e2c87d8ab7cafa0b269a73
HEX length=64 value=34e261f78cb6ceaaa36f42f2613f4380d94d9c759a9c73c769ee6e0247364632
HEX length=64 value=37a86b45efb9a47a61a36449063e8e18d0cab3161329fc099eb21783169c4f0c
HEX length=64 value=397655da831414d165029da9bc483bed2fe0e75dde6a1523ec2fe63f3c46046b
HEX length=64 value=40375c2d05acec10323e45dfe2077ac44bc74659008614af5069034e2cfc781c
HEX length=64 value=42a1e5f98abb6391717978baf9f90dc28a743b7d9be7f0751a6f56a75d14065b
HEX length=64 value=42f6930c31dc7f50732c9ae793c2786c7b6b044195967bbdde40bb9be81c4cc0
HEX length=64 value=481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8
HEX length=64 value=49776eab08766a08dfff7012f8b422dcd7e25e43b316eedf0477c24fcfa84b7c
HEX length=64 value=4f1d9991f5acc0ca119f9d443620b77f9d6b33703e51011c16baf57afb285fc6
HEX length=64 value=56a2d1fae65fd82197cb8c53c367310b3eabe1bbb9fb5a04d28e3e3520e4f702
HEX length=64 value=57278e6fa0424c42a8a3e454828ab4f0aff27b40cddf9679579b98c6dce6a376
HEX length=64 value=6152fdbbf9a77fdec97731721bebf7c4c44f7c29b424b0065826173efc7ed101
HEX length=64 value=62f22742b58a1a33014a2b6b706588a8d7e2a88ae7bd1a6ebe8c992928483775
HEX length=64 value=63cf8bbe7522de3bf65932fda1d9c2772064ffb3dae62d55932da54b31cb6c86
HEX length=64 value=65b8397ba37ccbce054456aaccddfc91e6e3083c92824df348d96ca832f3f147
HEX length=64 value=904552145e8bfed22162c09dab1c2b9b54fefa7b23ba780f4f26ca0316b0f0d9
HEX length=64 value=9f3bfb4965eb874431221a3ff3fdcddc7e74e3b07799e0e84ca4a0f867d449bf
HEX length=64 value=a1b4c8e7a489a0d750d91894e9a8cdc295838f1924c0ca903ae993456fddec07
HEX length=64 value=a711b51aec4370d0dcda5b6c09463206f133a5759341d7744b953a7b62e1100e
HEX length=64 value=a86dd39d14bb45f85a3d18525215a9ef0cfd1f192ac793220e72598c90335f0c
HEX length=64 value=ab7ae7122974553370f0bdb919e1a960b2cd1bc1ef0276416d896db81c14582c
HEX length=64 value=b1bc819c6db90e8f91a38250a1ab4c058261871aa52d2fe36382eddedf146dee
HEX length=64 value=b727414169a36b7d524c1c3e31839a521725078d7b2ff038656844266160a992
HEX length=64 value=b8bb0864c5a28024fac8a632c443c87c5aa6f215c0b126c449ae1a150412f31d
HEX length=64 value=bfb91aa2d334c61cb35ba9a116fc123b3d3df31640b801cf57a7a78ec3f603b3
HEX length=64 value=d7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c
HEX length=64 value=d909fcccc110f8c7faf814ca82a9a4d816bc5a6dbfea25d6591d6985b8ba59ad
HEX length=64 value=dbd6c97045dad81227c8d040173da044c1de08de64a5ea8b555da4aee1d5fa22
HEX length=64 value=e8dca71ec86dce5f04e333f0d56cdedf942446e6643b9cea1af0d6d3a02cb03e
HEX length=64 value=e920276dd6813095e9377c0bc5566d94c932c33b27a3e3945d8389c374dd4746
HEX length=64 value=f072f4d804ea359e4eaf198b1af7a8b0943881a87f31bb764f8bf219bb9419e0
HEX length=64 value=f631c04d2c48c52b84d0d0549c99ff3859c98df65b3101406327ecc7d53fbf12
OUTSIDE_40_OR_64_COUNT=0

```

逐文件判定：
- `THIRD-PARTY-INVENTORY-2026-09-21.md`：`OUTSIDE_40_OR_64_COUNT=0`。
- `T-license-inventory.md`：`OUTSIDE_40_OR_64_COUNT=0`。
- `T-hashlock.md`：仅 1 条长度 72 的 `deadbeef117bac03a25ede5df5440e855b32d556049ca169ead221505badf432fed4b101`，属预期篡改实验例外；除此之外均为 64 位。
- `T-linux-closure.md`：`OUTSIDE_40_OR_64_COUNT=0`。
- `LINUX-CLOSURE-2026-09-21.txt`：`OUTSIDE_40_OR_64_COUNT=0`。
- `requirements.lock.hashes`：`OUTSIDE_40_OR_64_COUNT=0`。

### 2. 15 个资产哈希与锁文件 SHA-256

**结论：已闭合。** 按报告原文表路径逐条复算，`ASSET_ROWS=15 HITS=15`，15/15 命中登记值。

命令（原文）：
```powershell
$assets=@((...原文表中的 15 个路径及登记 SHA-256...)); $hits=0; foreach($a in $assets){$p=$a[0];$expected=$a[1];$exists=Test-Path -LiteralPath $p; if($exists){$actual=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant();$ok=$actual -eq $expected}else{$actual='MISSING';$ok=$false}; if($ok){$hits++}; "PATH=$p`nEXISTS=$exists`nEXPECTED=$expected`nACTUAL=$actual`nMATCH=$ok"}; "ASSET_ROWS=$($assets.Count) HITS=$hits"; $req=(Get-FileHash -Algorithm SHA256 -LiteralPath 'requirements.lock.hashes').Hash.ToLowerInvariant(); "REQUIREMENTS_LOCK_HASHES_SHA256=$req"
```

原文输出（逐项均 `MATCH=True`，末行汇总）：
```text
ASSET_ROWS=15 HITS=15
REQUIREMENTS_LOCK_HASHES_SHA256=0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56
```

本轮两项总判定：**全部闭合**。

重申：`pytest`/`pip` 结果无法由本独立终审代理复现，属主代理自述证据；远端 CI 与生产验收未做。

### 2A. 资产复算命令原文补录（以本小节为准）

上一小节的 `(...原文表中的 15 个路径及登记 SHA-256...)` 仅为排版占位；以下为本次实际执行的完整命令与原文输出：

```powershell
$lines=Get-Content 'attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md';$rows=$lines[308..322]|ForEach-Object{$x=$_ -split '\s+\|\s+',2;[pscustomobject]@{Path=$x[0].Trim();Expected=$x[1].Trim()}};$hits=0;$out=foreach($r in $rows){$a=(Get-FileHash -Algorithm SHA256 -LiteralPath $r.Path).Hash.ToLowerInvariant();$ok=$a -eq $r.Expected;if($ok){$hits++};"$($r.Path) | $a | MATCH=$ok"};$out;"ASSET_ROWS=$($rows.Count) HITS=$hits";"REQUIREMENTS_LOCK_HASHES_SHA256=$((Get-FileHash -Algorithm SHA256 -LiteralPath 'requirements.lock.hashes').Hash.ToLowerInvariant())"
```

```text
src/gods_workbench/static/vendor/MANIFEST.md | 1148e1d02d166783784fd2efccf290c322931ddf9a4061b3b4548bd49581c648 | MATCH=True
src/gods_workbench/static/vendor/css/fonts.css | 0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3 | MATCH=True
src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf | 0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a | MATCH=True
src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf | 9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a | MATCH=True
src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf | dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab | MATCH=True
src/gods_workbench/static/vendor/js/lucide.js | 187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040 | MATCH=True
src/gods_workbench/static/vendor/js/three-0.160.0.module.js | 76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495 | MATCH=True
src/gods_workbench/static/prompt-registry/manifest.json | f0c938b5a4102ec71b15daa755f7a3ba10e19445a9b2ea15bfc108aaaa93f349 | MATCH=True
src/gods_workbench/static/prompt-registry/NOTICE.md | 297c53ac333bbcb1a4942fdcea7f84afd9da78f0952b731652c8f03c6b0652d9 | MATCH=True
src/gods_workbench/static/prompt-registry/sources/banana-prompt-quicker.json | 0ae590d56820d1d9716691e96410ee6869dec28a7261de397f74ad2f6cbedda5 | MATCH=True
src/gods_workbench/static/prompt-registry/sources/freestylefly-gpt-image-2.json | 6dd7eed617ccd629e2c96e1adeb4cf23640f86d6e1769aaa98ebee9de94e1a30 | MATCH=True
src/gods_workbench/static/prompt-registry/sources/awesome-gpt-image.json | e5508cad635279cd2c9ddda70d422ad9de8700e7e349e463f2fe433e562a99ec | MATCH=True
src/gods_workbench/static/prompt-registry/sources/awesome-gpt4o-image-prompts.json | ece926584179496d426bd9703c0ea30a13b89a9ce0101bb340056d049e58979d | MATCH=True
src/gods_workbench/static/prompt-registry/sources/youmind-gpt-image-2.json | 4d343babe6bc0e9b5aecc57e2cc7b5afa774a8d386c33f9b3b3a6123f18e748a | MATCH=True
src/gods_workbench/static/prompt-registry/sources/youmind-nano-banana-pro.json | 61ea3a3a3eba2d9fcb3f21bcaa99a8ac13c720d39b20a7748ce951ddcc3104c9 | MATCH=True
ASSET_ROWS=15 HITS=15
REQUIREMENTS_LOCK_HASHES_SHA256=0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56
```

> 命令完整性补注：上述正则命令执行前同一条 PowerShell 调用已先执行 `$tmp='C:\Users\qinxuedong\AppData\Local\Temp\gw-b1-20260921'; New-Item -ItemType Directory -Force -Path $tmp | Out-Null;`，因此其 `Tee-Object` 输出文件路径已定义；控制台原文输出即上方所列。
