---
name: motion-toolkit
description: Ferramentas do Editor Studio para filmes HTML com window.seek(t). Use ao montar, conferir ou sincronizar um filme de motion: rodar a verificação automática de quadros (título sobre rosto, área segura, número zerado ou animando, fonte errada, frase repetida), medir batida e compasso de uma trilha (BeatGrid), aplicar grão, vinheta, cor, desfoque, aberração cromática ou vidro sem quebrar o render, ou abrir o player com scrubbing e marcação de quadros.
---

# Toolkit do Editor Studio

Raiz do toolkit: `${CLAUDE_PLUGIN_ROOT}`. Se esta skill foi carregada de um clone do projeto, a raiz é a pasta do clone (a que contém `ferramentas.json`). Em modo plugin a pasta é somente leitura: rode tudo a partir do projeto do usuário e grave saídas lá. Se o playwright não for achado, rode `/editor-studio:setup`.

Responda em português do Brasil.

## Contrato do filme

Todo filme é função pura do tempo: `window.seek(t)` pinta o quadro t. Sem transições nem keyframes de CSS, sem `setTimeout` nem `requestAnimationFrame` no render, sem estado entre quadros, só ruído com semente (`mulberry32`, nunca `Math.random`). Expõe `window.DURATION`, `window.FPS`, `window.SFX` e `window.__ready`.

## 1. Verificação automática dos quadros

```bash
node ${CLAUDE_PLUGIN_ROOT}/motion-studio/qa/check.mjs videos/<id>/filme [--times id:t,... | --step N] [--beats beats.json] [--no-fail]
```

Lê os quadros de `storyboard.frames` do `job.json` (ou os instantes de `--times`/`--step`), analisa o DOM de cada um e de novo 0,35 s depois, e grava `videos/<id>/out/qa.json`. Regras:

- `titulo-rosto`: texto atrás da pessoa (erro), texto sobre a cabeça (erro), painel ou texto grande cobrindo a pessoa (aviso).
- `area-segura`: texto (erro) ou painel (aviso) fora da margem de `motion-studio/qa/safezone.json` num quadro 9:16 (padrão Meta Ads: x 65–1015, y 270–1248).
- `tela-cheia`: vídeo base em `#rig` menor que o quadro, com cópia desfocada atrás ou máscara nas bordas (erro).
- `numeros`: sinal com zero ("−0%") é erro; número ainda contando é aviso; `videos/<id>/qa.expect.json` fixa os valores esperados por quadro.
- `fonte`: serifado ou itálico pedido na devolutiva e ausente no filme (erro).
- `frase-repetida`: 4 palavras iguais em quadros diferentes (aviso).
- `batida`: SFX e cenas a mais de um quadro da batida, medido no meio tempo (aviso; só com `beats.json`).

Corrija todo `erro` antes de mostrar o filme; cite cada `aviso` que mantiver. O código de saída é 1 se houver erro (sem `--no-fail`).

## 2. Batida e compasso

```bash
node ${CLAUDE_PLUGIN_ROOT}/motion-studio/lib/build-beats.mjs trilha.mp3 --out videos/<id>/beats.json [--bpm-hint 120] [--beats-per-bar 4]
```

Saída: `bpm`, `beats[]`, `downbeats[]`, `beatSec`, `barSec`, `downbeatSec`, `dropBar`, `dropSec`, `bars[]`. Use a trilha, não a voz. Compasso e drop só são confiáveis em música.

No filme, carregue `motion-studio/lib/beatgrid.js` e escreva tempos como batida:

```js
const GRID = BeatGrid.from(PR.beats);
GRID.resolve({ beat: 8 }, 30);      // também { bar: 3, beat: 1 }, { drop: 0 }, { t: 5.1, snap: 'half' }
GRID.pulse(t, 6)                    // 1 na batida e decai: para escalar um objeto no ritmo
GRID.nearest(t, 'half'); GRID.snap(t, 'beat', 30)
```

## 3. Efeitos seek-safe

`motion-studio/lib/fx.js` (`window.FX`): `grain(host,{t,fps,strength,size,mono,blend})`, `vignette`, `grade(el,{contrast,brightness,saturate,temp,tint,curves})`, `blur(el,{x,y})`, `chroma(el,{amount,angle})`, `glass(el,{blur,saturate,tint,radius})`. Todos dependem só de `t`. Demonstração: `motion-studio/library/modules/E01-fx-acabamento/index.html?look=grain|vignette|grade|blur|chroma|glass`. Não cobre LUT 3D, meio-tom, nitidez nem níveis.

Não use componentes do registry da HyperFrames direto num filme `seek(t)`: eles usam GSAP e keyframes de CSS. Aproveite a ideia e reescreva como função do tempo.

## 4. Player com scrubbing

Só no clone completo (o servidor está em `editor-studio/server.js`): `http://localhost:4173/player/<id>` mostra o filme com onda da trilha, marcas de batida e dos momentos. Espaço toca, ←/→ andam um quadro, Shift ±10, ↑/↓ pulam de momento, F marca o quadro e grava a nota em `storyboard.flags` do job.

## 5. Biblioteca

Antes de desenhar uma cena, leia `motion-studio/library/library.json`. Para criar, aprovar ou catalogar módulos use a skill `motion-mod`.
