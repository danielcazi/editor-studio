/* I014 Medidor Speed 99/100 — "Nos casos medidos pela plataforma Speed chegamos a 99 de 100" (0:14).
   Anel que enche de 0 à nota e fica verde. Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. */
(() => {
'use strict';
const q = new URLSearchParams(location.search);
const PR = { ...window.PARAMS, ...(q.get('p') ? JSON.parse(decodeURIComponent(escape(atob(q.get('p').replace(/-/g, '+').replace(/_/g, '/'))))) : {}) };
if (q.get('look')) PR.look = q.get('look');
if (q.has('nobg')) PR.bg = null;
const st = document.getElementById('stage');
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = { lin: p => p, o3: p => 1 - (1 - p) ** 3, oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2 };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
const SFX = [];
const TM = PR.timing, GREEN = '#2fbf6b', RED = '#e0523a';
const BG = PR.bg ? `<div id="bgv" style="background-image:url('${PR.bg}')"></div>` : '';
const tone = v => v >= 90 ? GREEN : v >= 50 ? '#f0a23a' : RED;
/* anel SVG: raio r, espessura s, valor v (0-100) */
const ring = (id, size, s, track) => { const r = (size - s) / 2, c = 2 * Math.PI * r;
  return `<svg class="abs" id="${id}" width="${size}" height="${size}" style="left:0;top:0;transform:rotate(-90deg)"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${s}"/>
  <circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${s}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-c="${c}"/></svg>`; };
const setRing = (root, v, tt) => { const a = root.querySelector('.arc'), c = +a.dataset.c; a.style.strokeDashoffset = (c * (1 - v / 100)).toFixed(1); a.style.stroke = tone(tt); };

const LOOKS = {
  /* A — Medidor no peito: título no topo, cartão creme com anel verde sobre o vídeo */
  A() {
    if (!PR.bg) { document.documentElement.style.background = document.body.style.background = 'transparent'; st.style.background = 'transparent'; }
    else st.style.background = '#000';
    st.innerHTML = `${BG}
      <div id="shade" class="abs" style="left:0;right:0;top:760px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.5) 35%)"></div>
      <div id="tt" class="abs h" style="left:80px;top:250px;font-size:112px;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.45)"><span style="background:var(--roxoF);padding:0 22px 14px;border-radius:20px">Speed</span>\nsubiu.</div>
      <div id="cd" class="abs card" style="left:140px;top:1020px;width:800px;height:480px;border-radius:36px">
        <div class="abs" style="left:50px;top:44px;font-size:30px;font-weight:600;color:var(--tintaS)">${PR.label}</div>
        <div id="rg" class="abs" style="left:60px;top:130px;width:300px;height:300px">${ring('r1', 300, 30, 'var(--roxoS)')}
          <div id="nm" class="abs h mono" style="left:0;top:96px;width:300px;text-align:center;font-size:110px;color:var(--tinta)"></div></div>
        <div class="abs h" style="left:400px;top:170px;font-size:84px;color:var(--tinta)">de ${PR.max}\n<span style="color:${GREEN}">no verde</span></div>
        <div class="abs chip" style="left:400px;top:372px;padding:12px 24px;font-size:26px;background:var(--roxoS);color:var(--roxoF)">medido pela plataforma</div></div>`;
    const $ = i => document.getElementById(i), r = $('rg');
    const el = { sh: $('shade'), tt: $('tt'), cd: $('cd'), nm: $('nm') };
    SFX.push({ t: TM.in, type: 'pop' }, { t: TM.fill[1], type: 'click' });
    return t => {
      el.sh.style.opacity = P(t, 0, .3, E.lin).toFixed(3);
      const ti = P(t, TM.in, TM.in + .35, E.oBack);
      el.tt.style.opacity = Math.min(1, ti * 2).toFixed(3); el.tt.style.transform = `translateY(${lerp(-40, 0, ti).toFixed(1)}px)`;
      const ci = P(t, TM.in + .1, TM.in + .5, E.o3);
      el.cd.style.opacity = Math.min(1, ci * 1.6).toFixed(3); el.cd.style.transform = `translateY(${lerp(80, 0, ci).toFixed(1)}px)`;
      const v = PR.score * P(t, TM.fill[0], TM.fill[1], E.o3);
      setRing(r, v, v); el.nm.textContent = Math.round(v);
    };
  },

  /* B — Boletim: fundo noite; anel grande 99 e três anéis menores com as outras notas */
  B() {
    st.style.background = '#141413';
    st.innerHTML = `
      <div class="abs mono" style="left:84px;top:250px;font-size:22px;letter-spacing:.18em;color:var(--roxoC)">${PR.label.toUpperCase()}</div>
      <div class="abs h" style="left:80px;top:300px;font-size:100px;color:#faf9f5">${PR.headline}</div>
      <div id="g0" class="abs" style="left:240px;top:520px;width:600px;height:600px">${ring('r0', 600, 52, '#262523')}
        <div class="abs h mono" style="left:0;top:190px;width:600px;text-align:center;font-size:230px;color:#faf9f5">${PR.score}</div>
        <div class="abs mono" style="left:0;top:430px;width:600px;text-align:center;font-size:40px;color:#8d8a80">/ ${PR.max}</div></div>
      ${PR.extras.map((e, i) => `<div id="g${i + 1}" class="abs" style="left:${80 + i * 320}px;top:1230px;width:260px;height:260px">${ring('r' + (i + 1), 200, 22, '#262523').replace('<svg class="abs"', '<svg class="abs" style="left:30px;top:0;transform:rotate(-90deg)"')}
        <div class="abs h mono" style="left:30px;top:70px;width:200px;text-align:center;font-size:66px;color:#faf9f5">${e.v}</div>
        <div class="abs" style="left:0;top:214px;width:260px;text-align:center;font-size:24px;font-weight:600;color:#cfccc3">${e.n}</div></div>`).join('')}`;
    setRing(document.getElementById('g0'), PR.score, PR.score);
    PR.extras.forEach((e, i) => setRing(document.getElementById('g' + (i + 1)), e.v, e.v));
  },

  /* C — Antes e depois: roxo chapado; dois anéis lado a lado, o de plugins em vermelho e o Insula em verde */
  C() {
    st.style.background = 'var(--roxoF)';
    const one = (id, x, d, c) => `<div id="${id}" class="abs" style="left:${x}px;top:620px;width:420px;height:420px">${ring('r' + id, 420, 44, 'rgba(255,255,255,.18)')}
      <div class="abs h mono" style="left:0;top:130px;width:420px;text-align:center;font-size:${d.v > 99 ? 130 : 160}px;color:#fff">${d.v}</div>
      <div class="abs" style="left:-30px;top:470px;width:480px;text-align:center;font-size:36px;font-weight:600;color:#ecebfa">${d.name}</div></div>`;
    st.innerHTML = `
      <div class="abs h" style="left:80px;top:250px;font-size:120px;color:#fff">Mesma oferta.\nOutra nota.</div>
      ${one('ga', 80, PR.before)}${one('gb', 580, PR.after)}
      <div class="abs h" style="left:80px;top:1230px;font-size:150px;color:#fff">${PR.after.v}<span style="font-size:70px;color:#d9d8f5"> de ${PR.max}</span></div>
      <div class="abs chip" style="left:84px;top:1440px;padding:14px 28px;font-size:30px;background:#fff;color:var(--roxoF)">valores do "antes" ilustrativos</div>`;
    setRing(document.getElementById('ga'), PR.before.v, PR.before.v);
    setRing(document.getElementById('gb'), PR.after.v, PR.after.v);
  },
};

let paint = null;
window.DURATION = PR.duration; window.FPS = PR.fps || 30; window.SFX = SFX;
window.seek = async t => { if (paint) paint(t); };
window.__ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['Inter'].map(f => document.fonts.load(`800 40px "${f}"`)));
  if (PR.bg) await new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = PR.bg; });
  paint = LOOKS[PR.look]() || null;
  if (paint) await window.seek(q.has('t') ? +q.get('t') : PR.duration - .1);
})();
})();
