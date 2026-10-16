#!/bin/bash
# Monta o pacote portátil (pasta + .zip) a partir deste projeto. Rode de qualquer lugar:
#   bash editor-studio/kit/make-kit.sh
# Leva só o que é código, biblioteca, skills e exemplos leves. Não leva vídeos, jobs, frames, node_modules nem .venv.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$HERE/../.." && pwd)"
OUT="$SRC/dist/insula-edit-kit"
ZIP="$SRC/dist/insula-edit-kit-$(date +%Y%m%d).zip"
rm -rf "$OUT"; mkdir -p "$OUT"

# 1) editor-studio: servidor, interface, contrato e ferramentas
rsync -a --exclude node_modules --exclude .venv --exclude __pycache__ --exclude .DS_Store \
  --exclude 'kit/' --exclude 'SPEC-CONTEXTO.md' --exclude 'tools/vision_cutout' \
  "$SRC/editor-studio/" "$OUT/editor-studio/"
# raiz: um vídeo por pasta em videos/, banco de referências em referencias/, encaixes em ferramentas.json
mkdir -p "$OUT/videos" "$OUT/referencias/edicao" "$OUT/referencias/lettering" "$OUT/referencias/motion"
touch "$OUT/videos/.gitkeep" "$OUT/referencias/edicao/.gitkeep" "$OUT/referencias/lettering/.gitkeep" "$OUT/referencias/motion/.gitkeep"
cp "$SRC/referencias/LEIA-ME.md" "$OUT/referencias/"
cp "$SRC/referencias/refs.json" "$OUT/referencias/" 2>/dev/null || true
cp "$SRC/ferramentas.json" "$OUT/"

# 2) motion-studio: motor de render, regras, biblioteca de módulos e skills
M="$SRC/motion-studio"; D="$OUT/motion-studio"; mkdir -p "$D"
cp "$M/render.mjs" "$M/package.json" "$M/package-lock.json" "$M/CLAUDE.md" "$M/skills-lock.json" "$D/"
rsync -a --exclude .DS_Store --exclude 'out/' "$M/library/" "$D/library/"
rsync -a "$M/.agents/" "$D/.agents/"
mkdir -p "$D/.claude" && cp -a "$M/.claude/skills" "$D/.claude/skills"   # links relativos -> .agents/skills

# 3) exemplos leves (já versionados em motion-studio/exemplos)
rsync -a --exclude .DS_Store "$M/exemplos/" "$D/exemplos/"

# 4) arquivos da raiz (instalação, guia, regras)
cp "$SRC/install.sh" "$SRC/doctor.sh" "$SRC/start.sh" "$SRC/INSTALAR.md" "$SRC/FLUXO.html" "$SRC/CLAUDE.md" "$SRC/.gitignore" "$OUT/"
mkdir -p "$OUT/.claude"
cat > "$OUT/.claude/launch.json" <<'JSON'
{ "version": "0.0.1", "configurations": [
  { "name": "editor-studio", "runtimeExecutable": "node", "runtimeArgs": ["editor-studio/server.js"], "port": 4173 },
  { "name": "motion-library", "runtimeExecutable": "python3", "runtimeArgs": ["-m", "http.server", "4180", "--bind", "127.0.0.1", "--directory", "motion-studio/library"], "port": 4180 } ] }
JSON
chmod +x "$OUT"/*.sh "$OUT/editor-studio/kit" 2>/dev/null || true

# 5) neste pacote não existe o painel publicado: o editor decide na interface local
python3 - "$OUT/editor-studio/WORKFLOW.md" <<'PY'
import sys,re
p=sys.argv[1]; s=open(p).read()
a=s.index("**Onde o editor decide:**"); b=s.index("Fluxo: `envio`")
s=s[:a]+"**Onde o editor decide:** na interface local (`node editor-studio/server.js`, http://localhost:4173). Ela grava direto no `job.json`; não há painel publicado nem banco em nuvem. O Claude lê e escreve só o `job.json` deste job.\n\n"+s[b:]
s=re.sub(r"\n- Fontes de repertório, nesta ordem:","\n- Fontes de repertório, nesta ordem:",s)
open(p,'w').write(s)
PY

# 6) limpeza e zip
find "$OUT" -name .DS_Store -delete
rm -f "$ZIP"; (cd "$SRC/dist" && zip -qr "$ZIP" insula-edit-kit)
echo "Pacote: $OUT"; du -sh "$OUT"; echo "Zip: $ZIP"; du -sh "$ZIP"
