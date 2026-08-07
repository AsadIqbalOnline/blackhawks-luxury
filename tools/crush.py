#!/usr/bin/env python3
"""Keep a photograph's framing; take its background to near-black.

Two ways to kill a bad background. If the subject sits wholly inside the frame,
lift it and float it on a sweep (studio.py). If it runs off the edge — a door
shot, a macro — deleting the background leaves a hard rectangular cut that reads
as a paste-up. Then you crush instead: keep every pixel, take the world to ~5%.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

def crush(src_jpg, lifted_png, out, strength=0.055, feather=9, pool=6):
    base = Image.open(src_jpg).convert('RGB')
    cut  = Image.open(lifted_png).convert('RGBA').resize(base.size, Image.LANCZOS)

    a = cut.split()[-1].filter(ImageFilter.GaussianBlur(feather))
    m = np.asarray(a).astype(np.float32) / 255.0
    b = np.asarray(base).astype(np.float32)

    dark = b * strength
    dark = dark * np.array([0.92, 0.94, 1.08])        # what survives goes cold
    out_arr = b * m[..., None] + dark * (1 - m[..., None])

    # a faint warm pool centred on the subject, so it isn't floating in a vacuum
    h, w = m.shape
    ys, xs = np.nonzero(m > 0.5)
    if len(ys):
        cy, cx = ys.mean(), xs.mean()
        yy, xx = np.mgrid[0:h, 0:w]
        r = np.sqrt(((yy - cy) / (h * 0.9)) ** 2 + ((xx - cx) / (w * 0.9)) ** 2)
        g = np.clip(1 - r, 0, 1) ** 2 * pool
        out_arr += g[..., None] * (1 - m[..., None]) * np.array([0.94, 0.97, 1.06])

    Image.fromarray(np.clip(out_arr, 0, 255).astype('uint8')).save(out, quality=94)
    return out

if __name__ == '__main__':
    if len(sys.argv) < 4:
        raise SystemExit('usage: crush.py <source.jpg> <lifted.png> <out.jpg> [strength]')
    s = float(sys.argv[4]) if len(sys.argv) > 4 else 0.055
    print(crush(sys.argv[1], sys.argv[2], sys.argv[3], strength=s))
