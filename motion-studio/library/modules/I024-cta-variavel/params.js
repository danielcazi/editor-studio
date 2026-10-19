/* I024 CTA variável — fechamento com oferta, botão clicado e, se urgency.on, contagem regressiva. Substitui M08/M18/M23 quando só mudam textos.
   look A: roxo | B: noite com acento. urgency.from em segundos. */
window.PARAMS = {
  look: 'A', logo: 'Insula', kicker: 'Oferta de lançamento', headline: '7 dias\ngrátis.', sub: 'Sem cartão. Cancele quando quiser.', button: 'Começar agora',
  badge: 'vagas limitadas', urgency: { on: true, label: 'Termina em', from: 3 * 3600 + 25 * 60 + 9, to: 3 * 3600 + 25 * 60 }, clickAt: 1.9, duration: 3,
};
