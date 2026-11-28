/* v5 · новая РАСКЛАДКА страниц раздела «Хоккей» (владелец 28.11: «пересобрать, а не перекрасить»), только тема bw.
   Разметку и скрипты страниц не трогаем (данные, ссылки, поиск, фильтры, избранное работают как раньше): раскладка задаётся
   классами поверх существующих блоков (lay5.css), а тексты-выводы считаются из того, что уже нарисовано на странице.
   • герой страницы: один крупный главный блок с огромной цифрой и выводом простыми словами;
   • секции чередуются: «узкая» — слева закреплённый вывод (sticky), справа прокручивается содержимое; «широкая» — вывод во всю ширину;
   • у секции один заголовок-вывод («Лидер — ЦСКА: 46 очков»), прежний заголовок — маленькой подписью над ним;
   • анимации (только полный режим): появление секций, вывод по словам (SplitText), досчёт цифр — только transform/opacity. */
(function () {
  'use strict';
  var doc = document.documentElement;
  if (doc.dataset.v5t !== 'bw') return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var T = function (e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
  var pl = function (n, a, b, c) { n = Math.abs(n) % 100; var m = n % 10; return n > 10 && n < 20 ? c : m > 1 && m < 5 ? b : m === 1 ? a : c; };
  var TYPE = $('.lghero') ? 'league' : $('.tmhero') ? 'club' : $('.mx-hero') ? 'match' : $('.tbl-top') ? 'table' : $('.rs-top') ? 'results' : '';
  if (!TYPE) return;
  doc.classList.add('lay-on', 'lay-' + TYPE);

  /* ── выводы по секциям: [заголовок-вывод, крупная цифра (необязательно), подпись к цифре] ── */
  var homeWins = function (s) {   // «хозяева выиграли k из n» по счёту в списке результатов (первым идёт хозяин)
    var n = 0, k = 0; $$('.lgml > li:not(.dayh)', s).forEach(function (li) { var m = /(\d+)\s*:\s*(\d+)/.exec(T($('.s', li))); /* счёт — в .s: в строке есть и время «03:30» */ if (m) { n++; if (+m[1] > +m[2]) k++; } });
    return n ? [k, n] : null;
  };
  var C = {
    league: {
      table: function (s) { var L = $$('tbody', s).map(function (tb) { return T($('tr a span', tb)); }).filter(Boolean);
        if (L.length > 1) return ['Лидеры конференций — ' + L[0] + ' и ' + L[1]]; if (L.length) return ['Первое место — ' + L[0]]; },
      next: function (s) { var n = $$('.lgml > li:not(.dayh)', s).length, d = $$('.lgml > li.dayh', s).length; if (n) return ['Расписание на ' + d + ' ' + pl(d, 'день', 'дня', 'дней') + ' вперёд', n, pl(n, 'матч', 'матча', 'матчей') + ' впереди']; },
      results: function (s) { var h = homeWins(s); if (h) return ['Хозяева выиграли ' + h[0] + ' из ' + h[1] + ' последних']; },
      stats: function (s) { var li = $('.lgst li', s); if (li) return ['Как играет лига', T($('b', li)), T($('span', li))]; },
      clubs: function (s) { var n = $$('.clubs > li', s).length; if (n) return [n + ' ' + pl(n, 'клуб', 'клуба', 'клубов') + ' — выберите свой']; }
    },
    club: {
      table: function (s) { var me = $('tr.me', s); if (!me) return; var tb = me.closest('tbody'), top = $('tr', tb), pts = function (r) { var c = $$('td', r); return parseInt(T($('.pts', r) || c[c.length - 1]), 10) || 0; };
        var name = T($('a span', me)), d = pts(top) - pts(me);
        if (top === me) { var sec = $$('tr', tb)[1]; return [name + ' лидирует' + (sec ? ': отрыв ' + (pts(me) - pts(sec)) + ' ' + pl(pts(me) - pts(sec), 'очко', 'очка', 'очков') : '')]; }
        return ['До первого места — ' + d + ' ' + pl(d, 'очко', 'очка', 'очков'), d, 'очков до лидера (' + T($('a span', top)) + ')']; },
      next: function (s) { var a = $('.nmatch', s); if (a && a.getAttribute('aria-label')) { var p = a.getAttribute('aria-label').split(','), me = T($('.tmrow h1') || $('h1')), t = p[0].split(' — ').map(function (x) { return x.trim(); });
        var opp = t.filter(function (x) { return x !== me; })[0] || p[0].trim(), home = t[0] === me; return ['Дальше — ' + opp + (home ? ', дома' : ', в гостях'), '', p.slice(1).join(',').trim()]; } },
      games: function (s) { var g = $$('.gsum li b', s).map(T); if (g.length > 2) return [g[1] + ' ' + pl(+g[1], 'победа', 'победы', 'побед') + ' и ' + g[2] + ' ' + pl(+g[2], 'поражение', 'поражения', 'поражений') + ' за ' + g[0] + ' ' + pl(+g[0], 'матч', 'матча', 'матчей')]; }
    },
    match: {
      'mq-rest': function (s) { var p = $$('p', s).map(T).filter(function (t) { return /^У хозяев/.test(t); })[0]; if (p) return [p.replace(/\s*отдыха\.?$/, '').replace(/\.$/, '')]; },
      'mt-form': function (s) { var f = $$('.mx-fc h3', s).map(function (h) { var sm = T($('small', h)); return [T(h).replace(sm, '').trim(), sm]; });
        if (f.length === 2) { var n = function (x) { return parseInt(x, 10) || 0; }, a = n(f[0][1]), b = n(f[1][1]);
          return [a === b ? 'По форме — поровну: по ' + a + ' ' + pl(a, 'победе', 'победы', 'побед') + ' из 5' : 'В форме лучше ' + (a > b ? f[0][0] : f[1][0]) + ': ' + Math.max(a, b) + ' из 5 против ' + Math.min(a, b)]; } }
    },
    results: {
      months: function (s) { var c = $('.rs-card', s); if (c) { var h = T($('h3', c)).replace(/идёт$/, '').trim(), p = T($('.rs-big span', c)); return [h + ': ' + p + ' прогнозов зашли', p.replace(/\s*%/, ''), '%, ' + h.toLowerCase()]; } },
      who: function (s) { var c = $$('.rs-card', s).map(function (x) { return [T($('h3', x)), T($('.rs-big span', x))]; }).filter(function (x) { return x[1]; });
        if (c.length > 1) return [c.map(function (x) { return x[0] + ' — ' + x[1]; }).join(' · ')]; }
    },
    table: {}
  };
  function verdict() {
    var bar = $('.mx-bar'); if (!bar) return null;
    var it = $$('i', bar).map(function (i) { return { p: parseInt(T($('b', i)), 10) || 0, n: T($('small', i)), x: i.classList.contains('mx-sx') }; });
    if (!it.length) return null;
    var best = it.slice().sort(function (a, b) { return b.p - a.p; })[0], h = it[0], a = it[it.length - 1], gap = Math.abs(h.p - a.p);
    var t = best.x ? 'Модель видит равный матч' : gap >= 15 ? 'Модель видит явный перевес у ' + who(best.n) : gap >= 5 ? 'Модель видит перевес у ' + who(best.n) : 'Почти поровну: модель чуть выше ставит ' + who(best.n, 1);
    return { t: t, p: best.p, s: best.x ? 'ничья в основное время' : 'шанс на победу: ' + best.n };
  }
  function who(n, acc) {   // родительный/винительный падеж для частых окончаний — иначе «команды „…“»
    if (/а$/.test(n)) return acc ? n.replace(/а$/, 'у') : n.replace(/а$/, 'ы');
    if (/я$/.test(n)) return acc ? n.replace(/я$/, 'ю') : n.replace(/я$/, 'и');
    if (/[бвгджзклмнпрстфхцчшщ]$/i.test(n)) return acc ? n : n + 'а';
    return acc ? n : '«' + n + '»';
  }

  /* ── секции ── */
  var idx = 0;
  function key(s) { var h = $('h2[id]', s); return s.id || (s.classList.contains('mx-model') ? 'mx-model' : h ? h.id : ''); }
  function setup() {
    var secs = $$('main > section, body > section').filter(function (s) {
      return !s.classList.contains('lay') && !/hero|rs-top|tbl-top|mx-hero|sub\b|next-step/.test(s.className) && s.id !== 'subscribe' && $(':scope > .wrap', s);
    });
    secs.forEach(function (s) {
      var w = $(':scope > .wrap', s), head = $(':scope > .sec-head', w) || $(':scope > h2', w);
      if (!head || w.children.length < 2) return;
      s.classList.add('lay', ($$('table', s).some(function (t) { return t.rows.length >= 8; }) || idx % 3 === 2) ? 'lay-w' : 'lay-s'); idx++;   // таблицы — всегда во всю ширину
      head.classList.add('lay-h');
      var h2 = head.tagName === 'H2' ? head : $('h2', head);
      if (h2) { h2.classList.remove('v5-r'); h2.dataset.v5R = 1; h2.classList.add('lay-e'); }
      if (head.tagName === 'H2') {                                    // одиночный h2 → обёртка, чтобы рядом поместить вывод
        var d = document.createElement('div'); d.className = 'lay-h'; head.classList.remove('lay-h'); w.insertBefore(d, head); d.appendChild(head); head = d;
      }
      s._layHead = head;
    });
    fill();
  }
  function fill() {
    $$('section.lay').forEach(function (s) {
      var f = (C[TYPE] || {})[key(s)], r = null; try { r = f && f(s); } catch (e) {}
      var head = s._layHead; if (!head) return;
      var t = $(':scope > .lay-t', head), n = $(':scope > .lay-n', head);
      if (!r) { head.classList.add('lay-plain'); return; }
      head.classList.remove('lay-plain');
      if (!t) { t = document.createElement('p'); t.className = 'lay-t'; t.setAttribute('role', 'heading'); t.setAttribute('aria-level', '3'); head.appendChild(t); }
      if (t.textContent !== r[0]) t.textContent = r[0];
      if (r[1] !== undefined && r[1] !== '' && s.classList.contains('lay-s')) {
        if (!n) { n = document.createElement('p'); n.className = 'lay-n'; n.innerHTML = '<b data-v5-n="1"></b><span></span>'; head.appendChild(n); }
        if (n.firstChild.textContent !== String(r[1])) n.firstChild.textContent = r[1];
        n.lastChild.textContent = r[2] || '';
      } else if (r[2] && s.classList.contains('lay-s')) {
        if (!n) { n = document.createElement('p'); n.className = 'lay-n lay-n-s'; n.innerHTML = '<span></span>'; head.appendChild(n); }
        n.lastChild.textContent = r[2];
      }
    });
    hero();
  }

  /* ── герой страницы: огромная цифра + вывод ── */
  function hero() {
    var box, big, cap, line;
    if (TYPE === 'league') {
      var r = $('#tbBody tbody tr'); box = $('#hero');
      if (r) { var td = $$('td', r); line = 'Лидер — ' + T($('a span', r)); big = T($('.pt', r) || td[td.length - 1]); cap = 'очков у лидера · ' + T(td[2]) + ' ' + pl(+T(td[2]), 'матч', 'матча', 'матчей'); }
    } else if (TYPE === 'club') {
      return;   // у клуба в первом экране уже есть крупное место — не дублируем
    } else if (TYPE === 'match') {
      var v = verdict(); box = $('.mx-head');
      if (v) { big = v.p + ' %'; cap = v.s; line = v.t; }
    } else if (TYPE === 'results') {
      box = $('.rs-top .wrap'); var wl = $('#rs-kpi li.win'), ls = $('#rs-kpi li.loss');
      if (wl) { var pm = /(\d+(?:,\d)?)\s*%/.exec(T($('span', wl))), w = parseInt(T($('b', wl)), 10), l = ls ? parseInt(T($('b', ls)), 10) : 0;
        if (pm) { big = pm[1] + ' %'; cap = 'прогнозов зашли — без учёта возвратов'; line = w + ' из ' + (w + l) + ' прогнозов канала зашли'; } }
    } else if (TYPE === 'table') { box = $('.tbl-top .wrap'); }
    if (!box || !big) return;
    var h = $(':scope > .lay-hero', box);
    if (!h) { h = document.createElement('div'); h.className = 'lay-hero'; h.innerHTML = '<p class="lay-hero-l"></p><p class="lay-hero-n"><b data-v5-n="1"></b><span></span></p>'; box.appendChild(h); }
    $('.lay-hero-l', h).textContent = line || ''; $('.lay-hero-l', h).hidden = !line;
    var b = $('.lay-hero-n b', h); if (!b.dataset.done && b.textContent !== big) b.textContent = big;
    $('.lay-hero-n span', h).textContent = cap || '';
  }

  /* ── анимации (полный режим) ── */
  function anim() {
    var gsap = window.gsap, ST = window.ScrollTrigger, SP = window.SplitText; if (!gsap || !ST) return;
    if (SP) gsap.registerPlugin(SP);
    doc.classList.add('lay-anim');
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      $$('.lay-t, .lay-hero-l').forEach(function (t) {
        if (!SP || !t.textContent) return;
        var sp = SP.create(t, { type: 'words', mask: 'words' });
        gsap.from(sp.words, { yPercent: 110, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.05, scrollTrigger: { trigger: t, start: 'top 88%', once: true } });
      });
      $$('section.lay').forEach(function (s) {
        var kids = $$(':scope > .wrap > :not(.lay-h)', s).slice(0, 6);
        gsap.from(kids, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: s, start: 'top 82%', once: true } });
      });
      $$('.lay-n b, .lay-hero-n b').forEach(function (b) {
        var src = b.textContent.trim(), m = /^(\d+)(?:,(\d))?(\s?%)?$/.exec(src); if (!m) return;
        var end = parseFloat(m[1] + (m[2] ? '.' + m[2] : '')), dec = m[2] ? 1 : 0, o = { v: 0 };
        ST.create({ trigger: b, start: 'top 92%', once: true, onEnter: function () {
          b.dataset.done = 1;
          gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: function () { b.textContent = o.v.toFixed(dec).replace('.', ',') + (m[3] || ''); }, onComplete: function () { b.textContent = src; } });
        } });
      });
      ST.refresh();
    });
  }

  function start() {
    setup();
    var pend; new MutationObserver(function () { clearTimeout(pend); pend = setTimeout(function () { setup(); }, 400); })
      .observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    if (doc.classList.contains('v5-full')) { if (window.gsap && window.ScrollTrigger) setTimeout(anim, 600); else document.addEventListener('v5:gsap', function () { setTimeout(anim, 600); }, { once: true }); }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
})();
