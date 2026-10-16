/* I006 Três páginas que o Google lê — tudo que muda entre versões. look: A (Leque) | B (Resultado) | C (Raio-x).
   bg: quadro do vídeo só para os stills (no render final fica null e o fundo é transparente). Cliente de exemplo fictício. */
window.PARAMS = {
  look: 'B',
  bg: 'assets/frame.jpg',
  brand: 'Dra. Ana Lima · Odontologia',
  domain: 'draanalima.com.br',
  query: 'dentista em pinheiros',
  pages: [
    { tag: 'o que faz', path: '/implantes', title: 'Implantes e lentes de contato dental', hi: 'Implantes', text: 'Planejamento digital e implante no mesmo dia.', el: 'h1' },
    { tag: 'o que trata', path: '/tratamentos', title: 'O que tratamos', hi: 'bruxismo, sensibilidade e gengivite', text: 'Tratamos bruxismo, sensibilidade e gengivite.', el: 'ul' },
    { tag: 'onde atende', path: '/contato', title: 'Onde atendemos', hi: 'Pinheiros, São Paulo', text: 'Rua dos Pinheiros, 870 · Pinheiros, São Paulo', el: 'address' },
  ],
  /* tempos relativos ao início do módulo: digitação da busca, resultado sobe, selo "3 páginas", cada link acende (faz, trata, atende) */
  timing: { type: [.15, .9], result: 1.1, tag: 1.5, at: [3.49, 4.15, 4.91] },
  fps: 30,
  duration: 5.3,
};
