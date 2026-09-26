# Análise mecânica REV11 e melhorias para a REV12

**Escopo:** conjunto que sobe e desce (carro/bandeja), motor, redutor, manivela/biela, dosagem automática de líquido, pipetagem do ativo, descarga e fuso que fecha o bocal. Carenagem e sistemas auxiliares ficaram de fora.
**Base:** `CMR_REV11_maquina_isolada.glb` (medidas tiradas do modelo), documentação REV11 e o vídeo de referência de 23/09/2026 (carro com roletes de nylon correndo em tubo redondo).
**Data:** 23/09/2026

> As contas abaixo são **estimativas de pré-projeto** para orientar o CAD. Elas partem das hipóteses da seção 0 e precisam ser refeitas quando massas, frequência e componentes forem definidos.

---

## 0. O que o modelo REV11 tem hoje (medido no GLB)

| Item | REV11 atual |
|---|---|
| Curso do carro | **179 mm** (manivela com excentricidade ≈ 90 mm) |
| Biela | reta, ≈ 500 mm entre centros → λ = r/L ≈ 0,18 |
| Guia vertical | **2 eixos Ø32 × 870 mm**, um de cada lado (X = ±550 mm), no mesmo plano |
| Buchas | 2 buchas lineares por eixo (Ø44 × 68), **só 150 mm entre centros** |
| Bandeja | 1180 × 1000 mm, 6 torres, garrafões em 2 fileiras (frente/trás, Z ≈ ±340 mm) |
| Ponto de ataque da biela | Z ≈ +175 mm **fora do plano dos eixos guia** |
| Motor / redutor | WEG genérico (~carcaça 90) + Cestari genérico, volante Ø270 |
| Fechamento do bocal | fuso Ø15 × 605 mm, rosca trapezoidal dupla entrada, avanço 8 mm, porca de bronze, motor compacto + redutor + freio no topo do mastro |
| Cabeçote | face com 4 portas BSP 3/8 (ATIVO, BASE, DRENO, RESPIRO) com engate rápido; pescador Ø7 × 337 mm |

**Hipóteses usadas nas contas:** massa móvel ≈ 125 kg (6 garrafões cheios ≈ 38 kg + 6 torres/cabeçotes ≈ 36 kg + bandeja/carro ≈ 50 kg); frequência de sucussão 90 a 150 golpes/min.

### Dinâmica estimada do carro (manivela 90 mm, biela 500 mm, 125 kg)

| Golpes/min | Acel. máx. | Vel. máx. | Força máx. na biela | Força mín. | Torque pico no eixo de saída | Torque RMS | Com contrapeso/mola: pico / RMS |
|---|---|---|---|---|---|---|---|
| 90 | 0,96 g | 0,86 m/s | 2,0 kN | +0,06 kN | 135 N·m | 84 N·m | 52 / 33 N·m |
| **120** | **1,70 g** | 1,14 m/s | **2,7 kN** | **−0,86 kN** | 164 N·m | 97 N·m | 93 / 58 N·m |
| 150 | 2,65 g | 1,43 m/s | 3,5 kN | −2,0 kN | 203 N·m | 120 N·m | 145 / 91 N·m |

Leitura importante: **acima de ~90 golpes/min a força na biela inverte de sinal** (a aceleração para baixo no topo passa de 1 g). Isso quer dizer que toda folga (biela, pino, redutor, guia, fixação do garrafão, fuso do cabeçote) vai "bater" a cada ciclo. Tudo que está na cadeia de força precisa ser **sem folga ou pré-carregado**.

---

## 1. Guia do carro — trocar buchas por roletes (prioridade 1)

### 1.1 Problemas do sistema atual

1. **Buchas muito próximas:** 150 mm entre buchas num eixo Ø32 para segurar uma bandeja de 1000 mm de profundidade. Qualquer desbalanço frente/trás vira momento grande nas buchas → desgaste rápido, folga e ruído.
2. **Biela fora do plano das guias (≈175 mm):** com 2,7 kN na biela isso gera ≈ 470 N·m de momento permanente, que as buchas precisam segurar. Com 150 mm entre buchas isso dá **≈ 1,6 kN por bucha** só por esse efeito.
3. **Bucha de esferas + eixo em ambiente com respingo de solução alcoólica e limpeza:** as esferas corroem e marcam o eixo, e a lubrificação lava. Bucha de polímero seco sem lubrificação resolve a corrosão, mas continua com folga e atrito.
4. Os dois lados são rígidos (dois eixos com bucha fechada): qualquer erro de paralelismo entre os eixos **trava** o carro ou força as buchas.

### 1.2 Proposta REV12: carro de roletes sobre eixo redondo (conceito do vídeo)

Veja o croqui `REV12_guia_roletes_conceito.svg`.

**Configuração fixo-flutuante (12 roletes no total):**

- **Lado fixo:** 2 níveis × 4 roletes a 90° (frente, trás, interno, externo) = 8 roletes. Esse lado posiciona o carro em X e Z.
- **Lado flutuante:** 2 níveis × 2 roletes (frente e trás) = 4 roletes. Segura só Z e fica **livre ±2 mm em X**, o que absorve erro de paralelismo entre os eixos sem travar. É o mesmo princípio de guia linear "fixo + flutuante" usado em máquinas-ferramenta e pórticos.
- **Distância entre níveis ≥ 300 mm** (hoje 150 mm). Dobrar essa distância divide a carga nos roletes pela metade.
- **Pré-carga por bucha excêntrica:** em cada par oposto, um rolete fica num eixo excêntrico (0,5 a 1 mm de excentricidade) com contraporca. Isso zera a folga na montagem e permite reajuste com o desgaste — é o que se vê nos parafusos dos roletes do vídeo.

**Rolete (sugestão de partida):**

| Item | Sugestão | Motivo |
|---|---|---|
| Diâmetro externo | Ø80 mm, largura 30 mm | Rotação baixa (≈270 rpm a 1,14 m/s), boa área de contato |
| Perfil | **Côncavo (garganta) com raio 20,5 mm para eixo Ø40** (raio do eixo + 0,5 mm) | Contato em arco, centraliza sozinho, pressão de contato baixa |
| Material da banda | **POM-C (acetal)** ou **PU (Vulkollan) injetado sobre cubo de alumínio** | Nylon PA6 absorve até ~7 % de água e incha → perde pré-carga e muda folga. POM é estável e resiste bem a etanol. PU é mais silencioso e amortece. |
| Rolamentos | 2 × 6201-2RS (ou 6202-2RS) **inox**, por rolete | Ambiente lavável com álcool; vedação dupla |
| Eixo do rolete | M12 classe 8.8 inox / bucha excêntrica usinada | Regulagem de pré-carga |

**Eixo guia:**

- Aumentar de Ø32 para **Ø40 mm**, aço 1045 **temperado por indução, retificado h7 e cromado duro**, ou inox AISI 420 temperado (lavagem com álcool).
- Fixar **nas duas extremidades** em suportes rígidos presos à estrutura (tipo SK40 ou flange usinada), com a estrutura trabalhando como pórtico fechado.
- Comprimento útil: altura do carro (≥ 360 mm) + curso (180 mm) + folgas de batente ≈ 650 mm mínimo.

**Proteções:**

- Raspador/feltro no topo e na base do carro (limpa o eixo antes do rolete passar).
- Sanfona (fole) ou calha sobre o eixo contra respingos da bandeja.
- **Batentes de PU** na base: se a biela ou o pino quebrar, o carro cai 180 mm sobre batentes e não sobre a estrutura.

**Carga nos roletes (estimada):**

| Situação | Carga por rolete |
|---|---|
| Biela a 175 mm do plano, níveis a 150 mm (como hoje) | ≈ 1,6 kN |
| Biela a 175 mm do plano, níveis a 300 mm | ≈ 0,8 kN |
| **Biela no plano das guias e no centro de massa + níveis a 300 mm** | quase zero; sobra só o desbalanço (ex.: uma fileira de 3 garrafões vazia → ≈ 0,3 kN) |

**Conclusão:** o rolete só funciona bem se, junto com ele, **a biela for trazida para o plano das guias e para o centro de massa da bandeja** (ver 2.1). Aí os roletes fazem apenas guia e a carga cai para uma faixa confortável para roletes de POM/PU Ø80.

**Referências comerciais para comparar custo e prazo antes de fabricar:** sistemas de guia por roletes em trilho/eixo prontos (Hepco GV3, Rollon Compact Rail/Uniline, Bosch Rexroth). Podem sair mais baratos que usinar 12 roletes com excêntricos.

---

## 2. Acionamento: manivela, biela, motor e redutor

### 2.1 Geometria

- **Alinhar a biela no plano dos eixos guia (Z = 0) e no centro de massa da bandeja.** Hoje ela está ≈175 mm deslocada — é a maior fonte de esforço lateral da máquina.
- Com uma biela só no centro de uma bandeja de 1180 mm, a bandeja trabalha como viga bi-apoiada com carga no meio → vibra (flexão). Avaliar **duas bielas** (virabrequim com dois moentes em fase, um perto de cada guia) ou uma **travessa de ataque bem rígida** (perfil caixa) entre a biela e as guias.
- Biela reta de 500 mm dá λ = 0,18: a aceleração no ponto morto superior é 18 % maior que no inferior. Se o processo exigir um "golpe" simétrico, aumentar a biela (λ ≤ 0,12) ou aceitar isso na especificação de processo.
- **Definir se a sucussão precisa de impacto** (garrafão batendo contra anteparo) ou só de movimento alternado. Manivela-biela gera movimento senoidal sem impacto. Se for preciso impacto, o conceito muda (came com queda, ou batente elástico calibrado no fim do curso).

### 2.2 Articulações da biela

- Olhal superior e inferior com **rótula (terminal rotular) ou rolamento de rolos pré-carregado** — não usar bucha lisa com folga, já que a força inverte a cada ciclo acima de 90 golpes/min.
- Pino excêntrico com **ajuste H7/k6 e trava axial**; manivela presa ao eixo de saída por **anel de fixação cônico (tipo Ringfeder/Bikon)** em vez de chaveta, que "bate" com torque alternado.
- Prever **regulagem de curso** (furos em raios diferentes no volante/manivela: 70, 90, 110 mm) para ajustar o processo sem fabricar peça nova.

### 2.3 Balanceamento

- Adicionar **contrapeso na manivela ou molas a gás** entre carro e estrutura para compensar o peso próprio (~1,2 kN). Pela tabela da seção 0, a 120 golpes/min isso reduz o torque RMS de ~97 para ~58 N·m e o pico de ~164 para ~93 N·m (≈ −40 %), o que permite motor e redutor menores e reduz vibração transmitida ao piso.
- O volante Ø270 já ajuda a suavizar picos; conferir a inércia depois de definir o contrapeso.

### 2.4 Redutor

- O torque **inverte de sentido duas vezes por ciclo**. Redutor coroa-sem-fim (linha típica da Cestari) sofre com isso: a folga entre coroa e rosca bate e desgasta rápido. Preferir **redutor de engrenagens helicoidais** (coaxial ou ortogonal cônico-helicoidal) com folga baixa. Se ficar com sem-fim, usar fator de serviço ≥ 1,8 a 2.
- Relação: para 120 golpes/min com motor 4 polos (~1740 rpm) → **i ≈ 14,5**. Com inversor de frequência, dá para ajustar entre 90 e 150 golpes/min sem trocar redutor.
- Eixo de saída com **mancal externo (mancal de apoio no lado da manivela)** para não carregar os rolamentos do redutor com a força radial da biela (2,7 a 3,5 kN).

### 2.5 Motor e controle

- Estimativa (120 golpes/min, sem contrapeso): torque RMS no motor ≈ 7,5 N·m → **1,5 kW (2 cv) 4 polos IE3**. Com contrapeso cabe em 1,1 kW. Refazer a conta com massa real.
- **Inversor de frequência** (rampas suaves de partida e parada; ajuste da frequência de sucussão pela IHM).
- **Motofreio** ou freio no eixo: se o carro parar fora do ponto morto, o peso gira a manivela de volta.
- **Sensor indutivo no volante (ou encoder)** para: contar golpes (o processo é em número de sucussões, não em tempo) e **estacionar sempre no ponto morto superior**, que é a posição de acoplar cabeçote, dosar, pipetar e drenar.
- Segurança: STO no inversor + freio ao abrir porta, e verificar a energia do volante na parada (tempo de parada para NR-12).

---

## 3. Fixação dos garrafões na bandeja

Não era o foco, mas com 1,7 g a fixação do vidro define se a máquina é viável:

- Cada garrafão cheio (~6,3 kg) gera ≈ 170 N de inércia a 120 golpes/min, invertendo o sentido a cada ciclo.
- Berço com **apoio amplo no fundo (base de PU/silicone) + contenção no ombro**, sem carga pontual no vidro. As "Sapatas ombro ampla" e "Haste retenção ombro" já vão nessa direção; a pré-carga deve vir de **mola**, não de aperto rígido, porque a altura do garrafão varia (±2 a 3 mm no vidro soprado).
- Bandeja com **contenção e dreno** para o caso de quebra de um garrafão (vidro + 3,6 L de solução alcoólica).

---

## 4. Fuso que fecha o bocal (cabeçote)

### 4.1 Problemas do conceito atual

1. **Rosca trapezoidal de dupla entrada, avanço 8 mm, Ø15-16:** ângulo de hélice ≈ 12°, contra ≈ 6° de ângulo de atrito bronze/aço. **Não é autotravante:** com a vibração de 1,7 g, o cabeçote tende a subir sozinho, e hoje só o freio segura.
2. **Motor + redutor + freio no topo de um mastro de 890 mm**, oscilando a 1,7 g. Essa massa alta gera flexão alternada no pé do mastro (fadiga na solda/parafusos) e sacode o motor e o freio.
3. Fuso Ø15 × 605 mm é esbelto: "chicoteia" com a vibração se não tiver apoio.
4. Força de vedação definida pelo torque do motor (aperto até travar) → variável, e pode trincar o gargalo do vidro.
5. Seis motores, seis freios e cabos subindo e descendo a 2 Hz: são muitos pontos de falha elétrica em movimento.

### 4.2 Melhorias sugeridas

- **Vedação por mola, não por torque:** o fuso leva o cabeçote até encostar e comprime um **pacote de molas prato (ou mola helicoidal)** até um batente. A força no gargalo fica definida pela mola (sugestão inicial 150 a 300 N — validar com teste de estanqueidade), independente do motor.
- **Rosca autotravante:** trocar para **Tr16×4 de entrada simples** (ângulo ≈ 5°, abaixo do atrito) ou manter avanço rápido só na aproximação e travar com **trava mecânica** (pino/came) na posição fechada. O freio fica como redundância.
- **Confirmar fechamento por sensor**, não por tempo: fim de curso de "mola comprimida" (sensor indutivo no batente) + monitoramento de corrente do motor. Sem essa confirmação, não liberar sucussão.
- **Baixar a massa:** avaliar mover o motor para a base do mastro com transmissão por correia sincronizada, ou encurtar o mastro. Alternativa mais simples a avaliar: **um único mecanismo de fechamento para as 6 posições** (travessa comum acionada por 1 ou 2 atuadores), já que todas fecham juntas — reduz de 6 para 1-2 motores no carro móvel.
- Fuso com **mancal nas duas pontas** (fixo-apoiado) e porca com **anti-folga (porca dupla com mola)**.
- Junta do bocal em **EPDM ou silicone grau farmacêutico** (boa resistência a etanol 30 %), com **alojamento que centraliza o gargalo** (cone), já que a posição do gargalo varia de garrafão para garrafão.
- O **indexador de giro 90°** e o **pino de bloqueio de altura** também estão na massa oscilante: prever pino cônico com mola e sensor de confirmação, porque com folga eles vão martelar.

---

## 5. Dosagem automática (porta BASE — 3,6 L por garrafão)

- **Definir o princípio de medição** — hoje o modelo mostra só o jato. Opções:
  - **Gravimétrico** (melhor exatidão, ±0,2 a 0,5 %): um tanque dosador intermediário sobre célula de carga, que libera o volume de um garrafão por vez. Evita célula de carga na bandeja (que sofreria com a vibração).
  - **Volumétrico por medidor** (±0,5 a 1 %): 1 medidor de engrenagem oval ou mássico (Coriolis) na linha comum + 6 válvulas solenoides, enchendo um garrafão por vez.
  - **Por nível:** evitar, porque o volume do garrafão de vidro soprado varia.
- **Enchimento sequencial com um medidor** (1 garrafão por vez) é mais barato e exato que 6 medidores em paralelo. Tempo: 3,6 L a 0,1 L/s ≈ 36 s por garrafão → ~3,6 min para 6. Hoje a documentação prevê 2 a 3 min: conferir se cabe ou se é preciso dois ramais.
- **Rampa de enchimento (fino/grosso):** vazão alta até ~95 % e vazão baixa no final para cortar com precisão.
- Válvula **na própria face do cabeçote ou engate com válvula de retenção**. Durante a sucussão todas as 4 portas precisam estar fechadas, senão a solução sobe pelas mangueiras (respingo e contaminação cruzada).
- **Álcool 30 % tem ponto de fulgor ≈ 29 °C** (líquido inflamável). Bombas, solenoides e sensores na zona do líquido precisam de avaliação de área classificada; respiro e exaustão de vapores vão para captação, não para a sala.

---

## 6. Pipetagem do ativo (porta ATIVO — 30 mL)

- 30 mL em 3,6 L é a razão que define a potência. O erro de pipetagem entra direto no produto: especificar **±1 % (±0,3 mL) ou melhor**.
- Usar **bomba de deslocamento positivo** para esse volume: bomba seringa, bomba de pistão cerâmico sem válvula (tipo FMI) ou peristáltica de precisão com calibração. Evitar solenoide + tempo.
- **Bico antigotejamento** (válvula de retenção na ponta ou retroaspiração/suck-back) para a última gota não cair depois.
- **Contaminação cruzada entre potências:** cada potência usa o produto da anterior como ativo. Definir linha dedicada por produto/potência ou uma rotina de lavagem validada (água + álcool + ar) com volume morto conhecido e mínimo. Mangueiras curtas e de pequeno diâmetro no trecho do ativo.
- **Definir o método (Hahnemanniano × Korsakoviano / fluxo contínuo):** a sequência REV11 drena e repipeta no mesmo garrafão ("novo lote — mesmo produto"). Se esse for o método, o **resíduo que fica no garrafão depois da drenagem** faz parte da dose e precisa ser medido e controlado (ver 7). Isso deve ser fechado com o responsável técnico/farmacêutico antes do projeto final.

---

## 7. Descarga (porta DRENO + pescador)

- **Pescador Ø7 mm (≈ Ø5 interno) é pequeno demais.** A animação drena 3,6 L em 12 s, o que exigiria 15 m/s no tubo — não é possível por vácuo. Contas:

| Ø interno | Drenar em 30 s | Drenar em 60 s |
|---|---|---|
| 5 mm (atual) | 6,1 m/s ✗ | 3,1 m/s ✗ |
| 8 mm | 2,4 m/s | **1,2 m/s ✓** |
| 10 mm | **1,5 m/s ✓** | 0,8 m/s ✓ |

  → Usar **tubo inox 316L 12×1 (Ø10 interno)** e prever **30 a 60 s de drenagem** no ciclo (a animação de 12 s é otimista).

- **Altura do fundo varia de garrafão para garrafão**, e o fundo do vidro é côncavo. Com pescador de comprimento fixo, ou sobra líquido, ou o tubo bate no fundo. Soluções: **ponta do pescador com mola telescópica** (encosta no fundo com força baixa) ou ponta chanfrada com recorte lateral, referenciada pelo gargalo.
- **Medir o resíduo** após drenagem (pesando o garrafão em teste) e fixar isso na especificação — importante para o ponto 6.
- Pescador **rígido e centralizado** (buchas guia no gargalo): com 1,7 g e 337 mm em balanço dentro do líquido, ele chicoteia e pode bater no vidro.
- Respiro com filtro precisa deixar entrar ar durante a drenagem e sair durante o enchimento, e ficar **fechado na sucussão** (válvula de retenção/solenoide).
- Alternativa à sucção: **pressurizar pelo respiro com ar filtrado ou N₂** (0,2 a 0,3 bar) e empurrar pelo pescador. É mais rápido que vácuo, mas exige verificar a pressão admissível do garrafão de vidro — com vidro, a opção por vácuo baixo é a mais segura.

---

## 8. Mangueiras e cabos em movimento

- São 24 mangueiras (4 × 6 cabeçotes) + cabos de 6 motores e ~24 sensores subindo e descendo 180 mm a ~2 Hz: ≈ 36.000 ciclos por dia de trabalho de 5 min × 60 ciclos.
- Agrupar e passar por **esteira porta-cabos (e-chain)** ou laço livre com raio mínimo definido, preso em um só ponto do carro e um só ponto da estrutura.
- Cabos **com certificação para esteira** (flexão contínua); mangueiras de **silicone platinado ou PTFE/FEP corrugado**, grau alimentício/farmacêutico, compatíveis com etanol.
- Válvulas agrupadas em **manifold fixo** na estrutura, com o mínimo de componentes no carro móvel.

---

## 9. Lista resumida por prioridade

| # | Melhoria | Impacto |
|---|---|---|
| 1 | Biela no plano das guias e no centro de massa | Remove o maior esforço lateral; viabiliza os roletes |
| 2 | Guia por roletes POM/PU Ø80 em eixo Ø40, fixo-flutuante, 12 roletes, níveis ≥ 300 mm, excêntricos | Sem folga, ajustável, tolera desalinhamento, aguenta lavagem |
| 3 | Contrapeso/molas a gás no carro | −40 % de torque; motor/redutor menores; menos vibração |
| 4 | Redutor helicoidal + mancal externo + fixação cônica da manivela | Suporta torque alternado sem folga |
| 5 | Inversor + motofreio + sensor de PMS/contador de golpes | Controle da sucussão por nº de golpes e parada na posição de acoplamento |
| 6 | Fechamento do bocal com mola prato + rosca autotravante + confirmação por sensor | Força de vedação repetível, sem trincar vidro nem abrir na vibração |
| 7 | Tirar massa do topo do mastro (motor embaixo ou fechamento comum às 6 posições) | Fadiga do mastro, confiabilidade |
| 8 | Pescador Ø10 interno, ponta telescópica, drenagem 30-60 s | Drenagem real e resíduo controlado |
| 9 | Dosagem gravimétrica ou por medidor + rampa fino/grosso | Exatidão do volume |
| 10 | Pipetagem por deslocamento positivo, antigotejamento e rotina de limpeza | Exatidão da potência e contaminação cruzada |
| 11 | Todas as portas fechadas na sucussão (válvulas no cabeçote) | Sem respingo nem retorno de produto |
| 12 | Esteira porta-cabos e mangueiras compatíveis | Vida útil |
| 13 | Batentes de PU e contenção de quebra | Segurança |
| 14 | Avaliação de área classificada (etanol 30 %, ponto de fulgor ≈ 29 °C) | Segurança elétrica |

## 10. Dados que faltam para fechar o dimensionamento

1. Frequência de sucussão (golpes/min) e número de golpes por potência.
2. Se o processo exige impacto ou só movimento alternado.
3. Massa real de cada torre/cabeçote e da bandeja (vai sair do CAD).
4. Tolerância de volume (base e ativo) exigida pelo processo/responsável técnico.
5. Método de dinamização (frasco novo por potência × mesmo frasco) e resíduo admissível.
6. Dimensões reais dos garrafões (altura, Ø do gargalo, variação entre lotes).
