# 部署验收方案（2026-09-20）

## 结论与边界

当前交付形态是 Python 3.11 + FastAPI 应用的本地/受控启动骨架；本方案是可复制的验收步骤，**不是已完成的部署证明**。当前仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。本地命令可证明工作区快照的可运行性，不能替代远端 CI、正式制品发布或生产验收。

## 当前形态（代码事实）

- 启动入口：`python run.py`。
- `run.py:20-22` 默认 `GW_HOST=127.0.0.1`、`GW_PORT=2077`、`GW_RELOAD=true`；生产/验收建议显式设置 `GW_RELOAD=false`。
- `run.py:30-36` 通过 Uvicorn 启动 `gods_workbench.api.app:app`，并将 `src` 作为 `app_dir`。
- `src/gods_workbench/api/app.py:54-62` 健康检查为 `GET /healthz`，预期返回：

```json
{"status":"ok","mode":"cleanroom","frozen_contracts":false,"release_authorized":false}
```

- `src/gods_workbench/api/app.py:64-67` 根路径返回 307 并指向 `/static/v2/projects.html`；静态资源挂载在 `/static`。

## 本地可验收步骤

以下命令在仓库根目录执行；PowerShell 命令不写入仓库配置、不改变远端状态。

### 1. 解释器与依赖导入

```powershell
python --version
python -c "import fastapi, pydantic, uvicorn; print('imports=ok', fastapi.__version__, pydantic.__version__, uvicorn.__version__)"
python -m pip check
```

期望：Python 为 3.11 系列；打印 `imports=ok` 与版本；`pip check` 输出 `No broken requirements found.`。当前仓库没有 `requirements*.txt` 或锁文件，因此该步骤只能验证当前环境，不能证明可复现安装。

### 2. 洁净室卫生门禁

```powershell
python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q
```

期望：当前快照为 `6 passed`。该结果只覆盖卫生门禁，不等于全量测试或部署验收。

### 3. 应用导入与健康检查（无需监听端口）

```powershell
python -c "import sys; sys.path.insert(0, 'src'); from fastapi.testclient import TestClient; from gods_workbench.api.app import app; c=TestClient(app); r=c.get('/healthz'); print(r.status_code); print(r.json()); assert r.status_code == 200; assert r.json()['status'] == 'ok'"
```

期望：状态码 `200`，JSON 中 `status` 为 `ok` 且 `mode=cleanroom`、`frozen_contracts=false`、`release_authorized=false`；断言失败即阻断。

### 4. 真实本地启动与 HTTP 探针

终端 A：

```powershell
$env:GW_HOST='127.0.0.1'
$env:GW_PORT='2077'
$env:GW_RELOAD='false'
python run.py
```

期望启动日志包含 `服务地址: http://127.0.0.1:2077`。终端 B：

```powershell
$r = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:2077/healthz
$r.StatusCode
$r.Content
(Invoke-WebRequest -UseBasicParsing -MaximumRedirection 0 http://127.0.0.1:2077/).StatusCode
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:2077/static/v2/projects.html).StatusCode
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:2077/static/prompt-registry/manifest.json).StatusCode
```

期望：健康检查 `200` 且内容为健康 JSON；根路径在不跟随重定向时为 `307`；项目中心与提示词清单均为 `200`。验收后终止终端 A 进程，不保留后台服务。

### 5. 契约回归抽查

```powershell
python -m pytest -q --no-header -p no:cacheprovider
```

期望：全量测试全部通过。若只执行本方案步骤 2/3，不得宣称全量通过；失败时记录完整命令、首个失败测试和当前 HEAD。

## 需远端/生产环境验收的项目

以下项目不能由本地 `TestClient` 或单机启动替代：

1. **制品可复现**：提交锁定的 Python 依赖文件、构建哈希、SPDX/CycloneDX SBOM、第三方许可证/NOTICE；验证干净环境安装。
2. **网络与入口**：TLS 证书、反向代理、HTTP→HTTPS、可信 Host、CORS/CSRF、静态缓存与安全响应头；验证外部 DNS/负载均衡和超时策略。
3. **认证与授权**：外部 OIDC/PKCE、JWT/JWKS 轮换、组映射、匿名只读降级、退出/撤销与审计；当前仓库尚未实现 IdP 方案。
4. **数据与任务可靠性**：持久化存储、备份/恢复演练、CAS 冲突、稳定 `job_id`、202 轮询、重启后任务状态及并发限制。
5. **观测与运维**：结构化日志（不得含 token/secret）、指标、追踪、告警、容量、SLO、值班和回滚 Runbook。
6. **发布治理**：远端 CI 必需检查、制品签名/来源、审批记录、独立安全/许可审核；未授权公开发布不得打开。
7. **灾备与安全**：密钥管理器、轮换、最小权限、漏洞扫描、依赖更新策略、RTO/RPO 与故障注入证据。

## 生产验收清单（必须由独立验收人签字）

- [ ] 干净构建环境按锁文件成功安装，SBOM 与制品哈希一致。
- [ ] 反向代理/TLS/安全头/健康探针在真实网络路径上通过。
- [ ] `/healthz`、根重定向、静态入口、API 401/403/409/202 与标准错误包通过。
- [ ] OIDC 登录、JWKS 轮换、角色映射和匿名只读策略通过。
- [ ] 持久化、备份恢复、任务重启、CAS 冲突和并发压测通过。
- [ ] 日志、指标、告警、审计与敏感数据脱敏抽查通过。
- [ ] 回滚演练、发布审批、许可证/第三方通知和安全审计通过。
- [ ] 远端 CI、部署环境和生产现场证据已归档；不能以本地输出替代。

## 当前未完成项与证据边界

本轮未执行远端 CI、容器/服务器部署、TLS/反向代理、真实外部 IdP、生产数据、备份恢复或生产流量验收；也未执行 `git add`、`commit`、`push`、`remote`。因此当前最多可称为“本地可验收方案 + 当前工作区聚焦检查”，不可称为部署完成、生产就绪或公开发布授权。

## 更正注记（2026-09-20，Phase 4）

本节为对历史记录的追加更正，不改写上文第 32 行历史表述。

- 历史行 32 的“当前仓库没有 `requirements*.txt` 或锁文件”表述已由当前工作区事实纠正：`git ls-files requirements.txt requirements-dev.txt` 输出 `requirements-dev.txt`、`requirements.txt`；两文件自提交 `97b8b04` 起已被跟踪。
- 依赖复现实测：在 `%TEMP%\gw-a3-20260920\venv` 以 Python 3.11.13 创建全新环境，并执行 `pip install -r requirements-dev.txt`。首次执行原文错误为 `UnicodeDecodeError: 'gbk' codec can't decode byte 0x96 in position 34: illegal multibyte sequence`；设置 `PYTHONUTF8=1` 重试后的原文错误为 `WARNING: ... NewConnectionError ... [WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。`，随后 `ERROR: Could not find a version that satisfies the requirement fastapi<1,>=0.115` 与 `ERROR: No matching distribution found for fastapi<1,>=0.115`。因此安装结果登记为“失败/未完成”，不能声称干净环境安装成功。
- 失败后的空环境复核：`python -m pip check` 原文为 `No broken requirements found.`；`python -m pip freeze` 无输出。该结果仅说明空环境没有已安装包的冲突，不构成依赖安装成功证据。
- import 覆盖复核扫描命令与结论见部署复现报告：`src/**/*.py` 与 `run.py` 的第三方顶层 import 均被依赖文件声明覆盖。
- 全量回归命令 `python -m pytest -q --no-header -p no:cacheprovider` 在临时 PATH 包装器（仅位于 `%TEMP%\gw-a2-20260920\bin`，未入库）下原文输出 `63 passed in 0.39s`；该结果是本地测试证据，不替代远端 CI 或生产验收。
- A1 负责锁文件与 SBOM；本任务不生成 `requirements.lock`。即使安装成功，也只能说明本地依赖复现步骤可执行，不能证明生产部署、发布授权或生产就绪。
- 原文错误补充：首次安装的错误类型为 `UnicodeDecodeError: 'gbk' codec can't decode byte 0x96 in position 34: illegal multibyte sequence`；UTF-8 重试对 `/simple/fastapi/` 连续 5 次报告 `[WinError 10013] 以一种访问权限不允许的方式做了一个访问套接字的尝试。`，最终为 `ERROR: Could not find a version that satisfies the requirement fastapi<1,>=0.115 (from versions: none)` 与 `ERROR: No matching distribution found for fastapi<1,>=0.115`。完整记录见 `T-deploy-repro.md` §3.4。
