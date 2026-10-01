// Materiais das dinamizadoras REV20/REV21 (mesmos valores PBR da REV17, sem precisar baixar o GLB da REV17)
import * as THREE from 'three';
export function materiaisMaquina() {
  const L = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
  const std = (name, c, metal, rough, extra = {}) => { const m = new THREE.MeshStandardMaterial({ color: L(...c), metalness: metal, roughness: rough, side: THREE.DoubleSide, ...extra }); m.name = name; return m; };
  const tx = new THREE.TextureLoader().load('assets/inox_escovado.jpg'); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 8;
  const inox = new THREE.MeshStandardMaterial({ map: tx, metalness: 0.85, roughness: 0.36, side: THREE.DoubleSide }); inox.name = 'Inox 304 escovado (carenagem)';
  return {
    inox,
    inox316: std('Inox 316L usinado', [0.5, 0.51, 0.53], 0.92, 0.24),
    pc: std('Policarbonato fume', [0.30, 0.34, 0.36], 0, 0.05, { transparent: true, opacity: 0.32, depthWrite: false }),
    grafite: std('Pintura grafite RAL 7016', [0.045, 0.055, 0.062], 0.2, 0.45),
    ptfe: std('PTFE branco', [0.95, 0.95, 0.95], 0, 0.5),
    epdm: std('Borracha EPDM', [0.02, 0.02, 0.02], 0, 0.8),
    preto: std('Preto polimero', [0.025, 0.025, 0.03], 0, 0.6),
    cromo: std('Eixos retificados cromados', [0.79, 0.83, 0.86], 0.94, 0.16),
    aluminio: std('Aluminio anodizado', [0.55, 0.57, 0.60], 0.85, 0.30),
    amarelo: std('Amarelo seguranca', [0.95, 0.75, 0.02], 0, 0.4),
    ferro: std('Ferro fundido pintado grafite', [0.095, 0.13, 0.15], 0.35, 0.48),
    mangProc: std('Mangueira PROCESSO', [0.10, 0.40, 0.70], 0, 0.35),
    mangResp: std('Linha RESPIRO lilas', [0.5, 0.4, 0.75], 0, 0.4),
    garfo: std('Sensor garfo PBT cinza', [0.16, 0.17, 0.19], 0, 0.45),
    botaoVerde: std('Botao verde', [0.02, 0.55, 0.12], 0, 0.35),
    botaoAzul: std('Botao azul', [0.02, 0.20, 0.70], 0, 0.35),
    vermelho: std('Vermelho emergencia', [0.8, 0.03, 0.02], 0, 0.35),
  };
}
