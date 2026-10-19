/* I017 Transições — overlay com alfa. A cobre a tela em [0, mid] e libera em [mid, duration]. */
(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const W = 1080, H = 1920;
K.boot(PR, { looks: {
  A(st) { // whip: painel inclinado entra pela esquerda, cobre, sai pela direita, com riscos de velocidade
    const pn = K.el('div', K.px({ position: 'absolute', left: -300, top: -100, width: W + 600, height: H + 200, background: PR.color, transform: 'skewX(-12deg)' }), '', st);
    const rays = [...Array(9)].map((_, i) => K.el('div', K.px({ position: 'absolute', top: 120 + i * 200, height: 10 + (i % 3) * 8, background: PR.accent, opacity: .0, borderRadius: 8 }), '', st));
    return t => {
      const a = P(t, 0, PR.mid, E.io3), b = P(t, PR.mid, PR.duration, E.io3);
      const x = a < 1 ? lerp(-(W + 600), 0, a) : lerp(0, W + 600, b);
      pn.style.transform = `translateX(${x}px) skewX(-12deg)`;
      rays.forEach((r, i) => { const lead = x + (a < 1 ? W + 600 : 0); r.style.left = `${Math.max(0, lead - 400 - i * 30)}px`; r.style.width = `${300 + (i % 4) * 90}px`; r.style.opacity = (Math.sin(Math.PI * (a < 1 ? a : 1 - b))).toFixed(2) * .8; });
    };
  },
  B(st) { // glitch: fatias horizontais deslocadas em bandas de cor, flash no meio
    const R = K.rng(PR.seed), n = PR.slices, hh = H / n;
    const sl = [...Array(n)].map((_, i) => ({ el: K.el('div', K.px({ position: 'absolute', left: 0, top: i * hh, width: W, height: hh + 1, background: [PR.color, PR.accent, '#e0523a', '#2fbf6b'][i % 4] }), '', st), d: (R() * 2 - 1) * 520, o: R() * .25 }));
    return t => {
      const k = Math.sin(Math.PI * P(t, 0, PR.duration, E.lin)); // 0 → 1 → 0
      const cover = P(t, 0, PR.mid * .9) * (1 - P(t, PR.mid * 1.1, PR.duration));
      sl.forEach(s => { s.el.style.transform = `translateX(${(s.d * (1 - cover) * k * 1.2).toFixed(0)}px)`; s.el.style.opacity = Math.min(1, Math.max(0, (k - s.o) * 3)).toFixed(2); });
    };
  },
  C(st) { // círculo: um disco cresce do ponto (cx,cy) até cobrir; depois abre um furo que cresce e libera
    const d = K.el('div', K.px({ position: 'absolute', inset: 0, background: PR.color }), '', st);
    const R = Math.hypot(Math.max(PR.cx, W - PR.cx), Math.max(PR.cy, H - PR.cy)) + 20;
    return t => {
      const a = P(t, 0, PR.mid, E.io3), b = P(t, PR.mid, PR.duration, E.io3);
      d.style.clipPath = 'none';
      d.style.background = b > 0
        ? `radial-gradient(circle at ${PR.cx}px ${PR.cy}px, transparent ${(R * b).toFixed(0)}px, ${PR.color} ${(R * b + 1).toFixed(0)}px)`
        : `radial-gradient(circle at ${PR.cx}px ${PR.cy}px, ${PR.color} ${(R * a).toFixed(0)}px, transparent ${(R * a + 1).toFixed(0)}px)`;
    };
  },
} });
})();
