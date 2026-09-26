// Sala de Dinamização – cena WebXR com som espacial sincronizado
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = (id) => document.getElementById(id);
const R = await (await fetch('assets/roteiro.json')).json();
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
scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.75;
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa2a8, 1.25));
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(1.5, 10, 2); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-3, 4, -6); scene.add(fill);

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
    const v = Object.values(prog); $('pg').style.width = (100 * v.reduce((a, b) => a + b, 0) / 2) + '%';
    $('lt').textContent = `carregando modelos… ${Math.round(100 * v.reduce((a, b) => a + b, 0) / 2)} %`;
  }, bad));
}
const EXT = window.__EXT || '.glb';
const [gs, gm] = await Promise.all([loadGLB('assets/sala_cena' + EXT), loadGLB('assets/maquina_rev16' + EXT)]);
const sala = gs.scene; world.add(sala);
const mixS = new THREE.AnimationMixer(sala);
const actS = mixS.clipAction(gs.animations[0]); actS.play();

// materiais transparentes: sem escrita de profundidade para não "sumir" objetos atrás
scene.traverse((o) => { if (o.isMesh) { o.frustumCulled = !o.isSkinnedMesh; } });

// ------------------------------------------------------------------ máquinas (4 cópias, cada uma com seu relógio de clipe)
const machines = {};
for (const mn of MN) {
  const M = R.machines[mn];
  const root = gm.scene.clone(true);
  root.position.copy(B(M.pos[0], M.pos[1], 0));
  root.rotation.y = THREE.MathUtils.degToRad(M.pos[2]);
  world.add(root);
  const mixer = new THREE.AnimationMixer(root);
  const act = mixer.clipAction(gm.animations[0]); act.play();
  const cv = document.createElement('canvas'); cv.width = 400; cv.height = 240;
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
  const scr = root.getObjectByName('IHM_TELA_IMG');
  if (scr) scr.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); });
  const tower = { verde: root.getObjectByName('TORRE_VERDE'), amarelo: root.getObjectByName('TORRE_AMARELO'), vermelho: root.getObjectByName('TORRE_VERMELHO') };
  machines[mn] = { R: M, root, mixer, act, cv, ctx: cv.getContext('2d'), tex, tower, pos: B(M.pos[0], M.pos[1], 1.2), lastStroke: -1 };
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

function state(mn, t) {
  const M = R.machines[mn]; const C = M.cycles;
  let st = { k: 'PRONTA', cyc: null, n: 0 };
  for (const c of C) {
    if (t < c.start) break;
    st = { cyc: c, n: c.n };
    if (t < c.fecha[1]) st.k = 'FECHANDO';
    else if (t < c.dosa[1]) st.k = 'DOSANDO';
    else if (c.run === undefined || t < c.run) st.k = 'ATIVO_MANUAL';
    else if (t < c.ativo[1]) st.k = 'ATIVO_LINHA';
    else if (t < c.mix[1]) st.k = 'DINAMIZANDO';
    else if (t < c.dreno[0]) st.k = 'PAUSA';
    else if (t < c.dreno[1]) st.k = 'DRENANDO';
    else if (t < c.abre[1]) st.k = 'ABRINDO';
    else st.k = c.n >= 2 ? 'CONCLUIDO' : 'FIM_CICLO';
  }
  return st;
}
const LABEL = { PRONTA: 'PRONTA', FECHANDO: 'FECHANDO CABEÇOTES', DOSANDO: 'DOSANDO SOLUÇÃO BASE', ATIVO_MANUAL: 'INJETAR ATIVO P1–P6',
  ATIVO_LINHA: 'ATIVO → GARRAFÕES', DINAMIZANDO: 'DINAMIZANDO', PAUSA: 'ESTABILIZANDO', DRENANDO: 'DRENANDO → TQ-01', ABRINDO: 'ABRINDO CABEÇOTES',
  FIM_CICLO: 'CICLO CONCLUÍDO', CONCLUIDO: 'LOTE CONCLUÍDO' };
const COLOR = { PRONTA: '#9fb0bf', FECHANDO: '#3d8bfd', DOSANDO: '#3d8bfd', ATIVO_MANUAL: '#f5b31a', ATIVO_LINHA: '#f08c2e', DINAMIZANDO: '#2fbf71',
  PAUSA: '#2fbf71', DRENANDO: '#19b3c9', ABRINDO: '#3d8bfd', FIM_CICLO: '#9fb0bf', CONCLUIDO: '#9fb0bf' };

function tankVol(t) {
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
  const starts = MN.map((m) => R.machines[m].cycles[0].start);
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
  g.fillStyle = '#fff'; g.font = 'bold 19px system-ui,sans-serif'; g.fillText(`CMR ${mn}`, 10, 24);
  g.font = '15px system-ui,sans-serif'; g.fillStyle = '#9fd0ff'; g.fillText(hms(simT(t)), 300, 23);
  g.fillStyle = COLOR[st.k]; g.font = 'bold 22px system-ui,sans-serif';
  g.fillText(LABEL[st.k], 12, 68);
  g.font = '15px system-ui,sans-serif'; g.fillStyle = '#cfe0ee';
  g.fillText(`Ciclo ${st.n || 0} / 2   ·   Modo AUTO`, 12, 92);
  const bar = (y, u, col) => { g.fillStyle = '#23384b'; g.fillRect(12, y, 376, 14); g.fillStyle = col; g.fillRect(12, y, 376 * Math.min(Math.max(u, 0), 1), 14); };
  if (st.k === 'DOSANDO') {
    const u = (t - c.dosa[0]) / (c.dosa[1] - c.dosa[0]);
    for (let i = 0; i < 6; i++) {
      const x = 14 + i * 64, h = 90 * Math.min(u * (1 + 0.04 * ((i * 37) % 5)), 1);
      g.strokeStyle = '#6fa8dc'; g.strokeRect(x, 110, 50, 92); g.fillStyle = '#3d8bfd'; g.fillRect(x + 1, 201 - h, 48, h);
      g.fillStyle = '#cfe0ee'; g.fillText(`P${i + 1}`, x + 14, 222);
    }
    g.fillText(`${(3.6 * Math.min(u, 1)).toFixed(2).replace('.', ',')} L`, 300, 92);
  } else if (st.k === 'ATIVO_MANUAL') {
    const blink = Math.floor(t * 2) % 2;
    for (let i = 0; i < 6; i++) {
      const ok = c.inj[i] !== undefined && t >= c.inj[i];
      const x = 14 + i * 64;
      g.fillStyle = ok ? '#2fbf71' : (blink ? '#f5b31a' : '#4a3a12'); g.fillRect(x, 110, 50, 50);
      g.fillStyle = '#0b1622'; g.font = 'bold 20px system-ui'; g.fillText(ok ? '✔' : `P${i + 1}`, x + (ok ? 16 : 10), 143);
    }
    g.font = '15px system-ui'; g.fillStyle = '#cfe0ee';
    g.fillText('Pipete 1 mL em cada funil e aperte ATIVO OK', 12, 190);
  } else if (st.k === 'DINAMIZANDO' || st.k === 'ATIVO_LINHA' || st.k === 'PAUSA') {
    const u = st.k === 'DINAMIZANDO' ? (t - c.mix[0]) / (c.mix[1] - c.mix[0]) : st.k === 'PAUSA' ? 1 : 0;
    const rest = (1 - u) * R.MIX_REAL * K;
    g.font = 'bold 44px system-ui'; g.fillStyle = '#fff'; g.fillText(ms(rest), 12, 150);
    g.font = '15px system-ui'; g.fillStyle = '#cfe0ee';
    g.fillText(`golpes: ${Math.round(u * 600)} / 600 · 120/min`, 170, 128); g.fillText('mistura: 5:00 min', 170, 150);
    bar(180, u, '#2fbf71');
  } else if (st.k === 'DRENANDO') {
    const u = (t - c.dreno[0]) / (c.dreno[1] - c.dreno[0]);
    g.fillText(`Transferindo para TQ-01: ${(21.6 * u).toFixed(1).replace('.', ',')} L`, 12, 130); bar(150, u, '#19b3c9');
  } else if (st.k === 'FIM_CICLO' || st.k === 'CONCLUIDO') {
    g.fillText(`Tempo do ciclo: ${ms((c.end - c.start) * K)}`, 12, 130);
    g.fillText(`Produzido: ${(21.6 * c.n).toFixed(1).replace('.', ',')} L`, 12, 154);
  } else if (st.k === 'FECHANDO' || st.k === 'ABRINDO') {
    const [a, b] = st.k === 'FECHANDO' ? c.fecha : c.abre; bar(130, (t - a) / (b - a), '#3d8bfd');
  } else {
    g.fillText('Garrafões posicionados · portas fechadas', 12, 130); g.fillText('Toque INICIAR CICLO', 12, 154);
  }
  g.fillStyle = '#1f7a4a'; g.fillRect(250, 204, 140, 28); g.fillStyle = '#fff'; g.font = 'bold 14px system-ui'; g.fillText('INICIAR CICLO', 268, 223);
  m.tex.needsUpdate = true;
  // torre
  const blink = Math.floor(t * 2.5) % 2 === 0;
  const auto = ['FECHANDO', 'DOSANDO', 'ATIVO_LINHA', 'DINAMIZANDO', 'PAUSA', 'DRENANDO', 'ABRINDO'].includes(st.k);
  if (m.tower.verde) m.tower.verde.visible = auto;
  if (m.tower.amarelo) m.tower.amarelo.visible = (st.k === 'ATIVO_MANUAL' && blink) || ['PRONTA', 'FIM_CICLO', 'CONCLUIDO'].includes(st.k);
  if (m.tower.vermelho) m.tower.vermelho.visible = false;
}

function drawTV(t) {
  const g = TVs.ctx, W_ = 1280, H_ = 731, P = production(t);
  g.fillStyle = '#0c131b'; g.fillRect(0, 0, W_, H_);
  g.fillStyle = '#0f5132'; g.fillRect(0, 0, W_, 70);
  g.fillStyle = '#fff'; g.font = 'bold 34px system-ui,sans-serif'; g.fillText('SALA DE DINAMIZAÇÃO 01 · PRODUÇÃO', 24, 47);
  g.font = 'bold 34px system-ui'; g.fillText(hms(simT(t)), 1100, 47);
  // cartões das máquinas
  MN.forEach((mn, i) => {
    const x = 20 + i * 312, y = 88, st = state(mn, t), c = st.cyc;
    g.fillStyle = '#16212c'; g.fillRect(x, y, 300, 190);
    g.fillStyle = COLOR[st.k]; g.fillRect(x, y, 300, 8);
    g.fillStyle = '#fff'; g.font = 'bold 30px system-ui'; g.fillText(mn, x + 14, y + 46);
    g.font = '18px system-ui'; g.fillStyle = '#9fb0bf'; g.fillText(`ciclo ${st.n || 0}/2`, x + 200, y + 42);
    g.fillStyle = COLOR[st.k]; g.font = 'bold 21px system-ui'; g.fillText(LABEL[st.k], x + 14, y + 84);
    g.fillStyle = '#cfe0ee'; g.font = '18px system-ui';
    if (c) {
      const el = ((c.end !== undefined && t >= c.end ? c.end : t) - c.start) * K;
      g.fillText(`tempo no ciclo: ${ms(el)}`, x + 14, y + 118);
      if (st.k === 'DINAMIZANDO') g.fillText(`mistura: ${ms(Math.max(0, (c.mix[1] - t) * K))} restante`, x + 14, y + 146);
      if (st.k === 'ATIVO_MANUAL') g.fillText(`aguardando operador: ${ms((t - c.ready) * K)}`, x + 14, y + 146);
    } else g.fillText('aguardando início', x + 14, y + 118);
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
    g.fillStyle = col; g.font = 'bold 40px system-ui'; g.fillText(b, x + 14, y + 84);
  });
  // meta do dia
  const y = 424;
  g.fillStyle = '#16212c'; g.fillRect(20, y, 1240, 120);
  g.fillStyle = '#fff'; g.font = 'bold 24px system-ui'; g.fillText('META DO DIA (8 h contínuas, 4 máquinas)', 36, y + 38);
  if (P.meta) {
    const cic = Math.floor(8 * 3600 / P.avg);
    g.font = '20px system-ui'; g.fillStyle = '#cfe0ee';
    g.fillText(`${cic} ciclos/máquina × 4 × 21,6 L = ${P.meta.toLocaleString('pt-BR')} L   ·   ritmo atual ${P.ritmo.toFixed(0)} L/h`, 36, y + 72);
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
    g.fillText(`${d.mn} · ciclo ${d.n} · ${ms(d.dur)} · 21,6 L`, x, yy);
  });
  if (t >= R.transfer.t && t < R.transfer.t1 + 3) {
    g.fillStyle = 'rgba(15,81,50,.92)'; g.fillRect(340, 300, 600, 90);
    g.fillStyle = '#fff'; g.font = 'bold 30px system-ui'; g.fillText('TRANSFERÊNCIA → SALA DE TANQUES', 362, 356);
  }
  TVs.tex.needsUpdate = true;
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
  audio.tv = anchor(B(0, 7.4, 3.0));
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
    if (e.type === 'ihm_toque' || e.type === 'botao' || e.type === 'injeta') oneShot(m.snd.mid, SND.beep, e.type === 'injeta' ? 0.35 : 0.6, 1.0);
    else if (e.type === 'porta_abre') oneShot(audio.door, SND.dooro, 0.9);
    else if (e.type === 'porta_fecha') oneShot(audio.door, SND.doorc, 1.0);
    else if (e.type === 'ciclo_fim') { oneShot(audio.tv, SND.chime, 0.8, 4); oneShot(m.snd.mid, SND.beep, 0.6); }
    else if (e.type === 'botao_transf') oneShot(audio.panel, SND.beep, 0.7, 1.0);
    else if (e.type === 'tablet_toque') { }
  }
  // cliques de válvula nas transições de dosagem / drenagem
  for (const mn of MN) for (const c of R.machines[mn].cycles) for (const tt of [c.dosa[0], c.dosa[1], c.dreno ? c.dreno[0] : -1, c.dreno ? c.dreno[1] : -1, c.ativo ? c.ativo[0] : -1]) {
    if (tt > t0 && tt <= t1) oneShot(machines[mn].snd.mid, SND.click, 0.7, 1.2);
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
    setLoop(m.snd.pump, run * (k === 'DOSANDO' || k === 'ATIVO_LINHA' ? 0.35 : 0));
    setLoop(m.snd.vac, run * (k === 'DRENANDO' ? 0.45 : 0));
    setLoop(m.snd.heads, run * (k === 'FECHANDO' || k === 'ABRINDO' ? 0.25 : 0));
    // golpes: um a cada volta da manivela
    const ct = clipTime(m.R, t);
    const n = k === 'DINAMIZANDO' ? Math.floor(theta(ct.cu) / (2 * Math.PI)) : -1;
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
  geral: [B(0, -7.2, 3.7), B(0, 0.8, 0.9)],
  m1: [B(1.0, -5.4, 1.75), B(2.9, -3.2, 1.3)],
  tv: [B(0, 1.8, 1.7), B(0, 7.4, 2.9)],
  tanque: [B(2.0, -2.6, 1.8), B(0.1, 0.0, 1.0)],
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
  line.scale.z = 4; c.add(line); scene.add(c); return c;
});
// interface sobre a câmera (dom-overlay, Android)
const arui = document.createElement('div'); arui.id = 'arui';
arui.innerHTML = `<div id="armsg">Procurando superfície… mova o celular devagar apontando para o piso</div>
  <div id="arbtns"><button id="arRe">⟲ Reposicionar</button><button id="arL">↺</button><button id="arR">↻</button><button id="arPlay">❚❚</button><button id="arExit">Sair</button></div>`;
document.body.appendChild(arui);
$('arbtns').addEventListener('beforexrselect', (e) => e.preventDefault());       // toques nos botões não posicionam
const arMsg = (s) => { const m = $('armsg'); if (m && m.textContent !== s) m.textContent = s; };
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
      const ses = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor'],
        optionalFeatures: ['hit-test', 'anchors', 'plane-detection', 'dom-overlay', 'hand-tracking'], domOverlay: { root: arui } });
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
$('start').style.display = 'block';
$('start').onclick = () => { $('load').remove(); initAudio(); togglePlay(); };

function drawFases(t) {
  $('fases').innerHTML = MN.map((mn) => { const s = state(mn, t); return `<div><b>${mn}</b><i style="background:${COLOR[s.k]}"></i><span>${LABEL[s.k]} · ciclo ${s.n || 0}/2</span></div>`; }).join('')
    + `<div><b>TQ</b><i style="background:#19b3c9"></i><span>${tankVol(t).toFixed(1).replace('.', ',')} L no tanque de passagem</span></div>`;
}

// ------------------------------------------------------------------ laço principal
let last = performance.now(), acc = 0, prevT = 0;
function update(t, dt, playing) {
  mixS.setTime(Math.min(t, gs.animations[0].duration - 1e-3));
  for (const mn of MN) { const m = machines[mn]; m.act.time = clipTime(m.R, t).c; m.mixer.update(0); }
  for (const n in people) {
    const p = people[n]; if (!p.a) continue;
    const vis = n !== 'SUPERVISOR' || (t >= R.sup_window[0] - 0.5 && t <= R.sup_window[1] + 0.3);
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
  $('clk').innerHTML = `real <b>${ms(t)}</b> / ${ms(T_END)} · simulado <b>${hms(simT(t))}</b>`;
  if (document.activeElement !== $('seek')) $('seek').value = String(t);
}
renderer.setAnimationLoop((now, frame) => {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  const t0 = st.t;
  if (st.playing) { st.t = Math.min(st.t + dt * st.speed, T_END); if (st.t >= T_END) togglePlay(); }
  update(st.t, dt, st.playing);
  if (st.playing) triggerEvents(t0, st.t);
  updateAudio(st.t, t0, st.playing);
  if (renderer.xr.isPresenting) { xrInput(dt); arFrame(frame, dt); }
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
window.__scene = scene; window.__ready = true;
window.__xrtest = { XR, arFrame, onSelectStart, onSelectEnd, startPlacing, world, rotateBy };
window.__stop = () => renderer.setAnimationLoop(null);
window.__info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, audio: AC ? AC.state : 'sem áudio', t: st.t });
window.__play = (t) => { initAudio(); st.t = t || 0; if (!st.playing) togglePlay(); };
