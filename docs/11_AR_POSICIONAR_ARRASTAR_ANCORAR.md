# Etapa 2 – AR: posicionar, arrastar, girar e ancorar

**Abrir:** https://interautomacaoind.github.io/Dinamizador/ → **AR 1:1** (sala em escala real) ou **AR maquete 1:20** (sobre a mesa).

## Como funciona agora

| Momento | Celular (Android / Chrome) | Meta Quest (navegador) |
|---|---|---|
| Procurar superfície | Aponte a câmera para o piso ou a mesa. Aparece um **marcador branco** (disco + anel) e a sala/maquete como prévia, com o **contorno da área ocupada** | Aponte o controle (ou a mão) para o piso/mesa: o marcador segue o raio |
| Posicionar | **Toque na tela** | **Gatilho** (ou pinça da mão) |
| Mover | **1 dedo**: arraste (a sala segue o ponto tocado no piso) | **Segure o gatilho** e aponte para onde quer levar; analógico esquerdo também arrasta |
| Girar | **2 dedos** girando, ou botões **↺ ↻** | Analógico direito |
| Escala (maquete) | **Pinça** com 2 dedos (1:7 a 1:50) | Analógico direito para cima/baixo ajusta a altura |
| Recomeçar | Botão **⟲ Reposicionar** | Botão **X** |
| Fixar no ambiente | Automático: ao soltar, a sala recebe uma **âncora** (WebXR Anchors) e fica presa ao lugar real enquanto você anda | Idem (o Quest usa o mapeamento do ambiente) |

- Sem superfície detectada em 3 s, a sala é colocada no piso à frente (referência *local-floor*), para não travar.
- Um toque rápido não move a sala: o arraste só começa depois de 3 cm de movimento.
- Os toques nos botões da tela não reposicionam a sala.
- No Quest, os controles e as mãos mostram um raio branco.

## Observações

- A âncora depende do aparelho: Quest 3/3S e Android com ARCore recentes suportam; onde não houver, a sala continua posicionada, só sem a correção de deriva.
- Para o **Quest 3**, faça a configuração do espaço (Space Setup) antes: melhora a detecção do piso/mesa.
- Próxima etapa (3): modo **Operar**, com o usuário apertando os botões da IHM, abrindo portas e pipetando.
