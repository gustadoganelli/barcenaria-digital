// Site one-page: enhances the static HTML with data from /data/*.json (status, glossário, bento, promo tabs)
// plus header/scroll behaviour, lightbox, videos, map and the event pre-booking form.

document.documentElement.classList.add('js');

const TZ = 'America/Sao_Paulo';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const SVG_NS = 'http://www.w3.org/2000/svg';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 64rem)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

// Drinks shown in the "Glossário da oficina" (since the menu of 18/11/2026 only the bar keeps the tool names)
// and items of the bento (ids from cardapio.json).
const GLOSSARY = [
  { id: 'martelo-mojito', dish: 'Mojito de rum, hortelã e limão' },
  { id: 'serrote-spritz', dish: 'Spritz de limoncello e espumante' },
  { id: 'marreta-negroni', dish: 'Negroni envelhecido em barril' },
  { id: 'makita-mule', dish: 'Mule de vodka e gengibre na caneca de cobre' },
  { id: 'alicate-carajillo', dish: 'Licor 43 com café forte' },
  { id: 'formao-penicillin', dish: 'Whisky, mel, gengibre e limão-siciliano' },
  { id: 'parafuso-tropical', dish: 'Vodka, maracujá, laranja e pimenta' },
  { id: 'tico-tico-spritz', dish: 'Spritz de Aperol e espumante' },
  { id: 'nivel-fitzgerald', dish: 'Gin, limão-siciliano e angostura' },
];
const BENTO = [
  { id: 'torresmo-de-rolo', img: 'pratos/torresmo-na-mesa', tag: 'Sucesso da casa' },
  { id: 'burger-barcenaria', img: 'pratos/burger-barcenaria', tag: 'Cardápio novo' },
  { id: 'parmegiana-de-file-mignon', img: 'pratos/parmegiana-de-file-mignon', tag: 'Cardápio novo' },
  { id: 'chopp-brahma', img: 'bar/chopp-brahma', label: 'Para acompanhar' },
  { id: 'resina-jorge-amado', img: 'bar/resina-jorge-amado', label: 'Drink autoral' },
  { id: 'barcenaipa', img: 'bar/barcenaipa', label: 'A cerveja da casa' },
  { id: 'tico-tico-spritz', img: 'bar/drink-spritz', label: 'Do balcão' },
  { id: 'chave-tonica', img: 'cardapio/gin-tonica', label: 'Gin tônica' },
  { id: 'feijoada', img: 'cardapio/feijoada-panela', tag: 'Sábados, 12h às 16h', tagClass: 'brick' },
];
const PROMO_DAYS = [3, 4, 5, 6, 0];

const state = { casa: null, cardapio: null, promocoes: [], imagens: {}, items: new Map(), now: null };

/* ---------- helpers ---------- */

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...kids.flat().filter((kid) => kid != null && kid !== false));
  return el;
}

function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function image(id, { sizes, alt = '', cls, lazy = true }) {
  const meta = state.imagens[id];
  if (!meta) return null;
  const widths = [...meta.widths].sort((a, b) => a - b);
  const url = (w) => `/images/${id}-${w}.webp`;
  const max = widths.at(-1);
  return h('img', {
    class: cls, alt, sizes, src: url(widths[0]),
    srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    width: max, height: Math.round(max / meta.ratio),
    loading: lazy ? 'lazy' : null, decoding: 'async',
  });
}
const largest = (id) => { const m = state.imagens[id]; return m ? `/images/${id}-${Math.max(...m.widths)}.webp` : null; };

function saoPauloNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    dow: WEEKDAYS.indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    isoDate: `${get('year')}-${get('month')}-${get('day')}`,
  };
}
const toMinutes = (hhmm) => { const [hh, mm] = hhmm.split(':').map(Number); return hh * 60 + mm; };
const hourLabel = (hhmm) => { const [hh, mm] = hhmm.split(':'); return mm === '00' ? `${Number(hh)}h` : `${Number(hh)}h${mm}`; };

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 4200);
}

function copyText(text) {
  const fallback = () => {
    const ta = h('textarea', { class: 'visually-hidden', readonly: true });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  };
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(() => true, fallback);
  return Promise.resolve(fallback());
}

// WhatsApp rule (spec §2): wa.me with text when the number is known. Without it, the business link can't carry text,
// so the message is shown with explicit "copy" and "open" actions (auto-copy is best effort only).
function whatsapp(message, feedbackEl) {
  const { whatsapp_numero: numero, whatsapp_link: link } = state.casa?.contato ?? {};
  if (numero) {
    window.open(`https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    return;
  }
  const href = link ?? 'https://wa.me/message/BVGPN2ILM2WIG1';
  const box = h('textarea', { class: 'booking__message', readonly: true, rows: '7', 'aria-label': 'Mensagem pronta para enviar' });
  box.value = message;
  const status = h('p', { class: 'booking__status', role: 'status' });
  const copy = () => copyText(message).then((ok) => { status.textContent = ok ? 'Mensagem copiada. Agora é só colar na conversa.' : 'Não foi possível copiar sozinho: selecione o texto acima e copie.'; });
  feedbackEl.replaceChildren(
    h('p', { class: 'booking__lead', text: 'Sua mensagem está pronta:' }),
    box,
    h('div', { class: 'booking__actions' },
      h('button', { class: 'btn btn--dark', type: 'button', onclick: copy }, icon('copy'), 'Copiar mensagem'),
      h('a', { class: 'btn btn--ghost-dark', href, target: '_blank', rel: 'noopener' }, icon('whatsapp'), 'Abrir WhatsApp da casa')),
    status);
  copy();
}

async function getJSON(name) {
  const res = await fetch(`/data/${name}.json`);
  if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`);
  return res.json();
}

/* ---------- status (open/closed) ---------- */

function nextOpen(fromDow) {
  for (let i = 1; i <= 7; i += 1) {
    const d = (fromDow + i) % 7;
    const hr = state.casa.horarios.find((x) => x.dia === d && x.abre);
    if (hr) return hr;
  }
  return null;
}

function renderStatus() {
  const { dow } = state.now;
  const today = state.casa.horarios.find((x) => x.dia === dow);
  // Closing time is unknown, so never claim "open now": state only today's opening time.
  let text;
  if (today?.abre) {
    text = `Hoje a partir das ${hourLabel(today.abre)}`;
  } else {
    const next = nextOpen(dow);
    text = next ? `Hoje fechado — voltamos ${next.nome.toLowerCase()}, ${hourLabel(next.abre)}` : 'Hoje fechado';
  }
  for (const el of $$('[data-status]')) {
    const span = el.querySelector('span');
    (span ?? el).textContent = text;
    el.classList.toggle('is-closed', !today?.abre);
  }
  $(`.hours tr[data-dia="${dow}"]`)?.classList.add('is-today');
}

/* ---------- glossário + bento ---------- */

function firstSentence(text) {
  const s = String(text ?? '').split(/(?<=\.)\s/)[0];
  return s.replace(/\.$/, '');
}

function renderGlossary() {
  const list = $('#glossario');
  const items = GLOSSARY.map((g) => state.items.get(g.id) && { ...state.items.get(g.id), short: g.dish }).filter(Boolean);
  if (!items.length) return;
  list.removeAttribute('aria-live');
  list.replaceChildren(...items.map((it, i) => {
    // The answer is a sibling of the disclosure button, so it stays hidden from assistive tech until opened.
    const reveal = h('p', { class: 'gloss__reveal', id: `gloss-${it.id}`, hidden: true },
      h('span', { class: 'gloss__dish', text: it.short ?? it.prato ?? firstSentence(it.descricao) }));
    const btn = h('button', {
      class: 'gloss__card', type: 'button', 'aria-expanded': 'false', 'aria-controls': reveal.id,
      onclick: () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        reveal.hidden = !open;
      },
    },
    h('span', { class: 'gloss__num', text: `Nº ${String(i + 1).padStart(2, '0')}` }),
    h('span', { class: 'gloss__tool', text: it.nome }),
    h('span', { class: 'gloss__hint' }, icon('x'), 'O que é?'));
    return h('li', { class: 'gloss__item reveal' }, btn, reveal);
  }));
  observeReveal($$('.reveal', list));
}

function renderBento() {
  const box = $('#bento');
  const cards = BENTO.map((cfg) => ({ cfg, it: state.items.get(cfg.id) })).filter((x) => x.it);
  if (!cards.length) return;
  box.replaceChildren(...cards.map(({ cfg, it }, i) => {
    const card = h('a', { class: 'dish reveal', href: `/cardapio#item-${it.id}` },
      image(cfg.img, { cls: 'dish__img', alt: '', sizes: i === 0 ? '(min-width: 64rem) 58vw, 78vw' : '(min-width: 64rem) 33vw, 78vw' }),
      h('span', { class: 'dish__body' },
        cfg.tag && h('span', { class: `dish__tag${cfg.tagClass ? ` dish__tag--${cfg.tagClass}` : ''}`, text: cfg.tag }),
        (cfg.label || it.prato) && h('span', { class: 'dish__tool', text: cfg.label ?? it.nome }),
        h('span', { class: 'dish__name', text: it.prato ?? it.nome }),
        h('span', { class: 'dish__desc', text: it.descricao })));
    // CSSOM (not a style attribute), so the strict CSP allows it.
    card.style.setProperty('--delay', `${(i % 3) * 70}ms`);
    return card;
  }));
  observeReveal($$('.reveal', box));
  const bar = $('.bento__progress span');
  const update = () => {
    const max = box.scrollWidth - box.clientWidth;
    bar.style.setProperty('--p', max > 0 ? Math.max(0.12, (box.scrollLeft + box.clientWidth) / box.scrollWidth) : 1);
  };
  box.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------- promo tabs ---------- */

function promoCard(p, i, group) {
  const art = p.imagem && h('button', {
    class: 'promo-card__art', type: 'button', 'aria-label': `Ampliar: ${p.imagem_alt ?? p.titulo}`,
    onclick: (e) => openLightbox(group, i, e.currentTarget),
  }, image(p.imagem, { alt: p.imagem_alt ?? '', sizes: '(min-width: 64rem) 18rem, 40vw' }));
  return h('article', { class: 'promo-card' },
    art,
    h('div', { class: 'promo-card__body' },
      h('h3', { class: 'promo-card__title', text: p.titulo }),
      h('p', { class: 'promo-card__text', text: p.resumo }),
      h('div', { class: 'promo-card__foot' },
        p.fonte && h('a', { class: 'promo-card__link', href: p.fonte, target: '_blank', rel: 'noopener' }, icon('instagram'), 'Ver no Instagram'))));
}

// Simple day picker: days on one side, only the selected day's promotions on the other (today by default).
function renderPromoTabs() {
  const root = $('#promo-tabs');
  const { dow } = state.now;
  const byDay = (d) => state.promocoes.filter((p) => p.tipo === 'promocao' && p.dias?.includes(d));
  const open = PROMO_DAYS.includes(dow);
  const selected = open ? dow : PROMO_DAYS.find((d) => d > dow) ?? PROMO_DAYS[0];
  const list = h('div', { class: 'tabs__list', role: 'tablist', 'aria-label': 'Dias da semana' });
  const panel = h('div', { class: 'tabs__panel', role: 'tabpanel', tabindex: '0' });
  const tabs = PROMO_DAYS.map((d) => h('button', {
    class: 'tab', type: 'button', role: 'tab', id: `tab-${d}`, 'aria-controls': 'promo-panel',
    'aria-selected': String(d === selected), tabindex: d === selected ? '0' : '-1', 'data-day': String(d),
  },
  h('span', { class: 'tab__day', 'aria-hidden': 'true', text: DAY_SHORT[d] }),
  h('span', { class: 'tab__long', text: DAY_LONG[d] }),
  d === dow && h('span', { class: 'tab__today', text: 'Hoje' })));
  panel.id = 'promo-panel';
  list.append(...tabs);

  const show = (d, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.day === String(d);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panel.setAttribute('aria-labelledby', `tab-${d}`);
    const promos = byDay(d);
    const group = promos.filter((p) => p.imagem).map((p) => ({ src: largest(p.imagem), alt: p.imagem_alt ?? p.titulo, caption: p.titulo }));
    let gi = 0;
    panel.replaceChildren(...(promos.length
      ? promos.map((p) => promoCard(p, p.imagem ? gi++ : 0, group))
      : [h('p', { class: 'tabs__empty', text: `Sem promoção cadastrada para ${DAY_LONG[d]}.` })]));
    if (!reduced.matches) { panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering'); }
  };

  list.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) show(Number(t.dataset.day)); });
  const orient = () => list.setAttribute('aria-orientation', desktop.matches ? 'vertical' : 'horizontal');
  orient();
  desktop.addEventListener('change', orient);
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let j = null;
    if (next) j = (i + next + tabs.length) % tabs.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = tabs.length - 1;
    if (j == null) return;
    e.preventDefault();
    show(Number(tabs[j].dataset.day), true);
  });

  root.replaceChildren(list, panel);
  show(selected);
}

/* ---------- WhatsApp links ---------- */

function wireWhatsappLinks() {
  const numero = state.casa?.contato?.whatsapp_numero;
  if (!numero) return;
  const text = { reserva: 'Olá, Barcenaria! Gostaria de reservar uma mesa.', contato: 'Olá, Barcenaria!' };
  for (const a of $$('a[data-whatsapp]')) {
    a.href = `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(text[a.dataset.whatsapp] ?? text.contato)}`;
  }
}

/* ---------- header, progress, dock, nav spy ---------- */

function initChrome() {
  const header = $('.header');
  const dock = $('.dock');
  const toTop = $('#to-top');
  const hero = $('#inicio');
  const meters = [$('.tape__fill'), $('.to-top__progress')].filter(Boolean); // scroll progress: the tape and the ring
  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    // set on the two elements that use it: on <html> it would restyle the whole page at every scroll frame
    for (const el of meters) el.style.setProperty('--progress', p.toFixed(4));
    header.classList.toggle('is-scrolled', y > 40);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (!desktop.matches && y > innerHeight * 0.6) {
      if (goingDown) header.classList.add('is-hidden');
      if (goingUp) header.classList.remove('is-hidden');
    } else header.classList.remove('is-hidden');
    const pastHero = y > hero.offsetHeight * 0.7;
    const nearEnd = y > max - 120;
    const showDock = pastHero && !nearEnd;
    dock.classList.toggle('is-visible', showDock);
    dock.inert = !showDock;
    toTop.hidden = !pastHero;
    lastY = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
  toTop.addEventListener('click', () => { scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }); $('.brand').focus({ preventScroll: true }); });

  const links = $$('.nav__link');
  const sections = [hero, ...links.map((a) => $(a.getAttribute('href'))).filter(Boolean)];
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      for (const a of links) {
        if (a.getAttribute('href') === `#${e.target.id}`) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
}

/* ---------- mobile menu ---------- */

function initMenu() {
  const dialog = $('#menu');
  const toggle = $('.menu-toggle');
  const close = () => { if (dialog.open) dialog.close(); };
  let target = null;
  toggle.addEventListener('click', () => {
    target = null;
    dialog.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('is-locked');
  });
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('is-locked');
    // After choosing a section, keyboard/screen-reader focus continues from that section, not from the header.
    const section = target && $(target);
    if (section) { section.setAttribute('tabindex', '-1'); section.focus({ preventScroll: true }); }
    else toggle.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) close();
    const link = e.target.closest('a[href^="#"]');
    if (link) { target = link.getAttribute('href'); close(); }
  });
  desktop.addEventListener('change', (e) => { if (e.matches) close(); });
}

/* ---------- reveal + parallax + marquee ---------- */

// Hero title enters word by word; the heading keeps its full text as the accessible name.
function splitHeroTitle() {
  const title = $('#hero-titulo');
  if (!title || reduced.matches) return;
  const text = title.textContent.trim();
  const words = text.split(/\s+/).map((w, i) => {
    const span = h('span', { class: 'hero__word', 'aria-hidden': 'true', text: w });
    span.style.setProperty('--i', i);
    return span;
  });
  title.setAttribute('aria-label', text);
  title.replaceChildren(...words.flatMap((span, i) => (i ? [' ', span] : [span])));
}

let revealIO;
function observeReveal(els) {
  if (reduced.matches || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  revealIO ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => {
    if (!el.style.getPropertyValue('--delay')) {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      const idx = siblings.indexOf(el);
      if (idx > 0) el.style.setProperty('--delay', `${Math.min(idx, 5) * 70}ms`);
    }
    revealIO.observe(el);
  });
}

function initParallax() {
  const els = $$('[data-parallax]');
  if (!els.length) return;
  let ticking = false;
  const run = () => {
    ticking = false;
    const active = desktop.matches && finePointer.matches && !reduced.matches;
    for (const el of els) {
      if (!active) { el.style.transform = ''; continue; }
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - innerHeight / 2) * Number(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  run();
}

// Marquee speeds up slightly with scroll velocity (Web Animations playbackRate).
function initMarquee() {
  const anim = $('.marquee__track')?.getAnimations?.()[0];
  if (!anim || reduced.matches) return;
  const toggle = $('#marquee-toggle');
  let paused = false;
  const sync = () => {
    toggle.dataset.paused = String(paused);
    toggle.setAttribute('aria-label', paused ? 'Retomar letreiro' : 'Pausar letreiro');
  };
  toggle.hidden = false;
  toggle.addEventListener('click', () => { paused = !paused; if (paused) anim.pause(); else anim.play(); sync(); });
  sync();
  let lastY = scrollY;
  let lastT = performance.now();
  let raf = 0;
  const decay = () => {
    anim.playbackRate = Math.max(1, anim.playbackRate * 0.94);
    raf = anim.playbackRate > 1.01 ? requestAnimationFrame(decay) : 0;
  };
  addEventListener('scroll', () => {
    const now = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(16, now - lastT);
    lastY = scrollY; lastT = now;
    anim.playbackRate = Math.min(4, 1 + v * 2.5);
    if (!raf) raf = requestAnimationFrame(decay);
  }, { passive: true });
}

/* ---------- videos ---------- */

function allowAutoplay() {
  const c = navigator.connection;
  return !reduced.matches && !(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType ?? '')));
}

function initVideos() {
  const hero = $('#hero-video');
  const eventos = $('#eventos-video');
  // Play/pause toggle with a changing label (no aria-pressed: the label already carries the state).
  const wire = (video, btn) => {
    const sync = () => {
      btn.dataset.paused = String(video.paused);
      btn.setAttribute('aria-label', video.paused ? 'Tocar vídeo' : 'Pausar vídeo');
    };
    btn.hidden = false;
    btn.addEventListener('click', () => {
      if (video.paused) { video.preload = 'auto'; video.play().catch(() => {}); video.dataset.user = 'play'; }
      else { video.pause(); video.dataset.user = 'pause'; }
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();
  };
  wire(hero, $('#hero-play'));
  if (eventos) wire(eventos, $('#eventos-play'));

  const auto = allowAutoplay();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) {
        if (auto && v.dataset.user !== 'pause') { v.preload = 'auto'; v.play().catch(() => {}); }
      } else if (!v.paused) v.pause();
    }
  }, { threshold: 0.25 });
  io.observe(hero);
  if (eventos) io.observe(eventos);
}

/* ---------- footer credit ---------- */

// The name is split into letters (kept readable as one label) so they can drop in one by one; the animation
// itself is CSS (.footer__dev.is-in). It has its own observer: the credit sits at the very bottom of the page,
// where the inset of the reveal observer would never let it in.
function initCredit() {
  const dev = $('#dev'), name = $('#dev-nome');
  if (!dev || !name) return;
  const text = name.textContent;
  name.setAttribute('aria-label', text);
  name.replaceChildren(...[...text].map((c, i) => {
    const s = h('span', { class: 'footer__dev-char', 'aria-hidden': 'true', text: c });
    s.style.setProperty('--i', i);
    return s;
  }));
  $$('.footer__dev-links a', dev).forEach((a, i) => a.style.setProperty('--i', i));
  if (reduced.matches || !('IntersectionObserver' in window)) { dev.classList.add('is-in'); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { dev.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.5 });
  io.observe(dev);
}

/* ---------- lightbox ---------- */

const lb = { list: [], index: 0, opener: null };
function openLightbox(list, index, opener) {
  lb.list = list;
  lb.opener = opener;
  const dialog = $('#lightbox');
  showSlide(index);
  if (!dialog.open) dialog.showModal();
  document.documentElement.classList.add('is-locked');
}
function showSlide(i) {
  const n = lb.list.length;
  lb.index = (i + n) % n;
  const s = lb.list[lb.index];
  const img = $('#lightbox-img');
  img.src = s.src;
  img.alt = s.alt;
  $('#lightbox-caption').textContent = s.caption ?? s.alt;
  $('#lightbox-count').textContent = `${lb.index + 1}/${n}`;
  $('#lightbox-prev').hidden = n < 2;
  $('#lightbox-next').hidden = n < 2;
}
function initLightbox() {
  const dialog = $('#lightbox');
  dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.closest('[data-close]')) dialog.close(); });
  dialog.addEventListener('close', () => { document.documentElement.classList.remove('is-locked'); lb.opener?.focus({ preventScroll: true }); });
  $('#lightbox-prev').addEventListener('click', () => showSlide(lb.index - 1));
  $('#lightbox-next').addEventListener('click', () => showSlide(lb.index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showSlide(lb.index - 1);
    if (e.key === 'ArrowRight') showSlide(lb.index + 1);
  });
  let x0 = null;
  let swiped = false;
  dialog.addEventListener('pointerdown', (e) => { x0 = e.clientX; swiped = false; });
  dialog.addEventListener('pointercancel', () => { x0 = null; });
  dialog.addEventListener('pointerup', (e) => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50 && lb.list.length > 1) { swiped = true; showSlide(lb.index + (dx < 0 ? 1 : -1)); }
  });
  // A swipe ending on the backdrop must not also count as a "click outside" that closes the gallery.
  dialog.addEventListener('click', (e) => { if (swiped) { e.stopImmediatePropagation(); swiped = false; } }, true);

  const buttons = $$('[data-lightbox="casa"]');
  const casa = buttons.map((b) => { const img = b.querySelector('img'); return { src: img.dataset.full ?? img.currentSrc ?? img.src, alt: img.alt }; });
  buttons.forEach((b, i) => b.addEventListener('click', () => openLightbox(casa, i, b)));
}

/* ---------- map ---------- */

function initMap() {
  const box = $('#mapa');
  const btn = $('#mapa-carregar');
  const load = (fromClick) => {
    if (box.querySelector('iframe')) return;
    const src = state.casa?.mapas?.embed ?? 'https://www.google.com/maps?q=Pra%C3%A7a%20Ituzaing%C3%B3%2C%2040%20-%20Tatuap%C3%A9%2C%20S%C3%A3o%20Paulo%20-%20SP&output=embed';
    const frame = h('iframe', { src, title: 'Mapa: Barcenaria, Praça Ituzaingó, 40 — Anália Franco', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: true });
    box.replaceChildren(frame);
    if (fromClick) frame.focus();
  };
  btn.addEventListener('click', () => load(true));
  if (desktop.matches) {
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(box);
  }
}

/* ---------- booking form ---------- */

function initBooking() {
  const form = $('#booking');
  const date = $('#b-data');
  const feedback = $('#booking-feedback');
  date.min = state.now.isoDate;
  const rules = {
    nome: (v) => (v.trim().length >= 2 ? '' : 'Conte seu nome para a casa saber com quem falar.'),
    tipo: (v) => (v ? '' : 'Escolha o tipo de evento.'),
    data: (v) => (!v ? 'Escolha a data do evento.' : v < state.now.isoDate ? 'Escolha uma data a partir de hoje.' : ''),
    pessoas: (v) => { const n = Number(v); return Number.isInteger(n) && n >= 2 && n <= 300 ? '' : 'Informe quantas pessoas (entre 2 e 300).'; },
  };
  const check = (name) => {
    const field = form.elements[name];
    const msg = rules[name](field.value);
    field.setAttribute('aria-invalid', String(Boolean(msg)));
    $(`#b-${name}-erro`).textContent = msg;
    return !msg;
  };
  for (const name of Object.keys(rules)) {
    form.elements[name].addEventListener('blur', () => { if (form.elements[name].value) check(name); });
    form.elements[name].addEventListener('input', () => { if (form.elements[name].getAttribute('aria-invalid') === 'true') check(name); });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(rules).filter((n) => !check(n));
    if (bad.length) { form.elements[bad[0]].focus(); feedback.textContent = ''; return; }
    const f = form.elements;
    const [y, m, d] = f.data.value.split('-');
    const lines = [
      'Olá, Barcenaria! Quero fazer uma pré-reserva para um evento:',
      `• Nome: ${f.nome.value.trim()}`,
      `• Evento: ${f.tipo.value}`,
      `• Data: ${d}/${m}/${y}`,
      `• Pessoas: ${f.pessoas.value}`,
      `• Espaço preferido: ${form.querySelector('input[name="espaco"]:checked')?.value ?? 'Tanto faz'}`,
    ];
    if (f.obs.value.trim()) lines.push(`• Observações: ${f.obs.value.trim()}`);
    lines.push('Pode me passar as condições e a disponibilidade?');
    whatsapp(lines.join('\n'), feedback);
  });
}

/* ---------- boot ---------- */

async function init() {
  state.now = saoPauloNow();
  $('#ano').textContent = String(new Date().getFullYear());
  splitHeroTitle();
  initChrome();
  initMenu();
  initLightbox();
  initVideos();
  initCredit();
  initParallax();
  initMarquee();
  initBooking();
  observeReveal($$('.reveal'));

  const [casa, cardapio, promocoes, imagens] = await Promise.allSettled(['casa', 'cardapio', 'promocoes', 'imagens'].map(getJSON));
  state.casa = casa.value ?? null;
  state.cardapio = cardapio.value ?? null;
  state.promocoes = promocoes.value?.promocoes ?? [];
  state.imagens = imagens.value ?? {};
  for (const cat of state.cardapio?.categorias ?? []) for (const it of cat.itens ?? []) state.items.set(it.id, it);

  if (state.casa) {
    renderStatus();
    wireWhatsappLinks();
    if (state.casa.prototipo?.ativo && state.casa.prototipo.texto) {
      $('#prototipo').textContent = state.casa.prototipo.texto;
      $('#prototipo').hidden = false;
    }
  }
  initMap();
  if (state.cardapio && Object.keys(state.imagens).length) { renderGlossary(); renderBento(); }
  if (state.promocoes.length && Object.keys(state.imagens).length) renderPromoTabs();
}

init().catch((err) => console.warn('Falha ao montar o site:', err));
