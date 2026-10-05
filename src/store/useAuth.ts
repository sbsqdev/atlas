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

/** Course ids whose coach has granted access to this email. */
function grantedCourseIds(email: string): string[] {
  const e = email.toLowerCase();
  return useStore
    .getState()
    .courses.filter((c) => (c.grantedEmails ?? []).some((g) => g.toLowerCase() === e))
    .map((c) => c.id);
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
  grantAccess: (courseId: string, email: string) => Result;
  revokeAccess: (courseId: string, email: string) => void;
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
        // Auto-enrol into any course a coach granted this email before signup.
        const granted = role === 'student' ? grantedCourseIds(e) : [];
        const account: Account = {
          id: `${role}-${Date.now().toString(36)}`,
          name: name.trim(),
          email: e,
          passHash: hash(password),
          role,
          ...(role === 'trainer'
            ? { brandName: name.trim(), brandColor: '#5e8a73', avatarColor: '#5e8a73', bio: '' }
            : { avatarColor: '#c08a5e', enrolledCourseIds: granted }),
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
        // Reconcile any email-based grants made since the account last signed in.
        if (acc.role === 'student') {
          const merged = Array.from(new Set([...(acc.enrolledCourseIds ?? []), ...grantedCourseIds(acc.email)]));
          set((s) => ({ accounts: s.accounts.map((a) => (a.id === acc.id ? { ...a, enrolledCourseIds: merged } : a)), user: project(acc) }));
        } else {
          set({ user: project(acc) });
        }
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

      grantAccess: (courseId, email) => {
        const e = email.trim().toLowerCase();
        if (!e || !/.+@.+\..+/.test(e)) return { ok: false, error: 'fillFields' };
        const course = useStore.getState().courses.find((c) => c.id === courseId);
        if (!course) return { ok: false, error: 'codeInvalid' };
        if ((course.grantedEmails ?? []).some((g) => g.toLowerCase() === e)) return { ok: false, error: 'alreadyEnrolled' };
        useStore.getState().updateCourse(courseId, { grantedEmails: [...(course.grantedEmails ?? []), e] });
        // If that student already has an account, enrol them immediately.
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.email.toLowerCase() === e && a.role === 'student'
              ? { ...a, enrolledCourseIds: Array.from(new Set([...(a.enrolledCourseIds ?? []), courseId])) }
              : a,
          ),
        }));
        return { ok: true };
      },

      revokeAccess: (courseId, email) => {
        const e = email.trim().toLowerCase();
        const course = useStore.getState().courses.find((c) => c.id === courseId);
        if (course) {
          useStore.getState().updateCourse(courseId, {
            grantedEmails: (course.grantedEmails ?? []).filter((g) => g.toLowerCase() !== e),
          });
        }
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.email.toLowerCase() === e
              ? { ...a, enrolledCourseIds: (a.enrolledCourseIds ?? []).filter((id) => id !== courseId) }
              : a,
          ),
        }));
      },
    }),
    {
      name: 'human-atlas-auth',
      version: VERSION,
      // On a version bump, keep sessions out but refresh seed accounts.
      migrate: () => ({ accounts: SEED_ACCOUNTS, user: null, lang: 'ru', progress: {} }) as Partial<AuthState>,
    },
  ),
);
