/* «Хоккей сегодня» — первый экран /hockey/ (черновик 25.11).
   Данные: window.JV_TODAY (data/today.js) — расписание, data/matchlinks.js — адреса разборов, live.js — LIVE и счёт
   (карточки строки несут data-lv-*, live.js дописывает в них скрытый .lv, отсюда читаем счёт и период).
   Итог уже сыгранных матчей (окно live.js закрыто) — один раз из тех же открытых источников (ESPN для НХЛ, приложение КХЛ).
   Материал дня — ближайший не начавшийся матч дня (или ?hs=<ключ>); факты берём из его страницы разбора, слева — эмблемы соперников.
   Вывод — только textContent/атрибуты, без innerHTML с данными. */
(() => {
'use strict';
const me = document.currentScript, BASE = me && me.src ? me.src.replace(/[^/]*$/, '') : '';
const U = p => new URL(p, BASE).href;
const root = document.getElementById('hsday');
if (!root) return;
document.documentElement.classList.add('hs-on');

const TZ = 'Europe/Moscow', LG = {khl: 'КХЛ', nhl: 'НХЛ'};
const msk = (ms, o) => new Intl.DateTimeFormat('ru-RU', Object.assign({timeZone: TZ}, o)).format(new Date(ms));
const ymd = ms => new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(ms));
const tms = t => Date.parse(String(t).replace(' ', 'T') + ':00+03:00');
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const qs = new URLSearchParams(location.search);

function loadScript(src) {
  return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
}
const linkOf = m => { const p = (window.JV_MATCHLINKS || {})[m.key]; return p ? U('../../' + p) : U('../../hockey/index.html#matches'); };
const crest = id => U('../em/' + id + '.webp');

/* ── какие матчи показываем: день по Москве; если сегодня игр нет — ближайший игровой день ── */
function pickDay(all) {
  const now = Date.now(), today = ymd(now);
  const by = {};
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
  const st = tms(m.t);
  a.dataset.lv = ''; a.dataset.lvLg = m.lg; a.dataset.lvT = new Date(st).toISOString(); a.dataset.lvH = m.h; a.dataset.lvA = m.a;
  a.dataset.lvHn = m.hn; a.dataset.lvAn = m.an;
  const top = el('span', 'hs-mt'); top.append(el('i'), document.createTextNode(LG[m.lg]));
  const s = el('em', 'hs-st', m.t.slice(11, 16) + ' МСК'); top.append(s);
  a.append(top);
  [['h', 'hn'], ['a', 'an']].forEach(([id, n]) => {
    const row = el('span', 'hs-tm'); const im = el('img'); im.src = crest(m[id]); im.alt = ''; im.width = 28; im.height = 28; im.loading = 'lazy';
    im.onerror = () => { im.style.visibility = 'hidden'; };
    row.append(im, el('span', '', m[n]), el('b', 'hs-g')); a.append(row);
  });
  a.setAttribute('aria-label', LG[m.lg] + ', ' + m.hn + ' — ' + m.an + ', ' + m.t.slice(11, 16) + ' МСК. Разбор матча');
  return a;
}
function short(stTxt) {                    /* «2-й период, 08:42» → «2П · 08:42» */
  const s = String(stTxt || '');
  let m = /^(\d)-й период(?:,\s*(.+))?/.exec(s); if (m) return m[1] + 'П' + (m[2] ? ' · ' + m[2] : '');
  m = /^Овертайм(?:,\s*(.+))?/.exec(s); if (m) return 'ОТ' + (m[1] ? ' · ' + m[1] : '');
  if (/^Буллиты/.test(s)) return 'Б';
  return s ? s.toUpperCase() : '';
}
function setScore(a, k, hg, ag, stTxt) {
  const g = a.querySelectorAll('.hs-g'), rows = a.querySelectorAll('.hs-tm'), s = a.querySelector('.hs-st');
  g[0].textContent = hg; g[1].textContent = ag;
  a.classList.toggle('is-live', k === 'live'); a.classList.toggle('is-final', k === 'final');
  rows[0].classList.toggle('lose', k === 'final' && +hg < +ag); rows[1].classList.toggle('lose', k === 'final' && +ag < +hg);
  if (k === 'live') { const p = short(stTxt); s.textContent = 'LIVE' + (p ? ' / ' + p : ''); }
  else if (k === 'final') s.textContent = 'ИТОГ' + (stTxt ? ' / ' + stTxt : '');
  else if (k === 'done') s.textContent = 'ЗАВЕРШЁН';
  const n = a.querySelectorAll('.hs-tm span');
  const lbl = k === 'live' ? 'идёт, счёт ' : k === 'final' ? 'итог ' : '';
  if (lbl) a.setAttribute('aria-label', a.querySelector('.hs-mt').textContent.slice(0, 3) + ', ' + n[0].textContent + ' — ' + n[1].textContent + ', ' + lbl + hg + ':' + ag + '. Разбор матча');
}
function watchLive(a) {                    /* live.js рисует .lv внутри карточки — переносим в нашу разметку */
  const read = () => {
    const b = a.querySelector('.lv'); if (!b || b.hidden) return;
    const h = b.querySelector('.lv-h'), w = b.querySelector('.lv-a'); if (!h || h.textContent === '') return;
    const fin = b.classList.contains('lv-final');
    setScore(a, fin ? 'final' : 'live', h.textContent, w.textContent, fin ? '' : (b.querySelector('.lv-st') || {}).textContent);
  };
  new MutationObserver(read).observe(a, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class']});
}

/* итог матчей, окно live.js для которых уже закрыто (начало > 3,5 ч назад) */
const KHL_TID = {8: 'dinamo_msk', 10: 'avangard', 12: 'amur', 16: 'cska', 18: 'spartak', 22: 'torpedo', 24: 'sibir', 26: 'lokomotiv', 28: 'traktor', 30: 'metallurg',
  32: 'salavat', 36: 'neftekhimik', 38: 'dinamo_minsk', 40: 'akbars', 42: 'severstal', 44: 'ska', 46: 'barys', 56: 'avtomobilist', 61: 'admiral', 105: 'lada',
  113: 'sochi', 315: 'shanghai'};
function getJSON(url) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 10000);
  return fetch(url, {signal: c.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}).then(r => r.ok ? r.json() : Promise.reject(r.status)).finally(() => clearTimeout(t));
}
async function finals(cards) {
  const old = cards.filter(a => Date.now() > Date.parse(a.dataset.lvT) + 3.5 * 36e5);
  if (!old.length) return;
  old.forEach(a => setScore(a, 'done', '', '', ''));
  const nhl = old.filter(a => a.dataset.lg === 'nhl'), khl = old.filter(a => a.dataset.lg === 'khl');
  if (nhl.length && window.JVLive && JVLive._fromEspn) {
    const days = [...new Set(nhl.map(a => new Intl.DateTimeFormat('en-CA', {timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(a.dataset.lvT)).replace(/-/g, '')))];
    for (const d of days) {
      try {
        const j = await getJSON('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=' + d);
        nhl.forEach(a => {
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

/* ── материал дня ── */
function chooseMain(list) {
  const force = qs.get('hs');
  if (force) { const f = list.find(m => m.key === force || m.key.endsWith(force)); if (f) return f; }
  const now = Date.now(), withPage = list.filter(m => (window.JV_MATCHLINKS || {})[m.key]);
  const pool = withPage.length ? withPage : list;
  const next = pool.filter(m => tms(m.t) > now).sort((x, y) => tms(x.t) - tms(y.t))[0];
  if (next) return next;
  const live = pool.filter(m => now - tms(m.t) < 3 * 36e5).sort((x, y) => tms(y.t) - tms(x.t))[0];
  return live || pool[pool.length - 1];
}
async function facts(m) {
  const out = {};
  try {
    const r = await fetch(linkOf(m), {credentials: 'same-origin'}); if (!r.ok) return out;
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    const fm = [...doc.querySelectorAll('.mx-fc h3 small')].map(n => /(\d+)\D+(\d+)/.exec(n.textContent)).filter(Boolean);
    if (fm.length === 2) out.form = fm.map(x => [+x[1], +x[2]]);
    const ha = doc.querySelector('table.mq-ha');
    if (ha) ha.querySelectorAll('tbody tr').forEach(tr => {
      const k = (tr.querySelector('th') || {}).textContent || '', td = [...tr.querySelectorAll('td')].map(n => n.textContent.replace(/\s+/g, ' ').trim());
      if (/^Побед/.test(k)) out.ha = td.map(t => /(\d+)\D+(\d+)/.exec(t)).map(x => x && [+x[1], +x[2]]);
    });
  } catch (e) {}
  return out;
}
function lead(m, f) {
  const p = document.createDocumentFragment(), add = (t, b) => p.append(b ? el('b', '', t) : document.createTextNode(t));
  const time = m.t.slice(11, 16) + ' МСК', live = Date.now() >= tms(m.t);
  if (f.form && f.form[0][0] === f.form[1][0]) {
    const n = f.form[0][0], g = f.form[0][1];
    add('Обе команды выиграли '); add('по ' + n + ' из последних ' + g, 1); add(' ' + plural(g, 'матча', 'матчей', 'матчей') + '. ');
  } else if (f.form) {
    add(m.hn + ' — '); add(f.form[0][0] + ' ' + plural(f.form[0][0], 'победа', 'победы', 'побед') + ' в ' + f.form[0][1] + ' последних', 1);
    add(', ' + m.an + ' — '); add(f.form[1][0] + ' из ' + f.form[1][1], 1); add('. ');
  }
  if (f.ha && f.ha[0] && f.ha[1]) {
    add(m.hn + ' дома: '); add(f.ha[0][0] + ' ' + plural(f.ha[0][0], 'победа', 'победы', 'побед') + ' в ' + f.ha[0][1] + ' ' + plural(f.ha[0][1], 'матче', 'матчах', 'матчах'), 1);
    add(', ' + m.an + ' в гостях: '); add(f.ha[1][0] + ' из ' + f.ha[1][1], 1); add('. ');
  }
  if (!f.form && !f.ha) add('Форма, вратари, личные встречи и расчёт модели. ');
  add(live ? 'Что решало в этой игре — в разборе.' : 'Что это меняет перед стартом в ' + time + ' — в разборе.');
  return p;
}
function photo(m) {                       /* эмблемы соперников внахлёст, слегка выходят за рамку */
  const fig = el('figure', 'hs-ph hs-ph--em'), bg = el('div', 'hs-ph-in');
  bg.append(el('span', 'hs-ph-bg', LG[m.lg])); fig.append(bg);
  [['h', 'hn', 'hs-cr-h'], ['a', 'an', 'hs-cr-a']].forEach(([id, n, cls]) => {
    const im = el('img', 'hs-cr ' + cls); im.src = crest(m[id]); im.alt = m[n]; im.width = 384; im.height = 384; im.decoding = 'async';
    if (id === 'h') im.fetchPriority = 'high';
    im.onerror = () => { im.style.visibility = 'hidden'; };
    fig.append(im);
  });
  const cap = el('figcaption', 'hs-cap'), nm = el('b');
  nm.append(document.createTextNode(m.hn), el('span', '', '—'), document.createTextNode(m.an));
  cap.append(nm, el('small', '', LG[m.lg] + ' · ' + m.t.slice(11, 16) + ' МСК'));
  fig.append(cap);
  return fig;
}

async function render() {
  if (!window.JV_MATCHLINKS) await loadScript(U('../../data/matchlinks.js'));
  const all = ((window.JV_TODAY || {}).matches || []).filter(m => LG[m.lg]);
  const {day, list} = pickDay(all);
  list.sort((x, y) => tms(x.t) - tms(y.t) || (x.lg > y.lg ? 1 : -1));
  const dms = tms(day + ' 12:00');

  /* дата */
  const dt = root.querySelector('.hs-date'); dt.textContent = '';
  dt.append(el('span', '', msk(dms, {weekday: 'long'})), el('b', '', msk(dms, {day: 'numeric'})), el('small', '', msk(dms, {day: 'numeric', month: 'long'}).replace(/^\d+\s*/, '') + ' / МСК'));
  const kick = root.querySelector('.hs-kick'); kick.textContent = '';
  kick.append(document.createTextNode('Хоккей'), el('span', '', '/'), document.createTextNode(msk(dms, {weekday: 'long'}) + ', ' + msk(dms, {day: 'numeric', month: 'long'})));
  if (day !== ymd(Date.now())) root.querySelector('.hs-h1').textContent = 'Хоккей ' + (day > ymd(Date.now()) ? 'завтра' : 'вчера');

  /* строка */
  const sc = root.querySelector('.hs-sc'); sc.textContent = '';
  const cards = list.map(card);
  if (cards.length) { cards.forEach(a => { sc.append(a); watchLive(a); }); document.dispatchEvent(new Event('jv:rows')); setTimeout(() => document.dispatchEvent(new Event('jv:rows')), 4000); finals(cards); }
  else sc.append(el('p', 'hs-none', 'Сегодня матчей КХЛ и НХЛ нет. Ближайшие игры — в разделе «Сегодня на льду».'));

  /* материал дня */
  const m = chooseMain(list), story = root.querySelector('.hs-story'), spread = root.querySelector('.hs-spread');
  if (!m) { spread.hidden = true; return; }
  const f = await facts(m);
  story.textContent = '';
  const rub = el('p', 'hs-rub'); rub.append(document.createTextNode('В фокусе'), el('span', '', '/'), document.createTextNode(LG[m.lg]));
  const tt = el('h2', 'hs-tt'); tt.append(el('span', '', m.hn + ' —'), el('span', '', m.an));
  const ld = el('p', 'hs-lead'); ld.append(lead(m, f));
  const btn = el('a', 'hs-btn'); btn.href = linkOf(m); btn.append(document.createTextNode('Читать разбор'));
  btn.insertAdjacentHTML('beforeend', ARROW);
  btn.setAttribute('aria-label', 'Читать разбор: ' + m.hn + ' — ' + m.an);
  story.append(rub, tt, ld, btn);
  const old = spread.querySelector('.hs-ph'); if (old) old.replaceWith(photo(m)); else spread.prepend(photo(m));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
