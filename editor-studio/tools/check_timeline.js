#!/usr/bin/env node
// Confere o ritmo e a permanência da timeline de um job.
//   1. entradas: nenhum intervalo entre duas entradas pode passar de MAX_GAP (briefing: algo novo a cada 1,5 s).
//   2. permanência: cada peça fica t → t + hold. Fora do slot "palavra" (palavra-chave grande), hold ≥ MIN_HOLD (3 s).
//      A palavra-chave pode ser trocada pela próxima palavra-chave, mas fica pelo menos 1,2 s.
//   3. slots: uma peça nova só toma o slot ("palavra" | "painel" | "objeto" | outro nome) de outra que já cumpriu o mínimo.
//   slot "transicao" (cortina, flash) conta como entrada e não precisa ficar 3 s.
//   "dentro": "r12" marca um acontecimento novo DENTRO de uma peça viva (linha que acende, chip, clique): conta como
//   entrada, não ocupa slot e precisa cair enquanto a peça r12 está na tela.
//   Linha sem slot conta como "painel"; sem hold, dura até a próxima linha (modelo antigo, que reprova no item 2).
// Uso: node editor-studio/tools/check_timeline.js <job-id> [--max 1.5] [--hold 3] [--dur 46.6] [--json]
//   --max   intervalo máximo em segundos (padrão: briefing.maxGap do job, ou 1,5)
//   --hold  permanência mínima fora do topo (padrão: briefing.minHold do job, ou 3)
//   --dur   duração do vídeo; sem ela, tenta ler com ffprobe e, se não der, ignora o trecho final
//   --json  saída em JSON (usada pelo servidor)
// Sai com código 0 se está tudo dentro e 1 se houver lacuna, peça curta ou conflito de área. Linhas com status "passa"/"pass" são ignoradas.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const jobId = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!jobId) { console.error('uso: check_timeline.js <job-id> [--max 1.5] [--hold 3] [--dur s] [--json]'); process.exit(2); }

const job = JSON.parse(fs.readFileSync(path.join(REPO, 'videos', jobId, 'job.json'), 'utf8'));
const max = parseFloat(opt('max', (job.briefing && job.briefing.maxGap) || '1.5'));
const minHold = parseFloat(opt('hold', (job.briefing && job.briefing.minHold) || '3'));
const MIN_PALAVRA = 1.2;
const passou = (r) => /^pass/.test(String(r.status || ''));

let dur = parseFloat(opt('dur', 'NaN'));
const base = job.briefing && job.briefing.video && job.briefing.video.path;
if (!Number.isFinite(dur) && base) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path.join(REPO, base)], { encoding: 'utf8' });
  if (r.status === 0) dur = parseFloat(r.stdout);
}

const rows = (job.timeline || [])
  .filter((r) => !passou(r) && Number.isFinite(Number(r.t)))
  .map((r) => ({ id: r.id, t: Number(r.t), slot: r.slot || 'painel', hold: Number.isFinite(Number(r.hold)) ? Number(r.hold) : null, dentro: r.dentro || null }))
  .sort((a, b) => a.t - b.t);

const gaps = [];
let prev = { id: 'início', t: 0 };
for (const r of rows) {
  if (r.t - prev.t > max + 1e-6) gaps.push({ de: prev.id, ate: r.id, seg: +(r.t - prev.t).toFixed(1), ini: +prev.t.toFixed(1) });
  prev = r;
}
if (Number.isFinite(dur) && dur - prev.t > max + 1e-6) gaps.push({ de: prev.id, ate: 'fim', seg: +(dur - prev.t).toFixed(1), ini: +prev.t.toFixed(1) });

// frases repetidas: a mesma fala (ou texto na tela) em dois momentos, mesmo com pontuação/caixa diferentes
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const palavras = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2));
const dups = [];
const todas = (job.timeline || []).filter((r) => !passou(r));
for (let i = 0; i < todas.length; i++) for (let j = i + 1; j < todas.length; j++) {
  if (Math.abs(Number(todas[i].t) - Number(todas[j].t)) < 2.5) continue; // peças do mesmo momento dividem a fala de propósito
  const a = norm(todas[i].line), b = norm(todas[j].line);
  if (!a || !b) continue;
  const A = palavras(todas[i].line), B = palavras(todas[j].line);
  const comum = [...A].filter((w) => B.has(w)).length;
  const sim = A.size && B.size ? comum / Math.min(A.size, B.size) : 0;
  const trecho = a.length >= 12 && b.length >= 12 && (a.includes(b) || b.includes(a));
  if (a === b || trecho || (A.size >= 4 && B.size >= 4 && sim >= 0.8)) dups.push({ a: todas[i].id, b: todas[j].id, linhaA: todas[i].line, linhaB: todas[j].line });
}
// permanência e áreas
const fim = Number.isFinite(dur) ? dur : Infinity;
const curtas = [], conflitos = [], foraDaPeca = [];
const pecasRows = rows.filter((r) => !r.dentro);
pecasRows.forEach((r, i) => {
  const rows = pecasRows; // só peças ocupam slot e tempo de tela
  const prox = rows[i + 1];
  // sem hold: palavra-chave vai até a próxima palavra-chave; o resto, até a próxima linha (modelo antigo)
  const proxMesmo = rows.slice(i + 1).find((x) => x.slot === r.slot);
  const decl = r.hold ?? (r.slot === 'palavra' ? (proxMesmo ? proxMesmo.t : fim) - r.t : (prox ? prox.t : fim) - r.t);
  let efetivo = Math.min(decl, fim - r.t);
  // a próxima peça do mesmo slot corta esta
  const tomador = rows.slice(i + 1).find((x) => x.slot === r.slot && x.t < r.t + decl - 1e-6);
  if (tomador) efetivo = Math.min(efetivo, tomador.t - r.t);
  const minimo = r.slot === 'palavra' ? MIN_PALAVRA : r.slot === 'transicao' ? 0 : minHold;
  const fimDoVideo = fim - r.t < minimo; // perto do fim não dá para cumprir
  if (efetivo < minimo - 1e-6 && !fimDoVideo) {
    if (tomador && tomador.t - r.t < minimo) conflitos.push({ id: r.id, por: tomador.id, slot: r.slot, seg: +(tomador.t - r.t).toFixed(1), min: minimo });
    else curtas.push({ id: r.id, slot: r.slot, seg: +efetivo.toFixed(1), min: minimo, semHold: r.hold == null });
  }
  r.fim = +(r.t + efetivo).toFixed(2);
});

for (const r of rows.filter((x) => x.dentro)) {
  const pai = pecasRows.find((x) => x.id === r.dentro);
  if (!pai || r.t < pai.t - 1e-6 || r.t >= pai.fim - 1e-6) foraDaPeca.push({ id: r.id, dentro: r.dentro, t: r.t, peca: pai ? [pai.t, pai.fim] : null });
}
const out = { ok: gaps.length === 0 && curtas.length === 0 && conflitos.length === 0 && foraDaPeca.length === 0, foraDaPeca, max, minHold, linhas: rows.length,
  duracao: Number.isFinite(dur) ? +dur.toFixed(1) : null, lacunas: gaps, curtas, conflitos, repetidas: dups,
  pecas: pecasRows.map((r) => ({ id: r.id, slot: r.slot, a: r.t, b: r.fim })) };
if (args.includes('--json')) console.log(JSON.stringify(out));
else if (out.ok) console.log(`✓ ritmo ok: ${rows.length} momentos, nenhuma entrada a mais de ${max} s da anterior e toda peça fora da palavra-chave com ≥ ${minHold} s`);
else {
  if (gaps.length) { console.log(`✗ ${gaps.length} intervalo(s) sem entrada acima de ${max} s (${rows.length} momentos na timeline):`); for (const g of gaps) console.log(`  ${g.de} → ${g.ate}: ${g.seg} s (a partir de ${g.ini} s)`); }
  if (curtas.length) { console.log(`✗ ${curtas.length} peça(s) curtas demais:`); for (const c of curtas) console.log(`  ${c.id} (${c.slot}): ${c.seg} s na tela, mínimo ${c.min} s${c.semHold ? ' · sem "hold": defina quanto tempo fica' : ''}`); }
  if (foraDaPeca.length) { console.log(`✗ ${foraDaPeca.length} acontecimento(s) "dentro" fora da peça:`); for (const c of foraDaPeca) console.log(`  ${c.id} em ${c.t} s, mas ${c.dentro} ${c.peca ? 'está na tela de ' + c.peca[0] + ' a ' + c.peca[1] + ' s' : 'não existe'}`); }
  if (conflitos.length) { console.log(`✗ ${conflitos.length} conflito(s) de slot:`); for (const c of conflitos) console.log(`  ${c.por} entra no slot "${c.slot}" ${c.seg} s depois de ${c.id} (mínimo ${c.min} s): use outro slot ou atrase`); }
}
if (!args.includes('--json') && dups.length) {
  console.log(`⚠ ${dups.length} frase(s) repetida(s) na timeline (decisão do editor, não bloqueia):`);
  for (const d of dups) console.log(`  ${d.a} e ${d.b}: "${d.linhaA}"`);
}
process.exit(out.ok ? 0 : 1);
