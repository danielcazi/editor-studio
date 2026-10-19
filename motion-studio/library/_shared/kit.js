/* Kit comum dos módulos novos do motion mod. Contrato do render: window.seek(t) pinta o quadro t, sem estado entre quadros.
   Uso (film.js):  const K = window.KIT, PR = K.params();  K.boot(PR, { fonts: ['Inter'], looks: { A(st, PR) { ...; return t => {...}; } } });
   Fundo transparente por padrão (vira PNG com alfa no render); ?bg=1 liga um fundo escuro só para miniatura/preview.
   ?look=B troca o look; ?p=<base64url JSON> sobrescreve params; ?t=1.2 escolhe o instante do preview. */
window.KIT = (() => {
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  const lerp = (a, b, p) => a + (b - a) * p;
  const E = {
    lin: p => p, o3: p => 1 - (1 - p) ** 3, io3: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2,
    oBack: p => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2, oExp: p => p >= 1 ? 1 : 1 - 2 ** (-10 * p),
  };
  const P = (t, a, b, e = E.o3) => e(clamp((t - a) / (b - a)));
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const q = new URLSearchParams(location.search);
  const params = () => {
    const PR = { ...window.PARAMS };
    if (q.get('p')) Object.assign(PR, JSON.parse(decodeURIComponent(escape(atob(q.get('p').replace(/-/g, '+').replace(/_/g, '/'))))));
    if (q.get('look')) PR.look = q.get('look');
    return PR;
  };
  /* número que vem de videos/<id>/dados.json (window.DADOS, gerado por tools/dados.mjs); cai no valor do params */
  const dado = (key, fallback) => { const d = (window.DADOS || {})[key]; return d ? (d.texto ?? String(d.valor)) : fallback; };
  const el = (tag, css = '', html = '', parent) => { const e = document.createElement(tag); e.style.cssText = css; if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  const px = o => Object.entries(o).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${typeof v === 'number' && !/opacity|zIndex|fontWeight|lineHeight|flex/.test(k) ? v + 'px' : v}`).join(';');
  function boot(PR, { fonts = ['Inter'], looks }) {
    const st = document.getElementById('stage');
    const demo = q.get('bg') === '1';
    document.documentElement.style.background = document.body.style.background = demo ? '#1b1a22' : 'transparent';
    st.style.background = demo ? 'linear-gradient(160deg,#34313f,#17161c)' : 'transparent';
    let paint = null;
    window.DURATION = PR.duration; window.FPS = PR.fps || 30; window.SFX = [];
    window.seek = async t => { if (paint) paint(t); };
    window.__ready = (async () => {
      await document.fonts.ready;
      await Promise.all(fonts.map(f => document.fonts.load(`700 40px "${f}"`).catch(() => {})));
      st.innerHTML = '';
      paint = (looks[PR.look] || looks[Object.keys(looks)[0]])(st, PR);
      await window.seek(q.has('t') ? +q.get('t') : PR.previewT ?? PR.duration * .6);
    })();
  }
  return { clamp, lerp, E, P, rng, params, dado, el, px, boot, q };
})();
