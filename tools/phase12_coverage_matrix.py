"""把实际pytest ASGI请求与当前OpenAPI逐操作对齐；2xx只证明触达，不冒称业务验收。"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import uuid

ROOT = Path(__file__).resolve().parents[1]
_RECORDS = []
_LOCK = threading.Lock()
_ORIGINAL = None
_START = {}


def snapshot():
    result = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
                            cwd=ROOT, capture_output=True, check=True)
    files = {}
    for name in result.stdout.decode("utf-8").split("\0"):
        path = ROOT / name
        if name and path.is_file():
            files[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    digest = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
    return {"digest": digest, "files": files}


def pytest_configure(config):
    global _ORIGINAL, _START
    if not os.environ.get("GW_COVERAGE_OUTPUT"):
        return
    from fastapi import FastAPI
    _START = snapshot()
    _ORIGINAL = FastAPI.__call__
    async def observed(app, scope, receive, send):
        status = None
        async def capture(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
            await send(message)
        try:
            await _ORIGINAL(app, scope, receive, capture)
        finally:
            route = scope.get("route")
            path = getattr(route, "path", "")
            if scope.get("type") == "http" and (path.startswith("/api/") or path == "/healthz"):
                with _LOCK:
                    _RECORDS.append({"method": scope["method"], "path": path, "status": status,
                                     "test": os.environ.get("PYTEST_CURRENT_TEST", "outside_test")})
    FastAPI.__call__ = observed


def pytest_sessionfinish(session, exitstatus):
    if _ORIGINAL is None:
        return
    from fastapi import FastAPI
    from gods_workbench.api.app import create_app
    FastAPI.__call__ = _ORIGINAL
    document = create_app().openapi()
    operations = []
    for path, methods in sorted(document["paths"].items()):
        for method in sorted(methods):
            if method not in {"get", "put", "post", "patch", "delete", "options", "head"}:
                continue
            rows = [row for row in _RECORDS if row["path"] == path and row["method"] == method.upper()]
            statuses = Counter(str(row["status"]) for row in rows)
            operations.append({"method": method.upper(), "path": path, "attempts": len(rows),
                               "status_counts": dict(statuses),
                               "has_2xx": any(row["status"] is not None and 200 <= row["status"] < 300 for row in rows),
                               "test_cases": sorted(set(row["test"].removesuffix(" (call)") for row in rows)),
                               "business_acceptance": "requires_assertion_and_independent_review" if rows else "unexecuted"})
    end = snapshot()
    report = {"scope": "pytest真实ASGI方法路径及响应状态；不记录正文、凭据、实际参数、外部Provider响应",
              "pytest_exit_code": int(exitstatus), "openapi_operation_count": len(operations),
              "operation_count_with_attempts": sum(bool(row["attempts"]) for row in operations),
              "operation_count_with_2xx": sum(row["has_2xx"] for row in operations),
              "request_count": len(_RECORDS), "stable_snapshot": _START["digest"] == end["digest"],
              "start_snapshot": _START, "end_snapshot": end, "operations": operations}
    Path(os.environ["GW_COVERAGE_OUTPUT"]).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="实际测试请求覆盖矩阵（非业务通过率）")
    parser.add_argument("--output-dir", type=Path, default=Path(tempfile.gettempdir()))
    parser.add_argument("pytest_args", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    output = args.output_dir.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error("覆盖矩阵和日志必须输出到仓库外")
    output.mkdir(parents=True, exist_ok=True)
    run_id = uuid.uuid4().hex
    report_path = output / f"phase12-coverage-{run_id}.json"
    log_path = output / f"phase12-coverage-{run_id}.txt"
    env = {**os.environ, "GW_COVERAGE_OUTPUT": str(report_path),
           "PYTHONPATH": os.pathsep.join([str(ROOT), str(ROOT / "src")])}
    extra = args.pytest_args
    if extra[:1] == ["--"]:
        extra = extra[1:]
    with log_path.open("w", encoding="utf-8") as log:
        result = subprocess.run([sys.executable, "-m", "pytest", "-p", "tools.phase12_coverage_matrix", "-v", *extra],
                                cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    print(json.dumps({"report_path": str(report_path), "log_path": str(log_path), "exit_code": result.returncode}))
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
