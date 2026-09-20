# T-deploy-repro：治理文档漂移修正与部署可复现证据（P4-A3）

> **阅读提示（主代理 2026-09-20 追加）**：§3 记录的安装失败是 **A3 所在沙箱**的限制。
> 主代理在生产 shell 中复跑同一路径后**安装成功**（30 包，`pip check` 通过，63 passed），见 **§8**。
> 引用本文时必须同时引用 §8，不得只摘录 §3 得出「依赖不可安装」的结论。

## 1. 范围与约束

- 仅追加两份治理文档的“更正注记（2026-09-20，Phase 4）”章节，未改写历史行。
- 未执行 `git add`、`git commit`、`git push`、`git remote`、`git checkout`、`git restore` 或 `git reset`。
- 未新增根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`，未新增图片、音视频或字体。
- A1 的 `requirements.lock` 与 SBOM 不在本任务范围内，未生成。

## 2. 依赖文件事实复核

命令：

```powershell
git ls-files requirements.txt requirements-dev.txt
```

原文输出：

```text
requirements-dev.txt
requirements.txt
```

结论：两个依赖文件已被跟踪；任务书给出的历史事实为自提交 `97b8b04` 起存在。历史治理文档中的“无 requirements*.txt”属于已知漂移，本次仅追加更正注记，不修改历史行。

文件内容复核：

```text
requirements.txt:
fastapi>=0.115,<1
uvicorn[standard]>=0.30,<1
pydantic>=2.7,<3
cryptography>=42,<47

requirements-dev.txt:
-r requirements.txt
pytest>=8,<10
httpx>=0.27,<1
```

## 3. 全新 venv 安装实测

环境目录：`%TEMP%\gw-a3-20260920\venv`（不在仓库内）。使用 Blender 随附的 Python 3.11 解释器创建，版本原文输出：

```text
Python 3.11.13
pip 24.0 from C:\Users\QINXUE~1\AppData\Local\Temp\gw-a3-20260920\venv\Lib\site-packages\pip (python 3.11)
```

### 3.1 第一次安装（原文）

命令：`python -m pip install -r requirements-dev.txt`（venv 解释器）。

结果：失败，原文关键错误如下（未改写）：

```text
UnicodeDecodeError: 'gbk' codec can't decode byte 0x96 in position 34: illegal multibyte sequence
install_exit=2
```

### 3.2 设置 UTF-8 后重试（原文）

为排除本机编码因素，设置 `PYTHONUTF8=1` 后再次执行相同安装命令。结果仍失败，原文如下：

```text
WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError(... Failed to establish a new connection: [WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。')
ERROR: Could not find a version that satisfies the requirement fastapi<1,>=0.115 (from versions: none)
ERROR: No matching distribution found for fastapi<1,>=0.115
install_retry_exit=1
```

安装结论：**失败/未完成**。本次没有把失败改写为成功，也没有声称已完成干净环境安装。

### 3.3 pip check 与 pip freeze

安装失败后的同一 venv 执行：

```text
--- pip check ---
No broken requirements found.
pip_check_exit=0
--- pip freeze ---
```

`pip freeze` 无输出。说明该 venv 未安装依赖；`pip check` 的“无冲突”只针对空环境，不是安装成功证据。

## 4. 第三方 import 覆盖复算

扫描命令：使用 Python AST 扫描 `src/**/*.py` 与 `run.py` 的 `Import` / `ImportFrom`，并用 `sys.stdlib_module_names` 排除标准库。

原文输出：

```text
命令: AST 扫描 src/**/*.py 与 run.py 的 Import/ImportFrom
files_scanned= 19
top_level_imports= __future__,base64,binascii,copy,cryptography,dataclasses,datetime,enum,fastapi,gods_workbench,hashlib,hmac,json,os,pathlib,pydantic,secrets,sys,threading,time,typing,urllib,uvicorn
third_party_candidates= cryptography,fastapi,pydantic,uvicorn
declared_by_requirements= fastapi,pydantic,uvicorn,cryptography
coverage_conclusion= PASS: 所有扫描到的第三方顶层 import 均由 requirements.txt 声明；pytest/httpx 仅测试工具并由 requirements-dev.txt 声明。
```

结论：运行时代码扫描到的第三方顶层 import 均有 `requirements.txt` 声明；测试工具 `pytest`、`httpx` 由 `requirements-dev.txt` 声明。该结论是声明覆盖检查，不是版本锁定或安装成功证明。

## 5. 全量 pytest 门禁

按任务书要求执行：

```powershell
python -m pytest -q --no-header -p no:cacheprovider
```

当前机器的 `python` 不在 PATH；为执行字面命令，临时将任务书允许的 `%TEMP%\gw-a2-20260920\bin\python.cmd` 放到 PATH（包装器与运行缓存均在 `%TEMP%`，未入库）。原文输出：

```text
C:\Users\QINXUE~1\AppData\Local\Temp\gw-a2-20260920\run_pytest.py:4: PytestRemovedIn10Warning: pytest.console_main() is deprecated and will be removed in pytest 10.
  raise SystemExit(console_main())
...............................................................          [100%]
63 passed in 0.39s
pytest_exit=0
```

结果：**63 passed，0 failed**。这是本地测试证据；不等于远端 CI，也不等于生产验收。

## 6. 产出文件与未完成项

本代理写入：

1. `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`（仅追加更正注记）；
2. `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`（仅追加更正注记）；
3. `docs/governance/agent-reports-2026-09-20/T-deploy-repro.md`。

未完成 / 限制：

- `requirements-dev.txt` 在本次全新 venv 中安装失败：先遇到 GBK 解码错误，UTF-8 重试后遇到网络套接字权限错误；因此没有可用的安装后版本清单，`pip freeze` 为空。
- 未生成 `requirements.lock`、SBOM、根级许可证/通知文件；这些不属于 P4-A3，且受任务书约束不得擅自新增。
- 未执行远端 CI、容器/服务器部署、TLS/反向代理、真实外部 IdP 或生产流量验收。

### 3.4 原文错误补充（完整关键行）

首次安装 traceback 的关键原文（完整错误类型与定位）：

```text
Traceback (most recent call last):
  File "...\\pip\\_internal\\utils\\encoding.py", line 34, in auto_decode
    return data.decode(
UnicodeDecodeError: 'gbk' codec can't decode byte 0x96 in position 34: illegal multibyte sequence
```

UTF-8 重试的网络错误原文（5 次重试均为同一类错误）：

```text
WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError(... Failed to establish a new connection: [WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。')': /simple/fastapi/
WARNING: Retrying (Retry(total=3, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError(... Failed to establish a new connection: [WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。')': /simple/fastapi/
WARNING: Retrying (Retry(total=2, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError(... Failed to establish a new connection: [WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。')': /simple/fastapi/
WARNING: Retrying (Retry(total=1, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError(... Failed to establish a new connection: [WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。')': /simple/fastapi/
WARNING: Retrying (Retry(total=0, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError(... Failed to establish a new connection: [WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。')': /simple/fastapi/
ERROR: Could not find a version that satisfies the requirement fastapi<1,>=0.115 (from versions: none)
ERROR: No matching distribution found for fastapi<1,>=0.115
```

## 7. 仓库卫生补充

复核时发现仓库工作区存在多处 `__pycache__/*.pyc`（包括本轮测试加载产生的缓存与已有缓存）。它们不在本任务三个产出文件中，且删除属于破坏性文件操作；按照任务书硬规则未擅自删除。故“仓库不留 `.pyc`”这一卫生项本轮未完成，需主代理在获得明确清理授权后单独处理并复核。


---

## 8. 主代理补充：干净环境安装实测成功（2026-09-20，追加）

> 本节为**主代理在自身 shell 中追加**，不改写上文任何一行。上文 §3 的失败是 A3 所在沙箱的真实结果，予以保留。

A3 的 venv 因沙箱网络/编码限制未能安装；主代理在生产 shell 中重跑同一路径后**成功**：

```powershell
python -m venv %TEMP%\gw-root-20260920\venv-clean
%TEMP%\gw-root-20260920\venv-clean\Scripts\python -m pip install -r requirements-dev.txt
```

原始输出（节选）：

```text
Successfully installed annotated-doc-0.0.5 annotated-types-0.8.0 anyio-4.15.1 certifi-2026.7.22
cffi-2.1.1 click-8.5.0 colorama-0.4.6 cryptography-46.0.7 fastapi-0.141.1 h11-0.16.0
httpcore-1.0.9 httptools-0.8.0 httpx-0.28.1 idna-3.20 iniconfig-2.3.0 packaging-26.3
pluggy-1.6.0 pycparser-3.0 pydantic-2.13.5 pydantic-core-2.46.5 pygments-2.21.0 pytest-9.1.1
python-dotenv-1.2.3 pyyaml-6.0.3 starlette-1.6.0 typing-extensions-4.16.0
typing-inspection-0.4.4 uvicorn-0.53.0 watchfiles-1.2.0 websockets-17.1
```

```text
$ <venv>\Scripts\python -m pip check
No broken requirements found.

$ <venv>\Scripts\python -m pytest -q --no-header -p no:cacheprovider
63 passed, 2 warnings in 0.48s
```

**修正后的结论**：`requirements-dev.txt` 在**干净 venv 中可安装、可运行全量测试**。
但该结果仍是**本机 Windows** 证据：

- 未在 Linux（CI / 生产容器）复跑；Linux 闭包会额外包含 `uvloop`。
- 干净环境按**区间约束**解析（得到 30 个包），**未按 `requirements.lock` 的精确钉版本重装**。
- 因此「依赖可复现」仍**未闭环**；生产验收仍需锁文件 + SBOM + 远端 CI + 部署现场证据。

详见 `docs/governance/agent-reports-2026-09-20/T-lock-sbom.md`、`requirements.lock`。
