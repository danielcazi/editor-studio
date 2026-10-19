#!/usr/bin/env node
// Fonte única de números de um job. O editor/IA mantém videos/<id>/dados.json e todos os módulos leem dele.
//   { "connect_rate": { "valor": 61.2, "texto": "61,2%", "ilustrativo": true, "fonte": "briefing" }, ... }
// Uso:
//   node editor-studio/tools/dados.mjs <id> init               cria dados.json vazio (se não existir)
//   node editor-studio/tools/dados.mjs <id> build               gera filme/dados.js (window.DADOS) para o filme/módulos usarem
//   node editor-studio/tools/dados.mjs <id> check               lista os números ilustrativos e procura valores soltos no filme
// Nos módulos: `const D = window.DADOS || {}; D.connect_rate?.texto ?? PR.fallback`.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [id, cmd = 'check'] = process.argv.slice(2);
if (!id) { console.error('uso: dados.mjs <job-id> init|build|check'); process.exit(2); }
const dir = join(REPO, 'videos', id);
const file = join(dir, 'dados.json');
const filme = join(dir, 'filme');

if (cmd === 'init') {
  if (existsSync(file)) { console.log('dados.json já existe'); process.exit(0); }
  writeFileSync(file, JSON.stringify({ exemplo: { valor: 0, texto: '0%', ilustrativo: true, fonte: 'trocar pelo número real' } }, null, 2));
  console.log('criado ' + file); process.exit(0);
}
if (!existsSync(file)) { console.error('sem dados.json: rode "init" primeiro'); process.exit(1); }
const dados = JSON.parse(readFileSync(file, 'utf8'));

if (cmd === 'build') {
  for (const [k, d] of Object.entries(dados)) if (d.texto == null) d.texto = String(d.valor).replace('.', ',');
  writeFileSync(join(filme, 'dados.js'), `/* gerado por editor-studio/tools/dados.mjs a partir de videos/${id}/dados.json — não edite */\nwindow.DADOS = ${JSON.stringify(dados, null, 2)};\n`);
  console.log(`filme/dados.js com ${Object.keys(dados).length} dado(s). Inclua <script src="dados.js"></script> antes do film.js.`);
  process.exit(0);
}

// check: ilustrativos + textos do dado que aparecem em versões diferentes no código do filme
const ilus = Object.entries(dados).filter(([, d]) => d.ilustrativo);
console.log(`${Object.keys(dados).length} dado(s), ${ilus.length} ilustrativo(s):`);
for (const [k, d] of ilus) console.log(`  ~ ${k} = ${d.texto ?? d.valor} (ilustrativo)`);
let ruim = 0;
const arquivos = [];
const walk = p => { for (const f of readdirSync(p)) { if (['node_modules', 'assets', 'out', 'ae'].includes(f)) continue; const q = join(p, f); statSync(q).isDirectory() ? walk(q) : /\.(js|html|css)$/.test(f) && arquivos.push(q); } };
if (existsSync(filme)) walk(filme);
for (const [k, d] of Object.entries(dados)) {
  if (typeof d.valor !== 'number' || !d.texto) continue;
  // procura o mesmo número com casas decimais diferentes (ex.: 60,7 quando o dado é 61,2)
  const base = Math.floor(d.valor);
  const re = new RegExp(`\\b${base}[,.]\\d\\b`, 'g');
  for (const f of arquivos) {
    const src = readFileSync(f, 'utf8');
    const achados = [...new Set(src.match(re) || [])].filter(x => x.replace('.', ',') !== d.texto.replace('%', '').replace('.', ','));
    if (achados.length) { ruim++; console.log(`  ! ${k}: ${f.replace(REPO + '/', '')} tem ${achados.join(', ')} mas o dado é ${d.texto}`); }
  }
}
if (!ruim) console.log('sem valores divergentes nos arquivos do filme');
process.exit(ruim ? 1 : 0);
