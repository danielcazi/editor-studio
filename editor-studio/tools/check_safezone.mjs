#!/usr/bin/env node
// Confere se o texto do filme cobre a cabeça/rosto da pessoa recortada e se sai da área segura.
// Para cada momento da timeline: pinta o filme em window.seek(t), mede a caixa de todo texto visível
// em #scenes e cruza com o alfa da pessoa (filme/assets/mseq/NNNNN.png). Sugere o deslocamento vertical
// que tira o texto de cima da cabeça.
// Margem: motion-studio/qa/safezone.json (perfil de briefing.margem; padrão Meta Ads). --safe topo,base,esq,dir força outra.
// Uso: node editor-studio/tools/check_safezone.mjs <job-id> [--film pasta] [--w 1080 --h 1920] [--json] [--safe 270,1248,65,1015]
// Sai com 0 se está tudo limpo e 1 se houver título sobre a cabeça ou fora da área segura.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { safeZone } from '../../motion-studio/qa/safezone.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { chromium } = createRequire(join(REPO, 'motion-studio', 'package.json'))('playwright');
const args = process.argv.slice(2);
const jobId = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!jobId) { console.error('uso: check_safezone.mjs <job-id> [--film pasta] [--json] [--safe topo,base,esq,dir]'); process.exit(2); }

const W = +opt('w', 1080), H = +opt('h', 1920);
const job = JSON.parse(readFileSync(join(REPO, 'videos', jobId, 'job.json'), 'utf8'));
const Z = safeZone(job, W, H);
const [SAFE_TOP, SAFE_BOT, SAFE_L, SAFE_R] = opt('safe', null) ? opt('safe').split(',').map(Number) : [Z.top, Z.bottom, Z.left, Z.right];
const film = resolve(REPO, opt('film', join('videos', jobId, 'filme')));
const mseq = join(film, 'assets', 'mseq');
const matteFiles = existsSync(mseq) ? readdirSync(mseq).filter(f => /^\d+\.png$/.test(f)).map(f => +f.slice(0, -4)).sort((a, b) => a - b) : [];

const nearestMatte = fi => {
  if (!matteFiles.length) return null;
  let best = matteFiles[0];
  for (const n of matteFiles) if (Math.abs(n - fi) < Math.abs(best - fi)) best = n;
  return join(mseq, String(best).padStart(5, '0') + '.png');
};
// alfa da pessoa como bytes (W*H), lido via ffmpeg
const alphaOf = file => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `alphaextract,scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: W * H * 2 });
  return r.status === 0 && r.stdout.length >= W * H ? r.stdout : null;
};
// caixa da pessoa e faixa da cabeça (28% superiores da altura da silhueta)
const personBox = a => {
  let top = -1, bot = -1, left = W, right = 0;
  for (let y = 0; y < H; y++) {
    let any = false;
    for (let x = 0; x < W; x += 4) if (a[y * W + x] > 128) { any = true; if (x < left) left = x; if (x > right) right = x; }
    if (any) { if (top < 0) top = y; bot = y; }
  }
  return top < 0 ? null : { top, bot, left, right, headBot: Math.round(top + (bot - top) * 0.28) };
};
const overlap = (a, box, y0, y1) => {
  let hit = 0, tot = 0;
  const xa = Math.max(0, Math.floor(box.x)), xb = Math.min(W, Math.ceil(box.x + box.w));
  const ya = Math.max(y0, Math.floor(box.y)), yb = Math.min(y1, Math.ceil(box.y + box.h));
  for (let y = ya; y < yb; y += 2) for (let x = xa; x < xb; x += 2) { tot++; if (a[y * W + x] > 128) hit++; }
  return tot ? hit / tot : 0;
};

const rows = (job.timeline || []).filter(r => !/^pass/.test(r.status || '') && Number.isFinite(Number(r.t)));
const browser = await chromium.launch({ args: ['--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto(pathToFileURL(join(film, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.__ready);
const fps = await page.evaluate(() => window.FPS || 30);

const problemas = [];
for (const r of rows) {
  const t = Number(r.t) + 0.6; // momento em que a peça já entrou
  await page.evaluate(t => window.seek(t), t);
  const boxes = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('#scenes *')) {
      const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
      if (!txt) continue;
      let op = 1, hidden = false;
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e); op *= +cs.opacity; if (cs.display === 'none' || cs.visibility === 'hidden') hidden = true;
      }
      // caixa das letras (não do elemento: um texto centralizado numa div de 1080 px não sai da margem)
      let b = null;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) {
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) if (r.width && r.height) b = b ? { x: Math.min(b.x, r.x), y: Math.min(b.y, r.y), r: Math.max(b.r, r.right), bt: Math.max(b.bt, r.bottom) } : { x: r.x, y: r.y, r: r.right, bt: r.bottom };
      }
      if (!b) continue;
      b = { x: b.x, y: b.y, width: b.r - b.x, height: b.bt - b.y };
      if (hidden || op < 0.3 || b.width < 4 || b.height < 4) continue;
      out.push({ txt: txt.slice(0, 40), x: b.x, y: b.y, w: b.width, h: b.height });
    }
    return out;
  });
  const mf = nearestMatte(Math.round(t * fps) + 1);
  const a = mf ? alphaOf(mf) : null;
  const pb = a ? personBox(a) : null;
  for (const b of boxes) {
    const fora = b.y < SAFE_TOP - 1 || b.y + b.h > SAFE_BOT + 1 || b.x < SAFE_L - 1 || b.x + b.w > SAFE_R + 1;
    const cabeca = pb ? overlap(a, b, pb.top, pb.headBot) : 0;
    const corpo = pb ? overlap(a, b, pb.headBot, pb.bot) : 0;
    if (!fora && cabeca === 0) continue;
    const p = { quadro: r.id, t: +t.toFixed(2), texto: b.txt, caixa: [b.x, b.y, b.w, b.h].map(Math.round), cabeca: +cabeca.toFixed(2), corpo: +corpo.toFixed(2), foraDaAreaSegura: fora };
    if (cabeca > 0 && pb) { // quanto subir ou descer para sair da cabeça
      const sobe = b.y + b.h - (pb.top - 12), desce = pb.headBot + 12 - b.y;
      p.sugestao = b.y - sobe >= SAFE_TOP ? { dy: -Math.round(sobe) } : b.y + b.h + desce <= SAFE_BOT ? { dy: Math.round(desce) } : { dy: 0, nota: 'sem espaço: reduzir a escala ou mover para o lado' };
    }
    problemas.push(p);
  }
}
await browser.close();

if (args.includes('--json')) console.log(JSON.stringify({ ok: !problemas.length, problemas }));
else if (!problemas.length) console.log(`ok · ${rows.length} momentos sem texto sobre a cabeça e dentro da margem (x ${SAFE_L}–${SAFE_R}, y ${SAFE_TOP}–${SAFE_BOT})`);
else {
  console.log(`${problemas.length} problema(s):`);
  for (const p of problemas) console.log(`- ${p.quadro} @${p.t}s "${p.texto}" ${p.caixa.join(',')}` + (p.cabeca ? ` · cobre ${Math.round(p.cabeca * 100)}% da cabeça` : '') + (p.foraDaAreaSegura ? ' · fora da área segura' : '') + (p.sugestao ? ` · sugestão: dy ${p.sugestao.dy}${p.sugestao.nota ? ' (' + p.sugestao.nota + ')' : ''}` : ''));
}
process.exit(problemas.length ? 1 : 0);
