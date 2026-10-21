import type { Reference, Simulation, SimCategory } from '../types';

/* Data-driven simulation library. The engine (features/simulations/SimPlayer)
   walks: intro → nodes (explore / movement / decision) → feedback → evaluation
   → saved progress. Scoring is deterministic: 1 point per correct node. */

const MOORE: Reference = { title: 'Clinically Oriented Anatomy, 9th ed. — Lower Limb', source: 'Moore K.L., Dalley A.F., Agur A.M.R. Wolters Kluwer, 2022' };
const NEUMANN: Reference = { title: 'Kinesiology of the Musculoskeletal System, 3rd ed. — Ch. 13 Knee', source: 'Neumann D.A. Elsevier, 2017' };

export const SIMULATIONS: Simulation[] = [
  {
    id: 'sim-knee',
    title: 'Анатомия коленного сустава и функциональное движение',
    category: 'functional',
    difficulty: 1,
    durationMin: 15,
    courseId: 'c-knee',
    available: true,
    status: 'published',
    objectives: [
      'Находить кости и ключевые мышцы коленной области на 3D-модели',
      'Объяснять работу разгибательного аппарата колена',
      'Различать одно- и двусуставные мышцы бедра',
      'Связывать механизм нагрузки со стабилизирующими структурами',
    ],
    context: 'Вы — студент-реабилитолог на практическом занятии. Преподаватель просит разобрать анатомию колена на модели и объяснить, какие структуры работают при сгибании и разгибании.',
    requiredKnowledge: ['Анатомические плоскости и оси', 'Основные кости нижней конечности'],
    anatomy: ['femur', 'patella', 'tibia', 'fibula', 'rectus_femoris', 'vastus_lateralis', 'semitendinosus', 'popliteus'],
    nodes: [
      {
        id: 'n1', kind: 'explore', title: 'Костная основа сустава',
        text: 'Коленный сустав образован бедренной и большеберцовой костями и надколенником. Найдите на модели структуры, отмеченные в списке.',
        targets: ['femur', 'patella', 'tibia', 'rectus_femoris'],
      },
      {
        id: 'n2', kind: 'movement', title: 'Разгибание колена',
        text: 'Перемещайте ползунок, чтобы увидеть схему движения голени от полного сгибания к разгибанию.',
        question: 'Какая группа мышц является главным разгибателем голени в коленном суставе?',
        objective: 'Объяснять работу разгибательного аппарата колена',
        options: [
          { id: 'a', text: 'Четырёхглавая мышца бедра', correct: true, feedback: 'Верно. Все четыре головки сходятся в общее сухожилие и через надколенник разгибают голень.' },
          { id: 'b', text: 'Задние мышцы бедра', correct: false, feedback: 'Задние мышцы бедра сгибают колено и разгибают бедро — они антагонисты разгибания колена.' },
          { id: 'c', text: 'Икроножная мышца', correct: false, feedback: 'Икроножная мышца пересекает колено сзади и участвует в его сгибании, а не разгибании.' },
        ],
      },
      {
        id: 'n3', kind: 'decision', title: 'Передача силы',
        text: 'Надколенник находится в толще сухожилия четырёхглавой мышцы.',
        objective: 'Объяснять работу разгибательного аппарата колена',
        options: [
          { id: 'a', text: 'Связка надколенника передаёт тягу на бугристость большеберцовой кости', correct: true, feedback: 'Верно: квадрицепс → сухожилие → надколенник → связка надколенника → бугристость.' },
          { id: 'b', text: 'Передняя крестообразная связка передаёт тягу квадрицепса', correct: false, feedback: 'ПКС — внутрисуставной стабилизатор и не участвует в передаче тяги квадрицепса.' },
          { id: 'c', text: 'Подвздошно-большеберцовый тракт передаёт тягу квадрицепса', correct: false, feedback: 'Подвздошно-большеберцовый тракт — латеральная фасциальная структура, не элемент разгибательного аппарата.' },
        ],
      },
      {
        id: 'n4', kind: 'decision', title: 'Начало сгибания',
        text: 'В полном разгибании колено «замыкается» за счёт небольшой ротации. Для начала сгибания его нужно «разблокировать».',
        objective: 'Объяснять работу разгибательного аппарата колена',
        options: [
          { id: 'a', text: 'Подколенная мышца', correct: true, feedback: 'Верно. Подколенная мышца ротирует голень внутрь и снимает механизм замыкания.' },
          { id: 'b', text: 'Прямая мышца бедра', correct: false, feedback: 'Прямая мышца бедра разгибает колено, а не начинает сгибание.' },
          { id: 'c', text: 'Латеральная широкая мышца бедра', correct: false, feedback: 'Латеральная широкая мышца — разгибатель колена.' },
        ],
      },
      {
        id: 'n5', kind: 'decision', multi: true, title: 'Двусуставные мышцы',
        text: 'Выберите ВСЕ мышцы из списка, которые пересекают и тазобедренный, и коленный суставы.',
        objective: 'Различать одно- и двусуставные мышцы бедра',
        options: [
          { id: 'a', text: 'Прямая мышца бедра', correct: true, feedback: 'Начинается от таза и прикрепляется к голени через связку надколенника.' },
          { id: 'b', text: 'Полусухожильная мышца', correct: true, feedback: 'Начинается от седалищного бугра, прикрепляется к большеберцовой кости.' },
          { id: 'c', text: 'Портняжная мышца', correct: true, feedback: 'Начинается от передней верхней подвздошной ости, прикрепляется к большеберцовой кости.' },
          { id: 'd', text: 'Тонкая мышца', correct: true, feedback: 'Начинается от лобковой кости, прикрепляется к большеберцовой кости.' },
          { id: 'e', text: 'Латеральная широкая мышца бедра', correct: false, feedback: 'Начинается от бедренной кости — односуставная.' },
          { id: 'f', text: 'Короткая головка двуглавой мышцы бедра', correct: false, feedback: 'Начинается от бедренной кости — действует только на коленный сустав.' },
        ],
      },
      {
        id: 'n6', kind: 'decision', title: 'Механизм нагрузки',
        text: 'Учебный сценарий: при приземлении колено смещается внутрь (вальгусная нагрузка).',
        objective: 'Связывать механизм нагрузки со стабилизирующими структурами',
        options: [
          { id: 'a', text: 'Медиальная (большеберцовая) коллатеральная связка', correct: true, feedback: 'Верно. Вальгус растягивает медиальную сторону сустава.' },
          { id: 'b', text: 'Латеральная (малоберцовая) коллатеральная связка', correct: false, feedback: 'Латеральная коллатеральная связка противостоит варусной нагрузке.' },
          { id: 'c', text: 'Связка надколенника', correct: false, feedback: 'Связка надколенника — элемент разгибательного аппарата, а не фронтальный стабилизатор.' },
        ],
      },
      {
        id: 'n7', kind: 'decision', title: 'Иннервация',
        text: 'Учебный вопрос: повреждение какого нерва приведёт к слабости разгибания колена?',
        objective: 'Объяснять работу разгибательного аппарата колена',
        options: [
          { id: 'a', text: 'Бедренного нерва', correct: true, feedback: 'Верно. Бедренный нерв иннервирует четырёхглавую мышцу бедра.' },
          { id: 'b', text: 'Общего малоберцового нерва', correct: false, feedback: 'Общий малоберцовый нерв иннервирует мышцы голени (переднюю и латеральную группы).' },
          { id: 'c', text: 'Большеберцового нерва', correct: false, feedback: 'Большеберцовый нерв иннервирует заднюю группу голени и большую часть хамстрингов (через седалищный нерв).' },
        ],
      },
    ],
    reading: [MOORE, NEUMANN],
  },
];

/* Library entries that are announced but not yet built. They are shown as
   "coming soon" and cannot be started. */
const SOON: [string, string, SimCategory, 1 | 2 | 3][] = [
  ['sim-gait', 'Фазы шага и работа мышц нижней конечности', 'biomech', 2],
  ['sim-ankle-sprain', 'Механизм инверсионной травмы голеностопа', 'injuries', 2],
  ['sim-acl-post', 'Анатомия после реконструкции ПКС: трансплантаты', 'postsurgical', 3],
  ['sim-squat-assess', 'Оценка приседа: наблюдение и интерпретация', 'assessment', 1],
  ['sim-shoulder-case', 'Учебный случай: боль в плече у пловца', 'cases', 2],
  ['sim-knee-surgical', 'Хирургические доступы к коленному суставу', 'surgical', 3],
];
for (const [id, title, category, difficulty] of SOON) {
  SIMULATIONS.push({
    id, title, category, difficulty, durationMin: 20, available: false, status: 'draft',
    objectives: [], context: '', requiredKnowledge: [], anatomy: [], nodes: [], reading: [],
  });
}

export const SIM_BY_ID: Record<string, Simulation> = Object.fromEntries(SIMULATIONS.map((s) => [s.id, s]));
export const SIM_CATEGORIES: SimCategory[] = ['functional', 'biomech', 'injuries', 'postsurgical', 'assessment', 'cases', 'surgical'];
