// node sb.mjs <saida-dir> [round] [ids...]  → quadros do storyboard em JPG 1080×1920 (um por linha da timeline + primeiro e último).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
export const SB = [
  { id: 'first', t: 0.1, label: 'Primeiro quadro' },
  { id: 'r1', t: 1.3, label: 'Connect rate no Gerenciador' },
  { id: 'r2', t: 2.7, label: 'Pagou? (bloco de marca)' },
  { id: 'r3', t: 4.6, label: 'Página abre rápido' },
  { id: 'r4', t: 8.3, label: 'O clique vai embora' },
  { id: 'r5', t: 13.3, label: 'Sem plugins' },
  { id: 'r6', t: 15.9, label: 'Speed 99/100' },
  { id: 'r7', t: 21.5, label: 'Connect rate acima de 80%' },
  { id: 'r8', t: 25.0, label: 'Cada clique custou dinheiro' },
  { id: 'r9', t: 28.8, label: 'Insula Build, pronta pra tráfego' },
  { id: 'r10', t: 32.3, label: 'Páginas bonitas e prontas' },
  { id: 'r11', t: 36.0, label: 'IA via MCP' },
  { id: 'r12', t: 40.3, label: 'Pixel a pixel' },
  { id: 'r13', t: 44.5, label: '7 dias grátis' },
  { id: 'last', t: 46.55, label: 'Último quadro' },
];
const out = resolve(process.argv[2] || join(here, 'out', 'sb'));
const round = process.argv[3] || '1';
const only = process.argv.slice(4);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto(pathToFileURL(join(here, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.__ready);
const done = [];
for (const f of SB) {
  if (only.length && !only.includes(f.id)) continue;
  await page.evaluate(t => window.seek(t), f.t);
  const file = join(out, `sb-${round}-${f.id}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
  done.push({ ...f, file });
}
writeFileSync(join(out, `sb-${round}.json`), JSON.stringify(done, null, 1));
console.log('ok', done.length);
await browser.close();
