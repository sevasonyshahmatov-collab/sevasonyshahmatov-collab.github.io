/* Тест «движение как у образца» (/draft/test-rep/). Свой код на GSAP 3.15.1 (ScrollTrigger, SplitText) + Lenis 1.3.28,
   локальные файлы /draft/anim/vendor. Значения — по замерам образца (см. отчёт): слово 0,5 с / шаг 0,07 с / 10 px / blur 10 px,
   абзац 40 px, карточка 0,95 + 40 px, блок 0,9 + 30 px, блог сверху 40 px с шагом 0,25 с, фото во весь экран 1,2 → 1,
   бегущая строка ~110 px/с с ускорением от прокрутки, кнопки — перекат надписи 0,45 с. «Уменьшить движение» — без анимаций. */
(function () {
  'use strict';
  var V = '/draft/anim/vendor/';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOB = window.matchMedia && matchMedia('(max-width: 809px)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var E = 'power3.out';                                         // «пружина» Framer без отскока ≈ power3.out

  function load(f) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = V + f; s.async = false; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }

  /* меню телефона и аккордеон работают и без анимаций */
  function ui() {
    var b = document.querySelector('.burger');
    if (b) b.addEventListener('click', function () {
      var on = document.documentElement.classList.toggle('menu-open');
      b.setAttribute('aria-expanded', on);
      if (window.jvLenis) on ? jvLenis.stop() : jvLenis.start();
      if (on && window.gsap && !RM) gsap.fromTo('.mmenu a, .mmenu .btn', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: E, delay: 0.15 });
    });
    $$('.mmenu a').forEach(function (a) { a.addEventListener('click', function () { document.documentElement.classList.remove('menu-open'); if (window.jvLenis) jvLenis.start(); }); });
    $$('.qa').forEach(function (q) {
      var btn = q.querySelector('button'), ans = q.querySelector('.ans');
      btn.addEventListener('click', function () {
        var open = !q.classList.contains('open');
        $$('.qa.open').forEach(function (o) { if (o !== q) { o.classList.remove('open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); setH(o.querySelector('.ans'), 0); } });
        q.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
        setH(ans, open ? ans.scrollHeight : 0);
      });
    });
    function setH(el, h) {
      if (window.gsap && !RM) gsap.to(el, { height: h, duration: 0.5, ease: E, onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); } });
      else el.style.height = h ? 'auto' : '0';
    }
  }

  /* Lenis + ScrollTrigger + общий тикер; якоря — через lenis.scrollTo */
  function smooth() {
    var lenis = new Lenis();
    window.jvLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]'); if (!a) return;
      var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash) return;
      var el = document.getElementById(u.hash.slice(1)); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -64 });
    }, true);
    return lenis;
  }

  /* бегущая строка: бесконечно, ~110 px/с, при прокрутке ускоряется по скорости Lenis */
  function tickers(lenis) {
    $$('.ticker').forEach(function (t) {
      var inner = t.querySelector('.ticker-in'), dir = t.dataset.dir === 'r' ? 1 : -1;
      inner.innerHTML += inner.innerHTML;                       // две копии для бесшовности
      var w = 0, x = 0, speed = 110;
      var measure = function () { w = inner.scrollWidth / 2; };
      measure(); window.addEventListener('resize', measure);
      gsap.ticker.add(function (time, dt) {
        var v = lenis ? Math.min(Math.abs(lenis.velocity) * 60, 900) : 0;
        x += dir * (speed + v) * dt / 1000;
        if (x <= -w) x += w; if (x > 0) x -= w;
        inner.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      });
    });
  }

  function words(el, delay) {                                   // по словам: 10 px снизу, размытие 10 px → 0
    var sp = SplitText.create(el, { type: 'words' });
    gsap.set(el, { visibility: 'visible' });
    return gsap.from(sp.words, { autoAlpha: 0, y: 10, filter: 'blur(10px)', duration: 0.5, stagger: 0.07, ease: 'power2.out', delay: delay || 0,
      scrollTrigger: delay == null ? { trigger: el, start: 'top 92%', once: true } : null });
  }
  function count(el) {
    var end = parseFloat(el.dataset.count.replace(',', '.')), dec = (el.dataset.count.split(',')[1] || '').length, suf = el.dataset.suf || '', o = { v: 0 };
    el.textContent = '0' + suf;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = o.v.toFixed(dec).replace('.', ',') + suf; } });
    } });
  }

  function animate(lenis) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    /* загрузка: огромное название падает сверху (−106 px, 1,2 с), остальное — снизу 20–48 px */
    var mega = document.querySelector('.hero .mega');
    if (mega) {
      gsap.set(mega, { visibility: 'visible' });
      gsap.from(mega, { y: -106, autoAlpha: 0.12, duration: 1.2, ease: E });
      gsap.from('.hero [data-load]', { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: E, delay: 0.2 });
      gsap.from('.hero .hero-act .btn', { y: 48, autoAlpha: 0, duration: 1, stagger: 0.08, ease: E, delay: 0.35 });
    }
    $$('[data-words]').forEach(function (el) { words(el, el.closest('.post-hero, .phero-t') ? 0.2 : null); });
    $$('[data-up]').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 40, duration: 0.6, ease: E, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    $$('[data-block]').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 30, scale: 0.9, duration: 0.8, ease: E, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-cards]').forEach(function (g) {                    // карточки: 0,95 + 40 px, по очереди
      var cs = $$(':scope > *', g);
      cs.forEach(function (c, i) {
        gsap.from(c, { autoAlpha: 0, y: 40, scale: 0.95, duration: 0.7, ease: E, delay: (i % 3) * 0.08,
          scrollTrigger: { trigger: c, start: 'top 92%', once: true } });
      });
    });
    $$('[data-drop]').forEach(function (g) {                     // блог: сверху 40 px, шаг 0,25 с
      gsap.from($$(':scope > *', g), { autoAlpha: 0, y: -40, duration: 0.8, stagger: 0.25, ease: E, scrollTrigger: { trigger: g, start: 'top 85%', once: true } });
    });
    $$('[data-count]').forEach(count);

    /* фото во весь экран: закреплено (CSS sticky), при входе масштаб 1,2 → 1; значок — уменьшается и поворачивается */
    $$('.full').forEach(function (f) {
      var img = f.querySelector('img');
      gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'top top', scrub: true } });
      var emb = f.querySelector('.emb');
      if (emb) gsap.fromTo(emb, { scale: 1.25, rotate: -20 }, { scale: 0.6, rotate: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.hero-bg img, .phero img').forEach(function (img) {      // первый экран слегка «уходит» под следующий блок
      gsap.to(img, { scale: 1.08, ease: 'none', scrollTrigger: { trigger: img.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
    });

    /* стопки: карточки закреплены с шагом (70 px — «Что внутри», 40 px — «Таблицы»), нижние слегка уменьшаются */
    $$('[data-stack]').forEach(function (st) {
      var step = +st.dataset.stack, base = +(st.dataset.top || 120), shrink = +(st.dataset.shrink || 0), cs = $$(':scope > *', st);
      cs.forEach(function (c, i) {
        c.style.top = (MOB ? 80 + i * 16 : base + i * step) + 'px';
        if (shrink && i < cs.length - 1) {
          gsap.to(c, { scale: 1 - shrink * (cs.length - 1 - i), ease: 'none',
            scrollTrigger: { trigger: cs[i + 1], start: 'top bottom', end: 'top ' + (base + (i + 1) * step) + 'px', scrub: true } });
        }
      });
    });
    if (MOB) $$('.proc .pcard').forEach(function (c, i) { c.style.top = (72 + i * 14) + 'px'; });

    /* итоги: блок закреплён на 3 экрана, карточки пролетают снизу вверх с разной скоростью */
    $$('.fly').forEach(function (fl) {
      $$('.fcard', fl).forEach(function (c, i) {
        var sp = [1.15, 0.85, 1.35, 0.95, 1.2, 0.8][i % 6];
        gsap.fromTo(c, { y: innerHeight * 0.9 }, { y: -innerHeight * 1.6 * sp, ease: 'none',
          scrollTrigger: { trigger: fl, start: 'top top', end: 'bottom bottom', scrub: true } });
      });
    });
    /* «Знакомьтесь» — блок въезжает масштабом; параллакс фото в цифрах */
    $$('.num-img img').forEach(function (im) {
      gsap.fromTo(im, { yPercent: -8, scale: 1.15 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: im, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    ScrollTrigger.refresh();
  }

  function start() {
    ui();
    if (RM) return;
    document.documentElement.classList.add('anim');
    var p = Promise.resolve();
    ['gsap-3.15.1.min.js', 'ScrollTrigger-3.15.1.min.js', 'SplitText-3.15.1.min.js', 'lenis-1.3.28.min.js'].forEach(function (f) { p = p.then(function () { return load(f); }); });
    Promise.all([p, document.fonts ? document.fonts.ready : 0]).then(function () {
      var l = smooth(); tickers(l); animate(l);
    }).catch(function (e) { document.documentElement.classList.remove('anim'); if (window.console) console.warn(e); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
