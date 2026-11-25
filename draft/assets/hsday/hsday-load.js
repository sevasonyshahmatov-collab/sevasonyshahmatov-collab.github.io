/* Черновик «Хоккей сегодня»: сравнение всех вариантов первого экрана (владелец 25.11: «верни прошлые, чтобы сравнивать»).
   Подключается в <head>. Выбирает вариант (?hv=1…9, запоминается на вкладку), подключает нужный набор:
     1–6 — hsday-a.css/js (редакции 3 и 4: «Разворот», «Табло», «Медальоны», «Цифра дня», «Расклад модели», «Вечер по часам»);
     7–9 — hsday.css/js  (редакция 5: «Сводка и табло», «Афиша», «Гармошка»).
   Рисует общий переключатель: внутри набора смена без перезагрузки (JV_HS.set), между наборами — перезагрузка с ?hv=N.
   На живом сайте останется один выбранный вариант, загрузчик и переключатель уберём. */
(function () {
  'use strict';
  var V = {1: 'Разворот', 2: 'Табло', 3: 'Медальоны', 4: 'Цифра дня', 5: 'Расклад модели', 6: 'Вечер по часам', 7: 'Сводка и табло', 8: 'Афиша', 9: 'Гармошка'};
  var G = [['Новые', ['7', '8', '9']], ['Прошлые', ['4', '5', '6']], ['Первые', ['1', '2', '3']]];
  var me = document.currentScript, base = me && me.src ? me.src.replace(/[^/]*$/, '') : '';
  var v = new URLSearchParams(location.search).get('hv');
  try { if (v && V[v]) sessionStorage.setItem('jv-hv', v); else v = sessionStorage.getItem('jv-hv'); } catch (e) {}
  if (!V[v]) v = '7';
  window.JV_HV = v;
  var fam = function (k) { return +k <= 6 ? 'a' : 'b'; }, F = fam(v);
  var css = function (href) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = base + href; document.head.appendChild(l); };
  css(F === 'a' ? 'hsday-a.css' : 'hsday.css');
  css('hsday-sw.css');

  document.addEventListener('DOMContentLoaded', function () {
    /* модуль — после всех скриптов страницы: расписание, расчёт модели и live.js уже загружены */
    var s = document.createElement('script'); s.src = base + (F === 'a' ? 'hsday-a.js' : 'hsday.js'); document.body.appendChild(s);

    var cur = v;
    var choose = function (k) {
      if (!V[k] || k === cur) return;
      try { sessionStorage.setItem('jv-hv', k); } catch (e) {}
      var u = new URL(location.href); u.searchParams.set('hv', k);
      if (fam(k) === F && window.JV_HS && window.JV_HS.has(k)) {
        history.replaceState(null, '', u); window.JV_HS.set(k); cur = k; mark();
      } else location.href = u.href;                 /* другой набор — перезагрузка */
    };
    var box = document.createElement('div'); box.className = 'hs-vsw'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Вариант первого экрана (черновик)');
    var btns = [];
    G.forEach(function (g) {
      var l = document.createElement('span'); l.className = 'hs-vsw-l'; l.textContent = g[0]; box.appendChild(l);
      g[1].forEach(function (k) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = k + ' · ' + V[k]; b.dataset.v = k;
        b.addEventListener('click', function () { choose(k); });
        box.appendChild(b); btns.push(b);
      });
    });
    /* на телефоне — выпадающий список, чтобы девять кнопок не закрывали экран */
    var sel = document.createElement('select'); sel.className = 'hs-vsw-sel'; sel.setAttribute('aria-label', 'Вариант первого экрана');
    G.forEach(function (g) {
      var og = document.createElement('optgroup'); og.label = g[0];
      g[1].forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k + ' · ' + V[k]; og.appendChild(o); });
      sel.appendChild(og);
    });
    sel.addEventListener('change', function () { choose(sel.value); });
    var sl = document.createElement('span'); sl.className = 'hs-vsw-sl'; sl.textContent = 'Вариант';
    box.appendChild(sl); box.appendChild(sel);
    var mark = function () { btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === cur)); }); sel.value = cur; };
    mark();
    document.body.appendChild(box);
  });
})();
