// Reservation calendar (DEMO): one agenda per area that refuses a second booking of the same area and time.
// Whole-area bookings (birthday, event) block the area; table bookings only clash with whole-area ones.
import { h, icon } from './comanda-store.js';

const KEY = 'barcenaria:reservas:v1';
const TZ = 'America/Sao_Paulo';

export const AREAS = [
  { id: 'rooftop', nome: 'Rooftop', em: 'no' },
  { id: 'varanda', nome: 'Varanda', em: 'na' },
  { id: 'salao', nome: 'Salão interno', em: 'no' },
];
// "no Rooftop", "na Varanda", "no Salão interno".
export const naArea = (id) => { const a = AREAS.find((x) => x.id === id); return a ? `${a.em} ${a.nome}` : id; };
export const TIPOS = {
  aniversario: { nome: 'Aniversário', inteira: true },
  confraternizacao: { nome: 'Confraternização', inteira: true },
  evento: { nome: 'Evento fechado', inteira: true },
  mesa: { nome: 'Mesa', inteira: false },
};
const STATUS = { pre: 'Pré-reserva', confirmada: 'Confirmada', cancelada: 'Cancelada' };

/* ---------- dates (civil dates as YYYY-MM-DD, weekday 0 = Sunday) ---------- */

export const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const weekday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
export const fmtDay = (iso, opts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', ...opts }).format(new Date(`${iso}T12:00:00Z`));
const minutes = (hhmm) => { const [hh, mm] = hhmm.split(':').map(Number); return hh * 60 + mm; };
const span = (r) => { const a = minutes(r.inicio); let b = minutes(r.fim); if (b <= a) b += 1440; return [a, b]; };
const overlaps = (x, y) => { const [a1, b1] = span(x); const [a2, b2] = span(y); return a1 < b2 && a2 < b1; };
const byStart = (a, b) => minutes(a.inicio) - minutes(b.inicio);

/* ---------- rules ---------- */

export function conflicts(list, r) {
  return list.filter((o) => o.id !== r.id && o.status !== 'cancelada' && o.data === r.data && o.area === r.area
    && (o.inteira || r.inteira) && overlaps(o, r));
}
const freeAreas = (list, r) => AREAS.filter((a) => a.id !== r.area && !conflicts(list, { ...r, area: a.id }).length);

/* ---------- storage ---------- */

function seed() {
  const t = todayISO();
  const next = (dow) => { for (let i = 1; i <= 7; i += 1) { const d = addDays(t, i); if (weekday(d) === dow) return d; } return t; };
  const r = (data, area, tipo, inicio, fim, nome, pessoas, status, obs = '') => ({
    id: `R${Math.random().toString(36).slice(2, 8)}`, data, area, tipo, inteira: TIPOS[tipo].inteira, inicio, fim, nome,
    telefone: '(11) 90000-0000', pessoas, status, obs, registradoPor: 'Gerência', exemplo: true,
  });
  return [
    r(next(6), 'rooftop', 'aniversario', '14:00', '22:00', 'Carla Mendes', 40, 'confirmada', 'Bolo próprio; decoração a partir das 13h.'),
    r(next(6), 'salao', 'mesa', '20:00', '23:00', 'Rafael Lima', 8, 'confirmada'),
    r(next(5), 'varanda', 'confraternizacao', '19:00', '23:30', 'Ana Souza', 25, 'pre', 'Aguardando sinal via Pix.'),
    r(next(0), 'varanda', 'mesa', '12:00', '16:00', 'Família Oliveira', 12, 'pre'),
    r(next(4), 'salao', 'mesa', '20:00', '23:00', 'João Pedro', 4, 'confirmada', 'Mesa perto da sinuca.'),
  ];
}
export function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s?.reservas)) return s; } catch {}
  const s = { reservas: seed() };
  save(s);
  return s;
}
export function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

/* ---------- UI ---------- */

const $ = (s) => document.querySelector(s);
let state;
let casa = null;
let toast = () => {};
let month;
let selected;
let lastFocus = null;

const active = (iso) => state.reservas.filter((r) => r.data === iso && r.status !== 'cancelada');
const areaName = (id) => AREAS.find((a) => a.id === id)?.nome ?? id;

function shiftMonth(n) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  month = d.toISOString().slice(0, 7);
  renderCalendar();
}

function renderCalendar() {
  const today = todayISO();
  const first = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Array.from({ length: weekday(first) }, () => h('span', { class: 'cal__pad', 'aria-hidden': 'true' }));
  for (let d = 1; d <= days; d += 1) {
    const iso = `${month}-${String(d).padStart(2, '0')}`;
    const list = active(iso);
    const tags = AREAS.map((a) => {
      const rs = list.filter((r) => r.area === a.id);
      if (!rs.length) return null;
      const cls = `cal__tag${rs.some((r) => r.inteira) ? ' is-whole' : ''}${rs.every((r) => r.status === 'pre') ? ' is-pre' : ''}`;
      return h('span', { class: cls, text: a.nome.split(' ')[0] });
    });
    cells.push(h('button', {
      type: 'button',
      class: `cal__day${iso === today ? ' is-today' : ''}${iso < today ? ' is-past' : ''}`,
      'aria-pressed': String(iso === selected),
      'aria-label': `${fmtDay(iso, { weekday: 'long', day: 'numeric', month: 'long' })}: ${list.length ? `${list.length} ${list.length === 1 ? 'reserva' : 'reservas'}` : 'sem reservas'}`,
      onclick: () => { selected = iso; render(); $('#agenda').focus?.(); },
    }, h('span', { class: 'cal__num', text: String(d) }), h('span', { class: 'cal__tags' }, tags)));
  }
  $('#calendario').replaceChildren(
    h('div', { class: 'cal__head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Mês anterior', onclick: () => shiftMonth(-1) }, icon('left')),
      h('h2', { class: 'cal__title', text: fmtDay(first, { month: 'long', year: 'numeric' }) }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Próximo mês', onclick: () => shiftMonth(1) }, icon('right'))),
    h('div', { class: 'cal__dow', 'aria-hidden': 'true' }, ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((x) => h('span', { text: x }))),
    h('div', { class: 'cal__grid' }, cells),
    h('p', { class: 'legend' },
      h('span', {}, h('i', { class: 'is-whole' }), 'Área inteira'),
      h('span', {}, h('i'), 'Mesa'),
      h('span', {}, h('i', { class: 'is-pre' }), 'Pré-reserva')),
    upcoming(today));
}

function upcoming(today) {
  const next = state.reservas.filter((r) => r.status !== 'cancelada' && r.data >= today)
    .sort((a, b) => a.data.localeCompare(b.data) || byStart(a, b)).slice(0, 5);
  return h('div', { class: 'next' },
    h('h3', { class: 'area__title', text: 'Próximas reservas' }),
    next.length
      ? h('ul', { class: 'next__list' }, next.map((r) => h('li', {},
        h('button', { class: 'next__item', type: 'button', onclick: () => { selected = r.data; month = r.data.slice(0, 7); render(); } },
          h('span', { class: 'next__date', text: fmtDay(r.data, { weekday: 'short', day: '2-digit', month: '2-digit' }) }),
          h('span', { class: 'next__text', text: `${r.inicio} · ${areaName(r.area)} · ${r.nome}` }),
          h('span', { class: `tag tag--${r.status}`, text: STATUS[r.status] })))))
      : h('p', { class: 'area__empty', text: 'Nenhuma reserva futura.' }));
}

function whatsapp(r) {
  if (r.exemplo) return null;
  let digits = r.telefone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12) return null;
  const msg = `Olá, ${r.nome.split(' ')[0]}! Aqui é da Barcenaria. Sua reserva para ${fmtDay(r.data, { day: 'numeric', month: 'long' })}, das ${r.inicio} às ${r.fim}, ${naArea(r.area)}, está ${STATUS[r.status].toLowerCase()}.`;
  return h('a', { class: 'btn btn--ghost btn--sm', href: `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, target: '_blank', rel: 'noopener' }, icon('whatsapp'), 'WhatsApp');
}

function setStatus(id, status) {
  const r = state.reservas.find((x) => x.id === id);
  if (!r) return;
  if (status === 'confirmada' && conflicts(state.reservas, { ...r, status }).length) { toast('Não dá para confirmar: há conflito nessa área e horário'); return; }
  if (status === 'cancelada' && !window.confirm(`Cancelar a reserva de ${r.nome}?`)) return;
  r.status = status;
  save(state);
  render();
  toast(status === 'confirmada' ? `Reserva de ${r.nome} confirmada` : `Reserva de ${r.nome} cancelada`);
}

function card(r) {
  return h('article', { class: `res res--${r.status}${r.inteira ? ' res--whole' : ''}` },
    h('div', { class: 'res__top' },
      h('p', { class: 'res__time', text: `${r.inicio}–${r.fim}` }),
      h('span', { class: `tag tag--${r.status}`, text: STATUS[r.status] })),
    h('p', { class: 'res__name', text: r.nome }),
    r.origem === 'site' && h('p', { class: 'res__origin', text: 'Pedido pelo site' }),
    h('p', { class: 'res__meta', text: `${TIPOS[r.tipo]?.nome ?? r.tipo}${r.inteira ? ' · área inteira' : ''} · ${r.pessoas} ${r.pessoas === 1 ? 'pessoa' : 'pessoas'}` }),
    r.obs && h('p', { class: 'res__obs', text: r.obs }),
    h('p', { class: 'res__meta', text: `${r.telefone} · registrado por ${r.registradoPor}` }),
    r.status !== 'cancelada' && h('div', { class: 'res__actions' },
      r.status === 'pre' && h('button', { class: 'btn btn--ok btn--sm', type: 'button', onclick: () => setStatus(r.id, 'confirmada') }, icon('check'), 'Confirmar'),
      whatsapp(r),
      h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => setStatus(r.id, 'cancelada') }, icon('x'), 'Cancelar')));
}

function renderDay() {
  const list = state.reservas.filter((r) => r.data === selected).sort(byStart);
  const horario = casa?.horarios?.find((d) => d.dia === weekday(selected));
  $('#agenda').replaceChildren(...[
    h('div', { class: 'day__head' },
      h('h2', { class: 'day__title', text: fmtDay(selected, { weekday: 'long', day: 'numeric', month: 'long' }) }),
      h('button', { class: 'btn btn--sm', type: 'button', onclick: (e) => openForm(e.currentTarget) }, icon('plus'), 'Reservar neste dia')),
    horario && !horario.abre && h('p', { class: 'day__warn' }, icon('alert'), 'A casa não abre neste dia. Confirme antes de aceitar uma reserva.'),
    h('div', { class: 'day__cols' }, AREAS.map((a) => {
      const rs = list.filter((r) => r.area === a.id);
      return h('section', { class: 'area', 'aria-label': a.nome },
        h('h3', { class: 'area__title', text: a.nome }),
        rs.length ? rs.map(card) : h('p', { class: 'area__empty', text: 'Livre o dia todo' }));
    })),
  ].filter(Boolean));
}

function render() { renderCalendar(); renderDay(); }

/* ---------- form ---------- */

const sheet = () => $('#sheet');
function closeForm() { sheet().close(); lastFocus?.focus?.(); }

function field(label, control, id) {
  control.id = id;
  return h('div', { class: 'form__field' }, h('label', { class: 'field-label', for: id, text: label }), control);
}

function openForm(opener) {
  lastFocus = opener ?? document.activeElement;
  const input = (type, name, value = '', extra = {}) => h('input', { class: 'name-input', type, name, value, ...extra });
  const select = (name, entries, value) => {
    const el = h('select', { class: 'name-input', name }, entries.map(([v, t]) => h('option', { value: v, text: t })));
    el.value = value;
    return el;
  };
  const tipo = select('tipo', Object.entries(TIPOS).map(([k, v]) => [k, v.nome]), 'aniversario');
  const inteira = h('input', { type: 'checkbox', name: 'inteira', checked: true });
  const area = select('area', AREAS.map((a) => [a.id, a.nome]), 'rooftop');
  const error = h('div', { class: 'form__error', role: 'alert', hidden: true });
  tipo.addEventListener('change', () => { inteira.checked = TIPOS[tipo.value].inteira; });

  const form = h('form', { class: 'sheet__body form', id: 'form-reserva', novalidate: true },
    h('div', { class: 'form__row' },
      field('Data', input('date', 'data', selected, { required: true }), 'f-data'),
      field('Início', input('time', 'inicio', '19:00', { required: true }), 'f-inicio'),
      field('Fim', input('time', 'fim', '23:00', { required: true }), 'f-fim')),
    h('div', { class: 'form__row' }, field('Área', area, 'f-area'), field('Tipo', tipo, 'f-tipo')),
    h('label', { class: 'form__check' }, inteira, 'Reservar a área inteira (bloqueia a área nesse horário)'),
    h('div', { class: 'form__row' },
      field('Nome', input('text', 'nome', '', { required: true, autocomplete: 'off', maxlength: '80' }), 'f-nome'),
      field('Telefone', input('tel', 'telefone', '', { required: true, inputmode: 'tel', placeholder: '(11) 9…', maxlength: '20' }), 'f-tel')),
    h('div', { class: 'form__row' },
      field('Pessoas', input('number', 'pessoas', '2', { min: '1', max: '500', required: true }), 'f-pessoas'),
      field('Status', select('status', Object.entries(STATUS).filter(([k]) => k !== 'cancelada'), 'pre'), 'f-status'),
      field('Registrado por', input('text', 'registradoPor', 'Recepção', { maxlength: '40' }), 'f-reg')),
    field('Observações', h('textarea', { class: 'name-input', name: 'obs', rows: '2', maxlength: '240', placeholder: 'Ex.: bolo próprio, decoração, sinal pago…' }), 'f-obs'),
    error);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const r = {
      id: `R${Date.now().toString(36)}`, data: d.data, inicio: d.inicio, fim: d.fim, area: d.area, tipo: d.tipo,
      inteira: inteira.checked, nome: d.nome.trim(), telefone: d.telefone.trim(), pessoas: Number(d.pessoas) || 0,
      status: d.status, obs: d.obs.trim(), registradoPor: d.registradoPor.trim() || 'Recepção',
    };
    const missing = [!r.data && 'data', !r.inicio && 'início', !r.fim && 'fim', !r.nome && 'nome', r.telefone.replace(/\D/g, '').length < 10 && 'telefone com DDD', r.pessoas < 1 && 'pessoas'].filter(Boolean);
    if (missing.length) { showError(error, `Preencha: ${missing.join(', ')}.`); return; }
    if (r.inicio === r.fim) { showError(error, 'O horário de fim precisa ser diferente do início.'); return; }
    const clash = conflicts(state.reservas, r);
    if (clash.length) {
      const free = freeAreas(state.reservas, r);
      showError(error,
        h('p', { class: 'form__error-title' }, icon('alert'), `Já existe reserva ${naArea(r.area)} nesse horário`),
        h('ul', {}, clash.map((c) => h('li', { text: `${c.inicio}–${c.fim} · ${c.nome} · ${TIPOS[c.tipo]?.nome ?? c.tipo}${c.inteira ? ' (área inteira)' : ''} · ${STATUS[c.status]}` }))),
        free.length
          ? h('p', {}, 'Livre no mesmo horário: ', free.map((a) => h('button', { class: 'chip', type: 'button', onclick: () => { area.value = a.id; error.hidden = true; }, text: a.nome })))
          : h('p', { text: 'Nenhuma outra área está livre nesse horário.' }));
      return;
    }
    state.reservas.push(r);
    save(state);
    selected = r.data;
    month = r.data.slice(0, 7);
    closeForm();
    render();
    toast(`Reserva de ${r.nome} registrada ${naArea(r.area)}`);
  });

  sheet().replaceChildren(
    h('div', { class: 'sheet__head' },
      h('div', {}, h('h2', { class: 'sheet__title', id: 'sheet-titulo', text: 'Nova reserva' }), h('p', { class: 'sheet__sub', text: 'O painel recusa duas reservas da mesma área no mesmo horário.' })),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', onclick: closeForm }, icon('x'))),
    form,
    h('div', { class: 'sheet__foot sheet__foot--stack' },
      h('button', { class: 'btn btn--block', type: 'submit', form: 'form-reserva' }, icon('check'), 'Salvar reserva'),
      h('button', { class: 'btn btn--ghost btn--block', type: 'button', onclick: closeForm }, 'Cancelar')));
  sheet().showModal();
  form.querySelector('#f-nome').focus();
}

function showError(box, ...content) {
  box.replaceChildren(...content.map((c) => (typeof c === 'string' ? h('p', { text: c }) : c)));
  box.hidden = false;
  box.scrollIntoView({ block: 'nearest' });
}

/* ---------- public ---------- */

export function initReservas(opts) {
  ({ toast } = opts);
  casa = opts.casa ?? null;
  state = load();
  selected = todayISO();
  month = selected.slice(0, 7);
  sheet().addEventListener('click', (e) => { if (e.target === sheet()) closeForm(); });
  // Requests made on /reservar in another tab show up here without reloading.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    state = load();
    render();
    toast('Agenda atualizada em outra janela');
  });
  $('#nova-reserva').addEventListener('click', (e) => openForm(e.currentTarget));
  $('#limpar').addEventListener('click', () => {
    if (!window.confirm('Voltar as reservas para os exemplos iniciais?')) return;
    state = { reservas: seed() };
    save(state);
    render();
    toast('Demo restaurada');
  });
  render();
}
