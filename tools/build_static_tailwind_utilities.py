#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重新生成 src/gods_workbench/static/css/tailwind-utilities.css（静态 Tailwind 快照）。

本脚本的存在理由
----------------
该快照首行注释长期指向 tools/build_static_tailwind_utilities.py，但该脚本从未入库，
导致「静态 Tailwind 预构建产物」不可复现（治理台账 O4）。本脚本补齐该链路。

为什么必须用浏览器运行时，而不是 Tailwind CLI
--------------------------------------------
本快照的字节格式由 Tailwind Play CDN 3.4.17 浏览器运行时（JIT）产出，特征为：

  * 选择器使用 ::before / ::after（而非 :before / :after）；
  * 没有 -o-tab-size（即未经 autoprefixer）；
  * 输出已压缩；
  * 十六进制转义（如 \2c 加尾随空格）保留其终止空格。

Tailwind CLI 3.4.17 直出格式不同（:before + -o-tab-size + 未压缩），实测无法复现
本快照，故不得改用 CLI 生成。

配方必须使用纯净的 3.4.17 运行时（不含 @tailwindcss/forms、container-queries）。
仓库内自托管的 static/vendor/js/tailwindcss-cdn.js 是带插件的版本
（?plugins=forms@0.5.10,container-queries@0.1.1），其输出会多出 forms 层规则，
同样无法复现本快照，故本脚本默认从固定 URL 取纯净运行时并强制校验哈希。

用法
----
    python -P tools/build_static_tailwind_utilities.py            # 重新生成快照
    python -P tools/build_static_tailwind_utilities.py --check    # 只校验，不写文件
    python -P tools/build_static_tailwind_utilities.py --report   # 打印统计与哈希
    python -P tools/build_static_tailwind_utilities.py --diff     # 只打印「现有快照 vs 重新生成」规则级差异
    python -P tools/build_static_tailwind_utilities.py --runtime <纯净 3.4.17 运行时路径>

规则级差异口径
--------------
`--diff` 使用本脚本内的 `extract_rule_selectors()`：按花括号深度扫描，取每个 `{` 之前、
最后一个 `}` 或 `{` 之后的候选文本，排除以 `@` 开头的 at-rule 前奏，去重成**选择器集合**。
该口径刻意写得机械、可离线复算，避免「换一个解析器就换一个数字」。

依赖
----
  * Python 3.11 + playwright（驱动无头浏览器）
  * 本机 Chrome（脚本按常见路径探测，找不到则交给 Playwright 自行决定）

洁净室边界
----------
纯净运行时只落在系统临时目录，绝不写入仓库（仓库内不得新增第三方二进制）。
运行时按 SHA-256 强制校验，哈希不符即失败。
"""
from __future__ import annotations

import argparse
import hashlib
import html
import os
import re
import sys
import tempfile
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
STATIC_DIR = REPO_ROOT / "src" / "gods_workbench" / "static"
OUTPUT_CSS = STATIC_DIR / "css" / "tailwind-utilities.css"

# 纯净 Tailwind Play CDN 3.4.17（无插件）。已实测可逐字节复现本快照正文。
PURE_RUNTIME_URL = "https://cdn.tailwindcss.com/3.4.17"
PURE_RUNTIME_SHA256 = "176E894661AA9CDC9A5CBA6C720044CBBF7B8BD80D1C9A142A7C24B1B6C50D15"

# 仓库内自托管运行时的哈希（带插件），仅用于给出更清晰的报错提示。
VENDORED_RUNTIME_SHA256 = "A789CE5A73191759006B64A0C05F63AFBF9AA43A86511BF798D688737429E60A"

HEADER = (
    "/* Generated from the local Tailwind runtime. Run "
    "tools/build_static_tailwind_utilities.py after changing Tailwind utility classes. */"
)

# 输入目录中永不参与扫描的部分（第三方制品不产生本仓工具类）。
SKIP_DIR_NAMES = {"vendor"}

CLASS_ATTR_RE = re.compile(
    r"""class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)""", re.DOTALL
)
CLASS_LIST_RE = re.compile(
    r"""classList\s*\.\s*(?:add|remove|toggle|contains)\s*\(([^)]*)\)""", re.DOTALL
)
SET_ATTR_RE = re.compile(
    r"""setAttribute\s*\(\s*['"]class['"]\s*,\s*(?:"([^"]*)"|'([^']*)')""", re.DOTALL
)
QUOTED_RE = re.compile(r"""["'`]([^"'`]*)["'`]""")


def _iter_source_files() -> list[Path]:
    """列出参与扫描的前端源码（HTML / JS），排除 vendor/。"""
    files: list[Path] = []
    for path in STATIC_DIR.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js"}:
            continue
        if any(part in SKIP_DIR_NAMES for part in path.relative_to(STATIC_DIR).parts):
            continue
        files.append(path)
    return sorted(files)


def _split_tokens(raw: str) -> list[str]:
    """把 class 属性值切成候选类名；丢弃模板占位与属性破坏字符。"""
    out: list[str] = []
    for tok in raw.split():
        tok = tok.strip()
        if not tok:
            continue
        if any(ch in tok for ch in ('<', '>', '"', "'", '`', '\t', '\n')):
            continue
        # 只丢弃 JS 模板占位；不得按 % 或 [] 过滤，
        # 否则会误删 left-[25%] / max-w-[90%] 这类合法 arbitrary-value 类。
        if any(mark in tok for mark in ('$' + '{', '{' + '{', '{' + '%', '%' + '}', '}' + '}')):
            continue
        out.append(tok)
    return out


def extract_classes(text: str) -> set[str]:
    """从单个源文件文本中宽松提取潜在 Tailwind 工具类。

    策略是「超集安全」：多提取无害（Tailwind 会忽略非法类名），
    漏提取才会造成样式缺失，因此这里刻意放宽。
    """
    found: set[str] = set()
    for m in CLASS_ATTR_RE.finditer(text):
        raw = next((g for g in m.groups() if g is not None), "")
        found.update(_split_tokens(raw))
    for m in CLASS_LIST_RE.finditer(text):
        for q in QUOTED_RE.finditer(m.group(1)):
            found.update(_split_tokens(q.group(1)))
    for m in SET_ATTR_RE.finditer(text):
        raw = next((g for g in m.groups() if g is not None), "")
        found.update(_split_tokens(raw))
    return found


def collect_all_classes() -> list[str]:
    """扫描全部前端源码，返回排序去重后的候选类名。"""
    allc: set[str] = set()
    for path in _iter_source_files():
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            raise SystemExit(f"读取源码失败：{path}（{exc}）")
        allc.update(extract_classes(text))
    return sorted(allc)


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def _cache_path() -> Path:
    return Path(tempfile.gettempdir()) / "gw-tailwind-runtime" / "3.4.17" / "tailwindcss-cdn.js"


def resolve_runtime(explicit: str | None) -> Path:
    """解析纯净 Tailwind 3.4.17 运行时路径，并强制校验 SHA-256。"""
    if explicit:
        p = Path(explicit).expanduser().resolve()
        if not p.is_file():
            raise SystemExit(f"--runtime 指向的文件不存在：{p}")
        digest = sha256_of(p)
        if digest != PURE_RUNTIME_SHA256:
            raise SystemExit(
                "运行时哈希不符，拒绝使用。\n"
                f"  期望（纯净 3.4.17）：{PURE_RUNTIME_SHA256}\n"
                f"  实际：{digest}\n"
                "提示：带插件的自托管版本哈希为 "
                f"{VENDORED_RUNTIME_SHA256}，它不是本快照的生成配方。"
            )
        return p

    cached = _cache_path()
    if cached.is_file() and sha256_of(cached) == PURE_RUNTIME_SHA256:
        return cached

    cached.parent.mkdir(parents=True, exist_ok=True)
    print(f"下载纯净 Tailwind 3.4.17 运行时：{PURE_RUNTIME_URL}")
    req = urllib.request.Request(PURE_RUNTIME_URL, headers={"User-Agent": "gods-workbench-build"})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            payload = resp.read()
    except Exception as exc:  # noqa: BLE001 - 需给出可读的中文提示
        raise SystemExit(
            "无法获取纯净 Tailwind 3.4.17 运行时，且本地缓存不可用。\n"
            f"  原因：{exc}\n"
            "  请联网后重试，或用 --runtime 指定已校验的纯净运行时文件。"
        ) from exc

    digest = hashlib.sha256(payload).hexdigest().upper()
    if digest != PURE_RUNTIME_SHA256:
        raise SystemExit(
            "下载到的运行时哈希不符，已中止。\n"
            f"  期望：{PURE_RUNTIME_SHA256}\n  实际：{digest}"
        )
    cached.write_bytes(payload)
    return cached


def find_chrome() -> str | None:
    """按常见路径探测本机 Chrome；找不到时返回 None 交给 Playwright 自行决定。"""
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for c in candidates:
        if Path(c).is_file():
            return c
    return None


def render_with_runtime(runtime: Path, classes: list[str]) -> str:
    """在无头浏览器中加载纯净运行时并渲染类名，返回 JIT 生成的样式表文本。"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise SystemExit(
            "缺少 playwright，无法驱动无头浏览器生成快照。\n"
            "  安装：python -m pip install playwright"
        ) from exc

    body = "".join('<i class="%s"></i>' % html.escape(c, quote=True) for c in classes)
    page_html = (
        "<!doctype html><html><head>"
        '<script src="file:///%s"></script>'
        "</head><body>%s</body></html>"
    ) % (runtime.as_posix(), body)

    tmp_dir = Path(tempfile.mkdtemp(prefix="gw-tw-gen-"))
    page_path = tmp_dir / "render.html"
    page_path.write_text(page_html, encoding="utf-8")

    chrome = find_chrome()
    kwargs = {"executable_path": chrome} if chrome else {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(**kwargs)
        try:
            page = browser.new_page()
            page.goto(page_path.as_uri())
            page.wait_for_function("() => !!window.tailwind", timeout=30000)
            # 轮询直到样式表长度连续稳定，避免截断未完成的 JIT 输出
            prev, stable = -1, 0
            for _ in range(60):
                page.wait_for_timeout(400)
                size = int(
                    page.evaluate(
                        "() => Array.from(document.querySelectorAll('style'))"
                        ".reduce((n, s) => n + (s.textContent || '').length, 0)"
                    )
                )
                if size == prev and size > 0:
                    stable += 1
                    if stable >= 3:
                        break
                else:
                    stable = 0
                prev = size
            css = page.evaluate(
                "() => Array.from(document.querySelectorAll('style'))"
                ".map(s => s.textContent || '').join('')"
            )
        finally:
            browser.close()
    if not css:
        raise SystemExit("运行时未产出任何样式表，生成失败。")
    return css


def compose(css_body: str) -> str:
    """按既有快照结构组装最终文件内容（入库口径为 LF）。"""
    return "%s\n\n%s\n" % (HEADER, css_body)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="重新生成静态 Tailwind 快照。")
    parser.add_argument("--check", action="store_true", help="只校验，不写文件")
    parser.add_argument("--report", action="store_true", help="打印统计与哈希")
    parser.add_argument("--runtime", default=None, help="纯净 Tailwind 3.4.17 运行时路径")
    parser.add_argument("--force", action="store_true", help="允许覆盖与既有快照不一致的生成结果")
    parser.add_argument(
        "--diff",
        action="store_true",
        help="只打印「现有快照 vs 重新生成结果」的规则级差异（不写盘），用于人工裁决是否重生成",
    )
    args = parser.parse_args(argv)

    classes = collect_all_classes()
    print(f"扫描前端源码：{len(_iter_source_files())} 个文件，候选类名 {len(classes)} 个")

    runtime = resolve_runtime(args.runtime)
    print(f"运行时：{runtime}（SHA-256 已校验）")

    css_body = render_with_runtime(runtime, classes)
    content = compose(css_body)
    generated_sha = hashlib.sha256(content.encode("utf-8")).hexdigest().upper()

    if args.diff:
        return _diff(css_body, content)

    if args.report:
        _report(classes, css_body, content)
        return 0

    if args.check:
        print(f"生成正文：{len(css_body)} 字符；整文件 {len(content.encode('utf-8'))} 字节")
        print(f"生成 SHA-256：{generated_sha}")
        if not OUTPUT_CSS.is_file():
            print("校验失败：快照文件不存在。", file=sys.stderr)
            return 1
        current = OUTPUT_CSS.read_bytes().decode("utf-8").replace("\r\n", "\n")
        current_sha = hashlib.sha256(current.encode("utf-8")).hexdigest().upper()
        print(f"现有 SHA-256：{current_sha}")
        if current != content:
            print("校验失败：快照与生成结果不一致，请运行本脚本重新生成。", file=sys.stderr)
            return 1
        print("校验通过：快照与生成结果逐字节一致。")
        return 0

    # fail-closed：重新生成会改变既有产物时，必须显式 --force。
    # 既有快照是「已上线视觉基线」，静默覆盖等于未经授权的视觉变更。
    if OUTPUT_CSS.is_file():
        current = OUTPUT_CSS.read_bytes().decode("utf-8", errors="replace")
        if current.replace("\r\n", "\n") != content:
            if not args.force:
                print(
                    "拒绝写入：生成结果与现有快照不一致。\n"
                    "  现有快照是已上线的视觉基线，重新生成会产生可见的样式变化。\n"
                    "  该变更需人工裁决；确认后再用 --force 覆盖。",
                    file=sys.stderr,
                )
                return 2

    OUTPUT_CSS.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_CSS.write_bytes(content.encode("utf-8"))
    print(f"已写入：{OUTPUT_CSS}")
    print(f"新 SHA-256：{generated_sha}")
    return 0


def extract_rule_selectors(css: str) -> set[str]:
    """从 CSS 文本里抽取**规则选择器**集合（本仓唯一口径，可复算）。

    口径定义（刻意写得机械、可复现，避免「换个解析器就换个数字」）：
      * 逐个扫描字符，维护花括号深度；
      * 遇到 `{` 时，取其前面的「最后一个 `}` 或 `{` 之后的文本」作为选择器候选；
      * 候选里**排除**以 `@` 开头的 at-rule 前奏（`@media`、`@keyframes` 等）与空串；
      * 其余候选去除首尾空白后构成集合。
    返回的是**去重后的选择器字符串集合**，不是规则条数之和；因此嵌套 at-rule 内部的选择器
    会计入，且同一选择器出现多次只算一次。
    """
    selectors: set[str] = set()
    buf: list[str] = []
    for ch in css:
        if ch == "{":
            candidate = "".join(buf).strip()
            if candidate and not candidate.startswith("@"):
                selectors.add(candidate)
            buf = []
        elif ch == "}":
            buf = []
        else:
            buf.append(ch)
    return selectors


def _diff(css_body: str, content: str) -> int:
    """打印现有快照与新生成结果的规则级差异；不写盘。"""
    if not OUTPUT_CSS.is_file():
        print(f"现有快照不存在：{OUTPUT_CSS}", file=sys.stderr)
        return 1
    current_raw = OUTPUT_CSS.read_bytes().decode("utf-8", errors="replace").replace("\r\n", "\n")
    # 去掉首行注释头（与生成结果同构），只比对正文
    current_body = current_raw.split("\n\n", 1)[-1].strip()
    generated_body = css_body.strip()

    current_selectors = extract_rule_selectors(current_body)
    generated_selectors = extract_rule_selectors(generated_body)
    removed = current_selectors - generated_selectors
    added = generated_selectors - current_selectors
    unchanged = current_selectors & generated_selectors

    print("=== Tailwind 快照规则级 diff（口径：extract_rule_selectors，见脚本注释）===")
    print(f"现有快照选择器数：{len(current_selectors)}")
    print(f"重新生成选择器数：{len(generated_selectors)}")
    print(f"共有（不变）：{len(unchanged)}")
    print(f"移除（仅存在于现有快照）：{len(removed)}")
    print(f"新增（仅存在于重新生成）：{len(added)}")
    print(f"正文逐字节一致：{current_body == generated_body}")
    print("变更即为可复现性缺口 → 重新生成会造成可见视觉变更，须人工确认后再 --force。")
    if removed:
        print("\n移除示例（最多 10 条）：")
        for item in sorted(removed)[:10]:
            print("  - " + item)
    if added:
        print("\n新增示例（最多 10 条）：")
        for item in sorted(added)[:10]:
            print("  + " + item)
    return 0


def _report(classes: list[str], css_body: str, content: str) -> None:
    """只打印统计，不写文件。"""
    body_sha = hashlib.sha256(css_body.encode("utf-8")).hexdigest().upper()
    print(f"候选类名：{len(classes)}")
    print(f"生成正文：{len(css_body)} 字符")
    print(f"整文件大小：{len(content.encode('utf-8'))} 字节")
    print(f"正文 SHA-256：{body_sha}")
    if OUTPUT_CSS.is_file():
        cur = OUTPUT_CSS.read_bytes().decode("utf-8", errors="replace")
        cur_body = cur.replace("\r\n", "\n").split("\n\n", 1)[-1].strip()
        print(f"现有正文：{len(cur_body)} 字符")
        print("与现有正文一致：" + ("是" if cur_body == css_body.strip() else "否"))


if __name__ == "__main__":
    raise SystemExit(main())