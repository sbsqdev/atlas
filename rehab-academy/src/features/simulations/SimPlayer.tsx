import { useMemo, useRef, useState } from 'react';
import { shuffle } from '@/lib/shuffle';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookMarked, CheckCircle2, Eye, Target, XCircle } from 'lucide-react';
import { SIM_BY_ID } from '@/data/content/simulations';
import { STRUCTURE_BY_ID } from '@/data/content/anatomy';
import { useDb } from '@/data/db';
import { hasEnt, saveSimAttempt, useMe } from '@/data/api';
import type { SimNode, SimOption, SimulationAttempt } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { fmtDateTime } from '@/lib/format';
import { Badge, Button, buttonVariants, Card, CardBody, CardHeader, EduNotice, PageHeader, Progress } from '@/components/ui';
import { NotFound } from '@/pages/Status';
import { KneeViewer } from '@/features/anatomy/KneeViewer';
import { MovementSchematic } from './MovementSchematic';
import { LockedNotice } from './SimLibrary';

type Stage = 'intro' | 'run' | 'evaluate';
type Decision = SimulationAttempt['decisions'][number];
const STEPS: I18nKey[] = ['sim.step.intro', 'sim.step.explore', 'sim.step.decide', 'sim.step.feedback', 'sim.step.evaluate', 'sim.step.saved'];
const MAX_WRONG_PICKS = 2;

export default function SimPlayer() {
  const { id = '' } = useParams();
  const { t, locale } = useT();
  const u = useMe()!;
  const sim = SIM_BY_ID[id];
  const history = useDb((s) => s.simAttempts);
  const [stage, setStage] = useState<Stage>('intro');
  const [i, setI] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [answered, setAnswered] = useState(false);
  const [saved, setSaved] = useState<SimulationAttempt | null>(null);
  const started = useRef(Date.now());

  if (!sim) return <NotFound />;
  if (!sim.available) return <PageHeader title={sim.title} subtitle={t('sim.soonText')} />;
  const entitled = hasEnt(u, 'simulations');
  const node = sim.nodes[i];
  const mine = history.filter((a) => a.userId === u.id && a.simulationId === sim.id).sort((a, b) => b.completedAt - a.completedAt);

  const stepIndex = stage === 'intro' ? 0 : stage === 'evaluate' ? (saved ? 5 : 4) : answered ? 3 : node.kind === 'explore' ? 1 : 2;

  function record(d: Decision) {
    setDecisions((prev) => [...prev.filter((x) => x.nodeId !== d.nodeId), d]);
    setAnswered(true);
  }
  function next() {
    setAnswered(false);
    if (i + 1 < sim.nodes.length) { setI(i + 1); return; }
    const final = decisions;
    const score = final.filter((d) => d.correct).length;
    setStage('evaluate');
    setSaved(saveSimAttempt({ simulationId: sim.id, score, maxScore: sim.nodes.length, decisions: final, durationSec: Math.round((Date.now() - started.current) / 1000) }));
  }
  function restart() {
    setStage('run'); setI(0); setDecisions([]); setAnswered(false); setSaved(null); started.current = Date.now();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow={t(`sim.cat.${sim.category}` as I18nKey)} title={sim.title} actions={<Link to="/simulations" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>{t('sim.toLibrary')}</Link>} />
      <ol className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6" aria-label="steps">
        {STEPS.map((k, idx) => (
          <li key={k} className={cn('rounded-xl border px-3 py-2 text-[12px] font-semibold', idx === stepIndex ? 'border-teal bg-teal text-white' : idx < stepIndex ? 'border-teal/30 bg-teal-50 text-teal' : 'border-line bg-white text-navy-300')}>
            <span className="mr-1 opacity-70">{idx + 1}.</span>{t(k)}
          </li>
        ))}
      </ol>
      {!entitled && <LockedNotice />}

      {stage === 'intro' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardBody className="space-y-5">
              <section>
                <h2 className="font-semibold">{t('sim.context')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-navy-700">{sim.context}</p>
              </section>
              <section>
                <h2 className="font-semibold">{t('sim.objectives')}</h2>
                <ul className="mt-2 space-y-1.5">{sim.objectives.map((o) => <li key={o} className="flex gap-2 text-sm"><Target className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{o}</li>)}</ul>
              </section>
              <section>
                <h2 className="font-semibold">{t('sim.required')}</h2>
                <ul className="mt-1 list-disc pl-5 text-sm text-navy-700">{sim.requiredKnowledge.map((r) => <li key={r}>{r}</li>)}</ul>
              </section>
              <section>
                <h2 className="font-semibold">{t('sim.anatomy')}</h2>
                <div className="mt-2 flex flex-wrap gap-2">{sim.anatomy.map((a) => <Link key={a} to={`/anatomy?s=${a}`} className="rounded-full bg-teal-50 px-3 py-1 text-[12px] font-semibold text-teal">{STRUCTURE_BY_ID[a]?.name}</Link>)}</div>
              </section>
              <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
                <Button size="lg" onClick={restart} disabled={!entitled} data-testid="sim-start">{t('sim.start')} <ArrowRight className="h-4 w-4" /></Button>
                <span className="text-sm text-navy-500">{t('sim.difficulty')}: {t(`sim.diff.${sim.difficulty}` as I18nKey)} · {sim.durationMin} {t('common.min')} · {sim.nodes.length} {t('sim.stepsCount')}</span>
              </div>
            </CardBody>
          </Card>
          <div className="space-y-4">
            <History items={mine} locale={locale} />
            <EduNotice />
          </div>
        </div>
      )}

      {stage === 'run' && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Progress value={((i + (answered ? 1 : 0)) / sim.nodes.length) * 100} />
            <span className="shrink-0 text-sm font-semibold">{i + 1} / {sim.nodes.length}</span>
          </div>
          {node.kind === 'explore'
            ? <ExploreNode key={node.id} node={node} onDone={(correct, wrong) => record({ nodeId: node.id, optionIds: wrong, correct })} answered={answered} />
            : <ChoiceNode key={node.id} node={node} onAnswer={record} answered={answered} />}
          {answered && (
            <div className="mt-4 flex justify-end">
              <Button size="lg" onClick={next} data-testid="sim-next">{i + 1 < sim.nodes.length ? t('common.next') : t('sim.toEvaluation')} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {stage === 'evaluate' && saved && <Evaluation sim={sim} attempt={saved} onRestart={restart} />}
    </div>
  );
}

function ExploreNode({ node, onDone, answered }: { node: Extract<SimNode, { kind: 'explore' }>; onDone: (correct: boolean, wrong: string[]) => void; answered: boolean }) {
  const { t } = useT();
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  function pick(id: string) {
    if (answered) return;
    if (node.targets.includes(id)) {
      const f = found.includes(id) ? found : [...found, id];
      setFound(f);
      setFlash(null);
      if (f.length === node.targets.length) onDone(wrong.length <= MAX_WRONG_PICKS, wrong);
    } else {
      setWrong((w) => [...w, id]);
      setFlash(id);
      setTimeout(() => setFlash((x) => (x === id ? null : x)), 900);
    }
  }
  function reveal() {
    setRevealed(true);
    setFound(node.targets);
    onDone(false, wrong);
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <div className="h-[460px] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#E8EEF4_75%)]">
        <KneeViewer className="h-full" found={found} flash={flash} onPick={pick} errorText={t('anat.loadError')} loadingText={t('common.loading')} />
      </div>
      <Card>
        <CardHeader title={node.title} subtitle={t('sim.identifyTask')} />
        <CardBody className="space-y-3">
          <p className="text-sm text-navy-700">{node.text}</p>
          <ul className="space-y-1.5" data-testid="explore-targets">
            {node.targets.map((id) => (
              <li key={id} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', found.includes(id) ? 'border-success/40 bg-[#E3F5F1] text-success' : 'border-line')}>
                {found.includes(id) ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4 text-navy-300" />}
                {STRUCTURE_BY_ID[id].name}
              </li>
            ))}
          </ul>
          <div className="text-[12px] text-navy-500">{t('sim.found')}: {found.length} / {node.targets.length} · {t('sim.wrongPicks')}: {wrong.length}</div>
          {flash && <div className="text-[13px] font-semibold text-error">{t('anat.quizWrong', { name: STRUCTURE_BY_ID[flash]?.name ?? flash })}</div>}
          {answered && (
            <div className={cn('rounded-xl p-3 text-sm', revealed || wrong.length > MAX_WRONG_PICKS ? 'bg-[#FDF3DF] text-[#7A5410]' : 'bg-[#E3F5F1] text-success')}>
              {revealed ? t('sim.revealed') : wrong.length > MAX_WRONG_PICKS ? t('sim.tooManyWrong', { n: MAX_WRONG_PICKS }) : t('sim.allFound')}
            </div>
          )}
          {!answered && <Button variant="ghost" size="sm" onClick={reveal}><Eye className="h-4 w-4" /> {t('sim.reveal')}</Button>}
        </CardBody>
      </Card>
    </div>
  );
}

function ChoiceNode({ node, onAnswer, answered }: { node: Extract<SimNode, { kind: 'movement' | 'decision' }>; onAnswer: (d: Decision) => void; answered: boolean }) {
  const { t } = useT();
  const [angle, setAngle] = useState(90);
  const [picked, setPicked] = useState<string[]>([]);
  const options = useMemo(() => shuffle(node.options), [node]);
  const multi = node.kind === 'decision' && node.multi;
  const question = node.kind === 'movement' ? node.question : node.text;
  function toggle(o: SimOption) {
    if (answered) return;
    setPicked((p) => (multi ? (p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id]) : [o.id]));
  }
  function submit() {
    const want = node.options.filter((o) => o.correct).map((o) => o.id).sort();
    const got = [...picked].sort();
    onAnswer({ nodeId: node.id, optionIds: picked, correct: want.length === got.length && want.every((x, k) => x === got[k]) });
  }
  const correct = answered && (() => {
    const want = node.options.filter((o) => o.correct).map((o) => o.id).sort();
    const got = [...picked].sort();
    return want.length === got.length && want.every((x, k) => x === got[k]);
  })();
  return (
    <div className={cn('grid gap-4', node.kind === 'movement' && 'lg:grid-cols-[380px_1fr]')}>
      {node.kind === 'movement' && (
        <div>
          <MovementSchematic angle={angle} onChange={setAngle} />
          <p className="mt-2 text-[13px] text-navy-500">{node.text}</p>
        </div>
      )}
      <Card>
        <CardHeader title={node.title} subtitle={multi ? t('tests.chooseMany') : t('tests.chooseOne')} />
        <CardBody>
          <p className="text-[15px] font-medium">{question}</p>
          <div className="mt-4 space-y-2" role={multi ? 'group' : 'radiogroup'}>
            {options.map((o) => {
              const on = picked.includes(o.id);
              return (
                <div key={o.id}>
                  <button
                    onClick={() => toggle(o)} disabled={answered} data-testid={`opt-${o.id}`}
                    className={cn('flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                      answered ? (o.correct ? 'border-success bg-[#E3F5F1]' : on ? 'border-error bg-[#FBE7E9]' : 'border-line opacity-70') : on ? 'border-teal bg-teal-50' : 'border-line hover:border-teal/50')}
                  >
                    <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center border-2', multi ? 'rounded' : 'rounded-full', on ? 'border-teal bg-teal' : 'border-navy-300')} />
                    <span>{o.text}</span>
                  </button>
                  {answered && (on || o.correct) && <p className={cn('mt-1 px-4 text-[12.5px]', o.correct ? 'text-success' : 'text-error')}>{o.feedback}</p>}
                </div>
              );
            })}
          </div>
          {answered ? (
            <div className={cn('mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold', correct ? 'bg-[#E3F5F1] text-success' : 'bg-[#FBE7E9] text-error')} data-testid="sim-feedback">
              {correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />} {t(correct ? 'sim.correct' : 'sim.incorrect')}
            </div>
          ) : (
            <Button className="mt-4" onClick={submit} disabled={!picked.length} data-testid="sim-answer">{t('sim.answer')}</Button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Evaluation({ sim, attempt, onRestart }: { sim: NonNullable<(typeof SIM_BY_ID)[string]>; attempt: SimulationAttempt; onRestart: () => void }) {
  const { t } = useT();
  const pct = Math.round((attempt.score / attempt.maxScore) * 100);
  const byNode = new Map(attempt.decisions.map((d) => [d.nodeId, d]));
  const mistakes = sim.nodes.filter((n) => !byNode.get(n.id)?.correct);
  const objectives = sim.objectives.map((o) => {
    const nodes = sim.nodes.filter((n) => (n.kind === 'explore' ? o === sim.objectives[0] : n.objective === o));
    return { o, met: nodes.length > 0 && nodes.every((n) => byNode.get(n.id)?.correct) };
  });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]" data-testid="sim-evaluation">
      <div className="space-y-6">
        <Card>
          <CardBody className="flex flex-wrap items-center gap-6">
            <div className="grid h-28 w-28 place-items-center rounded-full border-8 border-teal-50 text-3xl font-bold text-teal" data-testid="sim-score">{pct}%</div>
            <div>
              <div className="text-sm text-navy-500">{t('sim.yourScore')}</div>
              <div className="text-2xl font-bold">{attempt.score} {t('common.of')} {attempt.maxScore}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> {t('sim.savedText')}</div>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={onRestart}>{t('sim.restart')}</Button>
              <Link to="/simulations" className={buttonVariants()}>{t('sim.toLibrary')}</Link>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('sim.mistakes')} />
          <CardBody className="space-y-3">
            {mistakes.length === 0 && <p className="text-sm text-success">{t('sim.noMistakes')}</p>}
            {mistakes.map((n) => {
              const d = byNode.get(n.id);
              const opts = n.kind === 'explore' ? [] : n.options;
              return (
                <div key={n.id} className="rounded-xl border border-line p-3">
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.kind === 'explore'
                    ? <p className="mt-1 text-[13px] text-navy-700">{t('sim.exploreMistake', { names: n.targets.map((x) => STRUCTURE_BY_ID[x].name).join(', ') })}</p>
                    : (
                      <ul className="mt-1 space-y-1 text-[13px]">
                        {opts.filter((o) => d?.optionIds.includes(o.id) && !o.correct).map((o) => <li key={o.id} className="text-error">✗ {o.text} — {o.feedback}</li>)}
                        {opts.filter((o) => o.correct).map((o) => <li key={o.id} className="text-success">✓ {o.text}</li>)}
                      </ul>
                    )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader title={t('sim.objectivesMet')} />
          <CardBody className="space-y-2">
            {objectives.map(({ o, met }) => (
              <div key={o} className="flex gap-2 text-sm">{met ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy-300" />}{o}</div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('sim.reading')} icon={<BookMarked className="h-4 w-4" />} />
          <CardBody className="space-y-2">{sim.reading.map((r) => <p key={r.title} className="text-[13px]"><b>{r.title}</b><br /><span className="text-navy-500">{r.source}</span></p>)}</CardBody>
        </Card>
        <EduNotice />
      </div>
    </div>
  );
}

function History({ items, locale }: { items: SimulationAttempt[]; locale: Parameters<typeof fmtDateTime>[1] }) {
  const { t } = useT();
  const best = useMemo(() => (items.length ? Math.max(...items.map((a) => Math.round((a.score / a.maxScore) * 100))) : null), [items]);
  return (
    <Card>
      <CardHeader title={t('prog.sims')} action={best !== null ? <Badge tone="success">{t('sim.best')}: {best}%</Badge> : undefined} />
      <CardBody>
        {items.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
          <ul className="divide-y divide-line">
            {items.slice(0, 5).map((a) => (
              <li key={a.id} className="flex justify-between py-2 text-sm"><span>{fmtDateTime(a.completedAt, locale)}</span><b>{a.score}/{a.maxScore}</b></li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
