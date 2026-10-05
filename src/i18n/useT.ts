import { useAuth } from '../store/useAuth';
import { t as translate, type StringKey } from './strings';
import type { Bi } from '../types';

/**
 * Convenience hook: `t('login')` for UI labels and `tr(biString)` for
 * multilingual content, both bound to the active language. Content falls back
 * to English (then Russian) when a translation is missing — e.g. Turkish on
 * coach-authored content that only has RU/EN.
 */
export function useT() {
  const lang = useAuth((s) => s.lang);
  return {
    lang,
    t: (key: StringKey) => translate(key, lang),
    tr: (bi: Bi | undefined) => (bi ? bi[lang] ?? bi.en ?? bi.ru : ''),
  };
}
