/* I006 Três páginas que o Google lê — "três páginas com SEO expandido para o Google entender o que você faz, trata e onde atende" (0:24).
   Look B (escolhido) é animado; A e C ficam como stills do estado final.
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
const E = { lin: p => p, i2: p => p * p, o3: p => 1 - (1 - p) ** 3, oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2 };
const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
const SFX = [];
const BG = PR.bg ? `<div id="bgv" style="background-image:url('${PR.bg}')"></div>` : '';
const markIn = (s, hi) => s.replace(hi, `<mark>${hi}</mark>`);
const LENS = (sz, c = '#fff') => `<svg width="${sz}" height="${sz}" viewBox="0 0 40 40"><circle cx="17" cy="17" r="11" fill="none" stroke="${c}" stroke-width="4.5"/><line x1="25.5" y1="25.5" x2="35" y2="35" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/></svg>`;

const LOOKS = {
  /* A — Leque: tela cheia creme, três páginas escalonadas, cada uma com o trecho grifado e a etiqueta do que o Google entende */
  A() {
    st.style.background = 'var(--creme)';
    const X = [80, 200, 120];
    st.innerHTML = `
      <div class="abs" style="inset:0;background-image:radial-gradient(#dcd8cc 1.2px,transparent 1.3px);background-size:28px 28px;opacity:.7"></div>
      <div class="abs h" style="left:80px;top:220px;font-size:92px">3 páginas.\n<span style="color:var(--roxo)">O Google entende.</span></div>
      ${PR.pages.map((p, i) => `<div class="card" style="left:${X[i]}px;top:${460 + i * 330}px;width:820px;height:300px;border-radius:22px;transform:rotate(${[-2, 1.5, -1][i]}deg)">
          <div class="abs" style="left:0;top:0;right:0;height:52px;background:#f3f1ea;border-bottom:1px solid var(--borda)"></div>
          <div class="abs" style="left:24px;top:20px;display:flex;gap:8px"><i style="width:12px;height:12px;border-radius:50%;background:#dedbd1"></i><i style="width:12px;height:12px;border-radius:50%;background:#dedbd1"></i><i style="width:12px;height:12px;border-radius:50%;background:#dedbd1"></i></div>
          <div class="abs" style="left:100px;top:13px;font-size:19px;color:var(--tintaS)">${PR.domain}<b style="color:var(--tinta)">${p.path}</b></div>
          <div class="abs" style="left:40px;top:82px;width:620px;font-family:Fraunces,serif;font-weight:600;font-size:44px;line-height:1.05">${i === 0 ? markIn(p.title, p.hi) : p.title}</div>
          <div class="abs" style="left:40px;top:${i === 0 ? 200 : 150}px;width:680px;font-size:26px;line-height:1.4;color:var(--tintaS)">${i === 0 ? p.text : markIn(p.text, p.hi)}</div>
        </div>
        <div class="tag" style="left:${X[i] + 580}px;top:${460 + i * 330 - 22}px;padding:12px 22px;font-size:28px;background:var(--roxo);color:#fff;gap:12px;box-shadow:0 14px 30px -12px rgba(88,87,176,.7)">${LENS(28)}${p.tag}</div>`).join('')}`;
  },

  /* B — Resultado (escolhido): por cima do vídeo, a busca é digitada, o resultado sobe com as três páginas como links
     e cada link acende quando a fala chega nele (timing.at). */
  B() {
    if (!PR.bg) { document.documentElement.style.background = document.body.style.background = 'transparent'; st.style.background = 'transparent'; }
    else st.style.background = '#000';
    const K = PR.timing;
    st.innerHTML = `${BG}
      <div id="shade" class="abs" style="left:0;right:0;top:820px;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.6) 30%)"></div>
      <div id="bar" class="card" style="left:70px;top:930px;width:940px;height:96px;border-radius:48px">
        <div class="abs" style="left:34px;top:28px">${LENS(40, '#7c7a73')}</div>
        <div class="abs" style="left:96px;top:26px;font-size:36px;font-weight:500"><span id="qT"></span><span id="caret" style="display:inline-block;width:3px;height:38px;background:var(--roxo);vertical-align:-6px;margin-left:3px"></span></div></div>
      <div id="res" class="card" style="left:70px;top:1050px;width:940px;height:470px;border-radius:26px">
        <div class="abs" style="left:40px;top:34px;display:flex;align-items:center;gap:14px">
          <i style="width:40px;height:40px;border-radius:50%;background:var(--roxoS);display:block"></i>
          <div><div style="font-size:22px;font-weight:600">${PR.brand}</div><div style="font-size:18px;color:var(--apag)">${PR.domain}</div></div></div>
        <div class="abs" style="left:40px;top:112px;width:860px;font-size:36px;font-weight:600;color:#3f3ea0;line-height:1.15">Dentista em Pinheiros · Implantes e lentes</div>
        <div class="abs" style="left:40px;top:166px;width:860px;font-size:24px;line-height:1.4;color:var(--tintaS)"><b>Implantes</b>, tratamento de <b>bruxismo</b> e <b>gengivite</b>. Atendimento na Rua dos Pinheiros, <b>Pinheiros, São Paulo</b>.</div>
        ${PR.pages.map((p, i) => `<div class="row abs" style="left:40px;top:${270 + i * 64}px;width:860px;height:52px;border-radius:14px;background:#f6f4ee;display:flex;align-items:center;justify-content:space-between;padding:0 22px">
          <span style="font-size:24px;font-weight:600;color:#3f3ea0">${p.title.replace('Implantes e lentes de contato dental', 'Implantes')}</span>
          <span class="rt" style="font-size:20px;color:var(--roxoF);font-weight:600">${p.tag}</span></div>`).join('')}
      </div>
      <div id="tag3" class="tag" style="left:780px;top:1032px;padding:10px 20px;font-size:24px;background:var(--roxo);color:#fff;transform-origin:50% 100%">${PR.pages.length} páginas</div>`;
    const $ = id => document.getElementById(id);
    const el = { shade: $('shade'), bar: $('bar'), qT: $('qT'), caret: $('caret'), res: $('res'), tag3: $('tag3'),
      rows: [...st.querySelectorAll('.row')], rt: [...st.querySelectorAll('.rt')] };
    const nq = PR.query.length;
    for (let k = 0; k < nq; k += 3) SFX.push({ t: K.type[0] + (K.type[1] - K.type[0]) * k / nq, type: 'key', g: .6 });
    SFX.push({ t: K.result, type: 'pop' }, { t: K.tag, type: 'pop', g: .7 });
    K.at.forEach(t => SFX.push({ t, type: 'tick' }));
    return t => {
      const D = PR.duration, out = P(t, D - .3, D, E.i2);
      el.shade.style.opacity = (P(t, 0, .3, E.lin) * (1 - out)).toFixed(3);
      const ba = P(t, 0, .35, E.o3);
      el.bar.style.transform = `translateY(${(lerp(50, 0, ba) + lerp(0, 120, out)).toFixed(1)}px)`; el.bar.style.opacity = (Math.min(1, ba * 1.6) * (1 - out)).toFixed(3);
      el.qT.textContent = PR.query.slice(0, Math.round(nq * P(t, K.type[0], K.type[1], E.lin)));
      el.caret.style.opacity = (t < K.type[1] || Math.floor(t * 2.5) % 2 === 0) && t < K.result + .4 ? '1' : '0';
      const ra = P(t, K.result, K.result + .45, E.o3);
      el.res.style.transform = `translateY(${(lerp(80, 0, ra) + lerp(0, 120, out)).toFixed(1)}px)`; el.res.style.opacity = (Math.min(1, ra * 1.6) * (1 - out)).toFixed(3);
      const ta = P(t, K.tag, K.tag + .35, E.oBack);
      el.tag3.style.transform = `scale(${ta.toFixed(4)}) translateY(${lerp(0, 120, out)}px)`; el.tag3.style.opacity = (Math.min(1, ta * 2) * (1 - out)).toFixed(3);
      el.rows.forEach((r, i) => {
        const h = P(t, K.at[i], K.at[i] + .25, E.o3);
        r.style.background = h > 0 ? `rgba(236,235,250,${(.35 + .65 * h).toFixed(3)})` : '#f6f4ee';
        r.style.boxShadow = h > 0 ? `inset 0 0 0 ${(2 * h).toFixed(2)}px #8f8fdd` : 'none';
        r.style.transform = `translateX(${(lerp(0, 10, P(t, K.at[i], K.at[i] + .15, E.o3)) - lerp(0, 10, P(t, K.at[i] + .15, K.at[i] + .45, E.o3))).toFixed(1)}px)`;
        el.rt[i].style.opacity = (.35 + .65 * h).toFixed(3);
      });
    };
  },

  /* C — Raio-x: tela cheia noite, uma página em esqueleto atravessada pela varredura, cada bloco etiquetado com o que o Google lê */
  C() {
    st.style.background = '#141413';
    const secs = [[300, 'h1', 210], [640, 'ul', 250], [1010, 'address', 170]];
    st.innerHTML = `
      <div class="abs mono" style="left:80px;top:180px;font-size:22px;letter-spacing:.18em;color:var(--roxoC)">SEO EXPANDIDO · ${PR.domain.toUpperCase()}</div>
      <div class="abs" style="left:80px;top:230px;width:640px;height:1000px;border-radius:26px;background:#1d1c1b;box-shadow:inset 0 0 0 1.5px #2c2b29;overflow:hidden">
        ${secs.map(([y, el, h], i) => `<div class="abs" style="left:36px;top:${y - 230}px;width:568px;height:${h}px;border-radius:14px;box-shadow:inset 0 0 0 2px var(--roxo);background:rgba(111,111,201,.08)">
            <div class="abs code" style="left:18px;top:14px;font-size:20px;color:var(--roxoC)">&lt;${el}&gt;</div>
            ${[0, 1, 2].slice(0, el === 'h1' ? 2 : 3).map(k => `<div class="abs" style="left:18px;top:${54 + k * 44}px;width:${[480, 360, 420][k]}px;height:${el === 'h1' ? 30 : 18}px;border-radius:6px;background:${k === 0 ? '#e9e7f8' : '#3a3936'}"></div>`).join('')}
          </div>`).join('')}
        <div class="abs" style="left:0;right:0;top:760px;height:3px;background:var(--roxo);box-shadow:0 0 40px 14px rgba(111,111,201,.35)"></div>
      </div>
      ${PR.pages.map((p, i) => `<svg class="abs" style="left:0;top:0" width="1080" height="1920"><path d="M ${684} ${secs[i][0] + 40} C 740 ${secs[i][0] + 40} 740 ${secs[i][0] + 40} 760 ${secs[i][0] + 40}" stroke="var(--roxoC)" stroke-width="2" fill="none"/></svg>
        <div class="tag" style="left:760px;top:${secs[i][0] + 12}px;padding:12px 22px;font-size:28px;background:var(--roxo);color:#fff">${p.tag}</div>
        <div class="abs" style="left:764px;top:${secs[i][0] + 78}px;width:260px;font-size:22px;line-height:1.35;color:#cfccc3">${p.hi}</div>`).join('')}
      <div class="abs" style="left:80px;top:1290px;display:flex;align-items:center;gap:14px;color:#faf9f5;font-size:30px;font-weight:600">${LENS(44, '#faf9f5')} Google lê</div>`;
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
