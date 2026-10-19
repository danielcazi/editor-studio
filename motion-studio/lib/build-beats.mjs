#!/usr/bin/env node
// node motion-studio/lib/build-beats.mjs <audio> [--out beats.json] [--bpm-hint 120] [--min-bpm 70 --max-bpm 180] [--beats-per-bar 4]
// Mede a grade de batidas de um áudio (qualquer formato que o ffmpeg leia) e grava beats.json no formato do BeatGrid:
// { bpm, beats[], downbeats[], beatSec, barSec, downbeatSec, dropBar, dropSec, durationSec, bars[] }.
// `bpm` e `beats` continuam compatíveis com os beats.json antigos (score.py).
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeBeatGrid } from './beat-analyze.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const file = args[0];
if (!file || file.startsWith('--')) { console.error('uso: build-beats.mjs <audio> [--out beats.json] [--bpm-hint N]'); process.exit(2); }
const SR = 22050;
const r = spawnSync('ffmpeg', ['-v', 'error', '-i', resolve(file), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
if (r.status !== 0) { console.error('ffmpeg falhou:', r.stderr?.toString()); process.exit(1); }
const buf = r.stdout;
const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
const g = analyzeBeatGrid(samples, SR, {
  bpmHint: +opt('bpm-hint', 120), minBpm: +opt('min-bpm', 70), maxBpm: +opt('max-bpm', 180), beatsPerBar: +opt('beats-per-bar', 4),
});
const bpb = +opt('beats-per-bar', 4), r3 = x => +x.toFixed(3);
const first = g.downbeatSec - Math.floor(g.downbeatSec / g.beatSec) * g.beatSec;
const beats = [], downbeats = [];
for (let t = first; t < g.durationSec - 1e-6; t += g.beatSec) beats.push(r3(t));
for (let t = g.downbeatSec; t < g.durationSec - 1e-6; t += g.barSec) downbeats.push(r3(t));
const out = {
  bpm: +g.bpm.toFixed(2), beats, downbeats, beatsPerBar: bpb, beatSec: +g.beatSec.toFixed(5), barSec: +g.barSec.toFixed(5),
  downbeatSec: r3(g.downbeatSec), dropBar: g.dropBar, dropSec: r3(g.downbeatSec + g.dropBar * g.barSec), durationSec: r3(g.durationSec),
  bars: g.bars.map(b => ({ index: b.index, startSec: r3(b.startSec), rmsDb: +b.rmsDb.toFixed(1) })), source: 'build-beats (porte de framefields beat-grid)',
};
const dest = resolve(opt('out', 'beats.json'));
writeFileSync(dest, JSON.stringify(out));
console.log(`${out.bpm} BPM · batida ${out.beatSec}s · compasso ${out.barSec}s · downbeat ${out.downbeatSec}s · drop no compasso ${out.dropBar} (${out.dropSec}s) → ${dest}`);
