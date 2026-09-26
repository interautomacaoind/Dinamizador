# Otimiza um GLB: reduz chaves de animação (remove constantes e redundantes) e converte PNG sem transparência em JPEG
import json, struct, sys, io
import numpy as np
from PIL import Image

CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8, 5122: np.int16, 5120: np.int8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load(path):
    f = open(path, 'rb').read()
    l = struct.unpack('<I', f[12:16])[0]
    j = json.loads(f[20:20 + l])
    o = 20 + l
    bl = struct.unpack('<I', f[o:o + 4])[0]
    return j, f[o + 8:o + 8 + bl]


def decimate(t, v, tol):
    n = len(t)
    if n <= 2: return np.arange(n)
    if np.all(np.abs(v - v[0]) <= tol * 0.25): return np.array([0])
    keep = [0]; i = 0
    while i < n - 1:
        j = i + 1
        best = j
        step = 1
        while j < n:
            seg = slice(i + 1, j)
            if j > i + 1:
                u = ((t[seg] - t[i]) / (t[j] - t[i]))[:, None]
                err = np.abs(v[i] + (v[j] - v[i]) * u - v[seg]).max()
                if err > tol: break
            best = j
            j += step
            if j - i > 60: break
        keep.append(best); i = best
    return np.array(sorted(set(keep)))


def optimize(src, dst, tol_rot=0.0015, tol_pos=0.0015, tol_scl=0.002, jpeg_q=86):
    j, bin_ = load(src)
    acc, bv = j['accessors'], j['bufferViews']
    data = {}                                   # bufferView -> bytes novos
    def arr(ai):
        a = acc[ai]; v = bv[a['bufferView']]
        off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        n = a['count'] * NC[a['type']]
        return np.frombuffer(bin_, dtype=CT[a['componentType']], count=n, offset=off).reshape(a['count'], NC[a['type']]).copy()
    before = sum(bv[acc[s][k]]['byteLength'] if False else 0 for s in [] for k in [])
    na = 0; nk0 = nk1 = 0
    for an in j.get('animations', []):
        for ch in an['channels']:
            smp = an['samplers'][ch['sampler']]
            if smp.get('interpolation', 'LINEAR') != 'LINEAR': continue
            ti, vo = smp['input'], smp['output']
            t = arr(ti)[:, 0]; v = arr(vo)
            tol = tol_rot if ch['target']['path'] == 'rotation' else tol_pos if ch['target']['path'] == 'translation' else tol_scl
            k = decimate(t, v, tol)
            nk0 += len(t); nk1 += len(k)
            # novos acessores próprios (entrada e saída)
            for (ai, a2) in ((ti, t[k][:, None]), (vo, v[k])):
                a = dict(acc[ai]); a2 = a2.astype(np.float32)
                bv.append({'buffer': 0, 'byteLength': a2.nbytes}); data[len(bv) - 1] = a2.tobytes()
                a['bufferView'] = len(bv) - 1; a.pop('byteOffset', None); a['count'] = len(k)
                if 'min' in a: a['min'] = a2.min(0).tolist(); a['max'] = a2.max(0).tolist()
                acc.append(a)
            smp['input'] = len(acc) - 2; smp['output'] = len(acc) - 1
    # imagens
    for im in j.get('images', []):
        if 'bufferView' not in im: continue
        v = bv[im['bufferView']]
        raw = bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        try:
            I = Image.open(io.BytesIO(raw))
        except Exception:
            continue
        if I.mode in ('RGBA', 'LA') and np.asarray(I.convert('RGBA'))[..., 3].min() < 250: continue
        b = io.BytesIO(); I.convert('RGB').save(b, 'JPEG', quality=jpeg_q, optimize=True)
        if b.tell() < len(raw) * 0.8:
            bv.append({'buffer': 0, 'byteLength': b.tell()}); data[len(bv) - 1] = b.getvalue()
            im['bufferView'] = len(bv) - 1; im['mimeType'] = 'image/jpeg'
    # remove acessores / visões não usados e recompacta o binário
    used_acc = set()
    def use(x):
        if isinstance(x, int): used_acc.add(x)
    for m in j.get('meshes', []):
        for p in m['primitives']:
            for a in p['attributes'].values(): use(a)
            if 'indices' in p: use(p['indices'])
            for tg in p.get('targets', []):
                for a in tg.values(): use(a)
    for s in j.get('skins', []):
        if 'inverseBindMatrices' in s: use(s['inverseBindMatrices'])
    for an in j.get('animations', []):
        for s in an['samplers']: use(s['input']); use(s['output'])
    amap = {}; newacc = []
    for i, a in enumerate(acc):
        if i in used_acc: amap[i] = len(newacc); newacc.append(a)
    for m in j.get('meshes', []):
        for p in m['primitives']:
            p['attributes'] = {k: amap[a] for k, a in p['attributes'].items()}
            if 'indices' in p: p['indices'] = amap[p['indices']]
            if 'targets' in p: p['targets'] = [{k: amap[a] for k, a in tg.items()} for tg in p['targets']]
    for s in j.get('skins', []):
        if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = amap[s['inverseBindMatrices']]
    for an in j.get('animations', []):
        for s in an['samplers']: s['input'] = amap[s['input']]; s['output'] = amap[s['output']]
    used_bv = set(a['bufferView'] for a in newacc if 'bufferView' in a) | set(im['bufferView'] for im in j.get('images', []) if 'bufferView' in im)
    vmap = {}; newbv = []; out = bytearray()
    for i, v in enumerate(bv):
        if i not in used_bv: continue
        d = data.get(i)
        if d is None: d = bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        while len(out) % 4: out.append(0)
        nv = dict(v); nv['byteOffset'] = len(out); nv['byteLength'] = len(d); nv['buffer'] = 0
        out += d; vmap[i] = len(newbv); newbv.append(nv)
    for a in newacc:
        if 'bufferView' in a: a['bufferView'] = vmap[a['bufferView']]
    for im in j.get('images', []):
        if 'bufferView' in im: im['bufferView'] = vmap[im['bufferView']]
    while len(out) % 4: out.append(0)
    j['accessors'] = newacc; j['bufferViews'] = newbv; j['buffers'] = [{'byteLength': len(out)}]
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    body = struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(out)) + b'BIN\x00' + bytes(out)
    open(dst, 'wb').write(b'glTF' + struct.pack('<I', 2) + struct.pack('<I', 12 + len(body)) + body)
    print(f'{src}: chaves {nk0} -> {nk1}; {len(open(src, "rb").read()) / 1e6:.1f} MB -> {len(open(dst, "rb").read()) / 1e6:.1f} MB')


if __name__ == '__main__':
    optimize(sys.argv[1], sys.argv[2])
