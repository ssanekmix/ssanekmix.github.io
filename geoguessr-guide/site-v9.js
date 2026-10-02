window.addEventListener('load',()=>setTimeout(applyV9QA,3800));

function applyV9QA(){
  fixFalseAmbiguityV9();
  lockVerifiedCriticalPhotosV9();
  runV9Audit();
}

function flagCountV9(s){return (s.match(/[\u{1F1E6}-\u{1F1FF}]{2}/gu)||[]).length;}

function fixFalseAmbiguityV9(){
  const q=document.getElementById('v6Question');
  const choices=document.getElementById('v6Choices');
  if(!q||!choices)return;
  const patch=()=>{
    const title=q.querySelector('h3')?.textContent?.trim()||'';
    const explicitGroup=/группа|страна ещё не закрыта|Европа с EU|Латинская Америка|Пока не определилось/i.test(title);
    const multiCountry=flagCountV9(title)>=2;
    if(!explicitGroup&&!multiCountry&&choices.querySelector('.v8-ambiguous')){
      choices.innerHTML='';
      delete choices.dataset.v8For;
    }
  };
  patch();
  new MutationObserver(()=>setTimeout(patch,0)).observe(q,{childList:true,subtree:true,characterData:true});
}

function commonsV9(name){return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=1200`;}

function lockVerifiedCriticalPhotosV9(){
  const verified=[
    {keys:['Белый передний','жёлтый задний'],src:commonsV9('United Kingdom license plate DE57 UGK front and back.jpg'),fallback:commonsV9('United Kingdom license plate DE57 UGK front.jpg')},
    {keys:['Норвегия','жёлтый центр'],src:commonsV9('Road in Norway.jpg'),fallback:commonsV9('Road in Norway-1.jpg')},
    {keys:['Красная глина','Юго-Восточной Азии'],src:commonsV9('Dirt roads in Cambodia.jpg'),fallback:commonsV9('Highway near Sen Monorom.jpg')},
    {keys:['США','двойной жёлтый центр'],src:commonsV9('2023-08-04 11 01 33 Double-yellow lines and yellow pavement reflector along Mercer County Route 579 (Bear Tavern Road) at Windybush Way in the Mountainview section of Ewing Township, Mercer County, New Jersey.jpg'),fallback:commonsV9('2024-02-05 11 40 47 A yellow pavement reflector between double-yellow center lines along Mercer County Route 579 (Bear Tavern Road) in the Mountainview section of Ewing Township, Mercer County, New Jersey.jpg')},
    {keys:['Болгария'],src:commonsV9('Central-street-in-Blatnitsa.jpg'),fallback:commonsV9('Simeonovets-main-street.jpg')}
  ];

  document.querySelectorAll('article').forEach(card=>{
    const text=(card.querySelector('h3')?.textContent||card.textContent||'').trim();
    const hit=verified.find(x=>x.keys.every(k=>text.toLowerCase().includes(k.toLowerCase())));
    if(!hit)return;
    let img=card.querySelector('img');
    if(!img){img=document.createElement('img');img.loading='lazy';img.alt=text;card.prepend(img);}
    img.style.display='block';
    img.src=hit.src;
    img.dataset.v9Fallback=hit.fallback;
    img.onerror=()=>{
      if(img.dataset.v9Fallback){const f=img.dataset.v9Fallback;img.dataset.v9Fallback='';img.src=f;return;}
      img.style.display='none';
      let box=card.querySelector('.v8-photo-fallback');
      if(!box){box=document.createElement('div');box.className='v8-photo-fallback';box.textContent='Фото временно не загрузилось';card.prepend(box);}
    };
  });
}

function runV9Audit(){
  const top=document.querySelector('.top');
  const cards=[...document.querySelectorAll('.card,.real-card,.v5-photo-card,.env-card,.plate-card,.v4-compare-card,.v5-mark-card')];
  const imgs=[...document.querySelectorAll('img')];
  const result={
    headerHeight:top?Math.round(top.getBoundingClientRect().height):0,
    horizontalBodyOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
    overflowingCards:cards.filter(c=>c.scrollWidth>c.clientWidth+2).length,
    images:{total:imgs.length,loaded:imgs.filter(i=>i.complete&&i.naturalWidth>40).length,broken:imgs.filter(i=>i.complete&&i.naturalWidth<=40).length,pending:imgs.filter(i=>!i.complete).length},
    checkedAt:new Date().toISOString()
  };
  window.__geoQaV9=result;
  document.documentElement.dataset.geoHorizontalOverflow=String(result.horizontalBodyOverflow);
}
