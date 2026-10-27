"use strict";
const $ = (id) => document.getElementById(id),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const GLYPHS = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};
let S = {
  root: START,
  moves: [],
  sans: [],
  cursor: 0,
  flip: false,
  position: null,
  selected: null,
  course: null,
  line: null,
  exercise: null,
  hint: false,
  arrows: [],
  attacks: [],
  revision: 0,
};
let busy = false,
  activeJob = null,
  gameJob = null,
  currentGame = null,
  allExercises = false;
async function api(path, data) {
  if (window.academyAPI) return window.academyAPI(path, data);
  const r = await fetch(
    "/api" + path,
    data === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
  );
  let j;
  try {
    j = await r.json();
  } catch {
    throw Error("Сервер вернул неверный ответ");
  }
  if (!r.ok)
    throw Error(
      typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail),
    );
  return j;
}
function notice(text, error = false) {
  $("notice").textContent = text;
  $("notice").className = "visible" + (error ? " error" : "");
  clearTimeout(notice.timer);
  notice.timer = setTimeout(
    () => ($("notice").className = ""),
    error ? 18000 : 7000,
  );
}
function safe(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      notice(e.message, true);
      console.error(e);
    }
  };
}
function payload() {
  return { fen: S.root, moves: S.moves.slice(0, S.cursor) };
}
function params() {
  return {
    seconds: Number($("seconds").value),
    depth: Number($("depth").value),
    multipv: Number($("multipv").value),
  };
}
async function page(name) {
  document.querySelectorAll(".page").forEach((e) => (e.hidden = e.id !== name));
  document
    .querySelectorAll("nav button")
    .forEach((e) => e.classList.toggle("active", e.dataset.page === name));
  if (name === "home") await home();
  if (name === "openings") await openings();
  if (name === "games") await games();
  if (name === "reviews") await reviews();
  if (name === "lessons") await lessons();
  if (name === "progress") await progress();
}
document
  .querySelectorAll("[data-page]")
  .forEach((b) => (b.onclick = safe(() => page(b.dataset.page))));
async function home() {
  const p = await api("/progress");
  $("home-stats").innerHTML =
    `<article><div class="big-number">${p.due}</div><p>позиций к повторению</p></article><article><div class="big-number">${p.attempts}</div><p>ответов в тренировках</p></article><article><h2>Следующий шаг</h2><p>${esc(p.recommendation)}</p><small>${esc(p.note)}</small></article>`;
}
async function openings() {
  const q = new URLSearchParams({
    q: $("opening-query").value,
    color: $("color-filter").value,
    family: $("family-filter").value,
  });
  const rows = await api("/openings?" + q);
  $("opening-list").innerHTML = rows
    .filter((x) => !x.id.startsWith("eco-"))
    .map(
      (o) =>
        `<article><span class="badge">${esc(o.eco)}</span><span class="badge">${o.color === "white" ? "За белых" : "За чёрных"}</span><h2>${esc(o.name)}</h2><p>${esc(o.plan)}</p><p>Сложность ${o.difficulty}/3 · ${esc(o.family)}${o.progress ? ` · Ответы ${o.progress.success}/${o.progress.total}` : ""}</p><button data-course="${esc(o.id)}">Изучать →</button></article>`,
    )
    .join("");
  document
    .querySelectorAll("[data-course]")
    .forEach((b) => (b.onclick = safe(() => course(b.dataset.course))));
}
$("opening-query").oninput = safe(openings);
$("color-filter").onchange = safe(openings);
$("family-filter").onchange = safe(openings);
async function course(id) {
  S.course = await api("/openings/" + id);
  S.line = S.course.variations[0];
  S.exercise = null;
  $("study-title").textContent = S.course.name;
  $("study-kind").textContent = S.course.eco + " · " + S.course.family;
  $("plan").textContent = S.course.plan;
  $("play-color").value = S.course.color;
  S.flip = S.course.color === "black";
  $("mode").value = "Обучение";
  $("task").textContent =
    "Сделайте ход. Альтернативы проверяются движком; выход из подготовленного варианта разрешён.";
  localStorage.setItem("academy-course", id);
  $("variations").innerHTML = S.course.variations
    .map((v) => `<button data-variation="${v.id}">${esc(v.name)}</button>`)
    .join("");
  document.querySelectorAll("[data-variation]").forEach(
    (b) =>
      (b.onclick = safe(async () => {
        S.line = S.course.variations.find(
          (v) => v.id === Number(b.dataset.variation),
        );
        await load(START);
        await automatic();
      })),
  );
  await load(START);
  await page("study");
  await automatic();
}
$("continue").onclick = safe(() =>
  course(localStorage.getItem("academy-course") || "italian"),
);
$("eco-search").onclick = safe(async () => {
  const rows = await api("/eco?q=" + encodeURIComponent($("eco-query").value));
  $("eco-list").innerHTML =
    rows
      .map(
        (o) =>
          `<article><small>${esc(o.eco)}</small><h2>${esc(o.name)}</h2><button data-eco="${esc(o.id)}">Исследовать</button></article>`,
      )
      .join("") ||
    "<p>Не найдено. Открытую базу можно установить командой python setup_local.py.</p>";
  document
    .querySelectorAll("[data-eco]")
    .forEach((b) => (b.onclick = safe(() => course(b.dataset.eco))));
});
async function load(fen, moves = [], sans = []) {
  const old = { ...S };
  S.root = fen;
  S.moves = [...moves];
  S.sans = [...sans];
  S.cursor = moves.length;
  S.selected = null;
  S.arrows = [];
  S.attacks = [];
  S.hint = false;
  try {
    await refresh();
    $("analysis").innerHTML = "";
    $("explanation").innerHTML = "";
  } catch (e) {
    S = old;
    throw e;
  }
}
async function refresh() {
  S.position = await api("/position", payload());
  S.revision++;
  S.selected = null;
  $("fen").value = S.position.fen;
  $("note").value = S.position.note;
  $("turn").textContent = S.position.terminal
    ? `Результат ${S.position.result} · ${S.position.terminal}`
    : `Ход ${S.position.turn === "white" ? "белых" : "чёрных"}${S.position.check ? " · Шах!" : ""}`;
  renderBoard();
  $("history").innerHTML = S.moves
    .map(
      (m, i) =>
        `<button data-ply="${i + 1}" class="${i + 1 === S.cursor ? "active" : ""}">${i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : ""}${esc(S.sans[i] || m)}</button>`,
    )
    .join("");
  document
    .querySelectorAll("[data-ply]")
    .forEach((b) => (b.onclick = safe(() => jump(Number(b.dataset.ply)))));
  $("branches").innerHTML =
    [...new Set(S.position.branches.map((b) => b.uci))]
      .map((u) => {
        const x = S.position.legal.find((m) => m.uci === u);
        const names = S.position.branches
          .filter((b) => b.uci === u)
          .map((b) => b.variation);
        return `<button data-move="${u}" title="${esc([...new Set(names)].join(", "))}">${esc(x?.san || u)}</button>`;
      })
      .join("") ||
    '<span class="muted">Подготовленной ветки нет. Можно исследовать любой легальный ход.</span>';
  $("legal").innerHTML = S.position.legal
    .map((m) => `<button data-move="${m.uci}">${esc(m.san)}</button>`)
    .join("");
  document
    .querySelectorAll("[data-move]")
    .forEach((b) => (b.onclick = safe(() => play(b.dataset.move))));
  $("explorer").innerHTML = "";
}
function renderBoard() {
  const files = S.flip ? "hgfedcba" : "abcdefgh",
    ranks = S.flip ? "12345678" : "87654321";
  $("board").innerHTML = "";
  for (let r = 0; r < 8; r++)
    for (let f = 0; f < 8; f++) {
      const sq = files[f] + ranks[r],
        p = S.position.pieces[sq],
        button = document.createElement("button");
      button.className =
        "square" +
        ((files.charCodeAt(f) + Number(ranks[r])) % 2 === 0 ? " dark" : "") +
        (p ? (p === p.toUpperCase() ? " white-piece" : " black-piece") : "");
      button.dataset.square = sq;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", sq + (p ? " " + p : ""));
      if (S.selected === sq) button.classList.add("selected");
      if (S.moves[S.cursor - 1]?.includes(sq)) button.classList.add("last");
      if (
        S.selected &&
        S.position.legal.some((m) => m.uci.startsWith(S.selected + sq))
      )
        button.classList.add("legal");
      if (S.attacks.includes(sq)) button.classList.add("attacked");
      button.innerHTML =
        (GLYPHS[p] || "") + `<span class="coordinate">${sq}</span>`;
      button.onclick = safe(() => clickSquare(sq));
      $("board").append(button);
    }
  drawArrows();
}
function drawArrows() {
  const xy = (s) => {
    let f = s.charCodeAt(0) - 97,
      r = 8 - Number(s[1]);
    if (S.flip) {
      f = 7 - f;
      r = 7 - r;
    }
    return [f * 100 + 50, r * 100 + 50];
  };
  $("arrow-lines").innerHTML = S.arrows
    .map(([a, b]) => {
      const [x1, y1] = xy(a),
        [x2, y2] = xy(b);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d59632" stroke-width="15" opacity=".85" marker-end="url(#arrowhead)"/>`;
    })
    .join("");
}
async function clickSquare(sq) {
  if (busy) return;
  if (S.selected) {
    const options = S.position.legal.filter((m) =>
      m.uci.startsWith(S.selected + sq),
    );
    if (options.length) {
      let move = options[0];
      if (options.length > 1) {
        const p = prompt(
          "Превращение: q — ферзь, r — ладья, b — слон, n — конь",
          "q",
        );
        if (!p) return;
        move = options.find((m) => m.uci.endsWith(p.toLowerCase()));
        if (!move) throw Error("Выберите q, r, b или n");
      }
      return play(move.uci);
    }
  }
  S.selected = S.selected === sq ? null : sq;
  S.attacks = [];
  renderBoard();
}
async function runJob(route, data, onStatus) {
  const j = await api(route, data);
  activeJob = j.job_id;
  const id = activeJob;
  try {
    for (;;) {
      const r = await api("/jobs/" + id);
      $("job-status").textContent =
        `${r.status} · ${Math.round(r.progress * 100)}%`;
      if (onStatus) onStatus(r);
      if (r.status === "done") return r.result;
      if (r.status === "failed") throw Error(r.error);
      if (r.status === "cancelled") throw Error("Анализ остановлен");
      await new Promise((r) => setTimeout(r, 180));
    }
  } finally {
    if (activeJob === id) activeJob = null;
  }
}
function showExplanation(e) {
  $("explanation").innerHTML =
    e.facts.map((f) => `<p>${esc(f)}</p>`).join("") +
    (e.motifs.length ? `<p><b>${esc(e.motifs.join(" · "))}</b></p>` : "");
  S.arrows = e.arrows;
  renderBoard();
}
async function play(uci, automaticMove = false) {
  if (busy) return;
  const legal = S.position.legal.find((m) => m.uci === uci);
  if (!legal) throw Error("Этот ход сейчас нелегален");
  busy = true;
  const before = payload();
  try {
    const response = await api("/move", { ...before, uci });
    const training =
      !automaticMove && $("mode").value !== "Свободное исследование";
    let result = null;
    if (training) {
      try {
        result = await runJob("/train", {
          ...before,
          ...params(),
          uci,
          opening_id: S.course?.id,
          exercise_id: S.exercise?.id,
          mode: $("mode").value,
          hint: S.hint,
          answer: $("answer").value,
        });
        notice(
          result.accepted
            ? "Сильное решение. Ответ сохранён."
            : result.verdict.label + " — посмотрите ответ соперника.",
        );
      } catch (e) {
        notice(e.message, true);
      }
    }
    S.moves = S.moves.slice(0, S.cursor);
    S.sans = S.sans.slice(0, S.cursor);
    S.moves.push(uci);
    S.sans.push(response.san);
    S.cursor++;
    S.exercise = null;
    S.hint = false;
    await refresh();
    const previous = $("explanation").innerHTML;
    showExplanation(result?.explanation || response.explanation);
    if (automaticMove && previous)
      $("explanation").innerHTML =
        "<h3>Ваш ход</h3>" +
        previous +
        "<h3>Ответ соперника</h3>" +
        $("explanation").innerHTML;
    if (result) renderAnalysis(result.after);
    if (S.course && $("mode").value === "Тренировка по памяти" && S.line) {
      const target = S.line.pgn.split(" ")[S.cursor - 1];
      notice(
        legal.san === target
          ? "Ход подготовленного варианта."
          : "Легальное ответвление. Сравните с изученным продолжением " +
              (target || "—"),
        legal.san !== target,
      );
    }
  } finally {
    busy = false;
  }
  if (!automaticMove) await automatic();
}
async function automatic() {
  if (busy || !S.course || S.position.terminal) return;
  const color = $("play-color").value;
  if (color === "both" || color === S.position.turn) return;
  if ($("mode").value === "Свободное исследование") return;
  if ($("mode").value === "Случайный соперник") return opponent();
  const next = S.line?.pgn.split(" ")[S.cursor];
  const expectedPrefix = S.line?.pgn.split(" ").slice(0, S.cursor);
  if (
    next &&
    S.sans.slice(0, S.cursor).join(" ") === expectedPrefix.join(" ")
  ) {
    const m = S.position.legal.find((m) => m.san === next);
    if (m) return play(m.uci, true);
  }
  await opponent();
}
async function opponent() {
  if (busy) return;
  busy = true;
  let result;
  try {
    result = await runJob("/opponent", {
      ...payload(),
      opening_id: S.course?.id,
      good: Number($("good").value),
      ordinary: Number($("ordinary").value),
    });
  } finally {
    busy = false;
  }
  if (result?.uci) await play(result.uci, true);
}
$("opponent").onclick = safe(opponent);
$("play-color").onchange = safe(async () => {
  S.flip = $("play-color").value === "black";
  renderBoard();
  await automatic();
});
async function jump(n) {
  if (busy) return;
  S.cursor = Math.max(0, Math.min(n, S.moves.length));
  S.arrows = [];
  S.attacks = [];
  S.exercise = null;
  await refresh();
  $("explanation").innerHTML = "";
  $("analysis").innerHTML = "";
}
$("back").onclick = safe(() => jump(S.cursor - 1));
$("forward").onclick = safe(() => jump(S.cursor + 1));
$("flip").onclick = () => {
  S.flip = !S.flip;
  renderBoard();
};
$("reset").onclick = safe(() => load(S.root));
$("repeat").onclick = safe(() =>
  S.exercise ? load(S.exercise.fen) : jump(Math.max(0, S.cursor - 1)),
);
$("load-fen").onclick = safe(async () => {
  if (busy) return;
  S.course = null;
  S.exercise = null;
  $("plan").textContent = "";
  $("study-title").textContent = "Произвольная позиция";
  $("mode").value = "Свободное исследование";
  await load($("fen").value);
});
function formatScore(l) {
  return l.mate !== null ? "Мат " + l.mate : (l.cp / 100).toFixed(2);
}
function renderAnalysis(result) {
  const anchor = payload();
  $("analysis").innerHTML =
    `<p>${esc(result.engine)} · оценка со стороны белых</p>` +
    (result.terminal
      ? `<p>${esc(result.terminal)} · ${esc(result.result)}</p>`
      : "") +
    result.lines
      .map(
        (l, i) =>
          `<div class="pv"><b>${formatScore(l)}</b> · глубина ${l.depth}<br>${l.san.map((s, k) => `<button data-pv="${i}" data-step="${k + 1}">${esc(s)}</button>`).join("")}</div>`,
      )
      .join("") +
    `<small>${esc(result.warning || "")}</small>`;
  document.querySelectorAll("[data-pv]").forEach(
    (b) =>
      (b.onclick = safe(async () => {
        const l = result.lines[Number(b.dataset.pv)],
          n = Number(b.dataset.step);
        S.course = null;
        S.exercise = null;
        $("mode").value = "Свободное исследование";
        await load(S.position.fen);
        await load(anchor.fen, [...anchor.moves, ...l.pv.slice(0, n)]);
        notice(
          "Показан конкретный рассчитанный вариант. Вернуться можно кнопкой «Назад».",
        );
      })),
  );
}
async function analyze() {
  if (busy) return;
  busy = true;
  const rev = S.revision;
  try {
    const result = await runJob("/analyze", { ...payload(), ...params() });
    if (rev === S.revision) {
      renderAnalysis(result);
      $("engine-panel").open = true;
      if (result.lines[0]?.pv[0]) {
        S.arrows = [
          [
            result.lines[0].pv[0].slice(0, 2),
            result.lines[0].pv[0].slice(2, 4),
          ],
        ];
        renderBoard();
      }
    }
    return result;
  } finally {
    busy = false;
  }
}
$("analyze").onclick = safe(analyze);
$("deep").onclick = safe(async () => {
  $("seconds").value = 3;
  $("depth").value = 26;
  await analyze();
});
$("stop").onclick = safe(async () => {
  if (activeJob) await api("/jobs/" + activeJob + "/cancel", {});
});
$("idea").onclick = safe(async () => {
  S.hint = true;
  const r = await analyze();
  const uci = r?.lines[0]?.pv[0];
  if (uci) {
    const suggested = await api("/move", { ...payload(), uci });
    showExplanation(suggested.explanation);
    $("task").textContent =
      "Идея предложенного хода: " +
      suggested.san +
      ". Проверьте лучший ответ соперника в варианте.";
  }
});
$("threat").onclick = () => {
  S.hint = true;
  const enemy = S.position.turn === "white" ? "black" : "white";
  S.attacks = [
    ...new Set(
      Object.entries(S.position.pieces)
        .filter(
          ([sq, p]) => (p === p.toUpperCase() ? "white" : "black") === enemy,
        )
        .flatMap(([sq]) => S.position.attacks[sq]),
    ),
  ];
  renderBoard();
  notice(
    "Подсвечены поля, атакуемые соперником. Это геометрия атак, включая связанные фигуры; не обещание тактического выигрыша.",
  );
};
$("why").onclick = safe(async () => {
  if (!S.cursor) {
    notice("Сначала сделайте ход.");
    return;
  }
  const before = { fen: S.root, moves: S.moves.slice(0, S.cursor - 1) },
    uci = S.moves[S.cursor - 1];
  busy = true;
  try {
    const r = await runJob("/analyze", { ...before, ...params(), uci });
    showExplanation(r.explanation);
    renderAnalysis(r.after);
  } finally {
    busy = false;
  }
});
$("what-if").onclick = () => {
  $("mode").value = "Свободное исследование";
  notice(
    "Вернитесь на ход назад и попробуйте альтернативу. «Почему?» сравнит её с лучшим решением.",
  );
};
$("save-note").onclick = safe(async () => {
  await api("/notes", { ...payload(), text: $("note").value });
  notice("Позиция и заметка сохранены.");
  await notes();
});
async function notes() {
  const rows = await api("/notes");
  $("saved-notes").innerHTML = rows
    .map(
      (n, i) =>
        `<button data-note="${i}">${esc(n.text.slice(0, 35) || "Сохранённая позиция")}</button>`,
    )
    .join("");
  document.querySelectorAll("[data-note]").forEach(
    (b) =>
      (b.onclick = safe(async () => {
        S.course = null;
        S.exercise = null;
        $("mode").value = "Свободное исследование";
        await load(rows[Number(b.dataset.note)].fen);
      })),
  );
}
async function reviews() {
  const rows = await api("/exercises?due=" + !allExercises);
  $("exercise-list").innerHTML =
    rows
      .map(
        (e) =>
          `<article><span class="badge">${esc(e.category)}</span><h2>${esc(e.source)}</h2><p>Успешных повторений подряд: ${e.repetitions}. Следующий срок: ${e.due ? new Date(e.due * 1000).toLocaleString("ru-RU") : "сейчас"}.</p><button data-exercise="${e.id}">Решить на доске</button></article>`,
      )
      .join("") ||
    "<p>На сегодня повторений нет. Можно изучить дебют или разобрать партию.</p>";
  document
    .querySelectorAll("[data-exercise]")
    .forEach(
      (b) =>
        (b.onclick = safe(() =>
          startExercise(rows.find((e) => e.id === Number(b.dataset.exercise))),
        )),
    );
}
async function startExercise(e) {
  S.course = null;
  S.line = null;
  S.exercise = e;
  $("mode").value = "Угадай лучший ход";
  $("study-title").textContent = e.category + " · повторение";
  $("plan").textContent = "Найдите сильное продолжение без подсказки.";
  $("variations").innerHTML = "";
  $("task").textContent = e.source;
  await load(e.fen);
  S.exercise = e;
  await page("study");
}
$("all-exercises").onclick = safe(async () => {
  allExercises = !allExercises;
  $("all-exercises").textContent = allExercises
    ? "Только на сегодня"
    : "Показать все упражнения";
  await reviews();
});
$("next-position").onclick = safe(async () => {
  const rows = await api("/exercises");
  if (rows.length) return startExercise(rows[0]);
  notice(
    "Повторений на сегодня нет. Продолжайте исследование или выберите новый урок.",
  );
});
$("mode").onchange = safe(async () => {
  const mode = $("mode").value;
  if (mode === "Найди ошибку" || mode === "Накажи ошибку соперника") {
    const rows = await api("/exercises?due=false");
    const e = rows.find((e) => e.game_id);
    if (!e) {
      notice(
        "Сначала разберите завершённую партию: для этого режима нужны найденные ошибки.",
      );
      $("task").textContent =
        "Импортируйте партию в разделе «Мои партии» и запустите анализ.";
      return;
    }
    const g = await api("/games/" + e.game_id);
    const row = g.analyses.find((a) => a.fen === e.fen);
    if (!row) return;
    S.course = null;
    S.exercise = null;
    $("plan").textContent = "";
    $("study-title").textContent = mode;
    await load(
      row.fen,
      mode === "Накажи ошибку соперника" ? [row.uci] : [],
      mode === "Накажи ошибку соперника" ? [row.san] : [],
    );
    $("task").textContent =
      mode === "Найди ошибку"
        ? `В партии сыграно ${row.san}. Объясните проблему и сделайте более сильный ход.`
        : `Соперник сыграл ${row.san}. Найдите лучший ответ. Не всякая неточность имеет форсированное опровержение.`;
  } else
    $("task").textContent =
      mode === "Тренировка по памяти"
        ? "Воспроизведите выбранный вариант. Проверка альтернатив остаётся движковой."
        : mode === "Угадай лучший ход"
          ? "Найдите сильный ход без подсказки."
          : "Сделайте ход и проверьте ответ соперника.";
});
async function lessons() {
  const rows = await api(
    "/lessons?category=" + encodeURIComponent($("lesson-filter").value),
  );
  $("lesson-list").innerHTML = rows
    .map(
      (l) =>
        `<article><span class="badge">${esc(l.category)}</span><span class="badge">${l.solution ? "Задача" : "Исследование"}</span><h2>${esc(l.title)}</h2><p>${esc(l.body)}</p><button data-lesson="${esc(l.id)}">Открыть позицию</button></article>`,
    )
    .join("");
  document.querySelectorAll("[data-lesson]").forEach(
    (b) =>
      (b.onclick = safe(async () => {
        const l = rows.find((x) => x.id === b.dataset.lesson);
        S.course = null;
        S.exercise = null;
        $("study-title").textContent = l.title;
        $("plan").textContent = l.body;
        $("mode").value = l.solution
          ? "Угадай лучший ход"
          : "Свободное исследование";
        $("variations").innerHTML = "";
        await load(l.fen);
        await page("study");
      })),
  );
}
$("lesson-filter").onchange = safe(lessons);
$("pgn-file").onchange = safe(async () => {
  $("pgn").value = await $("pgn-file").files[0].text();
});
$("import-pgn").onclick = safe(async () => {
  const r = await api("/games/import", { text: $("pgn").value });
  notice("Импортировано партий: " + r.ids.length);
  await games();
  if (r.ids[0]) await showGame(r.ids[0]);
});
$("archives").onclick = safe(async () => {
  const r = await api(
    "/chesscom/" + encodeURIComponent($("username").value) + "/archives",
  );
  $("archive-month").innerHTML = r.data.archives
    .slice()
    .reverse()
    .map((u) => {
      const m = u.match(/\/(\d{4})\/(\d{2})$/);
      return m
        ? `<option value="${m[1]}/${m[2]}">${m[1]}-${m[2]}</option>`
        : "";
    })
    .join("");
});
$("import-archive").onclick = safe(async () => {
  const m = $("archive-month").value;
  if (!m) throw Error("Сначала получите список архивов");
  const r = await api(
    "/chesscom/" + encodeURIComponent($("username").value) + "/" + m,
    {},
  );
  notice("Загружено " + r.ids.length + "; пропущено " + r.skipped);
  await games();
});
async function games() {
  const rows = await api("/games");
  $("game-list").innerHTML = rows
    .map(
      (g) =>
        `<article><small>${esc(g.played)} · ${esc(g.source)}</small><h2>${esc(g.white)} — ${esc(g.black)}</h2><p>${esc(g.result)} · ${g.analyzed ? "Разобрана" : "Ожидает анализа"}</p><button data-game="${g.id}">Открыть партию</button></article>`,
    )
    .join("");
  document
    .querySelectorAll("[data-game]")
    .forEach((b) => (b.onclick = safe(() => showGame(Number(b.dataset.game)))));
}
async function showGame(id) {
  currentGame = await api("/games/" + id);
  $("game-detail").hidden = false;
  $("game-title").textContent =
    currentGame.white + " — " + currentGame.black + " · " + currentGame.result;
  $("game-moves").innerHTML = currentGame.moves
    .map(
      (m, i) =>
        `<button data-game-ply="${i + 1}">${i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : ""}${esc(m.san)}${m.clock !== null ? " ⏱" + m.clock : ""}</button>`,
    )
    .join("");
  document
    .querySelectorAll("[data-game-ply]")
    .forEach(
      (b) => (b.onclick = safe(() => replay(Number(b.dataset.gamePly)))),
    );
  const errors = currentGame.analyses.filter((a) =>
    ["Неточность", "Ошибка", "Грубый зевок"].includes(
      JSON.parse(a.verdict).label,
    ),
  );
  $("game-errors").innerHTML =
    errors
      .map(
        (a) =>
          `<div class="error-card"><b>${a.ply}. ${esc(a.san)} · ${esc(JSON.parse(a.verdict).label)}</b><p>${esc(JSON.parse(a.explanation).facts.join(" "))}</p><button data-critical="${a.ply}">Разобрать на доске</button></div>`,
      )
      .join("") +
    (currentGame.analyzed
      ? `<p>Разобрано полуходов: ${currentGame.analyses.length}. Найдено критических решений: ${errors.length}. Упражнения доступны в разделе «Повторения». Вывод: проверяйте лучшие ответы соперника в отмеченных позициях.</p>`
      : "<p>Запустите анализ: оценки и ошибки появятся после полного завершения.</p>");
  document
    .querySelectorAll("[data-critical]")
    .forEach(
      (b) => (b.onclick = safe(() => replay(Number(b.dataset.critical)))),
    );
  chart(currentGame.analyses);
}
async function replay(ply = 0) {
  S.course = null;
  S.exercise = null;
  $("study-title").textContent = currentGame.white + " — " + currentGame.black;
  $("plan").textContent =
    "Воспроизведение завершённой партии. Любое ответвление остаётся локальным.";
  $("mode").value = "Свободное исследование";
  await load(
    currentGame.initial_fen,
    currentGame.moves.map((m) => m.uci),
    currentGame.moves.map((m) => m.san),
  );
  S.cursor = ply;
  await refresh();
  const row = currentGame.analyses.find((a) => a.ply === ply);
  if (row) {
    showExplanation(JSON.parse(row.explanation));
    renderAnalysis(JSON.parse(row.after_json));
  }
  await page("study");
}
$("game-replay").onclick = safe(() => replay());
$("game-analyze").onclick = safe(async () => {
  if (!currentGame) return;
  const id = currentGame.id;
  $("game-analyze").disabled = true;
  try {
    const result = await runJob(
      "/games/" + id + "/analyze",
      { seconds: Number($("seconds").value), depth: Number($("depth").value) },
      (r) => {
        gameJob = r.id;
        $("game-job").textContent =
          `Анализ ${Math.round(r.progress * 100)}% · ${r.status}`;
      },
    );
    notice(result.summary);
    await showGame(id);
    await games();
  } finally {
    $("game-analyze").disabled = false;
    gameJob = null;
  }
});
$("game-stop").onclick = safe(async () => {
  if (gameJob) await api("/jobs/" + gameJob + "/cancel", {});
});
function chart(rows) {
  const c = $("eval-chart"),
    ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#a8b4a4";
  ctx.beginPath();
  ctx.moveTo(0, 85);
  ctx.lineTo(900, 85);
  ctx.stroke();
  ctx.fillStyle = "#526453";
  ctx.fillText(
    "Оценка белых: центр 0, диапазон ±5 пешек (мат ограничен краем графика)",
    10,
    16,
  );
  if (!rows.length) return;
  ctx.strokeStyle = "#285b48";
  ctx.lineWidth = 2;
  ctx.beginPath();
  rows.forEach((a, i) => {
    const cp = JSON.parse(a.after_json).lines[0].cp;
    const x = 20 + (i / Math.max(1, rows.length - 1)) * 860,
      y = 85 - (Math.max(-500, Math.min(500, cp)) / 500) * 65;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.stroke();
  c.onclick = safe((ev) => {
    const rect = c.getBoundingClientRect(),
      x = ((ev.clientX - rect.left) / rect.width) * 900;
    const i = Math.round(((x - 20) / 860) * (rows.length - 1));
    if (rows[i]) return replay(rows[i].ply);
  });
}
async function progress() {
  const p = await api("/progress");
  $("progress-data").innerHTML =
    `<article><h2>Сейчас: ${esc(p.recommendation)}</h2><p>Ответов: ${p.attempts} · Успех: ${p.success_rate === null ? "ещё нет данных" : Math.round(p.success_rate * 100) + "%"} · К повторению: ${p.due}</p><p>Грубых ошибок в разобранных решениях: ${p.blunders}/${p.analyzed_plies}. Частая область упражнений: ${esc(p.weakest)}.</p><p>${esc(p.note)}</p><ol>${p.stages.map(([r, title], i) => `<li>${r}+ · ${esc(title)} ${i === p.stage ? "← текущая программа" : ""}</li>`).join("")}</ol></article><article><h2>Результаты по дебютам и цвету</h2>${
      Object.entries(p.opening_results)
        .map(
          ([k, v]) =>
            `<p>${esc(k)}: ${v.games} партий, ${v.wins} побед, ${v.draws} ничьих${v.games < 20 ? " · малая выборка" : ""}</p>`,
        )
        .join("") || "<p>Нужны партии указанного ника.</p>"
    }</article><article><h2>Рейтинг и часы</h2>${p.ratings.map((r) => `<p>${new Date(r.date * 1000).toLocaleDateString("ru-RU")} · ${esc(r.control)} · ${r.rating}</p>`).join("") || "<p>Рейтинги доступны в метаданных Chess.com; из PGN они не выдумываются.</p>"}${p.clocks.map((c) => `<p>Партия ${c.game_id}: минимальный остаток ${c.lowest_seconds} сек.</p>`).join("")}<p>Остаток времени сам по себе не доказывает проблему управления временем.</p></article>`;
}
$("save-preferences").onclick = safe(async () => {
  await api("/preferences", {
    rating: Number($("rating").value),
    username: $("username").value,
  });
  notice("Профиль сохранён");
  await progress();
});
$("restore").onclick = safe(async () => {
  const f = $("restore-file").files[0];
  if (!f) throw Error("Выберите резервную копию");
  if (!confirm("Заменить текущие данные выбранной резервной копией?")) return;
  await api("/restore", JSON.parse(await f.text()));
  notice("Данные восстановлены.");
  await home();
});
async function init() {
  const h = await api("/health");
  $("health").textContent = h.browser
    ? "● В браузере · Stockfish при первом анализе"
    : h.engine
      ? "● Локально · Stockfish найден"
      : "○ Движок не найден · уроки доступны";
  const prefs = await api("/preferences");
  $("rating").value = prefs.rating;
  $("username").value = prefs.username;
  await load(START);
  await home();
  await notes();
}
safe(init)();

$("save-repertoire").onclick = safe(async () => {
  const r = await api("/repertoire", {
    name: $("repertoire-name").value,
    color: $("repertoire-color").value,
    pgn: $("repertoire-pgn").value,
  });
  notice("Ветка добавлена в личный каталог.");
  await openings();
  await course(r.id);
});
$("create-exercise").onclick = safe(async () => {
  if (busy) return;
  busy = true;
  try {
    await runJob("/exercises/create", { ...payload(), ...params() });
    notice("Позиция сохранена как упражнение с решением Stockfish.");
  } finally {
    busy = false;
  }
});

document.querySelectorAll("[data-pool]").forEach(
  (button) =>
    (button.onclick = safe(async () => {
      const anchor = payload(),
        key = S.position.key,
        pool = button.dataset.pool;
      button.disabled = true;
      try {
        const r = await api("/explorer/" + pool, anchor);
        if (S.position.key !== key) return;
        let block = $("explorer-" + pool);
        if (!block) {
          block = document.createElement("div");
          block.id = "explorer-" + pool;
          $("explorer").append(block);
        }
        const total =
          (r.data.white || 0) + (r.data.draws || 0) + (r.data.black || 0);
        block.innerHTML = `<h3>${esc(button.textContent)} · ${total.toLocaleString("ru-RU")} партий</h3><p>${r.cached ? "Локальный кеш" : "Источник онлайн"} · ${new Date(r.at * 1000).toLocaleString("ru-RU")}${r.stale ? " · Устаревшие данные: сеть недоступна" : ""}</p><p>${esc(r.sample_note)}</p><table><thead><tr><th>Ход</th><th>Частота</th><th>Белые / ничьи / чёрные</th><th>Проверка</th></tr></thead><tbody>${r.data.moves
          .map((m, i) => {
            const n = m.white + m.draws + m.black;
            return `<tr><td><button data-explorer-move="${i}">${esc(m.san || m.uci)}</button></td><td>${total ? ((100 * n) / total).toFixed(1) : "—"}% · ${n}</td><td>${m.white} / ${m.draws} / ${m.black}${n < 100 ? " · малая выборка" : ""}${total >= 100 && n / total < 0.01 ? " · редкий ход в выборке" : ""}</td><td><button data-explorer-check="${i}">Почему?</button></td></tr>`;
          })
          .join("")}</tbody></table>`;
        block
          .querySelectorAll("[data-explorer-move]")
          .forEach(
            (b) =>
              (b.onclick = safe(() =>
                play(r.data.moves[Number(b.dataset.explorerMove)].uci),
              )),
          );
        block.querySelectorAll("[data-explorer-check]").forEach(
          (b) =>
            (b.onclick = safe(async () => {
              if (busy) return;
              busy = true;
              try {
                const result = await runJob("/analyze", {
                  ...anchor,
                  ...params(),
                  uci: r.data.moves[Number(b.dataset.explorerCheck)].uci,
                });
                showExplanation(result.explanation);
                renderAnalysis(result.before);
                $("engine-panel").open = true;
                notice(
                  "Проверен конкретный ход. Частота не участвует в оценке движка.",
                );
              } finally {
                busy = false;
              }
            })),
        );
      } finally {
        button.disabled = false;
      }
    })),
);
