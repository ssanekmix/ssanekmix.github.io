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
  if (busy && name !== "study") {
    notice("Дождитесь проверки хода или остановите анализ.");
    return;
  }
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
  if (name === "puzzles") await puzzleHome();
  if (name === "profile") await profileHome();
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
        `<article><span class="badge">${esc(o.eco)}</span><span class="badge">${o.color === "white" ? "За белых" : "За чёрных"}</span><h2>${esc(o.name)}</h2><p>${esc(o.plan)}</p><div class="course-stat">${o.deep ? `<span data-deep>${o.chapters} глав</span><span>Оба цвета</span><span>До ${Math.ceil(o.max_plies / 2)} ходов + анализ</span>` : ""}</div><p>Сложность ${o.difficulty}/3 · ${esc(o.family)}${o.progress ? ` · Ответы ${o.progress.success}/${o.progress.total}` : ""}</p><button data-course="${esc(o.id)}">Изучать →</button></article>`,
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
  if (busy) return;
  lastPuzzleMode = false;
  S.course = await api("/openings/" + id);
  S.line = S.course.variations[0];
  S.exercise = null;
  S.puzzle = null;
  $("study-title").textContent = S.course.name;
  $("study-kind").textContent = S.course.eco + " · " + S.course.family;
  $("plan").textContent = S.course.plan;
  $("play-color").value = S.course.color;
  S.flip = S.course.color === "black";
  $("mode").value = "Обучение";
  $("task").textContent =
    "Сделайте ход. Альтернативы проверяются движком; выход из подготовленного варианта разрешён.";
  localStorage.setItem("academy-course", id);
  renderVariations();
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
  if (busy) return;
  clearFeedback();
  S.reviewGame = null;
  document.body.classList.remove("reviewing");
  $("review-panel").hidden = true;
  $("back").disabled = false;
  $("forward").disabled = false;
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
let refreshTicket = 0;
async function refresh() {
  const ticket = ++refreshTicket,
    position = await api("/position", payload());
  if (ticket !== refreshTicket) return false;
  S.position = position;
  if ($("eval-meter")?.dataset.fen !== S.position.fen) resetEvaluation();
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
  updateStudyChrome();
  renderReview();
  return true;
}
function renderBoard() {
  const files = S.flip ? "hgfedcba" : "abcdefgh",
    ranks = S.flip ? "12345678" : "87654321";
  $("board").innerHTML = "";
  for (let r = 0; r < 8; r++)
    for (let f = 0; f < 8; f++) {
      const sq = files[f] + ranks[r],
        p = shownPosition().pieces[sq],
        button = document.createElement("button");
      button.className =
        "square" +
        ((files.charCodeAt(f) + Number(ranks[r])) % 2 === 0 ? " dark" : "") +
        (p ? (p === p.toUpperCase() ? " white-piece" : " black-piece") : "");
      button.dataset.square = sq;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", sq + (p ? " " + p : ""));
      if (S.selected === sq) button.classList.add("selected");
      if ((S.preview?.last || S.moves[S.cursor - 1])?.includes(sq))
        button.classList.add("last");
      if (
        S.selected &&
        S.position.legal.some((m) => m.uci.startsWith(S.selected + sq))
      )
        button.classList.add("legal");
      if (S.attacks.includes(sq)) button.classList.add("attacked");
      button.innerHTML =
        (p
          ? `<img class="piece" src="${window.AcademyUI.pieceSrc(p)}" alt="" draggable="false">`
          : "") +
        (f === 0
          ? `<span class="coordinate rank-coordinate">${ranks[r]}</span>`
          : "") +
        (r === 7
          ? `<span class="coordinate file-coordinate">${files[f]}</span>`
          : "");
      button.onclick = safe(() => clickSquare(sq));
      button.onpointerdown = (event) => startDrag(event, sq);
      button.onkeydown = (event) => boardKeyboard(event, sq);
      const reviewed = reviewRow();
      if (reviewed && reviewed.uci.slice(2, 4) === sq && !S.preview) {
        const mark = reviewMark(reviewed);
        button.insertAdjacentHTML(
          "beforeend",
          `<span class="move-badge ${mark.kind}" title="${esc(mark.label)}">${mark.symbol}</span>`,
        );
      }
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
    .map(([a, b, kind = "green"]) => {
      const [x1, y1] = xy(a),
        [x2, y2] = xy(b);
      const color =
        { green: "#95bb4a", red: "#e15b64", blue: "#63a9e8" }[kind] ||
        "#95bb4a";
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="16" opacity=".8" marker-end="url(#arrow-${kind})"/>`;
    })
    .join("");
}
async function clickSquare(sq) {
  if (busy || Date.now() < suppressClickUntil) return;
  if (S.preview) retryPosition();
  if (S.selected) {
    const options = S.position.legal.filter((m) =>
      m.uci.startsWith(S.selected + sq),
    );
    if (options.length) {
      let move = options[0];
      if (options.length > 1) {
        const p = await choosePromotion(options);
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
        `${{ queued: "В очереди", running: "Анализирую", done: "Готово", cancelled: "Остановлено", failed: "Ошибка" }[r.status] || r.status} · ${Math.round(r.progress * 100)}%`;
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
  const parts = e.sections;
  if (parts?.length) {
    $("explanation").innerHTML =
      parts
        .slice(0, 2)
        .map((p) => `<h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>`)
        .join("") +
      `<details><summary>Подробный разбор: центр, планы и ответы</summary>${parts
        .slice(2)
        .map((p) => `<h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>`)
        .join("")}</details>`;
  } else {
    $("explanation").innerHTML =
      e.facts
        .slice(0, 2)
        .map((f) => `<p>${esc(f)}</p>`)
        .join("") +
      `<details><summary>Разобрать подробнее</summary>${e.facts
        .slice(2)
        .map((f) => `<p>${esc(f)}</p>`)
        .join("")}</details>`;
  }
  S.arrows = e.arrows;
  renderBoard();
}

let feedbackContext = null,
  previewToken = 0,
  suppressClickUntil = 0;
function shownPosition() {
  return S.preview?.position || S.position;
}
function resetEvaluation() {
  if (!$("eval-meter")) return;
  $("eval-fill").style.height = "50%";
  $("eval-score").textContent = "—";
  $("eval-meter").removeAttribute("aria-valuenow");
  $("eval-meter").setAttribute(
    "aria-label",
    "Для этой позиции оценка ещё не рассчитана",
  );
  $("eval-meter").dataset.fen = "";
}
function evaluation(result, fen = shownPosition()?.fen) {
  if (fen !== shownPosition()?.fen) {
    resetEvaluation();
    return;
  }
  if ($("eval-meter")) $("eval-meter").dataset.fen = fen;
  const line = result?.lines?.[0];
  if (!line) return;
  const value =
    line.mate !== null
      ? line.cp > 0
        ? 10
        : -10
      : Math.max(-10, Math.min(10, line.cp / 100));
  if ($("eval-fill"))
    $("eval-fill").style.height = 50 + 45 * Math.tanh(value / 3) + "%";
  if ($("eval-score"))
    $("eval-score").textContent =
      line.mate !== null
        ? "M" + Math.abs(line.mate)
        : (line.cp / 100).toFixed(1);
  if ($("eval-meter")) {
    $("eval-meter").setAttribute("aria-valuenow", value);
    $("eval-meter").setAttribute(
      "aria-label",
      "Оценка белых " + formatScore(line),
    );
  }
}
function clearFeedback() {
  previewToken++;
  S.preview = null;
  feedbackContext = null;
  if ($("feedback")) $("feedback").hidden = true;
}
function feedback(result, played, good = false) {
  window.AcademyUI.showTab?.("coach");
  const box = $("feedback");
  if (!box) return;
  box.hidden = false;
  const strongest =
    result.verdict.label === "Один из лучших" || result.verdict.source_solution;
  box.dataset.kind = good ? (strongest ? "good" : "alternative") : "bad";
  $("feedback-label").textContent = good
    ? strongest
      ? "ВЕРНО · ПРОДОЛЖАЕМ"
      : "ДОПУСТИМАЯ АЛЬТЕРНАТИВА"
    : "РАЗБЕРЁМ И ПОПРОБУЕМ СНОВА";
  $("feedback-title").textContent = good
    ? strongest
      ? "Сильное решение"
      : "Так тоже можно играть"
    : result.verdict.label === "Грубый зевок"
      ? "Так играть опасно"
      : result.verdict.label === "Ошибка"
        ? "Здесь ход не работает"
        : "Есть более точный ход";
  const reply = result.after?.lines?.[0],
    best = result.before?.lines?.[0];
  let why = reply?.san?.[0]?.endsWith("#")
    ? `После ${played} следует ${reply.san[0]} — мат. У короля не остаётся легальной защиты.`
    : reply?.san?.length
      ? `На ${played} соперник отвечает ${reply.san[0]}. ${result.explanation.sections?.find((s) => s.id === "response")?.body || "Это лучший ответ, найденный в текущем расчёте. Посмотрите его на доске."}`
      : "Посмотрите объяснение позиции и сравните альтернативы.";
  if (good)
    why =
      result.continuation && !result.continuation.complete
        ? "Вы нашли продолжение. Теперь учтите ответ соперника и рассчитайте следующий ход."
        : result.verdict.label === "Один из лучших"
          ? "Идея работает. Проверьте, что соперник может ответить, и закрепите этот план."
          : result.verdict.source_solution
            ? "Ход совпадает с проверенной линией задачи из источника."
            : result.verdict.acceptance_note ||
              "Допустимая альтернатива: движок сохраняет близкую оценку. Неосновной ход тоже может быть хорошим.";
  if (!good && result.verdict.goal_note) why = result.verdict.goal_note;
  if (!good && best?.san?.[0])
    why += ` Вместо этого рассмотрите ${best.san[0]}.`;
  $("feedback-summary").textContent = why;
  $("show-refutation").hidden = good || !reply?.pv?.length;
  $("retry-move").hidden = good;
  $("show-best-move").hidden = good || !best?.pv?.length;
  $("refutation-strip").innerHTML = good
    ? ""
    : (reply?.san || [])
        .slice(0, 6)
        .map(
          (san, i) =>
            `<button data-refutation-step="${i + 1}">${esc(san)}</button>`,
        )
        .join("");
  document
    .querySelectorAll("[data-refutation-step]")
    .forEach(
      (b) =>
        (b.onclick = safe(() =>
          showRefutation(Number(b.dataset.refutationStep)),
        )),
    );
}
async function showRefutation(count = 1) {
  if (!feedbackContext) return;
  const ctx = feedbackContext,
    token = ++previewToken,
    line = ctx.result.after.lines[0];
  const moves = [...ctx.before.moves, ctx.uci, ...line.pv.slice(0, count)],
    position = await api("/position", { fen: ctx.before.fen, moves });
  if (token !== previewToken || ctx !== feedbackContext) return;
  const last = moves.at(-1);
  S.preview = { position, last };
  S.arrows = [[last.slice(0, 2), last.slice(2, 4), "blue"]];
  renderBoard();
  evaluation(ctx.result.after, ctx.afterFen);
  window.AcademyUI.moveSound?.(Boolean(line.san[count - 1]?.includes("x")));
  $("board-state").textContent = "Ответ соперника";
  document
    .querySelectorAll("[data-refutation-step]")
    .forEach((b) =>
      b.classList.toggle("active", Number(b.dataset.refutationStep) === count),
    );
}
function retryPosition() {
  previewToken++;
  S.preview = null;
  S.arrows = feedbackContext
    ? [
        [
          feedbackContext.uci.slice(0, 2),
          feedbackContext.uci.slice(2, 4),
          "red",
        ],
      ]
    : [];
  renderBoard();
  if (feedbackContext) evaluation(feedbackContext.result.before);
  $("board-state").textContent = "Попробуйте ещё раз";
}
$("retry-move").onclick = retryPosition;
$("show-refutation").onclick = safe(() => showRefutation());
$("show-best-move").onclick = () => {
  retryPosition();
  const move = feedbackContext?.result.before.lines[0].pv[0];
  if (move) {
    S.hint = true;
    S.arrows = [[move.slice(0, 2), move.slice(2, 4), "green"]];
    renderBoard();
    $("feedback-summary").textContent +=
      " Стрелка показывает сильный ход — теперь сыграйте его сами.";
  }
};
async function rejectMove(before, uci, response, result) {
  feedbackContext = { before, uci, result, afterFen: response.position.fen };
  S.preview = { position: response.position, last: uci };
  S.arrows = [[uci.slice(0, 2), uci.slice(2, 4), "red"]];
  showExplanation(result.explanation);
  S.arrows = [[uci.slice(0, 2), uci.slice(2, 4), "red"]];
  feedback(result, response.san);
  evaluation(result.after);
  renderAnalysis(result.after, {
    fen: before.fen,
    moves: [...before.moves, uci],
  });
  renderBoard();
  const token = previewToken;
  await new Promise((r) => setTimeout(r, 650));
  if (token !== previewToken) return;
  if (result.after.lines[0].pv.length) await showRefutation(1);
  const showing = previewToken;
  await new Promise((r) => setTimeout(r, 1300));
  if (showing === previewToken) retryPosition();
}
async function play(uci, automaticMove = false) {
  if (busy) return;
  if (S.preview) retryPosition();
  const legal = S.position.legal.find((m) => m.uci === uci);
  if (!legal) throw Error("Этот ход сейчас нелегален");
  busy = true;
  const before = payload(),
    exercise = S.exercise,
    puzzle = S.puzzle,
    hintUsed = Boolean(S.hint || puzzle?.hintUsed);
  try {
    const response = await api("/move", { ...before, uci }),
      training = !automaticMove && $("mode").value !== "Свободное исследование";
    window.AcademyUI.moveSound?.(Boolean(response.san.includes("x")));
    if (S.reviewGame) {
      S.reviewGame = null;
      document.body.classList.remove("reviewing");
      $("review-panel").hidden = true;
    }
    let result = null;
    if (training) {
      const token = ++previewToken;
      S.preview = { position: response.position, last: uci };
      S.arrows = [[uci.slice(0, 2), uci.slice(2, 4), "green"]];
      renderBoard();
      $("board-state").textContent = "Проверяю ваш ход…";
      try {
        result = await runJob("/train", {
          ...before,
          ...params(),
          uci,
          opening_id: S.course?.id,
          variation_id: S.line?.id,
          exercise_id: exercise?.id,
          sequence_index: puzzle?.index || 0,
          mode: $("mode").value,
          hint: hintUsed,
          answer: $("answer").value,
        });
      } catch (e) {
        S.preview = null;
        renderBoard();
        $("board-state").textContent = "Повторите попытку";
        notice("Ход не проверен: " + e.message, true);
        return;
      }
      if (token !== previewToken) return;
      S.preview = null;
      if (!result.accepted) {
        await rejectMove(before, uci, response, result);
        return;
      }
    }
    if (!automaticMove) clearFeedback();
    else {
      previewToken++;
      S.preview = null;
    }
    S.moves = S.moves.slice(0, S.cursor);
    S.sans = S.sans.slice(0, S.cursor);
    S.moves.push(uci);
    S.sans.push(response.san);
    S.cursor++;
    S.exercise = puzzle && !result?.continuation?.complete ? exercise : null;
    S.hint = false;
    await refresh();
    if (!automaticMove || !$("explanation").textContent)
      showExplanation(result?.explanation || response.explanation);
    else
      $("explanation").insertAdjacentHTML(
        "beforeend",
        `<p class="reply-note">Ответ соперника: <b>${esc(response.san)}</b>. Проверьте следующую идею.</p>`,
      );
    if (result) {
      feedback(result, response.san, true);
      renderAnalysis(result.after);
      evaluation(result.after);
    }
    if (automaticMove && feedbackContext) feedbackContext = null;
    if (puzzle && result?.continuation) {
      const next = result.continuation;
      if (next.complete) {
        S.puzzle = null;
        S.exercise = null;
        $("task").textContent =
          "Задача решена. Сильная работа! Можете разобрать вариант или перейти к следующей.";
        notice("Задача решена · результат сохранён");
      } else if (next.reply) {
        const reply = await api("/move", { ...payload(), uci: next.reply });
        window.AcademyUI.moveSound?.(reply.san.includes("x"));
        S.moves.push(next.reply);
        S.sans.push(reply.san);
        S.cursor++;
        S.puzzle = { ...puzzle, index: next.next_index, hintUsed };
        S.exercise = exercise;
        await refresh();
        showExplanation(result.explanation);
        feedback(result, response.san, true);
        $("task").textContent =
          "Соперник ответил " + reply.san + ". Найдите следующий сильный ход.";
      }
    }
  } finally {
    busy = false;
  }
  if (!automaticMove && !puzzle) await automatic();
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
    if (m) {
      await play(m.uci, true);
      await evaluateCurrent();
      return;
    }
  }
  await opponent();
}
async function evaluateCurrent() {
  if (busy || S.position.terminal) return;
  const revision = S.revision,
    positionFen = S.position.fen;
  try {
    const result = await runJob("/analyze", {
      ...payload(),
      seconds: 0.12,
      depth: 14,
      multipv: 1,
    });
    if (revision === S.revision) evaluation(result, positionFen);
  } catch {
    if (revision === S.revision) resetEvaluation();
  }
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
  if (result?.uci) {
    await play(result.uci, true);
    await evaluateCurrent();
  }
}
$("opponent").onclick = safe(opponent);
$("play-color").onchange = safe(async () => {
  S.flip = $("play-color").value === "black";
  if (S.course) renderVariations();
  updateStudyChrome();
  renderBoard();
  await automatic();
});
async function jump(n) {
  if (busy) return;
  const cursor = Math.max(0, Math.min(n, S.moves.length)),
    moved = cursor !== S.cursor;
  if (!moved && !S.preview) return;
  clearFeedback();
  S.cursor = cursor;
  S.arrows = [];
  S.attacks = [];
  S.exercise = null;
  S.puzzle = null;
  const updated = await refresh();
  if (updated === false) return;
  if (moved)
    window.AcademyUI.moveSound?.(Boolean(S.sans[S.cursor - 1]?.includes("x")));
  if (!S.reviewGame) $("explanation").innerHTML = "";
  $("analysis").innerHTML = "";
}
$("back").onclick = safe(() => jump(S.cursor - 1));
$("forward").onclick = safe(() => jump(S.cursor + 1));
$("flip").onclick = () => {
  S.flip = !S.flip;
  updateStudyChrome();
  renderBoard();
};
$("reset").onclick = safe(() => (S.reviewGame ? jump(0) : load(S.root)));
$("first-move").onclick = safe(() => jump(0));
$("last-move").onclick = safe(() => jump(S.moves.length));
document.addEventListener(
  "keydown",
  (event) => {
    if (
      $("study").hidden ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest(
        "input,textarea,select,[contenteditable=true],dialog",
      )
    )
      return;
    if (!S.reviewGame && event.target.closest("#board")) return;
    const next = {
      ArrowLeft: S.cursor - 1,
      ArrowRight: S.cursor + 1,
      Home: 0,
      End: S.moves.length,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    safe(() => jump(next))();
  },
  true,
);
$("repeat").onclick = safe(() =>
  S.exercise ? load(S.exercise.fen) : jump(Math.max(0, S.cursor - 1)),
);
$("load-fen").onclick = safe(async () => {
  if (busy) return;
  S.course = null;
  S.exercise = null;
  S.puzzle = null;
  lastPuzzleMode = false;
  $("plan").hidden = false;
  $("plan").textContent = "";
  $("study-title").textContent = "Произвольная позиция";
  $("mode").value = "Свободное исследование";
  await load($("fen").value);
  $("play-color").value = S.position.turn;
  S.flip = S.position.turn === "black";
  renderBoard();
  updateStudyChrome();
});
function formatScore(l) {
  return l.mate !== null
    ? l.mate === 0
      ? "Мат"
      : "Мат " + l.mate
    : (l.cp > 0 ? "+" : "") + (l.cp / 100).toFixed(2);
}
function renderAnalysis(result, anchor = payload()) {
  evaluation(result);
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
      window.AcademyUI.showTab?.("engine");
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
    window.AcademyUI.showTab?.("coach");
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
  if (feedbackContext) {
    await showRefutation();
    return;
  }
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
  const rows = await api("/exercises?due=" + !allExercises + "&all=true");
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
  if (busy) return;
  lastPuzzleMode = Boolean(e.puzzleId);
  S.course = null;
  S.line = null;
  S.puzzle = e.line?.length ? { index: 0, line: e.line } : null;
  S.exercise = e;
  $("mode").value = "Угадай лучший ход";
  $("study-title").textContent = e.category + " · повторение";
  $("plan").hidden = false;
  $("plan").textContent = "Найдите сильное продолжение без подсказки.";
  $("variations").innerHTML = "";
  $("task").textContent = e.source;
  await load(e.fen);
  S.exercise = e;
  $("play-color").value = S.position.turn;
  S.flip = S.position.turn === "black";
  renderBoard();
  updateStudyChrome();
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
  if (lastPuzzleMode) return newPuzzle();
  const rows = await api("/exercises");
  if (rows.length) return startExercise(rows[0]);
  notice(
    "Повторений на сегодня нет. Продолжайте исследование или выберите новый урок.",
  );
});
$("mode").onchange = safe(async () => {
  const mode = $("mode").value;
  if (mode === "Найди ошибку" || mode === "Накажи ошибку соперника") {
    const rows = await api("/exercises?due=false&all=true");
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
    S.puzzle = null;
    lastPuzzleMode = false;
    $("plan").hidden = false;
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
        `<article><small>${esc(g.played)} · ${esc(g.source)}</small><h2>${esc(g.white)} — ${esc(g.black)}</h2><p>${esc(g.result)} · ${g.analyzed ? "Разобрана" : "Ожидает анализа"}</p><button class="primary" data-review-game="${g.id}">Разобрать на доске</button><button data-game="${g.id}">Открыть партию</button></article>`,
    )
    .join("");
  document
    .querySelectorAll("[data-game]")
    .forEach((b) => (b.onclick = safe(() => showGame(Number(b.dataset.game)))));
  document.querySelectorAll("[data-review-game]").forEach(
    (b) =>
      (b.onclick = safe(async () => {
        currentGame = await api("/games/" + Number(b.dataset.reviewGame));
        await replay();
      })),
  );
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
          `<div class="error-card"><b>${a.ply}. ${esc(a.san)} · ${esc(JSON.parse(a.verdict).label)}</b><p>${esc(JSON.parse(a.explanation).facts.join(" "))}</p><button data-critical="${a.ply}">Разобрать на доске</button><button data-fix="${a.ply}" class="primary">Исправить ошибку</button></div>`,
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
  document.querySelectorAll("[data-fix]").forEach(
    (b) =>
      (b.onclick = safe(async () => {
        if (busy) return;
        const row = currentGame.analyses.find(
          (a) => a.ply === Number(b.dataset.fix),
        );
        let exercise = (await api("/exercises?due=false")).find(
          (e) => e.game_id === currentGame.id && e.fen === row.fen,
        );
        if (!exercise) {
          const result = await runJob("/exercises/create", {
            fen: row.fen,
            ...params(),
          });
          exercise = (await api("/exercises?due=false")).find(
            (e) => e.id === result.id,
          );
        }
        if (exercise) await startExercise(exercise);
      })),
  );
  chart(currentGame.analyses);
}
let reviewJob = null;
function reviewRow() {
  return S.reviewGame?.analyses.find((a) => a.ply === S.cursor);
}
function reviewMark(row) {
  const best = JSON.parse(row.before_json).lines[0]?.pv[0],
    verdict = JSON.parse(row.verdict);
  if (best === row.uci)
    return { label: "Лучший ход", kind: "best", symbol: "★" };
  const marks = {
      "Грубый зевок": ["blunder", "??"],
      Ошибка: ["mistake", "?"],
      Неточность: ["inaccuracy", "?!"],
      "Один из лучших": ["good", "✓"],
    },
    [kind, symbol] = marks[verdict.label] || ["good", "✓"];
  return { label: verdict.label, kind, symbol };
}
function renderReview() {
  const game = S.reviewGame;
  $("review-panel").hidden = !game;
  if (!game) return;
  document.body.classList.add("reviewing");
  $("review-counter").textContent = `${S.cursor} / ${game.moves.length}`;
  $("review-show-best").hidden = true;
  $("review-return").hidden = true;
  $("review-best").textContent = "";
  $("review-scores").textContent = "";
  $("explanation").innerHTML = "";
  $("back").disabled = S.cursor === 0;
  $("forward").disabled = S.cursor === S.moves.length;
  const row = reviewRow();
  if (row) {
    const mark = reviewMark(row),
      before = JSON.parse(row.before_json),
      after = JSON.parse(row.after_json),
      best = before.lines[0];
    $("review-verdict").innerHTML =
      `<span class="review-symbol ${mark.kind}">${mark.symbol}</span><div><b>${esc(row.san)} — ${esc(mark.label)}</b><small>Stockfish · глубина ${after.lines[0]?.depth ?? "—"}</small></div>`;
    $("review-scores").textContent =
      `${formatScore(before.lines[0])} → ${formatScore(after.lines[0])} · оценка белых`;
    showExplanation(JSON.parse(row.explanation));
    S.arrows = [];
    evaluation(after);
    if (best?.pv[0] && best.pv[0] !== row.uci) {
      $("review-best").textContent =
        `Сильнее было ${best.san[0]}. Потеря оценки: ${(JSON.parse(row.verdict).cp_loss / 100).toFixed(2)} пешки.`;
      $("review-show-best").hidden = false;
    } else
      $("review-best").textContent =
        "Это первая рекомендация движка в сохранённом анализе.";
  } else {
    $("review-verdict").textContent = S.cursor
      ? `${S.sans[S.cursor - 1]} · ожидает анализа`
      : "Начальная позиция";
    if (S.cursor === 0 && game.analyses.length)
      evaluation(JSON.parse(game.analyses[0].before_json));
  }
  $("review-history").innerHTML = game.moves
    .map((m, i) => {
      const record = game.analyses.find((a) => a.ply === i + 1),
        mark = record && reviewMark(record);
      return `<button data-review-ply="${i + 1}" class="${i + 1 === S.cursor ? "active" : ""}"><span>${i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : ""}${esc(m.san)}</span>${mark ? `<span class="review-mini ${mark.kind}" title="${esc(mark.label)}">${mark.symbol}</span><small>${esc(formatScore(JSON.parse(record.after_json).lines[0]))}</small>` : ""}</button>`;
    })
    .join("");
  $("review-history")
    .querySelectorAll("button")
    .forEach(
      (b) => (b.onclick = safe(() => jump(Number(b.dataset.reviewPly)))),
    );
  const active = $("review-history").querySelector(".active");
  if (active)
    $("review-history").scrollTop = Math.max(
      0,
      active.offsetTop -
        $("review-history").offsetTop -
        $("review-history").clientHeight / 2,
    );
  renderBoard();
}
$("review-show-best").onclick = safe(async () => {
  const row = reviewRow();
  if (!row) return;
  const best = JSON.parse(row.before_json).lines[0],
    revision = S.revision;
  const position = await api("/position", { fen: row.fen });
  if (revision !== S.revision || !S.reviewGame) return;
  S.preview = { position, last: row.uci };
  S.arrows = [[best.pv[0].slice(0, 2), best.pv[0].slice(2, 4), "green"]];
  evaluation(JSON.parse(row.before_json), position.fen);
  renderBoard();
  $("review-return").hidden = false;
  $("review-best").textContent =
    `До хода ${row.san}: зелёная стрелка — ${best.san[0]}. Вариант: ${best.san.slice(0, 6).join(" ")}.`;
});
$("review-return").onclick = safe(() => jump(S.cursor));
async function analyzeReview() {
  if (!S.reviewGame || reviewJob) return;
  const game = S.reviewGame;
  reviewJob = { id: game.id };
  $("review-analyze").disabled = true;
  try {
    await runJob(
      "/games/" + game.id + "/analyze",
      { seconds: Number($("seconds").value), depth: Number($("depth").value) },
      (status) => {
        $("review-progress").textContent =
          `Анализ ${Math.round(status.progress * 100)}%`;
      },
    );
    const updated = await api("/games/" + game.id);
    if (currentGame?.id === game.id) currentGame = updated;
    if (S.reviewGame?.id === game.id) {
      S.reviewGame = updated;
      clearFeedback();
      renderReview();
    }
    $("review-progress").textContent = "Все ходы оценены";
  } finally {
    reviewJob = null;
    $("review-analyze").disabled = false;
  }
}
$("review-analyze").onclick = safe(analyzeReview);
async function replay(ply = 0) {
  S.course = null;
  S.exercise = null;
  S.puzzle = null;
  lastPuzzleMode = false;
  $("study-title").textContent = currentGame.white + " — " + currentGame.black;
  $("plan").textContent =
    "Воспроизведение завершённой партии. Любое ответвление остаётся локальным.";
  $("mode").value = "Свободное исследование";
  await load(
    currentGame.initial_fen,
    currentGame.moves.map((m) => m.uci),
    currentGame.moves.map((m) => m.san),
  );
  S.reviewGame = currentGame;
  S.cursor = Math.max(0, Math.min(ply, S.moves.length));
  document.body.classList.add("reviewing");
  await refresh();
  window.AcademyUI.showTab("coach");
  await page("study");
  if (!currentGame.analyzed) safe(analyzeReview)();
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
  ctx.fillStyle = "#a1ab90";
  ctx.fillText(
    "Оценка белых: центр 0, диапазон ±5 пешек (мат ограничен краем графика)",
    10,
    16,
  );
  if (!rows.length) return;
  ctx.strokeStyle = "#95bb4a";
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
  if (!h.browser) {
    document
      .querySelectorAll('#nav [data-page="puzzles"],#nav [data-page="profile"]')
      .forEach((b) => (b.hidden = true));
    if ($("profile-shortcut"))
      $("profile-shortcut").onclick = safe(() => page("progress"));
  }
  const prefs = await api("/preferences");
  $("rating").value = prefs.rating;
  if ($("profile-name")) $("profile-name").textContent = prefs.username;
  if ($("profile-rating"))
    $("profile-rating").textContent = prefs.rating + " · Rapid";
  $("username").value = prefs.username;
  await load(START);
  await home();
  await notes();
  updateStudyChrome();
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
                window.AcademyUI.showTab?.("engine");
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

let lastPuzzleMode = false;
function updateStudyChrome() {
  if (!S.position) return;
  const side = $("play-color").value,
    opposite = side === "black" ? "white" : "black";
  $("player-label").textContent = $("profile-name")?.textContent || "Вы";
  $("player-side").textContent =
    side === "both" ? "Обе стороны" : side === "black" ? "Чёрные" : "Белые";
  $("opponent-label").textContent = S.course
    ? "Соперник по варианту"
    : "Другая сторона";
  $("opponent-side").textContent = opposite === "white" ? "Белые" : "Чёрные";
  $("board-state").textContent = S.position.terminal
    ? S.position.result
    : S.position.turn === side || side === "both"
      ? "Ваш ход"
      : "Ход соперника";
  if (S.reviewGame) {
    $("player-label").textContent = S.flip
      ? S.reviewGame.black
      : S.reviewGame.white;
    $("opponent-label").textContent = S.flip
      ? S.reviewGame.white
      : S.reviewGame.black;
    $("board-state").textContent = S.position.terminal
      ? S.position.result
      : `Ход ${S.position.turn === "white" ? "белых" : "чёрных"}`;
  }
  if (S.course) {
    const phase = S.course.guide?.phases.find((p) => S.cursor < p.until);
    $("chapter-progress").textContent = phase
      ? phase.name
      : `Ход ${Math.floor(S.cursor / 2) + 1}`;
  }
}
function renderVariations() {
  if (!$("variation-search"))
    $("variations").insertAdjacentHTML(
      "beforebegin",
      '<input id="variation-search" placeholder="Найти главу или ECO…" aria-label="Поиск главы дебюта">',
    );
  let shown = 80;
  const draw = () => {
    const q = $("variation-search").value.toLowerCase(),
      all = S.course.variations.filter((v) =>
        [v.name, v.eco, v.source_name].join(" ").toLowerCase().includes(q),
      );
    $("variations").innerHTML =
      all
        .slice(0, shown)
        .map(
          (v, i) =>
            `<button data-variation="${esc(v.id)}" class="${v.id === S.line?.id ? "active" : ""}"><span>${esc(v.name)}</span><small>${v.eco || S.course.eco} · ${Math.ceil(v.pgn.split(/\s+/).length / 2)} ходов</small></button>`,
        )
        .join("") +
      (all.length > shown
        ? `<button id="more-variations">Ещё главы (${shown} из ${all.length}) ↓</button>`
        : "");
    $("more-variations")?.addEventListener("click", () => {
      shown += 80;
      draw();
    });
    document.querySelectorAll("[data-variation]").forEach(
      (b) =>
        (b.onclick = safe(async () => {
          if (busy) return;
          S.line = S.course.variations.find(
            (v) => String(v.id) === b.dataset.variation,
          );
          S.exercise = null;
          S.puzzle = null;
          await load(START);
          draw();
          await automatic();
        })),
    );
  };
  $("variation-search").value = "";
  $("variation-search").oninput = () => {
    shown = 80;
    draw();
  };
  draw();
  const g = S.course.guide;
  $("plan").hidden = Boolean(g);
  $("course-overview").innerHTML = g
    ? `<span class="tag-green">${S.course.variations.length} ГЛАВ · ОБА ЦВЕТА</span><details ${$("play-color").value !== "black" ? "open" : ""}><summary>План за белых</summary><p>${esc(g.white)}</p></details><details ${$("play-color").value === "black" ? "open" : ""}><summary>План за чёрных</summary><p>${esc(g.black)}</p></details><details><summary>Пешечная структура</summary><p>${esc(g.structure)}</p></details><details><summary>Типичные ошибки</summary><p>${esc(g.mistakes)}</p></details><details><summary>Переход в миттельшпиль</summary><p>${esc(g.transition)}</p></details><button id="extend-line">Продолжить глубже со Stockfish</button>`
    : `<p>${esc(S.course.plan)}</p>`;
  $("variations").before($("course-overview"));
  $("extend-line")?.addEventListener(
    "click",
    safe(async () => {
      if (busy) return;
      S.hint = true;
      await analyze();
      notice(
        "Рассчитанные продолжения доступны в панели анализа. Нажмите на ход, чтобы исследовать ветку на любой глубине.",
      );
    }),
  );
}
function choosePromotion(options) {
  return new Promise((resolve) => {
    const dialog = $("promotion-dialog"),
      side = S.position.turn === "white" ? "w" : "b";
    $("promotion-options").innerHTML = ["q", "r", "b", "n"]
      .filter((p) => options.some((m) => m.uci.endsWith(p)))
      .map(
        (p) =>
          `<button data-promotion="${p}" aria-label="${{ q: "Ферзь", r: "Ладья", b: "Слон", n: "Конь" }[p]}"><img src="${window.AcademyUI.pieceSrc(side === "w" ? p.toUpperCase() : p)}" alt=""></button>`,
      )
      .join("");
    const finish = (value) => {
      dialog.close();
      dialog.oncancel = null;
      dialog.onkeydown = null;
      resolve(value);
    };
    dialog
      .querySelectorAll("[data-promotion]")
      .forEach((b) => (b.onclick = () => finish(b.dataset.promotion)));
    dialog.oncancel = (e) => {
      e.preventDefault();
      finish(null);
    };
    dialog.onkeydown = (e) => {
      if ("qrbn".includes(e.key.toLowerCase())) finish(e.key.toLowerCase());
    };
    dialog.showModal();
  });
}
function boardKeyboard(event, sq) {
  const keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
  if (!(event.key in keys)) return;
  event.preventDefault();
  const squares = [...$("board").children],
    index = squares.findIndex((b) => b.dataset.square === sq);
  squares[Math.max(0, Math.min(63, index + keys[event.key]))]?.focus();
}
function startDrag(event, sq) {
  if (event.button !== 0 || busy || !S.position.pieces[sq]) return;
  const piece = S.position.pieces[sq],
    start = { x: event.clientX, y: event.clientY },
    ghost = $("drag-ghost");
  let dragging = false;
  const move = (e) => {
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7)
      dragging = true;
    if (!dragging) return;
    e.preventDefault();
    ghost.hidden = false;
    ghost.style.left = e.clientX + "px";
    ghost.style.top = e.clientY + "px";
    ghost.innerHTML = `<img src="${window.AcademyUI.pieceSrc(piece)}" alt="">`;
    $("board")
      .querySelector(`[data-square="${sq}"]`)
      ?.classList.add("drag-source");
  };
  const up = (e) => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", cancel);
    ghost.hidden = true;
    document.querySelector(".drag-source")?.classList.remove("drag-source");
    if (!dragging) return;
    suppressClickUntil = Date.now() + 350;
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-square]")?.dataset.square;
    const choices = S.position.legal.filter((m) =>
      m.uci.startsWith(sq + (target || "??")),
    );
    if (choices.length)
      safe(async () => {
        const suffix =
          choices.length > 1 ? await choosePromotion(choices) : null;
        if (choices.length > 1 && !suffix) return;
        await play(choices.find((m) => !suffix || m.uci.endsWith(suffix)).uci);
      })();
    else {
      S.selected = sq;
      renderBoard();
    }
  };
  const cancel = () => {
    dragging = false;
    up(event);
  };
  document.addEventListener("pointermove", move, { passive: false });
  document.addEventListener("pointerup", up, { once: true });
  document.addEventListener("pointercancel", cancel, { once: true });
}
async function puzzleHome() {
  const p = await api("/puzzles/stats");
  $("puzzle-stats").innerHTML =
    `<b>${p.solved}</b> решено · <b>${p.attempts}</b> попыток · локально доступно ${p.offline.toLocaleString("ru-RU")} позиций. Без дневного лимита.`;
}
async function newPuzzle() {
  if (busy) return;
  const button = $("new-puzzle");
  button.disabled = true;
  button.textContent = "Подбираю задачу…";
  try {
    const e = await api("/puzzles/next", {
      angle: $("puzzle-theme").value,
      difficulty: $("puzzle-difficulty").value,
    });
    lastPuzzleMode = true;
    await startExercise(e);
    S.puzzle = { index: 0, line: e.line };
    S.flip = S.position.turn === "black";
    $("play-color").value = S.position.turn;
    renderBoard();
    updateStudyChrome();
    $("study-title").textContent = "Тактическая задача · " + e.rating;
    $("study-kind").textContent =
      "LICHESS · " + (e.offline ? "ЛОКАЛЬНЫЙ НАБОР" : "НОВАЯ ПОЗИЦИЯ");
    $("plan").textContent =
      "Рассчитайте весь вариант. Правильный ход сохраняет задачу, ошибка вернёт позицию для новой попытки.";
    $("task").textContent =
      "Найдите сильный ход за " +
      (S.position.turn === "white" ? "белых" : "чёрных") +
      ".";
    $("course-overview").innerHTML =
      "<p>В задачах нет дневного лимита. Тема скрыта до решения, чтобы не выдавать идею.</p>";
    if (e.warning) notice(e.warning);
  } finally {
    button.disabled = false;
    button.textContent = "Следующая задача →";
  }
}
$("new-puzzle").onclick = safe(newPuzzle);
async function profileHome() {
  const profiles = await api("/profiles");
  for (const platform of ["chesscom", "lichess"]) {
    const p = profiles[platform],
      target = $(platform + "-profile");
    if (!p) {
      target.innerHTML = '<p class="muted">Профиль пока не подключён</p>';
      continue;
    }
    target.innerHTML = `<div class="profile-data"><b>${esc(p.username)}</b><p>Публичный профиль подключён</p><p>${
      Object.entries(p.ratings || {})
        .map(
          ([control, rating]) =>
            esc(control) + ": <b>" + Number(rating) + "</b>",
        )
        .join(" · ") || "Рейтинги пока не опубликованы"
    }</p><small>Обновлено: ${new Date(p.updated * 1000).toLocaleString("ru-RU")}</small></div>`;
    $("connect-" + platform + "-name").value = p.username;
  }
}
async function withButton(id, action) {
  const b = $(id),
    text = b.textContent;
  b.disabled = true;
  b.textContent = "Подключаю…";
  try {
    return await action();
  } finally {
    b.disabled = false;
    b.textContent = text;
  }
}
for (const platform of ["chesscom", "lichess"]) {
  $("connect-" + platform).onclick = safe(() =>
    withButton("connect-" + platform, async () => {
      const result = await api("/profiles/" + platform, {
        username: $("connect-" + platform + "-name").value,
      });
      $("profile-name").textContent = result.username;
      const prefs = await api("/preferences");
      $("profile-rating").textContent = prefs.rating + " · Rapid";
      $("username").value = prefs.username;
      $("rating").value = prefs.rating;
      await profileHome();
      notice(
        "Публичный профиль подключён. Теперь загрузите завершённые партии.",
      );
    }),
  );
  $("sync-" + platform).onclick = safe(() =>
    withButton("sync-" + platform, async () => {
      const result = await api("/profiles/" + platform + "/sync", {
        username: $("connect-" + platform + "-name").value,
      });
      await games();
      notice(
        "Обработано " +
          result.ids.length +
          " завершённых партий. Дубли не добавляются; разбор доступен в библиотеке.",
      );
      await page("games");
    }),
  );
}
