/* I002 Responsive Morph — a mesma página muda de Desktop → Laptop → Tablet → Celular, o layout se reorganiza e o rótulo troca.
   steps[].w/h em px dentro de uma moldura de 940 de largura. look A: sobre creme | B: sobre noite. */
window.PARAMS = {
  look: 'A',
  steps: [{ nome: 'Desktop', w: 940, h: 560, cols: 3 }, { nome: 'Laptop', w: 780, h: 500, cols: 3 }, { nome: 'Tablet', w: 560, h: 740, cols: 2 }, { nome: 'Celular', w: 340, h: 700, cols: 1 }],
  hold: 0.55, move: 0.45, duration: 2.6,
};
