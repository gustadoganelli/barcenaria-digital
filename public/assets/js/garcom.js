// Waiter app (DEMO): pick a table, build an order from cardapio.json, send it to the expedition screen, follow its status.
import {
  STATIONS, load, subscribe, createOrder, setStationStatus, closeTable, openOrders, orderTotal,
  orderableItems, h, icon, brl, norm, clock, getJSON,
} from './comanda-store.js';

const MESAS = 30;
const NAME_KEY = 'barcenaria:garcom';
const QUICK_OBS = {
  cozinha: ['Sem cebola', 'Ao ponto', 'Mal passado', 'Bem passado', 'Sem pimenta', 'Molho à parte'],
  bar: ['Sem gelo', 'Pouco gelo', 'Sem açúcar', 'Com adoçante', 'Sem canudo'],
};
const $ = (s) => document.querySelector(s);

const ui = { items: [], cats: [], mesa: null, cat: 'todos', query: '', carts: new Map(), statuses: new Map(), opener: null };

/* ---------- helpers ---------- */

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

const garcom = () => { try { return localStorage.getItem(NAME_KEY) || 'Garçom 1'; } catch { return 'Garçom 1'; } };
const cart = () => { if (!ui.carts.has(ui.mesa)) ui.carts.set(ui.mesa, []); return ui.carts.get(ui.mesa); };
const cartTotal = (lines) => lines.reduce((s, l) => s + (l.preco ?? 0) * l.qtd, 0);
const cartCount = (lines) => lines.reduce((s, l) => s + l.qtd, 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const today = () => {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(new Date());
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
};

/* ---------- sheet (dialog) ---------- */

const sheet = $('#sheet');
function openSheet(nodes, opener) {
  ui.opener = opener ?? document.activeElement;
  sheet.replaceChildren(...nodes);
  if (!sheet.open) sheet.showModal();
  document.documentElement.classList.add('is-locked');
}
function closeSheet() { if (sheet.open) sheet.close(); }
sheet.addEventListener('close', () => { document.documentElement.classList.remove('is-locked'); ui.opener?.focus?.({ preventScroll: true }); });
sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-close]')) closeSheet(); });
const sheetHead = (title, sub) => h('div', { class: 'sheet__head' },
  h('h2', { class: 'sheet__title', id: 'sheet-titulo' }, title, sub ? h('span', { class: 'sheet__sub' }, h('br'), sub) : null),
  h('button', { class: 'icon-btn', type: 'button', 'data-close': true, 'aria-label': 'Fechar' }, icon('x')));

/* ---------- tables ---------- */

function renderMesas() {
  const state = load();
  $('#mesas').replaceChildren(...Array.from({ length: MESAS }, (_, i) => {
    const n = i + 1;
    const orders = openOrders(state, n);
    const pending = cartCount(ui.carts.get(n) ?? []);
    const ready = orders.some((p) => Object.values(p.estacoes).some((st) => st.status === 'pronto'));
    const total = orders.reduce((s, p) => s + orderTotal(p), 0);
    const meta = orders.length ? `${plural(orders.length, 'pedido', 'pedidos')} · ${brl(total)}` : pending ? `${pending} no rascunho` : 'Livre';
    return h('li', {}, h('button', {
      class: `table${orders.length || pending ? ' is-open' : ''}${ready ? ' is-ready' : ''}`, type: 'button',
      'aria-label': `Mesa ${n}: ${ready ? 'pronto para servir, ' : ''}${meta}`,
      onclick: () => openMesa(n),
    }, h('span', { class: 'table__num', text: String(n) }), h('span', { class: 'table__meta', text: meta })));
  }));
}

function showMesas() {
  ui.mesa = null;
  $('#view-mesa').hidden = true;
  $('#view-mesas').hidden = false;
  $('#voltar').hidden = true;
  $('#logo').hidden = false;
  $('#titulo').textContent = 'Mesas';
  $('#cartbar').hidden = true;
  renderMesas();
  $('#titulo').focus({ preventScroll: true });
  scrollTo(0, 0);
}

function openMesa(n) {
  ui.mesa = n;
  $('#view-mesas').hidden = true;
  $('#view-mesa').hidden = false;
  $('#voltar').hidden = false;
  $('#logo').hidden = true;
  $('#titulo').textContent = `Mesa ${n}`;
  selectTab(openOrders(load(), n).length && !cart().length ? 'conta' : 'pedir');
  renderList();
  renderConta();
  renderCartBar();
  $('#titulo').focus({ preventScroll: true });
  scrollTo(0, 0);
}

/* ---------- tabs ---------- */

function selectTab(which) {
  for (const t of ['pedir', 'conta']) {
    const on = t === which;
    $(`#tab-${t}`).setAttribute('aria-selected', String(on));
    $(`#tab-${t}`).tabIndex = on ? 0 : -1;
    $(`#panel-${t}`).hidden = !on;
  }
  $('#cartbar').hidden = which !== 'pedir' || !cart().length;
}
$('#tab-pedir').addEventListener('click', () => selectTab('pedir'));
$('#tab-conta').addEventListener('click', () => { selectTab('conta'); renderConta(); });
$('.seg').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const next = $('#tab-pedir').getAttribute('aria-selected') === 'true' ? 'conta' : 'pedir';
  selectTab(next);
  $(`#tab-${next}`).focus();
});

/* ---------- menu list ---------- */

function renderCats() {
  const chips = [{ id: 'todos', nome: 'Todos' }, ...ui.cats].map((c) => h('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(ui.cat === c.id), 'data-cat': c.id,
    onclick: () => { ui.cat = c.id; renderCats(); renderList(); },
  }, c.nome));
  $('#cats').replaceChildren(...chips);
}

function renderList() {
  const tokens = norm(ui.query).split(/\s+/).filter(Boolean);
  const dow = today();
  const visible = ui.items.filter((it) => (ui.cat === 'todos' || it.catId === ui.cat) && tokens.every((t) => it.hay.includes(t)));
  if (!visible.length) { $('#lista').replaceChildren(h('p', { class: 'empty', text: 'Nenhum item encontrado. Tente o nome do prato ou do drink.' })); return; }
  const groups = new Map();
  for (const it of visible) { if (!groups.has(it.catId)) groups.set(it.catId, []); groups.get(it.catId).push(it); }
  $('#lista').replaceChildren(...[...groups].map(([catId, items]) => h('section', { class: 'menu-group', 'aria-label': items[0].catNome },
    h('h2', { class: 'menu-group__title', text: items[0].catNome }),
    items.map((it) => {
      const off = it.dias?.length && !it.dias.includes(dow);
      const priceLabel = it.variantes?.length > 1 ? `a partir de ${brl(Math.min(...it.variantes.map((v) => v.preco)))}` : brl(it.preco);
      return h('button', { class: `menu-row${off ? ' is-off' : ''}`, type: 'button', 'aria-haspopup': 'dialog', onclick: (e) => openItem(it, e.currentTarget) },
        h('span', {},
          h('span', { class: 'menu-row__name', text: it.grupo ? `${it.nome}` : it.nome }),
          it.vegetariano ? h('span', { class: 'visually-hidden', text: ' (vegetariano)' }) : null,
          (it.prato || it.grupo || off) && h('span', { class: 'menu-row__dish' }, h('br'),
            [it.prato, it.grupo, off ? 'fora do dia' : null].filter(Boolean).join(' · '))),
        h('span', { class: 'menu-row__side' },
          h('span', { class: 'menu-row__price', text: priceLabel }),
          h('span', { class: 'menu-row__add', 'aria-hidden': 'true' }, icon('plus'))));
    }))));
}

$('#busca').addEventListener('input', (e) => { ui.query = e.target.value; renderList(); });

/* ---------- item sheet ---------- */

function openItem(it, opener) {
  let qtd = 1;
  let variante = it.variantes?.[0] ?? null;
  let sabor = it.sabores?.[0] ?? null;
  const obs = h('textarea', { class: 'obs', id: 'obs', maxlength: '160', placeholder: 'Ex.: sem cebola, dividir em dois pratos…' });
  const out = h('output', { id: 'qtd', 'aria-live': 'polite', text: '1' });
  const addBtn = h('button', { class: 'btn btn--block', type: 'button' });
  const unit = () => variante?.preco ?? it.preco ?? null;
  const refresh = () => { out.textContent = String(qtd); addBtn.replaceChildren(icon('plus'), `Adicionar ${qtd}× · ${brl(unit() == null ? null : unit() * qtd)}`); };
  const radios = (name, list, current, label, onPick) => h('fieldset', { class: 'options-set', style: 'border:0;margin:0;padding:0' },
    h('legend', { class: 'field-label', text: label }),
    h('div', { class: 'options' }, list.map((opt, i) => {
      const text = typeof opt === 'string' ? opt : `${opt.rotulo} · ${brl(opt.preco)}`;
      const input = h('input', { type: 'radio', name, value: String(i), checked: opt === current });
      input.addEventListener('change', () => { onPick(opt); refresh(); });
      return h('label', {}, input, h('span', { text }));
    })));

  const body = h('div', { class: 'sheet__body' },
    it.descricao ? h('p', { class: 'sheet__sub', text: it.descricao }) : null,
    it.variantes?.length > 1 ? radios('variante', it.variantes, variante, 'Opção', (v) => { variante = v; }) : null,
    it.sabores?.length ? radios('sabor', it.sabores, sabor, 'Sabor', (s) => { sabor = s; }) : null,
    h('div', {},
      h('p', { class: 'field-label', text: 'Quantidade' }),
      h('div', { class: 'stepper' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Diminuir', onclick: () => { qtd = Math.max(1, qtd - 1); refresh(); } }, icon('minus')),
        out,
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Aumentar', onclick: () => { qtd = Math.min(50, qtd + 1); refresh(); } }, icon('plus')))),
    h('div', {},
      h('label', { class: 'field-label', for: 'obs', text: 'Observação para a cozinha/bar' }),
      h('div', { class: 'quick-obs' }, (QUICK_OBS[it.estacao] ?? []).map((q) => h('button', {
        class: 'chip', type: 'button', onclick: () => { obs.value = obs.value ? `${obs.value.replace(/[,\s]+$/, '')}, ${q.toLowerCase()}` : q; obs.focus(); },
      }, q))),
      obs));
  addBtn.addEventListener('click', () => {
    const opcao = [variante?.rotulo, sabor].filter(Boolean).join(' · ') || null;
    const lines = cart();
    const same = lines.find((l) => l.key === it.key && l.opcao === opcao && l.obs === obs.value.trim());
    if (same) same.qtd += qtd;
    else lines.push({ uid: `${Date.now()}-${lines.length}`, key: it.key, id: it.id, nome: it.nome, prato: it.prato, opcao, qtd, obs: obs.value.trim(), preco: unit(), estacao: it.estacao });
    closeSheet();
    renderCartBar();
    toast(`${qtd}× ${it.nome} no pedido da mesa ${ui.mesa}`);
  });
  refresh();
  openSheet([
    sheetHead(it.nome, [it.prato, STATIONS[it.estacao]].filter(Boolean).join(' · ')),
    body,
    h('div', { class: 'sheet__foot' }, addBtn),
  ], opener);
}

/* ---------- cart ---------- */

function renderCartBar() {
  const lines = cart();
  $('#cart-resumo').textContent = `${plural(cartCount(lines), 'item', 'itens')} · ${brl(cartTotal(lines))}`;
  $('#cartbar').hidden = !lines.length || $('#panel-pedir').hidden;
}

function openCart(opener) {
  const lines = cart();
  const list = h('div', {});
  const total = h('p', { class: 'bill__total' });
  const send = h('button', { class: 'btn btn--block', type: 'button' }, icon('send'), 'Enviar para a expedição');
  const draw = () => {
    list.replaceChildren(...lines.map((l) => h('div', { class: 'cart-line' },
      h('div', {},
        h('p', { class: 'line__name', text: `${l.qtd}× ${l.nome}` }),
        l.opcao && h('p', { class: 'line__opt', text: l.opcao }),
        l.obs && h('p', { class: 'line__obs', text: `Obs.: ${l.obs}` })),
      h('div', { class: 'cart-line__actions' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Diminuir ${l.nome}`, onclick: () => { l.qtd -= 1; if (!l.qtd) lines.splice(lines.indexOf(l), 1); draw(); } }, icon('minus')),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Aumentar ${l.nome}`, onclick: () => { l.qtd += 1; draw(); } }, icon('plus')),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Remover ${l.nome}`, onclick: () => { lines.splice(lines.indexOf(l), 1); draw(); } }, icon('trash'))))));
    total.textContent = brl(cartTotal(lines));
    send.disabled = !lines.length;
    renderCartBar();
    if (!lines.length) list.replaceChildren(h('p', { class: 'empty', text: 'O pedido está vazio.' }));
  };
  send.addEventListener('click', () => {
    if (!lines.length) return;
    const pedido = createOrder({ mesa: ui.mesa, garcom: garcom(), itens: lines.map((l) => ({ ...l })) });
    ui.carts.set(ui.mesa, []);
    closeSheet();
    renderCartBar();
    renderConta();
    selectTab('conta');
    toast(`Pedido #${pedido.numero} da mesa ${ui.mesa} enviado para a expedição`);
  });
  draw();
  openSheet([
    sheetHead(`Pedido · Mesa ${ui.mesa}`, `Garçom: ${garcom()}`),
    h('div', { class: 'sheet__body' }, list, h('div', { class: 'bill__row' }, h('span', { text: 'Total do pedido' }), total)),
    h('div', { class: 'sheet__foot' }, send),
  ], opener);
}
$('#ver-carrinho').addEventListener('click', (e) => openCart(e.currentTarget));

/* ---------- account (conta) ---------- */

function renderConta() {
  if (ui.mesa == null) return;
  const orders = openOrders(load(), ui.mesa);
  const ready = orders.filter((p) => Object.values(p.estacoes).some((st) => st.status === 'pronto')).length;
  $('#conta-count').textContent = String(ready);
  $('#conta-count').hidden = !ready;
  if (!orders.length) {
    $('#panel-conta').replaceChildren(h('p', { class: 'empty', text: 'Nenhum pedido enviado para esta mesa ainda.' }));
    return;
  }
  const total = orders.reduce((s, p) => s + orderTotal(p), 0);
  $('#panel-conta').replaceChildren(
    ...orders.map((p) => h('article', { class: 'round', 'aria-label': `Pedido ${p.numero}` },
      h('p', { class: 'round__head' }, h('span', { text: `Pedido #${p.numero} · ${clock(p.criado)}` }), h('span', { text: p.garcom })),
      Object.entries(p.estacoes).map(([est, st]) => h('div', { class: 'round__station' },
        h('div', { class: 'round__station-head' },
          h('span', { class: 'round__station-name', text: STATIONS[est] ?? est }),
          h('span', { class: `tag tag--${st.status}`, text: { novo: 'Aguardando expedição', preparo: 'Em preparo', pronto: 'Pronto para servir', entregue: 'Entregue' }[st.status] }),
          st.status === 'pronto' && h('button', { class: 'btn btn--ok btn--sm', type: 'button', onclick: () => setStationStatus(p.id, est, 'entregue') }, icon('check'), 'Entregue')),
        p.itens.filter((it) => it.estacao === est).map((it) => h('div', { class: 'line' },
          h('span', { class: 'line__qty', text: `${it.qtd}×` }),
          h('span', {}, h('span', { class: 'line__name', text: it.nome }), it.opcao && h('span', { class: 'line__opt', text: ` · ${it.opcao}` })),
          h('span', { class: 'line__price', text: brl(it.preco == null ? null : it.preco * it.qtd) }),
          it.obs && h('span', { class: 'line__obs', text: `Obs.: ${it.obs}` }))))))),
    h('div', { class: 'bill' },
      h('div', { class: 'bill__row' }, h('span', { text: 'Consumo da mesa' }), h('span', { class: 'bill__total', text: brl(total) })),
      h('p', { class: 'bill__note', text: 'Valores do cardápio, sem taxa de serviço. Itens "Consulte" não entram no total.' }),
      h('button', { class: 'btn btn--danger', type: 'button', onclick: (e) => confirmClose(e.currentTarget) }, icon('receipt'), 'Fechar mesa')));
}

function confirmClose(opener) {
  const n = ui.mesa;
  openSheet([
    sheetHead(`Fechar a mesa ${n}?`, 'Os pedidos saem da tela e a mesa fica livre.'),
    h('div', { class: 'sheet__foot', style: 'display:grid;gap:var(--space-2)' },
      h('button', { class: 'btn btn--danger btn--block', type: 'button', onclick: () => { closeTable(n); closeSheet(); toast(`Mesa ${n} fechada`); showMesas(); } }, 'Sim, fechar mesa'),
      h('button', { class: 'btn btn--ghost btn--block', type: 'button', 'data-close': true }, 'Cancelar')),
  ], opener);
}

/* ---------- waiter name ---------- */

function editName(opener) {
  const input = h('input', { class: 'name-input', id: 'nome-garcom', value: garcom(), maxlength: '30', autocomplete: 'name' });
  const saveName = () => {
    const v = input.value.trim() || 'Garçom 1';
    try { localStorage.setItem(NAME_KEY, v); } catch { /* ignore */ }
    $('#garcom-nome').textContent = v;
    closeSheet();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
  openSheet([
    sheetHead('Quem está atendendo?'),
    h('div', { class: 'sheet__body' }, h('label', { class: 'field-label', for: 'nome-garcom', text: 'Seu nome' }), input),
    h('div', { class: 'sheet__foot' }, h('button', { class: 'btn btn--block', type: 'button', onclick: saveName }, 'Salvar')),
  ], opener);
  input.focus();
}
$('#garcom-btn').addEventListener('click', (e) => editName(e.currentTarget));
$('#voltar').addEventListener('click', showMesas);

/* ---------- live updates from the expedition ---------- */

function snapshot(state) {
  const changes = [];
  for (const p of state.pedidos) for (const [est, st] of Object.entries(p.estacoes)) {
    const k = `${p.id}:${est}`;
    const prev = ui.statuses.get(k);
    if (prev && prev !== st.status && st.status === 'pronto') changes.push(`Mesa ${p.mesa}: pedido da ${STATIONS[est].toLowerCase()} pronto para servir`);
    ui.statuses.set(k, st.status);
  }
  return changes;
}

subscribe((state) => {
  const ready = snapshot(state);
  if (ready.length) { toast(ready.join(' · ')); navigator.vibrate?.([120, 60, 120]); }
  if (ui.mesa == null) renderMesas(); else renderConta();
});

/* ---------- boot ---------- */

async function init() {
  $('#garcom-nome').textContent = garcom();
  snapshot(load());
  renderMesas();
  try {
    const cardapio = await getJSON('cardapio');
    ui.items = orderableItems(cardapio).map((it) => ({ ...it, hay: norm([it.nome, it.prato, it.grupo, it.catNome, it.descricao, ...(it.sabores ?? [])].join(' ')) }));
    ui.cats = (cardapio.categorias ?? []).map((c) => ({ id: c.id, nome: c.nome }));
    renderCats();
    renderList();
  } catch (err) {
    console.warn('Cardápio indisponível:', err);
    $('#lista').replaceChildren(h('p', { class: 'empty', text: 'Não foi possível carregar o cardápio.' }));
  }
}
init();
