/* I005 Painel no escuro — tudo que muda entre versões. look: A (Cartões) | B (Painel) | C (Lanterna).
   state: 0 = no escuro ("?"), 1 = aceso com o dado. bg: quadro do vídeo só para os stills (no render final fica null e o fundo é transparente).
   Números ilustrativos: trocar pelos de um cliente real antes do render final. */
window.PARAMS = {
  look: 'A', state: 1, mode: 'reveal',
  bg: 'assets/frame.jpg',
  period: 'Últimos 30 dias',
  metrics: [
    { q: 'Quem entrou?', label: 'Visitas', value: '1.284', short: '1.284 pessoas' },
    { q: 'De onde veio?', label: 'Origem', value: 'Google 62%', short: '62% do Google' },
    { q: 'Clicou no WhatsApp?', label: 'Cliques no WhatsApp', value: '87', short: '87 no WhatsApp', wa: true },
  ],
  /* tempos relativos ao início do módulo. dark: at = quando cada pergunta é dita.
     reveal: ga4 = selo vira GA4; at = quando cada número é dito. */
  timing: { dark: { at: [.7, 1.75, 3.05], dur: 4.25 }, reveal: { ga4: .15, at: [3.2, 4.45, 5.5], dur: 6.9 } },
  fps: 30,
  duration: 6.9,
};
