# REV16 (versão sala): máquina carenada REV15 otimizada p/ cena com 4 unidades
# - ativo por INJEÇÃO MANUAL (estação com 6 funis na lateral esquerda) — sem peristáltica
# - portas não abrem no ciclo; IHM e torre controladas pela página (JS)
# - remove tudo que fica escondido dentro da carenagem e junta malhas estáticas
import bpy, sys, math, os, json
sys.path.insert(0, '/home/claude/rev15')
from lib import *
from mathutils import Vector, Matrix

bpy.ops.wm.open_mainfile(filepath='/home/claude/rev15/CMR_REV15.blend')
OBS = bpy.data.objects
ROOT = OBS['CMR_REV15_MAQUINA_COMPLETA']
ROOT.name = 'CMR_REV16_MAQUINA'


def kill(o):
    for c in list(o.children_recursive):
        bpy.data.objects.remove(c, do_unlink=True)
    bpy.data.objects.remove(o, do_unlink=True)


# ---------- 1) animações que saem (portas, retirada do garrafão, telas, torre)
for o in list(OBS):
    if o.name.startswith('PORTA_') or o.name.startswith('GARRAFAO_G') or o.name.startswith('IHM tela') or o.name.startswith('Torre '):
        if o.animation_data: o.animation_data_clear()
        o.rotation_euler = (0, 0, 0) if o.name.startswith('PORTA_') else o.rotation_euler
        if o.name.startswith('IHM tela') or (o.name.startswith('Torre ') and o.name.endswith('aceso')):
            o.scale = (1, 1, 1)
for i in range(1, 9):
    kill(OBS[f'IHM tela {i}'])
OBS['IHM tela 0'].name = 'IHM_TELA'
OBS['IHM tela 0 img'].name = 'IHM_TELA_IMG'
for nm in ('verde', 'amarelo', 'vermelho'):
    OBS[f'Torre {nm} aceso'].name = f'TORRE_{nm.upper()}'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()


# ---------- 2) remove o que fica escondido
def wbox(o):
    if o.type != 'MESH' or not o.data.vertices: return None
    mw = o.matrix_world
    import numpy as np
    co = [mw @ v.co for v in o.data.vertices]
    xs = [c.x for c in co]; ys = [c.y for c in co]; zs = [c.z for c in co]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def hidden(b):
    x0, x1, y0, y1, z0, z1 = b
    inside_y = y0 > -0.584 and y1 < 0.584
    if not inside_y: return False
    if x0 > -0.70 and x1 < 1.049 and z0 > 0.10 and z1 < 0.676: return True           # compartimento inferior
    if x0 > -0.70 and x1 < 1.049 and z0 > 2.236 and z1 < 2.598: return True           # compartimento superior
    if x0 > 0.692 and x1 < 1.049 and z0 > 0.10 and z1 < 2.598: return True            # lateral técnica e quadro
    return False


rm = 0
for o in list(OBS):
    if o.name not in OBS or o.type != 'MESH': continue
    b = wbox(o)
    if b and hidden(b) and not o.children:
        bpy.data.objects.remove(o, do_unlink=True); rm += 1
# empties vazios
for _ in range(4):
    for o in list(OBS):
        if o.type == 'EMPTY' and not o.children and not (o.animation_data and o.animation_data.action) and o.name not in ('IHM_TELA',):
            bpy.data.objects.remove(o, do_unlink=True)
print('removidos (escondidos):', rm)

# ---------- 3) estação de injeção manual do ativo (lateral esquerda, junto à frente)
G_INJ = empty('13_ESTACAO_INJECAO_MANUAL_ATIVO', parent=ROOT)
INOXS = bpy.data.materials['Inox 316L usinado']
INOXE = bpy.data.materials['Inox 304 escovado (carenagem)']
PRETOM = bpy.data.materials['Preto polimero']
PTFE = mat('PTFE branco', (0.93, 0.93, 0.91), 0.0, 0.35)
VERDEB = mat('Botao verde INJ', (0.05, 0.65, 0.15), 0.0, 0.3, emit=(0.02, 0.35, 0.06))
AMARB = bpy.data.materials.get('Amarelo seguranca') or mat('Amarelo seguranca 2', (0.95, 0.75, 0.05), 0.0, 0.5)
X0, X1 = -0.84, -0.703         # sai 137 mm da lateral
Y0, Y1 = -0.44, -0.06
ZB, ZT_ = 0.97, 1.05           # tampo inclinado ~1,05 m (altura de trabalho)
cbox('Estacao injecao - chapa de fixacao na lateral', -0.712, -0.703, Y0 - 0.01, Y1 + 0.01, ZB - 0.16, ZT_ + 0.10, INOXE, G_INJ, 0.003)
cbox('Estacao injecao - corpo', X0, X1, Y0, Y1, ZB, ZT_, INOXE, G_INJ, 0.004)
cbox('Estacao injecao - tampo', X0 - 0.01, X1, Y0 - 0.01, Y1 + 0.01, ZT_, ZT_ + 0.008, INOXS, G_INJ, 0.002)
cbox('Estacao injecao - mao francesa', -0.76, X1, -0.27, -0.25, ZB - 0.12, ZB, INOXE, G_INJ, 0.002)
PORTS = []
for k in range(6):
    yk = Y0 + 0.045 + k * 0.058
    xk = -0.785
    lathe(f'Funil injecao P{k+1}', [(0.0045, ZT_ + 0.008), (0.006, ZT_ + 0.012), (0.016, ZT_ + 0.034), (0.018, ZT_ + 0.036),
                                   (0.0165, ZT_ + 0.036), (0.0145, ZT_ + 0.034), (0.0045, ZT_ + 0.014), (0.0035, ZT_ + 0.008)],
          (xk, yk, 0), PTFE, G_INJ, seg=24)
    torus(f'Anel funil P{k+1}', 0.0175, 0.0015, (xk, yk, ZT_ + 0.0355), 'Z', INOXS, G_INJ, seg=24, mseg=6)
    # tampa articulada aberta (para trás)
    text(f'Etiqueta P{k+1}', f'P{k+1}', (xk - 0.032, yk, ZT_ + 0.0085), 0.012, PRETOM, G_INJ, rot=(0, 0, -math.pi / 2))
    PORTS.append((xk, yk, ZT_ + 0.036))
cyl('Botao ATIVO OK aro', 0.017, ZT_ + 0.008, ZT_ + 0.014, (-0.80, Y1 - 0.0), 'Z', INOXS, G_INJ, seg=24)
BTN_INJ = (-0.80, Y1 + 0.0, ZT_ + 0.024)
cyl('Botao ATIVO OK (verde)', 0.012, ZT_ + 0.014, ZT_ + 0.024, (-0.80, Y1), 'Z', VERDEB, G_INJ, seg=24)
cbox('Placa estacao injecao', X0 - 0.002, X0, Y0 + 0.02, Y1 - 0.02, ZB + 0.012, ZT_ - 0.008, AMARB, G_INJ, 0.001)
text('Texto estacao injecao', 'INJECAO MANUAL DO ATIVO', (X0 - 0.0025, (Y0 + Y1) / 2, ZB + 0.043), 0.014, PRETOM, G_INJ, rot=(math.pi / 2, 0, -math.pi / 2))
text('Texto estacao injecao 2', 'P1-P3 FRENTE  P4-P6 TRAS   ATIVO OK >', (X0 - 0.0025, (Y0 + Y1) / 2, ZB + 0.022), 0.009, PRETOM, G_INJ, rot=(math.pi / 2, 0, -math.pi / 2))
# linhas PTFE internas (visíveis só na saída)
for (xk, yk, _) in PORTS:
    cyl(f'Linha PTFE saida funil {yk:.2f}', 0.003, ZB - 0.02, ZB, (xk, yk), 'Z', PTFE, G_INJ, seg=8)
cbox('Calha de protecao linhas PTFE', -0.80, X1, Y0 + 0.02, Y1 - 0.02, ZB - 0.035, ZB, INOXE, G_INJ, 0.002)

# ---------- 4) conexões de teto (alimentação de solução base e saída de produto p/ tanque de passagem)
AZUL = bpy.data.materials['Linha BASE azul']
VERDE = bpy.data.materials['Linha DRENO verde']
STUBS = {'BASE': (0.86, 0.22), 'PRODUTO': (0.86, 0.42)}
for nm, (sx, sy) in STUBS.items():
    cyl(f'Conexao teto {nm} tubo', 0.0127, 2.63, 2.80, (sx, sy), 'Z', INOXS, ROOT, seg=20)
    cyl(f'Conexao teto {nm} clamp', 0.025, 2.80, 2.815, (sx, sy), 'Z', INOXS, ROOT, seg=24)
    cyl(f'Conexao teto {nm} anel cor', 0.0135, 2.70, 2.74, (sx, sy), 'Z', AZUL if nm == 'BASE' else VERDE, ROOT, seg=20)
    cyl(f'Conexao teto {nm} flange', 0.03, 2.63, 2.636, (sx, sy), 'Z', INOXS, ROOT, seg=24)

# ---------- 5) UV do inox escovado e conversão de textos
def uv_box(o, sc=2.5):
    me = o.data
    if not me.uv_layers: me.uv_layers.new()
    uv = me.uv_layers.active.data
    for p in me.polygons:
        n = p.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][ax]
            uv[li].uv = (u * sc, v * sc)
for o in OBS:
    if o.type == 'MESH' and any(m == INOXE for m in o.data.materials):
        uv_box(o)
for o in OBS:
    if o.type == 'MESH':
        for m in o.data.materials:
            pass
        if not o.data.uv_layers: o.data.uv_layers.new()
        while len(o.data.uv_layers) > 1:
            o.data.uv_layers.remove(o.data.uv_layers[-1] if o.data.uv_layers[-1] != o.data.uv_layers.active else o.data.uv_layers[0])
        o.data.uv_layers[0].name = 'UVMap'

# ---------- 6) junta malhas estáticas com o mesmo pai
from collections import defaultdict
grp = defaultdict(list)
def anc_of(o):
    p = o.parent
    while p is not None and p != ROOT:
        if p.animation_data and p.animation_data.action: return p
        p = p.parent
    return ROOT
for o in list(OBS):
    if o.type != 'MESH' or o.children: continue
    if o.animation_data and o.animation_data.action: continue
    a = anc_of(o)
    if o.parent != a:
        mw = o.matrix_world.copy(); o.parent = a; o.matrix_world = mw
    grp[a.name].append(o)
nj = 0
for pn, lst in grp.items():
    if len(lst) < 2: continue
    # malhas transparentes separadas das opacas (ordem de desenho)
    def key(o): return any(m and m.blend_method != 'OPAQUE' for m in o.data.materials) if o.data.materials else False
    for tr in (False, True):
        sub = [o for o in lst if key(o) == tr and o.name not in ('IHM_TELA_IMG',)]
        if len(sub) < 2: continue
        for o in OBS: o.select_set(False)
        for o in sub: o.select_set(True)
        bpy.context.view_layer.objects.active = sub[0]
        bpy.ops.object.join()
        sub[0].name = f'{pn[:40]} (unido{" transp" if tr else ""})'
        nj += len(sub) - 1
print('unidos:', nj, 'objetos restantes:', len(OBS), 'malhas:', sum(1 for o in OBS if o.type == 'MESH'))

# rodas do carro ficam atrás das tampas do carro na versão carenada
for o in list(OBS):
    if o.type == 'MESH' and o.name.startswith('Roda '):
        bpy.data.objects.remove(o, do_unlink=True)
# ---------- 7) exporta
for o in OBS: o.select_set(False)
path = '/home/claude/sala/out/CMR_REV16_maquina_sala.glb'
print('malhas finais', sum(1 for o in OBS if o.type == 'MESH'))
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_animations=True,
                          export_animation_mode='SCENE', export_frame_range=True,
                          export_force_sampling=True, export_optimize_animation_size=True,
                          export_apply=False, export_yup=True, export_materials='EXPORT')
import json as js, struct
f = open(path, 'rb').read(); l = struct.unpack('<I', f[12:16])[0]
j = js.loads(f[20:20 + l]); rest = f[20 + l:]
ch, sp = [], []
for a in j.get('animations', []):
    o = len(sp); sp += a['samplers']
    for c in a['channels']:
        c = dict(c); c['sampler'] += o; ch.append(c)
j['animations'] = [{'name': 'CICLO_MAQUINA', 'channels': ch, 'samplers': sp}]
s = js.dumps(j, separators=(',', ':')).encode(); s += b' ' * ((4 - len(s) % 4) % 4)
body = struct.pack('<I', len(s)) + b'JSON' + s + rest
open(path, 'wb').write(b'glTF' + struct.pack('<I', 2) + struct.pack('<I', 12 + len(body)) + body)
json.dump({'ports': PORTS, 'btn_inj': BTN_INJ, 'stubs': STUBS, 'ihm': (0.875, -0.6265, 1.50), 'btn_iniciar': (0.79, -0.622, 1.30)},
          open('/home/claude/sala/out/maquina_pontos.json', 'w'))
bpy.ops.wm.save_as_mainfile(filepath='/home/claude/sala/out/CMR_REV16_maquina_sala.blend')
print('OK', os.path.getsize(path))
