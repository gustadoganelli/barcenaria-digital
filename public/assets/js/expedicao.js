// Expedition screen (DEMO): receives waiter orders split by station, dispatches them to kitchen/bar,
// tracks preparation time and marks tickets as ready for the waiter.
import {
  STATIONS, load, subscribe, reset, createOrder, setStationStatus, orderableItems,
  h, icon, brl, clock, minutesSince, getJSON,
} from './comanda-store.js';

const $ = (s) => document.querySelector(s);
const LIMITS = { novo: [3, 6], preparo: [12, 20] }; // minutes: [warn, late]
const seen = new Set();
let menu = [];
let sound = false;
let audio = null;

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

function beep() {
  if (!sound) return;
  audio ??= new AudioContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.35);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.4);
}

const level = (mins, [warn, late]) => (mins >= late ? 'is-late' : mins >= warn ? 'is-warn' : '');
const since = (mins) => (mins < 1 ? 'agora' : `${mins} min`);

function lines(items) {
  return items.map((it) => h('div', { class: 'line' },
    h('span', { class: 'line__qty', text: `${it.qtd}×` }),
    h('span', {}, h('span', { class: 'line__name', text: it.nome }), it.prato && h('span', { class: 'line__opt', text: ` · ${it.prato}` }), it.opcao && h('span', { class: 'line__opt', text: ` · ${it.opcao}` })),
    h('span'),
    it.obs && h('span', { class: 'line__obs', text: `Obs.: ${it.obs}` })));
}

function ticketHead(p, mins, label) {
  return h('div', { class: 'ticket__head' },
    h('div', {},
      h('p', { class: 'ticket__mesa', text: `Mesa ${p.mesa}` }),
      h('p', { class: 'ticket__meta', text: `#${p.numero} · ${p.garcom} · ${clock(p.criado)}${label ? ` · ${label}` : ''}` })),
    h('span', { class: 'ticket__timer', text: since(mins) }));
}

function printTicket(p, est) {
  const items = p.itens.filter((it) => it.estacao === est);
  $('#print-area').replaceChildren(
    h('h2', { text: `${STATIONS[est]} · Mesa ${p.mesa}` }),
    h('p', { text: `Pedido #${p.numero} · ${clock(p.criado)} · ${p.garcom}` }),
    h('hr'),
    ...items.map((it) => h('p', {}, h('strong', { text: `${it.qtd}× ${it.nome}` }), it.opcao ? ` (${it.opcao})` : '', it.obs ? h('br') : null, it.obs ? `OBS: ${it.obs}` : null)),
    h('hr'));
  window.print();
}

function dispatch(p, est) {
  setStationStatus(p.id, est, 'preparo');
  if ($('#imprimir').checked) printTicket(p, est);
  toast(`Mesa ${p.mesa}: pedido encaminhado para ${STATIONS[est].toLowerCase()}`);
}

function newTicket(p) {
  const mins = minutesSince(p.criado);
  const pending = Object.entries(p.estacoes).filter(([, st]) => st.status === 'novo');
  return h('article', { class: `ticket ${level(mins, LIMITS.novo)}${seen.has(p.id) ? '' : ' is-new'}`, 'aria-label': `Novo pedido da mesa ${p.mesa}` },
    ticketHead(p, mins),
    pending.map(([est]) => h('div', { class: 'ticket__group' },
      h('div', { class: 'ticket__group-head' },
        h('span', { class: 'round__station-name', text: STATIONS[est] }),
        h('div', { class: 'ticket__actions' },
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', 'aria-label': `Imprimir comanda da ${STATIONS[est]} da mesa ${p.mesa}`, onclick: () => printTicket(p, est) }, icon('print')),
          h('button', { class: 'btn btn--sm', type: 'button', onclick: () => dispatch(p, est) }, icon('send'), `Encaminhar p/ ${STATIONS[est].toLowerCase()}`))),
      lines(p.itens.filter((it) => it.estacao === est)))),
    pending.length > 1 && h('button', { class: 'btn btn--block', type: 'button', onclick: () => pending.forEach(([est]) => dispatch(p, est)) }, icon('send'), 'Encaminhar tudo'));
}

function prepTicket(p, est) {
  const st = p.estacoes[est];
  const mins = minutesSince(st.ts.preparo ?? p.criado);
  return h('article', { class: `ticket ${level(mins, LIMITS.preparo)}`, 'aria-label': `Mesa ${p.mesa}, ${STATIONS[est]}, em preparo` },
    ticketHead(p, mins, `pedido há ${since(minutesSince(p.criado))}`),
    h('div', { class: 'ticket__group' }, lines(p.itens.filter((it) => it.estacao === est))),
    h('button', { class: 'btn btn--ok btn--block', type: 'button', onclick: () => { setStationStatus(p.id, est, 'pronto'); toast(`Mesa ${p.mesa}: pedido da ${STATIONS[est].toLowerCase()} pronto, garçom avisado`); } }, icon('check'), 'Pronto'));
}

function readyTicket(p, est) {
  const mins = minutesSince(p.estacoes[est].ts.pronto ?? Date.now());
  const count = p.itens.filter((it) => it.estacao === est).reduce((s, it) => s + it.qtd, 0);
  return h('article', { class: `ticket ${level(mins, [3, 6])}`, 'aria-label': `Mesa ${p.mesa}, ${STATIONS[est]}, pronto` },
    ticketHead(p, mins, STATIONS[est]),
    h('p', { class: 'ticket__meta', text: `${count} ${count === 1 ? 'item' : 'itens'} aguardando retirada` }),
    h('button', { class: 'btn btn--ghost btn--block', type: 'button', onclick: () => setStationStatus(p.id, est, 'entregue') }, icon('check'), 'Entregue'));
}

function fill(id, nodes, empty) {
  $(`#${id}`).replaceChildren(...(nodes.length ? nodes : [h('p', { class: 'col__empty', text: empty })]));
}

function render() {
  const state = load();
  const open = state.pedidos.filter((p) => !p.fechado);
  const pairs = (status, est) => open.filter((p) => p.estacoes[est]?.status === status).map((p) => [p, est]);
  const novos = open.filter((p) => Object.values(p.estacoes).some((st) => st.status === 'novo'));
  const cozinha = pairs('preparo', 'cozinha');
  const bar = pairs('preparo', 'bar');
  const prontos = [...pairs('pronto', 'cozinha'), ...pairs('pronto', 'bar')].sort((a, b) => a[0].estacoes[a[1]].ts.pronto - b[0].estacoes[b[1]].ts.pronto);

  const fresh = novos.filter((p) => !seen.has(p.id));
  fill('novos', novos.map(newTicket), 'Nenhum pedido novo.');
  fill('preparo-cozinha', cozinha.map(([p, est]) => prepTicket(p, est)), 'Nada em preparo na cozinha.');
  fill('preparo-bar', bar.map(([p, est]) => prepTicket(p, est)), 'Nada em preparo no bar.');
  fill('prontos', prontos.map(([p, est]) => readyTicket(p, est)), 'Nenhum pedido aguardando retirada.');
  for (const p of open) seen.add(p.id);
  if (fresh.length) beep();

  $('#n-novos').textContent = String(novos.length);
  $('#n-cozinha').textContent = String(cozinha.length);
  $('#n-bar').textContent = String(bar.length);
  $('#n-prontos').textContent = String(prontos.length);
  $('#stat-novos b').textContent = String(novos.length);
  $('#stat-preparo b').textContent = String(cozinha.length + bar.length);
  $('#stat-prontos b').textContent = String(prontos.length);
}

// Demo helper: builds a plausible order (one kitchen dish + one or two drinks) from the real menu.
function exampleOrder() {
  if (!menu.length) return;
  const pick = (station, n) => {
    const pool = menu.filter((it) => it.estacao === station && it.preco != null && !it.dias?.length);
    const offset = (load().seq * 7) % pool.length;
    return Array.from({ length: n }, (_, i) => pool[(offset + i * 5) % pool.length]);
  };
  const itens = [...pick('cozinha', 1), ...pick('bar', 2)].map((it, i) => ({
    uid: `ex-${Date.now()}-${i}`, key: it.key, id: it.id, nome: it.nome, prato: it.prato, estacao: it.estacao,
    opcao: it.variantes?.[0]?.rotulo ?? (it.sabores?.[0] ?? null), qtd: i === 1 ? 2 : 1, obs: i === 0 ? 'Ao ponto' : '', preco: it.variantes?.[0]?.preco ?? it.preco,
  }));
  createOrder({ mesa: 1 + ((load().seq * 11) % 30), garcom: 'Garçom (exemplo)', itens });
}

function tickClock() {
  $('#relogio').textContent = clock(Date.now());
  $('#relogio').dateTime = new Date().toISOString();
}

$('#som').addEventListener('click', (e) => {
  sound = !sound;
  e.currentTarget.setAttribute('aria-pressed', String(sound));
  if (sound) { audio ??= new AudioContext(); audio.resume(); beep(); }
});
$('#exemplo').addEventListener('click', exampleOrder);
$('#limpar').addEventListener('click', () => {
  if (!window.confirm('Apagar todos os pedidos desta demonstração?')) return;
  reset();
  seen.clear();
  toast('Demonstração zerada');
});

subscribe(render);
setInterval(() => { tickClock(); render(); }, 30000);
tickClock();
for (const p of load().pedidos) seen.add(p.id);
render();
getJSON('cardapio').then((c) => { menu = orderableItems(c); }).catch((err) => console.warn('Cardápio indisponível:', err));
