(function () {
  var nav = document.querySelector('header.nav');
  var btn = nav && nav.querySelector('.nav-burger');
  var links = nav && nav.querySelector('.nav-links');
  if (!btn || !links) return;
  if (!links.id) links.id = 'nav-links';
  btn.setAttribute('aria-controls', links.id);
  function set(open) {
    nav.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    set(!nav.classList.contains('nav-open'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) { set(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('nav-open') && !nav.contains(e.target)) set(false);
  });
})();
