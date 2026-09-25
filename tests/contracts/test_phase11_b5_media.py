# -*- coding: utf-8 -*-
"""Phase 11 B5 媒体与缩略图契约回归。"""
from __future__ import annotations
import json,re
from pathlib import Path
from fastapi.testclient import TestClient
from gods_workbench.api.app import create_app
ROOT=Path(__file__).resolve().parents[2]
CATALOG=ROOT/'docs/contracts/MEDIA-INTERFACE-CATALOG.yaml'
FIX=ROOT/'docs/fixtures'
AUTH={'Authorization':'Bearer cleanroom-test','X-User-Role':'editor'}
READONLY={'Authorization':'Bearer cleanroom-test','X-User-Role':'readonly'}
def pairs(): return re.findall(r'method: (\w+), path: (\S+)',CATALOG.read_text(encoding='utf-8'))
def norm(p): return p[:-1] if p.endswith('}') and not p.endswith('{p}') else p
def path(p): return norm(p).replace('{p}','job-1')
def test_b5_contract_and_fixtures():
    ps=pairs(); assert len(ps)==14 and len({p for _,p in ps})==12
    f=json.loads((FIX/'phase11-b5-media-boundary.json').read_text()); assert f['path_count']==12 and f['method_path_count']==14
    for n in ('phase11-b5-media-boundary.json','phase11-b5-fail-closed.json','phase11-b5-async-policy.json'): assert (FIX/n).is_file()
def test_b5_auth_and_fail_closed():
    with TestClient(create_app()) as c:
      for m,p in pairs():
        real=path(p); payload={} if m in ('POST','PATCH','DELETE') else None
        r=c.request(m,real,json=payload) if payload is not None else c.request(m,real)
        assert r.status_code==401,(m,real,r.text)
        if m in ('POST','PATCH','DELETE'): assert c.request(m,real,headers=READONLY,json=payload).status_code==403
        r=c.request(m,real,headers=AUTH,json=payload) if payload is not None else c.request(m,real,headers=AUTH)
        assert r.status_code==503,(m,real,r.text); d=r.json()['detail']; assert d['code']=='MEDIA_NOT_INTEGRATED'; assert d['unavailable'] is True and d['data_status']=='not_integrated'; assert d['endpoint']==norm(p)
def test_b5_does_not_echo_or_fake_job_or_url():
    with TestClient(create_app()) as c:
      r=c.post('/api/online-image',headers=AUTH,json={'prompt':'secret','url':'https://example.invalid/x','path':'C:/secret'}); assert r.status_code==503; d=r.json()['detail']; assert 'secret' not in json.dumps(d,ensure_ascii=False); assert 'job_id' not in d and 'poll_hint' not in d
