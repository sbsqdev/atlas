import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Lang, Role, User } from '../types';
import { SEED_ACCOUNTS } from '../data/seed';
import { hash } from './hash';
import { useStore } from './useStore';

const VERSION = 2;

type Result = { ok: boolean; error?: 'emailTaken' | 'wrongCredentials' | 'fillFields' | 'codeInvalid' | 'alreadyEnrolled' };

function project(a: Account): User {
  return { id: a.id, name: a.name, email: a.email, role: a.role };
}

interface AuthState {
  accounts: Account[];
  user: User | null;
  lang: Lang;
  /** key `${userId}:${courseId}` -> completed workout ids */
  progress: Record<string, string[]>;

  signUp: (name: string, email: string, password: string, role: Role, code?: string) => Result;
  signIn: (email: string, password: string) => Result;
  logout: () => void;
  setLang: (lang: Lang) => void;

  // student
  joinByCode: (code: string) => Result;
  isEnrolled: (courseId: string) => boolean;
  enrolledCourses: () => string[];
  toggleWorkoutDone: (courseId: string, workoutId: string) => void;
  completedFor: (courseId: string) => string[];

  // coach
  updateProfile: (patch: Partial<Pick<Account, 'bio' | 'brandName' | 'brandColor' | 'name'>>) => void;
  getAccount: (id: string | undefined) => Account | undefined;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      user: null,
      lang: 'ru',
      progress: {},

      signUp: (name, email, password, role, code) => {
        const e = email.trim().toLowerCase();
        if (!name.trim() || !e || !password) return { ok: false, error: 'fillFields' };
        if (get().accounts.some((a) => a.email.toLowerCase() === e)) return { ok: false, error: 'emailTaken' };
        const account: Account = {
          id: `${role}-${Date.now().toString(36)}`,
          name: name.trim(),
          email: e,
          passHash: hash(password),
          role,
          ...(role === 'trainer'
            ? { brandName: name.trim(), brandColor: '#5e8a73', avatarColor: '#5e8a73', bio: '' }
            : { avatarColor: '#c08a5e', enrolledCourseIds: [] }),
        };
        set((s) => ({ accounts: [...s.accounts, account], user: project(account) }));
        if (role === 'student' && code && code.trim()) get().joinByCode(code);
        return { ok: true };
      },

      signIn: (email, password) => {
        const e = email.trim().toLowerCase();
        if (!e || !password) return { ok: false, error: 'fillFields' };
        const acc = get().accounts.find((a) => a.email.toLowerCase() === e);
        if (!acc || acc.passHash !== hash(password)) return { ok: false, error: 'wrongCredentials' };
        set({ user: project(acc) });
        return { ok: true };
      },

      logout: () => set({ user: null }),
      setLang: (lang) => set({ lang }),

      joinByCode: (code) => {
        const user = get().user;
        if (!user) return { ok: false, error: 'wrongCredentials' };
        const needle = code.trim().toUpperCase();
        if (!needle) return { ok: false, error: 'fillFields' };
        const course = useStore.getState().courses.find((c) => (c.code || '').toUpperCase() === needle);
        if (!course) return { ok: false, error: 'codeInvalid' };
        const acc = get().accounts.find((a) => a.id === user.id);
        if (acc?.enrolledCourseIds?.includes(course.id)) return { ok: false, error: 'alreadyEnrolled' };
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === user.id
              ? { ...a, enrolledCourseIds: [...(a.enrolledCourseIds ?? []), course.id] }
              : a,
          ),
        }));
        return { ok: true };
      },

      isEnrolled: (courseId) => {
        const u = get().user;
        if (!u) return false;
        const acc = get().accounts.find((a) => a.id === u.id);
        return !!acc?.enrolledCourseIds?.includes(courseId);
      },
      enrolledCourses: () => {
        const u = get().user;
        if (!u) return [];
        return get().accounts.find((a) => a.id === u.id)?.enrolledCourseIds ?? [];
      },

      toggleWorkoutDone: (courseId, workoutId) => {
        const u = get().user;
        if (!u) return;
        const key = `${u.id}:${courseId}`;
        set((s) => {
          const list = s.progress[key] ?? [];
          const next = list.includes(workoutId) ? list.filter((w) => w !== workoutId) : [...list, workoutId];
          return { progress: { ...s.progress, [key]: next } };
        });
      },
      completedFor: (courseId) => {
        const u = get().user;
        if (!u) return [];
        return get().progress[`${u.id}:${courseId}`] ?? [];
      },

      updateProfile: (patch) => {
        const u = get().user;
        if (!u) return;
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === u.id ? { ...a, ...patch } : a)),
          user: patch.name ? { ...u, name: patch.name } : u,
        }));
      },
      getAccount: (id) => get().accounts.find((a) => a.id === id),
    }),
    {
      name: 'human-atlas-auth',
      version: VERSION,
      // On a version bump, keep sessions out but refresh seed accounts.
      migrate: () => ({ accounts: SEED_ACCOUNTS, user: null, lang: 'ru', progress: {} }) as Partial<AuthState>,
    },
  ),
);
