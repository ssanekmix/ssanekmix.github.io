document.addEventListener('DOMContentLoaded',()=>setTimeout(applyVisualFixes,0));

function applyVisualFixes(){
  rebuildEnvironment();
  rebuildSpecialPoles();
  fixGoogleCars();
  translateVisibleJargon();
}

function rebuildEnvironment(){
  const host=document.getElementById('envGrid');
  if(!host)return;
  const cards=[
    ['Город',[
      'Сначала смотри на номера и язык — они сильнее архитектуры.',
      'Одинаковые высотные жилые блоки + корейский текст → Южная Корея.',
      'Широкие новые дороги + арабский и английский + светлые виллы/башни → ОАЭ.',
      'Кирпичные рядные дома + левостороннее движение + белый номер спереди и жёлтый сзади → Великобритания.',
      'Каналы + велосипеды + жёлтые номера → Нидерланды.',
      'Красный кирпич/недострой + хорватский текст + синий гидрант → Хорватия.'
    ]],
    ['Джунгли / тропики',[
      'Левостороннее движение + чёрные номера → Малайзия или Индонезия. Дальше смотри на размытие номера: чаще 2 светлых блока против 3.',
      'Английский + бетонные плиты дороги + трайциклы → Филиппины.',
      'Тайская письменность + левостороннее движение + бетонные столбы → Таиланд.',
      'Английский/суахили + левостороннее движение + шноркель или машина сопровождения → Кения.',
      'Очень чистый мегаполис + английский/китайский + левостороннее движение → Сингапур.'
    ]],
    ['Пустыня / сухая среда',[
      'Арабский + английский + новые дороги/башни → ОАЭ.',
      'Арабский без глянцевой застройки + каменистые холмы → Иордания.',
      'Персидская письменность + правостороннее движение + большие сухие города → Иран.',
      'Огромная пустая степь/грунт + характерная машина Google → Монголия.',
      'Испанский + экстремально сухая Атакама + Анды → север Чили.',
      'Сухая плоская Африка + левостороннее движение + жёлтые внешние линии → Ботсвана / ЮАР / Лесото / Эсватини.'
    ]]
  ];
  host.innerHTML=cards.map(([title,facts])=>`<article class="env-card"><h3>${title}</h3><ul>${facts.map(x=>`<li>${x}</li>`).join('')}</ul></article>`).join('');
}

function rebuildSpecialPoles(){
  const base=document.getElementById('poleGrid');
  if(!base)return;
  document.getElementById('specialPoleHeading')?.remove();
  document.getElementById('specialPolePhotos')?.remove();

  const poles=[
    {
      title:'🇹🇼 Тайвань',
      img:'https://www.plonkit.net/images/resize/900/80/taiwan/ui_remover.png',
      facts:['Бетонный столб с чёрно-жёлтыми/оранжевыми диагональными полосами.','Полосатая зона тянется почти до земли — это главное отличие от похожих корейских столбов.']
    },
    {
      title:'🇰🇪 Кения',
      img:'https://unepccc.org/wp-content/uploads/2018/09/kiisi-mini-grid-kenya-mathilde-2015-1.jpg',
      facts:['Очень часто дерево или бетон.','У характерного кенийского варианта ищи асимметричную Г-/L-образную перекладину; подтверждай жёлтой центральной и белыми крайними линиями.']
    },
    {
      title:'🇲🇽 Мексика',
      img:'https://mapsensei.com/images/countries/mexico/mexico_57.webp',
      facts:['Часто встречаются многогранные бетонные/металлические столбы.','На фото хорошо видна «гранёная» форма и типичная сеть из нескольких таких опор подряд.']
    },
    {
      title:'🇬🇷 Греция',
      img:'https://images.squarespace-cdn.com/content/v1/60f6054f4e76b03092956de8/53d86f58-8af0-490a-b911-86471f397472/gr_pole.png?format=1000w',
      facts:['Ищи высокий тёмный деревянный столб и характерные верхние рамки/перекладины.','У варианта «арфа» металлическая рамка наверху образует вытянутую петлю/развилку.']
    },
    {
      title:'🇿🇦 ЮАР',
      img:'https://mapsensei.com/images/countries/south-africa/south-africa_18.webp',
      facts:['«Птичий столб»: небольшие белые изоляторы сверху действительно выглядят как сидящие птицы.','Жёлтые внешние линии дороги рядом сильно усиливают ЮАР.']
    },
    {
      title:'🇵🇭 Филиппины',
      img:'https://upload.wikimedia.org/wikipedia/commons/f/f0/34Bagumbayan%2C_Taguig_City_20.jpg',
      facts:['Очень часто бетонные столбы прямо у дороги и плотная воздушная проводка.','В городе подтверждай бетонными плитами покрытия и английскими/филиппинскими вывесками.']
    },
    {
      title:'🇦🇷 Аргентина',
      img:'https://learnablemeta.com/images/iklofsfUFV6mDtBk1YnbOCPSVNwruGwLkmjP.avif',
      facts:['Характерный двойной бетонный столб: две параллельные округлые стойки.','Между стойками видны бетонные кольца/перемычки — силуэт узнаётся даже издалека.']
    },
    {
      title:'🇯🇵 Япония',
      img:'https://p.potaufeu.asahi.com/bcdd-p/picture/27557096/39475a8570267d242ae415c35f5e6aa6.jpg',
      facts:['В городах очень плотная сеть проводов, трансформаторов и оборудования прямо на столбах.','С японским текстом и низкой камерой это сильное подтверждение; одна только густая проводка страну не доказывает.']
    }
  ];

  const h=document.createElement('h3');
  h.id='specialPoleHeading';
  h.className='subhead';
  h.textContent='Другие узнаваемые столбы — фото + что искать';
  const grid=document.createElement('div');
  grid.id='specialPolePhotos';
  grid.className='grid g4';
  grid.innerHTML=poles.map(p=>`<article class="card" style="overflow:hidden;padding:0"><img src="${p.img}" alt="${p.title}: пример столба" loading="lazy" style="width:100%;height:210px;object-fit:cover;display:block;background:#08111f"><div class="card-body" style="padding:16px"><h3>${p.title}</h3><ul>${p.facts.map(f=>`<li>${f}</li>`).join('')}</ul></div></article>`).join('');
  base.insertAdjacentElement('afterend',h);
  h.insertAdjacentElement('afterend',grid);
}

function fixGoogleCars(){
  const data=[
    {
      find:'Кения',
      title:'Кения — шноркель у машины Google',
      img:'https://pbs.twimg.com/media/F0b_hgYWwAA6FOK.jpg',
      facts:['Внизу кадра видна часть пикапа/капота.','Главное: сбоку капота торчит чёрная вертикальная трубка — шноркель.','Иногда сзади едет серый внедорожник сопровождения.']
    },
    {
      find:'Гана',
      title:'Гана — чёрная лента на багажнике камеры',
      img:'https://mapsensei.com/images/countries/ghana/ghana_11.webp',
      facts:['В кадр попадает багажник на крыше машины Google.','На ПРАВОМ конце передней перекладины ищи кусок чёрной ленты.','Нужна именно лента на перекладине, а не просто чёрная деталь машины.']
    },
    {
      find:'Кыргызстан',
      title:'Кыргызстан — багажник камеры + два зеркала',
      img:'https://images.squarespace-cdn.com/content/v1/60f6054f4e76b03092956de8/ae13ce92-eb82-4966-b618-c9eff9344205/Just_look_at_the_mirror_V8_too_many.png?format=2500w',
      facts:['Внизу кадра видны крыша/багажник машины Google.','По краям одновременно заметны оба боковых зеркала.','Ищи именно сочетание багажника и двух зеркал.']
    },
    {
      find:'Нигерия',
      title:'Нигерия — машина сопровождения сзади',
      img:'https://mapsensei.com/images/countries/nigeria/nigeria_27.webp',
      facts:['В нескольких соседних панорамах за машиной Google стабильно едет другой автомобиль.','Часто это полицейская/сопровождающая машина.','Не путай со случайной машиной: она должна оставаться сзади при движении по панорамам.']
    }
  ];

  document.querySelectorAll('.car-card').forEach(card=>{
    const titleNode=card.querySelector('h3');
    const current=titleNode?.textContent||'';
    const d=data.find(x=>current.includes(x.find));
    if(!d)return;
    titleNode.textContent=d.title;
    const shot=card.querySelector('.car-shot');
    if(shot)shot.innerHTML=`<img src="${d.img}" alt="${d.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">`;
    const ul=card.querySelector('ul');
    if(ul)ul.innerHTML=d.facts.map(x=>`<li>${x}</li>`).join('');
    const note=card.querySelector('.no-water');
    if(note)note.textContent='Что искать глазами на панораме:';
    const link=card.querySelector('a');
    if(link)link.textContent='реальный пример / источник ↗';
  });
}

function translateVisibleJargon(){
  const root=document.querySelector('main');
  if(!root)return;
  const repl=[
    [/\bclue\b/gi,'признак'],[/\bclues\b/gi,'признаки'],[/\bblur\b/gi,'размытие'],[/\bEU\b/g,'ЕС'],
    [/left-driving/gi,'левостороннее движение'],[/drive left/gi,'левостороннее движение'],[/drive right/gi,'правостороннее движение'],
    [/Arabic\+English/gi,'арабский + английский'],[/Arabic/gi,'арабский'],[/English\/Swahili/gi,'английский / суахили'],[/English\/Chinese/gi,'английский / китайский'],[/English\/Filipino/gi,'английский / филиппинский'],[/English/gi,'английский'],
    [/Persian script/gi,'персидская письменность'],[/Thai script/gi,'тайская письменность'],[/Croatian text/gi,'хорватский текст'],[/Spanish/gi,'испанский'],[/French/gi,'французский'],
    [/yellow center/gi,'жёлтая центральная линия'],[/white edges/gi,'белые крайние линии'],[/yellow outer lines/gi,'жёлтые внешние линии'],
    [/directional signs/gi,'дорожные указатели'],[/road markers/gi,'дорожные маркеры'],[/road marker/gi,'дорожный маркер'],[/roadlines/gi,'дорожная разметка'],
    [/crossbar/gi,'перекладина'],[/concrete\/metal poles/gi,'бетонные/металлические столбы'],[/concrete poles/gi,'бетонные столбы'],[/concrete/gi,'бетонный'],
    [/Greek harp pole/gi,'греческий столб «арфа»'],[/Bird pole/gi,'«птичий» столб'],[/Double concrete pole/gi,'двойной бетонный столб'],
    [/blue hydrant/gi,'синий гидрант'],[/roof rack/gi,'багажник на крыше'],[/black tape/gi,'чёрная лента'],[/follow\/police car/gi,'машина сопровождения'],[/follow car/gi,'машина сопровождения'],[/low cam/gi,'низкая камера'],
    [/commercial/gi,'коммерческий'],[/white-on-black/gi,'белые символы на чёрном фоне'],[/residential/gi,'жилой'],
    [/South Korea/gi,'Южная Корея'],[/Netherlands/gi,'Нидерланды'],[/Croatia/gi,'Хорватия'],[/Malaysia/gi,'Малайзия'],[/Indonesia/gi,'Индонезия'],[/Philippines/gi,'Филиппины'],[/Thailand/gi,'Таиланд'],[/Singapore/gi,'Сингапур'],[/Jordan/gi,'Иордания'],[/Iran/gi,'Иран'],[/Mongolia/gi,'Монголия'],[/northern Chile/gi,'север Чили'],[/Botswana/gi,'Ботсвана'],[/UK/gi,'Великобритания'],[/UAE/gi,'ОАЭ']
  ];
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(n=>{
    let t=n.nodeValue;
    repl.forEach(([a,b])=>t=t.replace(a,b));
    n.nodeValue=t;
  });
}
