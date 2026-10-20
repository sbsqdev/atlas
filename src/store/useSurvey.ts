import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEMO_COURSE_ID, DEMO_WORKOUT_ID } from '../data/seed';
import type { MuscleId, SurveyResponse } from '../types';

const SEED: SurveyResponse[] = [
  { id: 'sv-demo-1', workoutId: DEMO_WORKOUT_ID, courseId: DEMO_COURSE_ID, userId: 'svseed-a', userName: 'Аружан', rpe: 7, mood: 4, soreMuscles: ['chest', 'triceps'], note: 'Грудные хорошо забились 🔥', createdAt: Date.now() - 86400000 * 2 },
  { id: 'sv-demo-2', workoutId: DEMO_WORKOUT_ID, courseId: DEMO_COURSE_ID, userId: 'svseed-b', userName: 'Данияр', rpe: 5, mood: 5, soreMuscles: ['abs', 'shoulders'], note: 'В самый раз, самочувствие супер', createdAt: Date.now() - 86400000 },
];

/** Post-session survey responses (LOCAL for now — becomes shared with the
 *  backend). An offline trainer surveys their in-person group and reads the
 *  aggregate; students fill it after a live or online session. */
interface SurveyState {
  responses: SurveyResponse[];
  submit: (r: {
    workoutId: string;
    courseId: string;
    userId: string;
    userName: string;
    rpe: number;
    mood: number;
    soreMuscles: MuscleId[];
    note?: string;
  }) => void;
  forWorkout: (workoutId: string) => SurveyResponse[];
  mine: (workoutId: string, userId: string) => SurveyResponse | undefined;
}

export const useSurvey = create<SurveyState>()(
  persist(
    (set, get) => ({
      responses: SEED,
      submit: (r) => {
        const resp: SurveyResponse = {
          id: `sv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: Date.now(),
          note: r.note?.trim() || undefined,
          ...r,
        };
        // One response per user per workout — replace a previous one.
        set((s) => ({
          responses: [...s.responses.filter((x) => !(x.workoutId === r.workoutId && x.userId === r.userId)), resp],
        }));
      },
      forWorkout: (workoutId) => get().responses.filter((x) => x.workoutId === workoutId),
      mine: (workoutId, userId) => get().responses.find((x) => x.workoutId === workoutId && x.userId === userId),
    }),
    {
      name: 'human-atlas-surveys',
      version: 2,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as { responses?: SurveyResponse[] };
        const existing = p.responses ?? [];
        const ids = new Set(existing.map((r) => r.id));
        return { responses: [...existing, ...SEED.filter((r) => !ids.has(r.id))] };
      },
    },
  ),
);
