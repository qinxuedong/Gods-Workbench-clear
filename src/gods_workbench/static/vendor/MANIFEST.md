# Local Vendor Assets

本目录保存第三方静态资源及本项目维护的本地加载配置，供应用在无 CDN 环境下加载；当前归属与许可正文见根目录 [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md)。本清单只记录 `static/vendor/` 文件身份，不替代完整发布 SBOM。

`CLI/windows/openai/vendor/*.tgz` 不是静态资源，不能写入下表或由本清单的自动哈希检查冒充已准入。其私有准入记录为 `CURRENT / BLOCKED (PUBLIC EXPORT / DESKTOP BUNDLE)`；公共导出必须排除该二进制闭包及任何会回退下载未准入 helper 的安装器，直到独立准入解除。

## JavaScript

| 本地文件 | 固定版本 | 上游来源 | 许可证 | SHA256 | 发布动作 |
| --- | --- | --- | --- | --- | --- |
| `js/tailwindcss-cdn.js` | Tailwind Play CDN `3.4.17`（forms `0.5.10`、container-queries `0.1.1`）本地自托管快照 | [官方固定 URL](https://cdn.tailwindcss.com/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1) · [Tailwind LICENSE](https://github.com/tailwindlabs/tailwindcss/blob/v3.4.17/LICENSE) | MIT + Apache-2.0（didyoumean）+ CC-BY-4.0（caniuse-lite） | `A789CE5A73191759006B64A0C05F63AFBF9AA43A86511BF798D688737429E60A` | 本地运行不再请求 CDN；正式分发仍受第三方通知/SBOM 门禁约束 |
| `js/lucide.js` | Lucide `1.16.0` | [Lucide 1.16.0](https://github.com/lucide-icons/lucide/releases/tag/1.16.0) | ISC；Feather 派生图标另含 MIT | `187A756625C5CE7499C207D1B0D1CF4E1AB95E3F666C7E0CD0FAFC3E6842D040` | 同时附 Lucide ISC 与 Feather MIT 全文/版权声明 |
| `js/three-0.160.0.module.js` | Three.js `0.160.0` | [npm 不可变制品](https://unpkg.com/three@0.160.0/build/three.module.js) | MIT | `76DEA8151BC9352AEF3528B4262E249B2604F62543828328DB978D060D61A495` | 保留文件头并附 MIT 全文与版权声明 |

## CSS

| 本地文件 | 用途 | 归属/许可 | SHA256 |
| --- | --- | --- | --- |
| `css/fonts.css` | 下列字体的本地 `@font-face` 声明 | 本项目维护的加载配置，适用根 `LICENSE`；引用字体适用各自 OFL-1.1 | `F2BDAA899C2224E824C3737648C3D92B41BC4BDD810C17062F2B8C6EE71D8E93` |

## Fonts

字体版本、字重和许可来自文件内部 name table；三组字体均适用 SIL Open Font License 1.1。发布时须附 OFL-1.1 全文与版权声明；如上游声明了 Reserved Font Name，修改版不得沿用该名称。仓库初次导入未记录原始下载 URL；下表的项目主页不能单独证明二进制来源，当前正式分发保持 `BLOCKED`，直至为每个本地哈希补齐不可变匹配制品或经确认的替换流程。

| 字体/版本 | 项目/可复核来源 | 本地文件（字重） | SHA256 |
| --- | --- | --- | --- |
| Inter `4.001` | [源码提交 `66647c0bb`](https://github.com/rsms/inter/commit/66647c0bbbe41a850d79d9c76fb13add3378940f)；二进制缺口见下文 | `fonts/inter-5.ttf`（300） | `D0F4BC7FACA468376E3DB9B5E57AFCDC2192134C9AC82A9511F32767B56853A4` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Inter `4.001` | [源码提交 `66647c0bb`](https://github.com/rsms/inter/commit/66647c0bbbe41a850d79d9c76fb13add3378940f)；二进制缺口见下文 | `fonts/inter-4.ttf`（400） | `1B08E7FC267A5C7E1D614100F604B83E7E8A0BE241F0F288FAA2B3AC93A683BA` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Inter `4.001` | [源码提交 `66647c0bb`](https://github.com/rsms/inter/commit/66647c0bbbe41a850d79d9c76fb13add3378940f)；二进制缺口见下文 | `fonts/inter-3.ttf`（500） | `8C883F63B2C4157D997319F2C8BC6995ED4357EF371940D31CA159004A4AAE63` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Inter `4.001` | [源码提交 `66647c0bb`](https://github.com/rsms/inter/commit/66647c0bbbe41a850d79d9c76fb13add3378940f)；二进制缺口见下文 | `fonts/inter-2.ttf`（600） | `E7A1AAF7EDA9F2FAD4131725FA556265EC75CA7B2D756260173A040363E8D4F7` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Inter `4.001` | [源码提交 `66647c0bb`](https://github.com/rsms/inter/commit/66647c0bbbe41a850d79d9c76fb13add3378940f)；二进制缺口见下文 | `fonts/inter-1.ttf`（800） | `EEC66AF7F2337BD34FE6E801CF92EDEDCB57A20C0D7BC40A61D4EEFCBE3DD40C` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| JetBrains Mono `2.211` | [Google Fonts CDN v24（400）](https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf) | `fonts/jetbrains-mono-7.ttf`（400） | `44CE4A84F20D60F24539BD0CEF11F79C29E38609E0F8ADF18551C9794A5D9DC3` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| JetBrains Mono `2.211` | [Google Fonts CDN v24（700）](https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8L6tjPQ.ttf) | `fonts/jetbrains-mono-6.ttf`（700） | `A1D92ABC6B02A87FAED23D98067AB1027E8E95242FD7C9978A072EA383B89D1A` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Space Grotesk `2.000` | [项目 `2.0.0` 提交](https://github.com/floriankarsten/space-grotesk/tree/7220f5d04813fe83babe76d4fd23e02275021280)；二进制不匹配，见下文 | `fonts/space-grotesk-9.ttf`（300） | `2F29B31D803A928D21F96DBE7A5F8BFA5C5C98917736C2D195BC7C737BC906BA` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Space Grotesk `2.000` | [项目 `2.0.0` 提交](https://github.com/floriankarsten/space-grotesk/tree/7220f5d04813fe83babe76d4fd23e02275021280)；二进制不匹配，见下文 | `fonts/space-grotesk-10.ttf`（500） | `3E699EAD1876244FA392243054DDEFE7CF631B488438828A8A100731A22AB995` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Space Grotesk `2.000` | [项目 `2.0.0` 提交](https://github.com/floriankarsten/space-grotesk/tree/7220f5d04813fe83babe76d4fd23e02275021280)；二进制不匹配，见下文 | `fonts/space-grotesk-8.ttf`（700） | `3E756954468FF1CB302DAE0414262E72F76A67D87BEF3FA1F3226CD0FB9B2D85` 〔2026-09-18 核验：本地文件已不存在，条目作废〕 |
| Source Han Sans CN `2.004` | [Adobe Source Han Sans CN](https://github.com/adobe-fonts/source-han-sans/tree/2.004R)；本地 OTF 文件名表可复核 | `fonts/SourceHanSansCN-Normal.otf`（400） | `DD058AC5FD8471302D4F8331384EFF3C594D6FC1FB90F1A3566832E8DA090FAB` |
| Source Han Sans CN `2.004` | [Adobe Source Han Sans CN](https://github.com/adobe-fonts/source-han-sans/tree/2.004R)；本地 OTF 文件名表可复核 | `fonts/SourceHanSansCN-Medium.otf`（500/700） | `9CDEB297C219D4A73201C70F01A41F7B0D2FEAB5B0384312EE3E91971A8D037A` |
| Source Han Sans CN `2.004` | [Adobe Source Han Sans CN](https://github.com/adobe-fonts/source-han-sans/tree/2.004R)；本地 OTF 文件名表可复核 | `fonts/SourceHanSansCN-Bold.otf`（800/950） | `0972537EF0238CCF5B3B055CAFFC15B69E314AC676B0B9BAC8E5649D76E2F03A` |

### 字体来源证据与缺口

| 字体族 | 已确认来源证据 | 当前结论 |
| --- | --- | --- |
| Inter | 5 个文件的 name table 均指向源码提交 [`66647c0bb`](https://github.com/rsms/inter/commit/66647c0bbbe41a850d79d9c76fb13add3378940f)；该提交位于 `v4.0` 与 `v4.1` 之间。现存官方 release 与 gstatic TTF 均未和本地文件逐字节一致 | 精确源码谱系已定位，但原始构建/下载制品不可重现；正式分发 `BLOCKED` |
| JetBrains Mono | 两个文件与表中 gstatic v24 URL 逐字节一致；Google Fonts [入库提交](https://github.com/google/fonts/commit/2e05c1cf00a6e4f40a4b931600a90881c26e15cd) 指向 JetBrains 上游 [`6a005ca77`](https://github.com/JetBrains/JetBrainsMono/commit/6a005ca77d9202aa12fc277aefa8f5bb4eb7f0cd)。v20/v23/v24 是等字节 CDN 别名，本清单选 v24 作为 canonical 复现源 | 当前二进制来源可重现；不得把 `2.211` 虚构为不存在的上游 tag |
| Space Grotesk | name table 为 `2.000`；项目 `2.0.0` 提交及 release 中对应 300/500/700 TTF 均不与本地文件逐字节一致 | 原始构建/下载制品未定位；正式分发 `BLOCKED` |

## 更新规则

- 禁止使用 `latest` 或浮动 URL 覆盖文件；升级时先锁版本与下载地址，再更新哈希。
- 新增或替换文件时，同步更新本清单、许可证矩阵与第三方准入记录。
- 当前仓库已补 `static/vendor/` 范围的第三方通知，但尚无完整全仓 NOTICE/SBOM；Tailwind 三项传递制品版本与字体原始获取路径仍未全部闭环。在 `COM-01/COM-02` 完成前，不得把本清单解释为发布许可已通过。
