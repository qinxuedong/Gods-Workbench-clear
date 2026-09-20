# 许可与第三方合规清单（2026-09-20）

## 结论与范围

本清单基于当前工作区文件、`src/**` 的静态 import、运行期静态资源引用、`static/vendor/MANIFEST.md`、提示词快照 `NOTICE.md`/`manifest.json` 及本地包元数据。它是合规盘点，不是许可批准或公开发布授权。洁净仓当前仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；任何组件“闭环”只表示当前证据下的组件义务已记录，不改变仓库总发布门禁。

仓库根目录当前未发现正式 `LICENSE` 或 `THIRD_PARTY_NOTICES.md`，因此需要根级许可/通知文件、SBOM 与独立审计后，才能讨论分发。

## 组件清单

| 组件 | 版本或标识 | 来源 | 许可证 | 分发义务 | 本地哈希或路径 | 结论 | 未闭环原因 |
|---|---|---|---|---|---|---|---|
| Source Han Sans CN Bold | 字重 Bold | 用户裁决放行；本地文件 | SIL Open Font License 1.1（OFL-1.1） | 保留许可证/版权与字体声明；修改版遵守 Reserved Font Name 条款 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf`；9,036,076 bytes；SHA-256 `0972537EF0238CCF5B3B055CAFFC15B69E314AC676B0B9BAC8E5649D76E2F03A` | 未闭环 | `MANIFEST.md` 记录了 OFL，但原始不可变下载来源与根级通知尚未形成可发布闭包 |
| Source Han Sans CN Medium | 字重 Medium | 用户裁决放行；本地文件 | OFL-1.1 | 同上 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf`；8,812,324 bytes；SHA-256 `9CDEB297C219D4A73201C70F01A41F7B0D2FEAB5B0384312EE3E91971A8D037A` | 未闭环 | 同上 |
| Source Han Sans CN Normal | 字重 Normal | 用户裁决放行；本地文件 | OFL-1.1 | 同上 | `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf`；8,806,392 bytes；SHA-256 `DD058AC5FD8471302D4F8331384EFF3C594D6FC1FB90F1A3566832E8DA090FAB` | 未闭环 | 同上 |
| Lucide | 本地 `lucide.js`，Manifest 标识 1.16.0 | `static/vendor/js/lucide.js`；页面由 `/static/vendor/js/lucide.js` 引用 | ISC；Manifest 同时提示 Feather 派生图标含 MIT | 再分发保留 ISC、版权与 Feather 相关 MIT 声明 | `src/gods_workbench/static/vendor/js/lucide.js`；401,894 bytes；SHA-256 `187A756625C5CE7499C207D1B0D1CF4E1AB95E3F666C7E0CD0FAFC3E6842D040` | 未闭环 | 仓内没有根级第三方通知/完整许可证归档，组件级 Manifest 不能单独构成发布闭包 |
| Three.js | `0.160.0` | `static/vendor/js/three-0.160.0.module.js`；来源指向 unpkg 不可变制品 | MIT | 保留 MIT 许可及版权声明 | `src/gods_workbench/static/vendor/js/three-0.160.0.module.js`；1,272,972 bytes；SHA-256 `76DEA8151BC9352AEF3528B4262E249B2604F62543828328DB978D060D61A495` | 未闭环 | 未发现根级 MIT 通知文件；需把当前哈希、来源与许可证纳入 SBOM/发布包 |
| Tailwind CSS CDN | 页面运行时 `https://cdn.tailwindcss.com?plugins=forms,container-queries`；未在运行时锁定版本 | 外部 CDN（`episode-pipeline.html:17`） | Tailwind 主体 MIT；传递闭包可能包含 Apache-2.0（didyoumean）及 CC-BY-4.0（caniuse-lite），以实际构建制品为准 | 需锁定制品/版本并保留全部传递许可证与署名；网络运行时还需供应链与可用性控制 | 无本地制品；历史 `static/vendor/js/tailwindcss-cdn.js` 已不存在，不能用历史哈希代替当前证据 | 未闭环 | CDN URL 未钉死版本，传递依赖与构建 metafile/lockfile/SBOM 不可从当前仓库复核；且生产设计要求仍需评估 CDN 运行时风险 |
| Prompt registry manifest | `schemaVersion=1`；`snapshotId=image-prompt-registry-2026-08-22`；上游 hash `702d43e1146d42567b795c735bf50dec550901e34aff270656a4b4ef9cdbbd2e` | `src/gods_workbench/static/prompt-registry/manifest.json` | 由各 source 条目分别决定；上游注册表声明不重新授予提示词/图片权利 | 随快照保留 source、作者、许可证、sourceUrl 与哈希；排除无明确许可的来源 | 文件 SHA-256 `F0C938B5A4102EC2D9DDDA70D422AD9DE8700E7E349E463F2FE433E562A99EC`；总数 1230 | 闭环（快照级） | 公开发布仍受仓库总门禁约束；需在发布包中继续携带 NOTICE 与来源元数据 |
| Banana Prompt Quicker | 323 条 | `sources/banana-prompt-quicker.json`；glidea | MIT | 保留上游 MIT 版权/许可文本 | SHA-256 `0AE590D56820D1D9716691E96410EE6869DEC28A7261DE397F74AD2F6CBEDDA5` | 闭环（快照级） | 同上 |
| Freestylefly GPT Image 2 | 523 条 | `sources/freestylefly-gpt-image-2.json`；freestylefly | MIT | 同上 | SHA-256 `6DD7EED617CCD629E2C96E1ADEB4CF23640F86D6E1769AAA98EBEE9DE94E1A30` | 闭环（快照级） | 同上 |
| Awesome GPT Image | 53 条 | `sources/awesome-gpt-image.json`；Zero Lu | MIT | 同上 | SHA-256 `E5508CAD635279CD2C9DDDA70D422AD9DE8700E7E349E463F2FE433E562A99EC` | 闭环（快照级） | 同上 |
| Awesome GPT-4o Image Prompts | 76 条 | `sources/awesome-gpt4o-image-prompts.json` | MIT | 同上 | SHA-256 `ECE926584179496D426BD9703C0EA30A13B89A9CE0101BB340056D049E58979D` | 闭环（快照级） | 同上 |
| YouMind GPT Image 2 | 126 条 | `sources/youmind-gpt-image-2.json`；YouMind OpenLab | CC BY 4.0 | 署名、许可证链接、修改说明；提示词正文未改写但格式/元数据有变更 | SHA-256 `4D343BABE6BC0E9B5AECC57E2CC7B5AFA774A8D386C33F9B3B3A6123F18E748A` | 闭环（快照级） | 同上 |
| YouMind Nano Banana Pro | 129 条 | `sources/youmind-nano-banana-pro.json`；YouMind OpenLab | CC BY 4.0 | 同上 | SHA-256 `61EA3A3A3EBA2D9FCB3F21BCAA99A8AC13C720D39B20A7748CE951DDCC3104C9` | 闭环（快照级） | 同上 |
| Python runtime: FastAPI | 0.140.0（本地环境元数据） | `src/**` 真实 import：`fastapi` | MIT | 保留 MIT；锁定依赖版本并记录传递闭包 | 仅环境元数据；无 `requirements*.txt`/锁文件 | 未闭环 | 版本来自当前解释器而非仓库声明，缺少可复现安装清单与 SBOM |
| Python runtime: Pydantic | 2.12.5（本地环境元数据） | `src/**` 真实 import：`pydantic` | MIT | 同上 | 仅环境元数据；无锁文件 | 未闭环 | 同上 |
| Python runtime: Uvicorn | 0.41.0（`run.py` 真实 import） | `run.py:10` | BSD-3-Clause | 保留 BSD-3-Clause；锁定运行时版本及传递闭包 | 仅环境元数据；无锁文件 | 未闭环 | 同上 |
| Python runtime: Starlette | 0.52.1（FastAPI 传递依赖，非 `src/**` 直接 import） | FastAPI 运行时传递依赖 | BSD-3-Clause | 保留 BSD-3-Clause；纳入 SBOM | 仅环境元数据 | 未闭环 | 未声明在仓库依赖文件中，需由锁文件/构建产物确认 |

## 依据与必须保留的限制

- `static/vendor/MANIFEST.md` 明确列出 Lucide、Three.js、字体与历史 Tailwind 条目；历史 Tailwind 本地文件已经不存在，不能冒充当前资产。
- `static/prompt-registry/NOTICE.md` 明确：快照来自 `yukkcat/image-prompts`，MIT 不重新授予上游提示词/图片/名称权利，预览图仍为外部 URL；无明确许可的 `davidwu-gpt-image2-prompts` 已排除。
- `AGENTS.md` §1.2 的字体白名单仅是仓库二进制卫生例外，不是公开分发授权。**“开源字体放行”不等于“公开分发授权”。** 其余图片、截图、音频、视频及非白名单字体仍一律禁止入库。
- 在补齐根级许可证/NOTICE、可复现依赖锁定、完整 SBOM、CDN/运行时供应链决策并完成独立审计前，不得把本清单解释为“许可通过”。

## 复核建议

1. 生成包含源码、静态资源、字体、CDN 依赖决策和 Python 传递依赖的 SPDX/CycloneDX SBOM，并逐项绑定 SHA-256。
2. 将 OFL-1.1、ISC、MIT、BSD-3-Clause、CC BY 4.0 及 Feather 派生声明纳入发布包；对 CC BY 条目保留作者、来源与修改说明。
3. 对 Tailwind 运行时改为固定、可复核的制品策略，或在生产中明确 CDN 的 SRI/镜像/可用性与许可证闭包。
4. 由独立人工审计复核；在此之前，发布状态继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
