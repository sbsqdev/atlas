import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Lang, Role, User } from '../types';
import { SEED_ACCOUNTS } from '../data/seed';
import { hash } from './hash';
import { useStore } from './useStore';

const VERSION = 3;

type Result = { ok: boolean; error?: 'emailTaken' | 'usernameTaken' | 'wrongCredentials' | 'fillFields' | 'codeInvalid' | 'alreadyEnrolled' | 'consentRequired' };

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
  /** key `${userId}:${courseId}` -> watched exercise ids */
  watched: Record<string, string[]>;
  /** userId -> ISO day strings the student was active (for streaks) */
  activityDays: Record<string, string[]>;
  /** userId -> Atomic-Habits plan */
  habitPlan: Record<string, import('../types').HabitPlan>;

  signUp: (username: string, password: string, role: Role, extras: { email?: string; code?: string; consent: boolean }) => Result;
  signIn: (login: string, password: string) => Result;
  logout: () => void;
  setLang: (lang: Lang) => void;

  // student
  joinByCode: (code: string) => Result;
  isEnrolled: (courseId: string) => boolean;
  enrolledCourses: () => string[];
  toggleWorkoutDone: (courseId: string, workoutId: string) => void;
  completedFor: (courseId: string) => string[];
  markWatched: (courseId: string, exerciseId: string) => void;
  // coach analytics (read any student's activity)
  completedForUser: (userId: string, courseId: string) => string[];
  watchedForUser: (userId: string, courseId: string) => string[];
  activityFor: (userId: string) => string[];
  getHabitPlan: () => import('../types').HabitPlan;
  setHabitPlan: (patch: Partial<import('../types').HabitPlan>) => void;

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
      watched: {},
      activityDays: {},
      habitPlan: {},

      signUp: (username, password, role, extras) => {
        const u = username.trim();
        const e = (extras.email ?? '').trim().toLowerCase();
        if (!u || !password) return { ok: false, error: 'fillFields' };
        if (!extras.consent) return { ok: false, error: 'consentRequired' };
        if (get().accounts.some((a) => (a.username ?? '').toLowerCase() === u.toLowerCase())) return { ok: false, error: 'usernameTaken' };
        if (e && get().accounts.some((a) => a.email.toLowerCase() === e)) return { ok: false, error: 'emailTaken' };
        // Auto-enrol into any course a coach granted this email before signup.
        const granted = role === 'student' && e ? grantedCourseIds(e) : [];
        const account: Account = {
          id: `${role}-${Date.now().toString(36)}`,
          username: u,
          name: u,
          email: e,
          passHash: hash(password),
          consentAt: Date.now(),
          role,
          ...(role === 'trainer'
            ? { brandName: u, brandColor: '#5e8a73', avatarColor: '#5e8a73', bio: '' }
            : { avatarColor: '#c08a5e', enrolledCourseIds: granted }),
        };
        set((s) => ({ accounts: [...s.accounts, account], user: project(account) }));
        if (role === 'student' && extras.code && extras.code.trim()) get().joinByCode(extras.code);
        return { ok: true };
      },

      signIn: (login, password) => {
        const l = login.trim().toLowerCase();
        if (!l || !password) return { ok: false, error: 'fillFields' };
        const acc = get().accounts.find((a) => (a.username ?? '').toLowerCase() === l || a.email.toLowerCase() === l);
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
        const today = new Date().toISOString().slice(0, 10);
        set((s) => {
          const list = s.progress[key] ?? [];
          const adding = !list.includes(workoutId);
          const next = adding ? [...list, workoutId] : list.filter((w) => w !== workoutId);
          // Record a "did something today" for the streak when completing.
          const days = s.activityDays[u.id] ?? [];
          const activityDays = adding && !days.includes(today)
            ? { ...s.activityDays, [u.id]: [...days, today] }
            : s.activityDays;
          return { progress: { ...s.progress, [key]: next }, activityDays };
        });
      },
      completedFor: (courseId) => {
        const u = get().user;
        if (!u) return [];
        return get().progress[`${u.id}:${courseId}`] ?? [];
      },
      markWatched: (courseId, exerciseId) => {
        const u = get().user;
        if (!u || u.role !== 'student') return;
        const key = `${u.id}:${courseId}`;
        const today = new Date().toISOString().slice(0, 10);
        set((s) => {
          const list = s.watched[key] ?? [];
          if (list.includes(exerciseId)) return {} as Partial<AuthState>;
          const days = s.activityDays[u.id] ?? [];
          const activityDays = days.includes(today) ? s.activityDays : { ...s.activityDays, [u.id]: [...days, today] };
          return { watched: { ...s.watched, [key]: [...list, exerciseId] }, activityDays };
        });
      },
      completedForUser: (userId, courseId) => get().progress[`${userId}:${courseId}`] ?? [],
      watchedForUser: (userId, courseId) => get().watched[`${userId}:${courseId}`] ?? [],
      activityFor: (userId) => get().activityDays[userId] ?? [],
      getHabitPlan: () => {
        const u = get().user;
        return u ? get().habitPlan[u.id] ?? {} : {};
      },
      setHabitPlan: (patch) => {
        const u = get().user;
        if (!u) return;
        set((s) => ({ habitPlan: { ...s.habitPlan, [u.id]: { ...(s.habitPlan[u.id] ?? {}), ...patch } } }));
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
      migrate: () => ({ accounts: SEED_ACCOUNTS, user: null, lang: 'ru', progress: {}, watched: {}, activityDays: {}, habitPlan: {} }) as Partial<AuthState>,
    },
  ),
);
