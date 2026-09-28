# `static/vendor/` 组件级许可证与版权通知

本文件只覆盖 `src/gods_workbench/static/vendor/` 目录内的第三方组件，逐组件给出**许可正文或版权通知、可核对的上游来源链接、本地制品哈希**。

本文件**不是**根级 NOTICE、**不是**根级 LICENSE，也**不是**全仓第三方通知。仓库当前不存在 `NOTICE`：根级 `LICENSE` **有意未提供**，因为 CLEANROOM-CHARTER 禁止在独立审计完成前添加正式开源许可证。`src/gods_workbench/static/vendor/` 的第三方义务**只在本目录范围内**被记录；全仓 SBOM 与完整 NOTICE 仍缺失。

## 发布状态：BLOCKED

本目录的存在**不构成**任何发布许可。以下组件尚不能进入正式分发：

| 组件 | 阻塞原因 |
| --- | --- |
| Source Han Sans CN（3 个 OTF） | 原始下载制品未定位；与 `adobe-fonts/source-han-sans` 已发布标签（`1.004R` / `1.004`）是否逐字节一致**未经验证**，标记为**待批准**。 |
| `js/tailwindcss-cdn.js` | 传递依赖闭包（Tailwind `3.4.17` + `@tailwindcss/forms` `0.5.10` + `@tailwindcss/container-queries` `0.1.1`）及其许可通知未闭合。 |

`js/lucide.js` 与 `js/three-0.160.0.module.js` 已具备随附的许可正文与版权通知，但仍随本目录整体处于 `BLOCKED`。

## 判定口径

- **版权人名称的权威来源是其许可原文自身的数据行**（`Copyright (c) ...`），而不是正文里的散文表述。Feather 的 `LICENSE` 正文写 "copyright holder"，其数据行为 `Copyright (c) 2013-2023 Cole Bemis`；因此 Cole Bemis 是版权人，而非仅"贡献者"。
- **`static/vendor/css/fonts.css` 是本项目维护的加载配置**，不是第三方制品，因此适用本项目自身的许可（当前 `UNLICENSED`／保留所有权利），不适用 SIL OFL-1.1。仅由它引用的**字体二进制**适用 OFL-1.1。
- 本文件中的**许可正文**按官方发布文本逐字转录；每个组件都给出可核对的上游链接，核对以链接内容为准。

---

## 1. Lucide — ISC

- 本地制品：`js/lucide.js`（401894 字节，commit 时哈希见 `MANIFEST.md`）
- 版本：`1.16.0`
- 上游：<https://github.com/lucide-icons/lucide> · release <https://github.com/lucide-icons/lucide/releases/tag/1.16.0> · 许可原文 <https://github.com/lucide-icons/lucide/blob/main/LICENSE>
- 声明：ISC。`lucide.js` 亦包含 Feather 派生图标，其通知见 §2。
- 可复核依据：本地制品以 `//# sourceMappingURL=lucide.min.js.map` 结尾，与上游 bundle 结构一致；本地文件为上游 1.16.0 发布制品的本地自托管副本。

### 许可正文（ISC，官方文本）

```
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## 2. Feather — MIT（Feather 派生图标）

- 适用制品：`js/lucide.js` 中继承自 Feather 的图标（Lucide 明示其部分版权由 Cole Bemis 以 Feather 项目（MIT）名义持有）。
- 上游：<https://github.com/feathericons/feather> · 许可原文 <https://github.com/feathericons/feather/blob/main/LICENSE>
- 版权人：**Cole Bemis**（依据下述许可正文中的数据行）。

### 许可正文（MIT，官方文本）

```
The MIT License (MIT)

Copyright (c) 2013-2023 Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 3. Three.js — MIT

- 本地制品：`js/three-0.160.0.module.js`（1272972 字节）
- 版本：`0.160.0`（文件内常量 `REVISION = '160'`）
- 上游：<https://github.com/mrdoob/three.js> · npm 不可变制品 <https://unpkg.com/three@0.160.0/build/three.module.js> · 许可原文 <https://github.com/mrdoob/three.js/blob/dev/LICENSE>
- **版权行与 SPDX 标识就在本地制品文件头内**，可离线复核：

```
/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
```

- 版权人：Three.js Authors。

### 许可正文（MIT，官方文本）

```
The MIT License

Copyright © 2010-2023 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## 4. Source Han Sans CN（思源黑体） — SIL OFL-1.1

- 本地制品（3 个 OTF，字重由 `css/fonts.css` 绑定）：

| 本地文件 | `css/fonts.css` 字重 | 内嵌版本 | 内嵌 PostScript 名 | 内嵌版权通知 |
| --- | --- | --- | --- | --- |
| `fonts/SourceHanSansCN-Normal.otf` | 400 | **1.004** | `SourceHanSansCN-Normal` | `Adobe Systems Incorporated` |
| `fonts/SourceHanSansCN-Medium.otf` | 500 | **1.004** | `SourceHanSansCN-Medium` | `Adobe Systems Incorporated` |
| `fonts/SourceHanSansCN-Bold.otf` | 700 | **1.004** | `SourceHanSansCN-Bold` | `Adobe Systems Incorporated` |

- **版本口径纠正**：三个 OTF 的 `name` 表独立解析结果一致为 `1.004`：
  - name ID 5 = `Version 1.004;PS 1.004;hotconv 16.6.51;makeotf.lib2.5.65220`
  - name ID 3 = `1.004;ADBO;SourceHanSansCN-<Weight>;ADOBE`

  此前登记的 `2.004` **与该内嵌版本不一致**，已不再使用。字体二进制**未被替换**。
- 上游：<https://github.com/adobe-fonts/source-han-sans> · v1.004 发布线 <https://github.com/adobe-fonts/source-han-sans/releases> · 许可原文 <https://github.com/adobe-fonts/source-han-sans/blob/master/LICENSE.txt>
- 版权人：Adobe（依照 OFL 标准版权行惯例为 `Copyright 2014-2021 Adobe (http://www.adobe.com/)`；该行以许可原文为准）。
- 保留字体名称（Reserved Font Name）：**Source Han Sans** / 思源黑体。OFL-1.1 第 3 条要求：修改版**不得**沿用保留字体名称。本项目**未修改**这些字体二进制。
- 发布时须随附下述 OFL-1.1 全文与版权通知。
- **待批准**：本地 OTF 与 `adobe-fonts/source-han-sans` 已发布制品（`1.004R` / `1.004` 标签）是否逐字节一致**未经验证**。在完成逐字节匹配或取得明确许可前，本组字体**不得**进入正式分发。

### 许可正文（SIL Open Font License 1.1，官方文本）

```
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## 5. 待批准 / 未闭合组件

### 5.1 `fonts/` 三个 OTF — 待批准

原始下载制品未定位。**尚未验证**本地文件与上游发布制品逐字节一致。在此之前不得声明来源闭环，不得进入正式分发。字体二进制在本轮审计中**未被替换**。

### 5.2 `js/tailwindcss-cdn.js` — 未闭合

- 本地制品：`js/tailwindcss-cdn.js`（418973 字节），Tailwind Play CDN `3.4.17` 的本地自托管快照。
- 上游：<https://cdn.tailwindcss.com/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1> · 许可原文 <https://github.com/tailwindlabs/tailwindcss/blob/v3.4.17/LICENSE>
- 该 bundle 把以下组件一并打包，其许可通知**尚未随附**，因此整包处于 `BLOCKED`：

| 组件 | 版本 | 许可 |
| --- | --- | --- |
| Tailwind CSS | `3.4.17` | MIT |
| `@tailwindcss/forms` | `0.5.10` | MIT |
| `@tailwindcss/container-queries` | `0.1.1` | MIT |
| `caniuse-lite`（传递） | — | CC-BY-4.0（数据） |
| `didyoumean`（传递） | — | Apache-2.0 |

### 5.3 `css/fonts.css` — 本项目文件

本文件是**本项目维护**的 `@font-face` 加载配置，**不是**第三方制品。它适用本项目自身的许可（当前 `UNLICENSED`／保留所有权利），**不**适用 SIL OFL-1.1。仅它所引用的字体二进制适用 OFL-1.1（见 §4）。其 commit 时哈希见 `MANIFEST.md`。

## 6. 维护规则

- 新增或替换 `static/vendor/` 内任何第三方制品时，必须同步更新本文件、`MANIFEST.md` 与第三方准入记录。
- 本文件仅覆盖 `static/vendor/` 范围。**全仓 SBOM 与完整 NOTICE 仍缺失**；在 `COM-01/COM-02` 完成前，本文件与 `MANIFEST.md` 均不得被解释为发布许可已通过。
- 本文件**不**新增根级开源许可证；根级 `LICENSE` 的有意缺省由 CLEANROOM-CHARTER 决定，须待独立审计完成后再议。
