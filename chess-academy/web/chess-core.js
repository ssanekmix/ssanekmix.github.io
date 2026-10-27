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
function baseExplain(b, value, authored = {}, analysis = null, verdict = null) {
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

export function explain(
  b,
  value,
  authored = {},
  analysis = null,
  verdict = null,
  beforeAnalysis = null,
) {
  const result = baseExplain(b, value, authored, analysis, verdict),
    m = play(new Chess(b.fen()), value),
    after = new Chess(b.fen());
  play(after, value);
  const names = {
      p: "пешка",
      n: "конь",
      b: "слон",
      r: "ладья",
      q: "ферзь",
      k: "король",
    },
    position = snapshot(after),
    controlled = position.attacks[m.to] || [],
    targets = controlled.filter(
      (s) => after.get(s) && after.get(s).color !== m.color,
    ),
    friends = controlled.filter((s) => after.get(s)?.color === m.color),
    center = controlled.filter((s) => ["d4", "e4", "d5", "e5"].includes(s));
  const note = authored[key(b) + "|" + value],
    pv = analysis?.lines?.[0];
  const task =
    note ||
    `${names[m.piece].charAt(0).toUpperCase() + names[m.piece].slice(1)} переходит с ${m.from} на ${m.to}. ${m.captured ? `Ход снимает ${names[m.captured]} соперника${m.isEnPassant() ? " взятием на проходе" : ` с ${m.to}`}.` : center.length ? `С нового поля усиливается контроль над ${center.join(", ")}.` : "Оцените, какую линию или поле получает фигура; отдельного авторского замысла для этой позиции пока нет."}`;
  const attack = [
    targets.length
      ? "Под ударом " +
        targets.map((s) => `${names[after.get(s).type]} ${s}`).join(", ") +
        "."
      : "С нового поля фигура не атакует занятых полей соперника.",
    friends.length
      ? "Защищаются фигуры на " + friends.join(", ") + "."
      : "На занятых полях своих фигур дополнительной геометрической защиты нет.",
    "Геометрическая атака ещё не доказывает выгодность взятия.",
  ].join(" ");
  const pawnFiles = (color) => {
    const files = {};
    for (const s of SQUARES)
      if (after.get(s)?.type === "p" && after.get(s).color === color)
        (files[s[0]] ||= []).push(s);
    return files;
  };
  const files = pawnFiles(m.color),
    doubled = Object.values(files)
      .filter((v) => v.length > 1)
      .flat(),
    isolated = Object.entries(files)
      .filter(
        ([f]) =>
          !files[String.fromCharCode(f.charCodeAt(0) - 1)] &&
          !files[String.fromCharCode(f.charCodeAt(0) + 1)],
      )
      .flatMap(([, v]) => v);
  const structure =
    m.piece === "p" || m.captured === "p"
      ? `${doubled.length ? "Сдвоенные пешки своей стороны: " + doubled.join(", ") + "." : "У своей стороны нет сдвоенных пешек."} ${isolated.length ? "Изолированные пешки: " + isolated.join(", ") + "." : "Изолированных пешек своей стороны нет."} Эти особенности сами по себе не определяют оценку.`
      : "Этот ход не перемещает и не снимает пешку: непосредственная пешечная структура сохраняется.";
  let response =
      "Без движкового анализа лучший ответ не определён. Откройте «Почему?» или анализ, чтобы проверить конкретное продолжение.",
    threat = "Конкретная форсированная угроза пока не подтверждена расчётом.";
  if (after.isCheckmate()) {
    threat = "Это мат: король под шахом и легальной защиты нет.";
    response = "Партия завершена матом: легального ответа нет.";
  } else if (after.isStalemate()) {
    threat =
      "Получился пат, а не выигрыш: у соперника нет легальных ходов и нет шаха.";
    response = "Пат — ничья.";
  } else if (after.isCheck())
    threat =
      "Ход даёт шах. Соперник обязан взять атакующую фигуру, закрыть линию шаха или уйти королём, если соответствующий ход легален.";
  if (pv?.pv?.length) {
    const reply = play(new Chess(after.fen()), pv.pv[0]);
    response = `Лучший найденный ответ — ${reply.san}. ${reply.captured ? "Он забирает " + names[reply.captured] + (reply.isEnPassant() ? " взятием на проходе" : " на " + reply.to) + "." : reply.san.includes("+") ? "Он даёт шах — нужно немедленно решить вопрос безопасности короля." : "Сравните это продолжение с вашей задумкой."} Линия: ${pv.san.slice(0, 8).join(" ")}. Это ограниченный расчёт, а не доказательство вынужденности всех ходов.`;
    if (reply.san.endsWith("#"))
      response = `Ответ ${reply.san} ставит мат. Ваш ход оставляет короля без легальной защиты.`;
  }
  const alternative = beforeAnalysis?.lines?.find((l) => l.pv[0] !== value);
  const instead = alternative
    ? `Для сравнения рассмотрите ${alternative.san.slice(0, 8).join(" ")}. Оценка белых: ${alternative.mate !== null ? "мат " + alternative.mate : (alternative.cp / 100).toFixed(2)}; глубина ${alternative.depth}. Это проверенная в том же расчёте альтернатива, её качество зависит от точности поиска.`
    : "«Что будет, если…» позволяет проверить альтернативу. Без отдельного расчёта нельзя уверенно утверждать, что случится при другом ходе.";
  const home = m.color === "w" ? "1" : "8",
    undeveloped = ["b", "g"]
      .map((f) => f + home)
      .filter(
        (s) => after.get(s)?.type === "n" && after.get(s).color === m.color,
      ),
    kingSquare = SQUARES.find(
      (s) => after.get(s)?.type === "k" && after.get(s).color === m.color,
    ),
    castle = m.isKingsideCastle() || m.isQueensideCastle();
  const development = castle
    ? "Выполнена рокировка: король и ладья поменяли положение. Открытые линии рядом с королём всё равно нужно проверить."
    : undeveloped.length
      ? "Кони на исходных полях " +
        undeveloped.join(", ") +
        ". Сравните дальнейшее развитие с конкретными угрозами."
      : `Король находится на ${kingSquare}. Не делайте автоматических выводов о его безопасности без учёта открытых линий.`;
  const plan = pv?.san?.length
    ? `Начните с проверки ответа ${pv.san[0]}, затем разберите ${pv.san.slice(1, 5).join(" ") || "следующую позицию"}. Долгосрочный план сверяйте с памяткой выбранного дебюта и фактической пешечной структурой.`
    : "Проверьте шахи, взятия и угрозы соперника. Затем сравните развитие фигур и возможный центральный подрыв; подробная авторская программа доступна в выбранном дебюте.";
  result.sections = [
    { id: "idea", title: "Зачем этот ход", body: task },
    {
      id: "response",
      title:
        verdict && !verdict.accepted
          ? "Почему возникает проблема"
          : "Лучший ответ соперника",
      body: response,
    },
    { id: "attacks", title: "Что атакует и защищает", body: attack },
    {
      id: "center",
      title: "Центр, развитие и король",
      body:
        (center.length
          ? "Геометрический контроль центральных полей: " +
            center.join(", ") +
            ". "
          : "С нового поля четыре центральных поля не атакуются напрямую. ") +
        development,
    },
    { id: "structure", title: "Пешечная структура", body: structure },
    { id: "threat", title: "Конкретные угрозы", body: threat },
    {
      id: "alternative",
      title: "Что будет, если сыграть иначе",
      body: instead,
    },
    {
      id: "plan",
      title: "Как продолжать и чего избегать",
      body:
        plan +
        " Перед каждым ходом проверяйте ответные шахи и взятия; не считайте популярность доказательством качества.",
    },
  ];
  return result;
}
