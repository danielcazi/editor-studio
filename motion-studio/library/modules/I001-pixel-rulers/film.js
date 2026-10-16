/* I001 Pixel Rulers — precisão como herói do plano ("Arraste. Ajuste.").
   Look B (escolhido) é animado; A e C ficam como stills do estado final.
   Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. */
(() => {
'use strict';
const q = new URLSearchParams(location.search);
const PR = { ...window.PARAMS, ...(q.get('p') ? JSON.parse(decodeURIComponent(escape(atob(q.get('p').replace(/-/g, '+').replace(/_/g, '/'))))) : {}) };
if (q.get('look')) PR.look = q.get('look');
const st = document.getElementById('stage');
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = { lin: p => p, o3: p => 1 - (1 - p) ** 3, io3: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2,
  oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2 };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
const SFX = [];

const CUR = '<svg class="cursor" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#1f1e1d" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
/* página Lumière em coordenadas próprias (1000×640); o botão fica em (bx,by) */
const BX = 44, BY = 450, BW = 300, BH = 64;
function page(x, y, s, extra = '') {
  return `<div class="page" style="left:${x}px;top:${y}px;width:1000px;height:640px;transform-origin:0 0;transform:scale(${s})">
    <div class="nav"><b>Lumière</b><span>Tratamentos · Resultados · Contato</span></div>
    <div class="hero">Sua pele no seu melhor momento.</div>
    <div class="sub">Protocolos personalizados com avaliação completa e acompanhamento.</div>
    <div class="arch"></div><div class="leaf"></div><div class="bottle"></div>
    <div class="btn" style="left:${BX}px;top:${BY}px;width:${BW}px;height:${BH}px">${PR.button}</div>${extra}</div>`;
}
const handles = '<i></i><i></i><i></i><i></i>';

/* régua com marcas a cada 10 px, números a cada 100 */
function ruler(horiz, len, start, step, hiA, hiB, color, ink) {
  let s = '';
  for (let v = Math.ceil(start / 10) * 10, i = 0; (v - start) * step <= len; v += 10, i++) {
    const p = (v - start) * step, maj = v % 100 === 0, h = maj ? 18 : v % 50 === 0 ? 11 : 6;
    s += horiz ? `<div class="abs" style="left:${p}px;bottom:0;width:1px;height:${h}px;background:${ink}"></div>`
               : `<div class="abs" style="top:${p}px;right:0;height:1px;width:${h}px;background:${ink}"></div>`;
    if (maj) s += horiz ? `<div class="abs mono" style="left:${p + 5}px;top:4px;font-size:12px;color:${ink}">${v}</div>`
                        : `<div class="abs mono" style="top:${p + 3}px;left:4px;font-size:12px;color:${ink}">${v}</div>`;
  }
  const a = (hiA - start) * step, b = (hiB - start) * step;
  s += horiz ? `<div class="abs" style="left:${a}px;width:${b - a}px;bottom:0;height:5px;background:${color}"></div>`
             : `<div class="abs" style="top:${a}px;height:${b - a}px;right:0;width:5px;background:${color}"></div>`;
  return s;
}

const LOOKS = {
  /* A — Mira: creme, réguas na borda da página, mira atravessando a tela, coordenadas gigantes */
  A() {
    const PXX = 760, PYY = 190, S = 1.0;
    const bx = PXX + BX * S, by = PYY + BY * S;
    st.style.background = 'var(--creme)';
    st.innerHTML = `
      <div class="abs" style="inset:0;background-image:radial-gradient(#dcd8cc 1.2px,transparent 1.3px);background-size:28px 28px;opacity:.7"></div>
      <div class="abs h" style="left:120px;top:170px;font-size:104px">${PR.headline[0]}\n<span style="color:var(--roxo)">${PR.headline[1]}</span></div>
      <div class="abs mono" style="left:124px;top:500px;font-size:18px;color:var(--apag);letter-spacing:.16em">POSIÇÃO</div>
      <div class="abs h mono" style="left:116px;top:535px;font-size:176px;letter-spacing:-.04em">X ${PR.x}</div>
      <div class="abs h mono" style="left:116px;top:705px;font-size:176px;letter-spacing:-.04em;color:var(--roxo)">Y ${PR.y}</div>
      ${page(PXX, PYY, S, `<div class="sel" style="left:${BX - 6}px;top:${BY - 6}px;width:${BW + 12}px;height:${BH + 12}px">${handles}</div>`)}
      <div class="abs" style="left:${PXX}px;top:${PYY - 40}px;width:1000px;height:34px;background:#f1efe8;border-radius:8px 8px 0 0">${ruler(true, 1000, 0, 1, BX, BX + BW, 'var(--roxo)', '#8a877e')}</div>
      <div class="abs" style="left:${PXX - 40}px;top:${PYY}px;width:34px;height:640px;background:#f1efe8;border-radius:8px 0 0 8px">${ruler(false, 640, 0, 1, BY, BY + BH, 'var(--roxo)', '#8a877e')}</div>
      <div class="abs" style="left:690px;right:0;top:${by - 6}px;height:0;border-top:1.5px dashed var(--roxo);opacity:.8"></div>
      <div class="abs" style="top:0;bottom:0;left:${bx - 6}px;width:0;border-left:1.5px dashed var(--roxo);opacity:.8"></div>
      <div class="abs" style="left:${bx - 18}px;top:${by - 18}px;width:24px;height:24px;border:2px solid var(--roxo);border-radius:50%"></div>
      <div class="abs mono" style="left:${bx + BW + 40}px;top:${by + BH + 30}px;background:var(--roxo);color:#fff;font-size:16px;padding:7px 12px;border-radius:8px">X ${PR.x} · Y ${PR.y}</div>
      <div style="position:absolute;left:${bx + BW - 4}px;top:${by + BH - 8}px">${CUR}</div>`;
  },

  /* B — Lupa: fundo noite, página à esquerda, lupa enorme mostrando o canto do botão encaixado no pixel.
     Animado: página entra · cursor arrasta o botão (coordenadas ao vivo) · lupa abre no canto · mira encaixa no pixel · "Ajuste." */
  B() {
    const PXX = 110, PYY = 170, S = 0.82;
    const cx = PXX + BX * S, cy = PYY + BY * S;
    const LX = 1390, LY = 520, R = 330, CELL = 44;
    st.style.background = 'var(--tinta)';
    let px = '';
    const N = Math.ceil(2 * R / CELL) + 1, ox = LX - R, oy = LY - R, c0 = 6, r0 = 6;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const dx = c - c0, dy = r - r0;
      let a = 0;
      if (dx >= 0 && dy >= 0) {
        const rad = 5.2, ex = Math.max(0, rad - dx - .5), ey = Math.max(0, rad - dy - .5);
        a = Math.max(0, Math.min(1, rad + .5 - Math.hypot(ex, ey)));
        if (ex === 0 || ey === 0) a = 1;
      }
      const col = a > .98 ? '#c4673f' : a > .02 ? `rgb(${Math.round(255 - 59 * a)},${Math.round(255 - 152 * a)},${Math.round(255 - 192 * a)})` : '#ffffff';
      px += `<div class="abs" style="left:${ox + c * CELL}px;top:${oy + r * CELL}px;width:${CELL - 2}px;height:${CELL - 2}px;background:${col}"></div>`;
    }
    const sx = ox + c0 * CELL - 1, sy = oy + r0 * CELL - 1;
    const word = [...PR.verb].map(ch => `<span class="wl" style="display:inline-block;overflow:hidden;vertical-align:top"><span style="display:inline-block">${ch}</span></span>`).join('');
    st.innerHTML = `
      <div class="abs" style="inset:0;background-image:linear-gradient(#2c2b29 1px,transparent 1px),linear-gradient(90deg,#2c2b29 1px,transparent 1px);background-size:40px 40px"></div>
      <div id="pg" class="abs" style="left:0;top:0">${page(PXX, PYY, S, `<div id="sel" class="sel" style="left:${BX - 6}px;top:${BY - 6}px;width:${BW + 12}px;height:${BH + 12}px">${handles}</div>
        <div id="chip" class="abs mono" style="left:${BX}px;top:${BY + BH + 18}px;background:var(--roxo);color:#fff;font-size:24px;padding:9px 16px;border-radius:10px;white-space:nowrap"></div>
        <div id="cur" class="abs" style="left:0;top:0;transform-origin:0 0">${CUR}</div>`)}</div>
      <svg class="abs" style="left:0;top:0" width="1920" height="1080"><line id="wire" x1="${cx - 5}" y1="${cy - 5}" x2="${cx - 5}" y2="${cy - 5}" stroke="#8f8fdd" stroke-width="2" stroke-dasharray="6 6"/></svg>
      <div id="ring" class="abs" style="left:${cx - 22}px;top:${cy - 22}px;width:34px;height:34px;border:2px solid var(--roxoC);border-radius:50%"></div>
      <div id="lens" class="abs" style="left:${LX - R}px;top:${LY - R}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;overflow:hidden;background:#fff">
        <div id="lensIn" class="abs" style="left:${-(LX - R)}px;top:${-(LY - R)}px;width:1920px;height:1080px;transform-origin:${LX}px ${LY}px">${px}
          <div id="snap" class="abs" style="left:0;top:0">
            <div class="abs" style="left:${sx}px;top:${sy - 300}px;width:3px;height:${2 * R + 300}px;background:var(--roxo)"></div>
            <div class="abs" style="left:${sx - 300}px;top:${sy}px;width:${2 * R + 300}px;height:3px;background:var(--roxo)"></div>
            <div class="abs" style="left:${sx - 9}px;top:${sy - 9}px;width:20px;height:20px;background:#fff;border:3px solid var(--roxo)"></div>
          </div>
          <div id="onepx" class="abs" style="left:0;top:0">
            <div class="abs mono" style="left:${sx + CELL * 3 - 1}px;top:${sy - 52}px;width:${CELL}px;text-align:center;font-size:15px;color:var(--roxoF)">1 px</div>
            <div class="abs" style="left:${sx + CELL * 3 + 1}px;top:${sy - 20}px;width:${CELL - 2}px;height:2px;background:var(--roxoF)"></div>
          </div>
        </div>
      </div>
      <div id="rim" class="abs" style="left:${LX - R - 8}px;top:${LY - R - 8}px;width:${2 * R + 16}px;height:${2 * R + 16}px;border-radius:50%;border:8px solid #f1efe8;box-shadow:0 40px 90px rgba(0,0,0,.5)"></div>
      <div id="verb" class="abs h" style="left:112px;top:770px;font-size:150px;color:#faf9f5">${word}</div>
      <div id="subl" class="abs mono" style="left:120px;top:935px;font-size:22px;color:var(--roxoC);letter-spacing:.12em">ENCAIXE DE 1 PX · X ${PR.x} · Y ${PR.y}</div>`;
    const $ = id => document.getElementById(id);
    const el = { pg: $('pg'), btn: st.querySelector('.page .btn'), sel: $('sel'), chip: $('chip'), cur: $('cur'), wire: $('wire'), ring: $('ring'),
      lens: $('lens'), lensIn: $('lensIn'), rim: $('rim'), snap: $('snap'), onepx: $('onepx'), subl: $('subl'), letters: [...st.querySelectorAll('.wl > span')] };
    const K = PR.timing;
    SFX.push({ t: K.grab, id: 'click', gain: .7 }, { t: K.drop, id: 'tick', gain: .6 }, { t: K.snap, id: 'snap', gain: 1 });
    return t => {
      // página entra
      // página já em quadro no corte, com empurrão lento de câmera
      el.pg.style.transform = `translate(${lerp(-26, 0, P(t, 0, K.lens, E.o3))}px,0)`;
      // arrasto: o botão parte deslocado e pousa no lugar
      const d = P(t, K.grab, K.drop, E.io3), ox = lerp(260, 0, d), oy = lerp(-170, 0, d);
      const press = t >= K.grab && t < K.drop + .05;
      el.btn.style.transform = el.sel.style.transform = el.chip.style.transform = `translate(${ox}px,${oy}px)`;
      el.chip.textContent = `X ${Math.round(PR.x + ox)} · Y ${Math.round(PR.y + oy)}`;
      el.chip.style.opacity = (P(t, K.grab, K.grab + .15, E.lin) * (1 - P(t, K.lens, K.lens + .3, E.lin))).toFixed(3);
      el.sel.style.opacity = P(t, K.grab - .15, K.grab, E.lin).toFixed(3);
      const ca = P(t, 0, K.grab, E.o3);
      el.cur.style.transform = `translate(${BX + BW - 30 + ox + lerp(120, 0, ca)}px,${BY + 22 + oy + lerp(90, 0, ca)}px) scale(${press ? 1.55 : 1.7})`;
      el.cur.style.opacity = (ca * (1 - P(t, K.lens + .2, K.lens + .5, E.lin))).toFixed(3);
      // anel no canto e fio até a lupa
      const ra = P(t, K.drop, K.drop + .3, E.oBack);
      el.ring.style.transform = `scale(${ra})`; el.ring.style.opacity = Math.min(1, ra).toFixed(3);
      const w = P(t, K.lens - .05, K.lens + .35, E.io3);
      el.wire.setAttribute('x2', lerp(cx - 5, LX - R * .72, w)); el.wire.setAttribute('y2', lerp(cy - 5, LY + R * .70, w));
      // lupa abre e aproxima
      const lo = P(t, K.lens + .15, K.lens + .6, E.oBack);
      el.lens.style.clipPath = `circle(${(R * lo).toFixed(1)}px at 50% 50%)`;
      el.rim.style.transform = `scale(${lo.toFixed(4)})`; el.rim.style.opacity = Math.min(1, lo * 1.5).toFixed(3);
      el.lensIn.style.transform = `scale(${lerp(.55, 1, P(t, K.lens + .15, K.snap, E.o3)).toFixed(4)})`;
      // mira entra fora do pixel e encaixa
      const sn = P(t, K.snap - .45, K.snap, E.oBack);
      el.snap.style.transform = `translate(${lerp(CELL * 1.6, 0, sn)}px,${lerp(-CELL * 1.3, 0, sn)}px)`;
      el.snap.style.opacity = P(t, K.snap - .5, K.snap - .35, E.lin).toFixed(3);
      el.onepx.style.opacity = P(t, K.snap + .05, K.snap + .25, E.lin).toFixed(3);
      el.onepx.style.transform = `translateY(${lerp(10, 0, P(t, K.snap + .05, K.snap + .3, E.o3))}px)`;
      // "Ajuste." sobe letra a letra
      el.letters.forEach((l, i) => { l.style.transform = `translateY(${(lerp(110, 0, P(t, K.snap - .1 + i * .04, K.snap + .3 + i * .04, E.o3))).toFixed(1)}%)`; });
      const sa = P(t, K.snap + .35, K.snap + .7, E.o3);
      el.subl.style.opacity = sa.toFixed(3); el.subl.style.transform = `translateX(${lerp(-24, 0, sa)}px)`;
    };
  },

  /* C — Cotas: roxo chapado, o botão sozinho e linhas de cota com os números gigantes */
  C() {
    const bx = 980, by = 610, bw = PR.w, bh = 112;
    st.style.background = 'var(--roxo)';
    const tick = (x, y, v) => `<div class="abs" style="left:${x - (v ? 1 : 14)}px;top:${y - (v ? 14 : 1)}px;width:${v ? 2 : 28}px;height:${v ? 28 : 2}px;background:#fff"></div>`;
    st.innerHTML = `
      <div class="abs" style="left:0;right:0;top:${by}px;border-top:1.5px dashed rgba(255,255,255,.45)"></div>
      <div class="abs" style="top:0;bottom:0;left:${bx}px;border-left:1.5px dashed rgba(255,255,255,.45)"></div>
      <!-- cota X -->
      <div class="abs" style="left:120px;top:${by + 200}px;width:${bx - 120}px;height:2px;background:#fff"></div>
      ${tick(120, by + 201, true)}${tick(bx, by + 201, true)}
      <div class="abs h mono" style="left:120px;top:${by + 228}px;font-size:150px;color:#fff;letter-spacing:-.04em">${PR.x}<span style="font-size:40px;letter-spacing:0;color:var(--roxoS);margin-left:14px">px</span></div>
      <!-- cota Y -->
      <div class="abs" style="left:${bx - 110}px;top:90px;width:2px;height:${by - 90}px;background:#fff"></div>
      ${tick(bx - 109, 90, false)}${tick(bx - 109, by, false)}
      <div class="abs h mono" style="left:${bx - 470}px;top:${(90 + by) / 2 - 80}px;width:330px;text-align:right;font-size:150px;color:#fff;letter-spacing:-.04em">${PR.y}</div>
      <!-- cota largura -->
      <div class="abs" style="left:${bx}px;top:${by - 52}px;width:${bw}px;height:2px;background:var(--roxoS)"></div>
      ${tick(bx, by - 51, true)}${tick(bx + bw, by - 51, true)}
      <div class="abs mono" style="left:${bx + bw / 2 - 60}px;top:${by - 92}px;width:120px;text-align:center;font-size:24px;color:#fff">${bw} px</div>
      <div class="btn" style="left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;background:#fff;color:var(--roxoF);font-size:34px;box-shadow:0 30px 60px -20px rgba(40,40,110,.6)">${PR.button}</div>
      <div class="sel" style="left:${bx - 8}px;top:${by - 8}px;width:${bw + 16}px;height:${bh + 16}px;border-color:#fff;border-radius:6px">${handles.replace(/<i>/g, '<i style="border-color:#fff;background:var(--roxo)">')}</div>
      <div style="position:absolute;left:${bx + bw - 20}px;top:${by + bh - 20}px;transform:scale(1.5);transform-origin:0 0">${CUR}</div>
      <div class="abs h" style="left:120px;top:110px;font-size:84px;color:#fff">Arraste.\nSolte.\n<span style="color:var(--tinta)">Exato.</span></div>`;
  },
};

let paint = null;   // looks animados devolvem paint(t); os outros são stills
window.DURATION = PR.duration; window.FPS = 30; window.SFX = SFX;
window.seek = async t => { if (paint) paint(t); };
window.__ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['Inter', 'Fraunces'].map(f => document.fonts.load(`800 40px "${f}"`)));
  paint = LOOKS[PR.look]() || null;
  await window.seek(q.has('t') ? +q.get('t') : PR.duration);
})();
})();
