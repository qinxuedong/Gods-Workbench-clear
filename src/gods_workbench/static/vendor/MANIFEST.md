# Local Vendor Assets — 本地第三方静态资源清单

本目录保存本项目**自托管**的第三方静态资源，供应用在无 CDN 环境下加载。本清单只登记 `static/vendor/` 范围**当前存在**的制品。

**本清单不是发布许可。** 仓库当前发布状态为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 关于仓库级通知文件的准确说明

本目录范围的组件级许可正文与版权通知见同目录 [`LICENSES.md`](./LICENSES.md)。

以下路径**当前不存在**，本清单**不引用**它们，也不得被解释为已提供：

| 路径 | 状态 |
| --- | --- |
| 根级 `NOTICE` | **不存在** |
| 根级 `LICENSE` | **有意不提供**（依 `CLEANROOM-CHARTER.md`：独立审计完成前不添加正式开源许可证） |
| 根级 `THIRD_PARTY_NOTICES.md` | **不存在** |
| `src/gods_workbench/THIRD_PARTY_NOTICES.md` | **不存在** |

**边界声明**：本目录已提供组件级通知（见 `LICENSES.md`），但仓库**尚无完整全仓 NOTICE/SBOM**。因此**不得**把本清单或 `LICENSES.md` 解释为「已补 vendor 完整通知」或发布许可已通过。在 `COM-01/COM-02` 完成前，正式分发保持 `BLOCKED`。

## JavaScript

| 本地文件 | 固定版本 | 上游来源 | 许可证 | SHA256 | 发布动作 |
| --- | --- | --- | --- | --- | --- |
| `js/lucide.js` | Lucide `1.16.0` | [lucide 1.16.0](https://github.com/lucide-icons/lucide/releases/tag/1.16.0) · [npm 不可变制品](https://unpkg.com/lucide@1.16.0/dist/umd/lucide.min.js) | ISC；派生自 Feather 的图标另含 MIT（见 `LICENSES.md` 第 1/2 节） | `187A756625C5CE7499C207D1B0D1CF4E1AB95E3F666C7E0CD0FAFC3E6842D040` | 已附 ISC 与 Feather MIT 正文与版权通知；正式分发 `BLOCKED`（见「分发门禁」） |
| `js/three-0.160.0.module.js` | Three.js `0.160.0` | [npm 不可变制品](https://unpkg.com/three@0.160.0/build/three.module.js) | MIT | `76DEA8151BC9352AEF3528B4262E249B2604F62543828328DB978D060D61A495` | 保留文件头 `@license` 并附 MIT 全文与版权声明；正式分发 `BLOCKED`（见「分发门禁」） |
| `js/tailwindcss-cdn.js` | Tailwind Play CDN `3.4.17` + `@tailwindcss/forms` `0.5.10` + `@tailwindcss/container-queries` `0.1.1`（本地自托管快照） | [固定 URL](https://cdn.tailwindcss.com/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1) · [Tailwind LICENSE](https://github.com/tailwindlabs/tailwindcss/blob/v3.4.17/LICENSE) | MIT（Tailwind / forms / container-queries）+ Apache-2.0（didyoumean）+ CC-BY-4.0（caniuse-lite 数据） | `A789CE5A73191759006B64A0C05F63AFBF9AA43A86511BF798D688737429E60A` | 本地运行不再请求 CDN；**传递依赖闭包与许可通知尚未闭合**，正式分发 `BLOCKED` |

## CSS

| 本地文件 | 用途 | 归属/许可 | SHA256 |
| --- | --- | --- | --- |
| `css/fonts.css` | 下列字体的本地 `@font-face` 声明 | **本项目维护的加载配置**（非第三方制品）；适用本项目自身许可，不适用 SIL OFL-1.1 | `0779FB82CD9040B28555EDE2AC4A193CCC28A23D354F5C7A9AAEA9972C6C05E3` |

## Fonts

字体版本、字重与许可来自文件内部 `name` 表。三个 OTF 的内嵌版本经**独立解析一致为 `1.004`**（name ID 5 = `Version 1.004;PS 1.004;hotconv 16.6.51;makeotf.lib2.5.65220`；name ID 3 = `1.004;ADBO;SourceHanSansCN-<Weight>;ADOBE`）。

此前登记的 `2.004` **与该内嵌版本不符**，已作废。**本轮未替换任何字体二进制。**

三个 OTF 均内嵌声明适用 SIL Open Font License 1.1，并保留字体名称 `Source`。修改版不得沿用保留名称；本项目**未修改**这些字体二进制。

| 字体/版本 | 项目/许可来源 | 本地文件（`css/fonts.css` 字重） | SHA256 |
| --- | --- | --- | --- |
| Source Han Sans CN `1.004` | [Adobe Source Han Sans](https://github.com/adobe-fonts/source-han-sans) · [许可原文](https://github.com/adobe-fonts/source-han-sans/blob/master/LICENSE.txt)（SIL OFL-1.1）；本地 OTF `name` 表可复核 | `fonts/SourceHanSansCN-Normal.otf`（400） | `DD058AC5FD8471302D4F8331384EFF3C594D6FC1FB90F1A3566832E8DA090FAB` |
| Source Han Sans CN `1.004` | 同上 | `fonts/SourceHanSansCN-Medium.otf`（500） | `9CDEB297C219D4A73201C70F01A41F7B0D2FEAB5B0384312EE3E91971A8D037A` |
| Source Han Sans CN `1.004` | 同上 | `fonts/SourceHanSansCN-Bold.otf`（700） | `0972537EF0238CCF5B3B055CAFFC15B69E314AC676B0B9BAC8E5649D76E2F03A` |

### 字体来源证据与缺口

| 字体族 | 已确认来源证据 | 当前结论 |
| --- | --- | --- |
| Source Han Sans CN（3 个 OTF） | 内嵌 `name` 表自声明 OFL-1.1、内嵌版本 `1.004`、制造商 `Adobe Systems Incorporated`。本地字节 9,036,076 / 8,812,324 / 8,806,392 B 与官方 **2.005R** 子集 OTF（8,569,308 / 8,406,556 / 8,434,332 B）**均不一致**；官方 **1.004R** 发布页仅提供单体 `SourceHanSans.ttc`，**不含**这三个 `SubsetOTF/CN/*.otf` | 原始下载制品未逐字节匹配 → **待批准**；正式分发 `BLOCKED` |

## 分发门禁

| 组件 | 阻塞原因 |
| --- | --- |
| Source Han Sans CN（3 个 OTF） | 原始下载制品未定位；与 `adobe-fonts/source-han-sans` 已发布制品逐字节一致性**未经验证**，标记为**待批准**。 |
| `js/tailwindcss-cdn.js` | 传递依赖闭包（Tailwind `3.4.17` + `@tailwindcss/forms` `0.5.10` + `@tailwindcss/container-queries` `0.1.1` + `didyoumean` + `caniuse-lite`）及其许可通知未闭合。 |

`js/lucide.js` 与 `js/three-0.160.0.module.js` 的许可正文与版权通知已随附（见 `LICENSES.md`），但**仍随整包处于 `BLOCKED`**。

## 更新规则

- 禁止使用 `latest` 或浮动 URL 覆盖文件；升级时先锁版本与下载地址，再更新哈希。
- 新增或替换文件时，同步更新本清单、`LICENSES.md` 与第三方准入记录。
- 本目录已提供组件级通知，但**尚无完整全仓 NOTICE/SBOM**；Tailwind 传递制品版本与字体原始获取路径仍未全部闭环。在 `COM-01/COM-02` 完成前，不得把本清单解释为发布许可已通过，也不得声称「已补 vendor 完整通知」。