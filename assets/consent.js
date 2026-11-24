/* JARVIS — согласие на cookies и Яндекс Метрику (24.11).
   Метрика загружается ТОЛЬКО после «Принять». Ответ хранится в браузере (localStorage jv-consent: y / n).
   Номер счётчика — YM_ID ниже: пока пусто, плашки нет и ничего не загружается. Для показа плашки в черновике — ?ymdemo=1.
   Ссылка «Настройки cookies» в подвале (data-consent-reset) сбрасывает ответ и снова показывает плашку.
   Подключается из footer.js на всех страницах. */
(()=>{
const YM_ID='';                       /* номер счётчика Яндекс Метрики, например '98765432' */
const WEBVISOR=false;                 /* запись действий посетителя; если true — указать в privacy.html, п. 3 */
const K='jv-consent';
let demo=false;try{demo=new URLSearchParams(location.search).get('ymdemo')==='1'}catch(e){}
if(!YM_ID&&!demo)return;
window.JV_CONSENT_ON=true;
const SRC=(document.currentScript&&document.currentScript.src)||location.href;
const U=p=>new URL('../'+p,SRC).href;
const get=()=>{try{return localStorage.getItem(K)}catch(e){return null}};
const set=v=>{try{localStorage.setItem(K,v)}catch(e){}};
function loadYM(){
 if(!YM_ID||window.ym)return;
 (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();
  k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
 window.ym(+YM_ID,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:WEBVISOR});
}
const css=`.jvc{position:fixed;z-index:9000;left:50%;bottom:16px;transform:translateX(-50%);width:min(640px,calc(100% - 24px));display:flex;gap:12px 16px;align-items:center;flex-wrap:wrap;
 padding:14px 16px;border-radius:14px;background:rgba(10,16,30,.96);color:#eef3ff;box-shadow:0 18px 44px rgba(0,0,0,.5),inset 0 0 0 1px rgba(160,190,255,.16);font:500 14px/1.45 var(--text,system-ui)}
.jvc p{margin:0;flex:1 1 300px}.jvc a{color:#fff;text-decoration:underline;text-underline-offset:3px}
.jvc div{display:flex;gap:8px;flex:none}
.jvc button{border:0;border-radius:10px;padding:10px 16px;font:700 14px/1 var(--text,system-ui);cursor:pointer}
.jvc .y{background:#ffcc33;color:#111}.jvc .n{background:rgba(160,190,255,.14);color:#eef3ff}
.jvc button:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media (max-width:760px){.jvc{bottom:calc(76px + env(safe-area-inset-bottom))}.jvc div{width:100%}.jvc button{flex:1}}`;
function banner(){
 if(document.querySelector('.jvc'))return;
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 const b=document.createElement('div');b.className='jvc';b.setAttribute('role','region');b.setAttribute('aria-label','Согласие на cookies');
 b.innerHTML=`<p>Мы используем cookies и Яндекс Метрику, чтобы считать посещения и делать сайт удобнее. Включим их только с вашего согласия. <a href="${U('privacy.html')}">Подробнее</a></p><div><button type="button" class="n">Отказаться</button><button type="button" class="y">Принять</button></div>`;
 b.querySelector('.y').onclick=()=>{set('y');b.remove();loadYM()};
 b.querySelector('.n').onclick=()=>{set('n');b.remove()};
 document.body.appendChild(b);
}
const go=()=>{const v=get();if(v==='y')loadYM();else if(v!=='n'||demo&&!v)banner()};
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-consent-reset]');if(!a)return;e.preventDefault();
 try{localStorage.removeItem(K)}catch(x){}
 if(get()!=='y'&&window.ym){location.reload();return}
 banner()});
if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
})();
