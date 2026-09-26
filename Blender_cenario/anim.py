# Cena completa: sala + operadora + supervisor + objetos, animação procedural (IK) assada num único clipe "CENA"
import bpy, sys, json, math, os, time
sys.path.insert(0, '/home/claude/rev15'); sys.path.insert(0, '/home/claude/sala')
import numpy as np
from mathutils import Vector, Matrix, Quaternion, Euler
bpy.ops.wm.read_factory_settings(use_empty=True)
from lib import bake, mat, cyl, lathe, empty, cbox, box, torus
import room, human, timeline
from layout import *

T0 = time.time()
PL = timeline.build()
FPS = 20
SIM = 60
scn = bpy.context.scene; scn.render.fps = FPS
T_END = PL['T_END']
NF = int(T_END * FPS) + 1
FR = lambda f: f / FPS

R = room.build_room()
human.textures()
MHD = human.MHD; TEX = human.TEX
opA, _, V3a = human.build_human('OPERADORA', human.FEMALE, MHD + 'skins/young_caucasian_female/textures/young_lightskinned_female_diffuse.png',
                                TEX + 'jaleco.png', (0.06, 0.13, 0.30), TEX + 'sapato_branco.png', (0.55, 0.70, 0.86), eye='brownlight')
human.add_cap(opA, V3a, 'OPERADORA')
spA, _, V3b = human.build_human('SUPERVISOR', human.MALE, MHD + 'skins/middleage_caucasian_male/textures/middleage_lightskinned_male_diffuse.png',
                                TEX + 'jaleco.png', (0.05, 0.055, 0.06), TEX + 'sapato_preto.png', (0.30, 0.40, 0.55), eye='brown', eyebrow='eyebrow002')
human.add_cap(spA, V3b, 'SUPERVISOR', rgb=(0.35, 0.55, 0.85))
# REV17: sorriso da operadora (unidades de expressão MakeHuman) para a pausa do café
SMILE = human.add_expression('OPERADORA', 'SORRISO', {'mouth-corner-puller': 1.0, 'mouth-upward-retraction': 0.35, 'mouth-part-later': 0.25,
                                                      'eye-left-slit': 0.35, 'eye-right-slit': 0.35, 'eyebrows-left-extern-up': 0.2, 'eyebrows-right-extern-up': 0.2})
print('humanos OK', round(time.time() - T0))

# ------------------------------------------------ objetos de mão
G = R['G']
M_ = R['mats']
prof = [(0.0, 0.0), (0.048, 0.0), (0.050, 0.006), (0.050, 0.150), (0.042, 0.172), (0.020, 0.190), (0.017, 0.196), (0.017, 0.214), (0.0, 0.214)]
def flask_prop(name):
    F = empty(name, (0, 0, 0), G)
    lathe(name + ' vidro ambar 1 L', prof, (0, 0, 0), M_['AMBAR'], F, seg=28)
    cyl(name + ' boca aberta', 0.0175, 0.214, 0.216, (0.0, 0.0), 'Z', M_['TAMPA'], F, seg=16)
    rot_ = cyl(name + ' rotulo', 0.0503, 0.04, 0.13, (0, 0), 'Z', M_['ROT'], F, seg=28)
    _me = rot_.data; _ul = _me.uv_layers.new(); _uv = []
    for _p in _me.polygons:
        for _li in _p.loop_indices:
            _co = _me.vertices[_me.loops[_li].vertex_index].co
            _uv += [(math.atan2(_co.y, _co.x) / (2 * math.pi)) % 1.0, (_co.z - 0.04) / 0.09]
    _ul.data.foreach_set('uv', _uv)
    return F
FRASCO = flask_prop('FRASCO_OPERADORA')
FRASCO2 = flask_prop('FRASCO_OPERADORA_2')
# pipetador elétrico (mão) + pipeta sorológica 50 mL; ponta a 0,42 m da mão (eixo -Z do objeto)
PIPETA = empty('PIPETA_OPERADORA', (0, 0, 0), G)
AZP = mat('Pipetador azul', (0.08, 0.30, 0.72), 0.1, 0.45)
cyl('Pipetador empunhadura', 0.017, -0.045, 0.075, (0, 0), 'Z', AZP, PIPETA, seg=16)
cbox('Pipetador gatilhos', 0.012, 0.030, -0.008, 0.008, -0.02, 0.05, mat('Pipetador gatilho cinza', (0.55, 0.57, 0.6), 0.0, 0.5), PIPETA, 0.003)
cyl('Pipetador bocal', 0.011, -0.075, -0.045, (0, 0), 'Z', mat('Pipetador bocal branco', (0.9, 0.9, 0.9), 0.0, 0.4), PIPETA, seg=14)
VP = mat('Pipeta sorologica 50 mL', (0.86, 0.93, 0.97), 0.0, 0.08, alpha=0.5)
cyl('Pipeta sorologica 50 mL', 0.0078, -0.395, -0.075, (0, 0), 'Z', VP, PIPETA, seg=12)
cyl('Pipeta ponta', 0.0030, -0.42, -0.395, (0, 0), 'Z', VP, PIPETA, seg=8, r2=0.0078)
for k in range(6):
    cyl(f'Pipeta graduacao {k}', 0.0080, -0.36 + k * 0.05, -0.358 + k * 0.05, (0, 0), 'Z', mat('Graduacao preta', (0.05, 0.05, 0.05), 0.0, 0.5), PIPETA, seg=12)
TABLET = empty('TABLET_SUPERVISOR', (0, 0, 0), G)
cbox('Tablet corpo', -0.125, 0.125, -0.085, 0.085, -0.004, 0.004, mat('Tablet grafite', (0.08, 0.08, 0.09), 0.4, 0.4), TABLET, 0.006)
from PIL import Image, ImageDraw, ImageFont
im = Image.new('RGB', (512, 352), (18, 26, 38)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 511, 40], fill=(0, 110, 60)); d.text((12, 8), 'PRODUÇÃO – SALA 01', font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22), fill=(255, 255, 255))
for k, h in enumerate([120, 150, 90, 170, 140, 160]):
    d.rectangle([40 + k * 70, 320 - h, 80 + k * 70, 320], fill=(60, 170, 110) if k % 2 else (60, 130, 220))
im.save(TEX + 'tablet_tela.png')
tm = room.tmat('Tablet tela', 'tablet_tela.png', 0.2, emit=True)
room.plane('Tablet tela img', 0, 0, 0.0045, 0.235, 0.16, '+z', tm, TABLET)

# ------------------------------------------------ dados de repouso dos esqueletos
def rest_info(ao):
    b = ao.data.bones
    I = {}
    I['root'] = Vector(b['root'].head_local)
    for s in 'LR':
        I['ank' + s] = Vector(b[f'lowerleg02.{s}'].tail_local)
        I['knee' + s] = Vector(b[f'lowerleg01.{s}'].head_local)
        I['hip' + s] = Vector(b[f'upperleg01.{s}'].head_local)
        I['sh' + s] = Vector(b[f'upperarm01.{s}'].head_local)
        I['el' + s] = Vector(b[f'lowerarm01.{s}'].head_local)
        I['wr' + s] = Vector(b[f'lowerarm02.{s}'].tail_local)
        I['arm' + s] = (I['el' + s] - I['sh' + s]).length + (I['wr' + s] - I['el' + s]).length
        I['leg' + s] = (I['knee' + s] - I['hip' + s]).length + (I['ank' + s] - I['knee' + s]).length
    I['head_z'] = b['head'].head_local.z
    return I


def signed_angle(u, v, n):
    a = u.angle(v)
    if u.cross(v).dot(n) < 0: a = -a
    return a


def pole_angle(ao, base, ikb, pole_loc):
    bb = ao.data.bones[base]; ib = ao.data.bones[ikb]
    pole_normal = (ib.tail_local - bb.head_local).cross(pole_loc - bb.head_local)
    proj = pole_normal.cross(bb.tail_local - bb.head_local)
    return signed_angle(bb.matrix_local.to_3x3() @ Vector((1, 0, 0)), proj, bb.tail_local - bb.head_local)


def setup_rig(ao, tag):
    I = rest_info(ao)
    E = {}
    for s in 'LR':
        for k in ('pe', 'mao', 'joelho', 'cotovelo'):
            e = bpy.data.objects.new(f'{tag}_alvo_{k}_{s}', None); scn.collection.objects.link(e)
            e.rotation_mode = 'QUATERNION'
            E[k + s] = e
    pb = ao.pose.bones
    for s in 'LR':
        for tw in (f'upperleg02.{s}', f'lowerleg02.{s}', f'upperarm02.{s}', f'lowerarm02.{s}'):
            pb[tw].lock_ik_x = pb[tw].lock_ik_y = pb[tw].lock_ik_z = True
        pb[f'lowerleg01.{s}'].lock_ik_y = True
        pb[f'lowerarm01.{s}'].lock_ik_y = True
        c = pb[f'lowerleg02.{s}'].constraints.new('IK')
        c.target = E['pe' + s]; c.pole_target = E['joelho' + s]; c.chain_count = 4; c.use_stretch = False
        c.pole_angle = pole_angle(ao, f'upperleg01.{s}', f'lowerleg02.{s}', I['knee' + s] + Vector((0, -0.6, 0)))
        c = pb[f'foot.{s}'].constraints.new('COPY_ROTATION')
        c.target = E['pe' + s]; c.target_space = 'WORLD'; c.owner_space = 'WORLD'
        c = pb[f'lowerarm02.{s}'].constraints.new('IK')
        c.target = E['mao' + s]; c.pole_target = E['cotovelo' + s]; c.chain_count = 4; c.use_stretch = False
        sgn = 1 if s == 'L' else -1
        c.pole_angle = pole_angle(ao, f'upperarm01.{s}', f'lowerarm02.{s}', I['el' + s] + Vector((sgn * 0.3, 0.5, -0.3)))
    return I, E


def calib(ao, E, s, kind):
    pb = ao.pose.bones
    sg = 1 if s == 'L' else -1
    if kind == 'arm':
        c = [c for c in pb[f'lowerarm02.{s}'].constraints if c.type == 'IK'][0]
        E['mao' + s].location = (sg * 0.20, -0.30, 1.05)
        E['cotovelo' + s].location = (sg * 0.55, 0.35, 0.85)
        mid_b, pole = f'lowerarm01.{s}', E['cotovelo' + s]
        a_b, c_b = f'upperarm01.{s}', f'lowerarm02.{s}'
    else:
        c = [c for c in pb[f'lowerleg02.{s}'].constraints if c.type == 'IK'][0]
        E['pe' + s].location = (sg * 0.12, 0.25, 0.25)
        E['joelho' + s].location = (sg * 0.1, -0.8, 0.55)
        mid_b, pole = f'lowerleg01.{s}', E['joelho' + s]
        a_b, c_b = f'upperleg01.{s}', f'lowerleg02.{s}'
    best = None
    for deg in range(-180, 180, 5):
        c.pole_angle = math.radians(deg)
        bpy.context.view_layer.update()
        A = pb[a_b].head; C = pb[c_b].tail; Mb = pb[mid_b].head
        axis = (C - A).normalized()
        def perp(p):
            v = p - A; return v - axis * v.dot(axis)
        sc = perp(Mb).normalized().dot(perp(pole.location).normalized()) if perp(Mb).length > 1e-4 else -2
        if best is None or sc > best[0]: best = (sc, deg)
    c.pole_angle = math.radians(best[1])
    return best


RIG = {}
for ao, tag in ((opA, 'OPERADORA'), (spA, 'SUPERVISOR')):
    RIG[tag] = (ao,) + setup_rig(ao, tag)
    for s in 'LR':
        print(tag, s, 'polo braço', calib(ao, RIG[tag][2], s, 'arm'), 'polo perna', calib(ao, RIG[tag][2], s, 'leg'))


# ------------------------------------------------ trilhas (pelve, pés, mãos, olhar)
def smooth01(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


def wrap(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


class Track:
    def __init__(self, A):
        self.m = A['moves']
        for mv in self.m:
            if mv['type'] == 'walk':
                mv['P'] = np.array(mv['pts'])

    def seg(self, t):
        for mv in self.m:
            if mv['t0'] <= t < mv['t1']: return mv
        return self.m[-1] if t >= self.m[-1]['t1'] else self.m[0]

    def pose(self, t):
        mv = self.seg(t)
        if mv['type'] == 'walk':
            T = mv['t1'] - mv['t0']; L = mv['L']; a = timeline.ACC
            v = L / max(T - a, 1e-3); tau = min(max(t - mv['t0'], 0), T)
            if tau < a: s = v * tau * tau / (2 * a); sp = v * tau / a
            elif tau < T - a: s = v * (tau - a / 2); sp = v
            else: s = L - v * (T - tau) ** 2 / (2 * a); sp = v * (T - tau) / a
            P = mv['P']; n = len(P) - 1
            u = min(max(s / L, 0), 1) * n; i = min(int(u), n - 1); w = u - i
            p = P[i] * (1 - w) + P[i + 1] * w
            j = min(i + 12, n); k = max(min(i, n - 1), 0)
            d = P[j] - P[k] if j > k else P[-1] - P[-2]
            return p, math.atan2(d[1], d[0]), sp
        else:
            T = mv['t1'] - mv['t0']; u = smooth01((t - mv['t0']) / min(0.9, max(T, 1e-3)))
            f = mv['f0'] + wrap(mv['f1'] - mv['f0']) * u
            return np.array(mv['pos']), f, 0.0


def simulate(tag, A, I):
    """simula pelve + passos a 60 Hz; devolve amostras por quadro (20 fps) e eventos de passo"""
    tr = Track(A)
    dt = 1.0 / SIM
    n = int(T_END * SIM) + 2
    wf = 0.095
    fo = -(I['ankL'].y - I['root'].y)
    TSW, DS = 0.40, 0.10
    p0, psi0, _ = tr.pose(0)
    psi_s = psi0
    def home(p, psi, s):
        f = np.array([math.cos(psi), math.sin(psi)]); l = np.array([-math.sin(psi), math.cos(psi)])
        return p + l * (s * wf) + f * fo
    feet = {}
    for s, sg in (('L', 1), ('R', -1)):
        feet[s] = dict(pos=home(p0, psi0, sg), yaw=psi0, sw=None, land=-1, sg=sg)
    out = []; steps = []
    prev_p = p0
    for k in range(n):
        t = k * dt
        p, psi, sp = tr.pose(t)
        psi_s = psi_s + wrap(psi - psi_s) * min(1.0, dt * 7.0)
        vel = (p - prev_p) / dt if k else np.zeros(2); prev_p = p
        # dispara passos
        swinging = [s for s in feet if feet[s]['sw'] is not None]
        if not swinging:
            errs = {}
            for s, F in feet.items():
                other = feet['R' if s == 'L' else 'L']
                if t - other['land'] < DS or t - F['land'] < 0.16: continue
                hp = home(p + vel * 0.28, psi_s, F['sg'])
                e = np.linalg.norm(hp - F['pos']); ey = abs(wrap(psi_s - F['yaw']))
                thr = 0.10 if np.linalg.norm(vel) > 0.2 else 0.05
                if e > thr or ey > math.radians(18): errs[s] = e + ey * 0.2
            if errs:
                s = max(errs, key=errs.get)
                F = feet[s]; F['sw'] = dict(t0=t, p0=F['pos'].copy(), y0=F['yaw'])
        for s, F in feet.items():
            if F['sw'] is None: continue
            u = (t - F['sw']['t0']) / TSW
            tl = F['sw']['t0'] + TSW
            pl_, psl, _ = tr.pose(tl)
            vl = vel
            tgt = home(pl_ + vl * 0.28, psl, F['sg'])
            if u >= 1.0:
                F['pos'] = tgt; F['yaw'] = psl; F['sw'] = None; F['land'] = t; F['lift'] = 0.0
                steps.append((round(t, 3), float(tgt[0]), float(tgt[1]), s))
            else:
                w = smooth01(u)
                F['cur'] = F['sw']['p0'] * (1 - w) + tgt * w
                F['cury'] = F['sw']['y0'] + wrap(psl - F['sw']['y0']) * w
                F['lift'] = math.sin(math.pi * u)
        if k % (SIM // FPS) == 0:
            fs = {}
            for s, F in feet.items():
                if F['sw'] is None: fs[s] = (F['pos'].copy(), F['yaw'], 0.0)
                else: fs[s] = (F['cur'].copy(), F['cury'], F['lift'])
            out.append(dict(t=t, p=p.copy(), psi=psi_s, sp=float(np.linalg.norm(vel)), feet=fs))
    return out, steps


def spec_pos(spec, smp, I, s, t, tag):
    p = smp['p']; psi = smp['psi']
    f = np.array([math.cos(psi), math.sin(psi)]); l = np.array([-math.sin(psi), math.cos(psi)])
    sg = 1 if s == 'L' else -1
    kind = spec[0]
    if kind in ('swing', 'rest'):
        opp = smp['feet']['R' if s == 'L' else 'L'][0]
        off = float(np.dot(opp - p, f))
        sw = 0.20 * math.tanh(off / 0.25) if smp['sp'] > 0.15 else 0.03
        lat = abs(I['sh' + s].x) + 0.035
        z = I['sh' + s].z - 0.955 * I['arm' + s] + 0.02 + 0.02 * abs(math.tanh(off / 0.25))
        xy = p + f * (sw + 0.02) + l * (sg * lat)
        return np.array([xy[0], xy[1], z])
    if kind == 'body':
        xy = p + f * spec[1] + l * spec[2]
        return np.array([xy[0], xy[1], spec[3]])
    if kind == 'world':
        return np.array(spec[1:4], float)
    raise ValueError(kind)


def hand_track(A, samples, I, s, tag):
    H = sorted([h for h in A['hands'] if h['side'] == s], key=lambda h: h['t0'])
    out = []; cur = None; t_sw = 0; from_p = None; last = None
    for smp in samples:
        t = smp['t']
        act = None
        for h in H:
            if h['t0'] <= t < h['t1']: act = h
        spec = act['spec'] if act else ['swing']
        key = (id(act) if act else 'swing')
        tgt = spec_pos(spec, smp, I, s, t, tag)
        if key != cur:
            cur = key; t_sw = t; from_p = last if last is not None else tgt
        w = smooth01((t - t_sw) / 0.40)
        pos = from_p * (1 - w) + tgt * w if from_p is not None else tgt
        # suaviza a oscilação
        out.append(pos); last = pos
    return out


def look_track(A, samples, I, tabletpos=None):
    L = A['look']; out = []; cy = cp = 0.0
    for i, smp in enumerate(samples):
        t = smp['t']; act = None
        for l in L:
            if l['t0'] <= t < l['t1']: act = l
        yaw = pitch = 0.0
        if act:
            tg = act['target']
            if tg == ['tablet']: yaw, pitch = 0.0, math.radians(32)
            else:
                d = np.array(tg[:2]) - smp['p']
                yaw = wrap(math.atan2(d[1], d[0]) - smp['psi'])
                yaw = max(min(yaw, math.radians(65)), math.radians(-65))
                hz = I['head_z'] + 0.08
                pitch = -math.atan2(tg[2] - hz, max(np.linalg.norm(d), 0.2))
                pitch = max(min(pitch, math.radians(40)), math.radians(-25))
        cy += (yaw - cy) * min(1, 6.0 / FPS * 1.2); cp += (pitch - cp) * min(1, 6.0 / FPS * 1.2)
        out.append((cy, cp))
    return out


def lean_track(hands, samples, I):
    out = []; cl = 0.0
    for i, smp in enumerate(samples):
        need = 0.0
        f = np.array([math.cos(smp['psi']), math.sin(smp['psi'])])
        for s in 'LR':
            h = hands[s][i]
            fwd = float(np.dot(h[:2] - smp['p'], f))
            dz = I['sh' + s].z - h[2]
            need = max(need, (fwd - 0.34) * 70 + max(dz - 0.22, 0) * 55)
        tgt = math.radians(max(min(need, 30), 0))
        cl += (tgt - cl) * 0.12
        out.append(cl)
    return out


# ------------------------------------------------ gera trilhas e chaves
ANIMDATA = {}
STEPS = {}
for tag, (ao, I, E) in RIG.items():
    A = PL['actors'][tag]
    samples, steps = simulate(tag, A, I)
    STEPS[tag] = steps
    samples = samples[:NF] + [samples[-1]] * max(0, NF - len(samples))
    hands = {s: hand_track(A, samples, I, s, tag) for s in 'LR'}
    look = look_track(A, samples, I)
    lean = lean_track(hands, samples, I)
    ANIMDATA[tag] = (samples, hands, look, lean)
    # objeto armadura: posição e rumo
    xs, ys, zs, rz = [], [], [], []
    for smp in samples:
        lift = max(smp['feet']['L'][2], smp['feet']['R'][2])
        walkf = min(smp['sp'] / 1.2, 1.0)
        xs.append(float(smp['p'][0])); ys.append(float(smp['p'][1]))
        zs.append(-0.010 - 0.028 * walkf + 0.018 * lift * walkf)
        rz.append(smp['psi'] + math.pi / 2)
    for i in range(1, len(rz)):
        while rz[i] - rz[i - 1] > math.pi: rz[i] -= 2 * math.pi
        while rz[i] - rz[i - 1] < -math.pi: rz[i] += 2 * math.pi
    ao.rotation_mode = 'XYZ'
    bake(ao, 'location', 0, xs); bake(ao, 'location', 1, ys); bake(ao, 'location', 2, zs); bake(ao, 'rotation_euler', 2, rz)
    # alvos dos pés
    R0 = {s: ao.data.bones[f'foot.{s}'].matrix_local.to_3x3().to_quaternion() for s in 'LR'}
    for s in 'LR':
        e = E['pe' + s]
        P = [smp['feet'][s] for smp in samples]
        za = I['ank' + s].z
        bake(e, 'location', 0, [float(q[0][0]) for q in P]); bake(e, 'location', 1, [float(q[0][1]) for q in P])
        bake(e, 'location', 2, [za + 0.075 * q[2] for q in P])
        qs = []; prev = None
        for q in P:
            qq = Quaternion((0, 0, 1), q[1] + math.pi / 2) @ Quaternion((1, 0, 0), -0.35 * q[2]) @ R0[s]
            if prev is not None and qq.dot(prev) < 0: qq = -qq
            prev = qq; qs.append(qq)
        for c in range(4): bake(e, 'rotation_quaternion', c, [q[c] for q in qs])
        # mãos
        e = E['mao' + s]
        for c in range(3): bake(e, 'location', c, [float(h[c]) for h in hands[s]])
        # polos
        sg = 1 if s == 'L' else -1
        kn, el = [], []
        for smp in samples:
            f = np.array([math.cos(smp['psi']), math.sin(smp['psi'])]); l = np.array([-math.sin(smp['psi']), math.cos(smp['psi'])])
            a = smp['p'] + f * 0.8 + l * (sg * 0.10); kn.append((a[0], a[1], 0.55))
            b = smp['p'] - f * 0.35 + l * (sg * 0.55); el.append((b[0], b[1], 0.85))
        for c in range(3):
            bake(E['joelho' + s], 'location', c, [v[c] for v in kn])
            bake(E['cotovelo' + s], 'location', c, [v[c] for v in el])
    # olhar (pescoço 40 % + cabeça 60 %) e inclinação do tronco
    pb = ao.pose.bones
    def axis_local(bn, w):
        return (ao.data.bones[bn].matrix_local.to_3x3().inverted() @ Vector(w)).normalized()
    for bn, fr in (('neck02', 0.4), ('head', 0.6)):
        az = axis_local(bn, (0, 0, 1)); ax = axis_local(bn, (1, 0, 0))
        qs = [Quaternion(az, y * fr) @ Quaternion(ax, p * fr) for (y, p) in look]
        for c in range(4): bake(ao, f'pose.bones["{bn}"].rotation_quaternion', c, [q[c] for q in qs])
    for bn, fr in (('spine03', 0.35), ('spine02', 0.4), ('spine01', 0.25)):
        ax = axis_local(bn, (1, 0, 0))
        qs = [Quaternion(ax, a * fr) for a in lean]
        for c in range(4): bake(ao, f'pose.bones["{bn}"].rotation_quaternion', c, [q[c] for q in qs])
    print(tag, 'trilhas OK', len(steps), 'passos', round(time.time() - T0))

# ------------------------------------------------ dedos (poses nos eventos)
POSES = {'relax': dict(t=(8, 10, 8), f=(12, 16, 10)), 'grip': dict(t=(25, 30, 0), f=(55, 70, 45)),
         'pinch': dict(t=(30, 30, 0), f=(55, 70, 45), idx=(35, 45, 30)), 'point': dict(t=(20, 20, 0), f=(62, 80, 50), idx=(0, 5, 5))}
for tag, (ao, I, E) in RIG.items():
    A = PL['actors'][tag]
    B = ao.data.bones
    events = {s: [(0.0, 'relax')] + sorted([(g['t'], g['pose']) for g in A['grip'] if g['side'] == s]) for s in 'LR'}
    if tag == 'SUPERVISOR': events['L'] = [(0.0, 'grip')]
    for s in 'LR':
        W = B[f'wrist.{s}'].head_local; Ix = B[f'finger2-1.{s}'].head_local; Pk = B[f'finger5-1.{s}'].head_local
        nrm = (Ix - W).cross(Pk - W).normalized()
        if nrm.z > 0: nrm = -nrm
        keys = {}
        for (te, pose) in events[s]:
            P_ = POSES[pose]
            for fi in range(1, 6):
                for j in range(1, 4):
                    bn = f'finger{fi}-{j}.{s}'
                    if bn not in B: continue
                    b = B[bn]
                    d = (b.tail_local - b.head_local).normalized()
                    ax = d.cross(nrm).normalized()
                    axl = (b.matrix_local.to_3x3().inverted() @ ax).normalized()
                    if fi == 1: ang = P_['t'][j - 1]
                    elif fi == 2 and 'idx' in P_: ang = P_['idx'][j - 1]
                    else: ang = P_['f'][j - 1]
                    q = Quaternion(axl, math.radians(ang))
                    keys.setdefault(bn, []).append((te, q))
        for bn, lst in keys.items():
            pbn = ao.pose.bones[bn]
            prev = None
            for (te, q) in lst:
                if prev is not None:
                    pbn.rotation_quaternion = prev; pbn.keyframe_insert('rotation_quaternion', frame=max(te - 0.25, 0) * FPS)
                pbn.rotation_quaternion = q; pbn.keyframe_insert('rotation_quaternion', frame=te * FPS)
                prev = q
print('dedos OK', round(time.time() - T0))

# ------------------------------------------------ objetos animados (frasco, pipeta, tablet, porta, nível, lâmpada)
def prop_track(track, hands, samples, kind):
    out = []
    tilt = PL['pip_tilt']
    for i, smp in enumerate(samples):
        t = smp['t']; act = track[0]
        for e in track:
            if e['t0'] <= t: act = e
        f = np.array([math.cos(smp['psi']), math.sin(smp['psi'])])
        if act['mode'] == 'hand':
            h = hands[act['side']][i]
            if kind == 'frasco':
                pos = (h[0] + f[0] * 0.035, h[1] + f[1] * 0.035, h[2] - 0.16); q = Quaternion()
            else:
                pos = (h[0], h[1], h[2])
                d = Vector((f[0] * math.sin(tilt), f[1] * math.sin(tilt), -math.cos(tilt)))
                q = Vector((0, 0, -1)).rotation_difference(d) @ Quaternion((0, 0, 1), smp['psi'])
        elif act['mode'] == 'fixed_flat':
            pos = act['pos']; q = Euler((math.pi / 2, 0, 0.3), 'XYZ').to_quaternion()
        else:
            pos = act['pos']; q = Quaternion()
        out.append((pos, q))
    return out


samp, hands, _, _ = ANIMDATA['OPERADORA']
for obj, key, kind in ((FRASCO, 'FRASCO', 'frasco'), (FRASCO2, 'FRASCO2', 'frasco'), (PIPETA, 'PIPETA', 'pipeta')):
    tr = prop_track(PL['props'][key], hands, samp, kind)
    obj.rotation_mode = 'QUATERNION'
    qs = [q for p, q in tr]
    for i in range(1, len(qs)):
        if qs[i].dot(qs[i - 1]) < 0: qs[i] = -qs[i]
    for c in range(3): bake(obj, 'location', c, [float(p[c]) for p, q in tr])
    for c in range(4): bake(obj, 'rotation_quaternion', c, [q[c] for q in qs])
# sorriso (chave de forma animada)
for (ts, w) in PL['actors']['OPERADORA']['smile']:
    SMILE.value = 0.0; SMILE.keyframe_insert('value', frame=int(ts * FPS))
    SMILE.value = w; SMILE.keyframe_insert('value', frame=int((ts + 0.7) * FPS))
    SMILE.value = w; SMILE.keyframe_insert('value', frame=NF - 1)
samp, hands, _, _ = ANIMDATA['SUPERVISOR']
tl, tr_ = [], []
for i, smp in enumerate(samp):
    h = hands['L'][i]
    l = np.array([-math.sin(smp['psi']), math.cos(smp['psi'])])
    f = np.array([math.cos(smp['psi']), math.sin(smp['psi'])])
    c = h[:2] - l * 0.10 + f * 0.02
    tl.append((c[0], c[1], h[2] - 0.01)); tr_.append((math.radians(-50), 0.0, smp['psi'] + math.pi / 2))
TABLET.rotation_mode = 'ZYX'
for c in range(3):
    bake(TABLET, 'location', c, [float(p[c]) for p in tl])
eul = [Euler((0, 0, r[2]), 'XYZ').to_matrix() @ Euler((r[0], 0, 0), 'XYZ').to_matrix() for r in tr_]
qs = [m.to_quaternion() for m in eul]
for i in range(1, len(qs)):
    if qs[i].dot(qs[i - 1]) < 0: qs[i] = -qs[i]
TABLET.rotation_mode = 'QUATERNION'
for c in range(4): bake(TABLET, 'rotation_quaternion', c, [q[c] for q in qs])

PORTA = R['PORTA']; PORTA.rotation_mode = 'XYZ'
ang = []
for f in range(NF):
    t = FR(f); a = 0.0
    for (o, c) in PL['doors']:
        a = max(a, smooth01((t - o) / 1.0) * (1 - smooth01((t - c) / 1.3)) if t < c + 1.4 else 0.0)
    ang.append(-math.radians(95) * a)
bake(PORTA, 'rotation_euler', 2, ang)
tank = np.array(PL['tank'])
vol = np.interp([FR(f) for f in range(NF)], tank[:, 0], tank[:, 1])
bake(R['NIV'], 'scale', 2, [max(v / 250.0 * 1.0, 0.001) for v in vol])
lamp = [1.0 if PL['transfer']['t'] <= FR(f) < PL['transfer']['t1'] else 0.001 for f in range(NF)]
for c in range(3): bake(R['LAMP'], 'scale', c, lamp)
print('objetos OK', round(time.time() - T0))

# ------------------------------------------------ assa a IK nos ossos
scn.frame_start, scn.frame_end = 0, NF - 1
for o in bpy.data.objects:
    for md in getattr(o, 'modifiers', []):
        if md.type == 'ARMATURE': md.show_viewport = False
BAKE = ['upperleg01', 'upperleg02', 'lowerleg01', 'lowerleg02', 'foot', 'upperarm01', 'upperarm02', 'lowerarm01', 'lowerarm02']
store = {tag: {f'{b}.{s}': [] for b in BAKE for s in 'LR'} for tag in RIG}
for f in range(NF):
    scn.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    for tag, (ao0, I, E) in RIG.items():
        ao = ao0.evaluated_get(dg)            # REV17: lê a pose avaliada (módulo bpy não devolve a pose ao original)
        for bn in store[tag]:
            pbn = ao.pose.bones[bn]; b = pbn.bone
            if pbn.parent:
                rest = b.parent.matrix_local.inverted() @ b.matrix_local
                M = rest.inverted() @ pbn.parent.matrix.inverted() @ pbn.matrix
            else:
                M = b.matrix_local.inverted() @ pbn.matrix
            q = M.to_quaternion()
            L = store[tag][bn]
            if L and q.dot(L[-1]) < 0: q = -q
            L.append(q)
    if f % 1000 == 0: print('assando', f, NF, round(time.time() - T0))
for tag, (ao, I, E) in RIG.items():
    for pbn in ao.pose.bones:
        for c in list(pbn.constraints): pbn.constraints.remove(c)
    for bn, qs in store[tag].items():
        for c in range(4): bake(ao, f'pose.bones["{bn}"].rotation_quaternion', c, [q[c] for q in qs])
    for e in E.values(): bpy.data.objects.remove(e, do_unlink=True)
for o in bpy.data.objects:
    for md in getattr(o, 'modifiers', []):
        if md.type == 'ARMATURE': md.show_viewport = True
print('IK assada', round(time.time() - T0))

# ------------------------------------------------ finaliza e exporta
room.finalize_static(G, {'TV_TELA', 'RELOGIO_TELA', 'PAINEL_TQ_TELA'})
bpy.ops.wm.save_as_mainfile(filepath='/home/claude/sala/out/SALA_CENA.blend')
path = '/home/claude/sala/web/assets/sala_cena.glb'
os.makedirs(os.path.dirname(path), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_animations=True, export_animation_mode='SCENE',
                          export_frame_range=True, export_force_sampling=False, export_optimize_animation_size=True,
                          export_apply=False, export_yup=True, export_materials='EXPORT', export_skins=True, export_all_influences=False)
import struct
f = open(path, 'rb').read(); l = struct.unpack('<I', f[12:16])[0]
j = json.loads(f[20:20 + l]); rest = f[20 + l:]
ch, sp = [], []
for a in j.get('animations', []):
    o = len(sp); sp += a['samplers']
    for c in a['channels']:
        c = dict(c); c['sampler'] += o; ch.append(c)
j['animations'] = [{'name': 'CENA', 'channels': ch, 'samplers': sp}]
s = json.dumps(j, separators=(',', ':')).encode(); s += b' ' * ((4 - len(s) % 4) % 4)
body = struct.pack('<I', len(s)) + b'JSON' + s + rest
open(path, 'wb').write(b'glTF' + struct.pack('<I', 2) + struct.pack('<I', 12 + len(body)) + body)

# ------------------------------------------------ roteiro para a página
WEB = dict(T_END=T_END, K=PL['K'], SIM_T0=PL['SIM_T0'], VOL_CICLO=PL['VOL_CICLO'], MIX_REAL=PL['MIX_REAL'],
           machines=PL['machines'], doors=PL['doors'], events=PL['events'], tank=PL['tank'][::4], transfer=PL['transfer'],
           steps=STEPS, sup_windows=PL['sup_windows'], cafe=PL['cafe'], STAGGER=PL['STAGGER'],
           pts=dict(door=[(DOOR['x0'] + DOOR['x1']) / 2, -RY], tank=[TANK['x'], TANK['y']], panel=[PANEL['x'], PANEL['y']], pump=[PUMP['x'], PUMP['y']],
                    ihm={k: v['ihm'] for k, v in MP.items()}))
json.dump(WEB, open('/home/claude/sala/web/assets/roteiro.json', 'w'), default=float)
print('EXPORT OK', os.path.getsize(path), round(time.time() - T0))
