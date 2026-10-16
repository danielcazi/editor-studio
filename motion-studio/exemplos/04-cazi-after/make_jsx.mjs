// node 04-cazi-s-efx-plano-pro-mv9xfoti/ae/make_jsx.mjs  (rodar de motion-studio/)
// Lê do filme HTML os títulos (linhas, tamanhos, tempos de cada palavra) e as linhas da timeline do job,
// e gera build_comp.jsx — script do After Effects que monta a comp 9x16.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILM = resolve(HERE, '..');
const JOB = resolve(FILM, '../job.json');

const browser = await chromium.launch({ args: ['--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(FILM, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.__ready);
const film = await page.evaluate(() => ({ dur: window.DURATION, fps: window.FPS, kw: window.KW_SPEC() }));
await browser.close();

const job = JSON.parse(readFileSync(JOB, 'utf8'));
const marks = (job.timeline || []).filter(r => r.status === 'ok').map(r => ({ t: r.t, name: r.id + ' · ' + (r.piece?.ref || '') + ' ' + (r.piece?.name || '') }));

const tpl = readFileSync(join(HERE, 'build_comp.template.jsx'), 'utf8');
writeFileSync(join(HERE, 'build_comp.jsx'), tpl.replace('/*__DATA__*/', 'var DATA = ' + JSON.stringify({ ...film, marks }, null, 1) + ';'));
console.log('ok build_comp.jsx', film.kw.length, 'blocos de título,', marks.length, 'marcadores');
