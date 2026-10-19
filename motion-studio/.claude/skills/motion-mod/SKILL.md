---
name: motion-mod
description: Motion mod do Cazi — propõe, desenha e cataloga motion graphics reutilizáveis. Use quando o usuário pedir ideias de motion para um vídeo, mandar um vídeo/roteiro para editar, salvar uma inspiração (reel, print, link), pedir um gráfico novo ("faz um motion que mostre X"), aprovar/passar ideias do log, escolher um still, pedir nova versão de um módulo com outros textos/números, ou perguntar "o que tem na biblioteca". Também ao editar qualquer vídeo em motion-studio: antes de desenhar uma cena, consulte a biblioteca.
---

# Motion mod

Um sistema com três arquivos em `motion-studio/library/`:

- `library.json`: o catálogo. Cada módulo tem `id` (M01…), `what`, `vars` (o que muda para reusar), `source` (filme e função), `thumb` (filme, viewport, tempo) e `uses`.
- `ideas.json`: o idea log. Toda ideia tem a fala exata, a checagem contra o catálogo e um status.
- `gallery.html`: a galeria, gerada por `node library/build.mjs` (miniaturas que faltam + página). Rode depois de qualquer mudança nos dois JSON. Abrir: `open library/gallery.html` no navegador do sistema, ou, no painel do app, pelo servidor `motion-library` de `.claude/launch.json` (http://localhost:4180/gallery.html). O painel não abre o arquivo direto: a cópia estática dele recusa arquivos acima de ~1 MB e fica presa na versão antiga.

Regra central: **o usuário só diz sim ou não.** Você propõe, ele aprova ou passa, ele escolhe o still. Nada é animado sem `pick`, e nada é construído sem `approved`.

Responda sempre em português do Brasil.

**Como plugin:** se esta skill veio do plugin `editor-studio`, os caminhos `motion-studio/library/…` ficam em `${CLAUDE_PLUGIN_ROOT}/motion-studio/library/…`, que é somente leitura. Consultar o catálogo e reusar módulos funciona; registrar ideias, construir e catalogar (`ideas.json`, `library.json`, `build.mjs`) exige o clone completo do projeto. Diga isso ao usuário em vez de tentar gravar dentro do plugin.

## O loop

```
vídeo, inspo ou pedido → checa o catálogo → registra a ideia → APROVA OU PASSA
→ 3 stills → ESCOLHE UM → constrói em código → confere o render → entra na biblioteca
```

### 1. Entrada (três fontes)

- **Vídeo que ele grava** (`source.type: "video"`): transcreva com timestamps de palavra (mlx-whisper num venv; veja a memória do pipeline) e leia a transcrição procurando momentos em que um gráfico explicaria melhor do que a fala sozinha: números, comparações antes/depois, sequências, processos, listas, promessas de tempo ou de quantidade.
- **Inspiração que ele salva** (`"inspo"`): reel, vídeo ou print. Extraia frames com ffmpeg, descreva o movimento (o que entra, como, em que ritmo) e o que dá para adaptar à marca dele.
- **Pedido direto** (`"request"`): ele descreve o que quer.

### 2. Checa o catálogo

Leia `library.json` inteiro antes de propor. Para cada momento candidato, pergunte: algum módulo já resolve, trocando só `vars`?

- Se resolve: **não é ideia nova.** Proponha reusar (ex.: "0:22 cabe no M05 Cards de números com 97 → 60") e siga para a montagem.
- Se não resolve: escreva em uma frase **por que nenhum serve**, citando os módulos mais próximos pelo id. Essa frase vai em `catalogCheck`. Sem ela, a ideia não entra no log.

### 3. Registra no idea log

Acrescente em `ideas.json` (próximo id `I00n`):

```json
{ "id": "I004", "title": "Scan Trail", "date": "AAAA-MM-DD",
  "source": { "type": "video", "ref": "nome do vídeo", "at": "0:22" },
  "line": "frase exata que ele disse",
  "catalogCheck": "M05 só mostra um número agregado; nada mostra um marcador descendo ao longo de cinco medidas.",
  "why": "o que o gráfico faz que a fala não faz",
  "status": "pending", "note": "", "stills": [], "pick": null, "builtAs": null }
```

No máximo 3 ideias novas por vídeo. Rode `node library/build.mjs`.

### 4. Pitch: aprova ou passa

Mostre cada ideia nova como um card curto: título, timestamp, a fala, o `catalogCheck`, o `why`. Pergunte uma ideia por vez ou todas numa lista, mas a resposta é só **aprova / passa** (mais uma nota opcional). Grave `status: "approved"` ou `"passed"` e a nota em `note`. Ideia passada nunca volta sozinha.

### 5. Três stills antes de animar

Para cada ideia aprovada, desenhe **3 direções visuais diferentes** como imagens estáticas, sem animar nada. As três têm que divergir de verdade (ex.: escura com pontilhado, papel claro tipo planilha, verde chapado com número gigante), todas na marca dele e dentro da área segura.

- Faça cada direção como um módulo a partir de `library/_template/` em `library/modules/<id-ideia>-<slug>-<A|B|C>/` e capture o quadro-chave com `node render.mjs <pasta> --sheet 1 --step <t> --type jpeg`, ou monte uma folha lado a lado.
- Olhe cada PNG antes de mostrar. Grave em `stills`: `{ "key": "A", "name": "Dotted Descent", "desc": "…", "file": "modules/…/still.jpg" }` e mude o status para `"stills"`.
- Mostre as três lado a lado com nome e uma linha cada. Ele escolhe uma (ou pede todas). Grave `pick` (`"A"`, ou `["A","B","C"]`) e as notas dele em `note`; status `"picked"`.

### 6. Constrói em código, reutilizável

- Parta de `library/_template/`: `params.js` guarda **tudo** que muda entre versões (textos, números, datas, cores). `film.js` só lê `PARAMS`. Uma versão nova é `--query "p=<base64url do JSON>"` ou um preset novo, nunca uma cópia do código.
- Siga o `CLAUDE.md` do motion-studio (função pura do tempo, seeded noise, nada de setTimeout/transition) e as notas do usuário à risca: se ele disse "o lockup não pode ficar embaixo, a UI cobre", isso vira regra de layout no código.
- Layout pelo viewport: o mesmo módulo renderiza 9:16 e 16:9 quando fizer sentido.
- Se ele escolheu as três direções, um motor só com `look: "A" | "B" | "C"` em `PARAMS`.

### 7. Confere o próprio render

Antes de mostrar: renderize uma folha de contato (`--sheet 1 --step 0.5`) e olhe. Dê nota 1–10 para leitura no celular, qualidade do movimento, fidelidade ao still escolhido e à marca, e respeito às notas dele. Corrija os 3 piores pontos e repita até tudo ficar em 8+. Só então o render completo (`render.mjs` + ffmpeg H.264 yuv420p CRF 16). Mostre a folha final junto com o vídeo.

### 8. Entra na biblioteca

Acrescente o módulo em `library.json` (próximo `M##`), com `reuse: "parametrizado"`, `source.film` apontando para a pasta em `library/modules/…`, `vars` = as chaves de `PARAMS`, `thumb` com o tempo do quadro mais representativo, e `uses`. No log: `status: "built"`, `builtAs: "M24"`. Rode `node library/build.mjs` e diga que a galeria foi atualizada.

## Modo reuso

Quando ele pedir "uma versão com outros números", "usa aquele gráfico de novo" ou quando você estiver montando um vídeo:

1. Procure no catálogo pelo `what`/`vars`. Se houver mais de um candidato, mostre os dois com as miniaturas e deixe ele escolher.
2. Módulo `parametrizado`: renderize com os novos `PARAMS`. Módulo legado (`copiar e adaptar`): copie a função indicada em `source.fn` do filme de origem para o filme novo e troque os `vars`.
3. Acrescente o vídeo novo em `uses` e rode o build.

## Outros usos

O mesmo loop serve para qualquer coisa que ele refaça sempre (decks de venda, templates de e-mail, criativos de anúncio, propostas): troque "módulo de motion" por "peça", mantenha catálogo + log + aprova/passa + 3 opções + build reutilizável + autochecagem. Proponha uma biblioteca separada (`library-<tipo>/`) em vez de misturar.

## Integração com o editor-studio

`../editor-studio/` já faz o funil por vídeo (ideias → stills → vídeo) dentro de `data/jobs/<id>/job.json`. Quando trabalhar num job de lá, espelhe cada ideia no `ideas.json` com `source.job` apontando para o job, e consulte `library.json` antes de escrever as ideias do job.
