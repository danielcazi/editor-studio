(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const hms = s => [Math.floor(s / 3600), Math.floor(s / 60) % 60, Math.floor(s) % 60].map(n => String(n).padStart(2, '0')).join(':');
const build = (th) => (st) => {
  const T = th === 'A' ? { bg: '#5857b0', ink: '#fff', mute: '#d9d8f5', btn: '#fff', btnInk: '#5857b0', acc: '#f6d44b' } : { bg: '#141413', ink: '#faf9f5', mute: '#8d8a80', btn: '#e8f23a', btnInk: '#141413', acc: '#e8f23a' };
  st.style.background = T.bg;
  K.el('div', K.px({ position: 'absolute', left: 80, top: 250, fontSize: 56, fontWeight: 800, letterSpacing: '-.04em', color: T.ink }), PR.logo, st);
  const kk = K.el('div', K.px({ position: 'absolute', left: 80, top: 460, fontSize: 36, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: T.acc }), PR.kicker, st);
  const hl = K.el('div', K.px({ position: 'absolute', left: 80, top: 540, fontSize: 250, fontWeight: 800, letterSpacing: '-.06em', lineHeight: .9, whiteSpace: 'pre', color: T.ink }), PR.headline, st);
  const sb = K.el('div', K.px({ position: 'absolute', left: 80, top: 1060, width: 900, fontSize: 46, fontWeight: 500, color: T.mute }), PR.sub, st);
  const ur = PR.urgency.on && K.el('div', K.px({ position: 'absolute', left: 80, top: 1170, fontSize: 40, fontWeight: 600, color: T.mute, fontVariantNumeric: 'tabular-nums' }), '', st);
  const bt = K.el('div', K.px({ position: 'absolute', left: 80, top: 1290, width: 920, height: 150, borderRadius: 999, background: T.btn, color: T.btnInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58, fontWeight: 800, letterSpacing: '-.02em' }), PR.button + ' →', st);
  const bd = PR.badge && K.el('div', K.px({ position: 'absolute', right: 80, top: 252, padding: '12px 26px 16px', borderRadius: 999, fontSize: 30, fontWeight: 700, background: T.acc, color: th === 'A' ? '#1f1e1d' : '#141413' }), PR.badge, st);
  const cur = K.el('div', K.px({ position: 'absolute', width: 54, height: 54, opacity: 0, zIndex: 5 }), '<svg viewBox="0 0 24 24" width="54" height="54"><path d="M5 3l14 8-6 2-3 6z" fill="#fff" stroke="#1f1e1d" stroke-width="1.5" stroke-linejoin="round"/></svg>', st);
  return t => {
    kk.style.opacity = P(t, 0, .3).toFixed(2);
    const h = P(t, .1, .7, E.oBack); hl.style.opacity = Math.min(1, h * 2).toFixed(2); hl.style.transform = `translateY(${lerp(70, 0, h).toFixed(0)}px)`;
    sb.style.opacity = P(t, .6, 1).toFixed(2);
    if (ur) { const k = P(t, 0, PR.duration, E.lin); ur.textContent = `${PR.urgency.label} ${hms(lerp(PR.urgency.from, PR.urgency.to, k))}`; ur.style.opacity = P(t, .9, 1.3).toFixed(2); }
    const b = P(t, .9, 1.4, E.oBack); const press = P(t, PR.clickAt, PR.clickAt + .08, E.lin) * (1 - P(t, PR.clickAt + .08, PR.clickAt + .25, E.lin));
    bt.style.opacity = Math.min(1, b * 2).toFixed(2); bt.style.transform = `scale(${(lerp(.8, 1, b) - press * .05).toFixed(3)})`;
    if (bd) { bd.style.opacity = P(t, .5, .9).toFixed(2); bd.style.transform = `rotate(${lerp(-8, 0, P(t, .5, 1, E.oBack)).toFixed(1)}deg)`; }
    const c = P(t, PR.clickAt - .8, PR.clickAt, E.io3); cur.style.opacity = P(t, PR.clickAt - .9, PR.clickAt - .6).toFixed(2);
    cur.style.left = lerp(900, 640, c).toFixed(0) + 'px'; cur.style.top = lerp(1620, 1390, c).toFixed(0) + 'px';
  };
};
K.boot(PR, { looks: { A: build('A'), B: build('B') } });
})();
