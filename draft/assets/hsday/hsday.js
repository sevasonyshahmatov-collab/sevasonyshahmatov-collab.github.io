/* «Хоккей сегодня» — первый экран /hockey/ (черновик 25.11, редакция 3: три варианта на выбор).
   ?hv=1 «Разворот» (карточка с эмблемами + материал дня), ?hv=2 «Табло» (строка «Купона» крупно),
   ?hv=3 «Медальоны» (эмблемы в кругах с кольцом цвета клуба). Выбор запоминается на вкладку; в черновике — переключатель внизу слева.
   Без градиентов: только ровные заливки, цвета клубов — плашками (как полосы «Расчёт модели» на странице матча).
   Данные: window.JV_TODAY (data/today.js) — расписание; data/matchlinks.js — адреса разборов;
   страница разбора — цвета клубов (--hc/--ac), место в таблице, форма, игры дома/в гостях;
   live.js — LIVE и счёт (карточки несут data-lv-*, live.js дописывает в них скрытый .lv, отсюда читаем);
   итог уже сыгранных (окно live.js закрыто) — один раз из тех же открытых источников (ESPN для НХЛ, приложение КХЛ).
   Материал дня — ближайший не начавшийся матч дня, у которого есть разбор (или ?hs=<ключ>).
   Вывод — только textContent и атрибуты. */
(() => {
'use strict';
const me = document.currentScript, BASE = me && me.src ? me.src.replace(/[^/]*$/, '') : '';
const U = p => new URL(p, BASE).href;
const root = document.getElementById('hsday');
if (!root) return;
document.documentElement.classList.add('hs-on');

const qs = new URLSearchParams(location.search);
const VARS = {1: 'Разворот', 2: 'Табло', 3: 'Медальоны'};
let hv = qs.get('hv');
try { if (hv && VARS[hv]) sessionStorage.setItem('jv-hv', hv); else hv = sessionStorage.getItem('jv-hv'); } catch (e) {}
if (!VARS[hv]) hv = '1';
root.dataset.hv = hv;

const TZ = 'Europe/Moscow', LG = {khl: 'КХЛ', nhl: 'НХЛ'};
const msk = (ms, o) => new Intl.DateTimeFormat('ru-RU', Object.assign({timeZone: TZ}, o)).format(new Date(ms));
const ymd = ms => new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(ms));
const tms = t => Date.parse(String(t).replace(' ', 'T') + ':00+03:00');
const hm = m => String(m.t).slice(11, 16);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
const FACE_LEFT = {nhl_chi: 1, minnesota: 1, nhl_ana: 1, nhl_fla: 1};    /* как в kupon.js: такие эмблемы гостей кладём поверх */

function loadScript(src) {
  return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
}
const linkOf = m => { const p = (window.JV_MATCHLINKS || {})[m.key]; return p ? U('../../' + p) : '#matches'; };
const crest = id => U('../em/' + id + '.webp');
const crestImg = (id, alt, cls, size) => {
  const im = el('img', cls); im.src = crest(id); im.alt = alt || ''; im.width = size; im.height = size; im.decoding = 'async';
  im.onerror = () => { im.style.visibility = 'hidden'; };
  return im;
};

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
  if (a.dataset.key === MAIN.key && MAIN.set) MAIN.set(k, hg, ag, k === 'live' ? short(stTxt) : stTxt);
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

/* ── материал дня ── */
function chooseMain(list) {
  const force = qs.get('hs');
  if (force) { const f = list.find(m => m.key === force) || list.find(m => m.key.split('|').slice(2).includes(force)); if (f) return f; }
  const now = Date.now(), withPage = list.filter(m => (window.JV_MATCHLINKS || {})[m.key]);
  const pool = withPage.length ? withPage : list;
  const next = pool.filter(m => tms(m.t) > now).sort((x, y) => tms(x.t) - tms(y.t))[0];
  if (next) return next;
  const live = pool.filter(m => now - tms(m.t) < 3 * 36e5).sort((x, y) => tms(y.t) - tms(x.t))[0];
  return live || pool[pool.length - 1];
}
async function facts(m) {                  /* всё — со страницы разбора, чтобы цифры совпадали с тем, что человек там увидит */
  const out = {};
  if (!(window.JV_MATCHLINKS || {})[m.key]) return out;
  try {
    const r = await fetch(linkOf(m), {credentials: 'same-origin'}); if (!r.ok) return out;
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    const hero = doc.querySelector('.mx-hero'), st = hero ? hero.getAttribute('style') || '' : '';
    ['hc', 'ac', 'hi', 'ai'].forEach(k => { const x = new RegExp('--' + k + ':\\s*(#[0-9a-f]{3,8})', 'i').exec(st); if (x) out[k] = x[1]; });
    const where = [...doc.querySelectorAll('.mx-team small')].map(n => n.textContent.trim());
    if (where.length === 2) out.where = where.map(s => s.replace(/,\s*/, ' · '));
    const fc = [...doc.querySelectorAll('.mx-fc')];
    if (fc.length === 2) {
      out.dots = fc.map(c => [...c.querySelectorAll('.mx-dots li')].map(li => ({r: li.classList.contains('r-w') ? 'w' : 'l', t: li.getAttribute('title') || ''})));
      out.form = fc.map(c => { const x = /(\d+)\D+(\d+)/.exec((c.querySelector('h3 small') || {}).textContent || ''); return x ? [+x[1], +x[2]] : null; });
    }
    const ha = doc.querySelector('table.mq-ha');
    if (ha) ha.querySelectorAll('tbody tr').forEach(tr => {
      const k = (tr.querySelector('th') || {}).textContent || '';
      if (/^Побед/.test(k)) out.ha = [...tr.querySelectorAll('td')].map(n => /(\d+)\D+(\d+)/.exec(n.textContent)).map(x => x && [+x[1], +x[2]]);
    });
    const tab = doc.querySelector('table.mt-tab');
    if (tab) out.tbl = [...tab.querySelectorAll('tbody tr')].map(tr => { const td = tr.querySelectorAll('td'); return td.length >= 6 ? {place: +td[0].textContent, pts: +td[5].textContent} : null; });
  } catch (e) {}
  return out;
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
  else if (f.ha && f.ha[0]) {
    add('Смотрим, как ' + m.hn + ' играет дома ('); add(f.ha[0][0] + ' ' + plural(f.ha[0][0], 'победа', 'победы', 'побед') + ' в ' + f.ha[0][1] + ' ' + plural(f.ha[0][1], 'матче', 'матчах', 'матчах'), 1);
    add('), и что это меняет перед стартом в ' + hm(m) + ' МСК.');
  } else add('Форма, вратари и личные встречи — всё, что важно перед стартом в ' + hm(m) + ' МСК.');
  return p;
}
function until(ms) {
  const d = ms - Date.now(); if (d <= 0) return '';
  const mins = Math.max(1, Math.round(d / 6e4)), h = Math.floor(mins / 60), mm = mins % 60;
  if (h >= 24) return msk(ms, {weekday: 'long'}) + ' в ' + msk(ms, {hour: '2-digit', minute: '2-digit'});
  return 'через ' + (h ? h + ' ч ' : '') + mm + ' мин';
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

/* ── первый экран ── */
function buildMain(m, f) {
  const main = root.querySelector('.hs-main'); main.textContent = ''; main.hidden = false; main.classList.remove('is-sk');
  if (f.hc) main.style.setProperty('--hc', f.hc); if (f.ac) main.style.setProperty('--ac', f.ac);
  const start = tms(m.t), lg = LG[m.lg];

  /* визуальная часть: эмблемы, команды, время */
  const vis = el('div', 'hs-vis');
  const pair = el('div', 'hs-pair' + (FACE_LEFT[m.a] ? ' aw' : '')); pair.setAttribute('aria-hidden', 'true');
  pair.append(crestImg(m.a, '', 'hs-cr hs-cr-a', 384), crestImg(m.h, '', 'hs-cr hs-cr-h', 384));
  pair.lastChild.fetchPriority = 'high';
  const team = (side) => {
    const h = side === 'h', box = el('div', 'hs-team hs-team-' + side);
    box.append(el('b', 'hs-team-n', h ? m.hn : m.an));
    const w = (f.where || [])[h ? 0 : 1] || (h ? 'дома' : 'в гостях');
    const t = (f.tbl || [])[h ? 0 : 1];
    const tw = el('small', 'hs-team-w', w);
    if (t && t.pts) { const pt = el('span', 'hs-pts', ' · ' + t.pts + ' ' + plural(t.pts, 'очко', 'очка', 'очков')); tw.append(pt); }
    box.append(tw);
    box.append(dots((f.dots || [])[h ? 0 : 1], h ? m.hn : m.an));
    return box;
  };
  const clock = el('div', 'hs-clock');
  const time = el('b', 'hs-time', hm(m)), when = el('span', 'hs-when', cap(msk(start, {weekday: 'long'})) + ', ' + msk(start, {day: 'numeric', month: 'long'}) + ' · МСК');
  const cd = el('span', 'hs-cd'); cd.setAttribute('role', 'timer');
  const cdl = el('span', 'hs-cd-l', lg + ' · ' + hm(m) + ' МСК');
  clock.append(cdl, time, when, cd);
  const bar = el('i', 'hs-bar'); bar.setAttribute('aria-hidden', 'true'); bar.append(el('i'), el('i'));
  vis.append(pair, team('h'), team('a'), clock, bar);

  /* материал дня */
  const story = el('div', 'hs-story');
  const rub = el('p', 'hs-rub'); rub.append(el('b', '', 'В фокусе'), el('span', '', '·'), document.createTextNode(lg));
  const tt = el('h2', 'hs-tt'); tt.id = 'hs-tt'; tt.append(el('span', '', m.hn + ' —'), document.createTextNode(' '), el('span', '', m.an));
  const ld = el('p', 'hs-lead');
  const ctas = el('div', 'hs-ctas');
  const btn = el('a', 'hs-btn'); btn.href = linkOf(m); btn.append(document.createTextNode('Читать разбор')); btn.insertAdjacentHTML('beforeend', ARROW);
  btn.setAttribute('aria-label', 'Читать разбор: ' + m.hn + ' — ' + m.an);
  const more = el('a', 'hs-more'); more.href = '#matches'; more.append(document.createTextNode('Все матчи дня')); more.insertAdjacentHTML('beforeend', DOWN);
  ctas.append(btn, more);
  story.append(rub, tt, ld, ctas);
  main.append(vis, story);
  main.setAttribute('aria-labelledby', 'hs-tt');

  /* состояние: до начала — обратный отсчёт; LIVE и итог — из строки матчей */
  let state = '';
  const paintLead = () => { ld.textContent = ''; ld.append(lead(m, f, state)); };
  const tick = () => {
    if (state) return;
    const u = until(start);
    if (u) { cd.textContent = u; cd.className = 'hs-cd'; }
    else { cd.textContent = Date.now() > start + 3.5 * 36e5 ? 'матч завершён' : 'матч начался'; cd.className = 'hs-cd'; }
  };
  MAIN.key = m.key;
  MAIN.set = (k, hg, ag, st) => {
    const prev = state; state = k;
    main.classList.toggle('is-live', k === 'live'); main.classList.toggle('is-final', k === 'final' || k === 'done');
    if (k === 'live' || k === 'final') { time.textContent = hg + ':' + ag; cd.textContent = (k === 'live' ? 'LIVE' : 'Итог') + (st ? ' · ' + st : ''); cd.className = 'hs-cd ' + (k === 'live' ? 'is-live' : 'is-final'); }
    else if (k === 'done') { cd.textContent = 'матч завершён'; }
    if (prev !== k) paintLead();
  };
  paintLead(); tick(); setInterval(tick, 30000);
}

/* ── переключатель вариантов (только в черновике и при ?hv) ── */
function switcher() {
  if (!/\/draft\//.test(location.pathname) && !qs.has('hv')) return;
  const box = el('div', 'hs-vsw'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Вариант первого экрана');
  box.append(el('span', 'hs-vsw-l', 'Вариант'));
  Object.keys(VARS).forEach(k => {
    const b = el('button', '', k + ' · ' + VARS[k]); b.type = 'button'; b.setAttribute('aria-pressed', String(k === hv));
    b.addEventListener('click', () => {
      hv = k; root.dataset.hv = k; try { sessionStorage.setItem('jv-hv', k); } catch (e) {}
      const u = new URL(location.href); u.searchParams.set('hv', k); history.replaceState(null, '', u);
      box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
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
  const m = chooseMain(list);
  const cards = list.map(card);
  if (cards.length) {
    cards.forEach(a => { if (m && a.dataset.key === m.key) a.classList.add('is-main'); sc.append(a); watchLive(a); });
  } else sc.append(el('p', 'hs-none', 'Сегодня матчей КХЛ и НХЛ нет. Ближайшие игры — ниже, в разделе «Сегодня на льду».'));

  /* материал дня */
  if (!m) { root.querySelector('.hs-main').hidden = true; switcher(); return; }
  buildMain(m, await facts(m));
  switcher();
  if (cards.length) {
    document.dispatchEvent(new Event('jv:rows'));
    setTimeout(() => document.dispatchEvent(new Event('jv:rows')), 4000);   /* если live.js был занят первым опросом */
    finals(cards);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
