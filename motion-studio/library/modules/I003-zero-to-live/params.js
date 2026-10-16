/* I003 Zero to Live — tudo que muda entre versões. look: A (Linha do tempo) | B (Cronômetro) | C (Pilha).
   Tempos ilustrativos: confirmar com o tempo real de uma geração antes do render final. */
window.PARAMS = {
  look: 'B',
  headline: ['Do zero ao ar', 'em 4 minutos.'],
  total: '3:58', big: '4 min',
  steps: [
    { t: '0:00', label: 'Prompt' },
    { t: '0:40', label: 'Página gerada' },
    { t: '2:10', label: 'Ajustes' },
    { t: '3:30', label: 'Publicar' },
    { t: '3:58', label: 'No ar' },
  ],
  prompt: 'Crie uma landing page para minha clínica de estética em São Paulo',
  url: 'lumiereestetica.com.br',
  timing: { run: [.15, 3.2], gen: 1.0 },
  duration: 4.3,
};
