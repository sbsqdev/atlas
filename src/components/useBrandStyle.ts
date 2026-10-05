import type { CSSProperties } from 'react';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';

/**
 * CSS-variable overrides so a course adopts its coach's brand accent colour.
 * Apply the returned style to a wrapper around the course page content.
 */
export function useBrandStyle(courseId: string | undefined): CSSProperties {
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const coach = useAuth((s) => s.accounts.find((a) => a.id === course?.trainerId));
  const color = coach?.brandColor;
  if (!color) return {};
  return {
    // Derived tints keep buttons/chips/legend consistent with the brand.
    ['--accent' as string]: color,
    ['--accent-soft' as string]: color,
    ['--accent-dim' as string]: color + '22',
  } as CSSProperties;
}
