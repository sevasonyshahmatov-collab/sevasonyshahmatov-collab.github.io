/* правки владельца 28.11: первый экран (свет от курсора, варианты), смена видео, шаги по одному, листание экранов бота, цифры итогов */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── первый экран: свет от курсора на JARVIS (ПК) и переключатель вариантов в плашке черновика ── */
  function hero() {
    var w = $('.hero .hw'), h = $('.hero');
    if (w) {                                                   // общий фон слова: смещение каждой буквы
      var lay = function () { w.style.setProperty('--W', w.offsetWidth + 'px'); $$('.mk', w).forEach(function (m) { m.firstChild.style.setProperty('--x', m.offsetLeft + 'px'); }); };
      var sig = $('.hero .hsig'), I = $$('.ch', w)[4];
      /* размеры букв Oswald 600 из файла шрифта (доли кегля): I — чернила от 0,0627 до 0,22723; B — от 0,06064, ширина B 0,574, E 0,438,
         правый край T 0,42634; высота заглавных 0,81, базовая линия при line-height 1 — 0,952 */
      var fit = function () {                                  // BET ровно под буквой I: края совпадают на любой ширине
        if (!sig || !I || document.documentElement.dataset.hero !== 'a') return;
        var fs = parseFloat(getComputedStyle(I).fontSize), iW = 0.16453 * fs, F = 0, ls = 0;
        var x0 = I.parentNode.getBoundingClientRect().left + 0.0627 * fs - sig.getBoundingClientRect().left;
        [.3, .22, .14, .07, 0].some(function (l) { F = iW / (1.3777 + 2 * l); ls = l; return F >= 11; });   // разрядка меньше, если буквы мельче 11 px
        var gap = Math.max(10, iW * .45), v = { '--bf': F + 'px', '--ls': ls + 'em', '--bx': (x0 - 0.06064 * F) + 'px', '--ly': (0.547 * F) + 'px', '--bh': F + 'px',
          '--lw': Math.max(0, x0 - gap) + 'px', '--ex': (x0 + iW + gap) + 'px', '--mt': Math.max(12, fs * .05) + 'px' };
        for (var k in v) sig.style.setProperty(k, v[k]);
        sig.classList.add('fit');
        var he = $('.he', sig), av = sig.clientWidth - (x0 + iW + gap), f;   // «аналитика матчей» помещается справа от I: строка, иначе две, мельче
        if (he && av > 20) {
          he.style.fontSize = ''; he.style.whiteSpace = 'nowrap'; he.style.maxWidth = av + 'px'; f = parseFloat(getComputedStyle(he).fontSize);
          while (f > 9 && he.scrollWidth > av + .5) { f -= .5; he.style.fontSize = f + 'px'; }
          if (he.scrollWidth > av + .5) { he.style.whiteSpace = 'normal'; while (f > 6.5 && he.scrollWidth > av + .5) { f -= .5; he.style.fontSize = f + 'px'; } }
        }
      };
      lay(); fit(); addEventListener('resize', function () { lay(); fit(); }); if (document.fonts) document.fonts.ready.then(function () { lay(); fit(); });
    }
    if (w && h && !RM && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      var raf = 0, ev = null;
      h.addEventListener('pointermove', function (e) { ev = e; if (raf) return; raf = requestAnimationFrame(function () { raf = 0;
        var r = w.getBoundingClientRect(), near = ev.clientY > r.top - 60 && ev.clientY < r.bottom + 60;
        w.style.setProperty('--mx', (ev.clientX - r.left).toFixed(0) + 'px'); w.style.setProperty('--my', (ev.clientY - r.top).toFixed(0) + 'px'); w.classList.toggle('lit', near); }); });
      h.addEventListener('pointerleave', function () { w.classList.remove('lit'); });
    }
    var bd = $('.jv-draft') || $('body > .draft'), cur = document.documentElement.dataset.hero;
    if (bd && cur) bd.insertAdjacentHTML('beforeend', ' · экран: ' + [['a', 'А'], ['b', 'Б'], ['c', 'В']].map(function (x) {
      return x[0] === cur ? '<b>' + x[1] + '</b>' : '<a href="?theme=bw&hero=' + x[0] + '">' + x[1] + '</a>'; }).join(' · '));
  }

  /* ── смена видео: хоккей ↔ футбол ── */
  function rotate() {
    var s = $('.full.rot'); if (!s) return;
    var cur = 'hk';
    setInterval(function () {
      var r = s.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      cur = cur === 'hk' ? 'fb' : 'hk';
      $$('[data-sport]', s).forEach(function (e) { var on = e.dataset.sport === cur; e.classList.toggle('on', on); if (on && e.tagName === 'VIDEO' && e.src) { try { e.currentTime = 0; } catch (err) {} var p = e.play(); if (p && p.catch) p.catch(function () {}); } });
    }, 5600);
  }

  /* ── шаги «Как появляется прогноз»: закрыты, выезжают по одному при прокрутке ── */
  function steps() {
    var cards = $$('.stack.steps .scard'); if (!cards.length) return;
    if (RM || !window.IntersectionObserver) { cards.forEach(function (c) { c.classList.add('on'); }); return; }
    var next = 0, busy = false;
    var open = function () {                                    // по порядку, не чаще одной в 0,28 с
      if (busy || next >= cards.length || cards[next].getBoundingClientRect().top > innerHeight * 0.82) return;
      busy = true; cards[next++].classList.add('on'); setTimeout(function () { busy = false; open(); }, 280);
    };
    addEventListener('scroll', open, { passive: true }); open();
  }

  /* ── экраны бота ── */
  function phones() {
    var box = $('.phones'); if (!box) return;
    $$('[data-ph]').forEach(function (b) { b.addEventListener('click', function () { box.scrollBy({ left: 288 * +b.dataset.ph, behavior: RM ? 'auto' : 'smooth' }); }); });
    var down = null;
    box.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { down = { x: e.clientX, s: box.scrollLeft }; box.style.scrollSnapType = 'none'; } });
    addEventListener('pointermove', function (e) { if (down) box.scrollLeft = down.s - (e.clientX - down.x); });
    addEventListener('pointerup', function () { if (down) { down = null; box.style.scrollSnapType = ''; } });
  }

  /* ── цифры итогов слева от шагов (data/results-lite.js) ── */
  function stats() {
    var R = window.__RESLITE, box = $('.mstat'); if (!box) return;
    var t = R && R.sum && R.sum.total; if (!t || !t.all) { box.remove(); return; }
    var put = function (k, v) { var e = $('[data-ms="' + k + '"]', box); if (e) e.textContent = v; };
    var line = function (a) { return a && a.w + a.l ? a.w + ' из ' + (a.w + a.l) : '—'; };
    put('wl', line(t.all)); put('rate', String(t.all.rate).replace('.', ',') + '%'); put('hk', line(t.hockey)); put('fb', line(t.football));
    var u = $('[data-ms="bar"]', box), go = function () { u.style.width = t.all.rate + '%'; };
    if (window.IntersectionObserver) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { go(); io.disconnect(); } }); io.observe(box); } else go();
  }

  function start() { hero(); rotate(); steps(); phones(); stats(); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
