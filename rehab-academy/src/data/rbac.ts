import type { Course, Entitlement, Role, User } from './types';

/* Role-based access control. In demo mode these checks run in the browser
   (UX only); in production the same rules are enforced by Postgres RLS
   policies in supabase/migrations/0001_init.sql. */

export type Permission =
  | 'learn'
  | 'course.author'
  | 'course.review'
  | 'class.manage'
  | 'org.manage'
  | 'org.analytics'
  | 'platform.admin';

const MATRIX: Record<Role, Permission[]> = {
  student: ['learn'],
  instructor: ['learn', 'course.author', 'class.manage'],
  uni_admin: ['learn', 'class.manage', 'org.manage', 'org.analytics'],
  clinic_admin: ['learn', 'org.manage', 'org.analytics'],
  super_admin: ['learn', 'course.author', 'course.review', 'platform.admin', 'org.analytics'],
};

export function can(user: User | null | undefined, p: Permission): boolean {
  return !!user && MATRIX[user.role].includes(p);
}

export class ForbiddenError extends Error {
  constructor(what = 'forbidden') { super(what); this.name = 'ForbiddenError'; }
}
export function assertCan(user: User | null | undefined, p: Permission): asserts user is User {
  if (!can(user, p)) throw new ForbiddenError(p);
}

/** Same-organization check used for every org-scoped read/write. */
export function sameOrg(user: User, orgId: string | null | undefined) {
  return user.role === 'super_admin' || (!!orgId && user.orgId === orgId);
}

/** Catalog visibility: only content that passed medical review and was
 *  published, from the platform catalog or the learner's own organization.
 *  Authors always see their own drafts. */
export function canSeeCourse(user: User, c: Course) {
  if (user.role === 'super_admin') return true;
  if (c.instructorId === user.id) return true;
  const inScope = c.orgId === null || c.orgId === user.orgId;
  return inScope && c.status === 'published';
}

/** Entitlement a course requires. Athlete courses are sold one by one outside
 *  the platform plans, so any level counts as basic. */
export function courseEntitlement(c: Course): Entitlement {
  return c.level === 'beginner' || c.audience?.includes('athlete') ? 'courses.basic' : 'courses.advanced';
}
