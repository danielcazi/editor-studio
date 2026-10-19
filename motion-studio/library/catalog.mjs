// node library/catalog.mjs [--write] [--only I015,I016]
// Varre library/modules/*, acha os que ainda não estão em library.json (pela pasta em source.film) e propõe uma entrada M## para cada um,
// usando o idea log (ideas.json) para nome, fala e looks. Sem --write só mostra o que faria. Com --write grava library.json e roda build.mjs.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const LIB = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const write = args.includes('--write');
const only = (args[args.indexOf('--only') + 1] || '').split(',').filter(Boolean);
const lib = JSON.parse(readFileSync(join(LIB, 'library.json'), 'utf8'));
const ideas = JSON.parse(readFileSync(join(LIB, 'ideas.json'), 'utf8')).ideas;

const catalogados = new Set(lib.modules.map(m => m.source?.film).filter(Boolean));
const maxN = Math.max(...lib.modules.map(m => +m.id.slice(1)).filter(Number.isFinite));
let n = maxN;
const novos = [];
for (const pasta of readdirSync(join(LIB, 'modules')).sort()) {
  const film = `library/modules/${pasta}`;
  const ideaId = pasta.match(/^(I\d+)/)?.[1];
  if (catalogados.has(film) || !existsSync(join(LIB, 'modules', pasta, 'film.js'))) continue;
  if (only.length && !only.includes(ideaId)) continue;
  const idea = ideas.find(i => i.id === ideaId);
  const looks = (idea?.stills || []).map(s => s.key);
  const id = 'M' + String(++n).padStart(2, '0');
  novos.push({
    id, name: idea?.title || pasta, kind: idea?.kind || 'explicação', style: 'Insula UI',
    what: idea?.what || (idea?.stills?.find(s => s.key === idea.pick) || idea?.stills?.[0])?.desc || idea?.why || '',
    vars: idea?.vars || ['params.js'],
    source: { film, fn: idea?.pick ? `LOOKS.${idea.pick}` : 'film.js' },
    formats: ['9:16'], reuse: 'parametrizado', overlay: idea?.overlay || 'render com ?nobg=1 → PNG com alfa',
    thumb: { film, w: 1080, h: 1920, t: idea?.thumbT ?? 1.5, ...(idea?.thumbQuery ? { query: idea.thumbQuery } : idea?.pick ? { query: `look=${idea.pick}&nobg=0` } : {}) },
    uses: [], idea: ideaId,
  });
  console.log(`+ ${id} ← ${film}${idea ? ` (${idea.title}, looks ${looks.join('/') || '—'})` : ' (sem ideia no ideas.json)'}`);
}
if (!novos.length) { console.log('nenhum módulo novo para catalogar'); process.exit(0); }
if (!write) { console.log(`\n${novos.length} módulo(s). Rode com --write para gravar library.json e gerar miniaturas.`); process.exit(0); }
lib.modules.push(...novos);
writeFileSync(join(LIB, 'library.json'), JSON.stringify(lib, null, 2) + '\n');
for (const m of novos) { const i = ideas.find(x => x.id === m.idea); if (i) i.builtAs = m.id; }
const full = JSON.parse(readFileSync(join(LIB, 'ideas.json'), 'utf8')); full.ideas = ideas;
writeFileSync(join(LIB, 'ideas.json'), JSON.stringify(full, null, 2) + '\n');
execFileSync('node', [join(LIB, 'build.mjs'), '--only', novos.map(m => m.id).join(',')], { stdio: 'inherit' });
