const countries={
  georgia:{name:'Грузия',code:'ge',lat:42.3,lng:43.4,zoom:6,hint:'Кавказ: между Чёрным морем, Россией, Турцией, Арменией и Азербайджаном.'},
  armenia:{name:'Армения',code:'am',lat:40.1,lng:45.0,zoom:7,hint:'Южный Кавказ, прямо к югу от Грузии.'},
  greece:{name:'Греция',code:'gr',lat:39.1,lng:21.8,zoom:6,hint:'Юг Балкан, между Ионическим и Эгейским морями.'},
  israel:{name:'Израиль',code:'il',lat:31.5,lng:34.9,zoom:7,hint:'Восточное Средиземноморье: между Ливаном, Иорданией и Египтом.'},
  thailand:{name:'Таиланд',code:'th',lat:15.8,lng:100.9,zoom:5,hint:'Юго-Восточная Азия: между Мьянмой, Лаосом, Камбоджей и Малайзией.'},
  laos:{name:'Лаос',code:'la',lat:19.9,lng:102.5,zoom:6,hint:'Юго-Восточная Азия, без выхода к морю, восточнее Таиланда.'},
  cambodia:{name:'Камбоджа',code:'kh',lat:12.6,lng:105.0,zoom:6,hint:'Юго-Восточная Азия, между Таиландом и Вьетнамом.'},
  srilanka:{name:'Шри-Ланка',code:'lk',lat:7.9,lng:80.8,zoom:6,hint:'Остров прямо к югу от Индии.'},
  korea:{name:'Южная Корея',code:'kr',lat:36.0,lng:127.8,zoom:6,hint:'Южная часть Корейского полуострова, между Китаем и Японией.'},
  japan:{name:'Япония',code:'jp',lat:36.2,lng:138.3,zoom:5,hint:'Островная дуга к востоку от Кореи и Китая.'},
  taiwan:{name:'Тайвань',code:'tw',lat:23.7,lng:121.0,zoom:7,hint:'Остров у юго-восточного побережья Китая.'},
  ukraine:{name:'Украина',code:'ua',lat:48.4,lng:31.2,zoom:5,hint:'Восточная Европа, севернее Чёрного моря.'},
  kazakhstan:{name:'Казахстан',code:'kz',lat:48.0,lng:67.0,zoom:4,hint:'Огромная страна Центральной Азии, южнее России.'},
  poland:{name:'Польша',code:'pl',lat:51.9,lng:19.1,zoom:6,hint:'Центральная Европа, между Германией и Беларусью/Украиной.'},
  czechia:{name:'Чехия',code:'cz',lat:49.8,lng:15.5,zoom:7,hint:'Центральная Европа, южнее Польши, восточнее Германии.'},
  hungary:{name:'Венгрия',code:'hu',lat:47.2,lng:19.5,zoom:7,hint:'Центральная Европа, южнее Словакии.'},
  romania:{name:'Румыния',code:'ro',lat:45.9,lng:25.0,zoom:6,hint:'Восточная Европа, западнее Чёрного моря.'},
  bulgaria:{name:'Болгария',code:'bg',lat:42.7,lng:25.5,zoom:7,hint:'Балканы, южнее Румынии, севернее Греции и Турции.'},
  turkey:{name:'Турция',code:'tr',lat:39.0,lng:35.2,zoom:5,hint:'Между Европой и Азией, южнее Чёрного моря.'},
  iceland:{name:'Исландия',code:'is',lat:65.0,lng:-19.0,zoom:6,hint:'Остров в северной Атлантике.'},
  uk:{name:'Великобритания',code:'gb',lat:55.2,lng:-3.4,zoom:5,hint:'Острова к северо-западу от Франции.'},
  ireland:{name:'Ирландия',code:'ie',lat:53.2,lng:-8.1,zoom:6,hint:'Остров западнее Великобритании.'},
  malta:{name:'Мальта',code:'mt',lat:35.9,lng:14.4,zoom:9,hint:'Маленький остров южнее Сицилии.'},
  cyprus:{name:'Кипр',code:'cy',lat:35.1,lng:33.4,zoom:8,hint:'Остров в восточном Средиземноморье, южнее Турции.'},
  netherlands:{name:'Нидерланды',code:'nl',lat:52.2,lng:5.3,zoom:7,hint:'Северо-запад Европы, между Бельгией и Германией.'},
  luxembourg:{name:'Люксембург',code:'lu',lat:49.8,lng:6.1,zoom:9,hint:'Очень маленькая страна между Бельгией, Германией и Францией.'},
  france:{name:'Франция',code:'fr',lat:46.2,lng:2.2,zoom:5,hint:'Западная Европа.'},
  germany:{name:'Германия',code:'de',lat:51.2,lng:10.4,zoom:6,hint:'Центр Западной Европы.'},
  belgium:{name:'Бельгия',code:'be',lat:50.6,lng:4.6,zoom:8,hint:'Между Францией, Нидерландами, Германией и Люксембургом.'},
  italy:{name:'Италия',code:'it',lat:42.8,lng:12.5,zoom:5,hint:'Апеннинский полуостров в Южной Европе.'},
  albania:{name:'Албания',code:'al',lat:41.1,lng:20.0,zoom:7,hint:'Запад Балкан, севернее Греции.'},
  portugal:{name:'Португалия',code:'pt',lat:39.6,lng:-8.0,zoom:6,hint:'Запад Пиренейского полуострова.'},
  serbia:{name:'Сербия',code:'rs',lat:44.0,lng:21.0,zoom:7,hint:'Центральные Балканы.'},
  spain:{name:'Испания',code:'es',lat:40.3,lng:-3.7,zoom:6,hint:'Большая часть Пиренейского полуострова.'},
  norway:{name:'Норвегия',code:'no',lat:62.0,lng:9.0,zoom:5,hint:'Запад Скандинавии.'},
  sweden:{name:'Швеция',code:'se',lat:62.0,lng:16.0,zoom:5,hint:'Восточная часть Скандинавии.'},
  finland:{name:'Финляндия',code:'fi',lat:64.0,lng:26.0,zoom:5,hint:'Северо-восток Европы, восточнее Швеции.'},
  denmark:{name:'Дания',code:'dk',lat:56.1,lng:9.5,zoom:7,hint:'Между Германией и Скандинавией.'},
  indonesia:{name:'Индонезия',code:'id',lat:-2.0,lng:118.0,zoom:4,hint:'Огромный архипелаг между Юго-Восточной Азией и Австралией.'},
  malaysia:{name:'Малайзия',code:'my',lat:4.2,lng:102.0,zoom:5,hint:'Юго-Восточная Азия: Малаккский полуостров + часть Борнео.'},
  singapore:{name:'Сингапур',code:'sg',lat:1.35,lng:103.82,zoom:11,hint:'Город-государство на южной оконечности Малайзии.'},
  macau:{name:'Макао',code:'mo',lat:22.2,lng:113.55,zoom:11,hint:'Небольшая территория на южном побережье Китая, рядом с Гонконгом.'},
  hongkong:{name:'Гонконг',code:'hk',lat:22.3,lng:114.17,zoom:10,hint:'Южное побережье Китая.'},
  colombia:{name:'Колумбия',code:'co',lat:4.5,lng:-74.2,zoom:5,hint:'Северо-запад Южной Америки.'},
  uganda:{name:'Уганда',code:'ug',lat:1.4,lng:32.3,zoom:6,hint:'Восточная Африка, севернее озера Виктория.'},
  kenya:{name:'Кения',code:'ke',lat:0.1,lng:37.9,zoom:6,hint:'Восточная Африка, побережье Индийского океана.'},
  southafrica:{name:'ЮАР',code:'za',lat:-30.6,lng:22.9,zoom:5,hint:'Юг Африки.'},
  ghana:{name:'Гана',code:'gh',lat:7.9,lng:-1.0,zoom:6,hint:'Западная Африка, побережье Гвинейского залива.'},
  nigeria:{name:'Нигерия',code:'ng',lat:9.1,lng:8.7,zoom:6,hint:'Западная Африка, восточнее Бенина.'},
  senegal:{name:'Сенегал',code:'sn',lat:14.5,lng:-14.5,zoom:6,hint:'Крайний запад материковой Африки.'},
  botswana:{name:'Ботсвана',code:'bw',lat:-22.3,lng:24.7,zoom:6,hint:'Южная Африка, севернее ЮАР.'},
  lesotho:{name:'Лесото',code:'ls',lat:-29.6,lng:28.2,zoom:8,hint:'Горная страна полностью окружена ЮАР.'},
  eswatini:{name:'Эсватини',code:'sz',lat:-26.5,lng:31.5,zoom:8,hint:'Маленькая страна между ЮАР и Мозамбиком.'},
  australia:{name:'Австралия',code:'au',lat:-25.3,lng:133.8,zoom:4,hint:'Материк в Океании.'},
  newzealand:{name:'Новая Зеландия',code:'nz',lat:-41.0,lng:174.0,zoom:5,hint:'Два главных острова к юго-востоку от Австралии.'},
  argentina:{name:'Аргентина',code:'ar',lat:-38.4,lng:-63.6,zoom:4,hint:'Юг Южной Америки, восточнее Чили.'},
  usa:{name:'США',code:'us',lat:39.5,lng:-98.3,zoom:4,hint:'Северная Америка между Канадой и Мексикой.'},
  bangladesh:{name:'Бангладеш',code:'bd',lat:23.7,lng:90.4,zoom:6,hint:'Южная Азия, почти окружён Индией.'},
  india:{name:'Индия',code:'in',lat:21.0,lng:78.0,zoom:4,hint:'Большой полуостров Южной Азии.'},
  bhutan:{name:'Бутан',code:'bt',lat:27.5,lng:90.4,zoom:8,hint:'Гималаи, между Индией и Китаем.'},
  switzerland:{name:'Швейцария',code:'ch',lat:46.8,lng:8.2,zoom:7,hint:'Альпы, между Францией, Германией, Италией и Австрией.'}
};
Object.values(countries).forEach(c=>c.flag=`https://flagcdn.com/w320/${c.code}.png`);

const languages=[
  ['georgia','Грузинский','თბილისი','круглые отдельные буквы','Почти уникальная письменность: увидел такие круглые завитки → Грузия.'],
  ['armenia','Армянский','Երևան','крючки и петли','Совсем не похож на кириллицу; почти всегда Армения.'],
  ['greece','Греческий','Αθήνα · Ω Δ Σ Ψ','Ω Δ Σ Ψ','Греция или Кипр; дальше смотри движение и окружение.'],
  ['israel','Иврит','ירושלים','квадратные символы, справа налево','В GeoGuessr сильный кандидат — Израиль.'],
  ['thailand','Тайский','กรุงเทพ','много маленьких кружков','Очень узнаваемый тайский; Таиланд.'],
  ['laos','Лаосский','ວຽງຈັນ','тайский, но круглее','Похож на тайский, но формы мягче и круглее.'],
  ['cambodia','Кхмерский','ភ្នំពេញ','сложные вытянутые знаки','Камбоджа.'],
  ['srilanka','Сингальский','ශ්‍රී ලංකා','круги и спирали','Шри-Ланка; часто рядом ещё тамильский и английский.'],
  ['korea','Корейский','대한민국','квадратные блоки из линий и кружков','Южная Корея.'],
  ['japan','Японский','日本の道路','иероглифы + простые の し て','Смешение сложных и простых знаков → Япония.'],
  ['ukraine','Украинский','Київ · ї є і','ї / є / і','Эти буквы быстро отделяют украинский от русского.'],
  ['kazakhstan','Казахский','Қазақстан · Ә Қ Ө Ұ','Ә Қ Ө Ұ Ү І','Кириллица + необычные казахские буквы.'],
  ['poland','Польский','Łódź · ł ą ę','ł','Перечёркнутая ł — один из лучших маркеров Польши.'],
  ['czechia','Чешский','Přerov · ř ě','ř','ř очень характерна для чешского.'],
  ['hungary','Венгерский','Győr · ő ű','ő / ű','Двойные длинные ударения — Венгрия.'],
  ['romania','Румынский','București · ș ț ă','ș / ț / ă','Очень полезные маркеры Румынии.'],
  ['turkey','Турецкий','Türkiye · ğ ı ş','ı без точки','ğ, ş и особенно ı → Турция.'],
  ['iceland','Исландский','Þingvellir · ð','Þ / ð','Очень сильный маркер Исландии.'],
  ['bangladesh','Бенгальский','বাংলাদেশ ঢাকা','верхняя линия + округлые формы','Бангладеш или восток Индии; в обычном GeoGuessr чаще Бангладеш.'],
  ['india','Деванагари','भारत दिल्ली','слова подвешены к линии','Хинди и родственные языки северной Индии.']
].map(([country,title,script,mark,text])=>({country,title,script,mark,text}));

const blackPlates=[
 {country:'indonesia',title:'Индонезия',tag:'3 кластера',visual:'<div class="plate-view black three"><i></i><i></i><i></i></div>',facts:['Старые обычные номера: <b>чёрный фон + белый текст</b>.','После Google blur обычно остаются <b>3 светлых кластера</b>.','Мнемоника: Indon<b>3</b>sia.','Новые номера могут быть уже белыми; коммерческий транспорт бывает жёлтым.'],warn:'Если сомневаешься с Малайзией: у Индонезии часто есть жёлтая центральная линия, красно-белые флаги и Jl.'},
 {country:'malaysia',title:'Малайзия',tag:'2 кластера',visual:'<div class="plate-view black two"><i></i><i></i></div>',facts:['Обычный приватный номер: <b>чёрный фон + белый текст</b>.','Через blur обычно видны <b>2 светлых кластера</b>.','Чаще длинный однострочный прямоугольник.','Jln. на улицах, а центральные дорожные линии обычно белые.'],warn:'Главное отличие от Индонезии именно через blur: 2 белых блока против 3.'},
 {country:'singapore',title:'Сингапур',tag:'чёрный / UK-style',visual:'<div class="plate-view black"><i style="width:150px"></i></div>',facts:['Встречаются <b>белые символы на чёрном</b> фоне.','Также нормальна схема: <b>белый передний + жёлтый задний</b>, как в UK.','На чёрном номере blur чаще не даёт стабильные «2/3 блока», как MY/ID.'],warn:'Сам номер не лочь страну: подтверждай идеальными дорогами, английским и городской средой.'},
 {country:'macau',title:'Макао',tag:'чёрный, 1–2 строки',visual:'<div class="plate-view black two-line"><i style="width:98px"></i><i style="width:72px"></i></div>',facts:['Чёрные номера встречаются в <b>длинной</b> и <b>вертикальной/двухстрочной</b> форме.','Под углом двухстрочная версия выглядит как <b>два светлых пятна одно над другим</b>.','Очень городская китайско-португальская среда.'],warn:'Редкий раунд; не путай с MY/ID только по чёрному цвету.'}
];

const yellowPlates=[
 {country:'netherlands',title:'Нидерланды',tag:'жёлтый спереди и сзади',visual:'<div class="plate-view yellow sideband-left"><i style="width:145px"></i></div>',facts:['Обычные машины: <b>жёлтый фон и спереди, и сзади</b>.','Слева синяя EU-полоса.','Через blur получается ровный ярко-жёлтый прямоугольник с синеватым краем.'],warn:'Практически не отличим от Люксембурга по одному размытому номеру — смотри масштаб страны/дороги/ландшафт.'},
 {country:'luxembourg',title:'Люксембург',tag:'как NL',visual:'<div class="plate-view yellow sideband-left"><i style="width:130px"></i></div>',facts:['Тоже <b>жёлтый перед и зад</b> + синяя полоса слева.','На blur выглядит почти так же, как Нидерланды.','Часто много иностранных машин — не делай вывод по одной машине.'],warn:'Номер сужает до NL/LU, но не разделяет их сам.'},
 {country:'uk',title:'Великобритания',tag:'белый перед / жёлтый зад',visual:'<div class="plate-view split-front-rear">FRONT&nbsp;&nbsp; | &nbsp;&nbsp;REAR</div>',facts:['Передний номер <b>белый</b>.','Задний номер <b>жёлтый</b>.','Левостороннее движение.','На Street View важнее заметить, с какой стороны машины ты смотришь.'],warn:'Гонконг и Сингапур тоже могут напоминать эту цветовую схему — подтверждай окружением.'},
 {country:'colombia',title:'Колумбия',tag:'жёлтый перед и зад',visual:'<div class="plate-view yellow"><i style="width:155px"></i></div>',facts:['Обычные машины имеют <b>жёлтые номера с двух сторон</b>.','Нет характерной EU-синей полосы.','Испанский + тропическая/андская Латинская Америка сильно добивают страну.']},
 {country:'israel',title:'Израиль',tag:'жёлтый перед и зад',visual:'<div class="plate-view yellow three"><i></i><i></i><i></i></div>',facts:['Обычные номера жёлтые с двух сторон.','Современный номер — только цифры; часто визуально разбивается на <b>3–2–3</b>.','Рядом иврит; дорожные указатели часто на иврите/арабском/английском.'],warn:'Жёлтый номер сам по себе не означает Нидерланды.'},
 {country:'kenya',title:'Кения',tag:'жёлтый сзади',visual:'<div class="plate-view split-front-rear">WHITE&nbsp;&nbsp; | &nbsp;&nbsp;YELLOW</div>',facts:['Задний номер обычно <b>жёлтый</b>, передний белый.','Левостороннее движение.','Сильное подтверждение — snorkel/видимая часть Google car.']},
 {country:'uganda',title:'Уганда',tag:'жёлтый сзади',visual:'<div class="plate-view split-front-rear">WHITE&nbsp;&nbsp; | &nbsp;&nbsp;YELLOW</div>',facts:['Схема белый перед / жёлтый зад.','Левостороннее движение.','Африканская городская/тропическая среда.']}
];

const specialPlates=[
 {country:'belgium',title:'Бельгия',tag:'красноватый blur',visual:'<div class="plate-view redtext"><span>1-ABC-123</span></div>',facts:['Белый фон, но символы <b>тёмно-красные</b>.','Даже после blur номер часто выглядит <b>розоватым/красноватым</b>, а не серо-чёрным.','Это один из лучших номерных признаков Бельгии.']},
 {country:'norway',title:'Норвегия: зелёный номер',tag:'только коммерческий',visual:'<div class="plate-view green"><span>AB 12345</span></div>',facts:['Зелёные номера реально встречаются в Норвегии.','Но это <b>коммерческие/льготно облагаемые</b> автомобили, а не все машины.','Поэтому зелёный номер → сильная Норвегия; отсутствие зелёного ничего не значит.'],warn:'Не запоминай «в Норвегии все номера зелёные» — это ошибка.'},
 {country:'portugal',title:'Португалия: старый формат',tag:'жёлтая полоса справа',visual:'<div class="plate-view white sideband-left sideband-right-yellow"><i style="width:145px"></i></div>',facts:['На старых португальских номерах: синяя полоса слева + <b>жёлтая дата-полоса справа</b>.','Через blur это выглядит как маленький жёлтый прямоугольник у правого края.','На новых номерах с 2020 года жёлтая полоса уже не обязательна.'],warn:'Есть жёлтая справа → супер. Нет жёлтой справа → Португалию не исключай.'},
 {country:'albania',title:'Албания',tag:'красная слева / две синие',visual:'<div class="plate-view white sideband-left-red"><i style="width:150px"></i></div>',facts:['Старый заметный вариант: <b>красная полоса слева</b>.','Современные номера могут иметь <b>синие полосы с двух сторон</b>.','Двойная синяя схема пересекается с Италией/Францией.']},
 {country:'italy',title:'Италия',tag:'две синие + короткий передний',visual:'<div class="plate-view white sideband-both" style="width:65%"><i style="width:105px"></i></div>',facts:['Синие полосы <b>слева и справа</b>.','Передний номер часто заметно <b>короче</b>, чем обычная европейская пластина.','Короткий front + две синие → сильная Италия.']},
 {country:'france',title:'Франция',tag:'две синие, длинный',visual:'<div class="plate-view white sideband-both"><i style="width:150px"></i></div>',facts:['На современном номере синие поля слева и справа.','В отличие от типичного итальянского front, французский номер обычно <b>полной длины</b>.','Албания тоже может иметь две синие полосы — проверяй язык/дорогу.']}
];

const holeyPoles=[
 {country:'romania',title:'Румыния',pole:'wide whitebase',text:'Толстый бетон. Широкая вертикальная «лестница» отверстий идёт почти до земли; низ часто выкрашен белым.'},
 {country:'hungary',title:'Венгрия',pole:'wide',text:'Похожая дырчатая бетонная стойка, но обычно тоньше и без характерного белого основания.'},
 {country:'poland',title:'Польша',pole:'short paired-pole',text:'Прорези чаще не доходят до низа; встречаются пары дырчатых бетонных стоек.'},
 {country:'france',title:'Франция',pole:'tiny short',text:'Лестничные прорези заметно мельче и короче; французские ladder poles не лочь без второго признака.'},
 {country:'spain',title:'Испания',pole:'wide short',text:'Тоже встречаются ladder poles; по одной «лестнице» Францию и Испанию не разделяй.'},
 {country:'portugal',title:'Португалия',pole:'round short',text:'Бывают узкие длинные выемки/прорези. Полезнее в сочетании с португальскими дорогами и номерами.'},
 {country:'bulgaria',title:'Болгария',pole:'wide whitebase',text:'Может напоминать Румынию: бетон, дырки и белая окраска внизу; обычно стойка визуально стройнее.'}
];

const poles=[
 {country:'taiwan',title:'Тайвань',tag:'очень сильный',visual:'<div class="pole-diagram"><div class="marker-pole orange"></div></div>',facts:['На бетонных utility poles яркие <b>оранжево-чёрные диагональные полосы</b>.','Ключ: полосы идут <b>до самой земли</b>.','Даже под углом виден длинный полосатый «носок» у основания.'],warn:'Южная Корея похожа, но полосы там обычно желтее и заканчиваются выше.'},
 {country:'korea',title:'Южная Корея',tag:'сравни с Тайванем',visual:'<div class="pole-diagram"><div class="marker-pole orange stop-high"></div></div>',facts:['Тоже встречается чёрно-жёлтая/оранжевая диагональная маркировка.','Ключ: полосатая секция <b>не тянется до земли</b>.','Дополнительно ищи хангыль.']},
 {country:'usa',title:'Калифорния',tag:'3 жёлтые метки',visual:'<div class="pole-diagram"><div class="marker-pole yellow3"></div></div>',facts:['На некоторых деревянных/тёмных столбах Калифорнии встречаются <b>три жёлтые горизонтальные метки</b>.','Издалека они читаются как три ярких штриха на тёмной стойке.','Это региональный clue, не универсальный признак США.']},
 {country:'southafrica',title:'ЮАР — bird pole',tag:'сильный',visual:'<div class="pole-diagram"><div class="marker-pole" style="background:#72523c"><span style="position:absolute;top:25px;left:-36px;width:100px;height:5px;background:#444;transform:rotate(-18deg)"></span><span style="position:absolute;top:25px;left:-36px;width:100px;height:5px;background:#444;transform:rotate(18deg)"></span></div></div>',facts:['Характерные опоры/кронштейны сверху создают силуэт «птички».','Смотри именно на <b>V/диагональные металлические руки</b> вокруг вершины.','Подтверждай жёлтой внешней линией дороги.']},
 {country:'argentina',title:'Аргентина — двойной бетон',tag:'очень сильный',visual:'<div class="pole-diagram"><div style="position:relative;width:90px;height:180px"><div class="marker-pole" style="position:absolute;left:15px;bottom:0;background:#aaa"></div><div class="marker-pole" style="position:absolute;right:15px;bottom:0;background:#aaa"></div><div style="position:absolute;left:18px;right:18px;top:55px;height:12px;border:4px solid #aaa;border-radius:8px"></div></div></div>',facts:['Две округлые бетонные стойки, соединённые <b>бетонным кольцом/перемычкой</b>.','В LearnableMeta это отмечено как почти эксклюзивный аргентинский clue.','В Боливии похожее возможно, поэтому добивай ландшафтом.']},
 {country:'france',title:'Франция — синяя наклейка',tag:'комбо',visual:'<div class="pole-diagram"><div class="marker-pole" style="background:#8e8e8e"><span style="position:absolute;left:5px;right:5px;top:70px;height:22px;background:#225cc5;border-radius:2px"></span></div></div>',facts:['На utility poles встречается маленькая <b>синяя идентификационная наклейка</b>.','Она полезна, когда уже подозреваешь Францию.','На дальнем ракурсе ищи маленькое синее пятно примерно на уровне глаз.']},
 {country:'malaysia',title:'Малайзия — чёрный sticker',tag:'комбо',visual:'<div class="pole-diagram"><div class="marker-pole" style="background:#9b9b9b"><span style="position:absolute;left:4px;right:4px;top:68px;height:28px;background:#111"></span></div></div>',facts:['На столбах часто заметен <b>чёрный прямоугольный ID sticker</b>.','Сам по себе sticker не всегда определяет регион, но хорошо подтверждает Малайзию.','Сопоставляй с чёрными номерами в 2 кластера и белой разметкой.']}
];

const bollards=[
 {country:'australia',title:'Австралия',tag:'красный спереди / серый сзади',visual:'<div class="pole-diagram"><div style="width:34px;height:130px;background:#eee;position:relative"><span style="position:absolute;left:9px;top:25px;width:16px;height:24px;background:#d73030"></span></div></div>',facts:['Белый дорожный столбик.','Спереди <b>красный отражатель</b>.','Сзади отражатель серый/светлый.','Если видишь обратную сторону — это главное отличие от похожего турецкого.']},
 {country:'turkey',title:'Турция',tag:'похож на AU',visual:'<div class="pole-diagram"><div style="width:34px;height:130px;background:#eee;position:relative"><span style="position:absolute;left:9px;top:25px;width:16px;height:24px;background:#d73030"></span></div></div>',facts:['Внешне похож на австралийский белый боллард.','Ключевой контраст: у турецкого аналога <b>нет заднего отражателя</b>.','Если ракурс только спереди — не форси, используй солнце/ландшафт/движение.']},
 {country:'australia',title:'Австралия — узкий вариант',tag:'форма',visual:'<div class="pole-diagram"><div style="width:20px;height:135px;background:#f0f0ec;position:relative"><span style="position:absolute;left:6px;top:35px;width:8px;height:23px;background:#d83a3a"></span></div></div>',facts:['Очень узкий белый roadside post с небольшим красным отражателем.','Под сильным углом может выглядеть как просто белая линия с красной точкой.']},
 {country:'spain',title:'Испания — жёлтый reflector',tag:'guardrail',visual:'<div class="card-visual" style="height:100%;background:#79975c"><div style="width:80%;height:18px;background:#8b929a;position:relative"><span style="position:absolute;left:45%;top:2px;width:18px;height:14px;background:#e4b82b;border-radius:3px"></span></div></div>',facts:['На металлическом guardrail часто виден <b>жёлтый прямоугольный отражатель</b>.','Даже в blur это маленькая яркая жёлтая точка на сером отбойнике.','Полезный испанский clue.']}
];

const roads=[
 {country:'finland',title:'Финляндия',tag:'Скандинавия',visual:'<div class="road-visual yellow-center"><i class="leftline"></i><i class="rightline"></i><i class="center"></i></div>',facts:['Боковые линии на больших дорогах часто <b>сплошные</b>.','Центральная линия может быть жёлтой/жёлто-белой.','Знаки ограничения/предупреждения имеют <b>жёлтый фон</b>; у Финляндии заметна жёлтая окантовка.']},
 {country:'sweden',title:'Швеция',tag:'короткие outer dashes',visual:'<div class="road-visual short-outer"><i class="leftline"></i><i class="rightline"></i><i class="center"></i></div>',facts:['Характерны <b>короткие белые штрихи по краям</b>.','Центральные линии обычно белые.','Очень сильный визуальный бонус: <b>синие chevrons с жёлтыми стрелками</b>.']},
 {country:'norway',title:'Норвегия',tag:'жёлто-оранжевый центр',visual:'<div class="road-visual yellow-center long-outer"><i class="leftline"></i><i class="rightline"></i><i class="center"></i></div>',facts:['Центральные линии часто <b>жёлто-оранжевые</b>.','Боковые штрихи заметно <b>длиннее шведских</b>.','Жёлтые directional signs и слово <b>Sone</b> на зональных знаках.']},
 {country:'southafrica',title:'ЮАР',tag:'жёлтые края',visual:'<div class="road-visual yellow-outer"><i class="leftline"></i><i class="rightline"></i><i class="center"></i></div>',facts:['Один из лучших признаков: <b>жёлтые внешние линии</b> по краям дороги.','Центральная разметка при этом обычно белая.','Подтверждай левосторонним движением и южноафриканской средой.']},
 {country:'ireland',title:'Ирландия',tag:'жёлтые outer lines',visual:'<div class="road-visual yellow-outer short-outer"><i class="leftline"></i><i class="rightline"></i><i class="center"></i></div>',facts:['По краям часто видны <b>жёлтые линии/штрихи</b>.','Левостороннее движение.','В отличие от UK, Ирландия использует km/h и много ирландского языка на знаках.']},
 {country:'malaysia',title:'Малайзия',tag:'двойной белый центр',visual:'<div class="road-visual"><i class="leftline"></i><i class="rightline"></i><i class="center" style="left:47.8%;width:1.2%;background:#fff"></i><i class="center" style="left:51%;width:1.2%;background:#fff"></i></div>',facts:['В Малайзии дорожные линии <b>белые</b>.','На двухполосных дорогах часто встречается <b>двойная сплошная белая</b> в центре.','Это сильное отличие от Индонезии, где центр может быть жёлтым.']},
 {country:'indonesia',title:'Индонезия',tag:'белый или жёлтый центр',visual:'<div class="road-visual yellow-center"><i class="leftline"></i><i class="rightline"></i><i class="center"></i></div>',facts:['Внешние линии белые.','Центр может быть <b>белым или жёлтым</b>, сплошным или пунктирным.','Жёлтый центр + чёрные номера 3 кластера → очень сильная Индонезия.']},
 {country:'usa',title:'США — NO PASSING ZONE',tag:'форма знака',visual:'<div class="sign-visual"><div class="pennant"></div></div>',facts:['Жёлтый знак в форме <b>бокового треугольного флага</b>.','Надпись NO PASSING ZONE.','Даже если текст размыт, сама необычная pennant-форма очень сильна для США.']},
 {country:'usa',title:'США — знаки словами',tag:'видно через blur',visual:'<div class="sign-visual"><div class="us-sign">SPEED<br>LIMIT<br><span style="font-size:2rem">55</span></div></div>',facts:['В США много прямоугольных белых знаков, где смысл передан <b>словами</b>.','Через blur это выглядит как несколько строк тёмного текста на белом прямоугольнике.','Типичный SPEED LIMIT — белый прямоугольник с крупным числом.']},
 {country:'sweden',title:'Швеция — chevrons',tag:'синий + жёлтый',visual:'<div class="sign-visual"><div class="chevron"></div></div>',facts:['Очень характерная комбинация: <b>синий фон + жёлтая стрелка</b>.','На расстоянии это просто яркий сине-жёлтый прямоугольник — этого уже достаточно, чтобы подумать о Швеции.']}
];

const metas=[
 {country:'ghana',title:'Гана — black tape',tag:'Google car',visual:'<div class="card-visual"><div style="width:75%;height:16px;background:#aeb7c0;position:relative"><span style="position:absolute;right:18%;top:-4px;width:55px;height:24px;background:#111"></span></div></div>',facts:['На roof rack Google car заметна <b>чёрная лента</b> на одном конце перекладины.','Очень сильный country meta, если rack попал в кадр.']},
 {country:'kenya',title:'Кения — snorkel',tag:'Google car',visual:'<div class="card-visual"><div style="width:70%;height:90px;background:#9aa0a5;border-radius:60% 60% 10px 10px;position:relative"><span style="position:absolute;right:-18px;top:18px;width:18px;height:62px;background:#222;border-radius:10px"></span></div></div>',facts:['У Google car виден <b>чёрный snorkel</b> сбоку капота.','Часто достаточно одного этого признака, особенно вместе с левым движением.']},
 {country:'nigeria',title:'Нигерия — police follow car',tag:'coverage',visual:'<div class="card-visual"><div style="width:150px;height:80px;background:#ddd;border-radius:18px 18px 8px 8px;position:relative"><span style="position:absolute;left:20px;right:20px;top:-8px;height:9px;background:linear-gradient(90deg,#222 0 45%,#eee 45% 55%,#222 55%)"></span></div></div>',facts:['В части нигерийского coverage за Google car едет <b>полицейская/сопровождающая машина</b>.','Если машина стабильно висит сзади на серии кадров — сильная Нигерия.']},
 {country:'senegal',title:'Сенегал — sky rifts',tag:'старое coverage',visual:'<div class="card-visual" style="background:linear-gradient(#80bce1,#d6e7ec)"><span style="height:100%;width:4px;background:#4b5d70;box-shadow:20px 0 0 #7d6d82,-18px 0 0 #59687a;opacity:.8"></span></div>',facts:['В старом coverage могут быть заметны <b>разрывы/rifts в небе</b>.','Похожий артефакт исторически встречался также в Албании и Черногории, поэтому это не 100% одиночный clue.']},
 {country:'japan',title:'Япония — low cam',tag:'камера ниже',visual:'<div class="card-visual"><span style="font-size:4rem">📷↘</span></div>',facts:['Камера заметно <b>ниже обычной</b>: машины, ограждения и бордюры кажутся выше относительно горизонта.','Вместе с японским текстом и левым движением очень полезно.']},
 {country:'switzerland',title:'Швейцария — low cam + blur',tag:'coverage',visual:'<div class="card-visual"><span style="font-size:4rem;filter:blur(3px)">🚗</span></div>',facts:['В характерном coverage камера низкая и под машиной заметен сильный blur.','Используй как подтверждение после альпийской среды/швейцарских признаков.']},
 {country:'srilanka',title:'Шри-Ланка — low cam',tag:'coverage',visual:'<div class="card-visual"><span style="font-size:4rem">📷 ↓</span></div>',facts:['Новое coverage часто снято с низкой камеры.','Сингальский алфавит + левое движение гораздо сильнее, lowcam — добивающий clue.']}
];

const leftGroups=[
  ['Европа',[['uk','🇬🇧 UK'],['ireland','🇮🇪 Ирландия'],['malta','🇲🇹 Мальта'],['cyprus','🇨🇾 Кипр']]],
  ['Азия',[['japan','🇯🇵 Япония'],['thailand','🇹🇭 Таиланд'],['malaysia','🇲🇾 Малайзия'],['indonesia','🇮🇩 Индонезия'],['singapore','🇸🇬 Сингапур'],['hongkong','🇭🇰 Гонконг'],['bangladesh','🇧🇩 Бангладеш'],['india','🇮🇳 Индия'],['srilanka','🇱🇰 Шри-Ланка'],['bhutan','🇧🇹 Бутан']]],
  ['Африка',[['southafrica','🇿🇦 ЮАР'],['botswana','🇧🇼 Ботсвана'],['lesotho','🇱🇸 Лесото'],['eswatini','🇸🇿 Эсватини'],['kenya','🇰🇪 Кения'],['uganda','🇺🇬 Уганда']]],
  ['Океания',[['australia','🇦🇺 Австралия'],['newzealand','🇳🇿 Новая Зеландия']]]
];

function mapButton(country){return country&&countries[country]?`<button class="map-btn" data-country="${country}">На карте</button>`:''}
function infoCard(d){return `<article class="clue-card"><div class="card-visual">${d.visual||`<div class="script">${d.script||''}</div>`}</div><div class="card-body"><div class="country-line"><h3>${d.title}</h3>${d.tag?`<span class="tag">${d.tag}</span>`:''}</div>${d.mark?`<div class="warning"><b>Ищи:</b> ${d.mark}</div>`:''}${d.text?`<ul class="fact-list"><li>${d.text}</li></ul>`:`<ul class="fact-list">${(d.facts||[]).map(x=>`<li>${x}</li>`).join('')}</ul>`}${d.warn?`<div class="warning">${d.warn}</div>`:''}<div class="card-actions">${mapButton(d.country)}</div></div></article>`}
function renderCards(id,data){document.getElementById(id).innerHTML=data.map(infoCard).join('')}

function renderLanguages(list=languages){document.getElementById('languageGrid').innerHTML=list.map(d=>infoCard({...d,visual:`<div class="script">${d.script}</div>`,tag:d.mark})).join('')}
renderLanguages();
document.getElementById('languageSearch').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();renderLanguages(languages.filter(d=>`${d.title} ${d.script} ${d.mark} ${countries[d.country]?.name||''}`.toLowerCase().includes(q)))})

renderCards('blackPlateGrid',blackPlates);renderCards('yellowPlateGrid',yellowPlates);renderCards('specialPlateGrid',specialPlates);

document.getElementById('holeyPoleGrid').innerHTML=holeyPoles.map(d=>`<article class="comparison-card"><div class="pole-diagram"><div class="concrete-pole ${d.pole.includes('whitebase')?'whitebase':''} ${d.pole.includes('paired-pole')?'paired-pole':''}"><span class="holes ${d.pole.replace('whitebase','').replace('paired-pole','')}"></span></div></div><h4>${countries[d.country]?.code?`<img src="https://flagcdn.com/24x18/${countries[d.country].code}.png" alt="" /> `:''}${d.title}</h4><p>${d.text}</p><div class="card-actions">${mapButton(d.country)}</div></article>`).join('');
renderCards('poleGrid',poles);renderCards('bollardGrid',bollards);renderCards('roadGrid',roads);renderCards('metaGrid',metas);

document.getElementById('leftCountryList').innerHTML=leftGroups.map(([title,items])=>`<div class="left-group"><h4>${title}</h4><div class="country-chips">${items.map(([key,label])=>`<button data-country="${key}">${label}</button>`).join('')}</div></div>`).join('');

const select=document.getElementById('countrySelect');
Object.entries(countries).sort((a,b)=>a[1].name.localeCompare(b[1].name,'ru')).forEach(([key,c])=>select.insertAdjacentHTML('beforeend',`<option value="${key}">${c.name}</option>`));
const map=L.map('map',{worldCopyJump:true}).setView([25,20],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
let marker=L.marker([42.3,43.4]).addTo(map);
function showCountry(key,scroll=false){const c=countries[key];if(!c)return;select.value=key;map.setView([c.lat,c.lng],c.zoom||6,{animate:true});marker.setLatLng([c.lat,c.lng]).bindPopup(c.name).openPopup();document.getElementById('mapFlag').src=c.flag;document.getElementById('mapCountryName').textContent=c.name;document.getElementById('mapCountryHint').textContent=c.hint;if(scroll)document.getElementById('map-section').scrollIntoView({behavior:'smooth'})}
showCountry('georgia');select.addEventListener('change',e=>showCountry(e.target.value));
document.addEventListener('click',e=>{const b=e.target.closest('[data-country]');if(b)showCountry(b.dataset.country,true)});

const quizzes=[
 {visual:'<div class="plate-view black three"><i></i><i></i><i></i></div>',prompt:'Чёрный номер. Через blur видно 3 белых кластера.',answer:'Индонезия',opts:['Малайзия','Индонезия','Сингапур','Макао']},
 {visual:'<div class="plate-view black two"><i></i><i></i></div>',prompt:'Чёрный номер. Через blur видно 2 белых кластера.',answer:'Малайзия',opts:['Индонезия','Малайзия','Таиланд','Филиппины']},
 {visual:'<div class="plate-view green"><span>AB 12345</span></div>',prompt:'Зелёный номер на коммерческой машине в Европе.',answer:'Норвегия',opts:['Швеция','Норвегия','Финляндия','Дания']},
 {visual:'<div class="pole-diagram"><div class="marker-pole orange"></div></div>',prompt:'Оранжево-чёрные диагональные полосы на бетонном столбе идут до земли.',answer:'Тайвань',opts:['Южная Корея','Япония','Тайвань','Таиланд']},
 {visual:'<div class="road-visual yellow-outer"><i class="leftline"></i><i class="rightline"></i><i class="center"></i></div>',prompt:'Жёлтые внешние линии по обеим сторонам большой дороги.',answer:'ЮАР',opts:['ЮАР','Аргентина','Австралия','Испания']},
 {visual:'<div class="sign-visual"><div class="pennant"></div></div>',prompt:'Жёлтый боковой треугольный знак NO PASSING ZONE.',answer:'США',opts:['Канада','США','Австралия','Новая Зеландия']}
];
let qi=0;function drawQuiz(){const q=quizzes[qi];document.getElementById('quizVisual').innerHTML=q.visual;document.getElementById('quizPrompt').textContent=q.prompt;document.getElementById('quizResult').textContent='';document.getElementById('quizResult').className='quiz-result';document.getElementById('quizOptions').innerHTML=q.opts.map(o=>`<button class="tiny-btn" data-answer="${o}">${o}</button>`).join('')}
document.getElementById('quizOptions').addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(!b)return;const q=quizzes[qi],ok=b.dataset.answer===q.answer,r=document.getElementById('quizResult');r.textContent=ok?'✓ Верно':`✗ Нет. Ответ: ${q.answer}`;r.className=`quiz-result ${ok?'ok':'bad'}`});
document.getElementById('nextQuiz').addEventListener('click',()=>{qi=(qi+1)%quizzes.length;drawQuiz()});drawQuiz();