import io
import json
import time
import chess
import chess.pgn
from . import db
from .coach import explain
from .engine import Session, classify, check_cancel

STAGES=[(300,'Безопасность фигур, угрозы, развитие и рокировка'),(600,'Основные дебюты, тактика и базовые окончания'),(900,'Пешечные структуры, планы и расчёт'),(1200,'Репертуар, позиционная игра и устойчивость'),(1500,'Глубокие варианты и сложные окончания'),(1800,'Самостоятельная подготовка и глубокий анализ')]

def analyze_game(gid,seconds,depth,job):
    rows=db.rows('SELECT * FROM games WHERE id=?',(gid,))
    if not rows: raise ValueError('Партия не найдена')
    game=chess.pgn.read_game(io.StringIO(rows[0]['pgn']))
    b=game.board(); nodes=list(game.mainline()); records=[];exercises=[]
    username=db.setting('username','Sanekmix').lower()
    user_color=True if rows[0]['white'].lower()==username else False if rows[0]['black'].lower()==username else None
    with Session() as engine:
        before=engine.analyze(b,seconds,depth,3,job['event'])
        for i,node in enumerate(nodes):
            check_cancel(job['event']);m=node.move;fen=b.fen();san=b.san(m);side=b.turn
            original=b.copy();b.push(m)
            after=engine.analyze(b,seconds,depth,3,job['event'])
            verdict=classify(before,after,side)
            commentary=explain(original,m,after,verdict)
            records.append((gid,i+1,fen,m.uci(),san,json.dumps(before),json.dumps(after),json.dumps(verdict),json.dumps(commentary)))
            if (user_color is None or side==user_color) and verdict['label'] in ('Грубый зевок','Ошибка','Неточность') and before['lines'][0]['pv']:
                category='Эндшпиль' if len(original.piece_map())<=10 else ('Дебют' if i<20 else 'Тактика')
                if before['lines'][0]['mate'] is not None: category='Матовая атака'
                exercises.append((original,before['lines'][0]['pv'][0],category,gid))
            before=after;job['progress']=(i+1)/len(nodes)
    check_cancel(job['event'])
    with db.connect() as c:
        c.execute('DELETE FROM analyses WHERE game_id=?',(gid,))
        c.executemany('INSERT INTO analyses VALUES(?,?,?,?,?,?,?,?,?)',records)
        for position,solution,category,gameid in exercises:
            pid=db.position(c,position)
            c.execute('INSERT OR IGNORE INTO exercises(position_id,fen,solution,category,source,game_id) VALUES(?,?,?,?,?,?)',(pid,position.fen(),solution,category,'Партия '+str(gameid),gameid))
        c.execute('UPDATE games SET analyzed=1 WHERE id=?',(gid,))
    return {'game_id':gid,'plies':len(records),'exercise_candidates':len(exercises),'summary':'Повторите позиции с наибольшей потерей ожидаемого результата. Оценки ограничены глубиной расчёта; проверьте критические моменты повторно.'}

def schedule(eid,quality,uci):
    with db.connect() as c:
        row=c.execute('SELECT * FROM exercises WHERE id=?',(eid,)).fetchone()
        if not row: raise ValueError('Упражнение не найдено')
        ease=max(1.3,row['ease']+.1-(5-quality)*(.08+(5-quality)*.02))
        reps=row['repetitions']+1 if quality>=3 else 0
        interval=(1 if reps==1 else 6 if reps==2 else row['interval']*ease) if quality>=3 else 10/1440
        now=time.time()
        c.execute('UPDATE exercises SET due=?,interval=?,ease=?,repetitions=? WHERE id=?',(now+interval*86400,interval,ease,reps,eid))
        c.execute('INSERT INTO reviews(exercise_id,at,quality,uci) VALUES(?,?,?,?)',(eid,now,quality,uci))
    return {'due':now+interval*86400,'interval_days':interval}

def progress():
    reviews=db.rows('SELECT quality,at FROM reviews ORDER BY id DESC LIMIT 100')
    attempts=db.rows('SELECT success,at,opening_id FROM attempts ORDER BY id DESC LIMIT 100')
    successes=sum(x['quality']>=3 for x in reviews)+sum(x['success'] for x in attempts)
    count=len(reviews)+len(attempts);rate=successes/count if count else None
    rating=db.setting('rating',355)
    # A rating can suggest material, but demonstrated mastery gates progression.
    demonstrated=min(5,int(successes/25)) if rate is not None and rate>=.75 else 0
    rating_stage=max(i for i,(r,_) in enumerate(STAGES) if r<=max(300,rating))
    stage=min(rating_stage,demonstrated)
    mistakes=db.rows("SELECT category,COUNT(*) count FROM exercises WHERE source LIKE 'Партия %' GROUP BY category ORDER BY count DESC")
    weakest=mistakes[0]['category'] if mistakes else 'Безопасность фигур'
    results=db.rows('SELECT verdict FROM analyses')
    blunders=sum(json.loads(x['verdict'])['label']=='Грубый зевок' for x in results)
    ratings=[];opening_stats={};clock_samples=[]
    for g in db.rows('SELECT * FROM games'):
        meta=json.loads(g['meta']);username=db.setting('username','Sanekmix').lower()
        side='white' if g['white'].lower()==username else 'black' if g['black'].lower()==username else None
        if side and meta.get(side,{}).get('rating'):
            ratings.append({'date':meta.get('end_time'),'rating':meta[side]['rating'],'control':meta.get('time_class'),'side':side})
        if side:
            pg=chess.pgn.read_game(io.StringIO(g['pgn']));b=pg.board();found=None
            for node in pg.mainline():
                b.push(node.move)
                hit=db.rows('SELECT DISTINCT o.id,o.name FROM openings o JOIN variations v ON v.opening_id=o.id JOIN variation_moves vm ON vm.variation_id=v.id JOIN moves m ON vm.move_id=m.id JOIN positions p ON m.target_id=p.id WHERE p.key=?',(db.key(b),))
                if len(hit)==1: found=hit[0]
            if found:
                k=found['name']+' · '+side
                stat=opening_stats.setdefault(k,{'games':0,'wins':0,'draws':0})
                stat['games']+=1;stat['wins']+=g['result']==('1-0' if side=='white' else '0-1');stat['draws']+=g['result']=='1/2-1/2'
            nodes=list(pg.mainline())
            clocks=[n.clock() for i,n in enumerate(nodes) if (i%2==0)==(side=='white') and n.clock() is not None]
            if clocks: clock_samples.append({'game_id':g['id'],'lowest_seconds':min(clocks)})
    due=db.rows('SELECT COUNT(*) n FROM exercises WHERE due<=?',(time.time(),))[0]['n']
    return {'rating':rating,'stage':stage,'stages':STAGES,'recommendation':STAGES[stage][1], 'weakest':weakest,'attempts':count,'success_rate':rate,'due':due,'mistakes':mistakes,'blunders':blunders,'analyzed_plies':len(results),'ratings':sorted(ratings,key=lambda x:x['date'] or 0),'opening_results':opening_stats,'clocks':clock_samples,'note':'Выборка недостаточна для устойчивых выводов.' if count<30 else 'Рекомендации основаны на последних 100 повторениях и 100 ответах; рост рейтинга не гарантирован.'}
