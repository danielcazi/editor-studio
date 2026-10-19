(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const build = (dark) => (st) => {
  st.style.background = dark ? '#141413' : '#faf9f5';
  const ink = dark ? '#faf9f5' : '#1f1e1d', sup = dark ? '#201f24' : '#fff', borda = dark ? '#34323c' : '#e6e3da';
  const lab = K.el('div', K.px({ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontSize: 110, fontWeight: 800, letterSpacing: '-.04em', color: ink }), '', st);
  const sub = K.el('div', K.px({ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontSize: 38, fontWeight: 600, color: '#8f8fdd' }), '', st);
  const fr = K.el('div', K.px({ position: 'absolute', left: '50%', top: 1000, background: sup, borderRadius: 34, boxShadow: `0 40px 80px -40px rgba(0,0,0,.55), 0 0 0 2px ${borda}`, overflow: 'hidden' }), '', st);
  const bar = K.el('div', K.px({ position: 'absolute', left: 0, right: 0, top: 0, height: 54, background: dark ? '#2a2830' : '#f1efe8', display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 22 }), [0, 1, 2].map(() => '<i style="width:14px;height:14px;border-radius:50%;background:#bdb9ad;display:inline-block"></i>').join(''), fr);
  const hero = K.el('div', K.px({ position: 'absolute', left: 30, top: 80, background: '#5857b0', borderRadius: 22 }), '', fr);
  const cards = [0, 1, 2].map(() => K.el('div', K.px({ position: 'absolute', background: dark ? '#2f2d38' : '#ecebfa', borderRadius: 18 }), '', fr));
  const btn = K.el('div', K.px({ position: 'absolute', height: 54, width: 190, background: '#fff', borderRadius: 999, opacity: .95 }), '', hero);
  const S = PR.steps, seg = PR.hold + PR.move;
  const at = t => { const i = Math.min(S.length - 1, Math.floor(t / seg)), a = S[i], b = S[Math.min(S.length - 1, i + 1)], k = P(t - i * seg - PR.hold, 0, PR.move, E.io3); return { i, w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), cols: k > .5 ? b.cols : a.cols, k, nome: k > .5 ? b.nome : a.nome }; };
  return t => {
    const s = at(Math.min(t, S.length * seg - .01));
    fr.style.width = s.w + 'px'; fr.style.height = s.h + 'px'; fr.style.marginLeft = -s.w / 2 + 'px'; fr.style.top = (1000 - s.h / 2 + 100) + 'px';
    const iw = s.w - 60, hh = Math.max(150, s.h * .36);
    Object.assign(hero.style, { width: iw + 'px', height: hh + 'px' }); btn.style.left = '28px'; btn.style.top = hh - 84 + 'px'; btn.style.width = Math.min(190, iw - 56) + 'px';
    const top = 80 + hh + 24, gap = 18, rows = Math.ceil(3 / s.cols), cw = (iw - gap * (s.cols - 1)) / s.cols, ch = Math.max(46, (s.h - top - 30 - gap * (rows - 1)) / rows);
    cards.forEach((c, i) => { const col = i % s.cols, row = Math.floor(i / s.cols); Object.assign(c.style, { left: 30 + col * (cw + gap) + 'px', top: top + row * (ch + gap) + 'px', width: cw + 'px', height: ch + 'px' }); });
    lab.textContent = s.nome; lab.style.opacity = (1 - Math.sin(Math.PI * s.k) * .6).toFixed(2);
    sub.textContent = `${Math.round(s.w)} px`; fr.style.opacity = P(t, 0, .25).toFixed(2);
  };
};
K.boot(PR, { looks: { A: build(false), B: build(true) } });
})();
