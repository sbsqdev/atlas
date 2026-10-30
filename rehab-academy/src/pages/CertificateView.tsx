import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Printer } from 'lucide-react';
import { useDb } from '@/data/db';
import { useMe } from '@/data/api';
import { useT } from '@/i18n';
import { fmtDate } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui';
import { NotFound } from './Status';

/** Printable certificate (browser "Save as PDF"). Only the owner can open it. */
export default function CertificateView() {
  const { id = '' } = useParams();
  const { t, locale } = useT();
  const u = useMe()!;
  const d = useDb();
  const c = d.certificates.find((x) => x.id === id && (x.userId === u.id || u.role === 'super_admin'));
  if (!c) return <div className="p-8"><NotFound /></div>;
  const holder = d.users.find((x) => x.id === c.userId);
  return (
    <div className="min-h-screen bg-bg p-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-4xl justify-between print:hidden">
        <Link to="/certificates" className={buttonVariants({ variant: 'ghost' })}><ArrowLeft className="h-4 w-4" /> {t('common.back')}</Link>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> {t('cert.print')}</Button>
      </div>
      <div className="mx-auto aspect-[1.414] max-w-4xl rounded-2xl border-[10px] border-navy bg-white p-12 shadow-[var(--shadow-lift)] print:rounded-none print:shadow-none">
        <div className="flex h-full flex-col items-center justify-between text-center">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-cyan text-white"><Activity className="h-5 w-5" /></div>
            <span className="text-lg font-bold">FAB3D Academy</span>
          </div>
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.3em] text-teal">{t('cert.heading')}</div>
            <p className="mt-6 text-navy-500">FAB3D Academy {t('cert.certifies')}</p>
            <div className="mt-2 text-[32px] font-bold">{holder?.fullName}</div>
            <p className="mt-4 text-navy-500">{t('cert.completed')}</p>
            <div className="mt-2 text-xl font-semibold text-teal">«{c.courseTitle}»</div>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-[13px] text-navy-500">
              <span>{t('cert.issued')}: {fmtDate(c.issuedAt, locale)}</span>
              <span>{t('cert.code')}: <span className="font-mono">{c.code}</span></span>
            </div>
            <p className="mt-4 text-[11px] text-navy-500">{t('cert.disclaimer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
