// Roda DENTRO da página (page.evaluate): não pode usar nada de fora desta função.
// Devolve os textos e painéis visíveis do quadro atual, com a cobertura pela pessoa recortada (#person).
export function analyzeFrame({ W, H }) {
  const stage = document.querySelector('#stage') || document.body;
  const visible = el => {
    let o = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || (e === el && cs.visibility === 'hidden')) return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  };
  const layerOf = el => el.closest('#back') ? 'back' : el.closest('#scenes') ? 'cena' : el.closest('#wipe') ? 'cortina' : 'outro';

  // alfa da pessoa na posição em que aparece (com a escala aplicada)
  let alpha = null, person = null;
  const pe = document.querySelector('#person');
  if (pe && pe.complete && pe.naturalWidth && visible(pe) > 0.3) {
    const r = pe.getBoundingClientRect();
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(pe, r.left, r.top, r.width, r.height);
    alpha = ctx.getImageData(0, 0, W, H).data;
    let top = H, bottom = -1, left = W, right = -1, bandL = W, bandR = -1;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (alpha[(y * W + x) * 4 + 3] > 128) {
      if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x;
    }
    if (bottom >= 0) {
      for (let y = top; y < Math.min(H, top + 40); y += 2) for (let x = 0; x < W; x += 2) if (alpha[(y * W + x) * 4 + 3] > 128) { if (x < bandL) bandL = x; if (x > bandR) bandR = x; }
      person = { top, bottom, left, right, bandL, bandR, headBottom: top + Math.min(0.3 * (bottom - top), 520) };
    } else alpha = null;
  }
  const cover = (r, y0, y1) => {
    if (!alpha || !person) return 0;
    const ya = Math.max(r.y, y0 ?? -1e9), yb = Math.min(r.y + r.h, y1 ?? 1e9);
    let hit = 0;
    for (let y = Math.max(0, Math.floor(ya)); y < Math.min(H, yb); y += 3)
      for (let x = Math.max(0, Math.floor(r.x)); x < Math.min(W, r.x + r.w); x += 3) if (alpha[(y * W + x) * 4 + 3] > 128) hit++;
    return hit * 9 / Math.max(1, r.w * r.h);
  };
  const touch = r => !!person && r.y + r.h >= person.top - 30 && r.y + r.h <= person.top + 6 && r.x + r.w > person.bandL && r.x < person.bandR;
  const measure = r => ({ cover: +cover(r).toFixed(3), head: person ? +cover(r, 0, person.headBottom).toFixed(3) : 0, touch: touch(r) });

  const items = [];
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const text = n.textContent.replace(/\s+/g, ' ').trim();
    const el = n.parentElement;
    if (!text || !el || /^(SCRIPT|STYLE)$/.test(el.tagName)) continue;
    const eff = visible(el);
    if (eff < 0.3) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    const b = range.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) continue;
    const cs = getComputedStyle(el);
    const rect = { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) };
    items.push({ kind: 'texto', layer: layerOf(el), text, family: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), italic: cs.fontStyle === 'italic', size: parseFloat(cs.fontSize), rect, ...measure(rect) });
  }
  for (const el of document.querySelectorAll('#scenes *')) {
    const cs = getComputedStyle(el);
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (!m) continue;
    const p = m[1].split(',').map(Number);
    if ((p.length === 4 ? p[3] : 1) < 0.3) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 80 || b.height < 40 || b.width * b.height > 0.6 * W * H || visible(el) < 0.3) continue;
    const rect = { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) };
    items.push({ kind: 'painel', layer: layerOf(el), text: (el.className && String(el.className).trim()) || el.tagName.toLowerCase(), rect, ...measure(rect) });
  }
  // vídeo base (#rig): retângulo na tela, desfoque e máscara de cada mídia visível
  const base = [];
  for (const m of document.querySelectorAll('#rig img, #rig video, #rig canvas')) {
    if (visible(m) < 0.05) continue;
    const b = m.getBoundingClientRect(), cs = getComputedStyle(m);
    if (b.width < 50 || b.height < 50) continue;
    const mask = (cs.webkitMaskImage || cs.maskImage || 'none') !== 'none';
    base.push({ id: m.id || m.tagName.toLowerCase(), rect: { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }, blur: /blur\(/.test(cs.filter), mask });
  }
  const nums = items.filter(i => i.kind === 'texto').flatMap(i => i.text.match(/[−-]?\s?\d[\d.,]*\s?%?/g) || []).map(s => s.replace(/\s+/g, ''));
  return { items, person, nums, base };
}
