import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Download, Globe, RotateCcw, User } from 'lucide-react';
import { useDb } from '@/data/db';
import { activeSubscriptions, exportMyData, resetDemo, roleKey, updateProfile, useMe } from '@/data/api';
import { PLAN_BY_ID } from '@/data/content/plans';
import { LOCALES, useLocale, useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { downloadFile, fmtDate } from '@/lib/format';
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Field, Input, PageHeader } from '@/components/ui';

export default function Settings() {
  const { t, locale } = useT();
  const { setLocale } = useLocale();
  const u = useMe()!;
  const orgs = useDb((s) => s.orgs);
  const nav = useNavigate();
  const [name, setName] = useState(u.fullName);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const org = orgs.find((o) => o.id === u.orgId);
  const subs = activeSubscriptions(u);

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('set.title')} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('set.profile')} icon={<User className="h-4 w-4" />} />
          <CardBody className="space-y-4">
            <Field label={t('auth.fullName')}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label={t('auth.email')}><Input value={u.email} disabled /></Field>
            <div className="text-sm text-navy-500">{t(roleKey(u) as I18nKey)}{u.cohort ? ` · ${u.cohort}` : ''}</div>
            <Button disabled={!name.trim()} onClick={() => { updateProfile({ fullName: name.trim() }); setSaved(true); setTimeout(() => setSaved(false), 1500); }}>{saved ? t('common.saved') : t('common.save')}</Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('set.language')} icon={<Globe className="h-4 w-4" />} />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((l) => (
                <button key={l.id} onClick={() => setLocale(l.id)} className={cn('rounded-xl border px-4 py-2 text-sm font-semibold', locale === l.id ? 'border-navy bg-navy text-white' : 'border-line hover:border-navy-300')}>{l.label}</button>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-navy-500">{t('set.langNote')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('set.org')} />
          <CardBody className="space-y-2 text-sm">
            {org ? <div className="font-semibold">{org.name}</div> : <p className="text-navy-500">{t('set.noOrg')}</p>}
            {subs.length === 0 ? <p className="text-navy-500">{t('set.noSub')}</p> : subs.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-2">
                <Badge tone={s.status === 'pilot' ? 'warning' : 'success'}>{t(`sub.${s.status}` as I18nKey)}</Badge>
                <span>{PLAN_BY_ID[s.planId].name} · {t('org.validUntil')} {fmtDate(s.endsAt, locale)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('set.privacy')} icon={<Database className="h-4 w-4" />} />
          <CardBody className="space-y-3">
            <p className="text-[13px] text-navy-500">{t('set.backend')}: {t('set.backendLocal')}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadFile('rehab-academy-my-data.json', JSON.stringify(exportMyData(), null, 2), 'application/json')}><Download className="h-4 w-4" /> {t('set.exportData')}</Button>
              <Button variant="danger" onClick={() => setConfirm(true)}><RotateCcw className="h-4 w-4" /> {t('set.deleteDemo')}</Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title={t('set.deleteDemo')} footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>{t('common.cancel')}</Button><Button variant="danger" onClick={async () => { await resetDemo(); nav('/login'); }}>{t('common.yes')}</Button></>}>
        <p className="text-sm">{t('set.deleteConfirm')}</p>
      </Dialog>
    </div>
  );
}
