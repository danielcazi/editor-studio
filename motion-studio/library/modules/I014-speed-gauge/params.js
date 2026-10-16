/* I014 Medidor Speed 99/100 — tudo que muda entre versões. look: A (Medidor no peito) | B (Boletim) | C (Antes e depois).
   bg: quadro do vídeo só para o still A (no render final fica null e o fundo é transparente).
   Números do "antes" e das métricas extras são ilustrativos: trocar pelos reais antes do render final. */
window.PARAMS = {
  look: 'A',
  bg: 'assets/frame.jpg',
  score: 99, max: 100,
  label: 'Speed · celular',
  headline: 'Nota da página',
  extras: [{ n: 'Acessibilidade', v: 96 }, { n: 'Boas práticas', v: 100 }, { n: 'SEO', v: 100 }],
  before: { name: 'Página com plugins', v: 41 },
  after: { name: 'Insula Build', v: 99 },
  timing: { in: 0.05, fill: [0.2, 1.1] },
  fps: 30,
  duration: 1.6,
};
