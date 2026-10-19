(() => { 'use strict';
const K = window.KIT, PR = K.params(), { P, E, lerp } = K;
const build = (dark) => (st) => {
  const ink = dark ? '#1f1e1d' : PR.ink;
  if (dark) st.style.background = '#faf9f5';
  const letters = [];
  const block = K.el('div', K.px({ position: 'absolute', left: 80, right: 80, top: PR.y }), '', st);
  let n = 0, hiEl = null;
  PR.lines.forEach((ln, li) => {
    const row = K.el('div', K.px({ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: PR.size, lineHeight: 1.02, color: ink, whiteSpace: 'pre', textShadow: dark ? 'none' : '0 6px 40px rgba(0,0,0,.4)' }), '', block);
    ln.split(' ').forEach((word, wi, arr) => {
      const w = K.el('span', 'display:inline-block;position:relative', '', row);
      [...word].forEach(ch => { const s = K.el('span', 'display:inline-block;will-change:transform', ch, w); letters.push({ s, i: n++ }); });
      if (wi < arr.length - 1) row.appendChild(document.createTextNode(' '));
      if (PR.hi && PR.hi[0] === li && PR.hi[1] === wi) hiEl = w;
    });
  });
  const svg = hiEl && (() => { const e = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); e.setAttribute('viewBox', '0 0 100 14'); e.setAttribute('preserveAspectRatio', 'none');
    e.style.cssText = 'position:absolute;left:-2%;width:104%;bottom:-6px;height:22px;overflow:visible';
    e.innerHTML = `<path d="M2 9 C 25 2, 60 13, 98 5" fill="none" stroke="${PR.stroke}" stroke-width="5" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`; hiEl.appendChild(e); return e.firstChild; })();
  const tEnd = n * PR.letterStep + .5;
  return t => {
    letters.forEach(({ s, i }) => { const k = P(t, i * PR.letterStep, i * PR.letterStep + .45, E.o3);
      s.style.opacity = k.toFixed(3); s.style.transform = `translateY(${lerp(.5, 0, k).toFixed(3)}em)`; s.style.filter = `blur(${lerp(10, 0, k).toFixed(1)}px)`; });
    if (svg) svg.style.strokeDashoffset = (1 - P(t, tEnd, tEnd + .5, E.io3)).toFixed(3);
  };
};
K.boot(PR, { fonts: ['Instrument Serif'], looks: { A: build(false), B: build(true) } });
})();
