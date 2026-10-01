# REV21 · Sala com 4 dinamizadoras de 3 garrafões de 10 L — processo completo com som

**Página principal (GitHub Pages):** https://interautomacaoind.github.io/Dinamizador/
A sala anterior (4 × REV17, 6 × 5 L, com o modo **Operar**) continua em `rev17.html`. A apresentação REV20 continua em `apresentacao.html`.

## 1. O que mudou
- As **4 máquinas** (M1–M4) agora são a **REV20 3G**: 3 garrafões de 10 L em linha, borosilicato 3.3 graduado, tampa GL80 rosqueada com inserto de 4 conexões e uniões, fixação por **cilindro pneumático** no ombro, acesso **só pela frente** (2 folhas de porta).
- Modelos gerados no navegador (`maq10.js`) e **dirigidos pelo roteiro**: portas, garras, nível de solução, cor do ativo, tampas dos bocais, LED do sensor de garfo, válvulas (BASE/DRENO/RESPIRO), manivela e carro de sucussão, IHM e torre.
- Materiais da máquina em `matmaq.js` (mesmos valores PBR da REV17) — a página não precisa mais baixar o GLB da REV17.
- Espaço Memória mantido; a miniatura 1:5 do centro agora é da máquina 3 × 10 L.
- AR / VR / realismo (luz estimada, sombras, oclusão no Quest) iguais à REV19.

## 2. Etapas do ciclo (tempo simulado; a cena roda 3× mais rápida)

| # | Etapa | Duração | O que se vê / ouve |
|---|---|---|---|
| 1 | Partida escalonada (toque na IHM da M1) | — | as 4 máquinas programadas a cada 2:00 |
| 2 | Fixar garrafões (cilindros Ø50) | 0:05 | garras descem até o ombro · som de ar comprimido |
| 3 | Dosar 7 L por garrafão (~4 L/min, em paralelo) | 1:45 | nível sobe nos 3 garrafões · bomba · válvulas BASE e RESPIRO acesas |
| 4 | Abrir portas e **conferir o nível** na graduação | ~0:04 | operadora olha a marca de 7 L |
| 5 | Pipetar **60 mL** em G1–G3 | ~0:30 | tampa do bocal abre · sensor de garfo acende verde · bipe |
| 6 | Fechar portas e **CONFIRMAR** na IHM | — | CLP confere 3/3 registros |
| 7 | Mistura (sucussão) | 5:00 | carro sobe e desce · motor + golpes |
| 8 | Estabilizar | 0:05 | |
| 9 | Drenar 21 L para o TQ-01 | 0:45 | nível cai · vácuo · válvulas DRENO e RESPIRO |
| 10 | Alívio (ciclo 1) → 2º ciclo automático | 0:04 + 0:06 | garras continuam presas |
| 11 | 2º ciclo: etapas 3–9 (nova pipetagem) | | |
| 12 | **Liberar** (fim do 2º ciclo) | 0:10 | garras sobem 200 mm · "solte as uniões" na IHM |
| 13 | Transferência TQ-01 → sala de tanques | 1:30 | bomba de transferência |
| 14 | Pausa do café | | supervisor apita, TV mostra a pausa, operadora sorri e sai |

Ciclo ≈ **8:40** · 21 L por ciclo por máquina · 168 L nas 2 rodadas das 4 máquinas.
Durante a 1ª rodada o supervisor entra com o tablet e faz a ronda nas 4 IHMs e na TV.

## 3. Operadora e supervisor mais realistas
- **Roupa de baixo real** (malhas MakeHuman ajustadas ao corpo): operadora com blusa azul-clara de uniforme e calça azul-marinho; supervisor com camisa social azul-clara e calça cinza. A blusa aparece no decote do jaleco e a calça abaixo dele.
- Pele recuada 4 mm sob a roupa (não atravessa o tecido); cano do sapato cortado acima do tornozelo.
- **Luvas nitrílicas** azuis da operadora, com punho por cima da manga do jaleco.
- **Cabelo**: operadora com cabelo preso e totalmente dentro da touca (BPF); supervisor com cabelo curto aparecendo nas laterais.
- **Dentes e língua** (aparecem no sorriso da pausa do café).
- **Crachá** CMR no peito e **caneta** no bolso.
- Pipeta sorológica de **100 mL** (dispensa 60 mL) com filtro de algodão e graduação.

## 4. Arquivos
- `index.html` + `app21.js` (página REV21), `maq10.js` (máquina), `matmaq.js` (materiais), `assets/sala_cena21.glb` (sala + pessoas + animação, 9,8 MB), `assets/roteiro21.json`.
- `rev17.html` + `app.js` + `assets/sala_cena.glb` + `assets/maquina_rev17.glb` (sala REV17 com modo Operar).
- `Blender_cenario/`: `layout.py` (posições 3G), `timeline.py` (roteiro 3G), `human.py` (uniforme, luvas, cabelo, dentes, crachá), `room.py`, `anim.py`; `make_app21.py` gera o `app21.js` a partir do `app.js`.
- Renders 31–38 em `Renders/`.

## 5. Pontos a confirmar
1. Tempo real de pipetagem de 60 mL com pipetador elétrico (usado ≈ 9 s por garrafão).
2. Vazão da dosagem (4 L/min por garrafão → 12 L/min por máquina; 48 L/min se as 4 dosarem juntas — a partida escalonada evita isso).
3. Uniforme real da CMR (cores da blusa/calça e modelo do crachá) para ajustar as cores.
