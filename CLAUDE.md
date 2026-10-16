# Editor Studio · regras do projeto (lidas pelo Claude em toda conversa)

- Responda sempre em português do Brasil.
- O contrato de trabalho está em `editor-studio/WORKFLOW.md`. Cada vídeo é uma pasta em `videos/<id>/` (`job.json`, `uploads/`, `out/`, `filme/`, `ai.log`).
  Execute só a tarefa pendente (`aiTask`), grave o resultado no `job.json` e zere `aiTask`. Quem avança de etapa é o editor.
- Regras de render e de visual: `motion-studio/CLAUDE.md`. Biblioteca de módulos: `motion-studio/library/library.json`.
  Antes de desenhar qualquer cena, procure um módulo existente e reaproveite trocando só os parâmetros.
- Legenda, recorte de pessoa, leitura de vídeo, índice de refs e render: use o encaixe indicado em `ferramentas.json` (script ou skill) e respeite o `contrato` de saída.
- Python do projeto: `editor-studio/tools/.venv/bin/python` (mesmo que `.venv/bin/python` na raiz).
- Exemplos prontos para copiar: `motion-studio/exemplos/` (filme completo do Ads 03, mixagem de áudio, scripts do After Effects).
- Banco de referências do editor: `referencias/` (índice em `.index/index.json`: folha de contato, cortes e nota por vídeo).
- Não gaste créditos de serviços pagos (Artlist e semelhantes) sem aprovação do editor.
- Confira visualmente toda imagem antes de gravar no job. Nunca mostre a biblioteca inteira ao editor: no máximo 3 opções por pergunta.
