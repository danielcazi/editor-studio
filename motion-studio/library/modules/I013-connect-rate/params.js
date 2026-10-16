/* I013 Connect rate no Gerenciador — tudo que muda entre versões. look: A (Tabela no peito) | B (Funil de perda) | C (Coluna em destaque).
   bg: quadro do vídeo só para o still A (no render final fica null e o fundo é transparente).
   Números ilustrativos: trocar pelos de um cliente real antes do render final. */
window.PARAMS = {
  look: 'A',
  bg: 'assets/frame.jpg',
  title: 'connect rate',
  panel: 'Gerenciador de Anúncios',
  clicks: { label: 'Cliques no link', value: 1000 },
  views: { label: 'Visualizações da página', value: 612 },
  rate: { label: 'Connect rate', suffix: '%' },
  headline: 'Pagou 1.000 cliques.\nChegaram 612.',
  timing: { in: 0.05, count: [0.15, 0.55], rate: 0.6 },
  fps: 30,
  duration: 1.4,
};
