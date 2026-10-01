const countries={
  georgia:{name:'Грузия',flag:'https://flagcdn.com/w320/ge.png',lat:42.3154,lng:43.3569,zoom:6,hint:'Кавказ: между Чёрным морем, Россией, Турцией, Арменией и Азербайджаном.'},
  armenia:{name:'Армения',flag:'https://flagcdn.com/w320/am.png',lat:40.0691,lng:45.0382,zoom:7,hint:'Южный Кавказ, к югу от Грузии; между Турцией и Азербайджаном.'},
  greece:{name:'Греция',flag:'https://flagcdn.com/w320/gr.png',lat:39.0742,lng:21.8243,zoom:6,hint:'Юг Балкан, много островов в Эгейском море.'},
  israel:{name:'Израиль',flag:'https://flagcdn.com/w320/il.png',lat:31.0461,lng:34.8516,zoom:7,hint:'Восточное Средиземноморье, между Ливаном, Сирией, Иорданией и Египтом.'},
  thailand:{name:'Таиланд',flag:'https://flagcdn.com/w320/th.png',lat:15.87,lng:100.9925,zoom:5,hint:'Юго-Восточная Азия, длинная страна между Мьянмой, Лаосом, Камбоджей и Малайзией.'},
  laos:{name:'Лаос',flag:'https://flagcdn.com/w320/la.png',lat:19.8563,lng:102.4955,zoom:6,hint:'Юго-Восточная Азия, без выхода к морю; между Таиландом и Вьетнамом.'},
  cambodia:{name:'Камбоджа',flag:'https://flagcdn.com/w320/kh.png',lat:12.5657,lng:104.991,zoom:6,hint:'Юго-Восточная Азия, южнее Лаоса, между Таиландом и Вьетнамом.'},
  srilanka:{name:'Шри-Ланка',flag:'https://flagcdn.com/w320/lk.png',lat:7.8731,lng:80.7718,zoom:6,hint:'Остров прямо к югу от Индии.'},
  korea:{name:'Южная Корея',flag:'https://flagcdn.com/w320/kr.png',lat:35.9078,lng:127.7669,zoom:6,hint:'Южная половина Корейского полуострова, между Китаем и Японией.'},
  japan:{name:'Япония',flag:'https://flagcdn.com/w320/jp.png',lat:36.2048,lng:138.2529,zoom:5,hint:'Длинная цепь островов к востоку от Кореи и Китая.'},
  ukraine:{name:'Украина',flag:'https://flagcdn.com/w320/ua.png',lat:48.3794,lng:31.1656,zoom:5,hint:'Восточная Европа, к северу от Чёрного моря.'},
  kazakhstan:{name:'Казахстан',flag:'https://flagcdn.com/w320/kz.png',lat:48.0196,lng:66.9237,zoom:4,hint:'Огромная страна Центральной Азии, южнее России и западнее Китая.'},
  poland:{name:'Польша',flag:'https://flagcdn.com/w320/pl.png',lat:51.9194,lng:19.1451,zoom:6,hint:'Центральная Европа, между Германией, Чехией, Словакией, Украиной и Беларусью.'},
  czechia:{name:'Чехия',flag:'https://flagcdn.com/w320/cz.png',lat:49.8175,lng:15.473,zoom:7,hint:'Центральная Европа, прямо южнее Польши и восточнее Германии.'},
  hungary:{name:'Венгрия',flag:'https://flagcdn.com/w320/hu.png',lat:47.1625,lng:19.5033,zoom:7,hint:'Центральная Европа, южнее Словакии; столица Будапешт.'},
  romania:{name:'Румыния',flag:'https://flagcdn.com/w320/ro.png',lat:45.9432,lng:24.9668,zoom:6,hint:'Восточная Европа, к западу от Чёрного моря; южнее Украины.'},
  turkey:{name:'Турция',flag:'https://flagcdn.com/w320/tr.png',lat:38.9637,lng:35.2433,zoom:5,hint:'Мост между Европой и Азией; южнее Чёрного моря.'},
  iceland:{name:'Исландия',flag:'https://flagcdn.com/w320/is.png',lat:64.9631,lng:-19.0208,zoom:6,hint:'Остров в северной Атлантике, далеко к северо-западу от Великобритании.'},
  uk:{name:'Великобритания',flag:'https://flagcdn.com/w320/gb.png',lat:55.3781,lng:-3.436,zoom:5,hint:'Острова к северо-западу от Франции.'},
  netherlands:{name:'Нидерланды',flag:'https://flagcdn.com/w320/nl.png',lat:52.1326,lng:5.2913,zoom:7,hint:'Северо-запад Европы, между Бельгией и Германией.'},
  france:{name:'Франция',flag:'https://flagcdn.com/w320/fr.png',lat:46.2276,lng:2.2137,zoom:5,hint:'Западная Европа, между Испанией, Италией, Германией и Атлантикой.'},
  germany:{name:'Германия',flag:'https://flagcdn.com/w320/de.png',lat:51.1657,lng:10.4515,zoom:6,hint:'Центр Западной Европы.'},
  norway:{name:'Норвегия',flag:'https://flagcdn.com/w320/no.png',lat:60.472,lng:8.4689,zoom:5,hint:'Запад Скандинавии, длинное побережье и фьорды.'},
  denmark:{name:'Дания',flag:'https://flagcdn.com/w320/dk.png',lat:56.2639,lng:9.5018,zoom:7,hint:'Небольшая страна между Германией и Скандинавией.'},
  sweden:{name:'Швеция',flag:'https://flagcdn.com/w320/se.png',lat:60.1282,lng:18.6435,zoom:5,hint:'Восточная часть Скандинавии, между Норвегией и Финляндией.'},
  vietnam:{name:'Вьетнам',flag:'https://flagcdn.com/w320/vn.png',lat:14.0583,lng:108.2772,zoom:5,hint:'Длинная узкая страна вдоль Южно-Китайского моря.'},
  bangladesh:{name:'Бангладеш',flag:'https://flagcdn.com/w320/bd.png',lat:23.685,lng:90.3563,zoom:6,hint:'Почти окружён Индией, к востоку от неё; у Бенгальского залива.'},
  india:{name:'Индия',flag:'https://flagcdn.com/w320/in.png',lat:20.5937,lng:78.9629,zoom:4,hint:'Большой треугольный полуостров Южной Азии.'}
};

const languages=[
  {country:'georgia',title:'Грузинский',script:'თბილისი',tag:'почти уникально',text:'Круглые отдельные буквы и завитки. Увидел такую письменность — первым делом Грузия.'},
  {country:'armenia',title:'Армянский',script:'Երևան',tag:'почти уникально',text:'Крючки и необычные формы, совсем не похожи на кириллицу или греческий.'},
  {country:'greece',title:'Греческий',script:'Αθήνα Ω Δ',tag:'сильный',text:'Ищи Ω, Δ, Σ, Ψ. Обычно Греция или Кипр.'},
  {country:'israel',title:'Иврит',script:'ירושלים',tag:'сильный',text:'Квадратные символы и письмо справа налево. В GeoGuessr чаще всего Израиль.'},
  {country:'thailand',title:'Тайский',script:'กรุงเทพ',tag:'сильный',text:'Много маленьких петель и знаков сверху/снизу. Основной кандидат — Таиланд.'},
  {country:'laos',title:'Лаосский',script:'ວຽງຈັນ',tag:'сильный',text:'Похож на тайский, но визуально круглее и мягче.'},
  {country:'cambodia',title:'Кхмерский',script:'ភ្នំពេញ',tag:'сильный',text:'Очень сложные вытянутые символы с множеством элементов. Камбоджа.'},
  {country:'srilanka',title:'Сингальский',script:'ශ්‍රී ලංකා',tag:'сильный',text:'Письменность выглядит как набор круглых завитков и спиралей. Шри-Ланка.'},
  {country:'korea',title:'Корейский',script:'대한민국',tag:'сильный',text:'Символы собраны в квадратные блоки из кружков и простых линий.'},
  {country:'japan',title:'Японский',script:'日本の道路',tag:'сильный',text:'Сложные иероглифы смешаны с простыми знаками вроде の, し, て.'},
  {country:'ukraine',title:'Украинский',script:'Київ · ї є і',tag:'буквы-маркеры',text:'Особенно запоминай ї, є и і. Они быстро отделяют украинский от русского.'},
  {country:'kazakhstan',title:'Казахский',script:'Қазақстан · Ә Қ',tag:'буквы-маркеры',text:'Кириллица плюс необычные Ә, Қ, Ғ, Ң, Ө, Ұ, Ү, І.'},
  {country:'poland',title:'Польский',script:'Łódź · ł ą ę',tag:'буквы-маркеры',text:'Перечёркнутая ł — один из лучших быстрых маркеров Польши.'},
  {country:'czechia',title:'Чешский',script:'Přerov · ř ě',tag:'буквы-маркеры',text:'Буква ř очень характерна для чешского.'},
  {country:'hungary',title:'Венгерский',script:'Győr · ő ű',tag:'буквы-маркеры',text:'Двойные длинные ударения над ő и ű — отличный маркер Венгрии.'},
  {country:'romania',title:'Румынский',script:'București · ș ț',tag:'буквы-маркеры',text:'Запоминай ș, ț, ă. Часто быстро выдаёт Румынию.'},
  {country:'turkey',title:'Турецкий',script:'Türkiye · ğ ı ş',tag:'буквы-маркеры',text:'Особенно заметна ı — i без точки, плюс ğ и ş.'},
  {country:'iceland',title:'Исландский',script:'Þingvellir · ð',tag:'очень сильный',text:'Þ и ð почти моментально отправляют мысль в Исландию.'},
  {country:'vietnam',title:'Вьетнамский',script:'Đường Nguyễn',tag:'очень заметно',text:'Латиница с огромным количеством диакритики над и под буквами.'},
  {country:'bangladesh',title:'Бенгальский',script:'বাংলাদেশ ঢাকা',tag:'сильный',text:'Буквы как будто подвешены к верхней линии, формы более округлые, чем в хинди.'},
  {country:'india',title:'Деванагари',script:'भारत दिल्ली',tag:'сильный',text:'Характерная непрерывная горизонтальная линия сверху большинства слов.'}
];

const plates=[
  {country:'uk',title:'Великобритания',cls:'whiteback',plate:'AB12 CDE',text:'Обычно белый передний номер и жёлтый задний. Если видишь жёлтый прямоугольник сзади — очень сильная подсказка.'},
  {country:'netherlands',title:'Нидерланды',cls:'yellow',plate:'12-ABC-3',text:'Ярко-жёлтые номера и спереди, и сзади — один из самых заметных европейских признаков.'},
  {country:'france',title:'Франция / ЕС',cls:'blueband',plate:'AB-123-CD',text:'Синяя полоса ЕС сама по себе страну не определяет, но сильно сужает регион до Евросоюза.'},
  {country:'poland',title:'Польша / ЕС',cls:'blueband',plate:'WA 1234X',text:'Белые европейские номера с синей полосой. Страну подтверждай языком, боллардами и знаками.'},
  {country:'germany',title:'Германия',cls:'blueband',plate:'B AB 1234',text:'Белые номера ЕС. В реальном раунде важны также немецкий язык и характерные знаки.'},
  {country:'israel',title:'Израиль',cls:'yellow',plate:'12-345-67',text:'Жёлтые номера — сильный вспомогательный признак Израиля.'}
];

const poles=[
  {country:'france',title:'Французский боллард',kind:'bollard red',text:'Белый дорожный столбик с тёмной вставкой. Полезен в сочетании с французскими дорогами и знаками.'},
  {country:'germany',title:'Немецкий боллард',kind:'bollard blackcap',text:'Белый столбик с крупными чёрными элементами — важная часть узнавания Германии.'},
  {country:'czechia',title:'Центральная Европа',kind:'bollard red',text:'Болларды в Чехии и соседних странах похожи: здесь особенно важно учиться сравнивать форму и отражатели.'},
  {country:'thailand',title:'Бетонные электростолбы',kind:'utility',text:'В Юго-Восточной Азии часто встречаются бетонные столбы и густая проводка. Язык обычно решает точнее.'},
  {country:'japan',title:'Япония: плотная проводка',kind:'utility',text:'Много воздушных проводов, опор и городской инфраструктуры. Лучше сочетать с письменностью и левым движением.'},
  {country:'romania',title:'Восточная Европа: опоры',kind:'utility',text:'Столбы сами по себе редко доказывают страну. Используй их как подтверждение после языка и дороги.'}
];

const essentials=[
  {icon:'↰',title:'Левостороннее движение',text:'Очень сильный фильтр.',items:['Великобритания, Ирландия','Япония, Таиланд','Австралия, Новая Зеландия','ЮАР, Индонезия, Малайзия и др.']},
  {icon:'↱',title:'Правостороннее движение',text:'Большая часть Европы и Америк.',items:['Континентальная Европа','США, Канада, почти вся Латинская Америка','Корея, Вьетнам, Камбоджа']},
  {icon:'┃┆┃',title:'Дорожная разметка',text:'Смотри на центральную и краевые линии.',items:['Жёлтая центральная линия часто полезна в Америках','Белая разметка типична для Европы','Есть ли край дороги, обочина, пунктир?']},
  {icon:'🚦',title:'Знаки и стойки',text:'Форма знака иногда важнее текста.',items:['Красный треугольник — предупреждение во многих странах','Форма указателей и цвет фона','Как знак крепится к столбу']},
  {icon:'🚙',title:'Google-car / камера',text:'Метапризнаки полезны, но учи их позже.',items:['Видимые части машины','Высота камеры','Рифты/артефакты изображения','Не ставь мету выше очевидного языка']},
  {icon:'🌿',title:'Климат и ландшафт',text:'Не угадывай страну только по природе.',items:['Тропики, пустыня, горы, снег','Почва и растительность','Плотность застройки','Используй как подтверждение']}
];

function mapButton(country){return `<button class="map-btn" data-country="${country}">На карте</button>`}
function languageCard(x){return `<article class="clue-card language-card" data-search="${(x.title+' '+x.script+' '+countries[x.country].name).toLowerCase()}"><div class="clue-visual"><div class="script">${x.script}</div></div><div class="country-line"><h3>🇺🇳 ${x.title}</h3><span class="tag">${x.tag}</span></div><p>${x.text}</p><div class="card-actions">${mapButton(x.country)}</div></article>`}
function plateCard(x){return `<article class="clue-card"><div class="clue-visual"><div class="plate ${x.cls}">${x.plate}</div></div><div class="country-line"><h3>${countries[x.country].name}</h3><span class="tag">номер</span></div><p>${x.text}</p><div class="card-actions">${mapButton(x.country)}</div></article>`}
function poleCard(x){let visual=x.kind.startsWith('utility')?`<div class="pole-illustration"><div class="utility"></div></div>`:`<div class="bollard-scene"><div class="${x.kind}"></div></div>`;return `<article class="clue-card"><div class="clue-visual">${visual}</div><div class="country-line"><h3>${x.title}</h3><span class="tag">инфра</span></div><p>${x.text}</p><div class="card-actions">${mapButton(x.country)}</div></article>`}
function essentialCard(x){return `<article class="essential-card"><div class="essential-icon">${x.icon}</div><h3>${x.title}</h3><p>${x.text}</p><ul>${x.items.map(i=>`<li>${i}</li>`).join('')}</ul></article>`}

document.querySelector('#languageGrid').innerHTML=languages.map(languageCard).join('');
document.querySelector('#plateGrid').innerHTML=plates.map(plateCard).join('');
document.querySelector('#poleGrid').innerHTML=poles.map(poleCard).join('');
document.querySelector('#essentialGrid').innerHTML=essentials.map(essentialCard).join('');

const search=document.querySelector('#languageSearch');
search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();document.querySelectorAll('.language-card').forEach(c=>c.classList.toggle('hidden',!c.dataset.search.includes(q)))});

const select=document.querySelector('#countrySelect');
Object.entries(countries).sort((a,b)=>a[1].name.localeCompare(b[1].name,'ru')).forEach(([key,c])=>select.insertAdjacentHTML('beforeend',`<option value="${key}">${c.name}</option>`));

const map=L.map('map',{worldCopyJump:true}).setView([28,20],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
let marker=L.marker([countries.georgia.lat,countries.georgia.lng]).addTo(map);
function showCountry(key,scroll=false){const c=countries[key];if(!c)return;select.value=key;document.querySelector('#mapFlag').src=c.flag;document.querySelector('#mapCountryName').textContent=c.name;document.querySelector('#mapCountryHint').textContent=c.hint;map.flyTo([c.lat,c.lng],c.zoom,{duration:1.1});marker.setLatLng([c.lat,c.lng]).bindPopup(c.name).openPopup();if(scroll)document.querySelector('#map-section').scrollIntoView({behavior:'smooth'})}
select.addEventListener('change',e=>showCountry(e.target.value));
document.addEventListener('click',e=>{const b=e.target.closest('[data-country]');if(b)showCountry(b.dataset.country,true)});
showCountry('georgia');

const quizItems=[
  {visual:'თბილისი',prompt:'Такая круглая письменность — куда смотреть?',answer:'Грузия',options:['Грузия','Армения','Греция','Турция']},
  {visual:'Łódź',prompt:'Буква ł — сильный маркер какой страны?',answer:'Польша',options:['Чехия','Польша','Румыния','Венгрия']},
  {visual:'Þingvellir',prompt:'Увидел Þ. Самый вероятный ответ?',answer:'Исландия',options:['Норвегия','Исландия','Швеция','Финляндия']},
  {visual:'대한민국',prompt:'Квадратные блоки из линий и кружков — это...',answer:'Южная Корея',options:['Япония','Китай','Южная Корея','Таиланд']},
  {visual:'AB12 CDE',prompt:'Белый спереди, жёлтый сзади — сильный признак...',answer:'Великобритания',options:['Нидерланды','Великобритания','Франция','Германия']}
];
let quizIndex=0;
function renderQuiz(){const q=quizItems[quizIndex];document.querySelector('#quizVisual').textContent=q.visual;document.querySelector('#quizPrompt').textContent=q.prompt;document.querySelector('#quizResult').textContent='';document.querySelector('#quizResult').className='quiz-result';document.querySelector('#quizOptions').innerHTML=q.options.map(o=>`<button class="tiny-btn quiz-option" data-option="${o}">${o}</button>`).join('')}
document.querySelector('#quizOptions').addEventListener('click',e=>{const b=e.target.closest('.quiz-option');if(!b)return;const q=quizItems[quizIndex];const r=document.querySelector('#quizResult');const ok=b.dataset.option===q.answer;r.textContent=ok?'Верно ✓':`Нет. Правильный ответ: ${q.answer}`;r.className='quiz-result '+(ok?'ok':'bad')});
document.querySelector('#nextQuiz').addEventListener('click',()=>{quizIndex=(quizIndex+1)%quizItems.length;renderQuiz()});
renderQuiz();
