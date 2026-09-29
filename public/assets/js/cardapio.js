// Cardápio digital: renders /data/*.json into the menu page (search, filters, scrollspy, bottom sheet).
// Category types (cardapio.json v2): lista · vinhos · tabela (destilados) · opcoes (caipirinhas) · fixo (executivos).

const TZ = 'America/Sao_Paulo';
const THEME_KEY = 'barcenaria:tema';
const SVG_NS = 'http://www.w3.org/2000/svg';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (sel) => document.querySelector(sel);

const money = new Map();
// Menu style: "R$ 70" for whole values, "R$ 49,90" otherwise.
const brl = (v) => {
  const digits = Number.isInteger(v) ? 0 : 2;
  if (!money.has(digits)) money.set(digits, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits }));
  return money.get(digits).format(v);
};

const state = {
  casa: null, cardapio: null, promocoes: [], imagens: {},
  cats: [], items: [], byId: new Map(), promoIds: new Set(),
  filters: new Set(), query: '', now: null, mesa: null,
  activeCat: null, spyLockUntil: 0, current: null, opener: null,
};

const FILTERS = [
  { id: 'vegetariano', label: 'Vegetarianos', icon: 'leaf', test: (it) => Boolean(it.vegetariano) },
  { id: 'ate-50', label: 'Até R$ 50', test: (it) => minPrice(it) != null && minPrice(it) <= 50 },
  { id: 'promo-hoje', label: 'Promo hoje', test: (it) => state.promoIds.has(it.id), when: () => state.promoIds.size > 0 },
];

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

function icon(name, cls = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function saoPauloNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return { dow: WEEKDAYS.indexOf(get('weekday')), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (hhmm) => { const [hh, mm] = hhmm.split(':').map(Number); return hh * 60 + mm; };
const hourLabel = (hhmm) => { const [hh, mm] = hhmm.split(':'); return mm === '00' ? `${Number(hh)}h` : `${Number(hh)}h${mm}`; };

function dayName(d) {
  return state.casa?.horarios?.find((x) => x.dia === d)?.nome
    ?? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d];
}
const weekend = (d) => d === 0 || d === 6;

// [6] -> "Só aos sábados"; [5, 6] -> "Só às sextas e aos sábados"
function daysPhrase(dias) {
  const parts = dias.map((d) => `${weekend(d) ? 'aos' : 'às'} ${dayName(d).toLowerCase()}s`);
  const last = parts.pop();
  return `Só ${parts.length ? `${parts.join(', ')} e ${last}` : last}`;
}
const daysShort = (dias) => {
  const names = dias.map((d) => dayName(d).slice(0, 3));
  const last = names.pop();
  return names.length ? `${names.join(', ')} e ${last}` : last;
};

function minPrice(it) {
  if (it.preco != null) return it.preco;
  const values = (it.precos ?? []).map((p) => (typeof p === 'number' ? p : p?.valor)).filter((v) => v != null);
  if (values.length) return Math.min(...values);
  return it.cat?.tipo === 'fixo' ? it.cat.preco ?? null : null;
}

function priceNodes(value) {
  return [h('span', { class: 'visually-hidden', text: 'Preço: ' }), value == null ? 'Consulte' : brl(value)];
}

function image(id, { sizes, alt, cls, largest = false, lazy = true }) {
  const meta = state.imagens[id];
  if (!meta) return null;
  const widths = [...meta.widths].sort((a, b) => a - b);
  const url = (w) => `/images/${id}-${w}.webp`;
  const max = widths.at(-1);
  return h('img', {
    class: cls, alt, sizes,
    src: url(largest ? max : widths[0]),
    srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    width: max, height: Math.round(max / meta.ratio),
    loading: lazy ? 'lazy' : null, decoding: 'async',
  });
}

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

function copyWithExecCommand(text) {
  // A modal dialog makes the rest of the page inert, so the helper textarea must live inside it.
  const host = document.querySelector('dialog[open]') ?? document.body;
  const ta = h('textarea', { class: 'visually-hidden', readonly: true });
  ta.value = text;
  host.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true, () => copyWithExecCommand(text));
  }
  return Promise.resolve(copyWithExecCommand(text));
}

// WhatsApp rule (spec §2): wa.me with text when a number exists; otherwise copy + open the business link.
function whatsapp(message, feedback) {
  const { whatsapp_numero: numero, whatsapp_link: link } = state.casa?.contato ?? {};
  if (numero) {
    window.open(`https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    return;
  }
  if (!link) return;
  const copying = copyText(message);
  window.open(link, '_blank', 'noopener');
  copying.then((ok) => {
    const text = ok ? 'Mensagem copiada — é só colar na conversa.' : `Abrimos o WhatsApp da casa. Mensagem: “${message}”`;
    if (feedback) feedback.textContent = text; else toast(text);
  });
}

/* ---------- theme, share, mesa ---------- */

function initTheme() {
  const root = document.documentElement;
  const btn = $('#tema');
  const meta = document.querySelector('meta[name="theme-color"]');
  const saved = () => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } };
  const apply = (theme, persist) => {
    root.setAttribute('data-theme', theme);
    const label = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    meta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage blocked */ } }
  };
  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  btn.addEventListener('click', () => apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!['light', 'dark'].includes(saved())) apply(e.matches ? 'dark' : 'light', false);
  });
}

function initShare() {
  $('#compartilhar').addEventListener('click', async () => {
    const url = `${location.origin}/cardapio`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Cardápio · Barcenaria', text: 'Olha o cardápio da Barcenaria', url }); return; }
      catch (err) { if (err.name === 'AbortError') return; }
    }
    toast((await copyText(url)) ? 'Link do cardápio copiado.' : url);
  });
}

function initMesa() {
  const raw = new URLSearchParams(location.search).get('mesa');
  if (!raw || !/^\d{1,3}$/.test(raw) || Number(raw) === 0) return;
  state.mesa = String(Number(raw));
  const badge = $('#mesa');
  badge.replaceChildren('Mesa ', h('strong', { text: state.mesa }));
  badge.hidden = false;
}

/* ---------- data ---------- */

async function getJSON(name) {
  const res = await fetch(`/data/${name}.json`);
  if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`);
  return res.json();
}

async function load() {
  const [cardapio, casa, promocoes, imagens] = await Promise.allSettled(
    ['cardapio', 'casa', 'promocoes', 'imagens'].map(getJSON),
  );
  if (cardapio.status === 'rejected') throw cardapio.reason;
  state.cardapio = cardapio.value;
  state.casa = casa.value ?? null;
  state.promocoes = promocoes.value?.promocoes ?? [];
  state.imagens = imagens.value ?? {};
}

// Promo titles mention a dish ("Feijoada da Barcenaria", "Chopp Brahma Double…"): match whole words only.
function relatedItem(titulo) {
  const t = norm(titulo);
  return state.items
    .filter((it) => it.kind === 'lista' && it.key.length > 3 && new RegExp(`(^|\\W)${escapeRe(it.key)}(\\W|$)`).test(t))
    .sort((a, b) => b.key.length - a.key.length)[0];
}

// Time-boxed categories (executivos, feijoada): "agora" | "mais-tarde" | "encerrado" | "outro-dia" | null
function windowStatus(cat) {
  if (!cat.dias?.length) return null;
  const { dow, minutes } = state.now;
  if (!cat.dias.includes(dow)) return 'outro-dia';
  if (!cat.janela) return 'agora';
  if (minutes < toMinutes(cat.janela.inicio)) return 'mais-tarde';
  if (minutes >= toMinutes(cat.janela.fim)) return 'encerrado';
  return 'agora';
}

function buildModel() {
  const labels = state.cardapio.selos ?? {};
  const { dow } = state.now;
  state.cats = (state.cardapio.categorias ?? [])
    .filter((c) => (c.tipo === 'tabela' ? c.grupos : c.itens)?.length)
    .map((c) => ({ ...c, kind: c.tipo ?? 'lista', items: [] }));
  for (const cat of state.cats) {
    cat.window = windowStatus(cat);
    if (cat.kind === 'tabela') cat.grupos = cat.grupos.filter((g) => g.itens?.length);
    const rows = cat.kind === 'tabela'
      ? cat.grupos.flatMap((g) => g.itens.map((raw) => ({ ...raw, grupo: g })))
      : cat.itens;
    for (const raw of rows) {
      const selos = raw.selos ?? [];
      const dias = raw.dias ?? cat.dias;
      const it = {
        ...raw, cat, selos, dias, kind: cat.kind,
        key: norm(raw.nome),
        hay: norm([
          raw.nome, raw.prato, raw.descricao, raw.grupo?.nome, cat.nome, cat.subtitulo,
          raw.uvas, raw.origem, raw.notas, ...(cat.sabores ?? []), ...selos.map((s) => labels[s]),
          ...(raw.grupo?.colunas ?? []).filter((_, i) => raw.precos?.[i] != null),
          raw.vegetariano ? 'vegetariano veggie' : '',
        ].join(' ')),
        today: Boolean(dias?.includes(dow)),
        offDay: Boolean(dias?.length && !dias.includes(dow)),
      };
      cat.items.push(it);
      state.items.push(it);
      state.byId.set(it.id, it);
    }
  }
  const promosToday = state.promocoes.filter((p) => p.tipo === 'promocao' && p.dias?.includes(dow));
  state.promoIds = new Set(promosToday.map((p) => relatedItem(p.titulo))
    .filter((it) => it && it.cat.window !== 'encerrado').map((it) => it.id));
}

// Promotions that belong to a time-boxed category are represented by that category's own "Hoje" row.
const promoCategory = (p) => p.categoria ?? relatedItem(p.titulo)?.cat.id;

/* ---------- rendering: shared bits ---------- */

function tagData(it) {
  const labels = state.cardapio.selos ?? {};
  const tags = [];
  if (state.promoIds.has(it.id)) tags.push(['Promo hoje', 'today']);
  else if (it.today && it.dias?.length && it.dias.length < 7) tags.push(['Hoje', 'today']);
  for (const s of it.selos) if (labels[s]) tags.push([labels[s], s === 'sucesso-da-casa' ? 'star' : 'plain']);
  if (it.dias?.length && !it.cat.dias) {
    const phrase = daysPhrase(it.dias);
    if (!tags.some(([t]) => norm(t) === norm(phrase))) tags.push([phrase, 'plain']);
  }
  return tags;
}
const tagNodes = (tags) => tags.map(([text, kind]) => h('li', { class: `tag tag--${kind}`, text }));

const leaf = (it) => it.vegetariano && h('span', { class: 'veg', title: 'Opção vegetariana' },
  icon('leaf', 'icon veg__icon'), h('span', { class: 'visually-hidden', text: 'Opção vegetariana' }));

function descNodes(it) {
  if (!it.prato && !it.descricao) return null;
  return h('p', { class: 'item__desc' },
    it.prato && h('strong', { class: 'item__dish', text: it.prato }),
    it.prato && it.descricao ? ' — ' : null,
    it.descricao ?? '');
}

function pricesBlock(it) {
  if (!it.precos?.length || typeof it.precos[0] !== 'object') {
    return h('p', { class: `item__price${it.preco == null ? ' is-ask' : ''}` }, priceNodes(it.preco));
  }
  return h('ul', { class: 'item__prices', role: 'list' }, it.precos.map((p) =>
    h('li', {}, h('span', { class: 'item__plabel', text: p.rotulo }), h('span', { class: 'item__pvalue', text: brl(p.valor) }))));
}

function windowLine(cat) {
  if (!cat.horario) return null;
  const badge = {
    agora: ['Agora', 'today'],
    'mais-tarde': [`Hoje a partir das ${hourLabel(cat.janela?.inicio ?? '12:00')}`, 'plain'],
    encerrado: ['Encerrado por hoje', 'plain'],
  }[cat.window];
  return h('p', { class: 'cat__when' }, icon('clock'), h('span', { text: cat.horario }),
    badge && h('span', { class: `tag tag--${badge[1]}`, text: badge[0] }));
}

/* ---------- rendering: item kinds ---------- */

function openButton(it) {
  const btn = h('button', { class: 'item__btn', type: 'button', 'aria-haspopup': 'dialog', text: it.nome });
  btn.addEventListener('click', () => openSheet(it, btn));
  it.nameEl = btn;
  return btn;
}

function listRow(it) {
  const tags = tagData(it);
  const off = it.offDay || it.cat.window === 'outro-dia';
  it.el = h('li', { class: `item${off ? ' is-off' : ''}`, id: `item-${it.id}` },
    h('div', { class: 'item__body' },
      h('div', { class: 'item__line' },
        h('h3', { class: 'item__name' }, openButton(it), leaf(it)),
        h('span', { class: 'item__leader', 'aria-hidden': 'true' }),
        it.precos?.length ? null : pricesBlock(it)),
      it.precos?.length ? pricesBlock(it) : null,
      descNodes(it),
      tags.length ? h('ul', { class: 'tags', role: 'list' }, tagNodes(tags)) : null),
    it.imagem && image(it.imagem, { sizes: '80px', alt: `Foto: ${it.nome}`, cls: 'item__thumb' }));
  return it.el;
}

function wineRow(it) {
  it.el = h('li', { class: 'item item--wine', id: `item-${it.id}` },
    h('div', { class: 'item__body' },
      h('div', { class: 'item__line' },
        h('h3', { class: 'item__name' }, openButton(it)),
        h('span', { class: 'item__leader', 'aria-hidden': 'true' }),
        pricesBlock(it)),
      h('p', { class: 'wine__meta' }, [it.origem, it.uvas].filter(Boolean).join(' · ')),
      it.notas && h('p', { class: 'item__desc', text: it.notas }),
      it.harmoniza && h('p', { class: 'wine__pair' }, icon('fork'), h('span', { text: it.harmoniza }))));
  return it.el;
}

function compactRow(it) {
  it.nameEl = h('span', { class: 'item__name', text: it.nome });
  it.el = h('li', { class: 'item item--compact', id: `item-${it.id}` },
    h('div', { class: 'item__line' }, it.nameEl, h('span', { class: 'item__leader', 'aria-hidden': 'true' }), pricesBlock(it)));
  return it.el;
}

function fixedRow(it) {
  it.nameEl = h('span', { text: it.nome });
  it.el = h('li', { class: `item item--fixed${it.cat.window === 'outro-dia' ? ' is-off' : ''}`, id: `item-${it.id}` },
    h('div', { class: 'item__body' },
      h('h3', { class: 'item__name' }, it.nameEl, leaf(it)),
      it.descricao && h('p', { class: 'item__desc item__desc--full', text: it.descricao })));
  return it.el;
}

function tableGroup(g, items) {
  const cols = g.colunas ?? [];
  g.el = h('div', { class: 'spirits' },
    h('table', { class: 'spirits__table' },
      h('caption', { class: 'spirits__caption', text: g.nome }),
      h('thead', {}, h('tr', {}, h('th', { scope: 'col', class: 'spirits__name' }, h('span', { class: 'visually-hidden', text: 'Rótulo' })),
        cols.map((c) => h('th', { scope: 'col', text: c })))),
      h('tbody', {}, items.map((it) => {
        it.nameEl = h('span', { text: it.nome });
        it.el = h('tr', { id: `item-${it.id}` },
          h('th', { scope: 'row', class: 'spirits__name' }, it.nameEl),
          cols.map((c, i) => {
            const v = it.precos?.[i];
            return h('td', {}, v == null
              ? [h('span', { 'aria-hidden': 'true', text: '—' }), h('span', { class: 'visually-hidden', text: `${c}: não disponível` })]
              : brl(v));
          }));
        return it.el;
      }))));
  return g.el;
}

function catBody(cat) {
  switch (cat.kind) {
    case 'tabela':
      return h('div', { class: 'spirits-grid' }, cat.grupos.map((g) => tableGroup(g, cat.items.filter((it) => it.grupo === g))));
    case 'vinhos':
      return h('ul', { class: 'items items--wines', role: 'list' }, cat.items.map(wineRow));
    case 'opcoes':
      return [
        cat.sabores?.length ? h('div', { class: 'flavors' },
          h('p', { class: 'flavors__label', text: 'Sabores' }),
          h('ul', { class: 'flavors__list', role: 'list' }, cat.sabores.map((s) => h('li', { text: s })))) : null,
        h('ul', { class: 'items items--compact', role: 'list' }, cat.items.map(compactRow)),
      ];
    case 'fixo':
      return [
        h('p', { class: 'fixed__price' }, h('span', { class: 'fixed__label', text: 'Preço único' }), priceNodes(cat.preco)),
        h('ol', { class: 'items items--fixed', role: 'list' }, cat.items.map(fixedRow)),
      ];
    default:
      return h('ul', { class: 'items', role: 'list' }, cat.items.map(listRow));
  }
}

function catMedia(cat) {
  if (!cat.imagem || !state.imagens[cat.imagem]) return null;
  return h('figure', { class: 'cat__media' },
    image(cat.imagem, { sizes: '(min-width: 64rem) 64rem, 100vw', alt: `Foto ilustrativa da seção ${cat.nome}`, cls: 'cat__img' }),
    h('figcaption', { class: 'cat__credit', text: 'Imagem meramente ilustrativa' }));
}

/* ---------- rendering: page ---------- */

function promoRow(p, tagText, tagKind) {
  const item = relatedItem(p.titulo);
  const kids = [
    image(p.imagem, { sizes: '60px', alt: p.imagem_alt ?? '', cls: 'promo__art' }),
    h('span', { class: 'promo__text' },
      h('span', { class: `tag tag--${tagKind}`, text: tagText }),
      h('span', { class: 'promo__title', text: p.titulo }),
      p.resumo && h('span', { class: 'promo__sum', text: p.resumo })),
    p.preco != null && h('span', { class: 'promo__price', text: brl(p.preco) }),
  ];
  if (!item) return h('div', { class: 'promo' }, kids);
  return h('button', {
    class: 'promo promo--link', type: 'button', 'aria-haspopup': 'dialog',
    onclick: (e) => openSheet(item, e.currentTarget),
  }, kids);
}

// Time-boxed category that is happening today (almoço executivo, feijoada) as a "Hoje" row.
function windowRow(cat) {
  const tag = cat.window === 'agora' ? ['Agora', 'today'] : [`A partir das ${hourLabel(cat.janela.inicio)}`, 'plain'];
  const price = cat.kind === 'fixo' ? cat.preco : minPrice(cat.items[0]);
  return h('button', {
    class: 'promo promo--link', type: 'button',
    onclick: () => goToCat(cat),
  },
  image(cat.imagem ?? cat.items.find((it) => it.imagem)?.imagem, { sizes: '60px', alt: '', cls: 'promo__art' }) ?? h('span', { class: 'promo__art promo__art--icon' }, icon('clock')),
  h('span', { class: 'promo__text' },
    h('span', { class: `tag tag--${tag[1]}`, text: tag[0] }),
    h('span', { class: 'promo__title', text: cat.nome }),
    h('span', { class: 'promo__sum', text: `${cat.horario}${cat.kind === 'fixo' ? ` · ${plural(cat.items.length, 'opção', 'opções')}` : ''}` })),
  price != null && h('span', { class: 'promo__price', text: `${cat.kind === 'fixo' ? '' : 'a partir de '}${brl(price)}` }));
}

function nextOpenDay(from) {
  for (let i = 1; i <= 7; i += 1) {
    const d = (from + i) % 7;
    const hr = state.casa?.horarios?.find((x) => x.dia === d && x.abre);
    if (hr) return hr;
  }
  return null;
}

function renderToday() {
  const { dow } = state.now;
  const hoje = state.casa?.horarios?.find((x) => x.dia === dow);
  const closed = Boolean(hoje && !hoje.abre);
  const head = h('div', { class: 'today__head' }, h('h2', { class: 'today__title', id: 'hoje-titulo', text: 'Hoje na Barcê' }));
  if (hoje) {
    let status = 'fechado';
    // Closing time is unknown: never claim "open now".
    if (!closed) status = `hoje a partir das ${hourLabel(hoje.abre)}`;
    head.append(h('p', { class: 'today__status' }, icon('clock'), `${hoje.nome} · ${status}`));
  }
  const frame = h('div', { class: 'today__frame' }, head);

  const rows = [];
  if (closed) {
    const next = nextOpenDay(dow);
    const nome = next?.nome.toLowerCase();
    frame.append(h('p', { class: 'today__closed', text: next ? `Hoje estamos fechados — até ${nome}!` : 'Hoje estamos fechados.' }));
    if (next) {
      frame.append(h('p', { class: 'today__back', text: `Voltamos ${nome}, a partir das ${hourLabel(next.abre)}.` }));
      const tag = `${weekend(next.dia) ? 'No' : 'Na'} ${nome}`;
      for (const p of state.promocoes.filter((x) => x.tipo === 'promocao' && x.dias?.includes(next.dia))) rows.push(promoRow(p, tag, 'plain'));
    }
  } else {
    for (const cat of state.cats.filter((c) => c.window === 'agora' || c.window === 'mais-tarde')) rows.push(windowRow(cat));
    const boxed = new Set(state.cats.filter((c) => c.window && c.window !== 'outro-dia').map((c) => c.id));
    const todays = state.promocoes.filter((p) => p.dias?.includes(dow));
    let list = todays.filter((p) => p.tipo === 'promocao' && !boxed.has(promoCategory(p)));
    let tag = ['Hoje', 'today'];
    if (!list.length && !rows.length) { list = todays.filter((p) => p.tipo === 'destaque'); tag = ['Sempre na casa', 'star']; }
    for (const p of list) rows.push(promoRow(p, ...tag));
  }
  if (rows.length) frame.append(h('ul', { class: 'today__list', role: 'list' }, rows.map((r) => h('li', {}, r))));
  if (!hoje && !rows.length) return;
  $('#hoje').replaceChildren(frame);
  $('#hoje').hidden = false;
}

function renderFilters() {
  $('#filtros').replaceChildren(...FILTERS.filter((f) => !f.when || f.when()).map((f) => h('button', {
    class: 'chip', type: 'button', 'aria-pressed': 'false',
    onclick: (e) => {
      const on = !state.filters.has(f.id);
      if (on) state.filters.add(f.id); else state.filters.delete(f.id);
      e.currentTarget.setAttribute('aria-pressed', String(on));
      applyFilters();
    },
  }, icon('check', 'icon chip__check'), f.icon ? icon(f.icon, 'icon chip__icon') : null, f.label)));
}

function goToCat(cat) {
  setActiveCat(cat);
  state.spyLockUntil = Date.now() + 1200;
  cat.section.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  cat.heading.focus({ preventScroll: true });
}

function renderMenu() {
  const list = $('#cardapio-lista');
  const track = $('#catnav-track');
  list.replaceChildren();
  track.replaceChildren();
  for (const cat of state.cats) {
    const hid = `cat-${cat.id}-titulo`;
    cat.heading = h('h2', { class: 'cat__title', id: hid, tabindex: '-1' }, h('span', { text: cat.nome }));
    cat.countEl = h('p', { class: 'cat__count' });
    cat.section = h('section', { class: `cat cat--${cat.kind}`, id: `cat-${cat.id}`, 'aria-labelledby': hid },
      h('header', { class: 'cat__head' },
        cat.heading,
        h('div', { class: 'cat__meta' },
          h('div', {},
            cat.subtitulo && h('p', { class: 'cat__sub', text: cat.subtitulo }),
            cat.nota && h('p', { class: 'cat__note', text: cat.nota })),
          cat.countEl),
        windowLine(cat)),
      catMedia(cat),
      catBody(cat));
    cat.chip = h('a', { class: 'chip', href: `#cat-${cat.id}`, text: cat.nome });
    cat.chip.addEventListener('click', (e) => { e.preventDefault(); goToCat(cat); });
    list.append(cat.section);
    track.append(cat.chip);
  }
  list.removeAttribute('aria-busy');
}

function renderNoticeAndFooter() {
  const upd = state.cardapio.atualizado_em;
  if (state.cardapio.aviso) $('#aviso').textContent = state.cardapio.aviso;
  if (upd) {
    const [y, m, d] = upd.split('-').map(Number);
    const label = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
    $('#atualizado').replaceChildren('Cardápio digital atualizado em ', h('time', { datetime: upd, text: label }), '.');
    $('#atualizado').hidden = false;
  }
  if (state.cardapio.status === 'parcial') $('#faixa-status').hidden = false;
  $('#rodape-ano').textContent = `© ${new Date().getFullYear()} ${state.casa?.nome_completo ?? 'Barcenaria'}`;

  const casa = state.casa;
  if (!casa) return;
  $('#rodape-nome').textContent = casa.nome_completo ?? casa.nome;
  const e = casa.endereco ?? {};
  $('#rodape-endereco').textContent = [e.logradouro, e.bairro].filter(Boolean).join(' · ');
  $('#rodape-confirmar').hidden = !e.confirmar;
  const link = (id, href, label) => {
    if (!href) return;
    const li = $(id);
    li.querySelector('a').href = href;
    if (label) li.querySelector('span').textContent = label;
    li.hidden = false;
  };
  const c = casa.contato ?? {};
  link('#rodape-instagram', c.instagram, c.instagram_usuario ?? 'Instagram');
  link('#rodape-whatsapp', c.whatsapp_numero ? `https://wa.me/${String(c.whatsapp_numero).replace(/\D/g, '')}` : c.whatsapp_link);
  link('#rodape-mapa', casa.mapas?.google);
  if (casa.prototipo?.ativo && casa.prototipo.texto) {
    $('#rodape-prototipo').textContent = casa.prototipo.texto;
    $('#rodape-prototipo').hidden = false;
  }
}

/* ---------- search + filters ---------- */

// Wraps accent/case-insensitive matches of `tokens` in <mark>, mapping each original char to its normalized form.
function highlight(el, text, tokens) {
  if (!el) return;
  if (!tokens.length) { el.textContent = text; return; }
  const chars = [...text];
  let flat = '';
  const map = [];
  chars.forEach((ch, i) => { const n = norm(ch); flat += n; for (let k = 0; k < n.length; k += 1) map.push(i); });
  const marked = new Array(chars.length).fill(false);
  for (const t of tokens) {
    for (let at = flat.indexOf(t); at !== -1; at = flat.indexOf(t, at + t.length)) {
      for (let k = at; k < at + t.length; k += 1) marked[map[k]] = true;
    }
  }
  const out = [];
  let buf = '';
  let on = false;
  const flush = () => { if (buf) out.push(on ? h('mark', { text: buf }) : buf); buf = ''; };
  chars.forEach((ch, i) => { if (marked[i] !== on) { flush(); on = marked[i]; } buf += ch; });
  flush();
  el.replaceChildren(...out);
}

let announceTimer;
function applyFilters() {
  if (!state.cardapio) return;
  const tokens = norm(state.query).split(/\s+/).filter(Boolean);
  const active = FILTERS.filter((f) => state.filters.has(f.id));
  let shown = 0;
  for (const it of state.items) {
    const ok = tokens.every((t) => it.hay.includes(t)) && active.every((f) => f.test(it));
    it.el.hidden = !ok;
    if (ok) shown += 1;
    highlight(it.nameEl, it.nome, ok ? tokens : []);
    const dish = it.el.querySelector('.item__dish');
    if (dish) highlight(dish, it.prato, ok ? tokens : []);
  }
  let cats = 0;
  for (const cat of state.cats) {
    const n = cat.items.filter((it) => !it.el.hidden).length;
    cat.section.hidden = n === 0;
    cat.chip.hidden = n === 0;
    cat.countEl.textContent = plural(n, cat.kind === 'fixo' ? 'opção' : 'item', cat.kind === 'fixo' ? 'opções' : 'itens');
    if (cat.kind === 'tabela') for (const g of cat.grupos) g.el.hidden = !cat.items.some((it) => it.grupo === g && !it.el.hidden);
    if (n) cats += 1;
  }
  const filtering = tokens.length > 0 || active.length > 0;
  let text = `${plural(shown, 'item', 'itens')} em ${plural(cats, 'categoria', 'categorias')}`;
  if (filtering) text = shown ? `${plural(shown, 'item encontrado', 'itens encontrados')}` : 'Nenhum item encontrado';
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { $('#resultado').textContent = text; }, filtering ? 350 : 0);
  renderEmpty(shown);
  state.activeCat?.chip.removeAttribute('aria-current');
  state.activeCat = null;
  spy();
}

function clearAll() {
  state.query = '';
  state.filters.clear();
  $('#busca').value = '';
  $('#busca-limpar').hidden = true;
  for (const b of $('#filtros').children) b.setAttribute('aria-pressed', 'false');
  applyFilters();
}

function renderEmpty(shown) {
  const box = $('#vazio');
  box.hidden = shown > 0;
  if (shown) return;
  let title = 'Nenhum item com esses filtros.';
  if (state.query) title = `Nada encontrado para “${state.query.trim()}”.`;
  box.replaceChildren(
    icon('mug'),
    h('p', { class: 'empty__title', text: title }),
    h('p', { class: 'empty__text', text: 'Tente o nome do prato (ex.: picanha, burrata, negroni) ou veja uma categoria. O garçom também pode ajudar.' }),
    h('div', { class: 'empty__actions' },
      h('button', { class: 'btn', type: 'button', text: 'Limpar busca e filtros', onclick: () => { clearAll(); $('#busca').focus(); } }),
      state.cats.slice(0, 8).map((cat) => h('button', {
        class: 'chip', type: 'button', text: cat.nome,
        onclick: () => { clearAll(); goToCat(cat); },
      }))),
  );
}

function initSearch() {
  const input = $('#busca');
  const clear = $('#busca-limpar');
  input.addEventListener('input', () => {
    state.query = input.value;
    clear.hidden = !input.value;
    applyFilters();
  });
  clear.addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input')); input.focus(); });
  $('#busca-form').addEventListener('submit', (e) => {
    e.preventDefault();
    input.blur();
    $('#cardapio-lista').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  });
  $('#ir-busca').addEventListener('click', () => {
    $('#busca-area').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    input.focus({ preventScroll: true });
  });
}

/* ---------- scrollspy ---------- */

function setActiveCat(cat) {
  if (!cat || state.activeCat === cat) return;
  state.activeCat?.chip.removeAttribute('aria-current');
  cat.chip.setAttribute('aria-current', 'location');
  state.activeCat = cat;
  const track = cat.chip.parentElement;
  const left = cat.chip.offsetLeft - (track.clientWidth - cat.chip.offsetWidth) / 2;
  track.scrollTo({ left, behavior: scrollBehavior() });
}

function spy() {
  if (Date.now() < state.spyLockUntil) return;
  const visible = state.cats.filter((c) => !c.section.hidden);
  if (!visible.length) return;
  const line = $('#catnav').offsetHeight + 24;
  let current = visible[0];
  for (const c of visible) {
    if (c.section.getBoundingClientRect().top <= line) current = c; else break;
  }
  const doc = document.documentElement;
  if (scrollY > 0 && innerHeight + scrollY >= doc.scrollHeight - 4) current = visible.at(-1);
  setActiveCat(current);
}

function initSpy() {
  const nav = $('#catnav');
  const measure = () => document.documentElement.style.setProperty('--catnav-h', `${nav.offsetHeight}px`);
  measure();
  new ResizeObserver(measure).observe(nav);
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; spy(); });
  }, { passive: true });
  addEventListener('scrollend', () => { state.spyLockUntil = 0; spy(); });
  spy();
}

/* ---------- bottom sheet ---------- */

const sheet = $('#sheet');

function wineDetails(it) {
  const rows = [['Uvas', it.uvas], ['Madeira', it.madeira], ['Origem', it.origem]].filter(([, v]) => v);
  if (!rows.length) return [];
  return [h('dl', { class: 'sheet__facts' }, rows.map(([k, v]) => h('div', {}, h('dt', { text: k }), h('dd', { text: v }))))];
}

function pairingChips(it) {
  const dishes = (it.harmoniza_ids ?? []).map((id) => state.byId.get(id)).filter(Boolean);
  if (!dishes.length) return [];
  return [
    h('p', { class: 'sheet__pair-label' }, icon('fork'), 'Harmoniza com'),
    h('ul', { class: 'sheet__pair', role: 'list' }, dishes.map((d) => h('li', {},
      h('button', {
        class: 'chip', type: 'button',
        // Swap content in place: closing and reopening would fire an async 'close' after the reopen.
        onclick: () => { openSheet(d, state.opener); sheet.querySelector('[data-close]').focus(); },
      }, h('span', { text: d.nome }), d.prato && h('small', { text: d.prato }))))),
  ];
}

function openSheet(it, opener) {
  state.current = it;
  state.opener = opener;
  const media = $('#sheet-media');
  const imgId = it.imagem ?? (it.kind === 'vinhos' ? it.cat.imagem : null);
  // A category photo (e.g. one bottle for all wines) is decorative for the other items.
  const img = imgId && image(imgId, {
    sizes: '(min-width: 48rem) 36rem, 100vw', alt: it.imagem ? `Foto ilustrativa: ${it.prato ?? it.nome}` : '', largest: true, lazy: false,
  });
  media.replaceChildren(...(img ? [img, h('figcaption', { class: 'sheet__credit', text: 'Imagem meramente ilustrativa' })] : []));
  media.hidden = !img;
  $('#sheet-categoria').textContent = [it.cat.nome, it.grupo?.nome].filter(Boolean).join(' · ');
  $('#sheet-titulo').replaceChildren(it.nome, leaf(it) || '');
  const dish = $('#sheet-prato');
  dish.textContent = it.prato ?? '';
  dish.hidden = !it.prato;
  const price = $('#sheet-preco');
  price.className = `sheet__price${minPrice(it) == null ? ' is-ask' : ''}`;
  if (it.precos?.length && typeof it.precos[0] === 'object') price.replaceChildren(pricesBlock(it));
  else {
    price.replaceChildren(...priceNodes(it.preco));
    if (it.preco == null) price.append(h('small', { text: 'preço com o garçom' }));
  }
  $('#sheet-selos').replaceChildren(...tagNodes(tagData(it)));
  $('#sheet-desc').textContent = it.kind === 'vinhos' ? it.notas ?? '' : it.descricao ?? '';
  $('#sheet-extra').replaceChildren(...(it.kind === 'vinhos' ? [...wineDetails(it), ...pairingChips(it)] : []));
  const days = $('#sheet-dias');
  const when = it.cat.horario ?? (it.dias?.length ? daysPhrase(it.dias) : '');
  days.hidden = !when;
  if (when) {
    const status = it.cat.window
      ? { agora: 'servindo agora', 'mais-tarde': 'hoje mais tarde', encerrado: 'encerrado por hoje', 'outro-dia': `hoje é ${dayName(state.now.dow).toLowerCase()}` }[it.cat.window]
      : (it.offDay ? `hoje é ${dayName(state.now.dow).toLowerCase()}` : 'hoje tem!');
    days.textContent = `${when} — ${status}.`;
  }
  $('#sheet-aviso').textContent = '';
  $('#sheet-whatsapp').hidden = !state.casa?.contato;
  sheet.classList.remove('is-closing', 'is-settling');
  sheet.style.transform = '';
  document.documentElement.classList.add('is-locked');
  if (!sheet.open) sheet.showModal();
  sheet.querySelector('.sheet__scroll').scrollTop = 0;
}

let closeTimer;
function finishClose() {
  clearTimeout(closeTimer);
  sheet.removeEventListener('animationend', finishClose);
  sheet.classList.remove('is-closing');
  if (sheet.open) sheet.close();
}

function closeSheet() {
  if (!sheet.open || sheet.classList.contains('is-closing')) return;
  if (reducedMotion.matches) { finishClose(); return; }
  sheet.classList.add('is-closing');
  sheet.addEventListener('animationend', finishClose);
  closeTimer = setTimeout(finishClose, 450);
}

function initSheet() {
  sheet.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });
  sheet.addEventListener('close', () => {
    if (sheet.open) return;
    sheet.classList.remove('is-closing', 'is-settling');
    sheet.style.transform = '';
    document.documentElement.classList.remove('is-locked');
    state.opener?.focus({ preventScroll: true });
  });
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-close]')) closeSheet();
  });
  $('#sheet-whatsapp').addEventListener('click', () => {
    const it = state.current;
    if (!it) return;
    const msg = state.mesa
      ? `Olá, Barcenaria! Estou na mesa ${state.mesa} e gostaria de chamar o garçom. Tenho interesse em: ${it.nome}.`
      : `Olá, Barcenaria! Vi no cardápio digital e gostaria de saber mais sobre: ${it.nome}.`;
    whatsapp(msg, $('#sheet-aviso'));
  });

  // Drag-to-close from the grip or the photo (touch only; desktop shows a centered dialog).
  let startY = null;
  let dy = 0;
  for (const zone of sheet.querySelectorAll('[data-drag]')) {
    zone.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || matchMedia('(min-width: 48rem)').matches) return;
      startY = e.clientY;
      dy = 0;
      sheet.classList.remove('is-settling');
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', (e) => {
      if (startY == null) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (startY == null) return;
      startY = null;
      if (dy > Math.min(140, sheet.offsetHeight * 0.25)) { closeSheet(); return; }
      sheet.classList.add('is-settling');
      sheet.style.transform = '';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }
}

/* ---------- boot ---------- */

async function init() {
  initTheme();
  initShare();
  initMesa();
  initSheet();
  initSearch();
  state.now = saoPauloNow();
  try {
    await load();
  } catch (err) {
    console.warn('Cardápio indisponível:', err);
    const list = $('#cardapio-lista');
    list.removeAttribute('aria-busy');
    list.replaceChildren(h('div', { class: 'menu__error' },
      h('p', { text: 'Não conseguimos carregar o cardápio agora. Confira sua conexão e tente de novo.' }),
      h('button', { class: 'btn', type: 'button', text: 'Tentar de novo', onclick: () => location.reload() })));
    return;
  }
  try {
    buildModel();
    renderToday();
    renderFilters();
    renderMenu();
    renderNoticeAndFooter();
    applyFilters();
    initSpy();
  } catch (err) {
    console.warn('Cardápio com dados inválidos:', err);
    const list = $('#cardapio-lista');
    list.removeAttribute('aria-busy');
    list.replaceChildren(h('div', { class: 'menu__error' },
      h('p', { text: 'O cardápio digital está em manutenção. Peça ao garçom o cardápio da casa.' })));
    return;
  }
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView({ block: 'start' });
}

init();
