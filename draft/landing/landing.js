/* Лендинг JARVIS (черновик /draft/landing/, 26.11.2026).
   Данные «Результатов» — /data/results.json (тот же файл, что сайт и бот); при сбое — снимок на момент сборки (window.__LD).
   Анимации: GSAP 3.15.1 + ScrollTrigger + SplitText, плавная прокрутка Lenis 1.3.28 (связан с ScrollTrigger и gsap.ticker),
   всё — локальные файлы /draft/anim/vendor. При prefers-reduced-motion — без анимаций и без Lenis. */
(function () {
  'use strict';
  var V = '/draft/anim/vendor/';
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHONE = window.matchMedia && matchMedia('(max-width: 760px)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function load(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement('script'); s.src = V + src; s.async = false; s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
  }

  /* ── данные ── */
  var num = function (x, d) { return (+x).toFixed(d == null ? 1 : d).replace('.', ','); };
  var sign = function (u) { return (u > 0 ? '+' : u < 0 ? '−' : '') + num(Math.abs(u), 1); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function card(name, t, live, total) {
    var a = t.all, h = t.hockey, n = (a.w + a.l + a.p) || 1;
    return '<article class="mcard' + (total ? ' total' : '') + '"><h3>' + esc(name) + (live ? '<em>идёт</em>' : '') + '</h3>' +
      '<div class="mbig"><b>' + a.w + ' из ' + (a.w + a.l) + '</b><span>' + num(a.rate) + '%</span></div>' +
      '<div class="mbar" role="img" aria-label="Зашло ' + a.w + ', не зашло ' + a.l + ', возврат ' + a.p + '"><i style="width:' + (100 * a.w / n).toFixed(2) +
      '%"></i><u style="width:' + (100 * a.p / n).toFixed(2) + '%"></u></div>' +
      (h && h.n ? '<div class="mhockey"><span>Хоккей</span><b>' + h.w + ' из ' + (h.w + h.l) + ' · ' + Math.round(h.rate) + '%</b></div>' : '') +
      '<p class="mmeta"><span>зашло <b>' + a.w + '</b></span><span>не зашло <b>' + a.l + '</b></span>' + (a.p ? '<span>возврат <b>' + a.p + '</b></span>' : '') +
      (a.kef ? '<span>средний кэф <b>' + num(a.kef, 2) + '</b></span>' : '') +
      '<span>результат <b class="' + (a.units >= 0 ? 'pos' : 'neg') + '">' + sign(a.units) + ' ед.</b></span></p></article>';
  }
  function render(d) {
    var s = d.sum;
    $('#months').innerHTML = s.months.map(function (m) { return card(m.name, m, m.live); }).join('') + card('За всё время', s.total, false, true);
    var t = s.total.all;
    $$('[data-key="total.rate"]').forEach(function (e) { e.textContent = num(t.rate) + '%'; });
    $$('[data-key="total.wl"]').forEach(function (e) { e.textContent = t.w + ' из ' + (t.w + t.l); });
    var b = d.built || '', last = s.last_day || '';
    if (b && last) $('#res-upd').textContent = 'Данные по ' + last.slice(8, 10) + '.' + last.slice(5, 7) + ', обновлено ' +
      b.slice(8, 10) + '.' + b.slice(5, 7) + ' в ' + b.slice(11, 16) + ' МСК — тот же файл, что на сайте и в боте.';
  }
  function data() {
    return fetch('/data/results.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { render(d); }).catch(function () { if (window.__LD) render(window.__LD); });
  }

  /* ── числа набегают ── */
  function parts(t) { return t.split(/(\d+(?:,\d+)?)/); }
  function countUp(el, dur) {
    var src = el.textContent, ps = parts(src), nums = [];
    ps.forEach(function (p, i) { if (i % 2) nums.push({ i: i, v: parseFloat(p.replace(',', '.')), dec: (p.split(',')[1] || '').length }); });
    if (!nums.length) return;
    var o = { k: 0 }, paint = function () {
      var out = ps.slice();
      nums.forEach(function (n) { out[n.i] = (n.v * o.k).toFixed(n.dec).replace('.', ','); });
      el.textContent = out.join('');
    };
    paint();
    gsap.to(o, { k: 1, duration: dur || 1.4, ease: 'power2.out', onUpdate: paint, onComplete: function () { el.textContent = src; } });
  }

  /* ── Lenis + ScrollTrigger ── */
  function smooth() {
    var lenis = new Lenis();                                   // настройки по умолчанию: палец на телефоне не трогает
    window.jvLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', function (e) {          // якоря — через lenis.scrollTo
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      var id = a.getAttribute('href').slice(1), el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(id === 'hero' ? 0 : el, { offset: -72 });
      history.replaceState(null, '', '#' + id);
    }, true);
  }

  function animate() {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    var root = document.documentElement;
    // 1. заголовок — по буквам
    var h = $('.hero-h');
    var sp = SplitText.create(h, { type: 'chars' });
    gsap.set(h, { visibility: 'visible' });
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from(sp.chars, { yPercent: 70, autoAlpha: 0, rotateX: -70, transformOrigin: '50% 100%', duration: 1.1, stagger: 0.04 })
      .from('.kicker, .hero-sub', { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, '-=0.6')
      .from('.chips .chip', { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, '-=0.45')
      .from('.hero .cta .btn', { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
      .add(function () { $$('.chips .num').forEach(function (e) { countUp(e, 1.6); }); }, '-=0.9');
    // фото — лёгкий параллакс (на телефоне слабее)
    gsap.fromTo('.hero-photo', { yPercent: 0 }, { yPercent: PHONE ? 6 : 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.hero-photo img', { scale: 1.12, duration: 2.2, ease: 'power2.out' });
    // заголовки секций — по словам
    $$('.h2').forEach(function (el) {
      var s = SplitText.create(el, { type: 'words', mask: 'words' });
      gsap.from(s.words, { yPercent: 110, duration: 0.8, stagger: 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    // карточки выезжают; в карточках месяцев — цифры набегают и полоски заполняются
    $$('.mcard').forEach(function (c, i) {
      var bars = $$('.mbar i, .mbar u', c), w = bars.map(function (b) { return b.style.width; });
      gsap.set(c, { autoAlpha: 0, y: 40 }); gsap.set(bars, { width: 0 });
      ScrollTrigger.create({ trigger: c, start: 'top 90%', once: true, onEnter: function () {
        var d = PHONE ? 0 : (i % 4) * 0.1;
        gsap.to(c, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: d });
        bars.forEach(function (b, k) { gsap.to(b, { width: w[k], duration: 1.2, ease: 'power2.out', delay: d + 0.2 }); });
        gsap.delayedCall(d + 0.1, function () { $$('.mbig b, .mbig span, .mhockey b, .mmeta b', c).forEach(function (e) { countUp(e, 1.3); }); });
      } });
    });
    ['.feat', '.step', '.price', '.faq details'].forEach(function (sel) {
      $$(sel).forEach(function (c, i) {
        gsap.from(c, { autoAlpha: 0, y: 46, duration: 0.85, ease: 'power3.out', delay: PHONE ? 0 : (i % 3) * 0.1,
          scrollTrigger: { trigger: c, start: 'top 90%', once: true } });
      });
    });
    root.classList.add('anim-ready');
  }

  function start() {
    var ready = data();
    if (REDUCED) return;
    $('.hero-h').classList.add('js-hide');
    var p = Promise.resolve();
    ['gsap-3.15.1.min.js', 'ScrollTrigger-3.15.1.min.js', 'SplitText-3.15.1.min.js', 'lenis-1.3.28.min.js'].forEach(function (f) {
      p = p.then(function () { return load(f); });
    });
    Promise.all([p, ready, document.fonts ? document.fonts.ready : null]).then(function () { smooth(); animate(); })
      .catch(function () { $('.hero-h').classList.remove('js-hide'); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
