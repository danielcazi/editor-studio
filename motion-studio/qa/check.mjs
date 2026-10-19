// node motion-studio/qa/check.mjs <filmDir> [--job job.json] [--expect qa.expect.json] [--times r1:1.3,r2:2.7 | --step 1]
//                                 [--w 1080 --h 1920] [--out <filmDir>/../out/qa.json] [--no-fail]
// Margem: safezone.json (perfil de briefing.margem). Tela cheia: o vídeo base em #rig cobre o quadro, sem cópia desfocada.
// Verificação automática de um filme window.seek(t) antes de mostrar ao editor. Cada regra devolve
// { regra, quadro, nivel: 'erro'|'aviso', msg }. Sai com código 1 se houver erro (a menos que --no-fail).
// Quadros: storyboard.frames do job.json (padrão), --times id:t,... ou --step N (um quadro a cada N s).
import { chromium } from '../lib/pw.mjs';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { analyzeFrame } from './page-analyze.mjs';
import { createRequire } from 'node:module';
import { checkFrame, checkGlobal, checkBeats } from './rules.mjs';
import { safeZone } from './safezone.mjs';
const BeatGrid = createRequire(import.meta.url)('../lib/beatgrid.js');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = k => args.includes('--' + k);
const dir = resolve(args[0] || '.');
const W = +opt('w', 1080), H = +opt('h', 1920);

const jobPath = resolve(opt('job', join(dir, '..', 'job.json')));
const job = existsSync(jobPath) ? JSON.parse(readFileSync(jobPath, 'utf8')) : null;
const expectPath = resolve(opt('expect', join(dir, '..', 'qa.expect.json')));
const expect = existsSync(expectPath) ? JSON.parse(readFileSync(expectPath, 'utf8')) : {};
const safe = H / W > 1.7 ? safeZone(job, W, H) : null; // margem só no 9:16

const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto(pathToFileURL(join(dir, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.__ready);
const { dur, sfx, fps } = await page.evaluate(() => ({ dur: window.DURATION, sfx: window.SFX || [], fps: window.FPS || 30 }));

let frames;
if (opt('times')) frames = opt('times').split(',').map(s => { const [id, t] = s.split(':'); return { id, t: +t }; });
else if (opt('step')) { frames = []; for (let t = 0; t < (dur || 0); t += +opt('step')) frames.push({ id: 't' + t.toFixed(1), t: +t.toFixed(3) }); }
else if (job?.storyboard?.frames?.length) frames = job.storyboard.frames.map(f => ({ id: f.id, t: f.t }));
else { console.error('Sem quadros: passe --times, --step ou um job.json com storyboard.frames.'); process.exit(2); }

const SETTLE = 0.35;
const results = [];
const findings = [];
for (const f of frames) {
  await page.evaluate(t => window.seek(t), f.t);
  const a = await page.evaluate(analyzeFrame, { W, H });
  await page.evaluate(t => window.seek(t), f.t + SETTLE);
  const later = await page.evaluate(analyzeFrame, { W, H });
  results.push({ ...f, ...a, numsLater: later.nums });
  findings.push(...checkFrame({ frame: f, a, numsLater: later.nums, W, H, expect, safe }));
}
findings.push(...checkGlobal({ results, job, expect }));
// batidas: só se existir beats.json (--beats, <job>/beats.json ou <filme>/beats.json)
const beatsPath = [opt('beats', null), join(dir, '..', 'beats.json'), join(dir, 'beats.json')].filter(Boolean).map(p => resolve(p)).find(existsSync);
if (beatsPath) {
  const bj = JSON.parse(readFileSync(beatsPath, 'utf8'));
  const grid = bj.beatSec ? BeatGrid.from(bj) : BeatGrid.fromLegacy(bj);
  findings.push(...checkBeats({ grid, sfx, timeline: job?.timeline ?? [], fps }));
}
await browser.close();

const out = resolve(opt('out', join(dir, '..', 'out', 'qa.json')));
mkdirSync(dirname(out), { recursive: true });
const erros = findings.filter(x => x.nivel === 'erro').length, avisos = findings.length - erros;
writeFileSync(out, JSON.stringify({ film: dir, job: job?.id ?? null, checkedAt: new Date().toISOString(), frames: frames.length, erros, avisos, findings }, null, 1));
for (const x of findings) console.log(`${x.nivel === 'erro' ? 'ERRO ' : 'aviso'}  ${x.regra.padEnd(12)} ${String(x.quadro).padEnd(8)} ${x.msg}`);
console.log(`\n${frames.length} quadros · ${erros} erro(s) · ${avisos} aviso(s) → ${out}`);
process.exit(erros && !flag('no-fail') ? 1 : 0);
