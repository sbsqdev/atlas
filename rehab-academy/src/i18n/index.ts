import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ru, { type I18nKey } from './ru';
import en from './en';
import kk from './kk';

export type Locale = 'ru' | 'kk' | 'en';
export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'kk', label: 'Қазақша' },
  { id: 'en', label: 'English' },
];
const DICTS: Record<Locale, Partial<Record<I18nKey, string>>> = { ru, en, kk };

export const useLocale = create<{ locale: Locale; setLocale: (l: Locale) => void }>()(
  persist((set) => ({ locale: 'ru', setLocale: (locale) => set({ locale }) }), { name: 'ra-locale' }),
);

export function translate(locale: Locale, key: I18nKey, vars?: Record<string, string | number>): string {
  let s = DICTS[locale][key] ?? ru[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function useT() {
  const locale = useLocale((s) => s.locale);
  return { locale, t: (key: I18nKey, vars?: Record<string, string | number>) => translate(locale, key, vars) };
}
export type { I18nKey };
