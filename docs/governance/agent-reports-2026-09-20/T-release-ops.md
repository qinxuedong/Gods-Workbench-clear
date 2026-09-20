# T-release-ops 执行报告（2026-09-20）

## 改动清单

### 新增
- `.github/workflows/ci.yml`
- `requirements.txt`
- `requirements-dev.txt`
- `docs/governance/REMOTE-AND-CI-PLAN-2026-09-20.md`
- `docs/governance/DEPLOYMENT-ACCEPTANCE-EVIDENCE-2026-09-20.md`
- `docs/governance/agent-reports-2026-09-20/T-release-ops.md`

### 修改/删除
- 无。未改动其他代理输出文件。

## 执行命令与输出摘要

1. 只读读取 `docs/governance/AGENT-TASK-2026-09-20.md` 与根 `AGENTS.md`，确认本任务文件边界和禁止 `git add/commit/push/remote`。
2. 只读核对 release 仓：
   - `git -C D:\Working\Code Pro\Gods-Workbench-release status --porcelain`：存在 `_deps.py`、`_e10/`、`_e9/`、`_f3/`、`_g1/`、`_p10.py`、`_p11.py`、`_p9.py`、`_sec9_tmp.md`、`_tmp_scan.py` 未跟踪项。
   - HEAD=`006f3ddce51cd1c022c51f2b963f91380cee6072`；分支=`main`；remote=`https://github.com/qinxuedong/Gods-Workbench.git`；ahead/behind=`41/0`；`origin/main`=`2a95a2fcec8bc1d7fa82bad33281ee733ab79e99`。
   - `gh run list --limit 5`：最近 5 条历史运行均为 `failure`，未将其当作现行证据。
3. 依赖真实 import 核对：`src/**`、`tests/**`、`run.py` 的第三方依赖为 FastAPI、Uvicorn、Pydantic、Pytest、HTTPX。
4. 依赖安装与导入：执行 `python -m pip install -r requirements-dev.txt`，结果为所有要求已满足；随后导入检查通过：`fastapi 0.140.0`、`pydantic 2.12.5`、`uvicorn 0.41.0`、`pytest 9.1.1`、`httpx 0.28.1`。
5. 本地全量测试：执行 `python -m pytest -q --no-header -p no:cacheprovider`，输出 `40 passed in 0.32s`。
6. 二进制白名单扫描：扫描结果 `violations=[]`；3 个 Source Han Sans CN 白名单字体路径均命中。该结果与 CI 内联扫描逻辑一致。
7. CI YAML 结构核对：使用 PyYAML 读取成功；PyYAML 1.1 会把键 `on` 解析为布尔键，属于解析器兼容表现，不是 GitHub Actions 语法错误；workflow 文件保留标准 `on` 写法。
8. 本地部署验收：以 `GW_RELOAD=false` 启动 `python run.py`，实测 `/`、`/docs`、`/healthz`、`/openapi.json`，随后终止服务并确认 `port_2077_open_after_shutdown=False`。启动输出包含 `Uvicorn running on http://127.0.0.1:2077`。
9. 测试前发现 2077 已有旧的 `python run.py` 进程（PID 51196 及其子进程 35032）；为满足“测试完必须关闭进程”，先停止这两个同一服务进程，再进行本次干净启动；未触碰 ComfyUI 的 PID 62304。

## 门禁结果

- 关键依赖导入：通过。
- `.github/workflows/ci.yml`：已写入 Python 3.11、运行期+测试依赖安装、依赖导入验证、全量 pytest 和二进制白名单扫描步骤。
- 本地全量 pytest：通过，40 passed。
- 本地二进制白名单扫描：通过，未发现违规资源。
- 本地部署验收：通过（见 `docs/governance/DEPLOYMENT-ACCEPTANCE-EVIDENCE-2026-09-20.md`），进程已关闭且 2077 端口已释放。
- 远端 CI：未执行。
- 生产验收：未执行。

## 未完成项

- 主代理尚未执行 `git remote add`、`git push`、`gh run watch`；这些命令只在计划文档中给出。
- 远端 CI 与生产部署验收仍待主代理按治理流程执行。

## 证据边界

本报告仅覆盖当前工作树文件、只读 release 核对、依赖安装/导入、本地全量测试、本地二进制扫描和本地服务路由。历史 CI failure 不等于当前 CI 结果；本地验收不等于生产验收；不得据此宣称可发布。
