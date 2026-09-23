#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""判定「按当前源码重新生成 Tailwind 快照」是否会改变真实渲染结果（本仓唯一口径）。

为什么需要本工具
----------------
tools/build_static_tailwind_utilities.py 的 --diff 只能给出**规则级**差异（选择器集合的
增删计数）。规则级差异**不等于**视觉变更：快照是历史累积产物，其中包含源码已不再引用的
陈旧规则（删除它们不影响任何页面）；也可能缺少当前源码引用的新规则，但只要该页面另加载了
自托管 Tailwind 运行时做 JIT，样式仍由运行时补齐。

因此「是否会造成可见视觉变更」这个判断，**必须**在真实浏览器里逐元素比对 computed style，
不能从规则计数直接推断。本工具即承担该判定，并把结论固化为可复算口令。

判定口径（刻意写成机械、可复现）
--------------------------------
0. **判别力闸门（fail-closed）**：逐页把快照整体置空，若 computed 差异仍为 0，说明该页并不
   消费本地快照（样式由自托管 Tailwind 运行时 JIT 提供），该页**不纳入分母**。若没有任何页面
   具备判别力，直接退出码 2，结论作废。
1. 在内存中重新生成快照（等价于 --force 会写入的内容），**不写盘**；
2. 用 Playwright 路由拦截，把该内容注入受检页面对 tailwind-utilities.css 的请求；
3. 逐元素（按 tagName + className 配对）比对 **computed style**；
4. **默认排除 CSS 动画采样属性**（见 ANIMATION_PROPS）：
   transform / opacity / filter 是时间函数，**同一份 CSS** 前后两次加载也会不同；
   把它们计入会制造假阳性。
5. **内置对照组（fail-closed）**：先用「baseline vs baseline」跑同一口径。
   若对照组出现任何差异，说明本机采样口径不可靠，工具**直接失败**（退出码 2），
   此时实验组结论一律作废，不得采信。

判定与退出码
------------
  * 退出码 0：对照组零噪声，且实验组**零 computed 差异** → 重生成为「视觉等价」，可安全覆盖；
  * 退出码 1：对照组零噪声，但实验组**存在 computed 差异** → 属**可见视觉变更**，
    须人工裁决（AGENTS.md §5）后才可用 --force 覆盖；
  * 退出码 2：对照组出现噪声 → 本机采样口径不可靠，结论作废（fail-closed）。

用法
----
    python -P tools/tailwind_snapshot_visual_equiv.py --serve
    python -P tools/tailwind_snapshot_visual_equiv.py --base-url http://127.0.0.1:2077
    python -P tools/tailwind_snapshot_visual_equiv.py --serve --pages v2/index.html,api-settings.html
    python -P tools/tailwind_snapshot_visual_equiv.py --serve --keep-animation-props   # 复现假阳性
    python -P tools/tailwind_snapshot_visual_equiv.py --serve --mutation-selftest      # 变异自证（证明非恒真）

清洁室边界
----------
产物（JSON 报告）**只落系统临时目录**；脚本拒绝对指向仓库静态目录的输出路径写盘。
运行时只读仓库、不产生任何仓库内写入。
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import pathlib
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
STATIC_DIR = REPO_ROOT / "src" / "gods_workbench" / "static"
GENERATOR = REPO_ROOT / "tools" / "build_static_tailwind_utilities.py"

# 受检页面：静态快照的全部真实消费者（v2 壳层 9 页 + 3 个非 v2 快照页）。
DEFAULT_PAGES = (
    "v2/index.html",
    "v2/projects.html",
    "v2/production.html",
    "v2/workshop.html",
    "v2/storyboard.html",
    "v2/agents.html",
    "v2/settings.html",
    "v2/assets.html",
    "v2/collab.html",
    "api-settings.html",
    "canvas-list.html",
    "episode-pipeline.html",
)

# 参与比对的 computed style 属性（布局 / 配色 / 排版 / 装饰）。
COMPARED_PROPS = (
    "display", "position", "top", "left", "right", "bottom",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "marginTop", "marginRight", "marginBottom", "marginLeft",
    "backgroundColor", "backgroundImage", "color",
    "borderTopWidth", "borderTopColor", "borderTopStyle", "borderRadius", "boxShadow",
    "fontSize", "fontWeight", "lineHeight", "letterSpacing",
    "gap", "width", "height", "maxWidth", "minWidth", "minHeight",
    "gridTemplateColumns", "flexDirection", "alignItems", "justifyContent", "textAlign",
    "backdropFilter", "overflowX", "overflowY", "zIndex",
)

# 刻意排除：这些是 CSS 动画的时间函数，同一份 CSS 两次采样也会不同。
ANIMATION_PROPS = ("transform", "opacity", "filter")


def load_generator():
    """按路径加载快照生成器模块（复用其唯一口径，不抄第二份实现）。"""
    spec = importlib.util.spec_from_file_location("_gw_tailwind_generator", str(GENERATOR))
    if spec is None or spec.loader is None:
        raise SystemExit("无法加载生成器：" + str(GENERATOR))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def find_chrome() -> str | None:
    """按常见路径探测本机 Chrome；找不到时交由 Playwright 自行决定。"""
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for candidate in candidates:
        if pathlib.Path(candidate).is_file():
            return candidate
    local = pathlib.Path(os.path.expanduser(r"~\AppData\Local\ms-playwright"))
    if local.is_dir():
        for child in sorted(local.glob("chromium-*")):
            for pattern in ("chrome-win64/chrome.exe", "chrome-win/chrome.exe", "chrome-linux/chrome"):
                candidate = child / pattern
                if candidate.is_file():
                    return str(candidate)
    return None


def wait_for_health(base_url: str, timeout: float = 40.0) -> bool:
    """轮询 /healthz 直至服务就绪。"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(base_url + "/healthz", timeout=3) as resp:
                if resp.status == 200:
                    return True
        except (urllib.error.URLError, OSError, ValueError):
            pass
        time.sleep(0.5)
    return False


def start_server(base_url: str) -> subprocess.Popen:
    """以 GW_RELOAD=false 启动 run.py。"""
    from urllib.parse import urlsplit

    parts = urlsplit(base_url)
    env = dict(os.environ)
    env["GW_RELOAD"] = "false"
    env["GW_HOST"] = parts.hostname or "127.0.0.1"
    env["GW_PORT"] = str(parts.port or 2077)
    flags = 0x08000000 if os.name == "nt" else 0  # Windows：不弹控制台窗口
    return subprocess.Popen(
        [sys.executable, "-P", "run.py"],
        cwd=str(REPO_ROOT),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=flags,
    )


# 浏览器内执行的采样脚本：返回每个带 class 元素的 computed style 快照。
SAMPLE_JS_TEMPLATE = (
    "() => {"
    "  const pros = __PROPS__;"
    "  const out = [];"
    "  for (const el of Array.from(document.querySelectorAll('*'))) {"
    "    const cls = el.getAttribute('class');"
    "    if (!cls) continue;"
    "    const cs = getComputedStyle(el);"
    "    const rec = { tag: el.tagName, cls: cls };"
    "    for (const p of pros) rec[p] = cs[p];"
    "    out.push(rec);"
    "  }"
    "  return out;"
    "}"
)


def sample_js(props: tuple[str, ...]) -> str:
    """生成采样脚本，参与比对的属性列表内联进去。"""
    return SAMPLE_JS_TEMPLATE.replace("__PROPS__", json.dumps(list(props)))


def compare(base: list, other: list, props: tuple[str, ...]) -> list:
    """按 (tagName, className) 顺序配对后逐属性比对，返回差异列表。"""

    def key_of(rec: dict):
        return (rec["tag"], rec["cls"])

    buckets = {}
    for rec in other:
        buckets.setdefault(key_of(rec), []).append(rec)

    seen = {}
    diffs = []
    for rec in base:
        k = key_of(rec)
        index = seen.get(k, 0)
        seen[k] = index + 1
        candidates = buckets.get(k, [])
        if index >= len(candidates):
            continue
        peer = candidates[index]
        changed = {p: [rec[p], peer[p]] for p in props if rec[p] != peer[p]}
        if changed:
            diffs.append({"tag": rec["tag"], "cls": rec["cls"], "changes": changed})
    return diffs


# 快照中的单类规则：.类名{ ... }（类名里的 CSS 转义反斜杠需还原后才能与 DOM class 比对）
SINGLE_RULE_RE = re.compile(r"\.((?:[A-Za-z0-9_-]|\\.)*)\{([^}]*)\}")


def kill_used_rules(css: str, page) -> str | None:
    """删除「该页运行时真实使用」的全部单类规则；无可删规则时返回 None（变异自证用）。"""
    used = set(page.evaluate("() => Array.from(new Set(Array.from(document.querySelectorAll('[class]'))"
                             ".flatMap(el => Array.from(el.classList))))"))
    hit = []
    for selector, body in SINGLE_RULE_RE.findall(css):
        name = selector.replace("\\", "")
        if name in used and ":" not in name:
            hit.append("." + selector + "{" + body + "}")
    if not hit:
        return None
    out = css
    for chunk in hit:
        out = out.replace(chunk, "")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(
        description="判定按当前源码重新生成 Tailwind 快照是否会改变真实渲染结果。"
    )
    parser.add_argument("--serve", action="store_true", help="自动启动本地 run.py（2077）")
    parser.add_argument("--base-url", default="http://127.0.0.1:2077", help="已运行服务的基础地址")
    parser.add_argument("--pages", default=None, help="逗号分隔的受检页面（相对 static/）")
    parser.add_argument("--artifacts-dir", default=None, help="报告输出目录（默认系统临时目录）")
    parser.add_argument(
        "--mutation-selftest",
        action="store_true",
        help="追加变异自证：删除本页在用的快照规则后必须出现 computed 差异，否则退出码 2",
    )
    parser.add_argument(
        "--keep-animation-props",
        action="store_true",
        help="把动画属性也计入比对（默认排除；用于复现假阳性，正名用）",
    )
    args = parser.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("缺少依赖：请先安装 playwright（python -m pip install playwright）。", file=sys.stderr)
        return 2

    pages = tuple(args.pages.split(",")) if args.pages else DEFAULT_PAGES
    props = COMPARED_PROPS + (ANIMATION_PROPS if args.keep_animation_props else ())

    if args.keep_animation_props:
        print("[提示] 已启用 --keep-animation-props：动画属性计入比对，预期出现假阳性。")

    if args.artifacts_dir:
        artifacts = pathlib.Path(args.artifacts_dir).resolve()
        static_res = STATIC_DIR.resolve()
        if artifacts == static_res or static_res in artifacts.parents:
            print("拒绝写入：产物目录不得位于仓库静态目录内（AGENTS.md §1.2）。", file=sys.stderr)
            return 2
    else:
        artifacts = pathlib.Path(tempfile.gettempdir()) / "gw-tailwind-visual-equiv"
    artifacts.mkdir(parents=True, exist_ok=True)

    # 在内存中重新生成快照；全程不写仓库。
    generator = load_generator()
    classes = generator.collect_all_classes()
    runtime = generator.resolve_runtime(None)
    regenerated = generator.compose(generator.render_with_runtime(runtime, classes))
    print("[equiv] 内存重生成完成：候选类名 %d 个，正文 %d 字节" % (len(classes), len(regenerated.encode("utf-8"))))

    server = None
    if args.serve:
        server = start_server(args.base_url)
        print("[equiv] 已启动本地服务 " + args.base_url)

    chrome = find_chrome()
    exit_code = 0
    report = {"base_url": args.base_url, "pages": list(pages), "discriminative": {}, "control": {}, "experiment": {}, "mutation_selftest": {}}

    try:
        if not wait_for_health(args.base_url):
            print("服务未就绪：" + args.base_url + "/healthz", file=sys.stderr)
            return 2

        with sync_playwright() as pw:
            launch = {"headless": True}
            if chrome:
                launch["executable_path"] = chrome
            browser = pw.chromium.launch(**launch)
            page = browser.new_context(viewport={"width": 1600, "height": 1000}).new_page()
            js = sample_js(props)

            # 第 0 步（判别力闸门，fail-closed）：
            # 并非所有受检页面都真正消费本地快照。经实测，v2 壳层页面样式由自托管
            # Tailwind 运行时 JIT 提供，对它们注入任何快照内容都不会产生 computed 差异；
            # 把这类页面计入分母会稀释结论、放大「零差异」的虚假可信度。
            # 判据：把快照整体置空；若 computed 差异仍为 0，则该页对本次判定无判别力，必须排除。
            print("")
            print("[equiv] 第 0 步：页面判别力闸门（置空快照，要求出现 computed 差异）")

            def blank_css(route, request):
                route.fulfill(status=200, content_type="text/css", body="")

            discriminative = []
            for name in pages:
                url = args.base_url + "/static/" + name
                page.goto(url, wait_until="load", timeout=30000)
                page.wait_for_timeout(2200)
                before = page.evaluate(js)
                page.route("**/css/tailwind-utilities.css*", blank_css)
                page.goto("about:blank")
                page.goto(url, wait_until="load", timeout=30000)
                page.wait_for_timeout(2200)
                after = page.evaluate(js)
                page.unroute("**/css/tailwind-utilities.css*")
                blank_diff = len(compare(before, after, props))
                report["discriminative"][name] = {"elements": len(before), "blank_diff": blank_diff}
                if blank_diff:
                    discriminative.append(name)
                    print("    %-24s 置空差异 %-6d -> 有判别力，纳入判定" % (name, blank_diff))
                else:
                    print("    %-24s 置空差异 0      -> 无判别力，排除（该页不消费本地快照）" % name)

            if not discriminative:
                print(
                    "\n[equiv] 判定：没有任何页面消费本地快照，本次判定无判别力，退出码 2。",
                    file=sys.stderr,
                )
                browser.close()
                return 2

            report["discriminative_pages"] = list(discriminative)
            print(
                "[equiv] 判别力闸门通过：%d/%d 页纳入判定（%s）"
                % (len(discriminative), len(report["discriminative"]), "，".join(discriminative))
            )

            control_noise = 0
            print("")
            print("[equiv] 第 1 步：对照组（baseline vs baseline，同一份 CSS 加载两次）")
            for name in pages:
                url = args.base_url + "/static/" + name
                page.goto(url, wait_until="load", timeout=30000)
                page.wait_for_timeout(2200)
                first = page.evaluate(js)
                page.goto("about:blank")
                page.goto(url, wait_until="load", timeout=30000)
                page.wait_for_timeout(2200)
                second = page.evaluate(js)
                diffs = compare(first, second, props)
                control_noise += len(diffs)
                report["control"][name] = {"elements": len(first), "diff": len(diffs)}
                print("    %-24s 元素 %-5d 噪声差异 %d" % (name, len(first), len(diffs)))

            if control_noise:
                print(
                    "\n[equiv] 判定：口径不可靠 —— 对照组出现 %d 处噪声，退出码 2。\n"
                    "        实验组结论作废。若噪声来自动画属性，请勿使用 --keep-animation-props。"
                    % control_noise,
                    file=sys.stderr,
                )
                exit_code = 2
            else:
                print("")
                print("[equiv] 对照组零噪声，口径可靠。")
                print("[equiv] 第 2 步：实验组（现有快照 vs 内存重生成，仅统计有判别力的页面）")
                total_diff = 0
                total_el = 0

                def fulfill(route, request):
                    route.fulfill(status=200, content_type="text/css", body=regenerated)

                for name in discriminative:
                    url = args.base_url + "/static/" + name
                    page.goto(url, wait_until="load", timeout=30000)
                    page.wait_for_timeout(2200)
                    base = page.evaluate(js)
                    page.route("**/css/tailwind-utilities.css*", fulfill)
                    page.goto("about:blank")
                    page.goto(url, wait_until="load", timeout=30000)
                    page.wait_for_timeout(2200)
                    injected = page.evaluate(js)
                    page.unroute("**/css/tailwind-utilities.css*")
                    diffs = compare(base, injected, props)
                    total_diff += len(diffs)
                    total_el += len(base)
                    report["experiment"][name] = {
                        "elements": len(base),
                        "diff": len(diffs),
                        "samples": diffs[:5],
                    }
                    print("    %-24s 元素 %-5d computed 差异 %d" % (name, len(base), len(diffs)))
                    for item in diffs[:3]:
                        print("        " + json.dumps(item, ensure_ascii=False)[:220])

                    # 第 3 步（可选，变异自证）：证明本口径对本页确有分辨力。
                    # 做法：删掉重生成结果中「该页运行时真实使用」的全部单类规则，再注入。
                    # 若此时 computed 差异仍为 0，说明本页对该 CSS 不敏感，自证失败（退出码 2）。
                    if args.mutation_selftest:
                        mutated = kill_used_rules(regenerated, page)
                        if mutated is None:
                            print("        [变异自证] 未找到可删除的已用规则 -> 自证失败", file=sys.stderr)
                            selftest_ok = False
                        else:
                            def fulfill_mutated(route, request):
                                route.fulfill(status=200, content_type="text/css", body=mutated)

                            page.route("**/css/tailwind-utilities.css*", fulfill_mutated)
                            page.goto("about:blank")
                            page.goto(url, wait_until="load", timeout=30000)
                            page.wait_for_timeout(2200)
                            mutated_snapshot = page.evaluate(js)
                            page.unroute("**/css/tailwind-utilities.css*")
                            mutation_diffs = len(compare(base, mutated_snapshot, props))
                            report["mutation_selftest"][name] = mutation_diffs
                            selftest_ok = mutation_diffs > 0
                            print(
                                "        [变异自证] 已删除本页在用规则后 computed 差异 = %d -> %s"
                                % (mutation_diffs, "通过" if selftest_ok else "失败")
                            )
                        if not selftest_ok:
                            print(
                                "\n[equiv] 判定：变异自证失败，本口径对该页无分辨力，退出码 2。",
                                file=sys.stderr,
                            )
                            browser.close()
                            return 2

                print("")
                print("[equiv] 合计：元素 %d 个，computed 差异 %d 处" % (total_el, total_diff))
                report["total_elements"] = total_el
                report["total_diff"] = total_diff
                if total_diff == 0:
                    print("[equiv] 判定：重生成为「视觉等价」——可安全覆盖（仍需人工授权 --force）。")
                    exit_code = 0
                else:
                    print(
                        "[equiv] 判定：重生成会造成「可见视觉变更」——须人工裁决后才可 --force。",
                        file=sys.stderr,
                    )
                    exit_code = 1

            browser.close()
    finally:
        report_path = artifacts / "tailwind-visual-equiv-report.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[equiv] 报告已写入：" + str(report_path))
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
