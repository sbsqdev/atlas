import { DAY, type Tables } from './db';
import { gradeQuestion } from './grading';

/* Aggregations used by dashboards. All numbers are computed from stored rows;
   nothing is hard-coded. */

export function activityByDay(t: Tables, userIds: Set<string> | null, days = 7, locale = 'ru-RU') {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const from = start.getTime() - i * DAY;
    const minutes = t.activity
      .filter((a) => a.at >= from && a.at < from + DAY && (!userIds || userIds.has(a.userId)))
      .reduce((s, a) => s + a.minutes, 0);
    out.push({ day: new Date(from).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' }), minutes });
  }
  return out;
}

export function totalMinutes(t: Tables, userId: string) {
  return t.activity.filter((a) => a.userId === userId).reduce((s, a) => s + a.minutes, 0);
}

export function avg(nums: number[]) {
  return nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : null;
}

/** Best attempt per (user, assessment). */
export function bestAttempts(t: Tables, userIds: Set<string> | null) {
  const best = new Map<string, Tables['attempts'][number]>();
  for (const a of t.attempts) {
    if (userIds && !userIds.has(a.userId)) continue;
    const k = `${a.userId}:${a.assessmentId}`;
    const cur = best.get(k);
    if (!cur || a.score > cur.score) best.set(k, a);
  }
  return [...best.values()];
}

/** Questions answered incorrectly most often (share of attempts). */
export function missedQuestions(t: Tables, userIds: Set<string> | null, assessmentIds?: Set<string>, top = 5) {
  const stats = new Map<string, { wrong: number; total: number }>();
  for (const a of t.attempts) {
    if (userIds && !userIds.has(a.userId)) continue;
    if (assessmentIds && !assessmentIds.has(a.assessmentId)) continue;
    for (const q of t.questions.filter((x) => x.assessmentId === a.assessmentId)) {
      const s = stats.get(q.id) ?? { wrong: 0, total: 0 };
      s.total++;
      if (gradeQuestion(q, a.answers[q.id]) < q.points) s.wrong++;
      stats.set(q.id, s);
    }
  }
  return [...stats.entries()]
    .map(([id, s]) => ({ q: t.questions.find((x) => x.id === id)!, rate: Math.round((s.wrong / s.total) * 100), n: s.total }))
    .filter((x) => x.rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, top);
}

/** Lesson completion % for a user in a course. */
export function coursePct(t: Tables, userId: string, courseId: string) {
  const mods = new Set(t.modules.filter((m) => m.courseId === courseId).map((m) => m.id));
  const lessons = t.lessons.filter((l) => mods.has(l.moduleId));
  if (!lessons.length) return 0;
  const done = new Set(t.progress.filter((p) => p.userId === userId && p.courseId === courseId).map((p) => p.lessonId));
  return Math.round((lessons.filter((l) => done.has(l.id)).length / lessons.length) * 100);
}

export function lastActive(t: Tables, userId: string) {
  return t.activity.filter((a) => a.userId === userId).reduce((m, a) => Math.max(m, a.at), 0) || null;
}
