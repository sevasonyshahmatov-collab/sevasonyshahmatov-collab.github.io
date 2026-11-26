/* Черновик анимаций сайта (26.11.2026, только /draft/).
   • GSAP + ScrollTrigger: блок «По месяцам» — цифры набегают, полоски заполняются, карточки мягко появляются,
     линия «Накопленный результат» рисуется слева направо.
   • Vanta.js (NET или FOG, ?fx=net|fog) — фон первого экрана главной; на телефоне и при «уменьшить движение» — статичная картинка.
   • Lenis — плавная прокрутка, только на компьютере.
   Библиотеки — файлы draft/anim/vendor (версии в README.txt). */
(function () {
  'use strict';
  var V = '/draft/anim/vendor/';
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var REDUCED = mq('(prefers-reduced-motion: reduce)');
  var DESKTOP = mq('(hover: hover) and (pointer: fine) and (min-width: 1024px)');

  function load(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement('script');
      s.src = V + src; s.async = false; s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
  }
  function idle(fn) { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(fn, { timeout: 2000 }); }
  function afterLoad(fn) { document.readyState === 'complete' ? fn() : window.addEventListener('load', fn, { once: true }); }

  /* ── Lenis: плавная прокрутка только на компьютере ── */
  function smooth() {
    if (!DESKTOP || REDUCED || !window.Lenis) return;
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    window.jvLenis = lenis;
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    }
    document.addEventListener('click', function (e) {          // якоря (#faq, #model) — тоже плавно
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || a.target) return;
      var u = new URL(a.href, location.href);
      if (u.pathname !== location.pathname || !u.hash) return;
      var el = document.getElementById(decodeURIComponent(u.hash.slice(1)));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); history.replaceState(null, '', u.hash); }
    });
  }

  /* ── Vanta: фон первого экрана главной ── */
  function fxName() {
    var q = new URLSearchParams(location.search).get('fx');
    return q === 'fog' ? 'fog' : 'net';
  }
  function hero() {
    var hm = document.getElementById('hm-h') && document.getElementById('hm-h').closest('section.hm');
    if (!hm) return;                                           // только главная
    var fx = fxName();
    var box = document.createElement('div');
    box.className = 'jv-vanta jv-vanta-' + fx;
    box.setAttribute('aria-hidden', 'true');
    hm.insertBefore(box, hm.firstChild);
    document.documentElement.classList.add('jv-fx');
    if (REDUCED || !DESKTOP || new URLSearchParams(location.search).get('still') === '1') {
      box.classList.add('is-still');                         // телефон / «уменьшить движение» — картинка
      return;
    }
    afterLoad(function () {
      idle(function () {
        load('three-r134.min.js').then(function () { return load('vanta.' + fx + '-0.5.24.min.js'); }).then(function () {
          var o = { el: box, mouseControls: true, touchControls: false, gyroControls: false, minHeight: 200, minWidth: 200, scale: 1 };
          var eff = fx === 'fog'
            ? window.VANTA.FOG(Object.assign(o, { highlightColor: 0x2fbf73, midtoneColor: 0x123a6e, lowlightColor: 0x1d1147,
                                                  baseColor: 0x060b1a, blurFactor: 0.62, speed: 0.9, zoom: 0.75 }))
            : window.VANTA.NET(Object.assign(o, { color: 0x34d27f, backgroundColor: 0x060b1a, points: 9, maxDistance: 21,
                                                  spacing: 19, showDots: true, scaleMobile: 1 }));
          box.classList.add('is-live');
          window.jvVanta = eff;
        }).catch(function () { box.classList.add('is-still'); });
      });
    });
  }

  /* ── «По месяцам»: числа набегают ── */
  function parts(t) { return t.split(/(\d+(?:[  ]\d{3})*(?:,\d+)?)/); }
  function countUp(el, dur) {
    var src = el.textContent, ps = parts(src), nums = [];
    ps.forEach(function (p, i) {
      if (i % 2) { var dec = (p.split(',')[1] || '').length; nums.push({ i: i, v: parseFloat(p.replace(/[  ]/g, '').replace(',', '.')), dec: dec }); }
    });
    if (!nums.length) return;
    var o = { k: 0 };
    var paint = function () {
      var out = ps.slice();
      nums.forEach(function (n) { out[n.i] = (n.v * o.k).toFixed(n.dec).replace('.', ','); });
      el.textContent = out.join('');
    };
    paint();
    window.gsap.to(o, { k: 1, duration: dur || 1.4, ease: 'power2.out', onUpdate: paint,
                        onComplete: function () { el.textContent = src; } });
  }

  function months() {
    var root = document.getElementById('rs-months');
    if (!root || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    var cards = root.querySelectorAll('.rs-card');
    cards.forEach(function (card, i) {
      var bars = card.querySelectorAll('.rs-bar i, .rs-bar u');
      var widths = Array.prototype.map.call(bars, function (b) { return b.style.width; });
      gsap.set(card, { autoAlpha: 0, y: 34 });
      gsap.set(bars, { width: 0 });
      window.ScrollTrigger.create({
        trigger: card, start: 'top 88%', once: true,
        onEnter: function () {
          var d = (i % 3) * 0.12;
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: d });
          bars.forEach(function (b, k) { gsap.to(b, { width: widths[k], duration: 1.3, ease: 'power2.out', delay: d + 0.25 }); });
          setTimeout(function () {
            card.querySelectorAll('.rs-big b, .rs-big span, .rs-meta b, .rs-split b').forEach(function (el) { countUp(el, 1.4); });
          }, d * 1000 + 150);
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
      window.ScrollTrigger.create({
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
    var hasMonths = !!document.getElementById('rs-months');
    var need = [];
    if (hasMonths && !REDUCED) {
      if (!window.gsap) need.push('gsap-3.13.0.min.js');
      need.push('ScrollTrigger-3.13.0.min.js');
    }
    if (DESKTOP && !REDUCED) need.push('lenis-1.1.20.min.js');
    var p = Promise.resolve();
    need.forEach(function (f) { p = p.then(function () { return load(f); }); });
    p.then(function () { if (hasMonths && !REDUCED) months(); smooth(); }).catch(function () {});
    hero();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
