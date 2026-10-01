window.addEventListener('load',()=>setTimeout(applyV5,900));

function applyV5(){
  fixRealPhotosV5();
  enrichFrequentPairsV5();
  replaceEnvironmentDrawingsWithPhotosV5();
}

const W=(name)=>`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=1200`;

function fixRealPhotosV5(){
  const exact=[
    ['Филиппины — бетонные плиты',W('National Road, Mamburao, Occidental Mindoro, May 2026 (2).jpg')],
    ['Нидерланды — кирпичная/брусчатая улица',W('Herenstraat in Den Hoorn, Texel, Niederlande.jpg')],
    ['Красная почва',W('Red soil image.jpg')],
    ['Оранжевая тропическая глина',W('Dirt roads in Cambodia.jpg')],
    ['Красная глина в Юго-Восточной Азии',W('Dirt roads in Cambodia.jpg')],
    ['Белёсая известняковая',W('Limestone Road Base.JPG')],
    ['Светлая известняковая дорога',W('Limestone Road Base.JPG')],
    ['Греция — синие указатели',W('A2 motorway, Greece - Section Thessaloniki-Langadas - Traffic sign (directions) of Liti exit - 01.jpg')],
    ['Швеция — синие информационные',W('20070421 har slutar allman vag.jpg')],
    ['Хорватия / Словения / Сербия / Черногория / Сев. Македония — жёлтые указатели',W('Croatia road sign C120.svg')],
    ['Болгария — дырчатый столб',W('Roadside concrete pole.jpg')]
  ];

  document.querySelectorAll('.real-card,.road-visual-card,.card').forEach(card=>{
    const title=card.querySelector('h3')?.textContent?.trim()||'';
    const hit=exact.find(([k])=>title.includes(k));
    if(!hit)return;
    let img=card.querySelector('img');
    if(!img){
      img=document.createElement('img');
      img.alt=title;
      img.loading='lazy';
      card.prepend(img);
    }
    img.src=hit[1];
    img.style.width='100%';
    img.style.height='280px';
    img.style.objectFit='cover';
    img.style.display='block';
    img.onerror=()=>{img.style.display='none'};
  });

  // Болгария: более полезный признак, чем просто «дырчатый столб».
  document.querySelectorAll('.real-card,.card').forEach(card=>{
    const h=card.querySelector('h3');
    if(!h || !h.textContent.includes('Болгария — дырчатый столб'))return;
    h.textContent='Болгария — бетонные столбы + чередующиеся крючки-изоляторы';
    const ul=card.querySelector('ul');
    if(ul)ul.innerHTML='<li>Чаще бетонный цилиндрический столб; «лестничный» вариант встречается, но не главный.</li><li>Сильнее смотри на верхушку: небольшие крючкообразные изоляторы часто расположены поочерёдно.</li><li>Кириллица с частой <b>ъ</b> и балканская среда подтверждают.</li>';
  });
}

function enrichFrequentPairsV5(){
  const host=document.getElementById('pairGrid');
  if(!host)return;
  const meta={
    'Франция':['fr','французский'],'Германия':['de','немецкий'],'Нидерланды':['nl','нидерландский'],'Бельгия':['be','французский / нидерландский'],'Словакия':['sk','словацкий'],'Хорватия':['hr','хорватский'],'Чехия':['cz','чешский'],'Словения':['si','словенский'],'Иран':['ir','персидский'],'Индия':['in','хинди + региональные языки'],'Турция':['tr','турецкий'],'ОАЭ':['ae','арабский'],'Малайзия':['my','малайский'],'Индонезия':['id','индонезийский'],'Испания':['es','испанский'],'Португалия':['pt','португальский'],'Ирландия':['ie','ирландский + английский'],'Швеция':['se','шведский'],'Финляндия':['fi','финский'],'Норвегия':['no','норвежский'],'Филиппины':['ph','филиппинский + английский'],'Гайана':['gy','английский'],'Аргентина':['ar','испанский'],'Перу':['pe','испанский'],'Греция':['gr','греческий'],'Япония':['jp','японский'],'Южная Корея':['kr','корейский'],'Таиланд':['th','тайский'],'Румыния':['ro','румынский'],'Венгрия':['hu','венгерский'],'Польша':['pl','польский'],'Болгария':['bg','болгарский'],'Сербия':['rs','сербский'],'Северная Македония':['mk','македонский'],'Италия':['it','итальянский'],'Шри-Ланка':['lk','сингальский / тамильский'],'Кения':['ke','суахили + английский'],'Уганда':['ug','английский / суахили'],'Гонконг':['hk','китайский + английский']
  };

  host.querySelectorAll('.pair-card,.card').forEach(card=>{
    if(card.querySelector('.pair-country-meta'))return;
    const title=card.querySelector('h3')?.textContent||card.textContent||'';
    const found=Object.entries(meta).filter(([name])=>title.includes(name));
    if(!found.length)return;
    const row=document.createElement('div');
    row.className='pair-country-meta';
    row.innerHTML=found.map(([name,[code,lang]])=>{
      const langText=lang==='английский'?'':`<span>${lang}</span>`;
      return `<div><img src="https://flagcdn.com/w80/${code}.png" alt="${name}"><b>${name}</b>${langText}</div>`;
    }).join('');
    const h=card.querySelector('h3');
    if(h)h.insertAdjacentElement('afterend',row); else card.prepend(row);
  });
}

function replaceEnvironmentDrawingsWithPhotosV5(){
  const mapping={
    'Нидерланды — город':'https://upload.wikimedia.org/wikipedia/commons/3/3f/Amsterdam_canal_with_bicycles.jpg',
    'Южная Корея — город':'https://pimg.mk.co.kr/news/cms/202509/11/news-p.v1.20250911.afdb9774f76947beb7d7400b38537bbd_R.jpg',
    'ОАЭ — город / сухая среда':'https://www.businessblog.ae/wp-content/uploads/2025/05/What-Is-the-Dubai-Municipality-Housing-Fee.jpg',
    'Филиппины — тропики':W('National Road, Mamburao, Occidental Mindoro, May 2026 (2).jpg'),
    'Индонезия — тропики':'https://upload.wikimedia.org/wikipedia/commons/9/9f/Indonesian_road_village.jpg',
    'Таиланд — тропики':'https://mpics-cdn-acc.mgronline.com/pics/Images/567000001541204.JPEG',
    'Иордания — сухая среда':'https://www.utilities-me.com/2021/07/Jordan_desert_2.jpg',
    'Иран — сухая среда':'https://shishdong.com/_next/image?q=75&url=https%3A%2F%2Fapi1.shishdong.com%2FFiles%2F2043472fb968-0183-48d1-91c9-7e7f71cf3552%2F0b8b83c6-d0ef-49f9-bd72-8c63fb2d2e9a.webp&w=3840',
    'Север Чили — пустыня':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Atacama_Desert_road_Chile.jpg?width=1200'
  };
  document.querySelectorAll('#envGrid .env-card,#envGrid .card').forEach(card=>{
    const title=card.querySelector('h3')?.textContent?.trim()||'';
    const src=Object.entries(mapping).find(([k])=>title.includes(k))?.[1];
    if(!src)return;
    const first=card.firstElementChild;
    const img=document.createElement('img');
    img.src=src; img.alt=title; img.loading='lazy'; img.className='env-real-photo';
    img.onerror=()=>img.remove();
    if(first && (first.tagName==='SVG' || first.classList.contains('env-visual'))) first.replaceWith(img); else card.prepend(img);
  });
}
