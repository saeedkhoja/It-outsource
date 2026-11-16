(() => {
  // ================= SOZLAMALAR =================
  const TELEGRAM_URL = 'https://t.me/+998999133822';
  // Arizalar shu manzilga yuboriladi: Sara backend (POST /api/leads) → Telegram bot → guruh.
  // Bo‘sh qolsa: ariza matni nusxalanadi va Telegram chati ochiladi.
  const LEAD_ENDPOINT = 'https://api.saraaa.com/api/leads';
  // Telegram xabari sarlavhasida ko‘rinadigan sayt nomi.
  const SITE_NAME = 'Zingo Tech';
  // Meta (Instagram/Facebook) Pixel ID. Ads Manager → Events Manager'dan oling.
  // Yozilsa: PageView, ariza yuborilganda "Lead", Telegram/qo‘ng‘iroq bosilganda "Contact" yuboriladi.
  const META_PIXEL_ID = '';

  // Boshlang‘ich narxlar (USD). Narx o‘zgarsa — faqat shu yerda yangilang.
  const TYPES = {
    landing: { label: 'Landing', min: 1000, chip: 'Landing sahifa' },
    web: { label: 'Veb-sayt', min: 3000, chip: 'Veb-sayt' },
    mobile: { label: 'Mobil ilova', min: 8000, chip: 'Mobil ilova' },
  };
  const STEPS = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
    12000, 15000, 18000, 20000, 25000, 30000, 40000, 50000];
  // ==============================================

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const money = (n) => `$${fmt(n)}`;
  const monthly = (total, m) => Math.round(total / m);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // ---------- Reklama manbasi (UTM) ----------
  // Instagram reklamasidan kelgan bo‘lsa — qaysi kampaniya/kreativdan kelgani arizaga qo‘shiladi.
  const utm = (() => {
    const p = new URLSearchParams(location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const found = {};
    keys.forEach((k) => p.get(k) && (found[k] = p.get(k).slice(0, 120)));
    if (p.get('fbclid')) found.fbclid = 'bor';
    if (/Instagram/i.test(navigator.userAgent)) found.app = 'Instagram';
    else if (/FBAN|FBAV/i.test(navigator.userAgent)) found.app = 'Facebook';
    if (Object.keys(found).length) store.set('zingo_utm', found);
    return Object.keys(found).length ? found : store.get('zingo_utm') || {};
  })();

  // ---------- Meta Pixel ----------
  const track = (event, params) => window.fbq?.('track', event, params);
  if (META_PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  $$('[data-track]').forEach((a) => a.addEventListener('click', () => track('Contact', { method: a.dataset.track })));

  // ---------- Header: scroll holati va yashirish ----------
  const header = $('#header');
  let lastY = window.scrollY;
  const onHeader = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    header.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', onHeader, { passive: true });
  onHeader();

  // ---------- Mobil menyu ----------
  const burger = $('.burger');
  const menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => !menu.classList.contains('is-open') && (menu.hidden = true), 700);
    }
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true' && setMenu(false));

  // ---------- Hero: aylanuvchi so‘z ----------
  const rot = $('[data-rotator]');
  if (rot && !reduceMotion) {
    const words = $$('em', rot);
    let i = 0;
    setTimeout(function next() {
      const cur = words[i];
      i = (i + 1) % words.length;
      const nxt = words[i];
      cur.classList.remove('is-on');
      cur.classList.add('is-out');
      nxt.classList.remove('is-out');
      nxt.classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-out'), 900);
      setTimeout(next, 2400);
    }, 2600);
  }

  // ---------- Kursor bilan parallaks (orb + kartochkalar) ----------
  if (finePointer && !reduceMotion) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty('--px', `${x * -40}px`);
      hero.style.setProperty('--py', `${y * -40}px`);
    });
  }

  // ---------- Marquee: logolarni ikki baravar qilish ----------
  const mTrack = $('[data-marquee]');
  if (mTrack) mTrack.append(...[...mTrack.children].map((n) => n.cloneNode(true)));

  // ---------- Sarlavhalarni so‘zlarga bo‘lish ----------
  $$('[data-split]').forEach((el) => {
    let w = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(document.createTextNode(' '));
            const outer = document.createElement('span');
            outer.className = 'split-w';
            const inner = document.createElement('span');
            inner.style.setProperty('--w', w++);
            inner.textContent = part;
            outer.append(inner);
            frag.append(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    el.classList.add('is-split');
  });

  // ---------- Scroll paytida paydo bo‘lish ----------
  const countUp = (el) => {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from ?? 0);
    if (reduceMotion) return (el.textContent = to);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1400);
      el.textContent = Math.round(from + (to - from) * easeOut(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => (el.textContent = to), 1500);
  };

  const revealEls = $$('[data-reveal], [data-split], [data-word]');
  revealEls.forEach((el) => {
    if (!el.matches('[data-reveal]')) return;
    const sibs = [...el.parentElement.children].filter((c) => c.matches('[data-reveal]'));
    const parentSibs = el.parentElement.parentElement && el.parentElement.tagName === 'LI'
      ? [...el.parentElement.parentElement.children] : null;
    const idx = parentSibs ? parentSibs.indexOf(el.parentElement) : sibs.indexOf(el);
    el.style.setProperty('--d', `${(idx % 4) * 80}ms`);
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    let alive = false;
    const io = new IntersectionObserver((entries) => {
      alive = true;
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        io.unobserve(target);
        target.classList.add('is-in');
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
    setTimeout(() => { if (!alive) revealEls.forEach((el) => el.classList.add('is-in')); }, 1500);
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // Hero statistikasi — sahifa ochilganda sanaladi
  setTimeout(() => $$('[data-count]').forEach(countUp), 700);

  // Portfolio maketlari ko‘rinishga kirganda "jonlanadi"
  const fcards = $$('.fcard');
  if ('IntersectionObserver' in window) {
    const lio = new IntersectionObserver((entries) => entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) { target.classList.add('is-live'); lio.unobserve(target); }
    }), { threshold: 0.3 });
    fcards.forEach((c) => lio.observe(c));
  } else fcards.forEach((c) => c.classList.add('is-live'));

  // ---------- Scrollga bog‘liq effektlar (bitta rAF sikl) ----------
  const bands = $$('[data-velo]').map((el) => ({ el, dir: Number(el.dataset.velo), x: 0, w: 0 }));
  bands.forEach((b) => {
    b.el.append(...[...b.el.children].map((n) => n.cloneNode(true)));
    b.w = b.el.scrollWidth / 2;
  });
  window.addEventListener('resize', () => bands.forEach((b) => (b.w = b.el.scrollWidth / 2)));
  const bandsWrap = $('.bands');
  let bandsVisible = false;
  if (bandsWrap && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => (bandsVisible = e.isIntersecting)).observe(bandsWrap);
  }

  const stepsEl = $('[data-steps]');
  const stepsLine = stepsEl && $('.steps__line i', stepsEl);
  let velocity = 0;
  let prevY = window.scrollY;

  function frame() {
    const y = window.scrollY;
    const dy = y - prevY;
    prevY = y;
    velocity += (dy - velocity) * 0.12;
    const vh = window.innerHeight;

    // Kinetik lentalar: scroll tezligiga qarab tezlashadi va yo‘nalish oladi
    if (bandsVisible && !reduceMotion) {
      bands.forEach((b) => {
        const speed = (0.6 + Math.min(Math.abs(velocity) * 0.35, 12)) * (velocity < 0 ? -1 : 1);
        b.x -= speed * b.dir;
        if (b.w) { b.x %= b.w; if (b.x > 0) b.x -= b.w; }
        b.el.style.transform = `translate3d(${b.x}px,0,0)`;
      });
    }

    // Portfolio kartalari: keyingisi ustiga chiqqanda oldingisi kichrayadi
    if (!reduceMotion) {
      fcards.forEach((card, i) => {
        const next = fcards[i + 1];
        if (!next) return;
        const r = next.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (r.top - 100) / (vh * 0.8)));
        card.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
        card.style.setProperty('--b', (1 - p * 0.45).toFixed(3));
      });
    }

    // Jarayon chizig‘i
    if (stepsLine) {
      const r = stepsEl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height + vh * 0.2)));
      stepsLine.style.setProperty('--p', p.toFixed(3));
    }
    requestAnimationFrame(frame);
  }
  fcards.forEach((c, i) => c.style.setProperty('--k', i));
  requestAnimationFrame(frame);

  // ---------- Maxsus kursor va "magnit" tugmalar ----------
  if (finePointer && !reduceMotion) {
    document.documentElement.classList.add('has-cursor');
    const cur = $('.cursor');
    const dot = $('.cursor__dot', cur);
    const ring = $('.cursor__ring', cur);
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      const t = e.target.closest?.('[data-cursor="view"]');
      cur.classList.toggle('is-view', !!t);
      cur.classList.toggle('is-link', !t && !!e.target.closest?.('a, button, summary, input, textarea, [role="radio"]'));
      cur.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    })();

    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => (btn.style.transform = ''));
    });

  }

  // ---------- Kalkulyator ----------
  const state = { type: 'web', budget: TYPES.web.min, months: 6, touched: false };
  const range = $('#budgetRange');
  const out = $('#budgetOut');
  const hint = $('[data-hint]');
  const types = $$('.ctype');
  const segBtns = $$('.seg [data-months]');
  const barsBox = $('[data-bars]');
  const chips = $$('.chip');
  const planLine = $('[data-plan]');
  barsBox.innerHTML = Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
  const bars = $$('i', barsBox);
  range.max = STEPS.length - 1;

  Object.entries(TYPES).forEach(([key, t]) => {
    $$(`[data-price="${key}"]`).forEach((el) => (el.textContent = money(t.min)));
    $$(`[data-price-month="${key}"]`).forEach((el) => (el.textContent = money(monthly(t.min, 12))));
    $$(`.ctype[data-type="${key}"] span`).forEach((el) => (el.textContent = `${money(t.min)} dan`));
  });

  const nearestStep = (v) => STEPS.reduce((best, s, i) => (Math.abs(s - v) < Math.abs(STEPS[best] - v) ? i : best), 0);

  let tweenId = 0;
  let shownMonthly = monthly(state.budget, state.months);
  const monthlyEl = $('[data-monthly]');
  function tweenMonthly(to) {
    const id = ++tweenId;
    const from = shownMonthly;
    if (reduceMotion || from === to) { shownMonthly = to; monthlyEl.textContent = money(to); return; }
    const t0 = performance.now();
    const step = (now) => {
      if (id !== tweenId) return;
      const p = Math.min(1, (now - t0) / 500);
      shownMonthly = Math.round(from + (to - from) * easeOut(p));
      monthlyEl.textContent = money(shownMonthly);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { if (id === tweenId) { shownMonthly = to; monthlyEl.textContent = money(to); } }, 600);
  }

  function render() {
    const { budget, months } = state;
    const type = TYPES[state.type];
    range.value = nearestStep(budget);
    range.style.setProperty('--p', `${(range.value / range.max) * 100}%`);
    out.textContent = money(budget);
    types.forEach((b) => { const on = b.dataset.type === state.type; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    segBtns.forEach((b) => { const on = Number(b.dataset.months) === months; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    bars.forEach((b, i) => b.classList.toggle('on', i < months));
    $('[data-total]').textContent = money(budget);
    tweenMonthly(monthly(budget, months));
    const low = budget < type.min;
    hint.classList.toggle('is-low', low);
    hint.textContent = low
      ? `${type.label} ${money(type.min)} dan boshlanadi — byudjetingizga mosini birga ko‘ramiz.`
      : `${type.label} — ${money(type.min)} dan. Aniq narxni loyihangizni ko‘rib, bepul aytamiz.`;
    if (state.touched) {
      planLine.hidden = false;
      planLine.textContent = `Hisob: ${type.label} · ${money(budget)} · ${months} oy (oyiga ${money(monthly(budget, months))}, ustama $0)`;
    }
  }

  const touch = () => (state.touched = true);
  function setType(key) {
    state.type = key; state.budget = TYPES[key].min; touch(); render();
  }
  range.addEventListener('input', () => { state.budget = STEPS[Number(range.value)]; touch(); render(); });

  function radioGroup(items, pick) {
    items.forEach((btn) => btn.addEventListener('click', () => pick(btn)));
    items[0].parentElement.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const idx = items.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      const next = items[(idx + step + items.length) % items.length];
      pick(next); next.focus();
    });
  }
  radioGroup(types, (b) => setType(b.dataset.type));
  radioGroup(segBtns, (b) => { state.months = Number(b.dataset.months); touch(); render(); });

  const pressChip = (value) => chips.forEach((c) => c.dataset.value === value && c.setAttribute('aria-pressed', 'true'));
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => setType(a.dataset.pick)));
  $$('[data-chip]').forEach((a) => a.addEventListener('click', () => pressChip(a.dataset.chip)));
  $('[data-calc-cta]').addEventListener('click', () => { touch(); pressChip(TYPES[state.type].chip); render(); });
  chips.forEach((c) => c.addEventListener('click', () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true')));

  // ---------- Telefon maskasi: +998 90 123 45 67 ----------
  function formatPhone(el, e) {
    let d = el.value.replace(/\D/g, '');
    if (!d.startsWith('998')) d = (e?.inputType === 'deleteContentBackward' && '998'.startsWith(d)) ? '998' : `998${d}`;
    d = d.slice(0, 12);
    const parts = [d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
    el.value = `+998${parts.length ? ' ' + parts.join(' ') : ''}`;
  }
  const phoneDigits = (v) => v.replace(/\D/g, '');
  const validPhone = (v) => { const d = phoneDigits(v); return d.length === 12 && d.startsWith('998'); };

  // ---------- Ariza formasi ----------
  const form = $('#leadForm');
  const fName = $('#fName');
  const fPhone = $('#fPhone');
  const fNote = $('#fNote');
  const submitBtn = $('#fSubmit');
  const submitLabel = $('span', submitBtn);
  const status = $('#fStatus');
  const statusText = status.textContent;

  fPhone.addEventListener('focus', () => { if (!fPhone.value) fPhone.value = '+998 '; });
  fPhone.addEventListener('blur', () => { if (fPhone.value.trim() === '+998') fPhone.value = ''; });
  fPhone.addEventListener('input', (e) => { formatPhone(fPhone, e); fPhone.closest('.field').classList.remove('is-error'); });
  fName.addEventListener('input', () => fName.closest('.field').classList.remove('is-error'));

  const check = (el, ok) => { el.closest('.field').classList.toggle('is-error', !ok); el.setAttribute('aria-invalid', String(!ok)); return ok; };

  function toText(d) {
    return [
      'Yangi ariza — Zingo',
      d.name && `Ism: ${d.name}`,
      `Telefon: ${d.phone}`,
      `Xizmat: ${d.services.length ? d.services.join(', ') : '—'}`,
      d.budget && `Hisob: ${money(d.budget)} · ${d.months} oy (oyiga ${money(d.monthly)})`,
      d.note && `Izoh: ${d.note}`,
    ].filter(Boolean).join('\n');
  }

  async function sendLead(d) {
    if (!LEAD_ENDPOINT) {
      navigator.clipboard?.writeText(toText(d)).catch(() => {});
      window.open(TELEGRAM_URL, '_blank', 'noopener');
      return 'telegram';
    }
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(d),
    });
    if (!res.ok) throw Object.assign(new Error(String(res.status)), { status: res.status });
    return 'sent';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const okName = check(fName, fName.value.trim().length >= 2);
    const okPhone = check(fPhone, validPhone(fPhone.value));
    if (!(okName && okPhone)) { $('[aria-invalid="true"]', form).focus(); return; }

    const data = {
      site: SITE_NAME,
      source: 'Ariza formasi',
      website: form.elements.website?.value || '', // honeypot: odamlar ko‘rmaydi, botlar to‘ldiradi
      name: fName.value.trim(),
      phone: fPhone.value.trim(),
      services: chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.value),
      note: fNote.value.trim(),
      ...(state.touched ? { budget: state.budget, months: state.months, monthly: monthly(state.budget, state.months) } : {}),
      utm,
    };

    submitBtn.disabled = true;
    submitLabel.textContent = 'Yuborilmoqda…';
    status.classList.remove('is-error');
    status.textContent = statusText;
    try {
      const how = await sendLead(data);
      track('Lead', { content_name: data.services.join(', ') || 'Ariza' });
      const ok = $('.form__ok', form);
      $('[data-ok-text]', ok).textContent = how === 'sent'
        ? 'Arizangiz qabul qilindi. Tez orada qo‘ng‘iroq qilib, narx va to‘lov jadvalini aytamiz.'
        : 'Ariza matni nusxalandi. Ochilgan Telegram chatiga joylab yuboring — tez orada javob beramiz.';
      ok.hidden = false;
    } catch (err) {
      status.classList.add('is-error');
      status.textContent = err?.status === 429
        ? 'Juda ko‘p urinish. Bir daqiqadan keyin qayta yuboring yoki qo‘ng‘iroq qiling: +998 99 913 38 22'
        : 'Yuborib bo‘lmadi. Telegramga yozing yoki qo‘ng‘iroq qiling: +998 99 913 38 22';
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = 'Bepul narx olish';
    }
  });

  // ---------- Mobil pastki tugma ----------
  const sticky = $('[data-sticky]');
  const heroCta = $('.hero__cta');
  const contact = $('#ariza');
  if ('IntersectionObserver' in window) {
    let pastHero = false, atContact = false;
    const upd = () => sticky.classList.toggle('is-on', pastHero && !atContact);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }).observe(heroCta);
    new IntersectionObserver(([e]) => { atContact = e.isIntersecting; upd(); }, { threshold: 0.15 }).observe(contact);
  }

  $('#year').textContent = new Date().getFullYear();
  render();
})();
