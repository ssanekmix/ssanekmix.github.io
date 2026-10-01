document.addEventListener('DOMContentLoaded',()=>{
  const carImages=[
    ['Кения — snorkel / pickup','https://pbs.twimg.com/media/F0b_hgYWwAA6FOK.jpg','Реальный вид: snorkel торчит справа от капота внизу кадра.'],
    ['Гана — black tape на roof rack','https://mapsensei.com/images/countries/ghana/ghana_11.webp','Реальный close-up вариантов tape на roof rack.'],
    ['Кыргызстан — roof rack + зеркала','https://images.squarespace-cdn.com/content/v1/60f6054f4e76b03092956de8/ae13ce92-eb82-4966-b618-c9eff9344205/Just_look_at_the_mirror_V8_too_many.png?format=2500w','Реальный референс зеркала/машины из покрытия Кыргызстана.'],
    ['Нигерия — pickup + follow/police car','https://mapsensei.com/images/countries/nigeria/nigeria_27.webp','Реальные варианты follow/police cars по регионам Нигерии.']
  ];
  document.querySelectorAll('.car-card').forEach(card=>{
    const title=card.querySelector('h3')?.textContent.trim();
    const found=carImages.find(x=>x[0]===title);
    if(!found)return;
    const shot=card.querySelector('.car-shot');
    shot.innerHTML=`<img src="${found[1]}" alt="${found[0]}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">`;
    const body=card.querySelector('.card-body');
    const note=document.createElement('p');note.className='no-water';note.textContent=found[2];body.insertBefore(note,body.querySelector('ul'));
  });

  const special=[
    ['🇹🇼 Тайвань','Бетонный столб; длинные чёрно-жёлто/оранжевые диагональные полосы идут почти до земли. Под углом ищи именно длинный полосатый участок.'],
    ['🇰🇪 Кения','Деревянные или бетонные столбы; очень типичен L-образный crossbar. Сильнее вместе с yellow center + white edges и Kenya car.'],
    ['🇲🇽 Мексика','Часто встречаются восьмигранные concrete/metal poles. Если силуэт явно многогранный, добавляй Mexico в кандидаты, но подтверждай Spanish/дорогой.'],
    ['🇬🇷 Греция','Greek harp pole: верх похож на «арфу»/развилку с изоляторами. Хороший инфраструктурный clue рядом с греческим текстом.'],
    ['🇿🇦 ЮАР','Bird pole: изоляторы сверху выглядят как белые «птички». Вместе с жёлтыми внешними линиями очень полезно.'],
    ['🇵🇭 Филиппины','Часты восьмигранные металлические/бетонные столбы. В городе соединяй с бетонными плитами дороги и English/Filipino.'],
    ['🇦🇷 Аргентина','Double concrete pole: две параллельные бетонные стойки с перемычками. Силуэт читается даже издалека.'],
    ['🇯🇵 Япония','Очень плотные электрические столбы с множеством проводов/трансформаторов прямо в городе; сами по себе не уникальны, но с японским текстом и low cam отлично подтверждают.']
  ];
  const host=document.querySelector('#poleGrid');
  if(host){
    const h=document.createElement('h3');h.className='subhead';h.textContent='Другие узнаваемые столбы';host.insertAdjacentElement('afterend',h);
    const g=document.createElement('div');g.className='grid g4';g.innerHTML=special.map(x=>`<article class="card"><div class="card-body"><h3>${x[0]}</h3><p>${x[1]}</p></div></article>`).join('');h.insertAdjacentElement('afterend',g);
  }
});