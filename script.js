// script.js
/* ---------- NAVBAR ELEVATION ---------- */
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- MOBILE NAV ---------- */
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#nav-menu');
if (toggle && menu) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.style.display = open ? 'grid' : '';
    toggle.setAttribute('aria-label', open ? 'Stäng meny' : 'Öppna meny');
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
}

/* ---------- SECTION REVEAL (reduced motion aware) ---------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-visible');
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}
/* ---------- SCROLL TO TOP ---------- */
const toTop = document.querySelector('.to-top');
const toggleTopBtn = () => { toTop.hidden = !(window.scrollY > window.innerHeight * 0.6); };
toggleTopBtn();
window.addEventListener('scroll', toggleTopBtn, { passive: true });
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));

/* ---------- FORM HANDLER (no backend; demo only) ---------- */
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
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- LIVE RATINGS (progressive enhancement) ----------
   Kräver en enkel serverless-funktion på /api/bokadirekt-rating som returnerar:
   { ratingValue: number, reviewCount: number, updatedISO: string }
   Faller tillbaka till statiska värden från HTML om endpointen saknas eller CORS nekar.
*/
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

    // Uppdatera JSON-LD AggregateRating
    const ld = document.getElementById('org-json');
    if (ld?.textContent) {
      const data = JSON.parse(ld.textContent);
      data.aggregateRating = { "@type": "AggregateRating", ratingValue, reviewCount };
      ld.textContent = JSON.stringify(data);
    }
  } catch {
    // Fallback: använd värden i HTML
  }


  
})();