import json
import sqlite3
import time
import chess
import pytest
from academy import db,curriculum,learning,sources

PGN='''[White "Sanekmix"]
[Black "Opponent"]
[Result "0-1"]

1. f3 e5 2. g4 Qh4# 0-1'''

@pytest.mark.parametrize('text',['nonsense','[Result "*"]\n\n1. e4 *','[Result "1-0"]\n\n1. e4 e5 2. Ke3 1-0','[Result "1-0"]\n\n1. f3 e5 2. g4 Qh4# 1-0'])
def test_bad_pgn(client,text):
    assert client.post('/api/games/import',json={'text':text}).status_code==400

def test_import_replay_dedup(client):
    ids=client.post('/api/games/import',json={'text':PGN}).json()['ids']
    assert ids==client.post('/api/games/import',json={'text':PGN}).json()['ids']
    g=client.get('/api/games/'+str(ids[0])).json();assert len(g['moves'])==4 and g['result']=='0-1'

def test_import_multiple_atomic(client):
    assert client.post('/api/games/import',json={'text':PGN+'\n\n[Result "*"]\n\n1. e4 *'}).status_code==400
    assert client.get('/api/games').json()==[]

def test_note_export_restore(client):
    assert client.post('/api/notes',json={'moves':['e2e4'],'text':'Проверить e5'}).status_code==200
    backup=client.get('/api/export').json()
    client.post('/api/notes',json={'moves':['e2e4'],'text':'Другое'})
    assert client.post('/api/restore',json=backup).status_code==200
    assert client.post('/api/position',json={'moves':['e2e4']}).json()['note']=='Проверить e5'
    with sqlite3.connect(db.DB) as c: assert c.execute('SELECT COUNT(*) FROM migrations').fetchone()[0]==1

def test_corrupt_restore_rollback(client):
    client.post('/api/notes',json={'text':'Останется'})
    data=client.get('/api/export').json();data['tables']['notes'][0]['position_id']=999999
    assert client.post('/api/restore',json=data).status_code==400
    assert client.get('/api/notes').json()[0]['text']=='Останется'

def test_scheduler_persistence(client):
    eid=client.get('/api/exercises').json()[0]['id']
    a=learning.schedule(eid,5,'g6g7');assert a['interval_days']==1
    b=learning.schedule(eid,5,'g6g7');assert b['interval_days']==6
    c=learning.schedule(eid,1,'g6g8');assert c['interval_days']<1
    db.init();assert len(db.rows('SELECT * FROM reviews'))==3

def test_seed_repeatable_and_all_lines_legal(client):
    before=len(db.rows('SELECT * FROM moves'));curriculum.seed();assert len(db.rows('SELECT * FROM moves'))==before
    for row in db.rows('SELECT pgn FROM variations'):
        b=chess.Board()
        for san in row['pgn'].split(): b.push_san(san)
    assert len(client.get('/api/openings').json())==16
    assert len(db.rows('SELECT * FROM variations'))==48

def test_progress_gates_rating(client):
    client.post('/api/preferences',json={'rating':2200,'username':'Sanekmix'})
    p=client.get('/api/progress').json();assert p['stage']==0 and p['success_rate'] is None

def test_origin_and_hosts(client):
    assert client.post('/api/notes',json={},headers={'Origin':'https://evil.example'}).status_code==403
    assert client.get('/api/health',headers={'Host':'evil.example'}).status_code==400

def test_custom_repertoire_branches_and_transposition(client):
    a=client.post('/api/repertoire',json={'name':'Мой дебют','pgn':'1. Nf3 Nf6 2. d4 d5 *','color':'black'}).json()
    b=client.post('/api/repertoire',json={'name':'Мой дебют','pgn':'1. d4 d5 2. Nf3 Nf6 *','color':'black'}).json()
    assert a['id']==b['id']
    course=client.get('/api/openings/'+a['id']).json()
    assert len(course['variations'])==2
    assert len(db.rows('SELECT DISTINCT m.target_id FROM moves m JOIN variation_moves vm ON vm.move_id=m.id WHERE vm.ply=3 AND vm.variation_id IN (?,?)',(a['variation_id'],b['variation_id'])))==1

@pytest.mark.parametrize('text',['[Result "1-0"]\n\n1. e4 blah e5 1-0','[Result "1-0"]\n\n1. e4 e5 *','[Result "1-0"]\n\n1. e4 e5','[Result "1-0"]\n\n1. e4 {open comment e5 1-0'])
def test_pgn_rejects_discarded_garbage_and_unfinished_markers(client,text):
    assert client.post('/api/games/import',json={'text':text}).status_code==400

def test_pgn_comments_annotations_and_variations(client):
    text='[Result "1-0"]\n\n1. e4! {center} e5 (1... c5) 2. Nf3 $1 Nc6 1-0'
    assert client.post('/api/games/import',json={'text':text}).status_code==200
