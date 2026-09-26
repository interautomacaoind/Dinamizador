# Layout da sala (coordenadas Blender: x = largura 10 m, y = comprimento 10 m, z para cima) — REV17: sala 10 x 10 m
import math
import numpy as np

RX, RY, RH = 5.0, 5.0, 4.5
K_SIM = 3.0                       # tempo simulado = 3 x tempo real (ações humanas em ritmo realista)
SIM_T0 = 7 * 3600.0               # 07:00:00

# máquinas: (nome, x, y, rotação em graus) — frente das máquinas voltada para o corredor central
MACH = [('M1', 3.30, -2.30, -90.0), ('M2', 3.30, 2.30, -90.0), ('M3', -3.30, 2.30, 90.0), ('M4', -3.30, -2.30, 90.0)]
MB = (-0.72, 1.09, -0.66, 0.66)   # caixa local da máquina (com quadro) — sem estação lateral no REV17

IHM_L = (0.875, -0.6265, 1.50)
BTN_INI_L = (0.79, -0.622, 1.30)
# bocais de pipetagem (topo do bocal com o cabeçote FECHADO sobre o garrafão): P1–P3 frente, P4–P6 traseira
Z_BOCAL = 1.862 - 0.512
PORTS_L = [(-0.402, -0.34, Z_BOCAL), (0.018, -0.34, Z_BOCAL), (0.438, -0.34, Z_BOCAL),
           (-0.402, 0.34, Z_BOCAL), (0.018, 0.34, Z_BOCAL), (0.438, 0.34, Z_BOCAL)]
DOOR_PLANE = 0.60                 # portas frontal/traseira em y = -/+0,60 (local)
STUB_L = {'BASE': (0.86, 0.22), 'PRODUTO': (0.86, 0.42)}

DOOR = dict(x0=3.00, x1=4.20, y=-RY, h=2.20)          # porta de entrada (canto frontal direito)
TANK = dict(x=0.0, y=0.0, r=0.42, z0=0.55, z1=1.55)   # tanque de passagem 250 L
PANEL = dict(x=0.95, y=-0.75)                          # pedestal do botão de transferência
PUMP = dict(x=-0.75, y=-0.55)
TABLES = [dict(x=0.45, y=-3.95, w=1.6, d=0.7), dict(x=0.0, y=2.75, w=1.6, d=0.7)]
BENCH_FRASCOS = dict(x0=-3.0, x1=-0.9, y0=-RY, y1=-RY + 0.70, z=0.90)
BENCH_TORNEIRAS = dict(x0=-2.0, x1=2.0, y0=RY - 0.70, y1=RY, z=0.90)
TV = dict(x=0.0, y=RY - 0.06, zc=3.05, w=2.10, h=1.20)
CLOCK = dict(x=0.0, y=-RY + 0.04, zc=3.20, r=0.20)


def rot(v, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return (c * v[0] - s * v[1], s * v[0] + c * v[1])


def to_world(m, p):
    n, x, y, r = m
    dx, dy = rot(p[:2], r)
    return (x + dx, y + dy) + tuple(p[2:])


def heading_of(vec):
    """ângulo (rad) de uma direção no plano; 0 = +x"""
    return math.atan2(vec[1], vec[0])


def machine_points(m):
    n, x, y, r = m
    front = rot((0, -1), r)                  # normal da frente (para o corredor)
    left = rot((-1, 0), r)                   # normal da lateral esquerda (estação)
    ihm = to_world(m, IHM_L)
    stand_ihm = (ihm[0] + front[0] * 0.46, ihm[1] + front[1] * 0.46)
    ports = [to_world(m, p) for p in PORTS_L]
    back = (-front[0], -front[1])
    # posição de trabalho em cada porta (frente / traseira): 0,32 m fora do plano da porta, no eixo do garrafão do meio
    stand_f = to_world(m, (0.018, -DOOR_PLANE - 0.32)); stand_b = to_world(m, (0.018, DOOR_PLANE + 0.32))
    return dict(ihm=ihm, btn=to_world(m, BTN_INI_L), front=front, back=back, left=left, stand_ihm=stand_ihm,
                face_ihm=heading_of((-front[0], -front[1])), ports=ports,
                stand_f=stand_f, face_f=heading_of(back), stand_b=stand_b, face_b=heading_of(front),
                door_f=to_world(m, (0.0, -DOOR_PLANE)), door_b=to_world(m, (0.0, DOOR_PLANE)),
                stubs={k: to_world(m, v) for k, v in STUB_L.items()})


MP = {m[0]: machine_points(m) for m in MACH}


# ------------------------------------------------ obstáculos + planejador de caminhos (A* em grade)
def obstacles():
    L = []
    for m in MACH:
        cs = [to_world(m, (a, b)) for a in (MB[0], MB[1]) for b in (MB[2], MB[3])]
        xs = [c[0] for c in cs]; ys = [c[1] for c in cs]
        L.append((min(xs), max(xs), min(ys), max(ys)))
    L.append((TANK['x'] - 0.62, TANK['x'] + 0.62, TANK['y'] - 0.62, TANK['y'] + 0.62))
    L.append((PANEL['x'] - 0.15, PANEL['x'] + 0.15, PANEL['y'] - 0.15, PANEL['y'] + 0.15))
    L.append((PUMP['x'] - 0.25, PUMP['x'] + 0.25, PUMP['y'] - 0.18, PUMP['y'] + 0.18))
    for t in TABLES:
        L.append((t['x'] - t['w'] / 2, t['x'] + t['w'] / 2, t['y'] - t['d'] / 2, t['y'] + t['d'] / 2))
    for b in (BENCH_FRASCOS, BENCH_TORNEIRAS):
        L.append((b['x0'], b['x1'], b['y0'], b['y1']))
    return L


RES = 0.05
NXg, NYg = int(2 * RX / RES), int((2 * RY + 2.0) / RES)   # inclui 1 m fora da porta


def _grid(infl=0.30):
    g = np.zeros((NXg, NYg), bool)
    xs = -RX + (np.arange(NXg) + 0.5) * RES
    ys = -RY - 1.0 + (np.arange(NYg) + 0.5) * RES
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    g |= (X < -RX + infl) | (X > RX - infl) | (Y > RY - infl)
    inside_front = Y < -RY + infl
    door_ok = (X > DOOR['x0'] + infl) & (X < DOOR['x1'] - infl)
    g |= inside_front & ~door_ok
    g |= (Y < -RY - 0.95)
    for (x0, x1, y0, y1) in obstacles():
        g |= (X > x0 - infl) & (X < x1 + infl) & (Y > y0 - infl) & (Y < y1 + infl)
    return g, xs, ys


GRID, GX, GY = _grid()


def _cell(p):
    return (int(np.clip((p[0] + RX) / RES, 0, NXg - 1)), int(np.clip((p[1] + RY + 1.0) / RES, 0, NYg - 1)))


def _free_line(a, b, G=None):
    G = GRID if G is None else G
    n = int(math.hypot(b[0] - a[0], b[1] - a[1]) / (RES * 0.5)) + 2
    for k in range(n + 1):
        u = k / n
        c = _cell((a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u))
        if G[c]: return False
    return True


def plan(a, b):
    import heapq
    sa, sb = _cell(a), _cell(b)
    g = GRID.copy(); g[sa] = False; g[sb] = False
    # libera a vizinhança dos pontos de parada (ficam junto às máquinas)
    for s in (sa, sb):
        for i in range(-6, 7):
            for j in range(-6, 7):
                c = (min(max(s[0] + i, 0), NXg - 1), min(max(s[1] + j, 0), NYg - 1))
                if abs(i) + abs(j) <= 6: g[c] = False
    dist = {sa: 0.0}; prev = {}; pq = [(0, sa)]
    nb = [(1, 0, 1), (-1, 0, 1), (0, 1, 1), (0, -1, 1), (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)]
    while pq:
        f, c = heapq.heappop(pq)
        if c == sb: break
        for dx, dy, w in nb:
            n = (c[0] + dx, c[1] + dy)
            if not (0 <= n[0] < NXg and 0 <= n[1] < NYg) or g[n]: continue
            nd = dist[c] + w
            if nd < dist.get(n, 1e9):
                dist[n] = nd; prev[n] = c
                h = math.hypot(n[0] - sb[0], n[1] - sb[1])
                heapq.heappush(pq, (nd + h, n))
    path = [sb]
    while path[-1] != sa: path.append(prev[path[-1]])
    path = path[::-1]
    pts = [a] + [(GX[c[0]], GY[c[1]]) for c in path[1:-1]] + [b]
    # puxa o barbante (remove pontos com linha livre)
    out = [pts[0]]; i = 0
    while i < len(pts) - 1:
        j = len(pts) - 1
        while j > i + 1 and not _free_line(pts[i], pts[j], g): j -= 1
        out.append(pts[j]); i = j
    return out


def sample_path(pts, step=0.02, corner=0.45):
    """arredonda os cantos (quadrática) e reamostra por comprimento"""
    P = [np.array(p, float) for p in pts]
    if len(P) == 2:
        L = np.linalg.norm(P[1] - P[0]); n = max(int(L / step), 1)
        return [P[0] + (P[1] - P[0]) * k / n for k in range(n + 1)]
    seq = [P[0]]
    for k in range(1, len(P) - 1):
        a, b, c = P[k - 1], P[k], P[k + 1]
        ra = min(corner, np.linalg.norm(b - a) / 2); rc = min(corner, np.linalg.norm(c - b) / 2)
        p0 = b + (a - b) / np.linalg.norm(a - b) * ra; p2 = b + (c - b) / np.linalg.norm(c - b) * rc
        seq.append(p0)
        for u in np.linspace(0, 1, 12)[1:-1]:
            seq.append((1 - u) ** 2 * p0 + 2 * (1 - u) * u * b + u * u * p2)
        seq.append(p2)
    seq.append(P[-1])
    out = [seq[0]]
    for q in seq[1:]:
        d = np.linalg.norm(q - out[-1])
        if d < 1e-6: continue
        out.append(q)
    # reamostra uniforme
    cum = [0.0]
    for i in range(1, len(out)): cum.append(cum[-1] + np.linalg.norm(out[i] - out[i - 1]))
    L = cum[-1]; n = max(int(L / step), 1)
    res = []
    j = 0
    for k in range(n + 1):
        s = L * k / n
        while j < len(cum) - 2 and cum[j + 1] < s: j += 1
        u = (s - cum[j]) / max(cum[j + 1] - cum[j], 1e-9)
        res.append(out[j] + (out[j + 1] - out[j]) * u)
    return res


if __name__ == '__main__':
    for k, v in MP.items():
        print(k, 'IHM', np.round(v['stand_ihm'], 2), 'F', np.round(v['stand_f'], 2), 'B', np.round(v['stand_b'], 2), 'stub', v['stubs'])
    for a, b in [((3.6, -RY - 1.6), MP['M1']['stand_ihm']), (MP['M1']['stand_f'], MP['M1']['stand_b']), (MP['M1']['stand_b'], MP['M1']['stand_ihm']),
                 (MP['M1']['stand_ihm'], MP['M2']['stand_b']), (MP['M4']['stand_ihm'], MP['M1']['stand_b'])]:
        p = plan(a, b); L = sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))
        print(np.round(p, 2).tolist(), 'L=%.2f' % L)
