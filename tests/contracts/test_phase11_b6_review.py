# -*- coding: utf-8 -*-
import json,re
from pathlib import Path
from fastapi.testclient import TestClient
from gods_workbench.api.app import create_app
ROOT=Path(__file__).resolve().parents[2]; C=ROOT/'docs/contracts/ASSET-REVIEW-INTERFACE-CATALOG.yaml'; F=ROOT/'docs/fixtures'
A={'Authorization':'Bearer cleanroom-test','X-User-Role':'editor'}; R={'Authorization':'Bearer cleanroom-test','X-User-Role':'readonly'}
def ps(): return [(m,p) for m,p in re.findall(r'method: (\w+), path: (\S+)',C.read_text(encoding='utf-8'))]
def norm(p): return p[:-1] if p.endswith('}') and not p.endswith('{p}') else p
def real(p): return norm(p).replace('{p}','x')
def test_contract():
 x=ps(); assert len(x)==9 and len({p for _,p in x})==8; assert json.loads((F/'phase11-b6-fail-closed.json').read_text())['path_count']==8
 assert (F/'phase11-b6-boundary.json').is_file()
def test_auth_and_fail_closed():
 with TestClient(create_app()) as c:
  for m,p in ps():
   u=real(p); payload={} if m in ('POST','PATCH','PUT','DELETE') else None
   q=lambda h=None: c.request(m,u,headers=h,json=payload) if payload is not None else c.request(m,u,headers=h)
   assert q().status_code==401
   if m in ('POST','PATCH','PUT','DELETE'): assert q(R).status_code==403
   z=q(A); assert z.status_code==503; d=z.json()['detail']; assert d['code']=='ASSET_REVIEW_NOT_INTEGRATED' and d['unavailable'] and d['data_status']=='not_integrated'
