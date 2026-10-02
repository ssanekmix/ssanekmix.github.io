window.addEventListener('load',()=>setTimeout(applyV8,3000));

function applyV8(){
  syncHeaderOffsetV8();
  enhanceAmbiguousResultsV8();
  repairVisibleBrokenImagesV8();
  auditLayoutV8();
}

function syncHeaderOffsetV8(){
  const top=document.querySelector('.top');
  if(!top)return;
  const apply=()=>document.documentElement.style.setProperty('--geo-header-h',`${Math.ceil(top.getBoundingClientRect().height)}px`);
  apply();
  window.addEventListener('resize',apply,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(apply).observe(top);
}

const V8_AMBIGUOUS={
  'Левосторонняя группа':[
    ['🇬🇧 Великобритания','белый передний + жёлтый задний номер, английский, европейская среда'],
    ['🇲🇾 Малайзия','чёрные номера, малайская латиница, левое движение'],
    ['🇮🇩 Индонезия','чёрные номера + Jalan/Kota/Selamat + часто красно-белые столбики'],
    ['🇰🇪 Кения','белый/жёлтый номер + Восточная Африка + шноркель машины Google'],
    ['🇬🇾 Гайана','английский + чёрные номера + плоские влажные тропики/канавы'],
    ['🇿🇦 ЮАР','жёлтые внешние линии дороги + левое движение'],
    ['🇦🇺 Австралия / 🇳🇿 Новая Зеландия','английский; дальше знаки, болларды, рельеф и растительность'],
    ['🇸🇬 Сингапур','английский + китайский + очень чистый тропический город']
  ],
  '🇺🇬 Уганда / 🇰🇪 Кения':[
    ['🇰🇪 Кения','ищи чёрный шноркель машины Google; часто это лучший добивающий признак'],
    ['🇺🇬 Уганда','если шноркеля нет, ищи угандийскую дорожную среду/знаки; бело-жёлтого номера недостаточно']
  ],
  '🇲🇾 Малайзия / 🇮🇩 Индонезия':[
    ['🇮🇩 Индонезия','Jalan / Kota / Selamat, красно-белая окраска, часто 3 светлых блока размытого номера'],
    ['🇲🇾 Малайзия','аккуратнее инфраструктура; чёрный номер часто даёт 2 светлых блока']
  ],
  '🇦🇺 Австралия / 🇳🇿 Новая Зеландия':[
    ['🇦🇺 Австралия','жёлтые ромбовидные предупреждающие знаки, более сухие ландшафты, австралийские болларды'],
    ['🇳🇿 Новая Зеландия','обычно более зелёный/горный ландшафт, новозеландские болларды и дорожные столбики']
  ],
  '🇿🇦 ЮАР / 🇧🇼 Ботсвана / 🇱🇸 Лесото / 🇸🇿 Эсватини':[
    ['🇿🇦 ЮАР','самая разнообразная среда; английский/африкаанс, жёлтые внешние линии'],
    ['🇧🇼 Ботсвана','очень плоско, сухо, малонаселённо; жёлтые внешние линии'],
    ['🇱🇸 Лесото','резко горнее и высокогорнее соседей'],
    ['🇸🇿 Эсватини','зелёнее/холмистее Ботсваны; компактная южноафриканская среда']
  ],
  'Европа с EU-номером':[
    ['🇫🇷 Франция','rue/sortie, французские болларды, белая внешняя кайма на части предупреждающих знаков'],
    ['🇩🇪 Германия','Straße/Ausfahrt, немецкие болларды, часто очень строгая дорожная инфраструктура'],
    ['🇪🇸 Испания','calle/salida, испанская красная кайма до края знака, сине-белые шевроны встречаются'],
    ['🇮🇹 Италия','via/comune, тёмная задняя сторона знаков, часто номер с синими полосами по краям'],
    ['🇵🇱 Польша','ł/ą/ę, жёлтый фон предупреждающих знаков с тонкой красной каймой'],
    ['🇭🇷 Хорватия / 🇸🇰 Словакия / 🇸🇮 Словения / 🇨🇿 Чехия','решай по буквам языка и боллардам']
  ],
  'Испаноязычная Латинская Америка':[
    ['🇨🇴 Колумбия','почти повсеместные жёлтые номера'],
    ['🇲🇽 Мексика','MEXICO/PEMEX, ALTO + восьмигранные столбы; ALTO есть у соседей'],
    ['🇵🇪 Перу','чёрно-белые стойки знаков; Анды или сухая Лима помогают'],
    ['🇪🇨 Эквадор','бирюзовые задники знаков или белый пикап без антенны'],
    ['🇦🇷 Аргентина','синяя полоса общая с соседями; ищи ARGENTINA/.ar, старый центральный тёмный блок, двойные опоры'],
    ['🇨🇱 Чили','длинная сухая страна; север — экстремально сухой, инфраструктура аккуратнее многих соседей']
  ],
  'Группа стран с жёлтыми номерами':[
    ['🇳🇱 Нидерланды','Европа + велосипеды/каналы + жёлтые номера'],
    ['🇨🇴 Колумбия','испанский + Южная Америка + жёлтые номера'],
    ['🇮🇱 Израиль','иврит + жёлтые номера'],
    ['🇱🇺 Люксембург','Европа, компактная богатая среда; язык/домены помогают']
  ],
  '🇪🇸 Испания / 🇫🇷 Франция':[
    ['🇪🇸 Испания','испанский; у предупреждающего знака красная кайма обычно идёт прямо до физического края'],
    ['🇫🇷 Франция','французский; у многих предупреждающих знаков снаружи красной части виден белый край']
  ],
  'Латинская Америка':[
    ['🇨🇴 Колумбия','жёлтые номера'],
    ['🇵🇪 Перу','сухая пыльная среда/Лима'],
    ['🇦🇷 Аргентина','ARGENTINA/.ar; синяя полоса нового номера не уникальна'],
    ['🇧🇷 Бразилия','португальский, BRASIL, BR-xxx; синяя полоса сверху номера'],
    ['🇨🇱 Чили','длинные сухие ландшафты + чилийская инфраструктура']
  ],
  'Северная/Южная Америка — страна ещё не закрыта':[
    ['🇺🇸 США','ищи SPEED LIMIT, двойной жёлтый центр, американские знаки'],
    ['🇨🇦 Канада','ищи MAXIMUM, провинциальные маршруты, английский/французский'],
    ['Латинская Америка','испанский/португальский; дальше номер + Google-машина + среда']
  ],
  'Пока не определилось':[
    ['Язык','перейди к языкам: уникальная письменность часто режет варианты сильнее всего'],
    ['Номер','цвет, перед/зад, полосы по краям, цвет символов'],
    ['Разметка','цвет центра и краёв, пунктир/сплошная'],
    ['Знаки','форма, фон, кайма, обратная сторона'],
    ['Машина Google','шноркель, багажник, зеркала, машина сопровождения']
  ]
};

function enhanceAmbiguousResultsV8(){
  const root=document.getElementById('decision-path');
  const q=document.getElementById('v6Question');
  const choices=document.getElementById('v6Choices');
  if(!root||!q||!choices)return;

  const anchors=[['Языки','#latin-start'],['Номера','#plates'],['Разметка','#road-lines'],['Знаки','#signs'],['Столбы','#poles'],['Машина Google','#cars']];
  const patch=()=>{
    if(choices.querySelector('button[data-next]'))return;
    const h=q.querySelector('h3'); if(!h)return;
    const title=h.textContent.trim();
    let items=V8_AMBIGUOUS[title];
    const ambiguous=items||/\/|группа|Европа с|Латинская Америка|страна ещё не закрыта|Пока не определилось/i.test(title);
    if(!ambiguous)return;
    if(choices.dataset.v8For===title)return;
    if(!items){
      items=[
        ['Язык','проверь буквы/слова — это обычно самый сильный следующий фильтр'],
        ['Номер','проверь цвет, полосы и перед/зад'],
        ['Разметка','проверь цвет центральной и внешних линий'],
        ['Знаки','проверь цвет фона, кайму и обратную сторону']
      ];
    }
    choices.dataset.v8For=title;
    choices.innerHTML=`<div class="v8-ambiguous"><div class="v8-ambiguous-title">Осталось несколько вариантов — вот что проверять дальше:</div><div class="v8-candidates">${items.map(([name,check])=>`<div class="v8-candidate"><b>${name}</b><span>${check}</span></div>`).join('')}</div><div class="v8-next-links">${anchors.map(([name,href])=>`<a href="${href}">${name}</a>`).join('')}</div></div>`;
  };
  patch();
  new MutationObserver(()=>setTimeout(patch,0)).observe(q,{childList:true,subtree:true,characterData:true});
}

function commonsV8(name){return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=1200`;}

function repairVisibleBrokenImagesV8(){
  const fixes=[
    ['Норвегия — жёлтый центр',commonsV8('Road in Norway-1.jpg'),commonsV8('Road in Norway.jpg')],
    ['Красная глина в Юго-Восточной Азии',commonsV8('Dirt roads in Cambodia.jpg'),commonsV8('Highway near Sen Monorom.jpg')],
    ['Красная почва',commonsV8('Highway near Sen Monorom.jpg'),commonsV8('Dirt roads in Cambodia.jpg')],
    ['США — двойной жёлтый центр',commonsV8('2023-08-04 11 01 33 Double-yellow lines and yellow pavement reflector along Mercer County Route 579 (Bear Tavern Road) at Windybush Way in the Mountainview section of Ewing Township, Mercer County, New Jersey.jpg'),commonsV8('2024-02-05 11 40 47 A yellow pavement reflector between double-yellow center lines along Mercer County Route 579 (Bear Tavern Road) in the Mountainview section of Ewing Township, Mercer County, New Jersey.jpg')],
    ['Болгария —',commonsV8('Central-street-in-Blatnitsa.jpg'),commonsV8('Simeonovets-main-street.jpg')],
    ['Белый передний и жёлтый задний',commonsV8('British front and rear number plates.jpg'),commonsV8('UK registration plate.jpg')]
  ];

  document.querySelectorAll('article,img').forEach(el=>{
    const card=el.tagName==='IMG'?el.closest('article'):el;
    if(!card)return;
    const title=(card.querySelector('h3')?.textContent||card.textContent||'').trim();
    const hit=fixes.find(([key])=>title.includes(key));
    if(!hit)return;
    let img=card.querySelector('img');
    if(!img){img=document.createElement('img');img.alt=title;img.loading='lazy';card.prepend(img);}
    if(img.dataset.v8Fixed)return;
    img.dataset.v8Fixed='1';
    img.src=hit[1];
    img.dataset.v8Fallback=hit[2];
    img.style.display='block';
    img.onerror=()=>{
      if(img.dataset.v8Fallback&&img.src!==img.dataset.v8Fallback){img.src=img.dataset.v8Fallback;img.dataset.v8Fallback='';return;}
      img.style.display='none';
      if(!card.querySelector('.v8-photo-fallback')){
        const p=document.createElement('div');p.className='v8-photo-fallback';p.textContent='Фото временно не загрузилось — карточка остаётся доступной по текстовым признакам.';card.prepend(p);
      }
    };
  });
}

function auditLayoutV8(){
  const top=document.querySelector('.top');
  const nav=document.querySelector('.nav');
  const cards=[...document.querySelectorAll('.card,.real-card,.v5-photo-card,.env-card,.plate-card,.v4-compare-card')];
  const overflowing=cards.filter(c=>c.scrollWidth>c.clientWidth+2).length;
  const imgs=[...document.querySelectorAll('img')];
  const loaded=imgs.filter(i=>i.complete&&i.naturalWidth>40).length;
  const broken=imgs.filter(i=>i.complete&&i.naturalWidth<=40).length;
  window.__geoQaV8={headerHeight:top?Math.round(top.getBoundingClientRect().height):0,navScrollbarsHidden:!!nav,overflowingCards:overflowing,images:{total:imgs.length,loaded,broken,pending:imgs.length-loaded-broken},checkedAt:new Date().toISOString()};
}

