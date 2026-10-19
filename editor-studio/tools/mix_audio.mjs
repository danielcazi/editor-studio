#!/usr/bin/env node
// Mixagem: voz original + trilha (opcional, com sidechain: abaixa quando a voz fala) + SFX, normalizada em -14 LUFS.
// Uso: node editor-studio/tools/mix_audio.mjs <job-id> [--trilha arquivo] [--sfx arquivo.wav] [--out arquivo.m4a]
//        [--lufs -14] [--trilha-db -18] [--video arquivo]
// Padrões: video = briefing.video.path, trilha = briefing.trilha.path, saída = videos/<id>/out/mix.m4a.
// Dois passes de loudnorm; imprime o LUFS e o pico finais.
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const id = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!id) { console.error('uso: mix_audio.mjs <job-id> [--trilha f] [--sfx f] [--out f] [--lufs -14] [--trilha-db -18]'); process.exit(2); }
const job = JSON.parse(readFileSync(join(REPO, 'videos', id, 'job.json'), 'utf8'));
const abs = p => (p ? resolve(REPO, p) : null);
const video = abs(opt('video', job.briefing?.video?.path));
const trilha = abs(opt('trilha', job.briefing?.trilha?.path));
const sfx = abs(opt('sfx', null));
const out = abs(opt('out', `videos/${id}/out/mix.m4a`));
const lufs = +opt('lufs', -14), tdb = +opt('trilha-db', -18);
for (const [n, f] of [['vídeo', video], ['trilha', trilha], ['sfx', sfx]]) if (f && !existsSync(f)) { console.error(`${n} não encontrado: ${f}`); process.exit(1); }
mkdirSync(dirname(out), { recursive: true });

// grafo: [0]=voz, [1]=trilha, [2]=sfx. A trilha vai abaixo da voz e é comprimida pela voz (sidechain).
const ins = ['-i', video, ...(trilha ? ['-i', trilha] : []), ...(sfx ? ['-i', sfx] : [])];
const iT = trilha ? 1 : -1, iS = sfx ? (trilha ? 2 : 1) : -1;
const partes = [trilha ? '[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[voz][vozsc]' : '[0:a]aformat=sample_rates=48000:channel_layouts=stereo[voz]'];
const mix = ['[voz]'];
if (trilha) {
  partes.push(`[${iT}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${tdb}dB,aloop=loop=-1:size=2e9[tr0]`,
    '[tr0][vozsc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[tr]');
  mix.push('[tr]');
}
if (sfx) { partes.push(`[${iS}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=-6dB[sf]`); mix.push('[sf]'); }
const base = `${partes.join(';')};${mix.join('')}amix=inputs=${mix.length}:duration=first:normalize=0`;
const run = (filtro, extra) => spawnSync('ffmpeg', ['-v', 'info', '-y', ...ins, '-filter_complex', `${base},${filtro}[a]`, '-map', '[a]', '-vn', ...extra], { encoding: 'utf8' });

// passe 1: mede
const m = run(`loudnorm=I=${lufs}:TP=-1:LRA=11:print_format=json`, ['-f', 'null', '-']);
const js = (m.stderr.match(/\{[\s\S]*?"target_offset"[\s\S]*?\}/) || [])[0];
if (!js) { console.error('falha ao medir:\n' + m.stderr.slice(-800)); process.exit(1); }
const med = JSON.parse(js);
// passe 2: aplica com os valores medidos
const f = run(`loudnorm=I=${lufs}:TP=-1:LRA=11:measured_I=${med.input_i}:measured_TP=${med.input_tp}:measured_LRA=${med.input_lra}:measured_thresh=${med.input_thresh}:offset=${med.target_offset}:linear=true`,
  ['-c:a', 'aac', '-b:a', '192k', out]);
if (f.status !== 0) { console.error(f.stderr.slice(-800)); process.exit(1); }
const chk = spawnSync('ffmpeg', ['-v', 'info', '-i', out, '-af', 'loudnorm=I=-14:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
const fin = JSON.parse((chk.stderr.match(/\{[\s\S]*?"target_offset"[\s\S]*?\}/) || ['{}'])[0]);
console.log(`ok · ${out.replace(REPO + '/', '')} · ${fin.input_i ?? '?'} LUFS · pico ${fin.input_tp ?? '?'} dBTP · ${trilha ? 'com trilha (sidechain)' : 'sem trilha'}${sfx ? ' + sfx' : ''}`);
