/* Job 04 - CAZI S-EFX (plano PRO) — storyboard/edição pelo fluxo do editor-studio (54,6 s, 9:16, 23,976 fps).
   Refs escolhidas: Cortes secos + punch-in · Título gigante no topo · Interface sobre o vídeo.
   Base: vídeo original com punch-ins. Topo: títulos gigantes (M09, riscado M15). Peito: relatório (M28, novo),
   busca (M27), celular (M11), lista de resultados (M27), painel (M26), integrações (M17), editor pixel a pixel (M14),
   oferta (M18). Tela cheia só no Plano PRO (M13).
   Contrato: window.seek(t) pinta o quadro t e resolve quando as imagens do quadro estão decodificadas. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: p => p, i2: p => p * p, o2: p => 1 - (1 - p) ** 2, o3: p => 1 - (1 - p) ** 3, io3: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2,
  oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2, oExpo: p => p >= 1 ? 1 : 1 - 2 ** (-10 * p),
};
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const SRC_FPS = 24000 / 1001, NFR = 1309, DURATION = NFR / SRC_FPS;
const SFX = [];
const sfx = (t, type, g = 1) => SFX.push({ t: +t.toFixed(3), type, g });

/* ---------------- imagens ---------------- */
let pending = [];
function setImg(el, src) {
  if (el.dataset.src === src) return;
  el.dataset.src = src; el.src = src;
  pending.push(el.decode().catch(() => {}));
}
const pad = n => String(n).padStart(5, '0');

/* ---------------- overlays renderizados da biblioteca (PNG com alfa, já em 23,976 fps) ---------------- */
const OV = [
  { dir: 'relatorio', t0: 2.52, n: 35 },          // M28 Relatório sem a linha que importa · look B
  { dir: 'painel-dark', t0: 15.40, n: 102 },      // M26 Painel no escuro · mode dark
  { dir: 'paginas', t0: 24.15, n: 127 },          // M27 Resultado do Google
  { dir: 'painel-reveal', t0: 33.05, n: 165 },    // M26 Painel no escuro · mode reveal
];

/* ---------------- câmera: punch-ins [t0, t1, z0, z1] ---------------- */
const ZOOM = [
  [0, .55, 1.12, 1.0], [9.78, 11.3, 1.12, 1.05], [19.6, 21.2, 1.0, 1.12],
  [40.04, 42.45, 1.1, 1.06], [48.94, DURATION, 1.0, 1.06],
];
function zoomAt(t) {
  for (const [a, b, z0, z1] of ZOOM) if (t >= a && t < b) return lerp(z0, z1, E.o3(clamp((t - a) / (b - a))));
  return 1;
}

/* ---------------- palavras-chave (M09): cada palavra salta no tempo em que é dita ---------------- */
/* bloco: { a: entra, b: sai, y: base da 1ª linha, lines: [{ size, words: [[texto, t, acento?]] }] } */
const KW = [
  { a: .04, b: 2.50, y: 120, lines: [{ size: 210, words: [['Um', .10], ['erro', .24, 1]] }] },
  { a: 8.02, b: 9.02, y: 120, lines: [{ size: 170, words: [['Não', 8.10], ['acha', 8.24, 1]] }] },
  { a: 9.04, b: 11.34, y: 100, lines: [{ size: 170, words: [['Fecha.', 9.78]] }, { size: 96, words: [['e', 10.12], ['vai', 10.28], ['pro', 10.40], ['próximo', 10.54, 1]] }] },
  { a: 11.36, b: 13.66, y: 100, lines: [{ size: 150, words: [['Perdeu', 12.56]] }, { size: 120, words: [['esse', 12.94], ['paciente', 13.06, 1]] }] },
  { a: 13.68, b: 15.30, y: 100, strike: 15.0, strikeLine: 1, lines: [{ size: 90, words: [['não', 14.16], ['é', 14.30], ['só', 14.40]] }, { size: 170, words: [['site', 14.72], ['fraco', 14.98, 1]] }] },
  { a: 19.52, b: 21.20, y: 120, lines: [{ size: 170, words: [['no', 20.64], ['escuro', 20.74, 1]] }] },
  { a: 30.40, b: 33.02, y: 120, lines: [{ size: 150, words: [['integrado', 30.60, 1]] }] },
  { a: 40.00, b: 42.46, y: 90, strike: 42.14, strikeLine: 1, lines: [{ size: 80, words: [['ninguém', 40.04], ['promete', 41.02]] }, { size: 160, words: [['1º', 41.54], ['lugar', 41.74]] }, { size: 100, words: [['no', 42.0], ['Google', 42.12, 1]] }] },
  { a: 44.60, b: 46.86, y: 100, lines: [{ size: 120, words: [['pronto', 44.70], ['pra', 45.08]] }, { size: 120, words: [['ser', 45.38], ['encontrado', 45.64, 1]] }] },
  { a: 46.88, b: 48.90, y: 100, lines: [{ size: 120, words: [['medir', 47.08], ['o', 47.42], ['que', 47.50]] }, { size: 130, words: [['funciona', 48.26, 1]] }] },
];
const kwRoot = $('#kw');
const KWEL = KW.map(blk => {
  const box = document.createElement('div'); box.className = 'abs'; box.style.cssText = 'left:0;top:0;width:1080px;height:1920px';
  let y = blk.y;
  const lines = blk.lines.map(ln => {
    const el = document.createElement('div'); el.className = 'kl'; el.style.fontSize = ln.size + 'px';
    const ws = ln.words.map(([tx, t, acc]) => { const s = document.createElement('span'); s.className = 'w' + (acc ? ' acc' : ''); s.textContent = tx; el.appendChild(s); return { s, t }; });
    box.appendChild(el);
    return { el, ws, size: ln.size };
  });
  let bar = null;
  if (blk.strike) { bar = document.createElement('div'); bar.className = 'abs'; bar.style.cssText = 'height:22px;border-radius:11px;background:#fff;transform-origin:0 50%;rotate:-4deg;box-shadow:0 6px 20px rgba(0,0,0,.4)'; box.appendChild(bar); sfx(blk.strike, 'strike', .9); }
  kwRoot.appendChild(box);
  return { blk, box, lines, y, bar };
});
function layoutKW() {   // mede uma vez: encolhe a linha até caber em 940 px e empilha
  KWEL.forEach(k => {
    let y = k.blk.y;
    k.lines.forEach(ln => {
      const w = ln.el.scrollWidth, fit = Math.min(1, 960 / w);
      ln.el.style.fontSize = (ln.size * fit) + 'px';
      ln.top = y; ln.h = ln.size * fit;
      ln.el.style.top = y + 'px'; y += ln.size * fit * 1.08;
      ln.w = Math.min(960, w);
    });
    if (k.bar) { const L = k.lines[k.blk.strikeLine || 0], w = L.w * .92; Object.assign(k.bar.style, { left: (540 - w / 2) + 'px', width: w + 'px', top: (L.top + L.h * .55 - 11) + 'px' }); }
  });
}
KW.forEach(b => b.lines.forEach(l => l.words.forEach(([, t]) => sfx(t, 'pop', .35))));
function paintKW(t) {
  let any = 0;
  KWEL.forEach(k => {
    const on = t >= k.blk.a - .01 && t < k.blk.b;
    k.box.style.display = on ? '' : 'none';
    if (!on) return;
    any = 1;
    const out = P(t, k.blk.b - .12, k.blk.b, E.i2);
    k.box.style.transform = `translateY(${lerp(0, -40, out)}px)`; k.box.style.opacity = (1 - out).toFixed(3);
    if (k.bar) {
      k.bar.style.transform = `scaleX(${P(t, k.blk.strike, k.blk.strike + .18, E.o3).toFixed(4)})`;
      const r = mulberry32(Math.floor(t * 60)), sh = 9 * (1 - P(t, k.blk.strike + .05, k.blk.strike + .3, E.lin)) * (t >= k.blk.strike + .05 ? 1 : 0);
      k.box.style.transform += ` translate(${((r() - .5) * sh).toFixed(1)}px,${((r() - .5) * sh).toFixed(1)}px)`;
    }
    k.lines.forEach(ln => ln.ws.forEach(({ s, t: tw }) => {
      const a = P(t, tw - .04, tw + .22, E.oBack);
      s.style.transform = `translateY(${lerp(-40, 0, a).toFixed(1)}px) scale(${lerp(.82, 1, a).toFixed(3)})`;
      s.style.opacity = Math.min(1, P(t, tw - .04, tw + .06, E.lin) * 1).toFixed(3);
    }));
  });
  return any;
}

/* ---------------- busca digitada (M02 adaptado) 3,90–7,05 ---------------- */
const Q1 = 'dentista perto de mim', Q2 = 'psicólogo em Pinheiros';
$('#search').innerHTML = `
  <div id="sLbl" class="abs" style="left:70px;top:1100px;font-size:34px;font-weight:700;color:#fff">Alguém digita:</div>
  <div id="sBar" class="card" style="left:70px;top:1160px;width:940px;height:104px;border-radius:52px">
    <svg class="abs" style="left:36px;top:30px" width="44" height="44" viewBox="0 0 40 40"><circle cx="17" cy="17" r="11" fill="none" stroke="#7c7a73" stroke-width="4.5"/><line x1="25.5" y1="25.5" x2="35" y2="35" stroke="#7c7a73" stroke-width="5.5" stroke-linecap="round"/></svg>
    <div class="abs" style="left:104px;top:28px;font-size:40px;font-weight:600;white-space:nowrap"><span id="sT"></span><span id="sC" style="display:inline-block;width:3px;height:42px;background:var(--roxo);vertical-align:-7px;margin-left:3px"></span></div></div>
  <div id="sRes" class="card" style="left:70px;top:1286px;width:940px;height:214px;border-radius:24px">
    ${[0, 1, 2].map(i => `<div class="abs" style="left:34px;top:${28 + i * 64}px;width:${[560, 470, 520][i]}px;height:20px;border-radius:6px;background:${i ? '#efede6' : '#d9d8f6'}"></div>
      <div class="abs" style="right:34px;top:${24 + i * 64}px;font-size:22px;font-weight:700;color:${i ? '#b9b6ac' : 'var(--roxoF)'}">${i + 1}º</div>`).join('')}</div>`;
const S = { lbl: $('#sLbl'), bar: $('#sBar'), t: $('#sT'), c: $('#sC'), res: $('#sRes') };
const TY1 = [4.40, 5.45], TY2 = [5.75, 6.85];
for (let k = 0; k < Q1.length; k += 2) sfx(lerp(TY1[0], TY1[1], k / Q1.length), 'key', .5);
for (let k = 0; k < Q2.length; k += 2) sfx(lerp(TY2[0], TY2[1], k / Q2.length), 'key', .5);
function paintSearch(t) {
  const on = t >= 3.88 && t < 7.08;
  $('#search').style.display = on ? '' : 'none';
  if (!on) return 0;
  const a = P(t, 3.9, 4.25, E.o3), out = P(t, 6.95, 7.08, E.i2);
  S.lbl.style.opacity = (a * (1 - out)).toFixed(3);
  S.bar.style.transform = `translateY(${(lerp(60, 0, a) + lerp(0, 60, out)).toFixed(1)}px)`; S.bar.style.opacity = (Math.min(1, a * 1.5) * (1 - out)).toFixed(3);
  let txt = '';
  if (t < TY1[1] + .1) txt = Q1.slice(0, Math.round(Q1.length * P(t, TY1[0], TY1[1], E.lin)));
  else if (t < TY2[0]) txt = Q1.slice(0, Math.round(Q1.length * (1 - P(t, TY1[1] + .1, TY2[0] - .02, E.lin))));
  else txt = Q2.slice(0, Math.round(Q2.length * P(t, TY2[0], TY2[1], E.lin)));
  S.t.textContent = txt;
  S.c.style.opacity = Math.floor(t * 3) % 2 === 0 || (t > TY1[0] && t < TY2[1]) ? '1' : '0';
  const r = P(t, 4.9, 5.2, E.o3);
  S.res.style.transform = `translateY(${(lerp(40, 0, r) + lerp(0, 60, out)).toFixed(1)}px)`; S.res.style.opacity = (r * (1 - out)).toFixed(3);
  return 1;
}

/* ---------------- bloco PRO (M13 adaptado): corte roxo de tela cheia 21,36–24,12 ---------------- */
$('#pro').innerHTML = `
  <div class="abs" style="inset:0;background-image:radial-gradient(rgba(255,255,255,.16) 1.4px,transparent 1.5px);background-size:30px 30px"></div>
  <div id="pAg" class="pill" style="left:90px;top:620px;padding:14px 26px;font-size:34px;background:rgba(255,255,255,.16);color:#fff">Agência Ínsula</div>
  <div id="pPl" class="abs" style="left:84px;top:710px;font-size:120px;font-weight:800;letter-spacing:-.04em">Plano</div>
  <div id="pPro" class="abs" style="left:66px;top:800px;font-size:400px;font-weight:800;letter-spacing:-.06em;line-height:1">PRO</div>
  <div id="pRes" class="abs" style="left:90px;top:1250px;font-size:56px;font-weight:700;color:var(--roxoS)">resolve duas pontas:</div>
  <div id="pA" class="pill" style="left:90px;top:1340px;padding:22px 34px;font-size:46px;background:#fff;color:var(--roxoF)">1 · ser encontrado</div>
  <div id="pB" class="pill" style="left:90px;top:1450px;padding:22px 34px;font-size:46px;background:var(--tinta);color:#fff">2 · medir o que funciona</div>`;
const PRO = { a: 21.36, b: 24.12 };
const PE = { ag: $('#pAg'), pl: $('#pPl'), pro: $('#pPro'), res: $('#pRes'), A: $('#pA'), B: $('#pB') };
sfx(PRO.a, 'thud', .9); sfx(23.26, 'pop', .6); sfx(23.54, 'pop', .6);
function rise(el, t, t0, d = 50) { const a = P(t, t0, t0 + .3, E.oBack); el.style.transform = `translateY(${lerp(d, 0, a).toFixed(1)}px)`; el.style.opacity = Math.min(1, P(t, t0, t0 + .12, E.lin)).toFixed(3); }
function paintPro(t) {
  const on = t >= PRO.a && t < PRO.b;
  $('#pro').style.opacity = on ? '1' : '0';
  if (!on) return 0;
  rise(PE.pl, t, 21.38); rise(PE.ag, t, 22.16);
  const k = P(t, 21.60, 21.95, E.oExpo);
  PE.pro.style.transform = `scale(${lerp(1.25, 1, k).toFixed(4)})`; PE.pro.style.transformOrigin = '0 70%'; PE.pro.style.opacity = P(t, 21.58, 21.66, E.lin).toFixed(3);
  rise(PE.res, t, 22.82); rise(PE.A, t, 23.26); rise(PE.B, t, 23.54);
  return 1;
}

/* ---------------- integrações (M17 adaptado) 29,50–33,02 ---------------- */
$('#integ').innerHTML = `
  <svg id="iSvg" class="abs" style="left:0;top:0" width="1080" height="1920">
    <line id="iL1" x1="390" y1="1320" x2="300" y2="1320" stroke="#fff" stroke-width="5" stroke-dasharray="14 10"/>
    <line id="iL2" x1="690" y1="1320" x2="780" y2="1320" stroke="#fff" stroke-width="5" stroke-dasharray="14 10"/></svg>
  <div id="iSite" class="card" style="left:390px;top:1190px;width:300px;height:260px">
    <div class="abs" style="left:0;right:0;top:0;height:38px;background:#f3f1ea"></div>
    <div class="abs" style="left:24px;top:62px;width:170px;height:22px;border-radius:6px;background:#d9d8f6"></div>
    <div class="abs" style="left:24px;top:98px;width:230px;height:14px;border-radius:5px;background:#efede6"></div>
    <div class="abs" style="left:24px;top:122px;width:200px;height:14px;border-radius:5px;background:#efede6"></div>
    <div class="abs" style="left:24px;top:164px;width:130px;height:40px;border-radius:20px;background:var(--roxo)"></div>
    <div class="abs" style="left:0;right:0;bottom:16px;text-align:center;font-size:26px;font-weight:800">Seu site</div></div>
  <div id="iWa" class="abs" style="left:90px;top:1220px;width:210px;text-align:center">
    <div style="width:150px;height:150px;margin:0 auto;border-radius:44px;background:var(--wa);display:flex;align-items:center;justify-content:center;box-shadow:0 24px 50px -20px rgba(0,0,0,.7)">
      <svg width="86" height="86" viewBox="0 0 40 40"><path d="M20 6a14 14 0 0 0-12 21l-2 7 7-2A14 14 0 1 0 20 6z" fill="#fff"/><path d="M15 14c1 4 4 8 9 10l2-2-3-2-1 1c-2-1-3-2-4-4l1-1-2-3z" fill="#25a85a"/></svg></div>
    <div style="margin-top:16px;font-size:34px;font-weight:800">WhatsApp</div></div>
  <div id="iCrm" class="abs" style="left:780px;top:1220px;width:210px;text-align:center">
    <div style="width:150px;height:150px;margin:0 auto;border-radius:44px;background:var(--roxoF);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;box-shadow:0 24px 50px -20px rgba(0,0,0,.7)">
      <i style="width:88px;height:16px;border-radius:5px;background:#fff;display:block"></i><i style="width:64px;height:16px;border-radius:5px;background:#fff;opacity:.8;display:block"></i><i style="width:40px;height:16px;border-radius:5px;background:#fff;opacity:.6;display:block"></i></div>
    <div style="margin-top:16px;font-size:34px;font-weight:800">CRM</div></div>`;
const IN = { site: $('#iSite'), wa: $('#iWa'), crm: $('#iCrm'), L1: $('#iL1'), L2: $('#iL2') };
sfx(29.90, 'pop', .6); sfx(31.36, 'click', .8); sfx(32.48, 'click', .8);
function paintInteg(t) {
  const on = t >= 29.48 && t < 33.04;
  $('#integ').style.display = on ? '' : 'none';
  if (!on) return 0;
  const out = P(t, 32.9, 33.04, E.i2), o = (1 - out).toFixed(3);
  $('#integ').style.opacity = o;
  rise(IN.site, t, 29.9, 70);
  const pop = (el, t0) => { const a = P(t, t0, t0 + .35, E.oBack); el.style.transform = `scale(${a.toFixed(4)})`; el.style.opacity = Math.min(1, a * 2).toFixed(3); };
  pop(IN.wa, 31.36); pop(IN.crm, 32.48);
  const l1 = P(t, 31.2, 31.45, E.o3), l2 = P(t, 32.3, 32.55, E.o3);
  IN.L1.setAttribute('x2', lerp(390, 300, l1)); IN.L1.style.opacity = l1 > 0 ? 1 : 0;
  IN.L2.setAttribute('x2', lerp(690, 780, l2)); IN.L2.style.opacity = l2 > 0 ? 1 : 0;
  IN.L1.setAttribute('stroke-dashoffset', (-t * 60).toFixed(1)); IN.L2.setAttribute('stroke-dashoffset', (t * 60).toFixed(1));
  return 1;
}

/* ---------------- celular com site confuso (M11 adaptado) 7,04–9,02 ---------------- */
$('#phone').innerHTML = `
  <div id="phF" class="abs" style="left:330px;top:900px;width:420px;height:640px;border-radius:52px;background:#16151b;box-shadow:0 40px 80px -24px rgba(0,0,0,.8);padding:16px">
    <div class="abs" style="left:16px;top:16px;right:16px;bottom:16px;border-radius:38px;background:#fff;overflow:hidden">
      <div id="phS" class="abs" style="left:0;top:0;width:388px">
        <div style="height:70px;background:#ddd9cf"></div>
        ${Array.from({ length: 14 }, (_, i) => { const r = mulberry32(i + 7); return `<div style="margin:16px 20px;height:${40 + Math.floor(r() * 70)}px;border-radius:8px;background:${['#ece9e1', '#d9d6cc', '#f2efe7', '#c9c5ba'][i % 4]}"></div>`; }).join('')}
      </div>
      <div class="abs" style="left:24px;right:24px;top:20px;height:44px;border-radius:22px;background:rgba(255,255,255,.92);box-shadow:0 2px 10px rgba(0,0,0,.15);display:flex;align-items:center;padding:0 16px;font-size:18px;color:#7c7a73;gap:8px">
        <svg width="20" height="20" viewBox="0 0 40 40"><circle cx="17" cy="17" r="11" fill="none" stroke="#7c7a73" stroke-width="4.5"/><line x1="25.5" y1="25.5" x2="35" y2="35" stroke="#7c7a73" stroke-width="5.5" stroke-linecap="round"/></svg>telefone? endereço?</div>
    </div>
  </div>`;
const PH = { f: $('#phF'), s: $('#phS') };
sfx(7.10, 'pop', .5);
function paintPhone(t) {
  const on = t >= 7.04 && t < 9.04;
  $('#phone').style.display = on ? '' : 'none';
  if (!on) return 0;
  const a = P(t, 7.04, 7.4, E.o3), out = P(t, 8.9, 9.04, E.i2);
  PH.f.style.transform = `translateY(${(lerp(120, 0, a) + lerp(0, 140, out)).toFixed(1)}px) rotate(${lerp(4, -2, a).toFixed(2)}deg)`;
  PH.f.style.opacity = (Math.min(1, a * 1.6) * (1 - out)).toFixed(3);
  // rola aos trancos, procurando
  const sc = 220 * E.io3(P(t, 7.4, 7.9, E.lin)) + 260 * E.io3(P(t, 8.05, 8.45, E.lin)) - 120 * E.io3(P(t, 8.5, 8.8, E.lin));
  PH.s.style.transform = `translateY(${-sc.toFixed(1)}px)`;
  return 1;
}

/* ---------------- lista de resultados: o seu site sai, o próximo ganha (M27 adaptado) 9,04–11,34 ---------------- */
const RES = [['Seu consultório', 'seusite.com.br'], ['Clínica Sorriso', 'clinicasorriso.com.br'], ['Odonto Pinheiros', 'odontopinheiros.com.br']];
$('#list').innerHTML = `
  <div id="lC" class="card" style="left:70px;top:1000px;width:940px;height:500px;border-radius:28px">
    ${RES.map(([n, u], i) => `<div class="abs lr" style="left:28px;right:28px;top:${28 + i * 152}px;height:136px;border-radius:18px;background:#f6f4ee;padding:22px 26px">
      <div style="font-size:20px;color:var(--apag)">${u}</div><div style="font-size:34px;font-weight:700;color:#3f3ea0;margin-top:4px">${n}</div>
      ${i === 0 ? '<div class="pill lx" style="right:22px;top:40px;padding:10px 18px;font-size:22px;background:var(--tinta);color:#fff">✕ fechou em 3 s</div>' : ''}</div>`).join('')}
  </div>
  <svg id="lCur" class="abs" style="left:0;top:0;transform-origin:0 0" width="70" height="70" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#1f1e1d" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const LS = { c: $('#lC'), rows: [...document.querySelectorAll('#list .lr')], x: $('#list .lx'), cur: $('#lCur') };
const LCLICK = 10.62;
sfx(9.10, 'pop', .5); sfx(9.78, 'thud', .7); sfx(LCLICK, 'click', .9);
function paintList(t) {
  const on = t >= 9.04 && t < 11.36;
  $('#list').style.display = on ? '' : 'none';
  if (!on) return 0;
  const a = P(t, 9.04, 9.4, E.o3), out = P(t, 11.22, 11.36, E.i2);
  LS.c.style.transform = `translateY(${(lerp(100, 0, a) + lerp(0, 140, out)).toFixed(1)}px)`; LS.c.style.opacity = (Math.min(1, a * 1.6) * (1 - out)).toFixed(3);
  const gone = P(t, 9.78, 10.1, E.o3);
  LS.rows[0].style.opacity = lerp(1, .32, gone).toFixed(3);
  const xa = P(t, 9.78, 10.05, E.oBack); LS.x.style.transform = `scale(${xa.toFixed(4)})`; LS.x.style.opacity = Math.min(1, xa * 2).toFixed(3);
  const pick = t >= LCLICK;
  LS.rows[1].style.background = pick ? 'var(--roxoS)' : '#f6f4ee';
  LS.rows[1].style.boxShadow = pick ? 'inset 0 0 0 3px #8f8fdd' : 'none';
  const c = P(t, 10.1, LCLICK - .04, E.io3), press = t >= LCLICK && t < LCLICK + .14;
  LS.cur.style.transform = `translate(${lerp(980, 760, c).toFixed(1)}px,${lerp(1560, 1280, c).toFixed(1)}px) scale(${press ? .88 : 1})`;
  LS.cur.style.opacity = (P(t, 10.05, 10.2, E.lin) * (1 - out)).toFixed(3);
  return 1;
}

/* ---------------- editor do Build: arrastar e encaixar pixel a pixel (M14 adaptado) 42,48–46,86 ---------------- */
$('#editor').innerHTML = `
  <div id="eC" class="card" style="left:70px;top:960px;width:940px;height:560px;border-radius:28px;background:#faf9f5">
    <div class="abs" style="left:0;right:0;top:0;height:56px;background:#fff;border-bottom:1px solid var(--borda);display:flex;align-items:center;gap:12px;padding:0 22px;font-size:20px;font-weight:700;color:var(--roxoF)">
      <i style="width:28px;height:28px;border-radius:50%;background:var(--roxo);display:block"></i>insula build <span style="margin-left:auto;font-weight:500;color:var(--apag)">draanalima.com.br</span></div>
    <div class="abs" style="left:40px;top:96px;width:470px;font-size:44px;font-weight:800;line-height:1.05;color:var(--tinta)">Dentista em Pinheiros</div>
    <div class="abs" style="left:40px;top:208px;width:430px;height:16px;border-radius:5px;background:#e6e3da"></div>
    <div class="abs" style="left:40px;top:236px;width:380px;height:16px;border-radius:5px;background:#e6e3da"></div>
    <div class="abs" style="left:560px;top:90px;width:340px;height:300px;border-radius:170px 170px 18px 18px;background:#f3dccd"></div>
    <div id="eSlot" class="abs" style="left:40px;top:300px;width:330px;height:76px;border-radius:38px;border:3px dashed var(--roxoC)"></div>
    <div id="eGv" class="abs" style="left:40px;top:70px;width:0;height:480px;border-left:2px dashed var(--roxo)"></div>
    <div id="eGh" class="abs" style="left:0;top:300px;width:940px;height:0;border-top:2px dashed var(--roxo)"></div>
    <div id="eBtn" class="pill" style="left:40px;top:300px;width:330px;height:76px;justify-content:center;font-size:28px;background:var(--roxo);color:#fff">Agende sua consulta</div>
    <div id="eSel" class="abs" style="left:34px;top:294px;width:342px;height:88px;border:2px solid var(--roxoF);border-radius:6px"></div>
    <div id="eChip" class="pill" style="left:40px;top:400px;padding:8px 14px;font-size:20px;background:var(--roxoF);color:#fff;font-variant-numeric:tabular-nums"></div>
  </div>
  <svg id="eCur" class="abs" style="left:0;top:0;transform-origin:0 0" width="70" height="70" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#1f1e1d" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const ED = { c: $('#eC'), btn: $('#eBtn'), sel: $('#eSel'), chip: $('#eChip'), gv: $('#eGv'), gh: $('#eGh'), slot: $('#eSlot'), cur: $('#eCur') };
const EGRAB = 43.2, ESNAP = 44.25;
sfx(42.6, 'pop', .5); sfx(EGRAB, 'click', .7); sfx(ESNAP, 'tick', 1);
function paintEditor(t) {
  const on = t >= 42.48 && t < 46.88;
  $('#editor').style.display = on ? '' : 'none';
  if (!on) return 0;
  const a = P(t, 42.48, 42.85, E.o3), out = P(t, 46.74, 46.88, E.i2);
  ED.c.style.transform = `translateY(${(lerp(110, 0, a) + lerp(0, 140, out)).toFixed(1)}px)`; ED.c.style.opacity = (Math.min(1, a * 1.6) * (1 - out)).toFixed(3);
  const d = E.oBack(clamp((t - EGRAB) / (ESNAP - EGRAB))), dx = lerp(420, 0, d), dy = lerp(150, 0, d);
  ED.btn.style.transform = ED.sel.style.transform = ED.chip.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;
  ED.chip.textContent = `X ${Math.round(40 + dx)} · Y ${Math.round(300 + dy)}`;
  const snapped = t >= ESNAP;
  ED.gv.style.opacity = ED.gh.style.opacity = (t >= ESNAP - .15 && t < ESNAP + .6 ? 1 : 0).toString();
  ED.slot.style.opacity = snapped ? '0' : '1';
  ED.sel.style.opacity = (t >= EGRAB - .1 ? 1 : 0).toString();
  ED.chip.style.opacity = (t >= EGRAB && t < ESNAP + .9 ? 1 : 0).toString();
  const press = t >= EGRAB && t < ESNAP;
  const ca = P(t, 42.7, EGRAB, E.io3);
  const cx = 70 + 40 + 300 + dx + lerp(260, 0, ca), cy = 960 + 300 + 40 + dy + lerp(180, 0, ca);
  ED.cur.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) scale(${press ? .9 : 1})`;
  ED.cur.style.opacity = (P(t, 42.7, 42.9, E.lin) * (1 - P(t, ESNAP + .5, ESNAP + .8, E.lin)) * (1 - out)).toFixed(3);
  return 1;
}

/* ---------------- CTA de oferta (M18 adaptado) 48,92–fim ---------------- */
$('#cta').innerHTML = `
  <div id="cCard" class="card" style="left:70px;top:1010px;width:940px;height:500px;border-radius:30px">
    <div id="cTag" class="pill" style="left:40px;top:40px;padding:12px 22px;font-size:26px;background:var(--roxoS);color:var(--roxoF)">★ O plano mais escolhido</div>
    <div class="abs" style="left:44px;top:118px;font-size:34px;font-weight:700;color:var(--tintaS)">Plano PRO · Agência Ínsula</div>
    <div id="cPr" class="abs" style="left:38px;top:168px;font-size:150px;font-weight:800;letter-spacing:-.05em;line-height:1;font-variant-numeric:tabular-nums"></div>
    <div id="cUn" class="abs" style="left:46px;top:330px;font-size:34px;font-weight:600;color:var(--apag)">pagamento único</div>
    <div id="cBtn" class="pill" style="left:40px;top:396px;width:860px;height:76px;justify-content:center;font-size:36px;background:var(--roxo);color:#fff">Saiba mais →</div></div>
  <svg id="cCur" class="abs" style="left:0;top:0;transform-origin:0 0" width="70" height="70" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#1f1e1d" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const CT = { card: $('#cCard'), tag: $('#cTag'), pr: $('#cPr'), un: $('#cUn'), btn: $('#cBtn'), cur: $('#cCur') };
const CLICK = 53.62;
sfx(49.12, 'pop', .6); sfx(49.34, 'pop', .5); sfx(50.5, 'ding', .6); sfx(51.94, 'pop', .4); sfx(52.84, 'pop', .6); sfx(CLICK, 'click', 1);
function paintCta(t) {
  const on = t >= 48.92;
  $('#cta').style.display = on ? '' : 'none';
  if (!on) return 0;
  rise(CT.card, t, 49.0, 120);
  const tg = P(t, 49.34, 49.66, E.oBack); CT.tag.style.transform = `scale(${tg.toFixed(4)})`; CT.tag.style.transformOrigin = '0 50%'; CT.tag.style.opacity = Math.min(1, tg * 2).toFixed(3);
  const pv = Math.round(1897 * P(t, 49.55, 50.5, E.o3));
  CT.pr.textContent = 'R$ ' + pv.toLocaleString('pt-BR');
  CT.pr.style.opacity = P(t, 49.5, 49.6, E.lin).toFixed(3);
  CT.pr.style.color = t >= 50.5 ? 'var(--roxoF)' : 'var(--tinta)';
  rise(CT.un, t, 51.94, 30);
  const b = P(t, 52.84, 53.2, E.oBack), press = t >= CLICK && t < CLICK + .14;
  CT.btn.style.transform = `scale(${(Math.min(1, b) * (press ? .96 : 1)).toFixed(4)})`; CT.btn.style.transformOrigin = '50% 50%'; CT.btn.style.opacity = Math.min(1, b * 2).toFixed(3);
  CT.btn.style.background = t >= CLICK && t < CLICK + .3 ? 'var(--roxoF)' : 'var(--roxo)';
  const c = P(t, 53.05, CLICK - .05, E.io3);
  CT.cur.style.transform = `translate(${lerp(1000, 640, c).toFixed(1)}px,${lerp(1750, 1440, c).toFixed(1)}px) scale(${press ? .88 : 1})`;
  CT.cur.style.opacity = P(t, 53.0, 53.15, E.lin).toFixed(3);
  return 1;
}

/* ---------------- quadro ---------------- */
function paint(t) {
  const fi = Math.min(NFR - 1, Math.floor(t * SRC_FPS + 1e-6));
  setImg($('#vid'), `assets/src/${pad(fi + 1)}.jpg`);
  $('#rig').style.transform = `scale(${zoomAt(t).toFixed(4)})`;
  // escuro: o vídeo apaga enquanto ele diz "no escuro"
  $('#dim').style.opacity = (P(t, 19.6, 20.8, E.io3) * (t < 21.36 ? 1 : 0)).toFixed(3);
  // overlays da biblioteca
  const ov = $('#ov'); let shown = false;
  for (const o of OV) {
    const k = Math.floor((t - o.t0) * SRC_FPS + 1e-6);
    if (k >= 0 && k < o.n) { setImg(ov, `assets/ov/${o.dir}/${pad(k)}.png`); shown = true; break; }
  }
  ov.style.display = shown ? '' : 'none';
  const k = paintKW(t), s = paintSearch(t), i = paintInteg(t), ph = paintPhone(t), l = paintList(t), e = paintEditor(t);
  paintPro(t); paintCta(t);
  $('#shade').style.opacity = s || i || ph || l || e ? '1' : '0';   // embaixo, atrás dos cartões do peito
  $('#shadeT').style.opacity = k ? '1' : '0';                        // em cima, atrás dos títulos
}

/* ---------------- camadas para o After (?layer=base|ovl|kw|ui) ---------------- */
const LAYER = new URLSearchParams(location.search).get('layer');
const LAYERS = { base: ['rig', 'dim'], ovl: ['shade', 'shadeT', 'ov'], kw: ['kw'], ui: ['search', 'pro', 'integ', 'phone', 'list', 'editor', 'cta'] };
if (LAYERS[LAYER]) {
  [...$('#stage').children].forEach(el => { if (!LAYERS[LAYER].includes(el.id)) el.style.visibility = 'hidden'; });
  if (LAYER !== 'base') document.documentElement.style.background = document.body.style.background = 'transparent';
}

window.DURATION = DURATION; window.FPS = SRC_FPS; window.SFX = SFX;
window.KW_SPEC = () => KWEL.map(k => ({ a: k.blk.a, b: k.blk.b, strike: k.blk.strike || 0,
  lines: k.lines.map(ln => ({ top: ln.top, fs: parseFloat(ln.el.style.fontSize), text: ln.ws.map(w => w.s.textContent).join(' '),
    words: ln.ws.map(w => ({ txt: w.s.textContent, t: w.t, acc: w.s.classList.contains('acc') })) })) }));
window.seek = async t => { pending = []; paint(t); await Promise.all(pending); };
window.__ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['800 40px Inter', '700 40px Inter', '600 40px Inter'].map(f => document.fonts.load(f)));
  layoutKW();
  await window.seek(0);
})();
})();
