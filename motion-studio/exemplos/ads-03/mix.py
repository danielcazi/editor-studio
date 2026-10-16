"""Sintetiza os SFX em código e mixa com a voz original (out/sfx.json vem do render). Job demo-achilles.
uso: python mix.py <video_original> <saida.wav> [pasta-stems]  (stems: voz.wav e sfx.wav separados, para o After)
"""
import json, os, subprocess, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
rng = np.random.default_rng(7)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s; y[i] = s
    return y


def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)


def sweep_noise(n, f0, f1):
    """ruído com filtro passa-banda que varre de f0 a f1 (aprox. por blocos)"""
    out = np.zeros(n); B = 2048
    for s in range(0, n, B):
        u = s / n; fc = f0 * (f1 / f0) ** u
        seg = bandnoise(B, fc * 0.6, fc * 1.6)[: min(B, n - s)]
        out[s:s + len(seg)] = seg
    return out


def synth(kind):
    if kind == 'boom':
        n = int(SR * 1.6); t = np.arange(n) / SR
        f = 38 + 50 * np.exp(-t * 6)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .005, .55)
        y += 0.25 * bandnoise(n, 40, 400) * env(n, .002, .12)
    elif kind == 'shimmer':
        n = int(SR * 1.3); t = np.arange(n) / SR
        y = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([1318, 1975, 2637, 3520])) / 4
        y = y * env(n, .25, .5) * 0.5 + 0.2 * bandnoise(n, 5000, 12000) * env(n, .3, .4)
    elif kind == 'whoosh':
        n = int(SR * .45)
        y = sweep_noise(n, 300, 3500) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    elif kind == 'paper':
        n = int(SR * .35)
        y = bandnoise(n, 1500, 9000) * env(n, .003, .07) * (0.6 + 0.4 * rng.random(n))
    elif kind == 'pencil':
        n = int(SR * .32); t = np.arange(n) / SR
        grain = (rng.random(n) < 0.18).astype(float) * rng.standard_normal(n)
        y = lowpass(grain, 6000) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * np.linspace(0, 1, n))
        y += 0.3 * bandnoise(n, 2500, 7000) * np.sin(np.pi * np.linspace(0, 1, n))
    elif kind == 'thud':
        n = int(SR * .5); t = np.arange(n) / SR
        y = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 30)) * t) * env(n, .002, .12)
    elif kind == 'riser':
        n = int(SR * 2.2); t = np.arange(n) / SR
        f = 80 * (6 ** (t / t[-1]))
        y = 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * sweep_noise(n, 200, 5000)
        y *= (t / t[-1]) ** 2
    elif kind == 'impact':
        n = int(SR * 2.4); t = np.arange(n) / SR
        f = 32 + 70 * np.exp(-t * 8)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .8)
        y += 0.5 * bandnoise(n, 60, 3000) * env(n, .001, .18)
        y += 0.15 * bandnoise(n, 3000, 10000) * env(n, .001, .5)
    elif kind == 'pop':
        n = int(SR * .12); t = np.arange(n) / SR
        y = np.sin(2 * np.pi * (520 + 900 * np.exp(-t * 60)) * t) * env(n, .001, .035)
    elif kind == 'tick':
        n = int(SR * .06); y = bandnoise(n, 2500, 8000) * env(n, .0005, .008)
        y += 0.5 * np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env(n, .0005, .01)
    elif kind == 'click':
        n = int(SR * .08); t = np.arange(n) / SR
        y = bandnoise(n, 1200, 6000) * env(n, .0005, .006) + 0.6 * np.sin(2 * np.pi * 900 * t) * env(n, .0005, .012)
    elif kind == 'key':
        n = int(SR * .05); y = bandnoise(n, 1800, 7000) * env(n, .0005, .007) * (0.7 + 0.3 * rng.random())
    elif kind == 'strike':
        n = int(SR * .3); t = np.arange(n) / SR
        y = sweep_noise(n, 1500, 5000) * np.sin(np.pi * np.linspace(0, 1, n)) ** .5 * (0.7 + 0.3 * np.sin(2 * np.pi * 40 * t))
    elif kind == 'ding':
        n = int(SR * 1.2); t = np.arange(n) / SR
        y = (np.sin(2 * np.pi * 1568 * t) + .5 * np.sin(2 * np.pi * 2349 * t) + .25 * np.sin(2 * np.pi * 3136 * t)) * env(n, .002, .35)
    return y / (np.abs(y).max() + 1e-9)


def write(path, y):
    y = np.clip(y, -1, 1); s = (y * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(s.tobytes())


src, out = sys.argv[1], sys.argv[2]
sfx = [dict(s) for s in json.load(open(os.path.join(HERE, 'out', 'sfx.json')))]
DUR = 46.61
bus = np.zeros(int(SR * (DUR + 3)))
cache = {}
GAIN = {'boom': .55, 'shimmer': .12, 'whoosh': .3, 'paper': .18, 'pencil': .16, 'thud': .35, 'riser': .2, 'impact': .7,
        'pop': .14, 'tick': .12, 'click': .22, 'key': .08, 'strike': .2, 'ding': .1}
for s in sfx:
    k = s['type']
    if k not in cache: cache[k] = synth(k)
    y = cache[k] * GAIN[k] * s.get('g', 1); i = int(s['t'] * SR)
    bus[i:i + len(y)] += y
bus = bus[: int(SR * DUR)]
fx = os.path.join(HERE, 'out', 'sfx_bus.wav'); write(fx, bus * 0.9)

f = ('[0:a]aresample=48000,pan=mono|c0=c0,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120[v];'
     '[1:a]aresample=48000[fx];[v][fx]amix=inputs=2:normalize=0:duration=first,'
     f'atrim=0:{DUR},afade=t=out:st={DUR - 0.25}:d=0.25,pan=stereo|c0=c0|c1=c0,loudnorm=I=-14:TP=-1.0:LRA=11[o]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-i', fx, '-filter_complex', f, '-map', '[o]', '-ar', '48000', out], check=True)
if len(sys.argv) > 3:
    st = sys.argv[3]; os.makedirs(st, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-t', f'{DUR}', '-vn', '-ac', '2', '-ar', '48000', os.path.join(st, 'voz.wav')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', fx, '-ac', '2', os.path.join(st, 'sfx.wav')], check=True)
print('ok', out)
