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

/* Portada: vídeo ligero (720p, 8 s). No se carga en móvil, con ahorro de datos, conexión lenta
   o "reducir movimiento": en esos casos se queda el póster. Se pausa al salir de la portada. */
(function () {
  var vA = document.getElementById('hero-vid-a');
  var vB = document.getElementById('hero-vid-b');
  if (!vA || !vB) return;
  var conn = navigator.connection || {};
  var skip = (window.matchMedia && (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 768px)').matches))
    || conn.saveData || /(^|-)(slow-)?2g|3g/.test(conn.effectiveType || '');
  if (skip) { vA.remove(); vB.remove(); return; }

  var NAMES = ['green_field', 'castle_garden', 'construction_site', 'vineyard'];
  var LOW = function (i) { return 'media/' + NAMES[i] + '.mp4'; };
  var HD = function (i) { return 'media/' + NAMES[i] + '-hd.mp4'; };
  var VIDEOS = NAMES;
  var pair = [vA, vB], idx = 0, active = 0, busy = false, fails = 0, inView = true;
  var lastUrl = LOW(0), useHD = false;

  /* Velocidad real (Mbps) con la que se descargó el último vídeo; null si no se puede medir. */
  function measured(url) {
    try {
      var e = performance.getEntriesByType('resource').filter(function (r) { return r.name.indexOf(url) !== -1; }).pop();
      if (!e || !e.transferSize || e.responseEnd <= e.startTime) return null;
      return (e.transferSize * 8) / ((e.responseEnd - e.startTime) / 1000) / 1e6;
    } catch (err) { return null; }
  }
  /* HD (1080p, ~2,5 MB) solo en pantallas grandes y con red claramente rápida. Por defecto, 720p (~0,8 MB). */
  function wantHD() {
    if (window.innerWidth < 1100) return false;
    var m = measured(lastUrl);
    var need = useHD ? 6 : 10;
    if (m !== null) return m >= need;
    return conn.downlink === undefined ? false : conn.downlink >= 10;
  }
  function play(el) { var p = el.play(); if (p && p.catch) p.catch(function () {}); }

  function next() {
    if (busy) return;
    busy = true;
    var n = 1 - active;
    idx = (idx + 1) % VIDEOS.length;
    useHD = wantHD();
    var url = useHD ? HD(idx) : LOW(idx);
    lastUrl = url;
    var el = pair[n];
    var done = false;
    function ok() {
      if (done) return; done = true;
      fails = 0;
      if (inView) play(el);
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
    el.src = url; el.load();
  }

  vA.addEventListener('loadeddata', function () { vA.style.opacity = '1'; }, { once: true });
  vA.addEventListener('error', function () { vA.style.opacity = '0'; });
  vA.addEventListener('ended', next);
  vB.addEventListener('ended', next);
  play(vA);

  function sync() { var v = pair[active]; if (inView && !document.hidden) play(v); else v.pause(); }
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; sync(); }, { threshold: 0.05 })
      .observe(document.querySelector('.hero'));
  }
})();
