(() => {
  const $ = (id) => document.getElementById(id),
    base = new URL(".", document.currentScript.src);
  // A deliberate upgrade visit must also work while an old cached bootstrap is
  // running. Registration starts before any old single-tab runtime can fail.
  if (
    new URL(location.href).searchParams.has("upgrade") &&
    base.pathname.includes("/chess-academy/")
  )
    navigator.serviceWorker
      ?.register(new URL("../../sw.js", base), { updateViaCache: "none" })
      .catch(() => {});
  const icons = {
    home: "M3 10 12 3l9 7v10H3z M9 20v-7h6v7",
    openings: "M4 4h6l2 2 2-2h6v16h-6l-2 2-2-2H4z M12 6v16",
    study: "M4 4h16v16H4z M4 12h16 M12 4v16",
    games: "M6 3h12v18H6z M9 8h6 M9 12h6 M9 16h4",
    reviews: "M4 9a8 8 0 1 1 0 7 M4 3v6h6",
    lessons: "M4 17h16 M6 17l2-12 4 5 4-5 2 12 M6 21h12",
    progress: "M4 20V10 M11 20V4 M18 20v-8",
    puzzles: "M4 4h6v5h5V4h5v6h-5v5h5v5h-6v-5H9v5H4v-6h5V9H4z",
    profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-3a8 8 0 0 1 16 0v3",
  };
  const svg = (path) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  window.AcademyUI = {
    pieceSrc: (p) =>
      new URL(
        "pieces/" +
          (p === p.toUpperCase() ? "w" : "b") +
          p.toUpperCase() +
          ".svg",
        base,
      ).href,
    icon: svg,
  };
  $("nav").insertAdjacentHTML(
    "beforeend",
    '<button data-page="puzzles">Задачи</button><button data-page="profile">Мой профиль</button>',
  );
  document.querySelectorAll("#nav button").forEach((b) => {
    const text = b.textContent;
    b.innerHTML =
      svg(icons[b.dataset.page] || icons.study) + `<span>${text}</span>`;
    b.title = text;
  });
  document
    .querySelector("header")
    .insertAdjacentHTML(
      "beforeend",
      '<button id="profile-shortcut" data-page="profile" class="profile-pill"><span class="avatar">S</span><span><b id="profile-name">Sanekmix</b><small id="profile-rating">355 · Rapid</small></span></button>',
    );
  document.querySelector(".brand").innerHTML =
    '<span class="brand-knight">♞</span><span>Ход за ходом<small>ЛИЧНАЯ ШАХМАТНАЯ АКАДЕМИЯ</small></span>';
  if ($("browser-info")) {
    $("browser-info").classList.add("compact-info");
    $("browser-info").querySelector("strong").textContent =
      "Локальный анализ · ваш прогресс остаётся у вас";
    $("browser-info").querySelector("p").hidden = true;
  }
  const workspace = document.querySelector(".workspace"),
    boardColumn = workspace.firstElementChild,
    aside = workspace.querySelector("aside"),
    tree = $("variations").closest(".panel");
  boardColumn.classList.add("board-column");
  aside.classList.add("coach-column");
  tree.id = "study-tree";
  tree.querySelector("h2").textContent = "Программа дебюта";
  tree.hidden = true;
  const movePanel = document.createElement("section");
  movePanel.id = "move-panel";
  movePanel.className = "panel";
  movePanel.innerHTML = "<h3>Ходы партии</h3>";
  movePanel.append($("history"));
  movePanel.insertAdjacentHTML("beforeend", "<h3>Продолжения</h3>");
  movePanel.append($("branches"));
  const treeSub = tree.querySelector("h3");
  if (treeSub) treeSub.remove();
  tree.querySelector("p")?.remove();
  tree.insertAdjacentHTML(
    "afterbegin",
    '<div class="panel-eyebrow">УЧЕБНЫЕ ГЛАВЫ</div>',
  );
  tree.insertAdjacentHTML(
    "beforeend",
    '<div id="course-overview"><p>Выберите дебют в библиотеке, чтобы открыть его главы и планы за обе стороны.</p><button data-page="openings">Библиотека дебютов →</button></div>',
  );
  const stage = document.createElement("div");
  stage.className = "board-stage";
  $("board-wrap").before(stage);
  stage.innerHTML =
    '<div id="eval-meter" role="meter" aria-label="Оценка белых, анализ не выполнен" aria-valuemin="-10" aria-valuemax="10"><div id="eval-fill"></div><span id="eval-score">—</span></div>';
  stage.append($("board-wrap"));
  stage.insertAdjacentHTML(
    "beforebegin",
    '<div class="player-line opponent-line"><span class="player-avatar">♟</span><div><b id="opponent-label">Соперник</b><small id="opponent-side">Чёрные</small></div><span class="player-tag">ПРАКТИКА</span></div>',
  );
  stage.insertAdjacentHTML(
    "afterend",
    '<div class="player-line"><span class="player-avatar you">♙</span><div><b id="player-label">Вы</b><small id="player-side">Белые</small></div><span id="board-state" class="turn-chip">Ваш ход</span></div>',
  );
  const coach = aside.querySelector(".panel");
  coach.id = "coach-panel";
  coach.insertAdjacentHTML(
    "afterbegin",
    '<div class="coach-heading"><span class="coach-avatar">♞</span><div><b>Ваш тренер</b><small>Смотрим на идею, а не только на оценку</small></div><span class="online-dot"></span></div>',
  );
  coach.insertAdjacentHTML(
    "beforeend",
    '<div id="feedback" hidden role="status"><div id="feedback-label"></div><h3 id="feedback-title"></h3><p id="feedback-summary"></p><div id="refutation-strip" class="moves"></div><div class="toolbar"><button id="show-refutation">Показать на доске</button><button id="retry-move" class="primary">Попробовать ещё раз</button><button id="show-best-move">Показать сильный ход</button></div></div>',
  );
  $("explanation").before($("feedback"));
  const reflection = document.createElement("details");
  reflection.className = "reflection";
  reflection.innerHTML = "<summary>Мой план и заметки</summary>";
  reflection.append($("answer"));
  coach.append(reflection);
  aside.insertBefore(movePanel, $("engine-panel"));
  const tabs = document.createElement("div");
  tabs.className = "coach-tabs";
  tabs.innerHTML =
    '<button data-coach-tab="coach" class="active">Разбор</button><button data-coach-tab="moves">Ходы</button><button data-coach-tab="engine">Движок</button>';
  aside.prepend(tabs);
  aside.prepend(document.querySelector(".study-title"));
  tabs.insertAdjacentHTML(
    "beforeend",
    '<button data-coach-tab="chapters">Главы</button>',
  );
  aside.append(tree);
  window.AcademyUI.showTab = (tab) => {
    coach.hidden = tab !== "coach";
    tree.hidden = tab !== "chapters";
    movePanel.hidden = tab !== "moves";
    $("engine-panel").hidden = tab !== "engine";
    if (tab === "engine") $("engine-panel").open = true;
    tabs
      .querySelectorAll("button")
      .forEach((b) => b.classList.toggle("active", b.dataset.coachTab === tab));
  };
  tabs
    .querySelectorAll("button")
    .forEach(
      (b) => (b.onclick = () => window.AcademyUI.showTab(b.dataset.coachTab)),
    );
  window.AcademyUI.showTab("coach");
  const extras = document.createElement("details");
  extras.className = "panel board-extras";
  extras.innerHTML = "<summary>Инструменты позиции</summary>";
  aside.append(extras);
  extras.append(
    boardColumn.querySelector(":scope > .toolbar:not(.board-controls)"),
  );
  [...boardColumn.querySelectorAll(":scope > details")].forEach((d) =>
    extras.append(d),
  );
  [...aside.querySelectorAll(":scope > details")]
    .filter((d) => d !== extras && d.id !== "engine-panel")
    .forEach((d) => extras.append(d));
  document.body.insertAdjacentHTML(
    "beforeend",
    '<dialog id="promotion-dialog"><h2>Выберите фигуру</h2><div id="promotion-options"></div><p>Можно выбрать ферзя, ладью, слона или коня.</p></dialog><div id="drag-ghost" hidden></div>',
  );
  document
    .querySelector(".board-controls")
    .insertAdjacentHTML(
      "afterbegin",
      '<button id="first-move" title="Начало партии (Home)" aria-label="Начало партии">|←</button>',
    );
  $("forward").insertAdjacentHTML(
    "afterend",
    '<button id="last-move" title="Конец партии (End)" aria-label="Конец партии">→|</button>',
  );
  document
    .querySelector(".board-controls")
    .insertAdjacentHTML(
      "beforeend",
      '<button id="sound-toggle" title="Звук ходов" aria-label="Звук ходов" aria-pressed="true">♪</button>',
    );
  $("back").title = "Предыдущий ход (←)";
  $("forward").title = "Следующий ход (→)";
  $("coach-panel").insertAdjacentHTML(
    "afterbegin",
    `<section id="review-panel" hidden aria-label="Разбор партии"><div class="review-top"><b>Разбор партии</b><span id="review-counter"></span></div><div id="review-verdict" aria-live="polite"></div><div id="review-scores"></div><p id="review-best"></p><button id="review-show-best">Показать лучший ход</button><button id="review-return" hidden>Вернуться к партии</button><div class="review-job"><button id="review-analyze">Анализировать партию</button><span id="review-progress" role="status"></span></div><div id="review-history" aria-label="Ходы с оценками"></div><small>← → — ходы · Home / End — начало и конец</small></section>`,
  );
  const main = document.querySelector("main");
  main.insertAdjacentHTML(
    "beforeend",
    `<section id="puzzles" class="page" hidden><p class="eyebrow">ТАКТИЧЕСКИЙ ЗАЛ</p><h1>Один ход. Новая привычка.</h1><p>Открытая база Lichess. Решайте столько, сколько хотите: дневного лимита нет.</p><div class="puzzle-launch panel"><div><span class="tag-green">БЕСПЛАТНО · БЕЗ ЛИМИТА ПОПЫТОК</span><h2>Найдите сильнейшее продолжение</h2><p>Случайная задача из открытого API. Без сети доступен локальный набор из 4 096 позиций.</p></div><div class="toolbar"><label>Тема<select id="puzzle-theme"><option value="mix">Все темы</option><option value="mateIn1">Мат в один</option><option value="mateIn2">Мат в два</option><option value="fork">Вилка</option><option value="pin">Связка</option><option value="hangingPiece">Незащищённая фигура</option><option value="discoveredAttack">Вскрытое нападение</option><option value="sacrifice">Жертва</option><option value="endgame">Эндшпиль</option></select></label><label>Сложность<select id="puzzle-difficulty"><option value="easiest">Начальный уровень</option><option value="easier">Полегче</option><option value="normal">Средняя</option><option value="harder">Сложнее</option><option value="hardest">Продвинутая</option></select></label><button id="new-puzzle" class="primary">Начать решать →</button></div><div id="puzzle-stats"></div></div><div class="cards"><article><h2>Рассчитайте весь вариант</h2><p>После вашего хода соперник отвечает. Задача завершается только после всей последовательности.</p></article><article><h2>Ошибка — часть обучения</h2><p>Тренер покажет ответ на слабый ход, вернёт позицию и даст попробовать ещё раз.</p></article><article><h2>Возвращайтесь к сложному</h2><p>Задачи сохраняются в ваших упражнениях. Успешные решения попадают в интервальные повторения.</p></article></div></section>
  <section id="profile" class="page" hidden><p class="eyebrow">ВАШ ШАХМАТНЫЙ ПАСПОРТ</p><h1>Подключите свои партии.</h1><p>Публичный профиль по нику. Пароль и регистрация в академии не нужны.</p><div class="cards"><article class="connect-card"><span class="platform-icon">♟</span><h2>Chess.com</h2><p>Рейтинги, архив завершённых партий и личные упражнения из ошибок.</p><input id="connect-chesscom-name" value="Sanekmix" aria-label="Ник профиля Chess.com" placeholder="Ваш ник Chess.com"><button id="connect-chesscom" class="primary">Подключить профиль</button><button id="sync-chesscom">Обновить последние партии</button><div id="chesscom-profile"></div></article><article class="connect-card"><span class="platform-icon">♞</span><h2>Lichess</h2><p>Импорт завершённых партий с часами и бесплатный локальный разбор.</p><input id="connect-lichess-name" aria-label="Ник профиля Lichess" placeholder="Ваш ник Lichess"><button id="connect-lichess" class="primary">Подключить профиль</button><button id="sync-lichess">Загрузить партии</button><div id="lichess-profile"></div></article></div><article><h2>Партии с любой другой платформы</h2><p>Скачайте завершённую партию в формате PGN и откройте её в разделе «Мои партии». Анализ и создание упражнений работают бесплатно на вашем устройстве.</p><button data-page="games">Импортировать PGN →</button></article><p class="muted">Подключение публичного профиля не подтверждает владение аккаунтом. Пароли, токены и доступ к текущим партиям не запрашиваются.</p></section>`,
  );
  $("study-title")
    .closest(".study-title")
    .insertAdjacentHTML(
      "beforeend",
      '<span id="chapter-progress" class="chapter-progress"></span>',
    );
  document.querySelector(".hero h1").textContent =
    "Сильная игра начинается с понимания.";
  document.querySelector(".hero .eyebrow").textContent =
    "ВАША ЛИЧНАЯ ШАХМАТНАЯ АКАДЕМИЯ";
  $("game-detail").querySelector("h2").before(document.createElement("div"));
  const defs = document.querySelector("#arrows defs");
  defs.insertAdjacentHTML(
    "beforeend",
    ["green", "red", "blue"]
      .map(
        (kind) =>
          `<marker id="arrow-${kind}" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3" fill="${{ green: "#95bb4a", red: "#e15b64", blue: "#63a9e8" }[kind]}"/></marker>`,
      )
      .join(""),
  );
  let soundOn = localStorage.getItem("academy-sound") !== "off";
  const soundButton = $("sound-toggle");
  const source =
    "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/";
  const sounds = Object.fromEntries(
    ["move-self", "capture", "move-check", "castle"].map((name) => {
      const audio = new Audio(source + name + ".mp3");
      audio.preload = "none";
      audio.addEventListener("error", () => {
        soundButton.title =
          "Звук Chess.com недоступен: проверьте доступ к images.chesscomfiles.com";
      });
      return [name, audio];
    }),
  );
  function soundState() {
    soundButton.setAttribute("aria-pressed", String(soundOn));
    soundButton.textContent = soundOn ? "♪" : "♪ ×";
  }
  soundButton.onclick = () => {
    soundOn = !soundOn;
    localStorage.setItem("academy-sound", soundOn ? "on" : "off");
    soundState();
  };
  soundState();
  window.AcademyUI.moveSound = (capture = false, san = "") => {
    if (!soundOn) return;
    const name = /[+#]/.test(san)
      ? "move-check"
      : san.startsWith("O-O")
        ? "castle"
        : capture
          ? "capture"
          : "move-self";
    const audio = sounds[name];
    audio.currentTime = 0;
    void audio
      .play()
      .then(() => {
        soundButton.title = "Оригинальные звуки Chess.com";
      })
      .catch(() => {});
    soundButton.dataset.played = String(
      Number(soundButton.dataset.played || 0) + 1,
    );
  };
  $("coach-panel").insertAdjacentHTML(
    "afterbegin",
    '<section id="lesson-goal" hidden></section><section id="branch-banner" hidden><b>Пробный вариант</b><p id="branch-status">Ходите за обе стороны. Исходная партия сохранена.</p><button id="branch-return" class="primary">Вернуться к партии</button></section>',
  );
  tabs.before($("branch-banner"));
  document.documentElement.style.colorScheme = "dark";
})();
