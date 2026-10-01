import re, sys
REPO = './'   # rode na raiz do repositório: python3 Blender_cenario/make_app21.py
s = open(REPO + 'app.js').read()
def rep(a, b, cnt=1):
    global s
    n = s.count(a)
    assert n >= 1, ('NAO ACHEI', a[:80])
    if cnt == 1: assert n == 1, ('AMBIGUO', n, a[:80])
    s = s.replace(a, b)

rep("// Sala de Dinamização – cena WebXR com som espacial sincronizado",
    "// Sala de Dinamização REV21 – 4 dinamizadoras REV20 3G (3 × 10 L) · cena WebXR com som espacial sincronizado")
rep("import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';",
    "import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';\nimport { buildMaquina10, GARRAFAO } from './maq10.js?v=21';\nimport { materiaisMaquina } from './matmaq.js?v=21';")
rep("const R = await (await fetch('assets/roteiro.json')).json();", "const R = await (await fetch('assets/roteiro21.json?v=21')).json();")
rep("const OPMODE = new URLSearchParams(location.search).get('modo') === 'operar';   // etapa 3: modo Operar",
    "const OPMODE = false;   // REV21: modo Operar continua na REV17 (rev17.html?modo=operar)")
rep("$('pg').style.width = (100 * v.reduce((a, b) => a + b, 0) / 2) + '%';", "$('pg').style.width = (100 * v.reduce((a, b) => a + b, 0) / 1) + '%';")
rep("`carregando modelos… ${Math.round(100 * v.reduce((a, b) => a + b, 0) / 2)} %`", "`carregando modelos… ${Math.round(100 * v.reduce((a, b) => a + b, 0) / 1)} %`")
rep("const [gs, gm] = await Promise.all([loadGLB('assets/sala_cena' + EXT), loadGLB('assets/maquina_rev17' + EXT)]);",
    "const [gs] = await Promise.all([loadGLB('assets/sala_cena21' + EXT + '?v=21')]);")

# ---- bloco das máquinas
a = s.index("// ------------------------------------------------------------------ máquinas (4 cópias, cada uma com seu relógio de clipe)")
b = s.index("// ------------------------------------------------------------------ telas: TV, relógio, painel do tanque")
s = s[:a] + r"""// ------------------------------------------------------------------ máquinas REV20 3G (procedurais, maq10.js), dirigidas pelas fases do roteiro
const MATM = materiaisMaquina();
const machines = {};
const torreAdapt = (mat) => ({ set visible(v) { mat.emissiveIntensity = v ? 1.8 : 0.0; mat.opacity = v ? 0.95 : 0.55; }, get visible() { return mat.emissiveIntensity > 0; } });
for (const mn of MN) {
  const M = R.machines[mn];
  const P = buildMaquina10(MATM, { n: 3, nome: mn });
  const root = P.root;
  root.position.copy(B(M.pos[0], M.pos[1], 0));
  root.rotation.y = THREE.MathUtils.degToRad(M.pos[2]);
  world.add(root);
  for (const B_ of P.bottles) { B_.clampSt = 0; B_.levelSt = 0; B_.tint = 0; }
  P.apply();
  const tower = { verde: torreAdapt(P.torre.verde), amarelo: torreAdapt(P.torre.amarelo), vermelho: torreAdapt(P.torre.vermelho) };
  machines[mn] = { R: M, root, P, cv: P.ihm.cv, ctx: P.ihm.ctx, tex: P.ihm.tex, tower, pos: B(M.pos[0], M.pos[1], 1.2), lastStroke: -1, crank: 0, strokes: -1 };
}

""" + s[b:]

# ---- estados / rótulos
rep("    else if (t < c.abre[1]) st.k = 'ABRINDO';", "    else if (t < c.abre[1]) st.k = c.final ? 'ABRINDO' : 'ALIVIO';")
rep("FECHANDO: 'FECHANDO CABEÇOTES', DOSANDO: 'DOSANDO SOL. HIDROALCOÓLICA 20%',", "FECHANDO: 'FIXANDO GARRAFÕES (CILINDROS)', DOSANDO: 'DOSANDO 7 L · SOL. HIDROALCOÓLICA 20%',")
rep("PIPETAR: 'PIPETAR ATIVO P1–P6', VALIDANDO: 'SENSORES 6/6 OK',", "PIPETAR: 'PIPETAR 60 mL · G1–G3', VALIDANDO: 'SENSORES 3/3 OK',")
rep("ABRINDO: 'ABRINDO CABEÇOTES', FIM_CICLO:", "ABRINDO: 'LIBERANDO GARRAFÕES', ALIVIO: 'ALÍVIO · FECHANDO VÁLVULAS', FIM_CICLO:")
rep("DRENANDO: '#19b3c9', ABRINDO: '#3d8bfd',", "DRENANDO: '#19b3c9', ABRINDO: '#3d8bfd', ALIVIO: '#19b3c9',")
rep("const auto = ['FECHANDO', 'DOSANDO', 'VALIDANDO', 'DINAMIZANDO', 'PAUSA', 'DRENANDO', 'ABRINDO'].includes(st.k);",
    "const auto = ['FECHANDO', 'DOSANDO', 'VALIDANDO', 'DINAMIZANDO', 'PAUSA', 'DRENANDO', 'ABRINDO', 'ALIVIO'].includes(st.k);")

# ---- adereços da máquina (portas, garras, nível, tampas dos bocais, LEDs, válvulas, sucussão)
a = s.index("function updateMachineProps(m, mn, t) {")
b = s.index("function tankVol(t) {")
s = s[:a] + r"""function updateMachineProps(m, mn, t, dt = 0) {
  const C = R.machines[mn].cycles, P = m.P, S = P.state;
  // portas frontais (2 folhas): abertas só durante a pipetagem
  let u = 0;
  for (const c of C) for (const [l, a, b] of c.portas) if (t >= a - 0.05 && t < b + 0.8) u = Math.max(u, sm01((t - a) / 0.8) * (1 - sm01((t - b) / 0.8)));
  S.doorsF = u;
  const c = curCycle(mn, t), first = C[0];
  // garras (cilindros): descem na fixação do 1º ciclo, sobem na liberação ao fim do 2º
  let cl = 0;
  if (first && t >= first.fecha[0]) cl = sm01((t - first.fecha[0]) / (first.fecha[1] - first.fecha[0]));
  const fin = C.find((x) => x.final && x.abre);
  if (fin && t >= fin.abre[0]) cl *= 1 - sm01((t - fin.abre[0]) / (fin.abre[1] - fin.abre[0]));
  // nível de solução: sobe na dosagem (7 L), cai na drenagem; cor âmbar depois da pipetagem do ativo
  let lev = 0, tintT = null;
  if (c) {
    if (t < c.dosa[0]) lev = 0; else if (t < c.dosa[1]) lev = (t - c.dosa[0]) / (c.dosa[1] - c.dosa[0]); else lev = 1;
    if (c.dreno && t >= c.dreno[0]) lev = 1 - sm01((t - c.dreno[0]) / (c.dreno[1] - c.dreno[0]));
  }
  const mixing = c && c.mix && t >= c.mix[0] && t < c.mix[1];
  P.bottles.forEach((Bt, i) => {
    const key = 'P' + (i + 1);
    Bt.clampSt = cl;
    Bt.levelSt = lev * (1 + (mixing ? 0.01 * Math.sin(t * 40 + i) : 0));
    let tn = 0;
    if (c && c.pip[key] !== undefined && t >= c.pip[key]) tn = Math.min(1, (t - c.pip[key]) / 1.2) * (c.mix && t >= c.mix[0] ? 1 : 0.55);
    Bt.tint = tn;
    let pu = 0;
    if (c && c.tampas[key]) { const [a, b] = c.tampas[key]; pu = sm01((t - a) / 0.35) * (1 - sm01((t - b) / 0.35)); }
    Bt.pipSt = pu;
    Bt.sensor = !!(c && c.pip[key] !== undefined && t >= c.pip[key] && !(c.abre && t >= c.abre[1]));
  });
  // válvulas: BASE na dosagem, DRENO na drenagem, RESPIRO nas duas
  const dos = c && t >= c.dosa[0] && t < c.dosa[1], dre = c && c.dreno && t >= c.dreno[0] && t < c.dreno[1];
  S.valves = { BASE: dos, DRENO: dre, RESPIRO: dos || dre };
  // sucussão: manivela a 2 voltas/s (tempo real) com rampa de 1 s
  let sh = 0;
  if (c && c.mix) { if (t >= c.mix[0] && t < c.mix[1]) sh = Math.min(1, (t - c.mix[0]) / 1.0, (c.mix[1] - t) / 1.0); }
  S.shake = sh;
  if (c && c.mix && t >= c.mix[0]) { const tt = Math.min(t, c.mix[1]) - c.mix[0]; S.crank = 2 * Math.PI * 2 * Math.max(0, tt - 0.5); m.strokes = t < c.mix[1] ? Math.floor(S.crank / (2 * Math.PI)) : -1; }
  else { S.crank = 0; m.strokes = -1; }
  P.apply();
}

""" + s[b:]

# ---- IHM (3 garrafões de 10 L)
rep("g.fillStyle = '#fff'; g.font = 'bold 19px system-ui,sans-serif'; g.fillText(`CMR ${mn}`, 10, 24);",
    "g.fillStyle = '#fff'; g.font = 'bold 19px system-ui,sans-serif'; g.fillText(`CMR ${mn} · 3×10 L`, 10, 24);")
rep("""    for (let i = 0; i < 6; i++) {
      const x = 14 + i * 64, h = 90 * Math.min(u * (1 + 0.04 * ((i * 37) % 5)), 1);
      g.strokeStyle = '#6fa8dc'; g.strokeRect(x, 110, 50, 92); g.fillStyle = '#3d8bfd'; g.fillRect(x + 1, 201 - h, 48, h);
      g.fillStyle = '#cfe0ee'; g.fillText(`P${i + 1}`, x + 14, 222);
    }
    g.fillText(`${(3.6 * Math.min(u, 1)).toFixed(2).replace('.', ',')} L`, 300, 92);""",
"""    for (let i = 0; i < 3; i++) {
      const x = 14 + i * 90, h = 90 * Math.min(u * (1 + 0.03 * ((i * 37) % 5)), 1);
      g.strokeStyle = '#6fa8dc'; g.strokeRect(x, 110, 70, 92); g.fillStyle = '#3d8bfd'; g.fillRect(x + 1, 201 - h, 68, h);
      g.fillStyle = '#cfe0ee'; g.fillText(`G${i + 1}`, x + 24, 222);
    }
    g.fillText(`${(7 * Math.min(u, 1)).toFixed(2).replace('.', ',')} L / garrafão`, 285, 130); g.fillText('~4 L/min', 285, 152);""")
rep("""    for (let i = 0; i < 6; i++) {
      const v = c.pip['P' + (i + 1)], ok = v !== undefined && t >= v;
      const x = 14 + i * 64;
      g.fillStyle = ok ? '#2fbf71' : (blink ? '#f5b31a' : '#4a3a12'); g.fillRect(x, 106, 50, 50);
      g.fillStyle = '#0b1622'; g.font = 'bold 20px system-ui'; g.fillText(ok ? '✔' : `P${i + 1}`, x + (ok ? 16 : 10), 139);
    }""",
"""    for (let i = 0; i < 3; i++) {
      const v = c.pip['P' + (i + 1)], ok = v !== undefined && t >= v;
      const x = 14 + i * 90;
      g.fillStyle = ok ? '#2fbf71' : (blink ? '#f5b31a' : '#4a3a12'); g.fillRect(x, 106, 76, 50);
      g.fillStyle = '#0b1622'; g.font = 'bold 20px system-ui'; g.fillText(ok ? '✔ 60' : `G${i + 1}`, x + (ok ? 14 : 24), 139);
    }""")
rep("g.fillText(`Sensores dos bocais: ${n}/6 registros · 30 mL/garrafão`, 12, 176);", "g.fillText(`Sensores de garfo: ${n}/3 registros · 60 mL/garrafão`, 12, 176);")
rep("n < 6 ? 'Abra a porta, pipete em cada bocal e feche' : 'Feche as portas e toque CONFIRMAR'", "n < 3 ? 'Abra a porta, pipete em cada bocal e feche' : 'Feche as portas e toque CONFIRMAR'")
rep("g.fillText(`Transferindo para TQ-01: ${(21.6 * u).toFixed(1).replace('.', ',')} L`, 12, 130);", "g.fillText(`Transferindo para TQ-01: ${(R.VOL_CICLO * u).toFixed(1).replace('.', ',')} L`, 12, 130);")
rep("g.fillText(`Produzido: ${(21.6 * c.n).toFixed(1).replace('.', ',')} L`, 12, 154);", "g.fillText(`Produzido: ${(R.VOL_CICLO * c.n).toFixed(1).replace('.', ',')} L`, 12, 154);")
rep("""  } else if (st.k === 'FECHANDO' || st.k === 'ABRINDO') {
    const [a, b] = st.k === 'FECHANDO' ? c.fecha : c.abre; bar(130, (t - a) / (b - a), '#3d8bfd');""",
"""  } else if (st.k === 'FECHANDO' || st.k === 'ABRINDO' || st.k === 'ALIVIO') {
    const [a, b] = st.k === 'FECHANDO' ? c.fecha : c.abre; bar(130, (t - a) / (b - a), '#3d8bfd');
    g.fillText(st.k === 'FECHANDO' ? 'Cilindros Ø50 · garra no ombro do garrafão' : st.k === 'ALIVIO' ? 'Ciclo 2 programado: reinicia sozinho' : 'Garras sobem 200 mm · solte as uniões', 12, 170);""")
rep("const ok = pipCount(c, t) === 6;", "const ok = pipCount(c, t) === 3;")
rep("g.fillText('Garrafões posicionados · portas fechadas', 12, 130);", "g.fillText('3 garrafões de 10 L no copo · portas fechadas', 12, 130);")

# ---- TV
rep("g.fillText('SALA DE DINAMIZAÇÃO 01 · PRODUÇÃO', 24, 47);", "g.fillText('SALA DE DINAMIZAÇÃO 01 · PRODUÇÃO · REV21 (3 × 10 L)', 24, 47);")
rep("g.fillText(`pipetagem: ${pipCount(c, t)}/6 · ${ms((t - c.ready) * K)}`, x + 14, y + 146);", "g.fillText(`pipetagem: ${pipCount(c, t)}/3 · ${ms((t - c.ready) * K)}`, x + 14, y + 146);")
rep("g.fillText(`${cic} ciclos/máquina × 4 × 21,6 L = ${P.meta.toLocaleString('pt-BR')} L   ·   ritmo atual ${P.ritmo.toFixed(0)} L/h`, 36, y + 72);",
    "g.fillText(`${cic} ciclos/máquina × 4 × ${String(R.VOL_CICLO).replace('.', ',')} L = ${P.meta.toLocaleString('pt-BR')} L   ·   ritmo atual ${P.ritmo.toFixed(0)} L/h`, 36, y + 72);")
rep("g.fillText(`${d.mn} · ciclo ${d.n} · ${ms(d.dur)} · 21,6 L`, x, yy);", "g.fillText(`${d.mn} · ciclo ${d.n} · ${ms(d.dur)} · ${String(R.VOL_CICLO).replace('.', ',')} L`, x, yy);")

# ---- som: golpes pelo ângulo da manivela; ar comprimido nas garras
rep("""    const ct = clipTime(m.R, t);
    const n = k === 'DINAMIZANDO' ? Math.floor(theta(ct.cu) / (2 * Math.PI)) : -1;""", """    const n = k === 'DINAMIZANDO' ? m.strokes : -1;""")
rep("  S.doorc = buf(", """  S.pneu = buf(0.6, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = rnd() * Math.exp(-t / 0.16) * Math.min(1, t / 0.01) + 0.4 * Math.exp(-t / 0.01) * rnd(); } hp(d, 0.6); norm(d, 0.55); });
  S.doorc = buf(""")
rep("""    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.click, 0.7, 1.2);
  }""", """    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.click, 0.7, 1.2);
  }
  for (const mn of MN) for (const c of R.machines[mn].cycles) for (const tt of [c.n === 1 ? c.fecha[0] : -1, c.final && c.abre ? c.abre[0] : -1]) {
    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.pneu, 0.8, 1.4);
  }""")

# ---- remove o modo Operar (fica na REV17)
a = s.index("if (OPMODE) {\n  const S = (sim) => sim / K;")
b = s.index("// ------------------------------------------------------------------ laço principal")
s = s[:a] + "// (modo Operar: rev17.html?modo=operar)\n\n" + s[b:]
rep("for (const mn of MN) { const m = machines[mn]; m.act.time = clipTime(m.R, t).c; m.mixer.update(0); updateMachineProps(m, mn, t); }",
    "for (const mn of MN) updateMachineProps(machines[mn], mn, t, dt);")
rep("$('modo').onchange = (e) => { location.search = e.target.value === 'operar' ? '?modo=operar' : ''; };",
    "$('modo').onchange = (e) => { if (e.target.value === 'operar') location.href = 'rev17.html?modo=operar'; };")
open(REPO + 'app21.js', 'w').write(s)
print('ok', len(s))
s = open(REPO + 'app21.js').read()
rep("  // ---- miniatura 1:5 da dinamizadora CMR REV17 no centro", "  // ---- miniatura 1:5 da dinamizadora CMR REV20 3G (REV21) no centro")
rep("const mini = gm.scene.clone(true); mini.scale.setScalar(0.2);", "const mini = buildMaquina10(MATM, { n: 3, nome: 'MINI' }).root; mini.scale.setScalar(0.2);")
rep("g.fillText('Dinamizadora CMR · REV17', w / 2, 88);", "g.fillText('Dinamizadora CMR · REV21', w / 2, 88);")
rep("g.fillText('miniatura 1:5 · 6 garrafões de 5 L', w / 2, 158);", "g.fillText('miniatura 1:5 · 3 garrafões de 10 L', w / 2, 158);")
open(REPO + 'app21.js', 'w').write(s)
print('ok2')
s = open(REPO + 'app21.js').read()
rep("  bocais: [B(1.95, -2.9, 1.95), B(2.95, -2.32, 1.33)],", "  bocais: [B(2.05, -2.85, 1.72), B(3.2, -2.3, 1.08)],")
open(REPO + 'app21.js', 'w').write(s)
