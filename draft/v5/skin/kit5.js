/* v5 · дизайн-кит раздела «Хоккей»: живые данные для «Открытых итогов» и «Последних прогнозов» + спокойные анимации.
   Данные: window.__RESLITE (data/results-lite.js — уже на странице) — общие итоги; data/results.json (ежедневная сборка) — по лигам
   и последние прогнозы; грузится, только когда блок подходит к экрану (на первый экран не влияет). Ничего не правится вручную.
   Анимации (только полный режим: компьютер, >4 ядер и >4 ГБ, без «уменьшить движение»): GSAP + ScrollTrigger + SplitText,
   прокрутка Lenis (создаёт skin5.js). Только transform/opacity. Лёгкий режим — всё сразу видно, без движения. */
(function () {
  'use strict';
  var doc = document.documentElement;
  if (!doc.dataset.hv) return;                                     // только тема bw
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var num = function (x, d) { return (+x).toFixed(d == null ? 1 : d).replace('.', ','); };
  var pl = function (n, a, b, c) { n = Math.abs(n) % 100; var m = n % 10; return n > 10 && n < 20 ? c : m > 1 && m < 5 ? b : m === 1 ? a : c; };
  var MON = ['', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var FULL = doc.classList.contains('v5-full');

  /* ── «Открытые итоги»: общие цифры (results-lite) ── */
  function totals() {
    var R = window.__RESLITE; if (!R || !R.sum || !R.sum.total) return;
    var a = R.sum.total.all, since = String(R.since || '');
    var set = function (k, v) { $$('[data-k="' + k + '"]').forEach(function (e) { e.textContent = v; }); };
    set('w', a.w); set('n', a.w + a.l); set('rate', num(a.rate)); set('u', (a.units > 0 ? '+' : a.units < 0 ? '−' : '') + num(Math.abs(a.units)));
    if (since) set('since', +since.slice(8, 10) + ' ' + MON[+since.slice(5, 7)]);
    var b = $('#k-trust .k-bar i'); if (b) b.style.transform = 'scaleX(' + (a.w / Math.max(1, a.w + a.l)).toFixed(3) + ')';
    var r = a.rate, c = r >= 70 ? 'Почти три из четырёх прогнозов заходят' : r >= 62 ? 'Примерно два из трёх прогнозов заходят' : r >= 50 ? 'Больше половины прогнозов заходят' : num(r) + ' % прогнозов заходят';
    set('concl', c);
    if (R.built) set('built', R.built.slice(8, 10) + '.' + R.built.slice(5, 7) + ', ' + R.built.slice(11, 16));
  }

  /* ── по лигам и последние прогнозы (results.json — лениво) ── */
  var loaded = false;
  function more() {
    if (loaded) return; loaded = true;
    fetch('/data/results.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (D) {
      var P = (D.picks || []).filter(function (p) { return p.sport === 'hockey'; });
      ['nhl', 'khl'].forEach(function (lg) {
        var all = P.filter(function (p) { return p.lg === lg && (p.r === 'w' || p.r === 'l'); });
        var w = all.filter(function (p) { return p.r === 'w'; }).length, mo = all.filter(function (p) { return p.src === 'model'; }), mw = mo.filter(function (p) { return p.r === 'w'; }).length;
        var box = $('#k-lg-' + lg); if (!box || !all.length) return;
        $('[data-k="pct"]', box).textContent = Math.round(100 * w / all.length) + ' %';
        $('[data-k="lgtxt"]', box).textContent = w + ' из ' + all.length + ' ' + pl(all.length, 'прогноза', 'прогнозов', 'прогнозов') + ' зашли' +
          (mo.length ? ' · по расчёту модели: ' + mw + ' из ' + mo.length : '');
      });
      var ex = P.filter(function (p) { return p.r && p.url; }).sort(function (a, b) { return a.d < b.d ? 1 : -1; }).slice(0, 4), box = $('#k-ex-list');
      if (box && ex.length) box.innerHTML = ex.map(function (p) {
        var d = String(p.d || ''), res = p.r === 'w' ? '<span class="k-res w">✓ Зашло</span>' : p.r === 'l' ? '<span class="k-res l">✕ Не зашло</span>' : '<span class="k-res p">Возврат</span>';
        return '<li><a class="k-exr" data-k-rv href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
          '<span class="k-exr-d"><b>' + (+d.slice(8, 10)) + ' ' + MON[+d.slice(5, 7)] + '</b>' + (p.lg === 'khl' ? 'КХЛ' : 'НХЛ') + '</span>' +
          '<span class="k-exr-m"><span><img src="/' + esc(p.he) + '" alt="" width="28" height="28" loading="lazy">' + esc(p.h) + '</span>' +
          '<span><img src="/' + esc(p.ae) + '" alt="" width="28" height="28" loading="lazy">' + esc(p.a) + '</span></span>' +
          '<span class="k-exr-b">' + esc(p.bet) + '<small>Пост с разбором в канале →</small></span>' +
          '<b class="k-exr-s">' + esc(p.sc || '—') + '</b>' + res + '</a></li>';
      }).join('');
      if (window.__kitAnim) window.__kitAnim($('#k-ex'));
    }).catch(function () {});
  }

  /* ── анимации ── */
  function anim() {
    var gsap = window.gsap, ST = window.ScrollTrigger, SP = window.SplitText;
    if (!gsap || !ST) return;
    if (SP) gsap.registerPlugin(SP);
    doc.classList.add('k-anim');
    var E = 'power3.out';
    function rv(root) {
      $$('[data-k-rv]', root).forEach(function (el, i) {
        if (el.dataset.kDone) return; el.dataset.kDone = 1;
        gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: E, delay: (i % 4) * 0.07, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });
    }
    window.__kitAnim = function (root) { rv(root); ST.refresh(); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      if (SP) $$('.k-h2').forEach(function (h) {                       // заголовки — по строкам, мягко из-под маски
        var s = SP.create(h, { type: 'lines', mask: 'lines', linesClass: 'k-ln' });
        gsap.from(s.lines, { yPercent: 105, opacity: 0, duration: 1, ease: 'power4.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
      });
      rv(document);
      $$('[data-k-count]').forEach(function (el) {                     // цифры досчитываются до значения
        var src = el.textContent, m = /^([+−]?)(\d+)(?:,(\d))?$/.exec(src.trim()); if (!m) return;
        var end = parseFloat(m[2] + (m[3] ? '.' + m[3] : '')), dec = m[3] ? 1 : 0, o = { v: 0 };
        el.textContent = m[1] + (0).toFixed(dec).replace('.', ',');
        ST.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () {
          gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = m[1] + o.v.toFixed(dec).replace('.', ','); }, onComplete: function () { el.textContent = src; } });
        } });
      });
      var bar = $('#k-trust .k-bar i');
      if (bar) { var to = bar.style.transform; gsap.fromTo(bar, { scaleX: 0 }, { scaleX: parseFloat((to.match(/[\d.]+/) || [1])[0]), duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: bar, start: 'top 92%', once: true } }); }
      // шаги: активный подсвечивается, пока идёт прокрутка мимо (заголовок слева закреплён — sticky)
      if (matchMedia('(min-width:1024px)').matches) $$('.k-step').forEach(function (s) {
        ST.create({ trigger: s, start: 'top 60%', end: 'bottom 40%', toggleClass: { targets: s, className: 'k-on' } });
      });
      ST.refresh();
    });
  }

  function start() {
    totals();
    var t = $('#k-trust');
    if (t && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); more(); } }, { rootMargin: '900px 0px' });
      io.observe(t);
    } else more();
    if (!FULL) return;
    if (window.gsap && window.ScrollTrigger) anim(); else document.addEventListener('v5:gsap', anim, { once: true });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
})();
