# Gera app22.js (REV22: berço de pesagem com célula de carga) a partir de app21.js
REPO = './'   # rode na raiz do repositório: python3 Blender_cenario/make_app22.py
s = open(REPO + 'app21.js').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80]); s = s.replace(a, b)
rep("// Sala de Dinamização REV21 – 4 dinamizadoras REV20 3G (3 × 10 L)", "// Sala de Dinamização REV22 – 4 dinamizadoras 3 × 10 L com berço de pesagem (célula de carga por garrafão)")
rep("import { buildMaquina10, GARRAFAO } from './maq10.js?v=21';", "import { buildMaquina10, GARRAFAO } from './maq10.js?v=22';")
rep("const P = buildMaquina10(MATM, { n: 3, nome: mn });", "const P = buildMaquina10(MATM, { n: 3, nome: mn, balanca: true });")
rep("for (const B_ of P.bottles) { B_.clampSt = 0; B_.levelSt = 0; B_.tint = 0; }", "for (const B_ of P.bottles) { B_.clampSt = 1; B_.levelSt = 0; B_.tint = 0; }")
# ---- rótulos
rep("FECHANDO: 'FIXANDO GARRAFÕES (CILINDROS)', DOSANDO: 'DOSANDO 7 L · SOL. HIDROALCOÓLICA 20%',", "FECHANDO: 'DESTRAVA BALANÇAS · TARA', DOSANDO: 'DOSANDO POR PESO · 6,790 kg',")
rep("PIPETAR: 'PIPETAR 60 mL · G1–G3', VALIDANDO: 'SENSORES 3/3 OK',", "PIPETAR: 'PIPETAR 60 mL · G1–G3', VALIDANDO: 'PESO 3/3 OK · TRAVANDO',")
rep("ABRINDO: 'LIBERANDO GARRAFÕES', ALIVIO: 'ALÍVIO · FECHANDO VÁLVULAS', FIM_CICLO:", "ABRINDO: 'TRAVA BALANÇAS · ABRIR GRAMPOS', ALIVIO: 'PESO RESIDUAL OK', FIM_CICLO:")
# ---- adereços: grampo no berço (fechado o lote todo), trava da balança, massa medida
a = s.index("  const c = curCycle(mn, t), first = C[0];\n  // garras (cilindros)")
b = s.index("  const mixing = c && c.mix && t >= c.mix[0] && t < c.mix[1];")
s = s[:a] + r"""  const c = curCycle(mn, t), first = C[0];
  // REV22: grampo de alavanca no próprio berço — fechado o lote inteiro; abre só no fim do 2º ciclo (troca do garrafão)
  let cl = 1;
  const fin = C.find((x) => x.final && x.abre);
  if (fin && t >= fin.abre[0]) cl = 1 - sm01((t - fin.abre[0] - 0.4 * (fin.abre[1] - fin.abre[0])) / (0.6 * (fin.abre[1] - fin.abre[0])));
  // trava de sucussão: 1 = plataforma levantada contra o batente (célula descarregada); 0 = pesando
  let lock = 1;
  if (c && t >= c.fecha[0]) {
    lock = 1 - sm01((t - c.fecha[0]) / 0.4);                                               // destrava e faz a tara
    if (c.run !== undefined && t >= c.run) lock = sm01((t - c.run) / 0.3);                 // CONFIRMAR → trava para a mistura
    if (c.mix && t >= c.mix[1]) lock = 1 - sm01((t - c.mix[1]) / 0.3);                    // fim da mistura: destrava e confere o peso (vazamento/evaporação)
    if (c.final && c.abre && t >= c.abre[0]) lock = sm01((t - c.abre[0]) / 0.3);           // fim do lote: trava para a troca
  }
  S.lock = lock;
  // nível (volume) e massa líquida medida (tara = garrafão vazio + tampa + grampo + mangueiras)
  const RHO = 0.97, M_ALVO = 7 * RHO;                                                      // 6,790 kg de sol. hidroalcoólica 20 %
  let lev = 0, tintT = null;
  if (c) {
    if (t < c.dosa[0]) lev = 0; else if (t < c.dosa[1]) { const u = (t - c.dosa[0]) / (c.dosa[1] - c.dosa[0]); lev = u < 0.8 ? 0.97 * u / 0.8 : 0.97 + 0.03 * sm01((u - 0.8) / 0.2); } else lev = 1;
    if (c.dreno && t >= c.dreno[0]) lev = 1 - sm01((t - c.dreno[0]) / (c.dreno[1] - c.dreno[0]));
  }
  const dosando = c && t >= c.dosa[0] && t < c.dosa[1];
""" + s[b:]
rep("""    Bt.clampSt = cl;
    Bt.levelSt = lev * (1 + (mixing ? 0.01 * Math.sin(t * 40 + i) : 0));""", """    Bt.clampSt = cl;
    Bt.levelSt = lev * (1 + (mixing ? 0.01 * Math.sin(t * 40 + i) : 0));
    const pipOk = c && c.pip[key] !== undefined && t >= c.pip[key];
    const dreno = c && c.dreno && t >= c.dreno[0];
    let massa = lev * M_ALVO + (pipOk ? 0.058 * Math.min(1, (t - c.pip[key]) / 0.6) : 0) + (dreno ? 0.012 * (1 - lev) : 0);
    if (dosando) massa += 0.002 * Math.sin(t * 23 + i * 2);                                // turbulência do jato
    Bt.massa = Math.max(0, massa);
    Bt.balMsg = !c ? 'aguardando tara' : t < c.fecha[1] ? 'TARA ✓ 0,000' : dosando ? ((t - c.dosa[0]) / (c.dosa[1] - c.dosa[0]) < 0.8 ? 'dosagem grossa' : 'dosagem fina') :
      dreno && lev < 0.02 ? 'vazio ✓ resíduo 12 g' : dreno ? 'drenando' : (c.mix && t >= c.mix[1]) ? 'pós-mistura Δ 0 g ✓' : pipOk ? '+58 g pipetado ✓' : (c.dosa && t >= c.dosa[1]) ? 'alvo 6,790 ✓ · pipetar' : '';""")
rep("""    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.pneu, 0.8, 1.4);""", """    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.pneu, 0.8, 1.4);
  }
  for (const mn of MN) for (const c of R.machines[mn].cycles) for (const tt of [c.fecha[0], c.run ?? -1, c.mix ? c.mix[1] : -1]) {    // travas da balança
    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.pneu, 0.35, 1.0);""")
# ---- IHM: kg por garrafão na dosagem; Δg na pipetagem
rep("""      g.fillStyle = '#cfe0ee'; g.fillText(`G${i + 1}`, x + 24, 222);
    }
    g.fillText(`${(7 * Math.min(u, 1)).toFixed(2).replace('.', ',')} L / garrafão`, 285, 130); g.fillText('~4 L/min', 285, 152);""",
"""      g.fillStyle = '#cfe0ee'; g.fillText(`G${i + 1}`, x + 6, 222); g.fillText((m.P.bottles[i].massa).toFixed(3).replace('.', ','), x + 24, 222);
    }
    g.fillText('alvo 6,790 kg', 285, 130); g.fillText(u < 0.8 ? 'vazão grossa' : 'vazão fina', 285, 152); g.fillText('balança ±2 g', 285, 174);""")
rep("""      g.fillStyle = '#0b1622'; g.font = 'bold 20px system-ui'; g.fillText(ok ? '✔ 60' : `G${i + 1}`, x + (ok ? 14 : 24), 139);""",
    """      g.fillStyle = '#0b1622'; g.font = 'bold 20px system-ui'; g.fillText(ok ? '+58 g' : `G${i + 1}`, x + (ok ? 10 : 24), 139);""")
rep("g.fillText(`Sensores de garfo: ${n}/3 registros · 60 mL/garrafão`, 12, 176);", "g.fillText(`Garfo + balança: ${n}/3 · 60 mL = 58 g (±2 g)`, 12, 176);")
rep("""    g.fillText(st.k === 'FECHANDO' ? 'Cilindros Ø50 · garra no ombro do garrafão' : st.k === 'ALIVIO' ? 'Ciclo 2 programado: reinicia sozinho' : 'Garras sobem 200 mm · solte as uniões', 12, 170);""",
    """    g.fillText(st.k === 'FECHANDO' ? 'Travas descem · zero com garrafão vazio' : st.k === 'ALIVIO' ? 'Resíduo < 20 g · ciclo 2 reinicia sozinho' : 'Balanças travadas · abra os grampos e solte as uniões', 12, 170);""")
rep("g.fillStyle = '#fff'; g.font = 'bold 19px system-ui,sans-serif'; g.fillText(`CMR ${mn} · 3×10 L`, 10, 24);", "g.fillStyle = '#fff'; g.font = 'bold 19px system-ui,sans-serif'; g.fillText(`CMR ${mn} · 3×10 L · pesagem`, 10, 24);")
rep("g.fillText('3 garrafões de 10 L no copo · portas fechadas', 12, 130);", "g.fillText('3 garrafões presos no berço · balanças travadas', 12, 130);")
rep("g.fillText('SALA DE DINAMIZAÇÃO 01 · PRODUÇÃO · REV21 (3 × 10 L)', 24, 47);", "g.fillText('SALA DE DINAMIZAÇÃO 01 · PRODUÇÃO · REV22 (3 × 10 L, pesagem)', 24, 47);")
# ---- câmera do berço
rep("  bocais: [B(2.05, -2.85, 1.72), B(3.2, -2.3, 1.08)],", "  bocais: [B(2.05, -2.85, 1.72), B(3.2, -2.3, 1.08)],\n  berco: [B(2.35, -2.05, 1.12), B(3.2, -2.42, 0.82)],")
rep("const mini = buildMaquina10(MATM, { n: 3, nome: 'MINI' }).root;", "const mini = buildMaquina10(MATM, { n: 3, nome: 'MINI', balanca: true }).root;")
rep("g.fillText('Dinamizadora CMR · REV21', w / 2, 88);", "g.fillText('Dinamizadora CMR · REV22', w / 2, 88);")
rep("PAUSA: 'ESTABILIZANDO',", "PAUSA: 'PESAGEM PÓS-MISTURA',")
open(REPO + 'app22.js', 'w').write(s)
print('ok')
