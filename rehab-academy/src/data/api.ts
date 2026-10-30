import { DAY, db, uid, useDb, useSession, write } from './db';
import { hashPassword, newSalt, tempPassword } from './crypto';
import { assertCan, can, canSeeCourse, courseEntitlement, ForbiddenError, sameOrg } from './rbac';
import { gradeAttempt } from './grading';
import { seedDemo } from './seed';
import { PLAN_BY_ID } from './content/plans';
import type { AccessGrant } from './access';
import type {
  ActivityLog, AnswerValue, Assessment, AssessmentAttempt, Course, CourseModule, ContentStatus, Entitlement, Lesson, OrgType, PatientAttempt, PlanId, Question, Role, SimulationAttempt, Subscription, User, Track,
} from './types';

/* Service layer. Every mutation re-reads the current user and enforces RBAC
   and organization isolation before writing. */

export class ApiError extends Error {}

export function currentUser(): User | null {
  const id = useSession.getState().userId;
  return id ? db().users.find((u) => u.id === id) ?? null : null;
}
export function useMe(): User | null {
  const id = useSession((s) => s.userId);
  return useDb((s) => (id ? s.users.find((u) => u.id === id) ?? null : null));
}
function me(): User {
  const u = currentUser();
  if (!u) throw new ForbiddenError('auth');
  return u;
}
function audit(action: string, entity: string, entityId?: string, meta?: string) {
  write((t) => ({ audit: [{ id: uid('au'), actorId: currentUser()?.id ?? null, action, entity, entityId, at: Date.now(), meta }, ...t.audit] }));
}
function notify(userIds: string[], text: string, link?: string) {
  const at = Date.now();
  write((t) => ({ notifications: [...userIds.map((userId) => ({ id: uid('n'), userId, text, link, read: false, at })), ...t.notifications] }));
}
function logActivity(kind: ActivityLog['kind'], minutes: number) {
  const u = currentUser();
  if (u) write((t) => ({ activity: [...t.activity, { userId: u.id, kind, at: Date.now(), minutes }] }));
}

/* ---------------- Auth ---------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(email: string, password: string) {
  const u = db().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || (await hashPassword(password, u.salt)) !== u.passwordHash) throw new ApiError('auth.err.invalid');
  useSession.setState({ userId: u.id });
  audit('auth.login', 'user', u.id);
  return u;
}

export async function register(input: { email: string; password: string; fullName: string; role: 'athlete' | 'student' | 'instructor'; consent: boolean }) {
  const email = input.email.trim().toLowerCase();
  if (!input.fullName.trim()) throw new ApiError('auth.err.name');
  if (!EMAIL_RE.test(email)) throw new ApiError('auth.err.email');
  if (input.password.length < 8) throw new ApiError('auth.err.weak');
  if (!input.consent) throw new ApiError('auth.err.consent');
  if (db().users.some((u) => u.email === email)) throw new ApiError('auth.err.exists');
  // Self-registration is limited to learner/instructor roles; admin roles are provisioned by the platform.
  const role: Role = input.role === 'instructor' ? 'instructor' : 'student';
  const track: Track = input.role === 'athlete' ? 'athlete' : 'pro';
  const salt = newSalt();
  const u: User = {
    id: uid('u'), email, fullName: input.fullName.trim(), role, track, orgId: null, salt, passwordHash: await hashPassword(input.password, salt),
    careerVisible: false, consentAt: Date.now(), createdAt: Date.now(),
  };
  write((t) => ({ users: [...t.users, u] }));
  useSession.setState({ userId: u.id });
  audit('auth.register', 'user', u.id, role);
  return u;
}

export function logout() {
  useSession.setState({ userId: null });
}

/* ---------------- Entitlements ---------------- */
export function activeSubscriptions(u: User, now = Date.now()): Subscription[] {
  return db().subscriptions.filter((s) => (s.status === 'pilot' || s.status === 'active') && s.endsAt > now && ((s.orgId && s.orgId === u.orgId) || s.userId === u.id));
}
export function entitlements(u: User | null): Set<Entitlement> {
  const set = new Set<Entitlement>(['courses.basic']); // basic catalog is free
  if (!u) return set;
  if (u.role === 'super_admin' || u.role === 'instructor') {
    // Authors and platform staff need full access to build and review content.
    Object.values(PLAN_BY_ID).forEach((p) => p.entitlements.forEach((e) => set.add(e)));
    return set;
  }
  for (const s of activeSubscriptions(u)) PLAN_BY_ID[s.planId].entitlements.forEach((e) => set.add(e));
  return set;
}
export const hasEnt = (u: User | null, e: Entitlement) => entitlements(u).has(e);
export function canOpenCourse(u: User, c: Course) {
  return canSeeCourse(u, c) && (c.instructorId === u.id || hasEnt(u, courseEntitlement(c)));
}

/* ---------------- Learning ---------------- */
export function visibleCourses(u: User) {
  return db().courses.filter((c) => canSeeCourse(u, c));
}

export function enroll(courseId: string) {
  const u = me();
  const c = db().courses.find((x) => x.id === courseId);
  if (!c || !canSeeCourse(u, c)) throw new ForbiddenError('course');
  if (!canOpenCourse(u, c)) throw new ApiError('err.entitlement');
  if (db().enrollments.some((e) => e.userId === u.id && e.courseId === courseId)) return;
  write((t) => ({ enrollments: [...t.enrollments, { id: uid('en'), userId: u.id, courseId, enrolledAt: Date.now() }] }));
}

export function courseLessons(courseId: string): Lesson[] {
  const mods = db().modules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order);
  return mods.flatMap((m) => db().lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order));
}

export function completeLesson(courseId: string, lessonId: string, timeSpentSec: number) {
  const u = me();
  if (!db().enrollments.some((e) => e.userId === u.id && e.courseId === courseId)) throw new ForbiddenError('enrollment');
  if (db().progress.some((p) => p.userId === u.id && p.lessonId === lessonId)) return;
  const lesson = db().lessons.find((l) => l.id === lessonId);
  write((t) => ({ progress: [...t.progress, { id: uid('lp'), userId: u.id, courseId, lessonId, completedAt: Date.now(), timeSpentSec }] }));
  logActivity('lesson', Math.max(1, Math.round(timeSpentSec / 60)) || lesson?.durationMin || 1);
  maybeIssueCertificate(u.id, courseId);
}

export function courseStatus(userId: string, courseId: string) {
  const lessons = courseLessons(courseId);
  const done = new Set(db().progress.filter((p) => p.userId === userId && p.courseId === courseId).map((p) => p.lessonId));
  const c = db().courses.find((x) => x.id === courseId);
  const finalPassed = !c?.finalAssessmentId || db().attempts.some((a) => a.userId === userId && a.assessmentId === c.finalAssessmentId && a.passed);
  const completedLessons = lessons.filter((l) => done.has(l.id)).length;
  const pct = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
  return { lessons, done, completedLessons, pct, finalPassed, complete: lessons.length > 0 && completedLessons === lessons.length && finalPassed };
}

function maybeIssueCertificate(userId: string, courseId: string) {
  const st = courseStatus(userId, courseId);
  if (!st.complete) return;
  if (db().certificates.some((c) => c.userId === userId && c.courseId === courseId)) return;
  const course = db().courses.find((c) => c.id === courseId)!;
  const code = `RA-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  write((t) => ({
    certificates: [...t.certificates, { id: uid('cert'), userId, courseId, courseTitle: course.title, issuedAt: Date.now(), code }],
    enrollments: t.enrollments.map((e) => (e.userId === userId && e.courseId === courseId ? { ...e, completedAt: Date.now() } : e)),
  }));
  notify([userId], `Курс «${course.title}» завершён — сертификат выдан`, '/certificates');
}

/* ---------------- Assessments ---------------- */
export function questionsFor(assessmentId: string) {
  return db().questions.filter((q) => q.assessmentId === assessmentId);
}
export function canTakeAssessment(u: User, a: Assessment) {
  if (a.authorId === u.id || u.role === 'super_admin') return true;
  if (a.status !== 'published') return false;
  if (!a.courseId) return true;
  const c = db().courses.find((x) => x.id === a.courseId);
  return !!c && canOpenCourse(u, c);
}
export function attemptsLeft(u: User, a: Assessment) {
  const used = db().attempts.filter((x) => x.userId === u.id && x.assessmentId === a.id).length;
  return a.maxAttempts > 0 ? Math.max(0, a.maxAttempts - used) : Infinity;
}

export function submitAttempt(assessmentId: string, answers: Record<string, AnswerValue>, startedAt: number): AssessmentAttempt {
  const u = me();
  const a = db().assessments.find((x) => x.id === assessmentId);
  if (!a || !canTakeAssessment(u, a)) throw new ForbiddenError('assessment');
  if (attemptsLeft(u, a) <= 0) throw new ApiError('tests.noAttempts');
  const qs = questionsFor(assessmentId);
  const score = gradeAttempt(qs, answers);
  const used = db().attempts.filter((x) => x.userId === u.id && x.assessmentId === a.id).length;
  const now = Date.now();
  const at: AssessmentAttempt = {
    id: uid('at'), userId: u.id, assessmentId, courseId: a.courseId, answers, score, passed: score >= a.passingScore,
    attemptNo: used + 1, startedAt, completedAt: now, durationSec: Math.round((now - startedAt) / 1000),
  };
  write((t) => ({ attempts: [...t.attempts, at] }));
  logActivity('assessment', Math.max(1, Math.round(at.durationSec / 60)));
  if (a.courseId && db().enrollments.some((e) => e.userId === u.id && e.courseId === a.courseId)) maybeIssueCertificate(u.id, a.courseId);
  return at;
}

/* ---------------- Simulations / patients / anatomy ---------------- */
export function saveSimAttempt(input: Omit<SimulationAttempt, 'id' | 'userId' | 'completedAt'>) {
  const u = me();
  if (!hasEnt(u, 'simulations')) throw new ApiError('err.entitlement');
  const at: SimulationAttempt = { ...input, id: uid('sa'), userId: u.id, completedAt: Date.now() };
  write((t) => ({ simAttempts: [...t.simAttempts, at] }));
  logActivity('simulation', Math.max(1, Math.round(input.durationSec / 60)));
  return at;
}
export function savePatientAttempt(input: Omit<PatientAttempt, 'id' | 'userId' | 'completedAt'>) {
  const u = me();
  if (!hasEnt(u, 'virtual_patients')) throw new ApiError('err.entitlement');
  const at: PatientAttempt = { ...input, id: uid('pa'), userId: u.id, completedAt: Date.now() };
  write((t) => ({ patientAttempts: [...t.patientAttempts, at] }));
  logActivity('patient', 10);
  return at;
}
export function logAnatomyView(structureId: string) {
  const u = currentUser();
  if (!u) return;
  write((t) => ({ anatomyViews: [...t.anatomyViews.filter((v) => !(v.userId === u.id && v.structureId === structureId)), { userId: u.id, structureId, at: Date.now() }].slice(-200) }));
}

/* ---------------- Authoring & review ---------------- */
function editableCourse(courseId: string) {
  const u = me();
  assertCan(u, 'course.author');
  const c = db().courses.find((x) => x.id === courseId);
  if (!c) throw new ApiError('err.notFound');
  if (c.instructorId !== u.id && u.role !== 'super_admin') throw new ForbiddenError('course.owner');
  if (c.status !== 'draft') throw new ApiError('builder.lockedReview');
  return c;
}
const touch = (courseId: string) => write((t) => ({ courses: t.courses.map((c) => (c.id === courseId ? { ...c, updatedAt: Date.now() } : c)) }));

export function createCourse(input: Pick<Course, 'title' | 'category' | 'level' | 'description' | 'durationMin' | 'audience'>) {
  const u = me();
  assertCan(u, 'course.author');
  const now = Date.now();
  const c: Course = {
    ...input, id: uid('c'), instructorId: u.id, orgId: u.role === 'super_admin' ? null : u.orgId, status: 'draft', cover: 'slate',
    createdAt: now, updatedAt: now, version: 1,
  };
  write((t) => ({ courses: [...t.courses, c] }));
  audit('course.create', 'course', c.id, c.title);
  return c;
}
export function updateCourse(courseId: string, patch: Partial<Pick<Course, 'title' | 'category' | 'level' | 'description' | 'durationMin' | 'cover' | 'finalAssessmentId'>>) {
  editableCourse(courseId);
  write((t) => ({ courses: t.courses.map((c) => (c.id === courseId ? { ...c, ...patch, updatedAt: Date.now() } : c)) }));
}
export function addModule(courseId: string, title: string) {
  editableCourse(courseId);
  const order = db().modules.filter((m) => m.courseId === courseId).length + 1;
  const m: CourseModule = { id: uid('m'), courseId, title, order };
  write((t) => ({ modules: [...t.modules, m] }));
  touch(courseId);
  return m;
}
export function renameModule(moduleId: string, title: string) {
  const m = db().modules.find((x) => x.id === moduleId)!;
  editableCourse(m.courseId);
  write((t) => ({ modules: t.modules.map((x) => (x.id === moduleId ? { ...x, title } : x)) }));
}
export function deleteModule(moduleId: string) {
  const m = db().modules.find((x) => x.id === moduleId)!;
  editableCourse(m.courseId);
  write((t) => ({ modules: t.modules.filter((x) => x.id !== moduleId), lessons: t.lessons.filter((l) => l.moduleId !== moduleId) }));
}
export function saveLesson(lesson: Omit<Lesson, 'id' | 'order'> & { id?: string }) {
  editableCourse(lesson.courseId);
  if (lesson.id) {
    write((t) => ({ lessons: t.lessons.map((l) => (l.id === lesson.id ? { ...l, ...lesson, id: l.id, order: l.order } : l)) }));
  } else {
    const order = db().lessons.filter((l) => l.moduleId === lesson.moduleId).length + 1;
    write((t) => ({ lessons: [...t.lessons, { ...lesson, id: uid('l'), order }] }));
  }
  touch(lesson.courseId);
}
export function deleteLesson(lessonId: string) {
  const l = db().lessons.find((x) => x.id === lessonId)!;
  editableCourse(l.courseId);
  write((t) => ({ lessons: t.lessons.filter((x) => x.id !== lessonId) }));
}
export function moveLesson(lessonId: string, dir: -1 | 1) {
  const l = db().lessons.find((x) => x.id === lessonId)!;
  editableCourse(l.courseId);
  const sib = db().lessons.filter((x) => x.moduleId === l.moduleId).sort((a, b) => a.order - b.order);
  const i = sib.findIndex((x) => x.id === lessonId);
  const j = i + dir;
  if (j < 0 || j >= sib.length) return;
  const a = sib[i], b = sib[j];
  write((t) => ({ lessons: t.lessons.map((x) => (x.id === a.id ? { ...x, order: b.order } : x.id === b.id ? { ...x, order: a.order } : x)) }));
}

export function createAssessment(courseId: string, input: Pick<Assessment, 'title' | 'passingScore' | 'maxAttempts' | 'timeLimitMin' | 'randomize' | 'feedback'>) {
  editableCourse(courseId);
  const a: Assessment = { ...input, id: uid('as'), courseId, authorId: me().id, status: 'draft', createdAt: Date.now() };
  write((t) => ({ assessments: [...t.assessments, a] }));
  return a;
}
function editableAssessment(assessmentId: string) {
  const a = db().assessments.find((x) => x.id === assessmentId);
  if (!a) throw new ApiError('err.notFound');
  if (a.courseId) editableCourse(a.courseId);
  else if (a.authorId !== me().id) throw new ForbiddenError('assessment.owner');
  return a;
}
export function updateAssessment(assessmentId: string, patch: Partial<Pick<Assessment, 'title' | 'passingScore' | 'maxAttempts' | 'timeLimitMin' | 'randomize' | 'feedback'>>) {
  editableAssessment(assessmentId);
  write((t) => ({ assessments: t.assessments.map((a) => (a.id === assessmentId ? { ...a, ...patch } : a)) }));
}
export function saveQuestion(q: Omit<Question, 'id'> & { id?: string }) {
  editableAssessment(q.assessmentId);
  if (q.id) write((t) => ({ questions: t.questions.map((x) => (x.id === q.id ? ({ ...q, id: x.id } as Question) : x)) }));
  else write((t) => ({ questions: [...t.questions, { ...q, id: uid('q') } as Question] }));
}
export function deleteQuestion(id: string) {
  const q = db().questions.find((x) => x.id === id)!;
  editableAssessment(q.assessmentId);
  write((t) => ({ questions: t.questions.filter((x) => x.id !== id) }));
}

/** Content workflow: Draft → Medical review → Approved → Published → Archived. */
const AUTHOR_MOVES: Partial<Record<ContentStatus, ContentStatus[]>> = { draft: ['medical_review', 'archived'], archived: ['draft'], published: ['archived'] };
const REVIEW_MOVES: Partial<Record<ContentStatus, ContentStatus[]>> = {
  medical_review: ['approved', 'draft'], approved: ['published', 'draft'], published: ['archived'], archived: ['draft'], draft: ['archived'],
};
export function allowedMoves(u: User, c: Course): ContentStatus[] {
  const set = new Set<ContentStatus>();
  if (c.instructorId === u.id && can(u, 'course.author')) (AUTHOR_MOVES[c.status] ?? []).forEach((s) => set.add(s));
  if (can(u, 'course.review')) (REVIEW_MOVES[c.status] ?? []).forEach((s) => set.add(s));
  return [...set];
}
export function transitionCourse(courseId: string, to: ContentStatus, note?: string) {
  const u = me();
  const c = db().courses.find((x) => x.id === courseId);
  if (!c) throw new ApiError('err.notFound');
  if (!allowedMoves(u, c).includes(to)) throw new ForbiddenError('transition');
  if (to === 'medical_review' && courseLessons(courseId).length === 0) throw new ApiError('err.emptyCourse');
  write((t) => ({
    courses: t.courses.map((x) => (x.id === courseId ? { ...x, status: to, updatedAt: Date.now(), version: to === 'published' ? x.version + (x.status === 'approved' ? 0 : 1) : x.version } : x)),
    // The course's tests follow its lifecycle so learners never see unreviewed questions.
    assessments: t.assessments.map((a) => (a.courseId === courseId ? { ...a, status: to } : a)),
    reviews: [...t.reviews, { id: uid('rv'), entity: 'course', entityId: courseId, from: c.status, to, byUserId: u.id, note, at: Date.now() }],
  }));
  audit(`course.${to}`, 'course', courseId, note);
  if (to === 'medical_review') notify(db().users.filter((x) => x.role === 'super_admin').map((x) => x.id), `Курс «${c.title}» отправлен на медицинскую проверку`, '/admin/review');
  else if (u.id !== c.instructorId) notify([c.instructorId], `Статус курса «${c.title}» изменён`, `/teach/builder/${courseId}`);
}

/* ---------------- Classroom ---------------- */
function ownClass(classId: string) {
  const u = me();
  assertCan(u, 'class.manage');
  const c = db().classes.find((x) => x.id === classId);
  if (!c || !sameOrg(u, c.orgId) || (u.role === 'instructor' && c.instructorId !== u.id)) throw new ForbiddenError('class');
  return { u, c };
}
export function createClass(name: string, cohort: string) {
  const u = me();
  assertCan(u, 'class.manage');
  if (!u.orgId) throw new ApiError('err.noOrg');
  const c = { id: uid('cls'), orgId: u.orgId, instructorId: u.id, name, cohort, studentIds: [], createdAt: Date.now() };
  write((t) => ({ classes: [...t.classes, c] }));
  audit('class.create', 'class', c.id, name);
  return c;
}
export function addStudentToClass(classId: string, email: string) {
  const { c } = ownClass(classId);
  const s = db().users.find((x) => x.email === email.trim().toLowerCase() && x.orgId === c.orgId && x.role === 'student');
  if (!s) throw new ApiError('cls.err.noUser');
  if (c.studentIds.includes(s.id)) return;
  write((t) => ({ classes: t.classes.map((x) => (x.id === classId ? { ...x, studentIds: [...x.studentIds, s.id] } : x)) }));
}
export function removeStudentFromClass(classId: string, studentId: string) {
  ownClass(classId);
  write((t) => ({ classes: t.classes.map((x) => (x.id === classId ? { ...x, studentIds: x.studentIds.filter((i) => i !== studentId) } : x)) }));
}
export function assign(classId: string, kind: 'course' | 'simulation' | 'assessment', refId: string, title: string, dueAt?: number) {
  const { c } = ownClass(classId);
  write((t) => ({ assignments: [...t.assignments, { id: uid('asg'), classId, kind, refId, dueAt, createdAt: Date.now() }] }));
  const link = kind === 'course' ? `/courses/${refId}` : kind === 'simulation' ? `/simulations/${refId}` : `/assessments/${refId}`;
  notify(c.studentIds, `Новое задание: «${title}»`, link);
  audit('assignment.create', 'class', classId, `${kind}:${refId}`);
}
export function deleteAssignment(id: string) {
  const a = db().assignments.find((x) => x.id === id)!;
  ownClass(a.classId);
  write((t) => ({ assignments: t.assignments.filter((x) => x.id !== id) }));
}
export function sendFeedback(studentId: string, text: string) {
  const u = me();
  assertCan(u, 'class.manage');
  const s = db().users.find((x) => x.id === studentId);
  if (!s || !sameOrg(u, s.orgId)) throw new ForbiddenError('student');
  write((t) => ({ feedback: [...t.feedback, { id: uid('fb'), instructorId: u.id, studentId, text, createdAt: Date.now() }] }));
  notify([studentId], 'Преподаватель оставил вам отзыв', '/progress');
}

/* ---------------- Organization admin ---------------- */
export function orgSeats(orgId: string) {
  const sub = db().subscriptions.find((s) => s.orgId === orgId && (s.status === 'pilot' || s.status === 'active') && s.endsAt > Date.now());
  const used = db().users.filter((u) => u.orgId === orgId && (u.role === 'student' || u.role === 'instructor')).length;
  return { sub, used, total: sub?.seats ?? 0 };
}
export async function createOrgUser(input: { email: string; fullName: string; role: 'student' | 'instructor'; cohort?: string }) {
  const u = me();
  assertCan(u, 'org.manage');
  if (!u.orgId) throw new ForbiddenError('org');
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ApiError('auth.err.email');
  if (!input.fullName.trim()) throw new ApiError('auth.err.name');
  if (db().users.some((x) => x.email === email)) throw new ApiError('auth.err.exists');
  const seats = orgSeats(u.orgId);
  if (!seats.sub || seats.used >= seats.total) throw new ApiError('err.noSeats');
  const pwd = tempPassword();
  const salt = newSalt();
  const nu: User = {
    id: uid('u'), email, fullName: input.fullName.trim(), role: input.role, orgId: u.orgId, cohort: input.cohort || undefined, salt,
    passwordHash: await hashPassword(pwd, salt), careerVisible: false, consentAt: 0, createdAt: Date.now(),
  };
  write((t) => ({ users: [...t.users, nu] }));
  audit('org.user_create', 'user', nu.id, input.role);
  return { user: nu, tempPassword: pwd };
}
export function setUserCohort(userId: string, cohort: string) {
  const u = me();
  assertCan(u, 'org.manage');
  const target = db().users.find((x) => x.id === userId);
  if (!target || !sameOrg(u, target.orgId)) throw new ForbiddenError('user');
  write((t) => ({ users: t.users.map((x) => (x.id === userId ? { ...x, cohort } : x)) }));
}
export function assignCourseToOrgMembers(courseId: string, userIds: string[]) {
  const u = me();
  assertCan(u, 'org.manage');
  const c = db().courses.find((x) => x.id === courseId);
  if (!c) throw new ApiError('err.notFound');
  const targets = db().users.filter((x) => userIds.includes(x.id) && sameOrg(u, x.orgId));
  write((t) => ({
    enrollments: [...t.enrollments, ...targets.filter((x) => !t.enrollments.some((e) => e.userId === x.id && e.courseId === courseId)).map((x) => ({ id: uid('en'), userId: x.id, courseId, enrolledAt: Date.now() }))],
  }));
  notify(targets.map((x) => x.id), `Вам назначен курс «${c.title}»`, `/courses/${courseId}`);
  audit('org.assign_course', 'course', courseId, `${targets.length} users`);
}

/* ---------------- Platform admin ---------------- */
export function createOrg(name: string, type: OrgType, city?: string) {
  const u = me();
  assertCan(u, 'platform.admin');
  const o = { id: uid('org'), name, type, city, createdAt: Date.now() };
  write((t) => ({ orgs: [...t.orgs, o] }));
  audit('org.create', 'organization', o.id, name);
  return o;
}
export async function createOrgAdmin(orgId: string, email: string, fullName: string) {
  const u = me();
  assertCan(u, 'platform.admin');
  const org = db().orgs.find((o) => o.id === orgId);
  if (!org || org.type === 'platform') throw new ApiError('err.notFound');
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) throw new ApiError('auth.err.email');
  if (db().users.some((x) => x.email === e)) throw new ApiError('auth.err.exists');
  const pwd = tempPassword();
  const salt = newSalt();
  const nu: User = {
    id: uid('u'), email: e, fullName, role: org.type === 'clinic' ? 'clinic_admin' : 'uni_admin', orgId, salt,
    passwordHash: await hashPassword(pwd, salt), careerVisible: false, consentAt: 0, createdAt: Date.now(),
  };
  write((t) => ({ users: [...t.users, nu] }));
  audit('org.admin_create', 'user', nu.id, org.name);
  return { user: nu, tempPassword: pwd };
}
/** Manual pilot activation by platform staff. Never marks anything as paid. */
export function activatePilot(target: { orgId?: string; userId?: string }, planId: PlanId, seats: number, days: number) {
  const u = me();
  assertCan(u, 'platform.admin');
  const now = Date.now();
  const sub: Subscription = {
    id: uid('sub'), orgId: target.orgId ?? null, userId: target.userId ?? null, planId, status: 'pilot', seats,
    startedAt: now, endsAt: now + days * DAY, source: 'manual_pilot', activatedBy: u.id,
  };
  write((t) => ({
    subscriptions: [
      ...t.subscriptions.map((s) => ((target.orgId && s.orgId === target.orgId) || (target.userId && s.userId === target.userId) ? { ...s, status: s.status === 'requested' ? ('cancelled' as const) : s.status } : s)),
      sub,
    ],
  }));
  audit('subscription.pilot_activated', target.orgId ? 'organization' : 'user', target.orgId ?? target.userId, `${PLAN_BY_ID[planId].name}, ${seats} мест, ${days} дн.`);
  const recipients = target.userId ? [target.userId] : db().users.filter((x) => x.orgId === target.orgId && (x.role === 'uni_admin' || x.role === 'clinic_admin')).map((x) => x.id);
  notify(recipients, `Активирована пилотная лицензия: ${PLAN_BY_ID[planId].name}`, '/settings');
}
export function cancelSubscription(subId: string) {
  const u = me();
  assertCan(u, 'platform.admin');
  write((t) => ({ subscriptions: t.subscriptions.map((s) => (s.id === subId ? { ...s, status: 'cancelled' } : s)) }));
  audit('subscription.cancel', 'subscription', subId);
}
/** A learner or org admin asks for a pilot from the pricing page. */
export function requestPilot(planId: PlanId) {
  const u = me();
  const forOrg = (u.role === 'uni_admin' || u.role === 'clinic_admin') && u.orgId;
  const already = db().subscriptions.some((s) => s.status === 'requested' && s.planId === planId && (forOrg ? s.orgId === u.orgId : s.userId === u.id));
  if (already) return;
  write((t) => ({
    subscriptions: [...t.subscriptions, {
      id: uid('sub'), orgId: forOrg ? u.orgId : null, userId: forOrg ? null : u.id, planId, status: 'requested', seats: forOrg ? 25 : 1,
      startedAt: Date.now(), endsAt: Date.now(), source: 'manual_pilot',
    }],
  }));
  notify(db().users.filter((x) => x.role === 'super_admin').map((x) => x.id), `Заявка на пилот: ${PLAN_BY_ID[planId].name} — ${u.fullName}`, '/admin');
  audit('subscription.requested', 'subscription', undefined, planId);
}

/* ---------------- Profile / settings ---------------- */
export function updateProfile(patch: Partial<Pick<User, 'fullName' | 'headline' | 'jobPrefs' | 'careerVisible' | 'city' | 'sports' | 'goal' | 'nextRace' | 'pb'>>) {
  const u = me();
  write((t) => ({ users: t.users.map((x) => (x.id === u.id ? { ...x, ...patch } : x)) }));
  if ('careerVisible' in patch) audit('career.visibility', 'user', u.id, String(patch.careerVisible));
}
export function markNotificationsRead() {
  const u = me();
  write((t) => ({ notifications: t.notifications.map((n) => (n.userId === u.id ? { ...n, read: true } : n)) }));
}
export function exportMyData() {
  const u = me();
  const d = db();
  const mine = <T extends { userId: string }>(rows: T[]) => rows.filter((r) => r.userId === u.id);
  const { passwordHash: _h, salt: _s, ...profile } = u;
  return {
    exportedAt: new Date().toISOString(), profile,
    enrollments: mine(d.enrollments), lessonProgress: mine(d.progress), assessmentAttempts: mine(d.attempts),
    simulationAttempts: mine(d.simAttempts), patientAttempts: mine(d.patientAttempts), certificates: mine(d.certificates),
    feedback: d.feedback.filter((f) => f.studentId === u.id), activity: mine(d.activity),
  };
}
export async function resetDemo() {
  useSession.setState({ userId: null });
  await seedDemo();
}

/** Remembers where the learner stopped (autosaved on every lesson open). */
export function touchLesson(courseId: string, lessonId: string) {
  const u = currentUser();
  if (!u) return;
  write((t) => ({ enrollments: t.enrollments.map((e) => (e.userId === u.id && e.courseId === courseId ? { ...e, lastLessonId: lessonId } : e)) }));
}

/** Athletes (runners, marathoners…) get the simplified app; everyone else the specialist one. */
export const isAthlete = (u: User | null | undefined) => u?.track === 'athlete';
/** i18n key of the user's role label; athletes are shown as athletes, not students. */
export const roleKey = (u: User) => (isAthlete(u) ? 'role.athlete' : `role.${u.role}`) as `role.${string}`;
/** Courses meant for this learner's track. */
export const forTrack = (u: User, c: Course) => !isAthlete(u) || (c.audience ?? ['pro']).includes('athlete');

/* ---------------- Athlete access ----------------
   Athletes pay by Kaspi; the owner emails them a signed access code. Without
   access an athlete sees the first module of each athlete course. */
export const hasAccess = (u: User | null | undefined, now = Date.now()) => !isAthlete(u) || (u?.accessUntil ?? 0) > now;
const athleteCourse = (courseId: string) => !!db().courses.find((c) => c.id === courseId)?.audience?.includes('athlete');
export function lessonLocked(u: User, l: Lesson) {
  if (hasAccess(u) || !athleteCourse(l.courseId)) return false;
  return (db().modules.find((m) => m.id === l.moduleId)?.order ?? 1) > 1;
}
export const assessmentLocked = (u: User, a: Assessment) => !hasAccess(u) && !!a.courseId && athleteCourse(a.courseId);

/** Signs the code's owner in on this device and opens access until the code's date. */
export async function activateAccess(grant: AccessGrant, fullName: string) {
  const email = grant.email.trim().toLowerCase();
  const existing = db().users.find((x) => x.email.toLowerCase() === email);
  let id = existing?.id;
  if (existing) {
    write((t) => ({ users: t.users.map((x) => (x.id === existing.id ? { ...x, accessUntil: Math.max(x.accessUntil ?? 0, grant.until), accessPlan: grant.plan, fullName: fullName.trim() || x.fullName } : x)) }));
  } else {
    const salt = newSalt();
    const u: User = {
      id: uid('u'), email, fullName: fullName.trim() || email.split('@')[0], role: 'student', track: 'athlete', orgId: null,
      salt, passwordHash: await hashPassword(tempPassword(), salt), accessUntil: grant.until, accessPlan: grant.plan,
      careerVisible: false, consentAt: Date.now(), createdAt: Date.now(),
    };
    write((t) => ({ users: [...t.users, u] }));
    id = u.id;
  }
  useSession.setState({ userId: id! });
  audit('access.activated', 'user', id, `${grant.plan} until ${new Date(grant.until).toISOString().slice(0, 10)}`);
}
