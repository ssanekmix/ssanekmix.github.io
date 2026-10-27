export function profileService({
  web,
  mutate,
  getState,
  parseGames,
  storeParsed,
}) {
  const name = (value) => {
    if (typeof value !== "string" || !/^[A-Za-z0-9_-]{2,50}$/.test(value))
      throw Error("Введите корректный ник");
    return value.toLowerCase();
  };
  async function connect(platform, username) {
    const user = name(username);
    let profile;
    if (platform === "chesscom") {
      const player = await web(
          "https://api.chess.com/pub/player/" + user,
          {},
          3600,
        ),
        stats = await web(
          "https://api.chess.com/pub/player/" + user + "/stats",
          {},
          3600,
        ),
        archives = await web(
          "https://api.chess.com/pub/player/" + user + "/games/archives",
          {},
          3600,
        ),
        ratings = {};
      for (const [key, label] of [
        ["chess_rapid", "Rapid"],
        ["chess_blitz", "Blitz"],
        ["chess_bullet", "Bullet"],
        ["chess_daily", "Daily"],
      ])
        if (stats.data[key]?.last?.rating)
          ratings[label] = stats.data[key].last.rating;
      profile = {
        username: player.data.username || username,
        ratings,
        url: player.data.url || "https://www.chess.com/member/" + user,
        archives: archives.data.archives || [],
        updated: Math.min(player.at, stats.at, archives.at),
        stale: Boolean(player.stale || stats.stale || archives.stale),
      };
    } else if (platform === "lichess") {
      const result = await web(
          "https://lichess.org/api/user/" + user,
          {},
          3600,
        ),
        ratings = {};
      for (const key of [
        "rapid",
        "blitz",
        "bullet",
        "classical",
        "correspondence",
      ])
        if (result.data.perfs?.[key]?.games)
          ratings[key] = result.data.perfs[key].rating;
      profile = {
        username: result.data.username || username,
        ratings,
        url: "https://lichess.org/@/" + user,
        updated: result.at,
        stale: Boolean(result.stale),
      };
    } else throw Error("Неизвестная платформа");
    await mutate(() => {
      const state = getState(),
        old = state.profiles[platform];
      state.profiles[platform] = {
        ...(old?.username.toLowerCase() === profile.username.toLowerCase()
          ? old
          : {}),
        ...profile,
      };
      if (platform === "chesscom") {
        state.preferences.username = profile.username;
        const rating = profile.ratings.Rapid;
        if (rating && rating >= 100 && rating <= 4000)
          state.preferences.rating = rating;
      }
    });
    return profile;
  }
  async function sync(platform, username, options = {}) {
    const user = name(username);
    let state = getState(),
      profile = state.profiles[platform];
    if (!profile || profile.username.toLowerCase() !== user)
      profile = await connect(platform, username);
    if (platform === "chesscom") {
      const archive = await web(
          "https://api.chess.com/pub/player/" + user + "/games/archives",
          {},
          0,
        ),
        all = (archive.data.archives || []).slice().reverse(),
        done = profile.syncedMonths || [],
        months = [
          all[0],
          ...all
            .slice(1)
            .filter((m) => !done.includes(m))
            .slice(0, 1),
        ].filter(Boolean),
        parsed = [];
      let skipped = 0;
      for (const archiveURL of months) {
        const match = archiveURL.match(/\/(\d{4})\/(\d{2})$/);
        if (!match) continue;
        const result = await web(
          `https://api.chess.com/pub/player/${user}/games/${match[1]}/${match[2]}`,
          {},
          0,
        );
        for (const game of result.data.games || []) {
          if (
            game.rules !== "chess" ||
            !game.end_time ||
            game.end_time > Date.now() / 1000 ||
            !game.pgn
          ) {
            skipped++;
            continue;
          }
          try {
            parsed.push({
              games: parseGames(game.pgn),
              meta: Object.fromEntries(
                [
                  "white",
                  "black",
                  "time_class",
                  "time_control",
                  "end_time",
                  "url",
                ].map((k) => [k, game[k]]),
              ),
            });
          } catch {
            skipped++;
          }
        }
      }
      const ids = await mutate(() => {
        const s = getState();
        s.profiles.chesscom.syncedMonths = [...new Set([...done, ...months])];
        s.profiles.chesscom.updated = Date.now() / 1000;
        return parsed.flatMap((p) => storeParsed(p.games, "Chess.com", p.meta));
      });
      return { ids, skipped };
    }
    if (platform === "lichess") {
      const params = {
        max: Math.min(50, Math.max(1, Number(options.limit) || 50)),
        ongoing: false,
        finished: true,
        pgnInJson: true,
        clocks: true,
        opening: true,
      };
      if (profile.before) params.until = profile.before;
      const result = await web(
          "https://lichess.org/api/games/user/" + user,
          params,
          0,
          "ndjson",
        ),
        parsed = [];
      let skipped = 0,
        oldest = Infinity;
      for (const game of result.data) {
        if (
          !game.pgn ||
          ["created", "started", "aborted"].includes(game.status) ||
          game.variant !== "standard"
        ) {
          skipped++;
          continue;
        }
        try {
          const games = parseGames(game.pgn);
          parsed.push({
            games,
            meta: {
              white: {
                username: game.players?.white?.user?.name,
                rating: game.players?.white?.rating,
              },
              black: {
                username: game.players?.black?.user?.name,
                rating: game.players?.black?.rating,
              },
              time_class: game.speed,
              end_time: (game.lastMoveAt || game.createdAt) / 1000,
              url: "https://lichess.org/" + game.id,
            },
          });
          oldest = Math.min(oldest, game.createdAt);
        } catch {
          skipped++;
        }
      }
      const ids = await mutate(() => {
        const s = getState();
        if (Number.isFinite(oldest)) s.profiles.lichess.before = oldest - 1;
        s.profiles.lichess.updated = Date.now() / 1000;
        return parsed.flatMap((p) => storeParsed(p.games, "Lichess", p.meta));
      });
      return { ids, skipped };
    }
    throw Error("Неизвестная платформа");
  }
  return { connect, sync };
}
