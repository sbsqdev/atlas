import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brain, ClipboardCheck, FlaskConical, Hand, MessageSquare } from 'lucide-react';
import { useDb } from '@/data/db';
import { useMe } from '@/data/api';
import { avg, bestAttempts, coursePct, totalMinutes, activityByDay } from '@/data/analytics';
import { SIM_BY_ID } from '@/data/content/simulations';
import { PATIENT_BY_ID } from '@/data/content/patients';
import { useT } from '@/i18n';
import { fmtDate, fmtHours, LOCALE_TAG } from '@/lib/format';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress as Bar, StatCard } from '@/components/ui';
import { BarSeries } from '@/components/charts';

export default function Progress() {
  const { t, locale } = useT();
  const u = useMe()!;
  const d = useDb();
  const v = useMemo(() => {
    const me = new Set([u.id]);
    const enrollments = d.enrollments.filter((e) => e.userId === u.id);
    const best = bestAttempts(d, me);
    const sims = d.simAttempts.filter((s) => s.userId === u.id).sort((a, b) => b.completedAt - a.completedAt);
    const patients = d.patientAttempts.filter((p) => p.userId === u.id).sort((a, b) => b.completedAt - a.completedAt);
    const theory = avg(best.map((a) => a.score));
    const practical = avg([...sims.map((s) => (s.score / s.maxScore) * 100), ...patients.map((p) => (p.score / p.maxScore) * 100)]);
    return { enrollments, best, sims, patients, theory, practical, week: activityByDay(d, me, 14, LOCALE_TAG[locale]) };
  }, [d, u, locale]);
  const feedback = d.feedback.filter((f) => f.studentId === u.id).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('prog.title')} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('prog.hours')} value={`${fmtHours(totalMinutes(d, u.id))} ${t('common.hours')}`} />
        <StatCard label={t('prog.courses')} value={v.enrollments.length} tone="cyan" />
        <StatCard label={t('dash.simulations')} value={v.sims.length} tone="navy" />
        <StatCard label={t('dash.assessments')} value={v.best.filter((a) => a.passed).length} tone="warning" />
      </div>

      <Card className="mt-6">
        <CardHeader title={t('prog.competency')} subtitle={t('prog.competencySub')} />
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Competency icon={<Brain className="h-5 w-5" />} title={t('prog.theory')} value={v.theory} hint={t('prog.theoryHint')} />
          <Competency icon={<FlaskConical className="h-5 w-5" />} title={t('prog.practical')} value={v.practical} hint={t('prog.practicalHint')} />
          <div className="rounded-xl border border-dashed border-line p-4">
            <div className="flex items-center gap-2 font-semibold"><Hand className="h-5 w-5 text-navy-300" /> {t('prog.clinical')}</div>
            <p className="mt-2 text-[13px] text-navy-500">{t('prog.clinicalHint')}</p>
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('prog.courses')} />
          <CardBody className="space-y-4">
            {v.enrollments.length === 0 && <EmptyState title={t('dash.noCourses')} />}
            {v.enrollments.map((e) => {
              const c = d.courses.find((x) => x.id === e.courseId);
              if (!c) return null;
              const pct = coursePct(d, u.id, c.id);
              return (
                <Link key={e.id} to={`/courses/${c.id}`} className="block">
                  <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-medium">{c.title}</span><span className="font-semibold">{pct}%</span></div>
                  <Bar value={pct} tone={pct === 100 ? 'success' : 'teal'} />
                </Link>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('prog.byWeek')} subtitle={t('common.min')} />
          <CardBody><BarSeries data={v.week} x="day" y="minutes" unit={` ${t('common.min')}`} /></CardBody>
        </Card>
        <Card>
          <CardHeader title={t('prog.tests')} icon={<ClipboardCheck className="h-4 w-4" />} />
          <CardBody>
            {v.best.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
              <ul className="divide-y divide-line">
                {v.best.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link to={`/assessments/${a.assessmentId}`} className="font-medium hover:text-teal">{d.assessments.find((x) => x.id === a.assessmentId)?.title}</Link>
                    <Badge tone={a.passed ? 'success' : 'error'}>{a.score}%</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('prog.sims')} icon={<FlaskConical className="h-4 w-4" />} />
          <CardBody>
            {v.sims.length + v.patients.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
              <ul className="divide-y divide-line">
                {v.sims.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span><span className="font-medium">{SIM_BY_ID[s.simulationId]?.title}</span><br /><span className="text-[12px] text-navy-500">{fmtDate(s.completedAt, locale)}</span></span>
                    <Badge tone="teal">{s.score}/{s.maxScore}</Badge>
                  </li>
                ))}
                {v.patients.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span><span className="font-medium">{PATIENT_BY_ID[p.caseId]?.title}</span><br /><span className="text-[12px] text-navy-500">{t('nav.patients')} · {fmtDate(p.completedAt, locale)}</span></span>
                    <Badge tone="cyan">{p.score}/{p.maxScore}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        {feedback.length > 0 && (
          <Card className="xl:col-span-2">
            <CardHeader title={t('cls.feedback')} icon={<MessageSquare className="h-4 w-4" />} />
            <CardBody className="space-y-2">
              {feedback.map((f) => <div key={f.id} className="rounded-xl bg-bg p-3 text-sm">{f.text}<div className="mt-1 text-[11px] text-navy-500">{d.users.find((x) => x.id === f.instructorId)?.fullName} · {fmtDate(f.createdAt, locale)}</div></div>)}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function Competency({ icon, title, value, hint }: { icon: ReactNode; title: string; value: number | null; hint: string }) {
  return (
    <div className="rounded-xl bg-bg p-4">
      <div className="flex items-center gap-2 font-semibold text-navy"><span className="text-teal">{icon}</span> {title}</div>
      <div className="mt-2 text-2xl font-bold">{value === null ? '—' : `${value}%`}</div>
      {value !== null && <Bar value={value} className="mt-2" />}
      <p className="mt-2 text-[12px] text-navy-500">{hint}</p>
    </div>
  );
}
