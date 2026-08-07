#!/usr/bin/env python3
"""Turn a lifted car PNG into a studio plate: clean the alpha, ground it with a
contact shadow, sit it on a seamless sweep. No horizon, no wall, nothing to hate."""
import sys, os
import numpy as np
from PIL import Image, ImageFilter, ImageChops

def dither(im, amt=2.2):
    """Break up banding in dark gradients. Without this, JPEG blocks a near-flat
    black sweep into 8x8 tiles and any normal-from-luminance pass finds them."""
    a = np.asarray(im).astype(np.float32)
    rng = np.random.default_rng(11)
    a += rng.normal(0, amt, a.shape)
    return Image.fromarray(np.clip(a, 0, 255).astype('uint8'))

def clean_alpha(im, min_alpha=140):
    """Vision's mask keeps slivers of ground around the tyres. Harden the alpha,
    then drop every blob that isn't the car itself."""
    a = im.split()[-1]
    # harden: push mid alphas to 0/255 so haze around the tyres dies
    a = a.point(lambda v: 0 if v < min_alpha else 255)
    a = a.filter(ImageFilter.MedianFilter(5))       # kill speckle
    # keep only the largest connected blob
    try:
        import numpy as np
        arr = np.array(a) > 0
        h, w = arr.shape
        lbl = np.zeros((h, w), np.int32)
        cur, sizes = 0, {}
        from collections import deque
        for y in range(0, h, 2):
            for x in range(0, w, 2):
                if arr[y, x] and lbl[y, x] == 0:
                    cur += 1; n = 0; q = deque([(y, x)]); lbl[y, x] = cur
                    while q:
                        cy, cx = q.popleft(); n += 1
                        for dy, dx in ((2,0),(-2,0),(0,2),(0,-2)):
                            ny, nx = cy+dy, cx+dx
                            if 0 <= ny < h and 0 <= nx < w and arr[ny, nx] and lbl[ny, nx] == 0:
                                lbl[ny, nx] = cur; q.append((ny, nx))
                    sizes[cur] = n
        if sizes:
            keep = max(sizes, key=sizes.get)
            mask = (lbl == keep)
            # the 2px lattice leaves gaps; dilate back
            m = Image.fromarray((mask*255).astype('uint8')).resize((w, h), Image.NEAREST)
            m = m.filter(ImageFilter.MaxFilter(5))
            a = ImageChops.multiply(a, m)
    except ImportError:
        pass
    a = a.filter(ImageFilter.GaussianBlur(0.6))     # re-feather the edge
    im.putalpha(a)
    return im

def sweep(W, H, top=242, bot=196):
    bg = Image.new('RGB', (W, H)); px = bg.load()
    for y in range(H):
        t = y / H
        v = int(top - (top-bot) * (t ** 1.6))
        for x in range(W):
            px[x, y] = (v, v, min(255, int(v*1.008)))
    return bg

def plate(src_png, out_png, W=1800, H=1000, car_w=0.74, base=0.68):
    car = Image.open(src_png).convert('RGBA')
    car = clean_alpha(car)
    bb = car.split()[-1].getbbox()
    if not bb: raise SystemExit('empty alpha after clean: ' + src_png)
    car = car.crop(bb)

    cw = int(W * car_w); ch = int(cw * car.height / car.width)
    car = car.resize((cw, ch), Image.LANCZOS)
    cx, cy = (W - cw)//2, int(H*base) - ch

    bg = sweep(W, H)

    # contact shadow: a squashed blur of the car's own silhouette, pinned to its
    # base. this is what makes it sit instead of float.
    sil = Image.new('L', (W, H), 0)
    sil.paste(car.split()[-1], (cx, cy))
    sh = sil.crop((0, cy + int(ch*0.72), W, cy + ch))
    sh = sh.resize((W, max(1, int(ch*0.14))), Image.LANCZOS)
    shadow = Image.new('L', (W, H), 0)
    shadow.paste(sh, (0, cy + ch - int(ch*0.07)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    shadow = shadow.point(lambda v: int(v*0.62))
    bg.paste(Image.new('RGB', (W, H), (58, 58, 62)), (0, 0), shadow)

    # a tighter, darker core right under the tyres
    core = shadow.filter(ImageFilter.GaussianBlur(5)).point(lambda v: int(min(255, v*1.5)) if v > 90 else 0)
    bg.paste(Image.new('RGB', (W, H), (34, 34, 38)), (0, 0), core.point(lambda v: int(v*0.5)))

    bg = bg.convert('RGBA')
    bg.alpha_composite(car, (cx, cy))
    bg.convert('RGB').save(out_png, quality=94)
    return out_png

if __name__ == '__main__':
    if len(sys.argv) < 3: raise SystemExit('usage: studio.py <lifted.png> <out.jpg>')
    print(plate(sys.argv[1], sys.argv[2]))
