// Atomic-Habits-style gamification, computed from existing progress data.
import type { Lang } from '../types';

const XP_WORKOUT = 50;
const XP_WATCH = 5;
const LEVEL_SPAN = 250; // xp per level

export interface CourseProgress {
  totalWorkouts: number;
  doneWorkouts: number;
  totalExercises: number;
  watched: number;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  earned: boolean;
}

export interface Gamification {
  xp: number;
  level: number;
  intoLevel: number; // xp within the current level
  span: number;
  toNext: number;
  streak: number;
  last7: boolean[]; // oldest → today
  totalDone: number;
  totalWorkouts: number;
  totalWatched: number;
  badges: Badge[];
}

const tri = (ru: string, en: string, tr: string, lang: Lang) => ({ ru, en, tr }[lang]);

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Consecutive-day streak ending today or yesterday, plus a last-7-days map. */
export function streakOf(activityDays: string[]): { streak: number; last7: boolean[] } {
  const set = new Set(activityDays);
  const today = new Date();
  // last 7 days, oldest first
  const last7: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last7.push(set.has(dayKey(d)));
  }
  // streak: walk backwards from today; allow starting at yesterday if today idle
  let streak = 0;
  const start = new Date(today);
  if (!set.has(dayKey(start))) start.setDate(start.getDate() - 1);
  for (;;) {
    if (set.has(dayKey(start))) {
      streak++;
      start.setDate(start.getDate() - 1);
    } else break;
  }
  return { streak, last7 };
}

export function computeGamification(
  perCourse: CourseProgress[],
  activityDays: string[],
  lang: Lang,
): Gamification {
  const totalDone = perCourse.reduce((n, c) => n + c.doneWorkouts, 0);
  const totalWorkouts = perCourse.reduce((n, c) => n + c.totalWorkouts, 0);
  const totalWatched = perCourse.reduce((n, c) => n + c.watched, 0);
  const xp = totalDone * XP_WORKOUT + totalWatched * XP_WATCH;
  const level = Math.floor(xp / LEVEL_SPAN) + 1;
  const intoLevel = xp % LEVEL_SPAN;
  const { streak, last7 } = streakOf(activityDays);
  const anyHalf = perCourse.some((c) => c.totalWorkouts > 0 && c.doneWorkouts / c.totalWorkouts >= 0.5);
  const anyDone = perCourse.some((c) => c.totalWorkouts > 0 && c.doneWorkouts >= c.totalWorkouts);

  const badges: Badge[] = [
    { id: 'first', icon: '🌱', name: tri('Первый шаг', 'First step', 'İlk adım', lang), desc: tri('Первая тренировка выполнена', 'Completed your first workout', 'İlk antrenman tamam', lang), earned: totalDone >= 1 },
    { id: 'streak3', icon: '🔥', name: tri('Серия 3 дня', '3-day streak', '3 gün seri', lang), desc: tri('3 дня подряд', '3 days in a row', 'Üst üste 3 gün', lang), earned: streak >= 3 },
    { id: 'streak7', icon: '⚡', name: tri('Серия 7 дней', '7-day streak', '7 gün seri', lang), desc: tri('Неделя без пропусков', 'A full week, no misses', 'Kesintisiz bir hafta', lang), earned: streak >= 7 },
    { id: 'watch10', icon: '👀', name: tri('Внимательный', 'Attentive', 'Dikkatli', lang), desc: tri('Просмотрено 10 видео', 'Watched 10 videos', '10 video izlendi', lang), earned: totalWatched >= 10 },
    { id: 'half', icon: '🚀', name: tri('Половина пути', 'Halfway', 'Yarı yol', lang), desc: tri('Курс пройден наполовину', 'Half of a course done', 'Kursun yarısı', lang), earned: anyHalf },
    { id: 'finish', icon: '🏆', name: tri('Финишер', 'Finisher', 'Bitirici', lang), desc: tri('Курс пройден полностью', 'Finished a whole course', 'Bir kurs tamamlandı', lang), earned: anyDone },
    { id: 'ded12', icon: '💎', name: tri('Преданность', 'Dedicated', 'Kararlı', lang), desc: tri('12 тренировок выполнено', '12 workouts completed', '12 antrenman tamam', lang), earned: totalDone >= 12 },
  ];

  return { xp, level, intoLevel, span: LEVEL_SPAN, toNext: LEVEL_SPAN - intoLevel, streak, last7, totalDone, totalWorkouts, totalWatched, badges };
}
