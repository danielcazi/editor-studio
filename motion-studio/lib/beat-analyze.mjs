// Mede a grade de batidas de uma faixa (andamento, fase, compasso, drop).
// Porte para JS de examples/21_full_circle/src/beat-grid.ts do framefields (Apache-2.0,
// https://github.com/gatewai-dev/framefields). Mesmo método: envelope de energia (banda cheia e banda do bumbo, 100 Hz),
// fluxo de onset em log, andamento por autocorrelação com prior log-normal, fase por filtro pente com refino de ±0,6 %,
// drop = primeiro compasso alto depois de um compasso baixo; o drop define o tempo 1 do compasso.
// Atenção: o downbeat/drop só é confiável em música. Em voz ou trilha sem queda, use `downbeatSec` com cautela.
const ENVELOPE_HZ = 100, KICK_HZ = 150;

/** samples: Float32Array mono. Devolve { bpm, beatSec, barSec, downbeatSec, durationSec, dropBar, bars }. */
export function analyzeBeatGrid(samples, sampleRate, o = {}) {
  const beatsPerBar = o.beatsPerBar ?? 4;
  const hop = Math.round(sampleRate / ENVELOPE_HZ);
  const rate = sampleRate / hop;
  const { full, kick } = envelopes(samples, sampleRate, hop);
  const flux = onset(full), kickFlux = onset(kick);
  const strength = flux.map((v, i) => v + kickFlux[i]);
  const coarse = tempo(strength, rate, o.bpmHint ?? 120, o.minBpm ?? 70, o.maxBpm ?? 180);
  const { period, phase } = refine(strength, coarse);
  const durationSec = samples.length / sampleRate;
  const beatSec = period / rate, barSec = beatSec * beatsPerBar;
  const beats = loudness(full, rate, phase / rate, beatSec, durationSec);
  const dropBeat = findDrop(beats, beatsPerBar);
  const downbeatSec = (phase / rate + (dropBeat % beatsPerBar) * beatSec) % barSec;
  return {
    bpm: 60 / beatSec, beatSec, barSec, downbeatSec, durationSec,
    dropBar: Math.round((beats[dropBeat].startSec - downbeatSec) / barSec),
    bars: loudness(full, rate, downbeatSec, barSec, durationSec),
  };
}

function envelopes(samples, sampleRate, hop) {
  const n = Math.floor(samples.length / hop);
  const full = new Float32Array(n), kick = new Float32Array(n);
  const a = 1 - Math.exp((-2 * Math.PI * KICK_HZ) / sampleRate);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    let e = 0, k = 0;
    for (let j = i * hop; j < (i + 1) * hop; j++) { const x = samples[j]; lp += a * (x - lp); e += x * x; k += lp * lp; }
    full[i] = e / hop; kick[i] = k / hop;
  }
  return { full, kick };
}

function onset(energy) {
  const n = energy.length, flux = new Float32Array(n);
  for (let i = 1; i < n; i++) flux[i] = Math.max(0, Math.log10(energy[i] + 1e-10) - Math.log10(energy[i - 1] + 1e-10));
  const half = Math.round(ENVELOPE_HZ / 4), out = new Float32Array(n);
  let sum = 0;
  for (let i = 0; i < Math.min(n, half); i++) sum += flux[i];
  for (let i = 0; i < n; i++) {
    if (i + half < n) sum += flux[i + half];
    if (i - half - 1 >= 0) sum -= flux[i - half - 1];
    const count = Math.min(n - 1, i + half) - Math.max(0, i - half) + 1;
    out[i] = Math.max(0, flux[i] - sum / count);
  }
  return out;
}

function tempo(env, rate, hint, minBpm, maxBpm) {
  const minLag = Math.floor((60 * rate) / maxBpm), maxLag = Math.ceil((60 * rate) / minBpm);
  const score = new Float64Array(maxLag + 2);
  let best = minLag;
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let r = 0;
    for (let i = lag; i < env.length; i++) r += env[i] * env[i - lag];
    const bpm = (60 * rate) / lag;
    const prior = Math.exp(-0.5 * (Math.log2(bpm / hint) / 0.6) ** 2); // erro de oitava (60/120/240) custa igual; a dica desempata
    score[lag] = (r / (env.length - lag)) * prior;
    if (lag <= maxLag && score[lag] > score[best]) best = lag;
  }
  return best + parabolicOffset(score[best - 1] ?? 0, score[best], score[best + 1]);
}
const parabolicOffset = (a, b, c) => { const d = a - 2 * b + c; return d === 0 ? 0 : Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / d)); };

function refine(env, coarse) {
  let best = { period: coarse, phase: 0, score: -1 };
  for (let p = coarse * 0.994; p <= coarse * 1.006; p += 0.01) {
    const phase = bestPhase(env, p), score = combScore(env, p, phase);
    if (score > best.score) best = { period: p, phase, score };
  }
  return best;
}
const sampleAt = (env, t) => { const i = Math.floor(t), f = t - i; return (env[i] ?? 0) * (1 - f) + (env[i + 1] ?? 0) * f; };
function combScore(env, stride, offset) { let s = 0; for (let t = offset; t < env.length; t += stride) s += sampleAt(env, t); return s; }
function bestPhase(env, stride) {
  let best = 0, bestScore = -1;
  for (let p = 0; p < stride; p += 0.25) { const s = combScore(env, stride, p); if (s > bestScore) { bestScore = s; best = p; } }
  return best;
}

function loudness(full, rate, startSec, stepSec, durationSec) {
  const spans = [];
  for (let index = 0; startSec + index * stepSec < durationSec; index++) {
    const from = startSec + index * stepSec;
    const a = Math.floor(from * rate), b = Math.min(full.length, Math.floor((from + stepSec) * rate));
    let e = 0;
    for (let i = a; i < b; i++) e += full[i];
    spans.push({ index, startSec: from, rmsDb: 10 * Math.log10(e / Math.max(1, b - a) + 1e-10) });
  }
  return spans;
}
function findDrop(spans, lookback) {
  const sorted = spans.map(s => s.rmsDb).sort((x, y) => x - y);
  const loud = sorted[Math.floor(sorted.length * 0.9)] - 4;
  for (let i = lookback; i < spans.length; i++) {
    if (spans[i].rmsDb < loud) continue;
    if (spans.slice(i - lookback, i).every(s => s.rmsDb < loud)) return i;
  }
  return lookback;
}
