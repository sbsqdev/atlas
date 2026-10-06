// Vercel serverless function: send ONE habit-reminder e-mail via Resend.
//
// The app is client-side (no server database), so the BROWSER is the
// scheduler: when a habit is due and the student opted into e-mail reminders,
// the client POSTs here and we deliver the message. This means e-mail is sent
// while the app tab is open (same reach as browser notifications), plus it
// lands in the inbox.
//
// To also deliver reminders when the app is CLOSED you need a small backend
// (a database of {email, habit, time} + a Vercel Cron that reads it). That is
// the "real backend" upgrade — see README. This function is forward-compatible
// with that: the cron would call the very same Resend send.
//
// Config (never commit secrets — set in Vercel):
//   vercel env add RESEND_API_KEY
//   vercel env add REMINDER_FROM     e.g. "Human Atlas <reminders@yourdomain>"
// If the key is missing, we return 503 and the client just relies on the
// browser notification instead.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const key = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM || 'Human Atlas <onboarding@resend.dev>';
  if (!key) {
    res.status(503).json({ error: 'no_key' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const to: string = (body.to || '').trim();
    const title: string = (body.title || 'привычка').toString().slice(0, 120);
    const time: string = (body.time || '').toString().slice(0, 10);
    const line: string = (body.line || '').toString().slice(0, 300);
    if (!/.+@.+\..+/.test(to)) {
      res.status(400).json({ error: 'bad_email' });
      return;
    }

    const subject = `⏰ Напоминание: ${title}${time ? ` · ${time}` : ''}`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="margin:0 0 8px">⏰ ${escapeHtml(title)}</h2>
        ${time ? `<p style="color:#5e8a73;margin:0 0 12px"><b>${escapeHtml(time)}</b> — самое время.</p>` : ''}
        ${line ? `<p style="margin:0 0 12px">${escapeHtml(line)}</p>` : ''}
        <p style="margin:0 0 16px">Начни с малого — не разрывай цепочку 🔥</p>
        <p style="color:#888;font-size:12px">Вы получаете это письмо, потому что включили напоминания о привычках в Human Atlas. Отключить можно в приложении → Достижения → Напоминания на e-mail.</p>
      </div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: 'send_failed', detail: text.slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'server_error', detail: String(e).slice(0, 200) });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
