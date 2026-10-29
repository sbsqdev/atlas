import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ActivityLog, AnatomyView, Assessment, AssessmentAttempt, Assignment, AuditLog, Certificate, ClassGroup, ContentReview, Course,
  CourseModule, Enrollment, Feedback, Lesson, LessonProgress, Notification, Organization, PatientAttempt, Question, SimulationAttempt,
  Subscription, User,
} from './types';

/* Local persistent adapter. Each array mirrors one Postgres table in
   supabase/migrations/0001_init.sql. Swapping to Supabase means replacing the
   functions in api.ts with queries against those tables; UI code only talks
   to api.ts and the selectors. */

export interface Tables {
  users: User[];
  orgs: Organization[];
  courses: Course[];
  modules: CourseModule[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  progress: LessonProgress[];
  assessments: Assessment[];
  questions: Question[];
  attempts: AssessmentAttempt[];
  simAttempts: SimulationAttempt[];
  patientAttempts: PatientAttempt[];
  classes: ClassGroup[];
  assignments: Assignment[];
  feedback: Feedback[];
  certificates: Certificate[];
  subscriptions: Subscription[];
  reviews: ContentReview[];
  audit: AuditLog[];
  notifications: Notification[];
  anatomyViews: AnatomyView[];
  activity: ActivityLog[];
}

export const EMPTY: Tables = {
  users: [], orgs: [], courses: [], modules: [], lessons: [], enrollments: [], progress: [], assessments: [], questions: [],
  attempts: [], simAttempts: [], patientAttempts: [], classes: [], assignments: [], feedback: [], certificates: [],
  subscriptions: [], reviews: [], audit: [], notifications: [], anatomyViews: [], activity: [],
};

export const SCHEMA_VERSION = 3;

interface DbState extends Tables { seededVersion: number }

export const useDb = create<DbState>()(
  persist(() => ({ ...EMPTY, seededVersion: 0 }), {
    name: 'ra-db', version: SCHEMA_VERSION,
    // Demo data: on a schema change start over and let ensureSeeded() reseed.
    migrate: () => ({ ...EMPTY, seededVersion: 0 }),
  }),
);

export const useSession = create<{ userId: string | null }>()(persist((): { userId: string | null } => ({ userId: null }), { name: 'ra-session' }));

export const db = () => useDb.getState();
export function write(fn: (t: Tables) => Partial<Tables>) {
  useDb.setState((s) => fn(s));
}

export const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`;
export const DAY = 86_400_000;
