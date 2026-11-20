/* Recreates the live site's small interactions without Next.js:
   scroll reveals, sticky header state, mobile menu, and the two surprise cards. */
(function () {
  var SITE = 'https://www.wearetribus.com';
  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Scroll reveals (same timing as the original: 0.6s, ease [.16,1,.3,1], -80px margin, once) */
  var items = document.querySelectorAll('[data-reveal]');
  function show(el) {
    var d = reduce ? 0 : parseFloat(el.getAttribute('data-delay') || '0');
    var dur = reduce ? 0 : 0.6;
    el.style.transition = 'opacity ' + dur + 's ' + EASE + ' ' + d + 's, transform ' + dur + 's ' + EASE + ' ' + d + 's';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '-80px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(show);
  }

  /* 2. Header: gains a blurred background once you scroll past 12px */
  var header = document.querySelector('body > header');
  var logoLink = header && header.querySelector('a[aria-label]');
  var on = ['border-ink/10', 'bg-paper/80', 'backdrop-blur-xl'], off = ['border-transparent', 'bg-transparent'];
  function onScroll() {
    var s = window.scrollY > 12;
    on.forEach(function (c) { header.classList.toggle(c, s); });
    off.forEach(function (c) { header.classList.toggle(c, !s); });
    logoLink.classList.toggle('py-3', s);
    logoLink.classList.toggle('py-5', !s);
  }
  if (header && logoLink) {
    requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 3. Mobile menu */
  var btn = header && header.querySelector('button[aria-label]');
  var overlay = null, open = false;
  var NAV = [['Work', '/work'], ['Services', '/services'], ['About', '/about'], ['Contact', '/contact']];
  function buildOverlay() {
    var o = document.createElement('div');
    o.className = 'fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-paper px-5 pt-24 md:hidden';
    o.style.opacity = '0';
    o.style.transition = 'opacity .2s ease';
    var nav = document.createElement('nav');
    nav.className = 'flex flex-col gap-2';
    NAV.forEach(function (n, i) {
      var w = document.createElement('div');
      w.style.opacity = '0';
      w.style.transform = 'translateY(16px)';
      w.style.transition = 'opacity .45s ' + EASE + ' ' + (0.05 * i + 0.05) + 's, transform .45s ' + EASE + ' ' + (0.05 * i + 0.05) + 's';
      var a = document.createElement('a');
      a.href = SITE + n[1];
      a.className = 'block border-b border-ink/10 py-4 font-display text-3xl font-medium text-ink';
      a.textContent = n[0];
      w.appendChild(a);
      nav.appendChild(w);
    });
    var cta = document.createElement('a');
    cta.href = SITE + '/contact';
    cta.className = 'mt-6 inline-flex items-center justify-center rounded-full bg-ink px-6 py-4 text-base font-semibold text-paper';
    cta.textContent = 'Start a project';
    nav.appendChild(cta);
    o.appendChild(nav);
    return o;
  }
  function setOpen(v) {
    open = v;
    var bars = btn.querySelectorAll('span.h-0\\.5');
    btn.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    btn.setAttribute('aria-expanded', String(v));
    ['translate-y-2', 'rotate-45'].forEach(function (c) { bars[0].classList.toggle(c, v); });
    bars[1].classList.toggle('opacity-0', v);
    ['-translate-y-2', '-rotate-45'].forEach(function (c) { bars[2].classList.toggle(c, v); });
    document.body.style.overflow = v ? 'hidden' : '';
    if (v) {
      overlay = buildOverlay();
      header.parentNode.insertBefore(overlay, header.nextSibling);
      overlay.getBoundingClientRect();
      overlay.style.opacity = '1';
      overlay.querySelectorAll('nav > div').forEach(function (d) { d.style.opacity = '1'; d.style.transform = 'none'; });
    } else if (overlay) {
      var o = overlay; overlay = null;
      o.style.opacity = '0';
      setTimeout(function () { o.remove(); }, 200);
    }
  }
  if (btn) btn.addEventListener('click', function () { setOpen(!open); });

  /* 4. Tapping Lucia's card opens surprise.html, tapping Dragoș's card opens dragos.html */
  document.querySelectorAll('[data-surprise]').forEach(function (card) {
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    var target = card.getAttribute('data-surprise') === 'dragos' ? 'dragos.html' : 'surprise.html';
    function go() { window.location.href = target; }
    card.addEventListener('click', go);
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
})();
