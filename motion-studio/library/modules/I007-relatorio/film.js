/* I007 Relatório sem a linha que importa — "e não aparece em nenhum relatório" (0:02).
   Look B (escolhido) é animado; A e C ficam como stills do estado final. Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. */
(() => {
'use strict';
const q = new URLSearchParams(location.search);
const PR = { ...window.PARAMS, ...(q.get('p') ? JSON.parse(decodeURIComponent(escape(atob(q.get('p').replace(/-/g, '+').replace(/_/g, '/'))))) : {}) };
if (q.get('look')) PR.look = q.get('look');
if (q.has('nobg')) PR.bg = null;
const st = document.getElementById('stage');
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = { lin: p => p, i2: p => p * p, o3: p => 1 - (1 - p) ** 3, oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2 };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
const SFX = [];
const BG = PR.bg ? `<div id="bgv" style="background-image:url('${PR.bg}')"></div>` : '';
const TITLE = (y = 120, size = 150) => `<div class="topt" style="top:${y}px;font-size:${size}px">${PR.title[0]} <span class="acc">${PR.title[1]}</span></div>`;
const SHADE = '<div class="abs" style="left:0;right:0;top:880px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.55) 35%)"></div><div class="abs" style="left:0;right:0;top:0;height:420px;background:linear-gradient(rgba(0,0,0,.45),transparent)"></div>';
const LENS = (sz, c) => `<svg width="${sz}" height="${sz}" viewBox="0 0 40 40"><circle cx="17" cy="17" r="11" fill="none" stroke="${c}" stroke-width="4.5"/><line x1="25.5" y1="25.5" x2="35" y2="35" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/></svg>`;

const LOOKS = {
  /* A — Planilha: relatório cheio no peito; a última linha, a que importa, está vazia e tracejada */
  A() {
    st.innerHTML = `${BG}${SHADE}${TITLE()}
      <div class="card" style="left:90px;top:940px;width:900px;height:560px;border-radius:26px">
        <div class="abs" style="left:40px;top:34px;font-size:30px;font-weight:800;color:var(--tinta)">${PR.month}</div>
        <div class="abs" style="right:40px;top:40px;font-size:20px;color:var(--apag)">Instagram · Site</div>
        ${PR.rows.map(([k, v], i) => `<div class="abs" style="left:40px;right:40px;top:${104 + i * 76}px;height:64px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:27px;color:var(--tintaS)">${k}</span><span style="font-size:32px;font-weight:800;color:var(--tinta);font-variant-numeric:tabular-nums">${v}</span></div>`).join('')}
        <div class="abs" style="left:28px;right:28px;top:418px;height:96px;border-radius:16px;border:3px dashed var(--roxo);background:var(--roxoS);display:flex;align-items:center;justify-content:space-between;padding:0 24px">
          <span style="font-size:29px;font-weight:700;color:var(--roxoF)">${PR.missing}</span><span style="font-size:44px;font-weight:800;color:var(--roxo)">—</span></div>
      </div>`;
  },

  /* B — Busca no relatório (escolhido): o título entra, o cartão sobe, a busca "pacientes perdidos" é digitada
     enquanto as barras crescem, e a resposta é "0 resultados". Sai descendo no fim. */
  B() {
    if (!PR.bg) { document.documentElement.style.background = document.body.style.background = 'transparent'; st.style.background = 'transparent'; }
    const Q = 'pacientes perdidos', H = [42, 58, 50, 74, 66, 88, 80];
    st.innerHTML = `${BG}<div id="sh">${SHADE}</div><div id="tt">${TITLE()}</div>
      <div id="cd" class="card" style="left:90px;top:930px;width:900px;height:590px;border-radius:26px">
        <div class="abs" style="left:32px;right:32px;top:30px;height:78px;border-radius:39px;background:#f3f1ea;display:flex;align-items:center;gap:16px;padding:0 26px">
          ${LENS(36, '#7c7a73')}<span id="qt" style="font-size:30px;font-weight:600;color:var(--tinta)"></span><span id="ca" style="display:inline-block;width:3px;height:34px;background:var(--roxo)"></span></div>
        <div class="abs" style="left:40px;top:132px;font-size:22px;font-weight:600;color:var(--apag);letter-spacing:.04em">${PR.month.toUpperCase()}</div>
        <div class="abs" style="left:40px;right:40px;top:176px;height:150px;display:flex;align-items:flex-end;gap:16px">
          ${H.map(h => `<i class="bar" data-h="${h}" style="flex:1;height:${h}%;border-radius:8px 8px 3px 3px;background:#d9d8f6;display:block;transform-origin:50% 100%"></i>`).join('')}</div>
        <div class="abs" style="left:40px;right:40px;top:346px;display:flex;justify-content:space-between;font-size:22px;color:var(--tintaS)">${PR.rows.slice(0, 3).map(([k, v]) => `<span><b style="display:block;font-size:34px;color:var(--tinta)">${v}</b>${k}</span>`).join('')}</div>
        <div id="rs" class="abs" style="left:28px;right:28px;top:470px;height:92px;border-radius:16px;background:var(--roxoS);display:flex;align-items:center;gap:18px;padding:0 26px;transform-origin:0 50%">
          <span id="zr" style="width:44px;height:44px;border-radius:50%;background:var(--roxo);color:#fff;display:grid;place-items:center;font-size:26px;font-weight:800">0</span>
          <span style="font-size:28px;font-weight:700;color:var(--roxoF)">resultados para “${Q}”</span></div>
      </div>`;
    const $ = id => document.getElementById(id), K = PR.timing;
    const el = { sh: $('sh'), tt: $('tt'), cd: $('cd'), qt: $('qt'), ca: $('ca'), rs: $('rs'), zr: $('zr'), bars: [...st.querySelectorAll('.bar')] };
    for (let k = 0; k < Q.length; k += 3) SFX.push({ t: K.type[0] + (K.type[1] - K.type[0]) * k / Q.length, type: 'key', g: .5 });
    SFX.push({ t: 0, type: 'pop', g: .5 }, { t: K.result, type: 'tick', g: .9 });
    return t => {
      const D = PR.duration, out = P(t, D - .14, D, E.i2);
      el.sh.style.opacity = (P(t, 0, .2, E.lin) * (1 - out)).toFixed(3);
      const ta = P(t, 0, .3, E.oBack);
      el.tt.style.transform = `translateY(${lerp(-40, 0, ta).toFixed(1)}px) scale(${lerp(.9, 1, ta).toFixed(3)})`; el.tt.style.opacity = (Math.min(1, ta * 1.6) * (1 - out)).toFixed(3);
      const ca = P(t, .04, .34, E.o3);
      el.cd.style.transform = `translateY(${(lerp(90, 0, ca) + lerp(0, 120, out)).toFixed(1)}px)`; el.cd.style.opacity = (Math.min(1, ca * 1.6) * (1 - out)).toFixed(3);
      el.qt.textContent = Q.slice(0, Math.round(Q.length * P(t, K.type[0], K.type[1], E.lin)));
      el.ca.style.opacity = t < K.result || Math.floor(t * 4) % 2 ? '1' : '0';
      el.bars.forEach((b, i) => b.style.transform = `scaleY(${P(t, .2 + i * .04, .55 + i * .04, E.o3).toFixed(3)})`);
      const ra = P(t, K.result, K.result + .3, E.oBack);
      el.rs.style.transform = `scale(${ra.toFixed(4)})`; el.rs.style.opacity = Math.min(1, ra * 2).toFixed(3);
      el.zr.style.transform = `scale(${(1 + .25 * Math.sin(Math.PI * P(t, K.result + .15, K.result + .45, E.lin))).toFixed(3)})`;
    };
  },

  /* C — Recibo: o relatório sai impresso como um recibo; os totais estão lá, a última linha foi cortada */
  C() {
    const W = 600, X = 240;
    st.innerHTML = `${BG}${SHADE}${TITLE()}
      <div class="abs" style="left:${X}px;top:900px;width:${W}px;height:500px;transform:rotate(-3deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.55))">
        <div class="abs mono2" style="left:0;top:0;width:${W}px;height:470px;background:#fbfaf6;color:#2b2a28;padding:40px 44px;font-size:24px;line-height:1.55;
          clip-path:polygon(0 0,100% 0,100% 92%,95% 96%,90% 92%,85% 97%,80% 92%,75% 96%,70% 92%,65% 97%,60% 92%,55% 96%,50% 92%,45% 97%,40% 92%,35% 96%,30% 92%,25% 97%,20% 92%,15% 96%,10% 92%,5% 97%,0 92%)">
          <div style="text-align:center;font-weight:700;font-size:26px">CONSULTÓRIO · RESUMO</div>
          <div style="text-align:center;color:#8b897f;font-size:20px;margin-bottom:18px">${PR.month.toLowerCase()}</div>
          ${PR.rows.map(([k, v]) => `<div style="display:flex;justify-content:space-between;border-bottom:1px dashed #d8d5ca"><span>${k}</span><b>${v}</b></div>`).join('')}
          <div style="display:flex;justify-content:space-between;margin-top:14px;color:var(--roxoF);font-weight:700"><span>${PR.missing.toUpperCase()}</span><span>???</span></div>
        </div>
      </div>
      <div class="abs" style="left:${X + W - 90}px;top:1300px;padding:12px 20px;border-radius:999px;background:var(--roxo);color:#fff;font-size:26px;font-weight:700;transform:rotate(-3deg)">não medido</div>`;
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
  // título gigante: o maior tamanho que cabe em 960 px numa linha
  document.querySelectorAll('.topt').forEach(t => { const f = parseFloat(t.style.fontSize); const w = t.scrollWidth; if (w > 960) t.style.fontSize = (f * 960 / w).toFixed(1) + 'px'; });
  if (paint) await window.seek(q.has('t') ? +q.get('t') : PR.duration - .3);
})();
})();
