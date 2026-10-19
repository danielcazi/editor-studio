/* Parâmetros do módulo. Troque o efeito por ?look=grain|vignette|grade|blur|chroma|glass (ou PARAMS.look).
   Cada efeito tem a sua entrada em `fx`; mude os números aqui ou por ?p=<base64url do JSON>. */
window.PARAMS = {
  look: 'grade',
  headline: 'Mesmo\nquadro,\nacabamento\ndiferente.',
  sub: 'esquerda: sem efeito · direita: com efeito',
  card: { value: 82, suffix: '%', caption: 'connect rate' },
  labels: { grain: 'grão de filme', vignette: 'vinheta', grade: 'curvas e cor', blur: 'desfoque direcional', chroma: 'aberração cromática', glass: 'vidro fosco' },
  fx: {
    grain: { strength: .6, size: 2, blend: 'overlay' },
    vignette: { amount: .85, size: .4 },
    grade: { contrast: 1.12, saturate: 1.2, temp: .35, curves: { l: [[0, 0], [.25, .17], [.75, .85], [1, 1]], b: [[0, .04], [1, .94]] } },
    blur: { x: 46, y: 0 },
    chroma: { amount: 16, angle: 0 },
    glass: { blur: 30, saturate: 1.6, tint: .16, radius: 44 },
  },
  duration: 4,
};
