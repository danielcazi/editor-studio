#!/usr/bin/env python3
"""Recorta a pessoa de cada PNG com rembg (BiRefNet portrait).
Uso: tools/.venv/bin/python tools/cutout.py <pasta-entrada> <pasta-saida> [modelo]"""
import sys, pathlib
from rembg import new_session, remove
from PIL import Image
src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
session = new_session(sys.argv[3] if len(sys.argv) > 3 else 'birefnet-portrait')
for p in sorted(src.glob('*.png')):
    remove(Image.open(p), session=session).save(dst / p.name)
    print('ok', p.name, flush=True)
