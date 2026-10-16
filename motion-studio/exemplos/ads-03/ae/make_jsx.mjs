// node ads-03-mvab2akf/ae/make_jsx.mjs <saida.aep>  (rodar de motion-studio/) → gera ae/build_comp.jsx
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), FILM = join(HERE, '..');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(FILM, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.__ready);
const d = await page.evaluate(async () => ({ titles: await window.TITLES_SPEC(), fps: window.FPS, dur: window.DURATION }));
await browser.close();
const sb = JSON.parse(readFileSync(join(FILM, '../out/sb-1.json'), 'utf8'));
const DATA = { fps: d.fps, dur: d.dur, titles: d.titles, aep: resolve(process.argv[2]),
  markers: sb.filter(f => f.id.startsWith('r')).map(f => ({ t: f.t, label: f.id + ' — ' + f.label })) };
const tpl = readFileSync(join(HERE, 'build_comp.template.jsx'), 'utf8');
writeFileSync(join(HERE, 'build_comp.jsx'), tpl.replace('/*__DATA__*/', 'var DATA = ' + JSON.stringify(DATA, null, 1) + ';'));
console.log('ok build_comp.jsx ·', d.titles.length, 'títulos nativos');
