// Comanda digital (DEMO): shared order store for /garcom and /expedicao.
// Persistence: localStorage; live sync between windows/tabs/iframes of the same browser: BroadcastChannel.
// A production version replaces this module with a realtime backend (same API: load/update/subscribe).

const KEY = 'barcenaria:comanda:v1';
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('barcenaria-comanda') : null;
let memory = { pedidos: [], seq: 0 };

export const STATIONS = { cozinha: 'Cozinha', bar: 'Bar' };
export const STATUS = { novo: 'Novo', preparo: 'Em preparo', pronto: 'Pronto', entregue: 'Entregue' };

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : structuredClone(memory);
  } catch { return structuredClone(memory); }
}

// BroadcastChannel and 'storage' events never reach the window that made the change, so local listeners are called too.
const listeners = new Set();

function save(state) {
  memory = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked: keep in memory */ }
  channel?.postMessage({ type: 'sync' });
  queueMicrotask(() => { for (const fn of listeners) fn(load()); });
}

export function update(mutate) {
  const state = load();
  mutate(state);
  save(state);
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  channel?.addEventListener('message', () => fn(load()));
  addEventListener('storage', (e) => { if (e.key === KEY) fn(load()); });
}

export function reset() { save({ pedidos: [], seq: 0 }); }

/* ---------- orders ---------- */

export function createOrder({ mesa, garcom, itens }) {
  let created;
  update((s) => {
    s.seq += 1;
    const estacoes = {};
    for (const it of itens) estacoes[it.estacao] ??= { status: 'novo', ts: { novo: Date.now() } };
    created = { id: `P${String(s.seq).padStart(4, '0')}`, numero: s.seq, mesa, garcom, criado: Date.now(), itens, estacoes, fechado: false };
    s.pedidos.push(created);
  });
  return created;
}

export function setStationStatus(pedidoId, estacao, status) {
  update((s) => {
    const p = s.pedidos.find((x) => x.id === pedidoId);
    const st = p?.estacoes[estacao];
    if (!st) return;
    st.status = status;
    st.ts[status] = Date.now();
  });
}

export function closeTable(mesa) {
  update((s) => { for (const p of s.pedidos) if (p.mesa === mesa && !p.fechado) { p.fechado = true; p.fechadoEm = Date.now(); } });
}

export const openOrders = (state, mesa) => state.pedidos.filter((p) => !p.fechado && (mesa == null || p.mesa === mesa));
export const orderTotal = (p) => p.itens.reduce((sum, it) => sum + (it.preco ?? 0) * it.qtd, 0);

/* ---------- menu → orderable items ---------- */

// Flattens cardapio.json v2 into items with an optional list of variants ({ rotulo, preco }) and flavors.
export function orderableItems(cardapio) {
  const out = [];
  for (const cat of cardapio.categorias ?? []) {
    const estacao = cat.estacao ?? 'cozinha';
    const push = (raw, extra = {}) => out.push({
      key: `${cat.id}:${raw.id}`, id: raw.id, nome: raw.nome, prato: raw.prato ?? null,
      catId: cat.id, catNome: cat.nome, estacao: raw.estacao ?? estacao, vegetariano: Boolean(raw.vegetariano), ...extra,
    });
    if (cat.tipo === 'tabela') {
      for (const g of cat.grupos ?? []) for (const raw of g.itens ?? []) {
        const variantes = (g.colunas ?? []).map((c, i) => ({ rotulo: c, preco: raw.precos?.[i] ?? null })).filter((v) => v.preco != null);
        push(raw, { grupo: g.nome, preco: variantes[0]?.preco ?? null, variantes });
      }
    } else if (cat.tipo === 'fixo') {
      for (const raw of cat.itens ?? []) push(raw, { preco: cat.preco ?? null, descricao: raw.descricao, dias: cat.dias, janela: cat.janela });
    } else {
      for (const raw of cat.itens ?? []) {
        const variantes = Array.isArray(raw.precos) && typeof raw.precos[0] === 'object'
          ? raw.precos.map((p) => ({ rotulo: p.rotulo, preco: p.valor })) : null;
        push(raw, {
          preco: raw.preco ?? variantes?.[0]?.preco ?? null, variantes, descricao: raw.descricao ?? raw.notas ?? '',
          sabores: cat.tipo === 'opcoes' ? cat.sabores ?? [] : null, dias: raw.dias ?? cat.dias,
        });
      }
    }
  }
  return out;
}

/* ---------- small DOM + format helpers ---------- */

export function h(tag, props = {}, ...kids) {
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

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

const money = new Map();
export const brl = (v) => {
  if (v == null) return 'Consulte';
  const digits = Number.isInteger(v) ? 0 : 2;
  if (!money.has(digits)) money.set(digits, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits }));
  return money.get(digits).format(v);
};

export const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
export const clock = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(ts);
export const minutesSince = (ts) => Math.max(0, Math.floor((Date.now() - ts) / 60000));

export async function getJSON(name) {
  const res = await fetch(`/data/${name}.json`);
  if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`);
  return res.json();
}
