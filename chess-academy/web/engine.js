import { Chess, play, terminal } from "./chess-core.js";
const FILE = new URL(
  "./vendor/stockfish-17.1-lite-single-03e3232.js",
  import.meta.url,
);
export class Engine {
  constructor() {
    this.worker = null;
    this.ready = null;
    this.listener = null;
    this.engineName = "Stockfish 17.1 Lite · WebAssembly";
    this.cancelled = false;
  }
  async start() {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      const worker = (this.worker = new Worker(FILE)),
        timeout = setTimeout(() => {
          this.reset();
          reject(
            Error(
              "Stockfish не загрузился. Проверьте интернет при первом запуске и поддержку WebAssembly.",
            ),
          );
        }, 45000);
      worker.onerror = () => {
        clearTimeout(timeout);
        this.reset();
        reject(
          Error(
            "Не удалось загрузить Stockfish WebAssembly. Обновите браузер или повторите загрузку.",
          ),
        );
      };
      worker.onmessage = (e) => {
        for (const line of String(e.data).split("\n")) {
          if (line === "uciok") {
            worker.postMessage("setoption name Hash value 32");
            worker.postMessage("setoption name UCI_ShowWDL value true");
            worker.postMessage("isready");
          }
          if (line === "readyok") {
            clearTimeout(timeout);
            resolve();
          }
          this.listener?.(line);
        }
      };
      worker.postMessage("uci");
    });
    return this.ready;
  }
  reset() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.listener = null;
  }
  stop() {
    this.worker?.postMessage("stop");
  }
  async analyze(
    b,
    { seconds = 0.35, depth = 18, multipv = 3 } = {},
    job = {},
    roots = [],
  ) {
    if (job.cancelled) throw Error("Анализ остановлен");
    seconds = Math.min(5, Math.max(0.05, Number(seconds)));
    depth = Math.min(40, Math.max(1, Number(depth)));
    multipv = Math.min(8, Math.max(1, Number(multipv)));
    if (![seconds, depth, multipv].every(Number.isFinite))
      throw Error("Некорректные параметры анализа");
    const outcome = terminal(b);
    if (outcome.terminal) {
      const win =
        outcome.result === "1-0" ? 1 : outcome.result === "0-1" ? 0 : 0.5;
      return {
        ...outcome,
        engine: this.engineName,
        lines: [
          {
            cp: win === 0.5 ? 0 : win === 1 ? 100000 : -100000,
            mate: outcome.terminal === "CHECKMATE" ? 0 : null,
            expectation: win,
            pv: [],
            san: [],
            depth: 0,
          },
        ],
      };
    }
    await this.start();
    if (job.cancelled) throw Error("Анализ остановлен");
    const worker = this.worker,
      root = b.history({ verbose: true })[0]?.before || b.fen(),
      moves = b
        .history({ verbose: true })
        .map((m) => m.from + m.to + (m.promotion || ""));
    return new Promise((resolve, reject) => {
      const lines = new Map(),
        side = b.turn() === "w" ? 1 : -1;
      const timeout = setTimeout(
        () => {
          this.reset();
          reject(
            Error(
              "Движок не ответил за отведённое время. Запустите анализ снова.",
            ),
          );
        },
        Math.max(15000, seconds * 1000 + 10000),
      );
      this.listener = (line) => {
        if (
          line.startsWith("info ") &&
          / score (cp|mate) /.test(line) &&
          / pv /.test(line) &&
          !/ (upperbound|lowerbound)( |$)/.test(line)
        ) {
          const rank = Number(line.match(/ multipv (\d+)/)?.[1] || 1),
            score = line.match(/ score (cp|mate) (-?\d+)/),
            mate = score[1] === "mate" ? Number(score[2]) * side : null,
            cp =
              mate === null
                ? Number(score[2]) * side
                : Math.sign(mate) * (100000 - Math.abs(mate)),
            wdl = line.match(/ wdl (\d+) (\d+) (\d+)/),
            expect = wdl ? (Number(wdl[1]) + Number(wdl[2]) / 2) / 1000 : null;
          const pv = line.split(" pv ")[1].trim().split(/\s+/),
            check = new Chess(b.fen()),
            valid = [],
            san = [];
          for (const value of pv) {
            try {
              const m = play(check, value);
              valid.push(value);
              san.push(m.san);
            } catch {
              break;
            }
          }
          if (valid.length && expect !== null)
            lines.set(rank, {
              cp,
              mate,
              expectation: side === 1 ? expect : 1 - expect,
              pv: valid,
              san,
              depth: Number(line.match(/ depth (\d+)/)?.[1] || 0),
              nodes: Number(line.match(/ nodes (\d+)/)?.[1] || 0),
            });
        }
        if (line.startsWith("bestmove")) {
          clearTimeout(timeout);
          this.listener = null;
          if (job.cancelled) return reject(Error("Анализ остановлен"));
          if (!lines.size)
            return reject(
              Error(
                "Движок не вернул проверяемую оценку WDL. Повторите анализ.",
              ),
            );
          resolve({
            terminal: null,
            engine: this.engineName,
            lines: [...lines.entries()]
              .sort((a, b) => a[0] - b[0])
              .map((e) => e[1]),
            seconds,
            requested_depth: depth,
            warning:
              "Ограниченный расчёт облегчённой локальной сборки. Оценки могут измениться при углублении; это не абсолютная точность.",
          });
        }
      };
      worker.postMessage(
        "setoption name MultiPV value " +
          Math.min(multipv, roots.length || b.moves().length),
      );
      worker.postMessage("ucinewgame");
      worker.postMessage(
        "position fen " +
          root +
          (moves.length ? " moves " + moves.join(" ") : ""),
      );
      worker.postMessage(
        "go depth " +
          Math.floor(depth) +
          " movetime " +
          Math.floor(seconds * 1000) +
          (roots.length ? " searchmoves " + roots.join(" ") : ""),
      );
    });
  }
}
