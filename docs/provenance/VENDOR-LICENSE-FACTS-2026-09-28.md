# A-03 事实基线与纠正记录（2026-09-28）

本文件只记录本轮 A-03 **亲自实测、可复算** 的事实。**不改变发布状态：仓库仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION。**

## 1. `src/gods_workbench/static/vendor/` 逐文件哈希（2026-09-28 实测）

复算命令：`Get-FileHash -Algorithm SHA256 -LiteralPath <path>`

| 本地文件 | 字节 | SHA-256（实测） |
| --- | ---: | --- |
| `css/fonts.css` | 677 | `0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3` |
| `fonts/SourceHanSansCN-Bold.otf` | 9036076 | `0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a` |
| `fonts/SourceHanSansCN-Medium.otf` | 8812324 | `9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a` |
| `fonts/SourceHanSansCN-Normal.otf` | 8806392 | `dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab` |
| `js/lucide.js` | 401894 | `187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040` |
| `js/tailwindcss-cdn.js` | 418973 | `a789ce5a73191759006b64a0c05f63afbf9aa43a86511bf798d688737429e60a` |
| `js/three-0.160.0.module.js` | 1272972 | `76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495` |

**本清单未替换任何字体或 JS 二进制**；本轮只改文档。工作树与 HEAD 对比：`git diff --stat HEAD -- src/gods_workbench/static/vendor/fonts` 为空。

## 2. 三个 OTF 的 `name` 表独立解析（2026-09-28 实测）

方法：用 fontTools 直接解析 OTF 的 `name` 表（不依赖任何既有摘录），按 name record 读取各平台字段。

| 本地文件 | name ID 3（UniqueID） | name ID 5（Version） | name ID 3 中的 PostScript 名 | name ID 8 |
| --- | --- | --- | --- | --- |
| `fonts/SourceHanSansCN-Bold.otf` | `1.004;ADBO;SourceHanSansCN-Bold;ADOBE` | `Version 1.004;PS 1.004;hotconv 16.6.51;makeotf.lib2.5.65220` | `SourceHanSansCN-Bold` | `Adobe Systems Incorporated` |
| `fonts/SourceHanSansCN-Medium.otf` | `1.004;ADBO;SourceHanSansCN-Medium;ADOBE` | `Version 1.004;PS 1.004;hotconv 16.6.51;makeotf.lib2.5.65220` | `SourceHanSansCN-Medium` | `Adobe Systems Incorporated` |
| `fonts/SourceHanSansCN-Normal.otf` | `1.004;ADBO;SourceHanSansCN-Normal;ADOBE` | `Version 1.004;PS 1.004;hotconv 16.6.51;makeotf.lib2.5.65220` | `SourceHanSansCN-Normal` | `Adobe Systems Incorporated` |

三个 OTF 的内嵌许可字段（name ID 13/14）一致：

- name ID 13 = `This Font Software is licensed under the SIL Open Font License, Version 1.1. ...`
- name ID 14 = `http://scripts.sil.org/OFL`
- name ID 0 = `Copyright © 2014, 2015 Adobe Systems Incorporated (http://www.adobe.com/), with Reserved Font Name 'Source'.`

**结论**：三个 OTF 内嵌版本经独立解析一致为 **`1.004`**。此前 `MANIFEST.md` 登记的 `2.004` **与该内嵌版本不符**，已作废并从当前清单移除；`MANIFEST.md` 现在只登记 `1.004`，并把残留的 `2.004` 保留为**否定性作废说明**（明确标注"与该内嵌版本不符"）。字体二进制**未被替换**。

## 3. 字体上游制品匹配（承 `VENDOR-UPSTREAM-MATCH-AUDIT-2026-09-21.md` 复核）

| 组件 | 本地字节 | 上游对照 | 结论 |
| --- | ---: | --- | --- |
| `js/lucide.js` | 401894 | `lucide@1.16.0/dist/umd/lucide.min.js` = 401894 | ✅ 双 CDN 逐字节一致 |
| `js/three-0.160.0.module.js` | 1272972 | `three@0.160.0/build/three.module.js` = 1272972 | ✅ 双 CDN 逐字节一致 |
| `fonts/SourceHanSansCN-Bold.otf` | 9036076 | 官方 **2.005R** = 8569308 | ❌ 不一致 |
| `fonts/SourceHanSansCN-Medium.otf` | 8812324 | 官方 **2.005R** = 8406556 | ❌ 不一致 |
| `fonts/SourceHanSansCN-Normal.otf` | 8806392 | 官方 **2.005R** = 8434332 | ❌ 不一致 |

官方 **1.004R** 发布页仅提供单体 `SourceHanSans.ttc`（114,984,464 B，SHA-256 `D22D49D3B60EB9514F3AB351C4AECAC100512D3E9DB6E94C9200F23614E313B0`），**不含**本地这三个 `SubsetOTF/CN/*.otf`。

**结论**：三个 OTF 与上游**已发布制品的逐字节一致性未验证** → 标记为 **待批准**，正式分发 **`BLOCKED`**。

## 4. `MANIFEST.md` 中失实引用的消除（2026-09-28 实测）

纠正前 `MANIFEST.md` 引用了以下**不存在**的路径，并声称"已补 `static/vendor/` 范围的第三方通知"：

| 被误引路径 | `Test-Path` | `git ls-tree -r HEAD` | 当前处置 |
| --- | --- | --- | --- |
| `NOTICE`（仓库根） | `False` | 不存在 | 已在 `MANIFEST.md` 中登记为**不存在**，不再作为许可正文入口引用 |
| `LICENSE`（仓库根） | `False` | 不存在 | 已登记为**有意不提供**（依 `CLEANROOM-CHARTER.md`） |
| `THIRD_PARTY_NOTICES.md`（仓库根） | `False` | 不存在 | 已登记为**不存在** |
| `src/gods_workbench/THIRD_PARTY_NOTICES.md` | `False` | 不存在 | 已登记为**不存在** |

仓库内**唯一**名称匹配 `NOTICE`/`LICENSE` 的受版本控制文件，均与本目录无关：

1. `src/gods_workbench/static/prompt-registry/NOTICE.md`（prompt-registry 快照通知，**非** vendor 通知，**非**全仓通知）
2. `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`（治理文档，非许可证正文）
3. `docs/governance/agent-reports-2026-09-20/T-license-inventory.md`（清点报告）

**未新增**任何根级 `LICENSE` / `NOTICE` / `THIRD_PARTY_NOTICES.md`。依 `CLEANROOM-CHARTER.md`：独立审计完成前**不添加**正式开源许可证。

## 5. `MANIFEST.md` 纠正后的状态

当前 `src/gods_workbench/static/vendor/MANIFEST.md`（69 行）已按事实重建：

- 只登记 `static/vendor/` 范围内**当前存在**的 7 个制品（`css/fonts.css`、3 个 OTF、3 个 JS）；
- 已移除全部历史作废条目（Inter / JetBrains Mono / Space Grotesk 等已不存在的文件）；
- 三个 OTF 版本统一登记为 `1.004`；
- 明确声明根级 `NOTICE` / 根级 `LICENSE` / `src/gods_workbench/THIRD_PARTY_NOTICES.md` **不存在**；
- 明确声明**不得**把清单或 `LICENSES.md` 解释为"已补 vendor 完整通知"，**尚无完整全仓 NOTICE/SBOM**；
- 未逐字节匹配的字体标为**待批准**，正式分发保持 **`BLOCKED`**。

历史审计结论保留在 `docs/provenance/VENDOR-UPSTREAM-MATCH-AUDIT-2026-09-21.md` 与 `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`；本清单**只登记当前状态**，不重造历史。

## 6. 本轮未做的事（边界声明）

- 未替换、未新增、未删除任何字体或 JS 二进制。
- 未新增根级 `LICENSE` / `NOTICE` / `THIRD_PARTY_NOTICES.md`。
- 未改动 `docs/provenance/` 下的历史审计记录内容。
- 未改变发布状态：仍 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
- 未宣称洁净终验通过。