/* Черновик анимаций сайта (26.11.2026, только /draft/). Все библиотеки — локальные файлы draft/anim/vendor (npm, версии
   зафиксированы, см. README.txt и LICENSES).
   • Lenis 1.3.28 — плавная прокрутка на всём черновике, настройки по умолчанию (палец на телефоне не трогает),
     связан с GSAP ScrollTrigger: lenis.on('scroll', ScrollTrigger.update) + общий тикер gsap.ticker.
     Якорные ссылки и «наверх» (window.scrollTo с behavior:'smooth' в коде сайта) — через lenis.scrollTo.
   • GSAP 3.15.1 + ScrollTrigger + SplitText: «По месяцам» — цифры набегают, полоски заполняются, карточки мягко появляются,
     линия «Накопленный результат» рисуется слева направо; заголовки разделов «Итогов» выезжают по словам.
   • Vanta.js 0.5.24 (NET или FOG, ?fx=net|fog) — фон первого экрана главной; на телефоне — статичная картинка.
   При prefers-reduced-motion: ни Lenis, ни анимаций, фон — статичная картинка. */
(function () {
  'use strict';
  var V = '/draft/anim/vendor/';
  var GSAP = '3.15.1', LENIS = '1.3.28', VANTA = '0.5.24';
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var REDUCED = mq('(prefers-reduced-motion: reduce)');
  var DESKTOP = mq('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
  var OFFSET = -84;                                            // как scroll-padding-top у сайта (липкая шапка)

  function load(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement('script');
      s.src = V + src; s.async = false; s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
  }
  function idle(fn) { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(fn, { timeout: 2000 }); }
  function afterLoad(fn) { document.readyState === 'complete' ? fn() : window.addEventListener('load', fn, { once: true }); }

  /* ── Lenis + ScrollTrigger ── */
  function smooth() {
    if (REDUCED || !window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var lenis = new window.Lenis();                            // настройки по умолчанию
    window.jvLenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    // якоря (#faq, #model, «К содержанию») — через lenis.scrollTo
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || (a.target && a.target !== '_self')) return;
      var u = new URL(a.href, location.href);
      var norm = function (x) { return x.replace(/index\.html$/, ''); };     // /draft/ = /draft/index.html, ?fx= не важен
      if (u.origin !== location.origin || norm(u.pathname) !== norm(location.pathname) || !u.hash) return;
      var id = decodeURIComponent(u.hash.slice(1));
      if (!id || id === 'top') { e.preventDefault(); lenis.scrollTo(0); history.pushState(null, '', u.hash || '#'); return; }
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: OFFSET });
      history.pushState(null, '', u.hash);
      if (id === 'main') { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    }, true);

    // «наверх» и прочие плавные прокрутки кода сайта (window.scrollTo({top, behavior:'smooth'})) — тоже через Lenis
    var nativeTo = window.scrollTo.bind(window);
    window.scrollTo = function (a) {
      if (a && typeof a === 'object' && a.behavior === 'smooth' && a.top != null && !a.left) return lenis.scrollTo(a.top);
      return nativeTo.apply(window, arguments);                // как есть: (x, y) или ({top, behavior:'instant'}) — Lenis сам так крутит
    };
  }

  /* ── Vanta: фон первого экрана главной ── */
  function hero() {
    var h = document.getElementById('hm-h');
    var hm = h && h.closest('section.hm');
    if (!hm) return;                                            // только главная
    var q = new URLSearchParams(location.search);
    var fx = q.get('fx') === 'fog' ? 'fog' : 'net';
    var box = document.createElement('div');
    box.className = 'jv-vanta jv-vanta-' + fx;
    box.setAttribute('aria-hidden', 'true');
    hm.insertBefore(box, hm.firstChild);
    document.documentElement.classList.add('jv-fx');
    if (REDUCED || !DESKTOP || q.get('still') === '1') { box.classList.add('is-still'); return; }
    afterLoad(function () {
      idle(function () {
        load('three-r134.min.js').then(function () { return load('vanta.' + fx + '-' + VANTA + '.min.js'); }).then(function () {
          var o = { el: box, mouseControls: true, touchControls: false, gyroControls: false, minHeight: 200, minWidth: 200, scale: 1 };
          window.jvVanta = fx === 'fog'
            ? window.VANTA.FOG(Object.assign(o, { highlightColor: 0x2fbf73, midtoneColor: 0x123a6e, lowlightColor: 0x1d1147,
                                                  baseColor: 0x060b1a, blurFactor: 0.62, speed: 0.9, zoom: 0.75 }))
            : window.VANTA.NET(Object.assign(o, { color: 0x34d27f, backgroundColor: 0x060b1a, points: 9, maxDistance: 21,
                                                  spacing: 19, showDots: true }));
          box.classList.add('is-live');
        }).catch(function () { box.classList.add('is-still'); });
      });
    });
  }

  /* ── «По месяцам»: числа набегают ── */
  function parts(t) { return t.split(/(\d+(?:[  ]\d{3})*(?:,\d+)?)/); }
  function countUp(el, dur) {
    var src = el.textContent, ps = parts(src), nums = [];
    ps.forEach(function (p, i) {
      if (i % 2) nums.push({ i: i, v: parseFloat(p.replace(/[  ]/g, '').replace(',', '.')), dec: (p.split(',')[1] || '').length });
    });
    if (!nums.length) return;
    var o = { k: 0 };
    var paint = function () {
      var out = ps.slice();
      nums.forEach(function (n) { out[n.i] = (n.v * o.k).toFixed(n.dec).replace('.', ','); });
      el.textContent = out.join('');
    };
    paint();
    window.gsap.to(o, { k: 1, duration: dur || 1.4, ease: 'power2.out', onUpdate: paint, onComplete: function () { el.textContent = src; } });
  }

  function results() {
    var root = document.getElementById('rs-months');
    if (!root) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (window.SplitText) {                                     // заголовки разделов — по словам
      gsap.registerPlugin(window.SplitText);
      document.querySelectorAll('.rsp h2').forEach(function (h) {
        var sp = window.SplitText.create(h, { type: 'words', mask: 'words' });
        gsap.from(sp.words, { yPercent: 110, duration: 0.8, ease: 'power3.out', stagger: 0.06,
                              scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
      });
    }
    root.querySelectorAll('.rs-card').forEach(function (card, i) {
      var bars = card.querySelectorAll('.rs-bar i, .rs-bar u');
      var widths = Array.prototype.map.call(bars, function (b) { return b.style.width; });
      gsap.set(card, { autoAlpha: 0, y: 34 });
      gsap.set(bars, { width: 0 });
      ST.create({
        trigger: card, start: 'top 88%', once: true,
        onEnter: function () {
          var d = (i % 3) * 0.12;
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: d });
          bars.forEach(function (b, k) { gsap.to(b, { width: widths[k], duration: 1.3, ease: 'power2.out', delay: d + 0.25 }); });
          gsap.delayedCall(d + 0.15, function () {
            card.querySelectorAll('.rs-big b, .rs-big span, .rs-meta b, .rs-split b').forEach(function (el) { countUp(el, 1.4); });
          });
        }
      });
    });
    var chart = document.getElementById('rs-chart');
    var line = chart && chart.querySelector('polyline');
    if (line && line.getTotalLength) {
      var len = line.getTotalLength();
      var tail = chart.querySelectorAll('svg circle, svg text[style]');
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(tail, { autoAlpha: 0 });
      gsap.set(chart, { autoAlpha: 0, y: 24 });
      ST.create({
        trigger: chart, start: 'top 85%', once: true,
        onEnter: function () {
          gsap.to(chart, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' });
          gsap.to(line, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut', delay: 0.2,
                          onComplete: function () { line.style.strokeDasharray = ''; line.style.strokeDashoffset = ''; } });
          gsap.to(tail, { autoAlpha: 1, duration: 0.5, delay: 2.3 });
        }
      });
    }
  }

  function start() {
    hero();
    if (REDUCED) return;                                        // «уменьшить движение»: без Lenis и анимаций
    var need = [];
    if (!window.gsap) need.push('gsap-' + GSAP + '.min.js');
    need.push('ScrollTrigger-' + GSAP + '.min.js');
    if (document.getElementById('rs-months')) need.push('SplitText-' + GSAP + '.min.js');
    need.push('lenis-' + LENIS + '.min.js');
    var p = Promise.resolve();
    need.forEach(function (f) { p = p.then(function () { return load(f); }); });
    p.then(function () {
      window.gsap.registerPlugin(window.ScrollTrigger);
      smooth();
      results();
    }).catch(function (e) { if (window.console) console.warn('anim', e); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
