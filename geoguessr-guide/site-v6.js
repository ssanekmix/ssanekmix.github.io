window.addEventListener('load',()=>setTimeout(applyV6,1700));

function applyV6(){
  upgradeDecisionWizardV6();
  repairCriticalImagesV6();
  auditAllImagesV6();
  hardenLayoutV6();
}

function upgradeDecisionWizardV6(){
  const sec=document.getElementById('decision-path');
  if(!sec)return;
  sec.innerHTML=`
    <div class="section-head"><div><span class="eyebrow">00 · ОПРЕДЕЛИТЕЛЬ</span><h2>Иди по шагам, пока не останется страна</h2><p>Отвечай только на то, что реально видишь. Если признака нет — выбирай «не знаю».</p></div></div>
    <div class="v6-wizard">
      <div class="v6-wizard-top"><div id="v6Progress" class="v6-progress">Шаг 1</div><button id="v6Reset" class="v6-reset" type="button">↻ Начать заново</button></div>
      <div id="v6Trail" class="v6-trail"></div>
      <div id="v6Question" class="v6-question"></div>
      <div id="v6Choices" class="v6-choices"></div>
      <div id="v6Result" class="v6-result"></div>
    </div>`;

  const tree={
    start:{q:'На какой стороне едут?',hint:'Смотри на движущиеся машины, припаркованные авто и положение встречного потока.',a:[['Слева','left'],['Справа','right'],['Не видно','script']]},

    left:{q:'Какая письменность видна?',a:[['Тайская ถ','r_th'],['Японская 日本','r_jp'],['Сингальская/тамильская','r_lk'],['Китайская + английский','left_cn'],['Латиница / английский','left_latin'],['Текста нет','left_plate']]},
    left_cn:{q:'Среда какая?',a:[['Очень плотный высотный город','r_hk'],['Очень чистый тропический мегаполис','r_sg'],['Не уверен','left_plate']]},
    left_latin:{q:'Как выглядят номера?',a:[['Белый спереди + жёлтый сзади','left_wy'],['Чёрные','left_black'],['Обычные белые','left_white'],['Не вижу','left_env']]},
    left_wy:{q:'Какая среда?',a:[['Европа, кирпич, пасмурно','r_uk'],['Восточная Африка','left_africa'],['Южная Азия + необычная письменность','r_lk'],['Китайский + английский, плотный город','r_hk'],['Не уверен','left_africa']]},
    left_africa:{q:'Виден шноркель/часть машины Google?',a:[['Да, чёрный шноркель','r_ke'],['Нет / не уверен','r_ugke']]},
    left_black:{q:'Видишь слова Jalan / Kota / Selamat или похожую малайско-индонезийскую латиницу?',a:[['Да','left_myid'],['Нет, всё по-английски','r_gy'],['Не знаю','left_env']]},
    left_myid:{q:'Что ещё видно?',a:[['Красно-белые столбы / очень плотная Индонезия','r_id'],['Более аккуратная инфраструктура / чёрный номер чаще 2 светлых блока','r_my'],['Не уверен','r_myid']]},
    left_white:{q:'Что вокруг?',a:[['Австралия/Новая Зеландия по английской среде','r_aunz'],['Юг Африки + жёлтые края дороги','r_za'],['Филиппины? Но там движение справа','left_env'],['Не уверен','left_env']]},
    left_env:{q:'Какой самый сильный дополнительный признак?',a:[['Жёлтые внешние линии','r_za'],['Канавы, плоские тропики, английский, чёрные номера','r_gy'],['Очень чисто + китайский/английский','r_sg'],['Белый/жёлтый номер + Африка','left_africa'],['Ничего','r_left_group']]},
    left_plate:{q:'Какой цвет номера?',a:[['Чёрный','left_black'],['Белый спереди / жёлтый сзади','left_wy'],['Белый','left_env'],['Не знаю','left_env']]},

    right:{q:'Какая письменность?',a:[['Арабская / персидская','right_ar'],['Кириллица','right_cyr'],['Латиница','right_lat'],['Корейская 한글','r_kr'],['Китайская','r_tw'],['Текста нет','right_plate']]},
    right_ar:{q:'Есть ли английский рядом почти на каждом дорожном указателе?',a:[['Да','gulf'],['Нет, похоже на персидский','r_ir'],['Не уверен','gulf']]},
    gulf:{q:'Какая среда / номера?',a:[['Сверхновые широкие дороги, башни, светлая застройка','r_uae'],['Горы + пустыня, часто жёлтые номера','r_oman'],['Очень плоско, белые номера с бордовой полосой','r_qatar'],['Каменистые холмы, город проще','r_jordan']]},
    right_cyr:{q:'Есть особые буквы?',a:[['ї / є / і','r_ua'],['қ / ә / ғ / ң / ө / ү','r_kz'],['часто ъ','r_bg'],['ђ / ћ','r_rs'],['ничего особого','r_ru_mk']]},
    right_lat:{q:'На номере есть синяя полоса ЕС слева?',a:[['Да','eu_lang'],['Нет','non_eu_lat'],['Не вижу номер','lat_words']]},
    eu_lang:{q:'Что видно в языке?',a:[['rue / sortie / é è ç','r_fr'],['Straße / Weg / ß ä ö ü','r_de'],['calle / salida / ñ','r_es'],['via / comune / -zione','r_it'],['ulica + ł ą ę','r_pl'],['ř ě ů','r_cz'],['ľ ô ĺ ŕ','r_sk'],['ć đ Hrvatska','r_hr'],['č š ž без ć/đ','r_si'],['Не знаю','r_eu_group']]},
    non_eu_lat:{q:'Язык испанский?',a:[['Да','latam'],['Нет, турецкие ğ ş ı','r_tr'],['Английский + бетонные плиты + тропики','r_ph'],['Не знаю','right_plate']]},
    latam:{q:'Что сильнее всего видно?',a:[['Чёрно-белые полосатые стойки знаков','r_pe'],['Белые номера + белый пикап Google без антенны','r_ec'],['Белые номера + бирюзовые задники знаков','r_ec'],['Жёлтые номера почти на всех авто','r_co'],['Очень сухой пыльный мегаполис / голые холмы','r_pe'],['Новые номера с синей полосой сверху / очень широкая равнинная страна','r_ar'],['Не уверен','r_latam_group']]},
    lat_words:{q:'Есть характерные слова/буквы?',a:[['Jalan / Kota / Selamat','r_id'],['ğ ş ı / sokak / cadde','r_tr'],['calle / avenida / salida','latam'],['Не знаю','right_plate']]},
    right_plate:{q:'Какой номер?',a:[['Жёлтый','right_yellow'],['Чёрный','right_black'],['Белый с синей полосой ЕС','eu_lang'],['Белый без полос','right_env'],['Не вижу','right_env']]},
    right_yellow:{q:'Какая среда?',a:[['Европа + велосипеды/каналы','r_nl'],['Испанский + Южная Америка','r_co'],['Иврит','r_il'],['Не уверен','r_yellow_group']]},
    right_black:{q:'Какая среда?',a:[['Северная Африка + арабский/французский','r_tn'],['Юго-Восточная Азия','r_id'],['Не уверен','right_env']]},
    right_env:{q:'Что из этого видно?',a:[['Бетонные плиты + английский + трициклы/джипни','r_ph'],['Двойной жёлтый центр + SPEED LIMIT','r_us'],['Красная велодорожка + жёлтые номера','r_nl'],['Ничего','script']]},

    script:{q:'Какой самый заметный признак есть вообще?',a:[['Уникальная письменность','script_unique'],['Цвет номера','script_plate'],['Разметка','script_lines'],['Дорожные знаки','script_sign'],['Машина Google','script_car']]},
    script_unique:{q:'Какая?',a:[['ქართული — грузинская','r_ge'],['Հայերեն — армянская','r_am'],['Ελληνικά — греческая','r_gr'],['עברית — иврит','r_il'],['ไทย — тайская','r_th'],['日本語 — японская','r_jp'],['한글 — корейская','r_kr'],['Не знаю','script_plate']]},
    script_plate:{q:'Цвет/форма?',a:[['Жёлтый','right_yellow'],['Чёрный','right_black'],['Белый перед + жёлтый зад','left_wy'],['Белый с EU-полосой','eu_lang'],['Не знаю','script_lines']]},
    script_lines:{q:'Что с разметкой?',a:[['Двойной жёлтый центр + белые края','r_us'],['Жёлтые внешние линии','r_za'],['Жёлтый центр в Европе','r_no'],['Всё белое','script_sign']]},
    script_sign:{q:'Что со знаками?',a:[['SPEED LIMIT текстом','r_us'],['Жёлтый треугольник + тонкая красная кайма','r_pl'],['Арабский + английский','gulf'],['Сине-белые шевроны','r_esfr'],['Не знаю','script_car']]},
    script_car:{q:'Есть характерная машина Google?',a:[['Шноркель','r_ke'],['Чёрная лента на багажнике','r_gh'],['Багажник + квадратные зеркала','r_kg'],['Follow/police car','r_ng'],['Не вижу','r_no_answer']]},

    r_th:{r:'🇹🇭 Таиланд',why:'Тайская письменность + левостороннее движение — очень сильная связка.'},
    r_jp:{r:'🇯🇵 Япония',why:'Японская смесь кандзи + кана и левостороннее движение.'},
    r_lk:{r:'🇱🇰 Шри-Ланка',why:'Сингальская/тамильская письменность + левостороннее движение.'},
    r_hk:{r:'🇭🇰 Гонконг',why:'Китайский + английский + левое движение + плотная высотная среда.'},
    r_sg:{r:'🇸🇬 Сингапур',why:'Левое движение, английский/китайский, тропики и очень чистая городская инфраструктура.'},
    r_uk:{r:'🇬🇧 Великобритания',why:'Белый передний + жёлтый задний номер в европейской среде и левое движение.'},
    r_ke:{r:'🇰🇪 Кения',why:'Левое движение + восточноафриканская среда + шноркель машины Google.'},
    r_ugke:{r:'🇺🇬 Уганда / 🇰🇪 Кения',why:'Без car-meta разделить только по бело-жёлтым номерам нельзя — ищи шноркель, Google car, город и дорожные признаки.'},
    r_gy:{r:'🇬🇾 Гайана',why:'Левое движение + английский + чёрные номера + плоская влажная тропическая среда.'},
    r_id:{r:'🇮🇩 Индонезия',why:'Jalan/Kota/Selamat + чёрные номера + часто красно-белые столбы/окраска.'},
    r_my:{r:'🇲🇾 Малайзия',why:'Левое движение + малайская латиница + чёрные номера; инфраструктура обычно аккуратнее индонезийской.'},
    r_myid:{r:'🇲🇾 Малайзия / 🇮🇩 Индонезия',why:'Нужен ещё один признак: слова, форма блюра номера, флаговая окраска столбов, дорожная инфраструктура.'},
    r_aunz:{r:'🇦🇺 Австралия / 🇳🇿 Новая Зеландия',why:'Левое движение + английский; дальше решают болларды, дорожные знаки, рельеф и растительность.'},
    r_za:{r:'🇿🇦 ЮАР / 🇧🇼 Ботсвана / 🇱🇸 Лесото / 🇸🇿 Эсватини',why:'Левое движение + жёлтые внешние линии. Дальше различай по ландшафту, языку и Google coverage.'},
    r_left_group:{r:'Левосторонняя группа',why:'Сильного второго признака пока нет. Ищи язык → номер → разметку → car-meta.'},
    r_ir:{r:'🇮🇷 Иран',why:'Персидская письменность, правое движение; полезные буквы پ چ ژ گ.'},
    r_uae:{r:'🇦🇪 ОАЭ',why:'Системный арабский + английский, широкие новые дороги, светлая современная застройка.'},
    r_oman:{r:'🇴🇲 Оман',why:'Арабский + английский, горы/пустыня, менее глянцевая среда; жёлтые частные номера — сильная подсказка.'},
    r_qatar:{r:'🇶🇦 Катар',why:'Арабский + английский, очень плоская богатая среда, характерные белые номера с бордовым элементом.'},
    r_jordan:{r:'🇯🇴 Иордания',why:'Арабский, каменистые сухие холмы и более простая городская среда, чем в ОАЭ/Катаре.'},
    r_ua:{r:'🇺🇦 Украина',why:'ї / є / і — сильные языковые маркеры.'},
    r_kz:{r:'🇰🇿 Казахстан',why:'қ / ә / ғ / ң / ө / ү резко отделяют казахский от русского.'},
    r_bg:{r:'🇧🇬 Болгария',why:'Кириллица с частой ъ + балканская среда.'},
    r_rs:{r:'🇷🇸 Сербия',why:'ђ / ћ либо сербская латиница с đ/ć.'},
    r_ru_mk:{r:'🇷🇺 Россия / 🇲🇰 Северная Македония / другие кириллические',why:'Нужны домен, номера, дорога и специфические буквы.'},
    r_fr:{r:'🇫🇷 Франция / франкоязычная зона',why:'rue / sortie / mairie + французские диакритики. Номер и знаки добивают страну.'},
    r_de:{r:'🇩🇪 Германия / 🇦🇹 Австрия',why:'Straße, Bahnhof, Ausfahrt, ß/ä/ö/ü.'},
    r_es:{r:'🇪🇸 Испания',why:'Испанский + EU-номер; дополнительно испанские знаки/шевроны.'},
    r_it:{r:'🇮🇹 Италия',why:'via/comune/uscita/-zione + номера с двумя боковыми синими зонами.'},
    r_pl:{r:'🇵🇱 Польша',why:'ł/ą/ę/sz/cz + жёлтые предупреждающие знаки с тонкой красной каймой.'},
    r_cz:{r:'🇨🇿 Чехия',why:'ř/ě/ů — очень сильные языковые маркеры.'},
    r_sk:{r:'🇸🇰 Словакия',why:'ľ/ô/ĺ/ŕ + слова cesta/obec.'},
    r_hr:{r:'🇭🇷 Хорватия',why:'ć/đ/Hrvatska; синие гидранты могут подтвердить.'},
    r_si:{r:'🇸🇮 Словения',why:'č/š/ž при отсутствии хорватских ć/đ; Slovenija/občina.'},
    r_eu_group:{r:'Европа с EU-номером',why:'Сейчас решит язык, болларды, задняя сторона знаков и разметка.'},
    r_tr:{r:'🇹🇷 Турция',why:'ğ/ş/ı/İ, sokak/cadde/belediyesi.'},
    r_ph:{r:'🇵🇭 Филиппины',why:'Правое движение + английский + бетонные дорожные плиты + jeepney/трициклы.'},
    r_co:{r:'🇨🇴 Колумбия',why:'Испанский + почти повсеместные жёлтые номера.'},
    r_pe:{r:'🇵🇪 Вероятно Перу',why:'В Южной Америке испанский + чёрно-белые полосатые стойки знаков сильно указывают на Перу. Анды или сухая Лима — дополнительная проверка, один рельеф не решает.'},
    r_ec:{r:'🇪🇨 Вероятно Эквадор',why:'Испанский + белые номера + белый пикап Google без антенны (Gen4) или бирюзовые задники знаков. Проверь ещё один признак: белые номера и испанский есть у соседей.'},
    r_ar:{r:'🇦🇷 Аргентина',why:'Испанский; новые номера с синей верхней полосой и характерные аргентинские инфраструктурные clues.'},
    r_latam_group:{r:'Испаноязычная Латинская Америка',why:'Дальше важнее номера, Google-car, столбы, почва и городская среда, чем сам испанский.'},
    r_nl:{r:'🇳🇱 Нидерланды',why:'Жёлтые номера + правое движение + красные велодорожки/велосипеды/кирпичные улицы.'},
    r_il:{r:'🇮🇱 Израиль',why:'Иврит + жёлтые номера.'},
    r_yellow_group:{r:'Группа стран с жёлтыми номерами',why:'Цвет один не закрывает страну: NL / Colombia / Israel / Luxembourg и др. Нужен язык/среда.'},
    r_tn:{r:'🇹🇳 Тунис',why:'Чёрные номера + североафриканская среда + арабский/французский.'},
    r_us:{r:'🇺🇸 США',why:'SPEED LIMIT + жёлтый центр/двойной жёлтый + белые внешние линии — очень сильная связка.'},
    r_ge:{r:'🇬🇪 Грузия',why:'Грузинская письменность практически уникальна.'},
    r_am:{r:'🇦🇲 Армения',why:'Армянская письменность практически уникальна.'},
    r_gr:{r:'🇬🇷 Греция',why:'Греческий алфавит; дорожные указатели часто дублируют английский.'},
    r_kr:{r:'🇰🇷 Южная Корея',why:'Хангыль выглядит квадратными блоками из палок и кружков.'},
    r_tw:{r:'🇹🇼 Тайвань',why:'Традиционные китайские иероглифы + правое движение; полосатые основания столбов могут помочь.'},
    r_no:{r:'🇳🇴 Норвегия',why:'Жёлтая центральная разметка в Европе + норвежская среда/язык.'},
    r_esfr:{r:'🇪🇸 Испания / 🇫🇷 Франция',why:'Сине-белые шевроны бывают в обеих; отделяй по языку и форме красной каймы предупреждающих знаков.'},
    r_gh:{r:'🇬🇭 Гана',why:'Чёрная лента на правом конце передней перекладины багажника камеры — сильная meta.'},
    r_kg:{r:'🇰🇬 Кыргызстан',why:'Багажник камеры + видимые квадратные зеркала, постсоветская среда и горы.'},
    r_ng:{r:'🇳🇬 Нигерия',why:'Follow/police car в части покрытия — сильная meta.'},
    r_no_answer:{r:'Пока не определилось',why:'Нажми «Начать заново» и выбери другой первый сильный признак: иногда сторона движения просто не видна.'}
  };

  let current='start',history=[];
  const q=document.getElementById('v6Question'),choices=document.getElementById('v6Choices'),res=document.getElementById('v6Result'),trail=document.getElementById('v6Trail'),progress=document.getElementById('v6Progress');
  function render(){
    const n=tree[current];
    progress.textContent=`Шаг ${history.length+1}`;
    trail.innerHTML=history.map((x,i)=>`<span>${i+1}. ${x.label}</span>`).join('');
    res.innerHTML='';
    if(n.r){
      q.innerHTML=`<h3>${n.r}</h3><p>${n.why}</p>`;
      choices.innerHTML=`<button class="v6-secondary" data-restart>↻ Пройти заново</button>`;
      progress.textContent=`Результат · ${history.length} шагов`;
      choices.querySelector('[data-restart]').onclick=reset;
      return;
    }
    q.innerHTML=`<h3>${n.q}</h3>${n.hint?`<p>${n.hint}</p>`:''}`;
    choices.innerHTML=n.a.map(([label,next])=>`<button data-next="${next}">${label}</button>`).join('');
    choices.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>{history.push({label:b.textContent,node:current});current=b.dataset.next;render();});
  }
  function reset(){current='start';history=[];render();}
  document.getElementById('v6Reset').onclick=reset;
  render();
}

function commons(name){return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=1200`;}

function repairCriticalImagesV6(){
  const mappings=[
    {match:'Белый передний и жёлтый задний номер',src:commons('United Kingdom license plate DE57 UGK front and back.jpg')},
    {match:'Филиппины — бетонные плиты',src:commons('9924Rizal Anduyan, Tubao, La Union 59.jpg')},
    {match:'Нидерланды — красная велодорожка',src:commons('RedBikeLane.JPG')},
    {match:'Польша — предупреждающий',src:commons('Hedgehog warning sign in Warsaw at night.jpg')},
    {match:'красная велодорожка',src:commons('Netherlands, The Hague, Loudonstraat (01).jpg')},
    {match:'синие информационные указатели',src:commons('Blå vägen.JPG')}
  ];
  document.querySelectorAll('img').forEach(img=>{
    const context=[img.alt,img.closest('article')?.querySelector('h3')?.textContent,img.closest('section')?.querySelector('h2')?.textContent].filter(Boolean).join(' ');
    const hit=mappings.find(x=>context.toLowerCase().includes(x.match.toLowerCase()));
    if(hit)img.src=hit.src;
  });
  const wy=document.querySelector('#whiteYellowFamily img');
  if(wy){wy.src=commons('United Kingdom license plate DE57 UGK front and back.jpg');wy.alt='Реальный пример британских белого переднего и жёлтого заднего номерных знаков';}
}

function auditAllImagesV6(){
  const imgs=[...document.querySelectorAll('img')];
  window.__geoImageAudit={total:imgs.length,loaded:0,broken:0};
  const check=img=>{
    if(img.naturalWidth>40&&img.naturalHeight>40){img.classList.add('v6-img-ok');window.__geoImageAudit.loaded++;return;}
    img.classList.add('v6-img-broken');window.__geoImageAudit.broken++;
    if(!img.parentElement.querySelector('.v6-photo-warning')){
      const note=document.createElement('div');note.className='v6-photo-warning';note.textContent='Фото источника не загрузилось';img.insertAdjacentElement('afterend',note);
    }
  };
  imgs.forEach(img=>{
    if(img.complete)check(img);
    else{img.addEventListener('load',()=>check(img),{once:true});img.addEventListener('error',()=>check(img),{once:true});}
  });
}

function hardenLayoutV6(){
  document.querySelectorAll('.card,.real-card,.v5-photo-card,.env-card,.pair-card,.plate-card').forEach(c=>c.style.minWidth='0');
}
