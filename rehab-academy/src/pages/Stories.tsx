import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import { useDb } from '@/data/db';
import { useMe } from '@/data/api';
import { coursePct } from '@/data/analytics';
import { REGIONS } from '@/data/content/launch';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { Button, Card, CardBody, Field, Input, PageHeader, Select } from '@/components/ui';
import { useLang } from '@/features/forms/SiteForm';
import { drawStory, H, loadImage, pace, W, type Story, type Theme } from '@/features/stories/draw';

type Kind = Story['kind'];
const DISTANCES: [string, number][] = [['5 км', 5], ['10 км', 10], ['21,1 км', 21.1], ['42,2 км', 42.2], ['Олимпийская дистанция', 0], ['70.3', 0], ['Ironman', 0]];
const PB_LABEL = { '5k': '5K', '10k': '10K', half: '21.1', marathon: '42.2' } as const;

/* Story maker: the athlete picks a template (profile, race, course progress),
   gets a 1080×1920 picture and shares it to Instagram / Telegram or saves it. */
export default function Stories() {
  const { t } = useT();
  const lang = useLang();
  const u = useMe()!;
  const d = useDb();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<Kind>('profile');
  const [theme, setTheme] = useState<Theme>('night');
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [race, setRace] = useState({ event: '', distance: '21,1 км', time: '', note: '' });
  const courses = useMemo(() => d.enrollments.filter((e) => e.userId === u.id).map((e) => d.courses.find((c) => c.id === e.courseId)).filter((c): c is NonNullable<typeof c> => !!c), [d, u.id]);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [msg, setMsg] = useState('');
  useEffect(() => { loadImage(u.photo).then(setPhoto); }, [u.photo]);

  const city = REGIONS.find((r) => r.id === u.city)?.[lang];
  const sports = (u.sports ?? []).map((s) => t(`sport.${s}` as I18nKey)).join(' · ');
  const course = courses.find((c) => c.id === courseId);
  const pct = course ? coursePct(d, u.id, course.id) : 0;
  const km = DISTANCES.find(([l]) => l === race.distance)?.[1] ?? 0;

  const story: Story = useMemo(() => {
    const base = { theme, brand: 'FAB3D Academy', footer: 'fab3d-scan.com', photo, name: u.fullName };
    if (kind === 'race') return { ...base, kind, eyebrow: t('story.raceEyebrow'), event: race.event, distance: race.distance, time: race.time || '0:00:00', pace: pace(km, race.time), paceLabel: t('story.pace'), note: race.note };
    if (kind === 'course') return { ...base, kind, eyebrow: t('story.courseEyebrow'), course: course?.title ?? '—', pct, detail: t('story.courseDetail'), quote: t('story.courseQuote') };
    return {
      ...base, kind: 'profile' as const, line: [city, sports].filter(Boolean).join(' · ') || t('story.athlete'),
      goalLabel: t('prof.goal'), goal: u.goal ?? '', raceLabel: t('prof.nextRace'), race: u.nextRace ?? '', pbLabel: t('prof.pb'),
      pbs: (Object.keys(PB_LABEL) as (keyof typeof PB_LABEL)[]).map((k) => [PB_LABEL[k], u.pb?.[k] ?? ''] as [string, string]),
    };
  }, [kind, theme, photo, u, race, km, course, pct, city, sports, t]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    let live = true;
    document.fonts?.ready.then(() => live && drawStory(ctx, story));
    drawStory(ctx, story);
    return () => { live = false; };
  }, [story]);

  const blob = () => new Promise<Blob>((res, rej) => canvas.current!.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png'));
  const fileName = `fab3d-story-${kind}.png`;

  async function save() {
    const url = URL.createObjectURL(await blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg(t('story.saved'));
  }
  async function share() {
    const file = new File([await blob()], fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: 'FAB3D Academy · fab3d-scan.com' }); setMsg(''); } catch { /* cancelled */ }
    } else {
      await save();
    }
  }

  return (
    <div className="animate-fade-up" data-testid="stories">
      <PageHeader title={t('story.title')} subtitle={t('story.sub')} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardBody className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {(['profile', 'race', 'course'] as Kind[]).map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)} data-testid={`story-${k}`}
                  className={cn('rounded-full px-4 py-2 text-[14px] font-semibold', kind === k ? 'bg-navy text-white' : 'bg-bg text-navy-700 hover:bg-teal-50')}>
                  {t(`story.kind.${k}` as I18nKey)}
                </button>
              ))}
            </div>
            <Field label={t('story.theme')}>
              <div className="flex gap-2">
                {(['night', 'teal', 'sunrise'] as Theme[]).map((th) => (
                  <button key={th} type="button" onClick={() => setTheme(th)} aria-label={th} aria-pressed={theme === th}
                    className={cn('h-10 w-10 rounded-full ring-offset-2', theme === th && 'ring-2 ring-teal', th === 'night' ? 'bg-navy' : th === 'teal' ? 'bg-teal' : 'bg-gradient-to-br from-[#C0567A] to-[#F2A65A]')} />
                ))}
              </div>
            </Field>

            {kind === 'profile' && (
              <p className="rounded-xl bg-bg p-4 text-[14px] text-navy-700">{t('story.profileHint')} <Link to="/profile" className="font-semibold text-teal">{t('nav.profile')} →</Link></p>
            )}
            {kind === 'race' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label={t('story.event')}><Input name="event" value={race.event} placeholder={t('story.eventPh')} onChange={(e) => setRace({ ...race, event: e.target.value })} /></Field></div>
                <Field label={t('story.distance')}>
                  <Select name="distance" value={race.distance} onChange={(e) => setRace({ ...race, distance: e.target.value })}>
                    {DISTANCES.map(([l]) => <option key={l}>{l}</option>)}
                  </Select>
                </Field>
                <Field label={t('story.time')}><Input name="time" value={race.time} placeholder="1:45:30" onChange={(e) => setRace({ ...race, time: e.target.value })} /></Field>
                <div className="sm:col-span-2"><Field label={t('story.note')}><Input name="note" value={race.note} placeholder={t('story.notePh')} onChange={(e) => setRace({ ...race, note: e.target.value })} /></Field></div>
              </div>
            )}
            {kind === 'course' && (
              courses.length ? (
                <Field label={t('nav.myCourses')}>
                  <Select name="course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </Select>
                </Field>
              ) : <p className="text-[14px] text-navy-500">{t('dash.noCourses')}</p>
            )}

            <div className="flex flex-wrap gap-3 border-t border-line pt-5">
              <Button size="lg" onClick={share} data-testid="story-share"><Share2 className="h-5 w-5" /> {t('story.share')}</Button>
              <Button size="lg" variant="secondary" onClick={save} data-testid="story-save"><Download className="h-5 w-5" /> {t('story.save')}</Button>
            </div>
            {msg && <p className="text-[13px] text-success">{msg}</p>}
            <p className="text-[12.5px] text-navy-500">{t('story.howTo')}</p>
          </CardBody>
        </Card>
        <div className="mx-auto w-full max-w-[340px]">
          <canvas ref={canvas} width={W} height={H} className="w-full rounded-[28px] shadow-[var(--shadow-lift)]" data-testid="story-canvas" />
        </div>
      </div>
    </div>
  );
}
