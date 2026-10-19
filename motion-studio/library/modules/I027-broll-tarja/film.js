(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp, el, px } = K;
const AM = '#FFD21F', INK = '#111';
/* caixas dos três slots (broll1..3), todas dentro de x 65–1015, y 270–1248 */
const BOX = { 1: { x: 65, y: 280, w: 480, h: 270 }, 2: { x: 680, y: 660, w: 335, h: 440 }, 3: { x: 65, y: 890, w: 560, h: 350 } }[PR.slot];

/* cenas provisórias em SVG, em tons de arquivo colorido (sépia + cor suave) */
const SCENES = {
  estudo: `<rect width="400" height="300" fill="#c98f4a"/><rect y="170" width="400" height="130" fill="#6b3f1f"/><rect x="250" y="20" width="110" height="130" fill="#e9d29a"/><path d="M255 25h100M255 85h100M305 25v125" stroke="#8a5a2b" stroke-width="5"/>
    <path d="M60 170h280v18H60z" fill="#3e2411"/><rect x="95" y="128" width="95" height="14" fill="#a33b2b"/><rect x="100" y="114" width="85" height="14" fill="#2f5d6e"/><rect x="92" y="142" width="105" height="28" fill="#d8b46a"/>
    <path d="M250 170l-20-70 28-4 12 74z" fill="#d9c07c"/><circle cx="262" cy="92" r="26" fill="#f4dc8f" opacity=".9"/>
    <circle cx="150" cy="86" r="17" fill="#2a1a10"/><path d="M118 172c4-48 54-48 64 0z" fill="#2a1a10"/>`,
  sono: `<rect width="400" height="300" fill="#2f4a7a"/><circle cx="300" cy="75" r="38" fill="#f0dca0"/><circle cx="318" cy="66" r="34" fill="#2f4a7a"/>
    <g fill="#f0dca0"><circle cx="70" cy="50" r="3"/><circle cx="150" cy="95" r="2.5"/><circle cx="210" cy="40" r="3"/><circle cx="360" cy="150" r="2.5"/></g>
    <rect y="190" width="400" height="110" fill="#5a2f3a"/><rect x="40" y="165" width="320" height="60" rx="14" fill="#c88f6a"/><rect x="40" y="165" width="90" height="48" rx="18" fill="#efe0c0"/><path d="M130 182c40-26 150-22 230 12v30H130z" fill="#7a4a8a"/><circle cx="85" cy="186" r="19" fill="#e6b890"/>`,
  treino: `<rect width="400" height="300" fill="#3f6b4a"/><rect y="215" width="400" height="85" fill="#7a5a2a"/><rect x="40" y="70" width="320" height="10" fill="#d9c07c"/>
    <rect x="52" y="48" width="22" height="54" rx="4" fill="#222"/><rect x="326" y="48" width="22" height="54" rx="4" fill="#222"/><rect x="34" y="58" width="14" height="34" rx="3" fill="#333"/><rect x="352" y="58" width="14" height="34" rx="3" fill="#333"/>
    <circle cx="200" cy="118" r="20" fill="#c98a5a"/><path d="M168 215c0-62 14-84 32-84s32 22 32 84z" fill="#b83a2e"/><path d="M176 140L110 78M224 140L290 78" stroke="#c98a5a" stroke-width="16" stroke-linecap="round"/><path d="M180 215l-8 70M220 215l8 70" stroke="#2f3f5a" stroke-width="18" stroke-linecap="round"/>`,
};
const photo = (parent, css) => {
  const d = el('div', px({ position: 'absolute', overflow: 'hidden', background: '#8a6a3a', ...css }), '', parent);
  if (PR.img) el('img', 'width:100%;height:100%;object-fit:cover', '', d).src = PR.img;
  else el('div', 'position:absolute;inset:0', `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">${SCENES[PR.tema]}</svg>`, d);
  /* tom de arquivo colorido: sépia por cima + vinheta + grão fixo */
  el('div', 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(120,70,20,.28),rgba(30,15,5,.30));mix-blend-mode:multiply', '', d);
  el('div', 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(0,0,0,.45))', '', d);
  el('div', "position:absolute;inset:0;opacity:.22;mix-blend-mode:overlay", '<svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1.2 -.1"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>', d);
  return d;
};
const tarjaHTML = () => '<span style="white-space:pre">' + PR.tarja.split(' ').map(w => w === PR.hi ? `<span style="color:${AM}">${w}</span>` : w).join(' ') + '</span>';
const tarja = (parent, css) => el('div', px({ position: 'absolute', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-.01em', whiteSpace: 'nowrap', ...css }), tarjaHTML(), parent);
const fit = (node, maxW, size) => { node.style.fontSize = size + 'px'; const w = node.firstElementChild ? node.firstElementChild.offsetWidth : node.scrollWidth; if (w > maxW) node.style.fontSize = Math.floor(size * maxW / w) + 'px'; };
const scene = st => { // só no preview: fundo âmbar e silhueta da pessoa
  if (!PR.cena) return;
  el('div', 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,#6b3f1a,#1e1008 70%)', '', st);
  el('div', 'position:absolute;left:300px;top:560px;width:480px;height:1360px', '<svg viewBox="0 0 480 1360" width="480" height="1360"><ellipse cx="240" cy="170" rx="118" ry="150" fill="#120a05"/><path d="M0 520c0-170 110-250 240-250s240 80 240 250v840H0z" fill="#120a05"/></svg>', st);
};
const entry = (t, a = 0) => P(t, a, a + .55, E.oBack);

const looks = {
  A(st) { // polaroid com fita, tarja preta embaixo
    scene(st);
    const c = el('div', px({ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, background: '#f4ecd8', borderRadius: 8, boxShadow: '0 36px 70px -24px rgba(0,0,0,.7)', transformOrigin: '50% 100%' }), '', st);
    const pad = Math.round(BOX.w * .045);
    photo(c, { left: pad, top: pad, right: pad, bottom: Math.round(BOX.h * .3) });
    const tp = tarja(c, { left: pad, right: pad, bottom: Math.round(BOX.h * .05), height: Math.round(BOX.h * .19), background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    fit(tp, BOX.w - pad * 2 - 30, Math.round(BOX.h * .14));
    el('div', px({ position: 'absolute', left: BOX.w / 2 - 60, top: -22, width: 120, height: 40, background: 'rgba(255,210,31,.8)', transform: 'rotate(-4deg)' }), '', c);
    return t => { const a = entry(t); c.style.opacity = Math.min(1, a * 1.6); c.style.transform = `translateY(${lerp(90, 0, a)}px) rotate(${lerp(-8, -2, a)}deg) scale(${lerp(.85, 1, a)})`; tp.style.clipPath = `inset(0 ${100 - 100 * P(t, .35, .8, E.io3)}% 0 0)`; };
  },
  B(st) { // cartão arredondado com tarja amarela sobre a base da imagem
    scene(st);
    const c = el('div', px({ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, borderRadius: 34, overflow: 'hidden', boxShadow: '0 40px 80px -26px rgba(0,0,0,.75)' }), '', st);
    photo(c, { inset: 0 });
    const th = Math.round(BOX.h * .2);
    const tp = tarja(c, { left: 0, right: 0, bottom: 0, height: th, background: AM, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' });
    tp.innerHTML = '<span style="white-space:pre">' + PR.tarja + '</span>'; fit(tp, BOX.w - 50, Math.round(th * .62));
    return t => { const a = entry(t); c.style.opacity = Math.min(1, a * 1.6); c.style.transform = `translateX(${lerp(PR.slot === 2 ? 120 : -120, 0, a)}px) scale(${lerp(.9, 1, a)})`; tp.style.transform = `translateY(${lerp(100, 0, P(t, .3, .75, E.oBack))}%)`; };
  },
  C(st) { // fotograma de filme: perfurações nas laterais, tarja preta com texto amarelo sobre a imagem
    scene(st);
    const c = el('div', px({ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, background: '#0d0d0d', borderRadius: 10, boxShadow: '0 40px 80px -26px rgba(0,0,0,.75)', transformOrigin: '0 100%' }), '', st);
    const pw = Math.round(BOX.w * .07);
    photo(c, { left: pw, right: pw, top: 14, bottom: 14 });
    const hole = n => { for (let i = 0; i < n; i++) for (const side of [0, 1]) el('div', px({ position: 'absolute', [side ? 'right' : 'left']: Math.round(pw * .28), top: 20 + i * (BOX.h - 40) / n, width: Math.round(pw * .44), height: Math.round((BOX.h - 40) / n * .55), background: '#f4ecd8', borderRadius: 3 }), '', c); };
    hole(7);
    const tp = tarja(c, { left: pw, bottom: Math.round(BOX.h * .12), padding: `${Math.round(BOX.h * .03)}px ${Math.round(BOX.h * .05)}px`, background: 'rgba(10,10,10,.92)', color: '#fff' });
    fit(tp, BOX.w - pw * 2 - 40, Math.round(BOX.h * .12));
    return t => { const a = entry(t); c.style.opacity = Math.min(1, a * 1.6); c.style.transform = `rotate(${lerp(6, 2.5, a)}deg) scale(${lerp(.8, 1, a)})`; tp.style.transform = `translateX(${lerp(-60, 0, P(t, .3, .75, E.oBack))}px)`; tp.style.opacity = P(t, .3, .55); };
  },
};
K.boot(PR, { fonts: ['Inter'], looks });
})();
