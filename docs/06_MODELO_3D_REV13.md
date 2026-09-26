# Modelo 3D REV13: detalhamento para o funcionamento real

**Data:** 24/09/2026 · **Base:** REV12 (`05_MODELO_3D_REV12.md`) + pedidos da revisão

## Arquivos (pasta `REV13`)

| Arquivo | O que é |
|---|---|
| `CMR_REV13_maquina_completa.glb` | 1 máquina completa, carenagem da REV11, ciclo animado de 54 s |
| `CMR_REV13_maquina_sem_carenagem.glb` | O mesmo modelo sem carenagem, portas e tampas, para ver a mecânica |
| `CMR_REV13_previa.png` | Vistas de conferência tiradas do próprio GLB |
| `Blender_REV13/` | `.blend` + scripts `build13.py`/`lib.py`, que regeram o modelo a partir do GLB da REV11 |

Os dois GLBs passaram no validador glTF oficial com 0 erros e 0 avisos.

---

## 1. Berço: copo cônico justo, preso embaixo

- O aro alto no ombro e os 3 montantes saíram. Entrou um **copo usinado em PEAD UHMW** de 150 mm de altura, que segura o terço inferior do garrafão.
- **O perfil interno acompanha a conicidade do vidro:** o garrafão foi modelado com Ø150 no pé e Ø160 no alto do corpo, e o copo copia esse perfil com **liner de PU de 2 mm** e 0,5 mm de folga. Quando o garrafão desce, ele encaixa e trava no cone, sem folga lateral.
- **O cabeçote prende por cima:** a força das molas empurra o garrafão para dentro do cone. Sem contato no ombro, sem carga pontual no vidro.
- Fundo com disco de PU de 4 mm, furo de dreno e fixação por 4 parafusos por baixo da bandeja.
- **2 rasgos para os dedos (frente e trás)**, 70 mm de profundidade, para tirar o garrafão com o encaixe justo.
- A medir no garrafão real: diâmetro do pé, diâmetro a 150 mm de altura e variação entre lotes. A conicidade do copo deve ser usinada com base nessas medidas.

## 2. Sobe e desce: rodas de nylon usinado com rolamento real

- **Roda:** nylon PA6G usinado (tipo Nylatron), Ø62 × 24 mm, canal côncavo R20,5 para eixo Ø40.
- **Rolamentos:** 2 × **6201-2RS** (12 × 32 × 10) por roda, prensados no cubo. Aparecem anel externo, vedação azul e anel interno.
- **Eixo da roda:** parafuso de ombro Ø12 inox, espaçadores tubulares dos dois lados, arruelas, cabeça sextavada e porca autotravante.
- **Regulagem:** bucha excêntrica sextavada (vermelha) em 1 roda de cada par, para zerar a folga.
- **Carro:** caixa de chapas de 12 mm aparafusadas, com janelas para ver e regular as rodas. Raspador de feltro em cima e embaixo, fole de proteção.
- **Guia:** blocos SK40 com fenda de aperto, chapas-base aparafusadas na longarina, montante 60×80 com pé e mão francesa.
- **Travessa:** tubo 100×60 com flanges aparafusados nas chapas internas. Garfo usinado com pino Ø20 h6 e anéis elásticos. Cantoneiras ligam a bandeja ao carro.
- **Biela:** cabeça com chapéu aparafusado, terminal rotular GE20 e rosca de ajuste com contraporca.
- **Acionamento:** mancal UCP209 com graxeira, volante com cubo de anel cônico, contrapeso aparafusado e molas a gás com pinos esféricos.
- **Ponte:** perfil de alumínio 60×60 com rasgos T, porca flangeada de bronze Tr20×4, buchas LMF20 flangeadas e **foles nos 4 fusos** (esticam e encolhem com a ponte). Proteção de chapa na correia HTD sob a bandeja.
- Nylon PA6G absorve umidade (cerca de 2 a 3 %). Por isso: folga de montagem no cubo, bucha excêntrica para reajuste e preferência por PA6G com óleo ou MoS₂.

## 3. Bocal (cabeçote) com as conexões reais

| Função | Conexão no topo | O que entra no garrafão |
|---|---|---|
| **DRENO** | Conexão de compressão para tubo 12 mm (centro) | Pescador 316L 12×1 até o fundo, ponta telescópica de PTFE com mola |
| **BASE** | Conexão de compressão 10 mm | Bico 10×1 que termina 45 mm abaixo da boca (jato na parede, menos espuma) |
| **ATIVO** | Conexão de compressão 1/8" | Capilar de PTFE 1/8" que termina 60 mm abaixo da boca (gota não fica pendurada) |
| **RESPIRO** | Conexão de compressão 8 mm | Só o espaço de cabeça (não entra no líquido) |

- Corpo 316L usinado, face com **junta EPDM** no lábio do gargalo e saia cônica que centraliza.
- O cabeçote fica num **braço porta-cabeçote** preso na ponte. São 2 pinos-guia com bucha de bronze e **2 molas de compressão** (8 mm de curso) e um sensor que confirma o fechamento. O LED verde acende quando a mola está comprimida.
- Gargalo interno considerado: cerca de 30 mm. Confirmar no garrafão real, porque os 3 tubos internos (12 + 10 + 3,2 mm) precisam caber.

## 4. Caminho das mangueiras

Cabeçote → sobe acima da ponte → **calha porta-mangueiras** sobre a ponte (1 via por mangueira) → entra na **esteira porta-cabos larga** (110 mm, raio 75 mm) → sobe até o compartimento superior pela abertura da chapa → sai para cada válvula.

São 4 mangueiras individuais por garrafão (24 no total), sem mistura entre postos, com cores por função: azul = base, laranja = ativo, verde = dreno, lilás = respiro.

## 5. Topo: válvulas individuais passando por bomba (como na REV11)

- **BASE:** bomba centrífuga sanitária de 0,55 kW (lateral técnica) com filtro na sucção → riser → coletor DN20 por fileira → **medidor de vazão de engrenagem oval + válvula solenoide de diafragma por garrafão** (6 + 6).
  - **Modo padrão:** enchimento **simultâneo**, cada válvula fecha quando o **seu** medidor chega a 3,6 L. Na animação cada garrafão termina num tempo diferente.
  - **Modo de reserva:** enchimento simultâneo **por tempo** (mesmo hardware, sem depender dos medidores). Serve para teste ou se um medidor falhar.
- **ATIVO:** tanque 316L de 5 L sobre célula de carga → **bomba peristáltica de 6 canais** (1 cabeça por garrafão) → mangueira direta ao cabeçote. Dosagem volumétrica simultânea; o canal peristáltico já bloqueia, então não precisa de válvula.
- **DRENO:** 6 válvulas individuais → coletor → riser → tanque receptor a vácuo de 26 L (lateral técnica).
- **RESPIRO:** 6 válvulas individuais → coletor → filtro de carvão ativado e exaustão. Abertas no enchimento e na drenagem, **fechadas na sucussão**.
- Placa de válvulas por fileira, com etiquetas por função, abraçadeiras e LED em cada bobina (acende quando a válvula abre).

## 6. Ciclo animado (54 s, comprimido)

| t (s) | Etapa |
|---|---|
| 0–2 | Garrafões encaixados nos copos, pontes elevadas |
| 2–6 | Pontes descem, molas comprimem, LEDs dos cabeçotes acendem |
| 6,5–15 | **Base simultânea:** 6 válvulas abertas; cada uma corta pelo seu medidor (14,2 a 15,0 s) |
| 15,6–19,4 | **Ativo simultâneo:** a peristáltica gira e as 6 gotas caem |
| 20 | Respiros fecham |
| 23–35 | Sucussão (20 golpes a 120 golpes/min, parada no PMI) |
| 37–47 | Drenagem: válvulas de dreno e respiro abertas; o receptor enche |
| 47–51 | Pontes sobem |

## 7. A confirmar para fechar o projeto

1. Medidas reais do garrafão (pé, corpo a 150 mm, gargalo interno, altura total).
2. Tolerância de volume da base e do ativo, para escolher a classe do medidor e da peristáltica.
3. Pressão e vazão da alimentação da base (define a bomba e o DN do coletor).
4. Compatibilidade química da junta (EPDM) e das mangueiras (PFA/silicone) com a solução alcoólica e a limpeza.
