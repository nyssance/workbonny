#!/usr/bin/env python3 -I
"""Icon pipeline, first version. Source: a full-bleed 1024x1024 square (assets/icon.png).
Output: assets/icon-macos.png with Apple's app-icon geometry: the artwork sits in an 824x824
rounded square centred on a transparent 1024 canvas (100px margin each side), corner radius
~22.37% of the side. Windows/Linux keep the full-bleed source. Dev-machine helper (PIL); the
real scaffold needs a dependency-free equivalent."""
import sys
from PIL import Image, ImageDraw, ImageFont

root = sys.argv[1]
SIZE, INNER = 1024, 824
MARGIN = (SIZE - INNER) // 2
RADIUS = round(INNER * 0.2237)

def make_source(path):
    img = Image.new("RGBA", (SIZE, SIZE), "#1f6feb")
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 640, index=1)
    box = draw.textbbox((0, 0), "W", font=font, anchor="lt")
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((SIZE - w) / 2 - box[0], (SIZE - h) / 2 - box[1]), "W", font=font, fill="white", anchor="lt")
    img.save(path)

def make_macos(src, dst):
    art = Image.open(src).convert("RGBA").resize((INNER, INNER), Image.LANCZOS)
    mask = Image.new("L", (INNER, INNER), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, INNER - 1, INNER - 1), radius=RADIUS, fill=255)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(art, (MARGIN, MARGIN), mask)
    canvas.save(dst)

src = f"{root}/assets/icon.png"
import os
if not os.path.exists(src):
    make_source(src)
make_macos(src, f"{root}/assets/icon-macos.png")
print("icon ok", RADIUS)
