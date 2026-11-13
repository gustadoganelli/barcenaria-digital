// Barcenaria — the saw scenes (docs/cena-serrote.md): real footage as the base, animation on top of it.
// The scroll position is the only source of truth, but it is followed with a little inertia, so the film and
// everything tied to it glide instead of stepping with the mouse wheel. Scrolling back rewinds the scenes.
// Runs only under html.corte-on (set by corte-boot.js; never with reduced motion).
window.__corte = true; // tells corte-boot.js the scene started

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutBack = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2; // overshoots, then settles
const pad = (n) => String(n).padStart(3, '0');
// The page after the hero is not painted while the film runs (corte.css). When the opening ends it is released
// one section at a time, nearest first; `now` releases everything at once (keyboard, page opened further down).
let rest = null, releasing = false;
const finish = (now) => {
  rest ??= [...document.querySelectorAll('main > :not(.corte-pista), .footer')];
  if (now === true) { for (const el of rest.splice(0)) el.classList.add('corte-visto'); return; }
  if (releasing) return;
  releasing = true;
  const step = () => { const el = rest.shift(); if (el) { el.classList.add('corte-visto'); setTimeout(step, 80); } };
  step();
};
// The hero video (site.js) waits behind the film until most of the film has arrived, so the two do not compete
// for the connection at load; it is also let go when the halves part, or if the scene gives up.
const freeVideo = () => { if (!window.__corteVideo) { window.__corteVideo = true; dispatchEvent(new Event('corte:video')); } };

/* ---------- the loop: one animation frame for everything, only while something still moves ---------- */
const scenes = [];   // each scene: (smoothed scroll, its speed in px/ms, ms since last frame) => still animating?
const FOLLOW = 110;  // ms the picture takes to cover ~63% of the distance to the real scroll position
let sy = scrollY, running = false, prev = 0;
const tick = (now) => {
  const dt = clamp(now - prev, 1, 50);
  prev = now;
  const gap = scrollY - sy;
  // close enough, or a jump (anchor, reload, back/forward): land on it; otherwise ease towards it
  const next = Math.abs(gap) < 0.5 || Math.abs(gap) > innerHeight * 3 ? scrollY : sy + gap * (1 - Math.exp(-dt / FOLLOW));
  const speed = (next - sy) / dt;
  sy = next;
  let busy = sy !== scrollY;
  for (const s of scenes) busy = s(sy, speed, dt) || busy;
  running = busy;
  if (busy) requestAnimationFrame(tick);
};
const request = () => { if (!running) { running = true; prev = performance.now() - 16; requestAnimationFrame(tick); } };

/* ---------- film: a frame sequence ---------- */
// The frames are fetched as blobs (compressed, a few at a time; the first one is preloaded in <head>). Around
// the playhead a small window of them is kept decoded as ImageBitmaps — decoded from the blob, which browsers do
// off the main thread — so drawing a frame is a plain copy and never waits for a decode. That wait, plus a
// page-wide restyle per scroll frame (see site.js), was what made the film stutter.
// `frame(i)` gives the best decoded picture for frame i (itself, or the nearest one behind the playhead), or
// null while nothing is ready; every frame that arrives or gets decoded asks for a render, so the film catches up.
function sequence(id, count, onLoad) {
  const blobs = new Array(count).fill(null);
  const decoded = new Map(), pending = new Set();
  let next = 1, active = 0, loaded = 0, head = 0, dir = 1, dead = false;
  const release = () => { for (const b of decoded.values()) b.close(); decoded.clear(); };
  const decode = (i) => {
    if (i < 0 || i >= count || !blobs[i] || decoded.has(i) || pending.has(i)) return;
    pending.add(i);
    createImageBitmap(blobs[i]).then((b) => {
      pending.delete(i);
      if (dead || Math.abs(i - head) > 20) { b.close(); return; }
      decoded.set(i, b);
      onLoad();
    }, () => pending.delete(i));
  };
  const warm = (k) => { // the playhead first, then more frames ahead of it than behind; the far ones are dropped
    if (k !== head) { dir = k > head ? 1 : -1; head = k; }
    for (const [i, b] of decoded) if ((i - k) * dir > 18 || (k - i) * dir > 8) { b.close(); decoded.delete(i); }
    for (let d = 0; d <= 14; d++) decode(k + d * dir);
    for (let d = 1; d <= 4; d++) decode(k - d * dir);
  };
  const load = (i, done) => {
    fetch(`/video/serra/${id}-${pad(i)}.webp`).then((r) => (r.ok ? r.blob() : null)).then((blob) => {
      if (dead) return;
      if (blob) { blobs[i] = blob; loaded++; }
      done();
      if (blob) onLoad();
    }, done);
  };
  const pump = () => {
    while (!dead && active < 4 && next < count) { active++; load(next++, () => { active--; pump(); }); }
  };
  load(0, pump);
  return {
    frame(i) {
      let k = Math.min(count - 1, Math.max(0, i));
      while (k >= 0 && !blobs[k]) k--;   // the nearest frame that has arrived, at or before i
      if (k < 0) return null;
      warm(k);
      for (let d = 0; d <= 10; d++) { const j = k - d * dir; if (decoded.has(j)) return { k: j, src: decoded.get(j) }; }
      return null;
    },
    share: () => loaded / count,
    release,
    kill() { dead = true; release(); },
  };
}

/* ---------- sawdust: a few dozen particles on a transparent canvas ---------- */
const DUST = ['#f3dcae', '#e6c188', '#cf9f5f', '#a9763c'];
function dust(canvas) {
  const ctx = canvas.getContext('2d');
  const parts = [];
  let w = 0, h = 0, dirty = false;
  return {
    size() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
    },
    // n particles from (x, y): `push` is a sideways bias, `spread` the sideways scatter, `up` the initial lift (px/ms)
    emit(x, y, n, { push = 0, spread = 0.22, up = 0.22 } = {}) {
      for (let i = 0; i < n && parts.length < 320; i++) {
        parts.push({
          x, y, t: 0, life: 560 + Math.random() * 760, s: 2 + Math.random() * 4,
          vx: push + (Math.random() - 0.5) * 2 * spread, vy: -Math.random() * up,
          c: DUST[(Math.random() * DUST.length) | 0],
        });
      }
    },
    step(dt) {
      if (!parts.length) { if (dirty) { ctx.clearRect(0, 0, w, h); dirty = false; } return false; }
      ctx.clearRect(0, 0, w, h);
      dirty = true;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.t += dt;
        if (p.t >= p.life) { parts.splice(i, 1); continue; }
        p.vy += 0.0015 * dt;                 // gravity
        p.vx *= 1 - 0.0012 * dt;             // air
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalAlpha = 1 - (p.t / p.life) ** 2;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s * 0.6);
      }
      ctx.globalAlpha = 1;
      return true;
    },
  };
}

/* ---------- scene 1: the film over the first screen ---------- */
// where the saw meets the wood, as a fraction of each frame (the camera is fixed)
const CUT = { p: [0.549, 0.52], l: [0.455, 0.52] };

function initCorte(sets) {
  const stage = $('#corte'), space = $('.corte-espaco');
  if (!stage || !space) return () => false;
  const top = $('.corte__cima', stage), bottom = $('.corte__baixo', stage), kerf = $('.corte__fenda', stage), hint = $('.corte__rodape', stage);
  const canvases = [...stage.querySelectorAll('.corte__tela')];
  const ctxs = canvases.map((c) => c.getContext('2d', { alpha: false }));
  const words = [...stage.querySelectorAll('.corte__fala')];
  const po = dust($('.corte__po', stage));
  let W = 0, H = 0, split = 0, set = null, film = null, drawn = -1, burst = false, resting = false;

  // Idle for a while at the very top: the film plays by itself (the scroll is driven with easing, so the scene
  // stays in sync) — but only once most of it has arrived, or a slow connection would open on a still picture.
  // Any touch, wheel or key cancels; tapping the screen plays it too.
  let raf = 0, armed = false;
  const cancel = () => { cancelAnimationFrame(raf); raf = 0; };
  const play = (ms) => {
    if (raf) return;
    const from = scrollY, to = space.offsetHeight;
    let spent = 0, last = 0;
    const step = (now) => { // counts the time actually shown: a tab left in the background resumes where it was
      if (last) spent += Math.min(now - last, 50);
      last = now;
      const t = clamp(spent / ms);
      scrollTo({ top: from + (to - from) * easeInOut(t), behavior: 'instant' });
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  };
  const tryAuto = () => { if (armed && !document.hidden && scrollY < 8 && film.share() >= 0.75) { armed = false; play(6500); } };
  document.addEventListener('visibilitychange', tryAuto);
  const idle = setTimeout(() => { armed = true; tryAuto(); }, 3500);
  const hands = () => { clearTimeout(idle); armed = false; cancel(); };

  const measure = () => {
    W = stage.clientWidth; H = stage.clientHeight; split = top.offsetHeight;
    po.size();
    const id = W >= H ? 'l' : 'p'; // wide screens get the whole frame, phones a vertical window of it
    if (id === set) return;
    set = id;
    // the canvases keep the film's own resolution: drawing a frame is a plain copy, the browser does the scaling
    for (const c of canvases) { c.width = sets[id].width; c.height = sets[id].height; }
    drawn = -1;
    film?.kill();
    film = sequence(id, sets[id].frames, () => { request(); tryAuto(); if (film.share() >= 0.75) freeVideo(); });
  };

  const render = (y, speed, dt) => {
    const p = clamp(y / Math.max(1, space.offsetHeight));
    if (p >= 0.85) { root.classList.add('corte-aberto'); freeVideo(); } // the hero title makes its entrance as the halves part
    const done = p >= 1;
    stage.classList.toggle('is-done', done);
    if (done) { if (!resting) { resting = true; film.release(); finish(); } return false; } // off screen: free the decoded frames
    resting = false;
    const pc = clamp(p / 0.68);                         // the film: the saw works, the block falls
    const light = easeInOut(clamp((p - 0.68) / 0.08));  // a line of light runs along the cut
    const breath = Math.sin(Math.PI * clamp((p - 0.76) / 0.05)); // the halves press together before parting
    const open = easeInOut(clamp((p - 0.81) / 0.19));   // the picture splits and leaves
    const zoom = 1 + 0.08 * pc;                         // a slow push-in while the saw works

    const f = film.frame(Math.round(pc * (sets[set].frames - 1)));
    if (f && f.k !== drawn) { drawn = f.k; for (const ctx of ctxs) ctx.drawImage(f.src, 0, 0); }
    for (const c of canvases) c.style.transform = `scale(${zoom.toFixed(4)})`;

    // sawdust flies from the cut while the saw is in the wood, as much as the scroll is moving
    if (pc > 0.02 && pc < 0.8 && Math.abs(speed) > 0.02) {
      const s = Math.max(W / sets[set].width, H / sets[set].height) * zoom;
      const x = W / 2 + (CUT[set][0] - 0.5) * sets[set].width * s, yy = H / 2 + (CUT[set][1] - 0.5) * sets[set].height * s;
      const n = Math.min(7, Math.abs(speed) * 5);
      po.emit(x, yy, Math.floor(n) + (Math.random() < n % 1 ? 1 : 0), { push: 0.05, spread: 0.2, up: 0.2 });
    }
    // the cut goes through: sawdust bursts along the line (once per pass, only when going forward)
    if (light > 0.5 && !burst) { burst = true; if (speed > 0) for (let i = 0; i < 80; i++) po.emit(Math.random() * W, split, 1, { spread: 0.3, up: 0.45 }); }
    if (p < 0.6) burst = false;

    // the words of the house, one per stroke: stamped in with overshoot, lifted out before the next
    for (let i = 0; i < words.length; i++) {
      const t = (pc - (0.06 + i * 0.3)) / 0.3;
      const a = clamp(t / 0.22), b = clamp((t - 0.78) / 0.22), e = easeOutBack(a);
      words[i].style.opacity = t <= 0 || t >= 1 ? '0' : String(clamp(a * 2.5) * (1 - b));
      words[i].style.transform = `translate3d(0, ${(-b * 40).toFixed(1)}px, 0) rotate(${((1 - e) * (i % 2 ? 4 : -4)).toFixed(2)}deg) scale(${(1.4 - 0.4 * e).toFixed(3)})`;
    }

    stage.classList.toggle('is-open', open > 0.6);      // parted: clicks reach the page behind
    hint.style.opacity = String(1 - clamp(p / 0.05));
    kerf.style.transform = `scaleX(${light.toFixed(4)})`;
    kerf.style.opacity = String(light * (1 - clamp(open * 3))); // gone well before the halves leave
    // each half leaves with a slight tilt, like two boards coming apart
    top.style.transform = `translate3d(0, calc(${(-open * 110).toFixed(2)}% + ${(breath * 6).toFixed(1)}px), 0) rotate(${(-open * 1.4).toFixed(3)}deg)`;
    bottom.style.transform = `translate3d(0, calc(${(open * 110).toFixed(2)}% - ${(breath * 6).toFixed(1)}px), 0) rotate(${(open * 1.4).toFixed(3)}deg)`;
    return po.step(dt);
  };

  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, hands, { passive: true });
  addEventListener('keydown', () => finish(true), { once: true });
  stage.addEventListener('click', () => play(5200));
  // keyboard: focus landing on something under the film opens the scene at once
  addEventListener('focusin', () => { if (scrollY < space.offsetHeight) { hands(); scrollTo({ top: space.offsetHeight, behavior: 'instant' }); } });
  measure();
  return Object.assign(render, { measure });
}

/* ---------- scene 2: the bench ---------- */
function initBancada(sets) {
  const sec = $('#bancada');
  if (!sec) return () => false;
  const pin = $('.bancada__pin', sec);
  const canvas = $('.bancada__tela', sec), ctx = canvas.getContext('2d', { alpha: false });
  const pieces = [...sec.querySelectorAll('.peca')];
  const nums = pieces.map((el) => $('.peca__num', el));
  const landed = pieces.map(() => false);
  const po = dust($('.bancada__po', sec));
  const N = pieces.length;
  const flat = matchMedia('(max-height: 34.5rem)'); // same query as corte.css: too short to pin the stage
  let film = null, drawn = -1, wasFlat = false;

  const draw = (q) => {
    if (!film) return;
    const f = film.frame(Math.round(clamp(q) * (sets.b.frames - 1)));
    if (f && f.k !== drawn) { drawn = f.k; ctx.drawImage(f.src, 0, 0, canvas.width, canvas.height); }
  };
  const render = (y, speed, dt) => {
    if (flat.matches) { // a plain section: every piece in place, the film follows the section across the screen
      if (!wasFlat) {
        wasFlat = true;
        for (let i = 0; i < N; i++) { pieces[i].style.opacity = ''; pieces[i].style.transform = ''; nums[i].style.opacity = ''; nums[i].style.transform = ''; }
      }
      draw((y + innerHeight - sec.offsetTop) / (sec.offsetHeight + innerHeight));
      return false;
    }
    wasFlat = false;
    const q = clamp((y - sec.offsetTop) / Math.max(1, sec.offsetHeight - innerHeight));
    const seg = (q * N) / 0.92;   // every piece is on the pile a little before the stage lets go
    draw(q / 0.92);
    for (let i = 0; i < N; i++) {
      const fall = clamp((clamp(seg - i) - 0.3) / 0.7); // the first third of its stretch is the saw working
      const drop = clamp(fall / 0.62);                  // in the air: slow start, fast arrival
      const hit = clamp((fall - 0.62) / 0.38);          // on the pile: squashes, then settles
      const squash = Math.sin(Math.PI * hit) * (1 - hit) * 0.16;
      pieces[i].style.opacity = String(clamp(fall * 6));
      pieces[i].style.transform = `translate3d(0, ${((1 - drop * drop) * -170).toFixed(1)}px, 0) rotate(${((1 - drop) * (i % 2 ? 9 : -9)).toFixed(2)}deg) scale(${(1 + squash * 0.35).toFixed(3)}, ${(1 - squash).toFixed(3)})`;
      // its number is stamped once it lands
      nums[i].style.opacity = String(clamp(hit * 4));
      nums[i].style.transform = `scale(${(1 + (1 - easeOutBack(clamp(hit * 1.6))) * 0.9).toFixed(3)})`;
      // and the landing raises dust at both ends (once per pass, only when going forward)
      if (hit > 0 && !landed[i]) {
        landed[i] = true;
        if (speed > 0) {
          const r = pieces[i].getBoundingClientRect(), o = pin.getBoundingClientRect();
          po.emit(r.left - o.left + 6, r.bottom - o.top, 10, { push: -0.14, spread: 0.12, up: 0.2 });
          po.emit(r.right - o.left - 6, r.bottom - o.top, 10, { push: 0.14, spread: 0.12, up: 0.2 });
        }
      }
      if (fall < 0.4) landed[i] = false;
    }
    return po.step(dt);
  };
  // the bench film only starts loading when the stage gets close
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    film = sequence('b', sets.b.frames, request);
  }, { rootMargin: '100% 0px' }).observe(sec);
  po.size();
  return Object.assign(render, { measure: () => po.size() });
}

async function start() {
  // before anything loads: a page opened at an anchor or reloaded half way must not sit under the film
  const stage = $('#corte'), space = $('.corte-espaco');
  const past = () => { if (stage.classList.toggle('is-done', scrollY >= space.offsetHeight)) { finish(true); freeVideo(); } };
  // (3) nobody waits for the film to read the page: whatever happens, everything is released after a while
  setTimeout(() => finish(true), 10000);
  past();
  addEventListener('scroll', past, { passive: true });
  if (!self.createImageBitmap) throw new Error('createImageBitmap ausente'); // very old browsers: plain page
  const sets = await fetch('/video/serra/serra.json').then((r) => r.json());
  removeEventListener('scroll', past);
  sy = scrollY;
  scenes.push(initCorte(sets), initBancada(sets));
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { for (const s of scenes) s.measure?.(); request(); });
  request();
}

if (root.classList.contains('corte-on')) {
  start().catch((err) => { root.classList.remove('corte-on'); freeVideo(); console.warn('Cena do serrote indisponível:', err); });
}
