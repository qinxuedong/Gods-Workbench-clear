"""隔离数据生成三类HTTP PDF，并用PyMuPDF及Chrome原生阅读器检查；产物只在仓库外。"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    output = Path(tempfile.mkdtemp(prefix="gw-phase12-pdf-verified-")).resolve()
    os.environ.update(GW_DATA_DIR=str(output / "data"), GW_VIDEO_DATA_DIR=str(output / "video"), GW_AUTH_MODE="local", GW_CLI_EXECUTION="0")
    sys.path.insert(0, str(ROOT / "src"))
    from fastapi.testclient import TestClient
    from gods_workbench.api.app import create_app
    import pymupdf
    from playwright.sync_api import sync_playwright
    auth = {"Authorization": "Bearer pdf-local-verification", "X-User-Role": "editor"}
    artifacts = {}
    with TestClient(create_app()) as client:
        created = client.post("/api/asset-registry/assets/import", headers=auth,
            json={"items": [{"name": f"第{i:03d}项中文资产（标点）", "kind": "document"} for i in range(1, 101)]})
        created.raise_for_status()
        ids = created.json()["asset_ids"]
        registry = client.post("/api/asset-registry/assets/export-pdf", headers=auth, json={"asset_ids": ids, "name": "中文清单"})
        registry.raise_for_status()
        assert registry.headers["X-PDF-Exported"] == "100"
        artifacts["registry"] = registry.content
        text = "正文首行：中文（括号）\\反斜杠。ASCII\r\n" + "\n".join(f"第{i:03d}行长文本" + "混排ABC" * 10 for i in range(1, 50)) + "\n末尾emoji😀罕见字𠀀"
        client.patch("/api/asset-content", headers=auth, params={"asset_id": ids[0]}, json={"content": text}).raise_for_status()
        content = client.get("/api/asset-content/pdf", headers=auth, params={"asset_id": ids[0]})
        content.raise_for_status()
        artifacts["content"] = content.content
        sid = client.post("/api/asset-reviews/sessions", headers=auth,
                          json={"asset_id": ids[0], "title": "中文审查"}).json()["session"]["session_id"]
        did = client.post(f"/api/asset-reviews/sessions/{sid}/delivery", headers=auth,
                          json={"title": "交付正文\n" + "\n".join(f"交付核实第{i:03d}项" for i in range(1, 50)) + "\n交付末项😀"}).json()["delivery"]["delivery_id"]
        delivery = client.post(f"/api/asset-reviews/deliveries/{did}/export", headers=auth)
        delivery.raise_for_status()
        artifacts["delivery"] = delivery.content
    report = {"status": "rendered_pending_visual_review", "directory": str(output), "documents": {}}
    for name, content in artifacts.items():
        path = output / (name + ".pdf")
        path.write_bytes(content)
        with pymupdf.open(stream=content, filetype="pdf") as doc:
            source = doc.embfile_get("source.txt")
            if name == "content":
                assert source == text.encode("utf-8")
            if name == "registry":
                assert "第100项" in source.decode()
            info = {"pages": len(doc), "sha256": hashlib.sha256(content).hexdigest(),
                    "source_sha256": hashlib.sha256(source).hexdigest(), "pymupdf_images": [], "chrome_images": []}
            for number in sorted({0, len(doc) - 1}):
                page = doc[number]
                assert page.get_text().strip()
                pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5))
                assert min(pixmap.samples) < 100
                target = output / f"{name}-pymupdf-{number + 1}.png"
                pixmap.save(target)
                info["pymupdf_images"].append(str(target))
            report["documents"][name] = info
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True,
            ignore_default_args=["--disable-extensions", "--disable-component-extensions-with-background-pages"])
        report["chrome_version"] = browser.version
        try:
            for name, info in report["documents"].items():
                for number in sorted({1, info["pages"]}):
                    page = browser.new_page(viewport={"width": 1400, "height": 1120})
                    try:
                        # 使用实际下载文件绕过本机回环HTTP异常返回204的问题；不是HTML重画PDF。
                        page.goto((output / (name + ".pdf")).as_uri() + f"#page={number}&zoom=75", wait_until="load")
                        page.wait_for_timeout(1800)
                        assert any(frame.url.startswith("chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/") for frame in page.frames)
                        target = output / f"{name}-chrome-{number}.png"
                        page.screenshot(path=str(target))
                        info["chrome_images"].append(str(target))
                    finally:
                        page.close()
        finally:
            browser.close()
    report["generator_sha256"] = hashlib.sha256((ROOT / "src/gods_workbench/core/text_pdf.py").read_bytes()).hexdigest()
    (output / "evidence.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
