// Apresentação · Sala de Dinamização CMR — REV20 (4×10 L e 3×10 L) + REV17 (6×5 L) · WebXR (AR celular/Quest, VR)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';
import { buildMaquina10, GARRAFAO } from './maq10.js?v=1';

const $ = (id) => document.getElementById(id);
const R = await (await fetch('assets/roteiro.json')).json();
const B = (x, y, z = 0) => new THREE.Vector3(x, z, -y);          // Blender (z para cima) -> three (y para cima)

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
const world = new THREE.Group(); scene.add(world);           // move/escala no AR
const stage = new THREE.Group(); world.add(stage);           // sala inteira (ou recentrada numa máquina no AR)
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.03, 80);
rig.add(camera);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.95;
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// ------------------------------------------------------------------ carregamento
const loader = new GLTFLoader();
const prog = {};
function loadGLB(url) {
  return new Promise((ok, bad) => loader.load(url, ok, (e) => {
    prog[url] = e.total ? e.loaded / e.total : Math.min(e.loaded / 9e6, 0.99);
    const v = Object.values(prog), p = 100 * v.reduce((a, b) => a + b, 0) / 2;
    $('pg').style.width = p + '%'; $('lt').textContent = `carregando modelos… ${Math.round(p)} %`;
  }, bad));
}
const [gs, gm] = await Promise.all([loadGLB('assets/sala_cena.glb'), loadGLB('assets/maquina_rev17.glb')]);
const sala = gs.scene; stage.add(sala);
const mixS = new THREE.AnimationMixer(sala); mixS.clipAction(gs.animations[0]).play(); mixS.setTime(0.01);
for (const n of ['OPERADORA', 'SUPERVISOR', 'TABLET_SUPERVISOR', 'FRASCO_OPERADORA_2', 'PIPETA_OPERADORA', 'FRASCO_OPERADORA']) { const o = sala.getObjectByName(n); if (o) o.visible = false; }
scene.traverse((o) => { if (o.isMesh) o.frustumCulled = !o.isSkinnedMesh; });

// materiais da REV17 reaproveitados nas máquinas novas (mesmo acabamento)
const MAT = {}; gm.scene.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) MAT[m.name] = m; });
const pick = (n, c = 0x888888) => MAT[n] || new THREE.MeshStandardMaterial({ color: c });
const M = { inox: pick('Inox 304 escovado (carenagem)'), inox316: pick('Inox 316L usinado'), pc: pick('Policarbonato fume'), grafite: pick('Pintura grafite RAL 7016'),
  ptfe: pick('PTFE branco'), epdm: pick('Borracha EPDM'), preto: pick('Preto polimero'), cromo: pick('Eixos retificados cromados'), aluminio: pick('Aluminio anodizado'),
  amarelo: pick('Amarelo seguranca'), ferro: pick('Ferro fundido pintado grafite'), mangProc: pick('Mangueira PROCESSO'), mangResp: pick('Linha RESPIRO lilas'),
  garfo: pick('Sensor garfo PBT cinza'), botaoVerde: pick('Botao verde'), botaoAzul: pick('Botao azul'), vermelho: pick('Vermelho emergencia') };

// ------------------------------------------------------------------ máquinas: M1 = REV20 4×10 L · M2 = REV20 3×10 L · M3/M4 = REV17 6×5 L
const MAQ = {};
const place = (o, mn) => { const P = R.machines[mn].pos; o.position.copy(B(P[0], P[1], 0)); o.rotation.y = THREE.MathUtils.degToRad(P[2]); stage.add(o); };
MAQ.M1 = buildMaquina10(M, { n: 4, nome: 'M1' }); place(MAQ.M1.root, 'M1');
MAQ.M2 = buildMaquina10(M, { n: 3, nome: 'M2' }); place(MAQ.M2.root, 'M2');
for (const mn of ['M3', 'M4']) {
  const root = gm.scene.clone(true); place(root, mn);
  const mixer = new THREE.AnimationMixer(root); const act = mixer.clipAction(gm.animations[0]); act.play(); mixer.setTime(0);
  const cv = document.createElement('canvas'); cv.width = 400; cv.height = 240;
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
  const scr = root.getObjectByName('IHM_TELA_IMG'); if (scr) scr.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); });
  const g = cv.getContext('2d'); g.fillStyle = '#0b1622'; g.fillRect(0, 0, 400, 240); g.fillStyle = '#12304a'; g.fillRect(0, 0, 400, 34);
  g.fillStyle = '#fff'; g.font = 'bold 19px system-ui'; g.fillText(`CMR ${mn} · REV17 6×5 L`, 10, 24); g.fillStyle = '#2fbf71'; g.font = 'bold 24px system-ui'; g.fillText('EM OPERAÇÃO', 12, 72);
  g.fillStyle = '#cfe0ee'; g.font = '16px system-ui'; g.fillText('3,6 L × 6 garrafões · 30 mL de ativo', 12, 104); tex.needsUpdate = true;
  MAQ[mn] = { root, mixer, act, rev17: true };
}
const ALL = ['M1', 'M2', 'M3', 'M4'];

// TV da sala: título da apresentação
{
  const o = sala.getObjectByName('TV_TELA');
  if (o) { const cv = document.createElement('canvas'); cv.width = 1280; cv.height = 731; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 731); gr.addColorStop(0, '#0f2740'); gr.addColorStop(1, '#0b1622'); g.fillStyle = gr; g.fillRect(0, 0, 1280, 731);
    g.fillStyle = '#fff'; g.font = 'bold 74px system-ui'; g.fillText('SALA DE DINAMIZAÇÃO', 70, 150); g.fillStyle = '#7fc3ff'; g.font = '44px system-ui'; g.fillText('REV20 · garrafões de 10 L · GL80', 70, 220);
    const rows = [['M1', 'REV20 · 4 × 10 L', 'frente e trás', '28 L/ciclo'], ['M2', 'REV20 · 3 × 10 L', 'só frente', '21 L/ciclo'], ['M3', 'REV17 · 6 × 5 L', 'frente e trás', '21,6 L/ciclo'], ['M4', 'REV17 · 6 × 5 L', 'frente e trás', '21,6 L/ciclo']];
    rows.forEach((r, i) => { const y = 330 + i * 86; g.fillStyle = i < 2 ? '#2fbf71' : '#9fb0bf'; g.fillRect(70, y - 46, 12, 60); g.fillStyle = '#fff'; g.font = 'bold 46px system-ui'; g.fillText(r[0], 100, y);
      g.font = '40px system-ui'; g.fillText(r[1], 220, y); g.fillStyle = '#cfe0ee'; g.fillText(r[2], 690, y); g.fillText(r[3], 980, y); });
    g.fillStyle = '#9fb0bf'; g.font = '30px system-ui'; g.fillText('CMR Saúde Animal · Grupo Real', 70, 700);
    const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
    o.traverse((m) => { if (m.isMesh) m.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); }); }
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
arui.innerHTML = `<div id="armsg">Procurando superfície… mova o celular devagar apontando para o piso</div><div id="arcap"></div>
  <div id="arbtns"><button id="arPrev">◀</button><button id="arNext">Próximo ▶</button><button id="arPlay">▶ Auto</button><button id="arRe">⟲</button><button id="arL">↺</button><button id="arR">↻</button><button id="arExit">Sair</button></div>`;
document.body.appendChild(arui);
$('arbtns').addEventListener('beforexrselect', (e) => e.preventDefault());       // toques nos botões não posicionam
const arMsg = (s) => { const m = $('armsg'); if (m && m.textContent !== s && !(typeof flashUntil !== 'undefined' && performance.now() < flashUntil)) m.textContent = s; };
function uiState() {
  $('arbtns').style.display = XR.state === 'placed' ? 'flex' : 'none';
  $('arPlay').textContent = TOUR.auto ? '❚❚ Auto' : '▶ Auto'; $('arcap').style.display = XR.state === 'placed' ? 'block' : 'none';
}
$('arRe').onclick = () => startPlacing();
$('arL').onclick = () => rotateBy(Math.PI / 12);
$('arR').onclick = () => rotateBy(-Math.PI / 12);
$('arPlay').onclick = () => { TOUR.toggleAuto(); uiState(); };
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
      XR.mode = 'ar'; XR.scale = typeof scale === 'function' ? scale() : scale;
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
arButton('AR maquete', () => ($('artgt').value === 'sala' ? 0.05 : 0.2));

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
      if (XR.scale < 1) { const dist = Math.hypot(gb.axes[0] - ga.axes[0], gb.axes[1] - ga.axes[1]); world.scale.setScalar(THREE.MathUtils.clamp(XR.twist.scale * dist / Math.max(XR.twist.dist, 1e-3), 0.02, 0.6)); }
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
    arui.style.display = 'block'; startPlacing();
  } else { rig.position.copy(B(0.0, -4.2, 0)); rig.rotation.set(0, 0, 0); }
  rays.forEach((c) => { c.visible = true; });
  uiState(); TOUR.xrStart();
});
renderer.xr.addEventListener('sessionend', () => {
  if (XR.mode === 'ar') {
    scene.background = new THREE.Color(0xdfe3e7); shell.forEach((o) => { o.visible = true; });
    dropAnchor(); world.visible = true; footprint.visible = false;
    world.position.set(0, 0, 0); world.rotation.set(0, 0, 0); world.scale.setScalar(1);
    XR.reticle.visible = false; XR.hitSrc = null; XR.touchSrc = null; XR.ctrlHit.clear(); XR.active.clear(); XR.drag = XR.twist = null; XR.mode = null; XR.state = 'idle';
    arui.style.display = 'none';
  }
  rays.forEach((c) => { c.visible = false; });
  rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); TOUR.goCam(true);
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
for (const mn of ALL) { const m = MAQ[mn]; const bb = new THREE.Box3().setFromObject(m.root); const sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
  const b = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 1.35, sz.z * 1.35), new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, toneMapped: false }));
  b.rotation.x = -Math.PI / 2; stage.worldToLocal(c); b.position.set(c.x, 0.005, c.z); b.visible = false; stage.add(b); aoBlobs.push(b); }
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
      if (y && !btnPrev.y) TOUR.toggleAuto();
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
      if (a && !btnPrev.a) TOUR.next();
      if (b && !btnPrev.b) TOUR.prev();
      btnPrev.a = a; btnPrev.b = b;
    }
  }
}


// ------------------------------------------------------------------ chamadas (rótulos 3D com linha de chamada)
const callouts = [];
const lblGroup = new THREE.Group(); scene.add(lblGroup);
function labelTex(title, body) {
  const c = document.createElement('canvas'); const g = c.getContext('2d'); const W = 720;
  g.font = 'bold 34px system-ui'; const lines = []; const words = (body || '').split(' '); let l = '';
  g.font = '27px system-ui'; for (const w of words) { const t = l ? l + ' ' + w : w; if (g.measureText(t).width > W - 48 && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l);
  c.width = W; c.height = 34 + 46 + lines.length * 34 + (body ? 18 : 0);
  g.fillStyle = 'rgba(12,19,27,.9)'; g.beginPath(); g.roundRect(2, 2, W - 4, c.height - 4, 18); g.fill();
  g.fillStyle = '#2fbf71'; g.fillRect(2, 14, 8, c.height - 28);
  g.fillStyle = '#fff'; g.font = 'bold 34px system-ui'; g.fillText(title, 26, 54);
  g.fillStyle = '#cfe0ee'; g.font = '27px system-ui'; lines.forEach((ln, i) => g.fillText(ln, 26, 96 + i * 34));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { t, aspect: c.width / c.height };
}
function callout(anchorFn, title, body, off) {
  const { t, aspect } = labelTex(title, body);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.renderOrder = 1000; sp.center.set(off[0] < 0 ? 1 : 0, 0.5);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0x2fbf71, depthTest: false })); dot.renderOrder = 999;
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x2fbf71, depthTest: false, transparent: true, opacity: 0.9 })); line.renderOrder = 999;
  lblGroup.add(sp, dot, line);
  callouts.push({ anchorFn, sp, dot, line, aspect, off: new THREE.Vector3(...off) });
}
function clearCallouts() { for (const c of callouts) { lblGroup.remove(c.sp, c.dot, c.line); c.sp.material.map.dispose(); c.sp.material.dispose(); c.line.geometry.dispose(); } callouts.length = 0; }
const _cp = new THREE.Vector3(), _a = new THREE.Vector3(), _p = new THREE.Vector3();
function updateCallouts() {
  const xr = renderer.xr.isPresenting; const cam = xr ? renderer.xr.getCamera() : camera; cam.getWorldPosition(_cp);
  const ws = world.scale.x;
  for (const c of callouts) {
    _a.copy(c.anchorFn());
    _p.copy(c.off).multiplyScalar(ws).applyQuaternion(world.quaternion).add(_a);
    const d = _cp.distanceTo(_p), h = THREE.MathUtils.clamp(d * (xr ? 0.05 : 0.062), 0.012, 0.6);
    c.sp.position.copy(_p); c.sp.scale.set(h * c.aspect, h, 1);
    c.dot.position.copy(_a); c.dot.scale.setScalar(h * 0.08);
    const pa = c.line.geometry.attributes.position; pa.setXYZ(0, _a.x, _a.y, _a.z); pa.setXYZ(1, _p.x, _p.y, _p.z); pa.needsUpdate = true;
  }
}
const W = (mn, x, y, z) => () => MAQ[mn].root.localToWorld(new THREE.Vector3(x, y, z));
const WO = (obj, x = 0, y = 0, z = 0) => () => obj.localToWorld(new THREE.Vector3(x, y, z));

// ------------------------------------------------------------------ pipeta (pipetador elétrico + pipeta sorológica 100 mL)
const pip = new THREE.Group(); pip.visible = false; stage.add(pip);
{
  const vidro = new THREE.MeshStandardMaterial({ color: 0xeaf6fb, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.50, 16), vidro); corpo.position.y = 0.29; pip.add(corpo);
  const ponta = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.003, 0.04, 16), vidro); ponta.position.y = 0.02; pip.add(ponta);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 1, 14), new THREE.MeshStandardMaterial({ color: 0xc98a2a, transparent: true, opacity: 0.85 }));
  liq.position.y = 0.04; pip.add(liq); pip.userData.liq = liq;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.15, 0.04), new THREE.MeshStandardMaterial({ color: 0x2a6db5, roughness: 0.4 })); grip.position.set(0, 0.62, 0); pip.add(grip);
  const gat = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.02), new THREE.MeshStandardMaterial({ color: 0xf5b31a })); gat.position.set(0, 0.60, 0.026); pip.add(gat);
  const marcas = new THREE.Mesh(new THREE.CylinderGeometry(0.0097, 0.0097, 0.30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.25 })); marcas.position.y = 0.2; pip.add(marcas);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.07, 18), new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.4 })); cab.position.y = 0.52; pip.add(cab);
  pip.userData.setVol = (ml) => { const L = 0.30 * ml / 60; liq.scale.y = Math.max(L, 0.0001); liq.position.y = 0.045 + L / 2; };
}
function pipAt(mn, k, u, vol) {          // u: 0 = acima (afastada), 1 = ponta dentro do bocal
  const Bt = MAQ[mn].bottles[k - 1]; const p = Bt.bocal.getWorldPosition(new THREE.Vector3());
  const door = new THREE.Vector3(0, 0, Bt.lado).transformDirection(MAQ[mn].root.matrixWorld);       // direção da porta (operador)
  const axis = new THREE.Vector3(0, 1, 0).cross(door).normalize();
  const qw = new THREE.Quaternion().setFromAxisAngle(axis, 0.42);                                  // pipeta inclinada para o lado do operador
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(qw);
  const e = u * u * (3 - 2 * u);
  const wpos = p.add(new THREE.Vector3(0, 0.03, 0)).addScaledVector(up, (1 - e) * 0.22);
  stage.worldToLocal(wpos); pip.position.copy(wpos);
  const sq = stage.getWorldQuaternion(new THREE.Quaternion()).invert(); pip.quaternion.copy(sq.multiply(qw));
  pip.visible = true; pip.userData.setVol(vol);
}
// ------------------------------------------------------------------ roteiro da apresentação
const r = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
function base(mn, o = {}) {           // estado de referência de uma máquina REV20
  const P = MAQ[mn]; const s = P.state;
  s.doorsF = o.doorsF ?? 0; s.doorsT = o.doorsT ?? 0; s.xray = o.xray ?? 0; s.shake = 0; s.valves = {};
  for (const Bt of P.bottles) { Bt.seatSt = 1; Bt.capSt = 1; Bt.uniaoSt = 1; Bt.clampSt = 1; Bt.levelSt = o.level ?? 1; Bt.tint = o.tint ?? 1; Bt.pipSt = 0; Bt.sensor = o.sensor ?? 1; }
}
const marcaNivel = new THREE.Mesh(new THREE.TorusGeometry(0.1162, 0.0016, 6, 64), new THREE.MeshBasicMaterial({ color: 0xff3b6b, depthTest: true })); marcaNivel.rotation.x = Math.PI / 2; marcaNivel.visible = false;
const camRel = (mn, p, t) => [MAQ[mn].root.localToWorld(new THREE.Vector3(...p)), MAQ[mn].root.localToWorld(new THREE.Vector3(...t))];
const G = (mn, k) => MAQ[mn].bottles[k - 1];
const STEPS = [
  { t: 'Sala de dinamização · 4 máquinas', d: 'Duas máquinas novas REV20 para garrafões de 10 L (M1 com 4 garrafões, M2 com 3) e duas REV17 de 6 × 5 L (M3 e M4). Use ◀ ▶ para navegar, ou ▶ Auto.',
    cam: () => [B(-4.75, -4.75, 4.35), B(0.4, 0.6, 0.5)], fov: 58, dur: 10,
    setup() { base('M1'); base('M2'); },
    callouts() { callout(W('M1', 0.2, 2.45, 0), 'M1 · REV20 4 × 10 L', 'Acesso pela frente (2) e por trás (2)', [-0.3, 0.55, 0.3]); callout(W('M2', 0.2, 2.45, 0), 'M2 · REV20 3 × 10 L', 'Acesso só pela frente', [-0.3, 0.55, 0.0]);
      callout(W('M3', 0.16, 2.7, 0), 'M3 · REV17 6 × 5 L', 'Já aprovada no projeto', [0.3, 0.45, 0.0]); callout(W('M4', 0.16, 2.7, 0), 'M4 · REV17 6 × 5 L', 'Já aprovada no projeto', [0.4, 0.35, 0.0]); },
    anim(t) { MAQ.M3.mix = true; MAQ.M4.mix = true; } },
  { t: 'M1 · REV20 com 4 garrafões de 10 L', d: 'Garrafões em 2 fileiras: G1 e G2 pela frente, G3 e G4 por trás, com portas de 2 folhas dos dois lados. Lado técnico à direita: quadro elétrico, IHM 7", botões e emergência.',
    cam: () => camRel('M1', [1.9, 1.75, 2.9], [0.15, 1.15, 0]), dur: 10,
    setup() { base('M1', { doorsF: 0 }); },
    callouts() { callout(W('M1', -0.5, 2.33, 0.63), 'Dimensões', 'L 1,45 × P 1,26 × A 2,33 m (+ torre 0,30 m)', [-0.45, 0.25, 0.2]); callout(W('M1', 0.71, 1.52, 0.65), 'Quadro + IHM 7"', 'INICIAR · PARAR · REARME · emergência', [0.45, 0.25, 0.3]);
      callout(W('M1', -0.25, 1.2, 0.64), 'Portas de 2 folhas', 'Policarbonato fumê, intertravamento RFID', [-0.55, -0.15, 0.3]); },
    anim(t) { const s = MAQ.M1.state; s.doorsF = r(t, 2, 4) * (1 - r(t, 8, 9.5)); } },
  { t: 'Garrafão 10 L · borosilicato 3.3 · rosca GL80', d: 'Referência: frasco DURAN GLS 80 de 10 L (Ø229 × 385 mm), graduado em esmalte branco. Enchimento de 70 % = 7 L (≈190 mm de coluna). O garrafão assenta num copo de UHMW com entrada cônica e liner de PU.',
    cam: () => camRel('M1', [0.25, 1.38, 1.35], [-0.21, 0.95, 0.27]), dur: 12,
    setup() { base('M1', { doorsF: 1, level: 0, tint: 0, sensor: 0 }); const b = G('M1', 1); b.seatSt = 0; b.capSt = 0; b.uniaoSt = 0; b.clampSt = 0; G('M1', 2).clampSt = 1; marcaNivel.visible = true; G('M1', 1).gb.add(marcaNivel); marcaNivel.position.y = 0.008 + GARRAFAO.nivel; },
    callouts() { const b = G('M1', 1); callout(WO(b.gb, 0.1146, 0.13, 0), 'Ø229 × 385 mm', 'Borosilicato 3.3 · ~4 kg vazio', [0.38, 0.05, 0.25]);
      callout(WO(b.gb, -0.1162, 0.2, 0), '70 % = 7 L', 'Linha de enchimento', [-0.42, 0.1, 0.2]); callout(WO(b.gb, 0, 0.37, 0), 'Rosca GL80', 'Boca larga: tampa com 4 conexões', [0.35, 0.22, 0.15]);
      callout(W('M1', -0.21, 0.76, 0.40), 'Copo UHMW', 'Entrada cônica + liner PU · sensor de presença', [-0.5, -0.12, 0.25]); },
    anim(t) { const b = G('M1', 1); b.seatSt = r(t, 1, 4); }, leave() { marcaNivel.visible = false; marcaNivel.removeFromParent(); } },
  { t: 'Tampa GL80 rosqueada · anel + inserto', d: 'O anel azul rosqueia na boca GL80 e o inserto de 316L não gira — os pescadores não torcem. 4 conexões, iguais às demais máquinas: BASE (enchimento pelo fundo), DRENO, RESPIRO e BOCAL de pipetagem com sensor de garfo.',
    cam: () => camRel('M1', [0.0, 1.42, 0.85], [-0.21, 1.1, 0.27]), dur: 10,
    setup() { base('M1', { doorsF: 1, level: 0, tint: 0, sensor: 0 }); const b = G('M1', 1); b.capSt = 0; b.uniaoSt = 0; b.clampSt = 0; },
    callouts() { const b = G('M1', 1); callout(WO(b.anel, 0.048, 0.018, 0), 'Anel GL80 (gira)', 'PP/PVDF serrilhado · 1,5 volta', [0.3, -0.05, 0.2]);
      callout(WO(b.ins, -0.022, 0.07, 0), 'BASE · DRENO', 'Pescadores 316L Ø12 até o fundo', [-0.32, 0.1, 0.1]); callout(WO(b.bocal, 0, 0.04, 0), 'BOCAL de pipetagem', 'Tampa articulada + sensor de garfo', [0.28, 0.16, 0.12]);
      callout(WO(b.ins, 0, 0.07, -0.022), 'RESPIRO', 'Só no espaço de cabeça', [-0.25, 0.22, -0.05]); },
    anim(t) { G('M1', 1).capSt = r(t, 1, 4.5); } },
  { t: 'Uniões: solta sem ferramenta', d: 'Cada conexão tem união rosqueada (porca de união): solta a mangueira da tampa para trocar ou lavar o garrafão. BASE e DRENO 3/8", RESPIRO 1/4". O bocal de pipetagem fica sempre livre, virado para o operador.',
    cam: () => camRel('M1', [0.05, 1.36, 0.78], [-0.21, 1.12, 0.27]), dur: 9,
    setup() { base('M1', { doorsF: 1, level: 0, tint: 0, sensor: 0 }); const b = G('M1', 1); b.uniaoSt = 0; b.clampSt = 0; },
    callouts() { const b = G('M1', 1); callout(() => b.uniaoTops[0].g.localToWorld(new THREE.Vector3(0, 0.01, 0)), 'Porca de união', '3/8" BASE e DRENO · 1/4" RESPIRO', [-0.32, 0.12, 0.12]); },
    anim(t) { G('M1', 1).uniaoSt = r(t, 1, 3.5); } },
  { t: 'Fixação: 1 cilindro por garrafão, de cima para baixo', d: 'Cilindro pneumático guiado Ø50, curso 200 mm, preso no carro. A garra em U, com anel cônico de PU, apoia no ombro — a parte mais larga em cima do garrafão — e o empurra contra o copo. Aberta, sobe 200 mm e libera a retirada pela porta.',
    cam: () => camRel('M1', [0.62, 1.42, 1.25], [-0.21, 1.12, 0.22]), dur: 12,
    setup() { base('M1', { doorsF: 1, level: 0, tint: 0, sensor: 0, xray: 0 }); G('M1', 1).clampSt = 0; },
    callouts() { const b = G('M1', 1); callout(WO(b.garra.haste.parent, 0.055, 1.42, 0), 'Cilindro guiado Ø50 × 200', 'Hastes-guia antigiro · sensores aberto/preso', [0.35, 0.12, 0.15]);
      callout(WO(b.gb, 0.1, 0.3, 0), 'Garra em U + anel de PU', 'Apoia no ombro (parte larga superior)', [0.42, 0.05, 0.3]); callout(WO(b.gb, -0.05, 0.36, 0.05), 'Força', '6 bar → 1,18 kN · regulador em ~0,8 kN', [-0.42, 0.15, 0.2]); },
    anim(t) { const c = (t % 6); G('M1', 1).clampSt = r(c, 0.5, 2.0) * (1 - r(c, 4.0, 5.2)); } },
  { t: 'Sem fuso e sem pontes', d: 'A garra viaja junto com o carro e o garrafão na sucussão: não há ponte com fuso para descer cabeçote. Menos peças, ciclo mais curto (fixa em ~2 s) e acesso livre por cima. Carenagem em raio-X.',
    cam: () => camRel('M1', [1.7, 1.55, 2.2], [0.0, 1.15, 0]), dur: 10,
    setup() { base('M1', { xray: 1 }); },
    callouts() { callout(W('M1', 0.46, 1.25, 0), 'Eixos-guia Ø40', 'Mancais lineares no carro', [0.5, 0.1, 0.3]); callout(W('M1', 0, 1.56, 0.08), 'Viga do carro', 'Cilindros montados entre as fileiras', [-0.55, 0.25, 0.4]);
      callout(W('M1', 0, 1.93, 0.1), 'Válvulas por garrafão', 'BASE · DRENO · RESPIRO (12 no total)', [0.5, 0.25, 0.2]); },
    anim(t) { const s = MAQ.M1.state; s.shake = 0.6; s.crank = t * 2.2; } },
  { t: 'Dosagem: 7 L por garrafão (70 %)', d: 'Portas fechadas, as válvulas BASE abrem e cada medidor de engrenagem oval corta em 7,0 L. Com ~4 L/min por garrafão, as 4 enchem juntas em ≈1:45. Enchimento pelo fundo, sem espuma.',
    cam: () => camRel('M1', [1.0, 1.45, 1.9], [-0.05, 1.0, 0.1]), dur: 10,
    setup() { base('M1', { level: 0, tint: 0, sensor: 0, xray: 0.8 }); },
    callouts() { callout(W('M1', 0, 1.93, 0.1), 'BASE aberta', 'Medidor oval + solenoide por garrafão', [0.5, 0.25, 0.3]); },
    anim(t) { const P = MAQ.M1; const u = r(t, 1, 8); P.state.valves = { BASE: u > 0 && u < 1 }; for (const b of P.bottles) b.levelSt = u; P.drawIHM(u < 1 ? 'DOSANDO SOLUÇÃO 20%' : 'DOSAGEM OK · 7,0 L', `Medidores: ${(7 * u).toFixed(2).replace('.', ',')} L por garrafão\n4 × 7 L = 28 L`, u < 1 ? '#3d8bfd' : '#2fbf71'); } },
  { t: 'Pipetagem: 60 mL pelo bocal', d: 'Portas abertas dos dois lados. Em cada bocal a operadora dispensa 60 mL (pipeta sorológica de 100 mL com pipetador elétrico). O sensor de garfo registra a passagem; o CLP só libera a mistura com 4/4 registros.',
    cam: () => camRel('M1', [0.35, 1.62, 1.2], [-0.12, 1.2, 0.22]), dur: 16,
    setup() { base('M1', { doorsF: 1, doorsT: 1, level: 1, tint: 0, sensor: 0 }); },
    callouts() { callout(() => pip.localToWorld(new THREE.Vector3(0, 0.25, 0)), 'Pipetador + pipeta 100 mL', '60 mL por garrafão · 240 mL por ciclo', [0.35, 0.02, 0.2]);
      callout(WO(G('M1', 1).bocal, 0, 0.015, 0.015), 'Sensor de garfo', 'LED verde = passagem registrada', [-0.38, 0.05, 0.2]); },
    anim(t) { const P = MAQ.M1; const order = [1, 2, 4, 3];
      const seg = Math.min(Math.floor(t / 3.6), 3), u = (t - seg * 3.6) / 3.6; const k = order[seg];
      for (const [i, kk] of order.entries()) { const b = G('M1', kk); const done = i < seg || (i === seg && u > 0.6); b.sensor = done ? 1 : 0; b.tint = done ? 1 : 0; b.pipSt = i === seg ? r(u, 0.05, 0.2) * (1 - r(u, 0.8, 0.95)) : 0; }
      pipAt('M1', k, r(u, 0.15, 0.4) * (1 - r(u, 0.7, 0.9)), 60 * (1 - r(u, 0.45, 0.62)));
      const n = order.filter((kk, i) => i < seg || (i === seg && u > 0.6)).length; P.drawIHM('PIPETAR ATIVO', `Sensores dos bocais: ${n}/4\n60 mL por garrafão`, '#f5b31a'); },
    leave() { pip.visible = false; } },
  { t: 'Sucussão', d: 'Manivela-biela sob a bandeja: curso de 60 mm, 120 golpes/min, mistura de 5:00. Massa em movimento ≈ 110 kg (4 × 10,8 kg de garrafão cheio + carro e garras), compensada por 2 molas a gás. Motor 2,2 kW com redutor e inversor com STO.',
    cam: () => camRel('M1', [1.75, 1.0, 2.0], [0.0, 0.8, 0]), dur: 12,
    setup() { base('M1', { xray: 1 }); },
    callouts() { callout(W('M1', 0, 0.42, 0), 'Manivela + biela', 'Curso 60 mm · 120 golpes/min', [0.55, -0.1, 0.4]); callout(W('M1', -0.25, 0.36, -0.30), 'Motor 2,2 kW + redutor', 'Inversor com STO e freio', [-0.6, 0.0, 0.3]);
      callout(W('M1', 0.21, 1.03, 0.27), 'Garrafão preso', 'Garra + copo: não bate, não gira', [0.45, 0.35, 0.3]); },
    anim(t) { const P = MAQ.M1; P.state.shake = 1; P.state.crank = t * Math.PI * 2 * 2; P.drawIHM('DINAMIZANDO', `golpes: ${Math.round(t * 2)} / 600 · 120/min\nmistura 5:00`); } },
  { t: 'Descarga e retirada para limpeza', d: 'O DRENO esvazia os 28 L para o tanque de passagem. Para trocar ou lavar um garrafão: a garra sobe 200 mm, as uniões são soltas, o anel GL80 desrosqueia e o garrafão sai pela porta — sem ferramenta.',
    cam: () => camRel('M1', [0.35, 1.45, 1.55], [-0.15, 1.0, 0.25]), dur: 14,
    setup() { base('M1', { doorsF: 0 }); },
    callouts() { callout(W('M1', 0, 1.93, 0.1), 'DRENO aberto', 'Vácuo → receptor → TQ-01', [0.5, 0.2, 0.3]); },
    anim(t) { const P = MAQ.M1; const s = P.state; const d = r(t, 0.5, 4); s.valves = { DRENO: d > 0 && d < 1, RESPIRO: d > 0 && d < 1 }; for (const b of P.bottles) b.levelSt = 1 - d;
      s.doorsF = r(t, 4, 5.5); const b = G('M1', 1); b.clampSt = 1 - r(t, 5.5, 7); b.uniaoSt = 1 - r(t, 7, 8.5); b.capSt = 1 - r(t, 8.5, 10.5); b.seatSt = 1 - r(t, 10.5, 13);
      P.drawIHM(d < 1 ? 'DRENANDO → TQ-01' : 'LIBERADA P/ TROCA', d < 1 ? `Transferindo ${(28 * d).toFixed(1).replace('.', ',')} L` : 'Garra aberta · uniões soltas', d < 1 ? '#19b3c9' : '#9fb0bf'); } },
  { t: 'M2 · REV20 com 3 garrafões · só pela frente', d: 'Mesma mecânica da M1 com 3 garrafões em linha. Cilindros atrás dos garrafões: a frente fica livre para colocar, pipetar e retirar. O fundo é fechado e pode encostar na parede.',
    cam: () => camRel('M2', [1.8, 1.7, 2.6], [0.1, 1.1, 0]), dur: 12,
    setup() { base('M2', { doorsF: 0, xray: 0 }); },
    callouts() { callout(W('M2', -0.68, 2.33, 0.4), 'Dimensões', 'L 1,82 × P 0,80 × A 2,33 m', [-0.45, 0.25, 0.2]); callout(W('M2', 0, 1.35, -0.09), 'Cilindros atrás', 'Frente livre para o operador', [0.55, 0.25, 0.25]);
      callout(W('M2', 0, 1.0, -0.40), 'Fundo fechado', 'Sem porta traseira', [-0.6, -0.2, -0.2]); },
    anim(t) { const P = MAQ.M2, s = P.state; s.doorsF = r(t, 1, 3); s.xray = r(t, 6, 7.5) * 0.85; const c = t % 6; for (const b of P.bottles) b.clampSt = 1 - r(c, 3.5, 4.3) * (1 - r(c, 5.0, 5.8)); } },
  { t: 'M3 e M4 · REV17 · 6 × 5 L', d: 'As duas máquinas que já desenvolvemos: 6 garrafões de 5 L, cabeçotes por pontes com fuso, pipetagem de 30 mL por bocal e ciclo de ~8 min.',
    cam: () => [B(1.4, 0.0, 2.6), B(-3.2, 0.0, 1.1)], dur: 12,
    setup() { base('M1'); base('M2'); },
    callouts() { callout(W('M3', 0.16, 2.7, 0), 'M3 · REV17', '6 × 3,6 L = 21,6 L/ciclo', [0.4, 0.3, 0]); callout(W('M4', 0.16, 2.7, 0), 'M4 · REV17', '6 × 3,6 L = 21,6 L/ciclo', [0.4, 0.3, 0]); },
    anim(t) { MAQ.M3.mix = true; MAQ.M4.mix = true; } },
  { t: 'Comparativo', d: 'Estimativas por máquina, a confirmar no protótipo (dosagem a 4 L/min, mistura fixa de 5:00, drenagem a vácuo).',
    cam: () => [B(-4.75, -4.75, 4.35), B(0.4, 0.6, 0.5)], fov: 58, dur: 14, tabela: true,
    setup() { base('M1'); base('M2'); }, callouts() {}, anim(t) { MAQ.M3.mix = true; MAQ.M4.mix = true; } },
];

// ------------------------------------------------------------------ navegação
const TOUR = { i: 0, t: 0, auto: false, camFrom: null, camTo: null, camT: 1 };
function goStep(i) {
  const prev = STEPS[TOUR.i]; if (prev && prev.leave) prev.leave();
  TOUR.i = (i + STEPS.length) % STEPS.length; TOUR.t = 0; const S = STEPS[TOUR.i];
  for (const mn of ['M3', 'M4']) MAQ[mn].mix = false;
  base('M1'); base('M2'); pip.visible = false;
  S.setup(); clearCallouts(); S.callouts();
  for (const mn of ['M1', 'M2']) MAQ[mn].drawIHM('PRONTA', 'Garrafões fixados · tampas GL80\nconectadas');
  TOUR.goCam();
  $('pnum').textContent = `${TOUR.i + 1}/${STEPS.length}`; $('ptit').textContent = S.t; $('ptxt').textContent = S.d;
  const ac = $('arcap'); if (ac) ac.innerHTML = `<b>${TOUR.i + 1}/${STEPS.length} · ${S.t}</b><br>${S.d}`;
  $('tabela').style.display = S.tabela && !renderer.xr.isPresenting ? 'block' : 'none';
  [...$('lista').children].forEach((li, k) => li.classList.toggle('on', k === TOUR.i));
  capPanel.update(S);
}
TOUR.goCam = (instant) => { if (renderer.xr.isPresenting) return; const [p, t] = STEPS[TOUR.i].cam(); TOUR.camFrom = [camera.position.clone(), controls.target.clone(), camera.fov]; TOUR.camTo = [p, t, STEPS[TOUR.i].fov || 50]; TOUR.camT = instant ? 1 : 0; if (instant) { camera.position.copy(p); controls.target.copy(t); camera.fov = TOUR.camTo[2]; camera.updateProjectionMatrix(); controls.update(); } };
TOUR.next = () => goStep(TOUR.i + 1); TOUR.prev = () => goStep(TOUR.i - 1);
TOUR.toggleAuto = () => { TOUR.auto = !TOUR.auto; $('auto').classList.toggle('on', TOUR.auto); $('auto').textContent = TOUR.auto ? '❚❚ Auto' : '▶ Auto'; };
TOUR.xrStart = () => { goStep(TOUR.i); };
controls.addEventListener('start', () => { TOUR.camT = 1; });

// painel flutuante com o texto do passo (VR e Quest-AR, sem dom-overlay)
const capPanel = (() => {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 300; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.18), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, toneMapped: false })); sp.renderOrder = 1001; sp.visible = false; scene.add(sp);
  const update = (S) => { const g = cv.getContext('2d'); g.clearRect(0, 0, 1024, 300); g.fillStyle = 'rgba(12,19,27,.88)'; g.beginPath(); g.roundRect(4, 4, 1016, 292, 24); g.fill();
    g.fillStyle = '#2fbf71'; g.font = 'bold 40px system-ui'; g.fillText(`${TOUR.i + 1}/${STEPS.length} · ${S.t}`.slice(0, 52), 28, 58);
    g.fillStyle = '#e8eef3'; g.font = '28px system-ui'; const words = S.d.split(' '); let l = '', y = 104; for (const w of words) { const t = l ? l + ' ' + w : w; if (g.measureText(t).width > 960 && l) { g.fillText(l, 28, y); y += 36; l = w; if (y > 250) break; } else l = t; } if (y <= 250) g.fillText(l, 28, y);
    g.fillStyle = '#9fb0bf'; g.font = '22px system-ui'; g.fillText('Controle direito: A = próximo · B = anterior · Y = auto', 28, 284); tex.needsUpdate = true; };
  const _f = new THREE.Vector3(), _c = new THREE.Vector3();
  const frame = () => { const xr = renderer.xr.isPresenting && !(XR.mode === 'ar' && renderer.xr.getSession() && renderer.xr.getSession().domOverlayState);
    sp.visible = xr; if (!xr) return; const cam = renderer.xr.getCamera(); cam.getWorldPosition(_c); cam.getWorldDirection(_f); _f.y = 0; _f.normalize();
    const want = _c.clone().addScaledVector(_f, 0.9); want.y = _c.y - 0.42; sp.position.lerp(want, sp.userData.ok ? 0.05 : 1); sp.userData.ok = true; sp.lookAt(_c.x, sp.position.y, _c.z); };
  return { update, frame };
})();

// ------------------------------------------------------------------ AR: o que aparece (sala inteira ou uma máquina recentrada)
const ARTGT = { v: 'sala' };
function aplicaAlvo(v) {
  ARTGT.v = v;
  stage.position.set(0, 0, 0); stage.quaternion.identity();
  sala.visible = v === 'sala'; for (const mn of ALL) MAQ[mn].root.visible = v === 'sala' || v === mn;
  if (v !== 'sala') { const rt = MAQ[v].root; const qi = rt.quaternion.clone().invert(); stage.quaternion.copy(qi); stage.position.copy(rt.position).applyQuaternion(qi).negate(); }
  const d = v === 'sala' ? [5, 5] : [(MAQ[v].dims.TX - MAQ[v].dims.XL) / 2 + 0.1, MAQ[v].dims.PZ + 0.1];
  const cx = v === 'sala' ? 0 : (MAQ[v].dims.TX + MAQ[v].dims.XL) / 2;
  aoBlobs.forEach((b, i) => { if (b.visible || renderer.xr.isPresenting) b.visible = renderer.xr.isPresenting && (v === 'sala' || ALL[i] === v); });
  footprint.geometry.setFromPoints([new THREE.Vector3(cx - d[0], 0.01, -d[1]), new THREE.Vector3(cx + d[0], 0.01, -d[1]), new THREE.Vector3(cx + d[0], 0.01, d[1]), new THREE.Vector3(cx - d[0], 0.01, d[1])]);
}
renderer.xr.addEventListener('sessionstart', () => { if (XR.mode === 'ar') aplicaAlvo($('artgt').value); });
renderer.xr.addEventListener('sessionend', () => { aplicaAlvo('sala'); goStep(TOUR.i); });

// ------------------------------------------------------------------ interface
const lista = $('lista'); STEPS.forEach((S, k) => { const li = document.createElement('li'); li.textContent = `${k + 1}. ${S.t}`; li.onclick = () => goStep(k); lista.appendChild(li); });
$('prev').onclick = () => TOUR.prev(); $('next').onclick = () => TOUR.next(); $('auto').onclick = () => TOUR.toggleAuto();
$('xray').onclick = () => { TOUR.xrayForce = !TOUR.xrayForce; $('xray').classList.toggle('on', TOUR.xrayForce); };
$('menu').onclick = () => $('lista').classList.toggle('open');
addEventListener('keydown', (e) => { if (e.code === 'ArrowRight' || e.code === 'PageDown') TOUR.next(); if (e.code === 'ArrowLeft' || e.code === 'PageUp') TOUR.prev(); if (e.code === 'Space') { e.preventDefault(); TOUR.toggleAuto(); } });
$('arPrev').onclick = () => TOUR.prev(); $('arNext').onclick = () => TOUR.next();
$('lt').textContent = 'pronto'; $('start').style.display = 'block';
$('start').onclick = () => { $('load').remove(); };
const q0 = new URLSearchParams(location.search); goStep(Math.max(0, Math.min(STEPS.length - 1, (+q0.get('passo') || 1) - 1))); TOUR.goCam(true);

// ------------------------------------------------------------------ laço principal
let last = performance.now();
function update(dt) {
  const S = STEPS[TOUR.i];
  TOUR.t += dt;
  if (TOUR.auto && TOUR.t > S.dur) TOUR.next();
  // máquinas REV20: estado do passo (anima o tempo do passo; repete se passar do fim)
  S.setup(); S.anim(TOUR.t % Math.max(S.dur, 1), dt);
  for (const mn of ['M1', 'M2']) { const P = MAQ[mn]; if (TOUR.xrayForce) P.state.xray = 1; P.apply(); }
  // REV17: ciclo animado quando o passo pede
  for (const mn of ['M3', 'M4']) { const m = MAQ[mn]; m.ct = m.mix ? ((m.ct || 0) + dt) % 51.5 : 0; m.act.time = m.ct; m.mixer.update(0); }
  // torres
  for (const mn of ['M1', 'M2']) { const P = MAQ[mn], tw = P.torre, s = P.state; const run = s.shake > 0.5 || Object.values(s.valves).some(Boolean);
    tw.verde.emissiveIntensity = run ? 1.6 : 0.05; tw.amarelo.emissiveIntensity = !run && (s.doorsF > 0.5 || s.doorsT > 0.5) ? 1.6 : 0.05; tw.vermelho.emissiveIntensity = 0.05; }
  updateCallouts(); capPanel.frame();
  if (TOUR.camT < 1 && !renderer.xr.isPresenting) { TOUR.camT = Math.min(1, TOUR.camT + dt / 1.6); const e = TOUR.camT * TOUR.camT * (3 - 2 * TOUR.camT);
    camera.position.lerpVectors(TOUR.camFrom[0], TOUR.camTo[0], e); controls.target.lerpVectors(TOUR.camFrom[1], TOUR.camTo[1], e); camera.fov = TOUR.camFrom[2] + (TOUR.camTo[2] - TOUR.camFrom[2]) * e; camera.updateProjectionMatrix(); }
  $('pbar').style.width = `${Math.min(100, 100 * TOUR.t / S.dur)}%`;
}
renderer.setAnimationLoop((now, frame) => {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  update(dt);
  if (renderer.xr.isPresenting) { xrInput(dt); arFrame(frame, dt); sombraFrame(); }
  else controls.update();
  renderer.render(scene, camera);
});
// ganchos para testes automáticos
window.__ready = true;
window.__apres = { TOUR, STEPS, MAQ, goStep, update, aplicaAlvo, scene, camera, controls, renderer, world, stage, REAL: typeof REAL !== 'undefined' ? REAL : null };
window.__shot = (i, t, pos, tg) => { if (i !== TOUR.i) goStep(i); TOUR.t = t; update(0.0001); if (pos) { camera.position.copy(pos); controls.target.copy(tg); } else { const [p, q] = STEPS[i].cam(); camera.position.copy(p); controls.target.copy(q); camera.fov = STEPS[i].fov || 50; camera.updateProjectionMatrix(); } controls.update(); TOUR.camT = 1; update(0.0001); renderer.render(scene, camera); return true; };
window.__stop = () => renderer.setAnimationLoop(null);
