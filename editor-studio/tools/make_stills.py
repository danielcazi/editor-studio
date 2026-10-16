#!/usr/bin/env python3
"""Gera os stills (HTML -> PNG via Chrome headless) de um job e grava em job.json.
Uso: python3 tools/make_stills.py <job-id>
Os layouts abaixo são o conteúdo da tarefa 'stills' deste job de teste (Ínsula Build)."""
import json, subprocess, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
JOB_ID = sys.argv[1]
JOB = ROOT.parent / 'videos' / JOB_ID
def _find_chrome():
    import os, shutil
    for c in [os.environ.get('CHROME_PATH'),
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              '/Applications/Chromium.app/Contents/MacOS/Chromium',
              shutil.which('google-chrome'), shutil.which('chromium'), shutil.which('chromium-browser'),
              r'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe']:
        if c and os.path.exists(c): return c
    raise SystemExit('Chrome não encontrado. Instale o Google Chrome ou defina CHROME_PATH.')
CHROME = _find_chrome()
W, H = 1920, 1080

CSS = '''
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1920px;height:1080px;font-family:Inter,sans-serif;color:#1f1e1d;background:#faf9f5;position:relative;overflow:hidden}
.dots{position:absolute;inset:0;background-image:radial-gradient(#d9d6cb 2px,transparent 2px);background-size:48px 48px;opacity:.9}
.mono{font-family:'JetBrains Mono',monospace;font-weight:500;letter-spacing:.14em;text-transform:uppercase;font-size:22px;color:#7c7a73}
h1{font-weight:800;letter-spacing:-.045em;line-height:.95;font-size:150px}
h1 b{color:#5857b0}
.card{background:#fff;border:2px solid #e6e3da;border-radius:28px;box-shadow:0 60px 90px -30px rgba(31,30,29,.22)}
.chip{display:inline-block;background:#5857b0;color:#fff;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:28px;padding:12px 22px;border-radius:12px}
.abs{position:absolute}
'''

def page(body, bg=None, extra=''):
    style = f'background:{bg};' if bg else ''
    return f'<!doctype html><meta charset=utf-8><style>{CSS}{extra}</style><body style="{style}">{body}</body>'

STILLS = {}

# ---- i1 Pixel Rulers -----------------------------------------------------
STILLS['i1-A'] = page('''
<div class=dots></div>
<div class="abs mono" style="left:120px;top:110px">Editor pixel a pixel</div>
<h1 class=abs style="left:120px;top:190px;font-size:170px">Pixel<br>a <b>pixel.</b></h1>
<div class="abs card" style="right:140px;top:170px;width:760px;height:740px;overflow:hidden">
  <div class=abs style="left:0;right:0;top:370px;height:2px;background:#5857b0"></div>
  <div class=abs style="top:0;bottom:0;left:380px;width:2px;background:#5857b0"></div>
  <div class=abs style="left:300px;top:290px;width:160px;height:160px;border:4px solid #5857b0;background:#ecebfa;border-radius:18px"></div>
  <div class=abs style="left:290px;top:280px;width:20px;height:20px;background:#fff;border:4px solid #5857b0"></div>
  <div class=abs style="left:450px;top:440px;width:20px;height:20px;background:#fff;border:4px solid #5857b0"></div>
  <div class="abs chip" style="left:420px;top:480px">X 482 · Y 1210</div>
</div>''')

STILLS['i1-B'] = page('''
<div class=abs style="left:0;right:0;top:0;height:70px;background:#2a2a2d;border-bottom:2px solid #3d3d42"></div>
<div class=abs style="left:0;top:0;bottom:0;width:70px;background:#2a2a2d;border-right:2px solid #3d3d42"></div>
<div class=abs style="left:70px;right:0;top:44px;height:26px;background:repeating-linear-gradient(90deg,#8f8fdd 0 2px,transparent 2px 24px)"></div>
<div class=abs style="left:44px;top:70px;bottom:0;width:26px;background:repeating-linear-gradient(180deg,#8f8fdd 0 2px,transparent 2px 24px)"></div>
<div class="abs mono" style="left:220px;top:190px;color:#8f8fdd">Arraste. Ajuste.</div>
<h1 class=abs style="left:220px;top:260px;color:#faf9f5;font-size:190px">Controle<br>no <b style="color:#8f8fdd">pixel.</b></h1>
<div class=abs style="left:1180px;top:520px;width:420px;height:300px;border:4px solid #8f8fdd;background:rgba(143,143,221,.14);border-radius:12px"></div>
<div class=abs style="left:1170px;top:510px;width:22px;height:22px;background:#faf9f5;border:4px solid #8f8fdd"></div>
<div class=abs style="left:1590px;top:810px;width:22px;height:22px;background:#faf9f5;border:4px solid #8f8fdd"></div>
<div class="abs chip" style="left:1180px;top:850px;background:#8f8fdd;color:#1f1e1d">L 420 · A 300</div>''', bg='#1f1e1d')

STILLS['i1-C'] = page('''
<div class=dots style="background-image:radial-gradient(rgba(255,255,255,.28) 2px,transparent 2px)"></div>
<div class="abs mono" style="left:0;right:0;top:130px;text-align:center;color:#d6d5f4">Posição exata</div>
<h1 class=abs style="left:0;right:0;top:230px;text-align:center;color:#fff;font-size:340px;letter-spacing:-.06em">482<span style="color:#d6d5f4">,</span>1210</h1>
<div class=abs style="left:300px;right:300px;top:640px;height:2px;background:#fff;opacity:.5"></div>
<div class=abs style="left:300px;top:610px;width:60px;height:60px;border-radius:50%;border:4px solid #fff"></div>
<div class=abs style="left:1560px;top:610px;width:60px;height:60px;border-radius:50%;background:#fff"></div>
<div class="abs mono" style="left:0;right:0;top:760px;text-align:center;color:#d6d5f4;font-size:30px">X · Y · arraste, solte, pronto</div>''', bg='#5857b0')

# ---- i3 Zero to Live -----------------------------------------------------
nodes = [('Prompt', '0:00'), ('Página', '0:20'), ('Domínio', '1:10'), ('No ar', '2:40')]
def node(i, lab, t, dark=False):
    x = 260 + i * 460
    fg = '#faf9f5' if dark else '#1f1e1d'
    last = i == 3
    dot = f'background:#5857b0;border:6px solid {"#8f8fdd" if dark else "#d6d5f4"}' if last else f'background:{"#1f1e1d" if dark else "#fff"};border:6px solid #5857b0'
    return f'''<div class=abs style="left:{x-30}px;top:640px;width:60px;height:60px;border-radius:50%;{dot}"></div>
    <div class=abs style="left:{x-120}px;width:240px;text-align:center;top:730px;font-weight:800;font-size:44px;letter-spacing:-.03em;color:{fg}">{lab}</div>
    <div class="abs mono" style="left:{x-120}px;width:240px;text-align:center;top:795px;{'color:#8f8fdd' if dark else ''}">{t}</div>'''

STILLS['i3-A'] = page(f'''
<div class=dots></div>
<div class="abs mono" style="left:120px;top:110px">Do zero ao ar</div>
<h1 class=abs style="left:120px;top:190px;font-size:190px">Em <b>minutos.</b></h1>
<div class=abs style="left:260px;width:1380px;top:668px;height:6px;background:#d9d6cb;border-radius:4px"></div>
<div class=abs style="left:260px;width:1380px;top:668px;height:6px;background:#5857b0;border-radius:4px"></div>
{''.join(node(i, l, t) for i, (l, t) in enumerate(nodes))}''')

STILLS['i3-B'] = page('''
<div class="abs mono" style="left:0;right:0;top:110px;text-align:center;color:#8f8fdd">Tempo até publicar</div>
<div class=abs style="left:660px;top:190px;width:600px;height:600px;border-radius:50%;border:26px solid #35353a"></div>
<div class=abs style="left:660px;top:190px;width:600px;height:600px;border-radius:50%;border:26px solid #8f8fdd;border-right-color:transparent;border-bottom-color:transparent;transform:rotate(-20deg)"></div>
<div class=abs style="left:0;right:0;top:370px;text-align:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:120px;color:#faf9f5">02:40</div>
<div class=abs style="left:0;right:0;top:530px;text-align:center"><span class=chip style="background:#3fb26b">✓ No ar</span></div>
<h1 class=abs style="left:0;right:0;top:830px;text-align:center;color:#faf9f5;font-size:100px">Do zero ao ar em <b style="color:#8f8fdd">minutos.</b></h1>''', bg='#1f1e1d')

STILLS['i3-C'] = page('''
<div class=dots style="background-image:radial-gradient(rgba(255,255,255,.25) 2px,transparent 2px)"></div>
<div class="abs mono" style="left:0;right:0;top:130px;text-align:center;color:#d6d5f4">Do zero ao ar em minutos</div>
<div class="abs card" style="left:260px;right:260px;top:300px;height:150px;border-radius:75px;display:flex;align-items:center;padding:0 60px;gap:36px">
  <span style="font-size:52px">🔒</span>
  <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:64px;letter-spacing:-.03em">suaclinica.com.br<span style="color:#5857b0">|</span></span>
  <span class=chip style="margin-left:auto;background:#3fb26b">No ar</span></div>
<h1 class=abs style="left:0;right:0;top:560px;text-align:center;color:#fff;font-size:230px">Publicado.</h1>
<div class="abs mono" style="left:0;right:0;top:880px;text-align:center;color:#d6d5f4;font-size:30px">Novo lead · Mariana · (11) 9····-····</div>''', bg='#5857b0')

(JOB / 'out/src').mkdir(parents=True, exist_ok=True)
for key, html in STILLS.items():
    src = JOB / 'out/src' / f'{key}.html'
    src.write_text(html, encoding='utf-8')
    png = JOB / 'out' / f'still-{key}.png'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={W},{H}',
                    '--virtual-time-budget=4000', f'--screenshot={png}', f'file://{src}'],
                   check=True, capture_output=True)
    print('ok', png.name)

job = json.loads((JOB / 'job.json').read_text())
names = {'A': ('Mira', 'Mira cruzada e coordenada em chip roxo sobre fundo creme.'),
         'B': ('Régua', 'Fundo escuro com réguas do editor e caixa com alças.'),
         'C': ('Número', 'Coordenada gigante sobre roxo, com ponto que desliza.')}
names3 = {'A': ('Linha do tempo', 'Quatro marcos, do prompt ao "No ar", com tempo em cada um.'),
          'B': ('Cronômetro', 'Anel de tempo em fundo escuro, 02:40 e selo "No ar".'),
          'C': ('URL no ar', 'Barra de endereço digitando o domínio, sobre roxo.')}
ideas = {i['id']: i for i in job['ideas']}
job['stills'] = []
for iid, nm in (('i1', names), ('i3', names3)):
    if ideas[iid]['status'] != 'approved':
        continue
    job['stills'].append({'ideaId': iid, 'title': ideas[iid]['title'], 'pick': None, 'note': '',
        'options': [{'key': k, 'name': nm[k][0], 'desc': nm[k][1], 'file': f'videos/{JOB_ID}/out/still-{iid}-{k}.png'} for k in 'ABC']})
job['aiTask'] = None
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
job['updatedAt'] = now
job['log'].append({'at': now, 'task': 'stills', 'msg': '6 stills 1920x1080 (2 ideias x 3 opções) via HTML + Chrome headless.'})
(JOB / 'job.json').write_text(json.dumps(job, ensure_ascii=False, indent=2))
