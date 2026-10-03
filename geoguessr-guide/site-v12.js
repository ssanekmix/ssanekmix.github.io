/* Country reference, shared clues and recall cards. Data is authored separately. */
(()=>{
  const init=async()=>{
    if(document.getElementById('country-library'))return;
    try{
      const response=await fetch('./learning-data.json?v=20261002-learning1');
      if(!response.ok)throw Error('Reference data: '+response.status);
      const data=await response.json();
      build(data);
      document.dispatchEvent(new Event("learningready"));
    }catch(error){console.error('Learning section',error);}
  };
  if(document.readyState==='complete')setTimeout(init,200);
  else window.addEventListener('load',()=>setTimeout(init,6500),{once:true});

  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
  const fields={language:'Язык и движение',plates:'Номера',signs:'Дорожные знаки',lines:'Разметка',infrastructure:'Опоры и среда улицы',landscape:'Природа и покрытие'};
  const regions={'Europe':'Европа','Asia':'Азия','Africa':'Африка','North America':'Северная Америка','South America':'Южная Америка','Oceania':'Океания','Antarctica':'Антарктика'};
  const names={'alaska':'США — Аляска','hawaii':'США — Гавайи','texas':'США — Техас','azores':'Португалия — Азоры','madeira':'Португалия — Мадейра','us-minor-outlying-islands':'Внешние малые острова США — Мидуэй','israel-west-bank':'Израиль и Западный берег','svalbard':'Шпицберген','christmas-island':'Остров Рождества'};
  const countryNames=new Intl.DisplayNames(['ru'],{type:'region'});
  function countryName(c){
    if(names[c.id])return names[c.id];
    try{return countryNames.of(c.code)||c.englishName;}catch{return c.englishName;}
  }
  function flag(c){return `<img class="learn-flag" loading="lazy" src="https://flagcdn.com/w80/${c.code.slice(0,2).toLowerCase()}.png" alt="">`;}
  function photo(c){
    const p=c.photo;if(!p)return '';
    const title=p.category==='signs'?'Пример знака из странового гайда':'Пример из странового гайда';
    if(p.src)return `<figure class="learn-photo"><img src="${escape(p.src)}" loading="lazy" alt="${escape(c.name+' — '+title)}"><figcaption>${title} · <a href="${escape(p.source)}" target="_blank" rel="noopener">источник ↗</a></figcaption></figure>`;
    const x=p.cols>1?p.x/(p.cols-1)*100:0,y=p.rows>1?p.y/(p.rows-1)*100:0;
    return `<figure class="learn-photo"><div role="img" aria-label="${escape(c.name+' — '+title)}" class="learn-sprite" style="background-image:url('${escape(p.atlas)}');background-size:${p.cols*100}% ${p.rows*100}%;background-position:${x}% ${y}%"></div><figcaption>${title} · <a href="${escape(p.source)}" target="_blank" rel="noopener">источник ↗</a></figcaption></figure>`;
  }
  function source(c){return `<a class="source-link" href="${escape(c.source)}" target="_blank" rel="noopener">Страновой гайд и дополнительные фотографии ↗</a>`;}
  function matches(c,q){return normalize([c.name,c.englishName,...Object.keys(fields).map(k=>c[k])].join(' ')).includes(normalize(q));}
  function makeSection(id,title,description){
    const section=document.createElement('section');section.className='section learn-section';section.id=id;
    section.innerHTML=`<div class="section-head"><div><span class="eyebrow">УЧЕБНЫЙ СПРАВОЧНИК</span><h2>${title}</h2><p>${description}</p></div></div>`;return section;
  }
  function build(data){
    const list=data.countries.map(c=>({...c,name:countryName(c)})).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    const byId=new Map(list.map(c=>[c.id,c]));
    const main=document.querySelector('main');if(!main)return;
    const nav=document.querySelector('.nav');
    for(const [id,name] of [['country-library','Страновой справочник'],['study-cards','Карточки']]){
      const a=document.createElement('a');a.href='#'+id;a.textContent=name;nav?.append(a);
    }

    // Keep the original comparison cards aligned with the expanded reference.
    if(typeof countries!=='undefined'){
      const labels={Europe:'Европа',Asia:'Азия',Africa:'Африка','North America':'Америка','South America':'Америка',Oceania:'Океания',Antarctica:'Антарктика'};
      for(const c of list){
        if(c.code.length!==2)continue;
        const code=c.code.toLowerCase(),old=countries.find(x=>x.code===code);
        const record={code,name:c.name,region:labels[c.region]||c.region,domain:old?.domain||'',clues:[c.language,c.plates,c.landscape,c.signs+'; '+c.infrastructure,c.confusions]};
        if(old)Object.assign(old,record);else countries.push(record);
      }
      for(const id of ['compareA','compareB']){
        const select=document.getElementById(id);if(!select)continue;
        const value=select.value;select.innerHTML=countries.map(c=>`<option value="${c.code}">${escape(c.name)}</option>`).join('');select.value=value;
      }
      const regionSelect=document.getElementById('countryRegion');
      for(const value of new Set(countries.map(c=>c.region))){
        if(regionSelect&&![...regionSelect.options].some(o=>o.value===value)){const option=document.createElement('option');option.value=value;option.textContent=value;regionSelect.append(option);}
      }
      if(typeof renderCountries==='function')renderCountries();
      if(typeof drawCompare==='function')drawCompare();
      if(typeof renderFlags==='function')renderFlags();
    }

    addRoadReference(data);
    // Sign photos are rendered by the visual catalogue.
    const library=makeSection('country-library',`${list.length} стран, территорий и регионов — по признакам`,'Открой страну, сравни сильную связку и исключения. Для территорий и треккеров отдельно указано, какие дорожные признаки неприменимы.');
    library.innerHTML+=`<div class="learn-tools"><label>Поиск страны или признака<input id="learnSearch" type="search" placeholder="Например: Бразилия, ALTO, жёлтые номера"></label><label>Регион<select id="learnRegion"><option value="all">Все регионы</option>${Object.entries(regions).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><span id="learnCount" role="status"></span></div><div id="learnCountries" class="learn-countries"></div><p class="learn-source-note">Основа — страновые гайды <a href="${data.sources.reference}" target="_blank" rel="noopener">Plonk It</a>; дорожные сравнения дополнены доступными материалами <a href="${data.sources.openCountries}" target="_blank" rel="noopener">OpenGuessr Education</a>. Признаки привязаны к типу номера и поколению снимка; старое покрытие может отличаться.</p>`;
    main.append(library);
    const renderLibrary=()=>{
      const query=document.getElementById('learnSearch').value,region=document.getElementById('learnRegion').value;
      const filtered=list.filter(c=>(region==='all'||c.region===region)&&matches(c,query));
      document.getElementById('learnCount').textContent=`${filtered.length} из ${list.length}`;
      document.getElementById('learnCountries').innerHTML=filtered.map(c=>`<details class="learn-country" id="learn-${c.id}"><summary>${flag(c)}<span>${escape(c.name)}<small>${escape(regions[c.region]||c.region)}</small></span><span class="learn-expand">Открыть</span></summary><div class="learn-country-body">${photo(c)}<div class="learn-strong"><b>Сильная связка</b><p>${escape(c.strong)}</p></div><dl>${Object.entries(fields).map(([k,name])=>`<div><dt>${name}</dt><dd>${escape(c[k])}</dd></div>`).join('')}</dl><div class="learn-caution"><b>Похожие страны и исключения</b><p>${escape(c.confusions)}</p></div>${source(c)}<button class="learn-action" data-visual-country="${c.code}">Фотографии страны →</button><button class="learn-action" data-study-country="${c.id}">Учить эту страну →</button></div></details>`).join('')||'<p class="learn-empty">Совпадений нет. Попробуй другой признак или убери регион.</p>';
    };
    document.getElementById('learnSearch').addEventListener('input',renderLibrary);
    document.getElementById('learnRegion').addEventListener('change',renderLibrary);
    renderLibrary();
    addReferenceTables(list);
    addEvidenceFinder(list);
    buildStudy(data,list,byId,main);
    library.addEventListener('click',e=>{
      const button=e.target.closest('[data-study-country]');if(!button)return;
      for(const id of ['studyKind','studyField','studyMode'])document.getElementById(id).value='all';
      document.getElementById('studyCountry').value=button.dataset.studyCountry;
      document.getElementById('studyCountry').dispatchEvent(new Event('change'));
      document.getElementById('study-cards').scrollIntoView({behavior:'smooth'});
    });
    if(location.hash==='#study-cards'||location.hash==='#country-library'){
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
  }

  function addReferenceTables(list){
    for(const [sectionId,key,title] of [['plates','plates','Номера по всем странам'],['latin-start','language','Языки по всем странам'],['poles','infrastructure','Инфраструктура по всем странам'],['environment','landscape','Природа и покрытие по всем странам']]){
      const host=document.getElementById(sectionId);if(!host)continue;
      const details=document.createElement('details');details.className='learn-reference-table';
      details.innerHTML=`<summary>${title} · ${list.length} записей</summary><div class="learn-table-scroll"><table><thead><tr><th>Страна / территория</th><th>Что искать</th><th>С чем спутать</th></tr></thead><tbody>${list.map(c=>`<tr><th>${escape(c.name)}</th><td>${escape(c[key])}</td><td>${escape(c.confusions)}</td></tr>`).join('')}</tbody></table></div>`;
      host.append(details);
    }
  }
  function addEvidenceFinder(list){
    const host=document.getElementById('decision-path');if(!host)return;
    const box=document.createElement('div');box.className='learn-finder';
    box.innerHTML=`<h3>Проверить признак по большому справочнику</h3><p>Ищет совпадения в языке, номерах, знаках и инфраструктуре. Список совпадений — кандидаты, а не готовый ответ.</p><label>Что видишь?<input id="evidenceSearch" type="search" placeholder="ALTO, FM, хангыль, бирюзовые, жёлтая зебра…"></label><div id="evidenceResults" aria-live="polite"></div>`;
    host.append(box);
    document.getElementById('evidenceSearch').addEventListener('input',e=>{
      const words=normalize(e.target.value.trim()).split(/\s+/).filter(Boolean);
      const results=words.length?list.filter(c=>words.every(word=>normalize(Object.keys(fields).map(k=>c[k]).join(' ')).includes(word))):[];
      document.getElementById('evidenceResults').innerHTML=!words.length?'':`<p>${results.length} совпадений в справочнике</p>${results.slice(0,12).map(c=>`<a class="learn-evidence-result" href="#learn-${c.id}"><b>${escape(c.name)}</b><span>${escape(c.strong)}</span></a>`).join('')}${!results.length?'<p>Признак может быть описан другими словами. Попробуй короткое слово и проверь страновые гайды.</p>':''}`;
      box.querySelectorAll('.learn-evidence-result').forEach(a=>a.addEventListener('click',()=>{
        document.getElementById('learnSearch').value='';document.getElementById('learnRegion').value='all';document.getElementById('learnSearch').dispatchEvent(new Event('input'));
        const detail=document.getElementById(a.hash.slice(1));if(detail)detail.open=true;
      }));
    });
  }
  function roadSVG(r){
    const colors={white:'#f4f7fb',yellow:'#ffce47',red:'#ef5b59'};
    const line=(x,color,dash='',width=5)=>`<path d="M${x} 8V174" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
    let center=line(100,colors[r.center]||colors.white,'20 13');
    if(r.center==='doublewhite')center=line(94,colors.white)+line(106,colors.white);
    if(r.center==='triple')center=line(87,colors.yellow)+line(100,colors.white,'19 13')+line(113,colors.yellow);
    if(r.center==='mixed')center=line(95,colors.yellow)+line(105,colors.white,'19 13');
    if(r.center==='crossing')center=Array.from({length:6},(_,i)=>`<rect x="${34+i*23}" y="75" width="13" height="48" fill="${colors.yellow}"/>`).join('');
    const dash=r.dashed?(r.title.includes('Дания')?'6 14':r.title.includes('Франция')?'49 14':r.title.includes('Швеция')?'14 20':'28 18'):'';
    return `<svg viewBox="0 0 200 182" role="img" aria-label="${escape(r.title+' — схема')}" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="182" rx="12" fill="#294039"/><rect x="20" width="160" height="182" fill="#344353"/>${line(30,colors[r.edge],dash)}${line(170,colors[r.edge],dash)}${center}</svg>`;
  }
  function addRoadReference(data){
    const host=document.getElementById('road-lines');if(!host)return;
    const box=document.createElement('div');box.className='learn-road-reference';
    box.innerHTML=`<h3>16 сравнений разметки</h3><p>Схемы показывают цвет и расположение линий. Ширина штриха здесь условная; сравнивай с панорамой и соседними признаками.</p><div class="learn-road-grid">${data.roads.map(r=>`<article class="learn-road-card">${roadSVG(r)}<div><h4>${escape(r.title)}</h4><p>${escape(r.fact)}</p><p class="learn-check">${escape(r.check)}</p></div></article>`).join('')}</div><div class="learn-real-roads"><figure><img src="./assets/texas-hill-country.jpg" loading="lazy" alt="Реальная дорога в Texas Hill Country, жёлтый центр и белые края"><figcaption>Техас: реальный пример жёлтого центра; цвет не уникален</figcaption></figure><figure><img src="./assets/swiss-yellow-crossing.jpg" loading="lazy" alt="Жёлтый пешеходный переход в Швейцарии"><figcaption>Швейцария: жёлтая зебра; также встречается в Лихтенштейне</figcaption></figure></div><p class="learn-source-note"><a href="${data.sources.openRoads}" target="_blank" rel="noopener">Гайд OpenGuessr о линиях</a> · <a href="${data.sources.reference}" target="_blank" rel="noopener">Дополнительные страновые примеры Plonk It</a></p>`;
    host.append(box);
    const roads=document.getElementById('roads');if(roads){
      const surfaces=document.createElement('div');surfaces.className='learn-surface-reference';
      surfaces.innerHTML='<h3>Покрытие: только дополнительная проверка</h3><div class="learn-surface-grid"><article><h4>Бетонные плиты</h4><p>Филиппины, Таиланд, Боливия и другие страны. Проверяй язык, движение и транспорт.</p></article><article><h4>Кирпич и булыжник</h4><p>Кирпичные улицы поддерживают Нидерланды; особые ряды булыжника помогают Боливии. Материал сам не уникален.</p></article><article><h4>Зернистый асфальт</h4><p>Полезен в сочетаниях для Турции и некоторых штатов США. Один рисунок асфальта не даёт страну.</p></article><article><h4>Гравий, грунт и красная почва</h4><p>Указывают на условия и регион. Встречаются в Америке, Африке, Австралии и на островах.</p></article></div><div class="learn-real-roads"><figure><img src="./assets/nl-brick-street.jpg" loading="lazy" alt="Кирпичная улица в Нидерландах"><figcaption>Нидерланды: кирпичная улица · <a href="https://commons.wikimedia.org/wiki/File:Netherlands,_Makkinga,_Brink_(1).jpg" target="_blank" rel="noopener">Vincent van Zeijst</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> · уменьшено</figcaption></figure><figure><img src="./assets/brazil-red-soil.jpg" loading="lazy" alt="Примеры красной почвы у дороги в Бразилии"><figcaption>Бразилия: красная почва поддерживает другие признаки · <a href="https://www.plonkit.net/brazil" target="_blank" rel="noopener">Plonk It</a></figcaption></figure></div>';
      roads.append(surfaces);
    }
  }
  function signFamily(c){
    const yellowTriangle=new Set(['sweden','finland','iceland','poland','greece']);
    const diamond=new Set(['united-states','canada','mexico','brazil','chile','colombia','ecuador','peru','bolivia','uruguay','argentina','australia','new-zealand','ireland','texas','alaska','hawaii','thailand']);
    if(yellowTriangle.has(c.id))return '<svg viewBox="0 0 120 100" aria-label="Схема семейства предупреждающих знаков" role="img"><path d="M60 10L110 90H10Z" fill="#ffdc61" stroke="#e85d59" stroke-width="8"/><text x="60" y="75" text-anchor="middle" fill="#17232e" font-size="40">!</text></svg><small>Общая форма; не уникальна</small>';
    if(diamond.has(c.id))return '<svg viewBox="0 0 120 100" aria-label="Схема жёлтого ромба" role="img"><path d="M60 5L105 50L60 95L15 50Z" fill="#ffdc61" stroke="#17232e" stroke-width="4"/><text x="60" y="65" text-anchor="middle" fill="#17232e" font-size="40">!</text></svg><small>Общая форма; не уникальна</small>';
    return '<div class="learn-sign-text-icon" aria-hidden="true">↗</div><small>Читай текст и сравнивай детали</small>';
  }
  function addSignsAtlas(list){
    const host=document.getElementById('signs');if(!host)return;
    const box=document.createElement('div');box.className='learn-sign-reference';
    box.innerHTML=`<h3>Знаки по ${list.length} странам, территориям и регионам</h3><p>Форма знака часто общая для группы. Название маршрута, надпись, фон, внешняя кайма и стойка проверяются вместе. Фото — реальные примеры; схемы отдельно подписаны.</p><label>Найти страну или надпись<input id="signAtlasSearch" type="search" placeholder="Швейцария, MAXIMUM, ALTO, кайма…"></label><p id="signAtlasCount" role="status"></p><div class="learn-sign-grid" id="signAtlasGrid"></div>`;
    host.append(box);
    const render=()=>{
      const query=document.getElementById('signAtlasSearch').value;
      const filtered=list.filter(c=>normalize(c.name+' '+c.signs+' '+c.infrastructure).includes(normalize(query)));
      document.getElementById('signAtlasCount').textContent=`${filtered.length} записей`;
      document.getElementById('signAtlasGrid').innerHTML=filtered.map(c=>`<article class="learn-sign-card"><h4>${flag(c)}${escape(c.name)}</h4>${c.photo?.category==='signs'?photo(c):`<div class="learn-sign-scheme">${signFamily(c)}</div>`}<p>${escape(c.signs)}</p><p class="learn-check">${escape(c.infrastructure)}</p><details><summary>Чем подтвердить</summary><p>${escape(c.strong)}</p><p>${escape(c.confusions)}</p>${source(c)}</details></article>`).join('')||'<p>Не найдено. Попробуй другое слово.</p>';
    };
    document.getElementById('signAtlasSearch').addEventListener('input',render);render();
  }
  function buildStudy(data,list,byId,main){
    const deck=[];
    for(const c of list){
      deck.push({id:c.id+'-strong',country:c.id,region:c.region,kind:'strong',field:'strong',question:c.strong,answer:c.name,check:c.confusions});
      for(const key of Object.keys(fields))deck.push({id:c.id+'-'+key,country:c.id,region:c.region,kind:'narrow',field:key,question:c[key],answer:`Возможный кандидат: ${c.name}`,check:`Этот признак проверяй в связке: ${c.strong}. ${c.confusions}`});
    }
    data.shared.forEach((c,i)=>deck.push({id:'group-'+i,country:'group',region:'all',kind:'narrow',field:'group',question:c.clue,answer:c.candidates,check:c.check}));
    const sec=makeSection('study-cards','Карточки для запоминания',`${deck.length} карточек: сильная связка для каждой страны, отдельные признаки по категориям и общие группы. Ответ скрыт, пока не нажмёшь «Показать».`);
    sec.innerHTML+=`<div class="learn-tools"><label>Тип<select id="studyKind"><option value="all">Все карточки</option><option value="strong">Сильные связки</option><option value="narrow">Только сужение</option></select></label><label>Категория<select id="studyField"><option value="all">Все признаки</option><option value="strong">Связка признаков</option>${Object.entries(fields).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}<option value="group">Общие группы</option></select></label><label>Страна / регион<select id="studyCountry"><option value="all">Все страны</option><option value="group">Общие группы</option>${list.map(c=>`<option value="${c.id}">${escape(c.name)}</option>`).join('')}</select></label><label>Повторение<select id="studyMode"><option value="all">Вся колода</option><option value="review">Ещё не знаю</option></select></label></div><div class="study-toolbar"><span id="studyProgress" role="status"></span><button id="studyShuffle" class="learn-action">Перемешать</button><button id="studyClear" class="learn-action">Сбросить прогресс</button></div><article class="study-card"><span class="study-kind" id="studyBadge"></span><h3 id="studyPrompt"></h3><div id="studyAnswer" hidden></div><button id="studyReveal" class="learn-primary">Показать ответ</button></article><div class="study-actions"><button id="studyPrev" class="learn-action">← Назад</button><button id="studyAgain" class="learn-action">Повторить</button><button id="studyKnow" class="learn-primary">Знаю ✓</button><button id="studyNext" class="learn-action">Дальше →</button></div><p class="learn-source-note">Прогресс сохраняется в этом браузере. Карточка «сужение» специально не обещает единственную страну. Для сложного похожего случая проверяй оригинальный гайд.</p>`;
    main.append(sec);
    let known=new Set();try{known=new Set(JSON.parse(localStorage.getItem('geoguessr-learn-known-v1')||'[]'));}catch{}
    let filtered=[],index=0,revealed=false;
    const el=id=>document.getElementById(id);
    const persist=()=>{try{localStorage.setItem('geoguessr-learn-known-v1',JSON.stringify([...known]));}catch{}};
    function render(){
      const c=filtered[index];revealed=false;el('studyAnswer').hidden=true;el('studyAnswer').innerHTML='';
      el('studyProgress').textContent=`${filtered.length?index+1:0} / ${filtered.length} в колоде · знаю ${deck.filter(c=>known.has(c.id)).length} / ${deck.length}`;
      el('studyReveal').hidden=!c;el('studyBadge').textContent=c?(c.kind==='strong'?'Сильная связка':'Только сужение'):'Пустая колода';
      el('studyBadge').className='study-kind '+(c?.kind||'');
      el('studyPrompt').textContent=c?c.question:'Карточек с такими фильтрами нет. Измени фильтр или выбери всю колоду.';
      for(const id of ['studyPrev','studyNext'])el(id).disabled=!c;
      el('studyAgain').disabled=true;el('studyKnow').disabled=true;
    }
    function filter(){
      const kind=el('studyKind').value,field=el('studyField').value,country=el('studyCountry').value,mode=el('studyMode').value;
      filtered=deck.filter(c=>(kind==='all'||c.kind===kind)&&(field==='all'||c.field===field)&&(country==='all'||c.country===country)&&(mode==='all'||!known.has(c.id)));index=0;render();
    }
    for(const id of ['studyKind','studyField','studyCountry','studyMode'])el(id).addEventListener('change',filter);
    el('studyReveal').addEventListener('click',()=>{
      const c=filtered[index];if(!c)return;revealed=true;
      const country=byId.get(c.country);
      el('studyAnswer').innerHTML=`<h4>${escape(c.answer)}</h4><p>${escape(c.check)}</p>${country?source(country):''}`;
      el('studyAnswer').hidden=false;el('studyReveal').hidden=true;el('studyAgain').disabled=false;el('studyKnow').disabled=false;
    });
    el('studyNext').addEventListener('click',()=>{if(filtered.length){index=(index+1)%filtered.length;render();}});
    el('studyPrev').addEventListener('click',()=>{if(filtered.length){index=(index-1+filtered.length)%filtered.length;render();}});
    el('studyKnow').addEventListener('click',()=>{if(!revealed)return;known.add(filtered[index].id);persist();if(el('studyMode').value==='review'){filtered.splice(index,1);index=filtered.length?index%filtered.length:0;}else index=(index+1)%filtered.length;render();});
    el('studyAgain').addEventListener('click',()=>{if(!revealed)return;known.delete(filtered[index].id);persist();const [card]=filtered.splice(index,1);filtered.push(card);index=filtered.length?index%filtered.length:0;render();});
    el('studyShuffle').addEventListener('click',()=>{for(let i=filtered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[filtered[i],filtered[j]]=[filtered[j],filtered[i]];}index=0;render();});
    el('studyClear').addEventListener('click',()=>{known.clear();persist();filter();});filter();
  }
})();
