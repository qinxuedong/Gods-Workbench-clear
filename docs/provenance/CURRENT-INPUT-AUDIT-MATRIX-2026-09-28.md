# 现行输入审核矩阵（2026-09-28）

本文件是 **A-05** 的产物：把仓库**当前**的审核输入集中成一张可复核的矩阵。

**本文件只汇总与链接已有证据，不重造历史，不产生新的审核结论。** 不覆盖历史登记 [PHASE-2-INPUT-REGISTER.md](PHASE-2-INPUT-REGISTER.md)；历史结论保持原样，本文只登记"当前是什么状态、证据在哪、是否已审"。

- 生成日期：2026-09-28
- 哈希口径：**SHA-256，对原始字节**（`Get-FileHash -Algorithm SHA256`）。若某行另给"LF 规范化"值，是同时给出 `CRLF → LF` 后的哈希，用于对齐历史登记口径（见 §3）。
- 发布日期状态：**NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**（本文不改动）
- 证据类别取值：`旧登记` / `公开协议` / `新需求契约` / `已有审核线索` / `未审`

## 1. 读法

- **旧登记**：出现在 `PHASE-2-INPUT-REGISTER.md` 与 `PHASE-2-INPUT-SHA256.txt`（2026-09-17，共 16 项）中的输入。
- **公开协议**：依据**公开官方文档**观察得到、并已在仓库内落成证据文件的外部协议。
- **新需求契约**：2026-09-17 之后新增、由用户/需求推动产生的契约文件，**不在**旧 16 项登记内。
- **已有审核线索**：存在**第三方产生的**复核/审计/审查文档在案（仅登记链接，本文不判其结论成立与否）。
- **未审**：本次未找到独立审核线索，明确标为"未审"。

> ⚠️ 契约文件内的 `status: frozen_for_implementation`、`frozen` 等**自写字段不是审核结论**。本文一律不以其作为"已审"依据；只在"已有审核线索"列登记**外部**文档链接。

## 2. `docs/contracts/` 现行文件矩阵（29 个文件）

| # | 路径 | 类别 | SHA-256（原始字节） | 审核结论 / 证据 |
| ---: | --- | --- | --- | --- |
| 1 | `docs/contracts/ASSET-LIBRARY-B4-INTERFACE-CATALOG.yaml` | 已有审核线索 | `a6ce98be3bc529a9f411d6412edfd35e7f0d9768b666c7c7769f69a4459e3d8d` | [PHASE-11-B4-ASSET-LIBRARY-REPORT-2026-09-25.md](../governance/PHASE-11-B4-ASSET-LIBRARY-REPORT-2026-09-25.md)；另见 B4 报告链。**未做独立终审**（该线索为阶段报告，非发布审查） |
| 2 | `docs/contracts/ASSET-LIBRARY-INTERFACE-CATALOG.yaml` | 已有审核线索 | `4f601058597520910a82a2d052842c763e77e609c2674ea21b951bc3f9e3d4cd` | [PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md](../governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md) |
| 3 | `docs/contracts/ASSET-REGISTRY-INTERFACE-CATALOG.yaml` | 已有审核线索 | `2bf946c5fe5fce6b26c0cb85599dc229d56f385fbc6f25bd2eebda434861cc0b` | [PHASE-11-B3-ASSET-REGISTRY-REPORT-2026-09-25.md](../governance/PHASE-11-B3-ASSET-REGISTRY-REPORT-2026-09-25.md) · [PHASE-12-PROJECT-VIDEO-CONTEXT-DESIGN-REVIEW.md](../governance/agent-briefs-2026-09-26/PHASE-12-PROJECT-VIDEO-CONTEXT-DESIGN-REVIEW.md) |
| 4 | `docs/contracts/ASSET-REVIEW-INTERFACE-CATALOG.yaml` | 已有审核线索 | `c146e7c7e0bd5654edc61ef0811572b07b32981f39fe5460b374b1fef370bd2a` | [PHASE-11-B6-ASSET-REVIEW-REPORT-2026-09-25.md](../governance/PHASE-11-B6-ASSET-REVIEW-REPORT-2026-09-25.md) |
| 5 | `docs/contracts/AUDIT-OUTBOX-LOCAL-SINK-CONTRACT.md` | 新需求契约 | `9eec6e7f6d8509d4fa7751fba35ad49f782f8da1b3d2ff9563a1f46d4069f459` | **未审**（本次未找到独立复核线索） |
| 6 | `docs/contracts/AUTH-INTERFACE-CATALOG.yaml` | 已有审核线索 | `c07f8ea7a88cb836c8e74c3c91a8127c125f6e31d2a98b2e91714414f19e4f4a` | [PHASE-11-B1-AUTH-REPORT-2026-09-25.md](../governance/PHASE-11-B1-AUTH-REPORT-2026-09-25.md)。注：S-01 正在改认证边界，本文件可能随之变更 |
| 7 | `docs/contracts/CANVAS-CLOSURE-INTERFACE-CATALOG.yaml` | 已有审核线索 | `2ba498fc2a3ae5a7647270a6708a6c34ba62c8eb2561c65200ac8e6a6030ecf4` | [PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md](../governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md) |
| 8 | `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml` | **旧登记** | `d64751788efec4fd1a97896e9f8d2e2bfdbda86ca4aea591632d5c703c611d47` | 旧 16 项之一，哈希**与登记值一致**（原始字节，无需规范化）。线索：[REVIEW-FINAL.md](../governance/agent-reports-2026-09-20/REVIEW-FINAL.md) · [REVIEW-PHASE3-FINAL.md](../governance/agent-reports-2026-09-20/REVIEW-PHASE3-FINAL.md) |
| 9 | `docs/contracts/CHAT-METRICS-INTERFACE-CATALOG.yaml` | 新需求契约 | `49e943232d0205a7931e0212d0d8ade3c608e4b4107404cfecf2af42666e0978` | **未审** |
| 10 | `docs/contracts/EPISODE-PIPELINE-INTERFACE-CATALOG.yaml` | 已有审核线索 | `ca2564f55c625b0580b24798f981b2c83c7ea0eecd17094b4498f92d5a8dad42` | [PHASE-11-B7-EPISODE-REPORT-2026-09-25.md](../governance/PHASE-11-B7-EPISODE-REPORT-2026-09-25.md) |
| 11 | `docs/contracts/LOCAL-ACCOUNT-AUTH-2026-09-26.md` | 新需求契约 | `951f5cc7ce3f11ac2d4131c39901f7318369015deefac7090f9e8cf3d6884752` | **未审** |
| 12 | `docs/contracts/LOCAL-ACCOUNT-INTERFACE-CATALOG.yaml` | 新需求契约 | `a20da0204eb3d5aad5d060ec93bd06eedad1e7b2a56c11ae20d52e97e83d1600` | **未审** |
| 13 | `docs/contracts/LOCAL-ASSET-INTERFACE-CATALOG.yaml` | 已有审核线索 | `7414dd572fc867c6a1fceda73b70f495d1555dba8d3c3d35e1591d0d38999cc0` | [PHASE-11-B4-ASSET-LIBRARY-REPORT-2026-09-25.md](../governance/PHASE-11-B4-ASSET-LIBRARY-REPORT-2026-09-25.md) |
| 14 | `docs/contracts/MEDIA-INTERFACE-CATALOG.yaml` | 已有审核线索 | `4582c60d86266d2f2dea0271d368d0b960f2c602a9d19a6501e70f898d609908` | [PHASE-11-B5-MEDIA-REPORT-2026-09-25.md](../governance/PHASE-11-B5-MEDIA-REPORT-2026-09-25.md) |
| 15 | `docs/contracts/OBSERVABILITY-INTERFACE-CATALOG.yaml` | 已有审核线索 | `017f958fda6e367d3171cd2c7b1e1b1361d92fd78b99a44fc93acc5ac6323b3d` | [PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md](../governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md) |
| 16 | `docs/contracts/OUTPUT-ACCESS-CONTRACT.md` | 新需求契约 | `e62253285454098f41285cb0ae0602c8a66370475c33e02866c5b46b55b0ca8c` | **未审** |
| 17 | `docs/contracts/PHASE12-PROVIDER-PROTOCOL-EVIDENCE-2026-09-27.md` | **公开协议**（证据文件本体） | `542674bee001c380359506d307b5c1115f09c0811ec4db4b6a8027a777b9ae12` | 依据公开官方文档落成的协议证据（New API unified-video、AI Platform Chat Completions）。**这是证据，不是审核结论**；未找到独立复核线索 → 就"是否已审"而言为**未审** |
| 18 | `docs/contracts/PLATFORM-INTERFACE-CATALOG.yaml` | 已有审核线索 | `7ab522afc75751182f84b8b4cbb6fa10b051f919f14d33c1592b9f852662424c` | [PHASE-11-B2-PLATFORM-REPORT-2026-09-25.md](../governance/PHASE-11-B2-PLATFORM-REPORT-2026-09-25.md) |
| 19 | `docs/contracts/PROJECT-PERSISTENCE-GATES-CONTRACT.md` | 已有审核线索 | `a2025200904897c195bf1659f2178271250a4b32c1728a5c34438fdb477e9dd5` | [PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md](../governance/agent-briefs-2026-09-26/PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md) |
| 20 | `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` | **旧登记** | `2bc11363021150fb16822b75eab1fcf0a3d84ee17efcb5b95f482fd0dc7b71ac` | 旧 16 项之一，哈希**与登记值一致**（原始字节，无需规范化）。线索：[PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md](../governance/agent-briefs-2026-09-26/PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md) |
| 21 | `docs/contracts/PROMPT-LIBRARY-B8-ITEM-INTERFACE-CATALOG.yaml` | 新需求契约 | `b4d3f9d832301441b66fa9c50d14f883323bfd01294cc20548db4e1677f00717` | **未审** |
| 22 | `docs/contracts/PROMPT-LIBRARY-INTERFACE-CATALOG.yaml` | 已有审核线索 | `ace7472b72a4e10f8cd1c2b6d4340981671ce9d276467510bc03f00b1cd6c2d0` | [PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md](../governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md) |
| 23 | `docs/contracts/PUBLIC-SHARE-INTERFACE-CATALOG.yaml` | 新需求契约 | `4dc93205ac9acb19f7be38eeb364dba43be75372382b8b0260644a583b2df6dd` | **未审** |
| 24 | `docs/contracts/README.md` | 已有审核线索 | `892e88b1360f47d098e4a2e5fdbdaf4916c7e26942074674b241a3d9c56fa32b` | 目录说明文件。线索：[REVIEW-1.md](../governance/agent-reports-2026-09-20/REVIEW-1.md) · [P9-B-INDEPENDENT-REVIEW.md](../governance/agent-reports-2026-09-21/P9-B-INDEPENDENT-REVIEW.md) |
| 25 | `docs/contracts/REGISTRY-INDEX-JOBS-CONTRACT.md` | 已有审核线索 | `55937b10e79f39e0773b8fe02d50da8670784627e7157fd6cee969425b35d398` | [PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md](../governance/agent-briefs-2026-09-26/PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md) |
| 26 | `docs/contracts/SETTINGS-INTERFACE-CATALOG.yaml` | 已有审核线索 | `c5f3410859ecdf8390019dce826817ce1c99bce8b7fc7646a2913e27dddac459` | [PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md](../governance/PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md) |
| 27 | `docs/contracts/TEAM-MESSAGES-INTERFACE-CATALOG.yaml` | 已有审核线索 | `9bdc10ca7e772a30cdef3c947bb6c352b680d552313e180baef048e7bdb253b3` | [PHASE-12-THREE-CAPABILITIES-DESIGN-REVIEW.md](../governance/agent-briefs-2026-09-26/PHASE-12-THREE-CAPABILITIES-DESIGN-REVIEW.md) |
| 28 | `docs/contracts/TEXT-PDF-EXPORT-CONTRACT.md` | 新需求契约 | `e9574bc485c8db6cd18fe79d3c8cf61f8a8719ce7639192f42ddbbf5bd7f7ca0` | **未审** |
| 29 | `docs/contracts/VIDEO-TASKS-INTERFACE-CATALOG.yaml` | **公开协议** | `495cf75d64a30514137b94815d6be1956ab1a7bf704d3894c1758ae889cf82ed` | 契约内 `source_evidence` 指向 [PHASE12-PROVIDER-PROTOCOL-EVIDENCE-2026-09-27.md](../contracts/PHASE12-PROVIDER-PROTOCOL-EVIDENCE-2026-09-27.md)（New API unified-video）。线索：[PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md](../governance/agent-briefs-2026-09-26/PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md) · [PHASE-12-THREE-CAPABILITIES-DESIGN-REVIEW.md](../governance/agent-briefs-2026-09-26/PHASE-12-THREE-CAPABILITIES-DESIGN-REVIEW.md)。**协议来源已登记，但真实商业服务仍需部署配置后的现场验证** |

**小结（仅计数，不含新结论）**：29 个文件中，`旧登记` 2 个、`公开协议` 2 个、`已有审核线索` 16 个、`新需求契约` 9 个；其中明确标为 `未审` 的 7 个。

## 3. 旧 16 项登记（2026-09-17）当前状态

来源：[PHASE-2-INPUT-REGISTER.md](PHASE-2-INPUT-REGISTER.md) 与 [PHASE-2-INPUT-SHA256.txt](PHASE-2-INPUT-SHA256.txt)（共 **16** 条，登记于 2026-09-17）。本节**只登记当前哈希与是否仍与登记值一致**，不修改历史登记。

> **两文件的口径差异（实测）**：`PHASE-2-INPUT-SHA256.txt` 含 **16 行**哈希（4 行为行为规范 + 2 行契约 + 1 行夹具清单 + 9 行夹具文件）；`PHASE-2-INPUT-REGISTER.md` 的表体为 **7 行**具名条目（其中 1 行以"`GOLDEN-FIXTURE-MANIFEST.json` 及其列出的文件"概括夹具集合）。因此逐项展开**以 SHA256.txt 的 16 行为准**，登记表是概括性索引。本矩阵采用同一口径。
>
> ### 更正：登记表与 vendor 清单均**没有**交错损坏（2026-09-28 复核）
>
> 本矩阵早前版本（sha256 `9D713C71…ECB8C`）曾登记两处"多版本逐行交错损坏"：`docs/provenance/PHASE-2-INPUT-REGISTER.md` 与 `src/gods_workbench/static/vendor/MANIFEST.md`。**两条结论均不成立，现全部撤回。**
>
> 复核方法与结果（以**转义码点**输出取证，显示层无法干扰）：
>
> - `PHASE-2-INPUT-REGISTER.md`：`2263` 字节，SHA-256 `db966b2089a9dddbe2a0c5aac843f5b3faf993fcd912e4c9c599ac7648037363`。
>   - 第 5 行表头 = `| 类型 | 路径或范围 | 当前版本 | 当前状态 | 来源类别 | 审查结论 |`，**6 列**，42 字节；
>   - 第 6 行分隔行 = `|---|---|---|---|---|---|`，**6 个** `---`，与表头列数**一致**；
>   - 第 7–13 行**逐行均为规整的 6 单元格记录**；第 10 行是**独立完整的** `待审清单` 记录（`PLUGIN-PROTOCOL-SPEC.md` / `draft` / `明确排除（禁止实现）` / `待单独安全与协议审查` / `EXCLUDED (待单独审查)`），**并未**被焊入 PROJECTS-HUB 行；
>   - 全表路径 token **无一截断**；`BEHAVI`、`ocs/behavior` 等"撕裂片段"字面子串测试均为 **False**。
>   - → 该登记表**规整可引用**，本文 §2/§3 对它的引用不受影响。
>
> - `src/gods_workbench/static/vendor/MANIFEST.md`：`6127` 字节 / `69` 行，SHA-256 `636A6FF15F1FA414408122A2709EDCF3536ABBADB414328C9BDA3483EF553EC5`。
>   - 第 47 行转义渲染 = `| Source Han Sans CN `1.004` | 同上 | `fonts/SourceHanSansCN-Medium.otf`（500） | `9CDEB297…8D037A` |`；
>   - 第 48 行转义渲染 = `| Source Han Sans CN `1.004` | 同上 | `fonts/SourceHanSansCN-Bold.otf`（700） | `0972537E…E2F03A` |`；
>   - 两行均为**独立完整的 4 单元格记录**；`1.004`、`004`、`otf` 在行内**各只出现 1 次**，不存在重复片段。
>   - → 该清单**没有**交错损坏。
>
> **误判根因（已定位到机制）**：本工作区的多行文本读取接口在**显示层**会把部分多字节区段渲染成重复/错位/乱码（本机终端无法编码 CJK，回显时把路径片段重复或截断），看起来像"行与行互相插入"。上述两处"损坏证据"**全部**来自未转义的显示输出，而非文件字节；原始字节中这些片段只出现一次。
>
> **取证规则（本轮教训，建议 t7 采用）**：判断 UTF-8 中文文件的完整性，**只能**依据**字节/码点层证据**——转义码点输出、逐单元格**字面子串测试**、`ReadAllBytes` 计数。**不得**采信多行显示的观感，也**不得**以"行列数对齐"作为判据（列数一致与内容损坏并不互斥，反之亦然）。
>
> 边界：本矩阵**自始至终未改动**这两个文件一个字符（`git status` 为空，SHA-256 复核一致）。`vendor/MANIFEST.md` 的**许可与字体版本**问题（A-03 范围）与本处完整性问题**无关**，不受本次撤回影响。

| 登记路径 | 现行 SHA-256（原始字节） | 与登记值一致？ | LF 规范化后一致？ |
| --- | --- | --- | --- |
| `docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md` | `b0765218eb8814f2332dbe346f3f1c46ce0b7c99c3753cb35aeb66cf264cf398` | 原始字节 **不同** | **一致** |
| `docs/behavior/BEHAVIOR-SPEC-CANVAS.md` | `31bc8f33f46370c50469a80f4b50860c18d495ec4fdf3a291241782c7b3dbfbf` | 原始字节 **不同** | **一致** |
| `docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md` | `2d0bedd76abf015e9a14d24a2881376c9fed18a04173f5ff68067b9f6fcf68c3` | 原始字节 **不同** | **一致** |
| `docs/behavior/PLUGIN-PROTOCOL-SPEC.md` | `e89d2c64a21334a69d5e235e9c55b3d626352afad7856876e7e905a7d1e1ebc8` | 原始字节 **不同** | **一致** |
| `docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml` | `2bc11363021150fb16822b75eab1fcf0a3d84ee17efcb5b95f482fd0dc7b71ac` | **一致** | **一致** |
| `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml` | `d64751788efec4fd1a97896e9f8d2e2bfdbda86ca4aea591632d5c703c611d47` | **一致** | **一致** |
| `docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json` | `70001a36276073d83d1bc145048a0e1686888912c902c337a1f4b9e46d5279b7` | **一致** | **一致** |
| `docs/fixtures/projects-hub-list-active.json` | `bcdea4c15953b35b75664728c0425a66a5229a1eba682c0dcd98ef9908ba3b80` | 原始字节 **不同** | **一致** |
| `docs/fixtures/projects-hub-create-request.json` | `73420371d19cad3299b359d5bd8599e43f054631799c042a71c53915742e1c31` | 原始字节 **不同** | **一致** |
| `docs/fixtures/projects-hub-update-conflict-409.json` | `1090cb5af53cf085153767ca1571798ca071014124e780fda2d983aa2d714378` | 原始字节 **不同** | **一致** |
| `docs/fixtures/canvas-workflow-minimal.json` | `75fd768f0bc73314531070504986a8a3b19ac8122b2c8f3836010672a2a97726` | 原始字节 **不同** | **一致** |
| `docs/fixtures/canvas-workflow-minimal.godmap` | `3ca8a708e372d529ea3b8ef90af21e42589d209fe33edbe736b15103ae6afbc7` | 原始字节 **不同** | **一致** |
| `docs/fixtures/canvas-save-conflict-409.json` | `04085f8ff24fa7624160c64f10d024fd7ebc6f3298d33664003fa598bd982ab8` | 原始字节 **不同** | **一致** |
| `docs/fixtures/canvas-task-accepted-202.json` | `c4aec062dfedbaa13667b8ed72d361c5a7e83f5a2f41f0f600d0f61430a60934` | 原始字节 **不同** | **一致** |
| `docs/fixtures/canvas-auth-401.json` | `c388b7dec4eb4f59ff046e1561e4c8dd3b840f7369f9619492fd35e4ffd20709` | 原始字节 **不同** | **一致** |
| `docs/fixtures/canvas-forbidden-403.json` | `ea6810bf6c67ca3434f5f5567db9d64ac09fb00b839afaa548e03c2c49892151` | 原始字节 **不同** | **一致** |

**结论（事实陈述，非新审核结论）**：16 项**全部仍然存在**；3 项原始字节即一致，13 项在**原始字节**层面不一致、但在**LF 规范化**后**全部一致**。逐项核验显示，这 13 项的不一致**仅来自 `CRLF` 与 `LF` 行尾差异**，内容未变。

> 该"行尾规范化"口径与 A-02 对分类表目标哈希的处置口径一致（A-02：`NORMALIZED`，差异仅行尾）。**这是对现有登记的一个已知口径缺口**：登记值按 LF 规范化记录，而磁盘当前为 CRLF。本文件只如实登记，**不擅自改写** `PHASE-2-INPUT-SHA256.txt`；是否修正登记口径需由独立审计裁决。

## 4. `docs/behavior/` 与 `docs/fixtures/` 现状

- `docs/behavior/`：4 个文件（`BEHAVIOR-SPEC-CANVAS.md`、`BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md`、`BEHAVIOR-SPEC-SMART-CANVAS.md`、`PLUGIN-PROTOCOL-SPEC.md`）+ `README.md`。
  - 前 4 个均为**旧登记**（见 §3），登记结论为 `USER-DIRECTED (2026-09-17)` / `修复输入（发布审查未完成）`。
  - `PLUGIN-PROTOCOL-SPEC.md` 在旧登记中的状态为 **`EXCLUDED`（明确排除，禁止实现，待单独安全与协议审查）** —— 该项**至今未见独立审查线索**，维持**未审/排除**。
- `docs/fixtures/`：11 个旧登记夹具（见 §3）+ 若干后续新增夹具。**本次未逐一复核后续新增夹具**，不在此处给出结论。

## 5. 已有分散证据（只汇总链接）

| 证据 | 位置 | 说明 |
| --- | --- | --- |
| 视频契约协议来源 | `docs/contracts/VIDEO-TASKS-INTERFACE-CATALOG.yaml` 的 `source_evidence` 字段 | 指向 `PHASE12-PROVIDER-PROTOCOL-EVIDENCE-2026-09-27.md`；仅为来源声明，**不等于**独立审核 |
| Provider 官方协议观察 | [PHASE12-PROVIDER-PROTOCOL-EVIDENCE-2026-09-27.md](../contracts/PHASE12-PROVIDER-PROTOCOL-EVIDENCE-2026-09-27.md) | 2026-09-27 对公开官方文档的观察；含 New API unified-video、AI Platform Chat Completions；明确"未读取/未修改用户真实 Provider 凭据"，且 AI Platform Videos/Sora 2 已于 2026-09-24 关闭 |
| 旧输入登记与哈希 | [PHASE-2-INPUT-REGISTER.md](PHASE-2-INPUT-REGISTER.md) · [PHASE-2-INPUT-SHA256.txt](PHASE-2-INPUT-SHA256.txt) | 2026-09-17 的 16 项登记；**历史文件，本文未覆盖** |
| 第三方许可与来源审计 | [THIRD-PARTY-INVENTORY-2026-09-21.md](THIRD-PARTY-INVENTORY-2026-09-21.md) · [VENDOR-UPSTREAM-MATCH-AUDIT-2026-09-21.md](VENDOR-UPSTREAM-MATCH-AUDIT-2026-09-21.md) · [PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md](PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md) · [CDN-SUPPLY-CHAIN-2026-09-21.md](CDN-SUPPLY-CHAIN-2026-09-21.md) | 属 A-03/A-04 范围，此处仅登记链接 |
| 代码分类与静态范围 | [CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md](CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md)（A-02 已改） · [STATIC-SCOPE-REGISTRY-2026-09-20.md](STATIC-SCOPE-REGISTRY-2026-09-20.md) · [AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt](AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt) | 属 A-02/A-01 范围，此处仅登记链接 |
| 阶段独立复核 | `docs/governance/` 下 `PHASE-10-INDEPENDENT-AUDIT-REPORT-2026-09-23.md`、`PHASE-11-B*-REPORT-2026-09-25.md`、`PHASE-12-*-REVIEW.md`、`ROUND2-ACCEPTANCE-AUDIT-2026-09-18.md` 等 | 见 §2 各行内链接；**本文不判定这些复核是否满足发布审查标准** |

## 6. 边界声明

- 本文件**不产生**新的审核结论，**不**把任何契约的自写 `frozen_for_implementation` 当作已审证据。
- 本文件**未覆盖** `PHASE-2-INPUT-REGISTER.md` / `PHASE-2-INPUT-SHA256.txt`，历史登记保持原样。
- 本文件**未改动**任何 `docs/contracts/` 文件；§2 的哈希是 2026-09-28 读取时的快照，契约后续变更须重新生成。
- 本文件**不改动**发布状态：仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- 本文件**不宣称**洁净终验通过。A-05 关闭的是"现行输入是否有集中台账"，**不是**"所有输入都已通过独立审核"。
