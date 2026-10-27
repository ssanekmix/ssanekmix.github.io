import json
import time
import chess
import httpx
import pytest
from academy import sources,db
from test_storage import PGN

class FakeClient:
    response=httpx.Response(200,json={'moves':[{'uci':'e2e4','white':3,'draws':1,'black':2},{'uci':'e2e5'}]},request=httpx.Request('GET','https://explorer.lichess.org'))
    calls=0
    def __init__(self,*a,**kw): pass
    def __enter__(self): return self
    def __exit__(self,*a): pass
    def get(self,*a,**kw):
        FakeClient.calls+=1
        if isinstance(self.response,Exception): raise self.response
        return self.response

def test_explorer_real_format_cache_and_legal_filter(client,monkeypatch):
    monkeypatch.setattr(sources.httpx,'Client',FakeClient);FakeClient.calls=0
    r=sources.explorer(chess.Board(),'masters');assert len(r['data']['moves'])==1
    assert sources.explorer(chess.Board(),'masters')['cached'] and FakeClient.calls==1

def test_offline_stale_cache(client,monkeypatch):
    url='https://explorer.lichess.org/masters'
    monkeypatch.setattr(sources.httpx,'Client',FakeClient)
    old=FakeClient.response
    sources.fetch(url)
    with db.connect() as c: c.execute('UPDATE cache SET at=0')
    FakeClient.response=httpx.ConnectError('Offline')
    try:
        assert sources.fetch(url)['stale']
        with pytest.raises(ValueError,match='недоступен'): sources.fetch(url+'/other')
    finally: FakeClient.response=old

def test_rate_limit_backoff(client,monkeypatch):
    monkeypatch.setattr(sources.httpx,'Client',FakeClient);old=FakeClient.response
    monkeypatch.setattr(sources,'_blocked_until',0)
    FakeClient.response=httpx.Response(429,headers={'Retry-After':'60'},request=httpx.Request('GET','https://explorer.lichess.org'))
    try:
        with pytest.raises(ValueError,match='429'): sources.fetch('https://explorer.lichess.org/rate')
        assert sources._blocked_until>time.time()+50
    finally: FakeClient.response=old

def test_chesscom_import_completed_only(client,monkeypatch):
    monkeypatch.setattr(sources,'fetch',lambda *a,**k:{'data':{'games':[{'rules':'chess','end_time':time.time()-10,'pgn':PGN},{'rules':'chess','pgn':PGN},{'rules':'chess960','end_time':1,'pgn':PGN}]},'stale':False})
    r=client.post('/api/chesscom/Sanekmix/2026/1').json();assert len(r['ids'])==1 and r['skipped']==2

def test_chesscom_username_injection(client):
    assert client.get('/api/chesscom/evil.example%3Fx/archives').status_code==400
