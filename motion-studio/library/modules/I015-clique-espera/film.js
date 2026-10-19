/* I015 Clique que espera a página — "O usuário clicou e agora a página precisa abrir rápido" (0:03).
   Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. */
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
const TM = PR.timing, $ = i => document.getElementById(i);
const fmtW = n => n.toFixed(1).replace('.', ',');
const BG = PR.bg ? `<div id="bgv" style="background-image:url('${PR.bg}')"></div>` : '';
const title = (cor) => `<span style="background:var(--roxoF);padding:0 22px 14px;border-radius:20px;color:#fff">${PR.headline[0].replace('.', '')}</span>${'.'}\n<span style="color:${cor}">${PR.headline[1]}</span>`;
const spin = (id, size, cor, bw) => `<div id="${id}" class="abs" style="width:${size}px;height:${size}px;border-radius:50%;border:${bw}px solid ${cor};border-top-color:transparent"></div>`;
const cursor = id => `<svg id="${id}" class="cursor" viewBox="0 0 24 24" style="width:70px;height:70px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))"><path d="M4 2l15 9-6.5 1.8L9.8 19z" fill="#1f1e1d" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const adCard = (x, y, w, h, btnH) => `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:28px">
  <div class="abs" style="left:28px;top:22px;font-size:22px;font-weight:600;color:var(--apag)">Patrocinado</div>
  <div class="abs" style="left:28px;right:28px;top:66px;height:${h - btnH - 130}px;border-radius:18px;background:linear-gradient(135deg,var(--roxoS),var(--pele))"></div>
  <div id="btn" class="btn" style="left:28px;right:28px;bottom:24px;height:${btnH}px;background:var(--roxoF);color:#fff;font-size:${Math.round(btnH * .42)}px;border-radius:16px">${PR.cta}</div></div>`;
let rot = [];

const LOOKS = {
  /* A — Anúncio → página carregando: cartão do anúncio recebe o clique e, embaixo, o navegador gira esperando */
  A() {
    if (!PR.bg) { document.documentElement.style.background = document.body.style.background = 'transparent'; st.style.background = 'transparent'; }
    else st.style.background = '#000';
    st.innerHTML = `${BG}<div id="shade" class="abs" style="left:0;right:0;top:500px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.55) 30%)"></div>
      <div id="tt" class="abs h" style="left:80px;top:250px;font-size:120px;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.45)">${title('#fff')}</div>
      <div id="ad">${adCard(80, 560, 920, 360, 84)}</div>
      ${cursor('cur')}
      <div id="br" class="card" style="left:80px;top:990px;width:920px;height:520px;border-radius:28px">
        <div class="abs" style="left:0;right:0;top:0;height:76px;background:#f1efe8"></div>
        <div class="abs" style="left:28px;top:18px;width:600px;height:40px;border-radius:20px;background:#fff;font-size:22px;line-height:40px;padding-left:18px;color:var(--apag)">${PR.url}</div>
        <div id="pb" class="abs" style="left:0;top:76px;height:6px;background:var(--roxo);width:0"></div>
        <div class="abs" style="left:410px;top:210px">${spin('sp', 100, 'var(--roxoF)', 10)}</div>
        <div class="abs" style="left:0;right:0;top:350px;text-align:center;font-size:30px;font-weight:600;color:var(--apag)">abrindo a página…</div></div>
      <div id="tm" class="chip" style="left:760px;top:1030px;padding:12px 26px;font-size:36px;background:var(--terra);color:#fff;font-variant-numeric:tabular-nums">0,0 s</div>`;
    const sp = $('sp'), cur = $('cur'), btn = $('btn');
    SFX.push({ t: TM.in, type: 'pop' }, { t: TM.click, type: 'click' });
    return t => {
      $('shade').style.opacity = P(t, 0, .3, E.lin).toFixed(3);
      const ti = P(t, TM.in, TM.in + .35, E.oBack);
      $('tt').style.opacity = Math.min(1, ti * 2).toFixed(3); $('tt').style.transform = `translateY(${lerp(-40, 0, ti).toFixed(1)}px)`;
      const ad = P(t, TM.in + .05, TM.in + .45, E.oBack), br = P(t, TM.in + .2, TM.in + .6, E.o3);
      $('ad').style.opacity = Math.min(1, ad * 2); $('ad').style.transform = `scale(${lerp(.9, 1, ad).toFixed(3)})`;
      $('br').style.opacity = Math.min(1, br * 1.6); $('br').style.transform = `translateY(${lerp(70, 0, br).toFixed(1)}px)`;
      const c = P(t, TM.in, TM.click, E.o3);
      cur.style.left = lerp(900, 640, c) + 'px'; cur.style.top = lerp(1100, 800, c) + 'px';
      cur.style.opacity = Math.min(1, c * 3);
      btn.style.transform = `scale(${1 - .06 * Math.sin(P(t, TM.click, TM.click + .25, E.lin) * Math.PI)})`;
      const l = P(t, TM.load[0], TM.load[1], E.lin);
      sp.style.transform = `rotate(${(t * 420).toFixed(1)}deg)`; $('pb').style.width = (l * 38).toFixed(1) + '%';
      $('tm').textContent = fmtW(PR.wait * l) + ' s';
    };
  },

  /* B — Cronômetro no escuro: tempo de espera gigante com anel que fecha devagar */
  B() {
    st.style.background = '#141413';
    const R = 330, CIRC = 2 * Math.PI * R;
    st.innerHTML = `<div class="abs mono" style="left:84px;top:250px;font-size:22px;letter-spacing:.18em;color:var(--roxoC)">CLIQUE PAGO · PÁGINA CARREGANDO</div>
      <div class="abs h" style="left:80px;top:300px;font-size:104px;color:#faf9f5">${title('#faf9f5')}</div>
      <svg class="abs" style="left:150px;top:640px" width="780" height="780" viewBox="0 0 780 780"><circle cx="390" cy="390" r="${R}" fill="none" stroke="#262523" stroke-width="26"/>
        <circle id="ring" cx="390" cy="390" r="${R}" fill="none" stroke="var(--terra)" stroke-width="26" stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}" transform="rotate(-90 390 390)"/></svg>
      <div id="num" class="abs h mono" style="left:150px;width:780px;top:920px;text-align:center;font-size:230px;color:#faf9f5">0,0 s</div>
      <div id="dots" class="abs" style="left:150px;width:780px;top:1190px;text-align:center;font-size:34px;font-weight:600;color:#cfccc3">esperando<span id="d"></span></div>
      <div class="abs chip" style="left:84px;top:1470px;padding:14px 28px;font-size:34px;background:var(--terra);color:#fff;border-radius:999px">${PR.caption}</div>`;
    const ring = $('ring');
    SFX.push({ t: TM.in, type: 'pop' });
    return t => {
      const l = P(t, TM.load[0], TM.load[1], E.lin);
      ring.style.strokeDashoffset = (CIRC * (1 - l * .86)).toFixed(1);
      $('num').textContent = fmtW(PR.wait * l) + ' s';
      $('d').textContent = '.'.repeat(Math.floor(t * 3) % 4);
    };
  },

  /* C — Duas telas: celular com o anúncio clicado, seta e celular vazio girando */
  C() {
    st.style.background = 'var(--creme)';
    const phone = (x, inner) => `<div class="card" style="left:${x}px;top:620px;width:400px;height:700px;border-radius:52px;box-shadow:0 30px 80px -30px rgba(31,30,29,.45),0 0 0 8px #1f1e1d">${inner}</div>`;
    st.innerHTML = `<div class="abs h" style="left:80px;top:250px;font-size:112px;color:var(--tinta)">${title('var(--roxoF)')}</div>
      <div id="p1">${phone(80, `<div class="abs" style="left:24px;top:60px;font-size:22px;font-weight:600;color:var(--apag)">Patrocinado</div>
        <div class="abs" style="left:24px;right:24px;top:100px;height:300px;border-radius:20px;background:linear-gradient(135deg,var(--roxoS),var(--pele))"></div>
        <div id="btn" class="btn" style="left:24px;right:24px;top:440px;height:80px;background:var(--roxoF);color:#fff;font-size:30px;border-radius:16px">${PR.cta}</div>`)}</div>
      <svg id="ar" class="abs" style="left:490px;top:900px" width="100" height="80" viewBox="0 0 100 80"><path d="M6 40h80M58 12l30 28-30 28" fill="none" stroke="var(--roxoF)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div id="p2">${phone(600, `<div class="abs" style="left:150px;top:260px">${spin('sp', 100, 'var(--roxoF)', 10)}</div>
        <div id="tm" class="abs h mono" style="left:0;right:0;top:420px;text-align:center;font-size:84px;color:var(--terra)">0,0 s</div>`)}</div>
      <div class="abs" style="left:80px;top:1370px;width:400px;text-align:center;font-size:34px;font-weight:600;color:var(--tintaS)">clicou</div>
      <div class="abs" style="left:600px;top:1370px;width:400px;text-align:center;font-size:34px;font-weight:600;color:var(--tintaS)">esperando</div>
      <div class="abs chip" style="left:84px;top:1460px;padding:14px 28px;font-size:34px;background:var(--roxoF);color:#fff">${PR.caption}</div>`;
    SFX.push({ t: TM.in, type: 'pop' }, { t: TM.click, type: 'click' });
    return t => {
      const a = P(t, TM.in, TM.in + .4, E.oBack), b = P(t, TM.click, TM.click + .4, E.oBack);
      $('p1').style.opacity = Math.min(1, a * 2); $('p1').style.transform = `translateY(${lerp(60, 0, a).toFixed(1)}px)`;
      $('btn').style.transform = `scale(${1 - .06 * Math.sin(P(t, TM.click - .1, TM.click + .15, E.lin) * Math.PI)})`;
      $('ar').style.opacity = P(t, TM.click, TM.click + .2, E.lin);
      $('p2').style.opacity = Math.min(1, b * 2); $('p2').style.transform = `translateY(${lerp(60, 0, b).toFixed(1)}px)`;
      $('sp').style.transform = `rotate(${(t * 420).toFixed(1)}deg)`;
      $('tm').textContent = fmtW(PR.wait * P(t, TM.load[0], TM.load[1], E.lin)) + ' s';
    };
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
