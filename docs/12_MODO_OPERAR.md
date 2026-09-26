# Etapa 3 – Modo Operar (você é a operadora)

**Abrir:** https://interautomacaoind.github.io/Dinamizador/?modo=operar (ou escolha **Operar** no seletor da barra inferior).

A operadora virtual e o supervisor saem de cena; as 4 máquinas passam a responder às suas ações, com as mesmas regras do processo REV17 (tempo 3×, ciclo-alvo 8 min).

## Passo a passo

1. **IHM da M1 → PARTIDA ESCALONADA**: M1 agora, M2 +2:00, M3 +4:00, M4 +6:00 (a IHM de outra máquina inicia só aquela máquina).
2. Máquina fecha os cabeçotes e dosa a solução hidroalcoólica 20 % (a porta fica **travada** – intertravamento).
3. Em **PIPETAR ATIVO P1–P6** (torre amarela piscando): abra a **porta traseira** (P4–P6) e a **da frente** (P1–P3) e pipete 30 mL em cada bocal. O sensor de cada bocal registra (LED verde, ✔ na IHM).
4. Feche as portas e toque **CONFIRMAR** na IHM: o CLP confere 6/6 registros e portas fechadas → mistura 5:00.
5. As máquinas fazem o 2º ciclo sozinhas; repita a pipetagem.
6. No fim, toque **TRANSFERIR** no painel do TQ-01.
7. A TV mostra o **Relatório do treinamento**.

**⏩ Avançar** (ou botão **Y** no Quest) pula até o próximo momento em que alguma máquina precisa de você.

## Como interagir

| | Celular / PC | Meta Quest (VR ou AR 1:1) |
|---|---|---|
| Clicar (IHM, portas, TRANSFERIR) | Toque / clique | Raio + **gatilho** (ou pinça da mão); o raio fica verde sobre algo clicável e aparece uma dica |
| Pipetar | Toque no bocal com a porta aberta | Clique na **pipeta** na bancada para pegá-la → ponta no **frasco** + gatilho = aspira 30 mL → ponta no **bocal** + gatilho = dispensa |
| Devolver a pipeta | – | Botão **grip** |
| No AR do celular | Toque em algo clicável = ação; toque fora = arrastar a sala | – |

## Erros e alertas contados no relatório

- **Erro**: CONFIRMAR sem os 6 registros (a IHM mostra quais faltam); CONFIRMAR com porta aberta; **dose dupla** no mesmo bocal; dispensar com a pipeta vazia.
- **Alerta**: tentar abrir porta travada; pipetar com a porta fechada ou fora da etapa; TRANSFERIR com o TQ-01 vazio.
- A torre acende **vermelha** e soa um alarme a cada erro.

## Relatório na TV

Por máquina e ciclo: **duração**, **quanto a máquina esperou por você** (fim da dosagem → 1ª pipetagem) e **tempo de pipetagem** (fim da dosagem → CONFIRMAR); **ciclo médio**, **meta de 8 h** calculada com o seu ritmo, e a lista de ocorrências.
