/* Ads 03 · connect rate — filme do job ads-03-mvab2akf (editor-studio), 46,6 s, 9:16.
   Uma cena por linha da timeline (r1–r13): I013, M13, M11, M29, M15, I014, M26, M09, M13, M31, M17, M14, M18, com cortina roxa (M10) entre elas.
   Base: sequência completa a 30 fps em assets/seq/NNNNN.jpg (quadro n = t·30 + 1); recorte da pessoa (BiRefNet) em assets/mseq/NNNNN.png
   (lista em mattes.js; usa o recorte mais próximo se faltar algum). ?layer=base|bg|person|gfx exporta uma camada com alfa para o After.
   Números do Gerenciador/Speed são ilustrativos.
   Contrato: window.seek(t) pinta o quadro t, sem estado entre quadros. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, p) => a + (b - a) * p;
const E = { lin: p => p, i2: p => p * p, o3: p => 1 - (1 - p) ** 3, io3: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2,
  oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2, oExpo: p => p >= 1 ? 1 : 1 - 2 ** (-10 * p) };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
const DURATION = 46.61, SFX = [];
const sfx = (t, type, g = 1) => SFX.push({ t: +t.toFixed(3), type, g });
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const rise = (el, t, t0, d = 50) => { const a = P(t, t0, t0 + .3, E.oBack); el.style.transform = `translateY(${lerp(d, 0, a).toFixed(1)}px)`; el.style.opacity = Math.min(1, P(t, t0, t0 + .12, E.lin)).toFixed(3); };
const pop = (el, t, t0, o = '0 50%') => { const a = P(t, t0, t0 + .32, E.oBack); el.style.transformOrigin = o; el.style.transform = `scale(${a.toFixed(4)})`; el.style.opacity = Math.min(1, a * 2).toFixed(3); };

const NFR = 1398, pad = n => String(n).padStart(5, '0');
const frameAt = t => Math.min(NFR, Math.max(1, Math.floor(t * 30 + 1e-6) + 1));
const MATTES = (window.MATTES || []).slice().sort((a, b) => a - b);
const matteFor = fi => MATTES.reduce((b, m) => Math.abs(m - fi) < Math.abs(b - fi) ? m : b, MATTES[0]);
const LAYER = new URLSearchParams(location.search).get('layer');
const GROUPS = { base: ['#rig'], bg: ['#bgCream', '#bgPurple'], person: ['#person'], gfx: ['#scenes', '#wipe'] };
if (LAYER && GROUPS[LAYER]) {
  const st = document.createElement('style');
  st.textContent = `html,body,#stage{background:transparent!important}#stage>*{visibility:hidden!important}` + GROUPS[LAYER].map(g => `${g},${g} *`).join(',') + '{visibility:visible!important}';
  document.head.appendChild(st);
}
let pending = [];
function setImg(el, src) { if (el.dataset.src === src) return; el.dataset.src = src; el.src = src; pending.push(el.decode().catch(() => {})); }

const LOGO = (s = 60) => `<svg width="${s}" height="${s}" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#6f6fc9"/><g fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"><path d="M60 30l30 14-30 14-30-14z"/><path d="M30 60l30 14 30-14"/><path d="M30 75l30 14 30-14"/></g></svg>`;
const WORD = '<span><b>insula</b>build</span>';
const CURSOR = (s = 70) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#1f1e1d" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

/* cenas: a–b da timeline, fundo (video | cream | dots | purple), pessoa recortada (escala) e pintura da peça */
const T = [0, 1.92, 3.05, 6.72, 12.03, 14.11, 17.92, 23.79, 26.83, 30.0, 33.6, 38.07, 42.33, DURATION];
const SC = [];
function scene(id, i, bg, person, build, paint) {
  const root = document.createElement('div'); root.className = 'sc'; root.id = 's-' + id; $('#scenes').appendChild(root);
  root.innerHTML = build(root) || root.innerHTML;
  SC.push({ id, a: T[i], b: T[i + 1], bg, person, root, paint, q: s => root.querySelector(s) });
}

/* r1 · I013 Connect rate no Gerenciador (look A) */
scene('r1', 0, 'video', 0, () => {
  const row = (y, l, id, strong) => `<div class="row rw" style="top:${y}px;height:${strong ? 190 : 150}px;background:${strong ? 'var(--roxoF)' : 'rgba(250,249,245,.96)'}">
    <div class="abs" style="left:40px;top:${strong ? 36 : 28}px;font-size:${strong ? 30 : 28}px;font-weight:600;color:${strong ? '#d9d8f5' : 'var(--tintaS)'}">${l}</div>
    <div class="abs" style="left:40px;top:${strong ? 82 : 70}px;font-size:20px;color:${strong ? '#bdbcec' : 'var(--apag)'}">Últimos 7 dias</div>
    <div id="${id}" class="abs h" style="right:44px;top:${strong ? 40 : 36}px;font-size:${strong ? 120 : 84}px;font-weight:800;letter-spacing:-.035em;line-height:.92;font-variant-numeric:tabular-nums;color:${strong ? '#fff' : 'var(--tinta)'}"></div></div>`;
  return `<div class="abs h tt" style="left:80px;top:250px;font-size:104px;font-weight:800;letter-spacing:-.035em;line-height:.92;white-space:pre;text-shadow:0 8px 40px rgba(0,0,0,.45)"><span style="background:var(--roxoF);padding:0 22px 14px;border-radius:20px">connect</span>\nrate</div>
    <div class="chip pn" style="left:80px;top:1000px;padding:12px 24px;font-size:24px;background:rgba(18,18,17,.82);color:#cfccc3">Gerenciador de Anúncios</div>
    ${row(1068, 'Cliques no link', 'n1')}${row(1240, 'Visualizações da página', 'n2')}${row(1412, 'Connect rate', 'n3', 1)}`;
}, (t, u, o) => {
  const q = o.q; o.root.style.opacity = (1 - P(t, o.b - .1, o.b, E.lin)).toFixed(3);
  rise(q('.tt'), t, .05, -40); q('.pn').style.opacity = P(t, .05, .25, E.lin);
  o.root.querySelectorAll('.rw').forEach((r, i) => { const p = P(t, .15 + i * .1, .55 + i * .1); r.style.opacity = Math.min(1, p * 1.6); r.style.transform = `translateY(${lerp(70, 0, p)}px)`; });
  const k = P(t, .15, .55); q('#n1').textContent = fmt(1000 * k); q('#n2').textContent = fmt(612 * k);
  q('#n3').textContent = (61.2 * P(t, .6, 1.1)).toFixed(1).replace('.', ',') + '%';
});

/* r2 · M13 Bloco de marca "PAGOU?" */
scene('r2', 1, 'purple', .92, () => `<div class="abs logo" style="top:250px;left:70px;color:#fff;display:flex;align-items:center;gap:16px;font-family:Comfortaa;font-size:44px">${LOGO(56)}${WORD}</div>
  <div class="hw w1" style="left:0;top:1230px;font-size:260px;color:#fff;transform-origin:50% 60%">pagou?</div>`,
(t, u, o) => { const a = P(t, o.a + .1, o.a + .5, E.oBack); o.q('.w1').style.transform = `scale(${lerp(1.3, 1, a)})`; o.q('.w1').style.opacity = Math.min(1, a * 2); });

/* r3 · M11 Mockup de página em tela cheia: a página abre */
scene('r3', 2, 'cream', 0, () => `<div class="hk" style="top:250px;font-size:150px">abre\n<b>rápido.</b></div>
  <div class="abs pg" style="left:90px;top:640px;width:900px;height:880px;background:#fff;border-radius:22px;border:3px solid var(--roxo);box-shadow:0 30px 80px -30px rgba(31,30,29,.35);overflow:hidden">
    <div class="abs ld" style="left:0;top:0;height:10px;background:var(--roxoF)"></div>
    <div class="abs" style="left:50px;top:50px;width:200px;height:26px;border-radius:13px;background:var(--roxoS)"></div>
    <div class="abs" style="left:50px;top:130px;width:520px;height:46px;border-radius:12px;background:#d9d8f5"></div><div class="abs" style="left:50px;top:200px;width:420px;height:46px;border-radius:12px;background:#d9d8f5"></div>
    <div class="abs" style="left:50px;top:290px;width:480px;height:16px;border-radius:8px;background:var(--borda)"></div><div class="abs" style="left:50px;top:326px;width:400px;height:16px;border-radius:8px;background:var(--borda)"></div>
    <div class="abs btn" style="left:50px;top:400px;width:260px;height:70px;border-radius:999px;background:var(--roxoF)"></div>
    <div class="abs" style="right:50px;top:110px;width:260px;height:380px;border-radius:130px 130px 18px 18px;background:#f3dccd"></div>
    <div class="abs" style="left:50px;top:560px;width:800px;height:230px;border-radius:20px;background:var(--roxoS)"></div></div>
  <div class="chip dv" style="left:90px;top:560px;padding:12px 24px;font-size:26px;background:var(--tinta);color:#fff">celular · desktop</div>`,
(t, u, o) => { const p = P(t, o.a + .2, o.a + 1.4, E.io3); o.q('.ld').style.width = (900 * p) + 'px'; o.q('.pg').style.transform = `scale(${lerp(.94, 1, P(t, o.a, o.a + .35))})`; o.q('.pg').style.opacity = P(t, o.a, o.a + .2, E.lin); });

/* r4 · M29 Lista que pula pro próximo */
scene('r4', 3, 'video', 0, () => `<div class="abs" style="left:0;right:0;top:860px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.5) 40%)"></div>
  <div class="card cd" style="left:60px;top:960px;width:960px;padding:40px;display:flex;flex-direction:column;gap:20px;overflow:visible">
    <div class="mono">Depois do clique</div>
    <div class="res r0"><div class="u">suapagina.com.br</div><div class="t">Sua página demora <span class="x" style="color:#e0443a">✕</span></div></div>
    <div class="res r1"><div class="u">concorrente.com.br</div><div class="t">Abre na hora <span class="nx" style="color:var(--roxoF)">→ o clique vai embora</span></div></div>
    <div><span class="chipR cp">−1 clique pago · perdido</span></div></div>`,
(t, u, o) => { const q = o.q, a = o.a; rise(q('.cd'), t, a + .05, 120);
  const f = P(t, a + 2.0, a + 2.3), n = P(t, a + 2.9, a + 3.2);
  q('.r0').style.opacity = 1 - .55 * f; q('.x').style.opacity = f; q('.r1').style.borderColor = n > .5 ? 'var(--roxoF)' : 'transparent'; q('.nx').style.opacity = n;
  const c = P(t, a + 3.8, a + 4.1, E.oBack); q('.cp').style.display = 'inline-flex'; q('.cp').style.transform = `scale(${c})`; q('.cp').style.transformOrigin = '0 50%'; q('.cp').style.opacity = Math.min(1, c * 2); });

/* r5 · M15 Riscado com peças: plugins */
const PUZ = c => `<svg width="190" height="190" viewBox="0 0 100 100"><path d="M10 30h22a12 12 0 1 1 24 0h22v22a12 12 0 1 0 0 24v18H56a12 12 0 1 0-24 0H10z" fill="${c}"/></svg>`;
scene('r5', 4, 'cream', .8, () => `<div class="hw k1" style="top:250px;font-size:84px;color:var(--tinta)">sem estrutura extra,</div>
  <div class="hw k2" style="top:350px;font-size:190px;color:var(--tinta)">plugins</div>
  <div class="abs kx" style="left:130px;top:470px;width:820px;height:24px;border-radius:12px;background:var(--roxo);transform-origin:0 50%;rotate:-3deg"></div>
  <div class="abs pz" style="left:80px;top:600px;rotate:-14deg;filter:drop-shadow(0 20px 24px rgba(31,30,29,.3))">${PUZ('#c9c7bd')}</div>
  <div class="abs pz" style="left:810px;top:580px;rotate:18deg;filter:drop-shadow(0 20px 24px rgba(31,30,29,.3))">${PUZ('#b9b7ad')}</div>`,
(t, u, o) => { const a = o.a; rise(o.q('.k1'), t, a + .05, 40); rise(o.q('.k2'), t, a + .2, 70); o.q('.kx').style.transform = `scaleX(${P(t, a + .9, a + 1.15)})`;
  o.root.querySelectorAll('.pz').forEach((el, i) => { const p = P(t, a + .4 + i * .15, a + .8 + i * .15, E.oBack); el.style.opacity = Math.min(1, p * 2); el.style.transform = `translateY(${lerp(60, 0, p) + Math.sin((t - a) * 2 + i) * 10}px) scale(${p})`; }); });

/* r6 · I014 Medidor Speed 99/100 (look A) */
const RING = (id, size, s, track) => { const r = (size - s) / 2, c = 2 * Math.PI * r; return `<svg class="${id}" width="${size}" height="${size}" style="position:absolute;left:0;top:0;transform:rotate(-90deg)"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${s}"/><circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2fbf6b" stroke-width="${s}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-c="${c}"/></svg>`; };
scene('r6', 5, 'video', 0, () => `<div class="abs" style="left:0;right:0;top:760px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.5) 35%)"></div>
  <div class="hk tt" style="top:250px;font-size:112px;color:#fff;font-weight:800;text-shadow:0 8px 40px rgba(0,0,0,.45)"><span style="background:var(--roxoF);padding:0 22px 14px;border-radius:20px">Speed</span>\nsubiu.</div>
  <div class="card cd" style="left:140px;top:1020px;width:800px;height:480px;border-radius:36px">
    <div class="abs" style="left:50px;top:44px;font-size:30px;font-weight:600;color:var(--tintaS)">Speed · celular</div>
    <div class="abs" style="left:60px;top:130px;width:300px;height:300px">${RING('rg', 300, 30, 'var(--roxoS)')}<div class="abs nm" style="left:0;top:96px;width:300px;text-align:center;font-size:110px;font-weight:800;letter-spacing:-.035em;line-height:.92;font-variant-numeric:tabular-nums"></div></div>
    <div class="abs" style="left:400px;top:170px;font-size:84px;font-weight:800;letter-spacing:-.035em;line-height:.92;white-space:pre;color:var(--tinta)">de 100\n<span style="color:#2fbf6b">no verde</span></div>
    <div class="chip" style="left:400px;top:372px;padding:12px 24px;font-size:26px;background:var(--roxoS);color:var(--roxoF)">medido pela plataforma</div></div>`,
(t, u, o) => { const a = o.a; rise(o.q('.tt'), t, a + .05, -40); rise(o.q('.cd'), t, a + .15, 80);
  const v = 99 * P(t, a + .4, a + 1.3), arc = o.q('.arc'), c = +arc.dataset.c; arc.style.strokeDashoffset = c * (1 - v / 100); o.q('.nm').textContent = Math.round(v); });

/* r7 · M26 Painel (reveal): cliques → visualizações → connect rate */
scene('r7', 6, 'video', 0, () => {
  const M = [['Cliques no link', '1.000', 1000], ['Visualizações da página', '820', 820], ['Connect rate', '82%', 82]];
  return `<div class="abs" style="left:0;right:0;top:860px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.55) 40%)"></div>
  <div class="chip chd" style="left:90px;top:968px;padding:10px 20px;font-size:22px;background:var(--roxo);color:#fff">Gerenciador · Últimos 7 dias</div>
  ${M.map((m, i) => `<div class="card cw" style="left:90px;top:${1040 + i * 158}px;width:900px;height:136px;border-radius:22px;overflow:hidden">
    <div class="abs" style="left:36px;top:30px;font-size:26px;font-weight:500;color:var(--tintaS)">${m[0]}</div><div class="abs" style="left:36px;top:70px;font-size:20px;color:var(--apag)">Últimos 7 dias</div>
    <div class="abs nv" data-n="${m[2]}" data-s="${i === 2 ? '%' : ''}" style="right:40px;top:28px;font-size:84px;font-weight:800;letter-spacing:-.035em;line-height:.92;font-variant-numeric:tabular-nums;color:${i === 2 ? 'var(--roxoF)' : 'var(--tinta)'}"></div></div>`).join('')}`; },
(t, u, o) => { const a = o.a; o.q('.chd').style.opacity = P(t, a, a + .2, E.lin);
  o.root.querySelectorAll('.cw').forEach((el, i) => { const s = a + .1 + i * .8, p = P(t, s, s + .4); el.style.opacity = Math.min(1, p * 1.6); el.style.transform = `translateY(${lerp(60, 0, p)}px)`;
    const nv = el.querySelector('.nv'), k = P(t, s, s + .9); nv.textContent = fmt(+nv.dataset.n * k) + nv.dataset.s; }); });

/* r8 · M09 Palavra-chave + objetos: "cada clique custou dinheiro" */
const COIN = `<svg width="170" height="170" viewBox="0 0 100 100"><defs><radialGradient id="cg" cx=".35" cy=".3"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e0a82a"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#cg)" stroke="#c98f1c" stroke-width="4"/><text x="50" y="63" text-anchor="middle" font-family="Inter" font-weight="800" font-size="36" fill="#a8720f">R$</text></svg>`;
scene('r8', 7, 'cream', .8, () => `<div class="hw w1" style="top:240px;font-size:84px;color:var(--tinta)">cada clique custou</div>
  <div class="hw w2" style="top:340px;font-size:200px;color:var(--tinta)"><span style="background:var(--roxo);color:#fff;padding:0 .12em .06em;border-radius:.14em">dinheiro.</span></div>
  <div class="abs cn" style="left:70px;top:760px;rotate:-16deg;filter:drop-shadow(0 20px 24px rgba(31,30,29,.3))">${COIN}</div>
  <div class="abs cn" style="left:850px;top:700px;rotate:14deg;filter:drop-shadow(0 20px 24px rgba(31,30,29,.3))">${COIN}</div>`,
(t, u, o) => { const a = o.a; rise(o.q('.w1'), t, a + .05, 40); rise(o.q('.w2'), t, a + .45, 80);
  o.root.querySelectorAll('.cn').forEach((el, i) => { const p = P(t, a + .7 + i * .2, a + 1.1 + i * .2, E.oBack); el.style.opacity = Math.min(1, p * 2); el.style.transform = `translateY(${lerp(60, 0, p) + Math.sin((t - a) * 2.2 + i * 2) * 10}px) scale(${p})`; }); });

/* r9 · M13 Bloco de marca: logo e marca Insula Build */
scene('r9', 8, 'purple', .92, () => `<div class="abs lg" style="left:0;top:240px;width:1080px;display:flex;justify-content:center;align-items:center;gap:22px;font-family:Comfortaa;font-size:78px;color:#fff">${LOGO(104)}${WORD}</div>
  <div class="hw w1" style="top:1300px;font-size:130px;color:#fff;transform-origin:50% 60%">pronta pra\n<span style="color:var(--roxoS)">tráfego.</span></div>`,
(t, u, o) => { const a = o.a; rise(o.q('.lg'), t, a + .05, -40); const k = P(t, a + .45, a + .8, E.oBack); o.q('.w1').style.transform = `scale(${lerp(1.25, 1, k)})`; o.q('.w1').style.opacity = Math.min(1, k * 2); });

/* r10 · M31 Três páginas: bonitas, personalizadas, prontas para tráfego */
const PAGE = sel => `<div class="page${sel ? ' sel' : ''}" style="width:290px;position:absolute;left:0;top:0">${sel ? '<div class="hdl" style="left:-17px;top:-17px"></div><div class="hdl" style="right:-17px;bottom:-17px"></div>' : ''}<div class="hd"></div><div class="hero"></div><div class="ln"></div><div class="ln s"></div><div class="ln"></div><div class="ln s" style="margin-bottom:20px"></div></div>`;
const L10 = ['bonitas', 'personalizadas', 'para tráfego'];
scene('r10', 9, 'dots', .78, () => `<div class="abs lg" style="left:70px;top:250px;display:flex;align-items:center;gap:16px;font-family:Comfortaa;font-size:44px;color:var(--tinta)">${LOGO(56)}${WORD}</div>
  <div class="hk hh" style="top:330px;font-size:112px">páginas\n<b>prontas.</b></div>
  ${[0, 1, 2].map(i => `<div class="abs pgx" style="left:${70 + i * 320}px;top:${1130 + (i === 1 ? 0 : 20)}px;width:290px;height:300px;perspective:1400px">${PAGE(i === 1)}</div><div class="lblP lb" style="left:${70 + i * 320}px;top:${1450 + (i === 1 ? 0 : 20)}px;width:290px">${L10[i]}</div>`).join('')}`,
(t, u, o) => { const a = o.a; rise(o.q('.lg'), t, a + .05, 30); rise(o.q('.hh'), t, a + .15, 70);
  o.root.querySelectorAll('.pgx').forEach((el, i) => { const p = P(t, a + .5 + i * .3, a + .9 + i * .3, E.oBack); el.style.transform = `translateY(${lerp(140, 0, p)}px) rotateY(${[14, 0, -14][i]}deg)`; el.style.opacity = Math.min(1, p * 2); });
  o.root.querySelectorAll('.lb').forEach((el, i) => rise(el, t, a + 1.0 + i * .5, 24)); });

/* r11 · M17 Ícones de integração: via MCP */
scene('r11', 10, 'cream', .78, () => `<div class="hw v1" style="top:240px;font-size:84px;color:var(--tinta)">IA via</div>
  <div class="hw v2" style="top:300px;font-size:300px;color:var(--roxoF)">MCP</div>
  <div class="abs ics" style="left:0;top:1360px;width:1080px;display:flex;justify-content:center;gap:50px">
    <div class="ic" style="text-align:center"><div style="width:130px;height:130px;border-radius:32px;background:#fff;box-shadow:0 18px 40px -14px rgba(31,30,29,.4);display:grid;place-items:center">${LOGO(90)}</div><div style="margin-top:12px;font-size:26px;font-weight:700;color:var(--tinta)">Insula Build</div></div>
    <div class="ic" style="text-align:center"><div style="width:130px;height:130px;border-radius:32px;background:#d97757;box-shadow:0 18px 40px -14px rgba(31,30,29,.4);display:grid;place-items:center"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg></div><div style="margin-top:12px;font-size:26px;font-weight:700;color:var(--tinta)">Claude</div></div>
    <div class="ic" style="text-align:center"><div style="width:130px;height:130px;border-radius:32px;background:var(--tinta);box-shadow:0 18px 40px -14px rgba(31,30,29,.4);display:grid;place-items:center;color:#fff;font-family:'JetBrains Mono';font-weight:700;font-size:44px">&gt;_</div><div style="margin-top:12px;font-size:26px;font-weight:700;color:var(--tinta)">Codex</div></div></div>`,
(t, u, o) => { const a = o.a; rise(o.q('.v1'), t, a + .05, 30); const k = P(t, a + .15, a + .5, E.oExpo); o.q('.v2').style.transform = `scale(${lerp(1.25, 1, k)})`; o.q('.v2').style.opacity = P(t, a + .15, a + .25, E.lin);
  o.root.querySelectorAll('.ic').forEach((el, i) => { const p = P(t, a + .8 + i * .3, a + 1.2 + i * .3, E.oBack); el.style.transform = `translateY(${lerp(80, 0, p)}px) scale(${p})`; el.style.opacity = Math.min(1, p * 2); }); });

/* r12 · M14 Arrastar pixel a pixel */
scene('r12', 11, 'grid', .78, () => `<div class="hk hh" style="top:250px;font-size:124px">pixel a\n<b>pixel.</b></div>
  <div class="abs gh" style="left:640px;top:520px;width:300px;height:190px;border-radius:20px;background:var(--roxoS);box-shadow:inset 0 0 0 3px var(--roxo)"></div>
  <div class="abs bt" style="left:90px;top:1280px;height:92px;padding:0 44px;border-radius:999px;background:var(--roxoF);color:#fff;font-size:38px;font-weight:700;display:flex;align-items:center;box-shadow:0 0 0 4px #fff,0 0 0 7px var(--roxo)">Clique aqui</div>
  <div class="chip xy" style="left:90px;top:1190px;padding:10px 22px;font-size:24px;background:var(--tinta);color:#fff;font-family:'JetBrains Mono';font-weight:700"></div>
  <div class="abs cu" style="left:0;top:0">${CURSOR(80)}</div>`,
(t, u, o) => { const a = o.a; rise(o.q('.hh'), t, a + .05, 60); const d = P(t, a + .6, a + 1.9, E.io3), x = lerp(90, 440, d), y = lerp(1280, 1100, d);
  o.q('.bt').style.left = x + 'px'; o.q('.bt').style.top = y + 'px'; o.q('.cu').style.transform = `translate(${x + 190}px,${y + 56}px)`;
  o.q('.xy').style.left = x + 'px'; o.q('.xy').style.top = (y - 100) + 'px'; o.q('.xy').textContent = `X ${Math.round(x * 2)} · Y ${Math.round(y)}`; o.q('.gh').style.opacity = P(t, a + .2, a + .5, E.lin); });

/* r13 · M18 CTA de oferta */
scene('r13', 12, 'purple', .85, () => `<div class="abs lg" style="left:0;top:240px;width:1080px;display:flex;justify-content:center;align-items:center;gap:22px;font-family:Comfortaa;font-size:70px;color:#fff">${LOGO(96)}${WORD}</div>
  <div class="hw w1" style="top:930px;font-size:190px;color:#fff;text-align:left;left:70px;line-height:.86;text-shadow:0 10px 40px rgba(31,30,160,.35)">7 dias\ngrátis</div>
  <div class="abs cal" style="left:800px;top:560px;width:170px;height:190px;border-radius:30px;background:#fff;box-shadow:0 20px 40px -14px rgba(0,0,0,.4);overflow:hidden;transform-origin:50% 100%"><div style="height:56px;background:#e0443a"></div><div style="text-align:center;font-size:104px;font-weight:800;color:var(--tinta);line-height:1;margin-top:8px">7</div></div>
  <div class="pill bn" style="left:70px;top:1340px;width:600px;height:110px;justify-content:center;font-size:48px;background:#fff;color:var(--roxoF)">Clique aqui</div>
  <div class="abs ft" style="left:76px;top:1470px;font-size:30px;font-weight:600;color:#ecebfa">sem cartão · insulabuild.com</div>
  <div class="abs cu" style="left:0;top:0;transform-origin:0 0">${CURSOR(86)}</div>`,
(t, u, o) => { const a = o.a; rise(o.q('.lg'), t, a + .05, -40); rise(o.q('.w1'), t, a + .3, 90); pop(o.q('.cal'), t, a + .6, '50% 100%'); pop(o.q('.bn'), t, a + 1.0);
  const c = P(t, a + 1.4, a + 2.3, E.io3); o.q('.cu').style.transform = `translate(${lerp(900, 560, c)}px,${lerp(1700, 1420, c)}px)`; o.q('.cu').style.opacity = P(t, a + 1.4, a + 1.55, E.lin); rise(o.q('.ft'), t, a + 1.2, 20); });

/* cortina roxa (M10) em cada troca de cena */
function paintWipe(t) {
  const w = $('#wipe'); let x = null;
  for (let i = 1; i < SC.length; i++) { const B = SC[i].a;
    if (t >= B - .14 && t < B) x = lerp(-1080, 0, E.io3((t - (B - .14)) / .14));
    else if (t >= B && t < B + .16) x = lerp(0, 1080, E.io3((t - B) / .16)); }
  w.style.display = x === null ? 'none' : 'block'; if (x !== null) w.style.transform = `translateX(${x.toFixed(1)}px)`;
}
SC.slice(1).forEach(s => sfx(s.a - .12, 'whoosh', .22));
/* SFX por cena: [cena, deslocamento a partir do início da cena, tipo, ganho] */
[['r1', .05, 'boom', .45], ['r1', .15, 'tick', .5], ['r1', .6, 'click', .7],
 ['r2', .1, 'thud', .8], ['r3', .2, 'pop', .5],
 ['r4', .05, 'pop', .6], ['r4', 2.0, 'click', .7], ['r4', 2.9, 'pop', .5], ['r4', 3.8, 'thud', .6],
 ['r5', .2, 'pop', .5], ['r5', .9, 'strike', .9],
 ['r6', .15, 'pop', .6], ['r6', .4, 'tick', .5], ['r6', 1.3, 'ding', .7],
 ['r7', .1, 'pop', .5], ['r7', .9, 'pop', .5], ['r7', 1.7, 'pop', .6],
 ['r8', .45, 'pop', .6], ['r8', .7, 'pop', .4], ['r8', .9, 'pop', .4],
 ['r9', .45, 'thud', .8], ['r10', .5, 'pop', .5], ['r10', .8, 'pop', .5], ['r10', 1.1, 'pop', .5],
 ['r11', .15, 'thud', .7], ['r11', .8, 'pop', .5], ['r11', 1.1, 'pop', .5], ['r11', 1.4, 'pop', .5],
 ['r12', .6, 'click', .6], ['r12', 1.9, 'click', .6],
 ['r13', .3, 'pop', .6], ['r13', .6, 'pop', .5], ['r13', 1.0, 'pop', .6], ['r13', 2.3, 'click', 1]]
  .forEach(([id, d, k, g]) => sfx(SC.find(s => s.id === id).a + d, k, g));

/* para o After: títulos de cada cena medidos no quadro do storyboard (texto, tamanho, cor, caixa, alinhamento) */
window.TITLES_SPEC = async () => {
  const out = [];
  for (const s of SC) {
    await window.seek(Math.min(s.b - .05, s.a + 2.2));
    s.root.querySelectorAll('.hk, .hw, .tt').forEach(el => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      out.push({ scene: s.id, a: s.a, b: s.b, text: el.innerText, size: parseFloat(cs.fontSize), color: cs.color,
        align: cs.textAlign === 'center' ? 'center' : 'left', x: r.left, y: r.top, w: r.width, h: r.height, lh: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * .92 });
    });
  }
  return out;
};

function paint(t) {
  pending = [];
  const cur = SC.find(s => t >= s.a && t < s.b) || SC[SC.length - 1];
  const fi = frameAt(t); setImg($('#vid'), `assets/seq/${pad(fi)}.jpg`);
  $('#rig').style.display = cur.bg === 'video' ? 'block' : 'none';
  $('#shade').style.opacity = '0';
  $('#bgCream').style.display = cur.bg === 'cream' || cur.bg === 'dots' || cur.bg === 'grid' ? 'block' : 'none'; $('#bgCream').classList.toggle('dots', cur.bg === 'dots'); $('#bgCream').classList.toggle('grid', cur.bg === 'grid');
  $('#bgPurple').style.display = cur.bg === 'purple' ? 'block' : 'none';
  const pe = $('#person');
  if (cur.person) { pe.style.display = 'block'; pe.style.transform = `scale(${cur.person})`; pe.style.filter = 'drop-shadow(0 30px 60px rgba(31,30,29,.28))'; setImg(pe, `assets/mseq/${pad(matteFor(fi))}.png`); } else pe.style.display = 'none';
  SC.forEach(s => { s.root.style.display = s === cur ? 'block' : 'none'; });
  cur.paint(t, t - cur.a, { ...cur, a: cur.a, b: cur.b });
  /* cenas com pessoa: peça por cima da pessoa; r1/r4/r6/r7 são sobre o vídeo */
  paintWipe(t);
}
window.DURATION = DURATION; window.FPS = 30; window.SFX = SFX;
window.seek = async t => { paint(t); await Promise.all(pending); };
window.__ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['800 40px Inter', '700 40px Inter', '600 40px Inter', '500 24px "JetBrains Mono"', '700 44px Comfortaa'].map(f => document.fonts.load(f)));
  await window.seek(0);
})();
})();
