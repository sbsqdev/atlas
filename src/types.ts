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
}

/** The signed-in user as exposed to the UI (no password). */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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
