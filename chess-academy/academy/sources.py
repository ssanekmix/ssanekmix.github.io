"""Small, serialized public API requests. No live games, credentials or remote AI."""
import hashlib
import io
import json
import re
import threading
import time
import chess
import chess.pgn
import httpx
from . import db

_gate=threading.Lock()
_last=0.0
_blocked_until=0.0
USER_AGENT='PersonalChessAcademy/1.0 (local educational analysis; no live play)'

def fetch(url,params=None,ttl=86400):
    global _last,_blocked_until
    k='web:'+hashlib.sha256((url+json.dumps(params,sort_keys=True)).encode()).hexdigest()
    cached=db.rows('SELECT * FROM cache WHERE key=?',(k,))
    if cached and time.time()-cached[0]['at']<ttl:
        return {'data':json.loads(cached[0]['value']),'cached':True,'stale':False,'at':cached[0]['at']}
    try:
        with _gate:
            if time.time()<_blocked_until: raise ValueError('Сервис ограничил частоту запросов. Повторите позже.')
            time.sleep(max(0,1.05-(time.monotonic()-_last)))
            try:
                with httpx.Client(timeout=20,headers={'User-Agent':USER_AGENT},follow_redirects=True) as client:
                    r=client.get(url,params=params)
            finally: _last=time.monotonic()
            if r.status_code==429:
                try: delay=float(r.headers.get('Retry-After','60'))
                except ValueError: delay=60
                _blocked_until=time.time()+max(60,min(delay,3600))
                raise ValueError('Лимит сервиса (429). Подождите минимум минуту.')
            r.raise_for_status()
            data=r.json()
        now=time.time()
        with db.connect() as c: c.execute('INSERT OR REPLACE INTO cache VALUES(?,?,?)',(k,json.dumps(data),now))
        return {'data':data,'cached':False,'stale':False,'at':now}
    except (httpx.HTTPError,ValueError) as exc:
        if cached: return {'data':json.loads(cached[0]['value']),'cached':True,'stale':True,'at':cached[0]['at'],'warning':str(exc)}
        raise ValueError('Внешний источник недоступен. Проверьте интернет и разрешённые домены. Локальные уроки доступны. '+str(exc)) from exc

def explorer(board,pool):
    if pool not in ('masters','beginner','strong'): raise ValueError('Неизвестная выборка')
    params={'fen':board.fen(),'topGames':0,'recentGames':0,'moves':20}
    endpoint='masters' if pool=='masters' else 'lichess'
    if pool!='masters': params.update(variant='standard',speeds='rapid,classical',ratings='0,1000' if pool=='beginner' else '2000,2200,2500')
    result=fetch('https://explorer.lichess.org/'+endpoint,params)
    legal={m.uci() for m in board.legal_moves}
    result['data']['moves']=[m for m in result['data'].get('moves',[]) if m.get('uci') in legal]
    result['pool']=pool
    result['sample_note']='Частота — наблюдаемая статистика, не оценка качества. Малые выборки ненадёжны. Рейтинг Lichess не равен рейтингу Chess.com.'
    return result

def validate_movetext(text):
    # python-chess intentionally skips unrecognized text. A finished-game importer
    # must not silently accept truncated games or discarded garbage.
    cleaned=[];in_comment=False
    for line in text.splitlines():
        if not in_comment and (line.lstrip().startswith('%') or re.fullmatch(r'\s*\[\w+\s+"(?:[^"\\]|\\.)*"\]\s*',line)):
            continue
        for char in line:
            if char=='}':
                if not in_comment: raise ValueError('Лишняя закрывающая скобка комментария PGN')
                in_comment=False;cleaned.append(' ')
            elif in_comment: continue
            elif char=='{': in_comment=True
            elif char==';': break
            else: cleaned.append(char)
        cleaned.append(' ')
    if in_comment: raise ValueError('Незакрытый комментарий PGN')
    value=''.join(cleaned)
    token=re.compile(r'1/2-1/2|1-0|0-1|\*|\d+\.(?:\.\.)?|\.{1,3}|[()]|\$\d+|[!?]+|(?:O-O-O|O-O|0-0-0|0-0)[+#]?|[KQRBN]?(?:[a-h][1-8]|[a-h]|[1-8])?x?[a-h][1-8](?:=?[QRBN])?[+#]?')
    at=0;depth=0;outcomes=[]
    while at<len(value):
        if value[at].isspace(): at+=1;continue
        match=token.match(value,at)
        if not match: raise ValueError('Неизвестный текст в PGN около: '+value[at:at+24])
        word=match.group();at=match.end()
        if word=='(': depth+=1
        elif word==')':
            depth-=1
            if depth<0: raise ValueError('Неверные скобки вариантов PGN')
        elif depth==0 and word in ('1-0','0-1','1/2-1/2','*'): outcomes.append(word)
    if depth: raise ValueError('Незакрытый вариант PGN')
    return outcomes

def parse_pgn(text):
    if len(text)>2_000_000: raise ValueError('PGN превышает 2 МБ')
    markers=validate_movetext(text)
    stream=io.StringIO(text); result=[]
    while True:
        game=chess.pgn.read_game(stream)
        if game is None: break
        if len(result)>=50: raise ValueError('За один импорт разрешено не более 50 партий')
        if game.errors: raise ValueError('Повреждённый PGN: '+str(game.errors[0]))
        outcome=game.headers.get('Result','*')
        if outcome not in ('1-0','0-1','1/2-1/2'): raise ValueError('Разрешены только завершённые партии с Result 1-0, 0-1 или 1/2-1/2')
        if game.headers.get('Variant','Standard') not in ('Standard','Chess'): raise ValueError('Поддерживаются только обычные шахматы')
        try: b=game.board()
        except ValueError as e: raise ValueError('Неверная начальная позиция PGN') from e
        if not b.is_valid(): raise ValueError('Некорректная начальная позиция PGN')
        count=0
        for m in game.mainline_moves():
            if m not in b.legal_moves: raise ValueError('Нелегальный ход PGN')
            b.push(m);count+=1
            if count>1000: raise ValueError('Слишком длинная партия')
        if not count: raise ValueError('В PGN отсутствуют ходы')
        forced=b.outcome()
        if forced and forced.result()!=outcome: raise ValueError('Результат PGN противоречит конечной позиции')
        result.append(game)
    if not result: raise ValueError('PGN не содержит партий')
    if markers != [g.headers['Result'] for g in result]:
        raise ValueError('Текст PGN должен завершаться результатом, совпадающим с заголовком. Незавершённые партии не принимаются.')
    return result

def store_games(text,source='PGN',metadata=None):
    parsed=parse_pgn(text); ids=[]
    with db.connect() as c:
        for game in parsed:
            pgn=str(game)
            # Ignore volatile comments when deduplicating an identical played game.
            identity=json.dumps([dict(game.headers),[m.uci() for m in game.mainline_moves()]],sort_keys=True)
            h=hashlib.sha256(identity.encode()).hexdigest()
            c.execute('INSERT OR IGNORE INTO games(hash,pgn,white,black,result,played,source,meta) VALUES(?,?,?,?,?,?,?,?)',(h,pgn,game.headers.get('White','?'),game.headers.get('Black','?'),game.headers['Result'],game.headers.get('Date','?'),source,json.dumps(metadata or {})))
            ids.append(c.execute('SELECT id FROM games WHERE hash=?',(h,)).fetchone()[0])
    return ids

def archives(username):
    if not re.fullmatch(r'[A-Za-z0-9_-]{2,50}',username): raise ValueError('Некорректный ник Chess.com')
    return fetch('https://api.chess.com/pub/player/'+username.lower()+'/games/archives',ttl=3600)

def import_archive(username,year,month):
    if not re.fullmatch(r'[A-Za-z0-9_-]{2,50}',username) or not 2000<=year<=2100 or not 1<=month<=12: raise ValueError('Неверный ник или месяц')
    result=fetch(f'https://api.chess.com/pub/player/{username.lower()}/games/{year}/{month:02d}',ttl=3600)
    ids=[]; skipped=0
    for g in result['data'].get('games',[]):
        if g.get('rules')!='chess' or not g.get('end_time') or g['end_time']>time.time() or not g.get('pgn'):
            skipped+=1;continue
        try: ids.extend(store_games(g['pgn'],'Chess.com', {k:g.get(k) for k in ('white','black','time_class','time_control','end_time','url')}))
        except ValueError: skipped+=1
    return {'ids':ids,'skipped':skipped,'stale':result['stale']}
