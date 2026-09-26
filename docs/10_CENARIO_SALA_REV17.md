# Sala de Dinamização – REV17 (ciclo de 8 min, pipetagem no bocal, sala 10 × 10 m)

**Abrir:** https://interautomacaoind.github.io/Dinamizador/

## O que mudou em relação à REV16

| Tema | REV16 | REV17 |
|---|---|---|
| Ativo | Estação lateral com 6 funis e linhas PTFE até os garrafões | **Pipetagem direta no bocal de cada cabeçote** (P1–P6), sem mangueiras |
| Garantia de dose | Botão "ATIVO OK" | **Sensor óptico de garfo em cada bocal** + **CONFIRMAR** na IHM (o CLP confere 6/6 registros) |
| Portas da máquina | Fechadas o ciclo todo | Abrem só na pipetagem: traseira (P4–P6) e frente (P1–P3) |
| Solução | "Solução base" | **Solução hidroalcoólica 20 %** (IHM, TV, placas da linha e da bancada) |
| Sala | 10 × 15 m | **10 × 10 m** (porta e TV nas mesmas paredes) |
| Partida | Operadora inicia cada máquina | **Partida escalonada**: 1 toque na IHM da M1 programa as 4 máquinas com 2:00 de defasagem |
| Ciclo médio | 13:32 (com espera pela operadora) | **8:02** (sem espera) |
| Escala de tempo | 6× | **3×** (ações humanas em ritmo realista) |
| Placas | Tanque e bancada com texto cortado | Texto ajustado automaticamente ao tamanho da placa |
| Final | Indicadores | **Pausa do café**: apito, TV "PAUSA DO CAFÉ", operadora sorri e sai; a TV volta aos indicadores finais |

## Máquina REV17 – bocal de pipetagem com sensor

- Bocal cônico de PTFE (Ø27 mm na boca) com anel inox, sobre o cabeçote, ligado por canal Ø8 mm 316L até dentro do garrafão.
- Tampa articulada (dobradiça do lado oposto à porta); abre para pipetar e fecha em seguida.
- **Sensor óptico de garfo (fibra óptica, IP65)** abraçando o pescoço do bocal: detecta a passagem da ponteira. LED âmbar = alimentado; LED verde = registrado neste ciclo.
- Ao tocar **CONFIRMAR**, o CLP verifica os 6 registros. Faltando algum, a IHM mostra o bocal pendente e **não libera a mistura**. Cada registro fica com data e hora (rastreabilidade do lote).
- Limitação: o sensor comprova a **passagem** da pipeta, não o **volume**. O volume é garantido pela pipeta calibrada e pelo procedimento.
- Removidos: peristáltica, tanque de ativo, mangueiras e capilares de ativo, estação de funis.
- Portas: frente e traseira (2 folhas cada), com intertravamento; abertas, a máquina não fecha cabeçote nem inicia a mistura.

## Ciclo de 8 min (tempos simulados)

| Etapa | REV16 | REV17 | Como |
|---|---|---|---|
| Fechar cabeçotes | 0:24 | 0:09 | Válvula pneumática de maior vazão |
| Dosar 21,6 L de solução hidroalcoólica 20 % | 1:24 | 0:40 | 6 válvulas em paralelo (~32 L/min) |
| Pipetagem manual (6 × 30 mL) | 2:18 a 8:00 com espera | 1:25 | Portas traseira → frente → CONFIRMAR, sem espera |
| Ativo pela linha | 0:36 | — | Eliminado |
| Mistura | 5:00 | 5:00 | Fixa |
| Estabilizar | 0:09 | 0:05 | |
| Drenar p/ TQ-01 | 1:12 | 0:35 | Válvula e linha de 1" |
| Abrir cabeçotes | 0:27 | 0:08 | |
| **Total** | **13:32 média** | **8:02** (M3 8:06) | |

- Sequência mantida: **dosagem → pipetagem** (decisão do cliente).
- Pipetagem por garrafão ≈ 7 s (abrir tampa, aspirar 30 mL do frasco de 1 L com pipetador elétrico e pipeta sorológica de 50 mL, dispensar, fechar).
- **Partida escalonada 2:00**: cada máquina fica pronta para pipetar quando a operadora termina a anterior.
- Ocupação da operadora ≈ 85–90 % no regime: **uma pessoa dá conta**, mas com pouca folga para reabastecer frascos e registros. Em 8 h, prever apoio ou rodízio.
- Meta em 8 h com ciclo de 8:02: 59 ciclos/máquina × 4 × 21,6 L ≈ **5.100 L/dia** (antes: 3.024 L). Com paradas reais de turno, algo em torno de 4.500 L.
- Consumo de ativo: 6 × 30 mL = 180 mL por ciclo; a operadora troca o frasco de 1 L na bancada após a 1ª rodada.

## Roteiro da cena (tempo real ≈ 8:27, simulado 07:00 → 07:25)

1. Operadora entra, toca **PARTIDA ESCALONADA** na IHM da M1 (M1 agora, M2 +2:00, M3 +4:00, M4 +6:00).
2. Pega o frasco de ativo 1 L e o pipetador na bancada.
3. Para cada máquina: portas traseiras → P4–P6 → frente → P1–P3 → **CONFIRMAR** → mistura.
4. Após a 1ª rodada, troca o frasco; faz a 2ª rodada (as máquinas reiniciam sozinhas, programa de 2 ciclos).
5. Ronda de inspeção, **TRANSFERIR** TQ-01 → sala de tanques.
6. **Pausa do café**: o supervisor abre a porta e apita; a TV mostra "PAUSA DO CAFÉ"; a operadora sorri e sai; a TV volta aos indicadores finais.

Câmera nova: **Bocais M1 (pipetagem)**.

## Arquivos

- `assets/maquina_rev17.glb` – máquina (portas, tampas e LEDs controlados pela página)
- `assets/sala_cena.glb` – sala 10 × 10 m, pessoas e animação (inclui o sorriso como morph target)
- `assets/roteiro.json` – roteiro gerado pelo `timeline.py`
- `Blender_cenario/`: `machine17.py` (máquina REV17), `layout.py`, `timeline.py`, `room.py`, `human.py` (expressões), `anim.py`, `textures.py`, `glbopt.py` (agora preserva morph targets esparsos), `lib.py` (correção para ações com *slots* do Blender 4.4+)

## Próximas etapas combinadas

2. AR: posicionar com marcador no piso, arrastar/girar com os dedos, ancorar no Quest.
3. Modo "Operar": o usuário é o operador (partida, portas, pipetagem, CONFIRMAR) com controle ou mão no Quest.
