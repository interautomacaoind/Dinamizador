# Cenário da sala de dinamização (REV16) com som

**Data:** 26/09/2026 · **Base:** máquina REV15 carenada, adaptada para a sala (REV16)

## O que foi entregue (pasta `CENARIO_SALA`)

| Arquivo | O que é |
|---|---|
| `web/` | Página WebXR: `index.html` + `app.js` + `lib/` (three.js r169) + `assets/` (modelos e roteiro) |
| `CENARIO_SALA_site.zip` | Conteúdo da pasta `web`, pronto para subir no GitHub Pages |
| `Renders/` | 11 imagens dos momentos principais |
| `Blender_cenario/` | Scripts que geram tudo: sala, pessoas, animação, máquina REV16 e otimização |

O GLB não carrega som. Por isso a cena é uma **página web**: ela carrega os modelos GLB e toca o som espacial sincronizado com a animação. Funciona no PC, no celular e no **navegador do Meta Quest** (botão ENTER VR).

## Como abrir

**No Meta Quest (VR, escala real):** o WebXR só funciona em endereço **https**. O caminho mais simples é o GitHub Pages:
1. Crie um repositório no GitHub (ex.: `dinamizador-sala`).
2. Envie o conteúdo do `CENARIO_SALA_site.zip` (o `index.html` fica na raiz).
3. Vá em Settings → Pages → Branch `main` / pasta `/root` → Save.
4. No navegador do Quest, abra `https://SEU_USUARIO.github.io/dinamizador-sala/` e toque em **ENTER VR**.

**No PC:** o arquivo não abre com duplo clique, porque os módulos JavaScript precisam de servidor. Na pasta `web`, rode `python -m http.server 8000` e abra `http://localhost:8000`. Também dá para usar o link do GitHub Pages.

**Controles:**
- Quest: analógico esquerdo anda, analógico direito gira 30°, **A** reproduz/pausa, **B** troca a velocidade (1×/2×/4×).
- PC: arraste para girar, use a roda do mouse para aproximar, e escolha câmeras prontas (visão geral, seguir operadora, seguir supervisor, M1, TV, tanque). Barra de tempo, velocidade e botão de som.

## Realidade aumentada (AR)

A página tem dois botões de AR, além do ENTER VR:
- **AR 1:1:** usa o passthrough do Quest. As paredes, o piso e o forro virtuais somem, e as máquinas, o tanque, as bancadas, as pessoas e a tubulação aparecem em tamanho real no seu ambiente.
- **AR maquete 1:20:** a sala inteira vira uma maquete de 0,5 × 0,75 m sobre uma mesa.

**Uso:**
- Aponte para o piso ou para a mesa até aparecer o anel verde e aperte o gatilho para posicionar. Se não aparecer, a cena é posicionada à sua frente depois de 1,5 s.
- Analógico esquerdo arrasta a cena. Analógico direito gira; na maquete, o direito também ajusta a altura.
- A reproduz ou pausa; B troca a velocidade.

Funciona no navegador do Quest e no Chrome do Android com ARCore, sempre por https (GitHub Pages). No iPhone o Safari não tem WebXR. O link do claude.ai serve só para ver no PC e no celular, sem VR e sem AR.

## A sala

| Item | Posição / medida |
|---|---|
| Sala | 10 × 15 m, pé-direito 4,5 m, piso epóxi cinza com rodapé sanitário, painéis brancos, forro modulado |
| Porta de entrada | Canto frontal direito, 1,2 m, com visor, mola aérea e antecâmara |
| 4 máquinas | M1/M2 na parede direita e M3/M4 na esquerda, frentes voltadas para o corredor central, 1 m livre atrás (portas traseiras P4–P6) |
| Tanque de passagem TQ-01 | Centro da sala, inox 316L, 250 L, 3 pés com células de carga, visor de nível, bomba de transferência e pedestal com botão TRANSFERIR |
| Bancada de mármore 1 | Parede do fundo, 2 cubas e **2 torneiras** da mesma solução base das máquinas (ramal da linha principal) |
| Bancada de mármore 2 | Parede frontal, bandeja com 24 frascos âmbar de 200 mL, suporte de pipetas, prancheta e caixa de luvas |
| 2 mesas de inox | Corredor central, na frente e atrás do tanque |
| Tubulação aérea | Solução base (faixa azul) a 4,1 m e 3,55 m, com descida para cada máquina · Produto (faixa verde) a 3,25 m, das máquinas até o TQ-01 · Transferência (faixa verde) a 3,9 m, do TQ-01 para a sala de tanques |
| TV 95" | Parede do fundo, a 3 m de altura, com indicadores ao vivo |
| Outros | Relógio de parede analógico, 15 luminárias LED herméticas, difusores de ar, grelhas de retorno, placas M1–M4, placa de EPI, extintor, álcool gel e faixas amarelas no piso |

## Máquina REV16 (versão sala)

- **Ativo por injeção manual:** a peristáltica saiu. Entrou uma **estação com 6 funis (P1–P6)** na lateral esquerda, junto à frente, a 1,05 m de altura, com o botão verde **ATIVO OK**. A operadora pipeta 1 mL em cada funil, e a linha de PTFE leva o ativo até o capilar do cabeçote de cada garrafão.
- **Programa de 2 ciclos:** o segundo ciclo começa sozinho depois do primeiro. A máquina enche e fica esperando o ativo, com a torre **amarela piscando** e a IHM mostrando **INJETAR ATIVO P1–P6**.
- As portas não abrem no ciclo, porque os garrafões ficam na máquina.
- Conexões no teto: **BASE** (entrada da solução) e **PRODUTO** (saída para o TQ-01).
- Só neste modelo de cena, as peças escondidas dentro da carenagem foram removidas e as malhas foram unidas, para rodar 4 máquinas no Quest.

A IHM e a torre de cada máquina são desenhadas ao vivo pela página: PRONTA → FECHANDO CABEÇOTES → DOSANDO SOLUÇÃO BASE (barras por posição) → INJETAR ATIVO (✔ em cada funil) → ATIVO → GARRAFÕES → DINAMIZANDO (contagem de 5:00 e golpes até 600) → DRENANDO → TQ-01 → CICLO/LOTE CONCLUÍDO.

## Roteiro (tempo real ≈ 6 min · simulado 07:00 → 07:36)

O tempo simulado corre **6× mais rápido** que o real. A mistura dura 50 s reais, que são **5:00 min simulados** no relógio, na IHM e na TV.

| Real | Simulado | Evento |
|---|---|---|
| 0:02 | 07:00 | A operadora (jaleco e touca) entra pela porta |
| 0:09–0:32 | 07:00–07:03 | Ela vai a cada IHM e inicia M1, M2, M3 e M4. As máquinas fecham os cabeçotes e dosam a base |
| 0:37 | 07:04 | Pega o frasco âmbar de 200 mL e a pipeta na bancada |
| 0:47–2:11 | 07:05–07:13 | Injeta P1–P6 em cada máquina, na ordem M1→M4, e aperta ATIVO OK. Cada máquina começa a dinamizar |
| 1:13–2:11 | 07:07–07:13 | O supervisor entra com o tablet, olha M1, M2, a TV, M3 e M4, e sai |
| 2:18–3:26 | 07:14–07:20 | Fim do 1º ciclo: dreno para o TQ-01 e reinício automático |
| 2:40–4:08 | 07:16–07:25 | 2ª rodada de injeção |
| 5:22 | 07:32 | Fim do 2º ciclo da última máquina |
| 5:24 | 07:32 | Ela aperta **TRANSFERIR**: o TQ-01 (172,8 L) vai para a sala de tanques |

## Indicadores na TV (tempos simulados)

| Máquina | Ciclo 1 | Espera pelo ativo | Ciclo 2 | Espera pelo ativo |
|---|---|---|---|---|
| M1 | 12:53 | 3:38 | 11:26 | 2:11 |
| M2 | 14:20 | 5:05 | 11:26 | 2:11 |
| M3 | 15:53 | 6:37 | 11:26 | 2:11 |
| M4 | 17:19 | 8:04 | 11:26 | 2:11 |

- **2 ciclos das 4 máquinas:** 31:20 min · **produzido:** 8 × 21,6 L = **172,8 L**.
- **Meta do dia (8 h contínuas):** tempo médio de ciclo 13:16 → 36 ciclos por máquina × 4 × 21,6 L = **3.110 L/dia**.
- A TV atualiza a cada ciclo concluído: o ciclo novo aparece em destaque e toca um aviso sonoro.

**Leitura prática:** sem espera, o ciclo da máquina fica em cerca de 9 min 15 s. Com **uma operadora pipetando 24 funis**, a injeção manual vira o gargalo: no 1º ciclo a M4 esperou 8 min. Algumas saídas:
- escalonar os inícios, cerca de 2,5 min entre máquinas;
- ter um segundo operador na partida;
- usar um dispensador de volume fixo (repipetador) nos 6 funis.

## Som (sintetizado e espacial, sincronizado ao roteiro)

| Som | Quando toca |
|---|---|
| Motor e golpe | Um golpe por volta da manivela, durante a dinamização |
| Bomba de dosagem | Enchimento e envio do ativo |
| Bomba de vácuo | Dreno |
| Motores dos cabeçotes | Descida e subida |
| Estalos de válvula | Início e fim de cada etapa |
| Bipes | Toques na IHM, funis, botões e aviso de ciclo concluído |
| Porta | Abertura e fechamento |
| Passos | Da operadora e do supervisor |
| Bomba de transferência | Transferência do TQ-01 |
| Ar-condicionado | Ruído de fundo |

O som é espacial: fica mais alto perto de cada máquina e acompanha a cabeça no Quest.

## Pessoas

As duas pessoas foram montadas a partir da malha base e dos alvos do **MakeHuman** (licença CC0 para os modelos gerados): operadora com cerca de 1,63 m e supervisor com cerca de 1,78 m. Têm pele, olhos, sobrancelhas, jaleco, touca descartável sanfonada (branca na operadora, azul no supervisor), calça e sapatos. A animação é procedural, com cinemática inversa: passos sem escorregar, braços balançando, cabeça olhando para a IHM, a TV e o tablet, mãos alcançando a IHM, os funis e os botões, e dedos segurando o frasco, a pipeta e o tablet.

**Limitações:** não é captura de movimento e o rosto não tem expressão. Com as 4 máquinas completas, a cena tem cerca de 0,8 milhão de triângulos e 700 chamadas de desenho. Roda bem no Quest 3; no Quest 2 pode ficar abaixo de 72 fps.

## Arquivos técnicos

`layout.py` (posições e caminhos), `timeline.py` (roteiro), `room.py` (sala), `human.py` (pessoas), `anim.py` (animação, cinemática inversa e exportação), `machine16.py` (máquina da sala), `glbopt.py` (reduz chaves de animação e converte texturas em JPEG), `textures.py`. Para mudar o roteiro (outra ordem, 2 operadores, tempos), basta editar o `timeline.py` e gerar de novo.
