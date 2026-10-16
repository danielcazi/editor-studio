#!/bin/bash
# Sobe o Editor Studio. Variáveis opcionais: PORT=4173  AUTO_AI=0 (desliga a conversa automática)  CLAUDE_BIN=/caminho/claude  CHROME_PATH=...
cd "$(cd "$(dirname "$0")" && pwd)"
[ -d editor-studio/tools/node_modules ] || { echo "Rode antes: bash install.sh"; exit 1; }
URL="http://localhost:${PORT:-4173}"
( sleep 1; (open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true) ) &
echo "Editor Studio em $URL  (Ctrl+C para parar)"
exec node editor-studio/server.js
