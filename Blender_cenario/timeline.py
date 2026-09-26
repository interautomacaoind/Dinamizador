# Roteiro da cena: operadora, supervisor, máquinas, tanque (tempo real em s; tempo simulado = K_SIM x real)
import math, json
import numpy as np
from layout import *

V_OP, V_SUP = 1.25, 1.10
ACC = 0.45                              # s de aceleração/frenagem

# ------------------------------------------------ ciclo da máquina (mapeamento tempo real -> tempo do clipe)
# REV17 — ciclo-alvo de 8 min (tempos SIMULADOS entre parênteses; real = simulado / K_SIM)
#   fechar cabeçotes 0:08 · dosar 21,6 L em paralelo (6 válvulas, ~32 L/min) 0:40 · PIPETAGEM MANUAL (operadora, sensores P1–P6 + CONFIRMAR)
#   mistura 5:00 (fixa) · estabilizar 0:05 · drenar p/ TQ-01 0:35 · abrir cabeçotes 0:08
S = lambda sim: sim / K_SIM
C_FECHA = (2.0, 6.0, S(8))              # clipe 2->6
C_DOSA = (6.0, 15.5, S(40))             # dosagem da solução hidroalcoólica 20 %
C_PASSA = (15.5, 23.0, 0.3)             # trecho do clipe do antigo ativo por linha: passa direto
MIX_REAL = S(300)                       # 5 min simulados
N_LOOP = 12
C_PAUSA = (35.0, 37.0, S(5))
C_DRENO = (37.0, 47.0, S(35))
C_ABRE = (47.0, 51.5, S(8))
VOL_CICLO = 6 * 3.6                     # L por ciclo por máquina


class Machine:
    def __init__(self, name):
        self.name = name; self.cycles = []

    def start(self, t, auto=False):
        c = dict(n=len(self.cycles) + 1, start=t, auto=auto)
        c['fecha'] = (t + 0.3, t + 0.3 + C_FECHA[2])
        c['dosa'] = (c['fecha'][1], c['fecha'][1] + C_DOSA[2])
        c['ready'] = c['dosa'][1]
        c['pip'] = {}                   # P1..P6 -> instante em que o sensor registrou a ponteira
        c['tampas'] = {}                # P1..P6 -> (abre, fecha)
        c['portas'] = []                # (lado 'F'/'T', abre, fecha)
        self.cycles.append(c)
        return c

    def run(self, t):
        c = self.cycles[-1]
        c['run'] = t                    # CONFIRMAR na IHM (validação dos 6 registros)
        m0 = t + C_PASSA[2]
        c['mix'] = (m0, m0 + MIX_REAL)
        c['pausa'] = (c['mix'][1], c['mix'][1] + C_PAUSA[2])
        c['dreno'] = (c['pausa'][1], c['pausa'][1] + C_DRENO[2])
        c['abre'] = (c['dreno'][1], c['dreno'][1] + C_ABRE[2])
        c['end'] = c['abre'][1]
        return c

    def segments(self):
        """lista (t0, t1, c0, c1, loop) — tempo real -> tempo do clipe"""
        S_ = []
        for c in self.cycles:
            f0, f1 = c['fecha']; S_.append((f0, f1, C_FECHA[0], C_FECHA[1], 0))
            d0, d1 = c['dosa']; S_.append((d0, d1, C_DOSA[0], C_DOSA[1], 0))
            if 'run' not in c: continue
            S_.append((c['run'], c['run'] + C_PASSA[2], C_PASSA[0], C_PASSA[1], 0))
            m0, m1 = c['mix']
            S_.append((m0, m0 + 2.0, 23.0, 25.0, 0))
            S_.append((m0 + 2.0, m1 - 2.0, 25.0, 25.0 + 8.0 * N_LOOP, 8.0))     # laço de 8 s de clipe
            S_.append((m1 - 2.0, m1, 33.0, 35.0, 0))
            p0, p1 = c['pausa']; S_.append((p0, p1, 35.0, 37.0, 0))
            r0, r1 = c['dreno']; S_.append((r0, r1, 37.0, 47.0, 0))
            b0, b1 = c['abre']; S_.append((b0, b1, 47.0, 51.5, 0))
        return S_


# ------------------------------------------------ personagens
class Actor:
    def __init__(self, name, pos, face, v):
        self.name = name; self.t = 0.0; self.pos = tuple(pos); self.face = face; self.v = v
        self.moves = []; self.hands = []; self.look = []; self.props = []; self.grip = []; self.events = []
        self.carry = False; self.tablet = False; self.smile = []

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
            self.hands.append(dict(side='L', t0=t0, t1=t1, spec=list(CARRY_L)))
            self.hands.append(dict(side='R', t0=t0, t1=t1, spec=list(CARRY_R)))
        else:
            for s in 'LR': self.hands.append(dict(side=s, t0=t0, t1=t1, spec=['swing']))

    def hand(self, side, t0, t1, spec):
        self.hands.append(dict(side=side, t0=t0, t1=t1, spec=spec))


def fwd_of(face): return (math.cos(face), math.sin(face))


CARRY_L = ('body', 0.26, 0.19, 1.02)        # frasco âmbar 1 L na mão esquerda (segura pelo gargalo)
CARRY_R = ('body', 0.22, -0.16, 1.10)       # pipetador + pipeta sorológica 50 mL na direita
PIP_LEN = 0.42                              # mão -> ponta da pipeta
PIP_TILT = math.radians(22)                 # pipeta inclinada p/ frente (ponta afastada da operadora)
FLASK_TOP = 0.06                            # topo do frasco acima da mão esquerda


def build():
    M = {m[0]: Machine(m[0]) for m in MACH}
    MPOS = {m[0]: (m[1], m[2], m[3]) for m in MACH}
    doors = []                          # porta da sala: (t_abre, t_fecha)
    ev = []                             # eventos gerais para a página
    op = Actor('OPERADORA', (3.60, -RY - 1.6), math.pi / 2, V_OP)
    bz = BENCH_FRASCOS['z']
    FLASK_REST = (-1.55, -RY + 0.40, bz)            # frasco 1 L do ciclo (bancada)
    FLASK2_REST = (-1.40, -RY + 0.40, bz)           # segundo frasco 1 L (troca após a 1ª rodada)
    PIP_REST = (-1.15, -RY + 0.42, bz + 0.03)
    BENCH_SPOT = (-1.35, -RY + 0.98)
    flask_track = [dict(t0=0, mode='fixed', pos=FLASK_REST)]
    flask2_track = [dict(t0=0, mode='fixed', pos=FLASK2_REST)]
    pip_track = [dict(t0=0, mode='fixed_flat', pos=PIP_REST)]
    STAGGER = S(120)                    # partida escalonada: 2:00 simulados entre máquinas
    ORDER = ('M1', 'M2', 'M3', 'M4')

    # ---- entrada
    op.stand(1.2, face=math.pi / 2)
    t_door = op.t
    op.walk((3.60, -RY + 0.9))
    doors.append((t_door - 0.2, op.t + 1.6))
    ev.append(dict(t=t_door - 0.2, type='porta_abre')); ev.append(dict(t=op.t + 1.6, type='porta_fecha'))

    def ihm_touch(mn, kind, dur=3.0):
        mp = MP[mn]
        op.walk(tuple(mp['stand_ihm']))
        t = op.t
        op.stand(dur, face=mp['face_ihm'], look=mp['ihm'])
        fr = mp['front']
        touch = (mp['ihm'][0] + fr[0] * 0.03, mp['ihm'][1] + fr[1] * 0.03, mp['ihm'][2] - 0.03)
        if op.carry:                    # toca com o nó do dedo da mão direita, sem soltar o pipetador
            op.hand('R', t + 0.3, t + dur - 0.6, ['world', *touch])
            op.hand('R', t + dur - 0.6, t + dur, list(CARRY_R)); op.hand('L', t, t + dur, list(CARRY_L))
        else:
            btn = (mp['btn'][0] + fr[0] * 0.035, mp['btn'][1] + fr[1] * 0.035, mp['btn'][2])
            op.hand('R', t + 0.35, t + 1.35, ['world', *touch])
            op.hand('R', t + 1.5, t + dur - 0.6, ['world', *btn])
            op.hand('R', t + dur - 0.6, t + dur, ['rest'])
            op.grip.append(dict(side='R', t=t + 0.2, pose='point')); op.grip.append(dict(side='R', t=t + dur - 0.3, pose='relax'))
        ev.append(dict(t=t + 0.9, type='ihm_toque', m=mn)); ev.append(dict(t=t + 1.3, type='ihm_toque', m=mn))
        tb = t + dur - 0.9
        ev.append(dict(t=tb, type='botao', m=mn, kind=kind))
        return tb

    # ---- partida escalonada: um toque na IHM da M1 programa as 4 máquinas (rede dos CLPs)
    t0 = ihm_start = ihm_touch('M1', 'partida_escalonada', 3.4)
    for k, mn in enumerate(ORDER):
        M[mn].start(t0 + 0.2 + k * STAGGER)
    ev.append(dict(t=t0, type='partida_escalonada', starts={mn: M[mn].cycles[0]['start'] for mn in ORDER}))

    # ---- pega frasco 1 L e pipetador na bancada
    def pick_bench(track, rest):
        op.walk(BENCH_SPOT)
        t = op.t
        op.stand(3.0, face=-math.pi / 2, look=(rest[0], rest[1], bz))
        op.hand('L', t + 0.2, t + 1.1, ['world', rest[0], rest[1], rest[2] + 0.17])
        op.hand('R', t + 1.0, t + 1.9, ['world', PIP_REST[0], PIP_REST[1], PIP_REST[2] + 0.04])
        op.hand('L', t + 1.1, t + 3.0, list(CARRY_L)); op.hand('R', t + 1.9, t + 3.0, list(CARRY_R))
        op.grip.append(dict(side='L', t=t + 0.8, pose='grip')); op.grip.append(dict(side='R', t=t + 1.6, pose='grip'))
        track.append(dict(t0=t + 0.9, mode='hand', side='L'))
        pip_track.append(dict(t0=t + 1.7, mode='hand', side='R'))
        op.carry = True

    def swap_flask():                   # devolve o frasco vazio e pega o cheio
        op.walk(BENCH_SPOT)
        t = op.t
        op.stand(2.6, face=-math.pi / 2, look=(FLASK_REST[0], FLASK_REST[1], bz))
        op.hand('L', t + 0.2, t + 1.0, ['world', FLASK_REST[0], FLASK_REST[1], FLASK_REST[2] + 0.17])
        op.hand('L', t + 1.0, t + 1.8, ['world', FLASK2_REST[0], FLASK2_REST[1], FLASK2_REST[2] + 0.17])
        op.hand('L', t + 1.8, t + 2.6, list(CARRY_L)); op.hand('R', t, t + 2.6, list(CARRY_R))
        flask_track.append(dict(t0=t + 0.9, mode='fixed', pos=FLASK_REST))
        flask2_track.append(dict(t0=t + 1.6, mode='hand', side='L'))
        ev.append(dict(t=t + 1.0, type='frasco_troca'))

    def put_bench():
        op.walk(BENCH_SPOT)
        t = op.t
        op.stand(2.8, face=-math.pi / 2, look=(FLASK_REST[0], FLASK_REST[1], bz))
        op.hand('L', t + 0.2, t + 1.1, ['world', FLASK2_REST[0], FLASK2_REST[1], FLASK2_REST[2] + 0.17])
        op.hand('R', t + 0.9, t + 1.8, ['world', PIP_REST[0], PIP_REST[1], PIP_REST[2] + 0.04])
        op.hand('L', t + 1.1, t + 2.8, ['rest']); op.hand('R', t + 1.8, t + 2.8, ['rest'])
        op.grip.append(dict(side='L', t=t + 1.2, pose='relax')); op.grip.append(dict(side='R', t=t + 1.9, pose='relax'))
        flask2_track.append(dict(t0=t + 1.0, mode='fixed', pos=FLASK2_REST))
        pip_track.append(dict(t0=t + 1.7, mode='fixed_flat', pos=PIP_REST))
        op.carry = False

    # ---- pipetagem de um lado (3 garrafões) com as portas daquele lado abertas
    DT_BOT = 2.3                        # s reais por garrafão (≈ 7 s simulados: abre tampa, aspira 30 mL, dispensa, fecha)
    def side(mn, lado):
        mp = MP[mn]; c = M[mn].cycles[-1]
        m = [x for x in MACH if x[0] == mn][0]
        idx = (0, 1, 2) if lado == 'F' else (3, 4, 5)
        sgn = -1 if lado == 'F' else 1
        face = mp['face_f'] if lado == 'F' else mp['face_b']
        f = fwd_of(face); l = (-f[1], f[0])
        # ordem: do garrafão mais próximo de onde ela chega
        stands = [to_world(m, (PORTS_L[k][0], sgn * (DOOR_PLANE + 0.25))) for k in idx]
        if math.dist(op.pos, stands[2]) < math.dist(op.pos, stands[0]):
            idx = idx[::-1]; stands = stands[::-1]
        op.walk(tuple(stands[1]))
        if op.t < c['ready'] + 0.05:    # máquina ainda dosando: espera olhando a IHM/torre
            w0 = op.t
            op.stand(c['ready'] + 0.05 - op.t, face=face, look=mp['ihm'])
            op.hand('L', w0, op.t, list(CARRY_L)); op.hand('R', w0, op.t, list(CARRY_R))
        # abre as duas folhas (mão direita na maçaneta)
        t = op.t
        dm = to_world(m, (0.05, sgn * (DOOR_PLANE + 0.03), 1.10))
        op.stand(1.0, face=face, look=(dm[0], dm[1], 1.3))
        op.hand('R', t + 0.1, t + 0.7, ['world', *dm]); op.hand('R', t + 0.7, t + 1.0, list(CARRY_R)); op.hand('L', t, t + 1.0, list(CARRY_L))
        t_open = t + 0.45
        ev.append(dict(t=t_open, type='porta_maq_abre', m=mn, lado=lado))
        first = True
        for k, st in zip(idx, stands):
            if not first or math.dist(op.pos, st) > 0.05:
                op.walk(tuple(st))
            first = False
            t = op.t
            op.stand(DT_BOT, face=face, look=to_world(m, PORTS_L[k]))
            port = to_world(m, PORTS_L[k])
            d = (f[0] * math.sin(PIP_TILT), f[1] * math.sin(PIP_TILT), -math.cos(PIP_TILT))
            tipz = port[2] - 0.02
            hand_disp = (port[0] - d[0] * PIP_LEN, port[1] - d[1] * PIP_LEN, tipz - d[2] * PIP_LEN)
            hand_app = (hand_disp[0], hand_disp[1], hand_disp[2] + 0.07)
            # aspira no frasco (mão esquerda à frente/esquerda do corpo)
            fx = 0.26 + 0.035; fz = CARRY_L[3] + FLASK_TOP - 0.08
            asp = ['body', fx - math.sin(PIP_TILT) * PIP_LEN, 0.19, fz + math.cos(PIP_TILT) * PIP_LEN]
            op.hand('L', t, t + DT_BOT, list(CARRY_L))
            op.hand('R', t + 0.05, t + 0.75, asp)
            op.hand('R', t + 0.75, t + 1.25, ['world', *hand_app])
            op.hand('R', t + 1.25, t + 2.05, ['world', *hand_disp])
            op.hand('R', t + 2.05, t + DT_BOT, ['world', *hand_app])
            pk = f'P{k + 1}'
            c['tampas'][pk] = (t + 0.95, t + 2.25)
            c['pip'][pk] = t + 1.35
            ev.append(dict(t=t + 1.35, type='pipeta', m=mn, p=k + 1))
        # fecha as portas
        t = op.t
        dm = to_world(m, (-0.05 if idx[0] < idx[-1] else 0.05, sgn * (DOOR_PLANE + 0.03), 1.10))
        op.stand(0.9, face=face, look=(dm[0], dm[1], 1.3))
        op.hand('R', t + 0.05, t + 0.6, ['world', *dm]); op.hand('R', t + 0.6, t + 0.9, list(CARRY_R)); op.hand('L', t, t + 0.9, list(CARRY_L))
        t_close = t + 0.55
        c['portas'].append((lado, t_open, t_close))
        ev.append(dict(t=t_close, type='porta_maq_fecha', m=mn, lado=lado))

    def serve(mn):
        side(mn, 'T')                   # traseira primeiro (chega de fora do corredor)
        side(mn, 'F')                   # frente
        tb = ihm_touch(mn, 'confirmar', 2.2)   # CONFIRMAR: o CLP confere os 6 registros dos sensores
        M[mn].run(tb + 0.25)

    # ---- 1ª rodada
    pick_bench(flask_track, FLASK_REST)
    for mn in ORDER:
        serve(mn)
    # máquinas programadas para 2 ciclos: reiniciam sozinhas 2 s após abrir os cabeçotes
    for mn in M:
        M[mn].start(M[mn].cycles[0]['end'] + S(6), auto=True)
    swap_flask()
    for mn in ORDER:
        serve(mn)
    put_bench()

    # ---- ronda de inspeção até o fim do 2º ciclo
    t_end2 = max(M[mn].cycles[1]['end'] for mn in M)
    rounds = [((-1.5, -1.3), 'M4'), ((-1.5, 1.4), 'M3'), ((0.0, 1.9), None), ((1.5, 1.4), 'M2'), ((1.5, -1.3), 'M1')]
    k = 0
    while op.t < t_end2 - 14:
        p, mn = rounds[k % len(rounds)]; k += 1
        op.walk(p)
        look = MP[mn]['ihm'] if mn else (TV['x'], TV['y'], TV['zc'])
        op.stand(min(7.0, max(t_end2 - 10 - op.t, 1.0)), look=look, face=math.atan2(look[1] - p[1], look[0] - p[0]))
    # painel do TQ-01: liga a transferência
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
    TR_DUR = S(90)                      # 172,8 L em 1:30 simulados (~115 L/min)
    t_tr1 = t_transf + 1.5 + TR_DUR
    op.stand(t_tr1 + 1.5 - op.t, face=math.pi / 2, look=(TANK['x'], TANK['y'], 1.2))

    # ---- supervisor: ronda com tablet no 1º ciclo
    c = M['M2'].cycles[0]
    t_sup = c['mix'][0] + 4.0
    sp = Actor('SUPERVISOR', (3.75, -RY - 1.6), math.pi / 2, V_SUP)
    sp.tablet = True
    sp.hands.append(dict(side='L', t0=0, t1=t_sup, spec=['body', 0.30, 0.10, 1.12]))
    sp.stand(t_sup, face=math.pi / 2)
    t_d = sp.t
    sp.walk((3.75, -RY + 0.9))
    doors.append((t_d - 0.2, sp.t + 1.6))
    ev.append(dict(t=t_d - 0.2, type='porta_abre')); ev.append(dict(t=sp.t + 1.6, type='porta_fecha'))
    stops = [((1.4, -3.5), MP['M1']['ihm']), ((1.4, 0.9), MP['M2']['ihm']), ((0.0, 1.9), (TV['x'], TV['y'], TV['zc'])),
             ((-1.4, 3.3), MP['M3']['ihm']), ((-1.4, -0.9), MP['M4']['ihm'])]
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
    sup_out = sp.t

    # ---- PAUSA DO CAFÉ: o supervisor abre a porta e apita; TV mostra a pausa; a operadora sorri e sai
    t_cafe = max(op.t, t_tr1) + 0.5
    sp.stand(t_cafe - sp.t, face=math.pi / 2)
    t_d = sp.t
    sp.walk((3.55, -RY + 0.75))
    t_in = sp.t
    t_w = t_in + 0.5                    # apito (2 trilos)
    sp.stand(3.4, face=math.atan2(PANEL['y'] - 0.6 - (-RY + 0.75), PANEL['x'] - 3.55), look=(PANEL['x'], PANEL['y'] - 0.6, 1.5))
    sp.hands.append(dict(side='L', t0=t_in, t1=t_in + 3.4, spec=['body', 0.30, 0.10, 1.12]))
    sp.hands.append(dict(side='R', t0=t_in + 0.0, t1=t_in + 2.4, spec=['body', 0.10, -0.02, 1.58]))
    sp.hands.append(dict(side='R', t0=t_in + 2.4, t1=t_in + 3.4, spec=['rest']))
    sp.grip.append(dict(side='R', t=t_in + 0.1, pose='pinch')); sp.grip.append(dict(side='R', t=t_in + 2.5, pose='relax'))
    ev.append(dict(t=t_w, type='apito')); ev.append(dict(t=t_w + 0.9, type='apito'))
    # operadora: vira para a porta, sorri e vai para a pausa
    op.stand(t_w + 0.6 - op.t, face=math.pi / 2, look=(TANK['x'], TANK['y'], 1.2))
    t = op.t
    op.stand(1.4, face=math.atan2(-RY + 0.75 - op.pos[1], 3.55 - op.pos[0]), look=(3.55, -RY + 0.75, 1.6))
    op.smile.append((t + 0.2, 1.0))
    sp.walk((3.75, -RY - 1.9))
    sp_exit = sp.t
    op.walk((3.60, -RY + 0.9))
    op.walk((3.45, -RY - 1.5))
    doors.append((t_d - 0.2, op.t + 0.3))
    ev.append(dict(t=t_d - 0.2, type='porta_abre')); ev.append(dict(t=op.t + 0.3, type='porta_fecha'))
    T_END = max(op.t + 4.0, t_w + 12.0 + 5.0)
    sp.stand(max(T_END - sp.t, 0.1), face=-math.pi / 2)
    op.stand(max(T_END - op.t, 0.1), face=-math.pi / 2)
    cafe = dict(t=t_w, tv0=t_w - 0.1, tv1=t_w + 12.0, sup_in=t_d - 0.5)

    # ---- tanque de passagem: volume (L) ao longo do tempo
    evs = []
    for mn, m in M.items():
        for c in m.cycles:
            if 'dreno' in c: evs.append((c['dreno'][0], c['dreno'][1]))
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
    out = dict(T_END=T_END, K=K_SIM, SIM_T0=SIM_T0, VOL_CICLO=VOL_CICLO, MIX_REAL=MIX_REAL, STAGGER=STAGGER,
               machines={mn: dict(pos=MPOS[mn], cycles=m.cycles, segments=m.segments()) for mn, m in M.items()},
               doors=doors, events=ev, tank=tank, transfer=dict(t=t_transf, t0=t_transf + 1.5, t1=t_tr1),
               actors={a.name: dict(moves=a.moves, hands=a.hands, look=a.look, grip=a.grip, smile=a.smile) for a in (op, sp)},
               props=dict(FRASCO=flask_track, FRASCO2=flask2_track, PIPETA=pip_track),
               sup_windows=[(t_sup, sup_out), (cafe['sup_in'], sp_exit + 0.5)], cafe=cafe, pip_tilt=PIP_TILT, pip_len=PIP_LEN)
    return out


if __name__ == '__main__':
    P = build()
    for mn, m in P['machines'].items():
        for c in m['cycles']:
            K = P['K']
            print(mn, c['n'], 'start %.1f ready %.1f run %.1f end %.1f | espera %.0fs pipetagem %s ciclo %s' % (c['start'], c['ready'], c.get('run', -1), c.get('end', -1),
                  (min(c['pip'].values()) - c['ready']) * K, '%d:%02d' % divmod((c['run'] - c['ready']) * K, 60), '%d:%02d' % divmod((c['end'] - c['start']) * K, 60)))
    print('transfer', P['transfer'], 'T_END %.1f' % P['T_END'], 'sup', P['sup_windows'], 'cafe', P['cafe'])
    json.dump(P, open('/home/claude/sala/out/plano.json', 'w'))
