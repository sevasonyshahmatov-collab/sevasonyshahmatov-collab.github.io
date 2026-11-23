/* JARVIS v3a — эмблема клуба по центру «на глаз» (владелец 21.11: «у разных клубов разные формы, некоторые не по центру»).
   Файлы эмблем выровнены по краям рисунка, но у щита с острым низом, буквы «J» «Ювентуса» и т. п. основная масса рисунка
   смещена — эмблема кажется сдвинутой. Считаем центр масс непрозрачных точек и сдвигаем картинку на ~45 % этого смещения
   (полный сдвиг выглядит перекошенным в другую сторону). Только картинки своего сайта; ошибка — ничего не делаем.
   Подключение: <script src="../assets/crestc.js" defer>; цели — .tmcrest img (шапка клуба) и [data-cc] — по желанию. */
(()=>{
const K=.45,N=64,SEL='.tmcrest img,img[data-cc]';
function fix(im){
 if(im.dataset.ccDone)return;
 const run=()=>{try{
  if(!im.naturalWidth)return;im.dataset.ccDone=1;
  const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d',{willReadFrequently:true});
  const w=im.naturalWidth,h=im.naturalHeight,k=Math.min(N/w,N/h),dw=w*k,dh=h*k,ox=(N-dw)/2,oy=(N-dh)/2;
  x.drawImage(im,ox,oy,dw,dh);const d=x.getImageData(0,0,N,N).data;
  let m=0,sx=0,sy=0;for(let i=0;i<N*N;i++){const a=d[i*4+3]/255;if(a<.1)continue;m+=a;sx+=a*(i%N);sy+=a*((i/N)|0)}
  if(m<20)return;
  const fx=(sx/m+.5-N/2)/Math.max(dw,dh),fy=(sy/m+.5-N/2)/Math.max(dw,dh);   // доля размера рисунка
  if(Math.abs(fx)<.015&&Math.abs(fy)<.015)return;
  const r=im.getBoundingClientRect(),s=Math.min(r.width,r.height)||0;if(!s)return;
  im.style.translate=`${(-fx*K*s).toFixed(1)}px ${(-fy*K*s).toFixed(1)}px`;
 }catch(e){}};
 if(im.complete)run();else im.addEventListener('load',run,{once:true});
}
const scan=()=>document.querySelectorAll(SEL).forEach(fix);
scan();
/* шапку клуба рисует скрипт страницы — подождём её появления */
const mo=new MutationObserver(scan);mo.observe(document.body,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),8000);
addEventListener('resize',()=>{document.querySelectorAll(SEL).forEach(i=>{delete i.dataset.ccDone;i.style.translate=''});scan()});
})();
