import { useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';
import { useFeedback } from '../store/useFeedback';
import { useT } from '../i18n/useT';
import type { QuestionType, SurveyQuestion } from '../types';

const TYPES: QuestionType[] = ['text', 'rating', 'yesno', 'choice'];
const qid = () => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

function StarsPick({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <span className="stars pick">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={`star${n <= value ? ' on' : ''}`} onClick={() => onPick(n)}>★</button>
      ))}
    </span>
  );
}

/** Trainer-side: build the list of questions. */
export function FeedbackBuilder({ courseId }: { courseId: string }) {
  const { t } = useT();
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const updateCourse = useStore((s) => s.updateCourse);
  const questions = course?.feedbackForm ?? [];

  const save = (next: SurveyQuestion[]) => updateCourse(courseId, { feedbackForm: next });
  const add = () => save([...questions, { id: qid(), text: '', type: 'text' }]);
  const patch = (id: string, p: Partial<SurveyQuestion>) => save(questions.map((q) => (q.id === id ? { ...q, ...p } : q)));
  const remove = (id: string) => save(questions.filter((q) => q.id !== id));

  const typeLabel: Record<QuestionType, string> = { text: t('qTypeText'), rating: t('qTypeRating'), yesno: t('qTypeYesno'), choice: t('qTypeChoice') };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ marginTop: 0 }}>📝 {t('feedbackBuilder')}</h2>
      <p className="muted-sm" style={{ marginBottom: 14 }}>{t('feedbackBuilderHint')}</p>

      <div className="q-list">
        {questions.map((q, i) => (
          <div key={q.id} className="q-row">
            <span className="q-n">{i + 1}</span>
            <div className="q-body">
              <input value={q.text} placeholder={t('questionTextPh')} onChange={(e) => patch(q.id, { text: e.target.value })} />
              <div className="q-opts">
                <select value={q.type} onChange={(e) => patch(q.id, { type: e.target.value as QuestionType })}>
                  {TYPES.map((tp) => <option key={tp} value={tp}>{typeLabel[tp]}</option>)}
                </select>
                {q.type === 'choice' && (
                  <input className="q-options" value={(q.options ?? []).join(', ')} placeholder={t('optionsPh')}
                    onChange={(e) => patch(q.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                )}
              </div>
            </div>
            <button className="btn ghost small danger" onClick={() => remove(q.id)}>🗑</button>
          </div>
        ))}
      </div>

      <button className="btn" style={{ marginTop: 12 }} onClick={add}>+ {t('addQuestion')}</button>
    </div>
  );
}

/** Student-side: fill the trainer's form. Trainer-side: see responses. */
export function FeedbackSection({ courseId, isOwner }: { courseId: string; isOwner: boolean }) {
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const form = course?.feedbackForm ?? [];
  if (form.length === 0) return null;
  return isOwner ? <Responses courseId={courseId} questions={form} /> : <Fill courseId={courseId} questions={form} />;
}

function Fill({ courseId, questions }: { courseId: string; questions: SurveyQuestion[] }) {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const submit = useFeedback((s) => s.submit);
  const mine = useFeedback((s) => (user ? s.responses.find((r) => r.courseId === courseId && r.userId === user.id) : undefined));
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>(mine?.answers ?? {});
  const [editing, setEditing] = useState(false);

  if (!user || user.role !== 'student') return null;
  const set = (id: string, v: string | number | boolean) => setAnswers((a) => ({ ...a, [id]: v }));

  if (mine && !editing) {
    return (
      <div className="card feedback-card">
        <h2 style={{ marginTop: 0 }}>📝 {t('feedbackForm')}</h2>
        <div className="review-mine">✅ {t('feedbackThanks')}
          <button className="btn ghost small" style={{ marginLeft: 10 }} onClick={() => setEditing(true)}>{t('reviewEdit')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card feedback-card">
      <h2 style={{ marginTop: 0 }}>📝 {t('feedbackForm')}</h2>
      {questions.map((q) => (
        <div key={q.id} className="survey-field">
          <label>{q.text || '—'}</label>
          {q.type === 'text' && <textarea value={(answers[q.id] as string) ?? ''} onChange={(e) => set(q.id, e.target.value)} />}
          {q.type === 'rating' && <StarsPick value={Number(answers[q.id] ?? 0)} onPick={(n) => set(q.id, n)} />}
          {q.type === 'yesno' && (
            <div className="pick-row">
              <button className={`pick-btn${answers[q.id] === true ? ' on' : ''}`} onClick={() => set(q.id, true)}>{t('qYes')}</button>
              <button className={`pick-btn${answers[q.id] === false ? ' on' : ''}`} onClick={() => set(q.id, false)}>{t('qNo')}</button>
            </div>
          )}
          {q.type === 'choice' && (
            <div className="pick-row">
              {(q.options ?? []).map((o) => (
                <button key={o} className={`pick-btn${answers[q.id] === o ? ' on' : ''}`} onClick={() => set(q.id, o)}>{o}</button>
              ))}
            </div>
          )}
        </div>
      ))}
      <button className="btn primary" onClick={() => { submit({ courseId, userId: user.id, userName: user.name, answers }); setEditing(false); }}>
        {t('feedbackSubmit')}
      </button>
    </div>
  );
}

function Responses({ courseId, questions }: { courseId: string; questions: SurveyQuestion[] }) {
  const { t } = useT();
  const responses = useFeedback((s) => s.responses.filter((r) => r.courseId === courseId));
  const fmt = (v: string | number | boolean | undefined, type: QuestionType) => {
    if (v === undefined || v === '') return '—';
    if (type === 'rating') return '★'.repeat(Number(v));
    if (type === 'yesno') return v === true ? t('qYes') : t('qNo');
    return String(v);
  };

  return (
    <div className="card feedback-card">
      <h2 style={{ marginTop: 0 }}>📝 {t('feedbackResponses')} · {responses.length}</h2>
      {responses.length === 0 ? (
        <p className="placeholder">{t('feedbackNoResp')}</p>
      ) : (
        <div className="fb-responses">
          {responses.map((r) => (
            <div key={r.id} className="fb-response">
              <div className="fb-name">{r.userName}</div>
              {questions.map((q) => (
                <div key={q.id} className="fb-qa"><span className="fb-q">{q.text}</span><span className="fb-a">{fmt(r.answers[q.id], q.type)}</span></div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
