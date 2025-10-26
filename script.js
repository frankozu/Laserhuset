// script.js

/* ---------- SETTINGS ---------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const headerHeight = 120; // keep in sync with --nav-h

// --- SAFETY: ensure body is not locked on load/BFCache ---
(function hardUnlock(){
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
})();
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  }
});

/* ---------- HELPERS (must exist before use) ---------- */
const getFocusable = (root) =>
  root ? root.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])') : [];

let lastScrollY = 0;
function lockScroll(){
  lastScrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lastScrollY}px`;
  document.body.style.width = '100%';
}
function unlockScroll(){
  const top = parseInt(String(document.body.style.top || '0'), 10);
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  if (!Number.isNaN(top) && top !== 0) window.scrollTo(0, -top);
}

/* ---------- NAVBAR ELEVATION ---------- */
const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- MOBILE NAV (single source of truth) ---------- */
const toggle = document.querySelector('.nav-toggle');
const menu   = document.querySelector('#nav-menu');
const mql    = window.matchMedia('(min-width: 681px)');

function onKeydown(e){
  if(e.key === 'Escape'){ setOpen(false); }
  if(e.key === 'Tab'){
    const f = [...getFocusable(menu)];
    if(!f.length) return;
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
}

function setOpen(open){
  if(!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Stäng meny' : 'Öppna meny');
  if(open){
    menu.hidden = false;           // CSS hides this only on mobile
    lockScroll();
    (getFocusable(menu)[0] || toggle).focus({ preventScroll:true });
    document.addEventListener('keydown', onKeydown);
  }else{
    menu.hidden = true;
    unlockScroll();
    toggle.focus({ preventScroll:true });
    document.removeEventListener('keydown', onKeydown);
  }
}

if (toggle && menu) {
  // initial state by viewport
  menu.hidden = !mql.matches;      // hidden on mobile, visible on desktop

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!open);
  });

  // close on in-page nav click with header offset
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        setOpen(false);
        setTimeout(() => {
          window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
        }, 30);
      } else {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  });

  // respond to viewport changes
  const onChange = () => {
    if (mql.matches) {
      menu.hidden = false;                     // show on desktop
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Öppna meny');
      unlockScroll();
      document.removeEventListener('keydown', onKeydown);
    } else {
      menu.hidden = true;                      // keep closed by default on mobile
    }
  };
  mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
  onChange();
}

/* ---------- SECTION REVEAL (reduced motion aware) ---------- */
if (!prefersReduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-visible');
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}

/* ---------- SCROLL TO TOP ---------- */
const toTop = document.querySelector('.to-top');
const toggleTopBtn = () => { if (toTop) toTop.hidden = !(window.scrollY > window.innerHeight * 0.6); };
toggleTopBtn();
window.addEventListener('scroll', toggleTopBtn, { passive:true });
toTop?.addEventListener('click', () =>
  window.scrollTo({ top:0, behavior: prefersReduced ? 'auto' : 'smooth' })
);

/* ---------- FORM HANDLER (demo only) ---------- */
const form = document.querySelector('.contact-form');
const statusEl = document.querySelector('.form-status');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const consent = document.querySelector('#consent');
  if (!name || !email || !(consent && consent.checked)) {
    statusEl.textContent = 'Kontrollera att obligatoriska fält är ifyllda och att samtycke är givet.';
    return;
  }
  statusEl.textContent = 'Tack! Vi återkommer snarast.';
  form.reset();
});

/* ---------- YEAR ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- LIVE RATINGS (progressive enhancement) ---------- */
(async () => {
  try {
    const res = await fetch('/api/bokadirekt-rating', { headers: { 'accept': 'application/json' } });
    if (!res.ok) throw new Error('No live rating');
    const { ratingValue, reviewCount, updatedISO } = await res.json();

    const valEl = document.getElementById('ratingValue');
    const cntEl = document.getElementById('ratingCount');
    const upEl  = document.getElementById('ratingUpdated');
    if (valEl && cntEl && upEl) {
      valEl.textContent = String(ratingValue);
      cntEl.textContent = String(reviewCount);
      if (updatedISO) {
        upEl.dateTime = updatedISO;
        const d = new Date(updatedISO);
        upEl.textContent = d.toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    // Update JSON-LD AggregateRating
    const ld = document.getElementById('org-json');
    if (ld?.textContent) {
      const data = JSON.parse(ld.textContent);
      data.aggregateRating = { "@type": "AggregateRating", ratingValue, reviewCount };
      ld.textContent = JSON.stringify(data);
    }
  } catch {
    // Fallback to static HTML values
  }

  // Reveal luxury images once in view
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const ioLux = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-visible');
    }, { rootMargin: '20% 0% -5% 0%', threshold: 0.01 });
    document.querySelectorAll('.lux-img').forEach(el => ioLux.observe(el));
  }
})();
