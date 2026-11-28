/* v5 · разделы «Хоккей»/«Футбол» (задание 28.11): в ссылке «Статистика» сверху — живая цифра из /data/results.json
   (тот же расчёт, что на странице «Статистика»: все прогнозы вида спорта, возвраты не в счёт). */
(function () {
  'use strict';
  var hs = document.getElementById('hsday'), a = document.querySelector('.s5-stat'); if (!hs || !a) return;
  var sp = hs.dataset.sport === 'football' ? 'football' : 'hockey';
  var go = function () {
    fetch('/data/results.json', {cache: 'no-cache'}).then(function (r) { return r.json(); }).then(function (J) {
      var w = 0, l = 0, u = 0;
      (J.picks || []).forEach(function (x) { if (x.sport !== sp) return; if (x.r === 'w') w++; else if (x.r === 'l') l++; if (x.r) u += x.u || 0; });
      if (!(w + l)) return;
      var f = function (x, d) { return Number(x).toLocaleString('ru-RU', {minimumFractionDigits: d, maximumFractionDigits: d}); };
      a.querySelector('[data-s5="rate"]').textContent = f(w / (w + l) * 100, 1) + ' % зашло';
      a.querySelector('[data-s5="sub"]').textContent = w + ' из ' + (w + l) + ' · итог ' + (u >= 0 ? '+' : '−') + f(Math.abs(u), 1) + ' ед.';
    }).catch(function () {});
  };
  /* футбол: эмблемы клубов ближайших матчей в плашке «Купон» (у хоккея это делает своя вставка страницы) */
  var em = document.querySelector('#kupon .kpb-em');
  if (sp === 'football' && em && !em.children.length) {
    var FL = /^(epl|laliga|seriea|bundesliga|ligue1|rpl|ucl|uel)$/, now = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 16).replace('T', ' '), L = [];
    ((window.JV_TODAY || {}).matches || []).forEach(function (m) { if (!FL.test(m.lg || '') || String(m.t) <= now) return; [m.h, m.a].forEach(function (id) { if (id && L.indexOf(id) < 0) L.push(id); }); });
    L.slice(0, 5).forEach(function (id, k) { var s = document.createElement('span'), i = document.createElement('img'); s.style.setProperty('--k', k);
      i.src = '/assets/fc/' + id + '.webp'; i.alt = ''; i.loading = 'lazy'; i.decoding = 'async'; i.onerror = function () { s.remove(); }; s.append(i); em.append(s); });
  }
  'requestIdleCallback' in window ? requestIdleCallback(go, {timeout: 2500}) : setTimeout(go, 1200);
})();
