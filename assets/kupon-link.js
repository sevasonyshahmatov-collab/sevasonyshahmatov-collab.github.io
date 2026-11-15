/* JARVIS v3a — входы в «Купон» с других страниц хоккея: кнопка «В купон» у матчей в «Прогнозе на сегодня» */
(function(){
 /* предпросмотр для владельца: всё это видно только после захода по адресу с ?kupon=1 */
 if(!(function(){try{if(/[?&]kupon=1(?:&|$)/.test(location.search))localStorage.setItem('jv_kupon_preview','1');if(/[?&]kupon=0(?:&|$)/.test(location.search))localStorage.removeItem('jv_kupon_preview');return localStorage.getItem('jv_kupon_preview')==='1'}catch(e){return false}})())return;
 var pr=document.getElementById('kupon');if(pr)pr.hidden=false;
 document.querySelectorAll('.fc-m[data-lv-lg][data-lv-t]').forEach(function(li){
  var d=li.dataset,box=li.querySelector('.fc-teams');if(!box||Date.parse(d.lvT)<=Date.now())return;
  var a=document.createElement('a');a.className='fc-kup';a.textContent='В купон';
  a.href='kupon.html?m='+encodeURIComponent([d.lvLg,d.lvT.slice(0,10),d.lvH,d.lvA].join('|'));
  var ml=box.querySelector('.fc-mlink');if(ml){var w=document.createElement('span');w.className='fc-acts';ml.parentNode.insertBefore(w,ml);w.appendChild(ml);w.appendChild(a)}else box.appendChild(a)});
})();
