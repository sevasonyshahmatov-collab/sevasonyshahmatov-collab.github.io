/* «Хоккей сегодня» — первый экран /hockey/ (черновик 25.11, редакция 5).
   Задача владельца: блок сразу показывает весь вечер — какие матчи есть и что в них главное, — и сам по очереди
   показывает матчи (как табло «Прогноз дня»: смена каждые 9 с, пауза при наведении, стрелки, полоски, свайп);
   подробная статистика — ниже, в «Сегодня на льду». Три варианта (?hv=7|8|9):
     7 «Сводка и табло» — «Главное за вечер» (сюжеты дня по всем матчам) + сменяющееся табло матчей;
     8 «Афиша»          — большой слайд матча с заголовком-фактом + лента всех матчей вечера;
     9 «Гармошка»       — все матчи вечера панелями в ряд, по очереди раскрывается одна.
   Без градиентов (решение владельца 25.11), шрифты и цвета сайта. Данные: JV_TODAY (расписание, арены), JV_MODEL (расчёт),
   страницы разборов (цвета клубов, форма, дом/выезд, вратари, отдых и дорога, таблица — цифры совпадают с разбором),
   live.js — LIVE и счёт (карточки строки несут data-lv-*, live.js кладёт в них скрытый .lv, отсюда читаем);
   итог сыгранных — один раз из тех же открытых источников. Вывод — textContent и атрибуты (кроме своих SVG-иконок). */
(() => {
'use strict';
const me = document.currentScript, BASE = me && me.src ? me.src.replace(/[^/]*$/, '') : '';
const U = p => new URL(p, BASE).href;
const root = document.getElementById('hsday');
if (!root) return;
document.documentElement.classList.add('hs-on');

const qs = new URLSearchParams(location.search);
const VARS = {7: 'Сводка и табло', 8: 'Афиша', 9: 'Гармошка'};
let hv = String(window.JV_HV || '');                /* вариант выбирает hsday-load.js (черновик: сравнение 1–9) */
if (!VARS[hv]) hv = '7';
root.dataset.hv = hv;
window.JV_HS = {has: k => !!VARS[k], set(k) { if (VARS[k]) { hv = k; paint(); } }};
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROTATE = 9000;                        /* как у табло «Прогноз дня» */

/* ── мелочи ── */
const TZ = 'Europe/Moscow', LG = {khl: 'КХЛ', nhl: 'НХЛ'};
const msk = (ms, o) => new Intl.DateTimeFormat('ru-RU', Object.assign({timeZone: TZ}, o)).format(new Date(ms));
const ymd = ms => new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(ms));
const tms = t => Date.parse(String(t).replace(' ', 'T') + ':00+03:00');
const hm = m => String(m.t).slice(11, 16);
const night = m => +String(m.t).slice(11, 13) < 6;
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
const num = s => { const v = parseFloat(String(s == null ? '' : s).replace(/[\s  ]/g, '').replace('−', '-').replace(',', '.')); return isNaN(v) ? null : v; };
const dec = (x, d = 1) => Number(x).toLocaleString('ru-RU', {minimumFractionDigits: d, maximumFractionDigits: d});
const nameFL = s => { const p = String(s).replace(/\s+[А-ЯЁA-Z]\.$/, '').trim().split(/\s+/); return p.length >= 2 ? p.slice(1).join(' ') + ' ' + p[0] : s; };
const frag = parts => { const f = document.createDocumentFragment(); parts.forEach(p => f.append(Array.isArray(p) ? el('b', '', p[0]) : document.createTextNode(p))); return f; };
const svg = (cls, d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', cls || ''); s.innerHTML = d; return s; };
const I = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  prev: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  next: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  pause: '<path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/>',
};
const FACE_LEFT = {nhl_chi: 1, minnesota: 1, nhl_ana: 1, nhl_fla: 1};    /* как в kupon.js: такие эмблемы гостей кладём поверх */
const rgb = hex => { let h = String(hex || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); const n = parseInt(h.slice(0, 6), 16); return isNaN(n) || h.length < 6 ? null : [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = hex => { const c = rgb(hex); if (!c) return 0; const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
const inkOn = hex => lum(hex) > .19 ? '#0b1220' : '#ffffff';
const onDark = (hex, fb) => { const c = rgb(hex); if (!c) return fb; if (lum(hex) >= .045) return hex; return '#' + c.map(v => Math.round(v + (255 - v) * .38).toString(16).padStart(2, '0')).join(''); };

function loadScript(src) {
  return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
}
const hasPage = m => !!(window.JV_MATCHLINKS || {})[m.key];
const linkOf = m => { const p = (window.JV_MATCHLINKS || {})[m.key]; return p ? U('../../' + p) : '#matches'; };
const crest = id => U('../em/' + id + '.webp');
const crestImg = (id, alt, cls, size) => {
  const im = el('img', cls); im.src = crest(id); im.alt = alt || ''; im.width = size; im.height = size; im.decoding = 'async';
  im.onerror = () => { im.style.visibility = 'hidden'; };
  return im;
};
const pairOf = (m, cls) => { const s = el('span', (cls || 'hs-mini') + (FACE_LEFT[m.a] ? ' aw' : '')); s.setAttribute('aria-hidden', 'true'); s.append(crestImg(m.a, '', 'a', 96), crestImg(m.h, '', 'h', 96)); return s; };
function until(ms) {
  const d = ms - Date.now(); if (d <= 0) return '';
  const mins = Math.max(1, Math.round(d / 6e4)), h = Math.floor(mins / 60), mm = mins % 60;
  if (h >= 24) return msk(ms, {weekday: 'long'}) + ' в ' + msk(ms, {hour: '2-digit', minute: '2-digit'});
  return 'через ' + (h ? h + ' ч ' : '') + mm + ' мин';
}
function button(m, text) {
  const b = el('a', 'hs-btn'); b.href = linkOf(m); b.append(document.createTextNode(text || 'Читать разбор'), svg('', I.arrow));
  b.setAttribute('aria-label', 'Читать разбор: ' + m.hn + ' — ' + m.an); return b;
}
function moreLink(text) { const a = el('a', 'hs-more'); a.href = '#matches'; a.append(document.createTextNode(text || 'Все матчи и статистика'), svg('', I.down)); return a; }
const lbl = (tag, text) => el(tag, 'hs-lbl', text);

/* ── какие матчи показываем: день по Москве; если сегодня игр нет — ближайший игровой день ── */
function pickDay(all) {
  const today = ymd(Date.now()), by = {};
  all.forEach(m => { const d = String(m.t).slice(0, 10); (by[d] = by[d] || []).push(m); });
  if (by[today]) return {day: today, list: by[today]};
  const next = Object.keys(by).filter(d => d > today).sort()[0];
  if (next) return {day: next, list: by[next]};
  const last = Object.keys(by).sort().pop();
  return last ? {day: last, list: by[last]} : {day: today, list: []};
}

/* ── строка матчей ── */
const label = (a, s) => a.setAttribute('aria-label', s + '. Открыть разбор матча');
function card(m) {
  const a = el('a', 'hs-m'); a.href = linkOf(m); a.dataset.lg = m.lg; a.dataset.key = m.key;
  a.dataset.lv = ''; a.dataset.lvLg = m.lg; a.dataset.lvT = new Date(tms(m.t)).toISOString(); a.dataset.lvH = m.h; a.dataset.lvA = m.a;
  a.dataset.lvHn = m.hn; a.dataset.lvAn = m.an;
  const top = el('span', 'hs-mt'); top.append(el('span', 'hs-ml', LG[m.lg]), el('em', 'hs-st', hm(m) + ' МСК'));
  a.append(top);
  [['h', 'hn'], ['a', 'an']].forEach(([id, n]) => {
    const row = el('span', 'hs-tm'); const im = crestImg(m[id], '', '', 26); im.loading = 'lazy';
    row.append(im, el('span', 'hs-tn', m[n]), el('b', 'hs-g')); a.append(row);
  });
  label(a, LG[m.lg] + ', ' + m.hn + ' — ' + m.an + ', начало в ' + hm(m) + ' МСК');
  return a;
}
function short(stTxt) {                    /* «2-й период, 08:42» → «2П · 08:42» */
  const s = String(stTxt || '');
  let m = /^(\d)-й период(?:,\s*(.+))?/.exec(s); if (m) return m[1] + 'П' + (m[2] ? ' · ' + m[2] : '');
  m = /^Овертайм(?:,\s*(.+))?/.exec(s); if (m) return 'ОТ' + (m[1] ? ' · ' + m[1] : '');
  if (/^Буллиты/.test(s)) return 'Б';
  return s;
}
const ST = {};                             /* ключ матча → {k: live|final|done, hg, ag, st} */
function setScore(a, k, hg, ag, stTxt) {
  const g = a.querySelectorAll('.hs-g'), rows = a.querySelectorAll('.hs-tm'), s = a.querySelector('.hs-st'), nm = a.querySelectorAll('.hs-tn');
  g[0].textContent = hg; g[1].textContent = ag;
  a.classList.toggle('is-live', k === 'live'); a.classList.toggle('is-final', k === 'final' || k === 'done');
  rows[0].classList.toggle('lose', k === 'final' && +hg < +ag); rows[1].classList.toggle('lose', k === 'final' && +ag < +hg);
  const lg = a.querySelector('.hs-ml').textContent;
  if (k === 'live') { const p = short(stTxt); s.textContent = 'LIVE' + (p ? ' · ' + p : ''); label(a, lg + ', ' + nm[0].textContent + ' — ' + nm[1].textContent + ', идёт, счёт ' + hg + ':' + ag); }
  else if (k === 'final') { s.textContent = 'Итог' + (stTxt ? ' · ' + stTxt : ''); label(a, lg + ', ' + nm[0].textContent + ' — ' + nm[1].textContent + ', итог ' + hg + ':' + ag); }
  else if (k === 'done') s.textContent = 'Завершён';
  ST[a.dataset.key] = {k, hg, ag, st: k === 'live' ? short(stTxt) : (stTxt || '')};
  clocks();
}
function watchLive(a) {
  /* live.js кладёт скрытый .lv прямо в карточку. Следим только за ним (свои правки в карточке наблюдатель не видит,
     иначе запись счёта снова будила бы наблюдатель — бесконечный цикл), одинаковые состояния пропускаем. */
  let last = '';
  const read = () => {
    const b = a.querySelector(':scope > .lv'); if (!b || b.hidden) return;
    const h = b.querySelector('.lv-h'), w = b.querySelector('.lv-a'); if (!h || !w || h.textContent === '') return;
    const fin = b.classList.contains('lv-final'), st = fin ? '' : ((b.querySelector('.lv-st') || {}).textContent || '');
    const key = (fin ? 'f' : 'l') + h.textContent + ':' + w.textContent + '|' + st;
    if (key === last) return;
    last = key;
    setScore(a, fin ? 'final' : 'live', h.textContent, w.textContent, st);
  };
  const inner = new MutationObserver(read);
  new MutationObserver(() => {
    const b = a.querySelector(':scope > .lv');
    if (b && !b.__hsw) { b.__hsw = 1; inner.observe(b, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class']}); read(); }
  }).observe(a, {childList: true});
}
const KHL_TID = {8: 'dinamo_msk', 10: 'avangard', 12: 'amur', 16: 'cska', 18: 'spartak', 22: 'torpedo', 24: 'sibir', 26: 'lokomotiv', 28: 'traktor', 30: 'metallurg',
  32: 'salavat', 36: 'neftekhimik', 38: 'dinamo_minsk', 40: 'akbars', 42: 'severstal', 44: 'ska', 46: 'barys', 56: 'avtomobilist', 61: 'admiral', 105: 'lada',
  113: 'sochi', 315: 'shanghai'};
function getJSON(url) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 10000);
  return fetch(url, {signal: c.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}).then(r => r.ok ? r.json() : Promise.reject(r.status)).finally(() => clearTimeout(t));
}
function otOf(j, a) {                      /* НХЛ: «Final/OT», «Final/SO» */
  try {
    for (const ev of j.events || []) {
      if (Math.abs(Date.parse(ev.date) - Date.parse(a.dataset.lvT)) > 4 * 36e5) continue;
      const d = (ev.status && ev.status.type && ev.status.type.shortDetail) || '';
      if (/SO/.test(d)) return 'Б'; if (/OT/.test(d)) return 'ОТ';
    }
  } catch (e) {}
  return '';
}
async function finals(cards) {               /* итог матчей, окно live.js для которых уже закрыто (начало > 3,5 ч назад) */
  const old = cards.filter(a => Date.now() > Date.parse(a.dataset.lvT) + 3.5 * 36e5);
  if (!old.length) return;
  old.forEach(a => setScore(a, 'done', '', '', ''));
  const nhl = old.filter(a => a.dataset.lg === 'nhl'), khl = old.filter(a => a.dataset.lg === 'khl');
  if (nhl.length && window.JVLive && JVLive._fromEspn) {
    const ny = a => new Intl.DateTimeFormat('en-CA', {timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(a.dataset.lvT)).replace(/-/g, '');
    for (const d of [...new Set(nhl.map(ny))]) {
      try {
        const j = await getJSON('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=' + d);
        nhl.filter(a => ny(a) === d).forEach(a => {
          const r = JVLive._fromEspn({lg: 'nhl', start: Date.parse(a.dataset.lvT), h: a.dataset.lvH, a: a.dataset.lvA, enh: '', ena: ''}, j);
          if (r && r.k === 'final') setScore(a, 'final', r.hg, r.ag, otOf(j, a));
        });
      } catch (e) {}
    }
  }
  if (khl.length) {
    const st = khl.map(a => Date.parse(a.dataset.lvT));
    const from = Math.floor((Math.min(...st) - 36e5) / 1000), to = Math.floor((Math.max(...st) + 4 * 36e5) / 1000);
    try {
      const arr = await getJSON('https://khl.api.webcaster.pro/api/khl_mobile/events_v2.json?order_direction=asc&page=1&q%5Bstart_at_gt_time_from_unixtime%5D=' + from +
        '&q%5Bstart_at_lt_time_from_unixtime%5D=' + to + '&stage_id=407');
      khl.forEach(a => {
        for (const w of (Array.isArray(arr) ? arr : [])) {
          const e = w.event || w;
          if (KHL_TID[e.team_a && e.team_a.id] !== a.dataset.lvH || KHL_TID[e.team_b && e.team_b.id] !== a.dataset.lvA) continue;
          if (String(e.game_state_key) !== 'finished') continue;
          const m = /^\s*(\d+)\s*:\s*(\d+)/.exec(String(e.score || '')); if (!m) continue;
          const sc = e.scores || {}, has = k => sc[k] != null && String(sc[k]).trim() !== '';
          setScore(a, 'final', m[1], m[2], has('bullitt') ? 'Б' : has('overtime') ? 'ОТ' : '');
        }
      });
    } catch (e) {}
  }
}
const stateOf = m => { const s = ST[m.key], t = tms(m.t), now = Date.now();
  if (s && (s.k === 'final' || s.k === 'done')) return 'past';
  if (s && s.k === 'live') return 'live';
  return now < t ? 'up' : now < t + 3 * 36e5 ? 'live' : 'past'; };

/* часы на первом экране: время или счёт + плашка состояния — у всех элементов с data-ck=ключ */
function clocks() {
  root.querySelectorAll('[data-ck]').forEach(c => {
    const m = (C && C.byKey[c.dataset.ck] || {}).m; if (!m) return;
    const s = ST[m.key], t = c.querySelector('.hs-ck-t'), p = c.querySelector('.hs-ck-p');
    if (s && (s.k === 'live' || s.k === 'final')) { t.textContent = s.hg + ':' + s.ag; p.textContent = (s.k === 'live' ? 'LIVE' : 'Итог') + (s.st ? ' · ' + s.st : ''); p.className = 'hs-ck-p ' + (s.k === 'live' ? 'is-live' : 'is-final'); return; }
    t.textContent = hm(m);
    const st = stateOf(m); p.className = 'hs-ck-p';
    p.textContent = st === 'up' ? until(tms(m.t)) : st === 'live' ? 'идёт' : 'сыгран';
  });
  root.querySelectorAll('[data-st]').forEach(n => {          /* короткое состояние в лентах и панелях */
    const m = (C && C.byKey[n.dataset.st] || {}).m; if (!m) return;
    const s = ST[m.key];
    n.classList.toggle('is-live', !!s && s.k === 'live');
    n.textContent = s && s.k === 'live' ? 'LIVE ' + s.hg + ':' + s.ag : s && s.k === 'final' ? 'Итог ' + s.hg + ':' + s.ag
      : stateOf(m) === 'up' ? hm(m) + ' МСК' : stateOf(m) === 'live' ? 'идёт' : 'сыгран';
  });
}

/* ── факты со страницы разбора (то, что человек там увидит) ── */
const DOCS = new Map();
function factsOf(m) {
  if (!DOCS.has(m.key)) DOCS.set(m.key, !hasPage(m) ? Promise.resolve({}) :
    fetch(linkOf(m), {credentials: 'same-origin'}).then(r => r.ok ? r.text() : '').then(t => parse(t ? new DOMParser().parseFromString(t, 'text/html') : null)).catch(() => ({})));
  return DOCS.get(m.key);
}
function parse(doc) {
  const F = {};
  if (!doc) return F;
  try {
    const hero = doc.querySelector('.mx-hero'), st = hero ? hero.getAttribute('style') || '' : '';
    ['hc', 'ac'].forEach(k => { const x = new RegExp('--' + k + ':\\s*(#[0-9a-f]{3,8})', 'i').exec(st); if (x) F[k] = x[1]; });
    const where = [...doc.querySelectorAll('.mx-team small')].map(n => n.textContent.trim());
    if (where.length === 2) F.where = where.map(s => s.replace(/,\s*/, ' · '));
    const fc = [...doc.querySelectorAll('.mx-fc')];
    if (fc.length === 2) F.dots = fc.map(c => [...c.querySelectorAll('.mx-dots li')].map(li => ({r: li.classList.contains('r-w') ? 'w' : 'l', t: li.getAttribute('title') || ''})));
    const ha = doc.querySelector('table.mq-ha');
    if (ha) {
      F.ha = {};
      ha.querySelectorAll('tbody tr').forEach(tr => {
        const k = (tr.querySelector('th') || {}).textContent || '', td = [...tr.querySelectorAll('td')].map(n => n.textContent.replace(/\s+/g, ' ').trim());
        if (/^Побед/.test(k)) F.ha.w = td.map(t => { const x = /(\d+)\D+(\d+)/.exec(t); return x ? [+x[1], +x[2]] : null; });
        else if (/^Забивают/.test(k)) F.ha.gf = td.map(num);
        else if (/^Пропускают/.test(k)) F.ha.ga = td.map(num);
      });
    }
    const tab = doc.querySelector('table.mt-tab');
    if (tab) F.tbl = [...tab.querySelectorAll('tbody tr')].map(tr => { const td = tr.querySelectorAll('td'); return td.length >= 6 ? {place: num(td[0].textContent), pts: num(td[5].textContent)} : null; });
    const sec = id => { const h = doc.getElementById(id); return h ? h.closest('section') : null; };
    const rest = sec('mq-rest');
    if (rest) F.rest = [...rest.querySelectorAll('.mq-card')].slice(0, 2).map(c => [...c.querySelectorAll('.mq-tiles li')].map(li => ({
      v: ((li.querySelector('b') || {}).textContent || '').trim(), l: ((li.querySelector('span') || {}).textContent || '').trim(),
      s: ((li.querySelector('small') || {}).textContent || '').trim(), warn: li.classList.contains('warn')})));
    const gk = sec('mq-gk');
    if (gk) F.gk = [...gk.querySelectorAll('.mq-card')].slice(0, 2).map(c => [...c.querySelectorAll('tbody tr')].map(tr => {
      const td = tr.querySelectorAll('td'); if (td.length < 4) return null;
      const n0 = td[0].childNodes[0]; return {n: (n0 ? n0.textContent : td[0].textContent).trim(), gp: num(td[1].textContent), sv: num(td[2].textContent)};
    }).filter(Boolean));
    const bar = doc.querySelector('.mx-bar');
    if (bar) { const v = [...bar.querySelectorAll('i')].map(i => num((i.querySelector('b') || {}).textContent)); if (v.length === 3 && v.every(x => x != null)) F.bar = v; }
  } catch (e) {}
  return F;
}
const tile = (list, re) => (list || []).find(t => re.test(t.l));
/* яркие факты матча: head — короткий заголовок, text — фраза; всё из разбора */
function factsFor(m, F) {
  const out = [], nm = s => s === 'h' ? m.hn : m.an, S = ['h', 'a'];
  const add = f => out.push(Object.assign({m}, f));
  (F.dots || []).forEach((d, i) => {
    if (!d || d.length < 3) return;
    const r = d[d.length - 1].r; let n = 0;
    for (let j = d.length - 1; j >= 0 && d[j].r === r; j--) n++;
    if (n < 3) return;
    const s = S[i], w = r === 'w', unit = (w ? plural(n, 'победа', 'победы', 'побед') : plural(n, 'поражение', 'поражения', 'поражений')) + ' подряд';
    add({kind: w ? 'streak' : 'slump', s, score: w ? 40 + (n - 3) * 10 : 30 + (n - 3) * 8, n, big: String(n), unit, head: nm(s) + ' — ' + n + ' ' + unit,
      text: [nm(s) + ' подходит к матчу с серией из ', [n + ' ' + (w ? 'побед' : 'поражений') + ' подряд'], '.']});
  });
  (F.gk || []).forEach((list, i) => {
    const g = (list || []).filter(x => x.gp >= 10 && x.sv != null).sort((a, b) => b.gp - a.gp)[0];
    if (!g || g.sv < 92.5) return;
    const s = S[i], who = nameFL(g.n);
    add({kind: 'gk', s, score: 30 + (g.sv - 92.5) * 20, n: g.sv, who, big: dec(g.sv) + ' %', unit: 'отражённых бросков', head: who + ' отражает ' + dec(g.sv) + ' % бросков',
      text: [who + ' (' + nm(s) + ') отражает ', [dec(g.sv) + ' % бросков'], ' за сезон.']});
  });
  const w = (F.ha || {}).w || [];
  [[0, .65, 'дома'], [1, .55, 'в гостях']].forEach(([i, hi, where]) => {
    const x = w[i]; if (!x || x[1] < 8 || x[0] / x[1] < hi) return;
    const s = S[i];
    add({kind: 'wins', s, score: 30 + (x[0] / x[1] - hi) * 80, big: x[0] + ' из ' + x[1], unit: 'побед ' + where, head: nm(s) + ' ' + where + ' выигрывает ' + x[0] + ' из ' + x[1],
      text: [nm(s) + ' ' + where + ' выигрывает ', [x[0] + ' ' + plural(x[0], 'матч', 'матча', 'матчей') + ' из ' + x[1]], '.']});
  });
  const ha = F.ha || {};
  if (ha.ga && ha.ga[1] != null && ha.ga[1] >= 3) add({kind: 'ga', s: 'a', score: 26 + (ha.ga[1] - 3) * 20, big: dec(ha.ga[1]), unit: 'шайбы за игру пропускает в гостях',
    head: m.an + ' пропускает в гостях ' + dec(ha.ga[1]) + ' за игру', text: [m.an + ' в гостях пропускает в среднем ', [dec(ha.ga[1]) + ' шайбы за игру'], '.']});
  if (ha.gf && ha.gf[0] != null && ha.gf[0] >= 3.2) add({kind: 'gf', s: 'h', score: 26 + (ha.gf[0] - 3.2) * 20, big: dec(ha.gf[0]), unit: 'шайбы за игру забивает дома',
    head: m.hn + ' забивает дома ' + dec(ha.gf[0]) + ' за игру', text: [m.hn + ' дома забивает в среднем ', [dec(ha.gf[0]) + ' шайбы за игру'], '.']});
  const t = F.tbl || [];
  if (t[0] && t[1] && t[0].place && t[1].place && Math.max(t[0].place, t[1].place) <= 4)
    add({kind: 'top', s: null, score: 38 + (4 - Math.max(t[0].place, t[1].place)) * 4, big: t[0].place + '-е и ' + t[1].place + '-е', unit: 'места в таблице',
      head: 'Обе команды — в первой четвёрке', text: ['Встречаются команды из первой четвёрки: ', [m.hn + ' — ' + t[0].place + '-е место, ' + m.an + ' — ' + t[1].place + '-е'], '.']});
  const R = F.rest || [], km = tile(R[1], /км/), k = km ? num(km.v) : 0;
  if (k >= 1200) {
    const rest = tile(R[1], /отдых/), tz = /разница во времени\s*(.+)/.exec(km.s || '');
    add({kind: 'travel', s: 'a', score: 26 + k / 150 + (tz ? 4 : 0), n: k, big: km.v + ' км', unit: 'перелёт гостей', head: m.an + ' — ' + km.v + ' км перелёта',
      text: [m.an + ' — ', [km.v + ' км перелёта'], (tz ? ', смена времени ' + tz[1] : '') + (rest ? ' и ' + rest.v + ' ' + rest.l + ' перед игрой' : '') + '.']});
  }
  return out.sort((a, b) => b.score - a.score);
}

/* ── данные вечера ── */
let C = null;
function build(day, list, Fs) {
  const rows = list.map((m, i) => {
    const F = Fs[i] || {}, md = (window.JV_MODEL || {})[m.key];
    const p = md && md.p1 != null && md.x != null && md.p2 != null ? [md.p1, md.x, md.p2].map(v => Math.round(v * 100)) : F.bar || null;
    const facts = factsFor(m, F);
    return {m, i, F, p, lam: md && Array.isArray(md.lam) ? md.lam : null, facts, best: facts[0] || null,
      hc: onDark(F.hc, '#5ab8ff'), ac: onDark(F.ac, '#9aa9d8')};
  });
  const byKey = {}; rows.forEach(r => { byKey[r.m.key] = r; });
  return {day, rows, byKey};
}
/* с какого матча начинать показ: идущий, иначе ближайший не начавшийся, иначе первый */
function startIndex(rows) {
  const live = rows.findIndex(r => stateOf(r.m) === 'live'); if (live >= 0) return live;
  const up = rows.findIndex(r => stateOf(r.m) === 'up'); return up >= 0 ? up : 0;
}
function summary(Cx) {
  const n = Cx.rows.length, k = Cx.rows.filter(r => r.m.lg === 'khl').length, h = n - k;
  const parts = ['Сегодня ', [n + ' ' + plural(n, 'матч', 'матча', 'матчей')], k && h ? ': ' + k + ' в КХЛ и ' + h + ' в НХЛ.' : k ? ' КХЛ.' : ' НХЛ.'];
  const live = Cx.rows.filter(r => stateOf(r.m) === 'live'), up = Cx.rows.filter(r => stateOf(r.m) === 'up' && !night(r.m));
  const started = Cx.rows.some(r => stateOf(r.m) !== 'up' && !night(r.m));
  if (live.length) parts.push(' Сейчас идёт: ' + live.map(r => r.m.hn + ' — ' + r.m.an).join(', ') + '.');
  if (up.length) parts.push(started ? ' Следующий матч — в ' : ' Первая шайба — в ', [hm(up[0].m) + ' МСК'], '.');
  const nightPast = Cx.rows.filter(r => night(r.m) && stateOf(r.m) === 'past');
  if (nightPast.length) parts.push(' Ночн' + (nightPast.length > 1 ? 'ые матчи' : 'ой матч') + ' НХЛ уже ' + (nightPast.length > 1 ? 'сыграны' : 'сыгран') + '.');
  return parts;
}
/* сюжеты вечера: выводы по всем матчам сразу, по возможности про разные матчи */
function storylines(Cx) {
  const open = Cx.rows.filter(r => stateOf(r.m) !== 'past'), pool = open.length ? open : Cx.rows;
  const cand = [];
  const withP = pool.filter(r => r.p);
  if (withP.length > 1) {
    const eq = withP.slice().sort((a, b) => Math.abs(a.p[0] - a.p[2]) - Math.abs(b.p[0] - b.p[2]))[0];
    cand.push({r: eq, label: 'Самый равный матч', head: eq.m.hn + ' — ' + eq.m.an, sub: eq.p[0] + ' % на ' + eq.p[2] + ' % по расчёту модели'});
  }
  const pick = kind => pool.map(r => { const f = r.facts.find(x => x.kind === kind); return f ? {r, f} : null; }).filter(Boolean).sort((a, b) => b.f.score - a.f.score)[0];
  const s = pick('streak'); if (s) cand.push({r: s.r, label: 'Серия вечера', head: s.f.head, sub: s.r.m.hn + ' — ' + s.r.m.an});
  const g = pick('gk'); if (g) cand.push({r: g.r, label: 'Вратарь вечера', head: g.f.head, sub: (g.f.s === 'h' ? g.r.m.hn : g.r.m.an) + ' · ' + g.r.m.hn + ' — ' + g.r.m.an});
  const t = pick('travel'); if (t) cand.push({r: t.r, label: 'Дальняя дорога', head: t.f.head, sub: t.r.m.hn + ' — ' + t.r.m.an});
  const gl = pool.filter(r => r.lam).sort((a, b) => (b.lam[0] + b.lam[1]) - (a.lam[0] + a.lam[1]))[0];
  if (gl) cand.push({r: gl, label: 'Больше всего шайб', head: gl.m.hn + ' — ' + gl.m.an, sub: dec(gl.lam[0] + gl.lam[1]) + ' ожидаемых шайбы по расчёту модели'});
  const tp = pick('top'); if (tp) cand.push({r: tp.r, label: 'Встреча лидеров', head: tp.r.m.hn + ' — ' + tp.r.m.an, sub: tp.f.head});
  const out = [], used = new Set();
  cand.forEach(c => { if (out.length < 3 && !used.has(c.r.m.key)) { out.push(c); used.add(c.r.m.key); } });
  cand.forEach(c => { if (out.length < 3 && !out.includes(c)) out.push(c); });
  return out;
}

/* ── детали матча (общие кирпичики слайдов) ── */
function clockEl(r, cls) {
  const c = el('div', 'hs-ck ' + (cls || '')); c.dataset.ck = r.m.key;
  c.append(el('b', 'hs-ck-t', hm(r.m)), el('span', 'hs-ck-p'));
  return c;
}
function modelEl(r) {
  const box = el('div', 'hs-md');
  if (!r.p) { box.append(el('small', 'hs-md-x', 'Расчёт модели появится ближе к матчу')); return box; }
  const m = r.m, b = el('span', 'hs-mb'); b.setAttribute('role', 'img');
  b.setAttribute('aria-label', 'Расчёт модели: победа ' + m.hn + ' ' + r.p[0] + ' %, ничья в основное время ' + r.p[1] + ' %, победа ' + m.an + ' ' + r.p[2] + ' %');
  [[r.p[0], r.hc, ''], [r.p[1], '', 'x'], [r.p[2], r.ac, '']].forEach(([v, c, cls]) => {
    const i = el('i', cls); i.style.flex = String(Math.max(v, 1)); if (c) { i.style.setProperty('--c', c); i.style.setProperty('--k', inkOn(c)); }
    if (v >= 12) i.append(el('b', '', v + ' %'));
    b.append(i);
  });
  const legend = el('span', 'hs-md-l'); legend.setAttribute('aria-hidden', 'true'); legend.append(el('span', '', m.hn), el('span', '', 'ничья'), el('span', '', m.an));
  box.append(lbl('span', 'Расчёт модели'), b, legend);
  if (r.lam) box.append(el('small', 'hs-md-x', 'ожидаемые шайбы ' + dec(r.lam[0]) + ' : ' + dec(r.lam[1])));
  return box;
}
function factEl(r) {
  const p = el('p', 'hs-fl');
  if (r.best) p.append(frag(r.best.text));
  else p.append(document.createTextNode('Форма, вратари, личные встречи и расчёт модели — в разборе матча.'));
  return p;
}
function teamsEl(r, tag) {
  const m = r.m, h = el(tag || 'h3', 'hs-tt2'); h.append(el('span', '', m.hn + ' —'), document.createTextNode(' '), el('span', '', m.an));
  return h;
}
function whereEl(r) {
  const ar = r.m.arena && typeof r.m.arena === 'object' ? r.m.arena : null;
  if (!ar || !ar.name) return null;
  const p = el('p', 'hs-wh'); p.append(svg('', I.pin), el('span', '', ar.name + (ar.city ? ', ' + ar.city : '')));
  return p;
}

/* ── движок смены матчей (как у табло «Прогноз дня»: 9 с, пауза при наведении, свайп, стрелки) ── */
let TIMERS = [], DESTROY = [];
function rotator(o) {
  /* o: {n, host, show(i, dir)} — host получает класс is-paused; полоски прогресса — элементы с [data-prog] */
  let cur = -1, t = 0, hold = false, user = false;
  const run = () => {
    clearTimeout(t);
    const stop = RM || user || hold || o.n < 2 || document.hidden;
    o.host.classList.toggle('is-paused', stop);
    o.host.style.setProperty('--hs-rot', ROTATE + 'ms');
    if (!stop) t = setTimeout(() => go(cur + 1, 1), ROTATE);
  };
  const restartProg = () => o.host.querySelectorAll('[data-prog].is-run').forEach(p => { p.classList.remove('is-run'); void p.offsetWidth; p.classList.add('is-run'); });
  const go = (i, dir) => {
    i = ((i % o.n) + o.n) % o.n;
    const d = cur < 0 ? 0 : (dir || (i > cur ? 1 : -1));
    cur = i; o.show(i, d);
    o.host.querySelectorAll('[data-prog]').forEach(p => { p.classList.remove('is-run'); void p.offsetWidth; if (+p.dataset.prog === i) p.classList.add('is-run'); });
    run();
  };
  o.host.addEventListener('mouseenter', () => { hold = true; run(); });
  o.host.addEventListener('mouseleave', () => { hold = false; restartProg(); run(); });
  o.host.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) { hold = true; run(); } });
  o.host.addEventListener('focusout', e => { if (!o.host.contains(e.relatedTarget)) { hold = false; run(); } });
  o.host.addEventListener('keydown', e => {
    if (e.target.closest('a')) return;
    if (e.key === 'ArrowRight') { go(cur + 1, 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(cur - 1, -1); e.preventDefault(); }
  });
  let sx = null, sy = 0;
  o.host.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive: true});
  o.host.addEventListener('touchend', e => { if (sx === null) return; const p = e.changedTouches[0], dx = p.clientX - sx, dy = p.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }, {passive: true});
  const vis = () => run(); document.addEventListener('visibilitychange', vis);
  DESTROY.push(() => { clearTimeout(t); document.removeEventListener('visibilitychange', vis); });
  return {
    go, next: () => go(cur + 1, 1), prev: () => go(cur - 1, -1), get cur() { return cur; },
    toggle() { user = !user; run(); if (!user) restartProg(); return user; },
  };
}
function controls(rot) {
  const box = el('div', 'hs-ctl');
  const mk = (cls, icon, text, fn) => { const b = el('button', 'hs-ctl-b' + (cls ? ' ' + cls : '')); b.type = 'button'; b.setAttribute('aria-label', text); b.append(svg('', icon)); b.addEventListener('click', fn); return b; };
  const pause = mk('hs-pause', I.pause, 'Остановить смену матчей', () => {
    const paused = rot.toggle(); pause.setAttribute('aria-pressed', String(paused)); pause.setAttribute('aria-label', paused ? 'Продолжить смену матчей' : 'Остановить смену матчей');
    pause.replaceChildren(svg('', paused ? I.play : I.pause));
  });
  pause.setAttribute('aria-pressed', 'false');
  if (RM) pause.hidden = true;
  box.append(mk('', I.prev, 'Предыдущий матч', () => rot.prev()), pause, mk('', I.next, 'Следующий матч', () => rot.next()));
  return box;
}
function animateIn(node, dir) {
  if (RM || !dir || !node.animate) return;
  node.animate([{opacity: 0, transform: 'translateX(' + (24 * dir) + 'px)'}, {opacity: 1, transform: 'none'}], {duration: 420, easing: 'cubic-bezier(.23,1,.32,1)'});
}
const markStrip = key => root.querySelectorAll('.hs-m').forEach(a => a.classList.toggle('is-main', a.dataset.key === key));
function slideHead(r, withMeta, i, n) {
  const m = r.m, head = el('div', 'hs-sl-head'), info = el('div', 'hs-sl-info');
  if (withMeta) { const meta = el('p', 'hs-ps-meta'); meta.append(el('span', 'hs-chip', LG[m.lg]), el('span', '', 'Матч ' + (i + 1) + ' из ' + n)); info.append(meta); }
  info.append(teamsEl(r));
  const w = whereEl(r); if (w) info.append(w);
  head.append(pairOf(m, 'hs-pair2'), info, clockEl(r));
  return head;
}

/* три цифры вечера под сводкой: матчи по лигам, первая (следующая) шайба, сколько шайб ждёт модель */
function statsEl(Cx) {
  const rows = Cx.rows, n = rows.length, k = rows.filter(r => r.m.lg === 'khl').length, h = n - k;
  const box = el('ul', 'hs-st3'); box.setAttribute('role', 'list');
  const tile = (v, l, extra) => { const li = el('li'); li.append(el('b', '', v), el('span', '', l)); if (extra) li.append(extra); box.append(li); };
  const lgs = el('span', 'hs-st3-lg');
  [['khl', k], ['nhl', h]].forEach(([g, c]) => { if (!c) return; const s = el('small'); const im = el('img'); im.src = U('../lg/' + g + '.webp'); im.alt = ''; im.width = im.height = 16; s.append(im, document.createTextNode(LG[g] + ' · ' + c)); lgs.append(s); });
  tile(String(n), plural(n, 'матч', 'матча', 'матчей') + ' сегодня', lgs);
  const up = rows.filter(r => stateOf(r.m) === 'up' && !night(r.m)), started = rows.some(r => stateOf(r.m) !== 'up' && !night(r.m));
  tile(up.length ? hm(up[0].m) : '—', up.length ? (started ? 'следующий матч, МСК' : 'первая шайба, МСК') : 'все матчи начались');
  const lam = rows.filter(r => r.lam);
  if (lam.length) { const t = lam.reduce((a, r) => a + r.lam[0] + r.lam[1], 0); tile('≈\u2009' + Math.round(t), plural(Math.round(t), 'шайбу', 'шайбы', 'шайб') + ' ждёт модель за вечер'); }
  return box;
}
/* форма команд: пять последних матчей, свежий справа; место из разбора */
function formEl(r) {
  const D = r.F.dots; if (!D || D.length !== 2 || !D[0] || !D[1]) return null;
  const m = r.m, box = el('div', 'hs-fm'); box.append(lbl('span', 'Форма · 5 последних'));
  const g = el('div', 'hs-fm-g');
  [[m.h, m.hn, D[0], r.hc, 0], [m.a, m.an, D[1], r.ac, 1]].forEach(([id, nm, d, c, i]) => {
    const row = el('div', 'hs-fm-r'); row.style.setProperty('--c', c);
    const dots = el('span', 'hs-fm-d'); const last = d.slice(-5), w = last.filter(x => x.r === 'w').length;
    dots.setAttribute('role', 'img'); dots.setAttribute('aria-label', nm + ': ' + w + ' ' + plural(w, 'победа', 'победы', 'побед') + ' в ' + last.length + ' последних матчах');
    last.forEach(x => { const i2 = el('i', x.r); if (x.t) i2.title = x.t; dots.append(i2); });
    const nmE = el('span', 'hs-fm-n'); nmE.append(el('b', '', nm)); const wh = (r.F.where || [])[i]; if (wh) nmE.append(el('small', '', wh));
    row.append(nmE, dots); g.append(row);
  });
  box.append(g); return box;
}

/* ═════ 7 · «Сводка и табло» ═════ */
function paintV7(Cx, main) {
  main.classList.add('hs-v7');
  const sumW = el('div', 'hs-v7-sum'), sumP = el('p', 'hs-sum'); sumP.append(frag(summary(Cx))); sumW.append(sumP, statsEl(Cx));
  const sl = storylines(Cx), ol = el('ol', 'hs-sl');
  const slW = el('div', 'hs-v7-sl'); slW.append(lbl('h2', 'Главное за вечер'), ol, moreLink());
  const board = el('section', 'hs-board'); board.setAttribute('aria-roledescription', 'карусель'); board.setAttribute('aria-label', 'Матчи вечера');
  const stripe = el('i', 'hs-bd-stripe'); stripe.setAttribute('aria-hidden', 'true');
  const top = el('div', 'hs-bd-top'), counter = el('span', 'hs-bd-n'), meta = el('span', 'hs-bd-meta');
  top.append(counter, meta);
  const stage = el('div', 'hs-bd-stage');
  const pager = el('div', 'hs-pg'); pager.setAttribute('role', 'group'); pager.setAttribute('aria-label', 'Выбор матча');
  board.append(stripe, top, stage, pager);
  main.append(sumW, board, slW);
  const n = Cx.rows.length;
  const show = (i, dir) => {
    const r = Cx.rows[i], m = r.m;
    counter.textContent = 'Матч ' + (i + 1) + ' из ' + n;
    meta.replaceChildren(el('span', 'hs-chip', LG[m.lg]), document.createTextNode((night(m) ? 'ночью, ' : '') + hm(m) + ' МСК'));
    const s = el('div', 'hs-slide'); s.setAttribute('role', 'group'); s.setAttribute('aria-roledescription', 'слайд'); s.setAttribute('aria-label', (i + 1) + ' из ' + n + ': ' + m.hn + ' — ' + m.an);
    const ct = el('div', 'hs-ctas'); ct.append(button(m, 'Читать разбор'));
    board.style.setProperty('--hc', r.hc); board.style.setProperty('--ac', r.ac);
    const fm = formEl(r);
    s.append(slideHead(r, false), modelEl(r)); if (fm) s.append(fm); s.append(factEl(r), ct);
    stage.replaceChildren(s); animateIn(s, dir);
    pager.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    ol.querySelectorAll('.hs-sli').forEach(b => b.classList.toggle('is-on', +b.dataset.i === i));
    markStrip(m.key); clocks();
  };
  const rot = rotator({n, host: board, show});
  Cx.rows.forEach((r, i) => {
    const b = el('button'); b.type = 'button'; b.setAttribute('aria-label', r.m.hn + ' — ' + r.m.an + ', ' + hm(r.m));
    const pr = el('i', 'hs-prog'); pr.dataset.prog = i; b.append(pr); b.addEventListener('click', () => rot.go(i));
    pager.append(b);
  });
  top.append(controls(rot));
  sl.forEach(c => {
    const li = el('li'), b = el('button', 'hs-sli'); b.type = 'button'; b.dataset.i = c.r.i;
    b.append(pairOf(c.r.m, 'hs-mini hs-sli-p'), el('span', 'hs-sli-l', c.label), el('b', 'hs-sli-h', c.head), el('span', 'hs-sli-s', c.sub + ' · ' + hm(c.r.m)), svg('hs-sli-go', I.arrow));
    b.addEventListener('click', () => { rot.go(c.r.i); if (innerWidth <= 860) board.scrollIntoView({behavior: RM ? 'auto' : 'smooth', block: 'nearest'}); });
    li.append(b); ol.append(li);
  });
  if (!sl.length) ol.append(el('li', 'hs-sl-none', 'Сюжеты вечера появятся, когда будут готовы разборы матчей.'));
  rot.go(startIndex(Cx.rows));
}

/* ═════ 8 · «Афиша» ═════ */
function paintV8(Cx, main) {
  main.classList.add('hs-v8');
  const sumP = el('p', 'hs-sum'); sumP.append(frag(summary(Cx)));
  const poster = el('section', 'hs-poster'); poster.setAttribute('aria-roledescription', 'карусель'); poster.setAttribute('aria-label', 'Матчи вечера');
  const stage = el('div', 'hs-ps-stage');
  const rail = el('div', 'hs-rail'); rail.setAttribute('role', 'group'); rail.setAttribute('aria-label', 'Все матчи вечера');
  poster.append(stage, rail);
  main.append(sumP, poster);
  const n = Cx.rows.length;
  const show = (i, dir) => {
    const r = Cx.rows[i], m = r.m;
    const s = el('div', 'hs-slide hs-ps'); s.setAttribute('role', 'group'); s.setAttribute('aria-roledescription', 'слайд'); s.setAttribute('aria-label', (i + 1) + ' из ' + n + ': ' + m.hn + ' — ' + m.an);
    s.style.setProperty('--hc', r.hc); s.style.setProperty('--ac', r.ac);
    const txt = el('div', 'hs-ps-txt');
    const meta = el('p', 'hs-ps-meta'); meta.append(el('span', 'hs-chip', LG[m.lg]), el('span', '', 'Матч ' + (i + 1) + ' из ' + n));
    const h = el('h2', 'hs-ps-h', (r.best ? r.best.head : m.hn + ' — ' + m.an).replace(/(\d) /g, '$1\u00a0').replace(/ (%|км)/g, '\u00a0$1'));
    const sub = el('p', 'hs-ps-sub'); sub.append(el('b', '', m.hn + ' — ' + m.an), document.createTextNode(' · ' + (night(m) ? 'ночью, ' : 'сегодня в ') + hm(m) + ' МСК'));
    const ar = m.arena && typeof m.arena === 'object' ? m.arena : null; if (ar && ar.name) sub.append(document.createTextNode(' · ' + ar.name + (ar.city ? ', ' + ar.city : '')));
    const ct = el('div', 'hs-ctas'); ct.append(button(m, 'Читать разбор'), moreLink());
    txt.append(meta, h, sub, modelEl(r), ct);
    const art = el('div', 'hs-ps-art'); art.setAttribute('aria-hidden', 'true');
    const discs = el('span', 'hs-discs'); discs.append(el('i', 'h'), el('i', 'a'));
    art.append(discs, pairOf(m, 'hs-pair2 hs-big'), clockEl(r, 'hs-ck-art'));
    s.append(txt, art);
    stage.replaceChildren(s); animateIn(s, dir);
    rail.querySelectorAll('.hs-rl').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    markStrip(m.key); clocks();
  };
  const rot = rotator({n, host: poster, show});
  Cx.rows.forEach((r, i) => {
    const b = el('button', 'hs-rl'); b.type = 'button'; b.setAttribute('aria-label', r.m.hn + ' — ' + r.m.an + ', ' + hm(r.m));
    const st = el('span', 'hs-rl-st'); st.dataset.st = r.m.key;
    const nm = el('span', 'hs-rl-n', r.m.hn + ' — ' + r.m.an);
    const pr = el('i', 'hs-prog'); pr.dataset.prog = i;
    b.append(pairOf(r.m), st, nm, pr); b.addEventListener('click', () => rot.go(i));
    rail.append(b);
  });
  poster.append(controls(rot));
  rot.go(startIndex(Cx.rows));
}

/* ═════ 9 · «Гармошка» ═════ */
function paintV9(Cx, main) {
  main.classList.add('hs-v9');
  const sumP = el('p', 'hs-sum'); sumP.append(frag(summary(Cx)));
  const acc = el('section', 'hs-acc'); acc.setAttribute('aria-roledescription', 'карусель'); acc.setAttribute('aria-label', 'Матчи вечера');
  const row = el('div', 'hs-acc-row');
  acc.append(row);
  main.append(sumP, acc);
  const n = Cx.rows.length, panels = [];
  let rot = null;
  Cx.rows.forEach((r, i) => {
    const m = r.m, p = el('div', 'hs-ac'); p.style.setProperty('--hc', r.hc); p.style.setProperty('--ac', r.ac);
    const tab = el('button', 'hs-ac-tab'); tab.type = 'button'; tab.setAttribute('aria-expanded', 'false'); tab.id = 'hs-ac-t' + i;
    tab.setAttribute('aria-label', m.hn + ' — ' + m.an + ', ' + hm(m) + '. Показать матч');
    const st = el('span', 'hs-ac-st'); st.dataset.st = m.key;
    const cr = el('span', 'hs-ac-cr'); cr.append(crestImg(m.h, '', '', 56), crestImg(m.a, '', '', 56));
    const nm = el('span', 'hs-ac-n'); nm.append(el('b', '', m.hn), el('b', '', m.an));
    tab.append(el('span', 'hs-chip', LG[m.lg]), st, cr, nm);
    const body = el('div', 'hs-ac-body'); body.setAttribute('role', 'region'); body.setAttribute('aria-labelledby', 'hs-ac-t' + i);
    const ct = el('div', 'hs-ctas'); ct.append(button(m, 'Читать разбор'));
    body.append(slideHead(r, true, i, n), modelEl(r), factEl(r), ct);
    const pr = el('i', 'hs-prog'); pr.dataset.prog = i;
    p.append(tab, body, pr);
    tab.addEventListener('click', () => rot.go(i));
    row.append(p); panels.push({p, tab, body});
  });
  const show = i => {
    panels.forEach((x, j) => { const on = j === i; x.p.classList.toggle('is-open', on); x.tab.setAttribute('aria-expanded', String(on)); x.body.inert = !on; });
    markStrip(Cx.rows[i].m.key); clocks();
  };
  rot = rotator({n, host: acc, show});
  acc.append(controls(rot));
  rot.go(startIndex(Cx.rows));
}

/* ── сборка ── */
function paint() {
  TIMERS.forEach(clearInterval); TIMERS = []; DESTROY.forEach(f => f()); DESTROY = [];
  root.dataset.hv = hv;
  const main = root.querySelector('.hs-main'), hx = root.querySelector('.hs-hx');
  main.textContent = ''; main.className = 'hs-main'; main.removeAttribute('style'); hx.textContent = ''; hx.className = 'hs-hx';
  if (!C || !C.rows.length) { main.hidden = true; return; }
  main.hidden = false;
  ({7: paintV7, 8: paintV8, 9: paintV9}[hv] || paintV7)(C, main, hx);
  TIMERS.push(setInterval(clocks, 30000));
  clocks();
}
function switcher() {
  if (!/\/draft\//.test(location.pathname) && !qs.has('hv')) return;
  const box = el('div', 'hs-vsw'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Вариант первого экрана');
  box.append(el('span', 'hs-vsw-l', 'Вариант'));
  Object.keys(VARS).forEach(k => {
    const b = el('button', '', k + ' · ' + VARS[k]); b.type = 'button'; b.setAttribute('aria-pressed', String(k === hv));
    b.addEventListener('click', () => {
      hv = k; try { sessionStorage.setItem('jv-hv7', k); } catch (e) {}
      const u = new URL(location.href); u.searchParams.set('hv', k); history.replaceState(null, '', u);
      box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      paint();
    });
    box.append(b);
  });
  document.body.append(box);
}

async function render() {
  if (!window.JV_MATCHLINKS) await loadScript(U('../../data/matchlinks.js'));
  const all = ((window.JV_TODAY || {}).matches || []).filter(m => LG[m.lg]);
  const {day, list} = pickDay(all);
  list.sort((x, y) => tms(x.t) - tms(y.t) || (x.lg > y.lg ? 1 : -1));
  const dms = tms(day + ' 12:00'), today = ymd(Date.now());

  /* дата: плашка и строка рубрики */
  const dt = root.querySelector('.hs-date'); dt.textContent = '';
  const mon = el('small'); mon.append(el('span', '', msk(dms, {day: 'numeric', month: 'long'}).replace(/^\d+\s*/, '')), el('i', '', ' · '), el('span', '', 'МСК'));
  dt.append(el('span', '', msk(dms, {weekday: 'long'})), el('b', '', msk(dms, {day: 'numeric'})), mon);
  const kick = root.querySelector('.hs-kick'); kick.textContent = '';
  kick.append(el('i'), document.createTextNode('Хоккей'), el('span', '', '·'), document.createTextNode(cap(msk(dms, {weekday: 'long'})) + ', ' + msk(dms, {day: 'numeric', month: 'long'})));
  if (day !== today) { const h = root.querySelector('.hs-h1'); h.textContent = 'Хоккей '; h.append(el('em', '', day > today ? 'завтра' : 'вчера')); }

  /* строка */
  const sc = root.querySelector('.hs-sc'); sc.textContent = '';
  const cards = list.map(card);
  if (cards.length) cards.forEach(a => { sc.append(a); watchLive(a); });
  else sc.append(el('p', 'hs-none', 'Сегодня матчей КХЛ и НХЛ нет. Ближайшие игры — ниже, в разделе «Сегодня на льду».'));

  /* первый экран: данные всех матчей дня — со страниц разборов */
  const Fs = await Promise.all(list.map(factsOf));
  C = build(day, list, Fs);
  root.querySelector('.hs-main').classList.remove('is-sk');
  paint();
  if (cards.length) {
    document.dispatchEvent(new Event('jv:rows'));
    setTimeout(() => document.dispatchEvent(new Event('jv:rows')), 4000);   /* если live.js был занят первым опросом */
    finals(cards);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
