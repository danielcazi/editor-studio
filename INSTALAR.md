# Editor Studio · instalar e usar em outro computador

Um fluxo para editar vídeo curto com o Claude, com o editor aprovando em cada etapa:

**envio → banco de referências → devolutiva → stills → storyboard → vídeo final**

Você manda o vídeo, a legenda (.srt) e o briefing. O Claude propõe, você aprova, e só então ele avança. Cada vídeo abre **uma conversa própria** do Claude instalado na sua máquina, automaticamente.

---

## 1. O que você precisa ter

| Programa | Para quê | Como instalar (macOS) |
|---|---|---|
| **Claude Code** | É o "cérebro". O servidor abre uma conversa dele por vídeo | https://claude.com/claude-code e depois rode `claude` uma vez e faça login |
| **Node.js 18+** | Servidor, render e ferramentas | `brew install node` |
| **Python 3.10+** | Áudio (SFX), transcrição, stills | `brew install python` |
| **ffmpeg** (com ffprobe) | Cortar, mixar e codificar vídeo | `brew install ffmpeg` |
| **Google Chrome** | Desenha stills e quadros em tela cheia | https://www.google.com/chrome |
| After Effects *(opcional)* | Entregar o `.aep` com camadas editáveis. Só macOS | Sem ele, o vídeo sai em MP4 pelo render do projeto |

Sem Homebrew: https://brew.sh. No Linux, use o gerenciador de pacotes da distribuição (os caminhos do Chrome são detectados). Windows não foi testado.

Precisa de internet na hora de renderizar: as fontes (Inter, JetBrains Mono, Comfortaa, Instrument Serif) vêm do Google Fonts. Para o After Effects usar os textos nativos, instale a fonte **Inter** no sistema.

## 2. Instalar

Pegue o projeto pelo GitHub (ou descompacte o pacote `insula-edit-kit`, se recebeu o zip) e rode o instalador na pasta dele:

```bash
git clone <URL do repositório> videos-claude
cd videos-claude
bash install.sh          # completo (~1,5 GB: inclui transcrição e recorte de fundo)
# ou
bash install.sh --leve   # sem faster-whisper e rembg (use se o vídeo sempre vier com .srt e você não recorta a pessoa)
```

O script confere os programas, instala as dependências de Node e Python, baixa o navegador do render e cria as pastas de trabalho. No fim roda o diagnóstico. Se faltar algo, ele diz o comando exato.

Para conferir a qualquer momento:

```bash
bash doctor.sh            # diagnóstico
bash doctor.sh --claude   # também testa a conexão com o Claude (gasta pouquíssimos tokens)
```

## 3. Usar

```bash
bash start.sh             # abre http://localhost:4173
```

1. **Envio:** crie o vídeo com "+" na lateral, suba o MP4, o `.srt` (opcional: trilha) e escreva o briefing. Clique em *Enviar e pedir referências à IA*.
2. O servidor **abre sozinho uma conversa do Claude** para esse vídeo. A tela diz "uma conversa do Claude foi aberta" e atualiza quando ela termina.
3. **Banco de ref:** escolha 1 opção por eixo (edição, lettering, motion) ou suba a sua. Aprove.
4. **Devolutiva:** uma linha por momento do vídeo. Aprove ou "passe" cada linha, deixe notas. Aprove.
5. **Stills:** só para as peças novas. Escolha uma de 3 direções. Aprove.
6. **Storyboard:** um quadro por momento. Marque o que quer mudar ou clique em *Pode renderizar*.
7. **Vídeo:** o Claude monta e entrega `final.mp4` (e o `.aep`, se tiver After). Ajustes depois da entrega: escreva por minutagem.

Tudo de cada vídeo fica numa pasta só, `videos/<nome>/` (`job.json`, `uploads/`, `out/` com o `final.mp4`, `filme/` com o material de trabalho, `ai.log`).

### Banco de referências
Solte vídeos **MP4** em `referencias/edicao`, `lettering` ou `motion` (na raiz). Um `.txt` com o mesmo nome e 1 ou 2 linhas ("por que gosto disso") ajuda a curadoria. O índice é refeito sozinho antes de cada etapa de referências. Use MP4, não sequência de PNG: é leve e o índice (folha de contato, cortes por minuto) faz o resto.

## 4. Como o Claude se conecta

O `server.js` chama o comando `claude` **da própria máquina**, com a sua conta e o seu login. Nada passa por outro servidor.

- 1ª tarefa do vídeo: cria uma sessão (`--session-id`). As seguintes **retomam a mesma conversa** (`--resume`).
- Etapas de proposta rodam em **Sonnet 5.5**, e subagentes também. Só a etapa *vídeo* roda em **Opus 5.5, esforço médio**. Para trocar, edite a linha `--model` em `editor-studio/server.js`.
- Permissões da conversa automática: modo `acceptEdits` e só as ferramentas Bash, Read, Write, Edit, Glob e Grep. Ela não acessa conectores (Artlist, etc.) e não gasta créditos sem você aprovar.
- O que ela fez fica em `videos/<id>/ai.log`. Se der erro, a tela mostra o aviso.

Variáveis opcionais ao subir: `AUTO_AI=0 bash start.sh` (desliga a conversa automática; a tela passa a mostrar o comando para colar à mão), `CLAUDE_BIN=/caminho/claude`, `CHROME_PATH=/caminho/chrome`, `PORT=4180`.

## 5. Mapa das pastas

```
videos-claude/   (ou insula-edit-kit/, no zip)
├─ INSTALAR.md · FLUXO.html       este guia e o fluxo visual (abra o FLUXO.html no navegador)
├─ install.sh · doctor.sh · start.sh
├─ CLAUDE.md                     regras que o Claude lê em toda conversa
├─ ferramentas.json              qual script ou skill faz legenda, recorte, leitura, índice e render
├─ videos/<nome>/                um vídeo por pasta: job.json, uploads/, out/, filme/, ai.log
├─ referencias/                  SEU banco de referências (MP4 em edicao/, lettering/, motion/)
├─ editor-studio/
│  ├─ server.js · index.html     a interface e o servidor local
│  ├─ WORKFLOW.md                contrato de cada tarefa (refs, devolutiva, stills, storyboard, video)
│  └─ tools/                     índice de referências, stills, render, transcrição, recorte (+ .venv e node_modules)
└─ motion-studio/
   ├─ CLAUDE.md · render.mjs     regras e motor de render (filme = função do tempo)
   ├─ library/                   catálogo de módulos de motion (library.json, ideas.json, thumbs, galeria)
   ├─ .agents/skills · .claude/skills   skills (motion-mod, hyperframes e outras)
   └─ exemplos/                  ads-03 (filme completo + mix de áudio) e 04-cazi-after (camadas e JSX do After)
```

## 6. Se algo falhar

| Sintoma | Causa provável e solução |
|---|---|
| "Claude Code não encontrado" na tela | `claude` fora do PATH. Instale ou use `CLAUDE_BIN=...`. Teste com `bash doctor.sh --claude` |
| A conversa abre e termina com erro | Faça login rodando `claude` uma vez no terminal. Veja `videos/<id>/ai.log` |
| "Chrome não encontrado" | Instale o Chrome ou defina `CHROME_PATH` |
| Porta 4173 ocupada | Já há um servidor rodando. Pare-o ou use `PORT=4180 bash start.sh` |
| Vídeo sai com fonte errada | Sem internet (Google Fonts) ou sem Inter instalada |
| Quero outra ferramenta de legenda/recorte | Edite o encaixe em `ferramentas.json` (há alternativas prontas dentro dele) e rode `bash doctor.sh` |
| Sem `.aep` | After Effects ausente ou macOS não é o sistema. O MP4 sai normalmente |

## 7. O que o repositório (e o pacote) NÃO leva

- Seus vídeos, jobs antigos, frames e renders (pesados, ficam na máquina original).
- O painel publicado no claude.ai: ele é preso à sua conta. Aqui você decide na interface local.
- Suas memórias e preferências do Claude e os conectores (Artlist, Meta, ClickUp...): reconecte no Claude Code da nova máquina se precisar.
- A assinatura/login do Claude Code: cada máquina faz o seu.

## 8. Atualizar

Pelo GitHub: na máquina original, `git commit` e `git push`; nas outras, `git pull`. Vídeos e referências continuam fora do git (ver `.gitignore`).

Para gerar o zip, para quem não usa git:

```bash
bash editor-studio/kit/make-kit.sh     # gera dist/insula-edit-kit-AAAAMMDD.zip
```
