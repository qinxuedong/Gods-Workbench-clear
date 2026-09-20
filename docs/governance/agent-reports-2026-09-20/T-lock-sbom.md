# P4-A1 依赖锁定与 SBOM 报告（2026-09-20）

> 负责人：代理 A1；**主代理复核后重写并升级证据口径**（原稿数字无法复算，见 §7）。
> 证据边界：**本地 Windows 干净 venv 实测**。本地通过 ≠ 远端 CI ≠ 生产验收；本文件不构成发布授权。

## 1. 结论

| 产物 | 内容 | 状态 |
|---|---|---|
| `requirements.lock` | 主表 30 条（干净 venv 实测）+ 本机快照附表 31 条 | 已产出，主表为交付口径 |
| `docs/provenance/SBOM-2026-09-20.cdx.json` | CycloneDX 1.5；39 组件（31 library + 7 file + 1 framework） | 已产出，JSON 可解析 |
| 本报告 | 命令与原始输出 | — |

**本轮证据已升级**：不再只是「本机环境快照」，而是在**全新 venv 中真实联网安装成功**并**跑通全量 pytest**。
但仍是**版本锁，不是哈希锁**；无 wheel 哈希、无签名、无来源证明。

## 2. 干净环境安装实测（关键证据）

环境：`%TEMP%\gw-root-20260920\venv-clean`，CPython **3.11.9**，pip 26.2.1。

```powershell
python -m venv <venv>
<venv>\Scripts\python -m pip install -r requirements-dev.txt
```

原始输出（节选，完整日志见同一任务目录）：

```text
Installing collected packages: websockets, typing-extensions, pyyaml, python-dotenv, pygments,
  pycparser, pluggy, packaging, iniconfig, idna, httptools, h11, colorama, click, certifi,
  annotated-types, annotated-doc, uvicorn, typing-inspection, pytest, pydantic-core, httpcore,
  cffi, anyio, watchfiles, starlette, pydantic, httpx, cryptography, fastapi
Successfully installed annotated-doc-0.0.5 annotated-types-0.8.0 anyio-4.15.1 certifi-2026.7.22 cffi-2.1.1 click-8.5.0 colorama-0.4.6 cryptography-46.0.7 fastapi-0.141.1 h11-0.16.0 httpcore-1.0.9 httptools-0.8.0 httpx-0.28.1 idna-3.20 iniconfig-2.3.0 packaging-26.3 pluggy-1.6.0 pycparser-3.0 pydantic-2.13.5 pydantic-core-2.46.5 pygments-2.21.0 pytest-9.1.1 python-dotenv-1.2.3 pyyaml-6.0.3 starlette-1.6.0 typing-extensions-4.16.0 typing-inspection-0.4.4 uvicorn-0.53.0 watchfiles-1.2.0 websockets-17.1
```

```text
$ <venv>\Scripts\python -m pip check
No broken requirements found.
```

```text
$ <venv>\Scripts\python -m pytest -q --no-header -p no:cacheprovider
63 passed, 2 warnings in 0.48s
```

> 这是本轮**最强的可复现证据**：干净环境按 `requirements-dev.txt` 安装成功且全量测试通过。
> 局限：未按 `requirements.lock` 的精确钉版本重装（见 §6），也未在 Linux 上验证。

## 3. 依赖锁主表（干净 venv `pip freeze`，30 条）

```text
annotated-doc==0.0.5
annotated-types==0.8.0
anyio==4.15.1
certifi==2026.7.22
cffi==2.1.1
click==8.5.0
colorama==0.4.6
cryptography==46.0.7
fastapi==0.141.1
h11==0.16.0
httpcore==1.0.9
httptools==0.8.0
httpx==0.28.1
idna==3.20
iniconfig==2.3.0
packaging==26.3
pluggy==1.6.0
pycparser==3.0
pydantic==2.13.5
pydantic_core==2.46.5
Pygments==2.21.0
pytest==9.1.1
python-dotenv==1.2.3
PyYAML==6.0.3
starlette==1.6.0
typing-inspection==0.4.4
typing_extensions==4.16.0
uvicorn==0.53.0
watchfiles==1.2.0
websockets==17.1
```

## 4. 本机开发环境快照（附表，31 条）

本机与干净 venv 版本不同，但都满足 `requirements-dev.txt` 区间约束：

| 包 | 本机快照 | 干净 venv |
|---|---|---|
| fastapi | 0.140.0 | 0.141.1 |
| pydantic | 2.12.5 | 2.13.5 |
| cryptography | 46.0.5 | 46.0.7 |
| starlette | 0.52.1 | 1.6.0 |
| uvicorn | 0.41.0 | 0.53.0 |
| anyio | 4.12.1 | 4.15.1 |
| idna | 3.11 | 3.20 |
| certifi | 2026.7.22 | 2026.7.22 |

两套环境均 63 passed。**交付口径取干净 venv 主表**。

## 5. scope 判定（按真实闭包）

- **运行期**（`pip --dry-run -r requirements.txt` 闭包，21 个）：`PyYAML, annotated-doc, annotated-types, anyio, cffi, click, cryptography, fastapi, h11, httptools, idna, pycparser, pydantic, pydantic_core, python-dotenv, starlette, typing-inspection, typing_extensions, uvicorn, watchfiles, websockets`
- **仅测试增量**（9 个）：`Pygments, certifi, colorama, httpcore, httpx, iniconfig, packaging, pluggy, pytest`
- 平台差异：`uvloop`（仅非 Windows）。

## 6. 静态资源哈希与许可证

### 6.1 `src/gods_workbench/static/vendor/**`（7/7 实测）

```text
MANIFEST.md                              1148e1d02d166783784fd2efccf290c322931ddf9a4061b3b4548bd49581c648
css/fonts.css                            0779fb82cd9040b28555ede2ac4a193ccc28a23d354f5c7a9aaea9972c6c05e3
fonts/SourceHanSansCN-Bold.otf           0972537ef0238ccf5b3b055caffc15b69e314ac676b0b9bac8e5649d76e2f03a
fonts/SourceHanSansCN-Medium.otf         9cdeb297c219d4a73201c70f01a41f7b0d2feab5b0384312ee3e91971a8d037a
fonts/SourceHanSansCN-Normal.otf         dd058ac5fd8471302d4f8331384eff3c594d6fc1fb90f1a3566832e8da090fab
js/lucide.js                             187a756625c5ce7499c207d1b0d1cf4e1ab95e3f666c7e0cd0fafc3e6842d040
js/three-0.160.0.module.js               76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
```

### 6.2 Python 组件许可证（逐条取自干净 venv METADATA）

| 组件 | SPDX |
|---|---|
| annotated-doc, annotated-types, anyio, fastapi, h11, httptools, iniconfig, pluggy, pydantic, pydantic-core, pytest, PyYAML, typing-inspection, watchfiles | MIT |
| cffi | MIT-0 |
| click, httpcore, httpx, idna, pycparser, python-dotenv, starlette, uvicorn, websockets | BSD-3-Clause |
| Pygments | BSD-2-Clause |
| cryptography | Apache-2.0 OR BSD-3-Clause |
| certifi | MPL-2.0 |
| typing_extensions | PSF-2.0 |
| packaging | Apache-2.0 OR BSD-2-Clause |
| colorama | 未给 SPDX id（仅 BSD classifier） |
| uvloop（Linux） | MIT（未在本机解析） |

### 6.3 静态/前端资源

Source Han Sans CN = OFL-1.1；Lucide = ISC（含 Feather 派生 MIT）；Three.js = MIT；
Tailwind CSS CDN = MIT 主体，传递依赖可能含 Apache-2.0 / CC-BY-4.0，且 **URL 未钉死版本**。
依据：`src/gods_workbench/static/vendor/MANIFEST.md`、`src/gods_workbench/static/prompt-registry/NOTICE.md`。

## 7. 更正记录（主代理复核）

A1 首版部分数字**不可复算且与实测不符**，已修正：

| 原稿 | 实测/更正 |
|---|---|
| 锁 29 条 | 主表 **30 条**（干净 venv）；附表 31 条 |
| SBOM 37 组件（29 library） | **39 组件（31 library + 7 file + 1 framework）** |
| certifi 2025.8.3 / cffi 2.0.0 / httptools 0.7.1 / idna 3.1 / pycparser 2.23 / Pygments 2.19.2 / python-dotenv 1.1.1 / watchfiles 1.1.0 / websockets 15.0.1 | 均为未执行产生的推测值，已按 `pip freeze` 实测改写 |
| SBOM 许可证字段全空 | 已逐条填入真实 SPDX id / classifier |
| 「未取得 pytest 结果」 | 主代理在干净 venv 实测 **63 passed** |

原稿的诚实部分保留：它**没有**把未执行的命令冒称已通过，并明确登记了沙箱限制。

## 8. 未完成项与证据边界

1. **未按 `requirements.lock` 精确钉版本重装验证**（干净 venv 是按 `requirements-dev.txt` 区间解析）。
2. **无哈希锁**（缺 wheel/sdist SHA-256）、无 SBOM 签名、无来源证明（如 SLSA / in-toto）。
3. 锁文件为 Windows 口径，**未覆盖 Linux 的 `uvloop`**；Linux CI 与生产容器闭包仍未验证。
4. SBOM 由本地脚本构造，**不是** `syft` / `cyclonedx-bom` 等第三方工具生成并经签名的制品。
5. 提示词快照 6 个 `sources/*.json` 与 Tailwind CDN 的完整许可证闭包仍属未闭环。
6. **本任务（P4-A1）未修改依赖声明文件**；但本轮 Phase 4 的 P4-A2 已在 `requirements.txt` 追加 `cryptography>=42,<47`（详见 `T-oidc-shadow.md`），故「本轮未新增依赖」不成立，特此更正。
   未新增图片/音视频/字体；未执行 `git add`/`commit`/`push`/`remote`。
