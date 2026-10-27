import { Chess, board, play, uci } from "./chess-core.js";
export function puzzleSource(web) {
  let manifest = null;
  const packs = new Map();
  const themes = {
    fork: "Вилка",
    pin: "Связка",
    mate: "Мат",
    mateIn1: "Мат в один",
    mateIn2: "Мат в два",
    hangingPiece: "Незащищённая фигура",
    discoveredAttack: "Вскрытое нападение",
    sacrifice: "Жертва",
    endgame: "Эндшпиль",
  };
  async function offline(options, seen) {
    if (!manifest) {
      const r = await fetch(
        new URL("./puzzles/manifest.json", import.meta.url),
      );
      if (!r.ok)
        throw Error(
          "Локальная библиотека ещё не загружена. Откройте задачи с интернетом хотя бы один раз.",
        );
      manifest = await r.json();
    }
    const available = manifest.packs.slice().sort(() => Math.random() - 0.5),
      range = {
        easiest: [0, 1100],
        easier: [700, 1500],
        normal: [1100, 1900],
        harder: [1600, 2400],
        hardest: [2000, 4000],
      }[options.difficulty] || [0, 4000];
    let repeat = [];
    for (const pack of available) {
      try {
        if (!packs.has(pack.file)) {
          const r = await fetch(
            new URL("./puzzles/" + pack.file, import.meta.url),
          );
          if (!r.ok) continue;
          const bytes = await r.arrayBuffer(),
            digest = [
              ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
            ]
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("");
          if (digest !== pack.sha256)
            throw Error("Контрольная сумма набора задач не совпадает");
          packs.set(pack.file, JSON.parse(new TextDecoder().decode(bytes)));
        }
        const rows = packs
          .get(pack.file)
          .filter(
            (p) =>
              p.rating >= range[0] &&
              p.rating <= range[1] &&
              (!options.angle ||
                options.angle === "mix" ||
                p.themes.includes(options.angle)),
          );
        const fresh = rows.filter((p) => !seen.has(p.id));
        if (fresh.length)
          return {
            ...fresh[Math.floor(Math.random() * fresh.length)],
            offline: true,
          };
        repeat.push(...rows);
      } catch (e) {
        if (e.message.includes("Контрольная")) throw e;
      }
    }
    if (repeat.length)
      return {
        ...repeat[Math.floor(Math.random() * repeat.length)],
        offline: true,
        warning:
          "Новые позиции выбранного локального набора закончились. Это повторение; подключитесь к сети для новых задач.",
      };
    throw Error(
      "Нет доступной задачи с этими фильтрами. Выберите другую тему/сложность или подключитесь к сети.",
    );
  }
  async function next(options, seen) {
    let warning = "";
    try {
      const params = { difficulty: options.difficulty || "easiest" };
      if (options.angle && options.angle !== "mix")
        params.angle = options.angle;
      const response = await web(
          "https://lichess.org/api/puzzle/next",
          params,
          0,
        ),
        p = response.data.puzzle,
        g = response.data.game;
      if (
        !p ||
        !/^[A-Za-z0-9]{4,10}$/.test(p.id) ||
        !Array.isArray(p.solution) ||
        !p.solution.length
      )
        throw Error("Сервис вернул неизвестный формат задачи");
      const b = new Chess();
      b.loadPgn(g.pgn, { strict: true });
      const fen = b.fen();
      board({ fen });
      for (const move of p.solution) play(b, move);
      if (!seen.has(p.id))
        return {
          id: p.id,
          fen,
          line: p.solution,
          rating: p.rating,
          themes: p.themes || [],
          gameUrl: "https://lichess.org/" + g.id,
          source: "Lichess API",
          offline: response.stale,
        };
      warning =
        "Сервис предложил знакомую задачу — выбрана другая из локальной базы.";
    } catch {
      warning =
        "Новая онлайн-задача сейчас недоступна. Используется открытый локальный набор.";
    }
    return { ...(await offline(options, seen)), warning };
  }
  return { next, themes };
}
