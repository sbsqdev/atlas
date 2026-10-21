import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useDb } from '@/data/db';
import { createClass, useMe } from '@/data/api';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { Button, Card, Dialog, EmptyState, Field, Input, PageHeader } from '@/components/ui';

export default function Classes() {
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cohort, setCohort] = useState('');
  const [err, setErr] = useState<I18nKey | null>(null);
  const classes = d.classes.filter((c) => c.orgId === u.orgId && (u.role !== 'instructor' || c.instructorId === u.id));
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('cls.title')} subtitle={t('cls.subtitle')} actions={<Button onClick={() => setOpen(true)} data-testid="new-class"><Plus className="h-4 w-4" /> {t('cls.new')}</Button>} />
      {err && <div className="mb-4 rounded-xl bg-[#FBE7E9] px-4 py-3 text-sm text-error">{t(err)}</div>}
      {classes.length === 0 ? <EmptyState icon={<Users className="h-6 w-6" />} title={t('cls.empty')} /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <Link key={c.id} to={`/teach/classes/${c.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><Users className="h-5 w-5" /></div>
                <h3 className="mt-3 font-semibold">{c.name}</h3>
                <p className="text-[13px] text-navy-500">{c.cohort}</p>
                <div className="mt-3 flex gap-4 text-[13px]">
                  <span><b>{c.studentIds.length}</b> {t('common.students').toLowerCase()}</span>
                  <span><b>{d.assignments.filter((a) => a.classId === c.id).length}</b> {t('cls.assignments').toLowerCase()}</span>
                </div>
                <p className="mt-2 text-[12px] text-navy-500">{d.users.find((x) => x.id === c.instructorId)?.fullName}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t('cls.new')} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button disabled={!name.trim()} onClick={() => { try { createClass(name.trim(), cohort.trim()); setErr(null); } catch (e) { setErr(errorKey(e)); } setOpen(false); setName(''); setCohort(''); }} data-testid="create-class">{t('common.create')}</Button></>}>
        <div className="space-y-4">
          <Field label={t('cls.name')}><Input value={name} onChange={(e) => setName(e.target.value)} name="className" /></Field>
          <Field label={t('cls.cohort')}><Input value={cohort} onChange={(e) => setCohort(e.target.value)} /></Field>
        </div>
      </Dialog>
    </div>
  );
}
