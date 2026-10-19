#!/bin/bash
# Instala tudo que o Editor Studio precisa nesta máquina. Rode na pasta do kit:  bash install.sh
# Opções:  --leve  pula transcrição (faster-whisper) e recorte de fundo (rembg): ~1 GB a menos.
set -uo pipefail
cd "$(cd "$(dirname "$0")" && pwd)"
LEVE=0; [ "${1:-}" = "--leve" ] && LEVE=1
ok(){ printf "  \033[32m✓\033[0m %s\n" "$1"; }; no(){ printf "  \033[31m✗\033[0m %s\n" "$1"; }
FALTA=0
echo "1/5 Conferindo programas"
need(){ if command -v "$1" >/dev/null 2>&1; then ok "$1"; else no "$1 — $2"; FALTA=1; fi; }
need node    "instale: brew install node   (precisa 18 ou mais)"
need npm     "vem junto com o node"
need python3 "instale: brew install python (precisa 3.10 ou mais)"
need ffmpeg  "instale: brew install ffmpeg"
need ffprobe "vem junto com o ffmpeg"
need claude  "instale o Claude Code: https://claude.com/claude-code  e depois rode 'claude' uma vez para fazer login"
if [ -z "${CHROME_PATH:-}" ] && [ ! -e "/Applications/Google Chrome.app" ] && ! command -v google-chrome >/dev/null && ! command -v chromium >/dev/null; then
  no "Google Chrome — instale o Chrome (ou defina CHROME_PATH com o caminho do executável)"; FALTA=1; else ok "Chrome"; fi
if [ $FALTA -ne 0 ]; then echo; echo "Instale o que falta e rode 'bash install.sh' de novo."; exit 1; fi
NV=$(node -p "process.versions.node.split('.')[0]"); [ "$NV" -ge 18 ] || { no "node $NV é antigo (precisa 18+)"; exit 1; }

echo "2/5 Dependências do editor-studio (node)"
(cd editor-studio/tools && npm install --no-audit --no-fund --silent) && ok "editor-studio/tools" || { no "npm do editor-studio falhou"; exit 1; }
echo "3/5 Dependências do motion-studio (node + navegador de render)"
(cd motion-studio && npm install --no-audit --no-fund --silent && npx --yes playwright install chromium >/dev/null 2>&1) && ok "motion-studio + chromium do playwright" || { no "npm/playwright do motion-studio falhou"; exit 1; }
echo "4/5 Ambiente Python (editor-studio/tools/.venv)"
PY=editor-studio/tools/.venv
[ -d $PY ] || python3 -m venv $PY || { no "não consegui criar o venv"; exit 1; }
$PY/bin/python -m pip install -q --upgrade pip
$PY/bin/python -m pip install -q numpy scipy pillow && ok "numpy, scipy, pillow (mix de áudio e stills)"
if [ $LEVE -eq 0 ]; then
  $PY/bin/python -m pip install -q faster-whisper onnxruntime rembg && ok "faster-whisper (transcrição) e rembg (recorte)" || no "faster-whisper/rembg falharam (rode de novo ou use --leve)"
else ok "modo leve: transcrição e recorte pulados"; fi
[ -e .venv ] || ln -s editor-studio/tools/.venv .venv   # o WORKFLOW e os mix.py usam .venv na raiz
echo "5/5 Pastas de trabalho"
mkdir -p videos referencias/{edicao,lettering,motion}
node editor-studio/tools/index_refs.mjs >/dev/null 2>&1 && ok "índice do banco de referências"
echo; bash doctor.sh
echo; echo "Pronto. Para começar:  bash start.sh   (abre http://localhost:4173)"
echo "Opcional: usar as skills e ferramentas em outro projeto:  /plugin marketplace add $(pwd)   e   /plugin install editor-studio@editor-studio"
