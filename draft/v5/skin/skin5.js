/* «Кожа» v5 — весь сайт в новом стиле (черновик /draft/v5/). Поверх существующих страниц: данные, ссылки, поиск, избранное,
   фильтры — как есть. Правила без лагов (владелец 26.11):
   • анимируются только transform и opacity (без blur, теней, WebGL);
   • «лёгкий режим» — ≤4 ядер или ≤4 ГБ памяти, телефон, «уменьшить движение»: без GSAP/Lenis/видео/закреплений, только мягкое
     появление на CSS через IntersectionObserver; полный режим — GSAP 3.15.1 + ScrollTrigger + Lenis 1.3.28 (локально);
   • анимации запускаются, только когда блок виден; картинки — ленивая загрузка.
   Тема: ?theme=bw | ?theme=alt (запоминается до закрытия вкладки), по умолчанию — alt. */
(function () {
  'use strict';
  var V = '/draft/anim/vendor/', D = '/draft/v5';
  var mq = function (q) { return window.matchMedia && matchMedia(q).matches; };
  var RM = mq('(prefers-reduced-motion: reduce)'), MOB = mq('(max-width: 809px)');
  var WEAK = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  var LITE = RM || MOB || WEAK;
  var doc = document.documentElement;
  doc.classList.add(LITE ? 'v5-lite' : 'v5-full'); if (RM) doc.classList.add('v5-rm');
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var main = document.querySelector('main') || document.body;

  /* ── черновик: ссылки сайта → черновые копии v5; адреса без index.html ── */
  var RX = /^\/(hockey|football|khl|nhl|team|trendy|prognozy|epl|laliga|seriea|bundesliga|ligue1|rpl|ucl|uel|me)\/|^\/(results|matches|model|forecast|glossary)\.html$/;
  function draftHref(a) {
    try {
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname.indexOf(D + '/') === 0) return null;
      var p = u.pathname.replace(/\/index\.html$/, '/');
      if (p === '/') return D + '/' + u.search + u.hash;
      if (RX.test(p) && !/\.(js|json|css|webp|png|jpg|svg|xml)$/.test(p)) return D + p + u.search + u.hash;
    } catch (e) {}
    return null;
  }
  function shortUrls(root) {
    $$('a[href*="index.html"]', root).forEach(function (a) {
      try { var u = new URL(a.href, location.href); if (u.origin === location.origin && /\/index\.html$/.test(u.pathname)) a.setAttribute('href', u.pathname.replace(/index\.html$/, '') + u.search + u.hash); } catch (e) {}
    });
  }
  if (/\/index\.html$/.test(location.pathname) && history.replaceState) history.replaceState(history.state, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented) return;
    var h = draftHref(a); if (h) a.setAttribute('href', h);
  }, true);

  /* ── высота шапки для закреплённой шапки таблиц; таблицы — вбок на телефоне ── */
  function topOffset() {
    var hd = document.querySelector('.hd'); doc.style.setProperty('--jv-top', Math.round(hd ? hd.getBoundingClientRect().height : 64) + 'px');
  }
  function tables() {
    $$('table', main).forEach(function (t) {
      if (t.dataset.v5T) return; t.dataset.v5T = 1;
      var p = t.parentElement, ov = p && getComputedStyle(p).overflowX, wide = t.scrollWidth > (p ? p.clientWidth : innerWidth) + 2;
      if (MOB || wide) { if (!(ov === 'auto' || ov === 'scroll')) { var w = document.createElement('div'); w.className = 'jv-tscroll'; t.parentNode.insertBefore(w, t); w.appendChild(t); } else p.classList.add('jv-tscroll'); }
      else if (p && (ov === 'auto' || ov === 'hidden') && p.tagName !== 'BODY') p.style.overflowX = 'visible';
    });
    $$('img:not([loading])', main).forEach(function (i) { if (i.getBoundingClientRect().top > innerHeight) i.loading = 'lazy'; });
  }

  /* ── заголовок страницы по словам — CSS (без blur), не ждёт библиотек ── */
  function h1words() {
    var h = main.querySelector('h1'); if (!h || RM || h.dataset.v5W) return; h.dataset.v5W = 1;
    var i = 0, walk = function (n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3 && c.textContent.trim()) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement('span'); s.className = 'v5-w'; s.style.animationDelay = (i++ * 0.06) + 's'; s.textContent = w; f.appendChild(s);
          });
          n.replaceChild(f, c);
        } else if (c.nodeType === 1 && !/^(SVG|IMG|BR)$/i.test(c.tagName)) walk(c);
      });
    };
    walk(h); h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  }

  /* ── «лесенка»: группы из ≥3 одинаковых детей (карусели/вкладки/скрытое — не трогаем) ── */
  function groups(root) {
    var out = [];
    $$('div, ul, ol, section', root).forEach(function (el) {
      if (el.dataset.v5G || el.closest('table, nav, .hd, header, footer, select, [role]')) return;
      var ch = el.children; if (ch.length < 3 || ch.length > 80) return;
      var sig = function (c) { return c.tagName + '.' + (typeof c.className === 'string' ? c.className.split(' ')[0] : ''); }, s0 = sig(ch[0]), same = 0;
      for (var i = 0; i < ch.length; i++) if (sig(ch[i]) === s0) same++;
      if (same / ch.length < 0.8) return;
      var h = ch[0].getBoundingClientRect().height; if (h < 36 || h > 900 || el.scrollWidth > el.clientWidth + 4) return;
      for (var j = 0; j < ch.length; j++) { var cs = getComputedStyle(ch[j]); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.99 || cs.position === 'absolute' || ch[j].hidden) return; }
      if (out.some(function (g) { return g.contains(el); })) return;
      out.push(el);
    });
    return out;
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('v5-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px' }) : null;
  function reveal(root) {
    if (RM || !io) return;
    groups(root).forEach(function (g) {
      g.dataset.v5G = 1;
      Array.prototype.slice.call(g.children).forEach(function (c, i) {
        if (c.getBoundingClientRect().top < innerHeight * 0.9) return;
        c.classList.add('v5-r'); c.style.transitionDelay = ((i % 4) * 0.06) + 's'; io.observe(c);
      });
    });
    $$('table, h2', root).forEach(function (t) {
      if (t.dataset.v5R || t.getBoundingClientRect().top < innerHeight * 0.9 || t.closest('[role], .v5-r')) return;
      t.dataset.v5R = 1; t.classList.add('v5-r'); io.observe(t);
    });
  }

  /* ── полный режим: Lenis + GSAP (только transform/opacity), цифры набегают один раз ── */
  function load(f) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = V + f; s.async = false; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }
  var NUM = /^([+−-]?)(\d{1,4}(?:,\d{1,2})?)(\s?%?)$/;
  function counts(root) {
    $$('b, strong, span, em, div, p', root).forEach(function (el) {
      if (el.children.length || el.dataset.v5N || el.closest('table, [data-lv], .lv, .hd, input, button, select, nav')) return;
      var t = el.textContent.trim(); if (!NUM.test(t) || !(/%$/.test(t) || parseFloat(getComputedStyle(el).fontSize) >= 22)) return;
      el.dataset.v5N = 1;
      ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: function () {
        var src = el.textContent, m = NUM.exec(src.trim()); if (!m) return;
        var end = parseFloat(m[2].replace(',', '.')), dec = (m[2].split(',')[1] || '').length, o = { k: 0 }, last = src;
        gsap.to(o, { k: 1, duration: 1.1, ease: 'power2.out', onUpdate: function () {
          if (el.textContent !== last) { o.k = 1; return; }
          last = el.textContent = src.replace(m[2], (end * o.k).toFixed(dec).replace('.', ','));
        }, onComplete: function () { if (el.textContent === last) el.textContent = src; } });
      } });
    });
  }
  function full() {
    var p = Promise.resolve();
    ['gsap-3.15.1.min.js', 'ScrollTrigger-3.15.1.min.js', 'lenis-1.3.28.min.js'].forEach(function (f) { p = p.then(function () { return load(f); }); });
    p.then(function () {
      gsap.registerPlugin(ScrollTrigger);
      var lenis = new Lenis(); window.jvLenis = lenis;
      lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="#"]'); if (!a) return;
        var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash) return;
        var el = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -72 });
      }, true);
      counts(main);
      var pend; new MutationObserver(function () { clearTimeout(pend); pend = setTimeout(function () { counts(main); ScrollTrigger.refresh(); }, 300); }).observe(main, { childList: true, subtree: true });
    }).catch(function () {});
  }

  function start() {
    h1words(); shortUrls(); topOffset(); tables(); reveal(main);
    addEventListener('resize', topOffset); setTimeout(function () { topOffset(); shortUrls(); }, 1200);
    var pend; new MutationObserver(function () { clearTimeout(pend); pend = setTimeout(function () { shortUrls(); tables(); reveal(main); }, 300); })
      .observe(main, { childList: true, subtree: true });
    if (!LITE) (window.requestIdleCallback || setTimeout)(full, { timeout: 1500 });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
})();
