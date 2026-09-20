# P5-A1 哈希锁与按锁精确重装报告（2026-09-21）

> 负责人：代理 A1；**主代理复核后重写并完成目标**（A1 所在沙箱 PyPI 被 `WinError 10013` 阻断，见 §6）。
> 证据边界：**本地 Windows 环境**。本地通过 ≠ 远端 CI ≠ 生产验收；本文件不构成发布授权。

## 1. 结论

| 目标 | 结果 |
|---|---|
| `requirements.lock.hashes` 生成 | **完成**：31 行版本，跨平台双段 sha256 |
| `pip install --require-hashes` 干净环境重装 | **成功**（30 包） |
| 按锁环境全量测试 | **63 passed** |
| 哈希强制生效验证（篡改实验） | **生效**：篡改任一哈希即 `THESE PACKAGES DO NOT MATCH THE HASHES` 硬失败 |
| Linux/uvloop 覆盖 | **已完成**（P5-A2 在 WSL Linux 生成 `uvloop==0.22.1` 哈希并合并；见 §5） |

`requirements.lock.hashes` 全文 SHA-256 = `0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56（原登记值，经主代理追加编码声明后作废，见 §9）`

## 2. 生成方法（可复算）

```powershell
python -m pip download --no-deps --only-binary=:all: --dest <dir> -r requirements.lock
# 对下载到的 30 个 wheel 逐个计算 sha256，生成 pip --require-hashes 格式
```

- 30 个包**全部存在 wheel**，无需 sdist；下载输出结尾为
  `Successfully downloaded annotated-doc ... websockets`（30 个）。
- 哈希由脚本对 wheel 文件字节计算，**非人工填写**。

## 3. 按锁精确重装（原始输出）

```powershell
python -m venv <venv>
<venv>\Scripts\python -m pip install --require-hashes -r requirements.lock.hashes
```

原始输出（节选）：

```text
Successfully installed PyYAML-6.0.3 Pygments-2.21.0 annotated-doc-0.0.5 annotated-types-0.8.0 anyio-4.15.1 certifi-2026.7.22 cffi-2.1.1 click-8.5.0 colorama-0.4.6 cryptography-46.0.7 fastapi-0.141.1 h11-0.16.0 httpcore-1.0.9 httptools-0.8.0 httpx-0.28.1 idna-3.20 iniconfig-2.3.0 packaging-26.3 pluggy-1.6.0 pycparser-3.0 pydantic-2.13.5 pydantic_core-2.46.5 pytest-9.1.1 python-dotenv-1.2.3 starlette-1.6.0 typing-inspection-0.4.4 typing_extensions-4.16.0 uvicorn-0.53.0 watchfiles-1.2.0 websockets-17.1
```

```text
$ <venv>\Scripts\python -m pip check
No broken requirements found.

$ <venv>\Scripts\python -m pytest -q --no-header -p no:cacheprovider
63 passed, 2 warnings in 0.51s
```

安装后 `pip freeze`（30 条）：

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

## 4. 哈希强制生效（篡改实验，主代理）

把第一行哈希前缀替换为 `deadbeef` 后强制从索引重装：

```text
ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.
    annotated-doc==0.0.5 from https://files.pythonhosted.org/.../annotated_doc-0.0.5-py3-none-any.whl:
        Expected sha256 deadbeef117bac03a25ede5df5440e855b32d556049ca169ead221505badf432fed4b101
             Got        117bac03a25ede5df5440e855b32d556049ca169ead221505badf432fed4b101
```

→ 证明该文件**真的在强制校验哈希**，不是装饰性文件。

## 5. 覆盖边界（重要）

1. **平台限定**：本文件仅含 **Windows / cp311** wheel 的 SHA-256。Linux/macOS 的同版本 wheel
   哈希不同，跨平台交付必须另行生成对应平台哈希段（pip 允许同版本多哈希）。
2. **不含 `uvloop`**：它只出现在非 Windows 的 `uvicorn[standard]` 闭包，本机（Windows）无法取得可用轮子。
   必须在 Linux 侧生成后并入；本任务未完成该覆盖。
3. **不含 sdist 哈希**：本机解析的 30 条全部有 wheel，故未涉及；若上游撤轮，锁会失效并需重签。
4. **不是来源证明**：哈希锁证明「下载内容与登记一致」，**不证明**来源可信（无 SLSA / in-toto / 签名）。

## 6. 更正记录（主代理复核）

A1 首版产物**未达成目标**，已保留其失败证据并更正：

| A1 首版 | 实测/更正 |
|---|---|
| `requirements.lock.hashes` 仅 30 条版本、**0 条哈希**，文件头写明「generation failed」 | 主代理在网络可用环境生成 **30 条真实 sha256**，并完成按锁重装 |
| 「PyPI 连接被 `WinError 10013` 拒绝」 | A1 沙箱限制，非项目问题；主代理 shell 可正常访问 PyPI |
| 按锁重装 / pytest 「未能执行」 | 主代理实测：重装**成功**、`pip check` 通过、**63 passed** |

A1 首版的诚实部分予以保留：它**没有**伪造哈希，而是明确写出「0 条 SHA-256」「本文件有意不完整」。

## 7. 未完成项

1. Linux/macOS 平台的哈希段未生成（依赖 P5-A2 的 Linux 实测结果）。
2. `uvloop` 哈希未覆盖。
3. 无 SBOM 签名与来源证明（SLSA / in-toto）。
4. 未修改 `requirements.lock` / `requirements.txt` / `src/**` / `tests/**`；未新增受限二进制；未执行 `git add`/`commit`/`push`/`remote`。


---

## 8. 追加：跨平台哈希锁（2026-09-21，主代理）

Phase 5 的 P5-A2 在 WSL Ubuntu 24 取得 Linux 闭包后，本文件已升级为**跨平台双段哈希锁**：

- Windows 段：`hashdl/` 中 30 个 win/any wheel 的 sha256；
- Linux 段：`linux-wheels/` 中 31 个 manylinux/any wheel 的 sha256；
- 合并规则：同名同版本的多平台哈希并入同一行的多个 `--hash=sha256:`；
- `uvloop==0.22.1` 单独一行，**带环境标记** `sys_platform != "win32"`。

### 8.1 双平台实测

| 平台 | 命令 | 结果 |
|---|---|---|
| Windows | `pip install --require-hashes -r requirements.lock.hashes`（新 venv） | **成功**；`uvloop` 正确跳过；`pytest` **63 passed** |
| Linux (WSL) | 同上 | **成功**；装入 `uvloop==0.22.1`；`pytest` **63 passed** |

### 8.2 实测发现（重要）

1. **不加环境标记会直接失败**：首版把 `uvloop==0.22.1` 写成无标记依赖，Windows 安装报
   `THESE PACKAGES DO NOT MATCH THE HASHES`（因为 uvloop 不发布 win wheel）。加 `sys_platform != "win32"` 后恢复。
   该失败与修复过程保留在此，作为「哈希锁必须带平台标记」的实证。
2. **哈希锁在 Linux 是区间闭包的超集**：按 `requirements-dev.txt` 区间解析时 Linux **不装 `colorama`**，
   但哈希锁将其列为普通依赖，故 Linux 也会安装 `colorama==0.4.6`。不影响功能与测试，但需在交付说明写明。

### 8.3 更新后的边界

- 已覆盖 **Windows + Linux(manylinux x86_64)**；**未覆盖 macOS / aarch64**。
- 未含 sdist 哈希；无签名与来源证明（SLSA / in-toto）。


---

## 9. 主代理更正记录（2026-09-21，P5-B1 终审后）

B1 独立终审判 **不可提交**，并提出可复现性缺陷。主代理逐条复现后确认并修正，全部证据如下（保留 B1 原始失败记录，不覆盖）。

### 9.1 缺陷一：`requirements.lock.hashes` 哈希值长度错误（已修正）

- B1 与主代理复算：`src/gods_workbench/static/vendor/js/three-0.160.0.module.js` 的真实 sha256 为
  `76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495`（**64 位**）。
- A3 清单与报告中登记为 `原登记串共 65 字符（在正确值第 17 位之后误插入一个 `e`），长度非法`（**65 位**，多插入一个 `e`），无法通过长度校验，属**错误哈希**。
- 已修正：`docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md` 与 `docs/governance/agent-reports-2026-09-20/T-license-inventory.md` 各 1 处替换为 64 位正确值；复算后两文件 hex token 全部为 64 位。

### 9.2 缺陷二：清单 6 个 source 路径不可复算（已修正）

- A3 清单中 6 个 `sources/*.json` 只写了仓库根相对之外的裸相对路径，按原文无法定位文件；B1 按原文路径复算仅 **9/15** 命中。
- 已修正为完整路径 `src/gods_workbench/static/prompt-registry/sources/*.json`，修正后 **15/15** 可复算命中。
- 同时修正两处标题计数错误：`## 2` 由「主表 30 条」改为「主表 30 条 + Linux 平台差异 1 条 = 31 条」；`## 4` 由「9 个」改为「8 个」。

### 9.3 缺陷三（主代理新发现，P0 级）：依赖清单在 GBK/cp936 区域设置下无法被 pip 解析

- 环境实话：本机 `locale.getpreferredencoding(False)` 为 **cp936**（活动代码页 936），`python -m venv` 自带 **pip 24.0**。
- 实测（原始输出）：
  ```text
  venv(pip 24.0) + 默认 cp936:
  requirements.txt      : FAIL (UnicodeDecodeError: 'gbk' codec can't decode byte 0x96 ...)
  requirements-dev.txt  : FAIL (UnicodeDecodeError: 'gbk' codec can't decode byte 0x96 ...)
  requirements.lock     : FAIL (UnicodeDecodeError: 'gbk' codec can't decode byte 0x89 ...)
  requirements.lock.hashes : FAIL (UnicodeDecodeError: 'gbk' codec can't decode byte 0xaf ...)
  ```
- 根因：四个清单文件含中文注释但均无 BOM 与 PEP 263 编码声明；pip 的 `auto_decode()`（pip 24.0）
  在无 BOM、无 `coding:` 声明时回退 `locale.getpreferredencoding(False)`，即 cp936，随即解码失败。
- 影响：在中文 Windows 默认区域设置 + 较旧 pip 下，**按锁重装与依赖安装直接不可用**；这不是「哈希不符」，而是「文件无法读取」，且此前 A1/A2 报告未覆盖该路径（其 venv 恰好设置了 `PYTHONUTF8=1`）。
- 修复：为 `requirements.txt`、`requirements-dev.txt`、`requirements.lock`、`requirements.lock.hashes`
  **各追加首行 PEP 263 编码声明** `# -*- coding: utf-8 -*-`（仅追加首行，不改任何依赖行与哈希值）。
- 修复后实测（同一 pip 24.0 + 默认 cp936，未设 `PYTHONUTF8`）：
  ```text
  requirements.txt      : OK
  requirements-dev.txt  : OK
  requirements.lock     : OK
  requirements.lock.hashes : OK
  pip install --require-hashes -r requirements.lock.hashes : Successfully installed ... (30 包，uvloop 正确跳过)
  pip check : No broken requirements found.
  pytest -q --no-header -p no:cacheprovider : 63 passed, 2 warnings
  ```
- 因追加首行，`requirements.lock.hashes` 文件 sha256 由
  `cdf4f469a88bd45d71352335023c11721db333f85b4e86a718f93463fcb7b087`
  变为 **`0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56`**（见 §1 已同步）。

### 9.4 缺陷四：哈希锁篡改实验的历史证据未含编码修复

- §4 篡改实验为历史证据，仍在编码声明缺失的旧文件上执行；其结论（哈希强制校验生效）成立，
  但**不覆盖** 9.3 的解析缺陷。二者必须分开表述，不得互相替代。

### 9.5 证据边界（重申）

- 本地实测（主代理本轮）：哈希长度、路径可复算、GBK 解析失败与修复、按锁重装、`pip check`、63 passed。
- 历史/文件内证据：A1/A2 原始 pip/WSL 输出（其环境已设 UTF-8，未暴露 9.3）。
- 远端 CI：尚未触发（本轮提交后由主代理读回）。
- 生产验收：未执行；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


### 9.6 编码修复后的双平台复测（主代理，2026-09-21）

修复（PEP 263 首行声明）后在**未设 `PYTHONUTF8`** 的环境重新按锁重装：

| 平台 | 解释器 / pip | 命令 | 结果 |
|---|---|---|---|
| Windows（cp936 区域设置） | CPython 3.11.9 / pip 24.0（新建 venv） | `pip install --require-hashes -r requirements.lock.hashes` | **成功**（30 包，`uvloop` 按标记跳过）；`pip check` 通过；`pytest` **63 passed** |
| Linux（WSL2 Ubuntu 24.04.4） | CPython 3.11.15 / pip 24.0（新建 venv） | 同上 | **成功**；`import uvloop` → **0.22.1**；`pip check` 通过；`pytest` **63 passed** |

Linux 侧复算：`sha256sum requirements.lock.hashes` = `0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56`（与 Windows 一致，行尾归一后同值）。

> 说明：`uvloop` 在 Windows 未被安装、在 Linux 正确安装，证明 `sys_platform != "win32"` 标记与双段哈希合并均生效。
