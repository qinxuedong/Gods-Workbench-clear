# 部署验收证据（2026-09-20）

> **本地验收，非生产验收。** 本记录只证明当前工作树在本机启动并响应了指定路由；不证明远端 CI、生产环境、域名、TLS、反向代理、持久化或发布授权已经完成。

## 1. 验收范围

- 启动命令：`$env:GW_RELOAD='false'; python run.py`
- 绑定地址：`127.0.0.1:2077`
- 检查路由：`/`、`/docs`、`/healthz`、`/openapi.json`
- 验收后已发送终止信号并确认端口释放；未留下服务进程。

## 2. 实测记录

| 路由 | 实测状态码 | 响应摘要 |
|---|---:|---|
| `/` | 307 | `location=/static/v2/projects.html` |
| `/docs` | 200 | Swagger UI HTML，可见 `Swagger UI` |
| `/healthz` | 200 | `status=ok; mode=cleanroom; frozen_contracts=false; release_authorized=false` |
| `/openapi.json` | 200 | `info.title=Gods-Workbench Cleanroom API; version=0.1.0` |

原始命令输出与端口关闭检查由同任务报告 `docs/governance/agent-reports-2026-09-20/T-release-ops.md` 摘要记录。

## 3. 结论与边界

- 本地服务路由验收：通过。
- 生产验收：未执行。
- 远端 CI：未执行；release 仓历史运行曾为 failure，不能替代本轮证据。
- 发布授权：未获得；仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

---

## 追加更新（2026-09-20 远端 CI）

本节为**追加**，不改写上文。

- 上文「远端 CI：未执行」为当时快照。修复行尾哈希问题后，远端 CI run `35512673637` = **success**（Linux `40 passed` + 二进制白名单通过）；详见 `docs/governance/agent-reports-2026-09-20/T-ci-remote.md`。
- **生产验收仍未执行**；本地验收 ≠ 远端 CI ≠ 生产验收。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。


---

## 追加更新（2026-09-20/21，Phase 4 远端 CI）

本节为**追加**，不改写上文。

- Phase 4 提交 `fa6b374`（外部 IdP 影子校验模块 + 依赖锁 + SBOM + 独立终审收口）已 push（`c2d3758..fa6b374`）。
- 远端 CI run [`35521632747`](https://github.com/qinxuedong/Gods-Workbench-clear/actions/runs/35521632747) = **success**：
  - 环境 `Python 3.11.16`（ubuntu-latest）；实测 **`63 passed, 2 warnings in 0.50s`**；
  - 步骤「扫描二进制白名单」通过（允许项仅 3 个 Source Han Sans CN 字体路径）；
  - 依赖导入步骤打印 `0.141.1 / 2.13.5 / 0.53.0`，与 `requirements.lock` 主表（干净 venv 实测）**同版本**。
- **生产验收仍未执行**；本地验收 ≠ 远端 CI ≠ 生产验收。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
