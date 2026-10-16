/* Modelo de módulo reutilizável do motion mod.
   Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. Layout decidido pelo viewport.
   Tudo que muda entre versões vive em PARAMS (params.js), sobrescrito por ?p=<base64url JSON>. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = { o3: p => 1 - (1 - p) ** 3, io3: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2 };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));

const q = new URLSearchParams(location.search).get('p');
const PR = { ...window.PARAMS, ...(q ? JSON.parse(decodeURIComponent(escape(atob(q.replace(/-/g, '+').replace(/_/g, '/'))))) : {}) };
const C = { ...window.PARAMS.colors, ...(PR.colors || {}) };
Object.entries(C).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));

const V = innerHeight > innerWidth;
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
/* área segura vertical: tudo entre y 230 e 1520, longe do trilho de botões à direita */
const LY = V ? { x: 90, head: [230, 96], num: [560, 420], cap: 1060 } : { x: 160, head: [150, 84], num: [330, 360], cap: 760 };

const head = $('#head'), num = $('#num'), cap = $('#cap');
head.textContent = PR.headline; cap.textContent = PR.caption;
Object.assign(head.style, { left: LY.x + 'px', top: LY.head[0] + 'px', fontSize: LY.head[1] + 'px' });
Object.assign(num.style, { left: LY.x + 'px', top: LY.num[0] + 'px', fontSize: LY.num[1] + 'px' });
Object.assign(cap.style, { left: LY.x + 'px', top: LY.cap + 'px' });

function paint(t) {
  const a = P(t, 0, .5);
  head.style.opacity = a; head.style.transform = `translateY(${lerp(40, 0, a)}px)`;
  const k = P(t, .6, PR.duration - .8, E.io3);
  num.textContent = Math.round(lerp(PR.from, PR.to, k)) + PR.suffix;
  num.style.opacity = P(t, .5, .8);
  cap.style.opacity = P(t, 1, 1.4);
}

window.DURATION = PR.duration; window.FPS = 30; window.SFX = [];
window.seek = async t => { paint(t); };
window.__ready = (async () => { await document.fonts.ready; await document.fonts.load('40px "Instrument Serif"'); await window.seek(0); })();
})();
