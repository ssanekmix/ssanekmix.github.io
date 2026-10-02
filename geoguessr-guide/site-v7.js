window.addEventListener('load',()=>setTimeout(applyV7QA,2400));

function applyV7QA(){
  fixSwedenSignPhotoV7();
  translateWizardTermsV7();
  refineYellowCenterPathV7();
  reportImageStateV7();
}

function fixSwedenSignPhotoV7(){
  document.querySelectorAll('img').forEach(img=>{
    const ctx=(img.alt+' '+(img.closest('article')?.querySelector('h3')?.textContent||'')).toLowerCase();
    if(ctx.includes('швеция')&&ctx.includes('сини')){
      img.src='https://commons.wikimedia.org/wiki/Special:Redirect/file/Centralbron%20skyltning%202010.jpg?width=1200';
    }
  });
}

function translateWizardTermsV7(){
  const root=document.getElementById('decision-path');
  if(!root)return;
  const replacements=[
    [/car-meta/gi,'мета машины Google'],
    [/Google-car/gi,'машина Google'],
    [/Follow\/police car/gi,'машина сопровождения / полиции'],
    [/сильная meta/gi,'сильная подсказка'],
    [/EU-номер/gi,'номер ЕС'],
    [/clues/gi,'признаки']
  ];
  const clean=()=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{let s=n.nodeValue;replacements.forEach(([a,b])=>s=s.replace(a,b));if(s!==n.nodeValue)n.nodeValue=s;});
  };
  clean();
  new MutationObserver(clean).observe(root,{subtree:true,childList:true,characterData:true});
}

function refineYellowCenterPathV7(){
  const choices=document.getElementById('v6Choices');
  if(!choices)return;
  const bind=()=>{
    [...choices.querySelectorAll('button')].forEach(btn=>{
      if(btn.dataset.v7Bound)return;
      if(btn.textContent.trim()==='Двойной жёлтый центр + белые края'){
        btn.dataset.v7Bound='1';
        btn.addEventListener('click',e=>{
          e.stopImmediatePropagation();e.preventDefault();
          document.getElementById('v6Progress').textContent='Уточнение по разметке';
          document.getElementById('v6Question').innerHTML='<h3>Жёлтая середина — это ещё не только США</h3><p>Проверь ближайший знак или текст.</p>';
          choices.innerHTML=`
            <button data-v7-result="us"><b>SPEED LIMIT</b> на белом прямоугольнике → США</button>
            <button data-v7-result="can"><b>MAXIMUM</b> / канадская среда → Канада</button>
            <button data-v7-result="lat"><b>Испанский</b> → Латинская Америка</button>
            <button data-v7-result="na">Ничего из этого не вижу</button>`;
          [...choices.querySelectorAll('[data-v7-result]')].forEach(x=>x.onclick=()=>{
            const map={
              us:['🇺🇸 США','Двойной жёлтый центр + белые края + знак SPEED LIMIT — очень сильная связка.'],
              can:['🇨🇦 Канада','Жёлтый центр тоже обычен. Ищи MAXIMUM, канадские знаки, провинциальные маршруты и английский/французский.'],
              lat:['Латинская Америка','Жёлтая центральная линия широко встречается в Америках. Испанский переводит поиск в Латинскую Америку; дальше нужны номера и среда.'],
              na:['Северная/Южная Америка — страна ещё не закрыта','По одной жёлтой центральной разметке США угадывать нельзя. Ищи дорожные знаки, номера, язык и столбы.']
            };
            const [t,d]=map[x.dataset.v7Result];
            document.getElementById('v6Question').innerHTML=`<h3>${t}</h3><p>${d}</p>`;
            choices.innerHTML='';
          });
        },true);
      }
    });
  };
  bind();new MutationObserver(bind).observe(choices,{childList:true,subtree:true});
}

function reportImageStateV7(){
  const imgs=[...document.querySelectorAll('img')];
  let loaded=0,broken=0,pending=0;
  imgs.forEach(i=>{if(i.complete&&i.naturalWidth>40)loaded++;else if(i.complete)broken++;else pending++;});
  window.__geoQa={images:{total:imgs.length,loaded,broken,pending},checkedAt:new Date().toISOString()};
  document.documentElement.dataset.geoBrokenImages=String(broken);
}
