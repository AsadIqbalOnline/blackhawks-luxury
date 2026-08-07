# env-v2 — skyline, tyre dust, grounding shadow

Proofs: `/tmp/env-final-main.png`, `/tmp/env-final-drag.png` (site camera + drag angle).
Dunes are approved — `duneH` ships **unchanged** (block 1 is verbatim, pasting it is a no-op).

## 1 — duneH (UNCHANGED, verbatim as shipped; every z-frequency stays an integer multiple of 6.2831853/66)

```glsl
float duneH(float x, float z){
  float kk = 6.2831853 / L;
  float zk = z * kk;
  float skew = zk + 0.32 * sin(zk);         // soft asymmetry, not a broken edge
  float A = 0.42 + 0.85 * smoothstep(1.4, 8.5, abs(x)) * (1.0 + abs(x) * 0.045);
  float h = sin(x*0.11 + 1.05*sin(skew)) * sin(zk*2.0 + 1.7) * 1.18
          + 0.34*sin(x*0.19 + zk*1.0 + 2.1);
  return h * A - 0.02;
}
```

```js
// exact JS mirror (suspension/harness)
function duneH(x, z) {
  const kk = 6.2831853 / 66.0, zk = z * kk;
  const skew = zk + 0.32 * Math.sin(zk);
  const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const A = 0.42 + 0.85 * ss(1.4, 8.5, Math.abs(x)) * (1.0 + Math.abs(x) * 0.045);
  const h = Math.sin(x * 0.11 + 1.05 * Math.sin(skew)) * Math.sin(zk * 2.0 + 1.7) * 1.18
          + 0.34 * Math.sin(x * 0.19 + zk * 1.0 + 2.1);
  return h * A - 0.02;
}
```

## 2 — TOWERS generation (replaces `const TOWERS = 26, PTS = 15000;` … down to the buffer fills; `pos`/`br`/`wm`/`PTS` keep their names, everything after is untouched — the existing boundingSphere (48,5,0,r70) still covers this geometry)

```js
    const PTS = 26000;
    const pos = new Float32Array(PTS * 3), br = new Float32Array(PTS), wm = new Float32Array(PTS);
    // deterministic skyline — the exact skyline that was art-directed is the one that ships
    let _s = 96721; const rnd = () => (_s = (_s * 1103515245 + 12345) & 0x7fffffff, _s / 0x7fffffff);
    const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

    // three districts + a low far tail, in TWO depth rows (front bright, back
    // dim + blue-shifted haze) with real black gaps between districts.
    // form: 0 slab · 1 setback at 2/3 h · 2 tapered spire+antenna · 3 arc plan
    const tw = [];
    const mk = (z, front, h, w, d, form, led, crown) => tw.push({
      x: (front ? 41.5 + rnd() * 5.5 : 53.5 + rnd() * 7),
      z, w, d, h, form, led, crown,
      row: front ? 1.0 : 0.5,
      haze: front ? 0 : -(0.15 + rnd() * 0.2),      // wm < 0 extrapolates cooler = distance haze
    });
    // marina  (z -38..-22)
    mk(-36.5, 1, 4.6, 1.5, 1.2, 0, 0, 1); mk(-34.0, 1, 6.9, 1.7, 1.4, 0, 1, 1);
    mk(-31.6, 1, 5.8, 1.3, 1.1, 3, 0, 0); mk(-29.4, 1, 3.4, 1.2, 1.0, 0, 0, 1);
    mk(-27.0, 1, 6.4, 1.5, 1.2, 1, 0, 0); mk(-24.4, 1, 4.1, 1.3, 1.1, 0, 0, 1);
    mk(-22.6, 1, 2.5, 2.8, 1.6, 0, 0, 0);
    mk(-35.2, 0, 5.2, 2.0, 1.6, 0, 0, 0); mk(-31.9, 0, 3.6, 1.8, 1.5, 0, 0, 0);
    mk(-28.2, 0, 4.4, 1.9, 1.5, 0, 0, 1); mk(-24.9, 0, 2.8, 2.4, 1.8, 0, 0, 0);
    // downtown (z -13..+8) — the spire district
    mk(-12.2, 1, 3.2, 1.4, 1.1, 0, 0, 1); mk(-9.9, 1, 5.1, 1.5, 1.2, 1, 0, 0);
    mk(-6.6, 1, 8.4, 1.9, 1.9, 2, 0, 0);            // THE spire (drag-view frame-safe)
    mk(-3.4, 1, 6.2, 1.5, 1.2, 0, 1, 1); mk(-1.2, 1, 4.7, 1.3, 1.1, 0, 0, 0);
    mk(1.4, 1, 5.5, 1.4, 1.2, 1, 0, 1);  mk(3.8, 1, 3.0, 1.2, 1.0, 0, 0, 0);
    mk(6.4, 1, 4.2, 1.4, 1.1, 0, 0, 1);  mk(-8.4, 1, 1.6, 3.6, 1.8, 0, 0, 0);
    mk(-11.0, 0, 4.0, 1.9, 1.6, 0, 0, 0); mk(-7.3, 0, 5.6, 2.0, 1.6, 0, 0, 1);
    mk(-3.9, 0, 3.1, 1.8, 1.4, 0, 0, 0);  mk(0.6, 0, 4.6, 2.0, 1.6, 0, 0, 0);
    mk(4.9, 0, 2.6, 2.2, 1.7, 0, 0, 0);
    // bay (z 15..30)
    mk(16.2, 1, 3.8, 1.4, 1.1, 0, 0, 1); mk(18.8, 1, 2.7, 1.3, 1.0, 0, 0, 0);
    mk(21.6, 1, 4.5, 1.5, 1.2, 1, 0, 0); mk(24.6, 1, 3.3, 1.3, 1.1, 0, 0, 1);
    mk(27.6, 1, 2.2, 2.2, 1.5, 0, 0, 0);
    mk(17.8, 0, 3.0, 1.8, 1.5, 0, 0, 0); mk(22.4, 0, 3.9, 1.9, 1.5, 0, 0, 0);
    mk(26.8, 0, 2.4, 2.0, 1.6, 0, 0, 0);
    // far tail (z 33..45)
    mk(33.5, 0, 1.9, 2.2, 1.6, 0, 0, 0); mk(37.0, 0, 1.4, 2.6, 1.8, 0, 0, 0);
    mk(41.0, 0, 1.7, 2.0, 1.5, 0, 0, 0); mk(44.5, 0, 1.0, 2.4, 1.7, 0, 0, 0);
    const TOWERS = tw.length;

    let areaSum = 0; for (const t of tw) { t.area = (t.w + t.d) * t.h * (t.form === 2 ? 1.35 : 1); areaSum += t.area; }
    const GLOW = 3000, SPRAWL = 2600, DECOR = 400;
    const WIN = PTS - GLOW - SPRAWL - DECOR;
    const FLOOR = 0.16, PITCH = 0.13;               // floor rows are what make it architecture
    let ci = 0;
    const put = (x, y, z, b, w) => { if (ci < PTS) { pos[ci*3] = x; pos[ci*3+1] = y; pos[ci*3+2] = z; br[ci] = b; wm[ci] = w; ci++; } };

    // windows: floor-quantized rows, jittered columns, per-floor lit blocks
    for (let ti = 0; ti < TOWERS; ti++) {
      const t = tw[ti];
      const n = Math.max(24, Math.round(WIN * t.area / areaSum));
      const nF = Math.max(2, Math.round(t.h / FLOOR));
      for (let k = 0; k < n; k++) {
        const f = (rnd() * nF) | 0;
        const y0 = (f + 0.5) * FLOOR;
        const h1 = Math.abs(Math.sin(ti * 37.7 + f * 13.13));   // offices at night:
        const litP = h1 < 0.16 ? 0.05 : 0.22 + 0.68 * Math.abs(Math.sin(ti * 91.3 + f * 7.77));
        if (rnd() > litP) continue;                             // some floors dark, some busy
        let w2 = t.w, d2 = t.d;
        if (t.form === 1 && y0 > t.h * 0.66) { w2 *= 0.62; d2 *= 0.62; }
        if (t.form === 2) { const sc = 1.0 - 0.78 * (y0 / t.h); w2 *= sc; d2 *= sc; }
        const face = rnd();
        let x, z, fMul = 1;
        if (face < 0.62) {                                      // camera-side face
          const cols = Math.max(2, Math.round(w2 / PITCH));
          const c = (rnd() * cols) | 0;
          z = t.z - w2 / 2 + (c + 0.5) * (w2 / cols) + (rnd() - 0.5) * 0.02;
          x = t.x - d2 / 2;
          if (t.form === 3) {                                   // arc plan bows toward camera
            const a = ((z - t.z) / (t.w / 2)) * 0.85;
            x += (Math.cos(a) - 1) * 1.6; fMul = 0.72 + 0.28 * Math.cos(a);
          }
        } else if (face < 0.90) {                               // side faces
          const cols = Math.max(2, Math.round(d2 / PITCH));
          const c = (rnd() * cols) | 0;
          x = t.x - d2 / 2 + (c + 0.5) * (d2 / cols) + (rnd() - 0.5) * 0.02;
          z = t.z + (rnd() < 0.5 ? -1 : 1) * w2 / 2;
          fMul = 0.8;
        } else {                                                // interior spill
          x = t.x + (rnd() - 0.5) * d2 * 0.7; z = t.z + (rnd() - 0.5) * w2 * 0.7; fMul = 0.35;
        }
        const y = y0 + (rnd() - 0.5) * 0.018;
        let b = (0.30 + 0.70 * rnd()) * t.row * fMul
              * (0.42 + 0.58 * ss(0.05, 0.85, y0));             // haze eats the bases
        if (t.crown && f >= nF - 2) b *= 1.7;                   // lit parapet
        const w = (rnd() < (0.10 + 0.30 * Math.exp(-y0 / 1.1)) ? 0.85 : 0.0) + t.haze;
        put(x, y, z, Math.min(b, 1.25), w);
      }
    }
    // decor: LED corner columns, spire antenna+crown, aviation lights
    for (let ti = 0; ti < TOWERS; ti++) {
      const t = tw[ti];
      if (t.led) for (let e = 0; e < 2; e++) {
        const z = t.z + (e ? -1 : 1) * t.w / 2, x = t.x - t.d / 2;
        for (let y = 0.25; y < t.h - 0.05; y += FLOOR) put(x, y, z, 0.9, 0.0);
      }
      if (t.form === 2) {
        for (let a = 0; a < 4; a++) put(t.x, t.h + 0.22 + a * 0.26, t.z, 0.55 - a * 0.08, 0.0);
        for (let c = 0; c < 26; c++) {
          const yy = t.h * (0.90 + rnd() * 0.10), sc = 1.0 - 0.78 * (yy / t.h);
          put(t.x + (rnd() - 0.5) * t.d * sc, yy, t.z + (rnd() - 0.5) * t.w * sc, 0.85, 0.0);
        }
      }
    }
    const tall = [...tw].sort((a, b) => b.h - a.h).slice(0, 5);
    for (const t of tall) put(t.x, t.h + 0.06, t.z, 0.65, 4.0);  // aviation: wm 4 extrapolates
                                                                 // mix(cool,warm,·) → clamps to warm-red
    // sky glow — the city leaks light into the black above it
    const dz = [-29, -3, 22];
    for (let k = 0; k < GLOW; k++) {
      const c = dz[(rnd() * 3) | 0] + (rnd() - 0.5) * 22;
      const y = 0.5 + Math.pow(rnd(), 3.0) * 5.0;
      put(47 + rnd() * 15, y, c, 0.12 + 0.18 * rnd() * rnd(), 0.55);
    }
    // sprawl — sodium low-rise carpet between and past the districts
    for (let k = 0; k < SPRAWL; k++) {
      const z = -46 + rnd() * 92;
      const nearD = Math.max(Math.exp(-Math.abs(z + 29) / 8), Math.exp(-Math.abs(z + 3) / 9), Math.exp(-Math.abs(z - 22) / 8));
      if (rnd() > 0.22 + 0.78 * nearD) continue;
      put(44 + rnd() * 17, Math.pow(rnd(), 2.6) * 0.8, z, 0.03 + 0.10 * rnd() * rnd() * (0.4 + 0.6 * nearD), 0.8);
    }
    // unfilled tail of the buffers stays (0,0,0)/br 0 — additive, contributes nothing
```

## 3 — dust ballistics + shadow line

```glsl
// ---- dust EMITTER constants (JS, birth spread tightened — fuzzy birth was half the confetti read):
// const EMIT = [[-0.79, 1.412], [0.79, 1.412], [-0.79, -1.525], [0.79, -1.525]];
// st[i*3]   = e[0] + (Math.random() - 0.5) * 0.18;
// st[i*3+1] = 0.045;
// st[i*3+2] = e[1] + (Math.random() - 0.5) * 0.14;

// ---- dust VERTEX SHADER position/life lines (replace the body of main()):
float t  = fract(aSeed + uTime * (0.50 + aSeed * 0.35));
float s2 = fract(aSeed * 13.73), s3 = fract(aSeed * 57.19);
vec3 p = aStart;
p.z += uCarZ;                                            // the plume follows the car out
p.z += (1.9 + s2 * 2.1) * (1.0 - pow(1.0 - t, 2.2));     // fast fling off the tread, air-drag decel
p.x += sign(aStart.x) * t * t * 0.55 + (s3 - 0.5) * t * 1.5;  // outward bias + turbulent fan
float up = 0.7 + s2 * 1.3;                               // energy varies grain to grain
float yb = uLift + 0.05 + up * t - (up * 0.60 + 0.50) * t * t; // ballistic: up fast, gravity wins
p.y = max(yb, uLift + 0.035 + 0.05 * s3) + 0.05 * t * sin(s3 * 40.0 + t * 9.0); // ground skim + tumble
vA = pow(1.0 - t, 1.7) * smoothstep(0.0, 0.04, t) * (1.0 + 0.9 * exp(-t * 5.0)) * uAmt; // hot head, long tail
vec4 mv = modelViewMatrix * vec4(p, 1.0);
gl_Position = projectionMatrix * mv;
gl_PointSize = max((0.7 + s2 * 0.8 + t * (2.6 + s3 * 1.6)) * uPix * (10.0 / -mv.z), 1.5); // grains disperse into billows

// ---- dust FRAGMENT alpha (one value: 0.34 → 0.38, the plume was a touch shy):
// gl_FragColor = vec4(vec3(0.92, 0.76, 0.54) * 0.75, a * 0.38 * vA);

// ---- grounding shadow (desert VS; replaces the shipped line — tight contact
//      pool hugging the footprint, slightly plateaued core, fast feathered edge):
float shadow = min(1.0, 1.07 * exp(-pow(pow(x / 1.12, 2.0) + pow((z - uCarZ) / 2.30, 2.0), 1.9))) * uCarOn;
```
