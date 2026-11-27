/* v5: клубы в фирменных цветах (владелец 27.11). Данные — window.JV_CC (skin/clubcolors.js, генерирует site-draft/v5/clubcolors.py).
   • эмблема — в оригинальных цветах (без серого фильтра темы bw); тёмная эмблема — светлая обводка, чтобы читалась на чёрном;
   • нет эмблемы (файл не загрузился) — кружок с буквами в основном цвете клуба, буквы белые или чёрные по контрасту;
   • ?cc=bar — вариант Б: ещё тонкая полоса цвета клуба у названия.
   Ничего не грузит, кроме таблицы (8 КБ); работает и в лёгком режиме. data-scope у <script> — где применять (пробный показ). */
(function () {
  'use strict';
  var C = window.JV_CC || {}, me = document.currentScript, SCOPE = (me && me.dataset.scope) || '';
  var RX = /\/(em|fc)\/(?:[sl]\/)?([a-z0-9_]+)\.(?:webp|png|svg)/;
  var BAR = /[?&]cc=bar\b/.test(location.search); try { if (BAR) sessionStorage.setItem('v5cc', 'bar'); BAR = BAR || sessionStorage.getItem('v5cc') === 'bar'; } catch (e) {}
  if (BAR) document.documentElement.classList.add('v5-ccbar');
  var lum = function (h) {
    h = (h || '#808080').replace('#', '');
    return [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  };
  var ink = function (h) { var L = lum(h); return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#000' : '#fff'; };   // что контрастнее
  var key = function (img) { var m = RX.exec(img.getAttribute('src') || ''); return m && m[2]; };
  var inScope = function (el) { return !SCOPE || (el.closest && el.closest(SCOPE)); };
  var bright = function (c) { return lum(c[0]) >= 0.05 ? c[0] : lum(c[1]) >= 0.05 ? c[1] : '#bfbfbf'; };   // на чёрном фоне — видимый из двух
  var initials = function (s) {
    var w = String(s || '').replace(/[«»"()]/g, ' ').trim().split(/[\s\-]+/).filter(function (x) { return x && /[A-Za-zА-Яа-яЁё0-9]/.test(x); });
    return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase();
  };
  function name(img) {
    if (img.alt) return img.alt;
    var p = img.parentNode, t = p ? p.textContent.trim() : ''; return t || key(img) || '';
  }
  function paint(img) {
    if (img.dataset.cc || !inScope(img)) return;
    var k = key(img); if (!k) return;
    img.dataset.cc = 1; img.classList.add('v5-cc');
    var c = C[k]; if (!c) return;
    if (c[2]) img.classList.add('v5-cc-dk');
    var p = img.parentNode; if (BAR && p && p.children.length <= 3 && p.textContent.trim().length < 40) { p.classList.add('v5-cct'); p.style.setProperty('--cc1', bright(c)); }
  }
  function placeholder(img) {
    if (img.dataset.ccph || !inScope(img) || !key(img)) return;
    img.dataset.ccph = 1;
    var c = C[key(img)] || ['#3a3a3a', '#ffffff'], r = img.getBoundingClientRect(), s = document.createElement('span');
    var z = Math.round(r.width || r.height || parseFloat(getComputedStyle(img).height) || 28);
    s.className = 'v5-ccph' + (lum(c[0]) < 0.05 ? ' v5-ccph-dk' : ''); s.setAttribute('aria-hidden', 'true');
    s.textContent = initials(name(img)); s.style.background = c[0]; s.style.color = ink(c[0]);
    s.style.width = s.style.height = z + 'px'; s.style.fontSize = Math.max(9, Math.round(z * 0.38)) + 'px';
    img.style.display = 'none'; img.parentNode.insertBefore(s, img);
  }
  var broken = function (img) { return img.complete && !img.naturalWidth && (img.style.visibility === 'hidden' || !img.getAttribute('onerror')); };
  document.addEventListener('error', function (e) {
    var img = e.target; if (!img || img.tagName !== 'IMG' || !key(img)) return;
    setTimeout(function () { if (broken(img)) placeholder(img); }, 0);   // после своего onerror страницы (запасной адрес)
  }, true);
  function scan() {
    Array.prototype.forEach.call(document.querySelectorAll('img[src*="/em/"], img[src*="/fc/"]'), function (img) { paint(img); if (broken(img)) placeholder(img); });
  }
  var t; new MutationObserver(function () { if (!t) t = requestAnimationFrame(function () { t = 0; scan(); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', scan, { once: true }) : scan();
})();
