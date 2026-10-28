import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDb } from '@/data/db';
import {
  addModule, allowedMoves, createAssessment, deleteLesson, deleteModule, deleteQuestion, moveLesson, renameModule, saveLesson, saveQuestion,
  transitionCourse, updateAssessment, updateCourse, useMe,
} from '@/data/api';
import { ANATOMY_MODELS, MODEL_IDS, STRUCTURE_BY_ID } from '@/data/content/anatomy';
import { SIMULATIONS } from '@/data/content/simulations';
import type { Assessment, ContentStatus, Course, Lesson, LessonType, Level, ModelId, Question, QuestionType } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { fmtDateTime } from '@/lib/format';
import { Badge, Button, buttonVariants, Card, CardBody, CardHeader, Dialog, EmptyState, Field, Input, PageHeader, Select, Tabs, Textarea } from '@/components/ui';
import { NotFound, Forbidden } from '@/pages/Status';
import { STATUS_TONE } from './Builder';
import { LESSON_ICON } from './CourseDetail';

type Tab = 'content' | 'settings' | 'test' | 'history';
const LESSON_TYPES: LessonType[] = ['text', 'video', 'anatomy', 'simulation', 'quiz', 'file'];
const Q_TYPES: QuestionType[] = ['single', 'multi', 'match', 'sequence', 'identify', 'case'];
const MOVE_KEY: Record<ContentStatus, I18nKey> = {
  medical_review: 'builder.submitReview', approved: 'review.approve', published: 'review.publish', archived: 'builder.archive', draft: 'builder.restore',
};

export default function CourseEditor() {
  const { id = '' } = useParams();
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const [tab, setTab] = useState<Tab>('content');
  const [err, setErr] = useState<I18nKey | null>(null);
  const [move, setMove] = useState<ContentStatus | null>(null);
  const [note, setNote] = useState('');
  const c = d.courses.find((x) => x.id === id);
  if (!c) return <NotFound />;
  if (c.instructorId !== u.id && u.role !== 'super_admin') return <Forbidden />;
  const editable = c.status === 'draft';
  const moves = allowedMoves(u, c);
  const guard = (fn: () => void) => { try { fn(); setErr(null); } catch (e) { setErr(errorKey(e)); } };

  return (
    <div className="animate-fade-up">
      <Link to="/teach/builder" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal"><ArrowLeft className="h-4 w-4" /> {t('builder.title')}</Link>
      <PageHeader
        title={c.title}
        eyebrow={<Badge tone={STATUS_TONE[c.status]}>{t(`status.${c.status}` as I18nKey)}</Badge>}
        actions={<>
          <Link to={`/courses/${c.id}`} className={buttonVariants({ variant: 'secondary' })}><Eye className="h-4 w-4" /> {t('courses.preview')}</Link>
          {moves.map((m) => <Button key={m} variant={m === 'archived' ? 'secondary' : 'primary'} onClick={() => { setMove(m); setNote(''); }} data-testid={`move-${m}`}>{t(MOVE_KEY[m])}</Button>)}
        </>}
      />
      <p className="-mt-3 mb-4 text-[13px] text-navy-500">{t('review.subtitle')}</p>
      {!editable && <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-navy-500"><Lock className="h-4 w-4" /> {t('builder.lockedReview')}</div>}
      {err && <div className="mb-4 rounded-xl bg-[#FBE7E9] px-4 py-3 text-sm text-error">{t(err)}</div>}
      <Tabs value={tab} onChange={setTab} items={[
        { value: 'content', label: t('courses.program') }, { value: 'settings', label: t('nav.settings') },
        { value: 'test', label: t('nav.assessments') }, { value: 'history', label: t('builder.history') },
      ]} />
      <div className="mt-5">
        {tab === 'content' && <ContentTab c={c} editable={editable} guard={guard} />}
        {tab === 'settings' && <SettingsTab c={c} editable={editable} guard={guard} />}
        {tab === 'test' && <TestTab c={c} editable={editable} guard={guard} />}
        {tab === 'history' && <HistoryTab c={c} />}
      </div>
      <Dialog open={!!move} onClose={() => setMove(null)} title={move ? t(MOVE_KEY[move]) : ''} footer={<><Button variant="secondary" onClick={() => setMove(null)}>{t('common.cancel')}</Button><Button onClick={() => { guard(() => transitionCourse(c.id, move!, note || undefined)); setMove(null); }} data-testid="confirm-move">{t('common.yes')}</Button></>}>
        <Field label={t('review.note')}><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </Dialog>
    </div>
  );
}

type TabProps = { c: Course; editable: boolean; guard: (fn: () => void) => void };

function ContentTab({ c, editable, guard }: TabProps) {
  const { t } = useT();
  const d = useDb();
  const [modTitle, setModTitle] = useState('');
  const [lesson, setLesson] = useState<(Partial<Lesson> & { moduleId: string }) | null>(null);
  const modules = d.modules.filter((m) => m.courseId === c.id).sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-4">
      {modules.length === 0 && <EmptyState title={t('builder.noModules')} />}
      {modules.map((m) => (
        <Card key={m.id}>
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <input defaultValue={m.title} disabled={!editable} onBlur={(e) => e.target.value !== m.title && guard(() => renameModule(m.id, e.target.value))} className="min-w-0 flex-1 bg-transparent font-semibold focus:outline-none disabled:text-navy" aria-label={t('builder.moduleTitle')} />
            {editable && <Button size="sm" variant="ghost" onClick={() => guard(() => deleteModule(m.id))} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>}
          </div>
          <ul className="divide-y divide-line">
            {d.lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order).map((l) => {
              const Icon = LESSON_ICON[l.type];
              return (
                <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <Icon className="h-4 w-4 text-teal" />
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span className="text-[12px] text-navy-500">{t(`lesson.${l.type}` as I18nKey)}</span>
                  {editable && (
                    <span className="flex gap-0.5">
                      <Button size="icon" variant="ghost" onClick={() => guard(() => moveLesson(l.id, -1))} aria-label={t('tests.moveUp')}><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => guard(() => moveLesson(l.id, 1))} aria-label={t('tests.moveDown')}><ArrowDown className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setLesson(l)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => guard(() => deleteLesson(l.id))} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {editable && <div className="px-5 py-3"><Button size="sm" variant="outline" onClick={() => setLesson({ moduleId: m.id, type: 'text' })} data-testid="add-lesson"><Plus className="h-4 w-4" /> {t('builder.addLesson')}</Button></div>}
        </Card>
      ))}
      {editable && (
        <Card className="flex flex-wrap gap-2 p-4">
          <Input value={modTitle} onChange={(e) => setModTitle(e.target.value)} placeholder={t('builder.moduleTitle')} className="max-w-sm" name="moduleTitle" />
          <Button onClick={() => { if (modTitle.trim()) { guard(() => addModule(c.id, modTitle.trim())); setModTitle(''); } }} data-testid="add-module"><Plus className="h-4 w-4" /> {t('builder.addModule')}</Button>
        </Card>
      )}
      {lesson && <LessonDialog c={c} initial={lesson} onClose={() => setLesson(null)} guard={guard} />}
    </div>
  );
}

function LessonDialog({ c, initial, onClose, guard }: { c: Course; initial: Partial<Lesson> & { moduleId: string }; onClose: () => void; guard: TabProps['guard'] }) {
  const { t } = useT();
  const d = useDb();
  const [l, setL] = useState<Partial<Lesson> & { moduleId: string }>({ durationMin: 10, ...initial });
  const tests = d.assessments.filter((a) => a.courseId === c.id);
  function save() {
    if (!l.title?.trim()) return;
    guard(() => saveLesson({ ...l, courseId: c.id, title: l.title!.trim(), type: l.type ?? 'text', durationMin: l.durationMin ?? 10 } as Lesson));
    onClose();
  }
  return (
    <Dialog open onClose={onClose} wide title={l.id ? t('common.edit') : t('builder.addLesson')} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button onClick={save} disabled={!l.title?.trim()} data-testid="save-lesson">{t('common.save')}</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
          <Field label={t('builder.lessonTitle')}><Input value={l.title ?? ''} onChange={(e) => setL({ ...l, title: e.target.value })} name="lessonTitle" /></Field>
          <Field label={t('builder.lessonType')}>
            <Select value={l.type} onChange={(e) => setL({ ...l, type: e.target.value as LessonType })} name="lessonType">
              {LESSON_TYPES.map((x) => <option key={x} value={x}>{t(`lesson.${x}` as I18nKey)}</option>)}
            </Select>
          </Field>
          <Field label={t('common.min')}><Input type="number" min={1} value={l.durationMin} onChange={(e) => setL({ ...l, durationMin: Number(e.target.value) })} /></Field>
        </div>
        <Field label={t('builder.lessonBody')} hint={t('builder.mdHint')}><Textarea className="min-h-40" value={l.body ?? ''} onChange={(e) => setL({ ...l, body: e.target.value })} name="lessonBody" /></Field>
        {l.type === 'video' && <Field label={t('builder.videoUrl')}><Input value={l.videoUrl ?? ''} onChange={(e) => setL({ ...l, videoUrl: e.target.value })} /></Field>}
        {l.type === 'file' && <Field label={t('builder.fileUrl')}><Input value={l.fileUrl ?? ''} onChange={(e) => setL({ ...l, fileUrl: e.target.value })} /></Field>}
        {l.type === 'simulation' && (
          <Field label={t('builder.attachSim')}>
            <Select value={l.simulationId ?? ''} onChange={(e) => setL({ ...l, simulationId: e.target.value })}>
              <option value="">—</option>
              {SIMULATIONS.filter((s) => s.available).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </Select>
          </Field>
        )}
        {l.type === 'quiz' && (
          <Field label={t('builder.attachTest')}>
            <Select value={l.assessmentId ?? ''} onChange={(e) => setL({ ...l, assessmentId: e.target.value })}>
              <option value="">—</option>
              {tests.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </Select>
          </Field>
        )}
        {l.type === 'anatomy' && (
          <>
          <Field label={t('builder.model')}>
            <Select value={l.anatomyModel ?? 'knee'} onChange={(e) => setL({ ...l, anatomyModel: e.target.value as ModelId, anatomyFocus: [] })}>
              {MODEL_IDS.map((m) => <option key={m} value={m}>{t(m === 'knee' ? 'anat.knee' : 'anat.foot')}</option>)}
            </Select>
          </Field>
          <Field label={t('builder.anatomyFocus')}>
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
              {ANATOMY_MODELS[l.anatomyModel ?? 'knee'].ids.map((id) => STRUCTURE_BY_ID[id]).map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" className="accent-teal" checked={l.anatomyFocus?.includes(s.id) ?? false} onChange={(e) => setL({ ...l, anatomyFocus: e.target.checked ? [...(l.anatomyFocus ?? []), s.id] : (l.anatomyFocus ?? []).filter((x) => x !== s.id) })} />
                  {s.name}
                </label>
              ))}
            </div>
          </Field>
          </>
        )}
      </div>
    </Dialog>
  );
}

function SettingsTab({ c, editable, guard }: TabProps) {
  const { t } = useT();
  const [f, setF] = useState({ title: c.title, category: c.category, level: c.level, durationMin: c.durationMin, description: c.description, cover: c.cover });
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <CardBody className="max-w-2xl space-y-4">
        <Field label={t('builder.courseTitle')}><Input disabled={!editable} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label={t('builder.category')}><Input disabled={!editable} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
          <Field label={t('courses.level')}>
            <Select disabled={!editable} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Level })}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((l) => <option key={l} value={l}>{t(`level.${l}` as I18nKey)}</option>)}
            </Select>
          </Field>
          <Field label={t('builder.duration')}><Input disabled={!editable} type="number" value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) })} /></Field>
          <Field label={t('builder.cover')}>
            <Select disabled={!editable} value={f.cover} onChange={(e) => setF({ ...f, cover: e.target.value as Course['cover'] })}>
              {(['teal', 'navy', 'cyan', 'slate'] as const).map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('common.description')}><Textarea disabled={!editable} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        {editable && <Button onClick={() => { guard(() => updateCourse(c.id, f)); setSaved(true); setTimeout(() => setSaved(false), 1500); }}>{saved ? t('common.saved') : t('common.save')}</Button>}
      </CardBody>
    </Card>
  );
}

function TestTab({ c, editable, guard }: TabProps) {
  const { t } = useT();
  const d = useDb();
  const tests = d.assessments.filter((a) => a.courseId === c.id);
  const [newTitle, setNewTitle] = useState('');
  const [q, setQ] = useState<(Partial<Question> & { assessmentId: string }) | null>(null);
  return (
    <div className="space-y-4">
      {tests.map((a) => (
        <Card key={a.id}>
          <CardHeader title={a.title} subtitle={c.finalAssessmentId === a.id ? t('builder.finalTest') : undefined} action={editable && c.finalAssessmentId !== a.id ? <Button size="sm" variant="outline" onClick={() => guard(() => updateCourse(c.id, { finalAssessmentId: a.id }))}>{t('builder.makeFinal')}</Button> : undefined} />
          <CardBody>
            <AssessmentSettings a={a} editable={editable} guard={guard} />
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {d.questions.filter((x) => x.assessmentId === a.id).map((x, i) => (
                <li key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="text-navy-500">{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate">{x.prompt}</span>
                  <Badge tone="gray">{t(`qtype.${x.type}` as I18nKey)}</Badge>
                  {editable && <>
                    <Button size="icon" variant="ghost" onClick={() => setQ(x)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => guard(() => deleteQuestion(x.id))} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
                  </>}
                </li>
              ))}
            </ul>
            {editable && <Button className="mt-3" size="sm" variant="outline" onClick={() => setQ({ assessmentId: a.id, type: 'single', points: 1 })} data-testid="add-question"><Plus className="h-4 w-4" /> {t('builder.addQuestion')}</Button>}
          </CardBody>
        </Card>
      ))}
      {editable && (
        <Card className="flex flex-wrap gap-2 p-4">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t('builder.testTitle')} className="max-w-sm" name="testTitle" />
          <Button onClick={() => {
            if (!newTitle.trim()) return;
            guard(() => {
              const a = createAssessment(c.id, { title: newTitle.trim(), passingScore: 70, maxAttempts: 3, timeLimitMin: 0, randomize: false, feedback: 'after' });
              if (!c.finalAssessmentId) updateCourse(c.id, { finalAssessmentId: a.id });
            });
            setNewTitle('');
          }} data-testid="create-test"><Plus className="h-4 w-4" /> {t('builder.createTest')}</Button>
        </Card>
      )}
      {!editable && tests.length === 0 && <EmptyState title={t('tests.empty')} />}
      {q && <QuestionDialog initial={q} onClose={() => setQ(null)} guard={guard} />}
    </div>
  );
}

function AssessmentSettings({ a, editable, guard }: { a: Assessment; editable: boolean; guard: TabProps['guard'] }) {
  const { t } = useT();
  const set = (patch: Partial<Assessment>) => guard(() => updateAssessment(a.id, patch));
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Field label={t('builder.passing')}><Input disabled={!editable} type="number" min={1} max={100} defaultValue={a.passingScore} onBlur={(e) => set({ passingScore: Number(e.target.value) })} /></Field>
      <Field label={t('builder.attempts')}><Input disabled={!editable} type="number" min={0} defaultValue={a.maxAttempts} onBlur={(e) => set({ maxAttempts: Number(e.target.value) })} /></Field>
      <Field label={t('builder.timeLimit')}><Input disabled={!editable} type="number" min={0} defaultValue={a.timeLimitMin} onBlur={(e) => set({ timeLimitMin: Number(e.target.value) })} /></Field>
      <Field label={t('builder.feedback')}>
        <Select disabled={!editable} value={a.feedback} onChange={(e) => set({ feedback: e.target.value as Assessment['feedback'] })}>
          {(['immediate', 'after', 'never'] as const).map((x) => <option key={x} value={x}>{t(`builder.feedback.${x}` as I18nKey)}</option>)}
        </Select>
      </Field>
      <label className="flex items-end gap-2 pb-2.5 text-[13px]"><input type="checkbox" className="accent-teal" disabled={!editable} checked={a.randomize} onChange={(e) => set({ randomize: e.target.checked })} /> {t('builder.randomize')}</label>
    </div>
  );
}

function QuestionDialog({ initial, onClose, guard }: { initial: Partial<Question> & { assessmentId: string }; onClose: () => void; guard: TabProps['guard'] }) {
  const { t } = useT();
  const [q, setQ] = useState<Partial<Question> & { assessmentId: string }>({
    options: [{ id: 'a', text: '', correct: true }, { id: 'b', text: '', correct: false }], pairs: [{ left: '', right: '' }], sequence: ['', ''], ...initial,
  });
  const type = q.type ?? 'single';
  const hasOptions = type === 'single' || type === 'multi' || type === 'identify' || type === 'case';
  const opts = q.options ?? [];
  function save() {
    const clean: Omit<Question, 'id'> & { id?: string } = {
      id: q.id, assessmentId: q.assessmentId, type, prompt: (q.prompt ?? '').trim(), explanation: (q.explanation ?? '').trim(), points: q.points ?? 1,
      caseText: type === 'case' ? q.caseText : undefined, structureId: type === 'identify' ? q.structureId : undefined,
      model: type === 'identify' ? q.model : undefined,
      options: hasOptions ? opts.filter((o) => o.text.trim()) : undefined,
      pairs: type === 'match' ? (q.pairs ?? []).filter((p) => p.left.trim() && p.right.trim()) : undefined,
      sequence: type === 'sequence' ? (q.sequence ?? []).filter((s) => s.trim()) : undefined,
    };
    guard(() => saveQuestion(clean));
    onClose();
  }
  const valid = !!q.prompt?.trim() && (!hasOptions || (opts.filter((o) => o.text.trim()).length >= 2 && opts.some((o) => o.correct && o.text.trim())));
  return (
    <Dialog open onClose={onClose} wide title={t('builder.question')} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button onClick={save} disabled={!valid} data-testid="save-question">{t('common.save')}</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[200px_1fr_100px]">
          <Field label={t('builder.qtype')}>
            <Select value={type} onChange={(e) => setQ({ ...q, type: e.target.value as QuestionType })} name="qtype">
              {Q_TYPES.map((x) => <option key={x} value={x}>{t(`qtype.${x}` as I18nKey)}</option>)}
            </Select>
          </Field>
          <Field label={t('builder.question')}><Input value={q.prompt ?? ''} onChange={(e) => setQ({ ...q, prompt: e.target.value })} name="prompt" /></Field>
          <Field label={t('common.score')}><Input type="number" min={1} value={q.points ?? 1} onChange={(e) => setQ({ ...q, points: Number(e.target.value) })} /></Field>
        </div>
        {type === 'case' && <Field label={t('tests.case')}><Textarea value={q.caseText ?? ''} onChange={(e) => setQ({ ...q, caseText: e.target.value })} /></Field>}
        {type === 'identify' && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t('builder.model')}>
              <Select value={q.model ?? 'knee'} onChange={(e) => setQ({ ...q, model: e.target.value as ModelId, structureId: '' })}>
                {MODEL_IDS.map((m) => <option key={m} value={m}>{t(m === 'knee' ? 'anat.knee' : 'anat.foot')}</option>)}
              </Select>
            </Field>
            <Field label={t('builder.structure')}>
              <Select value={q.structureId ?? ''} onChange={(e) => setQ({ ...q, structureId: e.target.value })}>
                <option value="">—</option>
                {ANATOMY_MODELS[q.model ?? 'knee'].ids.map((id) => <option key={id} value={id}>{STRUCTURE_BY_ID[id].name}</option>)}
              </Select>
            </Field>
          </div>
        )}
        {hasOptions && (
          <div className="space-y-2">
            <div className="text-[13px] font-medium">{t('builder.option')}</div>
            {opts.map((o, i) => (
              <div key={o.id} className="flex items-center gap-2">
                <input type={type === 'multi' ? 'checkbox' : 'radio'} name="correct" className="accent-teal" checked={o.correct} aria-label={t('builder.correct')}
                  onChange={(e) => setQ({ ...q, options: opts.map((x, j) => (type === 'multi' ? (j === i ? { ...x, correct: e.target.checked } : x) : { ...x, correct: j === i })) })} />
                <Input value={o.text} onChange={(e) => setQ({ ...q, options: opts.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} name={`option-${i}`} />
                <Button size="icon" variant="ghost" onClick={() => setQ({ ...q, options: opts.filter((_, j) => j !== i) })} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setQ({ ...q, options: [...opts, { id: String.fromCharCode(97 + opts.length) + Date.now().toString(36).slice(-3), text: '', correct: false }] })}><Plus className="h-4 w-4" /> {t('common.add')}</Button>
          </div>
        )}
        {type === 'match' && (
          <div className="space-y-2">
            {(q.pairs ?? []).map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={p.left} placeholder="A" onChange={(e) => setQ({ ...q, pairs: q.pairs!.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)) })} />
                <Input value={p.right} placeholder="B" onChange={(e) => setQ({ ...q, pairs: q.pairs!.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)) })} />
                <Button size="icon" variant="ghost" onClick={() => setQ({ ...q, pairs: q.pairs!.filter((_, j) => j !== i) })} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setQ({ ...q, pairs: [...(q.pairs ?? []), { left: '', right: '' }] })}><Plus className="h-4 w-4" /> {t('common.add')}</Button>
          </div>
        )}
        {type === 'sequence' && (
          <Field label={t('builder.sequenceHint')}>
            <Textarea value={(q.sequence ?? []).join('\n')} onChange={(e) => setQ({ ...q, sequence: e.target.value.split('\n') })} />
          </Field>
        )}
        <Field label={t('builder.explanation')}><Textarea value={q.explanation ?? ''} onChange={(e) => setQ({ ...q, explanation: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}

function HistoryTab({ c }: { c: Course }) {
  const { t, locale } = useT();
  const d = useDb();
  const rows = d.reviews.filter((r) => r.entityId === c.id).sort((a, b) => b.at - a.at);
  if (!rows.length) return <EmptyState title={t('common.noData')} />;
  return (
    <Card>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="px-5 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[r.from]}>{t(`status.${r.from}` as I18nKey)}</Badge> → <Badge tone={STATUS_TONE[r.to]}>{t(`status.${r.to}` as I18nKey)}</Badge>
              <span className="text-navy-500">{d.users.find((x) => x.id === r.byUserId)?.fullName} · {fmtDateTime(r.at, locale)}</span>
            </div>
            {r.note && <p className="mt-1 text-navy-700">{r.note}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
