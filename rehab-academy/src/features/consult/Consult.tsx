import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Stethoscope, Video } from 'lucide-react';
import { useMe } from '@/data/api';
import { CLINIC } from '@/data/content/launch';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { Button, PageHeader, buttonVariants } from '@/components/ui';
import SiteForm, { useLang } from '@/features/forms/SiteForm';

/* Consultation with the course rehabilitologist: online, or in person at the
   partner centre (CLINIC). Requests arrive by email like every site form. */

export function ConsultOffer({ className, open: startOpen = false }: { className?: string; open?: boolean }) {
  const { t } = useT();
  const lang = useLang();
  const u = useMe();
  const [format, setFormat] = useState<'online' | 'offline' | null>(startOpen ? 'online' : null);
  const vars = { clinic: CLINIC.name, city: lang === 'kk' ? CLINIC.cityKk : CLINIC.city };
  const option = (id: 'online' | 'offline', Icon: typeof Video, title: string, text: string) => (
    <button type="button" onClick={() => setFormat(id)} aria-pressed={format === id} data-testid={`consult-${id}`}
      className={cn('flex flex-1 items-start gap-4 rounded-2xl border p-5 text-left transition-colors', format === id ? 'border-teal bg-teal-50' : 'border-line bg-white hover:border-teal')}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-white"><Icon className="h-5 w-5" /></span>
      <span>
        <span className="block text-[16px] font-bold text-navy">{title}</span>
        <span className="mt-1 block text-[13.5px] text-navy-500">{text}</span>
        {id === 'offline' && CLINIC.address && <span className="mt-1 flex items-center gap-1 text-[13px] text-navy-700"><MapPin className="h-3.5 w-3.5" /> {CLINIC.mapUrl ? <a href={CLINIC.mapUrl} target="_blank" rel="noreferrer" className="underline">{CLINIC.address}</a> : CLINIC.address}</span>}
      </span>
    </button>
  );
  return (
    <div className={className} data-testid="consult-offer">
      <div className="flex flex-col gap-3 sm:flex-row">
        {option('online', Video, t('consult.online'), t('consult.onlineText'))}
        {option('offline', Building2, t('consult.offline', vars), t('consult.offlineText', vars))}
      </div>
      <p className="mt-3 text-[13px] text-navy-500">{t('consult.price')}</p>
      {format
        ? <SiteForm key={format} kind="consult" className="mt-4" defaults={{ format, name: u && !u.demo ? u.fullName : '', city: u?.city ?? (format === 'offline' ? 'almaty' : '') }} />
        : <Button size="lg" className="mt-4" onClick={() => setFormat('online')} data-testid="consult-start"><Stethoscope className="h-5 w-5" /> {t('consult.cta')}</Button>}
    </div>
  );
}

/** Compact call to action that leads to the consultation page. */
export function ConsultBanner({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <div className={cn('flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br from-navy to-teal-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between', className)} data-testid="consult-banner">
      <span className="flex items-start gap-3 text-[14.5px] leading-snug"><Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-cyan" /> {t('consult.short', { clinic: CLINIC.name })}</span>
      <Link to="/consult" className={buttonVariants({ size: 'sm', className: 'shrink-0' })}>{t('consult.cta')}</Link>
    </div>
  );
}

export default function ConsultPage() {
  const { t } = useT();
  return (
    <div className="animate-fade-up max-w-3xl" data-testid="consult-page">
      <PageHeader title={t('consult.title')} subtitle={t('consult.sub', { clinic: `${CLINIC.name} (${CLINIC.city})` })} />
      <ConsultOffer open />
    </div>
  );
}
