// Turns the saw scenes on before the first paint (classic script in <head>, so the hero never flashes ahead of
// the plank). Without JS, or with reduced motion, the class is never set and the page is the plain one.
// If the scene module fails to start, the class is removed so the plank cannot stay in front of the content.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('corte-on');
  setTimeout(function () { if (!window.__corte) root.classList.remove('corte-on'); }, 4000);
})();
