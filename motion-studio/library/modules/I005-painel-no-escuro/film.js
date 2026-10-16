/* I005 Painel no escuro — "não saber quem entrou, de onde veio e quem clicou" (0:15) e o mesmo painel aceso com GA4 (0:33).
   Look A (escolhido) é animado com PR.mode 'dark' ou 'reveal'; B e C ficam como stills de PR.state.
   Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. */
(() => {
'use strict';
const q = new URLSearchParams(location.search);
const PR = { ...window.PARAMS, ...(q.get('p') ? JSON.parse(decodeURIComponent(escape(atob(q.get('p').replace(/-/g, '+').replace(/_/g, '/'))))) : {}) };
if (q.get('look')) PR.look = q.get('look');
if (q.get('state')) PR.state = +q.get('state');
if (q.get('mode')) PR.mode = q.get('mode');
if (q.has('nobg')) PR.bg = null;
if (PR.mode === 'reveal') PR.duration = PR.timing.reveal.dur; else if (PR.mode === 'dark') PR.duration = PR.timing.dark.dur;
const st = document.getElementById('stage');
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = { lin: p => p, i2: p => p * p, o3: p => 1 - (1 - p) ** 3, oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2 };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
const SFX = [];
const M = PR.metrics, lit = PR.state >= .5;
const BG = PR.bg ? `<div id="bgv" style="background-image:url('${PR.bg}')"></div>` : '';

const LOOKS = {
  /* A — Cartões (escolhido): três cartões no peito.
     mode 'dark': entram escuros com "?" um a um, na fala de cada pergunta (at[]).
     mode 'reveal': entram escuros juntos, o selo vira GA4 e cada cartão acende no seu at[] contando até o número. */
  A() {
    if (!PR.bg) { document.documentElement.style.background = document.body.style.background = 'transparent'; st.style.background = 'transparent'; }
    else st.style.background = '#000';
    const reveal = PR.mode === 'reveal', K = PR.timing[reveal ? 'reveal' : 'dark'];
    const cards = M.map((m, i) => {
      const y = 1040 + i * 158, big = m.value.length > 6;
      return `<div class="cw abs" style="left:90px;top:${y}px;width:900px;height:136px">
        <div class="cd abs" style="inset:0;border-radius:22px;background:rgba(18,18,17,.8);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.08)">
          <div class="abs" style="left:36px;top:46px;font-size:32px;font-weight:600;color:#cfccc3">${m.q}</div>
          <div class="qm abs h" style="right:44px;top:26px;font-size:90px;color:var(--roxoC)">?</div></div>
        <div class="cl card abs" style="inset:0;border-radius:22px;opacity:0">
          <div class="abs" style="left:36px;top:30px;font-size:26px;font-weight:500;color:var(--tintaS)">${m.label}</div>
          <div class="abs" style="left:36px;top:70px;font-size:20px;color:var(--apag)">${PR.period}</div>
          <div class="num abs h mono ${m.wa ? 'wa' : ''}" style="right:40px;top:${big ? 42 : 30}px;font-size:${big ? 62 : 84}px;color:${m.wa ? '' : 'var(--roxoF)'}"></div></div></div>`;
    }).join('');
    st.innerHTML = `${BG}
      <div id="shade" class="abs" style="left:0;right:0;top:860px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.55) 40%)"></div>
      <div id="chipD" class="abs chip" style="left:90px;top:968px;padding:10px 20px;font-size:22px;background:rgba(18,18,17,.8);color:#8d8a80">Sem rastreamento</div>
      <div id="chipL" class="abs chip" style="left:90px;top:968px;padding:10px 20px;font-size:22px;background:var(--roxo);color:#fff;opacity:0">GA4 · ${PR.period}</div>
      ${cards}`;
    const $$ = c => [...st.querySelectorAll(c)];
    const el = { shade: document.getElementById('shade'), cD: document.getElementById('chipD'), cL: document.getElementById('chipL'),
      cw: $$('.cw'), cd: $$('.cd'), cl: $$('.cl'), num: $$('.num'), qm: $$('.qm') };
    /* número que conta: troca só a parte numérica do valor ("Google 62%" → conta o 62) */
    const count = (v, k) => v.replace(/[\d.]+/, d => { const n = +d.replace(/\./g, ''); return Math.round(n * k).toLocaleString('pt-BR'); });
    K.at.forEach((t, i) => SFX.push({ t, type: reveal ? 'pop' : 'tick' }));
    if (reveal) SFX.push({ t: K.ga4, type: 'click' });
    return t => {
      const D = PR.duration, out = P(t, D - .3, D, E.i2);
      el.shade.style.opacity = (P(t, 0, .3, E.lin) * (1 - out)).toFixed(3);
      el.cD.style.opacity = (P(t, 0, .25, E.lin) * (reveal ? 1 - P(t, K.ga4, K.ga4 + .15, E.lin) : 1) * (1 - out)).toFixed(3);
      if (reveal) {
        const g = P(t, K.ga4, K.ga4 + .3, E.oBack);
        el.cL.style.opacity = (Math.min(1, g * 2) * (1 - out)).toFixed(3); el.cL.style.transform = `scale(${lerp(.85, 1, g)})`;
      }
      M.forEach((m, i) => {
        const tin = reveal ? .05 + i * .07 : K.at[i] - .25;
        const a = P(t, tin, tin + .4, E.o3);
        el.cw[i].style.transform = `translateY(${(lerp(60, 0, a) + lerp(0, 90, out)).toFixed(1)}px)`;
        el.cw[i].style.opacity = (Math.min(1, a * 1.6) * (1 - out)).toFixed(3);
        // "?" pulsa enquanto ninguém sabe
        el.qm[i].style.transform = `scale(${(1 + .08 * Math.max(0, Math.sin((t - tin) * 5))).toFixed(3)})`;
        if (reveal) {
          const f = P(t, K.at[i], K.at[i] + .25, E.lin), pop = P(t, K.at[i], K.at[i] + .35, E.oBack);
          el.cl[i].style.opacity = f.toFixed(3); el.cd[i].style.opacity = (1 - f).toFixed(3);
          el.cw[i].style.transform += ` scale(${t >= K.at[i] ? lerp(.96, 1, pop).toFixed(4) : 1})`;
          el.num[i].textContent = count(m.value, P(t, K.at[i], K.at[i] + .8, E.o3));
        }
      });
    };
  },

  /* B — Painel: corte de tela cheia, painel de dados em fundo noite; apagado em contorno ou aceso em roxo */
  B() {
    st.style.background = '#141413';
    const ink = lit ? '#faf9f5' : '#3a3936', line = lit ? 'var(--roxo)' : '#2e2d2a';
    const pts = [40, 52, 46, 61, 58, 72, 69, 84, 80, 96, 92, 110].map((v, i) => [i * 76, 300 - (lit ? v * 2.2 : 60)]);
    const path = 'M' + pts.map(p => p.join(' ')).join(' L');
    const panel = (y, h, inner) => `<div class="abs" style="left:80px;top:${y}px;width:920px;height:${h}px;border-radius:28px;background:${lit ? '#1d1c1b' : '#181817'};box-shadow:inset 0 0 0 1.5px ${lit ? '#2c2b29' : '#232321'}">${inner}</div>`;
    const big = (v, c) => lit ? `<span style="color:${c || ink}">${v}</span>` : `<span style="color:var(--roxoC);opacity:.85">?</span>`;
    st.innerHTML = `
      <div class="abs mono" style="left:84px;top:250px;font-size:22px;letter-spacing:.18em;color:${lit ? 'var(--roxoC)' : '#5d5b55'}">SEU SITE · ${PR.period.toUpperCase()}</div>
      <div class="abs h" style="left:80px;top:290px;font-size:84px;color:${lit ? '#faf9f5' : '#5d5b55'}">${lit ? 'Agora você vê.' : 'No escuro.'}</div>
      ${panel(440, 470, `
        <div class="abs" style="left:40px;top:36px;font-size:26px;font-weight:500;color:${lit ? '#cfccc3' : '#5d5b55'}">${M[0].label}</div>
        <div class="abs h mono" style="left:36px;top:76px;font-size:130px">${big(M[0].value)}</div>
        <svg class="abs" style="left:40px;top:150px" width="850" height="310"><path d="${path}" fill="none" stroke="${line}" stroke-width="${lit ? 6 : 3}" ${lit ? '' : 'stroke-dasharray="10 10"'} stroke-linecap="round" stroke-linejoin="round"/>
          ${lit ? `<path d="${path} L ${pts[pts.length - 1][0]} 300 L 0 300 Z" fill="#6f6fc9" opacity=".14"/>` : ''}</svg>`)}
      ${panel(940, 290, `
        <div class="abs" style="left:40px;top:36px;font-size:26px;font-weight:500;color:${lit ? '#cfccc3' : '#5d5b55'}">${M[1].label}</div>
        ${['Google', 'Instagram', 'Direto'].map((n, i) => `<div class="abs" style="left:40px;top:${96 + i * 58}px;width:840px;height:40px">
          <div class="abs" style="left:0;top:8px;font-size:22px;color:${lit ? '#faf9f5' : '#4a4946'}">${n}</div>
          <div class="abs" style="left:190px;top:12px;width:560px;height:16px;border-radius:8px;background:#262523"></div>
          <div class="abs" style="left:190px;top:12px;width:${lit ? [62, 24, 14][i] * 5.6 : 0}px;height:16px;border-radius:8px;background:var(--roxo)"></div>
          <div class="abs mono" style="right:0;top:6px;font-size:24px;color:${lit ? '#faf9f5' : 'var(--roxoC)'}">${lit ? [62, 24, 14][i] + '%' : '?'}</div></div>`).join('')}`)}
      ${panel(1260, 250, `
        <div class="abs" style="left:40px;top:36px;font-size:26px;font-weight:500;color:${lit ? '#cfccc3' : '#5d5b55'}">${M[2].label}</div>
        <div class="abs h mono" style="left:36px;top:84px;font-size:130px">${big(M[2].value, '#2fbf6b')}</div>
        <div class="abs chip" style="right:40px;top:110px;padding:12px 22px;font-size:24px;background:${lit ? '#2f9e5b' : '#232321'};color:${lit ? '#fff' : '#5d5b55'}">${lit ? '+ 87 conversas' : 'sem evento'}</div>`)}`;
  },

  /* C — Lanterna: o próprio vídeo escurece; perguntas em contorno viram respostas cheias quando a luz volta */
  C() {
    st.style.background = '#000';
    const pos = [[80, 1090], [80, 1230], [80, 1370]];
    st.innerHTML = `${BG}
      <div class="abs" style="inset:0;background:${lit ? 'radial-gradient(ellipse at 50% 35%,transparent 40%,rgba(0,0,0,.35))' : 'radial-gradient(circle at 52% 28%,rgba(0,0,0,.35) 0,rgba(0,0,0,.86) 34%,rgba(0,0,0,.94))'}"></div>
      ${M.map((m, i) => `<div class="chip" style="left:${pos[i][0]}px;top:${pos[i][1]}px;padding:22px 34px;font-size:42px;${lit
        ? `background:${m.wa ? '#2f9e5b' : i ? 'var(--roxoF)' : 'var(--roxo)'};color:#fff;box-shadow:0 20px 50px -18px rgba(0,0,0,.6)`
        : 'background:transparent;color:#d8d5cc;box-shadow:inset 0 0 0 2.5px rgba(216,213,204,.55)'}">${lit ? `<b style="font-weight:800">${m.short.split(' ')[0]}</b> ${m.short.split(' ').slice(1).join(' ')}` : m.q}</div>`).join('')}
      <div class="abs h" style="left:84px;top:${lit ? 930 : 940}px;font-size:${lit ? 60 : 70}px;color:${lit ? '#faf9f5' : '#d8d5cc'}">${lit ? 'Com GA4, você vê.' : 'No escuro.'}</div>`;
  },
};

let paint = null;
window.DURATION = PR.duration; window.FPS = PR.fps || 30; window.SFX = SFX;
window.seek = async t => { if (paint) paint(t); };
window.__ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['Inter', 'Fraunces'].map(f => document.fonts.load(`800 40px "${f}"`)));
  if (PR.bg) await new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = PR.bg; });
  paint = LOOKS[PR.look]() || null;
  if (paint) await window.seek(q.has('t') ? +q.get('t') : PR.duration - .35);
})();
})();
