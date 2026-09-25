# -*- coding: utf-8 -*-
import json,re
from pathlib import Path
from fastapi.testclient import TestClient
from gods_workbench.api.app import create_app
ROOT=Path(__file__).resolve().parents[2]; C=ROOT/'docs/contracts/PROMPT-LIBRARY-B8-ITEM-INTERFACE-CATALOG.yaml'; F=ROOT/'docs/fixtures'
A={'Authorization':'Bearer cleanroom-test','X-User-Role':'editor'}; R={'Authorization':'Bearer cleanroom-test','X-User-Role':'readonly'}
def ps(): return [(m,p) for m,p in re.findall(r'method: (\w+), path: (\S+)',C.read_text(encoding='utf-8'))]
def norm(p): return p[:-1] if p.endswith('}') and not p.endswith('{p}') else p
def real(p): return norm(p).replace('{p}','x')
def test_contract():
 x=ps(); assert len(x)==4 and len({p for _,p in x})==3; assert json.loads((F/'phase11-b8-boundary.json').read_text())['path_count']==3
def test_auth_and_fail_closed():
 with TestClient(create_app()) as c:
  for m,p in ps():
   u=real(p); payload={}
   assert c.request(m,u,json=payload).status_code==401
   assert c.request(m,u,headers=R,json=payload).status_code==403
   z=c.request(m,u,headers=A,json={'text':'secret','license':'secret'}); assert z.status_code==503; d=z.json()['detail']; assert d['code']=='PROMPT_LIBRARY_ITEMS_NOT_INTEGRATED' and d['unavailable'] and d['data_status']=='not_integrated'; assert 'secret' not in z.text
