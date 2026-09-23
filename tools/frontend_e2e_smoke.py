#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""真实浏览器端到端冒烟核验（Phase 10 前端）。

本脚本的存在理由
----------------
Phase 10A-10E 的门禁全部建立在 FastAPI 的 TestClient 之上，属于**进程内**验证：
它能证明 HTML 可返回、状态码正确，但**不能**证明浏览器里真的没有脚本异常、
没有静态资源 404、也没有「类名写了但样式没生效」这类只在渲染期才暴露的问题。
治理台账一直把「前端真实浏览器 E2E 未执行」列为未闭环项，本脚本把它闭环。

本脚本检查什么（每页独立判定）
------------------------------
1. 页面导航到 networkidle 期间**零 pageerror**（未捕获 JS 异常）。
2. 同源 `/static/**` 资源**零 4xx/5xx**（样式、脚本、字体全部真实可达）。
3. 每个 API 4xx/5xx 响应的归一化路径**必须已在冻结缺口基线中登记**
   （守卫 `tests/contracts/test_phase8_frontend_backend_api_gap.py` 即唯一口径）。
   未登记的新 4xx = 新缺口，判定失败，防止「反正前端没报错」式掩盖。
4. O5 视觉实证：真实渲染后带 `py-0.5` 的元素其 computed padding 必须是 2px。
   （这是死类修正是否真的生效的**渲染期**证据，TestClient 无法给出。）
5. 交互期 smoke：对 7 个确定性交互（视图切换、搜索过滤与复原、设置视图与主题开关幂等往返、
   设置分区切换、导航跳转）执行真实点击，并断言**真实 DOM 变化**——不允许用「没抛异常」冒充通过。
   交互期同样要求零 pageerror，且产生的 API 4xx 必须已在冻结基线内。

洁净室边界
----------
* 截图与 JSON 报告默认写入**系统临时目录**，绝不写入仓库
  （仓库禁止任何图片/二进制资产；`AGENTS.md` 第 1.2 条）。
* 本脚本**不修改**仓库任何文件，只读地驱动浏览器。
* 需要 Playwright 与本机 Chrome；CI 环境不安装 Playwright，
  故本脚本**不**接入 CI，属人工/本地门禁。

用法
----
    python -P tools/frontend_e2e_smoke.py --serve            # 自起 2077 服务再跑
    python -P tools/frontend_e2e_smoke.py --base-url http://127.0.0.1:2077
    python -P tools/frontend_e2e_smoke.py --serve --artifacts-dir D:\\tmp\\gw-e2e
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
STATIC_DIR = REPO_ROOT / "src" / "gods_workbench" / "static"
GUARD_PATH = REPO_ROOT / "tests" / "contracts" / "test_phase8_frontend_backend_api_gap.py"

# 受检页面：v2 主壳层全部页面（与 v2-shell.js 的 ROUTES 一致）。
PAGES = (
    "index.html",
    "projects.html",
    "production.html",
    "workshop.html",
    "storyboard.html",
    "agents.html",
    "settings.html",
    "assets.html",
    "collab.html",
)

# 旧仓与静态层禁用标记：本脚本同样不得引用（与卫生用例口径一致）。
FORBIDDEN_PAGE_REQUEST_PREFIXES = ("/api/", "/static/")



# ---------------------------------------------------------------------------
# 交互期检查（加载期之上的补充）
# ---------------------------------------------------------------------------
# 每项 = 页面 + 动作 + 断言。动作与断言都在真实渲染期执行；任何 pageerror 一律判失败，
# 断言必须落到**真实 DOM 变化**上，禁止用「没抛异常」冒充通过。
INTERACTIONS: tuple[dict, ...] = (
    {
        "id": "projects-view-table",
        "page": "projects.html",
        "desc": "点击列表视图按钮：列表容器可见、网格容器隐藏",
        "action": "() => document.querySelector('#viewBtnTable').click()",
        "assert": "() => { const t = document.querySelector('#projectTableView'); const g = document.querySelector('#projectsGridViewContainer'); return !!t && !!g && !t.classList.contains('hidden') && g.classList.contains('hidden'); }",
    },
    {
        "id": "projects-view-grid-restore",
        "page": "projects.html",
        "desc": "再点击网格视图按钮：切回网格态（可逆性）",
        "action": "() => document.querySelector('#viewBtnGrid').click()",
        "assert": "() => { const t = document.querySelector('#projectTableView'); const g = document.querySelector('#projectsGridViewContainer'); return !!t && !!g && t.classList.contains('hidden') && !g.classList.contains('hidden'); }",
    },
    {
        "id": "projects-search-empty-state",
        "page": "projects.html",
        "desc": "输入不存在的关键字：项目卡归零并渲染空态提示（搜索真的过滤了 DOM）",
        "action": "() => { const el = document.querySelector('#projectSearchInput'); el.value = 'zzz_no_such_project'; el.dispatchEvent(new Event('input', { bubbles: true })); }",
        "assert": "() => { const g = document.querySelector('#projectsGridViewContainer'); if (!g) return false; const cards = g.querySelectorAll('.project-card-item').length; return cards === 0 && g.innerText.includes('未检索到'); }",
    },
    {
        "id": "projects-search-restore",
        "page": "projects.html",
        "desc": "清空关键字：项目卡恢复出现（状态可逆）",
        "action": "() => { const el = document.querySelector('#projectSearchInput'); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }",
        "assert": "() => { const g = document.querySelector('#projectsGridViewContainer'); return !!g && g.querySelectorAll('.project-card-item').length > 0; }",
    },
    {
        "id": "index-settings-view-and-theme-toggle",
        "page": "index.html",
        "desc": "切到设置视图（?view=settings）：设置面板可见，且主题开关已绑定并完成幂等往返",
        "action": "() => { const params = new URLSearchParams(location.search); params.set('view', 'settings'); history.replaceState({}, '', location.pathname + '?' + params.toString()); if (window.V2Home && window.V2Home.switchView) window.V2Home.switchView('settings'); }",
        "assert": "() => { const panel = document.querySelector('#v2MainSettings'); if (!panel || panel.classList.contains('hidden')) return false; const el = document.querySelector('#themeToggle'); if (!el || typeof el.onclick !== 'function') return false; const before = { cls: el.className, aria: el.getAttribute('aria-pressed') }; el.click(); const mid = el.className; el.click(); return mid !== before.cls && el.className === before.cls && el.getAttribute('aria-pressed') === before.aria; }",
    },
    {
        "id": "settings-section-switch",
        "page": "settings.html",
        "desc": "点击「席位与资产权限」：按钮 active + aria-pressed + 对应 panel active",
        "action": "() => document.querySelector('[data-section=\"permissions\"]').click()",
        "assert": "() => { const b = document.querySelector('[data-section=\"permissions\"]'); const pl = document.querySelector('[data-panel=\"permissions\"]'); return !!b && !!pl && b.classList.contains('active') && pl.classList.contains('active') && getComputedStyle(pl).display !== 'none'; }",
    },
    {
        "id": "nav-projects-to-workshop",
        "page": "projects.html",
        "desc": "点击导航「影视工坊」：真实跳转到 workshop.html",
        "action": "() => document.querySelector('a.nav-pill-btn[title=\"影视工坊\"]').click()",
        "nav_assert": "(url) => new URL(url).pathname.endsWith('/static/v2/workshop.html')",
    },
)


def run_interactions(base_url: str, implemented, unimplemented) -> dict:
    """在真实浏览器里执行确定性交互，断言真实 DOM 变化。"""
    from playwright.sync_api import sync_playwright

    results: list[dict] = []
    failures: list[str] = []
    chrome = find_chrome()
    launch_kwargs = {"executable_path": chrome} if chrome else {}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(**launch_kwargs)
        try:
            for item in INTERACTIONS:
                context = browser.new_context(viewport={"width": 1600, "height": 1000})
                page = context.new_page()
                page_errors: list[str] = []
                api_errors: list[dict] = []
                page.on("pageerror", lambda exc: page_errors.append(str(exc)))

                def on_response(response):
                    url = response.url
                    if response.status >= 400 and "/api/" in url:
                        api_errors.append(
                            {"status": response.status, "path": _normalize_api_path(url)}
                        )

                page.on("response", on_response)
                page.goto(f"{base_url}/static/v2/{item['page']}", wait_until="networkidle")
                page.wait_for_timeout(400)

                passed = False
                detail = ""
                try:
                    page.evaluate(item["action"])
                    if item.get("nav_assert"):
                        from urllib.parse import urlsplit

                        expected = item["nav_assert"].split("endsWith")[-1].strip(" ()'\"")
                        page.wait_for_url(
                            lambda url, expected=expected: urlsplit(url).path.endswith(expected),
                            timeout=8000,
                        )
                        passed = urlsplit(page.url).path.endswith(expected)
                    else:
                        passed = bool(page.evaluate(item["assert"]))
                        if not passed:
                            detail = "断言返回假值"
                except Exception as exc:  # 交互本身失败也是失败
                    detail = f"交互或断言抛错：{type(exc).__name__}"
                finally:
                    context.close()

                unregistered = sorted(
                    {
                        entry["path"]
                        for entry in api_errors
                        if entry["path"] not in implemented
                        and entry["path"] not in unimplemented
                    }
                )
                results.append(
                    {
                        "id": item["id"],
                        "page": item["page"],
                        "desc": item["desc"],
                        "passed": passed,
                        "detail": detail,
                        "page_errors": page_errors,
                        "api_unregistered_paths": unregistered,
                    }
                )
                if not passed:
                    failures.append(f"{item['id']}（{item['desc']}）未通过：{detail}")
                if page_errors:
                    failures.append(f"{item['id']} 出现未捕获 JS 异常 {page_errors}")
                if unregistered:
                    failures.append(f"{item['id']} API 4xx 路径不在冻结基线中 {unregistered}")
        finally:
            browser.close()

    return {"interactions": results, "failures": failures}


def _load_guard_baseline() -> tuple[frozenset[str], frozenset[str]]:
    """从冻结缺口守卫导入唯一口径的实现/未实现路径集合。

    直接复用守卫文件，避免本脚本再抄一份基线导致漂移（历史教训：同一份清单
    曾在三处各写一遍并实际漂移）。
    """
    if not GUARD_PATH.is_file():
        raise SystemExit(f"缺少冻结缺口守卫：{GUARD_PATH}")
    spec = importlib.util.spec_from_file_location("gw_api_gap_guard", GUARD_PATH)
    if spec is None or spec.loader is None:
        raise SystemExit("无法加载冻结缺口守卫模块")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    implemented = frozenset(module.KNOWN_IMPLEMENTED)
    unimplemented = frozenset(module.KNOWN_UNIMPLEMENTED)
    if not implemented or not unimplemented:
        raise SystemExit("冻结缺口守卫基线为空，拒绝据此判定通过")
    return implemented, unimplemented


def _normalize_api_path(url: str) -> str:
    """把绝对 URL 归一化为守卫口径的路径（去查询串、去结尾斜杠）。"""
    from urllib.parse import urlsplit

    path = urlsplit(url).path
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    return path


def find_chrome() -> str | None:
    """按常见路径探测本机 Chrome；找不到时交给 Playwright 自行决定。"""
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for candidate in candidates:
        if Path(candidate).is_file():
            return candidate
    # Playwright 自有下载目录（版本号随 playwright 版本变化，故按目录模式探测）。
    local = os.path.expanduser(r"~\AppData\Local\ms-playwright")
    if Path(local).is_dir():
        for child in sorted(Path(local).glob("chromium-*")):
            for pattern in ("chrome-win64/chrome.exe", "chrome-win/chrome.exe", "chrome-linux/chrome"):
                candidate = child / pattern
                if candidate.is_file():
                    return str(candidate)
    return None


def wait_for_health(base_url: str, timeout: float = 40.0) -> dict:
    """轮询 /healthz 直至服务就绪；超时即失败关闭。"""
    deadline = time.time() + timeout
    last_error: str | None = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(base_url + "/healthz", timeout=3) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, OSError, ValueError) as exc:
            last_error = str(exc)
        time.sleep(0.5)
    raise SystemExit(f"服务未在 {timeout:.0f}s 内就绪：{base_url}/healthz（最后错误：{last_error}）")


def start_server(base_url: str) -> subprocess.Popen:
    """以 GW_RELOAD=false 启动 run.py，返回进程句柄。"""
    from urllib.parse import urlsplit

    parts = urlsplit(base_url)
    env = dict(os.environ)
    env["GW_RELOAD"] = "false"
    env["GW_HOST"] = parts.hostname or "127.0.0.1"
    env["GW_PORT"] = str(parts.port or 2077)
    print(f"[e2e] 启动本地服务 {base_url} ...")
    return subprocess.Popen(
        [sys.executable, "-P", "run.py"],
        cwd=str(REPO_ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def run_checks(base_url: str, artifacts_dir: Path, implemented, unimplemented) -> dict:
    """逐个页面驱动真实浏览器并汇总判定结果。"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit(
            "缺少 playwright，无法执行真实浏览器核验。\n"
            "  安装：python -m pip install playwright && python -m playwright install chromium"
        )

    artifacts_dir.mkdir(parents=True, exist_ok=True)
    chrome = find_chrome()
    launch_kwargs = {"executable_path": chrome} if chrome else {}
    pages_report: list[dict] = []
    failures: list[str] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(**launch_kwargs)
        try:
            for page_name in PAGES:
                context = browser.new_context(viewport={"width": 1600, "height": 1000})
                page = context.new_page()
                page_errors: list[str] = []
                failed_requests: list[dict] = []
                api_errors: list[dict] = []
                console_errors: list[str] = []

                page.on("pageerror", lambda exc: page_errors.append(str(exc)))
                page.on(
                    "console",
                    lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
                )

                def on_response(response, page_name=page_name):
                    url = response.url
                    if response.status < 400:
                        return
                    if "/static/" in url:
                        failed_requests.append({"status": response.status, "url": url})
                    elif "/api/" in url:
                        api_errors.append(
                            {"status": response.status, "path": _normalize_api_path(url), "url": url}
                        )

                page.on("response", on_response)

                url = f"{base_url}/static/v2/{page_name}"
                page.goto(url, wait_until="networkidle")
                page.wait_for_timeout(600)

                # O5 渲染期实证：带 py-0.5 的元素必须真的拿到 2px 垂直内边距。
                padding = page.evaluate(
                    """() => {
                      const els = [...document.querySelectorAll('*')];
                      const has = (el, name) =>
                        typeof el.className === 'string' && el.className.split(/\\s+/).includes(name);
                      const hit = els.filter((el) => has(el, 'py-0.5'));
                      const dead = els.filter((el) => has(el, 'py-0.2'));
                      const withPad = hit.filter((el) => {
                        const s = getComputedStyle(el);
                        return s.paddingTop === '2px' && s.paddingBottom === '2px';
                      });
                      return { total: hit.length, withPad: withPad.length, dead: dead.length };
                    }"""
                )

                screenshot = artifacts_dir / f"v2-{page_name.replace('.html', '')}.png"
                page.screenshot(path=str(screenshot), full_page=False)
                title = page.title()
                context.close()

                unregistered = sorted(
                    {
                        item["path"]
                        for item in api_errors
                        if item["path"] not in implemented and item["path"] not in unimplemented
                    }
                )

                entry = {
                    "page": page_name,
                    "title": title,
                    "page_errors": page_errors,
                    "static_asset_errors": failed_requests,
                    "api_error_count": len(api_errors),
                    "api_error_paths": sorted({item["path"] for item in api_errors}),
                    "api_unregistered_paths": unregistered,
                    "console_error_count": len(console_errors),
                    "py_0_5_elements": padding["total"],
                    "py_0_5_with_2px_padding": padding["withPad"],
                    "py_0_2_dead_elements": padding["dead"],
                    "screenshot": str(screenshot),
                }
                pages_report.append(entry)

                if page_errors:
                    failures.append(f"{page_name}: 出现未捕获 JS 异常 {page_errors}")
                if failed_requests:
                    failures.append(f"{page_name}: 静态资源请求失败 {failed_requests}")
                if unregistered:
                    failures.append(f"{page_name}: API 4xx 路径不在冻结基线中 {unregistered}")
                if padding["dead"]:
                    failures.append(f"{page_name}: 仍存在死类 py-0.2 元素 {padding['dead']} 个")
                if padding["total"] and padding["withPad"] != padding["total"]:
                    failures.append(
                        f"{page_name}: py-0.5 未全部生效（命中 {padding['total']}，"
                        f"实际 2px 内边距 {padding['withPad']}）"
                    )
        finally:
            browser.close()

    return {"pages": pages_report, "failures": failures}


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 10 前端真实浏览器 E2E 冒烟核验")
    parser.add_argument("--base-url", default="http://127.0.0.1:2077", help="被测服务地址")
    parser.add_argument("--serve", action="store_true", help="自动启动本地 run.py（2077）")
    parser.add_argument(
        "--artifacts-dir",
        default=None,
        help="截图与 JSON 报告输出目录（默认系统临时目录，严禁指向仓库）",
    )
    parser.add_argument("--report-json", default=None, help="汇总报告 JSON 路径")
    args = parser.parse_args()

    artifacts_dir = (
        Path(args.artifacts_dir) if args.artifacts_dir else Path(tempfile.mkdtemp(prefix="gw-e2e-"))
    )
    resolved = artifacts_dir.resolve()
    if STATIC_DIR in resolved.parents or resolved == STATIC_DIR:
        raise SystemExit("拒绝把产物写入仓库静态目录（洁净室禁止仓库内二进制资产）")

    implemented, unimplemented = _load_guard_baseline()
    print(
        f"[e2e] 冻结基线已加载：实现 {len(implemented)} / 未实现 {len(unimplemented)}"
        f"（唯一口径：{GUARD_PATH.relative_to(REPO_ROOT).as_posix()}）"
    )

    server: subprocess.Popen | None = None
    try:
        if args.serve:
            server = start_server(args.base_url)
        health = wait_for_health(args.base_url)
        print(f"[e2e] /healthz = {json.dumps(health, ensure_ascii=False)}")

        result = run_checks(args.base_url, artifacts_dir, implemented, unimplemented)
        interactions = run_interactions(args.base_url, implemented, unimplemented)
        result["interactions"] = interactions["interactions"]
        result["failures"].extend(interactions["failures"])
    finally:
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()

    report = {
        "base_url": args.base_url,
        "interactions": result.get("interactions", []),
        "healthz": health,
        "baseline": {
            "guard": GUARD_PATH.relative_to(REPO_ROOT).as_posix(),
            "known_implemented": len(implemented),
            "known_unimplemented": len(unimplemented),
        },
        "pages": result["pages"],
        "failures": result["failures"],
        "artifacts_dir": str(artifacts_dir.resolve()),
    }
    report_path = Path(args.report_json) if args.report_json else artifacts_dir / "e2e-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    for entry in result["pages"]:
        print(
            f"[e2e] {entry['page']:16} title={entry['title'][:24]:24} "
            f"jsError={len(entry['page_errors'])} staticFail={len(entry['static_asset_errors'])} "
            f"api4xx={entry['api_error_count']} py05={entry['py_0_5_elements']}"
            f"/{entry['py_0_5_with_2px_padding']}"
        )
    active = result.get("interactions", [])
    if active:
        passed_n = sum(1 for i in active if i["passed"])
        print(f"[e2e] 交互期：{passed_n}/{len(active)} 项通过")
        for i in active:
            print(f"    - {i['id']:34} passed={i['passed']} {i['detail']}")
    print(f"[e2e] 报告：{report_path}")

    if result["failures"]:
        print("[e2e] 判定：FAIL")
        for item in result["failures"]:
            print("  - " + item)
        return 1
    print("[e2e] 判定：PASS（零 JS 异常 / 零静态资源失败 / 零基线外 API 4xx / py-0.5 全部生效）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())