---
description: Instala as dependências do Editor Studio (playwright) quando ele roda como plugin
---

O plugin fica em `${CLAUDE_PLUGIN_ROOT}`, que é somente leitura. As ferramentas (`render.mjs`, `qa/check.mjs`, `library/build.mjs`) procuram o playwright em `motion-studio/node_modules`, na pasta atual e em `~/.editor-studio/deps`. Prepare a terceira:

1. Confira o que já existe:
   `node --input-type=module -e "import '${CLAUDE_PLUGIN_ROOT}/motion-studio/lib/pw.mjs'; console.log('playwright ok')"`.
   Se imprimir `playwright ok`, pule para o passo 3.
2. Instale: `mkdir -p ~/.editor-studio/deps && cd ~/.editor-studio/deps && npm init -y >/dev/null && npm install --no-audit --no-fund playwright && npx --yes playwright install chromium`.
3. Confira os programas que o plugin não instala: `node -v` (18+), `ffmpeg -version`, `ffprobe -version`. Se faltar, diga o comando de instalação (`brew install node ffmpeg`).
4. Rode o teste de fumaça numa pasta temporária, nunca dentro do plugin:
   `node ${CLAUDE_PLUGIN_ROOT}/motion-studio/lib/build-beats.mjs --help` deve mostrar o uso.
5. Responda em português, em duas linhas: o que está pronto e o que falta.

Não instale nada dentro de `${CLAUDE_PLUGIN_ROOT}`.
