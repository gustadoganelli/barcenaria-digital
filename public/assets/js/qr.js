// QR sheet generator: one code per table, 4 A6 cards per A4 page.
import qrcode from '/assets/vendor/qrcode.js';

const $ = (s) => document.querySelector(s);
const SVG_NS = 'http://www.w3.org/2000/svg';
$('#base').value = `${location.origin}/cardapio`;

// Draws the QR as a single SVG path (crisp at any print size).
function qrSvg(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  const svg = document.createElementNS(SVG_NS, 'svg');
  // 4-module quiet zone (ISO/IEC 18004) drawn inside the light box.
  svg.setAttribute('viewBox', `-4 -4 ${n + 8} ${n + 8}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `QR code para ${text}`);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#14180b');
  svg.append(path);
  return svg;
}

function tent(url, mesa) {
  const el = document.createElement('div');
  el.className = 'tent';
  const add = (tag, cls, text) => { const x = document.createElement(tag); x.className = cls; if (text) x.textContent = text; el.append(x); return x; };
  const logo = add('img', 'tent__logo');
  logo.src = '/images/brand/logo-placa-320.webp';
  logo.alt = 'Barcenaria Bar e Restaurante';
  add('p', 'tent__kicker', 'Cardápio digital');
  add('p', 'tent__title', 'Aponte a câmera');
  add('div', 'tent__qr').append(qrSvg(url));
  add('p', 'tent__hint', 'Pratos, drinks, vinhos e a promoção do dia.');
  if (mesa) add('p', 'tent__mesa', `Mesa ${mesa}`);
  add('p', 'tent__insta', '@barcenariaoficial');
  return el;
}

function tableUrl(base, mesa) {
  const u = new URL(base);
  if (mesa) u.searchParams.set('mesa', mesa);
  return u.href;
}
const clamp = (v, fallback) => Math.min(999, Math.max(1, Math.trunc(Number(v)) || fallback));

function render() {
  const base = $('#base').value.trim() || `${location.origin}/cardapio`;
  const semMesa = $('#sem-mesa').checked;
  const de = clamp($('#de').value, 1);
  const ate = Math.min(Math.max(de, clamp($('#ate').value, de)), de + 99);
  let urls;
  try {
    urls = semMesa ? [1, 2, 3, 4].map(() => [tableUrl(base), null])
      : Array.from({ length: ate - de + 1 }, (_, i) => [tableUrl(base, de + i), de + i]);
  } catch {
    $('#folhas').replaceChildren();
    $('#resumo').textContent = 'Informe o endereço completo do cardápio, começando com https://';
    return;
  }
  const sheets = [];
  for (let i = 0; i < urls.length; i += 4) {
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    urls.slice(i, i + 4).forEach(([u, m]) => sheet.append(tent(u, m)));
    sheets.push(sheet);
  }
  $('#folhas').replaceChildren(...sheets);
  document.body.classList.toggle('ink', $('#economia').checked);
  $('#resumo').textContent = semMesa
    ? '4 displays sem número de mesa (1 folha A4).'
    : `${urls.length} display${urls.length > 1 ? 's' : ''}, mesas ${de} a ${ate} (${sheets.length} folha${sheets.length > 1 ? 's' : ''} A4).`;
  $('#de').disabled = $('#ate').disabled = semMesa;
}

$('#qr-form').addEventListener('input', render);
$('#imprimir').addEventListener('click', () => window.print());
render();
