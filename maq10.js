// Dinamizadora CMR · REV20 — garrafões de 10 L (borosilicato 3.3, GL80, graduado)
//   versão 4G: 4 garrafões, acesso frente (2) e trás (2)        versão 3G: 3 garrafões, acesso só pela frente
//   sem fuso/pontes: tampa GL80 rosqueada (anel giratório + inserto fixo com 4 conexões e uniões)
//   fixação de cada garrafão por um cilindro pneumático guiado, de cima para baixo, no ombro do garrafão
// Coordenadas locais em metros: Y para cima, frente = +Z, lado técnico = +X.
import * as THREE from 'three';

// ---------------------------------------------------------------- dados do garrafão (DURAN GLS 80 10 L como referência)
export const GARRAFAO = { D: 0.2293, H: 0.385, rosca: 'GL80', vol: 10, enche: 0.7, nivel: 0.192, pip: 60 };
const Yb = 0.712;               // fundo do garrafão (sobre o liner do copo) com o carro no ponto médio
const CLAMP_STROKE = 0.20;      // curso do cilindro (garra sobe acima do garrafão para retirada)
const SHAKE_R = 0.03;           // raio da manivela → curso de sucussão 60 mm

function uvBox(g, w, h, d, k = 1.6) {        // UV proporcional ao tamanho (escovado sem esticar)
  const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * dims[f][0] * k, uv.getY(j) * dims[f][1] * k); }
  return g;
}
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

export function buildMaquina10(M, opts) {
  const N = opts.n;                         // 4 ou 3
  const tres = N === 3;
  const nome = opts.nome || (tres ? 'M2' : 'M1');
  const root = new THREE.Group(); root.name = `CMR_REV20_${N}G_${nome}`;
  const fixed = new THREE.Group(); fixed.name = 'FIXO'; root.add(fixed);
  const carro = new THREE.Group(); carro.name = 'CARRO_SUCUSSAO'; root.add(carro);
  const parts = { root, carro, fixed, bottles: [], doors: [], skins: [], valves: [], labels: {} };

  // materiais próprios (carenagem/portas ficam transparentes no "raio-X")
  const own = (m) => { const c = m.clone(); c.userData.op0 = c.opacity; c.userData.tr0 = c.transparent; return c; };
  const INOX = own(M.inox), INOXP = own(M.inox), PC = own(M.pc), GRAF = own(M.grafite);
  parts.skinMats = [INOX, PC, GRAF];
  const I316 = M.inox316, PTFE = M.ptfe, EPDM = M.epdm, PRETO = M.preto, CROMO = M.cromo, ALU = M.aluminio;
  const PU = new THREE.MeshStandardMaterial({ color: 0xe8792b, roughness: 0.55 });
  const UHMW = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 });
  const AZUL_PP = new THREE.MeshStandardMaterial({ color: 0x1f5fae, roughness: 0.45 });
  const GLASS = new THREE.MeshPhysicalMaterial({ color: 0xd9eef6, roughness: 0.02, metalness: 0.0, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1 });
  const SOL = new THREE.MeshStandardMaterial({ color: 0xcfe6f0, roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false });

  const box = (w, h, d, mat, x, y, z, parent = fixed, uv = true) => {
    const g = new THREE.BoxGeometry(w, h, d); if (uv) uvBox(g, w, h, d);
    const o = new THREE.Mesh(g, mat); o.position.set(x, y, z); parent.add(o); return o;
  };
  const cyl = (r, h, mat, x, y, z, parent = fixed, seg = 24, rt = r) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, r, h, seg), mat); o.position.set(x, y, z); parent.add(o); return o; };
  const hexa = (r, h, mat, x, y, z, parent) => cyl(r, h, mat, x, y, z, parent, 6);
  const skin = (o) => { parts.skins.push(o); return o; };

  // ---------------------------------------------------------------- dimensões gerais
  const PX = tres ? 0.68 : 0.50;            // meia-largura da área de processo (x)
  const TX = PX + 0.42;                     // fim do lado técnico (x)
  const PZ = tres ? 0.40 : 0.63;            // meia-profundidade
  const XL = -PX - 0.03;                    // face esquerda
  const pos = tres ? [[-0.42, 0.08], [0, 0.08], [0.42, 0.08]] : [[-0.21, 0.27], [0.21, 0.27], [-0.21, -0.27], [0.21, -0.27]];
  const lado = (z) => (tres || z > 0 ? 1 : -1);          // +1 = garrafão atendido pela frente, −1 = por trás
  parts.dims = { PX, TX, PZ, XL, H: 2.33 };

  // ---------------------------------------------------------------- base, compartimento inferior e tampo (fixos)
  for (const [x, z] of [[XL + 0.06, PZ - 0.06], [TX - 0.06, PZ - 0.06], [XL + 0.06, -PZ + 0.06], [TX - 0.06, -PZ + 0.06]]) {
    cyl(0.035, 0.012, PRETO, x, 0.006, z); cyl(0.008, 0.05, CROMO, x, 0.035, z);
  }
  box(TX - XL, 0.05, PZ * 2, M.ferro, (TX + XL) / 2, 0.085, 0);                                          // quadro de base 40×40
  skin(box(TX - XL + 0.004, 0.08, PZ * 2 + 0.004, GRAF, (TX + XL) / 2, 0.15, 0));                        // rodapé grafite
  for (const s of [1, -1]) skin(box(TX - XL, 0.45, 0.012, INOX, (TX + XL) / 2, 0.415, s * PZ));         // painéis inferiores
  skin(box(0.012, 0.45, PZ * 2, INOX, XL, 0.415, 0)); skin(box(0.012, 0.45, PZ * 2, INOX, TX, 0.415, 0));
  box(PX * 2, 0.015, PZ * 2 - 0.02, INOX, 0, 0.632, 0);                                                    // tampo da área de processo
  // ---- acionamento da sucussão (manivela-biela sob o centro da bandeja)
  const mot = new THREE.Group(); mot.position.set(0, 0.36, tres ? -0.18 : -0.30); fixed.add(mot);
  const motor = cyl(0.10, 0.34, M.grafite, -0.25, 0, 0, mot, 28); motor.rotation.z = Math.PI / 2;
  const tampaV = cyl(0.09, 0.06, M.grafite, -0.45, 0, 0, mot, 28); tampaV.rotation.z = Math.PI / 2;
  box(0.22, 0.24, 0.20, M.grafite, 0.04, 0, 0, mot);                                                       // redutor cônico-helicoidal
  const crankG = new THREE.Group(); crankG.position.set(0, 0.42, 0); fixed.add(crankG);                  // eixo da manivela (x)
  const disco = cyl(0.11, 0.035, M.ferro, 0, 0, 0, crankG, 32); disco.rotation.z = Math.PI / 2;
  const contra = box(0.03, 0.09, 0.12, M.ferro, 0, -0.07, 0, crankG); contra.position.x = -0.02;          // contrapeso
  const pino = cyl(0.014, 0.06, CROMO, 0.03, SHAKE_R, 0, crankG, 16); pino.rotation.z = Math.PI / 2;
  const eixoM = cyl(0.022, 0.26, CROMO, -0.13, 0, 0, crankG, 16); eixoM.rotation.z = Math.PI / 2;
  const mancal = box(0.06, 0.10, 0.12, M.grafite, -0.20, -0.05, 0, crankG);
  const biela = box(0.035, 1, 0.05, ALU, 0.03, 0, 0, fixed, false); biela.name = 'BIELA';
  parts.crank = crankG; parts.biela = biela; parts.pino = pino;
  // molas a gás (equilibram o peso do carro)
  const gas = [];
  for (const sx of [-1, 1]) {
    const c = cyl(0.014, 0.22, PRETO, sx * (PX - 0.18), 0.36, 0, fixed, 16); const h = cyl(0.006, 0.2, CROMO, sx * (PX - 0.18), 0.55, 0, fixed, 12); gas.push(h);
  }
  parts.gas = gas;
  // eixos-guia verticais Ø40 (fixos) nas laterais da área de processo
  const guiaX = PX - 0.04;
  for (const sx of [-1, 1]) {
    cyl(0.02, 1.0, CROMO, sx * guiaX, 1.135, 0, fixed, 20);
    box(0.09, 0.03, 0.09, I316, sx * guiaX, 0.65, 0); box(0.09, 0.03, 0.09, I316, sx * guiaX, 1.645, 0);
  }

  // ---------------------------------------------------------------- CARRO (sobe e desce na sucussão): bandeja, copos, garrafões, garras
  const bandeja = box(PX * 2 - 0.06, 0.018, PZ * 2 - 0.08, I316, 0, 0.688, 0, carro);                   // bandeja com borda
  for (const s of [1, -1]) box(PX * 2 - 0.06, 0.03, 0.008, I316, 0, 0.71, s * (PZ - 0.044), carro);
  for (const s of [1, -1]) box(0.008, 0.03, PZ * 2 - 0.08, I316, s * (PX - 0.034), 0.71, 0, carro);
  box(0.06, 0.05, 0.08, I316, 0, 0.655, 0, carro);                                                         // olhal da biela
  // colunas laterais do carro + mancais lineares nos eixos-guia + vigas superiores
  const YT = 1.56;                                                                                        // topo do carro
  for (const sx of [-1, 1]) {
    for (const sz of [1, -1]) box(0.04, YT - 0.70, 0.04, I316, sx * (PX - 0.075), (YT + 0.70) / 2, sz * (PZ - 0.10), carro);
    box(0.04, 0.04, PZ * 2 - 0.16, I316, sx * (PX - 0.075), YT, 0, carro);
    for (const y of [0.80, 1.45]) { const b = box(0.07, 0.08, 0.07, ALU, sx * guiaX, y, 0, carro); b.name = 'Mancal linear'; box(0.04, 0.03, 0.03, I316, sx * (guiaX - 0.035), y, 0, carro); }
  }
  // vigas onde os cilindros são presos (sobre a linha dos cilindros)
  const zc = (z) => (tres ? z - 0.17 : z - Math.sign(z) * 0.19);                                          // posição z do cilindro (atrás do garrafão)
  const vigasZ = [...new Set(pos.map(([x, z]) => +zc(z).toFixed(3)))];
  for (const z of vigasZ) box(PX * 2 - 0.15, 0.05, 0.06, I316, 0, YT, z, carro);
  // ---- por garrafão
  const graduacao = canvasTex(256, 1024, (g, w, h) => {                                                // escala em esmalte branco (0,5 L)
    g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 4;
    for (let v = 1; v <= 9; v += 0.5) {
      const y = h - (0.010 + v / 7 * (GARRAFAO.nivel - 0.008)) / 0.262 * h; const big = Number.isInteger(v);
      g.beginPath(); g.moveTo(14, y); g.lineTo(big ? 104 : 64, y); g.stroke();
      if (big) { g.font = 'bold 30px Arial'; g.fillText(`${v}000`, 112, y + 10); }
    }
    g.font = 'bold 26px Arial'; g.fillText('ml', 112, 40); g.font = '19px Arial'; g.fillText('10000', 112, 66);
  });
  const profile = [[0.0, 0.0], [0.092, 0.0], [0.108, 0.004], [0.1146, 0.016], [0.1146, 0.262], [0.111, 0.282], [0.101, 0.300], [0.084, 0.318],
    [0.062, 0.331], [0.045, 0.338], [0.040, 0.345], [0.040, 0.350], [0.0418, 0.352], [0.0418, 0.380], [0.039, 0.385]].map(([r, y]) => new THREE.Vector2(r, y));
  const vidroGeo = new THREE.LatheGeometry(profile, 56);
  pos.forEach(([x, z], i) => {
    const k = i + 1, L = lado(z);
    const B = { k, x, z, lado: L };
    // copo cônico (UHMW + liner PU) fixo na bandeja
    const copo = new THREE.Group(); copo.position.set(x, 0.697, z); carro.add(copo);
    const cOut = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.132, 0.10, 40, 1, true), UHMW); cOut.position.y = 0.05; copo.add(cOut);
    const cIn = new THREE.Mesh(new THREE.CylinderGeometry(0.1185, 0.1165, 0.10, 40, 1, true), PU); cIn.position.y = 0.05; cIn.material = PU; copo.add(cIn);
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.1185, 0.138, 40).rotateX(-Math.PI / 2), UHMW); rim.position.y = 0.10; copo.add(rim);
    const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.12, 40).rotateX(-Math.PI / 2), PRETO); fundo.position.y = 0.012; copo.add(fundo);
    for (const a of [Math.PI / 2 * L, -Math.PI / 2 * L]) { const r = box(0.04, 0.05, 0.004, PRETO, Math.cos(a) * 0.0, 0.075, 0, copo, false); r.position.set(Math.sin(a) * 0.137, 0.075, Math.cos(a) * 0.137); r.rotation.y = a; }   // rasgos p/ dedos
    cyl(0.012, 0.03, M.amarelo, x + 0.0, 0.672, z, carro, 12);                                              // sensor capacitivo "garrafão presente"
    // garrafão (grupo móvel para colocar/retirar)
    const gb = new THREE.Group(); gb.name = `GARRAFAO_10L_G${k}`; gb.position.set(x, Yb, z); carro.add(gb);
    const vidro = new THREE.Mesh(vidroGeo, GLASS); vidro.renderOrder = 2; gb.add(vidro);
    const grad = new THREE.Mesh(new THREE.CylinderGeometry(0.1153, 0.1153, 0.262, 24, 1, true, L > 0 ? -0.95 : Math.PI - 0.95, 0.6), new THREE.MeshBasicMaterial({ map: graduacao, transparent: true, depthWrite: false, toneMapped: false, side: THREE.FrontSide }));
    grad.position.y = 0.131; grad.renderOrder = 3; gb.add(grad);
    graduacao.wrapS = THREE.ClampToEdgeWrapping;
    const solMat = SOL.clone(); const sol = new THREE.Mesh(new THREE.CylinderGeometry(0.110, 0.110, 1, 40), solMat); sol.scale.y = 0.0001; sol.position.y = 0.008; sol.renderOrder = 1; gb.add(sol);
    // tampa GL80: anel rosqueado (gira) + inserto 316L/PTFE (não gira) com 4 conexões e uniões
    const tampa = new THREE.Group(); tampa.name = `TAMPA_GL80_G${k}`; tampa.position.y = 0.352; gb.add(tampa);
    const anel = new THREE.Group(); tampa.add(anel);
    const anelGeo = new THREE.CylinderGeometry(0.0475, 0.0475, 0.036, 48, 1, false);
    { const p = anelGeo.attributes.position; for (let i2 = 0; i2 < p.count; i2++) { const a = Math.atan2(p.getZ(i2), p.getX(i2)); const r = Math.hypot(p.getX(i2), p.getZ(i2)); if (r > 0.04) { const rr = r + 0.0018 * (Math.sin(a * 24) > 0 ? 1 : 0); p.setXYZ(i2, Math.cos(a) * rr, p.getY(i2), Math.sin(a) * rr); } } anelGeo.computeVertexNormals(); }
    const anelM = new THREE.Mesh(anelGeo, AZUL_PP); anelM.position.y = 0.018; anel.add(anelM);
    const marca = box(0.004, 0.03, 0.006, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.049, 0.018, 0, anel, false);
    const ins = new THREE.Group(); ins.name = 'INSERTO_4_CONEXOES'; tampa.add(ins);
    cyl(0.039, 0.012, I316, 0, 0.040, 0, ins, 40); cyl(0.0395, 0.004, PTFE, 0, 0.032, 0, ins, 40);
    // portas do inserto: BASE, DRENO, RESPIRO, BOCAL (bocal voltado para o lado do operador)
    const pr = 0.022, sideZ = L;                                                                             // direção do operador
    const portas = [['BASE', -pr, 0], ['DRENO', pr, 0], ['RESPIRO', 0, -pr * sideZ], ['BOCAL', 0, pr * sideZ]];
    const unioes = [];
    for (const [tipo, px, pz] of portas) {
      if (tipo === 'BOCAL') {                                                                                // bocal de pipetagem com tampa articulada e sensor de garfo
        const bc = new THREE.Group(); bc.position.set(px, 0.046, pz); ins.add(bc);
        cyl(0.008, 0.02, I316, 0, 0.01, 0, bc, 20);
        const funil = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.008, 0.022, 28, 1, true), PTFE); funil.position.y = 0.031; bc.add(funil);
        const hinge = new THREE.Group(); hinge.position.set(0, 0.043, -0.015 * sideZ); bc.add(hinge);
        const lid = cyl(0.0155, 0.004, PTFE, 0, 0, 0.015 * sideZ, hinge, 28);
        const garfo = box(0.034, 0.012, 0.012, M.garfo, 0, 0.012, 0.013 * sideZ, bc, false);
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 10, 8), new THREE.MeshBasicMaterial({ color: 0x2b3b2b })); led.position.set(0.012, 0.02, 0.019 * sideZ); bc.add(led);
        B.bocal = bc; B.lid = hinge; B.led = led; B.sideZ = sideZ;
        continue;
      }
      const big = tipo !== 'RESPIRO';
      const u = new THREE.Group(); u.position.set(px, 0.046, pz); ins.add(u);
      cyl(big ? 0.006 : 0.0045, 0.012, I316, 0, 0.006, 0, u, 14);                                         // niple
      hexa(big ? 0.0105 : 0.008, 0.010, I316, 0, 0.016, 0, u);                                               // porca fixa
      const top = new THREE.Group(); top.position.y = 0.021; u.add(top);
      hexa(big ? 0.0115 : 0.009, 0.012, ALU, 0, 0.006, 0, top);                                             // porca de união (solta)
      cyl(big ? 0.0055 : 0.004, 0.035, I316, 0, 0.028, 0, top, 14);                                         // tubo 316L até a mangueira
      unioes.push({ tipo, g: top, big });
      // pescadores (só BASE e DRENO descem até o fundo)
      if (tipo !== 'RESPIRO') { const p = cyl(0.006, 0.34, I316, px, -0.14, pz, tampa, 12); const ponta = cyl(0.0065, 0.02, PTFE, px, -0.315, pz, tampa, 12); }
    }
    B.uniaoTops = unioes;
    // garra: cilindro pneumático guiado (Ø50 · curso 200) preso na viga do carro + braço + anel em U com PU no ombro
    const zcyl = zc(z), cz = zcyl;
    const cilG = new THREE.Group(); cilG.position.set(x, 0, cz); carro.add(cilG);
    box(0.12, 0.012, 0.09, I316, 0, YT - 0.031, 0, cilG);                                                  // placa de fixação
    const corpo = box(0.11, 0.27, 0.07, ALU, 0, YT - 0.172, 0, cilG); corpo.name = 'Cilindro guiado Ø50 curso 200';
    box(0.112, 0.03, 0.072, PRETO, 0, YT - 0.05, 0, cilG); box(0.112, 0.03, 0.072, PRETO, 0, YT - 0.295, 0, cilG);
    for (const ry of [YT - 0.10, YT - 0.25]) { const pt = cyl(0.006, 0.012, CROMO, 0.0, ry, 0.036 * (cz > z ? -1 : 1) * -1, cilG, 10); pt.rotation.x = Math.PI / 2; }
    const sensores = [YT - 0.12, YT - 0.27].map((ry) => box(0.012, 0.03, 0.008, M.amarelo, 0.056, ry, 0.0, cilG, false));
    const haste = new THREE.Group(); cilG.add(haste);                                                       // parte móvel da garra (y animado)
    const yYokeTop = (c) => Yb + 0.334 + (1 - c) * CLAMP_STROKE;                                            // topo da placa da garra
    for (const gx of [-0.035, 0.035]) cyl(0.008, 0.40, CROMO, gx, 0.20, 0, haste, 12);                      // hastes-guia Ø16
    cyl(0.010, 0.40, CROMO, 0, 0.20, 0, haste, 14);                                                          // haste do pistão Ø20
    const dz = z - cz;                                                                                       // braço até o centro do garrafão
    box(0.12, 0.016, 0.05, I316, 0, -0.008, 0, haste);
    const braco = box(0.05, 0.016, Math.abs(dz) - 0.06, I316, 0, -0.008, dz / 2 + Math.sign(dz) * 0.0, haste);
    // anel em U (aberto para o lado da porta), com PU cônico que assenta no ombro do garrafão
    const ab = Math.PI * 1.5, ang0 = (L > 0 ? -Math.PI / 2 : Math.PI / 2) + (2 * Math.PI - ab) / 2;   // abertura voltada para a porta
    const sh = new THREE.Shape(); sh.absarc(0, 0, 0.108, ang0, ang0 + ab, false); sh.absarc(0, 0, 0.066, ang0 + ab, ang0, true);
    const anelU = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 40 }).rotateX(-Math.PI / 2), I316);
    anelU.position.set(0, -0.014, dz); haste.add(anelU);
    const puCone = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.100, 0.024, 48, 1, true, ang0 + Math.PI / 2, ab), PU); puCone.position.set(0, -0.028, dz); haste.add(puCone);
    const puCone2 = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.098, 0.024, 48, 1, true, ang0 + Math.PI / 2, ab), PU); puCone2.material = PU; puCone2.position.set(0, -0.029, dz); puCone2.scale.set(0.985, 1, 0.985); haste.add(puCone2);
    puCone.material = PU;
    B.garra = { haste, yYokeTop, sensores };
    // mangueiras: das uniões até um passa-parede na viga do carro (seguem o carro)
    B.hoses = [];
    B.gb = gb; B.tampa = tampa; B.anel = anel; B.ins = ins; B.sol = sol; B.solMat = solMat; B.copo = copo;
    parts.bottles.push(B);
  });
  // passa-paredes e mangueiras (geometria recalculada quando uniões/tampa mudam)
  const HOSE = { BASE: M.mangProc, DRENO: M.mangProc2 || M.mangProc, RESPIRO: M.mangResp };
  parts.rebuildHoses = () => {
    for (const B of parts.bottles) {
      for (const h of B.hoses) { h.geometry.dispose(); carro.remove(h); }
      B.hoses = [];
      const vis = B.uniaoSt > 0.5 && B.seatSt > 0.98;
      if (!vis) continue;
      for (const u of B.uniaoTops) {
        const a = u.g.getWorldPosition(new THREE.Vector3()); carro.worldToLocal(a); a.y += 0.045;
        const end = new THREE.Vector3(B.x + (u.tipo === 'BASE' ? -0.03 : u.tipo === 'DRENO' ? 0.03 : 0), YT - 0.03, zc(B.z) + (B.z > zc(B.z) ? 0.045 : -0.045));
        const mid = a.clone().lerp(end, 0.5); mid.y = Math.max(a.y, end.y) + 0.02; mid.z += (B.z - end.z) * 0.25;
        const curve = new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(0, 0.06, 0)), mid, end.clone().add(new THREE.Vector3(0, -0.05, 0)), end]);
        const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, u.big ? 0.008 : 0.005, 8), HOSE[u.tipo]); carro.add(t); B.hoses.push(t);
      }
    }
  };
  // laços de mangueira do carro até o compartimento superior (fixo)
  for (const B of parts.bottles) {
    for (const [i, tipo] of ['BASE', 'DRENO', 'RESPIRO'].entries()) {
      const x = B.x + (i - 1) * 0.03, z = zc(B.z) + (B.z > zc(B.z) ? 0.045 : -0.045);
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x, YT - 0.03, z), new THREE.Vector3(x, YT + 0.12, z), new THREE.Vector3(x + 0.02, YT + 0.22, z * 0.6), new THREE.Vector3(x, 1.86, z * 0.4)]);
      fixed.add(new THREE.Mesh(new THREE.TubeGeometry(c, 20, tipo === 'RESPIRO' ? 0.005 : 0.008, 8), HOSE[tipo]));
    }
  }

  // ---------------------------------------------------------------- compartimento superior: válvulas por garrafão (BASE, DRENO, RESPIRO)
  box(PX * 2, 0.012, PZ * 2 - 0.04, INOX, 0, 1.86, 0);                                                     // piso do compartimento superior
  const LEDoff = new THREE.MeshBasicMaterial({ color: 0x334033 });
  for (const B of parts.bottles) {
    ['BASE', 'DRENO', 'RESPIRO'].forEach((tipo, i) => {
      const x = B.x + (i - 1) * 0.075, z = B.z * 0.4;
      box(0.06, 0.04, 0.042, I316, x, 1.89, z);                                                             // corpo da válvula 3/8"
      cyl(0.016, 0.05, PRETO, x, 1.935, z, fixed, 18);                                                       // bobina
      box(0.028, 0.018, 0.028, PRETO, x, 1.97, z);                                                           // conector DIN
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), LEDoff.clone()); led.position.set(x, 1.982, z + 0.012); fixed.add(led);
      parts.valves.push({ k: B.k, tipo, led });
    });
  }
  for (const z of tres ? [0.03] : [0.11, -0.11]) { const col = cyl(0.02, PX * 2 - 0.1, I316, 0, 2.03, z, fixed, 18); col.rotation.z = Math.PI / 2; }   // coletores

  // ---------------------------------------------------------------- carenagem, portas, quadro elétrico, IHM, torre
  // lado técnico (quadro + bombas): caixa fechada
  const tw = TX - PX;
  for (const s of [1, -1]) if (!(s === 1)) skin(box(tw, 1.68, 0.012, INOX, PX + tw / 2, 1.48, s * PZ));
  skin(box(0.012, 1.68, PZ * 2, INOX, TX, 1.48, 0));
  skin(box(0.012, 1.68, PZ * 2, INOX, XL, 1.48, 0));
  // faixa superior e teto (compartimento de válvulas)
  for (const s of [1, -1]) skin(box(PX * 2, 0.50, 0.012, INOX, 0, 2.07, s * PZ));
  skin(box(TX - XL + 0.01, 0.012, PZ * 2 + 0.01, INOX, (TX + XL) / 2, 2.325, 0));
  for (const s of [1, -1]) for (let i = 0; i < 6; i++) box(0.18, 0.012, 0.004, PRETO, -PX * 0.6 + i * 0.0 + (i % 3) * 0.22 - 0.0, 2.17 + Math.floor(i / 3) * 0.04, s * (PZ + 0.007), fixed, false);   // venezianas
  // fundo (versão 3G: painel fechado atrás da área de processo)
  if (tres) skin(box(PX * 2, 1.18, 0.012, INOX, 0, 1.23, -PZ));
  // montantes das aberturas
  for (const s of tres ? [1] : [1, -1]) {
    box(0.04, 1.18, 0.04, INOXP, -PX, 1.23, s * (PZ - 0.02)); box(0.04, 1.18, 0.04, INOXP, PX, 1.23, s * (PZ - 0.02));
    box(PX * 2 + 0.04, 0.04, 0.04, INOXP, 0, 1.83, s * (PZ - 0.02)); box(PX * 2 + 0.04, 0.04, 0.04, INOXP, 0, 0.64, s * (PZ - 0.02));
  }
  // portas de 2 folhas (frente; e trás na 4G): quadro inox, policarbonato fumê, puxador, sensor RFID
  const mkDoor = (s, side) => {
    const w = PX, hinge = new THREE.Group(); hinge.position.set(side * PX, 0, s * (PZ + 0.012)); fixed.add(hinge);
    const leaf = new THREE.Group(); hinge.add(leaf);
    const cx = -side * w / 2;                                                       // centro da folha (a partir da dobradiça)
    const fr = (W, H, X, Y) => skin(box(W, H, 0.03, INOXP, X, Y, 0, leaf));
    fr(w - 0.01, 0.05, cx, 0.685); fr(w - 0.01, 0.05, cx, 1.785);
    fr(0.05, 1.10, cx - (w / 2 - 0.03), 1.235); fr(0.05, 1.10, cx + (w / 2 - 0.03), 1.235);
    const pc = skin(box(w - 0.10, 1.05, 0.008, PC, cx, 1.235, 0, leaf)); pc.renderOrder = 4;
    const hx = -side * (w - 0.07);
    cyl(0.012, 0.32, I316, hx, 1.20, s * 0.04, leaf, 12);
    for (const yy of [1.06, 1.34]) box(0.02, 0.02, 0.035, I316, hx, yy, s * 0.02, leaf, false);
    box(0.03, 0.02, 0.015, M.amarelo, -side * (w - 0.05), 1.80, s * 0.02, leaf, false);
    parts.doors.push({ s, side, hinge });
  };
  for (const s of tres ? [1] : [1, -1]) { mkDoor(s, -1); mkDoor(s, 1); }
  // quadro elétrico na frente do lado técnico
  const qx = PX + tw / 2, qz = PZ + 0.006;
  skin(box(tw - 0.03, 1.66, 0.016, INOX, qx, 1.47, qz));
  const ihmCv = document.createElement('canvas'); ihmCv.width = 400; ihmCv.height = 240;
  const ihmTex = new THREE.CanvasTexture(ihmCv); ihmTex.colorSpace = THREE.SRGBColorSpace;
  box(0.24, 0.16, 0.02, GRAF, qx, 1.52, qz + 0.012, fixed, false);
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.12), new THREE.MeshBasicMaterial({ map: ihmTex, toneMapped: false })); tela.position.set(qx, 1.52, qz + 0.0225); fixed.add(tela);
  parts.ihm = { cv: ihmCv, ctx: ihmCv.getContext('2d'), tex: ihmTex };
  const btn = (mat, x, y) => { const b = cyl(0.016, 0.02, mat, x, y, qz + 0.02, fixed, 20); b.rotation.x = Math.PI / 2; return b; };
  btn(M.botaoVerde, qx - 0.07, 1.30); btn(PRETO, qx, 1.30); btn(M.botaoAzul, qx + 0.07, 1.30);
  const emBase = box(0.08, 0.08, 0.01, M.amarelo, qx, 1.17, qz + 0.012, fixed, false);
  const emg = cyl(0.026, 0.03, M.vermelho, qx, 1.17, qz + 0.03, fixed, 24); emg.rotation.x = Math.PI / 2;
  box(0.06, 0.04, 0.012, M.amarelo, qx + 0.08, 1.80, qz + 0.012, fixed, false);
  // logotipo e placa do modelo
  const logo = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#e9eef2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d4f9a'; g.font = 'bold 150px Arial'; g.fillText('CMR', 40, 170); g.fillStyle = '#d0292c'; g.fillRect(380, 120, 70, 20);
    g.fillStyle = '#22313f'; g.font = 'bold 64px Arial'; g.fillText(`DINAMIZADORA · REV20 ${N}G`, 470, 120); g.font = '44px Arial'; g.fillText(`${N} × 10 L · GL80 · ${tres ? 'acesso frontal' : 'frente e trás'}`, 470, 190); });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.16), new THREE.MeshStandardMaterial({ map: logo, roughness: 0.4 })); placa.position.set(-PX * 0.25, 2.12, PZ + 0.008); fixed.add(placa);
  if (!tres) { const p2 = placa.clone(); p2.position.z = -PZ - 0.008; p2.rotation.y = Math.PI; fixed.add(p2); }
  // torre de sinalização
  const torre = new THREE.Group(); torre.position.set(TX - 0.12, 2.33, PZ - 0.12); fixed.add(torre);
  cyl(0.012, 0.12, ALU, 0, 0.06, 0, torre, 12);
  const tcol = { verde: 0x23c552, amarelo: 0xffc21a, vermelho: 0xe8261b }; parts.torre = {};
  Object.entries(tcol).forEach(([k, c], i) => { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.0, roughness: 0.3, transparent: true, opacity: 0.85 }); const o = cyl(0.03, 0.05, m, 0, 0.15 + (2 - i) * 0.052, 0, torre, 20); parts.torre[k] = m; });

  // ---------------------------------------------------------------- estado / animação
  const st = { doorsF: 0, doorsT: 0, xray: 0, shake: 0, crank: 0, valves: {} };
  parts.state = st;
  for (const B of parts.bottles) { B.seatSt = 1; B.capSt = 1; B.uniaoSt = 1; B.clampSt = 1; B.levelSt = 0; B.tint = 0; B.pipSt = 0; B.sensor = 0; }
  parts.rebuildHoses();
  const _v = new THREE.Vector3();
  parts.apply = () => {
    // portas (giram ~100° para fora)
    for (const d of parts.doors) { const u = d.s > 0 ? st.doorsF : st.doorsT; const e = u * u * (3 - 2 * u); d.hinge.rotation.y = d.side * d.s * 1.75 * e; }
    // sucussão: posição do carro pela manivela
    const th = st.crank;
    carro.position.y = st.shake * SHAKE_R * Math.cos(th);
    crankG.rotation.x = th;
    const pinW = pino.getWorldPosition(new THREE.Vector3()); fixed.worldToLocal(pinW);
    const top = new THREE.Vector3(0.03, 0.655 + carro.position.y, 0);
    const mid = pinW.clone().add(top).multiplyScalar(0.5); biela.position.copy(mid); biela.position.x = 0.03;
    biela.scale.y = pinW.distanceTo(top); biela.rotation.x = Math.atan2(top.z - pinW.z, top.y - pinW.y);
    for (const h of parts.gas) h.position.y = 0.55 + carro.position.y * 0.5;
    // garrafões
    let hosesDirty = false;
    for (const B of parts.bottles) {
      const s = B.seatSt, e = s * s * (3 - 2 * s);
      B.gb.position.set(B.x, Yb + (1 - e) * 0.11, B.z + (1 - Math.min(1, s * 1.6)) * B.lado * 0.55);
      B.gb.visible = s > 0.001;
      const c = B.capSt; B.tampa.position.y = 0.352 + (1 - c) * 0.09; B.anel.rotation.y = (1 - c) * Math.PI * 3; B.tampa.visible = c > 0.001 || s < 0.999;
      B.uniaoTops.forEach((u) => { u.g.position.y = 0.021 + (1 - B.uniaoSt) * 0.03; u.g.rotation.y = (1 - B.uniaoSt) * 2.4; });
      const cl = B.clampSt; B.garra.haste.position.y = B.garra.yYokeTop(cl) + 0.016;
      B.garra.sensores[0].material = cl > 0.98 ? parts.ledOn || (parts.ledOn = new THREE.MeshBasicMaterial({ color: 0x35ff6a })) : M.amarelo;
      B.sol.scale.y = Math.max(0.0001, B.levelSt * GARRAFAO.nivel - 0.002); B.sol.position.y = 0.008 + B.sol.scale.y / 2;
      B.solMat.color.setHex(0xcfe6f0).lerp(new THREE.Color(0xe0b25a), 0.45 * B.tint);
      if (B.lid) B.lid.rotation.x = -1.9 * B.pipSt * B.sideZ;
      if (B.led) B.led.material.color.setHex(B.sensor ? 0x3dff6e : 0x2b3b2b);
      const key = `${B.uniaoSt > 0.5 ? 1 : 0}${B.seatSt > 0.98 ? 1 : 0}`; if (B._hk !== key) { B._hk = key; hosesDirty = true; }
    }
    if (hosesDirty) parts.rebuildHoses();
    for (const v of parts.valves) v.led.material.color.setHex(st.valves[v.tipo] ? 0x35ff6a : 0x334033);
    // raio-X: carenagem e portas transparentes
    for (const m of parts.skinMats) { const op = (m.userData.op0 ?? 1) * (1 - 0.85 * st.xray); m.opacity = op; m.transparent = m.userData.tr0 || st.xray > 0.01; m.depthWrite = st.xray < 0.5 && !m.userData.tr0; m.needsUpdate = m._x !== (st.xray > 0.01); m._x = st.xray > 0.01; }
  };
  parts.drawIHM = (linha1, linha2, cor = '#2fbf71') => {
    const key = linha1 + '|' + linha2 + '|' + parts.bottles.map((b) => (b.levelSt * 20 | 0) + (b.tint > 0.5 ? 'a' : 'b')).join(''); const now = performance.now();
    if (key === parts._ihmKey || now - (parts._ihmT || 0) < 150) return; parts._ihmKey = key; parts._ihmT = now;
    const g = parts.ihm.ctx; g.fillStyle = '#0b1622'; g.fillRect(0, 0, 400, 240); g.fillStyle = '#12304a'; g.fillRect(0, 0, 400, 36);
    g.fillStyle = '#fff'; g.font = 'bold 20px system-ui'; g.fillText(`CMR ${nome} · REV20 ${N}×10 L`, 10, 25);
    g.fillStyle = cor; g.font = 'bold 26px system-ui'; g.fillText(linha1, 12, 80);
    g.fillStyle = '#cfe0ee'; g.font = '17px system-ui'; String(linha2 || '').split('\n').forEach((l, i) => g.fillText(l, 12, 115 + i * 24));
    for (let i = 0; i < N; i++) { const B = parts.bottles[i]; g.strokeStyle = '#6fa8dc'; g.strokeRect(14 + i * 64, 168, 50, 60); const h = 58 * B.levelSt * 0.7; g.fillStyle = B.tint > 0.5 ? '#e0b25a' : '#3d8bfd'; g.fillRect(15 + i * 64, 227 - h, 48, h); g.fillStyle = '#fff'; g.font = '13px system-ui'; g.fillText(`G${i + 1}`, 30 + i * 64, 162); }
    parts.ihm.tex.needsUpdate = true;
  };
  parts.drawIHM('PRONTA', 'Garrafões fixados · tampas GL80\nconectadas');
  parts.apply();
  return parts;
}
