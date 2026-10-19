// Margem de segurança do 9:16. Lê safezone.json (perfil de briefing.margem ou o padrão) e escala para W×H.
//   import { safeZone } from '.../motion-studio/qa/safezone.mjs';  safeZone(job, W, H) → { perfil, nome, top, bottom, left, right }
//   CLI: node motion-studio/qa/safezone.mjs [perfil]   (imprime o retângulo)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SAFEZONE = JSON.parse(readFileSync(join(HERE, 'safezone.json'), 'utf8'));

export function safeZone(job = null, W = 1080, H = 1920, perfil = null) {
  const id = perfil || job?.briefing?.margem || SAFEZONE.padrao;
  const p = SAFEZONE.perfis[id] || SAFEZONE.perfis[SAFEZONE.padrao];
  const kx = W / p.w, ky = H / p.h;
  return { perfil: SAFEZONE.perfis[id] ? id : SAFEZONE.padrao, nome: p.nome,
    top: Math.round(p.top * ky), bottom: Math.round(p.bottom * ky), left: Math.round(p.left * kx), right: Math.round(p.right * kx) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const z = safeZone(null, 1080, 1920, process.argv[2]);
  console.log(`${z.perfil} · x ${z.left}–${z.right} · y ${z.top}–${z.bottom}`);
}
