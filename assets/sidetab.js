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
const css=`.sdt{position:fixed;z-index:5;width:var(--w,260px);display:flex;flex-direction:column;max-height:var(--mh,80vh);padding:12px 8px 8px;border-radius:var(--rc,14px);
 background:rgba(10,16,30,.86);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 18px 44px rgba(0,0,0,.45),inset 0 0 0 1px rgba(160,190,255,.14);
 color:#eef3ff;font:500 12.5px/1.2 var(--text,system-ui);opacity:0;transition:opacity .2s ease;visibility:hidden}
.sdt.on{opacity:1;visibility:visible}
.sdt h4{margin:0 4px 8px;font:800 13px/1.2 var(--display,system-ui);letter-spacing:.04em;text-transform:uppercase;color:rgba(220,230,255,.8);flex:none}
.sdt h4 small{display:block;margin-top:3px;font:500 11px/1.2 var(--text,system-ui);letter-spacing:0;text-transform:none;color:rgba(220,230,255,.55)}
.sdt .sd-sc{overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;min-height:0}
.sdt table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.sdt th{font:700 11px/1 var(--text,system-ui);color:rgba(220,230,255,.55);text-align:center;padding:0 2px 6px;position:sticky;top:0;background:rgba(10,16,30,.96)}
.sdt th:nth-child(2){text-align:left}
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
function table(lg){
 if(FB){const TB=F().tables||{};if(lg==='ucl'||lg==='uel')return null;return (TB[lg]||[]).map(r=>({id:r.id,pl:r.place,gp:r.gp,pts:r.pts}))}
 const all=Object.entries(HT()).filter(([,t])=>t.lg===lg&&t.gp!=null);
 all.sort((x,y)=>(y[1].pts-x[1].pts)||((y[1].w||0)-(x[1].w||0))||((y[1].gf-y[1].ga)-(x[1].gf-x[1].ga)));
 return all.map(([id,t],i)=>({id,pl:i+1,gp:t.gp,pts:t.pts}))}
/* 5 последних результатов, слева старые: 'w' | 'd' | 'l' */
function form(id){
 if(FB){const J=window.JVF;if(!J||!J.gamesOf)return [];return J.gamesOf(id).slice(0,5).reverse().map(g=>g.gf>g.ga?'w':g.gf===g.ga?'d':'l')}
 const T=HT()[id]||{},gs=(T.games||[]).filter(g=>g.gf!=null&&g.ga!=null).sort((x,y)=>x.d<y.d?-1:1);
 if(gs.length)return gs.slice(-5).map(g=>g.gf>g.ga?'w':'l');   /* у НХЛ строки form нет — считаем по матчам */
 return (T.form||'').slice(-5).split('').map(c=>c==='В'?'w':'l')}
const RL={w:'В',d:'Н',l:'П'},RT={w:'победа',d:'ничья',l:'поражение'};
const dots=id=>{const f=form(id);return '<span class="sd-dt" aria-label="форма: '+esc(f.map(x=>RT[x]).join(', ')||'нет данных')+'">'+f.map(x=>'<i class="'+x+'">'+RL[x]+'</i>').join('')+'</span>'};

/* ---- что показывать ---- */
const rows=()=>[...LIST.querySelectorAll('li.match')].filter(li=>li.offsetParent!==null);
const info=li=>{const s=li&&li.querySelector('.lvslot[data-lv-lg]');return s?{lg:s.dataset.lvLg,h:s.dataset.lvH,a:s.dataset.lvA,t:s.dataset.lvT||'',li}:null};
function pickLg(open){
 if(open)return open.lg;
 const tab=document.querySelector('#ltabs [aria-selected="true"]'),l=tab&&tab.dataset.l;
 if(l&&l!=='all'&&LGN[l])return l;
 const f=info(rows()[0]);return f?f.lg:FB?'epl':'khl'}
const ownLg=(lg,id)=>FB&&(lg==='ucl'||lg==='uel')?((F().teams||{})[id]||{}).lg||'epl':lg;

let L=null,R=null,key='',q=0;
function build(){
 const vis=rows().map(info).filter(Boolean),openLi=[...LIST.querySelectorAll('li.match.open')].pop(),op=info(openLi);
 const lg0=pickLg(op),lg=ownLg(lg0,op?op.h:(vis[0]||{}).h);
 const tb=table(lg);const me=op?[op.h,op.a]:[];const today=new Set(vis.flatMap(m=>[m.h,m.a]));
 const k=[lg,me.join(),vis.map(m=>m.h+m.a).join()].join('|');if(k===key&&L)return;key=k;
 if(!L){L=document.createElement('aside');R=document.createElement('aside');L.className=R.className='sdt'+(VIEW==='2'?' w':'');
  L.setAttribute('aria-label','Турнирная таблица');R.setAttribute('aria-label','Форма команд');document.body.append(L,R)}
 L.innerHTML=tb&&tb.length?'<h4>'+esc(LGN[lg]||lg)+' · таблица<small>'+(FB?'место, игры, очки':'все клубы по очкам')+'</small></h4><div class="sd-sc"><table><thead><tr><th>#</th><th>Клуб</th><th title="Игры">И</th><th title="Очки">О</th></tr></thead><tbody>'+
  tb.map(r=>'<tr class="'+(me.includes(r.id)?'me':today.has(r.id)?'td':'')+'"><td class="n">'+esc(r.pl)+'</td><td class="c">'+club(r.id)+'</td><td class="g">'+esc(r.gp)+'</td><td class="p">'+esc(r.pts)+'</td></tr>').join('')+'</tbody></table></div>':'';
 const ms=(op?[op].concat(vis.filter(m=>m.li!==op.li)):vis).slice(0,8);
 R.innerHTML=ms.length?'<h4>Форма команд<small>5 последних матчей, слева старые</small></h4><div class="sd-sc"><ul class="sd-fm">'+ms.map(m=>
  '<li'+(op&&m.li===op.li?' class="me"':'')+'><time>'+esc((LGN[m.lg]||'')+' · '+m.t.slice(11,16))+'</time><div class="sd-fr">'+club(m.h)+dots(m.h)+'</div><div class="sd-fr">'+club(m.a)+dots(m.a)+'</div></li>').join('')+'</ul></div>':'';
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
})();
