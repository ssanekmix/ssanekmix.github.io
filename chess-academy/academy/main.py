import io
import json
import logging
import random
import time
from contextlib import asynccontextmanager
from typing import Literal
import chess
import chess.pgn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware
from . import db, curriculum, engine, sources, learning
from .coach import explain

log=logging.getLogger('academy')
queue=engine.Queue()

@asynccontextmanager
async def lifespan(app):
    db.init();curriculum.seed()
    yield
    queue.close()

app=FastAPI(title='Личная шахматная академия',lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware,allowed_hosts=['127.0.0.1','localhost','testserver'])

@app.middleware('http')
async def local_only(request:Request,call_next):
    # No CORS. Prevent browser origins from mutating a locally bound service.
    origin=request.headers.get('origin')
    if origin and origin not in ('http://127.0.0.1:8765','http://localhost:8765','http://testserver'):
        return JSONResponse({'detail':'Разрешён только локальный интерфейс приложения'},status_code=403)
    size=request.headers.get('content-length')
    if size and int(size)>25_000_000: return JSONResponse({'detail':'Файл превышает 25 МБ'},status_code=413)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
    return response

@app.exception_handler(ValueError)
async def invalid(request,exc): return JSONResponse({'detail':str(exc)},status_code=400)

@app.exception_handler(Exception)
async def unexpected(request,exc):
    log.exception('Request failed')
    return JSONResponse({'detail':'Внутренняя ошибка. Подробности в журнале сервера.'},status_code=500)

class Position(BaseModel):
    fen:str=Field(default=chess.STARTING_FEN,max_length=150)
    moves:list[str]=Field(default_factory=list,max_length=1000)

class MoveRequest(Position):
    uci:str=Field(max_length=8)

class AnalysisRequest(Position):
    seconds:float=Field(default=.35,ge=.05,le=5)
    depth:int=Field(default=18,ge=1,le=40)
    multipv:int=Field(default=3,ge=1,le=8)
    uci:str|None=None

class Train(AnalysisRequest):
    opening_id:str|None=None
    exercise_id:int|None=None
    mode:str='Обучение'
    hint:bool=False
    answer:str=Field(default='',max_length=2000)

class Note(Position):
    text:str=Field(default='',max_length=20000)

class PGN(BaseModel):
    text:str=Field(max_length=2_000_000)

class GameAnalysis(BaseModel):
    seconds:float=Field(default=.15,ge=.05,le=3)
    depth:int=Field(default=16,ge=1,le=30)

class Preferences(BaseModel):
    rating:int=Field(default=355,ge=100,le=4000)
    username:str=Field(default='Sanekmix',pattern=r'^[A-Za-z0-9_-]{2,50}$')

class Opponent(Position):
    opening_id:str|None=None
    good:float=Field(default=.7,ge=0,le=1)
    ordinary:float=Field(default=.25,ge=0,le=1)


def board_of(data):
    try: b=chess.Board(data.fen)
    except ValueError as exc: raise ValueError('Некорректный FEN') from exc
    if not b.is_valid(): raise ValueError('Невозможная шахматная позиция FEN')
    for uci in data.moves:
        try: b.push_uci(uci)
        except ValueError as exc: raise ValueError('Нелегальный ход в истории: '+uci) from exc
    return b

def snapshot(b):
    outcomes=b.outcome(claim_draw=True)
    return {'fen':b.fen(),'key':db.key(b),'turn':'white' if b.turn else 'black','check':b.is_check(),'terminal':outcomes.termination.name if outcomes else None,'result':outcomes.result() if outcomes else None,'legal':[{'uci':m.uci(),'san':b.san(m)} for m in b.legal_moves],'pieces':{chess.square_name(s):p.symbol() for s,p in b.piece_map().items()},'attacks':{chess.square_name(s):[chess.square_name(t) for t in b.attacks(s)] for s in b.piece_map()}}

@app.get('/api/health')
def health():
    try: p=engine.engine_path();available=True
    except ValueError: p=None;available=False
    return {'ok':True,'engine':available,'engine_path':p,'database':str(db.DB)}

@app.post('/api/position')
def position(data:Position):
    b=board_of(data);result=snapshot(b)
    with db.connect() as c:
        pid=db.position(c,b)
        branches=c.execute('SELECT DISTINCT m.uci,o.id opening_id,o.name,v.name variation FROM moves m JOIN variation_moves vm ON vm.move_id=m.id JOIN variations v ON v.id=vm.variation_id JOIN openings o ON o.id=v.opening_id WHERE m.position_id=? LIMIT 80',(pid,)).fetchall()
        note=c.execute('SELECT text FROM notes WHERE position_id=?',(pid,)).fetchone()
    result['branches']=[dict(x) for x in branches];result['note']=note[0] if note else ''
    return result

@app.post('/api/move')
def move(data:MoveRequest):
    b=board_of(data)
    try: m=b.parse_uci(data.uci)
    except ValueError as exc: raise ValueError('Этот ход нелегален') from exc
    commentary=explain(b,m);san=b.san(m);b.push(m)
    return {'position':snapshot(b),'explanation':commentary,'san':san}

@app.post('/api/analyze')
def analyze(data:AnalysisRequest):
    b=board_of(data)
    if data.uci: b.parse_uci(data.uci)
    engine.engine_path()
    def work(job):
        with engine.Session() as sf:
            if not data.uci: return sf.analyze(b,data.seconds,data.depth,data.multipv,job['event'])
            m=b.parse_uci(data.uci)
            before,after,verdict,verification=engine.assess_move(sf,b,m,data.seconds,data.depth,data.multipv,job['event'])
            return {'before':before,'after':after,'verdict':verdict,'verification':verification,'explanation':explain(b,m,after,verdict)}
    return {'job_id':queue.submit(work)}

@app.get('/api/jobs/{jid}')
def job(jid:str): return queue.get(jid)

@app.post('/api/jobs/{jid}/cancel')
def cancel(jid:str): queue.cancel(jid);return {'ok':True}

@app.get('/api/openings')
def openings(q:str='',color:str='',family:str=''):
    data=db.rows("SELECT * FROM openings WHERE id NOT LIKE 'eco-%' ORDER BY difficulty,name")
    attempts=db.rows('SELECT opening_id,SUM(success) success,COUNT(*) total FROM attempts GROUP BY opening_id')
    stats={r['opening_id']:r for r in attempts}
    return [dict(r,progress=stats.get(r['id'])) for r in data if q.lower() in (r['name']+' '+r['eco']+' '+r['plan']).lower() and (not color or r['color']==color) and (not family or r['family']==family)]

@app.get('/api/openings/{oid}')
def opening(oid:str):
    rows=db.rows('SELECT * FROM openings WHERE id=?',(oid,))
    if not rows: raise ValueError('Дебют не найден')
    return dict(rows[0],variations=db.rows('SELECT * FROM variations WHERE opening_id=?',(oid,)))

@app.post('/api/explorer/{pool}')
def explorer(pool:Literal['masters','beginner','strong'],data:Position): return sources.explorer(board_of(data),pool)

@app.get('/api/eco')
def eco(q:str=''):
    # Full open database is small and stored locally; branches loaded only on selection.
    return db.rows("SELECT * FROM openings WHERE id LIKE 'eco-%' AND (name LIKE ? OR eco LIKE ?) LIMIT 100",('%'+q+'%','%'+q+'%'))

@app.post('/api/notes')
def note(data:Note):
    b=board_of(data)
    with db.connect() as c:
        pid=db.position(c,b)
        c.execute('INSERT OR REPLACE INTO notes VALUES(?,?,1)',(pid,data.text))
    return {'ok':True}

@app.get('/api/notes')
def saved(): return db.rows('SELECT n.*,p.fen FROM notes n JOIN positions p ON p.id=n.position_id ORDER BY n.position_id DESC')

@app.post('/api/train')
def train(data:Train):
    b=board_of(data)
    if not data.uci: raise ValueError('Сделайте ход на доске')
    m=b.parse_uci(data.uci)
    exercise=None
    if data.exercise_id:
        rows=db.rows('SELECT * FROM exercises WHERE id=?',(data.exercise_id,))
        if not rows: raise ValueError('Упражнение не найдено')
        exercise=rows[0]
        if db.key(b)!=db.key(chess.Board(exercise['fen'])): raise ValueError('Позиция не соответствует упражнению')
    engine.engine_path()
    def work(job):
        with engine.Session() as sf:
            before,after,verdict,verification=engine.assess_move(sf,b,m,data.seconds,data.depth,3,job['event'],data.opening_id)
        # Exact stored solution or any engine-equivalent alternative is accepted.
        exact=bool(exercise and exercise['solution']==m.uci())
        accepted=exact or verdict['accepted']
        with db.connect() as c:
            pid=db.position(c,b)
            if not exercise:
                c.execute('INSERT INTO attempts(opening_id,position_id,at,success,mode) VALUES(?,?,?,?,?)',(data.opening_id,pid,time.time(),int(accepted),data.mode))
        schedule=learning.schedule(data.exercise_id, (3 if data.hint else 5) if accepted else 1,m.uci()) if exercise else None
        return {'accepted':accepted,'verdict':verdict,'before':before,'after':after,'explanation':explain(b,m,after,verdict),'schedule':schedule,'answer_note':'Текстовое объяснение сохранено только как самооценка; автоматическая проверка смысла свободного текста не выполняется.' if data.answer else None}
    return {'job_id':queue.submit(work)}

@app.post('/api/opponent')
def opponent(data:Opponent):
    b=board_of(data)
    if data.good+data.ordinary>1: raise ValueError('Сумма вероятностей превышает 1')
    if b.is_game_over(claim_draw=True): return {'uci':None,'terminal':True}
    engine.engine_path()
    def work(job):
        with db.connect() as c:
            pid=db.position(c,b)
            candidates=c.execute('SELECT DISTINCT m.uci FROM moves m JOIN variation_moves vm ON vm.move_id=m.id JOIN variations v ON vm.variation_id=v.id WHERE m.position_id=? AND (v.opening_id=? OR ? IS NULL)',(pid,data.opening_id,data.opening_id)).fetchall()
        roots=[chess.Move.from_uci(r[0]) for r in candidates if chess.Move.from_uci(r[0]) in b.legal_moves]
        with engine.Session() as sf:
            result=sf.analyze(b,.15,14,8,job['event'],root_moves=roots or None)
        lines=result['lines'];roll=random.random()
        idx=0 if roll<data.good else min(len(lines)-1,2 if roll<data.good+data.ordinary else len(lines)-1)
        uci=lines[idx]['pv'][0]
        return {'uci':uci,'selection':'Сильный' if idx==0 else 'Альтернативный','note':'Вероятности выбирают ранг среди рассчитанных ходов; последний ход MultiPV не обязательно является ошибкой.'}
    return {'job_id':queue.submit(work)}

@app.get('/api/lessons')
def lessons(category:str=''): return db.rows('SELECT * FROM lessons WHERE category=? OR ?="" ORDER BY difficulty',(category,category))

@app.get('/api/exercises')
def exercises(due:bool=True,category:str=''):
    return db.rows('SELECT * FROM exercises WHERE (?=0 OR due<=?) AND (?="" OR category=?) ORDER BY due,id LIMIT 100',(int(due),time.time(),category,category))


@app.post('/api/exercises/create')
def create_exercise(data:AnalysisRequest):
    b=board_of(data)
    if b.is_game_over(claim_draw=True): raise ValueError('В завершённой позиции нет упражнения на лучший ход')
    engine.engine_path()
    def work(job):
        with engine.Session() as sf: result=sf.analyze(b,data.seconds,data.depth,3,job['event'])
        solution=result['lines'][0]['pv'][0]
        with db.connect() as c:
            pid=db.position(c,b)
            c.execute('INSERT OR IGNORE INTO exercises(position_id,fen,solution,category,source) VALUES(?,?,?,?,?)',(pid,b.fen(),solution,'Своя позиция','Личное упражнение'))
            eid=c.execute('SELECT id FROM exercises WHERE position_id=? AND solution=? AND source=?',(pid,solution,'Личное упражнение')).fetchone()[0]
        return {'id':eid,'warning':result.get('warning')}
    return {'job_id':queue.submit(work)}

class Repertoire(BaseModel):
    name:str=Field(min_length=2,max_length=160)
    pgn:str=Field(max_length=100000)
    color:Literal['white','black']='white'
    eco:str=Field(default='',max_length=3)

@app.post('/api/repertoire')
def repertoire(data:Repertoire):
    import hashlib
    game=chess.pgn.read_game(io.StringIO(data.pgn))
    if not game or game.errors: raise ValueError('Повреждённый PGN варианта')
    b=game.board()
    if b.fen()!=chess.STARTING_FEN: raise ValueError('Вариант каталога должен начинаться с начальной позиции. Произвольный FEN открывайте на доске.')
    moves=list(game.mainline_moves())
    if not moves or len(moves)>300: raise ValueError('Нужно от 1 до 300 полуходов')
    sans=[]
    for m in moves:
        if m not in b.legal_moves: raise ValueError('Нелегальный ход варианта')
        sans.append(b.san(m));b.push(m)
    oid='personal-'+hashlib.sha256((data.name+data.color).encode()).hexdigest()[:16]
    title='Ветка '+hashlib.sha256(' '.join(sans).encode()).hexdigest()[:8]
    with db.connect() as c:
        c.execute('INSERT OR IGNORE INTO openings VALUES(?,?,?,?,?,?,?)',(oid,data.name,data.eco,data.color,2,'Личный репертуар','Личная последовательность. Качество ходов проверяйте локальным движком.'))
        c.execute('INSERT OR IGNORE INTO variations(opening_id,name,pgn) VALUES(?,?,?)',(oid,title,' '.join(sans)))
        vid=c.execute('SELECT id FROM variations WHERE opening_id=? AND name=?',(oid,title)).fetchone()[0]
        b=game.board()
        for ply,m in enumerate(moves):
            pid=db.position(c,b);uci=m.uci();b.push(m);target=db.position(c,b)
            c.execute('INSERT OR IGNORE INTO moves(position_id,uci,target_id) VALUES(?,?,?)',(pid,uci,target))
            mid=c.execute('SELECT id FROM moves WHERE position_id=? AND uci=?',(pid,uci)).fetchone()[0]
            c.execute('INSERT OR IGNORE INTO variation_moves VALUES(?,?,?)',(vid,ply,mid))
    return {'id':oid,'variation_id':vid}

@app.get('/api/progress')
def progress(): return learning.progress()

@app.post('/api/preferences')
def preferences(data:Preferences):
    with db.connect() as c:
        for k,v in data.model_dump().items(): c.execute('INSERT OR REPLACE INTO settings VALUES(?,?)',(k,json.dumps(v)))
    return {'ok':True}

@app.get('/api/preferences')
def get_preferences(): return {'rating':db.setting('rating',355),'username':db.setting('username','Sanekmix')}

@app.post('/api/games/import')
def import_pgn(data:PGN): return {'ids':sources.store_games(data.text)}

@app.get('/api/chesscom/{username}/archives')
def archives(username:str): return sources.archives(username)

@app.post('/api/chesscom/{username}/{year}/{month}')
def chesscom(username:str,year:int,month:int): return sources.import_archive(username,year,month)

@app.get('/api/games')
def games(): return db.rows('SELECT id,white,black,result,played,source,analyzed FROM games ORDER BY id DESC')

@app.get('/api/games/{gid}')
def game(gid:int):
    rows=db.rows('SELECT * FROM games WHERE id=?',(gid,))
    if not rows: raise ValueError('Партия не найдена')
    result=rows[0];pg=chess.pgn.read_game(io.StringIO(result['pgn']));b=pg.board();start=b.fen();moves=[]
    for node in pg.mainline():
        moves.append({'uci':node.move.uci(),'san':b.san(node.move),'clock':node.clock()});b.push(node.move)
    result.update(initial_fen=start,moves=moves,analyses=db.rows('SELECT * FROM analyses WHERE game_id=? ORDER BY ply',(gid,)))
    return result

@app.post('/api/games/{gid}/analyze')
def game_analysis(gid:int,data:GameAnalysis):
    if not db.rows('SELECT id FROM games WHERE id=?',(gid,)): raise ValueError('Партия не найдена')
    engine.engine_path()
    return {'job_id':queue.submit(lambda j:learning.analyze_game(gid,data.seconds,data.depth,j))}

@app.get('/api/export')
def export(): return JSONResponse(db.export_data(),headers={'Content-Disposition':'attachment; filename="academy-backup.json"'})

@app.post('/api/restore')
def restore(payload:dict):
    if any(j['status'] in ('queued','running') for j in queue.jobs.values()): raise ValueError('Остановите анализ и дождитесь завершения задач перед восстановлением')
    # Save a consistent SQLite backup before replacing user data.
    import sqlite3
    backup=db.DATA/('before-restore-'+str(time.time_ns())+'.sqlite3')
    with db.connect() as c:
        target=sqlite3.connect(backup)
        try: c.backup(target)
        finally: target.close()
    try:
        db.import_data(payload)
    except (sqlite3.Error,TypeError,KeyError) as exc:
        raise ValueError("Повреждённая резервная копия: "+str(exc)) from exc
    return {'ok':True,'backup':backup.name}

@app.get('/')
def index(): return FileResponse(db.ROOT/'academy/static/index.html')
app.mount('/static',StaticFiles(directory=db.ROOT/'academy/static'),name='static')
