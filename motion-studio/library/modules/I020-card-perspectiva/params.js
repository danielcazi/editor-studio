/* I020 Card em perspectiva com realce (referência m3). O card entra inclinado, endireita um pouco e uma linha ganha o realce.
   rows[].v pode vir de dados.json: use { k: 'connect_rate' } no lugar de v. look A: card branco | B: card escuro. */
window.PARAMS = {
  look: 'A', title: 'Gerenciador de anúncios', sub: 'Últimos 7 dias',
  rows: [{ n: 'Cliques no link', v: '1.000' }, { n: 'Visualizações da página', v: '820' }, { n: 'Connect rate', v: '82%' }, { n: 'Custo por clique', v: 'R$ 0,86' }],
  hi: 2, tiltX: 14, tiltY: -16, y: 560, duration: 2.4,
};
