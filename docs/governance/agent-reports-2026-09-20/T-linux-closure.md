# P5-A2 Linux 闭包实测报告（2026-09-21）

> 负责人：代理 A2；**主代理复核后重写并完成目标**（A2 所在沙箱 `Wsl/Service/CreateInstance/E_ACCESSDENIED`，见 §6）。
> 证据边界：**本地 WSL2 Ubuntu 24（真实 Linux，非仿真）**。本地通过 ≠ 远端 CI ≠ 生产验收；不构成发布授权。

## 1. 结论

| 目标 | 结果 |
|---|---|
| 真实 Linux 安装 `requirements-dev.txt` | **成功**（30 包） |
| `pip check` | `No broken requirements found.` |
| Linux 全量测试 | **63 passed** |
| Linux 闭包是否含 `uvloop` | **含，`uvloop==0.22.1`** |
| 与 Windows 主表 30 条差集 | **+uvloop，−colorama，其余 29 条版本完全一致** |
| 跨平台哈希锁在 Linux 实测 | **成功**（`--require-hashes`，63 passed） |

## 2. 环境（原始输出）

```text
Linux qin-home 6.18.33.2-microsoft-standard-WSL2 ... x86_64 GNU/Linux
Ubuntu 24.04.4 LTS
Python 3.11.15
```

> 这是 **glibc / manylinux x86_64** 环境，与 GitHub Actions `ubuntu-latest` 同类，可用作 Linux 闭包证据；
> 但**不等于**生产容器（镜像、基础层、非 root 用户、C 库版本仍需单独验收）。

## 3. 安装与测试（原始输出）

```text
$ python3.11 -m venv /tmp/gw-root-linux2
$ /tmp/gw-root-linux2/bin/python -m pip install -r requirements-dev.txt
   annotated-doc-0.0.5 annotated-types-0.8.0 anyio-4.15.1 certifi-2026.7.22 cffi-2.1.1 click-8.5.0 cryptography-46.0.7 fastapi-0.141.1 h11-0.16.0 httpcore-1.0.9 httptools-0.8.0 httpx-0.28.1 idna-3.20 iniconfig-2.3.0 packaging-26.3 pluggy-1.6.0 pycparser-3.0 pydantic-2.13.5 pydantic-core-2.46.5 pygments-2.21.0 pytest-9.1.1 python-dotenv-1.2.3 pyyaml-6.0.3 starlette-1.6.0 typing-extensions-4.16.0 typing-inspection-0.4.4 uvicorn-0.53.0 uvloop-0.22.1 watchfiles-1.2.0 websockets-17.1
  
  ## pip check
```

```text
$ /tmp/gw-root-linux2/bin/python -m pip check
No broken requirements found.

$ /tmp/gw-root-linux2/bin/python -m pytest -q --no-header -p no:cacheprovider
63 passed, 2 warnings in 4.98s
```

完整 `pip freeze`（30 条）与逐条差集见 `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`。

## 4. 差集（Linux `pip freeze` vs `requirements.lock` 主表 30 条）

| 类别 | 内容 |
|---|---|
| 仅 Linux | `uvloop==0.22.1` |
| 仅 Windows | `colorama==0.4.6` |
| 版本不同 | **无**（29 条共有包版本完全一致） |

**原因**：`uvicorn[standard]` 的 `uvloop` 带 `sys_platform != 'win32'` 标记；`colorama` 由 `click` 在 Windows 引入。

## 5. `uvloop` 哈希（补齐 Phase 4 遗留）

```text
wheel : uvloop-0.22.1-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl
sha256: 56a2d1fae65fd82197cb8c53c367310b3eabe1bbb9fb5a04d28e3e3520e4f702
```

该哈希已并入 `requirements.lock.hashes`，且该行带环境标记 `sys_platform != "win32"`。
（主代理实测教训：**不带标记时 Windows 安装会硬失败**，因为 uvloop 不发布 win wheel。）

## 6. 更正记录（主代理复核）

| A2 首版 | 实测/更正 |
|---|---|
| 「WSL 服务访问被拒绝，无法进入真实 Linux」 | A2 沙箱限制；主代理 shell 的 WSL 正常，已完成真实 Linux 实测 |
| `LINUX-CLOSURE-2026-09-21.txt` 仅含失败尝试 | 已重写为真实原始输出 + 完整 `pip freeze` + 逐条差集 + uvloop 哈希 + 跨平台哈希锁验证 |
| 未取得包数 / uvloop / 差集 | 已取得：30 包、`uvloop==0.22.1`、差集如上 |

A2 首版的诚实部分保留：它**没有**伪造 Linux 结果，而是明确登记「未完成」。

## 7. 未完成项与边界

1. 未覆盖 macOS / aarch64 平台；未覆盖 sdist。
2. WSL2 ≠ 生产容器：镜像构建、非 root 用户、只读根文件系统、资源限制、健康检查均未验收。
3. 无 SBOM 签名与来源证明。
4. **口径差异**：哈希锁在 Linux 会额外安装 `colorama`（区间解析不会），属超集，已登记。
5. 未修改 `src/**`、`tests/**`、依赖声明文件；未新增受限二进制；未执行 `git add`/`commit`/`push`/`remote`。


---

## 8. 主代理追加复核（2026-09-21，P5-B1 终审后）

### 8.1 编码修复后的 Linux 复测

原 `requirements*.txt` / `requirements.lock*` 含中文注释但无编码声明，在 **cp936(GBK)** 区域设置下
会被 pip 拒绝解析（`UnicodeDecodeError: 'gbk' codec can't decode ...`，pip 24.0 的 `auto_decode()` 回退
`locale.getpreferredencoding(False)`）。已通过首行追加 PEP 263 声明 `# -*- coding: utf-8 -*-` 修复。

修复后在 WSL2 Ubuntu 24.04.4 / CPython 3.11.15 / 新建 venv（pip 24.0）重新实测：

```text
$ /tmp/gw-r5/bin/python -m pip install --require-hashes -r requirements.lock.hashes
(30 包安装成功)
$ /tmp/gw-r5/bin/python -m pip check
No broken requirements found.
$ /tmp/gw-r5/bin/python -c "import uvloop;print(uvloop.__version__)"
0.22.1
$ /tmp/gw-r5/bin/python -m pytest -q --no-header -p no:cacheprovider
63 passed, 2 warnings in 4.97s
$ sha256sum requirements.lock.hashes
0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56  requirements.lock.hashes
```

### 8.2 边界（不变）

- 本地 WSL2 ≠ 生产容器；macOS / aarch64 未覆盖；无签名与来源证明。
- **本地通过 ≠ 远端 CI ≠ 生产验收**；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
