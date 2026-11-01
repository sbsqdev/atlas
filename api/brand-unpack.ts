// Vercel serverless function for FAB3D Brand: rewrites the personal-brand
// report texts with DeepSeek. Requires a paid access code (signed on the
// owner's /issue page) so the endpoint can't be used for free. Nothing is
// stored or logged here. The API key comes from the DEEPSEEK_API_KEY
// environment variable — it is NEVER hard-coded or committed. If the key is
// missing or DeepSeek fails, the client keeps the report it built locally.

const PUBLIC_JWK = {
  kty: 'EC', crv: 'P-256',
  x: 'sdxOB4d6QEPYOoqO0jUy847G_ho_eefHMdqs0QbC5Pk',
  y: 'jIG7EadFj4_SWJOMqHsk7qiGFnMgONmXDp9RDOEwtyk',
};

const unb64url = (s: string) => Uint8Array.from(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));

async function validCode(code: string): Promise<boolean> {
  const [payload, sig] = String(code || '').trim().split('.');
  if (!payload || !sig) return false;
  try {
    const key = await crypto.subtle.importKey('jwk', PUBLIC_JWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64url(sig), new TextEncoder().encode(payload));
    if (!ok) return false;
    const p = JSON.parse(Buffer.from(unb64url(payload)).toString('utf8')) as { p: string; u: number };
    return String(p.p).startsWith('brand') && p.u * 86_400_000 > Date.now();
  } catch {
    return false;
  }
}

const SYSTEM = `Ты — продюсер личного бренда, маркетолог и коуч. Пишешь по-русски, живо и конкретно, без воды и канцелярита, без выдуманных фактов и цифр: используй только то, что есть в ответах человека и в черновике.
Опирайся на подходы: развитие сильных сторон (Gallup), Reflected Best Self (Harvard Business Review), Value Proposition Canvas, позиционирование (Ries & Trout, Moore), цели SMART/OKR, кайдзен.
Учитывай сегмент (топ-менеджер, эксперт, предприниматель, студент, подросток) и тон голоса. Для подростков — безопасно и с участием родителей, без советов по рискованной монетизации.
Не обещай гарантированных результатов, не давай медицинских, юридических и финансовых советов.
Верни СТРОГО JSON с полями:
{"superpower": string, "positioning": string (1–2 предложения), "statement": string (формат: Для … которым … я — … который … В отличие от … ),
"offer": {"headline": string, "bullets": string[3-4], "cta": string},
"bios": {"instagram": string (до 150 символов), "linkedin": string (до 220 символов), "telegram": string (до 255 символов)},
"pillars": [{"title": string, "ideas": string[3]}] (4 рубрики),
"contentPlan": string[30] (каждая строка начинается с "День N · "),
"focus": string[5] (куда давить в первую очередь), "avoid": string[4],
"plan90": string[12] (каждая строка начинается с "Неделя N. ")}`;

export default async function handler(req: any, res: any) {
  // GET is a health check for the owner: shows whether the key is set (never the key itself).
  if (req.method === 'GET') {
    res.setHeader('cache-control', 'no-store');
    res.status(200).json({ ai: Boolean(process.env.DEEPSEEK_API_KEY), message: process.env.DEEPSEEK_API_KEY ? 'Ключ DeepSeek подключён' : 'Ключ DeepSeek не найден: добавьте DEEPSEEK_API_KEY в Vercel и сделайте Redeploy' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'no_key' });
    return;
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    if (!(await validCode(body.code))) {
      res.status(403).json({ error: 'no_access' });
      return;
    }
    const answers = JSON.stringify(body.answers ?? {}).slice(0, 12_000);
    const draft = JSON.stringify(body.draft ?? {}).slice(0, 12_000);
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Ответы человека:\n${answers}\n\nЧерновик отчёта (улучши его, сохрани факты):\n${draft}` },
        ],
      }),
    });
    if (!r.ok) {
      res.status(502).json({ error: 'deepseek_error', status: r.status });
      return;
    }
    const data = await r.json();
    let patch: unknown = {};
    try { patch = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}'); } catch { patch = {}; }
    res.setHeader('cache-control', 'no-store');
    res.status(200).json({ patch });
  } catch {
    res.status(500).json({ error: 'server_error' });
  }
}
