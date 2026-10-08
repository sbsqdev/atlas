import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** A friend (LOCAL DEMO — stored on this device only). Real cross-person
 *  friends/activity require the shared backend. */
export interface Friend {
  id: string;
  name: string;
  color: string;
  /** current day streak */
  streak: number;
  /** last 7 days activity, oldest→today */
  last7: boolean[];
  /** workouts logged this week (for the leaderboard) */
  weekly: number;
  cheered?: boolean;
}

const SEED: Friend[] = [
  { id: 'f1', name: 'Аружан', color: '#f472b6', streak: 6, last7: [true, true, true, false, true, true, true], weekly: 5, cheered: false },
  { id: 'f2', name: 'Данияр', color: '#34d399', streak: 3, last7: [false, true, true, true, false, false, true], weekly: 3, cheered: false },
  { id: 'f3', name: 'Мади', color: '#60a5fa', streak: 1, last7: [false, false, true, false, false, true, false], weekly: 2, cheered: false },
];

const COLORS = ['#f472b6', '#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#fb923c'];

interface SocialState {
  friends: Friend[];
  addFriend: (name: string) => void;
  removeFriend: (id: string) => void;
  cheer: (id: string) => void;
}

export const useSocial = create<SocialState>()(
  persist(
    (set) => ({
      friends: SEED,
      addFriend: (name) => {
        const n = name.trim().replace(/^@/, '');
        if (!n) return;
        set((s) => ({
          friends: [
            ...s.friends,
            {
              id: `f-${Date.now().toString(36)}`,
              name: n,
              color: COLORS[s.friends.length % COLORS.length],
              streak: 0,
              last7: [false, false, false, false, false, false, false],
              weekly: 0,
            },
          ],
        }));
      },
      removeFriend: (id) => set((s) => ({ friends: s.friends.filter((f) => f.id !== id) })),
      cheer: (id) => set((s) => ({ friends: s.friends.map((f) => (f.id === id ? { ...f, cheered: !f.cheered } : f)) })),
    }),
    { name: 'human-atlas-social', version: 1 },
  ),
);
