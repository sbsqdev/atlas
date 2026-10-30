import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, CheckCircle2, Copy, ImagePlus, KeyRound, Sparkles, Trash2, Users } from 'lucide-react';
import { hasAccess, updateProfile, useMe } from '@/data/api';
import { REGIONS } from '@/data/content/launch';
import { useT, type I18nKey } from '@/i18n';
import { fmtDate } from '@/lib/format';
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Textarea, buttonVariants } from '@/components/ui';
import SiteForm, { useLang } from '@/features/forms/SiteForm';
import { photoToDataUrl } from '@/features/stories/draw';
import { cardOf, encodeCard } from '@/features/network/card';
import { ConsultBanner } from '@/features/consult/Consult';

const SPORTS = ['run', 'marathon', 'trail', 'triathlon', 'cycling', 'swimming'] as const;
const PB = [['5k', '5 км'], ['10k', '10 км'], ['half', '21,1 км'], ['marathon', '42,2 км']] as const;

export default function Profile() {
  const { t, locale } = useT();
  const lang = useLang();
  const u = useMe()!;
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    fullName: u.fullName, city: u.city ?? '', sports: u.sports ?? [], goal: u.goal ?? '', nextRace: u.nextRace ?? '', pb: u.pb ?? {},
    photo: u.photo ?? '', about: u.about ?? '', socials: u.socials ?? {}, openToMeet: u.openToMeet ?? false,
  });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const paid = (u.accessUntil ?? 0) > Date.now();
  const cardLink = `${location.origin}${import.meta.env.BASE_URL}a/${encodeCard(cardOf({ ...u, ...f, fullName: f.fullName || u.fullName }))}`;

  function save() {
    updateProfile({ ...f, fullName: f.fullName.trim() || u.fullName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  async function pickPhoto(file?: File) {
    if (!file) return;
    try { setF((x) => ({ ...x, photo: '' })); const photo = await photoToDataUrl(file); setF((x) => ({ ...x, photo })); } catch { /* not an image */ }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(cardLink); } catch { /* clipboard blocked: the link is visible */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  const social = (k: 'instagram' | 'telegram' | 'strava', label: string, ph: string) => (
    <Field label={label}><Input name={k} value={f.socials[k] ?? ''} placeholder={ph} onChange={(e) => setF({ ...f, socials: { ...f.socials, [k]: e.target.value } })} /></Field>
  );

  return (
    <div className="animate-fade-up max-w-3xl space-y-6" data-testid="profile">
      <PageHeader title={t('prof.title')} subtitle={t('prof.sub')} actions={<Link to="/stories" className={buttonVariants()} data-testid="profile-story"><Sparkles className="h-4 w-4" /> {t('prof.makeStory')}</Link>} />
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
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-bg ring-4 ring-cyan/40">
              {f.photo ? <img src={f.photo} alt="" className="h-full w-full object-cover" data-testid="profile-photo" /> : <Camera className="h-8 w-8 text-navy-300" />}
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} data-testid="photo-input" />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /> {t('prof.photoPick')}</Button>
              {f.photo && <Button variant="ghost" onClick={() => setF({ ...f, photo: '' })}><Trash2 className="h-4 w-4" /> {t('prof.photoRemove')}</Button>}
            </div>
          </div>
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
          <Field label={t('prof.about')}><Textarea name="about" value={f.about} placeholder={t('prof.aboutPh')} onChange={(e) => setF({ ...f, about: e.target.value })} /></Field>
          <div>
            <div className="mb-2 text-[13px] font-medium text-navy-700">{t('prof.socials')}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {social('instagram', 'Instagram', '@username')}
              {social('telegram', 'Telegram', '@username')}
              {social('strava', 'Strava', 'https://strava.com/athletes/…')}
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-[14px] text-navy-700">
            <input type="checkbox" name="openToMeet" checked={f.openToMeet} onChange={(e) => setF({ ...f, openToMeet: e.target.checked })} className="h-4 w-4 accent-teal" />
            {t('prof.open')}
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={save} data-testid="profile-save">{t('common.save')}</Button>
            {saved && <span className="flex items-center gap-1 text-[13px] text-success"><CheckCircle2 className="h-4 w-4" /> {t('prof.saved')}</span>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('prof.card')} icon={<Users className="h-4 w-4" />} subtitle={t('prof.cardText')} />
        <CardBody className="space-y-3">
          <Input readOnly value={cardLink} className="font-mono text-[12px]" data-testid="card-link" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copy}><Copy className="h-4 w-4" /> {copied ? t('prof.copied') : t('prof.copyLink')}</Button>
            <Button variant="secondary" onClick={() => setCatalog((x) => !x)} data-testid="to-catalog">{t('prof.toCatalog')}</Button>
          </div>
          {catalog && (
            <SiteForm kind="member" defaults={{
              name: f.fullName, city: f.city, sport: f.sports.includes('triathlon') ? 'triathlon' : f.sports.includes('marathon') ? 'marathon' : f.sports.length ? 'run' : '',
              socials: [f.socials.instagram && `Instagram ${f.socials.instagram}`, f.socials.telegram && `Telegram ${f.socials.telegram}`, f.socials.strava && `Strava ${f.socials.strava}`].filter(Boolean).join(', '),
              about: [f.about, f.goal && `Цель: ${f.goal}`, Object.entries(f.pb).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')].filter(Boolean).join('. '),
            }} />
          )}
        </CardBody>
      </Card>
      <ConsultBanner />
    </div>
  );
}
