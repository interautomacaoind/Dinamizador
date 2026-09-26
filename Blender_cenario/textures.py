# texturas procedurais da sala
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
T = '/home/claude/sala/tex/'
rng = np.random.default_rng(7)
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def noise(n, scales=(4, 16, 64), amps=(0.5, 0.3, 0.2)):
    out = np.zeros((n, n))
    for s, a in zip(scales, amps):
        g = rng.random((s + 1, s + 1)); g[-1, :] = g[0, :]; g[:, -1] = g[:, 0]
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((n + n // s, n + n // s), Image.BICUBIC)
        out += a * (np.asarray(im)[:n, :n] / 255.0)
    return out


def save(a, name):
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(T + name)


# piso epóxi cinza (sRGB) com leve granulado e manchas suaves
n = 1024
b = noise(n, (3, 9), (0.6, 0.4))
fine = rng.random((n, n))
v = 0.50 + 0.035 * (b - 0.5) + 0.018 * (fine - 0.5)
spk = rng.random((n, n)) > 0.9985
v[spk] -= 0.10
save(np.stack([v * 0.97, v * 0.99, v * 1.02], -1), 'epoxi_cinza.png')

# mármore branco (Carrara) com veios suaves
n = 1024
x, y = np.meshgrid(np.linspace(0, 1, n), np.linspace(0, 1, n))
t = noise(n, (2, 4, 9), (0.55, 0.3, 0.15))
t2 = noise(n, (3, 7, 20), (0.5, 0.35, 0.15))
s1 = np.abs(np.sin((x * 1.6 + y * 0.9 + t * 1.8) * np.pi * 1.5))
s2 = np.abs(np.sin((x * 0.7 - y * 1.9 + t2 * 2.2) * np.pi * 2.3))
vein = np.exp(-s1 / 0.035) * (0.4 + 0.6 * noise(n, (6, 24), (0.6, 0.4)))
vein2 = np.exp(-s2 / 0.02) * 0.5
cloud = noise(n, (5, 17, 60), (0.5, 0.3, 0.2))
g = 0.93 + 0.035 * (cloud - 0.5) - 0.28 * vein - 0.12 * vein2
im = Image.fromarray((np.clip(np.stack([g * 0.985, g * 0.985, g * 0.99], -1), 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
im.save(T + 'marmore.png')

# sombra de contato (radial suave, alfa)
n = 256
x, y = np.meshgrid(np.linspace(-1, 1, n), np.linspace(-1, 1, n))
r = np.maximum(np.abs(x), np.abs(y)) * 0.55 + np.hypot(x, y) * 0.45
a = np.clip(1 - r, 0, 1) ** 1.6
img = np.zeros((n, n, 4)); img[..., 3] = a * 0.85
Image.fromarray((img * 255).astype(np.uint8), 'RGBA').save(T + 'sombra.png')
r = np.hypot(x, y)
a = np.clip(1 - r, 0, 1) ** 1.4
img = np.zeros((n, n, 4)); img[..., 3] = a * 0.8
Image.fromarray((img * 255).astype(np.uint8), 'RGBA').save(T + 'sombra_red.png')


def placa(name, w, h, lines, bg, fg, border=None, icon=None):
    im = Image.new('RGB', (w, h), bg); d = ImageDraw.Draw(im)
    if border: d.rectangle([6, 6, w - 7, h - 7], outline=border, width=8)
    y = h * 0.12
    for (txt, sz, bold) in lines:
        f = ImageFont.truetype(FB if bold else FR, sz)
        tw = d.textlength(txt, font=f)
        d.text(((w - tw) / 2, y), txt, font=f, fill=fg); y += sz * 1.25
    im.save(T + name)


placa('placa_epi.png', 600, 800, [('USO OBRIGATÓRIO', 50, True), ('', 20, False), ('JALECO', 64, True), ('TOUCA', 64, True),
                                 ('SAPATO FECHADO', 44, True), ('', 30, False), ('Sala de Dinamização', 34, False), ('Área controlada', 34, False)],
      (18, 84, 160), (255, 255, 255), (255, 255, 255))
placa('placa_sala.png', 900, 260, [('SALA DE DINAMIZAÇÃO 01', 64, True), ('Produção – 4 dinamizadoras CMR', 40, False)], (235, 238, 240), (25, 40, 60), (25, 40, 60))
placa('placa_tanque.png', 700, 300, [('TANQUE DE PASSAGEM TQ-01', 52, True), ('Inox 316L – 250 L', 40, False), ('Produto dinamizado', 40, False)], (240, 240, 240), (20, 30, 40), (0, 120, 60))
placa('placa_saida.png', 600, 220, [('SAÍDA', 110, True)], (0, 140, 70), (255, 255, 255))
placa('placa_transf.png', 700, 220, [('→ SALA DE TANQUES', 62, True), ('Transferência de produto', 40, False)], (0, 120, 60), (255, 255, 255))
placa('placa_base.png', 700, 220, [('SOLUÇÃO BASE', 70, True), ('Alimentação das máquinas', 40, False)], (20, 90, 180), (255, 255, 255))
placa('placa_prod.png', 700, 220, [('PRODUTO → TQ-01', 70, True), ('Descarga das máquinas', 40, False)], (0, 120, 60), (255, 255, 255))
placa('placa_torneira.png', 800, 200, [('SOLUÇÃO BASE – PONTO DE COLETA', 48, True), ('Mesma linha das máquinas', 36, False)], (240, 240, 240), (20, 90, 180), (20, 90, 180))
for k in range(1, 5):
    placa(f'placa_m{k}.png', 400, 240, [(f'M{k}', 150, True)], (25, 40, 60), (255, 255, 255))

# rótulo do frasco âmbar 200 mL
im = Image.new('RGB', (512, 256), (250, 250, 245)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 511, 40], fill=(0, 110, 60))
d.text((14, 6), 'ATIVO – TINTURA-MÃE', font=ImageFont.truetype(FB, 26), fill=(255, 255, 255))
d.text((14, 60), 'Lote 26-0925   200 mL', font=ImageFont.truetype(FR, 30), fill=(30, 30, 30))
d.text((14, 110), 'Uso: 1 mL por garrafão', font=ImageFont.truetype(FR, 28), fill=(30, 30, 30))
d.rectangle([14, 170, 300, 230], outline=(30, 30, 30), width=3)
im.save(T + 'rotulo_frasco.png')

# painel de parede (juntas verticais) – leve variação
n = 512
w = 0.88 + 0.01 * (noise(n, (4, 16), (0.6, 0.4)) - 0.5)
save(np.stack([w, w * 1.0, w * 0.995], -1), 'parede.png')
print('texturas OK')
