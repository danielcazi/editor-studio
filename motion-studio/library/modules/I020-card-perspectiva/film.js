(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const build = (dark) => (st) => {
  const bg = dark ? '#1d1c22' : '#fff', ink = dark ? '#faf9f5' : '#1f1e1d', mute = dark ? '#8d8a80' : '#7c7a73', line = dark ? '#2e2c36' : '#ece9e0';
  const wrap = K.el('div', K.px({ position: 'absolute', left: 90, top: PR.y, width: 900, perspective: 1800, perspectiveOrigin: '50% 40%' }), '', st);
  const card = K.el('div', K.px({ position: 'relative', width: 900, borderRadius: 36, background: bg, color: ink, padding: '44px 48px 20px', boxShadow: '0 60px 90px -40px rgba(0,0,0,.55), 0 0 0 1px ' + line, transformStyle: 'preserve-3d', transformOrigin: '50% 50%', overflow: 'hidden' }), '', wrap);
  K.el('div', K.px({ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em' }), PR.title, card);
  K.el('div', K.px({ fontSize: 26, fontWeight: 500, color: mute, margin: '6px 0 26px' }), PR.sub, card);
  const rows = PR.rows.map((r, i) => {
    const row = K.el('div', K.px({ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 116, padding: '0 8px', borderTop: '2px solid ' + line, fontSize: 36, fontWeight: 600 }), '', card);
    K.el('span', K.px({ color: i === PR.hi ? ink : mute }), r.n, row);
    const val = K.el('span', K.px({ fontWeight: 800, fontSize: 46, fontVariantNumeric: 'tabular-nums' }), r.k ? K.dado(r.k, r.v) : r.v, row);
    return { row, val };
  });
  const hi = rows[PR.hi] && K.el('div', K.px({ position: 'absolute', left: 14, right: 14, height: 112, borderRadius: 22, border: '4px solid #6f6fc9', background: 'rgba(111,111,201,.10)', opacity: 0, boxShadow: '0 0 0 12px rgba(111,111,201,.12)' }), '', card);
  const sheen = K.el('div', K.px({ position: 'absolute', top: 0, bottom: 0, width: 260, background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent)', transform: 'skewX(-14deg)', opacity: dark ? .25 : .7 }), '', card);
  return t => {
    const a = P(t, 0, .8, E.oBack), b = P(t, .9, 1.6, E.io3);
    const rx = lerp(PR.tiltX + 20, lerp(PR.tiltX, PR.tiltX * .35, b), a), ry = lerp(PR.tiltY - 30, lerp(PR.tiltY, PR.tiltY * .35, b), a);
    card.style.transform = `translateY(${lerp(120, 0, a).toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${lerp(.86, 1, a).toFixed(3)})`;
    wrap.style.opacity = Math.min(1, a * 1.6).toFixed(3);
    rows.forEach((r, i) => { const k = P(t, .25 + i * .12, .6 + i * .12); r.row.style.opacity = k.toFixed(2); r.row.style.transform = `translateX(${lerp(40, 0, k).toFixed(1)}px)`; });
    sheen.style.left = `${lerp(-300, 1200, P(t, .5, 1.2, E.io3)).toFixed(0)}px`;
    if (hi) { const k = P(t, 1.3, 1.7, E.oBack); hi.style.opacity = Math.min(1, k * 2).toFixed(2); hi.style.top = `${rows[PR.hi].row.offsetTop - 2}px`; hi.style.transform = `scale(${lerp(1.06, 1, k).toFixed(3)})`; }
  };
};
K.boot(PR, { looks: { A: build(false), B: build(true) } });
})();
