import type { Muscle, MuscleId } from '../types';

/**
 * The muscle regions the 3D atlas can highlight, with bilingual names.
 * Order is roughly top-to-bottom so lists read naturally.
 */
export const MUSCLES: Muscle[] = [
  { id: 'traps', name: { ru: 'Трапеции', en: 'Trapezius', tr: 'Trapez' }, side: 'back' },
  { id: 'shoulders', name: { ru: 'Дельтовидные', en: 'Shoulders', tr: 'Omuz (deltoid)' }, side: 'both' },
  { id: 'chest', name: { ru: 'Грудные', en: 'Chest', tr: 'Göğüs' }, side: 'front' },
  { id: 'lats', name: { ru: 'Широчайшие спины', en: 'Lats', tr: 'Sırt (latissimus)' }, side: 'back' },
  { id: 'biceps', name: { ru: 'Бицепс', en: 'Biceps', tr: 'Pazı (biceps)' }, side: 'front' },
  { id: 'triceps', name: { ru: 'Трицепс', en: 'Triceps', tr: 'Arka kol (triceps)' }, side: 'back' },
  { id: 'forearms', name: { ru: 'Предплечья', en: 'Forearms', tr: 'Ön kol' }, side: 'both' },
  { id: 'abs', name: { ru: 'Пресс (кор)', en: 'Abs (core)', tr: 'Karın (core)' }, side: 'front' },
  { id: 'obliques', name: { ru: 'Косые мышцы живота', en: 'Obliques', tr: 'Yan karın kasları' }, side: 'front' },
  { id: 'lowerBack', name: { ru: 'Разгибатели спины (поясница)', en: 'Lower back', tr: 'Bel (sırt kasları)' }, side: 'back' },
  { id: 'glutes', name: { ru: 'Ягодичные', en: 'Glutes', tr: 'Kalça' }, side: 'back' },
  { id: 'quads', name: { ru: 'Квадрицепсы', en: 'Quadriceps', tr: 'Ön bacak (quadriceps)' }, side: 'front' },
  { id: 'hamstrings', name: { ru: 'Бицепс бедра', en: 'Hamstrings', tr: 'Arka bacak (hamstring)' }, side: 'back' },
  { id: 'adductors', name: { ru: 'Приводящие бедра', en: 'Adductors', tr: 'İç bacak (adduktor)' }, side: 'front' },
  { id: 'abductors', name: { ru: 'Отводящие бедра', en: 'Abductors (glute med.)', tr: 'Dış kalça (abduktor)' }, side: 'both' },
  { id: 'calves', name: { ru: 'Икроножные', en: 'Calves', tr: 'Baldır' }, side: 'back' },
];

export const MUSCLE_BY_ID: Record<MuscleId, Muscle> = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m]),
) as Record<MuscleId, Muscle>;
