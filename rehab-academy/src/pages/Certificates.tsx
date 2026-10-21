import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { useDb } from '@/data/db';
import { useMe } from '@/data/api';
import { useT } from '@/i18n';
import { fmtDate } from '@/lib/format';
import { buttonVariants, Card, EmptyState, PageHeader } from '@/components/ui';

export default function Certificates() {
  const { t, locale } = useT();
  const u = useMe()!;
  const certs = useDb((s) => s.certificates).filter((c) => c.userId === u.id);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('cert.title')} subtitle={t('cert.subtitle')} />
      {certs.length === 0 ? <EmptyState icon={<Award className="h-6 w-6" />} title={t('cert.empty')} action={<Link to="/courses" className={buttonVariants({ variant: 'secondary' })}>{t('dash.browseCourses')}</Link>} /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {certs.map((c) => (
            <Card key={c.id} className="flex items-center gap-4 p-5" data-testid="certificate">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-warning to-[#E09A1F] text-white"><Award className="h-7 w-7" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.courseTitle}</div>
                <div className="text-[12px] text-navy-500">{t('cert.issued')}: {fmtDate(c.issuedAt, locale)} · {t('cert.code')}: <span className="font-mono">{c.code}</span></div>
              </div>
              <Link to={`/certificates/${c.id}/print`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>{t('cert.print')}</Link>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-6 text-[12.5px] text-navy-500">{t('cert.disclaimer')}</p>
    </div>
  );
}
