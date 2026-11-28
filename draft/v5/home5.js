/* Новая стартовая (черновик /draft/v4/). Данные — те же файлы ежедневной сборки, что у текущей главной:
   data/today.js + lines.js + model.js (через assets/lines.js → window.JVL и proto/home/common.js → window.HOME),
   data/results-lite.js (__RESLITE), data/results.json (месяцы, график, свежие прогнозы), data/posts.js (JV_POSTS),
   data/mtext.json (разборы матчей), assets/live.js (живой счёт по data-lv). Страница только читает.
   Движение — как в тесте test-rep: GSAP 3.15.1 (ScrollTrigger, SplitText) + Lenis 1.3.28, локально (/draft/anim/vendor).
   «Уменьшить движение» — без анимаций и видео. Видео — только на компьютере, на телефоне — картинка. */
(function () {
  'use strict';
  var V = '/draft/anim/vendor/';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOB = window.matchMedia && matchMedia('(max-width: 809px)').matches;
  var H = window.HOME;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var num = function (x, d) { return (+x).toFixed(d == null ? 1 : d).replace('.', ','); };
  var sign = function (u) { return (u > 0 ? '+' : u < 0 ? '−' : '') + num(Math.abs(u)); };
  var E = 'power3.out';
  var LG = { khl: 'КХЛ', nhl: 'НХЛ', epl: 'АПЛ', laliga: 'Ла Лига', seriea: 'Серия А', bundesliga: 'Бундеслига', ligue1: 'Лига 1', rpl: 'РПЛ', ucl: 'ЛЧ', uel: 'ЛЕ' };
  var MON = ['', 'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  /* ── первый экран: дата и общий счёт (results-lite.js — как сейчас) ── */
  function heroData() {
    if (H && H.dateStr) $('#hdate').textContent = H.dateStr();
    var R = window.__RESLITE;
    if (R && R.sum && R.sum.total) {
      var a = R.sum.total.all;
      $$('[data-k="wl"]').forEach(function (e) { e.textContent = a.w + ' из ' + (a.w + a.l); });
      $$('[data-k="rate"]').forEach(function (e) { e.textContent = num(a.rate); });
    }
  }

  /* ── два входа: как карточки текущей главной (merge.js) ── */
  function doors() {
    if (!H || !H.J) return;
    var all = H.all(), fmt = function (n) { return n.toFixed(1).replace('.', ','); };
    var raw = ((H.J.TD && H.J.TD.matches) || []).filter(function (m) { return m.t && m.h && m.a; });
    [['hk', true], ['fb', false]].forEach(function (x) {
      var c = x[0], hk = x[1], el = $('.door.' + c); if (!el) return;
      var list = all.filter(function (m) { return m.hockey === hk; }), td = raw.filter(function (m) { return H.isH(m) === hk && H.J.isToday(m); }), use = td.length ? td : list, n = use.length;
      el.querySelector('[data-cnt]').textContent = n ? n + ' ' + H.pl(n, 'матч', 'матча', 'матчей') + ' ' + (td.length ? 'сегодня' : 'впереди') : 'в ближайшие 2 дня матчей нет';
      if (!n) el.querySelector('[data-next]').textContent = hk ? 'Таблицы КХЛ и НХЛ, тренды и игроки' : 'Таблицы лиг, тренды и игроки';
      var lam = use.map(function (m) { var md = m.md || H.J.M[m.key]; return md && md.lam ? md.lam[0] + md.lam[1] : null; }).filter(function (v) { return v != null; });
      if (lam.length) el.querySelector('[data-stat]').textContent = 'ср. тотал по модели ' + fmt(lam.reduce(function (a, b) { return a + b; }, 0) / lam.length);
      var up = all.filter(function (m) { return m.hockey === hk && Date.parse(m.t.replace(' ', 'T') + ':00+03:00') > Date.now(); }).sort(function (a, b) { return a.t < b.t ? -1 : 1; })[0];
      if (up) {
        var ms = Date.parse(up.t.replace(' ', 'T') + ':00+03:00') - Date.now(), h = Math.floor(ms / 36e5), mi = Math.floor(ms % 36e5 / 6e4);
        var when = h >= 24 ? up.day + ', ' + up.hm : h ? 'через ' + h + ' ч ' + mi + ' мин' : 'через ' + mi + ' мин';
        el.querySelector('[data-next]').innerHTML = '<b>' + esc(up.hn) + ' — ' + esc(up.an) + '</b> · ' + when + (up.pr ? ' · ' + ['П1', 'Х', 'П2'][up.bi] + ' ' + H.pct(up.best) + ' %' : '');
      }
    });
  }

  /* ── ближайшие матчи: те же данные, что «Ближайшие матчи» сейчас; живой счёт — live.js по data-lv ── */
  function matches() {
    var box = $('#mlist'); if (!box) return;
    if (!H || !H.J) { box.innerHTML = '<p class="sub">Матчи сейчас недоступны — откройте <a class="more" href="/matches.html">все матчи дня</a>.</p>'; return; }
    var every = H.all(), list = every;
    if (!list.length) { box.innerHTML = '<p class="sub">В ближайшие дни матчей нет.</p>'; return; }
    var f2 = H.f2, kef = function (m, i) { var ln = m.ln; if (!ln) return ''; var v = [ln.p1, ln.x, ln.p2][i]; return v ? f2(v) : ''; };
    var one = function (m) {
      var lv = 'data-lv data-lv-lg="' + esc(m.lg) + '" data-lv-t="' + esc(m.t.replace(' ', 'T')) + ':00+03:00" data-lv-h="' + esc(m.h) + '" data-lv-a="' + esc(m.a) + '" data-lv-hn="' + esc(m.hn) + '" data-lv-an="' + esc(m.an) + '"';
      var pk = m.pr ? '<b>' + H.pct(m.best) + '%</b><span>' + ['П1', 'Х', 'П2'][m.bi] + ' · ' + esc(m.who) + '</span>' + (kef(m, m.bi) ? '<em>' + kef(m, m.bi) + '</em>' : '') : '<span>расчёт скоро</span>';
      return '<a class="mc" href="' + esc((m.hockey ? '/draft/v4' + m.page : m.page).replace(/index\.html$/, '')) + '" ' + lv + '><div class="t"><span>' + esc(m.lgn) + '</span><span>' + esc(m.day) + ', ' + esc(m.hm) + '</span></div>' +
        '<div class="tm"><div><img src="' + esc(m.hc) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' + esc(m.hn) + '</div>' +
        '<div><img src="' + esc(m.ac) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' + esc(m.an) + '</div></div><div class="pk">' + pk + '</div></a>';
    };
    box.innerHTML = [['Хоккей', true], ['Футбол', false]].map(function (g) {
      var part = every.filter(function (m) { return m.hockey === g[1]; }).slice(0, 6);
      return part.length ? '<h3 class="mg">' + g[0] + '</h3><div class="mrow">' + part.map(one).join('') + '</div>' : '';
    }).join('');
    var u = H.upd && H.upd(); if (u) $('#mupd').textContent = 'Вероятность модели и кэф линии · ' + u;
  }

  /* ── итоги по месяцам + график (data/results.json — тот же файл, что «Итоги» и бот) ── */
  function card(name, t, live, total) {
    var a = t.all, h = t.hockey, n = (a.w + a.l + a.p) || 1;
    return '<article class="mo' + (total ? ' total' : '') + '"><h3>' + esc(name) + (live ? '<em>идёт</em>' : '') + '</h3>' +
      (h && h.n ? '<div class="hk"><span>Хоккей</span><b>' + h.w + ' из ' + (h.w + h.l) + ' · ' + Math.round(h.rate) + '%</b></div>' : '') +
      '<div class="big"><b>' + a.w + ' из ' + (a.w + a.l) + '</b><span>' + num(a.rate) + '%</span></div>' +
      '<div class="bar" role="img" aria-label="Зашло ' + a.w + ', не зашло ' + a.l + ', возврат ' + a.p + '"><i style="width:' + (100 * a.w / n).toFixed(2) + '%"></i><u style="width:' + (100 * a.p / n).toFixed(2) + '%"></u></div>' +
      '<p class="meta"><span>зашло <b>' + a.w + '</b></span><span>не зашло <b>' + a.l + '</b></span>' + (a.p ? '<span>возврат <b>' + a.p + '</b></span>' : '') +
      (a.kef ? '<span>средний кэф <b>' + num(a.kef, 2) + '</b></span>' : '') + '<span>результат <b class="' + (a.units >= 0 ? 'pos' : 'neg') + '">' + sign(a.units) + ' ед.</b></span></p></article>';
  }
  function chart(D) {
    var done = D.picks.filter(function (p) { return p.r && p.u != null; }).slice().reverse();
    if (done.length < 5) return;
    var s = 0, pts = done.map(function (p) { s += p.u; return { d: p.d.slice(0, 10), v: s }; });
    var W = 1000, Hh = 260, L = 44, R = 64, T = 14, B = 30, mn = Math.min(0, Math.min.apply(0, pts.map(function (p) { return p.v; }))), mx = Math.max(1, Math.max.apply(0, pts.map(function (p) { return p.v; })));
    var x = function (i) { return L + (W - L - R) * i / (pts.length - 1); }, y = function (v) { return T + (Hh - T - B) * (1 - (v - mn) / (mx - mn)); };
    var step = mx - mn > 60 ? 20 : mx - mn > 24 ? 10 : 5, grid = '', ticks = '', last = '';
    for (var v = Math.ceil(mn / step) * step; v <= mx; v += step) grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#fff" stroke-opacity="' + (v === 0 ? .35 : .08) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (v > 0 ? '+' : '') + v + '</text>';
    var MN = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    pts.forEach(function (p, i) { var m = p.d.slice(0, 7); if (m !== last) { last = m; ticks += '<text x="' + (x(i) + 4) + '" y="' + (Hh - 8) + '">' + MN[+m.slice(5, 7)] + '</text>'; } });
    var e = pts[pts.length - 1];
    var c = $('#chart'); c.hidden = false;
    c.innerHTML = '<h3>Накопленный результат</h3><p>Каждый прогноз — ставка в 1 единицу: зашёл — плюс (кэф − 1), не зашёл — минус 1. Прогнозов с кэфом: ' + pts.length + '.</p>' +
      '<svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Накопленный результат: ' + sign(e.v) + ' единицы">' + grid + ticks +
      '<polyline fill="none" stroke="#e4ff3a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="' + pts.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p.v).toFixed(1); }).join(' ') + '"/>' +
      '<circle cx="' + x(pts.length - 1) + '" cy="' + y(e.v) + '" r="6" fill="#e4ff3a"/><text class="end" x="' + (x(pts.length - 1) + 10) + '" y="' + (y(e.v) + 5) + '" style="fill:#f4f6ef;font-weight:800;font-size:16px">' + sign(e.v) + '</text></svg>';
  }
  function results(D) {
    var s = D.sum;
    $('#months').innerHTML = s.months.map(function (m) { return card(m.name, m, m.live); }).join('') + card('За всё время', s.total, false, true);
    chart(D);
    var b = D.built || '', l = s.last_day || '';
    if (b && l) $('#rupd').textContent = 'Данные по ' + l.slice(8, 10) + '.' + l.slice(5, 7) + ', обновлено ' + b.slice(8, 10) + '.' + b.slice(5, 7) + ' в ' + b.slice(11, 16) + ' МСК.';
  }

  /* ── свежие прогнозы (results.json + posts.js) и разборы (mtext.json): только открытое — анонс и ссылка ── */
  function feed(D, MT) {
    var box = $('#feed'); if (!box) return;
    var items = [];
    var P = window.JV_POSTS || {};
    Object.keys(P).forEach(function (k) {
      var p = P[k], f = k.split('|');
      items.push({ at: f[1] || '', html: '<a class="pc" href="' + esc(p.url) + '" target="_blank" rel="noopener"><div class="t"><span>' + esc(LG[f[0]] || f[0]) + ' · ' + esc((f[1] || '').slice(8, 10) + '.' + (f[1] || '').slice(5, 7)) + '</span><span>Прогноз</span></div>' +
        '<h3>' + esc(p.bet) + '</h3><p class="bet">кэф ' + num(p.kef, 2) + '</p><span class="st">ждёт матча</span></a>' });
    });
    var seen = {};
    Object.keys(P).forEach(function (k) { seen[P[k].id] = 1; });
    (D ? D.picks : []).slice().sort(function (a, b) { return (b.posted || '') < (a.posted || '') ? -1 : 1; }).filter(function (p) { return !seen[p.id]; }).slice(0, 7).forEach(function (p) {
      var d = p.d.slice(0, 10), st = p.r === 'w' ? ['w', 'зашёл'] : p.r === 'l' ? ['l', 'не зашёл'] : p.r === 'p' ? ['', 'возврат'] : ['', 'ждёт матча'];
      items.push({ at: p.posted || d, html: '<a class="pc" href="' + esc(p.url) + '" target="_blank" rel="noopener"><div class="t"><span>' + esc(LG[p.lg] || p.lg || '') + ' · ' + d.slice(8, 10) + '.' + d.slice(5, 7) + '</span><span>' + (p.kind === 'express' ? 'Экспресс' : 'Мой прогноз') + '</span></div>' +
        '<h3>' + esc(p.h ? p.h + ' — ' + p.a : 'Экспресс') + '</h3><p class="bet">' + esc(p.bet || '') + (p.kef ? ' · кэф ' + num(p.kef, 2) : '') + '</p><span class="st ' + st[0] + '">' + st[1] + (p.sc ? ' · ' + esc(p.sc) : '') + '</span></a>' });
    });
    Object.keys(MT || {}).forEach(function (path) {
      var m = MT[path], f = path.split('/').filter(Boolean), dd = (f[1] || '').slice(0, 10);
      var teaser = String(m.v || (m.p && m.p[0]) || '').split(/(?<=[.!?])\s/)[0];
      items.push({ at: dd + ' 99', html: '<a class="pc an" href="' + esc(path) + '"><div class="t"><span>' + esc(LG[f[0]] || f[0]) + ' · ' + dd.slice(8, 10) + '.' + dd.slice(5, 7) + '</span><span>Разбор</span></div><h3>' +
        esc((f[1] || '').slice(11).replace(/-/g, ' ')) + '</h3><p class="bet">' + esc(teaser) + '</p><span class="st w">читать разбор →</span></a>' });
    });
    items.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    box.innerHTML = items.slice(0, 8).map(function (i) { return i.html; }).join('') || '<p class="sub">Свежие прогнозы — в канале @jarvibet.</p>';
    $$('.pc.an', box).forEach(function (a) {                     // название матча — из заголовка его страницы
      fetch(a.getAttribute('href')).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        var m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(t), h = m && m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        h = h && h.replace(/\s+прогноз на матч.*$/i, '');
        if (h) a.querySelector('h3').textContent = h.length > 60 ? h.slice(0, 58) + '…' : h;
      }).catch(function () {});
    });
  }

  /* ── меню, аккордеон ── */
  function ui() {
    var b = $('.burger');
    if (b) b.addEventListener('click', function () {
      var on = document.documentElement.classList.toggle('menu-open'); b.setAttribute('aria-expanded', on);
      if (window.jvLenis) on ? jvLenis.stop() : jvLenis.start();
      if (on && window.gsap && !RM) gsap.fromTo('.mmenu a, .mmenu .btn', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: E, delay: 0.15 });
    });
    $$('.mmenu a').forEach(function (a) { a.addEventListener('click', function () { document.documentElement.classList.remove('menu-open'); if (window.jvLenis) jvLenis.start(); }); });
    $$('.qa').forEach(function (q) {
      var btn = q.querySelector('button'), ans = q.querySelector('.ans');
      btn.addEventListener('click', function () {
        var open = !q.classList.contains('open');
        $$('.qa.open').forEach(function (o) { if (o !== q) { o.classList.remove('open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); setH(o.querySelector('.ans'), 0); } });
        q.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); setH(ans, open ? ans.scrollHeight : 0);
      });
    });
    function setH(el, h) {
      if (window.gsap && !RM) gsap.to(el, { height: h, duration: 0.5, ease: E, onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); } });
      else el.style.height = h ? 'auto' : '0';
    }
  }

  /* ── видео: только на компьютере и без «уменьшить движение»; играет, пока видно ── */
  function videos() {
    var on = document.documentElement.classList.contains('vid') && (navigator.hardwareConcurrency || 8) > 4 && (navigator.deviceMemory || 8) > 4;
    $$('video[data-src]').forEach(function (v) {
      var img = v.parentElement.querySelector('img.fp');
      if (!on) { v.remove(); return; }
      if (img) img.remove();
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { if (!v.src) v.src = v.canPlayType('video/webm; codecs="vp9"') ? v.dataset.src.replace(/\.mp4$/, '.webm') : v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
        });
      }, { rootMargin: '200px' });
      io.observe(v);
    });
  }

  function load(f) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = f.charAt(0) === '/' ? f : V + f; s.async = false; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }

  function smooth() {
    var loco = new LocomotiveScroll({ lenisOptions: { lerp: 0.085, wheelMultiplier: 0.9 },
      initCustomTicker: function (render) { gsap.ticker.add(render); }, destroyCustomTicker: function (render) { gsap.ticker.remove(render); } });
    var lenis = loco.lenisInstance; window.jvLoco = loco;
    window.jvLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]'); if (!a) return;
      var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash) return;
      var el = document.getElementById(u.hash.slice(1)); if (!el) return;
      e.preventDefault(); document.documentElement.classList.remove('menu-open'); lenis.start(); lenis.scrollTo(el, { offset: -64 });
    }, true);
    return lenis;
  }
  function tickers(lenis) {
    $$('.ticker').forEach(function (t) {
      var inner = t.querySelector('.ticker-in'), dir = t.dataset.dir === 'r' ? 1 : -1;
      inner.innerHTML += inner.innerHTML;
      var w = 0, x = 0, measure = function () { w = inner.scrollWidth / 2; };
      measure(); window.addEventListener('resize', measure);
      gsap.ticker.add(function (time, dt) {
        var v = lenis ? Math.min(Math.abs(lenis.velocity) * 60, 900) : 0;
        x += dir * (110 + v) * dt / 1000;
        if (x <= -w) x += w; if (x > 0) x -= w;
        inner.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      });
    });
  }
  function countUp(el, dur) {
    var src = el.textContent, ps = src.split(/(\d+(?:,\d+)?)/), nums = [];
    ps.forEach(function (p, i) { if (i % 2) nums.push({ i: i, v: parseFloat(p.replace(',', '.')), d: (p.split(',')[1] || '').length }); });
    if (!nums.length) return;
    var o = { k: 0 }, paint = function () { var out = ps.slice(); nums.forEach(function (n) { out[n.i] = (n.v * o.k).toFixed(n.d).replace('.', ','); }); el.textContent = out.join(''); };
    paint(); gsap.to(o, { k: 1, duration: dur || 1.4, ease: 'power2.out', onUpdate: paint, onComplete: function () { el.textContent = src; } });
  }

  function animate(lenis) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    var mega = $('.hero .mega');
    gsap.set(mega, { visibility: 'visible' });
    gsap.to('.hero .wrap', { yPercent: -10, autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: 'bottom top', scrub: true } });
    gsap.from('.mcd', { y: 80, autoAlpha: 0, duration: 1.3, ease: E, delay: 0.15 });
    gsap.from('.hero [data-load]', { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: E, delay: 0.25 });
    gsap.from('.hero .hero-act .btn', { y: 48, autoAlpha: 0, duration: 1, stagger: 0.08, ease: E, delay: 0.4, onStart: function () { $$('.hero-score b, .hnum b').forEach(function (e) { countUp(e, 2.2); }); } });
    gsap.to('.mcd', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    $$('[data-words]').forEach(function (el) {
      var sp = SplitText.create(el, { type: 'words' }); gsap.set(el, { visibility: 'visible' });
      gsap.from(sp.words, { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.07, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    $$('[data-up]').forEach(function (el) { gsap.from(el, { autoAlpha: 0, y: 40, duration: 0.6, ease: E, scrollTrigger: { trigger: el, start: 'top 94%', once: true } }); });
    $$('[data-block]').forEach(function (el) { gsap.from(el, { autoAlpha: 0, y: 30, scale: 0.9, duration: 0.8, ease: E, scrollTrigger: { trigger: el, start: 'top 90%', once: true } }); });
    $$('[data-cards]').forEach(function (g) {
      $$(':scope > *', g).forEach(function (c, i) {
        gsap.from(c, { autoAlpha: 0, y: 40, scale: 0.95, duration: 0.7, ease: E, delay: (i % 3) * 0.08, scrollTrigger: { trigger: c, start: 'top 94%', once: true } });
      });
    });
    // матчи и лента — по очереди (лента — сверху, как блог в тесте)
    $$('#mlist .mc').forEach(function (c, i) { gsap.from(c, { autoAlpha: 0, y: 40, scale: 0.95, duration: 0.7, ease: E, delay: (i % 4) * 0.08, scrollTrigger: { trigger: c, start: 'top 94%', once: true } }); });
    var fd = $$('#feed > .pc'); if (fd.length) gsap.from(fd, { autoAlpha: 0, y: -40, duration: 0.8, stagger: 0.18, ease: E, scrollTrigger: { trigger: '#feed', start: 'top 85%', once: true } });
    // итоги: карточки выезжают, цифры набегают, полоски заполняются, линия рисуется
    $$('#months .mo').forEach(function (c, i) {
      var bars = $$('.bar i, .bar u', c), w = bars.map(function (b) { return b.style.width; });
      gsap.set(c, { autoAlpha: 0, y: 40, scale: 0.95 }); gsap.set(bars, { width: 0 });
      ScrollTrigger.create({ trigger: c, start: 'top 92%', once: true, onEnter: function () {
        var d = MOB ? 0 : (i % 4) * 0.1;
        gsap.to(c, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: E, delay: d });
        bars.forEach(function (b, k) { gsap.to(b, { width: w[k], duration: 1.2, ease: 'power2.out', delay: d + 0.2 }); });
        gsap.delayedCall(d + 0.1, function () { $$('.big b, .big span, .hk b, .meta b', c).forEach(function (e) { countUp(e, 1.3); }); });
      } });
    });
    var line = $('#chart polyline');
    if (line && line.getTotalLength) {
      var len = line.getTotalLength(), tail = $$('#chart circle, #chart text.end');
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len }); gsap.set(tail, { autoAlpha: 0 }); gsap.set('#chart', { autoAlpha: 0, y: 30 });
      ScrollTrigger.create({ trigger: '#chart', start: 'top 85%', once: true, onEnter: function () {
        gsap.to('#chart', { autoAlpha: 1, y: 0, duration: 0.7, ease: E });
        gsap.to(line, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut', delay: 0.2 });
        gsap.to(tail, { autoAlpha: 1, duration: 0.5, delay: 2.3 });
      } });
    }
    // полноэкранные вставки: закреплены (sticky), при входе 1,2 → 1
    $$('.full').forEach(function (f) {
      var m = f.querySelector('video, img');
      if (m) gsap.fromTo(m, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'top top', scrub: true } });
      var ov = f.querySelector('.over'); if (ov) gsap.from(ov, { yPercent: 60, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top 80%', end: 'top 20%', scrub: true } });
    });
    // стопка «Как появляется прогноз»
    $$('[data-stack]').forEach(function (st) {
      var step = +st.dataset.stack, base = +(st.dataset.top || 120);
      $$(':scope > *', st).forEach(function (c, i, cs) {
        c.style.top = (MOB ? 76 + i * 16 : base + i * step) + 'px';
        if (i < cs.length - 1) gsap.to(c, { scale: 1 - 0.03 * (cs.length - 1 - i), ease: 'none', scrollTrigger: { trigger: cs[i + 1], start: 'top bottom', end: 'top ' + (base + (i + 1) * step) + 'px', scrub: true } });
      });
    });
    ScrollTrigger.refresh();
  }

  function start() {
    if (/\/index\.html$/.test(location.pathname) && history.replaceState) history.replaceState(history.state, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash);   // без index.html
    heroData(); doors(); matches(); ui(); videos();
    var rj = fetch('/data/results.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    var mt = fetch('/data/mtext.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    var data = Promise.all([rj, mt]).then(function (x) { if (x[0]) results(x[0]); feed(x[0], x[1]); });
    if (RM || MOB || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4) { document.documentElement.classList.remove('anim'); return; }   // v5: лёгкий режим — без GSAP/Lenis, всё видно сразу
    var p = Promise.resolve();
    ['gsap-3.15.1.min.js', 'ScrollTrigger-3.15.1.min.js', 'SplitText-3.15.1.min.js', '/draft/v5/assets/locomotive/locomotive-scroll.min.js'].forEach(function (f) { p = p.then(function () { return load(f); }); });
    Promise.all([p, data, document.fonts ? document.fonts.ready : 0]).then(function () { var l = smooth(); tickers(l); animate(l); })
      .catch(function (e) { document.documentElement.classList.remove('anim'); if (window.console) console.warn(e); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
