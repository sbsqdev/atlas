import type { Account, Bi, Course, Exercise, MuscleId } from '../types';
import { hash } from '../store/hash';

/**
 * Seed content for the platform.
 *
 * The main course is a faithful transcription of Rauana Kuangaliyeva's
 * glutes-and-legs strength program (the trainer's own exercises, set/rep
 * schemes, progression notes and demo video links). Each exercise is mapped
 * to the muscles it works so the 3D atlas can highlight them.
 */

let seq = 0;
const uid = (prefix: string) => `${prefix}-${(seq++).toString(36)}`;

// ---------------------------------------------------------------------------
// Exercise library — one canonical definition per movement. Workouts reference
// these and add their own prescription (sets×reps) and progression note.
// ---------------------------------------------------------------------------

interface BaseExercise {
  name: Bi;
  description: Bi;
  videoUrl?: string;
  primary: MuscleId[];
  secondary: MuscleId[];
}

const LIB = {
  romanianDeadlift: {
    name: { ru: 'Румынская тяга', en: 'Romanian deadlift' },
    description: {
      ru: 'Тяга со штангой на прямых (слегка согнутых) ногах. Таз отводится назад, спина прямая — акцент на растяжении и работе задней поверхности бедра и ягодиц.',
      en: 'Barbell hinge on nearly straight legs. Push the hips back with a flat back to load the hamstrings and glutes through the stretch.',
    },
    videoUrl: 'https://drive.google.com/file/d/128AVXrDocx8FrW8tNe8eWGya9R7jTBUT/view',
    primary: ['hamstrings', 'glutes'],
    secondary: ['lowerBack', 'forearms'],
  },
  singleLegDeadlift: {
    name: { ru: 'Одноногая тяга', en: 'Single-leg deadlift' },
    description: {
      ru: 'Румынская тяга на одной ноге. Развивает заднюю поверхность бедра и ягодицы, тренирует баланс и стабилизацию таза.',
      en: 'Single-leg hinge. Builds the hamstrings and glutes while training balance and pelvic stability.',
    },
    videoUrl: 'https://drive.google.com/file/d/1jZnVWQnSco9bJ36BqEze11yH-ExmHB-T/view',
    primary: ['hamstrings', 'glutes'],
    secondary: ['lowerBack', 'abductors'],
  },
  latPulldown: {
    name: { ru: 'Тяга верхнего блока', en: 'Lat pulldown' },
    description: {
      ru: 'Тяга рукояти верхнего блока к груди. Основная нагрузка — широчайшие мышцы спины.',
      en: 'Pull the high-cable bar to the chest. Primarily targets the latissimus dorsi.',
    },
    videoUrl: 'https://drive.google.com/file/d/12GaxVNpUt7JzASCU9pKyJdgTaahRFiPN/view',
    primary: ['lats'],
    secondary: ['biceps', 'traps', 'forearms'],
  },
  latPulldownNeutral: {
    name: { ru: 'Тяга верхнего блока (параллельный хват)', en: 'Lat pulldown (neutral grip)' },
    description: {
      ru: 'Тяга верхнего блока параллельным (нейтральным) хватом — сильнее включает нижнюю часть широчайших.',
      en: 'Lat pulldown with a neutral (parallel) grip — emphasises the lower lats.',
    },
    videoUrl: 'https://youtu.be/4_6V-OnGlag',
    primary: ['lats'],
    secondary: ['biceps', 'traps'],
  },
  squat: {
    name: { ru: 'Присед', en: 'Squat' },
    description: {
      ru: 'Классический присед со штангой. Комплексное упражнение на квадрицепсы и ягодицы.',
      en: 'Classic barbell squat. A compound movement for the quads and glutes.',
    },
    videoUrl: 'https://drive.google.com/file/d/1XXNwpkxjeMw5n4nV7K8xSHi5CbAetG3O/view',
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'lowerBack', 'adductors'],
  },
  seatedRow: {
    name: { ru: 'Тяга горизонтального блока', en: 'Seated cable row' },
    description: {
      ru: 'Тяга горизонтального блока к корпусу. Работает середина спины — широчайшие и трапеции.',
      en: 'Horizontal cable row to the torso. Works the mid-back — lats and traps.',
    },
    videoUrl: 'https://drive.google.com/file/d/1j2TW-qIgAJaqg3lWLUwN-gC_WFM0UOok/view',
    primary: ['lats', 'traps'],
    secondary: ['biceps', 'shoulders'],
  },
  gluteBridge: {
    name: { ru: 'Ягодичный мост', en: 'Glute bridge' },
    description: {
      ru: 'Подъём таза с опорой на лопатки (или со штангой). Изолированно прокачивает ягодицы.',
      en: 'Hip thrust / bridge from the shoulders (optionally loaded). Isolates the glutes.',
    },
    videoUrl: 'https://drive.google.com/file/d/1cNjLP61D6bsSf6_1D_x26-Z5ycDl9Oqc/view',
    primary: ['glutes'],
    secondary: ['hamstrings'],
  },
  dbRomanianDeadlift: {
    name: { ru: 'Румынская тяга с гантелями', en: 'Dumbbell Romanian deadlift' },
    description: {
      ru: 'Румынская тяга с двумя гантелями. Та же механика, что и со штангой, с большей свободой движения.',
      en: 'Romanian deadlift with two dumbbells — same hinge pattern with a freer range of motion.',
    },
    videoUrl: 'https://youtu.be/Apa3YBMBLGs',
    primary: ['hamstrings', 'glutes'],
    secondary: ['lowerBack', 'forearms'],
  },
  bandedWalk: {
    name: { ru: 'Проходка (с резинкой)', en: 'Lateral band walk' },
    description: {
      ru: 'Ходьба в стороны с резиновой лентой на бёдрах. Разогревает и нагружает средние ягодичные.',
      en: 'Side-stepping with a band around the thighs. Activates and burns out the gluteus medius.',
    },
    videoUrl: 'https://drive.google.com/file/d/1oFBVvcv83aLrs8hcDRK8WE8uaNT0Pmr4/view',
    primary: ['abductors', 'glutes'],
    secondary: ['quads'],
  },
  gravitronPullup: {
    name: { ru: 'Гравитрон, узкий нейтральный хват', en: 'Assisted pull-up (narrow neutral grip)' },
    description: {
      ru: 'Подтягивания в гравитроне узким нейтральным хватом. Нагрузка на широчайшие с помощью противовеса.',
      en: 'Assisted pull-ups in the gravitron with a narrow neutral grip — lats with counter-weight assistance.',
    },
    videoUrl: 'https://drive.google.com/file/d/1IUY3urpHEAMcyQ1YOTER6KglxW0S9uDA/view',
    primary: ['lats'],
    secondary: ['biceps', 'forearms'],
  },
  kettlebellKickback: {
    name: { ru: 'Отведение ноги назад с гирей', en: 'Kettlebell glute kickback' },
    description: {
      ru: 'Отведение прямой ноги назад с гирей. Изолирует большую ягодичную мышцу.',
      en: 'Straight-leg kickback with a kettlebell. Isolates the gluteus maximus.',
    },
    videoUrl: 'https://drive.google.com/file/d/1y1tbd2finDXjY6BXIqxjVhGnTm-r5azF/view',
    primary: ['glutes'],
    secondary: ['hamstrings'],
  },
  ropeRow: {
    name: { ru: 'Тяга канатной рукоятки к корпусу', en: 'Rope row to torso' },
    description: {
      ru: 'Тяга канатной рукояти к корпусу. Работает середина спины и задние дельты.',
      en: 'Cable rope row to the torso — mid-back and rear delts.',
    },
    videoUrl: 'https://youtu.be/SrN0ozdxVWQ',
    primary: ['lats', 'traps'],
    secondary: ['biceps', 'shoulders'],
  },
  hyperextension: {
    name: { ru: 'Гиперэкстензия', en: 'Hyperextension' },
    description: {
      ru: 'Разгибание корпуса в тренажёре. Укрепляет разгибатели спины, ягодицы и заднюю поверхность бедра.',
      en: 'Back extension on the bench. Strengthens the spinal erectors, glutes and hamstrings.',
    },
    videoUrl: 'https://youtu.be/02eW1R_ZYxA',
    primary: ['lowerBack', 'glutes'],
    secondary: ['hamstrings'],
  },
  lunges: {
    name: { ru: 'Выпады', en: 'Lunges' },
    description: {
      ru: 'Выпады с гантелями поочерёдно на каждую ногу. Квадрицепсы и ягодицы, работа с балансом.',
      en: 'Alternating dumbbell lunges. Quads and glutes with a balance demand.',
    },
    videoUrl: 'https://drive.google.com/file/d/1HBVV6j34B_um3wjz6mxJpjIafEOJVwvZ/view',
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'adductors'],
  },
  seatedHipAbduction: {
    name: { ru: 'Отведения бедра сидя', en: 'Seated hip abduction' },
    description: {
      ru: 'Разведение бёдер в тренажёре сидя. Прицельно нагружает средние ягодичные.',
      en: 'Seated abduction machine. Targets the gluteus medius.',
    },
    videoUrl: 'https://drive.google.com/file/d/16T-tqtEIhuVl0KLME-JQ8gtio2vkHJpZ/view',
    primary: ['abductors'],
    secondary: ['glutes'],
  },
  smithRomanianDeadlift: {
    name: { ru: 'Румынская тяга в Смите', en: 'Smith-machine Romanian deadlift' },
    description: {
      ru: 'Румынская тяга в машине Смита. Фиксированная траектория позволяет сосредоточиться на бицепсе бедра.',
      en: 'RDL in the Smith machine. The fixed bar path lets you focus on the hamstrings.',
    },
    videoUrl: 'https://youtu.be/wcDrePFazWI',
    primary: ['hamstrings', 'glutes'],
    secondary: ['lowerBack'],
  },
  dbRow: {
    name: { ru: 'Тяга гантели к корпусу', en: 'One-arm dumbbell row' },
    description: {
      ru: 'Тяга гантели к корпусу в наклоне, по одной руке. Широчайшие и трапеции.',
      en: 'Bent-over one-arm dumbbell row. Lats and traps.',
    },
    videoUrl: 'https://youtube.com/watch?v=t9XqzZyQQbE',
    primary: ['lats', 'traps'],
    secondary: ['biceps', 'shoulders'],
  },
  cableKickback: {
    name: { ru: 'Отведение ноги назад в кроссовере', en: 'Cable glute kickback' },
    description: {
      ru: 'Отведение ноги назад в кроссовере. Изоляция большой ягодичной.',
      en: 'Cable kickback in the crossover. Glute-max isolation.',
    },
    videoUrl: 'https://drive.google.com/file/d/1oCvIoEzRb3LB2PkQiNPC_HZj5V2YSGv6/view',
    primary: ['glutes'],
    secondary: ['hamstrings'],
  },
  standingHipAbduction: {
    name: { ru: 'Отведение бедра в сторону', en: 'Standing hip abduction' },
    description: {
      ru: 'Отведение бедра в сторону (в кроссовере или с резинкой). Средние ягодичные.',
      en: 'Standing hip abduction (cable or band). Gluteus medius.',
    },
    videoUrl: 'https://youtu.be/9voXV4-k3yw',
    primary: ['abductors'],
    secondary: ['glutes'],
  },
  coreBlock: {
    name: { ru: 'Блок на мышцы кора', en: 'Core block' },
    description: {
      ru: 'Комплекс упражнений на мышцы кора. Сильный кор стабилизирует корпус и делает силовые упражнения эффективнее.',
      en: 'A block of core exercises. A strong core stabilises the torso and makes your main lifts more effective.',
    },
    videoUrl: 'https://drive.google.com/file/d/1D4Tyj-OsMssIjuSYLfzkhuC1sPtBzQX5/view',
    primary: ['abs', 'obliques'],
    secondary: ['lowerBack'],
  },
} satisfies Record<string, BaseExercise>;

type LibKey = keyof typeof LIB;

/** Instantiate a library exercise with a workout-specific prescription/note. */
function ex(key: LibKey, prescription: Bi, note?: Bi): Exercise {
  const base = LIB[key];
  return {
    id: uid('exe'),
    name: base.name,
    description: base.description,
    videoUrl: base.videoUrl,
    primary: [...base.primary],
    secondary: [...base.secondary],
    prescription,
    note,
  };
}

const p = (ru: string, en: string): Bi => ({ ru, en });

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

const legsCourse: Course = {
  id: 'course-glutes-legs',
  trainerId: 'trainer-rauana',
  code: 'RAUANA',
  grantedEmails: ['student@demo.app'],
  title: { ru: 'Сила: ягодицы и ноги', en: 'Strength: glutes & legs', tr: 'Güç: kalça ve bacak' },
  summary: {
    ru: 'Программа из повторяющихся тренировок A/B/C с прогрессией весов. После каждой силовой — блок на кор.',
    en: 'A/B/C rotating program with weight progression. Finish every session with the core block.',
    tr: 'Ağırlık artışlı A/B/C döngülü program. Her antrenmanı core bloğuyla bitirin.',
  },
  level: { ru: 'Начальный–средний', en: 'Beginner–intermediate', tr: 'Başlangıç–orta' },
  workouts: [
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 1 (A)', en: 'Workout 1 (A)' },
      exercises: [
        ex('romanianDeadlift', p('Сет: 1×12, затем одноногая тяга', '1×12, then single-leg DL'),
          p('Сет с одноногой тягой, всего 4 подхода.', 'Superset with single-leg DL, 4 rounds total.')),
        ex('singleLegDeadlift', p('15 / нога', '15 / leg')),
        ex('latPulldown', p('4×12', '4×12')),
        ex('squat', p('4×12', '4×12')),
        ex('seatedRow', p('3×10', '3×10')),
        ex('gluteBridge', p('4×12', '4×12')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 2 (B)', en: 'Workout 2 (B)' },
      exercises: [
        ex('dbRomanianDeadlift', p('Сет: 1×12 + проходка 35 сек', '1×12 + 35s walk'),
          p('Сет с проходкой, всего 3 подхода.', 'Superset with band walk, 3 rounds total.')),
        ex('bandedWalk', p('35 сек', '35 sec')),
        ex('gravitronPullup', p('4×8', '4×8')),
        ex('squat', p('4×12', '4×12')),
        ex('kettlebellKickback', p('3×15 / нога', '3×15 / leg')),
        ex('ropeRow', p('4×10', '4×10')),
        ex('hyperextension', p('4×12', '4×12')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 3 (C)', en: 'Workout 3 (C)' },
      exercises: [
        ex('lunges', p('Сет: 12 / нога + отведения сидя', '12 / leg + seated abduction'),
          p('Сет с отведениями бедра сидя, всего 4 подхода.', 'Superset with seated abduction, 4 rounds total.')),
        ex('seatedHipAbduction', p('35 сек', '35 sec')),
        ex('latPulldownNeutral', p('3×12', '3×12')),
        ex('smithRomanianDeadlift', p('4×12', '4×12')),
        ex('dbRow', p('2×12 / сторона', '2×12 / side')),
        ex('cableKickback', p('Сет: 15 / нога + отведение в сторону', '15 / leg + side abduction'),
          p('Сет с отведением бедра в сторону, по 2 подхода на каждую сторону.', 'Superset with standing abduction, 2 rounds / side.')),
        ex('standingHipAbduction', p('15 / нога', '15 / leg')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 4 (A) — прогрессия', en: 'Workout 4 (A) — progression' },
      exercises: [
        ex('romanianDeadlift', p('Сет: 1×12 + одноногая тяга', '1×12 + single-leg DL'),
          p('Повышаем вес в румынской тяге на 2 кг. Всего 4 подхода.', '+2 kg on the RDL. 4 rounds total.')),
        ex('singleLegDeadlift', p('15 / нога', '15 / leg')),
        ex('latPulldown', p('4×12', '4×12')),
        ex('squat', p('4×12', '4×12'), p('Повышаем вес на 2 кг.', '+2 kg.')),
        ex('seatedRow', p('3×12', '3×12')),
        ex('gluteBridge', p('4×12', '4×12')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 5 (B) — прогрессия', en: 'Workout 5 (B) — progression' },
      exercises: [
        ex('dbRomanianDeadlift', p('Сет: 1×12 + проходка 35 сек', '1×12 + 35s walk'),
          p('Повышаем вес по 1 кг с каждой стороны. Всего 3 подхода.', '+1 kg per side. 3 rounds total.')),
        ex('bandedWalk', p('35 сек', '35 sec')),
        ex('gravitronPullup', p('4×10', '4×10')),
        ex('squat', p('4×12', '4×12'), p('Повышаем вес на 1 кг.', '+1 kg.')),
        ex('kettlebellKickback', p('3×15 / нога', '3×15 / leg')),
        ex('ropeRow', p('4×12', '4×12')),
        ex('hyperextension', p('4×12', '4×12')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 6 (C) — прогрессия', en: 'Workout 6 (C) — progression' },
      exercises: [
        ex('lunges', p('Сет: 12 / нога + отведения сидя', '12 / leg + seated abduction'),
          p('Выпады +1 кг, отведения сидя +2 кг. Всего 4 подхода.', 'Lunges +1 kg, seated abduction +2 kg. 4 rounds total.')),
        ex('seatedHipAbduction', p('35 сек', '35 sec')),
        ex('latPulldownNeutral', p('3×12', '3×12'), p('Повышаем вес на 5 кг.', '+5 kg.')),
        ex('smithRomanianDeadlift', p('4×12', '4×12')),
        ex('dbRow', p('2×12 / сторона', '2×12 / side'), p('Повышаем вес на 1 кг.', '+1 kg.')),
        ex('cableKickback', p('Сет: 15 / нога + отведение в сторону', '15 / leg + side abduction'),
          p('По 2 подхода на каждую сторону.', '2 rounds / side.')),
        ex('standingHipAbduction', p('15 / нога', '15 / leg')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
  ],
};

export const COURSES: Course[] = [legsCourse];

// ---------------------------------------------------------------------------
// Seed accounts — a demo coach (owns the seeded course) and a demo student
// (already enrolled), so the quick-login buttons have content to show.
// ---------------------------------------------------------------------------

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'trainer-rauana',
    username: 'rauana',
    name: 'Rauana Kuangaliyeva',
    email: 'rauana@demo.app',
    passHash: hash('demo1234'),
    consentAt: Date.now(),
    role: 'trainer',
    bio: 'Персональный тренер. Силовые программы для девушек с акцентом на ягодицы, ноги и сильный кор. / Personal coach — strength programs focused on glutes, legs and a strong core.',
    brandName: 'Rauana Training',
    brandColor: '#5e8a73',
    avatarColor: '#5e8a73',
  },
  {
    id: 'student-demo',
    username: 'student',
    name: 'Demo Student',
    email: 'student@demo.app',
    passHash: hash('demo1234'),
    consentAt: Date.now(),
    role: 'student',
    avatarColor: '#c08a5e',
    enrolledCourseIds: ['course-glutes-legs'],
  },
];

export const DEMO_COACH = { login: 'rauana', password: 'demo1234' };
export const DEMO_STUDENT = { login: 'student', password: 'demo1234' };
