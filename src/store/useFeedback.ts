import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEMO_COURSE_ID } from '../data/seed';
import type { FeedbackResponse } from '../types';

const c = DEMO_COURSE_ID;
const SEED: FeedbackResponse[] = [
  { id: 'fb-demo-1', courseId: c, userId: 'fbseed-a', userName: 'Аружан', answers: { q1: 'Всё понятно, 3D-карта очень помогает', q2: 5, q3: 'Онлайн' }, createdAt: Date.now() - 86400000 * 4 },
  { id: 'fb-demo-2', courseId: c, userId: 'fbseed-b', userName: 'Камила', answers: { q1: 'Хочется чуть больше кардио', q2: 4, q3: 'Смешанный' }, createdAt: Date.now() - 86400000 * 2 },
];

/** Responses to trainer-authored course feedback forms (LOCAL for now). */
interface FeedbackState {
  responses: FeedbackResponse[];
  submit: (r: { courseId: string; userId: string; userName: string; answers: Record<string, string | number | boolean> }) => void;
  forCourse: (courseId: string) => FeedbackResponse[];
  mine: (courseId: string, userId: string) => FeedbackResponse | undefined;
}

export const useFeedback = create<FeedbackState>()(
  persist(
    (set, get) => ({
      responses: SEED,
      submit: (r) => {
        const resp: FeedbackResponse = { id: `fb-${Date.now().toString(36)}`, createdAt: Date.now(), ...r };
        set((s) => ({
          responses: [...s.responses.filter((x) => !(x.courseId === r.courseId && x.userId === r.userId)), resp],
        }));
      },
      forCourse: (courseId) => get().responses.filter((x) => x.courseId === courseId),
      mine: (courseId, userId) => get().responses.find((x) => x.courseId === courseId && x.userId === userId),
    }),
    {
      name: 'human-atlas-feedback',
      version: 2,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as { responses?: FeedbackResponse[] };
        const existing = p.responses ?? [];
        const ids = new Set(existing.map((r) => r.id));
        return { responses: [...existing, ...SEED.filter((r) => !ids.has(r.id))] };
      },
    },
  ),
);
