# Editor Studio · contrato de trabalho do Claude

A interface (`index.html` + `server.js`) guarda cada vídeo numa pasta própria, `videos/<id>/` na raiz do projeto, com o estado em `videos/<id>/job.json`.
Quando o editor aprova um portão, a interface define `stage` e `aiTask` com a tarefa pendente.
O Claude executa **só essa tarefa**, grava o resultado no `job.json` e zera `aiTask` (`null`).
A interface atualiza sozinha. Nunca avance de etapa por conta própria: quem muda `stage` é o editor.

**Onde o editor decide:** na interface local (`node editor-studio/server.js`, http://localhost:4173). Ela grava direto no `job.json`; não há painel publicado nem banco em nuvem. O Claude lê e escreve só o `job.json` deste job.

Proteções do job (`editor-studio/tools/job_guard.js`): cada execução trava `videos/<id>/.lock` (não rode uma tarefa à mão enquanto o servidor executa a mesma: `job_guard.js status <id>`) e o servidor guarda snapshots do `job.json` em `videos/<id>/.hist/` (`job_guard.js list|restore <id>`).

Fluxo: `envio` (editor) → `refs` → `devolutiva` → `stills` (só se houver peça nova aprovada) → `storyboard` → `video`.
Em cada portão a IA propõe e o editor aprova, passa ou pede nova rodada (`revisionNote`).

Regras gerais
- Responda e escreva textos em português do Brasil.
- Edite o `job.json` com cuidado: leia, altere só as chaves da tarefa, grave. Mantenha `id`, `title`, `briefing` e tudo o que o editor escolheu.
- Atualize `updatedAt` e acrescente uma linha em `log` (`{ "at": ISO, "task": "...", "msg": "..." }`).
- Tudo de um vídeo fica em `videos/<id>/`: `uploads/` (o que o editor mandou), `out/` (o que você entrega: imagens, MP4, .aep), `filme/` (o filme em HTML e o material de trabalho) e `ai.log`. Caminhos gravados no job são relativos à raiz do projeto (ex.: `videos/<id>/out/still-r4-A.jpg`).
- **Ferramentas:** legenda, recorte de pessoa, leitura de vídeo, índice de referências e render vêm de `ferramentas.json` (raiz). Use o encaixe indicado ali (`tipo: script` → rode o `cmd`; `tipo: skill` → use a skill com esse nome) e entregue a saída descrita em `contrato`. Não chame os scripts pelo nome direto.
- Mostre pouco e bem escolhido: no máximo 3 opções por pergunta. A biblioteca inteira nunca vai para a tela.
- Fontes de repertório, nesta ordem: `referencias/refs.json` + `referencias/<cat>/` e o índice `referencias/.index/index.json` (repertório do editor, na raiz) e a biblioteca de motion `motion-studio/library/library.json` (módulos M## com miniaturas em `library/thumbs/`).
- Confira visualmente toda imagem antes de gravar no job.

## Tarefa `refs` (portão 1)

Entrada: `briefing`, repertório do editor, biblioteca, `revisionNote` se houver.

1. Leia o briefing e a legenda; olhe 6 a 10 quadros do vídeo (encaixe `leitura`).
2. Para cada eixo (`edicao`, `lettering`, `motion`) escolha **3 opções** que façam sentido para este vídeo, vindas do repertório ou da biblioteca. Marque uma como `rec: true` (a sua sugestão). Antes de escolher, liste **todo** o conteúdo de `referencias/<cat>/` e de `refs.json` (nenhum item pode ficar de fora por falha de leitura) e use só o que existe nesses arquivos.
3. Cada opção precisa de uma imagem em `out/` (miniatura do módulo, quadro de um vídeo já feito ou still rápido), 4:5 ou 9:16, ~400 px de largura.
4. Grave:
```json
"refOptions": { "edicao": [ { "id": "e1", "title": "Cortes secos + punch-in", "why": "uma frase sobre por que serve aqui", "img": "videos/<id>/out/ref-e1.jpg", "source": "M09 ou caminho da ref", "rec": true } ], "lettering": [...], "motion": [...] }
```
5. Não preencha `refPick`: quem escolhe é o editor. Se o editor subiu a própria referência, ela está em `refUploads[eixo]` e `refPick[eixo] === "own"`.

## Tarefa `devolutiva` (portão 2)

Entrada: briefing, `refPick` (+ `refOptions`/`refUploads` para saber o que foi escolhido), `revisionNote`.

1. Legenda: se houver `.srt` em `briefing.legenda`, use os tempos dele. Senão transcreva com o encaixe `legenda` de `ferramentas.json` (palavras com tempo).
2. Escreva `devolutiva`: `resumo` (2–3 frases) e `edicao`, `lettering`, `motion` (a definição concreta de cada eixo a partir da referência escolhida).
3. Escreva `timeline`: uma linha por momento que recebe tratamento (em geral 8 a 12 num vídeo de 1 min). Para cada momento consulte a biblioteca: se um módulo resolve trocando só os `vars`, use `kind: "lib"`; se nada serve, `kind: "new"` (no máximo 3 novas) e registre a ideia em `motion-studio/library/ideas.json` com o `catalogCheck`.
```json
{ "id": "r4", "at": "0:15", "t": 15.38, "line": "frase exata", "what": "o que entra na tela", "piece": { "kind": "lib", "ref": "M09", "name": "Palavra-chave" }, "status": "ok", "note": "" }
```
   `status` começa em `"ok"` (proposta aprovada por padrão); o editor passa o que não quer.
4. Ritmo obrigatório: o briefing pede **algo novo entrando** a cada 1,5 s. Nenhum intervalo sem entrada pode passar de 1,5 s, do início ao fim. O hook (0 a 1 s) é animado e usa a referência do Meta quando o briefing pedir.
   Entrar não é tirar o anterior: cada linha diz quanto a peça fica na tela com `hold` (segundos) e que tipo de peça é com `slot` (`"palavra"` = palavra-chave grande, `"painel"` = cartão/painel/UI, `"objeto"` = objeto 3D ou ícone; outro nome vale como peça comum).
   - `slot: "palavra"` pode durar só até a próxima palavra-chave (mín. 1,2 s).
   - Todo o resto fica **≥ 3 s** (`hold` ≥ 3). Se a peça serve à fala seguinte, estique para 3 a 4 s e deixe a linha seguinte entrar em outro slot, convivendo com ela.
   - Duas peças do mesmo slot não se sobrepõem: a nova só entra quando a anterior já cumpriu o mínimo.
   - Enquanto um painel está na tela, as entradas de 1,5 s podem ser dentro dele (linha que acende, número, chip, clique: linha com `"dentro": "<id do painel>"`, sem slot nem hold) ou um objeto ao lado.
   - Cortina e flash usam `slot: "transicao"` (contam como entrada e não precisam ficar 3 s).
   ```json
   { "id": "r9", "t": 10.5, "line": "...", "what": "...", "slot": "painel", "hold": 4, "piece": { ... } }
   ```
   Antes de gravar, rode `node editor-studio/tools/check_timeline.js <id>`: ele confere as entradas (≤ 1,5 s), o `hold` mínimo e o conflito de slots. Acrescente ou estique linhas até ele passar (o servidor roda a mesma conferência ao fim da tarefa e avisa o editor se sobrar problema).
5. Em nova rodada, mantenha as linhas e notas que o editor não pediu para mudar.
5. Não gere imagem nem vídeo nesta etapa.

## Tarefa `stills` (portão 3)

Entrada: linhas da `timeline` com `status: "ok"` e `piece.kind: "new"`, mais as notas.

Para cada uma, desenhe 3 direções realmente diferentes como imagem estática, na referência escolhida, dentro da margem Meta Ads de `motion-studio/qa/safezone.json` (9:16: x 65–1015, y 270–1248). Construa cada peça como módulo reutilizável a partir de `motion-studio/library/_template/` (`params.js` com tudo que muda). Grave:
```json
{ "rowId": "r4", "title": "Painel no escuro", "line": "frase", "pick": null, "note": "",
  "options": [ { "key": "A", "name": "Cartões", "desc": "uma linha", "file": "videos/<id>/out/still-r4-A.jpg" } ] }
```

## Tarefa `storyboard` (portão 4)

Entrada: timeline aprovada, stills escolhidos (`pick`), notas, e `storyboard.flags` quando for uma rodada de ajuste.

1. Monte o filme da edição em `videos/<id>/filme/` (vídeo base; se precisar recortar a pessoa, use o encaixe `recorte` + peças da biblioteca + peças novas com o look escolhido). Anime as peças novas a partir do still escolhido e catalogue-as na biblioteca.
   - **Tela cheia:** o vídeo base cobre o quadro inteiro (escala ≥ 1). Variação entre cortes é punch-in (aumentar), nunca reduzir; sem cópia desfocada atrás e sem máscara nas bordas. O recorte da pessoa sai em 1:1 e recebe a mesma escala do vídeo.
   - **Permanência:** cada peça vive de `t` até `t + hold` da sua linha (não só até a linha seguinte). O filme desenha todas as peças vivas no instante, cada uma na sua área. Exponha `window.SCENES = [{ id, a, b }]` com `b = t + hold`.
   - **Margem:** tudo dentro de `motion-studio/qa/safezone.json` (padrão Meta Ads: x 65–1015, y 270–1248).
2. Renderize **um quadro por linha aprovada da timeline**, no momento mais representativo, mais o primeiro e o último quadro. Dê nota ao conjunto (leitura no celular, sobreposição, marca, ritmo) e corrija antes de mostrar. Rode antes de gravar: `node editor-studio/tools/check_safezone.mjs <id>` (texto sobre cabeça/rosto ou fora da área segura, com sugestão de deslocamento), `node editor-studio/tools/check_storyboard.mjs <id>` (texto suspeito como "−0%", NaN, número fora de `dados.json`) e `node editor-studio/tools/check_timeline.js <id>` (ritmo e frases repetidas). Rode também o encaixe `qa` (`ferramentas.json`) nos quadros do storyboard: corrija todo `erro` de `out/qa.json` e cite os `aviso` que ficarem na nota ao editor. Números do filme vêm de `videos/<id>/dados.json` (`node editor-studio/tools/dados.mjs <id> init|build|check`); os que não estão no briefing ficam com `"ilustrativo": true`.
3. Grave:
```json
"storyboard": { "round": 1, "frames": [ { "id": "r4", "at": "0:17", "t": 17.0, "label": "Painel no escuro", "file": "videos/<id>/out/sb-1-r4.jpg", "w": 1080, "h": 1920 } ], "flags": {} }
```
4. Rodada de ajuste: `flags` traz `{ idDoQuadro: "o que mudar" }`. Corrija só esses momentos, renderize de novo só esses quadros, incremente `round` e zere `flags`.

## Tarefa `video` (entrega)

Entrada: storyboard aprovado.

0. Aplique a escolha do editor: lettering e motion seguem exatamente `refPick.lettering` e `refPick.motion` (o estilo da referência escolhida, nunca o padrão do filme). Quando as notas gerais de `referencias/refs.json` (ex.: "Inter 800", "cards planos") conflitarem com a escolha, vale a escolha. Confira no quadro de cada eixo antes de gravar. Mantenha a mudança visual a cada 1,5 s (regra da devolutiva).
1. Exporte as camadas do filme (vídeo base, palavras-chave, cada peça) em sequências PNG com alfa (encaixe `render` com `--query layer=...`; se houver um vídeo já entregue em `videos/*/filme/ae/`, siga o mesmo formato).
2. Monte a comp **híbrida** do After Effects com o encaixe `aep` de `ferramentas.json` (`node editor-studio/tools/ae/make_jsx.mjs <id> --aep videos/<id>/out/<nome>.aep`). Antes, exporte as camadas: `node motion-studio/render.mjs videos/<id>/filme --w 1080 --h 1920 --type jpeg --query layer=base --frames videos/<id>/filme/ae/V/base` e o mesmo com `layer=bg|person|gfx` (PNG). O gerador amostra cada cena quadro a quadro e decide peça por peça:
   - **nativa** (texto e caixas 2D): camadas de texto e shape layers presas a um null com keyframes de posição, escala, rotação e opacidade iguais aos do HTML; sombra vira Drop Shadow. Editável.
   - **clipe** (3D, gradiente, SVG, filtro ou conteúdo que muda por dentro): ProRes 4444 com alfa em `filme/ae/V/clips/`, idêntico ao MP4.
   Para isso o filme segue o contrato do cabeçalho de `make_jsx.mjs`: cada peça é um filho direto de `#s-<id>` e anima a si mesma (entrada e saída no próprio elemento); `window.SCENES` com `b = t + hold`. Abra o `ae_report.json` e informe no `notes` quais peças são clipes (e por quê) e as **fontes que faltam** (`fontes_faltando`: o After troca a fonte em silêncio; peça ao editor para instalar antes). Rode o `run.jsx` no After só com autorização do editor (ele abre um projeto novo), salve o `.aep` em `out/` e confira 2 ou 3 quadros com `aerender` contra o MP4. Se o After não estiver disponível, renderize pelo `render.mjs` e avise em `notes`.
3. Áudio: `node editor-studio/tools/mix_audio.mjs <id> [--trilha f] [--sfx f]` (voz + trilha com sidechain + SFX, dois passes de loudnorm em -14 LUFS; confira o LUFS impresso).
4. Grave `video`: `{ "status": "done", "file": "videos/<id>/out/final.mp4", "aep": "videos/<id>/out/<nome>.aep", "notes": "o que foi feito e o que checar" }`.
5. Opcional, se o editor pedir: `node editor-studio/tools/export_formats.mjs <id> --formatos 4x5,1x1` (cortes do 9:16) e `node editor-studio/tools/ae/pack_aep.mjs <id> --copy` (projeto do After sem links para outros jobs).
6. Ajustes pós-entrega chegam em `revisionNote` por minutagem: corrija só aqueles trechos.

## Rodando

```bash
node editor-studio/server.js     # http://localhost:4173
```
No Claude Code, o botão "Copiar comando" da interface já traz a frase para colar.
