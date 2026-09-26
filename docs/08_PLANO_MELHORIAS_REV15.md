# REV15: plano de melhorias, carenagem e ergonomia

**Data:** 25/09/2026 · **Base:** REV14

## Arquivos (pasta `REV15`)

| Arquivo | O que é |
|---|---|
| `CMR_REV15_maquina_carenada.glb` | Versão **carenada**: sobe e desce escondido, acabamento completo |
| `CMR_REV15_maquina_sem_carenagem.glb` | Versão **sem carenagem**: estrutura, mecânica, quadro elétrico e IHM |
| `Renders/` | Imagens de conferência |
| `Blender_REV15/` | `.blend` (zipado), scripts e texturas |

Nos dois GLBs a animação é um único clipe `CICLO_COMPLETO` de 60 s. Os dois passaram no validador glTF oficial com 0 erros e 0 avisos.

---

## 1. Material e cor da carenagem

**Como estava (REV11–REV14):** o material "Aço inox acetinado" tinha uma cor única cinza-azulada clara (0,66 / 0,70 / 0,73), metálico 0,78, rugosidade 0,27 e **nenhuma textura**. Em realidade aumentada (Meta Quest) quase não há ambiente para o metal refletir. Resultado: parece plástico claro e liso.

**REV15:**

| Parte | Material no modelo |
|---|---|
| Carenagem, estrutura, portas | **Inox 304 escovado**, com textura de escovado embutida no GLB (1024 px). Metálico 0,85, rugosidade 0,36, tom mais escuro. |
| Peças usinadas (cabeçotes, copos de fixação etc.) | Inox 316L usinado: mais escuro e brilhante (metálico 0,92, rugosidade 0,24) |
| Rodapé, moldura da IHM, filtros e venezianas | Grafite RAL 7016, para dar contraste |
| Visores das portas e lateral | Policarbonato fumê (32 % de opacidade), para destacar o interior |
| Sinalização | Amarelo de segurança, vermelho de emergência, verde e azul dos botões |

**Dicas para o Quest:** no app de visualização, desligue a iluminação "neutra/branca" se houver essa opção. Deixe o celular ou o Quest detectar o ambiente, porque metal escovado depende de reflexo. Se ainda ficar claro, dá para escurecer mais o tom base (hoje a média da textura está em ~0,70).

## 2. Altura de trabalho (ergonomia)

Todo o conjunto de processo desceu **400 mm**:

| Referência | REV14 | **REV15** |
|---|---|---|
| Borda do copo (onde o garrafão é colocado) | 1,40 m | **1,00 m** |
| Topo da bandeja | 1,28 m | **0,88 m** |
| Boca do garrafão | 1,65 m | **1,25 m** |
| Centro da IHM | — | **1,50 m** |
| Botões de comando | — | **1,19–1,30 m** |
| Emergência (quadro e lateral) | — | **1,14–1,16 m** |
| **Altura total da máquina** | 3,03 m | **2,63 m** (+0,30 m da torre de sinalização) |

- Para manusear garrafões de ~5,4 kg em pé, a faixa recomendada na literatura de ergonomia (NR-17 / ABNT NBR ISO 11228-1 / EN 1005-2) fica perto da altura do cotovelo, cerca de 0,95–1,10 m. A borda do copo a 1,00 m está nessa faixa.
- O compartimento inferior ficou com 0,58 m. Acomoda motor, redutor, manivela e molas a gás com a base de 0,19 m do piso.

## 3. Portas de 2 folhas

- **Frente e trás com 2 folhas** abrindo do meio. Cada folha tem **0,68 m**, contra 1,30 m da porta única: metade do espaço de abertura.
- Quadro de inox de 45 mm, policarbonato fumê de 6 mm e perfil de vedação no encontro das folhas.
- **Puxador vertical** em cada folha, a ~1,20 m.
- **Sensor de intertravamento codificado (RFID)** em cada folha, com o atuador no topo. O sensor deve ser ligado a um relé de segurança (ISO 14119, tipo 4, codificação alta).
- **Recomendação:** portas com **bloqueio** (solenoide de trava) que só libera no fim do ciclo, com as pontes elevadas e o carro parado no PMI. Uma energia residual pequena (volante e molas a gás) justifica o bloqueio.

## 4. Quadro elétrico e comandos

Quadro na **frente da lateral técnica**, com porta de inox e placa de montagem interna. Dentro:
- CLP com módulos de E/S;
- inversor de 1,5 kW (acionamento) e inversor de 0,55 kW (bomba da base);
- relé de segurança;
- contatores, disjuntores e fonte de 24 Vcc;
- trilhos DIN e canaletas.

Porta do quadro:
- **IHM 7" animada**, que mostra a etapa atual: PRONTA → FECHANDO CABEÇOTES → DOSANDO BASE → PIPETANDO ATIVO → VERIFICANDO VEDAÇÃO → DINAMIZANDO → DRENANDO → ABRINDO → RETIRAR GARRAFÕES;
- botões **INICIAR** (verde), **PARAR** (preto) e **REARME** (azul), mais a seletora **MAN/AUTO**;
- **emergência** com cogumelo vermelho sobre fundo amarelo;
- filtro de ventilação e fecho;
- pictograma **W012** (risco elétrico).

Demais comandos e sinalização:
- **2ª emergência** na lateral esquerda, junto à frente, para ter acesso dos dois lados da área de carga.
- **Chave geral** (vermelha sobre amarelo) na face direita, com a **placa de identificação NR-12** ao lado. Os campos de modelo, nº de série e massa ficaram para preencher.
- **Torre de sinalização** animada: **verde** = ciclo automático; **amarelo** = aguardando operador ou portas liberadas; **vermelho** = falha/emergência.

## 5. Identificações

| Removidas | Mantidas ou novas |
|---|---|
| "MÁQUINA 1" (placa grande) | Logo CMR (faixa superior, menor) |
| "PORTAS INTERTRAVADAS" | Placa de identificação (NR-12 12.13) |
| "NR-12 / REQUISITO" | Pictograma de risco elétrico (W012) no quadro |
| "CICLO DEMO" e textos de revisão | Etiquetas dos botões, da emergência e da chave geral |
| | Etiquetas BASE / DRENO / RESPIRO nas placas de válvulas |
| | **Posições P1–P6** na borda da bandeja (P1–P3 frente, P4–P6 trás) |

## 6. Versão carenada: como a mecânica do sobe e desce ficou coberta

1. **Tampas no carro de rodas:** frente, trás e externa, aparafusadas. Sobem e descem com o carro, e a tampa externa sai para regular as excêntricas.
2. **Fole** do carro até o suporte superior do eixo (já existia).
3. **Saia sanfonada de PU** em volta da bandeja, do tampo até a bandeja. Esconde travessa, biela, molas a gás, motores e correias das pontes, e estica ou encolhe com a sucussão (animada).
4. **Tampo** da área de processo em inox, com passagens só para a biela e as hastes das molas a gás, fechadas pela saia.
5. Compartimento inferior fechado por painéis removíveis com fechos de ¼ de volta. Rodapé grafite.
6. Compartimento superior fechado, com venezianas de ventilação, e teto inteiriço.
7. Lateral técnica com 2 portas de acesso (bombas e vácuo).

A **versão sem carenagem** mantém só a estrutura, a mecânica, a hidráulica e o quadro elétrico. O quadro continua fechado, como exige a NR-10.

---

## 7. Sugestões práticas para o projeto real

**Segurança (NR-12 / NR-10)**
1. Categoria/PL das funções de segurança pela ISO 13849-1: portas, emergência e parada do acionamento. Uma meta provável é **PL d**.
2. **STO** no inversor principal mais freio do motor, e parada controlada no PMI antes de liberar as portas.
3. Trava de porta com monitoramento, liberada só com a ponte elevada e o carro em repouso.
4. **Classificação de área** (etanol 30 %): definir se as válvulas, sensores e bombas precisam ser Ex, ou se vale usar válvulas pneumáticas com a ilha dentro do quadro.
5. Contenção de quebra de garrafão: a bandeja com borda já está no modelo. Falta prever como limpar os cacos (bandeja removível).

**Fabricação e montagem**
6. Estrutura em tubo inox 304 40×40×2 e carenagem em chapa 304 escovada nº 4 de 1,2 mm, com dobras de reforço e fixação por prisioneiros soldados (sem parafuso aparente no lado de produto).
7. Painéis removíveis com fecho de ¼ de volta e vedação, para limpeza e manutenção.
8. Soldas TIG com acabamento sanitário na bandeja e no tampo, e cantos arredondados (R ≥ 3 mm) onde há contato com produto.
9. Pés niveladores com base antivibração. A sucussão gera força alternada de ~2,7 kN, então prever chumbamento ou uma massa de base adequada.

**Operação e limpeza**
10. Rotina CIP: ligar a linha de base a um tanque de água/álcool de limpeza e circular pelos pescadores e pelas linhas de dreno.
11. Leitor de código no garrafão (rastreabilidade de lote e potência), integrado à IHM.
12. Registro por ciclo na IHM/CLP: volume dosado por garrafão, golpes aplicados, alarmes. Exportar para planilha ou sistema da qualidade.

**Próximos passos de engenharia**
13. Com o layout aprovado, detalhar em CAD paramétrico (SolidWorks/Inventor) e exportar STEP e desenhos de fabricação.
14. Protótipo de 1 posição (carro, copo, cabeçote) para validar vedação, dosagem e sucussão antes da máquina de 6 posições.
