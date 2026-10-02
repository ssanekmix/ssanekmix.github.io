window.addEventListener('load',()=>setTimeout(applyV2,100));

function applyV2(){
  rebuildLanguageLookup();
  rebuildPlateFamilies();
  rebuildRoadVisuals();
  rebuildEnvironmentVisuals();
  patchCountryNotes();
  addPoleFallbacks();
}

function rebuildLanguageLookup(){
  const uniqueHost=document.getElementById('uniqueLangGrid');
  const latinHost=document.getElementById('latinGrid');
  if(!uniqueHost||!latinHost)return;

  const unique=[
    {key:'თბილისი · ქუჩა',name:'Грузинский',country:'Грузия',street:'ქუჩა — улица',hint:'Буквы округлые, похожи на петли и маленькие кружки.',example:'Пример: თბილისი'},
    {key:'Երևան · փողոց',name:'Армянский',country:'Армения',street:'փողոց — улица',hint:'Угловатые знаки с множеством вертикальных штрихов.',example:'Пример: Երևան'},
    {key:'ΟΔΟΣ · Ω Δ Σ Ψ',name:'Греческий',country:'Греция',street:'οδός — улица; λεωφόρος — проспект',hint:'Ω, Δ, Σ, Ψ сразу отделяют от латиницы.',example:'Пример: Αθήνα'},
    {key:'רחוב · ירושלים',name:'Иврит',country:'Израиль',street:'רחוב — улица',hint:'Пишется справа налево; буквы квадратные и отдельные.',example:'Пример: ירושלים'},
    {key:'شارع · العربية',name:'Арабский',country:'Много стран Ближнего Востока и Сев. Африки',street:'شارع — улица',hint:'Связная вязь справа налево. Дальше различай страны по окружению, домену и номерам.',example:'Не путай с персидским: визуально очень близки.'},
    {key:'خیابان · ایران',name:'Персидский',country:'Иран',street:'خیابان — улица/проспект',hint:'Почти как арабский, но чаще встречаются پ چ ژ گ.',example:'Иран: فارسی / ایران'},
    {key:'ถนน · กรุงเทพ',name:'Тайский',country:'Таиланд',street:'ถนน — улица/дорога',hint:'Много маленьких кружков и завитков; движение слева.',example:'Часто рядом бетонные дороги/столбы.'},
    {key:'ຖະໜົນ · ລາວ',name:'Лаосский',country:'Лаос',street:'ຖະໜົນ — улица/дорога',hint:'Похож на тайский, но выглядит более кругло и «мягко».',example:'Сравни форму букв, не пытайся читать.'},
    {key:'ផ្លូវ · ភ្នំពេញ',name:'Кхмерский',country:'Камбоджа',street:'ផ្លូវ — улица/дорога',hint:'Очень сложные широкие символы с множеством нижних элементов.',example:'Пример: ភ្នំពេញ'},
    {key:'මාවත · ශ්‍රී ලංකා',name:'Сингальский',country:'Шри-Ланка',street:'මාවත / පාර — улица/дорога',hint:'Почти все символы округлые, как маленькие спирали.',example:'Левостороннее движение.'},
    {key:'한 국 역 · 로 길',name:'Корейский',country:'Южная Корея',street:'로 / 길 — улица/дорога',hint:'Хангыль: несколько букв внутри одного слогового блока. 한 = ㅎ + ㅏ + ㄴ. Часто видны ㅇ (кружок), ㅁ (квадрат), ㄴ (угол), ㅏ (палочка с ответвлением). Это не просто «округлые знаки».',example:'대한민국 / 서울역. В отличие от японских の / り / カ, буквы стоят внутри блока рядом и друг над другом. Кружок есть не в каждом блоке.'},
    {key:'の り ひ · カ タ ナ',name:'Японский',country:'Япония',street:'通り — улица; 丁目 — квартал',hint:'Ищи простые отдельные знаки японских азбук среди иероглифов: 東京へ行く. Хирагана: の り ひ あ; катакана: カ タ ナ. Катакана угловатая — японский не обязательно выглядит округлым.',example:'Корейский: 한 / 국 — блоки из нескольких букв. Японский: の / り / カ — отдельные знаки. Вывеска 東京 без азбуки может выглядеть как китайская: найди ещё текст.'},
    {key:'中 山 路 · 車站',name:'Китайский',country:'Китай / Тайвань / Гонконг и другие страны',street:'路 — дорога; 街 — улица; 大道 — проспект',hint:'Иероглифы бывают простыми (中 山) и сложными (國 灣). Нет японской азбуки の / り / カ и корейских слоговых блоков 한 / 역. Но короткая японская надпись тоже может состоять только из иероглифов.',example:'车站 — упрощённое, 車站 — традиционное письмо. На Тайване и в Гонконге обычно традиционное; для страны проверь движение, английский, номера и окружение.'},
    {key:'मार्ग · सड़क · रोड',name:'Деванагари / хинди',country:'Индия',street:'मार्ग / सड़क / रोड — улица/дорога',hint:'Слова как будто висят на общей горизонтальной линии сверху.',example:'Пример: भारत'},
    {key:'রোড · সড়ক',name:'Бенгальский',country:'Бангладеш / восток Индии',street:'রোড / সড়ক — дорога',hint:'Тоже есть верхняя линия, но символы более округлые, чем деванагари.',example:'Пример: বাংলাদেশ'},
    {key:'УЛИЦА · УЛ.',name:'Русский',country:'Россия',street:'улица / ул. / проспект — адресные слова',hint:'Кириллица без ї/є и без болгарской частой ъ.',example:'Домен .ru, белые номера без синей полосы ЕС.'},
    {key:'ВУЛИЦЯ · ВУЛ.',name:'Украинский',country:'Украина',street:'вулиця / вул. / проспект',hint:'Сильные буквы: ї, є, і.',example:'Номера часто дают сине-жёлтый блок слева.'},
    {key:'УЛИЦА · Ъ',name:'Болгарский',country:'Болгария',street:'улица / ул. / булевард',hint:'Кириллица; буква ъ встречается очень часто.',example:'Домен .bg.'},
    {key:'УЛИЦА · ULICA',name:'Сербский',country:'Сербия',street:'улица / ulica — улица',hint:'Можно встретить и кириллицу, и латиницу.',example:'Ищи đ/ć/č/š/ž в латинице.'},
    {key:'КӨШЕ · ДАҢҒЫЛ',name:'Казахский',country:'Казахстан',street:'көше — улица; даңғыл — проспект',hint:'Кириллица с қ, ә, ғ, ң, ө, ү, ұ, і.',example:'Эти буквы сильнее общей «похожести на русский».'}
  ];

  const latin=[
    {key:'RUE · É È Ç · -EAU',name:'Французский',country:'Франция / Бельгия / часть Швейцарии',street:'rue / avenue / boulevard / chemin',hint:'Часто: de, du, des; окончания -eau, -eux, -ique.',example:'Если видишь rue / sortie / mairie — сразу думай о французской зоне.'},
    {key:'STRASSE · ß · Ä Ö Ü',name:'Немецкий',country:'Германия / Австрия / немецкая часть Швейцарии',street:'Straße / Str. / Weg / Gasse',hint:'Длинные составные слова; Bahnhof, Ausfahrt, Gemeinde.',example:'В швейцарском стандартном немецком пишут ss вместо ß. Без ß страна ещё не определена: ищи короткий передний номер без ЕС, жёлтую зебру и низкую камеру.'},
    {key:'STRAAT · IJ · AA/EE/OO',name:'Нидерландский',country:'Нидерланды / Фландрия',street:'straat / weg / laan',hint:'Много двойных гласных; gemeente, ingang, uitgang.',example:'Жёлтые номера резко усиливают Нидерланды.'},
    {key:'Ł · Ą · Ę · SZ/CZ',name:'Польский',country:'Польша',street:'ulica / ul. / aleja',hint:'ł почти подарок; также ą, ę, ń, ś, ź, ż.',example:'Слова часто содержат sz, cz, rz.'},
    {key:'Ř · Ě · Ů',name:'Чешский',country:'Чехия',street:'ulice / ul. / náměstí / třída',hint:'ř — самый сильный быстрый маркер.',example:'Č/š/ž есть и у соседей, поэтому ищи именно ř/ě/ů.'},
    {key:'Ľ · Ô · Ĺ · Ŕ',name:'Словацкий',country:'Словакия',street:'ulica / ul. / námestie / cesta',hint:'ľ, ô, ĺ, ŕ заметно отделяют от чешского и хорватского.',example:'Slovensko, obec, cesta.'},
    {key:'Ć · Đ · HRVATSKA',name:'Хорватский',country:'Хорватия',street:'ulica / trg / cesta',hint:'ć и đ — ключ против Словении/Словакии.',example:'Hrvatska / općina.'},
    {key:'Č Š Ž · НЕТ Ć/Đ',name:'Словенский',country:'Словения',street:'ulica / cesta / trg',hint:'Есть č/š/ž, но обычно нет хорватских ć/đ.',example:'Slovenija / občina.'},
    {key:'Ő · Ű',name:'Венгерский',country:'Венгрия',street:'utca / út / tér',hint:'ő и ű очень характерны.',example:'Даже одно такое слово сильно толкает в Венгрию.'},
    {key:'Ș · Ț · Ă',name:'Румынский',country:'Румыния / Молдова',street:'strada / str. / calea / bulevard',hint:'ș, ț, ă — сильные маркеры.',example:'oraș, strada.'},
    {key:'Ğ · Ş · I / İ',name:'Турецкий',country:'Турция',street:'sokak / sk. / cadde / caddesi / bulvarı',hint:'ğ, ş и точечная/безточечная пара i/ı.',example:'belediyesi — очень полезное слово на муниципальных объектах.'},
    {key:'Ñ · DE LA / DEL · -O/-A',name:'Испанский',country:'Испания + большая часть Латинской Америки',street:'calle / avenida / carretera / camino',hint:'Если специальных букв мало, ищи структуру: de la, del, los, las; очень часты окончания -o/-a/-os/-as.',example:'То есть обычное слово вроде «...o» само по себе слабое, но серия таких окончаний + calle/salida уже полезна.'},
    {key:'Ã · Õ · -ÃO · DA/DO',name:'Португальский',country:'Португалия / Бразилия',street:'rua / avenida / estrada',hint:'Сильные куски: ã, õ, ção/ções, nh, lh; da/do/das/dos.',example:'Бразилия: португальский + полоса номера СВЕРХУ / BR-xxx. Португалия: европейская среда + полоса ЕС СЛЕВА; старые номера с жёлтым блоком справа.'},
    {key:'VIA · -ZIONE · -O/-A/-I/-E',name:'Итальянский',country:'Италия / итальянская часть Швейцарии',street:'via / viale / piazza / strada',hint:'Много слов заканчиваются на -o, -a, -i, -e; частое -zione.',example:'comune, uscita, della/di.'},
    {key:'VÄGEN · -GATAN · Å Ä Ö',name:'Шведский',country:'Швеция',street:'gata / gatan / väg / vägen',hint:'В названиях улиц часто увидишь -gatan и -vägen.',example:'По твоей заметке: vägen — очень полезный кусок.'},
    {key:'VEIEN · -GATA · Ø Æ Å',name:'Норвежский',country:'Норвегия',street:'vei / veien / gate / gata',hint:'veien — сильный дорожный кусок; также ø/æ/å.',example:'Зелёные коммерческие номера могут дополнительно подтвердить.'},
    {key:'VEJ · GADE · Ø Æ Å',name:'Датский',country:'Дания',street:'vej / gade',hint:'Короткое vej очень полезно против Швеции/Норвегии.',example:'Дания обычно очень плоская.'},
    {key:'TIE · KATU · AA/ÄÄ',name:'Финский',country:'Финляндия',street:'tie / katu',hint:'Много двойных гласных/согласных: aa, ii, kk, tt; слова часто длинные.',example:'По твоей заметке: tie — главный быстрый дорожный кусок.'},
    {key:'JALAN · KOTA · SELAMAT',name:'Индонезийский',country:'Индонезия',street:'jalan / Jl. — улица/дорога',hint:'Полезные слова: kota, jalan, selamat; язык выглядит как обычная латиница.',example:'Примеры из твоих заметок: Melati, Kota Cilegon, Selamat menunaikan ibadah puasa.'},
    {key:'JALAN · KAMPUNG · BANDAR',name:'Малайский',country:'Малайзия',street:'jalan / Jln. — улица/дорога',hint:'Похож на индонезийский; kampung, bandar встречаются часто.',example:'Дальше добивай чёрными номерами: Малайзия чаще выглядит как 2 светлых блока.'},
    {key:'STREET · ROAD · BARANGAY',name:'Филиппинский + английский',country:'Филиппины',street:'street / road / avenue; часто английские названия',hint:'Очень много английского текста; barangay — сильное местное слово.',example:'Бетонные плиты дороги + английский особенно полезны.'},
    {key:'ĐƯỜNG · PHỐ · Ă Â Ê Ô Ơ Ư',name:'Вьетнамский',country:'Вьетнам',street:'đường — улица/дорога; phố — улица/квартал',hint:'Очень много диакритики над/под латинскими буквами.',example:'đ, ă, â, ê, ô, ơ, ư сразу заметны.'}
  ];

  const card=x=>`<article class="lookup-lang"><div class="lang-key-big ${x.key.length>18?'script':''}">${x.key}</div><div class="lang-info"><div class="lang-country">${x.name} → ${x.country}</div><div class="street-line"><b>Как выглядит улица:</b> ${x.street}</div><p class="lang-hint">${x.hint}</p><p class="lang-example">${x.example}</p></div></article>`;
  uniqueHost.className='lookup-lang-grid';
  latinHost.className='lookup-lang-grid';
  uniqueHost.innerHTML=unique.map(card).join('');
  latinHost.innerHTML=latin.map(card).join('');
}

function plateSvg(type){
  const common=`<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="160" rx="18" fill="#081321"/>`;
  const white='#f2f1ec', blue='#2058b5', yellow='#f0d22e', black='#080808', green='#2b915c';
  if(type==='mercosur')return common+`<rect x="54" y="42" width="252" height="78" rx="7" fill="${white}"/><rect x="54" y="42" width="252" height="20" fill="${blue}"/><text x="180" y="57" text-anchor="middle" font-size="12" font-weight="800" fill="white">BRASIL</text><text x="180" y="102" text-anchor="middle" font-size="25" font-weight="800" fill="#111">ABC1D23</text></svg>`;
  if(type==='eu')return common+`<rect x="54" y="48" width="252" height="64" rx="8" fill="${white}"/><rect x="54" y="48" width="18" height="64" fill="${blue}"/><text x="180" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#111">AB 1234</text></svg>`;
  if(type==='both')return common+`<rect x="54" y="48" width="252" height="64" rx="8" fill="${white}"/><rect x="54" y="48" width="18" height="64" fill="${blue}"/><rect x="288" y="48" width="18" height="64" fill="${blue}"/><text x="180" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#111">AB 1234</text></svg>`;
  if(type==='plain')return common+`<rect x="54" y="48" width="252" height="64" rx="8" fill="${white}"/><text x="180" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#111">AB 1234</text></svg>`;
  if(type==='ukmix')return common+`<rect x="42" y="42" width="124" height="58" rx="8" fill="${white}"/><rect x="194" y="42" width="124" height="58" rx="8" fill="${yellow}"/><text x="104" y="78" text-anchor="middle" font-size="16" font-weight="800" fill="#111">ПЕРЕД</text><text x="256" y="78" text-anchor="middle" font-size="16" font-weight="800" fill="#111">ЗАД</text></svg>`;
  if(type==='yellow')return common+`<rect x="54" y="48" width="252" height="64" rx="8" fill="${yellow}"/><rect x="54" y="48" width="18" height="64" fill="${blue}" opacity=".9"/><text x="180" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#111">AB 1234</text></svg>`;
  if(type==='black')return common+`<rect x="50" y="44" width="260" height="72" rx="8" fill="${black}"/><g fill="#fff" opacity=".95"><rect x="78" y="74" width="48" height="12" rx="6"/><rect x="145" y="74" width="74" height="12" rx="6"/><rect x="239" y="74" width="42" height="12" rx="6"/></g></svg>`;
  if(type==='special')return common+`<rect x="36" y="48" width="82" height="64" rx="8" fill="${green}"/><rect x="139" y="48" width="82" height="64" rx="8" fill="#2459b5"/><rect x="242" y="48" width="82" height="64" rx="8" fill="#dce7d8"/><text x="180" y="136" text-anchor="middle" font-size="14" fill="#cbd8e8">зелёный / синий / зеленоватый</text></svg>`;
  if(type==='ua')return common+`<rect x="54" y="48" width="252" height="64" rx="8" fill="${white}"/><rect x="54" y="48" width="18" height="32" fill="#2576ce"/><rect x="54" y="80" width="18" height="32" fill="#f0d330"/><text x="180" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#111">AB 1234</text></svg>`;
  return common+'</svg>';
}

function rebuildPlateFamilies(){
  const host=document.getElementById('plateGroups');
  if(!host)return;
  const families=[
{"title":"Белый + синяя полоса СВЕРХУ — Mercosur","type":"mercosur","note":"Схема нового бразильского номера. Верхняя полоса общая с другими странами Mercosur; полоса ЕС находится слева.","rows":[["Бразилия","BRASIL на полосе + португальский (rua, saída, ã/õ, nh/lh). Старые номера бывают без синей полосы."],["Аргентина / Уругвай / Парагвай","Верхняя синяя полоса сама по себе их не отделяет. Смотри язык, название страны и инфраструктуру."],["Бразилия — коммерческие","На новом белом номере красные символы; старый вариант — красный фон."]]},
    {title:'Белый + синяя полоса слева',type:'eu',note:'Это НЕ страна — так выглядит огромная часть Европы. Здесь сразу переходи к языку, правому краю номера и окружению.',rows:[
      ['Франция / Германия / Испания / Польша / Хорватия / Словакия и др.','Один номер почти не различает их. Нужен язык, столбы, знаки, домен.'],
      ['Бельгия','Если символы выглядят бордово-красными, это уже отдельный сильный признак Бельгии.'],
      ['Норвегия','Обычные легковые номера тоже белые; зелёный номер на коммерческом фургоне — отдельный норвежский признак.']
    ]},
    {title:'Белый + синие полосы С ДВУХ СТОРОН',type:'both',note:'Одна картинка — два главных кандидата. Не дублируй её мысленно как два разных типа номера.',rows:[
      ['Италия','Передний номер часто заметно КОРОЧЕ; итальянский текст; много Fiat — слабое подтверждение.'],
      ['Албания','Передний обычно длиннее; может встречаться красная полоса слева; язык/окружение Балкан добивают выбор.']
    ]},
    {title:'Просто белый без синей полосы слева',type:'plain',note:'Такой номер встречается во множестве стран вне ЕС. Сразу смотри письменность и форму.',rows:[
      ['Швейцария','Передний очень короткий; задний с гербами. Сочетай с низкой камерой и жёлтой зеброй.'],
      ['США / Канада / Мексика','Короткие номера с региональными дизайнами. Смотри SPEED LIMIT/mph, MAXIMUM/km/h или MEXICO/ALTO.'],
      ['Россия','Кириллица; справа маленький региональный блок.'],
      ['Турция','Турецкая латиница ğ/ş/ı; длинные белые номера; домен .tr.'],
      ['Эквадор','Короткие и длинные белые номера + испанский; уточни по знакам и машине Google.'],
      ['Перу','Белые номера возможны; ищи испанский и чёрно-белые полосатые стойки знаков.'],
      ['Другие страны','Белый без синей полосы не является самостоятельным доказательством.']
    ]},
    {title:'Белый со специальным цветным блоком',type:'ua',note:'Крупный цветной кусок переживает размытие лучше символов.',rows:[
      ['Украина','Сине-жёлтый блок слева + украинская кириллица (ї/є/і).'],
      ['Португалия — старые номера','У них наоборот жёлтая вертикальная полоса СПРАВА; новые могут быть полностью обычными белыми.'],
      ['Эквадор — коммерческий транспорт','Оранжевая полоса сверху на белом номере; старые номера могут быть целиком оранжевыми.']
    ]},
    {title:'Белый спереди + жёлтый сзади',type:'ukmix',note:'Одинаковая цветовая идея встречается в разных частях мира — решает движение, язык и окружение.',rows:[
      ['Великобритания','Левостороннее движение + английский + европейская/британская среда.'],
      ['Кения','Левостороннее + Африка + часто шноркель машины Google.'],
      ['Уганда','Левостороннее + Восточная Африка; форма заднего номера может быть более квадратной.'],
      ['Шри-Ланка','Левостороннее + сингальская письменность.']
    ]},
    {title:'Жёлтые номера',type:'yellow',note:'Жёлтый цвет заметен издалека, но сам по себе не даёт одну страну.',rows:[
      ['Нидерланды','Жёлтые спереди И сзади + синяя полоса; очень плоско, каналы, велосипеды.'],
      ['Люксембург','Тоже жёлтые с обеих сторон, но местность холмистее; смесь французского/немецкого.'],
      ['Израиль','Жёлтые + иврит; сухая ближневосточная среда.'],
      ['Колумбия','Жёлтые обычные номера + испанский + Латинская Америка.'],
      ['Перу','Жёлтые встречаются наряду с белыми; у такси бывает жёлтый верх + белый низ. Отличай от Колумбии по стойкам знаков.']
    ]},
    {title:'Чёрный / очень тёмный номер',type:'black',note:'Через размытие читай НЕ символы, а количество светлых блоков и форму пластины.',rows:[
      ['Индонезия','Часто 3 светлых блока: регион / цифры / буквы. Двухстрочные варианты под углом могут выглядеть как несколько светлых квадратов по углам.'],
      ['Малайзия','Чаще 2 крупных светлых блока; левостороннее движение и малайский язык.'],
      ['Тунис','Чёрный номер + арабский/французский + сухая североафриканская среда.'],
      ['Сингапур','Есть тёмные классические варианты, но городская среда и английский важнее, чем подсчёт блоков.']
    ]},
    {title:'Зелёные / синие / зеленоватые специальные',type:'special',note:'Эти цвета обычно относятся не ко всем машинам страны, а к типу транспорта или старой серии.',rows:[
      ['Норвегия','Зелёные номера у части коммерческих фургонов.'],
      ['Сенегал','Старые характерные номера могут быть синими.'],
      ['Филиппины','В старых сериях/покрытиях встречается зеленоватый оттенок номера; новые могут быть белыми.'],
      ['Иордания','У части коммерческого транспорта бывает зелёная полоса на белом номере.']
    ]}
  ];
  host.innerHTML=families.map(f=>`<section class="plate-family"><h3 class="plate-family-title">${f.title}</h3><div class="plate-family-card"><div class="plate-family-visual">${plateSvg(f.type)}</div><div><div class="plate-note">${f.note}</div><div class="plate-family-info">${f.rows.map(r=>`<div class="candidate-row"><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div></div></div></section>`).join('');
}

function roadSvg(kind){
  const head='<svg viewBox="0 0 520 230" xmlns="http://www.w3.org/2000/svg">';
  const tail='</svg>';
  if(kind==='white')return head+`<rect width="520" height="230" fill="#8fb5d1"/><rect y="58" width="520" height="42" fill="#73935e"/><polygon points="110,230 210,100 310,100 410,230" fill="#555d63"/><path d="M260 108 V225" stroke="#fff" stroke-width="7" stroke-dasharray="26 22"/><path d="M185 126 L128 230M335 126 L392 230" stroke="#fff" stroke-width="5"/><text x="20" y="34" fill="#fff" font-size="19" font-weight="700">обычная белая разметка</text>`+tail;
  if(kind==='concrete')return head+`<rect width="520" height="230" fill="#92bdd6"/><rect y="55" width="520" height="38" fill="#6d945c"/><polygon points="70,230 175,92 345,92 450,230" fill="#c8c8c2"/><g stroke="#858585" stroke-width="3"><path d="M130 180 H390"/><path d="M155 145 H365"/><path d="M182 112 H338"/><path d="M260 92 V230"/></g><text x="20" y="34" fill="#fff" font-size="19" font-weight="700">бетонные плиты + швы</text>`+tail;
  if(kind==='brick')return head+`<rect width="520" height="230" fill="#93b9d0"/><rect y="52" width="520" height="40" fill="#71905a"/><rect y="92" width="520" height="138" fill="#9b5f4a"/><g stroke="#c98b72" stroke-width="2">${Array.from({length:7},(_,i)=>`<path d="M0 ${105+i*20} H520"/>`).join('')}${Array.from({length:13},(_,i)=>`<path d="M${i*45} 92 V230"/>`).join('')}</g><text x="20" y="34" fill="#fff" font-size="19" font-weight="700">кирпичная / брусчатая мостовая</text>`+tail;
  if(kind==='redbike')return head+`<rect width="520" height="230" fill="#91b8d0"/><rect y="55" width="520" height="40" fill="#6f915d"/><rect y="95" width="360" height="135" fill="#555d63"/><rect x="360" y="95" width="160" height="135" fill="#b5433d"/><path d="M360 95 V230" stroke="#fff" stroke-width="5"/><circle cx="435" cy="165" r="23" fill="none" stroke="#fff" stroke-width="5"/><circle cx="470" cy="165" r="23" fill="none" stroke="#fff" stroke-width="5"/><path d="M435 165 L453 136 L470 165 L452 165 L440 143" fill="none" stroke="#fff" stroke-width="4"/><text x="20" y="34" fill="#fff" font-size="19" font-weight="700">красная велодорожка</text>`+tail;
  if(kind==='yellowedge')return head+`<rect width="520" height="230" fill="#a3c6d8"/><rect y="52" width="520" height="42" fill="#b19b65"/><polygon points="70,230 175,94 345,94 450,230" fill="#555d63"/><path d="M185 110 L115 230M335 110 L405 230" stroke="#f1d332" stroke-width="7"/><path d="M260 102 V225" stroke="#fff" stroke-width="5" stroke-dasharray="28 22"/><text x="20" y="34" fill="#fff" font-size="19" font-weight="700">жёлтые внешние линии</text>`+tail;
  if(kind==='nordic')return head+`<rect width="520" height="230" fill="#0d1a29"/><g font-family="sans-serif" font-size="14" fill="#dce7f5" text-anchor="middle"><text x="90" y="25">Норвегия</text><text x="260" y="25">Швеция</text><text x="430" y="25">Финляндия</text></g><g><rect x="28" y="40" width="125" height="165" rx="8" fill="#5a6269"/><path d="M45 55 V192M136 55 V192" stroke="#fff" stroke-width="6" stroke-dasharray="34 20"/><path d="M90 55 V192" stroke="#e4c33b" stroke-width="5"/><rect x="198" y="40" width="125" height="165" rx="8" fill="#5a6269"/><path d="M215 55 V192M306 55 V192" stroke="#fff" stroke-width="6" stroke-dasharray="17 18"/><path d="M260 55 V192" stroke="#fff" stroke-width="5"/><rect x="368" y="40" width="125" height="165" rx="8" fill="#5a6269"/><path d="M385 55 V192M476 55 V192" stroke="#fff" stroke-width="6"/><path d="M430 55 V192" stroke="#fff" stroke-width="5"/></g>`+tail;
  if(kind==='italy')return head+`<rect width="520" height="230" fill="#9dc5d9"/><rect y="65" width="520" height="45" fill="#71915d"/><rect y="110" width="520" height="120" fill="#5b6268"/><rect x="255" y="35" width="10" height="150" fill="#777"/><polygon points="180,55 340,55 310,120 210,120" fill="#5c6063" stroke="#333" stroke-width="6"/><rect x="60" y="155" width="125" height="48" rx="14" fill="#c93030"/><circle cx="85" cy="203" r="16" fill="#1d1d1d"/><circle cx="160" cy="203" r="16" fill="#1d1d1d"/><text x="20" y="30" fill="#fff" font-size="19" font-weight="700">Италия: тёмно-серая обратная сторона знаков + часто Fiat</text>`+tail;
  return head+tail;
}

function rebuildRoadVisuals(){
  const host=document.getElementById('roadRules');
  if(!host)return;
  host.className='road-visual-grid';
  const cards=[
    {title:'Просто белая разметка в городе',kind:'white',facts:['Почти ничего не доказывает: это базовый вариант во множестве стран.','Сразу переключайся на номера → язык → бордюры/тротуар → столбы → знаки.']},
    {title:'Бетонные плиты дороги',kind:'concrete',facts:['Филиппины: очень часты, особенно вместе с английским текстом; старые номера могут выглядеть зеленоватыми.','Таиланд: тоже встречаются часто; тайская письменность + левостороннее движение решают.','Бельгия: плиты тоже бывают, но европейская среда полностью другая.']},
    {title:'Кирпич / брусчатка',kind:'brick',facts:['Часто встречается в Нидерландах/Бельгии и старых европейских центрах.','Не угадывай страну только по покрытию — номер и язык важнее.']},
    {title:'Красная велодорожка',kind:'redbike',facts:['Очень сильный образ Нидерландов, особенно если рядом каналы, велосипеды и жёлтые номера.','Обычный красноватый асфальт без велоинфраструктуры — слабый признак.']},
    {title:'Жёлтые внешние линии',kind:'yellowedge',facts:['ЮАР / Ботсвана / Лесото / Эсватини — важная группа, обычно левостороннее движение.','На Ближнем Востоке жёлтые края тоже возможны, поэтому проверяй сторону движения и письменность.']},
    {title:'Скандинавия: длина крайних линий',kind:'nordic',facts:['Норвегия: внешние штрихи длиннее.','Швеция: внешние штрихи обычно короче.','Финляндия: края часто сплошные.']},
    {title:'Италия: обратная сторона знаков',kind:'italy',facts:['Обратная сторона дорожных знаков часто выглядит тёмно-серой.','Fiat встречается часто, но это только слабое подтверждение — не отдельный доказательный признак.','Добивай итальянским языком и номерами с двумя синими полосами.']}
  ];
  host.innerHTML=cards.map(c=>`<article class="road-visual-card"><div class="road-visual">${roadSvg(c.kind)}</div><div class="road-copy"><h3>${c.title}</h3><ul>${c.facts.map(x=>`<li>${x}</li>`).join('')}</ul></div></article>`).join('');
}

function envSvg(kind){
  const h='<svg viewBox="0 0 520 230" xmlns="http://www.w3.org/2000/svg">',t='</svg>';
  if(kind==='nl')return h+`<rect width="520" height="230" fill="#98c4db"/><rect y="130" width="520" height="100" fill="#5d7f9c"/><rect x="0" y="88" width="170" height="42" fill="#73513d"/><rect x="190" y="75" width="145" height="55" fill="#8e5c43"/><rect x="355" y="92" width="165" height="38" fill="#774a39"/><rect x="48" y="168" width="86" height="25" rx="5" fill="#e8ce30"/><circle cx="410" cy="172" r="24" fill="none" stroke="#111" stroke-width="5"/><circle cx="458" cy="172" r="24" fill="none" stroke="#111" stroke-width="5"/><path d="M410 172 L433 140 L458 172 L432 172 L418 149" stroke="#111" stroke-width="5" fill="none"/><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">канал + велосипед + жёлтый номер</text>`+t;
  if(kind==='kr')return h+`<rect width="520" height="230" fill="#9bc4d8"/><path d="M0 120 L95 60 L165 120 L250 55 L340 120 L430 68 L520 120 V230 H0Z" fill="#6f8d66"/><g fill="#dfe4e7">${[60,150,240,330,420].map(x=>`<rect x="${x}" y="75" width="58" height="135"/>`).join('')}</g><g fill="#7aa0bb">${[60,150,240,330,420].map(x=>`<g>${[90,118,146,174].map(y=>`<rect x="${x+10}" y="${y}" width="12" height="9"/><rect x="${x+34}" y="${y}" width="12" height="9"/>`).join('')}</g>`).join('')}</g><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">одинаковые высотные жилые блоки + горы</text>`+t;
  if(kind==='uae')return h+`<rect width="520" height="230" fill="#a8d0e0"/><rect y="160" width="520" height="70" fill="#d9c79c"/><rect x="250" y="45" width="55" height="115" fill="#b7c9d2"/><rect x="320" y="25" width="72" height="135" fill="#9fc1d0"/><rect x="405" y="70" width="45" height="90" fill="#d9e2e7"/><rect x="80" y="105" width="110" height="55" fill="#e8dfcf"/><path d="M185 105 q18 -44 36 0" fill="none" stroke="#d9d0c1" stroke-width="7"/><polygon points="205,230 250,160 360,160 420,230" fill="#666d72"/><path d="M310 165 V225" stroke="#fff" stroke-width="5" stroke-dasharray="20 16"/><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">широкие новые дороги + светлые виллы + башни</text>`+t;
  if(kind==='ph')return h+`<rect width="520" height="230" fill="#97c9dd"/><rect y="80" width="520" height="60" fill="#4f9a55"/><polygon points="70,230 170,130 350,130 450,230" fill="#c9c9c3"/><g stroke="#8b8b8b" stroke-width="3"><path d="M130 190 H390"/><path d="M155 160 H365"/><path d="M260 130 V230"/></g><rect x="36" y="70" width="150" height="55" fill="#f4f1dc"/><text x="111" y="100" text-anchor="middle" fill="#222" font-size="16" font-weight="700">ROAD / BARANGAY</text><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">бетонные плиты + английский</text>`+t;
  if(kind==='id')return h+`<rect width="520" height="230" fill="#91c5d9"/><rect y="80" width="520" height="70" fill="#409552"/><polygon points="80,230 180,140 340,140 440,230" fill="#585e63"/><g>${[105,390].map(x=>`<rect x="${x}" y="60" width="16" height="130" fill="#eee"/><rect x="${x}" y="60" width="16" height="28" fill="#d33131"/><rect x="${x}" y="116" width="16" height="28" fill="#d33131"/>`).join('')}</g><rect x="185" y="72" width="150" height="48" fill="#fff"/><text x="260" y="94" text-anchor="middle" fill="#222" font-size="14" font-weight="700">KOTA · JALAN</text><text x="260" y="112" text-anchor="middle" fill="#222" font-size="12">SELAMAT</text><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">красно-белые столбы + индонезийская латиница</text>`+t;
  if(kind==='th')return h+`<rect width="520" height="230" fill="#95c8dd"/><rect y="80" width="520" height="60" fill="#4a9555"/><polygon points="65,230 170,135 350,135 455,230" fill="#c9c8c1"/><g stroke="#8d8d8d" stroke-width="3"><path d="M120 195 H400"/><path d="M150 165 H370"/></g><rect x="290" y="60" width="180" height="55" fill="#f6f2db"/><text x="380" y="94" text-anchor="middle" fill="#222" font-size="22" font-weight="700">ถนน กรุงเทพ</text><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">бетонные плиты + тайская письменность</text>`+t;
  if(kind==='jo')return h+`<rect width="520" height="230" fill="#abd0df"/><path d="M0 155 L90 85 L180 150 L275 92 L360 150 L455 98 L520 145 V230 H0Z" fill="#9f8f75"/><polygon points="90,230 190,150 330,150 430,230" fill="#66645e"/><rect x="35" y="65" width="160" height="50" fill="#efe9d9"/><text x="115" y="97" text-anchor="middle" fill="#222" font-size="22">شارع</text><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">каменистые сухие холмы + арабский</text>`+t;
  if(kind==='ir')return h+`<rect width="520" height="230" fill="#a5cadc"/><rect y="145" width="520" height="85" fill="#c7ad79"/><g fill="#c9c0ad"><rect x="40" y="88" width="100" height="57"/><rect x="155" y="70" width="130" height="75"/><rect x="305" y="94" width="95" height="51"/></g><rect x="290" y="42" width="180" height="45" fill="#f3eedc"/><text x="380" y="72" text-anchor="middle" fill="#222" font-size="20">خیابان ایران</text><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">персидская письменность + сухой большой город</text>`+t;
  if(kind==='cl')return h+`<rect width="520" height="230" fill="#9fc8dc"/><path d="M0 135 L85 75 L160 128 L240 65 L330 128 L430 70 L520 135 V230 H0Z" fill="#7f776d"/><rect y="150" width="520" height="80" fill="#c69a62"/><path d="M160 230 L230 150 L300 150 L370 230" fill="#595d60"/><text x="20" y="30" fill="#fff" font-size="18" font-weight="700">очень сухая Атакама + Анды</text>`+t;
  return h+t;
}

function rebuildEnvironmentVisuals(){
  const host=document.getElementById('envGrid');
  if(!host)return;
  host.className='env-visual-grid';
  const cards=[
    ['Нидерланды — город','nl',['Каналы + велосипеды + жёлтые номера.','Красная велодорожка дополнительно усиливает.']],
    ['Южная Корея — город','kr',['Много одинаковых высотных жилых блоков.','Корейский текст + горы рядом с городом быстро закрывают страну.']],
    ['ОАЭ — город / сухая среда','uae',['Широкие новые дороги, светлые виллы, современные башни.','Арабский + английский.']],
    ['Филиппины — тропики','ph',['Бетонные плиты дороги + английский — одна из самых полезных комбинаций.','Старые/часть номеров могут выглядеть зеленоватыми.']],
    ['Индонезия — тропики','id',['Красно-белая окраска столбов/объектов под цвета флага — полезное подтверждение.','Ищи Jalan, Kota, Selamat; примеры: Melati, Kota Cilegon, Selamat menunaikan ibadah puasa.']],
    ['Таиланд — тропики','th',['Бетонные дороги/плиты встречаются часто.','Тайская письменность + левостороннее движение сильнее покрытия.']],
    ['Иордания — сухая среда','jo',['Арабский + каменистые холмы + более простая сухая застройка.','От ОАЭ отличай по отсутствию глянцевой новой городской среды.']],
    ['Иран — сухая среда','ir',['Персидская письменность + правостороннее движение + большие сухие города.','Ищи پ/چ/ژ/گ и домен .ir.']],
    ['Север Чили — пустыня','cl',['Экстремально сухая Атакама + Анды + испанский.','Дальше отличай от Перу/Аргентины по дорожной инфраструктуре и городам.']]
  ];
  host.innerHTML=cards.map(c=>`<article class="env-visual-card"><div class="env-visual">${envSvg(c[1])}</div><div class="env-copy"><h3>${c[0]}</h3><ul>${c[2].map(x=>`<li>${x}</li>`).join('')}</ul></div></article>`).join('');
}

function patchCountryNotes(){
  const notes={
    'Индонезия':['Красно-белые столбы/окраска объектов часто повторяют цвета флага.','Языковые примеры: Melati, Kota Cilegon, Selamat menunaikan ibadah puasa.'],
    'Филиппины':['Очень частая связка: бетонные плиты дороги + английский текст.','Старые/часть номеров могут выглядеть зелёными или зеленоватыми.'],
    'Таиланд':['Бетонные плиты/бетонные дороги встречаются часто; подтверждай тайской письменностью и левосторонним движением.'],
    'Италия':['Обратная сторона многих дорожных знаков выглядит тёмно-серой.','Fiat часто встречается, но это слабый дополнительный признак — не используй один.']
  };
  document.querySelectorAll('#countryGrid .card').forEach(card=>{
    const title=card.querySelector('h3')?.textContent||'';
    const found=Object.entries(notes).find(([name])=>title.includes(name));
    if(!found||card.querySelector('.country-extra'))return;
    const p=document.createElement('div');
    p.className='country-extra '+(found[0]==='Италия'?'weak-extra':'');
    p.innerHTML=`<b>Добавить к проверке:</b><br>${found[1].map(x=>`• ${x}`).join('<br>')}`;
    card.querySelector('.card-body')?.appendChild(p);
  });
}

function poleFallbackSvg(title){
  const base=(inner)=>`<svg viewBox="0 0 480 250" xmlns="http://www.w3.org/2000/svg"><rect width="480" height="250" fill="#a8cfe0"/><rect y="168" width="480" height="82" fill="#70935d"/>${inner}</svg>`;
  if(title.includes('Тайван'))return base(`<rect x="230" y="35" width="26" height="190" fill="#b5b5b5"/><g stroke="#e5b62e" stroke-width="13">${[70,105,140,175].map(y=>`<path d="M224 ${y} l38 28"/>`).join('')}</g><g stroke="#222" stroke-width="13">${[88,123,158].map(y=>`<path d="M224 ${y} l38 28"/>`).join('')}</g>`);
  if(title.includes('Кения'))return base(`<rect x="235" y="45" width="20" height="185" fill="#79563b"/><rect x="235" y="58" width="115" height="14" fill="#5b4635"/><circle cx="345" cy="65" r="9" fill="#f2f2e8"/>`);
  if(title.includes('Мекс'))return base(`<polygon points="230,38 250,30 267,42 260,225 235,225" fill="#aeb1b2"/><g stroke="#333" stroke-width="5"><path d="M185 65 H315"/><path d="M198 82 H302"/></g>`);
  if(title.includes('Грец'))return base(`<rect x="235" y="55" width="18" height="170" fill="#6f543e"/><path d="M244 62 C205 38 195 72 215 88 M244 62 C282 38 294 72 272 88" fill="none" stroke="#333" stroke-width="8"/><circle cx="215" cy="88" r="7" fill="#eee"/><circle cx="272" cy="88" r="7" fill="#eee"/>`);
  if(title.includes('ЮАР'))return base(`<rect x="235" y="55" width="18" height="170" fill="#75583e"/><path d="M185 68 H305" stroke="#555" stroke-width="7"/><g fill="#eee"><ellipse cx="205" cy="61" rx="11" ry="7"/><ellipse cx="245" cy="61" rx="11" ry="7"/><ellipse cx="285" cy="61" rx="11" ry="7"/></g>`);
  if(title.includes('Филип'))return base(`<rect x="236" y="40" width="22" height="188" fill="#b4b4b4"/><g stroke="#333" stroke-width="4"><path d="M90 55 L390 100"/><path d="M80 88 L405 125"/><path d="M120 120 L370 65"/><path d="M110 145 L400 145"/></g><rect x="210" y="75" width="72" height="42" rx="5" fill="#666"/>`);
  if(title.includes('Аргент'))return base(`<rect x="205" y="42" width="22" height="185" rx="9" fill="#b8b8b8"/><rect x="255" y="42" width="22" height="185" rx="9" fill="#b8b8b8"/><g fill="#9b9b9b">${[80,120,160].map(y=>`<rect x="224" y="${y}" width="34" height="10" rx="4"/>`).join('')}</g>`);
  if(title.includes('Япон'))return base(`<rect x="238" y="35" width="20" height="195" fill="#a9a9a9"/><g stroke="#333" stroke-width="4"><path d="M70 55 H410"/><path d="M50 78 H430"/><path d="M90 100 H395"/><path d="M105 125 H375"/></g><g fill="#555"><rect x="208" y="65" width="80" height="45" rx="6"/><circle cx="220" cy="130" r="12"/><circle cx="278" cy="130" r="12"/></g>`);
  return base(`<rect x="236" y="40" width="22" height="188" fill="#aaa"/>`);
}

function addPoleFallbacks(){
  document.querySelectorAll('#specialPolePhotos .card').forEach(card=>{
    const title=card.querySelector('h3')?.textContent||'';
    const img=card.querySelector('img');
    if(!img)return;
    const fallback='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(poleFallbackSvg(title));
    img.onerror=()=>{img.onerror=null;img.src=fallback;img.style.objectFit='contain';};
  });
}
