// Editor Studio: servidor local sem dependências.
// Serve a interface, guarda o estado de cada vídeo em <raiz>/videos/<id>/job.json
// e recebe uploads. O Claude Code lê e escreve esse mesmo job.json (ver WORKFLOW.md).
// Caminhos gravados nos jobs são relativos à raiz do projeto (ex.: videos/<id>/out/x.jpg).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const REPO = path.resolve(ROOT, '..');
const JOBS = path.join(REPO, 'videos');
const REFS = path.join(REPO, 'referencias');
const REFS_FILE = path.join(REFS, 'refs.json');
const TOOLS_FILE = path.join(REPO, 'ferramentas.json');
const PLIB = path.join(REPO, 'motion-studio', 'lib');
const PORT = process.env.PORT || 4173;

fs.mkdirSync(JOBS, { recursive: true });
for (const c of ['edicao', 'lettering', 'motion']) fs.mkdirSync(path.join(REFS, c), { recursive: true });

const EMPTY_REFS = {
  edicao: { notes: '', files: [] },
  lettering: { notes: '', files: [] },
  motion: { notes: '', files: [] },
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.srt': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};
const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};
const writeJson = (file, obj) => {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
};
const body = (req) => new Promise((ok, fail) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => { try { ok(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { fail(e); } });
  req.on('error', fail);
});
const safeId = (s) => /^[a-z0-9-]+$/i.test(s) ? s : null;
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'job';
const jobFile = (id) => path.join(JOBS, id, 'job.json');

// pasta com o nome do vídeo; sufixo só se o nome já existir
const newId = (title) => (fs.existsSync(path.join(JOBS, slug(title))) ? `${slug(title)}-${Date.now().toString(36)}` : slug(title));
const newJob = (title) => ({
  id: newId(title),
  title,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // envio | refs | devolutiva | stills | storyboard | video
  stage: 'envio',
  // tarefa pendente para a IA: null | 'refs' | 'devolutiva' | 'stills' | 'storyboard' | 'video'
  aiTask: null,
  revisionNote: '',
  briefing: { video: null, trilha: null, legenda: null, legendaTexto: '', texto: '' },
  // portão 1: a IA propõe até 3 opções por eixo, o editor escolhe uma (ou sobe a dele)
  refOptions: { edicao: [], lettering: [], motion: [] },
  refPick: { edicao: null, lettering: null, motion: null },
  refUploads: { edicao: null, lettering: null, motion: null },
  // portão 2: leitura + definições + uma linha por momento do vídeo
  devolutiva: { resumo: '', edicao: '', lettering: '', motion: '' },
  timeline: [],
  // portão 3: stills só das peças novas aprovadas
  stills: [],
  // portão 4: um quadro por momento antes do render
  storyboard: { round: 0, frames: [], flags: {} },
  video: { status: 'idle', file: null, aep: null, notes: '' },
  log: [],
});

// ---------- sessão automática do Claude (uma conversa por job) ----------
// Quando o editor dispara uma tarefa (aiTask != null), sobe `claude -p` no mesmo job:
// a 1ª vez cria a sessão (--session-id), as próximas retomam (--resume). Log em videos/<id>/ai.log.
// Desligue com AUTO_AI=0.
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const AUTO = process.env.AUTO_AI !== '0';
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude'; // caminho do Claude Code instalado nesta máquina
const running = new Map(); // jobId -> { task, pid, since, model, effort, steps, now, recent }
const guard = require('./tools/job_guard'); // trava por job (evita duas execuções no mesmo job) e histórico do job.json

// etapas de proposta em Sonnet 5.5; só a montagem do vídeo usa Opus 5.5 em esforço médio
const modeloDa = (task) => (task === 'video' ? { model: 'claude-opus-5-5', effort: 'medium' } : { model: 'claude-sonnet-5-5', effort: null });

// Andamento: o `claude -p` sai em stream-json; cada ferramenta usada vira uma frase curta para a tela.
const rel = (f) => path.relative(REPO, String(f || '')) || String(f || '');
function frasePasso(nome, inp = {}) {
  switch (nome) {
    case 'Bash': return inp.description || String(inp.command || '').split('\n')[0].slice(0, 90);
    case 'Read': return `Lendo ${rel(inp.file_path)}`;
    case 'Write': return `Gravando ${rel(inp.file_path)}`;
    case 'Edit': return `Editando ${rel(inp.file_path)}`;
    case 'Glob': case 'Grep': return `Procurando ${inp.pattern || ''}`;
    case 'Task': case 'Agent': return `Subagente: ${inp.description || ''}`;
    default: return nome;
  }
}
function lerAndamento(id, stream, log) {
  let buf = '';
  const passo = (texto, tipo) => {
    const r = running.get(id); if (!r || !texto) return;
    const p = { texto: String(texto).trim().slice(0, 160), tipo, at: Date.now() };
    r.now = p; r.recent = [p, ...(r.recent || [])].slice(0, 6);
    if (tipo === 'ferramenta') r.steps = (r.steps || 0) + 1;
    fs.writeSync(log, `· ${p.texto}\n`);
  };
  stream.on('data', (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n')) > -1) {
      const linha = buf.slice(0, i); buf = buf.slice(i + 1);
      let ev; try { ev = JSON.parse(linha); } catch { if (linha.trim()) fs.writeSync(log, linha + '\n'); continue; }
      const r = running.get(id);
      if (ev.type === 'system' && ev.subtype === 'init' && r && ev.model) r.model = ev.model;
      if (ev.type === 'assistant' && ev.message && Array.isArray(ev.message.content)) {
        for (const c of ev.message.content) {
          if (c.type === 'tool_use') passo(frasePasso(c.name, c.input), 'ferramenta');
          else if (c.type === 'text' && c.text.trim()) passo(c.text.trim().split('\n')[0], 'nota');
        }
      }
      if (ev.type === 'result') fs.writeSync(log, `\n${ev.result || ''}\n`);
    }
  });
}

// ferramentas.json: cada encaixe (legenda, recorte, leitura, indice_refs) diz qual script ou skill usar
const ferramenta = (nome) => (readJson(TOOLS_FILE, {}).encaixes || {})[nome] || null;
function rodarFerramenta(nome, vars = {}) {
  const f = ferramenta(nome);
  if (!f || f.tipo !== 'script' || !f.cmd) return false;
  const cmd = f.cmd.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? JSON.stringify(String(vars[k])) : `{${k}}`));
  spawnSync('/bin/sh', ['-c', cmd], { cwd: REPO, stdio: 'ignore' });
  return true;
}

// Escolhas do editor no portão refs, resolvidas para texto: a IA precisa segui-las exatamente
// (elas valem mais que as notas gerais de referencias/refs.json quando houver conflito).
function escolhasDoEditor(job) {
  const linhas = [];
  for (const eixo of ['edicao', 'lettering', 'motion']) {
    const pick = (job.refPick || {})[eixo];
    if (!pick) continue;
    if (pick === 'own') { const up = (job.refUploads || {})[eixo]; linhas.push(`${eixo}: referência própria do editor${up && up.name ? ` (${up.name})` : ''}`); continue; }
    const op = ((job.refOptions || {})[eixo] || []).find((o) => o.id === pick);
    linhas.push(`${eixo}: ${pick}${op ? ` · ${op.title}${op.why ? ` (${op.why})` : ''}` : ''}`);
  }
  return linhas.length ? linhas.join('; ') : '';
}

// Ritmo do briefing: algo novo a cada 1,5 s e peças com ≥ 3 s na tela. Roda o conferidor sobre a timeline do job.
function conferirRitmo(id) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'tools', 'check_timeline.js'), id, '--json'], { encoding: 'utf8' });
  try { return JSON.parse(r.stdout); } catch { return null; }
}

function startAi(id) {
  if (!AUTO || running.has(id)) return false;
  const job = readJson(jobFile(id), null);
  if (!job || !job.aiTask) return false;
  const task = job.aiTask;
  // trava: outra sessão (manual ou de outro servidor) já está trabalhando neste job
  const tr = guard.status(id);
  if (tr.locked && !(running.get(id) && running.get(id).pid === tr.pid)) {
    writeJson(jobFile(id), { ...job, aiError: `Job travado por ${tr.dono} (pid ${tr.pid}, desde ${tr.desde}${tr.motivo ? ': ' + tr.motivo : ''}). Termine essa execução ou rode "node editor-studio/tools/job_guard.js unlock ${id}" e dispare de novo.` });
    return false;
  }
  guard.snap(id, `antes-${task}`);
  if (task === 'refs') rodarFerramenta('indice_refs');
  const sid = job.sessionId || crypto.randomUUID();
  const prompt = `Leia editor-studio/WORKFLOW.md e execute a tarefa "${task}" do job ${id} (videos/${id}/job.json). `
    + 'Execute só essa tarefa. Para legenda, recorte e leitura de vídeo use o que ferramentas.json indica. '
    + 'Em refs, use também o índice do banco de referências em referencias/.index/index.json (cada vídeo tem sheet.jpg, cortes e nota). '
    + (task === 'refs' ? '' : escolhasDoEditor(job)
      ? `Escolhas do editor (siga exatamente; valem mais que as notas gerais de referencias/refs.json): ${escolhasDoEditor(job)}. ` : '')
    + (task === 'devolutiva' || task === 'video'
      ? 'Ritmo obrigatório: algo novo entrando a cada 1,5 s, sem intervalos maiores, e hook de 0 a 1 s animado. Entrar não é tirar o anterior: fora a palavra-chave grande, cada peça fica pelo menos 3 s na tela (campos slot e hold da timeline). '
        + 'Vídeo base sempre em tela cheia (para disfarçar corte, aumente; nunca reduza nem ponha cópia desfocada atrás). Margem Meta Ads de motion-studio/qa/safezone.json. '
        + (task === 'devolutiva' ? `Antes de gravar, rode "node editor-studio/tools/check_timeline.js ${id}" e acrescente linhas até passar. ` : '') : '')
    + 'Não gaste créditos da Artlist sem aprovação. Ao terminar, grave o resultado no job.json e zere aiTask. Responda em português do Brasil.';
  const args = ['-p', prompt, job.sessionId ? '--resume' : '--session-id', sid, '--permission-mode', 'acceptEdits',
    '--allowedTools', 'Bash Read Write Edit Glob Grep',
    '--output-format', 'stream-json', '--verbose',
    '--model', modeloDa(task).model, ...(modeloDa(task).effort ? ['--effort', modeloDa(task).effort] : [])];
  const log = fs.openSync(path.join(JOBS, id, 'ai.log'), 'a');
  fs.writeSync(log, `\n=== ${new Date().toISOString()} · tarefa ${task} · ${modeloDa(task).model}${modeloDa(task).effort ? ' (' + modeloDa(task).effort + ')' : ''} · sessão ${sid} ===\n`);
  const child = spawn(CLAUDE_BIN, args, { cwd: REPO, stdio: ['ignore', 'pipe', log], env: { ...process.env, CLAUDE_CODE_SUBAGENT_MODEL: 'claude-sonnet-5-5' } });
  running.set(id, { task, pid: child.pid, since: Date.now(), ...modeloDa(task), steps: 0, now: { texto: 'Abrindo a conversa do Claude', tipo: 'nota', at: Date.now() }, recent: [] });
  child.stdout.setEncoding('utf8');
  lerAndamento(id, child.stdout, log);
  guard.lock(id, `tarefa ${task}`, 'server', child.pid);
  child.on('error', (e) => {
    running.delete(id);
    const j = readJson(jobFile(id), null);
    if (j) writeJson(jobFile(id), { ...j, aiError: e.code === 'ENOENT' ? `Claude Code não encontrado ("${CLAUDE_BIN}"). Instale o Claude Code e faça login, ou defina CLAUDE_BIN.` : `Falha ao abrir o Claude: ${e.message}` });
  });
  writeJson(jobFile(id), { ...readJson(jobFile(id), job), sessionId: sid });
  child.on('close', (code) => {
    running.delete(id);
    fs.writeSync(log, `\n=== fim (código ${code}) ===\n`);
    guard.unlock(id);
    guard.snap(id, `depois-${task}`);
    const j = readJson(jobFile(id), null);
    if (j && j.aiTask === task && code !== 0 && !j.aiError) writeJson(jobFile(id), { ...j, aiError: `A sessão automática terminou com erro (código ${code}). Veja videos/${id}/ai.log` });
    // storyboard: roda as conferências de qualidade e anota no ai.log (não bloqueia; o editor vê no log)
    if (j && task === 'storyboard' && code === 0) {
      for (const [nome, ferr] of [['área segura', 'check_safezone.mjs'], ['texto do storyboard', 'check_storyboard.mjs']]) {
        const r = spawnSync(process.execPath, [path.join(__dirname, 'tools', ferr), id], { encoding: 'utf8', cwd: REPO, timeout: 240000 });
        if (r.status === 1) fs.writeSync(log, `\n=== conferência ${nome}: ${(r.stdout || '').trim().slice(0, 1800)} ===\n`);
      }
    }
    // rede de segurança: a devolutiva só vale se o ritmo do briefing (1,5 s) foi respeitado
    if (j && task === 'devolutiva' && code === 0 && !j.aiError) {
      const r = conferirRitmo(id);
      if (r && !r.ok) {
        const partes = [];
        if (r.lacunas.length) { const pior = r.lacunas.reduce((a, g) => (g.seg > a.seg ? g : a), r.lacunas[0]); partes.push(`${r.lacunas.length} intervalo(s) sem entrada acima de ${r.max} s (maior: ${pior.seg} s entre ${pior.de} e ${pior.ate})`); }
        if ((r.curtas || []).length) partes.push(`${r.curtas.length} peça(s) com menos de ${r.minHold} s na tela (${r.curtas.map((c) => c.id).join(', ')})`);
        if ((r.conflitos || []).length) partes.push(`${r.conflitos.length} conflito(s) de área (${r.conflitos.map((c) => c.por + '→' + c.id).join(', ')})`);
        writeJson(jobFile(id), { ...j, aiError: `Ritmo fora do briefing: ${partes.join('; ')}. Peça nova rodada para corrigir.` });
        fs.writeSync(log, `\n=== conferência de ritmo: ${partes.join('; ')} ===\n`);
      }
    }
  });
  return true;
}


// ---------- player (preview com scrubbing): onda sonora e página ----------
const WAVE_BINS = 1200;
function fonteDeAudio(id) {
  const cand = [`videos/${id}/filme/ae/audio/mix_final.wav`, `videos/${id}/out/final.mp4`, `videos/${id}/out/mix.m4a`];
  const j = readJson(jobFile(id), {});
  if (j.briefing && j.briefing.video) cand.push(String(j.briefing.video));
  return cand.find((c) => fs.existsSync(path.join(REPO, c))) || null;
}
function ondaSonora(id) {
  const src = fonteDeAudio(id);
  if (!src) return { src: null, peaks: [] };
  const cache = path.join(JOBS, id, 'out', 'wave.json');
  const mtime = fs.statSync(path.join(REPO, src)).mtimeMs;
  const c = readJson(cache, null);
  if (c && c.src === src && c.mtime === mtime) return c;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', path.join(REPO, src), '-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) return { src, peaks: [], error: String(r.stderr || '').slice(0, 200) };
  const f = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.byteLength / 4));
  const peaks = new Array(WAVE_BINS).fill(0);
  for (let i = 0; i < f.length; i++) { const b = Math.min(WAVE_BINS - 1, Math.floor(i * WAVE_BINS / f.length)); const v = Math.abs(f[i]); if (v > peaks[b]) peaks[b] = v; }
  const out = { src, mtime, duration: f.length / 8000, peaks: peaks.map((v) => +v.toFixed(3)) };
  try { fs.mkdirSync(path.dirname(cache), { recursive: true }); writeJson(cache, out); } catch {}
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = decodeURIComponent(url.pathname);
  try {
    // ---------- API ----------
    if (p === '/api/jobs' && req.method === 'GET') {
      const list = fs.readdirSync(JOBS).filter((d) => fs.existsSync(jobFile(d))).map((d) => {
        const j = readJson(jobFile(d), {});
        return { id: j.id, title: j.title, stage: j.stage, aiTask: j.aiTask, updatedAt: j.updatedAt };
      }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      return send(res, 200, list);
    }
    if (p === '/api/jobs' && req.method === 'POST') {
      const { title } = await body(req);
      const job = newJob((title || 'Novo vídeo').trim());
      fs.mkdirSync(path.join(JOBS, job.id, 'uploads'), { recursive: true });
      writeJson(jobFile(job.id), job);
      return send(res, 201, job);
    }
    let m = p.match(/^\/api\/jobs\/([^/]+)\/ai$/);
    if (m) {
      const id = safeId(m[1]);
      if (!id || !fs.existsSync(jobFile(id))) return send(res, 404, { error: 'job não encontrado' });
      if (req.method === 'POST') return send(res, 200, { started: startAi(id) });
      const j = readJson(jobFile(id), {});
      return send(res, 200, { auto: AUTO, running: running.get(id) || null, plano: j.aiTask ? modeloDa(j.aiTask) : null, sessionId: j.sessionId || null, aiError: j.aiError || null });
    }
    m = p.match(/^\/api\/jobs\/([^/]+)\/hist$/);
    if (m) {
      const id = safeId(m[1]);
      if (!id || !fs.existsSync(jobFile(id))) return send(res, 404, { error: 'job não encontrado' });
      if (req.method === 'POST') { const { arquivo } = await body(req); return send(res, 200, { restored: guard.restore(id, String(arquivo || '0')) || null }); }
      return send(res, 200, { snapshots: guard.list(id).reverse(), lock: guard.status(id) });
    }
    m = p.match(/^\/api\/jobs\/([^/]+)\/wave$/);
    if (m) {
      const id = safeId(m[1]);
      if (!id || !fs.existsSync(jobFile(id))) return send(res, 404, { error: 'job não encontrado' });
      return send(res, 200, ondaSonora(id));
    }
    // margem de segurança do job (motion-studio/qa/safezone.json, perfil de briefing.margem)
    m = p.match(/^\/api\/jobs\/([^/]+)\/safezone$/);
    if (m) {
      const id = safeId(m[1]);
      if (!id || !fs.existsSync(jobFile(id))) return send(res, 404, { error: 'job não encontrado' });
      const sz = readJson(path.join(REPO, 'motion-studio', 'qa', 'safezone.json'), null);
      if (!sz) return send(res, 200, null);
      const want = (readJson(jobFile(id), {}).briefing || {}).margem;
      const perfil = sz.perfis[want] ? want : sz.padrao;
      return send(res, 200, { perfil, ...sz.perfis[perfil] });
    }
    if (p === '/api/refs-index') return send(res, 200, readJson(path.join(REFS, '.index', 'index.json'), { items: [] }));
    if (p === '/api/ferramentas') return send(res, 200, readJson(TOOLS_FILE, { encaixes: {} }));
    m = p.match(/^\/api\/jobs\/([^/]+)$/);
    if (m) {
      const id = safeId(m[1]);
      if (!id || !fs.existsSync(jobFile(id))) return send(res, 404, { error: 'job não encontrado' });
      if (req.method === 'GET') return send(res, 200, readJson(jobFile(id), {}));
      if (req.method === 'PATCH') {
        // mescla só as chaves de topo enviadas, para não pisar no que o Claude escreveu
        const patch = await body(req);
        const job = { ...readJson(jobFile(id), {}), ...patch, id, updatedAt: new Date().toISOString() };
        if (patch.aiTask) delete job.aiError;
        if (patch.stage || patch.aiTask) guard.snap(id, patch.aiTask ? `pedido-${patch.aiTask}` : `etapa-${patch.stage}`);
        writeJson(jobFile(id), job);
        if (patch.aiTask) startAi(id);
        return send(res, 200, job);
      }
      if (req.method === 'DELETE') {
        fs.rmSync(path.join(JOBS, id), { recursive: true, force: true });
        return send(res, 200, { ok: true });
      }
    }
    if (p === '/api/refs') {
      if (req.method === 'GET') return send(res, 200, readJson(REFS_FILE, EMPTY_REFS));
      if (req.method === 'PUT') { writeJson(REFS_FILE, await body(req)); return send(res, 200, { ok: true }); }
    }
    if (p === '/api/upload' && req.method === 'POST') {
      // ?scope=job&id=<jobId>  ou  ?scope=refs&cat=edicao|lettering|motion   &name=arquivo.ext
      const name = path.basename(url.searchParams.get('name') || 'arquivo').replace(/[^\w.\- ()]/g, '_');
      const scope = url.searchParams.get('scope');
      let dir, rel;
      if (scope === 'job') {
        const id = safeId(url.searchParams.get('id') || '');
        if (!id) return send(res, 400, { error: 'id inválido' });
        dir = path.join(JOBS, id, 'uploads'); rel = `videos/${id}/uploads/${name}`;
      } else if (scope === 'refs') {
        const cat = ['edicao', 'lettering', 'motion'].includes(url.searchParams.get('cat')) ? url.searchParams.get('cat') : null;
        if (!cat) return send(res, 400, { error: 'categoria inválida' });
        dir = path.join(REFS, cat); rel = `referencias/${cat}/${name}`;
      } else return send(res, 400, { error: 'scope inválido' });
      fs.mkdirSync(dir, { recursive: true });
      const out = fs.createWriteStream(path.join(dir, name));
      req.pipe(out);
      out.on('finish', () => send(res, 200, { path: rel, name }));
      out.on('error', (e) => send(res, 500, { error: e.message }));
      return;
    }

    // ---------- arquivos de videos/ e referencias/ (com suporte a Range para vídeo) ----------
    if (p.startsWith('/files/')) {
      const file = path.normalize(path.join(REPO, p.slice(7)));
      if (![JOBS, REFS, PLIB].some((d) => file.startsWith(d + path.sep)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'não encontrado', 'text/plain');
      const size = fs.statSync(file).size;
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const range = req.headers.range && req.headers.range.match(/bytes=(\d*)-(\d*)/);
      if (range) {
        const start = range[1] ? parseInt(range[1], 10) : 0;
        const end = range[2] ? parseInt(range[2], 10) : size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
      return fs.createReadStream(file).pipe(res);
    }

    // ---------- player: /player/<id> ----------
    m = p.match(/^\/player\/([^/]+)\/?$/);
    if (m) {
      if (!safeId(m[1]) || !fs.existsSync(jobFile(m[1]))) return send(res, 404, 'job não encontrado', 'text/plain');
      return send(res, 200, fs.readFileSync(path.join(ROOT, 'player.html')), 'text/html; charset=utf-8');
    }

    // ---------- interface ----------
    if (p === '/' || p === '/index.html') {
      return send(res, 200, fs.readFileSync(path.join(ROOT, 'index.html')), 'text/html; charset=utf-8');
    }
    send(res, 404, 'não encontrado', 'text/plain');
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`Editor Studio em http://localhost:${PORT}`));
