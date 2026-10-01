// Sala de Dinamização REV21 – 4 dinamizadoras REV20 3G (3 × 10 L) · cena WebXR com som espacial sincronizado
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';
import { buildMaquina10, GARRAFAO } from './maq10.js?v=21';
import { materiaisMaquina } from './matmaq.js?v=21';

const $ = (id) => document.getElementById(id);
const R = await (await fetch('assets/roteiro21.json?v=21')).json();
const OPMODE = false;   // REV21: modo Operar continua na REV17 (rev17.html?modo=operar)
let OP = null;
const B = (x, y, z = 0) => new THREE.Vector3(x, z, -y);          // Blender (z para cima) -> three (y para cima)
const K = R.K, T_END = R.T_END;
const MN = ['M1', 'M2', 'M3', 'M4'];

// ------------------------------------------------------------------ renderização
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(1);
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe3e7);
const pm = new THREE.PMREMGenerator(renderer);
const envPadrao = pm.fromScene(new RoomEnvironment(), 0.03).texture; scene.environment = envPadrao;
scene.environmentIntensity = 0.75;
const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa2a8, 1.25); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(1.5, 10, 2); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-3, 4, -6); scene.add(fill);
const baseLights = [hemi, sun, fill];

const rig = new THREE.Group(); scene.add(rig);
const world = new THREE.Group(); scene.add(world);          // tudo da sala (move/escala no modo AR)
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 80);
rig.add(camera);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.95;
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// ------------------------------------------------------------------ carregamento
const mgr = new THREE.LoadingManager();
mgr.onProgress = (u, a, b) => { $('pg').style.width = (100 * a / b) + '%'; };
const loader = new GLTFLoader(mgr);
const prog = {};
function loadGLB(url) {
  return new Promise((ok, bad) => loader.load(url, ok, (e) => {
    prog[url] = e.total ? e.loaded / e.total : Math.min(e.loaded / 9e6, 0.99);
    const v = Object.values(prog); $('pg').style.width = (100 * v.reduce((a, b) => a + b, 0) / 1) + '%';
    $('lt').textContent = `carregando modelos… ${Math.round(100 * v.reduce((a, b) => a + b, 0) / 1)} %`;
  }, bad));
}
const EXT = window.__EXT || '.glb';
const [gs] = await Promise.all([loadGLB('assets/sala_cena21' + EXT + '?v=21')]);
const sala = gs.scene; world.add(sala);
const mixS = new THREE.AnimationMixer(sala);
const actS = mixS.clipAction(gs.animations[0]); actS.play();

// materiais transparentes: sem escrita de profundidade para não "sumir" objetos atrás
scene.traverse((o) => { if (o.isMesh) { o.frustumCulled = !o.isSkinnedMesh; } });

// ------------------------------------------------------------------ máquinas REV20 3G (procedurais, maq10.js), dirigidas pelas fases do roteiro
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

// ------------------------------------------------------------------ telas: TV, relógio, painel do tanque
function screen(name, w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const o = sala.getObjectByName(name);
  if (o) o.traverse((m) => { if (m.isMesh) m.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); });
  return { cv, ctx: cv.getContext('2d'), tex, o };
}
const TVs = screen('TV_TELA', 1280, 731);
const CLK = screen('RELOGIO_TELA', 512, 512);
const TQP = screen('PAINEL_TQ_TELA', 320, 128);

// sombras de contato das pessoas
const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const people = {};
for (const n of ['OPERADORA', 'SUPERVISOR']) {
  const a = sala.getObjectByName(n);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; world.add(blob);
  people[n] = { a, head: a ? a.getObjectByName('head') : null, blob };
}

// ------------------------------------------------------------------ lógica do roteiro
const fmt2 = (n) => String(Math.floor(n)).padStart(2, '0');
const hms = (s) => `${fmt2(s / 3600 % 24)}:${fmt2(s / 60 % 60)}:${fmt2(s % 60)}`;
const ms = (s) => `${fmt2(s / 60)}:${fmt2(s % 60)}`;
const simT = (t) => R.SIM_T0 + K * t;

function clipTime(M, t) {
  const S = M.segments;
  if (!S.length || t < S[0][0]) return { c: 0, cu: 0 };
  let last = S[0];
  for (const s of S) {
    if (t < s[0]) break;
    last = s;
    if (t < s[1]) {
      const u = (t - s[0]) / (s[1] - s[0]);
      const cu = s[2] + u * (s[3] - s[2]);
      const c = s[4] ? 25 + ((cu - 25) % s[4]) : cu;
      return { c, cu, loop: !!s[4], seg: s };
    }
  }
  const c = last[4] ? 33 : last[3];
  return { c, cu: last[3], seg: last };
}
const W = 2 * Math.PI * 2;
function theta(c) {                                           // ângulo da manivela (igual ao Blender)
  if (c <= 23) return 0;
  if (c < 25) return 0.5 * (W / 2) * (c - 23) ** 2;
  return 4 * Math.PI + W * (c - 25);
}

let EV_PARTIDA = R.events.find((e) => e.type === 'partida_escalonada');
function curCycle(mn, t) { let c = null; for (const x of R.machines[mn].cycles) if (t >= x.start) c = x; return c; }
function pipCount(c, t) { return c ? Object.values(c.pip).filter((v) => v <= t).length : 0; }
function state(mn, t) {
  const M = R.machines[mn]; const C = M.cycles;
  let st = { k: 'PRONTA', cyc: null, n: 0 };
  if (EV_PARTIDA && t >= EV_PARTIDA.t && t < C[0].start) return { k: 'AGENDADA', cyc: null, n: 0, at: C[0].start };
  for (const c of C) {
    if (t < c.start) break;
    st = { cyc: c, n: c.n };
    if (t < c.fecha[1]) st.k = 'FECHANDO';
    else if (t < c.dosa[1]) st.k = 'DOSANDO';
    else if (c.run === undefined || t < c.run) st.k = 'PIPETAR';
    else if (t < c.mix[0]) st.k = 'VALIDANDO';
    else if (t < c.mix[1]) st.k = 'DINAMIZANDO';
    else if (t < c.dreno[0]) st.k = 'PAUSA';
    else if (t < c.dreno[1]) st.k = 'DRENANDO';
    else if (t < c.abre[1]) st.k = c.final ? 'ABRINDO' : 'ALIVIO';
    else st.k = c.n >= 2 ? 'CONCLUIDO' : 'FIM_CICLO';
  }
  const c = st.cyc;
  if (c) {
    if (c.stop !== undefined && t >= c.stop) st.k = c.fault === 'motor' ? 'FALHA' : c.emerg ? 'EMERGENCIA' : 'PARADA';
    else if (c.hold && t >= c.hold.t0 && !(c.hold.resume !== undefined && t >= c.hold.resume)) st.k = 'SEM_SOLUCAO';
  }
  return st;
}
const LABEL = { PRONTA: 'PRONTA', AGENDADA: 'PARTIDA PROGRAMADA', FECHANDO: 'FIXANDO GARRAFÕES (CILINDROS)', DOSANDO: 'DOSANDO 7 L · SOL. HIDROALCOÓLICA 20%',
  PIPETAR: 'PIPETAR 60 mL · G1–G3', VALIDANDO: 'SENSORES 3/3 OK', DINAMIZANDO: 'DINAMIZANDO', PAUSA: 'ESTABILIZANDO', DRENANDO: 'DRENANDO → TQ-01',
  ABRINDO: 'LIBERANDO GARRAFÕES', ALIVIO: 'ALÍVIO · FECHANDO VÁLVULAS', FIM_CICLO: 'CICLO CONCLUÍDO', CONCLUIDO: 'LOTE CONCLUÍDO',
  PARADA: 'MÁQUINA PARADA', EMERGENCIA: 'EMERGÊNCIA ACIONADA', FALHA: 'FALHA MOTOR (INVERSOR)', SEM_SOLUCAO: 'FALTA DE SOLUÇÃO' };
const COLOR = { PRONTA: '#9fb0bf', AGENDADA: '#9fb0bf', FECHANDO: '#3d8bfd', DOSANDO: '#3d8bfd', PIPETAR: '#f5b31a', VALIDANDO: '#2fbf71', DINAMIZANDO: '#2fbf71',
  PAUSA: '#2fbf71', DRENANDO: '#19b3c9', ABRINDO: '#3d8bfd', ALIVIO: '#19b3c9', FIM_CICLO: '#9fb0bf', CONCLUIDO: '#9fb0bf',
  PARADA: '#f5b31a', EMERGENCIA: '#ff5b4a', FALHA: '#ff5b4a', SEM_SOLUCAO: '#ff5b4a' };
function fitFont(g, txt, maxW, px, weight = 'bold') {       // reduz a fonte até caber (nada cortado)
  let p = px; g.font = `${weight} ${p}px system-ui,sans-serif`;
  while (g.measureText(txt).width > maxW && p > 9) { p -= 1; g.font = `${weight} ${p}px system-ui,sans-serif`; }
}
const sm01 = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
function updateMachineProps(m, mn, t, dt = 0) {
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

function tankVol(t) {
  if (OP) return OP.tankVol(t);
  const T = R.tank; if (t <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (t < T[i][0]) { const u = (t - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[i - 1][1] + u * (T[i][1] - T[i - 1][1]); }
  return T[T.length - 1][1];
}
function production(t) {
  const done = [];
  for (const mn of MN) for (const c of R.machines[mn].cycles) if (c.end !== undefined && c.end <= t) done.push({ mn, n: c.n, dur: (c.end - c.start) * K, end: c.end });
  done.sort((a, b) => a.end - b.end);
  const vol = done.length * R.VOL_CICLO;
  const avg = done.length ? done.reduce((a, b) => a + b.dur, 0) / done.length : null;
  const starts = MN.map((m) => (R.machines[m].cycles[0] || { start: Infinity }).start);
  const t0 = Math.min(...starts);
  const all2 = done.length === 8 ? (Math.max(...done.map((d) => d.end)) - t0) * K : null;
  const meta = avg ? Math.floor(8 * 3600 / avg) * 4 * R.VOL_CICLO : null;
  const ritmo = t > t0 ? vol / ((t - t0) * K / 3600) : 0;
  return { done, vol, avg, all2, meta, ritmo, t0 };
}

// ------------------------------------------------------------------ desenho das telas
function drawIHM(m, mn, t) {
  const g = m.ctx, st = state(mn, t), c = st.cyc;
  g.fillStyle = '#0b1622'; g.fillRect(0, 0, 400, 240);
  g.fillStyle = '#12304a'; g.fillRect(0, 0, 400, 34);
  g.fillStyle = '#fff'; g.font = 'bold 19px system-ui,sans-serif'; g.fillText(`CMR ${mn} · 3×10 L`, 10, 24);
  g.font = '15px system-ui,sans-serif'; g.fillStyle = '#9fd0ff'; g.fillText(hms(simT(t)), 300, 23);
  g.fillStyle = COLOR[st.k]; fitFont(g, LABEL[st.k], 376, 22);
  g.fillText(LABEL[st.k], 12, 68);
  g.font = '15px system-ui,sans-serif'; g.fillStyle = '#cfe0ee';
  g.fillText(`Ciclo ${st.n || 0} / 2   ·   Modo AUTO`, 12, 92);
  const bar = (y, u, col) => { g.fillStyle = '#23384b'; g.fillRect(12, y, 376, 14); g.fillStyle = col; g.fillRect(12, y, 376 * Math.min(Math.max(u, 0), 1), 14); };
  if (st.k === 'DOSANDO') {
    const u = (t - c.dosa[0]) / (c.dosa[1] - c.dosa[0]);
    for (let i = 0; i < 3; i++) {
      const x = 14 + i * 90, h = 90 * Math.min(u * (1 + 0.03 * ((i * 37) % 5)), 1);
      g.strokeStyle = '#6fa8dc'; g.strokeRect(x, 110, 70, 92); g.fillStyle = '#3d8bfd'; g.fillRect(x + 1, 201 - h, 68, h);
      g.fillStyle = '#cfe0ee'; g.fillText(`G${i + 1}`, x + 24, 222);
    }
    g.fillText(`${(7 * Math.min(u, 1)).toFixed(2).replace('.', ',')} L / garrafão`, 285, 130); g.fillText('~4 L/min', 285, 152);
  } else if (st.k === 'PIPETAR' || st.k === 'VALIDANDO') {
    const blink = Math.floor(t * 2) % 2, n = pipCount(c, t);
    for (let i = 0; i < 3; i++) {
      const v = c.pip['P' + (i + 1)], ok = v !== undefined && t >= v;
      const x = 14 + i * 90;
      g.fillStyle = ok ? '#2fbf71' : (blink ? '#f5b31a' : '#4a3a12'); g.fillRect(x, 106, 76, 50);
      g.fillStyle = '#0b1622'; g.font = 'bold 20px system-ui'; g.fillText(ok ? '✔ 60' : `G${i + 1}`, x + (ok ? 14 : 24), 139);
    }
    g.font = '14px system-ui'; g.fillStyle = '#cfe0ee';
    g.fillText(`Sensores de garfo: ${n}/3 registros · 60 mL/garrafão`, 12, 176);
    g.fillText(st.k === 'VALIDANDO' ? 'Todos os bocais registrados — mistura liberada' : n < 3 ? 'Abra a porta, pipete em cada bocal e feche' : 'Feche as portas e toque CONFIRMAR', 12, 196);
  } else if (st.k === 'AGENDADA') {
    g.fillText('Partida escalonada (rede das 4 máquinas)', 12, 130);
    g.font = 'bold 30px system-ui'; g.fillStyle = '#fff'; g.fillText(`inicia em ${ms(Math.max(0, (st.at - t) * K))}`, 12, 172);
  } else if (st.k === 'DINAMIZANDO' || st.k === 'PAUSA') {
    const u = st.k === 'DINAMIZANDO' ? (t - c.mix[0]) / (c.mix[1] - c.mix[0]) : st.k === 'PAUSA' ? 1 : 0;
    const rest = (1 - u) * R.MIX_REAL * K;
    g.font = 'bold 44px system-ui'; g.fillStyle = '#fff'; g.fillText(ms(rest), 12, 150);
    g.font = '15px system-ui'; g.fillStyle = '#cfe0ee';
    g.fillText(`golpes: ${Math.round(u * 600)} / 600 · 120/min`, 170, 128); g.fillText('mistura: 5:00 min', 170, 150);
    bar(180, u, '#2fbf71');
  } else if (st.k === 'DRENANDO') {
    const u = (t - c.dreno[0]) / (c.dreno[1] - c.dreno[0]);
    g.fillText(`Transferindo para TQ-01: ${(R.VOL_CICLO * u).toFixed(1).replace('.', ',')} L`, 12, 130); bar(150, u, '#19b3c9');
  } else if (st.k === 'FIM_CICLO' || st.k === 'CONCLUIDO') {
    g.fillText(`Tempo do ciclo: ${ms((c.end - c.start) * K)}`, 12, 130);
    g.fillText(`Produzido: ${(R.VOL_CICLO * c.n).toFixed(1).replace('.', ',')} L`, 12, 154);
  } else if (['PARADA', 'EMERGENCIA', 'FALHA', 'SEM_SOLUCAO'].includes(st.k)) {
    const T_ = { PARADA: ['Ciclo interrompido pelo operador', 'REARME → INICIAR reinicia o ciclo'], EMERGENCIA: ['Cogumelo acionado: destrave e REARME', 'Depois INICIAR reinicia o ciclo'],
      FALHA: ['Inversor desarmou por sobrecorrente', 'Aguarde, REARME e INICIAR'], SEM_SOLUCAO: ['Nível baixo no tanque de solução 20%', 'Toque a IHM para solicitar reposição'] }[st.k];
    g.fillText(T_[0], 12, 130); g.fillText(T_[1], 12, 154);
  } else if (st.k === 'FECHANDO' || st.k === 'ABRINDO' || st.k === 'ALIVIO') {
    const [a, b] = st.k === 'FECHANDO' ? c.fecha : c.abre; bar(130, (t - a) / (b - a), '#3d8bfd');
    g.fillText(st.k === 'FECHANDO' ? 'Cilindros Ø50 · garra no ombro do garrafão' : st.k === 'ALIVIO' ? 'Ciclo 2 programado: reinicia sozinho' : 'Garras sobem 200 mm · solte as uniões', 12, 170);
  } else {
    g.fillText('3 garrafões de 10 L no copo · portas fechadas', 12, 130); g.fillText(mn === 'M1' ? 'Toque PARTIDA ESCALONADA' : 'Toque INICIAR CICLO', 12, 154);
  }
  if (st.k !== 'PIPETAR' && st.k !== 'VALIDANDO') {
    const bl = st.k === 'PRONTA' && mn === 'M1' ? 'PARTIDA ESCALONADA' : st.k === 'SEM_SOLUCAO' ? 'SOLICITAR REPOSIÇÃO' : ['PARADA', 'EMERGENCIA', 'FALHA'].includes(st.k) ? 'REARME / INICIAR' : 'INICIAR CICLO';
    g.fillStyle = '#1f7a4a'; g.fillRect(222, 204, 168, 28); g.fillStyle = '#fff'; fitFont(g, bl, 156, 14); g.fillText(bl, 230, 223);
  } else {
    const ok = pipCount(c, t) === 3;
    g.fillStyle = ok ? '#1f7a4a' : '#3a4854'; g.fillRect(250, 212, 140, 24); g.fillStyle = '#fff'; g.font = 'bold 14px system-ui'; g.fillText('CONFIRMAR', 278, 229);
  }
  if (OP && OP.msg[mn] && t < OP.msg[mn].until) {              // aviso / erro do modo Operar
    const M_ = OP.msg[mn]; g.fillStyle = M_.err ? '#b3261e' : '#1f4d7a'; g.fillRect(0, 160, 400, 44);
    g.fillStyle = '#fff'; fitFont(g, M_.text, 384, 15); g.fillText(M_.text, 8, 188);
  }
  m.tex.needsUpdate = true;
  // torre
  const blink = Math.floor(t * 2.5) % 2 === 0;
  const auto = ['FECHANDO', 'DOSANDO', 'VALIDANDO', 'DINAMIZANDO', 'PAUSA', 'DRENANDO', 'ABRINDO', 'ALIVIO'].includes(st.k);
  if (m.tower.verde) m.tower.verde.visible = auto;
  if (m.tower.amarelo) m.tower.amarelo.visible = (st.k === 'PIPETAR' && blink) || ['PRONTA', 'AGENDADA', 'FIM_CICLO', 'CONCLUIDO'].includes(st.k);
  if (m.tower.vermelho) m.tower.vermelho.visible = !!(OP && ((OP.msg[mn] && OP.msg[mn].err && t < OP.msg[mn].until) || ['EMERGENCIA', 'FALHA', 'SEM_SOLUCAO'].includes(st.k)) && blink);
}

function drawTV(t) {
  if (OP && OP.done) { OP.drawReport(TVs.ctx, 1280, 731, t); TVs.tex.needsUpdate = true; return; }
  const g = TVs.ctx, W_ = 1280, H_ = 731, P = production(t);
  g.fillStyle = '#0c131b'; g.fillRect(0, 0, W_, H_);
  g.fillStyle = '#0f5132'; g.fillRect(0, 0, W_, 70);
  g.fillStyle = '#fff'; g.font = 'bold 34px system-ui,sans-serif'; g.fillText('SALA DE DINAMIZAÇÃO 01 · PRODUÇÃO · REV21 (3 × 10 L)', 24, 47);
  g.font = 'bold 34px system-ui'; g.fillText(hms(simT(t)), 1100, 47);
  // cartões das máquinas
  MN.forEach((mn, i) => {
    const x = 20 + i * 312, y = 88, st = state(mn, t), c = st.cyc;
    g.fillStyle = '#16212c'; g.fillRect(x, y, 300, 190);
    g.fillStyle = COLOR[st.k]; g.fillRect(x, y, 300, 8);
    g.fillStyle = '#fff'; g.font = 'bold 30px system-ui'; g.fillText(mn, x + 14, y + 46);
    g.font = '18px system-ui'; g.fillStyle = '#9fb0bf'; g.fillText(`ciclo ${st.n || 0}/2`, x + 200, y + 42);
    g.fillStyle = COLOR[st.k]; fitFont(g, LABEL[st.k], 272, 21); g.fillText(LABEL[st.k], x + 14, y + 84);
    g.fillStyle = '#cfe0ee'; g.font = '18px system-ui';
    if (c) {
      const el = ((c.end !== undefined && t >= c.end ? c.end : t) - c.start) * K;
      g.fillText(`tempo no ciclo: ${ms(el)}`, x + 14, y + 118);
      if (st.k === 'DINAMIZANDO') g.fillText(`mistura: ${ms(Math.max(0, (c.mix[1] - t) * K))} restante`, x + 14, y + 146);
      if (st.k === 'PIPETAR') g.fillText(`pipetagem: ${pipCount(c, t)}/3 · ${ms((t - c.ready) * K)}`, x + 14, y + 146);
    } else g.fillText(st.k === 'AGENDADA' ? `partida em ${ms(Math.max(0, (st.at - t) * K))}` : 'aguardando início', x + 14, y + 118);
    const mine = P.done.filter((d) => d.mn === mn);
    g.fillStyle = '#9fb0bf'; g.font = '17px system-ui';
    g.fillText(`concluídos: ${mine.map((d) => 'C' + d.n + ' ' + ms(d.dur)).join('  ') || '—'}`, x + 14, y + 176);
  });
  // KPIs
  const kp = [
    ['Produzido', `${P.vol.toFixed(1).replace('.', ',')} L`, '#2fbf71'],
    ['Tanque TQ-01', `${tankVol(t).toFixed(1).replace('.', ',')} L`, '#19b3c9'],
    ['Tempo médio de ciclo', P.avg ? ms(P.avg) : '—', '#fff'],
    ['2 ciclos · 4 máquinas', P.all2 ? ms(P.all2) : 'em andamento', '#f5b31a'],
  ];
  kp.forEach(([a, b, col], i) => {
    const x = 20 + i * 312, y = 296;
    g.fillStyle = '#16212c'; g.fillRect(x, y, 300, 110);
    g.fillStyle = '#9fb0bf'; g.font = '19px system-ui'; g.fillText(a, x + 14, y + 32);
    g.fillStyle = col; fitFont(g, b, 272, 40); g.fillText(b, x + 14, y + 84);
  });
  // meta do dia
  const y = 424;
  g.fillStyle = '#16212c'; g.fillRect(20, y, 1240, 120);
  g.fillStyle = '#fff'; g.font = 'bold 24px system-ui'; g.fillText('META DO DIA (8 h contínuas, 4 máquinas)', 36, y + 38);
  if (P.meta) {
    const cic = Math.floor(8 * 3600 / P.avg);
    g.font = '20px system-ui'; g.fillStyle = '#cfe0ee';
    g.fillText(`${cic} ciclos/máquina × 4 × ${String(R.VOL_CICLO).replace('.', ',')} L = ${P.meta.toLocaleString('pt-BR')} L   ·   ritmo atual ${P.ritmo.toFixed(0)} L/h`, 36, y + 72);
    const u = P.vol / P.meta;
    g.fillStyle = '#23384b'; g.fillRect(36, y + 86, 1100, 20); g.fillStyle = '#2fbf71'; g.fillRect(36, y + 86, 1100 * Math.min(u, 1), 20);
    g.fillStyle = '#fff'; g.font = 'bold 20px system-ui'; g.fillText(`${(100 * u).toFixed(1).replace('.', ',')} %`, 1150, y + 104);
  } else { g.font = '20px system-ui'; g.fillStyle = '#9fb0bf'; g.fillText('calculada após o primeiro ciclo concluído', 36, y + 78); }
  // últimos ciclos
  g.fillStyle = '#16212c'; g.fillRect(20, 560, 1240, 155);
  g.fillStyle = '#fff'; g.font = 'bold 22px system-ui'; g.fillText('CICLOS CONCLUÍDOS', 36, 594);
  const last = P.done.slice(-8);
  last.forEach((d, i) => {
    const x = 36 + (i % 4) * 305, yy = 630 + Math.floor(i / 4) * 34;
    const fresh = t - d.end < 6;
    g.fillStyle = fresh ? '#f5b31a' : '#cfe0ee'; g.font = (fresh ? 'bold ' : '') + '20px system-ui';
    g.fillText(`${d.mn} · ciclo ${d.n} · ${ms(d.dur)} · ${String(R.VOL_CICLO).replace('.', ',')} L`, x, yy);
  });
  if (t >= R.transfer.t && t < R.transfer.t1 + 3) {
    g.fillStyle = 'rgba(15,81,50,.92)'; g.fillRect(340, 300, 600, 90);
    g.fillStyle = '#fff'; g.font = 'bold 30px system-ui'; g.fillText('TRANSFERÊNCIA → SALA DE TANQUES', 362, 356);
  }
  if (R.cafe && t >= R.cafe.tv0 && t < R.cafe.tv1) drawCafe(g, W_, H_, t);
  TVs.tex.needsUpdate = true;
}

function drawCafe(g, W_, H_, t) {                          // PAUSA DO CAFÉ (depois volta aos indicadores finais)
  const u = t - R.cafe.tv0;
  const gr = g.createLinearGradient(0, 0, 0, H_); gr.addColorStop(0, '#4a2a14'); gr.addColorStop(1, '#1d120a');
  g.fillStyle = gr; g.fillRect(0, 0, W_, H_);
  g.save(); g.translate(W_ / 2, 300);
  // xícara
  g.fillStyle = '#f4efe8'; g.beginPath(); g.moveTo(-120, -40); g.lineTo(120, -40); g.lineTo(95, 110); g.quadraticCurveTo(0, 140, -95, 110); g.closePath(); g.fill();
  g.strokeStyle = '#f4efe8'; g.lineWidth = 22; g.beginPath(); g.arc(135, 25, 45, -Math.PI / 2, Math.PI / 2); g.stroke();
  g.fillStyle = '#6b3b1c'; g.beginPath(); g.ellipse(0, -40, 118, 20, 0, 0, 7); g.fill();
  g.fillStyle = '#e8e1d6'; g.beginPath(); g.ellipse(0, 140, 190, 22, 0, 0, 7); g.fill();
  // vapor
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 10; g.lineCap = 'round';
  for (let k = -1; k <= 1; k++) {
    g.beginPath();
    for (let y = 0; y < 150; y += 6) { const x = k * 55 + 16 * Math.sin(y / 22 + u * 3 + k); if (y === 0) g.moveTo(x, -70 - y); else g.lineTo(x, -70 - y); }
    g.stroke();
  }
  g.restore();
  g.textAlign = 'center'; g.fillStyle = '#ffd89a'; g.font = 'bold 92px system-ui,sans-serif'; g.fillText('PAUSA DO CAFÉ', W_ / 2, 560);
  g.fillStyle = '#f4efe8'; g.font = '34px system-ui,sans-serif'; g.fillText('O café chegou! · 15 min · lote concluído e transferido', W_ / 2, 616);
  g.font = 'bold 30px system-ui'; g.fillText(hms(simT(t)), W_ / 2, 680);
  g.textAlign = 'left';
}

function drawClock(t) {
  const g = CLK.ctx, s = simT(t), r = 250;
  g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, 512, 512);
  g.save(); g.translate(256, 256);
  for (let i = 0; i < 60; i++) {
    g.save(); g.rotate(i * Math.PI / 30);
    g.fillStyle = '#222'; if (i % 5 === 0) g.fillRect(-5, -r + 12, 10, 34); else g.fillRect(-2, -r + 12, 4, 14);
    g.restore();
  }
  g.fillStyle = '#222'; g.font = 'bold 44px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let h = 1; h <= 12; h++) { const a = h * Math.PI / 6; g.fillText(String(h), Math.sin(a) * (r - 80), -Math.cos(a) * (r - 80)); }
  const hand = (a, len, w, col) => { g.save(); g.rotate(a); g.fillStyle = col; g.fillRect(-w / 2, -len, w, len + 20); g.restore(); };
  hand(((s / 3600) % 12) * Math.PI / 6, 130, 14, '#111');
  hand(((s / 60) % 60) * Math.PI / 30, 190, 9, '#111');
  hand((Math.floor(s) % 60) * Math.PI / 30, 205, 4, '#c0392b');
  g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fillStyle = '#c0392b'; g.fill();
  g.restore();
  CLK.tex.needsUpdate = true;
}
function drawTQ(t) {
  const g = TQP.ctx, v = tankVol(t);
  g.fillStyle = '#06121c'; g.fillRect(0, 0, 320, 128);
  g.fillStyle = '#7fd3ff'; g.font = 'bold 26px system-ui'; g.fillText('TQ-01', 14, 36);
  g.fillStyle = '#fff'; g.font = 'bold 44px system-ui'; g.fillText(`${v.toFixed(1).replace('.', ',')} L`, 14, 94);
  const tr = t >= R.transfer.t0 && t < R.transfer.t1;
  g.fillStyle = tr ? '#2fbf71' : '#5b6b78'; g.font = 'bold 18px system-ui'; g.fillText(tr ? 'TRANSFERINDO' : 'NÍVEL OK', 170, 36);
  g.fillStyle = '#23384b'; g.fillRect(14, 106, 292, 12); g.fillStyle = '#19b3c9'; g.fillRect(14, 106, 292 * v / 250, 12);
  TQP.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ áudio (sintetizado, espacial)
const listener = new THREE.AudioListener(); camera.add(listener);
let AC = null, SND = null;
function buf(sec, fn, ch = 1) {
  const sr = AC.sampleRate, n = Math.floor(sec * sr), b = AC.createBuffer(ch, n, sr);
  for (let c = 0; c < ch; c++) { const d = b.getChannelData(c); fn(d, sr, n, c); }
  return b;
}
const rnd = (() => { let s = 12345; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1; })();
function lp(d, a) { let y = 0; for (let i = 0; i < d.length; i++) { y += a * (d[i] - y); d[i] = y; } }
function hp(d, a) { let y = 0, x0 = 0; for (let i = 0; i < d.length; i++) { const x = d[i]; y = a * (y + x - x0); x0 = x; d[i] = y; } }
function norm(d, g) { let m = 1e-6; for (const v of d) m = Math.max(m, Math.abs(v)); for (let i = 0; i < d.length; i++) d[i] *= g / m; }
function loopFix(d, sr) { const n = Math.floor(0.05 * sr); for (let i = 0; i < n; i++) { const u = i / n; d[i] = d[i] * u + d[d.length - n + i] * (1 - u); } }
function makeSounds() {
  const S = {};
  S.motor = buf(1, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = 0.5 * Math.sin(2 * Math.PI * 50 * t) + 0.35 * Math.sin(2 * Math.PI * 100 * t) + 0.18 * Math.sin(2 * Math.PI * 150 * t) + 0.08 * Math.sin(2 * Math.PI * 300 * t) + 0.12 * rnd(); } lp(d, 0.2); norm(d, 0.8); });
  S.pump = buf(2, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = 0.4 * Math.sin(2 * Math.PI * 180 * t) + 0.25 * Math.sin(2 * Math.PI * 360 * t) + 0.12 * Math.sin(2 * Math.PI * 540 * t) + 0.35 * rnd(); } lp(d, 0.35); norm(d, 0.7); });
  S.vac = buf(1, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = rnd() * (0.6 + 0.4 * Math.sin(2 * Math.PI * 25 * t)) + 0.3 * Math.sin(2 * Math.PI * 50 * t); } lp(d, 0.25); hp(d, 0.97); norm(d, 0.7); });
  S.heads = buf(1, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = 0.3 * Math.sign(Math.sin(2 * Math.PI * 400 * t)) * 0.3 + 0.2 * Math.sin(2 * Math.PI * 120 * t) + 0.15 * rnd(); } lp(d, 0.3); norm(d, 0.5); });
  S.tpump = buf(2, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = 0.45 * Math.sin(2 * Math.PI * 120 * t) + 0.3 * Math.sin(2 * Math.PI * 240 * t) + 0.15 * Math.sin(2 * Math.PI * 1440 * t) + 0.4 * rnd(); } lp(d, 0.3); norm(d, 0.8); });
  S.hvac = buf(4, (d, sr) => { for (let i = 0; i < d.length; i++) d[i] = rnd(); lp(d, 0.03); lp(d, 0.08); loopFix(d, sr); norm(d, 0.5); }, 2);
  S.thump = buf(0.4, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = Math.exp(-t / 0.06) * (Math.sin(2 * Math.PI * 68 * t) + 0.5 * Math.sin(2 * Math.PI * 136 * t)) + 0.25 * Math.exp(-t / 0.012) * rnd() + 0.08 * Math.exp(-t / 0.03) * Math.sin(2 * Math.PI * 1850 * t); } norm(d, 0.95); });
  S.click = buf(0.08, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = Math.exp(-t / 0.006) * rnd() + 0.5 * Math.exp(-t / 0.02) * Math.sin(2 * Math.PI * 900 * t); } hp(d, 0.9); norm(d, 0.8); });
  S.beep = buf(0.14, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = Math.sin(2 * Math.PI * 2400 * t) * Math.min(1, t / 0.005) * Math.min(1, (0.14 - t) / 0.02); } norm(d, 0.5); });
  S.chime = buf(1.2, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = Math.exp(-t / 0.35) * Math.sin(2 * Math.PI * 880 * t) + (t > 0.18 ? Math.exp(-(t - 0.18) / 0.45) * Math.sin(2 * Math.PI * 1318.5 * t) : 0); } norm(d, 0.5); });
  S.steps = [0, 1, 2, 3].map((k) => buf(0.14, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = Math.exp(-t / (0.018 + 0.004 * k)) * rnd() * 0.8 + Math.exp(-t / 0.03) * Math.sin(2 * Math.PI * (85 + 10 * k) * t); } lp(d, 0.35 + 0.05 * k); norm(d, 0.7); }));
  S.dooro = buf(1.0, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = (t < 0.05 ? Math.exp(-t / 0.008) * rnd() : 0) + 0.25 * Math.sin(Math.PI * Math.min(t / 1.0, 1)) * rnd(); } lp(d, 0.08); norm(d, 0.6); });
  // apito de juiz (apito de ervilha): portadora ~3 kHz com trinado de ~28 Hz
  S.apito = buf(0.75, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; const tr = 0.5 + 0.5 * Math.sin(2 * Math.PI * 28 * t);
    const f = 2950 + 220 * tr; const env = Math.min(1, t / 0.02) * Math.min(1, (0.75 - t) / 0.06);
    d[i] = env * ((0.55 + 0.45 * tr) * Math.sin(2 * Math.PI * f * t + 0.8 * Math.sin(2 * Math.PI * 28 * t)) + 0.12 * rnd()); } norm(d, 0.9); });
  S.erro = buf(0.55, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; const f = t < 0.25 ? 440 : 330; d[i] = (t % 0.25 < 0.2 ? 1 : 0) * (Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.5 + 0.5 * Math.sin(2 * Math.PI * f * t)); } lp(d, 0.4); norm(d, 0.6); });
  S.pneu = buf(0.6, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = rnd() * Math.exp(-t / 0.16) * Math.min(1, t / 0.01) + 0.4 * Math.exp(-t / 0.01) * rnd(); } hp(d, 0.6); norm(d, 0.55); });
  S.doorc = buf(0.5, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = Math.exp(-t / 0.05) * Math.sin(2 * Math.PI * 75 * t) + 0.6 * Math.exp(-t / 0.01) * rnd(); } norm(d, 0.9); });
  return S;
}
function positional(obj, buffer, loop, ref = 1.5, vol = 0) {
  const a = new THREE.PositionalAudio(listener);
  a.setBuffer(buffer); a.setLoop(loop); a.setRefDistance(ref); a.setRolloffFactor(1.4); a.setDistanceModel('inverse');
  if (loop) { a.panner.panningModel = 'equalpower'; a.setVolume(vol); }
  obj.add(a); return a;
}
const audio = { on: true, loops: [], pools: {} };
function anchor(v) { const o = new THREE.Object3D(); o.position.copy(v); world.add(o); return o; }
function initAudio() {
  if (AC) return;
  AC = listener.context; SND = makeSounds();
  for (const mn of MN) {
    const m = machines[mn];
    const low = anchor(B(m.R.pos[0], m.R.pos[1], 0.5)), mid = anchor(B(m.R.pos[0], m.R.pos[1], 1.4)), top = anchor(B(m.R.pos[0], m.R.pos[1], 2.4));
    m.snd = { motor: positional(low, SND.motor, true), pump: positional(low, SND.pump, true), vac: positional(low, SND.vac, true), heads: positional(top, SND.heads, true),
      thumps: [0, 1, 2].map(() => positional(mid, SND.thump, false, 2.0)), fx: [0, 1].map(() => positional(mid, SND.click, false, 1.2)), mid };
    for (const k of ['motor', 'pump', 'vac', 'heads']) { m.snd[k].play(); audio.loops.push(m.snd[k]); }
  }
  const pumpA = anchor(B(R.pts.pump[0], R.pts.pump[1], 0.3));
  audio.tpump = positional(pumpA, SND.tpump, true, 1.5); audio.tpump.play();
  audio.hvac = new THREE.Audio(listener); audio.hvac.setBuffer(SND.hvac); audio.hvac.setLoop(true); audio.hvac.setVolume(0.12); audio.hvac.play();
  audio.door = anchor(B(R.pts.door[0], R.pts.door[1], 1.2));
  audio.tv = anchor(B(0, 4.9, 3.0));
  audio.panel = anchor(B(R.pts.panel[0], R.pts.panel[1], 1.2));
  for (const n of ['OPERADORA', 'SUPERVISOR']) audio.pools[n] = [0, 1, 2, 3].map((k) => { const o = anchor(new THREE.Vector3()); return { o, a: positional(o, SND.steps[k], false, 1.0) }; });
}
function oneShot(obj, buffer, vol = 1, ref = 1.5) {
  if (!AC || !audio.on) return;
  const a = positional(obj, buffer, false, ref); a.setVolume(vol); a.play();
  a.source.onended = () => { obj.remove(a); a.disconnect(); };
}
let stepIdx = { OPERADORA: 0, SUPERVISOR: 0 };
function triggerEvents(t0, t1) {
  if (!AC || !audio.on || t1 <= t0 || t1 - t0 > 1.0) return;
  for (const e of R.events) {
    if (e.t <= t0 || e.t > t1) continue;
    const m = e.m ? machines[e.m] : null;
    if (e.type === 'ihm_toque' || e.type === 'botao' || e.type === 'pipeta') oneShot(m.snd.mid, SND.beep, e.type === 'pipeta' ? 0.3 : 0.6, 1.0);
    else if (e.type === 'porta_maq_abre' || e.type === 'porta_maq_fecha') oneShot(m.snd.mid, SND.click, 0.8, 1.2);
    else if (e.type === 'apito') oneShot(audio.door, SND.apito, 1.0, 5);
    else if (e.type === 'erro') oneShot(m ? m.snd.mid : audio.panel, SND.erro, 0.9, 2);
    else if (e.type === 'porta_abre') oneShot(audio.door, SND.dooro, 0.9);
    else if (e.type === 'porta_fecha') oneShot(audio.door, SND.doorc, 1.0);
    else if (e.type === 'ciclo_fim') { oneShot(audio.tv, SND.chime, 0.8, 4); oneShot(m.snd.mid, SND.beep, 0.6); }
    else if (e.type === 'botao_transf') oneShot(audio.panel, SND.beep, 0.7, 1.0);
    else if (e.type === 'tablet_toque') { }
  }
  // cliques de válvula nas transições de dosagem / drenagem
  for (const mn of MN) for (const c of R.machines[mn].cycles) for (const tt of [c.dosa[0], c.dosa[1], c.dreno ? c.dreno[0] : -1, c.dreno ? c.dreno[1] : -1]) {
    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.click, 0.7, 1.2);
  }
  for (const mn of MN) for (const c of R.machines[mn].cycles) for (const tt of [c.n === 1 ? c.fecha[0] : -1, c.final && c.abre ? c.abre[0] : -1]) {
    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.pneu, 0.8, 1.4);
  }
  for (const n of ['OPERADORA', 'SUPERVISOR']) {
    const L = R.steps[n];
    for (const s of L) if (s[0] > t0 && s[0] <= t1) {
      const p = audio.pools[n][stepIdx[n]++ % 4];
      p.o.position.copy(B(s[1], s[2], 0.02));
      if (p.a.isPlaying) p.a.stop();
      p.a.setVolume(n === 'OPERADORA' ? 0.5 : 0.65); p.a.play();
    }
  }
}
function setLoop(a, v) { if (!a) return; const g = a.gain.gain; g.setTargetAtTime(audio.on ? v : 0, AC.currentTime, 0.08); }
function updateAudio(t, t0, playing) {
  if (!AC) return;
  for (const mn of MN) {
    const m = machines[mn], st = state(mn, t), k = st.k;
    const run = playing ? 1 : 0;
    setLoop(m.snd.motor, run * (k === 'DINAMIZANDO' ? 0.55 : 0));
    setLoop(m.snd.pump, run * (k === 'DOSANDO' ? 0.35 : 0));
    setLoop(m.snd.vac, run * (k === 'DRENANDO' ? 0.45 : 0));
    setLoop(m.snd.heads, run * (k === 'FECHANDO' || k === 'ABRINDO' ? 0.25 : 0));
    // golpes: um a cada volta da manivela
    const n = k === 'DINAMIZANDO' ? m.strokes : -1;
    if (playing && n > m.lastStroke && m.lastStroke >= 0 && t - t0 < 0.5) {
      const a = m.snd.thumps[n % 3]; if (a.isPlaying) a.stop(); a.setVolume(audio.on ? 0.9 : 0); a.play();
    }
    m.lastStroke = n;
  }
  setLoop(audio.tpump, (playing && t >= R.transfer.t0 && t < R.transfer.t1) ? 0.7 : 0);
  setLoop(audio.hvac, 0.10);
}

// ------------------------------------------------------------------ câmeras
const VIEWS = {
  geral: [B(-0.6, -4.75, 3.3), B(0.2, 1.0, 1.3)],
  m1: [B(0.9, -4.3, 1.8), B(3.0, -2.4, 1.3)],
  bocais: [B(2.05, -2.85, 1.72), B(3.2, -2.3, 1.08)],
  tv: [B(0, 0.8, 1.7), B(0, 4.9, 2.9)],
  tanque: [B(2.0, -2.6, 1.8), B(0.1, 0.0, 1.0)],
  memoria: [B(-2.5, -5.6, 1.7), B(-2.5, -9.0, 1.3)],
  entrada2: [B(-1.9, -3.3, 1.65), B(-4.3, -5.2, 1.15)],
};
let camMode = 'geral';
function setView(v) {
  camMode = v;
  if (VIEWS[v]) { camera.position.copy(VIEWS[v][0]); controls.target.copy(VIEWS[v][1]); controls.update(); }
}
setView('geral');
const tmpV = new THREE.Vector3(), tmpW = new THREE.Vector3();
function followCam(n, dt) {
  const p = people[n]; if (!p || !p.a) return;
  p.a.getWorldPosition(tmpV);
  const head = p.head ? p.head.getWorldPosition(tmpW) : tmpV.clone().setY(1.6);
  const q = new THREE.Quaternion(); p.a.getWorldQuaternion(q);
  const back = new THREE.Vector3(0, 0, -1).applyQuaternion(q);           // o personagem olha para +Z local (−Y do Blender)
  back.y = 0; back.normalize();
  const want = head.clone().addScaledVector(back, 2.4).add(new THREE.Vector3(0.4, 0.55, 0));
  camera.position.lerp(want, Math.min(1, dt * 2.5));
  controls.target.lerp(head.clone().add(new THREE.Vector3(0, -0.25, 0)), Math.min(1, dt * 4));
}

// ------------------------------------------------------------------ VR e AR (Quest / Android)
const vrBtn = VRButton.createButton(renderer);
$('vrslot').appendChild(vrBtn);
// AR (REV17 · etapa 2): marcador no piso → toque para posicionar → arrastar / girar / pinçar → âncora no ambiente
//   celular: 1 dedo arrasta, 2 dedos giram (na maquete, pinça muda a escala); botões na tela: Reposicionar, ⟲ ⟳
//   Quest: gatilho (ou pinça da mão) posiciona e, segurado, arrasta; analógico direito gira; X = reposicionar
const XR = { mode: null, scale: 1, state: 'idle', yaw: 0, hitSrc: null, touchSrc: null, ctrlHit: new Map(), anchor: null, needAnchor: false,
  active: new Map(), drag: null, twist: null, lastHit: null, t0: 0, manipT: 0, hasHit: false };
const SHELL = /Parede|Piso epoxi|Forro|Junta de painel|Aluminio luminaria|Difusor LED|Rodape|antecamara/i;
const shell = [];
sala.traverse((o) => { if (o.isMesh) { const mats = [].concat(o.material).map((m) => m.name).join('|'); if (SHELL.test(mats) || SHELL.test(o.name)) shell.push(o); } });
// marcador de superfície: disco branco translúcido + anel + cruz (como nos apps de AR)
XR.reticle = new THREE.Group(); XR.reticle.visible = false; scene.add(XR.reticle);
{
  const disk = new THREE.Mesh(new THREE.CircleGeometry(0.16, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.17, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }));
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.09).rotateX(-Math.PI / 2), ring.material);
  const cross2 = cross.clone(); cross2.rotation.y = Math.PI / 2;
  XR.reticle.add(disk, ring, cross, cross2);
  XR.reticle.userData.ring = ring;
}
// contorno da área ocupada (sala 10 × 10 m ou maquete) — aparece enquanto posiciona/arrasta
const footprint = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([B(-5, -5, 0.01), B(5, -5, 0.01), B(5, 5, 0.01), B(-5, 5, 0.01)]),
  new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
footprint.visible = false; world.add(footprint);
// raios dos controles / mãos do Quest
const rays = [0, 1].map((i) => {
  const c = renderer.xr.getController(i);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
  line.scale.z = 4; c.add(line); rig.add(c); return c;
});
// interface sobre a câmera (dom-overlay, Android)
const arui = document.createElement('div'); arui.id = 'arui';
arui.innerHTML = `<div id="armsg">Procurando superfície… mova o celular devagar apontando para o piso</div>
  <div id="arbtns"><button id="arRe">⟲ Reposicionar</button><button id="arL">↺</button><button id="arR">↻</button><button id="arPlay">❚❚</button><button id="arExit">Sair</button></div>`;
document.body.appendChild(arui);
$('arbtns').addEventListener('beforexrselect', (e) => e.preventDefault());       // toques nos botões não posicionam
const arMsg = (s) => { const m = $('armsg'); if (m && m.textContent !== s && !(typeof flashUntil !== 'undefined' && performance.now() < flashUntil)) m.textContent = s; };
function uiState() {
  $('arbtns').style.display = XR.state === 'placed' ? 'flex' : 'none';
  $('arPlay').textContent = st.playing ? '❚❚' : '▶';
}
$('arRe').onclick = () => startPlacing();
$('arL').onclick = () => rotateBy(Math.PI / 12);
$('arR').onclick = () => rotateBy(-Math.PI / 12);
$('arPlay').onclick = () => { togglePlay(); uiState(); };
$('arExit').onclick = () => renderer.xr.getSession() && renderer.xr.getSession().end();

function arButton(label, scale) {
  const b = document.createElement('button'); b.textContent = label; b.style.marginLeft = '6px';
  if (!navigator.xr) { b.disabled = true; b.title = 'Este navegador não tem WebXR'; }
  else navigator.xr.isSessionSupported('immersive-ar').then((ok) => { if (!ok) { b.disabled = true; b.title = 'AR não suportado neste aparelho'; } });
  b.onclick = async () => {
    if (renderer.xr.isPresenting) { renderer.xr.getSession().end(); return; }
    try {
      const RO = arOpcoes();
      const ses = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor'],
        optionalFeatures: RO.opt, domOverlay: { root: arui }, ...RO.extra });
      XR.mode = 'ar'; XR.scale = scale;
      await renderer.xr.setSession(ses);
      try { const vs = await ses.requestReferenceSpace('viewer'); XR.hitSrc = await ses.requestHitTestSource({ space: vs }); } catch (e) { XR.hitSrc = null; }
      try { XR.touchSrc = await ses.requestHitTestSourceForTransientInput({ profile: 'generic-touchscreen' }); } catch (e) { XR.touchSrc = null; }
      ses.addEventListener('inputsourceschange', onSources); onSources({ added: [...ses.inputSources], removed: [] });
      ses.addEventListener('selectstart', onSelectStart);
      ses.addEventListener('selectend', onSelectEnd);
    } catch (e) { alert('Não foi possível iniciar a realidade aumentada: ' + e.message); }
  };
  $('vrslot').appendChild(b);
}
arButton('AR 1:1', 1);
arButton('AR maquete 1:20', 0.05);

function onSources(ev) {
  const ses = renderer.xr.getSession(); if (!ses) return;
  for (const s of ev.removed || []) { const h = XR.ctrlHit.get(s); if (h) h.cancel(); XR.ctrlHit.delete(s); }
  for (const s of ev.added || []) if (s.targetRayMode === 'tracked-pointer' && ses.requestHitTestSource) {
    ses.requestHitTestSource({ space: s.targetRaySpace }).then((h) => XR.ctrlHit.set(s, h)).catch(() => {});
  }
}
const ref = () => renderer.xr.getReferenceSpace();
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _d = new THREE.Vector3();
function dropAnchor() { if (XR.anchor) { try { XR.anchor.delete(); } catch (e) { } XR.anchor = null; } }
function startPlacing() {
  dropAnchor(); XR.state = 'placing'; XR.drag = null; XR.twist = null; XR.hasHit = false; XR.t0 = performance.now();
  world.scale.setScalar(XR.scale); world.visible = false; footprint.visible = true; uiState();
}
function faceYaw() { camera.getWorldDirection(_d); return Math.atan2(-_d.x, -_d.z); }   // porta (frente da sala) voltada para quem olha
function applyPose(pos) { world.position.copy(pos); world.quaternion.setFromAxisAngle(_v.set(0, 1, 0), XR.yaw); }
function rotateBy(a) { XR.yaw += a; world.quaternion.setFromAxisAngle(_v.set(0, 1, 0), XR.yaw); dropAnchor(); XR.manipT = performance.now(); XR.needAnchor = true; }
function confirmPlace() {
  if (!world.visible) return;
  XR.state = 'placed'; footprint.visible = false; XR.reticle.visible = false; XR.needAnchor = true; uiState();
}
function screenTouches() { return [...XR.active.keys()].filter((s) => s.targetRayMode === 'screen'); }
function onSelectStart(e) {
  if (XR.mode !== 'ar') return;
  if (OP && XR.state === 'placed' && OP.xrSelect(e)) return;          // modo Operar: toque/gatilho em algo clicável
  const s = e.inputSource; XR.active.set(s, { t: performance.now() });
  if (XR.state !== 'placed') return;
  const tl = screenTouches();
  if (tl.length >= 2) {                                   // 2 dedos: girar (e pinçar na maquete)
    XR.drag = null;
    const [a, b] = tl; const ga = a.gamepad, gb = b.gamepad;
    if (ga && gb) XR.twist = { a, b, ang: Math.atan2(gb.axes[1] - ga.axes[1], gb.axes[0] - ga.axes[0]), dist: Math.hypot(gb.axes[0] - ga.axes[0], gb.axes[1] - ga.axes[1]), yaw: XR.yaw, scale: world.scale.x };
  } else XR.drag = { src: s, off: null, start: null, moved: false };
}
function onSelectEnd(e) {
  if (XR.mode !== 'ar') return;
  const s = e.inputSource, info = XR.active.get(s); XR.active.delete(s);
  if (XR.state === 'placing') { confirmPlace(); return; }
  if (XR.twist && (XR.twist.a === s || XR.twist.b === s)) { XR.twist = null; XR.needAnchor = true; }
  if (XR.drag && XR.drag.src === s) { const moved = XR.drag.moved; XR.drag = null; if (moved) XR.needAnchor = true; }
}
// ponto onde um raio (origem o, direção d) cruza o plano horizontal y = h
function rayPlane(o, d, h) { if (Math.abs(d.y) < 1e-4) return null; const u = (h - o.y) / d.y; return u > 0 && u < 30 ? o.clone().addScaledVector(d, u) : null; }
function poseRay(space, frame) {
  const p = frame.getPose(space, ref()); if (!p) return null;
  const o = new THREE.Vector3().copy(p.transform.position); const q = _q.copy(p.transform.orientation);
  return { o, d: new THREE.Vector3(0, 0, -1).applyQuaternion(q) };
}
function arFrame(frame, dt) {
  if (!frame || XR.mode !== 'ar') return;
  const rs = ref();
  // ---------------- posicionando: o marcador segue a superfície e a sala/maquete aparece como prévia
  if (XR.state === 'placing') {
    let hit = null;
    const ctrl = [...XR.ctrlHit.entries()].find(([s]) => s.handedness === 'right') || [...XR.ctrlHit.entries()][0];
    const src = ctrl ? ctrl[1] : XR.hitSrc;
    if (src) { const hs = frame.getHitTestResults(src); if (hs.length) { const p = hs[0].getPose(rs); if (p) hit = new THREE.Vector3().copy(p.transform.position); XR.lastHitResult = hs[0]; } }
    if (!hit && performance.now() - XR.t0 > 3000) {       // sem superfície detectada: usa o piso (local-floor) à frente
      const r = ctrl ? poseRay([...XR.ctrlHit.keys()][0].targetRaySpace, frame) : null;
      if (r) hit = rayPlane(r.o, r.d, XR.scale < 1 ? 0.75 : 0);
      if (!hit) { camera.getWorldPosition(_v); camera.getWorldDirection(_d); _d.y = 0; _d.normalize(); hit = _v.clone().addScaledVector(_d, XR.scale < 1 ? 0.8 : 3.0).setY(XR.scale < 1 ? 0.75 : 0); }
    }
    if (hit) {
      XR.hasHit = true; XR.reticle.visible = true; XR.reticle.position.copy(hit);
      XR.reticle.userData.ring.scale.setScalar(1 + 0.06 * Math.sin(performance.now() / 180));
      XR.yaw = faceYaw(); applyPose(hit); world.visible = true;
      arMsg(XR.scale < 1 ? 'Superfície encontrada · toque para colocar a maquete' : 'Piso encontrado · toque para posicionar a sala (1:1)');
    } else { XR.reticle.visible = false; world.visible = false; arMsg('Procurando superfície… mova o celular devagar apontando para o piso'); }
    return;
  }
  if (XR.state !== 'placed') return;
  // ---------------- 2 dedos: girar / escala da maquete
  if (XR.twist) {
    const ga = XR.twist.a.gamepad, gb = XR.twist.b.gamepad;
    if (ga && gb) {
      const ang = Math.atan2(gb.axes[1] - ga.axes[1], gb.axes[0] - ga.axes[0]);
      XR.yaw = XR.twist.yaw - (ang - XR.twist.ang); dropAnchor();
      if (XR.scale < 1) { const dist = Math.hypot(gb.axes[0] - ga.axes[0], gb.axes[1] - ga.axes[1]); world.scale.setScalar(THREE.MathUtils.clamp(XR.twist.scale * dist / Math.max(XR.twist.dist, 1e-3), 0.02, 0.15)); }
      world.quaternion.setFromAxisAngle(_v.set(0, 1, 0), XR.yaw);
      arMsg(`Girando${XR.scale < 1 ? ' · escala 1:' + Math.round(1 / world.scale.x) : ''}`);
    }
  }
  // ---------------- arrastar: 1 dedo (hit-test do toque) ou raio do controle/mão (plano do piso da sala)
  else if (XR.drag) {
    const D = XR.drag; let p = null;
    if (D.src.targetRayMode === 'screen' && XR.touchSrc) {
      for (const r of frame.getHitTestResultsForTransientInput(XR.touchSrc)) if (r.inputSource === D.src && r.results.length) { const q = r.results[0].getPose(rs); if (q) p = new THREE.Vector3().copy(q.transform.position); }
    }
    if (!p) { const r = poseRay(D.src.targetRaySpace, frame); if (r) p = rayPlane(r.o, r.d, world.position.y); }
    if (p) {
      if (!D.start) { D.start = p.clone(); D.off = world.position.clone().sub(p); }
      if (!D.moved && p.distanceTo(D.start) > 0.03) { D.moved = true; dropAnchor(); footprint.visible = true; }
      if (D.moved) { world.position.set(p.x + D.off.x, D.src.targetRayMode === 'screen' ? p.y : world.position.y, p.z + D.off.z); arMsg('Movendo… solte para fixar'); }
    }
  } else { footprint.visible = false; arMsg(XR.scale < 1 ? 'Maquete fixada · 1 dedo arrasta · 2 dedos giram e mudam a escala' : 'Sala fixada · 1 dedo arrasta · 2 dedos giram'); }
  // ---------------- âncora: mantém a sala presa ao ambiente real enquanto você anda
  if (XR.needAnchor && !XR.drag && !XR.twist && performance.now() - XR.manipT > 400 && frame.createAnchor) {
    XR.needAnchor = false; dropAnchor();
    const t = new XRRigidTransform(world.position, world.quaternion);
    frame.createAnchor(t, rs).then((a) => { if (XR.state === 'placed' && !XR.drag && !XR.twist) XR.anchor = a; else a.delete(); }).catch(() => { });
  }
  if (XR.anchor && frame.trackedAnchors && frame.trackedAnchors.has(XR.anchor)) {
    const p = frame.getPose(XR.anchor.anchorSpace, rs);
    if (p) { world.position.copy(p.transform.position); world.quaternion.copy(p.transform.orientation); }
  }
}
renderer.xr.addEventListener('sessionstart', () => {
  if (XR.mode === 'ar') {
    scene.background = null; shell.forEach((o) => { o.visible = false; });
    listener.setMasterVolume(XR.scale < 1 ? 0.45 : 1);
    arui.style.display = 'block'; startPlacing();
  } else { rig.position.copy(B(0.0, -4.2, 0)); rig.rotation.set(0, 0, 0); }
  rays.forEach((c) => { c.visible = true; });
  if (OP) {
    const ses = renderer.xr.getSession();
    if (XR.mode !== 'ar') ses.addEventListener('selectstart', (e) => OP.xrSelect(e));
    ses.addEventListener('squeezestart', (e) => OP.xrSqueezeStart(e));
    ses.addEventListener('squeezeend', (e) => OP.xrSqueezeEnd(e));
  }
  initAudio(); if (!st.playing) togglePlay(); uiState();
});
renderer.xr.addEventListener('sessionend', () => {
  if (XR.mode === 'ar') {
    scene.background = new THREE.Color(0xdfe3e7); shell.forEach((o) => { o.visible = true; });
    dropAnchor(); world.visible = true; footprint.visible = false;
    world.position.set(0, 0, 0); world.rotation.set(0, 0, 0); world.scale.setScalar(1); listener.setMasterVolume(1);
    XR.reticle.visible = false; XR.hitSrc = null; XR.touchSrc = null; XR.ctrlHit.clear(); XR.active.clear(); XR.drag = XR.twist = null; XR.mode = null; XR.state = 'idle';
    arui.style.display = 'none';
  }
  rays.forEach((c) => { c.visible = false; });
  rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); setView(camMode === 'livre' ? 'geral' : camMode);
});
// ------------------------------------------------------------------ REALISMO NO AR
// 1) luz estimada do ambiente real (Android/ARCore: direção, cor e reflexos do cômodo nos metais)
// 2) sombras reais no piso (captador de sombra invisível) + oclusão ambiente sob as máquinas
// 3) oclusão por profundidade no Quest 3 (mãos, pessoas e móveis reais escondem o virtual)
// 4) presets de luz (Quest não estima luz), mapeamento de tons neutro (cores das embalagens fiéis) e qualidade
const REAL = { luz: 'auto', alta: false, ocl: true, est: false, prev: null };
const IS_QUEST = /OculusBrowser|Quest|Pacific/i.test(navigator.userAgent);
try { const s = JSON.parse(localStorage.getItem('dinamizador_real') || '{}'); Object.assign(REAL, { luz: s.luz || 'auto', alta: !!s.alta, ocl: s.ocl !== false }); } catch (e) { }
const saveReal = () => { try { localStorage.setItem('dinamizador_real', JSON.stringify({ luz: REAL.luz, alta: REAL.alta, ocl: REAL.ocl })); } catch (e) { } };
const xrLight = new XREstimatedLight(renderer, true);
function usaLuzReal() {
  REAL.est = true; scene.add(xrLight); baseLights.forEach((l) => { l.visible = false; });
  if (xrLight.environment) { scene.environment = xrLight.environment; scene.environmentIntensity = 1.0; }
  renderer.toneMappingExposure = 1.0; if (typeof realBtn === 'function') realBtn();
}
xrLight.addEventListener('estimationstart', () => {
  if (XR.mode !== 'ar') return;
  REAL.estAvail = true; if (REAL.luz === 'auto') { usaLuzReal(); arMsgFlash('Luz do ambiente real detectada'); }
});
xrLight.addEventListener('estimationend', () => { REAL.est = false; REAL.estAvail = false; scene.remove(xrLight); });
// presets (intensidades da hemisférica, do "sol", do preenchimento, reflexo e exposição)
const LUZ = {
  auto: { nome: 'Luz automática', hemi: [0xffffff, 0x9aa2a8, 1.1], sun: [0xffffff, 0.9], fill: 0.3, env: 0.8, exp: 1.0, dir: [0.35, 1, 0.25] },
  led: { nome: 'Galpão LED (fria)', hemi: [0xf2f6ff, 0x8d949c, 1.15], sun: [0xf4f8ff, 1.0], fill: 0.3, env: 0.85, exp: 1.0, dir: [0.1, 1, 0.1] },
  quente: { nome: 'Luz quente', hemi: [0xfff1dc, 0xa08a70, 1.0], sun: [0xffe2b8, 1.0], fill: 0.25, env: 0.7, exp: 1.0, dir: [0.6, 1, 0.3] },
  janela: { nome: 'Luz de janela (lateral)', hemi: [0xeef4ff, 0x8a8f96, 0.8], sun: [0xffffff, 1.6], fill: 0.15, env: 0.7, exp: 1.05, dir: [1, 0.7, 0.2] },
  fraca: { nome: 'Ambiente escuro', hemi: [0xdfe6f0, 0x6e747a, 0.6], sun: [0xffffff, 0.5], fill: 0.15, env: 0.5, exp: 0.85, dir: [0.2, 1, 0.2] },
};
const LUZ_ORD = Object.keys(LUZ);
function aplicaLuz() {
  const P = LUZ[REAL.luz] || LUZ.auto;
  hemi.color.set(P.hemi[0]); hemi.groundColor.set(P.hemi[1]); hemi.intensity = P.hemi[2];
  sun.color.set(P.sun[0]); sun.intensity = P.sun[1]; fill.intensity = P.fill;
  scene.environment = envPadrao; scene.environmentIntensity = P.env; renderer.toneMappingExposure = P.exp;
  baseLights.forEach((l) => { l.visible = true; }); if (REAL.est) { scene.remove(xrLight); REAL.est = false; }
  if (REAL.luz === 'auto' && REAL.estAvail) usaLuzReal();
}
function restauraLuz() {
  hemi.color.set(0xffffff); hemi.groundColor.set(0x9aa2a8); hemi.intensity = 1.25; sun.color.set(0xffffff); sun.intensity = 0.9; fill.intensity = 0.35;
  scene.environment = envPadrao; scene.environmentIntensity = 0.75; renderer.toneMappingExposure = 1.0; baseLights.forEach((l) => { l.visible = true; });
}
// ---- sombras: luz só de sombra + captador invisível no piso (acompanha a sala/maquete)
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = true;
const shL = new THREE.DirectionalLight(0xffffff, 0.0001); shL.castShadow = false;
shL.shadow.mapSize.set(2048, 2048); shL.shadow.bias = -0.0004; shL.shadow.normalBias = 0.025; shL.shadow.radius = 3;
scene.add(shL, shL.target);
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(12, 18), new THREE.ShadowMaterial({ opacity: 0.38, depthWrite: false }));
catcher.rotation.x = -Math.PI / 2; catcher.position.set(0, 0.004, 2.5); catcher.receiveShadow = true; catcher.visible = false; catcher.renderOrder = -1; world.add(catcher);
// oclusão ambiente de contato sob as máquinas (sombra difusa que "assenta" a máquina no piso)
const aoTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 20, 128, 128, 126); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(0.55, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
const aoBlobs = [];
for (const mn of MN) { const m = machines[mn]; const bb = new THREE.Box3().setFromObject(m.root); const sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
  const b = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 1.35, sz.z * 1.35), new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, toneMapped: false }));
  b.rotation.x = -Math.PI / 2; world.worldToLocal(c); b.position.set(c.x, 0.005, c.z); b.visible = false; world.add(b); aoBlobs.push(b); }
let castersSet = false;
function setCasters(on) {
  world.traverse((o) => { if (!o.isMesh || o === catcher || aoBlobs.includes(o)) return; if (shell.includes(o)) { o.castShadow = false; return; }
    const m = [].concat(o.material)[0]; if (m && (m.transparent && m.opacity < 0.6 || m.isMeshBasicMaterial || m.isSpriteMaterial)) return; o.castShadow = on; });
  castersSet = on;
}
const _sd = new THREE.Vector3(), _wc = new THREE.Vector3();
function sombraFrame() {
  if (!shL.castShadow) return;
  const s = world.scale.x;
  if (REAL.est && xrLight.directionalLight.intensity > 0.05) _sd.copy(xrLight.directionalLight.position).normalize();
  else _sd.fromArray((LUZ[REAL.luz] || LUZ.auto).dir).normalize().applyQuaternion(world.quaternion);
  if (_sd.y < 0.35) { _sd.y = 0.35; _sd.normalize(); }                     // sol muito baixo gera sombra longa demais
  catcher.getWorldPosition(_wc);
  shL.target.position.copy(_wc); shL.position.copy(_wc).addScaledVector(_sd, 15 * s);
  const cam = shL.shadow.camera, e = 10.5 * s;
  if (cam.right !== e) { cam.left = -e; cam.right = e; cam.top = e; cam.bottom = -e; cam.near = 0.5 * s; cam.far = 40 * s; cam.updateProjectionMatrix(); }
  // sombra mais forte com luz dura (estimada forte / janela) e mais suave com luz difusa
  const dura = REAL.est ? Math.min(xrLight.directionalLight.intensity / 2.5, 1) : REAL.luz === 'janela' ? 0.9 : 0.55;
  catcher.material.opacity = 0.18 + 0.3 * dura;
}
// nitidez de texturas em ângulo (piso, rótulos, IHM)
const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
scene.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) if (m[k] && m[k].anisotropy < maxAniso) { m[k].anisotropy = maxAniso; m[k].needsUpdate = true; } });
// ---- início / fim do AR
renderer.xr.addEventListener('sessionstart', () => {
  if (XR.mode !== 'ar') return;
  REAL.prevTone = renderer.toneMapping; renderer.toneMapping = THREE.NeutralToneMapping;        // cores fiéis ao lado da imagem da câmera
  shL.castShadow = true; setCasters(true); catcher.visible = true; aoBlobs.forEach((b) => { b.visible = true; });
  if (REAL.luz !== 'auto' || !REAL.est) aplicaLuz();
  const ses = renderer.xr.getSession();
  REAL.depth = !!(ses.enabledFeatures && ses.enabledFeatures.includes('depth-sensing'));
  realBtn();
});
renderer.xr.addEventListener('sessionend', () => {
  if (REAL.prevTone !== undefined) renderer.toneMapping = REAL.prevTone;
  shL.castShadow = false; if (castersSet) setCasters(false); catcher.visible = false; aoBlobs.forEach((b) => { b.visible = false; });
  REAL.est = false; REAL.estAvail = false; scene.remove(xrLight); restauraLuz();
});
// opções da sessão AR (chamadas pelo botão AR antes de requestSession)
function arOpcoes() {
  const opt = ['hit-test', 'anchors', 'plane-detection', 'dom-overlay', 'hand-tracking', 'light-estimation'];
  const extra = {};
  if (IS_QUEST && REAL.ocl) { opt.push('depth-sensing'); extra.depthSensing = { usagePreference: ['gpu-optimized'], dataFormatPreference: ['float32', 'luminance-alpha', 'unsigned-short'] }; }
  renderer.xr.setFramebufferScaleFactor(REAL.alta ? (IS_QUEST ? 1.3 : 1.2) : 1.0);
  renderer.xr.setFoveation(REAL.alta ? 0.5 : 1);
  return { opt, extra };
}
// ---- interface: seletor antes de entrar e botão ☀ dentro do AR (celular)
const selLuz = document.createElement('select'); selLuz.id = 'arluz'; selLuz.title = 'Luz e qualidade do AR';
for (const k of LUZ_ORD) { const o = document.createElement('option'); o.value = k; o.textContent = '☀ ' + LUZ[k].nome; selLuz.appendChild(o); }
[['q_alta', '✦ Qualidade alta (mais nítido)'], ['q_norm', '✦ Qualidade normal'], ['ocl_on', '◐ Oclusão real ligada (Quest 3)'], ['ocl_off', '◐ Oclusão real desligada']].forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; selLuz.appendChild(o); });
function realSel() { selLuz.value = REAL.luz; [...selLuz.options].forEach((o) => { if (o.value === 'q_alta') o.textContent = (REAL.alta ? '✔ ' : '') + '✦ Qualidade alta (mais nítido)'; if (o.value === 'q_norm') o.textContent = (!REAL.alta ? '✔ ' : '') + '✦ Qualidade normal';
  if (o.value === 'ocl_on') o.textContent = (REAL.ocl ? '✔ ' : '') + '◐ Oclusão real ligada (Quest 3)'; if (o.value === 'ocl_off') o.textContent = (!REAL.ocl ? '✔ ' : '') + '◐ Oclusão real desligada'; }); }
selLuz.onchange = () => { const v = selLuz.value; if (v === 'q_alta') REAL.alta = true; else if (v === 'q_norm') REAL.alta = false; else if (v === 'ocl_on') REAL.ocl = true; else if (v === 'ocl_off') REAL.ocl = false; else { REAL.luz = v; if (renderer.xr.isPresenting && XR.mode === 'ar') aplicaLuz(); }
  saveReal(); realSel(); };
$('vrslot').appendChild(selLuz); realSel();
const bLuz = document.createElement('button'); bLuz.id = 'arLuz'; $('arbtns').prepend(bLuz);
function realBtn() { bLuz.textContent = '☀ ' + (REAL.luz === 'auto' ? (REAL.est ? 'Auto (real)' : 'Auto') : LUZ[REAL.luz].nome.split(' ')[0]); }
bLuz.onclick = () => { REAL.luz = LUZ_ORD[(LUZ_ORD.indexOf(REAL.luz) + 1) % LUZ_ORD.length]; aplicaLuz(); saveReal(); realSel(); realBtn(); arMsgFlash(LUZ[REAL.luz].nome + (REAL.luz === 'auto' ? ' · usa a luz real quando o aparelho estima' : '')); };
let flashUntil = 0; function arMsgFlash(s) { const m = $('armsg'); if (m) { m.textContent = s; flashUntil = performance.now() + 2500; } }
window.__real = { REAL, aplicaLuz, sombraFrame, catcher, shL, setCasters, aoBlobs, shell, renderer };

let snapCool = 0, btnPrev = {};
function xrInput(dt) {
  const s = renderer.xr.getSession(); if (!s) return;
  const ar = XR.mode === 'ar';
  for (const src of s.inputSources) {
    const gp = src.gamepad; if (!gp || src.targetRayMode === 'screen') continue;
    const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0], gp.axes[1]];
    const moving = Math.abs(ax[0]) > 0.15 || Math.abs(ax[1]) > 0.15;
    if (src.handedness === 'left') {
      const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
      const sp = (ar ? (XR.scale < 1 ? 0.3 : 1.0) : 1.6) * dt;
      if (ar) { if (XR.state === 'placed' && moving) { dropAnchor(); world.position.addScaledVector(dir, -ax[1] * sp).addScaledVector(right, ax[0] * sp); XR.manipT = performance.now(); XR.needAnchor = true; } }
      else rig.position.addScaledVector(dir, -ax[1] * sp).addScaledVector(right, ax[0] * sp);
      const x = gp.buttons[4] && gp.buttons[4].pressed;                  // X: reposicionar
      if (ar && x && !btnPrev.x) startPlacing();
      btnPrev.x = x;
      const y = gp.buttons[5] && gp.buttons[5].pressed;                  // Y: avançar (modo Operar)
      if (OP && y && !btnPrev.y) OP.skip();
      btnPrev.y = y;
    } else if (src.handedness === 'right') {
      snapCool -= dt;
      if (ar) {
        if (XR.state === 'placed' && moving) {
          dropAnchor(); XR.yaw -= ax[0] * dt * 0.8; world.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), XR.yaw);
          if (XR.scale < 1) world.position.y -= ax[1] * dt * 0.2;                                 // na maquete ajusta a altura
          XR.manipT = performance.now(); XR.needAnchor = true;
        }
      } else if (Math.abs(ax[0]) > 0.7 && snapCool <= 0) { rig.rotation.y -= Math.sign(ax[0]) * Math.PI / 6; snapCool = 0.35; }
      const a = gp.buttons[4] && gp.buttons[4].pressed, b = gp.buttons[5] && gp.buttons[5].pressed;
      if (a && !btnPrev.a) togglePlay();
      if (b && !btnPrev.b) { const v = [1, 2, 4]; st.speed = v[(v.indexOf(st.speed) + 1) % 3]; $('spd').value = String(st.speed); }
      btnPrev.a = a; btnPrev.b = b;
    }
  }
}

// ------------------------------------------------------------------ interface
const st = { t: 0, playing: false, speed: 1 };
$('seek').max = String(T_END);
function togglePlay() { st.playing = !st.playing; $('play').textContent = st.playing ? '❚❚' : '▶'; if (st.playing && st.t >= T_END - 0.05) st.t = 0; }
$('play').onclick = () => { initAudio(); togglePlay(); };
$('spd').onchange = (e) => { st.speed = parseFloat(e.target.value); };
$('seek').oninput = (e) => { st.t = parseFloat(e.target.value); for (const m of Object.values(machines)) m.lastStroke = -1; };
$('cam').onchange = (e) => setView(e.target.value);
$('snd').onclick = () => { initAudio(); audio.on = !audio.on; $('snd').classList.toggle('on', audio.on); $('snd').textContent = audio.on ? '🔊' : '🔇'; };
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); initAudio(); togglePlay(); } });
controls.addEventListener('start', () => { if (camMode === 'operadora' || camMode === 'supervisor') { camMode = 'livre'; $('cam').value = 'livre'; } });
$('lt').textContent = 'pronto';
$('modo').value = OPMODE ? 'operar' : 'assistir';
$('modo').onchange = (e) => { if (e.target.value === 'operar') location.href = 'rev17.html?modo=operar'; };
if (OPMODE) {
  $('start').textContent = '▶ Operar (você é a operadora)';
  document.querySelector('#top small').textContent = 'MODO OPERAR · clique na IHM da M1 → PARTIDA ESCALONADA · abra as portas, pipete P1–P6, feche e CONFIRMAR · ⏩ avança o tempo';
  setView('m1');
}
$('start').style.display = 'block';
$('start').onclick = () => { $('load').remove(); initAudio(); togglePlay(); };

function drawFases(t) {
  $('fases').innerHTML = MN.map((mn) => { const s = state(mn, t); return `<div><b>${mn}</b><i style="background:${COLOR[s.k]}"></i><span>${LABEL[s.k]} · ciclo ${s.n || 0}/2</span></div>`; }).join('')
    + `<div><b>TQ</b><i style="background:#19b3c9"></i><span>${tankVol(t).toFixed(1).replace('.', ',')} L no tanque de passagem</span></div>`;
}

// ------------------------------------------------------------------ ESPAÇO MEMÓRIA · GRUPO REAL (sala 5 × 5 m, 2ª porta na parede frontal)
// Quadros com a história da Real H e a vitrine dos produtos CMR Saúde / Homeopet (fontes públicas; embalagens ilustrativas).
const SR = (() => {
  const G = new THREE.Group(); G.name = 'ESPACO_MEMORIA'; world.add(G);
  const DX0 = -4.75, DX1 = -3.60, DH = 2.20, YW = -5.0, WT = 0.12;       // vão da porta (coordenadas Blender)
  const RX0 = -5.0, RX1 = 0.0, RY0 = -10.0, RY1 = YW - WT, RH2 = 3.2;     // sala 5 × 5 m (interna)
  const Bv = (x, y, z) => B(x, y, z);
  // ---- abre o vão na parede frontal da sala de dinamização (remove a parede/rodapé/juntas originais à esquerda da porta de entrada)
  let wallMat = null, epoxiMat = null;
  sala.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.index) return;
    const mn = [].concat(o.material).map((m) => m.name).join('|');
    const isWall = /Parede painel branco/.test(mn), isJ = /Junta de painel/.test(mn), isEp = /Piso epoxi/.test(mn);
    if (!isWall && !isJ && !isEp) return;
    if (isWall && !wallMat) wallMat = [].concat(o.material)[0];
    if (isEp && !epoxiMat) epoxiMat = [].concat(o.material)[0];
    o.updateWorldMatrix(true, false);
    const pos = o.geometry.attributes.position, idx = o.geometry.index.array, keep = [], v = new THREE.Vector3();
    const inv = new THREE.Matrix4().copy(world.matrixWorld).invert();
    const P = (i) => v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv).clone();
    for (let f = 0; f < idx.length; f += 3) {
      const a = P(idx[f]), b = P(idx[f + 1]), c = P(idx[f + 2]);
      const zs = [a.z, b.z, c.z], xs = [a.x, b.x, c.x], ys = [a.y, b.y, c.y];
      let drop = false;
      if ((isWall || isJ) && Math.min(...zs) >= 4.99 && Math.max(...xs) <= 3.0001) drop = true;          // parede frontal A + juntas
      if (isEp && Math.min(...zs) >= 4.89 && Math.max(...ys) <= 0.105 && Math.max(...xs) <= 3.0001 && Math.min(...ys) > -0.001) drop = true;   // rodapé frontal A
      if (!drop) keep.push(idx[f], idx[f + 1], idx[f + 2]);
    }
    if (keep.length !== idx.length) { o.geometry = o.geometry.clone(); o.geometry.setIndex(keep); }
  });
  wallMat = wallMat || new THREE.MeshStandardMaterial({ color: 0xe9ebe9, roughness: 0.6 });
  const box = (x0, x1, y0, y1, z0, z1, m, parent = G) => {
    const g = new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0);
    const o = new THREE.Mesh(g, m); o.position.copy(Bv((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); parent.add(o); return o;
  };
  const shellAdd = (o) => { if (typeof shell !== 'undefined') shell.push(o); return o; };
  // parede frontal reconstruída com o vão
  const RODAPE = new THREE.MeshStandardMaterial({ color: 0x8c9296, roughness: 0.35 });
  const JUNTA = new THREE.MeshStandardMaterial({ color: 0x8b9092, roughness: 0.5 });
  shellAdd(box(-5.0, DX0, YW - WT, YW, 0, 4.5, wallMat));
  shellAdd(box(DX1, 3.0, YW - WT, YW, 0, 4.5, wallMat));
  shellAdd(box(DX0, DX1, YW - WT, YW, DH, 4.5, wallMat));
  shellAdd(box(-5.0, DX0, YW, YW + 0.1, 0, 0.1, RODAPE)); shellAdd(box(DX1, 3.0, YW, YW + 0.1, 0, 0.1, RODAPE));
  for (const x of [-2.6, -1.4, -0.2, 1.0, 2.2]) shellAdd(box(x - 0.003, x + 0.003, YW, YW + 0.002, 0.1, 4.5, JUNTA));
  // ---- porta (1 folha, abre para dentro do Espaço Memória), batente inox e placas dos dois lados
  const INOX = new THREE.MeshStandardMaterial({ color: 0xb9bdc1, metalness: 0.85, roughness: 0.32 });
  const BRANCO = new THREE.MeshStandardMaterial({ color: 0xf1f2f0, roughness: 0.45 });
  const VIDRO = new THREE.MeshStandardMaterial({ color: 0xc8dde6, roughness: 0.05, transparent: true, opacity: 0.25 });
  box(DX0 - 0.05, DX0, YW - WT - 0.01, YW + 0.01, 0, DH + 0.05, INOX); box(DX1, DX1 + 0.05, YW - WT - 0.01, YW + 0.01, 0, DH + 0.05, INOX);
  box(DX0 - 0.05, DX1 + 0.05, YW - WT - 0.01, YW + 0.01, DH, DH + 0.05, INOX);
  const hinge = new THREE.Group(); hinge.position.copy(Bv(DX1 - 0.01, YW - 0.06, 0)); G.add(hinge);
  const LW = DX1 - DX0 - 0.03;
  const leaf = new THREE.Group(); hinge.add(leaf);
  const lb = (x0, x1, y0, y1, z0, z1, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0), m); o.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(y0 + y1) / 2); leaf.add(o); return o; };
  lb(-LW, 0, -0.022, 0.022, 0.01, DH - 0.01, BRANCO);
  lb(-LW * 0.72, -LW * 0.28, -0.025, 0.025, 1.25, 1.85, VIDRO);
  lb(-LW + 0.10, -LW + 0.26, 0.025, 0.045, 1.03, 1.07, INOX); lb(-LW + 0.10, -LW + 0.26, -0.045, -0.025, 1.03, 1.07, INOX);
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  function plane(w, h, tex, pos, rotY, parent = G, basic = false) {
    const m = basic ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.copy(pos); o.rotation.y = rotY; parent.add(o); return o;
  }
  const VERDE = '#0f5132', DOURADO = '#c9a24a', CREME = '#f7f3ea', TINTA = '#1e2a24';
  function wrap(g, text, x, y, maxW, lh) { const words = text.split(' '); let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) g.fillText(line, x, y); return y + lh; }
  const signTex = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = VERDE; g.fillRect(0, 0, w, h); g.strokeStyle = DOURADO; g.lineWidth = 10; g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 86px Georgia,serif'; g.fillText('ESPAÇO MEMÓRIA', w / 2, 120); g.font = '44px Georgia,serif'; g.fillStyle = DOURADO; g.fillText('Grupo Real · Real H · CMR Saúde', w / 2, 196); });
  plane(1.1, 0.275, signTex, Bv((DX0 + DX1) / 2, YW + 0.004, DH + 0.35), Math.PI, G);        // lado da sala de dinamização (voltada para +y Blender)
  plane(1.1, 0.275, signTex, Bv((DX0 + DX1) / 2, YW - WT - 0.004, DH + 0.35), 0, G);          // lado do Espaço Memória
  // ---- Espaço Memória: piso de madeira, paredes, forro, iluminação
  const woodTex = canvasTex(1024, 1024, (g, w, h) => { for (let i = 0; i < 16; i++) { const y = i * 64; const b = 150 + ((i * 53) % 30); g.fillStyle = `rgb(${b},${Math.round(b * 0.72)},${Math.round(b * 0.46)})`; g.fillRect(0, y, w, 64);
    for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(60,35,15,${0.06 + ((k * 7) % 5) * 0.02})`; g.beginPath(); const yy = y + ((k * 37) % 64); g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + 4, w * 0.6, yy - 4, w, yy + 2); g.stroke(); }
    g.fillStyle = 'rgba(40,20,5,.5)'; g.fillRect(0, y, w, 2); for (let s = (i * 211) % 400; s < w; s += 420) g.fillRect(s, y, 2, 64); } });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2.5, 2.5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RX1 - RX0, RY1 - RY0), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.copy(Bv((RX0 + RX1) / 2, (RY0 + RY1) / 2, 0.001)); G.add(floor); shellAdd(floor);
  const WALL2 = new THREE.MeshStandardMaterial({ color: 0xece4d6, roughness: 0.8 });
  const PANEL = new THREE.MeshStandardMaterial({ color: 0x173a2c, roughness: 0.7 });
  shellAdd(box(RX0 - WT, RX0, RY0 - WT, RY1, 0, RH2, WALL2)); shellAdd(box(RX1, RX1 + WT, RY0 - WT, RY1, 0, RH2, WALL2));
  shellAdd(box(RX0, RX1, RY0 - WT, RY0, 0, RH2, WALL2));
  shellAdd(box(RX0, RX1, RY0 - WT, RY1 + WT, RH2, RH2 + 0.05, new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.9 })));
  // lambris verde escuro até 1,0 m e friso dourado
  const FRISO = new THREE.MeshStandardMaterial({ color: 0xb8923e, metalness: 0.6, roughness: 0.35 });
  shellAdd(box(RX0, RX0 + 0.02, RY0, RY1, 0, 1.0, PANEL)); shellAdd(box(RX1 - 0.02, RX1, RY0, RY1, 0, 1.0, PANEL)); shellAdd(box(RX0, RX1, RY0, RY0 + 0.02, 0, 1.0, PANEL));
  shellAdd(box(RX0, RX0 + 0.03, RY0, RY1, 1.0, 1.03, FRISO)); shellAdd(box(RX1 - 0.03, RX1, RY0, RY1, 1.0, 1.03, FRISO)); shellAdd(box(RX0, RX1, RY0, RY0 + 0.03, 1.0, 1.03, FRISO));
  // lado do Espaço Memória da parede frontal (a parede da sala de dinamização já existe; aqui só o acabamento)
  shellAdd(box(RX0, DX0 - 0.05, RY1 - 0.02, RY1, 0, 1.0, PANEL)); shellAdd(box(DX1 + 0.05, RX1, RY1 - 0.02, RY1, 0, 1.0, PANEL));
  const lamp = new THREE.MeshBasicMaterial({ color: 0xfff4dd });
  for (const [x, y] of [[-3.75, -6.4], [-1.25, -6.4], [-3.75, -8.8], [-1.25, -8.8], [-2.5, -7.6]]) { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20), lamp); o.position.copy(Bv(x, y, RH2 - 0.01)); G.add(o); }
  const L1 = new THREE.PointLight(0xffe9c7, 6, 7, 1.6); L1.position.copy(Bv(-2.5, -6.8, 2.8)); G.add(L1);
  const L2 = new THREE.PointLight(0xffe9c7, 6, 7, 1.6); L2.position.copy(Bv(-2.5, -9.0, 2.8)); G.add(L2);
  // ---- quadros (história – fontes públicas: gruporealbr.com.br, cmrsaude.com.br, Campo Grande News, O Presente Rural)
  // ---- imagens oficiais (assets/memoria): fotos da linha do tempo e do fundador (gruporealbr.com.br) e produtos (cmrsaude.com.br)
  const MEM = 'assets/memoria/', TEX = MEM + 'tex/';
  const texL = new THREE.TextureLoader();
  const tx = (f) => { const t = texL.load(TEX + f); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const loadImg = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const FR = new THREE.MeshStandardMaterial({ color: 0x3b2413, roughness: 0.45 });
  function moldura(grp, w, h, b = 0.05) {
    const fr = (x0, x1, y0, y1) => { const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.045), FR); o.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.012); grp.add(o); };
    fr(-w / 2 - b, w / 2 + b, h / 2, h / 2 + b); fr(-w / 2 - b, w / 2 + b, -h / 2 - b, -h / 2); fr(-w / 2 - b, -w / 2, -h / 2, h / 2); fr(w / 2, w / 2 + b, -h / 2, h / 2);
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), FR); back.position.z = -0.002; grp.add(back);
  }
  // quadro com foto histórica + ano + legenda (passe-partout creme)
  function quadroFoto(ano, texto, foto, w = 0.9, h = 0.8) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const PW = 944, PH = 560, PX = 40, PY = 40;
    const draw = (img) => {
      const g = c.getContext('2d'); g.fillStyle = CREME; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#d8d0c0'; g.fillRect(PX - 6, PY - 6, PW + 12, PH + 12); g.fillStyle = '#2a2a2a'; g.fillRect(PX, PY, PW, PH);
      if (img) { const s = Math.min(PW / img.width, PH / img.height), iw = img.width * s, ih = img.height * s;
        g.filter = 'blur(18px) brightness(.55)'; const s2 = Math.max(PW / img.width, PH / img.height); g.save(); g.beginPath(); g.rect(PX, PY, PW, PH); g.clip();
        g.drawImage(img, PX + (PW - img.width * s2) / 2, PY + (PH - img.height * s2) / 2, img.width * s2, img.height * s2); g.restore(); g.filter = 'none';
        g.drawImage(img, PX + (PW - iw) / 2, PY + (PH - ih) / 2, iw, ih); }
      g.fillStyle = DOURADO; g.font = 'bold 92px Georgia,serif'; g.textAlign = 'left'; g.fillText(ano, PX, PY + PH + 100);
      g.fillStyle = TINTA; g.font = '40px Georgia,serif'; wrap(g, texto, PX + 250, PY + PH + 62, PW - 250, 48);
      g.fillStyle = '#7a7466'; g.font = 'italic 22px Georgia,serif'; g.fillText('Acervo Grupo Real', PX, c.height - 22);
      t.needsUpdate = true;
    };
    draw(null); loadImg(MEM + foto).then(draw);
    const grp = new THREE.Group(); moldura(grp, w, h);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 })); p.position.z = 0.006; grp.add(p);
    return grp;
  }
  const frames = [                         // linha do tempo oficial (gruporealbr.com.br/quem-somos)
    ['1985', 'Abertura da loja de produtos veterinários em Ribas do Rio Pardo (MS)', 'hist_1985_0.jpg', 'O', -6.2],
    ['1986', 'Estudo da mortalidade de bovinos em Mato Grosso do Sul', 'hist_1986_1.jpg', 'O', -7.35],
    ['1989', 'Inauguração da Fábrica de Sal Mineralizado Real em Ribas do Rio Pardo', 'hist_1989_2.jpg', 'O', -8.5],
    ['1991', 'Experimento comprova a eficácia em rebanhos: nasce a Homeopatia Populacional', 'hist_1991_3.jpg', 'O', -9.45],
    ['1996', 'A Real H vem para Campo Grande (MS)', 'hist_1996_4.jpg', 'L', -9.45],
    ['2009', 'Lançamento da linha Homeopet', 'hist_2009_12.jpg', 'L', -8.5],
    ['2019', 'Início das exportações para Guatemala e Bolívia', 'hist_2019_17.jpg', 'L', -7.35],
    ['2023', 'Lançada a marca CMR, em homenagem ao Prof. Dr. Claudio Martins Real', 'hist_2023_21.jpg', 'L', -6.2],
  ];
  for (const [ano, tx_, foto, lado, y] of frames) {
    const q = quadroFoto(ano, tx_, foto);
    if (lado === 'O') { q.position.copy(Bv(RX0 + 0.03, y, 1.72)); q.rotation.y = Math.PI / 2; } else { q.position.copy(Bv(RX1 - 0.03, y, 1.72)); q.rotation.y = -Math.PI / 2; }
    G.add(q);
  }
  // parede do fundo (y = -10): título + retrato do fundador + placa
  const titulo = canvasTex(2048, 512, (g, w, h) => { g.fillStyle = VERDE; g.fillRect(0, 0, w, h); g.strokeStyle = DOURADO; g.lineWidth = 14; g.strokeRect(24, 24, w - 48, h - 48);
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = 'bold 150px Georgia,serif'; g.fillText('GRUPO REAL', w / 2, 210); g.fillStyle = DOURADO; g.font = '76px Georgia,serif';
    g.fillText('Real H  ·  CMR Saúde  ·  Homeopet', w / 2, 320); g.fillStyle = '#e8efe9'; g.font = 'italic 54px Georgia,serif'; g.fillText('Nutrição e saúde animal desde 1985 · Campo Grande – MS', w / 2, 420); });
  plane(3.0, 0.75, titulo, Bv(-2.5, RY0 + 0.01, 2.62), Math.PI);
  const qf = new THREE.Group(); moldura(qf, 0.8, 0.906, 0.06);
  const fotoF = tx('fundador_claudio_martins_real.jpg');
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.906), new THREE.MeshStandardMaterial({ map: fotoF, roughness: 0.6 })); fp.position.z = 0.006; qf.add(fp);
  qf.position.copy(Bv(-2.5, RY0 + 0.035, 1.58)); qf.rotation.y = Math.PI; G.add(qf);
  const spotF = new THREE.SpotLight(0xfff1dc, 6, 4, 0.5, 0.6, 1.5); spotF.position.copy(Bv(-2.5, RY0 + 1.4, 3.1)); spotF.target.position.copy(Bv(-2.5, RY0, 1.55)); G.add(spotF, spotF.target);
  const placa = canvasTex(1024, 300, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9b86a'); gr.addColorStop(0.5, '#b8923e'); gr.addColorStop(1, '#9c7a2e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6e5320'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); g.textAlign = 'center'; g.fillStyle = '#2b2110';
    g.font = 'bold 60px Georgia,serif'; g.fillText('Prof. Dr. Claudio Martins Real', w / 2, 88); g.font = '34px Georgia,serif';
    g.fillText('1926 · Médico-veterinário · Fundador e Presidente do Grupo Real', w / 2, 150);
    g.font = 'italic 32px Georgia,serif'; g.fillText('Pioneiro e criador do termo Homeopatia Populacional.', w / 2, 205); g.fillText('A marca CMR leva as suas iniciais.', w / 2, 250); });
  const pl = plane(0.62, 0.18, placa, Bv(-2.5, RY0 + 0.02, 0.93), Math.PI); pl.material.metalness = 0.6; pl.material.roughness = 0.35;
  const fonte = canvasTex(1024, 128, (g, w, h) => { g.fillStyle = '#173a2c'; g.fillRect(0, 0, w, h); g.fillStyle = '#cfd9d2'; g.font = '25px system-ui'; g.textAlign = 'center';
    g.fillText('Fotos e embalagens: acervo Grupo Real (gruporealbr.com.br) e catálogo CMR Saúde (cmrsaude.com.br)', w / 2, 52);
    g.fillText('Uso interno · consulte a bula e o médico-veterinário', w / 2, 96); });
  plane(0.9, 0.11, fonte, Bv(-1.1, RY0 + 0.012, 1.3), Math.PI);
  // ---- vitrine CMR Saúde: embalagens reais (fotos do catálogo oficial) em escala real
  const BALC = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.45 }), TOPO = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.25 });
  const PLINTO = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3 }), ACR = new THREE.MeshStandardMaterial({ color: 0xe8f2f6, roughness: 0.05, transparent: true, opacity: 0.35 });
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const sombra = (grp, w, d) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, d * 1.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.position.y = 0.002; grp.add(s); };
  // recorte (foto sem fundo) na frente + volume atrás (dá profundidade quando se olha de lado)
  function recorte(file, hM, wpx, hpx, vol) {
    const grp = new THREE.Group(), w = hM * wpx / hpx;
    const m = new THREE.MeshStandardMaterial({ map: tx(file), alphaTest: 0.45, roughness: 0.42, side: THREE.DoubleSide });
    const cor = new THREE.MeshStandardMaterial({ color: vol.cor, roughness: vol.rough ?? 0.5, metalness: vol.metal ?? 0 });
    let zf = 0.01;
    if (vol.tipo === 'saco') { const d = vol.d; const b = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, hM * 0.93, d), cor); b.position.set(0, hM * 0.47, -d / 2); grp.add(b); zf = 0.004; sombra(grp, w, d); }
    else if (vol.tipo === 'frasco') { const r = w * 0.44; const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hM * 0.68, 28), cor); b.position.set(0, hM * 0.34, -r * 0.2); grp.add(b);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, hM * 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 })); cap.position.set(0, hM * 0.88, -r * 0.2); grp.add(cap); zf = r * 0.82; sombra(grp, w, w); }
    else if (vol.tipo === 'seringa') { const b = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.3, w * 0.3, hM * 0.9, 16), ACR); b.position.y = hM * 0.47; grp.add(b); zf = 0.002; }
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, hM), m); p.position.set(0, hM / 2, zf); grp.add(p);
    grp.userData.h = hM; return grp;
  }
  // caixa 3D: frente e lateral com as faces da embalagem
  function caixa(nome, hM, fw, fh, cor) {
    const w = hM * fw / fh, d = w * 0.55, fr = tx(`box_${nome}_frente.jpg`), ld = tx(`box_${nome}_lado.jpg`);
    const F = new THREE.MeshStandardMaterial({ map: fr, roughness: 0.45 }), Ld = new THREE.MeshStandardMaterial({ map: ld, roughness: 0.45 }), T = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5 });
    const grp = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, hM, d), [Ld, Ld, T, T, F, F]); b.position.y = hM / 2; grp.add(b); sombra(grp, w, d); grp.userData.h = hM; return grp;
  }
  // pote cilíndrico: rótulo projetado (ortográfico) na metade da frente
  function pote(file, r, hM, wpx, hpx) {
    const grp = new THREE.Group(), BR = new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.3 });
    const g1 = new THREE.CylinderGeometry(r, r, hM, 48, 1, true, -Math.PI / 2, Math.PI);
    const pos = g1.attributes.position, uv = g1.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setX(i, 0.5 + pos.getX(i) / (2 * r));
    const hLab = 2 * r * hpx / wpx;
    const L = new THREE.Mesh(g1, new THREE.MeshStandardMaterial({ map: tx(file), roughness: 0.3 })); L.position.y = hM / 2; L.scale.y = 1; grp.add(L);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hM, 48, 1, true, Math.PI / 2, Math.PI), BR); back.position.y = hM / 2; grp.add(back);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.024, 48), BR); lid.position.y = hM + 0.012; grp.add(lid);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(r, 32), BR); bot.rotation.x = Math.PI / 2; bot.position.y = 0.001; grp.add(bot);
    sombra(grp, 2 * r, 2 * r); grp.userData.h = hM + 0.024; grp.userData.hLab = hLab; return grp;
  }
  const PRODUTOS = [
    { nome: 'CMR VET', extra: [[-0.09, -0.07], [0.09, -0.07]], ind: 'Pomada cicatrizante homeopática · 190 g', mk: () => pote('pote_cmr-vet_rotulo.jpg', 0.042, 0.09, 323, 346) },
    { nome: 'Figotonus Gel', extra: [[-0.08, -0.08]], ind: 'Insuficiência hepática · 250 mL', mk: () => recorte('recorte_figotonus-gel_250ml.webp', 0.16, 484, 945, { tipo: 'frasco', cor: 0x7a3d0c, rough: 0.15, metal: 0.1 }) },
    { nome: 'Matrimax Gel', extra: [[0.08, -0.08]], ind: 'Expulsão da placenta e involução uterina · 250 mL', mk: () => recorte('recorte_matrimax-gel_250ml.webp', 0.16, 482, 940, { tipo: 'frasco', cor: 0x7a3d0c, rough: 0.15, metal: 0.1 }) },
    { nome: 'Dia 100', ind: 'Prevenção e tratamento de diarreias · 36 g', mk: () => recorte('recorte_dia-100_36g.webp', 0.23, 116, 893, { tipo: 'seringa', cor: 0xffffff }) },
    { nome: 'Entero 100', extra: [[-0.12, -0.08]], ind: 'Enterites e diarreias · 600 g', mk: () => caixa('entero-100_600g', 0.2, 399, 766, 0x032948) },
    { nome: 'Finintox', extra: [[0.12, -0.08]], ind: 'Intoxicações, inclusive por plantas tóxicas · 600 g', mk: () => caixa('finintox_600g', 0.2, 397, 765, 0x03284e) },
    { nome: 'Parasit 100', extra: [[-0.12, -0.08]], ind: 'Vermes, carrapatos e moscas · 600 g', mk: () => caixa('parasit-100_600g', 0.2, 168, 334, 0x062342) },
    { nome: 'Dermosan MD', ind: 'Dermatites e papilomatose · 4 kg', mk: () => recorte('recorte_dermosan-md_4kg.webp', 0.42, 430, 719, { tipo: 'saco', cor: 0x3a1512, d: 0.09 }) },
    { nome: 'Carrapat 100', ind: 'Controle de carrapatos · 20 kg', mk: () => recorte('recorte_carrapat-100_20kg.webp', 0.8, 467, 882, { tipo: 'saco', cor: 0x9a6a1e, d: 0.2 }) },
    { nome: 'Sodo 100', ind: 'Reduz a sodomia · 20 kg', mk: () => recorte('recorte_sodo-100_20kg.webp', 0.8, 468, 886, { tipo: 'saco', cor: 0x9c4434, d: 0.2 }) },
  ];
  const cardTex = (p) => canvasTex(512, 200, (g, w, h) => { g.fillStyle = CREME; g.fillRect(0, 0, w, h); g.fillStyle = '#c8102e'; g.fillRect(0, 0, 10, h);
    g.fillStyle = '#123a73'; let px = 42; g.font = `bold ${px}px system-ui`; while (g.measureText(p.nome).width > 470 && px > 20) { px -= 2; g.font = `bold ${px}px system-ui`; } g.fillText(p.nome, 28, 58);
    g.font = '27px system-ui'; g.fillStyle = '#34453c'; wrap(g, p.ind, 28, 106, 460, 32); g.font = 'italic 20px system-ui'; g.fillStyle = '#7a7466'; g.fillText('CMR Saúde Animal · Grupo Real', 28, 186); });
  const products = [];
  const CY0 = -5.9, CY1 = -8.95;                               // balcões encurtados: os cantos do fundo recebem os sacos de 20 kg
  const counters = [{ x: -4.45, rot: Math.PI / 2 }, { x: -0.55, rot: -Math.PI / 2 }];
  for (const C of counters) { box(C.x - 0.3, C.x + 0.3, CY1, CY0, 0, 0.9, BALC); box(C.x - 0.32, C.x + 0.32, CY1 - 0.02, CY0 + 0.02, 0.9, 0.93, TOPO);
    const fita = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, CY0 - CY1), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); fita.position.copy(Bv(C.x + (C.x < -2.5 ? 0.3 : -0.3), (CY0 + CY1) / 2, 0.9)); G.add(fita); }
  const add = (p, pos, rotY, cardPos, cardRot, plinto) => {
    if (plinto) { const pb = new THREE.Mesh(new THREE.BoxGeometry(0.42, plinto, 0.3), PLINTO); pb.rotation.y = rotY; pb.position.copy(pos).add(new THREE.Vector3(0, plinto / 2, 0)); G.add(pb); pos = pos.clone().add(new THREE.Vector3(0, plinto, 0)); }
    const o = p.mk(); o.position.copy(pos); o.rotation.y = rotY; G.add(o);
    for (const [dx, dz] of (p.extra || [])) { const c = o.clone(true); c.position.copy(pos).add(new THREE.Vector3(dx, 0, dz).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)); c.rotation.y = rotY + (dx > 0 ? -0.12 : 0.12); G.add(c); }
    const card = plane(0.26, 0.1, cardTex(p), cardPos, cardRot);
    products.push({ obj: o, p, home: { pos: o.position.clone(), q: o.quaternion.clone(), parent: G }, card });
  };
  PRODUTOS.slice(0, 8).forEach((p, i) => {
    const cN = i < 4 ? 0 : 1, C = counters[cN], y = -6.3 - (i % 4) * 0.8;
    add(p, Bv(C.x, y, 0.93), C.rot, Bv(C.x + (cN ? -0.301 : 0.301), y, 0.78), cN ? -Math.PI / 2 : Math.PI / 2, p.nome === 'Dermosan MD' ? 0 : 0.05);
  });
  // sacos de 20 kg sobre estrado de madeira, nos cantos do fundo, voltados para a porta
  const MAD = new THREE.MeshStandardMaterial({ color: 0x9a7048, roughness: 0.8 });
  [[PRODUTOS[8], -4.3], [PRODUTOS[9], -0.7]].forEach(([p, x]) => {
    for (const [dx, dz] of [[-0.3, 0.1], [0.3, 0.1], [-0.3, -0.1], [0.3, -0.1]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), MAD); r.position.copy(Bv(x + dx, -9.5 + dz, 0.05)); G.add(r); }
    const tb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.025, 0.6), MAD); tb.position.copy(Bv(x, -9.5, 0.112)); G.add(tb);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 8), INOX); poste.position.copy(Bv(x + (x < -2.5 ? 0.55 : -0.55), -9.2, 0.45)); G.add(poste);
    add(p, Bv(x, -9.5, 0.125), Math.PI, Bv(x + (x < -2.5 ? 0.55 : -0.55), -9.21, 0.93), Math.PI, 0);
  });
  // ---- miniatura 1:5 da dinamizadora CMR REV20 3G (REV21) no centro
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.75, 40), BALC); ped.position.copy(Bv(-2.5, -7.9, 0.375)); G.add(ped);
  const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.03, 40), TOPO); pedTop.position.copy(Bv(-2.5, -7.9, 0.765)); G.add(pedTop);
  const mini = buildMaquina10(MATM, { n: 3, nome: 'MINI' }).root; mini.scale.setScalar(0.2); mini.position.copy(Bv(-2.5 - 0.02, -7.9, 0.78)); G.add(mini);
  const miniTag = plane(0.5, 0.13, canvasTex(768, 200, (g, w, h) => { g.fillStyle = CREME; g.fillRect(0, 0, w, h); g.fillStyle = VERDE; g.textAlign = 'center'; g.font = 'bold 56px Georgia,serif'; g.fillText('Dinamizadora CMR · REV21', w / 2, 88); g.fillStyle = '#34453c'; g.font = '38px Georgia,serif'; g.fillText('miniatura 1:5 · 3 garrafões de 10 L', w / 2, 158); }), Bv(-2.5, -7.43, 0.55), Math.PI);
  plane(0.5, 0.1, canvasTex(768, 150, (g, w, h) => { g.fillStyle = VERDE; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '30px Georgia,serif'; g.fillText('Maior indústria de medicamentos homeopáticos', w / 2, 60); g.fillText('veterinários da América Latina · Campo Grande – MS', w / 2, 108); }), Bv(-2.5, -8.37, 0.5), 0);
  // ---- abrir / fechar a porta
  let open = 0, target = 0;
  function toggle() { target = target ? 0 : 1; if (typeof oneShot === 'function' && AC && SND) oneShot(audio.door || scene, target ? SND.dooro : SND.doorc, 0.8, 2); }
  function update(dt) {
    open += (target - open) * Math.min(1, dt * 2.5);
    hinge.rotation.y = 1.6 * (open * open * (3 - 2 * open));      // abre para dentro do Espaço Memória (−y Blender)
    mini.rotation.y += dt * 0.25;
    for (const it of products) if (it.spin > 0) { it.spin -= dt; it.obj.rotation.y += dt * 2.5; if (it.spin <= 0) it.obj.quaternion.copy(it.home.q); }
  }
  const doorTargets = [leaf];
  return { G, leaf, hinge, products, mini, toggle, update, doorTargets, isOpen: () => target === 1, bounds: { x0: RX0, x1: RX1, y0: RY0, y1: RY1 },
    counters: counters.map((c) => ({ x0: c.x - 0.32, x1: c.x + 0.32, y0: -8.97, y1: -5.88, h: 0.93 })) };
})();
// Espaço Memória no modo Assistir: clique na porta abre; clique num produto mostra a indicação
if (!OPMODE) {
  const rc2 = new THREE.Raycaster(); let d0 = null;
  const cv2 = renderer.domElement;
  cv2.addEventListener('pointerdown', (e) => { d0 = { x: e.clientX, y: e.clientY }; });
  cv2.addEventListener('pointerup', (e) => {
    if (!d0 || Math.hypot(e.clientX - d0.x, e.clientY - d0.y) > 6) return; d0 = null;
    rc2.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
    const objs = [SR.leaf, ...SR.products.map((p) => p.obj)];
    const h = rc2.intersectObjects(objs, true)[0]; if (!h) return;
    let o = h.object; while (o && o !== SR.leaf && !SR.products.some((p) => p.obj === o)) o = o.parent;
    if (o === SR.leaf) SR.toggle(); else { const it = SR.products.find((p) => p.obj === o); if (it) it.spin = 2.5; }
  });
}

// ------------------------------------------------------------------ MODO OPERAR (etapa 3): você é a operadora
// Máquina de estados ao vivo (as mesmas fases do roteiro), 4 máquinas com partida escalonada, tempo 3× com "avançar".
// Interações: IHM (PARTIDA ESCALONADA / INICIAR / CONFIRMAR), portas frente/traseira (intertravadas), bocais P1–P6,
// botão TRANSFERIR do TQ-01. Pipetagem: no Quest, pegar a pipeta, aspirar no frasco e levar a ponta ao bocal;
// no celular/PC, tocar no bocal com a porta aberta. Relatório de treinamento na TV no final.
// (modo Operar: rev17.html?modo=operar)

// ------------------------------------------------------------------ laço principal
let last = performance.now(), acc = 0, prevT = 0;
function update(t, dt, playing) {
  if (!OP) { mixS.setTime(Math.min(t, gs.animations[0].duration - 1e-3)); SR.update(dt); } else OP.update(t, dt);
  for (const mn of MN) updateMachineProps(machines[mn], mn, t, dt);
  for (const n in people) {
    const p = people[n]; if (!p.a) continue;
    const vis = !OP && (n !== 'SUPERVISOR' || R.sup_windows.some(([a, b]) => t >= a - 0.5 && t <= b + 0.3));
    p.a.visible = vis; p.blob.visible = vis;
    if (vis) { p.a.getWorldPosition(tmpV); world.worldToLocal(tmpV); p.blob.position.set(tmpV.x, 0.004, tmpV.z); }
  }
  const tab = sala.getObjectByName('TABLET_SUPERVISOR'); if (tab) tab.visible = people.SUPERVISOR.a.visible;
  acc += dt;
  if (acc > 0.2 || !playing) {
    acc = 0;
    for (const mn of MN) drawIHM(machines[mn], mn, t);
    drawTV(t); drawTQ(t); drawFases(t);
  }
  drawClock(t);
  $('clk').innerHTML = OP ? `OPERAR · simulado <b>${hms(simT(t))}</b> · erros <b>${OP.errors.length}</b>` : `real <b>${ms(t)}</b> / ${ms(T_END)} · simulado <b>${hms(simT(t))}</b>`;
  if (document.activeElement !== $('seek')) $('seek').value = String(t);
}
renderer.setAnimationLoop((now, frame) => {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  const t0 = st.t;
  if (st.playing) { st.t = OP ? st.t + dt * st.speed : Math.min(st.t + dt * st.speed, T_END); if (!OP && st.t >= T_END) togglePlay(); }
  update(st.t, dt, st.playing);
  if (st.playing) triggerEvents(t0, st.t);
  updateAudio(st.t, t0, st.playing);
  if (renderer.xr.isPresenting) { xrInput(dt); arFrame(frame, dt); sombraFrame(); if (OP) OP.frame(frame); }
  else {
    if (camMode === 'operadora') followCam('OPERADORA', dt);
    else if (camMode === 'supervisor') followCam('SUPERVISOR', dt);
    controls.update();
  }
  renderer.render(scene, camera);
});

// gancho para testes automáticos
window.__shot = (t, pos, tg) => {
  st.t = t; update(t, 0.3, false);
  if (typeof pos === 'string') {
    const [who, side, dist, h] = pos.split(':'); const p = people[who]; p.a.updateWorldMatrix(true, true); p.a.getWorldPosition(tmpV);
    const q = new THREE.Quaternion(); p.a.getWorldQuaternion(q);
    const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(q); const rt = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const d = side === 'lado' ? rt : side === 'frente' ? fw : fw.clone().negate();
    camera.position.copy(tmpV).addScaledVector(d, +dist); camera.position.y = +h; controls.target.set(tmpV.x, +h - 0.1, tmpV.z); controls.update();
  } else if (pos) { camMode = 'livre'; camera.position.copy(B(...pos)); controls.target.copy(B(...tg)); controls.update(); }
  renderer.render(scene, camera); return true;
};
window.__scene = scene; window.__sr = SR; window.__R = R; window.__ready = true;
window.__Box3 = THREE.Box3;
window.__tick = (t) => { st.t = t; update(t, 0.3, false); };
window.__xrtest = { XR, arFrame, onSelectStart, onSelectEnd, startPlacing, world, rotateBy };
window.__stop = () => renderer.setAnimationLoop(null);
window.__info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, audio: AC ? AC.state : 'sem áudio', t: st.t });
window.__play = (t) => { initAudio(); st.t = t || 0; if (!st.playing) togglePlay(); };
