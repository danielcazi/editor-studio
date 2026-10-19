// Trava e histórico do job.json. Usado pelo server.js e por linha de comando.
//   node editor-studio/tools/job_guard.js lock <id> [motivo]      tenta travar (sai 1 se já houver trava viva)
//   node editor-studio/tools/job_guard.js unlock <id>
//   node editor-studio/tools/job_guard.js status <id>
//   node editor-studio/tools/job_guard.js snap <id> [rótulo]      guarda uma cópia de job.json em videos/<id>/.hist/
//   node editor-studio/tools/job_guard.js list <id>
//   node editor-studio/tools/job_guard.js restore <id> <arquivo|n>   volta o job.json (guarda antes um snapshot "antes-restore")
// A trava (videos/<id>/.lock) guarda pid, dono e motivo; trava de processo morto é descartada sozinha.
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const dirOf = (id) => path.join(REPO, 'videos', id);
const lockFile = (id) => path.join(dirOf(id), '.lock');
const histDir = (id) => path.join(dirOf(id), '.hist');
const vivo = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

function status(id) {
  try {
    const l = JSON.parse(fs.readFileSync(lockFile(id), 'utf8'));
    if (l.pid && vivo(l.pid)) return { locked: true, ...l };
    fs.rmSync(lockFile(id), { force: true });
  } catch { /* sem trava */ }
  return { locked: false };
}
function lock(id, motivo = '', dono = 'manual', pid = process.pid) {
  const s = status(id);
  if (s.locked) return { ok: false, ...s };
  fs.writeFileSync(lockFile(id), JSON.stringify({ pid, dono, motivo, desde: new Date().toISOString() }));
  return { ok: true };
}
const unlock = (id) => fs.rmSync(lockFile(id), { force: true });

function snap(id, rotulo = 'manual') {
  const src = path.join(dirOf(id), 'job.json');
  if (!fs.existsSync(src)) return null;
  fs.mkdirSync(histDir(id), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(histDir(id), `${stamp}_${String(rotulo).replace(/[^\w-]+/g, '_').slice(0, 30)}.json`);
  // não duplica se for igual ao último snapshot
  const files = fs.readdirSync(histDir(id)).filter((f) => f.endsWith('.json')).sort();
  const atual = fs.readFileSync(src, 'utf8');
  if (files.length && fs.readFileSync(path.join(histDir(id), files[files.length - 1]), 'utf8') === atual) return null;
  fs.writeFileSync(dest, atual);
  for (const f of files.slice(0, Math.max(0, files.length + 1 - 60))) fs.rmSync(path.join(histDir(id), f), { force: true }); // guarda os 60 últimos
  return dest;
}
const list = (id) => (fs.existsSync(histDir(id)) ? fs.readdirSync(histDir(id)).filter((f) => f.endsWith('.json')).sort() : []);
function restore(id, quem) {
  const files = list(id);
  const f = /^\d+$/.test(quem) ? files[files.length - 1 - Number(quem)] : files.find((x) => x === quem);
  if (!f) return false;
  snap(id, 'antes-restore');
  fs.copyFileSync(path.join(histDir(id), f), path.join(dirOf(id), 'job.json'));
  return f;
}

module.exports = { status, lock, unlock, snap, list, restore };

if (require.main === module) {
  const [cmd, id, ...rest] = process.argv.slice(2);
  if (!cmd || !id) { console.error('uso: job_guard.js lock|unlock|status|snap|list|restore <id> [..]'); process.exit(2); }
  if (cmd === 'lock') { const r = lock(id, rest.join(' ')); console.log(r.ok ? 'travado' : `já travado por ${r.dono} (pid ${r.pid}) desde ${r.desde}: ${r.motivo}`); process.exit(r.ok ? 0 : 1); }
  if (cmd === 'unlock') { unlock(id); console.log('liberado'); }
  if (cmd === 'status') { const s = status(id); console.log(s.locked ? `travado por ${s.dono} (pid ${s.pid}) desde ${s.desde}: ${s.motivo}` : 'livre'); process.exit(s.locked ? 1 : 0); }
  if (cmd === 'snap') { const d = snap(id, rest[0]); console.log(d ? `snapshot ${path.basename(d)}` : 'sem mudanças desde o último snapshot'); }
  if (cmd === 'list') list(id).forEach((f, i, a) => console.log(`${a.length - 1 - i}  ${f}`));
  if (cmd === 'restore') { const f = restore(id, rest[0] || '0'); console.log(f ? `job.json restaurado de ${f}` : 'snapshot não encontrado'); process.exit(f ? 0 : 1); }
}
