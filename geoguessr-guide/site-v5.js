window.addEventListener('load',()=>setTimeout(applyV5,1000));

function applyV5(){
  fixLanguageJumpV5();
  addDecisionPathV5();
  addRoadMarkingsV5();
  rebuildSignsV5();
  rebuildEnvironmentV5();
  addSpainPoleV5();
  addAndeanCarsV5();
  addEcuadorPoleV5();
  addSwissAndAmericanInfrastructureV5();
  enrichFrequentPairsV5();
  repairKnownImagesV5();
}

const V5FLAGS={
  'Швейцария':['ch','немецкий / французский / итальянский / ретороманский'],'Бразилия':['br','португальский'],'США':['us','английский / испанский'],'Канада':['ca','английский / французский'],'Мексика':['mx','испанский'],'Франция':['fr','французский'],'Германия':['de','немецкий'],'Нидерланды':['nl','нидерландский'],'Бельгия':['be','французский / нидерландский'],
  'Словакия':['sk','словацкий'],'Хорватия':['hr','хорватский'],'Чехия':['cz','чешский'],'Словения':['si','словенский'],
  'Иран':['ir','персидский'],'Индия':['in','хинди + региональные'],'Турция':['tr','турецкий'],'ОАЭ':['ae','арабский + английский'],
  'Малайзия':['my','малайский'],'Индонезия':['id','индонезийский'],'Испания':['es','испанский'],'Португалия':['pt','португальский'],
  'Ирландия':['ie','ирландский + английский'],'Швеция':['se','шведский'],'Финляндия':['fi','финский + шведский'],'Норвегия':['no','норвежский'],
  'Филиппины':['ph','филиппинский + английский'],'Гайана':['gy','английский'],'Аргентина':['ar','испанский'],'Перу':['pe','испанский'],'Эквадор':['ec','испанский'],
  'Греция':['gr','греческий'],'Япония':['jp','японский'],'Южная Корея':['kr','корейский'],'Таиланд':['th','тайский'],
  'Румыния':['ro','румынский'],'Венгрия':['hu','венгерский'],'Польша':['pl','польский'],'Болгария':['bg','болгарский'],
  'Сербия':['rs','сербский'],'Северная Македония':['mk','македонский'],'Италия':['it','итальянский'],
  'Шри-Ланка':['lk','сингальский / тамильский'],'Кения':['ke','суахили + английский'],'Уганда':['ug','английский / суахили'],
  'Гонконг':['hk','китайский + английский'],'Великобритания':['gb','английский'],'Оман':['om','арабский + английский'],
  'Катар':['qa','арабский + английский'],'Иордания':['jo','арабский']
};

function safePhoto(src,title,fallback,position){
  const fb=fallback||'';
  return `<img src="${src}" alt="${title}" loading="lazy"${position?` style="object-position:${position}"`:""} onerror="if(this.dataset.fallback){const next=this.dataset.fallback;delete this.dataset.fallback;this.src=next}else{this.onerror=null;this.hidden=true;const note=document.createElement('p');note.className='photo-note';note.textContent='Изображение не загрузилось. Открой источник под карточкой.';this.insertAdjacentElement('afterend',note)}" data-fallback="${fb}">`;
}

function photoCardV5(x){
  return `<article class="v5-photo-card">${x.img?safePhoto(x.img,x.title,x.fallback,x.position):''}<div class="v5-photo-body"><h3>${x.title}</h3>${x.schematic?'<p class="photo-note">Схема признака · не фотография</p>':''}${x.kicker?`<div class="v5-kicker">${x.kicker}</div>`:''}<ul>${x.facts.map(f=>`<li>${f}</li>`).join('')}</ul>${x.strength?`<span class="v5-strength">${x.strength}</span>`:''}${x.source?`<a class="source-link" href="${x.source}" target="_blank" rel="noopener">Пример / источник ↗</a>`:''}${photoCreditV3(x)}</div></article>`;
}

function fixLanguageJumpV5(){
  const langs=document.getElementById('languages');
  if(!langs)return;
  const heads=[...langs.querySelectorAll('.subhead')];
  const latin=heads.find(h=>h.textContent.includes('обычные'));
  if(latin)latin.id='latin-start';
  document.querySelectorAll('.nav a[href="#languages"]').forEach(a=>a.href='#latin-start');
}

function addDecisionPathV5(){
  if(document.getElementById('decision-path'))return;
  const countries=document.getElementById('countries');
  if(!countries)return;
  const sec=document.createElement('section');
  sec.className='section v5-decision-section'; sec.id='decision-path';
  sec.innerHTML=`
    <div class="section-head"><div><span class="eyebrow">00 · ОПРЕДЕЛИТЕЛЬ</span><h2>Не знаешь страну — иди по шагам</h2><p>Не пытайся угадать по вайбу. Сначала сильные развилки.</p></div></div>
    <div class="v5-flow">
      <div class="v5-flow-step"><b>1</b><div><h3>На какой стороне едут?</h3><p>Смотри машины, парковку, стрелки и положение камеры.</p></div></div>
      <div class="v5-flow-buttons" data-flow="drive"><button data-choice="left">Едут слева</button><button data-choice="right">Едут справа</button><button data-choice="unknown">Не видно</button></div>
      <div id="v5FlowResult" class="v5-flow-result"></div>
    </div>`;
  countries.insertAdjacentElement('beforebegin',sec);

  const nav=document.querySelector('.nav');
  if(nav&&!nav.querySelector('a[href="#decision-path"]')){
    const a=document.createElement('a');a.href='#decision-path';a.textContent='Определитель';nav.prepend(a);
  }

  const branches={
    left:`<div class="v5-flow-grid">
      <article><h4>Письменность решает сразу</h4><p><b>ไทย</b> → 🇹🇭 Таиланд</p><p><b>日本語</b> → 🇯🇵 Япония</p><p><b>සිංහල / தமிழ்</b> → 🇱🇰 Шри-Ланка</p></article>
      <article><h4>Английский</h4><p><b>Африка + белый перед / жёлтый зад</b> → 🇰🇪 Кения / 🇺🇬 Уганда</p><p><b>чёрные номера + плоские тропики + канавы</b> → 🇬🇾 Гайана</p><p><b>китайский + английский + плотный город</b> → 🇭🇰 Гонконг</p></article>
      <article><h4>Чёрные номера в тропиках</h4><p>🇲🇾 Малайзия ↔ 🇮🇩 Индонезия</p><p>Индонезия: <b>Jalan / Kota / Selamat</b>, красно-белые столбики, чаще 3 светлых блока после размытия номера.</p><p>Малайзия: чаще 2 светлых блока.</p></article>
      <article><h4>Очень чистый богатый город</h4><p>🇸🇬 Сингапур: английский + китайский, левое движение, тропики, строгая разметка.</p><p>🇦🇺/🇳🇿: английский, но совсем другая архитектура и природа.</p></article>
    </div>`,
    right:`<div class="v5-flow-grid">
      <article><h4>Арабский + английский</h4><p>Сначала 🇦🇪 ОАЭ / 🇴🇲 Оман / 🇶🇦 Катар.</p><p>ОАЭ: новые широкие дороги, светлая застройка, чёрно-белые стойки/бордюры.</p><p>Оман: горы/пустыня, жёлтые частные номера, много столбов.</p><p>Катар: очень плоско; белые номера с бордовой полосой слева.</p></article>
      <article><h4>Кириллица</h4><p><b>ї є і</b> → 🇺🇦 Украина</p><p><b>қ ә ғ ң ө ү</b> → 🇰🇿 Казахстан</p><p>частая <b>ъ</b> → 🇧🇬 Болгария</p><p><b>ђ ћ</b> → 🇷🇸 Сербия</p></article>
      <article><h4>Испанский</h4><p><b>Белый EU-номер с синей полосой</b> → 🇪🇸 Испания.</p><p>Без EU-полосы → Латинская Америка: номера, Google-car, почва и городская среда.</p></article>
      <article><h4>Английский + бетонные плиты</h4><p>Тропики + правое движение + бетонные секции + jeepney/трициклы → 🇵🇭 Филиппины.</p></article>
    </div>`,
    unknown:`<div class="v5-flow-grid">
      <article><h4>1. Цвет номера</h4><p><b>жёлтый</b> → NL/LU/Israel/Colombia и др.</p><p><b>чёрный</b> → Indonesia/Malaysia/Tunisia/Guyana и др.</p><p><b>белый перед + жёлтый зад</b> → UK/Kenya/Uganda/Sri Lanka/Hong Kong.</p></article>
      <article><h4>2. Разметка</h4><p><b>двойной жёлтый центр + белые края</b> → Америка, особенно США.</p><p><b>жёлтые ВНЕШНИЕ линии</b> → юг Африки / часть Ближнего Востока.</p><p><b>всё белое</b> → большая часть Европы.</p></article>
      <article><h4>3. Знак</h4><p><b>SPEED LIMIT</b> → США.</p><p><b>жёлтый треугольник + тонкая красная кайма</b> → Польша.</p><p><b>арабский + английский</b> → UAE/Oman/Qatar.</p></article>
      <article><h4>4. Потом уже среда</h4><p>Столбы → болларды → почва → архитектура → Google-car.</p></article>
    </div>`
  };
  sec.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{
    sec.querySelectorAll('[data-choice]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('v5FlowResult').innerHTML=branches[btn.dataset.choice];
  }));
}

function addRoadMarkingsV5(){
  if(document.getElementById('road-lines'))return;
  const roads=document.getElementById('roads'); if(!roads)return;
  const sec=document.createElement('section'); sec.className='section alt'; sec.id='road-lines';
  const cards=[
    {"title":"🇨🇭 Швейцария — жёлтая зебра","img":"./assets/swiss-yellow-crossing.jpg","facts":["В европейской среде жёлтые переходы указывают прежде всего на Швейцарию и Лихтенштейн.","Проверь короткий передний номер без полосы ЕС и низкую камеру. Жёлтая линия вдоль дороги — другой признак."],"kicker":"ЖЁЛТЫЕ ПОЛОСЫ ПЕРЕХОДА","source":"https://www.plonkit.net/switzerland"},
    {title:'🇺🇸 США — двойной жёлтый центр + белые края',img:'https://www.mywaltonfl.gov/ImageRepository/Document?documentID=43804',fallback:'https://upload.wikimedia.org/wikipedia/commons/6/67/Double_yellow_center_line.jpg',kicker:'ЖЁЛТЫЙ В ЦЕНТРЕ',facts:['Очень частая американская разметка.','Если рядом прямоугольный знак SPEED LIMIT — США становится ещё сильнее.']},
    {title:'🇳🇴 Норвегия — жёлтый центр + белые края',img:'https://dingyiyi0226.github.io/geoguessr-note/docs/road-markings/europe/line-yellow-no.png',fallback:'https://upload.wikimedia.org/wikipedia/commons/9/91/Road_in_Norway.jpg',kicker:'ЖЁЛТЫЙ ЦЕНТР В ЕВРОПЕ',facts:['В Северной Европе это особенно важная Норвегия.','Длинные внешние штрихи + горы/фьорды усиливают.']},
    {title:'🇵🇱 Польша — всё белое, двойная середина',img:'https://www.prdzwolen.com.pl/htm/a/realizacje/dw7372.jpg',fallback:'https://upload.wikimedia.org/wikipedia/commons/3/32/Polish_road.jpg',kicker:'ДВОЙНАЯ БЕЛАЯ',facts:['Все линии белые; двойная центральная встречается очень часто.','Подтверждай польскими буквами ł/ą/ę и жёлтыми предупреждающими знаками.']},
    {title:'🇪🇸 Испания — белая разметка',img:'https://www.zarzadepumareda.es/horcajo/pfrancia0.JPG',fallback:'https://upload.wikimedia.org/wikipedia/commons/1/13/Spanish_road.jpg',kicker:'ВСЁ БЕЛОЕ',facts:['Испания использует белые линии; на сельских дорогах внешняя линия иногда пунктирная.','Сама по себе белая разметка страну не даёт — добивай знаками/номерами.']},
    {title:'🇿🇦 Юг Африки — жёлтые ВНЕШНИЕ линии',img:'https://mapsensei.com/images/countries/botswana/botswana_5.webp',fallback:'https://upload.wikimedia.org/wikipedia/commons/9/94/Road_in_South_Africa.jpg',kicker:'ЖЁЛТЫЕ КРАЯ',facts:['ЮАР / Ботсвана / Лесото / Эсватини — важная группа.','Обычно движение слева; центр белый.']},
    {title:'🇬🇧 Великобритания — зигзаги у перехода',img:'https://s0.geograph.org.uk/geophotos/07/33/52/7335241_4a7db510.jpg',fallback:'https://upload.wikimedia.org/wikipedia/commons/0/0c/Zig-zag_road_markings_UK.jpg',kicker:'ЗИГЗАГИ',facts:['Белые зигзаги возле пешеходного перехода — очень британский образ.','Левое движение и белый перед/жёлтый зад номер подтверждают.']},
    {title:'🇮🇪 Ирландия — жёлтая прерывистая линия у края',img:'https://mmo.aiircdn.com/516/687116fca98a1.jpg',fallback:'https://upload.wikimedia.org/wikipedia/commons/e/ef/Road_in_Ireland.jpg',kicker:'ЖЁЛТЫЙ КРАЙ ПУНКТИРОМ',facts:['Характерный ирландский край дороги.','Ищи левое движение, английский/ирландский текст и EU-номера.']}
  ];
  sec.innerHTML=`<div class="section-head"><div><span class="eyebrow">04B · РАЗМЕТКА</span><h2>Разметка отдельно от покрытия</h2><p>Сначала цвет центра и краёв, потом сплошная/пунктир, потом форма.</p></div></div><div class="v5-photo-grid">${cards.map(photoCardV5).join('')}</div>`;
  roads.insertAdjacentElement('afterend',sec);
  const nav=document.querySelector('.nav');
  if(nav&&!nav.querySelector('a[href="#road-lines"]')){
    const roadLink=nav.querySelector('a[href="#roads"]');
    const a=document.createElement('a');a.href='#road-lines';a.textContent='Разметка';roadLink?.insertAdjacentElement('afterend',a);
  }
}

function rebuildSignsV5(){
  const host=document.getElementById('signGrid'); if(!host)return;
  const cards=[
    {"title":"🇨🇭 Швейцария — знак перехода","img":"./assets/swiss-pedestrian-sign.jpg","facts":["Синий прямоугольник вытянут вверх; в белом треугольнике семь полос перехода.","В Лихтенштейне такой же. Ищи жёлтую зебру, номер и .ch."],"kicker":"ВЫСОКИЙ СИНИЙ ПРЯМОУГОЛЬНИК","source":"https://www.plonkit.net/switzerland"},
    {"title":"🇧🇷 Бразилия — шевроны","img":"./assets/brazil-chevrons.jpg","facts":["Часты жёлтые стрелки на чёрном фоне; у многих соседей чаще наоборот.","Шеврон не уникален: подтверждай португальским, номером Mercosur и маршрутом BR-xxx. PARE тоже есть у соседей."],"kicker":"ЖЁЛТАЯ СТРЕЛКА НА ЧЁРНОМ","source":"https://www.plonkit.net/brazil"},
    {"title":"🇲🇽 Мексика — ALTO","img":"./assets/mexico-alto.jpg","facts":["ALTO — остановка; в Южной Америке чаще PARE. ALTO есть и в Гватемале, Панаме и Коста-Рике.","Щит трассы с MEXICO или указатель PEMEX подтверждает Мексику сильнее одного ALTO."],"kicker":"ALTO ≠ АВТОМАТИЧЕСКИ МЕКСИКА","source":"https://www.plonkit.net/mexico"},
    {"title":"🇲🇽 Мексика — щиты маршрутов","img":"./assets/mexico-road-shields.jpg","facts":["На федеральном щите над номером написано MEXICO. На щитах дорог штатов встречаются сокращения названия штата.","Сравни с США: щит Interstate, надпись TEXAS, обозначения FM или RM. Это полезнее общего пустынного пейзажа."],"kicker":"ЧИТАЙ НАДПИСЬ НА ЩИТЕ","source":"https://www.plonkit.net/mexico"},
    {"title":"🇨🇦 Канада — MAXIMUM","img":"./assets/canada-maximum.jpg","facts":["Скорость в km/h; в США обычно SPEED LIMIT и мили в час.","ARRÊT и французские надписи помогают проверить Квебек; провинциальный щит дороги уточняет регион."],"kicker":"MAXIMUM + km/h","source":"https://www.plonkit.net/canada"},
    {"title":"🇺🇸 Техас — полосы на стойках","img":"./assets/texas-sign-reflectors.jpg","facts":["Красные или жёлтые полосы на стойках знаков — дополнительная техасская подсказка, но встречаются и вне штата.","Сильнее: FM (Farm to Market), RM (Ranch to Market), TEXAS или техасский щит маршрута.","Испанская реклама, пикапы и кактусы не отделяют Техас от Мексики. Сравни mph/SPEED LIMIT и km/h/ALTO/MEXICO."],"kicker":"СНАЧАЛА США, ПОТОМ ШТАТ","source":"https://www.plonkit.net/united-states"},
    {title:'🇪🇨 Эквадор — красный круг на белой табличке',img:'./assets/sign-local-0.jpg',kicker:'БЕЛАЯ ТАБЛИЧКА ВОКРУГ КРАСНОГО КРУГА',facts:['На многих знаках ограничения скорости красный круг стоит на белой квадратной/прямоугольной табличке с тонким чёрным контуром. Это шире, чем белая окантовка по краю.','Белое снаружи красного есть и в других странах. Испанский сужает выбор; белые номера и машина Google помогают отличить Эквадор.','Иногда задники знаков бирюзовые — полезная дополнительная подсказка.'],source:'https://www.geocoach.me/theory/ecuador/identify'},
    {title:'🇵🇪 Перу — чёрно-белые стойки знаков',img:'./assets/sign-local-1.jpg',kicker:'ПОЛОСЫ НА СТОЙКЕ, А НЕ НА ЩИТЕ ЗНАКА',facts:['Чередующиеся чёрные и белые полосы на опоре дорожного знака — сильный признак Перу в Южной Америке.','Испанский + такая стойка + горная дорога хорошо сочетаются. Горы бывают и в Эквадоре, Колумбии, Боливии и Чили.','По всему миру полосатые стойки не уникальны: сначала проверь регион и язык.'],source:'https://www.plonkit.net/peru'},
    {title:'🇪🇸 Испания — сине-белые шевроны',img:'./assets/sign-local-2.jpg',source:'https://cyclingcols.b-cdn.net/photos/large/Confrides.jpg',kicker:'СИНИЙ ФОН + БЕЛЫЕ СТРЕЛКИ',facts:['В Испании бывают и чёрно-белые, и сине-белые шевроны.','Сине-белые в Европе ещё встречаются во Франции.','Испания часто показывает несколько стрелок на одной панели — добивай номерами и испанским текстом.']},
    {title:'🇵🇱 Польша — предупреждающий знак',img:'./assets/sign-local-3.jpg',source:'https://www.plonkit.net/poland',kicker:'ЖЁЛТЫЙ ФОН + ТОНКАЯ КРАСНАЯ КАЙМА',facts:['Треугольник жёлтый внутри, красная кайма заметно тонкая.','В Европе это очень сильная Польша.','Не путай с обычными белыми предупреждающими знаками соседей.']},
    {title:'🇪🇸 Испания ↔ 🇫🇷 Франция — красная кайма',img:'./assets/sign-local-4.jpg',source:'https://images.prismic.io/ornikar/3f92c9d1dd6774ab5eeb85ce599b9d55b6e7d7fd_panneau-danger-virages-epingle.jpg?auto=compress,format',kicker:'СМОТРИ НА САМЫЙ КРАЙ ЗНАКА',facts:['Испания: толстая красная кайма идёт прямо до физического края знака — без тонкой белой полоски снаружи.','Франция / Италия / Португалия: обычно виден тонкий белый внешний контур вокруг красного.','Если видишь только обратную сторону — в Испании стойки часто плоские.']},
    {title:'🇺🇸 США — SPEED LIMIT',img:'./assets/sign-local-5.jpg',source:'https://www.plonkit.net/united-states',kicker:'ПРЯМО НАПИСАНО SPEED LIMIT',facts:['Белый прямоугольник, чёрные слова SPEED LIMIT и число.','Канада чаще использует MAXIMUM — полезное различие.']},
    {title:'🇦🇪 ОАЭ — арабский + английский',img:'./assets/sign-uae.jpg',photoSource:'https://commons.wikimedia.org/wiki/File:Roadsignsuae.jpg',photoAuthor:'Jay Galvin',photoLicense:'2.0',photoLicenseUrl:'https://creativecommons.org/licenses/by/2.0/',kicker:'ДВЕ СТРОКИ: АРАБСКИЙ + ENGLISH',facts:['В ОАЭ английский рядом с арабским очень обычен.','Чёрно-белые полосатые стойки/бордюры дополнительно толкают в ОАЭ.','Похожая сигнатура есть в Омане и Катаре — не закрывай страну одним двуязычием.']},
    {title:'🇴🇲 Оман — арабский + английский',img:'./assets/sign-oman.jpg',photoSource:'https://commons.wikimedia.org/wiki/File:Road_Sign_Oman_2.JPG',photoAuthor:'Griebi 01',photoLicense:'4.0',kicker:'АРАБСКИЙ + ENGLISH + ГОРЫ/ПУСТЫНЯ',facts:['Синие указатели часто двуязычные.','Чёрно-белые стойки тоже встречаются — это сближает Оман с ОАЭ.','Жёлтые частные номера и более частые столбы помогают отделить Оман.']},
    {title:'🇶🇦 Катар — арабский + английский',img:'./assets/sign-local-8.jpg',source:'https://pbase.com/image/56835180',kicker:'АРАБСКИЙ + ENGLISH + ОЧЕНЬ ПЛОСКО',facts:['Двуязычные знаки похожи на ОАЭ/Оман.','Белые номера с бордовой полосой слева — полезное подтверждение Катара.','Страна обычно очень плоская и пустынная.']},
    {title:'🇬🇷 Греция — двуязычный указатель',img:'./assets/sign-greece.jpg',photoSource:'https://commons.wikimedia.org/wiki/File:A2_motorway,_Greece_-_Section_Thessaloniki-Langadas_-_Traffic_sign_(directions)_of_Liti_exit_-_01.jpg',photoAuthor:'Christaras A',photoLicense:'3.0',photoLicenseUrl:'https://creativecommons.org/licenses/by/3.0/',kicker:'ГРЕЧЕСКИЙ ЖЁЛТЫМ + ENGLISH БЕЛЫМ',facts:['На многих указателях греческая строка жёлтая, английская — белая. Обычные указатели часто синие; на фото зелёный автомагистральный.','Если это читается даже издали — сильная Греция.']},
    {title:'🇮🇹 Италия / 🇦🇱 Албания / 🇷🇴 Румыния — тёмная задняя сторона',img:'./assets/sign-dark-back.svg',schematic:true,source:'https://www.plonkit.net/italy',kicker:'ОБРАТНАЯ СТОРОНА ТЁМНО-СЕРАЯ / ЧЁРНАЯ',facts:['Полезно сузить юг/восток Европы.','Италия: две синие полосы номера + итальянский.','Албания: албанский + часто чёрные задники; Румыния: ș/ț/ă и дырчатые столбы.']}
  ];
  cards.forEach(card=>card.position='center');
  host.className='v5-photo-grid v5-sign-grid';
  host.innerHTML=cards.map(photoCardV5).join('');
}

function rebuildEnvironmentV5(){
  const host=document.getElementById('envGrid'); if(!host)return;
  const cards=[
    {"title":"🇨🇭 Швейцария — город и Альпы","img":"./assets/swiss-yellow-crossing.jpg","facts":["Горы есть у соседей; страна не вся горная. В городе ищи жёлтую зебру, короткий номер и низкую камеру."],"kicker":"РЕЛЬЕФ ТОЛЬКО ПОМОГАЕТ","source":"https://www.plonkit.net/switzerland"},
    {"title":"🇧🇷 Бразилия — красная почва","img":"./assets/brazil-red-soil.jpg","facts":["Красная почва часто помогает, но бывает у соседей и не покрывает всю Бразилию.","Португальский + лестничные столбы + номер с синей полосой сверху надёжнее одной почвы."],"kicker":"ПОРТУГАЛЬСКИЙ СИЛЬНЕЕ ЦВЕТА ГРУНТА","source":"https://www.plonkit.net/brazil"},
    {"title":"🇺🇸 Техас — несколько ландшафтов","img":"./assets/texas-hill-country.jpg","facts":["Запад сухой и местами горный; восток лесистый; в центре бывает холмистый Hill Country, на севере — равнины.","Похожие сухие места есть в Мексике и соседних штатах. Сначала проверь дорожные знаки, затем FM/RM или TEXAS."],"kicker":"ТЕХАС НЕ ВЕСЬ ПУСТЫННЫЙ","source":"https://tpwd.texas.gov/education/hunter-education/online-course/wildlife-conservation/texas-ecoregions"},
    {title:'🇵🇪 Перу — горы и побережье',img:'./assets/peru-andes-road.jpg',photoSource:'https://commons.wikimedia.org/wiki/File:Winding_mountain_road_to_Machu_Picchu_-_panoramio.jpg',photoAuthor:'Colin W — серпантин к Мачу-Пикчу',photoLicense:'3.0',kicker:'АНДЫ + ИСПАНСКИЙ + ПОЛОСАТЫЕ СТОЙКИ',facts:['Перу не только Лима: в Андах горные дороги и серпантины; на побережье сухо, на востоке тропики.','Горная местность не определяет страну. Добивай чёрно-белыми стойками знаков и номерами.'],source:'https://www.plonkit.net/peru'},
    {title:'🇪🇨 Эквадор — Анды и тропики',img:'./assets/ecuador-andes-road.jpg',position:'center bottom',photoSource:'https://commons.wikimedia.org/wiki/File:Paso_Papallacta.jpg',photoAuthor:'Sylvain2803 — перевал Папальякта',photoLicense:'3.0',kicker:'РЕЛЬЕФ ПОХОЖ НА СОСЕДЕЙ',facts:['Горы встречаются, но страна не вся горная. Испанский + белые номера — только начало проверки.','Посмотри форму знаков, их заднюю сторону и машину Google.'],source:'https://www.plonkit.net/ecuador'},
    {title:'🇳🇱 Нидерланды — город',img:'https://3pulse.com/uploads/photo/14/66/60/2020/09/05/43723f7b1e_medium.jpg',fallback:'https://upload.wikimedia.org/wikipedia/commons/5/5e/Amsterdam_canals_and_bicycles.jpg',kicker:'КАНАЛ + ВЕЛОСИПЕДЫ + ЖЁЛТЫЕ НОМЕРА',facts:['Красная велодорожка дополнительно усиливает.']},
    {title:'🇰🇷 Южная Корея — город',img:'https://s3.ap-northeast-2.amazonaws.com/com.hogangnono.upload/image/original/apt/3AVa3/20240419060653_Cjxd5oH92j2B3aN6lH',fallback:'https://upload.wikimedia.org/wikipedia/commons/1/16/Apartment_complex_in_Seoul.jpg',kicker:'МНОГО ОДИНАКОВЫХ ВЫСОТНЫХ БЛОКОВ',facts:['Корейский текст + горы вокруг города быстро закрывают страну.']},
    {title:'🇦🇪 ОАЭ — город / сухая среда',img:'https://www.dewdropsnursery.com/images/Jumeirah_Park.jpg',fallback:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dubai_skyline_2015.jpg?width=1200',kicker:'НОВЫЕ ШИРОКИЕ ДОРОГИ + СВЕТЛЫЕ ВИЛЛЫ / БАШНИ',facts:['Арабский + английский на знаках — сильное подтверждение.']},
    {title:'🇵🇭 Филиппины — тропики',img:'https://salaymisor.gov.ph/wp-content/uploads/2022/06/purok-8-road1.png',fallback:'https://upload.wikimedia.org/wikipedia/commons/f/f0/34Bagumbayan%2C_Taguig_City_20.jpg',kicker:'БЕТОННЫЕ ПЛИТЫ + ENGLISH',facts:['Правостороннее движение; jeepney/трициклы; плотная проводка.']},
    {title:'🇮🇩 Индонезия — тропики',img:'https://cdn.antaranews.com/cache/1200x800/2019/05/16/Desa-Penyombaan-Kabupaten-Lamandau.jpg',fallback:'https://upload.wikimedia.org/wikipedia/commons/0/09/Indonesian_village_road.jpg',kicker:'КРАСНО-БЕЛЫЕ СТОЛБИКИ + JALAN / KOTA / SELAMAT',facts:['Чёрные номера; левое движение; язык — индонезийская латиница.']},
    {title:'🇹🇭 Таиланд — тропики',img:'https://live.staticflickr.com/1481/24563386510_33a23421ee_b.jpg',fallback:'https://upload.wikimedia.org/wikipedia/commons/3/39/Thailand_rural_road.jpg',kicker:'ТАЙСКАЯ ПИСЬМЕННОСТЬ + ЛЕВОЕ ДВИЖЕНИЕ',facts:['Бетонные дороги и бетонные столбы очень обычны.']},
    {title:'🇯🇴 Иордания — сухая среда',img:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Desert_Highway_near_Wadi_Rum_in_southern_Jordan.jpg?width=1200',fallback:'',kicker:'КАМЕНИСТЫЕ СУХИЕ ХОЛМЫ + АРАБСКИЙ',facts:['В отличие от ОАЭ, английский на обычных коммерческих вывесках заметно менее системный.']},
    {title:'🇮🇷 Иран — сухая среда',img:'https://i0.wp.com/bestsellingcarsblog.com/wp-content/uploads/2019/06/Dasht-e-Kavir-6.jpg?resize=600%2C450',fallback:'https://upload.wikimedia.org/wikipedia/commons/8/8c/Desert_road_in_Iran.jpg',kicker:'ПЕРСИДСКАЯ ПИСЬМЕННОСТЬ + СУХОЙ ГОРОД',facts:['Ищи پ / چ / ژ / گ и домен .ir; движение справа.']}
  ];
  host.className='v5-photo-grid';
  host.innerHTML=cards.map(photoCardV5).join('');
}

function addAndeanCarsV5(){
  const host=document.getElementById('carGrid'); if(!host||document.getElementById('andeanGoogleCars'))return;
  const group=document.createElement('div');group.id='andeanGoogleCars';group.style.display='contents';
  group.innerHTML=[
    {title:'🇪🇨 Эквадор — белый пикап Google (Gen4)',img:'https://storage.googleapis.com/images-test-e94d1.firebasestorage.app/geo-features-groups/geo-group-2863_0_full.avif',kicker:'БЕЛЫЙ ПИКАП + ЧЁРНЫЙ КУЗОВ СЗАДИ + БЕЗ АНТЕННЫ',facts:['В покрытии Gen4 использовался белый пикап с чёрной задней частью, без антенны. Может быть сильно размыт.','Пикапы есть и в Панаме/Коста-Рике: у них может быть видна передняя антенна.','В Gen3 Эквадора обычная белая машина с короткой толстой антенной. Отсутствие пикапа Эквадор не исключает.'],source:'https://www.plonkit.net/ecuador'},
    {title:'🇵🇪 Перу — белая/чёрная машина (Gen3)',img:'https://storage.googleapis.com/images-test-e94d1.firebasestorage.app/geo-features-groups/geo-group-1346_0_full.avif',facts:['В Gen3 встречаются белая и чёрная машины; похожие есть у соседей.','Цвет машины слабее испанского текста и полосатых стоек знаков. Есть и другое покрытие.'],source:'https://www.plonkit.net/peru'}
  ].map(photoCardV5).join('');host.appendChild(group);
}

function addEcuadorPoleV5(){
  const host=document.getElementById('poleGrid');if(!host||document.getElementById('ecuadorLadderPole'))return;
  const wrap=document.createElement('div');wrap.id='ecuadorLadderPole';wrap.style.display='contents';
  wrap.innerHTML=photoCardV5({title:'🇪🇨 Эквадор — бетонный «лестничный» столб',img:'https://storage.googleapis.com/images-test-e94d1.firebasestorage.app/geo-features-groups/geo-group-1373_0_full.avif',facts:['Много небольших углублений подряд, как ступени лестницы. Полезно в латиноамериканской среде.','Обычные круглые бетонные опоры тоже встречаются и сами по себе почти ничего не дают.'],source:'https://www.geocoach.me/theory/ecuador/identify'});host.appendChild(wrap);
}

function addSpainPoleV5(){
  const host=document.getElementById('poleGrid'); if(!host)return;
  if([...host.querySelectorAll('h3')].some(h=>h.textContent.includes('Испания — бетонный «лестничный»')))return;
  const card=document.createElement('article'); card.className='v5-photo-card';
  card.innerHTML=`${safePhoto('https://upload.wikimedia.org/wikipedia/commons/1/19/Concrete_pylon_in_Spain.jpg','Испания — бетонный лестничный столб','')}<div class="v5-photo-body"><h3>🇪🇸 Испания — бетонный «лестничный» столб</h3><div class="v5-kicker">ПРЯМОУГОЛЬНЫЕ УГЛУБЛЕНИЯ / СТУПЕНИ</div><ul><li>По бетону вверх идут короткие прямоугольные выемки — выглядит как лестница.</li><li>В Испании также встречается «французский» тип верхушки с характерной перекладиной.</li><li><b>Не уникально:</b> похожие лестничные столбы есть во Франции. Добивай номером, языком и знаками.</li><li>Белые кольца/полосы на случайном столбе сами по себе Испанию не доказывают.</li></ul></div>`;
  host.appendChild(card);
}

function enrichFrequentPairsV5(){
  const hosts=[document.getElementById('pairGrid'),document.getElementById('v4QuickCompare')].filter(Boolean);
  hosts.forEach(host=>host.querySelectorAll('.pair-card,.v4-compare-card,.card').forEach(card=>{
    if(card.querySelector('.pair-country-meta'))return;
    const text=(card.querySelector('h3')?.textContent||card.textContent||'');
    const found=Object.entries(V5FLAGS).filter(([name])=>text.includes(name));
    if(!found.length)return;
    const row=document.createElement('div');row.className='pair-country-meta';
    row.innerHTML=found.map(([name,[code,lang]])=>`<div><img src="https://flagcdn.com/w80/${code}.png" alt="${name}"><b>${name}</b>${lang==='английский'?'':`<span>${lang}</span>`}</div>`).join('');
    const h=card.querySelector('h3');h?.insertAdjacentElement('afterend',row);
  }));
}

function repairKnownImagesV5(){
  const replacements=[
    ['Красная почва','https://upload.wikimedia.org/wikipedia/commons/4/48/Route_Nationale_8_%28Madagascar%29_03.JPG'],
    ['Оранжевая тропическая глина','https://upload.wikimedia.org/wikipedia/commons/4/48/Route_Nationale_8_%28Madagascar%29_03.JPG'],
    ['Светлая известняковая','https://upload.wikimedia.org/wikipedia/commons/5/58/Limestone_road.jpg'],
    ['Белёсая известняковая','https://upload.wikimedia.org/wikipedia/commons/5/58/Limestone_road.jpg']
  ];
  document.querySelectorAll('.real-card,.v5-photo-card,.card').forEach(card=>{
    const title=card.querySelector('h3')?.textContent||'';
    const rep=replacements.find(([k])=>title.includes(k));
    if(!rep)return;
    const img=card.querySelector('img'); if(img&&(!img.complete||img.naturalWidth===0))img.src=rep[1];
  });
}

function addSwissAndAmericanInfrastructureV5(){
  const groups={"poleGrid":[{"title":"🇨🇭 Швейцария — дорожный столбик","img":"./assets/swiss-bollard.jpg","facts":["Белый корпус, чёрная зона в верхней части, светлые отражатели; бывают круглые и клиновидные.","Круглые похожи на лихтенштейнские. Сочетай с жёлтой зеброй и белыми номерами."],"source":"https://www.plonkit.net/switzerland"},{"title":"🇧🇷 Бразилия — лестничный столб","img":"./assets/brazil-ladder-pole.jpg","facts":["В нижней части длинные секции, напоминающие лестницу; выше небольшие отверстия.","Похожие есть в Парагвае; португальский и BR-xxx проверяют Бразилию."],"source":"https://www.plonkit.net/brazil"},{"title":"🇲🇽 Мексика — восьмигранный столб","img":"./assets/mexico-octagonal-pole.jpg","facts":["Бетонный столб с углами, а не гладкий цилиндр; бывают надписи или клейма.","Похожие есть в Колумбии. Испанский, ALTO и MEXICO/PEMEX помогают проверить Мексику."],"source":"https://www.plonkit.net/mexico"}],"carGrid":[{"title":"🇨🇭 Швейцария — низкая камера","img":"./assets/swiss-low-camera.jpg","facts":["Камера ниже обычной: большой блюр машины внизу, объекты сняты с низкой точки.","В европейской среде проверяй Швейцарию и Лихтенштейн. Низкая камера бывает и в Японии и отдельных других покрытиях.","Это подсказка к камере, а не цвет автомобиля; подтверждай номерами и жёлтой зеброй."],"source":"https://www.plonkit.net/switzerland"}]};
  Object.entries(groups).forEach(([id,cards])=>{const host=document.getElementById(id);if(!host)return;const group=document.createElement("div");group.style.display="contents";group.innerHTML=cards.map(photoCardV5).join("");host.appendChild(group);});
}
