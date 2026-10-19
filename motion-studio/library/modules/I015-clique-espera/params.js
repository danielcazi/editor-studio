/* I015 Clique que espera a página — tudo que muda entre versões. look: A (Anúncio → página carregando) | B (Cronômetro no escuro) | C (Duas telas).
   bg: quadro do vídeo só para o still A (no render final fica null e o fundo é transparente). Tempo de espera ilustrativo. */
window.PARAMS = {
  look: 'A',
  bg: 'assets/frame.jpg',
  headline: ['clicou.', 'e esperou.'],
  highlight: 'clicou.',
  url: 'suapagina.com.br',
  cta: 'Saiba mais',
  wait: 3.2,
  caption: 'o clique já foi pago',
  timing: { in: 0.05, click: 0.6, load: [0.7, 2.4] },
  fps: 30,
  duration: 3.0,
};
