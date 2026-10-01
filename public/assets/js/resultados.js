// Results dashboard (DEMO): revenue by day, weekday average, orders by hour and best sellers.
// History is SAMPLE data generated from the real menu and opening hours (labeled as such on screen),
// merged with the orders placed in the /comanda demo. The real version reads the comanda or the POS.
import { load as loadComanda, subscribe, orderableItems, orderTotal, h, brl } from './comanda-store.js';
import { todayISO, addDays, weekday, fmtDay } from './reservas.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TZ = 'America/Sao_Paulo';
const ORDERS_PER_DAY = { 0: 30, 3: 14, 4: 22, 5: 34, 6: 42 }; // sample volume per open weekday (fictional)
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const $ = (s) => document.querySelector(s);
let items = [];
let casa = null;
let periodo = 28;

/* ---------- sample generator (deterministic per day) ---------- */

function rng(seedText) {
  let a = 0;
  for (const c of seedText) a = (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pickWeighted = (rand, list, weight) => {
  const total = list.reduce((s, x) => s + weight(x), 0);
  let r = rand() * total;
  for (const x of list) { r -= weight(x); if (r <= 0) return x; }
  return list[list.length - 1];
};

// Stable popularity per item (hash of its key), so the same dishes lead every day;
// cheaper items sell more often, like in a real bar (a R$ 200 wine is a rare pick).
const popularity = new Map();
const unitPrice = (it) => it.variantes?.[0]?.preco ?? it.preco;
const pop = (it) => {
  if (!popularity.has(it.key)) popularity.set(it.key, (0.15 + rng(it.key)() ** 3) * Math.min(1.5, Math.max(0.05, 30 / unitPrice(it)) ** 1.5));
  return popularity.get(it.key);
};

function sampleDay(iso) {
  const dow = weekday(iso);
  const abre = casa?.horarios?.find((d) => d.dia === dow)?.abre;
  const count = ORDERS_PER_DAY[dow];
  if (!abre || !count) return [];
  const rand = rng(`barcenaria-${iso}`);
  const open = Number(abre.slice(0, 2));
  const hours = Array.from({ length: 24 - open }, (_, i) => open + i);
  const hourWeight = (hr) => Math.exp(-((hr - 20.5) ** 2) / 8) + (open <= 12 ? 0.7 * Math.exp(-((hr - 13) ** 2) / 2) : 0);
  const pool = (station) => items.filter((it) => it.estacao === station && it.preco != null && (!it.dias?.length || it.dias.includes(dow)));
  const cozinha = pool('cozinha');
  const bar = pool('bar');
  const orders = [];
  const n = Math.round(count * (0.8 + rand() * 0.4));
  for (let i = 0; i < n; i += 1) {
    const hora = pickWeighted(rand, hours, hourWeight);
    const linhas = [];
    const add = (list, qtdMax) => {
      const it = pickWeighted(rand, list, pop);
      const preco = unitPrice(it);
      linhas.push({ id: it.id, key: it.key, nome: it.nome, prato: it.prato, estacao: it.estacao, qtd: 1 + Math.floor(rand() * (preco <= 40 ? qtdMax : 1)), preco });
    };
    for (let k = 0, kn = 1 + Math.floor(rand() * 2); k < kn; k += 1) add(cozinha, 1);
    for (let k = 0, kn = 1 + Math.floor(rand() * 3); k < kn; k += 1) add(bar, 3);
    orders.push({ data: iso, hora, itens: linhas, exemplo: true });
  }
  return orders;
}

/* ---------- data ---------- */

const civil = (ts) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ts);
const hourOf = (ts) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(ts)) % 24;

function dataset() {
  const today = todayISO();
  const days = Array.from({ length: periodo }, (_, i) => addDays(today, i - periodo + 1));
  const real = loadComanda().pedidos.map((p) => ({ data: civil(p.criado), hora: hourOf(p.criado), itens: p.itens, total: orderTotal(p) }))
    .filter((p) => days.includes(p.data));
  const sample = days.filter((d) => d < today).flatMap(sampleDay);
  const orders = [...sample, ...real].map((p) => ({ ...p, total: p.total ?? orderTotal(p) }));
  return { days, orders, realCount: real.length };
}

function aggregate({ days, orders }) {
  const byDay = new Map(days.map((d) => [d, { total: 0, pedidos: 0 }]));
  const byItem = new Map();
  const byHour = new Map();
  const station = { cozinha: 0, bar: 0 };
  for (const p of orders) {
    const d = byDay.get(p.data);
    d.total += p.total;
    d.pedidos += 1;
    byHour.set(p.hora, (byHour.get(p.hora) ?? 0) + 1);
    for (const it of p.itens) {
      const value = (it.preco ?? 0) * it.qtd;
      station[it.estacao] = (station[it.estacao] ?? 0) + value;
      const cur = byItem.get(it.id) ?? { nome: it.nome, prato: it.prato, estacao: it.estacao, qtd: 0, total: 0 };
      cur.qtd += it.qtd;
      cur.total += value;
      byItem.set(it.id, cur);
    }
  }
  const openDays = days.filter((d) => byDay.get(d).pedidos > 0);
  const byWeekday = [3, 4, 5, 6, 0].map((dow) => {
    const ds = openDays.filter((d) => weekday(d) === dow);
    return { dow, media: ds.length ? ds.reduce((s, d) => s + byDay.get(d).total, 0) / ds.length : 0, dias: ds.length };
  });
  return { byDay, byItem, byHour, station, byWeekday, openDays };
}

/* ---------- formatting ---------- */

const money0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const compact = (v) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : money0.format(v));
const int = (v) => Math.round(v).toLocaleString('pt-BR');

/* ---------- tooltip (shared) ---------- */

function showTip(e, text) {
  const tip = $('#tip');
  tip.textContent = text;
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
  tip.style.left = `${x + window.scrollX}px`;
  tip.style.top = `${e.clientY + window.scrollY - tip.offsetHeight - 12}px`;
}
const hideTip = () => { $('#tip').hidden = true; };

/* ---------- charts ---------- */

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1.5, 3, 4.5, 6, 9, 12].map((m) => m * p).find((c) => c >= v);
}
// Bar with a 4px rounded data-end, anchored square on the baseline.
const barPath = (x, y, w, base) => {
  const r = Math.min(4, w / 2, base - y);
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${base}Z`;
};

// Drawn at the figure's real width, so axis text keeps its size on phones.
function columnChart(fig, { title, sub, data, fmt }) {
  const W = Math.max(280, Math.floor(fig.clientWidth - 34)), H = 220, L = 56, R = 8, T = 12, B = 26;
  const pw = W - L - R, ph = H - T - B, base = T + ph;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const bw = pw / Math.max(data.length, 1);
  const labelEvery = Math.max(1, Math.ceil(40 / bw));
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart__svg', role: 'img', 'aria-label': `${title}: ${sub}` });
  for (let i = 0; i <= 3; i += 1) {
    const v = (max / 3) * i;
    const y = base - (v / max) * ph;
    svg.append(svgEl('line', { x1: L, x2: W - R, y1: y, y2: y, class: i ? 'chart__grid' : 'chart__base' }));
    const t = svgEl('text', { x: L - 8, y: y + 4, class: 'chart__axis', 'text-anchor': 'end' });
    t.textContent = fmt(v);
    svg.append(t);
  }
  data.forEach((d, i) => {
    const x = L + i * bw + 1;
    const w = Math.max(bw - 2, 1);
    const y = base - (d.value / max) * ph;
    if (d.value > 0) svg.append(svgEl('path', { d: barPath(x, y, w, base), class: 'chart__bar' }));
    if (i % labelEvery === 0) {
      const t = svgEl('text', { x: x + w / 2, y: H - 8, class: 'chart__axis', 'text-anchor': 'middle' });
      t.textContent = d.label;
      svg.append(t);
    }
    const hit = svgEl('rect', { x: L + i * bw, y: T, width: bw, height: ph, class: 'chart__hit' });
    hit.addEventListener('pointermove', (e) => showTip(e, d.tip));
    hit.addEventListener('pointerleave', hideTip);
    svg.append(hit);
  });
  fig.replaceChildren(
    h('figcaption', {}, h('h3', { class: 'chart__title', text: title }), h('p', { class: 'chart__sub', text: sub })),
    svg,
    h('details', { class: 'chart__table' },
      h('summary', { text: 'Ver em tabela' }),
      h('table', {},
        h('thead', {}, h('tr', {}, h('th', { scope: 'col', text: 'Período' }), h('th', { scope: 'col', text: 'Valor' }))),
        h('tbody', {}, data.map((d) => h('tr', {}, h('th', { scope: 'row', text: d.full ?? d.label }), h('td', { text: d.tip })))))));
}

function topList(fig, groups) {
  const list = (title, ranked) => {
    const max = ranked[0]?.qtd ?? 1;
    return h('div', { class: 'top__group' },
      h('h4', { class: 'area__title', text: title }),
      h('ol', { class: 'top' }, ranked.map((it) => {
        const fill = h('span', { class: 'top__fill' });
        fill.style.setProperty('--w', `${(it.qtd / max) * 100}%`);
        return h('li', { class: 'top__row' },
          h('span', { class: 'top__name' }, h('strong', { text: it.nome }), it.prato && h('span', { text: ` · ${it.prato}` })),
          h('span', { class: 'top__track', 'aria-hidden': 'true' }, fill),
          h('span', { class: 'top__value', text: `${int(it.qtd)} · ${compact(it.total)}` }));
      })));
  };
  fig.replaceChildren(
    h('figcaption', {}, h('h3', { class: 'chart__title', text: 'Mais vendidos' }), h('p', { class: 'chart__sub', text: 'Top 5 por quantidade no período · unidades e faturamento' })),
    list('Pratos', groups.cozinha), list('Bebidas', groups.bar));
}

function kpi(label, value, note) {
  return h('div', { class: 'kpi' }, h('p', { class: 'kpi__label', text: label }), h('p', { class: 'kpi__value', text: value }), note && h('p', { class: 'kpi__note', text: note }));
}

/* ---------- render ---------- */

function render() {
  const ds = dataset();
  const ag = aggregate(ds);
  const total = [...ag.byDay.values()].reduce((s, d) => s + d.total, 0);
  const pedidos = ds.orders.length;
  const rank = (station) => [...ag.byItem.values()].filter((it) => it.estacao === station).sort((a, b) => b.qtd - a.qtd).slice(0, 5);
  const top = { cozinha: rank('cozinha'), bar: rank('bar') };
  const stations = ag.station.cozinha + ag.station.bar || 1;
  const pct = (v) => `${Math.round((v / stations) * 100)}%`;

  $('#fonte').textContent = `Dados de exemplo gerados a partir do cardápio e dos horários reais da casa${ds.realCount ? `, mais ${ds.realCount} ${ds.realCount === 1 ? 'pedido lançado' : 'pedidos lançados'} na demo da comanda` : ''}. Na versão real, os números vêm da comanda ou do sistema de caixa.`;
  $('#kpis').replaceChildren(
    kpi('Faturamento', compact(total), `${ag.openDays.length} dias com vendas`),
    kpi('Comandas', int(pedidos), `${int(pedidos / Math.max(ag.openDays.length, 1))} por dia aberto`),
    kpi('Ticket médio', brl(Math.round(total / Math.max(pedidos, 1))), 'por comanda'),
    kpi('Prato mais vendido', top.cozinha[0]?.nome ?? '—', top.cozinha[0] ? `${top.cozinha[0].prato ? `${top.cozinha[0].prato} · ` : ''}${int(top.cozinha[0].qtd)} unidades` : ''),
    kpi('Cozinha × Bar', `${pct(ag.station.cozinha)} × ${pct(ag.station.bar)}`, `${compact(ag.station.cozinha)} × ${compact(ag.station.bar)}`));

  columnChart($('#chart-dia'), {
    title: 'Faturamento por dia', sub: `Últimos ${periodo} dias · segunda e terça a casa não abre`,
    fmt: compact,
    data: ds.days.map((d) => {
      const v = ag.byDay.get(d);
      return { label: fmtDay(d, { day: '2-digit', month: '2-digit' }), full: fmtDay(d, { weekday: 'short', day: '2-digit', month: '2-digit' }), value: v.total, tip: `${fmtDay(d, { weekday: 'short', day: '2-digit', month: '2-digit' })}: ${v.pedidos ? `${brl(Math.round(v.total))} · ${v.pedidos} comandas` : 'sem vendas'}` };
    }),
  });
  topList($('#chart-top'), top);
  columnChart($('#chart-semana'), {
    title: 'Média por dia da semana', sub: 'Faturamento médio nos dias abertos', fmt: compact,
    data: ag.byWeekday.map((w) => ({ label: WEEKDAYS[w.dow], value: w.media, tip: `${WEEKDAYS[w.dow]}: ${brl(Math.round(w.media))} em média (${w.dias} ${w.dias === 1 ? 'dia' : 'dias'})` })),
  });
  const hours = [...ag.byHour.keys()].sort((a, b) => a - b);
  const span = hours.length ? Array.from({ length: hours[hours.length - 1] - hours[0] + 1 }, (_, i) => hours[0] + i) : [];
  columnChart($('#chart-hora'), {
    title: 'Comandas por horário', sub: 'Horário de abertura da comanda', fmt: int,
    data: span.map((hr) => ({ label: `${hr}h`, value: ag.byHour.get(hr) ?? 0, tip: `${hr}h: ${ag.byHour.get(hr) ?? 0} comandas` })),
  });
}

export function initResultados(opts) {
  casa = opts.casa ?? null;
  items = opts.cardapio ? orderableItems(opts.cardapio) : [];
  for (const b of document.querySelectorAll('[data-periodo]')) {
    b.addEventListener('click', () => {
      periodo = Number(b.dataset.periodo);
      for (const o of document.querySelectorAll('[data-periodo]')) o.setAttribute('aria-pressed', String(o === b));
      render();
    });
  }
  const visible = () => !$('#panel-resultados').hidden;
  subscribe(() => { if (visible()) render(); });
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (visible()) render(); }, 150); });
  return { render };
}
