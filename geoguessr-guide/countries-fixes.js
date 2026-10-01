Object.assign(pairNotes,{
 'indonesia|malaysia':'Обе страны ездят слева и используют слова вроде jalan. Номер: Malaysia чаще 2 светлых blur-кластера, Indonesia 3. Malaysia обычно ухоженнее по дорожной инфраструктуре; Indonesia чаще плотнее, хаотичнее и мотоциклетнее.',
 'finland|sweden':'Sweden: short dashed outer lines, blue-yellow chevrons, германский язык. Finland: длинные финские слова с двойными гласными, чаще solid outer lines, очень много озёр.',
 'norway|sweden':'Norway: жёлто-оранжевый центр и драматичные горы/фьорды. Sweden: центр чаще белый, short outer dashes, blue-yellow chevrons.',
 'portugal|spain':'Слова: CALLE → Spain, RUA → Portugal. Portuguese: ã/õ/ç/lh/nh; Spanish: ñ. Португалия часто даёт cobblestone sidewalks.',
 'ireland|uk':'Обе страны ездят слева. UK: задний номер жёлтый. Ireland: белые EU-номера и часто жёлтые outer edge lines.',
 'croatia|slovenia':'Словения чаще более альпийская/лесистая и аккуратная. Хорватия: ć/đ/Hrvatska, red-brick architecture, blue hydrants, Adriatic karst.'
});
document.getElementById('pairGrid').innerHTML=quickPairs.map(([a,b])=>{const A=byKey(a),B=byKey(b);return `<article class="country-card"><div class="country-head"><img src="${flag(A)}"><img src="${flag(B)}"><div><h3>${A.name} ↔ ${B.name}</h3></div></div><div class="country-body"><p>${pairNotes[pairKey(a,b)]||''}</p><button class="compare-btn pair-btn" data-a="${a}" data-b="${b}">Открыть сравнение</button></div></article>`}).join('');
document.querySelectorAll('.pair-btn').forEach(b=>b.onclick=()=>{selA.value=b.dataset.a;selB.value=b.dataset.b;renderCompare();document.getElementById('compare').scrollIntoView({behavior:'smooth'})});