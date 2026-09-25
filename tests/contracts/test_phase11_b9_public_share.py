# -*- coding: utf-8 -*-
import json,re
from pathlib import Path
from fastapi.testclient import TestClient
from gods_workbench.api.app import create_app
ROOT=Path(__file__).resolve().parents[2]; C=ROOT/'docs/contracts/PUBLIC-SHARE-INTERFACE-CATALOG.yaml'; F=ROOT/'docs/fixtures'
def ps(): return [(m,p) for m,p in re.findall(r'method: (\w+), path: (\S+)',C.read_text(encoding='utf-8'))]
def norm(p): return p[:-1] if p.endswith('}') and not p.endswith('{p}') else p
def real(p): return norm(p).replace('{p}','token-x')
def test_contract():
 x=ps(); assert len(x)==4 and len({p for _,p in x})==4; assert json.loads((F/'phase11-b9-boundary.json').read_text())['path_count']==4
def test_public_share_fails_closed_without_auth_or_fake_data():
 with TestClient(create_app()) as c:
  for m,p in ps():
   r=c.request(m,real(p),json={'token':'secret','comment':'secret'})
   assert r.status_code==503; d=r.json()['detail']; assert d['code']=='PUBLIC_SHARE_NOT_INTEGRATED' and d['unavailable'] and d['data_status']=='not_integrated'; assert 'secret' not in r.text
