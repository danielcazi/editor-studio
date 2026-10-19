# Motion studio rules

## Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame t.
- No CSS transitions, no setTimeout, no requestAnimationFrame in render mode,
  no state carried between frames. Seeded noise only (mulberry32), never Math.random.
- Render with `node render.mjs`, encode H.264 yuv420p, CRF 16.

## Look
- Banned defaults: centered title on gradient, everything fading in,
  corner labels and frame borders, glow on UI chrome, generic particle bursts.
- One display face, one UI face. One accent color unless the brief says otherwise.
- Every 2 to 4 seconds something new must happen on screen.

## Regras do editor (valem sobre qualquer padrão acima)
- **Tela cheia.** O vídeo base (`#rig`) cobre sempre o quadro inteiro: escala ≥ 1,0, sem cópia desfocada atrás e sem máscara nas bordas.
  Para disfarçar corte com escala, **aumente** (punch-in 1,0 → 1,15+), mesmo que corte as bordas ou perca um pouco de nitidez. Nunca reduza.
  O recorte da pessoa (`#person`) acompanha a mesma escala do vídeo base (o recorte sai em 1:1, sem redução). `qa/check.mjs` dá erro (`tela-cheia`) se não for assim.
- **Margem.** Texto e peças dentro de `qa/safezone.json` (padrão Meta Ads: x 65–1015, y 270–1248). Texto fora é erro no `qa`.
- **Tempo na tela.** Cartões, painéis, objetos 3D e textos de apoio ficam **≥ 3 s** na tela. Só a palavra-chave grande pode trocar a cada 1,5 s.
  Se a peça tem a ver com a fala seguinte, ela **continua** (3 a 4 s, atravessando a linha seguinte) em vez de sair e entrar outra.
  O ritmo de 1,5 s conta **entradas** de coisas novas, não saídas: o novo pode conviver com o anterior (timeline: `slot` palavra/painel/objeto e `hold` em segundos).

## Sound
- Score and SFX are synthesized in code unless a track is supplied.
- Place hits on the measured beat grid (beats.json). Loudness -14 LUFS.
- Supplied track: measure it with `node lib/build-beats.mjs <audio> --out beats.json`, load `lib/beatgrid.js`
  in the film and write times as `{beat: n}` / `{bar: n, beat: b}` / `{drop: n}` (`BeatGrid.from(json).resolve(spec, fps)`).
  `qa/check.mjs` warns about SFX and scenes more than one frame off the beat when beats.json exists.

## Loop before you show me anything
1. Render one frame per beat as a contact sheet and LOOK at it.
2. Score it 1-10 on: hook in first 2s, readability at phone size,
   motion quality, variety, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+.
   Run `node qa/check.mjs <filmDir> --times id:t,...` first: it must report 0 errors
   (title over face, wrong font, zero/animating numbers, repeated phrases).
4. Only then do the full render.

## Library (motion mod)
- Before designing any scene, read `library/library.json`: reuse a module if one fits.
- New graphics follow the `motion-mod` skill: idea log → approve/pass → 3 stills → pick → build from `library/_template/` → self-check → catalog.
- After changing `library.json` or `ideas.json`, run `node library/build.mjs` (gallery: `library/gallery.html`).

## Módulos novos (M35–M43) e kit
- Construídos sobre `library/_shared/kit.js` (`window.KIT`): `?look=B`, `?bg=1` (fundo de preview; sem ele o render sai com alfa), `?t=1.2`, `?p=<base64url JSON>`.
- Números vêm de `dados.json` do job via `KIT.dado(chave, padrão)` (o filme inclui `dados.js` gerado por `editor-studio/tools/dados.mjs`). Nunca digite número solto no film.js de um job.
- Antes de entregar um filme: `check_safezone`, `check_storyboard`, `check_timeline` (ver `editor-studio/WORKFLOW.md`).
- Catalogar módulo novo: `node library/catalog.mjs` (mostra) e `--write` (grava e gera miniatura).
