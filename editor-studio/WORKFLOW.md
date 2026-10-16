# Editor Studio · contrato de trabalho do Claude

A interface (`index.html` + `server.js`) guarda cada vídeo numa pasta própria, `videos/<id>/` na raiz do projeto, com o estado em `videos/<id>/job.json`.
Quando o editor aprova um portão, a interface define `stage` e `aiTask` com a tarefa pendente.
O Claude executa **só essa tarefa**, grava o resultado no `job.json` e zera `aiTask` (`null`).
A interface atualiza sozinha. Nunca avance de etapa por conta própria: quem muda `stage` é o editor.

**Onde o editor decide:** no painel publicado "Fluxo de Edição Ínsula" (https://claude.ai/artifact/6nSUUA6Ngo6AmJJAoE5zz5), não no localhost.
O painel guarda cada job no banco do artifact, documento `jobs/<id>` (mesmas chaves do `job.json`; imagens são ids de asset do artifact).
Quando o editor disser "segue": leia `jobs/<id>` com `ArtifactData get`, copie as escolhas (`refPick`, `timeline`, `stills[].pick`, notas, `storyboard.flags`, `revisionNote`, `stage`, `aiTask`) para o `job.json`, execute a tarefa, suba as imagens novas com `Artifact` (`asset: true`) e grave o resultado de volta no documento (`ArtifactData update` com `if_version`, `aiTask: null`).
O `editor-studio` local continua sendo o motor e o arquivo de trabalho.

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
2. Para cada eixo (`edicao`, `lettering`, `motion`) escolha **3 opções** que façam sentido para este vídeo, vindas do repertório ou da biblioteca. Marque uma como `rec: true` (a sua sugestão).
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
4. Em nova rodada, mantenha as linhas e notas que o editor não pediu para mudar.
5. Não gere imagem nem vídeo nesta etapa.

## Tarefa `stills` (portão 3)

Entrada: linhas da `timeline` com `status: "ok"` e `piece.kind: "new"`, mais as notas.

Para cada uma, desenhe 3 direções realmente diferentes como imagem estática, na referência escolhida, dentro da área segura (9:16: tudo entre y 230 e 1520). Construa cada peça como módulo reutilizável a partir de `motion-studio/library/_template/` (`params.js` com tudo que muda). Grave:
```json
{ "rowId": "r4", "title": "Painel no escuro", "line": "frase", "pick": null, "note": "",
  "options": [ { "key": "A", "name": "Cartões", "desc": "uma linha", "file": "videos/<id>/out/still-r4-A.jpg" } ] }
```

## Tarefa `storyboard` (portão 4)

Entrada: timeline aprovada, stills escolhidos (`pick`), notas, e `storyboard.flags` quando for uma rodada de ajuste.

1. Monte o filme da edição em `videos/<id>/filme/` (vídeo base; se precisar recortar a pessoa, use o encaixe `recorte` + peças da biblioteca + peças novas com o look escolhido). Anime as peças novas a partir do still escolhido e catalogue-as na biblioteca.
2. Renderize **um quadro por linha aprovada da timeline**, no momento mais representativo, mais o primeiro e o último quadro. Dê nota ao conjunto (leitura no celular, sobreposição, marca, ritmo) e corrija antes de mostrar.
3. Grave:
```json
"storyboard": { "round": 1, "frames": [ { "id": "r4", "at": "0:17", "t": 17.0, "label": "Painel no escuro", "file": "videos/<id>/out/sb-1-r4.jpg", "w": 1080, "h": 1920 } ], "flags": {} }
```
4. Rodada de ajuste: `flags` traz `{ idDoQuadro: "o que mudar" }`. Corrija só esses momentos, renderize de novo só esses quadros, incremente `round` e zere `flags`.

## Tarefa `video` (entrega)

Entrada: storyboard aprovado.

1. Exporte as camadas do filme (vídeo base, palavras-chave, cada peça) em sequências PNG com alfa (encaixe `render` com `--query layer=...`; se houver um vídeo já entregue em `videos/*/filme/ae/`, siga o mesmo formato).
2. Monte a comp no After Effects por JSX (textos como camadas de texto nativas sempre que possível), salve o `.aep` em `out/` e renderize o MP4. Se o After não estiver disponível, renderize pelo `render.mjs` e avise em `notes`.
3. Áudio: voz original + trilha (se houver, bem abaixo da voz, com sidechain) + SFX sintetizados, -14 LUFS.
4. Grave `video`: `{ "status": "done", "file": "videos/<id>/out/final.mp4", "aep": "videos/<id>/out/<nome>.aep", "notes": "o que foi feito e o que checar" }`.
5. Ajustes pós-entrega chegam em `revisionNote` por minutagem: corrija só aqueles trechos.

## Rodando

```bash
node editor-studio/server.js     # http://localhost:4173
```
No Claude Code, o botão "Copiar comando" da interface já traz a frase para colar.
