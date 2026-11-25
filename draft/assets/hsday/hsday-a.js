/* «Хоккей сегодня» — первый экран /hockey/ (черновик 25.11): ВАРИАНТЫ 1–6 для сравнения (подключает hsday-load.js).
   Редакция 4 — три новых варианта, разные по содержанию (?hv=4|5|6):
     4 «Цифра дня»       — самая яркая цифра вечера из разборов (серия, вратарь, игра дома/в гостях, место в таблице) + ещё цифры;
     5 «Расклад модели»  — расчёт JARVIS на каждый матч вечера ровными полосами в цветах клубов + самый равный матч;
     6 «Вечер по часам»  — лента вечера: время, арена, отдых и перелёты, отметка «сейчас».
   Прошлые варианты оставлены для сравнения: ?hv=1 «Разворот», 2 «Табло», 3 «Медальоны». Выбор запоминается на вкладку;
   в черновике — переключатель внизу слева. Без градиентов: только ровные заливки (решение владельца 25.11).
   Данные: window.JV_TODAY (data/today.js) — расписание и арены; window.JV_MODEL (data/model.js) — расчёт модели;
   data/matchlinks.js — адреса разборов; страница разбора — цвета клубов, форма, дом/выезд, вратари, отдых и дорога, таблица
   (цифры берём оттуда, чтобы человек нашёл их в разборе); live.js — LIVE и счёт (карточки строки несут data-lv-*,
   live.js кладёт в них скрытый .lv, отсюда читаем); итог сыгранных (окно live.js закрыто) — один раз из тех же открытых
   источников (ESPN для НХЛ, приложение КХЛ). Вывод — только textContent и атрибуты (кроме своих иконок SVG). */
(() => {
'use strict';
const me = document.currentScript, BASE = me && me.src ? me.src.replace(/[^/]*$/, '') : '';
const U = p => new URL(p, BASE).href;
const root = document.getElementById('hsday');
if (!root) return;
document.documentElement.classList.add('hs-on');

const qs = new URLSearchParams(location.search);
const VARS = {4: 'Цифра дня', 5: 'Расклад модели', 6: 'Вечер по часам', 1: 'Разворот', 2: 'Табло', 3: 'Медальоны'};
const GROUPS = [['Новые', ['4', '5', '6']], ['Прошлые', ['1', '2', '3']]];
let hv = String(window.JV_HV || '');                /* вариант выбирает hsday-load.js (черновик: сравнение 1–9) */
if (!VARS[hv]) hv = '4';
root.dataset.hv = hv;
window.JV_HS = {has: k => !!VARS[k], set(k) { if (VARS[k]) { hv = k; paint(); } }};

/* ── мелочи ── */
const TZ = 'Europe/Moscow', LG = {khl: 'КХЛ', nhl: 'НХЛ'};
const msk = (ms, o) => new Intl.DateTimeFormat('ru-RU', Object.assign({timeZone: TZ}, o)).format(new Date(ms));
const ymd = ms => new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(ms));
const tms = t => Date.parse(String(t).replace(' ', 'T') + ':00+03:00');
const hm = m => String(m.t).slice(11, 16);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
const num = s => { const v = parseFloat(String(s == null ? '' : s).replace(/[\s  ]/g, '').replace('−', '-').replace(',', '.')); return isNaN(v) ? null : v; };
const dec = (x, d = 1) => Number(x).toLocaleString('ru-RU', {minimumFractionDigits: d, maximumFractionDigits: d});
const nameFL = s => { const p = String(s).replace(/\s+[А-ЯЁA-Z]\.$/, '').trim().split(/\s+/); return p.length >= 2 ? p.slice(1).join(' ') + ' ' + p[0] : s; };
const frag = parts => { const f = document.createDocumentFragment(); parts.forEach(p => f.append(Array.isArray(p) ? el('b', '', p[0]) : document.createTextNode(p))); return f; };
const svg = (cls, d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', cls || ''); s.innerHTML = d; return s; };
const I_ARROW = '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
const I_DOWN = '<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
const I_PIN = '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/>';
const I_ROUTE = '<path d="M5 18h9a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="5" cy="18" r="2" fill="currentColor"/><circle cx="19" cy="6" r="2" fill="currentColor"/>';
const FACE_LEFT = {nhl_chi: 1, minnesota: 1, nhl_ana: 1, nhl_fla: 1};    /* как в kupon.js: такие эмблемы гостей кладём поверх */

/* цвета: читаемый текст на плашке клуба и защита от слишком тёмного цвета на тёмном фоне */
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
const mini = m => { const s = el('span', 'hs-mini' + (FACE_LEFT[m.a] ? ' aw' : '')); s.setAttribute('aria-hidden', 'true'); s.append(crestImg(m.a, '', 'a', 44), crestImg(m.h, '', 'h', 44)); return s; };
function until(ms) {
  const d = ms - Date.now(); if (d <= 0) return '';
  const mins = Math.max(1, Math.round(d / 6e4)), h = Math.floor(mins / 60), mm = mins % 60;
  if (h >= 24) return msk(ms, {weekday: 'long'}) + ' в ' + msk(ms, {hour: '2-digit', minute: '2-digit'});
  return 'через ' + (h ? h + ' ч ' : '') + mm + ' мин';
}
function button(m, text) {
  const b = el('a', 'hs-btn'); b.href = linkOf(m); b.append(document.createTextNode(text || 'Читать разбор'), svg('', I_ARROW));
  b.setAttribute('aria-label', 'Читать разбор: ' + m.hn + ' — ' + m.an); return b;
}
function moreLink() { const a = el('a', 'hs-more'); a.href = '#matches'; a.append(document.createTextNode('Все матчи дня'), svg('', I_DOWN)); return a; }
function ctas(m, text) { const c = el('div', 'hs-ctas'); c.append(button(m, text), moreLink()); return c; }
function lbl(tag, text) { const h = el(tag, 'hs-lbl', text); return h; }

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
const label = (a, s) => a.setAttribute('aria-label', s + '. Открыть разбор матча');
function short(stTxt) {                    /* «2-й период, 08:42» → «2П · 08:42» */
  const s = String(stTxt || '');
  let m = /^(\d)-й период(?:,\s*(.+))?/.exec(s); if (m) return m[1] + 'П' + (m[2] ? ' · ' + m[2] : '');
  m = /^Овертайм(?:,\s*(.+))?/.exec(s); if (m) return 'ОТ' + (m[1] ? ' · ' + m[1] : '');
  if (/^Буллиты/.test(s)) return 'Б';
  return s;
}
const ST = {};                             /* ключ матча → {k: live|final|done, hg, ag, st} */
const MAIN = {key: '', set: null};
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
  sync(a.dataset.key);
}
function sync(key) {                       /* перенести состояние матча во все его строки на первом экране */
  const s = ST[key]; if (!s) return;
  if (key === MAIN.key && MAIN.set) MAIN.set(s.k, s.hg, s.ag, s.st);
  root.querySelectorAll('[data-row]').forEach(r => { if (r.dataset.row === key) paintRow(r, s); });
  if (typeof REFLOW === 'function') REFLOW();
}
function paintRow(r, s) {
  r.classList.toggle('is-live', s.k === 'live'); r.classList.toggle('is-final', s.k === 'final' || s.k === 'done');
  const rs = r.querySelector('.hs-rs'); if (!rs) return;
  rs.className = 'hs-rs' + (s.k === 'live' ? ' is-live' : ' is-final');
  rs.textContent = s.k === 'live' ? 'LIVE · ' + s.hg + ':' + s.ag + (s.st ? ' · ' + s.st : '')
    : s.k === 'final' ? 'Итог ' + s.hg + ':' + s.ag + (s.st ? ' · ' + s.st : '') : 'Завершён';
}
let REFLOW = null;
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

/* итог матчей, окно live.js для которых уже закрыто (начало > 3,5 ч назад) */
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
async function finals(cards) {
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
    ['hc', 'ac', 'hi', 'ai'].forEach(k => { const x = new RegExp('--' + k + ':\\s*(#[0-9a-f]{3,8})', 'i').exec(st); if (x) F[k] = x[1]; });
    const where = [...doc.querySelectorAll('.mx-team small')].map(n => n.textContent.trim());
    if (where.length === 2) F.where = where.map(s => s.replace(/,\s*/, ' · '));
    const fc = [...doc.querySelectorAll('.mx-fc')];
    if (fc.length === 2) {
      F.dots = fc.map(c => [...c.querySelectorAll('.mx-dots li')].map(li => ({r: li.classList.contains('r-w') ? 'w' : 'l', t: li.getAttribute('title') || ''})));
      F.form = fc.map(c => { const x = /(\d+)\D+(\d+)/.exec((c.querySelector('h3 small') || {}).textContent || ''); return x ? [+x[1], +x[2]] : null; });
    }
    const ha = doc.querySelector('table.mq-ha');
    if (ha) {
      F.ha = {};
      ha.querySelectorAll('tbody tr').forEach(tr => {
        const k = (tr.querySelector('th') || {}).textContent || '', td = [...tr.querySelectorAll('td')].map(n => n.textContent.replace(/\s+/g, ' ').trim());
        if (/^Побед/.test(k)) F.ha.w = td.map(t => { const x = /(\d+)\D+(\d+)/.exec(t); return x ? [+x[1], +x[2]] : null; });
        else if (/^Забивают/.test(k)) F.ha.gf = td.map(num);
        else if (/^Пропускают/.test(k)) F.ha.ga = td.map(num);
      });
      F.wins = F.ha.w;
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
      const n0 = td[0].childNodes[0]; return {n: (n0 ? n0.textContent : td[0].textContent).trim(), gp: num(td[1].textContent), sv: num(td[2].textContent), gaa: num(td[3].textContent)};
    }).filter(Boolean));
    const bar = doc.querySelector('.mx-bar');
    if (bar) { const v = [...bar.querySelectorAll('i')].map(i => num((i.querySelector('b') || {}).textContent)); if (v.length === 3 && v.every(x => x != null)) F.bar = v; }
  } catch (e) {}
  return F;
}

/* ── «цифры»: яркие факты матча, только из разбора ── */
function factsFor(m, F) {
  const out = [], nm = s => s === 'h' ? m.hn : m.an, S = ['h', 'a'];
  const add = f => out.push(Object.assign({m}, f));
  (F.dots || []).forEach((d, i) => {               /* серия в конце формы: свежие матчи справа */
    if (!d || d.length < 3) return;
    const r = d[d.length - 1].r; let n = 0;
    for (let j = d.length - 1; j >= 0 && d[j].r === r; j--) n++;
    if (n < 3) return;
    const s = S[i], w = r === 'w';
    add({kind: 'streak', s, score: w ? 40 + (n - 3) * 10 : 32 + (n - 3) * 8, big: String(n),
      unit: (w ? plural(n, 'победа', 'победы', 'побед') : plural(n, 'поражение', 'поражения', 'поражений')) + ' подряд', who: nm(s),
      text: [nm(s) + ' подходит к матчу с серией из ', [n + ' ' + (w ? 'побед' : 'поражений') + ' подряд'], '.'], ctx: 'side'});
  });
  (F.gk || []).forEach((list, i) => {               /* основной вратарь (больше всех игр) с высоким процентом */
    const g = (list || []).filter(x => x.gp >= 10 && x.sv != null).sort((a, b) => b.gp - a.gp)[0];
    if (!g || g.sv < 92.5) return;
    const s = S[i], who = nameFL(g.n);
    add({kind: 'gk', s, score: 30 + (g.sv - 92.5) * 20, big: dec(g.sv) + ' %', unit: 'отражённых бросков', who: who + ', ' + nm(s),
      text: [who + ' (' + nm(s) + ') отражает ', [dec(g.sv) + ' % бросков'], ' за сезон.'], ctx: 'gk'});
  });
  const w = F.wins || [];
  const winFact = (i, hi, lo, where) => {
    const x = w[i]; if (!x || x[1] < 8) return;
    const r = x[0] / x[1], s = S[i], txt = n => [n + ' ' + plural(n, 'матч', 'матча', 'матчей') + ' из ' + x[1]];
    if (r >= hi) add({kind: 'wins', s, score: 30 + (r - hi) * 80, big: x[0] + ' из ' + x[1], unit: 'побед ' + where, who: nm(s), text: [nm(s) + ' ' + where + ' выигрывает ', txt(x[0]), '.'], ctx: 'side'});
    else if (r <= lo) add({kind: 'wins', s, score: 26 + (lo - r) * 60, big: x[0] + ' из ' + x[1], unit: 'побед ' + where, who: nm(s), text: [nm(s) + ' ' + where + ' выигрывает только ', txt(x[0]), '.'], ctx: 'side'});
  };
  winFact(0, .65, .3, 'дома'); winFact(1, .55, .3, 'в гостях');
  const ha = F.ha || {};
  if (ha.ga && ha.ga[1] != null && ha.ga[1] >= 3) add({kind: 'ga', s: 'a', score: 26 + (ha.ga[1] - 3) * 20, big: dec(ha.ga[1]), unit: 'шайбы за игру пропускает в гостях', who: m.an,
    text: [m.an + ' в гостях пропускает в среднем ', [dec(ha.ga[1]) + ' шайбы за игру'], '.'], ctx: 'side'});
  if (ha.gf && ha.gf[0] != null && ha.gf[0] >= 3.2) add({kind: 'gf', s: 'h', score: 26 + (ha.gf[0] - 3.2) * 20, big: dec(ha.gf[0]), unit: 'шайбы за игру забивает дома', who: m.hn,
    text: [m.hn + ' дома забивает в среднем ', [dec(ha.gf[0]) + ' шайбы за игру'], '.'], ctx: 'side'});
  const t = F.tbl || [];
  if (t[0] && t[1] && t[0].place && t[1].place && Math.max(t[0].place, t[1].place) <= 4)
    add({kind: 'top', s: null, score: 38 + (4 - Math.max(t[0].place, t[1].place)) * 4, big: t[0].place + '-е и ' + t[1].place + '-е', unit: 'места в таблице', who: m.hn + ' и ' + m.an,
      text: ['Встречаются команды из первой четвёрки: ', [m.hn + ' — ' + t[0].place + '-е место, ' + m.an + ' — ' + t[1].place + '-е'], '.'], ctx: 'match'});
  return out;
}
function ctxLine(f) {
  const m = f.m, st = stateOf(m);
  if (st === 'past') return ' Матч уже сыгран — в разборе всё, что было до него.';
  if (st === 'live') return ' Матч идёт прямо сейчас.';
  if (f.ctx === 'side') return ' Сегодня в ' + hm(m) + ' МСК команда играет ' + (f.s === 'h' ? 'дома' : 'в гостях') + '.';
  if (f.ctx === 'gk') return ' Сегодня в ' + hm(m) + ' МСК его команда играет ' + (f.s === 'h' ? 'дома' : 'в гостях') + '.';
  return ' Матч начнётся в ' + hm(m) + ' МСК.';
}
const splitUnit = u => {                           /* подпись к большой цифре — в две строки примерно поровну */
  const w = u.split(' '); if (w.length < 2) return [u];
  let best = 1, bd = 1e9;
  for (let i = 1; i < w.length; i++) { const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length); if (d < bd) { bd = d; best = i; } }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
};

/* ═════ 4 · «Цифра дня» ═════ */
function paintV4(C, main) {
  main.classList.add('hs-v4');
  const now = Date.now(), all = [];
  C.rows.forEach(r => factsFor(r.m, r.F).forEach(f => { const t = tms(r.m.t); f.rank = f.score + (now < t ? 6 : now < t + 3 * 36e5 ? -4 : -30); all.push(f); }));
  all.sort((a, b) => b.rank - a.rank);
  let hero = all[0];
  if (!hero) {                                     /* фактов нет — цифрой становится сам вечер */
    const n = C.rows.length, k = C.rows.filter(r => r.m.lg === 'khl').length, m = (C.rows.find(r => stateOf(r.m) === 'up') || C.rows[0]).m;
    hero = {m, s: null, big: String(n), unit: plural(n, 'матч', 'матча', 'матчей') + ' сегодня', who: 'КХЛ — ' + k + ', НХЛ — ' + (n - k),
      text: ['Расчёт модели, форма, вратари и личные встречи — в разборе каждого матча.'], ctx: 'none'};
  }
  /* ещё цифры: сначала несыгранные матчи, по одной цифре на матч и по возможности разного рода; сыгранные — только если мало */
  const more = [], usedM = new Set([hero.m.key]), usedK = new Set([hero.kind]);
  const open = all.filter(f => f !== hero && stateOf(f.m) !== 'past'), past = all.filter(f => f !== hero && stateOf(f.m) === 'past');
  const take = (list, fresh) => list.forEach(f => { if (more.length < 3 && !more.includes(f) && !usedM.has(f.m.key) && (!fresh || !usedK.has(f.kind))) { more.push(f); usedM.add(f.m.key); usedK.add(f.kind); } });
  take(open, true); take(open, false);
  open.forEach(f => { if (more.length < 3 && !more.includes(f) && !(f.m === hero.m && f.kind === hero.kind)) more.push(f); });
  if (more.length < 2) take(past, false);
  const m = hero.m;

  const box = el('div', 'hs-n');
  const fig = el('div', 'hs-n-fig');
  const big = el('b', 'hs-n-big', hero.big); big.dataset.len = hero.big.length <= 2 ? 's' : hero.big.length <= 5 ? 'm' : 'l';
  const unit = el('span', 'hs-n-unit'); splitUnit(hero.unit).forEach(l => unit.append(el('span', '', l)));
  fig.append(big, unit);
  const who = el('p', 'hs-n-who');
  if (hero.s) who.append(crestImg(hero.s === 'h' ? m.h : m.a, '', '', 44)); else who.append(mini(m));
  who.append(el('b', '', hero.who));
  const txt = el('p', 'hs-n-text'); txt.append(frag(hero.text)); if (hero.ctx !== 'none') txt.append(document.createTextNode(ctxLine(hero)));
  const where = el('p', 'hs-n-where'); where.append(el('span', 'hs-chip', LG[m.lg]), document.createTextNode(m.hn + ' — ' + m.an + ' · ' + hm(m) + ' МСК'));
  box.append(lbl('p', 'Цифра дня'), fig, who, txt, where, ctas(m, 'Читать разбор'));

  const side = el('aside', 'hs-nl'); side.setAttribute('aria-labelledby', 'hs-nl-h');
  const h = lbl('h2', 'Ещё цифры вечера'); h.id = 'hs-nl-h'; side.append(h);
  const ul = el('ul');
  more.forEach(f => {
    const li = el('li'), a = el('a', 'hs-ni'); a.href = linkOf(f.m);
    const sm = el('small'); sm.append(el('span', 'hs-chip', LG[f.m.lg]), document.createTextNode(f.m.hn + ' — ' + f.m.an + ' · ' + hm(f.m)));
    a.append(el('b', '', f.big), el('span', '', f.unit), el('em', '', f.who), sm);
    li.append(a); ul.append(li);
  });
  if (!more.length) ul.append(el('li', 'hs-ni-none', 'Другие матчи вечера — в строке сверху и ниже, в «Сегодня на льду».'));
  side.append(ul);
  main.append(box, side);
  return m.key;
}

/* ═════ 5 · «Расклад модели» ═════ */
function paintV5(C, main, hx) {
  main.classList.add('hs-v5');
  const now = Date.now();
  const rows = C.rows.map(r => {
    const md = (window.JV_MODEL || {})[r.m.key];
    let p = md && md.p1 != null && md.x != null && md.p2 != null ? [md.p1, md.x, md.p2].map(v => Math.round(v * 100)) : r.F.bar || null;
    return {m: r.m, F: r.F, p, lam: md && Array.isArray(md.lam) ? md.lam : null};
  });
  const withP = rows.filter(r => r.p), up = withP.filter(r => tms(r.m.t) > now);
  const eq = (up.length ? up : withP).slice().sort((a, b) => Math.abs(a.p[0] - a.p[2]) - Math.abs(b.p[0] - b.p[2]))[0];
  const open = withP.filter(r => stateOf(r.m) !== 'past');
  const favR = open.slice().sort((a, b) => Math.max(b.p[0], b.p[2]) - Math.max(a.p[0], a.p[2]))[0];
  const fav = favR && favR !== eq && Math.max(favR.p[0], favR.p[2]) >= 50 ? favR : null;
  const golR = rows.filter(r => r.lam && stateOf(r.m) !== 'past').sort((a, b) => (b.lam[0] + b.lam[1]) - (a.lam[0] + a.lam[1]))[0];
  const gol = golR && golR !== eq && golR !== fav && golR.lam[0] + golR.lam[1] >= 5.4 ? golR : null;

  hx.className = 'hs-hx hs-sub';
  hx.textContent = 'Расклад модели JARVIS на ' + rows.length + ' ' + plural(rows.length, 'матч', 'матча', 'матчей') + ' вечера';

  if (eq) {
    const co = el('div', 'hs-co');
    const t = el('p', 'hs-co-t');
    t.append(frag([eq.m.hn + ' — ' + eq.m.an + ': ', [eq.p[0] + ' % против ' + eq.p[2] + ' %'], ' по расчёту модели, ещё ' + eq.p[1] + ' % — ничья в основное время. Самая непредсказуемая игра вечера, ' + hm(eq.m) + ' МСК.']));
    co.append(lbl('p', 'Самый равный матч вечера'), t, ctas(eq.m, 'Читать разбор'));
    main.append(co);
  }
  const list = el('div', 'hs-mr-list');
  const head = el('div', 'hs-mr-head'); head.setAttribute('aria-hidden', 'true');
  ['Начало', 'Матч', 'Победа хозяев · ничья в осн. время · победа гостей', ''].forEach(x => head.append(el('span', '', x)));
  const ul = el('ul', 'hs-mr-ul');
  rows.forEach(r => {
    const m = r.m, li = el('li'), a = el('a', 'hs-mr'); a.href = linkOf(m); a.dataset.row = m.key;
    const t = el('span', 'hs-mr-t'); t.append(el('b', '', hm(m)), el('span', 'hs-rs', +m.t.slice(11, 13) < 6 ? 'ночью' : until(tms(m.t)) || 'идёт'));
    const nm = el('span', 'hs-mr-m'), nn = el('span', 'hs-mr-n');
    const ar = m.arena && typeof m.arena === 'object' ? m.arena : null;
    nn.append(el('b', '', m.hn + ' — ' + m.an), el('small', '', LG[m.lg] + (ar && ar.name ? ' · ' + ar.name + (ar.city ? ', ' + ar.city : '') : '')));
    nm.append(mini(m), nn);
    const bc = el('span', 'hs-mr-bc');
    if (r.p) {
      const hc = onDark(r.F.hc, '#5ab8ff'), ac = onDark(r.F.ac, '#9aa9d8');
      const b = el('span', 'hs-mr-b'); b.setAttribute('role', 'img');
      b.setAttribute('aria-label', 'Победа ' + m.hn + ' ' + r.p[0] + ' %, ничья в основное время ' + r.p[1] + ' %, победа ' + m.an + ' ' + r.p[2] + ' %');
      [[r.p[0], hc, ''], [r.p[1], '', 'x'], [r.p[2], ac, '']].forEach(([v, c, cls]) => {
        const i = el('i', cls); i.style.flex = String(Math.max(v, 1)); if (c) { i.style.setProperty('--c', c); i.style.setProperty('--k', inkOn(c)); }
        if (v >= 13) i.append(el('b', '', v + ' %'));
        b.append(i);
      });
      bc.append(b);
      if (r.lam) bc.append(el('small', '', 'ожидаемые шайбы ' + dec(r.lam[0]) + ' : ' + dec(r.lam[1])));
    } else bc.append(el('small', '', 'расчёт модели появится ближе к матчу'));
    const tag = el('span', 'hs-mr-tag');
    if (r === eq) { tag.textContent = 'Самый равный'; tag.classList.add('eq'); }
    else if (r === fav) tag.textContent = 'Фаворит: ' + (r.p[0] >= r.p[2] ? m.hn : m.an) + ' ' + Math.max(r.p[0], r.p[2]) + ' %';
    else if (r === gol) tag.textContent = 'Больше всего шайб: ' + dec(r.lam[0] + r.lam[1]);
    else tag.classList.add('is-empty');
    a.append(t, nm, bc, tag, svg('hs-mr-go', I_ARROW));
    li.append(a); ul.append(li);
  });
  list.append(head, ul);
  main.append(list, el('p', 'hs-mr-note', 'Шансы — расчёт модели JARVIS, результат не гарантирован. Ничья — в основное время, ожидаемые шайбы — среднее по модели. 18+'));
  const tick = () => main.querySelectorAll('.hs-mr').forEach(a => {
    const m = C.rows.find(r => r.m.key === a.dataset.row).m, rs = a.querySelector('.hs-rs');
    if (ST[m.key] || +m.t.slice(11, 13) < 6) return;
    rs.textContent = until(tms(m.t)) || (Date.now() < tms(m.t) + 3 * 36e5 ? 'идёт' : 'сыгран');
  });
  TIMERS.push(setInterval(tick, 30000));
  return eq ? eq.m.key : '';
}

/* ═════ 6 · «Вечер по часам» ═════ */
function logistics(F) {
  const R = F.rest; if (!R || R.length < 2) return null;
  const tile = (list, re) => (list || []).find(t => re.test(t.l));
  const hr = tile(R[0], /отдых/), ar = tile(R[1], /отдых/), km = tile(R[1], /км/);
  const out = [];
  if (hr) out.push('Хозяева: ', [hr.v + ' ' + hr.l]);
  if (ar) {
    out.push(hr ? ' · Гости: ' : 'Гости: ', [ar.v + ' ' + ar.l]);
    const k = km ? num(km.v) : null;
    if (k) { const tz = /разница во времени\s*(.+)/.exec(km.s || ''); out.push(', перелёт ', km.warn ? [km.v + ' км'] : km.v + ' км', tz ? ' (' + tz[1] + ')' : ''); }
  }
  return out.length ? out : null;
}
function paintV6(C, main, hx) {
  main.classList.add('hs-v6');
  hx.className = 'hs-hx hs-now';
  const nowT = el('b', 'hs-now-t'), nowL = el('span', 'hs-now-l', 'МСК · сейчас'), nowN = el('span', 'hs-now-n');
  hx.append(nowT, nowL, nowN);
  const ol = el('ol', 'hs-tl');
  const items = C.rows.map(r => {
    const m = r.m, li = el('li', 'hs-tl-i'); li.dataset.row = m.key;
    const t = el('div', 'hs-tl-t'); t.append(el('b', '', hm(m)), el('small', 'hs-tl-d', +m.t.slice(11, 13) < 6 ? 'ночью' : ''), el('span', 'hs-rs'));
    const node = el('i', 'hs-tl-node'); node.setAttribute('aria-hidden', 'true');
    const c = el('div', 'hs-tl-c');
    const h = el('div', 'hs-tl-h'); const n = el('h3', 'hs-tl-n', m.hn + ' — ' + m.an);
    h.append(el('span', 'hs-chip', LG[m.lg]), mini(m), n);
    c.append(h);
    const ar = m.arena && typeof m.arena === 'object' ? m.arena : null;
    if (ar && ar.name) {
      const v = el('p', 'hs-tl-v'); v.append(svg('', I_PIN), el('span', '', ar.name + (ar.city ? ', ' + ar.city : '') + (ar.capacity ? ' · ' + Number(ar.capacity).toLocaleString('ru-RU') + ' ' + plural(ar.capacity, 'место', 'места', 'мест') : '')));
      c.append(v);
    }
    const lg = logistics(r.F);
    if (lg) { const p = el('p', 'hs-tl-r'), sp = el('span'); sp.append(frag(lg)); p.append(svg('', I_ROUTE), sp); c.append(p); }
    const act = el('div', 'hs-tl-a'); c.append(act);
    li.append(t, node, c);
    ol.append(li);
    return {m, li, act, rs: t.querySelector('.hs-rs')};
  });
  const nowLi = el('li', 'hs-tl-now'); nowLi.setAttribute('aria-label', 'Сейчас');
  const nt = el('div', 'hs-tl-t', 'Сейчас'), nn = el('i', 'hs-tl-node'), nc = el('div', 'hs-tl-c'); nc.append(el('i', 'hs-tl-line'), el('span', 'hs-tl-nowt'));
  nowLi.append(nt, nn, nc);
  main.append(ol);
  let nextKey = '';
  const day0 = C.day + ' 12:00';
  REFLOW = () => {                         /* раскладка по времени: сыгранные, идущие, ближайший, остальные; отметка «сейчас» */
    const now = Date.now(); let next = null;
    items.forEach(x => { const st = stateOf(x.m); x.st = st; if (st === 'up' && !next) next = x; });
    items.forEach(x => {
      x.li.classList.toggle('is-past', x.st === 'past'); x.li.classList.toggle('is-live', x.st === 'live'); x.li.classList.toggle('is-next', x === next);
      x.act.textContent = '';
      if (x === next) x.act.append(ctas(x.m, 'Читать разбор'));
      else { const a = el('a', 'hs-tl-link'); a.href = linkOf(x.m); a.append(document.createTextNode(x.st === 'past' ? 'Разбор матча' : 'Разбор матча'), svg('', I_ARROW)); x.act.append(a); }
      if (!ST[x.m.key]) x.rs.textContent = x.st === 'up' ? until(tms(x.m.t)) : x.st === 'live' ? 'идёт' : 'сыгран';
    });
    const first = items.find(x => x.st === 'up');        /* «сейчас» — после начавшихся, перед ближайшим */
    if (first) ol.insertBefore(nowLi, first.li); else ol.append(nowLi);
    const hmNow = msk(now, {hour: '2-digit', minute: '2-digit'});
    nowT.textContent = hmNow; nc.lastChild.textContent = hmNow;
    const started = items.some(x => x.st !== 'up' && tms(x.m.t) >= tms(day0));
    nowN.textContent = next ? (started ? 'следующий матч — ' : 'до первой шайбы — ') + until(tms(next.m.t)).replace(/^через /, started ? 'через ' : '')
      : items.some(x => x.st === 'live') ? 'матч идёт прямо сейчас' : 'все матчи дня сыграны';
    if (next) nextKey = next.m.key;
  };
  REFLOW();
  TIMERS.push(setInterval(REFLOW, 30000));
  return nextKey;
}

/* ═════ 1–3 · прошлые варианты: «Разворот», «Табло», «Медальоны» ═════ */
function chooseMain(list) {
  const force = qs.get('hs');
  if (force) { const f = list.find(m => m.key === force) || list.find(m => m.key.split('|').slice(2).includes(force)); if (f) return f; }
  const now = Date.now(), withPage = list.filter(hasPage);
  const pool = withPage.length ? withPage : list;
  const next = pool.filter(m => tms(m.t) > now).sort((x, y) => tms(x.t) - tms(y.t))[0];
  if (next) return next;
  const live = pool.filter(m => now - tms(m.t) < 3 * 36e5).sort((x, y) => tms(y.t) - tms(x.t))[0];
  return live || pool[pool.length - 1];
}
const five = n => n === 5 ? 'пяти' : String(n);
function lead(m, f, k) {
  const p = document.createDocumentFragment(), add = (t, b) => p.append(b ? el('b', '', t) : document.createTextNode(t));
  const [fh, fa] = f.form || [];
  if (fh && fa) {
    if (fh[0] === fa[0]) { add('Обе команды выиграли '); add('по ' + fh[0] + ' из ' + five(fh[1]), 1); add(' последних матчей. '); }
    else {
      const hb = fh[0] > fa[0], bw = hb ? fh : fa, ow = hb ? fa : fh;
      add((hb ? m.hn : m.an) + ' — '); add(bw[0] + ' ' + plural(bw[0], 'победа', 'победы', 'побед') + ' в ' + five(bw[1]) + ' последних матчах', 1);
      add(', ' + (hb ? m.an : m.hn) + ' — '); add(String(ow[0]), 1); add('. ');
    }
  }
  if (k === 'live') add('Матч уже идёт — в разборе форма, вратари и личные встречи.');
  else if (k === 'final' || k === 'done') add('Матч завершён — в разборе форма, вратари и личные встречи.');
  else if (f.wins && f.wins[0]) {
    add('Смотрим, как ' + m.hn + ' играет дома ('); add(f.wins[0][0] + ' ' + plural(f.wins[0][0], 'победа', 'победы', 'побед') + ' в ' + f.wins[0][1] + ' ' + plural(f.wins[0][1], 'матче', 'матчах', 'матчах'), 1);
    add('), и что это меняет перед стартом в ' + hm(m) + ' МСК.');
  } else add('Форма, вратари и личные встречи — всё, что важно перед стартом в ' + hm(m) + ' МСК.');
  return p;
}
function dots(list, name) {
  const s = el('span', 'hs-dots');
  if (!list || !list.length) return s;
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', name + ', последние матчи: ' + list.map(x => x.r === 'w' ? 'победа' : 'поражение').join(', '));
  s.append(el('small', '', 'Форма'));
  list.forEach(x => { const i = el('i', x.r); i.title = x.t; s.append(i); });
  return s;
}
function paintOld(C, main) {
  const m = C.main; if (!m) return '';
  const f = (C.rows.find(r => r.m === m) || {}).F || {};
  main.classList.add('hs-old');
  if (f.hc) main.style.setProperty('--hc', f.hc); if (f.ac) main.style.setProperty('--ac', f.ac);
  const start = tms(m.t), lg = LG[m.lg];
  const vis = el('div', 'hs-vis');
  const pair = el('div', 'hs-pair' + (FACE_LEFT[m.a] ? ' aw' : '')); pair.setAttribute('aria-hidden', 'true');
  pair.append(crestImg(m.a, '', 'hs-cr hs-cr-a', 384), crestImg(m.h, '', 'hs-cr hs-cr-h', 384));
  pair.lastChild.fetchPriority = 'high';
  const team = side => {
    const h = side === 'h', box = el('div', 'hs-team hs-team-' + side);
    box.append(el('b', 'hs-team-n', h ? m.hn : m.an));
    const w = (f.where || [])[h ? 0 : 1] || (h ? 'дома' : 'в гостях'), t = (f.tbl || [])[h ? 0 : 1];
    const tw = el('small', 'hs-team-w', w);
    if (t && t.pts) tw.append(el('span', 'hs-pts', ' · ' + t.pts + ' ' + plural(t.pts, 'очко', 'очка', 'очков')));
    box.append(tw, dots((f.dots || [])[h ? 0 : 1], h ? m.hn : m.an));
    return box;
  };
  const clock = el('div', 'hs-clock');
  const time = el('b', 'hs-time', hm(m)), when = el('span', 'hs-when', cap(msk(start, {weekday: 'long'})) + ', ' + msk(start, {day: 'numeric', month: 'long'}) + ' · МСК');
  const cd = el('span', 'hs-cd'); cd.setAttribute('role', 'timer');
  clock.append(el('span', 'hs-cd-l', lg + ' · ' + hm(m) + ' МСК'), time, when, cd);
  const bar = el('i', 'hs-bar'); bar.setAttribute('aria-hidden', 'true'); bar.append(el('i'), el('i'));
  vis.append(pair, team('h'), team('a'), clock, bar);
  const story = el('div', 'hs-story');
  const rub = el('p', 'hs-rub'); rub.append(el('b', '', 'В фокусе'), el('span', '', '·'), document.createTextNode(lg));
  const tt = el('h2', 'hs-tt'); tt.id = 'hs-tt'; tt.append(el('span', '', m.hn + ' —'), document.createTextNode(' '), el('span', '', m.an));
  const ld = el('p', 'hs-lead');
  story.append(rub, tt, ld, ctas(m, 'Читать разбор'));
  main.append(vis, story);
  let state = '';
  const paintLead = () => { ld.textContent = ''; ld.append(lead(m, f, state)); };
  const tick = () => {
    if (state) return;
    const u = until(start);
    cd.className = 'hs-cd'; cd.textContent = u || (Date.now() > start + 3.5 * 36e5 ? 'матч завершён' : 'матч начался');
  };
  MAIN.key = m.key;
  MAIN.set = (k, hg, ag, st) => {
    const prev = state; state = k;
    main.classList.toggle('is-live', k === 'live'); main.classList.toggle('is-final', k === 'final' || k === 'done');
    if (k === 'live' || k === 'final') { time.textContent = hg + ':' + ag; cd.textContent = (k === 'live' ? 'LIVE' : 'Итог') + (st ? ' · ' + st : ''); cd.className = 'hs-cd ' + (k === 'live' ? 'is-live' : 'is-final'); }
    else if (k === 'done') cd.textContent = 'матч завершён';
    if (prev !== k) paintLead();
  };
  paintLead(); tick(); TIMERS.push(setInterval(tick, 30000));
  return m.key;
}

/* ── сборка ── */
let TIMERS = [], C = null;
function paint() {
  TIMERS.forEach(clearInterval); TIMERS = []; REFLOW = null; MAIN.key = ''; MAIN.set = null;
  root.dataset.hv = hv;
  const main = root.querySelector('.hs-main'), hx = root.querySelector('.hs-hx');
  main.textContent = ''; main.className = 'hs-main'; main.removeAttribute('style'); hx.textContent = ''; hx.className = 'hs-hx';
  if (!C || !C.rows.length) { main.hidden = true; return; }
  main.hidden = false;
  const key = ({4: paintV4, 5: paintV5, 6: paintV6}[hv] || paintOld)(C, main, hx);
  root.querySelectorAll('.hs-m').forEach(a => a.classList.toggle('is-main', !!key && a.dataset.key === key));
  Object.keys(ST).forEach(sync);
}
function switcher() {
  if (!/\/draft\//.test(location.pathname) && !qs.has('hv')) return;
  const box = el('div', 'hs-vsw'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Вариант первого экрана');
  GROUPS.forEach(([g, ks]) => {
    box.append(el('span', 'hs-vsw-l', g));
    ks.forEach(k => {
      const b = el('button', '', k + ' · ' + VARS[k]); b.type = 'button'; b.dataset.v = k; b.setAttribute('aria-pressed', String(k === hv));
      b.addEventListener('click', () => {
        hv = k; try { sessionStorage.setItem('jv-hv4', k); } catch (e) {}
        const u = new URL(location.href); u.searchParams.set('hv', k); history.replaceState(null, '', u);
        box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        paint();
      });
      box.append(b);
    });
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

  /* первый экран: факты всех матчей дня — со страниц разборов */
  const rows = await Promise.all(list.map(async m => ({m, F: await factsOf(m)})));
  C = {day, rows, main: chooseMain(list)};
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
