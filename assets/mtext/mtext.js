/* «Мой разбор» — живой текст на странице матча (владелец 25.11: «больше человеческого текста, будто это я пишу разборы;
   4–5 строк с фактами, которые выливаются в прогноз»). Подключает assets/nav.js на страницах матчей (.mx-hero + .mx-text),
   поэтому работает и на уже готовых, и на будущих страницах. Факты — только с этой же страницы (таблица, форма, дом/выезд,
   вратари, «Кто в форме», отдых и дорога, личные встречи, расчёт модели), так что цифры в тексте совпадают с разбором ниже.
   Формулировки выбираются по адресу страницы — у разных матчей текст звучит по-разному, у одного матча — всегда одинаково.
   Вывод — без кэфов и без призывов ставить; это оценка по данным. Вывод в DOM — textContent. */
(() => {
'use strict';
const box = document.querySelector('.mx-text'), hero = document.querySelector('.mx-hero');
if (!box || !hero || box.dataset.mt) return;
box.dataset.mt = '1';

/* ── мелочи ── */
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const T = n => (n ? n.textContent : '').replace(/\s+/g, ' ').trim();
const num = s => { const v = parseFloat(String(s == null ? '' : s).replace(/[\s  ]/g, '').replace('−', '-').replace(',', '.')); return isNaN(v) ? null : v; };
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
const dec = x => Number(x).toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1});
let seed = 0; for (const ch of location.pathname) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
const pick = arr => { seed = (seed * 1103515245 + 12345) >>> 0; return arr[seed % arr.length]; };
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* ── факты со страницы ── */
const lv = $('[data-lv-lg]'), LGK = lv ? lv.dataset.lvLg : '';
const HOCKEY = LGK === 'khl' || LGK === 'nhl' || /\/(khl|nhl)\//.test(location.pathname);
const teams = $$('.mx-team', hero);
if (teams.length < 2) return;
const H = T($('b', teams[0])), A = T($('b', teams[1]));
if (!H || !A) return;
const G = HOCKEY ? ['шайбу', 'шайбы', 'шайб'] : ['гол', 'гола', 'голов'];
const surname = s => { const p = String(s).replace(/\s+[А-ЯЁA-Z]\.$/, '').trim().split(/\s+/); return p.length < 2 ? s : HOCKEY && /[А-ЯЁ]/.test(s) ? p[0] : p[p.length - 1]; };

const F = {h: {n: H}, a: {n: A}};
/* таблица */
const tab = $('table.mt-tab');
if (tab) {
  const hd = $$('thead th', tab).map(T), col = k => hd.indexOf(k) - 1;
  $$('tbody tr', tab).slice(0, 2).forEach((tr, i) => {
    const td = $$('td', tr), g = x => (x >= 0 && td[x] ? num(T(td[x])) : null), s = i ? F.a : F.h;
    s.place = g(col('Место')); s.gp = g(col('И')); s.pts = g(col('Очки'));
    const gl = col('Голы') >= 0 && td[col('Голы')] ? /(\d+)\s*:\s*(\d+)/.exec(T(td[col('Голы')])) : null;
    if (gl) { s.gf = +gl[1]; s.ga = +gl[2]; }
  });
}
/* форма: свежие справа */
$$('.mx-fc').slice(0, 2).forEach((fc, i) => {
  const d = $$('.mx-dots li', fc).map(li => li.classList.contains('r-w') ? 'w' : li.classList.contains('r-d') ? 'd' : 'l');
  const s = i ? F.a : F.h; s.form = d.slice(-5);
  if (d.length) { const r = d[d.length - 1]; let n = 0; for (let j = d.length - 1; j >= 0 && d[j] === r; j--) n++; s.streak = {r, n}; }
});
/* дома и в гостях */
const ha = $('table.mq-ha');
if (ha) $$('tbody tr', ha).forEach(tr => {
  const k = T($('th', tr)), td = $$('td', tr).map(T);
  if (/^Побед/.test(k)) td.forEach((t, i) => { const x = /(\d+)\D+(\d+)/.exec(t); if (x) (i ? F.a : F.h).haw = [+x[1], +x[2]]; });
  else if (/^Забивают/.test(k)) td.forEach((t, i) => { (i ? F.a : F.h).hagf = num(t); });
  else if (/^Пропускают/.test(k)) td.forEach((t, i) => { (i ? F.a : F.h).haga = num(t); });
});
const sec = id => { const h = document.getElementById(id); return h ? h.closest('section') : null; };
/* отдых и дорога */
const rest = sec('mq-rest');
if (rest) $$('.mq-card', rest).slice(0, 2).forEach((c, i) => {
  const s = i ? F.a : F.h;
  $$('.mq-tiles li', c).forEach(li => {
    const v = num(T($('b', li))), l = T($('span', li));
    if (/отдыха/.test(l)) s.rest = v; else if (/км/.test(l)) s.km = v; else if (/за 7 дней/.test(l)) s.week = v;
  });
});
/* кто в форме */
const hot = sec('mq-hot');
if (hot) $$('.mq-card', hot).slice(0, 2).forEach((c, i) => {
  const tr = $('tbody tr', c); if (!tr) return;
  const td = $$('td', tr), pts = num(T($('td.pt', tr) || td[td.length - 1])), g = num(T(td[1]));
  if (pts) (i ? F.a : F.h).hot = {n: surname(T($('a', td[0]) || td[0])), pts, g};
});
/* вратари: основной — больше всех игр */
const gk = sec('mq-gk');
if (gk) $$('.mq-card', gk).slice(0, 2).forEach((c, i) => {
  const best = $$('tbody tr', c).map(tr => { const td = $$('td', tr), n0 = td[0] && td[0].childNodes[0];
    return td.length >= 3 ? {n: surname(T(n0) || T(td[0])), gp: num(T(td[1])), sv: num(T(td[2]))} : null; })
    .filter(x => x && x.gp != null && x.sv != null).sort((x, y) => y.gp - x.gp)[0];
  if (best && best.gp >= 5) (i ? F.a : F.h).gk = best;
});
/* личные встречи: последние сверху */
const h2h = $$('.mx-h2h li').map(li => {
  const sp = $$('span.lg', li), w = sp.find(x => x.classList.contains('w'));
  return {score: T($('b', li)).replace(/\s+/g, ''), win: w ? w.getAttribute('title') : null};
});
/* модель */
const bar = $$('.mx-bar i b').map(b => num(T(b)));
const P = bar.length === 3 && bar.every(x => x != null) ? bar : null;
let over = null, overLine = '', xg = null;
$$('.mx-stats li').forEach(li => {
  const sp = T($('span', li)), b = T($('b', li));
  let x = /тотал больше\s*([\d,]+)/i.exec(sp); if (x) { over = num(b); overLine = x[1]; }
  if (/ожидаемые/.test(sp)) { x = /([\d,]+)\s*:\s*([\d,]+)/.exec(b); if (x) xg = [num(x[1]), num(x[2])]; }
});

/* ── текст ── */
const S = [];                                 /* предложения разбора: {t, w — за кого говорит факт: 'h' | 'a' | null} */
const add = (t, w) => { if (t) S.push({t, w: w || null}); };
const wins = s => (s.form || []).filter(r => r === 'w').length;

/* 1. расклад в таблице */
if (F.h.place && F.a.place) {
  const up = F.h.place < F.a.place ? 'h' : 'a', hi = F[up], lo = F[up === 'h' ? 'a' : 'h'], gap = hi.pts != null && lo.pts != null ? hi.pts - lo.pts : null;
  if (gap != null && gap <= 3 && Math.abs(F.h.place - F.a.place) > 2) add(`По таблице разрыв меньше, чем кажется: ${H} — ${F.h.place}-е место, ${A} — ${F.a.place}-е, но разница всего ${gap} ${plural(gap, 'очко', 'очка', 'очков')}.`);
  else if (Math.abs(F.h.place - F.a.place) <= 2) add(pick([
    `В таблице команды рядом: ${H} — ${F.h.place}-е место, ${A} — ${F.a.place}-е, так что это прямой спор соседей.`,
    `По таблице это встреча соседей: ${H} на ${F.h.place}-м месте, ${A} — на ${F.a.place}-м.`]));
  else add(pick([
    `${hi.n} в таблице заметно выше: ${hi.place}-е место против ${lo.place}-го${gap > 0 ? `, отрыв — ${gap} ${plural(gap, 'очко', 'очка', 'очков')}` : ''}.`,
    `По таблице расклад понятный: ${hi.n} — ${hi.place}-е место, ${lo.n} — только ${lo.place}-е${gap > 0 ? `, разница ${gap} ${plural(gap, 'очко', 'очка', 'очков')}` : ''}.`]), up);
}
/* 2. форма */
const st = ['h', 'a'].map(k => ({k, s: F[k].streak})).filter(x => x.s && x.s.n >= 3 && x.s.r !== 'd').sort((x, y) => y.s.n - x.s.n)[0];
if (st) {
  const s = F[st.k], n = st.s.n;
  add(st.s.r === 'w'
    ? pick([`${s.n} подходит к матчу на ходу — ${n} ${plural(n, 'победа', 'победы', 'побед')} подряд.`, `${s.n}: ${n} ${plural(n, 'победа', 'победы', 'побед')} подряд, команда сейчас на подъёме.`])
    : pick([`${s.n}: ${n} ${plural(n, 'поражение', 'поражения', 'поражений')} подряд, отрезок явно неудачный.`, `${s.n} сейчас в яме — ${n} ${plural(n, 'поражение', 'поражения', 'поражений')} кряду.`]),
    st.s.r === 'w' ? st.k : (st.k === 'h' ? 'a' : 'h'));
} else if (F.h.form && F.a.form && F.h.form.length >= 3 && F.a.form.length >= 3) {
  const a = wins(F.h), b = wins(F.a), nh = F.h.form.length, na = F.a.form.length;
  const ws = (k, n) => k ? `${k} ${plural(k, 'победа', 'победы', 'побед')} из ${n}` : `ни одной победы в ${n}`;
  const line = `Последние матчи: ${H} — ${ws(a, nh)}, ${A} — ${ws(b, na)}`;
  add(a - b >= 2 ? `${line}: по свежей форме преимущество за хозяевами.` : b - a >= 2 ? `${line}: по свежей форме сейчас лучше выглядят гости.` : `${line}, по форме команды примерно равны.`,
    a - b >= 2 ? 'h' : b - a >= 2 ? 'a' : null);
}
/* 3. дома и в гостях — самая яркая цифра */
const cand = [];
if (F.h.haw && F.h.haw[1] >= 5) { const r = F.h.haw[0] / F.h.haw[1];
  if (r >= .6) cand.push({sc: r, w: 'h', t: `Дома ${H} — ${F.h.haw[0]} ${plural(F.h.haw[0], 'победа', 'победы', 'побед')} в ${F.h.haw[1]} матчах, своя арена для хозяев — серьёзный козырь.`});
  if (r <= .35) cand.push({sc: 1 - r, w: 'a', t: `При этом дома ${H} выигрывает редко — всего ${F.h.haw[0]} из ${F.h.haw[1]}.`}); }
if (F.a.haga != null && F.a.haga >= (HOCKEY ? 3 : 1.8)) cand.push({sc: .7 + F.a.haga / 10, w: 'h', t: `${A} на выезде пропускает ${dec(F.a.haga)} за игру — это главное слабое место гостей.`});
if (F.a.haw && F.a.haw[1] >= 5 && F.a.haw[0] / F.a.haw[1] >= .55) cand.push({sc: F.a.haw[0] / F.a.haw[1], w: 'a', t: `${A} на выезде — ${F.a.haw[0]} ${plural(F.a.haw[0], 'победа', 'победы', 'побед')} в ${F.a.haw[1]} матчах, гости в дороге опасны.`});
if (cand.length) { const c = cand.sort((x, y) => y.sc - x.sc)[0]; add(c.t, c.w); }
/* 4. люди: кто в форме, вратари */
const hotS = ['h', 'a'].map(k => F[k].hot ? {k, ...F[k].hot} : null).filter(Boolean).sort((x, y) => y.pts - x.pts)[0];
if (hotS && hotS.pts >= 3) add(HOCKEY
  ? pick([`Главный, за кем я буду следить, — ${hotS.n} (${F[hotS.k].n}): ${hotS.pts} ${plural(hotS.pts, 'очко', 'очка', 'очков')} за последние матчи.`,
      `Самый горячий игрок матча — ${hotS.n} (${F[hotS.k].n}): ${hotS.pts} ${plural(hotS.pts, 'очко', 'очка', 'очков')} за последние игры.`])
  : pick([`Самый горячий игрок матча — ${hotS.n} (${F[hotS.k].n}): ${hotS.pts} ${plural(hotS.pts, 'гол или передача', 'гола и передачи', 'голов и передач')} за последние игры.`,
      `Главный, за кем я буду следить, — ${hotS.n} (${F[hotS.k].n}): на его счету ${hotS.pts} результативных ${plural(hotS.pts, 'действие', 'действия', 'действий')} за последние матчи.`]), hotS.k);
if (HOCKEY && F.h.gk && F.a.gk && Math.abs(F.h.gk.sv - F.a.gk.sv) >= 1) {
  const b = F.h.gk.sv > F.a.gk.sv ? 'h' : 'a', o = b === 'h' ? 'a' : 'h';
  add(`В воротах плюс у ${b === 'h' ? 'хозяев' : 'гостей'}: ${F[b].gk.n} (${F[b].n}) отражает ${dec(F[b].gk.sv)} % бросков, ${F[o].gk.n} (${F[o].n}) — ${dec(F[o].gk.sv)} %.`, b);
}
/* 5. отдых и дорога */
if (F.a.km >= 1500) add(pick([`${A} ${HOCKEY ? 'прилетает' : 'добирается'} издалека — ${Math.round(F.a.km).toLocaleString('ru-RU')} км дороги${F.a.rest != null ? ` и ${F.a.rest} ${plural(F.a.rest, 'день', 'дня', 'дней')} на восстановление` : ''}.`,
  `Не стоит забывать про дорогу: ${A} — ${Math.round(F.a.km).toLocaleString('ru-RU')} км перелёта перед игрой.`]), 'h');
else if (F.h.rest != null && F.a.rest != null && Math.abs(F.h.rest - F.a.rest) >= 2 && Math.min(F.h.rest, F.a.rest) <= 3) {
  const f = F.h.rest > F.a.rest ? 'h' : 'a', t = f === 'h' ? 'a' : 'h';
  add(`По свежести плюс у ${f === 'h' ? 'хозяев' : 'гостей'}: ${F[f].rest} ${plural(F[f].rest, 'день', 'дня', 'дней')} отдыха против ${F[t].rest}.`, f);
}
/* 6. личные встречи */
if (h2h.length >= 2) {
  const last = h2h.slice(0, 5), wh = last.filter(x => x.win === H).length, wa = last.filter(x => x.win === A).length;
  if (Math.abs(wh - wa) >= 2) { const w = wh > wa ? 'h' : 'a'; add(`Очные встречи: ${F[w].n} — ${Math.max(wh, wa)} ${plural(Math.max(wh, wa), 'победа', 'победы', 'побед')} в ${last.length} последних матчах между командами.`, w); }
  else if (h2h[0].win) add(`В последней очной встрече победа — ${h2h[0].win}, ${h2h[0].score}.`);
}

if (S.length < 2 && !P) return;              /* фактов мало — оставляем текст страницы как есть */

/* ── вывод ── */
let verdict = '';
if (P) {
  const [p1, x, p2] = P, fav = p1 >= p2 ? 'h' : 'a', d = Math.abs(p1 - p2), fn = F[fav].n;
  const pro = S.filter(s => s.w === fav).length, con = S.filter(s => s.w && s.w !== fav).length;
  const back = pro > con ? pick(['и факты выше это подтверждают', 'и цифры это подтверждают', 'и почти все аргументы в эту сторону']) : con > pro ? pick(['хотя аргументы у соперника тоже есть', 'но сопернику есть чем ответить']) : 'но перевес небольшой';
  const side = pro === con ? '' : ` По фактам выше больше аргументов у ${(pro > con ? fav : fav === 'h' ? 'a' : 'h') === 'h' ? 'хозяев' : 'гостей'}.`;
  if (d < 8) verdict = (HOCKEY
    ? pick([`Равный матч, явного фаворита я здесь не вижу (${p1} % на ${p2} %). Жду плотной игры, и до овертайма вполне может дойти.`, `Шансы почти поровну — ${p1} % на ${p2} %. Это тот случай, когда всё решит одна-две ошибки, овертайм не исключаю.`])
    : pick([`Равный матч: ${p1} % на ${p2} %, ничья — ${x} %. Фаворита не выделяю, ничейный исход здесь вполне реален.`, `Шансы почти поровну (${p1} % на ${p2} %), и ничья (${x} %) тут смотрится вполне естественно.`])) + side;
  else if (d < 25 || Math.max(p1, p2) < 58) verdict = `${fn} немного сильнее — ${Math.max(p1, p2)} % по расчёту модели, ${back}. Жду, что ${fn} доведёт дело до победы, но лёгкой игры не будет.`;
  else verdict = `${fn} — явный фаворит: ${Math.max(p1, p2)} % по расчёту модели, ${back}. Жду уверенной игры ${fav === 'h' ? 'хозяев' : 'гостей'} и победы ${fav === 'h' ? 'дома' : 'на выезде'}.`;
  if (over != null && overLine) verdict += over >= 58 ? ` ${HOCKEY ? 'По шайбам' : 'По голам'} матч, скорее, получится результативным — больше ${overLine} модель даёт ${over} %.`
    : over <= 40 ? ` Больших счетов не жду: тотал больше ${overLine} — всего ${over} %.` : '';
}

/* ── вывод на страницу ── */
const h2 = box.closest('section') && $('h2', box.closest('section'));
if (h2) h2.textContent = 'Мой разбор';
const text = S.slice(0, 5).map(s => s.t).join(' ');
const p = document.createElement('p'); p.className = 'mt-auth'; p.textContent = text;
box.replaceChildren(p);
if (verdict) {
  const v = document.createElement('p'); v.className = 'mt-verdict';
  const b = document.createElement('b'); b.textContent = 'Мой вывод. '; v.append(b, document.createTextNode(verdict));
  box.append(v);
}
const n = document.createElement('p'); n.className = 'mt-note'; n.textContent = 'Это оценка по данным, а не обещание исхода. Все цифры — ниже на этой странице.';
box.append(n);
})();
