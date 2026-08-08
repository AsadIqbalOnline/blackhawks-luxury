/* Showroom stage controller — his reference motion: slides advance ON SCROLL
   (wheel / vertical swipe / arrow keys / dots). The media card tilt-swaps
   (incoming rides over from below at 8°); the left info column swaps with a
   stagger. Markup: #show > .info > .isets > .iset*N, and .media > .slide*N,
   plus .hud with .dots and .count. */
(() => {
  const show = document.getElementById('show');
  if (!show) return;
  const slides = [...show.querySelectorAll('.media .slide')];
  const isets = [...show.querySelectorAll('.iset')];
  const dots = document.querySelector('.hud .dots');
  const count = document.querySelector('.hud .count');
  if (!slides.length) return;
  if (dots) slides.forEach((_, i) => {
    const d = document.createElement('i');
    d.addEventListener('click', () => goto(i));
    dots.appendChild(d);
  });
  let cur = 0, busy = false;

  function paint() {
    if (dots) [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
    if (count) count.textContent =
      String(cur + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  }
  function swap(nxt) {
    if (busy || nxt === cur) return;
    busy = true;
    const a = slides[cur], b = slides[nxt];
    a.classList.add('out');
    b.classList.add('on', 'in');
    b.style.zIndex = 3; a.style.zIndex = 2;          // incoming rides OVER
    isets[cur] && isets[cur].classList.remove('on'); // text out now…
    isets[nxt] && isets[nxt].classList.add('on');    // …new text staggers in (CSS delay)
    b.addEventListener('animationend', () => {
      a.classList.remove('on', 'out'); b.classList.remove('in');
      a.style.zIndex = ''; b.style.zIndex = '';
      cur = nxt; busy = false; paint();
    }, { once: true });
  }
  const go = dir => swap((cur + dir + slides.length) % slides.length);
  const goto = n => swap(n);

  slides[0].classList.add('on');
  isets[0] && isets[0].classList.add('on');
  paint();

  // SCROLL advances — this page does not scroll, it changes cards
  let acc = 0, cool = 0;
  addEventListener('wheel', e => {
    const now = performance.now();
    if (busy || now < cool) { acc = 0; return; }
    acc += e.deltaY;
    if (Math.abs(acc) > 70) { go(acc > 0 ? 1 : -1); acc = 0; cool = now + 500; }
  }, { passive: true });

  let y0 = null;
  addEventListener('pointerdown', e => { y0 = e.clientY; }, { passive: true });
  addEventListener('pointerup', e => {
    if (y0 === null) return;
    const dy = e.clientY - y0; y0 = null;
    if (Math.abs(dy) > 52) go(dy < 0 ? 1 : -1);
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
  });

  show.__go = go;   // test hook
})();
