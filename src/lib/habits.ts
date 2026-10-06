// Psychology helpers for habits (Atomic Habits: the four laws of behaviour
// change + identity-based habits). All pure, client-side — no backend needed.
import type { Habit, Lang } from '../types';

/** Local ISO day key, e.g. "2026-10-06" (local time, not UTC). */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Day of week as 0=Mon … 6=Sun (we show the week Mon-first). */
export function dayIndexMon(d: Date = new Date()): number {
  return (d.getDay() + 6) % 7;
}

/** Did the student tick this habit today? */
export function doneToday(h: Habit): boolean {
  return h.checkIns.includes(todayKey());
}

/** Consecutive-day streak ending today (or yesterday, so it survives until
 *  the day is over). Returns the length of the current run. */
export function habitStreak(checkIns: string[]): number {
  if (!checkIns.length) return 0;
  const set = new Set(checkIns);
  const cursor = new Date();
  // If today isn't done yet, start counting from yesterday so the streak
  // doesn't read 0 until the user ticks in.
  if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Completions within the last `days` days (default 30) — for consistency %. */
export function consistency(checkIns: string[], days = 30): number {
  const set = new Set(checkIns);
  let hits = 0;
  const cursor = new Date();
  for (let i = 0; i < days; i++) {
    if (set.has(todayKey(cursor))) hits += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return Math.round((hits / days) * 100);
}

/** Is a reminder scheduled for today (by the habit's remindDays)? */
export function remindsToday(h: Habit): boolean {
  if (!h.remindOn) return false;
  if (!h.remindDays || h.remindDays.length === 0) return true;
  return h.remindDays.includes(dayIndexMon());
}

/** "HH:MM" → minutes since midnight, or null if unparseable. */
export function parseTime(t?: string): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export type HabitTemplate = Partial<Habit> & { title: string };

/** Starter habits grounded in the four laws — one tap to add. */
export function habitTemplates(lang: Lang): HabitTemplate[] {
  const T: Record<Lang, HabitTemplate[]> = {
    ru: [
      { title: 'Тренировка', identity: 'Я — человек, который заботится о своём теле', time: '07:00', place: 'дома', afterHabit: 'утренний кофе', twoMinute: 'надеть форму и сделать разминку', bundle: 'включу любимый плейлист', reward: 'отметить галочку и смузи' },
      { title: '10 000 шагов', identity: 'Я — активный человек', time: '18:00', afterHabit: 'рабочий день', twoMinute: 'выйти на 5 минут', bundle: 'слушать подкаст', reward: 'закрыть кольцо активности' },
      { title: 'Стакан воды', identity: 'Я забочусь о здоровье каждый день', time: '08:00', afterHabit: 'проснулся', twoMinute: 'налить стакан воды', reward: 'отметка в трекере' },
      { title: 'Растяжка', identity: 'Я — гибкий и собранный', time: '22:00', afterHabit: 'душ', twoMinute: '2 минуты растяжки', bundle: 'спокойная музыка', reward: 'лучше сон' },
    ],
    en: [
      { title: 'Workout', identity: 'I am someone who takes care of my body', time: '07:00', place: 'home', afterHabit: 'morning coffee', twoMinute: 'put on gym clothes and warm up', bundle: 'play my favourite playlist', reward: 'check it off and a smoothie' },
      { title: '10,000 steps', identity: 'I am an active person', time: '18:00', afterHabit: 'work day', twoMinute: 'step out for 5 minutes', bundle: 'listen to a podcast', reward: 'close the activity ring' },
      { title: 'Glass of water', identity: 'I take care of my health daily', time: '08:00', afterHabit: 'waking up', twoMinute: 'pour a glass of water', reward: 'tick the tracker' },
      { title: 'Stretching', identity: 'I am flexible and composed', time: '22:00', afterHabit: 'a shower', twoMinute: '2 minutes of stretching', bundle: 'calm music', reward: 'better sleep' },
    ],
    tr: [
      { title: 'Antrenman', identity: 'Vücuduma özen gösteren biriyim', time: '07:00', place: 'evde', afterHabit: 'sabah kahvesi', twoMinute: 'spor kıyafeti giy ve ısın', bundle: 'sevdiğim çalma listesi', reward: 'işaretle ve smoothie' },
      { title: '10.000 adım', identity: 'Aktif bir insanım', time: '18:00', afterHabit: 'iş günü', twoMinute: '5 dakika dışarı çık', bundle: 'podcast dinle', reward: 'aktivite halkasını kapat' },
      { title: 'Bir bardak su', identity: 'Her gün sağlığıma özen gösteririm', time: '08:00', afterHabit: 'uyanmak', twoMinute: 'bir bardak su doldur', reward: 'takip işareti' },
      { title: 'Esneme', identity: 'Esnek ve dengeliyim', time: '22:00', afterHabit: 'duş', twoMinute: '2 dakika esneme', bundle: 'sakin müzik', reward: 'daha iyi uyku' },
    ],
  };
  return T[lang] ?? T.en;
}
