#!/usr/bin/env python3
"""Assert a copy region is dead paint. HARD BUILD FAILURE, not a warning.

    deadpaint.py plate.png x0 y0 x1 y1      # fractions 0..1, exit 1 if p99 >= 32

The rule this enforces: NO SCRIMS. A scrim is an admission that the crop is wrong.
The previous build ran an 84% black gradient across the very asset the project
exists to show. When a headline runs long there is enormous temptation to add
"just a little" gradient — so this has to fail the build, or the rule is decorative.

If this exits 1: change the crop, or move the copy. Do not add a gradient.
"""
import sys
import numpy as np
from PIL import Image

P99_MAX = 32.0

def check(path, x0, y0, x1, y1, label=''):
    im = Image.open(path).convert('L')
    w, h = im.size
    box = (int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h))
    a = np.asarray(im.crop(box)).astype(float)
    p99 = np.percentile(a, 99)
    ok = p99 < P99_MAX
    print(f'{"PASS" if ok else "FAIL"}  {path} {label} region={box} p99={p99:.1f} (max {P99_MAX})')
    return ok

if __name__ == '__main__':
    if len(sys.argv) == 6:
        sys.exit(0 if check(sys.argv[1], *[float(v) for v in sys.argv[2:6]]) else 1)
    # no args: check every shipping plate against its spec'd copy region
    REGIONS = [
        ('img/s1-door.png',   0.025, 0.035, 0.375, 0.335, 'copy top-left'),
        ('img/s2-wait.png',   0.025, 0.035, 0.375, 0.335, 'copy top-left'),
        ('img/s3-return.png', 0.025, 0.035, 0.375, 0.335, 'copy top-left'),
    ]
    bad = [r for r in REGIONS if not check(r[0], *r[1:5], r[5])]
    sys.exit(1 if bad else 0)
