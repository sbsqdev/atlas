// Vercel serverless function: infer target muscles from a coach's free-text
// note using DeepSeek. The API key is read from the DEEPSEEK_API_KEY
// environment variable — it is NEVER hard-coded or committed. Set it with:
//   vercel env add DEEPSEEK_API_KEY         (or in the Vercel dashboard)
// If the key is missing or DeepSeek is unreachable, the client falls back to a
// local keyword heuristic, so the feature degrades gracefully.

const MUSCLE_IDS = [
  'chest', 'abs', 'obliques', 'lowerBack', 'lats', 'traps', 'shoulders',
  'biceps', 'triceps', 'forearms', 'glutes', 'quads', 'hamstrings',
  'adductors', 'abductors', 'calves',
];

const SYSTEM = `You map a fitness coach's free-text note (any language: Russian, English, Turkish, Kazakh, ...) about which muscles an exercise works onto a fixed set of muscle-group IDs.
Allowed IDs ONLY: ${MUSCLE_IDS.join(', ')}.
Return STRICT JSON: {"primary": string[], "secondary": string[]}.
"primary" = the main working muscles; "secondary" = synergists/stabilisers.
Use ONLY allowed IDs, no duplicates, no prose. If unsure, leave arrays empty.
Note: "бицепс бедра"/"biceps femoris" = hamstrings; "бицепс"(arm) = biceps; "кор"/"core"/"пресс" = abs (+obliques).`;

export default async function handler(req: any, res: any) {
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
    const { name = '', description = '', note = '' } = (req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) as {
      name?: string; description?: string; note?: string;
    };
    const user = `Exercise: ${name}\nDescription: ${description}\nCoach note (which muscles work): ${note}`;

    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!r.ok) {
      res.status(502).json({ error: 'deepseek_error', status: r.status });
      return;
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const valid = new Set(MUSCLE_IDS);
    const clean = (a: unknown) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string' && valid.has(x)) : []);
    const primary = clean(parsed.primary);
    const secondary = clean(parsed.secondary).filter((m: string) => !primary.includes(m));
    res.status(200).json({ primary, secondary });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
}
