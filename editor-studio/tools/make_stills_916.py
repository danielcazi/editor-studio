#!/usr/bin/env python3
"""Stills 9:16 sobre frame real com a pessoa recortada (talking head).
Uso: python3 tools/make_stills_916.py <job-id>
Precisa de videos/<id>/work/plates/<ideia>.png (frame) e work/cutouts/<ideia>.png (rembg).
Camadas de cada still: plate (frame) -> #back (atrás da pessoa) -> #person (recorte) -> #front.
Três direções por ideia: A atrás da pessoa · B card na frente · C fundo da marca."""
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
W, H = 1080, 1920

CSS = '''
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Comfortaa:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#1f1e1d;background:#000}
.abs{position:absolute}
.plate,.person{position:absolute;left:0;top:0;width:1080px;height:1920px}
.person.scaled{transform:scale(.78);transform-origin:50% 100%;filter:drop-shadow(0 30px 60px rgba(31,30,29,.28))}
.dim{position:absolute;inset:0}
.cream{position:absolute;inset:0;background:#faf9f5}
.cream:after{content:'';position:absolute;inset:0;background-image:radial-gradient(#dcd9ce 3px,transparent 3px);background-size:54px 54px}
.mono{font-family:'JetBrains Mono',monospace;font-weight:500;letter-spacing:.14em;text-transform:uppercase;font-size:24px;color:#7c7a73}
.kw{font-weight:800;letter-spacing:-.05em;line-height:.92}
.kw b{color:#5857b0}
.card{background:#fff;border-radius:34px;box-shadow:0 40px 80px -20px rgba(0,0,0,.45);border:2px solid #e6e3da}
.chip{display:inline-flex;align-items:center;gap:12px;background:#5857b0;color:#fff;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:28px;padding:14px 22px;border-radius:14px}
.bar{display:flex;align-items:center;gap:22px;background:#fff;border-radius:999px;border:2px solid #e6e3da;box-shadow:0 18px 40px -12px rgba(0,0,0,.35);padding:0 34px;font-size:40px;font-weight:500;color:#1f1e1d}
.cur{display:inline-block;width:4px;height:46px;background:#5857b0;margin-left:4px;vertical-align:middle}
.res{background:#fff;border-radius:22px;padding:20px 26px;box-shadow:0 14px 30px -10px rgba(0,0,0,.3)}
.res .u{font-size:22px;color:#3fb26b;font-weight:500}
.res .t{font-size:32px;font-weight:700;color:#1f1e1d;margin-top:4px;letter-spacing:-.02em}
.res.dim2{opacity:.45}
.res.sm{padding:14px 18px}.res.sm .u{font-size:16px;overflow-wrap:anywhere}.res.sm .t{font-size:25px}
.q{background:#fff;border-radius:24px;padding:24px 30px;font-weight:800;font-size:44px;letter-spacing:-.03em;display:flex;align-items:center;gap:22px;box-shadow:0 18px 40px -12px rgba(0,0,0,.45)}
.q i{font-style:normal;flex:none;width:64px;height:64px;border-radius:50%;background:#5857b0;color:#fff;display:grid;place-items:center;font-size:40px}
.ico{width:120px;height:120px;border-radius:32px;display:grid;place-items:center;box-shadow:0 18px 40px -12px rgba(0,0,0,.4)}
.lbl{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;letter-spacing:.06em;text-transform:uppercase}
.logo{display:flex;align-items:center;gap:16px;font-family:Comfortaa,sans-serif;font-size:44px;color:#1f1e1d}
.logo b{font-weight:700}
.page{background:#fff;border-radius:22px;border:2px solid #e6e3da;overflow:hidden;box-shadow:0 24px 50px -16px rgba(0,0,0,.4)}
.page .hd{height:26px;background:#ecebfa}
.page .hero{height:120px;margin:16px;border-radius:12px;background:linear-gradient(135deg,#f3dfd6,#e8c9bd)}
.page .ln{height:14px;margin:10px 16px;border-radius:7px;background:#e6e3da}
.page .ln.s{width:55%}
.sel{outline:4px solid #5857b0;outline-offset:6px;position:relative}
.h{position:absolute;width:22px;height:22px;background:#fff;border:4px solid #5857b0}
'''

def logo(sz=72):
    return f'''<div class=logo><svg width={sz} height={sz} viewBox="0 0 120 120"><circle cx=60 cy=60 r=60 fill="#6f6fc9"/><g fill=none stroke="#fff" stroke-width=7 stroke-linejoin=round stroke-linecap=round><path d="M60 30l30 14-30 14-30-14z"/><path d="M30 60l30 14 30-14"/><path d="M30 75l30 14 30-14"/></g></svg><span><b>insula</b>build</span></div>'''

MAG = '<svg width=44 height=44 viewBox="0 0 24 24" fill=none stroke="#7c7a73" stroke-width=2.4 stroke-linecap=round><circle cx=10.5 cy=10.5 r=6.5/><path d="M20 20l-4.5-4.5"/></svg>'
WA = '<svg width=64 height=64 viewBox="0 0 24 24" fill="#fff"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm4.6 12.6c-.2.6-1.2 1.1-1.7 1.2-.4 0-.9.1-3-.8-2.5-1.1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3 0 .2 0 .8-.2 1.3z"/></svg>'
CRM = '<svg width=64 height=64 viewBox="0 0 24 24" fill=none stroke="#fff" stroke-width=2.2 stroke-linecap=round><circle cx=9 cy=8 r=3.5/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx=17.5 cy=9.5 r=2.5/><path d="M16.5 14.6c2.6.1 4.3 1.8 5 4.4"/></svg>'
GA = '<svg width=64 height=64 viewBox="0 0 24 24" fill="#fff"><rect x=3 y=13 width=4.5 height=8 rx=2.2/><rect x=9.75 y=8 width=4.5 height=13 rx=2.2/><rect x=16.5 y=3 width=4.5 height=18 rx=2.2/></svg>'
ICONS = [('WhatsApp', '#25b864', WA), ('CRM', '#5857b0', CRM), ('GA4', '#f29d0c', GA)]

def bar(text, w, h=118, fs=40):
    return f'<div class=bar style="width:{w}px;height:{h}px;font-size:{fs}px">{MAG}<span>{text}<span class=cur></span></span></div>'

def res(url, title, extra=''):
    return f'<div class="res {extra}"><div class=u>{url}</div><div class=t>{title}</div></div>'

def page(sel=False, w=250):
    s = ' sel' if sel else ''
    hs = '<div class=h style="left:-17px;top:-17px"></div><div class=h style="right:-17px;bottom:-17px"></div>' if sel else ''
    return f'<div class="page{s}" style="width:{w}px">{hs}<div class=hd></div><div class=hero></div><div class=ln></div><div class="ln s"></div><div class=ln></div><div class="ln s" style="margin-bottom:20px"></div></div>'

def compose(idea, back='', front='', mode='plate', dim=0.0, top_dim=False):
    plate = f'file://{JOB}/work/plates/{idea}.png'
    person = f'file://{JOB}/work/cutouts/{idea}.png'
    if mode == 'plate':
        bg = f'<img class=plate src="{plate}">'
        if dim: bg += f'<div class=dim style="background:rgba(10,10,12,{dim})"></div>'
        if top_dim: bg += '<div class=dim style="background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 40%)"></div>'
        pcls = 'person'
    elif mode == 'cream':
        bg, pcls = '<div class=cream></div>', 'person scaled'
    else:  # night
        bg, pcls = '<div class=dim style="background:radial-gradient(70% 45% at 50% 62%,#2a2840,#0c0c10 75%)"></div>', 'person scaled'
    return f'''<!doctype html><meta charset=utf-8><style>{CSS}</style><body>
{bg}<div id=back>{back}</div><img class="{pcls}" id=person src="{person}"><div id=front>{front}</div></body>'''.replace('/>', ' />')

S = {}
from PIL import Image
def col(idea):
    """Coluna à direita da cabeça: começa 12px atrás da borda do recorte (y 300-850) e vai até x 1040."""
    a = Image.open(JOB / 'work/cutouts' / f'{idea}.png').getchannel('A').crop((0, 300, 1080, 850))
    edge = a.point(lambda v: 255 if v > 128 else 0).getbbox()[2]
    left = min(max(edge - 12, 600), 760)
    return left, 1040 - left
CW = {i: col(i) for i in ('i1', 'i2', 'i3', 'i4', 'i5')}
COLS = {i: f'left:{l}px;width:{w}px;padding-left:28px' for i, (l, w) in CW.items()}

# ---------- i1 Busca ao vivo ----------
S['i1-A'] = compose('i1', back=f'''
  <div class=abs style="{COLS["i1"]};top:330px;display:flex;flex-direction:column;gap:18px">
    <div class=mono style="color:#f4f1e0">Google</div>
    {bar('dentista perto…', CW['i1'][1] - 28, 84, 26)}
    {res('sorrisoclinic.com.br', 'Clínica Sorriso', 'sm')}
    {res('odontopinheiros.com', 'Odonto Pinheiros', 'sm')}
    {res('seuconsultorio.com.br', 'Seu consultório', 'dim2 sm')}
  </div>''')
S['i1-B'] = compose('i1', dim=.18, front=f'''
  <div class="abs card" style="left:60px;top:960px;width:960px;padding:40px;display:flex;flex-direction:column;gap:20px">
    <div class=mono>Busca no Google</div>
    {bar('dentista perto de mim', 880)}
    {res('sorrisoclinic.com.br', 'Clínica Sorriso · Pinheiros')}
    {res('odontopinheiros.com', 'Odonto Pinheiros · 4,9 ★')}
    {res('seuconsultorio.com.br', 'Seu consultório', 'dim2')}
  </div>''')
S['i1-C'] = compose('i1', mode='cream', back=f'''
  <div class=abs style="left:70px;top:250px">{logo(60)}</div>
  <div class="abs kw" style="left:70px;top:330px;font-size:140px">perto<br>de <b>mim.</b></div>''', front=f'''
  <div class=abs style="left:60px;top:1060px;display:flex;flex-direction:column;gap:24px">
    {bar('dentista perto de mim', 900, 124, 42)}
    <div style="margin-left:80px">{bar('psicólogo em Pinheiros', 820, 112, 38)}</div>
  </div>''')

# ---------- i2 Fecha e vai pro próximo ----------
S['i2-A'] = compose('i2', back=f'''
  <div class="abs card" style="{COLS["i2"]};top:340px;padding:0;overflow:hidden">
    <div style="height:56px;background:#f1efe8;display:flex;align-items:center;gap:10px;padding:0 20px;font-size:22px;color:#7c7a73">● ● ● <span style="margin-left:10px">seusite.com.br</span><span style="margin-left:auto;font-weight:800;color:#e0443a">✕</span></div>
    <div style="height:300px;display:grid;place-items:center;font-size:170px;font-weight:800;color:#e6e3da">?</div>
  </div>
  <div class="abs chip" style="left:{CW['i2'][0] + 60}px;top:740px;background:#e0443a">fechou em 4s</div>''')
S['i2-B'] = compose('i2', dim=.2, front=f'''
  <div class="abs card" style="left:60px;top:960px;width:960px;padding:40px;display:flex;flex-direction:column;gap:20px">
    <div class=mono>Em segundos</div>
    {res('seuconsultorio.com.br', 'Seu consultório', 'dim2')}
    <div class=res style="outline:4px solid #5857b0;outline-offset:4px"><div class=u>odontopinheiros.com</div><div class=t>Odonto Pinheiros → próximo da lista</div></div>
    <div><span class=chip style="background:#e0443a">−1 paciente · você nem viu</span></div>
  </div>''')
S['i2-C'] = compose('i2', mode='cream', back=f'''
  <div class=abs style="left:70px;top:250px">{logo(60)}</div>
  <div class="abs kw" style="left:70px;top:330px;font-size:134px">foi pro<br><b>próximo.</b></div>''', front='''
  <div class="abs card" style="left:120px;top:1120px;width:840px;padding:36px 44px;display:flex;align-items:center;gap:30px">
    <div class=kw style="font-size:150px;color:#e0443a">−1</div>
    <div><div style="font-size:40px;font-weight:800;letter-spacing:-.03em">paciente perdido</div><div class=mono style="margin-top:8px">e não aparece em relatório</div></div>
  </div>''')

# ---------- i3 No escuro ----------
Q = ['Quem entrou?', 'De onde veio?', 'Clicou no WhatsApp?']
S['i3-A'] = compose('i3', dim=.72, back=f'''
  <div class=abs style="{COLS["i3"]};top:330px;display:flex;flex-direction:column;gap:18px">
    {''.join(f'<div class=q style="font-size:27px;padding:14px 16px;gap:14px"><i style="width:42px;height:42px;font-size:26px">?</i>{q}</div>' for q in Q)}
  </div>''')
S['i3-B'] = compose('i3', dim=.38, front=f'''
  <div class=abs style="left:70px;top:1000px;width:940px;display:flex;flex-direction:column;gap:22px">
    {''.join(f'<div class=q style="margin-left:{i*50}px"><i>?</i>{q}</div>' for i, q in enumerate(Q))}
  </div>''')
S['i3-C'] = compose('i3', mode='night', back='''
  <div class="abs mono" style="left:70px;top:260px;color:#8f8fdd">sem dados, você fica</div>
  <div class="abs kw" style="left:70px;top:310px;font-size:150px;color:#faf9f5">no<br><b style="color:#8f8fdd">escuro.</b></div>''')

# ---------- i4 3 páginas, pixel a pixel ----------
PW = (CW['i4'][1] - 28 - 28) // 3
LBL = ['o que faz', 'o que trata', 'onde atende']
S['i4-A'] = compose('i4', back=f'''
  <div class=abs style="{COLS["i4"]};top:320px">
    <div class=mono style="color:#f4f1e0;margin-bottom:16px">3 páginas · SEO</div>
    <div style="display:flex;gap:14px">{page(False, PW)}{page(True, PW)}{page(False, PW)}</div>
    <div style="display:flex;gap:14px;margin-top:16px">{''.join(f'<div class=lbl style="width:{PW}px;color:#f4f1e0;font-size:15px">{l}</div>' for l in LBL)}</div>
    <div class=chip style="margin-top:22px;font-size:20px;padding:10px 14px;white-space:nowrap">X 482 · Y 210</div>
  </div>''')
S['i4-B'] = compose('i4', dim=.18, front=f'''
  <div class="abs card" style="left:50px;top:940px;width:980px;height:540px;overflow:hidden;display:flex">
    <div style="width:110px;background:#f5f4ee;border-right:2px solid #e6e3da;display:flex;flex-direction:column;align-items:center;gap:22px;padding-top:30px">
      {''.join('<div style="width:56px;height:56px;border-radius:14px;background:#ecebfa"></div>' for _ in range(5))}</div>
    <div style="flex:1;position:relative;background:#fbfaf7">
      <div style="height:38px;border-bottom:2px solid #e6e3da;background:repeating-linear-gradient(90deg,#c9c6bb 0 2px,transparent 2px 22px)"></div>
      <div class=abs style="left:46px;top:90px;display:flex;gap:34px">{page(False, 230)}{page(True, 230)}{page(False, 230)}</div>
      <div class=abs style="left:46px;top:440px;display:flex;gap:34px">{''.join(f'<div class=lbl style="width:230px;color:#5857b0">{l}</div>' for l in LBL)}</div>
      <div class="abs chip" style="left:430px;top:58px;font-size:22px;padding:8px 14px">X 482 · Y 210</div>
    </div>
  </div>''')
S['i4-C'] = compose('i4', mode='cream', back=f'''
  <div class=abs style="left:70px;top:250px">{logo(60)}</div>
  <div class="abs kw" style="left:70px;top:330px;font-size:134px">3 páginas<br>com <b>SEO.</b></div>''', front=f'''
  <div class=abs style="left:70px;top:1090px;display:flex;gap:30px;perspective:1400px">
    {''.join(f'<div style="transform:rotateY({r}deg) translateY({y}px)">{page(i == 1, 290)}<div class=lbl style="margin-top:16px;color:#5857b0;text-align:center">{l}</div></div>' for i, (l, r, y) in enumerate(zip(LBL, (14, 0, -14), (20, 0, 20))))}
  </div>''')

# ---------- i5 Tudo conectado ----------
def icon(name, color, svg, sz=120):
    return f'<div style="display:flex;flex-direction:column;align-items:center;gap:12px"><div class=ico style="width:{sz}px;height:{sz}px;background:{color}">{svg}</div><div class=lbl style="color:inherit">{name}</div></div>'
STATS = [('1.248', 'visitas'), ('62%', 'vieram do Google'), ('87', 'cliques no WhatsApp')]
S['i5-A'] = compose('i5', back=f'''
  <div class=abs style="{COLS["i5"]};top:330px;color:#f4f1e0">
    <div class=mono style="color:#f4f1e0;margin-bottom:22px">seu site, conectado</div>
    <div style="display:flex;flex-direction:column;gap:26px;position:relative">
      <div class=abs style="left:58px;top:40px;width:4px;height:330px;background:#8f8fdd"></div>
      {''.join(f'<div style="display:flex;align-items:center;gap:22px;position:relative">{icon("", c, s, 112)}<div style="font-size:34px;font-weight:800;letter-spacing:-.02em">{n}</div></div>' for n, c, s in ICONS)}
    </div>
  </div>''')
S['i5-B'] = compose('i5', dim=.18, front=f'''
  <div class="abs card" style="left:60px;top:980px;width:960px;padding:40px">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class=mono>Painel · últimos 30 dias</div>
      <div style="display:flex;gap:10px">{''.join(f'<div class=ico style="width:54px;height:54px;border-radius:14px;background:{c};box-shadow:none">{s.replace("width=64 height=64", "width=30 height=30")}</div>' for _, c, s in ICONS)}</div></div>
    <div style="display:flex;gap:20px;margin-top:30px">
      {''.join(f'<div style="flex:1;background:#f5f4ee;border-radius:22px;padding:24px"><div class=kw style="font-size:80px;color:{"#5857b0" if i == 2 else "#1f1e1d"}">{v}</div><div class=lbl style="margin-top:10px;color:#7c7a73;font-size:18px">{l}</div></div>' for i, (v, l) in enumerate(STATS))}
    </div>
  </div>''')
S['i5-C'] = compose('i5', mode='cream', back=f'''
  <div class=abs style="left:70px;top:250px">{logo(60)}</div>
  <div class="abs kw" style="left:70px;top:330px;font-size:140px">tudo<br><b>conectado.</b></div>''', front=f'''
  <div class="abs card" style="left:90px;top:1100px;width:900px;padding:34px 40px;display:flex;align-items:center;justify-content:space-between;color:#1f1e1d">
    {''.join(icon(n, c, s, 104) for n, c, s in ICONS)}
    <div style="font-size:60px;color:#8f8fdd">→</div>
    <div style="text-align:right"><div class=kw style="font-size:84px;color:#5857b0">87</div><div class=lbl style="color:#7c7a73;font-size:18px">cliques no WhatsApp</div></div>
  </div>''')

# ---------- render ----------
src_dir = JOB / 'out/src916'
src_dir.mkdir(parents=True, exist_ok=True)
only = sys.argv[2:]  # opcional: chaves específicas
for key, html in S.items():
    if only and key not in only:
        continue
    src = src_dir / f'{key}.html'
    src.write_text(html, encoding='utf-8')
    png = JOB / 'out' / f'still916-{key}.png'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    f'--window-size={W},{H}', '--virtual-time-budget=5000', f'--screenshot={png}', f'file://{src}'],
                   check=True, capture_output=True)
    print('ok', png.name, flush=True)

if not only:
    NAMES = {'A': ('Atrás', 'Gráfico atrás da pessoa, saindo pela lateral da cabeça, sobre o frame real.'),
             'B': ('Card', 'Card branco na frente do peito, frame levemente escurecido.'),
             'C': ('Marca', 'Fundo trocado pelo creme pontilhado do Build (ou noite, no i3), pessoa recortada e título grande no topo.')}
    job = json.loads((JOB / 'job.json').read_text())
    job['stills'] = [{'ideaId': i['id'], 'title': i['title'], 'pick': None, 'note': '',
                      'options': [{'key': k, 'name': NAMES[k][0], 'desc': NAMES[k][1],
                                   'file': f'videos/{JOB_ID}/out/still916-{i["id"]}-{k}.png'} for k in 'ABC']}
                     for i in job['ideas'] if i['status'] == 'approved']
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    job.update(aiTask=None, updatedAt=now)
    job['log'].append({'at': now, 'task': 'stills', 'msg': f'{len(job["stills"]) * 3} stills 9:16 sobre frame real + recorte BiRefNet (rembg).'})
    (JOB / 'job.json').write_text(json.dumps(job, ensure_ascii=False, indent=2))
