I opened the image folder. Both audits are correct: `3-wait.jpg` has a Mercedes star dead centre under sodium light, `2-cabin.jpg` is a tan limo with purple LEDs, `7-escalade.jpg` is a Cupra Formentor, and `1-door.jpg` — the one asset nobody used — is a suited hand on a rain-beaded black door handle with the background already crushed. I graded it and looked at it. It's the site.

---

# THE LOCKED SPEC — Luxury Fleet, Phase 1

**Status:** buildable. Every number below is measured from the files on disk, not inferred.
**Repo:** `/Users/apple/Projects/luxury-fleet` · **Brief:** `/Users/apple/ClaudeAsad/projects/luxury-fleet/BRIEF.md`

---

## 1. THE THESIS

**One photograph of a man's hand on a door handle, lit only by where the visitor is looking — because the only thing this company sells is that someone is already there, and you only see this work if you go looking for it.**

---

## 2. DELETE TODAY, BEFORE ANY CODE READS THE MANIFEST

| File | Verdict |
|---|---|
| `img/7-escalade.jpg` | **DELETE.** It is a Cupra Formentor. `CUPRA` is legible on the tailgate, wheels are copper. The lift is clean, which makes it *more* dangerous — it looks shippable. A file named for a vehicle it does not depict is a scheduled detonation. |
| `img/3-wait.jpg` | **DELETE.** Mercedes star dead centre, `MERCEDES-BENZ` around the hub, `AMG` on the rim, Mercedes on the caliper. Plus trees, a lamppost, a kerb, and highlights measuring **R−B = +40** — lit by sodium, the exact car park the client rejected. A re-grade does not remove a badge. |
| `img/2-cabin.jpg` | **DELETE.** Tan quilted aftermarket limo conversion, purple LED strips, a TV, a 24-button panel, `AUTO TUNE` branding, scaffolding through the window, a phone left in the console. Mean luminance **45.3**, highlights **R−B = +23**. Fails reqs 9, 15, 17, 19 at once. |
| `img/6-rangerover.jpg` | **QUARANTINE.** It is a real Range Rover Sport — the premise that the fleet can never be shown is *wrong*. But the lift is broken: wheels motion-smeared, cyan fringes along the roofline and flank, a chunk missing from the front arch, no contact shadow. Bad source frame, good tool. Not shippable. Re-lift from a static source. |
| `tools/crush.py:34` | **BUG.** The subject pool multiplies by `[1.0, 0.90, 0.74]` — it paints a **warm sodium pool** into every crushed plate. Change to `[0.94, 0.97, 1.06]`. |

---

## 3. THE SYSTEM

### Palette — 5 values. There is no accent colour.

```css
:root{
  --void:   #000000;  /* RESERVED as material: vignette floor, contact shadow. Never a background. */
  --ground: #08090B;  /* the page. oklch 0.140 .004 260 */
  --ink-3:  #7C7A76;  /* CR 4.65 — 12px+ only */
  --ink-2:  #A7A4A0;  /* CR 8.03 — default for all small type */
  --ink:    #EDEAE5;  /* CR 16.60 — paper. Hover target. */
}
--rule: color-mix(in oklab, var(--ink) 12%, var(--ground)); /* hairline material, never text */
```

**The accent is cut.** SYSTEM's `--xenon` reasoning was rigorous and the destination was wrong twice: blue-white is the semiotics of *headlight upgrades* (req 15's exclusion zone), and a near-black luxury site with an accent has already conceded — Rolls-Royce's palette is black, silver, paper. It also sampled the brand's colour **from a placeholder Audi headlight**. Nothing on this site is coloured. Things are lit. `ENQUIRE` goes `--ink-2` → `--ink` on hover. That is the whole interaction.

**`--ground` is `#08090B`, not `#000`.** This is the one SYSTEM argument that survives intact and it is measured: the plates floor at (0,0,0). If the page also floors at zero, black is spent on the *ground* and the contact shadow has nowhere darker to go. Lift the page, re-floor the plates to (8,9,11), and `--void` becomes a material you place. Cool (B−R=3) because both shipping plates measure cool: `1-door` highlights **R−B = −5.8**, `0-terminal` **R−B = −10.2**.

**Contrast floor, hard:** 9–11px → `--ink-2` minimum. 12px+ → `--ink-3` permitted. Nothing below `--ink-3` is ever text. Quiet comes from size and tracking, never from low contrast.

### Type — Avenir Next. Didot is cut.

```css
--body: "Avenir Next", Avenir, -apple-system, system-ui, sans-serif;
--mono: ui-monospace, "SF Mono", Menlo, monospace;
```

**Didot dies.** SYSTEM correctly named gold as the amateur luxury cliché and then reached for its typographic twin. Didone-on-black is the perfume counter. The tell: 900 words defended it and not one said what Didot *means* — the case was entirely technical. Rolls-Royce sets a sans. Bentley: a sans. Every private-aviation brand: a sans. **And the pixel-snap engineering goes with it** — it existed to stop hairlines crawling, and Avenir is monoline. Honest deletion, not a loss.

Avenir survives on SYSTEM's measured argument: `c` aperture ÷ x-height = **62.6%** vs Helvetica Neue's **30.0%**, and Avenir's aperture *opens* at Medium (63.8%) where Helvetica's *closes* (27.6%). On a near-black page, reversed-out type blooms into its counters. Helvetica has no move here.

| role | face | weight | desktop | mobile | tracking |
|---|---|---|---|---|---|
| `wordmark` | Avenir Next | 500 | 20/20 | 17/17 | +0.22em, UPPER |
| `eyebrow` | SF Mono | 500 | 11/16 | 11/16 | +0.16em, UPPER |
| `d1` headline | Avenir Next | 500 | 40/48 | 26/32 | +0.002em |
| `b1` body | Avenir Next | 400 | 17/27 | 16/26 | +0.004em |
| `btn` | Avenir Next | 500 | 14/14 | 14/14 | +0.10em, UPPER |

Vertical rhythm **4px** — every leading above lands on it. Display capped at 40px: giant type is explicitly excluded (req 11).

### Spacing

- Safe area **40px** desktop / **28px** mobile from every viewport edge. Nothing enters it.
- Headline measure **560px** max. Body measure **380px** max. **Fixed px, never vw** — a caption's rhythm must not change because someone resized a window.
- Copy is **flush-left, anchored to the plate's dead-paint region**. `data-align="center"` does not exist. Centred type has no anchor by definition.
- **NO SCRIMS. EVER.** A scrim is an admission that the crop is wrong. The previous build ran an 84% black gradient across the asset the project exists to show. If copy doesn't fit, the crop changes.

**`tools/deadpaint.py` is a HARD BUILD FAILURE, not a warning.** It asserts p99 luminance < 32/255 in every copy region. This is the only mechanism in any proposal that would have caught `5-return`'s out-of-focus wall. Ship it before the first beat.

```
tools/deadpaint.py plate.jpg x0 y0 x1 y1   # exit 1 if p99 >= 32
```

### Motion constants

```js
// ONE lerp law. dt-based, refresh-rate independent.
v += (target - v) * (1 - Math.exp(-dt / TAU));

const TAU_LIGHT  = 0.035;  // s — the specular under the pointer
const TAU_BODY   = 0.12;   // s — the plate's parallax
const TAU_SCROLL = 0.12;   // s — scroll progress
const LEAD_FRAMES = 0;     // the light sits exactly under the pointer. always.
const POOL        = 0.09;  // shader floor-pool (was 0.05)
```

**SYSTEM's refresh-rate bug is real and its catch is the best engineering in the deck.** `lerp(eased, target, 0.045)` is per-*frame*: 1.100s to settle @60Hz, **0.550s @120Hz — the same code, twice as fast** on a ProMotion Mac, which is the client's own machine. Fixed.

**Adaptive damping is cut.** Two τ blended by a decaying activity value can pump — arrhythmic breathing is worse than the bug it replaces, and its own author said so. One honest τ. At **τ=0.12**, steady-state lag at a 1400px/s flick is **168px = 19% of a 900px viewport**: you feel weight, not lag. (The old τ=0.36 lagged **504px = 56%** — that isn't smooth, that's broken.)

**`TAU_LIGHT` ≠ `TAU_BODY` is the only two-constant decision that survives, and it is physical, not stylistic:** *only mass may lag; light may not.* A lamp and its reflection are instantaneous. A laggy light reads as a dropped frame.

**`LEAD_FRAMES = 0`.** A site that runs ahead of your hand is not confident, it is eager. Its own author forbade explaining it — a mechanic whose meaning cannot be explained does not communicate, it illustrates a slogan. And both of its failure modes are "nobody notices." "He is already there" is copy's job, not a lerp's.

**`POOL` raised 0.05 → 0.09.** The audits caught a collision neither specialist could see alone: SYSTEM staked cursor visibility entirely on the 5% floor-pool while INTERACTION independently set beat intensity to 0.60. Multiplied: **0.03** — an invisible cursor on the darkest plate in the first 800ms. Raised, and the native cursor stays visible anyway.

```css
--ease-micro: cubic-bezier(0.4, 0, 0.2, 1);   /* hover/press — 160ms, never slower than 180 */
--ease-out:   cubic-bezier(0.22, 1, 0.36, 1);  /* discrete state only */
```
**Nothing on this site ease-ins.** Ease-in is hesitation. A professional moves immediately and arrives without drama.

**`prefers-reduced-motion`:** τ→0, parallax→0, sweeps hard-cut at 50%. **The site must work as three stills.** That it can is the only honest test that the motion carries meaning rather than carrying the site.

---

## 4. THE SECTIONS — 4 screens, ~107 words

**Why four.** Because both audits converged on the same verdict from opposite directions: *less*. The luxury audit's prescription — "four effects, one whole photograph, a name set large on black, about ninety words" — is correct, and the reason is that luxury is the absence of visible effort. Every section below either shows the service or asks for the business. There is no third category, so there is no third kind of screen.

**Killed by name, do not reinstate:** About Us · Why Choose Us · services grid · testimonials · values · stats · amenities list · fleet gallery · FAQ · blog · anything about Dubai · the day rail · the clock · the per-beat timestamps · a separate fleet screen.

---

### S1 · THE DOOR — hero
**Plate:** `1-door.jpg`, full frame, graded. Warmth **0.34**. Parallax **0.055**.

> [WORDMARK]
>
> `CHAUFFEURED CARS FOR TOUR OPERATORS · DUBAI`
>
> **Your client does not open the door.**
>
> Met by name at the barrier. The bags are moving before the greeting is finished.

Eyebrow tells an operator in one second that *they* are the customer — no competitor does this. The headline survived both audits untouched; nobody could beat it. The body is two facts and no verb doing any selling.

**Copy sits top-left** (x 0→560, y 40→300) — measured dead paint, p99 < 32. Verify with `deadpaint.py`.

### S2 · THE WAIT — the refusal
**Plate:** `0-terminal.jpg`, graded. Warmth **0.10** (nobody is there). Parallax **0.000**.

> **He does not leave.**
>
> At the kerb since 05:50. The flight lands at 06:35. Not circling, not parked twenty minutes away, not on another job.

The three negations are the three real failure modes in an operator's own vocabulary. **One timestamp on the whole site, and it lives here** — a wait without a duration is not a wait. The rest are cut: precision-as-signifier is a tech tell, and Rolls-Royce does not timestamp.

### S3 · THE RETURN
**Plate:** `5-return.jpg` **cropped to (900, 250, 2000, 869)** = 1100×619, 16:9. Warmth **0.30**. Parallax **0.055**.

> **He carries no cards.**
>
> No number, no commission, no detour. Your client bought their day from you.

This is the best commercial insight anyone had, converted from aphorism to object per the audit. Every operator in this market has been burned by a driver handing out his own number. Nobody says it out loud. It also does req 4's work structurally: *we do not touch your business* — the constraint becomes the strongest argument on the page.

### S4 · THE ASK
**No photograph.** Pure `--ground`. 100vh, static.

> `GROUND TRANSPORT FOR TOUR OPERATORS · DUBAI`
>
> Range Rover and Cadillac Escalade. Chauffeur included.
>
> **Send us a day.**
>
> A date, a flight number, a headcount.
>
> [ WHATSAPP US A DAY ]   [ EMAIL ]
>
> `No rate card on this page. Rates run on hours, not kilometres, so we would rather quote your actual day.`

The fleet is **one line above the CTA, not a screen before it** — two screens for one closing idea is padding. Naming the vehicles is nominative fair use; the legal problem was 3D of the trade dress, not the words. **No seat counts** — nobody has counted them.

**Primary = `wa.me/` deep link**, prefilled *"Day for [date], flight [no.], [pax] passengers."* An ops manager on 4G in Deira does not fill in a form. **Styled as a text link in the page's register — never a green branded chip**, which would undo S1–S3 in one glance. Secondary = `mailto:` for procurement's paper trail.

**Footer:** `[Wordmark] · Dubai · WhatsApp · Email` / `Passenger transport licence [NUMBER REQUIRED]`

---

## 5. THE INTERACTION

### The central idea
**The cursor is the only light in the frame.** The car is invisible until someone looks for it. That is the service made literal — this business's entire product is labour nobody sees — and it teaches itself in two seconds with no caption.

### Cursor model
- **`cursor: none` is cut. The native OS cursor stays visible.** Hover⇒clickable is a standing build pref (`ASAD_BUILD_PREFERENCES` 1.1) and this page has a wordmark, two buttons and a footer. The light is **additive**, not a replacement.
- **No avatar.** No ring, no dot, no trail. The specular *is* the evidence. A ring is a second cursor competing with the first.
- **No lead.** `LEAD_FRAMES = 0`. Exactly under the pointer, always.
- **No idle coast.** When the pointer stops, the light stops. An autonomous light drifting around a page nobody is touching is ambient decoration, and it breaks its own thesis: if the light moves without a hand, the light is not the cursor.
- **No hint copy.** "Move your cursor. It is the only light in here" is the site explaining its own trick. If the light doesn't teach itself in 400ms, fix the light.
- **No hover beam-tighten.** `--ink-2` → `--ink` satisfies the affordance.
- **Mobile:** `pointermove` fires on touch-drag — the light tracks the thumb, offset **+8vh** (a finger covers what it points at). Finger off glass, light stops. Scroll drives everything; the site is complete without ever touching it. **No DeviceOrientation** — a permission prompt for a lighting effect reads cheap.

### Scroll model
Native scroll. **No Lenis, no hijacking** — smoothness comes from the rAF-eased shader, not from stealing the scrollbar. The light being honest is only meaningful if the user's input is exact.

`3 beats × 120vh = 360vh scrub` + `100vh static S4` = **460vh ≈ 4 flicks.**

```
 0% ──────────────── 27%    S1 THE DOOR    hold
27% ── 35%                  SWEEP 1→2       8% ≈ 29vh ≈ ~500ms
35% ──────────────── 62%    S2 THE WAIT    hold
62% ── 70%                  SWEEP 2→3       8%
70% ──────────────── 100%   S3 THE RETURN  hold
```
**84% hold / 16% transition.** Beats hold because you cannot inspect a moving frame.

```js
const SWEEPS = [[0.27, 0.35], [0.62, 0.70]];
function mapScroll(s){                       // s = raw page scroll 0..1
  let p = 0;
  for (const [a,b] of SWEEPS){
    const x = Math.min(1, Math.max(0, (s-a)/(b-a)));
    p += (1 - Math.pow(1-x, 3.2)) / SWEEPS.length;   // fast out, long settle. never ease-in.
  }
  return p;                                  // → fx.setProgress(p)
}
```

### Transition model
```glsl
w = 0.04 + 0.9 * abs(dFront_dt);   // base 0.17, edge glow 0.17
```
**Sweep front narrowed 0.34 → 0.17.** At 0.34, 68% of the frame is mid-blend at any instant — that is a diagonal cross-dissolve, not a light front.

**The velocity→softness law is the line that makes it read as light travelling rather than a wipe.** A fast front has a soft edge (motion blur); a slow one is crisp. It ships as an *unnamed property of the sweep* — never as a designed effect.

Sweep directions travel rearward and **never reverse**: 1→2 `(0.94, −0.34)`, 2→3 `(0.97, −0.24)`. One light, one direction, once.

⚠ **Code change, `src/photoRelight.js:222`:** `sun = lerp(this.sun[i0], this.sun[i1], m)` freezes during a hold and welds `sweepDir` to `sun`. Decouple `sweepDir` into a designed per-transition constant. **Do not add sun drift** (see cuts).

### The four movements. Each carries its defence.

| Movement | Defence |
|---|---|
| **The cursor is the light** | The car is invisible until someone looks for it. This company's product is work nobody sees. |
| **The sweep** | One light, front to back, once, never reversing. The assignment only moves one way. |
| **Warmth means a person is present** (0.34 door / 0.10 headlight) | The only motivated colour decision anyone made. It communicates without being explained. |
| **The refusal** (parallax = 0 on S2) | You push and the car does not move. Your own input proves "He does not leave." The only *demonstration* on the site — everything else is telling. |

**`lightWarm` capped at 0.35 site-wide.** Shader line 97: `warm = mix(vec3(.62,.74,1.0), vec3(1.0,.72,.36), lightWarm)` — the warm end is **orange**. INTERACTION set the final CTA frame to 0.66, meaning the last thing a tour operator sees is flooded sodium-amber: the exact colour of the car park the client rejected. A tail light is red by its own emission; you do not need to flood the frame to say so.

**Perf, free:** the fragment shader runs `shade()` twice (~50 texture fetches/px). The scroll model holds at `mixAB ≈ 0` for **84%** of the time:
```glsl
vec3 a = shade(texA, uv, resA);
if (mixAB < 0.001) { o = vec4(a, 1.0); return; }
```
Cap DPR at **1.5 on touch**. The scroll model pays for the shader.

---

## 6. THE ASSETS

### Shipping set — 3 plates, all already on disk

| # | File | Crop | Measured |
|---|---|---|---|
| S1 | `img/1-door.jpg` | full frame 2000×1125 | highlights **R−B = −5.8** (cool), p5 = 1.0 |
| S2 | `img/0-terminal.jpg` | full frame 2000×1125 | mean **19.0**, highlights **R−B = −10.2** (cool) |
| S3 | `img/5-return.jpg` | **crop (900, 250, 2000, 869)** → 1100×619 | crop mean **22.6**, corners 0–3 — verified 100% car |

**`1-door.jpg` is the hero, and this is the pivotal call.** It is the one asset that satisfies req 16 — the only photograph in the project of *service being performed*. It also answers the luxury audit's first violation head-on: it is not a macro crop, it is a whole flank with air around it, a wheel, glass, wet lacquer, and a man. **ASSETS declared this photo's entire category unsourceable while it sat in the project folder.** Its three defects — taupe suit, sedan not SUV, head cut at frame top — are, in order: fixed by the grade, unfixable without a shoot (named in risks), and correct as-is (the face is not the subject).

**The `5-return` crop is not optional.** At full frame its left third is soft grey-brown environmental bokeh — a wall, just an out-of-focus one — and `deadpaint.py` would place copy directly onto it because it reads dark. That is *literally* the client's rejection sentence.

### Grade — one recipe, all three plates, in float32

```
lift 0.031 → gain 0.78 → gamma 1.75 → tint (R 0.95, G 0.98, B 1.00)
```
**Measured result:** `1-door` mean **45.3 → 21.4**, max **255 → 141.5**. Lands all three plates at **mean 19–23** — one near-black register, one car. Gain 0.78 leaves headroom so **the relight specular, not the JPEG, owns the brightest pixel.** The cool tint holds the two cameras together. Lift re-floors black to (8,9,11) to meet `--ground` with no visible rectangle.

I rendered it and looked at it. The taupe suit drops to charcoal, the white shirt stops blowing out, the beaded lacquer holds. It is a luxury frame.

### Pipeline
1. Fetch/open at **2× target width, q=100**, crop server-side.
2. Grade (above), float32.
3. **Lanczos downsample to target.** ← this is the deblocker.
4. Dither ±1 LSB.
5. **Save PNG** for any plate the shader reads.

**The dither assumption in TOOLS.md needs correcting, and it's measured.** Block-boundary/interior ratio (>1.15 = visible): raw source **1.42** — *the blocking is already there before grading*. Dither ±0.5 → **1.25**. ±2.0 → **1.13** (and ±2 LSB of noise on quiet lacquer is visible grain). Shadow-weighted deblock → **1.32**, useless. **2× supersample + Lanczos → 1.00.** Gone. 3× buys nothing. Keep the ±1 dither anyway — it prevents *new* banding at final 8-bit quantisation, a different problem.

⚠ **Build blocker:** the img/ plates are 2000×1125 downsamples and their Unsplash origin URLs are **not recorded anywhere in the repo** (I grepped). 2000→1600 is only 1.25× — not enough to kill the blocking. **Recover the originals before the grade pass**, or accept residual DCT blocking that the shader will light.

### Reserve / sanctioned upgrades — verified by ASSETS, `HTTP 200`, real JPEG

- `https://images.unsplash.com/photo-1749043140503-da3546679d54` — Haberdoedas, **Unsplash License** (free commercial), **11648×8736 / 100MP**, Fujifilm GFX100 II. Near-black **SUV** front end, frame 100% car. **The sanctioned upgrade for S2**: higher-res than `0-terminal`, and an SUV, which matches the fleet body type. Verify `rect + w + h ≤ 11648×8736` — a prior crop silently padded a black bar.
- `https://images.unsplash.com/photo-1550565076-b2371ea1a324` — Tuomas Nylund, **Unsplash License**, 4368×2912. Rain beads on black lacquer, verified 100% car. **Reserve for S1** if the taupe suit is rejected — but it has no person in it, so it costs req 16. Prefer the shoot.
- `https://images.unsplash.com/photo-1678282514430-1350ec121314` — **CUT.** ASSETS itself states: *"This is a CGI render, not a photograph."* On a site whose req 10 is realism, an unidentified render fenced by a discipline rule its own author admits may not hold. Where a fence is needed to stop an asset lying, the asset goes. `--ground` is a better background and cannot be mistaken for a claim.
- **Three tempting candidates are `plus.unsplash.com` premium**, not free (Krivec red-stitched leather, Petrischev wheel detail, Spiske black-car front). Any future "just grab one more like it" pass is a licence violation waiting.

### The asset seam
Plates are a config array — `{src, crop, warm, parallax, sweepDir, copy}` — never hardcoded into components. Real fleet photography drops in by editing a manifest. **Swap the files, it's a different site.**

---

## 7. WHAT WAS CUT, AND WHY

**Structure:** 3 competing structures (7 / 5 / 4 screens) → **4**. The walk-around spine (INTERACTION) is killed: "one car, headlight to tail light" is structurally identical to every dealer configurator on earth, its traverse order *is* the car's geometry, and its own risk #4 conceded the site collapses if the plates can't be graded to one car — that is car-led by construction, whatever the copy says. NARRATIVE's day survives a fleet change (locked decision #1). Structure = time, not geometry.

**Motion — cut, with the reason:**
- **The 110ms cursor lead** — eager, not confident; forbidden from being explained; both failure modes are "nobody notices."
- **Sun drift (+14°/+5°/+8°)** — a 14° rotation over 18% of a page is below the perception threshold. Motion detectable only by diffing two screenshots. Its own author called beat 2 "barely alive."
- **The reflection pre-echo** — the physics defence is fake. Lacquer reflects *approaching objects*, not the next crop of the same car. A cross-dissolve in a physics costume.
- **The idle coast** (drag 0.90 + spring k=0.012) — breaks its own thesis. If the light moves with no hand on it, it isn't the cursor.
- **Adaptive damping** — a metaphor the visitor never receives, and it can pump.
- **Per-beat parallax deltas** (0.030/0.055/0.075/0.045) — nobody has ever perceived a parallax delta. One value, and one beat that refuses it. Binary is a statement; four values are four alibis.
- **Per-beat intensity curve** — one value, 0.72.
- **Copy stagger / entrances** — *nothing on this site has an entrance, because nothing here needs to make one.* Everything was ready before you arrived. This kills most of the padding temptation, and it contradicted SYSTEM's own best idea: if the words are attached to the car, they arrive when the car arrives.
- **Ken Burns scale on plates** — the cheapest move in the medium.
- **Lit type** — type is not a surface. It lives in a DOM layer above the canvas, unlit.
- **Scroll hijacking, cursor ring, char-by-char reveal, horizontal scroll, vehicle rotation, audio, DeviceOrientation.**

**Chrome:** the day rail — a scroll progress bar wearing a watch face, and its own defence gave it away (*"it proves the site is SHORT"*). Furniture that apologises for the content is a site that doesn't trust itself. The clock. The `SCROLL` hint. The loupe ring.

**System:** Didot. The accent colour. Pixel-snapping (served Didot). Centred layout. Scrims. The separate fleet screen.

**Copy:** every aphorism. *"Nothing will happen today."* — a coin-flip line the client reads once out of context and hates. *"Silence is the only review this work can produce"* — luxury does not philosophise about itself; explaining the absence of testimonials is what turns it into a hole. *"He said eleven words"* — a writer counting out loud so you notice how observed he is. *"He will not recommend a shop"* → **"He carries no cards"**: a brand that tells you it won't rip you off has raised the possibility that it might. State facts. Let the operator draw the conclusion — he'll draw a better one than you can write.

**Fake features:** `[Operator rates →]` — a primary CTA linking to a rate card that does not exist. The invented SLA (*"a rate the same day"*). Invented seat counts. The day rail's five fiction timestamps typeset in the one face designated as the voice of verified fact.

---

## 8. BLOCKING — Asad, before this ships

1. **The name.** The wordmark is the single object that does the work; this spec is built around a hole where it goes. "Naming must not block design work" was right in research and is now the thing preventing the design from being anything. **Escalate today.**
2. **The shoot. AED 1,500–3,000, half a day.** This is the real deliverable of the whole exercise. ASSETS found the argument and buried it: **macro and low-key remove the background, therefore they remove the studio.** He needs one washed car, any underground car park at night, one light, one 100mm lens — and one black suit sleeve, one pair of gloves, one door handle. **`1-door.jpg` already proves the shot composes.** He declined a *studio*. Nobody has asked him for a car park. This one decision unblocks reqs 6, 16 and 25 simultaneously, and every proposal in this deck is a workaround for it.
3. **Eight facts, or the page inverts from specific to lying:** WhatsApp number · email · passenger transport licence number · are both cars black · is the Escalade the ESV · real pax/case counts · is waiting inside the day rate · is pricing hourly.
4. **The positioning call.** If the real buyer is procurement rather than the operator's owner, this register — no rates, no capacity, no spec sheet — is a liability no matter how well executed. No visual system answers that. Make it before build, not after the fourth rejection.

---

## 9. RISKS — plainly

**Every photograph on this site is of a car we do not own.** `1-door` is an S-Class-ish sedan; `0-terminal` is an Audi Q7; `5-return` is an Audi A6. The fleet is two large SUVs. Cropping does not fix this — accept the objection fully and you ship zero photographs. **Ship this as a design proof, not as the live site.** The only real fix is item 2 above. I am naming it rather than routing around it a fourth time.

**The luxury audit's central charge is only half answered.** It is right that macro-chrome-on-black is detailing-shop language and that concealment reads differently from restraint. `1-door` at full frame — a car with air around it and a person in it — is my answer, and I believe it holds. But S2 and S3 are still tight crops, and if he asks "why can't I see the car?" on those screens, he is right and the answer is the shoot.

**`6-rangerover.jpg` reopens a question all four proposals closed.** The premise that the fleet can never be depicted is wrong — the tool works (`7-escalade`'s lift is clean). What's broken is the *source frame*, not the law. A clean re-lift is the only thing that answers an operator's actual first question, and it is a two-hour job, not a legal wall. It is deliberately not in this spec because it is not shippable today. It should be the next thing built.

**Four screens and ~107 words may read as unfinished rather than restrained.** This is the deliberate bet and it is the right one, but BRIEF risk #5 is real: at 80% execution this is worse than a clean static site. There is nothing left on screen to hide behind. **If it reads thin, the answer is better plates — never more furniture.** Adding chrome back treats the symptom, and SYSTEM said this itself and then shipped a rail.

**The refusal is the whole extraordinary claim, and it is unproven.** Parallax=0 on one beat is legible only if parallax is genuinely felt on the other two. If 0.055 is imperceptible, the refusal refuses nothing and the site has three effects, not four. **Build S2 and S3 side by side first, before any copy, as the go/no-go.**

**Near-black is unforgiving.** Mean 19–23 is beautiful on his M1 Pro and a black rectangle on a tourism operator's uncalibrated office monitor. **Nobody owns the no-shader path**: if WebGL fails or a phone throttles, the fallback is not "less impressive," it is blank. Every plate needs a static graded fallback legible with zero WebGL. Assign it.

**Mobile carries the audience and is unproven.** The buyer is an ops manager on 4G in Deira. `mixAB` early-out + DPR 1.5 *should* hold 60fps. **Build S2 on a real mid-range Android first — not an iPhone, not a simulator.** If the light doesn't read through a thumb, the concept is wrong for the audience and an afternoon is cheaper than a fourth rejection.

**"No scrims" is the rule most likely to break under content pressure.** The moment a headline runs three lines and `deadpaint.py` fails, there will be enormous temptation to add "just a little" gradient. That is how the last build got its 84% scrim. **Hard build failure, not a warning** — otherwise the rule is decorative.