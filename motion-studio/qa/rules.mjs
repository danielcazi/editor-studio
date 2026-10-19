// Regras do QA. Cada uma devolve achados { regra, quadro, nivel, msg }.
const SERIF = /playfair|georgia|serif|fraunces|newsreader|cormorant|lora|merriweather|garamond|times|dm serif/i;
const SANS_ONLY = /sans-serif/i;
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9% ]+/g, ' ').replace(/\s+/g, ' ').trim();
const pct = x => Math.round(x * 100) + '%';

export function checkFrame({ frame, a, numsLater, W, H, expect, safe }) {
  const out = [], seen = new Set();
  const add = (regra, nivel, msg, key) => { const k = regra + '|' + (key ?? msg); if (!seen.has(k)) { seen.add(k); out.push({ regra, quadro: frame.id, nivel, msg }); } };

  for (const i of a.items) {
    const nome = i.kind === 'texto' ? `"${i.text.slice(0, 40)}"` : `painel .${i.text.split(' ')[0]}`;
    // 1 · título x rosto
    if (i.kind === 'texto' && i.layer === 'back' && i.cover > 0.06) add('titulo-rosto', 'erro', `${nome} fica ${pct(i.cover)} coberto pela pessoa (texto atrás da cabeça perde letras)`, nome);
    if (i.kind === 'texto' && i.layer !== 'back' && i.head > 0.15) add('titulo-rosto', 'erro', `${nome} cobre ${pct(i.head)} da cabeça/rosto`, nome);
    else if (i.kind === 'texto' && i.layer !== 'back' && i.cover > 0.5 && i.rect.h > 120) add('titulo-rosto', 'aviso', `${nome} cobre ${pct(Math.min(1, i.cover))} da área da pessoa (rosto, pescoço ou corpo)`, nome);
    if (i.kind === 'painel' && i.layer !== 'back' && i.head > 0.08) add('titulo-rosto', 'aviso', `${nome} cobre ${pct(i.head)} da cabeça`, nome);
    if (i.touch && i.layer !== 'back') add('titulo-rosto', 'aviso', `${nome} encosta no topo da cabeça`, nome);
    // 2 · área segura (texto e painéis; retângulo de safezone.json): texto fora é erro, painel fora é aviso
    if (safe && i.layer !== 'cortina') {
      const r = i.rect, fora = [];
      if (r.y < safe.top - 4) fora.push(`topo ${r.y} < ${safe.top}`);
      if (r.y + r.h > safe.bottom + 4) fora.push(`base ${r.y + r.h} > ${safe.bottom}`);
      if (r.x < safe.left - 4) fora.push(`esquerda ${r.x} < ${safe.left}`);
      if (r.x + r.w > safe.right + 4) fora.push(`direita ${r.x + r.w} > ${safe.right}`);
      if (fora.length) add('area-segura', i.kind === 'texto' ? 'erro' : 'aviso', `${nome} fora da margem ${safe.perfil} (${fora.join(', ')})`, nome);
    }
  }

  // 3 · tela cheia: o vídeo base cobre o quadro inteiro e não há cópia desfocada atrás
  for (const m of a.base || []) {
    if (m.blur) add('tela-cheia', 'erro', `vídeo base duplicado e desfocado atrás (${m.id}); use só o vídeo em tela cheia`, 'blur' + m.id);
    else if (m.rect.x > 1 || m.rect.y > 1 || m.rect.x + m.rect.w < W - 1 || m.rect.y + m.rect.h < H - 1)
      add('tela-cheia', 'erro', `vídeo base (${m.id}) menor que o quadro (${m.rect.x},${m.rect.y} ${m.rect.w}×${m.rect.h}); para disfarçar corte, aumente (escala ≥ 1)`, 'size' + m.id);
    if (m.mask) add('tela-cheia', 'erro', `vídeo base (${m.id}) com máscara nas bordas`, 'mask' + m.id);
  }

  // 4 · números
  const nums = a.nums.join(' ');
  if (/[−-]0(?:[.,]0+)?%/.test(nums)) add('numeros', 'erro', `valor zerado com sinal (${a.nums.filter(n => /^[−-]0/.test(n)).join(', ')}): confira a contagem`);
  if (numsLater.join(' ') !== nums) add('numeros', 'aviso', `número ainda animando neste quadro (${a.nums.join(' ')} → ${numsLater.join(' ')}); escolha um instante em que o valor já parou`);
  for (const want of expect?.numeros?.[frame.id] ?? []) {
    const w = want.replace(/\s+/g, '').replace('-', '−');
    if (!a.nums.some(n => n.replace('-', '−') === w)) add('numeros', 'erro', `esperava ${want} (qa.expect.json) e o quadro mostra: ${a.nums.join(' ') || 'nenhum número'}`, 'exp' + want);
  }
  return out;
}

export function checkGlobal({ results, job, expect }) {
  const out = [];
  // 5 · fonte e look vs. escolha
  const fam = new Map(); let italicChars = 0, total = 0;
  for (const r of results) for (const i of r.items) if (i.kind === 'texto') {
    fam.set(i.family, (fam.get(i.family) || 0) + i.text.length); total += i.text.length; if (i.italic) italicChars += i.text.length;
  }
  const usadas = [...fam.entries()].sort((x, y) => y[1] - x[1]);
  const resumo = usadas.map(([f, n]) => `${f} ${pct(n / total)}`).join(', ');
  if (expect?.fontes) {
    for (const [f, n] of usadas) if (!expect.fontes.some(e => f.toLowerCase().includes(e.toLowerCase())))
      out.push({ regra: 'fonte', quadro: '*', nivel: 'erro', msg: `fonte "${f}" (${pct(n / total)} do texto) não está em qa.expect.json → fontes [${expect.fontes.join(', ')}]` });
  } else if (job?.devolutiva?.lettering) {
    const l = job.devolutiva.lettering.toLowerCase();
    if (/serif/.test(l) && !/sans/.test(l) && !usadas.some(([f]) => SERIF.test(f) && !SANS_ONLY.test(f)))
      out.push({ regra: 'fonte', quadro: '*', nivel: 'erro', msg: `a devolutiva pede serifado e o filme usa só: ${resumo}` });
    if (/it[aá]lic/.test(l) && italicChars / Math.max(1, total) < 0.05)
      out.push({ regra: 'fonte', quadro: '*', nivel: 'erro', msg: `a devolutiva pede itálico e ${pct(italicChars / Math.max(1, total))} do texto está em itálico` });
  }
  if (expect?.italico && italicChars / Math.max(1, total) < 0.05) out.push({ regra: 'fonte', quadro: '*', nivel: 'erro', msg: 'qa.expect.json pede itálico e quase nenhum texto está em itálico' });

  // 6 · frase repetida entre quadros (4 palavras seguidas)
  const por = new Map();
  for (const r of results) {
    if (/^(first|last)$/.test(r.id)) continue;
    const w = norm(r.items.filter(x => x.kind === 'texto').map(x => x.text).join(' ')).split(' ').filter(Boolean);
    for (let k = 0; k + 4 <= w.length; k++) { const s = w.slice(k, k + 4).join(' '); (por.get(s) ?? por.set(s, new Set()).get(s)).add(r.id); }
  }
  // a mesma peça viva em quadros seguidos não é repetição (peças ficam 3 s ou mais): só avisa se a frase some e volta
  const tempo = new Map(results.map(r => [r.id, r.t]));
  const volta = ids => { const ts = [...ids].map(id => tempo.get(id)).filter(Number.isFinite).sort((a, b) => a - b);
    for (let k = 1; k < ts.length; k++) if (ts[k] - ts[k - 1] > 4.5) return true; return ts.length < ids.size && ids.size > 1; };
  const dup = [...por].filter(([, ids]) => ids.size > 1 && volta(ids));
  const cobertas = new Set();
  for (const [s, ids] of dup) { const key = [...ids].sort().join('+'); if (cobertas.has(key)) continue; cobertas.add(key);
    out.push({ regra: 'frase-repetida', quadro: [...ids].join('+'), nivel: 'aviso', msg: `"${s}…" aparece em mais de um quadro; decida se mantém os dois` }); }
  console.log(`fontes usadas: ${resumo || 'nenhum texto'}`);
  return out;
}

// 7 · alinhamento à grade de batidas (só roda com beats.json). Compara no meio tempo (colcheia) para não gerar ruído.
export function checkBeats({ grid, sfx = [], timeline = [], fps = 30 }) {
  const out = [], tol = 1 / fps + 0.005;
  const verifica = (rotulo, quadro, t) => {
    const n = grid.nearest(t, 'half');
    if (Math.abs(n.dist) > tol) out.push({ regra: 'batida', quadro, nivel: 'aviso', msg: `${rotulo} em ${t.toFixed(2)} s está ${Math.round(n.dist * 1000)} ms da batida mais próxima; encaixe em ${n.time.toFixed(3)} s` });
  };
  for (const s of sfx) verifica(`SFX ${s.type}`, 'sfx', s.t);
  for (const r of timeline) if (typeof r.t === 'number') verifica(`cena ${r.id}`, r.id, r.t);
  return out;
}
