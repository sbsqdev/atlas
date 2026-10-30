/* Domain model — mirrors supabase/migrations/0001_init.sql table-for-table so
   the local demo adapter can be swapped for the Postgres/Supabase adapter. */

export type Role = 'student' | 'instructor' | 'uni_admin' | 'clinic_admin' | 'super_admin';
/** Who a learner is: an athlete (runner, marathoner…) or a specialist. Athletes get a simpler app. */
export type Track = 'athlete' | 'pro';
export type OrgType = 'university' | 'clinic' | 'platform';
export type ContentStatus = 'draft' | 'medical_review' | 'approved' | 'published' | 'archived';
export type Level = 'beginner' | 'intermediate' | 'advanced';
/** A regional 3D model in public/models (see ANATOMY_MODELS). */
export type ModelId = 'knee' | 'foot';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  role: Role;
  track?: Track;
  /** Athlete access bought outside the platform (Kaspi) and granted by a signed code. */
  accessUntil?: number;
  accessPlan?: string;
  /** Athlete profile (kept on this device). */
  city?: string;
  sports?: string[];
  goal?: string;
  nextRace?: string;
  pb?: Partial<Record<'5k' | '10k' | 'half' | 'marathon', string>>;
  /** Small JPEG data URL, kept on this device. */
  photo?: string;
  about?: string;
  socials?: { instagram?: string; telegram?: string; strava?: string };
  openToMeet?: boolean;
  orgId: string | null;
  cohort?: string;
  headline?: string;
  jobPrefs?: string;
  careerVisible: boolean;
  consentAt: number;
  createdAt: number;
  demo?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  city?: string;
  createdAt: number;
  demo?: boolean;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: Level;
  description: string;
  instructorId: string;
  /** null = platform-wide catalog; otherwise restricted to one organization. */
  orgId: string | null;
  /** Who the course is for (default: specialists only). */
  audience?: Track[];
  durationMin: number;
  status: ContentStatus;
  cover: 'teal' | 'navy' | 'cyan' | 'slate';
  finalAssessmentId?: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  demo?: boolean;
}

export interface CourseModule { id: string; courseId: string; title: string; order: number }

export type LessonType = 'text' | 'video' | 'anatomy' | 'simulation' | 'quiz' | 'file';
export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  type: LessonType;
  /** Light markdown: paragraphs, "## " headings, "- " bullets, **bold**. */
  body?: string;
  videoUrl?: string;
  fileUrl?: string;
  simulationId?: string;
  assessmentId?: string;
  anatomyFocus?: string[];
  anatomyModel?: ModelId;
  /** Optional call-to-action shown under the lesson (e.g. a course chat link). */
  ctaLabel?: string;
  ctaUrl?: string;
  durationMin: number;
  order: number;
}

export interface Enrollment { id: string; userId: string; courseId: string; enrolledAt: number; completedAt?: number; lastLessonId?: string }
export interface LessonProgress { id: string; userId: string; courseId: string; lessonId: string; completedAt: number; timeSpentSec: number }

export interface Reference { title: string; source: string; url?: string }

export interface AnatomyStructure {
  id: string; // matches node name in knee.glb
  name: string;
  latin: string;
  group: 'bone' | 'muscle' | 'fascia' | 'ligament';
  region: string;
  classification: string;
  origin?: string;
  insertion?: string;
  innervation?: string;
  function: string;
  biomech: string;
  notes?: string;
  references: Reference[];
  hasModel: boolean;
  verified: boolean;
}

export type QuestionType = 'single' | 'multi' | 'match' | 'sequence' | 'identify' | 'case';
export interface Question {
  id: string;
  assessmentId: string;
  type: QuestionType;
  prompt: string;
  caseText?: string;
  /** identify: structure highlighted on the 3D model. */
  structureId?: string;
  model?: ModelId;
  options?: { id: string; text: string; correct: boolean }[];
  pairs?: { left: string; right: string }[];
  sequence?: string[];
  explanation: string;
  points: number;
}

export interface Assessment {
  id: string;
  title: string;
  courseId?: string;
  authorId: string;
  passingScore: number;
  maxAttempts: number;
  timeLimitMin: number;
  randomize: boolean;
  feedback: 'immediate' | 'after' | 'never';
  status: ContentStatus;
  createdAt: number;
}

export type AnswerValue = string | string[] | Record<string, string>;
export interface AssessmentAttempt {
  id: string;
  userId: string;
  assessmentId: string;
  courseId?: string;
  answers: Record<string, AnswerValue>;
  score: number;
  passed: boolean;
  attemptNo: number;
  startedAt: number;
  completedAt: number;
  durationSec: number;
  feedback?: string;
}

/* ---------- Simulation engine (data-driven) ---------- */
export type SimCategory = 'functional' | 'biomech' | 'injuries' | 'postsurgical' | 'assessment' | 'cases' | 'surgical';
export interface SimOption { id: string; text: string; correct: boolean; feedback: string }
export type SimNode =
  | { id: string; kind: 'explore'; title: string; text: string; targets: string[] }
  | { id: string; kind: 'movement'; title: string; text: string; question: string; options: SimOption[]; objective: string }
  | { id: string; kind: 'decision'; title: string; text: string; options: SimOption[]; objective: string; multi?: boolean };

export interface Simulation {
  id: string;
  title: string;
  category: SimCategory;
  difficulty: 1 | 2 | 3;
  durationMin: number;
  objectives: string[];
  context: string;
  requiredKnowledge: string[];
  anatomy: string[];
  courseId?: string;
  available: boolean;
  status: ContentStatus;
  nodes: SimNode[];
  reading: Reference[];
}

export interface SimulationAttempt {
  id: string;
  userId: string;
  simulationId: string;
  score: number;
  maxScore: number;
  decisions: { nodeId: string; optionIds: string[]; correct: boolean }[];
  completedAt: number;
  durationSec: number;
}

/* ---------- Virtual patients ---------- */
export interface VirtualPatient {
  id: string;
  title: string;
  patient: { alias: string; age: number; sex: 'м' | 'ж'; occupation: string };
  scenario: string;
  objectives: string[];
  anatomy: string[];
  history: { id: string; q: string; a: string; relevant: boolean }[];
  exams: { id: string; name: string; finding: string; relevant: boolean }[];
  questions: { id: string; prompt: string; options: SimOption[] }[];
  status: ContentStatus;
}
export interface PatientAttempt {
  id: string;
  userId: string;
  caseId: string;
  asked: string[];
  requested: string[];
  answers: Record<string, string>;
  score: number;
  maxScore: number;
  completedAt: number;
}

/* ---------- Classroom ---------- */
export interface ClassGroup { id: string; orgId: string; instructorId: string; name: string; cohort: string; studentIds: string[]; createdAt: number }
export interface Assignment { id: string; classId: string; kind: 'course' | 'simulation' | 'assessment'; refId: string; dueAt?: number; createdAt: number }
export interface Feedback { id: string; instructorId: string; studentId: string; text: string; createdAt: number }

/* ---------- Credentials ---------- */
export interface Certificate { id: string; userId: string; courseId: string; courseTitle: string; issuedAt: number; code: string }

/* ---------- Commercial ---------- */
export type PlanId = 'student' | 'professional' | 'university' | 'clinic' | 'enterprise';
export type Entitlement = 'courses.basic' | 'courses.advanced' | 'simulations' | 'virtual_patients' | 'assessments.extra' | 'classes' | 'org.analytics' | 'org.employees' | 'custom.library' | 'integrations';
export interface Plan { id: PlanId; name: string; priceKzt: number | null; perSeat: boolean; audience: string; features: string[]; entitlements: Entitlement[] }
export interface Subscription {
  id: string;
  orgId: string | null;
  userId: string | null;
  planId: PlanId;
  status: 'pilot' | 'active' | 'requested' | 'cancelled';
  seats: number;
  startedAt: number;
  endsAt: number;
  source: 'manual_pilot' | 'payment';
  activatedBy?: string;
}

/* ---------- Governance ---------- */
export interface ContentReview { id: string; entity: 'course' | 'assessment' | 'simulation'; entityId: string; from: ContentStatus; to: ContentStatus; byUserId: string; note?: string; at: number }
export interface AuditLog { id: string; actorId: string | null; action: string; entity: string; entityId?: string; at: number; meta?: string }
export interface Notification { id: string; userId: string; text: string; link?: string; read: boolean; at: number }
export interface AnatomyView { userId: string; structureId: string; at: number }
export interface ActivityLog { userId: string; kind: 'lesson' | 'simulation' | 'assessment' | 'anatomy' | 'patient'; at: number; minutes: number }
