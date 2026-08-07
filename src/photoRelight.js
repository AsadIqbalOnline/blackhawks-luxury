/**
 * photoRelight — the cursor is the only light in the frame.
 *
 * The car is invisible until someone looks for it. That is this company's product
 * made literal: the entire service is labour nobody sees.
 *
 * Surface normal and depth are derived FROM the photograph (sobel on blurred
 * luminance), then lit positionally, so the highlight wraps real shapes — a
 * shoulder line, wet lacquer, chrome. Transitions are performed BY the light:
 * one front, travelling rearward, once, never reversing.
 *
 * Spec-locked. Do not "improve" without reading SPEC.md §5 first — most obvious
 * additions (cursor lead, idle coast, sun drift, per-beat intensity) were cut on
 * purpose and the reasons are written down.
 */

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;

uniform sampler2D texA, texB;
uniform vec2  resA, resB, res;
uniform float mixAB;
uniform vec2  lightPos;
uniform vec2  sweepDir;
uniform float sweepW;      // velocity-softened. fast front = soft edge (motion blur).
uniform float warmA, warmB;
uniform float parA, parB;  // parallax amount per plate — 0 on the refusal beat
uniform vec2  mouseOff;
uniform float intensity;

const float POOL = 0.09;

float lum(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }

vec2 cover(vec2 u, vec2 texRes){
  float ca = res.x/res.y, ia = texRes.x/texRes.y;
  vec2 s = ca > ia ? vec2(1., ia/ca) : vec2(ca/ia, 1.);
  return (u - .5) * s + .5;   // MULTIPLY. dividing gives contain + black bars.
}

float lumB(sampler2D tex, vec2 u, vec2 texRes){
  vec2 e = 1.6 / texRes;
  float s = lum(texture(tex, u).rgb) * 2.;
  s += lum(texture(tex, u + vec2( e.x, 0.)).rgb);
  s += lum(texture(tex, u + vec2(-e.x, 0.)).rgb);
  s += lum(texture(tex, u + vec2(0.,  e.y)).rgb);
  s += lum(texture(tex, u + vec2(0., -e.y)).rgb);
  return s / 6.;
}

float depth(sampler2D tex, vec2 u, vec2 texRes){
  vec2 e = 5.0 / texRes;
  float d = lum(texture(tex, u).rgb) * 4.;
  d += lum(texture(tex, u + vec2( e.x, 0.)).rgb);
  d += lum(texture(tex, u + vec2(-e.x, 0.)).rgb);
  d += lum(texture(tex, u + vec2(0.,  e.y)).rgb);
  d += lum(texture(tex, u + vec2(0., -e.y)).rgb);
  d /= 8.;
  float radial = 1. - smoothstep(.15, .75, length(u - .5));
  return clamp(mix(d, radial, .35), 0., 1.);
}

vec3 normalFrom(sampler2D tex, vec2 u, vec2 texRes){
  vec2 e = 3.6 / texRes;   // wide: we want the body's form, not its grain
  float l  = lumB(tex, u + vec2(-e.x, 0.), texRes);
  float r  = lumB(tex, u + vec2( e.x, 0.), texRes);
  float d  = lumB(tex, u + vec2(0., -e.y), texRes);
  float up = lumB(tex, u + vec2(0.,  e.y), texRes);
  return normalize(vec3(-vec2(r - l, up - d) * 13.0, 1.0));
}

vec3 shade(sampler2D tex, vec2 uu, vec2 texRes, float warm, float par){
  float ar = res.x / res.y;
  vec2 u = cover(uu, texRes);
  u += mouseOff * par * (depth(tex, u, texRes) - 0.42);

  vec3 base = texture(tex, clamp(u, 0.001, 0.999)).rgb;
  vec3 n = normalFrom(tex, clamp(u, 0.001, 0.999), texRes);

  vec2 dxy = (lightPos - uu) * vec2(ar, 1.0);
  vec3 L = normalize(vec3(dxy, 0.42));

  float spec = pow(max(dot(n, L), 0.), 9.0);
  // gloss is a BAND, not a ramp. "darker = glossier" makes the void behind the car
  // the shiniest surface in frame — a void has no surface. gate both ends.
  float bl = lum(base);
  float gloss = smoothstep(.020, .075, bl) * smoothstep(.66, .07, bl);
  float falloff = exp(-length(dxy) * 1.35);
  vec3 tint = mix(vec3(.62,.74,1.0), vec3(1.0,.72,.36), warm);

  vec3 col = base;
  col += spec * gloss * tint * intensity * (0.35 + 1.25*falloff);
  col += tint * exp(-length(dxy)*3.2) * POOL * intensity;   // always answers the hand
  return col;
}

void main(){
  vec3 a = shade(texA, uv, resA, warmA, parA);
  // the scroll model holds at mixAB~0 for 84% of the time. this early-out is what
  // pays for a two-shade fragment shader on a phone.
  if (mixAB < 0.001){ o = vec4(a, 1.0); return; }

  vec3 b = shade(texB, uv, resB, warmB, parB);

  float s = clamp(dot(uv - 0.5, normalize(sweepDir)) * 0.71 + 0.5, 0., 1.);
  float front = mixAB * (1.0 + 2.0*sweepW) - sweepW;
  float reveal = 1.0 - smoothstep(front - sweepW, front + sweepW, s);
  vec3 col = mix(a, b, reveal);

  float edge = reveal * (1.0 - reveal) * 4.0;
  vec3 tint = mix(vec3(.62,.74,1.0), vec3(1.0,.74,.4), max(warmA, warmB));
  col += tint * edge * 0.10;

  o = vec4(col, 1.0);
}`;

// ONE lerp law, dt-based. `lerp(v, t, 0.045)` per FRAME settles in 1.100s @60Hz and
// 0.550s @120Hz — the same code, twice as fast on a ProMotion Mac. That is a bug.
const TAU_LIGHT  = 0.035;  // s — light may NOT lag. a lamp and its reflection are instant.
const TAU_BODY   = 0.12;   // s — only mass may lag.
const TAU_SCROLL = 0.12;   // s
const WARM_CAP   = 0.35;   // the shader's warm end is ORANGE — the colour of the car park.
const INTENSITY  = 0.72;   // one value. a per-beat curve is four alibis.

export class PhotoRelight {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{src:string,warm:number,parallax:number}[]} plates
   * @param {{sweepDirs:number[][]}} opts  one direction per transition. NOT welded to
   *   a "sun" angle — that froze during holds and made the sweep undesignable.
   */
  constructor(canvas, plates, opts = {}) {
    this.canvas = canvas;
    this.plates = plates;
    this.n = plates.length;
    this.dirs = opts.sweepDirs || plates.slice(1).map(() => [1, 0]);

    const gl = (this.gl = canvas.getContext('webgl2', { antialias: false, alpha: false }));
    if (!gl) throw new Error('WebGL2 unavailable');

    const mk = (ty, src) => {
      const s = gl.createShader(ty);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = (this.prog = gl.createProgram());
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const U = (k) => gl.getUniformLocation(prog, k);
    this.u = {};
    for (const k of ['texA','texB','resA','resB','res','mixAB','lightPos','sweepDir',
                     'sweepW','warmA','warmB','parA','parB','mouseOff','intensity']) this.u[k] = U(k);
    gl.uniform1i(this.u.texA, 0); gl.uniform1i(this.u.texB, 1);
    gl.uniform1f(this.u.intensity, INTENSITY);

    const blank = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([8, 9, 11, 255]));
    this.tex = plates.map(() => ({ tex: blank, w: 1, h: 1 }));
    plates.forEach((p, i) => {
      const im = new Image();
      im.onload = () => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.tex[i] = { tex: t, w: im.naturalWidth, h: im.naturalHeight };
      };
      im.onerror = () => console.warn('plate missing:', p.src);
      im.src = p.src;
    });

    this.target = 0; this.prog_ = 0; this.mixPrev = 0; this.sweepW = 0.17;
    // no idle coast. when the pointer stops, the light stops — a light that moves
    // with no hand on it is not the cursor, and the whole thesis dies.
    this.lx = 0.5; this.ly = 0.5; this.ex = 0.5; this.ey = 0.5;
    this.ox = 0; this.oy = 0; this.eox = 0; this.eoy = 0;
    this.touch = matchMedia('(hover:none)').matches;

    this._resize = () => {
      const d = Math.min(devicePixelRatio || 1, this.touch ? 1.5 : 2);
      canvas.width = Math.round(innerWidth * d);
      canvas.height = Math.round(innerHeight * d);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    this._move = (e) => {
      // no lead. exactly under the pointer, always. a site that runs ahead of your
      // hand is eager, not confident.
      this.lx = e.clientX / innerWidth;
      this.ly = 1 - e.clientY / innerHeight;
      if (this.touch) this.ly += 0.08;        // a finger covers what it points at
      this.ox = (this.lx - 0.5); this.oy = (this.ly - 0.5);
    };
    addEventListener('resize', this._resize);
    addEventListener('pointermove', this._move, { passive: true });
    this._resize();

    this._last = 0;
    this._loop = (ms) => {
      const dt = this._last ? Math.min((ms - this._last) / 1000, 0.05) : 0.016;
      this._last = ms;
      const k = (tau) => 1 - Math.exp(-dt / tau);   // refresh-rate independent

      this.prog_ += (this.target - this.prog_) * k(TAU_SCROLL);
      this.ex += (this.lx - this.ex) * k(TAU_LIGHT);
      this.ey += (this.ly - this.ey) * k(TAU_LIGHT);
      this.eox += (this.ox - this.eox) * k(TAU_BODY);
      this.eoy += (this.oy - this.eoy) * k(TAU_BODY);

      const f = this.prog_ * (this.n - 1);
      const i0 = Math.min(this.n - 2, Math.max(0, Math.floor(f)));
      const i1 = Math.min(this.n - 1, i0 + 1);
      const m = Math.max(0, Math.min(1, f - i0));

      // a fast front has a soft edge; a slow one is crisp. ships as an unnamed
      // property of the sweep — never as a designed effect.
      const vel = Math.abs(m - this.mixPrev) / Math.max(dt, 1e-4);
      this.mixPrev = m;
      const wTarget = 0.17 + Math.min(0.33, vel * 0.22);
      this.sweepW += (wTarget - this.sweepW) * k(0.06);

      const g = this.gl, U = this.u;
      g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, this.tex[i0].tex);
      g.uniform2f(U.resA, this.tex[i0].w, this.tex[i0].h);
      g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, this.tex[i1].tex);
      g.uniform2f(U.resB, this.tex[i1].w, this.tex[i1].h);

      g.uniform1f(U.mixAB, m);
      g.uniform2f(U.res, this.canvas.width, this.canvas.height);
      g.uniform2f(U.lightPos, this.ex, this.ey);
      const d = this.dirs[i0] || [1, 0];
      g.uniform2f(U.sweepDir, d[0], d[1]);
      g.uniform1f(U.sweepW, this.sweepW);
      g.uniform1f(U.warmA, Math.min(WARM_CAP, this.plates[i0].warm));
      g.uniform1f(U.warmB, Math.min(WARM_CAP, this.plates[i1].warm));
      g.uniform1f(U.parA, this.plates[i0].parallax);
      g.uniform1f(U.parB, this.plates[i1].parallax);
      g.uniform2f(U.mouseOff, this.eox, this.eoy);
      g.drawArrays(g.TRIANGLES, 0, 3);

      // Dead-paint probe. MUST read here, inside the frame, immediately after the
      // draw: drawImage() on a WebGL canvas without preserveDrawingBuffer returns a
      // CLEARED buffer, so any probe that snapshots the canvas from outside the loop
      // reads pure black and reports a false PASS. (This cost a round of fake
      // verification — the gate said p99=0 while the copy sat on a lit window.)
      if (this._probe) {
        const { x, y, w, h, resolve } = this._probe; this._probe = null;
        const px = new Uint8Array(w * h * 4);
        g.readPixels(x, y, w, h, g.RGBA, g.UNSIGNED_BYTE, px);
        const vals = [];
        for (let i = 0; i < px.length; i += 16)
          vals.push(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
        vals.sort((a, b) => a - b);
        resolve({ p99: Math.round(vals[Math.floor(vals.length * 0.99)]),
                  median: Math.round(vals[Math.floor(vals.length * 0.5)]) });
      }

      this._raf = requestAnimationFrame(this._loop);
    };
    this._raf = requestAnimationFrame(this._loop);
  }

  /**
   * Read the rendered frame under a CSS rect. Honest dead-paint measurement:
   * resolves from inside the draw loop via readPixels. gl y-origin is bottom-left.
   */
  sample(cssRect) {
    const d = this.canvas.width / innerWidth;
    const x = Math.max(0, Math.round(cssRect.left * d));
    const w = Math.max(1, Math.round(cssRect.width * d));
    const h = Math.max(1, Math.round(cssRect.height * d));
    const y = Math.max(0, Math.round(this.canvas.height - (cssRect.top + cssRect.height) * d));
    return new Promise((resolve) => { this._probe = { x, y, w, h, resolve }; });
  }

  setProgress(v) { this.target = Math.max(0, Math.min(1, v)); }
  jumpTo(v) { this.target = this.prog_ = Math.max(0, Math.min(1, v)); }
  setLight(x, y) { this.lx = this.ex = x; this.ly = this.ey = y; }

  destroy() {
    cancelAnimationFrame(this._raf);
    removeEventListener('resize', this._resize);
    removeEventListener('pointermove', this._move);
    this.tex.forEach((t) => t.tex && this.gl.deleteTexture(t.tex));
    this.gl.deleteProgram(this.prog);
  }
}
