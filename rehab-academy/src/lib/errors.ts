import { ForbiddenError } from '@/data/rbac';
import type { I18nKey } from '@/i18n';
import ru from '@/i18n/ru';

/** Maps service-layer errors to translated, user-facing messages. */
export function errorKey(e: unknown): I18nKey {
  if (e instanceof ForbiddenError) return 'common.forbidden';
  const msg = e instanceof Error ? e.message : '';
  return (msg in ru ? msg : 'common.error') as I18nKey;
}
