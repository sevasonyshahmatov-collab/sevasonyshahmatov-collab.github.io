/* JARVIS — маркетинговые правки (владелец 26.11, «да на всё»). Один файл на все страницы, подключается из nav.js.
   Шаги (ON): 1 — кнопка в бот-витрину с меткой ?start=site_<тип>; 2 — ссылки на канал → пригласительная ссылка типа страницы;
   3 — первые экраны (раздел: ближайший матч и модель; матч: действие); 4 — тексты кнопок, на телефоне одна кнопка в канал;
   5 — подсказка у листающихся вкладок, «Следующий матч» клуба. Без кэфов и букмекеров в текстах. */
(function () {
  'use strict';
  if (window.JV_GROW) return; window.JV_GROW = 1;
  var ON = {1: 1, 2: 1, 3: 1, 4: 1, 5: 1};
  var BOT = 'https://t.me/JarvisTablePayBot?start=site_';
  var INV = {"home": "https://t.me/+kVtA3PgrrBtjMzRk", "hockey": "https://t.me/+Lbk6rnYP0JdjOWRk", "football": "https://t.me/+FZtnDW4i-PhhYTJk", "match": "https://t.me/+idxBEXvnVq9iZTk0", "club": "https://t.me/+aOjZOQpLZutmOGI0", "forecast": "https://t.me/+LyZaX7dRbjhiNmQ0", "results": "https://t.me/+iAsAMDmG5aZlMmM8", "table": "https://t.me/+MEcyqVZBQn04NTE0"};
  var path = location.pathname.replace(/\/draft\/v4/, ''), file = (path.split('/').pop() || 'index.html');
  var TYPE =
    /^\/(index\.html)?$/.test(path) ? 'home' :
    /^\/hockey\/(index\.html)?$/.test(path) ? 'hockey' :
    /^\/football\/(index\.html)?$/.test(path) ? 'football' :
    /\/\d{4}-\d\d-\d\d-[^/]+\/(index\.html)?$/.test(path) || /^\/prognozy\//.test(path) ? 'match' :
    /^\/(khl|nhl)\/[a-z-]+\/(index\.html)?$/.test(path) || /^\/team\//.test(path) || /\/football\/team\.html$/.test(path) ? 'club' :
    /\/forecast[^/]*\.html$/.test(path) ? 'forecast' :
    /^\/results\.html$/.test(path) ? 'results' :
    /^\/hockey\/table\.html$/.test(path) ? 'table' : '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18"><path d="M21.6 3.2 2.9 10.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.4-1.5ZM8.3 13.2l9.6-6c.5-.3.9-.1.5.2l-8.2 7.4-.3 3.4-1.6-5Z"/></svg>';
  var BTXT = { home: 'Матч дня — каждый день в Telegram', hockey: 'Матч дня — пришлём в Telegram', football: 'Матч дня — пришлём в Telegram',
               match: 'Матч дня — пришлём в Telegram', club: 'Матч дня — пришлём в Telegram', forecast: 'Матч дня сегодня — в боте',
               results: 'Матч дня — пришлём в Telegram', table: 'Таблица аналитики: демо 3 дня бесплатно' };

  function css() {
    if ($('#gr-css')) return;
    var s = document.createElement('style'); s.id = 'gr-css';
    s.textContent =
      '.gr-cta{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:16px 0 4px}' +
      '.gr-cta p{margin:0;font-size:15px;line-height:1.35;color:var(--ink-2,#bcc8ec);max-width:46ch}' +
      '.gr-bot{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;border-radius:10px;font:700 15px/1.1 var(--text,inherit);' +
      'background:var(--signal,#ffc21a);color:var(--signal-ink,#1a1400)!important;text-decoration:none!important;box-shadow:0 8px 24px -12px rgba(0,0,0,.6);transition:transform .25s,filter .25s}' +
      '.gr-bot:hover{transform:translateY(-2px);filter:brightness(1.06)}' +
      '.gr-near{margin:10px 0 0;font-size:15px;color:var(--ink-2,#bcc8ec)}.gr-near b{color:var(--ink,#f2f6ff)}' +
      '.gr-fade{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 44px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 44px),transparent)}' +
      '.gr-fade.gr-end{-webkit-mask-image:none;mask-image:none}' +
      (ON[4] ? '@media (max-width:809px){#tgbar,.tgbar{display:none!important}}' : '');
    document.head.appendChild(s);
  }

  /* 1. кнопка в бот-витрину с меткой источника — одна на страницу, на первом экране */
  function botButton() {
    if (!TYPE || $('.gr-cta')) return;
    if (TYPE === 'table') {                                   // на странице таблицы — сами кнопки «Хочу таблицу» / «Узнать про доступ»
      $$('a').forEach(function (a) {
        if (/^(Хочу таблицу|Узнать про доступ)/.test(a.textContent.trim())) {
          a.href = BOT + 'table'; if (/^Хочу/.test(a.textContent.trim())) a.textContent = BTXT.table;
        }
      });
      $$('.note').forEach(function (p) { if (/Оплата появится скоро/.test(p.textContent)) p.textContent = 'Оплата и демо 3 дня — в боте @JarvisTablePayBot.'; });
      return;
    }
    var h1 = $('main h1') || $('h1'); if (!h1) return;
    var box = document.createElement('div'); box.className = 'gr-cta';
    box.innerHTML = (TYPE === 'match' ? '<p>Прогноз JARVIS на этот матч выйдет в Telegram до начала.</p>' : '') +
      '<a class="gr-bot" href="' + BOT + TYPE + '" target="_blank" rel="noopener">' + TG + '<span>' + BTXT[TYPE] + '</span></a>';
    // на первый экран телефона: стартовая — сразу под цифрой итогов; клуб — под названием; итоги — под вводным текстом
    var after = TYPE === 'home' ? ($('#hm-score') || h1) : TYPE === 'club' ? h1 : TYPE === 'results' ? ($('#rs-lead') || h1) : null;
    if (after) { after.insertAdjacentElement('afterend', box); box.style.order = getComputedStyle(after).order; return; }   // на телефоне блоки переставлены order
    var host = TYPE === 'hockey' || TYPE === 'football' ? ($('.hs-head') || h1.parentElement) : h1.parentElement;
    host.appendChild(box);
  }

  /* 2. канал — пригласительная ссылка этого типа страницы (посты t.me/jarvibet/123 не трогаем) */
  function invites() {
    var inv = INV[TYPE]; if (!inv) return;
    $$('a[href]').forEach(function (a) {
      if (/^https?:\/\/t\.me\/jarvibet\/?(\?.*)?$/.test(a.getAttribute('href'))) a.setAttribute('href', inv);
    });
  }

  /* 3. раздел: ближайший матч и расчёт модели под заголовком (данные — те же lines/model/today) */
  function nearest() {
    if ((TYPE !== 'hockey' && TYPE !== 'football') || $('.gr-near')) return;
    var J = window.JVL; if (!J || !J.TD) return;
    var hk = TYPE === 'hockey', at = function (t) { return Date.parse(String(t).replace(' ', 'T') + ':00+03:00'); }, now = Date.now();
    var ms = (J.TD.matches || []).filter(function (m) { return ((m.lg === 'khl' || m.lg === 'nhl') === hk) && at(m.t) > now && J.M[m.key]; })
      .sort(function (a, b) { return at(a.t) - at(b.t); });
    var m = ms[0]; if (!m) return;
    var md = J.M[m.key], pr = [md.p1, md.x, md.p2], bi = 0; pr.forEach(function (p, i) { if (p != null && p > pr[bi]) bi = i; });
    var p = document.createElement('p'); p.className = 'gr-near';
    var d0 = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10), d1 = new Date(Date.now() + 27 * 36e5).toISOString().slice(0, 10), dm = m.t.slice(0, 10);
    var day = dm === d0 ? 'сегодня' : dm === d1 ? 'завтра' : dm.slice(8, 10) + '.' + dm.slice(5, 7);
    p.innerHTML = 'Ближайший: <b>' + J.esc(m.hn) + ' — ' + J.esc(m.an) + '</b>, ' + day + ' ' + J.hhmm(m.t) + ' МСК · модель: <b>' + ['П1', 'Х', 'П2'][bi] + ' ' + Math.round(pr[bi] * 100) + ' %</b>';
    var head = $('.hs-head') || ($('main h1') || {}).parentElement; if (head) head.appendChild(p);
  }

  /* 4. тексты кнопок канала; на телефоне — одна кнопка (в шапке), плавающая скрыта стилем */
  function texts() {
    $$('.hd .btn-tg span, header .btn-tg span').forEach(function (s) { s.textContent = innerWidth < 810 ? 'Прогнозы — бесплатно' : 'Прогнозы в Telegram — бесплатно'; });
    $$('#tgbar span').forEach(function (s, i) { if (!i) s.textContent = 'Свежие итоги и прогнозы — в канале'; });
  }

  /* 5. листающиеся вкладки — тень у правого края; «Следующий матч» клуба — без уже начавшегося матча */
  function tabsHint() {
    $$('.subbar .wrap, .subbar nav, .tour-steps, .tabs, .sub-nav, [role="tablist"]').forEach(function (el) {
      if (el.dataset.grF) return;
      var upd = function () { var sc = el.scrollWidth > el.clientWidth + 4; el.classList.toggle('gr-fade', sc); el.classList.toggle('gr-end', sc && el.scrollLeft + el.clientWidth >= el.scrollWidth - 4); };
      el.dataset.grF = 1; el.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd(); setTimeout(upd, 800);
    });
  }
  function nextMatchFix() {
    if (TYPE !== 'club') return;
    var h = $$('h2').filter(function (x) { return /Следующий матч/.test(x.textContent); })[0]; if (!h) return;
    var sec = h.closest('section') || h.parentElement;
    if (/матч начался|идёт сейчас|LIVE/i.test(sec.textContent)) h.textContent = 'Текущий матч';
  }

  function run() {
    if (!TYPE) { if (ON[4]) texts(); return; }
    css();
    if (ON[1]) botButton();
    if (ON[2]) invites();
    if (ON[3]) nearest();
    if (ON[4]) texts();
    if (ON[5]) { tabsHint(); nextMatchFix(); }
  }
  // страницы дорисовывают блоки скриптами — повторяем несколько раз (всё идемпотентно)
  var n = 0, again = function () { run(); if (++n < 6) setTimeout(again, n * 700); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', again) : again();
  addEventListener('load', run);
})();
