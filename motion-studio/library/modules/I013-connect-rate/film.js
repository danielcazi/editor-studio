/* I013 Connect rate no Gerenciador — "Como está o connect rate da sua página?" (0:00).
   Cliques no link → visualizações da página → connect rate. Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. */
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
const C = PR.clicks.value, V = PR.views.value, RATE = V / C * 100;
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const fmtRate = n => n.toFixed(1).replace('.', ',');
const BG = PR.bg ? `<div id="bgv" style="background-image:url('${PR.bg}')"></div>` : '';
const TM = PR.timing;

const LOOKS = {
  /* A — Tabela no peito: título no topo, linhas do Gerenciador sobre o vídeo; a última linha (connect rate) acende em roxo */
  A() {
    if (!PR.bg) { document.documentElement.style.background = document.body.style.background = 'transparent'; st.style.background = 'transparent'; }
    else st.style.background = '#000';
    const row = (y, label, id, strong) => `<div class="rw abs" style="left:80px;top:${y}px;width:920px;height:${strong ? 190 : 150}px;border-radius:24px;background:${strong ? 'var(--roxoF)' : 'rgba(250,249,245,.96)'};box-shadow:0 24px 60px -24px rgba(31,30,29,.55)">
      <div class="abs" style="left:40px;top:${strong ? 36 : 28}px;font-size:${strong ? 30 : 28}px;font-weight:600;color:${strong ? '#d9d8f5' : 'var(--tintaS)'}">${label}</div>
      <div class="abs" style="left:40px;top:${strong ? 82 : 70}px;font-size:20px;color:${strong ? '#bdbcec' : 'var(--apag)'}">Últimos 7 dias</div>
      <div id="${id}" class="abs h mono" style="right:44px;top:${strong ? 40 : 36}px;font-size:${strong ? 120 : 84}px;color:${strong ? '#fff' : 'var(--tinta)'}"></div></div>`;
    st.innerHTML = `${BG}
      <div id="shade" class="abs" style="left:0;right:0;top:760px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.5) 35%)"></div>
      <div id="tt" class="abs h" style="left:80px;top:250px;font-size:104px;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.45)"><span style="background:var(--roxoF);padding:0 22px 14px;border-radius:20px">${PR.title.split(' ')[0]}</span>\n${PR.title.split(' ').slice(1).join(' ')}</div>
      <div id="pn" class="abs chip" style="left:80px;top:1000px;padding:12px 24px;font-size:24px;background:rgba(18,18,17,.82);color:#cfccc3">${PR.panel}</div>
      ${row(1068, PR.clicks.label, 'n1')}${row(1240, PR.views.label, 'n2')}${row(1412, PR.rate.label, 'n3', true)}`;
    const $ = i => document.getElementById(i), rows = [...st.querySelectorAll('.rw')];
    const el = { sh: $('shade'), tt: $('tt'), pn: $('pn'), n1: $('n1'), n2: $('n2'), n3: $('n3') };
    SFX.push({ t: TM.in, type: 'pop' }, { t: TM.rate, type: 'click' });
    return t => {
      const a = P(t, 0, .3, E.lin);
      el.sh.style.opacity = a.toFixed(3);
      const ti = P(t, TM.in, TM.in + .35, E.oBack);
      el.tt.style.opacity = Math.min(1, ti * 2).toFixed(3); el.tt.style.transform = `translateY(${lerp(-40, 0, ti).toFixed(1)}px)`;
      el.pn.style.opacity = P(t, TM.in, TM.in + .2, E.lin).toFixed(3);
      rows.forEach((r, i) => {
        const s = TM.in + .1 + i * .1, p = P(t, s, s + .4, E.o3);
        r.style.opacity = Math.min(1, p * 1.6).toFixed(3);
        r.style.transform = `translateY(${lerp(70, 0, p).toFixed(1)}px)${i === 2 ? ` scale(${lerp(1, 1, 0) + .05 * Math.sin(P(t, TM.rate, TM.rate + .4, E.lin) * Math.PI)})` : ''}`;
      });
      const k = P(t, TM.count[0], TM.count[1], E.o3);
      el.n1.textContent = fmt(C * k); el.n2.textContent = fmt(V * k);
      el.n3.textContent = fmtRate(RATE * P(t, TM.rate, TM.rate + .5, E.o3)) + PR.rate.suffix;
    };
  },

  /* B — Funil de perda: fundo noite; duas barras (cliques e visualizações) e o pedaço que some em terracota */
  B() {
    st.style.background = '#141413';
    const W = 840, wv = W * V / C;
    st.innerHTML = `
      <div class="abs mono" style="left:84px;top:250px;font-size:22px;letter-spacing:.18em;color:var(--roxoC)">${PR.panel.toUpperCase()} · 7 DIAS</div>
      <div class="abs h" style="left:80px;top:300px;font-size:100px;color:#faf9f5">${PR.headline}</div>
      <div class="abs" style="left:80px;top:680px;font-size:26px;font-weight:500;color:#cfccc3">${PR.clicks.label}</div>
      <div class="abs" style="left:80px;top:722px;width:${W}px;height:96px;border-radius:20px;background:var(--roxo)"></div>
      <div class="abs h mono" style="left:110px;top:742px;font-size:58px;color:#fff">${fmt(C)}</div>
      <div class="abs" style="left:80px;top:870px;font-size:26px;font-weight:500;color:#cfccc3">${PR.views.label}</div>
      <div class="abs" style="left:80px;top:912px;width:${W}px;height:96px;border-radius:20px;background:#262523"></div>
      <div class="abs" style="left:80px;top:912px;width:${wv}px;height:96px;border-radius:20px;background:var(--roxoC)"></div>
      <div class="abs" style="left:${80 + wv}px;top:912px;width:${W - wv}px;height:96px;border-radius:0 20px 20px 0;background:repeating-linear-gradient(135deg,var(--terra) 0 10px,#8d4a2c 10px 20px)"></div>
      <div class="abs h mono" style="left:110px;top:932px;font-size:58px;color:#141413">${fmt(V)}</div>
      <div class="abs chip" style="left:${80 + wv + 24}px;top:1034px;padding:14px 26px;font-size:30px;background:var(--terra);color:#fff">− ${fmt(C - V)} pessoas</div>
      <div class="abs h" style="left:80px;top:1190px;font-size:250px;color:#faf9f5">${fmtRate(RATE)}%</div>
      <div class="abs chip" style="left:84px;top:1450px;padding:14px 28px;font-size:34px;background:var(--roxoF);color:#fff">${PR.rate.label}</div>`;
  },

  /* C — Coluna em destaque: creme; linha do Gerenciador ampliada com a coluna connect rate sublinhada e o número gigante */
  C() {
    st.style.background = 'var(--creme)';
    const col = (x, w, h, v, hi) => `<div class="abs" style="left:${x}px;top:560px;width:${w}px;height:420px;${hi ? 'background:var(--roxoS);box-shadow:inset 0 0 0 3px var(--roxo);border-radius:22px' : ''}">
      <div class="abs" style="left:24px;top:30px;width:${w - 40}px;font-size:24px;font-weight:600;line-height:1.15;color:${hi ? 'var(--roxoF)' : 'var(--apag)'}">${h}</div>
      <div class="abs h mono" style="left:24px;top:250px;font-size:${hi ? 78 : 64}px;color:${hi ? 'var(--roxoF)' : 'var(--tinta)'}">${v}</div></div>`;
    st.innerHTML = `
      <div class="abs h" style="left:80px;top:250px;font-size:112px;color:var(--tinta)">Quanto do clique\n<span style="color:var(--roxoF)">chega na página?</span></div>
      <div class="abs card" style="left:50px;top:520px;width:980px;height:500px;border-radius:30px"></div>
      ${col(70, 270, PR.clicks.label, fmt(C))}${col(350, 300, PR.views.label, fmt(V))}${col(670, 340, PR.rate.label, fmtRate(RATE) + '%', true)}
      <div class="abs h" style="left:80px;top:1130px;font-size:240px;color:var(--roxoF)">${fmtRate(RATE)}%</div>
      <div class="abs" style="left:84px;top:1390px;width:880px;font-size:40px;font-weight:500;line-height:1.25;color:var(--tintaS)">dos cliques que você pagou viram visita de verdade.</div>`;
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
