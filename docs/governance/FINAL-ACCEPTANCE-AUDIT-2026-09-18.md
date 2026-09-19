# 最终验收审核报告（2026-09-18）

> 性质：本批次交付前的最终核实。审核人：最终验收审核代理人。
> 方法：只读取证，逐项跑命令复算；未修改、删除、回退、提交任何仓库文件（唯一写入物即本报告文件）。
> 读中文统一用 Python `io.open(...,encoding='utf-8')` + `sys.stdout.reconfigure(encoding='utf-8')`。

## 1. 审核范围与方法

- 审核对象（本批次 6 类交付物）：
  - `docs/governance/TASKS.md`
  - `docs/governance/FILE-GOVERNANCE-2026-09-18.md`
  - `docs/governance/FILE-GOVERNANCE-REVIEW-2026-09-18.md`
  - `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md`
  - `docs/migration/CLASSIC-REMOVAL-PLAN-2026-09-18.md`
  - `CLEANROOM-STATUS.md`、`attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md`（追加「数字更正」节）
- 复算命令类别：`git status --porcelain [-uall]`、`git for-each-ref`、`git rev-list --objects --all --not master`、`git cat-file --batch-check`、`git count-objects -vH`、`git ls-tree`、`git show`、逐文件 SHA-256 与字节数、全工作区文本引用扫描、`python -m pytest -q --no-header -p no:cacheprovider`、Python Markdown 结构校验。
- 判定口径：一致 / 不一致 / 无法验证。凡数字一律以本轮独立命令输出为准。

## 2. 逐项复核表

| 项 | 声称 | 复核命令 | 结果 | 判定 |
|---|---|---|---|---|
| A1 TASKS 已勾选条目证据路径 | T2 引用二进制/命名基线；T3 引用治理报告 + 独立复核 | `Test-Path` + Python 逐 `[x]` 行反引号路径存在性检查 | T2 的 `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md` 存在；T3 的 `FILE-GOVERNANCE-2026-09-18.md`、`FILE-GOVERNANCE-REVIEW-2026-09-18.md` 均存在；其余条目为 404 语义/已消失态，台账自述与磁盘一致 | 一致 |
| A2 测试基线 5 failed / 35 passed | TASKS §四 记 5 failed / 35 passed | `python -m pytest -q --no-header -p no:cacheprovider` | 实测 `5 failed, 35 passed in 0.53s`；失败用例与台账列出的 5 项逐一对应 | 一致 |
| A3 TASKS Markdown 结构 | 表格行列一致、无乱码 | Python 读取（零 U+FFFD）+ 连续表格块管道符计数 | 正文零 U+FFFD、UTF-8 合法、无空表头错位；但第 32–37 行表第 34 行从单元格内含裸管道符（通配符写法 *.png 加 gif），该行计 6 个管道符而表头为 5，列数错位 | 不一致（见 P2-1） |
| B4 §1/§4/§6 与 `git status -uall` 自洽 | §1/§6 合计 213；§1 分项 11+158+37+7=213；§4=57 | `git status --porcelain -uall` 计数 + 分项重算 | 实测 `-uall` 213 行（40 ` M` + 173 `??`）；分类重算 11+158+37+7=213；§6 104+40+8+57+1+3=213；§4 行内 19+3+3+5+1+2+21+3=57 | 一致 |
| B5 §3 六张残留图片处置 | 已改为「待用户裁决」，含 release 副本仍存在、旧仓未提交删除 | 逐文件 `Test-Path`/SHA-256 + 旧仓 `git status --porcelain` | release 仓 6 副本全部存在且与本仓逐字节一致；旧仓 `git status` 显示 6 个 ` D`（未提交删除）；报告措辞为「待用户裁决（不得作为本轮清理依据）」 | 一致 |
| B6 `volcengine-theme-*.svg` 表述 | 已由「逐字节一致」改为「仅换行归一后等价」 | 逐字节比对 + CRLF 计数 + SHA-256 | 本仓 SVG 为 CRLF 5,085/5,088 字节；旧仓 HEAD blob 为 LF 5,035/5,038 字节，字节数不同、非逐字节；本仓与 release 仓副本逐字节相同 | 一致 |
| B7 §4 第 10 组 V1 删除登记 | 已改为「建议改进（非阻塞）」，理由为 11 条哈希可复现、仅缺来源副本位置 | 解析 manifest 11 条哈希，在 3 个候选源目录扫描 SHA-256 | 11/11 全部复现（TEMP 8 项；release、旧仓另有多项命中）；该项标为「建议改进（非阻塞）」并说明未注明来源副本位置 | 一致 |
| B8 `/api` 计数口径 | 声明原始令牌数 vs 归一后数 | 读取 §4 补充段 | 明确给出原始令牌去重数 205（.js）/213（含 html、css）与归一后 203（.js）/210（含 html、css），并列文件数阈值 29 / 24 | 一致 |
| C9 二进制清单 13 项 / 25.57 MiB / 运行期必需 8 项 / 1 张孤儿 | 与磁盘事实一致 | Python 遍历全仓 `.png .jpg .gif .otf` 计数求和 + 全工作区文本引用扫描 | 实测 13 项、26,807,233 字节 = 25.57 MiB；运行期必需 8 项（5 徽标 + 3 字体）成立；`workflow-2064542485938008065.jpg` 在治理/迁移文档外无文本引用，属孤儿 | 一致 |
| C10 SVG 是否误列受限二进制 | 未把 SVG 列为受限二进制 | 读取 §1 定义与清单 | 明确写「SVG 为文本，不属受限二进制，不在清单」；13 项清单不含任何 `.svg` | 一致 |
| C11 四要素齐备 | 冲突陈述 + 三候选方案与代价 + 明确推荐 + 待用户裁决 | 读取 §2/§3/§4/§5 | §2 冲突陈述（3 条）、方案（a）（b）（c）与代价、§4 明确推荐方案（b）、「待用户裁决命名口径」齐备 | 一致 |
| C12 两个失败断言文件/行号与推荐方案 | 指出两文件与行号，推荐改断言 | 读取两测试文件对应行号 | `tests/contracts/test_projects_hub_service.py:117`、`tests/smoke/test_production_smoke.py:55` 均为 `assert "god-canvas" in resp_workshop.text`；文档推荐方案 A（改断言） | 一致 |
| D13 `.git` 非 master 独占受限 blob | 16 引用 / 333 独占对象 / 13 二进制 blob | `git for-each-ref`、`git rev-list --objects --all --not master`、`git cat-file --batch-check`、`git count-objects -vH` | 引用共 17（16 个 `refs/copilot/checkpoints/**` + `master`）；独占对象 333（237 blob + 16 commit + 80 tree）；独占二进制 blob 13；`.git` 24.80 MiB、538 loose、无 pack | 一致 |
| D13b 现有卫生用例为何检测不到 | 因 `ignored_dirs` 显式跳过 `.git` | 读取 `tests/hygiene/test_phase6_deep_hygiene.py` | 第 27 行 `ignored_dirs = {".git", ...}`，第 33 行按路径分段过滤，故 `.git` 内对象库不参与扫描 | 一致 |
| D14 经典版删除抽验 | 11 个经典文件不存在、2 个 V2 文件存在 | `Test-Path` 逐路径 | 11 个待删文件全部 False；`static/episode-pipeline.html`、`static/v2/settings.html` 均 True | 一致 |

## 3. 发现问题

### P0

无。本轮未见「未完成却勾选 / 数字造假 / 报告与磁盘事实相反」的致命问题。

### P1

- **P1-1（提交硬前置，非报告内容）**：`.git` 对象库中仍有 16 个 `refs/copilot/checkpoints/**` 引用的 333 个独占对象，其中含 13 个受限二进制 blob（与工作区 13 项同源）。这直接违反 AGENTS.md §1.2 洁净室红线，且现有卫生用例因 `ignored_dirs` 跳过 `.git` 而检测不到。处置（`git bundle` 备份后删除 checkpoint 引用并 `gc`）属破坏性操作，须用户明确确认后方可执行。
- **P1-2（治理报告命名粒度张力）**：§4 第 2 组把「字体名替换型差异（21）」列为「需裁决」，而 §6 统计「准确迁移 104」与之并列求和时命名粒度不一（一处按差异类型、一处按文件判定）。数值自洽（57 含该 21），但表述易误读。

### P2

- **P2-1（TASKS 表格结构）**：`TASKS.md` 第 34 行含未转义 `|`（`src/gods_workbench/static/images/*.png|gif`），该行 6 个 `|`、表头 5 个，列数错位。
- **P2-2（TASKS 数字残留）**：`TASKS.md` 第 18 行、第 85 行仍写「212 个变更文件」，而治理报告已按实测更正为 213；`TASKS.md` 自身亦计入 213，需同步或注明快照口径。
- **P2-3（治理报告修订记录数字残留）**：修订记录第 6 条正文仍写「§6 统一以 … 212 条真实文件为口径」，而 §6 表头与合计已是 213，未同步。
- **P2-4（§1 体积小数差）**：报告 §1 文档分类体积记 210.8 KiB，实测 211.8 KiB；§1 合计 37,730.3 KiB 与实测 37,731.3 KiB 差 1.0 KiB。文件数一致，仅小数偏小。
- **P2-5（体积单位口径不统一）**：§1 附注用 26,030.1 KiB，BINARY 文档用 25.42 MiB，而 3 个 OTF 实测合计 26,654,792 字节（25.42 MiB / 26,030.07 KiB）。两处单位口径不同，读者易混。

## 4. 结论：是否可交付

**总体判定：不可提交。**

本批次 6 类交付物的事实性内容与自洽性核验总体通过：15 项逐项复核中 14 项「一致」、1 项「不一致」（仅 P2-1 表格结构错位），未发现数字造假或事后放宽标准。

但存在 1 项提交前必须处置的硬前置：

1. `.git` 对象库中仍有 16 个 checkpoint 引用可达的 333 个独占对象，含 13 个受限二进制 blob，直接违反洁净室红线；且现有卫生用例检测不到。处置属破坏性操作，须用户明确确认。

**前置条件清单（满足后方可提交）**

- [ ] 用户明确确认 `.git` checkpoint 引用与 13 个独占二进制 blob 的处置方案，并完成处置与验证（`git rev-list --all --not master` 归零或仅余非二进制，`git count-objects -vH` 体积下降）。
- [ ] 同步修正 `TASKS.md` 与 `FILE-GOVERNANCE-2026-09-18.md` 中残留的 212 与体积口径表述。
- [ ] 修正 `TASKS.md` 第 34 行表格单元格内的 `|` 转义。

---

审核人：最终验收审核代理人（只读审计，未修改/删除/回退/提交任何仓库文件）
审核时间：2026-09-18

---

## 后续状态更新（2026-09-20）

本报告「四、剩余未决项」所列 3 条 `- [ ]` 均已在后续批次处置完毕，原文保留不改，此处追加口径指针：

- 第 70 行（`.git` checkpoint 引用与 13 个独占二进制 blob 的处置）：**已完成**（T12）。用户 2026-09-19 明确授权；仓外完整 bundle 备份 + `refs/copilot/checkpoints/**` 引用清理 + `gc` 后，`git rev-list --objects --all` 受限后缀实测**仅剩 3 个白名单 `.otf`**（详见 `TASK-NOTES-2026-09-18.md` §2.3）。
- 第 71 行（同步修正 `TASKS.md` 与 `FILE-GOVERNANCE-2026-09-18.md` 中残留的 212 与体积口径表述）：**已完成**，收口记录见 `FINAL-ACCEPTANCE-REVERIFY-2026-09-18.md` §六「复审后修正」。
- 第 72 行（修正 `TASKS.md` 第 34 行表格单元格内的 `|` 转义）：**已消解** —— `TASKS.md` 已重写为「单条 task + 1-2 行简短说明」台账（16 行、无表格单元格），原表结构不复存在。
- 证据边界：以上均为**本地**处置与**本地**提交；**未 push、未跑远端 CI、未做生产验收**，不等于发布就绪。