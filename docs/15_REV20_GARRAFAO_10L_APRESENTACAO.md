# REV20 · Dinamizadoras para garrafão de 10 L + apresentação em AR

**Apresentação (GitHub Pages, com AR):** https://interautomacaoind.github.io/Dinamizador/apresentacao.html
Começar num passo específico: `apresentacao.html?passo=6`. A sala de treinamento (REV17) continua em `index.html`.

## 1. Sala da apresentação

| Posição | Máquina | Garrafões | Acesso |
|---|---|---|---|
| M1 | **REV20 4G** | 4 × 10 L | frente (G1, G2) e trás (G3, G4) |
| M2 | **REV20 3G** | 3 × 10 L em linha | só pela frente (fundo fechado) |
| M3, M4 | REV17 | 6 × 5 L | frente e trás |

## 2. Garrafão
- Referência de medidas: **DURAN GLS 80 10 L** — Ø229 × 385 mm (sem tampa), borosilicato 3.3, graduado em esmalte branco.
- Massa do vidro ~4 kg (**estimada — pesar**). Cheio a 70 %: 7 L × 0,97 kg/L ≈ 6,8 kg → **≈ 10,8 kg** por garrafão.
- Nível de 7 L ≈ 190 mm de coluna (corpo cilíndrico até ~262 mm; ombro de 262 a 338 mm; gargalo GL80).
- Copo de UHMW com entrada cônica, liner de PU e sensor capacitivo de presença.

## 3. Tampa GL80 com 4 conexões e uniões
- **Anel GL80 rosqueado** (PP/PVDF serrilhado, ~1,5 volta) + **inserto de 316L que não gira** dentro do anel (mesmo princípio das tampas multiconexão de laboratório). Assim os pescadores e as mangueiras não torcem ao rosquear.
- Vedação: junta de PTFE/EPDM no lábio do gargalo.
- 4 conexões (iguais às demais máquinas):
  1. **BASE** 3/8" — pescador 316L Ø12 até ~20 mm do fundo (enche pelo fundo, sem espuma);
  2. **DRENO** 3/8" — pescador até ~5 mm do fundo, ponta de PTFE;
  3. **RESPIRO** 1/4" — só no espaço de cabeça;
  4. **BOCAL de pipetagem** — funil de PTFE com tampa articulada e **sensor de garfo** (LED verde = passagem registrada), virado para o lado do operador.
- **Uniões** (porca de união) em BASE, DRENO e RESPIRO: soltam a mangueira da tampa sem ferramenta. Alternativa sanitária: mini tri-clamp ½".

## 4. Fixação do garrafão (sem fuso, sem pontes)
- **1 cilindro pneumático guiado por garrafão**, montado na viga do carro, atuando **de cima para baixo**: Ø50, **curso 200 mm**, com hastes-guia antigiro (ex.: SMC MGP / Festo DFM — confirmar catálogo).
- **Garra em U** (aberta para o lado da porta) com **anel cônico de PU** que apoia no **ombro** do garrafão — a parte mais larga em cima — e empurra o garrafão contra o copo.
- Força: 6 bar × Ø50 = **1,18 kN**; com regulador por cilindro em ~4 bar ≈ **0,8 kN** (7× o peso do garrafão cheio). Pressão de contato no ombro ≈ 0,1 MPa (área do PU ~85 cm²) — baixa para o vidro, **validar em teste**.
- Garra aberta sobe 200 mm acima do ombro: o garrafão (já drenado) sai pela porta sem bater.
- Sensores magnéticos **aberto/preso** em cada cilindro; válvula de bloqueio (ou 5/3 centro fechado) para manter a garra presa se faltar ar.
- Na **4G** os cilindros ficam entre as fileiras (braços para fora); na **3G** ficam atrás dos garrafões — a frente fica livre.
- A garra viaja com o carro: não há ponte, fuso, motorredutor de ponte nem fole de fuso.

## 5. Sucussão
- Manivela-biela sob a bandeja, **curso 60 mm**, **120 golpes/min**, mistura de 5:00 (mantidos da REV17).
- Massa em movimento: 4G ≈ **110 kg** (4 × 10,8 kg + copos, garras e carro); 3G ≈ 85 kg. Aceleração de pico ≈ 4,7 m/s² → força inercial ≈ 0,5 kN; peso equilibrado por **2 molas a gás**.
- **Motor 2,2 kW** 4P com freio + redutor (i ≈ 14,5 → 120 rpm) + inversor com STO (a REV17 usa 1,5 kW).
- 2 eixos-guia Ø40 com mancais lineares nas laterais do carro.
- **Validar no protótipo:** a energia de choque com 7 L é diferente da de 3,6 L — conferir se o regime (curso/frequência) dá a mesma dinamização da REV17.

## 6. Dosagem, pipetagem e descarga
- Dosagem: medidor de engrenagem oval + solenoide **por garrafão**; 7 L a ~4 L/min ≈ **1:45** (as 4 em paralelo).
- Pipetagem: **60 mL por garrafão** (pipeta sorológica de 100 mL com pipetador elétrico, ou dispensador de garrafa ajustado em 60 mL — mais ergonômico). 4G: 240 mL/ciclo; 3G: 180 mL/ciclo. CLP só libera a mistura com todos os sensores de bocal registrados.
- Descarga: 28 L por ciclo na 4G → **receptor a vácuo de pelo menos 40 L** (o da REV14 era de 26 L).
- Válvulas no compartimento superior: BASE, DRENO e RESPIRO por garrafão (12 na 4G, 9 na 3G).

## 7. Dimensões e produção (estimativas)

| | REV20 4G | REV20 3G | REV17 |
|---|---|---|---|
| L × P × A (sem torre) | 1,45 × 1,26 × 2,33 m | 1,81 × 0,80 × 2,33 m | 1,86 × 1,33 × 2,63 m |
| Por ciclo | 28 L | 21 L | 21,6 L |
| Ativo por ciclo | 240 mL | 180 mL | 180 mL |
| Ciclo | ≈ 9:10 | ≈ 9:00 | ≈ 8:02 |
| 8 h sem paradas | ≈ 1.450 L | ≈ 1.110 L | ≈ 1.270 L |

Sala (M1 + M2 + 2 × REV17): **92,2 L por rodada**, ≈ **5.100 L em 8 h** (a confirmar).

## 8. A apresentação (14 passos)
1 visão geral · 2 M1 · 3 garrafão 10 L · 4 tampa GL80 · 5 uniões · 6 fixação por cilindro · 7 sem fuso/pontes (raio-X) · 8 dosagem 7 L · 9 pipetagem 60 mL · 10 sucussão · 11 descarga e retirada · 12 M2 (só frente) · 13 M3/M4 REV17 · 14 comparativo.

- Navegação: ◀ ▶, ▶ Auto, lista de passos, teclas ← →; botão **Raio-X**.
- **AR:** escolha **sala inteira** ou **só M1 / só M2 / só M3**, depois **AR 1:1** (tamanho real) ou **AR maquete** (sala 1:20, máquina 1:5). Celular: botões ◀ ▶ na tela. Quest: **A** próximo, **B** anterior, **Y** auto; texto do passo flutua à frente. Luz estimada, sombras no piso e oclusão do Quest 3 (doc 14) valem aqui também.
- Modelos das máquinas REV20 são gerados no próprio navegador (`maq10.js`), usando os materiais da REV17.

## 9. Pontos a confirmar
1. Pesar o garrafão vazio e conferir a rosca GL80 do fornecedor escolhido.
2. Teste de carga da garra no ombro (vidro) e da vedação da tampa com 6 bar na linha de ar.
3. Regime de sucussão para 7 L (equivalência com a REV17).
4. Ergonomia: garrafão cheio pesa ~10,8 kg — retirar sempre **drenado**; boca a ~1,10 m e bocal a ~1,17 m do piso.
5. Classificação de área (solução hidroalcoólica 20 %) para válvulas e sensores.
