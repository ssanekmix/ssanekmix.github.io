import {
  Chess,
  START,
  SQUARES,
  board,
  play,
  uci,
  key,
  snapshot,
  terminal,
  classify,
  explain,
} from "./chess-core.js";
import { Engine } from "./engine.js";
import { openStorage } from "./storage.js";
const now = () => Date.now() / 1000,
  clone = (value) => structuredClone(value),
  stages = [
    [300, "Безопасность фигур, угрозы, развитие и рокировка"],
    [600, "Основные дебюты, тактика и базовые окончания"],
    [900, "Пешечные структуры, планы и расчёт"],
    [1200, "Репертуар, позиционная игра и устойчивость"],
    [1500, "Глубокие варианты и сложные окончания"],
    [1800, "Самостоятельная подготовка и глубокий анализ"],
  ];
function blank() {
  return {
    version: 1,
    preferences: { rating: 355, username: "Sanekmix" },
    notes: {},
    games: [],
    exercises: [],
    reviews: [],
    attempts: [],
    personal: [],
    cache: {},
    next: { game: 1, exercise: 1 },
  };
}
export async function createRuntime() {
  let releaseLock = () => {};
  if (navigator.locks) {
    const acquired = await new Promise((ok, no) => {
      navigator.locks
        .request(
          "personal-chess-academy-data",
          { ifAvailable: true },
          async (lock) => {
            ok(Boolean(lock));
            if (lock)
              await new Promise((r) => {
                releaseLock = r;
              });
          },
        )
        .catch(no);
    });
    if (!acquired)
      throw Error(
        "Академия уже открыта в другой вкладке. Продолжите там или закройте ту вкладку и обновите эту.",
      );
  }
  const response = await fetch(new URL("./curriculum.json", import.meta.url));
  if (!response.ok) throw Error("Не удалось загрузить учебные материалы");
  const curriculum = await response.json(),
    storage = await openStorage();
  let state = (await storage.read()) || blank();
  if (state.version !== 1)
    throw Error(
      "Хранилище создано более новой версией. Обновите приложение; данные не изменены.",
    );
  const engine = new Engine(),
    jobs = new Map(),
    graph = new Map(),
    authored = {},
    courses = curriculum.courses;
  let ecoData = null,
    taskChain = Promise.resolve(),
    networkChain = Promise.resolve(),
    networkAt = 0,
    networkBlocked = 0;
  function allCourses() {
    return [...courses, ...state.personal];
  }
  function addGraph(course) {
    for (const line of course.variations) {
      let b = new Chess();
      for (const [ply, san] of line.pgn.split(/\s+/).entries()) {
        const k = key(b),
          m = b.move(san),
          u = uci(m),
          branches = graph.get(k) || [];
        if (
          !branches.some(
            (v) =>
              v.uci === u &&
              v.opening_id === course.id &&
              v.variation === line.name,
          )
        )
          branches.push({
            uci: u,
            opening_id: course.id,
            name: course.name,
            variation: line.name,
          });
        graph.set(k, branches);
        if (ply < 6 && curriculum.move_notes[u])
          authored[k + "|" + u] = curriculum.move_notes[u];
      }
    }
  }
  for (const course of allCourses()) addGraph(course);
  async function mutate(fn) {
    const previous = clone(state);
    try {
      const result = fn();
      await storage.write(state);
      return result;
    } catch (e) {
      state = previous;
      throw e;
    }
  }
  function exercise(fen, solution, category, source, game_id = null) {
    const b = board({ fen });
    play(new Chess(b.fen()), solution);
    let row = state.exercises.find(
      (e) =>
        key(board({ fen: e.fen })) === key(b) &&
        e.solution === solution &&
        e.source === source,
    );
    if (!row) {
      row = {
        id: state.next.exercise++,
        fen,
        solution,
        category,
        source,
        game_id,
        due: 0,
        interval: 0,
        ease: 2.5,
        repetitions: 0,
      };
      state.exercises.push(row);
    }
    return row;
  }
  await mutate(() => {
    for (const lesson of curriculum.lessons)
      if (lesson.solution)
        exercise(
          lesson.fen,
          lesson.solution,
          lesson.category,
          "Урок: " + lesson.title,
        );
  });
  async function eco() {
    if (!ecoData) {
      const r = await fetch(new URL("./eco.json", import.meta.url));
      if (!r.ok)
        throw Error(
          "База ECO пока не загружена. Повторите при наличии интернета.",
        );
      ecoData = await r.json();
    }
    return ecoData;
  }
  async function courseById(id) {
    let course = allCourses().find((c) => c.id === id);
    if (!course && id.startsWith("eco-")) {
      const e = (await eco()).find((c) => c.id === id);
      if (e) {
        course = {
          ...e,
          color: "white",
          difficulty: 2,
          family: "Открытая база",
          plan: "Исходное название и последовательность Lichess CC0. Подробный авторский урок для этой ветки не подготовлен.",
          variations: [
            {
              id: e.id + "-line",
              opening_id: e.id,
              name: "Основная последовательность",
              pgn: e.pgn,
            },
          ],
        };
        addGraph(course);
      }
    }
    if (!course) throw Error("Дебют не найден");
    return clone(course);
  }
  function check(job) {
    if (job.cancelled) throw Error("Анализ остановлен");
  }
  function submit(fn) {
    if (
      [...jobs.values()].filter((j) => ["queued", "running"].includes(j.status))
        .length >= 12
    )
      throw Error(
        "Очередь заполнена. Дождитесь расчёта или остановите задачу.",
      );
    const id = crypto.randomUUID(),
      job = { id, status: "queued", progress: 0, cancelled: false };
    jobs.set(id, job);
    taskChain = taskChain.then(async () => {
      try {
        check(job);
        job.status = "running";
        const result = await fn(job);
        check(job);
        job.result = result;
        job.progress = 1;
        job.status = "done";
      } catch (e) {
        job.status = job.cancelled ? "cancelled" : "failed";
        job.error = e.message;
        console.error("Analysis job:", e.message);
      } finally {
        const finished = [...jobs.values()].filter(
          (j) => !["queued", "running"].includes(j.status),
        );
        for (const old of finished.slice(0, -100)) jobs.delete(old.id);
      }
    });
    return { job_id: id };
  }
  async function analyze(b, params, job, roots = []) {
    check(job);
    const cacheKey =
      "engine:" + JSON.stringify([b.fen(), b.history(), params, roots]);
    if (state.cache[cacheKey]) return clone(state.cache[cacheKey].data);
    const result = await engine.analyze(b, params, job, roots);
    check(job);
    await mutate(() => {
      state.cache[cacheKey] = { at: now(), data: result };
      const keys = Object.keys(state.cache);
      for (const k of keys.slice(0, -350)) delete state.cache[k];
    });
    return clone(result);
  }
  async function compare(data, job) {
    const b = board(data),
      before = await analyze(b, data, job);
    if (!data.uci) return before;
    const m = play(new Chess(b.fen()), data.uci),
      afterBoard = board(data);
    play(afterBoard, data.uci);
    const after = await analyze(afterBoard, data, job),
      verdict = classify(before, after, b.turn());
    return {
      before,
      after,
      verdict,
      explanation: explain(b, uci(m), authored, after, verdict),
    };
  }
  function schedule(e, quality, value) {
    const ease = Math.max(
      1.3,
      e.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    );
    const reps = quality >= 3 ? e.repetitions + 1 : 0,
      interval =
        quality >= 3
          ? reps === 1
            ? 1
            : reps === 2
              ? 6
              : e.interval * ease
          : 10 / 1440;
    Object.assign(e, {
      ease,
      repetitions: reps,
      interval,
      due: now() + interval * 86400,
    });
    state.reviews.push({ exercise_id: e.id, at: now(), quality, uci: value });
    return { due: e.due, interval_days: interval };
  }
  function parseGames(text) {
    if (typeof text !== "string" || text.length > 2_000_000)
      throw Error("PGN должен быть текстом до 2 МБ");
    // Split only top-level headers after a blank line following movetext.
    const chunks = text
      .trim()
      .split(/\n\s*\n(?=\s*\[)/)
      .filter((t) => t.trim());
    if (chunks.length > 50) throw Error("Не более 50 партий за один импорт");
    const result = [];
    for (const chunk of chunks) {
      const b = new Chess();
      try {
        b.loadPgn(chunk, { strict: true });
      } catch (e) {
        throw Error("Повреждённый PGN: " + e.message);
      }
      const headers = b.getHeaders(),
        outcome = headers.Result,
        moves = b.history({ verbose: true });
      let stripped = chunk
        .replace(/\{[^}]*\}/gs, " ")
        .replace(/;[^\n]*/g, "")
        .trim();
      if (
        !["1-0", "0-1", "1/2-1/2"].includes(outcome) ||
        !/(?:1-0|0-1|1\/2-1\/2)\s*$/.test(stripped)
      )
        throw Error(
          "Только завершённые PGN с результатом 1-0, 0-1 или 1/2-1/2.",
        );
      const marker = stripped.match(/(1-0|0-1|1\/2-1\/2)\s*$/)[1];
      if (marker !== outcome)
        throw Error("Результат PGN не совпадает с заголовком");
      if (headers.Variant && !["Standard", "Chess"].includes(headers.Variant))
        throw Error("Поддерживаются только стандартные шахматы");
      if (!moves.length || moves.length > 1000)
        throw Error("В партии должно быть от 1 до 1000 полуходов");
      const initial = moves[0].before;
      board({ fen: initial });
      const end = terminal(b);
      if (end.terminal && end.result !== outcome)
        throw Error("Результат противоречит конечной позиции");
      const comments = b.getComments(),
        clockByFen = new Map(
          comments.map((c) => {
            const m = c.comment.match(/\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]/);
            return [
              c.fen,
              m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null,
            ];
          }),
        );
      result.push({
        pgn: b.pgn(),
        white: headers.White || "?",
        black: headers.Black || "?",
        result: outcome,
        played: headers.Date || "?",
        initial_fen: initial,
        moves: moves.map((m) => ({
          uci: uci(m),
          san: m.san,
          clock: clockByFen.get(m.after) ?? null,
        })),
        signature: JSON.stringify([headers, moves.map(uci)]),
      });
    }
    if (!result.length) throw Error("PGN не содержит партий");
    return result;
  }
  function storeParsed(parsed, source = "PGN", meta = {}) {
    const ids = [];
    for (const row of parsed) {
      let game = state.games.find((g) => g.signature === row.signature);
      if (!game) {
        game = {
          ...row,
          id: state.next.game++,
          source,
          meta,
          analyzed: 0,
          analyses: [],
        };
        state.games.push(game);
      }
      ids.push(game.id);
    }
    return ids;
  }
  async function web(url, params = {}, ttl = 86400) {
    const cacheKey = "web:" + url + "?" + new URLSearchParams(params),
      cached = state.cache[cacheKey];
    if (cached && now() - cached.at < ttl)
      return {
        data: clone(cached.data),
        at: cached.at,
        cached: true,
        stale: false,
      };
    const task = async () => {
      try {
        if (now() < networkBlocked)
          throw Error("Лимит сервиса: повторите позже.");
        await new Promise((r) =>
          setTimeout(r, Math.max(0, 1050 - (Date.now() - networkAt))),
        );
        const abort = new AbortController(),
          timeout = setTimeout(() => abort.abort(), 20000);
        let response;
        try {
          response = await fetch(url + "?" + new URLSearchParams(params), {
            signal: abort.signal,
            credentials: "omit",
          });
        } finally {
          clearTimeout(timeout);
          networkAt = Date.now();
        }
        if (response.status === 429) {
          networkBlocked =
            now() +
            Math.max(
              60,
              Math.min(3600, Number(response.headers.get("Retry-After")) || 60),
            );
          throw Error("Лимит сервиса (429). Подождите не меньше минуты.");
        }
        if (!response.ok) throw Error("HTTP " + response.status);
        const data = await response.json(),
          at = now();
        await mutate(() => {
          state.cache[cacheKey] = { at, data };
        });
        return { data, at, cached: false, stale: false };
      } catch (e) {
        if (cached)
          return {
            data: clone(cached.data),
            at: cached.at,
            cached: true,
            stale: true,
            warning: e.message,
          };
        throw Error(
          "Источник недоступен в браузере (сеть, CORS или отказ сервиса). Локальные уроки и PGN работают. " +
            e.message,
        );
      }
    };
    const result = networkChain.then(task);
    networkChain = result.catch(() => {});
    return result;
  }
  async function gameAnalysis(id, params, job) {
    const game = state.games.find((g) => g.id === id);
    if (!game) throw Error("Партия не найдена");
    const b = board({ fen: game.initial_fen }),
      records = [],
      pending = [],
      username = state.preferences.username.toLowerCase(),
      side =
        game.white.toLowerCase() === username
          ? "w"
          : game.black.toLowerCase() === username
            ? "b"
            : null;
    let before = await analyze(b, { ...params, multipv: 3 }, job);
    for (const [i, move] of game.moves.entries()) {
      check(job);
      const fen = b.fen(),
        color = b.turn(),
        original = board({ fen }),
        m = play(b, move.uci),
        after = await analyze(b, { ...params, multipv: 3 }, job),
        verdict = classify(before, after, color),
        commentary = explain(original, move.uci, authored, after, verdict);
      records.push({
        game_id: id,
        ply: i + 1,
        fen,
        uci: move.uci,
        san: m.san,
        before_json: JSON.stringify(before),
        after_json: JSON.stringify(after),
        verdict: JSON.stringify(verdict),
        explanation: JSON.stringify(commentary),
      });
      if (
        (side === null || side === color) &&
        ["Неточность", "Ошибка", "Грубый зевок"].includes(verdict.label) &&
        before.lines[0].pv.length
      ) {
        const category =
          before.lines[0].mate !== null
            ? "Матовая атака"
            : SQUARES.filter((s) => original.get(s)).length <= 10
              ? "Эндшпиль"
              : i < 20
                ? "Дебют"
                : "Тактика";
        pending.push({ fen, solution: before.lines[0].pv[0], category });
      }
      before = after;
      job.progress = (i + 1) / game.moves.length;
    }
    check(job);
    await mutate(() => {
      game.analyses = records;
      game.analyzed = 1;
      for (const e of pending)
        exercise(e.fen, e.solution, e.category, "Партия " + id, id);
    });
    return {
      game_id: id,
      plies: records.length,
      exercise_candidates: pending.length,
      summary:
        "Разбор завершён. Повторите найденные критические позиции; предварительные оценки можно углубить.",
    };
  }
  function progress() {
    const reviews = state.reviews.slice(-100),
      attempts = state.attempts.slice(-100),
      count = reviews.length + attempts.length,
      success =
        reviews.filter((r) => r.quality >= 3).length +
        attempts.filter((a) => a.success).length,
      rate = count ? success / count : null;
    const demonstrated =
        rate >= 0.75 ? Math.min(5, Math.floor(success / 25)) : 0,
      ratingStage = Math.max(
        0,
        stages.findLastIndex((s) => s[0] <= state.preferences.rating),
      ),
      stage = Math.min(ratingStage, demonstrated),
      mistakes = {};
    for (const e of state.exercises.filter((e) => e.game_id))
      mistakes[e.category] = (mistakes[e.category] || 0) + 1;
    const entries = Object.entries(mistakes).sort((a, b) => b[1] - a[1]),
      analyses = state.games.flatMap((g) => g.analyses),
      ratings = [],
      openingResults = {},
      clocks = [],
      username = state.preferences.username.toLowerCase();
    for (const g of state.games) {
      const side =
        g.white.toLowerCase() === username
          ? "white"
          : g.black.toLowerCase() === username
            ? "black"
            : null;
      if (!side) continue;
      if (g.meta?.[side]?.rating)
        ratings.push({
          date: g.meta.end_time,
          rating: g.meta[side].rating,
          control: g.meta.time_class,
          side,
        });
      const remain = g.moves
        .filter(
          (m, i) => (i % 2 === 0) === (side === "white") && m.clock !== null,
        )
        .map((m) => m.clock);
      if (remain.length)
        clocks.push({ game_id: g.id, lowest_seconds: Math.min(...remain) });
      let found = null,
        b = board({ fen: g.initial_fen });
      for (const m of g.moves) {
        play(b, m.uci);
        const candidates = [
          ...new Set((graph.get(key(b)) || []).map((v) => v.opening_id)),
        ];
        if (candidates.length === 1)
          found = allCourses().find((c) => c.id === candidates[0]);
      }
      if (found) {
        const k = found.name + " · " + side,
          stat = openingResults[k] || { games: 0, wins: 0, draws: 0 };
        stat.games++;
        stat.wins += Number(g.result === (side === "white" ? "1-0" : "0-1"));
        stat.draws += Number(g.result === "1/2-1/2");
        openingResults[k] = stat;
      }
    }
    return {
      rating: state.preferences.rating,
      stage,
      stages,
      recommendation: stages[stage][1],
      weakest: entries[0]?.[0] || "Безопасность фигур",
      attempts: count,
      success_rate: rate,
      due: state.exercises.filter((e) => e.due <= now()).length,
      mistakes: entries.map(([category, count]) => ({ category, count })),
      blunders: analyses.filter(
        (a) => JSON.parse(a.verdict).label === "Грубый зевок",
      ).length,
      analyzed_plies: analyses.length,
      ratings: ratings.sort((a, b) => a.date - b.date),
      opening_results: openingResults,
      clocks,
      note:
        count < 30
          ? "Выборка недостаточна для устойчивых выводов."
          : "Рекомендации основаны на последних ответах; рост рейтинга не гарантирован.",
    };
  }
  function exportData() {
    return {
      format: "personal-chess-academy-browser",
      version: 1,
      exported_at: new Date().toISOString(),
      state: { ...clone(state), cache: {} },
    };
  }
  function validateBackup(payload) {
    if (
      payload?.format !== "personal-chess-academy-browser" ||
      payload.version !== 1 ||
      payload.state?.version !== 1
    )
      throw Error(
        "Нужна резервная копия браузерной версии академии. Копия Python-приложения имеет другой формат.",
      );
    const s = payload.state;
    for (const field of [
      "games",
      "exercises",
      "reviews",
      "attempts",
      "personal",
    ])
      if (!Array.isArray(s[field]))
        throw Error("Повреждённая таблица: " + field);
    if (
      !s.notes ||
      typeof s.notes !== "object" ||
      Array.isArray(s.notes) ||
      !s.preferences ||
      !Number.isInteger(s.preferences.rating) ||
      s.preferences.rating < 100 ||
      s.preferences.rating > 4000 ||
      !/^[A-Za-z0-9_-]{2,50}$/.test(s.preferences.username) ||
      !s.next ||
      !Number.isInteger(s.next.game) ||
      !Number.isInteger(s.next.exercise)
    )
      throw Error("Повреждённая структура копии");
    for (const note of Object.values(s.notes)) {
      if (typeof note.text !== "string") throw Error("Повреждённая заметка");
      board({ fen: note.fen });
    }
    const ids = new Set();
    for (const g of s.games) {
      if (
        !Number.isInteger(g.id) ||
        ids.has(g.id) ||
        !Array.isArray(g.analyses)
      )
        throw Error("Повреждённая партия");
      ids.add(g.id);
      const parsed = parseGames(g.pgn)[0];
      if (
        JSON.stringify(parsed.moves.map((m) => m.uci)) !==
          JSON.stringify(g.moves.map((m) => m.uci)) ||
        parsed.initial_fen !== g.initial_fen
      )
        throw Error("Партия не совпадает с PGN");
      for (const a of g.analyses) {
        board({ fen: a.fen });
        for (const f of ["before_json", "after_json", "verdict", "explanation"])
          JSON.parse(a[f]);
      }
    }
    const exerciseIds = new Set();
    for (const e of s.exercises) {
      if (
        !Number.isInteger(e.id) ||
        exerciseIds.has(e.id) ||
        !Number.isFinite(e.due) ||
        !Number.isFinite(e.interval) ||
        !Number.isFinite(e.ease) ||
        !Number.isInteger(e.repetitions) ||
        typeof e.source !== "string"
      )
        throw Error("Повреждённое упражнение");
      exerciseIds.add(e.id);
      play(board({ fen: e.fen }), e.solution);
      if (e.game_id && !ids.has(e.game_id))
        throw Error("Нарушена ссылка на партию");
    }
    for (const r of s.reviews)
      if (
        !exerciseIds.has(r.exercise_id) ||
        !Number.isFinite(r.quality) ||
        r.quality < 0 ||
        r.quality > 5
      )
        throw Error("Повреждённая история повторений");
    for (const c of s.personal) {
      if (
        typeof c.id !== "string" ||
        !Array.isArray(c.variations) ||
        typeof c.name !== "string"
      )
        throw Error("Повреждённый репертуар");
      for (const v of c.variations) {
        const b = new Chess();
        for (const san of v.pgn.split(/\s+/)) b.move(san);
      }
    }
    if (
      s.next.game <= Math.max(0, ...ids) ||
      s.next.exercise <= Math.max(0, ...exerciseIds)
    )
      throw Error("Повреждены идентификаторы копии");
    return { ...clone(s), cache: {} };
  }
  async function api(path, data) {
    const url = new URL(path, "https://academy.local"),
      p = url.pathname,
      q = url.searchParams;
    if (p === "/health")
      return {
        ok: true,
        engine: typeof WebAssembly !== "undefined",
        browser: true,
      };
    if (p === "/position") {
      const b = board(data),
        position = snapshot(b);
      return {
        ...position,
        branches: clone((graph.get(key(b)) || []).slice(0, 80)),
        note: state.notes[key(b)]?.text || "",
      };
    }
    if (p === "/move") {
      const b = board(data),
        commentary = explain(b, data.uci, authored),
        m = play(b, data.uci);
      return { position: snapshot(b), explanation: commentary, san: m.san };
    }
    if (p === "/analyze") {
      board(data);
      return submit((job) => compare(data, job));
    }
    if (p.startsWith("/jobs/")) {
      const id = p.split("/")[2],
        job = jobs.get(id);
      if (!job)
        throw Error(
          "Задача не найдена после перезапуска; запустите расчёт снова.",
        );
      if (p.endsWith("/cancel")) {
        if (["queued", "running"].includes(job.status)) {
          job.cancelled = true;
          if (job.status === "running") engine.stop();
        }
        return { ok: true };
      }
      return clone(job);
    }
    if (p === "/openings") {
      return clone(
        allCourses()
          .filter(
            (c) =>
              (!q.get("color") || c.color === q.get("color")) &&
              (!q.get("family") || c.family === q.get("family")) &&
              [c.name, c.eco, c.plan]
                .join(" ")
                .toLowerCase()
                .includes((q.get("q") || "").toLowerCase()),
          )
          .map((c) => {
            const attempts = state.attempts.filter(
              (a) => a.opening_id === c.id,
            );
            return {
              ...c,
              progress: attempts.length
                ? {
                    total: attempts.length,
                    success: attempts.filter((a) => a.success).length,
                  }
                : null,
            };
          }),
      );
    }
    if (p.startsWith("/openings/"))
      return courseById(decodeURIComponent(p.slice(10)));
    if (p === "/eco")
      return clone(
        (await eco())
          .filter((c) =>
            (c.name + " " + c.eco)
              .toLowerCase()
              .includes((q.get("q") || "").toLowerCase()),
          )
          .slice(0, 100),
      );
    if (p === "/notes") {
      if (data) {
        const b = board(data);
        if (typeof data.text !== "string" || data.text.length > 20000)
          throw Error("Заметка превышает 20 000 символов");
        await mutate(() => {
          state.notes[key(b)] = {
            position_id: key(b),
            fen: b.fen(),
            text: data.text,
            saved: 1,
          };
        });
        return { ok: true };
      }
      return clone(Object.values(state.notes).reverse());
    }
    if (p === "/train") {
      const b = board(data);
      play(new Chess(b.fen()), data.uci);
      const e = data.exercise_id
        ? state.exercises.find((e) => e.id === data.exercise_id)
        : null;
      if (data.exercise_id && (!e || key(board({ fen: e.fen })) !== key(b)))
        throw Error("Позиция не соответствует упражнению");
      return submit(async (job) => {
        const result = await compare(data, job),
          accepted = Boolean(
            e?.solution === data.uci || result.verdict.accepted,
          );
        let scheduled = null;
        check(job);
        await mutate(() => {
          if (e)
            scheduled = schedule(
              e,
              accepted ? (data.hint ? 3 : 5) : 1,
              data.uci,
            );
          else
            state.attempts.push({
              opening_id: data.opening_id,
              position: key(b),
              at: now(),
              success: accepted,
              mode: data.mode,
            });
        });
        return { ...result, accepted, schedule: scheduled };
      });
    }
    if (p === "/opponent") {
      const b = board(data);
      if (terminal(b).terminal) return { uci: null, terminal: true };
      const good = Number(data.good ?? 0.7),
        ordinary = Number(data.ordinary ?? 0.25);
      if (good < 0 || ordinary < 0 || good + ordinary > 1)
        throw Error("Проверьте вероятности: сумма не больше 1");
      return submit(async (job) => {
        const roots = [
            ...new Set(
              (graph.get(key(b)) || [])
                .filter(
                  (v) => !data.opening_id || v.opening_id === data.opening_id,
                )
                .map((v) => v.uci),
            ),
          ],
          r = await analyze(
            b,
            { seconds: 0.15, depth: 14, multipv: 8 },
            job,
            roots,
          ),
          roll = Math.random(),
          i =
            roll < good
              ? 0
              : Math.min(
                  r.lines.length - 1,
                  roll < good + ordinary ? 2 : r.lines.length - 1,
                );
        return {
          uci: r.lines[i].pv[0],
          selection: i ? "Альтернативный" : "Сильный",
        };
      });
    }
    if (p === "/lessons")
      return clone(
        curriculum.lessons
          .filter((l) => !q.get("category") || l.category === q.get("category"))
          .sort((a, b) => a.difficulty - b.difficulty),
      );
    if (p === "/exercises")
      return clone(
        state.exercises
          .filter(
            (e) =>
              (q.get("due") === "false" || e.due <= now()) &&
              (!q.get("category") || e.category === q.get("category")),
          )
          .sort((a, b) => a.due - b.due)
          .slice(0, 100),
      );
    if (p === "/exercises/create") {
      const b = board(data);
      if (terminal(b).terminal)
        throw Error("Завершённая позиция не является упражнением на ход");
      return submit(async (job) => {
        const r = await analyze(b, data, job);
        check(job);
        const e = await mutate(() =>
          exercise(
            b.fen(),
            r.lines[0].pv[0],
            "Своя позиция",
            "Личное упражнение",
          ),
        );
        return { id: e.id, warning: r.warning };
      });
    }
    if (p === "/repertoire") {
      if (
        !data.name ||
        data.name.length < 2 ||
        data.name.length > 160 ||
        !["white", "black"].includes(data.color)
      )
        throw Error("Проверьте название и цвет репертуара");
      const b = new Chess();
      try {
        b.loadPgn(data.pgn, { strict: true });
      } catch (e) {
        throw Error("Повреждённый вариант PGN: " + e.message);
      }
      const moves = b.history({ verbose: true });
      if (!moves.length || moves.length > 300 || moves[0].before !== START)
        throw Error(
          "Вариант должен содержать 1–300 полуходов из начальной позиции",
        );
      const digest = async (text) =>
        [
          ...new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(text),
            ),
          ),
        ]
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
      const id =
          "personal-" + (await digest(data.name + data.color)).slice(0, 16),
        line = moves.map((m) => m.san).join(" "),
        title = "Ветка " + (await digest(line)).slice(0, 8);
      let course;
      await mutate(() => {
        course = state.personal.find((c) => c.id === id);
        if (!course) {
          course = {
            id,
            name: data.name,
            eco: data.eco || "",
            color: data.color,
            difficulty: 2,
            family: "Личный репертуар",
            plan: "Личная ветка: проверяйте качество продолжений движком.",
            variations: [],
          };
          state.personal.push(course);
        }
        if (!course.variations.some((v) => v.pgn === line))
          course.variations.push({
            id: id + "-" + title,
            opening_id: id,
            name: title,
            pgn: line,
          });
      });
      addGraph(course);
      return { id };
    }
    if (p === "/progress") return progress();
    if (p === "/preferences") {
      if (data) {
        if (
          !Number.isInteger(data.rating) ||
          data.rating < 100 ||
          data.rating > 4000 ||
          !/^[A-Za-z0-9_-]{2,50}$/.test(data.username)
        )
          throw Error("Проверьте рейтинг и ник");
        await mutate(() => {
          state.preferences = { rating: data.rating, username: data.username };
        });
        return { ok: true };
      }
      return clone(state.preferences);
    }
    if (p === "/games/import") {
      const parsed = parseGames(data.text);
      return { ids: await mutate(() => storeParsed(parsed)) };
    }
    if (p === "/games")
      return clone(
        state.games
          .map(({ id, white, black, result, played, source, analyzed }) => ({
            id,
            white,
            black,
            result,
            played,
            source,
            analyzed,
          }))
          .reverse(),
      );
    if (/^\/games\/\d+/.test(p)) {
      const id = Number(p.split("/")[2]);
      if (!state.games.some((g) => g.id === id))
        throw Error("Партия не найдена");
      if (p.endsWith("/analyze"))
        return submit((job) => gameAnalysis(id, data, job));
      return clone(state.games.find((g) => g.id === id));
    }
    if (p.startsWith("/chesscom/")) {
      const [, , username, year, month] = p.split("/");
      if (!/^[A-Za-z0-9_-]{2,50}$/.test(username))
        throw Error("Некорректный ник Chess.com");
      if (year === "archives")
        return web(
          "https://api.chess.com/pub/player/" +
            username.toLowerCase() +
            "/games/archives",
          {},
          3600,
        );
      if (
        !/^\d{4}$/.test(year) ||
        Number(year) < 2000 ||
        Number(year) > 2100 ||
        Number(month) < 1 ||
        Number(month) > 12
      )
        throw Error("Некорректный месяц");
      const r = await web(
          `https://api.chess.com/pub/player/${username.toLowerCase()}/games/${year}/${month.padStart(2, "0")}`,
          {},
          3600,
        ),
        parsed = [];
      let skipped = 0;
      for (const g of r.data.games || []) {
        if (
          g.rules !== "chess" ||
          !g.end_time ||
          g.end_time > now() ||
          !g.pgn
        ) {
          skipped++;
          continue;
        }
        try {
          parsed.push({
            games: parseGames(g.pgn),
            meta: Object.fromEntries(
              [
                "white",
                "black",
                "time_class",
                "time_control",
                "end_time",
                "url",
              ].map((k) => [k, g[k]]),
            ),
          });
        } catch {
          skipped++;
        }
      }
      const ids = await mutate(() =>
        parsed.flatMap((g) => storeParsed(g.games, "Chess.com", g.meta)),
      );
      return { ids, skipped, stale: r.stale };
    }
    if (p.startsWith("/explorer/")) {
      const b = board(data),
        pool = p.split("/")[2];
      if (!["masters", "beginner", "strong"].includes(pool))
        throw Error("Неизвестная выборка");
      const params = { fen: b.fen(), topGames: 0, moves: 20 };
      if (pool !== "masters")
        Object.assign(params, {
          recentGames: 0,
          variant: "standard",
          speeds: "rapid,classical",
          ratings: pool === "beginner" ? "0,1000" : "2000,2200,2500",
        });
      const r = await web(
          "https://explorer.lichess.org/" +
            (pool === "masters" ? "masters" : "lichess"),
          params,
        ),
        legal = new Set(b.moves({ verbose: true }).map(uci));
      r.data.moves = (r.data.moves || []).filter((m) => legal.has(m.uci));
      return {
        ...r,
        pool,
        sample_note:
          "Наблюдаемая частота не доказывает качество. Малые выборки ненадёжны; рейтинги Lichess и Chess.com различаются.",
      };
    }
    if (p === "/export") return exportData();
    if (p === "/export-previous") {
      const backup = await storage.backup();
      if (!backup)
        throw Error("Резервной копии перед восстановлением пока нет.");
      return backup;
    }
    if (p === "/restore") {
      if (
        [...jobs.values()].some((j) => ["queued", "running"].includes(j.status))
      )
        throw Error(
          "Остановите анализ и дождитесь завершения задач перед восстановлением",
        );
      const replacement = validateBackup(data);
      await storage.restore(replacement, exportData());
      state = replacement;
      graph.clear();
      for (const c of allCourses()) addGraph(c);
      return { ok: true };
    }
    throw Error("Неизвестная операция: " + p);
  }
  return {
    api,
    exportData,
    shutdown: () => {
      engine.reset();
      storage.close();
      releaseLock();
    },
    engine,
  };
}
