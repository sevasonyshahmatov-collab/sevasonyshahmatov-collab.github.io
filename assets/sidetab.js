/* JARVIS v3a — таблицы по бокам списка матчей (владелец 21.11). Только на широком экране, где по бокам от списка есть
   свободное поле (от 188 px). Видны всё время, пока человек в разделе матчей: едут за прокруткой (не уходят под шапку)
   и останавливаются в конце списка — дальше («Купон», «Лиги») не идут. Раскрыли матч — таблицы встают вровень с ним.
   Слева — полная таблица лиги: лига раскрытого матча, иначе выбранная вкладка, иначе первого матча в списке
   (хоккей — все клубы лиги по очкам; футбол — таблица чемпионата; еврокубок — чемпионат хозяев). Команды раскрытого
   матча подсвечены, у играющих сегодня — точка.
   Справа — «Форма команд»: по матчам из списка, у каждой команды 5 последних результатов (В / Н / П).
   Данные уже на странице: хоккей — window.JV_TEAMS (teams-lite.js), футбол — window.JV_FOOT и JVF (football-lite.js, foot-kit.js).
   Список — #mlist (hockey/index.html, assets/foot-index.js), строки li.match с .lvslot[data-lv-lg|h|a|t]. */
(()=>{
const FB=document.documentElement.dataset.sport==='football';
const LIST=document.getElementById('mlist');if(!LIST)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const ROOT=new URL('../',(document.currentScript&&document.currentScript.src)||location.href).href;
const LGN={khl:'КХЛ',nhl:'НХЛ',epl:'АПЛ',laliga:'Ла Лига',seriea:'Серия А',bundesliga:'Бундеслига',ligue1:'Лига 1',rpl:'РПЛ',ucl:'Лига чемпионов',uel:'Лига Европы'};
const MINW=188,GAP=14;
const css=`.sdt{position:fixed;z-index:5;width:var(--w,260px);display:flex;flex-direction:column;max-height:var(--mh,80vh);height:var(--mh,auto);padding:12px 8px 8px;border-radius:var(--rc,14px);
 background:rgba(10,16,30,.86);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 18px 44px rgba(0,0,0,.45),inset 0 0 0 1px rgba(160,190,255,.14);
 color:#eef3ff;font:500 12.5px/1.2 var(--text,system-ui);opacity:0;transition:opacity .2s ease;visibility:hidden}
.sdt.on{opacity:1;visibility:visible}
.sdt h4{margin:0 4px 8px;font:800 13px/1.2 var(--display,system-ui);letter-spacing:.04em;text-transform:uppercase;color:rgba(220,230,255,.8);flex:none}
.sdt h4 small{display:block;margin-top:3px;font:500 11px/1.2 var(--text,system-ui);letter-spacing:0;text-transform:none;color:rgba(220,230,255,.55)}
.sdt .sd-sc{flex:1;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;min-height:0}
.sdt table{width:100%;height:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.sdt thead tr{height:1px}
.sdt .sd-sc{transition:opacity .18s ease}.sdt.sw .sd-sc,.sdt.sw h4{opacity:0}
.sdt th{font:700 11px/1 var(--text,system-ui);color:rgba(220,230,255,.55);text-align:center;padding:0 2px 6px;position:sticky;top:0;background:rgba(10,16,30,.96)}
.sdt th:nth-child(3){text-align:left}
.sdt td.m{width:22px;padding-left:0;padding-right:0}
.sdt .sd-mv{display:block;font:800 9.5px/1 var(--text,system-ui);font-style:normal;text-align:left;letter-spacing:-.02em}
.sdt .sd-mv.up{color:#2fd27f}.sdt .sd-mv.dn{color:#ff5a63}
.sdt.w .sd-mv.up{color:#12924f}.sdt.w .sd-mv.dn{color:#d42a35}
.sdt td{padding:4px 2px;text-align:center;border-top:1px solid rgba(160,190,255,.08);white-space:nowrap}
.sdt td.n{width:20px;color:rgba(220,230,255,.6)}
.sdt td.c{text-align:left;max-width:0;width:100%}
.sdt a.sd-cl{color:inherit;text-decoration:none;display:flex;align-items:center;gap:6px;min-width:0}
.sdt a.sd-cl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sdt a.sd-cl:hover span{text-decoration:underline}
.sdt img{width:18px;height:18px;object-fit:contain;flex:none}
.sdt td.p{font-weight:800;width:24px}
.sdt td.g{width:22px;color:rgba(220,230,255,.7)}
.sdt tr.td td.c span::after{content:"";display:inline-block;width:6px;height:6px;margin-left:5px;border-radius:50%;background:#3fd28b;vertical-align:middle}
.sdt tr.me td{background:rgba(255,204,51,.16)}
.sdt tr.me td:first-child{box-shadow:inset 3px 0 0 #ffcc33;color:#fff}
.sdt tr.me td.c{font-weight:800}
.sdt .sd-fm{list-style:none;margin:0;padding:0}
.sdt .sd-fm li{padding:6px 2px;border-top:1px solid rgba(160,190,255,.08)}
.sdt .sd-fm li.me{background:rgba(255,204,51,.12);box-shadow:inset 3px 0 0 #ffcc33}
.sdt .sd-fm time{display:block;margin:0 0 4px 4px;font:700 11px/1 var(--text,system-ui);color:rgba(220,230,255,.55)}
.sdt .sd-fr{display:flex;align-items:center;gap:6px;padding:2px 4px}
.sdt .sd-fr a.sd-cl{flex:1}
.sdt .sd-dt{display:flex;gap:3px;flex:none}
.sdt .sd-dt i{display:grid;place-items:center;width:15px;height:15px;border-radius:4px;font:800 9px/1 var(--text,system-ui);font-style:normal;color:#fff}
.sdt .sd-dt i.w{background:#1f9d5c}.sdt .sd-dt i.l{background:#c8343f}.sdt .sd-dt i.d{background:#7d8798}
.sdt .sd-kp{display:grid;gap:6px;margin:0 2px 10px}
.sdt .sd-kp div{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:10px;background:rgba(160,190,255,.08)}
.sdt .sd-kp b{font:800 20px/1 var(--display,system-ui)}.sdt .sd-kp b small{font:600 12px/1 var(--text,system-ui);opacity:.7}
.sdt .sd-kp span{font-size:11.5px;color:rgba(220,230,255,.62);text-align:right}
.sdt .up{color:#2fd27f}.sdt .dn{color:#ff5a63}
.sdt .sd-lb{margin:10px 4px 6px;font:700 11px/1.2 var(--text,system-ui);letter-spacing:.04em;text-transform:uppercase;color:rgba(220,230,255,.55)}
.sdt .sd-rc{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin:0 2px}
.sdt .sd-rc i{aspect-ratio:1;border-radius:4px}.sdt .sd-rc i.w{background:#1f9d5c}.sdt .sd-rc i.l{background:#c8343f}.sdt .sd-rc i.d{background:#7d8798}
.sdt .sd-mo{display:flex;justify-content:space-between;margin:0 4px;font-size:14px}.sdt .sd-mo b{font-weight:800}.sdt .sd-mo span{font-weight:800}
.sdt .sd-last{display:grid;gap:3px;margin:0 2px;padding:8px 10px;border-radius:10px;background:rgba(160,190,255,.08);color:inherit;text-decoration:none}
.sdt .sd-last span{font-size:12px;color:rgba(220,230,255,.7)}.sdt .sd-last b{font-weight:700}
.sdt .sd-last i{font-style:normal;font-weight:800;font-size:12px}.sdt .sd-last i.w{color:#2fd27f}.sdt .sd-last i.l{color:#ff5a63}
.sdt .sd-all{display:block;margin:12px 2px 4px;padding:9px;border-radius:10px;text-align:center;background:#ffcc33;color:#111;font-weight:800;text-decoration:none}
.sdt .sd-18{margin:6px 4px 0;font-size:10.5px;color:rgba(220,230,255,.5)}
.sdt.w .sd-kp div,.sdt.w .sd-last{background:#f1f4f9}.sdt.w .sd-kp span,.sdt.w .sd-lb,.sdt.w .sd-last span,.sdt.w .sd-18{color:#5b6576}
.sdt.w .up{color:#12924f}.sdt.w .dn{color:#d42a35}
.sdt .sd-v{display:grid;gap:2px;width:100%;margin:0 0 6px;padding:8px 10px;border:0;border-radius:10px;background:rgba(160,190,255,.08);color:inherit;text-align:left;font:inherit;cursor:pointer}
.sdt .sd-v:hover{background:rgba(160,190,255,.16)}
.sdt .sd-v span{font-size:11.5px;color:rgba(220,230,255,.62);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sdt .sd-v b{font-weight:800;font-size:13px}
.sdt .sd-v em{font-style:normal;font-size:11.5px;color:rgba(220,230,255,.8)}.sdt .sd-v em i{font-style:normal;font-weight:800}
.sdt.w .sd-v{background:#f1f4f9}.sdt.w .sd-v:hover{background:#e6ebf3}.sdt.w .sd-v span{color:#5b6576}.sdt.w .sd-v em{color:#2a3446}
.sdt .sd-dots{display:flex;gap:4px;margin-top:6px}.sdt .sd-dots i{width:6px;height:6px;border-radius:50%;background:rgba(220,230,255,.25)}.sdt .sd-dots i.on{background:#ffcc33}
.sdt.w .sd-dots i{background:#d3d9e4}.sdt.w .sd-dots i.on{background:#f2b600}
@media (prefers-reduced-motion:reduce){.sdt{transition:none}}`;
/* вид (владелец 21.11: «в цветах и белую — посмотрю»): ?sdt=1 — тёмная (основная), ?sdt=2 — белая; выбор помнится до закрытия вкладки */
let VIEW='1';try{const v=new URLSearchParams(location.search).get('sdt');if(v==='1'||v==='2')sessionStorage.setItem('jv-sdt',v);VIEW=sessionStorage.getItem('jv-sdt')||'1'}catch(e){}
const css2=`.sdt.w{background:#fff;color:#0b1220;box-shadow:0 18px 44px rgba(0,0,0,.35);-webkit-backdrop-filter:none;backdrop-filter:none}
.sdt.w h4{color:#0b1220}.sdt.w h4 small,.sdt.w th,.sdt.w td.n,.sdt.w td.g,.sdt.w .sd-fm time{color:#5b6576}
.sdt.w th{background:#fff}.sdt.w td,.sdt.w .sd-fm li{border-top-color:#e6eaf1}
.sdt.w tr.me td{background:#fff4cc}.sdt.w tr.me td:first-child{box-shadow:inset 3px 0 0 #f2b600;color:#0b1220}
.sdt.w .sd-fm li.me{background:#fff4cc;box-shadow:inset 3px 0 0 #f2b600}`;
const st=document.createElement('style');st.textContent=css+css2;document.head.appendChild(st);

/* ---- данные ---- */
const HT=()=>((window.JV_TEAMS||{}).teams)||{};
const F=()=>window.JV_FOOT||{};
const name=id=>FB?((F().teams||{})[id]||{}).n||id:(HT()[id]||{}).name||id;
const em=id=>ROOT+(FB?'assets/fc/s/':'assets/em/s/')+id+'.webp';
const href=id=>ROOT+(FB?'football/team.html?id=':'team/index.html?id=')+encodeURIComponent(id);
const club=id=>'<a class="sd-cl" href="'+esc(href(id))+'"><img src="'+esc(em(id))+'" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span>'+esc(name(id))+'</span></a>';
/* таблица + сдвиг места после последнего матча команды (владелец 21.11: «стрелочку зелёную вверх»):
   для каждой команды убираем её последний матч лиги и смотрим, какое место у неё было бы — разница со значком ▲/▼ */
function lastGame(id){
 if(FB){const J=window.JVF;if(!J||!J.gamesOf)return null;return J.gamesOf(id,g=>!g.c)[0]||null}
 const gs=((HT()[id]||{}).games||[]).filter(g=>g.gf!=null&&g.ga!=null).sort((x,y)=>x.d<y.d?1:-1);return gs[0]||null}
const gpts=g=>FB?(g.gf>g.ga?3:g.gf===g.ga?1:0):(g.gf>g.ga?2:g.x?1:0);
const cmp=(a,b)=>(b.pts-a.pts)||(b.w-a.w)||(b.gd-a.gd)||(b.gf-a.gf);
function withMoves(rows){
 /* прошлая таблица: у всех команд убран их последний матч (таблица «тур назад»); сдвиг = место тогда − место сейчас */
 const prev=rows.map(r=>{const g=lastGame(r.id);return g?{id:r.id,pts:r.pts-gpts(g),w:r.w-(g.gf>g.ga?1:0),gd:r.gd-(g.gf-g.ga),gf:r.gf-g.gf}:{id:r.id,pts:r.pts,w:r.w,gd:r.gd,gf:r.gf}}).sort(cmp);
 const pp={};prev.forEach((r,i)=>pp[r.id]=i+1);
 rows.forEach(r=>{r.mv=pp[r.id]?pp[r.id]-r.pl:0});
 return rows}
function table(lg){
 if(FB){const TB=F().tables||{};
  return withMoves((TB[lg]||[]).map(r=>({id:r.id,pl:r.place,gp:r.gp,pts:r.pts,w:r.w||0,gd:(r.gf||0)-(r.ga||0),gf:r.gf||0})))}
 const all=Object.entries(HT()).filter(([,t])=>t.lg===lg&&t.gp!=null).map(([id,t])=>({id,gp:t.gp,pts:t.pts,w:t.w||0,gd:(t.gf||0)-(t.ga||0),gf:t.gf||0}));
 all.sort(cmp);all.forEach((r,i)=>r.pl=i+1);
 return withMoves(all)}
const mvHTML=r=>r.mv>0?'<i class="sd-mv up" title="поднялись на '+r.mv+' после последнего матча">▲'+r.mv+'</i>':r.mv<0?'<i class="sd-mv dn" title="опустились на '+(-r.mv)+' после последнего матча">▼'+(-r.mv)+'</i>':'<i class="sd-mv"></i>';
/* 5 последних результатов, слева старые: 'w' | 'd' | 'l' */
function form(id){
 if(FB){const J=window.JVF;if(!J||!J.gamesOf)return [];return J.gamesOf(id).slice(0,5).reverse().map(g=>g.gf>g.ga?'w':g.gf===g.ga?'d':'l')}
 const T=HT()[id]||{},gs=(T.games||[]).filter(g=>g.gf!=null&&g.ga!=null).sort((x,y)=>x.d<y.d?-1:1);
 if(gs.length)return gs.slice(-5).map(g=>g.gf>g.ga?'w':'l');   /* у НХЛ строки form нет — считаем по матчам */
 return (T.form||'').slice(-5).split('').map(c=>c==='В'?'w':'l')}
const RL={w:'В',d:'Н',l:'П'},RT={w:'победа',d:'ничья',l:'поражение'};
const dots=id=>{const f=form(id);return '<span class="sd-dt" aria-label="форма: '+esc(f.map(x=>RT[x]).join(', ')||'нет данных')+'">'+f.map(x=>'<i class="'+x+'">'+RL[x]+'</i>').join('')+'</span>'};

/* справа — «Честные итоги» прогнозов канала (владелец 21.11: «форма уже внутри карточек, нужно что-то другое»):
   данные window.__RESLITE (data/results-lite.js — уже на странице для полосы итогов) */
const fx=(x,d)=>Number(x).toFixed(d).replace('.',',');
function resultsHTML(){const D=window.__RESLITE;if(!D||!D.sum||!D.sum.total)return '';
 const sp=FB?'football':'hockey',S=D.sum.total[sp]&&D.sum.total[sp].n>=5?D.sum.total[sp]:D.sum.total.all,who=S===D.sum.total.all?'все прогнозы':FB?'футбол':'хоккей';
 const mo=(D.sum.months||[])[0],M=mo&&mo.all,rec=(D.recent||[]).slice(-20);
 const L=(D.last||[]).slice(-1)[0];
 const RS={w:'зашёл',l:'не зашёл',p:'возврат'};
 return '<h4>Честные итоги<small>'+esc(who)+', с '+esc((D.since||'').slice(8,10)+'.'+(D.since||'').slice(5,7))+' · без удалений</small></h4><div class="sd-sc">'+
  '<div class="sd-kp"><div><b>'+esc(S.w)+'<small> из '+esc(S.n)+'</small></b><span>зашло, '+esc(Math.round(S.rate))+' %</span></div>'+
  '<div><b class="'+(S.units>=0?'up':'dn')+'">'+(S.units>=0?'+':'−')+esc(fx(Math.abs(S.units),1))+'</b><span>ед. при ставке 1</span></div>'+
  '<div><b>'+esc(fx(S.kef,2))+'</b><span>средний кэф</span></div></div>'+
  (rec.length?'<p class="sd-lb">Последние '+rec.length+' прогнозов канала</p><div class="sd-rc">'+rec.map(r=>'<i class="'+(r.r==='w'?'w':r.r==='l'?'l':'d')+'" title="'+esc((r.kind==='express'?'экспресс: ':'')+(RS[r.r]||''))+'"></i>').join('')+'</div>':'')+
  (M?'<p class="sd-lb">'+esc(mo.name||'Этот месяц')+' · весь канал</p><div class="sd-mo"><b>'+esc(M.w)+' из '+esc(M.n)+'</b><span class="'+(M.units>=0?'up':'dn')+'">'+(M.units>=0?'+':'−')+esc(fx(Math.abs(M.units||0),1))+' ед.</span></div>':'')+
  (L?'<p class="sd-lb">Последний разобранный</p><a class="sd-last" href="'+esc(L.url||'#')+'" target="_blank" rel="noopener"><span>'+esc(L.h+' — '+L.a)+(L.sc?' '+esc(L.sc):'')+'</span><b>'+esc(L.bet)+(L.kef?' · '+esc(fx(L.kef,2)):'')+'</b><i class="'+(L.r==='w'?'w':L.r==='l'?'l':'d')+'">'+esc(RS[L.r]||'')+'</i></a>':'')+
  '<a class="sd-all" href="'+esc(ROOT+'results.html')+'">Все итоги →</a><p class="sd-18">18+ · Прошлые результаты не гарантируют будущих.</p></div>'}
/* справа — «Подсказка модели» (владелец 21.11: «то, что помогало бы выбрать вариант ставки»):
   1) «Перевес модели» — исходы матчей из списка, где шанс по модели выше, чем закладывает коэффициент линии (шанс × кэф > 1);
   2) «Самые вероятные» — исходы с наибольшим шансом по модели. Данные — window.JV_MODEL и window.JV_LINES (уже на странице).
   Щелчок по строке раскрывает этот матч в списке. */
const pc=p=>Math.round(p*100)+' %';
function cands(m){const key=[m.lg,m.t.slice(0,10),m.h,m.a].join('|'),M=(window.JV_MODEL||{})[key],L=(window.JV_LINES||{})[key]||{};if(!M)return [];
 const out=[],add=(lab,p,k)=>{if(typeof p==='number'&&p>0&&p<1)out.push({m,lab,p,k:typeof k==='number'&&k>1?k:null})};
 add('П1 · '+m.hn,M.p1,L.p1);add('Ничья',M.x,L.x);add('П2 · '+m.an,M.p2,L.p2);
 if(!FB){add('Победа с ОТ · '+m.hn,M.w1,L.fin1);add('Победа с ОТ · '+m.an,M.w2,L.fin2)}
 if(L.tot!=null&&L.tot%1){const po=+L.tot===+M.tot?M.over:(M.totals||{})[String(L.tot)];
  if(typeof po==='number'){add('Тотал больше '+String(L.tot).replace('.',','),po,L.over);add('Тотал меньше '+String(L.tot).replace('.',','),1-po,L.under)}}
 if(FB&&typeof M.btts==='number')add('Обе забьют',M.btts,null);
 return out}
function valueHTML(vis){const all=vis.flatMap(cands);if(!all.length)return '';
 const val=all.filter(c=>c.k&&c.p*c.k>=1.04).sort((x,y)=>y.p*y.k-x.p*x.k).slice(0,6);
 const top=all.filter(c=>c.p>=.55&&!/^Ничья/.test(c.lab)).sort((x,y)=>y.p-x.p).slice(0,5);
 const row=(c,ex)=>'<button type="button" class="sd-v" data-k="'+esc(c.m.h+'|'+c.m.a)+'"><span>'+esc(c.m.hn+' — '+c.m.an)+' · '+esc(c.m.t.slice(11,16))+'</span><b>'+esc(c.lab)+'</b><em>'+
  (c.k?'кэф '+esc(fx(c.k,2))+' · ':'')+'шанс '+pc(c.p)+(ex?' · <i class="up">перевес +'+Math.round((c.p*c.k-1)*100)+' %</i>':'')+'</em></button>';
 return '<h4>Подсказка модели<small>по матчам из списка, расчёт JARVIS</small></h4><div class="sd-sc">'+
  (val.length?'<p class="sd-lb">Перевес модели над линией</p>'+val.map(c=>row(c,1)).join(''):(()=>{const near=all.filter(c=>c.k&&c.p>=.3).sort((x,y)=>y.p*y.k-x.p*x.k).slice(0,3);
   return '<p class="sd-lb">Перевеса над линией сейчас нет · ближе всего</p>'+near.map(c=>row(c,0)).join('')})())+
  (top.length?'<p class="sd-lb">Самые вероятные исходы</p>'+top.map(c=>row(c,0)).join(''):'')+
  '<p class="sd-18">Перевес — шанс по модели больше, чем закладывает коэффициент. Это расчёт, не гарантия. 18+</p></div>'}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.sdt .sd-v');if(!b)return;const [h,a]=b.dataset.k.split('|');
 const li=rows().find(x=>{const i=info(x);return i&&i.h===h&&i.a===a});if(!li)return;const hd=li.querySelector('.mhead');
 if(hd&&!li.classList.contains('open'))hd.click();setTimeout(()=>li.scrollIntoView({behavior:'smooth',block:'start'}),60)});
/* ---- что показывать ---- */
const rows=()=>[...LIST.querySelectorAll('li.match')].filter(li=>li.offsetParent!==null);
const info=li=>{const s=li&&li.querySelector('.lvslot[data-lv-lg]');return s?{lg:s.dataset.lvLg,h:s.dataset.lvH,a:s.dataset.lvA,hn:s.dataset.lvHn||name(s.dataset.lvH),an:s.dataset.lvAn||name(s.dataset.lvA),t:s.dataset.lvT||'',li}:null};
/* футбол (владелец 21.11): без раскрытого матча и без выбранной вкладки — лиги по очереди, раз в 7 с;
   только лиги, у которых есть матчи в списке; ЛЧ и ЛЕ — только если их матчи сегодня (МСК) */
let ROT=0,ROTL=[],HOV=false;
const todayMSK=()=>new Date(Date.now()+3*36e5).toISOString().slice(0,10);
function rotLeagues(){const T=((window.JV_TODAY||{}).matches||[]).map(m=>({lg:m.lg,t:m.t||''})),ms=[...LIST.querySelectorAll('li.match')].map(info).filter(Boolean).concat(T),d=todayMSK(),seen=[];
 ['epl','laliga','seriea','bundesliga','ligue1','rpl'].forEach(l=>{if(ms.some(m=>m.lg===l))seen.push(l)});
 ['ucl','uel'].forEach(l=>{if(ms.some(m=>m.lg===l&&m.t.slice(0,10)===d))seen.push(l)});
 return seen.length?seen:['epl']}
function tabLg(){const tab=document.querySelector('#ltabs [aria-selected="true"]'),l=tab&&tab.dataset.l;return l&&l!=='all'&&LGN[l]?l:''}
function pickLg(open){
 if(open)return open.lg;
 if(FB&&!tabLg()){ROTL=rotLeagues();return ROTL[ROT%ROTL.length]}
 const tab=document.querySelector('#ltabs [aria-selected="true"]'),l=tab&&tab.dataset.l;
 if(l&&l!=='all'&&LGN[l])return l;
 const f=info(rows()[0]);return f?f.lg:FB?'epl':'khl'}
const ownLg=(lg,id)=>FB&&(lg==='ucl'||lg==='uel')?((F().teams||{})[id]||{}).lg||'epl':lg;

let L=null,R=null,key='',q=0;
function build(){
 const vis=rows().map(info).filter(Boolean),openLi=[...LIST.querySelectorAll('li.match.open')].pop(),op=info(openLi);
 const lg0=pickLg(op),lg=op?ownLg(lg0,op.h):lg0;
 const tb=table(lg);const me=op?[op.h,op.a]:[];const today=new Set(vis.flatMap(m=>[m.h,m.a]));
 const k=[lg,me.join(),vis.map(m=>m.h+m.a).join()].join('|');if(k===key&&L)return;key=k;
 if(!L){L=document.createElement('aside');R=document.createElement('aside');L.className=R.className='sdt'+(VIEW==='2'?' w':'');
  L.setAttribute('aria-label','Турнирная таблица');R.setAttribute('aria-label','Подсказка модели');document.body.append(L,R)}
 const rot=FB&&!op&&!tabLg()&&ROTL.length>1;
 L.innerHTML=tb&&tb.length?'<h4>'+esc(LGN[lg]||lg)+' · таблица<small>'+(FB?'место, игры, очки':'все клубы по очкам')+(rot?' · лиги сменяются':'')+'</small>'+(rot?'<span class="sd-dots">'+ROTL.map((l,i)=>'<i'+(i===ROT%ROTL.length?' class="on"':'')+' title="'+esc(LGN[l])+'"></i>').join('')+'</span>':'')+'</h4><div class="sd-sc"><table><thead><tr><th>#</th><th></th><th>Клуб</th><th title="Игры">И</th><th title="Очки">О</th></tr></thead><tbody>'+
  tb.map(r=>'<tr class="'+(me.includes(r.id)?'me':today.has(r.id)?'td':'')+'"><td class="n">'+esc(r.pl)+'</td><td class="m">'+mvHTML(r)+'</td><td class="c">'+club(r.id)+'</td><td class="g">'+esc(r.gp)+'</td><td class="p">'+esc(r.pts)+'</td></tr>').join('')+'</tbody></table></div>':'';
 R.innerHTML=valueHTML(vis);
}
function place(){q=0;if(!L)return;
 const lr=LIST.getBoundingClientRect(),gl=lr.left,gr=innerWidth-lr.right,w=Math.min(300,Math.min(gl,gr)-GAP-10);
 if(w<MINW||!lr.height||!L.innerHTML){L.classList.remove('on');R.classList.remove('on');return}
 const hd=document.querySelector('.hd'),hb=(hd?Math.max(0,hd.getBoundingClientRect().bottom):0)+12;
 const op=LIST.querySelector('li.match.open'),anchor=op?op.getBoundingClientRect().top:lr.top;
 const mh=Math.max(160,Math.min(innerHeight-hb-16,lr.height));
 [L,R].forEach(x=>{x.style.setProperty('--w',w+'px');x.style.setProperty('--mh',mh+'px');const h=x.offsetHeight;
  const t=Math.min(Math.max(hb,anchor),lr.bottom-h);x.style.top=t+'px';
  x.classList.toggle('on',lr.bottom>hb+60&&lr.top<innerHeight-60)});
 L.style.left=(gl-GAP-w)+'px';R.style.left=(lr.right+GAP)+'px'}
const upd=()=>{build();place()};
const sched=()=>{if(!q)q=requestAnimationFrame(place)};
new MutationObserver(()=>requestAnimationFrame(upd)).observe(LIST,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style']});
const tabs=document.getElementById('ltabs');if(tabs)new MutationObserver(()=>requestAnimationFrame(upd)).observe(tabs,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
addEventListener('scroll',sched,{passive:true});addEventListener('resize',sched);
if('ResizeObserver' in window)new ResizeObserver(sched).observe(LIST);
setTimeout(upd,300);setTimeout(upd,1500);
if(FB)setInterval(()=>{if(HOV||document.hidden||LIST.querySelector('li.match.open')||tabLg()||ROTL.length<2)return;ROT++;
 if(L){L.classList.add('sw');setTimeout(()=>{key='';upd();L.classList.remove('sw')},180)}},7000);
document.addEventListener('pointerover',e=>{HOV=!!(e.target.closest&&e.target.closest('.sdt'))},{passive:true});
})();
