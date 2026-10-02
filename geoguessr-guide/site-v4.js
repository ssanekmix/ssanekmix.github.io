window.addEventListener('load',()=>setTimeout(applyV4,420));

function applyV4(){
  addCountryQuickComparisons();
  addWhiteYellowPlateFamily();
  hardenRealImages();
  replaceMapWithLeftDriving();
}

function addCountryQuickComparisons(){
  const host=document.getElementById('pairGrid');
  if(!host || document.getElementById('v4QuickCompare')) return;

  const wrap=document.createElement('section');
  wrap.id='v4QuickCompare';
  wrap.className='v4-compare-wrap';
  wrap.innerHTML=`
    <h3 class="subhead">Ещё частые ступоры</h3>
    <div class="v4-compare-grid">
      <article class="v4-compare-card">
        <h3>🇵🇪 Лима / Перу ↔ 🇪🇸 Испания ↔ 🇦🇷 Аргентина</h3>
        <div class="v4-killer">Сначала номер → потом среда → потом инфраструктура</div>
        <div class="v4-cols">
          <div><b>🇵🇪 Перу / Лима</b><ul>
            <li>Номера бывают <strong>белые или жёлтые</strong>; у такси встречается жёлтая верхняя часть + белый низ.</li>
            <li>Лима часто выглядит <strong>очень сухой, пыльной, бежево-серой</strong>, почти без зелени; вокруг голые пустынные холмы.</li>
            <li>За пределами Лимы — Анды и серпантины. Ищи <strong>чёрно-белые полосатые стойки дорожных знаков</strong>: с испанским это сильнее одних гор.</li>
            <li>В Южной Америке возможна чёрная/белая машина Google; это не Испания.</li>
          </ul></div>
          <div><b>🇪🇸 Испания</b><ul>
            <li>Длинный <strong>белый номер ЕС с одной синей полосой слева</strong>.</li>
            <li>Европейские дорожные знаки, болларды и разметка; инфраструктура выглядит явно европейской.</li>
            <li>Сухо может быть очень сильно, но обычно нет «пыльного мегаполиса в пустыне» как в Лиме.</li>
          </ul></div>
          <div><b>🇦🇷 Аргентина</b><ul>
            <li>Старый номер может выглядеть как <strong>чёрная точка по центру</strong>; новый — белый с <strong>синей полосой сверху</strong>.</li>
            <li>Часты круглые бетонные опоры; встречаются характерные <strong>двойные бетонные столбы</strong>.</li>
            <li>В старом покрытии встречается чёрная машина Google.</li>
          </ul></div>
        </div>
      </article>

      <article class="v4-compare-card">
        <h3>🇵🇭 Филиппины ↔ 🇬🇾 Georgetown / Guyana</h3>
        <div class="v4-killer">Самый быстрый фильтр: Филиппины — движение справа, Гайана — слева</div>
        <div class="v4-cols two">
          <div><b>🇵🇭 Филиппины</b><ul>
            <li><strong>Правостороннее движение.</strong></li>
            <li>Очень часты <strong>бетонные дороги из плит</strong>.</li>
            <li>Английский + Filipino; часто jeepney и трициклы.</li>
            <li>Частные номера обычно белые; старые могут давать <strong>зеленоватый оттенок</strong>; у общественного транспорта бывают жёлтые.</li>
            <li>Много бетонных/восьмигранных столбов и плотной проводки.</li>
          </ul></div>
          <div><b>🇬🇾 Georgetown / Guyana</b><ul>
            <li><strong>Левостороннее движение.</strong></li>
            <li>Официальный язык — английский; городской вид больше карибско-британский, чем юго-восточноазиатский.</li>
            <li>Обычный номер: <strong>белые символы на чёрном фоне</strong>.</li>
            <li>Georgetown очень плоский, влажный и низменный; каналы/дренаж и тропическая зелень обычны.</li>
            <li>Нет типичной для Филиппин связки «бетонные плиты + jeepney/трицикл».</li>
          </ul></div>
        </div>
      </article>
    </div>`;
  host.insertAdjacentElement('beforebegin',wrap);
}

function addWhiteYellowPlateFamily(){
  const host=document.getElementById('plateGroups');
  if(!host || document.getElementById('whiteYellowFamily')) return;

  const sec=document.createElement('section');
  sec.id='whiteYellowFamily';
  sec.className='plate-family v4-plate-family';
  sec.innerHTML=`
    <h3 class="plate-family-title">Белый спереди + жёлтый сзади — одна форма, несколько стран</h3>
    <div class="v4-plate-pattern">
      <div class="v4-plate-photo">
        <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/UK%20front%20and%20rear%20number%20plates.jpg?width=900" alt="Белый передний и жёлтый задний номер" loading="lazy">
      </div>
      <div class="v4-candidates">
        <div><b>🇬🇧 Великобритания</b><span>лево; английский; британские знаки; очень частая связка.</span></div>
        <div><b>🇰🇪 Кения</b><span>лево; Африка; часто жёлтый задний квадратнее; шноркель/кенийская машина Google может подтвердить.</span></div>
        <div><b>🇺🇬 Уганда</b><span>лево; Восточная Африка; английский; тропическая среда.</span></div>
        <div><b>🇱🇰 Шри-Ланка</b><span>лево; сингальская/тамильская письменность почти сразу решает.</span></div>
        <div><b>🇭🇰 Гонконг</b><span>лево; китайский + английский; плотная городская застройка.</span></div>
        <div><b>🇬🇮 Гибралтар</b><span><strong>исключение: движение справа</strong>; английский + Средиземноморье + Скала Гибралтара.</span></div>
      </div>
    </div>`;
  host.prepend(sec);
}

function hardenRealImages(){
  const fallbacks={
    'Филиппины — бетонные плиты':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Concrete%20road%20in%20the%20Philippines.jpg?width=1000',
    'Нидерланды — кирпичная/брусчатая улица':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Brick%20road%20Netherlands.jpg?width=1000',
    'Нидерланды — красная велодорожка':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fietsstrook_Herenweg_Oudorp.jpg?width=1000',
    'Норвегия — жёлтый центр':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Road%20in%20Norway.jpg?width=1000',
    'Чёрный вулканический грунт':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Black%20sand%20beach%2C%20Iceland.jpg?width=1000',
    'Тайвань':'https://miro.medium.com/v2/resize:fit:1400/1*EVrhf9QEH4RCrQDXXatTjQ.png',
    'ЮАР':'https://mapsensei.com/images/countries/south-africa/south-africa_18.webp',
    'Филиппины':'https://upload.wikimedia.org/wikipedia/commons/f/f0/34Bagumbayan%2C_Taguig_City_20.jpg'
  };

  document.querySelectorAll('.real-card,.card').forEach(card=>{
    const img=card.querySelector('img');
    if(!img)return;
    const title=card.querySelector('h3')?.textContent?.trim()||'';
    const entry=Object.entries(fallbacks).find(([k])=>title.includes(k));
    const alt=entry?.[1];
    let tries=0;
    img.addEventListener('error',()=>{
      tries++;
      if(alt && img.src!==alt){ img.src=alt; return; }
      if(tries<3){
        img.src='https://commons.wikimedia.org/wiki/Special:Redirect/file/Road%20sign%20and%20road.jpg?width=900';
        return;
      }
      img.closest('.real-card,.card')?.classList.add('image-failed');
    });
  });
}

function replaceMapWithLeftDriving(){
  const sec=document.getElementById('map-section');
  if(!sec)return;
  sec.id='left-driving-map';
  sec.innerHTML=`
    <div class="section-head"><div><span class="eyebrow">10 · ЛЕВОСТОРОННЕЕ ДВИЖЕНИЕ</span><h2>Карта стран, где ездят слева</h2><p>На карте синим отмечено левостороннее движение, красным — правостороннее.</p></div></div>
    <div class="left-drive-map-card">
      <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Countries%20driving%20on%20the%20left%20or%20right.svg?width=1600" alt="Карта стран с левосторонним и правосторонним движением" loading="lazy">
      <div class="left-drive-grid">
        <div><b>Европа</b><span>UK, Ирландия, Мальта, Кипр.</span></div>
        <div><b>Азия</b><span>Япония, Индия, Таиланд, Малайзия, Индонезия, Сингапур, Шри-Ланка, Бангладеш, Гонконг.</span></div>
        <div><b>Африка</b><span>ЮАР, Ботсвана, Лесото, Эсватини, Кения, Уганда, Танзания, Замбия, Зимбабве и др.</span></div>
        <div><b>Океания</b><span>Австралия, Новая Зеландия и большинство бывших британских островных территорий.</span></div>
        <div><b>Америка</b><span>Гайана + ряд Карибских стран/территорий.</span></div>
      </div>
    </div>`;

  document.querySelectorAll('a[href="#map-section"]').forEach(a=>{a.href='#left-driving-map';a.textContent='Левое движение';});
}
