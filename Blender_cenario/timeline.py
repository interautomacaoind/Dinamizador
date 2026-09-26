# Roteiro da cena: operadora, supervisor, máquinas, tanque (tempo real em s; tempo simulado = K_SIM x real)
import math, json
import numpy as np
from layout import *

V_OP, V_SUP = 1.25, 1.10
ACC = 0.45                              # s de aceleração/frenagem

# ------------------------------------------------ ciclo da máquina (mapeamento tempo real -> tempo do clipe)
C_FECHA = (2.0, 6.0, 4.0)               # clipe 2->6 em 4 s
C_DOSA = (6.0, 15.5, 14.0)              # dosagem base
C_ATIVO = (15.5, 23.0, 6.0)             # transferência do ativo das linhas + verificação
C_MIX_IN, C_MIX_LOOP, C_MIX_OUT = (23.0, 25.0), (25.0, 33.0), (33.0, 35.0)
MIX_REAL = 50.0                         # 50 s reais = 5 min simulados
N_LOOP = 6
C_PAUSA = (35.0, 37.0, 1.5)
C_DRENO = (37.0, 47.0, 12.0)
C_ABRE = (47.0, 51.5, 4.5)
VOL_CICLO = 6 * 3.6                     # L por ciclo por máquina


class Machine:
    def __init__(self, name):
        self.name = name; self.cycles = []

    def start(self, t, auto=False):
        c = dict(n=len(self.cycles) + 1, start=t, auto=auto)
        c['fecha'] = (t + 0.3, t + 0.3 + C_FECHA[2])
        c['dosa'] = (c['fecha'][1], c['fecha'][1] + C_DOSA[2])
        c['ready'] = c['dosa'][1]
        c['inj'] = []
        self.cycles.append(c)
        return c

    def run(self, t):
        c = self.cycles[-1]
        c['run'] = t
        c['ativo'] = (t + 0.3, t + 0.3 + C_ATIVO[2])
        m0 = c['ativo'][1]
        c['mix'] = (m0, m0 + MIX_REAL)
        c['pausa'] = (c['mix'][1], c['mix'][1] + C_PAUSA[2])
        c['dreno'] = (c['pausa'][1], c['pausa'][1] + C_DRENO[2])
        c['abre'] = (c['dreno'][1], c['dreno'][1] + C_ABRE[2])
        c['end'] = c['abre'][1]
        return c

    def segments(self):
        """lista (t0, t1, c0, c1, loop) — tempo real -> tempo do clipe"""
        S = []
        for c in self.cycles:
            f0, f1 = c['fecha']; S.append((f0, f1, C_FECHA[0], C_FECHA[1], 0))
            d0, d1 = c['dosa']; S.append((d0, d1, C_DOSA[0], C_DOSA[1], 0))
            if 'run' not in c: continue
            a0, a1 = c['ativo']; S.append((a0, a1, C_ATIVO[0], C_ATIVO[1], 0))
            m0, m1 = c['mix']
            S.append((m0, m0 + 2.0, 23.0, 25.0, 0))
            S.append((m0 + 2.0, m1 - 2.0, 25.0, 25.0 + 8.0 * N_LOOP, 8.0))     # laço de 8 s de clipe
            S.append((m1 - 2.0, m1, 33.0, 35.0, 0))
            p0, p1 = c['pausa']; S.append((p0, p1, 35.0, 37.0, 0))
            r0, r1 = c['dreno']; S.append((r0, r1, 37.0, 47.0, 0))
            b0, b1 = c['abre']; S.append((b0, b1, 47.0, 51.5, 0))
        return S


# ------------------------------------------------ personagens
class Actor:
    def __init__(self, name, pos, face, v):
        self.name = name; self.t = 0.0; self.pos = tuple(pos); self.face = face; self.v = v
        self.moves = []; self.hands = []; self.look = []; self.props = []; self.grip = []; self.events = []
        self.carry = False; self.tablet = False

    # -- deslocamento
    def walk(self, to, via=None):
        pts = plan(self.pos, to) if via is None else via
        P = sample_path(pts, 0.02)
        L = sum(np.linalg.norm(P[i + 1] - P[i]) for i in range(len(P) - 1))
        dur = L / self.v + ACC
        self.moves.append(dict(type='walk', t0=self.t, t1=self.t + dur, pts=[list(map(float, p)) for p in P], L=float(L)))
        self._arms_walk(self.t, self.t + dur)
        self.t += dur; self.pos = tuple(map(float, P[-1]))
        d = P[-1] - P[-2]; self.face = math.atan2(d[1], d[0])
        return dur

    def stand(self, dur, face=None, look=None):
        f0 = self.face
        f1 = self.face if face is None else face
        self.moves.append(dict(type='stand', t0=self.t, t1=self.t + dur, pos=list(self.pos), f0=f0, f1=f1))
        if look is not None: self.look.append(dict(t0=self.t, t1=self.t + dur, target=list(look)))
        self.face = f1; self.t += dur

    def _arms_walk(self, t0, t1):
        if self.tablet:
            self.hands.append(dict(side='L', t0=t0, t1=t1, spec=['body', 0.30, 0.10, 1.12]))
            self.hands.append(dict(side='R', t0=t0, t1=t1, spec=['swing']))
        elif self.carry:
            self.hands.append(dict(side='L', t0=t0, t1=t1, spec=['body', 0.24, 0.17, 1.00]))
            self.hands.append(dict(side='R', t0=t0, t1=t1, spec=['body', 0.24, -0.15, 1.02]))
        else:
            for s in 'LR': self.hands.append(dict(side=s, t0=t0, t1=t1, spec=['swing']))

    def hand(self, side, t0, t1, spec):
        self.hands.append(dict(side=side, t0=t0, t1=t1, spec=spec))


def fwd_of(face): return (math.cos(face), math.sin(face))


def build():
    M = {m[0]: Machine(m[0]) for m in MACH}
    MPOS = {m[0]: (m[1], m[2], m[3]) for m in MACH}
    doors = []                          # (t_abre, t_fecha)
    ev = []                             # eventos gerais para a página
    op = Actor('OPERADORA', (3.60, -RY - 1.6), math.pi / 2, V_OP)
    FLASK_REST = (-2.50, -RY + 0.58, BENCH_FRASCOS['z'])
    PIP_REST = (-2.10, -RY + 0.58, BENCH_FRASCOS['z'] + 0.19)
    TABLE_SPOT = (0.35, TABLES[0]['y'] + 0.10, 0.90)
    flask_track = [dict(t0=0, mode='fixed', pos=FLASK_REST)]
    pip_track = [dict(t0=0, mode='fixed', pos=PIP_REST)]

    # ---- entrada
    op.stand(1.2, face=math.pi / 2)
    t_door = op.t
    op.walk((3.60, -RY + 0.9))
    doors.append((t_door - 0.2, op.t + 1.6))
    ev.append(dict(t=t_door - 0.2, type='porta_abre')); ev.append(dict(t=op.t + 1.6, type='porta_fecha'))

    def ihm_start(mn, auto=False):
        mp = MP[mn]
        op.walk(tuple(mp['stand_ihm']))
        t = op.t
        op.stand(3.2, face=mp['face_ihm'], look=mp['ihm'])
        fr = mp['front']
        touch = (mp['ihm'][0] + fr[0] * 0.03, mp['ihm'][1] + fr[1] * 0.03, mp['ihm'][2] - 0.02)
        btn = (mp['btn'][0] + fr[0] * 0.035, mp['btn'][1] + fr[1] * 0.035, mp['btn'][2])
        op.hand('R', t + 0.45, t + 1.55, ['world', *touch])
        op.hand('R', t + 1.75, t + 2.6, ['world', *btn])
        op.hand('R', t + 2.6, t + 3.2, ['rest'])
        op.grip.append(dict(side='R', t=t + 0.2, pose='point')); op.grip.append(dict(side='R', t=t + 2.9, pose='relax'))
        ev.append(dict(t=t + 0.95, type='ihm_toque', m=mn)); ev.append(dict(t=t + 1.2, type='ihm_toque', m=mn))
        ev.append(dict(t=t + 2.25, type='botao', m=mn))
        M[mn].start(t + 2.3)

    for mn in ('M1', 'M2', 'M3', 'M4'):
        ihm_start(mn)

    # ---- pega frasco e pipeta na bancada
    def pick_bench():
        op.walk((-2.30, -RY + 0.95))
        t = op.t
        op.stand(3.4, face=-math.pi / 2, look=(-2.4, -RY + 0.3, 0.95))
        fr = FLASK_REST; pr = PIP_REST
        op.hand('L', t + 0.3, t + 1.3, ['world', fr[0], fr[1], fr[2] + 0.07])
        op.hand('R', t + 1.2, t + 2.2, ['world', pr[0], pr[1], pr[2] + 0.06])
        op.hand('L', t + 1.3, t + 3.4, ['body', 0.24, 0.17, 1.00])
        op.hand('R', t + 2.2, t + 3.4, ['body', 0.24, -0.15, 1.02])
        op.grip.append(dict(side='L', t=t + 0.9, pose='grip')); op.grip.append(dict(side='R', t=t + 1.8, pose='pinch'))
        flask_track.append(dict(t0=t + 1.0, mode='hand', side='L'))
        pip_track.append(dict(t0=t + 1.9, mode='hand', side='R'))
        op.carry = True
    pick_bench()

    def inject(mn):
        mp = MP[mn]
        c = M[mn].cycles[-1]
        op.walk(tuple(mp['stand_inj']))
        if op.t < c['ready'] + 0.5:
            op.stand(c['ready'] + 0.5 - op.t, face=mp['face_inj'], look=mp['ihm'])
            op.hand('L', op.moves[-1]['t0'], op.t, ['body', 0.24, 0.17, 1.00]); op.hand('R', op.moves[-1]['t0'], op.t, ['body', 0.24, -0.15, 1.02])
        t = op.t
        ports = mp['ports']
        pc = np.mean([p[:2] for p in ports], 0)
        lf = mp['left']
        # frasco na mão esquerda, sobre a estação, à esquerda das portas
        fwd = fwd_of(mp['face_inj'])
        lat = (-fwd[1], fwd[0])                     # esquerda da operadora
        fl = (pc[0] + lf[0] * 0.12 + lat[0] * 0.20, pc[1] + lf[1] * 0.12 + lat[1] * 0.20, 1.13)
        DT = 2.45
        n = len(ports)
        op.stand(0.8 + n * DT + 1.6, face=mp['face_inj'], look=(pc[0], pc[1], 1.05))
        op.hand('L', t + 0.2, t + 0.8 + n * DT + 0.4, ['world', *fl])
        # pipeta: mão direita — ponta da pipeta ~0,22 m abaixo da mão
        for k, p in enumerate(ports):
            tk = t + 0.8 + k * DT
            op.hand('R', tk, tk + 0.9, ['world', fl[0], fl[1], fl[2] + 0.12])           # aspira no frasco
            op.hand('R', tk + 0.9, tk + 1.6, ['world', p[0], p[1], p[2] + 0.205])       # vai ao funil
            op.hand('R', tk + 1.6, tk + DT, ['world', p[0], p[1], p[2] + 0.19])        # dispensa
            c['inj'].append(tk + 2.1)
            ev.append(dict(t=tk + 2.1, type='injeta', m=mn, p=k + 1))
        tb = t + 0.8 + n * DT
        b = mp['btn_inj']
        op.hand('R', tb + 0.05, tb + 0.95, ['world', b[0] + lf[0] * 0.01, b[1] + lf[1] * 0.01, b[2] + 0.09])
        op.hand('L', tb + 0.4, tb + 1.6, ['body', 0.24, 0.17, 1.00])
        op.hand('R', tb + 0.95, tb + 1.6, ['body', 0.24, -0.15, 1.02])
        ev.append(dict(t=tb + 0.6, type='botao', m=mn))
        M[mn].run(tb + 0.65)

    def put_table():
        op.walk((TABLE_SPOT[0], TABLE_SPOT[1] - 0.72))
        t = op.t
        op.stand(2.6, face=math.pi / 2, look=TABLE_SPOT)
        op.hand('L', t + 0.2, t + 1.1, ['world', TABLE_SPOT[0] - 0.12, TABLE_SPOT[1], TABLE_SPOT[2] + 0.07])
        op.hand('R', t + 0.6, t + 1.6, ['world', TABLE_SPOT[0] + 0.10, TABLE_SPOT[1] - 0.05, TABLE_SPOT[2] + 0.03])
        op.hand('L', t + 1.1, t + 2.6, ['rest']); op.hand('R', t + 1.6, t + 2.6, ['rest'])
        op.grip.append(dict(side='L', t=t + 1.2, pose='relax')); op.grip.append(dict(side='R', t=t + 1.7, pose='relax'))
        flask_track.append(dict(t0=t + 0.9, mode='fixed', pos=(TABLE_SPOT[0] - 0.12, TABLE_SPOT[1], TABLE_SPOT[2])))
        pip_track.append(dict(t0=t + 1.4, mode='fixed_flat', pos=(TABLE_SPOT[0] + 0.10, TABLE_SPOT[1] - 0.15, TABLE_SPOT[2] + 0.006)))
        op.carry = False

    def pick_table():
        op.walk((TABLE_SPOT[0], TABLE_SPOT[1] - 0.72))
        t = op.t
        op.stand(2.8, face=math.pi / 2, look=TABLE_SPOT)
        op.hand('L', t + 0.2, t + 1.1, ['world', TABLE_SPOT[0] - 0.12, TABLE_SPOT[1], TABLE_SPOT[2] + 0.07])
        op.hand('R', t + 0.6, t + 1.6, ['world', TABLE_SPOT[0] + 0.10, TABLE_SPOT[1] - 0.05, TABLE_SPOT[2] + 0.03])
        op.hand('L', t + 1.1, t + 2.8, ['body', 0.24, 0.17, 1.00]); op.hand('R', t + 1.6, t + 2.8, ['body', 0.24, -0.15, 1.02])
        op.grip.append(dict(side='L', t=t + 0.8, pose='grip')); op.grip.append(dict(side='R', t=t + 1.3, pose='pinch'))
        flask_track.append(dict(t0=t + 0.9, mode='hand', side='L'))
        pip_track.append(dict(t0=t + 1.4, mode='hand', side='R'))
        op.carry = True

    # ---- 1ª rodada de injeção
    for mn in ('M1', 'M2', 'M3', 'M4'):
        inject(mn)
    put_table()
    # fim do ciclo 1 -> as máquinas reiniciam sozinhas (programadas para 2 ciclos)
    for mn in M:
        c1 = M[mn].cycles[0]
        M[mn].start(c1['end'] + 2.0, auto=True)
    # espera o M1 ficar pronto olhando a TV
    t_ready = M['M1'].cycles[1]['ready']
    if op.t < t_ready - 8:
        op.walk((0.9, 2.9))
        op.stand(max(t_ready - 9 - op.t, 1.0), face=math.pi / 2, look=(TV['x'], TV['y'], TV['zc']))
    pick_table()
    for mn in ('M1', 'M2', 'M3', 'M4'):
        inject(mn)
    put_table()
    # ronda de inspeção até o fim do ciclo 2
    t_end2 = max(M[mn].cycles[1]['end'] for mn in M)
    rounds = [((-1.6, -2.6), 'M4'), ((-1.6, 2.2), 'M3'), ((0.9, 2.9), None), ((1.6, 1.0), 'M2')]
    for (p, mn) in rounds:
        if op.t > t_end2 - 16: break
        op.walk(p)
        look = MP[mn]['ihm'] if mn else (TV['x'], TV['y'], TV['zc'])
        op.stand(6.0, look=look, face=math.atan2(look[1] - p[1], look[0] - p[0]))
    # vai ao painel e liga a transferência
    op.walk((PANEL['x'] - 0.07, PANEL['y'] - 0.62))
    if op.t < t_end2 + 1.0:
        op.stand(t_end2 + 1.0 - op.t, face=math.pi / 2, look=(TV['x'], TV['y'], TV['zc']))
    t = op.t
    op.stand(2.4, face=math.pi / 2, look=(PANEL['x'], PANEL['y'], 1.2))
    bt = (PANEL['x'] - 0.07, PANEL['y'] - 0.07 - 0.035, 1.16)
    op.hand('R', t + 0.4, t + 1.4, ['world', *bt]); op.hand('R', t + 1.4, t + 2.4, ['rest'])
    op.grip.append(dict(side='R', t=t + 0.2, pose='point')); op.grip.append(dict(side='R', t=t + 2.2, pose='relax'))
    t_transf = t + 1.0
    ev.append(dict(t=t_transf, type='botao_transf'))
    TR_DUR = 30.0
    op.stand(TR_DUR + 4.0, face=math.pi / 2, look=(TANK['x'], TANK['y'], 1.2))
    T_END = op.t + 3.0

    # ---- supervisor: entra no meio do 1º ciclo completo
    c = M['M1'].cycles[0]
    t_sup = (c['start'] + c['end']) / 2
    sp = Actor('SUPERVISOR', (3.75, -RY - 1.6), math.pi / 2, V_SUP)
    sp.tablet = True
    sp.hands.append(dict(side='L', t0=0, t1=t_sup, spec=['body', 0.30, 0.10, 1.12]))
    sp.stand(t_sup, face=math.pi / 2)
    t_d = sp.t
    sp.walk((3.75, -RY + 0.9))
    doors.append((t_d - 0.2, sp.t + 1.6))
    ev.append(dict(t=t_d - 0.2, type='porta_abre')); ev.append(dict(t=sp.t + 1.6, type='porta_fecha'))
    stops = [((1.35, -3.6), MP['M1']['ihm']), ((1.35, 1.3), MP['M2']['ihm']), ((0.3, 5.6), (TV['x'], TV['y'], TV['zc'])),
             ((-1.35, 2.6), MP['M3']['ihm']), ((-1.35, -2.4), MP['M4']['ihm'])]
    for (p, look) in stops:
        sp.walk(p)
        t = sp.t
        sp.stand(4.5, face=math.atan2(look[1] - p[1], look[0] - p[0]), look=look)
        sp.hands.append(dict(side='L', t0=t, t1=t + 4.5, spec=['body', 0.30, 0.10, 1.12]))
        sp.hands.append(dict(side='R', t0=t + 1.0, t1=t + 3.0, spec=['body', 0.33, 0.02, 1.15]))
        sp.hands.append(dict(side='R', t0=t + 3.0, t1=t + 4.5, spec=['rest']))
        sp.look.append(dict(t0=t + 1.0, t1=t + 3.0, target=['tablet']))
        ev.append(dict(t=t + 1.6, type='tablet_toque'))
    sp.walk((3.75, -RY + 0.9))
    t_d = sp.t
    sp.walk((3.75, -RY - 1.6))
    doors.append((t_d - 0.8, sp.t + 0.4))
    ev.append(dict(t=t_d - 0.8, type='porta_abre')); ev.append(dict(t=sp.t + 0.4, type='porta_fecha'))
    sp.stand(max(T_END - sp.t, 0.1), face=-math.pi / 2)

    # garante as mãos da operadora até o fim
    op.stand(max(T_END - op.t, 0.1), face=math.pi / 2)

    # ---- tanque de passagem: volume (L) ao longo do tempo
    vol = [(0.0, 0.0)]
    evs = []
    for mn, m in M.items():
        for c in m.cycles:
            if 'dreno' in c: evs.append((c['dreno'][0], c['dreno'][1]))
    tk = sorted(set([0.0] + [a for a, b in evs] + [b for a, b in evs] + [t_transf + 1.5, t_transf + 1.5 + TR_DUR, T_END]))
    def V(t):
        v = 0.0
        for a, b in evs: v += VOL_CICLO * min(max((t - a) / (b - a), 0), 1)
        vt = v * min(max((t - (t_transf + 1.5)) / TR_DUR, 0), 1)
        return v - vt
    tank = [(float(t), float(V(t))) for t in np.arange(0, T_END + 0.25, 0.25)]
    for mn, m in M.items():
        for c in m.cycles:
            ev.append(dict(t=c['start'], type='ciclo_inicio', m=mn, n=c['n']))
            if 'end' in c: ev.append(dict(t=c['end'], type='ciclo_fim', m=mn, n=c['n']))
    ev.sort(key=lambda e: e['t'])
    out = dict(T_END=T_END, K=K_SIM, SIM_T0=SIM_T0, VOL_CICLO=VOL_CICLO, MIX_REAL=MIX_REAL,
               machines={mn: dict(pos=MPOS[mn], cycles=m.cycles, segments=m.segments()) for mn, m in M.items()},
               doors=doors, events=ev, tank=tank, transfer=dict(t=t_transf, t0=t_transf + 1.5, t1=t_transf + 1.5 + TR_DUR),
               actors={a.name: dict(moves=a.moves, hands=a.hands, look=a.look, grip=a.grip) for a in (op, sp)},
               props=dict(FRASCO=flask_track, PIPETA=pip_track), sup_window=(t_sup, sp.moves[-2]['t1'] if len(sp.moves) > 1 else T_END))
    return out


if __name__ == '__main__':
    P = build()
    for mn, m in P['machines'].items():
        for c in m['cycles']:
            print(mn, c['n'], 'start %.1f ready %.1f run %.1f end %.1f' % (c['start'], c['ready'], c.get('run', -1), c.get('end', -1)))
    print('transfer', P['transfer'], 'T_END', P['T_END'], 'sup', P['sup_window'])
    json.dump(P, open('/home/claude/sala/out/plano.json', 'w'))
