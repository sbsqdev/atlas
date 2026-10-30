import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, KeyRound, Lock } from 'lucide-react';
import { useMe } from '@/data/api';
import { KASPI_URL, PRICING } from '@/data/content/launch';
import { useT } from '@/i18n';
import { fmtKzt } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui';
import SiteForm from '@/features/forms/SiteForm';

/** Shown instead of paid lessons and tests for athletes without access. */
export default function Paywall() {
  const { t, locale } = useT();
  const u = useMe();
  const [apply, setApply] = useState(false);
  const kk = locale === 'kk';
  return (
    <div className="rounded-2xl border border-line bg-white p-6 md:p-8" data-testid="paywall">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy text-white"><Lock className="h-5 w-5" /></span>
      <h2 className="mt-4 text-[22px] font-bold">{t('paywall.title')}</h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-navy-500">{t('paywall.text')}</p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[28px] font-extrabold">{fmtKzt(PRICING.launch.firstMonthKzt)}</span>
        <span className="text-[14px] text-navy-500">{kk ? `алғашқы ай (алғашқы ${PRICING.launch.seats} қатысушы), кейін айына ${fmtKzt(PRICING.monthlyKzt)}` : `первый месяц (первые ${PRICING.launch.seats} участников), далее ${fmtKzt(PRICING.monthlyKzt)} в месяц`}</span>
      </div>
      <p className="mt-2 text-[14px] text-navy-700">{t('paywall.steps')}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => setApply((x) => !x)} data-testid="paywall-apply">{t('paywall.apply')}</Button>
        <a href={KASPI_URL} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg', variant: 'secondary' })}><CreditCard className="h-5 w-5" /> Kaspi</a>
        <Link to="/activate" className={buttonVariants({ size: 'lg', variant: 'ghost' })}><KeyRound className="h-5 w-5" /> {t('access.haveCode')}</Link>
      </div>
      {apply && <SiteForm kind="apply" className="mt-6" defaults={u && !u.demo ? { name: u.fullName, email: u.email, city: u.city ?? '' } : { city: u?.city ?? '' }} />}
    </div>
  );
}
