window.addEventListener('load',()=>setTimeout(applyV10,4300));

function applyV10(){
  removeDomainsV10();
  collapseCountriesV10();
  retargetCountriesNavV10();
}

function removeDomainsV10(){
  const grid=document.getElementById('domainGrid');
  if(!grid)return;
  const title=grid.previousElementSibling;
  if(title && title.classList.contains('subhead') && /домены сайтов/i.test(title.textContent)) title.remove();
  grid.remove();
}

function retargetCountriesNavV10(){
  document.querySelectorAll('.nav a').forEach(a=>{
    if(a.textContent.trim()==='Страны') a.href='#compare';
  });
}

function collapseCountriesV10(){
  const grid=document.getElementById('countryGrid');
  if(!grid)return;

  let expanded=false;
  let button=document.getElementById('countryMoreBtn');
  if(!button){
    button=document.createElement('button');
    button.id='countryMoreBtn';
    button.type='button';
    button.className='country-more-btn';
    button.textContent='Показать больше';
    grid.insertAdjacentElement('afterend',button);
  }

  const search=document.getElementById('countrySearch');
  const region=document.getElementById('countryRegion');

  const visibleCards=()=>[...grid.children].filter(el=>{
    const s=getComputedStyle(el);
    return s.display!=='none' && !el.hidden;
  });

  const columnCount=()=>{
    const tpl=getComputedStyle(grid).gridTemplateColumns;
    if(!tpl || tpl==='none') return 1;
    const count=tpl.split(' ').filter(Boolean).length;
    return Math.max(1,count);
  };

  const apply=()=>{
    const cards=[...grid.children];
    cards.forEach(c=>c.classList.remove('country-v10-hidden'));

    const filtering=(search && search.value.trim()) || (region && region.value && region.value!=='all' && region.value!=='Все регионы');
    if(filtering){
      button.hidden=true;
      return;
    }

    button.hidden=cards.length<=columnCount();
    if(expanded){
      button.textContent='Скрыть';
      button.setAttribute('aria-expanded','true');
      return;
    }

    const cols=columnCount();
    const currentlyVisible=visibleCards();
    currentlyVisible.forEach((card,i)=>{if(i>=cols) card.classList.add('country-v10-hidden');});
    button.textContent='Показать больше';
    button.setAttribute('aria-expanded','false');
  };

  button.onclick=()=>{expanded=!expanded;apply();};
  search?.addEventListener('input',()=>{expanded=false;setTimeout(apply,0)});
  region?.addEventListener('change',()=>{expanded=false;setTimeout(apply,0)});
  new MutationObserver(()=>setTimeout(apply,0)).observe(grid,{childList:true,subtree:false,attributes:true,attributeFilter:['style','class','hidden']});
  if('ResizeObserver' in window)new ResizeObserver(()=>apply()).observe(grid);
  window.addEventListener('resize',()=>apply(),{passive:true});
  apply();
}
