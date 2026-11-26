/* Варианты фона (владелец 26.11). Вариант ставит assets/nav.js в <head> (html[data-bgv], без мигания); здесь — рисунок фона
   (.bgv-art) и переключатель. Переключатель виден в черновике всегда, на живом сайте — если вариант открыт ссылкой ?bgv=N. */
(() => {
'use strict';
const d = document.documentElement, V = {0: 'Как сейчас', 6: 'Неон', 7: 'Скорость', 8: 'Ретро-арена', 9: 'Северное сияние', 10: 'Огни стадиона', 1: 'Лёд', 2: 'Графит', 3: 'Прожекторы', 4: 'Сияние', 5: 'Полосы'};
const FOOT = d.dataset.sport === 'football';
const RINK = '<svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width=".35">' +
  '<rect x="8" y="12" width="184" height="76" rx="18"/><line x1="100" y1="12" x2="100" y2="88" stroke-width=".7"/>' +
  '<line x1="72" y1="12" x2="72" y2="88" stroke-width=".9"/><line x1="128" y1="12" x2="128" y2="88" stroke-width=".9"/>' +
  '<line x1="20" y1="12" x2="20" y2="88"/><line x1="180" y1="12" x2="180" y2="88"/><circle cx="100" cy="50" r="9"/>' +
  '<circle cx="42" cy="32" r="9"/><circle cx="42" cy="68" r="9"/><circle cx="158" cy="32" r="9"/><circle cx="158" cy="68" r="9"/>' +
  '<path d="M20 45a5 5 0 0 1 0 10M180 45a5 5 0 0 0 0 10"/></svg>';
const PITCH = '<svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width=".4">' +
  '<rect x="10" y="10" width="180" height="80"/><line x1="100" y1="10" x2="100" y2="90"/><circle cx="100" cy="50" r="10"/>' +
  '<rect x="10" y="28" width="26" height="44"/><rect x="164" y="28" width="26" height="44"/><rect x="10" y="40" width="9" height="20"/>' +
  '<rect x="181" y="40" width="9" height="20"/><path d="M36 42a10 10 0 0 1 0 16M164 42a10 10 0 0 0 0 16"/></svg>';

let art = null;
const paint = () => {
  const v = d.dataset.bgv || '';
  if (!v) { if (art) art.remove(); art = null; return; }
  if (!art) { art = document.createElement('div'); art.className = 'bgv-art'; art.setAttribute('aria-hidden', 'true'); document.body.prepend(art); }
  art.innerHTML = v === '1' || v === '6' ? (FOOT ? PITCH : RINK) : v === '4' || v === '9' ? '<i></i><i></i><i></i>' : v === '8' ? '<i></i>' : '';   /* только свои константы */
  if (v === '6') art.querySelectorAll('svg line[stroke-width=".7"], svg path').forEach(n => n.setAttribute('class', 'r'));
  if (v === '7') for (let i = 0; i < 16; i++) { const b = document.createElement('b'); b.style.top = (i * 6.5 + Math.random() * 4) + '%';
    b.style.animationDuration = (2.6 + Math.random() * 3.4).toFixed(2) + 's'; b.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's'; art.append(b); }
  if (v === '10') { const C = FOOT ? ['#3df5a6', '#ffb400', '#ffffff', '#0b6cff'] : ['#22e1ff', '#ff2e4d', '#ffffff', '#7a3cff'];
    for (let i = 0; i < 26; i++) { const e = document.createElement('i'), z = 8 + Math.random() * 46; e.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;width:' + z.toFixed(0) + 'px;height:' + z.toFixed(0) + 'px;background:' + C[i % 4] +
      ';--o:' + (0.18 + Math.random() * 0.4).toFixed(2) + ';animation-duration:' + (14 + Math.random() * 18).toFixed(1) + 's;animation-delay:' + (-Math.random() * 30).toFixed(1) + 's'; art.append(e); } }
};
const set = k => {
  try { sessionStorage.setItem('jv-bgv', k); } catch (e) {}
  if (k === '0') delete d.dataset.bgv; else d.dataset.bgv = k;
  const u = new URL(location.href); u.searchParams.set('bgv', k); history.replaceState(history.state, '', u);
  paint(); mark();
};
let btns = [], sel = null;
const mark = () => { const c = d.dataset.bgv || '0'; btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === c))); if (sel) sel.value = c; };
const go = () => {
  paint();
  let show = /\/draft\//.test(location.pathname);
  try { show = show || sessionStorage.getItem('jv-bgv-sw') === '1'; } catch (e) {}
  if (!show) return;
  const box = document.createElement('div'); box.className = 'bgv-sw'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Вариант фона');
  const l = document.createElement('span'); l.textContent = 'Фон'; box.append(l);
  sel = document.createElement('select'); sel.setAttribute('aria-label', 'Вариант фона');
  ['0', '6', '7', '8', '9', '10', '1', '2', '3', '4', '5'].forEach(k => {   /* новые — первыми */
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = k; b.textContent = (k === '0' ? '' : k + ' · ') + V[k];
    if (k === '1') { const sp = document.createElement('span'); sp.textContent = 'Прошлые'; box.append(sp); }
    b.addEventListener('click', () => set(k)); box.append(b); btns.push(b);
    const o = document.createElement('option'); o.value = k; o.textContent = b.textContent; sel.append(o);
  });
  sel.addEventListener('change', () => set(sel.value)); box.append(sel);
  document.body.append(box); mark();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
