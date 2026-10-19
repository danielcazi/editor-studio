/* I016 Clique que vira dinheiro perdido — "cada clique custou dinheiro" (0:22).
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
const E = { lin: p => p, o3: p => 1 - (1 - p) ** 3, i2: p => p * p, oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2 };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
const SFX = [];
const TM = PR.timing, $ = i => document.getElementById(i);
const lost = PR.total - PR.arrived;
const title = cor => `<span style="color:${cor}">${PR.headline[0]}</span>\n${PR.headline[1].replace(PR.highlight, `<span style="background:var(--roxoF);padding:0 22px 14px;border-radius:20px;color:#fff">${PR.highlight}</span>`)}`;
const coin = (extra, bg) => `<div class="coin abs" style="${extra};width:100px;height:100px;border-radius:50%;background:${bg};color:#fff;font-weight:800;font-size:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px -10px rgba(0,0,0,.5),inset 0 0 0 6px rgba(255,255,255,.25)">R$</div>`;

const LOOKS = {
  /* A — Moedas que não chegam: fileira de cliques pagos; os que passam caem na página, os outros viram terracota e despencam */
  A() {
    if (!PR.bg) { document.documentElement.style.background = document.body.style.background = 'transparent'; st.style.background = 'transparent'; }
    else st.style.background = '#000';
    const N = 8, OK = 5, x0 = 90, gap = 124;
    const coins = Array.from({ length: N }, (_, i) => coin(`left:${x0 + i * gap}px;top:760px`, 'var(--roxoF)')).join('');
    st.innerHTML = `${PR.bg ? `<div id="bgv" style="background-image:url('${PR.bg}')"></div>` : ''}
      <div id="shade" class="abs" style="left:0;right:0;top:400px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.6) 30%)"></div>
      <div id="tt" class="abs h" style="left:80px;top:250px;line-height:1.12;font-size:112px;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.45)">${title('#fff')}</div>
      <div class="abs chip" style="left:90px;top:660px;padding:10px 22px;font-size:26px;background:rgba(18,18,17,.82);color:#cfccc3">cliques pagos</div>
      ${coins}
      <div id="pg" class="card" style="left:80px;top:1230px;width:920px;height:240px;border-radius:28px;background:var(--roxoF)">
        <div class="abs" style="left:40px;top:34px;font-size:30px;font-weight:600;color:#d9d8f5">sua página</div>
        <div id="cnt" class="abs h mono" style="left:40px;top:90px;font-size:110px;color:#fff">0</div></div>`;
    const cs = [...st.querySelectorAll('.coin')];
    SFX.push({ t: TM.in, type: 'pop' }, { t: TM.drop[0], type: 'whoosh' });
    return t => {
      $('shade').style.opacity = P(t, 0, .3, E.lin).toFixed(3);
      const ti = P(t, TM.in, TM.in + .35, E.oBack);
      $('tt').style.opacity = Math.min(1, ti * 2).toFixed(3); $('tt').style.transform = `translateY(${lerp(-40, 0, ti).toFixed(1)}px)`;
      $('pg').style.opacity = P(t, TM.in + .1, TM.in + .4, E.lin);
      let arrived = 0;
      cs.forEach((c, i) => {
        const a = P(t, TM.in + .1 + i * .05, TM.in + .5 + i * .05, E.oBack);
        const d = P(t, TM.drop[0] + i * .06, TM.drop[1], E.i2);
        const ok = i < OK;
        if (ok && d > .9) arrived++;
        const dy = ok ? lerp(0, 440, d) : lerp(0, 1000, d);
        c.style.background = !ok && d > .15 ? 'var(--terra)' : 'var(--roxoF)';
        c.style.opacity = Math.min(1, a * 2) * (ok ? (d > .95 ? 0 : 1) : 1 - P(t, TM.drop[0] + .5, TM.drop[1] + .3, E.lin));
        c.style.transform = `translateY(${(dy + lerp(-60, 0, a)).toFixed(1)}px) scale(${lerp(.4, 1, a).toFixed(3)})`;
      });
      $('cnt').textContent = arrived;
    };
  },

  /* B — Cem cliques: grade de 100 pontos; os que chegaram em roxo, os perdidos em terracota pulsando */
  B() {
    st.style.background = '#141413';
    const cols = 10, sz = 54, gp = 18, gx = (1080 - (cols * sz + (cols - 1) * gp)) / 2;
    const dots = Array.from({ length: PR.total }, (_, i) => `<div class="dt abs" style="left:${gx + (i % cols) * (sz + gp)}px;top:${660 + Math.floor(i / cols) * (sz + gp)}px;width:${sz}px;height:${sz}px;border-radius:50%;background:#262523"></div>`).join('');
    st.innerHTML = `<div class="abs mono" style="left:84px;top:250px;font-size:22px;letter-spacing:.18em;color:var(--roxoC)">${PR.total} CLIQUES PAGOS</div>
      <div class="abs h" style="left:80px;top:300px;line-height:1.12;font-size:100px;color:#faf9f5">${title('#faf9f5')}</div>${dots}
      <div id="big" class="abs h" style="left:80px;top:1440px;font-size:130px;color:var(--terra)"></div>
      <div class="abs" style="left:560px;top:1475px;width:440px;font-size:30px;font-weight:500;line-height:1.2;color:#cfccc3">${PR.caption}</div>`;
    const ds = [...st.querySelectorAll('.dt')];
    SFX.push({ t: TM.in, type: 'pop' });
    return t => {
      const k = P(t, TM.in, TM.drop[1], E.lin) * PR.total;
      ds.forEach((d, i) => {
        const on = i < k, bad = i >= PR.arrived;
        d.style.background = !on ? '#262523' : bad ? 'var(--terra)' : 'var(--roxoC)';
        d.style.transform = bad && on ? `scale(${(.85 + .15 * Math.sin(t * 6 + i)).toFixed(3)})` : 'none';
      });
      $('big').textContent = '− ' + Math.round(Math.max(0, k - PR.arrived)) + '%';
    };
  },

  /* C — Extrato riscado: recibo de cliques; as linhas que não chegaram são riscadas em terracota */
  C() {
    st.style.background = 'var(--creme)';
    const rows = Array.from({ length: 8 }, (_, i) => `<div class="rw abs" style="left:40px;right:40px;top:${130 + i * 92}px;height:70px;font-size:32px;font-weight:600;color:var(--tinta)">
      <span class="abs" style="left:0;top:16px">Clique no link ${i + 1}</span><span class="abs mono" style="right:0;top:16px">${PR.price}</span>
      <div class="ln abs" style="left:-10px;top:34px;height:6px;width:0;background:var(--terra);border-radius:3px"></div></div>`).join('');
    st.innerHTML = `<div class="abs h" style="left:80px;top:250px;line-height:1.12;font-size:112px;color:var(--tinta)">${title('var(--tinta)')}</div>
      <div id="rc" class="card" style="left:90px;top:620px;width:900px;height:900px;border-radius:26px">
        <div class="abs mono" style="left:40px;top:42px;font-size:24px;letter-spacing:.14em;color:var(--apag)">EXTRATO DO ANÚNCIO</div>${rows}
        <div class="abs" style="left:40px;right:40px;top:860px;height:2px;background:var(--borda)"></div></div>`;
    const ln = [...st.querySelectorAll('.ln')], rw = [...st.querySelectorAll('.rw')];
    SFX.push({ t: TM.in, type: 'pop' });
    return t => {
      const a = P(t, TM.in, TM.in + .4, E.oBack);
      $('rc').style.opacity = Math.min(1, a * 2); $('rc').style.transform = `translateY(${lerp(60, 0, a).toFixed(1)}px)`;
      ln.forEach((l, i) => {
        const bad = i >= 5, p = bad ? P(t, TM.drop[0] + (i - 5) * .2, TM.drop[0] + (i - 5) * .2 + .3, E.o3) : 0;
        l.style.width = (p * 840) + 'px'; rw[i].style.opacity = bad ? 1 - .5 * p : 1;
      });
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
