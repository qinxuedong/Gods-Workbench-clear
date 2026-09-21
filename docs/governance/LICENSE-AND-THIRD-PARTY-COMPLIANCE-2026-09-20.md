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

## 更正注记（2026-09-20，Phase 4）

本节为对历史记录的追加更正，不改写上文第 26–29 行历史表述。

- 历史行 26–29 的“无 `requirements*.txt`/锁文件”表述已由当前工作区事实纠正：复核命令 `git ls-files requirements.txt requirements-dev.txt` 输出 `requirements-dev.txt`、`requirements.txt`；两文件自提交 `97b8b04` 起已被跟踪。当前 `requirements.txt` 声明 FastAPI、Uvicorn、Pydantic、Cryptography，`requirements-dev.txt` 通过 `-r requirements.txt` 继承运行期依赖并追加 pytest、httpx。
- 复核命令：`Get-Content requirements.txt; Get-Content requirements-dev.txt`。结论：仓库已有依赖声明文件；本注记不把其等同于精确版本锁或发布合规闭包。
- 依赖安装实测见 `docs/governance/agent-reports-2026-09-20/T-deploy-repro.md`：在 `%TEMP%\gw-a3-20260920\venv` 使用 Python 3.11.13 新建环境；首次安装因本机 pip 文件解码报错失败，设置 `PYTHONUTF8=1` 重试后因网络套接字权限失败，均按原文记录，未改写为成功。
- import 覆盖复核命令扫描 `src/**/*.py` 与 `run.py`；第三方顶层 import 为 `cryptography, fastapi, pydantic, uvicorn`，均由 `requirements.txt` 覆盖；pytest/httpx 为开发测试依赖，由 `requirements-dev.txt` 覆盖。
- 本次更正不改变组件“未闭环”判断：A1 负责 `requirements.lock` 与 SBOM；本任务未生成锁文件，亦未新增根级 `LICENSE` 或 `THIRD_PARTY_NOTICES.md`。


## 追加更正（2026-09-20，Phase 4，主代理补充）

本节继续追加，不改写上文任何一行。上文 A3 注记记录的是 A3 所在沙箱的安装失败；主代理在自身 shell 中复跑后**安装成功**，故「依赖可复现」的**环境阻塞已解除，但结论仍未闭环**：

- 干净 venv 实测：`pip install -r requirements-dev.txt` 成功（30 个包），`pip check` 无冲突，`pytest` **63 passed**。
- 仍未闭环的部分：未按 `requirements.lock` 精确钉版本重装；无哈希锁；未在 Linux/容器复跑（Linux 会额外安装 `uvloop`）；无 SBOM 签名与来源证明。
- 证据文件：`requirements.lock`、`docs/provenance/SBOM-2026-09-20.cdx.json`、`docs/governance/agent-reports-2026-09-20/T-lock-sbom.md`。
- 因此本清单中 Python 运行期组件的「未闭环」判定**维持不变**，原因从「无依赖声明/无法安装」更新为「缺哈希锁、跨平台锁与签名来源证明」。


## 追加更正（2026-09-21，Phase 7）：`colorama==0.4.6` SPDX 落地

本节仅追加，不改写上文任何一行。

**问题**（`HANDOFF-5.md` §5 第 2 条）：SBOM 中 `colorama==0.4.6` 的许可证字段原记为
「未提供 SPDX id；见 classifier 记录」，需上游元数据/许可证文件核实。

**实测依据**（2026-09-21，主代理 `https://pypi.org/pypi/colorama/0.4.6/json`）：

```text
info.license            = ''            （空字符串）
info.license_expression = None          （无 SPDX 表达式）
classifiers             = ['License :: OSI Approved :: BSD License']
```

- 上游 **PyPI 元数据确实没有提供 SPDX id**（既无 `license` 文本，也无 `license_expression`）。
- 取该版本 **sdist**（`colorama-0.4.6.tar.gz`）核对：内含 `LICENSE.txt`（SHA-256
  `CAC35C02686E5D04A5A7140BFB3B36E73AED496656E891102E428886D7930318`），为 **3 条款 BSD** 正文：
  ① 源码再分发条件；② 二进制再分发条件；③ **不得用作者/贡献者名义背书**（`Neither the name ...`）。
  `PKG-INFO` 声明 `License-File: LICENSE.txt`。

**判定**：该组件的实际许可证为 **BSD-3-Clause**（三条款 BSD）。依据是 sdist 内 LICENSE 正文，
而非 PyPI 元数据（元数据未给 SPDX id，仅有 `License :: OSI Approved :: BSD License` classifier）。

**SBOM 更正**：`docs/provenance/SBOM-2026-09-20.cdx.json` 中该组件：

- 更正前：`licenses[0].license.name = "未提供 SPDX id；见 classifier 记录"`
- 更正后：`licenses[0].license.id = "BSD-3-Clause"`，`licenses[0].license.name = "BSD 3-Clause License"`，
  并新增属性 `gw:license:spdx-evidence` 记录上述判定依据。
- JSON 合法性自检：`python -c "import json;json.load(open('docs/provenance/SBOM-2026-09-20.cdx.json',encoding='utf-8'))"` 通过。

**边界**：本次更正只解决「SBOM 中该组件许可证字段缺失 SPDX id」这一条，**不改变**仓库总发布门禁。
仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；公开发布需独立审计与合规评估。
