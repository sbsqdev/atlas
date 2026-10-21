import { Link } from 'react-router-dom';
import { Stethoscope, UserRound } from 'lucide-react';
import { PATIENTS } from '@/data/content/patients';
import { useDb } from '@/data/db';
import { hasEnt, useMe } from '@/data/api';
import { useT } from '@/i18n';
import { Badge, buttonVariants, Card, EduNotice, PageHeader } from '@/components/ui';
import { LockedNotice } from '@/features/simulations/SimLibrary';

export default function Patients() {
  const { t } = useT();
  const u = useMe()!;
  const attempts = useDb((s) => s.patientAttempts);
  const entitled = hasEnt(u, 'virtual_patients');
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('vp.title')} subtitle={t('vp.subtitle')} />
      {!entitled && <LockedNotice />}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PATIENTS.filter((p) => p.status === 'published').map((p) => {
          const mine = attempts.filter((a) => a.userId === u.id && a.caseId === p.id);
          return (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-50 text-[#137F8A]"><UserRound className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">{p.patient.alias}, {p.patient.age}</div>
                  <div className="text-[12px] text-navy-500">{p.patient.occupation}</div>
                </div>
              </div>
              <h3 className="mt-4 font-semibold leading-snug">{p.title}</h3>
              <div className="mt-2 flex flex-wrap gap-1.5"><Badge tone="warning">{t('vp.synthetic')}</Badge>{mine.length > 0 && <Badge tone="success">{t('common.completed')}</Badge>}</div>
              <div className="mt-auto pt-4">
                <Link to={`/patients/${p.id}`} className={buttonVariants({ size: 'sm', variant: entitled ? 'primary' : 'secondary' })}><Stethoscope className="h-4 w-4" /> {t('common.open')}</Link>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-navy-500">{t('vp.futureNote')}</p>
      <EduNotice className="mt-3" />
    </div>
  );
}
