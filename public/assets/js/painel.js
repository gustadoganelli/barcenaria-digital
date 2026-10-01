// House panel (DEMO): tabs for the reservation calendar and the results dashboard.
import { getJSON } from './comanda-store.js';
import { initReservas } from './reservas.js';
import { initResultados } from './resultados.js';

const $ = (s) => document.querySelector(s);

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

const [casa, cardapio] = await Promise.all(['casa', 'cardapio'].map((n) => getJSON(n).catch((err) => { console.warn(`${n}.json indisponível:`, err); return null; })));
initReservas({ toast, casa });
const resultados = initResultados({ casa, cardapio });

const TABS = { reservas: 'Reservas', resultados: 'Resultados' };
function select(name, focus = false) {
  for (const key of Object.keys(TABS)) {
    const on = key === name;
    const tab = $(`#tab-${key}`);
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    $(`#panel-${key}`).hidden = !on;
    if (on && focus) tab.focus();
  }
  $('#titulo').textContent = TABS[name];
  $('#nova-reserva').hidden = name !== 'reservas';
  if (name === 'resultados') resultados.render();
  history.replaceState(null, '', name === 'reservas' ? location.pathname : `#${name}`);
}
for (const key of Object.keys(TABS)) $(`#tab-${key}`).addEventListener('click', () => select(key));
$('.panel__tabs').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const keys = Object.keys(TABS);
  const current = keys.findIndex((k) => $(`#tab-${k}`).getAttribute('aria-selected') === 'true');
  select(keys[(current + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length], true);
});
select(location.hash === '#resultados' ? 'resultados' : 'reservas');
