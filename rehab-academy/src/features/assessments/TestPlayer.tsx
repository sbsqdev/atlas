import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useDb } from '@/data/db';
import { assessmentLocked, attemptsLeft, canTakeAssessment, questionsFor, submitAttempt, useMe } from '@/data/api';
import Paywall from '@/features/access/Paywall';
import type { AnswerValue, AssessmentAttempt, Question } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { fmtDateTime } from '@/lib/format';
import { Badge, Button, buttonVariants, Card, CardBody, CardHeader, Dialog, EduNotice, PageHeader } from '@/components/ui';
import { NotFound, Forbidden } from '@/pages/Status';
import { QuestionView } from './QuestionView';
import { shuffle } from '@/lib/shuffle';

type Run = { order: Question[]; answers: Record<string, AnswerValue>; checked: Set<string>; startedAt: number; i: number };

export default function TestPlayer() {
  const { id = '' } = useParams();
  const { t, locale } = useT();
  const u = useMe()!;
  const d = useDb();
  const a = d.assessments.find((x) => x.id === id);
  const [run, setRun] = useState<Run | null>(null);
  const [result, setResult] = useState<{ attempt: AssessmentAttempt; order: Question[]; timedOut: boolean } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<I18nKey | null>(null);
  const [now, setNow] = useState(Date.now());
  const runRef = useRef(run);
  runRef.current = run;

  const finish = useCallback((timedOut = false) => {
    const r = runRef.current;
    if (!r) return;
    try {
      const attempt = submitAttempt(id, r.answers, r.startedAt);
      setResult({ attempt, order: r.order, timedOut });
      setRun(null);
      setConfirm(false);
    } catch (e) { setErr(errorKey(e)); }
  }, [id]);

  const deadline = run && a?.timeLimitMin ? run.startedAt + a.timeLimitMin * 60_000 : null;
  useEffect(() => {
    if (!deadline) return;
    const h = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(h);
  }, [deadline]);
  useEffect(() => { if (deadline && now >= deadline) finish(true); }, [now, deadline, finish]);

  if (!a) return <NotFound />;
  if (assessmentLocked(u, a)) return <Paywall />;
  if (!canTakeAssessment(u, a)) return <Forbidden />;
  const qs = questionsFor(a.id);
  const left = attemptsLeft(u, a);
  const history = d.attempts.filter((x) => x.userId === u.id && x.assessmentId === a.id).sort((x, y) => y.completedAt - x.completedAt);
  const course = a.courseId ? d.courses.find((c) => c.id === a.courseId) : undefined;

  function start() {
    const order = a!.randomize ? shuffle(qs) : qs;
    const answers: Record<string, AnswerValue> = {};
    order.filter((q) => q.type === 'sequence').forEach((q) => { answers[q.id] = shuffle(q.sequence ?? []); });
    setErr(null);
    setResult(null);
    setRun({ order, answers, checked: new Set(), startedAt: Date.now(), i: 0 });
  }

  if (run) {
    const q = run.order[run.i];
    const isAnswered = (x: Question) => {
      const v = run.answers[x.id];
      return x.type === 'sequence' || (Array.isArray(v) ? v.length > 0 : typeof v === 'object' ? Object.keys(v).length > 0 : !!v);
    };
    const answeredCount = run.order.filter(isAnswered).length;
    const remaining = deadline ? Math.max(0, deadline - now) : null;
    const immediateChecked = a.feedback === 'immediate' && run.checked.has(q.id);
    return (
      <div className="animate-fade-up mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">{a.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-navy-500">{t('tests.answered')}: {answeredCount}/{run.order.length}</span>
            {remaining !== null && (
              <Badge tone={remaining < 60_000 ? 'error' : 'gray'} className="text-[13px]" data-testid="timer"><Clock className="h-3.5 w-3.5" /> {t('tests.timeLeft')} {Math.floor(remaining / 60000)}:{String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}</Badge>
            )}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {run.order.map((x, i) => (
            <button key={x.id} onClick={() => setRun({ ...run, i })} className={cn('h-9 w-9 rounded-lg text-[13px] font-semibold', i === run.i ? 'bg-navy text-white' : isAnswered(x) ? 'bg-teal-50 text-teal' : 'border border-line bg-white text-navy-500')}>{i + 1}</button>
          ))}
        </div>
        <Card className="p-6 md:p-8">
          <QuestionView key={q.id} q={q} index={run.i} value={run.answers[q.id]} reveal={immediateChecked} onChange={(v) => setRun({ ...run, answers: { ...run.answers, [q.id]: v } })} />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="ghost" disabled={run.i === 0} onClick={() => setRun({ ...run, i: run.i - 1 })}><ArrowLeft className="h-4 w-4" /> {t('common.back')}</Button>
            <div className="flex gap-2">
              {a.feedback === 'immediate' && !immediateChecked && <Button variant="outline" disabled={!isAnswered(q)} onClick={() => setRun({ ...run, checked: new Set(run.checked).add(q.id) })}>{t('tests.check')}</Button>}
              {run.i < run.order.length - 1
                ? <Button onClick={() => setRun({ ...run, i: run.i + 1 })} data-testid="q-next">{t('common.next')} <ArrowRight className="h-4 w-4" /></Button>
                : <Button onClick={() => (answeredCount < run.order.length ? setConfirm(true) : finish())} data-testid="test-submit">{t('tests.submit')}</Button>}
            </div>
          </div>
          {err && <p className="mt-3 text-sm text-error">{t(err)}</p>}
        </Card>
        <Dialog open={confirm} onClose={() => setConfirm(false)} title={t('tests.submit')} footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>{t('common.cancel')}</Button><Button onClick={() => finish()}>{t('tests.submit')}</Button></>}>
          <p className="text-sm">{t('tests.unanswered')}</p>
        </Dialog>
      </div>
    );
  }

  if (result) {
    const { attempt } = result;
    return (
      <div className="animate-fade-up mx-auto max-w-4xl space-y-6" data-testid="test-result">
        <Card>
          <CardBody className="flex flex-wrap items-center gap-6">
            <div className={cn('grid h-28 w-28 place-items-center rounded-full border-8 text-3xl font-bold', attempt.passed ? 'border-[#E3F5F1] text-success' : 'border-[#FBE7E9] text-error')} data-testid="test-score">{attempt.score}%</div>
            <div>
              <div className={cn('flex items-center gap-2 text-xl font-bold', attempt.passed ? 'text-success' : 'text-error')}>
                {attempt.passed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />} {t(attempt.passed ? 'tests.passed' : 'tests.failed')}
              </div>
              <p className="mt-1 text-sm text-navy-500">{t('tests.passing', { n: a.passingScore })} · {t('tests.attempt', { n: attempt.attemptNo })}</p>
              {result.timedOut && <p className="mt-1 text-sm text-warning">{t('tests.timeUp')}</p>}
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {attemptsLeft(u, a) > 0 && !attempt.passed && <Button variant="secondary" onClick={start}>{t('common.retry')}</Button>}
              {course && <Link to={`/courses/${course.id}`} className={buttonVariants()}>{t('tests.toCourse')}</Link>}
            </div>
          </CardBody>
        </Card>
        {a.feedback !== 'never' ? (
          result.order.map((q, i) => (
            <Card key={q.id} className="p-6"><QuestionView q={q} index={i} value={attempt.answers[q.id]} reveal onChange={() => undefined} /></Card>
          ))
        ) : <p className="text-sm text-navy-500">{t('tests.feedbackHidden')}</p>}
        <p className="text-[12.5px] text-navy-500">{t('tests.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow={course?.title} title={a.title} subtitle={t('tests.subtitle')} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Fact label={t('tests.questions')} value={qs.length} />
              <Fact label={t('builder.passing')} value={`${a.passingScore}%`} />
              <Fact label={t('builder.attempts')} value={left === Infinity ? '∞' : `${left} / ${a.maxAttempts}`} />
              <Fact label={t('sim.duration')} value={a.timeLimitMin ? `${a.timeLimitMin} ${t('common.min')}` : '—'} />
            </div>
            <p className="text-sm text-navy-500">{t('builder.feedback')}: {t(`builder.feedback.${a.feedback}` as I18nKey)}{a.randomize ? ` · ${t('builder.randomize')}` : ''}</p>
            {a.status !== 'published' && <Badge tone="warning">{t(`status.${a.status}` as I18nKey)}</Badge>}
            {left > 0 ? <Button size="lg" onClick={start} disabled={!qs.length} data-testid="test-start">{t('tests.start')}</Button> : <Badge tone="error">{t('tests.noAttempts')}</Badge>}
            {err && <p className="text-sm text-error">{t(err)}</p>}
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('tests.history')} />
            <CardBody>
              {history.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
                <ul className="divide-y divide-line">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{t('tests.attempt', { n: h.attemptNo })} · {fmtDateTime(h.completedAt, locale)}</span>
                      <Badge tone={h.passed ? 'success' : 'error'}>{h.score}%</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <EduNotice />
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-bg p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
