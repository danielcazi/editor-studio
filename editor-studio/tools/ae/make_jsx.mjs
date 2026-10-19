#!/usr/bin/env node
// Gera a comp HÍBRIDA do After Effects a partir do filme HTML de um job (tarefa "video").
//   node editor-studio/tools/ae/make_jsx.mjs <job-id> [--film videos/<id>/filme] [--aep videos/<id>/out/<nome>.aep]
//        [--name "Ads 04"] [--out <pasta>] [--step 1] [--sem-clipes]
//   (padrão da saída: <film>/ae; --step N amostra a cada N quadros; --sem-clipes não renderiza os ProRes, só o jsx)
// Lê o filme com Chrome headless e amostra cada cena QUADRO A QUADRO. Cada peça (filho direto de #s-<id>) vira:
//   NATIVA   texto e caixas 2D: camadas de texto e shape layers presas a um null com keyframes de posição,
//            escala, rotação e opacidade iguais aos do HTML; sombra vira o efeito Drop Shadow. Editável.
//   CLIPE    3D/perspectiva, gradiente, SVG/imagem, filtro, máscara ou conteúdo que muda por dentro (contador,
//            digitação, barra enchendo): vídeo ProRes 4444 com alfa, idêntico ao MP4, em V/clips/.
// Grava em --out:
//   build_comp.jsx   o script do After (rode com run.jsx ou File > Scripts > Run Script File)
//   ae_report.json   peças nativas x clipes (com o motivo), fontes usadas e fontes que faltam no Mac
//   V/clips/*.mov    clipes ProRes 4444 com alfa
// De baixo para cima a comp tem: áudio, vídeo base (V/base), fundo (V/bg), títulos atrás da pessoa, pessoa (V/person),
// peças de cada cena, cortina de transição em shape e, desligada, a referência com o render HTML (V/gfx).
// As sequências V/{base,bg,person,gfx} saem do render.mjs com --query layer=<nome> (veja WORKFLOW.md, tarefa video).
//
// Contrato do filme (index.html + film.js em videos/<id>/filme):
//   window.seek(t) async; window.__ready; window.DURATION; window.FPS
//   window.SCENES = [{ id, a, b }]   b = fim da permanência da peça (t + hold), não a próxima linha
//   cada cena mora em #s-<id> dentro de #scenes (cada filho direto = uma peça); título atrás da pessoa em #back #b-<id>
//   (ou #back inteiro, modelo antigo); #rig = vídeo base; #person = recorte; #bgCream / #bgPurple = fundo; #wipe = cortina.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const args = process.argv.slice(2);
const jobId = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
if (!jobId) { console.error('uso: make_jsx.mjs <job-id> [--film pasta] [--aep arquivo.aep] [--name "Título"] [--out pasta] [--step 1] [--sem-clipes]'); process.exit(1); }

const CHROME = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && fs.existsSync(p));
if (!CHROME) { console.error('Chrome não encontrado. Instale o Google Chrome ou defina CHROME_PATH.'); process.exit(1); }

const job = JSON.parse(fs.readFileSync(path.join(REPO, 'videos', jobId, 'job.json'), 'utf8'));
const FILM = path.resolve(REPO, opt('film', path.join('videos', jobId, 'filme')));
const OUT = path.resolve(REPO, opt('out', path.join(FILM, 'ae')));
const NAME = opt('name', job.title || jobId);
const STEP = Math.max(1, +opt('step', 1));
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const AEP = path.resolve(REPO, opt('aep', path.join('videos', jobId, 'out', slug(NAME) + '.aep')));
const CLIPS = path.join(OUT, 'V', 'clips');
fs.mkdirSync(CLIPS, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--allow-file-access-from-files', '--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(FILM, 'index.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => window.__ready);
const base = await page.evaluate(() => ({ fps: window.FPS || 30, dur: window.DURATION, scenes: window.SCENES ? window.SCENES.map((s) => ({ id: s.id, a: s.a, b: s.b })) : null }));
const FPS = base.fps, DUR = base.dur;

// ---- cenas: do filme (window.SCENES) ou das linhas da timeline ----
let scenes = base.scenes;
if (!scenes) {
  const rows = (job.timeline || []).filter((r) => !/^pass/.test(String(r.status || '')) && Number.isFinite(Number(r.t))).sort((x, y) => x.t - y.t);
  scenes = rows.map((r, i) => ({ id: r.id, a: i === 0 ? 0 : Number(r.t), b: Number.isFinite(Number(r.hold)) ? Number(r.t) + Number(r.hold) : i + 1 < rows.length ? Number(rows[i + 1].t) : DUR }));
}
const avisos = [];

// ---- funções que rodam dentro da página ----
const INPAGE = () => {
  const num = (v) => parseFloat(v) || 0;
  const col = (s) => { const m = String(s).match(/[\d.]+/g) || []; return { c: [+m[0] || 0, +m[1] || 0, +m[2] || 0], a: m.length > 3 ? +m[3] : 1 }; };
  const vis = (el, stop) => { let o = 1; for (let n = el; n && n !== stop && n !== document.body; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden') return 0; o *= num(c.opacity); } return o; };
  const R = (r) => ({ x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  const textNodes = (el) => { const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) out.push(n); return out; };
  const direct = (el) => [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
  const inlineKids = (el) => [...el.children].every((c) => /^inline/.test(getComputedStyle(c).display) || c.tagName === 'BR');
  const ctx = document.createElement('canvas').getContext('2d');
  // primeira sombra externa: "rgba(0, 0, 0, 0.6) 0px 8px 36px [spread]" → { c, a, dx, dy, blur }
  const shadow = (s) => {
    if (!s || s === 'none') return null;
    for (const part of s.split(/,(?![^(]*\))/)) {
      if (/inset/.test(part)) continue;
      const c = col((part.match(/rgba?\([^)]*\)/) || ['rgb(0,0,0)'])[0]);
      const n = part.replace(/rgba?\([^)]*\)/, '').trim().split(/\s+/).map(num);
      if (c.a < 0.02) continue;
      return { c: c.c, a: c.a, dx: n[0] || 0, dy: n[1] || 0, blur: n[2] || 0 };
    }
    return null;
  };

  // por que uma peça não pode ser nativa (lista vazia = pode)
  const complexo = (p) => {
    const why = new Set();
    for (const el of [p, ...p.querySelectorAll('*')]) {
      const cs = getComputedStyle(el), tag = el.tagName.toLowerCase();
      if (/^(svg|img|canvas|video)$/.test(tag)) why.add('ilustração/imagem');
      if (/matrix3d/.test(cs.transform) || cs.perspective !== 'none' || cs.transformStyle === 'preserve-3d') why.add('3D/perspectiva');
      if (el !== p && cs.transform !== 'none' && !/^matrix\(1, 0, 0, 1,/.test(cs.transform)) why.add('transformação interna');
      if (cs.filter !== 'none' || cs.backdropFilter !== 'none') why.add('filtro');
      if (/gradient|url\(/.test(cs.backgroundImage)) why.add('gradiente/imagem de fundo');
      if (cs.clipPath !== 'none' || (cs.webkitMaskImage || 'none') !== 'none') why.add('máscara');
      if (cs.borderTopStyle === 'dashed' || cs.borderTopStyle === 'dotted') why.add('borda tracejada');
      if (el !== p && cs.overflow === 'hidden' && el.children.length) why.add('recorte (overflow)');
    }
    return [...why];
  };
  // assinatura do conteúdo da peça sem a transformação dela (muda se algo se mexe por dentro)
  const assinatura = (p) => {
    const r0 = p.getBoundingClientRect(), out = [];
    for (const el of p.querySelectorAll('*')) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      out.push([Math.round(r.left - r0.left), Math.round(r.top - r0.top), Math.round(r.width), Math.round(r.height), (+cs.opacity).toFixed(2), cs.backgroundColor, cs.color].join(','));
    }
    out.push(p.textContent.replace(/\s+/g, ' ').trim(), Math.round(r0.width), Math.round(r0.height));
    return out.join('|');
  };
  const raizes = (id) => {
    const out = [];
    const s = document.querySelector('#scenes #s-' + CSS.escape(id)); if (s) out.push({ z: 'scene', root: s });
    const b = document.querySelector('#back #b-' + CSS.escape(id));
    if (b) out.push({ z: 'back', root: b });
    else { const bk = document.querySelector('#back'); if (bk && !bk.querySelector('[id^="b-"]') && bk.children.length) out.push({ z: 'back', root: bk, legado: true }); }
    return out;
  };
  // medida de cada peça no quadro atual
  const sondar = (id) => raizes(id).map(({ z, root, legado }) => ({ z, legado: !!legado, rootOn: getComputedStyle(root).display !== 'none', pecas: [...root.children].map((p, i) => {
    const cs = getComputedStyle(p);
    const op = vis(p);
    if (!op || cs.display === 'none') return { i, on: false };
    const m = cs.transform === 'none' ? [1, 0, 0, 1, 0, 0] : /^matrix\(/.test(cs.transform) ? cs.transform.slice(7, -1).split(',').map(Number) : null;
    // caixa total com a transformação (para recortar o clipe)
    let bb = p.getBoundingClientRect(); let L = bb.left, T = bb.top, Rr = bb.right, B = bb.bottom;
    for (const d of p.querySelectorAll('*')) { const r = d.getBoundingClientRect(); if (r.width && r.height) { L = Math.min(L, r.left); T = Math.min(T, r.top); Rr = Math.max(Rr, r.right); B = Math.max(B, r.bottom); } }
    const why = complexo(p);
    const salvo = p.style.transform; p.style.transform = 'none';
    const r0 = p.getBoundingClientRect(), org = cs.transformOrigin.split(' ').map(num), sig = assinatura(p);
    p.style.transform = salvo;
    return { i, on: true, op: +op.toFixed(4), m, O: [r0.left + org[0], r0.top + org[1]], sig, why, box: [L, T, Rr, B] };
  }) }));

  // camadas nativas da peça na pose de repouso (sem a transformação e com opacidade 1 da própria peça)
  const extrair = (p) => {
    const out = { shapes: [], texts: [], avisos: [] }; let ord = 0;
    const salvoT = p.style.transform, salvoO = p.style.opacity; p.style.transform = 'none'; p.style.opacity = '1';
    const stop = p.parentElement;
    const shapeOf = (el, o, cs) => {
      const bg = col(cs.backgroundColor);
      const fill = bg.a > 0.01 ? bg : null;
      const bw = num(cs.borderTopWidth), bc = col(cs.borderTopColor);
      const stroke = bw > 0 && cs.borderTopStyle !== 'none' && bc.a > 0.01 ? { c: bc.c, a: bc.a, w: bw } : null;
      if (!fill && !stroke) return;
      const rects = el.getClientRects().length > 1 ? [...el.getClientRects()] : [el.getBoundingClientRect()];
      for (const r of rects) {
        if (r.width < 2 || r.height < 2) continue;
        let rad = cs.borderTopLeftRadius; rad = /%/.test(rad) ? Math.min(r.width, r.height) * num(rad) / 100 : num(rad);
        out.shapes.push({ ord: ord++, ...R(r), rad: Math.min(rad, Math.min(r.width, r.height) / 2), fill, stroke, o: +o.toFixed(3), sh: shadow(cs.boxShadow), cls: String(el.className || el.tagName).slice(0, 40) });
      }
    };
    const textOf = (el, o, cs) => {
      const size = num(cs.fontSize), pre = /^pre/.test(cs.whiteSpace), up = cs.textTransform === 'uppercase';
      const rg = document.createRange();
      let txt = '', lastTop = null, first = null, box = null;
      for (const node of textNodes(el)) {
        const s = node.textContent;
        for (let i = 0; i < s.length; i++) {
          let ch = s[i];
          if (ch === '\n' && pre) { txt += '\n'; lastTop = null; continue; }
          rg.setStart(node, i); rg.setEnd(node, i + 1);
          const rc = rg.getClientRects()[0];
          if (!rc || (rc.width === 0 && rc.height === 0)) continue;
          if (/\s/.test(ch)) ch = ' ';
          if (lastTop !== null && rc.top - lastTop > size * 0.5) txt = txt.replace(/ +$/, '') + '\n';
          if (ch !== ' ') lastTop = rc.top; else if (lastTop === null) lastTop = rc.top;
          if (!first && ch !== ' ') first = rc;
          if (ch !== ' ') box = box ? { l: Math.min(box.l, rc.left), r: Math.max(box.r, rc.right), t: Math.min(box.t, rc.top), b: Math.max(box.b, rc.bottom) } : { l: rc.left, r: rc.right, t: rc.top, b: rc.bottom };
          txt += up ? ch.toUpperCase() : ch;
        }
      }
      txt = txt.replace(/ {2,}/g, ' ').replace(/ *\n */g, '\n').trim();
      if (!txt || !box) return;
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      ctx.font = `${cs.fontWeight} ${size}px "${fam}"`;
      const asc = ctx.measureText('Hg').fontBoundingBoxAscent || size * 0.95;
      const lh = num(cs.lineHeight) || size * 1.2;
      const tc = col(cs.color);
      const al = cs.textAlign === 'center' ? 'center' : (cs.textAlign === 'right' || cs.textAlign === 'end') ? 'right' : 'left';
      out.texts.push({ ord: ord++, text: txt, fam, weight: num(cs.fontWeight), size, color: tc.c, alpha: tc.a, align: al, lh,
        track: cs.letterSpacing === 'normal' ? 0 : num(cs.letterSpacing) / size * 1000,
        x: +(al === 'center' ? (box.l + box.r) / 2 : al === 'right' ? box.r : box.l).toFixed(1), l: +box.l.toFixed(1), lines: txt.split('\n').length, base: +(first.top + asc).toFixed(1), w: +(box.r - box.l).toFixed(1), o: +o.toFixed(3),
        sh: shadow(cs.textShadow), cls: String(el.className || el.tagName).slice(0, 40) });
    };
    const walk = (el) => {
      const o = vis(el, stop); if (!o) return;
      const cs = getComputedStyle(el);
      shapeOf(el, o, cs);
      if (direct(el) && inlineKids(el)) { textOf(el, o, cs); [...el.querySelectorAll('*')].forEach((d) => { const v = vis(d, stop); if (v) shapeOf(d, v, getComputedStyle(d)); }); return; }
      if (direct(el)) { out.avisos.push('texto misturado com blocos: ' + String(el.className || el.tagName)); textOf(el, o, cs); }
      for (const c of el.children) walk(c);
    };
    walk(p);
    p.style.transform = salvoT; p.style.opacity = salvoO;
    return out;
  };
  const isolar = (id, z, i) => {
    document.querySelectorAll('[data-ae-only]').forEach((e) => e.removeAttribute('data-ae-only'));
    const r = raizes(id).find((x) => x.z === z); const p = r && r.root.children[i];
    if (p) p.setAttribute('data-ae-only', '1');
    return !!p;
  };
  const peca = (id, z, i) => { const r = raizes(id).find((x) => x.z === z); return r && r.root.children[i]; };
  return { sondar, extrair: (id, z, i) => { const p = peca(id, z, i); return p ? extrair(p) : null; }, isolar };
};
await page.evaluate(`window.__AE = (${INPAGE.toString()})();`);
const seek = (t) => page.evaluate((x) => window.seek(x), t);
const STYLE_ONLY = 'html,body,#stage{background:transparent!important}body *{visibility:hidden!important}[data-ae-only],[data-ae-only] *{visibility:visible!important}';

// ---- amostragem quadro a quadro ----
const r3 = (x) => +x.toFixed(3);
// visibilidade do vídeo base e da pessoa por quadro (cenas se sobrepõem: os trechos saem dos quadros, não das cenas)
const VIS = new Map();
const spansFrom = (key) => { const fs_ = [...VIS.keys()].sort((x, y) => x - y), out = []; let cur = null;
  for (const f of fs_) { if (VIS.get(f)[key]) { if (cur && f - cur.f1 <= 3) cur.f1 = f; else { cur = { f0: f, f1: f }; out.push(cur); } } }
  return out.map((c) => ({ a: r3(c.f0 / FPS), b: r3(Math.min(DUR, (c.f1 + 1) / FPS)) })); };
const pieces = [];   // { scene, z, i, kind: 'native'|'clip', a, b, why, ... }
const fontsUsed = new Set();
let nNat = 0, nClip = 0;

for (const sc of scenes) {
  const a = Math.max(0, sc.a), b = Math.min(DUR, sc.b);
  const f0 = Math.round(a * FPS), f1 = Math.max(f0 + 1, Math.round(b * FPS));
  const tracks = new Map(); // chave z:i → amostras
  for (let f = f0; f < f1; f += STEP) {
    const t = f / FPS;
    await seek(t);
    const st = await page.evaluate(() => { const q = (s) => document.querySelector(s), on = (e) => !!e && getComputedStyle(e).display !== 'none'; return { rig: q('#rig') ? on(q('#rig')) : true, person: q('#person') ? on(q('#person')) : false }; });
    VIS.set(f, st);
    const sond = await page.evaluate((id) => window.__AE.sondar(id), sc.id);
    for (const r of sond) {
      if (r.legado && f === f0) avisos.push(`cena ${sc.id}: #back sem #b-${sc.id}; o título atrás da pessoa entra em todas as cenas em que aparece`);
      for (const p of r.pecas) {
        const k = r.z + ':' + p.i;
        if (!tracks.has(k)) tracks.set(k, { z: r.z, i: p.i, s: [] });
        tracks.get(k).s.push({ t: r3(t), ...p });
      }
    }
  }
  for (const tr of tracks.values()) {
    const on = tr.s.filter((x) => x.on && x.op > 0.004);
    if (!on.length) continue;
    const pa = on[0].t, pb = Math.min(b, on[on.length - 1].t + STEP / FPS);
    const why = new Set(on.flatMap((x) => x.why));
    if (on.some((x) => !x.m)) why.add('transformação não 2D');
    const sigs = new Set(on.filter((x) => x.op > 0.05).map((x) => x.sig));
    if (sigs.size > 1) why.add('conteúdo muda por dentro (contador, digitação, barra, troca de texto)');
    // repouso: o quadro de maior opacidade (o do meio, se houver vários)
    const maxOp = Math.max(...on.map((x) => x.op)), tops = on.filter((x) => x.op >= maxOp - 0.01), rest = tops[Math.floor(tops.length / 2)];
    if (!why.size) {
      await seek(rest.t);
      const ex = await page.evaluate((id, z, i) => window.__AE.extrair(id, z, i), sc.id, tr.z, tr.i);
      if (!ex || (!ex.shapes.length && !ex.texts.length)) continue;
      ex.avisos.forEach((x) => avisos.push(`cena ${sc.id}: ${x}`));
      ex.texts.forEach((x) => fontsUsed.add(`${x.fam} ${x.weight}`));
      // keyframes do null: posição, rotação, escala; opacidade da peça (as camadas multiplicam pela própria)
      const keys = tr.s.map((x) => {
        if (!x.on || !x.m) return { t: x.t, op: 0 };
        const [ma, mb, mc, md, me, mf] = x.m, sx = Math.hypot(ma, mb), sy = sx ? (ma * md - mb * mc) / sx : 0;
        return { t: x.t, p: [+(x.O[0] + me).toFixed(2), +(x.O[1] + mf).toFixed(2)], r: +(Math.atan2(mb, ma) * 180 / Math.PI).toFixed(3), s: [+(sx * 100).toFixed(3), +(sy * 100).toFixed(3)], op: +(x.op * 100).toFixed(2) };
      });
      const O = rest.O;
      pieces.push({ kind: 'native', scene: sc.id, z: tr.z, i: tr.i, a: pa, b: pb, O: [+O[0].toFixed(2), +O[1].toFixed(2)], keys, shapes: ex.shapes, texts: ex.texts });
      nNat++;
    } else {
      // caixa do clipe: união das caixas em toda a duração + folga para sombra/brilho
      const PAD = 70;
      let L = 1e9, T = 1e9, Rr = -1e9, B = -1e9;
      for (const x of on) { L = Math.min(L, x.box[0]); T = Math.min(T, x.box[1]); Rr = Math.max(Rr, x.box[2]); B = Math.max(B, x.box[3]); }
      const x0 = Math.max(0, Math.floor(L - PAD)), y0 = Math.max(0, Math.floor(T - PAD));
      let w = Math.min(1080, Math.ceil(Rr + PAD)) - x0, h = Math.min(1920, Math.ceil(B + PAD)) - y0;
      w += w % 2; h += h % 2;
      const file = `V/clips/${sc.id}-${tr.z}-${tr.i}.mov`;
      pieces.push({ kind: 'clip', scene: sc.id, z: tr.z, i: tr.i, a: pa, b: pb, x: x0, y: y0, w, h, file, why: [...why], fps: FPS });
      nClip++;
    }
  }
  process.stdout.write(`\rcena ${sc.id} amostrada (${nNat} nativas, ${nClip} clipes)        `);
}
console.log('');
// quadros fora de qualquer cena: amostra a cada 3 para fechar os trechos do vídeo base e da pessoa
for (let f = 0; f < Math.round(DUR * FPS); f += 3) {
  if (VIS.has(f) || VIS.has(f - 1) || VIS.has(f + 1)) continue;
  await seek(f / FPS);
  VIS.set(f, await page.evaluate(() => { const q = (s) => document.querySelector(s), on = (e) => !!e && getComputedStyle(e).display !== 'none'; return { rig: q('#rig') ? on(q('#rig')) : true, person: q('#person') ? on(q('#person')) : false }; }));
}

// ---- clipes ProRes 4444 com alfa ----
if (!flag('sem-clipes')) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aeclip-'));
  const h = await page.addStyleTag({ content: STYLE_ONLY });
  for (const c of pieces.filter((p) => p.kind === 'clip')) {
    fs.readdirSync(tmp).forEach((f) => fs.unlinkSync(path.join(tmp, f)));
    const f0 = Math.round(c.a * FPS), f1 = Math.round(c.b * FPS);
    let n = 0;
    for (let f = f0; f < f1; f++) {
      await seek(f / FPS);
      await page.evaluate((id, z, i) => window.__AE.isolar(id, z, i), c.scene, c.z, c.i);
      await page.screenshot({ path: path.join(tmp, String(n++).padStart(5, '0') + '.png'), clip: { x: c.x, y: c.y, width: Math.min(c.w, 1080 - c.x), height: Math.min(c.h, 1920 - c.y) }, omitBackground: true });
    }
    const out = path.join(OUT, c.file);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(tmp, '%05d.png'), '-vf', `pad=${c.w}:${c.h}:0:0:color=black@0`,
      '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '9', '-alpha_bits', '16', out], { encoding: 'utf8' });
    if (r.status !== 0) { avisos.push(`clipe ${c.file}: ffmpeg falhou (${(r.stderr || '').slice(0, 160)})`); c.kind = 'erro'; }
    c.frames = n;
    process.stdout.write(`\rclipe ${c.file} (${n} quadros)        `);
  }
  await h.evaluate((e) => e.remove());
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('');
}

// ---- cortina de transição (#wipe): amostra os quadros ao redor de cada troca de cena ----
let wipe = null;
if (await page.evaluate(() => !!document.querySelector('#wipe'))) {
  const keys = []; let proto = null;
  const trocas = [...new Set(scenes.map((s) => s.a))].sort((x, y) => x - y);
  const visto = new Set();
  for (const B of trocas) {
    for (let t = B - 0.3; t <= B + 0.9 + 1e-6; t += 1 / FPS) {
      const f = Math.round(t * FPS); if (f < 0 || visto.has(f)) continue; visto.add(f);
      await seek(f / FPS);
      const w = await page.evaluate(() => { const e = document.querySelector('#wipe'), cs = getComputedStyle(e), r = e.getBoundingClientRect();
        return { on: cs.display !== 'none' && r.width > 1 && r.right > 0 && r.left < 1080, cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: e.offsetWidth, h: e.offsetHeight, bg: cs.backgroundColor, img: cs.backgroundImage, tf: cs.transform }; });
      keys.push({ t: +(f / FPS).toFixed(3), on: w.on, cx: +w.cx.toFixed(1), cy: +w.cy.toFixed(1) });
      if (w.on && !proto) proto = w;
    }
  }
  keys.sort((x, y) => x.t - y.t);
  if (proto) {
    const m = [...(proto.img.match(/rgba?\([^)]*\)/g) || []), proto.bg].map((s) => String(s).match(/[\d.]+/g) || []).filter((c) => c.length >= 3 && (c.length < 4 || +c[3] > 0.01))[0] || [111, 111, 201];
    if (proto.img !== 'none') avisos.push('cortina: gradiente aproximado por cor sólida');
    const mm = /^matrix\(/.test(proto.tf) ? proto.tf.slice(7, -1).split(',').map(Number) : [1, 0, 0, 1, 0, 0];
    wipe = { w: proto.w, h: proto.h, color: [+m[0], +m[1], +m[2]], skew: +(Math.atan(mm[2]) * 180 / Math.PI).toFixed(2), keys };
  }
}
await browser.close();

// ---- fontes: confere se estão instaladas no Mac (o After troca a fonte em silêncio quando falta) ----
const fontDirs = [path.join(os.homedir(), 'Library', 'Fonts'), '/Library/Fonts', '/System/Library/Fonts', '/System/Library/Fonts/Supplemental'];
const fontFiles = fontDirs.flatMap((d) => { try { return fs.readdirSync(d).map((f) => f.toLowerCase().replace(/[\s_-]/g, '')); } catch { return []; } });
const families = [...new Set([...fontsUsed].map((f) => f.replace(/ \d+$/, '')))];
const fontesFaltando = families.filter((fam) => !fontFiles.some((f) => f.startsWith(fam.toLowerCase().replace(/[\s_-]/g, ''))));
// fonte variável: o After escolhe a instância pelo nome, mas desenha o peso padrão (fica fina); peça os arquivos estáticos
const soVariavel = families.filter((fam) => { const k = fam.toLowerCase().replace(/[\s_-]/g, ''); const fs_ = fontFiles.filter((f) => f.startsWith(k)); return fs_.length && fs_.every((f) => /variable/.test(f)); });
if (soVariavel.length) avisos.push(`só a versão variável instalada para: ${soVariavel.join(', ')}. confira o peso dos textos nativos num quadro renderizado (os estáticos da pasta static/ do Google Fonts são mais seguros)`);
if (fontesFaltando.length) avisos.push(`fontes não instaladas neste Mac (o After vai trocar por outra): ${fontesFaltando.join(', ')}. Instale-as (Google Fonts) antes de rodar o run.jsx`);

const data = {
  name: NAME, fps: FPS, dur: DUR, aep: AEP,
  markers: scenes.map((s) => ({ t: s.a, label: s.id + ((job.timeline || []).find((r) => r.id === s.id) ? ' — ' + (job.timeline.find((r) => r.id === s.id).what || '').slice(0, 60) : '') })),
  base: spansFrom('rig'), person: spansFrom('person'), pieces: pieces.filter((p) => p.kind !== 'erro'), wipe,
};
const tpl = fs.readFileSync(path.join(HERE, 'build_comp.template.jsx'), 'utf8');
fs.writeFileSync(path.join(OUT, 'build_comp.jsx'), tpl.replace('/*__DATA__*/', 'var DATA = ' + JSON.stringify(data) + ';'));
// lançador: cria projeto novo, roda build_comp.jsx (que salva o .aep) e deixa o resultado em run.log
fs.writeFileSync(path.join(OUT, 'run.jsx'), `var f = new File((new File($.fileName)).parent.fsName + '/run.log'); f.open('w');
try {
  // não abre o diálogo "salvar alterações?": descarta só o projeto que o próprio gerador criou; outro projeto com alterações faz parar
  var alvo = new File(${JSON.stringify(AEP)});
  if (app.project && app.project.file && app.project.file.fsName === alvo.fsName) app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
  else if (app.project && app.project.dirty) throw new Error('há um projeto com alterações não salvas aberto no After; salve ou feche e rode de novo');
  app.newProject(); $.evalFile((new File($.fileName)).parent.fsName + '/build_comp.jsx'); f.writeln('ok ' + (app.project.file ? app.project.file.fsName : 'NAO SALVO')); }
catch (e) { f.writeln('erro: ' + e.toString() + ' linha ' + e.line); }
f.close();
`);
const nat = pieces.filter((p) => p.kind === 'native'), clips = pieces.filter((p) => p.kind === 'clip');
const report = { job: jobId, comp: NAME, aep: path.relative(REPO, AEP), fps: FPS, dur: DUR, cenas: scenes.length, passo_amostragem: STEP,
  camadas: { pessoa_trechos: data.person.length, base_trechos: data.base.length,
    pecas_nativas: nat.length, textos: nat.reduce((n, p) => n + p.texts.length, 0), formas: nat.reduce((n, p) => n + p.shapes.length, 0),
    clipes_prores: clips.length, cortina: wipe ? wipe.keys.length + ' quadros' : 'nenhuma' },
  nativas: nat.map((p) => `${p.scene} peça ${p.z}:${p.i} (${p.a.toFixed(2)}–${p.b.toFixed(2)} s): ${p.texts.map((x) => x.text.replace(/\n/g, ' ')).join(' / ') || p.shapes.length + ' forma(s)'}`),
  clipes: clips.map((p) => `${p.file} (${p.a.toFixed(2)}–${p.b.toFixed(2)} s, ${p.w}×${p.h}): ${p.why.join(', ')}`),
  trechos_pessoa: data.person, fontes_usadas: [...fontsUsed].sort(), fontes_faltando: fontesFaltando, avisos: [...new Set(avisos)] };
fs.writeFileSync(path.join(OUT, 'ae_report.json'), JSON.stringify(report, null, 2));
console.log(`ok ${path.relative(REPO, path.join(OUT, 'build_comp.jsx'))} · ${nat.length} peças nativas (${report.camadas.textos} textos, ${report.camadas.formas} formas) · ${clips.length} clipes ProRes 4444`
  + (fontesFaltando.length ? ` · FALTAM FONTES: ${fontesFaltando.join(', ')}` : ''));
