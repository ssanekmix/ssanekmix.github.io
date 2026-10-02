if(document.readyState==='loading'){
  window.addEventListener('load',()=>setTimeout(applyV11,1800));
}else{
  setTimeout(applyV11,1800);
}

function applyV11(){
  removeDomainsV11();
  openAllCountriesV11();
  retargetCountriesNavV11();
  addHebrewLanguageV11();
  highlightPlateKeysV11();
  runV11Qa();
}

function removeDomainsV11(){
  const grid=document.getElementById('domainGrid');
  if(!grid)return;
  const title=grid.previousElementSibling;
  if(title && title.classList.contains('subhead') && /домены сайтов/i.test(title.textContent)) title.remove();
  grid.remove();
}

function openAllCountriesV11(){
  const grid=document.getElementById('countryGrid');
  if(!grid)return;

  const reveal=()=>{
    document.getElementById('countryMoreBtn')?.remove();
    [...grid.children].forEach(card=>card.classList.remove('country-v10-hidden'));
  };

  reveal();
  new MutationObserver(()=>reveal()).observe(grid,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});
  if(grid.parentElement){
    new MutationObserver(()=>document.getElementById('countryMoreBtn')?.remove()).observe(grid.parentElement,{childList:true});
  }
}

function retargetCountriesNavV11(){
  document.querySelectorAll('.nav a').forEach(a=>{
    if(a.textContent.trim()==='Страны') a.href='#compare';
  });
}

function addHebrewLanguageV11(){
  const grid=document.getElementById('uniqueLangGrid');
  if(!grid)return;
  const txt=grid.textContent||'';
  if(/иврит|עברית/i.test(txt))return;

  const card=document.createElement('article');
  card.className='card v11-hebrew-card';
  card.innerHTML=`
    <div class="lang-script v11-hebrew-script" dir="rtl">רחוב · ישראל · ירושלים</div>
    <div class="card-body">
      <h3>Иврит → 🇮🇱 Израиль</h3>
      <div class="v11-lang-key" dir="rtl">אבגדה · כםןףץ</div>
      <p><strong>Главный вид:</strong> отдельные угловатые буквы, текст идёт <strong>справа налево</strong>.</p>
      <p><strong>Не путай с арабским:</strong> в иврите буквы обычно <strong>не соединяются в вязь</strong>.</p>
      <p><strong>Улица:</strong> <span dir="rtl">רחוב</span> <span class="v11-muted">(rehov)</span>.</p>
      <p><strong>Добивка:</strong> <mark class="v11-plate-key">жёлтые номера</mark> + сухая ближневосточная среда.</p>
    </div>`;
  grid.prepend(card);
}

const V11_PLATE_KEYS=[
  'движение справа','движение слева','белый передний','жёлтый задний','белый спереди','жёлтый сзади',
  'жёлтые спереди и сзади','синяя полоса слева','синие полосы с двух сторон','синие полосы по краям',
  'красная полоса слева','жёлтая полоса справа','бордовые','бордовыми','красноватые','кириллица',
  'иврит','испанский','арабский','французский','сингальская','тамильская','китайский + английский',
  'Jalan','Kota','Selamat','3 светлых кластера','2 крупных blur-блока','2 светлых блока','3 светлых блока',
  'каналы','велосипеды','холмистее','холмы','леса','шноркель','Восточная Африка','Латинская Америка',
  'плоско','Средиземноморье','коммерческие','зелёные номера','региональный блок','передний номер часто заметно короче',
  'передний обычно длиннее','красная полоса','белые символы на чёрном фоне','чёрный фон','EU-полоса','полоса ЕС'
].sort((a,b)=>b.length-a.length);

function escapeReV11(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

function highlightPlateKeysV11(){
  const root=document.getElementById('plateGroups');
  const plates=document.getElementById('plates');
  if(!root||!plates)return;

  if(!document.getElementById('v11PlateLegend')){
    const legend=document.createElement('div');
    legend.id='v11PlateLegend';
    legend.className='v11-plate-legend';
    legend.innerHTML='<b>Как читать:</b> одинаковый цвет номера может вести в несколько стран. <mark class="v11-plate-key">Зелёным выделено, чем их разделять.</mark>';
    const pills=plates.querySelector('.pill-row');
    pills?.insertAdjacentElement('afterend',legend);
  }

  const regex=new RegExp(`(${V11_PLATE_KEYS.map(escapeReV11).join('|')})`,'giu');

  const markText=()=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      if(!node.nodeValue?.trim())return NodeFilter.FILTER_REJECT;
      const p=node.parentElement;
      if(!p)return NodeFilter.FILTER_REJECT;
      if(p.closest('mark,.v11-plate-key,script,style'))return NodeFilter.FILTER_REJECT;
      if(p.matches('b,strong,h1,h2,h3,h4'))return NodeFilter.FILTER_REJECT;
      return regex.test(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});

    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);

    nodes.forEach(node=>{
      regex.lastIndex=0;
      const text=node.nodeValue;
      let last=0,m;
      const frag=document.createDocumentFragment();
      while((m=regex.exec(text))){
        if(m.index>last)frag.append(document.createTextNode(text.slice(last,m.index)));
        const mark=document.createElement('mark');
        mark.className='v11-plate-key';
        mark.textContent=m[0];
        frag.append(mark);
        last=m.index+m[0].length;
      }
      if(last<text.length)frag.append(document.createTextNode(text.slice(last)));
      node.replaceWith(frag);
    });
  };

  markText();
  new MutationObserver(()=>setTimeout(markText,0)).observe(root,{childList:true,subtree:true});
}

function runV11Qa(){
  const grid=document.getElementById('countryGrid');
  const navCountry=[...document.querySelectorAll('.nav a')].find(a=>a.textContent.trim()==='Страны');
  const result={
    hebrewCard:!![...document.querySelectorAll('#uniqueLangGrid .card')].find(c=>/иврит|עברית/i.test(c.textContent)),
    domainsRemoved:!document.getElementById('domainGrid'),
    countryMoreButtonGone:!document.getElementById('countryMoreBtn'),
    collapsedCountryCards:grid?[...grid.children].filter(c=>c.classList.contains('country-v10-hidden')).length:0,
    countriesNavTarget:navCountry?.getAttribute('href')||null,
    highlightedPlateKeys:document.querySelectorAll('#plateGroups .v11-plate-key').length,
    horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
    checkedAt:new Date().toISOString()
  };
  window.__geoV11Qa=result;
  document.documentElement.dataset.geoV11Qa=JSON.stringify(result);
}
