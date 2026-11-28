/* правки владельца 28.11: снег в момент торможения, смена видео, шаги по одному, листание экранов бота, цифры итогов */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── снег: сначала крошка летит от коньков в зрителя, потом сыплется сверху по всему экрану ── */
  function snow() {
    var c = $('#snow5'), hero = $('.hero');
    if (!c || !hero || RM) return;
    var x = c.getContext('2d'), P = [], run = false, last = 0, W, H, mob = innerWidth < 810;
    var size = function () { var d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
    var dot = document.createElement('canvas'); dot.width = dot.height = 32;
    var g = dot.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(232,242,255,.85)'); gr.addColorStop(1, 'rgba(232,242,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    function burst() {
      var spray = mob ? 50 : 150, fall = mob ? 90 : 300, i;
      for (i = 0; i < spray; i++) { var a = rnd(Math.PI * 1.05, Math.PI * 1.95), v = rnd(250, 900);
        P.push({ x: W * rnd(0.42, 0.62), y: H * rnd(0.52, 0.72), vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rnd(1.5, 4), grow: rnd(4, 26), g: 520, t: -rnd(0, 0.25), life: rnd(0.8, 1.7), spray: true }); }
      for (i = 0; i < fall; i++) { var near = Math.random() < 0.12;
        P.push({ x: rnd(-40, W + 40), y: rnd(-60, -10), vx: rnd(-22, 30), vy: near ? rnd(170, 300) : rnd(70, 190), r: near ? rnd(5, 11) : rnd(1.2, 3.8), grow: 0, g: 14, t: -rnd(0.35, 3.2), life: 9, sw: rnd(0, 6.3), a: near ? 0.55 : rnd(0.5, 1) }); }
      if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); }
    }
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now; x.clearRect(0, 0, W, H);
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i]; p.t += dt; if (p.t < 0) continue;
        p.vy += p.g * dt; p.x += (p.vx + (p.sw !== undefined ? Math.sin(p.t * 1.6 + p.sw) * 26 : 0)) * dt; p.y += p.vy * dt; p.r += p.grow * dt;
        if (p.t > p.life || p.y > H + 30) { P.splice(i, 1); continue; }
        x.globalAlpha = p.spray ? Math.max(0, 1 - p.t / p.life) * 0.9 : (p.a * Math.min(1, (p.life - p.t) / 2));
        x.drawImage(dot, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      x.globalAlpha = 1;
      if (P.length) requestAnimationFrame(frame); else { run = false; x.clearRect(0, 0, W, H); }
    }
    window.jvSnow = burst;
    var visible = function () { return scrollY < hero.offsetHeight * 0.6; };
    var v = $('video.hv', hero), fired = -1e9;
    if (v && document.documentElement.classList.contains('vid')) {
      var AT = 2.15, prev = 0;                                 // секунда ролика skate.mp4, когда хоккеист тормозит и летит снег
      (function watch() {
        if (!v.isConnected) return fallback();                 // слабое устройство: v4 убрал видео
        var t = v.currentTime;
        if (prev < AT && t >= AT && t < AT + 0.6 && visible() && performance.now() - fired > 15000) { fired = performance.now(); burst(); }
        prev = t; requestAnimationFrame(watch);
      })();
    } else fallback();
    function fallback() { setTimeout(function () { if (visible()) burst(); }, 1400); }
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

  function start() { snow(); rotate(); steps(); phones(); stats(); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
