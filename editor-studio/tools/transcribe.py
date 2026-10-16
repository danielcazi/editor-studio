#!/usr/bin/env python3
"""Uso: tools/.venv/bin/python tools/transcribe.py <audio.wav> <saida.json> [modelo]
Transcreve com faster-whisper (pt, timestamps por palavra)."""
import json, sys
from faster_whisper import WhisperModel
audio, out = sys.argv[1], sys.argv[2]
model = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else 'medium', device='cpu', compute_type='int8')
segs, info = model.transcribe(audio, language='pt', word_timestamps=True, vad_filter=True,
    initial_prompt='Ínsula Build, site, WhatsApp, CRM, GA4, Google, dentista, psicólogo, Pinheiros.')
res = [{'start': s.start, 'end': s.end, 'text': s.text.strip(),
        'words': [{'w': w.word.strip(), 's': w.start, 'e': w.end} for w in s.words]} for s in segs]
json.dump({'duration': info.duration, 'segments': res}, open(out, 'w'), ensure_ascii=False, indent=1)
print(len(res), 'segmentos', round(info.duration, 1), 's')
