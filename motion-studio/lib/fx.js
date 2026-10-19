/* FX · efeitos de acabamento seek-safe para filmes window.seek(t).
   Sem animação CSS, sem relógio, sem Math.random: cada chamada pinta o efeito para o tempo t e só para ele.
   Inspirados nos nós do framefields (film-grain, vignette, curves/levels/color-balance, blur, displacement/chromatic, pbr-glass),
   reimplementados em SVG/CSS/Canvas 2D. Não reproduzem LUT 3D nem shaders arbitrários (isso pede WebGL).
   Uso:  <script src="../../../lib/fx.js"></script>
         FX.grain(host, { t, strength: .35 });  FX.vignette(host, { amount: .5 });  FX.grade(el, { contrast: 1.15, curves: { l: [[0,0],[.25,.18],[.75,.84],[1,1]] } });
         FX.blur(el, { x: 24, y: 0 });  FX.chroma(el, { amount: 6, angle: 0 });  FX.glass(card, { blur: 28 }); */
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.FX = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };

  /* ruído com semente (mulberry32): o mesmo quadro dá o mesmo grão */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* um <svg> escondido no documento guarda os filtros; cada efeito tem um filtro com id fixo, atualizado a cada quadro */
  function defs() {
    var s = document.getElementById('fx-defs');
    if (!s) { s = document.createElementNS(SVGNS, 'svg'); s.id = 'fx-defs'; s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none'; s.appendChild(document.createElementNS(SVGNS, 'defs')); document.body.appendChild(s); }
    return s.firstChild;
  }
  function filter(id, xml) {
    var d = defs(), f = d.querySelector('#' + id);
    if (!f) { f = document.createElementNS(SVGNS, 'filter'); f.id = id; f.setAttribute('color-interpolation-filters', 'sRGB'); f.setAttribute('x', '-5%'); f.setAttribute('y', '-5%'); f.setAttribute('width', '110%'); f.setAttribute('height', '110%'); d.appendChild(f); }
    if (f.dataset.xml !== xml) { f.dataset.xml = xml; f.innerHTML = xml; }   // só reescreve se mudou
    return f;
  }
  function place(el, id, extra) { el.style.filter = 'url(#' + id + ')' + (extra ? ' ' + extra : ''); }

  /* curva monótona (Fritsch–Carlson) por pontos [[x,y],...] amostrada em n valores para feFuncX type="table" */
  function curveTable(pts, n) {
    pts = (pts && pts.length > 1 ? pts : [[0, 0], [1, 1]]).slice().sort(function (a, b) { return a[0] - b[0]; });
    var N = pts.length, h = [], d = [], m = [], i;
    for (i = 0; i < N - 1; i++) { h[i] = pts[i + 1][0] - pts[i][0] || 1e-6; d[i] = (pts[i + 1][1] - pts[i][1]) / h[i]; }
    m[0] = d[0]; m[N - 1] = d[N - 2];
    for (i = 1; i < N - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (i = 0; i < N - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } var a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { var k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
    var out = [];
    for (var j = 0; j < n; j++) {
      var x = j / (n - 1), k2 = 0;
      while (k2 < N - 2 && x > pts[k2 + 1][0]) k2++;
      var t = clamp((x - pts[k2][0]) / h[k2], 0, 1), t2 = t * t, t3 = t2 * t;
      var y = (2 * t3 - 3 * t2 + 1) * pts[k2][1] + (t3 - 2 * t2 + t) * h[k2] * m[k2] + (-2 * t3 + 3 * t2) * pts[k2 + 1][1] + (t3 - t2) * h[k2] * m[k2 + 1];
      out.push(clamp(y, 0, 1).toFixed(4));
    }
    return out;
  }

  var FX = { mulberry32: mulberry32, curveTable: curveTable };

  /* Grão de filme · canvas com ruído novo a cada quadro (semente = número do quadro), misturado em overlay.
     o: t, fps=30, strength=.35 (0–1, vira a opacidade), size=2 (px do grão), mono=true, blend='overlay'. */
  FX.grain = function (host, o) {
    o = o || {}; var fps = o.fps || 30, size = Math.max(1, o.size || 2), strength = o.strength == null ? .35 : o.strength;
    var c = host.querySelector(':scope > canvas.fx-grain');
    var W = host.clientWidth || innerWidth, H = host.clientHeight || innerHeight, w = Math.ceil(W / size), h = Math.ceil(H / size);
    if (!c) { c = document.createElement('canvas'); c.className = 'fx-grain'; c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated'; host.appendChild(c); }
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    c.style.mixBlendMode = o.blend || 'overlay'; c.style.opacity = clamp(strength, 0, 1);
    var frame = Math.floor((o.t || 0) * fps + 1e-6), rnd = mulberry32(frame * 9301 + 49297);
    var ctx = c.getContext('2d'), img = ctx.createImageData(w, h), px = img.data, mono = o.mono !== false;
    var g = function () { return (rnd() + rnd() + rnd() - 1.5) * 0.9; };   // ~gaussiana em [-1,1]
    for (var i = 0; i < px.length; i += 4) {
      var v = 128 + g() * 110;
      px[i] = v; px[i + 1] = mono ? v : 128 + g() * 110; px[i + 2] = mono ? v : 128 + g() * 110; px[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  };

  /* Vinheta · gradiente radial. o: amount=.5 (escuridão na borda), size=.55 (raio interno limpo, 0–1), roundness=1 (1 elipse do quadro, 0 círculo), color='0,0,0'. */
  FX.vignette = function (host, o) {
    o = o || {}; var a = clamp(o.amount == null ? .5 : o.amount, 0, 1), s = clamp(o.size == null ? .55 : o.size, 0, .98), col = o.color || '0,0,0';
    var v = host.querySelector(':scope > .fx-vignette');
    if (!v) { v = document.createElement('div'); v.className = 'fx-vignette'; v.style.cssText = 'position:absolute;inset:0;pointer-events:none'; host.appendChild(v); }
    var shape = (o.roundness == null || o.roundness >= .5) ? 'ellipse farthest-corner' : 'circle farthest-corner';
    v.style.background = 'radial-gradient(' + shape + ' at 50% 50%, rgba(' + col + ',0) ' + Math.round(s * 100) + '%, rgba(' + col + ',' + (a * .45).toFixed(3) + ') ' + Math.round((s + (1 - s) * .55) * 100) + '%, rgba(' + col + ',' + a.toFixed(3) + ') 100%)';
    return v;
  };

  /* Cor · contraste, brilho, saturação, temperatura e curvas num só filtro SVG (função por canal, 64 pontos).
     o: contrast=1, brightness=0 (−1..1), saturate=1, temp=0 (−1 frio..1 quente), tint=0 (verde−/magenta+),
        curves: { l, r, g, b } com pontos [[x,y],...] (l = mestre), id='fx-grade'. */
  FX.grade = function (el, o) {
    o = o || {}; var id = o.id || 'fx-grade', c = o.contrast == null ? 1 : o.contrast, b = o.brightness || 0, cv = o.curves || {};
    var temp = o.temp || 0, tint = o.tint || 0, sat = o.saturate == null ? 1 : o.saturate;
    var N = 64, L = curveTable(cv.l, N).map(Number), chan = {};
    ['r', 'g', 'b'].forEach(function (k) {
      var t = curveTable(cv[k], N).map(Number);
      chan[k] = L.map(function (_, j) {                        // x → contraste/brilho → mestre → canal
        var x = clamp(c * (j / (N - 1) - .5) + .5 + b, 0, 1), p = x * (N - 1), i = Math.min(N - 2, Math.floor(p)), f = p - i;
        var m = L[i] * (1 - f) + L[i + 1] * f; p = m * (N - 1); i = Math.min(N - 2, Math.floor(p)); f = p - i;
        return (t[i] * (1 - f) + t[i + 1] * f).toFixed(4);
      }).join(' ');
    });
    var tm = [1 + .18 * temp - .06 * tint, 0, 0, 0, 0,  0, 1 + .12 * tint, 0, 0, 0,  0, 0, 1 - .18 * temp - .06 * tint, 0, 0,  0, 0, 0, 1, 0].map(function (x) { return +x.toFixed(4); }).join(' ');
    filter(id, '<feColorMatrix type="saturate" values="' + sat.toFixed(3) + '"/><feColorMatrix type="matrix" values="' + tm + '"/>' +
      '<feComponentTransfer><feFuncR type="table" tableValues="' + chan.r + '"/><feFuncG type="table" tableValues="' + chan.g + '"/><feFuncB type="table" tableValues="' + chan.b + '"/></feComponentTransfer>');
    place(el, id); return el;
  };

  /* Desfoque · gaussiano com raio por eixo (x≠y dá desfoque direcional). o: x=0, y=x, id='fx-blur'. */
  FX.blur = function (el, o) {
    o = o || {}; var x = Math.max(0, o.x || 0), y = o.y == null ? x : Math.max(0, o.y), id = o.id || 'fx-blur';
    if (x < .05 && y < .05) { el.style.filter = ''; return el; }
    filter(id, '<feGaussianBlur stdDeviation="' + x.toFixed(2) + ' ' + y.toFixed(2) + '" edgeMode="duplicate"/>'); place(el, id); return el;
  };

  /* Aberração cromática · canais R e B deslocados em sentidos opostos. o: amount=4 (px), angle=0 (graus; 0 = horizontal), id='fx-chroma'. */
  FX.chroma = function (el, o) {
    o = o || {}; var a = o.amount == null ? 4 : o.amount, ang = (o.angle || 0) * Math.PI / 180, id = o.id || 'fx-chroma';
    var dx = (Math.cos(ang) * a).toFixed(2), dy = (Math.sin(ang) * a).toFixed(2);
    var only = function (r, g, b) { return '<feColorMatrix in="SourceGraphic" type="matrix" values="' + [r, 0, 0, 0, 0, 0, g, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0].join(' ') + '"/>'; };
    filter(id, only(1, 0, 0).replace('/>', ' result="r0"/>') + '<feOffset in="r0" dx="' + dx + '" dy="' + dy + '" result="r"/>' +
      only(0, 1, 0).replace('/>', ' result="g"/>') +
      only(0, 0, 1).replace('/>', ' result="b0"/>') + '<feOffset in="b0" dx="' + (-dx) + '" dy="' + (-dy) + '" result="b"/>' +
      '<feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen"/>');
    place(el, id); return el;
  };

  /* Vidro fosco · para um cartão sobre conteúdo. o: blur=24, saturate=1.5, tint=.14 (branco), radius=36, border=.38, shadow=.35. */
  FX.glass = function (el, o) {
    o = o || {}; var bl = o.blur == null ? 24 : o.blur, r = o.radius == null ? 36 : o.radius, tint = o.tint == null ? .14 : o.tint, bd = o.border == null ? .38 : o.border, sh = o.shadow == null ? .35 : o.shadow;
    var bf = 'blur(' + bl + 'px) saturate(' + (o.saturate == null ? 1.5 : o.saturate) + ')';
    el.style.backdropFilter = bf; el.style.webkitBackdropFilter = bf; el.style.borderRadius = r + 'px';
    el.style.background = 'linear-gradient(135deg, rgba(255,255,255,' + (tint * 1.8).toFixed(3) + '), rgba(255,255,255,' + (tint * .5).toFixed(3) + '))';
    el.style.border = '1.5px solid rgba(255,255,255,' + bd + ')';
    el.style.boxShadow = 'inset 0 1.5px 0 rgba(255,255,255,' + (bd * 1.2).toFixed(3) + '), 0 30px 70px rgba(0,0,0,' + sh + ')';
    return el;
  };

  return FX;
});
