import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '../types';
import { COURSES } from '../data/seed';

export interface Comment {
  id: string;
  threadKey: string;
  authorId: string;
  authorName: string;
  role: Role;
  text: string;
  /** Optional short "video circle" (Telegram-style) as a data URL. */
  circle?: string;
  parentId?: string;
  createdAt: number;
  reactions: Record<string, string[]>; // emoji -> userIds
}

let seq = 0;
const cid = () => `c-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// Seed a short demo conversation on the first exercise so threads feel alive.
const firstExerciseId = COURSES[0]?.workouts[0]?.exercises[0]?.id ?? 'exe-seed';
const now = Date.now();
const SEED_COMMENTS: Comment[] = [
  {
    id: 'seed-1', threadKey: firstExerciseId, authorId: 'trainer-rauana', authorName: 'Rauana Kuangaliyeva', role: 'trainer',
    text: 'Держим спину прямой и чувствуем растяжение задней поверхности бедра. Как ощущения? 🙌',
    createdAt: now - 1000 * 60 * 60 * 5, reactions: { '🔥': ['student-demo'] },
  },
  {
    id: 'seed-2', threadKey: firstExerciseId, authorId: 'student-demo', authorName: 'Demo Student', role: 'student',
    text: 'Сделала 4 подхода! Немного тянет бицепс бедра, вес ок 👍', parentId: 'seed-1',
    createdAt: now - 1000 * 60 * 60 * 4, reactions: { '❤️': ['trainer-rauana'] },
  },
  {
    id: 'seed-3', threadKey: firstExerciseId, authorId: 'trainer-rauana', authorName: 'Rauana Kuangaliyeva', role: 'trainer',
    text: 'Отлично! На следующей добавим +2 кг 💪', parentId: 'seed-1',
    createdAt: now - 1000 * 60 * 60 * 3, reactions: {},
  },
];

interface CommentsState {
  comments: Comment[];
  add: (threadKey: string, author: { id: string; name: string; role: Role }, text: string, parentId?: string, circle?: string) => void;
  remove: (id: string) => void;
  react: (id: string, emoji: string, userId: string) => void;
  forThread: (threadKey: string) => Comment[];
}

export const useComments = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: SEED_COMMENTS,
      add: (threadKey, author, text, parentId, circle) => {
        const t = text.trim();
        if (!t && !circle) return;
        const comment: Comment = {
          id: cid(), threadKey, authorId: author.id, authorName: author.name, role: author.role,
          text: t, circle, parentId, createdAt: Date.now(), reactions: {},
        };
        set((s) => ({ comments: [...s.comments, comment] }));
      },
      remove: (id) => set((s) => ({ comments: s.comments.filter((c) => c.id !== id && c.parentId !== id) })),
      react: (id, emoji, userId) =>
        set((s) => ({
          comments: s.comments.map((c) => {
            if (c.id !== id) return c;
            const users = c.reactions[emoji] ?? [];
            const nextUsers = users.includes(userId) ? users.filter((u) => u !== userId) : [...users, userId];
            const reactions = { ...c.reactions, [emoji]: nextUsers };
            if (nextUsers.length === 0) delete reactions[emoji];
            return { ...c, reactions };
          }),
        })),
      forThread: (threadKey) => get().comments.filter((c) => c.threadKey === threadKey),
    }),
    { name: 'human-atlas-comments', version: 1 },
  ),
);
