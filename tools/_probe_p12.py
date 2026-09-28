"""Phase 12 安全、可复现的 OpenAPI 探针。

探针只盘点 OpenAPI 全量操作，并实际执行少量本地白名单流程；任何未执行操作、
输入校验响应或本地 CLI stub 都不会被记为业务通过。运行结果写入唯一 JSON 文件。
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import uuid
from collections import Counter
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable, Mapping

API_METHODS = frozenset({"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"})
PATH_PARAM_RE = re.compile(r"\{([^{}]+)\}")
SENSITIVE_KEY_RE = re.compile(r"(?i)(?:password|passwd|secret|token|api[_-]?key|authorization|cookie|credential|qr(?:_code)?)")
BEARER_RE = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/-]+=*")
SECRET_ASSIGNMENT_RE = re.compile(r"(?i)(\b(?:password|passwd|secret|token|api[_-]?key|authorization|cookie|credential)\b\s*[:=]\s*)([^\s,;&]+)")
CONTRACT_PAIR_RE = re.compile(r"^\s+method:\s*(\w+)\s*$\n\s+path:\s*(\S+)\s*$", re.MULTILINE)

# 只测安全且可读回的本地配置门禁；不执行登录、登出或任意业务副作用。
SAFE_CONFIG_PROBES: dict[tuple[str, str], dict[str, Any] | None] = {
    ("POST", "/api/codex/help"): {"command": "--help"},
    ("POST", "/api/gemini-cli/help"): {"command": "--help"},
    ("POST", "/api/jimeng/help"): {"command": "--help"},
    ("GET", "/api/jimeng/credit"): None,
}
LOCAL_STUB_PROBES = {
    ("POST", "/api/codex/help"),
    ("POST", "/api/gemini-cli/help"),
    ("POST", "/api/jimeng/help"),
}
PROJECT_CREATE = ("POST", "/api/asset-registry/projects")
PROJECT_UPDATE = ("PATCH", "/api/asset-registry/projects/{project_id}")
PROJECT_LIST = ("GET", "/api/asset-registry/projects")
ASSET_IMPORT = ("POST", "/api/asset-registry/assets/import")
ASSET_LIST = ("GET", "/api/asset-registry/assets")
VIDEO_RENDER_CREATE = ("POST", "/api/video-tasks")
SIDE_EFFECT_PATHS = {
    ("POST", "/api/asset-auth/logout"),
    ("POST", "/api/auth/logout"),
    ("POST", "/api/jimeng/login/start"),
    ("POST", "/api/jimeng/logout"),
}


def operation_key(method: str, path: str) -> tuple[str, str]:
    """归一化 OpenAPI method/path，避免大小写差异绕过策略。"""
    return method.upper(), path


def render_path(path: str, params: Mapping[str, Any] | None = None) -> str:
    """替换所有路径参数；缺参数时拒绝发送，禁止把模板路径当作请求。"""
    params = params or {}
    names = PATH_PARAM_RE.findall(path)
    missing = [name for name in names if name not in params]
    if missing:
        raise ValueError("路径参数未替换：" + ", ".join(missing))
    rendered = path
    for name in names:
        value = str(params[name])
        if not value or "/" in value or "{" in value or "}" in value:
            raise ValueError(f"路径参数 {name} 无效")
        rendered = rendered.replace("{" + name + "}", value)
    if PATH_PARAM_RE.search(rendered):
        raise ValueError("请求路径仍包含未替换参数")
    return rendered


def redact_payload(value: Any) -> Any:
    """递归脱敏响应/请求体中的凭据字段与常见文本凭据形式。"""
    if isinstance(value, dict):
        return {
            key: ("[已脱敏]" if SENSITIVE_KEY_RE.search(str(key)) and not (key in {"output_tokens", "tokens_per_second"} and (item is None or type(item) in {int, float})) else redact_payload(item))
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact_payload(item) for item in value]
    if isinstance(value, tuple):
        return [redact_payload(item) for item in value]
    if isinstance(value, str):
        scrubbed = BEARER_RE.sub("Bearer [已脱敏]", value)
        return SECRET_ASSIGNMENT_RE.sub(r"\1[已脱敏]", scrubbed)
    return value


def business_pass(record: Mapping[str, Any]) -> bool:
    """只有本地真实应用成功且持久化读回通过，才算一个业务流通过。"""
    status = record.get("http_status")
    return (
        isinstance(status, int)
        and 200 <= status < 300
        and record.get("readback_verified") is True
        and record.get("persistence_verified") is True
        and record.get("execution_context") == "isolated_local_application"
        and record.get("validation_only") is not True
    )


def classify_unavailable(
    code: str | None,
    *,
    config_enabled: bool,
    dependency_available: bool | None,
    local_stub: bool = False,
) -> str:
    """只把已知 CLI fail-closed 错误归为配置/依赖问题；其他缺口保持代码缺失。"""
    if local_stub:
        return "LOCAL_STUB_ONLY_NOT_UPSTREAM"
    if not code or "NOT_INTEGRATED" not in code:
        return "NOT_AN_UNAVAILABLE_OBSERVATION"
    if code == "VIDEO_RENDERER_NOT_INTEGRATED":
        return "CODE_MISSING"
    config_gated_codes = {
        "CLI_HELP_NOT_INTEGRATED",
        "JIMENG_CREDIT_NOT_INTEGRATED",
        "JIMENG_LOGIN_NOT_INTEGRATED",
        "JIMENG_LOGOUT_NOT_INTEGRATED",
    }
    if code not in config_gated_codes:
        return "CODE_MISSING"
    if not config_enabled:
        return "CONFIGURATION_MISSING"
    if dependency_available is False:
        return "DEPENDENCY_MISSING"
    return "CONFIGURATION_ENABLED_DEPENDENCY_UNASSESSED"


def _api_operations(openapi: Mapping[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for path, path_item in openapi.get("paths", {}).items():
        if not path.startswith("/api/"):
            continue
        for method, operation in path_item.items():
            method_upper = method.upper()
            if method_upper not in API_METHODS or not isinstance(operation, dict):
                continue
            request_body = operation.get("requestBody") or {}
            required_params = [p.get("name") for p in operation.get("parameters", [])
                               if p.get("in") == "path" and p.get("required")]
            rows.append({
                "method": method_upper,
                "path": path,
                "summary": operation.get("summary", ""),
                "path_parameters": PATH_PARAM_RE.findall(path),
                "required_path_parameters": required_params,
                "request_body_required": bool(request_body.get("required", False)),
                "attempts": [],
                "disposition": "NOT_ASSESSED",
                "scope_decision": "IN_SCOPE_OR_UNRESOLVED",
                "business_pass": False,
            })
    return rows


def _contract_operations(repository_root: Path) -> tuple[set[tuple[str, str]], dict[tuple[str, str], str]]:
    """从冻结画布契约提取范围排除，不靠响应结果扩大排除范围。"""
    operations: set[tuple[str, str]] = set()
    sources: dict[tuple[str, str], str] = {}
    for filename in ("CANVAS-INTERFACE-CATALOG.yaml", "CANVAS-CLOSURE-INTERFACE-CATALOG.yaml"):
        path = repository_root / "docs" / "contracts" / filename
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for method, route in CONTRACT_PAIR_RE.findall(text):
            key = operation_key(method, route)
            # 视频任务渲染范围待裁定；任何视频任务操作均不得被泛化排除。
            if route.startswith("/api/video-tasks"):
                continue
            operations.add(key)
            sources[key] = f"docs/contracts/{filename}"
    return operations, sources


def _response_body(response: Any) -> Any:
    try:
        return response.json()
    except Exception:
        text = getattr(response, "text", "")
        return text[:4000] if isinstance(text, str) else None


def _response_code(body: Any) -> str | None:
    if not isinstance(body, dict):
        return None
    detail = body.get("detail")
    return detail.get("code") if isinstance(detail, dict) else None


def _new_observation(
    *, method: str, path: str, request_body: Any, query: Mapping[str, Any] | None,
    response: Any, execution_context: str, classification: str,
    readback_verified: bool = False, persistence_verified: bool = False,
    validation_only: bool = False, note: str = "",
) -> dict[str, Any]:
    body = _response_body(response)
    return {
        "method": method,
        "request_path": path,
        "request_path_has_unresolved_parameters": bool(PATH_PARAM_RE.search(path)),
        "request_query": dict(query or {}),
        "request_body": redact_payload(request_body),
        "http_status": int(response.status_code),
        "response_code": _response_code(body),
        "response_body": redact_payload(body),
        "response_redacted": True,
        "execution_context": execution_context,
        "classification": classification,
        "readback_verified": readback_verified,
        "persistence_verified": persistence_verified,
        "validation_only": validation_only,
        "business_pass": False,
        "note": note,
    }


def _attach_attempt(
    inventory: dict[tuple[str, str], dict[str, Any]],
    key: tuple[str, str], observation: dict[str, Any],
) -> None:
    if key not in inventory:
        raise KeyError(f"OpenAPI 中不存在操作：{key[0]} {key[1]}")
    if observation["request_path_has_unresolved_parameters"]:
        raise ValueError(f"拒绝记录未替换路径参数的请求：{key}")
    observation["business_pass"] = business_pass(observation)
    row = inventory[key]
    row["attempts"].append(observation)
    if observation["business_pass"]:
        row["disposition"] = "PERSISTED_READBACK_VERIFIED"
        row["scope_decision"] = "IN_SCOPE"
    elif observation["classification"] == "CONTROLLED_PROTOCOL_RESPONSE":
        row["disposition"] = "CONTROLLED_HTTP_PROTOCOL_OBSERVED"
    elif observation["classification"] == "CONFIGURATION_MISSING":
        row["disposition"] = "CONFIGURATION_MISSING"
    elif observation["classification"] == "DEPENDENCY_MISSING":
        row["disposition"] = "DEPENDENCY_MISSING"
    elif observation["classification"] == "CODE_NOT_INTEGRATED_OR_UNCLASSIFIED":
        row["disposition"] = "CODE_MISSING"


def _mark_static_dispositions(
    inventory: dict[tuple[str, str], dict[str, Any]], repository_root: Path,
) -> None:
    excluded, evidence = _contract_operations(repository_root)
    for key, row in inventory.items():
        if key[1].startswith(("/api/video-tasks", "/api/video-exports",
                              "/api/video-project-access", "/api/video-projects")):
            row.update({
                "disposition": "NOT_EXECUTED_SAFETY" if key[0] == "POST" else "NOT_ASSESSED",
                "scope_decision": "IN_SCOPE_USER_AUTHORIZED_IMPLEMENTED_PENDING_AUDIT",
                "evidence_source": "docs/contracts/VIDEO-TASKS-INTERFACE-CATALOG.yaml",
                "evidence_note": (
                    "视频路由已注册；探针不触发生成、取消、授权或 FFmpeg 作业等状态变更，也不调用可能计费的真实 Provider。路由注册不替代专门契约测试与 Provider 验收。"
                    if key[0] == "POST" else
                    "视频读取端点已注册；本探针未执行主体/项目/产物读取回归，需以专门契约测试验收。"
                ),
            })
        elif key in SIDE_EFFECT_PATHS or ("logout" in key[1].lower()):
            row.update({
                "disposition": "NOT_EXECUTED_SAFETY",
                "scope_decision": "NOT_ASSESSED",
                "evidence_note": "探针安全策略：不触发任何登录/登出端点或真实 CLI 副作用。",
            })
        elif key in excluded:
            row.update({
                "disposition": "EXPLICIT_EXCLUSION",
                "scope_decision": "OUT_OF_PHASE12_CANVAS_SCOPE",
                "evidence_source": evidence[key],
                "evidence_note": "冻结画布契约范围排除；此标签不代表已接入或通过。",
            })


def _attempt_request(
    client: Any, inventory: dict[tuple[str, str], dict[str, Any]],
    headers: Mapping[str, str], method: str, path: str, *,
    path_params: Mapping[str, Any] | None = None,
    query: Mapping[str, Any] | None = None,
    json_body: Any = None,
    execution_context: str = "isolated_local_application",
    classification: str = "OBSERVED_RESPONSE_NOT_BUSINESS_VERIFIED",
    readback_verified: bool = False, persistence_verified: bool = False,
    validation_only: bool = False, note: str = "",
) -> dict[str, Any]:
    rendered_path = render_path(path, path_params)
    response = client.request(method, rendered_path, headers=dict(headers),
                              params=dict(query or {}), json=json_body)
    body = _response_body(response)
    code = _response_code(body)
    if code and "NOT_INTEGRATED" in code:
        classification = "CODE_NOT_INTEGRATED_OR_UNCLASSIFIED"
    observation = _new_observation(
        method=method, path=rendered_path, request_body=json_body, query=query,
        response=response, execution_context=execution_context,
        classification=classification, readback_verified=readback_verified,
        persistence_verified=persistence_verified,
        validation_only=validation_only, note=note,
    )
    _attach_attempt(inventory, operation_key(method, path), observation)
    return observation


def _set_flow_readback(
    inventory: dict[tuple[str, str], dict[str, Any]], keys: Iterable[tuple[str, str]],
    *, flow_name: str, verified: bool, persistence_verified: bool,
    verification_note: str,
) -> None:
    for key in keys:
        row = inventory[key]
        for attempt in row["attempts"]:
            if attempt["execution_context"] == "isolated_local_application":
                attempt["flow"] = flow_name
                attempt["readback_verified"] = verified
                attempt["persistence_verified"] = persistence_verified
                attempt["note"] = verification_note
                attempt["business_pass"] = business_pass(attempt)
        if verified:
            row["disposition"] = ("PERSISTED_READBACK_VERIFIED" if persistence_verified
                                  else "ROUTE_READBACK_ONLY")
            row["scope_decision"] = "IN_SCOPE"


def _run_persistence_flows(client: Any, inventory: dict[tuple[str, str], dict[str, Any]],
                           headers: Mapping[str, str], run_id: str) -> dict[str, Any]:
    flows: dict[str, Any] = {}

    # 项目创建→CAS 更新→列表读回，所有实体都位于本次隔离数据目录。
    project_name = f"Phase12 本地探针 {run_id[:8]}"
    created = _attempt_request(
        client, inventory, headers, "POST", PROJECT_CREATE[1],
        json_body={"name": project_name, "project_type": "film", "description": "隔离探针实体"},
        note="使用符合冻结项目契约的请求体创建唯一测试项目。",
    )
    create_body = created["response_body"]
    project = create_body.get("project") if isinstance(create_body, dict) else None
    project_id = project.get("project_id") if isinstance(project, dict) else None
    create_version = project.get("version") if isinstance(project, dict) else None
    project_keys: list[tuple[str, str]] = [PROJECT_CREATE]
    update: dict[str, Any] | None = None
    listed: dict[str, Any] | None = None
    project_readback = False
    if created["http_status"] == 201 and isinstance(project_id, str) and project_id and isinstance(create_version, int):
        update = _attempt_request(
            client, inventory, headers, "PATCH", PROJECT_UPDATE[1],
            path_params={"project_id": project_id},
            json_body={"name": project_name + " 已更新", "progress": 25, "expected_version": create_version},
            note="使用创建响应返回的稳定 project_id 与 expected_version 执行 CAS 更新。",
        )
        project_keys.append(PROJECT_UPDATE)
        update_body = update["response_body"]
        updated = update_body.get("project") if isinstance(update_body, dict) else None
        update_version = updated.get("version") if isinstance(updated, dict) else None
        if update["http_status"] == 200 and isinstance(update_version, int):
            listed = _attempt_request(
                client, inventory, headers, "GET", PROJECT_LIST[1],
                note="列表读回核验项目 ID、更新字段和版本。",
            )
            project_keys.append(PROJECT_LIST)
            entries = (listed["response_body"].get("projects", [])
                       if isinstance(listed["response_body"], dict) else [])
            project_readback = any(
                isinstance(item, dict) and item.get("project_id") == project_id
                and item.get("name") == project_name + " 已更新"
                and item.get("progress") == 25
                and item.get("version") == update_version
                for item in entries
            )
    project_note = "创建、CAS 更新及列表读回均确认同一 project_id、字段和版本。" if project_readback else "项目完整持久化流未通过；响应不作业务接入通过。"
    _set_flow_readback(inventory, project_keys, flow_name="project_create_update_route_readback",
                       verified=project_readback, persistence_verified=False,
                       verification_note=project_note)
    flows["project_create_update_route_readback"] = {
        "acceptance_level": "route_readback_only_not_durable_persistence",
        "route_readback_verified": project_readback,
        "persistence_verified": False,
        "project_id": project_id,
        "steps": ["create", "CAS update", "list readback"],
        "note": project_note,
    }

    # 素材登记创建→列表读回，确认同一 asset_id 确实留在隔离存储中。
    asset_name = f"phase12-probe-{run_id[:8]}.png"
    imported = _attempt_request(
        client, inventory, headers, "POST", ASSET_IMPORT[1],
        json_body={"items": [{"name": asset_name, "kind": "image"}]},
        note="用契约允许的图片素材字段创建测试素材，不触碰用户文件路径。",
    )
    imported_body = imported["response_body"]
    asset_ids = imported_body.get("asset_ids", []) if isinstance(imported_body, dict) else []
    asset_id = asset_ids[0] if isinstance(asset_ids, list) and asset_ids else None
    asset_readback = False
    asset_keys = [ASSET_IMPORT]
    asset_list_obs: dict[str, Any] | None = None
    if imported["http_status"] == 200 and isinstance(asset_id, str) and asset_id:
        # 新建 FastAPI 应用实例后读回，避免只读到调用前对象中的临时响应。
        from fastapi.testclient import TestClient
        from gods_workbench.api.app import create_app
        with TestClient(create_app(), base_url="http://127.0.0.1:2077") as readback_client:
            asset_list_obs = _attempt_request(
                readback_client, inventory, headers, "GET", ASSET_LIST[1],
                query={"limit": 50},
                note="新 FastAPI 应用实例分页读回，核验 asset_id 与文件名。",
            )
        asset_keys.append(ASSET_LIST)
        asset_body = asset_list_obs["response_body"]
        items = asset_body.get("items", []) if isinstance(asset_body, dict) else []
        route_readback = any(
            isinstance(item, dict) and item.get("asset_id") == asset_id and item.get("name") == asset_name
            for item in items
        )
        state_path = Path(os.environ["GW_DATA_DIR"]) / "asset_registry.json"
        try:
            saved_state = json.loads(state_path.read_text(encoding="utf-8"))
            saved_asset = saved_state.get("assets", {}).get(asset_id)
            disk_readback = isinstance(saved_asset, dict) and saved_asset.get("name") == asset_name
        except (OSError, json.JSONDecodeError):
            disk_readback = False
        asset_readback = route_readback and disk_readback
    asset_note = ("新 FastAPI 应用实例与隔离 JSON 文件均读回同一 asset_id/名称。"
                  if asset_readback else "素材创建与持久化读回未完整验证；不作业务接入通过。")
    _set_flow_readback(inventory, asset_keys, flow_name="asset_import_list_readback",
                       verified=asset_readback, persistence_verified=asset_readback,
                       verification_note=asset_note)
    flows["asset_import_list_readback"] = {
        "acceptance_level": "isolated_local_json_persistence",
        "verified": asset_readback,
        "persistence_verified": asset_readback,
        "asset_id": asset_id,
        "steps": ["import", "new app instance list readback", "isolated JSON file readback"],
        "note": asset_note,
    }
    return flows


def _run_config_probes(client: Any, inventory: dict[tuple[str, str], dict[str, Any]],
                       headers: Mapping[str, str]) -> None:
    # 明确把真实 CLI 执行开关压到关闭；只观测 fail-closed 配置缺失响应。
    os.environ["GW_CLI_EXECUTION"] = "0"
    for (method, path), body in SAFE_CONFIG_PROBES.items():
        if operation_key(method, path) not in inventory:
            continue
        rendered = render_path(path)
        response = client.request(method, rendered, headers=dict(headers), json=body)
        response_body = _response_body(response)
        code = _response_code(response_body)
        classification = classify_unavailable(code, config_enabled=False, dependency_available=None)
        observation = _new_observation(
            method=method, path=rendered, request_body=body, query={}, response=response,
            execution_context="isolated_local_application",
            classification=classification,
            note="GW_CLI_EXECUTION=0；只验证配置门禁，不执行外部 CLI。",
        )
        _attach_attempt(inventory, operation_key(method, path), observation)


def _run_local_cli_stubs(client: Any, inventory: dict[tuple[str, str], dict[str, Any]],
                         headers: Mapping[str, str], monitor: dict[str, int]) -> None:
    """以进程内 stub 验证 CLI 帮助路由；绝不启动进程或连接上游。"""
    if not LOCAL_STUB_PROBES:
        return
    from unittest.mock import patch
    import subprocess
    from gods_workbench.core import cli_runtime

    prior = os.environ.get("GW_CLI_EXECUTION")
    prior_find_cli = cli_runtime.find_cli
    prior_subprocess_run = cli_runtime.subprocess.run
    os.environ["GW_CLI_EXECUTION"] = "1"

    def local_find_cli(protocol: str) -> str:
        return f"local-stub://{protocol}"

    def local_run(command: list[str], **kwargs: Any) -> Any:
        # 本函数替代 subprocess.run，不创建子进程、不发网络请求。
        monitor["local_cli_stub_calls"] += 1
        protocol = str(command[0]).split("://", 1)[-1] if command else "unknown"
        rendered_args = " ".join(str(arg) for arg in command[1:])
        return subprocess.CompletedProcess(
            args=command, returncode=0,
            stdout=f"LOCAL STUB ONLY / NOT UPSTREAM: {protocol} {rendered_args}", stderr="",
        )

    try:
        with patch.object(cli_runtime, "find_cli", local_find_cli), \
             patch.object(cli_runtime.subprocess, "run", local_run):
            for method, path in sorted(LOCAL_STUB_PROBES):
                if operation_key(method, path) not in inventory:
                    continue
                body = {"command": "--help"}
                response = client.request(method, render_path(path), headers=dict(headers), json=body)
                observation = _new_observation(
                    method=method, path=path, request_body=body, query={}, response=response,
                    execution_context="controlled_local_cli_stub",
                    classification=classify_unavailable(
                        _response_code(_response_body(response)), config_enabled=True,
                        dependency_available=True, local_stub=True,
                    ),
                    note="进程内伪造 subprocess 结果；不是本机 CLI、Provider 或上游连通证据。",
                )
                _attach_attempt(inventory, operation_key(method, path), observation)
    finally:
        if prior is None:
            os.environ.pop("GW_CLI_EXECUTION", None)
        else:
            os.environ["GW_CLI_EXECUTION"] = prior
        monitor["local_stub_environment_restored"] = os.environ.get("GW_CLI_EXECUTION") == prior
        monitor["local_stub_patches_restored"] = (
            cli_runtime.find_cli is prior_find_cli
            and cli_runtime.subprocess.run is prior_subprocess_run
        )


def _summarize(inventory: Mapping[tuple[str, str], Mapping[str, Any]]) -> dict[str, Any]:
    dispositions = Counter(row["disposition"] for row in inventory.values())
    attempts = [attempt for row in inventory.values() for attempt in row["attempts"]]
    observation_classes = Counter(attempt["classification"] for attempt in attempts)
    verified_flows = {attempt.get("flow") for attempt in attempts
                      if attempt.get("business_pass") and attempt.get("flow")}
    return {
        "openapi_operation_count": len(inventory),
        "operation_count_with_attempts": sum(bool(row["attempts"]) for row in inventory.values()),
        "attempt_count": len(attempts),
        "business_verified_operation_count": sum(
            any(attempt.get("business_pass") for attempt in row["attempts"])
            for row in inventory.values()
        ),
        "business_verified_flow_count": len(verified_flows),
        "route_readback_only_operation_count": sum(row["disposition"] == "ROUTE_READBACK_ONLY" for row in inventory.values()),
        "validation_only_attempt_count": sum(bool(a.get("validation_only")) for a in attempts),
        "observation_classification_counts": dict(sorted(observation_classes.items())),
        "disposition_counts": dict(sorted(dispositions.items())),
        "unexecuted_operation_count": sum(not row["attempts"] for row in inventory.values()),
        "historical_design_baseline_count": 239,
        "historical_baseline_note": "历史设计/计划基数仅供对照；当前 OpenAPI 操作必须以本轮动态盘点为准。",
    }


def _run_throughput_flow(client, inventory, headers):
    """用本地真实 HTTP 上游验证计量链；不把受控协议服务说成商业 Provider。"""
    import math
    import threading
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from unittest.mock import patch

    requests = []
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
            requests.append({"path": self.path, "model": body.get("model")})
            response = {"choices": [{"message": {"content": "本地受控响应"}}]}
            if len(requests) == 1:
                response["usage"] = {"completion_tokens": 12}
            encoded = json.dumps(response).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

    server = HTTPServer(("127.0.0.1", 0), Handler)
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    observations = []
    try:
        configuration = {"probe-local": {
            "base_url": f"http://127.0.0.1:{server.server_port}/v1",
            "api_key_env": "GW_P12_PROBE_CHAT_KEY", "model": "probe-model",
        }}
        with patch.dict(os.environ, {"GW_PROVIDER_RUNTIME_JSON": json.dumps(configuration),
                                    "GW_P12_PROBE_CHAT_KEY": "local-probe-not-a-real-secret"}):
            for path in ("/api/chat", "/api/chat/agent"):
                payload = {"message": "本地协议验证", "provider_id": "probe-local", "model": "probe-model"}
                response = client.post(path, json=payload, headers=headers)
                observation = _new_observation(
                    method="POST", path=path, request_body=payload, query=None, response=response,
                    execution_context="controlled_loopback_http_provider",
                    classification="CONTROLLED_PROTOCOL_RESPONSE", note="只验证本地真实 HTTP 协议和公式；非商业上游验收。")
                _attach_attempt(inventory, ("POST", path), observation)
                observations.append(_response_body(response))
                if response.status_code != 200:
                    raise RuntimeError("本地吞吐协议验证未返回成功")
        first = observations[0].get("metrics", {})
        second = observations[1].get("metrics", {})
        elapsed = first.get("elapsed_seconds")
        rate = first.get("tokens_per_second")
        verified = (first.get("output_tokens") == 12 and isinstance(elapsed, (int, float))
                    and elapsed > 0 and isinstance(rate, (int, float))
                    and math.isclose(rate, 12 / elapsed, rel_tol=0.001)
                    and first.get("provider_id") == "probe-local"
                    and first.get("model") == "probe-model"
                    and second.get("tokens_per_second") is None
                    and second.get("unavailable_reason") == "usage_missing"
                    and requests == [{"path": "/v1/chat/completions", "model": "probe-model"}] * 2)
        if not verified:
            raise RuntimeError("本地吞吐公式、服务商归属或缺失 usage 语义不符")
        return {"acceptance_level": "controlled_loopback_http_protocol", "verified": True,
                "commercial_provider_verified": False, "request_count": len(requests),
                "formula_verified": True, "missing_usage_verified": True,
                "metrics": first, "missing_usage_metrics": second}
    finally:
        server.shutdown()
        worker.join(timeout=5)
        server.server_close()


def _audit_required_capabilities(openapi: Mapping[str, Any], throughput_evidence=None) -> list[dict[str, Any]]:
    """盘点已纳入、但尚无 OpenAPI/运行时实现的三项新增能力。"""
    operations = openapi.get("paths", {})
    team_message_matches = []
    for path, path_item in operations.items():
        if path == "/api/chat":
            continue  # AI 对话不是团队消息契约。
        for method, operation in path_item.items():
            if method.upper() not in API_METHODS:
                continue
            label = f"{path} {operation.get('summary', '')}"
            if re.search(r"team|teams|团队|成员", label, re.IGNORECASE) and re.search(
                r"message|messages|消息|发送", label, re.IGNORECASE
            ):
                team_message_matches.append({"method": method.upper(), "path": path})

    schema_fields: set[str] = set()
    def collect_fields(value: Any) -> None:
        if isinstance(value, dict):
            schema_fields.update(str(key).lower() for key in value.get("properties", {}).keys())
            for child in value.values():
                collect_fields(child)
        elif isinstance(value, list):
            for child in value:
                collect_fields(child)
    collect_fields(openapi.get("components", {}).get("schemas", {}))
    throughput_names = {"throughput", "tokens_per_second", "tokens_per_sec", "tokens_per_s", "tps"}
    matched_throughput = sorted(schema_fields & throughput_names)
    video_operations = [
        {"method": method.upper(), "path": path}
        for path, path_item in operations.items()
        if path.startswith(("/api/video-tasks", "/api/video-exports",
                            "/api/video-project-access", "/api/video-projects"))
        for method in path_item if method.upper() in API_METHODS
    ]
    video_implemented = bool(video_operations)

    return [
        {
            "capability": "video_render_export",
            "scope_decision": (
                "IN_SCOPE_USER_AUTHORIZED_IMPLEMENTED_PENDING_AUDIT"
                if video_implemented else "IN_SCOPE_USER_AUTHORIZED_UNIMPLEMENTED"
            ),
            "disposition": (
                "IMPLEMENTATION_REQUIRES_SEPARATE_CONTRACT_AUDIT"
                if video_implemented else "CODE_MISSING"
            ),
            "evidence": (
                "已发现视频任务、导出及受保护产物 OpenAPI 操作；探针不触发状态变更或真实 Provider。"
                "路由存在不代表授权、持久化、FFmpeg 或生产 Provider 验收完成。"
                if video_implemented else
                "OpenAPI 未发现视频任务/导出操作；视频能力仍为代码缺口。"
            ),
            "related_openapi_operations": video_operations,
        },
        {
            "capability": "team_messaging_send_and_history",
            "scope_decision": (
                "IN_SCOPE_USER_AUTHORIZED_IMPLEMENTED_PENDING_AUDIT"
                if team_message_matches else "IN_SCOPE_USER_AUTHORIZED_UNIMPLEMENTED"
            ),
            "disposition": "CODE_MISSING" if not team_message_matches else "IMPLEMENTATION_REQUIRES_SEPARATE_CONTRACT_AUDIT",
            "evidence": (
                "已发现团队消息 OpenAPI 操作；接口存在不等于行为、授权与持久化验收，仍需单独契约审计。"
                if team_message_matches else
                "当前 OpenAPI 未发现团队消息发送/历史操作；团队与成员管理、AI /api/chat 均不等于团队消息。"
            ),
            "matching_openapi_operations": team_message_matches,
        },
        {
            "capability": "provider_tokens_per_second_metric",
            "scope_decision": "IN_SCOPE_USER_AUTHORIZED_IMPLEMENTED_PENDING_AUDIT" if throughput_evidence else "IN_SCOPE_USER_AUTHORIZED_UNVERIFIED",
            "disposition": "CONTROLLED_HTTP_PROTOCOL_VERIFIED" if throughput_evidence else "NOT_ASSESSED",
            "evidence": "以真实本地 HTTP 响应验证公式、归属和缺失usage；字典响应未声明schema字段不等于代码缺失。商业上游未验证。",
            "runtime_evidence": throughput_evidence,
            "matching_schema_fields": matched_throughput,
        },
    ]


@contextmanager
def _side_effect_guard(monitor: dict[str, Any]):
    """阻断所有非 loopback socket 与真实子进程；允许 asyncio 本地 socketpair。"""
    from unittest.mock import patch

    def blocked_network(*args: Any, **kwargs: Any) -> Any:
        monitor["network_attempts_blocked"] += 1
        raise RuntimeError("Phase 12 探针禁止外部网络连接")

    def is_local_address(address: Any) -> bool:
        host = address[0] if isinstance(address, tuple) and address else address
        if isinstance(host, bytes):
            host = host.decode("ascii", errors="ignore")
        if not isinstance(host, str):
            return False
        if host.lower() == "localhost":
            return True
        try:
            return ipaddress.ip_address(host).is_loopback
        except ValueError:
            # 主机名不做 DNS 解析，避免探针借解析触发外网。
            return False

    def guarded_connect(sock: Any, address: Any, *args: Any, **kwargs: Any) -> Any:
        if is_local_address(address):
            return originals["socket_connect"](sock, address, *args, **kwargs)
        return blocked_network(sock, address, *args, **kwargs)

    def guarded_connect_ex(sock: Any, address: Any, *args: Any, **kwargs: Any) -> Any:
        if is_local_address(address):
            return originals["socket_connect_ex"](sock, address, *args, **kwargs)
        return blocked_network(sock, address, *args, **kwargs)

    def guarded_create_connection(address: Any, *args: Any, **kwargs: Any) -> Any:
        if is_local_address(address):
            return originals["socket_create_connection"](address, *args, **kwargs)
        return blocked_network(address, *args, **kwargs)

    def block_process(*args: Any, **kwargs: Any) -> Any:
        monitor["real_process_attempts_blocked"] += 1
        raise RuntimeError("Phase 12 探针禁止启动真实子进程")

    originals = {
        "socket_connect": socket.socket.connect,
        "socket_connect_ex": socket.socket.connect_ex,
        "socket_create_connection": socket.create_connection,
        "subprocess_run": subprocess.run,
        "subprocess_popen": subprocess.Popen,
        "os_system": os.system,
        "os_popen": os.popen,
    }
    try:
        with patch.object(socket.socket, "connect", guarded_connect), \
             patch.object(socket.socket, "connect_ex", guarded_connect_ex), \
             patch.object(socket, "create_connection", guarded_create_connection), \
             patch.object(subprocess, "run", block_process), \
             patch.object(subprocess, "Popen", block_process), \
             patch.object(os, "system", block_process), \
             patch.object(os, "popen", block_process):
            monitor["network_guard_installed"] = (
                socket.socket.connect is guarded_connect
                and socket.socket.connect_ex is guarded_connect_ex
                and socket.create_connection is guarded_create_connection
            )
            monitor["process_guard_installed"] = (
                subprocess.run is block_process and subprocess.Popen is block_process
                and os.system is block_process and os.popen is block_process
            )
            yield
    finally:
        monitor["side_effect_guards_restored"] = all((
            socket.socket.connect is originals["socket_connect"],
            socket.socket.connect_ex is originals["socket_connect_ex"],
            socket.create_connection is originals["socket_create_connection"],
            subprocess.run is originals["subprocess_run"],
            subprocess.Popen is originals["subprocess_popen"],
            os.system is originals["os_system"],
            os.popen is originals["os_popen"],
        ))


@contextmanager
def _isolated_environment(data_root: Path, monitor: dict[str, Any] | None = None):
    names = ("GW_DATA_DIR", "GW_LOCAL_AUTH_DB", "GW_AUTH_MODE", "GW_ALLOWED_ROOTS",
             "GW_CLI_EXECUTION", "LOCALAPPDATA")
    previous = {name: os.environ.get(name) for name in names}
    os.environ.update({
        "GW_DATA_DIR": str(data_root / "data"),
        "GW_LOCAL_AUTH_DB": str(data_root / "auth" / "auth.sqlite3"),
        "GW_AUTH_MODE": "local_account",
        "GW_ALLOWED_ROOTS": str(data_root),
        "GW_CLI_EXECUTION": "0",
        "LOCALAPPDATA": str(data_root / "localappdata"),
    })
    try:
        yield
    finally:
        for name, value in previous.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value
        if monitor is not None:
            monitor["environment_restored"] = all(
                os.environ.get(name) == value for name, value in previous.items()
            )


def run_probe(output_dir: Path) -> Path:
    repository_root = Path(__file__).resolve().parents[1]
    run_id = uuid.uuid4().hex
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / f"phase12-probe-{run_id}.json"
    if report_path.exists():
        raise FileExistsError(report_path)

    safety_monitor: dict[str, Any] = {"real_process_attempts_blocked": 0,
                                      "real_cli_processes_started": 0,
                                      "network_attempts_blocked": 0,
                                      "local_cli_stub_calls": 0}
    with tempfile.TemporaryDirectory(prefix=f"gw-p12-{run_id[:8]}-") as isolated_dir:
        data_root = Path(isolated_dir)
        with _isolated_environment(data_root, safety_monitor):
            source_dir = repository_root / "src"
            if str(source_dir) not in sys.path:
                sys.path.insert(0, str(source_dir))
            from fastapi.testclient import TestClient
            from gods_workbench.api.app import create_app
            from gods_workbench.core import local_accounts
            from gods_workbench.core.session import SESSION_COOKIE_NAME

            principal, token = local_accounts.create_first_admin(
                "probe" + run_id[:8], "Phase12Probe2026",
            )
            app = create_app()
            base_url = "http://127.0.0.1:2077"
            headers = {
                "Origin": base_url,
                "X-User-Role": principal.get("role", "admin"),
                "Cookie": f"{SESSION_COOKIE_NAME}={token}",
            }
            spec = app.openapi()
            rows = _api_operations(spec)
            inventory = {(row["method"], row["path"]): row for row in rows}
            if len(inventory) != len(rows):
                raise RuntimeError("OpenAPI 中发现重复 method/path，无法无歧义盘点")
            _mark_static_dispositions(inventory, repository_root)
            with _side_effect_guard(safety_monitor):
                with TestClient(app, base_url=base_url) as client:
                    _run_config_probes(client, inventory, headers)
                    _run_local_cli_stubs(client, inventory, headers, safety_monitor)
                    flows = _run_persistence_flows(client, inventory, headers, run_id)
                    throughput_evidence = _run_throughput_flow(client, inventory, headers)
            if not safety_monitor.get("network_guard_installed"):
                raise RuntimeError("外网安全守卫未成功安装，拒绝生成可通过报告")
            if not safety_monitor.get("process_guard_installed"):
                raise RuntimeError("真实进程安全守卫未成功安装，拒绝生成可通过报告")
            if safety_monitor["network_attempts_blocked"] or safety_monitor["real_process_attempts_blocked"]:
                raise RuntimeError("检测到被阻断的网络/进程尝试，拒绝把探针记录成干净通过")

    report = {
        "schema_version": "phase12-probe-v2",
        "run_id": run_id,
        "created_at_utc": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "repository_head": None,
        "safety": {
            "data_directory_isolated": not data_root.resolve().is_relative_to(repository_root.resolve()),
            "real_process_attempts_blocked": safety_monitor["real_process_attempts_blocked"],
            "real_cli_processes_started": safety_monitor["real_cli_processes_started"],
            "process_guard_active": safety_monitor.get("process_guard_installed", False),
            "local_cli_stub_calls": safety_monitor["local_cli_stub_calls"],
            "network_guard_active": safety_monitor.get("network_guard_installed", False),
            "network_attempts_blocked": safety_monitor["network_attempts_blocked"],
            "external_network_calls_made": not safety_monitor.get("network_guard_installed", False),
            "paid_provider_calls_made": not safety_monitor.get("network_guard_installed", False),
            "only_loopback_network_allowed": True,
            "login_logout_operations_executed": any(
                bool(row["attempts"]) for key, row in inventory.items()
                if key in SIDE_EFFECT_PATHS or "logout" in key[1].lower()
            ),
            "local_cli_stub_used": safety_monitor["local_cli_stub_calls"] > 0,
            "local_cli_stub_is_upstream_evidence": False,
            "business_pass_requires_persistent_readback": True,
            "temporary_json_output_unique": report_path.stem == f"phase12-probe-{run_id}",
            "response_bodies_redacted": all(
                attempt["response_redacted"] for row in rows for attempt in row["attempts"]
            ),
            "environment_restored_after_probe": safety_monitor.get("environment_restored", False)
                and safety_monitor.get("local_stub_environment_restored", False),
            "monkeypatches_restored_after_probe": safety_monitor.get("side_effect_guards_restored", False)
                and safety_monitor.get("local_stub_patches_restored", False),
        },
        "summary": _summarize(inventory),
        "persistence_flows": flows,
        "additional_required_capabilities": _audit_required_capabilities(spec, throughput_evidence),
        "operations": sorted(rows, key=lambda row: (row["path"], row["method"])),
    }
    try:
        import subprocess
        result = subprocess.run(["git", "rev-parse", "HEAD"], cwd=repository_root,
                                check=False, capture_output=True, text=True)
        if result.returncode == 0:
            report["repository_head"] = result.stdout.strip()
    except OSError:
        pass

    with report_path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")

    summary = report["summary"]
    print(
        "Phase 12 探针：OpenAPI 操作 {openapi_operation_count}；实际触达 {operation_count_with_attempts}；"
        "持久化读回通过操作 {business_verified_operation_count}；未执行 {unexecuted_operation_count}。".format(**summary)
    )
    print("分类：" + json.dumps(summary["disposition_counts"], ensure_ascii=False, sort_keys=True))
    print("配置门禁仅覆盖本地 fail-closed；CLI stub 明确不是上游连通；三项新增能力的实现与验证等级请分别查看 additional_required_capabilities；本地协议验证不代表商业上游验收。")
    print(f"完整唯一 JSON：{report_path}")
    return report_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="安全运行 Phase 12 API 探针")
    parser.add_argument("--output-dir", type=Path, default=Path(tempfile.gettempdir()),
                        help="JSON 报告目录；文件名始终追加随机 run_id")
    args = parser.parse_args(argv)
    report_path = run_probe(args.output_dir)
    # 只要配置好的代表性持久化流程未读回，命令就失败，不用零退出码掩盖。
    report = json.loads(report_path.read_text(encoding="utf-8"))
    persistent_flows = [flow for flow in report["persistence_flows"].values()
                        if flow.get("acceptance_level") == "isolated_local_json_persistence"]
    return 0 if persistent_flows and all(flow["persistence_verified"] for flow in persistent_flows) else 1


if __name__ == "__main__":
    raise SystemExit(main())