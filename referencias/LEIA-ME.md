# Banco de referências

Solte vídeos **.mp4** (ou .mov/.webm) em `edicao/`, `lettering/` ou `motion/`.
Ao lado de cada vídeo, se quiser, um `.txt` com o mesmo nome e 1–2 linhas: por que você gosta.
Exemplo: `corte-seco.mp4` + `corte-seco.txt`.

O indexador roda sozinho quando o servidor sobe e antes de cada tarefa `refs`.
Ele gera em `.index/` uma folha de contato, o mapa de cortes e os metadados. A IA lê só o índice.
Manual (na raiz do projeto): `node editor-studio/tools/index_refs.mjs`
