/* I018 Legenda karaoke — agrupa palavras em páginas; só a página atual aparece. Palavra ativa: pílula (A) ou cor+pulo (B). */
(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const build = (pill) => (st) => {
  const pages = []; for (let i = 0; i < PR.words.length; i += PR.perPage) pages.push(PR.words.slice(i, i + PR.perPage));
  const rows = pages.map(pg => {
    const row = K.el('div', K.px({ position: 'absolute', left: 60, right: 60, top: PR.y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px', opacity: 0 }), '', st);
    const ws = pg.map(w => ({ w, el: K.el('span', K.px({ position: 'relative', display: 'inline-block', fontSize: PR.size, fontWeight: 800, letterSpacing: '-.03em', color: PR.ink, padding: '4px 20px 12px', borderRadius: 22, textShadow: pill ? 'none' : '0 6px 28px rgba(0,0,0,.55)', background: 'transparent', willChange: 'transform' }), w.w, row) }));
    return { start: pg[0].s, end: pg[pg.length - 1].e + .25, row, ws };
  });
  rows.forEach((r, i) => { if (rows[i + 1]) r.end = Math.min(r.end, rows[i + 1].start - .05); }); // a página seguinte entra quando esta sai
  return t => rows.forEach(r => {
    const on = t >= r.start - .05 && t < r.end;
    r.row.style.opacity = on ? P(t, r.start - .05, r.start + .08) * (1 - P(t, r.end - .1, r.end, E.lin)) : 0;
    r.row.style.transform = `translateY(${lerp(24, 0, P(t, r.start - .05, r.start + .2)).toFixed(1)}px)`;
    r.ws.forEach(({ w, el }) => {
      const k = P(t, w.s, w.s + .12, E.oBack) * (1 - P(t, w.e, w.e + .1, E.lin)), done = t >= w.e;
      el.style.transform = `scale(${lerp(1, 1.12, k).toFixed(3)}) translateY(${(-10 * k).toFixed(1)}px)`;
      el.style.background = pill ? `rgba(${hex(PR.active)},${k.toFixed(2)})` : 'transparent';
      el.style.color = pill ? (k > .5 ? PR.activeInk : PR.ink) : (k > .3 ? PR.accent : done ? PR.ink : PR.ink);
    });
  });
};
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
K.boot(PR, { looks: { A: build(true), B: build(false) } });
})();
