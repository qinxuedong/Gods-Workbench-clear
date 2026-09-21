# 本地 Vendor 制品与上游不可变制品匹配审计（2026-09-21）

> 依据：`docs/governance/AGENT-TASK-2026-09-21-PHASE7.md`；`HANDOFF-5.md` §5 第 5 条。
> 方法：对每个本地 vendored 制品，从**上游不可变制品**重新下载并逐字节比对 SHA-256；**不改动任何 vendored 文件**。
> 证据临时文件在 `%TEMP%\gw-p7-root\`（**未入库**）。

## 1. 结论速览

| 本地文件 | 大小 (B) | 本地 SHA-256 | 上游不可变制品匹配 | 结论 |
|---|---:|---|---|---|
| `src/gods_workbench/static/vendor/js/lucide.js` | 401,894 | `187A7566…2D040` | ✅ 匹配 | **闭环** |
| `src/gods_workbench/static/vendor/js/three-0.160.0.module.js` | 1,272,972 | `76DEA815…1A495` | ✅ 匹配 | **闭环** |
| `…/fonts/SourceHanSansCN-Bold.otf` | 9,036,076 | `0972537E…E2F03A` | ❌ 不匹配当前发布 | **未闭环**（见 §4） |
| `…/fonts/SourceHanSansCN-Medium.otf` | 8,812,324 | `9CDEB297…8D037A` | ❌ 不匹配当前发布 | **未闭环** |
| `…/fonts/SourceHanSansCN-Normal.otf` | 8,806,392 | `DD058AC5…D090FAB` | ❌ 不匹配当前发布 | **未闭环** |

## 2. JS 制品：上游不可变制品匹配（闭环）

对每个 JS 制品从 **两个独立 CDN**（unpkg 与 jsDelivr）按**钉死版本**下载，逐字节比对：

```text
=== lucide.js ===
local bytes=401894 sha256=187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040
  https://unpkg.com/lucide@1.16.0/dist/umd/lucide.min.js
    -> status=200 bytes=401894 sha256=187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040 MATCH=True
  https://cdn.jsdelivr.net/npm/lucide@1.16.0/dist/umd/lucide.min.js
    -> status=200 bytes=401894 sha256=187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040 MATCH=True

=== three-0.160.0.module.js ===
local bytes=1272972 sha256=76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
  https://unpkg.com/three@0.160.0/build/three.module.js
    -> status=200 bytes=1272972 sha256=76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495 MATCH=True
  https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js
    -> status=200 bytes=1272972 sha256=76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495 MATCH=True
```

**双 CDN 一致 = 该版本制品不可变且本地字节一致。** 这两项从「仅有本地哈希与声明」提升为**与上游不可变制品匹配**。

## 3. 字体：内嵌许可证元数据（已确认）

读取三个 OTF 的 `name` 表（`LicenseDescription` / `LicenseURL`）：

```text
SourceHanSansCN-Bold.otf   : This Font Software is licensed under the SIL Open Font License, Version 1.1. / http://scripts.sil.org/OFL
SourceHanSansCN-Medium.otf : 同上
SourceHanSansCN-Normal.otf : 同上
```

即三个字体**内嵌声明 OFL-1.1**；其 `UniqueID` / `Version` 均为 **1.004**
（如 `1.004;ADBO;SourceHanSansCN-Bold;ADOBE`、`Version 1.004;PS 1.004;hotconv 16.6.51;makeotf.lib2.5.65220`）。

## 4. 字体：上游不可变制品匹配（未闭环，如实登记）

- 官方 `adobe-fonts/source-han-sans` 当前最新发布为 **2.005R**；其 `19_SourceHanSansCN.zip`
  （50,700,226 B，SHA-256 `3A769D1B082EBD813CDB4C06EA57D29B340BCE548EDCC8E61976B78CA28E6236`）
  内的 `SubsetOTF/CN/SourceHanSansCN-*.otf` 与本地文件**逐字节不一致**：

```text
SourceHanSansCN-Bold.otf:   local=9036076  upstream(2.005R)=8569308  MATCH=False
SourceHanSansCN-Medium.otf: local=8812324  upstream(2.005R)=8406556  MATCH=False
SourceHanSansCN-Normal.otf: local=8806392  upstream(2.005R)=8434332  MATCH=False
```

- 原因是**版本差异**：本地为 **1.004**，而上游最新发布为 **2.005R**（字形子集与压缩不同，故字节不同）。
- 官方 **1.004R** 发布页**仅提供单体 `SourceHanSans.ttc`**（114,984,464 B，
  SHA-256 `D22D49D3B60EB9514F3AB351C4AECAC100512D3E9DB6E94C9200F23614E313B0`），
  **不含**本地这 3 个独立 `SubsetOTF/CN/*.otf` 制品。用 `fontTools` 解析该 TTC（36 个字体）后：
  - 其简体中文族为 **`SourceHanSansSC-*`**（旧命名 SC，非本地 CN），共 36 个族系；
  - 其 `Version` 为 `1.004;PS 1.004;hotconv 1.0.82;makeotf.lib2.5.63406`，
    而本地字体为 `1.004;PS 1.004;hotconv 16.6.51;makeotf.lib2.5.65220` —— **构建工具链不同**；
  - 因此**无法**从 1.004R 官方发布物逐字节复算本地 CN 字体来源。
- **结论**：字体「上游不可变制品匹配」**未闭环**。本地字体自声明 OFL-1.1 且内嵌版本 1.004，但**缺乏可复算的官方
  不可变制品**。**待用户裁决**：① 用官方 2.005R 子集 OTF 替换本地 1.004（会改变字形，需视觉回归）；
  ② 从官方 1.004R 的 TTC 中提取并逐字节比对（可行但需额外工具）；③ 维持现状并登记为已知缺口。

## 5. 未改动声明

- 本审计**未改动任何 vendored 文件**（只读比对）；**未新增**任何图片/字体/二进制到仓库；
  下载物仅存于 `%TEMP%`，**未入库**。
- 仓库仍 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；本审计不改变总发布门禁。
