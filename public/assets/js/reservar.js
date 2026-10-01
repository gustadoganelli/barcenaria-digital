// Customer reservation request (DEMO): shows which areas are free for the chosen slot (never who booked them)
// and saves the request as a pre-booking in the house agenda (/painel), where the team confirms it.
import { h, icon, getJSON } from './comanda-store.js';
import { AREAS, TIPOS, conflicts, load, save, naArea, todayISO, addDays, weekday, fmtDay } from './reservas.js';

const $ = (s) => document.querySelector(s);
let casa = null;

const nextSaturday = () => { const t = todayISO(); for (let i = 0; i < 7; i += 1) { const d = addDays(t, i); if (weekday(d) === 6) return d; } return t; };

function openingIssue(slot) {
  const horario = casa?.horarios?.find((x) => x.dia === weekday(slot.data));
  if (!horario) return null;
  if (!horario.abre) return `Às ${horario.nome.toLowerCase()}s a casa não abre. Escolha outro dia.`;
  if (slot.inicio && slot.inicio < horario.abre) return `Nesse dia a casa abre às ${horario.abre.replace(':00', 'h')}.`;
  return null;
}

function field(label, control, id) {
  control.id = id;
  return h('div', { class: 'form__field' }, h('label', { class: 'field-label', for: id, text: label }), control);
}

function showError(box, text) {
  box.replaceChildren(h('p', { class: 'form__error-title' }, icon('alert'), text));
  box.hidden = false;
  box.scrollIntoView({ block: 'nearest' });
}

function renderForm() {
  const input = (type, name, value = '', extra = {}) => h('input', { class: 'name-input', type, name, value, ...extra });
  const tipo = h('select', { class: 'name-input', name: 'tipo' }, Object.entries(TIPOS).map(([k, v]) => h('option', { value: k, text: v.nome })));
  const inteira = h('input', { type: 'checkbox', name: 'inteira', checked: true });
  const warn = h('p', { class: 'day__warn', hidden: true });
  const error = h('div', { class: 'form__error', role: 'alert', hidden: true });
  const areas = h('fieldset', { class: 'areas' },
    h('legend', { class: 'field-label', text: 'Espaço' }),
    AREAS.map((a) => h('label', { class: 'area-opt' },
      h('input', { type: 'radio', name: 'area', value: a.id }),
      h('span', { class: 'area-opt__name', text: a.nome }),
      h('span', { class: 'area-opt__status', text: 'Escolha data e horário' }))));

  const form = h('form', { class: 'form ask__form', novalidate: true },
    h('div', { class: 'form__row' },
      field('Data', input('date', 'data', nextSaturday(), { min: todayISO(), required: true }), 'r-data'),
      field('Chegada', input('time', 'inicio', '19:00', { required: true }), 'r-inicio'),
      field('Saída', input('time', 'fim', '23:00', { required: true }), 'r-fim')),
    h('div', { class: 'form__row' },
      field('Ocasião', tipo, 'r-tipo'),
      field('Pessoas', input('number', 'pessoas', '10', { min: '1', max: '300', inputmode: 'numeric', required: true }), 'r-pessoas')),
    h('label', { class: 'form__check' }, inteira, 'Quero o espaço só para o meu grupo'),
    warn,
    areas,
    h('div', { class: 'form__row' },
      field('Seu nome', input('text', 'nome', '', { autocomplete: 'name', maxlength: '80', required: true }), 'r-nome'),
      field('WhatsApp', input('tel', 'telefone', '', { autocomplete: 'tel', inputmode: 'tel', placeholder: '(11) 9…', maxlength: '20', required: true }), 'r-tel')),
    field('Observações', h('textarea', { class: 'name-input', name: 'obs', rows: '2', maxlength: '240', placeholder: 'Ex.: bolo próprio, decoração, cadeira para bebê…' }), 'r-obs'),
    h('label', { class: 'form__check' }, h('input', { type: 'checkbox', name: 'consentimento', required: true }), 'Autorizo a Barcenaria a usar meu nome e WhatsApp para falar sobre esta reserva.'),
    error,
    h('button', { class: 'btn btn--block', type: 'submit' }, icon('check'), 'Enviar pedido de reserva'));

  const slot = () => ({ data: form.elements.data.value, inicio: form.elements.inicio.value, fim: form.elements.fim.value, tipo: tipo.value, inteira: inteira.checked });
  const refresh = () => {
    const s = slot();
    const issue = s.data ? openingIssue(s) : null;
    const ready = s.data && s.inicio && s.fim && s.inicio !== s.fim;
    const list = load().reservas;
    let freeCount = 0;
    for (const a of AREAS) {
      const radio = form.querySelector(`input[name="area"][value="${a.id}"]`);
      const card = radio.closest('.area-opt');
      const free = ready && !issue ? !conflicts(list, { ...s, area: a.id, id: null }).length : null;
      radio.disabled = Boolean(issue) || free === false;
      if (radio.disabled) radio.checked = false;
      card.classList.toggle('is-busy', free === false);
      card.classList.toggle('is-free', free === true);
      card.querySelector('.area-opt__status').textContent = issue ? 'Casa fechada' : free == null ? 'Escolha data e horário' : free ? 'Livre nesse horário' : 'Indisponível nesse horário';
      if (free) freeCount += 1;
    }
    const full = ready && !issue && freeCount === 0
      ? `Nenhum espaço livre nesse horário${s.inteira ? ' para uso exclusivo. Tente outro horário ou desmarque "só para o meu grupo" para pedir mesa.' : '. Tente outro horário ou outro dia.'}`
      : null;
    const note = issue ?? full;
    warn.replaceChildren(...(note ? [icon('alert'), note] : []));
    warn.hidden = !note;
    error.hidden = true;
  };
  tipo.addEventListener('change', () => { inteira.checked = TIPOS[tipo.value].inteira; });
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const s = slot();
    const d = Object.fromEntries(new FormData(form));
    const telefone = (d.telefone ?? '').trim();
    const missing = [!s.data && 'data', !s.inicio && 'chegada', !s.fim && 'saída', !d.area && 'espaço', !d.nome?.trim() && 'nome', telefone.replace(/\D/g, '').length < 10 && 'WhatsApp com DDD', !(Number(d.pessoas) >= 1) && 'pessoas'].filter(Boolean);
    if (missing.length) { showError(error, `Preencha: ${missing.join(', ')}.`); return; }
    if (!d.consentimento) { showError(error, 'Para enviar, autorize o contato sobre a reserva.'); return; }
    const issue = openingIssue(s);
    if (issue) { showError(error, issue); return; }
    if (s.inicio === s.fim) { showError(error, 'O horário de saída precisa ser diferente da chegada.'); return; }
    const state = load();
    if (conflicts(state.reservas, { ...s, area: d.area, id: null }).length) { refresh(); showError(error, `Alguém acabou de reservar ${naArea(d.area)} nesse horário. Escolha outro espaço ou horário.`); return; }
    const r = {
      id: `R${Date.now().toString(36)}`, ...s, area: d.area, nome: d.nome.trim(), telefone, pessoas: Number(d.pessoas),
      obs: (d.obs ?? '').trim(), status: 'pre', origem: 'site', registradoPor: 'Site (cliente)', criado: Date.now(),
    };
    state.reservas.push(r);
    save(state);
    renderDone(r);
  });

  $('#area-pedido').replaceChildren(h('h2', { class: 'ask__title', text: 'Seu pedido' }), form);
  refresh();
}

function renderDone(r) {
  const whats = casa?.contato?.whatsapp_link;
  $('#area-pedido').replaceChildren(
    h('div', { class: 'ask__done' },
      h('p', { class: 'ask__done-icon', 'aria-hidden': 'true' }, icon('check')),
      h('h2', { class: 'ask__title', tabindex: '-1', id: 'pedido-ok', text: 'Pedido enviado!' }),
      h('p', { text: `${TIPOS[r.tipo].nome} para ${r.pessoas} ${r.pessoas === 1 ? 'pessoa' : 'pessoas'} em ${fmtDay(r.data, { weekday: 'long', day: 'numeric', month: 'long' })}, das ${r.inicio} às ${r.fim}, ${naArea(r.area)}${r.inteira ? ' (espaço só para o seu grupo)' : ''}.` }),
      h('p', { class: 'ask__muted', text: `A equipe da Barcenaria confirma pelo WhatsApp ${r.telefone}. Até lá, o pedido fica como pré-reserva.` }),
      h('div', { class: 'ask__actions' },
        whats && h('a', { class: 'btn', href: whats, target: '_blank', rel: 'noopener' }, icon('whatsapp'), 'Falar com a casa'),
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: renderForm }, 'Fazer outro pedido')),
      h('p', { class: 'ask__muted' }, 'Demo: veja como a equipe recebe o pedido no ', h('a', { href: '/painel', target: '_blank', rel: 'noopener', text: 'painel da casa' }), '.')));
  $('#pedido-ok').focus();
}

casa = await getJSON('casa').catch(() => null);
renderForm();
