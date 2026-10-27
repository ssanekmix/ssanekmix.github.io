"""Explanations grounded in board features, authored notes and actual UCI PVs."""
import chess
from . import db

NAMES={1:'пешка',2:'конь',3:'слон',4:'ладья',5:'ферзь',6:'король'}
VALUES={1:1,2:3,3:3,4:5,5:9,6:0}

def explain(board,move,analysis=None,verdict=None):
    b=board.copy();piece=b.piece_at(move.from_square); san=b.san(move)
    with db.connect() as c:
        pid=db.position(c,b)
        note=c.execute('SELECT text FROM explanations WHERE position_id=? AND uci=?',(pid,move.uci())).fetchone()
    facts=[]
    if note: facts.append(note[0])
    facts.append(f'{NAMES[piece.piece_type].capitalize()}: {chess.square_name(move.from_square)} → {chess.square_name(move.to_square)} ({san}).')
    if b.is_castling(move): facts.append('Рокировка уводит короля от центральных линий и выводит ладью. Безопасность всё равно зависит от открытых линий рядом с королём.')
    captured=b.piece_at(move.to_square)
    if b.is_en_passant(move): facts.append('Взятие на проходе: пешка соперника снимается с соседней вертикали, а не с поля назначения.')
    elif captured: facts.append(f'Взята {NAMES[captured.piece_type]} на {chess.square_name(move.to_square)}. Ответное взятие нужно проверить в конкретном варианте.')
    if move.promotion: facts.append(f'Пешка превращается: {NAMES[move.promotion]}. Превращение в ферзя не обязательно единственный легальный выбор.')
    was_home=chess.square_rank(move.from_square)==(0 if piece.color else 7)
    if piece.piece_type in (2,3) and was_home: facts.append('Лёгкая фигура выходит с исходного ряда: это развитие, освобождающее место другим фигурам.')
    b.push(move)
    attacks=b.attacks(move.to_square)
    targets=[f'{NAMES[b.piece_at(s).piece_type]} {chess.square_name(s)}' for s in attacks if b.piece_at(s) and b.piece_at(s).color!=piece.color]
    friends=[chess.square_name(s) for s in attacks if b.piece_at(s) and b.piece_at(s).color==piece.color]
    centers=[chess.square_name(s) for s in attacks if s in (chess.D4,chess.E4,chess.D5,chess.E5)]
    if targets: facts.append('С нового поля атакованы: '+', '.join(targets)+'. Атака ещё не означает, что взятие выгодно.')
    if friends: facts.append('С нового поля защищаются свои фигуры на: '+', '.join(friends)+'.')
    if centers: facts.append('Фигура контролирует центральные поля: '+', '.join(centers)+'.')
    motifs=[]
    if b.is_check(): facts.append('Дан шах: соперник обязан устранить нападение на короля.');motifs.append('Шах')
    if len(targets)>=2 and piece.piece_type==2: motifs.append('Возможная вилка')
    if b.is_checkmate(): facts.append('Это мат: легальной защиты от шаха нет.');motifs.append('Мат')
    if b.is_stalemate(): facts.append('Это пат: шаха нет, легальных ходов нет. Результат — ничья.')
    enemy=b.attackers(not piece.color,move.to_square)
    defenders=b.attackers(piece.color,move.to_square)
    if enemy: facts.append(f'Фигура на {chess.square_name(move.to_square)} под ударом: нападающие '+', '.join(chess.square_name(s) for s in enemy)+f'; защитников {len(defenders)}. Само количество не заменяет расчёта разменов.')
    for sq in chess.scan_forward(b.occupied_co[not piece.color]):
        if b.is_pinned(not piece.color,sq): motifs.append('Связка '+chess.square_name(sq))
    pv=analysis['lines'][0] if analysis and analysis.get('lines') else None
    if pv and pv['san']:
        facts.append('Проверенный движком ответ и продолжение: '+' '.join(pv['san'][:10])+'. Это основная линия ограниченного расчёта, а не вынужденная последовательность всех ответов.')
    if verdict: facts.append(f"Предварительно: {verdict['label']}; потеря ожидаемого результата {verdict['expected_loss']:.1%}. Углубите анализ спорного решения.")
    facts.append('Для этой позиции нет проверенного подробного объяснения всех планов и контрфактических вариантов. «Что будет, если…» позволяет проверить альтернативу на доске; анализируйте также лучший ответ соперника.')
    return {'facts':facts,'motifs':sorted(set(motifs)),'arrows':[[chess.square_name(move.from_square),chess.square_name(move.to_square)]],'attacked':[chess.square_name(s) for s in attacks],'pv':pv}
