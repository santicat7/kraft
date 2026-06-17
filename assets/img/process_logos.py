#!/usr/bin/env python
"""Normaliza logos de sponsors a silueta BLANCA transparente, altura uniforme.
Detecta el color de fondo desde los bordes (sirve fondo claro u oscuro)."""
import os
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), "sponsors")
OUT = os.path.join(os.path.dirname(__file__), "logos")
os.makedirs(OUT, exist_ok=True)

TARGET_H = 120
DIST_HARD = 42     # distancia de color: por debajo = fondo (transparente)
DIST_SOFT = 95     # por encima = logo (opaco); entre medio = borde suave

def bg_color(im):
    """Color de fondo = promedio del marco de 2px del borde."""
    w, h = im.size
    px = im.load()
    rs = gs = bs = n = 0
    for x in range(w):
        for y in (0, 1, h - 2, h - 1):
            r, g, b, _ = px[x, y]; rs += r; gs += g; bs += b; n += 1
    for y in range(h):
        for x in (0, 1, w - 2, w - 1):
            r, g, b, _ = px[x, y]; rs += r; gs += g; bs += b; n += 1
    return (rs / n, gs / n, bs / n)

files = [f for f in os.listdir(SRC) if f.lower().endswith((".png", ".jpg", ".jpeg"))]

for fn in sorted(files):
    name = os.path.splitext(fn)[0].lower()
    im = Image.open(os.path.join(SRC, fn)).convert("RGBA")
    w, h = im.size
    px = im.load()

    src_alpha = im.getchannel("A")
    has_alpha = src_alpha.getextrema()[0] < 245

    if has_alpha:
        shape_alpha = src_alpha
    else:
        br, bg, bb = bg_color(im)
        new_alpha = Image.new("L", (w, h), 0)
        na = new_alpha.load()
        for y in range(h):
            for x in range(w):
                r, g, b, _ = px[x, y]
                d = ((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2) ** 0.5
                if d <= DIST_HARD:
                    na[x, y] = 0
                elif d >= DIST_SOFT:
                    na[x, y] = 255
                else:
                    na[x, y] = int(255 * (d - DIST_HARD) / (DIST_SOFT - DIST_HARD))
        shape_alpha = new_alpha

    # silueta blanca usando la forma (alpha)
    base = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    white = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    sil = Image.composite(white, base, shape_alpha)

    bbox = sil.getchannel("A").getbbox()
    if bbox:
        sil = sil.crop(bbox)
    cw, ch = sil.size
    new_w = max(1, round(cw * TARGET_H / ch))
    sil = sil.resize((new_w, TARGET_H), Image.LANCZOS)

    cov = sum(sil.getchannel("A").histogram()[200:]) / (new_w * TARGET_H) * 100
    sil.save(os.path.join(OUT, name + ".png"))
    print(f"{fn:16s} -> logos/{name}.png  {new_w}x{TARGET_H}  cobertura={cov:4.1f}%  alpha_src={has_alpha}")

print("OK")
