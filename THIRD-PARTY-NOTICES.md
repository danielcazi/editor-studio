# Avisos de terceiros

## HyperFrames (HeyGen) · Apache-2.0
As skills em `motion-studio/.agents/skills/` e `motion-studio/.claude/skills/` (links) vêm de https://github.com/heygen-com/hyperframes, licença Apache License 2.0, fixadas por `motion-studio/skills-lock.json`. O texto da licença: https://www.apache.org/licenses/LICENSE-2.0. As cópias são as da instalação original; a integridade de cada uma está no `computedHash` do lock. Para ter as versões novas, use o plugin oficial (`/plugin install hyperframes@hyperframes`) em vez de editar estas cópias.

## framefields (gatewai-dev) · Apache-2.0
`motion-studio/lib/beat-analyze.mjs` é uma reimplementação em JavaScript do método de análise de batida do exemplo BeatGrid de https://github.com/gatewai-dev/framefields (energia logarítmica com fluxo de onset, tempo por autocorrelação com prior log-normal, refinamento de fase por filtro de pente, drop como downbeat). O cabeçalho do arquivo repete a atribuição. Nenhum modelo de visão (ONNX) nem peso treinado do framefields é distribuído aqui.
