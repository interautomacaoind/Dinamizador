# Construção de personagens a partir dos dados MakeHuman (malha base + alvos CC0 + roupas proxy)
import bpy, json, math, re, os
import numpy as np
from mathutils import Vector, Matrix
from PIL import Image, ImageFilter

MHD = '/tmp/mhd/package/public/data/'
NPZ = np.load('/home/claude/mh/whl/makehuman/data/targets.npz', allow_pickle=True)
TEX = '/home/claude/sala/tex/'
BASE = json.load(open(MHD + 'models/human_full_size.json'))
BV = np.array(BASE['vertices'], float).reshape(-1, 3)
BONES = BASE['bones']
JPI = BASE['metadata']['joint_pos_idxs']
NBODY = 13380


def parse_faces(f):
    out = []; i = 0; n = len(f)
    while i < n:
        t = f[i]; i += 1
        k = 4 if t & 1 else 3
        vs = f[i:i + k]; i += k
        m = 0
        if t & 2: m = f[i]; i += 1
        if t & 4: i += 1
        uv = None
        if t & 8: uv = f[i:i + k]; i += k
        if t & 16: i += 1
        if t & 32: i += k
        if t & 64: i += 1
        if t & 128: i += k
        out.append((vs, m, uv))
    return out


BFACES = parse_faces(BASE['faces'])
BUV = np.array(BASE['uvs'][0], float).reshape(-1, 2)


def cv(P):
    P = np.asarray(P)
    return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1) * 0.1


def morph(targets):
    V = BV.copy()
    for name, w in targets.items():
        idx = NPZ['targets/' + name + '.index'].astype(int)
        vec = NPZ['targets/' + name + '.vector'].astype(float) * 1e-3
        V[idx] += w * vec
    return V


def bone_names():
    return {i: b['name'][:-8] for i, b in enumerate(BONES) if b['name'].endswith('____head')}


BN = bone_names()


def img_mat(name, path, rough=0.6, metal=0.0, alpha=False, spec=0.4, tint=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bs = nt.nodes['Principled BSDF']
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metal
    bs.inputs['Specular IOR Level'].default_value = spec
    if path:
        im = bpy.data.images.load(path)
        tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = im
        nt.links.new(tx.outputs['Color'], bs.inputs['Base Color'])
        if alpha:
            nt.links.new(tx.outputs['Alpha'], bs.inputs['Alpha'])
            m.blend_method = 'CLIP'; m.alpha_threshold = 0.4
    elif tint:
        bs.inputs['Base Color'].default_value = (*tint, 1)
    return m


def build_obj(name, V3, faces, uvs, weights, mat_by_face, mats, parent, ipv=4):
    """faces: list (vs, m, uvidx) ; mat_by_face: list of slot index or -1 to drop"""
    used = sorted({v for (vs, m, uv), s in zip(faces, mat_by_face) if s >= 0 for v in vs})
    remap = {v: i for i, v in enumerate(used)}
    verts = [tuple(V3[v]) for v in used]
    fl = [[remap[v] for v in vs] for (vs, m, uv), s in zip(faces, mat_by_face) if s >= 0]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], fl)
    for m in mats: me.materials.append(m)
    slots = [s for s in mat_by_face if s >= 0]
    me.polygons.foreach_set('material_index', slots)
    uvl = me.uv_layers.new(name='UVMap')
    uvd = []
    for (vs, m, uv), s in zip(faces, mat_by_face):
        if s < 0: continue
        for u in uv: uvd += [uvs[u][0], uvs[u][1]]
    uvl.data.foreach_set('uv', uvd)
    for p in me.polygons: p.use_smooth = True
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    # pesos de pele
    si, sw = weights
    si = np.asarray(si).reshape(-1, ipv); sw = np.asarray(sw).reshape(-1, ipv)
    groups = {}
    for nv, v in enumerate(used):
        for k in range(ipv):
            w = sw[v, k]
            if w <= 0.0005: continue
            bn = BN.get(int(si[v, k]))
            if bn is None: continue
            g = groups.get(bn)
            if g is None: g = groups[bn] = ob.vertex_groups.new(name=bn)
            g.add([nv], float(w), 'ADD')
    ob.parent = parent
    md = ob.modifiers.new('Armature', 'ARMATURE'); md.object = parent
    return ob, used


def tex_recolor(src, dst, lo, hi, tint=(1, 1, 1), blur=0):
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).astype(float) / 255
    L = a[..., :3] @ np.array([0.3, 0.59, 0.11])
    msk = a[..., 3] > 0.1
    l0, l1 = np.percentile(L[msk], 2), np.percentile(L[msk], 98)
    Ln = np.clip((L - l0) / max(l1 - l0, 1e-3), 0, 1)
    out = np.zeros_like(a)
    for c in range(3): out[..., c] = (lo + (hi - lo) * Ln) * tint[c]
    out[..., 3] = a[..., 3]
    im2 = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGBA')
    if blur: im2 = im2.filter(ImageFilter.GaussianBlur(blur))
    im2.save(dst)
    return dst


def proxy(path):
    d = json.load(open(MHD + 'proxies/' + path))
    return d


def fit_proxy(d, V):
    r = np.array(d['ref_vIdxs']); w = np.array(d['weights']); o = np.array(d['offsets'])
    return (V[r] * w[..., None]).sum(1) + o


FEET_RE = re.compile(r'^(foot|toe)')
LEG_RE = re.compile(r'^(pelvis|upperleg|lowerleg|spine05|spine04)')
SKIN_RE = re.compile(r'^(head|neck|jaw|eye|oculi|oris|levator|orbicularis|special|temporalis|risorius|tongue|wrist|finger|metacarpal|lowerarm02)')


INV_BN = {v: k for k, v in BN.items()}


def coat_weights(d, F, V3, ao):
    """saia do jaleco: pesos suavizados (raiz + média das coxas) para não rasgar ao andar"""
    ipv = d.get('influencesPerVertex', 4)
    si = np.array(d['skinIndices']).reshape(-1, ipv); sw = np.array(d['skinWeights'], float).reshape(-1, ipv)
    hipz = V3[JPI['upperleg01.L____head']].mean(0)[2]
    SI, SW = [], []
    for v in range(len(F)):
        w = {}
        for k in range(ipv):
            if sw[v, k] > 0: w[int(si[v, k])] = w.get(int(si[v, k]), 0) + sw[v, k]
        z, x = F[v, 2], F[v, 0]
        t = min(max((hipz + 0.02 - z) / 0.30, 0.0), 1.0) * 0.8
        if t > 0:
            wl = min(max(0.5 + x / 0.22, 0.0), 1.0)
            tgt = {INV_BN['root']: 0.45, INV_BN['upperleg01.L']: 0.55 * wl, INV_BN['upperleg01.R']: 0.55 * (1 - wl)}
            nw = {k: (1 - t) * v_ for k, v_ in w.items()}
            for k, v_ in tgt.items(): nw[k] = nw.get(k, 0) + t * v_
            w = nw
        it = sorted(w.items(), key=lambda kv: -kv[1])[:4]
        tot = sum(v_ for k, v_ in it) or 1
        it += [(0, 0.0)] * (4 - len(it))
        SI += [k for k, v_ in it]; SW += [v_ / tot for k, v_ in it]
    d['influencesPerVertex'] = 4
    return SI, SW


BODY_USED = {}


def add_expression(tag, name, units, mix=(('caucasian', 0.7), ('african', 0.3))):
    """chave de forma (morph target) a partir das unidades de expressão do MakeHuman (CC0)"""
    body, used = BODY_USED[tag]
    D = np.zeros((len(BV), 3))
    for unit, w in units.items():
        for eth, we in mix:
            key = f'targets/expression/units/{eth}/{unit}'
            idx = NPZ[key + '.index'].astype(int); vec = NPZ[key + '.vector'].astype(float) * 1e-3
            D[idx] += w * we * vec
    D3 = np.stack([D[:, 0], -D[:, 2], D[:, 1]], 1) * 0.1
    if not body.data.shape_keys: body.shape_key_add(name='Basis', from_mix=False)
    sk = body.shape_key_add(name=name, from_mix=False)
    for nv, v in enumerate(used):
        if D3[v].any():
            sk.data[nv].co = body.data.vertices[nv].co + Vector(D3[v])
    sk.value = 0.0
    return sk


def build_human(tag, targets, skin_png, coat_png, pants_png, shoes_png, top_rgb, eye='brown', glasses=False,
                eyebrow='eyebrow001', inflate_coat=0.004):
    V = morph(targets)
    V3 = cv(V)
    zmin = V3[:NBODY, 2].min()
    V3[:, 2] -= zmin
    Vm = V.copy(); Vm[:, 1] -= (zmin / 0.1)       # mesmo deslocamento em unidades MH (dm, y para cima)
    # ---------------- esqueleto
    arm = bpy.data.armatures.new(tag + '_esqueleto')
    ao = bpy.data.objects.new(tag, arm)
    bpy.context.scene.collection.objects.link(ao)
    bpy.context.view_layer.objects.active = ao
    bpy.ops.object.mode_set(mode='EDIT')
    ebs = {}
    J = lambda k: V3[JPI[k]].mean(0)
    for i, n in BN.items():
        eb = arm.edit_bones.new(n)
        h = J(n + '____head'); t = J(n + '____tail')
        if np.linalg.norm(t - h) < 1e-4: t = h + np.array([0, 0, 0.01])
        eb.head = Vector(h); eb.tail = Vector(t)
        ebs[i] = eb
    for i, n in BN.items():
        p = BONES[i]['parent']
        if p >= 0:
            pn = BONES[p]['name']
            pn = pn[:-8] if pn.endswith('____head') else pn
            if pn in arm.edit_bones and pn != n:
                arm.edit_bones[n].parent = arm.edit_bones[pn]
    bpy.ops.object.mode_set(mode='OBJECT')
    # ---------------- corpo (pele + blusa por baixo do jaleco)
    si = np.array(BASE['skinIndices']).reshape(-1, 4); sw = np.array(BASE['skinWeights']).reshape(-1, 4)
    dom = [BN.get(int(si[v, np.argmax(sw[v])]), '') for v in range(len(BV))]
    mskin = img_mat(tag + ' pele', skin_png, rough=0.55, spec=0.35)
    mtop = img_mat(tag + ' blusa', None, rough=0.85, tint=top_rgb)
    mats_by = []
    for (vs, m, uv) in BFACES:
        if m != 0 or max(vs) >= NBODY: mats_by.append(-1); continue
        ds = [dom[v] for v in vs]
        if any(FEET_RE.match(d) for d in ds): mats_by.append(-1)
        elif all(SKIN_RE.match(d) for d in ds): mats_by.append(0)
        elif any(LEG_RE.match(d) for d in ds) and not any(SKIN_RE.match(d) for d in ds): mats_by.append(2)
        else: mats_by.append(1)
    mpants = img_mat(tag + ' calca', None, rough=0.85, tint=pants_png)
    body, used_b = build_obj(tag + ' corpo', V3, BFACES, BUV, (si, sw), mats_by, [mskin, mtop, mpants], ao)
    BODY_USED[tag] = (body, used_b)
    objs = [body]
    # ---------------- proxies
    def add_proxy(label, path, mat, inflate=0.0):
        d = proxy(path)
        F = cv(fit_proxy(d, Vm))
        if label == 'jaleco':
            d = dict(d); d['skinIndices'], d['skinWeights'] = coat_weights(d, F, V3, ao)
        fc = parse_faces(d['faces'])
        uvs = np.array(d['uvs'][0], float).reshape(-1, 2)
        ob, used = build_obj(f'{tag} {label}', F, fc, uvs, (d['skinIndices'], d['skinWeights']), [0] * len(fc), [mat], ao, ipv=d.get('influencesPerVertex', 4))
        if inflate:
            me = ob.data; me.calc_normals() if hasattr(me, 'calc_normals') else None
            for v in me.vertices: v.co += v.normal * inflate
        objs.append(ob)
        return ob
    add_proxy('olhos', 'eyes/Low-Poly/Low-Poly.json', img_mat(tag + ' olhos', MHD + f'proxies/eyes/Low-Poly/textures/{eye}_eye.png', rough=0.15, spec=0.6))
    add_proxy('sobrancelhas', f'eyebrows/{eyebrow}/{eyebrow}.json', img_mat(tag + ' sobrancelha', MHD + f'proxies/eyebrows/{eyebrow}/textures/{eyebrow}.png', alpha=True, rough=0.8))
    add_proxy('cilios', 'eyelashes/Eyelashes01/Eyelashes01.json', img_mat(tag + ' cilios', MHD + 'proxies/eyelashes/Eyelashes01/textures/eyelashes01.png', alpha=True, rough=0.8))
    add_proxy('sapatos', 'clothes/shoes02/shoes02.json', img_mat(tag + ' sapatos', shoes_png, rough=0.45, spec=0.5))
    add_proxy('jaleco', 'clothes/Coat/Coat.json', img_mat(tag + ' jaleco', coat_png, rough=0.8, spec=0.3), inflate=inflate_coat)
    if glasses:
        add_proxy('oculos', 'clothes/glasses/glasses.json', img_mat(tag + ' oculos', MHD + 'proxies/clothes/glasses/textures/glasses.png', rough=0.2, metal=0.3, alpha=True))
    return ao, objs, V3


def textures():
    tex_recolor(MHD + 'proxies/clothes/Coat/textures/coat.png', TEX + 'jaleco.png', 0.80, 0.95, (0.985, 0.99, 1.0))
    tex_recolor(MHD + 'proxies/clothes/Tightjeans/textures/tightjeans.png', TEX + 'calca_azul.png', 0.45, 0.70, (0.62, 0.78, 0.95))
    tex_recolor(MHD + 'proxies/clothes/Tightjeans/textures/tightjeans.png', TEX + 'calca_grafite.png', 0.14, 0.26, (1.0, 1.0, 1.05))
    tex_recolor(MHD + 'proxies/clothes/shoes02/textures/shoes02_diffuse.png', TEX + 'sapato_branco.png', 0.70, 0.95, (1, 1, 1))
    tex_recolor(MHD + 'proxies/clothes/shoes02/textures/shoes02_diffuse.png', TEX + 'sapato_preto.png', 0.03, 0.12, (1, 1, 1))


FEMALE = {'macrodetails/universal-female-young-averagemuscle-averageweight': 1.0,
          'macrodetails/caucasian-female-young': 0.7, 'macrodetails/african-female-young': 0.3,
          'macrodetails/proportions/female-young-averagemuscle-averageweight-idealproportions': 0.6}
MALE = {'macrodetails/universal-male-young-averagemuscle-averageweight': 0.75,
        'macrodetails/universal-male-old-averagemuscle-averageweight': 0.25,
        'macrodetails/caucasian-male-young': 0.75, 'macrodetails/caucasian-male-old': 0.25,
        'macrodetails/proportions/male-young-averagemuscle-averageweight-idealproportions': 0.5,
        'macrodetails/height/male-young-averagemuscle-averageweight-maxheight': 0.05}

def add_cap(ao, V3, tag, rgb=(0.93, 0.94, 0.95), seed=1):
    """touca descartável (bouffant) ajustada ao crânio, 100 % no osso 'head'"""
    from mathutils import Vector
    rng = np.random.default_rng(seed)
    si = np.array(BASE['skinIndices']).reshape(-1, 4); sw = np.array(BASE['skinWeights']).reshape(-1, 4)
    dom = np.array([BN.get(int(si[v, np.argmax(sw[v])]), '') for v in range(NBODY)])
    H = V3[:NBODY]
    ze = V3[JPI['eye.L____head']].mean(0)[2]
    headm = (dom == 'head')
    ymid = H[headm, 1].mean()
    crane = H[headm & ((H[:, 2] > ze + 0.005) | ((H[:, 1] > ymid + 0.01) & (H[:, 2] > ze - 0.09)) | (np.abs(H[:, 0] - H[headm, 0].mean()) > 0.055) & (H[:, 2] > ze - 0.04))]
    C = np.array([H[headm, 0].mean(), ymid + 0.012, ze + 0.005])
    D = crane - C; Dn = D / np.linalg.norm(D, axis=1)[:, None]
    NU, NV = 64, 18
    def rim_el(th):
        # th: ângulo em torno do eixo vertical (0 = frente, -y)
        c = math.cos(th)                       # 1 frente, -1 atrás
        zf, zs, zb = 0.030, -0.030, -0.085     # altura da borda relativa a C (frente, lado, trás)
        return zs + (zf - zs) * max(c, 0) ** 1.5 + (zb - zs) * max(-c, 0) ** 1.2
    R = np.zeros((NV + 1, NU)); P = np.zeros((NV + 1, NU, 3))
    for j in range(NV + 1):
        for i in range(NU):
            th = 2 * math.pi * i / NU
            dirh = np.array([math.sin(th), -math.cos(th), 0.0])
            zr = rim_el(th)
            el0 = math.asin(max(min(zr / 0.10, 0.95), -0.95))
            el = el0 + (math.pi / 2 - el0) * (j / NV) ** 0.9
            d = dirh * math.cos(el) + np.array([0, 0, 1.0]) * math.sin(el)
            cs = Dn @ d
            sel = cs > 0.94
            r = np.sort(D[sel] @ d)[-3:].mean() if sel.sum() > 3 else 0.10
            R[j, i] = r; P[j, i] = d
    for _ in range(6):   # suaviza os raios
        R[1:-1] = 0.5 * R[1:-1] + 0.125 * (R[:-2] + R[2:] + np.roll(R[1:-1], 1, 1) + np.roll(R[1:-1], -1, 1))
    verts = []
    for j in range(NV + 1):
        for i in range(NU):
            d = P[j, i]; th = 2 * math.pi * i / NU
            u = j / NV
            puff = 0.005 + 0.015 * math.sin(math.pi * min(u * 1.15, 1.0)) ** 0.8 + 0.0035 * math.sin(28 * th) * (1 - u) * min(u * 5, 1) + rng.normal(0, 0.0008)
            if j == 0: puff = 0.0035
            verts.append(tuple(C + d * (R[j, i] + puff)))
    faces = []
    for j in range(NV):
        for i in range(NU):
            a0 = j * NU + i; a1 = j * NU + (i + 1) % NU
            faces.append((a0, a1, a1 + NU, a0 + NU))
    me = bpy.data.meshes.new(tag + ' touca'); me.from_pydata(verts, [], faces)
    for p in me.polygons: p.use_smooth = True
    me.update()
    m = bpy.data.materials.new(tag + ' touca TNT'); m.use_nodes = True
    bb = m.node_tree.nodes['Principled BSDF']; bb.inputs['Base Color'].default_value = (*rgb, 1); bb.inputs['Roughness'].default_value = 0.95
    bb.inputs['Specular IOR Level'].default_value = 0.2
    m.use_backface_culling = False
    me.materials.append(m)
    ob = bpy.data.objects.new(tag + ' touca', me); bpy.context.scene.collection.objects.link(ob)
    ob.parent = ao
    vg = ob.vertex_groups.new(name='head'); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    md = ob.modifiers.new('Armature', 'ARMATURE'); md.object = ao
    return ob


if __name__ == '__main__':
    bpy.ops.wm.read_factory_settings(use_empty=True)
    textures()
    a, objs, V3 = build_human('OPERADORA', FEMALE, MHD + 'skins/young_caucasian_female/textures/young_lightskinned_female_diffuse.png',
                              TEX + 'jaleco.png', (0.06, 0.13, 0.30), TEX + 'sapato_branco.png', (0.55, 0.70, 0.86), eye='brownlight')
    add_cap(a, V3, 'OPERADORA')
    print('altura operadora', V3[:NBODY, 2].max())
    b, objs2, V3b = build_human('SUPERVISOR', MALE, MHD + 'skins/middleage_caucasian_male/textures/middleage_lightskinned_male_diffuse.png',
                                TEX + 'jaleco.png', (0.05, 0.055, 0.06), TEX + 'sapato_preto.png', (0.30, 0.40, 0.55), eye='brown', glasses=False, eyebrow='eyebrow002')
    add_cap(b, V3b, 'SUPERVISOR', rgb=(0.35, 0.55, 0.85))
    b.location.x = 0.8
    print('altura supervisor', V3b[:NBODY, 2].max())
    bpy.ops.export_scene.gltf(filepath='/home/claude/sala/out/humanos_teste.glb', export_format='GLB', export_yup=True)
    print('OK')

