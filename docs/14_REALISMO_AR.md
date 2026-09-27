# Realismo na realidade aumentada (REV19)

**Abrir:** https://interautomacaoind.github.io/Dinamizador/ → botão **AR 1:1** ou **AR maquete 1:20**.
Antes de entrar, o seletor **☀** na barra escolhe a luz, a qualidade e a oclusão (a escolha fica salva no aparelho).

## O que foi feito

| Recurso | Onde funciona | Efeito |
|---|---|---|
| **Luz estimada do ambiente real** (WebXR *light-estimation*) | Celular Android (Chrome + ARCore) | Direção, cor e intensidade da luz vêm da câmera; o inox passa a refletir o cômodo real. Aparece "Luz do ambiente real detectada". |
| **Sombras no piso real** | Celular e Quest | Captador de sombra invisível sob a sala/maquete; a direção segue a luz estimada ou o preset. Sombra mais forte com luz dura. |
| **Oclusão de contato** | Celular e Quest | Mancha difusa sob cada máquina que "assenta" o equipamento no chão. |
| **Oclusão por profundidade** (*depth-sensing*) | **Quest 3** | Mãos, pessoas e móveis reais passam **na frente** do virtual. Pode ser desligada no seletor (bordas ficam um pouco serrilhadas). |
| **Mapeamento de tons neutro** | AR | Cores das embalagens e da tinta mais fiéis ao lado da imagem da câmera (fora do AR segue o ACES). |
| **Presets de luz** | Todos (essencial no Quest, que não estima luz) | Automática · Galpão LED (fria) · Luz quente · Luz de janela (lateral, sombra marcada) · Ambiente escuro. No celular, botão ☀ dentro do AR troca na hora. |
| **Qualidade alta** | Todos | Resolução do AR ×1,2 (celular) / ×1,3 (Quest) e menos foveação: textos e rótulos mais nítidos. Usa mais bateria; se travar, volte para normal. |
| **Filtragem anisotrópica** | Todos | Piso, rótulos e IHM nítidos em ângulo rasante. |

## Dicas para o melhor resultado
- Ambiente bem iluminado e piso com textura (piso liso/brilhante atrapalha a detecção).
- No celular, espere 2–3 s parado: a luz estimada entra sozinha.
- No Quest 3, faça o **Space Setup** (mapa do ambiente) antes, para a oclusão ficar estável.
- Combine o preset com a sua sala real: galpão com LED → "Galpão LED"; perto de janela → "Luz de janela".

## Próximos passos possíveis (não implementados)
- **Texturas PBR fotográficas** (inox escovado com normal/roughness, epóxi, vidro com sujeira leve) feitas no Blender e *bake* de oclusão ambiente nas máquinas: maior salto de realismo, mas aumenta o arquivo (~+10–20 MB) — ideal usar compressão KTX2.
- **Granulação/desfoque de câmera** para casar o virtual com o ruído da câmera do celular (pós-processamento no AR é caro).
- **Reflexos do ambiente no Quest**: o Quest não fornece mapa de reflexo; dá para capturar uma foto 360° do galpão real e usar como ambiente.
- **Modelo em formato USDZ** para abrir no iPhone (Quick Look), que tem luz e sombras nativas excelentes — o Safari do iPhone não suporta WebXR.
