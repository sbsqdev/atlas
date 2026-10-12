import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Review } from '../types';

/** Public course reviews (LOCAL for now — becomes shared with the backend so
 *  every visitor sees them). One review per student per course, editable. */
interface ReviewsState {
  reviews: Review[];
  submit: (r: { courseId: string; userId: string; userName: string; rating: number; text: string }) => void;
  remove: (id: string) => void;
  forCourse: (courseId: string) => Review[];
  mine: (courseId: string, userId: string) => Review | undefined;
}

// A couple of seed testimonials so the section doesn't look empty on day one.
const SEED: Review[] = [
  { id: 'rv-seed-1', courseId: 'course-glutes-legs', userId: 'seed-a', userName: 'Аружан', rating: 5, text: 'За 6 недель реально видно ягодицы 🍑 3D-карта помогает чувствовать нужные мышцы!', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
  { id: 'rv-seed-2', courseId: 'course-glutes-legs', userId: 'seed-b', userName: 'Камила', rating: 5, text: 'Очень удобно, что видно какие мышцы работают. Тренер отвечает в чате быстро.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 },
];

export const useReviews = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: SEED,
      submit: (r) => {
        const text = r.text.trim();
        if (!text || r.rating < 1) return;
        const review: Review = { id: `rv-${Date.now().toString(36)}`, createdAt: Date.now(), ...r, text };
        set((s) => ({
          reviews: [...s.reviews.filter((x) => !(x.courseId === r.courseId && x.userId === r.userId)), review],
        }));
      },
      remove: (id) => set((s) => ({ reviews: s.reviews.filter((x) => x.id !== id) })),
      forCourse: (courseId) => get().reviews.filter((x) => x.courseId === courseId),
      mine: (courseId, userId) => get().reviews.find((x) => x.courseId === courseId && x.userId === userId),
    }),
    { name: 'human-atlas-reviews', version: 1 },
  ),
);
