/* Страница матча (футбол): блок «Сравнение команд» (владелец 13.11, по образцу хоккейного assets/mc.js).
   Данные — football/data/football-club.js (таблица чемпионата: игры, голы, очки; raw[2] — очки за игру в последних 5, raw[3] / raw[4] — дома / в гостях).
   Подключает assets/nav.js на страницах /epl/…, /laliga/… и других футбольных; пересборка страниц не нужна.
   Еврокубки: клубы из разных лиг — у каждого показатели и место в своём чемпионате. */
(()=>{
const hero=document.querySelector('main>.mx-hero');if(!hero||document.querySelector('.mx-cmp'))return;
const ids=[...hero.querySelectorAll('img[src*="/fc/"]')].map(i=>decodeURIComponent((/\/fc\/([^/.]+)\.webp/.exec(i.getAttribute('src'))||[])[1]||'')).filter((v,i,a)=>v&&a.indexOf(v)===i);
if(ids.length<2)return;
const base=(document.querySelector('script[src*="assets/nav.js"]')||{}).src||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* еврокубок (владелец 24.11): у обеих команд показатели одного турнира, переключатель «ЛЧ / ЛЕ» ↔ «Чемпионаты».
   Таблицы — F.tables[лига] (место, игры, В-Н-П, голы, очки); форма и дом/выезд (raw) — только для основной лиги клуба. */
const CUP=(/\/(ucl|uel)\//.exec(location.pathname)||[])[1]||'';
let MODE=CUP||'dom';
const go=()=>{
 const F=window.JV_FOOT||{},TT=F.teams||{},LG=F.leagues||{},TB=F.tables||{},H0=TT[ids[0]],A0=TT[ids[1]];
 if(!H0||!A0)return;
 const DOM=['epl','laliga','seriea','bundesliga','ligue1','rpl'];
 const lnOf=l=>{const x=LG[l]||{};return x.short||x.name||l};
 /* строка турнира для клуба: таблица лиги + raw, если это основная лига клуба */
 const st=(id,t,lg)=>{const r=(TB[lg]||[]).find(x=>x.id===id);if(!r||!r.gp)return null;return {...r,n:t.n,lg,raw:t.lg===lg?t.raw:null}};
 const pick=(id,t)=>MODE==='dom'?(DOM.includes(t.lg)?st(id,t,t.lg):null):st(id,t,MODE);
 const H=pick(ids[0],H0),A=pick(ids[1],A0);
 const one=H&&A&&H.lg===A.lg;
 const pool=t=>(TB[t.lg]||[]).filter(x=>x.gp);
 const f=(v,d)=>v==null?'—':(+v).toFixed(d).replace('.',',');
 const pg=k=>t=>t[k]/t.gp;
 const M=[
  ['Забивает за игру',pg('gf'),pg('gf'),2,0,1],
  ['Пропускает за игру',pg('ga'),pg('ga'),2,1,1],
  ['Очки за игру',pg('pts'),pg('pts'),2,0,1],
  ['Форма: очки за игру в последних 5',t=>t.raw&&t.raw[2],t=>t.raw&&t.raw[2],2,0,1],
  ['Очки за игру: хозяева дома, гости в гостях',t=>t.raw&&t.raw[3],t=>t.raw&&t.raw[4],2,0,0]];
 const rank=(t,get,low)=>{const v=get(t);return 1+pool(t).filter(x=>{const y=get(x);return y!=null&&(low?y<v:y>v)}).length};
 const rows=H&&A?M.map(([n,gh,ga,d,low,rk])=>{const a=gh(H),b=ga(A);if(a==null||b==null)return'';
  const wa=low?b:a,wb=low?a:b,sh=wa+wb>0?Math.max(18,Math.min(82,100*wa/(wa+wb))):50;
  const win=a===b?0:(low?a<b:a>b)?1:2;
  const r=(t,get)=>rk&&t.raw!==undefined?`<small>${rank(t,get,low)}-е ${one?'место':'· '+esc(lnOf(t.lg))}</small>`:'';
  return `<div class="mc-row${win===1?' wh':win===2?' wa':''}" role="row"><b class="mc-v h" role="cell">${f(a,d)}${r(H,gh)}</b><span class="mc-n" role="rowheader">${n}</span><b class="mc-v a" role="cell">${f(b,d)}${r(A,ga)}</b>
   <span class="mc-bar" aria-hidden="true"><i style="width:${sh.toFixed(1)}%"></i><i></i></span></div>`}).join(''):'';
 const miss=[[H0,H],[A0,A]].filter(x=>!x[1]).map(x=>x[0].n);
 const rec=t=>t?`${t.place}-е место · ${t.w}–${t.d}–${t.l}`:'нет данных';
 const em=id=>`<img src="${base.replace(/nav\.js.*$/,'')}fc/${encodeURIComponent(id)}.webp" alt="" width="40" height="40" loading="lazy">`;
 const mid=MODE==='dom'?(one?'Сезон '+esc(lnOf(H.lg)):'Сезон в чемпионатах'):esc(lnOf(MODE))+' · общий этап';
 const sw=CUP?`<div class="mc-sw" role="tablist" aria-label="Турнир">${[[CUP,(LG[CUP]||{}).name||lnOf(CUP)],['dom','Чемпионаты']].map(([k,t])=>`<button type="button" role="tab" data-m="${k}" aria-selected="${k===MODE}">${esc(t)}</button>`).join('')}</div>`:'';
 const note=MODE!=='dom'?`Показатели в ${({ucl:'Лиге чемпионов',uel:'Лиге Европы'})[MODE]||'турнире'} этого сезона, место — среди ${pool({lg:MODE}).length} клубов общего этапа.`
  :one?`Показатели чемпионата, место — среди ${pool(H).length} клубов ${esc(lnOf(H.lg))}.`:H&&A?`Показатели в своих чемпионатах: ${esc(H0.n)} — ${esc(lnOf(H.lg))}, ${esc(A0.n)} — ${esc(lnOf(A.lg))}.`:'';
 let sec=document.querySelector('.mx-cmp');
 if(!sec){sec=document.createElement('section');sec.className='fc-sec mx-cmp';sec.setAttribute('aria-labelledby','mt-cmp');
  const after=document.getElementById('mt-form');const ref=after?after.closest('section'):document.querySelector('main>.mx-info');
  if(ref)ref.after(sec);else document.getElementById('main').appendChild(sec);
  sec.addEventListener('click',e=>{const b=e.target.closest('.mc-sw button');if(!b||b.dataset.m===MODE)return;MODE=b.dataset.m;go()})}
 if(!rows&&!CUP){sec.remove();return}
 sec.innerHTML=`<div class="wrap"><h2 id="mt-cmp">Сравнение команд</h2>${sw}
  <div class="mc" role="table" aria-label="Показатели сезона: ${esc(H0.n)} и ${esc(A0.n)}">
   <div class="mc-head" role="row"><span class="h" role="columnheader">${em(ids[0])}<b>${esc(H0.n)}</b><small>${rec(H)}</small></span><span class="mid" role="columnheader">${mid}</span><span class="a" role="columnheader"><small>${rec(A)}</small><b>${esc(A0.n)}</b>${em(ids[1])}</span></div>
   ${rows||''}
  </div>
  ${miss.length?`<p class="mc-note">Чемпионат клуба «${esc(miss.join('», «'))}» мы пока не собираем — показатели появятся, когда добавим эту лигу.</p>`:''}
  ${note?`<p class="mc-note">${note} Рядом с названием клуба — место в таблице и победы–ничьи–поражения.</p>`:''}</div>`;
};
if(window.JV_FOOT)go();else{const s=document.createElement('script');s.src=base.replace(/assets\/nav\.js.*$/,'football/data/football-club.js');s.onload=go;document.head.appendChild(s)}
})();
