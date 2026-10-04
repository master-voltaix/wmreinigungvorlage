document.documentElement.classList.add('js');

// Header-Schatten beim Scrollen
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobiles Menü
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

// Einblenden beim Scrollen
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

// Kennzahlen hochzählen
const counters = document.querySelectorAll('[data-count]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduceMotion) {
  const co = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      co.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => co.observe(el));
}

// FAQ: immer nur ein Eintrag geöffnet
const faqItems = document.querySelectorAll('.faq details');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((other) => { if (other !== item) other.open = false; });
  });
});

// Conversion-Tracking (Google Ads / GA4 über dataLayer bzw. gtag)
window.dataLayer = window.dataLayer || [];
const track = (event, params = {}) => {
  window.dataLayer.push({ event, ...params });
  if (typeof window.gtag === 'function') window.gtag('event', event, params);
};
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
  if (link) track(link.href.startsWith('tel:') ? 'anruf_klick' : 'email_klick', { link_url: link.href });
});

// Paket-Auswahl ins Kontaktformular übernehmen
document.querySelectorAll('[data-plan]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const field = document.getElementById('kontakt-nachricht');
    if (field && !field.value) field.value = 'Ich interessiere mich für das Paket „' + btn.dataset.plan + '“.';
    track('paket_gewaehlt', { paket: btn.dataset.plan });
  });
});

// Formulare (Vorlage: ohne Backend, nur Validierung + Rückmeldung)
document.querySelectorAll('.js-form').forEach((form) => {
  const msg = form.querySelector('.form__msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const ok = field.type === 'checkbox' ? field.checked : field.checkValidity();
      field.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    msg.classList.toggle('is-error', !valid);
    if (!valid) {
      msg.textContent = 'Bitte füllen Sie alle Pflichtfelder korrekt aus.';
      return;
    }
    track('angebot_anfrage', { formular: form.dataset.form, leistung: form.elements.leistung ? form.elements.leistung.value : '' });
    msg.textContent = 'Vielen Dank! Wir melden uns innerhalb eines Werktages bei Ihnen.';
    form.reset();
  });
});
