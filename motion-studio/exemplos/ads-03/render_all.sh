#!/bin/zsh
# Render do filme inteiro e das camadas para o After Effects (rodar depois que o recorte assets/mseq terminar).
set -e
cd "$(dirname "$0")"
print -n "window.MATTES = [" > mattes.js; ls assets/mseq | sed 's/\.png//; s/^0*//' | paste -sd, - | tr -d '\n' >> mattes.js; print "];" >> mattes.js
R=../../../motion-studio/render.mjs
node $R . --w 1080 --h 1920 --type jpeg --frames out/full --workers 6
node $R . --w 1080 --h 1920 --type jpeg --query layer=base --frames ae/V/base --workers 6
for L in bg person gfx; do node $R . --w 1080 --h 1920 --query layer=$L --frames ae/V/$L --workers 6; done
echo TUDO-OK
