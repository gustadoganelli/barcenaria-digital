// The opening ident (assets/css/corte.css; docs/cena-serrote.md). Classic script in <head>: it decides before
// the first paint whether the ident plays, so the page never flashes ahead of it. The ident itself is CSS only.
// It does not play with reduced motion, on a deep link (#secao) or when the visitor comes back with back/forward.
// Any touch, wheel or key dismisses it at once.
(function () {
  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash || (nav && nav.type === 'back_forward')) return;
  var root = document.documentElement;
  var events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  var skip = function () {
    root.classList.add('corte-pula');
    events.forEach(function (ev) { removeEventListener(ev, skip); });
  };
  root.classList.add('corte-on');
  events.forEach(function (ev) { addEventListener(ev, skip, { passive: true }); });
  setTimeout(skip, 2900); // the ident is over by then: the layer is taken out and nothing is left listening
})();
