import { lazy, Suspense, useState } from 'react';
import { CheckCircle2, Lock, Rotate3d } from 'lucide-react';
import { useLang } from '@/features/forms/SiteForm';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui';
import { EXERCISE_BY_ID } from './library';

const ExercisePlayer = lazy(() => import('./ExercisePlayer'));

/** A list of exercises with the 3D demo of the selected one. `locked` ids show a lock instead. */
export default function ExerciseSet({ ids, locked = [], onLocked, title }: { ids: string[]; locked?: string[]; onLocked?: () => void; title?: string }) {
  const lang = useLang();
  const list = ids.map((id) => EXERCISE_BY_ID[id]).filter(Boolean);
  const [sel, setSel] = useState(list.find((e) => !locked.includes(e.id))?.id ?? list[0]?.id);
  const ex = EXERCISE_BY_ID[sel];
  if (!ex) return null;
  const t = ex[lang];
  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-4 md:p-5" data-testid="exercise-set">
      <h3 className="mb-3 flex items-center gap-2 text-[16px] font-bold"><Rotate3d className="h-5 w-5 text-teal" /> {title ?? (lang === 'kk' ? 'Жаттығулар 3D-де' : 'Упражнения в 3D')}</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {list.map((e) => {
            const lock = locked.includes(e.id);
            return (
              <li key={e.id} className="shrink-0 lg:shrink">
                <button type="button" onClick={() => (lock ? onLocked?.() : setSel(e.id))} data-testid={`exercise-${e.id}`}
                  className={cn('flex w-56 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left lg:w-full', sel === e.id ? 'border-teal bg-teal-50' : 'border-line hover:border-teal', lock && 'opacity-60')}>
                  {lock ? <Lock className="mt-0.5 h-4 w-4 shrink-0 text-navy-300" /> : <Rotate3d className={cn('mt-0.5 h-4 w-4 shrink-0', sel === e.id ? 'text-teal' : 'text-navy-300')} />}
                  <span><span className="block text-[14px] font-semibold leading-snug">{e[lang].title}</span><span className="block text-[12.5px] text-navy-500">{e[lang].dose}</span></span>
                </button>
              </li>
            );
          })}
        </ul>
        <div>
          <Suspense fallback={<div className="grid h-[420px] place-items-center rounded-2xl bg-bg"><Spinner /></div>}>
            <ExercisePlayer ex={ex} className="h-[360px] md:h-[440px]" />
          </Suspense>
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline gap-x-3"><span className="text-[17px] font-bold">{t.title}</span><span className="text-[14px] font-semibold text-teal">{t.dose}</span></div>
            <ul className="mt-2 space-y-1.5">
              {t.cues.map((c) => <li key={c} className="flex gap-2 text-[14px] text-navy-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{c}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
