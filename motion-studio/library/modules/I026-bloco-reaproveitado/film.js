(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp, el, px } = K;
const ROXO = '#8f8fdd', ROXOF = '#6f6fc9';
const GLASS = 'linear-gradient(155deg,rgba(60,58,78,.92),rgba(24,23,32,.94))';
const glass = (extra = {}) => px({ position: 'absolute', background: GLASS, borderRadius: 34, color: '#faf9f5',
  boxShadow: '0 50px 90px -30px rgba(0,0,0,.65), inset 0 1.5px 0 rgba(255,255,255,.28), inset 0 0 0 1.5px rgba(255,255,255,.10)', overflow: 'hidden', ...extra });
const sheenOf = (parent, op = .2) => el('div', px({ position: 'absolute', top: 0, bottom: 0, width: 220, background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent)', transform: 'skewX(-14deg)', opacity: op }), '', parent);
const title = (st, y) => {
  const h = el('div', px({ position: 'absolute', left: 90, top: y, fontWeight: 800, fontSize: 100, letterSpacing: '-.035em', lineHeight: .98, color: '#fff', whiteSpace: 'pre', textShadow: '0 6px 30px rgba(0,0,0,.45)' }), `${PR.title}\n<span style="color:${ROXO}">${PR.hi}</span>`, st);
  return t => { const a = P(t, 0, .55, E.oBack); h.style.opacity = Math.min(1, a * 1.6); h.style.transform = `translateY(${lerp(50, 0, a).toFixed(1)}px)`; };
};
const bar = (parent, n, w = 360) => { for (let i = 0; i < n; i++) el('div', px({ height: 14, width: i % 2 ? w * .7 : w, borderRadius: 7, background: 'rgba(255,255,255,.14)', marginTop: 14 }), '', parent); };
const quote = (parent, hot) => { // miniatura do bloco "Depoimentos"
  const b = el('div', px({ position: 'relative', borderRadius: 22, padding: '22px 26px', background: hot ? 'linear-gradient(135deg,#7878d4,#5857b0)' : 'rgba(255,255,255,.08)', boxShadow: hot ? '0 0 0 6px rgba(143,143,221,.25), 0 30px 60px -20px rgba(111,111,201,.7)' : 'none' }), '', parent);
  el('div', px({ fontSize: 24, fontWeight: 700, color: '#fff' }), '★★★★★ &nbsp;“Chegou mais rápido.”', b);
  el('div', px({ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,.7)', marginTop: 6 }), PR.bloco, b);
  return b;
};
const pageCard = (st, x, y, w, h, name) => {
  const c = el('div', glass({ left: x, top: y, width: w, height: h, padding: '26px 30px' }), '', st);
  el('div', px({ fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,.62)', letterSpacing: '.02em' }), name, c);
  el('div', px({ height: 34, borderRadius: 10, background: 'rgba(255,255,255,.16)', marginTop: 18, width: '55%' }), '', c);
  bar(c, 2, w - 60);
  sheenOf(c);
  return c;
};

const looks = {
  A(st) { // copiar e colar entre duas páginas
    const ti = title(st, PR.y - 60);
    const W = 900, X = 90;
    const top = pageCard(st, X, PR.y + 180, W, 430, PR.clientes[0]);
    const slotA = el('div', px({ position: 'absolute', left: 30, right: 30, bottom: 26 }), '', top); const blkA = quote(slotA, true);
    const bot = pageCard(st, X, PR.y + 720, W, 430, PR.clientes[1]);
    const slotB = el('div', px({ position: 'absolute', left: 30, right: 30, bottom: 26, height: 100, borderRadius: 22, border: '3px dashed rgba(143,143,221,.5)' }), '', bot);
    const fly = el('div', px({ position: 'absolute', left: X + 30, width: W - 60, top: PR.y + 450 }), '', st); quote(fly, true);
    const path = el('div', px({ position: 'absolute', left: X + W / 2 - 3, top: PR.y + 612, width: 6, height: 108, borderRadius: 3, background: 'linear-gradient(#8f8fdd,transparent)' }), '', st);
    const chip = el('div', px({ position: 'absolute', left: X + 40, top: PR.y + 1170, padding: '18px 30px', borderRadius: 999, background: 'rgba(47,191,107,.18)', color: '#7fe0a6', fontWeight: 700, fontSize: 30, boxShadow: 'inset 0 0 0 2px rgba(47,191,107,.5)' }), '✓ ' + PR.selo, st);
    return t => { ti(t);
      const a = P(t, .2, .8, E.oBack), f = P(t, 1.0, 1.9, E.io3), c = P(t, 1.9, 2.3);
      top.style.opacity = bot.style.opacity = Math.min(1, a * 1.5);
      top.style.transform = `translateY(${lerp(80, 0, a)}px)`; bot.style.transform = `translateY(${lerp(120, 0, a)}px)`;
      blkA.style.opacity = f > 0 ? .35 : 1;
      fly.style.opacity = f > 0 && f < 1 ? 1 : 0; fly.style.top = (PR.y + 450 + (590) * f) + 'px'; fly.style.transform = `scale(${lerp(1, 1.04, Math.sin(f * Math.PI))}) rotate(${lerp(0, -2.5, Math.sin(f * Math.PI))}deg)`;
      path.style.opacity = f > 0 && f < 1 ? 1 : 0;
      slotB.style.opacity = f >= 1 ? 0 : 1;
      if (!slotB.dataset.ok) { slotB.dataset.ok = '1'; slotB._blk = quote(el('div', px({ position: 'absolute', inset: 0 }), '', slotB), true); }
      slotB._blk.style.opacity = f >= 1 ? 1 : 0; if (f >= 1) { slotB.style.opacity = 1; slotB.style.border = '0'; } else slotB.style.border = '3px dashed rgba(143,143,221,.5)';
      chip.style.opacity = c; chip.style.transform = `translateY(${lerp(30, 0, c)}px)`;
    };
  },
  B(st) { // biblioteca de blocos: um sai do painel
    const ti = title(st, PR.y - 60);
    const panel = el('div', glass({ left: 90, top: PR.y + 190, width: 900, height: 760, padding: '38px 40px' }), '', st);
    el('div', px({ fontSize: 28, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 22 }), 'Meus blocos', panel);
    const items = PR.biblioteca.map((n, i) => {
      const r = el('div', px({ display: 'flex', alignItems: 'center', gap: 26, height: 150, borderRadius: 24, padding: '0 28px', marginTop: 14, background: n === PR.bloco ? 'linear-gradient(135deg,#7878d4,#5857b0)' : 'rgba(255,255,255,.07)', fontSize: 40, fontWeight: 700, boxShadow: n === PR.bloco ? '0 0 0 6px rgba(143,143,221,.25)' : 'none' }), '', panel);
      el('div', px({ width: 70, height: 70, borderRadius: 16, background: 'rgba(255,255,255,.18)' }), '', r);
      el('span', '', n, r); return r; });
    sheenOf(panel, .16);
    const tag = el('div', px({ position: 'absolute', left: 560, top: PR.y + 1010, padding: '22px 34px', borderRadius: 999, background: ROXOF, color: '#fff', fontWeight: 800, fontSize: 36, boxShadow: '0 20px 50px -10px rgba(111,111,201,.8)' }), '+ ' + PR.clientes[1].split(' · ')[0], st);
    const tag2 = el('div', px({ position: 'absolute', left: 90, top: PR.y + 1010, padding: '22px 34px', borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: 36 }), PR.clientes[0].split(' · ')[0], st);
    return t => { ti(t);
      const a = P(t, .2, .9, E.oBack);
      panel.style.opacity = Math.min(1, a * 1.6); panel.style.transform = `translateY(${lerp(100, 0, a)}px) perspective(1600px) rotateX(${lerp(14, 0, a)}deg)`;
      items.forEach((r, i) => { const k = P(t, .5 + i * .12, .9 + i * .12); r.style.opacity = k; r.style.transform = `translateX(${lerp(50, 0, k)}px)`; });
      const lift = P(t, 1.3, 2, E.oBack); items[1].style.transform = `scale(${lerp(1, 1.03, lift)})`;
      tag2.style.opacity = P(t, 1.5, 1.9); tag.style.opacity = P(t, 2, 2.4); tag.style.transform = `translateY(${lerp(30, 0, P(t, 2, 2.4, E.oBack))}px)`;
    };
  },
  C(st) { // o mesmo bloco em três clientes, em leque
    const ti = title(st, PR.y - 60);
    const cards = PR.clientes.map((n, i) => {
      const c = pageCard(st, 150 + i * 30, PR.y + 200 + i * 330, 780, 300, n);
      el('div', px({ position: 'absolute', left: 30, right: 30, bottom: 24 }), '', c); quote(c.lastChild, true);
      return c; });
    const link = el('div', px({ position: 'absolute', left: 90, top: PR.y + 230, width: 6, height: 880, borderRadius: 3, background: 'linear-gradient(#8f8fdd,rgba(143,143,221,.1))' }), '', st);
    return t => { ti(t);
      cards.forEach((c, i) => { const k = P(t, .35 + i * .35, .95 + i * .35, E.oBack); c.style.opacity = Math.min(1, k * 1.6); c.style.transform = `translateX(${lerp(160, 0, k)}px) rotate(${lerp(4, 0, k)}deg)`; });
      link.style.transform = `scaleY(${P(t, .4, 1.8, E.io3)})`; link.style.transformOrigin = 'top';
    };
  },
};
K.boot(PR, { looks });
})();
