# REV17 (versão sala) — ativo por pipetagem direta no bocal de cada cabeçote, com sensor de garfo
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
ROOT.name = 'CMR_REV17_MAQUINA'


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

# ---------- 3) ativo por PIPETAGEM MANUAL direto no bocal de cada cabeçote (REV17)
# remove todo o sistema de ativo automático (peristáltica, tanque, mangueiras, capilares, gotas)
KILL = ('Capilar ativo', 'Tubo ATIVO saida cabecote', 'Mangueira ATIVO', 'Cassete peristaltica', 'Entrada peristaltica',
        'Coletor ativo', 'Celula de carga tanque ativo', 'Etiqueta peristaltica', 'Tanque ativo', 'Visor nivel tanque ativo')
for nm in [o.name for o in OBS if o.name.startswith(KILL) or ' gota ativo' in o.name]:
    if nm in OBS: kill(OBS[nm])
INOXS = bpy.data.materials['Inox 316L usinado']
INOXE = bpy.data.materials['Inox 304 escovado (carenagem)']
PRETOM = bpy.data.materials['Preto polimero']
PTFE = mat('PTFE branco', (0.93, 0.93, 0.91), 0.0, 0.35)
SENS = mat('Sensor garfo PBT cinza', (0.16, 0.17, 0.19), 0.0, 0.45)
LEDA = mat('LED sensor ambar', (1.0, 0.55, 0.05), 0.0, 0.3, emit=(1.0, 0.45, 0.02))
LEDV = mat('LED sensor verde', (0.1, 1.0, 0.25), 0.0, 0.3, emit=(0.1, 1.0, 0.25))
bpy.context.scene.frame_set(0); bpy.context.view_layer.update()
PORTS = {}
for k in range(6):
    side = 'FRENTE' if k < 3 else 'TRASEIRA'
    xg = (-0.42, 0.0, 0.42)[k % 3]
    E = OBS[f'CABECOTE_{side}_x{xg}']
    cx, cy = E.matrix_world.translation.x, E.matrix_world.translation.y
    sg = -1 if side == 'FRENTE' else 1              # lado da porta (operadora)
    px, py = cx + 0.018, cy
    ZT = 1.810                                      # topo do cabeçote (em repouso)
    G = empty(f'BOCAL_PIPETAGEM_P{k+1}', (px, py, ZT), E)
    # canal Ø8 pelo cabeçote até dentro do garrafão + bocal cônico (funil curto) de PTFE com anel inox
    cyl(f'P{k+1} canal pipetagem 316L', 0.004, 1.70, ZT + 0.004, (px, py), 'Z', INOXS, G, seg=16)
    lathe(f'P{k+1} bocal de pipetagem PTFE', [(0.0045, ZT), (0.0075, ZT), (0.0075, ZT + 0.030), (0.0125, ZT + 0.050), (0.0135, ZT + 0.052),
                                             (0.0120, ZT + 0.052), (0.0105, ZT + 0.050), (0.0045, ZT + 0.032)], (px, py, 0), PTFE, G, seg=28)
    torus(f'P{k+1} anel bocal', 0.0132, 0.0014, (px, py, ZT + 0.0515), 'Z', INOXS, G, seg=24, mseg=6)
    # tampa articulada (dobradiça do lado oposto à porta) — a página abre/fecha
    hy = py - sg * 0.0145
    H = empty(f'TAMPA_BOCAL_P{k+1}', (px, hy, ZT + 0.054), G)
    cyl(f'P{k+1} tampa bocal', 0.0145, ZT + 0.053, ZT + 0.058, (px, py), 'Z', PTFE, H, seg=24)
    cbox(f'P{k+1} aba tampa', px - 0.005, px + 0.005, *sorted((py + sg * 0.012, py + sg * 0.022)), ZT + 0.053, ZT + 0.057, PTFE, H, 0.001)
    cyl(f'P{k+1} dobradica', 0.0025, px - 0.006, px + 0.006, (hy, ZT + 0.054), 'X', INOXS, G, seg=10)
    # sensor óptico de garfo (fibra) abraçando o pescoço do bocal: detecta a passagem da ponteira
    zs0, zs1 = ZT + 0.018, ZT + 0.030
    ya, yb = sorted((py - sg * 0.012, py + sg * 0.010))
    cbox(f'P{k+1} sensor garfo braco A', px - 0.019, px - 0.0105, ya, yb, zs0, zs1, SENS, G, 0.001)
    cbox(f'P{k+1} sensor garfo braco B', px + 0.0105, px + 0.019, ya, yb, zs0, zs1, SENS, G, 0.001)
    yc0, yc1 = sorted((py - sg * 0.012, py - sg * 0.024))
    cbox(f'P{k+1} sensor garfo corpo', px - 0.019, px + 0.019, yc0, yc1, zs0 - 0.004, zs1 + 0.002, SENS, G, 0.0015)
    ly = py - sg * 0.024
    sphere(f'P{k+1} LED sensor ambar', 0.0022, (px - 0.008, ly, zs1 + 0.002), LEDA, G)
    L = empty(f'LED_OK_P{k+1}', (px + 0.008, ly, zs1 + 0.002), G)
    sphere(f'P{k+1} LED OK verde', 0.0024, (px + 0.008, ly, zs1 + 0.002), LEDV, L)
    L.scale = (0.001, 0.001, 0.001)
    cyl(f'P{k+1} cabo fibra sensor', 0.002, *sorted((ly, ly - sg * 0.05)), (px, zs0 + 0.004), 'Y', PRETOM, G, seg=8)
    # identificação P1..P6 na face do cabeçote voltada para a porta
    text(f'Etiqueta bocal P{k+1}', f'P{k+1}', (cx - 0.012, cy + sg * 0.0295, 1.772), 0.013, PRETOM, E,
         rot=(math.pi / 2, 0, 0 if sg < 0 else math.pi))
    PORTS[f'P{k+1}'] = dict(x=px, y=py, z_top_rest=ZT + 0.052, side=side)
print('bocais de pipetagem:', len(PORTS))

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
        if (p.animation_data and p.animation_data.action) or p.name.startswith(('PORTA_', 'TAMPA_BOCAL', 'LED_OK')): return p
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
path = '/home/claude/sala/out/CMR_REV17_maquina_sala.glb'
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
json.dump({'ports': PORTS, 'stubs': STUBS, 'door_open_rad': 1.75, 'ihm': (0.875, -0.6265, 1.50), 'btn_iniciar': (0.79, -0.622, 1.30)},
          open('/home/claude/sala/out/maquina_pontos.json', 'w'))
bpy.ops.wm.save_as_mainfile(filepath='/home/claude/sala/out/CMR_REV17_maquina_sala.blend')
print('OK', os.path.getsize(path))
