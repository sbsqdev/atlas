import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, Plus, Trash2, UserMinus } from 'lucide-react';
import { useDb } from '@/data/db';
import { addStudentToClass, assign, deleteAssignment, removeStudentFromClass, sendFeedback, useMe } from '@/data/api';
import { avg, bestAttempts, coursePct, lastActive } from '@/data/analytics';
import { sameOrg } from '@/data/rbac';
import { SIMULATIONS, SIM_BY_ID } from '@/data/content/simulations';
import type { User } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { downloadFile, fmtDate, toCsv } from '@/lib/format';
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Field, Input, PageHeader, Select, StatCard, Textarea } from '@/components/ui';
import { Forbidden, NotFound } from './Status';

type Kind = 'course' | 'simulation' | 'assessment';

export default function ClassDetail() {
  const { id = '' } = useParams();
  const { t, locale } = useT();
  const u = useMe()!;
  const d = useDb();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<I18nKey | null>(null);
  const [asg, setAsg] = useState<{ kind: Kind; refId: string; due: string } | null>(null);
  const [fb, setFb] = useState<{ student: User; text: string } | null>(null);
  const c = d.classes.find((x) => x.id === id);

  const options = useMemo(() => ({
    course: d.courses.filter((x) => x.status === 'published' && (x.orgId === null || x.orgId === u.orgId)).map((x) => ({ id: x.id, title: x.title })),
    simulation: SIMULATIONS.filter((s) => s.available).map((s) => ({ id: s.id, title: s.title })),
    assessment: d.assessments.filter((a) => a.status === 'published').map((a) => ({ id: a.id, title: a.title })),
  }), [d, u.orgId]);

  const rows = useMemo(() => {
    if (!c) return [];
    const courseIds = d.assignments.filter((a) => a.classId === c.id && a.kind === 'course').map((a) => a.refId);
    const testIds = new Set(d.assignments.filter((a) => a.classId === c.id && a.kind === 'assessment').map((a) => a.refId));
    const simIds = new Set(d.assignments.filter((a) => a.classId === c.id && a.kind === 'simulation').map((a) => a.refId));
    return c.studentIds.map((sid) => {
      const s = d.users.find((x) => x.id === sid)!;
      const best = bestAttempts(d, new Set([sid])).filter((a) => testIds.size === 0 || testIds.has(a.assessmentId));
      const sims = d.simAttempts.filter((x) => x.userId === sid && (simIds.size === 0 || simIds.has(x.simulationId)));
      return {
        s, progress: avg(courseIds.map((cid) => coursePct(d, sid, cid))) ?? 0, score: avg(best.map((a) => a.score)),
        sims: sims.length, simBest: sims.length ? Math.max(...sims.map((x) => Math.round((x.score / x.maxScore) * 100))) : null, last: lastActive(d, sid),
      };
    });
  }, [c, d]);

  if (!c) return <NotFound />;
  if (!sameOrg(u, c.orgId) || (u.role === 'instructor' && c.instructorId !== u.id)) return <Forbidden />;
  const guard = (fn: () => void) => { try { fn(); setErr(null); } catch (e) { setErr(errorKey(e)); } };
  const titleOf = (kind: Kind, refId: string) => options[kind].find((o) => o.id === refId)?.title ?? (kind === 'simulation' ? SIM_BY_ID[refId]?.title : refId);
  const participation = rows.length ? Math.round((rows.filter((r) => r.last).length / rows.length) * 100) : 0;

  function exportCsv() {
    const head = [t('auth.fullName'), t('auth.email'), t('cls.cohort'), `${t('courses.progress')} %`, `${t('dash.avgScore')} %`, t('dash.simulations'), `${t('sim.best')} %`, t('cls.lastActive')];
    const body = rows.map((r) => [r.s.fullName, r.s.email, r.s.cohort ?? '', r.progress, r.score ?? '', r.sims, r.simBest ?? '', r.last ? new Date(r.last).toISOString().slice(0, 10) : '']);
    downloadFile(`class-${c!.id}-results.csv`, toCsv([head, ...body]), 'text/csv;charset=utf-8');
  }

  return (
    <div className="animate-fade-up">
      <Link to="/teach/classes" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal"><ArrowLeft className="h-4 w-4" /> {t('cls.title')}</Link>
      <PageHeader title={c.name} subtitle={c.cohort} actions={<Button variant="secondary" onClick={exportCsv} data-testid="export-csv"><Download className="h-4 w-4" /> {t('common.export')}</Button>} />
      {err && <div className="mb-4 rounded-xl bg-[#FBE7E9] px-4 py-3 text-sm text-error">{t(err)}</div>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('common.students')} value={rows.length} />
        <StatCard label={t('courses.progress')} value={`${avg(rows.map((r) => r.progress)) ?? 0}%`} tone="cyan" />
        <StatCard label={t('dash.avgScore')} value={avg(rows.flatMap((r) => (r.score === null ? [] : [r.score]))) === null ? '—' : `${avg(rows.flatMap((r) => (r.score === null ? [] : [r.score])))}%`} tone="navy" />
        <StatCard label={t('cls.participation')} value={`${participation}%`} tone="warning" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-x-auto">
          <CardHeader title={t('cls.results')} />
          <table className="mt-3 w-full min-w-[720px] text-sm">
            <thead className="border-y border-line bg-bg text-left text-[12px] uppercase tracking-wider text-navy-500">
              <tr><th className="px-5 py-2.5">{t('auth.fullName')}</th><th className="px-3 py-2.5">{t('courses.progress')}</th><th className="px-3 py-2.5">{t('dash.avgScore')}</th><th className="px-3 py-2.5">{t('dash.simulations')}</th><th className="px-3 py-2.5">{t('cls.lastActive')}</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-navy-500">{t('cls.noStudents')}</td></tr>}
              {rows.map((r) => (
                <tr key={r.s.id}>
                  <td className="px-5 py-2.5"><div className="font-medium">{r.s.fullName}</div><div className="text-[12px] text-navy-500">{r.s.email}</div></td>
                  <td className="px-3 py-2.5">{r.progress}%</td>
                  <td className="px-3 py-2.5">{r.score === null ? '—' : <Badge tone={r.score >= 70 ? 'success' : 'error'}>{r.score}%</Badge>}</td>
                  <td className="px-3 py-2.5">{r.sims}{r.simBest !== null && <span className="text-navy-500"> · {r.simBest}%</span>}</td>
                  <td className="px-3 py-2.5 text-navy-500">{r.last ? fmtDate(r.last, locale) : '—'}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setFb({ student: r.s, text: '' })} aria-label={t('cls.sendFeedback')}><MessageSquare className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => guard(() => removeStudentFromClass(c.id, r.s.id))} aria-label={t('common.delete')}><UserMinus className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap gap-2 border-t border-line p-4">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('cls.studentEmail')} className="max-w-xs" name="studentEmail" />
            <Button variant="outline" onClick={() => { guard(() => addStudentToClass(c.id, email)); setEmail(''); }} disabled={!email.trim()} data-testid="add-student"><Plus className="h-4 w-4" /> {t('cls.addStudent')}</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('cls.assignments')} action={<Button size="sm" onClick={() => setAsg({ kind: 'simulation', refId: '', due: '' })} data-testid="new-assignment"><Plus className="h-4 w-4" /> {t('cls.assign')}</Button>} />
          <CardBody>
            <ul className="divide-y divide-line">
              {d.assignments.filter((a) => a.classId === c.id).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{titleOf(a.kind, a.refId)}</div>
                    <div className="text-[12px] text-navy-500">{t(`cls.kind.${a.kind}` as I18nKey)}{a.dueAt ? ` · ${t('dash.due')} ${fmtDate(a.dueAt, locale)}` : ''}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => guard(() => deleteAssignment(a.id))} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Dialog open={!!asg} onClose={() => setAsg(null)} title={t('cls.assign')} footer={<><Button variant="secondary" onClick={() => setAsg(null)}>{t('common.cancel')}</Button><Button disabled={!asg?.refId} onClick={() => { guard(() => assign(c.id, asg!.kind, asg!.refId, titleOf(asg!.kind, asg!.refId) ?? '', asg!.due ? new Date(asg!.due).getTime() : undefined)); setAsg(null); }} data-testid="save-assignment">{t('cls.assign')}</Button></>}>
        {asg && (
          <div className="space-y-4">
            <Field label={t('builder.lessonType')}>
              <Select value={asg.kind} onChange={(e) => setAsg({ ...asg, kind: e.target.value as Kind, refId: '' })} name="kind">
                {(['course', 'simulation', 'assessment'] as const).map((k) => <option key={k} value={k}>{t(`cls.kind.${k}` as I18nKey)}</option>)}
              </Select>
            </Field>
            <Field label={t('common.name')}>
              <Select value={asg.refId} onChange={(e) => setAsg({ ...asg, refId: e.target.value })} name="refId">
                <option value="">—</option>
                {options[asg.kind].map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </Select>
            </Field>
            <Field label={t('cls.due')}><Input type="date" value={asg.due} onChange={(e) => setAsg({ ...asg, due: e.target.value })} /></Field>
          </div>
        )}
      </Dialog>
      <Dialog open={!!fb} onClose={() => setFb(null)} title={`${t('cls.sendFeedback')}: ${fb?.student.fullName ?? ''}`} footer={<><Button variant="secondary" onClick={() => setFb(null)}>{t('common.cancel')}</Button><Button disabled={!fb?.text.trim()} onClick={() => { guard(() => sendFeedback(fb!.student.id, fb!.text.trim())); setFb(null); }}>{t('common.save')}</Button></>}>
        <Textarea value={fb?.text ?? ''} onChange={(e) => fb && setFb({ ...fb, text: e.target.value })} />
      </Dialog>
    </div>
  );
}
