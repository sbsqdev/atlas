import type { MuscleId } from '../types';
import { MUSCLES } from '../data/muscles';

export interface Inferred {
  primary: MuscleId[];
  secondary: MuscleId[];
  source: 'deepseek' | 'local';
}

const VALID = new Set<MuscleId>(MUSCLES.map((m) => m.id));

// Keyword fallback (RU / EN / TR / Latin). Order: compound phrases first so
// "бицепс бедра" / "biceps femoris" resolve to hamstrings, not biceps.
const KEYWORDS: [MuscleId, string[]][] = [
  ['hamstrings', ['бицепс бедра', 'biceps femoris', 'hamstring', 'arka bacak', 'semitend', 'semimembran', 'задней поверхности бедра', 'задняя поверхность бедра']],
  ['glutes', ['ягодич', 'glute', 'gluteus', 'kalça', 'ягодиц', 'попа']],
  ['quads', ['квадрицепс', 'quadriceps', 'quad', 'ön bacak', 'vastus', 'rectus femoris', 'передняя поверхность бедра', 'передней поверхности бедра']],
  ['adductors', ['приводящ', 'adductor', 'iç bacak', 'gracilis', 'pectineus', 'внутренняя поверхность бедра']],
  ['abductors', ['отводящ', 'abductor', 'dış kalça', 'средняя ягодичная', 'gluteus medius', 'tensor fasciae', 'отведение бедра']],
  ['calves', ['икронож', 'calf', 'calves', 'baldır', 'gastrocn', 'soleus', 'голен']],
  ['chest', ['груд', 'chest', 'göğüs', 'pectoral', 'грудные']],
  ['obliques', ['косые', 'oblique', 'yan karın', 'косых']],
  ['abs', ['пресс', 'кор', 'core', ' abs', 'karın', 'abdom', 'rectus abdom', 'мышцы кора', 'живот']],
  ['lowerBack', ['поясниц', 'разгибатели спины', 'lower back', 'bel', 'erector', 'quadratus lumborum', 'гиперэкстенз']],
  ['lats', ['широчайш', 'latissimus', ' lat', 'lats', 'sırt', 'спина', 'спины']],
  ['traps', ['трапец', 'trapez', 'trap', 'rhomboid', 'ромбовид']],
  ['shoulders', ['дельт', 'deltoid', 'omuz', 'плеч', 'shoulder', 'delts']],
  ['triceps', ['трицепс', 'triceps', 'arka kol', 'трёхглав', 'трехглав']],
  ['biceps', ['biceps brachii', 'pazı', 'бицепс рук', 'двуглавая плеча', 'сгибатели плеча']],
  ['forearms', ['предплеч', 'forearm', 'ön kol', 'brachioradialis', 'запяст']],
];

/** Offline heuristic: scan text for muscle keywords. */
export function inferLocal(text: string): Inferred {
  const t = ` ${text.toLowerCase()} `;
  const primary: MuscleId[] = [];
  for (const [id, kws] of KEYWORDS) {
    if (kws.some((k) => t.includes(k))) primary.push(id);
  }
  return { primary, secondary: [], source: 'local' };
}

function sanitize(arr: unknown): MuscleId[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x): x is MuscleId => typeof x === 'string' && VALID.has(x as MuscleId));
}

/**
 * Infer target muscles from the coach's free-text note (+ exercise name/desc).
 * Calls the DeepSeek-backed serverless endpoint; falls back to the local
 * keyword heuristic when the endpoint is unavailable (e.g. local demo, no key).
 */
export async function inferMuscles(input: { name?: string; description?: string; note: string }): Promise<Inferred> {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/infer-muscles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await res.json();
      const primary = sanitize(data.primary);
      const secondary = sanitize(data.secondary).filter((m) => !primary.includes(m));
      if (primary.length || secondary.length) return { primary, secondary, source: 'deepseek' };
    }
  } catch {
    /* fall through to local */
  }
  const text = [input.note, input.name, input.description].filter(Boolean).join('. ');
  return inferLocal(text);
}
