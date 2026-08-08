/* Deck controller — tilt-swap card slider (his reference motion).
   Markup: .deck > .slide*N, followed by .deck-ui with .dots, .count and
   [data-prev]/[data-next] buttons. Keyboard arrows + touch swipe included. */
(() => {
  document.querySelectorAll('.deck').forEach(deck => {
    const slides = [...deck.querySelectorAll('.slide')];
    if (slides.length < 2) { slides[0] && slides[0].classList.add('on'); return; }
    const ui = deck.parentElement.querySelector('.deck-ui');
    const dots = ui ? ui.querySelector('.dots') : null;
    const count = ui ? ui.querySelector('.count') : null;
    if (dots) slides.forEach(() => dots.appendChild(document.createElement('i')));
    let cur = 0, busy = false;

    function paint() {
      if (dots) [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
      if (count) count.textContent =
        String(cur + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    }
    function go(dir) {
      if (busy) return;
      busy = true;
      const nxt = (cur + dir + slides.length) % slides.length;
      const a = slides[cur], b = slides[nxt];
      a.classList.add('out');
      b.classList.add('on', 'in');
      b.style.zIndex = 3; a.style.zIndex = 2;   // incoming rides OVER
      b.addEventListener('animationend', () => {
        a.classList.remove('on', 'out'); b.classList.remove('in');
        a.style.zIndex = ''; b.style.zIndex = '';
        cur = nxt; busy = false; paint();
      }, { once: true });
    }
    slides[0].classList.add('on');
    paint();
    if (ui) {
      const p = ui.querySelector('[data-prev]'), n = ui.querySelector('[data-next]');
      if (p) p.addEventListener('click', () => go(-1));
      if (n) n.addEventListener('click', () => go(1));
    }
    addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });
    let x0 = null;
    deck.addEventListener('pointerdown', e => { x0 = e.clientX; }, { passive: true });
    deck.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    deck.__go = go;   // test hook
  });
})();
