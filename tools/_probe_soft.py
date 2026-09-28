import os, sys, tempfile, json
os.environ["GW_LOCAL_AUTH_DB"] = os.path.join(tempfile.gettempdir(), "gw_probe_auth2.sqlite3")
os.environ["GW_AUTH_MODE"] = "local_account"
sys.path.insert(0, os.path.abspath("src"))
try: os.remove(os.environ["GW_LOCAL_AUTH_DB"])
except Exception: pass
from fastapi.testclient import TestClient
from gods_workbench.api.app import create_app
from gods_workbench.core import session as session_store
import gods_workbench.core.local_accounts as la
app = create_app()
la.create_first_admin("probeadmin", "Abcd1234")
_, token = la.login("probeadmin", "Abcd1234", "127.0.0.1")
H = {"origin": "http://127.0.0.1:2077", "cookie": session_store.SESSION_COOKIE_NAME + "=" + token}
c = TestClient(app, base_url="http://127.0.0.1:2077")
spec = app.openapi()["paths"]
hits = []
for path, ops in spec.items():
    if not path.startswith("/api"): continue
    for m, op in ops.items():
        M = m.upper()
        if M not in ("GET","POST","PATCH","PUT","DELETE"): continue
        try:
            if M in ("GET","DELETE","HEAD"):
                r = c.request(M, path, headers=H)
            else:
                r = c.request(M, path, headers=H, json={})
        except Exception as e:
            continue
        body = ""
        try: body = json.dumps(r.json(), ensure_ascii=False)
        except Exception: body = r.text or ""
        low = body.lower()
        if "not_integrated" in low or "not_connected" in low or "not_configured" in low:
            if r.status_code < 400:
                hits.append((M, path, r.status_code, body if "NOT_INTEGRATED" in body.upper() else body[:220]))
out = []
for M,p,code,b in hits:
    out.append({"m":M,"p":p,"code":code,"body":b[:400]})
print(json.dumps(out, ensure_ascii=False, indent=1))
