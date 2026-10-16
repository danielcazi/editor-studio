// node render.mjs <filmDir> [--query layer=bg] [--w 1920 --h 1080] [--frames out/frames] [--sheet out/sheet.png --step 0.5] [--workers 4] [--from 0 --to 45]
// Renderiza um filme que expõe window.seek(t). Cada quadro é função pura do tempo.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const dir = resolve(args[0] || '.');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const W = +opt('w', 1920), H = +opt('h', 1080);

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto(pathToFileURL(join(dir, 'index.html')).href + (opt('query', '') ? '?' + opt('query', '') : ''), { waitUntil: 'networkidle' });
  await page.evaluate(() => window.__ready);
  return page;
}

const browser = await chromium.launch({ args: ['--disable-lcd-text', '--font-render-hinting=none'] });
const first = await openPage(browser);
const meta = await first.evaluate(() => ({ dur: window.DURATION, fps: window.FPS, sfx: window.SFX }));
mkdirSync(join(dir, 'out'), { recursive: true });
writeFileSync(join(dir, 'out', 'sfx.json'), JSON.stringify(meta.sfx));

const fps = +opt('fps', meta.fps);
const from = +opt('from', 0), to = +opt('to', meta.dur);
const sheet = opt('sheet', null);
const times = [];
if (sheet) { const step = +opt('step', 0.5); for (let t = from; t < to - 1e-6; t += step) times.push(+t.toFixed(3)); }
else { const n = Math.round((to - from) * fps); for (let i = 0; i < n; i++) times.push(from + i / fps); }

const framesDir = resolve(opt('frames', join(dir, 'out', sheet ? 'sheet' : 'frames')));
mkdirSync(framesDir, { recursive: true });
const workers = +opt('workers', 4);
const pages = [first];
for (let i = 1; i < workers; i++) pages.push(await openPage(browser));

let next = 0, done = 0;
const t0 = Date.now();
await Promise.all(pages.map(async page => {
  while (next < times.length) {
    const i = next++, t = times[i];
    await page.evaluate(t => window.seek(t), t);
    await page.screenshot({ path: join(framesDir, `${String(i).padStart(5, '0')}.${opt('type', 'png') === 'jpeg' ? 'jpg' : 'png'}`), type: opt('type', 'png'), ...(opt('type', 'png') === 'jpeg' ? { quality: 95 } : { omitBackground: true }) });
    done++;
    if (done % 60 === 0) process.stdout.write(`\r${done}/${times.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}));
writeFileSync(join(framesDir, 'times.json'), JSON.stringify(times));
console.log(`\nok ${times.length} quadros → ${framesDir}`);
await browser.close();
