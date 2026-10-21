import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardList, MessageCircleQuestion, UserRound, XCircle } from 'lucide-react';
import { PATIENT_BY_ID } from '@/data/content/patients';
import { STRUCTURE_BY_ID } from '@/data/content/anatomy';
import { hasEnt, savePatientAttempt, useMe } from '@/data/api';
import type { PatientAttempt } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge, Button, buttonVariants, Card, CardBody, CardHeader, EduNotice, PageHeader } from '@/components/ui';
import { NotFound } from './Status';
import { LockedNotice } from '@/features/simulations/SimLibrary';

type Stage = 'history' | 'exam' | 'analysis' | 'debrief';
const STAGES: { id: Stage; key: I18nKey }[] = [
  { id: 'history', key: 'vp.history' }, { id: 'exam', key: 'vp.exam' }, { id: 'analysis', key: 'vp.analysis' }, { id: 'debrief', key: 'vp.debrief' },
];

export default function PatientPlayer() {
  const { id = '' } = useParams();
  const { t } = useT();
  const u = useMe()!;
  const vp = PATIENT_BY_ID[id];
  const [stage, setStage] = useState<Stage>('history');
  const [asked, setAsked] = useState<string[]>([]);
  const [requested, setRequested] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PatientAttempt | null>(null);
  if (!vp) return <NotFound />;
  const entitled = hasEnt(u, 'virtual_patients');

  const relevantHistory = vp.history.filter((h) => h.relevant);
  const relevantExams = vp.exams.filter((e) => e.relevant);
  function finish() {
    const hist = relevantHistory.every((h) => asked.includes(h.id)) ? 1 : 0;
    const exam = relevantExams.every((e) => requested.includes(e.id)) ? 1 : 0;
    const qs = vp.questions.filter((q) => q.options.find((o) => o.id === answers[q.id])?.correct).length;
    setResult(savePatientAttempt({ caseId: vp.id, asked, requested, answers, score: hist + exam + qs, maxScore: vp.questions.length + 2 }));
    setStage('debrief');
  }

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow={t('vp.synthetic')} title={vp.title} actions={<Link to="/patients" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>{t('common.back')}</Link>} />
      {!entitled ? <LockedNotice /> : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader title={t('vp.profile')} icon={<UserRound className="h-4 w-4" />} />
              <CardBody className="space-y-2 text-sm">
                <div className="text-lg font-semibold">{vp.patient.alias}</div>
                <div><span className="text-navy-500">{t('vp.age')}:</span> {vp.patient.age}, {vp.patient.sex}</div>
                <div><span className="text-navy-500">{t('vp.occupation')}:</span> {vp.patient.occupation}</div>
                <Badge tone="warning">{t('vp.synthetic')}</Badge>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t('vp.complaint')} />
              <CardBody><p className="text-sm leading-relaxed text-navy-700">{vp.scenario}</p></CardBody>
            </Card>
            <ol className="space-y-1.5">
              {STAGES.map((s, i) => (
                <li key={s.id} className={cn('rounded-xl border px-3 py-2 text-[13px] font-semibold', s.id === stage ? 'border-teal bg-teal text-white' : STAGES.findIndex((x) => x.id === stage) > i ? 'border-teal/30 bg-teal-50 text-teal' : 'border-line bg-white text-navy-300')}>{i + 1}. {t(s.key)}</li>
              ))}
            </ol>
            <EduNotice />
          </div>

          <div>
            {stage === 'history' && (
              <Card>
                <CardHeader title={t('vp.history')} subtitle={t('vp.historyHint')} icon={<MessageCircleQuestion className="h-4 w-4" />} />
                <CardBody className="space-y-2">
                  {vp.history.map((h) => (
                    <div key={h.id} className="rounded-xl border border-line p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{h.q}</span>
                        {!asked.includes(h.id) && <Button size="sm" variant="outline" onClick={() => setAsked([...asked, h.id])} data-testid={`ask-${h.id}`}>{t('vp.ask')}</Button>}
                      </div>
                      {asked.includes(h.id) && <p className="mt-2 rounded-lg bg-bg px-3 py-2 text-sm text-navy-700">«{h.a}»</p>}
                    </div>
                  ))}
                  <div className="flex justify-end pt-2"><Button onClick={() => setStage('exam')} data-testid="vp-next">{t('common.next')} <ArrowRight className="h-4 w-4" /></Button></div>
                </CardBody>
              </Card>
            )}
            {stage === 'exam' && (
              <Card>
                <CardHeader title={t('vp.exam')} subtitle={t('vp.examHint')} icon={<ClipboardList className="h-4 w-4" />} />
                <CardBody className="space-y-2">
                  {vp.exams.map((e) => (
                    <div key={e.id} className="rounded-xl border border-line p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{e.name}</span>
                        {!requested.includes(e.id) && <Button size="sm" variant="outline" onClick={() => setRequested([...requested, e.id])} data-testid={`req-${e.id}`}>{t('vp.request')}</Button>}
                      </div>
                      {requested.includes(e.id) && <p className="mt-2 rounded-lg bg-bg px-3 py-2 text-sm text-navy-700">{e.finding}</p>}
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={() => setStage('history')}>{t('common.back')}</Button>
                    <Button onClick={() => setStage('analysis')} data-testid="vp-next">{t('vp.toAnalysis')} <ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </CardBody>
              </Card>
            )}
            {stage === 'analysis' && (
              <Card>
                <CardHeader title={t('vp.analysis')} />
                <CardBody className="space-y-5">
                  {vp.questions.map((q, i) => (
                    <fieldset key={q.id}>
                      <legend className="text-sm font-semibold">{i + 1}. {q.prompt}</legend>
                      <div className="mt-2 space-y-1.5">
                        {q.options.map((o) => (
                          <label key={o.id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm', answers[q.id] === o.id ? 'border-teal bg-teal-50' : 'border-line hover:border-teal/50')}>
                            <input type="radio" name={q.id} checked={answers[q.id] === o.id} onChange={() => setAnswers({ ...answers, [q.id]: o.id })} className="mt-0.5 accent-teal" />
                            {o.text}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStage('exam')}>{t('common.back')}</Button>
                    <Button onClick={finish} disabled={Object.keys(answers).length < vp.questions.length} data-testid="vp-finish">{t('common.finish')}</Button>
                  </div>
                </CardBody>
              </Card>
            )}
            {stage === 'debrief' && result && (
              <div className="space-y-4" data-testid="vp-debrief">
                <Card>
                  <CardBody className="flex flex-wrap items-center gap-5">
                    <div className="grid h-24 w-24 place-items-center rounded-full border-8 border-teal-50 text-2xl font-bold text-teal">{result.score}/{result.maxScore}</div>
                    <div>
                      <div className="text-lg font-semibold">{t('vp.debrief')}</div>
                      <div className="flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> {t('sim.savedText')}</div>
                    </div>
                    <Button variant="secondary" className="ml-auto" onClick={() => { setStage('history'); setAsked([]); setRequested([]); setAnswers({}); setResult(null); }}>{t('sim.restart')}</Button>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title={t('vp.relevantAsked')} />
                  <CardBody className="space-y-1.5">
                    {relevantHistory.map((h) => <Check key={h.id} ok={asked.includes(h.id)} text={h.q} />)}
                    {vp.history.filter((h) => !h.relevant && asked.includes(h.id)).map((h) => <p key={h.id} className="text-[12.5px] text-navy-500">• {h.q} — {t('vp.irrelevant')}</p>)}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title={t('vp.relevantExams')} />
                  <CardBody className="space-y-1.5">{relevantExams.map((e) => <Check key={e.id} ok={requested.includes(e.id)} text={e.name} />)}</CardBody>
                </Card>
                <Card>
                  <CardHeader title={t('vp.analysis')} />
                  <CardBody className="space-y-3">
                    {vp.questions.map((q) => {
                      const o = q.options.find((x) => x.id === answers[q.id]);
                      return (
                        <div key={q.id} className="rounded-xl border border-line p-3">
                          <div className="text-sm font-semibold">{q.prompt}</div>
                          <p className={cn('mt-1 text-[13px]', o?.correct ? 'text-success' : 'text-error')}>{o?.correct ? '✓' : '✗'} {o?.text} — {o?.feedback}</p>
                          {!o?.correct && <p className="mt-1 text-[13px] text-success">✓ {q.options.find((x) => x.correct)?.text}</p>}
                        </div>
                      );
                    })}
                    <div className="flex flex-wrap gap-2 pt-1">{vp.anatomy.map((a) => <Link key={a} to={`/anatomy?s=${a}`} className="rounded-full bg-teal-50 px-3 py-1 text-[12px] font-semibold text-teal">{STRUCTURE_BY_ID[a]?.name}</Link>)}</div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return <div className="flex items-center gap-2 text-sm">{ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-error" />}{text}</div>;
}
