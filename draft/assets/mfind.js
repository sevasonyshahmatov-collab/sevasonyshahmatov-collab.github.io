/* JARVIS v3a — «Найти матч» рядом с заголовком «Сегодня на поле / на льду» (владелец 21.11).
   Поле уже стоит в HTML (<form class="mfind">, без сдвига страницы), скрипт его оживляет: при вводе букв сразу показывает
   матчи ближайших 7 дней (столько вперёд есть страницы матчей), по клубу или лиге, с опечаткой в одну букву.
   Пустое поле при фокусе — ближайшие матчи. Индекс тот же, что у общего поиска: /data/search.json.
   Разбор слов (латиница = кириллица, опечатки) — копия из assets/search.js: правите там — поправьте и здесь. */
(()=>{
const form=document.querySelector('form.mfind');if(!form)return;
const inp=form.querySelector('input'),lb=form.querySelector('.mf-list');if(!inp||!lb)return;
const SRC=(document.currentScript&&document.currentScript.src)||new URL('assets/mfind.js',location.href).href;
const U=p=>new URL('../'+p,SRC).href;
const ZONE=(document.documentElement.dataset.sport||'')==='football'?'f':'h';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

const CY={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'i',ь:'',э:'e',ю:'u',я:'a'};
function fold(s){s=String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ё/g,'е').replace(/[а-я]/g,c=>CY[c]);
 s=s.replace(/ø/g,'o').replace(/ß/g,'ss').replace(/æ/g,'ae').replace(/đ/g,'d').replace(/ł/g,'l');
 return s.replace(/ck/g,'k').replace(/c(?!h)/g,'k').replace(/q/g,'k').replace(/x/g,'ks').replace(/[yj]/g,'i').replace(/w/g,'v').replace(/(.)\1+/g,'$1')}
const words=s=>fold(s).split(/[^a-z0-9]+/).filter(Boolean);
function near(a,b){if(a===b)return true;const d=a.length-b.length;if(d>1||d<-1)return false;
 let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
 if(!d)return a.slice(i+1)===b.slice(i+1)||(a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
 return d>0?a.slice(i+1)===b.slice(i):b.slice(i+1)===a.slice(i)}
function wm(q,w,typo){if(w===q)return 0;if(w.startsWith(q))return .2;
 if(typo&&q.length>=5)for(let k=-1;k<=1;k++){const l=q.length+k;if(k<0&&q.length<6)continue;if(l>=4&&l<=w.length&&near(q,w.slice(0,l)))return 3}
 return -1}
function score(ws,qs,typo){let t=0;for(const q of qs){let b=9;for(const w of ws){const m=wm(q,w,typo);if(m>=0&&m<b)b=m}if(b===9)return -1;t+=b}return t}

/* время МСК строкой «ГГГГ-ММ-ДД ЧЧ:ММ», как в индексе */
const msk=ms=>new Date(ms+3*3600e3).toISOString().slice(0,16).replace('T',' ');
const LGN={khl:'КХЛ',nhl:'НХЛ',epl:'АПЛ',laliga:'Ла Лига',seriea:'Серия А',bundesliga:'Бундеслига',ligue1:'Лига 1',rpl:'РПЛ',ucl:'Лига чемпионов',uel:'Лига Европы'};
let M=null,loading=null;
function load(){if(M)return Promise.resolve(M);
 return loading=loading||fetch('/data/search.json',{cache:'default'}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(D=>{
  const C={},L={};
  D.c.forEach(r=>{if(r[1]===ZONE)C[r[0]]={id:r[0],lg:r[2],ru:r[3],w:words([r[3],r[4],r[5]].join(' '))}});
  D.l.forEach(r=>{if(r[0]===ZONE)L[r[1]]=words([r[2],r[3],r[4]].join(' '))});
  M=D.m.filter(r=>r[1]===ZONE&&!r[4]&&C[r[2]]&&C[r[3]]).map(r=>{const h=C[r[2]],a=C[r[3]],lg=r[5]||h.lg;
   return{d:r[0],h,a,lg,w:h.w.concat(a.w,L[lg]||[],words(LGN[lg]||''))}});
  return M}).catch(e=>{loading=null;throw e})}

/* ближайшие: от «начался не больше 2 часов назад» до 7 дней вперёд */
const win=()=>{const n=Date.now();return[msk(n-2*3600e3),msk(n+7*864e5)]};
function find(q){const [a,b]=win(),ok=M.filter(m=>m.d>=a&&m.d<=b);const qs=words(q);
 if(!qs.length)return ok.sort((x,y)=>x.d<y.d?-1:1).slice(0,6);
 let r=ok.map(m=>[score(m.w,qs,false),m]).filter(x=>x[0]>=0);
 if(!r.length)r=ok.map(m=>[score(m.w,qs,true),m]).filter(x=>x[0]>=0);
 return r.sort((x,y)=>(x[0]<2?0:1)-(y[0]<2?0:1)||(x[1].d<y[1].d?-1:1)).slice(0,8).map(x=>x[1])}

const when=d=>{const t=msk(Date.now()).slice(0,10),diff=Math.round((Date.parse(d.slice(0,10))-Date.parse(t))/864e5);
 return(diff===0?'сегодня':diff===1?'завтра':d.slice(8,10)+'.'+d.slice(5,7))+', '+d.slice(11,16)};
const page=m=>window.JV&&JV.matchPage?U(JV.matchPage('',m.lg,m.d,m.h.id,m.a.id)):U((ZONE==='h'?'team/index.html?id=':'football/team.html?id=')+encodeURIComponent(m.h.id));
const img=c=>`<img src="${esc(U((ZONE==='h'?'assets/em/s/':'assets/fc/s/')+c.id+'.webp'))}" alt="" width="28" height="28" loading="lazy" onerror="if(!this.dataset.f&&/\\/(em|fc)\\/s\\//.test(this.src)){this.dataset.f=1;this.src=this.src.replace(/\\/(em|fc)\\/s\\//,'/$1/')}else this.style.visibility='hidden'">`;

let cur=-1,items=[];
function show(list,empty){items=list;cur=-1;inp.removeAttribute('aria-activedescendant');
 lb.innerHTML=(empty?'<li class="mf-h" role="presentation">Ближайшие матчи</li>':'')+(list.length?list.map((m,i)=>
  `<li role="presentation"><a class="mf-i" role="option" id="mf-o${i}" href="${esc(page(m))}" tabindex="-1"><span class="mf-vs">${img(m.h)}${img(m.a)}</span><span class="mf-t"><b>${esc(m.h.ru)} — ${esc(m.a.ru)}</b><small>${esc(when(m.d))} МСК · ${esc(LGN[m.lg]||m.lg)}</small></span></a></li>`).join('')
  :'<li class="mf-none" role="presentation">Матча на ближайшую неделю не нашли. Попробуйте название клуба или лиги.</li>');
 lb.hidden=false;inp.setAttribute('aria-expanded','true')}
function hide(){lb.hidden=true;inp.setAttribute('aria-expanded','false');inp.removeAttribute('aria-activedescendant');cur=-1}
function run(){const v=inp.value;
 if(!M){lb.innerHTML='<li class="mf-none" role="presentation">Загружаем матчи…</li>';lb.hidden=false;inp.setAttribute('aria-expanded','true');
  load().then(()=>{if(inp.value===v&&document.activeElement===inp)run()}).catch(()=>{lb.innerHTML='<li class="mf-none" role="presentation">Не удалось загрузить матчи. Обновите страницу.</li>'});return}
 show(find(v),!words(v).length)}
function mark(i){const all=lb.querySelectorAll('.mf-i');if(!all.length)return;
 cur=(i+all.length)%all.length;all.forEach((a,k)=>a.classList.toggle('on',k===cur));
 inp.setAttribute('aria-activedescendant',all[cur].id);all[cur].scrollIntoView({block:'nearest'})}

inp.addEventListener('focus',()=>{load().catch(()=>{});run()});
inp.addEventListener('input',run);
inp.addEventListener('keydown',e=>{
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(lb.hidden)run();mark(cur+(e.key==='ArrowDown'?1:-1))}
 else if(e.key==='Escape'){if(!lb.hidden){e.preventDefault();e.stopPropagation();hide()}}
 else if(e.key==='Enter'){e.preventDefault();const all=lb.querySelectorAll('.mf-i');const a=all[cur>=0?cur:0];if(a&&!lb.hidden)location.href=a.href}});
form.addEventListener('submit',e=>e.preventDefault());
/* закрыть, когда фокус или нажатие ушли за пределы поля и списка */
document.addEventListener('pointerdown',e=>{if(!form.contains(e.target))hide()});
form.addEventListener('focusout',e=>{if(!form.contains(e.relatedTarget))setTimeout(()=>{if(!form.contains(document.activeElement))hide()},0)});
lb.addEventListener('mousedown',e=>{if(e.target.closest('.mf-i'))e.preventDefault()});
})();
