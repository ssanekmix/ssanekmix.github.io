(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const CDN = 'https://cdn.cloudflare.steamstatic.com';
  const API = 'https://api.opendota.com/api/heroStats';
  const HERO_CATALOG = './data/heroes.json';
  const ITEM_CATALOG = './data/items.json';
  let itemCatalog = [];

  const S = {
    heroes: [],
    map: new Map(),
    draft: [],
    teamSide: 'left',
    targetIndex: null,
    refs: null,
    img: null,
  };

  const FALL = [
    ['Luna','luna'],['Slark','slark'],['Tusk','tusk'],['Warlock','warlock'],['Dazzle','dazzle'],['Dawnbreaker','dawnbreaker'],
    ['Puck','puck'],['Axe','axe'],['Hoodwink','hoodwink'],['Oracle','oracle'],['Juggernaut','juggernaut'],
    ['Phantom Assassin','phantom_assassin'],['Drow Ranger','drow_ranger'],['Faceless Void','faceless_void'],['Sven','sven'],
    ['Ursa','ursa'],['Medusa','medusa'],['Morphling','morphling'],['Anti-Mage','antimage'],['Sniper','sniper'],['Invoker','invoker'],
    ['Pudge','pudge'],['Lion','lion'],['Rubick','rubick'],['Shadow Fiend','nevermore'],['Windranger','windrunner'],
    ['Wraith King','skeleton_king'],['Spectre','spectre'],['Lifestealer','life_stealer'],['Troll Warlord','troll_warlord'],
    ['Monkey King','monkey_king'],['Templar Assassin','templar_assassin'],['Spirit Breaker','spirit_breaker'],['Storm Spirit','storm_spirit'],
    ['Crystal Maiden','crystal_maiden'],['Earthshaker','earthshaker'],['Sand King','sand_king'],['Underlord','abyssal_underlord'],
    ['Phoenix','phoenix'],['Magnus','magnataur'],['Mars','mars'],['Night Stalker','night_stalker'],['Razor','razor'],['Viper','viper'],
    ['Zeus','zuus'],['Bane','bane'],['Disruptor','disruptor'],['Doom','doom_bringer'],['Legion Commander','legion_commander'],['Enigma','enigma']
  ].map((x, i) => ({ id: 900 + i, localized_name: x[0], slug: x[1], roles: [], primary_attr: null }));

  const hImg = (h) => `${CDN}/apps/dota2/images/dota_react/heroes/${h.slug}.png`;

  const I = {
    'Power Treads':'power_treads','Phase Boots':'phase_boots','Mask of Madness':'mask_of_madness','Manta Style':'manta',
    'Black King Bar':'black_king_bar','Hurricane Pike':'hurricane_pike','Butterfly':'butterfly','Satanic':'satanic',
    'Eye of Skadi':'skadi','Daedalus':'greater_crit','Monkey King Bar':'monkey_king_bar','Linken’s Sphere':'sphere',
    'Silver Edge':'silver_edge','Nullifier':'nullifier','Mage Slayer':'mage_slayer','Shiva’s Guard':'shivas_guard',
    'Pipe of Insight':'pipe','Crimson Guard':'crimson_guard','Lotus Orb':'lotus_orb','Force Staff':'force_staff',
    'Glimmer Cape':'glimmer_cape','Ghost Scepter':'ghost','Aeon Disk':'aeon_disk','Mjollnir':'mjollnir',
    'Abyssal Blade':'abyssal_blade','Sange and Yasha':'sange_and_yasha','Blink Dagger':'blink','Scythe of Vyse':'sheepstick',
    'Desolator':'desolator','Battle Fury':'bfury','Maelstrom':'maelstrom','Diffusal Blade':'diffusal_blade'
  };

  const iImg = (n) => `${CDN}/apps/dota2/images/dota_react/items/${I[n] || n.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'_')}.png`;

  const T = {
    'Slark':['gap','right','sustain','leash','dispel'],'Tusk':['gap','disable','physical'],'Warlock':['teamfight','magic','disable','summons'],
    'Dazzle':['heal','save','sustain'],'Dawnbreaker':['gap','disable','heal','physical'],'Puck':['silence','disable','elusive','magic'],
    'Axe':['disable','physical','gap'],'Hoodwink':['disable','physical','range'],'Oracle':['heal','save','dispel'],
    'Juggernaut':['right','physical'],'Phantom Assassin':['right','physical','gap','evasion'],'Drow Ranger':['right','silence','range'],
    'Faceless Void':['disable','teamfight','right'],'Sven':['right','physical','disable'],'Ursa':['right','physical','gap'],
    'Medusa':['right','teamfight','range'],'Morphling':['right','sustain','elusive'],'Anti-Mage':['gap','right','mana'],
    'Sniper':['right','range','physical'],'Invoker':['disable','magic','silence'],'Pudge':['disable','magic','single'],
    'Lion':['disable','magic','single'],'Rubick':['disable','magic'],'Shadow Fiend':['physical','magic','right'],
    'Windranger':['evasion','right','disable'],'Wraith King':['right','sustain','disable'],'Spectre':['gap','right','sustain'],
    'Lifestealer':['right','sustain'],'Troll Warlord':['right','physical','root'],'Monkey King':['gap','right','teamfight'],
    'Templar Assassin':['right','physical'],'Spirit Breaker':['gap','disable','physical'],'Storm Spirit':['gap','magic','disable','elusive'],
    'Crystal Maiden':['disable','magic','root'],'Earthshaker':['disable','teamfight','magic'],'Sand King':['disable','magic','teamfight'],
    'Underlord':['root','magic','teamfight'],'Phoenix':['magic','heal','teamfight'],'Magnus':['disable','teamfight'],
    'Mars':['disable','teamfight','physical'],'Night Stalker':['silence','gap','physical'],'Razor':['right','sustain'],'Viper':['magic','slow'],
    'Zeus':['magic'],'Bane':['single','disable'],'Disruptor':['silence','disable','magic'],'Doom':['single','disable'],
    'Legion Commander':['single','disable','physical'],'Enigma':['disable','teamfight']
  };

  const BASE = {
    'Luna':['Power Treads','Mask of Madness','Manta Style'],'Drow Ranger':['Power Treads','Hurricane Pike','Manta Style'],
    'Phantom Assassin':['Power Treads','Battle Fury','Black King Bar'],'Juggernaut':['Phase Boots','Manta Style'],
    'Slark':['Power Treads','Diffusal Blade'],'Faceless Void':['Power Treads','Maelstrom'],'Sven':['Power Treads','Black King Bar'],
    'Ursa':['Phase Boots','Diffusal Blade','Black King Bar'],'Anti-Mage':['Power Treads','Battle Fury','Manta Style'],
    'Sniper':['Power Treads','Hurricane Pike'],'Templar Assassin':['Power Treads','Desolator']
  };

  const R = {
    'Black King Bar':{disable:5,magic:4,silence:4,root:3},'Hurricane Pike':{gap:4,leash:3,right:1},
    'Manta Style':{silence:4,root:3,slow:2,single:1},'Butterfly':{right:3,physical:2},'Satanic':{physical:3,right:2,teamfight:1},
    'Eye of Skadi':{sustain:4,heal:4,gap:2},'Monkey King Bar':{evasion:8},'Linken’s Sphere':{single:6},'Silver Edge':{sustain:2},
    'Nullifier':{save:4,heal:2},'Mage Slayer':{magic:4},'Daedalus':{physical:1},'Shiva’s Guard':{sustain:3,heal:3,right:2,summons:1},
    'Pipe of Insight':{magic:4,teamfight:1},'Crimson Guard':{summons:5,right:1},'Lotus Orb':{single:4,disable:2},
    'Force Staff':{gap:4,leash:2,root:2},'Glimmer Cape':{magic:3},'Ghost Scepter':{right:5,physical:4},
    'Aeon Disk':{physical:4,magic:4,single:2},'Mjollnir':{summons:4},'Abyssal Blade':{elusive:3},'Sange and Yasha':{disable:1,physical:1}
  };

  const pools = {
    1:['Black King Bar','Hurricane Pike','Manta Style','Butterfly','Satanic','Eye of Skadi','Monkey King Bar','Linken’s Sphere','Silver Edge','Nullifier','Mage Slayer','Daedalus','Abyssal Blade','Mjollnir','Sange and Yasha'],
    2:['Black King Bar','Linken’s Sphere','Scythe of Vyse','Hurricane Pike','Manta Style','Mage Slayer','Nullifier','Shiva’s Guard'],
    3:['Black King Bar','Pipe of Insight','Crimson Guard','Shiva’s Guard','Lotus Orb','Blink Dagger'],
    4:['Force Staff','Glimmer Cape','Lotus Orb','Pipe of Insight','Ghost Scepter','Aeon Disk'],
    5:['Force Staff','Glimmer Cape','Lotus Orb','Pipe of Insight','Ghost Scepter','Aeon Disk']
  };

  const esc = (s) => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  async function loadHeroes() {
    let a = [];
    try {
      const r = await fetch(HERO_CATALOG);
      if (!r.ok) throw Error('catalog');
      a = await r.json();
    } catch {
      try {
        const r = await fetch(API);
        if (!r.ok) throw Error('network');
        a = (await r.json()).map(x => ({
          id:x.id, localized_name:x.localized_name,
          slug:x.name.replace('npc_dota_hero_',''), roles:x.roles || [], primary_attr:x.primary_attr || null
        }));
      } catch { a = FALL; }
    }
    try {
      const r = await fetch(ITEM_CATALOG);
      if(r.ok) itemCatalog = await r.json();
    } catch {}
    a.sort((x,y) => x.localized_name.localeCompare(y.localized_name));
    S.heroes = a;
    S.map = new Map(a.map(h => [h.localized_name, h]));
    grid('');
    updateHeroSelect();
  }

  function status(t, k='') {
    const e = $('recognitionStatus');
    if (!t) { e.className = 'status hidden'; return; }
    e.className = 'status ' + k;
    e.textContent = t;
  }

  function prog(x) {
    const e = $('recognitionProgress');
    if (x == null) { e.classList.add('hidden'); return; }
    e.classList.remove('hidden');
    e.firstElementChild.style.width = x + '%';
  }

  function setupEvents() {
    const dz = $('dropZone');
    dz.onclick = () => $('fileInput').click();
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag'); };
    dz.ondragleave = () => dz.classList.remove('drag');
    dz.ondrop = e => {
      e.preventDefault(); dz.classList.remove('drag');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };
    $('fileInput').onchange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };
    document.addEventListener('paste', e => {
      const f = [...(e.clipboardData?.files || [])].find(x => x.type.startsWith('image/'));
      if (f) handleFile(f);
    });

    $('clearImageBtn').onclick = clear;
    $('demoBtn').onclick = demo;
    $('myHeroSelect').onchange = updateBuildButton;
    $('positionSelect').onchange = updateBuildButton;
    $('buildBtn').onclick = build;
    $('dialogClose').onclick = () => $('heroDialog').close();
    $('heroSearch').oninput = e => grid(e.target.value);

    $('teamSideTabs').onclick = e => {
      const b = e.target.closest('button[data-side]');
      if (!b) return;
      S.teamSide = b.dataset.side;
      [...$('teamSideTabs').children].forEach(x => x.classList.toggle('active', x === b));
      updateHeroSelect();
      updateBuildButton();
    };
  }

  async function handleFile(f) {
    if (!['image/png','image/jpeg','image/webp'].includes(f.type)) {
      status('Нужен PNG, JPG или WebP.', 'error');
      return;
    }
    const u = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      S.img = im;
      $('previewImage').src = u;
      $('previewWrap').classList.remove('hidden');
      recognize();
    };
    im.onerror = () => status('Не получилось прочитать картинку.', 'error');
    im.src = u;
  }

  function clear() {
    S.img = null;
    S.draft = [];
    $('previewWrap').classList.add('hidden');
    $('draftEditor').classList.add('hidden');
    status('');
    prog(null);
    updateHeroSelect();
    updateBuildButton();
  }

  function load(src, cors=true) {
    return new Promise((res, rej) => {
      const i = new Image();
      if (cors) i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  }

  function feat(img, sx=0, sy=0, sw=img.width, sh=img.height) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 10;
    const x = c.getContext('2d', {willReadFrequently:true});
    x.drawImage(img, sx, sy, sw, sh, 0, 0, 16, 10);
    const d = x.getImageData(0,0,16,10).data;
    const v = [];
    let m = 0;
    for (let i=0;i<d.length;i+=4) m += (d[i]+d[i+1]+d[i+2])/3;
    m /= 160;
    let n = 0;
    for (let i=0;i<d.length;i+=4) {
      const y = ((d[i]+d[i+1]+d[i+2])/3 - m)/128;
      v.push(y); n += y*y;
    }
    n = Math.sqrt(n) || 1;
    return v.map(z => z/n);
  }

  const cos = (a,b) => a.reduce((s,x,i) => s + x*b[i], 0);


  async function refs() {
    if (S.refs) return S.refs;
    status('Загружаю эталонные изображения из Dota...');
    const response=await fetch('./data/portrait-features.json?v=2',{cache:'no-store'});
    if(!response.ok)throw Error('Нет файла эталонов: HTTP '+response.status);
    const data=await response.json();
    const byId=new Map(S.heroes.map(h=>[h.id,h]));
    const out=data.features.map(x=>({...x,h:byId.get(x.id)})).filter(x=>x.h);
    if(new Set(out.map(x=>x.id)).size<110)throw Error('Недостаточно HUD-портретов');
    S.refs=out;
    return out;
  }

  function fastCos(a,b) {
    if(!a||!b)return -1;
    let sum=0;
    for(let i=0;i<a.length;i++)sum+=a[i]*b[i];
    return sum;
  }

  function colorFeat(img,sx,sy,sw,sh) {
    const c=document.createElement('canvas');
    c.width=16;c.height=10;
    const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,sx,sy,sw,sh,0,0,16,10);
    const d=x.getImageData(0,0,16,10).data;
    const means=[0,0,0],v=[];
    let saturation=0;
    for(let i=0;i<d.length;i+=4){
      const r=d[i],g=d[i+1],b=d[i+2];
      means[0]+=r/160; means[1]+=g/160; means[2]+=b/160;
      saturation+=Math.max(r,g,b)-Math.min(r,g,b);
    }
    for(let i=0;i<d.length;i+=4)
      for(let j=0;j<3;j++)v.push((d[i+j]-means[j])/128);
    const norm=Math.sqrt(v.reduce((sum,x)=>sum+x*x,0))||1;
    return {value:v.map(x=>x/norm),colorful:saturation/160>22};
  }

  function matchPortrait(gray,color,refs) {
    const scores=new Map();
    for(const ref of refs){
      const gs=Math.max(fastCos(gray,ref.gray||ref.f),fastCos(gray,ref.gray_center||ref.center||ref.f));
      let s=gs;
      if(color?.colorful&&ref.rgb){
        const rgb=Math.max(fastCos(color.value,ref.rgb),fastCos(color.value,ref.rgb_center));
        s=gs*.62+rgb*.38;
      }
      const old=scores.get(ref.h.id);
      if(!old||old.s<s)scores.set(ref.h.id,{h:ref.h,s});
    }
    return [...scores.values()].sort((a,b)=>b.s-a.s).slice(0,8);
  }

  function groupLayout(img,refs,side) {
    const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
    const starts=side==='left'?[.005,.025,.04,.055,.075]:[.55,.58,.605,.63,.655];
    const widths=[.30,.33,.35,.38,.41];
    const ys=[.16,.22,.27,.32];
    const hs=[.24,.31,.38,.46];
    let winner=null;
    for(const start of starts)for(const width of widths){
      if(start+width>1)continue;
      for(const yStart of ys)for(const height of hs) {
        if(yStart+height>1)continue;
        const opts=[];
        for(let i=0;i<5;i++) {
          const slotW=width*w/5;
          const gray=feat(img,(start+i*width/5)*w+slotW*.055,yStart*h,slotW*.89,height*h);
          opts.push(matchPortrait(gray,null,refs));
        }
        const distinct=new Set(opts.map(o=>o[0]?.h.id)).size;
        const score=opts.reduce((sum,o)=>sum+(o[0]?.s||0)+.15*Math.max(0,(o[0]?.s||0)-(o[1]?.s||0)),0)-(5-distinct)*.13;
        if(!winner||score>winner.score)winner={start,width,yStart,height,score};
      }
    }
    return winner;
  }

  function recognizeGroup(img,refs,layout) {
    const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
    return Array.from({length:5},(_,i)=>{
      const cellW=layout.width*w/5;
      const x=(layout.start+i*layout.width/5)*w+cellW*.055;
      const y=layout.yStart*h,sw=cellW*.89,sh=layout.height*h;
      return matchPortrait(feat(img,x,y,sw,sh),colorFeat(img,x,y,sw,sh),refs);
    });
  }

  async function recognize() {
    try {
      prog(3);
      const reference=await refs();
      status('Нахожу портреты в двух пятёрках...');
      await new Promise(resolve=>setTimeout(resolve,0));
      const left=groupLayout(S.img,reference,'left');
      prog(50);
      await new Promise(resolve=>setTimeout(resolve,0));
      const right=groupLayout(S.img,reference,'right');
      prog(90);
      const options=[...recognizeGroup(S.img,reference,left),...recognizeGroup(S.img,reference,right)];
      const order=options.map((o,i)=>({i,margin:(o[0]?.s||0)-(o[1]?.s||0)})).sort((a,b)=>b.margin-a.margin);
      const used=new Set(),draft=Array(10);
      for(const {i} of order){
        const opts=options[i];
        const best=opts.find(x=>!used.has(x.h.id))||opts[0];
        if(!best)continue;
        used.add(best.h.id);
        const runner=opts.find(x=>x.h.id!==best.h.id);
        draft[i]={hero:best.h,confidence:0,uncertain:best.s<.54||best.s-(runner?.s||0)<.075};
      }
      S.draft=draft;
      renderDraft();
      const uncertain=draft.filter(x=>!x||x.uncertain).length;
      status(uncertain ? 'Портреты найдены, но '+uncertain+' из 10 нужно проверить. Нажми на ошибочные карточки.' : 'Портреты определены. Проверь их перед подбором билда.',uncertain?'':'good');
      prog(null);
    } catch(err) {
      status('Ошибка распознавания: '+(err?.message||String(err)),'error');
      S.draft=Array.from({length:10},()=>({hero:null,confidence:0}));
      renderDraft();
      prog(null);
    }
  }

  function renderDraft() {
    const root = $('draftSlots');
    root.innerHTML = '';
    for (let i=0;i<10;i++) {
      const e = S.draft[i] || {hero:null, confidence:0};
      const b = document.createElement('button');
      b.className = 'hero-slot';
      if (i === 5) b.classList.add('team-split');
      b.innerHTML = e.hero
        ? `<img src="${hImg(e.hero)}" alt=""><span class="confidence">${e.uncertain ? 'проверить' : 'найдено'}</span><div class="hero-name">${esc(e.hero.localized_name)}</div>`
        : '<div style="aspect-ratio:16/9;display:grid;place-items:center;color:#68717b;font-size:20px">+</div><div class="hero-name">Выбрать</div>';
      b.onclick = () => openHeroDialog(i);
      root.appendChild(b);
    }
    $('draftEditor').classList.remove('hidden');
    updateHeroSelect();
    updateBuildButton();
  }

  function openHeroDialog(i) {
    S.targetIndex = i;
    $('heroSearch').value = '';
    grid('');
    $('heroDialog').showModal();
  }

  function grid(q) {
    q = (q || '').toLowerCase();
    const root = $('heroGrid');
    root.innerHTML = '';
    S.heroes.filter(h => !q || h.localized_name.toLowerCase().includes(q)).slice(0,100).forEach(h => {
      const b = document.createElement('button');
      b.className = 'hero-choice';
      b.innerHTML = `<img loading="lazy" src="${hImg(h)}" alt=""><span>${esc(h.localized_name)}</span>`;
      b.onclick = () => {
        if (S.targetIndex == null) return;
        S.draft[S.targetIndex] = {hero:h, confidence:100};
        $('heroDialog').close();
        renderDraft();
      };
      root.appendChild(b);
    });
  }

  function ownEntries() {
    if (S.draft.length !== 10) return [];
    return S.teamSide === 'left' ? S.draft.slice(0,5) : S.draft.slice(5,10);
  }

  function enemyEntries() {
    if (S.draft.length !== 10) return [];
    return S.teamSide === 'left' ? S.draft.slice(5,10) : S.draft.slice(0,5);
  }

  function updateHeroSelect() {
    const sel = $('myHeroSelect');
    const own = ownEntries().map(x => x?.hero).filter(Boolean);
    const previous = sel.value;

    if (!own.length) {
      sel.disabled = true;
      sel.innerHTML = '<option value="">Сначала распознай 10 героев</option>';
      $('heroSelectHint').textContent = 'После распознавания здесь будут только герои твоей команды из этого скрина.';
      return;
    }

    sel.disabled = false;
    sel.innerHTML = '<option value="">Выбери своего героя</option>' + own.map(h => `<option value="${esc(h.localized_name)}">${esc(h.localized_name)}</option>`).join('');
    if (own.some(h => h.localized_name === previous)) sel.value = previous;
    else sel.value = '';

    $('heroSelectHint').textContent = S.teamSide === 'left'
      ? 'В списке только 5 героев из левой половины скрина.'
      : 'В списке только 5 героев из правой половины скрина.';
  }

  function demo() {
    const names = ['Luna','Puck','Axe','Hoodwink','Oracle','Slark','Tusk','Warlock','Dazzle','Dawnbreaker'];
    S.draft = names.map(n => ({hero:S.map.get(n) || FALL.find(h => h.localized_name === n), confidence:100}));
    S.teamSide = 'left';
    [...$('teamSideTabs').children].forEach(x => x.classList.toggle('active', x.dataset.side === 'left'));
    renderDraft();
    $('myHeroSelect').value = 'Luna';
    status('Пример загружен: твоя команда слева.', 'good');
    updateBuildButton();
  }

  const enemyNames = () => enemyEntries().map(x => x?.hero?.localized_name).filter(Boolean);

  function updateBuildButton() {
    const validDraft = S.draft.length === 10 && S.draft.every(x => x?.hero);
    $('buildBtn').disabled = !(validDraft && $('myHeroSelect').value && enemyNames().length === 5);
  }

  function counts(es) {
    const m = new Map();
    es.forEach(n => (T[n] || []).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return m;
  }

  const namesWithTag = (es,t) => es.filter(n => (T[n] || []).includes(t));
  const fm = (a) => a.slice(0,3).join(', ') + (a.length > 3 ? ' и др.' : '');

  function score(item,c,pos,gs) {
    let s = .5;
    for (const [t,w] of Object.entries(R[item] || {})) s += (c.get(t) || 0) * w;
    if (gs === 'behind' && ['Black King Bar','Hurricane Pike','Satanic','Linken’s Sphere','Force Staff','Glimmer Cape','Ghost Scepter','Aeon Disk'].includes(item)) s += 2;
    if (pos >= 4 && ['Force Staff','Glimmer Cape','Lotus Orb','Pipe of Insight','Ghost Scepter','Aeon Disk'].includes(item)) s += 2;
    return s;
  }

  function why(it, es) {
    const magic = namesWithTag(es,'magic'), dis = namesWithTag(es,'disable'), gap = namesWithTag(es,'gap');
    const heal = namesWithTag(es,'heal').concat(namesWithTag(es,'sustain'));
    const right = namesWithTag(es,'right').concat(namesWithTag(es,'physical'));
    const single = namesWithTag(es,'single');

    if (it === 'Black King Bar') return `Нужен, чтобы нормально драться против ${fm([...new Set([...dis,...magic])]) || 'контроля и магии'}.`;
    if (it === 'Hurricane Pike') return `Даёт дистанцию против ${fm(gap) || 'мобильных мили-героев'} и помогает не стоять у них под лицом.`;
    if (it === 'Manta Style') return 'Темп, статы и dispel части неприятных эффектов. Не заменяет BKB против жёсткого контроля.';
    if (it === 'Butterfly') return `Сильна против физического урона ${fm(right) || 'с руки'}, пока у врага нет надёжной точности.`;
    if (it === 'Satanic') return 'Большой запас HP и возможность отхилиться после фокуса в длинной драке.';
    if (it === 'Eye of Skadi') return `Режет восстановление у ${fm(heal) || 'живучих целей'} и помогает держать дистанцию.`;
    if (it === 'Linken’s Sphere') return `Полезна против опасных одиночных кнопок ${fm(single)}.`;
    if (it === 'Mage Slayer') return `Снижает давление от магического урона ${fm(magic)}.`;
    if (it === 'Pipe of Insight') return `Командная защита против магии ${fm(magic)}.`;
    if (it === 'Lotus Orb') return `Dispel и ответ на таргет-контроль ${fm(single.length ? single : dis)}.`;
    if (it === 'Force Staff') return `Помогает разрывать дистанцию с ${fm(gap)}.`;
    if (it === 'Glimmer Cape') return `Дешёвая защита от spell-фокуса ${fm(magic)}.`;
    if (it === 'Ghost Scepter') return `Спасает от правого клика ${fm(right)}.`;
    if (it === 'Nullifier') return 'Ситуативно против активных сейвов/бафов, но не универсальная кнопка против каждой save-способности.';
    if (it === 'Daedalus') return 'Чистый урон — хорош после того, как уже решена проблема выживаемости.';
    return 'Ситуативный слот под этот тип драки.';
  }

  const roleTypes = {
    1:{tempo:3,damage:3,survival:1,initiation:0},
    2:{tempo:2,damage:2,survival:1,initiation:1},
    3:{tempo:1,damage:1,survival:2,initiation:3},
    4:{tempo:0,damage:0,survival:2,initiation:2},
    5:{tempo:0,damage:0,survival:3,initiation:1},
  };
  const DEFENSIVE = new Set(['black_king_bar','mage_slayer','sange_and_yasha','sphere','lotus_orb','pipe','crimson_guard','aeon_disk','glimmer_cape','force_staff','ghost','eternal_shroud','shivas_guard','blade_mail']);
  const DAMAGE = new Set(['manta','butterfly','skadi','greater_crit','monkey_king_bar','diffusal_blade','disperser','mjollnir','desolator','silver_edge','abyssal_blade','satanic','daedalus','radiance','battlefury','bfury','orchid','bloodthorn','armlet','dragon_lance','hurricane_pike','khanda','phylactery']);
  const INITIATION = new Set(['blink','overwhelming_blink','swift_blink','arcane_blink','harpoon','force_staff','shivas_guard']);
  const EXCLUDE = new Set(['recipe','tpscroll','ward_observer','ward_sentry','dust','smoke_of_deceit','tango','clarity','flask','enchanted_mango','branches','faerie_fire','blood_grenade','quelling_blade','magic_stick','magic_wand','bottle','circlet','gauntlets','slippers','mantle','iron_branch','wind_lace','infused_raindrop','gem','cheese','aegis','refresher_shard','neutral_token','moon_shard']);
  const EQUIPMENT = new Set(['boots','phase_boots','power_treads','travel_boots','travel_boots_2','arcane_boots','tranquil_boots','guardian_greaves']);
  const STAGES = ['early_game_items','mid_game_items','late_game_items'];

  async function livePopularity(heroId) {
    const url='https://api.opendota.com/api/heroes/'+heroId+'/itemPopularity';
    const response=await fetch(url,{headers:{Accept:'application/json'}});
    if(!response.ok) throw Error('OpenDota HTTP '+response.status);
    const result=await response.json();
    if(!result||!STAGES.some(stage=>result[stage]&&typeof result[stage]==='object')) throw Error('Пустые данные');
    return result;
  }
  function itemInfo(key) { return itemCatalog.find(it=>it.key===key); }
  function getExisting() {
    const raw=$('currentItemsInput').value.toLowerCase().split(/[,;]+/).map(x=>x.trim()).filter(Boolean);
    return new Set(raw.map(t=>itemCatalog.find(i=>i.name.toLowerCase()===t||i.key===t)?.key||t.replaceAll(' ','_')));
  }
  function chooseBuild(data,position,hero,enemies) {
    const existing=getExisting(), threats=counts(enemies), weights=roleTypes[position]||roleTypes[1], chosen=[], other=[];
    for(const [stageIndex,stage] of STAGES.entries()) {
      const bucket=data[stage]||{};
      const list=Object.entries(bucket).map(([key,count])=>({
        key,count:Number(count)||0,info:itemInfo(key),stage:stageIndex
      })).filter(x=>x.info&&x.info.cost>=950&&!EXCLUDE.has(x.key)&&!existing.has(x.key));
      list.sort((a,b)=>b.count-a.count);
      const max=list[0]?.count||1;
      for(const entry of list) {
        const {key}=entry;
        const popularity=entry.count/max;
        const defensive=DEFENSIVE.has(key),damage=DAMAGE.has(key),initiation=INITIATION.has(key);
        let value=popularity*8;
        if(position===1&&damage)value+=weights.damage;
        if(position===1&&defensive)value-=3;
        if(position===3&&initiation)value+=weights.initiation;
        if(position>=4&&defensive)value+=weights.survival;
        if(threats.get('disable')>=2&&key==='black_king_bar')value+=3;
        if(threats.get('evasion')&&key==='monkey_king_bar')value+=3;
        if(threats.get('heal')>=2&&key==='skadi')value+=2;
        if(threats.get('magic')>=3&&key==='pipe'&&position===3)value+=3;
        other.push({...entry,value,defensive,damage,initiation});
      }
    }
    other.sort((a,b)=>a.stage-b.stage||b.value-a.value);
    const defLimit=position===1?2:position===2?3:4;
    for(let i=0;i<3;i++) {
      const picks=other.filter(o=>o.stage===i).sort((a,b)=>b.value-a.value);
      for(const candidate of picks) {
        if(chosen.length>=6)break;
        if(chosen.some(o=>o.key===candidate.key))continue;
        if(candidate.defensive&&chosen.filter(o=>o.defensive).length>=defLimit)continue;
        if(EQUIPMENT.has(candidate.key)&&chosen.some(o=>EQUIPMENT.has(o.key)))continue;
        if(position===1&&candidate.defensive&&chosen.length<2&&picks.some(o=>o.damage&&!chosen.some(y=>y.key===o.key)))continue;
        chosen.push(candidate);
        if(chosen.length >= (i===0?2:i===1?4:6))break;
      }
    }
    if(position===1&&!chosen.some(o=>o.damage)){
      const d=other.filter(o=>o.damage).sort((a,b)=>b.value-a.value)[0];
      if(d)chosen.splice(Math.max(0,chosen.length-1),1,d);
    }
    const remaining=other.filter(o=>!chosen.some(c=>c.key===o.key)).sort((a,b)=>b.value-a.value).slice(0,4);
    return {core:chosen,sit:remaining,existing};
  }

  async function build() {
    const es=enemyNames(), heroName=$('myHeroSelect').value;
    const hero=S.map.get(heroName),pos=+$('positionSelect').value;
    if(!hero)return;
    const btn=$('buildBtn');btn.disabled=true;btn.textContent='Загружаю статистику OpenDota...';
    try {
      const data=await livePopularity(hero.id);
      const result=chooseBuild(data,pos,hero,es);
      if(result.core.length<3)throw Error('Недостаточно данных по предметам');
      const clean=x=>x.info.name;
      show({es,hero:heroName,c:counts(es),pos,core:result.core.map(clean),sit:result.sit.map(clean)});
      $('ruleModeBadge').textContent='OpenDota · pro item popularity';
      $('uncertaintyBox').textContent='Основа — популярность предметов в профессиональных матчах OpenDota, не живые матчи Dota2ProTracker. Очерёдность скорректирована под роль и драфт; конкретные похожие матчи и патч этим режимом не проверяются.';
      const src=document.getElementById('sourcesSection');
      if(src)src.innerHTML='<a target="_blank" rel="noopener noreferrer" href="https://www.opendota.com/heroes/'+hero.id+'/items">Предметы OpenDota ↗</a> · <a target="_blank" rel="noopener noreferrer" href="https://dota2protracker.com/hero/'+encodeURIComponent(heroName.toLowerCase().replaceAll(' ','%20'))+'">Проверить D2PT ↗</a>';
      const already=result.existing;
      const next=result.core.find(x=>!already.has(itemCatalog.find(i=>i.name===x)?.key));
      if(next) {
        $('nextItemCard').classList.remove('hidden');
        $('nextItemName').textContent=next;
        $('nextItemIcon').src=iImg(next);
        $('nextItemReason').textContent='Следующий предмет из последовательности на основе статистики.';
      }
    } catch(e) {
      $('emptyResult').classList.remove('hidden');
      $('result').classList.add('hidden');
      status('Не удалось загрузить реальные данные OpenDota: '+e.message+'. Не подменяю их выдуманным билдом.','error');
    } finally {btn.disabled=false;btn.textContent='Подобрать билд';updateBuildButton();}
  }

  function show(d) {
    $('emptyResult').classList.add('hidden');
    $('result').classList.remove('hidden');
    $('resultTitle').textContent = `${d.hero} · против ${d.es.join(', ')}`;

    $('coreBuild').innerHTML = d.core.map((x,i) => `<div class="build-item"><div class="build-card"><img class="item-icon" src="${iImg(x)}" onerror="this.style.display='none'"><div class="txt">${esc(x)}</div></div>${i<d.core.length-1?'<span class="arrow">→</span>':''}</div>`).join('');
    $('coreReasons').innerHTML = d.core.map(x => `<div class="reason"><span class="reason-dot"></span><div><strong>${esc(x)}</strong> — ${esc(why(x,d.es))}</div></div>`).join('');
    $('situational').innerHTML = d.sit.map(x => `<div class="mini-card"><div class="mini-top"><img class="item-icon" src="${iImg(x)}" onerror="this.style.display='none'"><div class="mini-title">${esc(x)}</div></div><div class="condition">Если именно эта проблема мешает в драках</div><p>${esc(why(x,d.es))}</p></div>`).join('');

    const av = [];
    if (score('Black King Bar',d.c,d.pos,'even') > 10) av.push(['Daedalus рано','Сначала переживи контроль/бурст, потом наращивай чистый DPS.']);
    if (!namesWithTag(d.es,'evasion').length) av.push(['Monkey King Bar без причины','В этом драфте нет заметной встроенной проблемы с уклонением.']);
    if (d.es.includes('Dazzle')) av.push(['Nullifier только ради Shallow Grave','Не воспринимай Nullifier как кнопку «снять Grave».']);
    $('avoidList').innerHTML = (av.length ? av : [['Слишком жадный первый слот','Сначала закрой главную угрозу конкретного драфта.']]).map(x => `<div class="reason"><span class="reason-dot" style="background:var(--bad)"></span><div><strong style="color:#f3a0a4">${esc(x[0])}</strong> — ${esc(x[1])}</div></div>`).join('');

    const pats = [['disable','много контроля'],['magic','много магии'],['gap','быстро садятся в упор'],['heal','хил/сейвы'],['right','сильный right-click'],['physical','физический burst'],['silence','silence'],['single','опасные таргет-кнопки'],['evasion','уклонение']];
    $('matchupNotes').innerHTML = pats.filter(([t]) => (d.c.get(t)||0) >= 1).slice(0,7).map(([t,l]) => `<span class="chip">${l}: ${esc(fm(namesWithTag(d.es,t)))}</span>`).join('');

    $('uncertaintyBox').classList.remove('hidden');
    $('uncertaintyBox').textContent = 'Локальный режим не знает текущие предметы врагов и не сверяет патч онлайн. Это приоритет по драфту, а не абсолютная сборка.';

    const cur = $('currentItemsInput').value.trim(), min = $('minuteInput').value.trim();
    if (false && (cur || min)) {
      const n = d.core[0];
      $('nextItemCard').classList.remove('hidden');
      $('nextItemName').textContent = n;
      $('nextItemReason').textContent = why(n,d.es);
      $('nextItemIcon').src = iImg(n);
    } else $('nextItemCard').classList.add('hidden');

    if (innerWidth < 981) $('result').scrollIntoView({behavior:'smooth'});
  }

  async function init() {
    setupEvents();
    await loadHeroes();
  }

  init();
})();