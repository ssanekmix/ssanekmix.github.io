(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const API = 'https://api.opendota.com/api';
  const CACHE_MS = 6 * 60 * 60 * 1000;
  const MAX_ENEMIES = 5;
  const ROLE_NAMES = {'1':'Керри','2':'Мид','3':'Оффлейн','4':'Саппорт','5':'Фулл-саппорт'};
  // Explicit pools prevent a generic "Carry" tag from treating every hero as a safe pos 1.
  // These are eligibility filters, NOT measured role-specific win rates.
  const POOLS = {
    '1': "Anti-Mage|Bloodseeker|Chaos Knight|Clinkz|Drow Ranger|Faceless Void|Gyrocopter|Juggernaut|Lifestealer|Luna|Medusa|Morphling|Naga Siren|Phantom Assassin|Phantom Lancer|Razor|Riki|Slark|Spectre|Sven|Terrorblade|Troll Warlord|Ursa|Weaver|Wraith King|Muerta|Kez|Alchemist|Monkey King|Lone Druid|Sniper|Templar Assassin|Nature's Prophet|Arc Warden|Shadow Fiend",
    '2': "Puck|Ember Spirit|Storm Spirit|Void Spirit|Queen of Pain|Invoker|Shadow Fiend|Templar Assassin|Lina|Zeus|Sniper|Leshrac|Huskar|Tiny|Kunkka|Dragon Knight|Death Prophet|Primal Beast|Earth Spirit|Visage|Pangolier|Monkey King|Broodmother|Meepo|Tinker|Outworld Destroyer|Necrophos|Razor|Viper|Windranger|Keeper of the Light|Clinkz",
    '3': "Axe|Night Stalker|Tidehunter|Mars|Beastmaster|Bristleback|Centaur Warrunner|Legion Commander|Slardar|Underlord|Doom|Timbersaw|Dark Seer|Enigma|Pangolier|Sand King|Primal Beast|Dragon Knight|Dawnbreaker|Magnus|Brewmaster|Lycan|Broodmother|Abaddon|Bounty Hunter|Omniknight|Visage|Viper|Wraith King|Razor|Necrophos|Death Prophet|Kunkka|Nature's Prophet|Spirit Breaker|Tusk",
    '4': "Tusk|Earth Spirit|Rubick|Hoodwink|Marci|Dark Willow|Phoenix|Bounty Hunter|Nyx Assassin|Spirit Breaker|Mirana|Tiny|Pudge|Earthshaker|Techies|Snapfire|Disruptor|Clockwerk|Skywrath Mage|Vengeful Spirit|Windranger|Silencer|Zeus|Enigma|Muerta|Monkey King|Weaver|Enchantress|Batrider|Shadow Demon|Riki|Lina|Keeper of the Light",
    '5': "Crystal Maiden|Witch Doctor|Lion|Shadow Shaman|Warlock|Dazzle|Oracle|Abaddon|Jakiro|Ogre Magi|Treant Protector|Undying|Chen|Enchantress|Lich|Ancient Apparition|Disruptor|Grimstroke|Bane|Venomancer|Winter Wyvern|Shadow Demon|Vengeful Spirit|Silencer|Omniknight|Io|Keeper of the Light|Phoenix|Rubick|Snapfire|Pugna|Hoodwink|Elder Titan"
  };
  const state = {heroes: [], byName: new Map(), selected: [], role: '1', busy: false, request: 0};
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
  const portrait = (hero) => 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/' + encodeURIComponent(hero.slug) + '.png';
  const selectedHeroes = () => state.selected.map(id => state.heroes.find(h => h.id === id)).filter(Boolean);

  function loadStored() {
    try {
      const saved = JSON.parse(localStorage.getItem('dota-draft-selection-v1') || '{}');
      state.role = '1'; // Always start on carry unless the user explicitly picks another role this session.
      state.selected = Array.isArray(saved.enemies) ? saved.enemies.filter(x => Number.isInteger(x)).slice(0,MAX_ENEMIES) : [];
    } catch (_) {}
  }
  function persist() {
    try { localStorage.setItem('dota-draft-selection-v1',JSON.stringify({role:state.role,enemies:state.selected})); } catch (_) {}
  }
  function setStatus(message, type) {
    const e=$('status');e.textContent=message;e.className='status'+(type?' '+type:'');e.classList.remove('hidden');
  }
  function clearResults(message) {
    ++state.request; // Ignore an older response after the draft or role changes.
    $('results').innerHTML='';
    $('resultCount').textContent='';
    $('badResults').innerHTML='';
    $('badSection').classList.add('hidden');
    $('sources').classList.add('hidden');
    $('resultHeading').textContent='Твой следующий пик';
    setStatus(message || 'Выбери врагов и нажми «Подобрать контрпики».');
  }
  function renderSlots() {
    const selected=selectedHeroes();
    $('enemySlots').innerHTML=Array.from({length:MAX_ENEMIES},(_,i)=>{
      const h=selected[i];
      return h
        ? '<button type="button" class="enemy-slot chosen" data-remove="'+h.id+'" title="Убрать '+esc(h.localized_name)+'"><img src="'+portrait(h)+'" alt=""><span>'+esc(h.localized_name)+'</span><b aria-hidden="true">×</b></button>'
        : '<div class="enemy-slot empty"><span class="plus">+</span><small>Враг '+(i+1)+'</small></div>';
    }).join('');
    $('recommendBtn').disabled=state.selected.length===0||state.busy;
    $('heroSearch').disabled=selected.length===MAX_ENEMIES;
    $('heroSearch').placeholder=selected.length===MAX_ENEMIES?'Все 5 врагов указаны':'Night Stalker, Venomancer, Puck...';
    [...$('roles').querySelectorAll('button')].forEach(b=>b.classList.toggle('active',b.dataset.role===state.role));
    persist();
  }
  function renderPicker() {
    const query=$('heroSearch').value.trim().toLowerCase();
    const heroes=state.heroes.filter(h=>!state.selected.includes(h.id) && (!query||h.localized_name.toLowerCase().includes(query)));
    const visible=heroes.slice(0,query?36:28);
    if(state.selected.length>=MAX_ENEMIES) {
      $('heroPicker').innerHTML='<div class="picker-placeholder">Все пять слотов заняты. Убери героя, чтобы заменить его.</div>';
      return;
    }
    $('heroPicker').innerHTML=visible.length?visible.map(h =>
      '<button type="button" class="picker-hero" data-add="'+h.id+'" title="Добавить '+esc(h.localized_name)+'"><img loading="lazy" src="'+portrait(h)+'" alt=""><span>'+esc(h.localized_name)+'</span><span class="pick-plus">+</span></button>'
    ).join(''):'<div class="picker-placeholder">Герои не найдены.</div>';
  }
  function select(id) {
    if(state.selected.includes(id)||state.selected.length>=MAX_ENEMIES)return;
    if(!state.heroes.some(h=>h.id===id))return;
    state.selected.push(id);$('heroSearch').value='';
    renderSlots();renderPicker();clearResults('Драфт изменён. Нажми «Подобрать контрпики», чтобы пересчитать результаты.');
    $('heroSearch').focus();
  }
  function getCache(key) {
    try {
      const result=JSON.parse(localStorage.getItem(key)||'null');
      if(result && Date.now()-result.time<CACHE_MS && Array.isArray(result.data))return result.data;
    } catch (_) {}
    return null;
  }
  function putCache(key,data) {
    try { localStorage.setItem(key,JSON.stringify({time:Date.now(),data})); } catch (_) {}
  }
  async function fetchMatchups(heroId) {
    const key='dota-draft-matchups-'+heroId;
    const cached=getCache(key);if(cached)return cached;
    const response=await fetch(API+'/heroes/'+heroId+'/matchups',{headers:{'Accept':'application/json'}});
    if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json();
    if(!Array.isArray(data)||!data.some(x=>Number.isFinite(Number(x.games_played))))throw Error('Некорректный ответ API');
    putCache(key,data);
    return data;
  }
  function eligibleHeroes() {
    const pool=new Set(POOLS[state.role].split('|'));
    return state.heroes.filter(h=>pool.has(h.localized_name)&&!state.selected.includes(h.id));
  }
  function ranking(rows, enemies, missing) {
    // API endpoint is called for the ENEMY. Its "wins" are enemy wins.
    // Therefore candidate win fraction = (games_played - wins) / games_played.
    return eligibleHeroes().map(hero=>{
      const pairs=enemies.flatMap(enemy=>{
        const all=rows.get(enemy.id);
        const item=all?.find(x=>Number(x.hero_id)===hero.id);
        if(!item)return [];
        const games=Number(item.games_played),wins=Number(item.wins);
        if(!Number.isFinite(games)||games<50||!Number.isFinite(wins)||wins<0||wins>games)return [];
        const rate=100*(games-wins)/games;
        // Shrink noisy small samples toward 50%, used only for sorting.
        const adjusted=100*(games-wins+250)/(games+500);
        return [{enemy,rate,adjusted,games}];
      });
      if(!pairs.length)return null;
      const mean=pairs.reduce((total,x)=>total+x.adjusted,0)/pairs.length;
      const worst=Math.min(...pairs.map(x=>x.adjusted));
      const score=mean-.35*Math.max(0,50-worst);
      return {hero,pairs,mean,score,worst,complete:pairs.length===enemies.length};
    }).filter(Boolean).sort((a,b)=>{
      return Number(b.complete)-Number(a.complete)||b.score-a.score||b.pairs.length-a.pairs.length;
    });
  }
  function pairHTML(pair) {
    const tone=pair.rate>=52?'positive':pair.rate<=48?'negative':'neutral';
    return '<div class="matchup '+tone+'"><span><img src="'+portrait(pair.enemy)+'" alt="">'+esc(pair.enemy.localized_name)+'</span><div><strong>'+pair.rate.toFixed(1)+'%</strong><small>'+fmt(pair.games)+' игр</small></div></div>';
  }
  function gameplayNotes(hero, enemies) {
    const has=(name)=>enemies.some(e=>e.localized_name===name);
    const ns=has('Night Stalker'), veno=has('Venomancer');
    const name=hero.localized_name;
    if(!ns && !veno)return '';
    const notes=[];
    if(ns){
      if(name==='Lifestealer')notes.push('Риск против Night Stalker: под Crippling Fear нельзя нажать Rage. Нужна заранее активированная защита или предмет.');
      if(name==='Juggernaut')notes.push('Риск против Night Stalker: под Crippling Fear нельзя нажать Blade Fury. Крутилка не спасает, если сайленс уже наложен.');
      if(name==='Terrorblade')notes.push('Сильная сторона против NS — иллюзии и заранее включённая Metamorphosis. Но Sunder под сайленсом не сработает.');
      if(name==='Naga Siren')notes.push('Иллюзии позволяют давить карту без постоянного присутствия главного героя в радиусе сайленса NS; Song of the Siren под сайленсом не нажать.');
      if(name==='Phantom Lancer')notes.push('Иллюзии продолжают сражаться под сайленсом, но Doppelganger нельзя нажать, если NS уже подошёл.');
    }
    if(veno){
      if(name==='Naga Siren')notes.push('Venomancer умеет замедлять и травить иллюзии; не считай матчап автоматически выигранным.');
      if(name==='Phantom Lancer')notes.push('Против Venomancer полезен долгий бой иллюзиями, но DoT и замедления опасны для настоящего героя.');
    }
    return notes.length?'<div class="gameplay-note"><strong>Механика матча · не часть статистики</strong><span>'+esc(notes.join(' '))+'</span></div>':'';
  }
  function resultCard(entry,index) {
    const avg=entry.pairs.reduce((s,p)=>s+p.rate,0)/entry.pairs.length;
    const complete=entry.complete;
    return '<article class="result-card">'+
      '<div class="result-top"><div class="candidate"><span class="place">'+String(index+1).padStart(2,'0')+'</span><img src="'+portrait(entry.hero)+'" alt=""><div><h3>'+esc(entry.hero.localized_name)+'</h3><span>'+ROLE_NAMES[state.role]+'</span></div></div>'+
      '<div class="average"><strong>'+avg.toFixed(1)+'%</strong><span>среднее по парам</span></div></div>'+
      '<div class="matchups">'+entry.pairs.map(pairHTML).join('')+'</div>'+
      gameplayNotes(entry.hero, state.selected.map(id=>state.heroes.find(h=>h.id===id)).filter(Boolean))+
      '<p class="readout">'+(complete ? 'Учтены все указанные враги.' : 'Часть матчапов отсутствует — результат предварительный.')+
      ' Доля побед в отдельных матчапах, не прогноз для общего драфта.</p>'+
      '</article>';
  }
  function badCard(e) {
    const avg=e.pairs.reduce((s,p)=>s+p.rate,0)/e.pairs.length;
    return '<div class="bad-card"><img src="'+portrait(e.hero)+'" alt=""><span>'+esc(e.hero.localized_name)+'</span><strong>'+avg.toFixed(1)+'%</strong></div>';
  }
  async function recommend() {
    if(!state.selected.length||state.busy)return;
    const serial=++state.request;
    const enemies=selectedHeroes();
    const role=state.role;
    state.busy=true;renderSlots();
    $('recommendBtn').textContent='Загружаю реальные матчапы...';
    $('results').innerHTML='';$('badSection').classList.add('hidden');$('sources').classList.add('hidden');
    $('resultHeading').textContent='Контрпики · '+ROLE_NAMES[role];
    setStatus('Получаю результаты матчей против '+enemies.map(x=>x.localized_name).join(', ')+'…','loading');
    try {
      const outcomes=await Promise.allSettled(enemies.map(e=>fetchMatchups(e.id)));
      if(serial!==state.request)return;
      const available=new Map(),missing=[];
      outcomes.forEach((out,i)=>{
        if(out.status==='fulfilled')available.set(enemies[i].id,out.value);
        else missing.push(enemies[i].localized_name);
      });
      if(!available.size)throw Error('OpenDota не ответил ни по одному герою. Проверь доступ к api.opendota.com или попробуй позже. Не рисую фиктивный рейтинг.');
      const sorted=ranking(available,enemies,missing);
      if(!sorted.length)throw Error('Недостаточно реальных парных матчапов для выбранной позиции.');
      const positives=sorted.slice(0,10);
      $('results').innerHTML=positives.map(resultCard).join('');
      $('resultCount').textContent=positives.length+' вариантов';
      const shown=new Set(positives.map(x=>x.hero.id));
      const risk=sorted.filter(e=>e.complete&&e.score<50&&!shown.has(e.hero.id)).sort((a,b)=>a.score-b.score).slice(0,5);
      if(risk.length){
        $('badResults').innerHTML=risk.map(badCard).join('');
        $('badSection').classList.remove('hidden');
      }
      $('sources').classList.remove('hidden');
      if(missing.length)setStatus('Частичные данные: не удалось получить статистику против '+missing.join(', ')+'. Эти матчи не учтены.','warning');
      else $('status').classList.add('hidden');
    } catch(err) {
      setStatus('Ошибка: '+(err?.message||String(err)),'error');
      $('resultCount').textContent='Нет данных';
    } finally {
      state.busy=false;renderSlots();$('recommendBtn').innerHTML='Подобрать контрпики <span aria-hidden="true">→</span>';
    }
  }
  function wireEvents() {
    $('heroSearch').addEventListener('input',renderPicker);
    $('heroSearch').addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        const first=$('heroPicker').querySelector('[data-add]');
        if(first){e.preventDefault();select(Number(first.dataset.add));}
      }
    });
    $('heroPicker').addEventListener('click',e=>{
      const btn=e.target.closest('[data-add]');if(btn)select(Number(btn.dataset.add));
    });
    $('enemySlots').addEventListener('click',e=>{
      const btn=e.target.closest('[data-remove]');if(!btn)return;
      state.selected=state.selected.filter(id=>id!==Number(btn.dataset.remove));
      renderSlots();renderPicker();clearResults('Драфт изменён. Пересчитай рекомендации.');
    });
    $('roles').addEventListener('click',e=>{
      const btn=e.target.closest('[data-role]');if(!btn)return;
      state.role=btn.dataset.role;renderSlots();clearResults('Позиция изменена. Пересчитай рекомендации.');
    });
    $('clearBtn').addEventListener('click',()=>{
      state.selected=[];$('heroSearch').value='';renderSlots();renderPicker();clearResults();
    });
    $('exampleBtn').addEventListener('click',()=>{
      const names=['Night Stalker','Venomancer'];
      state.selected=names.map(name=>state.byName.get(name)?.id).filter(Boolean);
      $('heroSearch').value='';renderSlots();renderPicker();clearResults('Пример выбран: Night Stalker + Venomancer. Нажми «Подобрать контрпики».');
    });
    $('recommendBtn').addEventListener('click',recommend);
  }
  async function init() {
    wireEvents();loadStored();
    setStatus('Загружаю каталог героев…','loading');
    try {
      const response=await fetch('./data/heroes.json');
      if(!response.ok)throw Error('HTTP '+response.status);
      const heroes=await response.json();
      if(!Array.isArray(heroes)||heroes.length<100)throw Error('Каталог неполный');
      state.heroes=heroes.filter(h=>h.id&&h.slug&&h.localized_name).sort((a,b)=>a.localized_name.localeCompare(b.localized_name));
      state.byName=new Map(state.heroes.map(h=>[h.localized_name,h]));
      const ids=new Set(state.heroes.map(h=>h.id));
      state.selected=[...new Set(state.selected)].filter(id=>ids.has(id));
      renderSlots();renderPicker();clearResults('Выбери открытых героев врага. Можно начать с готового примера Night Stalker + Venomancer.');
    } catch(err) {
      setStatus('Не удалось загрузить каталог героев: '+(err?.message||String(err)),'error');
    }
  }
  init();
})();