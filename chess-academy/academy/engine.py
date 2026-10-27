"""One bounded background queue, cancellable UCI analysis, truthful local caching."""
import hashlib
import json
import os
import shutil
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import chess
import chess.engine
from . import db

class Cancelled(Exception): pass

class EngineMissing(ValueError): pass

def engine_path():
    supplied=os.environ.get('STOCKFISH_PATH')
    if supplied:
        if Path(supplied).is_file(): return supplied
        raise EngineMissing('STOCKFISH_PATH указывает на отсутствующий файл')
    for pattern in ('stockfish*','stockfish/stockfish*'):
        for p in sorted((db.ROOT/'tools').glob(pattern)):
            if p.is_file() and (p.suffix=='.exe' or os.access(p,os.X_OK)):
                return str(p)
    p=shutil.which('stockfish')
    if p: return p
    raise EngineMissing('Stockfish не найден. Запустите python setup_local.py или задайте STOCKFISH_PATH. Правила, уроки и импорт PGN доступны без движка.')

def check_cancel(event):
    if event and event.is_set(): raise Cancelled()

class Session:
    def __enter__(self):
        self.engine=chess.engine.SimpleEngine.popen_uci(engine_path(),timeout=15)
        self.engine.configure({'Threads':1,'Hash':64})
        return self
    def __exit__(self,*args): self.engine.quit()
    def analyze(self,b,seconds=.3,depth=18,multipv=3,event=None,root_moves=None):
        check_cancel(event)
        if b.is_game_over(claim_draw=True):
            outcome=b.outcome(claim_draw=True)
            cp=0 if outcome.winner is None else (100000 if outcome.winner else -100000)
            return {'terminal':outcome.termination.name,'result':outcome.result(),'lines':[{'cp':cp,'mate':0 if b.is_checkmate() else None,'expectation':.5 if outcome.winner is None else float(outcome.winner),'pv':[],'san':[],'depth':0}],'engine':self.engine.id.get('name','Stockfish')}
        # Full counters AND reversible history prevent incorrectly reusing a draw result.
        raw=json.dumps([self.engine.id,b.fen(),[m.uci() for m in b.move_stack],seconds,depth,multipv,[m.uci() for m in root_moves] if root_moves else None])
        cachekey='engine:'+hashlib.sha256(raw.encode()).hexdigest()
        cached=db.rows('SELECT value FROM cache WHERE key=?',(cachekey,))
        if cached: return json.loads(cached[0]['value'])
        kwargs={'multipv':min(multipv,b.legal_moves.count()),'info':chess.engine.INFO_ALL}
        if root_moves: kwargs['root_moves']=root_moves
        infos=self.engine.analyse(b,chess.engine.Limit(time=seconds,depth=depth),**kwargs)
        check_cancel(event)
        result={'engine':self.engine.id.get('name','Stockfish'),'terminal':None,'lines':[],'seconds':seconds,'requested_depth':depth,'warning':'Ограниченный расчёт; оценка и классификация могут измениться при углублении.'}
        for info in infos:
            score=info['score'].white()
            pv=info.get('pv',[]); tmp=b.copy(); sans=[]; ucis=[]
            for m in pv:
                if m not in tmp.legal_moves: break
                sans.append(tmp.san(m));ucis.append(m.uci());tmp.push(m)
            result['lines'].append({'cp':score.score(mate_score=100000),'mate':score.mate(),'expectation':score.wdl(model='sf',ply=b.ply()).expectation(),'pv':ucis,'san':sans,'depth':info.get('depth',0),'nodes':info.get('nodes',0)})
        with db.connect() as c:
            c.execute('INSERT OR REPLACE INTO cache VALUES(?,?,?)',(cachekey,json.dumps(result),time.time()))
        return result

def classify(before,after,color):
    """Expected-score loss, reinforced by centipawns and terminal mate context.

    White POV in storage; loss measured from mover POV. Not an accuracy score.
    Saturated winning/losing WDL is deliberately not a centipawn-only blunder.
    """
    a=before['lines'][0]; b=after['lines'][0]
    loss=max(0,(a['expectation']-b['expectation'])*(1 if color else -1))
    cp_loss=max(0,(a['cp']-b['cp'])*(1 if color else -1))
    won_after=after.get('terminal')=='CHECKMATE' and b['expectation']==float(color)
    missed_mate=not won_after and a['mate'] is not None and a['mate']!=0 and (a['mate']>0)==color and not (b['mate'] is not None and b['mate']!=0 and (b['mate']>0)==color)
    if loss>=.30 and cp_loss>=120: label='Грубый зевок'
    elif loss>=.15 and cp_loss>=70: label='Ошибка'
    elif loss>=.06 and cp_loss>=35 or missed_mate: label='Неточность'
    elif cp_loss<=35 and loss<=.025: label='Один из лучших'
    else: label='Игровая альтернатива'
    return {'label':label,'expected_loss':round(loss,4),'cp_loss':round(cp_loss),'accepted':loss<=.025 and cp_loss<=50,'missed_mate':missed_mate,'provisional':True}

def assess_move(sf,b,move,seconds=.35,depth=18,multipv=3,event=None,opening_id=None):
    """Recheck borderline decisions at one root; accept playable book alternatives.

    Mirrors browser policy. A named line never overrides a concrete mate or a
    large expected-result loss. The returned evaluation remains provisional.
    """
    before=sf.analyze(b,seconds,depth,multipv,event)
    following=b.copy();following.push(move)
    after=sf.analyze(following,seconds,depth,multipv,event)
    verdict=classify(before,after,b.turn);verification=None
    if not verdict['accepted'] and verdict['expected_loss']<.30 and verdict['cp_loss']<200 and after['lines'][0]['mate'] is None and not after.get('terminal'):
        forced=sf.analyze(b,max(.6,seconds),max(18,depth),1,event,root_moves=[move])
        verdict=classify(before,forced,b.turn)
        verification={'kind':'same-root','depth':forced['lines'][0]['depth'],'score':forced['lines'][0]['cp']}
    prepared=False
    if opening_id:
        with db.connect() as c:
            pid=db.position(c,b)
            prepared=c.execute('SELECT 1 FROM moves m JOIN variation_moves vm ON vm.move_id=m.id JOIN variations v ON v.id=vm.variation_id WHERE m.position_id=? AND m.uci=? AND v.opening_id=? LIMIT 1',(pid,move.uci(),opening_id)).fetchone() is not None
    if not verdict['accepted'] and after['lines'][0]['mate'] is None and not after.get('terminal') and ((verdict['expected_loss']<=.06 and verdict['cp_loss']<=80) or (prepared and verdict['expected_loss']<=.12 and verdict['cp_loss']<=120)):
        verdict={**verdict,'accepted':True,'label':'Теоретическая альтернатива' if prepared else 'Игровая альтернатива','acceptance_note':'Практически допустимый ход: небольшой разницы ограниченного расчёта недостаточно для отказа. Сравните более точное продолжение.'}
    return before,after,verdict,verification

class Queue:
    def __init__(self):
        self.pool=ThreadPoolExecutor(max_workers=1,thread_name_prefix='uci')
        self.jobs={};self.lock=threading.Lock()
    def submit(self,fn):
        with self.lock:
            if sum(j['status'] in ('queued','running') for j in self.jobs.values())>=12:
                raise ValueError('Очередь заполнена. Дождитесь расчёта или остановите задачу.')
            # Retain last 100 finished jobs; never discard active tasks.
            finished=[k for k,j in self.jobs.items() if j['status'] not in ('queued','running')]
            for k in finished[:-99]: self.jobs.pop(k,None)
            jid=uuid.uuid4().hex
            job={'id':jid,'status':'queued','progress':0,'event':threading.Event()}
            self.jobs[jid]=job
        def run():
            try:
                check_cancel(job['event']);job['status']='running'
                result=fn(job)
                check_cancel(job['event']); job.update(status='done',result=result,progress=1)
            except Cancelled: job['status']='cancelled'
            except Exception as e:
                import logging
                logging.getLogger('academy').exception('Background job failed')
                job.update(status='failed',error=str(e))
        self.pool.submit(run)
        return jid
    def get(self,jid):
        j=self.jobs.get(jid)
        if not j: raise ValueError('Задача не найдена; после перезапуска запустите анализ снова')
        return {k:v for k,v in j.items() if k!='event'}
    def cancel(self,jid):
        if jid not in self.jobs: raise ValueError('Задача не найдена')
        self.jobs[jid]['event'].set()
    def close(self):
        for job in self.jobs.values(): job['event'].set()
        self.pool.shutdown(wait=True,cancel_futures=True)
