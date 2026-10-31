import type { Segment } from './content';

/* Builds the personal-brand report from the answers, entirely in the browser.
   The optional AI pass (api/brand-unpack) only rewrites the texts. */

export type Answers = Record<string, string | string[]>;

export interface Report {
  name: string;
  segment: Segment;
  pointA: string;
  pointB: string;
  kpi: { name: string; now: number; target: number; horizon: number; months: { label: string; value: number }[] };
  leading: string[];
  strengths: string[];
  superpower: string;
  positioning: string;
  statement: string;
  valueProp: { pains: string[]; gains: string[] };
  offer: { headline: string; bullets: string[]; cta: string };
  bios: { instagram: string; linkedin: string; telegram: string };
  pillars: { title: string; ideas: string[] }[];
  contentPlan: string[];
  focus: string[];
  avoid: string[];
  plan90: string[];
  safety: string[];
  ai: boolean;
}

const str = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]).join(', ') : ((a[k] as string) ?? '')).trim();
const list = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);
const num = (a: Answers, k: string) => Number(String(a[k] ?? '').replace(/[^\d.]/g, '')) || 0;
const items = (s: string, n = 5) => s.split(/\n|;|•|(?:,\s(?=[А-ЯA-Z]))/).map((x) => x.replace(/^[-–—\d.)\s]+/, '').trim()).filter((x) => x.length > 2).slice(0, n);
const lower = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const cut = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const first = (s: string) => items(s, 1)[0] ?? s;

const PLATFORM: Record<Segment, string> = {
  exec: 'LinkedIn как основная площадка, Telegram-канал для глубины',
  expert: 'Instagram для доверия и Telegram для прогрева и продаж',
  founder: 'Instagram или LinkedIn (где ваши клиенты) + Telegram-канал компании от первого лица',
  student: 'LinkedIn и портфолио (GitHub, Behance или Notion), Telegram для нетворкинга',
  teen: 'Портфолио-сайт или Notion и одна площадка для творчества (YouTube или TikTok) с закрытыми личными сообщениями',
};

const CTA: Record<Segment, string> = {
  exec: 'Напишите в LinkedIn, если хотите обсудить партнёрство или выступление',
  expert: 'Напишите «разбор» в директ — подберём формат',
  founder: 'Оставьте заявку — покажу, как это работает для вашей задачи',
  student: 'Открыт(а) к стажировкам — напишите в LinkedIn или Telegram',
  teen: 'Портфолио и контакты — по ссылке',
};

export function buildReport(a: Answers): Report {
  const segment = (str(a, 'segment') || 'expert') as Segment;
  const name = str(a, 'name') || 'Вы';
  const role = str(a, 'role');
  const audience = str(a, 'audience') || 'ваша аудитория';
  const result = str(a, 'result') || str(a, 'clientResult');
  const strengths = list(a, 'themes');
  const [s1 = 'Глубокая экспертиза', s2 = 'Коммуникация'] = strengths;
  const pains = items(str(a, 'pains'), 4);
  const proof = items(str(a, 'proof'), 3);
  const topics = str(a, 'topics').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 4);
  const values = list(a, 'values');
  const horizon = parseInt(str(a, 'horizon'), 10) || 6;
  const kNow = num(a, 'kpiNow');
  const kTarget = num(a, 'kpiTarget');
  const hours = str(a, 'hours');
  const followers = num(a, 'followers');
  const posts = hours.startsWith('1') ? 2 : hours.startsWith('3') ? 3 : hours.startsWith('6') ? 5 : 7;

  const months = Array.from({ length: horizon + 1 }, (_, i) => ({ label: i === 0 ? 'Сейчас' : `${i} мес`, value: Math.round(kNow + ((kTarget - kNow) * i) / horizon) }));

  const leading = [
    `${posts} публикации в неделю по контент-плану`,
    segment === 'student' || segment === 'teen' ? '5 новых контактов в неделю: преподаватели, практики, сверстники из индустрии' : '10 целевых диалогов в неделю: комментарии, директ, личные сообщения',
    segment === 'exec' ? '1 выступление, подкаст или колонка в месяц' : '1 история успеха (кейс) в месяц',
    `Еженедельная сверка KPI «${str(a, 'kpiName') || 'главный показатель'}»: план ${months[1]?.value ?? kTarget} к концу первого месяца`,
  ];

  const superpower = `${s1} + ${lower(s2)}`;
  const positioning = `${name === 'Вы' ? '' : `${name} — `}${role || 'эксперт'}. Помогаю: ${lower(audience)} — ${lower(result) || 'получить результат'}, опираясь на ${lower(s1)} и ${lower(s2)}.`;
  const alt = str(a, 'alt') || 'привычные альтернативы';
  const statement = `Для: ${lower(audience)}, которым мешает «${pains[0] ?? 'нехватка времени и ясности'}». Я — ${role || 'специалист'}, который помогает ${lower(result) || 'прийти к результату'}. В отличие от того, что ${lower(alt)}, ${lower(str(a, 'diff')) || 'я работаю через сильные стороны и измеримые шаги'}.`;

  const gains = [result, ...items(str(a, 'clientResult'), 2), ...proof.map((p) => `Доказательство: ${p}`)].filter(Boolean).slice(0, 4);

  const offerFormat = str(a, 'format');
  const offer = {
    headline: `${first(result) || first(str(a, 'clientResult')) || 'Результат'} — ${lower(offerFormat || 'формат работы')}`,
    bullets: [
      str(a, 'clientResult') && `Что получите: ${lower(first(str(a, 'clientResult')))}`,
      proof[0] && `Почему мне можно доверять: ${lower(proof[0])}`,
      str(a, 'guarantee') && `Без риска: ${lower(str(a, 'guarantee'))}`,
      str(a, 'price') && `Стоимость: ${str(a, 'price')}`,
    ].filter(Boolean) as string[],
    cta: CTA[segment],
  };

  const shortResult = cut(first(result) || 'результат', 60);
  const bios = {
    instagram: cut(`${role ? `${cut(role, 40)} · ` : ''}${shortResult}${proof[0] ? ` · ${cut(proof[0], 35)}` : ''} ↓ ${segment === 'teen' ? 'портфолио' : 'запись'}`, 150),
    linkedin: cut(`${role || 'Специалист'} | Помогаю ${lower(cut(audience, 60))}: ${lower(shortResult)}${topics.length ? ` | ${topics.join(' · ')}` : ''}`, 220),
    telegram: cut(`${name === 'Вы' ? '' : `${name}. `}${role}. Пишу про ${topics.length ? topics.join(', ') : 'свою сферу'} — честно и по делу. ${values.length ? `Ценности: ${values.join(', ').toLowerCase()}.` : ''}`, 255),
  };

  const baseTopics = topics.length ? topics : ['Моя экспертиза'];
  const pillars = [
    ...baseTopics.slice(0, 2).map((t) => ({ title: t, ideas: [`Миф и правда о теме «${t}»`, `Пошаговый разбор: ${lower(t)} за 5 шагов`, `Частая ошибка, которую я вижу в теме «${t}»`] })),
    { title: 'Кейсы и доказательства', ideas: [proof[0] ? `История: ${proof[0]}` : 'История клиента или проекта: было → сделали → стало', 'Цифры до и после', 'Отзыв и что за ним стоит'] },
    { title: 'Личное и ценности', ideas: [`Почему для меня важно: ${values[0]?.toLowerCase() ?? 'честность'}`, `Против чего я: ${str(a, 'against') || 'против шаблонных решений'}`, 'Мой путь: точка, с которой я начинал(а)'] },
  ];

  const rubrics = [
    (d: number) => `Экспертный пост: ${pillars[d % 2].ideas[d % 3]}`,
    () => `Личная история: момент, когда вы были на высоте${str(a, 'proud') ? ` («${cut(first(str(a, 'proud')), 50)}»)` : ''}`,
    (d: number) => `Боль аудитории: «${pains[d % Math.max(pains.length, 1)] ?? 'частый вопрос'}» — что с этим делать`,
    () => `Кейс или доказательство: ${proof[0] ?? 'результат клиента или проекта'}`,
    () => 'Закулисье: как выглядит ваш рабочий день или процесс',
    () => `Ответ на вопрос подписчика или мнение о теме «${baseTopics[0]}»`,
    () => `Итоги недели + оффер: ${offer.headline}. ${offer.cta}`,
  ];
  const contentPlan = Array.from({ length: 30 }, (_, i) => `День ${i + 1} · ${rubrics[i % 7](i)}`);

  const focus = [
    `Площадка: ${PLATFORM[segment]}. Одна главная площадка лучше пяти полупустых.`,
    `Формат под сильные стороны: ${/Коммуникация|Обучение|Энергия|Убеждение/.test(strengths.join()) ? 'видео, эфиры и голосовые — вы сильны в живом общении' : /Аналитика|Стратегия|экспертиза/.test(strengths.join()) ? 'длинные тексты, разборы и карусели — вы сильны в структуре и глубине' : /Креатив/.test(strengths.join()) ? 'визуал, reels и нестандартные форматы — ваш креатив заметен' : 'короткие полезные посты и истории'}.`,
    followers < 1000 && segment !== 'teen' ? 'Не гнаться за охватами: 10 целевых диалогов в неделю важнее 1000 случайных подписчиков.' : 'Монетизировать внимание: в каждой седьмой публикации — понятный следующий шаг для человека.',
    proof.length === 0 ? 'Соберите 3 доказательства (кейса, отзыва, цифры) за первый месяц — без них оффер не работает.' : `Ставьте доказательства вперёд: «${cut(proof[0], 60)}» — в био, закреп и оффер.`,
    `Говорите с одним человеком: ${cut(audience, 80)}.`,
  ];
  const avoid = ['Вести все соцсети сразу', 'Копировать чужой стиль и темы', 'Покупать подписчиков и накрутки', 'Ждать идеального контента — публикуйте и улучшайте'];
  if (str(a, 'obstacle')) avoid.push(`Ваш главный тормоз — «${cut(str(a, 'obstacle'), 60)}». Против него — правило 15 минут: шаг меньше, чем страх.`);

  const daily = str(a, 'daily') || '15 минут';
  const plan90 = [
    `Неделя 1. Аудит профиля, новое био и закреплённый пост. Первый шаг: ${str(a, 'firstStep') || 'обновить описание профиля'}.`,
    'Неделя 2. Рубрикатор из 4 тем и 5 первых публикаций по плану.',
    'Неделя 3. Спросите 3–5 человек о себе (Reflected Best Self) и добавьте их слова в позиционирование.',
    `Неделя 4. Первый кейс. Проверка KPI: цель месяца — ${months[1]?.value ?? kTarget}.`,
    `Неделя 5. Тест оффера: 5 разговоров с людьми из аудитории «${cut(audience, 40)}».`,
    'Неделя 6. Лид-магнит: чек-лист или мини-гайд по главной боли аудитории.',
    'Неделя 7. Коллаборация: эфир, гостевой пост или совместный проект.',
    `Неделя 8. Проверка KPI: цель — ${months[Math.min(2, horizon)]?.value ?? kTarget}. Убрать то, что не работает.`,
    'Неделя 9. Серия из трёх кейсов или историй подряд.',
    'Неделя 10. Обновить оффер по обратной связи, поднять цену или уровень предложения.',
    'Неделя 11. Публичное выступление, статья или подкаст.',
    `Неделя 12. Итоги квартала: ${str(a, 'kpiName') || 'KPI'} — было ${kNow}, цель ${months[Math.min(3, horizon)]?.value ?? kTarget}. Новая цель на следующий квартал.`,
  ].map((x) => `${x} Ежедневно: ${daily}.`);

  const age = num(a, 'age');
  const safety = segment === 'teen' || (age > 0 && age < 18)
    ? ['Закройте личные сообщения от незнакомцев и не публикуйте адрес, школу и геолокацию.', 'Покажите отчёт и план родителям — договоритесь, где и как вы публикуетесь.', 'Монетизация и договоры до 18 лет — только с участием родителей.']
    : [];

  return {
    name, segment,
    pointA: str(a, 'now'),
    pointB: str(a, 'goal'),
    kpi: { name: str(a, 'kpiName'), now: kNow, target: kTarget, horizon, months },
    leading, strengths, superpower, positioning, statement,
    valueProp: { pains, gains },
    offer, bios, pillars, contentPlan, focus, avoid, plan90, safety, ai: false,
  };
}

/** Fields the AI pass may rewrite. */
export type AiPatch = Partial<Pick<Report, 'positioning' | 'statement' | 'superpower' | 'offer' | 'bios' | 'pillars' | 'contentPlan' | 'focus' | 'avoid' | 'plan90'>>;

export function mergeAi(r: Report, p: AiPatch): Report {
  const okList = (x: unknown, n: number) => Array.isArray(x) && x.length >= n && x.every((s) => typeof s === 'string');
  const out = { ...r, ai: true };
  if (typeof p.positioning === 'string') out.positioning = p.positioning;
  if (typeof p.statement === 'string') out.statement = p.statement;
  if (typeof p.superpower === 'string') out.superpower = p.superpower;
  if (p.offer && typeof p.offer.headline === 'string' && okList(p.offer.bullets, 1)) out.offer = { headline: p.offer.headline, bullets: p.offer.bullets, cta: p.offer.cta || r.offer.cta };
  if (p.bios && typeof p.bios.instagram === 'string') out.bios = { ...r.bios, ...p.bios, instagram: cut(p.bios.instagram, 150) };
  if (Array.isArray(p.pillars) && p.pillars.every((x) => typeof x?.title === 'string' && okList(x.ideas, 1))) out.pillars = p.pillars;
  if (okList(p.contentPlan, 30)) out.contentPlan = p.contentPlan!.slice(0, 30);
  if (okList(p.focus, 3)) out.focus = p.focus!;
  if (okList(p.avoid, 2)) out.avoid = p.avoid!;
  if (okList(p.plan90, 12)) out.plan90 = p.plan90!.slice(0, 12);
  return out;
}

/** Plain-text (Markdown) version for download. */
export function reportText(r: Report): string {
  const h = (t: string) => `\n## ${t}\n`;
  const ul = (xs: string[]) => xs.map((x) => `- ${x}`).join('\n');
  return [
    `# Распаковка личного бренда${r.name !== 'Вы' ? ` — ${r.name}` : ''}`,
    'FAB3D Brand · fab3d-scan.com',
    h('Точка А → точка Б'),
    `Сейчас: ${r.pointA}`,
    `Цель: ${r.pointB}`,
    `KPI «${r.kpi.name}»: ${r.kpi.months.map((m) => `${m.label} — ${m.value}`).join(' → ')}`,
    'Опережающие показатели:', ul(r.leading),
    h('Сильные стороны'), `Суперсила: ${r.superpower}`, ul(r.strengths),
    h('Позиционирование'), r.positioning, '', r.statement,
    h('Ценностное предложение'), 'Боли аудитории:', ul(r.valueProp.pains), 'Что вы даёте:', ul(r.valueProp.gains),
    h('Оффер'), r.offer.headline, ul(r.offer.bullets), r.offer.cta,
    h('Био'), `Instagram: ${r.bios.instagram}`, `LinkedIn: ${r.bios.linkedin}`, `Telegram: ${r.bios.telegram}`,
    h('Рубрики контента'), ...r.pillars.map((p) => `${p.title}\n${ul(p.ideas)}`),
    h('Контент-план на 30 дней'), ul(r.contentPlan),
    h('Куда давить'), ul(r.focus),
    h('Чего не делать'), ul(r.avoid),
    h('План на 90 дней'), ul(r.plan90),
    ...(r.safety.length ? [h('Безопасность'), ul(r.safety)] : []),
  ].join('\n');
}
