"""SQLite storage. Position identity is independent of move counters, analysis is not."""
import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
import chess

ROOT = Path(__file__).resolve().parent.parent
DATA = Path(os.environ.get('ACADEMY_DATA', ROOT / 'data'))
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / 'academy.sqlite3'

SCHEMA = '''
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS positions(id INTEGER PRIMARY KEY, key TEXT UNIQUE NOT NULL, fen TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS moves(id INTEGER PRIMARY KEY, position_id INTEGER REFERENCES positions(id), uci TEXT, target_id INTEGER REFERENCES positions(id), UNIQUE(position_id,uci));
CREATE TABLE IF NOT EXISTS openings(id TEXT PRIMARY KEY, name TEXT, eco TEXT, color TEXT, difficulty INTEGER, family TEXT, plan TEXT);
CREATE TABLE IF NOT EXISTS variations(id INTEGER PRIMARY KEY, opening_id TEXT REFERENCES openings(id), name TEXT, pgn TEXT, UNIQUE(opening_id,name));
CREATE TABLE IF NOT EXISTS variation_moves(variation_id INTEGER REFERENCES variations(id), ply INTEGER, move_id INTEGER REFERENCES moves(id), PRIMARY KEY(variation_id,ply));
CREATE TABLE IF NOT EXISTS explanations(position_id INTEGER REFERENCES positions(id), uci TEXT, text TEXT, PRIMARY KEY(position_id,uci));
CREATE TABLE IF NOT EXISTS lessons(id TEXT PRIMARY KEY, category TEXT, title TEXT, body TEXT, fen TEXT, solution TEXT, difficulty INTEGER);
CREATE TABLE IF NOT EXISTS games(id INTEGER PRIMARY KEY, hash TEXT UNIQUE, pgn TEXT, white TEXT, black TEXT, result TEXT, played TEXT, source TEXT, meta TEXT, analyzed INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS analyses(game_id INTEGER REFERENCES games(id), ply INTEGER, fen TEXT, uci TEXT, san TEXT, before_json TEXT, after_json TEXT, verdict TEXT, explanation TEXT, PRIMARY KEY(game_id,ply));
CREATE TABLE IF NOT EXISTS exercises(id INTEGER PRIMARY KEY, position_id INTEGER REFERENCES positions(id), fen TEXT, solution TEXT, category TEXT, source TEXT, game_id INTEGER REFERENCES games(id), due REAL DEFAULT 0, interval REAL DEFAULT 0, ease REAL DEFAULT 2.5, repetitions INTEGER DEFAULT 0, UNIQUE(position_id,solution,source));
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY, exercise_id INTEGER REFERENCES exercises(id), at REAL, quality INTEGER, uci TEXT);
CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY, opening_id TEXT, position_id INTEGER REFERENCES positions(id), at REAL, success INTEGER, mode TEXT);
CREATE TABLE IF NOT EXISTS notes(position_id INTEGER PRIMARY KEY REFERENCES positions(id), text TEXT, saved INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS cache(key TEXT PRIMARY KEY, value TEXT, at REAL);
CREATE INDEX IF NOT EXISTS due_exercises ON exercises(due);
'''

@contextmanager
def connect():
    c = sqlite3.connect(DB, timeout=30)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()

def init():
    with connect() as c:
        c.execute('PRAGMA journal_mode=WAL')
        c.executescript(SCHEMA)
        c.execute('INSERT OR IGNORE INTO migrations VALUES(1)')

def key(board):
    return ' '.join(board.fen(en_passant='legal').split()[:4])

def position(c, board):
    c.execute('INSERT OR IGNORE INTO positions(key,fen) VALUES(?,?)', (key(board), board.fen()))
    return c.execute('SELECT id FROM positions WHERE key=?', (key(board),)).fetchone()[0]

def rows(sql, params=()):
    with connect() as c:
        return [dict(r) for r in c.execute(sql, params)]

def setting(name, default=None):
    r = rows('SELECT value FROM settings WHERE key=?', (name,))
    return json.loads(r[0]['value']) if r else default

# Only user data is exported; remote caches and executable configuration are excluded.
TABLES = ['positions','moves','openings','variations','variation_moves','explanations','lessons','games','analyses','exercises','reviews','attempts','notes','settings']

def export_data():
    with connect() as c:
        return {'version':1, 'tables':{t:[dict(r) for r in c.execute('SELECT * FROM '+t)] for t in TABLES}}

def import_data(payload):
    if payload.get('version') != 1 or set(payload.get('tables',{})) != set(TABLES):
        raise ValueError('Неподдерживаемый формат резервной копии')
    # Validate everything and replace in one transaction, including all foreign keys.
    with connect() as c:
        c.execute('BEGIN')
        c.execute('PRAGMA defer_foreign_keys=ON')
        for t in reversed(TABLES):
            c.execute('DELETE FROM '+t)
        for t in TABLES:
            columns = [r[1] for r in c.execute('PRAGMA table_info('+t+')')]
            data = payload['tables'][t]
            if not isinstance(data,list) or len(data)>200000:
                raise ValueError('Слишком большая или неверная таблица')
            for row in data:
                if set(row)!=set(columns):
                    raise ValueError('Неверные столбцы: '+t)
                if t=='positions':
                    b=chess.Board(row['fen'])
                    if not b.is_valid() or key(b)!=row['key']:
                        raise ValueError('Повреждённая позиция')
                c.execute('INSERT INTO '+t+'('+','.join(columns)+') VALUES('+','.join('?' for _ in columns)+')',[row[x] for x in columns])
        if c.execute('PRAGMA foreign_key_check').fetchone():
            raise ValueError('Повреждённые связи резервной копии')
        c.execute('DELETE FROM cache')
