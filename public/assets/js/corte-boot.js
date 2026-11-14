// The opening ident (assets/css/corte.css; docs/cena-serrote.md). Classic script in <head>: it decides before
// the first paint whether the ident plays, so the page never flashes ahead of it. The first beat is CSS only;
// vidro.js may add the second one (the sign in glass).
// It does not play with reduced motion, on a deep link (#secao) or when the visitor comes back with back/forward.
// Any touch, wheel or key dismisses it at once.
(function () {
  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash || (nav && nav.type === 'back_forward')) return;
  var root = document.documentElement;
  var events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  // Two ways out, two classes (corte.css): "corte-fim" when the ident ran to its end — the layer leaves and the
  // title of the page finishes its entrance; "corte-pula" when the visitor dismissed it — the title shows at once.
  var leave = function (cls) {
    root.classList.add(cls);
    events.forEach(function (ev) { removeEventListener(ev, skip); });
  };
  var skip = function () { leave('corte-pula'); };
  var end = function () { leave('corte-fim'); };
  root.classList.add('corte-on');
  events.forEach(function (ev) { addEventListener(ev, skip, { passive: true }); });
  // the first beat is over by 2.9 s. vidro.js, when it adds the glass beat, cancels this timer and ends the
  // ident itself (acabar).
  window.__corte = { pula: skip, acabar: end, fim: setTimeout(end, 2900) };
})();
