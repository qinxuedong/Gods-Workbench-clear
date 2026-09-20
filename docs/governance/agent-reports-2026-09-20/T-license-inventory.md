# P5-A3 许可证闭包清点报告（2026-09-21）

## 1. 方法

按任务书 §4 只做文档清点，不修改 `src/**`、`tests/**`、依赖声明或锁文件，不执行 git 操作，不创建根级 `LICENSE`/`THIRD_PARTY_NOTICES.md`。读取并交叉核对：`AGENTS.md`、Phase 5 任务书、许可证合规说明、`requirements.lock`、vendor `MANIFEST.md`、prompt-registry `NOTICE.md` 与 `manifest.json`、Phase 4 SBOM。

许可证来源优先级：SBOM 逐组件 license 字段 > 本地文件头/manifest/NOTICE 声明 > 上游来源字段。对 prompt-registry 明确记录“上游声明不重新授予内容权利”。

## 2. 命令与实测

### 2.1 requirements.lock 主表计数

```powershell
# 解析 requirements.lock 主表
count=30
```

结果：主表 **30 条**；加平台差异 `uvloop==0.22.1` 后 Python 清点 **31 条**。

### 2.2 SBOM 逐组件读取

```text
node 读取 docs/provenance/SBOM-2026-09-20.cdx.json
components 39
```

其中 Python 31 条逐项有 license 记录（`colorama` 的 SPDX id 未提供，已单列未闭环）。其余组件记录为 vendor 文件与 Tailwind 历史条目。

### 2.3 本地文件 SHA-256

执行：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath <path>
```

实测 15 个本地文件（vendor 7 + prompt-registry 8）均有哈希，完整表和哈希见 `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`。关键输出：

```text
vendor/MANIFEST.md                         1148e1d02d166783784fd2efccf290c322931ddf9a4061b3b4548bd49581c648
vendor/css/fonts.css                       0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3
vendor/fonts/SourceHanSansCN-Bold.otf      0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a
vendor/fonts/SourceHanSansCN-Medium.otf    9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a
vendor/fonts/SourceHanSansCN-Normal.otf    dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab
vendor/js/lucide.js                         187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040
vendor/js/three-0.160.0.module.js           76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
prompt-registry/manifest.json                f0c938b5a4102ec71b15daa755f7a3ba10e19445a9b2ea15bfc108aaaa93f349
prompt-registry/NOTICE.md                    297c53ac333bbcb1a4942fdcea7f84afd9da78f0952b731652c8f03c6b0652d9
sources/awesome-gpt-image.json               e5508cad635279cd2c9ddda70d422ad9de8700e7e349e463f2fe433e562a99ec
sources/awesome-gpt4o-image-prompts.json    ece926584179496d426bd9703c0ea30a13b89a9ce0101bb340056d049e58979d
sources/banana-prompt-quicker.json           0ae590d56820d1d9716691e96410ee6869dec28a7261de397f74ad2f6cbedda5
sources/freestylefly-gpt-image-2.json        6dd7eed617ccd629e2c96e1adeb4cf23640f86d6e1769aaa98ebee9de94e1a30
sources/youmind-gpt-image-2.json             4d343babe6bc0e9b5aecc57e2cc7b5afa774a8d386c33f9b3b3a6123f18e748a
sources/youmind-nano-banana-pro.json         61ea3a3a3eba2d9fcb3f21bcaa99a8ac13c720d39b20a7748ce951ddcc3104c9
```

### 2.4 pytest 门禁

执行：

```powershell
python -m pytest -q --no-header -p no:cacheprovider
```

原文结果：

```text
python:
Line |
   2 |  python -m pytest -q --no-header -p no:cacheprovider
     |  ~~~~~~
     |  The term 'python' is not recognized as a name of a cmdlet, function, script file, or operable program.
```

本轮 pytest 数字：**未取得（命令不可用）**。不得引用历史 `63 passed` 作为本轮结果。

## 3. 逐项结果

- Python：`requirements.lock` 30 + Linux `uvloop` 1，共 31；逐条名称、版本、许可证、证据与义务见 inventory §2。
- vendor：7 个实际文件均登记，含 Source Han Sans CN ×3（OFL-1.1）、Lucide（ISC + Feather 派生 MIT）、Three.js（MIT）、字体加载 CSS 与 MANIFEST，并逐项 SHA-256。
- prompt-registry：`manifest.json`、`NOTICE.md`、6 个 `sources/*.json` 均登记；MIT 4 个、CC BY 4.0 2 个；每行均标注“上游声明不重新授予内容权利”。
- CDN：Tailwind URL 未钉死版本，传递依赖/供应链不可复核，标为未闭环。

## 4. 未闭环项（待用户/法务裁决）

1. `colorama` 的 SPDX 许可证字段缺失。
2. Python 31 项缺随发布包完整许可证正文、不可变下载来源/签名来源证明；`uvloop` 还缺跨平台哈希锁闭合。
3. 三个 Source Han Sans CN 字体缺逐文件不可变上游匹配制品/原始下载 URL。
4. Lucide/Feather、Three.js、OFL 等许可正文/版权通知未形成正式发布通知包。
5. prompt-registry 的上游声明不重新授予提示词、图片、名称等内容权利；六个源仍需逐来源权利审查。
6. `davidwu-gpt-image2-prompts` 因上游无明确许可而排除，不得视为已许可。
7. Tailwind CDN 未钉死版本，需决定固定版本 + SRI/镜像/许可策略。
8. 是否建立正式根级许可证/通知文件，必须用户确认；本任务按硬规则未创建。

## 5. 统计与结论

- 实际清点条目：**47**（Python 31 + vendor 7 + prompt-registry 8 + Tailwind 1）。
- 另列排除项：**1**（`davidwu-gpt-image2-prompts`）。
- 本地文件 SHA-256：**15/15 全部实测**。
- 许可证识别：SBOM/本地声明已逐项登记；发布义务闭环：**0 项可宣称完全闭环**。
- 本地测试：**未运行成功/无数字**，原因是 `python` 命令不可用；不代表远端 CI 或生产验收结论。
