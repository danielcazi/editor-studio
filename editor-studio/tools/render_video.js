#!/usr/bin/env node
// Motor de render da tarefa "video".
// Para cada still aprovado e escolhido: anima o HTML do still com GSAP (timeline pausada e
// "seekável"), captura cada frame com Chrome headless, vira um clipe com ffmpeg e entra
// como inserção sobre o vídeo original, no tempo da ideia (o áudio original segue intacto).
//
// Uso: node tools/render_video.js <job-id> [--default A] [--out <pasta>] [--dur 3.5] [--fps 30]
//   --default A  usa a opção A quando o editor ainda não escolheu (teste; não grava no job.json)
//   --out        pasta de saída (padrão: videos/<id>/out)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((p) => p && fs.existsSync(p));
if (!CHROME) { console.error('Chrome não encontrado. Instale o Google Chrome ou defina CHROME_PATH.'); process.exit(1); }
const GSAP = path.join(__dirname, 'node_modules/gsap/dist/gsap.min.js');

const args = process.argv.slice(2);
const jobId = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!jobId) { console.error('uso: render_video.js <job-id> [--default A] [--out pasta]'); process.exit(1); }
const DEFAULT = opt('default', null);
const DUR = parseFloat(opt('dur', '3.5'));
const FPS = parseInt(opt('fps', '30'), 10);
const JOB_DIR = path.join(ROOT, '..', 'videos', jobId);
const JOB_FILE = path.join(JOB_DIR, 'job.json');
const OUT = path.resolve(opt('out', path.join(JOB_DIR, 'out')));
const TEST = DEFAULT !== null;
fs.mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------
// Timelines GSAP, uma por still. `E` = filhos diretos do body (sem dots/script).
// Cada função recebe (tl, E, helpers) e monta a animação. Duração alvo ≈ DUR.
// ------------------------------------------------------------------
const TIMELINES = {
  'i1-A': `
    const card = E[3], [hl, vl, box, h1, h2, chip] = card.children;
    tl.from(E[1], {opacity:0, y:20, duration:.4}, .1)
      .from(E[2], {opacity:0, y:60, duration:.7, ease:'power3.out'}, .2)
      .from(card, {opacity:0, y:80, scale:.92, duration:.8, ease:'back.out(1.3)'}, .35)
      .from(hl, {scaleX:0, transformOrigin:'0 50%', duration:.6, ease:'power2.out'}, .95)
      .from(vl, {scaleY:0, transformOrigin:'50% 0', duration:.6, ease:'power2.out'}, 1.05)
      .from([box, h1, h2, chip], {x:-120, y:-90, duration:1, ease:'power3.inOut'}, 1.4)
      .from(chip, {opacity:0, scale:.6, duration:.35, ease:'back.out(2)'}, 1.5);
    const p = {x:0, y:0};
    tl.to(p, {x:482, y:1210, duration:1, ease:'power3.inOut', onUpdate(){ chip.textContent = 'X '+Math.round(p.x)+' · Y '+Math.round(p.y); }}, 1.4);
    tl.to(box, {boxShadow:'0 0 0 14px rgba(88,87,176,.18)', duration:.3, yoyo:true, repeat:1}, 2.5);`,

  'i1-B': `
    const [tr, lr, tt, lt, mono, h1, box, hd1, hd2, chip] = E;
    tl.from([tr, tt], {y:-80, duration:.5, ease:'power3.out'}, 0)
      .from([lr, lt], {x:-80, duration:.5, ease:'power3.out'}, .05)
      .from(mono, {opacity:0, y:20, duration:.4}, .3)
      .from(h1, {opacity:0, y:70, duration:.7, ease:'power3.out'}, .4)
      .from(box, {scale:.02, transformOrigin:'0 0', duration:1.1, ease:'power3.inOut'}, 1.0)
      .from(hd2, {x:-410, y:-290, duration:1.1, ease:'power3.inOut'}, 1.0)
      .from(hd1, {scale:0, duration:.3, ease:'back.out(3)'}, 1.0)
      .from(chip, {opacity:0, scale:.6, duration:.35, ease:'back.out(2)'}, 1.2);
    const p = {l:0, a:0};
    tl.to(p, {l:420, a:300, duration:1.1, ease:'power3.inOut', onUpdate(){ chip.textContent = 'L '+Math.round(p.l)+' · A '+Math.round(p.a); }}, 1.0);
    tl.to(hd2, {scale:1.5, duration:.25, yoyo:true, repeat:1}, 2.3);`,

  'i1-C': `
    const [dots, mono, h1, line, c1, c2, mono2] = E;
    tl.from(mono, {opacity:0, y:-20, duration:.4}, .1)
      .from(line, {scaleX:0, transformOrigin:'0 50%', duration:.7, ease:'power2.out'}, .2)
      .from(c1, {scale:0, duration:.4, ease:'back.out(3)'}, .3)
      .from(c2, {x:-1260, duration:1.5, ease:'power3.inOut'}, .7)
      .from(mono2, {opacity:0, y:20, duration:.5}, 1.8);
    const p = {a:0, b:0};
    tl.to(p, {a:482, b:1210, duration:1.5, ease:'power3.inOut', onUpdate(){
      h1.innerHTML = Math.round(p.a)+'<span style="color:#d6d5f4">,</span>'+Math.round(p.b); }}, .7);
    tl.from(h1, {opacity:0, scale:.94, duration:.5, ease:'power2.out'}, .1);`,

  'i3-A': `
    const [dots, mono, h1, base, prog] = E, nodes = E.slice(5);
    tl.from(mono, {opacity:0, y:20, duration:.4}, .1)
      .from(h1, {opacity:0, y:70, duration:.7, ease:'power3.out'}, .2)
      .from(prog, {scaleX:0, transformOrigin:'0 50%', duration:2.2, ease:'power1.inOut'}, .7);
    for (let i = 0; i < 4; i++) {
      const [d, l, t] = nodes.slice(i*3, i*3+3), at = .7 + (i/3)*2.2;
      tl.from(d, {scale:0, duration:.4, ease:'back.out(3)'}, at)
        .from([l, t], {opacity:0, y:18, duration:.4, stagger:.08}, at + .05);
    }
    tl.to(nodes[9], {scale:1.35, duration:.3, yoyo:true, repeat:1, ease:'power2.inOut'}, 3.0);`,

  'i3-B': `
    const [mono, ring, arc, time, chipW, h1] = E;
    gsap.set(arc, {rotation:-20});
    tl.from(mono, {opacity:0, y:-20, duration:.4}, .1)
      .from(ring, {opacity:0, scale:.9, duration:.6, ease:'power3.out'}, .15)
      .from(h1, {opacity:0, y:50, duration:.7, ease:'power3.out'}, .3)
      .from(arc, {opacity:0, duration:.3}, .4)
      .to(arc, {rotation:340, duration:2.4, ease:'power2.inOut'}, .5)
      .from(chipW, {opacity:0, scale:0, duration:.45, ease:'back.out(3)'}, 2.9);
    const p = {s:0};
    tl.to(p, {s:160, duration:2.4, ease:'power2.inOut', onUpdate(){
      const s = Math.round(p.s); time.textContent = String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }}, .5);`,

  'i3-C': `
    const [dots, mono, card, h1, mono2] = E, [lock, url, chip] = card.children;
    const txt = 'suaclinica.com.br', cur = '<span style="color:#5857b0">|</span>';
    url.innerHTML = cur;
    tl.from(mono, {opacity:0, y:-20, duration:.4}, .1)
      .from(card, {opacity:0, y:70, duration:.7, ease:'power3.out'}, .2)
      .from(chip, {opacity:0, scale:0, duration:.4, ease:'back.out(3)'}, 2.3)
      .from(h1, {opacity:0, scale:.8, duration:.6, ease:'back.out(1.6)'}, 2.4)
      .from(mono2, {opacity:0, y:20, duration:.5}, 3.0);
    const p = {n:0};
    tl.to(p, {n:txt.length, duration:1.6, ease:'none', onUpdate(){ url.innerHTML = txt.slice(0, Math.round(p.n)) + cur; }}, .6);`,
};

const bootstrap = (key) => `
<script src="file://${GSAP}"></script>
<script>
  // E = filhos diretos do body na ordem do HTML do still (inclui .dots quando existe)
  const E = [...document.body.children].filter(e => /^(DIV|H1)$/.test(e.tagName));
  window.tl = gsap.timeline({paused:true});
  const tl = window.tl;
  ${TIMELINES[key]}
  window.seek = (t) => { tl.seek(t, false); };
</script>`;

// ---- utilidades ----
const toSec = (s) => { const [m, ss] = String(s).split(':').map(Number); return (m || 0) * 60 + (ss || 0); };
const run = (cmd, a) => {
  const r = spawnSync(cmd, a, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} falhou:\n${r.stderr.slice(-1500)}`);
};

(async () => {
  const job = JSON.parse(fs.readFileSync(JOB_FILE, 'utf8'));
  const ideas = Object.fromEntries(job.ideas.map((i) => [i.id, i]));
  const todo = [];
  for (const s of job.stills) {
    const idea = ideas[s.ideaId];
    if (!idea || idea.status !== 'approved') continue;
    const pick = s.pick || DEFAULT;
    if (!pick) { console.error(`✗ ${s.ideaId} ainda sem escolha. Escolha na interface ou use --default A para teste.`); process.exit(2); }
    const key = `${s.ideaId}-${pick}`;
    if (!TIMELINES[key]) { console.error(`✗ sem timeline para ${key}`); process.exit(3); }
    todo.push({ key, at: toSec(idea.at), note: s.note, ideaId: s.ideaId });
  }
  if (!todo.length) { console.error('Nada a renderizar: nenhuma ideia aprovada com still.'); process.exit(4); }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  const clips = [];
  for (const t of todo) {
    const srcHtml = fs.readFileSync(path.join(JOB_DIR, 'out/src', `${t.key}.html`), 'utf8');
    const animated = path.join(OUT, `anim-${t.key}.html`);
    fs.writeFileSync(animated, srcHtml.replace('</body>', bootstrap(t.key) + '</body>'));
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto('file://' + animated, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    const dir = path.join(OUT, `frames-${t.key}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(DUR * FPS);
    process.stdout.write(`▶ ${t.key} @${t.at}s · ${n} frames `);
    for (let i = 0; i < n; i++) {
      await page.evaluate((s) => window.seek(s), i / FPS);
      await page.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.png') });
      if (i % 30 === 0) process.stdout.write('.');
    }
    console.log(' ok');
    await page.close();
    const clip = path.join(OUT, `clip-${t.key}.mp4`);
    run('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%04d.png'),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '14', clip]);
    clips.push({ ...t, clip });
  }
  await browser.close();

  // ---- composição: inserções sobre o vídeo original, áudio original mantido ----
  const base = path.join(ROOT, '..', job.briefing.video.path);
  const final = path.join(OUT, TEST ? 'final-teste.mp4' : 'final.mp4');
  const inputs = ['-i', base, ...clips.flatMap((c) => ['-i', c.clip])];
  const F = 0.2; // fade
  let fc = '', last = '[0:v]';
  clips.forEach((c, i) => {
    fc += `[${i + 1}:v]format=yuva420p,fade=t=in:st=0:d=${F}:alpha=1,fade=t=out:st=${DUR - F}:d=${F}:alpha=1,setpts=PTS-STARTPTS+${c.at}/TB[o${i}];`;
    fc += `${last}[o${i}]overlay=enable='between(t,${c.at},${c.at + DUR})':eof_action=pass[v${i}];`;
    last = `[v${i}]`;
  });
  fc = fc.slice(0, -1);
  run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', last, '-map', '0:a?',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-c:a', 'copy', final]);

  const rel = path.relative(path.join(ROOT, '..'), final);
  console.log('✓ ' + rel);
  if (!TEST) {
    const j = JSON.parse(fs.readFileSync(JOB_FILE, 'utf8'));
    const now = new Date().toISOString();
    j.video = { status: 'done', file: rel, notes: `Inserções animadas com GSAP (${clips.map((c) => `${c.key} em ${c.at}s`).join(', ')}), ${DUR}s cada, fade de 0,2s. Áudio original mantido. Conferir encaixe no beat.` };
    j.aiTask = null; j.updatedAt = now;
    j.log.push({ at: now, task: 'video', msg: 'render GSAP + ffmpeg concluído' });
    fs.writeFileSync(JOB_FILE, JSON.stringify(j, null, 2));
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
