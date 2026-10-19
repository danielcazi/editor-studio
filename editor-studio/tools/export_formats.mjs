#!/usr/bin/env node
// Exporta o vídeo final em outros formatos a partir do 9:16 (1080x1920).
//   node editor-studio/tools/export_formats.mjs <id> [--formatos 4x5,1x1,16x9] [--modo crop|blur] [--y 140] [--in arquivo]
// 4x5 = 1080x1350 (feed), 1x1 = 1080x1080, 16x9 = 1920x1080.
// modo crop (padrão): recorta uma janela do quadro vertical; --y é o topo da janela (padrão: centrada um pouco acima).
// modo blur: o vídeo inteiro cabe no centro, com o próprio vídeo desfocado de fundo (nada é cortado; fica menor).
// Aviso: o recorte pode cortar texto fora da janela. Cada formato imprime a faixa visível para conferir contra a área segura.
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const id = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!id) { console.error('uso: export_formats.mjs <job-id> [--formatos 4x5,1x1] [--modo crop|blur] [--y N]'); process.exit(2); }
const job = JSON.parse(readFileSync(join(REPO, 'videos', id, 'job.json'), 'utf8'));
const entrada = resolve(REPO, opt('in', job.video?.file || `videos/${id}/out/final.mp4`));
if (!existsSync(entrada)) { console.error('vídeo final não encontrado: ' + entrada); process.exit(1); }
const FORMATOS = { '4x5': [1080, 1350], '1x1': [1080, 1080], '16x9': [1920, 1080] };
const modo = opt('modo', 'crop');
for (const f of opt('formatos', '4x5,1x1').split(',')) {
  const dim = FORMATOS[f]; if (!dim) { console.error('formato desconhecido: ' + f); continue; }
  const [w, h] = dim;
  let vf, faixa = '';
  if (modo === 'blur') {
    vf = `[0:v]split[a][b];[a]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=40:8[bg];[b]scale=-2:${h}[fg];[bg][fg]overlay=(W-w)/2:0`;
  } else if (f === '16x9') { // 16:9 vindo de vertical: só com fundo desfocado
    vf = `[0:v]split[a][b];[a]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=40:8[bg];[b]scale=-2:${h}[fg];[bg][fg]overlay=(W-w)/2:0`;
  } else {
    const y = Math.max(0, Math.min(1920 - h, +opt('y', Math.round((1920 - h) / 2 - 60))));
    vf = `[0:v]crop=1080:${h}:0:${y}`; faixa = ` · mostra y ${y}–${y + h} do quadro vertical`;
  }
  const out = join(REPO, 'videos', id, 'out', `final-${f}.mp4`);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', entrada, '-filter_complex', vf, '-map', '0:a?', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out], { encoding: 'utf8' });
  console.log(r.status === 0 ? `ok ${out.replace(REPO + '/', '')} (${w}x${h})${faixa}` : `falhou ${f}: ${r.stderr.slice(-300)}`);
}
