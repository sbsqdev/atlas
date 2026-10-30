import { useLocale } from '@/i18n';
import { cn } from '@/lib/cn';

/** RU / KZ switch for the public pages and the athlete app. */
export default function LangSwitch({ dark }: { dark?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={cn('inline-flex rounded-full p-0.5 text-[12px] font-bold', dark ? 'bg-white/10' : 'bg-bg')} data-testid="lang-switch">
      {(['ru', 'kk'] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLocale(l)} aria-pressed={locale === l}
          className={cn('rounded-full px-3 py-1 transition-colors', locale === l ? (dark ? 'bg-white text-navy' : 'bg-navy text-white') : dark ? 'text-white/70 hover:text-white' : 'text-navy-500 hover:text-navy')}>
          {l === 'ru' ? 'RU' : 'KZ'}
        </button>
      ))}
    </div>
  );
}
