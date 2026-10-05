import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang, Role, User } from '../types';
import { SEED_TRAINER_ID } from '../data/seed';

interface AuthState {
  user: User | null;
  lang: Lang;
  login: (name: string, email: string, role: Role) => void;
  logout: () => void;
  setLang: (lang: Lang) => void;
}

/**
 * Client-side demo auth. There is no server or password — a user simply
 * identifies themselves and picks a role. Trainers created this way share the
 * seed trainer's authored courses so the dashboard has content to edit.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      lang: 'ru',
      login: (name, email, role) =>
        set({
          user: {
            // Trainers map onto the seed trainer so their dashboard is populated.
            id: role === 'trainer' ? SEED_TRAINER_ID : `student-${email || Date.now()}`,
            name: name || (role === 'trainer' ? 'Rauana Kuangaliyeva' : 'Student'),
            email,
            role,
          },
        }),
      logout: () => set({ user: null }),
      setLang: (lang) => set({ lang }),
    }),
    { name: 'human-atlas-auth' },
  ),
);
