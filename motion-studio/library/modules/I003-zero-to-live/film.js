/* I003 Zero to Live — provar o "minutos" em vez de só dizer ("Do zero ao ar em minutos.").
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
const RUN = p => 1 - (1 - p) ** 2.4, invRUN = y => 1 - (1 - y) ** (1 / 2.4);   // relógio: arranca rápido, freia no fim
const SFX = [];
const sec = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };

/* página Lumière (1000×640) escalada */
function page(x, y, s, extra = '') {
  return `<div class="page" style="left:${x}px;top:${y}px;width:1000px;height:640px;transform-origin:0 0;transform:scale(${s})">
    <div class="nav"><b>Lumière</b><span>Tratamentos · Resultados · Contato</span></div>
    <div class="hero">Sua pele no seu melhor momento.</div>
    <div class="sub">Protocolos personalizados com avaliação completa e acompanhamento.</div>
    <div class="arch"></div><div class="leaf"></div><div class="bottle"></div>
    <div class="btn" style="left:44px;top:450px;width:300px;height:64px">Agende sua avaliação</div>${extra}</div>`;
}
function browser(x, y, w, s, badge = true) {
  const h = 640 * s + 64;
  return `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    <div class="abs" style="left:22px;top:24px;display:flex;gap:8px"><i style="width:12px;height:12px;border-radius:50%;background:#e6e3da"></i><i style="width:12px;height:12px;border-radius:50%;background:#e6e3da"></i><i style="width:12px;height:12px;border-radius:50%;background:#e6e3da"></i></div>
    <div class="url" style="left:100px;top:14px;height:34px;padding:0 16px;font-size:15px">🔒 ${PR.url}</div>
    ${badge ? `<div class="abs" style="right:18px;top:14px"><span class="live" style="font-size:15px;padding:7px 14px">No ar</span></div>` : ''}
    <div class="abs" style="left:0;top:64px;width:${w}px;height:${640 * s}px;overflow:hidden">${page(0, 0, w / 1000)}</div></div>`;
}
/* miniaturas de cada etapa (240×150) */
const MINI = [
  () => `<div class="abs" style="left:18px;top:22px;right:18px;font-size:13px;line-height:1.35;color:var(--tinta)">${PR.prompt}</div>
         <div class="abs btn" style="right:16px;bottom:16px;padding:7px 14px;background:var(--roxo);color:#fff;font-size:12px">Gerar página</div>`,
  () => `<div class="abs" style="left:18px;top:20px;width:110px;height:12px;border-radius:4px;background:#e6e3da"></div>
         <div class="abs" style="left:18px;top:44px;width:120px;height:44px;border-radius:6px;background:var(--roxoS)"></div>
         <div class="abs" style="left:150px;top:20px;width:72px;height:94px;border-radius:36px 36px 6px 6px;background:var(--pele)"></div>
         <div class="abs" style="left:18px;top:100px;width:70px;height:16px;border-radius:9px;background:var(--terra)"></div>`,
  () => ['Título', 'Cor', 'Espaço'].map((l, i) => `<div class="abs" style="left:18px;top:${22 + i * 40}px;font-size:12px;color:var(--tintaS)">${l}</div>
         <div class="abs" style="left:80px;top:${29 + i * 40}px;width:140px;height:4px;border-radius:2px;background:#ecebe4"></div>
         <div class="abs" style="left:80px;top:${29 + i * 40}px;width:${[90, 50, 120][i]}px;height:4px;border-radius:2px;background:var(--roxo)"></div>
         <div class="abs" style="left:${72 + [90, 50, 120][i]}px;top:${23 + i * 40}px;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--roxo)"></div>`).join(''),
  () => `<div class="abs" style="left:18px;top:22px;font-size:12px;color:var(--tintaS)">Domínio</div>
         <div class="abs url" style="left:18px;top:44px;height:30px;padding:0 12px;font-size:12px">${PR.url}</div>
         <div class="abs btn" style="left:18px;bottom:18px;padding:8px 16px;background:var(--roxo);color:#fff;font-size:13px">Publicar</div>`,
  () => `<div class="abs" style="left:0;top:0;width:240px;height:150px;overflow:hidden">${page(0, 26, .24)}</div>
         <div class="abs url" style="left:10px;top:6px;height:22px;padding:0 10px;font-size:10px">${PR.url}</div>
         <div class="abs" style="right:10px;bottom:10px"><span class="live" style="font-size:13px;padding:6px 12px">No ar</span></div>`,
];

const LOOKS = {
  /* A — Linha do tempo: creme, trilho com 5 marcos, miniatura de cada etapa acima do tempo */
  A() {
    st.style.background = 'var(--creme)';
    const x0 = 180, x1 = 1740, y = 760, T = sec(PR.steps[PR.steps.length - 1].t);
    const pos = s => x0 + (x1 - x0) * sec(s.t) / T;
    let nodes = '', wires = '';
    const n = PR.steps.length, CW = 276, CH = 172, gap = (x1 - x0 + 120 - n * CW) / (n - 1), cy = 420;
    PR.steps.forEach((s, i) => {
      const x = pos(s), last = i === n - 1, cx = x0 - 60 + i * (CW + gap);
      const col = last ? '#2f9e5b' : 'var(--roxoC)';
      nodes += `<div class="card" style="left:${cx}px;top:${cy}px;width:${CW}px;height:${CH}px;${last ? 'box-shadow:0 0 0 3px #2f9e5b,0 24px 60px -24px rgba(31,30,29,.35)' : ''}"><div style="transform:scale(${CW / 240});transform-origin:0 0;width:240px;height:150px;position:relative">${MINI[i]()}</div></div>
        <div class="abs" style="left:${x - 13}px;top:${y - 13}px;width:26px;height:26px;border-radius:50%;background:${last ? '#2f9e5b' : 'var(--roxo)'};border:5px solid var(--creme)"></div>
        <div class="abs h mono" style="left:${x - 100}px;top:${y + 40}px;width:200px;text-align:center;font-size:48px;color:${last ? '#2f9e5b' : 'var(--tinta)'}">${s.t}</div>
        <div class="abs" style="left:${x - 100}px;top:${y + 100}px;width:200px;text-align:center;font-size:21px;font-weight:500;color:var(--tintaS)">${s.label}</div>`;
      const sx = cx + CW / 2, sy = cy + CH + 8, my = (sy + y - 18) / 2;
      wires += `<path d="M${sx} ${sy} C${sx} ${my} ${x} ${my} ${x} ${y - 18}" fill="none" stroke="${last ? '#2f9e5b' : '#8f8fdd'}" stroke-width="2"/>`;
    });
    nodes = `<svg class="abs" style="left:0;top:0" width="1920" height="1080">${wires}</svg>` + nodes;
    st.innerHTML = `
      <div class="abs h" style="left:110px;top:110px;font-size:110px">${PR.headline[0]}\n<span style="color:var(--roxo)">${PR.headline[1]}</span></div>
      <div class="abs" style="left:${x0}px;top:${y - 3}px;width:${x1 - x0}px;height:6px;border-radius:3px;background:linear-gradient(90deg,var(--roxo) 80%,#2f9e5b)"></div>
      ${nodes}`;
  },

  /* B — Cronômetro: noite, relógio gigante, barra de etapas proporcional e o site no ar.
     Animado: relógio corre de 0:00 ao total · cada etapa enche sua barra · o site se monta, é ajustado, ganha domínio e vai ao ar. */
  B() {
    st.style.background = 'var(--tinta)';
    const T = sec(PR.total), bx = 110, bw = 880, K = PR.timing, g = sec(PR.steps[1].t);
    /* relógio em dois trechos: a geração da página corre linear (dá para ver montar), o resto arranca e freia no fim */
    const vOf = t => t < K.gen ? g * P(t, K.run[0], K.gen, E.lin) : g + (T - g) * RUN(P(t, K.gen, K.run[1], E.lin));
    const tOf = v => v <= g ? lerp(K.run[0], K.gen, v / g) : lerp(K.gen, K.run[1], invRUN((v - g) / (T - g)));
    const segs = PR.steps.slice(0, -1).map((s, i) => ({ ...s, a: sec(s.t), d: sec(PR.steps[i + 1].t) - sec(s.t) }));
    const cols = ['var(--roxoC)', 'var(--roxo)', 'var(--roxoF)', '#2f9e5b'];
    let acc = 0, bar = '';
    segs.forEach((s, i) => {
      const w = bw * s.d / T, x = bx + bw * acc / T; acc += s.d;
      const m = Math.floor(s.d / 60), r = String(s.d % 60).padStart(2, '0');
      bar += `<div class="abs" style="left:${x}px;top:760px;width:${w - 6}px;height:26px;border-radius:5px;background:#33322f"></div>
        <div class="abs seg" style="left:${x}px;top:760px;width:${w - 6}px;height:26px;border-radius:5px;background:${cols[i]};transform-origin:0 0"></div>
        <div class="abs segl" style="left:${x}px;top:806px;white-space:nowrap"><div style="font-size:19px;font-weight:500;color:#cfccc3">${s.label}</div>
        <div class="mono" style="font-size:17px;color:#8d8a80;margin-top:4px">${m}:${r}</div></div>`;
      if (i) SFX.push({ t: tOf(s.a), id: 'tick', gain: .5 });
    });
    SFX.push({ t: K.run[1], id: 'ding', gain: 1 });
    const BW = 760, s = .76, BXP = 1060, BYP = 230;
    st.innerHTML = `
      <div id="lbl" class="abs mono" style="left:116px;top:200px;font-size:22px;letter-spacing:.18em;color:var(--roxoC)">DO PROMPT AO AR</div>
      <div id="timer" class="abs h mono" style="left:96px;top:240px;font-size:330px;letter-spacing:-.05em;color:#faf9f5"></div>
      <div id="head" class="abs" style="left:116px;top:610px;font-size:46px;font-weight:600;color:#faf9f5;width:820px;line-height:1.2">Do zero ao ar <span style="color:var(--roxoC)">em minutos.</span></div>
      ${bar}
      <div id="br" class="card" style="left:${BXP}px;top:${BYP}px;width:${BW}px;height:${640 * s + 64}px">
        <div class="abs" style="left:22px;top:24px;display:flex;gap:8px"><i style="width:12px;height:12px;border-radius:50%;background:#e6e3da"></i><i style="width:12px;height:12px;border-radius:50%;background:#e6e3da"></i><i style="width:12px;height:12px;border-radius:50%;background:#e6e3da"></i></div>
        <div class="url" style="left:100px;top:14px;height:34px;padding:0 16px;font-size:15px;min-width:220px"><span id="lock" style="opacity:0">🔒</span><span id="urlT"></span></div>
        <div id="badge" class="abs" style="right:18px;top:14px;transform-origin:100% 50%"><span class="live" style="font-size:19px;padding:8px 16px">No ar</span></div>
        <div class="abs" style="left:0;top:64px;width:${BW}px;height:${640 * s}px;overflow:hidden">
          <div id="sk" class="abs" style="inset:0">
            <div class="abs" style="left:34px;top:30px;width:110px;height:18px;border-radius:5px;background:#e7e4da"></div>
            <div class="abs" style="left:34px;top:100px;width:300px;height:34px;border-radius:6px;background:#e7e4da"></div>
            <div class="abs" style="left:34px;top:146px;width:240px;height:34px;border-radius:6px;background:#e7e4da"></div>
            <div class="abs" style="left:34px;top:340px;width:228px;height:48px;border-radius:24px;background:#e7e4da"></div>
            <div class="abs" style="right:30px;top:84px;width:274px;height:320px;border-radius:137px 137px 14px 14px;background:#e7e4da"></div>
          </div>
          <div id="pgw" class="abs" style="left:0;top:0">${page(0, 0, BW / 1000)}</div>
          <div id="esel" class="sel" style="left:30px;top:94px;width:${430 * s + 10}px;height:${170 * s}px"><i></i><i></i><i></i><i></i></div>
        </div>
      </div>`;
    const $ = id => document.getElementById(id);
    const pg = $('pgw').querySelector('.page');
    const el = { timer: $('timer'), head: $('head'), lbl: $('lbl'), br: $('br'), sk: $('sk'), badge: $('badge'), urlT: $('urlT'), lock: $('lock'), esel: $('esel'),
      segs: [...st.querySelectorAll('.seg')], segl: [...st.querySelectorAll('.segl')],
      parts: ['.nav', '.hero', '.sub', '.arch', '.leaf', '.bottle', '.btn'].map(c => pg.querySelector(c)), hero: pg.querySelector('.hero') };
    pg.style.boxShadow = 'none'; pg.style.borderRadius = '0';
    return t => {
      const v = vOf(t);        // segundos no relógio
      const m = Math.floor(v / 60), r = Math.floor(v % 60);
      el.timer.textContent = `${m}:${String(r).padStart(2, '0')}`;
      const tp = P(t, K.run[1], K.run[1] + .35, E.oBack);
      el.timer.style.transform = `scale(${lerp(1, 1.04, Math.sin(Math.PI * clamp(tp)))})`; el.timer.style.transformOrigin = '0 70%';
      el.lbl.style.transform = `translateY(${lerp(18, 0, P(t, 0, .4))}px)`;
      // barras e rótulos
      segs.forEach((sg, i) => {
        const f = clamp((v - sg.a) / sg.d);
        el.segs[i].style.transform = `scaleX(${f.toFixed(4)})`;
        const la = P(v, sg.a - 4, sg.a + 8, E.o3);
        el.segl[i].style.opacity = (.25 + .75 * la).toFixed(3);
        el.segl[i].style.transform = `translateY(${lerp(10, 0, la)}px)`;
      });
      // navegador entra pela direita
      const bi = P(t, 0, .5, E.o3);
      el.br.style.transform = `translateX(${lerp(120, 0, bi)}px)`;
      // site se monta enquanto a "Página gerada" corre (0:00 → 0:40)
      el.parts.forEach((pt, i) => {
        const k = P(v, g * (.05 + i * .12), g * (.3 + i * .12), E.o3);
        pt.style.opacity = k.toFixed(3); pt.style.transform = `translateY(${lerp(16, 0, k)}px)`;
      });
      el.sk.style.opacity = (1 - P(v, g * .7, g, E.lin)).toFixed(3);
      // ajustes: seleção percorre o título e o botão
      const a0 = sec(PR.steps[1].t), a1 = sec(PR.steps[2].t), adj = clamp((v - a0) / (a1 - a0));
      el.esel.style.opacity = (v > a0 && v < a1 ? 1 : 0).toString();
      const hy = adj < .55 ? 94 : lerp(94, 340, E.io3(clamp((adj - .55) / .2)));
      el.esel.style.transform = `translateY(${hy - 94}px)`;
      el.esel.style.width = `${lerp(430 * .76 + 10, 240, E.io3(clamp((adj - .55) / .2)))}px`;
      el.esel.style.height = `${lerp(170 * .76, 56, E.io3(clamp((adj - .55) / .2)))}px`;
      el.hero.style.color = adj > .3 && adj < 1.01 && v > a0 + (a1 - a0) * .3 ? '#5857b0' : '';
      if (v >= a1) el.hero.style.color = '#5857b0';
      // publicar: domínio digitado
      const p0 = sec(PR.steps[3].t), n = Math.round(PR.url.length * clamp((v - p0) / (T - p0 - 6)));
      el.urlT.textContent = v < p0 ? 'carregando…' : PR.url.slice(0, n);
      el.lock.style.opacity = v >= T - 4 ? '1' : '0';
      // no ar
      const bo = P(t, K.run[1], K.run[1] + .4, E.oBack);
      el.badge.style.transform = `scale(${bo.toFixed(4)})`; el.badge.style.opacity = Math.min(1, bo * 2).toFixed(3);
      const ha = P(t, K.run[1] + .1, K.run[1] + .5, E.o3);
      el.head.style.opacity = ha.toFixed(3); el.head.style.transform = `translateY(${lerp(24, 0, ha)}px)`;
    };
  },

  /* C — Pilha: roxo forte, número gigante e três cartões em leque com carimbo de tempo */
  C() {
    st.style.background = 'var(--roxoF)';
    const stamp = (t, x, y, ok) => `<div class="abs mono" style="left:${x}px;top:${y}px;padding:8px 14px;border-radius:999px;font-size:20px;background:${ok ? '#2f9e5b' : 'var(--roxoS)'};color:${ok ? '#fff' : 'var(--roxoF)'};box-shadow:0 10px 24px -10px rgba(0,0,0,.4)">${t}</div>`;
    const last = PR.steps[PR.steps.length - 1];
    st.innerHTML = `
      <div class="abs h" style="left:110px;top:250px;font-size:64px;color:var(--roxoS)">${PR.headline[0]}.</div>
      <div class="abs h" style="left:96px;top:330px;font-size:290px;letter-spacing:-.06em;color:#fff">${PR.big}</div>
      <div class="abs" style="left:116px;top:640px;font-size:26px;font-weight:500;color:var(--roxoS);width:620px;line-height:1.35">Do prompt à página publicada, sem abrir um editor de código.</div>
      <div class="abs" style="left:980px;top:150px;transform:rotate(-7deg)">
        <div class="card" style="left:0;top:0;width:520px;height:200px">${MINI[0]().replace(/font-size:13px/, 'font-size:24px').replace(/font-size:12px/, 'font-size:18px')}</div>
        ${stamp(PR.steps[0].t, 440, -18, false)}</div>
      <div class="abs" style="left:1110px;top:330px;transform:rotate(3deg)">
        <div class="card" style="left:0;top:0;width:560px;height:360px"><div class="abs" style="left:0;top:0">${page(0, 0, .56)}</div></div>
        ${stamp(PR.steps[1].t, 480, -18, false)}</div>
      <div class="abs" style="left:1000px;top:640px;transform:rotate(-2deg)">
        <div class="card" style="left:0;top:0;width:640px;height:150px">
          <div class="url" style="left:28px;top:30px;height:44px;padding:0 20px;font-size:20px">🔒 ${PR.url}</div>
          <div class="abs" style="left:30px;top:94px;font-size:18px;color:var(--tintaS)">Publicado · certificado ativo</div>
          <div class="abs" style="right:28px;top:34px"><span class="live" style="font-size:22px;padding:10px 20px">No ar</span></div></div>
        ${stamp(last.t, 560, -18, true)}</div>`;
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
