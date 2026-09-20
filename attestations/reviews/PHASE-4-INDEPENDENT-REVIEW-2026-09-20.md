# Phase 4 独立对抗式终审（B1）

日期：2026-09-20
范围：仅依据当前工作区文件与本代理独立执行的命令；不采信 A1/A2/A3 自述。未执行 git add/commit/push/remote/checkout/restore/reset，未修改被审产物。

## 一、复核方式与证据边界

已阅读：`AGENTS.md`、`docs/governance/AGENT-TASK-2026-09-20-PHASE4.md` §0/§5、三份 A1–A3 报告，以及任务书列出的 OIDC、测试、依赖锁、SBOM、两份治理文档。所有结论均回到工作区文件、`git diff`、哈希/解析命令和本地测试输出。

证据分类严格区分：
- **本地实测**：本报告执行的命令、当前工作树、当前文件内容。
- **远端 CI**：本轮未执行，无法验证。
- **生产验收**：本轮未执行，无法验证；本报告不授予发布或生产就绪结论。

## 二、复跑门禁（原始输出）

### 2.1 pytest 字面命令

第一次在仓库根直接执行：

```text
===PYTEST===
python: The term 'python' is not recognized as a name of a cmdlet, function, script file, or executable program.
pytest_exit=
```

这次失败是当前 shell 的 `python` 不在 PATH，不是测试失败。随后仅在 `%TEMP%\gw-b1-20260920\bin\python.cmd` 建临时包装器，转发到已有本机 Python 运行时，并再次执行**同一字面命令**：

```powershell
python -m pytest -q --no-header -p no:cacheprovider
```

原始输出：

```text
C:\Users\QINXUE~1\AppData\Local\Temp\gw-a2-20260920\run_pytest.py:4: PytestRemovedIn10Warning: pytest.console_main() is deprecated and will be removed in pytest 10.
...............................................................          [100%]
63 passed in 0.38s
pytest_exit=0
```

结论：**本地 63 passed，0 failed**。这是本机 Python 3.12.10/包装器路径下的实测，不是远端 CI 或生产验收。

独立新增测试复跑：

```text
python -m pytest -q --no-header -p no:cacheprovider tests/contracts/test_oidc_verifier.py
.......................                                                  [100%]
23 passed in 0.10s
oidc_exit=0
```

### 2.2 全部保留 `.js` 的 `node --check`

命令递归枚举仓库内 `.js`（排除 `.git`）并逐个执行 `node --check`。结果：

```text
js_count=56
```

56/56 命令退出码为 0，无失败文件、无语法错误输出。

### 2.3 二进制红线扫描

命令递归扫描（排除 `.git`）图片、音视频、压缩包、可执行文件及字体扩展名，并允许仅三条 `AGENTS.md` 白名单 OTF。原始摘要：

```text
restricted_count=0
```

三条允许路径均为：
`src/gods_workbench/static/vendor/fonts/SourceHanSansCN-{Bold,Medium,Normal}.otf`。

## 三、证伪式抽查

### 抽查 1：OIDC 是否真的“未接线”——PASS

命令：

```text
rg -n --glob '*.py' --glob '*.js' --glob '!src/gods_workbench/core/oidc.py' --glob '!tests/contracts/test_oidc_verifier.py' '(from gods_workbench\.core\.oidc|import gods_workbench\.core\.oidc|verify_jwt\(|OidcConfig)' src tests run.py
```

结果：无匹配（命令返回无匹配状态；没有生产代码调用点）。模块自身文件和契约测试除外。故“新增影子模块、不接线”未被推翻，记 PASS。

### 抽查 2：默认认证路径是否改动——PASS

命令：

```text
git diff -- src/gods_workbench/core/auth.py src/gods_workbench/api
```

原始输出为空。当前 `core/auth.py` 与 `api/**` 没有工作区 diff；记 PASS。注意：这证明当前差异为空，不证明未来接线安全。

### 抽查 3：SBOM 39 组件与分类——PASS

使用 PowerShell `ConvertFrom-Json` 解析当前 SBOM：

```text
bomFormat=CycloneDX specVersion=1.5 components=39
type_file=7
type_framework=1
type_library=31
scope_external=1
scope_runtime=29
scope_test=9
```

与报告的“39（31 library + 7 file + 1 framework）”一致；runtime=29 包含 22 个 runtime library + 7 个 file，test=9，external=1。记 PASS。

### 抽查 4：7 个 vendor 文件 SHA-256——PASS

逐项 `Get-FileHash -Algorithm SHA256` 与 SBOM `hashes[SHA-256]` 比较：

```text
all_match=True
```

7/7 文件一致，未被推翻，记 PASS。

### 抽查 5：锁主表计数与边界——PASS（但存在口径限制）

`requirements.lock` 主表在附表分隔线前有 30 条精确版本行，SBOM 的 Python library 31 条包含 Linux 条件的 `uvloop`。锁文件明确写明“版本锁、非哈希锁”，并明确 Windows 口径/未覆盖 Linux uvloop。故“主表 30 条”未被推翻；但不能把它当作跨平台完整锁或哈希锁。

## 四、改动清单、卫生与追加性

当前 `git status --porcelain -uall` 原始输出：

```text
 M docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md
 M docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md
 M requirements.txt
?? docs/governance/AGENT-TASK-2026-09-20-PHASE4.md
?? docs/governance/agent-reports-2026-09-20/T-deploy-repro.md
?? docs/governance/agent-reports-2026-09-20/T-lock-sbom.md
?? docs/governance/agent-reports-2026-09-20/T-oidc-shadow.md
?? docs/provenance/SBOM-2026-09-20.cdx.json
?? requirements.lock
?? src/gods_workbench/core/oidc.py
?? tests/contracts/test_oidc_verifier.py
```

与本轮任务书预期的 A1–A3 产物及任务书/报告文件一致；本报告写入后还会新增自身路径。治理文档追加性复核：

```text
12  0  docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md
20  0  docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md
```

删除列为 0，纯追加 PASS。根级 `LICENSE` / `THIRD_PARTY_NOTICES.md` 均不存在。二进制扫描未发现白名单外受限二进制。`requirements.txt` 仅新增 `cryptography>=42,<47` 注释/依赖三行，符合任务书 A2 范围。

## 五、报告一致性核查与缺陷清单

### 已核实、未发现夸大

1. 三份报告当前主口径的全量测试数字均为 **63 passed**；独立复跑也是 63 passed。
2. A2 报告单独新增测试为 **23 passed**；独立复跑一致。
3. SBOM 实际为 39 components、31 library、7 file、1 framework；与 T-lock-sbom.md §1/§7 数字一致。
4. T-lock-sbom.md §8 明确写出“未按 requirements.lock 精确钉版本重装”；T-deploy-repro.md §8 也明确干净 venv 是按区间解析，边界写清。该安装成功证据属于主代理补充，且没有被写成 Linux/生产证据。
5. T-oidc-shadow.md 明确“不接线、不切换流量”、真实 IdP/JWKS/生产登录未验证；独立搜索未推翻。

### 发现的口径/文字缺陷（不应忽略）

1. **T-lock-sbom.md 第 163 行存在可误解的全局表述**：写为“未修改依赖声明文件；未新增依赖”。当前工作区 `requirements.txt` 明确新增了 `cryptography>=42,<47`（任务书 §2/A2 允许且要求）。按 A1 任务边界，正确说法应是“A1 未修改依赖声明文件；A1 未新增依赖”，否则读者会误以为本轮没有新增 cryptography。该处属于报告口径缺陷，建议收口时修正/追加澄清。

2. **T-deploy-repro.md 第 133–136 行与第 169–204 行需要连读**：前者保留 A3 沙箱安装失败，后者记录主代理在自身 shell 成功。文本已经明确“上文失败保留”“未按 lock 精确重装”，不判为虚假通过；但单独摘录第 133–136 行会与最终状态冲突，审计引用必须同时带 §8。

3. **T-oidc-shadow.md 第 126 行“本地契约测试下……（63 passed）”存在轻微聚合口径风险**：OIDC 文件独立测试实际为 23 passed，63 是全量套件。上下文第 48/71–75 行同时给出了 23 与 63，因此不构成数字错误，但对外引用不得把 63 说成 OIDC 专测数。

4. **T-lock-sbom.md 第 14 行“真实联网安装成功”只能归为本地 Windows 主代理证据**；报告第 4、§8 已写明本地/非 Linux、非生产边界，不能外推为远端 CI 或生产可部署。

5. **A2 报告第 117 行的“证明未改动 auth/api”依赖当前 diff 为空**，本次独立 `git diff` 已复核为空；该结论仅限当前工作树，不能作为接线后的安全审计结论。

## 六、最终判定

- **本地门禁：PASS**（63 passed，56 个 JS 全部 node --check 通过，二进制红线 0 个违规，治理文档删除列 0，OIDC 专测 23 passed）。
- **独立证伪抽查：PASS**；未推翻“不接线”、auth/api 未改、SBOM 计数、7/7 哈希和锁主表 30 条等声称。
- **报告缺陷：有**；至少包括 T-lock-sbom.md:163 的“未新增依赖”歧义，及 T-deploy-repro.md §3/§8 需要联合引用的双环境口径。
- **最终门判定：不可提交（当前不建议主代理直接收口提交）**。理由不是本地测试失败，而是报告口径缺陷尚未修正，且依赖锁仍非哈希锁、仅 Windows、未按 lock 精确重装，SBOM 无签名/来源证明。
- **发布/生产就绪：否**。没有远端 CI、Linux/容器、真实部署、TLS/反代、真实 IdP/JWKS、生产流量、回滚或独立许可/安全验收证据；不得宣称发布授权或生产就绪。

## 七、证据边界声明

本报告只证明：在当前工作区、当前本机环境和临时测试包装器下，测试与静态检查可复现，且所抽查的文件内容与哈希相符。它不证明远端 CI 成功、不证明 Linux 或生产容器依赖闭包、不证明真实 IdP、网络部署、生产数据、许可证闭环、签名/来源证明或公开发布授权。当前仓库治理基线仍为 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION`。

## 八、复审（R2，2026-09-20）

### 8.1 三处指定修正逐条核对

1. **T-lock-sbom.md：已闭环。**
   - 文件第 163 行原文：`**本任务（P4-A1）未修改依赖声明文件**；但本轮 Phase 4 的 P4-A2 已在 \`requirements.txt\` 追加 \`cryptography>=42,<47\`（详见 \`T-oidc-shadow.md\`），故「本轮未新增依赖」不成立，特此更正。`
   - 该表述已把 P4-A1 任务边界与本轮 P4-A2 的新增依赖明确分开，未再把「本任务未新增」扩大为「本轮未新增」。

2. **T-deploy-repro.md：已闭环。**
   - 文件第 3–5 行原文：`**阅读提示（主代理 2026-09-20 追加）**：§3 记录的安装失败是 **A3 所在沙箱**的限制。`、`主代理在生产 shell 中复跑同一路径后**安装成功**（30 包，\`pip check\` 通过，63 passed），见 **§8**。`、`引用本文时必须同时引用 §8，不得只摘录 §3 得出「依赖不可安装」的结论。`
   - §8 第 173–208 行保留成功证据及 Windows、区间解析、未在 Linux/CI/生产容器复跑等限制；双环境口径已被显式绑定，不能只摘录失败段落。

3. **T-oidc-shadow.md：已闭环。**
   - 文件第 126–127 行原文：`因此本报告**只能证明**：影子校验模块在本轮新增的 **23 条** OIDC 专测下行为正确。`、`全量门禁（含既有用例）为 **63 passed**，该数字是全仓结果，不可单独归因于 OIDC 模块。`
   - 第 26、48、92 行亦分别给出 23 条测试、23 passed；63 仅作为全仓结果，口径已拆开。

### 8.2 三份报告全文复读与缺陷复查

未发现上述三处之外新的「把局部证据写成全局事实」或错数。以下边界仍然存在，但报告已经明确披露，不能视为修正遗漏：

- T-lock-sbom.md 第 14–15、46–47、156–164 行：是本地 Windows 干净 venv、区间解析、版本锁而非哈希锁；未按 `requirements.lock` 精确钉版本重装，未覆盖 Linux `uvloop`，无签名/来源证明。
- T-deploy-repro.md 第 139–141、168、203–208 行：A3 沙箱失败与主代理本地成功并存；失败 venv 的 `pip check` 为空环境结果，不被冒充为安装成功；仍未有远端 CI、Linux/容器、真实部署、真实 IdP 或生产流量验收。
- T-oidc-shadow.md 第 122–139 行：影子模块不接线、不切流量，未验证真实 IdP/JWKS、登录、TLS/反代、多实例或生产安全策略；测试运行时使用 RSA 密钥且不落盘。23/63 的区分已清楚。

因此，**三处指定修正均已真实落地；本轮未发现新的报告口径缺陷。**

### 8.3 复跑门禁（本次 R2 原始输出）

#### pytest 字面命令

当前 shell 的 `python` 不在 PATH；在同一命令环境临时加入既有 `%TEMP%\\gw-a2-20260920\\bin` 包装器后，执行的仍是任务要求的字面命令：

```text
C:\\Users\\QINXUE~1\\AppData\\Local\\Temp\\gw-a2-20260920\\run_pytest.py:4: PytestRemovedIn10Warning: pytest.console_main() is deprecated and will be removed in pytest 10.
...............................................................          [100%]
63 passed in 0.38s
pytest_exit=0
```

#### 全部 `.js` 的 `node --check`

```text
js_count=56
js_bad_count=0
```

56 个 `.js` 均退出码 0，无语法错误文件。

#### 二进制红线扫描（跳过 `.git`，仅允许 3 个白名单 `.otf`）

```text
restricted_count=0
```

允许项仅为 `SourceHanSansCN-Bold.otf`、`SourceHanSansCN-Medium.otf`、`SourceHanSansCN-Normal.otf` 三条精确白名单路径。

### 8.4 工作区、删除列与根级文件核对

`git status --porcelain -uall` 原文：

```text
 M docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md
 M docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md
 M requirements.txt
?? attestations/reviews/PHASE-4-INDEPENDENT-REVIEW-2026-09-20.md
?? docs/governance/AGENT-TASK-2026-09-20-PHASE4.md
?? docs/governance/agent-reports-2026-09-20/T-deploy-repro.md
?? docs/governance/agent-reports-2026-09-20/T-lock-sbom.md
?? docs/governance/agent-reports-2026-09-20/T-oidc-shadow.md
?? docs/provenance/SBOM-2026-09-20.cdx.json
?? requirements.lock
?? src/gods_workbench/core/oidc.py
?? tests/contracts/test_oidc_verifier.py
```

`git diff --numstat` 原文（治理文档删除列均为 0）：

```text
12	0	docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md
20	0	docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md
3	0	requirements.txt
```

根目录核对：未新增根级 `LICENSE`；未新增根级 `THIRD_PARTY_NOTICES.md`（原文结果：`(none)`）。

### 8.5 R2 结论

- **三处修正：已闭环。**
- **新报告缺陷：未发现。**
- **在本地证据范围内：可提交。** 本结论仅指当前工作区的本地门禁、报告口径和卫生核对已达到提交条件，不是发布授权。
- 必须重申：**本地可提交 ≠ 远端 CI 通过 ≠ 生产就绪**。远端 CI、Linux/生产容器、真实 IdP/JWKS、真实部署/TLS/反代、多实例、生产流量、回滚及独立合规/安全验收仍缺失；当前仓库仍受 `NOT AUTHORIZED FOR PUBLIC DISTRIBUTION` 约束。

本复审仅追加本节，未改写本报告上文；未执行 `git add`、`commit`、`push` 或 `remote`，未修改三份被审报告。
