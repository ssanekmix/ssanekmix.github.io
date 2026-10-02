if(document.readyState==='loading'){
  window.addEventListener('load',()=>setTimeout(applyV10,500));
}else{
  setTimeout(applyV10,500);
}

function applyV10(){
  removeDomainsV10();
  openCountriesV10();
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

function openCountriesV10(){
  const grid=document.getElementById('countryGrid');
  if(!grid)return;
  document.getElementById('countryMoreBtn')?.remove();
  [...grid.children].forEach(card=>card.classList.remove('country-v10-hidden'));
}
