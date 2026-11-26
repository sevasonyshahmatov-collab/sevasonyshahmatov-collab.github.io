/* «Кожа» v4 для страниц разделов (черновик). Только вид и движение поверх существующих страниц — данные, ссылки, поиск,
   избранное, фильтры остаются как есть. GSAP 3.15.1 (ScrollTrigger, SplitText) + Lenis 1.3.28 — локально.
   Переход между страницами — как на v4: мгновенно + заголовок по словам. На телефоне — лёгкие эффекты; «уменьшить движение» — без них. */
(function () {
  'use strict';
  var V = '/draft/anim/vendor/', D = '/draft/v4';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOB = window.matchMedia && matchMedia('(max-width: 809px)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var main = document.querySelector('main') || document.body;
  var E = 'power3.out';

  /* ── черновик: ссылки раздела ведут на черновые копии (в т.ч. построенные скриптами страниц) ── */
  var DRAFT_RX = /^\/(hockey\/|khl\/|nhl\/|team\/|trendy\/)/;
  function draftHref(a) {
    try {
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname.indexOf(D + '/') === 0) return null;
      if (u.pathname === '/' || u.pathname === '/index.html') return D + '/index.html' + u.search + u.hash;
      if (DRAFT_RX.test(u.pathname) && !/\.(js|json|css|webp|png|jpg|svg)$/.test(u.pathname)) return D + u.pathname + u.search + u.hash;
    } catch (e) {}
    return null;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented) return;
    var h = draftHref(a); if (h) a.setAttribute('href', h);       // браузер перейдёт уже по черновому адресу
  }, true);

  /* ── высота шапки — для закреплённой шапки таблиц ── */
  function topOffset() {
    var hd = document.querySelector('.hd'), sb = document.querySelector('.subbar');
    var h = (hd ? hd.getBoundingClientRect().height : 64) + (sb && getComputedStyle(sb).position === 'fixed' ? sb.getBoundingClientRect().height : 0);
    document.documentElement.style.setProperty('--jv-top', Math.round(h) + 'px');
  }

  /* ── таблицы: на компьютере — шапка закреплена (если таблица помещается), на телефоне — прокрутка вбок ── */
  function tables() {
    $$('table', main).forEach(function (t) {
      if (t.dataset.jvT) return; t.dataset.jvT = 1;
      var p = t.parentElement, ov = p && getComputedStyle(p).overflowX;
      var wide = t.scrollWidth > (p ? p.clientWidth : innerWidth) + 2;
      if (MOB || wide) { if (!(ov === 'auto' || ov === 'scroll')) { var w = document.createElement('div'); w.className = 'jv-tscroll'; t.parentNode.insertBefore(w, t); w.appendChild(t); } else p.classList.add('jv-tscroll'); }
      else if (p && (ov === 'auto' || ov === 'hidden') && p.tagName !== 'BODY') p.style.overflowX = 'visible';   // иначе закреплённая шапка не работает
    });
  }

  /* ── бегущая строка ближайших матчей — в начале главной раздела ── */
  function ticker() {
    if (!/\/hockey\/(index\.html)?$/.test(location.pathname) || document.querySelector('.jv-ticker')) return;
    var J = window.JVL; if (!J || !J.TD) return;
    var now = Date.now(), at = function (t) { return Date.parse(String(t).replace(' ', 'T') + ':00+03:00'); };
    var ms = (J.TD.matches || []).filter(function (m) { return (m.lg === 'khl' || m.lg === 'nhl') && at(m.t) > now - 3 * 36e5; }).sort(function (a, b) { return at(a.t) - at(b.t); }).slice(0, 12);
    if (!ms.length) return;
    var items = ms.map(function (m) {
      var md = J.M[m.key], best = '';
      if (md && md.p1 != null) { var pr = [md.p1, md.x, md.p2], bi = 0; pr.forEach(function (p, i) { if (p > pr[bi]) bi = i; }); best = ' · ' + ['П1', 'Х', 'П2'][bi] + ' ' + Math.round(pr[bi] * 100) + '%'; }
      return '<span>' + (m.lg === 'khl' ? 'КХЛ' : 'НХЛ') + ' ' + m.t.slice(11, 16) + ' <b>' + J.esc(m.hn) + ' — ' + J.esc(m.an) + '</b>' + best + '</span>';
    }).join('');
    var tk = document.createElement('div'); tk.className = 'jv-ticker'; tk.setAttribute('aria-hidden', 'true');
    tk.innerHTML = '<div class="in">' + items + items + '</div>';
    var ft = document.querySelector('footer');                // владелец 26.11: не сверху (дублирует матчи) — внизу, перед подвалом
    if (ft) ft.parentNode.insertBefore(tk, ft); else main.appendChild(tk);
    if (RM || !window.gsap) return;
    var inner = tk.firstChild, x = 0, w = inner.scrollWidth / 2;
    gsap.ticker.add(function (t, dt) { var v = window.jvLenis ? Math.min(Math.abs(jvLenis.velocity) * 60, 700) : 0; x -= (90 + v) * dt / 1000; if (x <= -w) x += w; inner.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)'; });
  }

  function load(f) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = V + f; s.async = false; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }

  /* ── цифры набегают один раз (проценты и крупные числа в карточках; не в таблицах и не в живом счёте) ── */
  var NUM = /^([+−-]?)(\d{1,4}(?:,\d{1,2})?)(\s?%?)$/;
  function countables(root) {
    return $$('b, strong, span, em, i, div, p, small', root).filter(function (el) {
      if (el.children.length || el.dataset.jvN || el.closest('table, [data-lv], .lv, .hd, .tabbar, input, button, select, nav, .jv-ticker')) return false;
      var t = el.textContent.trim(); if (!NUM.test(t)) return false;
      return /%$/.test(t) || parseFloat(getComputedStyle(el).fontSize) >= 22;
    });
  }
  function countUp(el) {
    el.dataset.jvN = 1;
    var src = el.textContent, m = NUM.exec(src.trim()); if (!m) return;
    var end = parseFloat(m[2].replace(',', '.')), dec = (m[2].split(',')[1] || '').length, o = { k: 0 }, last = src;
    gsap.to(o, { k: 1, duration: 1.2, ease: 'power2.out', onUpdate: function () {
      if (el.textContent !== last) { o.k = 1; return; }                 // страница сама обновила число — не мешаем
      last = el.textContent = src.replace(m[2], (end * o.k).toFixed(dec).replace('.', ','));
    }, onComplete: function () { if (el.textContent === last) el.textContent = src; } });
  }

  /* ── «лесенка» карточек: контейнеры с ≥3 одинаковыми детьми (матчи, клубы, игроки) ── */
  function groups(root) {
    var out = [];
    $$('div, ul, ol, section', root).forEach(function (el) {
      if (el.dataset.jvG || el.closest('table, nav, .hd, .tabbar, .jv-ticker, header, footer, select, [data-jv-own]')) return;
      var ch = el.children; if (ch.length < 3 || ch.length > 80) return;
      var sig = function (c) { return c.tagName + '.' + (c.className && c.className.baseVal === undefined ? String(c.className).split(' ')[0] : ''); };
      var s0 = sig(ch[0]), same = 0; for (var i = 0; i < ch.length; i++) if (sig(ch[i]) === s0) same++;
      if (same / ch.length < 0.8) return;
      var h = ch[0].getBoundingClientRect().height; if (h < 36 || h > 900) return;
      // карусели, вкладки, листалки: часть детей скрыта нарочно — такие блоки не трогаем
      for (var j = 0; j < ch.length; j++) { var cs = getComputedStyle(ch[j]); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.99 || ch[j].hidden || ch[j].getAttribute('aria-hidden') === 'true' || cs.position === 'absolute') return; }
      if (el.getAttribute('role') || el.scrollWidth > el.clientWidth + 4) return;
      if (out.some(function (g) { return g.contains(el); })) return;
      out.push(el);
    });
    return out;
  }
  function reveal(root) {
    groups(root).forEach(function (g) {
      g.dataset.jvG = 1;
      var cs = Array.prototype.slice.call(g.children).filter(function (c) { return c.getBoundingClientRect().top > innerHeight * 0.85; });
      if (!cs.length) return;
      gsap.set(cs, { opacity: 0, y: MOB ? 20 : 34 });
      ScrollTrigger.batch(cs, { start: 'top 94%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: E, overwrite: true, clearProps: 'opacity,transform' }); } });
    });
    $$('table', root).forEach(function (t) {
      if (t.dataset.jvF || t.getBoundingClientRect().top < innerHeight * 0.85) return; t.dataset.jvF = 1;
      gsap.set(t, { opacity: 0, y: 16 });
      ScrollTrigger.create({ trigger: t, start: 'top 96%', once: true, onEnter: function () { gsap.to(t, { opacity: 1, y: 0, duration: 0.6, ease: E, clearProps: 'opacity,transform' }); } });
    });
    countables(root).forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight) { countUp(el); return; }
      ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: function () { countUp(el); } });
    });
  }

  function animate() {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    var lenis = new Lenis(); window.jvLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', function (e) {          // якоря страницы — через Lenis
      var a = e.target.closest && e.target.closest('a[href*="#"]'); if (!a) return;
      var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash) return;
      var el = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -parseInt(getComputedStyle(document.documentElement).getPropertyValue('--jv-top') || 64) - 8 });
    }, true);
    if (document.documentElement.dataset.jv !== 'b') $$('h2', main).forEach(function (el) {   // в варианте B — по буквам (variants.js)
      if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
      var s = SplitText.create(el, { type: 'words' });
      gsap.from(s.words, { autoAlpha: 0, y: 10, filter: 'blur(10px)', duration: 0.5, stagger: 0.07, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    reveal(main);
    // данные дорисовываются скриптами страниц позже — догоняем новые блоки
    var pend = null;
    new MutationObserver(function () { clearTimeout(pend); pend = setTimeout(function () { tables(); reveal(main); ScrollTrigger.refresh(); }, 250); })
      .observe(main, { childList: true, subtree: true });
    ticker();
  }

  /* заголовок страницы — по словам сразу при открытии, на CSS (не ждёт библиотек и не прячет заголовок: скорость первой отрисовки) */
  function h1words() {
    var h = main.querySelector('h1'); if (!h || RM || h.dataset.jvW) return; h.dataset.jvW = 1;
    var i = 0, walk = function (n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3 && c.textContent.trim()) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement('span'); s.className = 'jv-w'; s.style.animationDelay = (i++ * 0.07) + 's'; s.textContent = w; f.appendChild(s);
          });
          n.replaceChild(f, c);
        } else if (c.nodeType === 1 && !/^(SVG|IMG|BR)$/i.test(c.tagName)) walk(c);
      });
    };
    walk(h); h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  }
  function start() {
    h1words();
    topOffset(); window.addEventListener('resize', topOffset);
    setTimeout(topOffset, 800);
    tables();
    if (RM) { ticker(); return; }
    var p = Promise.resolve();
    ['gsap-3.15.1.min.js', 'ScrollTrigger-3.15.1.min.js', 'SplitText-3.15.1.min.js', 'lenis-1.3.28.min.js'].forEach(function (f) { p = p.then(function () { return load(f); }); });
    Promise.all([p, document.fonts ? document.fonts.ready : 0]).then(function () { tables(); animate(); })
      .catch(function () { document.documentElement.classList.remove('jv-anim'); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
})();
