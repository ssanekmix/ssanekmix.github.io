"""Reproducible small local setup. No multi-gigabyte databases or secrets."""
import argparse
import csv
import hashlib
import io
import os
import platform
import shutil
import tarfile
import tempfile
import zipfile
from pathlib import Path
import chess
import chess.engine
import chess.pgn
import httpx
from academy import db,curriculum

RELEASE='https://github.com/official-stockfish/Stockfish/releases/download/sf_17.1/'
ARTIFACTS={
 'Linux':('stockfish-ubuntu-x86-64-avx2.tar','09e953222dbe80aaea5c33dab265413b295cb8376418445c877708c61e31987d'),
 'Windows':('stockfish-windows-x86-64.zip','8b5c6ebd90684ea0900729d955eb9a426557b5f88fa05772404ac7bbe8e9b5cb'),
}
OPENINGS_COMMIT='f06a50d5c7c140e50b068049fa31d289e2c3d347'
BASE=f'https://raw.githubusercontent.com/lichess-org/chess-openings/{OPENINGS_COMMIT}/'

def download(url):
    print('Загрузка:',url)
    with httpx.Client(follow_redirects=True,timeout=120) as client:
        r=client.get(url);r.raise_for_status();return r.content

def setup_engine():
    from academy.engine import engine_path
    try:
        existing=engine_path()
        with chess.engine.SimpleEngine.popen_uci(existing) as sf: print('Движок:',sf.id.get('name'))
        return
    except (ValueError,OSError,chess.engine.EngineError): pass
    if platform.machine().lower() not in ('amd64','x86_64') or platform.system() not in ARTIFACTS:
        raise RuntimeError('Для этой платформы установите официальный Stockfish и задайте STOCKFISH_PATH.')
    if platform.system()=='Linux' and 'avx2' not in Path('/proc/cpuinfo').read_text():
        raise RuntimeError('Этому пакету Linux нужен AVX2. Установите универсальную официальную сборку и задайте STOCKFISH_PATH.')
    name,expected=ARTIFACTS[platform.system()]
    data=download(RELEASE+name)
    if hashlib.sha256(data).hexdigest()!=expected: raise RuntimeError('Контрольная сумма Stockfish не совпадает; установка остановлена.')
    dest=db.ROOT/'tools';dest.mkdir(exist_ok=True)
    # Extract only regular files to a temporary directory; prohibit traversal and links.
    with tempfile.TemporaryDirectory() as tmp:
        base=Path(tmp)
        if name.endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                for item in z.infolist():
                    path=(base/item.filename).resolve()
                    if not path.is_relative_to(base): raise RuntimeError('Небезопасный архив')
                    if not item.is_dir():
                        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(z.read(item))
        else:
            with tarfile.open(fileobj=io.BytesIO(data)) as t:
                t.extractall(base,filter='data')
        folder=dest/'stockfish'
        # Never overwrite an existing user-provided engine folder.
        if folder.exists(): raise RuntimeError('В tools/stockfish уже есть файлы. Проверьте их и укажите STOCKFISH_PATH.')
        shutil.copytree(base/'stockfish',folder)
        for p in folder.glob('stockfish*'):
            if p.is_file(): p.chmod(p.stat().st_mode|0o111)
    with chess.engine.SimpleEngine.popen_uci(engine_path()) as sf: print('Установлен:',sf.id.get('name'))

def import_openings():
    target=db.DATA/'openings';target.mkdir(exist_ok=True)
    for name in ['COPYING.txt','a.tsv','b.tsv','c.tsv','d.tsv','e.tsv']:
        p=target/name
        if not p.exists():
            raw=download(BASE+name)
            temporary=p.with_suffix('.download');temporary.write_bytes(raw);temporary.replace(p)
    count=0
    with db.connect() as c:
        for name in 'abcde':
            for i,row in enumerate(csv.DictReader((target/(name+'.tsv')).read_text(encoding='utf-8').splitlines(),delimiter='\t')):
                oid=f'eco-{name}-{i}';pgn=row['pgn']
                # Parse moves with the standard parser, validate before writing.
                game=chess.pgn.read_game(io.StringIO(pgn+' *'))
                if not game or game.errors: raise ValueError('Повреждённая строка ECO')
                c.execute('INSERT OR IGNORE INTO openings VALUES(?,?,?,?,?,?,?)',(oid,row['name'],row['eco'],'white',2,'Открытая база','Название и ходовая последовательность из открытой базы Lichess (CC0). Подробный авторский урок для этой ветки не подготовлен.'))
                c.execute('INSERT OR IGNORE INTO variations(opening_id,name,pgn) VALUES(?,?,?)',(oid,'Основная последовательность',' '.join(game.board().variation_san(list(game.mainline_moves())).split())))
                # Store plain SAN tokens for the same training interface as authored courses.
                b=game.board();sans=[];moves=list(game.mainline_moves())
                for m in moves: sans.append(b.san(m));b.push(m)
                c.execute('UPDATE variations SET pgn=? WHERE opening_id=?',(' '.join(sans),oid))
                vid=c.execute('SELECT id FROM variations WHERE opening_id=?',(oid,)).fetchone()[0];b=game.board()
                for ply,m in enumerate(moves):
                    pid=db.position(c,b);uci=m.uci();b.push(m);tid=db.position(c,b)
                    c.execute('INSERT OR IGNORE INTO moves(position_id,uci,target_id) VALUES(?,?,?)',(pid,uci,tid))
                    mid=c.execute('SELECT id FROM moves WHERE position_id=? AND uci=?',(pid,uci)).fetchone()[0]
                    c.execute('INSERT OR IGNORE INTO variation_moves VALUES(?,?,?)',(vid,ply,mid))
                count+=1
    print('Открытая база ECO:',count,'названий; источник',OPENINGS_COMMIT)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--offline',action='store_true');args=parser.parse_args()
    db.init();curriculum.seed()
    if not args.offline:
        setup_engine();import_openings()
    print('Локальная база готова:',db.DB)
