import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FlaskConical, Lock } from 'lucide-react';
import { SIMULATIONS, SIM_CATEGORIES } from '@/data/content/simulations';
import { useDb } from '@/data/db';
import { hasEnt, useMe } from '@/data/api';
import type { SimCategory } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge, buttonVariants, Card, EduNotice, PageHeader } from '@/components/ui';

export default function SimLibrary() {
  const { t } = useT();
  const u = useMe()!;
  const attempts = useDb((s) => s.simAttempts);
  const [cat, setCat] = useState<SimCategory | 'all'>('all');
  const entitled = hasEnt(u, 'simulations');
  const list = SIMULATIONS.filter((s) => cat === 'all' || s.category === cat);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('sim.title')} subtitle={t('sim.subtitle')} />
      {!entitled && <LockedNotice />}
      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', ...SIM_CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn('rounded-full border px-3 py-1.5 text-[13px] font-semibold', cat === c ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy-500 hover:text-navy')}>
            {c === 'all' ? t('common.all') : t(`sim.cat.${c}` as I18nKey)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => {
          const mine = attempts.filter((a) => a.userId === u.id && a.simulationId === s.id);
          const best = mine.length ? Math.max(...mine.map((a) => Math.round((a.score / a.maxScore) * 100))) : null;
          return (
            <Card key={s.id} className={cn('flex flex-col p-5', !s.available && 'opacity-70')}>
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><FlaskConical className="h-5 w-5" /></div>
                {s.available ? (best !== null ? <Badge tone="success">{t('sim.best')}: {best}%</Badge> : null) : <Badge tone="gray">{t('common.comingSoon')}</Badge>}
              </div>
              <div className="mt-3 text-[12px] font-semibold uppercase tracking-wider text-teal">{t(`sim.cat.${s.category}` as I18nKey)}</div>
              <h3 className="mt-1 font-semibold leading-snug">{s.title}</h3>
              <div className="mt-2 flex gap-3 text-[12px] text-navy-500">
                <span>{t('sim.difficulty')}: {t(`sim.diff.${s.difficulty}` as I18nKey)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.durationMin} {t('common.min')}</span>
              </div>
              <div className="mt-auto pt-4">
                {s.available ? (
                  entitled
                    ? <Link to={`/simulations/${s.id}`} className={buttonVariants({ size: 'sm' })}>{mine.length ? t('sim.restart') : t('sim.start')}</Link>
                    : <Link to="/pricing" className={buttonVariants({ size: 'sm', variant: 'secondary' })}><Lock className="h-3.5 w-3.5" /> {t('err.locked')}</Link>
                ) : <span className="text-[12px] text-navy-500">{t('sim.soonText')}</span>}
              </div>
            </Card>
          );
        })}
      </div>
      <EduNotice className="mt-6" />
    </div>
  );
}

export function LockedNotice() {
  const { t } = useT();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-3 text-sm"><Lock className="h-5 w-5 text-warning" /> {t('err.entitlement')}</div>
      <Link to="/pricing" className={buttonVariants({ size: 'sm', variant: 'outline' })}>{t('nav.pricing')}</Link>
    </div>
  );
}
