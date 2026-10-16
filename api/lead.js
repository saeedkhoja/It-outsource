// Vercel serverless funksiya: saytdagi arizani Telegram botga yuboradi.
// Vercel → Project → Settings → Environment Variables:
//   TELEGRAM_BOT_TOKEN — @BotFather bergan token
//   TELEGRAM_CHAT_ID   — arizalar keladigan chat/guruh ID
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ ok: false, error: 'not_configured' });

  let d = req.body || {};
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch { d = {}; }
  }

  const clean = (v, max = 300) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  const num = (v) => Math.max(0, Math.round(Number(v) || 0));
  const fmt = (n) => `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;

  const phone = clean(d.phone, 40);
  if (phone.replace(/\D/g, '').length < 9) return res.status(400).json({ ok: false, error: 'phone' });

  const services = Array.isArray(d.services) ? d.services.map((s) => clean(s, 40)).filter(Boolean) : [];
  const text = [
    'Yangi ariza — Zingo',
    `Manba: ${clean(d.source, 40) || 'Sayt'}`,
    d.name && `Ism: ${clean(d.name, 100)}`,
    `Telefon: ${phone}`,
    `Xizmat: ${services.length ? services.join(', ') : '—'}`,
    `Byudjet: ${fmt(num(d.budget))}`,
    `Muddat: ${num(d.months)} oy (oyiga ${fmt(num(d.monthly))})`,
    d.note && `Izoh: ${clean(d.note, 1000)}`,
  ].filter(Boolean).join('\n');

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.status(tg.ok ? 200 : 502).json({ ok: tg.ok });
  } catch {
    return res.status(502).json({ ok: false });
  }
};
