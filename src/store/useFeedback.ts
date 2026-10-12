import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedbackResponse } from '../types';

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
      responses: [],
      submit: (r) => {
        const resp: FeedbackResponse = { id: `fb-${Date.now().toString(36)}`, createdAt: Date.now(), ...r };
        set((s) => ({
          responses: [...s.responses.filter((x) => !(x.courseId === r.courseId && x.userId === r.userId)), resp],
        }));
      },
      forCourse: (courseId) => get().responses.filter((x) => x.courseId === courseId),
      mine: (courseId, userId) => get().responses.find((x) => x.courseId === courseId && x.userId === userId),
    }),
    { name: 'human-atlas-feedback', version: 1 },
  ),
);
