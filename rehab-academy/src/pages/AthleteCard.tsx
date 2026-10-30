import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, MapPin, Target, Trophy } from 'lucide-react';
import { REGIONS } from '@/data/content/launch';
import { useT, type I18nKey } from '@/i18n';
import { buttonVariants } from '@/components/ui';
import LangSwitch from '@/components/LangSwitch';
import { useLang } from '@/features/forms/SiteForm';
import { decodeCard } from '@/features/network/card';
import SocialLinks from '@/features/network/SocialLinks';

const PB = [['5k', '5 км'], ['10k', '10 км'], ['half', '21,1 км'], ['marathon', '42,2 км']] as const;

/** Public athlete card opened from a shared link (/a/<data>). */
export default function AthleteCard() {
  const { data = '' } = useParams();
  const { t } = useT();
  const lang = useLang();
  const c = decodeCard(data);
  useEffect(() => { document.title = c ? `${c.n} · FAB3D Academy` : 'FAB3D Academy'; }, [c]);
  const city = REGIONS.find((r) => r.id === c?.c)?.[lang];
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy to-teal-600 px-4 py-10 text-white">
      <div className="w-full max-w-md" data-testid="athlete-card">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan"><Activity className="h-4 w-4" /></span> FAB3D Academy</Link>
          <LangSwitch dark />
        </div>
        {!c ? <p className="rounded-3xl bg-white/10 p-6">{t('card.invalid')}</p> : (
          <div className="rounded-3xl bg-white/10 p-7 backdrop-blur">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-cyan text-[28px] font-extrabold">{c.n.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase()}</span>
            <h1 className="mt-4 text-[28px] font-extrabold leading-tight">{c.n}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[14px] text-white/80">
              {city && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {city}</span>}
              {c.s?.length ? <span>· {c.s.map((s) => t(`sport.${s}` as I18nKey)).join(' · ')}</span> : null}
            </p>
            {c.a && <p className="mt-4 text-[15px] leading-relaxed">{c.a}</p>}
            {c.g && <p className="mt-4 flex gap-2 text-[15px]"><Target className="mt-0.5 h-5 w-5 shrink-0 text-cyan" /> {c.g}</p>}
            {c.r && <p className="mt-2 flex gap-2 text-[15px]"><Trophy className="mt-0.5 h-5 w-5 shrink-0 text-cyan" /> {c.r}</p>}
            {c.p && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PB.filter(([k]) => c.p?.[k]).map(([k, l]) => (
                  <div key={k} className="rounded-2xl bg-white/10 px-3 py-2"><div className="text-[12px] text-white/70">{l}</div><div className="font-bold">{c.p![k]}</div></div>
                ))}
              </div>
            )}
            <div className="mt-6"><SocialLinks ig={c.ig} tg={c.tg} st={c.st} dark /></div>
          </div>
        )}
        <Link to="/" className={buttonVariants({ size: 'lg', className: 'mt-5 w-full' })}>{t('card.join')}</Link>
      </div>
    </div>
  );
}
