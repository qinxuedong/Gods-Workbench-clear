import os, sys, tempfile, json
base = os.path.join(tempfile.gettempdir(), "gw_a2_smoke")
os.environ["GW_DATA_DIR"] = base
os.environ["GW_AUTH_MODE"] = "local"
sys.path.insert(0, os.path.abspath("src"))
from fastapi.testclient import TestClient
from gods_workbench.api.app import create_app
c = TestClient(create_app())
H = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "editor"}
G = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "governor"}
RO = {"Authorization": "Bearer cleanroom-test", "X-User-Role": "readonly"}

def show(label, r):
    print(label, r.status_code, (r.text[:200]).replace("\n"," "))

show("import", c.post("/api/asset-registry/assets/import", headers=H, json={"items":[{"name":"角色参考.png","kind":"image"},{"name":"场景.mp4","kind":"video"}]}))
ids = c.get("/api/asset-registry/assets", headers=H).json()["assets"]
print("ids", [a["id"] for a in ids])
a1, a2 = ids[0]["id"], ids[1]["id"]
show("list", c.get("/api/asset-registry/assets?limit=10", headers=H))
show("get", c.get(f"/api/asset-registry/assets/{a1}", headers=H))
show("patch", c.patch(f"/api/asset-registry/assets/{a1}", headers=H, json={"name":"角色参考-改"}))
show("tags", c.post("/api/asset-registry/assets/tags", headers=H, json={"asset_ids":[a1],"names":["角色","主角"]}))
show("rel", c.post("/api/asset-registry/assets/relations", headers=H, json={"asset_ids":[a1,a2],"relation_type":"related"}))
show("ref", c.post("/api/asset-registry/assets/resolve-reference", headers=H, json={"asset_id":a1}))
show("ver", c.post(f"/api/asset-registry/assets/{a1}/image-versions", headers=H, json={"edit":{"crop":{"x":1,"y":2}}}))
vid = c.get(f"/api/asset-registry/assets/{a1}/image-versions", headers=H).json()["versions"][0]["version_id"]
show("ver-hidden", c.patch(f"/api/asset-registry/assets/{a1}/image-versions/{vid}", headers=H, json={"hidden":True}))
show("folder", c.post("/api/asset-registry/folders", headers=H, json={"name":"角色"}))
show("preset", c.post("/api/asset-registry/presets", headers=H, json={"name":"我的筛选","definition":{"kind":"image"}}))
show("tpl", c.post("/api/asset-registry/project-directory-templates", headers=H, json={"name":"标准","project_type":"film","directory_tree":["01_剧本","02_素材"]}))
tpls = c.get("/api/asset-registry/project-directory-templates", headers=H).json()["templates"]
tpl = tpls[0]["template_id"]
show("tpl-default", c.post(f"/api/asset-registry/project-directory-templates/{tpl}/default", headers=H, json={}))
show("tpl-arch", c.post(f"/api/asset-registry/project-directory-templates/{tpl}/archive", headers=H, json={}))
show("proj-ent", c.post("/api/asset-registry/projects/prj_0001/entities", headers=H, json={"name":"主角","entity_type":"character"}))
show("proj-link", c.post("/api/asset-registry/projects/prj_0001/assets", headers=H, json={"asset_ids":[a1]}))
show("prefs", c.patch("/api/asset-registry/preferences/team", headers=H, json={"view":"list"}))
show("feature", c.patch("/api/asset-registry/settings/features/thumbnail", headers=H, json={"enabled":False}))
show("idxauto", c.patch("/api/asset-registry/settings/index-automation", headers=H, json={"enabled":True,"interval_minutes":30}))
show("reindex-noauth", c.post("/api/asset-registry/reindex", headers=H, json={}))
show("idxsync", c.post("/api/asset-registry/index/sync", headers=H, json={}))
show("pdf", c.post("/api/asset-registry/assets/export-pdf", headers=H, json={"asset_ids":[a1]}))
show("reconcile", c.post("/api/asset-registry/governance/audit-outbox/reconcile", headers=G))
show("govop", c.post("/api/asset-registry/governance/operations", headers=G, json={"operation":"sweep"}))
show("cascade", c.get(f"/api/asset-registry/governance/cascade-preview?target_type=asset&target_id={a1}", headers=G))
show("restore-arch", c.post(f"/api/asset-registry/governance/assets/{a1}/restore", headers=G))
show("remote-bad", c.post("/api/asset-registry/remote-assets", headers=H, json={"url":"http://example.com/a.png"}))
show("job404", c.post("/api/asset-registry/workspace-jobs/job_x/cancel", headers=H, json={}))
show("readonly-write", c.post("/api/asset-registry/assets/import", headers=RO, json={"items":[{"name":"x"}]}))
show("noauth", c.get("/api/asset-registry"))
print("--- 延迟读取验证 ---")
print(c.get("/api/asset-registry/assets", headers=H).json()["total"])
print("--- 删除后读回 ---")
show("del", c.delete(f"/api/asset-registry/assets/{a2}", headers=H))
show("del-read", c.get(f"/api/asset-registry/assets/{a2}", headers=H))
show("recycle", c.get("/api/asset-registry/recycle-bin", headers=H))
