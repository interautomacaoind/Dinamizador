# Modelo 3D REV12 — máquina completa (validação de layout)

**Data:** 23/09/2026 · **Base:** REV11 + análise `04_ANALISE_MECANICA_REV11_MELHORIAS.md`

## Arquivos

| Arquivo | O que é |
|---|---|
| `CMR_REV12_maquina_completa.glb` | 1 máquina completa com a carenagem da REV11 e o ciclo animado de 54 s |
| `CMR_REV12_maquina_sem_carenagem.glb` | O mesmo modelo sem carenagem, portas, visores e tampas, para ver a mecânica por dentro |
| `CMR_REV12_previa.png` | 6 vistas de conferência |
| `Blender_REV12/CMR_REV12.blend` | Cena Blender (abre no Blender 4.2 ou mais novo) |
| `Blender_REV12/build.py` + `lib.py` | Script que gera o modelo do zero a partir do GLB da REV11 (parâmetros no topo) |

Os dois GLBs passaram no validador glTF oficial com 0 erros e 0 avisos.

## O que foi mantido da REV11

Estrutura, colunas, longarinas, carenagem inferior com visor, portas intertravadas, vidro lateral, lateral técnica, compartimento superior, IHM, placas e logos.

## O que foi refeito (tudo animado)

| Conjunto | REV12 no modelo |
|---|---|
| Acionamento | Motor WEG 1,5 kW 4P com motofreio + redutor cônico-helicoidal (saída em Y) + mancal externo UCP209 + manivela Ø300 com contrapeso (r = 90 mm) + sensor indutivo de PMI |
| Biela | L = 450 mm, **no plano das guias e no centro da bandeja** (x = 0, y = 0), olhal com rolamento e rótula |
| Compensação de peso | 2 molas a gás de 600 N entre base e travessa do carro |
| Guia | 2 eixos Ø40 temperados e cromados (x = ±575 mm), apoiados em cima e embaixo, montante 60×80 próprio, batentes de PU, fole |
| Carro de roletes | **Lado direito fixo:** 8 roletes (F/T + I/E em 2 níveis). **Lado esquerdo flutuante:** 4 roletes (F/T). Roletes POM-C Ø52 × 25 com canal R20,5 e 6201-2RS inox; buchas excêntricas em vermelho; raspadores de feltro; 400 mm de altura (níveis a ~340 mm) |
| Bandeja | 316L com borda de contenção e dreno, nervuras e abas nos cantos |
| Berços | Apoio de PU no fundo + 3 montantes + aro com sapatas de ombro em PU |
| Fechamento do bocal | **1 ponte por fileira (2 no total)**, e não 6 fusos: 2 fusos Tr20×4 autotravantes sincronizados por correia + 1 motorredutor com freio sob a bandeja, 2 guias Ø20, sensores de fim de curso alto/baixo |
| Cabeçote | 316L, saia cônica que centraliza o gargalo, junta EPDM, **pacote de molas prato** (8 mm de compressão), sensor de mola comprimida, LED verde de fechamento confirmado, 4 válvulas no próprio cabeçote (BASE, ATIVO, DRENO, RESPIRO) |
| Pescador | 316L 12×1 (Ø10 interno) com ponta telescópica de PTFE com mola |
| Esteiras porta-cabos | 1 por ponte, R50, cinemática real (a curva anda a meia velocidade) |
| Dosagem da base | Tanque dosador gravimétrico 316L de 6,9 L sobre célula de carga (compartimento superior), válvula fino/grosso, visor de nível |
| Pipetagem do ativo | Bomba seringa de 50 mL + válvula de 3 vias + frasco de ativo de 1 L (lateral técnica) |
| Descarga | Tanque receptor a vácuo 316L de 26 L + bomba de vácuo + visor + saída para armazenagem |
| Respiro | Coletor com filtro de carvão ativado e exaustão |
| Tubulação | Coletores por função no compartimento superior, travessias e risers na lateral técnica, com cores por função (azul = base, laranja = ativo, verde = dreno, lilás = respiro) |

## Ciclo animado (54 s, comprimido)

| t (s) | Etapa |
|---|---|
| 0–2 | Garrafões vazios, pontes elevadas 420 mm, carro no PMI |
| 2–6 | Pontes descem; cabeçotes encostam e comprimem as molas; LEDs verdes acendem |
| 7–17 | Dosagem da base garrafão a garrafão (3,6 L cada); o tanque dosador esvazia e reabastece a cada garrafão |
| 17–21 | Pipetagem do ativo (30 mL por garrafão; o êmbolo da seringa se move) |
| 23–35 | Sucussão: rampa de 2 s, 8 s a 120 golpes/min, rampa de 2 s, **parada exata no PMI** (20 golpes na demonstração) |
| 37–47 | Drenagem simultânea a vácuo pelos pescadores; o receptor enche |
| 47–51 | Pontes sobem; LEDs apagam |
| 51–54 | Pronta para troca dos garrafões |

O movimento do carro, da biela, da manivela, dos 12 roletes (giro calculado pelo curso), dos foles e das esteiras usa a cinemática real da manivela-biela (r = 90 mm, L = 450 mm, curso de 180 mm).

## Simplificações (não é desenho de fabricação)

- Tempos comprimidos: a sucussão real é de 5 min e a drenagem real deve ficar entre 30 e 60 s.
- Mangueiras rígidas no modelo; nas esteiras, o feixe aparece como um bloco só.
- Fusos Tr20×4 com filete esquemático; o fuso não gira na animação (só a ponte se move).
- Todos os garrafões têm a mesma altura; a variação real é absorvida pelas molas prato e pela ponta telescópica.
- A posição de estacionamento para carga ficou no **PMI** (mais baixo, melhor para o operador). Cabeçote, dosagem e drenagem também trabalham nessa posição.
- Passagens pelas chapas do compartimento superior e da prateleira técnica estão subentendidas (sem furo modelado).

## Pontos para conferir no layout

1. Folga entre o rolete externo do lado fixo (x até 643 mm) e a lateral técnica (670 mm).
2. Acesso para regular as buchas excêntricas com o carro montado.
3. Altura do garrafão real × curso da ponte (420 mm): com o pescador de 337 mm sobram cerca de 78 mm acima do gargalo para tirar e pôr o garrafão.
4. Espaço do tanque dosador no compartimento superior (Ø200 × 290 mm).
5. Passagem das esteiras pela chapa do compartimento superior (y = ±415 mm, x = −270 mm).
