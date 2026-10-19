(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const tag = st => PR.ilustrativo && K.el('div', K.px({ position: 'absolute', left: 80, bottom: 400, fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,.7)', textShadow: '0 2px 10px rgba(0,0,0,.5)' }), 'exemplo ilustrativo', st);
const star = (c, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z" fill="${c}"/></svg>`;
K.boot(PR, { looks: {
  A(st) { // depoimento
    const c = K.el('div', 'position:absolute;left:90px;top:520px;width:900px;background:#fff;border-radius:44px;padding:70px 64px 56px;box-shadow:0 40px 90px -40px rgba(0,0,0,.6)', '', st);
    K.el('div', 'position:absolute;left:50px;top:-30px;font:800 230px/1 Inter;color:#6f6fc9', '“', c);
    const q = K.el('div', 'font:800 58px/1.12 Inter;letter-spacing:-.03em;margin-top:60px', PR.quote, c);
    const f = K.el('div', 'display:flex;align-items:center;gap:26px;margin-top:48px', `<div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#8f8fdd,#5857b0);display:flex;align-items:center;justify-content:center;color:#fff;font:800 44px Inter">${PR.name[0]}</div><div><div style="font:800 38px Inter">${PR.name}</div><div style="font:500 30px Inter;color:#7c7a73">${PR.role}</div></div><div style="margin-left:auto">${star('#f0a23a', 38).repeat(5)}</div>`, c);
    const tg = tag(st);
    return t => { const a = P(t, 0, .6, E.oBack); c.style.opacity = Math.min(1, a * 1.6).toFixed(2); c.style.transform = `translateY(${lerp(100, 0, a).toFixed(0)}px) scale(${lerp(.94, 1, a).toFixed(3)})`;
      q.style.opacity = P(t, .3, .8).toFixed(2); f.style.opacity = P(t, .8, 1.2).toFixed(2); if (tg) tg.style.opacity = P(t, 1, 1.4); };
  },
  B(st) { // estrelas e nota
    st.style.background = st.style.background; const wrap = K.el('div', 'position:absolute;left:0;right:0;top:560px;text-align:center', '', st);
    const n = K.el('div', 'font:800 360px/1 Inter;letter-spacing:-.06em;color:#fff;text-shadow:0 10px 50px rgba(0,0,0,.45)', PR.nota, wrap);
    const sr = K.el('div', 'display:flex;justify-content:center;gap:14px;margin-top:20px', '', wrap);
    const stars = [...Array(PR.estrelas)].map(() => K.el('span', 'display:inline-block', star('#f6c244', 120), sr));
    const tt = K.el('div', 'font:700 52px Inter;color:#fff;margin-top:36px;text-shadow:0 4px 24px rgba(0,0,0,.5)', PR.total, wrap);
    const fo = K.el('div', 'font:600 34px Inter;color:rgba(255,255,255,.75);margin-top:10px', PR.fonte, wrap);
    const tg = tag(st);
    return t => { n.style.opacity = P(t, 0, .3).toFixed(2); n.style.transform = `scale(${lerp(.85, 1, P(t, 0, .5, E.oBack)).toFixed(3)})`;
      stars.forEach((s, i) => { const k = P(t, .4 + i * .12, .65 + i * .12, E.oBack); s.style.opacity = Math.min(1, k * 2).toFixed(2); s.style.transform = `scale(${lerp(.2, 1, k).toFixed(3)}) rotate(${lerp(-40, 0, k).toFixed(0)}deg)`; });
      tt.style.opacity = P(t, 1.1, 1.5).toFixed(2); fo.style.opacity = P(t, 1.3, 1.7).toFixed(2); if (tg) tg.style.opacity = P(t, 1.4, 1.8); };
  },
  C(st) { // conversa de WhatsApp
    const tela = K.el('div', 'position:absolute;left:90px;top:480px;width:900px;border-radius:44px;background:#0b141a;padding:36px 30px 40px;box-shadow:0 40px 90px -40px rgba(0,0,0,.7)', '', st);
    K.el('div', 'display:flex;align-items:center;gap:20px;padding:0 10px 28px;border-bottom:2px solid #1f2c34', '<div style="width:72px;height:72px;border-radius:50%;background:#25a85a"></div><div style="font:700 36px Inter;color:#e9edef">Cliente</div><div style="font:500 26px Inter;color:#25d366;margin-left:auto">online</div>', tela);
    const msgs = PR.chat.map((m, i) => K.el('div', `margin-top:26px;max-width:640px;${m.de === 'voce' ? 'margin-left:auto;background:#005c4b' : 'background:#202c33'};color:#e9edef;font:500 40px/1.25 Inter;padding:22px 28px;border-radius:26px;opacity:0`, m.t, tela));
    const tg = tag(st);
    return t => { const a = P(t, 0, .5, E.oBack); tela.style.opacity = Math.min(1, a * 2).toFixed(2); tela.style.transform = `translateY(${lerp(80, 0, a).toFixed(0)}px)`;
      msgs.forEach((m, i) => { const k = P(t, .6 + i * .7, .85 + i * .7, E.oBack); m.style.opacity = Math.min(1, k * 2).toFixed(2); m.style.transform = `translateY(${lerp(30, 0, k).toFixed(0)}px) scale(${lerp(.9, 1, k).toFixed(3)})`; });
      if (tg) tg.style.opacity = P(t, 1, 1.4); };
  },
} });
})();
