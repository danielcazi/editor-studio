# Editor Studio

Fluxo para editar vídeo curto com o Claude Code, com o editor aprovando cada etapa:

**envio → banco de referências → devolutiva → stills → storyboard → vídeo final**

Você manda o vídeo, a legenda e o briefing. O Claude propõe e você aprova antes de ele avançar. Cada vídeo abre uma conversa própria do Claude instalado na sua máquina.

## Começar

```bash
git clone https://github.com/danielcazi/editor-studio.git videos-claude
cd videos-claude
bash install.sh      # ou: bash install.sh --leve
bash doctor.sh --claude
bash start.sh        # abre http://localhost:4173
```

- Guia completo: [INSTALAR.md](INSTALAR.md)
- Fluxo visual, da instalação à entrega: abra o [FLUXO.html](FLUXO.html) no navegador
- Contrato de cada etapa: [editor-studio/WORKFLOW.md](editor-studio/WORKFLOW.md)
- Trocar a ferramenta de legenda, recorte ou leitura: [ferramentas.json](ferramentas.json)

Vídeos (`videos/`) e referências (`referencias/`) ficam só na sua máquina: eles não vão para o git.
