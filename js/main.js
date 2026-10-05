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
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Überschriften in Wörter zerlegen (Wort-für-Wort-Animation)
const splitWords = (el) => {
  let index = 0;
  const wrap = (content) => {
    const outer = document.createElement('span');
    outer.className = 'w';
    outer.style.setProperty('--w', index++);
    const inner = document.createElement('span');
    inner.append(content);
    outer.append(inner);
    return outer;
  };
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        frag.append(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(part));
      });
      node.replaceWith(frag);
    } else if (node.nodeName !== 'BR') {
      // Element (z. B. der Punkt im Hero) an das vorherige Wort anhängen
      const prev = node.previousSibling;
      if (prev && prev.classList && prev.classList.contains('w')) prev.firstChild.append(node);
      else node.replaceWith(wrap(node.cloneNode(true)));
    }
  });
  el.classList.add('split');
};

if (!noMotion) {
  document.querySelectorAll('h1, main h2').forEach(splitWords);

  // Listen nacheinander einblenden
  document.querySelectorAll('.area__list, .compare, .checklist, .logos ul, .contact__list, .faq, .plan ul').forEach((list) => {
    list.classList.add('stagger');
    [...list.children].forEach((child, i) => child.style.setProperty('--i', i));
  });
  document.querySelectorAll('.why__list, .plans').forEach((group) => {
    [...group.children].forEach((child, i) => { child.style.transitionDelay = (i * 80) + 'ms'; });
  });

  // Scroll-Fortschritt + Parallax im Hero
  const progress = document.createElement('div');
  progress.className = 'progress';
  document.body.prepend(progress);
  const heroBg = document.querySelector('.hero__bg');
  const mobilebar = document.querySelector('.mobilebar');
  let ticking = false;
  const onFrame = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (heroBg && y < window.innerHeight * 1.2) heroBg.style.translate = '0 ' + (y * 0.14).toFixed(1) + 'px';
    mobilebar.classList.toggle('is-visible', y > 320);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }, { passive: true });
  onFrame();
}

const reveals = document.querySelectorAll('.reveal, main h2.split, .stagger');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      io.unobserve(el);
      // Nach der Animation aufräumen, damit Hover-Effekte wieder ihre eigenen Übergänge nutzen
      setTimeout(() => {
        el.classList.add('is-done');
        if (el.classList.contains('reveal')) {
          el.classList.remove('reveal');
          el.style.transitionDelay = '';
        }
      }, 2200);
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
