import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasAccess, useMe } from '@/data/api';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui';
import { useLang } from '@/features/forms/SiteForm';
import ExerciseSet from '@/features/exercises/ExerciseSet';
import { EXERCISES, GROUPS, type Group } from '@/features/exercises/library';
import { ConsultBanner } from '@/features/consult/Consult';

/** Library of exercises shown by the 3D figure, grouped by body area. */
export default function Exercises() {
  const { t } = useT();
  const lang = useLang();
  const u = useMe()!;
  const nav = useNavigate();
  const [group, setGroup] = useState<Group>('knee');
  const ids = EXERCISES.filter((e) => e.group === group).map((e) => e.id);
  const locked = hasAccess(u) ? [] : EXERCISES.filter((e) => !e.free).map((e) => e.id);
  return (
    <div className="animate-fade-up" data-testid="exercises-page">
      <PageHeader title={t('nav.exercises')} subtitle={t('ex.sub')} />
      <div className="mb-2 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button key={g.id} type="button" onClick={() => setGroup(g.id)} data-testid={`ex-group-${g.id}`}
            className={cn('rounded-full px-4 py-2 text-[14px] font-semibold', group === g.id ? 'bg-navy text-white' : 'bg-white text-navy-700 ring-1 ring-line hover:ring-teal')}>
            {g[lang]}
          </button>
        ))}
      </div>
      <ExerciseSet key={group} ids={ids} locked={locked} onLocked={() => nav('/access')} title={GROUPS.find((g) => g.id === group)![lang]} />
      {locked.length > 0 && <p className="mt-3 text-[13px] text-navy-500">{t('ex.trial')}</p>}
      <ConsultBanner className="mt-6" />
    </div>
  );
}
