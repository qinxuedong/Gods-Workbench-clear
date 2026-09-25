# Phase 11 B2 平台、项目与 AI/Provider 回归报告

日期：2026-09-25
状态：**PASS**；独立审核已完成
范围：P11-001、P11-002、P11-099、P11-100、P11-101、P11-102、P11-109～P11-116、P11-128、P11-129，共 16 条。

## 已落盘

- `docs/contracts/PLATFORM-INTERFACE-CATALOG.yaml`
- `src/gods_workbench/api/routes_ai.py`
- `src/gods_workbench/core/platform.py`
- `src/gods_workbench/projects_hub/models.py`
- `src/gods_workbench/projects_hub/service.py`
- `src/gods_workbench/api/routes_projects.py`
- `src/gods_workbench/api/app.py`
- `tests/contracts/test_phase11_b2_platform.py`
- `docs/fixtures/phase11-b2-*.json`
- `tests/contracts/test_phase8_frontend_backend_api_gap.py`
- `tests/contracts/test_phase10e_canvas_closure.py`
- `docs/governance/PHASE-11-API-REGRESSION-REGISTRY.yaml`

## 口径

- 应用信息和项目兼容路径返回本仓可证明真值。
- Codex/Gemini/即梦状态只观察本机 PATH，不启动进程，不把命令存在误报为版本、登录或执行可用。
- 对话、智能体、上传、CLI 帮助、即梦余额/登录等未完成真实准入能力统一 503 失败关闭。
- B2 失败关闭错误使用统一 `detail` 错误包，并显式返回 `endpoint`、`unavailable=true`、`data_status=not_integrated`；不回显消息、命令、文件内容或凭据。
- `/api/projects` 与 `/api/asset-registry/projects` 共享同一 ProjectsService，不建立第二套项目存储；兼容路径夹具使用 `prj-0001` 黄金种子真值，不伪造空列表。

## 当前证据

- `python -P -m pytest -q tests/contracts/test_phase11_b2_platform.py`：10 passed
- `python -P -m pytest -q tests/contracts/test_phase8_frontend_backend_api_gap.py`：6 passed
- `python -P -m pytest -q --no-header -p no:cacheprovider tests/hygiene tests/contracts/test_phase11_b2_platform.py tests/contracts/test_phase8_frontend_backend_api_gap.py tests/contracts/test_phase10e_canvas_closure.py`：73 passed
- 其余全量/卫生门禁须由父任务在共享工作树最终收口时重新执行。

## 边界声明

本报告不代表生产验收、外部 Provider/CLI 准入或公开发布授权；独立审核代理 GPT-6 Slo xhigh：**PASS**；未发现阻断项。

本报告不代表生产验收、外部 Provider/CLI 准入或公开发布授权。
