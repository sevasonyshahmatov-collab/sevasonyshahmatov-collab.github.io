/* «Мой разбор» на странице матча (владелец 25.11: «больше человеческого текста, будто это я пишу разборы»).
   Шаблонный текст из фраз владелец отклонил («перечисление статистики через запятую»), поэтому здесь только тексты,
   написанные под конкретный матч: /data/mtext.json — {"путь страницы": {"p": ["абзац", …], "v": "вывод"}}.
   Нет текста для матча — страница остаётся как есть (блок «Коротко о матче»). Подключает assets/nav.js. Вывод — textContent. */
(() => {
'use strict';
const box = document.querySelector('.mx-text');
if (!box || box.dataset.mt) return;
box.dataset.mt = '1';
const key = location.pathname.replace(/^\/draft\//, '/').replace(/index\.html$/, '').replace(/\/?$/, '/');
fetch('/data/mtext.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).then(all => {
  const t = all && all[key];
  if (!t || !Array.isArray(t.p) || !t.p.length) return;
  const sec = box.closest('section'), h2 = sec && sec.querySelector('h2');
  if (h2) h2.textContent = 'Мой разбор';
  const out = t.p.map(s => { const p = document.createElement('p'); p.className = 'mt-auth'; p.textContent = s; return p; });
  if (t.v) {
    const v = document.createElement('p'); v.className = 'mt-verdict';
    const b = document.createElement('b'); b.textContent = 'Мой вывод. ';
    v.append(b, document.createTextNode(t.v)); out.push(v);
  }
  box.replaceChildren(...out);
}).catch(() => {});
})();
