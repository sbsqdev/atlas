/* FAB3D Brand — personal-brand unpacking. Questions, packages and sources.
   The methods are described in our own words; no proprietary test items
   (e.g. Gallup CliftonStrengths) are reproduced. */

export type Segment = 'exec' | 'expert' | 'founder' | 'student' | 'teen';

export const SEGMENTS: { id: Segment; title: string; text: string }[] = [
  { id: 'exec', title: 'Топ-менеджер, руководитель', text: 'Публичность, LinkedIn, спикерство, следующая позиция или борд' },
  { id: 'expert', title: 'Эксперт, специалист', text: 'Врач, тренер, юрист, психолог, дизайнер — клиенты и доход' },
  { id: 'founder', title: 'Предприниматель', text: 'Личный бренд, который продаёт продукт компании' },
  { id: 'student', title: 'Студент', text: 'Стажировка, первая работа, гранты, нетворкинг' },
  { id: 'teen', title: 'Подросток 14–17', text: 'Портфолио, поступление, хобби и первые проекты' },
];

type Label = string | Partial<Record<Segment, string>>;
export type QKind = 'text' | 'textarea' | 'number' | 'choice' | 'multi';
export interface Question {
  id: string;
  kind: QKind;
  label: Label;
  hint?: Label;
  options?: string[] | Partial<Record<Segment, string[]>>;
  max?: number;
  required?: boolean;
}
export interface Step {
  id: string;
  title: string;
  method: string;
  intro: Label;
  free?: boolean;
  questions: Question[];
}

export const label = (l: Label | undefined, s: Segment) => (typeof l === 'string' || l === undefined ? l ?? '' : l[s] ?? l.expert ?? Object.values(l)[0] ?? '');
export const options = (q: Question, s: Segment): string[] => (Array.isArray(q.options) ? q.options : q.options?.[s] ?? q.options?.expert ?? []);

export const STRENGTHS = [
  'Аналитика', 'Стратегия', 'Коммуникация', 'Убеждение', 'Забота о людях', 'Обучение других', 'Креатив и идеи', 'Организация и порядок',
  'Достигаторство', 'Лидерство', 'Надёжность', 'Любознательность', 'Эмпатия', 'Командная работа', 'Энергия и драйв', 'Глубокая экспертиза',
];
export const VALUES = ['Честность', 'Свобода', 'Качество', 'Забота', 'Развитие', 'Результат', 'Семья', 'Смелость', 'Простота', 'Справедливость', 'Здоровье', 'Вклад в общество'];
export const TONES = ['Экспертный и спокойный', 'Тёплый и поддерживающий', 'Дерзкий и прямой', 'Вдохновляющий', 'С юмором и лёгкий'];

export const STEPS: Step[] = [
  {
    id: 'start', title: 'Кто вы', method: 'Сегментация', free: true,
    intro: 'Распаковка подстраивается под вашу ситуацию: вопросы и советы для топ-менеджера, студента и подростка разные.',
    questions: [
      { id: 'segment', kind: 'choice', label: 'Кто вы сейчас', required: true },
      { id: 'name', kind: 'text', label: 'Как к вам обращаться', hint: 'Только для текста отчёта, никуда не сохраняется' },
      { id: 'age', kind: 'number', label: 'Возраст', required: true },
      { id: 'role', kind: 'text', label: { exec: 'Должность и индустрия', expert: 'Профессия и специализация', founder: 'Бизнес и ваша роль в нём', student: 'Вуз, специальность, курс', teen: 'Школа, класс и чем увлекаетесь' }, required: true },
      { id: 'geo', kind: 'text', label: 'Город и страна', hint: 'Например: Алматы, Казахстан' },
    ],
  },
  {
    id: 'pointA', title: 'Точка А', method: 'Честный аудит', free: true,
    intro: 'Где вы сейчас. Без честной точки А невозможно измерить движение.',
    questions: [
      { id: 'platforms', kind: 'multi', label: 'Где вы есть сейчас', options: ['Instagram', 'Telegram', 'LinkedIn', 'TikTok', 'YouTube', 'Threads', 'Пока нигде'] },
      { id: 'followers', kind: 'number', label: 'Сколько подписчиков на главной площадке', hint: '0, если только начинаете' },
      { id: 'now', kind: 'textarea', label: { exec: 'Что сейчас даёт вам публичность: приглашения, предложения, узнаваемость?', expert: 'Сколько клиентов и откуда они приходят сейчас?', founder: 'Сколько продаж или лидов приходит через вас лично?', student: 'Что уже есть: опыт, проекты, стажировки, олимпиады?', teen: 'Что уже есть: проекты, соревнования, творчество, волонтёрство?' }, required: true },
      { id: 'hours', kind: 'choice', label: 'Сколько часов в неделю готовы уделять бренду', options: ['1–2 часа', '3–5 часов', '6–10 часов', 'Больше 10 часов'], required: true },
    ],
  },
  {
    id: 'pointB', title: 'Точка Б и KPI', method: 'SMART и OKR',
    free: true,
    intro: 'Цель, которую можно измерить. Хорошая цель конкретна, измерима и ограничена сроком.',
    questions: [
      {
        id: 'goalType', kind: 'choice', label: 'Главная цель', required: true,
        options: {
          exec: ['Узнаваемость в индустрии', 'Следующая позиция или борд', 'Спикерство и медиа', 'Привлечение талантов в команду'],
          expert: ['Больше клиентов', 'Поднять чек', 'Запустить продукт или курс', 'Стать узнаваемым экспертом'],
          founder: ['Продажи через личный бренд', 'Инвесторы и партнёры', 'Найм и команда', 'Запуск нового продукта'],
          student: ['Стажировка или первая работа', 'Грант или магистратура', 'Нетворкинг в индустрии', 'Первые клиенты на фрилансе'],
          teen: ['Поступление в вуз', 'Портфолио проектов', 'Развить хобби в навык', 'Первый заработок'],
        },
      },
      { id: 'goal', kind: 'textarea', label: 'Точка Б — опишите конкретно, что изменится', hint: 'Например: «8 клиентов в месяц со средним чеком 60 000 ₸» или «оффер на стажировку в IT-компании»', required: true },
      { id: 'horizon', kind: 'choice', label: 'Срок', options: ['3 месяца', '6 месяцев', '12 месяцев'], required: true },
      { id: 'kpiName', kind: 'text', label: 'Главный показатель (KPI)', hint: 'Клиенты в месяц, заявки, отклики, приглашения, доход', required: true },
      { id: 'kpiNow', kind: 'number', label: 'Сколько сейчас', required: true },
      { id: 'kpiTarget', kind: 'number', label: 'Сколько нужно в точке Б', required: true },
    ],
  },
  {
    id: 'strengths', title: 'Сильные стороны', method: 'Подход от сильных сторон (Gallup)',
    intro: 'Исследования Gallup показывают: люди растут быстрее, когда развивают сильные стороны, а не только закрывают слабые. Это не официальный тест CliftonStrengths — его можно пройти на gallup.com.',
    questions: [
      { id: 'themes', kind: 'multi', label: 'Выберите до 5 тем, которые точно про вас', options: STRENGTHS, max: 5, required: true },
      { id: 'easy', kind: 'textarea', label: 'Что вам даётся легко, а другим — с трудом?', required: true },
      { id: 'praised', kind: 'textarea', label: 'За что вас чаще всего благодарят?' },
      { id: 'flow', kind: 'textarea', label: 'Когда вы теряете счёт времени?' },
    ],
  },
  {
    id: 'bestSelf', title: 'Вы на высоте', method: 'Reflected Best Self (Harvard Business Review)',
    intro: 'Методика из Harvard Business Review: попросите 3–5 человек (коллег, друзей, преподавателей) описать момент, когда вы были на высоте. Повторяющиеся темы — ваша настоящая ценность глазами других.',
    questions: [
      { id: 'feedback', kind: 'textarea', label: 'Что повторяется в ответах других?', hint: 'Если ещё не спросили — впишите, что вам обычно говорят. Лучше спросить: это 15 минут.' },
      { id: 'proud', kind: 'textarea', label: { student: 'Три истории, когда вы были на высоте (учёба, проекты, спорт)', teen: 'Три истории, которыми вы гордитесь', exec: 'Три управленческих решения или проекта, которыми вы гордитесь' }, required: true },
    ],
  },
  {
    id: 'audience', title: 'Аудитория и ценность', method: 'Value Proposition Canvas',
    intro: { exec: 'Кому важна ваша экспертиза: индустрия, собственники, команды, медиа.', expert: 'Кому вы помогаете, что у них болит и какой результат вы даёте.', founder: 'Кто покупает продукт и почему доверяет именно вам.', student: 'Кому вы полезны: работодателю, команде проекта, грантовому фонду.', teen: 'Кому интересно то, что вы делаете: приёмной комиссии, сверстникам, будущим заказчикам.' },
    questions: [
      { id: 'audience', kind: 'textarea', label: { student: 'Кто ваш «покупатель»: компании, команды, фонды', teen: 'Кто ваша аудитория', exec: 'Кто ваша аудитория' }, hint: 'Чем конкретнее, тем сильнее: «бегуны-любители 30–45 лет в Алматы», а не «все, кто занимается спортом»', required: true },
      { id: 'pains', kind: 'textarea', label: 'Что у них болит, чего они боятся, что мешает', required: true },
      { id: 'result', kind: 'textarea', label: { student: 'Какую пользу вы принесёте', teen: 'Что они получат от вас', exec: 'Какой результат вы создаёте' }, required: true },
      { id: 'proof', kind: 'textarea', label: 'Доказательства: кейсы, цифры, отзывы, достижения', hint: 'Даже маленькие: «помог 12 людям», «призёр олимпиады», «рост выручки на 30%»' },
    ],
  },
  {
    id: 'position', title: 'Позиционирование', method: 'Positioning (Ries & Trout, Moore)',
    intro: 'Позиционирование — место в голове человека: за что вас запоминают и чем вы отличаетесь от альтернатив.',
    questions: [
      { id: 'alt', kind: 'text', label: 'К кому ещё может пойти ваша аудитория', hint: 'Конкуренты, бесплатные варианты, «ничего не делать»' },
      { id: 'diff', kind: 'textarea', label: 'Чем вы отличаетесь от этих альтернатив', required: true },
      { id: 'values', kind: 'multi', label: 'Три ценности, которые вы транслируете', options: VALUES, max: 3, required: true },
      { id: 'tone', kind: 'choice', label: 'Тон голоса', options: TONES, required: true },
      { id: 'topics', kind: 'text', label: 'Темы, о которых вы можете говорить часами (через запятую)', required: true },
      { id: 'against', kind: 'text', label: 'Против чего вы выступаете', hint: 'Мифы, плохие практики, стереотипы в вашей сфере. Сильный бренд всегда за что-то и против чего-то.' },
    ],
  },
  {
    id: 'offer', title: 'Оффер', method: 'Ценностное предложение',
    intro: { student: 'Что вы предлагаете: резюме, проект, навык. Оффер — это обещание результата.', teen: 'Что вы предлагаете миру: проект, навык, портфолио. Оффер — это обещание результата.', exec: 'Ваш «продукт» — экспертиза: консультации, выступления, роль, позиция.' },
    questions: [
      { id: 'format', kind: 'choice', label: 'Формат', required: true, options: { exec: ['Позиция или роль', 'Выступления и медиа', 'Консультации и эдвайзинг', 'Борд или наставничество'], expert: ['Консультация', 'Ведение или наставничество', 'Курс или обучение', 'Услуга под ключ'], founder: ['Продукт компании', 'Услуга', 'Партнёрство', 'Инвестиционное предложение'], student: ['Стажировка', 'Первая работа', 'Фриланс-проект', 'Грант или стипендия'], teen: ['Портфолио для вуза', 'Творческий проект', 'Фриланс или подработка', 'Свой мини-проект'] } },
      { id: 'clientResult', kind: 'textarea', label: 'Что конкретно получит человек и за какой срок', required: true },
      { id: 'price', kind: 'text', label: { student: 'Ожидаемая зарплата или ставка', teen: 'Цена (если есть)', exec: 'Ожидаемый уровень компенсации или гонорара' }, hint: 'Можно пропустить' },
      { id: 'guarantee', kind: 'text', label: 'Что снижает риск для человека', hint: 'Пробный период, бесплатная диагностика, гарантия, портфолио' },
    ],
  },
  {
    id: 'kaizen', title: 'Кайдзен: маленькие шаги', method: 'Kaizen',
    intro: 'Кайдзен — непрерывные маленькие улучшения. Ежедневный шаг на 15 минут надёжнее, чем рывок раз в месяц.',
    questions: [
      { id: 'daily', kind: 'choice', label: 'Сколько минут в день реально', options: ['15 минут', '30 минут', '60 минут'], required: true },
      { id: 'obstacle', kind: 'textarea', label: 'Что обычно мешает публиковаться и продвигать себя', hint: 'Страх оценки, перфекционизм, нет времени, не знаю о чём писать' },
      { id: 'firstStep', kind: 'text', label: 'Самый маленький шаг, который вы готовы сделать завтра' },
    ],
  },
];

export const FREE_STEPS = STEPS.filter((s) => s.free).length;

export type PackageId = 'start' | 'pro' | 'producer';
export const PACKAGES: { id: PackageId; plan: 'brand-start' | 'brand-pro' | 'brand-producer'; name: string; priceKzt: number; days: number; points: string[]; note: string }[] = [
  {
    id: 'start', plan: 'brand-start', name: 'Старт', priceKzt: 25_000, days: 30,
    note: 'Самостоятельная распаковка с ИИ',
    points: ['Полная AI-распаковка: 9 шагов', 'Позиционирование и ценностное предложение', 'Оффер и био для Instagram, LinkedIn, Telegram', 'Контент-план на 30 дней', 'KPI: точка А → Б по месяцам', 'План на 90 дней по шагам кайдзен', 'Отчёт в PDF, доступ 30 дней'],
  },
  {
    id: 'pro', plan: 'brand-pro', name: 'Про', priceKzt: 50_000, days: 60,
    note: 'Распаковка + разбор с продюсером',
    points: ['Всё из «Старт»', 'Разбор отчёта с продюсером: 60 минут онлайн', 'Доработка позиционирования и оффера', 'Аудит одного профиля в соцсети', 'Доступ 60 дней'],
  },
  {
    id: 'producer', plan: 'brand-producer', name: 'Продюсер', priceKzt: 100_000, days: 90,
    note: 'Месяц сопровождения',
    points: ['Всё из «Про»', '4 онлайн-встречи раз в неделю: трекинг KPI', 'Контент-план на 90 дней', 'Упаковка профилей: Instagram, LinkedIn, Telegram', 'Лид-магнит и воронка до первой продажи', 'Доступ 90 дней'],
  },
];

export const SOURCES = [
  'Clifton D.O., Harter J.K. Investing in strengths. In: Cameron K.S., Dutton J.E., Quinn R.E. (eds.) Positive Organizational Scholarship. Berrett-Koehler, 2003.',
  'Rath T. StrengthsFinder 2.0. Gallup Press, 2007.',
  'Roberts L.M., Spreitzer G., Dutton J., Quinn R., Heaphy E., Barker B. How to Play to Your Strengths. Harvard Business Review, January 2005.',
  'Osterwalder A., Pigneur Y., Bernarda G., Smith A. Value Proposition Design. Wiley, 2014.',
  'Ries A., Trout J. Positioning: The Battle for Your Mind. McGraw-Hill, 1981.',
  'Moore G.A. Crossing the Chasm. HarperBusiness, 1991.',
  'Doran G.T. There\'s a S.M.A.R.T. way to write management\'s goals and objectives. Management Review, 1981;70(11):35–36.',
  'Doerr J. Measure What Matters. Portfolio, 2018.',
  'Imai M. Kaizen: The Key to Japan\'s Competitive Success. McGraw-Hill, 1986.',
  'Maurer R. One Small Step Can Change Your Life: The Kaizen Way. Workman, 2004.',
  'Peters T. The Brand Called You. Fast Company, 1997.',
  'Clear J. Atomic Habits. Avery, 2018.',
];
