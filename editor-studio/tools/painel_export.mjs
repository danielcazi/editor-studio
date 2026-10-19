#!/usr/bin/env node
// Prepara o job para o painel publicado (editor decide no painel e diz "segue").
//   node editor-studio/tools/painel_export.mjs <id>        grava videos/<id>/out/painel-<id>.json e lista as imagens a subir
// O arquivo tem as mesmas chaves do job.json, sem o que é só local (sessionId, aiError). Imagens ficam como caminho relativo
// e vêm listadas em "_imagens": suba cada uma com Artifact (asset: true) e troque o caminho pelo id do asset antes do ArtifactData update.
// O Claude usa isto no passo "segue" (WORKFLOW.md) para o painel receber refOptions, stills, storyboard e rodadas sem digitação manual.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const id = process.argv[2];
if (!id) { console.error('uso: painel_export.mjs <job-id>'); process.exit(2); }
const job = JSON.parse(readFileSync(join(REPO, 'videos', id, 'job.json'), 'utf8'));
for (const k of ['sessionId', 'aiError']) delete job[k];
const imgs = new Set();
const varre = (v) => {
  if (typeof v === 'string') { if (/^videos\/.+\.(jpe?g|png|webp|gif)$/i.test(v) && existsSync(join(REPO, v))) imgs.add(v); }
  else if (Array.isArray(v)) v.forEach(varre);
  else if (v && typeof v === 'object') Object.values(v).forEach(varre);
};
varre(job);
const lista = [...imgs].map((p) => ({ path: p, kb: Math.round(statSync(join(REPO, p)).size / 1024) }));
const out = join(REPO, 'videos', id, 'out', `painel-${id}.json`);
writeFileSync(out, JSON.stringify({ ...job, _imagens: lista.map((i) => i.path) }, null, 2));
console.log(`${out.replace(REPO + '/', '')} · ${lista.length} imagem(ns) para subir (${lista.reduce((a, i) => a + i.kb, 0)} KB)`);
for (const i of lista) console.log(`  ${i.path} (${i.kb} KB)`);
