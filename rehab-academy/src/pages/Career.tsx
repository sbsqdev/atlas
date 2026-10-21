import { useState } from 'react';
import { Award, Briefcase, ShieldAlert } from 'lucide-react';
import { useDb } from '@/data/db';
import { updateProfile, useMe } from '@/data/api';
import { avg, bestAttempts } from '@/data/analytics';
import { useT } from '@/i18n';
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Textarea } from '@/components/ui';

export default function Career() {
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const [headline, setHeadline] = useState(u.headline ?? '');
  const [prefs, setPrefs] = useState(u.jobPrefs ?? '');
  const [saved, setSaved] = useState(false);
  const certs = d.certificates.filter((c) => c.userId === u.id);
  const theory = avg(bestAttempts(d, new Set([u.id])).map((a) => a.score));
  const sims = d.simAttempts.filter((s) => s.userId === u.id).length;

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('career.title')} subtitle={t('career.subtitle')} eyebrow={<Badge tone="warning">{t('career.preview')}</Badge>} />
      <div className="mb-6 rounded-2xl border border-line bg-white p-4 text-sm text-navy-700">{t('career.previewText')}</div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('set.profile')} icon={<Briefcase className="h-4 w-4" />} />
          <CardBody className="space-y-4">
            <Field label={t('career.headline')}><Input value={headline} onChange={(e) => setHeadline(e.target.value)} /></Field>
            <Field label={t('career.prefs')}><Textarea value={prefs} onChange={(e) => setPrefs(e.target.value)} /></Field>
            <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal" checked={u.careerVisible} onChange={(e) => updateProfile({ careerVisible: e.target.checked })} data-testid="career-visible" />
              <span><span className="font-semibold">{t('career.visible')}</span><br /><span className="text-[12px] text-navy-500">{t('career.visibleHint')}</span></span>
            </label>
            <Button onClick={() => { updateProfile({ headline, jobPrefs: prefs }); setSaved(true); setTimeout(() => setSaved(false), 1500); }}>{saved ? t('common.saved') : t('common.save')}</Button>
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={t('career.portfolio')} icon={<Award className="h-4 w-4" />} />
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span>{t('nav.certificates')}</span><b>{certs.length}</b></div>
              <div className="flex justify-between"><span>{t('prog.theory')}</span><b>{theory === null ? '—' : `${theory}%`}</b></div>
              <div className="flex justify-between"><span>{t('dash.simulations')}</span><b>{sims}</b></div>
              {certs.map((c) => <div key={c.id} className="rounded-lg bg-bg px-3 py-2">{c.courseTitle} <span className="font-mono text-[11px] text-navy-500">{c.code}</span></div>)}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('career.qualifications')} />
            <CardBody><p className="text-sm text-navy-500">{t('career.qualificationsEmpty')}</p></CardBody>
          </Card>
          <div className="flex gap-2 rounded-xl border border-[#F4D99B] bg-[#FFF9EC] p-3 text-[12.5px] text-[#7A5410]"><ShieldAlert className="h-4 w-4 shrink-0" /> {t('career.competency')}</div>
        </div>
      </div>
    </div>
  );
}
