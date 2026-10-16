/* I007 Relatório sem a linha que importa — tudo que muda entre versões. look: A (Planilha) | B (Busca no relatório) | C (Recibo).
   bg: quadro do vídeo só para os stills (no render final fica null e o fundo é transparente). Números ilustrativos. */
window.PARAMS = {
  look: 'B',
  bg: 'assets/frame.jpg',
  title: ['nenhum', 'relatório'],
  month: 'Relatório de outubro',
  rows: [['Visitas ao site', '1.284'], ['Seguidores novos', '+312'], ['Curtidas', '4.870'], ['Alcance', '38 mil']],
  missing: 'Pacientes que desistiram',
  /* tempos relativos ao início: digitação da busca e a resposta "0 resultados" */
  timing: { type: [.25, .8], result: .92 },
  fps: 30,
  duration: 1.44,
};
