/* «Лидеры сезона» — раздел на /hockey/ и /football/ (владелец 25.11: «доработай страницу, добавь деталей и привлекательности»).
   Один модуль на оба раздела: вид спорта — data-sport у #leaders. Данные: /data/leaders.js (JV_LEAD: [игрок, клуб, голы, передачи, матчи]),
   названия и цвета клубов — JV_TEAMS (хоккей) / JV_FOOT (футбол), эмблемы — assets/em и assets/fc.
   Вкладки лиг; слева — лидер крупно (очки «гол + пас», доля голов и передач, очков за матч), справа — места 2–10 с полосками.
   Без градиентов. Вывод — textContent и атрибуты. */
(() => {
'use strict';
const root = document.getElementById('leaders');
if (!root) return;
const me = document.currentScript, BASE = me && me.src ? me.src.replace(/[^/]*$/, '') : '';
const U = p => new URL(p, BASE).href;
const FOOT = root.dataset.sport === 'football';
const LG = FOOT
  ? [['epl', 'АПЛ'], ['laliga', 'Ла Лига'], ['seriea', 'Серия А'], ['bundesliga', 'Бундеслига'], ['ligue1', 'Лига 1'], ['rpl', 'РПЛ'], ['ucl', 'Лига чемпионов'], ['uel', 'Лига Европы']]
  : [['khl', 'КХЛ'], ['nhl', 'НХЛ']];
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
const dec = x => Number(x).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const crest = id => U((FOOT ? '../fc/' : '../em/') + id + '.webp');
const club = id => FOOT ? (((window.JV_FOOT || {}).teams || {})[id] || {}).n || id : ((window.JV_TEAMS || {}).names || {})[id] || id;
const colorOf = id => {
  let c = FOOT ? ((((window.JV_FOOT || {}).teams || {})[id] || {}).c || [])[0] : ((((window.JV_TEAMS || {}).teams || {})[id] || {}).colors || [])[0];
  if (!c) return '#5ab8ff';
  c = c[0] === '#' ? c : '#' + c;
  /* тёмный цвет клуба на тёмном фоне не виден — осветляем до читаемого */
  const n = parseInt(c.slice(1, 7), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (L >= 0.32) return c;
  const k = 0.55; return 'rgb(' + [r, g, b].map(v => Math.round(v + (255 - v) * k)).join(',') + ')';
};
const img = (id, size) => { const i = el('img'); i.src = crest(id); i.alt = ''; i.width = i.height = size; i.loading = 'lazy'; i.decoding = 'async'; i.onerror = () => { i.style.visibility = 'hidden'; }; return i; };

function load() {
  if (window.JV_LEAD) return Promise.resolve();
  return new Promise(res => { const s = el('script'); s.src = '/data/leaders.js'; s.onload = s.onerror = () => res(); document.head.append(s); });
}

function leaderCard(p, lgName) {
  const [name, id, g, a, gp] = p, pts = g + a, c = colorOf(id);
  const box = el('article', 'ld-top'); box.style.setProperty('--c', c);
  const wm = img(id, 320); wm.className = 'ld-wm'; wm.setAttribute('aria-hidden', 'true');
  const tag = el('p', 'ld-tag'); tag.append(el('b', '', '№ 1'), document.createTextNode(lgName));
  const who = el('div', 'ld-who'); const cr = img(id, 64); cr.className = 'ld-cr';
  const nm = el('div'); nm.append(el('h3', 'ld-nm', name), el('p', 'ld-club', club(id)));
  who.append(cr, nm);
  const big = el('p', 'ld-big'); big.append(el('b', '', String(pts)), el('span', '', plural(pts, 'очко', 'очка', 'очков') + ' «гол + пас»'));
  const bar = el('div', 'ld-split'); bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', g + ' ' + plural(g, 'гол', 'гола', 'голов') + ' и ' + a + ' ' + plural(a, 'передача', 'передачи', 'передач'));
  const ig = el('i', 'g'); ig.style.flex = String(Math.max(g, 0.001)); const ia = el('i', 'a'); ia.style.flex = String(Math.max(a, 0.001));
  bar.append(ig, ia);
  const leg = el('ul', 'ld-leg');
  [[g, plural(g, 'гол', 'гола', 'голов'), 'g'], [a, plural(a, 'передача', 'передачи', 'передач'), 'a'], [gp, plural(gp, 'матч', 'матча', 'матчей'), 'm'],
   [gp ? dec(pts / gp) : '—', 'очка за матч', 'r']].forEach(([v, l, k]) => { const li = el('li', k); li.append(el('b', '', String(v)), el('span', '', l)); leg.append(li); });
  box.append(wm, tag, who, big, bar, leg);
  return box;
}

function rows(list) {
  const max = Math.max(...list.map(p => p[2] + p[3]), 1);
  const ol = el('ol', 'ld-list'); ol.start = 2;
  list.forEach((p, i) => {
    const [name, id, g, a] = p, pts = g + a;
    const li = el('li'); li.style.setProperty('--c', colorOf(id)); li.style.setProperty('--w', (pts / max).toFixed(3));
    const who = el('span', 'ld-r-who'); who.append(el('b', '', name), el('small', '', club(id)));
    const ga = el('span', 'ld-r-ga'); ga.append(el('span', '', g + ' + ' + a));
    li.append(el('span', 'ld-r-n', String(i + 2)), img(id, 32), who, ga, el('b', 'ld-r-p', String(pts)), el('i', 'ld-r-bar'));
    li.setAttribute('aria-label', (i + 2) + '-е место: ' + name + ', ' + club(id) + ', ' + pts + ' ' + plural(pts, 'очко', 'очка', 'очков') + ' (' + g + ' + ' + a + ')');
    ol.append(li);
  });
  return ol;
}

function paint(k) {
  const L = (window.JV_LEAD || {}).lg || {}, list = (L[k] || []).slice().sort((x, y) => (y[2] + y[3]) - (x[2] + x[3]) || y[2] - x[2]).slice(0, 10);
  const body = root.querySelector('.ld-body'), name = (LG.find(x => x[0] === k) || [])[1] || '';
  body.replaceChildren();
  if (!list.length) { body.append(el('p', 'ld-none', 'Данных по лиге пока нет.')); return; }
  body.append(leaderCard(list[0], name), rows(list.slice(1)));
  body.querySelectorAll('.ld-top, .ld-list li').forEach((n, i) => { n.style.setProperty('--d', (i * 35) + 'ms'); });
  body.classList.remove('is-in'); void body.offsetWidth; body.classList.add('is-in');
}

load().then(() => {
  const L = (window.JV_LEAD || {}).lg || {};
  const lgs = LG.filter(x => (L[x[0]] || []).length);
  if (!lgs.length) { root.hidden = true; return; }
  const tabs = root.querySelector('.ld-tabs');
  let cur = lgs[0][0];
  try { const s = sessionStorage.getItem('jv-ld-' + (FOOT ? 'f' : 'h')); if (s && lgs.some(x => x[0] === s)) cur = s; } catch (e) {}
  const btns = lgs.map(([k, n]) => {
    const b = el('button', 'ld-tab'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.k = k; b.id = 'ld-t-' + k;
    b.setAttribute('aria-controls', 'ld-body');
    const i = el('img'); i.src = U('../lg/' + k + '.webp'); i.alt = ''; i.width = i.height = 20; i.onerror = () => i.remove();
    b.append(i, el('span', '', n));
    b.addEventListener('click', () => set(k, true));
    tabs.append(b); return b;
  });
  const set = (k, save) => {
    cur = k;
    btns.forEach(b => { const on = b.dataset.k === k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    root.querySelector('.ld-body').setAttribute('aria-labelledby', 'ld-t-' + k);
    paint(k);
    if (save) try { sessionStorage.setItem('jv-ld-' + (FOOT ? 'f' : 'h'), k); } catch (e) {}
  };
  tabs.addEventListener('keydown', e => {
    const i = btns.findIndex(b => b.dataset.k === cur), d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return; e.preventDefault();
    const n = btns[(i + d + btns.length) % btns.length]; set(n.dataset.k, true); n.focus();
  });
  set(cur, false);
  const b = (window.JV_LEAD || {}).built; if (b) { const x = /(\d{4})-(\d{2})-(\d{2})/.exec(b); if (x) root.querySelector('.ld-upd').textContent = 'Обновлено ' + x[3] + '.' + x[2] + ' · очки — голы плюс результативные передачи'; }
});
})();
