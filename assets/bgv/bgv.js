/* Варианты фона (владелец 26.11). Вариант ставит assets/nav.js в <head> (html[data-bgv], без мигания); здесь — рисунок фона
   (.bgv-art) и переключатель. Переключатель виден в черновике всегда, на живом сайте — если вариант открыт ссылкой ?bgv=N. */
(() => {
'use strict';
const d = document.documentElement, V = {0: 'Как сейчас', 1: 'Лёд', 2: 'Графит', 3: 'Прожекторы', 4: 'Сияние', 5: 'Полосы'};
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
  art.innerHTML = v === '1' ? (FOOT ? PITCH : RINK) : v === '4' ? '<i></i><i></i><i></i>' : '';   /* только свои константы */
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
  Object.keys(V).forEach(k => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = k; b.textContent = (k === '0' ? '' : k + ' · ') + V[k];
    b.addEventListener('click', () => set(k)); box.append(b); btns.push(b);
    const o = document.createElement('option'); o.value = k; o.textContent = b.textContent; sel.append(o);
  });
  sel.addEventListener('change', () => set(sel.value)); box.append(sel);
  document.body.append(box); mark();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
