import type { Account, Bi, Course, Exercise, MuscleId } from '../types';
import { hash } from '../store/hash';

/**
 * Seed content for the platform.
 *
 * A neutral, generic DEMO program authored by a placeholder "Demo Coach".
 * It uses only universal, public-domain exercises (squat, push-up, plank, …)
 * with generic descriptions and NO real trainer's content, videos or data.
 * Real trainers create and own their own programs in the app.
 */

let seq = 0;
const uid = (prefix: string) => `${prefix}-${(seq++).toString(36)}`;

// ---------------------------------------------------------------------------
// Exercise library — universal movements. Workouts reference these and add
// their own prescription (sets×reps). No external video links in the demo.
// ---------------------------------------------------------------------------

interface BaseExercise {
  name: Bi;
  description: Bi;
  videoUrl?: string;
  primary: MuscleId[];
  secondary: MuscleId[];
}

const LIB = {
  squat: {
    name: { ru: 'Приседания', en: 'Squat', tr: 'Squat' },
    description: {
      ru: 'Базовое приседание с собственным весом или отягощением. Работают квадрицепсы и ягодицы.',
      en: 'Basic bodyweight or loaded squat. Works the quads and glutes.',
      tr: 'Temel squat. Ön bacak ve kalçayı çalıştırır.',
    },
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'lowerBack', 'adductors'],
  },
  pushup: {
    name: { ru: 'Отжимания', en: 'Push-up', tr: 'Şınav' },
    description: {
      ru: 'Отжимания от пола. Нагрузка на грудные, трицепс и передние дельты.',
      en: 'Floor push-up. Loads the chest, triceps and front delts.',
      tr: 'Yerde şınav. Göğüs, arka kol ve ön omuz.',
    },
    primary: ['chest', 'triceps'],
    secondary: ['shoulders', 'abs'],
  },
  plank: {
    name: { ru: 'Планка', en: 'Plank', tr: 'Plank' },
    description: {
      ru: 'Статическая планка на предплечьях. Удержание корпуса — работа всего кора.',
      en: 'Forearm plank hold. A whole-core anti-extension exercise.',
      tr: 'Ön kol plank. Tüm karın bölgesi.',
    },
    primary: ['abs', 'obliques'],
    secondary: ['lowerBack', 'shoulders'],
  },
  gluteBridge: {
    name: { ru: 'Ягодичный мост', en: 'Glute bridge', tr: 'Köprü (kalça)' },
    description: {
      ru: 'Подъём таза лёжа на спине. Изолированно включает ягодицы.',
      en: 'Hip raise lying on your back. Isolates the glutes.',
      tr: 'Sırtüstü kalça kaldırma. Kalçayı izole eder.',
    },
    primary: ['glutes'],
    secondary: ['hamstrings'],
  },
  lunges: {
    name: { ru: 'Выпады', en: 'Lunges', tr: 'Lunge' },
    description: {
      ru: 'Выпады поочерёдно на каждую ногу. Квадрицепсы, ягодицы и баланс.',
      en: 'Alternating lunges. Quads, glutes and balance.',
      tr: 'Dönüşümlü lunge. Ön bacak, kalça ve denge.',
    },
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'adductors'],
  },
  row: {
    name: { ru: 'Тяга в наклоне', en: 'Bent-over row', tr: 'Eğik kürek' },
    description: {
      ru: 'Тяга к поясу в наклоне (гантели/резинка). Работают широчайшие и трапеции.',
      en: 'Bent-over row to the waist (dumbbells/band). Works the lats and traps.',
      tr: 'Eğilerek kürek. Sırt ve trapez.',
    },
    primary: ['lats', 'traps'],
    secondary: ['biceps', 'shoulders'],
  },
  hinge: {
    name: { ru: 'Наклон на прямых ногах', en: 'Straight-leg hinge', tr: 'Düz bacak öne eğilme' },
    description: {
      ru: 'Наклон корпуса с отведением таза назад на слегка согнутых ногах. Задняя поверхность бедра и ягодицы.',
      en: 'Hip hinge with the pelvis pushed back on slightly bent legs. Hamstrings and glutes.',
      tr: 'Kalçayı geriye iterek öne eğilme. Arka bacak ve kalça.',
    },
    primary: ['hamstrings', 'glutes'],
    secondary: ['lowerBack'],
  },
  shoulderPress: {
    name: { ru: 'Жим над головой', en: 'Overhead press', tr: 'Omuz press' },
    description: {
      ru: 'Жим гантелей или резинки над головой. Дельтовидные и трицепс.',
      en: 'Overhead press with dumbbells or a band. Shoulders and triceps.',
      tr: 'Baş üstü press. Omuz ve arka kol.',
    },
    primary: ['shoulders'],
    secondary: ['triceps', 'traps'],
  },
  coreBlock: {
    name: { ru: 'Блок на кор', en: 'Core block', tr: 'Core bloğu' },
    description: {
      ru: 'Небольшой комплекс на мышцы кора в конце тренировки. Сильный кор стабилизирует корпус.',
      en: 'A short core block to finish. A strong core stabilises the torso.',
      tr: 'Bitişte kısa core bloğu. Güçlü core gövdeyi sabitler.',
    },
    primary: ['abs', 'obliques'],
    secondary: ['lowerBack'],
  },
} satisfies Record<string, BaseExercise>;

type LibKey = keyof typeof LIB;

/** Instantiate a library exercise with a workout-specific prescription/note. */
function ex(key: LibKey, prescription: Bi, note?: Bi): Exercise {
  const base: BaseExercise = LIB[key];
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

const p = (ru: string, en: string, tr?: string): Bi => ({ ru, en, tr });

// ---------------------------------------------------------------------------
// Courses — one neutral demo program.
// ---------------------------------------------------------------------------

const demoCourse: Course = {
  id: 'course-demo',
  trainerId: 'trainer-demo',
  code: 'DEMO',
  grantedEmails: ['student@demo.app'],
  format: 'online',
  title: { ru: 'Демо-программа: всё тело', en: 'Demo program: full body', tr: 'Demo program: tüm vücut' },
  summary: {
    ru: 'Пример программы для знакомства с платформой: 3 тренировки на всё тело из базовых упражнений. Создай свою программу в кабинете тренера.',
    en: 'A sample program to explore the platform: 3 full-body sessions of basic exercises. Build your own in the trainer dashboard.',
    tr: 'Platformu keşfetmek için örnek program: temel hareketlerle 3 tam vücut antrenmanı.',
  },
  level: { ru: 'Начальный', en: 'Beginner', tr: 'Başlangıç' },
  terms: 'Демо-условия: это пример курса. Стоимость, срок доступа и оплату тренер указывает здесь. Контакт: @demo',
  feedbackForm: [
    { id: 'q1', text: 'Что понравилось в курсе?', type: 'text' },
    { id: 'q2', text: 'Оцени программу', type: 'rating' },
    { id: 'q3', text: 'Удобный формат занятий?', type: 'choice', options: ['Онлайн', 'Вживую', 'Смешанный'] },
  ],
  workouts: [
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 1 — верх тела', en: 'Workout 1 — upper body', tr: 'Antrenman 1 — üst vücut' },
      exercises: [
        ex('pushup', p('3×10', '3×10')),
        ex('row', p('3×12', '3×12')),
        ex('shoulderPress', p('3×12', '3×12')),
        ex('plank', p('3×30 сек', '3×30 sec')),
      ],
    },
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 2 — низ тела', en: 'Workout 2 — lower body', tr: 'Antrenman 2 — alt vücut' },
      exercises: [
        ex('squat', p('4×12', '4×12')),
        ex('lunges', p('3×12 / нога', '3×12 / leg')),
        ex('gluteBridge', p('4×15', '4×15')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
    {
      id: uid('wk'),
      title: { ru: 'Тренировка 3 — всё тело', en: 'Workout 3 — full body', tr: 'Antrenman 3 — tüm vücut' },
      exercises: [
        ex('hinge', p('4×12', '4×12')),
        ex('squat', p('3×12', '3×12')),
        ex('pushup', p('3×10', '3×10')),
        ex('row', p('3×12', '3×12')),
        ex('coreBlock', p('1 блок в конце', '1 block to finish')),
      ],
    },
  ],
};

export const COURSES: Course[] = [demoCourse];

// Stable ids other seed data (surveys, feedback) reference.
export const DEMO_COURSE_ID = demoCourse.id;
export const DEMO_TRAINER_ID = 'trainer-demo';
export const DEMO_WORKOUT_ID = demoCourse.workouts[0].id;

// ---------------------------------------------------------------------------
// Seed accounts — a neutral demo coach (owns the demo course) and a demo
// student (already enrolled), so the quick-login buttons have content.
// ---------------------------------------------------------------------------

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'trainer-demo',
    username: 'coach',
    name: 'Demo Coach',
    email: 'coach@demo.app',
    passHash: hash('demo1234'),
    consentAt: Date.now(),
    role: 'trainer',
    bio: 'Демо-аккаунт тренера. Создавай свои курсы, выдавай код ученикам и веди клиентов. / Demo trainer account — build your courses, share codes and manage clients.',
    brandName: 'Demo Studio',
    brandColor: '#8b5cf6',
    avatarColor: '#8b5cf6',
  },
  {
    id: 'student-demo',
    username: 'student',
    name: 'Demo Student',
    email: 'student@demo.app',
    passHash: hash('demo1234'),
    consentAt: Date.now(),
    role: 'student',
    avatarColor: '#f59e0b',
    enrolledCourseIds: ['course-demo'],
  },
];

export const DEMO_COACH = { login: 'coach', password: 'demo1234' };
export const DEMO_STUDENT = { login: 'student', password: 'demo1234' };
