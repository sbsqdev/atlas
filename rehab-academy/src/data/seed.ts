import { DAY, EMPTY, SCHEMA_VERSION, type Tables, useDb } from './db';
import { hashPassword, newSalt } from './crypto';
import { gradeAttempt, correctAnswer } from './grading';
import { SEED_ASSESSMENTS, SEED_QUESTIONS } from './content/assessments';
import { SEED_COURSES, SEED_LESSONS, SEED_MODULES } from './content/courses';
import { RUN_ASSESSMENT, RUN_COURSE, RUN_LESSONS, RUN_MODULES, RUN_QUESTIONS } from './content/runners';
import type { AnswerValue, Organization, Role, User } from './types';
import type { I18nKey } from '@/i18n';

/* Demo seed. Every organization, person and result below is SYNTHETIC and
   flagged demo:true. No real institutions, people or metrics. */

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_ACCOUNTS: { email: string; role: Role; label: I18nKey }[] = [
  { email: 'runner@demo.example', role: 'student', label: 'role.athlete' },
  { email: 'student@demo.example', role: 'student', label: 'role.student' },
  { email: 'instructor@demo.example', role: 'instructor', label: 'role.instructor' },
  { email: 'uni@demo.example', role: 'uni_admin', label: 'role.uni_admin' },
  { email: 'clinic@demo.example', role: 'clinic_admin', label: 'role.clinic_admin' },
  { email: 'super@demo.example', role: 'super_admin', label: 'role.super_admin' },
];
export const DEMO_ATHLETE = 'runner@demo.example';

// Small deterministic PRNG so demo analytics are stable between reloads.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export async function seedDemo() {
  const now = Date.now();
  const t: Tables = structuredClone(EMPTY);

  const orgs: Organization[] = [
    { id: 'org-platform', name: 'Rehab Academy', type: 'platform', createdAt: now - 120 * DAY },
    { id: 'org-uni', name: 'Демонстрационный медицинский университет (DEMO)', type: 'university', city: 'Алматы', createdAt: now - 60 * DAY, demo: true },
    { id: 'org-clinic', name: 'Демонстрационная клиника реабилитации (DEMO)', type: 'clinic', city: 'Астана', createdAt: now - 30 * DAY, demo: true },
  ];
  t.orgs = orgs;

  async function user(id: string, email: string, fullName: string, role: Role, orgId: string | null, extra: Partial<User> = {}): Promise<User> {
    const salt = newSalt();
    return {
      id, email, fullName, role, orgId, salt, passwordHash: await hashPassword(DEMO_PASSWORD, salt),
      careerVisible: false, consentAt: now - 50 * DAY, createdAt: now - 50 * DAY, demo: true, ...extra,
    };
  }
  t.users = await Promise.all([
    user('u-super', 'super@demo.example', 'Администратор платформы (демо)', 'super_admin', 'org-platform'),
    user('u-uniadmin', 'uni@demo.example', 'Администратор университета (демо)', 'uni_admin', 'org-uni'),
    user('u-clinicadmin', 'clinic@demo.example', 'Администратор клиники (демо)', 'clinic_admin', 'org-clinic'),
    user('u-runner', DEMO_ATHLETE, 'Бегун (демо)', 'student', null, { track: 'athlete', headline: 'Полумарафон, готовлюсь к марафону' }),
    user('u-rehab', 'rehab@demo.example', 'Реабилитолог курса', 'instructor', 'org-platform', { headline: 'Спортивная реабилитация' }),
    user('u-instructor', 'instructor@demo.example', 'Преподаватель (демо)', 'instructor', 'org-uni', { headline: 'Кафедра реабилитологии (демо)' }),
    user('u-student', 'student@demo.example', 'Студент (демо)', 'student', 'org-uni', { cohort: 'Поток 2025', headline: 'Студент-реабилитолог' }),
    ...[1, 2, 3, 4, 5, 6].map((i) => user(`u-s${i}`, `s${i}@demo.example`, `Синтетический студент ${i}`, 'student', 'org-uni', { cohort: i <= 3 ? 'Поток 2025' : 'Поток 2024' })),
    user('u-employee', 'staff@demo.example', 'Сотрудник клиники (демо)', 'student', 'org-clinic'),
  ]);

  t.courses = [RUN_COURSE, ...SEED_COURSES.map((c) => ({ ...c, audience: ['pro' as const] }))].map((c) => ({ ...c, createdAt: now - 40 * DAY, updatedAt: now - 10 * DAY }));
  t.modules = [...RUN_MODULES, ...SEED_MODULES];
  t.lessons = [...RUN_LESSONS, ...SEED_LESSONS];
  t.assessments = [RUN_ASSESSMENT, ...SEED_ASSESSMENTS].map((a) => ({ ...a, createdAt: now - 40 * DAY }));
  t.questions = [...RUN_QUESTIONS, ...SEED_QUESTIONS];
  t.reviews = [
    { id: 'rv-1', entity: 'course', entityId: 'c-knee', from: 'medical_review', to: 'approved', byUserId: 'u-super', note: 'Демо-запись проверки', at: now - 35 * DAY },
    { id: 'rv-2', entity: 'course', entityId: 'c-knee', from: 'approved', to: 'published', byUserId: 'u-super', at: now - 34 * DAY },
    { id: 'rv-3', entity: 'course', entityId: 'c-acl', from: 'draft', to: 'medical_review', byUserId: 'u-instructor', at: now - 2 * DAY },
  ];

  t.subscriptions = [{
    id: 'sub-uni', orgId: 'org-uni', userId: null, planId: 'university', status: 'pilot', seats: 50,
    startedAt: now - 30 * DAY, endsAt: now + 60 * DAY, source: 'manual_pilot', activatedBy: 'u-super',
  }];

  const students = ['u-student', 'u-s1', 'u-s2', 'u-s3', 'u-s4', 'u-s5', 'u-s6'];
  t.classes = [{
    id: 'cls-1', orgId: 'org-uni', instructorId: 'u-instructor', name: 'Группа РЕАБ-21 (демо)', cohort: 'Поток 2025',
    studentIds: students, createdAt: now - 25 * DAY,
  }];
  t.assignments = [
    { id: 'as-1', classId: 'cls-1', kind: 'course', refId: 'c-knee', dueAt: now + 14 * DAY, createdAt: now - 20 * DAY },
    { id: 'as-2', classId: 'cls-1', kind: 'simulation', refId: 'sim-knee', dueAt: now + 5 * DAY, createdAt: now - 6 * DAY },
    { id: 'as-3', classId: 'cls-1', kind: 'assessment', refId: 'as-knee', dueAt: now + 10 * DAY, createdAt: now - 6 * DAY },
  ];

  // Synthetic learning history so dashboards have something real to aggregate.
  const knee = t.lessons.filter((l) => l.courseId === 'c-knee').sort((a, b) => a.moduleId.localeCompare(b.moduleId) || a.order - b.order);
  const kneeQs = t.questions.filter((q) => q.assessmentId === 'as-knee');
  students.forEach((sid, idx) => {
    const r = rng(idx + 7);
    t.enrollments.push({ id: `en-${sid}`, userId: sid, courseId: 'c-knee', enrolledAt: now - (20 - idx) * DAY });
    const done = sid === 'u-student' ? 3 : 2 + Math.floor(r() * 7);
    knee.slice(0, done).forEach((l, i) => {
      const at = now - (14 - i * 2) * DAY + Math.floor(r() * DAY);
      t.progress.push({ id: `lp-${sid}-${l.id}`, userId: sid, courseId: 'c-knee', lessonId: l.id, completedAt: at, timeSpentSec: l.durationMin * 60 });
      t.activity.push({ userId: sid, kind: 'lesson', at, minutes: l.durationMin });
    });
    if (sid !== 'u-student') {
      // One theory attempt per synthetic student; skill level varies.
      const skill = 0.45 + r() * 0.5;
      const answers: Record<string, AnswerValue> = {};
      for (const q of kneeQs) {
        if (r() < skill) answers[q.id] = correctAnswer(q);
        else answers[q.id] = q.type === 'multi' ? ['a', 'd'] : q.type === 'match' ? {} : q.type === 'sequence' ? [...(q.sequence ?? [])].reverse() : (q.options?.find((o) => !o.correct)?.id ?? '');
      }
      const score = gradeAttempt(kneeQs, answers);
      const at = now - Math.floor(r() * 6) * DAY;
      t.attempts.push({ id: `at-${sid}`, userId: sid, assessmentId: 'as-knee', courseId: 'c-knee', answers, score, passed: score >= 70, attemptNo: 1, startedAt: at - 600_000, completedAt: at, durationSec: 600 });
      t.activity.push({ userId: sid, kind: 'assessment', at, minutes: 10 });
      if (r() > 0.3) {
        const correct = 3 + Math.floor(r() * 5);
        t.simAttempts.push({ id: `sa-${sid}`, userId: sid, simulationId: 'sim-knee', score: Math.min(correct, 7), maxScore: 7, decisions: [], completedAt: at - DAY, durationSec: 900 });
        t.activity.push({ userId: sid, kind: 'simulation', at: at - DAY, minutes: 15 });
      }
    }
  });
  // Demo athlete: enrolled in the runners course, first module done.
  t.enrollments.push({ id: 'en-u-runner', userId: 'u-runner', courseId: 'c-run', enrolledAt: now - 3 * DAY, lastLessonId: 'l-r4' });
  ['l-r1', 'l-r2', 'l-r3'].forEach((lessonId, i) => {
    const l = RUN_LESSONS.find((x) => x.id === lessonId)!;
    t.progress.push({ id: `lp-u-runner-${lessonId}`, userId: 'u-runner', courseId: 'c-run', lessonId, completedAt: now - (3 - i) * DAY, timeSpentSec: l.durationMin * 60 });
    t.activity.push({ userId: 'u-runner', kind: 'lesson', at: now - (3 - i) * DAY, minutes: l.durationMin });
  });
  t.anatomyViews.push({ userId: 'u-runner', structureId: 'calcaneal_tendon', at: now - DAY }, { userId: 'u-runner', structureId: 'patella', at: now - DAY + 60_000 });
  t.simAttempts.push({ id: 'sa-u-student', userId: 'u-student', simulationId: 'sim-knee', score: 5, maxScore: 7, decisions: [], completedAt: now - 3 * DAY, durationSec: 840 });
  t.activity.push({ userId: 'u-student', kind: 'simulation', at: now - 3 * DAY, minutes: 14 });
  t.anatomyViews.push(
    { userId: 'u-student', structureId: 'patella', at: now - 2 * DAY },
    { userId: 'u-student', structureId: 'rectus_femoris', at: now - 2 * DAY + 60_000 },
    { userId: 'u-student', structureId: 'popliteus', at: now - DAY },
  );
  t.notifications.push(
    { id: 'n-1', userId: 'u-student', text: 'Преподаватель назначил симуляцию «Анатомия коленного сустава и функциональное движение»', link: '/simulations/sim-knee', read: false, at: now - 6 * DAY },
    { id: 'n-2', userId: 'u-student', text: 'Назначен итоговый тест по курсу «Функциональная анатомия коленного сустава»', link: '/assessments/as-knee', read: false, at: now - 6 * DAY },
    { id: 'n-3', userId: 'u-super', text: 'Курс «Реабилитация после реконструкции ПКС» отправлен на медицинскую проверку', link: '/admin/review', read: false, at: now - 2 * DAY },
  );
  t.feedback.push({ id: 'fb-1', instructorId: 'u-instructor', studentId: 'u-student', text: 'Хорошая работа в симуляции. Повторите тему двусуставных мышц перед итоговым тестом.', createdAt: now - 2 * DAY });
  t.audit.push({ id: 'au-1', actorId: 'u-super', action: 'subscription.pilot_activated', entity: 'organization', entityId: 'org-uni', at: now - 30 * DAY, meta: 'Тариф «Университет», 50 мест (демо)' });

  useDb.setState({ ...t, seededVersion: SCHEMA_VERSION });
}

/** Seeds on first launch (or after a schema bump / reset). */
export async function ensureSeeded() {
  if (useDb.getState().seededVersion !== SCHEMA_VERSION || useDb.getState().users.length === 0) await seedDemo();
  syncRunnersCourse();
}

/** The runners course is managed in code (content/runners.ts): refresh it on
 *  every launch so edits there (e.g. video or chat links) reach existing browsers. */
function syncRunnersCourse() {
  const keep = <T extends { id: string }>(rows: T[], fresh: T[]) => [...fresh, ...rows.filter((r) => !fresh.some((f) => f.id === r.id))];
  useDb.setState((s) => ({
    modules: keep(s.modules, RUN_MODULES),
    lessons: keep(s.lessons, RUN_LESSONS),
    questions: keep(s.questions, RUN_QUESTIONS),
    assessments: keep(s.assessments, [{ ...RUN_ASSESSMENT, createdAt: s.assessments.find((a) => a.id === RUN_ASSESSMENT.id)?.createdAt ?? Date.now() }]),
    courses: keep(s.courses, [{ ...RUN_COURSE, ...pick(s.courses.find((c) => c.id === RUN_COURSE.id)) }]),
  }));
}
const pick = (c?: { createdAt: number; updatedAt: number }) => (c ? { createdAt: c.createdAt, updatedAt: c.updatedAt } : { createdAt: Date.now(), updatedAt: Date.now() });
