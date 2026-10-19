/* Módulo E01 · efeitos de acabamento (lib/fx.js). Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros.
   Duas camadas idênticas: A sem efeito, B com efeito; uma cortina varre da direita para a esquerda e o efeito entra com ele. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = { io3: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2, o3: p => 1 - (1 - p) ** 3 };
const P = (t, a, b, e = E.io3) => e(clamp((t - a) / (b - a)));

const params = new URLSearchParams(location.search);
const q = params.get('p');
const PR = { ...window.PARAMS, ...(q ? JSON.parse(decodeURIComponent(escape(atob(q.replace(/-/g, '+').replace(/_/g, '/'))))) : {}) };
const LOOK = params.get('look') || PR.look;
const W = 1080, H = 1920;

const plateHTML = () => `<div class="plate">
  <div class="sun" style="left:300px;top:1000px;width:480px;height:480px"></div>
  <svg viewBox="0 0 1080 560" preserveAspectRatio="none" style="height:560px"><path d="M0 260 L170 120 L300 230 L470 60 L650 250 L810 150 L1080 300 V560 H0Z" fill="#3a2a4d"/><path d="M0 380 L220 270 L400 360 L620 250 L860 370 L1080 300 V560 H0Z" fill="#251b33"/></svg>
  <div class="big">${PR.headline.replace(/\n/g, '<br>')}</div>
  <div class="sub">${PR.sub}</div>
  <div class="dots"><i style="background:#e8f23a"></i><i style="background:#6f6fc9"></i><i style="background:#ff6a4d"></i><i style="background:#2fbf6b"></i></div>
</div>`;
$('#A').innerHTML = plateHTML();
$('#B').innerHTML = plateHTML() + (LOOK === 'glass' ? `<div id="card"><b><span id="cv"></span></b><span>${PR.card.caption}</span></div>` : '');
const B = $('#B'), plate = B.querySelector('.plate'), card = $('#card');

function paint(t) {
  const k = P(t, .2, 1.2);                        // intensidade do efeito 0→1
  const wipe = lerp(W, 0, P(t, .2, 1.4));         // cortina: B aparece à direita dela
  B.style.clipPath = `inset(0 0 0 ${wipe.toFixed(1)}px)`;
  const o = PR.fx[LOOK];
  if (LOOK === 'grain') FX.grain(B, { t, ...o, strength: o.strength * k });
  if (LOOK === 'vignette') FX.vignette(B, { ...o, amount: o.amount * k });
  if (LOOK === 'grade') FX.grade(plate, { ...o, contrast: lerp(1, o.contrast, k), saturate: lerp(1, o.saturate, k), temp: o.temp * k,
    curves: Object.fromEntries(Object.entries(o.curves).map(([c, pts]) => [c, pts.map(([x, y]) => [x, lerp(x, y, k)])])) });
  if (LOOK === 'blur') FX.blur(plate, { x: o.x * k * (1 + .2 * Math.sin(t * 3)), y: o.y * k });
  if (LOOK === 'chroma') FX.chroma(plate, { ...o, amount: o.amount * k * (1 + .25 * Math.sin(t * 4)) });
  if (LOOK === 'glass') {
    FX.glass(card, { ...o, blur: o.blur * k, tint: o.tint * k });
    const a = P(t, .5, 1.1, E.o3);
    card.style.opacity = a.toFixed(3); card.style.transform = `translateY(${lerp(50, 0, a).toFixed(1)}px)`;
    $('#cv').textContent = Math.round(PR.card.value * P(t, .6, 2.2)) + PR.card.suffix;
  }
  const l = $('#label'); l.textContent = PR.labels[LOOK] || LOOK;
  l.style.opacity = P(t, 0, .3, E.o3).toFixed(3);
}

window.DURATION = PR.duration; window.FPS = 30; window.SFX = [];
window.seek = async t => { paint(t); };
window.__ready = (async () => { await document.fonts.ready; await window.seek(0); })();
})();
