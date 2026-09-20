# T-compliance 完成报告（2026-09-20）

## 结论

T-compliance 已完成：新增许可/第三方清单、外部 IdP 方案、部署验收方案，并将本地证据边界与未闭环项写入本报告。按任务书要求，本任务只写入以下四个目标文件，未执行 `git add`、`git commit`、`git push` 或 `git remote`：

- `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`
- `docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md`
- `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`
- `docs/governance/agent-reports-2026-09-20/T-compliance.md`

## 覆盖范围

1. 许可清单覆盖 3 个 Source Han Sans CN OFL-1.1 字体、`vendor/js/lucide.js`、`vendor/js/three-0.160.0.module.js`、Tailwind CDN、prompt-registry 的 manifest 与 6 个 JSON 源文件，以及从 `src/**`/`run.py` 真实 import 得到的 FastAPI、Pydantic、Uvicorn 和 FastAPI 传递依赖 Starlette。
2. 许可清单记录本地路径、字节数、SHA-256、来源、许可证和分发义务；明确组件级记录不等于许可通过，洁净仓仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
3. IdP 方案引用 `src/gods_workbench/core/auth.py:25-40` 的本地 Bearer 检查、`auth.py:13-16` 的角色集合，以及 `routes_projects.py:50-53`/`routes_god_canvas.py:61-64` 的 `X-User-Role` 输入；规划 OIDC Authorization Code + PKCE、JWT/JWKS 轮换、组映射、匿名只读降级、回滚与契约保持。
4. 部署方案覆盖 `python run.py`、默认端口 2077、`/healthz`、根路径 307、静态入口、本地命令与远端/生产验收边界。

## 已执行命令与输出摘要

### 1. 卫生门禁

```text
python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q
......                                                                   [100%]
6 passed in 0.07s
```

结论：通过。

### 2. 应用导入与 TestClient 探针

执行了 `FastAPI TestClient` 对 `/healthz`、`/static/v2/projects.html`、`/static/prompt-registry/manifest.json` 的读取：

```text
200
{'status': 'ok', 'mode': 'cleanroom', 'frozen_contracts': False, 'release_authorized': False}
/static/v2/projects.html 200 text/html; charset=utf-8 63475
/static/prompt-registry/manifest.json 200 application/json 3534
```

结论：当前本地工作区导入和静态读取通过；这不是监听端口、远端 CI 或生产验收证据。

### 3. 运行期依赖盘点

`src/**` AST 静态 import 的第三方顶层模块为 `fastapi`、`pydantic`；`run.py` 直接 import `uvicorn`。当前解释器元数据为：

```text
fastapi 0.140.0  MIT
pydantic 2.12.5  MIT
uvicorn 0.41.0  BSD-3-Clause
starlette 0.52.1  BSD-3-Clause（FastAPI 传递依赖）
```

仓库根目录未发现 `requirements*.txt` 或锁文件，因此依赖可复现安装与完整 SBOM仍未闭环。

### 4. 静态资源哈希核对

已核对 3 个字体、2 个本地 JS vendor、prompt registry manifest 和 6 个 source JSON 的 SHA-256；明细已落在许可清单。`static/vendor/MANIFEST.md` 记录的 Lucide/Three 哈希与当前文件一致；历史 Tailwind 本地文件不存在，当前运行时引用是未钉版本的 CDN。

## 未完成项

- 根级 `LICENSE`/`THIRD_PARTY_NOTICES`、完整 SPDX/CycloneDX SBOM、锁定的 Python 依赖与传递许可证闭包尚未建立。
- Tailwind CDN 版本/传递构建闭包未锁定；生产 CDN、镜像或 SRI 策略尚未决策。
- OIDC/JWKS/组映射/匿名只读降级仅为方案，未改代码、未配置 IdP、未执行登录或密钥轮换验收。
- 未执行全量 `pytest -q --no-header -p no:cacheprovider`、远端 CI、服务器/容器部署、TLS/反向代理、备份恢复、生产流量或公开分发验收。

## 改动清单与证据边界

- 新增：上列四个目标 Markdown 文件。
- 修改：本任务未修改任何既有源码、配置、字体、静态资源或他人输出文件。
- 删除：无。
- 当前工作区在本任务开始前已存在其他代理/主代理的修改与未跟踪任务文件；本报告不把那些改动归因于 T-compliance，也未触碰它们。
- 本地测试通过 ≠ 远端 CI 通过 ≠ 生产验收通过；组件合规记录通过 ≠ 公开分发授权。仓库发布状态继续保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
