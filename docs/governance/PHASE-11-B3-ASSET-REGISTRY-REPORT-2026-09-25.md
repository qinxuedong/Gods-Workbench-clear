# Phase 11 B3｜Asset Registry 核心资产域回归报告（2026-09-25）

## 范围

- 计划条目：`P11-032`–`P11-083`，共 **52 条归一化路径**。
- 契约：`docs/contracts/ASSET-REGISTRY-INTERFACE-CATALOG.yaml`。
- 路由：`src/gods_workbench/api/routes_asset_registry.py`。
- 服务：`src/gods_workbench/asset_registry/service.py`。
- 夹具：`docs/fixtures/phase11-b3-empty-registry.json`、`phase11-b3-fail-closed.json`、`phase11-b3-route-matrix.json`。
- 测试：`tests/contracts/test_phase11_b3_asset_registry.py`。

## 已落盘行为

1. 52 条路径、61 个方法组合已登记并挂载到 FastAPI。
2. 根注册表、状态、素材列表、筛选维度、文件夹登记、团队偏好、预设、目录模板、回收站、远程素材和治理概览只返回进程内可证明的空态，不创建演示素材。
3. 读取端点要求认证；编辑端点要求编辑角色；治理端点要求 governor/admin。OIDC 模式沿用服务端身份边界，不信任请求头角色。
4. 本阶段未接入真实文件、媒体、远程资源、索引、审计 outbox 或任务存储。相关操作统一返回 `503 ASSET_REGISTRY_NOT_INTEGRATED`，并携带 `endpoint`、`unavailable`、`data_status`。
5. 未复制旧仓实现，未读取本机路径，未发起外部网络/进程调用，未新增二进制资源。

## 当前本地证据

- `python -P -m pytest -q tests/contracts/test_phase11_b3_asset_registry.py tests/contracts/test_phase8_frontend_backend_api_gap.py`：**13 passed**。
- B3 路由矩阵：52 条路径 / 61 个方法组合。
- `python -P -m pytest -q --no-header -p no:cacheprovider`：**513 passed / 7 skipped**。
- `python -P -m pytest tests/hygiene -q`：**16 passed**。
- `git diff --check`：通过（仅换行格式提示）。
- 独立审核代理 GPT-6 Slo xhigh：**PASS**；B3 无阻断。
- 远端 CI、生产验收和发布授权：未在本报告中宣称。

## 明确边界

B3 当前是“契约、路径、认证授权、统一错误包和显式失败关闭”的最小接入闭环，已通过独立审核；真实素材持久化、媒体服务、远程资产、索引和治理写入必须在后续取得数据源与安全准入后再实现，不得把 503 改为空成功或伪造资源。
