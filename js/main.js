document.documentElement.classList.add('js');

// Kampagnen-Parameter aus Google Ads: ?ort=koeln&leistung=bueroreinigung passt Überschrift und Formular an
const campaign = new URLSearchParams(window.location.search);
const norm = (value) => (value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/[^a-z]/g, '');
const ORTE = ['Düsseldorf', 'Neuss', 'Ratingen', 'Meerbusch', 'Duisburg', 'Essen', 'Krefeld', 'Mönchengladbach', 'Wuppertal', 'Leverkusen', 'Köln', 'Hilden'];
const LEISTUNGEN = {
  buero: 'Büroreinigung', praxis: 'Praxisreinigung', industrie: 'Industriereinigung',
  unterhalt: 'Unterhaltsreinigung', treppenhaus: 'Treppenhausreinigung', glas: 'Glasreinigung',
};
const LEISTUNG_FORMULAR = { treppenhaus: 'Unterhaltsreinigung' };
const ort = ORTE.find((name) => norm(name) === norm(campaign.get('ort')));
const leistungKey = Object.keys(LEISTUNGEN).find((key) => norm(campaign.get('leistung')).startsWith(norm(key)));
const leistung = leistungKey ? LEISTUNGEN[leistungKey] : null;

if (ort || leistung) {
  const h1 = document.querySelector('.hero h1');
  h1.firstChild.textContent = (leistung || 'Reinigungsfirma') + ' in ' + (ort || 'Düsseldorf');
  document.title = (leistung || 'Reinigungsfirma') + ' ' + (ort || 'Düsseldorf') + ' – zum Festpreis | Nordklar';
  if (ort) {
    document.querySelectorAll('[data-ort]').forEach((el) => { el.textContent = ort; });
    document.querySelectorAll('[data-ort-region]').forEach((el) => { el.textContent = ort + ' & Umgebung'; });
  }
  if (leistung) {
    document.querySelectorAll('[data-leistung-liste]').forEach((el) => { el.textContent = leistung; });
    const value = LEISTUNG_FORMULAR[leistungKey] || leistung;
    document.querySelectorAll('input[name="leistung"]').forEach((input) => { input.checked = input.value === value; });
    document.querySelectorAll('select[name="leistung"]').forEach((select) => {
      [...select.options].forEach((option) => { option.selected = option.textContent === value; });
    });
  }
}

// Klick-ID und UTM-Werte in jedes Formular übernehmen (für die Zuordnung der Anfrage zur Anzeige)
['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
  const value = campaign.get(key);
  if (!value) return;
  document.querySelectorAll('form').forEach((form) => {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = key; input.value = value.slice(0, 200);
    form.append(input);
  });
});

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

// Anfrageformular in drei Schritten (Hero)
const lead = document.querySelector('.js-lead');
if (lead) {
  const steps = [...lead.querySelectorAll('.lead__step')];
  const bar = lead.querySelector('.lead__bar span');
  const count = lead.querySelector('.lead__count');
  const msg = lead.querySelector('.form__msg');
  let current = 0;

  const show = (index) => {
    current = index;
    steps.forEach((step, n) => { step.hidden = n !== index; });
    bar.style.transform = 'scaleX(' + (index + 1) / steps.length + ')';
    count.textContent = 'Schritt ' + (index + 1) + ' von ' + steps.length;
    msg.textContent = '';
  };

  const stepValid = (step) => {
    let valid = true;
    const groups = new Set();
    step.querySelectorAll('[required]').forEach((field) => {
      if (field.type === 'radio') { groups.add(field.name); return; }
      const ok = field.checkValidity();
      field.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    groups.forEach((name) => { if (!lead.querySelector('input[name="' + name + '"]:checked')) valid = false; });
    msg.classList.toggle('is-error', !valid);
    msg.textContent = valid ? '' : 'Bitte ergänzen Sie die fehlenden Angaben.';
    return valid;
  };

  const next = () => {
    if (!stepValid(steps[current])) return;
    track('anfrage_schritt', { schritt: current + 1 });
    show(current + 1);
    const field = steps[current].querySelector('input:not([type="radio"])');
    if (field && window.matchMedia('(min-width: 1021px)').matches) field.focus({ preventScroll: true });
  };

  // Kommt die Leistung schon aus der Anzeige, startet das Formular bei Schritt 2
  show(lead.querySelector('input[name="leistung"]:checked') ? 1 : 0);

  // Schritt 1: Auswahl führt direkt weiter
  steps[0].addEventListener('change', () => setTimeout(next, 260));
  lead.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) next();
    if (e.target.closest('[data-back]')) show(current - 1);
  });

  lead.addEventListener('submit', (e) => {
    e.preventDefault();
    if (current < steps.length - 1) { next(); return; }
    if (!stepValid(steps[current])) return;
    track('angebot_anfrage', { formular: lead.dataset.form, leistung: lead.elements.leistung.value, flaeche: lead.elements.flaeche.value });
    const firstName = lead.elements.name.value.trim().split(/\s+/)[0];
    lead.querySelector('[data-lead-name]').textContent = firstName ? ', ' + firstName : '';
    steps.forEach((step) => { step.hidden = true; });
    lead.querySelector('.lead__head').hidden = true;
    lead.querySelector('.lead__done').hidden = false;
    lead.classList.add('is-sent');
  });
}

// Logo-Laufband: Inhalt verdoppeln für eine nahtlose Schleife
document.querySelectorAll('.marquee__track').forEach((trackEl) => {
  if (noMotion) return;
  [...trackEl.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    trackEl.append(clone);
  });
  trackEl.classList.add('is-running');
});

// Schwebender Angebots-Button: nur sichtbar, wenn gerade kein Formular im Bild ist
const floatCta = document.querySelector('.floatcta');
if (floatCta && 'IntersectionObserver' in window) {
  const visible = new Set();
  const fo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target); });
    floatCta.classList.toggle('is-visible', visible.size === 0);
  }, { threshold: 0.05 });
  document.querySelectorAll('.hero, #kontakt, .cta, .footer').forEach((el) => fo.observe(el));
}

// Fehlermarkierung entfernen, sobald das Feld korrigiert wird
document.addEventListener('input', (e) => {
  if (e.target.classList && e.target.classList.contains('is-invalid') && e.target.checkValidity()) e.target.classList.remove('is-invalid');
});
