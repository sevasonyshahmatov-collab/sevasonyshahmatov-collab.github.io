/* v5 · «Статистика» раздела (/draft/v5/hockey/stats/, /draft/v5/football/stats/), задание 28.11.
   Всё считается в браузере из открытого /data/results.json: все прогнозы канала по виду спорта (одиночные и экспрессы),
   включая проигрыши. Процент зашедших = зашло / (зашло + не зашло), возвраты не в счёт; итог — сумма u (ставка 1 ед.);
   ROI = итог / число прогнозов с кэфом. Вывод — textContent, свои SVG. */
(function () {
  'use strict';
  var root = document.querySelector('main.st'); if (!root) return;
  var SPORT = root.dataset.sport === 'football' ? 'football' : 'hockey';
  var LG = {khl: 'КХЛ', nhl: 'НХЛ', ucl: 'Лига чемпионов', uel: 'Лига Европы', uecl: 'Лига конференций', epl: 'АПЛ', laliga: 'Ла Лига', seriea: 'Серия А',
    bundesliga: 'Бундеслига', ligue1: 'Лига 1', rpl: 'РПЛ', foot: 'Другие турниры'};
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONN = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var $ = function (k) { return root.querySelector('[data-st="' + k + '"]'); };
  var el = function (t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
  var dec = function (x, d) { return Number(x).toLocaleString('ru-RU', {minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d}); };
  var sgn = function (x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + dec(Math.abs(x)); };
  var plural = function (n, a, b, c) { n = Math.abs(n) % 100; var d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
  var dday = function (s) { return +s.slice(8, 10) + ' ' + MON[+s.slice(5, 7) - 1]; };
  var NS = 'http://www.w3.org/2000/svg';
  var sv = function (t, a) { var n = document.createElementNS(NS, t); for (var k in a) n.setAttribute(k, a[k]); return n; };

  function agg(list) {
    var o = {n: list.length, w: 0, l: 0, p: 0, u: 0, nk: 0, ks: 0};
    list.forEach(function (x) { o[x.r]++; o.u += x.u || 0; if (x.kef) { o.nk++; o.ks += x.kef; } });
    o.rate = o.w + o.l ? o.w / (o.w + o.l) * 100 : 0; o.roi = o.nk ? o.u / o.nk * 100 : 0; o.kef = o.nk ? o.ks / o.nk : 0;
    return o;
  }

  fetch('/data/results.json', {cache: 'no-cache'}).then(function (r) { return r.json(); }).then(draw).catch(function () {
    $('list').replaceChildren(el('li', 'st-empty', 'Не удалось загрузить итоги. Обновите страницу чуть позже.'));
    $('cap').textContent = 'нет данных';
  });

  function draw(J) {
    var all = (J.picks || []).filter(function (x) { return x.sport === SPORT; }).sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : b.id - a.id; });
    var done = all.filter(function (x) { return x.r === 'w' || x.r === 'l' || x.r === 'p'; });
    var T = agg(done);
    var b = $('built'); if (b && J.built) b.textContent = 'Обновлено ' + dday(J.built) + ', ' + J.built.slice(11, 16) + ' МСК';
    /* герой */
    $('rate').textContent = dec(T.rate);
    $('bar').style.width = T.rate.toFixed(1) + '%';
    $('cap').textContent = T.w + ' из ' + (T.w + T.l) + ' — с ' + dday(J.since || done[done.length - 1].d) + (T.p ? '; ' + T.p + ' ' + plural(T.p, 'возврат', 'возврата', 'возвратов') + ' не в счёт' : '');
    var kpi = $('kpi');
    [[String(T.n), plural(T.n, 'прогноз', 'прогноза', 'прогнозов') + ' с итогом'],
     [sgn(T.u) + ' ед.', 'итог при ставке 1 ед. на каждый'],
     [(T.roi >= 0 ? '+' : '−') + dec(Math.abs(T.roi)) + ' %', 'ROI — итог на 100 ед. поставленного'],
     [dec(T.kef, 2), 'средний коэффициент']].forEach(function (k) { var li = el('li'); li.append(el('b', '', k[0]), el('span', '', k[1])); kpi.append(li); });
    if (T.n < 60) kpi.append(el('li', 'st-warn', 'Пока мало прогнозов (' + T.n + ') — процент может заметно меняться.'));
    line(done.slice().reverse());
    months(done);
    bars($('lg'), group(done, function (x) { return LG[x.lg] || x.lg; }));
    bars($('kef'), group(done.filter(function (x) { return x.kef; }), function (x) { return x.kef < 1.6 ? 'до 1,60' : x.kef < 1.8 ? '1,60–1,79' : x.kef < 2 ? '1,80–1,99' : '2,00 и выше'; },
      ['до 1,60', '1,60–1,79', '1,80–1,99', '2,00 и выше']));
    bars($('kind'), group(done, function (x) { return x.kind === 'express' ? 'Экспрессы' : x.src === 'model' ? 'Одиночные · выбор модели' : x.src === 'author' ? 'Одиночные · выбор автора' : 'Одиночные · ранние посты'; }));
    list(all);
  }

  function group(list, key, order) {
    var g = {}; list.forEach(function (x) { var k = key(x); (g[k] = g[k] || []).push(x); });
    var ks = order ? order.filter(function (k) { return g[k]; }) : Object.keys(g).sort(function (a, b) { return g[b].length - g[a].length; });
    return ks.map(function (k) { return [k, agg(g[k])]; });
  }
  function bars(ul, rows) {
    rows.forEach(function (r) {
      var a = r[1], li = el('li'), top = el('p', 'st-bt'), bar = el('i', 'st-bar'), u = el('u');
      top.append(el('span', '', r[0]), el('b', '', dec(a.rate) + ' %'));
      u.style.width = a.rate.toFixed(1) + '%'; bar.append(u); bar.setAttribute('aria-hidden', 'true');
      li.append(top, bar, el('small', '', a.w + ' из ' + (a.w + a.l) + ' зашло · итог ' + sgn(a.u) + ' ед.' + (a.n < 20 ? ' · мало данных' : '')));
      ul.append(li);
    });
  }
  function months(list) {
    var tb = $('months').tBodies[0], g = group(list, function (x) { return x.d.slice(0, 7); });
    g.sort(function (a, b) { return a[0] < b[0] ? 1 : -1; });
    g.forEach(function (r) {
      var a = r[1], tr = document.createElement('tr');
      [MONN[+r[0].slice(5) - 1] + ' ' + r[0].slice(0, 4), a.n, a.w, a.l, a.p, dec(a.rate) + ' %', sgn(a.u), (a.roi >= 0 ? '+' : '−') + dec(Math.abs(a.roi)) + ' %'].forEach(function (v, i) {
        var td = el(i ? 'td' : 'th', i === 6 ? (a.u >= 0 ? 'pos' : 'neg') : '', String(v)); if (!i) td.scope = 'row'; tr.append(td);
      });
      tb.append(tr);
    });
  }

  /* накопленный итог по дням: одна линия, ось ноль, подсказка с перекрестием */
  function line(list) {
    var box = $('line'), by = {}, days = [];
    list.forEach(function (x) { var d = x.d.slice(0, 10); if (!(d in by)) { by[d] = 0; days.push(d); } by[d] += x.u || 0; });
    days.sort(); var acc = 0, pts = days.map(function (d) { acc += by[d]; return {d: d, v: acc, dv: by[d]}; });
    if (pts.length < 2) { box.append(el('p', 'st-note', 'Мало данных для графика.')); return; }
    var nar = box.clientWidth < 640, W = nar ? 560 : 1000, H = nar ? 380 : 300, P = {l: 52, r: 16, t: 16, b: 34};
    var lo = Math.min(0, Math.min.apply(null, pts.map(function (p) { return p.v; }))), hi = Math.max(0, Math.max.apply(null, pts.map(function (p) { return p.v; })));
    var step = [1, 2, 5, 10, 20, 25, 50, 100].find(function (s) { return (hi - lo) / s <= 5; }) || 200;
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step || step;
    var X = function (i) { return P.l + i * (W - P.l - P.r) / (pts.length - 1); }, Y = function (v) { return P.t + (hi - v) * (H - P.t - P.b) / (hi - lo); };
    var s = sv('svg', {viewBox: '0 0 ' + W + ' ' + H, class: 'st-svg', role: 'img', 'aria-label': 'Накопленный итог в единицах по дням: сейчас ' + sgn(acc) + ' ед.'});
    for (var v = lo; v <= hi + 1e-9; v += step) {
      s.append(sv('line', {x1: P.l, x2: W - P.r, y1: Y(v), y2: Y(v), class: v === 0 ? 'z' : 'g'}));
      var t = sv('text', {x: P.l - 10, y: Y(v) + 4, 'text-anchor': 'end', class: 'ax'}); t.textContent = (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); s.append(t);
    }
    var mo = ''; pts.forEach(function (p, i) {
      if (p.d.slice(0, 7) !== mo) { mo = p.d.slice(0, 7); var t = sv('text', {x: X(i), y: H - 10, class: 'ax'}); t.textContent = MONN[+mo.slice(5) - 1].toLowerCase(); s.append(t); }
    });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join('');
    s.append(sv('path', {d: d + 'L' + X(pts.length - 1) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0) + 'Z', class: 'ar'}), sv('path', {d: d, class: 'ln'}));
    var last = pts[pts.length - 1]; s.append(sv('circle', {cx: X(pts.length - 1), cy: Y(last.v), r: 5, class: 'dot'}));
    var below = pts[pts.length - 2].v > last.v, lab = sv('text', {x: X(pts.length - 1) - 10, y: Y(last.v) + (below ? 30 : -14), 'text-anchor': 'end', class: 'lb'}); lab.textContent = sgn(last.v) + ' ед.'; s.append(lab);
    var cx = sv('line', {y1: P.t, y2: H - P.b, class: 'cx', visibility: 'hidden'}), cd = sv('circle', {r: 6, class: 'dot', visibility: 'hidden'});
    s.append(cx, cd); box.append(s);
    var tip = el('div', 'st-tip'); tip.hidden = true; box.append(tip);
    var hit = function (e) {
      var r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
      var i = Math.max(0, Math.min(pts.length - 1, Math.round((x - P.l) / (W - P.l - P.r) * (pts.length - 1)))), p = pts[i];
      cx.setAttribute('x1', X(i)); cx.setAttribute('x2', X(i)); cd.setAttribute('cx', X(i)); cd.setAttribute('cy', Y(p.v));
      cx.setAttribute('visibility', 'visible'); cd.setAttribute('visibility', 'visible');
      tip.replaceChildren(el('b', '', dday(p.d)), el('span', '', 'итог ' + sgn(p.v) + ' ед.'), el('small', '', 'за день ' + sgn(p.dv) + ' ед.'));
      tip.hidden = false; var px = X(i) / W * r.width;
      tip.style.left = Math.max(0, Math.min(r.width - 170, px + (px > r.width / 2 ? -180 : 12))) + 'px'; tip.style.top = (Y(p.v) / H * r.height - 20) + 'px';
    };
    s.addEventListener('pointermove', hit); s.addEventListener('pointerdown', hit);
    s.addEventListener('pointerleave', function () { tip.hidden = true; cx.setAttribute('visibility', 'hidden'); cd.setAttribute('visibility', 'hidden'); });
  }

  /* все прогнозы: фильтры по лиге и исходу, порциями по 30 */
  function list(all) {
    var ol = $('list'), more = $('more'), filt = $('filt'), F = {lg: '', r: ''}, shown = 30;
    var lgs = []; all.forEach(function (x) { if (lgs.indexOf(x.lg) < 0) lgs.push(x.lg); });
    var mk = function (k, v, t) {
      var b = el('button', 'st-chip', t); b.type = 'button'; b.dataset.k = k; b.dataset.v = v; b.setAttribute('aria-pressed', String(F[k] === v));
      b.onclick = function () { F[k] = v; shown = 30; filt.querySelectorAll('[data-k="' + k + '"]').forEach(function (n) { n.setAttribute('aria-pressed', String(n.dataset.v === v)); }); paint(); };
      return b;
    };
    var g1 = el('span', 'st-fg'); g1.append(mk('lg', '', 'Все лиги')); if (lgs.length > 1) lgs.forEach(function (l) { g1.append(mk('lg', l, LG[l] || l)); });
    var g2 = el('span', 'st-fg'); [['', 'Все исходы'], ['w', 'Зашло'], ['l', 'Не зашло']].forEach(function (x) { g2.append(mk('r', x[0], x[1])); });
    filt.append(g1, g2);
    var RES = {w: ['Зашло', '✓'], l: ['Не зашло', '✕'], p: ['Возврат', '↺']};
    var crest = function (src) { var i = el('img'); i.src = '/' + src; i.alt = ''; i.width = i.height = 24; i.loading = 'lazy'; i.onerror = function () { i.style.visibility = 'hidden'; }; return i; };
    function row(x) {
      var li = el('li', 'st-row r-' + (x.r || 'n'));
      var when = el('p', 'st-when'); when.append(el('b', '', dday(x.d)), el('span', '', LG[x.lg] || ''));
      var mid = el('div', 'st-mid');
      if (x.kind === 'express') {
        var det = el('details', 'st-exp'), sm = el('summary', '', x.bet || 'Экспресс');
        det.append(sm); var ul = el('ul');
        (x.legs || []).forEach(function (g) { var l = el('li'); l.append(el('b', '', g.h + ' — ' + g.a + (g.sc ? ' · ' + g.sc : '')), el('span', '', g.bet + (g.kef ? ' · ' + dec(g.kef, 2) : '') + (g.r === 'w' ? ' ✓' : g.r === 'l' ? ' ✕' : ''))); ul.append(l); });
        det.append(ul); mid.append(det);
      } else {
        var tm = el('p', 'st-tm');
        if (x.he) tm.append(crest(x.he)); tm.append(el('span', '', x.h));
        tm.append(el('i', '', '—')); if (x.ae) tm.append(crest(x.ae)); tm.append(el('span', '', x.a));
        mid.append(tm, el('p', 'st-bet', x.bet));
      }
      var k = el('p', 'st-k'); k.append(el('small', '', 'кэф'), el('b', '', x.kef ? dec(x.kef, 2) : '—'));
      var sc = el('p', 'st-sc', x.sc || (x.kind === 'express' ? '' : '—'));
      var rr = RES[x.r] || ['Ждём итог', '…'], res = el('p', 'st-res'); res.append(el('i', '', rr[1]), el('span', '', rr[0]));
      var go = el('a', 'st-post', 'Пост →'); go.href = x.url; go.target = '_blank'; go.rel = 'noopener'; go.setAttribute('aria-label', 'Пост с разбором в канале: ' + (x.h ? x.h + ' — ' + x.a : x.bet));
      li.append(when, mid, k, sc, res, go);
      return li;
    }
    function paint() {
      var L = all.filter(function (x) { return (!F.lg || x.lg === F.lg) && (!F.r || x.r === F.r); });
      ol.replaceChildren.apply(ol, L.slice(0, shown).map(row));
      if (!L.length) ol.append(el('li', 'st-empty', 'Таких прогнозов нет.'));
      more.hidden = L.length <= shown; more.textContent = 'Показать ещё ' + Math.min(30, L.length - shown) + ' из ' + (L.length - shown);
    }
    more.onclick = function () { shown += 30; paint(); };
    paint();
  }
})();
