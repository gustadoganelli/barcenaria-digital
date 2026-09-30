// Apply the saved/system theme before first paint (no flash).
(function () {
  var t;
  try { t = localStorage.getItem('barcenaria:tema'); } catch (e) {}
  // Default is the "papel" look of the printed menu; dark only when the phone is in dark mode.
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === 'dark' ? '#0b1207' : '#f9f2e1';
})();
