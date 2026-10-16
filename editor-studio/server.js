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
const running = new Map(); // jobId -> { task, pid, since }

// ferramentas.json: cada encaixe (legenda, recorte, leitura, indice_refs) diz qual script ou skill usar
const ferramenta = (nome) => (readJson(TOOLS_FILE, {}).encaixes || {})[nome] || null;
function rodarFerramenta(nome, vars = {}) {
  const f = ferramenta(nome);
  if (!f || f.tipo !== 'script' || !f.cmd) return false;
  const cmd = f.cmd.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? JSON.stringify(String(vars[k])) : `{${k}}`));
  spawnSync('/bin/sh', ['-c', cmd], { cwd: REPO, stdio: 'ignore' });
  return true;
}

function startAi(id) {
  if (!AUTO || running.has(id)) return false;
  const job = readJson(jobFile(id), null);
  if (!job || !job.aiTask) return false;
  const task = job.aiTask;
  if (task === 'refs') rodarFerramenta('indice_refs');
  const sid = job.sessionId || crypto.randomUUID();
  const prompt = `Leia editor-studio/WORKFLOW.md e execute a tarefa "${task}" do job ${id} (videos/${id}/job.json). `
    + 'Execute só essa tarefa. Para legenda, recorte e leitura de vídeo use o que ferramentas.json indica. '
    + 'Em refs, use também o índice do banco de referências em referencias/.index/index.json (cada vídeo tem sheet.jpg, cortes e nota). '
    + 'Não gaste créditos da Artlist sem aprovação. Ao terminar, grave o resultado no job.json e zere aiTask. Responda em português do Brasil.';
  const args = ['-p', prompt, job.sessionId ? '--resume' : '--session-id', sid, '--permission-mode', 'acceptEdits',
    '--allowedTools', 'Bash Read Write Edit Glob Grep',
    // etapas de proposta em Sonnet 5.5; só a montagem do vídeo usa Opus 5.5 em esforço médio
    '--model', task === 'video' ? 'claude-opus-5-5' : 'claude-sonnet-5-5', ...(task === 'video' ? ['--effort', 'medium'] : [])];
  const log = fs.openSync(path.join(JOBS, id, 'ai.log'), 'a');
  fs.writeSync(log, `\n=== ${new Date().toISOString()} · tarefa ${task} · sessão ${sid} ===\n`);
  const child = spawn(CLAUDE_BIN, args, { cwd: REPO, stdio: ['ignore', log, log], env: { ...process.env, CLAUDE_CODE_SUBAGENT_MODEL: 'claude-sonnet-5-5' } });
  running.set(id, { task, pid: child.pid, since: Date.now() });
  child.on('error', (e) => {
    running.delete(id);
    const j = readJson(jobFile(id), null);
    if (j) writeJson(jobFile(id), { ...j, aiError: e.code === 'ENOENT' ? `Claude Code não encontrado ("${CLAUDE_BIN}"). Instale o Claude Code e faça login, ou defina CLAUDE_BIN.` : `Falha ao abrir o Claude: ${e.message}` });
  });
  writeJson(jobFile(id), { ...readJson(jobFile(id), job), sessionId: sid });
  child.on('close', (code) => {
    running.delete(id);
    fs.writeSync(log, `\n=== fim (código ${code}) ===\n`);
    const j = readJson(jobFile(id), null);
    if (j && j.aiTask === task && code !== 0 && !j.aiError) writeJson(jobFile(id), { ...j, aiError: `A sessão automática terminou com erro (código ${code}). Veja videos/${id}/ai.log` });
  });
  return true;
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
      return send(res, 200, { auto: AUTO, running: running.get(id) || null, sessionId: j.sessionId || null, aiError: j.aiError || null });
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
      if (![JOBS, REFS].some((d) => file.startsWith(d + path.sep)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'não encontrado', 'text/plain');
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
