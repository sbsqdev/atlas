// Shared domain types for the Human Atlas training platform.

/** Supported interface languages. */
export type Lang = 'ru' | 'en';

/** A bilingual string. Every piece of user-facing content carries both. */
export interface Bi {
  ru: string;
  en: string;
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

/** A muscle region: its bilingual name and the 3D meshes that represent it. */
export interface Muscle {
  id: MuscleId;
  name: Bi;
  /** front | back — which view of the body the muscle is most visible on. */
  side: 'front' | 'back' | 'both';
}

/** User roles. Trainers author courses; students follow them. */
export type Role = 'trainer' | 'student';

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
  workouts: Workout[];
}

export interface Trainer {
  id: string;
  name: string;
  bio: Bi;
  avatarColor: string;
}
