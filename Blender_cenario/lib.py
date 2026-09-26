import bpy, bmesh, math
from mathutils import Vector, Matrix, Euler

FPS = 24

# ---------------------------------------------------------------- materials
_MATS = {}
def mat(name, rgb=(0.7, 0.7, 0.7), metal=0.0, rough=0.5, alpha=1.0, emit=None):
    if name in _MATS:
        return _MATS[name]
    if name in bpy.data.materials and name not in _MATS and alpha == 1.0 and emit is None:
        m = bpy.data.materials[name]
        _MATS[name] = m
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = 2.0
    m.diffuse_color = (*rgb, alpha)
    _MATS[name] = m
    return m

# ---------------------------------------------------------------- objects
def _link(o, parent):
    bpy.context.scene.collection.objects.link(o)
    if parent is not None:
        bpy.context.view_layer.update()
        o.parent = parent
        o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o

def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.empty_display_size = 0.05
    o.location = loc
    return _link(o, parent)

def _mesh_obj(name, bm, m, parent):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = False
    o = bpy.data.objects.new(name, me)
    if m is not None:
        me.materials.append(m)
    return _link(o, parent)

def box(name, x0, x1, y0, y1, z0, z1, m=None, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5) * (x1 - x0)
        v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
    return _mesh_obj(name, bm, m, parent)

def _orient(axis):
    if axis == 'X':
        return Matrix.Rotation(math.pi / 2, 4, 'Y')
    if axis == 'Y':
        return Matrix.Rotation(-math.pi / 2, 4, 'X')
    return Matrix.Identity(4)

def cyl(name, r, a0, a1, c=(0, 0), axis='Z', m=None, parent=None, seg=24, r2=None, smooth=True):
    """cylinder along axis from coordinate a0 to a1; c = the two other coords
    (for Z: (x,y); for X: (y,z); for Y: (x,z))."""
    bm = bmesh.new()
    h = a1 - a0
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r,
                          radius2=(r if r2 is None else r2), depth=abs(h))
    mid = (a0 + a1) / 2
    if axis == 'Z':
        T = Matrix.Translation((c[0], c[1], mid))
        R = Matrix.Identity(4)
    elif axis == 'X':
        T = Matrix.Translation((mid, c[0], c[1]))
        R = _orient('X')
    else:
        T = Matrix.Translation((c[0], mid, c[1]))
        R = _orient('Y')
    if h < 0:
        R = R @ Matrix.Rotation(math.pi, 4, 'X')
    bmesh.ops.transform(bm, matrix=T @ R, verts=bm.verts)
    o = _mesh_obj(name, bm, m, parent)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = len(p.vertices) == 4
    return o

def sphere(name, r, loc, m=None, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    o = _mesh_obj(name, bm, m, parent)
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def torus(name, R, r, loc, axis='Z', m=None, parent=None, seg=32, mseg=10, arc=2 * math.pi, start=0.0):
    bm = bmesh.new()
    rings = []
    for i in range(seg + (0 if arc >= 2 * math.pi - 1e-6 else 1)):
        a = start + arc * i / seg
        ring = []
        for j in range(mseg):
            b = 2 * math.pi * j / mseg
            rr = R + r * math.cos(b)
            ring.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), r * math.sin(b))))
        rings.append(ring)
    closed = arc >= 2 * math.pi - 1e-6
    n = len(rings)
    for i in range(n if closed else n - 1):
        r0, r1 = rings[i], rings[(i + 1) % n]
        for j in range(mseg):
            bm.faces.new((r0[j], r0[(j + 1) % mseg], r1[(j + 1) % mseg], r1[j]))
    M = Matrix.Translation(loc) @ _orient(axis)
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    o = _mesh_obj(name, bm, m, parent)
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def lathe(name, prof, loc, m=None, parent=None, seg=40, axis='Z'):
    """prof: list of (r, z) along the profile, revolved around Z."""
    bm = bmesh.new()
    rings = []
    for (r, z) in prof:
        ring = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    for k in range(len(rings) - 1):
        a, b = rings[k], rings[k + 1]
        for i in range(seg):
            bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    M = Matrix.Translation(loc) @ _orient(axis)
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    o = _mesh_obj(name, bm, m, parent)
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def pipe(name, pts, r, m=None, parent=None, bevel_res=6):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (*c, 1)
    o = bpy.data.objects.new(name + '_tmp', cu)
    bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o)
    ob = bpy.data.objects.new(name, me)
    if m is not None:
        me.materials.clear()
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    return _link(ob, parent)

def text(name, s, loc, size, m, parent=None, rot=(math.pi / 2, 0, 0), extrude=0.001):
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body = s
    cu.size = size
    cu.extrude = extrude
    cu.align_x = 'CENTER'
    o = bpy.data.objects.new(name + '_tmp', cu)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    mw = o.matrix_world.copy()
    bpy.data.objects.remove(o)
    ob = bpy.data.objects.new(name, me)
    ob.matrix_world = mw
    me.materials.clear()
    me.materials.append(m)
    return _link(ob, parent)

# ---------------------------------------------------------------- animation
def bake(obj, path, index, values, frame0=0):
    """values: list, one per frame starting at frame0 (linear)."""
    if obj.animation_data is None:
        obj.animation_data_create()
    if obj.animation_data.action is None:
        obj.animation_data.action = bpy.data.actions.new(obj.name + '_act')
    act = obj.animation_data.action
    fc = act.fcurves.find(path, index=index)
    if fc is None:
        fc = act.fcurves.new(path, index=index)
    n = len(values)
    fc.keyframe_points.add(n)
    co = []
    for i, v in enumerate(values):
        co += [frame0 + i, v]
    fc.keyframe_points.foreach_set('co', co)
    fc.keyframe_points.foreach_set('interpolation', [1] * n)  # LINEAR
    fc.update()
    # Blender 4.4+ (ações com slots): garante que o objeto use o slot da ação, senão a animação não é avaliada
    ad = obj.animation_data
    if hasattr(ad, 'action_slot') and ad.action_slot is None and len(act.slots):
        ad.action_slot = act.slots[0]

def smooth(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)

def ramp(t, t0, t1):
    if t <= t0:
        return 0.0
    if t >= t1:
        return 1.0
    return smooth((t - t0) / (t1 - t0))


# ---------------------------------------------------------------- REV13 extras
def _box_bm(bm, x0, x1, y0, y1, z0, z1, ch=0.0):
    tmp = bmesh.new()
    bmesh.ops.create_cube(tmp, size=1.0)
    for v in tmp.verts:
        v.co.x = x0 + (v.co.x + 0.5) * (x1 - x0)
        v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
    if ch > 0:
        c = min(ch, 0.45 * min(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)))
        bmesh.ops.bevel(tmp, geom=list(tmp.edges), offset=c, segments=1, affect='EDGES', profile=0.5)
    me = bpy.data.meshes.new('_t')
    tmp.to_mesh(me)
    tmp.free()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)

def cbox(name, x0, x1, y0, y1, z0, z1, m=None, parent=None, ch=0.002):
    """caixa com chanfro nas arestas"""
    bm = bmesh.new()
    _box_bm(bm, x0, x1, y0, y1, z0, z1, ch)
    return _mesh_obj(name, bm, m, parent)

def boxes(name, lst, m=None, parent=None, ch=0.0):
    """várias caixas num único objeto: lst = [(x0,x1,y0,y1,z0,z1), ...]"""
    bm = bmesh.new()
    for b in lst:
        _box_bm(bm, *b, ch=ch)
    return _mesh_obj(name, bm, m, parent)

class Acc:
    """acumula geometria pequena (parafusos, porcas) num único objeto"""
    def __init__(self):
        self.bm = bmesh.new()
    def _cone(self, r, a0, a1, c, axis, seg, r2=None):
        tmp = bmesh.new()
        h = a1 - a0
        bmesh.ops.create_cone(tmp, cap_ends=True, segments=seg, radius1=r, radius2=(r if r2 is None else r2), depth=abs(h))
        mid = (a0 + a1) / 2
        if axis == 'Z':
            T = Matrix.Translation((c[0], c[1], mid)); R = Matrix.Identity(4)
        elif axis == 'X':
            T = Matrix.Translation((mid, c[0], c[1])); R = _orient('X')
        else:
            T = Matrix.Translation((c[0], mid, c[1])); R = _orient('Y')
        bmesh.ops.transform(tmp, matrix=T @ R, verts=tmp.verts)
        me = bpy.data.meshes.new('_t'); tmp.to_mesh(me); tmp.free()
        self.bm.from_mesh(me); bpy.data.meshes.remove(me)
    def cyl(self, r, a0, a1, c, axis='Z', seg=12, r2=None):
        self._cone(r, a0, a1, c, axis, seg, r2)
    def hexa(self, s, a0, a1, c, axis='Z'):
        self._cone(s / math.sqrt(3), a0, a1, c, axis, 6)
    def box(self, *b, ch=0.0):
        _box_bm(self.bm, *b, ch=ch)
    def screw(self, p, axis='Z', d=0.008, sgn=1):
        """cabeça de parafuso allen (DIN 912) apoiada no ponto p, saindo no sentido sgn do eixo"""
        i = 'XYZ'.index(axis)
        a0 = p[i]; a1 = a0 + sgn * 0.8 * d
        c = [p[k] for k in range(3) if k != i]
        self._cone(0.8 * d, min(a0, a1), max(a0, a1), c, axis, 12)
    def nut(self, p, axis='Z', d=0.012, sgn=1):
        i = 'XYZ'.index(axis)
        a0 = p[i]; a1 = a0 + sgn * 0.8 * d
        c = [p[k] for k in range(3) if k != i]
        self._cone(1.7 * d / math.sqrt(3) * 1.0, min(a0, a1), max(a0, a1), c, axis, 6)
        self._cone(1.2 * d / 2, min(a0, a1) - 0.0005, max(a0, a1) + 0.0005, c, axis, 8)
    def flush(self, name, m, parent):
        bm = self.bm
        self.bm = bmesh.new()
        if len(bm.verts) == 0:
            bm.free(); return None
        return _mesh_obj(name, bm, m, parent)

def lathe_arc(name, prof, loc, a0, a1, m=None, parent=None, seg=24):
    """revolução parcial (a0..a1 rad) de um perfil FECHADO (r,z), com tampas nas extremidades"""
    bm = bmesh.new()
    rings = []
    for i in range(seg + 1):
        a = a0 + (a1 - a0) * i / seg
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for (r, z) in prof])
    n = len(prof)
    for i in range(seg):
        A, B = rings[i], rings[i + 1]
        for k in range(n):
            k2 = (k + 1) % n
            try:
                bm.faces.new((A[k], A[k2], B[k2], B[k]))
            except ValueError:
                pass
    for ring in (rings[0], rings[-1]):
        try:
            bm.faces.new(ring)
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    o = _mesh_obj(name, bm, m, parent)
    for p in o.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    return o
