# REV22 · Berço de pesagem com célula de carga por garrafão

**Sala (GitHub Pages):** https://interautomacaoind.github.io/Dinamizador/ (câmera "Berço de pesagem M1")
**Visualizador só do berço:** https://interautomacaoind.github.io/Dinamizador/berco.html (botões Pesando / Travada / Grampo aberto, "Sem carenagem")
A REV21 (fixação por cilindro no carro) continua em `rev21.html`.

Mudou **só a base e a fixação do garrafão**. O resto da máquina 3 × 10 L (tampa GL80, uniões, válvulas, sucussão) é o da REV21.

## 1. As duas ideias e a escolhida

| | A · Dosar com a garra levantada e prender depois | **B · Fixação no próprio berço da balança (escolhida)** |
|---|---|---|
| Fixação | cilindro Ø50 no carro (REV20/21) | grampo de alavanca na coluna do berço |
| Abre/fecha | a cada ciclo (2× por ciclo) | **1× por lote** (só na troca do garrafão) |
| Durante a pesagem | garrafão solto no copo | garrafão preso; força de fixação fecha **dentro** do berço → entra na tara |
| Durante a mistura | a força da garra (~0,8 kN) passa pela célula → precisa travar mesmo assim | célula descarregada pela trava |
| O que liga o berço ao carro | garra + mangueiras | **só as mangueiras** (silicone, com laço de alívio) |
| Ar comprimido | cilindro Ø50 × 3 + válvulas | 2 mini-cilindros Ø25 por berço (fora do berço) |

A **B** atende o que você pediu: o berço já incorpora a fixação. Só as mangueiras flexíveis cruzam do berço para o carro, e as travas de sucussão ficam no carro, fora da pesagem.

## 2. Construção do berço (por garrafão)
1. **Célula de carga "single point"** de 30 kg, classe C3 (OIML R60), IP67/IP68, em alumínio ou inox. Fica fixada na bandeja do carro, no lado fixo; o lado da carga sustenta a plataforma. Exemplos de família, para confirmar no catálogo: Flintec PC42/PC6, HBM PW15/PW22, Zemic L6G.
2. **Plataforma** de inox 316, de 8 mm (300 × 290 mm), com o copo de UHMW e o liner de PU, as orelhas das travas e uma língua até a coluna do grampo.
3. **Batentes de sobrecarga**: 4 parafusos com folga ajustada para ~120 % da capacidade (≈0,3 mm, conforme a deflexão da célula escolhida).
4. **Grampo de alavanca**, do tipo "toggle" vertical, em inox, montado numa coluna Ø32 sobre a própria plataforma:
   - braço com o **anel em U + PU cônico** que apoia no ombro do garrafão;
   - **pacote de molas-prato**, que mantém a força de fixação constante (~300–400 N);
   - sobre-centro, ou seja, travado com o braço na horizontal;
   - sensor indutivo de "grampo fechado".

   Para trocar o garrafão, o braço bascula ~110° para trás.
5. **Travas de sucussão** (no carro, fora do berço): 2 mini-cilindros Ø25 com curso de 5 mm levantam a plataforma 1 mm contra 2 batentes em L.
   - Força: 2 × 295 N = 590 N a 6 bar.
   - Carga a vencer na mistura: ≈20 kg × (9,81 + 4,7) m/s² ≈ 290 N → margem ≈ 2.
   - Com a trava fechada, a célula fica **descarregada**: sem choque e sem fadiga.
6. **Indicador de peso** na frente de cada berço (PESANDO verde / TRAVADA laranja) e pesos na IHM.
7. **Mangueiras**: silicone platinado, Ø6×9 mm (BASE/DRENO) e Ø4×6 mm (RESPIRO). Saem das uniões, sobem, fazem um laço horizontal e são ancoradas numa viga do carro sobre os garrafões.
8. O **sensor capacitivo de presença** sai: a balança detecta o garrafão.

### Massa sobre cada célula (estimativa)
Garrafão ~4 kg + tampa/inserto 0,5 + copo 1,0 + plataforma 5,5 + coluna/grampo 2,5 + solução 6,8 ≈ **20 kg** → célula de 30 kg (~67 % da capacidade).

## 3. Sequência do ciclo com pesagem
| Etapa | Trava | Balança |
|---|---|---|
| Antes do lote: garrafão posto, **grampo fechado** (1×) | travada | — |
| Destrava + **tara** (garrafão vazio + tampa + grampo + mangueiras) | livre | 0,000 kg |
| **Dosagem por peso**: vazão grossa até 97 %, depois fina (pulsos) | livre | alvo **6,790 kg** (7 L × 0,97) ± 5 g |
| Estabiliza 2 s, registra a massa no lote | livre | registro por garrafão |
| Pipetagem 60 mL (garfo + balança) | livre | **+58 g** ± 2 g por garrafão |
| CONFIRMAR → trava | **travada** | — |
| Mistura 5:00 | travada | — |
| **Pesagem pós-mistura** (destrava) | livre | Δ ≈ 0 g → acusa vazamento ou evaporação |
| Dreno → confere vazio | livre | resíduo < 20 g |
| 2º ciclo: nova tara e repete | | |
| Fim do lote: trava, abre o grampo e troca | travada | — |

## 4. Precisão: de onde vêm os erros e como tratar
- **Resolução**: com conversor de 24 bits, a leitura estável é de ~1 g. No equipamento, com vibração das máquinas vizinhas e filtro digital, a repetibilidade fica em ~±2 g.
  - Dosagem (6,79 kg): ±5 g ≈ 0,07 %.
  - Pipetagem (58 g): ±2 g ≈ 3 %. Serve de **confirmação**; o sensor de garfo continua.
- **Mangueiras**:
  - Rigidez: o deslocamento do berço entre a tara e a leitura é < 0,2 mm; com 3 mangueiras de silicone (rigidez de ~20–50 N/m cada), o erro fica abaixo de 1 g.
  - Líquido na linha BASE após a dosagem: ~8 mL, dos quais parte apoia no berço → offset de alguns gramas, constante. Compensar por aprendizado ou soprar a linha pelo RESPIRO.
  - Pressão: ler só com a bomba parada e a válvula fechada (fim da vazão fina).
- **Vibração**: não pesar enquanto outra máquina estiver em sucussão no mesmo piso sem filtro adequado. Pés da máquina com amortecedor; filtro digital de 1–2 s na leitura final.
- **Temperatura**: célula com compensação; fazer a tara a cada ciclo.
- **Calibração**: peso-padrão de 5 kg e de 10 kg (classe M1) por berço. Verificação diária com 1 kg.

## 5. Elétrica / CLP
- Um canal de pesagem **por célula**, sem caixa somadora: módulo de pesagem de 4 canais, 24 bits, com filtro digital, no CLP (ou IO-Link/EtherCAT).
- Saídas por berço: trava (válvula 5/2 com retorno por mola; sem ar a trava desce e o berço volta para a célula, protegida pelos batentes de sobrecarga). Entradas: grampo fechado e trava em cima.
- Intertravamentos:
  - mistura só com trava em cima e grampo fechado;
  - dosagem só com trava embaixo e tara feita;
  - nova tara a cada ciclo.

## 6. Na cena (REV22)
- Cada garrafão mostra célula, plataforma, batentes, travas com LED, coluna com molas-prato, grampo com alavanca vermelha e indicador de peso.
- O processo anima tara, dosagem grossa/fina com o peso subindo, +58 g na pipetagem, trava na mistura, pesagem pós-mistura, dreno até o resíduo e, no fim do lote, o grampo basculando.
- Com a base, o garrafão subiu 56 mm (bocal a ~1,21 m do piso).
- Arquivos:
  - `maq10.js` (opção `balanca: true`; a apresentação REV20 continua com a versão de cilindro);
  - `app22.js`, `index.html`, `berco.html`;
  - `rev21.html` (versão anterior);
  - renders 39–44.

## 7. Pontos a confirmar
1. Modelo da célula (tamanho máximo de plataforma, deflexão nominal, IP, inox ou alumínio na área classificada).
2. Massa real do garrafão, do copo e da plataforma (define a capacidade de 30 kg ou 50 kg).
3. Força do grampo no ombro (molas-prato), a validar com o vidro.
4. Teste de vibração: leitura com as outras 3 máquinas em sucussão.
5. Classificação da área (solução hidroalcoólica 20 %) para a célula, a caixa de junção e o módulo: Ex ou barreira, se necessário.
