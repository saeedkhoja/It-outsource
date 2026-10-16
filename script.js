(() => {
  const TELEGRAM_URL = 'https://t.me/+998900378770';
  // Arizalar shu manzilga yuboriladi (Vercel'da api/lead.js → Telegram bot).
  // Bo‘sh qolsa: ariza matni nusxalanadi va Telegram chati ochiladi.
  const LEAD_ENDPOINT = '/api/lead';

  // Boshlang‘ich narxlar (USD). Narx o‘zgarsa — faqat shu yerda yangilang.
  const TYPES = {
    landing: { label: 'Landing', min: 1000, chip: 'Landing sahifa' },
    web: { label: 'Veb-sayt', min: 3000, chip: 'Veb-sayt' },
    mobile: { label: 'Mobil ilova', min: 8000, chip: 'Mobil ilova' },
  };
  // Surgich qadamlari: kichik summalarda mayda, kattalarida yirik qadam.
  const STEPS = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
    12000, 15000, 18000, 20000, 25000, 30000, 40000, 50000];
  const MIN_BUDGET = 100;
  const MAX_BUDGET = 10_000_000;

  const state = { type: 'web', budget: TYPES.web.min, months: 6 };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const money = (n) => `$${fmt(n)}`;
  const parse = (s) => Number(String(s).replace(/\D/g, '')) || 0;
  const monthly = (total, m) => Math.round(total / m);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // requestAnimationFrame asosidagi oddiy tween; yangi tween eskisini to‘xtatadi
  function tween(from, to, duration, onFrame) {
    const id = ++tween.id;
    if (reduceMotion || from === to) return onFrame(to);
    onFrame(from);
    const t0 = performance.now();
    const step = (now) => {
      if (id !== tween.id) return;
      const p = Math.min(1, (now - t0) / duration);
      onFrame(from + (to - from) * easeOut(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    // Kadrlar kelmasa (yashirin tab va h.k.) ham yakuniy qiymat albatta ko‘rsatiladi
    setTimeout(() => id === tween.id && onFrame(to), duration + 100);
  }
  tween.id = 0;

  const budgetInput = $('#budget');
  const formBudget = $('#fBudget');
  const range = $('#budgetRange');
  const hint = $('[data-hint]');
  const types = $$('.type');
  const plans = $$('.plan');
  const segBtns = $$('.seg [data-months]');
  const chips = $$('.chip');

  range.max = STEPS.length - 1;
  plans.forEach((plan) => {
    const n = Number(plan.dataset.months);
    $('[data-bar]', plan).innerHTML = Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join('');
  });

  // Xizmat kartalari va tanlov tugmalaridagi narxlar
  Object.entries(TYPES).forEach(([key, t]) => {
    $$(`[data-price="${key}"]`).forEach((el) => (el.textContent = money(t.min)));
    $$(`[data-price-month="${key}"]`).forEach((el) => (el.textContent = money(monthly(t.min, 12))));
    $$(`.type[data-type="${key}"] span`).forEach((el) => (el.textContent = `${money(t.min)} dan`));
  });

  const nearestStep = (v) =>
    STEPS.reduce((best, s, i) => (Math.abs(s - v) < Math.abs(STEPS[best] - v) ? i : best), 0);

  function render(source, shown) {
    if (shown === undefined) {
      tween.id += 1; // har qanday to‘g‘ridan-to‘g‘ri o‘zgarish ketayotgan animatsiyani to‘xtatadi
      shown = state.budget;
    }
    const { months } = state;
    const budget = Math.round(shown);
    const type = TYPES[state.type];
    if (source !== budgetInput) budgetInput.value = budget ? fmt(budget) : '';
    if (source !== formBudget) formBudget.value = budget ? fmt(budget) : '';
    if (source !== range) range.value = nearestStep(budget);

    const frac = range.value / range.max;
    range.style.setProperty('--p', `calc(12px + (100% - 24px) * ${frac})`);

    types.forEach((btn) => {
      const on = btn.dataset.type === state.type;
      btn.setAttribute('aria-checked', on);
      btn.tabIndex = on ? 0 : -1;
    });
    const low = state.budget < type.min;
    hint.classList.toggle('is-low', low);
    hint.textContent = low
      ? `${type.label} ${money(type.min)} dan boshlanadi — byudjetingizga mosini birga ko‘ramiz.`
      : `${type.label} — ${money(type.min)} dan. Aniq narxni loyihangizni ko‘rib, bepul aytamiz.`;

    plans.forEach((plan) => {
      const m = Number(plan.dataset.months);
      const on = m === months;
      plan.setAttribute('aria-checked', on);
      plan.tabIndex = on ? 0 : -1;
      $('[data-pay]', plan).textContent = money(monthly(budget, m));
    });
    segBtns.forEach((btn) => {
      const on = Number(btn.dataset.months) === months;
      btn.setAttribute('aria-checked', on);
      btn.tabIndex = on ? 0 : -1;
    });
    $('[data-total]').textContent = money(budget);
    $('[data-form-pay]').textContent = money(monthly(budget, months));
  }

  // Summani yozish paytida bo‘sh joy bilan formatlash, kursor joyini saqlab
  function formatInPlace(el) {
    const caret = el.selectionStart ?? el.value.length;
    const digitsRight = el.value.slice(caret).replace(/\D/g, '').length;
    const n = Math.min(parse(el.value), MAX_BUDGET);
    el.value = n ? fmt(n) : '';
    let i = el.value.length;
    for (let d = 0; i > 0 && d < digitsRight; ) {
      i -= 1;
      if (/\d/.test(el.value[i])) d += 1;
    }
    el.setSelectionRange(i, i);
    return n;
  }

  [budgetInput, formBudget].forEach((el) => {
    el.addEventListener('input', () => {
      state.budget = formatInPlace(el);
      el.closest('.field')?.classList.remove('is-error');
      render(el);
    });
    el.addEventListener('blur', () => {
      if (state.budget && state.budget < MIN_BUDGET) state.budget = MIN_BUDGET;
      render();
    });
  });

  range.addEventListener('input', () => {
    state.budget = STEPS[Number(range.value)];
    render(range);
  });

  // Xizmat turi tanlansa — byudjet uning boshlang‘ich narxiga o‘rnatiladi
  // va formadagi mos xizmat belgilanadi.
  function setType(key) {
    const from = state.budget;
    state.type = key;
    state.budget = TYPES[key].min;
    chips.forEach((c) => {
      if (c.dataset.value === TYPES[key].chip) c.setAttribute('aria-pressed', 'true');
    });
    // Summa yangi narxga silliq o‘tadi (raqamlar, surgich va oylik to‘lovlar birga)
    tween(from, state.budget, 550, (v) => render(null, v));
  }

  function setMonths(m) {
    state.months = m;
    render();
  }

  function radioGroup(items, pick) {
    items.forEach((btn) => btn.addEventListener('click', () => pick(btn)));
    items[0].parentElement.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const idx = items.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      const next = items[(idx + step + items.length) % items.length];
      pick(next);
      next.focus();
    });
  }
  radioGroup(types, (btn) => setType(btn.dataset.type));
  radioGroup(plans, (btn) => setMonths(Number(btn.dataset.months)));
  radioGroup(segBtns, (btn) => setMonths(Number(btn.dataset.months)));

  // "Hisoblash" havolalari: kalkulyatorni shu xizmatga o‘rnatadi
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => setType(a.dataset.pick)));

  // Formadagi xizmat tanlash
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');
    })
  );

  // Ariza formasi
  const form = $('#leadForm');
  const fName = $('#fName');
  const fPhone = $('#fPhone');
  const fNote = $('#fNote');
  const submitBtn = $('#fSubmit');
  const status = $('#fStatus');
  const statusText = status.textContent;
  const submitText = submitBtn.textContent;

  [fName, fPhone].forEach((el) =>
    el.addEventListener('input', () => el.closest('.field').classList.remove('is-error'))
  );

  function check(el, valid) {
    el.closest('.field').classList.toggle('is-error', !valid);
    el.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  function toText(d) {
    return [
      'Yangi ariza — Zingo',
      `Manba: ${d.source}`,
      d.name && `Ism: ${d.name}`,
      `Telefon: ${d.phone}`,
      `Xizmat: ${d.services.length ? d.services.join(', ') : '—'}`,
      `Byudjet: ${money(d.budget)}`,
      `Muddat: ${d.months} oy (oyiga ${money(d.monthly)})`,
      d.note && `Izoh: ${d.note}`,
    ].filter(Boolean).join('\n');
  }

  function openTelegram(d) {
    navigator.clipboard?.writeText(toText(d)).catch(() => {});
    window.open(TELEGRAM_URL, '_blank', 'noopener');
  }

  // 'sent' — server qabul qildi, 'telegram' — endpoint yo‘q, Telegram ochildi.
  // Endpoint bo‘lmasa Telegram bosish paytida (await'dan oldin) ochiladi — popup bloklanmaydi.
  async function sendLead(d) {
    if (!LEAD_ENDPOINT) {
      openTelegram(d);
      return 'telegram';
    }
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(d),
    });
    if (!res.ok) throw new Error(String(res.status));
    return 'sent';
  }

  const planData = () => ({
    budget: state.budget,
    months: state.months,
    monthly: monthly(state.budget, state.months),
  });
  const validPhone = (v) => v.replace(/\D/g, '').length >= 9;

  [fPhone, $('#qPhone')].forEach((el) => {
    el.addEventListener('focus', () => {
      if (!el.value) el.value = '+998 ';
    });
    el.addEventListener('blur', () => {
      if (el.value.trim() === '+998') el.value = '';
    });
  });

  // Hero: kalkulyator ostidagi tezkor ariza (faqat telefon)
  const quick = $('#quickForm');
  const qPhone = $('#qPhone');
  const qMsg = $('.quick__msg', quick);
  const qBtn = $('button', quick);

  qPhone.addEventListener('input', () => {
    quick.classList.remove('is-error');
    qMsg.textContent = '';
  });

  quick.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validPhone(qPhone.value)) {
      quick.classList.add('is-error');
      qMsg.textContent = 'Telefon raqamni to‘liq kiriting';
      qPhone.focus();
      return;
    }
    const data = { source: 'Kalkulyator', phone: qPhone.value.trim(), services: [TYPES[state.type].chip], ...planData() };
    qBtn.disabled = true;
    try {
      const how = await sendLead(data);
      quick.classList.add('is-sent');
      qMsg.textContent = how === 'sent'
        ? 'Rahmat! Tez orada qo‘ng‘iroq qilib, narx va to‘lov jadvalini aytamiz.'
        : 'Ariza nusxalandi — ochilgan Telegram chatiga joylab yuboring.';
    } catch {
      quick.classList.add('is-error');
      qMsg.innerHTML = `Yuborib bo‘lmadi. <a href="${TELEGRAM_URL}" target="_blank" rel="noopener">Telegramga yozing</a> yoki qayta urining.`;
    } finally {
      qBtn.disabled = false;
    }
  });

  // Asosiy ariza formasi
  function done(message, showTelegram) {
    const ok = $('.form__ok', form);
    $('[data-ok-text]', ok).textContent = message;
    $('[data-ok-tg]', ok).hidden = !showTelegram;
    ok.hidden = false;
    form.classList.add('is-sent');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const okBudget = check(formBudget, state.budget >= MIN_BUDGET);
    const okName = check(fName, fName.value.trim().length >= 2);
    const okPhone = check(fPhone, validPhone(fPhone.value));
    if (!(okBudget && okName && okPhone)) {
      $('[aria-invalid="true"]', form).focus();
      return;
    }

    const data = {
      source: 'Ariza formasi',
      name: fName.value.trim(),
      phone: fPhone.value.trim(),
      services: chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.value),
      note: fNote.value.trim(),
      ...planData(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Yuborilmoqda…';
    status.classList.remove('is-error');
    status.textContent = statusText;
    try {
      const how = await sendLead(data);
      if (how === 'sent') done('Arizangiz qabul qilindi. Tez orada qo‘ng‘iroq qilib, narx va jadvalni aytamiz.', false);
      else done('Ariza matni nusxalandi. Ochilgan Telegram chatiga joylab yuboring — tez orada javob beramiz.', true);
    } catch {
      status.classList.add('is-error');
      status.textContent = 'Yuborib bo‘lmadi. Telegramga yozing yoki qo‘ng‘iroq qiling: +998 90 037 87 70';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitText;
    }
  });

  // Hero'dagi logolar lentasi: portfolio kartalaridagi logolardan yig‘iladi
  const track = $('[data-marquee]');
  const items = $$('.wcard .wlogo').map((logo) => {
    const item = document.createElement('span');
    item.className = 'marquee__item';
    item.append(logo.cloneNode(true));
    return item;
  });
  track.append(...items, ...items.map((n) => n.cloneNode(true)));

  // Header chegarasi
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Scroll paytida yengil paydo bo‘lish + "Nega Zingo" raqamlarini sanash
  function countUp(el) {
    const from = Number(el.dataset.countFrom);
    const to = Number(el.dataset.countTo);
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1200);
      el.textContent = Math.round(from + (to - from) * easeOut(p)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = from + suffix;
    requestAnimationFrame(step);
    setTimeout(() => (el.textContent = to + suffix), 1300);
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const groups = ['.section__head', '.why__item', '.service', '.wcard', '.contact__text', '#leadForm'];
    const targets = $$(groups.join(','));
    targets.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.matches(groups.join(',')));
      el.style.setProperty('--d', `${(siblings.indexOf(el) % 3) * 90}ms`);
      el.setAttribute('data-reveal', '');
    });
    let ioAlive = false;
    const io = new IntersectionObserver((entries) => {
      ioAlive = true;
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        io.unobserve(target);
        target.classList.add('is-in');
        $$('[data-count-to]', target).forEach(countUp);
        // Paydo bo‘lgach — elementning o‘z hover animatsiyalari ishlashi uchun tozalaymiz
        setTimeout(() => {
          target.removeAttribute('data-reveal');
          target.classList.remove('is-in');
          target.style.removeProperty('--d');
        }, 1100);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
    // Observer umuman javob bermasa — kontent yashirin qolib ketmasin
    setTimeout(() => {
      if (ioAlive) return;
      io.disconnect();
      targets.forEach((el) => el.removeAttribute('data-reveal'));
    }, 1500);
  }

  $('#year').textContent = new Date().getFullYear();
  render();
})();
