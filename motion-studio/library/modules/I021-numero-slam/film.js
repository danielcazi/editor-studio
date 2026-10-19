(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const build = (th) => (st) => {
  const T = { A: { bg: '#faf9f5', ink: '#1f1e1d', mute: '#7c7a73', acc: '#5857b0' }, B: { bg: '#141413', ink: '#faf9f5', mute: '#8d8a80', acc: '#e8f23a' }, C: { bg: '#5857b0', ink: '#fff', mute: '#d9d8f5', acc: '#fff' } }[th];
  st.style.background = T.bg;
  const real = K.dado(PR.dadoKey, null);
  const fin = real != null ? real : (+PR.to).toFixed(PR.decimals).replace('.', ',') + PR.suffix; // texto final já formatado
  const alvo = parseFloat(String(fin).replace(',', '.')), suf = String(fin).replace(/[\d.,\s]/g, '') || PR.suffix;
  const k = K.el('div', K.px({ position: 'absolute', left: 80, top: 330, fontSize: 38, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: T.mute }), PR.kicker, st);
  const n = K.el('div', K.px({ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontSize: 420, fontWeight: 800, letterSpacing: '-.06em', lineHeight: 1, color: T.ink, fontVariantNumeric: 'tabular-nums', willChange: 'transform' }), '', st);
  const cap = K.el('div', K.px({ position: 'absolute', left: 80, right: 80, top: 1060, textAlign: 'center', fontSize: 50, fontWeight: 600, color: T.mute }), PR.caption, st);
  const col = PR.deltaTone === 'down' ? '#e0523a' : '#2fbf6b';
  const dl = PR.delta && K.el('div', K.px({ position: 'absolute', left: '50%', top: 1190, marginLeft: -200, width: 400, textAlign: 'center', padding: '16px 0 20px', borderRadius: 999, fontSize: 56, fontWeight: 800, background: col, color: '#fff' }), PR.delta, st);
  const il = PR.ilustrativo && K.el('div', K.px({ position: 'absolute', left: 80, bottom: 380, fontSize: 24, fontWeight: 600, color: T.mute }), 'número ilustrativo', st);
  return t => {
    const c = P(t, .15, 1.0, E.o3), v = lerp(PR.from, alvo, c), slam = P(t, 1.0, 1.12, E.lin);
    n.textContent = (PR.decimals ? v.toFixed(PR.decimals).replace('.', ',') : Math.round(v)) + suf;
    const rng = K.rng(Math.round(t * 30) + 11); // ruído semeado pelo quadro: continua função pura do tempo
    const bump = t >= 1.0 ? Math.max(0, 1 - (t - 1.0) / .35) : 0; // tremida depois do impacto
    const sc = t < 1.0 ? lerp(.9, 1, c) : lerp(1.18, 1, P(t, 1.0, 1.35, E.oBack));
    n.style.transform = `translate(${((rng() - .5) * 22 * bump).toFixed(1)}px,${((rng() - .5) * 22 * bump).toFixed(1)}px) scale(${sc.toFixed(3)})`;
    n.style.opacity = P(t, .05, .25).toFixed(2); k.style.opacity = P(t, 0, .3).toFixed(2); cap.style.opacity = P(t, 1.1, 1.5).toFixed(2);
    if (dl) { const d = P(t, 1.15, 1.5, E.oBack); dl.style.opacity = Math.min(1, d * 2).toFixed(2); dl.style.transform = `scale(${lerp(.6, 1, d).toFixed(3)})`; }
    if (il) il.style.opacity = P(t, 1.2, 1.5).toFixed(2);
  };
};
K.boot(PR, { looks: { A: build('A'), B: build('B'), C: build('C') } });
})();
