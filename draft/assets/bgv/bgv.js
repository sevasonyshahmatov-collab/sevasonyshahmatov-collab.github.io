/* Варианты фона (владелец 26.11). Вариант ставит assets/nav.js в <head> (html[data-bgv], без мигания); здесь — рисунок фона
   (.bgv-art) и переключатель. Переключатель виден в черновике всегда, на живом сайте — если вариант открыт ссылкой ?bgv=N. */
(() => {
'use strict';
const FOOT0 = () => document.documentElement.dataset.sport === 'football';
const d = document.documentElement, V = {0: 'Как сейчас', 6: 'Неон', 7: 'Скорость', 8: 'Ретро-арена', 9: 'Северное сияние', 10: 'Огни стадиона', 11: 'Вспышки камер', 12: 'Лазерное шоу', 13: 'Голограмма', 14: 'Дым и свет', 15: FOOT0() ? 'Мячи' : 'Шайбы', 16: 'Светодиодное табло', 17: 'Иней', 18: 'Пульс', 19: 'Салют', 20: 'Гиперпрыжок', 21: 'Волны', 22: 'Поток цифр', 23: 'Отражения', 24: 'Геометрия', 25: 'Трибуны', 26: 'Сетка ворот', 1: 'Лёд', 2: 'Графит', 3: 'Прожекторы', 4: 'Сияние', 5: 'Полосы'};
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

  const R = Math.random, P = n => (R() * n).toFixed(1);
  if (v === '11') for (let i = 0; i < 70; i++) { const e = document.createElement('i'); e.style.cssText = 'left:' + P(100) + '%;top:' + (40 + R() * 58).toFixed(1) + '%;animation-duration:' + (3 + R() * 7).toFixed(1) + 's;animation-delay:' + (-R() * 10).toFixed(1) + 's'; art.append(e); }
  if (v === '12') { const C = FOOT ? ['#3df5a6', '#ffb400', '#0b6cff'] : ['#22e1ff', '#ff2e4d', '#7a3cff'];
    for (let i = 0; i < 9; i++) { const e = document.createElement('i'), a = -60 + i * 15, c = C[i % 3];
      e.style.cssText = '--a0:' + (a - 12) + 'deg;--a1:' + (a + 12) + 'deg;background:' + c + ';box-shadow:0 0 14px 3px ' + c + ';animation-duration:' + (5 + R() * 5).toFixed(1) + 's;animation-delay:' + (-R() * 8).toFixed(1) + 's'; art.append(e); } }
  if (v === '13') { art.innerHTML = '<svg aria-hidden="true"><defs><pattern id="bgvHex" width="34" height="58.9" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)"><path d="M17 0l17 9.8v19.6L17 39.3 0 29.4V9.8zM17 39.3v19.6" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#bgvHex)"/></svg><b></b>'; }
  if (v === '14') { const C = FOOT ? ['rgba(0,168,98,.55)', 'rgba(11,108,255,.45)', 'rgba(255,180,0,.3)'] : ['rgba(255,46,77,.5)', 'rgba(26,60,255,.55)', 'rgba(122,60,255,.35)'];
    [[-10, 50, 70], [55, -10, 65], [20, 60, 55], [70, 55, 50]].forEach((q, i) => { const e = document.createElement('i');
      e.style.cssText = 'left:' + q[0] + '%;top:' + q[1] + '%;width:' + q[2] + 'vmax;height:' + (q[2] * .7) + 'vmax;background:' + C[i % 3] + ';--dx:' + (R() > .5 ? '' : '-') + (8 + R() * 10).toFixed(0) + 'vmax;--dy:' + (R() > .5 ? '' : '-') + (4 + R() * 8).toFixed(0) + 'vmax;animation-duration:' + (16 + R() * 12).toFixed(0) + 's'; art.append(e); }); }
  if (v === '15') { const PUCK = '<svg viewBox="0 0 40 24" aria-hidden="true"><ellipse cx="20" cy="8" rx="18" ry="6" fill="currentColor" opacity=".55"/><path d="M2 8v8c0 3.3 8 6 18 6s18-2.7 18-6V8c0 3.3-8 6-18 6S2 11.3 2 8z" fill="currentColor" opacity=".35"/></svg>',
      BALL = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M20 11l7 5-3 8h-8l-3-8z" fill="currentColor" opacity=".6"/><path d="M20 11V3M27 16l7-3M24 24l5 7M16 24l-5 7M13 16l-7-3" stroke="currentColor" stroke-width="1.2"/></svg>';
    for (let i = 0; i < 14; i++) { const e = document.createElement('span'), z = 24 + R() * 70; e.innerHTML = FOOT ? BALL : PUCK;
      e.style.cssText = 'left:' + P(96) + '%;top:' + P(92) + '%;width:' + z.toFixed(0) + 'px;height:' + (FOOT ? z : z * .6).toFixed(0) + 'px;opacity:' + (.2 + R() * .3).toFixed(2) + ';--dx:' + (-40 + R() * 80).toFixed(0) + 'px;--dy:' + (-60 + R() * 120).toFixed(0) + 'px;--r:' + (-40 + R() * 80).toFixed(0) + 'deg;animation-duration:' + (10 + R() * 14).toFixed(0) + 's;animation-delay:' + (-R() * 10).toFixed(0) + 's'; art.append(e); } }
  if (v === '16') art.innerHTML = '<b></b>';
  if (v === '17') { art.innerHTML = '<svg aria-hidden="true"><filter id="bgvFrost"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .75  0 0 0 0 .88  0 0 0 0 1  0 0 0 1.1 -.45"/></filter><rect width="100%" height="100%" filter="url(#bgvFrost)"/></svg>';
    for (let i = 0; i < 40; i++) { const e = document.createElement('i'); e.style.cssText = 'left:' + P(100) + '%;top:' + P(100) + '%;animation-duration:' + (3 + R() * 5).toFixed(1) + 's;animation-delay:' + (-R() * 8).toFixed(1) + 's'; art.append(e); } }
  if (v === '18') for (let i = 0; i < 5; i++) { const e = document.createElement('i'); e.style.animationDelay = (i * 1.6) + 's'; art.append(e); }

  const SC = FOOT ? ['#3df5a6', '#ffb400', '#ffffff', '#0b6cff'] : ['#22e1ff', '#ff2e4d', '#ffffff', '#7a3cff'];
  if (v === '19') for (let k = 0; k < 6; k++) { const g = document.createElement('s'), t = (3.5 + R() * 2.5).toFixed(1) + 's', dl = (-R() * 6).toFixed(1) + 's', c = SC[k % 4];
    g.style.cssText = 'left:' + (10 + R() * 80).toFixed(0) + '%;top:' + (8 + R() * 45).toFixed(0) + '%';
    for (let j = 0; j < 22; j++) { const e = document.createElement('i'); e.style.cssText = '--a:' + (j * 360 / 22).toFixed(0) + 'deg;--r:' + (70 + R() * 70).toFixed(0) + 'px;--c:' + c + ';--t:' + t + ';--dl:' + dl; g.append(e); }
    art.append(g); }
  if (v === '20') for (let i = 0; i < 90; i++) { const e = document.createElement('i'); e.style.cssText = '--a:' + (R() * 360).toFixed(0) + 'deg;animation-duration:' + (1.6 + R() * 2.6).toFixed(2) + 's;animation-delay:' + (-R() * 4).toFixed(2) + 's'; art.append(e); }
  if (v === '21') { let h = '<svg viewBox="0 0 2400 600" preserveAspectRatio="none" aria-hidden="true">';
    for (let i = 0; i < 6; i++) { const y = 140 + i * 70, a = 30 + i * 8, w = 300 + i * 40; let dd = 'M0 ' + y;
      for (let x = 0; x <= 2400 + w; x += w / 2) dd += ' Q' + (x + w / 4) + ' ' + (y + ((x / (w / 2)) % 2 ? a : -a)) + ' ' + (x + w / 2) + ' ' + y;
      h += '<path d="' + dd + '" style="color:' + SC[i % 4] + ';stroke:' + SC[i % 4] + ';opacity:' + (.25 + i * .07).toFixed(2) + ';--s:' + (-w) + 'px;animation-duration:' + (4 + i * 1.2).toFixed(1) + 's"/>'; }
    art.innerHTML = h + '</svg>'; }
  if (v === '22') { const sym = '0123456789:%+'; for (let i = 0; i < 34; i++) { const e = document.createElement('u'); let t = ''; for (let j = 0; j < 26; j++) t += sym[Math.floor(R() * sym.length)];
    e.textContent = t; e.style.cssText = 'left:' + (i * 3 + R() * 2).toFixed(1) + '%;animation-duration:' + (9 + R() * 12).toFixed(1) + 's;animation-delay:' + (-R() * 20).toFixed(1) + 's;opacity:' + (.12 + R() * .3).toFixed(2); art.append(e); } }
  if (v === '23') art.innerHTML = '<b></b>';
  if (v === '24') for (let i = 0; i < 7; i++) { const e = document.createElement('em'), z = 18 + R() * 30, sides = 3 + (i % 3); let pts = '';
    for (let j = 0; j < sides; j++) { const a = j * 2 * Math.PI / sides; pts += (50 + 50 * Math.cos(a)).toFixed(1) + ',' + (50 + 50 * Math.sin(a)).toFixed(1) + ' '; }
    e.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="' + pts + '" fill="' + SC[i % 4] + '"/></svg>';
    e.style.cssText = 'left:' + (R() * 85).toFixed(0) + '%;top:' + (R() * 80).toFixed(0) + '%;width:' + z.toFixed(0) + 'vmin;height:' + z.toFixed(0) + 'vmin;animation-duration:' + (40 + R() * 50).toFixed(0) + 's;animation-direction:' + (i % 2 ? 'reverse' : 'normal'); art.append(e); }
  if (v === '25') { let h = '<svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">';
    for (let row = 0; row < 4; row++) { const y = 150 + row * 45, op = (.5 + row * .15).toFixed(2), sz = 10 + row * 3;
      for (let x = (row % 2) * 12; x < 1220; x += sz * 2.3) { const hy = y + (R() * 8 - 4); h += '<circle cx="' + x.toFixed(0) + '" cy="' + hy.toFixed(0) + '" r="' + sz + '" fill="#02040a" opacity="' + op + '"/><rect x="' + (x - sz * 1.3).toFixed(0) + '" y="' + (hy + sz * .8).toFixed(0) + '" width="' + (sz * 2.6).toFixed(0) + '" height="60" rx="' + sz + '" fill="#02040a" opacity="' + op + '"/>'; } }
    art.innerHTML = h + '</svg>';
    for (let i = 0; i < 45; i++) { const e = document.createElement('i'); e.style.cssText = 'left:' + P(100) + '%;top:' + (66 + R() * 30).toFixed(1) + '%;animation-duration:' + (2 + R() * 4).toFixed(1) + 's;animation-delay:' + (-R() * 5).toFixed(1) + 's'; art.append(e); } }
  if (v === '26') art.innerHTML = '<b></b>';
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
  ['0', '19', '20', '21', '22', '23', '24', '25', '26', '11', '12', '13', '14', '15', '16', '17', '18', '6', '7', '8', '9', '10', '1', '2', '3', '4', '5'].forEach(k => {   /* новые — первыми */
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = k; b.textContent = (k === '0' ? '' : k + ' · ') + V[k];
    if (k === '6' || k === '1') { const sp = document.createElement('span'); sp.textContent = k === '6' ? 'Вторые' : 'Первые'; box.append(sp); }
    b.addEventListener('click', () => set(k)); box.append(b); btns.push(b);
    if (k === '19' || k === '11' || k === '6' || k === '1') { const g = document.createElement('option'); g.disabled = true; g.textContent = {19: '— Новые —', 11: '— Третьи —', 6: '— Вторые —', 1: '— Первые —'}[k]; sel.append(g); }
    const o = document.createElement('option'); o.value = k; o.textContent = b.textContent; sel.append(o);
  });
  sel.addEventListener('change', () => set(sel.value)); box.append(sel);
  /* стрелки: листать варианты по порядку списка */
  const ord = [...sel.options].filter(o => !o.disabled).map(o => o.value);
  [['‹', -1, 'Предыдущий фон'], ['›', 1, 'Следующий фон']].forEach(([t, dlt, lab]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'bgv-nav'; b.textContent = t; b.setAttribute('aria-label', lab);
    b.addEventListener('click', () => { const i = ord.indexOf(d.dataset.bgv || '0'); set(ord[(i + dlt + ord.length) % ord.length]); });
    box.append(b);
  });
  document.body.append(box); mark();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
