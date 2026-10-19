// Exporta os elementos de interface do filme insula-ads-cazi como PNG transparente (2x).
// uso: node motion-studio/tools/export-elements.mjs <filmDir> <outDir>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = resolve(process.argv[2]);
const out = resolve(process.argv[3]);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(join(dir, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.__ready);

// nome do arquivo → seletor (ou função que monta o elemento) + preparo do conteúdo
const items = await page.evaluate(() => {
  const ICON = (c, s) => `<svg viewBox="0 0 120 120" style="width:150px;height:150px"><circle cx="60" cy="60" r="60" fill="${c}"/><g fill="none" stroke="${s}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"><path d="M60 30l30 14-30 14-30-14z"/><path d="M30 60l30 14 30-14"/><path d="M30 75l30 14 30-14"/></g></svg>`;
  const reg = document.createElement('div');
  reg.id = 'exportArea';
  reg.style.cssText = 'position:absolute;left:0;top:0;z-index:99999;display:flex;flex-direction:column;align-items:flex-start;gap:40px;padding:20px';
  document.body.appendChild(reg);
  document.getElementById('stage').style.display = 'none';
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';

  const list = [];
  const add = (name, node) => {
    const w = document.createElement('div');
    w.style.cssText = 'padding:70px;display:inline-block;position:relative';
    // limpa transformações do filme
    node.style.transform = 'none'; node.style.opacity = '1'; if (node.style.display === 'none') node.style.display = '';
    node.style.position = 'relative'; node.style.left = '0'; node.style.top = '0';
    w.appendChild(node); reg.appendChild(w);
    w.dataset.exp = name; list.push(name);
  };
  const clone = sel => document.querySelector(sel).cloneNode(true);

  // logos
  const mkLogo = (iconC, iconS, cB, cS) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:30px';
    d.innerHTML = `${ICON(iconC, iconS)}<div style="font-family:Comfortaa,sans-serif;font-size:118px;line-height:150px;letter-spacing:-0.02em;white-space:nowrap"><b style="font-weight:700;color:${cB}">insula</b><span style="font-weight:400;color:${cS}">build</span></div>`;
    return d;
  };
  add('logo-insula-branco', mkLogo('#fff', '#6f6fc9', '#fff', 'rgba(255,255,255,.85)'));
  add('logo-insula-roxo', mkLogo('#6f6fc9', '#fff', '#5857b0', '#6f6fc9'));
  const ic = document.createElement('div'); ic.innerHTML = ICON('#6f6fc9', '#fff').replace('150px;height:150px', '400px;height:400px'); add('icone-insula', ic);

  // tiles
  for (const [n, sel] of [['tile-insula', '#tInsula'], ['tile-claude', '#tClaude'], ['tile-codex', '#tCodex']]) {
    const t = clone(sel); t.style.paddingBottom = '0'; add(n, t);
  }
  // tile figma (o do filme é criado no JS; refaz igual)
  const fig = document.querySelector('#front3d .tile').cloneNode(true); add('tile-figma', fig);

  // calendário em código
  const cal = Array.from(document.querySelectorAll('#front3d .obj')).find(o => o.innerHTML.includes('>7<'));
  if (cal) add('calendario-7', cal.cloneNode(true));
  // selo "proibido" dos plugins
  const ban = Array.from(document.querySelectorAll('#front3d .obj')).find(o => o.innerHTML.includes('circle cx="20"'));
  if (ban) add('selo-proibido', ban.cloneNode(true));

  // cards e botões
  const chat = clone('#chat'); chat.querySelector('#chatTx').textContent = 'Consegue fazer uma nova versão? 😅'; chat.querySelector('#chatDots').style.display = 'none'; add('card-chat-cliente', chat);
  const pr = clone('#prompt'); pr.querySelector('#promptTx').textContent = 'Crie uma landing page para minha mentoria com formulário de inscrição'; pr.querySelector('#caretP').style.display = 'none'; add('card-prompt-ia', pr);
  add('chip-pagina-pronta', clone('#pronto'));
  add('botao-saiba-mais', clone('#cta'));
  add('botao-garantir-vaga', clone('#dragBtn'));
  add('card-imagem', clone('#dragImg'));
  const xy = clone('#xy'); xy.textContent = 'X 482 · Y 1210'; add('chip-xy', xy);
  add('janela-figma', clone('#figWin'));
  add('botao-importar-figma', clone('#impBtn'));
  add('chip-importado', clone('#impOk'));
  const dev = clone('#devBar'); dev.querySelectorAll('.d').forEach((d, i) => { d.className = 'd' + (i === 0 ? ' on' : ''); }); add('barra-dispositivos', dev);
  return list;
});

// a barra de dispositivos precisa dos ícones desenhados
await page.evaluate(() => {
  const DEV = [
    c => `<svg width="64" height="54" viewBox="0 0 32 27"><rect x="2" y="2" width="28" height="18" rx="2.5" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M11 25h10M16 20v5" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/></svg>`,
    c => `<svg width="46" height="58" viewBox="0 0 23 29"><rect x="2" y="2" width="19" height="25" rx="3" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="11.5" cy="23" r="1.4" fill="${c}"/></svg>`,
    c => `<svg width="32" height="56" viewBox="0 0 16 28"><rect x="2" y="2" width="12" height="24" rx="3" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M6.5 5h3" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  ];
  const bar = document.querySelector('[data-exp="barra-dispositivos"] #devBar');
  bar.querySelectorAll('.d').forEach((d, i) => { d.innerHTML = DEV[i](i === 0 ? '#fff' : '#1f1e1d'); });
});

for (const name of items) {
  const el = await page.$(`[data-exp="${name}"]`);
  await el.screenshot({ path: join(out, `${name}.png`), omitBackground: true });
  console.log('ok', name);
}
await browser.close();
