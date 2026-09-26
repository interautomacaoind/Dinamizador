# Sala de dinamização 10 x 10 m (REV17), pé-direito 4,5 m
import bpy, math, sys, os
sys.path.insert(0, '/home/claude/rev15'); sys.path.insert(0, '/home/claude/sala')
from lib import mat, empty, box, cyl, cbox, boxes, lathe, pipe, text, torus, sphere, bake, ramp
from layout import *
from mathutils import Vector, Matrix
import numpy as np

T = '/home/claude/sala/tex/'


def tmat(name, img, rough, metal=0.0, alpha=False, emit=False, tint=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(T + img)
    nt.links.new(tx.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if alpha:
        nt.links.new(tx.outputs['Alpha'], b.inputs['Alpha']); m.blend_method = 'BLEND'
    if emit:
        nt.links.new(tx.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 1.0
    m['uvscale'] = 1.0
    return m


def plane(name, cx, cy, cz, w, h, normal, m, parent=None, uv=True):
    """retângulo w x h centrado, virado para 'normal' ('+x','-x','+y','-y','+z','-z'); UV 0..1 (u à direita de quem olha)"""
    me = bpy.data.meshes.new(name)
    hw, hh = w / 2, h / 2
    if normal == '-y':   V = [(-hw, 0, -hh), (hw, 0, -hh), (hw, 0, hh), (-hw, 0, hh)]
    elif normal == '+y': V = [(hw, 0, -hh), (-hw, 0, -hh), (-hw, 0, hh), (hw, 0, hh)]
    elif normal == '+x': V = [(0, -hw, -hh), (0, hw, -hh), (0, hw, hh), (0, -hw, hh)]
    elif normal == '-x': V = [(0, hw, -hh), (0, -hw, -hh), (0, -hw, hh), (0, hw, hh)]
    elif normal == '+z': V = [(-hw, -hh, 0), (hw, -hh, 0), (hw, hh, 0), (-hw, hh, 0)]
    else:                V = [(-hw, hh, 0), (hw, hh, 0), (hw, -hh, 0), (-hw, -hh, 0)]
    me.from_pydata([(cx + a, cy + b, cz + c) for a, b, c in V], [], [(0, 1, 2, 3)])
    ul = me.uv_layers.new(); ul.data.foreach_set('uv', [0, 0, 1, 0, 1, 1, 0, 1])
    me.materials.append(m)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if parent: o.parent = parent
    return o


def tube(name, pts, r, m, parent=None, bend=0.15):
    """tubo com curvas raio 'bend'"""
    P = [np.array(p, float) for p in pts]
    out = [P[0]]
    for k in range(1, len(P) - 1):
        a, b, c = P[k - 1], P[k], P[k + 1]
        ra = min(bend, np.linalg.norm(b - a) / 2); rc = min(bend, np.linalg.norm(c - b) / 2)
        p0 = b + (a - b) / np.linalg.norm(a - b) * ra; p2 = b + (c - b) / np.linalg.norm(c - b) * rc
        for u in np.linspace(0, 1, 7):
            out.append((1 - u) ** 2 * p0 + 2 * (1 - u) * u * b + u * u * p2)
    out.append(P[-1])
    return pipe(name, [tuple(p) for p in out], r, m, parent)


def build_room():
    G = empty('SALA_DINAMIZACAO')
    # ------------------------------------------------ materiais
    EPOXI = tmat('Piso epoxi cinza', 'epoxi_cinza.png', 0.30); EPOXI['uvscale'] = 0.25
    PAREDE = tmat('Parede painel branco', 'parede.png', 0.55); PAREDE['uvscale'] = 0.4
    TETO = mat('Forro branco', (0.80, 0.81, 0.80), 0.0, 0.8)
    JUNTA = mat('Junta de painel', (0.55, 0.57, 0.58), 0.2, 0.5)
    MARM = tmat('Marmore branco', 'marmore.png', 0.14); MARM['uvscale'] = 0.45
    INOX = tmat('Inox 304 escovado', 'inox_escovado.png', 0.34, 0.85); INOX['uvscale'] = 2.5
    INOXP = mat('Inox polido tubulacao', (0.62, 0.63, 0.65), 1.0, 0.16)
    ALU = mat('Aluminio luminaria', (0.75, 0.76, 0.78), 0.8, 0.35)
    LED = mat('Difusor LED', (1.0, 1.0, 1.0), 0.0, 0.5, emit=(1.0, 0.98, 0.94))
    LED.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 6.0
    PRETO = mat('Preto fosco', (0.02, 0.02, 0.022), 0.0, 0.6)
    TELA = mat('TV tela', (0.01, 0.01, 0.012), 0.0, 0.2, emit=(0.02, 0.03, 0.05))
    BRANCO = mat('Laminado branco', (0.86, 0.87, 0.86), 0.0, 0.45)
    VIDRO = mat('Vidro', (0.75, 0.82, 0.85), 0.0, 0.03, alpha=0.18)
    AMBAR = mat('Vidro ambar frasco', (0.35, 0.12, 0.02), 0.0, 0.06, alpha=0.8)
    TAMPA = mat('Tampa preta frasco', (0.03, 0.03, 0.03), 0.0, 0.4)
    AZUL = mat('Faixa azul', (0.05, 0.30, 0.75), 0.0, 0.4)
    VERDE = mat('Faixa verde', (0.03, 0.50, 0.22), 0.0, 0.4)
    AMAR = mat('Faixa amarela piso', (0.95, 0.72, 0.05), 0.0, 0.5)
    VERM = mat('Vermelho', (0.80, 0.05, 0.03), 0.1, 0.4)
    BTNV = mat('Botao verde', (0.05, 0.60, 0.15), 0.0, 0.3)
    MOTOR = mat('Motor azul', (0.02, 0.18, 0.45), 0.3, 0.45)
    SOMB = tmat('Sombra contato', 'sombra.png', 1.0, alpha=True)
    SOMB.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0, 0, 0, 1)
    SOMB.node_tree.links.clear()
    tx = [n for n in SOMB.node_tree.nodes if n.type == 'TEX_IMAGE'][0]
    SOMB.node_tree.links.new(tx.outputs['Alpha'], SOMB.node_tree.nodes['Principled BSDF'].inputs['Alpha'])
    SOMB.node_tree.links.new(SOMB.node_tree.nodes['Principled BSDF'].outputs[0], SOMB.node_tree.nodes['Material Output'].inputs[0])
    SOMBR = tmat('Sombra contato redonda', 'sombra_red.png', 1.0, alpha=True)
    SOMBR.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0, 0, 0, 1)
    for l in list(SOMBR.node_tree.links):
        if l.to_socket.name == 'Base Color': SOMBR.node_tree.links.remove(l)
    for l in list(SOMB.node_tree.links):
        if l.to_socket.name == 'Base Color': SOMB.node_tree.links.remove(l)

    def sign(name, img, cx, cy, cz, w, h, normal, parent=G, emit=False):
        m = tmat('Placa ' + name, img, 0.5, emit=emit)
        return plane('Placa ' + name, cx, cy, cz, w, h, normal, m, parent)

    # ------------------------------------------------ piso, paredes, forro
    box('Piso epoxi', -RX, RX, -RY, RY, -0.05, 0.0, EPOXI, G)
    W = 0.12
    box('Parede esquerda', -RX - W, -RX, -RY - W, RY + W, 0, RH, PAREDE, G)
    box('Parede direita', RX, RX + W, -RY - W, RY + W, 0, RH, PAREDE, G)
    box('Parede fundo', -RX, RX, RY, RY + W, 0, RH, PAREDE, G)
    box('Parede frente A', -RX, DOOR['x0'], -RY - W, -RY, 0, RH, PAREDE, G)
    box('Parede frente B', DOOR['x1'], RX, -RY - W, -RY, 0, RH, PAREDE, G)
    box('Parede frente sobre porta', DOOR['x0'], DOOR['x1'], -RY - W, -RY, DOOR['h'], RH, PAREDE, G)
    box('Forro', -RX, RX, -RY, RY, RH, RH + 0.05, TETO, G)
    # juntas de painel (verticais) e rodapé sanitário (meia-cana em epóxi)
    for y in np.arange(-RY + 1.2, RY, 1.2):
        for sx in (-1, 1):
            box(f'Junta parede {sx} {y:.1f}', sx * RX - 0.002 if sx > 0 else -RX, sx * RX if sx > 0 else -RX + 0.002, y - 0.003, y + 0.003, 0.10, RH, JUNTA, G)
    for x in np.arange(-RX + 1.2, RX, 1.2):
        box(f'Junta fundo {x:.1f}', x - 0.003, x + 0.003, RY - 0.002, RY, 0.10, RH, JUNTA, G)
        if not (DOOR['x0'] - 0.1 < x < DOOR['x1'] + 0.1):
            box(f'Junta frente {x:.1f}', x - 0.003, x + 0.003, -RY, -RY + 0.002, 0.10, RH, JUNTA, G)
    for (x0, x1, y0, y1) in [(-RX, -RX + 0.10, -RY, RY), (RX - 0.10, RX, -RY, RY), (-RX, RX, RY - 0.10, RY),
                             (-RX, DOOR['x0'], -RY, -RY + 0.10), (DOOR['x1'], RX, -RY, -RY + 0.10)]:
        cbox(f'Rodape sanitario {x0:.1f} {y0:.1f}', x0, x1, y0, y1, 0.0, 0.10, EPOXI, G, 0.045)
    # juntas do forro (grade 1,2 m)
    for x in np.arange(-RX + 1.25, RX, 1.25):
        box(f'Junta forro x {x:.2f}', x - 0.006, x + 0.006, -RY, RY, RH - 0.004, RH, ALU, G)
    for y in np.arange(-RY + 1.25, RY, 1.25):
        box(f'Junta forro y {y:.2f}', -RX, RX, y - 0.006, y + 0.006, RH - 0.004, RH, ALU, G)
    # ------------------------------------------------ luminárias LED de sobrepor (hermética p/ sala limpa)
    for x in (-2.5, 0.0, 2.5):
        for y in (-3.75, -1.25, 1.25, 3.75):
            cbox(f'Luminaria {x} {y} corpo', x - 0.62, x + 0.62, y - 0.32, y + 0.32, RH - 0.07, RH, ALU, G, 0.01)
            box(f'Luminaria {x} {y} difusor', x - 0.585, x + 0.585, y - 0.285, y + 0.285, RH - 0.075, RH - 0.07, LED, G)
    # difusores de ar
    for (x, y) in [(-1.25, -2.5), (1.25, -2.5), (-1.25, 2.5), (1.25, 2.5)]:
        for k in range(4):
            s = 0.30 - k * 0.065
            cbox(f'Difusor ar {x} {y} anel {k}', x - s, x + s, y - s, y + s, RH - 0.02 - k * 0.012, RH - k * 0.012, BRANCO, G, 0.004)
    # grelhas de retorno baixas
    for y in (-3.6, 0.0, 3.6):
        for sx in (-1, 1):
            xx = sx * RX
            cbox(f'Grelha retorno {sx} {y}', xx - 0.02 if sx > 0 else xx, xx if sx > 0 else xx + 0.02, y - 0.3, y + 0.3, 0.25, 0.55, BRANCO, G, 0.004)
            for k in range(6):
                box(f'Grelha aleta {sx} {y} {k}', xx - 0.025 if sx > 0 else xx + 0.02, xx - 0.02 if sx > 0 else xx + 0.025, y - 0.28, y + 0.28, 0.27 + k * 0.045, 0.285 + k * 0.045, PRETO, G)
    # ------------------------------------------------ faixas amarelas de demarcação no piso
    def faixa(x0, x1, y0, y1, w=0.05):
        for (a0, a1, b0, b1) in [(x0, x1, y0, y0 + w), (x0, x1, y1 - w, y1), (x0, x0 + w, y0, y1), (x1 - w, x1, y0, y1)]:
            box(f'Faixa piso {a0:.2f} {b0:.2f}', a0, a1, b0, b1, 0.0, 0.0015, AMAR, G)
    for m in MACH:
        cs = [to_world(m, (a, b)) for a in (MB[0] - 0.25, MB[1] + 0.25) for b in (MB[2] - 0.25, MB[3] + 0.35)]
        xs = [c[0] for c in cs]; ys = [c[1] for c in cs]
        faixa(min(xs), max(xs), min(ys), max(ys))
    faixa(-0.9, 0.9, -0.95, 0.9)
    # ------------------------------------------------ porta de entrada (1 folha, abre para dentro)
    X0, X1 = DOOR['x0'], DOOR['x1']; HD = DOOR['h']
    boxes('Batente porta inox', [(X0 - 0.05, X0, -RY - 0.13, -RY + 0.01, 0, HD + 0.05), (X1, X1 + 0.05, -RY - 0.13, -RY + 0.01, 0, HD + 0.05),
                                 (X0 - 0.05, X1 + 0.05, -RY - 0.13, -RY + 0.01, HD, HD + 0.05)], INOX, G)
    PORTA = empty('PORTA_ENTRADA', (X1 - 0.01, -RY + 0.01, 0), G)
    LW = (X1 - X0) - 0.03
    def pl(x0, x1, y0, y1, z0, z1): return (X1 - 0.01 - x1, X1 - 0.01 - x0, y0, y1, z0, z1)
    cbox('Porta folha', *pl(0.0, LW, -RY - 0.045, -RY + 0.0, 0.01, HD - 0.01), BRANCO, PORTA, 0.004)
    box('Porta visor vidro', *pl(LW * 0.30, LW * 0.70, -RY - 0.05, -RY + 0.005, 1.25, 1.85), VIDRO, PORTA)
    boxes('Porta visor moldura', [pl(LW * 0.28, LW * 0.72, -RY - 0.05, -RY + 0.006, 1.23, 1.25), pl(LW * 0.28, LW * 0.72, -RY - 0.05, -RY + 0.006, 1.85, 1.87),
                                   pl(LW * 0.28, LW * 0.30, -RY - 0.05, -RY + 0.006, 1.23, 1.87), pl(LW * 0.70, LW * 0.72, -RY - 0.05, -RY + 0.006, 1.23, 1.87)], INOX, PORTA)
    box('Porta chapa de chute', *pl(0.02, LW - 0.02, -RY + 0.0, -RY + 0.002, 0.02, 0.30), INOX, PORTA)
    for sy in (-1, 1):
        yy = -RY + 0.03 if sy > 0 else -RY - 0.075
        cyl(f'Porta macaneta {sy}', 0.011, X0 + 0.12, X0 + 0.26, (yy, 1.05), 'X', INOXP, PORTA, seg=12)
        cyl(f'Porta roseta {sy}', 0.028, *sorted((-RY + (0.002 if sy > 0 else -0.047), -RY + (0.012 if sy > 0 else -0.057))), (X0 + 0.26, 1.05), 'Y', INOXP, PORTA, seg=20)
    cbox('Mola aerea porta', X1 - 0.45, X1 - 0.05, -RY + 0.0, -RY + 0.06, HD - 0.08, HD - 0.02, ALU, G, 0.005)
    # antecâmara (fora da sala)
    box('Piso antecamara', X0 - 1.2, X1 + 0.7, -RY - 2.2, -RY - 0.12, -0.05, 0.0, EPOXI, G)
    box('Parede antecamara E', X0 - 1.3, X0 - 1.2, -RY - 2.2, -RY - 0.12, 0, 3.0, PAREDE, G)
    box('Parede antecamara D', X1 + 0.7, X1 + 0.8, -RY - 2.2, -RY - 0.12, 0, 3.0, PAREDE, G)
    box('Parede antecamara fundo', X0 - 1.3, X1 + 0.8, -RY - 2.3, -RY - 2.2, 0, 3.0, PAREDE, G)
    box('Forro antecamara', X0 - 1.3, X1 + 0.8, -RY - 2.3, -RY - 0.12, 3.0, 3.05, TETO, G)
    box('Luminaria antecamara', X0 - 0.2, X1 + 0.2, -RY - 1.4, -RY - 1.1, 2.97, 3.0, LED, G)
    sign('sala', 'placa_sala.png', (X0 + X1) / 2, -RY - 0.125, 2.55, 0.9, 0.26, '-y')
    sign('saida', 'placa_saida.png', (X0 + X1) / 2, -RY + 0.004, 2.45, 0.42, 0.155, '+y', emit=True)
    sign('epi', 'placa_epi.png', X0 - 0.55, -RY + 0.004, 1.55, 0.45, 0.60, '+y')
    # extintor e álcool gel
    cyl('Extintor corpo', 0.085, 0.12, 0.72, (X1 + 0.45, -RY + 0.12), 'Z', VERM, G, seg=24)
    sphere('Extintor topo', 0.085, (X1 + 0.45, -RY + 0.12, 0.72), VERM, G)
    cyl('Extintor valvula', 0.02, 0.78, 0.86, (X1 + 0.45, -RY + 0.12), 'Z', PRETO, G, seg=12)
    cbox('Suporte extintor', X1 + 0.3, X1 + 0.6, -RY + 0.0, -RY + 0.02, 0.08, 0.18, VERM, G, 0.005)
    cbox('Dispenser alcool gel', X0 - 0.25, X0 - 0.10, -RY + 0.0, -RY + 0.10, 1.20, 1.45, BRANCO, G, 0.01)
    # ------------------------------------------------ bancadas de mármore
    def bancada(nm, b, sinks=()):
        x0, x1, y0, y1, zt = b['x0'], b['x1'], b['y0'], b['y1'], b['z']
        wall_y = y0 if abs(y0 + RY) < 1e-3 else y1
        fy = y1 if wall_y == y0 else y0          # borda frontal
        s = 1 if fy > wall_y else -1
        # tampo de mármore (com recortes para as cubas)
        cuts = sorted(sinks)
        xs = [x0] + sum([[c - 0.26, c + 0.26] for c in cuts], []) + [x1]
        for i in range(0, len(xs), 2):
            cbox(f'{nm} tampo marmore {i}', xs[i], xs[i + 1], y0, y1, zt - 0.03, zt, MARM, G, 0.003)
        for c in cuts:
            yb0, yb1 = sorted((wall_y + s * 0.10, wall_y + s * 0.13))
            yf0, yf1 = sorted((fy - s * 0.12, fy))
            cbox(f'{nm} tampo marmore atras cuba {c}', c - 0.26, c + 0.26, *sorted((wall_y, wall_y + s * 0.13)), zt - 0.03, zt, MARM, G, 0.003)
            cbox(f'{nm} tampo marmore frente cuba {c}', c - 0.26, c + 0.26, yf0, yf1, zt - 0.03, zt, MARM, G, 0.003)
            ya, yb = sorted((wall_y + s * 0.13, fy - s * 0.12))
            boxes(f'{nm} cuba inox {c}', [(c - 0.26, c + 0.26, ya, yb, zt - 0.25, zt - 0.24), (c - 0.26, c - 0.25, ya, yb, zt - 0.25, zt - 0.01),
                                          (c + 0.25, c + 0.26, ya, yb, zt - 0.25, zt - 0.01), (c - 0.26, c + 0.26, ya, ya + 0.01, zt - 0.25, zt - 0.01),
                                          (c - 0.26, c + 0.26, yb - 0.01, yb, zt - 0.25, zt - 0.01)], INOX, G)
            cyl(f'{nm} ralo {c}', 0.03, zt - 0.242, zt - 0.238, (c, (ya + yb) / 2), 'Z', INOXP, G, seg=20)
        cbox(f'{nm} rodabanca marmore', x0, x1, *sorted((wall_y, wall_y + s * 0.02)), zt, zt + 0.10, MARM, G, 0.002)
        # estrutura / armários
        for xx in np.linspace(x0 + 0.05, x1 - 0.05, int((x1 - x0) / 1.0) + 2):
            box(f'{nm} pe {xx:.2f}', xx - 0.02, xx + 0.02, *sorted((fy - s * 0.06, fy - s * 0.10)), 0.10, zt - 0.03, INOX, G)
        cbox(f'{nm} armario', x0 + 0.02, x1 - 0.02, *sorted((wall_y + s * 0.02, fy - s * 0.08)), 0.10, zt - 0.05, BRANCO, G, 0.004)
        for xx in np.arange(x0 + 0.02, x1 - 0.1, 0.5):
            box(f'{nm} porta junta {xx:.2f}', xx - 0.002, xx + 0.002, *sorted((fy - s * 0.08, fy - s * 0.083)), 0.12, zt - 0.07, JUNTA, G)
            cyl(f'{nm} puxador {xx:.2f}', 0.006, zt - 0.20, zt - 0.10, (xx + 0.05, fy - s * 0.10), 'Z', INOXP, G, seg=8)
        box(f'{nm} rodape', x0 + 0.02, x1 - 0.02, *sorted((fy - s * 0.07, fy - s * 0.08)), 0.0, 0.10, PRETO, G)
        return wall_y, fy, s

    # bancada 1 – torneiras (fundo, sob a TV)
    bt = BENCH_TORNEIRAS
    wy, fy, s = bancada('Bancada torneiras', bt, sinks=(-0.95, 0.95))
    TAPS = []
    for c in (-0.95, 0.95):
        yb = wy + s * 0.07
        cyl(f'Torneira {c} coluna', 0.013, bt['z'], bt['z'] + 0.32, (c, yb), 'Z', INOXP, G, seg=16)
        tube(f'Torneira {c} bica', [(c, yb, bt['z'] + 0.30), (c, yb, bt['z'] + 0.42), (c, yb + s * 0.20, bt['z'] + 0.42), (c, yb + s * 0.20, bt['z'] + 0.30)], 0.009, INOXP, G, bend=0.06)
        cyl(f'Torneira {c} arejador', 0.011, bt['z'] + 0.28, bt['z'] + 0.30, (c, yb + s * 0.20), 'Z', INOXP, G, seg=16)
        cbox(f'Torneira {c} alavanca', c + 0.01, c + 0.13, yb - 0.01, yb + 0.01, bt['z'] + 0.22, bt['z'] + 0.235, INOXP, G, 0.004)
        cyl(f'Torneira {c} valvula', 0.022, bt['z'] + 0.18, bt['z'] + 0.25, (c, yb), 'Z', INOXP, G, seg=16)
        cyl(f'Torneira {c} anel azul', 0.0135, bt['z'] + 0.26, bt['z'] + 0.28, (c, yb), 'Z', AZUL, G, seg=16)
        TAPS.append((c, yb))
    sign('torneira', 'placa_torneira.png', 0.0, RY - 0.004, bt['z'] + 0.45, 1.00, 0.25, '-y')
    # alguns béqueres na bancada
    for (x, dy) in [(-1.6, 0.35), (-1.45, 0.35), (1.55, 0.30)]:
        lathe(f'Bequer {x}', [(0.0, bt['z']), (0.035, bt['z']), (0.036, bt['z'] + 0.10), (0.039, bt['z'] + 0.105), (0.033, bt['z'] + 0.10), (0.032, bt['z'] + 0.004), (0.0, bt['z'] + 0.004)], (x, wy + s * dy, 0), VIDRO, G, seg=24)
    # bancada 2 – frascos de ativo (frente, à esquerda)
    bf = BENCH_FRASCOS
    wy2, fy2, s2 = bancada('Bancada frascos', bf)
    zt = bf['z']
    # REV17: frascos de 1 L (30 mL por garrafão) e pipetas sorológicas de 50 mL com pipetador elétrico
    cbox('Caixa luvas', -2.95, -2.72, wy2 + s2 * 0.08, wy2 + s2 * 0.22, zt, zt + 0.09, mat('Caixa luvas', (0.2, 0.45, 0.8), 0.0, 0.6), G, 0.004)
    cbox('Bandeja inox frascos', -2.68, -1.98, wy2 + s2 * 0.12, wy2 + s2 * 0.50, zt, zt + 0.02, INOX, G, 0.004)
    FLASKS = []
    prof = [(0.0, 0.0), (0.048, 0.0), (0.050, 0.006), (0.050, 0.150), (0.042, 0.172), (0.020, 0.190), (0.017, 0.196), (0.017, 0.214), (0.0, 0.214)]
    for i in range(3):
        for j in range(2):
            x = -2.58 + i * 0.12; y = wy2 + s2 * (0.22 + j * 0.16)
            FLASKS.append((x, y))
    FLASK_PICK = (-1.55, wy2 + s2 * 0.40)
    for (x, y) in FLASKS:
        lathe(f'Frasco ambar 1 L {x:.2f} {y:.2f}', prof, (x, y, zt + 0.02), AMBAR, G, seg=24)
        cyl(f'Tampa frasco {x:.2f} {y:.2f}', 0.019, zt + 0.02 + 0.212, zt + 0.02 + 0.240, (x, y), 'Z', TAMPA, G, seg=16)
    ROT = tmat('Rotulo frasco', 'rotulo_frasco.png', 0.6)
    # suporte de pipetas sorológicas 50 mL (embaladas) e base do pipetador
    cbox('Suporte pipetas base', -1.92, -1.70, wy2 + s2 * 0.15, wy2 + s2 * 0.30, zt, zt + 0.03, BRANCO, G, 0.004)
    cbox('Suporte pipetas regua', -1.92, -1.70, wy2 + s2 * 0.20, wy2 + s2 * 0.25, zt + 0.26, zt + 0.28, BRANCO, G, 0.004)
    PLAST = mat('Pipeta sorologica plastico', (0.85, 0.92, 0.96), 0.0, 0.2, alpha=0.6)
    for k in range(5):
        x = -1.89 + k * 0.042
        cyl(f'Pipeta sorologica rack {k}', 0.008, zt + 0.02, zt + 0.44, (x, wy2 + s2 * 0.225), 'Z', PLAST, G, seg=10)
    PIPETTE_PICK = (-1.15, wy2 + s2 * 0.42)
    cbox('Base pipetador', -1.25, -1.05, wy2 + s2 * 0.34, wy2 + s2 * 0.52, zt, zt + 0.02, BRANCO, G, 0.004)
    cbox('Prancheta', -1.02, -0.93, wy2 + s2 * 0.12, wy2 + s2 * 0.40, zt, zt + 0.01, mat('Prancheta', (0.35, 0.22, 0.10), 0.0, 0.6), G, 0.003)
    # lixeira de pedal
    cyl('Lixeira inox', 0.15, 0.0, 0.62, (-3.25, wy2 + s2 * 0.35), 'Z', INOX, G, seg=28)
    cyl('Lixeira tampa', 0.152, 0.62, 0.64, (-3.25, wy2 + s2 * 0.35), 'Z', INOXP, G, seg=28)
    # ------------------------------------------------ mesas de inox
    for k, t in enumerate(TABLES):
        x0, x1, y0, y1 = t['x'] - t['w'] / 2, t['x'] + t['w'] / 2, t['y'] - t['d'] / 2, t['y'] + t['d'] / 2
        cbox(f'Mesa inox {k} tampo', x0, x1, y0, y1, 0.86, 0.90, INOX, G, 0.004)
        cbox(f'Mesa inox {k} prateleira', x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, 0.20, 0.22, INOX, G, 0.003)
        for (xx, yy) in [(x0 + 0.05, y0 + 0.05), (x1 - 0.05, y0 + 0.05), (x0 + 0.05, y1 - 0.05), (x1 - 0.05, y1 - 0.05)]:
            box(f'Mesa inox {k} pe {xx:.1f} {yy:.1f}', xx - 0.02, xx + 0.02, yy - 0.02, yy + 0.02, 0.03, 0.86, INOX, G)
            cyl(f'Mesa inox {k} sapata {xx:.1f} {yy:.1f}', 0.022, 0.0, 0.03, (xx, yy), 'Z', PRETO, G, seg=12)
    # ------------------------------------------------ tanque de passagem TQ-01 (250 L)
    tx_, ty_ = TANK['x'], TANK['y']; R = TANK['r']
    prof = [(0.0, 0.52), (0.035, 0.52), (0.035, 0.56), (R * 0.25, 0.60), (R, 0.80), (R, 1.50), (R * 0.93, 1.56), (R * 0.70, 1.605), (R * 0.40, 1.625), (0.0, 1.63)]
    lathe('Tanque TQ-01 corpo inox 316L', prof, (tx_, ty_, 0), INOX, G, seg=48)
    for zz in (0.80, 1.50):
        torus(f'Tanque cordao solda {zz}', R, 0.004, (tx_, ty_, zz), 'Z', INOXP, G, seg=48, mseg=6)
    for k in range(3):
        a = math.radians(90 + 120 * k)
        lx, ly = tx_ + (R + 0.035) * math.cos(a), ty_ + (R + 0.035) * math.sin(a)
        cyl(f'Tanque perna {k}', 0.025, 0.05, 1.0, (lx, ly), 'Z', INOX, G, seg=16)
        cbox(f'Tanque chapa solda perna {k}', lx - 0.04, lx + 0.04, ly - 0.04, ly + 0.04, 0.95, 1.10, INOX, G, 0.004)
        cyl(f'Tanque celula de carga {k}', 0.045, 0.0, 0.05, (lx, ly), 'Z', PRETO, G, seg=16)
    cyl('Tanque boca de visita', 0.17, 1.62, 1.66, (tx_ - 0.12, ty_), 'Z', INOXP, G, seg=32)
    cbox('Tanque manopla boca', tx_ - 0.2, tx_ - 0.04, ty_ - 0.015, ty_ + 0.015, 1.66, 1.68, INOXP, G, 0.004)
    cyl('Tanque filtro respiro', 0.035, 1.60, 1.80, (tx_ + 0.12, ty_ + 0.22), 'Z', BRANCO, G, seg=16)
    cyl('Tanque sensor nivel radar', 0.04, 1.60, 1.72, (tx_ + 0.20, ty_ - 0.18), 'Z', PRETO, G, seg=16)
    # visor de nível (tubo de vidro) com líquido animado
    ang = math.radians(-60)
    vx, vy = tx_ + (R + 0.07) * math.cos(ang), ty_ + (R + 0.07) * math.sin(ang)
    for zz in (0.84, 1.46):
        tube(f'Visor nivel conexao {zz}', [(tx_ + R * math.cos(ang), ty_ + R * math.sin(ang), zz), (vx, vy, zz)], 0.008, INOXP, G)
        cyl(f'Visor nivel valvula {zz}', 0.016, zz - 0.02, zz + 0.02, (vx, vy), 'Z', INOXP, G, seg=12)
    cyl('Visor nivel vidro', 0.013, 0.86, 1.44, (vx, vy), 'Z', VIDRO, G, seg=16)
    NIV = empty('TANQUE_NIVEL', (vx, vy, 0.86), G)
    cyl('Visor nivel produto', 0.010, 0.86, 1.44, (vx, vy), 'Z', mat('Produto no visor', (0.55, 0.75, 0.92), 0.0, 0.1, alpha=0.75), NIV, seg=12)
    NIV.scale = (1, 1, 0.001)
    sign('tanque', 'placa_tanque.png', tx_, ty_ - R - 0.004, 1.20, 0.40, 0.19, '-y')
    # saída inferior, válvula, bomba de transferência
    px, py = PUMP['x'], PUMP['y']
    tube('Saida tanque -> bomba', [(tx_, ty_, 0.52), (tx_, ty_, 0.30), (px + 0.20, py, 0.30), (px + 0.14, py, 0.30)], 0.019, INOXP, G)
    cyl('Valvula borboleta saida', 0.035, 0.36, 0.40, (tx_, ty_), 'Z', INOXP, G, seg=20)
    cbox('Valvula borboleta manopla', tx_ - 0.01, tx_ + 0.16, ty_ - 0.012, ty_ + 0.012, 0.38, 0.39, VERM, G, 0.004)
    cbox('Bomba base', px - 0.28, px + 0.22, py - 0.14, py + 0.14, 0.05, 0.08, INOX, G, 0.004)
    for (xx, yy) in [(px - 0.25, py - 0.11), (px + 0.19, py - 0.11), (px - 0.25, py + 0.11), (px + 0.19, py + 0.11)]:
        cyl(f'Bomba pe {xx:.2f} {yy:.2f}', 0.015, 0.0, 0.05, (xx, yy), 'Z', INOX, G, seg=12)
    cyl('Bomba motor 1,1 kW', 0.085, px - 0.27, px - 0.02, (py, 0.20), 'X', MOTOR, G, seg=24)
    for k in range(10):
        a = 2 * math.pi * k / 10
        box(f'Bomba aleta motor {k}', px - 0.26, px - 0.05, py + 0.09 * math.cos(a) - 0.004, py + 0.09 * math.cos(a) + 0.004, 0.20 + 0.09 * math.sin(a) - 0.004, 0.20 + 0.09 * math.sin(a) + 0.004, MOTOR, G)
    cyl('Bomba lanterna', 0.05, px - 0.02, px + 0.06, (py, 0.20), 'X', INOX, G, seg=20)
    cyl('Bomba voluta sanitaria', 0.11, px + 0.06, px + 0.14, (py, 0.20), 'X', INOXP, G, seg=32)
    tube('Recalque bomba -> sala de tanques', [(px + 0.10, py, 0.31), (px + 0.10, py, 3.90), (px + 0.10, RY - 0.05, 3.90), (px + 0.10, RY + 0.2, 3.90)], 0.019, INOXP, G, bend=0.2)
    for zz in (1.5, 3.0):
        cyl(f'Recalque faixa verde {zz}', 0.0205, zz, zz + 0.12, (px + 0.10, py), 'Z', VERDE, G, seg=16)
    sign('transf', 'placa_transf.png', -1.75, RY - 0.004, 3.95, 0.63, 0.20, '-y')
    # pedestal do botão de transferência
    qx, qy = PANEL['x'], PANEL['y']
    box('Pedestal comando', qx - 0.03, qx + 0.03, qy - 0.03, qy + 0.03, 0.0, 1.02, INOX, G)
    cbox('Pedestal base', qx - 0.14, qx + 0.14, qy - 0.14, qy + 0.14, 0.0, 0.01, INOX, G, 0.004)
    cbox('Caixa comando transferencia', qx - 0.16, qx + 0.16, qy - 0.07, qy + 0.07, 1.02, 1.38, INOX, G, 0.01)
    # face voltada para -y (corredor frontal)
    fyq = qy - 0.07
    plane('PAINEL_TQ_TELA', qx, fyq - 0.002, 1.30, 0.20, 0.08, '-y', mat('Painel TQ tela', (0.02, 0.03, 0.04), 0.0, 0.3, emit=(0.02, 0.05, 0.08)), G)
    cyl('Botao TRANSFERIR aro', 0.022, fyq - 0.010, fyq, (qx - 0.07, 1.16), 'Y', INOXP, G, seg=20)
    LAMP = empty('LAMPADA_TRANSF', (qx - 0.07, fyq - 0.016, 1.16), G)
    cyl('Botao TRANSFERIR', 0.016, fyq - 0.022, fyq - 0.008, (qx - 0.07, 1.16), 'Y', BTNV, G, seg=20)
    cyl('Botao TRANSFERIR aceso', 0.0165, fyq - 0.0225, fyq - 0.0075, (qx - 0.07, 1.16), 'Y', mat('Luz verde botao', (0.2, 1.0, 0.3), 0.0, 0.3, emit=(0.2, 1.0, 0.3)), LAMP, seg=20)
    LAMP.scale = (0.001, 0.001, 0.001)
    cyl('Botao PARAR aro', 0.022, fyq - 0.010, fyq, (qx + 0.0, 1.16), 'Y', INOXP, G, seg=20)
    cyl('Botao PARAR', 0.016, fyq - 0.020, fyq - 0.008, (qx + 0.0, 1.16), 'Y', PRETO, G, seg=20)
    cyl('Emergencia painel base', 0.03, fyq - 0.006, fyq, (qx + 0.085, 1.16), 'Y', AMAR, G, seg=20)
    lathe('Emergencia painel cogumelo', [(0.0, -0.035), (0.016, -0.034), (0.02, -0.028), (0.02, -0.02), (0.0, -0.02)], (qx + 0.085, fyq, 1.16), VERM, G, seg=24, axis='Y')
    text('Texto TRANSFERIR', 'TRANSFERIR', (qx - 0.07, fyq - 0.001, 1.195), 0.013, PRETO, G, rot=(math.pi / 2, 0, 0))
    text('Texto PARAR', 'PARAR', (qx, fyq - 0.001, 1.195), 0.013, PRETO, G, rot=(math.pi / 2, 0, 0))
    text('Texto TQ01', 'TQ-01 -> SALA DE TANQUES', (qx, fyq - 0.001, 1.235), 0.014, PRETO, G, rot=(math.pi / 2, 0, 0))
    BTN_TRANSF = (qx - 0.07, fyq - 0.022, 1.16)
    # ------------------------------------------------ tubulações aéreas
    ZB_, ZP_, ZM_ = 3.55, 3.25, 3.55
    # alimentação de solução base (entra pela parede do fundo)
    ZMm = 4.12
    tube('Solucao base - entrada parede', [(2.2, RY + 0.2, ZMm), (2.2, RY - 0.30, ZMm)], 0.0165, INOXP, G)
    tube('Solucao base - principal', [(-3.52, RY - 0.30, ZMm), (3.52, RY - 0.30, ZMm)], 0.0165, INOXP, G)
    for sx in (-1, 1):
        tube(f'Solucao base - subida canto {sx}', [(sx * 3.52, RY - 0.30, ZMm), (sx * 3.52, RY - 0.30, ZM_)], 0.0165, INOXP, G)
    for sx in (-1, 1):
        ys = [MP[m[0]]['stubs']['BASE'][1] for m in MACH if (m[1] > 0) == (sx > 0)]
        tube(f'Solucao base - ramal {sx}', [(sx * 3.52, RY - 0.30, ZM_), (sx * 3.52, min(ys) - 0.02, ZM_)], 0.0165, INOXP, G)
        for m in MACH:
            if (m[1] > 0) != (sx > 0): continue
            sxy = MP[m[0]]['stubs']['BASE']
            tube(f'Descida base {m[0]}', [(sxy[0], sxy[1], ZM_), (sxy[0], sxy[1], 2.815)], 0.0127, INOXP, G)
            cyl(f'Valvula base {m[0]}', 0.025, 3.05, 3.12, (sxy[0], sxy[1]), 'Z', INOXP, G, seg=16)
            cbox(f'Valvula base atuador {m[0]}', sxy[0] - 0.03, sxy[0] + 0.03, sxy[1] - 0.03, sxy[1] + 0.03, 3.12, 3.20, AZUL, G, 0.005)
        for yy in np.arange(-3.0, RY - 0.5, 2.0):
            cyl(f'Faixa azul base {sx} {yy:.1f}', 0.0175, yy, yy + 0.15, (sx * 3.52, ZM_), 'Y', AZUL, G, seg=16)
    for xx in (-2.6, 2.6):
        cyl(f'Faixa azul principal {xx}', 0.0175, xx, xx + 0.15, (RY - 0.30, ZMm), 'X', AZUL, G, seg=16)
    # ramais para as torneiras (descem pela parede do fundo)
    for (c, yb) in TAPS:
        xd = 1.55 if c > 0 else -1.55
        tube(f'Ramal torneira {c}', [(xd, RY - 0.30, ZMm), (xd, RY - 0.05, ZMm - 0.3), (xd, RY - 0.05, bt['z'] + 0.14), (c, RY - 0.05, bt['z'] + 0.14), (c, yb, bt['z'] + 0.14), (c, yb, bt['z'] + 0.18)], 0.0105, INOXP, G, bend=0.08)
        cyl(f'Faixa azul ramal {c}', 0.0115, 1.9, 2.05, (xd, RY - 0.05), 'Z', AZUL, G, seg=12)
    sign('base', 'placa_base.png', 2.6, RY - 0.004, ZMm - 0.24, 0.72, 0.176, '-y')
    # produto: máquinas -> tanque de passagem (por cima)
    for sx in (-1, 1):
        ms = [m for m in MACH if (m[1] > 0) == (sx > 0)]
        ys = [MP[m[0]]['stubs']['PRODUTO'][1] for m in ms]
        xh = sx * 3.72
        tube(f'Produto - coletor {sx}', [(xh, min(ys) - 0.02, ZP_), (xh, max(ys) + 0.02, ZP_)], 0.0165, INOXP, G)
        for m in ms:
            sxy = MP[m[0]]['stubs']['PRODUTO']
            tube(f'Subida produto {m[0]}', [(sxy[0], sxy[1], 2.815), (sxy[0], sxy[1], ZP_)], 0.0127, INOXP, G)
            cyl(f'Faixa verde subida {m[0]}', 0.0137, 2.95, 3.05, (sxy[0], sxy[1]), 'Z', VERDE, G, seg=12)
        tube(f'Produto -> TQ-01 {sx}', [(xh, 0.0, ZP_), (sx * 0.24, 0.0, ZP_), (sx * 0.24, 0.0, 1.60)], 0.0165, INOXP, G, bend=0.2)
        for xx in np.arange(0.8, 3.3, 1.2):
            cyl(f'Faixa verde prod {sx} {xx:.1f}', 0.0175, sx * xx, sx * xx + 0.15, (0.0, ZP_), 'X', VERDE, G, seg=16)
        sign(f'prod {sx}', 'placa_prod.png', sx * 1.8, 0.022, ZP_ - 0.16, 0.42, 0.13, '-y')
    # suportes (tirantes) das linhas
    def tirante(x, y, z):
        cyl(f'Tirante {x:.2f} {y:.2f}', 0.005, z + 0.02, RH, (x, y), 'Z', INOXP, G, seg=8)
        torus(f'Abracadeira {x:.2f} {y:.2f} {z:.2f}', 0.022, 0.004, (x, y, z), 'X' if abs(x) > 3 else 'Y', INOXP, G, seg=16, mseg=4)
    for sx in (-1, 1):
        for yy in np.arange(-3.5, RY - 0.6, 2.0):
            tirante(sx * 3.52, yy, ZM_)
        for yy in (-3.0, 1.0):
            tirante(sx * 3.72, yy, ZP_)
        for xx in (1.2, 2.6):
            tirante(sx * xx, 0.0, ZP_)
    for yy in np.arange(-0.5, RY - 0.5, 2.0):
        tirante(PUMP['x'] + 0.10, yy, 3.90)
    for xx in (-2.8, -1.0, 1.0, 2.8):
        tirante(xx, RY - 0.30, ZMm)
    # ------------------------------------------------ TV de indicadores e relógio
    tvx, tvy, tvz, tvw, tvh = TV['x'], TV['y'], TV['zc'], TV['w'], TV['h']
    cbox('TV moldura', tvx - tvw / 2 - 0.02, tvx + tvw / 2 + 0.02, tvy - 0.05, RY - 0.005, tvz - tvh / 2 - 0.02, tvz + tvh / 2 + 0.02, PRETO, G, 0.008)
    cbox('TV suporte parede', tvx - 0.3, tvx + 0.3, RY - 0.03, RY, tvz - 0.2, tvz + 0.2, PRETO, G, 0.004)
    plane('TV_TELA', tvx, tvy - 0.052, tvz, tvw, tvh, '-y', TELA, G)
    cx, cy, cz, cr = CLOCK['x'], CLOCK['y'], CLOCK['zc'], CLOCK['r']
    torus('Relogio aro', cr, 0.018, (cx, cy + 0.02, cz), 'Y', mat('Relogio aro', (0.12, 0.12, 0.13), 0.6, 0.3), G, seg=48, mseg=8)
    cyl('Relogio fundo', cr, -RY, cy + 0.01, (cx, cz), 'Y', BRANCO, G, seg=48)
    me = bpy.data.meshes.new('RELOGIO_TELA'); n = 48
    V = [(cx, cy + 0.012, cz)] + [(cx - cr * 0.98 * math.cos(2 * math.pi * k / n), cy + 0.012, cz + cr * 0.98 * math.sin(2 * math.pi * k / n)) for k in range(n)]
    F = [(0, k + 1, (k + 1) % n + 1) for k in range(n)]
    me.from_pydata(V, [], F)
    ul = me.uv_layers.new()
    uvs = []
    for f in me.polygons:
        for li in f.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uvs += [0.5 + (cx - v.x) / (2 * cr), 0.5 + (v.z - cz) / (2 * cr)]
    ul.data.foreach_set('uv', uvs)
    me.materials.append(mat('Relogio tela', (0.95, 0.95, 0.95), 0.0, 0.4))
    ob = bpy.data.objects.new('RELOGIO_TELA', me); bpy.context.scene.collection.objects.link(ob); ob.parent = G
    cyl('Relogio vidro', cr * 0.98, cy + 0.02, cy + 0.024, (cx, cz), 'Y', VIDRO, G, seg=48)
    # placas M1..M4 na parede sobre cada máquina
    for k, m in enumerate(MACH):
        n_, x, y, r = m
        xx = RX - 0.004 if x > 0 else -RX + 0.004
        sign(f'm{k+1}', f'placa_m{k+1}.png', xx, y, 3.35, 0.40, 0.24, '-x' if x > 0 else '+x')
    # ------------------------------------------------ sombras de contato
    def blob(name, cx_, cy_, w, h, rotz=0.0, m=SOMB):
        o = plane('Sombra ' + name, 0, 0, 0.003, w, h, '+z', m, G)
        o.location = (cx_, cy_, 0); o.rotation_euler = (0, 0, math.radians(rotz))
        return o
    for m in MACH:
        c = to_world(m, ((MB[0] + MB[1]) / 2, 0))
        blob(m[0], c[0], c[1], 2.3, 1.7, m[3])
    for k, t in enumerate(TABLES):
        blob(f'mesa {k}', t['x'], t['y'], t['w'] + 0.5, t['d'] + 0.5)
    for b in (BENCH_FRASCOS, BENCH_TORNEIRAS):
        blob(f'bancada {b["x0"]}', (b['x0'] + b['x1']) / 2, (b['y0'] + b['y1']) / 2, b['x1'] - b['x0'] + 0.4, (b['y1'] - b['y0']) + 0.5)
    blob('tanque', tx_, ty_, 1.6, 1.6, m=SOMBR)
    blob('bomba', px, py, 0.9, 0.6)
    return dict(G=G, PORTA=PORTA, NIV=NIV, LAMP=LAMP, FLASK_PICK=FLASK_PICK, PIPETTE_PICK=PIPETTE_PICK,
                BTN_TRANSF=BTN_TRANSF, BENCH_Z=bf['z'], mats=dict(AMBAR=AMBAR, TAMPA=TAMPA, VIDRO=VIDRO, ROT=ROT, INOX=INOX, PRETO=PRETO))


def uv_world(o, sc):
    me = o.data
    if not me.uv_layers: me.uv_layers.new()
    uv = me.uv_layers.active.data
    mw = o.matrix_world
    for p in me.polygons:
        n = (mw.to_3x3() @ p.normal)
        ax = max(range(3), key=lambda i: abs(n[i]))
        for li in p.loop_indices:
            co = mw @ me.vertices[me.loops[li].vertex_index].co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][ax]
            uv[li].uv = (u * sc, v * sc)


def finalize_static(G, keep_names):
    """UV em coordenadas de mundo p/ materiais com textura repetida e junção das malhas estáticas por material"""
    bpy.context.view_layer.update()
    for o in list(G.children_recursive):
        if o.type != 'MESH' or o.name in keep_names: continue
        ms = [m for m in o.data.materials if m]
        if ms and 'uvscale' in ms[0] and ms[0]['uvscale'] != 1.0 and not o.name.startswith('Placa') and not o.name.startswith('Sombra'):
            uv_world(o, ms[0]['uvscale'])
    stat = [o for o in G.children_recursive if o.type == 'MESH' and o.name not in keep_names and o.parent == G]
    from collections import defaultdict
    by = defaultdict(list)
    for o in stat:
        if not o.data.uv_layers: o.data.uv_layers.new()
        key = tuple(sorted(m.name for m in o.data.materials if m))
        by[key].append(o)
    for key, lst in by.items():
        if len(lst) < 2: continue
        for o in bpy.context.scene.objects: o.select_set(False)
        for o in lst: o.select_set(True)
        bpy.context.view_layer.objects.active = lst[0]
        bpy.ops.object.join()
        lst[0].name = 'Sala - ' + key[0][:50]
