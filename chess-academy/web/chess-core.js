import { Chess, SQUARES } from "./vendor/chess.js";
export { Chess, SQUARES };
export const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const uci = (m) => m.from + m.to + (m.promotion || "");
export const key = (b) => b.fen().split(" ").slice(0, 4).join(" ");
export function play(b, value) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(value))
    throw Error("Некорректный ход UCI");
  try {
    return b.move({
      from: value.slice(0, 2),
      to: value.slice(2, 4),
      promotion: value[4],
    });
  } catch {
    throw Error("Этот ход нелегален: " + value);
  }
}
export function board(data = {}) {
  let b;
  try {
    b = new Chess(data.fen || START);
  } catch (e) {
    throw Error("Некорректный FEN: " + e.message);
  }
  const inactive = b.turn() === "w" ? "b" : "w",
    king = SQUARES.find(
      (s) => b.get(s)?.type === "k" && b.get(s).color === inactive,
    );
  if (!king || b.isAttacked(king, b.turn()))
    throw Error(
      "Невозможная позиция: король стороны, не имеющей хода, под шахом.",
    );
  for (const color of ["w", "b"]) {
    const pieces = b
      .board()
      .flat()
      .filter((p) => p?.color === color);
    if (pieces.length > 16 || pieces.filter((p) => p.type === "p").length > 8)
      throw Error("Невозможное количество фигур");
  }
  for (const right of b.fen().split(" ")[2].replace("-", "")) {
    const color = right === right.toUpperCase() ? "w" : "b",
      rank = color === "w" ? "1" : "8",
      file = right.toLowerCase() === "k" ? "h" : "a";
    if (
      b.get("e" + rank)?.type !== "k" ||
      b.get("e" + rank)?.color !== color ||
      b.get(file + rank)?.type !== "r" ||
      b.get(file + rank)?.color !== color
    )
      throw Error("Некорректные права рокировки");
  }
  if ((data.moves || []).length > 1000) throw Error("Слишком длинная история");
  for (const value of data.moves || []) play(b, value);
  return b;
}
export function terminal(b) {
  if (b.isCheckmate())
    return { terminal: "CHECKMATE", result: b.turn() === "w" ? "0-1" : "1-0" };
  if (b.isStalemate()) return { terminal: "STALEMATE", result: "1/2-1/2" };
  if (b.isInsufficientMaterial())
    return { terminal: "INSUFFICIENT_MATERIAL", result: "1/2-1/2" };
  if (b.isThreefoldRepetition())
    return { terminal: "THREEFOLD_REPETITION", result: "1/2-1/2" };
  if (b.isDrawByFiftyMoves())
    return { terminal: "FIFTY_MOVES", result: "1/2-1/2" };
  return { terminal: null, result: null };
}
export function snapshot(b) {
  const pieces = {},
    attacks = {};
  for (const s of SQUARES) {
    const p = b.get(s);
    if (p) {
      pieces[s] = p.color === "w" ? p.type.toUpperCase() : p.type;
      attacks[s] = [];
    }
  }
  for (const target of SQUARES)
    for (const color of ["w", "b"])
      for (const s of b.attackers(target, color)) attacks[s].push(target);
  return {
    fen: b.fen(),
    key: key(b),
    turn: b.turn() === "w" ? "white" : "black",
    check: b.isCheck(),
    ...terminal(b),
    legal: b.moves({ verbose: true }).map((m) => ({ uci: uci(m), san: m.san })),
    pieces,
    attacks,
  };
}
export function classify(before, after, color) {
  const a = before.lines[0],
    b = after.lines[0],
    sign = color === "w" || color === true ? 1 : -1;
  const loss = Math.max(0, (a.expectation - b.expectation) * sign),
    cpLoss = Math.max(0, (a.cp - b.cp) * sign);
  const won =
    after.terminal === "CHECKMATE" && b.expectation === (sign === 1 ? 1 : 0);
  const missed =
    !won &&
    a.mate !== null &&
    a.mate !== 0 &&
    Math.sign(a.mate) === sign &&
    !(b.mate !== null && b.mate !== 0 && Math.sign(b.mate) === sign);
  let label =
    loss >= 0.3 && cpLoss >= 120
      ? "Грубый зевок"
      : loss >= 0.15 && cpLoss >= 70
        ? "Ошибка"
        : (loss >= 0.06 && cpLoss >= 35) || missed
          ? "Неточность"
          : cpLoss <= 35 && loss <= 0.025
            ? "Один из лучших"
            : "Игровая альтернатива";
  return {
    label,
    expected_loss: Math.round(loss * 10000) / 10000,
    cp_loss: Math.round(cpLoss),
    accepted: loss <= 0.025 && cpLoss <= 50,
    missed_mate: missed,
    provisional: true,
  };
}
export function explain(
  b,
  value,
  authored = {},
  analysis = null,
  verdict = null,
) {
  const before = b.fen(),
    m = play(new Chess(before), value),
    p = b.get(m.from),
    next = new Chess(before);
  play(next, value);
  const names = {
      p: "пешка",
      n: "конь",
      b: "слон",
      r: "ладья",
      q: "ферзь",
      k: "король",
    },
    facts = [],
    motifs = [];
  if (authored[key(b) + "|" + value])
    facts.push(authored[key(b) + "|" + value]);
  facts.push(`${names[p.type]}: ${m.from} → ${m.to} (${m.san}).`);
  if (m.isKingsideCastle() || m.isQueensideCastle())
    facts.push(
      "Рокировка освобождает центральные линии для ладей и меняет положение короля. Проверьте линии рядом с ним.",
    );
  if (m.isEnPassant())
    facts.push(
      "Взятие на проходе: снимается соседняя пешка, а не фигура на поле назначения.",
    );
  else if (m.captured)
    facts.push(
      `Взята ${names[m.captured]} на ${m.to}. Выгодность разменов проверяется конкретным расчётом.`,
    );
  if (m.promotion)
    facts.push(
      `Превращение в ${names[m.promotion]}. Ферзь не всегда лучший выбор: проверьте пат.`,
    );
  if (
    ["n", "b"].includes(p.type) &&
    m.from[1] === (p.color === "w" ? "1" : "8")
  )
    facts.push(
      "Лёгкая фигура выходит с исходного ряда — это развитие. Проверьте, не понадобится ли ей сразу отступать.",
    );
  const all = snapshot(next),
    attacked = all.attacks[m.to] || [],
    targets = attacked.filter(
      (s) => next.get(s) && next.get(s).color !== p.color,
    ),
    friends = attacked.filter((s) => next.get(s)?.color === p.color),
    center = attacked.filter((s) => ["d4", "e4", "d5", "e5"].includes(s));
  if (targets.length)
    facts.push(
      "С нового поля атакованы: " +
        targets.map((s) => `${names[next.get(s).type]} ${s}`).join(", ") +
        ". Атака не гарантирует выгодного взятия.",
    );
  if (friends.length)
    facts.push("Защищаются свои фигуры на " + friends.join(", ") + ".");
  if (center.length)
    facts.push("Контролируются центральные поля " + center.join(", ") + ".");
  if (next.isCheck()) {
    facts.push("Сопернику дан шах: он обязан устранить нападение на короля.");
    motifs.push("Шах");
  }
  if (p.type === "n" && targets.length >= 2) motifs.push("Возможная вилка");
  if (next.isCheckmate()) {
    facts.push("Это мат: легальной защиты от шаха нет.");
    motifs.push("Мат");
  }
  if (next.isStalemate())
    facts.push("Это пат: шаха нет и легальных ходов нет — ничья.");
  const enemy = next.attackers(m.to, p.color === "w" ? "b" : "w");
  if (enemy.length)
    facts.push(
      `Фигура на ${m.to} под ударом с ${enemy.join(", ")}. Защитников: ${next.attackers(m.to, p.color).length}; их количество не заменяет расчёта.`,
    );
  const pv = analysis?.lines?.[0];
  if (pv?.san.length)
    facts.push(
      "Рассчитанный ответ и продолжение: " +
        pv.san.slice(0, 10).join(" ") +
        ". Основная линия ограниченного расчёта; не все ответы вынуждены.",
    );
  if (verdict)
    facts.push(
      `Предварительно: ${verdict.label}; потеря ожидаемого результата ${(100 * verdict.expected_loss).toFixed(1)}%. Спорное решение проверьте глубже.`,
    );
  facts.push(
    "Подробный разбор всех планов для неподготовленной позиции пока отсутствует. Проверяйте альтернативы через «Что будет, если…» и смотрите лучший ответ соперника.",
  );
  return { facts, motifs, arrows: [[m.from, m.to]], attacked, pv: pv || null };
}
