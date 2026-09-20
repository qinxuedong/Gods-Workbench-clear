# 第三方许可证清点（2026-09-21）

> P5-A3 文档级清点。本文不构成发布许可或法务意见；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。未创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。

## 1. 范围、方法与口径

- 输入：`requirements.lock` 主表 30 条、平台差异登记中的 `uvloop==0.22.1`、Phase 4 CycloneDX SBOM、`static/vendor/MANIFEST.md`、prompt-registry 的 `manifest.json`/`NOTICE.md`/6 个源 JSON。
- 依赖许可证以 `docs/provenance/SBOM-2026-09-20.cdx.json` 的逐组件记录为主；该 SBOM 共记录 31 个 Python library（30 条主表 + uvloop）。
- 每个本地文件均使用 SHA-256 实测；复算命令：
  `Get-FileHash -Algorithm SHA256 -LiteralPath <path>`。
- 版本锁主表复算：从 `requirements.lock` 解析出 **30 条**；`uvloop` 仅 Linux/非 Windows 条件安装，版本按任务书实测为 **0.22.1**。
- “闭环”含义：许可证/来源已识别且本地证据可复核，并已明确再分发义务；若缺少不可变来源、完整许可正文、传递依赖构建清单或内容权利证明，则标为“否（部分证据）”。

## 2. Python 运行期与测试依赖（requirements.lock 主表 30 条 + Linux 平台差异 1 条 = 31 条）

| # | 名称 | 版本 | 许可证 | 本地证据路径 | 主要义务 | 是否闭环 |
|---:|---|---|---|---|---|---|
| 1 | annotated-doc | 0.0.5 | MIT | `requirements.lock`; `docs/provenance/SBOM-2026-09-20.cdx.json` | 保留版权与 MIT 文本 | 否（SBOM 有记录，发布包未附正文） |
| 2 | annotated-types | 0.8.0 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 3 | anyio | 4.15.1 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 4 | certifi | 2026.7.22 | MPL-2.0 | 同上 | 保留 MPL-2.0 通知；修改文件按 MPL 条款提供 | 否（缺发布包通知/来源证明） |
| 5 | cffi | 2.1.1 | MIT-0 | 同上 | 按 MIT-0 保留声明（无署名条件） | 否（缺发布包证据） |
| 6 | click | 8.5.0 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（缺发布包正文） |
| 7 | colorama | 0.4.6 | SBOM 标注“未提供 SPDX id；见 classifier 记录” | 同上；`requirements.lock` | 需按上游元数据/许可证文件核实后履行 | **否，待用户/法务裁决**（SBOM 未给明确 SPDX） |
| 8 | cryptography | 46.0.7 | Apache-2.0 OR BSD-3-Clause | 同上 | 保留 Apache/BSD 文本及 NOTICE（如适用） | 否（缺发布包正文） |
| 9 | fastapi | 0.141.1 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 10 | h11 | 0.16.0 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 11 | httpcore | 1.0.9 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 12 | httptools | 0.8.0 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 13 | httpx | 0.28.1 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 14 | idna | 3.20 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 15 | iniconfig | 2.3.0 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 16 | packaging | 26.3 | Apache-2.0 OR BSD-2-Clause | 同上 | 保留适用 Apache/BSD 文本 | 否（同上） |
| 17 | pluggy | 1.6.0 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 18 | pycparser | 3.0 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 19 | pydantic | 2.13.5 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 20 | pydantic_core | 2.46.5 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 21 | Pygments | 2.21.0 | BSD-2-Clause | 同上 | 保留版权与许可文本 | 否（同上） |
| 22 | pytest | 9.1.1 | MIT | 同上 | 保留版权与 MIT 文本 | 否（测试依赖，若随开发包分发仍需） |
| 23 | python-dotenv | 1.2.3 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 24 | PyYAML | 6.0.3 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 25 | starlette | 1.6.0 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 26 | typing-inspection | 0.4.4 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 27 | typing_extensions | 4.16.0 | PSF-2.0 | 同上 | 保留 PSF 许可与版权声明 | 否（缺发布包正文） |
| 28 | uvicorn | 0.53.0 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 29 | watchfiles | 1.2.0 | MIT | 同上 | 保留版权与 MIT 文本 | 否（同上） |
| 30 | websockets | 17.1 | BSD-3-Clause | 同上 | 保留版权、许可、免责声明 | 否（同上） |
| 31 | uvloop（Linux 专有） | 0.22.1 | MIT | `requirements.lock` 平台差异登记；SBOM | 保留版权与 MIT 文本；仅非 Windows 条件安装 | 否（跨平台哈希/来源证明未闭合） |

## 3. 本地 vendor 文件（7 个，逐文件 SHA-256）

| 本地文件 | 版本/来源 | 许可证 | SHA-256（实测） | 主要义务 | 是否闭环 |
|---|---|---|---|---|---|
| `src/gods_workbench/static/vendor/MANIFEST.md` | 本项目清单；记录 vendor 归属 | 文档本身无独立第三方许可 | `1148e1d02d166783784fd2efccf290c322931ddf9a4061b3b4548bd49581c648` | 不得把清单替代许可正文；历史不存在文件不得冒充当前资产 | 否（其引用的根级通知文件不存在） |
| `src/gods_workbench/static/vendor/css/fonts.css` | 本项目维护的加载配置 | 配置代码按项目状态处理；引用字体依各自许可 | `0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3` | 保持字体来源/许可与配置引用一致 | 否（项目发布许可未建立） |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf` | Source Han Sans CN，Bold | SIL OFL-1.1（据 MANIFEST/字体声明） | `0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a` | 附 OFL-1.1、版权声明；遵守 Reserved Font Name（如适用） | 否（缺逐文件不可变上游匹配/许可正文） |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf` | Source Han Sans CN，Medium | SIL OFL-1.1 | `9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a` | 同上 | 否（同上） |
| `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf` | Source Han Sans CN，Normal | SIL OFL-1.1 | `dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab` | 同上 | 否（同上） |
| `src/gods_workbench/static/vendor/js/lucide.js` | Lucide 1.16.0；文件头含 `@license lucide v1.16.0 - ISC` | ISC；派生 Feather 图标另含 MIT | `187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040` | 保留 ISC、Feather MIT 版权/许可文本 | 否（当前仓库未提供完整通知闭包） |
| `src/gods_workbench/static/vendor/js/three-0.160.0.module.js` | Three.js 0.160.0；npm 不可变制品来源见 MANIFEST | MIT | `76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495` | 保留 MIT 文本与版权声明 | 否（当前仓库未提供完整通知闭包） |

## 4. prompt-registry 文件（8 个：manifest.json、NOTICE.md、6 个 sources/*.json）

### 4.1 registry 元数据文件

| 文件 | 来源/版本 | 许可证/权利边界 | SHA-256 | 义务 | 是否闭环 |
|---|---|---|---|---|---|
| `src/gods_workbench/static/prompt-registry/manifest.json` | 快照 `image-prompt-registry-2026-08-22`；上游注册表 `yukkcat/image-prompts`，hash `702d43e1146d42567b795c735bf50dec550901e34aff270656a4b4efc9dbbd2e` | 元数据清单；各源许可证见下表 | `f0c938b5a4102ec71b15daa755f7a3ba10e19445a9b2ea15bfc108aaaa93f349` | 保持 sourceUrl、作者、许可证、源哈希；不得把注册表 MIT 误当内容授权 | 否（上游内容权利需逐来源审查） |
| `src/gods_workbench/static/prompt-registry/NOTICE.md` | 本项目通知与来源说明 | MIT 来源 + CC BY 4.0 来源；明确“上游声明不重新授予内容权利” | `297c53ac333bbcb1a4942fdcea7f84afd9da78f0952b731652c8f03c6b0652d9` | MIT 保留通知；CC BY 署名、链接许可、说明修改 | 否（缺各上游许可正文/内容权利证明） |

### 4.2 六个源快照（manifest 声明逐项复核）

| 文件 | 上游来源/作者 | 声明许可证 | SHA-256（实测） | 义务与明确边界 | 是否闭环 |
|---|---|---|---|---|---|
| `src/gods_workbench/static/prompt-registry/sources/banana-prompt-quicker.json` | glidea；`https://glidea.github.io/banana-prompt-quicker/`；上游 raw URL 见 manifest；323 条 | MIT | `0ae590d56820d1d9716691e96410ee6869dec28a7261de397f74ad2f6cbedda5` | 保留 MIT 版权/许可；**上游声明不重新授予内容权利**，提示词/图片/名称仍须审查 | 否（内容权利未独立闭环） |
| `src/gods_workbench/static/prompt-registry/sources/freestylefly-gpt-image-2.json` | freestylefly；`awesome-gpt-image-2`；523 条 | MIT | `6dd7eed617ccd629e2c96e1adeb4cf23640f86d6e1769aaa98ebee9de94e1a30` | 同上；**上游声明不重新授予内容权利** | 否（同上） |
| `src/gods_workbench/static/prompt-registry/sources/awesome-gpt-image.json` | Zero Lu；`awesome-gpt-image`；53 条 | MIT | `e5508cad635279cd2c9ddda70d422ad9de8700e7e349e463f2fe433e562a99ec` | 同上；**上游声明不重新授予内容权利** | 否（同上） |
| `src/gods_workbench/static/prompt-registry/sources/awesome-gpt4o-image-prompts.json` | Awesome GPT4o Image Prompts；76 条 | MIT | `ece926584179496d426bd9703c0ea30a13b89a9ce0101bb340056d049e58979d` | 同上；**上游声明不重新授予内容权利** | 否（同上） |
| `src/gods_workbench/static/prompt-registry/sources/youmind-gpt-image-2.json` | YouMind OpenLab；`awesome-gpt-image-2`；126 条 | CC BY 4.0 | `4d343babe6bc0e9b5aecc57e2cc7b5afa774a8d386c33f9b3b3a6123f18e748a` | 署名、链接许可证、说明修改；**上游声明不重新授予内容权利** | 否（内容权利/署名链待审） |
| `src/gods_workbench/static/prompt-registry/sources/youmind-nano-banana-pro.json` | YouMind OpenLab；`awesome-nano-banana-pro-prompts`；129 条 | CC BY 4.0 | `61ea3a3a3eba2d9fcb3f21bcaa99a8ac13c720d39b20a7748ce951ddcc3104c9` | 同上；**上游声明不重新授予内容权利** | 否（同上） |

## 5. 外部 CDN

| 项目 | URL/版本 | 许可证 | 风险 | 是否闭环 |
|---|---|---|---|---|
| Tailwind CSS CDN | 应用引用 `https://cdn.tailwindcss.com`；URL 未钉死不可变版本（历史 MANIFEST 条目曾记录 3.4.17，但对应本地文件已不存在） | Tailwind 本体 MIT；历史 CDN 运行时还可能带 didyoumean Apache-2.0、caniuse-lite CC-BY-4.0 等传递依赖 | 供应链内容可变、无 SRI/锁文件/构建 metafile；传递依赖和版本漂移不可复核 | **否，待用户/法务裁决**（应固定版本并决定镜像/SRI/许可包策略） |

## 6. 未闭环项与待裁决事项

1. `colorama==0.4.6` 的 SBOM 没有明确 SPDX 许可证，仅写“未提供 SPDX id；见 classifier 记录”——**待用户/法务裁决**。
2. Python 31 个组件虽逐条进入 SBOM，但当前仓库未随本任务附完整许可正文、不可变下载来源/哈希证明及签名来源证明——**待用户/法务裁决**。
3. `uvloop==0.22.1` 仅 Linux 条件安装；现有 Windows 主表不覆盖，跨平台哈希锁与 Linux 产物来源仍待闭合——**待用户/法务裁决**。
4. 三个 Source Han Sans CN 二进制仅有本地哈希及 MANIFEST 的 OFL-1.1 声明，缺逐文件不可变上游匹配制品/原始下载 URL——**待用户/法务裁决**。
5. `lucide.js` 的 ISC + Feather MIT、Three.js MIT、字体 OFL-1.1 均缺随发布包提供的完整正文/版权通知——**待用户/法务裁决**。
6. prompt-registry 六个快照的许可证字段来自上游声明；**上游声明不重新授予内容权利**，提示词、图片、名称等权利链仍需逐来源审查——**待用户/法务裁决**。
7. `davidwu-gpt-image2-prompts` 在 manifest 中明确排除（上游未发现明确许可证），本仓不随快照分发；不得将排除误报为已许可闭环。
8. Tailwind CDN URL 未钉死版本，存在可变供应链与传递依赖风险——**待用户/法务裁决**。
9. 依 AGENTS.md/任务书，本次不创建根级 `LICENSE` 或 `THIRD_PARTY_NOTICES.md`；如需正式发布通知包，须用户确认并经独立审计后另行实施。

## 7. 本次测试命令原文

执行：`python -m pytest -q --no-header -p no:cacheprovider`

结果（本机 shell）：

```text
python:
Line |
   2 |  python -m pytest -q --no-header -p no:cacheprovider
     |  ~~~~~~
     |  The term 'python' is not recognized as a name of a cmdlet, function, script file, or operable program.
```

因此本次未取得 pytest 通过数字；这是本地 Python 命令不可用的环境阻塞，不得改写为成功。此前任务书给出的历史基线 `63 passed` 不作为本次实测结果。

> 主代理补充（2026-09-21）：主代理 shell 的 `python` 可用（CPython 3.11.9），实测 `python -m pytest -q --no-header -p no:cacheprovider` = **63 passed**；另在按 `requirements.lock.hashes` 精确重装的干净 venv 中得到 **63 passed** 且 `pip check` 通过。该结果属**主代理实测**，与上表 A3 的沙箱失败记录分列，不互相替代。编码修复（PEP 263 首行声明）证据见 `docs/governance/agent-reports-2026-09-20/T-hashlock.md` §9。

## 8. 统计

- 清点条目总数：**47 个实际资产/依赖条目** = Python 31 + vendor 7 + prompt-registry 8（manifest、NOTICE、6 sources）+ 外部 CDN Tailwind 1；另列 1 个排除源（davidwu）。
- `davidwu-gpt-image2-prompts` 为 manifest 明确排除项，不计入实际资产条目。
- 本地文件 SHA-256：**15/15 全部实测**（vendor 7 + prompt-registry 8）。
- 已闭环：无；许可证识别大多完成，但发布义务闭合、来源证明和内容权利链仍未完成。


---

## 9. 主代理更正记录（2026-09-21，P5-B1 终审后）

### 9.1 六个 source 路径不可复算（已修正，B1 提出）

- 修正前：清点表中 6 个源文件写作裸 `sources/*.json`，按原文路径在仓库根无法定位，复算仅 **9/15** 命中。
- 修正后：全部写成仓库内完整路径 `src/gods_workbench/static/prompt-registry/sources/*.json`，复算 **15/15** 命中。
- 报告正文（`T-license-inventory.md`）同样登记了该相对路径写法，属同一缺陷。

### 9.2 three.js 哈希长度错误（已修正，B1 提出）

- 修正前登记：`原登记串共 65 字符（在正确值第 17 位之后误插入一个 `e`），长度非法`（**65 位**，非法 hex 长度）。
- 磁盘实测：`76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495`（**64 位**）。
- 两文件各 1 处已替换；修正后两文件全部 hex token 长度为 64。

### 9.3 标题计数更正（主代理）

- `## 2`：「主表 30 条」→「主表 30 条 + Linux 平台差异 1 条 = 31 条」（SBOM 记录 31 个 Python library，含 uvloop）。
- `## 4`：「9 个」→「8 个（manifest.json、NOTICE.md、6 个 sources/*.json）」；仓库磁盘实有 8 个 prompt-registry 文件。

### 9.4 未变结论

- 清点条目总数 47（Python 31 + vendor 7 + prompt-registry 8 + Tailwind 1），另列排除项 1；
- 发布义务闭环 **0 项**；许可证/通知正文、Tailwind CDN 固定版本与 SRI、内容权利链仍**待用户/法务裁决**；
- 未创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。
