# Gods Workbench（洁净修复版）

本仓库是依据行为规范、接口契约、黄金夹具和逐文件来源分类进行的私有洁净实现。当前状态为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**，测试通过不等于生产就绪或独立发布授权。

## 当前实现范围

- 项目中心：活跃/归档/回收站筛选、搜索、创建、编辑、排期和 CAS 生命周期治理。
- `god-canvas`：普通拓扑读取、节点拖动、节点删除、CAS 保存、JSON/`.godmap` 导入导出。
- 智能画布最小链路：`202 Accepted`、稳定 `job_id`、任务轮询、状态机和权限错误语义。
- 原生前端：HTML5、现代 JavaScript、CSS；仅保留两个经审查的日期选择器非画布切片，项目中心和画布 UI 均按契约重写。

## 认证边界

通过 `python run.py` 或双击入口启动时，默认启用 **本地数据库账户登录**（`local_account`）。首次打开页面会提示创建管理员，账号密码由你自己设置，没有默认密码；新密码至少8位，包含字母和数字，不强制特殊符号。之后使用顶部头像登录/退出；登录后现有业务接口按数据库角色授权，不信任 `X-User-Role` 或任意 Bearer。

- 账户及会话数据库默认在 `%LOCALAPPDATA%\GodsWorkbenchClear\auth.sqlite3`（Windows）；可以通过 `GW_LOCAL_AUTH_DB` 指定绝对路径，不要放入源码仓库。
- 密码仅保存带随机盐的 scrypt 哈希；会话8小时到期，退出立即撤销。数据库需按敏感文件管理，备份前先停服务。
- 首位管理员仅能从本机 `localhost` / `127.0.0.1` 页面创建；写请求要求同源。默认只监听回环地址，本轮不代表互联网部署验收。
- 历史 `GW_AUTH_MODE=local` 仅供原有开发测试，**不是真实账户认证，不得用于日常使用**。直接使用 uvicorn 时必须显式设置 `GW_AUTH_MODE=local_account`。
- 如启动环境显式设有 `GW_AUTH_MODE=oidc`，保留原 OIDC 流程；本地登录无需配置任何 IdP。
- 本轮持久化范围仅本地登录账户与会话；既有团队/成员管理数据仍为内存模型，不等于可登录账户。

更新前已经运行的进程需要重启后才会使用新后端。忘记密码暂不提供自助重置，不要通过删除数据库重置，以免丢失账户。

## 快速启动

环境：Python 3.11+、FastAPI、Uvicorn、Pydantic v2。

```powershell
python run.py
```

默认服务地址：`http://127.0.0.1:2077`

### Windows 一键启动

在 Windows 资源管理器中**双击**仓库根目录的 `启动GodsWorkbench.pyw`（需已安装并关联 Python 3.11），程序会：

1. 检查 `2077` 端口上是否已有健康的 Gods-Workbench 服务；
2. 未运行时弹出独立后台控制台启动 `run.py`，实时显示运行日志与报错；
3. 等待 `/healthz` 通过后自动打开项目中心首页；
4. 控制台输出同步写入根目录 `logs/`；服务退出时保留窗口，按 Enter 关闭。关闭运行中的后台窗口会停止服务。

已经运行时仅打开首页，不重复启动第二个后台。PowerShell 备用入口仍使用后台日志模式。

如需只启动服务、不打开浏览器：

```powershell
py -3 .\启动GodsWorkbench.pyw --no-browser
```

若双击打开的是编辑器，请先将 `.pyw` 关联到 Python Launcher (`pyw.exe`)；也可右键 `启动GodsWorkbench.ps1` 选择“使用 PowerShell 运行”。

- 项目中心：`http://127.0.0.1:2077/`（307 重定向到 `/static/v2/projects.html`）
- `god-canvas`：`http://127.0.0.1:2077/static/v2/workshop.html`
- API 文档：`http://127.0.0.1:2077/docs`

## 验证

```powershell
pytest -v
```

验证覆盖黄金夹具、项目与画布 CAS、并发竞争、拓扑结构、`.godmap`、任务状态机、401/403/409/202、静态边界和受限资源扫描。

## 来源与排除

- 自有代码分类：`docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`
- 迁移哈希：`docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`
- 行为/契约/夹具输入：`docs/behavior/`、`docs/contracts/`、`docs/fixtures/`
- 无限画布、智能画布旧实现、Chrome/Photoshop 连接器、生成适配器、ComfyUI/RunningHub 工具页、图片/音视频媒体、用户数据和 `PLUGIN-PROTOCOL-SPEC.md` 均不作为当前实现输入。
- 字体例外：仅 `AGENTS.md` §1.2 白名单的 3 个开源思源黑体（Source Han Sans CN，OFL-1.1）允许本地自托管，其余字体不得入库。
- 历史阶段证明已标记为历史材料；最终独立复核尚未完成。
