// node library/build.mjs [--force] [--only M05,M07]
// Gera as miniaturas que faltam (library/thumbs/<id>.jpg) e reescreve library/gallery.html
// com library.json + ideas.json embutidos (file:// não deixa a página ler JSON).
import { chromium } from '../lib/pw.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const LIB = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(LIB, '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = (args[args.indexOf('--only') + 1] || '').split(',').filter(Boolean);
const lib = JSON.parse(readFileSync(join(LIB, 'library.json'), 'utf8'));
const ideas = JSON.parse(readFileSync(join(LIB, 'ideas.json'), 'utf8'));

/* ---------------- miniaturas ---------------- */
const THUMBS = join(LIB, 'thumbs');
mkdirSync(THUMBS, { recursive: true });
const todo = lib.modules.filter(m => m.thumb && (only.length ? only.includes(m.id) : force || !existsSync(join(THUMBS, m.id + '.jpg'))));
if (todo.length) {
  const browser = await chromium.launch({ args: ['--disable-lcd-text', '--font-render-hinting=none'] });
  const groups = {};
  for (const m of todo) (groups[`${m.thumb.film}|${m.thumb.w}|${m.thumb.h}|${m.thumb.query || ''}`] ||= []).push(m);
  for (const [key, mods] of Object.entries(groups)) {
    const [film, w, h, query] = key.split('|');
    const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error(`pageerror (${film}):`, e.message));
    await page.goto(pathToFileURL(join(ROOT, film, 'index.html')).href + (query ? '?' + query : ''), { waitUntil: 'networkidle' });
    await page.evaluate(() => window.__ready);
    for (const m of mods) {
      await page.evaluate(t => window.seek(t), m.thumb.t);
      const tmp = join(THUMBS, `.${m.id}.png`);
      await page.screenshot({ path: tmp });
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-vf', `scale=${+w > +h ? 640 : 360}:-2`, '-q:v', '3', join(THUMBS, m.id + '.jpg')]);
      execFileSync('rm', [tmp]);
      console.log(`thumb ${m.id} ← ${film} @ ${m.thumb.t}s`);
    }
    await page.close();
  }
  await browser.close();
}

/* ---------------- galeria ---------------- */
const tpl = readFileSync(join(LIB, 'gallery.template.html'), 'utf8');
// miniaturas embutidas: a galeria abre sozinha em qualquer lugar (preview, outra máquina)
const thumbs = {};
for (const m of lib.modules) {
  const f = join(THUMBS, m.id + '.jpg');
  if (existsSync(f)) thumbs[m.id] = 'data:image/jpeg;base64,' + readFileSync(f).toString('base64');
}
// stills das ideias, reduzidos para a galeria
for (const i of ideas.ideas) for (const o of i.stills || []) {
  const src = join(LIB, o.file), key = `${i.id}-${o.key}`, f = join(THUMBS, key + '.jpg');
  if (!existsSync(src)) continue;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', 'scale=560:-2', '-q:v', '3', f]);
  thumbs[key] = 'data:image/jpeg;base64,' + readFileSync(f).toString('base64');
}
const data = JSON.stringify({ lib, ideas, thumbs, builtAt: new Date().toISOString() }).replace(/</g, '\\u003c');
writeFileSync(join(LIB, 'gallery.html'), tpl.replace('/*__DATA__*/null', data));
console.log(`ok ${lib.modules.length} módulos, ${ideas.ideas.length} ideias → library/gallery.html`);
