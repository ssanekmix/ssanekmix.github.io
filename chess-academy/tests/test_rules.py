import chess
import pytest
from academy import db
from academy.main import Position,board_of

@pytest.mark.parametrize('fen',['garbage','8/8/8/8/8/8/8/8 w - - 0 1','8/8/8/8/8/8/4k3/4K3 w - - 0 1'])
def test_invalid_fen(client,fen):
    r=client.post('/api/position',json={'fen':fen});assert r.status_code==400

def test_legal_moves_and_illegal(client):
    p=client.post('/api/position',json={}).json();assert len(p['legal'])==20
    assert client.post('/api/move',json={'uci':'e2e5'}).status_code==400
    r=client.post('/api/move',json={'uci':'e2e4'}).json()
    assert r['position']['turn']=='black'
    assert any('d5 и f5' in f for f in r['explanation']['facts'])

def test_castling(client):
    fen='r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
    r=client.post('/api/move',json={'fen':fen,'uci':'e1g1'}).json()['position']
    assert r['pieces']['f1']=='R' and r['pieces']['g1']=='K'

def test_castling_through_check(client):
    fen='r3kr1r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
    assert client.post('/api/move',json={'fen':fen,'uci':'e1g1'}).status_code==400

def test_en_passant(client):
    r=client.post('/api/move',json={'moves':['e2e4','a7a6','e4e5','d7d5'],'uci':'e5d6'}).json()['position']
    assert 'd5' not in r['pieces'] and r['pieces']['d6']=='P'

def test_underpromotion(client):
    r=client.post('/api/move',json={'fen':'7k/P7/8/8/8/8/8/4K3 w - - 0 1','uci':'a7a8n'}).json()['position']
    assert r['pieces']['a8']=='N' and r['terminal']=='INSUFFICIENT_MATERIAL'

def test_mate_stalemate(client):
    mate=client.post('/api/position',json={'fen':'7k/6Q1/5K2/8/8/8/8/8 b - - 0 1'}).json()
    stale=client.post('/api/position',json={'fen':'7k/5Q2/5K2/8/8/8/8/8 b - - 0 1'}).json()
    assert mate['terminal']=='CHECKMATE' and mate['result']=='1-0'
    assert stale['terminal']=='STALEMATE' and stale['result']=='1/2-1/2'

def test_repetition_history(client):
    moves=['g1f3','g8f6','f3g1','f6g8']*2
    assert client.post('/api/position',json={'moves':moves}).json()['terminal']=='THREEFOLD_REPETITION'

def test_fifty_move(client):
    r=client.post('/api/position',json={'fen':'7k/8/8/8/8/8/8/R3K3 w - - 100 70'}).json()
    assert r['terminal']=='FIFTY_MOVES'

def test_transpositions_and_relevant_ep():
    a=board_of(Position(moves=['g1f3','g8f6','d2d4','d7d5']))
    b=board_of(Position(moves=['d2d4','d7d5','g1f3','g8f6']))
    assert db.key(a)==db.key(b)
    c=chess.Board();c.push_uci('e2e4');assert db.key(c).endswith(' -')
    a=board_of(Position(moves=['e2e4','a7a6','e4e5','d7d5']));assert db.key(a).endswith(' d6')
    b=chess.Board(a.fen());b.ep_square=None;assert db.key(a)!=db.key(b)
    b=chess.Board();b.castling_rights=0;assert db.key(b)!=db.key(chess.Board())
