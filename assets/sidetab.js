/* JARVIS v3a — таблица по бокам раскрытого матча (владелец 21.11: «слева и справа, где просто фон сайта, — актуальная таблица
   с местами и основной информацией»). Только на широком экране, где по бокам от карточки есть свободное поле (от 188 px).
   Хоккей: слева — конференция хозяев, справа — другая конференция той же лиги (обе команды подсвечены).
   Футбол: таблица лиги пополам — слева верх, справа низ; еврокубок — слева чемпионат хозяев, справа — гостей.
   Данные уже есть на странице: хоккей — window.JV_TEAMS (assets/data/teams-lite.js), футбол — window.JV_FOOT (football-lite.js).
   Карточка — <li class="match open"> с .lvslot[data-lv-lg|h|a] (hockey/index.html, assets/foot-index.js). */
(()=>{
const FB=document.documentElement.dataset.sport==='football';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const ROOT=new URL('../',(document.currentScript&&document.currentScript.src)||location.href).href;
const LGN={khl:'КХЛ',nhl:'НХЛ',epl:'АПЛ',laliga:'Ла Лига',seriea:'Серия А',bundesliga:'Бундеслига',ligue1:'Лига 1',rpl:'РПЛ'};
const MINW=188,GAP=14;
const css=`.sdt{position:absolute;z-index:5;width:var(--w,260px);padding:12px 8px 8px;border-radius:var(--rc,14px);background:rgba(10,16,30,.86);
 -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 18px 44px rgba(0,0,0,.45),inset 0 0 0 1px rgba(160,190,255,.14);color:#eef3ff;
 font:500 12.5px/1.2 var(--text,system-ui);opacity:0;transition:opacity .2s ease;pointer-events:auto}
.sdt.on{opacity:1}
.sdt h4{margin:0 4px 8px;font:800 13px/1.2 var(--display,system-ui);letter-spacing:.04em;text-transform:uppercase;color:rgba(220,230,255,.78)}
.sdt table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.sdt th{font:700 11px/1 var(--text,system-ui);color:rgba(220,230,255,.55);text-align:center;padding:0 2px 6px}
.sdt th:nth-child(2){text-align:left}
.sdt td{padding:4px 2px;text-align:center;border-top:1px solid rgba(160,190,255,.08);white-space:nowrap}
.sdt td.n{width:20px;color:rgba(220,230,255,.6)}
.sdt td.c{text-align:left;max-width:0;width:100%;overflow:hidden;text-overflow:ellipsis}
.sdt td.c a{color:inherit;text-decoration:none;display:flex;align-items:center;gap:6px;min-width:0}
.sdt td.c a span{overflow:hidden;text-overflow:ellipsis}
.sdt td.c a:hover span{text-decoration:underline}
.sdt td.c img{width:18px;height:18px;object-fit:contain;flex:none}
.sdt td.p{font-weight:800;width:24px}
.sdt td.g{width:22px;color:rgba(220,230,255,.7)}
.sdt tr.me td{background:rgba(255,204,51,.16)}
.sdt tr.me td:first-child{box-shadow:inset 3px 0 0 #ffcc33;color:#fff}
.sdt tr.me td.c{font-weight:800}
.sdt .cut td{border-top:1px dashed rgba(255,204,51,.45)}
@media (prefers-reduced-motion:reduce){.sdt{transition:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---- таблицы ---- */
function hockeyTables(lg,h,a){const T=((window.JV_TEAMS||{}).teams)||{};
 const all=Object.entries(T).filter(([,t])=>t.lg===lg&&t.place);const conf=id=>(T[id]||{}).conf||'';
 const confs=[...new Set(all.map(([,t])=>t.conf).filter(Boolean))];
 const c1=conf(h)||confs[0],c2=confs.find(c=>c!==c1)||c1;
 const rows=c=>all.filter(([,t])=>t.conf===c).sort((x,y)=>x[1].place-y[1].place).map(([id,t])=>({id,n:t.name,pl:t.place,gp:t.gp,pts:t.pts}));
 const hrefT=id=>ROOT+'team/index.html?id='+encodeURIComponent(id),em=id=>ROOT+'assets/em/s/'+id+'.webp';
 return [{t:(LGN[lg]||'')+' · '+c1,r:rows(c1),href:hrefT,em},{t:(LGN[lg]||'')+' · '+c2,r:rows(c2),href:hrefT,em}]}
function footTables(lg,h,a){const F=window.JV_FOOT||{},TB=F.tables||{},TM=F.teams||{};
 const row=r=>({id:r.id,n:(TM[r.id]||{}).n||r.id,pl:r.place,gp:r.gp,pts:r.pts});
 const hrefT=id=>ROOT+'football/team.html?id='+encodeURIComponent(id),em=id=>ROOT+'assets/fc/s/'+id+'.webp';
 const full=l=>(TB[l]||[]).map(row);
 if(lg==='ucl'||lg==='uel'){const lh=(TM[h]||{}).lg,la=(TM[a]||{}).lg;
  if(lh&&la&&lh!==la&&TB[lh]&&TB[la])return [{t:LGN[lh]||lh,r:full(lh),href:hrefT,em},{t:LGN[la]||la,r:full(la),href:hrefT,em}];
  lg=lh||la||lg}
 const R=full(lg);if(!R.length)return null;const k=Math.ceil(R.length/2);
 return [{t:(LGN[lg]||'')+' · 1–'+k,r:R.slice(0,k),href:hrefT,em},{t:(LGN[lg]||'')+' · '+(k+1)+'–'+R.length,r:R.slice(k),href:hrefT,em}]}
function html(tb,me){return '<h4>'+esc(tb.t)+'</h4><table><thead><tr><th>#</th><th>Клуб</th><th title="Игры">И</th><th title="Очки">О</th></tr></thead><tbody>'+
 tb.r.map(r=>'<tr'+(me.includes(r.id)?' class="me"':'')+'><td class="n">'+esc(r.pl)+'</td><td class="c"><a href="'+esc(tb.href(r.id))+'"><img src="'+esc(tb.em(r.id))+
  '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span>'+esc(r.n)+'</span></a></td><td class="g">'+esc(r.gp)+'</td><td class="p">'+esc(r.pts)+'</td></tr>').join('')+'</tbody></table>'}

/* ---- показ ---- */
let cur=null,L=null,R=null,ro=null;
function hide(){[L,R].forEach(x=>x&&x.remove());L=R=null;cur=null;if(ro){ro.disconnect();ro=null}}
function place(){if(!cur||!L)return;const r=cur.getBoundingClientRect(),gl=r.left,gr=innerWidth-r.right;
 const w=Math.min(300,Math.min(gl,gr)-GAP-10);if(w<MINW){L.classList.remove('on');R.classList.remove('on');return}
 /* таблица едет рядом с карточкой: не уходит под шапку сайта и не вылезает ниже карточки */
 const hd=document.querySelector('.hd'),hb=(hd?Math.max(0,hd.getBoundingClientRect().bottom):0)+12;
 [L,R].forEach(x=>{x.style.setProperty('--w',w+'px');const h=x.offsetHeight;
  const t=Math.max(r.top,Math.min(hb,r.bottom-h));x.style.top=(t+scrollY)+'px'});
 L.style.left=(r.left+scrollX-GAP-w)+'px';R.style.left=(r.right+scrollX+GAP)+'px';
 requestAnimationFrame(()=>{L.classList.add('on');R.classList.add('on')})}
function show(li){const s=li.querySelector('.lvslot[data-lv-lg]');if(!s)return hide();const d=s.dataset;
 const tbs=FB?footTables(d.lvLg,d.lvH,d.lvA):hockeyTables(d.lvLg,d.lvH,d.lvA);if(!tbs||!tbs[0].r.length)return hide();
 hide();cur=li;const me=[d.lvH,d.lvA];
 L=document.createElement('aside');R=document.createElement('aside');L.className=R.className='sdt';
 L.setAttribute('aria-label','Турнирная таблица');R.setAttribute('aria-label','Турнирная таблица');
 L.innerHTML=html(tbs[0],me);R.innerHTML=html(tbs[1],me);document.body.append(L,R);place();
 if('ResizeObserver' in window){ro=new ResizeObserver(place);ro.observe(li)}}
function check(){const o=[...document.querySelectorAll('li.match.open')];const li=o[o.length-1];
 if(!li){if(cur)hide();return}if(li!==cur)show(li)}
new MutationObserver(check).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
addEventListener('resize',()=>{if(cur)place()});
let q=0;addEventListener('scroll',()=>{if(cur&&!q)q=requestAnimationFrame(()=>{q=0;place()})},{passive:true});
})();
