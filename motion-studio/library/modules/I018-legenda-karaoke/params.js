/* I018 Legenda karaoke — palavras com tempo (mesmo formato do transcribe.py: { w, s, e }). A palavra falando ganha destaque.
   look A: pílula roxa atrás da palavra ativa | B: só cor + pulo (sem caixa). perPage = palavras por tela. */
window.PARAMS = {
  look: 'A', y: 1290, size: 96, perPage: 4, active: '#6f6fc9', activeInk: '#fff', ink: '#fff', accent: '#f6d44b',
  words: [
    { w: 'Seu', s: 0.0, e: 0.25 }, { w: 'cliente', s: 0.25, e: 0.7 }, { w: 'clicou', s: 0.7, e: 1.15 }, { w: 'no', s: 1.15, e: 1.3 },
    { w: 'anúncio', s: 1.3, e: 1.9 }, { w: 'e', s: 1.9, e: 2.0 }, { w: 'a', s: 2.0, e: 2.1 }, { w: 'página', s: 2.1, e: 2.6 }, { w: 'demorou.', s: 2.6, e: 3.3 },
  ],
  duration: 3.4,
};
