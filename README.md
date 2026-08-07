# Luxury Fleet — Dubai chauffeur site

**Read `SPEC.md` first. It is the source of truth.** It was produced by a 7-agent
workflow (4 specialists + 2 hostile audits + synthesis) against Asad's stated
requirements, and most of what it says is a correction of an earlier build.

    python3 -m http.server 8901     # → http://localhost:8901

## Layout

    index.html            the site. 4 screens, ~107 words.
    src/photoRelight.js   the engine. cursor = the only light. spec-locked.
    SPEC.md               the locked spec. §8 = what's blocking Asad.
    img/s1..s3-*.png      the three shipping plates
    img/src/              originals (2x, for the supersample deblock)
    tools/                the asset pipeline (below)
    _archive/             four earlier builds, all rejected. kept for reference only.
    _archive/quarantine/  6-rangerover.jpg — real Range Rover, broken lift. re-do this.

## Asset pipeline

Free stock has luxury cars in car parks. The fix is to remove the background.

    swiftc -O tools/lift.swift -o tools/lift      # build once
    ./tools/lift in.jpg out.png                   # macOS Vision subject lift, offline, free
    python3 tools/studio.py out.png plate.jpg     # float on a seamless sweep + contact shadow
    python3 tools/crush.py src.jpg lifted.png out.jpg 0.05   # OR: crush bg to ~5%, keep framing
    python3 tools/plates.py                       # build the 3 shipping plates to spec
    python3 tools/deadpaint.py                    # GATE. exit 1 if copy lands on lit pixels.

Lift+float when the subject sits inside the frame. Crush when it runs off the edge —
deleting a frame-clipped subject's background leaves a hard rectangular cut.

## Rules that are load-bearing (each cost real debugging)

- **NO SCRIMS.** A scrim is an admission the crop is wrong. `deadpaint.py` is a hard
  build failure so the rule can't quietly rot into a gradient.
- **Dead paint moves per breakpoint.** Portrait cover-crops differently. Copy is
  `position:sticky` — absolute copy scrolls and its background changes under it.
- **Verify with screenshots, not JS.** This preview pane reports `document.hidden=true`
  so rAF never fires. And `drawImage()` on a WebGL canvas without `preserveDrawingBuffer`
  returns a cleared buffer — it will report a false PASS. Use `fx.sample()` (readPixels
  inside the loop) or a screenshot.
- **dt-based easing only.** Per-frame lerp runs twice as fast on a 120Hz ProMotion Mac.
- Cover-fit multiplies, never divides. Gloss is a band, not a ramp. Dither dark plates
  and downsample 2× Lanczos, or the shader lights the JPEG's 8×8 blocks.

## The asset seam

`PLATES` in index.html is a config array — `{src, warm, parallax}`. Swap the files and
it's a different site. Nothing is hardcoded into components.

## Status

**Design proof, not the live site.** Every photograph is of a car we do not own.
See SPEC.md §8 (blocking) and §9 (risks).
