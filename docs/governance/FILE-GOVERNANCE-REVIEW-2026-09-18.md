# 文件治理报告独立审核（2026-09-18）

> 审核对象：`docs/governance/FILE-GOVERNANCE-2026-09-18.md`
> 审核方式：只读取证（`git status/diff/ls-files/log/cat-file/hash-object`、SHA-256 逐字节比对、`pytest` 实测、前端源码扫描）。审核过程未执行任何删除、回退、覆盖、提交操作。
> 审核时仓库 `HEAD` = `abd0e8899650117738cd830d9f027d8e9b93162f`；比对参考仓：`D:\Working\Code Pro\Gods-Workbench`（旧仓，下称 OLD，工作区有未提交删除）、`D:\Working\Code Pro\Gods-Workbench-release`（下称 REL，报告称为「迁移来源根」）。

## 1. 审核范围与方法

- **数量口径**：`git status --porcelain`（默认，目录折叠）与 `git status --porcelain -uall`（展开目录）分别统计；`git diff --name-only` + `git ls-files --others --exclude-standard` 得到真实文件数。
- **二进制/文本比对**：对本仓未跟踪与已修改的前端文件，逐一与 OLD / REL 的 HEAD blob、工作区文件做 SHA-256；文本同时给出「原始字节」「CRLF归一」「字体名归一」三种口径。
- **忽略与残留**：`git check-ignore -v .mimosa/`、`os.path.exists` 检查 `tmp_dep.py`、`.mimosa` 目录文件数与体积。
- **manifest 登记**：解析 `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 第 113–133 行「经典版（V1）页面删除登记」，用 `git log --all -- <path>` 与全对象 `cat-file --batch` + SHA-256 独立复算 11 条哈希。
- **接口可达性**：从 `create_app().openapi()` 取本仓真实 `/api` 路由；对前端静态层文本抽取 `/api` 引用并归一后交叉比对。
- **测试**：实跑报告点名的 5 个用例，并整体 `python -m pytest -q`；另将 `HEAD` 用 `git archive` 解包到临时目录实跑基线。
- **说明**：本环境终端对长中文行存在显示错乱，但文件本身零 U+FFFD、UTF-8 合法，所有数值结论均以 ASCII 计数字段为准。

## 2. 逐项复核表

| 项 | 报告声称 | 复核命令 | 复核结果 | 判定 |
|---|---|---|---|---|
| 1a 变更总条数 | 「`git status --porcelain=v1` 为 143 行：40 条 ` M` + 103 条 `??`」 | `git status --porcelain \| Measure-Object -Line` | 143 行；` M`=40，`??`=103 | ✅ 属实 |
| 1b 展开后文件数 | 「`git diff --name-only` + `git ls-files --others` 170 = 210 个真实文件」 | `git status --porcelain -uall`；`git ls-files --others --exclude-standard` | 现为 211 行（40 M + 171 ??）；未跟踪 171 而非 170，真实文件 211 而非 210 | ⚠️ 差 1，见 P2-1 |
| 1c 分类计数 | Python 11 / 前端 158 / 文档 34 / 测试 7 / 垃圾 2 | 按前缀归类统计 | 前端 158 ✓、Python 11 ✓、测试 7 ✓；文档实际 35（报告 34，未含报告自身）；`.mimosa` 被忽略、`tmp_dep.py` 已不存在 | ⚠️ 文档少 1（报告自身） |
| 1d 汇总 212 = 210+2 | §6「合计 212」 | 分节表求和 | §2.1+2.2+2.3+2.4 = 11+7+34+158 = 210；§6 的 10 项「无效更改」= 8 条真实文件 + 2 条非文件项（`.mimosa/`、`tmp_dep.py`） | ⚠️ 口径未标注，易误读 |
| 2a 6 张图片与旧仓 HEAD blob 一致 | 「与旧参考仓 HEAD blob 逐字节一致」 | `git cat-file blob HEAD:static/images/<f>` + SHA-256 | RunningHub-B/W.png、modelscope-1.gif、modelscope.gif：与 OLD HEAD blob 逐字节一致；**volcengine-theme-dark/light.svg 不一致**（本仓 CRLF，OLD blob 为 LF；5085/5088 vs 5035/5038 字节，仅换行差异） | ❌ 4/6 逐字节一致，2/6 仅换行等价 |
| 2b 6 张图片已被用户源删除 | 「用户当前工作区已删除该文件（源不存在）」 | `git status --porcelain`（OLD/REL）+ `os.path.exists` | OLD 工作区 6 个文件全部缺失（` D`，未提交删除）；**REL 工作区 6 个文件仍全部存在且与本仓内容一致** | ⚠️ 仅 OLD 成立，REL 不成立，见 P1-2 |
| 2c `.mimosa/hook-state/**` 被忽略 | 「已被 `.gitignore` 覆盖并从 `git status` 消失」 | `git check-ignore -v .mimosa/`；目录遍历 | `.gitignore:24:.mimosa/`，`check-ignore` 返回 0；`git status` 中无 `.mimosa` 条目；磁盘 35 个文件、163,310 B（159.5 KB） | ✅ 属实 |
| 2d `tmp_dep.py` 已不存在 | 「复核时已不在磁盘」 | `os.path.exists("tmp_dep.py")` | False，已不存在 | ✅ 属实 |
| 2e 两份文档的测试数字 | CLEANROOM-STATUS.md 记「38 项测试全部通过」；remediation 记「pytest -v 40 passed」 | `io.open(...,encoding="utf-8")` 检索 passed/failed/pytest | CLEANROOM-STATUS.md:19 = `本地自动化检查当前 **38 项测试全部通过**`；CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md:28 = `\| pytest -v \| **40 passed** \|` | ✅ 命中行与报告一致（一为 38、一为 40） |
| 3a `js/canvas/**` 19 项 | §4 第 1 组 19 项 | `git ls-files --others --exclude-standard src/gods_workbench/static/js/canvas/` | 19 个；对 REL 逐字节全一致 | ✅ 属实 |
| 3b 字体名替换型差异 33 项 | §2.4/§4/§6 均记 33 | 字体名令牌归一化后对比 REL；解析报告组内清单 | 报告「（3）」清单实列 **21 项**；独立复算「仅字体名差异」= **14 项（严格）/21 项（宽松）**；**33 恰为「相对 REL 的非纯字体差异」文件数**，与标签不符 | ❌ 数字与清单/事实不符，见 P1-1 |
| 3c `vendor/fonts/*.otf` 3 项 | §4 第 4 组 3 项 | 目录枚举 + SHA-256 | 3 个（Bold/Medium/Normal），与 REL/OLD 逐字节一致；合计 26,030.1 KB（25.42 MiB） | ✅ 属实 |
| 3d `runninghub/thumbnails/*.jpg` 5 项 | §4 第 6 组 5 项 | 目录枚举 + 引用扫描 | 5 个，与 REL 逐字节一致；4 个仅被 `runninghub/api_providers.json` 引用，第 5 个无任何文本引用 | ✅ 数量属实（引用描述略偏） |
| 3e `js/asset-auth/**` 2 项 | §4 第 9 组 2 项 | 目录枚举 | 2 个（api.js、http.js），与 REL 换行等价一致；后端无 `/api/asset-auth/*` 路由 | ✅ 属实 |
| 3f §4 分组求和 | 10 组共 70 项 | 逐组求和 | 19+33+3+3+2+5+1+1+2+1 = 70（算术自洽）；但第 2 组含 33 存疑，若改 21 则总数 58 | ⚠️ 受 P1-1 影响 |
| 4a V1 删除登记条目 | 「V1 删除登记 11 条」 | 解析 manifest 第 119–131 行 | 恰 11 条：index.html、home.html、gpt-chat.html、project-board.html、settings.html、js/home.js、js/project-board.js、js/i18n/home.js、js/i18n/project-board.js、css/home-project-preview.css、images/gods-workbench-wordmark.svg | ✅ 属实 |
| 4b 3 条哈希无匹配 | 「static/index.html、gpt-chat.html、settings.html 三条哈希在参考仓任何副本中均无匹配」 | 全对象 `cat-file --batch`+SHA-256（RAW/LF/CRLF 三态）；另扫 `Gods-Workbench-local-archive`、`old-sealed-20260821` | 三哈希在 OLD、REL 的**全部 git 对象**与**全部工作区文件**中均无匹配；另两个存档目录不含这些路径 | ✅ 属实 |
| 4c 其余 8 条哈希 | （报告未逐条声称） | 同上 | 其余 8 条在 OLD/REL 中**存在匹配**，且声明字节数与 CRLF blob 完全吻合（说明 manifest 哈希取自带 CRLF 的工作区快照，须换行归一才可复现） | ✅ 佐证 manifest 口径 |
| 4d 11 条路径本仓历史从未存在 | 「这 11 个路径在本仓 git 历史中从未存在」 | `git log --all -- <path>`（28 个 commit） | 11 条均为 0 记录 | ✅ 属实 |
| 5a 前端 /api 引用 203 条 | 「引用 203 条 `/api` 路径」 | JS 文件抽取 `/api` 令牌，去查询串、`${...}`→`{}`、去尾斜杠后去重 | **203**（原始令牌去重为 233；含 html/css 为 211），换口径数值不同 | ⚠️ 依赖口径，可复现 |
| 5b 后端 12 条真实路由 | 「后端仅实现 12 条真实路由」 | `create_app().openapi()["paths"]` | `/api` 路由恰 12 条 | ✅ 属实 |
| 5c 23 个文件引用不存在接口 | 「23 个前端文件引用了本仓不存在的接口」 | 前端路径正则匹配后端路由模板 | 按「≥2 条缺失」JS 口径 = **23**；按「≥1 条缺失」JS 口径 = 28，含 html/css = 37 | ⚠️ 阈值相关，见 P2-2 |
| 6 5 个失败用例 | 报告点名 5 个用例失败 | `python -m pytest <5 用例> -q --no-header -p no:cacheprovider` | 5 failed：`test_no_banned_binary_assets`、`test_static_layer_has_no_legacy_integration_markers`、`test_repo_wide_zero_binary_assets`、`test_api_static_and_projects_integration`、`test_production_smoke_frontend_static_routing` | ✅ 属实 |
| 6b 全量 5 failed/35 passed | 「当前工作区 `python -m pytest -q` = 5 failed / 35 passed」 | `python -m pytest -q` | 5 failed / 35 passed | ✅ 属实 |
| 6c HEAD 基线 32 passed | 「HEAD 基线解包后 32 passed」 | `git archive HEAD \| tar -x` 后 `pytest -q` | 32 passed | ✅ 属实 |
| 7 失败原因（二进制红线） | 3 个卫生用例因图片/字体失败 | 见 2c/6 断言输出 | 违规清单：`logo.png`、`modelscope-1.gif`、`modelscope.gif`、`RunningHub-B/W.png`、5 张 jpg 缩略图、3 个 `.otf`；另 `test_static_layer...` 因 `lucide/asset-auth/comfyui/runninghub/...` 等标记失败 | ✅ 属实 |
| 8 workshop 命名冲突 | 2 个用例断言 `v2/workshop.html` 含 `god-canvas`，当前文件不含 | 读工作区文件与 `git show HEAD:...` | 工作区 workshop.html 不含 `god-canvas`（55,564 B）；`HEAD` 版本含（4,517 B 占位页） | ✅ 属实 |

## 3. 发现的不一致与风险

### P0
- 未发现 P0 级事实性错误。报告中「143 行」总口径、「5 failed / 35 passed」「HEAD 基线 32 passed」「`.mimosa` 已被忽略」「`tmp_dep.py` 已消失」「`js/canvas` 19 项」「V1 删除登记 11 条」「3 条哈希无匹配」「后端 12 条路由」等核心事实均经独立复算成立。

### P1
- **P1-1（计数标签错误）**：报告将「字体名替换型差异」计为 33 项，但其自身组内清单只列 21 项，独立复算的「纯字体名差异」为 14（严格）/21（宽松）项；33 实为「相对用户源存在非纯字体差异」的文件数。§4「需裁决 70 项」与 §6 的占比均因此被高估约 12 项，需按 21 或重新分组重算。
- **P1-2（删除依据脆弱）**：报告以「用户源已删除」为由建议删除 6 张残留图片，但该陈述只在 OLD 工作区成立（未提交的 ` D`）；报告自己标注为「迁移来源根」的 REL 工作区中这 6 个文件**仍然存在且内容一致**。以工作区未提交删除作为清理依据不可靠，须先确认权威源。
- **P1-3（逐字节表述过强）**：`volcengine-theme-dark.svg`、`volcengine-theme-light.svg` 与 OLD HEAD blob **并非逐字节一致**（本仓 CRLF vs blob LF），仅为换行归一后等价；报告「与旧参考仓 HEAD blob 逐字节一致」对这两项不成立。
- **P1-4（`/api` 不存在口径）**：「23 个文件」仅在「JS 文件且缺失引用 ≥2 条」口径下成立；按更自然的「存在任一未实现引用」口径为 28 个 JS 文件（含 html/css 为 37）。报告未声明阈值，读者可能低估结构性缺口。

### P2
- **P2-1（未跟踪计数差 1）**：报告记 `git ls-files --others` 170、真实文件 210；当前磁盘为 171、211。差异可由「报告文件自身是否计入」解释（报告 §2.3 未包含 `docs/governance/FILE-GOVERNANCE-2026-09-18.md`），但报告未说明，数字与现行快照不一致。
- **P2-2（分类数字与事实的轻微偏差）**：`runninghub/thumbnails/*.jpg` 中仅 4/5 被 `api_providers.json` 引用，第 5 张无任何文本引用（报告称 5 张「仅被该文件自身引用」）；`images/logo.png` 被 11 个**文件**（10 html + 1 js）引用，报告称「11 个页面」，措辞略宽。
- **P2-3（`/api` 数量口径敏感）**：203 依赖「JS 文件 + 去查询串 + `${...}` 归一 + 去尾斜杠」；原始令牌去重为 233，含 html/css 为 211。建议在报告中固化归一规则，避免复核歧义。
- **P2-4（§6 汇总表口径）**：§6「无效更改 10 / 合计 212」把 2 条非文件项（`.mimosa/` 目录、`tmp_dep.py`）与 8 条真实文件合并，但列名未注明；分节表（2.1–2.4）实为 210。建议分列「真实文件」与「非文件残留」。

## 4. 对报告可用性的结论

**总体判定：报告主体事实可靠，但存在 1 处关键计数错误与 1 处依据脆弱问题，须修正后才能据此执行清理。**

- **可直接据以执行的部分（事实已独立复核成立）**：
  1. 清理 `.mimosa/`（35 文件，159.5 KB，确被 `.gitignore` 忽略、非项目资产）——保留 `.gitignore` 规则。
  2. 「`tmp_dep.py` 已从磁盘消失」——无需再处理（若复现再清理）。
  3. 修正 `CLEANROOM-STATUS.md`（记「38 项测试全部通过」）与 `attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md`（记「40 passed」）两处失实测试声明——已定位到原文行号。
  4. 将 `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 的 V1 删除登记三项（index.html、gpt-chat.html、settings.html）标注为不可验证——三哈希确无匹配对象。
  5. 承认 5 个失败用例与 HEAD 基线 32 passed 的差值，按真实失败原因（二进制红线、`god-canvas` 命名断言）分别立项。
- **必须修正后再执行的部分**：
  1. **6 张残留图片的删除**：先把「权威用户源」定死（OLD 未提交删除 ≠ REL 现存），并纠正两张 SVG「逐字节一致」的表述，再决定删除。
  2. **§4「需裁决」70 项与 §6 全部占比**：因「字体名替换型差异」应为 21 而非 33，需重算分组、总数与占比。
  3. **「23 个前端文件引用不存在接口」**：需在报告中声明判定阈值与归一规则，并据此校正缺口规模。
  4. **§1 数量口径**：需说明未跟踪 170/171 的差异来源（报告自身是否计入）并统一「真实文件 / 非文件残留」口径。

**审核方法限制**：`git status` 期间可能存在其他代理并行改动，本审核数字为审核时刻快照；旧仓与 release 仓之间存在多处 CRLF/LF 差异，凡「逐字节」结论均需同时给出换行口径，否则易生歧义。

---

审核人：独立审核代理人（只读取证，未做任何删除/回退/提交）
审核时间：2026-09-18

## 后续状态更新（2026-09-20）

本节为**追加指针**，不改写上文任何一行。

- 上文「零二进制 / 不得提交字体 / 无字体资源」等表述为 **2026-09-17/18 时点快照**。当前权威口径以根 `AGENTS.md` §1.2 为准：仅 **3 个精确路径**的开源思源黑体（`SourceHanSansCN-{Bold,Medium,Normal}.otf`，OFL-1.1）列入唯一白名单，其余图片/字体/音视频等二进制一律禁止。
- **开源字体放行 ≠ 公开分发授权**：仓库发布状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- 当前重新取证见 `attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md` 与 `attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md`。
