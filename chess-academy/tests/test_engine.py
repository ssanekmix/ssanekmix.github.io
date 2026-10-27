import time
import threading
import chess
import pytest
from academy import engine,db
from test_storage import PGN

def finish(client,jid):
    deadline=time.monotonic()+25
    while time.monotonic()<deadline:
        j=client.get('/api/jobs/'+jid).json()
        if j['status'] in ('done','failed','cancelled'): return j
        time.sleep(.04)
    pytest.fail('analysis timed out')

def run(client,path,data):
    response=client.post(path,json=data);assert response.status_code==200,response.text
    job=finish(client,response.json()['job_id']);assert job['status']=='done',job
    return job['result']

def test_real_multipv_cache(client):
    with engine.Session() as sf:
        a=sf.analyze(chess.Board(),.1,12,3)
        assert len(a['lines'])==3
        for line in a['lines']:
            assert line['depth']>0
            b=chess.Board()
            for m in line['pv']: b.push_uci(m)
        assert sf.analyze(chess.Board(),.1,12,3)==a

def test_compare_blunder_and_refutation(client):
    r=run(client,'/api/analyze',{'moves':['f2f3','e7e5'],'uci':'g2g4','seconds':.1,'depth':12})
    assert r['verdict']['label']=='Грубый зевок'
    assert r['after']['lines'][0]['pv'][0]=='d8h4'

def test_mate_terminal_and_draw(client):
    with engine.Session() as sf:
        for fen,result in [('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1','1-0'),('7k/5Q2/5K2/8/8/8/8/8 b - - 0 1','1/2-1/2'),('7k/8/8/8/8/8/8/4K3 w - - 0 1','1/2-1/2')]:
            assert sf.analyze(chess.Board(fen))['result']==result

def test_seed_exercise_solutions_engine_verified(client):
    with engine.Session() as sf:
        for e in db.rows('SELECT * FROM exercises'):
            b=chess.Board(e['fen']);a=sf.analyze(b,.15,16,3);b.push_uci(e['solution']);after=sf.analyze(b,.15,16,3)
            assert engine.classify(a,after,not b.turn)['accepted'],e

def test_equivalent_training_accepted_and_scheduled(client):
    e=client.get('/api/exercises').json()[0]
    r=run(client,'/api/train',{'fen':e['fen'],'uci':e['solution'],'exercise_id':e['id'],'seconds':.1,'depth':14})
    assert r['accepted'] and r['schedule']['interval_days']==1
    assert client.get('/api/progress').json()['attempts']==1

def test_full_game_analysis_exercises_restart(client):
    gid=client.post('/api/games/import',json={'text':PGN}).json()['ids'][0]
    result=run(client,f'/api/games/{gid}/analyze',{'seconds':.1,'depth':12})
    assert result['plies']==4 and result['exercise_candidates']>=1
    g=client.get(f'/api/games/{gid}').json();assert len(g['analyses'])==4 and g['analyzed']==1
    db.init();assert any(e['game_id']==gid for e in client.get('/api/exercises').json())

def test_cancel_no_partial_game_write(client):
    gid=client.post('/api/games/import',json={'text':PGN}).json()['ids'][0]
    jid=client.post(f'/api/games/{gid}/analyze',json={'seconds':1,'depth':30}).json()['job_id']
    client.post('/api/jobs/'+jid+'/cancel')
    j=finish(client,jid);assert j['status']=='cancelled'
    assert client.get(f'/api/games/{gid}').json()['analyses']==[]

def test_missing_engine_rules_available(client,monkeypatch):
    monkeypatch.setenv('STOCKFISH_PATH','/definitely/missing')
    assert client.post('/api/analyze',json={}).status_code==400
    assert client.post('/api/move',json={'uci':'e2e4'}).status_code==200
    assert client.post('/api/games/import',json={'text':PGN}).status_code==200

def result(cp,expectation,mate=None): return {'lines':[{'cp':cp,'expectation':expectation,'mate':mate}]}

def test_classification_uses_context_not_only_cp():
    assert engine.classify(result(1200,1),result(700,1),True)['label']=='Игровая альтернатива'
    assert engine.classify(result(0,.5),result(-250,.1),True)['label']=='Грубый зевок'
    assert engine.classify(result(0,.5),result(250,.9),False)['label']=='Грубый зевок'
    assert engine.classify(result(30,.53),result(20,.52),True)['accepted']

def test_personal_exercise_from_arbitrary_branch(client):
    result=run(client,'/api/exercises/create',{'moves':['e2e4','c7c5','b1c3'],'seconds':.1,'depth':12})
    assert result['id']>0
    assert any(e['source']=='Личное упражнение' for e in client.get('/api/exercises').json())

def test_random_opponent_uses_selected_tree(client):
    result=run(client,'/api/opponent',{'moves':['e2e4'],'opening_id':'caro','good':.7,'ordinary':.25})
    assert result['uci']=='c7c6'
