window.addEventListener('load',()=>setTimeout(applyV3,220));
function applyV3(){addRedPlates();rebuildRoadsWithPhotos();rebuildSignsAndSoils();rebuildPolesWithPhotos();}

function addRedPlates(){
 const host=document.getElementById('plateGroups'); if(!host||document.getElementById('redPlateFamily'))return;
 const sec=document.createElement('section'); sec.id='redPlateFamily'; sec.className='plate-family red-plate-family';
 sec.innerHTML=`<h3 class="plate-family-title">Красные номера и красные элементы</h3><div class="grid g3">
 <article class="plate-card"><div class="red-plate-visual"><div class="red-plate">BT 1 2345</div></div><h3>Полностью красный фон → прежде всего Бутан</h3><ul><li><b>Бутан:</b> обычные номера почти всегда красные с белыми символами.</li><li>Если это нормальная легковая машина, красная пластина целиком — очень сильный признак Бутана.</li><li>Не путай с дипломатическими красными номерами других стран: они редкие и не должны определять страну сами.</li></ul></article>
 <article class="plate-card"><div class="red-plate-visual"><div class="red-strip-plate">AB 1234</div></div><h3>Красная полоса на белом номере</h3><ul><li><b>Кыргызстан:</b> красная полоса — сильный признак; ищи горы/постсоветскую среду и характерную машину Google.</li><li><b>Албания:</b> старый тип номера тоже бывает с красной полосой слева; среда балканская, язык латиницей.</li><li><b>ОАЭ:</b> похожая красная полоса возможна редко; пустынная среда + арабский/английский быстро отделяют.</li></ul></article>
 <article class="plate-card"><div class="red-plate-visual"><div class="red-text-plate">1-ABC-123</div></div><h3>Красные символы на белом фоне → Бельгия</h3><ul><li>Не красный фон, а именно бордово-красные буквы/цифры.</li><li>После размытия вся пластина может выглядеть слегка розоватой.</li><li>Французский или нидерландский текст вокруг хорошо подтверждает Бельгию.</li></ul></article>
 </div>`;
 host.appendChild(sec);
}

function photoCard(x){return `<article class="real-card"><img src="${x.img}" alt="${x.title}" loading="lazy"${x.position?` style="object-position:${x.position}"`:""}><div class="body"><h3>${x.title}</h3><ul>${x.facts.map(f=>`<li>${f}</li>`).join('')}</ul>${x.strength?`<span class="strength">${x.strength}</span>`:''}${photoCreditV3(x)}</div></article>`}

function photoCreditV3(x){
 return x.photoSource?`<p class="photo-note"><a href="${x.photoSource}" target="_blank" rel="noopener">Фото: ${x.photoAuthor}</a> · <a href="https://creativecommons.org/licenses/by-sa/${x.photoLicense}/" target="_blank" rel="noopener">CC BY-SA ${x.photoLicense}</a> · уменьшено</p>`:'';
}

function rebuildRoadsWithPhotos(){
 const host=document.getElementById('roadRules'); if(!host)return;
 host.className='road-real-grid';
 const cards=[
 {title:'Филиппины — бетонные плиты',img:'https://salaymisor.gov.ph/wp-content/uploads/2022/06/purok-8-road1.png',facts:['Светло-серое бетонное полотно с регулярными поперечными швами.','Очень частый образ на обычных улицах Филиппин.','Английский текст + правостороннее движение резко усиливают Филиппины.'],strength:'сильный в связке'},
 {title:'Нидерланды — кирпичная/брусчатая улица',img:'./assets/nl-brick-street.jpg',position:'center bottom',photoSource:'https://commons.wikimedia.org/wiki/File:Netherlands,_Makkinga,_Brink_(1).jpg',photoAuthor:'Vincent van Zeijst',photoLicense:'4.0',facts:['Мелкие прямоугольные кирпичи, часто уложенные «ёлочкой».','Очень типично для жилых кварталов Нидерландов.','Жёлтые номера, велосипеды и каналы подтверждают.'],strength:'средний'},
 {title:'Нидерланды — красная велодорожка',img:'https://upload.wikimedia.org/wikipedia/commons/e/eb/Fietsstrook_Herenweg_Oudorp.jpg',facts:['Красное/бордовое покрытие именно отдельной велосипедной полосы.','Смотри на велосипеды, белые велосипедные символы и отделение от автомобильной полосы.'],strength:'сильный образ NL'},
 {title:'Норвегия — жёлтый центр',img:'https://motorcycle-diaries.com/sites/default/files/styles/image_gallery_full/public/roads/NK-14-jul_0344.jpg?itok=qrU8iIY3',facts:['Жёлтая центральная линия и белые края очень характерны для Норвегии.','На узких дорогах центр может исчезать, поэтому проверяй также длинные крайние штрихи и рельеф.'],strength:'сильный в Скандинавии'},
 {title:'Красно-оранжевый грунт',img:'https://upload.wikimedia.org/wikipedia/commons/4/48/Route_Nationale_8_%28Madagascar%29_03.JPG',facts:['Латеритная красно-оранжевая почва встречается в тропиках: Мадагаскар, Бразилия, Камбоджа, части Африки и др.','Сам цвет страну не определяет — смотри растительность, движение, язык и машину Google.'],strength:'слабый без второго признака'},
 {title:'Светлая известняковая дорога',img:'https://images.greece.com/panoramio/07/23/09/20/5974e90196b39.jpg',facts:['Очень белёсый каменный/известняковый грунт бывает в Средиземноморье.','Греция/острова — один из типичных примеров, но по цвету одному не угадывай.'],strength:'слабый'},
 {title:'Чёрный вулканический грунт',img:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Black%20sand%20beach%20outside%20Reykjavik%2C%20Iceland%20(Eyrarbakkevegur).jpg?width=1000',facts:['Чёрный песок/вулканическая почва сразу заставляет думать об Исландии и других вулканических регионах.','В Исландии подтверждай безлесностью, лавовыми полями, жёлтыми предупреждающими знаками и исландскими названиями.'],strength:'средний'},
 {title:'Красная глина в Юго-Восточной Азии',img:'https://classroomclipart.com/images/gallery/Transportation/Roadways_and_Freeways/red-clay-road-in-siem-reap-cambodia.jpg',facts:['Красная глина + рисовые поля + пальмы хорошо вписываются в Камбоджу.','Но похожий грунт есть в Индонезии, Бразилии и Африке — ищи письмо/движение/столбы.'],strength:'средний в контексте'}
 ];
 host.innerHTML=cards.map(photoCard).join('');
}

function rebuildSignsAndSoils(){
 const signs=document.getElementById('signGrid'); if(signs){
  const data=[
   {title:'Италия / Албания / Румыния — тёмная задняя сторона знака',img:'https://www.drogowi.pl/userdata/public/gfx/1146/tyl.jpg',facts:['Тёмно-серая или почти чёрная обратная сторона знака — полезный европейский признак.','Особенно часто думай про Италию, Албанию, Румынию и Германию; дальше решай по языку, номеру и форме знаков.','В Италии это хорошо сочетается с двумя синими полосами номера и итальянским текстом.']},
   {title:'Норвегия — жёлтые указатели',img:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Yellow%20%26%20blue%20in%20the%20%C3%85sane%20district%20in%20Bergen%2C%20Norway.jpg?width=1000',facts:['Основные дорожные указатели часто жёлтые с чёрным текстом.','Жёлтый центр дороги + горы/фьорды сильно подтверждают Норвегию.']},
   {title:'Швеция — синие информационные указатели',img:'https://www.svtstatic.se/image-news/600/square/0.49/0.57/2f7dea063fcf4623023fe8e565ec59e844cbbd20767e1592983792b1b934095b',facts:['Синий фон + белый текст — частый вид шведских указателей.','Ищи буквы å/ä/ö и более короткие внешние штрихи дороги.']},
   {title:'Финляндия / Исландия — жёлтый центр предупреждающего знака',img:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Finland_road_sign_B5.svg/1280px-Finland_road_sign_B5.svg.png',facts:['Предупреждающие знаки с жёлтым фоном и красной каймой сразу сужают север Европы.','Финляндия и Исландия — важные варианты; отделяй по языку, дороге и ландшафту.']},
   {title:'Хорватия / Словения / Сербия / Черногория / Сев. Македония — жёлтые указатели',img:'https://blog.dnevnik.hr/nepoznatizagreb/slike/originals/blog1368.jpg',facts:['Жёлтый фон + чёрный текст часто встречается на Балканах.','По цвету страну не закрывай: дальше язык, домен, болларды и гидранты.','Хорватия: ć/đ + .hr + синие гидранты; Словения: č/š/ž без ć/đ.']},
   {title:'Греция — синие указатели, греческий жёлтым / английский белым',img:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Greek%20road%20signs.jpg?width=1000',facts:['Если на синем указателе греческий текст выделен жёлтым, а английский белым — это очень сильная Греция.','Даже издалека цвет двух строк бывает заметен раньше букв.']}
  ]; signs.innerHTML=data.map(photoCard).join('');
 }
 const soils=document.getElementById('soilGrid'); if(soils){
  const data=[
   {title:'Красная почва',img:'https://1.bp.blogspot.com/-dnXWKcNYDIw/XwzKsi1NSdI/AAAAAAAA3I0/WO7XPCcg4PU809JI-w8Ii8vSa67ZGQVWwCLcBGAsYHQ/s1600/estrada1.jpg',facts:['Бразилия, Камбоджа, Мадагаскар, Уганда и другие тропики.','Цвет сам по себе слабый; полезен только вместе с растительностью и инфраструктурой.']},
   {title:'Чёрная вулканическая',img:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Black%20sand%20beach%2C%20Iceland.jpg?width=1000',facts:['Исландия — самый очевидный европейский кандидат.','Также возможны другие вулканические районы; ищи отсутствие леса, лаву, исландский язык.']},
   {title:'Белёсая известняковая',img:'https://images.greece.com/panoramio/07/23/09/20/5974e90196b39.jpg',facts:['Греция, острова Средиземноморья и другие известняковые районы.','Слабый признак — обязательно подтверждай языком/знаками.']},
   {title:'Оранжевая тропическая глина',img:'https://classroomclipart.com/images/gallery/Transportation/Roadways_and_Freeways/red-clay-road-in-siem-reap-cambodia.jpg',facts:['Юго-Восточная Азия и тропики.','Пальмы + рис + правостороннее движение + кхмерский → Камбоджа.']}
  ]; soils.innerHTML=data.map(photoCard).join('');
 }
}

function rebuildPolesWithPhotos(){
 const host=document.getElementById('poleGrid'); if(!host)return;
 document.getElementById('specialPoleHeading')?.remove();document.getElementById('specialPolePhotos')?.remove();
 host.className='real-grid real-poles';
 const data=[
  {title:'Венгрия — дырчатый бетонный столб',img:'https://cdn.vg.hu/2023/10/rCCWThoCNP_n4itzDnrf-9QGwpHI_fpFNHgTgi82chE/fill/1347/758/no/1/aHR0cHM6Ly9jbXNjZG4uYXBwLmNvbnRlbnQucHJpdmF0ZS9jb250ZW50LzRmNzU1NTQ0Y2ZiYTQ0MWNhNzlkM2Q3N2YwOTFkOWRi.jpg',facts:['Большие прямоугольные отверстия тянутся почти до земли.','Похож на Румынию; у Румынии столб чаще толще и низ нередко окрашен белым.']},
  {title:'Франция — «лестничный» столб',img:'https://images.squarespace-cdn.com/content/v1/60f6054f4e76b03092956de8/5520b887-6b93-4fe1-8c90-850b965bc81b/Ladder%2Bpoles.png?format=1500w',facts:['Узкие регулярные выемки/ступени по длине столба.','Похожий тип встречается также в Испании и Сенегале — подтверждай дорогой и языком.']},
  {title:'Болгария — дырчатый столб',img:'https://geodummy.com/static/img/places/bulgaria/poles/pole-holey.jpg',facts:['Высокий бетонный столб с длинными прямоугольными отверстиями.','В Болгарии также ищи кириллицу с ъ и красные черепичные крыши.']},
  {title:'Тайвань — чёрно-жёлтая маркировка',img:'./assets/taiwan-pole.webp',facts:['Диагональная чёрно-жёлтая/оранжевая окраска идёт почти до земли.','У Южной Кореи похожая маркировка обычно заканчивается выше.']},
  {title:'Аргентина — двойной бетонный столб',img:'https://learnablemeta.com/images/iklofsfUFV6mDtBk1YnbOCPSVNwruGwLkmjP.avif',facts:['Две параллельные бетонные стойки с перемычками.','Силуэт очень хорошо читается издалека.']},
  {title:'Филиппины — бетонные столбы и плотная проводка',img:'https://upload.wikimedia.org/wikipedia/commons/f/f0/34Bagumbayan%2C_Taguig_City_20.jpg',facts:['Бетонные опоры прямо у дороги + плотные воздушные провода.','Бетонные плиты дороги и английский текст подтверждают Филиппины.']}
 ];
 host.innerHTML=data.map(photoCard).join('');
}

