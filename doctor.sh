#!/bin/bash
# Diagnóstico: mostra o que está pronto e o que falta. Use  bash doctor.sh --claude  para testar a conexão com o Claude (gasta poucos tokens).
cd "$(cd "$(dirname "$0")" && pwd)"
ok(){ printf "  \033[32m✓\033[0m %s\n" "$1"; }; no(){ printf "  \033[31m✗\033[0m %s\n" "$1"; }; av(){ printf "  \033[33m·\033[0m %s\n" "$1"; }
chk(){ command -v "$1" >/dev/null 2>&1 && ok "$1 $($1 $2 2>&1 | head -1 | cut -c1-40)" || no "$1 não encontrado"; }
echo "Programas";  chk node -v; chk npm -v; chk python3 -V; chk ffmpeg -version; chk claude --version
[ -d editor-studio/tools/node_modules ] && ok "node_modules do editor-studio" || no "falta: bash install.sh"
[ -d motion-studio/node_modules ] && ok "node_modules do motion-studio" || no "falta: bash install.sh"
[ -x editor-studio/tools/.venv/bin/python ] && ok "venv do Python" || no "venv ausente: bash install.sh"
editor-studio/tools/.venv/bin/python -c "import numpy,scipy,PIL" 2>/dev/null && ok "numpy/scipy/pillow" || no "libs de áudio/imagem faltando"
editor-studio/tools/.venv/bin/python -c "import faster_whisper" 2>/dev/null && ok "faster-whisper (transcrição)" || av "faster-whisper ausente (só precisa se o vídeo vier sem .srt)"
editor-studio/tools/.venv/bin/python -c "import rembg" 2>/dev/null && ok "rembg (recorte de fundo)" || av "rembg ausente (só precisa para recortar a pessoa)"
CH="${CHROME_PATH:-}"; for c in "$CH" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "$(command -v google-chrome)" "$(command -v chromium)"; do [ -n "$c" ] && [ -e "$c" ] && CH="$c" && break; done
[ -n "$CH" ] && [ -e "$CH" ] && ok "Chrome: $CH" || no "Chrome não encontrado (defina CHROME_PATH)"
[ -e "/Applications/Adobe After Effects"* ] 2>/dev/null && ok "After Effects (opcional, só macOS)" || av "After Effects não detectado: o vídeo sai em MP4 pelo render.mjs, sem .aep"
{ ls ~/Library/Fonts /Library/Fonts /usr/share/fonts ~/.fonts 2>/dev/null | grep -qi "^Inter" || fc-list 2>/dev/null | grep -qi "Inter"; } && ok "fonte Inter instalada" || av "fonte Inter não instalada (o MP4 usa Google Fonts; o After precisa dela instalada para os textos nativos)"
[ -f editor-studio/server.js ] && ok "server.js" || no "server.js ausente"
ls referencias/{edicao,lettering,motion}/*.mp4 >/dev/null 2>&1 && ok "referências na pasta" || av "banco de referências vazio (coloque MP4 em referencias/)"
echo "Ferramentas (ferramentas.json)"
python3 - <<'PY'
import json, os, shutil
G, R, Y = "\033[32m✓\033[0m", "\033[31m✗\033[0m", "\033[33m·\033[0m"
try: enc = json.load(open('ferramentas.json'))['encaixes']
except Exception as e: print(f"  {R} ferramentas.json ilegível: {e}"); raise SystemExit
for nome, f in enc.items():
    if f.get('tipo') == 'skill':
        achou = any(os.path.isdir(os.path.join(d, f.get('skill', ''))) for d in ('motion-studio/.agents/skills', os.path.expanduser('~/.claude/skills')))
        print(f"  {G if achou else Y} {nome}: skill {f.get('skill')}" + ('' if achou else ' (não achei a pasta da skill)'))
        continue
    exe = (f.get('cmd') or '').split()[0] if f.get('cmd') else ''
    ok = bool(exe) and (os.path.exists(exe) or shutil.which(exe))
    print(f"  {G if ok else R} {nome}: {exe or 'sem cmd'}" + ('' if ok else ' não encontrado'))
PY
if [ "${1:-}" = "--claude" ]; then
  echo "Conexão com o Claude"
  R=$(claude -p "Responda apenas: OK" --model claude-sonnet-5-5 2>&1 | head -3)
  echo "$R" | grep -q "OK" && ok "Claude respondeu (login válido)" || no "Claude não respondeu: $R"
fi
