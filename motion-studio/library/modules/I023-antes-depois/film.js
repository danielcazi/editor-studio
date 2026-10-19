(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const W = 1080, Y0 = 430, HH = 1100;
const lado = (st, d, cor, ink, bg, dx = 0) => { // um lado completo, da largura da tela, recortado pelo divisor
  const L = K.el('div', K.px({ position: 'absolute', left: 0, top: Y0, width: W, height: HH, background: bg, overflow: 'hidden' }), '', st);
  K.el('div', K.px({ position: 'absolute', left: 60 + dx, top: 50, fontSize: 30, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: ink, opacity: .7 }), d.label, L);
  K.el('div', K.px({ position: 'absolute', left: 60 + dx, top: 100, fontSize: 46, fontWeight: 800, letterSpacing: '-.04em', color: ink }), d.titulo, L);
  return L;
};
K.boot(PR, { looks: {
  A(st) { // páginas: antes = blocos soltos e desalinhados; depois = layout limpo
    const A = lado(st, PR.antes, '', '#fff', '#6b6a66'), D = lado(st, PR.depois, '', '#fff', '#5857b0', 500);
    [[60, 260, 420, 130, '#8b8a85', -3], [90, 440, 330, 60, '#8b8a85', 4], [70, 560, 430, 36, '#7c7b76', 0], [60, 660, 360, 300, '#8b8a85', 2]].forEach(([x, y, w, h, c, r]) => K.el('div', K.px({ position: 'absolute', left: x, top: y, width: w, height: h, background: c, borderRadius: 14, transform: `rotate(${r}deg)` }), '', A));
    [[560, 260, 460, 190, '#fff'], [560, 490, 210, 330, '#ecebfa'], [800, 490, 220, 330, '#ecebfa'], [560, 860, 300, 90, '#faf9f5']].forEach(([x, y, w, h, c]) => K.el('div', K.px({ position: 'absolute', left: x, top: y, width: w, height: h, background: c, borderRadius: 22 }), '', D));
    return paintDiv(st, A, D);
  },
  B(st) { // números: nota de cada lado
    const A = lado(st, PR.antes, '', '#fff', '#2a2926'), D = lado(st, PR.depois, '', '#fff', '#16162b', 500);
    [[A, PR.antes], [D, PR.depois]].forEach(([L, d]) => { const cx = d === PR.depois ? W / 2 : 0;
      K.el('div', K.px({ position: 'absolute', left: cx, width: W / 2, top: 400, textAlign: 'center', fontSize: 330, fontWeight: 800, letterSpacing: '-.06em', color: d.tone, lineHeight: 1 }), K.dado(d === PR.depois ? 'speed' : 'speed_antes', d.valor), L);
      K.el('div', K.px({ position: 'absolute', left: cx, width: W / 2, top: 800, textAlign: 'center', fontSize: 44, fontWeight: 600, color: '#cfccc3' }), d.unid, L); });
    return paintDiv(st, A, D);
  },
} });
function paintDiv(st, A, D) {
  const line = K.el('div', K.px({ position: 'absolute', top: Y0 - 30, width: 8, height: HH + 60, background: '#fff', borderRadius: 4, boxShadow: '0 0 40px rgba(0,0,0,.4)' }), '', st);
  const knob = K.el('div', K.px({ position: 'absolute', top: Y0 + HH / 2 - 56, width: 112, height: 112, borderRadius: '50%', background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, color: '#5857b0' }), '◂ ▸', st);
  const tg = PR.ilustrativo && K.el('div', K.px({ position: 'absolute', left: 60, top: Y0 + HH + 24, fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,.7)' }), 'valores do "antes" ilustrativos', st);
  return t => {
    const a = P(t, 0, .4), x = W * lerp(PR.from, PR.to, P(t, .3, 1.5, E.io3));
    const fim = x + (t > 1.5 ? Math.sin(P(t, 1.5, 2.4, E.lin) * Math.PI * 2) * 40 : 0); // balanço final
    // à esquerda do divisor fica o ANTES, à direita o DEPOIS
    A.style.clipPath = `inset(0 ${W - fim}px 0 0)`; D.style.clipPath = `inset(0 0 0 ${fim}px)`;
    line.style.left = `${fim - 4}px`; knob.style.left = `${fim - 56}px`;
    [A, D, line, knob].forEach(e => e.style.opacity = a.toFixed(2)); if (tg) tg.style.opacity = P(t, 1.2, 1.6);
  };
}
})();
