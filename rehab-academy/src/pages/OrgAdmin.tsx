import { useMemo, useState } from 'react';
import { Building2, Copy, Download, Plus, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDb } from '@/data/db';
import { assignCourseToOrgMembers, createOrgUser, orgSeats, roleKey, setUserCohort, useMe } from '@/data/api';
import { avg, bestAttempts, coursePct } from '@/data/analytics';
import { PLAN_BY_ID } from '@/data/content/plans';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { downloadFile, fmtDate, toCsv } from '@/lib/format';
import { Badge, Button, buttonVariants, Card, CardBody, CardHeader, Dialog, Field, Input, PageHeader, Progress, Select, Tabs } from '@/components/ui';
import { BarSeries } from '@/components/charts';

type Tab = 'users' | 'analytics' | 'license';

export default function OrgAdmin() {
  const { t, locale } = useT();
  const u = useMe()!;
  const d = useDb();
  const [tab, setTab] = useState<Tab>('users');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'student' as 'student' | 'instructor', cohort: '' });
  const [created, setCreated] = useState<{ email: string; pwd: string } | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCourse, setAssignCourse] = useState('');
  const [err, setErr] = useState<I18nKey | null>(null);
  const [busy, setBusy] = useState(false);
  const org = d.orgs.find((o) => o.id === u.orgId);
  const members = d.users.filter((x) => x.orgId === u.orgId);
  const seats = u.orgId ? orgSeats(u.orgId) : { sub: undefined, used: 0, total: 0 };
  const isClinic = u.role === 'clinic_admin';

  const analytics = useMemo(() => {
    const ids = new Set(members.map((m) => m.id));
    const published = d.courses.filter((c) => c.status === 'published');
    const byCourse = published.map((c) => {
      const en = d.enrollments.filter((e) => e.courseId === c.id && ids.has(e.userId));
      return { name: c.title.length > 24 ? `${c.title.slice(0, 24)}…` : c.title, title: c.title, enrolled: en.length, pct: avg(en.map((e) => coursePct(d, e.userId, c.id))) ?? 0 };
    });
    const byGroup = d.classes.filter((c) => c.orgId === u.orgId).map((c) => ({ name: c.name, score: avg(bestAttempts(d, new Set(c.studentIds)).map((a) => a.score)) ?? 0, n: c.studentIds.length }));
    const byInstructor = members.filter((m) => m.role === 'instructor').map((ins) => {
      const cls = d.classes.filter((c) => c.instructorId === ins.id);
      const st = new Set(cls.flatMap((c) => c.studentIds));
      return { name: ins.fullName, classes: cls.length, students: st.size, score: avg(bestAttempts(d, st).map((a) => a.score)) };
    });
    const cohorts = [...new Set(members.map((m) => m.cohort).filter(Boolean))] as string[];
    const byCohort = cohorts.map((co) => {
      const st = new Set(members.filter((m) => m.cohort === co).map((m) => m.id));
      return { name: co, n: st.size, score: avg(bestAttempts(d, st).map((a) => a.score)) };
    });
    return { byCourse, byGroup, byInstructor, byCohort };
  }, [d, members, u.orgId]);

  async function addUser() {
    setBusy(true);
    try {
      const r = await createOrgUser(form);
      setCreated({ email: r.user.email, pwd: r.tempPassword });
      setForm({ email: '', fullName: '', role: 'student', cohort: '' });
      setOpen(false);
      setErr(null);
    } catch (e) { setErr(errorKey(e)); } finally { setBusy(false); }
  }

  function exportCsv() {
    const rows = [[t('common.name'), t('courses.lessons'), `${t('courses.progress')} %`], ...analytics.byCourse.map((c) => [c.title, c.enrolled, c.pct])];
    downloadFile('org-analytics.csv', toCsv(rows), 'text/csv;charset=utf-8');
  }

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow={t(isClinic ? 'adm.type.clinic' : 'adm.type.university')} title={org?.name ?? t('org.title')} />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'users', label: isClinic ? t('org.employees') : t('org.users') }, { value: 'analytics', label: t('org.analytics') }, { value: 'license', label: t('org.license') }]} />
      {err && <div className="mt-4 rounded-xl bg-[#FBE7E9] px-4 py-3 text-sm text-error">{t(err)}</div>}
      {created && (
        <div className="mt-4 rounded-xl border border-success/30 bg-[#E3F5F1] p-4 text-sm" data-testid="temp-password">
          <div className="font-semibold text-success">{created.email}</div>
          <div className="mt-1">{t('org.tempPassword')} <span className="font-mono font-semibold">{created.pwd}</span>
            <button onClick={() => navigator.clipboard?.writeText(created.pwd)} className="ml-2 inline-flex text-teal" aria-label="copy"><Copy className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <Card className="mt-5 overflow-x-auto">
          <CardHeader title={`${t('org.users')} (${members.length})`} subtitle={seats.sub ? `${t('org.seats')}: ${seats.used} / ${seats.total}` : t('org.noLicense')} action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>{t('org.assignCourse')}</Button>
              <Button size="sm" onClick={() => setOpen(true)} data-testid="add-org-user"><Plus className="h-4 w-4" /> {t('org.addUser')}</Button>
            </div>
          } />
          <table className="mt-3 w-full min-w-[640px] text-sm">
            <thead className="border-y border-line bg-bg text-left text-[12px] uppercase tracking-wider text-navy-500">
              <tr><th className="px-5 py-2.5">{t('auth.fullName')}</th><th className="px-3 py-2.5">{t('auth.role')}</th><th className="px-3 py-2.5">{t('org.cohorts')}</th><th className="px-3 py-2.5">{t('common.date')}</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2.5"><div className="font-medium">{m.fullName}</div><div className="text-[12px] text-navy-500">{m.email}</div></td>
                  <td className="px-3 py-2.5"><Badge tone="gray">{t(roleKey(m) as I18nKey)}</Badge></td>
                  <td className="px-3 py-2.5">
                    {m.role === 'student'
                      ? <input defaultValue={m.cohort ?? ''} onBlur={(e) => e.target.value !== (m.cohort ?? '') && setUserCohort(m.id, e.target.value)} className="w-36 rounded-lg border border-transparent bg-transparent px-2 py-1 hover:border-line focus:border-teal focus:outline-none" aria-label={t('org.cohorts')} />
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-navy-500">{fmtDate(m.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'analytics' && (
        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader title={t('org.byCourse')} action={<Button size="sm" variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> {t('common.export')}</Button>} />
            <CardBody className="space-y-3">
              {analytics.byCourse.map((c) => (
                <div key={c.title}>
                  <div className="mb-1 flex justify-between text-sm"><span>{c.title}</span><span className="text-navy-500">{c.enrolled} · {c.pct}%</span></div>
                  <Progress value={c.pct} />
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('org.byGroup')} subtitle={t('dash.avgScore')} />
            <CardBody>{analytics.byGroup.length ? <BarSeries data={analytics.byGroup} x="name" y="score" unit="%" max={100} /> : <p className="text-sm text-navy-500">{t('common.noData')}</p>}</CardBody>
          </Card>
          {!isClinic && (
            <Card>
              <CardHeader title={t('org.byInstructor')} />
              <CardBody>
                <ul className="divide-y divide-line">
                  {analytics.byInstructor.map((i) => <li key={i.name} className="flex justify-between py-2 text-sm"><span>{i.name}</span><span className="text-navy-500">{i.classes} · {i.students} · {i.score === null ? '—' : `${i.score}%`}</span></li>)}
                </ul>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title={t('org.byCohort')} />
            <CardBody>
              {analytics.byCohort.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
                <ul className="divide-y divide-line">
                  {analytics.byCohort.map((c) => <li key={c.name} className="flex justify-between py-2 text-sm"><span>{c.name}</span><span className="text-navy-500">{c.n} · {c.score === null ? '—' : `${c.score}%`}</span></li>)}
                </ul>
              )}
            </CardBody>
          </Card>
          <p className="text-[12px] text-navy-500 xl:col-span-2">{t('org.aggregatedNote')}</p>
        </div>
      )}

      {tab === 'license' && (
        <Card className="mt-5">
          <CardHeader title={t('org.license')} icon={<Building2 className="h-4 w-4" />} />
          <CardBody className="space-y-3 text-sm">
            {seats.sub ? (
              <>
                <div className="flex flex-wrap gap-2"><Badge tone="warning">{t(`sub.${seats.sub.status}` as I18nKey)}</Badge><Badge tone="gray">{t('sub.manual')}</Badge></div>
                <div>{t('org.plan')}: <b>{PLAN_BY_ID[seats.sub.planId].name}</b></div>
                <div>{t('org.seats')}: <b>{seats.used} / {seats.total}</b></div>
                <Progress value={(seats.used / Math.max(1, seats.total)) * 100} className="max-w-sm" />
                <div>{t('org.validUntil')}: <b>{fmtDate(seats.sub.endsAt, locale)}</b></div>
              </>
            ) : <p className="text-navy-500">{t('org.noLicense')}</p>}
            <Link to="/pricing" className={buttonVariants({ variant: 'outline', size: 'sm' })}><Tag className="h-4 w-4" /> {t('nav.pricing')}</Link>
            {isClinic && <p className="text-[12px] text-navy-500">{t('org.recruitDisabled')}</p>}
          </CardBody>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={t('org.addUser')} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button loading={busy} onClick={addUser} data-testid="save-org-user">{t('common.create')}</Button></>}>
        <div className="space-y-4">
          <Field label={t('auth.fullName')}><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} name="fullName" /></Field>
          <Field label={t('auth.email')}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} name="email" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('auth.role')}>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'student' | 'instructor' })}>
                <option value="student">{t('role.student')}</option>
                {!isClinic && <option value="instructor">{t('role.instructor')}</option>}
              </Select>
            </Field>
            <Field label={t('cls.cohort')}><Input value={form.cohort} onChange={(e) => setForm({ ...form, cohort: e.target.value })} /></Field>
          </div>
        </div>
      </Dialog>
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} title={t('org.assignCourse')} footer={<><Button variant="secondary" onClick={() => setAssignOpen(false)}>{t('common.cancel')}</Button><Button disabled={!assignCourse} onClick={() => { try { assignCourseToOrgMembers(assignCourse, members.filter((m) => m.role === 'student').map((m) => m.id)); setErr(null); } catch (e) { setErr(errorKey(e)); } setAssignOpen(false); }}>{t('cls.assign')}</Button></>}>
        <Field label={t('nav.courses')} hint={`(${members.filter((m) => m.role === 'student').length} ${t('common.students').toLowerCase()})`}>
          <Select value={assignCourse} onChange={(e) => setAssignCourse(e.target.value)}>
            <option value="">—</option>
            {d.courses.filter((c) => c.status === 'published').map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select>
        </Field>
      </Dialog>
    </div>
  );
}
