// Barcenaria — the saw scenes (docs/cena-serrote.md), built on real footage. Scroll position is the only source
// of truth: every frame maps it to a film frame, transforms and opacity, so scrolling back rewinds the scenes.
// Runs only under html.corte-on (set by corte-boot.js; never with reduced motion).
window.__corte = true; // tells corte-boot.js the scene started

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutBack = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2; // overshoots, then settles
const pad = (n) => String(n).padStart(3, '0');

// one render per animation frame, whoever asks for it (scroll, resize, a film frame that just arrived)
const scenes = [];
let queued = false;
const frame = () => { queued = false; for (const s of scenes) s(); };
const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

// A frame sequence: plain <img> objects, so the browser manages decoding and memory. The first frame comes
// first (it is preloaded in <head>); the rest follow a few at a time. `index(i)` gives the nearest loaded frame
// at or before i, so the film never goes blank while it loads; `onLoad` lets the scene catch up when one arrives.
function sequence(id, count, onLoad) {
  const imgs = new Array(count), ready = new Array(count).fill(false);
  let next = 1, active = 0, loaded = 0;
  const load = (i, done) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { ready[i] = true; loaded++; done(); onLoad(); };
    img.onerror = done;
    img.src = `/video/serra/${id}-${pad(i)}.webp`;
    imgs[i] = img;
  };
  const pump = () => {
    while (active < 4 && next < count) { active++; load(next++, () => { active--; pump(); }); }
  };
  load(0, pump);
  return {
    index(i) { for (let k = Math.min(count - 1, Math.max(0, i)); k >= 0; k--) if (ready[k]) return k; return -1; },
    img: (k) => imgs[k],
    share: () => loaded / count,
  };
}

// Draws `img` covering a w×h canvas, zoomed around the centre.
function cover(ctx, img, w, h, zoom = 1) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/* ---------- scene 1: the film over the first screen ---------- */
function initCorte(sets) {
  const stage = $('#corte'), space = $('.corte-espaco');
  if (!stage || !space) return () => {};
  const top = $('.corte__cima', stage), bottom = $('.corte__baixo', stage), kerf = $('.corte__fenda', stage), hint = $('.corte__rodape', stage);
  const canvases = [...stage.querySelectorAll('.corte__tela')];
  const ctxs = canvases.map((c) => c.getContext('2d', { alpha: false }));
  let W = 0, H = 0, set = null, film = null, last = '';

  // Idle for a while at the very top: the film plays by itself (the scroll is driven with easing, so the scene
  // stays in sync) — but only once most of it has arrived, or a slow connection would open on a still picture.
  // Any touch, wheel or key cancels; tapping the screen plays it too.
  let raf = 0, armed = false;
  const cancel = () => { cancelAnimationFrame(raf); raf = 0; };
  const play = (ms) => {
    if (raf) return;
    const from = scrollY, to = space.offsetHeight, t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / ms);
      scrollTo({ top: from + (to - from) * easeInOut(t), behavior: 'instant' });
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  };
  const tryAuto = () => { if (armed && scrollY < 8 && film.share() >= 0.75) { armed = false; play(6500); } };
  const idle = setTimeout(() => { armed = true; tryAuto(); }, 3500);
  const hands = () => { clearTimeout(idle); armed = false; cancel(); };

  const measure = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (w === W && h === H) return; // mobile browsers fire resize when their bars move: nothing to redo
    W = w; H = h;
    for (const c of canvases) { c.width = W; c.height = H; }
    const id = W >= H ? 'l' : 'p'; // wide screens get the whole frame, phones a vertical window of it
    if (id !== set) { set = id; film = sequence(id, sets[id].frames, () => { request(); tryAuto(); }); }
    last = '';
  };

  const render = () => {
    const p = clamp(scrollY / Math.max(1, space.offsetHeight));
    if (p >= 0.85) root.classList.add('corte-aberto'); // the hero title makes its entrance as the halves part
    const done = p >= 1;
    stage.classList.toggle('is-done', done);
    if (done) return;
    const pc = clamp(p / 0.7);                         // the film: the saw works, the block falls
    const light = easeInOut(clamp((p - 0.7) / 0.08));  // a line of light runs along the cut
    const breath = Math.sin(Math.PI * clamp((p - 0.78) / 0.04)); // the halves press together before parting
    const open = easeInOut(clamp((p - 0.82) / 0.18));  // the picture splits and leaves
    const zoom = 1 + 0.07 * pc;                        // a slow push-in while the saw works
    const k = film.index(Math.round(pc * (sets[set].frames - 1)));
    const key = `${k}|${zoom.toFixed(3)}`;
    if (k >= 0 && key !== last) { last = key; for (const ctx of ctxs) cover(ctx, film.img(k), W, H, zoom); }
    stage.classList.toggle('is-open', open > 0.6);     // parted: clicks reach the page behind
    hint.style.opacity = String(1 - clamp(p / 0.05));
    kerf.style.transform = `scaleX(${light.toFixed(4)})`;
    kerf.style.opacity = String(light * (1 - clamp(open * 3))); // gone well before the halves leave
    top.style.transform = `translate3d(0, calc(${(-open * 104).toFixed(2)}% + ${(breath * 5).toFixed(1)}px), 0)`;
    bottom.style.transform = `translate3d(0, calc(${(open * 104).toFixed(2)}% - ${(breath * 5).toFixed(1)}px), 0)`;
  };

  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, hands, { passive: true });
  stage.addEventListener('click', () => play(5200));
  // keyboard: focus landing on something under the film opens the scene at once
  addEventListener('focusin', () => { if (scrollY < space.offsetHeight) { hands(); scrollTo({ top: space.offsetHeight, behavior: 'instant' }); } });
  measure();
  return Object.assign(render, { measure });
}

/* ---------- scene 2: the bench ---------- */
function initBancada(sets) {
  const sec = $('#bancada');
  if (!sec) return () => {};
  const canvas = $('.bancada__tela', sec), ctx = canvas.getContext('2d', { alpha: false });
  const pieces = [...sec.querySelectorAll('.peca')];
  const N = pieces.length;
  const flat = matchMedia('(max-height: 34.5rem)'); // same query as corte.css: too short to pin the stage
  let film = null, last = -1, wasFlat = false;

  const draw = (q) => {
    if (!film) return;
    const k = film.index(Math.round(clamp(q) * (sets.b.frames - 1)));
    if (k >= 0 && k !== last) { last = k; cover(ctx, film.img(k), canvas.width, canvas.height); }
  };
  const render = () => {
    if (flat.matches) { // a plain section: every piece in place, the film follows the section across the screen
      if (!wasFlat) { wasFlat = true; for (const el of pieces) { el.style.opacity = ''; el.style.transform = ''; } }
      draw((scrollY + innerHeight - sec.offsetTop) / (sec.offsetHeight + innerHeight));
      return;
    }
    wasFlat = false;
    const q = clamp((scrollY - sec.offsetTop) / Math.max(1, sec.offsetHeight - innerHeight));
    const seg = (q * N) / 0.92;   // every piece is on the pile a little before the stage lets go
    draw(q / 0.92);
    for (let i = 0; i < N; i++) {
      const land = clamp((clamp(seg - i) - 0.5) / 0.5); // half of its stretch sawing, half landing
      const e = land > 0 ? easeOutBack(land) : 0;
      pieces[i].style.opacity = String(clamp(land * 3));
      pieces[i].style.transform = `translate3d(0, ${((1 - e) * -64).toFixed(1)}px, 0) rotate(${((1 - e) * (i % 2 ? 5 : -5)).toFixed(2)}deg)`;
    }
  };
  // the bench film only starts loading when the stage gets close
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    film = sequence('b', sets.b.frames, request);
  }, { rootMargin: '100% 0px' }).observe(sec);
  return render;
}

async function start() {
  // before anything loads: a page opened at an anchor or reloaded half way must not sit under the film
  const stage = $('#corte'), space = $('.corte-espaco');
  const past = () => stage.classList.toggle('is-done', scrollY >= space.offsetHeight);
  past();
  addEventListener('scroll', past, { passive: true });
  const sets = await fetch('/video/serra/serra.json').then((r) => r.json());
  removeEventListener('scroll', past);
  scenes.push(initCorte(sets), initBancada(sets));
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { for (const s of scenes) s.measure?.(); request(); });
  frame();
}

if (root.classList.contains('corte-on')) {
  start().catch((err) => { root.classList.remove('corte-on'); console.warn('Cena do serrote indisponível:', err); });
}
