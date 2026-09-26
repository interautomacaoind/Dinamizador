# REV14: garrafão real, retirada garantida, guia simétrica e lista de equipamentos

**Data:** 24/09/2026 · **Base:** REV13 + medidas do garrafão (fotos de 24/09)

## Arquivos (pasta `REV14`)

| Arquivo | O que é |
|---|---|
| `CMR_REV14_maquina_completa.glb` | Máquina completa, ciclo de 60 s, com abertura da porta e **retirada de um garrafão** |
| `CMR_REV14_maquina_sem_carenagem.glb` | O mesmo modelo sem carenagem, para ver a mecânica |
| `CMR_REV14_previa.png` | Vistas de conferência tiradas do GLB |
| `Blender_REV14/` | `.blend` (zipado) + `build14.py` / `lib.py` |

Os dois GLBs passaram no validador glTF oficial com 0 erros e 0 avisos.

---

## 1. Garrafão com as medidas reais

| Medida | Valor | Origem |
|---|---|---|
| Altura total | **353 mm** | Medida (trena) |
| Diâmetro do pé | **Ø153 mm** | Medida (vista de fundo) |
| Boca externa | **Ø33 mm** | Medida |
| Boca interna | **~Ø21 mm** | Estimada na foto (confirmar com paquímetro) |
| Corpo máximo | Ø176 mm a ~135 mm de altura | **Estimada** pela foto e pelo volume de 5 L (confirmar) |
| Volume útil | ~5,0 L até o gargalo; **3,6 L = 180 mm de altura** | Calculado pelo perfil |

O corpo abre do pé (Ø153) até cerca de 120 mm de altura. Esse cone é o que o copo usa para o encaixe justo.

## 2. Copo (base do garrafão)

- **Altura de 120 mm** (era 150), usinado em UHMW, com liner de PU de 2 mm acompanhando a conicidade real (Ø153 no pé → cerca de Ø172 a 104 mm de altura).
- 2 rasgos para os dedos, disco de PU no fundo, dreno e **sensor capacitivo de garrafão presente** sob cada copo.

## 3. Retirada do garrafão: resolvido

| | REV13 | REV14 |
|---|---|---|
| Elevação da ponte | 420 mm | **520 mm** |
| Altura do copo | 150 mm | **120 mm** |
| Quanto o garrafão sobe para sair | 154 mm | **124 mm** |
| Folga entre a ponta do pescador e a boca durante a retirada | **−80 mm (batia)** | **+47 mm** |
| Topo das colunas no ponto morto superior (curso da sucussão) | — | 2,59 m (piso superior em 2,617 m) |

A animação mostra: pontes sobem → porta frontal abre → garrafão do centro da frente sobe 124 mm, sai do copo e sai pela porta.
A travessa de topo inteira das colunas foi removida, porque cruzava a esteira. Cada coluna agora tem sua placa de topo (fuso + guia).

## 4. Guia simétrica

- O lado esquerdo agora tem as mesmas **8 rodas** do lado direito (4 frente/trás + 4 interno/externo), total de **16 rodas** e **32 rolamentos 6201-2RS**.
- **Função fixo × flutuante pela regulagem:** do lado direito as excêntricas zeram a folga; do lado esquerdo as rodas interno/externo ficam com **0,3 mm de folga**. Assim o lado esquerdo absorve erros de paralelismo sem travar, mas com a mesma construção dos dois lados. Uma só peça de reposição, montagem idêntica.

## 5. Cabeçote reprojetado para o gargalo Ø21

Três tubos (12 + 10 + 3,2 mm) não cabem num gargalo de 21 mm. Mudança de conceito:

- **Pescador 12×1 = linha de PROCESSO:** faz o **enchimento pelo fundo** e a **drenagem**, pelo mesmo tubo. Encher pelo fundo também reduz espuma e respingo.
- **Capilar de PTFE 1/8"** para o ativo (termina 60 mm abaixo da boca).
- **Respiro** só no espaço de cabeça, por um canal no corpo do cabeçote.
- Folga no gargalo: 12 + 3,2 mm num furo de 21 mm, com cerca de 2 mm entre os tubos e a parede.
- Junta de EPDM no lábio (Ø21–33) e saia cônica que centraliza no Ø33.
- **3 mangueiras por garrafão** (processo Ø16, ativo 1/8", respiro Ø10), 18 no total.

## 6. Topo: bomba + válvulas individuais + medidores (dimensões comerciais)

Por garrafão: **medidor + válvula BASE → tê de processo ← válvula DRENO**, mais a válvula de RESPIRO. As 3 válvulas ficam lado a lado, cada uma na sua coluna de descida, e os coletores ficam atrás das válvulas.

Dimensões usadas no modelo:

- **Válvula solenoide 3/8":** corpo 60 × 40 × 42 mm, bobina Ø32 × 50 mm, conector DIN 28 × 28 × 18 mm, LED de aberta.
- **Medidor de engrenagem oval 3/8":** 60 × 55 × 53 mm, com registro/transmissor de pulsos Ø48.
- **Bomba peristáltica multicanal:** gabinete de 330 × 160 × 160 mm, 6 cassetes.
- **Centrífuga sanitária:** motor Ø136 (carcaça 71) + voluta Ø156.
- **Receptor a vácuo:** Ø240 × 580 mm.

---

## 7. Lista de equipamentos sugeridos (por máquina)

> As referências de fabricante são de linhas de produto conhecidas, só para balizar dimensão e custo. **Confirmar no catálogo** (vazão, pressão mínima, materiais e certificação Ex) antes de comprar.

### 7.1 Dosagem da base (3,6 L por garrafão)

| Qtd | Equipamento | Especificação sugerida | Observação |
|---|---|---|---|
| 1 | Bomba centrífuga sanitária | Inox 316L, 0,55 kW, cerca de 2 m³/h a 15 mca, conexão clamp 1" | Referências: Inoxpa, Alfa Laval, fabricantes nacionais de bombas sanitárias. Com inversor, a pressão da linha fica constante. |
| 1 | Filtro cartucho na sucção | 5 µm, carcaça inox | Protege os medidores de engrenagem |
| 1 | Válvula de retenção no recalque | Inox 3/4" | |
| 1 | Transmissor de pressão | 0–6 bar, 4–20 mA | Controle da bomba |
| 1 | Manômetro | Ø63, glicerina, 0–4 bar | |
| 6 | **Medidor de vazão de engrenagem oval** | Inox, 3/8", cerca de 0,5–10 L/min, saída de pulsos, ±0,5–1 % | Referências: Macnaught, Kobold, Oval Corp. Corta cada garrafão em 3,6 L. |
| 6 | **Válvula solenoide BASE** | 2/2 NF, servo-diafragma, inox, 3/8", vedação EPDM | Referência: Bürkert tipo 6213 / ASCO. **Exige ΔP mínimo de ~0,2 bar**, que a bomba garante. |
| 2 | Coletor DN20 inox | 1 por fileira | |

**Enchimento:** as 6 válvulas abrem juntas e cada uma fecha no seu medidor. Com cerca de 4 L/min por garrafão, o enchimento leva cerca de 55 s. **Modo de reserva por tempo** no mesmo hardware.

### 7.2 Pipetagem do ativo (30 mL por garrafão)

| Qtd | Equipamento | Especificação sugerida | Observação |
|---|---|---|---|
| 1 | **Bomba peristáltica multicanal** | 6 a 8 canais com cassete, tubo PharMed/Viton de 2,8 mm DI, ±1 % | Referências: Ismatec IPC, Watson-Marlow multicanal. Os 30 mL saem em ~60 s em paralelo. |
| 1 | Tanque de ativo | 316L, 5 L, com visor | |
| 1 | Célula de carga do tanque de ativo | 10 kg, C3 | Confere o total dosado (6 × 30 mL) |
| 6 | Capilar PTFE 1/8" | Cabeçote → bomba | Linha dedicada por garrafão, sem válvula (o canal da peristáltica bloqueia) |

### 7.3 Descarga (drenagem pelo pescador)

| Qtd | Equipamento | Especificação sugerida | Observação |
|---|---|---|---|
| 6 | **Válvula solenoide DRENO** | 2/2 NF, **ação direta ou força-assistida (funciona com ΔP 0)**, inox, 3/8" | Com vácuo, uma servo-diafragma comum não abre direito |
| 1 | Tanque receptor a vácuo | 316L, 26 L, visor, vacuostato | Recebe os 21,6 L por ciclo |
| 1 | **Bomba de vácuo de membrana** | Resistente a solventes, ~6 m³/h, −0,6 bar | Melhor que palhetas com óleo, porque o vapor de etanol contamina o óleo |
| 1 | Condensador/separador na descarga do vácuo | | Recolhe o vapor de álcool |
| 1 | Bomba de transferência receptor → armazenagem | Diafragma pneumática 1/2" ou centrífuga sanitária | |

### 7.4 Respiro

| Qtd | Equipamento | Especificação sugerida |
|---|---|---|
| 6 | Válvula solenoide RESPIRO | 2/2 NF, ação direta, inox, 1/4"–3/8" (fecha na sucussão) |
| 1 | Filtro de carvão ativado + exaustão | Na saída do coletor de respiro |

### 7.5 Cabeçotes, copos e mangueiras

| Qtd | Item | Especificação |
|---|---|---|
| 6 | Cabeçote usinado | 316L, 3 conexões de compressão (12 mm, 1/8", 8 mm), junta EPDM, saia cônica |
| 6 | Pescador | Tubo 316L 12×1 com ponta telescópica de PTFE com mola |
| 12 | Molas de compressão do cabeçote | Inox, curso de 8 mm |
| 6 | Sensor indutivo "mola comprimida" | M8, PNP |
| 6 | Copo cônico | UHMW usinado, 120 mm, com liner de PU de 2 mm |
| 6 | Sensor capacitivo "garrafão presente" | M18, sob o copo |
| ~15 m | Mangueira de processo | 12×16, PFA/FEP ou silicone platinado |
| ~15 m | Capilar de ativo | PTFE 1/8" |
| ~15 m | Mangueira de respiro | 6×10, PFA |
| 2 | Esteira porta-cabos | Interno ~100 × 30 mm, R75, cerca de 1,1 m cada |

### 7.6 Sobe e desce (sucussão)

| Qtd | Item | Especificação |
|---|---|---|
| 1 | Motor | 1,5 kW 4P IE3, com freio (WEG W22 ou similar) |
| 1 | Redutor | Cônico-helicoidal, i ≈ 14,5, saída 45 mm |
| 1 | Inversor de frequência | 1,5 kW, com STO |
| 1 | Mancal externo | UCP209 |
| 1 | Biela | L = 450 mm, rolamento na cabeça, terminal rotular GE20 |
| 2 | Mola a gás | 600 N, curso ≥ 200 mm |
| 2 | Eixo guia | Ø40 h7, temperado e cromado, 770 mm |
| 4 | Suporte de eixo | SK40 |
| 16 | Roda de nylon PA6G usinado | Ø62 × 24, canal R20,5 |
| 32 | Rolamento | 6201-2RS inox |
| 16 | Parafuso de ombro | Ø12, inox, com porca autotravante e espaçadores |
| 8 | Bucha excêntrica | Regulagem das rodas |
| 1 | Sensor indutivo | M18, PMI / contador de golpes |

### 7.7 Pontes de fechamento

| Qtd | Item | Especificação |
|---|---|---|
| 4 | Fuso | Tr20×4 (autotravante) + porca flangeada de bronze |
| 4 | Guia | Ø20 h6 + bucha LMF20 |
| 2 | Motorredutor | 90 W com freio |
| 2 | Correia | HTD 5M + 3 polias por ponte |
| 4 | Sensor de fim de curso da ponte | Alto e baixo |
| 8 | Fole de proteção dos fusos | |

---

## 8. Segurança e pontos a confirmar

1. **Solução com 30 % de álcool (ponto de fulgor ~29 °C):** fazer a classificação de área. Bobinas das válvulas, bombas e sensores na zona do líquido podem precisar de proteção Ex. A alternativa são válvulas pneumáticas com a ilha de válvulas dentro do painel.
2. Medir com paquímetro a **boca interna** e o **diâmetro máximo do corpo** do garrafão (os dois foram estimados).
3. Confirmar a tolerância de volume (base ±? mL, ativo ±? mL), para fechar a classe do medidor e da peristáltica.
4. Pressão disponível no tanque externo de base e distância até a máquina, para dimensionar a bomba.
