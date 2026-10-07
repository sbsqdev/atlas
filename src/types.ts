// Shared domain types for the Human Atlas training platform.

/** Supported interface languages. */
export type Lang = 'ru' | 'en' | 'tr';

/** A multilingual string. `ru`/`en` are required; `tr` is optional and falls
 *  back to English when a coach has not provided a Turkish translation. */
export interface Bi {
  ru: string;
  en: string;
  tr?: string;
}

/** Stable identifiers for the muscle regions we can highlight on the 3D map. */
export type MuscleId =
  | 'chest'
  | 'abs'
  | 'obliques'
  | 'lowerBack'
  | 'lats'
  | 'traps'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'abductors'
  | 'calves';

/** A muscle region: its name and which body view it shows on. */
export interface Muscle {
  id: MuscleId;
  name: Bi;
  /** front | back — which view of the body the muscle is most visible on. */
  side: 'front' | 'back' | 'both';
}

/** User roles. Trainers (coaches) author courses; students follow them. */
export type Role = 'trainer' | 'student';

/** A user account. Password is light-hashed (demo only — not real security). */
export interface Account {
  id: string;
  /** Login / display name. We store only this by default (minimal data). */
  username: string;
  name: string;
  /** Optional — only if the student chooses to add it (e.g. for email access). */
  email: string;
  passHash: string;
  role: Role;
  /** When the user accepted the offer & consented to data processing. */
  consentAt?: number;
  // Coach profile / branding:
  bio?: string;
  brandName?: string;
  brandColor?: string;
  avatarColor?: string;
  // Student enrolment:
  enrolledCourseIds?: string[];
  // Reminders (opt-in). E-mail is collected ONLY with separate consent and
  // used ONLY to send habit reminders. Browser reminders need none of this.
  remindEmail?: string;
  remindByEmail?: boolean;
  remindConsentAt?: number;
}

/** The signed-in user as exposed to the UI (no password). */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** A psychology-based habit built on the four laws of behaviour change
 *  (Atomic Habits) plus an identity statement. Stored per student. */
export interface Habit {
  id: string;
  /** The behaviour itself, e.g. "Тренировка". */
  title: string;
  /** Identity the habit builds: "Я — человек, который тренируется". */
  identity?: string;
  // 1. Make it OBVIOUS — implementation intention + habit stacking (the cue).
  time?: string;        // "07:00"
  place?: string;       // "дома / в зале"
  afterHabit?: string;  // habit stacking: "после утреннего кофе"
  // 2. Make it ATTRACTIVE — temptation bundling.
  bundle?: string;      // "включу любимый подкаст"
  // 3. Make it EASY — the 2-minute version.
  twoMinute?: string;   // "просто надеть форму и размяться"
  // 4. Make it SATISFYING — an immediate reward.
  reward?: string;      // "галочка в трекере + смузи"
  // Reminders: browser notifications now; e-mail when deployed (opt-in).
  remindOn?: boolean;
  /** Days to remind, 0=Mon … 6=Sun. Empty/undefined = every day. */
  remindDays?: number[];
  // Tracking.
  createdAt: number;
  /** ISO day strings (YYYY-MM-DD) the habit was completed. */
  checkIns: string[];
}

/** A motivating goal (Atomic Habits: tie the action to an identity, make the
 *  progress visible, celebrate completion). Stored per student. */
export interface Goal {
  id: string;
  /** The goal itself, e.g. "Тренироваться 12 раз". */
  title: string;
  /** The deeper WHY / identity that pulls you ("чтобы чувствовать себя сильной"). */
  why?: string;
  /** Target amount to reach. */
  target: number;
  /** What a unit is called ("тренировок", "раз", "дней"). */
  unit?: string;
  /** Where progress comes from: a manual counter, completed workouts, or a habit's check-ins. */
  source: 'manual' | 'workouts' | 'habit';
  /** When source === 'habit'. */
  habitId?: string;
  /** When source === 'manual'. */
  manualCount?: number;
  /** Optional target date (ISO yyyy-mm-dd). */
  deadline?: string;
  createdAt: number;
  /** Set when the goal was completed. */
  doneAt?: number;
  /** True once the completion celebration has been shown (so it fires once). */
  celebrated?: boolean;
}

/** A single exercise inside a workout. */
export interface Exercise {
  id: string;
  name: Bi;
  description: Bi;
  /** e.g. "4×12", "3×15 / side", "35 sec" */
  prescription: Bi;
  /** Optional coaching note (progression cues etc.). */
  note?: Bi;
  /** Video demonstration link (Google Drive / YouTube / …). */
  videoUrl?: string;
  /** Muscles this exercise primarily activates. */
  primary: MuscleId[];
  /** Muscles it recruits as synergists / stabilisers. */
  secondary: MuscleId[];
  /** Specific BodyParts3D part IDs the coach picked by name (highlighted too). */
  extraParts?: string[];
  /** The coach's free-text note of which muscles work (fed to auto-detect). */
  muscleNote?: string;
}

/** A workout = an ordered list of exercises. */
export interface Workout {
  id: string;
  title: Bi;
  exercises: Exercise[];
}

/** A course = a trainer's program made of workouts. */
export interface Course {
  id: string;
  trainerId: string;
  title: Bi;
  summary: Bi;
  level: Bi;
  /** Invite code students enter to enrol. Students never browse courses. */
  code: string;
  /** Emails the coach granted access to (e.g. after purchase). A matching
   *  account is auto-enrolled; an email granted before signup enrols on signup. */
  grantedEmails?: string[];
  workouts: Workout[];
}

export interface Trainer {
  id: string;
  name: string;
  bio: Bi;
  avatarColor: string;
}
