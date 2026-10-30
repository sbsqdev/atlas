import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { hasAccess, updateProfile, useMe } from '@/data/api';
import { REGIONS } from '@/data/content/launch';
import { useT, type I18nKey } from '@/i18n';
import { fmtDate } from '@/lib/format';
import { Badge, Button, Card, CardBody, Field, Input, PageHeader, Select, buttonVariants } from '@/components/ui';
import { useLang } from '@/features/forms/SiteForm';

const SPORTS = ['run', 'marathon', 'trail', 'triathlon', 'cycling', 'swimming'] as const;
const PB = [['5k', '5 км'], ['10k', '10 км'], ['half', '21,1 км'], ['marathon', '42,2 км']] as const;

export default function Profile() {
  const { t, locale } = useT();
  const lang = useLang();
  const u = useMe()!;
  const [f, setF] = useState({ fullName: u.fullName, city: u.city ?? '', sports: u.sports ?? [], goal: u.goal ?? '', nextRace: u.nextRace ?? '', pb: u.pb ?? {} });
  const [saved, setSaved] = useState(false);
  const paid = (u.accessUntil ?? 0) > Date.now();

  function save() {
    updateProfile({ ...f, fullName: f.fullName.trim() || u.fullName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="animate-fade-up max-w-3xl space-y-6" data-testid="profile">
      <PageHeader title={t('prof.title')} subtitle={t('prof.sub')} />
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[13px] text-navy-500">{u.email}</div>
            {paid ? <Badge tone="success">{t('access.until', { date: fmtDate(u.accessUntil!, locale) })}</Badge> : hasAccess(u) ? null : <Badge tone="warning">{t('access.none')}</Badge>}
          </div>
          {!paid && <Link to="/access" className={buttonVariants({ size: 'sm' })}><KeyRound className="h-4 w-4" /> {t('access.get')}</Link>}
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('access.name')}><Input name="fullName" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
            <Field label={t('prof.city')}>
              <Select name="city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                <option value="">—</option>
                {REGIONS.map((r) => <option key={r.id} value={r.id}>{r[lang]}</option>)}
              </Select>
            </Field>
          </div>
          <Field label={t('prof.sports')}>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const on = f.sports.includes(s);
                return (
                  <button key={s} type="button" onClick={() => setF({ ...f, sports: on ? f.sports.filter((x) => x !== s) : [...f.sports, s] })} aria-pressed={on}
                    className={on ? 'rounded-full bg-teal px-3.5 py-1.5 text-[13px] font-semibold text-white' : 'rounded-full border border-line px-3.5 py-1.5 text-[13px] text-navy-700 hover:border-teal'}>
                    {t(`sport.${s}` as I18nKey)}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={t('prof.goal')}><Input name="goal" value={f.goal} placeholder={t('prof.goalPh')} onChange={(e) => setF({ ...f, goal: e.target.value })} /></Field>
          <Field label={t('prof.nextRace')}><Input name="nextRace" value={f.nextRace} placeholder={t('prof.nextRacePh')} onChange={(e) => setF({ ...f, nextRace: e.target.value })} /></Field>
          <Field label={t('prof.pb')}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PB.map(([k, label]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-[12px] text-navy-500">{label}</span>
                  <Input name={`pb-${k}`} value={f.pb[k] ?? ''} placeholder="0:00:00" onChange={(e) => setF({ ...f, pb: { ...f.pb, [k]: e.target.value } })} />
                </label>
              ))}
            </div>
          </Field>
          <div className="flex items-center gap-3">
            <Button onClick={save} data-testid="profile-save">{t('common.save')}</Button>
            {saved && <span className="flex items-center gap-1 text-[13px] text-success"><CheckCircle2 className="h-4 w-4" /> {t('prof.saved')}</span>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
