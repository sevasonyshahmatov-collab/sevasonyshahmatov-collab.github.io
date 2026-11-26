/* Поведение вариантов A/B/C главной раздела «Хоккей» (черновик). Подключается ДО skin.js: помечает свои блоки (data-jv-own),
   чтобы общая «лесенка» их не трогала. Анимации — после загрузки GSAP (его грузит skin.js). Телефон: без видео и живого фона;
   «уменьшить движение» — без анимаций. */
(function () {
  'use strict';
  var d = document.documentElement, V = d.dataset.jv;
  if (!V) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOB = window.matchMedia && matchMedia('(max-width: 809px)').matches;
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var ml = $('#mlist'); if (ml) ml.dataset.jvOwn = 1;

  /* A: видео на первом экране — только компьютер */
  if (V === 'a') {
    var v = $('.jv-arena video');
    if (v) {
      if (MOB || RM) v.remove();
      else {                     // видео — только после полной загрузки страницы: не мешает первой отрисовке (заставка уже на экране)
        var go = function () { (window.requestIdleCallback || setTimeout)(function () {
          v.src = v.canPlayType('video/webm; codecs="vp9"') ? v.dataset.src.replace(/\.mp4$/, '.webm') : v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); }, { timeout: 1500 }); };
        document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
      }
    }
  }

  /* B: живая сетка (свой лёгкий canvas вместо three.js) — только компьютер */
  if (V === 'b' && !MOB && !RM) {
    var box = $('.jv-netbg'), cv = document.createElement('canvas'); box.appendChild(cv);
    var ctx = cv.getContext('2d'), W, H, pts = [], N = 70, DPR = Math.min(2, window.devicePixelRatio || 1);
    var size = function () { W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR; };
    size(); addEventListener('resize', size);
    for (var i = 0; i < N; i++) pts.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00025, vy: (Math.random() - .5) * .00025 });
    var mx = -1, my = -1; addEventListener('mousemove', function (e) { mx = e.clientX * DPR; my = e.clientY * DPR; });
    var run = true; document.addEventListener('visibilitychange', function () { run = !document.hidden; if (run) requestAnimationFrame(draw); });
    var draw = function () {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      var L = 180 * DPR;
      for (var i = 0; i < N; i++) {
        var a = pts[i]; a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > 1) a.vx *= -1; if (a.y < 0 || a.y > 1) a.vy *= -1;
        var ax = a.x * W, ay = a.y * H;
        for (var j = i + 1; j < N; j++) {
          var b = pts[j], dx = ax - b.x * W, dy = ay - b.y * H, dd = Math.sqrt(dx * dx + dy * dy);
          if (dd < L) { ctx.strokeStyle = 'rgba(228,255,58,' + (0.22 * (1 - dd / L)).toFixed(3) + ')'; ctx.lineWidth = DPR; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(b.x * W, b.y * H); ctx.stroke(); }
        }
        if (mx >= 0) { var ex = ax - mx, ey = ay - my, de = Math.sqrt(ex * ex + ey * ey); if (de < L * 1.3) { ctx.strokeStyle = 'rgba(228,255,58,' + (0.35 * (1 - de / (L * 1.3))).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, my); ctx.stroke(); } }
        ctx.fillStyle = 'rgba(228,255,58,.7)'; ctx.beginPath(); ctx.arc(ax, ay, 1.6 * DPR, 0, 6.3); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    (window.requestIdleCallback || setTimeout)(function () { requestAnimationFrame(draw); });
  }

  /* анимации — когда skin.js загрузит GSAP */
  if (RM) return;
  var tries = 0, wait = setInterval(function () {
    if (!(window.gsap && window.ScrollTrigger && window.SplitText) && ++tries < 100) return;
    clearInterval(wait); if (!window.gsap) return;
    var E = 'power3.out';
    gsap.registerPlugin(ScrollTrigger, SplitText);
    var cards = function () { return $$('#mlist li.match').filter(function (c) { return !c.dataset.jvC; }); };
    var bind = function () {
      var cs = cards(); if (!cs.length) return;
      cs.forEach(function (c) { c.dataset.jvC = 1; });
      var below = cs.filter(function (c) { return c.getBoundingClientRect().top > innerHeight * 0.85; });
      if (V === 'a') {          // крупные карточки выезжают снизу с размытием
        gsap.set(below, { opacity: 0, y: 70, filter: 'blur(10px)' });
        ScrollTrigger.batch(below, { start: 'top 94%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.1, ease: E, clearProps: 'filter,transform,opacity' }); } });
      } else if (V === 'b') {   // поочерёдно слева / справа
        below.forEach(function (c, i) { gsap.set(c, { opacity: 0, x: (i % 2 ? 1 : -1) * (MOB ? 30 : 90) }); });
        ScrollTrigger.batch(below, { start: 'top 94%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, x: 0, duration: 0.8, stagger: 0.08, ease: E, clearProps: 'transform,opacity' }); } });
      } else {                  // C: мягкий подъём
        gsap.set(below, { opacity: 0, y: 40 });
        ScrollTrigger.batch(below, { start: 'top 94%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: E, clearProps: 'transform,opacity' }); } });
      }
    };
    bind();
    if (ml) new MutationObserver(function () { setTimeout(bind, 150); }).observe(ml, { childList: true });
    if (V === 'a') {
      var ar = $('.jv-arena'), mega = $('.jv-mega');
      if (mega) gsap.from(mega, { yPercent: -30, opacity: 0.1, duration: 1.2, ease: E });
      if (ar) {
        gsap.to('.jv-arena video, .jv-arena img', { scale: 1, ease: 'none', scrollTrigger: { trigger: '#hsday', start: 'top bottom', end: 'top top', scrub: true } });
        // первый экран полностью закрыт «шторкой» — прячем его, чтобы нигде не просвечивал
        ScrollTrigger.create({ trigger: '#hsday', start: 'top top', onEnter: function () { ar.style.visibility = 'hidden'; }, onLeaveBack: function () { ar.style.visibility = ''; } });
      }
    }
    if (V === 'b') {
      $$('main h2:not(.sr-only)').forEach(function (h) {   // заголовки разделов — по буквам
        var s = SplitText.create(h, { type: 'chars' });
        gsap.from(s.chars, { opacity: 0, y: 18, rotateX: -80, duration: 0.5, stagger: 0.025, ease: E, scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
      });
      $$('main > section:not(#matches) > .wrap').forEach(function (w, i) {   // блоки — слева/справа поочерёдно
        if (w.getBoundingClientRect().top < innerHeight) return;
        gsap.from(w, { opacity: 0, x: (i % 2 ? 1 : -1) * (MOB ? 30 : 110), duration: 0.9, ease: E, scrollTrigger: { trigger: w, start: 'top 88%', once: true }, clearProps: 'transform,opacity' });
      });
    }
    if (V === 'c' && !MOB) {    // параллакс эмблем и фото
      var par = function () {
        $$('#mlist li.match .em, .lcard img, .hs-board img').forEach(function (im) {
          if (im.dataset.jvP) return; im.dataset.jvP = 1;
          gsap.fromTo(im, { y: 14 }, { y: -14, ease: 'none', scrollTrigger: { trigger: im, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      };
      par(); if (ml) new MutationObserver(function () { setTimeout(par, 200); }).observe(ml, { childList: true });
    }
    ScrollTrigger.refresh();
  }, 80);
})();
