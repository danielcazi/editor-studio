#!/usr/bin/env node
// Confere o texto que o filme realmente pinta em cada quadro do storyboard (sem OCR: lê o DOM visível).
// Pega "−0%", NaN, undefined, null, números fora de dados.json e quadros sem nenhum texto.
// Uso: node editor-studio/tools/check_storyboard.mjs <job-id> [--film pasta] [--json]
// Sai com 1 se achar algo.
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { chromium } = createRequire(join(REPO, 'motion-studio', 'package.json'))('playwright');
const args = process.argv.slice(2);
const jobId = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!jobId) { console.error('uso: check_storyboard.mjs <job-id> [--film pasta] [--json]'); process.exit(2); }

const job = JSON.parse(readFileSync(join(REPO, 'videos', jobId, 'job.json'), 'utf8'));
const film = resolve(REPO, opt('film', join('videos', jobId, 'filme')));
const dadosFile = join(REPO, 'videos', jobId, 'dados.json');
const dados = existsSync(dadosFile) ? JSON.parse(readFileSync(dadosFile, 'utf8')) : {};
const permitidos = new Set(Object.values(dados).map(d => String(d.texto ?? d.valor).replace('%', '')));

const quadros = ((job.storyboard || {}).frames || []).length ? job.storyboard.frames
  : (job.timeline || []).filter(r => r.status !== 'passa').map(r => ({ id: r.id, t: Number(r.t) + 0.6 }));
const SUSPEITO = [[/[−-]\s?0(?:[,.]0+)?\s?%/, 'variação "−0%" (valor zerado?)'], [/\bNaN\b/, 'NaN'], [/\bundefined\b/, 'undefined'], [/\bnull\b/, 'null'], [/\bInfinity\b/, 'Infinity'], [/\{\{|\}\}|\$\{/, 'template não resolvido']];

const browser = await chromium.launch({ args: ['--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(film, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.__ready);

const achados = [];
for (const q of quadros) {
  await page.evaluate(t => window.seek(t), +q.t);
  const textos = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('#scenes *')) {
      const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
      if (!t) continue;
      let op = 1, off = false;
      for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); op *= +cs.opacity; if (cs.display === 'none' || cs.visibility === 'hidden') off = true; }
      if (!off && op >= 0.3) out.push(t);
    }
    return out;
  });
  if (!textos.length && !['first', 'last'].includes(String(q.id)) && !/primeiro|último/i.test(String(q.label || ''))) achados.push({ quadro: q.id, t: q.t, problema: 'nenhum texto visível' });
  for (const t of textos) {
    for (const [re, nome] of SUSPEITO) if (re.test(t)) achados.push({ quadro: q.id, t: q.t, texto: t, problema: nome });
    if (permitidos.size) for (const n of t.match(/\d+(?:[,.]\d+)?(?=\s?%)/g) || []) {
      if (!permitidos.has(n) && !permitidos.has(n.replace('.', ','))) achados.push({ quadro: q.id, t: q.t, texto: t, problema: `${n}% não está em dados.json` });
    }
  }
}
await browser.close();
if (args.includes('--json')) console.log(JSON.stringify({ ok: !achados.length, achados }));
else if (!achados.length) console.log(`ok · ${quadros.length} quadros sem texto suspeito`);
else for (const a of achados) console.log(`- ${a.quadro} @${(+a.t).toFixed(1)}s ${a.problema}${a.texto ? ` · "${a.texto}"` : ''}`);
process.exit(achados.length ? 1 : 0);
