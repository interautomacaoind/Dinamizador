# Imersão total + Espaço Memória Grupo Real (REV18)

**Abrir:** https://interautomacaoind.github.io/Dinamizador/ (Assistir) · https://interautomacaoind.github.io/Dinamizador/?modo=operar (Operar)
Falhas: acrescente `&falhas=todas` (ou `sensor`, `garrafao`, `solucao`, `motor`). Guiado desligado: `&guiado=0`.

## 1. Imersão no modo Operar

| Recurso | Como funciona |
|---|---|
| **EPI na entrada** | Álcool gel ao lado da porta → caixa de luvas na bancada → quadro "Checklist de entrada" (touca/jaleco). Com as luvas, as mãos ficam azuis (luva nitrílica). Operar sem EPI gera alerta no relatório. |
| **Rastreabilidade do lote** | Tablet na mesa inox: 1º toque lê o lote do ativo (26-0925); ao fim dos 8 ciclos, 2º toque assina o registro. |
| **Botões físicos** | Em cada máquina: INICIAR (verde), PARAR, REARME (azul) e cogumelo de EMERGÊNCIA. Emergência trava a máquina; destrave (novo toque) → REARME → INICIAR reinicia o ciclo. |
| **Toque direto** | No Quest com hand-tracking (ou ponta da luva no controle), basta encostar o dedo na IHM, botões, portas, painel do TQ-01, gel, luvas, quadro e tablet. |
| **Vibração** | Pulso no controle ao apertar botões, pegar/encaixar objetos e ao encostar a mão numa máquina dinamizando. |
| **Pegar e carregar (grip)** | Frasco de ativo, garrafões (com cabeçote aberto e porta aberta), produtos do Espaço Memória. Garrafão tem "peso": com uma mão ele atrasa, com as duas acompanha. Ao soltar perto da vaga, encaixa (som + vibração); solto no ar, cai até a superfície abaixo. |
| **Carrinho inox** | Com rodízios, 6 vagas em cima (retirados) e 6 embaixo (2 garrafões reserva). Segure a alça com o grip para empurrar. No celular/PC: toque no garrafão para levá-lo entre máquina e carrinho. |
| **Ocorrências de queda** | Frasco ou garrafão derrubado no piso: som de vidro e ocorrência registrada. |
| **Líquido visível** | A pipeta enche (âmbar) ao aspirar, mostra um filete ao dispensar e a solução do garrafão ganha tonalidade após a pipetagem. |
| **Sons novos** | Tampa do bocal, encaixe do garrafão, vidro, gel, luva e enchimento durante a dosagem (espacial por máquina). |
| **Modo guiado** 🧭 | Seta verde 3D sobre o próximo passo + texto na tela. Botão 🧭 liga/desliga (sem guia = modo avaliação). |

## 2. Falhas simuladas (seletor na barra)

| Falha | Quando | O que fazer |
|---|---|---|
| Sensor do bocal | M2 · ciclo 1 · P3: dose aplicada sem leitura | Reposicionar a ponteira **sem dispensar de novo** (dispensar de novo = dose dupla) |
| Garrafão trincado | M3 · ciclo 1 · 40 s de mistura: vazamento, poça cresce | PARAR ou EMERGÊNCIA → abrir porta traseira → G5 para o carrinho → reserva na vaga → fechar → REARME/INICIAR |
| Falta de solução | M4 · ciclo 1 · metade da dosagem | Tocar a IHM (solicitar reposição) → dosagem retoma em 0:45 |
| Motor | M1 · ciclo 2 · 60 s de mistura: inversor desarma | Aguardar 20 s → REARME → INICIAR (ciclo reiniciado) |

O relatório na TV ganhou o quadro **CONFORMIDADE**: EPI, leitura/assinatura do lote, cenário, ciclos reiniciados, tempos de reação às falhas e garrafões retirados.

Não implementado: oclusão por profundidade do Quest 3 (mãos reais escondendo objetos virtuais no AR) — depende de suporte `depth-sensing` do navegador e custa desempenho; fica como etapa futura.

## 3. Espaço Memória · Grupo Real (sala 5 × 5 m)

- **Segunda porta** na parede de entrada, à esquerda (vão 1,15 × 2,20 m, batente inox, visor de vidro, placa "ESPAÇO MEMÓRIA" dos dois lados). Clique/toque/dedo na porta: ela abre para dentro da sala nova; de novo, fecha. Funciona em Assistir, Operar, VR e AR.
- Câmeras novas: **Porta do Espaço Memória** e **Espaço Memória (Grupo Real)**.
- Piso de madeira, lambris verde com friso dourado, iluminação quente.
- **Parede do fundo:** painel "GRUPO REAL · Real H · CMR Saúde · Homeopet" e quadro do fundador (ilustração, sem foto) + placa de fontes.
- **Quadros (linha do tempo):**
  - 1985 – loja de produtos veterinários em Ribas do Rio Pardo (MS)
  - 1987 – nasce a Homeopatia Populacional (Prof. Dr. Claudio Martins Real)
  - 1989 – fábrica de Sal Mineralizado Real
  - 2009 – linha Homeopet (cães e gatos)
  - 2019 – exportações (Bolívia, Guatemala; presença em Paraguai, México, Colômbia)
  - 2023 – nasce a marca CMR Saúde (Expogrande 2023; CMR = Claudio Martins Real)
  - Hoje – Grupo Real: sede em Campo Grande, fábrica em Cuiabá, +330 profissionais, +15 milhões de bovinos
  - Lab. – maior laboratório de homeopatia veterinária da América Latina
- **Vitrine CMR** (2 balcões, 8 produtos com cartão de indicação): CMR VET (pomada cicatrizante), Homeopet (pomada cães e gatos), Carrapat 100, Parasit 100, Sacsom, Sodo 100, Pró-Cio, Dermosan MD. Toque gira o produto e mostra a indicação; no Quest dá para pegar com o grip (ao soltar, volta ao lugar).
- **Pedestal central:** miniatura 1:5 girando da dinamizadora CMR REV17.
- Embalagens e retrato são **ilustrativos** (sem logotipos ou fotos oficiais). Antes de uso comercial, validar textos e nomes de produtos com o marketing do Grupo Real.

### Fontes
- Grupo Real – Quem somos: https://gruporealbr.com.br/quem-somos
- Grupo Real – Nova marca CMR: https://gruporealbr.com.br/noticias/nova-marca-cmr
- CMR Saúde – Sobre nós: https://www.cmrsaude.com.br/sobre-nos
- Campo Grande News: https://www.campograndenews.com.br/lado-b/consumo/em-campo-grande-esta-um-dos-precursores-da-homeopatia-no-brasil
- Portal DBO – Real H 40 anos: https://portaldbo.com.br/de-maconha-para-o-boi-ao-mercado-internacional-real-h-faz-40-anos-torna-se-grupo-e-surfa-na-pecuaria-sustentavel/
- O Presente Rural – Real H 35 anos: https://opresenterural.com.br/real-h-completa-35-anos-com-muita-saude-e-folego/
- Homeopet (varejo): https://www.drogariasaopaulo.com.br/homeopatia-para-caes-e-gatos-pomada-cmr-homeopet-9033817/p
- CMR VET (varejo): https://www.isophos.com/produtos-veterinarios/vacinas-e-homeopaticos/cmr-vet-cicatrizante-190g-realh
- Real H – CMR VET: https://realh.com.br/noticias/pecuaria-forte/cmr-vet-a-pomada-cicatrizante-que-nao-pode-faltar-na-sua-propriedade/

## Arquivos
- `app.js`: blocos `ESPAÇO MEMÓRIA` (antes do modo Operar) e `IMERSÃO` (dentro do modo Operar); estados novos PARADA, EMERGÊNCIA, FALHA e FALTA DE SOLUÇÃO na IHM/torre.
- `index.html`: câmeras novas, faixa do guia, ajuda.
