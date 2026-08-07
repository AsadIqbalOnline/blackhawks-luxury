#!/usr/bin/env python3
"""Build the three shipping plates to the locked spec.

    lift 0.031 -> gain 0.78 -> gamma 1.75 -> tint (R .95, G .98, B 1.00)

Order matters. Grade in float32 at 2x, THEN Lanczos down — the supersample is the
deblocker (measured: block/interior ratio 1.42 raw -> 1.00 after 2x+Lanczos; dither
alone only reaches 1.13 and costs visible grain on quiet lacquer). Dither +/-1 LSB
anyway: that prevents NEW banding at final 8-bit quantisation, a different problem.

Save PNG. Any plate the shader reads must not carry DCT blocks — the relight pass
derives normals from luminance and will light them.
"""
import sys, subprocess
import numpy as np
from PIL import Image

W_OUT = 1600
LIFT, GAIN, GAMMA = 0.031, 0.78, 1.75
TINT = np.array([0.95, 0.98, 1.00])

def fit169(im, w):
    """Cover-crop to 16:9 at width w. Never distort."""
    tw, th = w, int(round(w * 9 / 16))
    sc = max(tw / im.width, th / im.height)
    im = im.resize((int(round(im.width * sc)), int(round(im.height * sc))), Image.LANCZOS)
    l, t = (im.width - tw) // 2, (im.height - th) // 2
    return im.crop((l, t, l + tw, t + th))

def grade(im, gain=GAIN):
    a = np.asarray(im).astype(np.float32) / 255.0
    a = LIFT + a * (1.0 - LIFT)          # re-floor black to ~(8,9,11) to meet --ground
    a = a * gain                          # headroom: the specular owns the brightest pixel
    a = np.power(np.clip(a, 0, 1), GAMMA) # deepen
    a = a * TINT                          # hold two cameras together, cool
    return np.clip(a, 0, 1)

def dither(a, lsb=1.0):
    rng = np.random.default_rng(7)
    return np.clip(a * 255.0 + rng.normal(0, lsb, a.shape), 0, 255)

def solve_gain(im, target=21.0, lo=0.4, hi=4.0):
    """The recipe's gain was calibrated on pre-graded files. Sources differ in
    exposure, so solve gain per plate to land the register instead of guessing.
    One RECIPE, one TARGET — not one magic number."""
    for _ in range(22):
        mid = (lo + hi) / 2
        a = np.asarray(im).astype(np.float32) / 255.0
        a = LIFT + a * (1.0 - LIFT)
        a = np.power(np.clip(a * mid, 0, 1), GAMMA) * TINT
        m = (np.clip(a, 0, 1) * 255.0).mean()
        if m < target: lo = mid
        else: hi = mid
    return (lo + hi) / 2

def build(src, out, crop_frac=None, supersample=2):
    im = Image.open(src).convert('RGB')
    im = fit169(im, W_OUT * supersample)
    if crop_frac:
        w, h = im.size
        l, t, r, b = [int(round(v * s)) for v, s in zip(crop_frac, (w, h, w, h))]
        im = im.crop((l, t, r, b))
        im = fit169(im, W_OUT * supersample)
    gain_used = solve_gain(im)
    a = grade(im, gain_used)
    im = Image.fromarray(dither(a).astype('uint8'))
    im = im.resize((W_OUT, int(round(W_OUT * 9 / 16))), Image.LANCZOS)  # <- the deblocker
    im.save(out, optimize=True)
    g = np.asarray(im.convert('L')).astype(float)
    px = np.asarray(im).astype(float)
    hi = px[g > np.percentile(g, 99)]
    rb = (hi[:, 0] - hi[:, 2]).mean() if len(hi) else 0
    print(f'{out}  gain={gain_used:4.2f}  mean={g.mean():5.1f}  max={g.max():5.1f}  hi R-B={rb:+5.1f}  {im.size}')
    return out

if __name__ == '__main__':
    # S1 THE DOOR — hero. full frame; the only photograph of service being performed.
    build('img/src/door_crushed.png', 'img/s1-door.png')
    # S2 THE WAIT — near-black SUV front end, frame 100% car.
    build('img/src/front.jpg', 'img/s2-wait.png')
    # S3 THE RETURN — crop is NOT optional: full frame's left third is out-of-focus wall.
    build('img/src/return.jpg', 'img/s3-return.png', crop_frac=(0.45, 0.22, 1.0, 0.78))
