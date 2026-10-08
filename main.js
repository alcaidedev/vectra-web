/* VECTRA — comportamiento compartido: menú móvil, nav activa, reveal, vídeo de portada */
document.documentElement.classList.add('js');

function toggleMenu() {
  var ham = document.querySelector('.ham');
  var menu = document.getElementById('mob-menu');
  var overlay = document.getElementById('mob-overlay');
  var open = !menu.classList.contains('open');
  ham.classList.toggle('open', open);
  menu.classList.toggle('open', open);
  overlay.classList.toggle('open', open);
  ham.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';
}

(function () {
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mob-menu a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === page && href !== 'index.html') a.classList.add('nav-active');
  });
})();

(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('visible'); }); return; }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { obs.observe(el); });
})();

/* Portada: rotación de vídeos con fundido. Respeta "reducir movimiento" y ahorro de datos. */
(function () {
  var vA = document.getElementById('hero-vid-a');
  var vB = document.getElementById('hero-vid-b');
  if (!vA || !vB) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (reduce || saveData) { vA.remove(); vB.remove(); return; }

  var VIDEOS = ['media/green_field.mp4', 'media/castle_garden.mp4', 'media/construction_site.mp4', 'media/vineyard.mp4'];
  var pair = [vA, vB], idx = 0, active = 0, busy = false, fails = 0;
  function play(el) { var p = el.play(); if (p && p.catch) p.catch(function () {}); }

  function next() {
    if (busy) return;
    busy = true;
    var n = 1 - active;
    idx = (idx + 1) % VIDEOS.length;
    var el = pair[n];
    var done = false;
    function ok() {
      if (done) return; done = true;
      fails = 0; play(el);
      el.style.opacity = '1';
      pair[active].style.opacity = '0';
      var prev = active; active = n;
      setTimeout(function () { pair[prev].pause(); busy = false; }, 1000);
    }
    function ko() {
      if (done) return; done = true;
      busy = false; fails++;
      if (fails < VIDEOS.length) next();
    }
    el.addEventListener('canplay', ok, { once: true });
    el.addEventListener('error', ko, { once: true });
    el.src = VIDEOS[idx]; el.load();
  }

  vA.addEventListener('loadeddata', function () { vA.style.opacity = '1'; }, { once: true });
  vA.addEventListener('error', function () { vA.style.opacity = '0'; });
  vA.addEventListener('ended', next);
  vB.addEventListener('ended', next);
  play(vA);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) play(pair[active]); });
})();
