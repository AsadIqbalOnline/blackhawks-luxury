// Offline point-cloud renderer — lets agents SEE their geometry without a browser.
// usage: node render.mjs <module.mjs> <out.png> [az] [el] [dist] [lookY]
//   module must export: points() -> array of [x, y, z, r, g, b]  (colors 0..1)
// Renders additive splats through a perspective camera, writes PPM, converts to
// PNG via sips (macOS). Read the PNG afterwards to judge the result.
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const [, , modPath, outPng, azS, elS, distS, lookYS] = process.argv;
if (!modPath || !outPng) { console.error('usage: render.mjs <module.mjs> <out.png> [az el dist lookY]'); process.exit(1); }
const az = parseFloat(azS ?? '-1.62'), el = parseFloat(elS ?? '0.155');
const dist = parseFloat(distS ?? '10.6'), lookY = parseFloat(lookYS ?? '0.8');

const { points } = await import(pathToFileURL(modPath).href);
const pts = points();

const W = 1100, H = 640, FOV = 36 * Math.PI / 180;
const cam = [Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist + 0.9, Math.cos(az) * Math.cos(el) * dist];
const look = [0, lookY, 0];
// camera basis
const f = norm(sub(look, cam));
const r = norm(cross(f, [0, 1, 0]));
const u = cross(r, f);
const focal = (H / 2) / Math.tan(FOV / 2);

const buf = new Float32Array(W * H * 3);
for (const p of pts) {
  const d = sub([p[0], p[1], p[2]], cam);
  const cz = dot(d, f); if (cz < 0.2) continue;
  const cx = dot(d, r), cy = dot(d, u);
  const sx = Math.round(W / 2 + (cx / cz) * focal);
  const sy = Math.round(H / 2 - (cy / cz) * focal);
  if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
  const g = 9.0 / cz;                       // brightness falls with distance
  splat(sx, sy, p[3] * g, p[4] * g, p[5] * g);
}
function splat(x, y, cr, cg, cb) {
  for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx >= W || yy >= H) continue;
    const i = (yy * W + xx) * 3;
    buf[i] += cr * 0.09; buf[i + 1] += cg * 0.09; buf[i + 2] += cb * 0.09;
  }
}
const out = Buffer.alloc(W * H * 3);
for (let i = 0; i < buf.length; i++) {
  const v = Math.sqrt(Math.min(1, buf[i]));           // soft tonemap
  out[i] = Math.max(8, Math.min(255, Math.round(v * 255)));
}
const ppm = `/tmp/harness-${process.pid}.ppm`;
writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), out]));
execSync(`sips -s format png ${ppm} --out ${outPng} >/dev/null 2>&1`);
console.log('wrote', outPng, `(${pts.length} points, az ${az} el ${el} dist ${dist})`);

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
