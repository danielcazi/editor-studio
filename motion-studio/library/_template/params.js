/* Parâmetros padrão do módulo. Uma versão nova = outro conjunto de valores, sem mexer no film.js:
   node render.mjs library/modules/<pasta> --query "p=<base64url do JSON>"  (ou edite aqui e salve como preset). */
window.PARAMS = {
  headline: 'O dado mexeu primeiro.',
  from: 97, to: 60, suffix: '%',
  caption: 'cinco exames',
  colors: { bg: '#0b0b0a', ink: '#f1efe8', acc: '#e8f23a', mute: '#8d8a80' },
  duration: 4,
  // captionAt: { beat: 2 },   // entra na batida 2 (precisa de beats: <conteúdo do beats.json>); número = segundos
  // beats: null,
};
