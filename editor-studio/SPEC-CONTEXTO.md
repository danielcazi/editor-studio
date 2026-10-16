# SPEC de contexto — editor-studio + motion mod

> Documento para iniciar uma conversa nova sobre este projeto. Leia inteiro antes de mexer em qualquer coisa. Responda sempre em **pt-BR**.

## 1. O que é o sistema

Fluxo gated de edição de vídeo, em duas partes:

- **motion mod** (`motion-studio/`): biblioteca de módulos de motion (catálogo, idea log, galeria, skill `motion-mod`), motor de render (`render.mjs`, Playwright/Chromium) e skills em `.agents/skills`.
- **editor-studio** (`editor-studio/`): servidor Node sem dependências (`server.js`, porta **4173**) + `index.html`. Cada vídeo é um *job* numa pasta própria, `videos/<id>/` na raiz (job.json, uploads/, out/, filme/, ai.log). Ferramentas trocáveis em `ferramentas.json` (raiz). Material antigo em `arquivo/`. O contrato do fluxo está em `editor-studio/WORKFLOW.md`.

Etapas (cada uma só avança com aprovação do usuário):
`envio → banco de ref → devolutiva → stills → storyboard → vídeo (MP4 e, depois, .aep no After Effects)`

Tarefas de IA do contrato: `refs`, `devolutiva`, `stills`, `storyboard`, `video`.

## 2. Conexão automática com o Claude instalado

Ao entrar numa etapa, o servidor abre uma conversa do `claude` da própria máquina, uma por vídeo, e retoma a mesma nas etapas seguintes.

```
claude -p <prompt> --session-id|--resume <uuid> \
  --permission-mode acceptEdits \
  --allowedTools 'Bash Read Write Edit Glob Grep' \
  --model <modelo> [--effort medium]
```

- Modelos: etapas de proposta em `claude-sonnet-5-5`; tarefa `video` em `claude-opus-5-5` com `--effort medium`. Subagentes sempre Sonnet 5.5 (`CLAUDE_CODE_SUBAGENT_MODEL`).
- Código: `startAi(id)` e o Map `running` em `server.js`; endpoints `/api/jobs/:id/ai` (GET status, POST inicia) e `/api/refs-index`; PATCH com `aiTask` dispara `startAi` e limpa `aiError`.
- Log em `videos/<id>/ai.log` (a saída só aparece quando o processo termina). `aiError` guarda falhas; se o `claude` não existir, a tela mostra o aviso e como corrigir (`CLAUDE_BIN`).
- Na UI: `waitBox(j)` (aviso "uma conversa foi aberta só para este vídeo", com `<details>` "Rodar à mão") e `wireAuto(j)` (consulta o status e dispara o POST se estiver em modo automático e sem erro).
- Antes de `refs`, o servidor roda `tools/index_refs.mjs`.
- Variáveis de ambiente: `PORT`, `CLAUDE_BIN`, `CHROME_PATH`, `AUTO_AI=0` (desliga o disparo automático).

## 3. Banco de referências

Pasta `referencias/` na raiz (subpastas edicao, lettering, motion; ver o `LEIA-ME.md` dela). **Formato: MP4** (não PNG sequencial).

O indexador `tools/index_refs.mjs` usa ffprobe, detecção de cortes (`select='gt(scene,0.12)',showinfo`, lido do stderr) e folha de contato (`fps=1/step,scale=270:-2,tile=6x2`), com cache por assinatura em `referencias/.index/index.json`. Há 2 refs indexadas em `referencias/motion/`. O limiar de cena é 0,12 (0,3 não achava cortes).

## 4. Ferramentas (`editor-studio/tools/`)

- `index_refs.mjs`: indexador de referências.
- `make_stills.py`, `make_stills_916.py`: stills (usam `_find_chrome()` com `CHROME_PATH` e fallbacks).
- `render_video.js`: render do filme em HTML (Chrome do sistema via puppeteer-core, com erro claro se faltar).
- Transcrição (faster-whisper) e recorte (rembg) são opcionais.
- venv em `editor-studio/tools/.venv`, com symlink `.venv` na raiz.

## 5. Pacote portátil

- Fonte do pacote: `editor-studio/kit/` (`make-kit.sh`, `install.sh`, `doctor.sh`, `start.sh`, `CLAUDE.kit.md`, `kit.gitignore`, `INSTALAR.md`).
- Gera `dist/insula-edit-kit/` e `dist/insula-edit-kit-20261016.zip` (~35 MB). Para regerar: `bash editor-studio/kit/make-kit.sh`.
- Uso em outra máquina: `bash install.sh` (modo `--leve` pula transcrição e recorte), `bash start.sh` (abre http://localhost:4173), `bash doctor.sh --claude`.
- Não vão no pacote: vídeos, jobs, frames, renders, memórias, conectores (Artlist, Meta, ClickUp), painel publicado, login do Claude.
- Testado: instalação do zero em pasta limpa (`--leve`), servidor do kit, mensagem de erro sem Claude.
- **Não testado**: tarefa completa com Claude em outra máquina, instalação completa, Windows.
- Requisitos: internet ao renderizar (Google Fonts); `.aep` só com After Effects no macOS (osascript).

## 6. Estado atual

- Job 04 CAZI S-EFX: entregue (`final.mp4`, 54,6 s). O **.aep ficou para o usuário gerar depois**.
- Job Ads 03 (`videos/ads-03-mvab2akf/`): stage `video`, `aiTask` = `video` rodando (Opus 5.5 médio) quando a conversa anterior terminou. Storyboard de 15 quadros aprovado; refs e1/l1/m1; stills r1-A e r6-A; sessionId `6c19913e-cc60-40c7-a010-4bdd49f29065`. Conferir `final.mp4` e as notas do job.
- O servidor ao vivo (porta 4173) pode estar rodando um `server.js` **antigo** (sem `CLAUDE_BIN` nem a mensagem amigável). Reiniciar com `node editor-studio/server.js` **só depois** que o job terminar. Se a porta estiver ocupada (EADDRINUSE), confirme o PID antes de matar.

## 7. Pendências conhecidas

1. Acompanhar a conclusão do vídeo do Ads 03 e reiniciar o servidor.
2. Gerar o `.aep` do 04 CAZI S-EFX quando o usuário pedir.
3. Possível módulo M28 / idea I008 de outra sessão apagado de `motion-studio/library/library.json`: verificar e restaurar.
4. Projeto de After Effects de outra sessão ficou "dirty".
5. Atualizar a memória `fluxo-edicao-painel.md` (lições do vídeo; o AE reutiliza o projeto aberto; parâmetro `?layer=`).
6. Testar o pacote numa segunda máquina de verdade.

## 8. Preferências do usuário (valem sempre)

- Responder em **pt-BR**.
- **Perguntar dúvidas antes** de executar; o usuário prefere responder só sim/não.
- **Artlist: sempre pedir aprovação de custo** antes de gerar.
- O editor decide no painel; cada etapa é aprovada pelo usuário antes de avançar.
- Para pesquisar/automatizar páginas, o usuário já liberou assumir o Chrome (claude-in-chrome).

## 9. Armadilhas de ambiente (macOS / zsh)

- `sed -i ''` (com aspas vazias); não há `fc-list` nem `timeout`.
- zsh não faz word-split em `for k in $var`; use array ou Python.
- Abra `http://localhost:4173`, não `https`.
- Com claude-in-chrome, os `ref` mudam após cada clique: refaça o `find`.
- O classificador de permissões já bloqueou a criação do runner autônomo (`claude -p`); o usuário liberou e adicionou a regra de permissão para `Bash(claude -p ...)` nas configurações dele. Não tente contornar bloqueios.

## 10. Como começar a próxima conversa

1. Leia `editor-studio/WORKFLOW.md`, `editor-studio/server.js` (`startAi`, endpoints) e `editor-studio/index.html` (`waitBox`, `wireAuto`).
2. Descreva a alteração desejada; antes de editar, confirme com o usuário o escopo.
3. Depois de mexer em `server.js`, reinicie o servidor (com o job parado) e regenere o pacote com `bash editor-studio/kit/make-kit.sh` se a mudança deve ir para outras máquinas.

> Transcrição completa da conversa de origem: `/Users/danielcazi/.claude/projects/-Users-danielcazi-Connect-hub-videos-claude/6a6cd0fb-4205-4770-8816-2e3d0228dcbf.jsonl`
