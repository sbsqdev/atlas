import type { Muscle, MuscleId } from '../types';

/**
 * The muscle regions the 3D atlas can highlight, with bilingual names.
 * Order is roughly top-to-bottom so lists read naturally.
 */
export const MUSCLES: Muscle[] = [
  { id: 'traps', name: { ru: 'Трапеции', en: 'Trapezius' }, side: 'back' },
  { id: 'shoulders', name: { ru: 'Дельтовидные', en: 'Shoulders' }, side: 'both' },
  { id: 'chest', name: { ru: 'Грудные', en: 'Chest' }, side: 'front' },
  { id: 'lats', name: { ru: 'Широчайшие спины', en: 'Lats' }, side: 'back' },
  { id: 'biceps', name: { ru: 'Бицепс', en: 'Biceps' }, side: 'front' },
  { id: 'triceps', name: { ru: 'Трицепс', en: 'Triceps' }, side: 'back' },
  { id: 'forearms', name: { ru: 'Предплечья', en: 'Forearms' }, side: 'both' },
  { id: 'abs', name: { ru: 'Пресс (кор)', en: 'Abs (core)' }, side: 'front' },
  { id: 'obliques', name: { ru: 'Косые мышцы живота', en: 'Obliques' }, side: 'front' },
  { id: 'lowerBack', name: { ru: 'Разгибатели спины (поясница)', en: 'Lower back' }, side: 'back' },
  { id: 'glutes', name: { ru: 'Ягодичные', en: 'Glutes' }, side: 'back' },
  { id: 'quads', name: { ru: 'Квадрицепсы', en: 'Quadriceps' }, side: 'front' },
  { id: 'hamstrings', name: { ru: 'Бицепс бедра', en: 'Hamstrings' }, side: 'back' },
  { id: 'adductors', name: { ru: 'Приводящие бедра', en: 'Adductors' }, side: 'front' },
  { id: 'abductors', name: { ru: 'Отводящие бедра', en: 'Abductors (glute med.)' }, side: 'both' },
  { id: 'calves', name: { ru: 'Икроножные', en: 'Calves' }, side: 'back' },
];

export const MUSCLE_BY_ID: Record<MuscleId, Muscle> = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m]),
) as Record<MuscleId, Muscle>;
